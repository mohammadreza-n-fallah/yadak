'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ username: '', email: '', first_name: '', last_name: '', phone: '', password: '', password2: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password2) { toast.error('رمز عبور و تکرار آن یکسان نیستند'); return; }
    setLoading(true);
    try {
      await authApi.register(form);
      const { data } = await authApi.login(form.username, form.password);
      // Store tokens BEFORE fetching the profile: the axios request interceptor
      // reads the access token from localStorage to set the Authorization header.
      // Without this, profile() goes out tokenless and 401s with
      // "Authentication credentials were not provided" (the account is already
      // created by then, so a retry collides with "username already exists").
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      const profileRes = await authApi.profile();
      login(data.access, data.refresh, profileRes.data);
      toast.success('ثبت‌نام با موفقیت انجام شد');
      router.push('/my-account');
    } catch (err: unknown) {
      const errors = (err as { response?: { data?: Record<string, unknown> } }).response?.data;
      if (errors) {
        const firstError = Object.values(errors)[0];
        toast.error(Array.isArray(firstError) ? String(firstError[0]) : String(firstError));
      } else { toast.error('خطا در ثبت‌نام'); }
    } finally { setLoading(false); }
  };

  const EyeIcon = ({ visible }: { visible: boolean }) => visible ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-gray-bg">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Green header */}
          <div className="bg-gradient-to-l from-primary to-primary-dark px-8 py-6 text-white text-center">
            <div className="w-14 h-14 mx-auto bg-white/20 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold">ایجاد حساب کاربری</h1>
            <p className="text-white/70 text-sm mt-1">ثبت‌نام رایگان و سریع</p>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-dark-2 mb-1.5">نام</label>
                  <input value={form.first_name} onChange={e => upd('first_name', e.target.value)} className="input-field w-full" placeholder="علی" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-2 mb-1.5">نام خانوادگی</label>
                  <input value={form.last_name} onChange={e => upd('last_name', e.target.value)} className="input-field w-full" placeholder="احمدی" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-2 mb-1.5">نام کاربری <span className="text-rose-500">*</span></label>
                <input value={form.username} onChange={e => upd('username', e.target.value)} required className="input-field w-full" placeholder="ali.ahmadi" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-2 mb-1.5">ایمیل <span className="text-rose-500">*</span></label>
                <input value={form.email} onChange={e => upd('email', e.target.value)} required type="email" className="input-field w-full" placeholder="ali@example.com" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-2 mb-1.5">شماره موبایل</label>
                <input value={form.phone} onChange={e => upd('phone', e.target.value)} type="tel" className="input-field w-full" placeholder="۰۹۱۲۰۰۰۰۰۰۰" dir="ltr" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-dark-2 mb-1.5">رمز عبور <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input value={form.password} onChange={e => upd('password', e.target.value)} required type={showPass ? 'text' : 'password'} className="input-field w-full pe-10" placeholder="حداقل ۸ کاراکتر" dir="ltr" />
                    <button type="button" onClick={() => setShowPass(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted hover:text-dark-2 transition-colors">
                      <EyeIcon visible={showPass} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-2 mb-1.5">تکرار رمز <span className="text-rose-500">*</span></label>
                  <input value={form.password2} onChange={e => upd('password2', e.target.value)} required type={showPass ? 'text' : 'password'} className="input-field w-full" placeholder="••••••••" dir="ltr" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 font-bold text-base mt-2">
                {loading ? 'در حال ثبت...' : 'ثبت‌نام'}
              </button>
            </form>

            <GoogleLoginButton redirectTo="/my-account" />

            <div className="mt-5 pt-5 border-t border-border-color text-center text-sm">
              <span className="text-muted">حساب کاربری دارید؟ </span>
              <Link href="/login" className="text-primary hover:text-primary-dark font-semibold transition-colors">ورود</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
