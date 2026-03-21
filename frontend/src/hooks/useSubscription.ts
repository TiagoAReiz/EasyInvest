'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPaywallStatus } from '@/services/subscriptionService';
import type { PaywallStatusResponse, PlanOption } from '@/lib/types';

export function useSubscription() {
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [paywallEnabled, setPaywallEnabled] = useState(false);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data: PaywallStatusResponse = await getPaywallStatus();
      setPlans(data.plans);
      setPaywallEnabled(data.enabled);
      setUserPlan(data.user_plan ?? null);
      setExpiresAt(data.expires_at ?? null);
    } catch {
      // Se falhar (ex: não autenticado), ignora
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { plans, paywallEnabled, userPlan, expiresAt, isLoading, refetch };
}
