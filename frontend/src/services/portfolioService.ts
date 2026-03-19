import api from '@/lib/api';
import type {
  PositionWithQuote,
  PortfolioSummary,
  PositionCreateRequest,
  PositionUpdateRequest,
} from '@/lib/types';

export async function getPortfolio(): Promise<PositionWithQuote[]> {
  const res = await api.get<PositionWithQuote[]>('/portfolio');
  return res.data;
}

export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  const res = await api.get<PortfolioSummary>('/portfolio/summary');
  return res.data;
}

export async function createPosition(data: PositionCreateRequest): Promise<PositionWithQuote> {
  const res = await api.post<PositionWithQuote>('/portfolio/position', data);
  return res.data;
}

export async function updatePosition(positionId: string, data: PositionUpdateRequest): Promise<PositionWithQuote> {
  const res = await api.put<PositionWithQuote>(`/portfolio/position/${positionId}`, data);
  return res.data;
}

export async function deletePosition(positionId: string): Promise<void> {
  await api.delete(`/portfolio/position/${positionId}`);
}
