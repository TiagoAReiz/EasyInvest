import api from '@/lib/api';
import type { PaywallStatusResponse, CheckoutResponse, SubscriptionResponse } from '@/lib/types';

export async function getPaywallStatus(): Promise<PaywallStatusResponse> {
  const res = await api.get<PaywallStatusResponse>('/subscription/plans/me');
  return res.data;
}

export async function getPublicPlans(): Promise<PaywallStatusResponse> {
  const res = await api.get<PaywallStatusResponse>('/subscription/plans');
  return res.data;
}

export async function createCheckout(planMonths: number): Promise<CheckoutResponse> {
  const res = await api.post<CheckoutResponse>('/subscription/checkout', {
    plan_months: planMonths,
  });
  return res.data;
}

export async function getSubscriptionStatus(): Promise<SubscriptionResponse | null> {
  const res = await api.get<SubscriptionResponse | null>('/subscription/status');
  return res.data;
}
