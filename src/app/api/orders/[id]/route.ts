import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Order ID parameter is required' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                images: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        shippingAddress: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: `Order not found with ID: ${id}` },
        { status: 404 }
      );
    }

    // Security check (DCI-004): Prevent IDOR and unauthenticated PII leakage
    const currentUser = await getCurrentUser(req);
    const { searchParams } = new URL(req.url);
    const requestSessionId = searchParams.get('session_id');
    const requestEmail = searchParams.get('email');

    if (currentUser) {
      if (currentUser.role !== 'ADMIN' && order.userId !== currentUser.id) {
        return NextResponse.json(
          { success: false, error: 'Forbidden. You do not have access to this order.' },
          { status: 403 }
        );
      }
    } else {
      // Unauthenticated guest verification: Must provide matching Stripe session ID or customer email
      const isSessionVerified =
        requestSessionId && order.stripeSessionId && requestSessionId === order.stripeSessionId;
      const isEmailVerified =
        requestEmail && order.user?.email && requestEmail.toLowerCase() === order.user.email.toLowerCase();

      if (!isSessionVerified && !isEmailVerified) {
        return NextResponse.json(
          {
            success: false,
            error: 'Authentication or verification token (session_id or email) is required to view this order.',
          },
          { status: 401 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        shippingAmount: order.shippingAmount,
        taxAmount: order.taxAmount,
        stripeSessionId: order.stripeSessionId,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        customer: {
          name: order.user?.name || 'Customer',
          email: order.user?.email,
        },
        shippingAddress: order.shippingAddress
          ? {
              fullName: order.shippingAddress.fullName,
              street: order.shippingAddress.street,
              city: order.shippingAddress.city,
              state: order.shippingAddress.state,
              zipCode: order.shippingAddress.zipCode,
              country: order.shippingAddress.country,
            }
          : null,
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          productTitle: item.product?.title || 'Product',
          variantName: item.variant?.name || null,
          image: item.product?.images?.[0] || null,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        })),
      },
    });
  } catch (error: any) {
    console.error('[GET_ORDER_BY_ID_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve order details',
        message: error?.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
