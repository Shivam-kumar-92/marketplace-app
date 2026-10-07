'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Star, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Check, 
  ShoppingCart, 
  ArrowLeft,
  Sparkles,
  Zap
} from 'lucide-react';
import { MockProduct } from '@/lib/mockData';
import { useCartStore } from '@/store/useCartStore';

interface ProductDetailProps {
  product: MockProduct;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  const [activeImage, setActiveImage] = useState(product.images[0] || '');
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const currentPrice = product.basePrice + (selectedVariant?.priceOffset || 0);
  const currentStock = selectedVariant ? selectedVariant.stock : 15;
  const isOutOfStock = currentStock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    addItem(
      {
        id: product.id,
        title: product.title,
        basePrice: product.basePrice,
        images: product.images,
      },
      quantity,
      selectedVariant?.id,
      selectedVariant?.name,
      selectedVariant?.priceOffset || 0
    );

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;

    addItem(
      {
        id: product.id,
        title: product.title,
        basePrice: product.basePrice,
        images: product.images,
      },
      quantity,
      selectedVariant?.id,
      selectedVariant?.name,
      selectedVariant?.priceOffset || 0
    );

    router.push('/cart');
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 bg-white rounded-3xl border border-gray-200 shadow-sm my-6 sm:my-8">
      
      {/* Breadcrumbs Navigation */}
      <nav className="text-xs text-gray-500 mb-8 flex items-center gap-2">
        <Link href="/" className="hover:text-orange-600 transition-colors">Home</Link>
        <span>&gt;</span>
        <Link href={`/?cat=${product.categoryId}`} className="hover:text-orange-600 transition-colors">
          {product.categoryName}
        </Link>
        <span>&gt;</span>
        <span className="text-gray-900 font-bold truncate max-w-sm">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Column 1: Gallery Thumbnails & Primary View (Span 5) */}
        <div className="lg:col-span-5 flex flex-col-reverse sm:flex-row gap-4">
          <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto max-h-[500px] w-full sm:w-20 scrollbar-none flex-shrink-0">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onMouseEnter={() => setActiveImage(img)}
                onClick={() => setActiveImage(img)}
                className={`border-2 rounded-xl p-1 w-16 h-16 flex-shrink-0 bg-gray-50 overflow-hidden transition-all ${
                  activeImage === img
                    ? 'border-orange-500 ring-2 ring-orange-100'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                aria-label={`View image ${idx + 1}`}
              >
                <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-contain" />
              </button>
            ))}
          </div>

          <div className="flex-grow border border-gray-200 rounded-3xl p-6 flex items-center justify-center bg-gray-50/50 min-h-[350px] sm:min-h-[460px] overflow-hidden group">
            <img
              src={activeImage}
              alt={product.title}
              className="w-full h-auto max-h-[440px] object-contain group-hover:scale-105 transition-transform duration-500 origin-center"
            />
          </div>
        </div>

        {/* Column 2: Product Specifications & Details (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                {product.brand}
              </span>
              {product.badge && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-white bg-slate-900 px-2 py-0.5 rounded-full">
                  {product.badge}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 leading-snug">
              {product.title}
            </h1>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-gray-800">{product.rating.toFixed(1)} / 5.0</span>
            <span className="text-xs text-gray-400">({product.numReviews.toLocaleString('en-IN')} verified reviews)</span>
          </div>

          <hr className="border-gray-200" />

          {/* Price Header */}
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-gray-400 line-through">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5">Inclusive of all taxes & free shipping</p>
          </div>

          {/* Variant Selection */}
          {product.variants.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-700 block">
                Select Option / Edition:
              </span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left flex flex-col ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/70 text-slate-950 ring-2 ring-orange-200'
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span>{v.name}</span>
                      <span className="text-[10px] text-gray-400 font-normal">
                        {v.priceOffset > 0 ? `+₹${v.priceOffset.toLocaleString('en-IN')}` : 'Base Price'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <hr className="border-gray-200" />

          {/* Highlights & Features */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
              <Sparkles size={14} className="text-orange-500" /> Product Highlights
            </h3>
            <ul className="space-y-2 text-xs text-gray-600 leading-relaxed">
              {product.highlights.map((point, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Column 3: Buy Box (Span 3) */}
        <div className="lg:col-span-3">
          <div className="border border-gray-200 rounded-3xl p-5 bg-gray-50/70 sticky top-24 space-y-5 shadow-sm">
            
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-gray-500">Unit Price:</span>
              <span className="text-2xl font-black text-gray-900">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Delivery Timeline */}
            <div className="text-xs space-y-1 bg-white p-3 rounded-2xl border border-gray-100">
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Truck size={14} /> FREE Express Delivery
              </span>
              <span className="text-gray-900 font-semibold block">Arrives within 2 to 3 days</span>
              <span className="text-[11px] text-gray-400">Order dispatched directly from verified hub</span>
            </div>

            {/* Stock Availability Indicator */}
            <div>
              {isOutOfStock ? (
                <span className="text-red-600 font-bold text-sm block">Currently Out of Stock</span>
              ) : (
                <span className="text-emerald-700 font-bold text-xs block">
                  ✓ In Stock ({currentStock} units available)
                </span>
              )}
            </div>

            {/* Quantity Selector */}
            {!isOutOfStock && (
              <div className="flex items-center gap-3">
                <label htmlFor="product-qty" className="text-xs font-semibold text-gray-700">
                  Quantity:
                </label>
                <select
                  id="product-qty"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="border border-gray-300 rounded-xl px-3 py-1.5 text-xs bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {[...Array(Math.min(10, currentStock))].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Purchase CTA Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAdded}
                className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                  isAdded
                    ? 'bg-emerald-600 text-white'
                    : 'bg-orange-500 hover:bg-orange-600 text-slate-950 active:scale-95 disabled:opacity-40 cursor-pointer'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check size={16} className="stroke-[3]" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={16} />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Zap size={14} className="text-orange-400" />
                <span>Buy Now with 1-Click</span>
              </button>
            </div>

            {/* Buyer Protection Badges */}
            <div className="pt-3 border-t border-gray-200/80 space-y-2.5 text-xs text-gray-500">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
                <span>256-bit encrypted checkout via Stripe</span>
              </div>
              <div className="flex items-center gap-2.5">
                <RotateCcw size={16} className="text-orange-500 flex-shrink-0" />
                <span>7-day replacement guarantee</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Customer Reviews Section */}
      <div className="mt-16 pt-12 border-t border-gray-200">
        <h2 className="text-xl font-black text-gray-900 mb-6">Verified Customer Feedback</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {product.reviews.map((rev) => (
            <div key={rev.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-gray-900">{rev.userName}</span>
                <span className="text-[11px] text-gray-400">{rev.date}</span>
              </div>
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    fill={i < rev.rating ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">&ldquo;{rev.comment}&rdquo;</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
