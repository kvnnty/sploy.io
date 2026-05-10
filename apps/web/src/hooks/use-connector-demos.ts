'use client';

import { useCallback, useEffect, useState } from 'react';

import type { ConnectorSyncStatus } from '@/lib/connectors/catalog';

export type DemoConnectorPersist = {
  status: ConnectorSyncStatus;
  lastSyncAt: string | null;
};

export function useConnectorDemos(teamId: string | null) {
  const storageKey = teamId ? `sploy.connector-demos:${teamId}` : null;
  const [demos, setDemos] = useState<Record<string, DemoConnectorPersist>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!storageKey) {
      setDemos({});
      setHydrated(true);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      setDemos(raw ? (JSON.parse(raw) as Record<string, DemoConnectorPersist>) : {});
    } catch {
      setDemos({});
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated || !storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(demos));
  }, [demos, storageKey, hydrated]);

  const updateDemo = useCallback((id: string, patch: DemoConnectorPersist) => {
    setDemos((d) => ({ ...d, [id]: patch }));
  }, []);

  const removeDemo = useCallback((id: string) => {
    setDemos((d) => {
      const next = { ...d };
      delete next[id];
      return next;
    });
  }, []);

  return { demos, hydrated, updateDemo, removeDemo };
}
