import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  Plane,
  X,
  Clock,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Luggage,
  Crown,
  Compass,
} from 'lucide-react';
import { generateAirportFlightBoard, AIRPORT_REGISTRY } from '../engine/flightNetwork';
import { CITY_MAP } from '../engine/constants';
import { FlightSeatClass, RealFlightSchedule } from '../engine/types';
import { AIRCRAFT_MAP, calculateAircraftFlightCost } from '../engine/aviation';

export const FlightBoardModal: React.FC = () => {
  const isFlightBoardOpen = useGameStore((s) => s.isFlightBoardOpen);
  const closeFlightBoard = useGameStore((s) => s.closeFlightBoard);
  const player = useGameStore((s) => s.player);
  const bookFlightAction = useGameStore((s) => s.bookFlightAction);

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'direct' | 'connecting' | 'private'>('all');
  const [selectedSchedule, setSelectedSchedule] = useState<RealFlightSchedule | null>(null);
  const [selectedSeatClass, setSelectedSeatClass] = useState<FlightSeatClass>('economy');
  const [useFlagship, setUseFlagship] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const currentCityId = player.currentCityId;
  const currentAirport = AIRPORT_REGISTRY[currentCityId];
  const currentCity = CITY_MAP.get(currentCityId);

  const activeAircraft = player.selectedAircraftId ? AIRCRAFT_MAP.get(player.selectedAircraftId) : null;
  const aircraftFuelCost = activeAircraft ? calculateAircraftFlightCost(activeAircraft, player.ownedProperties || []) : 0;

  // Generate real-world flight schedule from current airport
  const flightSchedules = useMemo(() => {
    return generateAirportFlightBoard(currentCityId, player.currentDay);
  }, [currentCityId, player.currentDay]);

  // Set default selected flight on open
  const activeFlight = selectedSchedule || flightSchedules[0] || null;

  if (!isFlightBoardOpen || !currentAirport || !currentCity) return null;

  const filteredFlights = flightSchedules.filter((flight) => {
    if (selectedCategory === 'direct') return flight.isDirect;
    if (selectedCategory === 'connecting') return !flight.isDirect;
    return true;
  });

  const getEffectiveCost = (flight: RealFlightSchedule, seatClass: FlightSeatClass) => {
    if (seatClass === 'business') return Math.round(flight.ticketCost * 2.2 + 650);
    if (seatClass === 'private_narco') return Math.max(18000, Math.round(flight.ticketCost * 12 + 15000));
    return flight.ticketCost;
  };

  const currentCost =
    useFlagship && activeAircraft
      ? aircraftFuelCost
      : activeFlight
      ? getEffectiveCost(activeFlight, selectedSeatClass)
      : 0;
  const canAfford = player.cash >= currentCost;

  const handleBookFlight = () => {
    if (!activeFlight) return;
    const res =
      useFlagship && activeAircraft
        ? bookFlightAction(activeFlight.destinationCityId, 'economy', aircraftFuelCost, true)
        : bookFlightAction(activeFlight.destinationCityId, selectedSeatClass, activeFlight.ticketCost, false);
    if (res.success) {
      setFeedbackMsg({ text: res.message, error: false });
      setTimeout(() => {
        setFeedbackMsg(null);
        closeFlightBoard();
      }, 1000);
    } else {
      setFeedbackMsg({ text: res.message, error: true });
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 font-mono">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95">
        {/* Header Airport Terminal Display */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-950/80 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-100 tracking-wider">
                  {currentAirport.airportName} ({currentAirport.iata})
                </h3>
                <span className="px-2 py-0.5 rounded bg-sky-950/60 border border-sky-600/40 text-sky-300 text-[10px] font-bold">
                  {currentAirport.hubTier.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Departures Terminal • {currentCity.name}, {currentCity.country} • {currentAirport.terminals} Terminals Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={closeFlightBoard}
              className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Airport Status Bar & Filter Pills */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Flight Corridor:</span>
            {(['all', 'direct', 'connecting', 'private'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  if (cat === 'private') setSelectedSeatClass('private_narco');
                  else if (selectedSeatClass === 'private_narco') setSelectedSeatClass('economy');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                  selectedCategory === cat
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat === 'all' && 'All Destinations (29)'}
                {cat === 'direct' && `Non-Stop Routes (${currentAirport.directDestinations.length})`}
                {cat === 'connecting' && 'Connecting Flights'}
                {cat === 'private' && 'Private Narco Charter'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
            <span>Cash: <strong className="text-emerald-400">${player.cash.toLocaleString()}</strong></span>
            <span>Local Heat: <strong className="text-amber-400">{player.cityHeat?.[currentCityId] ?? 0}%</strong></span>
          </div>
        </div>

        {/* Content Body: Split View (Flight Departure Flip-Board on Left, Booking Dossier on Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* Departure Flip-Board Table */}
          <div className="lg:col-span-7 border-r border-slate-800 overflow-y-auto p-4 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 flex justify-between">
              <span>Flight / Carrier</span>
              <span>Destination</span>
              <span>Departure</span>
              <span>Status</span>
              <span>Coach Fare</span>
            </div>

            <div className="space-y-1.5">
              {filteredFlights.map((flight) => {
                const isSelected = activeFlight?.flightId === flight.flightId;
                const statusColor =
                  flight.status === 'Boarding'
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40'
                    : flight.status === 'Customs Alert'
                    ? 'text-rose-400 bg-rose-950/60 border-rose-500/40 animate-pulse'
                    : flight.status === 'Delayed'
                    ? 'text-amber-400 bg-amber-950/60 border-amber-500/40'
                    : 'text-sky-300 bg-sky-950/60 border-sky-500/40';

                return (
                  <div
                    key={flight.flightId}
                    onClick={() => setSelectedSchedule(flight)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-sky-950/50 border-sky-500 ring-1 ring-sky-500/40'
                        : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Carrier & Flight Number */}
                    <div className="w-28">
                      <div className="font-bold text-slate-200">{flight.flightNumber}</div>
                      <div className="text-[10px] text-slate-500 truncate">{flight.airline}</div>
                    </div>

                    {/* Destination City & IATA */}
                    <div className="w-36">
                      <div className="font-bold text-slate-100 flex items-center gap-1">
                        <span>{flight.destinationCityName}</span>
                        <span className="text-sky-400 text-[10px] font-mono font-normal">({flight.destinationIata})</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        {flight.isDirect ? (
                          <span className="text-emerald-400">Non-Stop</span>
                        ) : (
                          <span className="text-amber-400">Via {flight.transitCityName}</span>
                        )}
                      </div>
                    </div>

                    {/* Departure Time */}
                    <div className="w-20 text-slate-300 font-mono flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{flight.departureTime}</span>
                    </div>

                    {/* Status Badge */}
                    <div className="w-28 text-center">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${statusColor}`}>
                        {flight.status}
                      </span>
                    </div>

                    {/* Ticket Cost */}
                    <div className="w-20 text-right font-mono font-bold text-emerald-400">
                      ${flight.ticketCost.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Booking Dossier Panel */}
          <div className="lg:col-span-5 p-5 bg-slate-950/60 overflow-y-auto flex flex-col justify-between space-y-4">
            {activeFlight ? (
              <div className="space-y-4">
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[11px] text-slate-500 font-bold uppercase">Selected Destination</div>
                      <div className="text-lg font-black text-slate-100 flex items-center gap-2">
                        <span>{activeFlight.destinationCityName}</span>
                        <span className="text-sky-400 text-sm">({activeFlight.destinationIata})</span>
                      </div>
                      <div className="text-xs text-slate-400">{activeFlight.destinationAirport}</div>
                    </div>
                    <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs font-mono font-bold">
                      {Math.floor(activeFlight.durationMinutes / 60)}h {activeFlight.durationMinutes % 60}m
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-500 block">Terminal:</span>
                      <strong className="text-slate-300">{activeFlight.terminal}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Gate:</span>
                      <strong className="text-slate-300">{activeFlight.gate}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Airline:</span>
                      <strong className="text-slate-300">{activeFlight.airline}</strong>
                    </div>
                  </div>

                  {activeFlight.status === 'Customs Alert' && (
                    <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-600/50 flex items-center gap-2 text-rose-300 text-xs">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Heightened DEA / Customs inspection active on this corridor!</span>
                    </div>
                  )}
                </div>

                {/* Seat Class Selection */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Luggage className="w-3.5 h-3.5 text-sky-400" />
                    <span>Select Travel Tier:</span>
                  </div>

                  <div className="space-y-2">
                    {/* Owned Flagship Option if available */}
                    {activeAircraft && (
                      <div
                        onClick={() => setUseFlagship(true)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          useFlagship
                            ? 'bg-emerald-950/50 border-emerald-500 ring-1 ring-emerald-500/50 text-slate-100 shadow-md shadow-emerald-950/40'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-emerald-300 flex items-center gap-1.5">
                            <Plane className="w-3.5 h-3.5 text-emerald-400" /> Personal Flagship: {activeAircraft.name}
                          </span>
                          <span className="text-emerald-400 font-mono font-black">
                            {aircraftFuelCost === 0 ? 'FREE FUEL' : `$${aircraftFuelCost.toLocaleString()}`}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Personal flight bypassing standard customs queues. <strong className="text-cyan-300">-{Math.round(activeAircraft.customsReduction * 100)}%</strong> canine/inspection risk.
                        </p>
                      </div>
                    )}

                    {/* Economy */}
                    <div
                      onClick={() => {
                        setSelectedSeatClass('economy');
                        setUseFlagship(false);
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        !useFlagship && selectedSeatClass === 'economy'
                          ? 'bg-sky-950/40 border-sky-500 ring-1 ring-sky-500/40 text-slate-100'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-200">Commercial Economy Coach</span>
                        <span className="text-emerald-400 font-mono">${activeFlight.ticketCost.toLocaleString()}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Standard coach boarding. Standard customs dog search probability.
                      </p>
                    </div>

                    {/* Business Smuggler */}
                    <div
                      onClick={() => {
                        setSelectedSeatClass('business');
                        setUseFlagship(false);
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        !useFlagship && selectedSeatClass === 'business'
                          ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/40 text-slate-100'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-emerald-300 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Business Class Smuggler
                        </span>
                        <span className="text-emerald-400 font-mono">
                          ${getEffectiveCost(activeFlight, 'business').toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Priority diplomatic fast-track lane. Reduces airport customs canine risk by <strong className="text-emerald-400">-25%</strong>.
                      </p>
                    </div>

                    {/* Private Narco Jet */}
                    <div
                      onClick={() => {
                        setSelectedSeatClass('private_narco');
                        setUseFlagship(false);
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        !useFlagship && selectedSeatClass === 'private_narco'
                          ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/40 text-slate-100'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-amber-300 flex items-center gap-1">
                          <Crown className="w-3.5 h-3.5 text-amber-400" /> Sub Rosa Private Jet Charter
                        </span>
                        <span className="text-amber-400 font-mono">
                          ${getEffectiveCost(activeFlight, 'private_narco').toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Chartered Gulfstream out of private executive hangar. Direct flight anywhere, reduces customs risk by <strong className="text-amber-400">-60%</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Smuggling Advisory */}
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-[11px] space-y-1 font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>Dest. Dog Risk:</span>
                    <strong className="text-amber-400">{Math.round((CITY_MAP.get(activeFlight.destinationCityId)?.dogRisk ?? 0.2) * 100)}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>No-Scent Cans:</span>
                    <strong className="text-emerald-400">{player.noScentCans} cans</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Luggage Contraband:</span>
                    <strong className="text-slate-200">
                      {Object.values(player.inventory).reduce((s, i) => s + i.units, 0)} units
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <Compass className="w-8 h-8 mx-auto mb-2 opacity-40 animate-spin" />
                Select a departure flight to review ticket terms.
              </div>
            )}

            {/* Booking Action Footer */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              {feedbackMsg && (
                <div
                  className={`p-2.5 rounded-lg text-xs font-bold text-center ${
                    feedbackMsg.error
                      ? 'bg-rose-950/60 border border-rose-500 text-rose-300'
                      : 'bg-emerald-950/60 border border-emerald-500 text-emerald-300'
                  }`}
                >
                  {feedbackMsg.text}
                </div>
              )}

              <button
                onClick={handleBookFlight}
                disabled={!activeFlight || !canAfford}
                className={`w-full py-3.5 rounded-xl disabled:opacity-40 font-black text-slate-950 text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
                  useFlagship && activeAircraft
                    ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-950/60'
                    : 'bg-sky-500 hover:bg-sky-400 shadow-sky-950/60'
                }`}
              >
                <span>
                  {useFlagship && activeAircraft
                    ? `Dispatch Flagship & Fly (${currentCost === 0 ? 'FREE FUEL' : `$${currentCost.toLocaleString()}`})`
                    : `Book Commercial Ticket & Fly ($${currentCost.toLocaleString()})`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
