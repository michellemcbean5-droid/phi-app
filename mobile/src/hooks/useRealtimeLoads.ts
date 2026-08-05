// Real-time loads hook — subscribes to load board WebSocket events and
// keeps the Zustand loads store in sync with live updates.

import { useCallback, useEffect, useState } from 'react';
import { onEvent, onStatus, getStatus } from '../api/realtimeManager';
import useLoadsStore from '../store/loadsStore';
import { Load } from '../workers/workers-15x';

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected' | 'offline';

export const useRealtimeLoads = (): { status: RealtimeStatus } => {
  const { activeLoads, setLoads } = useLoadsStore();
  const [status, setStatus] = useState<RealtimeStatus>(getStatus() as RealtimeStatus);

  const handleNewLoad = useCallback(
    (event: { payload: Load }) => {
      if (!event?.payload?.id) return;
      const exists = activeLoads.some((l) => l.id === event.payload.id);
      if (!exists) setLoads([event.payload, ...activeLoads].slice(0, 100));
    },
    [activeLoads, setLoads],
  );

  const handleLoadUpdated = useCallback(
    (event: { payload: Load }) => {
      if (!event?.payload?.id) return;
      const updated = activeLoads.map((l) =>
        l.id === event.payload.id ? { ...l, ...event.payload } : l,
      );
      setLoads(updated);
    },
    [activeLoads, setLoads],
  );

  const handleLoadExpired = useCallback(
    (event: { payload: { id: string } }) => {
      if (!event?.payload?.id) return;
      setLoads(activeLoads.filter((l) => l.id !== event.payload.id));
    },
    [activeLoads, setLoads],
  );

  useEffect(() => {
    const unsubNew = onEvent<Load>('load.new', (e) => handleNewLoad({ payload: e.payload }));
    const unsubUpdated = onEvent<Load>('load.updated', (e) => handleLoadUpdated({ payload: e.payload }));
    const unsubExpired = onEvent<{ id: string }>('load.expired', (e) =>
      handleLoadExpired({ payload: e.payload }),
    );
    return () => {
      unsubNew();
      unsubUpdated();
      unsubExpired();
    };
  }, [handleNewLoad, handleLoadUpdated, handleLoadExpired]);

  useEffect(() => {
    const unsub = onStatus((s) => setStatus(s as RealtimeStatus));
    return unsub;
  }, []);

  return { status };
};
