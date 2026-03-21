'use client';

import { Settings as SettingsIcon, Shield, HelpCircle, LogOut, ChevronRight, User, Bell, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

const menuItems = [
  { icon: User, label: 'Perfil', desc: 'Seus dados pessoais e conta', href: '/settings/profile' },
  { icon: Bell, label: 'Notificações', desc: 'Alertas de preço e eventos', href: '/settings/notifications' },
  { icon: SettingsIcon, label: 'Preferências Gerais', desc: 'Tema, formato de moeda e fuso horário', href: '/settings/preferences' },
  { icon: Shield, label: 'Segurança & Privacidade', desc: 'Sessões ativas, tokens e 2FA', href: '/settings/security' },
  { icon: HelpCircle, label: 'Central de Ajuda', desc: 'FAQ, tutoriais e contato direto', href: '/settings/faq' },
];

export default function SettingsPage() {
  const { logout } = useAuth();

  return (
    <div className="flex flex-col px-4 pt-8 pb-10 lg:px-8 lg:pt-10 space-y-8 max-w-4xl mx-auto">

      {/* ── Header ── */}
      <header className="animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground font-[family-name:var(--font-outfit)]">Configurações</h1>
        <p className="text-sm text-muted mt-1">Gerencie sua conta e preferências do sistema.</p>
      </header>

      {/* ── Options Grid ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in stagger-1">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="glass-card hover:bg-card-hover rounded-3xl p-5 flex items-start gap-4 transition-all duration-200 group border border-border/40 hover:border-border-hover text-left"
          >
            <div className="p-3 bg-surface rounded-2xl text-muted group-hover:text-accent group-hover:bg-accent/10 transition-colors shadow-inner shrink-0">
              <item.icon size={20} />
            </div>
            <div className="flex flex-col mt-0.5 space-y-1 overflow-hidden">
              <span className="text-foreground font-bold text-[15px] font-[family-name:var(--font-outfit)] truncate">{item.label}</span>
              <span className="text-[12px] text-muted-secondary leading-snug pr-4">{item.desc}</span>
            </div>
            <ChevronRight size={18} className="text-border-hover group-hover:text-foreground transition-colors ml-auto self-center shrink-0" />
          </Link>
        ))}
      </section>

      {/* ── Danger Zone ── */}
      <section className="pt-6 animate-fade-in stagger-2">
        <button
          onClick={logout}
          className="w-full bg-card hover:bg-negative/10 text-negative font-bold py-4 rounded-2xl transition-all duration-200 border border-border hover:border-negative/30 flex items-center justify-center gap-2 active:scale-[0.98] group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          Encerrar Sessão Segura
        </button>
      </section>

      {/* App Info Footer */}
      <footer className="pt-8 pb-4 flex flex-col items-center justify-center text-center space-y-2 opacity-50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/[0.03] border border-border">
          <Wallet size={14} className="text-muted" />
        </div>
        <p className="text-[10px] text-muted-secondary font-semibold tracking-widest uppercase font-[family-name:var(--font-outfit)]">
          EasyInvest v1.0.0 MVP
        </p>
      </footer>
    </div>
  );
}
