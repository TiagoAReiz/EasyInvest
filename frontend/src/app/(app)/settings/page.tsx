'use client';

import { Settings as SettingsIcon, Shield, HelpCircle, LogOut, ChevronRight, User, Crown, Bell, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PlanEnum } from '@/lib/types';

const menuItems = [
  { icon: Bell, label: 'Notificações', desc: 'Alertas de preço e eventos' },
  { icon: SettingsIcon, label: 'Preferências Gerais', desc: 'Tema, formato de moeda e fuso horário' },
  { icon: Shield, label: 'Segurança & Privacidade', desc: 'Sessões ativas, tokens e 2FA' },
  { icon: HelpCircle, label: 'Central de Ajuda', desc: 'FAQ, tutoriais e contato direto' },
];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const isPremium = user?.plan === PlanEnum.PREMIUM;

  return (
    <div className="flex flex-col px-4 pt-8 pb-10 lg:px-8 lg:pt-10 space-y-8 max-w-4xl mx-auto">

      {/* ── Header ── */}
      <header className="animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white font-[family-name:var(--font-outfit)]">Perfil & Configurações</h1>
        <p className="text-sm text-[#8a8a92] mt-1">Gerencie sua conta e preferências do sistema.</p>
      </header>

      {/* ── Profile Hero Card ── */}
      <section className="glass-card rounded-3xl p-6 lg:p-8 animate-fade-in stagger-1 relative overflow-hidden group">
        
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/[0.03] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          
          {/* Avatar Box */}
          <div className="relative shrink-0">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl object-cover ring-1 ring-[#2a2a2e] shadow-xl"
              />
            ) : (
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-[#111114] flex items-center justify-center ring-1 ring-[#2a2a2e] text-[#8a8a92] shadow-xl">
                <User size={36} />
              </div>
            )}
            {/* Status dot */}
            <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-[#0c0c0e] rounded-full flex items-center justify-center">
              <div className="h-3.5 w-3.5 bg-positive rounded-full animate-pulse-glow" style={{ boxShadow: '0 0 10px rgba(52, 211, 153, 0.5)' }} />
            </div>
          </div>

          {/* User Info */}
          <div className="flex flex-col min-w-0 flex-1 w-full space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-extrabold text-white truncate font-[family-name:var(--font-outfit)]">{user?.name ?? 'Usuário'}</h2>
            </div>
            <p className="text-[15px] text-[#8a8a92] truncate">{user?.email ?? 'carregando...'}</p>
            
            <div className="pt-2 flex flex-wrap gap-2">
              <span className={`text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1.5 w-fit ${
                isPremium 
                  ? 'bg-accent/10 text-accent ring-1 ring-accent/20' 
                  : 'bg-[#111114] text-[#8a8a92] ring-1 ring-[#2a2a2e]'
              }`}>
                {isPremium ? <Crown size={12} strokeWidth={3} /> : <User size={12} strokeWidth={3} />}
                Plano {isPremium ? 'Premium' : 'Gratuito'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Upgrade Banner ── */}
      {!isPremium && (
        <section className="animate-fade-in stagger-2">
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#1a1811] to-[#252216] border border-accent/20 group cursor-pointer transition-all hover:border-accent/40">
            {/* Golden light effect */}
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(245,197,24,0.1),transparent_50%)]" />
            
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-2">
                  <Crown size={18} className="text-accent" strokeWidth={2.5} />
                  <span className="text-lg font-bold text-white font-[family-name:var(--font-outfit)]">Desbloqueie o Power Mode</span>
                </div>
                <p className="text-sm text-[#a0a0a8] max-w-md leading-relaxed">
                  Sincronização ilimitada via Open Finance, relatórios de imposto de renda automatizados e insights avançados.
                </p>
              </div>
              <button className="shrink-0 btn-accent px-6 py-3 rounded-xl text-sm transition-all shadow-lg whitespace-nowrap">
                Fazer Upgrade
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Options Grid ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in stagger-3">
        {menuItems.map((item) => (
          <button
            key={item.label}
            className="glass-card hover:bg-[#1e1e22] rounded-3xl p-5 flex items-start gap-4 transition-all duration-200 group border border-[#2a2a2e]/40 hover:border-[#3a3a42] text-left"
          >
            <div className="p-3 bg-[#111114] rounded-2xl text-[#8a8a92] group-hover:text-accent group-hover:bg-accent/10 transition-colors shadow-inner shrink-0">
              <item.icon size={20} />
            </div>
            <div className="flex flex-col mt-0.5 space-y-1 overflow-hidden">
              <span className="text-white font-bold text-[15px] font-[family-name:var(--font-outfit)] truncate">{item.label}</span>
              <span className="text-[12px] text-[#6a6a72] leading-snug pr-4">{item.desc}</span>
            </div>
            <ChevronRight size={18} className="text-[#3a3a42] group-hover:text-white transition-colors ml-auto self-center shrink-0" />
          </button>
        ))}
      </section>

      {/* ── Danger Zone ── */}
      <section className="pt-6 animate-fade-in stagger-4">
        <button
          onClick={logout}
          className="w-full bg-[#161619] hover:bg-negative/10 text-negative font-bold py-4 rounded-2xl transition-all duration-200 border border-[#2a2a2e] hover:border-negative/30 flex items-center justify-center gap-2 active:scale-[0.98] group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          Encerrar Sessão Segura
        </button>
      </section>

      {/* App Info Footer */}
      <footer className="pt-8 pb-4 flex flex-col items-center justify-center text-center space-y-2 opacity-50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(255,255,255,0.03)] border border-[#2a2a2e]">
          <Wallet size={14} className="text-[#8a8a92]" />
        </div>
        <p className="text-[10px] text-[#6a6a72] font-semibold tracking-widest uppercase font-[family-name:var(--font-outfit)]">
          EasyInvest v1.0.0 MVP
        </p>
      </footer>
    </div>
  );
}
