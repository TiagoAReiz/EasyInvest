'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPaywallStatus } from '@/services/subscriptionService';
import type { PaywallStatusResponse, PlanOption } from '@/lib/types';

export function useSubscription() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [paywallEnabled, setPaywallEnabled] = useState(false);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data: PaywallStatusResponse = await getPaywallStatus();
      setPlans(data.plans);
      setPaywallEnabled(data.enabled);
      setUserPlan(data.user_plan ?? null);
      setExpiresAt(data.expires_at ?? null);
    } catch {
      // Se falhar, assume paywall desativado para não bloquear
      setPaywallEnabled(false);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading) refetch();
  }, [authLoading, refetch]);

  return { plans, paywallEnabled, userPlan, expiresAt, isLoading: authLoading || isLoading, refetch };
}
