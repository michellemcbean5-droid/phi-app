import { create } from 'zustand';

export interface RadioMessage {
  id: string;
  speaker: 'Dispatcher' | 'Driver' | 'System';
  text: string;
  timestamp: string;
}

interface RadioState {
  messages: RadioMessage[];
  transmitting: boolean;
  addMessage: (speaker: RadioMessage['speaker'], text: string) => RadioMessage;
  setTransmitting: (value: boolean) => void;
  clear: () => void;
}

const MAX_MESSAGES = 100;

const useRadioStore = create<RadioState>((set) => ({
  messages: [],
  transmitting: false,

  addMessage: (speaker, text) => {
    const message: RadioMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      speaker,
      text,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({
      messages: [...state.messages, message].slice(-MAX_MESSAGES),
    }));
    return message;
  },

  setTransmitting: (value) => set({ transmitting: value }),

  clear: () => set({ messages: [] }),
}));

export default useRadioStore;
