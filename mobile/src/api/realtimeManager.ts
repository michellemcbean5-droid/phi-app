// Real-time connection manager for PHI
// Provides WebSocket connection with auto-reconnect, heartbeat, offline queue,
// and auth token refresh. Falls back gracefully when offline.

import { AppState, AppStateStatus } from 'react-native';


type EventType =
  | 'load.new'
  | 'load.updated'
  | 'load.expired'
  | 'dispatch.status'
  | 'bid.accepted'
  | 'bid.rejected'
  | 'presence.join'
  | 'presence.leave';

export interface RealtimeEvent<T = unknown> {
  type: EventType;
  payload: T;
  timestamp: string;
  id: string;
}

type EventHandler<T = unknown> = (event: RealtimeEvent<T>) => void;

interface ConnectionManagerConfig {
  url: string;
  getAuthToken: () => Promise<string>;
  heartbeatIntervalMs?: number;
  reconnectBaseMs?: number;
  reconnectMaxMs?: number;
  offlineQueueLimit?: number;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'offline';

let statusListeners: Array<(status: ConnectionStatus) => void> = [];
let eventListeners: Map<string, EventHandler[]> = new Map();

let ws: WebSocket | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
let currentStatus: ConnectionStatus = 'disconnected';
let config: ConnectionManagerConfig | null = null;
let offlineQueue: Array<RealtimeEvent> = [];
let networkAvailable = true;

const emit = (status: ConnectionStatus): void => {
  currentStatus = status;
  statusListeners.forEach((fn) => fn(status));
};

const dispatchEvent = <T>(event: RealtimeEvent<T>): void => {
  const handlers = eventListeners.get(event.type) ?? [];
  const wildcardHandlers = eventListeners.get('*') ?? [];
  [...handlers, ...wildcardHandlers].forEach((fn) => (fn as EventHandler<T>)(event));
};

const clearTimers = (): void => {
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
};

const scheduleReconnect = (): void => {
  if (!config || !networkAvailable) return;
  const base = config.reconnectBaseMs ?? 1000;
  const max = config.reconnectMaxMs ?? 30000;
  const delay = Math.min(base * Math.pow(2, reconnectAttempts), max);
  reconnectAttempts++;
  reconnectTimer = setTimeout(() => void connect(), delay);
};

const startHeartbeat = (): void => {
  if (!config) return;
  const interval = config.heartbeatIntervalMs ?? 30000;
  heartbeatTimer = setInterval(() => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
    }
  }, interval);
};

const flushOfflineQueue = (): void => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  const toFlush = [...offlineQueue];
  offlineQueue = [];
  toFlush.forEach((event) => {
    try { ws?.send(JSON.stringify(event)); } catch { offlineQueue.push(event); }
  });
};

const connect = async (): Promise<void> => {
  if (!config || currentStatus === 'connected' || currentStatus === 'connecting') return;
  if (!networkAvailable) { emit('offline'); return; }

  emit('connecting');
  clearTimers();

  let url = config.url;
  try {
    const token = await config.getAuthToken();
    url = config.url + '?token=' + encodeURIComponent(token);
  } catch {
    // Connect without token; server will reject if required
  }

  try {
    ws = new WebSocket(url);
  } catch {
    emit('disconnected');
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    reconnectAttempts = 0;
    emit('connected');
    startHeartbeat();
    flushOfflineQueue();
  };

  ws.onmessage = (ev) => {
    try {
      const event = JSON.parse(ev.data as string) as RealtimeEvent;
      if (event.type === ('pong' as EventType)) return;
      dispatchEvent(event);
    } catch {
      // Malformed message — ignore
    }
  };

  ws.onerror = () => {
    // onclose will fire after onerror
  };

  ws.onclose = () => {
    clearTimers();
    if (currentStatus !== 'offline') emit('disconnected');
    scheduleReconnect();
  };
};

// ─── Public API ──────────────────────────────────────────────────────────────

/** Initialize the real-time manager. Call once on app startup. */
export const initRealtime = (cfg: ConnectionManagerConfig): void => {
  config = cfg;

  // Reconnect on app foreground
  AppState.addEventListener('change', (nextState: AppStateStatus) => {
    if (nextState === 'active' && currentStatus === 'disconnected') {
      reconnectAttempts = 0;
      void connect();
    }
  });

  void connect();
};

/** Subscribe to a specific event type (or '*' for all). Returns unsubscribe fn. */
export const onEvent = <T = unknown>(
  type: EventType | '*',
  handler: EventHandler<T>,
): (() => void) => {
  const existing = eventListeners.get(type) ?? [];
  eventListeners.set(type, [...existing, handler as EventHandler]);
  return () => {
    const current = eventListeners.get(type) ?? [];
    eventListeners.set(type, current.filter((h) => h !== (handler as EventHandler)));
  };
};

/** Subscribe to connection status changes. Returns unsubscribe fn. */
export const onStatus = (fn: (status: ConnectionStatus) => void): (() => void) => {
  statusListeners.push(fn);
  fn(currentStatus);
  return () => { statusListeners = statusListeners.filter((l) => l !== fn); };
};

/** Publish an event (queued when offline). */
export const publish = (event: Omit<RealtimeEvent, 'id' | 'timestamp'>): void => {
  const full: RealtimeEvent = {
    ...event,
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
  };
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(full));
  } else {
    const limit = config?.offlineQueueLimit ?? 100;
    if (offlineQueue.length < limit) offlineQueue.push(full);
  }
};

/** Get current connection status. */
export const getStatus = (): ConnectionStatus => currentStatus;

/** Manually disconnect and stop reconnecting. */
export const disconnect = (): void => {
  clearTimers();
  ws?.close();
  ws = null;
  reconnectAttempts = 0;
};
