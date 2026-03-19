import api from '@/lib/api';
import type { AssetResponse } from '@/lib/types';

export async function searchAssets(query: string): Promise<AssetResponse[]> {
  const res = await api.get<AssetResponse[]>('/assets/search', {
    params: { q: query },
  });
  return res.data;
}
