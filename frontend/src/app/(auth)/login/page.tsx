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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">

      {/* ── Left Panel — Cinematic Branding ── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-background flex-col items-center justify-center p-16 grain-overlay">

        {/* Abstract geometric shapes */}
        <div className="absolute top-20 right-20 w-32 h-32 border border-accent/10 rounded-2xl rotate-12" style={{ animation: 'float 8s ease-in-out infinite' }} />
        <div className="absolute bottom-32 left-16 w-20 h-20 border border-accent/8 rounded-full" style={{ animation: 'float 6s ease-in-out infinite 1s' }} />
        <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-accent/30 rounded-full" style={{ animation: 'float 5s ease-in-out infinite 0.5s' }} />
        <div className="absolute bottom-1/3 right-1/3 w-1.5 h-1.5 bg-accent/20 rounded-full" style={{ animation: 'float 7s ease-in-out infinite 2s' }} />

        {/* Gradient glow blobs */}
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-accent/[0.04] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] bg-accent/[0.03] rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-lg space-y-10 animate-fade-in">
          {/* Logo mark */}
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/25" style={{ animation: 'pulse-glow 4s ease-in-out infinite' }}>
            <Wallet size={28} className="text-accent" />
          </div>

          {/* Hero text — big, bold, cinematic */}
          <div className="space-y-5">
            <h1 className="text-5xl xl:text-6xl font-extrabold tracking-tight text-white leading-[1.1] font-[family-name:var(--font-outfit)]">
              <span className="animate-fade-in block">Todos os seus</span>
              <span className="animate-fade-in stagger-1 block">investimentos,</span>
              <span className="animate-fade-in stagger-2 block text-accent">um único lugar.</span>
            </h1>
            <p className="text-lg text-[#8a8a92] leading-relaxed max-w-md animate-fade-in stagger-3">
              Ações, FIIs, criptomoedas e renda fixa consolidados com segurança e inteligência.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4 pt-2">
            {features.map((f, i) => (
              <div key={i} className={`flex items-center gap-3.5 animate-fade-in stagger-${i + 4}`}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1e1e22] ring-1 ring-[#2a2a2e]">
                  <f.icon size={17} className="text-[#8a8a92]" />
                </div>
                <span className="text-sm text-[#a0a0a8]">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel — Login Form ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#111114] px-6 py-16 lg:bg-[#111114] relative">
        {/* Subtle radial glow on mobile */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/[0.03] rounded-full blur-[100px] lg:hidden" />

        <div className="w-full max-w-sm flex flex-col items-center relative z-10 animate-fade-in">

          {/* Logo (mobile) */}
          <div className="lg:hidden flex h-20 w-20 items-center justify-center rounded-3xl bg-accent/10 ring-1 ring-accent/25 mb-8" style={{ animation: 'pulse-glow 4s ease-in-out infinite' }}>
            <Wallet size={40} className="text-accent" />
          </div>

          {/* Desktop logo inline */}
          <div className="hidden lg:flex items-center gap-2.5 mb-12">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/25">
              <Wallet size={20} className="text-accent" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-[family-name:var(--font-outfit)]">
              Easy<span className="text-accent">Invest</span>
            </span>
          </div>

          <h2 className="text-3xl lg:text-2xl font-bold tracking-tight text-white mb-3 text-center font-[family-name:var(--font-outfit)]">
            <span className="lg:hidden">Consolide seus investimentos</span>
            <span className="hidden lg:inline">Entrar na sua conta</span>
          </h2>
          <p className="text-[#6a6a72] text-center text-base lg:text-sm mb-10 max-w-xs">
            <span className="lg:hidden">Acompanhe todos os seus ativos em um único lugar, de forma segura e inteligente.</span>
            <span className="hidden lg:inline">Use sua conta Google para acessar o painel.</span>
          </p>

          {/* Google Sign In — vibrant yellow CTA */}
          <button
            ref={buttonRef}
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl btn-accent px-8 py-4 text-[15px] active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed"
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
            <span className="font-bold">{isLoggingIn ? 'Entrando...' : 'Entrar com o Google'}</span>
            {!isLoggingIn && (
              <ArrowRight size={18} className="absolute right-6 opacity-0 -translate-x-4 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
            )}
          </button>

          {error && (
            <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
          )}

          <p className="mt-10 text-xs text-[#3a3a42] text-center max-w-xs leading-relaxed">
            Ao entrar, você concorda com nossos Termos de Serviço e Política de Privacidade.
          </p>
        </div>
      </div>
    </div>
  );
}
