'use client';

import { Settings as SettingsIcon, Shield, HelpCircle, LogOut, ChevronRight, User, Crown, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PlanEnum } from '@/lib/types';

const menuItems = [
  { icon: Bell, label: 'Notificações', desc: 'Alertas de preço e sincronização' },
  { icon: SettingsIcon, label: 'Preferências', desc: 'Tema, moeda e formato de número' },
  { icon: Shield, label: 'Segurança', desc: 'Sessões ativas e tokens' },
  { icon: HelpCircle, label: 'Ajuda e Suporte', desc: 'FAQ e contato' },
];

export default function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col px-4 pt-10 pb-8 lg:px-8 lg:pt-8 space-y-6 max-w-2xl mx-auto">

      {/* Header */}
      <header className="animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">Perfil</h1>
      </header>

      {/* Profile Card */}
      <section className="glass-card rounded-2xl p-5 animate-fade-in stagger-1">
        <div className="flex items-center gap-4">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="h-16 w-16 rounded-2xl object-cover ring-1 ring-blue-500/20 shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-blue-600/10 flex items-center justify-center ring-1 ring-blue-500/20 text-blue-500 shrink-0">
              <User size={30} />
            </div>
          )}
          <div className="flex flex-col min-w-0 flex-1">
            <h2 className="text-lg font-bold text-white truncate">{user?.name ?? '—'}</h2>
            <p className="text-sm text-zinc-500 truncate">{user?.email ?? '—'}</p>
          </div>
          <div className="shrink-0">
            <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20 uppercase flex items-center gap-1">
              <Crown size={10} />
              {user?.plan === PlanEnum.PREMIUM ? 'Premium' : 'Free'}
            </span>
          </div>
        </div>

        {/* Upgrade banner */}
        {user?.plan !== PlanEnum.PREMIUM && (
          <div className="mt-4 p-3.5 bg-gradient-to-r from-blue-600/10 via-violet-600/10 to-blue-600/10 rounded-xl ring-1 ring-blue-500/10 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">Upgrade para Premium</span>
              <span className="text-xs text-zinc-400">Sincronização automática via Open Finance</span>
            </div>
            <ChevronRight size={18} className="text-zinc-500 shrink-0" />
          </div>
        )}
      </section>

      {/* Menu Items */}
      <section className="flex flex-col space-y-2 animate-fade-in stagger-2">
        {menuItems.map((item) => (
          <button
            key={item.label}
            className="glass-card hover:bg-card-hover rounded-2xl lg:rounded-xl p-4 flex items-center justify-between transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-zinc-800/80 rounded-xl text-zinc-400 group-hover:text-zinc-200 transition-colors ring-1 ring-zinc-700/50">
                <item.icon size={18} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-white font-medium text-sm">{item.label}</span>
                <span className="text-[11px] text-zinc-500">{item.desc}</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </button>
        ))}
      </section>

      {/* Logout */}
      <section className="pt-2 animate-fade-in stagger-3">
        <button
          onClick={logout}
          className="w-full bg-red-500/5 hover:bg-red-500/10 text-red-400 font-semibold py-4 rounded-xl transition-all duration-200 ring-1 ring-red-500/10 hover:ring-red-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <LogOut size={18} />
          Sair do Aplicativo
        </button>
      </section>

      {/* App info */}
      <p className="text-[11px] text-zinc-700 text-center pt-2">
        EasyInvest v1.0.0 MVP
      </p>
    </div>
  );
}
