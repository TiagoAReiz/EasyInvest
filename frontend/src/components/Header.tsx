'use client';

import { useState, useRef, useEffect } from 'react';
import { User, Bell, Settings, Shield, HelpCircle, LogOut, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const dropdownItems = [
  { icon: User, label: 'Perfil', href: '/settings/profile' },
  { icon: Bell, label: 'Notificações', href: '/settings/notifications' },
  { icon: Settings, label: 'Preferências', href: '/settings/preferences' },
  { icon: Shield, label: 'Segurança', href: '/settings/security' },
  { icon: HelpCircle, label: 'FAQ', href: '/settings/faq' },
];

export default function Header() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-[220px] h-14 lg:h-16 bg-surface/95 backdrop-blur-2xl border-b border-border/40 z-40 flex items-center justify-end px-4 lg:px-6">

      {/* Right — Gear + Avatar + Dropdown */}
      <div className="flex items-center gap-3" ref={ref}>
        <Link
          href="/notifications"
          className="p-2 rounded-lg text-muted-secondary hover:text-foreground hover:bg-foreground/[0.04] transition-all"
        >
          <Bell size={18} />
        </Link>

        <Link
          href="/settings"
          className="p-2 rounded-lg text-muted-secondary hover:text-foreground hover:bg-foreground/[0.04] transition-all"
        >
          <Settings size={18} />
        </Link>

        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 group cursor-pointer ml-1"
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="h-8 w-8 rounded-full object-cover ring-1 ring-border group-hover:ring-accent/40 transition-all"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-card-hover flex items-center justify-center ring-1 ring-border group-hover:ring-accent/40 transition-all">
              <User size={16} className="text-muted" />
            </div>
          )}
          <ChevronDown
            size={14}
            className={`text-muted-secondary group-hover:text-foreground transition-all duration-200 ${open ? 'rotate-180 text-foreground' : ''}`}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute top-full right-4 mt-2 w-60 bg-card border border-border/60 rounded-2xl shadow-2xl shadow-shadow overflow-hidden animate-fade-in-scale">
            {/* User info header */}
            <div className="px-4 py-3 border-b border-border/40">
              <p className="text-sm font-bold text-foreground truncate font-[family-name:var(--font-outfit)]">
                {user?.name ?? 'Usuário'}
              </p>
              <p className="text-[11px] text-muted-secondary truncate mt-0.5">
                {user?.email ?? ''}
              </p>
            </div>

            {/* Menu items */}
            <nav className="py-1.5">
              {dropdownItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-light hover:text-foreground hover:bg-foreground/[0.04] transition-colors"
                  >
                    <Icon size={16} strokeWidth={1.8} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="border-t border-border/40 py-1.5">
              <button
                onClick={() => { logout(); setOpen(false); }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-negative hover:bg-negative/10 transition-colors w-full"
              >
                <LogOut size={16} strokeWidth={1.8} />
                Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
