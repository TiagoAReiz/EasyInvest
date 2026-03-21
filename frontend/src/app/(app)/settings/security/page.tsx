'use client';

import { useState } from 'react';
import { Monitor, Shield, Key, LogOut, ExternalLink } from 'lucide-react';
import SettingsPageLayout from '@/components/SettingsPageLayout';
import api, { setTokens } from '@/lib/api';
import type { TokenResponse } from '@/lib/types';

function getCurrentDevice(): string {
  if (typeof navigator === 'undefined') return 'Dispositivo desconhecido';
  const ua = navigator.userAgent;
  let browser = 'Navegador';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';

  let os = '';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return os ? `${browser} — ${os}` : browser;
}

export default function SecurityPage() {
  const [revoking, setRevoking] = useState(false);
  const [revokeSuccess, setRevokeSuccess] = useState(false);

  const handleRevokeSessions = async () => {
    setRevoking(true);
    try {
      const res = await api.post<TokenResponse>('/auth/revoke-sessions');
      setTokens(res.data);
      setRevokeSuccess(true);
      setTimeout(() => setRevokeSuccess(false), 3000);
    } catch {
      // Error handled by api interceptor
    } finally {
      setRevoking(false);
    }
  };

  return (
    <SettingsPageLayout title="Segurança & Privacidade" description="Gerencie sessões, dispositivos e autenticação.">

      {/* ── Active Session ── */}
      <section className="space-y-3 animate-fade-in stagger-1">
        <h3 className="text-sm font-bold text-muted uppercase tracking-wider font-[family-name:var(--font-outfit)]">
          Sessão Atual
        </h3>
        <div className="glass-card rounded-2xl">
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="p-2.5 bg-surface rounded-xl text-muted shrink-0">
              <Monitor size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground font-[family-name:var(--font-outfit)]">{getCurrentDevice()}</p>
              <p className="text-[11px] text-muted-secondary mt-0.5">Ativo agora</p>
            </div>
            <span className="text-[10px] bg-positive/10 text-positive px-2.5 py-1 rounded-md font-bold uppercase tracking-wider shrink-0">
              Atual
            </span>
          </div>
        </div>
        <button
          onClick={handleRevokeSessions}
          disabled={revoking}
          className="w-full bg-card hover:bg-negative/10 text-negative font-bold py-3 rounded-xl transition-all duration-200 border border-border hover:border-negative/30 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          <LogOut size={16} />
          {revoking ? 'Revogando...' : revokeSuccess ? 'Sessões revogadas!' : 'Revogar Outras Sessões'}
        </button>
      </section>

      {/* ── 2FA — Managed by Google ── */}
      <section className="space-y-3 animate-fade-in stagger-2">
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
      <section className="space-y-3 animate-fade-in stagger-3">
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
