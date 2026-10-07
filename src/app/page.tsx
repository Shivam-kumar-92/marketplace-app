import React from 'react';
import Link from 'next/link';
import { getCategories, getProducts } from '@/lib/catalog';
import ProductCard from '@/components/product/ProductCard';
import { 
  Sparkles, 
  Flame, 
  TrendingUp, 
  ShieldCheck, 
  Truck, 
  CreditCard,
  ArrowRight,
  FilterX
} from 'lucide-react';

interface HomePageProps {
  searchParams: Promise<{ cat?: string; search?: string }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const currentCategory = params?.cat || 'all';
  const searchQuery = (params?.search || '').toLowerCase().trim();

  const [categories, filteredProducts] = await Promise.all([
    getCategories(),
    getProducts({
      categoryId: currentCategory,
      searchQuery: searchQuery,
    }),
  ]);

  const featuredProducts = filteredProducts.filter((p) => p.isFeatured);
  const remainingProducts = filteredProducts.filter((p) => !p.isFeatured);

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Hero Banner Section */}
      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 text-white relative overflow-hidden py-12 md:py-20 border-b border-slate-800">
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:24px_24px]" />
        
        <div className="max-w-[1400px] mx-auto px-4 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} className="text-orange-400" />
              <span>NexMart Festive Season Event</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Flagship Gear. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
                Uncompromising Standard.
              </span>
            </h1>

            <p className="text-gray-300 text-sm sm:text-base max-w-xl leading-relaxed">
              Discover curated flagship electronics, luxury heavyweight streetwear, and professional athletic equipment with instant Stripe checkout and verified buyer protection.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a 
                href="#products-section" 
                className="bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-95 text-sm flex items-center gap-2"
              >
                <span>Shop Featured Collection</span>
                <ArrowRight size={16} />
              </a>
              <Link 
                href="/cart" 
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold px-5 py-3 rounded-xl transition-all text-sm"
              >
                View Saved Cart
              </Link>
            </div>

            {/* Quick Micro-stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 text-xs">
              <div>
                <span className="block text-xl font-black text-white">100%</span>
                <span className="text-gray-400 text-[11px]">Genuine Brands</span>
              </div>
              <div>
                <span className="block text-xl font-black text-white">Same-Day</span>
                <span className="text-gray-400 text-[11px]">Dispatch Available</span>
              </div>
              <div>
                <span className="block text-xl font-black text-white">4.9 ★</span>
                <span className="text-gray-400 text-[11px]">Average Product Rating</span>
              </div>
            </div>
          </div>

          {/* Hero Showcase Image */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-b from-white/5 to-white/0 p-6 backdrop-blur">
              <img 
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&auto=format&fit=crop&q=80" 
                alt="Sony WH-1000XM5 Headphones" 
                className="w-full h-full object-contain filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur border border-white/10 p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-orange-400 uppercase font-black">Spotlight Deal</span>
                  <div className="text-xs font-bold text-white truncate max-w-[200px]">Sony WH-1000XM5 ANC</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-white">₹26,990</span>
                  <span className="text-[10px] text-gray-400 line-through block">₹34,990</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills Strip */}
      <section className="bg-white border-b border-gray-200 py-6 px-4">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-800">Browse by Category</h2>
            {currentCategory !== 'all' && (
              <Link 
                href="/" 
                className="text-xs text-orange-600 font-semibold flex items-center gap-1 hover:underline"
              >
                <FilterX size={13} /> Reset Filter
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map((cat) => {
              const isActive = currentCategory === cat.id;
              return (
                <Link
                  key={cat.id}
                  href={`/?cat=${cat.id}`}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isActive 
                      ? 'bg-orange-50 border-orange-500 shadow-sm' 
                      : 'bg-gray-50/70 border-gray-200/80 hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  <img 
                    src={cat.image} 
                    alt={cat.name} 
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0" 
                  />
                  <div className="overflow-hidden">
                    <span className={`block text-xs font-bold truncate ${isActive ? 'text-orange-950' : 'text-gray-900'}`}>
                      {cat.name}
                    </span>
                    <span className="text-[10px] text-gray-500">{cat.itemCount} items</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Product Showcase */}
      <section id="products-section" className="max-w-[1400px] mx-auto px-4 py-12 flex-grow w-full space-y-12">
        
        {/* Search / Active Filter Header */}
        {searchQuery && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="text-sm text-gray-800">
              Showing search results for &ldquo;<strong>{searchQuery}</strong>&rdquo; ({filteredProducts.length} items found)
            </div>
            <Link href="/" className="text-xs font-bold text-orange-600 hover:underline">
              Clear Search
            </Link>
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div className="text-center py-24 space-y-4 bg-white rounded-3xl border border-gray-200 p-8">
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ?
            </div>
            <h3 className="text-lg font-bold text-gray-900">No matching products found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              We couldn&apos;t find any items matching your selected criteria. Try adjusting your search query or reset category filters.
            </p>
            <Link 
              href="/" 
              className="inline-block bg-orange-500 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-orange-600 transition-colors"
            >
              Reset to All Products
            </Link>
          </div>
        ) : (
          <>
            {/* Featured Section */}
            {featuredProducts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-orange-500 text-slate-950 rounded-lg">
                      <Flame size={18} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 tracking-tight">Featured Flagships</h2>
                      <p className="text-xs text-gray-500">Handpicked top-tier products verified for exceptional build and performance</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {featuredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}

            {/* Trending & Other Products */}
            {remainingProducts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500 text-white rounded-lg">
                      <TrendingUp size={18} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 tracking-tight">More Trending Essentials</h2>
                      <p className="text-xs text-gray-500">Popular items loved by verified NexMart customers</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {remainingProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Trust & Guarantee Banner */}
      <section className="bg-slate-900 text-white py-12 px-4 border-t border-slate-800">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 flex items-start gap-4">
            <div className="p-3 bg-orange-500/10 text-orange-400 rounded-xl flex-shrink-0">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white mb-1">Authentic Guarantee</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Every unit sourced directly from authorized brand distributors with genuine manufacturer warranties.
              </p>
            </div>
          </div>

          <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 flex items-start gap-4">
            <div className="p-3 bg-orange-500/10 text-orange-400 rounded-xl flex-shrink-0">
              <Truck size={28} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white mb-1">Insured Express Shipping</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Real-time tracking and package transit insurance for complete peace of mind on high-value orders.
              </p>
            </div>
          </div>

          <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 flex items-start gap-4">
            <div className="p-3 bg-orange-500/10 text-orange-400 rounded-xl flex-shrink-0">
              <CreditCard size={28} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white mb-1">Stripe Protected Checkout</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Zero card numbers stored on our servers. 256-bit PCI-DSS compliant checkout with 3D Secure verification.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
