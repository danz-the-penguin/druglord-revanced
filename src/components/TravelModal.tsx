import React from 'react';
import { useGameStore } from '../store/gameStore';
import { CITIES } from '../engine/constants';
import { Plane, ShieldAlert, AlertTriangle, Check, DollarSign } from 'lucide-react';

export const TravelModal: React.FC = () => {
  const { player, travel } = useGameStore();

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl font-mono">
      <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Airport Departures & Global Travel
          </h2>
        </div>
        <span className="text-xs text-slate-400">
          Flying advances the calendar by 1 day
        </span>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {CITIES.map((city) => {
          const isCurrent = player.currentCityId === city.id;
          const canAfford = player.cash >= city.flightCost;

          return (
            <div
              key={city.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                isCurrent
                  ? 'bg-sky-950/20 border-sky-600/80 ring-1 ring-sky-500/50'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                      {city.name}
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-900 text-sky-300 font-semibold">
                          Current Location
                        </span>
                      )}
                    </h3>
                    <span className="text-[11px] text-slate-500 uppercase">{city.country}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 flex items-center">
                    <DollarSign className="w-3.5 h-3.5" />
                    {city.flightCost}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                  {city.description}
                </p>

                {/* Risk Indicators */}
                <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-amber-400" />
                    Police: {Math.round(city.policeRisk * 100)}%
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    Dogs: {Math.round(city.dogRisk * 100)}%
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex justify-end">
                {isCurrent ? (
                  <span className="text-xs text-sky-400 font-bold flex items-center gap-1 py-1">
                    <Check className="w-3.5 h-3.5" /> You Are Here
                  </span>
                ) : (
                  <button
                    onClick={() => travel(city.id)}
                    disabled={!canAfford}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      canAfford
                        ? 'bg-sky-600 hover:bg-sky-500 text-slate-950'
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    Book Flight (${city.flightCost})
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
