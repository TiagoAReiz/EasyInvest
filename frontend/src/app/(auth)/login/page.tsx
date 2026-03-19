'use client';

import { ArrowRight, Wallet, BarChart3, Shield, Zap, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const features = [
  { icon: BarChart3, label: 'Visão consolidada de todos os seus ativos' },
  { icon: Shield, label: 'Chaves Read-Only criptografadas com AES-256' },
  { icon: Zap, label: 'Cotações atualizadas automaticamente' },
];

export default function LoginPage() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (authLoading || isAuthenticated) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        setIsLoggingIn(true);
        setError(null);
        try {
          await login(response.credential);
          router.replace('/dashboard');
        } catch {
          setError('Falha ao autenticar. Tente novamente.');
        } finally {
          setIsLoggingIn(false);
        }
      },
    });
  }, [authLoading, isAuthenticated, login, router]);

  const handleGoogleLogin = () => {
    if (!window.google) {
      setError('Google SDK não carregou. Recarregue a página.');
      return;
    }
    window.google.accounts.id.prompt();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">

      {/* Left panel (desktop only) — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-zinc-950 flex-col items-center justify-center p-12">
        {/* Background gradient blobs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-600/8 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-md space-y-8 animate-fade-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 ring-1 ring-blue-500/20" style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}>
            <Wallet size={32} className="text-blue-500" />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
              Todos os seus investimentos,{' '}
              <span className="text-blue-500">um único lugar.</span>
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed">
              Ações, FIIs, criptomoedas e renda fixa consolidados em tempo real.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            {features.map((f, i) => (
              <div key={i} className={`flex items-center gap-3 animate-fade-in stagger-${i + 1}`}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800/80 ring-1 ring-zinc-700/50">
                  <f.icon size={18} className="text-zinc-300" />
                </div>
                <span className="text-sm text-zinc-300">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/50 via-zinc-950 to-black px-6 py-16 lg:bg-background lg:from-transparent lg:via-transparent lg:to-transparent">

        <div className="w-full max-w-sm flex flex-col items-center animate-fade-in">

          {/* Logo (mobile) */}
          <div className="lg:hidden flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600/10 ring-1 ring-blue-500/20 mb-8" style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}>
            <Wallet size={40} className="text-blue-500" />
          </div>

          {/* Desktop subtitle */}
          <div className="hidden lg:flex items-center gap-3 mb-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 ring-1 ring-blue-500/20">
              <Wallet size={20} className="text-blue-500" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Easy<span className="text-blue-500">Invest</span>
            </span>
          </div>

          <h2 className="text-3xl lg:text-2xl font-bold tracking-tight text-white mb-3 text-center">
            <span className="lg:hidden">Consolide seus investimentos</span>
            <span className="hidden lg:inline">Entrar na sua conta</span>
          </h2>
          <p className="text-zinc-400 text-center text-base lg:text-sm mb-10 max-w-xs">
            <span className="lg:hidden">Acompanhe todos os seus ativos em um único lugar, de forma segura e inteligente.</span>
            <span className="hidden lg:inline">Use sua conta Google para acessar o painel.</span>
          </p>

          {/* Sign in Button */}
          <button
            ref={buttonRef}
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-white px-8 py-4 font-semibold text-zinc-900 transition-all duration-200 hover:bg-zinc-100 hover:shadow-lg hover:shadow-white/5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
            )}
            <span>{isLoggingIn ? 'Entrando...' : 'Entrar com o Google'}</span>
            {!isLoggingIn && (
              <ArrowRight size={18} className="absolute right-6 opacity-0 -translate-x-4 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
            )}
          </button>

          {error && (
            <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
          )}

          <p className="mt-8 text-xs text-zinc-600 text-center max-w-xs">
            Ao entrar, você concorda com nossos Termos de Serviço e Política de Privacidade.
          </p>
        </div>
      </div>
    </div>
  );
}
