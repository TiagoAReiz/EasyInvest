'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const { paywallEnabled, userPlan, isLoading: subLoading } = useSubscription();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const isPlansRoute = pathname?.startsWith('/plans');
  useEffect(() => {
    if (!isLoading && !subLoading && isAuthenticated && paywallEnabled) {
      if (userPlan === 'FREE' && !isPlansRoute) {
        router.replace('/plans');
      }
    }
  }, [isLoading, subLoading, isAuthenticated, paywallEnabled, userPlan, isPlansRoute, router]);

  if (isLoading || subLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
