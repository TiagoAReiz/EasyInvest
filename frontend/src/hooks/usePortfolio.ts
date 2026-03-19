'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPortfolio, getPortfolioSummary } from '@/services/portfolioService';
import type { PositionWithQuote, PortfolioSummary } from '@/lib/types';

export function usePortfolio() {
  const [positions, setPositions] = useState<PositionWithQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPortfolio();
      setPositions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar posições');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { positions, isLoading, error, refetch };
}

export function usePortfolioSummary() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPortfolioSummary();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar resumo');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { summary, isLoading, error, refetch };
}
