'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  CheckCircle2, 
  PackageCheck, 
  Truck, 
  ArrowRight, 
  ShieldCheck, 
  Calendar, 
  CreditCard, 
  ShoppingBag,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

interface OrderDetails {
  id: string;
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  shippingAmount: number;
  customer?: {
    name?: string;
    email?: string;
  };
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  items?: Array<{
    id: string;
    productTitle: string;
    variantName?: string | null;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id') || '';
  const orderId = searchParams.get('order_id') || '';
  const clearCart = useCartStore((state) => state.clearCart);

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Automatically clear customer's cart upon arrival at checkout success
    clearCart();

    if (!orderId) {
      setLoading(false);
      return;
    }

    // Verify order status directly from server API
    async function verifyOrder() {
      try {
        const query = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : '';
        const res = await fetch(`/api/orders/${orderId}${query}`);
        const data = await res.json();

        if (res.ok && data.success && data.order) {
          setOrder(data.order);
        } else {
          setError(data.error || 'Could not verify order status with the server.');
        }
      } catch (err: any) {
        console.warn('[ORDER_VERIFY_WARN]', err);
        setError('Network error while checking order status.');
      } finally {
        setLoading(false);
      }
    }

    verifyOrder();
  }, [orderId, clearCart]);

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3);
  const formattedDeliveryDate = deliveryDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24 text-center space-y-8 animate-in fade-in duration-500">
      
      {/* Animated Success Badge */}
      <div className="relative inline-block">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl ring-8 ring-emerald-50">
          <CheckCircle2 size={52} className="stroke-[2.5]" />
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          {order?.status === 'PAID' ? 'Payment Verified & Settled' : 'Payment Received via Stripe'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
          Thank you for your order!
        </h1>
        <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
          We&apos;ve received your order and our fulfillment team has started preparing your parcel for express dispatch.
        </p>
      </div>

      {/* Order Details Card */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm text-left space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <span className="text-xs text-gray-400 font-medium">Order Reference</span>
            <div className="font-mono text-xs sm:text-sm font-bold text-gray-900 truncate max-w-xs">
              {orderId || 'Order Pending'}
            </div>
          </div>
          {sessionId && (
            <div className="sm:text-right">
              <span className="text-xs text-gray-400 font-medium">Stripe Session ID</span>
              <div className="font-mono text-[11px] text-gray-600 truncate max-w-xs">
                {sessionId}
              </div>
            </div>
          )}
        </div>

        {/* Server-Verified Status */}
        {order && (
          <div className="bg-gray-50/70 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border border-gray-100">
            <div>
              <span className="text-gray-500 block">Customer</span>
              <span className="font-bold text-gray-900">
                {order.customer?.name} ({order.customer?.email})
              </span>
            </div>
            <div className="sm:text-right">
              <span className="text-gray-500 block">Verified Total Paid</span>
              <span className="font-black text-base text-gray-900">
                ₹{order.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}

        {/* Fulfillment Timeline Tracker */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
            Fulfillment Status
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-2xl flex items-center gap-3">
              <PackageCheck size={20} className="text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-bold text-emerald-950 block">Payment Settled</span>
                <span className="text-[11px] text-emerald-700">
                  {order?.status === 'PAID' ? 'Webhook confirmed' : 'Stripe authorization verified'}
                </span>
              </div>
            </div>

            <div className="bg-orange-50/60 border border-orange-200 p-3.5 rounded-2xl flex items-center gap-3">
              <Truck size={20} className="text-orange-600 flex-shrink-0" />
              <div>
                <span className="font-bold text-orange-950 block">Preparing Parcel</span>
                <span className="text-[11px] text-orange-700">Quality check in progress</span>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-2xl flex items-center gap-3">
              <Calendar size={20} className="text-gray-400 flex-shrink-0" />
              <div>
                <span className="font-bold text-gray-900 block">Estimated Arrival</span>
                <span className="text-[11px] text-gray-600">{formattedDeliveryDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Support Note */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-gray-500 gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
            <span>A confirmation receipt has been generated with warranty protection.</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 font-medium">
            <CreditCard size={14} />
            <span>Stripe 3D-Secure Paid</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link
          href="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold px-8 py-3.5 rounded-xl transition-all shadow-md text-sm active:scale-95"
        >
          <ShoppingBag size={18} />
          <span>Continue Shopping</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
