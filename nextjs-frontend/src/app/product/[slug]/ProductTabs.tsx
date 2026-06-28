'use client';
import { useState } from 'react';
import ReviewSection from './ReviewSection';
import { Product } from '@/types';

export default function ProductTabs({ product }: { product: Product }) {
  const [tab, setTab] = useState<'desc' | 'reviews'>('desc');

  return (
    <div className="mt-10">
      {/* Tab buttons */}
      <div className="flex border-b border-border-color mb-6">
        <button
          onClick={() => setTab('desc')}
          className={`px-6 py-3 text-sm font-semibold transition-all duration-200 border-b-2 -mb-px ${
            tab === 'desc' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-dark-2'
          }`}
        >
          توضیحات محصول
        </button>
        <button
          onClick={() => setTab('reviews')}
          className={`px-6 py-3 text-sm font-semibold transition-all duration-200 border-b-2 -mb-px ${
            tab === 'reviews' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-dark-2'
          }`}
        >
          نظرات کاربران {product.review_count > 0 && `(${product.review_count})`}
        </button>
      </div>

      {tab === 'desc' && (
        <div className="prose max-w-none text-sm text-dark-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description || '<p class="text-muted">توضیحاتی ثبت نشده است.</p>' }} />
      )}
      {tab === 'reviews' && <ReviewSection product={product} />}
    </div>
  );
}
