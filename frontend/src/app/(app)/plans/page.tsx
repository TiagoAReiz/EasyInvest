'use client';

import { useState } from 'react';
import { Crown, Check, Loader2 } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { createCheckout } from '@/services/subscriptionService';
import { useAuth } from '@/contexts/AuthContext';

const formatBRL = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export default function PlansPage() {
  const { plans, userPlan, isLoading } = useSubscription();
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<number | null>(null);

  const isPremium = userPlan === 'PREMIUM';

  async function handleCheckout(planMonths: number) {
    setLoadingPlan(planMonths);
    try {
      const { checkout_url } = await createCheckout(planMonths);
      window.location.href = checkout_url;
    } catch {
      setLoadingPlan(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (isPremium) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <Crown size={48} className="mx-auto text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Você já é Premium!</h1>
        <p className="text-muted-foreground">
          Aproveite todos os recursos do EasyInvest.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <Crown size={40} className="mx-auto text-yellow-500 mb-3" />
        <h1 className="text-2xl font-bold mb-2">Escolha seu plano</h1>
        <p className="text-muted-foreground">
          Acesse todas as funcionalidades do EasyInvest
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const isRecommended = plan.plan_months === 12;
          const isCurrentLoading = loadingPlan === plan.plan_months;

          return (
            <div
              key={plan.plan_months}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                isRecommended
                  ? 'border-yellow-500 bg-yellow-500/5 ring-2 ring-yellow-500/20'
                  : 'border-border bg-card'
              }`}
            >
              {isRecommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                  Recomendado
                </span>
              )}

              <h3 className="text-lg font-semibold mb-1">{plan.label}</h3>

              {plan.discount_percent > 0 && (
                <span className="text-xs text-green-500 font-medium mb-2">
                  {plan.discount_percent.toFixed(0)}% de desconto
                </span>
              )}

              <div className="mb-4">
                <span className="text-3xl font-bold">{formatBRL(plan.price)}</span>
                {plan.plan_months > 1 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatBRL(plan.price_per_month)}/mês
                  </p>
                )}
              </div>

              <ul className="text-sm text-muted-foreground space-y-2 mb-6 flex-1">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-green-500 shrink-0" />
                  Consolidação completa
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-green-500 shrink-0" />
                  Renda variável + cripto
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-green-500 shrink-0" />
                  Simulação renda fixa
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-green-500 shrink-0" />
                  Histórico de evolução
                </li>
              </ul>

              <button
                onClick={() => handleCheckout(plan.plan_months)}
                disabled={loadingPlan !== null}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                  isRecommended
                    ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                    : 'bg-primary text-primary-foreground hover:opacity-90'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isCurrentLoading ? (
                  <Loader2 size={18} className="animate-spin mx-auto" />
                ) : (
                  'Assinar'
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
