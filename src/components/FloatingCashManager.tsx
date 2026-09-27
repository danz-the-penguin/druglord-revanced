import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CashSplash {
  id: string;
  diff: number;
  label?: string;
  isPositive: boolean;
  createdAt: number;
}

export const FloatingCashManager: React.FC = () => {
  const cash = useGameStore((s) => s.player.cash);
  const previousCashRef = useRef<number>(cash);
  const isFirstMountRef = useRef<boolean>(true);
  const [splashes, setSplashes] = useState<CashSplash[]>([]);

  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      previousCashRef.current = cash;
      return;
    }

    const diff = cash - previousCashRef.current;
    previousCashRef.current = cash;

    // Ignore 0 or tiny rounding artifacts
    if (Math.abs(diff) < 1) return;

    const newSplash: CashSplash = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      diff,
      isPositive: diff > 0,
      createdAt: Date.now(),
    };

    setSplashes((prev) => [...prev.slice(-4), newSplash]);

    const timer = setTimeout(() => {
      setSplashes((prev) => prev.filter((s) => s.id !== newSplash.id));
    }, 2400);

    return () => clearTimeout(timer);
  }, [cash]);

  if (splashes.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 sm:right-8 z-50 pointer-events-none flex flex-col items-end gap-1.5 font-mono select-none">
      {splashes.map((splash, idx) => {
        const absVal = Math.abs(splash.diff);
        return (
          <div
            key={splash.id}
            className={`px-3 py-1.5 rounded-full border shadow-2xl backdrop-blur-md flex items-center gap-1.5 text-xs sm:text-sm font-black animate-float-up transition-all ${
              splash.isPositive
                ? 'bg-emerald-950/90 border-emerald-400/80 text-emerald-300 shadow-emerald-950/80'
                : 'bg-rose-950/90 border-rose-500/80 text-rose-300 shadow-rose-950/80'
            }`}
            style={{
              animationDelay: `${idx * 40}ms`,
            }}
          >
            {splash.isPositive ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            )}
            <span>
              {splash.isPositive ? `+$${absVal.toLocaleString()}` : `-$${absVal.toLocaleString()}`}
            </span>
          </div>
        );
      })}
    </div>
  );
};
