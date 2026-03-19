'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getConnections,
  createConnection,
  deleteConnection,
  syncConnection as apiSyncConnection,
} from '@/lib/api';
import type { ConnectionResponse, ConnectionCreateRequest } from '@/lib/types';

export function useConnections() {
  const [connections, setConnections] = useState<ConnectionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getConnections();
      setConnections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar conexões');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const addConnection = useCallback(async (data: ConnectionCreateRequest) => {
    const conn = await createConnection(data);
    setConnections((prev) => [...prev, conn]);
    return conn;
  }, []);

  const removeConnection = useCallback(async (id: string) => {
    await deleteConnection(id);
    setConnections((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const syncConnectionById = useCallback(async (id: string) => {
    const updated = await apiSyncConnection(id);
    setConnections((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  return { connections, isLoading, error, addConnection, removeConnection, syncConnection: syncConnectionById, refetch };
}
