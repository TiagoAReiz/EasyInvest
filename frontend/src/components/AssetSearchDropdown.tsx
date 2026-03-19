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
    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl shadow-black/40">
      {isSearching ? (
        <div className="flex items-center justify-center gap-2 py-4 text-zinc-500 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Buscando...
        </div>
      ) : (
        <ul className="max-h-60 overflow-y-auto">
          {results.map((asset) => (
            <li key={asset.id}>
              <button
                type="button"
                onClick={() => onSelect(asset)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/60 transition-colors text-left"
              >
                <div className="flex flex-col">
                  <span className="text-white font-semibold text-sm">{asset.ticker}</span>
                  <span className="text-xs text-zinc-500 truncate">{asset.name}</span>
                </div>
                <span className="text-[10px] font-medium text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
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
