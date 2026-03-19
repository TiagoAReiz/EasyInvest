'use client';

import { useState } from 'react';
import { Search, TrendingUp, TrendingDown, X, PackageOpen } from 'lucide-react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { AssetTypeEnum } from '@/lib/types';
import Skeleton from '@/components/Skeleton';

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
  const { positions, isLoading, error } = usePortfolio();
  const [activeTab, setActiveTab] = useState<TabType>('variavel');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    <div className="flex flex-col px-4 pt-10 pb-8 lg:px-8 lg:pt-8 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <header className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">Meus Investimentos</h1>
          <p className="text-sm text-zinc-500 mt-1 hidden sm:block">
            {totalAssets} {totalAssets === 1 ? 'ativo' : 'ativos'} na carteira
          </p>
        </div>
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="p-2.5 glass-card rounded-xl text-zinc-400 hover:text-white transition-colors"
        >
          {searchOpen ? <X size={18} /> : <Search size={18} />}
        </button>
      </header>

      {/* Search bar (toggle) */}
      {searchOpen && (
        <div className="animate-fade-in-scale">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar ativo por nome ou ticker..."
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide animate-fade-in stagger-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'glass-card text-zinc-400 hover:text-white hover:bg-card-hover'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 text-red-400 rounded-xl p-4 text-sm ring-1 ring-red-500/20">
          {error}
        </div>
      )}

      {/* Desktop Table Header */}
      {!isLoading && filteredPositions.length > 0 && (
        <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
          <span className="col-span-3">Ativo</span>
          <span className="col-span-2 text-right">Quantidade</span>
          <span className="col-span-2 text-right">Preço Médio</span>
          <span className="col-span-2 text-right">Preço Atual</span>
          <span className="col-span-3 text-right">Rentabilidade</span>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex flex-col space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl lg:rounded-xl" />
          ))}
        </div>
      ) : (
        /* Assets List */
        <div className="flex flex-col space-y-2">
          {filteredPositions.map((pos, i) => {
            const profitPct = pos.average_price > 0 && pos.current_price
              ? ((pos.current_price - pos.average_price) / pos.average_price) * 100
              : 0;
            const profitValue = pos.profit_loss ?? 0;
            const isPositive = profitPct >= 0;

            return (
              <div
                key={pos.id}
                className={`glass-card hover:bg-card-hover rounded-2xl lg:rounded-xl p-4 transition-all duration-200 cursor-pointer animate-fade-in stagger-${Math.min(i + 1, 5)}`}
              >
                {/* Mobile layout */}
                <div className="flex items-center justify-between lg:hidden">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{pos.ticker}</span>
                      <span className="text-[10px] text-zinc-600 font-medium bg-zinc-800 px-1.5 py-0.5 rounded">
                        {pos.quantity} cotas
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500 truncate mt-0.5">{pos.asset_name}</span>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-sm text-zinc-200 font-semibold">
                      {pos.current_price ? formatCurrency(pos.current_price) : '—'}
                    </span>
                    <span className={`text-xs font-bold flex items-center gap-0.5 mt-0.5 ${
                      isPositive ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {isPositive ? '+' : ''}{profitPct.toFixed(1)}%
                      <span className="text-zinc-600 font-normal ml-1">
                        ({profitValue >= 0 ? '+' : ''}{formatCurrency(profitValue)})
                      </span>
                    </span>
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
                  <div className="col-span-3 flex flex-col">
                    <span className="text-white font-bold">{pos.ticker}</span>
                    <span className="text-xs text-zinc-500 truncate">{pos.asset_name}</span>
                  </div>
                  <span className="col-span-2 text-right text-sm text-zinc-300">{pos.quantity}</span>
                  <span className="col-span-2 text-right text-sm text-zinc-400">{formatCurrency(pos.average_price)}</span>
                  <span className="col-span-2 text-right text-sm text-zinc-200 font-medium">
                    {pos.current_price ? formatCurrency(pos.current_price) : '—'}
                  </span>
                  <div className="col-span-3 flex flex-col items-end">
                    <span className={`text-sm font-bold flex items-center gap-1 ${
                      isPositive ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      {isPositive ? '+' : ''}{profitPct.toFixed(1)}%
                    </span>
                    <span className={`text-xs ${
                      profitValue >= 0 ? 'text-emerald-400/60' : 'text-red-400/60'
                    }`}>
                      {profitValue >= 0 ? '+' : ''}{formatCurrency(profitValue)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredPositions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500 animate-fade-in">
              {searchQuery ? (
                <>
                  <Search size={32} className="mb-3 text-zinc-700" />
                  <p className="font-medium">Nenhum ativo encontrado.</p>
                  <p className="text-sm text-zinc-600 mt-1">Tente buscar por outro termo.</p>
                </>
              ) : (
                <>
                  <PackageOpen size={32} className="mb-3 text-zinc-700" />
                  <p className="font-medium">Nenhum ativo nesta categoria.</p>
                  <p className="text-sm text-zinc-600 mt-1">Adicione seu primeiro investimento.</p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
