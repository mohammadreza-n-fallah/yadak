'use client';
import { useState } from 'react';
import Rating from '@/components/ui/Rating';
import { shopApi } from '@/lib/api';
import { Product, ProductReview } from '@/types';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';

function getInitials(name: string): string {
  return name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function ReviewSection({ product }: { product: Product }) {
  const { isAuthenticated } = useAuthStore();
  const [reviews, setReviews] = useState<ProductReview[]>(product.reviews || []);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('برای ثبت نظر ابتدا وارد شوید'); return; }
    setLoading(true);
    try {
      const { data } = await shopApi.addReview(product.slug, { rating, title, body });
      setReviews(r => [data, ...r]);
      setTitle(''); setBody(''); setRating(5);
      toast.success('نظر شما با موفقیت ثبت شد و پس از تایید نمایش داده می‌شود');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      toast.error(msg || 'خطا در ثبت نظر');
    } finally { setLoading(false); }
  };

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-dark-2 flex items-center gap-2">
          <span className="w-1 h-5 bg-primary rounded-full inline-block" />
          نظرات کاربران
        </h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <Rating value={avg} readOnly size="sm" />
            <span className="text-sm font-semibold text-dark-2">{avg.toFixed(1)}</span>
            <span className="text-xs text-muted">({reviews.length} نظر)</span>
          </div>
        )}
      </div>

      {/* Review list */}
      {reviews.length === 0 ? (
        <div className="text-center py-10 card mb-6">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-muted text-sm">هنوز نظری ثبت نشده است. اولین نفر باشید!</p>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {reviews.map(r => (
            <div key={r.id} className="card p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {getInitials(r.author_name || '?')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                    <div>
                      <span className="font-semibold text-sm text-dark-2">{r.author_name}</span>
                      {r.title && <span className="text-xs text-muted mr-2">— {r.title}</span>}
                    </div>
                    <Rating value={r.rating} readOnly size="sm" />
                  </div>
                  <p className="text-sm text-dark-2 leading-relaxed">{r.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add review form */}
      <div className="card p-6">
        <h3 className="font-bold text-dark-2 mb-5 text-base">ثبت نظر شما</h3>
        {!isAuthenticated ? (
          <div className="text-center py-6">
            <p className="text-muted text-sm mb-4">برای ثبت نظر ابتدا وارد حساب کاربری خود شوید</p>
            <a href="/login" className="btn-primary px-6 inline-block">ورود به حساب</a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-2 mb-2">امتیاز شما</label>
              <Rating value={rating} onChange={setRating} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-2 mb-1.5">عنوان نظر</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                placeholder="مثلاً: محصول فوق‌العاده!"
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-2 mb-1.5">متن نظر</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                required
                rows={4}
                placeholder="تجربه خود را با دیگران به اشتراک بگذارید..."
                className="input-field w-full resize-none"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary px-8 py-3 font-semibold">
              {loading ? 'در حال ارسال...' : 'ثبت نظر'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
