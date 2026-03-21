'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';
import { getSubscriptionStatus } from '@/services/subscriptionService';
import { useAuth } from '@/contexts/AuthContext';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { refetchUser } = useAuth();
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 30;

    const poll = setInterval(async () => {
      attempts++;
      try {
        const sub = await getSubscriptionStatus();
        if (sub && sub.status === 'ACTIVE') {
          setConfirmed(true);
          clearInterval(poll);
          await refetchUser();
          setTimeout(() => router.replace('/dashboard'), 2000);
        }
      } catch {
        // ignore polling errors
      }

      if (attempts >= maxAttempts) {
        clearInterval(poll);
      }
    }, 2000);

    return () => clearInterval(poll);
  }, [router, refetchUser]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      {confirmed ? (
        <>
          <CheckCircle size={64} className="text-positive mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Pagamento confirmado!</h1>
          <p className="text-muted">
            Redirecionando para o dashboard...
          </p>
        </>
      ) : (
        <>
          <Loader2 size={48} className="animate-spin text-accent mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Processando pagamento...</h1>
          <p className="text-muted">
            Aguarde enquanto confirmamos seu pagamento. Isso pode levar alguns segundos.
          </p>
        </>
      )}
    </div>
  );
}
