import type {
  TokenResponse,
  UserResponse,
  PositionWithQuote,
  PortfolioSummary,
  HistoryEntry,
  AssetResponse,
  ConnectionResponse,
  PositionCreateRequest,
  PositionUpdateRequest,
  ConnectionCreateRequest,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Token management

export function getTokens() {
  if (typeof window === 'undefined') return null;
  const access = localStorage.getItem('access_token');
  const refresh = localStorage.getItem('refresh_token');
  if (!access || !refresh) return null;
  return { access_token: access, refresh_token: refresh };
}

export function setTokens(tokens: TokenResponse) {
  localStorage.setItem('access_token', tokens.access_token);
  localStorage.setItem('refresh_token', tokens.refresh_token);
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

// Error class

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Core fetch wrapper

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const tokens = getTokens();
  if (!tokens) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: tokens.refresh_token }),
    });

    if (!res.ok) return false;

    const data: TokenResponse = await res.json();
    setTokens(data);
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const tokens = getTokens();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (tokens) {
    headers['Authorization'] = `Bearer ${tokens.access_token}`;
  }

  let res = await fetch(`${API_URL}${path}`, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401 && tokens) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = tryRefresh();
    }

    const refreshed = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;

    if (refreshed) {
      const newTokens = getTokens()!;
      headers['Authorization'] = `Bearer ${newTokens.access_token}`;
      res = await fetch(`${API_URL}${path}`, { ...options, headers });
    } else {
      clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new ApiError(401, 'Sessão expirada. Faça login novamente.');
    }
  }

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    let message = 'Erro inesperado';
    try {
      const body = await res.json();
      message = body.detail || body.message || message;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(res.status, message);
  }

  return res.json();
}

// Auth

export async function loginWithGoogle(idToken: string): Promise<TokenResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  });

  if (!res.ok) {
    throw new ApiError(res.status, 'Falha ao autenticar com Google');
  }

  const data: TokenResponse = await res.json();
  setTokens(data);
  return data;
}

export function getMe(): Promise<UserResponse> {
  return apiFetch<UserResponse>('/auth/me');
}

// Portfolio

export function getPortfolio(): Promise<PositionWithQuote[]> {
  return apiFetch<PositionWithQuote[]>('/portfolio');
}

export function getPortfolioSummary(): Promise<PortfolioSummary> {
  return apiFetch<PortfolioSummary>('/portfolio/summary');
}

export function createPosition(data: PositionCreateRequest) {
  return apiFetch<PositionWithQuote>('/portfolio/position', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updatePosition(positionId: string, data: PositionUpdateRequest) {
  return apiFetch<PositionWithQuote>(`/portfolio/position/${positionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deletePosition(positionId: string) {
  return apiFetch<void>(`/portfolio/position/${positionId}`, {
    method: 'DELETE',
  });
}

// History

export function getHistory(period: string = '30d'): Promise<HistoryEntry[]> {
  return apiFetch<HistoryEntry[]>(`/portfolio/history?period=${period}`);
}

// Assets

export function searchAssets(query: string): Promise<AssetResponse[]> {
  return apiFetch<AssetResponse[]>(`/assets/search?q=${encodeURIComponent(query)}`);
}

// Connections

export function getConnections(): Promise<ConnectionResponse[]> {
  return apiFetch<ConnectionResponse[]>('/connections');
}

export function createConnection(data: ConnectionCreateRequest): Promise<ConnectionResponse> {
  return apiFetch<ConnectionResponse>('/connections', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteConnection(connectionId: string) {
  return apiFetch<void>(`/connections/${connectionId}`, {
    method: 'DELETE',
  });
}

export function syncConnection(connectionId: string): Promise<ConnectionResponse> {
  return apiFetch<ConnectionResponse>(`/connections/${connectionId}/sync`, {
    method: 'POST',
  });
}
