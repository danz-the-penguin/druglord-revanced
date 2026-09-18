import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { CITIES } from '../engine/constants';
import { getCityHeat, getInventoryTotalUnits } from '../engine/game';
import { AIRPORT_REGISTRY } from '../engine/flightNetwork';
import { AIRCRAFT_MAP, calculateAircraftFlightCost } from '../engine/aviation';
import { SmugglingMap } from './SmugglingMap';
import { Plane, ShieldAlert, AlertTriangle, Check, DollarSign, Globe, Search, Sparkles, Flame, ExternalLink, Map as MapIcon, LayoutGrid } from 'lucide-react';

const REGIONS = ['All', 'Americas', 'Europe', 'Asia-Pacific', 'Middle East & Africa'] as const;
type RegionFilter = (typeof REGIONS)[number];

export const TravelModal: React.FC = () => {
  const { player, travel, openFlightBoard } = useGameStore();
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const activeAircraft = player.selectedAircraftId ? AIRCRAFT_MAP.get(player.selectedAircraftId) : null;
  const aircraftFuelCost = activeAircraft ? calculateAircraftFlightCost(activeAircraft, player.ownedProperties || []) : 0;

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
  const originHeat = getCityHeat(player, player.currentCityId);
  const totalDrugs = getInventoryTotalUnits(player);
  const maskedUnits = (player.noScentCans || 0) * 100;
  const unmaskedDrugs = Math.max(0, totalDrugs - maskedUnits);

  return (
    <div className="space-y-4 font-mono">
      {/* Top Command Mode Switcher Banner */}
      <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('map')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'map'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>🗺️ Tactical Smuggling Map</span>
          </button>

          <button
            onClick={() => setViewMode('grid')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>📋 Destination Dossier Grid</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Hotkeys: <strong>M</strong> toggles map • <strong>T</strong> opens travel
          </span>
          <button
            onClick={openFlightBoard}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 hover:border-sky-500 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            title="Open Live Airport Departure Flip-Board"
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Airport Flip-Board</span>
          </button>
        </div>
      </div>

      {viewMode === 'map' ? (
        <SmugglingMap />
      ) : (
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

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={openFlightBoard}
            className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-sky-950/50 transition-all cursor-pointer active:scale-95 shrink-0"
            title="Switch to Real-Time Airport Flight Flip-Board"
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Flight Flip-Board</span>
          </button>

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
      </div>

      {/* Active Flagship Status Banner */}
      {activeAircraft && (
        <div className="bg-emerald-950/40 border-b border-emerald-700/50 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <span className="text-base">{activeAircraft.icon}</span>
            <span>
              <strong>ACTIVE FLAGSHIP:</strong> {activeAircraft.name} • Fuel Fee:{' '}
              <strong className={aircraftFuelCost === 0 ? 'text-emerald-300' : 'text-amber-300'}>
                {aircraftFuelCost === 0 ? '$0 (Hangar Free)' : `$${aircraftFuelCost.toLocaleString()}`}
              </strong>{' '}
              • Customs Risk Reduction:{' '}
              <strong className="text-cyan-300">-{Math.round(activeAircraft.customsReduction * 100)}%</strong>
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold uppercase bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/60">
            Commercial Flights & Airport Board Still Available Below
          </span>
        </div>
      )}

      {/* Customs Threat Warning Banner */}
      {originHeat >= 40 && unmaskedDrugs > 0 && (
        <div className="bg-red-950/50 border-b border-red-700/80 px-5 py-2.5 flex items-center justify-between text-xs text-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
            <span>
              <strong>DEPARTURE CUSTOMS WARNING:</strong> Local heat in {currentCity?.name} is elevated ({originHeat}%). Customs and canine interdiction teams are on alert (+{Math.round((originHeat / 100) * 35)}% inspection risk for {unmaskedDrugs.toLocaleString()} unmasked contraband units)!
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-900/80 border border-red-600 text-red-100 shrink-0 hidden md:inline">
            PORT UNDER SURVEILLANCE
          </span>
        </div>
      )}

      {/* Region Category Filter Tabs */}
      <div className="bg-slate-950/70 px-3 sm:px-5 py-2.5 border-b border-slate-800/80 flex items-center gap-2 text-xs overflow-x-auto no-scrollbar flex-nowrap sm:flex-wrap">
        <span className="text-slate-500 flex items-center gap-1 mr-1 text-[11px] uppercase font-bold shrink-0">
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
      <div className="p-3 sm:p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-3.5 max-h-[calc(100vh-280px)] overflow-y-auto">
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
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800/80">
                        {AIRPORT_REGISTRY[city.id]?.iata || 'AIR'}
                      </span>
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
                      {!isCurrent && (
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${
                            AIRPORT_REGISTRY[player.currentCityId]?.directDestinations?.includes(city.id)
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                              : 'bg-amber-950/80 text-amber-300 border-amber-700/80'
                          }`}
                        >
                          {AIRPORT_REGISTRY[player.currentCityId]?.directDestinations?.includes(city.id)
                            ? 'Direct'
                            : 'Connecting'}
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
                <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 grid grid-cols-3 gap-1.5 text-xs font-mono">
                  <div
                    className="flex items-center gap-1 text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60"
                    title={`Local Police Patrol Density: ${Math.round(city.policeRisk * 100)}%`}
                  >
                    <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate">
                      Patrol <strong className="text-slate-200">{Math.round(city.policeRisk * 100)}%</strong>
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-1 text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60"
                    title={`Airport Canine & Customs Interception: ${Math.round(city.dogRisk * 100)}%`}
                  >
                    <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                    <span className="truncate">
                      K9 <strong className="text-slate-200">{Math.round(city.dogRisk * 100)}%</strong>
                    </span>
                  </div>
                  {(() => {
                    const cityHeat = getCityHeat(player, city.id);
                    return (
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
                          cityHeat >= 70
                            ? 'bg-red-950/70 border-red-500 text-red-300'
                            : cityHeat >= 30
                            ? 'bg-amber-950/50 border-amber-600 text-amber-300'
                            : 'bg-slate-900/80 border-slate-800/60 text-slate-400'
                        }`}
                        title={`Investigation Heat in ${city.name}: ${cityHeat}%. High heat increases raid and search frequencies.`}
                      >
                        <Flame
                          className={`w-3 h-3 shrink-0 ${
                            cityHeat >= 70
                              ? 'text-red-400 animate-pulse'
                              : cityHeat >= 30
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        />
                        <span className="truncate">
                          Heat <strong className={cityHeat >= 70 ? 'text-red-400' : cityHeat >= 30 ? 'text-amber-400' : 'text-slate-200'}>{cityHeat}%</strong>
                        </span>
                      </div>
                    );
                  })()}
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
                  <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap justify-end">
                    <button
                      onClick={openFlightBoard}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 hover:border-sky-500 transition-colors shrink-0"
                      title="Open Live Flight Flip-Board for airport departures & seat classes"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    {activeAircraft && (
                      <button
                        onClick={() => travel(city.id, 'economy', undefined, true)}
                        disabled={player.cash < aircraftFuelCost}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                          player.cash >= aircraftFuelCost
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-950 hover:scale-[1.02] active:scale-95'
                            : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed opacity-60'
                        }`}
                        title={`Fly personal ${activeAircraft.name} (-${Math.round(activeAircraft.customsReduction * 100)}% customs risk)`}
                      >
                        <Plane className="w-3.5 h-3.5" />
                        <span>Jet ({aircraftFuelCost === 0 ? 'FREE' : `$${aircraftFuelCost.toLocaleString()}`})</span>
                      </button>
                    )}

                    <button
                      onClick={() => travel(city.id, 'economy', undefined, false)}
                      disabled={!canAfford}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                        canAfford
                          ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-950 hover:scale-[1.02] active:scale-95'
                          : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed opacity-60'
                      }`}
                      title="Fly commercial airline flight via standard airport terminal"
                    >
                      <Plane className="w-3.5 h-3.5" />
                      <span>Airline (${city.flightCost.toLocaleString()})</span>
                    </button>
                  </div>
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
      )}
    </div>
  );
};

