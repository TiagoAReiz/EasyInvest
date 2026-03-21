'use client';

import { Home, PieChart, ArrowLeftRight, Wallet } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Início', href: '/dashboard', icon: Home },
  { label: 'Carteira', href: '/portfolio', icon: PieChart },
  { label: 'Conexões', href: '/connections', icon: ArrowLeftRight },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[220px] flex-col bg-surface border-r border-border/40 z-50">

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border/40">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/25">
            <Wallet size={16} className="text-accent" />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground font-[family-name:var(--font-outfit)]">
            Easy<span className="text-accent">Invest</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 px-3 pt-6 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                  isActive
                    ? 'bg-accent/8 text-accent'
                    : 'text-muted hover:text-foreground hover:bg-foreground/[0.03]'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent rounded-r-full" />
                )}
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border/40">
          <p className="text-[10px] text-muted-faint text-center font-[family-name:var(--font-dm-sans)]">
            EasyInvest v1.0 MVP
          </p>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="lg:hidden fixed bottom-0 w-full border-t border-border/40 bg-surface/95 backdrop-blur-2xl pb-safe z-50">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-16 h-full transition-all relative ${
                  isActive ? 'text-accent' : 'text-muted-tertiary hover:text-muted'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[2px] bg-accent rounded-full" />
                )}
                <Icon size={21} strokeWidth={isActive ? 2.5 : 1.6} />
                <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
