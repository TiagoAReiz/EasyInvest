import api from '@/lib/api';
import type { UserSettings, UserSettingsUpdate } from '@/lib/types';

export async function getSettings(): Promise<UserSettings> {
  const res = await api.get<UserSettings>('/settings');
  return res.data;
}

export async function updateSettings(data: UserSettingsUpdate): Promise<UserSettings> {
  const res = await api.patch<UserSettings>('/settings', data);
  return res.data;
}
