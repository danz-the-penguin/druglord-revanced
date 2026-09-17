import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { DRUG_MAP } from '../engine/constants';
import { getInventoryTotalUnits, getCarryingCapacity } from '../engine/game';
import { X, ShoppingBag } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl font-mono animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg ${
                mode === 'buy'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : mode === 'sell'
                  ? 'bg-sky-950 text-sky-400 border border-sky-800'
                  : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 uppercase tracking-wide text-base">
                {mode === 'buy' ? 'Purchase' : mode === 'sell' ? 'Liquidate' : 'Dump'} {drug.name}
              </h3>
              <p className="text-xs text-slate-400">
                ${price.toLocaleString()} per unit on street
              </p>
            </div>
          </div>
          <button
            onClick={closeTradeModal}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Status summary */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div>
              <div className="text-slate-500 uppercase text-[10px]">Cash Available</div>
              <div className="text-emerald-400 font-bold text-sm">
                ${player.cash.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-slate-500 uppercase text-[10px]">
                {mode === 'buy' ? 'Free Capacity' : 'Currently Holding'}
              </div>
              <div className="text-indigo-400 font-bold text-sm">
                {mode === 'buy' ? `${remainingCapacity} units` : `${currentHeld} units`}
              </div>
            </div>
          </div>

          {/* Slider & numeric input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-slate-300 font-semibold uppercase text-[11px]">
                Quantity to {mode}:
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
                className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-right text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <input
              type="range"
              min={limit > 0 ? 1 : 0}
              max={limit}
              value={quantity}
              disabled={limit <= 0}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer"
            />

            {/* Quick buttons */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[0.25, 0.5, 0.75, 1.0].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  disabled={limit <= 0}
                  onClick={() => setPercent(pct)}
                  className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-bold text-[11px] transition-colors border border-slate-700/60"
                >
                  {pct === 1.0 ? 'MAX' : `${pct * 100}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Calculation summary */}
          {mode !== 'dump' && (
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-sm">
              <span className="text-slate-400">
                {mode === 'buy' ? 'Total Cost:' : 'Estimated Proceeds:'}
              </span>
              <span
                className={`font-black text-base ${
                  mode === 'buy' ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                ${totalCostOrRevenue.toLocaleString()}
              </span>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-slate-800/80 border-t border-slate-700 flex justify-end gap-2.5">
          <button
            onClick={closeTradeModal}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={quantity <= 0 || limit <= 0}
            className={`px-6 py-2 rounded-xl font-bold transition-all text-slate-950 ${
              mode === 'buy'
                ? 'bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-900/30'
                : mode === 'sell'
                ? 'bg-sky-500 hover:bg-sky-400 shadow-lg shadow-sky-900/30'
                : 'bg-rose-500 hover:bg-rose-400 shadow-lg shadow-rose-900/30'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Confirm {mode === 'buy' ? 'Purchase' : mode === 'sell' ? 'Liquidation' : 'Dump'}
          </button>
        </div>
      </div>
    </div>
  );
};
