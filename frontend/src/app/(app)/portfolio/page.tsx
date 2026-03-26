'use client';

import { useState } from 'react';
import { Search, TrendingUp, TrendingDown, PackageOpen, Calendar, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePortfolio } from '@/hooks/usePortfolio';
import { AssetTypeEnum } from '@/lib/types';
import type { PositionWithQuote, PositionUpdateRequest } from '@/lib/types';
import { updatePosition, deletePosition } from '@/services/portfolioService';
import Skeleton from '@/components/Skeleton';
import EditPositionModal from '@/components/EditPositionModal';

type TabType = 'variavel' | 'cripto' | 'fixa';

const tabs = [
  { id: 'variavel' as TabType, label: 'Renda Variável' },
  { id: 'cripto' as TabType, label: 'Criptomoedas' },
  { id: 'fixa' as TabType, label: 'Renda Fixa' },
];

const tabAssetTypes: Record<TabType, AssetTypeEnum[]> = {
  variavel: [AssetTypeEnum.STOCK, AssetTypeEnum.FII],
  cripto: [AssetTypeEnum.CRYPTO],
  fixa: [AssetTypeEnum.FIXED_INCOME],
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export default function PortfolioPage() {
  const { positions, isLoading, error, refetch } = usePortfolio();
  const [activeTab, setActiveTab] = useState<TabType>('variavel');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPosition, setEditingPosition] = useState<PositionWithQuote | null>(null);

  const handleSave = async (id: string, data: PositionUpdateRequest) => {
    await updatePosition(id, data);
    setEditingPosition(null);
    refetch();
  };

  const handleDelete = async (id: string) => {
    await deletePosition(id);
    setEditingPosition(null);
    refetch();
  };

  const filteredPositions = positions
    .filter((p) => tabAssetTypes[activeTab].includes(p.asset_type))
    .filter(
      (p) =>
        !searchQuery ||
        p.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.asset_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const totalAssets = positions.length;

  return (
    <div className="flex flex-col px-4 pt-8 pb-10 lg:px-8 lg:pt-10 space-y-8 max-w-7xl mx-auto">

      {/* ── Header + Integrated Search ── */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground font-[family-name:var(--font-outfit)]">
            Carteira
          </h1>
          <p className="text-sm text-muted mt-1">
            {totalAssets} {totalAssets === 1 ? 'ativo monitorado' : 'ativos monitorados'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <Link
            href="/add-position"
            className="flex items-center gap-2 btn-accent py-2.5 px-5 rounded-full font-bold transition-all duration-200 text-sm shrink-0"
          >
            <Plus size={16} />
            <span>Adicionar</span>
          </Link>
          <div className="relative flex-1 lg:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-secondary" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou ticker..."
            className="w-full bg-surface border border-border/60 rounded-full py-2.5 pl-11 pr-5 text-sm text-foreground placeholder:text-muted-secondary focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/40 transition-all shadow-inner"
          />
          </div>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="bg-negative/10 text-negative rounded-2xl p-4 text-sm ring-1 ring-negative/20 animate-fade-in">
          {error}
        </div>
      )}

      {/* ── Tabs (Underline Style) ── */}
      <div className="flex gap-6 border-b border-border/60 overflow-x-auto scrollbar-hide animate-fade-in stagger-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap pb-4 text-sm font-bold transition-all relative ${
              activeTab === tab.id
                ? 'text-accent'
                : 'text-muted-secondary hover:text-muted'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-accent rounded-t-full shadow-[0_-2px_8px_var(--accent-glow)]" />
            )}
          </button>
        ))}
      </div>

      {/* Desktop Table Header */}
      {!isLoading && filteredPositions.length > 0 && (
        activeTab === 'fixa' ? (
          <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 text-[11px] font-bold text-muted-secondary uppercase tracking-widest pt-2">
            <span className="col-span-3">Titulo</span>
            <span className="col-span-2 text-right">Investido</span>
            <span className="col-span-2 text-right">Taxa</span>
            <span className="col-span-2 text-right">Valor Atual</span>
            <span className="col-span-3 text-right">Rendimento</span>
          </div>
        ) : (
          <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 text-[11px] font-bold text-muted-secondary uppercase tracking-widest pt-2">
            <span className="col-span-4">Ativo</span>
            <span className="col-span-2 text-right">Quantidade</span>
            <span className="col-span-2 text-right">Preco Medio</span>
            <span className="col-span-2 text-right">Preco Atual</span>
            <span className="col-span-2 text-right">Rentabilidade</span>
          </div>
        )
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredPositions.map((pos, i) => {
            const isFixedIncome = pos.asset_type === AssetTypeEnum.FIXED_INCOME;

            if (isFixedIncome) {
              const invested = pos.invested_amount ?? 0;
              const currentVal = pos.current_value ?? invested;
              const profit = pos.profit_loss ?? 0;
              const profitPct = invested > 0 ? (profit / invested) * 100 : 0;
              const isPositive = profit >= 0;

              const rateLabel = pos.rate_type === 'CDI_PERCENTAGE'
                ? `${pos.rate_value}% CDI`
                : pos.rate_type === 'CDI_PLUS'
                ? `CDI + ${pos.rate_value}%`
                : pos.rate_type === 'PREFIXED'
                ? `${pos.rate_value}% a.a.`
                : pos.rate_type === 'IPCA_PLUS'
                ? `IPCA + ${pos.rate_value}%`
                : '—';

              const formatDate = (d: string | null) =>
                d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—';

              return (
                <div
                  key={pos.id}
                  onClick={() => setEditingPosition(pos)}
                  className={`glass-card rounded-2xl p-5 lg:px-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-shadow cursor-pointer animate-fade-in stagger-${Math.min(i + 2, 6)} group relative overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/[0.02] rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Mobile layout - Renda Fixa */}
                  <div className="flex flex-col gap-3 lg:hidden relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col min-w-0">
                        <span className="text-foreground font-bold font-[family-name:var(--font-outfit)] truncate max-w-[200px]">{pos.asset_name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-accent/70 font-semibold bg-accent/[0.06] px-1.5 py-0.5 rounded">
                            {rateLabel}
                          </span>
                          {pos.institution_name && (
                            <span className="text-[10px] text-muted-secondary">{pos.institution_name}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-sm text-foreground font-bold font-[family-name:var(--font-outfit)]">
                          {formatCurrency(currentVal)}
                        </span>
                        <span className={`text-xs font-bold flex items-center gap-0.5 mt-0.5 ${
                          isPositive ? 'text-positive' : 'text-negative'
                        }`}>
                          {isPositive ? <TrendingUp size={12} strokeWidth={2.5} /> : <TrendingDown size={12} strokeWidth={2.5} />}
                          {isPositive ? '+' : ''}{formatCurrency(profit)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-secondary border-t border-border/40 pt-2">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} /> {formatDate(pos.investment_date)} → {formatDate(pos.maturity_date)}
                      </span>
                      <span>Investido: {formatCurrency(invested)}</span>
                    </div>
                  </div>

                  {/* Desktop layout - Renda Fixa */}
                  <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center relative z-10">
                    <div className="col-span-3 flex flex-col">
                      <span className="text-foreground font-bold text-base font-[family-name:var(--font-outfit)] truncate max-w-[250px]">{pos.asset_name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {pos.institution_name && (
                          <span className="text-[11px] text-muted-secondary">{pos.institution_name}</span>
                        )}
                        <span className="text-[11px] text-muted-tertiary flex items-center gap-1">
                          <Calendar size={10} /> {formatDate(pos.investment_date)} → {formatDate(pos.maturity_date)}
                        </span>
                      </div>
                    </div>
                    <span className="col-span-2 text-right text-sm text-muted">{formatCurrency(invested)}</span>
                    <div className="col-span-2 text-right">
                      <span className="inline-block text-accent/80 font-semibold bg-accent/[0.06] px-2.5 py-1 rounded text-xs">
                        {rateLabel}
                      </span>
                    </div>
                    <span className="col-span-2 text-right text-[15px] text-foreground font-bold font-[family-name:var(--font-outfit)]">
                      {formatCurrency(currentVal)}
                    </span>
                    <div className="col-span-3 flex flex-col items-end justify-center">
                      <span className={`text-[15px] font-bold flex items-center gap-1 ${
                        isPositive ? 'text-positive' : 'text-negative'
                      }`}>
                        {isPositive ? <TrendingUp size={14} strokeWidth={2.5} /> : <TrendingDown size={14} strokeWidth={2.5} />}
                        {isPositive ? '+' : ''}{profitPct.toFixed(2)}%
                      </span>
                      <span className={`text-[11px] font-medium mt-0.5 ${
                        isPositive ? 'text-positive/60' : 'text-negative/60'
                      }`}>
                        {isPositive ? '+' : ''}{formatCurrency(profit)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            const profitPct = pos.average_price > 0 && pos.current_price
              ? ((pos.current_price - pos.average_price) / pos.average_price) * 100
              : 0;
            const profitValue = pos.profit_loss ?? 0;
            const isPositive = profitPct >= 0;

            return (
              <div
                key={pos.id}
                onClick={() => setEditingPosition(pos)}
                className={`glass-card rounded-2xl p-5 lg:px-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-shadow cursor-pointer animate-fade-in stagger-${Math.min(i + 2, 6)} group relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/[0.02] rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Mobile layout */}
                <div className="flex items-center justify-between lg:hidden relative z-10">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-foreground font-bold font-[family-name:var(--font-outfit)]">{pos.ticker}</span>
                      <span className="text-[10px] text-accent/70 font-semibold bg-accent/[0.06] px-1.5 py-0.5 rounded uppercase">
                        {pos.quantity} ud
                      </span>
                    </div>
                    <span className="text-xs text-muted truncate max-w-[180px]">{pos.asset_name}</span>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-sm text-foreground font-bold font-[family-name:var(--font-outfit)]">
                      {pos.current_price ? formatCurrency(pos.current_price) : '—'}
                    </span>
                    <span className={`text-xs font-bold flex items-center gap-0.5 mt-0.5 ${
                      isPositive ? 'text-positive' : 'text-negative'
                    }`}>
                      {isPositive ? <TrendingUp size={12} strokeWidth={2.5} /> : <TrendingDown size={12} strokeWidth={2.5} />}
                      {isPositive ? '+' : ''}{profitPct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center relative z-10">
                  <div className="col-span-4 flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-foreground font-bold text-base font-[family-name:var(--font-outfit)]">{pos.ticker}</span>
                      <span className="text-xs text-muted truncate max-w-[200px]">{pos.asset_name}</span>
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="inline-block text-accent/80 font-semibold bg-accent/[0.06] px-2.5 py-1 rounded text-xs">
                      {pos.quantity} ud
                    </span>
                  </div>
                  <span className="col-span-2 text-right text-sm text-muted">{formatCurrency(pos.average_price)}</span>
                  <span className="col-span-2 text-right text-[15px] text-foreground font-bold font-[family-name:var(--font-outfit)]">
                    {pos.current_price ? formatCurrency(pos.current_price) : '—'}
                  </span>
                  <div className="col-span-2 flex flex-col items-end justify-center">
                    <span className={`text-[15px] font-bold flex items-center gap-1 ${
                      isPositive ? 'text-positive' : 'text-negative'
                    }`}>
                      {isPositive ? <TrendingUp size={14} strokeWidth={2.5} /> : <TrendingDown size={14} strokeWidth={2.5} />}
                      {isPositive ? '+' : ''}{profitPct.toFixed(1)}%
                    </span>
                    <span className={`text-[11px] font-medium mt-0.5 ${
                      profitValue >= 0 ? 'text-positive/60' : 'text-negative/60'
                    }`}>
                      {profitValue >= 0 ? '+' : ''}{formatCurrency(profitValue)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredPositions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-muted-tertiary animate-fade-in glass-card rounded-3xl mt-4 border-dashed border-border">
              <PackageOpen size={48} className="mb-4 text-border-hover" />
              <p className="font-bold text-lg text-muted">Nenhum ativo listado.</p>
              <p className="text-sm text-muted-secondary mt-1 max-w-xs text-center">
                {searchQuery
                  ? "Nao encontramos resultados para sua busca atual."
                  : "Sua carteira nesta categoria esta vazia. Adicione novas posicoes para ve-las aqui."}
              </p>
              {!searchQuery && (
                <Link
                  href="/add-position"
                  className="flex items-center gap-2 btn-accent py-2.5 px-6 rounded-full font-bold transition-all duration-200 text-sm mt-6"
                >
                  <Plus size={16} />
                  Adicionar Posição
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {editingPosition && (
        <EditPositionModal
          position={editingPosition}
          onClose={() => setEditingPosition(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
