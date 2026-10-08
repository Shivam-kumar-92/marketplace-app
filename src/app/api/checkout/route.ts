import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { getProductByIdOrSlug } from '@/lib/mockData';
import { getCurrentUser, resolveCustomerAccount } from '@/lib/auth';
import { calculateOrderFinancials, roundCurrency } from '@/lib/promotions';
import { logger, getRequestId } from '@/lib/logger';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

interface CheckoutItemInput {
  productId?: string;
  variantId?: string;
  id?: string;
  quantity: number;
  product?: {
    id?: string;
  };
}

interface ShippingAddressInput {
  fullName?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  email?: string;
}

interface CheckoutRequestBody {
  items: CheckoutItemInput[];
  userId?: string;
  customerEmail?: string;
  customerName?: string;
  addressId?: string;
  shippingAddress?: ShippingAddressInput;
  couponCode?: string;
  idempotencyKey?: string;
}

async function resolveUserAndAddress(
  req: Request,
  body: CheckoutRequestBody
) {
  // 1. Resolve authentic user via session/cookies/token or fallback customer account
  const authUser = await getCurrentUser(req);
  let user;

  if (authUser) {
    user = await prisma.user.findUnique({ where: { id: authUser.id } });
  }

  if (!user) {
    user = await resolveCustomerAccount({
      userId: body.userId,
      email: body.customerEmail || body.shippingAddress?.email,
      name: body.customerName || body.shippingAddress?.fullName,
    });
  }

  // 2. Resolve or create delivery address
  let address = body.addressId
    ? await prisma.address.findUnique({ where: { id: body.addressId } })
    : null;

  if (!address) {
    const s = body.shippingAddress;
    if (s && s.street) {
      address = await prisma.address.create({
        data: {
          userId: user.id,
          fullName: s.fullName || user.name || 'Valued Customer',
          street: s.street,
          city: s.city || 'Standard City',
          state: s.state || 'Standard State',
          zipCode: s.zipCode || '00000',
          country: s.country || 'IN',
        },
      });
    } else {
      address = await prisma.address.findFirst({
        where: { userId: user.id },
      });

      if (!address) {
        address = await prisma.address.create({
          data: {
            userId: user.id,
            fullName: user.name || 'Guest Customer',
            street: 'Standard Delivery',
            city: 'Online',
            state: 'Online',
            zipCode: '00000',
            country: 'IN',
          },
        });
      }
    }
  }

  return { user, address };
}

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const clientIp = getClientIp(req);

  // Rate Limiting (Card-Testing & Fraud Guard): Max 10 checkout attempts per IP per minute
  const rateLimitResult = checkRateLimit(`checkout_${clientIp}`, {
    windowMs: 60000,
    maxRequests: 10,
  });

  if (!rateLimitResult.allowed) {
    logger.warn('Rate limit exceeded on checkout endpoint', {
      endpoint: '/api/checkout',
      clientIp,
      requestId,
    });
    return NextResponse.json(
      {
        success: false,
        error: `Too many checkout attempts. Please wait ${rateLimitResult.retryAfterSeconds} seconds before trying again.`,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitResult.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.retryAfterSeconds),
          'x-request-id': requestId,
        },
      }
    );
  }

  try {
    let body: CheckoutRequestBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body' },
        { status: 400 }
      );
    }

    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty or items array is missing' },
        { status: 400 }
      );
    }

    // Extract idempotency key from headers or request body
    const idempotencyKey =
      req.headers.get('idempotency-key') ||
      req.headers.get('x-idempotency-key') ||
      body.idempotencyKey ||
      undefined;

    // Validate each item and calculate verified prices
    const verifiedOrderItems: Array<{
      productId: string;
      variantId: string | null;
      title: string;
      image: string | null;
      price: number;
      quantity: number;
    }> = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const productId = item.productId || item.product?.id || item.id;
      const variantId = item.variantId || null;
      const quantity = item.quantity;

      if (!productId || typeof productId !== 'string') {
        return NextResponse.json(
          { success: false, error: `Item at index ${i} is missing a valid productId` },
          { status: 400 }
        );
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Item at index ${i} (productId: ${productId}) has an invalid quantity: ${quantity}. Quantity must be a positive integer.`,
          },
          { status: 400 }
        );
      }

      // 1. Query database for ground truth
      let product: any = null;
      try {
        product = await prisma.product.findUnique({
          where: { id: productId },
          include: { variants: true },
        });
      } catch (dbErr) {
        console.warn(`[CHECKOUT_DB_WARN] Database query failed:`, dbErr);
      }

      // 2. Fallback to mock catalog if not in database
      if (!product) {
        const mock = getProductByIdOrSlug(productId);
        if (mock) {
          product = {
            id: mock.id,
            title: mock.title,
            basePrice: mock.basePrice,
            images: mock.images,
            variants: mock.variants.map((v) => ({
              id: v.id,
              name: v.name,
              priceOffset: v.priceOffset,
              stock: v.stock,
            })),
          };
        }
      }

      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product not found: ${productId}` },
          { status: 404 }
        );
      }

      let unitPrice = product.basePrice;
      let itemName = product.title;

      if (variantId) {
        const variant = product.variants.find((v: any) => v.id === variantId);
        if (!variant) {
          return NextResponse.json(
            { success: false, error: `Variant "${variantId}" not found for product "${product.title}"` },
            { status: 404 }
          );
        }

        // Validate variant inventory stock
        if (variant.stock < quantity) {
          return NextResponse.json(
            {
              success: false,
              error: `Insufficient stock for "${product.title} (${variant.name})". Available: ${variant.stock}, Requested: ${quantity}`,
              code: 'OUT_OF_STOCK',
              productId: product.id,
              variantId: variant.id,
              availableStock: variant.stock,
              requestedQuantity: quantity,
            },
            { status: 409 }
          );
        }

        unitPrice = product.basePrice + variant.priceOffset;
        itemName = `${product.title} - ${variant.name}`;
      } else {
        // If product has variants, check total variant inventory
        if (product.variants && product.variants.length > 0) {
          const totalStock = product.variants.reduce((sum: number, v: any) => sum + v.stock, 0);
          if (totalStock < quantity) {
            return NextResponse.json(
              {
                success: false,
                error: `Insufficient stock for "${product.title}". Total available: ${totalStock}, Requested: ${quantity}`,
                code: 'OUT_OF_STOCK',
                productId: product.id,
                availableStock: totalStock,
                requestedQuantity: quantity,
              },
              { status: 409 }
            );
          }
        }
      }

      unitPrice = roundCurrency(Math.max(0, unitPrice));

      verifiedOrderItems.push({
        productId: product.id,
        variantId,
        title: itemName,
        image: product.images && product.images.length > 0 ? product.images[0] : null,
        price: unitPrice,
        quantity,
      });
    }

    // Resolve user and address records ensuring database integrity
    const { user, address } = await resolveUserAndAddress(req, body);

    // Compute verified items subtotal
    const subtotal = roundCurrency(
      verifiedOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    );

    // Server-Side Financials & Promotion Validation (Area B Fix)
    const financials = calculateOrderFinancials(subtotal, body.couponCode);

    if (financials.error && body.couponCode) {
      return NextResponse.json(
        {
          success: false,
          error: financials.error,
          code: 'INVALID_COUPON',
        },
        { status: 400 }
      );
    }

    // FAIL-CLOSED Order Persistence (Area A Fix)
    // We strictly refuse to initiate payment if the database cannot record the order.
    let order;
    try {
      order = await prisma.order.create({
        data: {
          userId: user.id,
          addressId: address.id,
          status: 'PENDING',
          totalAmount: financials.totalAmount,
          shippingAmount: financials.shippingAmount,
          taxAmount: 0,
          items: {
            create: verifiedOrderItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });
    } catch (orderErr: any) {
      console.error('[CHECKOUT_ORDER_PERSIST_ERROR] Order insertion failed:', orderErr);
      return NextResponse.json(
        {
          success: false,
          error: 'Order could not be saved to database. Checkout session aborted to protect payment integrity.',
          code: 'ORDER_PERSIST_FAILED',
          message: orderErr?.message || 'Database write failed',
        },
        { status: 500 }
      );
    }

    // Build Stripe line items using verified prices
    const line_items: any[] = verifiedOrderItems.map((item) => ({
      price_data: {
        currency: 'inr',
        product_data: {
          name: item.title,
          images: item.image ? [item.image] : [],
          metadata: {
            productId: item.productId,
            variantId: item.variantId || '',
          },
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // Add Shipping Fee Line Item if applicable
    if (financials.shippingAmount > 0) {
      line_items.push({
        price_data: {
          currency: 'inr',
          product_data: {
            name: 'Standard Delivery Shipping Fee',
          },
          unit_amount: Math.round(financials.shippingAmount * 100),
        },
        quantity: 1,
      });
    }

    // Apply Coupon Discount via dynamic Stripe Coupon
    let discounts: any[] | undefined = undefined;
    if (financials.discountAmount > 0) {
      try {
        const stripeCoupon = await stripe.coupons.create({
          amount_off: Math.round(financials.discountAmount * 100),
          currency: 'inr',
          duration: 'once',
          name: financials.appliedCoupon?.code || 'Promotional Discount',
        });
        discounts = [{ coupon: stripeCoupon.id }];
      } catch (couponErr) {
        console.warn('[STRIPE_COUPON_WARN] Failed to create Stripe discount coupon:', couponErr);
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create Stripe Checkout Session with verified metadata and idempotency
    // DCI-003: Enforce compensating rollback if Stripe API rejects session creation
    let session;
    try {
      session = await stripe.checkout.sessions.create(
        {
          payment_method_types: ['card'],
          line_items,
          discounts,
          mode: 'payment',
          success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
          cancel_url: `${appUrl}/cart?canceled_order_id=${order.id}`,
          metadata: {
            orderId: order.id,
            userId: user.id,
            couponCode: body.couponCode || '',
            requestId,
          },
        },
        idempotencyKey ? { idempotencyKey } : undefined
      );
    } catch (stripeErr: any) {
      console.error('[CHECKOUT_STRIPE_ERROR] Stripe session creation failed. Executing compensation rollback on order:', stripeErr);
      try {
        await prisma.order.delete({ where: { id: order.id } });
      } catch (rollbackErr) {
        console.warn('[ORDER_ROLLBACK_WARN] Could not delete order during rollback, marking CANCELLED:', rollbackErr);
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'CANCELLED' },
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Payment provider session could not be established. Order rolled back.',
          code: 'PAYMENT_SESSION_FAILED',
          message: stripeErr?.message || 'Stripe API error',
        },
        { status: 502 }
      );
    }

    // Atomically link Stripe session ID to the order
    try {
      await prisma.order.update({
        where: { id: order.id },
        data: { stripeSessionId: session.id },
      });
    } catch (updateErr) {
      console.warn('[CHECKOUT_ORDER_SESSION_UPDATE_WARN]', updateErr);
    }

    return NextResponse.json({
      success: true,
      url: session.url,
      orderId: order.id,
      sessionId: session.id,
      financials: {
        subtotal: financials.subtotal,
        discountAmount: financials.discountAmount,
        shippingAmount: financials.shippingAmount,
        totalAmount: financials.totalAmount,
        appliedCoupon: financials.appliedCoupon?.code || null,
      },
    });
  } catch (error: any) {
    console.error('[CHECKOUT_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal checkout error',
        message: error?.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
