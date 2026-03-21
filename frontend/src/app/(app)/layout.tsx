'use client';

import { usePathname } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideNav = pathname?.startsWith('/plans');

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground">
        {!hideNav && <BottomNav />}
        {!hideNav && <Header />}
        <main className={hideNav ? '' : 'pt-14 lg:pt-16 pb-20 lg:pb-0 lg:ml-[220px]'}>
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
