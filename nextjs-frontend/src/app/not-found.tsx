import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <div className="text-8xl font-black text-gray-100 mb-4">۴۰۴</div>
      <h1 className="text-2xl font-bold text-dark-2 mb-2">صفحه یافت نشد</h1>
      <p className="text-muted mb-8">صفحه‌ای که دنبال آن هستید وجود ندارد یا منتقل شده است</p>
      <div className="flex gap-3 justify-center">
        <Link href="/" className="btn-primary px-8">بازگشت به خانه</Link>
        <Link href="/shop" className="btn-outline px-8">فروشگاه</Link>
      </div>
    </div>
  );
}
