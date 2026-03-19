import axios from 'axios';
import { setTokens, ApiError } from '@/lib/api';
import type { TokenResponse, UserResponse } from '@/lib/types';
import api from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function loginWithGoogle(idToken: string): Promise<TokenResponse> {
  try {
    const res = await axios.post<TokenResponse>(`${API_URL}/auth/login`, {
      id_token: idToken,
    });
    setTokens(res.data);
    return res.data;
  } catch {
    throw new ApiError(401, 'Falha ao autenticar com Google');
  }
}

export async function getMe(): Promise<UserResponse> {
  const res = await api.get<UserResponse>('/auth/me');
  return res.data;
}
