'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

interface ProfileForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birth_date: string;
}

interface PasswordForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated, setUser } = useAuthStore();
  const [form, setForm] = useState<ProfileForm>({
    first_name: '', last_name: '', email: '', phone: '', birth_date: '',
  });
  const [pwForm, setPwForm] = useState<PasswordForm>({
    current_password: '', new_password: '', confirm_password: '',
  });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [showPwSection, setShowPwSection] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
  }, [_hasHydrated, isAuthenticated]);

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        birth_date: user.birth_date || '',
      });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await authApi.updateProfile(form);
      setUser(data);
      toast.success('اطلاعات با موفقیت ذخیره شد');
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: Record<string, unknown> } }).response?.data;
      const msg = errData ? Object.values(errData).flat().join(' — ') : 'خطا در ذخیره اطلاعات';
      toast.error(msg as string);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      toast.error('رمز عبور جدید و تکرار آن مطابقت ندارند');
      return;
    }
    if (pwForm.new_password.length < 8) {
      toast.error('رمز عبور باید حداقل ۸ کاراکتر باشد');
      return;
    }
    setChangingPw(true);
    try {
      await authApi.changePassword({
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      toast.success('رمز عبور با موفقیت تغییر یافت');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      setShowPwSection(false);
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: Record<string, unknown> } }).response?.data;
      const msg = errData ? Object.values(errData).flat().join(' — ') : 'خطا در تغییر رمز عبور';
      toast.error(msg as string);
    } finally {
      setChangingPw(false);
    }
  };

  if (!_hasHydrated) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!isAuthenticated || !user) return null;

  const initials = (user.first_name?.charAt(0) || user.username.charAt(0)).toUpperCase();

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <nav className="text-sm text-muted mb-6 flex items-center gap-2">
        <Link href="/my-account" className="hover:text-primary">حساب کاربری</Link>
        <span>/</span>
        <span className="text-dark-2">ویرایش حساب</span>
      </nav>

      <h1 className="page-title mb-6">ویرایش حساب کاربری</h1>

      {/* Avatar */}
      <div className="card p-5 mb-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl flex-shrink-0">
          {initials}
        </div>
        <div>
          <div className="font-semibold text-dark-2">{user.first_name} {user.last_name} {!user.first_name && !user.last_name && user.username}</div>
          <div className="text-sm text-muted">{user.email}</div>
          <div className="text-xs text-muted mt-0.5">نام کاربری: <span className="font-mono text-dark-2">{user.username}</span></div>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSave} className="card p-5 mb-4 space-y-4">
        <h2 className="font-bold text-dark-2 mb-2">اطلاعات شخصی</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-2 mb-1">نام</label>
            <input
              value={form.first_name}
              onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
              placeholder="نام"
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-2 mb-1">نام خانوادگی</label>
            <input
              value={form.last_name}
              onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
              placeholder="نام خانوادگی"
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-2 mb-1">ایمیل</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="example@email.com"
              className="input-field w-full"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-2 mb-1">شماره موبایل</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="09xxxxxxxxx"
              className="input-field w-full"
              dir="ltr"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-dark-2 mb-1">تاریخ تولد</label>
            <input
              type="date"
              value={form.birth_date}
              onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))}
              className="input-field w-full"
              dir="ltr"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 flex items-center gap-2">
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                در حال ذخیره...
              </>
            ) : 'ذخیره تغییرات'}
          </button>
        </div>
      </form>

      {/* Password change */}
      <div className="card p-5">
        <button
          onClick={() => setShowPwSection(v => !v)}
          className="w-full flex items-center justify-between font-bold text-dark-2 text-sm"
        >
          <span>تغییر رمز عبور</span>
          <svg className={`w-4 h-4 transition-transform ${showPwSection ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
          </svg>
        </button>

        {showPwSection && (
          <form onSubmit={handlePasswordChange} className="mt-4 space-y-3 border-t border-border-color pt-4">
            <div>
              <label className="block text-sm font-medium text-dark-2 mb-1">رمز عبور فعلی</label>
              <input
                type="password"
                value={pwForm.current_password}
                onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))}
                required
                className="input-field w-full"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-2 mb-1">رمز عبور جدید</label>
              <input
                type="password"
                value={pwForm.new_password}
                onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                required
                minLength={8}
                className="input-field w-full"
                placeholder="حداقل ۸ کاراکتر"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-2 mb-1">تکرار رمز عبور جدید</label>
              <input
                type="password"
                value={pwForm.confirm_password}
                onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))}
                required
                className="input-field w-full"
                placeholder="••••••••"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button type="submit" disabled={changingPw} className="btn-primary px-5 py-2 text-sm">
                {changingPw ? 'در حال ذخیره...' : 'تغییر رمز عبور'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
