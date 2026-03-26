'use client';

import { useState } from 'react';
import { Plus, ArrowUpRight, ArrowDownRight, PackageOpen } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import Link from 'next/link';
import { usePortfolioSummary } from '@/hooks/usePortfolio';
import { useHistory } from '@/hooks/useHistory';
import Skeleton from '@/components/Skeleton';

const formatBRL = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const ALLOCATION_COLORS = {
  variavel: '#f5c518',
  cripto: '#d4af37',
  fixa: '#34d399',
};

export default function DashboardPage() {
  const [timeFilter, setTimeFilter] = useState('30d');
  const { summary, isLoading: summaryLoading } = usePortfolioSummary();
  const { history, isLoading: historyLoading } = useHistory(timeFilter);

  const chartData = history.map((h) => ({
    date: new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    value: h.total_equity,
  }));

  const totalEquity = summary?.total_equity || 0;
  const allocation = totalEquity > 0 ? [
    { name: 'Renda Variável', value: Math.round(((summary!.stock_equity + summary!.fii_equity) / totalEquity) * 100), color: ALLOCATION_COLORS.variavel },
    { name: 'Criptomoedas', value: Math.round((summary!.crypto_equity / totalEquity) * 100), color: ALLOCATION_COLORS.cripto },
    { name: 'Renda Fixa', value: Math.round((summary!.fixed_income_equity / totalEquity) * 100), color: ALLOCATION_COLORS.fixa },
  ] : [];

  const topPerformers = summary
    ? [...summary.positions]
        .filter((p) => p.profit_loss !== null)
        .sort((a, b) => Math.abs(b.profit_loss!) - Math.abs(a.profit_loss!))
        .slice(0, 4)
        .map((p) => ({
          ticker: p.ticker,
          name: p.asset_name,
          change: p.average_price > 0 && p.current_price
            ? ((p.current_price - p.average_price) / p.average_price) * 100
            : 0,
        }))
    : [];

  const isEmpty = !summaryLoading && summary && summary.positions.length === 0;

  return (
    <div className="flex flex-col px-4 pt-8 pb-10 lg:px-8 lg:pt-10 space-y-6 max-w-7xl mx-auto">

      {/* ── Header & Quick Actions ── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground font-[family-name:var(--font-outfit)]">
            Visão Geral
          </h1>
          <p className="text-sm text-muted mt-1">
            Consolidado de todo o seu patrimônio.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/add-position"
            className="flex items-center gap-2 btn-accent py-2.5 px-5 rounded-full font-bold transition-all duration-200 text-sm"
          >
            <Plus size={16} />
            <span>Adicionar</span>
          </Link>
        </div>
      </header>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-tertiary animate-fade-in glass-card rounded-2xl">
          <PackageOpen size={48} className="mb-4 text-border-hover" />
          <p className="text-lg font-medium text-muted">Carteira vazia</p>
          <p className="text-sm text-muted-secondary mt-1 mb-6">Adicione seus investimentos manualmente.</p>
          <div className="flex gap-3">
            <Link href="/add-position" className="btn-accent px-6 py-2.5 rounded-full font-bold transition-all text-sm">
              Adicionar Manual
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">

          {/* ── Bento Grid Top Row: Hero Equity + Allocation ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in stagger-1">

            {/* Hero Equity Card */}
            <section className="lg:col-span-2 glass-card rounded-3xl p-8 lg:p-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-accent/[0.03] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />

              <div className="relative z-10">
                <p className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
                  Patrimônio Total
                </p>
                <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-4">
                  {summaryLoading ? (
                    <Skeleton className="h-14 w-72" />
                  ) : (
                    <h2 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-foreground font-[family-name:var(--font-outfit)]">
                      {formatBRL(totalEquity)}
                    </h2>
                  )}
                </div>
              </div>

              {/* Decorative background lines */}
              <div className="absolute bottom-0 right-0 left-0 h-24 opacity-20 pointer-events-none" style={{ maskImage: 'linear-gradient(to top, black, transparent)' }}>
                {chartData.length > 0 && !historyLoading && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Area type="monotone" dataKey="value" stroke="none" fill="var(--accent)" fillOpacity={1} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            {/* Asset Allocation Donut */}
            <section className="glass-card rounded-3xl p-7 flex flex-col justify-between relative gold-top-accent">
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-6">Alocação</h3>

              {summaryLoading ? (
                <div className="flex flex-col items-center gap-5 my-auto">
                  <Skeleton className="h-[120px] w-[120px] rounded-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : allocation.length > 0 ? (
                <div className="flex flex-col items-center gap-6 my-auto">
                  <div className="h-[140px] w-[140px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocation}
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={70}
                          stroke="none"
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {allocation.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-muted-secondary font-semibold uppercase tracking-widest">Total</span>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-3 w-full">
                    {allocation.map((item) => (
                      <div key={item.name} className="flex items-center justify-between group cursor-default">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-sm transition-transform group-hover:scale-125" style={{ backgroundColor: item.color }} />
                          <span className="text-xs text-muted transition-colors group-hover:text-foreground">{item.name}</span>
                        </div>
                        <span className="text-sm font-bold text-foreground font-[family-name:var(--font-outfit)]">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-tertiary text-sm">
                  Sem dados.
                </div>
              )}
            </section>

          </div>

          {/* ── Bento Grid Middle Row: Evolution Chart ── */}
          <section className="glass-card rounded-3xl p-6 lg:p-8 flex flex-col space-y-6 animate-fade-in stagger-2 relative gold-top-accent">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Evolução Patrimonial</h3>
              <div className="flex bg-surface rounded-lg p-1 ring-1 ring-border/50">
                {['7d', '30d', '90d', '1y'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setTimeFilter(f)}
                    className={`text-xs font-bold px-4 py-1.5 rounded-md transition-all duration-200 ${
                      timeFilter === f
                        ? 'bg-accent text-background shadow-sm'
                        : 'text-muted-secondary hover:text-foreground'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-64 lg:h-72 w-full">
              {historyLoading ? (
                <Skeleton className="w-full h-full rounded-xl" />
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAccent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--accent-glow)',
                        borderRadius: '12px',
                        color: 'var(--foreground)',
                        fontSize: '13px',
                        fontWeight: '600',
                        padding: '10px 14px',
                        boxShadow: '0 10px 25px -5px var(--shadow-color)',
                      }}
                      formatter={(value) => [formatBRL(Number(value)), 'Patrimônio']}
                      labelStyle={{ color: 'var(--muted)', marginBottom: '4px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--accent)"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorAccent)"
                      activeDot={{ r: 6, fill: 'var(--accent)', stroke: 'var(--card)', strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-tertiary text-sm">
                  Sem dados para o período selecionado.
                </div>
              )}
            </div>
          </section>

          {/* ── Bento Grid Bottom Row: Top Performers ── */}
          {topPerformers.length > 0 && (
            <section className="glass-card rounded-3xl p-6 lg:p-8 animate-fade-in stagger-3 relative gold-top-accent">
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-6">Destaques da Carteira</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {topPerformers.map((asset) => (
                  <div
                    key={asset.ticker}
                    className="flex items-center justify-between bg-surface hover:bg-card-hover rounded-2xl px-5 py-4 transition-colors border border-border/40 group"
                  >
                    <div className="flex flex-col">
                      <span className="text-foreground font-bold text-sm font-[family-name:var(--font-outfit)]">{asset.ticker}</span>
                      <span className="text-[11px] text-muted-secondary max-w-[100px] truncate">{asset.name}</span>
                    </div>
                    <span className={`flex items-center gap-1 text-sm font-bold ${
                      asset.change >= 0 ? 'text-positive' : 'text-negative'
                    }`}>
                      {asset.change >= 0 ? <ArrowUpRight size={16} strokeWidth={2.5} /> : <ArrowDownRight size={16} strokeWidth={2.5} />}
                      {Math.abs(asset.change).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
}
