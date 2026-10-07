'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, ShoppingCart, Check, Eye } from 'lucide-react';
import { MockProduct } from '@/lib/mockData';
import { useCartStore } from '@/store/useCartStore';

interface ProductCardProps {
  product: MockProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [isAdded, setIsAdded] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const defaultVariant = product.variants[0];
    addItem(
      {
        id: product.id,
        title: product.title,
        basePrice: product.basePrice,
        images: product.images,
      },
      1,
      defaultVariant?.id,
      defaultVariant?.name,
      defaultVariant?.priceOffset || 0
    );

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1800);
  };

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.basePrice) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="group bg-white rounded-2xl border border-gray-200/90 hover:border-orange-300 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Product Image Box */}
      <Link href={`/products/${product.slug}`} className="relative aspect-square w-full overflow-hidden bg-gray-50 flex items-center justify-center p-4">
        {/* Badge */}
        {product.badge && (
          <span className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
            {product.badge}
          </span>
        )}

        {discountPercent > 0 && (
          <span className="absolute top-3 right-3 z-10 bg-red-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md shadow-sm">
            -{discountPercent}%
          </span>
        )}

        <img
          src={product.images[0]}
          alt={product.title}
          className="h-full w-full object-contain object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Quick View Overlay Button */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-white/95 text-slate-900 text-xs font-bold px-3.5 py-1.5 rounded-full shadow flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200">
            <Eye size={14} /> Quick View
          </span>
        </div>
      </Link>

      {/* Product Details */}
      <div className="p-4 flex flex-col flex-grow justify-between gap-3">
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span className="font-semibold uppercase tracking-wider text-orange-600 text-[10px]">
              {product.brand}
            </span>
            <div className="flex items-center gap-1 text-amber-500">
              <Star size={12} fill="currentColor" />
              <span className="font-bold text-gray-800 text-[11px]">{product.rating.toFixed(1)}</span>
              <span className="text-gray-400 text-[10px]">({product.numReviews})</span>
            </div>
          </div>

          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-orange-600 transition-colors leading-snug">
              {product.title}
            </h3>
          </Link>
        </div>

        {/* Price & Action */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-gray-900">
                ₹{product.basePrice.toLocaleString('en-IN')}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-gray-400 line-through">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">Free Delivery</span>
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={isAdded}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              isAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-orange-500 hover:bg-orange-600 text-slate-950 active:scale-95'
            }`}
            aria-label="Add to Cart"
          >
            {isAdded ? (
              <>
                <Check size={14} className="stroke-[3]" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingCart size={14} />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
