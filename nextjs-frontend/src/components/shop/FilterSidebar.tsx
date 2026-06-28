'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Category, Brand } from '@/types';

interface Props {
  categories: Category[];
  brands: Brand[];
  currentCategory?: string;
  currentBrand?: string;
  currentMinPrice?: string;
  currentMaxPrice?: string;
  currentBadge?: string;
}

const BADGES = [
  { value: 'new', label: 'جدید' },
  { value: 'sale', label: 'حراج' },
  { value: 'original', label: 'اصلی' },
  { value: 'hot', label: 'پرفروش' },
];

function SectionHeader({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="flex items-center justify-between w-full group">
      <h3 className="font-bold text-dark-2 text-sm group-hover:text-primary transition-colors">{label}</h3>
      <svg
        className={`w-4 h-4 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

export default function FilterSidebar({
  categories, brands, currentCategory, currentBrand,
  currentMinPrice, currentMaxPrice, currentBadge,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState({ category: true, brand: true, price: true, badge: true });

  const update = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  const clearAll = () => router.push(pathname);
  const hasFilters = currentCategory || currentBrand || currentMinPrice || currentMaxPrice || currentBadge;
  const toggle = (k: keyof typeof open) => setOpen(s => ({ ...s, [k]: !s[k] }));

  return (
    <aside className="w-full space-y-3">
      {hasFilters && (
        <button
          onClick={clearAll}
          className="w-full flex items-center justify-center gap-2 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl py-2.5 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          حذف همه فیلترها
        </button>
      )}

      {/* Categories */}
      <div className="card p-4 space-y-3">
        <SectionHeader label="دسته‌بندی" open={open.category} onToggle={() => toggle('category')} />
        {open.category && (
          <ul className="space-y-0.5 mt-1">
            {categories.map(cat => (
              <li key={cat.id}>
                <button
                  onClick={() => update('category', currentCategory === cat.slug ? null : cat.slug)}
                  className={`w-full text-right text-sm py-2 px-3 rounded-xl transition-all flex items-center justify-between ${
                    currentCategory === cat.slug
                      ? 'bg-primary text-white font-semibold shadow-sm'
                      : 'text-dark-2 hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat.product_count !== undefined && (
                    <span className={`text-xs tabular-nums ${currentCategory === cat.slug ? 'text-white/70' : 'text-muted'}`}>
                      {cat.product_count}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div className="card p-4 space-y-3">
          <SectionHeader label="برند" open={open.brand} onToggle={() => toggle('brand')} />
          {open.brand && (
            <ul className="space-y-1 mt-1">
              {brands.map(b => (
                <li key={b.id}>
                  <button
                    onClick={() => update('brand', currentBrand === b.slug ? null : b.slug)}
                    className="flex items-center gap-3 w-full py-1.5 group text-right"
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      currentBrand === b.slug ? 'bg-primary border-primary' : 'border-gray-300 group-hover:border-primary'
                    }`}>
                      {currentBrand === b.slug && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm transition-colors ${
                      currentBrand === b.slug ? 'text-primary font-semibold' : 'text-dark-2 group-hover:text-primary'
                    }`}>
                      {b.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Price */}
      <div className="card p-4 space-y-3">
        <SectionHeader label="محدوده قیمت" open={open.price} onToggle={() => toggle('price')} />
        {open.price && (
          <div className="space-y-2 mt-1">
            <input
              type="number"
              placeholder="از قیمت (ریال)"
              defaultValue={currentMinPrice}
              onBlur={e => update('min_price', e.target.value || null)}
              className="input-field w-full text-sm"
            />
            <div className="text-center text-muted text-xs">تا</div>
            <input
              type="number"
              placeholder="تا قیمت (ریال)"
              defaultValue={currentMaxPrice}
              onBlur={e => update('max_price', e.target.value || null)}
              className="input-field w-full text-sm"
            />
          </div>
        )}
      </div>

      {/* Badge */}
      <div className="card p-4 space-y-3">
        <SectionHeader label="نوع محصول" open={open.badge} onToggle={() => toggle('badge')} />
        {open.badge && (
          <div className="flex flex-wrap gap-2 mt-1">
            {BADGES.map(b => (
              <button
                key={b.value}
                onClick={() => update('badge', currentBadge === b.value ? null : b.value)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                  currentBadge === b.value
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-dark-2 border-border-color hover:border-primary hover:text-primary'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
