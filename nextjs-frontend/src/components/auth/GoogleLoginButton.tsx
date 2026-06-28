'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';

/** Google Identity Services types (only what we use). */
interface GoogleCredentialResponse { credential: string }
interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (res: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client';
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

/** Load the Google Identity Services script once and resolve when ready. */
function loadGsi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('gsi load failed')));
      return;
    }
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('gsi load failed'));
    document.head.appendChild(script);
  });
}

export default function GoogleLoginButton({ redirectTo = '/my-account' }: { redirectTo?: string }) {
  const router = useRouter();
  const { login } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Without a configured client ID there is nothing to render.
    if (!CLIENT_ID) return;

    let cancelled = false;
    const handleCredential = async (res: GoogleCredentialResponse) => {
      if (!res.credential) return;
      setLoading(true);
      try {
        const { data } = await authApi.googleLogin(res.credential);
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        const profileRes = await authApi.profile();
        login(data.access, data.refresh, profileRes.data);
        toast.success(data.created ? 'حساب شما با گوگل ساخته شد' : 'با موفقیت وارد شدید');
        router.push(redirectTo);
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
        toast.error(msg || 'ورود با گوگل ناموفق بود');
      } finally {
        setLoading(false);
      }
    };

    loadGsi()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleCredential,
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text: 'continue_with',
          logo_alignment: 'center',
          locale: 'fa',
          width: 320,
        });
      })
      .catch(() => {
        if (!cancelled) toast.error('بارگذاری ورود با گوگل ناموفق بود');
      });

    return () => { cancelled = true; };
  }, [login, router, redirectTo]);

  if (!CLIENT_ID) return null;

  return (
    <div className="mt-5">
      <div className="flex items-center gap-3 mb-4">
        <span className="flex-1 h-px bg-border-color" />
        <span className="text-xs text-muted">یا</span>
        <span className="flex-1 h-px bg-border-color" />
      </div>
      <div className="flex justify-center" aria-busy={loading}>
        {/* Google renders its official button inside this container */}
        <div ref={containerRef} className={loading ? 'opacity-60 pointer-events-none' : ''} />
      </div>
    </div>
  );
}
