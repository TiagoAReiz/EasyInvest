'use client';

import { useState } from 'react';
import { ChevronDown, Mail } from 'lucide-react';
import SettingsPageLayout from '@/components/SettingsPageLayout';

const faqItems = [
  {
    q: 'Como adicionar uma posição manualmente?',
    a: 'Acesse "Carteira" e clique em "Adicionar". Escolha entre Renda Variável ou Renda Fixa, busque o ativo, preencha quantidade e preço médio e confirme.',
  },
  {
    q: 'Meus dados estão seguros?',
    a: 'Sim. Utilizamos criptografia em trânsito (HTTPS) e em repouso. Seus dados são armazenados de forma segura e a autenticação é feita via Google OAuth.',
  },
  {
    q: 'Como funciona o cálculo de rentabilidade?',
    a: 'Para renda variável, comparamos o preço médio de compra com a cotação atual via brapi.dev. Para renda fixa, simulamos o rendimento com base na taxa CDI atualizada pelo Banco Central.',
  },
  {
    q: 'O EasyInvest tem acesso à minha conta bancária?',
    a: 'Não. O EasyInvest é uma ferramenta de consolidação e visualização. Não realizamos nenhuma transação financeira em seu nome.',
  },
  {
    q: 'Posso usar o app gratuitamente?',
    a: 'O EasyInvest é um serviço premium. Ao se cadastrar, você tem acesso completo a todas as funcionalidades da plataforma.',
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <SettingsPageLayout title="Central de Ajuda" description="Perguntas frequentes e suporte.">

      {/* ── FAQ Accordion ── */}
      <section className="space-y-3 animate-fade-in stagger-1">
        {faqItems.map((item, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className="w-full glass-card rounded-2xl p-5 text-left transition-all duration-200 border border-border/40 hover:border-border-hover"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-foreground flex-1 font-[family-name:var(--font-outfit)]">
                {item.q}
              </span>
              <ChevronDown
                size={16}
                className={`text-muted-secondary shrink-0 transition-transform duration-200 ${
                  openIndex === i ? 'rotate-180 text-accent' : ''
                }`}
              />
            </div>
            {openIndex === i && (
              <p className="text-[13px] text-muted leading-relaxed mt-3 pr-6">
                {item.a}
              </p>
            )}
          </button>
        ))}
      </section>

      {/* ── Contact ── */}
      <section className="glass-card rounded-2xl p-6 text-center space-y-3 animate-fade-in stagger-2">
        <div className="mx-auto w-fit p-3 bg-accent/10 rounded-xl">
          <Mail size={20} className="text-accent" />
        </div>
        <h3 className="text-sm font-bold text-foreground font-[family-name:var(--font-outfit)]">
          Ainda precisa de ajuda?
        </h3>
        <p className="text-[12px] text-muted-secondary">
          Entre em contato pelo e-mail abaixo e responderemos o mais rápido possível.
        </p>
        <a
          href="mailto:suporte@easyinvest.com.br"
          className="inline-block text-sm text-accent hover:text-accent/80 font-bold transition-colors"
        >
          suporte@easyinvest.com.br
        </a>
      </section>
    </SettingsPageLayout>
  );
}
