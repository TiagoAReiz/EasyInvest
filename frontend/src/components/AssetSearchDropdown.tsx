'use client';

import { AssetResponse, AssetTypeEnum } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const assetTypeLabels: Record<AssetTypeEnum, string> = {
  [AssetTypeEnum.STOCK]: 'Ação',
  [AssetTypeEnum.FII]: 'FII',
  [AssetTypeEnum.CRYPTO]: 'Cripto',
  [AssetTypeEnum.FIXED_INCOME]: 'Renda Fixa',
  [AssetTypeEnum.CASH]: 'Caixa',
};

interface AssetSearchDropdownProps {
  results: AssetResponse[];
  isSearching: boolean;
  onSelect: (asset: AssetResponse) => void;
}

export default function AssetSearchDropdown({ results, isSearching, onSelect }: AssetSearchDropdownProps) {
  if (!isSearching && results.length === 0) return null;

  return (
    <div className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-[#161619] border border-[#2a2a2e] rounded-xl overflow-hidden shadow-2xl shadow-black/60">
      {isSearching ? (
        <div className="flex items-center justify-center gap-2 py-5 text-[#8a8a92] text-sm">
          <Loader2 size={16} className="animate-spin text-accent" />
          Buscando...
        </div>
      ) : (
        <ul className="max-h-60 overflow-y-auto">
          {results.map((asset) => (
            <li key={asset.id}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onSelect(asset); }}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/[0.05] transition-colors text-left border-b border-[#2a2a2e]/30 last:border-0"
              >
                <div className="flex flex-col">
                  <span className="text-white font-semibold text-sm">{asset.ticker}</span>
                  <span className="text-xs text-[#6a6a72] truncate">{asset.name}</span>
                </div>
                <span className="text-[10px] font-semibold text-accent/70 bg-accent/[0.06] px-2 py-0.5 rounded-md">
                  {assetTypeLabels[asset.type]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
