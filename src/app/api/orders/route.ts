import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const status = searchParams.get('status') || undefined;
    const skip = (page - 1) * limit;

    const currentUser = await getCurrentUser(req);
    const queryEmail = searchParams.get('email');

    // Security Check (DCI-004): Require authentication to view order history
    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required. Please log in to view your order history.',
        },
        { status: 401 }
      );
    }

    // Build filter based on authenticated role
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (currentUser.role !== 'ADMIN') {
      where.userId = currentUser.id;
    } else {
      if (searchParams.get('userId')) {
        where.userId = searchParams.get('userId');
      } else if (queryEmail) {
        where.user = { email: queryEmail.toLowerCase() };
      }
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: {
                  title: true,
                  images: true,
                },
              },
              variant: {
                select: {
                  name: true,
                },
              },
            },
          },
          shippingAddress: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      orders: orders.map((o) => ({
        id: o.id,
        status: o.status,
        totalAmount: o.totalAmount,
        shippingAmount: o.shippingAmount,
        createdAt: o.createdAt,
        itemCount: o.items.reduce((acc, i) => acc + i.quantity, 0),
        items: o.items.map((i) => ({
          title: i.product?.title || 'Product',
          variantName: i.variant?.name || null,
          image: i.product?.images?.[0] || null,
          price: i.price,
          quantity: i.quantity,
        })),
        shippingAddress: o.shippingAddress
          ? {
              city: o.shippingAddress.city,
              state: o.shippingAddress.state,
              country: o.shippingAddress.country,
            }
          : null,
      })),
    });
  } catch (error: any) {
    console.error('[GET_ORDERS_LIST_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve order history',
        message: error?.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
