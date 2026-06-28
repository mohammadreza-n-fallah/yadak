'use client';
import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '@/store/chat';
import { supportApi, streamSupport } from '@/lib/api';
import { SupportConfig } from '@/types';

const DEFAULT_CONFIG: SupportConfig = {
  enabled: true,
  ai_powered: false,
  bot_name: 'دستیار هوشمند',
  greeting: 'سلام 👋 چطور می‌تونم کمکتون کنم؟',
  suggestions: [],
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Minimal, XSS-safe rich text: markdown links, **bold**, and line breaks.
 *  Escape first (so any model/user HTML is inert), then linkify the escaped
 *  text — brackets/parens survive escaping and an escaped "&" inside a URL is
 *  valid HTML the browser decodes back. */
function renderRich(text: string): { __html: string } {
  let out = escapeHtml(text);
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_m, label: string, url: string) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary font-medium underline underline-offset-2 hover:text-primary-dark">${label}</a>`
  );
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\n/g, '<br/>');
  return { __html: out };
}

const BotIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M9 3h6m-3 0v3m-7 4h14a1 1 0 011 1v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a1 1 0 011-1zm3 4h.01M15 14h.01M9.5 17.5h5" />
  </svg>
);

export default function ChatWidget() {
  const {
    messages, isOpen, seen, _hasHydrated,
    ensureSession, open, close, pushUser, startAssistant,
    appendAssistant, setAssistant, clear,
  } = useChatStore();

  const [config, setConfig] = useState<SupportConfig>(DEFAULT_CONFIG);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [mounted, setMounted] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    supportApi.config()
      .then((r) => setConfig({ ...DEFAULT_CONFIG, ...r.data }))
      .catch(() => setConfig(DEFAULT_CONFIG));
  }, []);

  useEffect(() => {
    if (isOpen) scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending, isOpen]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || sending) return;

    const key = ensureSession();
    pushUser(text);
    setInput('');
    startAssistant();
    setSending(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let received = false;

    try {
      await streamSupport(
        text, key,
        { onDelta: (chunk) => { received = true; appendAssistant(chunk); } },
        ctrl.signal,
      );
    } catch {
      /* streaming unsupported or network error → fall back below */
    }

    if (!ctrl.signal.aborted && !received) {
      try {
        const { data } = await supportApi.chat(text, key);
        setAssistant(data.reply);
      } catch {
        setAssistant('متأسفم، در حال حاضر ارتباط با پشتیبانی برقرار نشد. لطفاً کمی بعد دوباره تلاش کنید. 🙏');
      }
    }

    setSending(false);
    abortRef.current = null;
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleClear = () => {
    abortRef.current?.abort();
    setSending(false);
    clear();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  if (!mounted || !_hasHydrated) return null;

  const showSuggestions = messages.length === 0 && config.suggestions.length > 0;
  const lastMsg = messages[messages.length - 1];
  const showTyping = sending && lastMsg?.role === 'assistant' && lastMsg.content === '';

  return (
    <>
      {/* ── Launcher button ─────────────────────────────────────── */}
      {!isOpen && (
        <button
          onClick={open}
          aria-label="گفتگو با پشتیبانی"
          className="fixed bottom-5 left-5 z-[60] group flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/40 hover:scale-105 active:scale-95 transition-transform"
          style={{ animation: 'scaleIn 0.25s ease-out' }}
        >
          <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-40 animate-ping" />
          <svg className="w-7 h-7 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.84L3 20l1.17-3.5A7.9 7.9 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {!seen && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-white" />
            </span>
          )}
        </button>
      )}

      {/* ── Chat panel ──────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[70] flex flex-col bg-white sm:inset-auto sm:bottom-6 sm:left-6 sm:w-[24rem] sm:h-[600px] sm:max-h-[80vh] sm:rounded-2xl sm:shadow-2xl sm:border sm:border-gray-200 overflow-hidden"
          style={{ animation: 'scaleIn 0.2s ease-out' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-l from-primary-dark to-primary text-white shrink-0">
            <div className="relative w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <BotIcon className="w-6 h-6" />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-primary-dark rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm leading-tight truncate">{config.bot_name}</div>
              <div className="text-[11px] text-white/80 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                {sending ? 'در حال نوشتن…' : 'آنلاین، آماده پاسخگویی'}
              </div>
            </div>
            <button onClick={handleClear} aria-label="گفتگوی جدید"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button onClick={close} aria-label="بستن"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3.5 py-4 bg-gray-50 flex flex-col gap-3">
            {/* greeting */}
            <div className="flex items-end gap-2 self-start max-w-[85%]">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <BotIcon className="w-4 h-4" />
              </div>
              <div className="bg-white text-dark-2 text-[13px] leading-6 rounded-2xl rounded-bl-md px-3.5 py-2.5 shadow-sm border border-gray-100">
                {config.greeting}
              </div>
            </div>

            {/* suggestions */}
            {showSuggestions && (
              <div className="flex flex-wrap gap-2 self-start ps-9 pt-1">
                {config.suggestions.map((s, i) => (
                  <button key={i} onClick={() => send(s)}
                    className="text-[12px] bg-white border border-primary/30 text-primary rounded-full px-3 py-1.5 hover:bg-primary hover:text-white transition-colors shadow-sm">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* conversation */}
            {messages.map((m, i) =>
              m.role === 'user' ? (
                <div key={i} className="self-end max-w-[85%] bg-gradient-to-br from-primary to-primary-dark text-white text-[13px] leading-6 rounded-2xl rounded-br-md px-3.5 py-2.5 shadow-sm whitespace-pre-wrap break-words">
                  {m.content}
                </div>
              ) : (
                <div key={i} className="flex items-end gap-2 self-start max-w-[88%]">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <BotIcon className="w-4 h-4" />
                  </div>
                  <div className="bg-white text-dark-2 text-[13px] leading-7 rounded-2xl rounded-bl-md px-3.5 py-2.5 shadow-sm border border-gray-100 break-words">
                    {m.content
                      ? <span dangerouslySetInnerHTML={renderRich(m.content)} />
                      : showTyping && (
                        <span className="inline-flex gap-1 py-1">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      )}
                  </div>
                </div>
              )
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 bg-white px-3 py-2.5 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="پیام خود را بنویسید…"
                className="flex-1 resize-none max-h-28 bg-gray-100 rounded-2xl px-4 py-2.5 text-[13px] leading-6 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white border border-transparent focus:border-primary/30 transition-all placeholder:text-gray-400"
              />
              <button
                onClick={() => send(input)}
                disabled={sending || !input.trim()}
                aria-label="ارسال"
                className="w-11 h-11 shrink-0 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <svg className="w-5 h-5 -scale-x-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <div className="text-center text-[10px] text-gray-400 mt-1.5">
              {config.ai_powered ? '🤖 پاسخ‌ها توسط هوش مصنوعی تولید می‌شود' : 'پشتیبانی فروشگاه قطعات خودرو'}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
