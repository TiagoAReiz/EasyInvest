import api from '@/lib/api';
import type { AssetResponse } from '@/lib/types';

export async function searchAssets(query: string): Promise<AssetResponse[]> {
  const res = await api.get<AssetResponse[]>('/assets/search', {
    params: { q: query },
  });
  return res.data;
}

export async function createFixedIncomeAsset(name: string): Promise<AssetResponse> {
  const res = await api.post<AssetResponse>('/assets/fixed-income', { name });
  return res.data;
}

export async function getAssetCurrentPrice(assetId: string): Promise<number | null> {
  try {
    const res = await api.get<{ asset_id: string; ticker: string; price: number | null }>(
      `/assets/${assetId}/price`
    );
    return res.data.price;
  } catch {
    return null;
  }
}
