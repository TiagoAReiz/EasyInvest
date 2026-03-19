import api from '@/lib/api';
import type { HistoryEntry } from '@/lib/types';

export async function getHistory(period: string = '30d'): Promise<HistoryEntry[]> {
  const res = await api.get<HistoryEntry[]>('/portfolio/history', {
    params: { period },
  });
  return res.data;
}
