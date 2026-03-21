'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSettings, updateSettings as apiUpdateSettings } from '@/services/settingsService';
import type { UserSettings, UserSettingsUpdate } from '@/lib/types';

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar preferências');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const updateSettings = useCallback(async (data: UserSettingsUpdate) => {
    const updated = await apiUpdateSettings(data);
    setSettings(updated);
    return updated;
  }, []);

  return { settings, isLoading, error, updateSettings, refetch };
}
