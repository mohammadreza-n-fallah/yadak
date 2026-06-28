'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ChatRole = 'user' | 'assistant';
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

const safeStorage = createJSONStorage(() =>
  typeof window !== 'undefined' ? localStorage : {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }
);

function newSessionKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface ChatState {
  sessionKey: string;
  messages: ChatMessage[];
  isOpen: boolean;
  seen: boolean;            // user has opened the widget at least once
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  ensureSession: () => string;
  open: () => void;
  close: () => void;
  toggle: () => void;
  pushUser: (content: string) => void;
  startAssistant: () => void;
  appendAssistant: (chunk: string) => void;
  setAssistant: (content: string) => void;
  clear: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessionKey: '',
      messages: [],
      isOpen: false,
      seen: false,
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      ensureSession: () => {
        let key = get().sessionKey;
        if (!key) {
          key = newSessionKey();
          set({ sessionKey: key });
        }
        return key;
      },

      open: () => set({ isOpen: true, seen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen, seen: true })),

      pushUser: (content) =>
        set((s) => ({ messages: [...s.messages, { role: 'user', content }] })),

      startAssistant: () =>
        set((s) => ({ messages: [...s.messages, { role: 'assistant', content: '' }] })),

      appendAssistant: (chunk) =>
        set((s) => {
          const msgs = s.messages.slice();
          const last = msgs[msgs.length - 1];
          if (last && last.role === 'assistant') {
            msgs[msgs.length - 1] = { ...last, content: last.content + chunk };
          }
          return { messages: msgs };
        }),

      setAssistant: (content) =>
        set((s) => {
          const msgs = s.messages.slice();
          const last = msgs[msgs.length - 1];
          if (last && last.role === 'assistant') {
            msgs[msgs.length - 1] = { ...last, content };
          } else {
            msgs.push({ role: 'assistant', content });
          }
          return { messages: msgs };
        }),

      clear: () => set({ messages: [], sessionKey: newSessionKey() }),
    }),
    {
      name: 'support-chat',
      storage: safeStorage,
      partialize: (s) => ({ sessionKey: s.sessionKey, messages: s.messages, seen: s.seen }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);
