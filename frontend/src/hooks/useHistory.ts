'use client';

import { useState, useEffect } from 'react';
import { getHistory } from '@/services/historyService';
import type { HistoryEntry } from '@/lib/types';

export function useHistory(period: string = '30d') {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getHistory(period)
      .then((data) => {
        if (!cancelled) {
          // Ordena por data ASC para o gráfico
          const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
          setHistory(sorted);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar histórico');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [period]);

  return { history, isLoading, error };
}
