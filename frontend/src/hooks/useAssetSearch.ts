'use client';

import { useState, useRef, useCallback } from 'react';
import { searchAssets } from '@/services/assetService';
import type { AssetResponse } from '@/lib/types';

export function useAssetSearch() {
  const [results, setResults] = useState<AssetResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((query: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!query || query.length < 1) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await searchAssets(query);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  return { results, isSearching, search };
}
