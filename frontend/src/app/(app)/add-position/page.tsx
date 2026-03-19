'use client';

import { useState } from 'react';
import { Search, ChevronLeft, Calendar, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAssetSearch } from '@/hooks/useAssetSearch';
import AssetSearchDropdown from '@/components/AssetSearchDropdown';
import { createPosition } from '@/lib/api';
import type { AssetResponse } from '@/lib/types';
import { OriginEnum, RateTypeEnum } from '@/lib/types';

type AssetType = 'variavel' | 'fixa';

export default function AddPositionPage() {
  const router = useRouter();
  const [assetType, setAssetType] = useState<AssetType>('variavel');
  const { results, isSearching, search } = useAssetSearch();

  // Variavel fields
  const [tickerQuery, setTickerQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<AssetResponse | null>(null);
  const [quantity, setQuantity] = useState('');
  const [averagePrice, setAveragePrice] = useState('');
  const [institution, setInstitution] = useState('');

  // Fixa fields
  const [fixaName, setFixaName] = useState('');
  const [fixaInstitution, setFixaInstitution] = useState('');
  const [investedAmount, setInvestedAmount] = useState('');
  const [rateValue, setRateValue] = useState('');
  const [investmentDate, setInvestmentDate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleTickerChange = (value: string) => {
    setTickerQuery(value);
    setSelectedAsset(null);
    search(value);
    setShowDropdown(true);
  };

  const handleAssetSelect = (asset: AssetResponse) => {
    setSelectedAsset(asset);
    setTickerQuery(asset.ticker);
    setShowDropdown(false);
  };

  const handleSubmit = async () => {
    setError(null);

    if (assetType === 'variavel') {
      if (!selectedAsset) {
        setError('Selecione um ativo da lista de busca.');
        return;
      }
      if (!quantity || !averagePrice) {
        setError('Preencha quantidade e preço médio.');
        return;
      }

      setIsSubmitting(true);
      try {
        await createPosition({
          asset_id: selectedAsset.id,
          quantity: parseFloat(quantity),
          average_price: parseFloat(averagePrice),
          origin: OriginEnum.MANUAL,
          institution_name: institution || undefined,
        });
        router.push('/portfolio');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar posição');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Renda fixa — still needs an asset to be created/found in backend
      // For now, we validate and submit with what we have
      if (!fixaName || !investedAmount) {
        setError('Preencha nome e valor investido.');
        return;
      }

      setIsSubmitting(true);
      try {
        // Search for the fixed income asset by name
        const assets = await (await import('@/lib/api')).searchAssets(fixaName);
        if (assets.length === 0) {
          setError('Ativo de renda fixa não encontrado. Verifique o nome.');
          setIsSubmitting(false);
          return;
        }

        await createPosition({
          asset_id: assets[0].id,
          quantity: 1,
          average_price: parseFloat(investedAmount),
          origin: OriginEnum.MANUAL,
          institution_name: fixaInstitution || undefined,
          rate_type: RateTypeEnum.CDI_PERCENTAGE,
          rate_value: rateValue ? parseFloat(rateValue) : undefined,
          investment_date: investmentDate || undefined,
          maturity_date: maturityDate || undefined,
          invested_amount: parseFloat(investedAmount),
        });
        router.push('/portfolio');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar posição');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="flex flex-col px-4 pt-10 pb-8 lg:px-8 lg:pt-8 max-w-2xl mx-auto w-full">

      {/* Header */}
      <header className="flex items-center mb-8 relative animate-fade-in">
        <Link href="/dashboard" className="absolute left-0 p-2 -ml-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800/50">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold text-white w-full text-center">Adicionar Lançamento</h1>
      </header>

      {/* Toggle */}
      <div className="flex p-1 bg-zinc-900/80 rounded-xl mb-8 ring-1 ring-zinc-800 animate-fade-in stagger-1">
        <button
          onClick={() => setAssetType('variavel')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            assetType === 'variavel'
              ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Renda Variável
        </button>
        <button
          onClick={() => setAssetType('fixa')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            assetType === 'fixa'
              ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Renda Fixa
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col space-y-5 animate-fade-in stagger-2">

        {assetType === 'variavel' ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 pl-0.5">Ativo (Ticker)</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  value={tickerQuery}
                  onChange={(e) => handleTickerChange(e.target.value)}
                  onFocus={() => results.length > 0 && setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  placeholder="Ex: PETR4, HGLG11, AAPL34..."
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                />
                {showDropdown && (
                  <AssetSearchDropdown
                    results={results}
                    isSearching={isSearching}
                    onSelect={handleAssetSelect}
                  />
                )}
              </div>
              {selectedAsset && (
                <p className="text-xs text-blue-400 pl-1">
                  {selectedAsset.ticker} — {selectedAsset.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 pl-0.5">Quantidade</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl py-3.5 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 pl-0.5">Preço Médio</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium text-sm">R$</span>
                  <input
                    type="number"
                    value={averagePrice}
                    onChange={(e) => setAveragePrice(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl py-3.5 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 pl-0.5">Instituição (opcional)</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Ex: XP Investimentos, NuInvest..."
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl py-3.5 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 pl-0.5">Nome / Título</label>
              <input
                type="text"
                value={fixaName}
                onChange={(e) => setFixaName(e.target.value)}
                placeholder="Ex: CDB Inter 120% CDI, Tesouro IPCA+ 2035"
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl py-3.5 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 pl-0.5">Instituição</label>
              <input
                type="text"
                value={fixaInstitution}
                onChange={(e) => setFixaInstitution(e.target.value)}
                placeholder="Ex: Inter, XP, NuInvest..."
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl py-3.5 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 pl-0.5">Valor Investido</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-medium text-sm">R$</span>
                  <input
                    type="number"
                    value={investedAmount}
                    onChange={(e) => setInvestedAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl py-3.5 pl-9 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 pl-0.5">Rentabilidade</label>
                <div className="relative">
                  <input
                    type="number"
                    value={rateValue}
                    onChange={(e) => setRateValue(e.target.value)}
                    placeholder="110"
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl py-3.5 pl-4 pr-14 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium text-sm">% CDI</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 pl-0.5 flex items-center gap-1.5">
                  <Calendar size={13} /> Data de Aplicação
                </label>
                <input
                  type="date"
                  value={investmentDate}
                  onChange={(e) => setInvestmentDate(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 pl-0.5 flex items-center gap-1.5">
                  <Calendar size={13} /> Vencimento
                </label>
                <input
                  type="date"
                  value={maturityDate}
                  onChange={(e) => setMaturityDate(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="mt-4 text-sm text-red-400">{error}</p>
      )}

      {/* Action Button */}
      <div className="mt-10 animate-fade-in stagger-3">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={18} className="animate-spin" />}
          {isSubmitting ? 'Salvando...' : 'Salvar Lançamento'}
        </button>
      </div>
    </div>
  );
}
