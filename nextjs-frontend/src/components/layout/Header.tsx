'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { shopApi } from '@/lib/api';
import { Category } from '@/types';

export default function Header() {
  const router = useRouter();
  const { cart, fetchCart } = useCartStore();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // Cart is per-user (auth required); fetch on mount when already logged in
  // and whenever auth state flips to logged-in.
  useEffect(() => { if (isAuthenticated) fetchCart(); }, [isAuthenticated]);
  useEffect(() => {
    shopApi.categories().then(r => setCategories(r.data));
  }, []);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/shop?search=${encodeURIComponent(search)}`);
  };

  const cartCount = cart?.total_items || 0;

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-gradient-to-l from-primary-dark to-primary text-white text-xs py-1.5 hidden md:block">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            ارسال رایگان برای خریدهای بالای ۵۰۰ هزار تومان
          </span>
          <div className="flex gap-5">
            <Link href="/about" className="hover:text-white/80 transition-colors">درباره ما</Link>
            <Link href="/contact" className="hover:text-white/80 transition-colors">تماس با ما</Link>
            <Link href="/track-order" className="hover:text-white/80 transition-colors">پیگیری سفارش</Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 h-16">

            {/* Mobile menu button */}
            <button
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 text-dark-2 transition-colors"
              onClick={() => setMobileOpen(o => !o)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md shadow-primary/30 flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                </svg>
              </div>
              <span className="text-lg font-bold gradient-text hidden sm:block">یدک استوریج</span>
            </Link>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="نام قطعه، شماره قطعه یا برند را وارد کنید..."
                  className="w-full bg-gray-100 border border-transparent rounded-full pr-5 pl-12 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all duration-200 placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary-dark transition-colors shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Action icons */}
            <div className="flex items-center gap-0.5 ms-auto md:ms-0">

              {/* Account */}
              <div className="relative" ref={accountRef}>
                <button
                  onClick={() => setAccountOpen(o => !o)}
                  className="flex flex-col items-center gap-0.5 p-2.5 rounded-xl hover:bg-gray-100 text-dark-2 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-[10px] hidden md:block font-medium leading-none">
                    {isAuthenticated ? (user?.first_name || 'حساب') : 'ورود'}
                  </span>
                </button>

                {accountOpen && (
                  <div className="absolute left-0 top-full mt-2 w-52 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-2xl z-50 py-2 animate-scale-in overflow-hidden">
                    {isAuthenticated ? (
                      <>
                        <div className="px-4 py-2 border-b border-gray-50 mb-1">
                          <p className="text-xs text-muted">خوش آمدید</p>
                          <p className="text-sm font-semibold text-dark-2">{user?.first_name || user?.username}</p>
                        </div>
                        <Link href="/my-account" className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50 transition-colors" onClick={() => setAccountOpen(false)}>
                          <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                          داشبورد
                        </Link>
                        <Link href="/my-account/orders" className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50 transition-colors" onClick={() => setAccountOpen(false)}>
                          <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                          سفارش‌های من
                        </Link>
                        <Link href="/wishlist" className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50 transition-colors" onClick={() => setAccountOpen(false)}>
                          <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                          علاقه‌مندی‌ها
                        </Link>
                        {user?.is_staff && (
                          <>
                            <div className="my-1.5 mx-4 border-t border-gray-100" />
                            <Link href="/admin" className="flex items-center gap-2.5 px-4 py-2 text-sm text-primary font-semibold hover:bg-primary/5 transition-colors" onClick={() => setAccountOpen(false)}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              پنل مدیریت
                            </Link>
                          </>
                        )}
                        <div className="my-1.5 mx-4 border-t border-gray-100" />
                        <button
                          onClick={() => { logout(); setAccountOpen(false); router.push('/'); }}
                          className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-rose-500 hover:bg-rose-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          خروج
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href="/login" className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors" onClick={() => setAccountOpen(false)}>
                          ورود به حساب
                        </Link>
                        <Link href="/register" className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors" onClick={() => setAccountOpen(false)}>
                          ثبت‌نام
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Wishlist */}
              <Link href="/wishlist" className="flex flex-col items-center gap-0.5 p-2.5 rounded-xl hover:bg-gray-100 text-dark-2 transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-[10px] hidden md:block font-medium leading-none">علاقه‌مندی</span>
              </Link>

              {/* Cart */}
              <Link href="/cart" className="relative flex flex-col items-center gap-0.5 p-2.5 rounded-xl hover:bg-gray-100 text-dark-2 transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -left-0.5 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {cartCount}
                  </span>
                )}
                <span className="text-[10px] hidden md:block font-medium leading-none">سبد خرید</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Category nav */}
        <div className="border-t border-gray-100 hidden md:block">
          <div className="container mx-auto px-4">
            <nav className="flex items-center overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <Link href="/" className="relative group px-4 py-3 text-sm font-medium text-dark-2 hover:text-primary whitespace-nowrap transition-colors duration-150 flex-shrink-0">
                خانه
                <span className="absolute bottom-0 right-3 left-3 h-0.5 bg-primary rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-right" />
              </Link>
              {categories.slice(0, 7).map(cat => (
                <Link key={cat.id} href={`/category/${cat.slug}`} className="relative group px-4 py-3 text-sm text-dark-2 hover:text-primary whitespace-nowrap transition-colors duration-150 flex-shrink-0">
                  {cat.name}
                  <span className="absolute bottom-0 right-3 left-3 h-0.5 bg-primary rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-right" />
                </Link>
              ))}
              <Link href="/shop" className="relative group px-4 py-3 text-sm text-dark-2 hover:text-primary whitespace-nowrap transition-colors duration-150 flex-shrink-0">
                همه محصولات
                <span className="absolute bottom-0 right-3 left-3 h-0.5 bg-primary rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-right" />
              </Link>
              <Link href="/blog" className="relative group px-4 py-3 text-sm text-dark-2 hover:text-primary whitespace-nowrap transition-colors duration-150 flex-shrink-0">
                وبلاگ
                <span className="absolute bottom-0 right-3 left-3 h-0.5 bg-primary rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-right" />
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-up" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl animate-slide-in-right flex flex-col">
            {/* Drawer header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-l from-primary-dark to-primary">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                  </svg>
                </div>
                <span className="font-bold text-white text-sm">یدک استوریج</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile search */}
            <div className="p-4 border-b border-gray-100">
              <form onSubmit={(e) => { handleSearch(e); setMobileOpen(false); }}>
                <div className="relative">
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="جستجو..."
                    className="w-full bg-gray-100 border-0 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-gray-400"
                  />
                </div>
              </form>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
              {[
                { href: '/', label: 'خانه' },
                { href: '/shop', label: 'همه محصولات' },
                ...categories.map(cat => ({ href: `/category/${cat.slug}`, label: cat.name })),
                { href: '/blog', label: 'وبلاگ' },
                { href: '/contact', label: 'تماس با ما' },
                { href: '/track-order', label: 'پیگیری سفارش' },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 py-2.5 px-3 text-sm text-dark-2 rounded-xl hover:bg-primary/5 hover:text-primary transition-all duration-150"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Auth footer */}
            <div className="p-4 border-t border-gray-100">
              {isAuthenticated
                ? (
                  <div className="space-y-2">
                    <Link href="/my-account" className="flex items-center justify-center w-full py-2.5 bg-gray-100 text-dark-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors" onClick={() => setMobileOpen(false)}>حساب کاربری</Link>
                    <button onClick={() => { logout(); setMobileOpen(false); router.push('/'); }} className="flex items-center justify-center w-full py-2.5 bg-rose-50 text-rose-500 rounded-xl text-sm font-medium hover:bg-rose-100 transition-colors">خروج</button>
                  </div>
                )
                : (
                  <div className="space-y-2">
                    <Link href="/login" className="flex items-center justify-center w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors shadow-md shadow-primary/20" onClick={() => setMobileOpen(false)}>ورود</Link>
                    <Link href="/register" className="flex items-center justify-center w-full py-2.5 border-2 border-primary text-primary rounded-xl text-sm font-semibold hover:bg-primary/5 transition-colors" onClick={() => setMobileOpen(false)}>ثبت‌نام</Link>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
