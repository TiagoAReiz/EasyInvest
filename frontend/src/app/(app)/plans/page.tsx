'use client';

import { useState } from 'react';
import { Crown, CheckCircle2, Loader2, ArrowLeft, ShieldCheck, Zap, CalendarDays } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { createCheckout } from '@/services/subscriptionService';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  if (isPremium) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-fade-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-accent/10 ring-1 ring-accent/25 mb-6 shadow-[0_0_40px_-5px_rgba(245,197,24,0.3)]">
          <Crown size={36} className="text-accent" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl lg:text-4xl font-extrabold text-white font-[family-name:var(--font-outfit)] tracking-tight mb-3">
          Você já é <span className="text-accent">Premium!</span>
        </h1>
        <p className="text-[15px] text-[#8a8a92] max-w-sm leading-relaxed mb-8">
          Sua conta possui acesso irrestrito a todas as funcionalidades avançadas do EasyInvest.
        </p>
        <Link href="/dashboard" className="btn-accent px-8 py-3.5 rounded-2xl font-bold uppercase tracking-wider text-sm transition-all">
          Retornar ao Painel
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 lg:py-16 min-h-screen relative">

      {/* ── Background Elements ── */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-accent/[0.03] rounded-full blur-[120px] pointer-events-none" />

      {/* ── Header ── */}
      <div className="text-center mb-12 animate-fade-in relative z-10 w-full">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/25 mb-6 shadow-[0_0_20px_-5px_rgba(245,197,24,0.15)]">
          <Crown size={24} className="text-accent" strokeWidth={2.5} />
        </div>
        <h1 className="text-4xl lg:text-5xl font-extrabold text-white font-[family-name:var(--font-outfit)] tracking-tight mb-4 leading-tight">
          Destrave o <span className="text-accent italic">Power Mode</span>
        </h1>
        <p className="text-[15px] text-[#8a8a92] max-w-lg mx-auto leading-relaxed">
          Sincronização ilimitada, ferramentas avançadas e controle total da sua carteira. Escolha o plano ideal e evolua sua inteligência financeira.
        </p>
      </div>

      {/* ── Pricing Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto w-full mb-12 flex-1 animate-fade-in stagger-1 relative z-10">
        {plans.map((plan) => {
          const isRecommended = plan.plan_months === 12;
          const isCurrentLoading = loadingPlan === plan.plan_months;

          return (
            <div
              key={plan.plan_months}
              className={`glass-card rounded-3xl p-6 lg:p-7 flex flex-col relative transition-all duration-300 hover:-translate-y-1 ${isRecommended
                ? 'border-accent bg-accent/[0.04] ring-2 ring-accent/30 shadow-[0_0_40px_-10px_rgba(245,197,24,0.2)]'
                : 'hover:border-accent/30'
                }`}
            >
              {isRecommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-[#0c0c0e] text-[10px] font-extrabold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                  Recomendado
                </span>
              )}

              <h3 className="text-xl font-bold text-white font-[family-name:var(--font-outfit)] mb-1.5">{plan.label}</h3>

              {plan.discount_percent > 0 ? (
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-positive bg-positive/10 px-2.5 py-1 rounded-lg inline-block mb-4 w-fit border border-positive/10">
                  {plan.discount_percent.toFixed(0)}% OFF
                </span>
              ) : (
                <div className="h-6 mb-4" />
              )}

              <div className="mb-6 mt-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-[family-name:var(--font-outfit)]">
                    {formatBRL(plan.price)}
                  </span>
                </div>
                {plan.plan_months > 1 ? (
                  <p className="text-[13px] text-[#6a6a72] mt-1.5 font-medium flex items-center gap-1.5">
                    Equivale a <strong className="text-[#a0a0a8]">{formatBRL(plan.price_per_month)}/mês</strong>
                  </p>
                ) : (
                  <p className="text-[13px] text-[#6a6a72] mt-1.5 font-medium flex items-center gap-1.5">
                    Cobrado mensalmente
                  </p>
                )}
              </div>

              <div className="h-px w-full bg-[#2a2a2e]/60 mb-6" />

              <ul className="text-[14px] text-[#8a8a92] space-y-3.5 mb-8 flex-1">
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={18} strokeWidth={2.5} className="text-accent shrink-0 mt-0.5" />
                  <span className="leading-snug">Consolidação completa</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={18} strokeWidth={2.5} className="text-accent shrink-0 mt-0.5" />
                  <span className="leading-snug">Sincronização automática</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={18} strokeWidth={2.5} className="text-accent shrink-0 mt-0.5" />
                  <span className="leading-snug">Desempenho da carteira</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={18} strokeWidth={2.5} className="text-accent shrink-0 mt-0.5" />
                  <span className="leading-snug">Relatórios automatizados</span>
                </li>
              </ul>

              <button
                onClick={() => handleCheckout(plan.plan_months)}
                disabled={loadingPlan !== null}
                className={`w-full py-4 rounded-xl font-extrabold text-[14px] transition-all duration-200 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isRecommended
                  ? 'btn-accent shadow-lg'
                  : 'bg-[#1e1e22] text-white hover:bg-white hover:text-black ring-1 ring-[#2a2a2e] border-none'
                  }`}
              >
                {isCurrentLoading && <Loader2 size={18} className="animate-spin" />}
                {isCurrentLoading ? 'Processando...' : 'Assinar Plano'}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Footer Info ── */}
      <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-6 pt-6 border-t border-[#2a2a2e]/40 animate-fade-in stagger-2 relative z-10">
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-3">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[#4a4a52]" />
            <span className="text-[10px] text-[#5a5a62] font-bold uppercase tracking-wider">Pagamento Seguro</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-[#4a4a52]" />
            <span className="text-[10px] text-[#5a5a62] font-bold uppercase tracking-wider">Acesso Imediato</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarDays size={14} className="text-[#4a4a52]" />
            <span className="text-[10px] text-[#5a5a62] font-bold uppercase tracking-wider">Cancelamento Flexível</span>
          </div>
        </div>
      </div>

    </div>
  );
}
