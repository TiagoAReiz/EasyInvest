'use client';

import { useState } from 'react';
import { X, Trash2, Loader2 } from 'lucide-react';
import { AssetTypeEnum, RateTypeEnum } from '@/lib/types';
import type { PositionWithQuote, PositionUpdateRequest } from '@/lib/types';

interface EditPositionModalProps {
  position: PositionWithQuote;
  onClose: () => void;
  onSave: (id: string, data: PositionUpdateRequest) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const rateTypeLabels: Record<RateTypeEnum, string> = {
  [RateTypeEnum.CDI_PERCENTAGE]: '% do CDI',
  [RateTypeEnum.CDI_PLUS]: 'CDI +',
  [RateTypeEnum.PREFIXED]: 'Prefixado',
  [RateTypeEnum.IPCA_PLUS]: 'IPCA +',
};

export default function EditPositionModal({ position, onClose, onSave, onDelete }: EditPositionModalProps) {
  const isFixedIncome = position.asset_type === AssetTypeEnum.FIXED_INCOME;

  const [quantity, setQuantity] = useState(String(position.quantity));
  const [averagePrice, setAveragePrice] = useState(String(position.average_price));
  const [institutionName, setInstitutionName] = useState(position.institution_name ?? '');
  const [investedAmount, setInvestedAmount] = useState(String(position.invested_amount ?? ''));
  const [rateType, setRateType] = useState<RateTypeEnum>(position.rate_type ?? RateTypeEnum.CDI_PERCENTAGE);
  const [rateValue, setRateValue] = useState(String(position.rate_value ?? ''));
  const [investmentDate, setInvestmentDate] = useState(position.investment_date ?? '');
  const [maturityDate, setMaturityDate] = useState(position.maturity_date ?? '');

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);

    const data: PositionUpdateRequest = { institution_name: institutionName || undefined };

    if (isFixedIncome) {
      const amt = parseFloat(investedAmount);
      if (!amt || amt <= 0) { setError('Valor investido deve ser maior que zero.'); return; }
      const rv = parseFloat(rateValue);
      if (!rv || rv <= 0) { setError('Taxa deve ser maior que zero.'); return; }
      data.invested_amount = amt;
      data.rate_type = rateType;
      data.rate_value = rv;
      data.investment_date = investmentDate || undefined;
      data.maturity_date = maturityDate || undefined;
    } else {
      const qty = parseFloat(quantity);
      if (!qty || qty <= 0) { setError('Quantidade deve ser maior que zero.'); return; }
      const avg = parseFloat(averagePrice);
      if (!avg || avg <= 0) { setError('Preco medio deve ser maior que zero.'); return; }
      data.quantity = qty;
      data.average_price = avg;
    }

    setIsSaving(true);
    try {
      await onSave(position.id, data);
    } catch {
      setError('Erro ao salvar alteracoes.');
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setIsDeleting(true);
    try {
      await onDelete(position.id);
    } catch {
      setError('Erro ao excluir posicao.');
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  const inputClass = 'w-full bg-[#111114] border border-[#2a2a2e]/60 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-[#6a6a72] focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/40 transition-all';
  const labelClass = 'block text-xs font-bold text-[#8a8a92] uppercase tracking-wider mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#161619] border border-[#2a2a2e] rounded-2xl shadow-2xl shadow-black/80 animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2e]/60">
          <div>
            <h2 className="text-lg font-bold text-white font-[family-name:var(--font-outfit)]">
              {isFixedIncome ? position.asset_name : position.ticker}
            </h2>
            {!isFixedIncome && (
              <p className="text-xs text-[#6a6a72] mt-0.5">{position.asset_name}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#6a6a72] hover:text-white hover:bg-[#2a2a2e]/60 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="bg-negative/10 text-negative rounded-xl p-3 text-sm ring-1 ring-negative/20">
              {error}
            </div>
          )}

          {isFixedIncome ? (
            <>
              <div>
                <label className={labelClass}>Valor Investido (R$)</label>
                <input type="number" step="0.01" min="0" value={investedAmount} onChange={(e) => setInvestedAmount(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Tipo de Taxa</label>
                <select value={rateType} onChange={(e) => setRateType(e.target.value as RateTypeEnum)} className={inputClass}>
                  {Object.entries(rateTypeLabels).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Taxa (%)</label>
                <input type="number" step="0.01" min="0" value={rateValue} onChange={(e) => setRateValue(e.target.value)} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Data Investimento</label>
                  <input type="date" value={investmentDate} onChange={(e) => setInvestmentDate(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Vencimento</label>
                  <input type="date" value={maturityDate} onChange={(e) => setMaturityDate(e.target.value)} className={inputClass} />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className={labelClass}>Quantidade</label>
                <input type="number" step="any" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Preco Medio (R$)</label>
                <input type="number" step="0.01" min="0" value={averagePrice} onChange={(e) => setAveragePrice(e.target.value)} className={inputClass} />
              </div>
            </>
          )}

          <div>
            <label className={labelClass}>Corretora</label>
            <input type="text" value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} placeholder="Ex: XP, Nubank..." className={inputClass} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2a2a2e]/60 flex items-center justify-between gap-3">
          <button
            onClick={handleDelete}
            disabled={isDeleting || isSaving}
            className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-colors ${
              confirmDelete
                ? 'bg-negative/20 text-negative hover:bg-negative/30'
                : 'text-[#6a6a72] hover:text-negative hover:bg-negative/10'
            } disabled:opacity-50`}
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {confirmDelete ? 'Confirmar exclusao' : 'Excluir'}
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isSaving || isDeleting}
              className="px-4 py-2 text-sm font-semibold text-[#8a8a92] hover:text-white rounded-xl hover:bg-[#2a2a2e]/60 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isDeleting}
              className="px-5 py-2 text-sm font-bold bg-accent text-[#0a0a0c] rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
