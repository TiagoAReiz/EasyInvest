'use client';

import { useState } from 'react';
import { Search, ChevronLeft, Calendar, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAssetSearch } from '@/hooks/useAssetSearch';
import AssetSearchDropdown from '@/components/AssetSearchDropdown';
import { createPosition } from '@/services/portfolioService';
import { getAssetCurrentPrice, createFixedIncomeAsset } from '@/services/assetService';
import type { AssetResponse } from '@/lib/types';
import { OriginEnum, RateTypeEnum } from '@/lib/types';

type AssetType = 'variavel' | 'fixa';

export default function AddPositionPage() {
  const router = useRouter();
  const [assetType, setAssetType] = useState<AssetType>('variavel');
  const { results, isSearching, search } = useAssetSearch();

  const [tickerQuery, setTickerQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<AssetResponse | null>(null);
  const [quantity, setQuantity] = useState('');
  const [averagePrice, setAveragePrice] = useState('');
  const [institution, setInstitution] = useState('');

  const [fixaName, setFixaName] = useState('');
  const [fixaInstitution, setFixaInstitution] = useState('');
  const [investedAmount, setInvestedAmount] = useState('');
  const [rateValue, setRateValue] = useState('');
  const [investmentDate, setInvestmentDate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const getProgress = () => {
    if (assetType === 'variavel') {
      let p = 1;
      if (selectedAsset) p = 2;
      if (selectedAsset && quantity && averagePrice) p = 3;
      return p;
    } else {
      let p = 1;
      if (fixaName) p = 2;
      if (fixaName && investedAmount) p = 3;
      return p;
    }
  };
  const step = getProgress();

  const handleTickerChange = (value: string) => {
    setTickerQuery(value);
    setSelectedAsset(null);
    search(value);
    setShowDropdown(true);
  };

  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  const handleAssetSelect = async (asset: AssetResponse) => {
    setSelectedAsset(asset);
    setTickerQuery(asset.ticker);
    setShowDropdown(false);

    setIsFetchingPrice(true);
    try {
      const price = await getAssetCurrentPrice(asset.id);
      if (price !== null) {
        setAveragePrice(price.toFixed(2));
      }
    } finally {
      setIsFetchingPrice(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (assetType === 'variavel') {
      if (!selectedAsset) {
        setError('Busque e selecione um ativo da lista do menu.');
        return;
      }
      if (!quantity || !averagePrice) {
        setError('Preencha quantidade e preço médio obrigatórios.');
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
      if (!fixaName || !investedAmount) {
        setError('Preencha o nome do título e o valor investido.');
        return;
      }

      setIsSubmitting(true);
      try {
        const asset = await createFixedIncomeAsset(fixaName);

        await createPosition({
          asset_id: asset.id,
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

  const inputClass = 'w-full bg-surface border border-border/80 rounded-2xl py-4 px-4 text-foreground placeholder:text-muted-tertiary focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40 transition-all hover:border-border-hover';

  return (
    <div className="flex flex-col px-4 pt-8 pb-10 lg:px-8 lg:pt-10 max-w-2xl mx-auto w-full">

      {/* ── Wizard Header ── */}
      <header className="flex items-center justify-between mb-8 animate-fade-in relative z-20">
        <Link href="/dashboard" className="flex items-center justify-center w-10 h-10 bg-card-hover text-muted hover:text-foreground hover:bg-border transition-colors rounded-full border border-border/60">
          <ChevronLeft size={20} strokeWidth={2.5} />
        </Link>
        <span className="text-[11px] font-bold text-muted-secondary uppercase tracking-widest bg-card py-1.5 px-3 rounded-full border border-border/40">
          Passo {step} de 3
        </span>
      </header>

      <div className="mb-8 text-center animate-fade-in stagger-1">
        <h1 className="text-3xl font-extrabold text-foreground font-[family-name:var(--font-outfit)]">Lançamento Novo</h1>
        <p className="text-sm text-muted-secondary mt-2">Adicione registros manuais de investimentos comprados.</p>
      </div>

      {/* ── Toggle (Step 1) ── */}
      <div className="flex p-1.5 bg-surface rounded-2xl mb-8 border border-border/60 animate-fade-in stagger-2 relative">
        <button
          onClick={() => setAssetType('variavel')}
          className={`flex-1 py-3 text-[13px] font-bold rounded-xl transition-all duration-300 z-10 ${
            assetType === 'variavel' ? 'text-background' : 'text-muted-secondary hover:text-foreground'
          }`}
        >
          Renda Variável
        </button>
        <button
          onClick={() => setAssetType('fixa')}
          className={`flex-1 py-3 text-[13px] font-bold rounded-xl transition-all duration-300 z-10 ${
            assetType === 'fixa' ? 'text-background' : 'text-muted-secondary hover:text-foreground'
          }`}
        >
          Renda Fixa
        </button>

        <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-accent rounded-xl shadow-[0_0_15px_var(--accent-glow)] transition-all duration-300 ease-in-out ${
          assetType === 'variavel' ? 'left-1.5' : 'left-[50%]'
        }`} />
      </div>

      {/* ── Form Body (Steps 2-3) ── */}
      <section className="glass-card rounded-3xl p-6 lg:p-8 flex flex-col space-y-6 animate-fade-in stagger-3 relative gold-top-accent">

        {assetType === 'variavel' ? (
          <>
            <div className="space-y-2 relative">
              <label className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">Código do Ativo (Ticker)</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-secondary group-focus-within:text-accent transition-colors" size={18} />
                <input
                  type="text"
                  value={tickerQuery}
                  onChange={(e) => handleTickerChange(e.target.value)}
                  onFocus={() => results.length > 0 && setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  placeholder="Ex: PETR4, HGLG11"
                  className={`${inputClass} pl-12 text-sm font-bold uppercase tracking-wider`}
                />

                {selectedAsset && (
                  <CheckCircle2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-positive" />
                )}

                {showDropdown && (
                  <AssetSearchDropdown
                    results={results}
                    isSearching={isSearching}
                    onSelect={handleAssetSelect}
                  />
                )}
              </div>
              {selectedAsset && (
                <p className="text-[11px] text-accent/80 pl-1 pt-1 font-medium bg-accent/[0.03] inline-block px-2 py-0.5 rounded-md mt-1">
                  Selecionado: {selectedAsset.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">Qtd Comprada</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className={`${inputClass} text-base font-medium font-mono`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">Preço Médio</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-tertiary font-semibold text-sm group-focus-within:text-accent transition-colors">R$</span>
                  <input
                    type="number"
                    value={averagePrice}
                    onChange={(e) => setAveragePrice(e.target.value)}
                    placeholder={isFetchingPrice ? 'Buscando...' : '0,00'}
                    disabled={isFetchingPrice}
                    className={`${inputClass} pl-10 text-base font-medium font-mono disabled:opacity-60`}
                  />
                  {isFetchingPrice && (
                    <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-accent animate-spin" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">Corretora (Instituição)</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Ex: Inter, NuInvest"
                className={`${inputClass} text-sm`}
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">Nome / Título Original</label>
              <input
                type="text"
                value={fixaName}
                onChange={(e) => setFixaName(e.target.value)}
                placeholder="Ex: CDB Inter 120% CDI"
                className={`${inputClass} text-sm font-bold tracking-wide`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">Corretora / Banco</label>
              <input
                type="text"
                value={fixaInstitution}
                onChange={(e) => setFixaInstitution(e.target.value)}
                placeholder="Ex: Nubank, XP"
                className={`${inputClass} text-sm`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">Aporte Inicial</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-tertiary font-semibold text-sm group-focus-within:text-accent transition-colors">R$</span>
                  <input
                    type="number"
                    value={investedAmount}
                    onChange={(e) => setInvestedAmount(e.target.value)}
                    placeholder="0,00"
                    className={`${inputClass} pl-10 text-base font-medium font-mono`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">Taxa Pagadora</label>
                <div className="relative group">
                  <input
                    type="number"
                    value={rateValue}
                    onChange={(e) => setRateValue(e.target.value)}
                    placeholder="110"
                    className={`${inputClass} pr-14 text-base font-medium font-mono`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-tertiary font-semibold text-[11px] uppercase group-focus-within:text-accent transition-colors">% CDI</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1 flex items-center gap-1.5">
                  <Calendar size={12} strokeWidth={3} className="text-accent"/> Data Inicial
                </label>
                <input
                  type="date"
                  value={investmentDate}
                  onChange={(e) => setInvestmentDate(e.target.value)}
                  className={`${inputClass} text-sm`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1 flex items-center gap-1.5">
                  <Calendar size={12} strokeWidth={3} className="text-muted-medium"/> Vencimento
                </label>
                <input
                  type="date"
                  value={maturityDate}
                  onChange={(e) => setMaturityDate(e.target.value)}
                  className={`${inputClass} text-sm`}
                />
              </div>
            </div>
          </>
        )}
      </section>

      {/* Error */}
      {error && (
        <p className="mt-4 text-sm text-negative font-medium text-center animate-fade-in">{error}</p>
      )}

      {/* ── Submit Area ── */}
      <div className="mt-8 animate-fade-in stagger-4">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full btn-accent py-4 rounded-2xl text-[15px] transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={18} className="animate-spin" />}
          {isSubmitting ? 'Registrando...' : 'Confirmar e Salvar Posição'}
        </button>
      </div>

    </div>
  );
}
