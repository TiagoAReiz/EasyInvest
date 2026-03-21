'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface SettingsPageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function SettingsPageLayout({ title, description, children }: SettingsPageLayoutProps) {
  return (
    <div className="flex flex-col px-4 pt-8 pb-10 lg:px-8 lg:pt-10 space-y-8 max-w-4xl mx-auto">
      <header className="animate-fade-in">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-4 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Configurações
        </Link>
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground font-[family-name:var(--font-outfit)]">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted mt-1">{description}</p>
        )}
      </header>
      {children}
    </div>
  );
}
