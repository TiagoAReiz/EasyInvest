import api from '@/lib/api';
import type { ConnectionResponse, ConnectionCreateRequest } from '@/lib/types';

export async function getConnections(): Promise<ConnectionResponse[]> {
  const res = await api.get<ConnectionResponse[]>('/connections');
  return res.data;
}

export async function createConnection(data: ConnectionCreateRequest): Promise<ConnectionResponse> {
  const res = await api.post<ConnectionResponse>('/connections', data);
  return res.data;
}

export async function deleteConnection(connectionId: string): Promise<void> {
  await api.delete(`/connections/${connectionId}`);
}

export async function syncConnection(connectionId: string): Promise<ConnectionResponse> {
  const res = await api.post<ConnectionResponse>(`/connections/${connectionId}/sync`);
  return res.data;
}
