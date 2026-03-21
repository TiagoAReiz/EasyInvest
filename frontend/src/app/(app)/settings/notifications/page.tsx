'use client';

import { Bell, TrendingUp, Wallet, RefreshCw, Calendar } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import SettingsPageLayout from '@/components/SettingsPageLayout';

interface ToggleItem {
  icon: React.ElementType;
  label: string;
  desc: string;
  key: 'notif_price_alerts' | 'notif_dividends' | 'notif_sync' | 'notif_maturity';
}

const toggleItems: ToggleItem[] = [
  { icon: TrendingUp, label: 'Alertas de Preço', desc: 'Receba notificações quando um ativo atingir seu alvo', key: 'notif_price_alerts' },
  { icon: Wallet, label: 'Dividendos', desc: 'Aviso quando dividendos ou JCP forem creditados', key: 'notif_dividends' },
  { icon: RefreshCw, label: 'Sincronização', desc: 'Status de sincronização das conexões de exchanges', key: 'notif_sync' },
  { icon: Calendar, label: 'Vencimentos', desc: 'Lembrete de vencimento de títulos de renda fixa', key: 'notif_maturity' },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${
        on ? 'bg-accent' : 'bg-border'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
          on ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function NotificationsSettingsPage() {
  const { settings, isLoading, updateSettings } = useSettings();

  const activeCount = settings
    ? toggleItems.filter((t) => settings[t.key]).length
    : 0;

  const handleToggle = (key: ToggleItem['key']) => {
    if (!settings) return;
    updateSettings({ [key]: !settings[key] });
  };

  return (
    <SettingsPageLayout title="Notificações" description="Configure quais alertas você deseja receber.">

      {/* ── Status ── */}
      <div className="flex items-center gap-3 animate-fade-in stagger-1">
        <div className="p-2.5 bg-accent/10 rounded-xl">
          <Bell size={18} className="text-accent" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground font-[family-name:var(--font-outfit)]">
            {activeCount} de {toggleItems.length} ativas
          </p>
          <p className="text-[11px] text-muted-secondary">Notificações habilitadas</p>
        </div>
      </div>

      {/* ── Toggle List ── */}
      <section className="glass-card rounded-2xl divide-y divide-border/40 animate-fade-in stagger-2">
        {toggleItems.map((item) => {
          const Icon = item.icon;
          const isOn = settings ? settings[item.key] : false;
          return (
            <div key={item.key} className="flex items-center gap-4 px-5 py-4">
              <div className="p-2.5 bg-surface rounded-xl text-muted shrink-0">
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground font-[family-name:var(--font-outfit)]">{item.label}</p>
                <p className="text-[11px] text-muted-secondary mt-0.5">{item.desc}</p>
              </div>
              <Toggle on={isOn} onToggle={() => handleToggle(item.key)} />
            </div>
          );
        })}
      </section>
    </SettingsPageLayout>
  );
}
