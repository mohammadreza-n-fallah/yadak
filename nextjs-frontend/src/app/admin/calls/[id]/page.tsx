'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { callcenterApi } from '@/lib/api';
import { Call } from '@/types';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

const CALL_STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: 'در حال انجام', cls: 'bg-blue-100 text-blue-700' },
  completed: { label: 'پایان‌یافته', cls: 'bg-green-100 text-green-700' },
  callback: { label: 'تماس مجدد', cls: 'bg-amber-100 text-amber-700' },
  missed: { label: 'بی‌پاسخ', cls: 'bg-red-100 text-red-700' },
};

function fmtDur(s: number): string {
  if (!s) return '۰';
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function CallDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [call, setCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await callcenterApi.call(id);
      setCall(data);
      setStatus(data.status);
      setNote(data.staff_note || '');
    } catch { toast.error('تماس یافت نشد'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { if (id) load(); }, [id, load]);

  const save = async () => {
    setSaving(true);
    try {
      await callcenterApi.updateCall(id, { status, staff_note: note });
      toast.success('ذخیره شد');
      setCall(c => c ? { ...c, status, staff_note: note } : c);
    } catch { toast.error('خطا در ذخیره'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!call) return <div className="text-center py-20 text-gray-400">تماس یافت نشد</div>;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/calls" className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-800">{call.caller_name || call.user_name || 'تماس مهمان'}</h1>
            <p className="text-xs text-gray-400 font-mono" dir="ltr">{call.caller_phone || call.session_key}</p>
          </div>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full ${CALL_STATUS[call.status]?.cls}`}>{CALL_STATUS[call.status]?.label}</span>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-xs text-gray-400">مدت</p>
          <p className="font-bold text-gray-800 font-mono" dir="ltr">{fmtDur(call.duration_seconds)}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-xs text-gray-400">تعداد پیام</p>
          <p className="font-bold text-gray-800">{call.turn_count}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-xs text-gray-400">پاسخگو</p>
          <p className="font-bold text-gray-800">{call.ai_powered ? '🤖 هوش مصنوعی' : 'آفلاین'}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-xs text-gray-400">امتیاز مشتری</p>
          <p className="font-bold text-gray-800">{call.rating ? '⭐'.repeat(call.rating) : '—'}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Transcript */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h2 className="font-bold text-gray-700 text-sm mb-4">متن گفتگو</h2>
          <div className="space-y-3">
            {(call.turns || []).length === 0 && <p className="text-center text-gray-400 text-sm py-8">گفتگویی ثبت نشده است</p>}
            {(call.turns || []).map((t, i) => (
              <div key={i} className={t.role === 'caller' ? 'flex flex-col items-end' : 'flex flex-col items-start'}>
                <div className={`max-w-[85%] text-[13px] leading-6 rounded-2xl px-3.5 py-2 ${
                  t.role === 'caller' ? 'bg-blue-600 text-white rounded-br-md' : 'bg-gray-100 text-gray-800 rounded-bl-md'}`}>
                  {t.text}
                </div>
                <span className="text-[10px] text-gray-300 mt-0.5 px-1">
                  {t.role_display} · {new Date(t.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Side: status + note */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
            <h2 className="font-bold text-gray-700 text-sm">مدیریت تماس</h2>
            <div>
              <label className="text-xs text-gray-500 block mb-1">وضعیت</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                {Object.entries(CALL_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">یادداشت کارشناس</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={4}
                placeholder="یادداشت داخلی..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
            </div>
            <button onClick={save} disabled={saving}
              className="w-full bg-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors">
              {saving ? 'در حال ذخیره…' : 'ذخیره تغییرات'}
            </button>
          </div>

          {call.caller_phone && (
            <a href={`tel:${call.caller_phone}`}
              className="flex items-center justify-center gap-2 bg-green-50 text-green-700 rounded-xl py-3 text-sm font-medium hover:bg-green-100 transition-colors border border-green-100">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              تماس با {call.caller_phone}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
