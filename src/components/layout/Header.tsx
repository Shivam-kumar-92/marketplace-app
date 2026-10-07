import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  ShoppingCart, 
  Menu, 
  MapPin, 
  ChevronDown,
  User,
  Package
} from 'lucide-react';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="w-full bg-slate-900 text-white">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-2 max-w-[1600px] mx-auto gap-4">
        
        {/* Left Section: Logo & Mobile Menu */}
        <div className="flex items-center gap-4">
          <button 
            className="md:hidden p-1 hover:border border-transparent hover:border-white rounded"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu size={24} />
          </button>
          <Link href="/" className="flex items-center border border-transparent hover:border-white p-1 rounded">
            <span className="text-2xl font-bold tracking-tight">NexMart</span>
          </Link>
          
          <div className="hidden md:flex flex-col items-start border border-transparent hover:border-white p-1 rounded cursor-pointer ml-2">
            <span className="text-xs text-gray-300 ml-5">Deliver to</span>
            <div className="flex items-center gap-1 font-bold text-sm">
              <MapPin size={16} />
              <span>Select Location</span>
            </div>
          </div>
        </div>

        {/* Middle Section: Search Bar */}
        <div className="flex-grow hidden sm:flex items-center">
          <div className="flex w-full h-10 rounded-md overflow-hidden bg-white">
            <select className="bg-gray-100 text-gray-700 text-sm px-2 border-r border-gray-300 focus:outline-none cursor-pointer hover:bg-gray-200 w-auto">
              <option>All Categories</option>
              <option>Electronics</option>
              <option>Clothing</option>
              <option>Home & Garden</option>
            </select>
            <input 
              type="text" 
              placeholder="Search for premium products" 
              className="flex-grow px-3 text-black focus:outline-none"
            />
            <button className="bg-orange-500 hover:bg-orange-600 transition-colors px-4 flex items-center justify-center text-slate-900">
              <Search size={20} />
            </button>
          </div>
        </div>

        {/* Right Section: Account, Orders, Cart */}
        <div className="flex items-center gap-1 md:gap-4">
          
          {/* Language Selector */}
          <div className="hidden lg:flex items-center gap-1 border border-transparent hover:border-white p-2 rounded cursor-pointer font-bold text-sm">
            <span>EN</span>
            <ChevronDown size={14} className="text-gray-400" />
          </div>

          {/* Account Menu */}
          <Link href="/account" className="flex flex-col items-start border border-transparent hover:border-white p-1 rounded">
            <span className="text-xs text-gray-300">Hello, Sign in</span>
            <div className="flex items-center gap-1 font-bold text-sm">
              <span>Account & Lists</span>
              <ChevronDown size={14} className="text-gray-400" />
            </div>
          </Link>

          {/* Orders */}
          <Link href="/orders" className="hidden md:flex flex-col items-start border border-transparent hover:border-white p-1 rounded">
            <span className="text-xs text-gray-300">View</span>
            <span className="font-bold text-sm">My Orders</span>
          </Link>

          {/* Cart */}
          <Link href="/cart" className="flex items-center gap-1 border border-transparent hover:border-white p-1 rounded relative">
            <div className="relative flex items-end">
              <ShoppingCart size={32} />
              <span className="absolute -top-1 left-3 bg-orange-500 text-slate-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </div>
            <span className="font-bold text-sm hidden md:block mt-3">Cart</span>
          </Link>
        </div>
      </div>

      {/* Mobile Search Bar (Visible only on small screens) */}
      <div className="sm:hidden px-4 pb-3">
        <div className="flex w-full h-10 rounded-md overflow-hidden bg-white">
          <input 
            type="text" 
            placeholder="Search products..." 
            className="flex-grow px-3 text-black focus:outline-none"
          />
          <button className="bg-orange-500 px-4 flex items-center justify-center text-slate-900">
            <Search size={20} />
          </button>
        </div>
      </div>

      {/* Secondary Navigation (Categories) */}
      <nav className="bg-slate-800 text-sm py-2 px-4 flex items-center gap-4 overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-1 cursor-pointer hover:border border-transparent hover:border-white px-1">
          <Menu size={18} />
          <span className="font-bold">All</span>
        </div>
        <Link href="#" className="hover:border border-transparent hover:border-white px-1">Today's Deals</Link>
        <Link href="#" className="hover:border border-transparent hover:border-white px-1">Customer Service</Link>
        <Link href="#" className="hover:border border-transparent hover:border-white px-1">Gift Cards</Link>
        <Link href="#" className="hover:border border-transparent hover:border-white px-1">Sell</Link>
      </nav>
    </header>
  );
}
