'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

const SORT_OPTIONS = [
  { value: '-created_at', label: 'جدیدترین' },
  { value: 'effective_price', label: 'ارزانترین' },
  { value: '-effective_price', label: 'گرانترین' },
  { value: '-average_rating', label: 'بهترین امتیاز' },
];

export function SortSelector({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('ordering', value);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="relative">
      <select
        value={current}
        onChange={e => onChange(e.target.value)}
        className="appearance-none text-sm border border-border-color rounded-xl px-4 py-2.5 pe-9 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white text-dark-2 cursor-pointer transition-all font-medium"
      >
        {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

export function Pagination({ current, total, basePath, extraParams }: {
  current: number; total: number; basePath: string; extraParams: string;
}) {
  const pages: number[] = [];
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) pages.push(i);

  const buildUrl = (p: number) => {
    const params = new URLSearchParams(extraParams);
    params.set('page', String(p));
    return `${basePath}?${params.toString()}`;
  };

  if (total <= 1) return null;

  return (
    <nav aria-label="صفحه‌بندی" className="flex justify-center items-center gap-1.5 mt-10">
      {current > 1 && (
        <a
          href={buildUrl(current - 1)}
          className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-border-color text-sm text-dark-2 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          قبلی
        </a>
      )}

      {pages[0] > 1 && (
        <>
          <a href={buildUrl(1)} className="w-9 h-9 rounded-xl border border-border-color flex items-center justify-center text-sm text-dark-2 hover:border-primary hover:text-primary transition-all">۱</a>
          {pages[0] > 2 && <span className="text-muted text-sm px-1">···</span>}
        </>
      )}

      {pages.map(p => (
        <a
          key={p}
          href={buildUrl(p)}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center text-sm font-medium transition-all ${
            p === current
              ? 'bg-primary text-white border-primary shadow-sm shadow-primary/30'
              : 'border-border-color text-dark-2 hover:border-primary hover:text-primary hover:bg-primary/5'
          }`}
        >
          {p}
        </a>
      ))}

      {pages[pages.length - 1] < total && (
        <>
          {pages[pages.length - 1] < total - 1 && <span className="text-muted text-sm px-1">···</span>}
          <a href={buildUrl(total)} className="w-9 h-9 rounded-xl border border-border-color flex items-center justify-center text-sm text-dark-2 hover:border-primary hover:text-primary transition-all">{total}</a>
        </>
      )}

      {current < total && (
        <a
          href={buildUrl(current + 1)}
          className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-border-color text-sm text-dark-2 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
        >
          بعدی
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </a>
      )}
    </nav>
  );
}
