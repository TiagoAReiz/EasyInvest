'use client';

import { useState } from 'react';
import { Bell, TrendingUp, RefreshCw, Calendar, CheckCheck, Trash2, ArrowUpRight } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationTypeEnum } from '@/lib/types';

const typeConfig = {
  [NotificationTypeEnum.PRICE]: { icon: TrendingUp, color: 'text-accent' },
  [NotificationTypeEnum.SYNC]: { icon: RefreshCw, color: 'text-positive' },
  [NotificationTypeEnum.MATURITY]: { icon: Calendar, color: 'text-muted-medium' },
  [NotificationTypeEnum.DIVIDEND]: { icon: ArrowUpRight, color: 'text-positive' },
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Há ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Ontem';
  return `${diffDays} dias atrás`;
}

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, markRead, markAllRead, remove } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="flex flex-col px-4 pt-8 pb-10 lg:px-8 lg:pt-10 space-y-6 max-w-4xl mx-auto">

      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground font-[family-name:var(--font-outfit)]">
            Notificações
          </h1>
          <p className="text-sm text-muted mt-1">
            {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter pills */}
          <div className="flex bg-surface rounded-lg p-1 ring-1 ring-border/50">
            {(['all', 'unread'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-bold px-4 py-1.5 rounded-md transition-all duration-200 ${
                  filter === f
                    ? 'bg-accent text-background shadow-sm'
                    : 'text-muted-secondary hover:text-foreground'
                }`}
              >
                {f === 'all' ? 'Todas' : 'Não lidas'}
              </button>
            ))}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs font-bold text-muted hover:text-foreground transition-colors"
            >
              <CheckCheck size={14} />
              Marcar todas
            </button>
          )}
        </div>
      </header>

      {/* ── Notification List ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 glass-card rounded-3xl animate-fade-in stagger-1">
          <Bell size={40} className="text-muted-faint mb-4 animate-pulse" />
          <p className="text-sm text-muted-secondary">Carregando notificações...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 glass-card rounded-3xl animate-fade-in stagger-1">
          <Bell size={40} className="text-muted-faint mb-4" />
          <p className="font-bold text-foreground font-[family-name:var(--font-outfit)]">
            {filter === 'unread' ? 'Nenhuma não lida' : 'Nenhuma notificação'}
          </p>
          <p className="text-sm text-muted-secondary mt-1">
            {filter === 'unread' ? 'Você está em dia!' : 'Quando houver algo novo, aparecerá aqui.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 animate-fade-in stagger-1">
          {filtered.map((notif) => {
            const cfg = typeConfig[notif.type];
            const Icon = cfg.icon;

            return (
              <div
                key={notif.id}
                onClick={() => !notif.read && markRead(notif.id)}
                className={`glass-card rounded-2xl p-4 lg:p-5 flex items-start gap-4 transition-all duration-200 cursor-pointer group relative overflow-hidden ${
                  !notif.read ? 'border-l-2 border-l-accent' : ''
                }`}
              >
                {/* Icon */}
                <div className={`p-2.5 rounded-xl shrink-0 ${!notif.read ? 'bg-accent/10' : 'bg-surface'}`}>
                  <Icon size={18} className={!notif.read ? cfg.color : 'text-muted'} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-bold font-[family-name:var(--font-outfit)] ${!notif.read ? 'text-foreground' : 'text-muted'}`}>
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-muted-secondary whitespace-nowrap shrink-0 mt-0.5">
                      {formatRelativeTime(notif.created_at)}
                    </span>
                  </div>
                  <p className="text-[12px] text-muted-secondary leading-relaxed mt-1 pr-8">
                    {notif.body}
                  </p>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => { e.stopPropagation(); remove(notif.id); }}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-faint hover:text-negative hover:bg-negative/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>

                {/* Unread dot */}
                {!notif.read && (
                  <div className="absolute top-4 right-4 group-hover:hidden">
                    <div className="h-2 w-2 bg-accent rounded-full" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
