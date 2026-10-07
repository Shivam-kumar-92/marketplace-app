import React from 'react';
import Link from 'next/link';
import { Truck, ShieldCheck, RefreshCw, Headphones, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-slate-950 text-gray-400 border-t border-slate-800 mt-auto">
      {/* Assurances Banner */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 py-8 px-4">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
              <Truck size={24} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Free Express Delivery</h4>
              <p className="text-xs text-gray-400">On all prepaid orders above ₹499</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">100% Secure Checkout</h4>
              <p className="text-xs text-gray-400">Encrypted via Stripe Payments</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
              <RefreshCw size={24} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Easy 7-Day Returns</h4>
              <p className="text-xs text-gray-400">No questions asked replacement</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
              <Headphones size={24} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">24/7 Dedicated Support</h4>
              <p className="text-xs text-gray-400">Expert assistance anytime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-[1400px] mx-auto py-12 px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
        <div>
          <h3 className="text-white font-bold text-sm mb-3">NexMart</h3>
          <p className="text-gray-400 leading-relaxed mb-4">
            India&apos;s premier destination for curated flagship technology, designer apparel, and performance athletic gear.
          </p>
          <div className="text-xs text-gray-500">
            Powered by Next.js 16, React 19 & Stripe.
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-3">Popular Categories</h4>
          <ul className="space-y-2">
            <li><Link href="/?cat=cat-electronics" className="hover:text-white transition-colors">Wireless Audio & Smartwatches</Link></li>
            <li><Link href="/?cat=cat-fashion" className="hover:text-white transition-colors">Heavyweight French Terry Apparel</Link></li>
            <li><Link href="/?cat=cat-sports" className="hover:text-white transition-colors">Professional Badminton Rackets</Link></li>
            <li><Link href="/?cat=cat-home" className="hover:text-white transition-colors">Touchscreen Espresso Machines</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-3">Customer Service</h4>
          <ul className="space-y-2">
            <li><Link href="/cart" className="hover:text-white transition-colors">View Cart & Shipping Estimator</Link></li>
            <li><Link href="/#" className="hover:text-white transition-colors">Order Tracking</Link></li>
            <li><Link href="/#" className="hover:text-white transition-colors">Return Policies & Warranty</Link></li>
            <li><Link href="/#" className="hover:text-white transition-colors">Help Center & FAQ</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-3">Trust & Payments</h4>
          <p className="mb-3 leading-relaxed">
            All credit card transactions are processed securely through Stripe with 256-bit encryption.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
            <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">UPI</span>
            <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">Cards</span>
            <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">NetBanking</span>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-slate-900 py-6 text-center text-xs text-gray-500">
        <div className="max-w-[1400px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} NexMart Marketplace, Inc. All rights reserved.</span>
          <span className="flex items-center gap-1">
            Engineered with <Heart size={12} className="text-red-500 fill-red-500" /> for supreme performance.
          </span>
        </div>
      </div>
    </footer>
  );
}
