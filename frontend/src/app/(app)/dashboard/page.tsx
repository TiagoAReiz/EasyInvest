'use client';

import { Plus, Link as LinkIcon, TrendingUp, ArrowUpRight, ArrowDownRight, PackageOpen } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import Link from 'next/link';
import { useState } from 'react';
import { usePortfolioSummary } from '@/hooks/usePortfolio';
import { useHistory } from '@/hooks/useHistory';
import Skeleton from '@/components/Skeleton';

const formatBRL = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const ALLOCATION_COLORS = {
  variavel: '#3b82f6',
  cripto: '#8b5cf6',
  fixa: '#10b981',
};

export default function DashboardPage() {
  const [timeFilter, setTimeFilter] = useState('30d');
  const { summary, isLoading: summaryLoading } = usePortfolioSummary();
  const { history, isLoading: historyLoading } = useHistory(timeFilter);

  const chartData = history.map((h) => ({
    date: new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    value: h.total_equity,
  }));

  // Allocation calculation
  const totalEquity = summary?.total_equity || 0;
  const allocation = totalEquity > 0 ? [
    { name: 'Renda Variável', value: Math.round(((summary!.stock_equity + summary!.fii_equity) / totalEquity) * 100), color: ALLOCATION_COLORS.variavel },
    { name: 'Criptomoedas', value: Math.round((summary!.crypto_equity / totalEquity) * 100), color: ALLOCATION_COLORS.cripto },
    { name: 'Renda Fixa', value: Math.round((summary!.fixed_income_equity / totalEquity) * 100), color: ALLOCATION_COLORS.fixa },
  ] : [];

  // Top performers (sorted by profit_loss, top 4)
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
    <div className="flex flex-col px-4 pt-10 pb-8 lg:px-8 lg:pt-8 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <header className="animate-fade-in">
        <p className="text-sm text-zinc-500 font-medium mb-1">Patrimônio Total</p>
        <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-4">
          {summaryLoading ? (
            <Skeleton className="h-12 w-64" />
          ) : (
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white">
              {formatBRL(totalEquity)}
            </h1>
          )}
        </div>
      </header>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in stagger-1">
        <Link
          href="/add-position"
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3.5 px-4 rounded-xl font-medium transition-all duration-200 active:scale-[0.97] shadow-lg shadow-blue-600/20"
        >
          <Plus size={18} />
          <span>Lançamento</span>
        </Link>
        <Link
          href="/connections"
          className="flex items-center justify-center gap-2 glass-card hover:bg-card-hover text-white py-3.5 px-4 rounded-xl font-medium transition-all duration-200 active:scale-[0.97]"
        >
          <LinkIcon size={18} />
          <span>Conectar</span>
        </Link>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 animate-fade-in">
          <PackageOpen size={48} className="mb-4 text-zinc-700" />
          <p className="text-lg font-medium">Sua carteira está vazia</p>
          <p className="text-sm text-zinc-600 mt-1 mb-6">Adicione seu primeiro investimento para começar.</p>
          <Link
            href="/add-position"
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-all"
          >
            Adicionar Investimento
          </Link>
        </div>
      ) : (
        <>
          {/* Main grid: Chart + Allocation side by side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Evolution Chart (2 cols) */}
            <section className="lg:col-span-2 glass-card rounded-2xl p-5 flex flex-col space-y-4 animate-fade-in stagger-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-300">Evolução Patrimonial</h3>
                <div className="flex bg-zinc-800/80 rounded-lg p-0.5 ring-1 ring-zinc-700/50">
                  {['7d', '30d', '90d', '1y'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setTimeFilter(f)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-200 ${
                        timeFilter === f
                          ? 'bg-zinc-700 text-white shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-52 lg:h-64 w-full">
                {historyLoading ? (
                  <Skeleton className="w-full h-full" />
                ) : chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          border: '1px solid #27272a',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '13px',
                          padding: '8px 12px',
                        }}
                        formatter={(value) => [formatBRL(Number(value)), 'Patrimônio']}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
                    Sem dados para o período selecionado.
                  </div>
                )}
              </div>
            </section>

            {/* Asset Allocation (1 col) */}
            <section className="glass-card rounded-2xl p-5 flex flex-col space-y-5 animate-fade-in stagger-3">
              <h3 className="text-sm font-semibold text-zinc-300">Alocação</h3>

              {summaryLoading ? (
                <div className="flex flex-col items-center gap-5">
                  <Skeleton className="h-36 w-36 rounded-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : allocation.length > 0 ? (
                <div className="flex flex-col items-center gap-5">
                  <div className="h-36 w-36 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocation}
                          cx="50%"
                          cy="50%"
                          innerRadius={46}
                          outerRadius={66}
                          stroke="none"
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {allocation.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs text-zinc-500">Total</span>
                      <span className="text-sm font-bold text-white">100%</span>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-3 w-full">
                    {allocation.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-xs text-zinc-400">{item.name}</span>
                        </div>
                        <span className="text-sm font-bold text-white">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-36 text-zinc-600 text-sm">
                  Sem dados de alocação.
                </div>
              )}
            </section>
          </div>

          {/* Top Performers */}
          {topPerformers.length > 0 && (
            <section className="glass-card rounded-2xl p-5 animate-fade-in stagger-4">
              <h3 className="text-sm font-semibold text-zinc-300 mb-4">Destaques da Carteira</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {topPerformers.map((asset) => (
                  <div
                    key={asset.ticker}
                    className="flex items-center justify-between bg-zinc-800/40 hover:bg-zinc-800/60 rounded-xl px-4 py-3 transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-sm">{asset.ticker}</span>
                      <span className="text-[11px] text-zinc-500">{asset.name}</span>
                    </div>
                    <span className={`flex items-center gap-1 text-sm font-bold ${
                      asset.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {asset.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {Math.abs(asset.change).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
