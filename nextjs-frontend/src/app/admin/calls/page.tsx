'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { callcenterApi } from '@/lib/api';
import { Call, CallbackRequest, CallStats } from '@/types';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

const CALL_STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: 'در حال انجام', cls: 'bg-blue-100 text-blue-700' },
  completed: { label: 'پایان‌یافته', cls: 'bg-green-100 text-green-700' },
  callback: { label: 'تماس مجدد', cls: 'bg-amber-100 text-amber-700' },
  missed: { label: 'بی‌پاسخ', cls: 'bg-red-100 text-red-700' },
};
const CB_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'در انتظار', cls: 'bg-yellow-100 text-yellow-700' },
  in_progress: { label: 'در حال پیگیری', cls: 'bg-blue-100 text-blue-700' },
  done: { label: 'انجام شد', cls: 'bg-green-100 text-green-700' },
  canceled: { label: 'لغو شد', cls: 'bg-gray-100 text-gray-600' },
};

function fmtDur(s: number): string {
  if (!s) return '—';
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
    </div>
  );
}

export default function CallCenterPage() {
  const [stats, setStats] = useState<CallStats | null>(null);
  const [tab, setTab] = useState<'calls' | 'callbacks'>('calls');
  const [calls, setCalls] = useState<Call[]>([]);
  const [callbacks, setCallbacks] = useState<CallbackRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadStats = useCallback(() => {
    callcenterApi.stats().then(r => setStats(r.data)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'calls') {
        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (statusFilter) params.status = statusFilter;
        const { data } = await callcenterApi.calls(params);
        setCalls(data.results || data);
      } else {
        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (statusFilter) params.status = statusFilter;
        const { data } = await callcenterApi.callbacks(params);
        setCallbacks(data.results || data);
      }
    } finally { setLoading(false); }
  }, [tab, search, statusFilter]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { load(); }, [load]);

  const updateCallbackStatus = async (id: number, status: string) => {
    try {
      await callcenterApi.updateCallback(id, { status });
      setCallbacks(cs => cs.map(c => c.id === id ? { ...c, status } : c));
      toast.success('وضعیت بروزرسانی شد');
      loadStats();
    } catch { toast.error('خطا'); }
  };

  const switchTab = (t: 'calls' | 'callbacks') => { setTab(t); setStatusFilter(''); setSearch(''); };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">مرکز تماس</h1>
        <p className="text-sm text-gray-500 mt-0.5">مدیریت تماس‌های صوتی و درخواست‌های تماس مجدد</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="تماس فعال" value={stats?.active_calls ?? '—'} color="bg-blue-50 text-blue-600"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>} />
        <StatCard label="تماس امروز" value={stats?.calls_today ?? '—'} color="bg-green-50 text-green-600"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
        <StatCard label="کل تماس‌ها" value={stats?.total_calls ?? '—'} color="bg-indigo-50 text-indigo-600"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>} />
        <StatCard label="تماس مجدد در انتظار" value={stats?.pending_callbacks ?? '—'} color="bg-amber-50 text-amber-600"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="میانگین مدت" value={fmtDur(stats?.avg_duration ?? 0)} color="bg-purple-50 text-purple-600"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => switchTab('calls')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'calls' ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary'}`}>
          تماس‌های صوتی
        </button>
        <button onClick={() => switchTab('callbacks')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'callbacks' ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary'}`}>
          درخواست‌های تماس
          {stats?.pending_callbacks ? <span className="me-1 inline-flex items-center justify-center w-5 h-5 text-[10px] bg-red-500 text-white rounded-full">{stats.pending_callbacks}</span> : null}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-wrap gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="جستجو نام، شماره تماس..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary flex-1 min-w-48" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
          <option value="">همه وضعیت‌ها</option>
          {Object.entries(tab === 'calls' ? CALL_STATUS : CB_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <div className="flex justify-center py-16"><Spinner /></div>
          : tab === 'calls' ? (
            calls.length === 0 ? <div className="text-center py-16 text-gray-400">تماسی یافت نشد</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr className="text-right">
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">تماس‌گیرنده</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">وضعیت</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">پاسخگو</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">گفتگو</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">مدت</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">زمان</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {calls.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{c.caller_name || c.user_name || 'مهمان'}</div>
                          <div className="text-gray-400 text-xs font-mono" dir="ltr">{c.caller_phone || c.session_key.slice(0, 8)}</div>
                        </td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${CALL_STATUS[c.status]?.cls || 'bg-gray-100 text-gray-600'}`}>{CALL_STATUS[c.status]?.label || c.status}</span></td>
                        <td className="px-4 py-3 text-xs">{c.ai_powered ? <span className="text-primary">🤖 هوش مصنوعی</span> : <span className="text-gray-500">آفلاین</span>}</td>
                        <td className="px-4 py-3 text-gray-600">{c.turn_count} پیام</td>
                        <td className="px-4 py-3 text-gray-600 font-mono" dir="ltr">{fmtDur(c.duration_seconds)}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{new Date(c.started_at).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td className="px-4 py-3"><Link href={`/admin/calls/${c.id}`} className="text-xs text-blue-600 hover:underline">مشاهده گفتگو</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            callbacks.length === 0 ? <div className="text-center py-16 text-gray-400">درخواستی یافت نشد</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr className="text-right">
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">نام</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">شماره تماس</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">موضوع</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">وضعیت</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">تاریخ</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">تغییر وضعیت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {callbacks.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                        <td className="px-4 py-3 font-mono text-gray-600" dir="ltr">{c.phone}</td>
                        <td className="px-4 py-3 text-gray-600">{c.topic || c.message?.slice(0, 30) || '—'}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${CB_STATUS[c.status]?.cls || 'bg-gray-100 text-gray-600'}`}>{CB_STATUS[c.status]?.label || c.status}</span></td>
                        <td className="px-4 py-3 text-xs text-gray-400">{new Date(c.created_at).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td className="px-4 py-3">
                          <select value={c.status} onChange={e => updateCallbackStatus(c.id, e.target.value)}
                            className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-primary">
                            {Object.entries(CB_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
      </div>
    </div>
  );
}
