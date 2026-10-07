import React, { useState } from 'react';
import { Star, Shield, Truck, RotateCcw } from 'lucide-react';
// import { useCartStore } from '@/store/useCartStore';

export default function ProductDetail({ product }: { product: any }) {
  // const addToCart = useCartStore((state) => state.addItem);
  const [activeImage, setActiveImage] = useState(product.images[0]);
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 bg-white">
      
      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-500 mb-6">
        Home &gt; Categories &gt; {product.category?.name} &gt; <span className="text-gray-900">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Column 1: Image Gallery (Span 5) */}
        <div className="md:col-span-5 flex flex-col-reverse md:flex-row gap-4">
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto max-h-[500px] w-full md:w-20">
            {product.images.map((img: string, idx: number) => (
              <button 
                key={idx} 
                onMouseEnter={() => setActiveImage(img)}
                className={`border-2 rounded p-1 w-16 h-16 flex-shrink-0 ${activeImage === img ? 'border-orange-500' : 'border-gray-200'}`}
              >
                <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
          <div className="flex-grow border rounded-lg p-4 flex items-center justify-center overflow-hidden cursor-zoom-in group">
            <img 
              src={activeImage} 
              alt={product.title} 
              className="w-full h-auto max-h-[500px] object-contain group-hover:scale-150 transition-transform duration-500 origin-center" 
            />
          </div>
        </div>

        {/* Column 2: Product Info (Span 4) */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{product.title}</h1>
          <a href={`/brand/${product.brand}`} className="text-sm text-blue-600 hover:underline">Visit the {product.brand} Store</a>
          
          {/* Ratings */}
          <div className="flex items-center gap-2">
            <div className="flex text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'} />
              ))}
            </div>
            <span className="text-sm text-blue-600 hover:underline cursor-pointer">{product.numReviews} ratings</span>
          </div>

          <hr className="border-gray-200" />
          
          <div className="flex items-baseline gap-2">
            <span className="text-xs align-top relative top-1">Rs.</span>
            <span className="text-3xl font-medium">{product.price.toFixed(2)}</span>
          </div>
          <p className="text-sm text-gray-500">Inclusive of all taxes</p>

          <hr className="border-gray-200" />

          {/* Highlights */}
          <div className="mt-2">
            <h3 className="font-bold mb-2">About this item</h3>
            <ul className="list-disc list-inside text-sm text-gray-800 space-y-2">
              {product.highlights?.map((point: string, i: number) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Column 3: Buy Box (Span 3) */}
        <div className="md:col-span-3">
          <div className="border border-gray-300 rounded-lg p-4 sticky top-4 flex flex-col gap-4">
            
            <div className="flex items-baseline gap-1">
               <span className="text-sm">Rs.</span>
               <span className="text-2xl font-bold">{product.price.toFixed(2)}</span>
            </div>

            <div className="text-sm flex flex-col gap-1">
              <span className="text-blue-600">FREE Delivery</span>
              <span className="font-bold text-gray-900">Tomorrow by 9 PM</span>
              <span className="text-gray-500">Order within 4 hrs 30 mins</span>
            </div>

            <div className="flex items-center gap-2 text-green-700 font-bold text-lg">
              {product.stock > 10 ? 'In Stock' : `Only ${product.stock} left in stock - order soon.`}
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-2">
              <label htmlFor="quantity" className="text-sm">Qty:</label>
              <select 
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="border border-gray-300 rounded p-1 text-sm bg-gray-50 cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                {[...Array(Math.min(10, product.stock || 1))].map((_, i) => (
                  <option key={i+1} value={i+1}>{i+1}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 mt-2">
              <button 
                // onClick={() => addToCart(product, quantity)}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-sm font-semibold rounded-full py-2.5 transition-colors shadow-sm"
              >
                Add to Cart
              </button>
              <button 
                className="w-full bg-orange-500 hover:bg-orange-600 text-sm font-semibold rounded-full py-2.5 transition-colors shadow-sm"
              >
                Buy Now
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-2">
              <Shield size={16} /> Secure transaction
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <Truck size={16} /> Dispatches from NexMart
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <RotateCcw size={16} /> 7-day Replacement
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
