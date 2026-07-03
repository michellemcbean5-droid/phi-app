import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  /** Driver-supplied instructions ("train Michelle") — folded into her system prompt when Claude is configured. */
  customInstructions: string;
  addMessage: (from: SupportMessage['from'], text: string) => void;
  setThinking: (thinking: boolean) => void;
  setCustomInstructions: (value: string) => void;
}

const useSupportChatStore = create<SupportChatState>()(
  persist(
    (set) => ({
      messages: [],
      thinking: false,
      customInstructions: '',
      addMessage: (from, text) =>
        set((state) => ({
          messages: [
            ...state.messages,
            { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, from, text, timestamp: new Date().toISOString() },
          ].slice(-MAX_MESSAGES),
        })),
      setThinking: (thinking) => set({ thinking }),
      setCustomInstructions: (value) => set({ customInstructions: value }),
    }),
    {
      name: 'phi_support_chat_store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ customInstructions: state.customInstructions }),
    },
  ),
);

export default useSupportChatStore;
