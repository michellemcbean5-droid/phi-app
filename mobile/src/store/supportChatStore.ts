import { create } from 'zustand';

export interface SupportMessage {
  id: string;
  from: 'me' | 'michelle';
  text: string;
  timestamp: string;
}

const MAX_MESSAGES = 100;

interface SupportChatState {
  messages: SupportMessage[];
  thinking: boolean;
  addMessage: (from: SupportMessage['from'], text: string) => void;
  setThinking: (thinking: boolean) => void;
}

const useSupportChatStore = create<SupportChatState>((set) => ({
  messages: [],
  thinking: false,
  addMessage: (from, text) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, from, text, timestamp: new Date().toISOString() },
      ].slice(-MAX_MESSAGES),
    })),
  setThinking: (thinking) => set({ thinking }),
}));

export default useSupportChatStore;
