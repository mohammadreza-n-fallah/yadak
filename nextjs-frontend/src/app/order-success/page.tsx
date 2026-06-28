import Link from 'next/link';

export default async function OrderSuccessPage({ searchParams }: { searchParams: { order?: string; ref_id?: string } }) {
  const sp = await searchParams;

  return (
    <div className="container mx-auto px-4 py-20 text-center max-w-lg">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-dark-2 mb-2">سفارش شما ثبت شد!</h1>
      {sp.order && (
        <p className="text-muted mb-1">شماره سفارش: <span className="font-bold text-dark-2">{sp.order}</span></p>
      )}
      {sp.ref_id && (
        <p className="text-muted mb-4">کد پیگیری پرداخت: <span className="font-bold text-dark-2">{sp.ref_id}</span></p>
      )}
      <p className="text-sm text-muted mb-8">پس از بررسی و تأیید سفارش، اطلاعات ارسال برای شما ارسال خواهد شد.</p>
      <div className="flex gap-3 justify-center">
        <Link href="/my-account/orders" className="btn-primary px-6">پیگیری سفارش</Link>
        <Link href="/shop" className="btn-outline px-6">ادامه خرید</Link>
      </div>
    </div>
  );
}
