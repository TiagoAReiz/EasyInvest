import api from '@/lib/api';
import type { NotificationResponse } from '@/lib/types';

export async function getNotifications(unreadOnly = false): Promise<NotificationResponse[]> {
  const res = await api.get<NotificationResponse[]>('/notifications', {
    params: unreadOnly ? { unread_only: true } : {},
  });
  return res.data;
}

export async function getUnreadCount(): Promise<number> {
  const res = await api.get<{ count: number }>('/notifications/unread-count');
  return res.data.count;
}

export async function markAsRead(id: string): Promise<NotificationResponse> {
  const res = await api.patch<NotificationResponse>(`/notifications/${id}/read`);
  return res.data;
}

export async function markAllAsRead(): Promise<void> {
  await api.post('/notifications/mark-all-read');
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`);
}
