'use client';

import { User, Mail, Crown, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PlanEnum } from '@/lib/types';
import SettingsPageLayout from '@/components/SettingsPageLayout';

export default function ProfilePage() {
  const { user } = useAuth();
  const isPremium = user?.plan === PlanEnum.PREMIUM;

  return (
    <SettingsPageLayout title="Perfil" description="Seus dados pessoais e informações da conta.">

      {/* ── Avatar + Name Card ── */}
      <section className="glass-card rounded-3xl p-6 lg:p-8 animate-fade-in stagger-1 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/[0.03] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative shrink-0">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="h-24 w-24 rounded-3xl object-cover ring-1 ring-border shadow-xl"
              />
            ) : (
              <div className="h-24 w-24 rounded-3xl bg-surface flex items-center justify-center ring-1 ring-border text-muted shadow-xl">
                <User size={40} />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-background rounded-full flex items-center justify-center">
              <div className="h-3.5 w-3.5 bg-positive rounded-full animate-pulse-glow" style={{ boxShadow: '0 0 10px rgba(52, 211, 153, 0.5)' }} />
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-start space-y-1">
            <h2 className="text-2xl font-extrabold text-foreground font-[family-name:var(--font-outfit)]">
              {user?.name ?? 'Usuário'}
            </h2>
            <p className="text-[15px] text-muted">{user?.email ?? 'carregando...'}</p>
            <div className="pt-2">
              <span className={`text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1.5 w-fit ${
                isPremium
                  ? 'bg-accent/10 text-accent ring-1 ring-accent/20'
                  : 'bg-surface text-muted ring-1 ring-border'
              }`}>
                {isPremium ? <Crown size={12} strokeWidth={3} /> : <User size={12} strokeWidth={3} />}
                Plano {isPremium ? 'Premium' : 'Gratuito'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Account Details ── */}
      <section className="space-y-4 animate-fade-in stagger-2">
        <h3 className="text-sm font-bold text-muted uppercase tracking-wider font-[family-name:var(--font-outfit)]">
          Informações da Conta
        </h3>

        <div className="glass-card rounded-2xl divide-y divide-border/40">
          <div className="flex items-center gap-4 px-5 py-4">
            <Mail size={18} className="text-muted-secondary shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-secondary uppercase tracking-wider font-bold">E-mail</p>
              <p className="text-sm text-foreground truncate">{user?.email ?? '—'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 px-5 py-4">
            <Shield size={18} className="text-muted-secondary shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-secondary uppercase tracking-wider font-bold">Login</p>
              <p className="text-sm text-foreground">Google OAuth</p>
            </div>
            <span className="ml-auto text-[10px] bg-positive/10 text-positive px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
              Conectado
            </span>
          </div>

          <div className="flex items-center gap-4 px-5 py-4">
            <User size={18} className="text-muted-secondary shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-secondary uppercase tracking-wider font-bold">ID</p>
              <p className="text-sm text-foreground font-mono truncate">{user?.id ?? '—'}</p>
            </div>
          </div>
        </div>
      </section>
    </SettingsPageLayout>
  );
}
