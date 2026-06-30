import { create } from 'zustand';

const WS_BASE_URL = process.env.EXPO_PUBLIC_API_WS_URL ?? 'ws://localhost:8000';

export interface AgentActivityEntry {
  id: number | string;
  agentName: string;
  actionType: string;
  summary: string;
  createdAt: string;
}

interface AgentState {
  socket: WebSocket | null;
  driverId: string | null;
  connected: boolean;
  activityFeed: AgentActivityEntry[];
  /** Incremented on every `invoice_cleared` event — watch this to trigger a one-shot coin burst. */
  coinBurstSeq: number;
  lastClearedAmount: number | null;
  connect: (driverId: string) => void;
  disconnect: () => void;
}

const MAX_FEED_LENGTH = 25;

const useAgentStore = create<AgentState>((set, get) => ({
  socket: null,
  driverId: null,
  connected: false,
  activityFeed: [],
  coinBurstSeq: 0,
  lastClearedAmount: null,

  connect: (driverId) => {
    const current = get();
    if (current.socket && current.driverId === driverId && current.connected) {
      return;
    }
    current.socket?.close();

    const socket = new WebSocket(`${WS_BASE_URL}/ws/${driverId}`);

    socket.onopen = () => set({ connected: true });
    socket.onclose = () => set({ connected: false });
    socket.onerror = () => set({ connected: false });
    socket.onmessage = (event) => {
      let data: any;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      if (data.type === 'agent_action') {
        set((state) => ({
          activityFeed: [
            {
              id: data.id,
              agentName: data.agent_name,
              actionType: data.action_type,
              summary: data.summary,
              createdAt: data.created_at,
            },
            ...state.activityFeed,
          ].slice(0, MAX_FEED_LENGTH),
        }));
      } else if (data.type === 'invoice_cleared') {
        set((state) => ({
          coinBurstSeq: state.coinBurstSeq + 1,
          lastClearedAmount: data.net_amount ?? data.gross_amount ?? null,
        }));
      }
    };

    set({ socket, driverId, connected: false });
  },

  disconnect: () => {
    get().socket?.close();
    set({ socket: null, driverId: null, connected: false });
  },
}));

export default useAgentStore;
