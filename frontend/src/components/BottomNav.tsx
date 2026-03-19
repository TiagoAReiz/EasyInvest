'use client';

import { Home, PieChart, ArrowLeftRight, Settings, Wallet } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Início', href: '/dashboard', icon: Home },
  { label: 'Carteira', href: '/portfolio', icon: PieChart },
  { label: 'Conexões', href: '/connections', icon: ArrowLeftRight },
  { label: 'Perfil', href: '/settings', icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col border-r border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl z-50">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-zinc-800/60">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 ring-1 ring-blue-500/20">
            <Wallet size={18} className="text-blue-500" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Easy<span className="text-blue-500">Invest</span>
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col gap-1 px-3 pt-6 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-500 ring-1 ring-blue-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800/60">
          <p className="text-[10px] text-zinc-600 text-center">
            EasyInvest v1.0 MVP
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 w-full border-t border-zinc-800/60 bg-zinc-950/90 backdrop-blur-xl pb-safe z-50">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors relative ${
                  isActive ? 'text-blue-500' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {isActive && (
                  <span className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full" />
                )}
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
