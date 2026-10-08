'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  Tag, 
  Lock,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

const FREE_SHIPPING_THRESHOLD = 499;

export default function CartPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const getTotalItems = useCartStore((state) => state.getTotalItems);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }

  const rawSubtotal = getTotalPrice();
  const shippingFee = rawSubtotal >= FREE_SHIPPING_THRESHOLD || rawSubtotal === 0 ? 0 : 99;
  const progressToFreeShipping = Math.min(100, Math.round((rawSubtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const amountNeededForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - rawSubtotal);
  const finalTotal = Math.max(0, rawSubtotal - discountAmount + shippingFee);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (code === 'NEXMART500') {
      if (rawSubtotal >= 4999) {
        setDiscountAmount(500);
        setCouponMessage({ type: 'success', text: 'Coupon NEXMART500 applied: ₹500 off!' });
      } else {
        setDiscountAmount(0);
        setCouponMessage({ type: 'error', text: 'Minimum order amount for NEXMART500 is ₹4,999.' });
      }
    } else {
      setDiscountAmount(0);
      setCouponMessage({ type: 'error', text: 'Invalid coupon code. Try NEXMART500.' });
    }
  };

  const handleCheckout = async () => {
    try {
      setIsCheckingOut(true);
      setCheckoutError(null);

      // Build payload matching /api/checkout requirements
      const checkoutItems = items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId || undefined,
        quantity: item.quantity,
      }));

      // Generate idempotency key for network safety
      const clientKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'idempotency-key': clientKey,
        },
        body: JSON.stringify({
          items: checkoutItems,
          couponCode: couponMessage?.type === 'success' ? couponCode.trim().toUpperCase() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.code === 'OUT_OF_STOCK' && data?.availableStock !== undefined) {
          throw new Error(
            `${data.error} (Only ${data.availableStock} remaining). Please reduce your quantity.`
          );
        }
        throw new Error(data?.error || data?.message || 'Checkout failed. Please try again.');
      }

      if (data?.url) {
        // Redirect customer to Stripe hosted checkout page
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received from payment service.');
      }
    } catch (err: any) {
      console.error('[CHECKOUT_CLIENT_ERROR]', err);
      setCheckoutError(err.message || 'An unexpected error occurred during checkout.');
      setIsCheckingOut(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <ShoppingCart size={36} />
        </div>
        <h1 className="text-2xl font-black text-gray-900">Your Shopping Cart is Empty</h1>
        <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
          Looks like you haven&apos;t added any items yet. Explore our curated selection of flagship electronics, apparel, and athletic gear.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all shadow-md text-sm active:scale-95"
        >
          <ArrowLeft size={16} />
          <span>Start Shopping</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 lg:py-12 w-full">
      {/* Page Title & Breadcrumb */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Shopping Cart</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Review your {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'} before proceeding to Stripe Checkout
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-gray-400 hover:text-red-600 flex items-center gap-1 transition-colors"
        >
          <Trash2 size={14} /> Clear Cart
        </button>
      </div>

      {/* Free Shipping Progress Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-8 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="flex items-center gap-1.5 text-gray-700">
            <Truck size={16} className="text-orange-500" />
            {amountNeededForFreeShipping === 0 ? (
              <span className="text-emerald-600 font-bold">🎉 Congratulations! You qualified for Free Express Delivery</span>
            ) : (
              <span>
                Add <strong className="text-orange-600">₹{amountNeededForFreeShipping.toLocaleString('en-IN')}</strong> more for Free Delivery
              </span>
            )}
          </span>
          <span className="text-gray-400">{progressToFreeShipping}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-orange-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressToFreeShipping}%` }}
          />
        </div>
      </div>

      {/* Grid Layout: Items on Left, Order Summary on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-200 p-4 sm:p-6 shadow-sm space-y-6">
          <div className="divide-y divide-gray-100">
            {items.map((item) => {
              const itemTotal = item.price * item.quantity;
              return (
                <div key={item.id} className="py-6 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                  
                  {/* Thumbnail */}
                  <div className="w-24 h-24 bg-gray-50 rounded-2xl border border-gray-100 p-2 flex items-center justify-center flex-shrink-0">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-grow space-y-1">
                    <Link
                      href={`/products/${item.productId}`}
                      className="font-bold text-sm sm:text-base text-gray-900 hover:text-orange-600 transition-colors line-clamp-2"
                    >
                      {item.product.title}
                    </Link>

                    {item.variantName && (
                      <div className="inline-block px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                        Variant: {item.variantName}
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Unit Price: <span className="font-semibold text-gray-800">₹{item.price.toLocaleString('en-IN')}</span>
                    </div>

                    {/* Quantity Controls & Remove */}
                    <div className="flex items-center gap-4 pt-3">
                      <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-gray-50">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-200 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="px-3.5 py-1.5 text-xs font-bold text-gray-900 bg-white min-w-[32px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-200 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-red-600 text-xs flex items-center gap-1 transition-colors"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>

                  {/* Item Subtotal */}
                  <div className="text-right sm:self-center flex sm:flex-col justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-gray-100">
                    <span className="sm:hidden text-xs text-gray-500">Subtotal:</span>
                    <span className="text-base font-black text-gray-900">
                      ₹{itemTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <Link
              href="/"
              className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Continue Shopping
            </Link>
          </div>
        </div>

        {/* Right Column: Order Summary Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-black text-gray-900 tracking-tight pb-3 border-b border-gray-100">
              Order Summary
            </h2>

            {/* Error Banner if Checkout Failed */}
            {checkoutError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium space-y-1 animate-in fade-in">
                <span className="font-bold block">Checkout Notice</span>
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Subtotal Calculations */}
            <div className="space-y-3 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Items Subtotal ({getTotalItems()} items):</span>
                <span className="font-bold text-gray-900">₹{rawSubtotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between">
                <span>Estimated Shipping:</span>
                {shippingFee === 0 ? (
                  <span className="font-bold text-emerald-600">FREE</span>
                ) : (
                  <span className="font-bold text-gray-900">₹{shippingFee}</span>
                )}
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Promo Discount:</span>
                  <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-[11px] text-gray-400">
                <span>Taxes:</span>
                <span>Inclusive of all GST</span>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Promo Code Form */}
            <form onSubmit={handleApplyCoupon} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Promo code (NEXMART500)"
                  className="flex-grow px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Apply
                </button>
              </div>

              {couponMessage && (
                <div
                  className={`text-[11px] font-medium ${
                    couponMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {couponMessage.text}
                </div>
              )}
            </form>

            <hr className="border-gray-100" />

            {/* Grand Total */}
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-gray-900">Total Payable:</span>
              <div className="text-right">
                <span className="text-2xl font-black text-gray-900">
                  ₹{finalTotal.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-gray-400 block">Stripe 256-bit Encrypted</span>
              </div>
            </div>

            {/* Checkout Action CTA */}
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full bg-orange-500 hover:bg-orange-600 text-slate-950 font-black py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-95 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isCheckingOut ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
                  <span>Connecting to Stripe...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Proceed to Stripe Checkout</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Trust Assurances */}
            <div className="pt-2 border-t border-gray-100 space-y-2 text-[11px] text-gray-400">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-600 flex-shrink-0" />
                <span>Encrypted checkout processed directly on Stripe</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-orange-500 flex-shrink-0" />
                <span>Instant order confirmation and shipment tracking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
