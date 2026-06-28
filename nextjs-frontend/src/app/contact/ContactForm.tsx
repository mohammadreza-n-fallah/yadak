'use client';
import { useState } from 'react';
import { coreApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface FieldErrors { name?: string[]; email?: string[]; phone?: string[]; subject?: string[]; message?: string[]; }

const EMPTY = { name: '', email: '', phone: '', subject: '', message: '' };

export default function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sent, setSent] = useState(false);

  const upd = (k: keyof typeof EMPTY, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await coreApi.contact(form);
      setSent(true);
      setForm(EMPTY);
      toast.success('پیام شما با موفقیت ارسال شد. به زودی با شما تماس خواهیم گرفت.');
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: FieldErrors & { non_field_errors?: string[] } } }).response?.data;
      if (errData && typeof errData === 'object') {
        setErrors(errData);
        const topMsg = errData.non_field_errors?.[0] || 'لطفاً خطاهای فرم را برطرف کنید';
        toast.error(topMsg);
      } else {
        toast.error('خطا در ارسال پیام. لطفاً دوباره تلاش کنید.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="card p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h3 className="font-bold text-dark-2 text-lg mb-2">پیام شما ارسال شد!</h3>
        <p className="text-muted text-sm mb-5">به زودی با شما تماس خواهیم گرفت.</p>
        <button onClick={() => setSent(false)} className="btn-primary px-6 py-2 text-sm">ارسال پیام دیگر</button>
      </div>
    );
  }

  const FieldError = ({ field }: { field: keyof FieldErrors }) =>
    errors[field]?.[0] ? <p className="text-red-500 text-xs mt-1">{errors[field]![0]}</p> : null;

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-dark-2 mb-1">نام و نام خانوادگی <span className="text-red-500">*</span></label>
          <input
            value={form.name}
            onChange={e => upd('name', e.target.value)}
            required
            className={`input-field w-full ${errors.name ? 'border-red-400 focus:border-red-400' : ''}`}
          />
          <FieldError field="name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-2 mb-1">ایمیل <span className="text-red-500">*</span></label>
          <input
            value={form.email}
            onChange={e => upd('email', e.target.value)}
            required
            type="email"
            dir="ltr"
            className={`input-field w-full ${errors.email ? 'border-red-400 focus:border-red-400' : ''}`}
          />
          <FieldError field="email" />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-2 mb-1">شماره تماس</label>
          <input
            value={form.phone}
            onChange={e => upd('phone', e.target.value)}
            type="tel"
            dir="ltr"
            className={`input-field w-full ${errors.phone ? 'border-red-400 focus:border-red-400' : ''}`}
          />
          <FieldError field="phone" />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-2 mb-1">موضوع <span className="text-red-500">*</span></label>
          <select
            value={form.subject}
            onChange={e => upd('subject', e.target.value)}
            required
            className={`input-field w-full bg-white ${errors.subject ? 'border-red-400' : ''}`}
          >
            <option value="">انتخاب موضوع...</option>
            <option value="پشتیبانی فنی">پشتیبانی فنی</option>
            <option value="استعلام قیمت">استعلام قیمت</option>
            <option value="پیگیری سفارش">پیگیری سفارش</option>
            <option value="بازگشت کالا">بازگشت کالا</option>
            <option value="همکاری">همکاری</option>
            <option value="سایر">سایر</option>
          </select>
          <FieldError field="subject" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-dark-2 mb-1">متن پیام <span className="text-red-500">*</span></label>
        <textarea
          value={form.message}
          onChange={e => upd('message', e.target.value)}
          required
          rows={5}
          placeholder="پیام خود را بنویسید..."
          className={`input-field w-full resize-none ${errors.message ? 'border-red-400 focus:border-red-400' : ''}`}
        />
        <FieldError field="message" />
      </div>

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-muted">فیلدهای ستاره‌دار الزامی هستند</p>
        <button type="submit" disabled={loading} className="btn-primary px-8 py-2.5 font-bold flex items-center gap-2">
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              در حال ارسال...
            </>
          ) : 'ارسال پیام'}
        </button>
      </div>
    </form>
  );
}
