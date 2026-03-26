'use client';

import { Shield, Key, ExternalLink } from 'lucide-react';
import SettingsPageLayout from '@/components/SettingsPageLayout';

export default function SecurityPage() {
  return (
    <SettingsPageLayout title="Segurança & Privacidade" description="Informações de autenticação da sua conta.">

      {/* ── 2FA — Managed by Google ── */}
      <section className="space-y-3 animate-fade-in stagger-1">
        <h3 className="text-sm font-bold text-muted uppercase tracking-wider font-[family-name:var(--font-outfit)]">
          Autenticação em Dois Fatores
        </h3>
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-surface rounded-xl text-muted shrink-0">
              <Shield size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground font-[family-name:var(--font-outfit)]">2FA via Google</p>
              <p className="text-[11px] text-muted-secondary mt-0.5">
                A autenticação em dois fatores é gerenciada pela sua conta Google.
              </p>
            </div>
            <a
              href="https://myaccount.google.com/signinoptions/two-step-verification"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-accent hover:text-accent/80 font-bold transition-colors shrink-0"
            >
              Gerenciar
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </section>

      {/* ── Password / Google ── */}
      <section className="space-y-3 animate-fade-in stagger-2">
        <h3 className="text-sm font-bold text-muted uppercase tracking-wider font-[family-name:var(--font-outfit)]">
          Senha
        </h3>
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-surface rounded-xl text-muted shrink-0">
              <Key size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground font-[family-name:var(--font-outfit)]">Login via Google</p>
              <p className="text-[11px] text-muted-secondary mt-0.5">
                Sua senha é gerenciada pela sua conta Google.
              </p>
            </div>
            <a
              href="https://myaccount.google.com/security"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-accent hover:text-accent/80 font-bold transition-colors shrink-0"
            >
              Gerenciar
            </a>
          </div>
        </div>
      </section>
    </SettingsPageLayout>
  );
}
