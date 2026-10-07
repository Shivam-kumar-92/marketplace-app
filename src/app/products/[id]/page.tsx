import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductByIdOrSlug, MOCK_PRODUCTS } from '@/lib/mockData';
import ProductDetail from '@/components/product/ProductDetail';
import { ArrowLeft } from 'lucide-react';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return MOCK_PRODUCTS.flatMap((p) => [
    { id: p.id },
    { id: p.slug },
  ]);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = getProductByIdOrSlug(id);

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
          404
        </div>
        <h1 className="text-2xl font-black text-gray-900">Product Not Found</h1>
        <p className="text-sm text-gray-500">
          The requested product &ldquo;{id}&rdquo; could not be located in our catalog.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all text-xs"
        >
          <ArrowLeft size={16} /> Return to Storefront
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ProductDetail product={product} />
    </div>
  );
}
