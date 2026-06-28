'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { callcenterApi } from '@/lib/api';

type CallState =
  | 'idle' | 'connecting' | 'listening' | 'thinking'
  | 'speaking' | 'ended' | 'error' | 'unsupported';

interface Turn { role: 'caller' | 'agent'; text: string; }

function newKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID().replace(/-/g, '');
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

/** Strip markdown/URLs so the text-to-speech reads cleanly. */
function stripForSpeech(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[*_`#>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const PhoneIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

export default function CallWidget() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [supported, setSupported] = useState(true);
  const [callState, setCallStateRaw] = useState<CallState>('idle');
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [interim, setInterim] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [aiPowered, setAiPowered] = useState(false);
  const [showCb, setShowCb] = useState(false);
  const [cb, setCb] = useState({ name: '', phone: '', message: '' });
  const [cbSending, setCbSending] = useState(false);

  const recRef = useRef<any>(null);
  const sessionRef = useRef('');
  const activeRef = useRef(false);
  const mutedRef = useRef(false);
  const stateRef = useRef<CallState>('idle');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const setCallState = (s: CallState) => { stateRef.current = s; setCallStateRaw(s); };

  useEffect(() => {
    setMounted(true);
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SR && 'speechSynthesis' in window);
    // Warm up the voice list (loads async on most browsers).
    if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, interim, callState]);

  // Cleanup on unmount
  useEffect(() => () => { teardown(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Speech synthesis ──────────────────────────────────────────────────────
  const pickVoice = (): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis?.getVoices() || [];
    return voices.find((v) => /^fa\b/i.test(v.lang) || v.lang?.toLowerCase().startsWith('fa')) || null;
  };

  const speak = (text: string) =>
    new Promise<void>((resolve) => {
      if (!('speechSynthesis' in window) || !text) { resolve(); return; }
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(stripForSpeech(text));
        u.lang = 'fa-IR';
        const v = pickVoice();
        if (v) u.voice = v;
        u.rate = 1; u.pitch = 1;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        window.speechSynthesis.speak(u);
      } catch { resolve(); }
    });

  // ── Recognition control ───────────────────────────────────────────────────
  const startRec = () => {
    const rec = recRef.current;
    if (!rec || mutedRef.current) return;
    try { rec.start(); } catch { /* already started */ }
  };
  const stopRec = (abort = false) => {
    const rec = recRef.current;
    if (!rec) return;
    try { if (abort) rec.abort(); else rec.stop(); } catch { /* noop */ }
  };

  const handleUtterance = async (raw: string) => {
    const text = raw.trim();
    if (!text || !activeRef.current) { startRec(); return; }
    stopRec();
    setInterim('');
    setTranscript((t) => [...t, { role: 'caller', text }]);
    setCallState('thinking');
    let reply = '';
    try {
      const { data } = await callcenterApi.turn(sessionRef.current, text);
      reply = data.reply || '';
      if (typeof data.ai_powered === 'boolean') setAiPowered(data.ai_powered);
    } catch {
      reply = 'متأسفم، مشکلی پیش اومد. دوباره بفرمایید.';
    }
    if (!activeRef.current) return;
    setTranscript((t) => [...t, { role: 'agent', text: reply }]);
    setCallState('speaking');
    await speak(reply);
    if (!activeRef.current) return;
    setCallState('listening');
    startRec();
  };

  // ── Call lifecycle ────────────────────────────────────────────────────────
  const startCall = async () => {
    if (!supported) { setCallState('unsupported'); return; }
    activeRef.current = true;
    mutedRef.current = false;
    setMuted(false);
    setTranscript([]); setInterim(''); setElapsed(0); setShowCb(false);
    setCallState('connecting');
    sessionRef.current = newKey();

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'fa-IR';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      let interimText = '', finalText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interimText += res[0].transcript;
      }
      if (interimText) setInterim(interimText);
      if (finalText) handleUtterance(finalText);
    };
    rec.onerror = (e: any) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        activeRef.current = false;
        setCallState('error');
      }
    };
    rec.onend = () => {
      if (activeRef.current && stateRef.current === 'listening' && !mutedRef.current) {
        try { rec.start(); } catch { /* noop */ }
      }
    };
    recRef.current = rec;

    startTimeRef.current = Date.now();
    timerRef.current = setInterval(
      () => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);

    let greeting = 'سلام، به پشتیبانی صوتی فروشگاه قطعات خودرو خوش آمدید. بفرمایید چه کمکی می‌تونم بکنم؟';
    try {
      const { data } = await callcenterApi.start({ session_key: sessionRef.current });
      sessionRef.current = data.session_key || sessionRef.current;
      setAiPowered(!!data.ai_powered);
      if (data.greeting) greeting = data.greeting;
    } catch { /* greet locally */ }

    if (!activeRef.current) return;
    setTranscript([{ role: 'agent', text: greeting }]);
    setCallState('speaking');
    await speak(greeting);
    if (!activeRef.current) return;
    setCallState('listening');
    startRec();
  };

  const teardown = () => {
    activeRef.current = false;
    stopRec(true);
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const endCall = async () => {
    const dur = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
    teardown();
    setCallState('ended');
    if (sessionRef.current) {
      try { await callcenterApi.end(sessionRef.current, { duration_seconds: dur }); } catch { /* noop */ }
    }
  };

  const closePanel = () => { if (activeRef.current) endCall(); setOpen(false); };
  const openAndCall = () => { setOpen(true); startCall(); };

  const toggleMute = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next) stopRec(true);
    else if (stateRef.current === 'listening') startRec();
  };

  const submitCallback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cb.name.trim() || !cb.phone.trim()) { toast.error('نام و شماره تماس را وارد کنید'); return; }
    setCbSending(true);
    try {
      await callcenterApi.callback({ ...cb, session_key: sessionRef.current });
      toast.success('درخواست تماس شما ثبت شد ✅');
      setShowCb(false); setCb({ name: '', phone: '', message: '' });
    } catch { toast.error('خطا در ثبت درخواست'); }
    finally { setCbSending(false); }
  };

  if (!mounted) return null;

  const inCall = ['connecting', 'listening', 'thinking', 'speaking'].includes(callState);

  const statusLabel: Record<CallState, string> = {
    idle: '', connecting: 'در حال اتصال…', listening: 'در حال شنیدن… صحبت کنید',
    thinking: 'در حال پردازش…', speaking: 'در حال صحبت…', ended: 'تماس پایان یافت',
    error: 'دسترسی میکروفون لازم است', unsupported: 'مرورگر شما پشتیبانی نمی‌کند',
  };

  return (
    <>
      {/* ── Launcher (phone) — stacked above the chat button ── */}
      {!open && (
        <button
          onClick={openAndCall}
          aria-label="تماس صوتی با پشتیبانی"
          className="fixed bottom-[5.5rem] left-5 z-[60] flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/40 hover:scale-105 active:scale-95 transition-transform"
          style={{ animation: 'scaleIn 0.25s ease-out' }}
        >
          <span className="absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-40 animate-ping" />
          <PhoneIcon className="w-6 h-6 relative" />
        </button>
      )}

      {/* ── Call panel ── */}
      {open && (
        <div
          className="fixed inset-0 z-[71] flex flex-col bg-white sm:inset-auto sm:bottom-6 sm:left-6 sm:w-[24rem] sm:h-[600px] sm:max-h-[82vh] sm:rounded-2xl sm:shadow-2xl sm:border sm:border-gray-200 overflow-hidden"
          style={{ animation: 'scaleIn 0.2s ease-out' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-l from-blue-700 to-blue-600 text-white shrink-0">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <PhoneIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm leading-tight">پشتیبانی صوتی</div>
              <div className="text-[11px] text-white/80">
                {inCall ? `در حال تماس · ${fmtTime(elapsed)}` : 'مرکز تماس فروشگاه'}
              </div>
            </div>
            <button onClick={closePanel} aria-label="بستن"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Status orb */}
          <div className="flex flex-col items-center justify-center py-5 bg-gradient-to-b from-blue-50 to-white shrink-0 border-b border-gray-100">
            <div className="relative w-20 h-20 flex items-center justify-center">
              {(callState === 'listening' || callState === 'speaking') && (
                <>
                  <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400/30 animate-ping" />
                  <span className="absolute inline-flex h-16 w-16 rounded-full bg-blue-400/40 animate-pulse" />
                </>
              )}
              <div className={`relative w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg ${
                callState === 'error' || callState === 'unsupported' ? 'bg-red-500'
                : callState === 'ended' ? 'bg-gray-400'
                : callState === 'thinking' ? 'bg-amber-500' : 'bg-gradient-to-br from-blue-600 to-blue-700'}`}>
                {callState === 'thinking' ? (
                  <span className="inline-flex gap-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                ) : muted ? (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 9l4 4m0-4l-4 4" /></svg>
                ) : (
                  <PhoneIcon className="w-7 h-7" />
                )}
              </div>
            </div>
            <div className="mt-3 text-sm font-medium text-gray-700">{statusLabel[callState]}</div>
            {callState === 'listening' && interim && (
              <div className="mt-1 text-xs text-blue-600 px-4 text-center line-clamp-2">«{interim}»</div>
            )}
            {aiPowered && inCall && (
              <div className="mt-1 text-[10px] text-gray-400">🤖 پاسخگوی هوش مصنوعی</div>
            )}
          </div>

          {/* Transcript */}
          <div className="flex-1 overflow-y-auto px-3.5 py-4 bg-gray-50 flex flex-col gap-2.5">
            {transcript.length === 0 && !inCall && callState !== 'ended' && (
              <div className="text-center text-gray-400 text-sm mt-8 px-6">
                {callState === 'unsupported'
                  ? 'مرورگر شما از تماس صوتی پشتیبانی نمی‌کند. لطفاً از Chrome یا Edge استفاده کنید یا درخواست تماس ثبت کنید.'
                  : callState === 'error'
                  ? 'برای تماس صوتی باید اجازه دسترسی به میکروفون را بدهید.'
                  : 'برای شروع گفتگو، تماس را برقرار کنید.'}
              </div>
            )}
            {transcript.map((t, i) =>
              t.role === 'caller' ? (
                <div key={i} className="self-end max-w-[85%] bg-gradient-to-br from-blue-600 to-blue-700 text-white text-[13px] leading-6 rounded-2xl rounded-br-md px-3.5 py-2 shadow-sm whitespace-pre-wrap break-words">
                  {t.text}
                </div>
              ) : (
                <div key={i} className="self-start max-w-[88%] bg-white text-dark-2 text-[13px] leading-6 rounded-2xl rounded-bl-md px-3.5 py-2 shadow-sm border border-gray-100 break-words">
                  {t.text}
                </div>
              )
            )}
            <div ref={scrollRef} />
          </div>

          {/* Callback form */}
          {showCb && (
            <form onSubmit={submitCallback} className="border-t border-gray-100 bg-white px-3.5 py-3 space-y-2 shrink-0">
              <div className="text-xs font-medium text-gray-600">درخواست تماس از طرف کارشناس</div>
              <div className="flex gap-2">
                <input value={cb.name} onChange={(e) => setCb({ ...cb, name: e.target.value })} placeholder="نام"
                  className="flex-1 min-w-0 bg-gray-100 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                <input value={cb.phone} onChange={(e) => setCb({ ...cb, phone: e.target.value })} placeholder="شماره تماس" inputMode="tel"
                  className="flex-1 min-w-0 bg-gray-100 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={cbSending}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-[13px] font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {cbSending ? 'در حال ثبت…' : 'ثبت درخواست'}
                </button>
                <button type="button" onClick={() => setShowCb(false)}
                  className="px-3 bg-gray-100 text-gray-600 rounded-lg py-2 text-[13px] hover:bg-gray-200 transition-colors">
                  انصراف
                </button>
              </div>
            </form>
          )}

          {/* Controls */}
          <div className="border-t border-gray-100 bg-white px-3 py-3 shrink-0 flex items-center justify-center gap-3">
            {inCall ? (
              <>
                <button onClick={toggleMute} title={muted ? 'فعال‌کردن میکروفون' : 'بی‌صدا'}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${muted ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11a7 7 0 01-14 0m7 7v3m-4-13a4 4 0 018 0v4a4 4 0 01-8 0V5z" /></svg>
                </button>
                <button onClick={endCall} title="پایان تماس"
                  className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg shadow-red-500/40">
                  <svg className="w-6 h-6 rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </button>
                <button onClick={() => setShowCb((v) => !v)} title="درخواست تماس کارشناس"
                  className="w-12 h-12 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </button>
              </>
            ) : (
              <>
                <button onClick={startCall}
                  className="flex-1 bg-gradient-to-l from-blue-700 to-blue-600 text-white rounded-xl py-3 text-sm font-bold hover:opacity-95 transition-opacity flex items-center justify-center gap-2">
                  <PhoneIcon className="w-5 h-5" />
                  {callState === 'ended' ? 'تماس مجدد' : 'برقراری تماس'}
                </button>
                <button onClick={() => setShowCb((v) => !v)}
                  className="px-4 bg-gray-100 text-gray-700 rounded-xl py-3 text-sm font-medium hover:bg-gray-200 transition-colors">
                  درخواست تماس
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
