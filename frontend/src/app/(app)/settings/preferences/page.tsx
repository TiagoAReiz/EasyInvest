'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/hooks/useSettings';
import SettingsPageLayout from '@/components/SettingsPageLayout';

export default function PreferencesPage() {
  const { theme, setTheme } = useTheme();
  const { updateSettings } = useSettings();

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    updateSettings({ theme: newTheme });
  };

  return (
    <SettingsPageLayout title="Preferências Gerais" description="Personalize a aparência e comportamento do app.">

      {/* ── Theme ── */}
      <section className="space-y-3 animate-fade-in stagger-1">
        <h3 className="text-sm font-bold text-muted uppercase tracking-wider font-[family-name:var(--font-outfit)]">
          Aparência
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleThemeChange('dark')}
            className={`glass-card rounded-2xl p-5 flex flex-col items-center gap-3 transition-all duration-200 border ${
              theme === 'dark'
                ? 'ring-2 ring-accent border-accent/30'
                : 'border-border/40 hover:border-border-hover'
            }`}
          >
            <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-accent/10 text-accent' : 'bg-surface text-muted'}`}>
              <Moon size={22} />
            </div>
            <span className="text-sm font-bold text-foreground font-[family-name:var(--font-outfit)]">Escuro</span>
          </button>

          <button
            onClick={() => handleThemeChange('light')}
            className={`glass-card rounded-2xl p-5 flex flex-col items-center gap-3 transition-all duration-200 border ${
              theme === 'light'
                ? 'ring-2 ring-accent border-accent/30'
                : 'border-border/40 hover:border-border-hover'
            }`}
          >
            <div className={`p-3 rounded-xl ${theme === 'light' ? 'bg-accent/10 text-accent' : 'bg-surface text-muted'}`}>
              <Sun size={22} />
            </div>
            <span className="text-sm font-bold text-foreground font-[family-name:var(--font-outfit)]">Claro</span>
          </button>
        </div>
      </section>
    </SettingsPageLayout>
  );
}
