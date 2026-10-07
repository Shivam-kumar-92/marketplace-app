'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  ShoppingCart, 
  Menu, 
  MapPin, 
  ChevronDown,
  X,
  Package,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

export default function Header() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isMounted, setIsMounted] = useState(false);

  const totalItems = useCartStore((state) => state.getTotalItems());

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}&cat=${selectedCategory}`);
    } else {
      router.push('/');
    }
  };

  return (
    <header className="w-full bg-slate-900 text-white sticky top-0 z-50 shadow-md">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs py-1 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles size={14} className="animate-pulse" />
        <span>Festive Sale Live: Flat ₹500 off on orders above ₹4,999 with code <strong>NEXMART500</strong></span>
        <ShieldCheck size={14} className="ml-2 hidden sm:inline" />
        <span className="hidden sm:inline">100% Buyer Protection Guaranteed</span>
      </div>

      {/* Main Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 max-w-[1600px] mx-auto gap-4">
        
        {/* Left Section: Logo & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button 
            className="md:hidden p-1.5 hover:bg-slate-800 rounded text-gray-300 hover:text-white transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <Link href="/" className="flex items-center gap-2 py-1 px-2 rounded hover:ring-1 hover:ring-white/20 transition-all">
            <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
              Nex<span className="text-orange-500">Mart</span>
            </span>
          </Link>
          
          <div className="hidden lg:flex flex-col items-start px-2 py-1 rounded hover:ring-1 hover:ring-white/20 cursor-pointer">
            <span className="text-[11px] text-gray-400">Deliver to India</span>
            <div className="flex items-center gap-1 font-bold text-xs text-white">
              <MapPin size={13} className="text-orange-400" />
              <span>Standard Fast Pincode</span>
            </div>
          </div>
        </div>

        {/* Center: Search Bar with Category Filter */}
        <form onSubmit={handleSearch} className="flex-grow hidden sm:flex items-center max-w-3xl">
          <div className="flex w-full h-10 rounded-lg overflow-hidden bg-white ring-1 ring-gray-300 focus-within:ring-2 focus-within:ring-orange-500 transition-all">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-100 text-gray-700 text-xs px-3 border-r border-gray-300 focus:outline-none cursor-pointer hover:bg-gray-200 transition-colors font-medium"
            >
              <option value="all">All Categories</option>
              <option value="cat-electronics">Electronics</option>
              <option value="cat-fashion">Fashion</option>
              <option value="cat-home">Home & Kitchen</option>
              <option value="cat-sports">Sports & Fitness</option>
            </select>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search flagship electronics, premium streetwear, sports gear..." 
              className="flex-grow px-3.5 text-sm text-gray-900 focus:outline-none placeholder:text-gray-400"
            />
            <button 
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 transition-colors px-5 flex items-center justify-center text-slate-950 font-semibold"
              aria-label="Search"
            >
              <Search size={18} />
            </button>
          </div>
        </form>

        {/* Right Section: Quick Links & Cart Badge */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Account */}
          <Link href="/#" className="hidden md:flex flex-col items-start px-2 py-1 rounded hover:ring-1 hover:ring-white/20 transition-all">
            <span className="text-[11px] text-gray-400 leading-none">Hello, Sign In</span>
            <div className="flex items-center gap-0.5 font-bold text-xs mt-0.5">
              <span>Account</span>
              <ChevronDown size={12} className="text-gray-400" />
            </div>
          </Link>

          {/* Orders */}
          <Link href="/#" className="hidden md:flex flex-col items-start px-2 py-1 rounded hover:ring-1 hover:ring-white/20 transition-all">
            <span className="text-[11px] text-gray-400 leading-none">Returns &</span>
            <span className="font-bold text-xs mt-0.5">Orders</span>
          </Link>

          {/* Cart Icon & Live Reactive Badge */}
          <Link 
            href="/cart" 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 transition-colors border border-slate-700 relative"
          >
            <div className="relative flex items-center justify-center">
              <ShoppingCart size={22} className="text-orange-400" />
              <span className="absolute -top-2 -right-2 bg-orange-500 text-slate-950 text-[11px] font-black rounded-full h-5 w-5 flex items-center justify-center shadow-md animate-in fade-in zoom-in duration-200">
                {isMounted ? totalItems : 0}
              </span>
            </div>
            <span className="font-bold text-xs hidden lg:block text-gray-100">Cart</span>
          </Link>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="sm:hidden px-4 pb-2.5">
        <form onSubmit={handleSearch} className="flex w-full h-9 rounded-lg overflow-hidden bg-white shadow-inner">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..." 
            className="flex-grow px-3 text-xs text-black focus:outline-none placeholder:text-gray-400"
          />
          <button 
            type="submit"
            className="bg-orange-500 px-3.5 flex items-center justify-center text-slate-950"
          >
            <Search size={16} />
          </button>
        </form>
      </div>

      {/* Sub-Navigation Categories Strip */}
      <nav className="bg-slate-800/90 backdrop-blur text-xs py-2 px-4 border-t border-slate-700/60 overflow-x-auto whitespace-nowrap scrollbar-none">
        <div className="flex items-center gap-5 max-w-[1600px] mx-auto text-gray-300">
          <Link href="/" className="font-bold text-white flex items-center gap-1.5 hover:text-orange-400 transition-colors">
            <Menu size={15} /> All Storefront
          </Link>
          <Link href="/?cat=cat-electronics" className="hover:text-white transition-colors">Electronics & Audio</Link>
          <Link href="/?cat=cat-fashion" className="hover:text-white transition-colors">Fashion & Apparel</Link>
          <Link href="/?cat=cat-home" className="hover:text-white transition-colors">Home & Kitchen</Link>
          <Link href="/?cat=cat-sports" className="hover:text-white transition-colors">Sports & Fitness</Link>
          <Link href="/cart" className="hover:text-orange-400 ml-auto font-medium text-orange-400 flex items-center gap-1">
            <Package size={13} /> View Cart ({isMounted ? totalItems : 0})
          </Link>
        </div>
      </nav>

      {/* Mobile Slide-down Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-t border-slate-800 p-4 space-y-3 text-sm animate-in slide-in-from-top duration-200">
          <div className="font-bold text-gray-400 uppercase text-xs tracking-wider">Shop by Category</div>
          <div className="flex flex-col gap-2">
            <Link 
              href="/" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 text-gray-200 hover:text-orange-400"
            >
              All Products
            </Link>
            <Link 
              href="/?cat=cat-electronics" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 text-gray-200 hover:text-orange-400"
            >
              Electronics & Audio
            </Link>
            <Link 
              href="/?cat=cat-fashion" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 text-gray-200 hover:text-orange-400"
            >
              Fashion & Apparel
            </Link>
            <Link 
              href="/?cat=cat-home" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 text-gray-200 hover:text-orange-400"
            >
              Home & Kitchen
            </Link>
            <Link 
              href="/?cat=cat-sports" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 text-gray-200 hover:text-orange-400"
            >
              Sports & Fitness
            </Link>
          </div>
          <hr className="border-slate-800 my-2" />
          <Link 
            href="/cart" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-between text-orange-400 font-bold py-1"
          >
            <span>My Cart</span>
            <span>{isMounted ? totalItems : 0} items</span>
          </Link>
        </div>
      )}
    </header>
  );
}
