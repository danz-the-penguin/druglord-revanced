import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { CITIES } from '../engine/constants';
import { Plane, ShieldAlert, AlertTriangle, Check, DollarSign, Globe, Search, Sparkles } from 'lucide-react';

const REGIONS = ['All', 'Americas', 'Europe', 'Asia-Pacific', 'Middle East & Africa'] as const;
type RegionFilter = (typeof REGIONS)[number];

export const TravelModal: React.FC = () => {
  const { player, travel } = useGameStore();
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCities = useMemo(() => {
    return CITIES.filter((city) => {
      const matchesRegion = selectedRegion === 'All' || city.region === selectedRegion;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        city.name.toLowerCase().includes(query) ||
        city.country.toLowerCase().includes(query) ||
        (city.specialty && city.specialty.toLowerCase().includes(query)) ||
        city.description.toLowerCase().includes(query);
      return matchesRegion && matchesQuery;
    });
  }, [selectedRegion, searchQuery]);

  const currentCity = CITIES.find((c) => c.id === player.currentCityId);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md font-mono">
      {/* Header bar */}
      <div className="px-5 py-4 bg-slate-800/80 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Plane className="w-5 h-5 text-sky-400" />
          <div>
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              International Flight Network & Smuggling Routes
            </h2>
            <p className="text-xs text-slate-400">
              Current Port: <strong className="text-sky-400">{currentCity?.name}, {currentCity?.country}</strong> • Boarding advances time by 1 Day
            </p>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search port, country, or route..."
            className="w-full bg-slate-950/80 border border-slate-700/70 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>
      </div>

      {/* Region Category Filter Tabs */}
      <div className="bg-slate-950/70 px-5 py-2.5 border-b border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500 flex items-center gap-1 mr-1 text-[11px] uppercase font-bold">
          <Globe className="w-3 h-3 text-slate-400" /> Regions:
        </span>
        {REGIONS.map((region) => {
          const count =
            region === 'All'
              ? CITIES.length
              : CITIES.filter((c) => c.region === region).length;
          const isActive = selectedRegion === region;

          return (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-sky-500 text-slate-950 shadow-sm shadow-sky-900/50'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {region}
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                  isActive ? 'bg-sky-700/80 text-sky-100' : 'bg-slate-950 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Destinations Grid */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 max-h-[calc(100vh-280px)] overflow-y-auto">
        {filteredCities.map((city) => {
          const isCurrent = player.currentCityId === city.id;
          const canAfford = player.cash >= city.flightCost;

          return (
            <div
              key={city.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                isCurrent
                  ? 'bg-sky-950/30 border-sky-500/80 ring-1 ring-sky-500/40 shadow-lg shadow-sky-950/50'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                      {city.name}
                      {isCurrent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold">
                          Current Base
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400 font-semibold uppercase">{city.country}</span>
                      {city.region && (
                        <span className="text-[10px] text-slate-500 px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
                          {city.region}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-black flex items-center justify-end ${
                        canAfford ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      {city.flightCost.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Flight Fare</span>
                  </div>
                </div>

                {/* Market Specialty Tag */}
                {city.specialty && (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-950/40 border border-amber-800/50 text-[11px] font-bold text-amber-300">
                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate">{city.specialty}</span>
                  </div>
                )}

                <p className="text-xs text-slate-300 mt-2 leading-relaxed font-sans line-clamp-2">
                  {city.description}
                </p>

                {/* Security & Customs Risk Indicators */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      Police: <strong className="text-slate-200">{Math.round(city.policeRisk * 100)}%</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>
                      K9 Dogs: <strong className="text-slate-200">{Math.round(city.dogRisk * 100)}%</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  {isCurrent ? 'Presently docked' : canAfford ? 'Direct flight ready' : 'Insufficient cash'}
                </span>

                {isCurrent ? (
                  <span className="text-xs text-sky-400 font-bold flex items-center gap-1 py-1 px-2.5 rounded bg-sky-950/60 border border-sky-800/60">
                    <Check className="w-3.5 h-3.5" /> Present Location
                  </span>
                ) : (
                  <button
                    onClick={() => travel(city.id)}
                    disabled={!canAfford}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                      canAfford
                        ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-950 hover:scale-[1.02] active:scale-95'
                        : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <Plane className="w-3.5 h-3.5" /> Book Flight (${city.flightCost})
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredCities.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 font-mono">
            No flight destinations match your search "{searchQuery}". Try searching for another port, country, or region.
          </div>
        )}
      </div>
    </div>
  );
};

