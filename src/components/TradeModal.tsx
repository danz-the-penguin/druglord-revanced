import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { DRUG_MAP } from '../engine/constants';
import { getInventoryTotalUnits, getCarryingCapacity } from '../engine/game';
import { DrugImage } from './DrugImage';
import { X, AlertTriangle } from 'lucide-react';

export const TradeModal: React.FC = () => {
  const { tradeModal, closeTradeModal, player, market, buy, sell, dump } = useGameStore();
  const { isOpen, drugId, mode } = tradeModal;

  const [quantity, setQuantity] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  const drug = drugId ? DRUG_MAP.get(drugId) : null;
  const marketItem = drugId ? market[drugId] : null;
  const inventoryItem = drugId ? player.inventory[drugId] : null;

  const currentHeld = inventoryItem?.units ?? 0;
  const price = marketItem?.price ?? 0;
  const availableSupply = marketItem?.availableUnits ?? 0;

  const totalUsedUnits = getInventoryTotalUnits(player);
  const capacity = getCarryingCapacity(player);
  const remainingCapacity = Math.max(0, capacity - totalUsedUnits);

  // Maximum buyable units based on cash, market supply, and coat capacity
  const maxBuyable = Math.min(
    availableSupply,
    remainingCapacity,
    price > 0 ? Math.floor(player.cash / price) : 0
  );

  const maxSellable = currentHeld;
  const maxDumpable = currentHeld;

  const limit = mode === 'buy' ? maxBuyable : mode === 'sell' ? maxSellable : maxDumpable;

  useEffect(() => {
    if (isOpen) {
      setQuantity(limit > 0 ? 1 : 0);
      setError(null);
    }
  }, [isOpen, limit]);

  if (!isOpen || !drug) return null;

  const totalCostOrRevenue = quantity * price;

  const handleConfirm = () => {
    setError(null);
    if (quantity <= 0) {
      setError('Please select a quantity greater than 0');
      return;
    }

    let res: { success: boolean; message: string };
    if (mode === 'buy') {
      res = buy(drug.id, quantity);
    } else if (mode === 'sell') {
      res = sell(drug.id, quantity);
    } else {
      res = dump(drug.id, quantity);
    }

    if (res.success) {
      closeTradeModal();
    } else {
      setError(res.message);
    }
  };

  const setPercent = (pct: number) => {
    const calculated = Math.floor(limit * pct);
    setQuantity(Math.max(1, Math.min(limit, calculated)));
  };

  const formatFormula = (formula?: string) => {
    if (!formula) return '';
    return formula.replace(/(\d+)/g, (match) => {
      const subMap: Record<string, string> = {
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
        '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
      };
      return match.split('').map((c) => subMap[c] || c).join('');
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl font-mono animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Drug Image, Formula, and Title */}
        <div className="p-5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <DrugImage drug={drug} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-100 uppercase tracking-wide text-lg">
                  {mode === 'buy' ? 'Acquire' : mode === 'sell' ? 'Liquidate' : 'Dump'} {drug.name}
                </h3>
                {drug.chemicalFormula && (
                  <span className="px-2 py-0.5 rounded bg-slate-950 text-emerald-400 font-bold border border-emerald-900 text-xs">
                    {formatFormula(drug.chemicalFormula)}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs font-mono">
                <span className="text-emerald-400 font-bold">${price.toLocaleString()} Spot</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">
                  Base: <strong className="text-slate-200">${drug.basePrice.toLocaleString()}</strong>
                </span>
                {(() => {
                  const diff = price - drug.basePrice;
                  const pct = Math.round((diff / drug.basePrice) * 100);
                  if (pct === 0) return null;
                  return (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                        diff > 0
                          ? 'text-emerald-400 bg-emerald-950 border-emerald-800'
                          : 'text-rose-400 bg-rose-950 border-rose-800'
                      }`}
                    >
                      {diff > 0 ? `+${pct}%` : `${pct}%`} vs Base
                    </span>
                  );
                })()}
              </div>
              {drug.scientificName && (
                <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                  {drug.scientificName} {drug.molecularWeight ? `• ${drug.molecularWeight}` : ''}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={closeTradeModal}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm">
          {/* Status summary */}
          <div className="grid grid-cols-2 gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <div>
              <div className="text-slate-400 uppercase text-xs font-semibold">Liquid Cash</div>
              <div className="text-emerald-400 font-black text-lg mt-0.5">
                ${player.cash.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-slate-400 uppercase text-xs font-semibold">
                {mode === 'buy' ? 'Free Capacity' : 'Current Stash'}
              </div>
              <div className="text-indigo-400 font-black text-lg mt-0.5">
                {mode === 'buy' ? `${remainingCapacity} units` : `${currentHeld} units`}
              </div>
            </div>
          </div>

          {/* Counterfeit Warning Banner */}
          {mode === 'sell' && inventoryItem?.fakeUnits && inventoryItem.fakeUnits > 0 && (
            <div className="p-3.5 bg-amber-950/40 border border-amber-500/60 rounded-2xl text-xs text-amber-200 flex items-start gap-3 shadow-lg shadow-amber-950/40">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-black text-amber-300 uppercase tracking-wide">
                  ⚠️ Adulterated Batch Warning ({inventoryItem.fakeUnits} Fake Units)
                </strong>
                <p className="mt-0.5 text-amber-200/90 leading-relaxed font-sans">
                  Your stash contains <strong>{inventoryItem.fakeUnits} counterfeit / cut units</strong>. Street buyers test incoming merchandise: any fake units sold will be confiscated, triggering buyer fines and a local police heat spike! You can safely flush fake units in your Stash board.
                </p>
              </div>
            </div>
          )}

          {/* Slider & numeric input */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-slate-200 font-bold uppercase text-xs">
                Order Quantity ({mode}):
              </label>
              <input
                type="number"
                min={1}
                max={limit}
                value={quantity || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setQuantity(isNaN(val) ? 0 : Math.min(limit, Math.max(0, val)));
                }}
                className="w-28 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-right text-slate-100 font-bold text-base focus:outline-none focus:border-emerald-500"
              />
            </div>

            <input
              type="range"
              min={limit > 0 ? 1 : 0}
              max={limit}
              value={quantity}
              disabled={limit <= 0}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />

            {/* Quick buttons */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[0.25, 0.5, 0.75, 1.0].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  disabled={limit <= 0}
                  onClick={() => setPercent(pct)}
                  className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold text-xs transition-colors border border-slate-700"
                >
                  {pct === 1.0 ? 'MAX' : `${pct * 100}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Calculation summary */}
          {mode !== 'dump' && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center text-sm">
              <span className="text-slate-300 font-semibold">
                {mode === 'buy' ? 'Total Settlement Cost:' : 'Estimated Gross Proceeds:'}
              </span>
              <span
                className={`font-black text-xl tracking-tight ${
                  mode === 'buy' ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                ${totalCostOrRevenue.toLocaleString()}
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-800/90 border-t border-slate-700 flex justify-end gap-3">
          <button
            onClick={closeTradeModal}
            className="px-5 py-2.5 rounded-xl text-slate-300 hover:text-slate-100 hover:bg-slate-800 font-bold transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={quantity <= 0 || limit <= 0}
            className={`px-7 py-2.5 rounded-xl font-black transition-all text-slate-950 text-sm ${
              mode === 'buy'
                ? 'bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-950/60'
                : mode === 'sell'
                ? 'bg-sky-500 hover:bg-sky-400 shadow-lg shadow-sky-950/60'
                : 'bg-rose-500 hover:bg-rose-400 shadow-lg shadow-rose-950/60'
            } disabled:opacity-40 disabled:cursor-not-allowed active:scale-95`}
          >
            Confirm {mode === 'buy' ? 'Purchase' : mode === 'sell' ? 'Liquidation' : 'Dump'}
          </button>
        </div>
      </div>
    </div>
  );
};
