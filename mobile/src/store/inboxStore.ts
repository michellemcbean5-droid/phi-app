import { create } from 'zustand';

export interface InboxMessage {
  id: string;
  from: 'me' | 'them';
  text: string;
  timestamp: string;
}

export interface InboxThread {
  id: string;
  name: string;
  subtitle: string;
  messages: InboxMessage[];
  unread: boolean;
}

interface InboxState {
  threads: InboxThread[];
  addThread: (name: string, subtitle: string) => string;
  sendMessage: (threadId: string, from: InboxMessage['from'], text: string) => void;
  markRead: (threadId: string) => void;
}

const DISPATCH_THREAD_ID = 'dispatch';

const useInboxStore = create<InboxState>((set, get) => ({
  threads: [
    {
      id: DISPATCH_THREAD_ID,
      name: 'PHI Dispatch',
      subtitle: 'Your AI dispatcher',
      messages: [
        {
          id: 'welcome',
          from: 'them',
          text: "You're connected. Send me a message anytime — load questions, route changes, anything.",
          timestamp: new Date().toISOString(),
        },
      ],
      unread: false,
    },
  ],

  addThread: (name, subtitle) => {
    const id = `${Date.now()}`;
    set((state) => ({
      threads: [...state.threads, { id, name, subtitle, messages: [], unread: false }],
    }));
    return id;
  },

  sendMessage: (threadId, from, text) => {
    const message: InboxMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      from,
      text,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({
      threads: state.threads.map((thread) =>
        thread.id === threadId
          ? { ...thread, messages: [...thread.messages, message], unread: from === 'them' }
          : thread,
      ),
    }));
  },

  markRead: (threadId) => {
    set((state) => ({
      threads: state.threads.map((thread) => (thread.id === threadId ? { ...thread, unread: false } : thread)),
    }));
  },
}));

export { DISPATCH_THREAD_ID };
export default useInboxStore;
