import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('[STRIPE_WEBHOOK] Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[STRIPE_WEBHOOK] STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json(
      { error: 'Webhook secret is not configured on server' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('[STRIPE_WEBHOOK_VERIFY_ERROR]', err?.message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err?.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        // Find corresponding Order record
        const order = orderId
          ? await prisma.order.findUnique({
              where: { id: orderId },
              include: { items: true },
            })
          : await prisma.order.findUnique({
              where: { stripeSessionId: session.id },
              include: { items: true },
            });

        if (!order) {
          console.warn(
            `[STRIPE_WEBHOOK] No order found for session ${session.id} (metadata orderId: ${orderId})`
          );
          // Return 200 to acknowledge Stripe and avoid continuous retries
          return NextResponse.json({ received: true, warning: 'Order not found' });
        }

        // Idempotency check: avoid double processing if event is retried
        if (order.status === 'PAID') {
          console.log(`[STRIPE_WEBHOOK] Order ${order.id} is already PAID. Skipping.`);
          return NextResponse.json({ received: true, status: 'already_processed' });
        }

        // Atomically update order status and decrement inventory stock
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'PAID',
              stripeSessionId: session.id,
            },
          });

          for (const item of order.items) {
            if (item.variantId) {
              // Concurrency Guard: Atomically decrement only if stock is >= requested quantity
              const updateResult = await tx.variant.updateMany({
                where: {
                  id: item.variantId,
                  stock: { gte: item.quantity },
                },
                data: {
                  stock: {
                    decrement: item.quantity,
                  },
                },
              });

              if (updateResult.count === 0) {
                console.warn(
                  `[INVENTORY_RACE_GUARD] Variant ${item.variantId} was low on stock for quantity ${item.quantity}. Setting stock to 0 to prevent negative inventory.`
                );
                await tx.variant.update({
                  where: { id: item.variantId },
                  data: { stock: 0 },
                });
              }
            }
          }
        });

        console.log(
          `[STRIPE_WEBHOOK] Successfully marked Order ${order.id} as PAID and decremented inventory stock`
        );
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        const order = orderId
          ? await prisma.order.findUnique({ where: { id: orderId } })
          : await prisma.order.findUnique({ where: { stripeSessionId: session.id } });

        if (order && order.status === 'PENDING') {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'CANCELLED' },
          });
          console.log(`[STRIPE_WEBHOOK] Marked expired order ${order.id} as CANCELLED`);
        }
        break;
      }

      default:
        // Acknowledge other unhandled event types gracefully
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[STRIPE_WEBHOOK_HANDLER_ERROR]', error);
    return NextResponse.json(
      {
        error: 'Failed to process webhook event',
        message: error?.message || 'Unknown internal error',
      },
      { status: 500 }
    );
  }
}
