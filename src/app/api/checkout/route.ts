import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { getProductByIdOrSlug } from '@/lib/mockData';

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
}

interface CheckoutRequestBody {
  items: CheckoutItemInput[];
  userId?: string;
  addressId?: string;
  shippingAddress?: ShippingAddressInput;
  idempotencyKey?: string;
}

async function resolveUserAndAddress(
  userId?: string,
  addressId?: string,
  shippingAddressInput?: ShippingAddressInput
) {
  let user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;

  if (!user) {
    user = await prisma.user.upsert({
      where: { email: 'guest@marketplace.local' },
      update: {},
      create: {
        name: 'Guest Customer',
        email: 'guest@marketplace.local',
        role: 'CUSTOMER',
      },
    });
  }

  let address = addressId
    ? await prisma.address.findUnique({ where: { id: addressId } })
    : null;

  if (!address) {
    if (shippingAddressInput && shippingAddressInput.street) {
      address = await prisma.address.create({
        data: {
          userId: user.id,
          fullName: shippingAddressInput.fullName || user.name || 'Valued Customer',
          street: shippingAddressInput.street,
          city: shippingAddressInput.city || 'Standard City',
          state: shippingAddressInput.state || 'Standard State',
          zipCode: shippingAddressInput.zipCode || '00000',
          country: shippingAddressInput.country || 'IN',
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

  return { userId: user.id, addressId: address.id };
}

export async function POST(req: Request) {
  try {
    let body: CheckoutRequestBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request body' },
        { status: 400 }
      );
    }

    const { items, userId, addressId, shippingAddress } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty or items array is missing' },
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
          { error: `Item at index ${i} is missing a valid productId` },
          { status: 400 }
        );
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return NextResponse.json(
          {
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
          { error: `Product not found: ${productId}` },
          { status: 404 }
        );
      }

      let unitPrice = product.basePrice;
      let itemName = product.title;

      if (variantId) {
        const variant = product.variants.find((v: any) => v.id === variantId);
        if (!variant) {
          return NextResponse.json(
            { error: `Variant "${variantId}" not found for product "${product.title}"` },
            { status: 404 }
          );
        }

        // Validate variant inventory stock
        if (variant.stock < quantity) {
          return NextResponse.json(
            {
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
        if (product.variants.length > 0) {
          const totalStock = product.variants.reduce((sum: number, v: any) => sum + v.stock, 0);
          if (totalStock < quantity) {
            return NextResponse.json(
              {
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

      unitPrice = Math.max(0, unitPrice);

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
    let resolvedUserId = userId || 'guest_user';
    let resolvedAddressId = addressId || 'guest_address';

    try {
      const resolved = await resolveUserAndAddress(userId, addressId, shippingAddress);
      resolvedUserId = resolved.userId;
      resolvedAddressId = resolved.addressId;
    } catch (err) {
      console.warn('[CHECKOUT_ADDRESS_FALLBACK] Using fallback guest identity:', err);
    }

    // Compute total order amount from verified values
    const totalAmount = verifiedOrderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Create Order with PENDING status
    let orderId = `ord_${Math.random().toString(36).substring(2, 10)}`;
    try {
      const order = await prisma.order.create({
        data: {
          userId: resolvedUserId,
          addressId: resolvedAddressId,
          status: 'PENDING',
          totalAmount,
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
      orderId = order.id;
    } catch (orderErr) {
      console.warn('[CHECKOUT_ORDER_SIMULATED] Could not save order to DB, proceeding with simulated orderId:', orderId, orderErr);
    }

    // Build Stripe line items using verified prices
    const line_items = verifiedOrderItems.map((item) => ({
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create Stripe Checkout Session with metadata and idempotency
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ['card'],
        line_items,
        mode: 'payment',
        success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
        cancel_url: `${appUrl}/cart?canceled_order_id=${orderId}`,
        metadata: {
          orderId,
          userId: resolvedUserId,
        },
      },
      idempotencyKey ? { idempotencyKey } : undefined
    );

    // Record Stripe session ID on the order if DB is active
    try {
      await prisma.order.update({
        where: { id: orderId },
        data: { stripeSessionId: session.id },
      });
    } catch {
      // Ignored if order was simulated
    }

    return NextResponse.json({
      url: session.url,
      orderId,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('[CHECKOUT_ERROR]', error);
    return NextResponse.json(
      {
        error: 'Internal checkout error',
        message: error?.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
