import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/cart
 * Retrieves the persistent server-side cart for authenticated users
 */
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json({
        success: true,
        items: [],
        isGuest: true,
      });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                basePrice: true,
                images: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                priceOffset: true,
                stock: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return NextResponse.json({
        success: true,
        items: [],
        isGuest: false,
      });
    }

    return NextResponse.json({
      success: true,
      cartId: cart.id,
      items: cart.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
        title: i.product.title,
        price: i.product.basePrice + (i.variant?.priceOffset || 0),
        images: i.product.images,
        variantName: i.variant?.name || null,
      })),
      isGuest: false,
    });
  } catch (error: any) {
    console.error('[GET_CART_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve server cart', message: error?.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart
 * Synchronizes client items into the persistent database cart
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Cart retained in client localStorage for guest session',
        isGuest: true,
      });
    }

    let body: {
      items: Array<{
        productId: string;
        variantId?: string;
        quantity: number;
      }>;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body' },
        { status: 400 }
      );
    }

    const { items } = body;
    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Items array is required' },
        { status: 400 }
      );
    }

    // Upsert user's cart record
    const cart = await prisma.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    // Synchronize items inside a transaction
    await prisma.$transaction(async (tx) => {
      // Clear previous cart items to sync client state cleanly
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      if (items.length > 0) {
        for (const item of items) {
          if (item.productId && item.quantity > 0) {
            await tx.cartItem.create({
              data: {
                cartId: cart.id,
                productId: item.productId,
                variantId: item.variantId || null,
                quantity: item.quantity,
              },
            });
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Cart synchronized with database successfully',
      itemCount: items.length,
    });
  } catch (error: any) {
    console.error('[POST_SYNC_CART_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync cart to database', message: error?.message },
      { status: 500 }
    );
  }
}
