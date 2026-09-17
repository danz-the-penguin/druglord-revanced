import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { CITIES } from '../engine/constants';
import { AIRPORT_REGISTRY } from '../engine/flightNetwork';
import { AIRCRAFT_MAP, calculateAircraftFlightCost } from '../engine/aviation';
import { getCityHeat, getInventoryTotalUnits } from '../engine/game';
import {
  projectCoordinates,
  calculateGreatCirclePath,
  interpolateQuadraticBezier,
  WORLD_LANDMASS_PATHS,
  DEA_BLOCKADE_ZONES,
  evaluateCityHotspots,
  calculateCourierBlips,
} from '../engine/smugglingMapData';
import {
  GeopoliticalHotspot,
  ActiveCourierBlip,
  FlightAnimationState,
} from '../engine/smugglingMapTypes';
import { soundEngine } from '../utils/audio';
import {
  Plane,
  Shield,
  AlertTriangle,
  Flame,
  Radio,
  Anchor,
  Check,
  Building,
  Beaker,
  Package,
  FastForward,
} from 'lucide-react';

const REGIONS = ['All', 'Americas', 'Europe', 'Asia-Pacific', 'Middle East & Africa'] as const;
type RegionFilter = (typeof REGIONS)[number];

// Viewport focus presets for regions
const REGION_BOUNDS: Record<RegionFilter, { viewBox: string }> = {
  All: { viewBox: '0 0 1000 500' },
  Americas: { viewBox: '100 40 400 460' },
  Europe: { viewBox: '420 20 220 220' },
  'Asia-Pacific': { viewBox: '650 30 350 440' },
  'Middle East & Africa': { viewBox: '420 120 280 320' },
};

export const SmugglingMap: React.FC = () => {
  const {
    player,
    travel,
    openFlightBoard,
    setActiveTab,
    setPlacesSubTab,
  } = useGameStore();

  const [selectedCityId, setSelectedCityId] = useState<string>(
    player.currentCityId === 'miami' ? 'bogota' : 'miami'
  );
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>('All');
  const [hoveredCityId, setHoveredCityId] = useState<string | null>(null);
  const [hoveredCourier, setHoveredCourier] = useState<ActiveCourierBlip | null>(null);

  // Layer Toggles
  const [showDirectCorridors, setShowDirectCorridors] = useState(true);
  const [showBlockades, setShowBlockades] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showCouriers, setShowCouriers] = useState(true);
  const [showInfrastructure, setShowInfrastructure] = useState(true);

  // Flight Animation State
  const [flightAnim, setFlightAnim] = useState<FlightAnimationState | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const currentCity = CITIES.find((c) => c.id === player.currentCityId);
  const targetCity = CITIES.find((c) => c.id === selectedCityId) || currentCity;
  const originAirport = AIRPORT_REGISTRY[player.currentCityId];
  const targetAirport = AIRPORT_REGISTRY[selectedCityId];

  const currentPos = originAirport
    ? projectCoordinates(originAirport.coordinates.lat, originAirport.coordinates.lng)
    : { x: 500, y: 250 };
  const targetPos = targetAirport
    ? projectCoordinates(targetAirport.coordinates.lat, targetAirport.coordinates.lng)
    : { x: 500, y: 250 };

  const activeAircraft = player.selectedAircraftId ? AIRCRAFT_MAP.get(player.selectedAircraftId) : null;
  const aircraftFuelCost = activeAircraft
    ? calculateAircraftFlightCost(activeAircraft, player.ownedProperties || [])
    : 0;

  const originHeat = getCityHeat(player, player.currentCityId);
  const targetHeat = targetCity ? getCityHeat(player, targetCity.id) : 0;
  const totalDrugs = getInventoryTotalUnits(player);
  const maskedUnits = (player.noScentCans || 0) * 100;
  const unmaskedDrugs = Math.max(0, totalDrugs - maskedUnits);
  const hasBaggageHandler = !!player.corruptOfficials?.airport_baggage_handler?.active;

  // Dynamic Hotspots & In-Transit Couriers
  const hotspots = useMemo(() => evaluateCityHotspots(player, player.currentDay), [player]);
  const hotspotMap = useMemo(() => {
    const map = new Map<string, GeopoliticalHotspot>();
    for (const h of hotspots) {
      map.set(h.cityId, h);
    }
    return map;
  }, [hotspots]);

  const activeCouriers = useMemo(() => calculateCourierBlips(player), [player]);

  // Selected route curve
  const selectedCorridor = useMemo(() => {
    if (!selectedCityId || selectedCityId === player.currentCityId) return null;
    return calculateGreatCirclePath(player.currentCityId, selectedCityId);
  }, [player.currentCityId, selectedCityId]);

  // Direct corridors from current airport
  const directCorridors = useMemo(() => {
    if (!originAirport?.directDestinations) return [];
    return originAirport.directDestinations
      .map((destId) => {
        if (!AIRPORT_REGISTRY[destId]) return null;
        return {
          targetId: destId,
          ...calculateGreatCirclePath(player.currentCityId, destId),
        };
      })
      .filter(Boolean);
  }, [originAirport, player.currentCityId]);

  // Handle Flight Execution with Animation
  const startFlight = (useJet: boolean) => {
    if (!targetCity || selectedCityId === player.currentCityId) return;
    if (useJet && player.cash < aircraftFuelCost) return;
    if (!useJet && player.cash < targetCity.flightCost) return;

    soundEngine.play('travel');

    const totalDurationMs = 1500;
    const startTime = performance.now();
    const distanceNm = selectedCorridor?.distanceNm || 1500;

    const aircraftName = useJet
      ? activeAircraft?.name || 'Private Jet'
      : 'Commercial Boeing 777-300ER';
    const callsign = useJet
      ? `NARCO-${selectedCityId.slice(0, 3).toUpperCase()}`
      : `AIR-${originAirport?.iata || 'DEP'}${Math.floor(100 + Math.random() * 899)}`;

    const initialAnim: FlightAnimationState = {
      isActive: true,
      originCityId: player.currentCityId,
      targetCityId: selectedCityId,
      seatClass: 'economy',
      useOwnedAircraft: useJet,
      aircraftName,
      callsign,
      progress: 0,
      currentPosition: currentPos,
      headingDegrees: 90,
      speedKts: useJet ? 590 : 490,
      mach: useJet ? 0.88 : 0.82,
      altitudeFt: 41000,
      distanceNm,
      elapsedMs: 0,
      totalDurationMs,
      isCustomsBypassed: !!hasBaggageHandler,
      unmaskedContraband: unmaskedDrugs,
    };

    setFlightAnim(initialAnim);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / totalDurationMs);

      if (selectedCorridor) {
        const { point, headingDeg } = interpolateQuadraticBezier(
          currentPos,
          selectedCorridor.midPoint,
          targetPos,
          progress
        );

        setFlightAnim((prev) =>
          prev
            ? {
                ...prev,
                progress,
                elapsedMs: elapsed,
                currentPosition: point,
                headingDegrees: headingDeg,
                altitudeFt: Math.round(
                  progress < 0.2
                    ? 5000 + progress * 5 * 36000
                    : progress > 0.8
                    ? 41000 - (progress - 0.8) * 5 * 38000
                    : 41000
                ),
              }
            : null
        );
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Flight completed!
        animFrameRef.current = null;
        setFlightAnim(null);
        travel(selectedCityId, 'economy', undefined, useJet);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  const skipFlightAnimation = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (flightAnim) {
      const { targetCityId, useOwnedAircraft } = flightAnim;
      setFlightAnim(null);
      travel(targetCityId, 'economy', undefined, useOwnedAircraft);
    }
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const activeHotspot = targetCity ? hotspotMap.get(targetCity.id) : null;
  const isTargetDirect = originAirport?.directDestinations?.includes(selectedCityId);

  // Check if player has infrastructure in selected city
  const cityVaultUnits = player.vaults?.[selectedCityId]
    ? Object.values(player.vaults[selectedCityId]).reduce((a, b) => a + b, 0)
    : 0;
  const cityOwnedProperties = player.ownedProperties?.filter((p) => {
    return p.includes(selectedCityId) || p === 'island_paradise' || p === 'mountain_compound';
  }) || [];
  const cityLabs = Object.entries(player.installedLabs || {}).filter(([propId]) => propId.includes(selectedCityId));

  return (
    <div className="bg-[#050811] border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl font-mono text-slate-200">
      {/* Top Cyber Command Header */}
      <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-950 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
                Cartel Geopolitical Smuggling Radar & World Flight Network
              </h2>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                LIVE VECTOR GRID
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>
                BASE: <strong className="text-sky-400">{currentCity?.name} ({originAirport?.iata})</strong>
              </span>
              <span>•</span>
              <span>HEAT: <strong className={originHeat >= 70 ? 'text-red-400' : originHeat >= 30 ? 'text-amber-400' : 'text-emerald-400'}>{originHeat}%</strong></span>
              <span>•</span>
              <span>TIMEZONE: <strong className="text-slate-300">UTC {originAirport?.coordinates.lng ? Math.round(originAirport.coordinates.lng / 15) : 0 >= 0 ? `+${Math.round((originAirport?.coordinates.lng || 0) / 15)}` : Math.round((originAirport?.coordinates.lng || 0) / 15)}</strong></span>
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={openFlightBoard}
            className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-sky-950/50 transition-all cursor-pointer active:scale-95"
            title="Open Airport Split-Flap Departure Flip-Board"
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Flight Flip-Board</span>
          </button>
        </div>
      </div>

      {/* Flagship Aircraft Active Banner */}
      {activeAircraft && (
        <div className="bg-emerald-950/40 border-b border-emerald-800/60 px-5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <span className="text-sm">{activeAircraft.icon}</span>
            <span>
              <strong>FLAGSHIP READY:</strong> {activeAircraft.name} ({activeAircraft.model}) • Fuel:{' '}
              <strong className={aircraftFuelCost === 0 ? 'text-emerald-300' : 'text-amber-300'}>
                {aircraftFuelCost === 0 ? '$0 (Hangar Free)' : `$${aircraftFuelCost.toLocaleString()}`}
              </strong>{' '}
              • Customs Shield: <strong className="text-cyan-300">-{Math.round(activeAircraft.customsReduction * 100)}%</strong>
            </span>
          </div>
          {hasBaggageHandler && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 flex items-center gap-1">
              <Shield className="w-3 h-3 text-sky-400" /> Baggage Handler Customs Immunity Active
            </span>
          )}
        </div>
      )}

      {/* Layer Toggles and Region Filter Bar */}
      <div className="bg-slate-950/90 px-5 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Regions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 text-[11px] uppercase font-bold mr-1">Sector:</span>
          {REGIONS.map((region) => {
            const count = region === 'All' ? CITIES.length : CITIES.filter((c) => c.region === region).length;
            const isActive = selectedRegion === region;
            return (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  isActive
                    ? 'bg-sky-500 text-slate-950 shadow-sm shadow-sky-950'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{region}</span>
                <span className={`text-[10px] px-1 rounded font-black ${isActive ? 'bg-sky-700/80 text-sky-100' : 'text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tactical Layer Checkboxes */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
          <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200">
            <input
              type="checkbox"
              checked={showDirectCorridors}
              onChange={(e) => setShowDirectCorridors(e.target.checked)}
              className="rounded accent-sky-500 cursor-pointer"
            />
            <span>Corridors</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200">
            <input
              type="checkbox"
              checked={showBlockades}
              onChange={(e) => setShowBlockades(e.target.checked)}
              className="rounded accent-rose-500 cursor-pointer"
            />
            <span>DEA Zones</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200">
            <input
              type="checkbox"
              checked={showHotspots}
              onChange={(e) => setShowHotspots(e.target.checked)}
              className="rounded accent-amber-500 cursor-pointer"
            />
            <span>Hotspots</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200">
            <input
              type="checkbox"
              checked={showCouriers}
              onChange={(e) => setShowCouriers(e.target.checked)}
              className="rounded accent-cyan-500 cursor-pointer"
            />
            <span>Couriers ({activeCouriers.length})</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200">
            <input
              type="checkbox"
              checked={showInfrastructure}
              onChange={(e) => setShowInfrastructure(e.target.checked)}
              className="rounded accent-purple-500 cursor-pointer"
            />
            <span>Vaults & Labs</span>
          </label>
        </div>
      </div>

      {/* Main Vector Map & Tactical Dossier Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 relative min-h-[500px]">
        {/* Vector SVG World Map Canvas */}
        <div className="lg:col-span-8 xl:col-span-9 bg-[#04070d] relative overflow-hidden p-2 flex flex-col justify-center select-none">
          {/* Active Flight Telemetry HUD Banner (When Flight Animating) */}
          {flightAnim && (
            <div className="absolute top-4 left-4 right-4 z-40 bg-slate-900/95 border border-sky-500/80 rounded-xl p-3 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-400">
                  <Plane className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-sky-400">FLIGHT IN PROGRESS:</span>
                    <strong className="text-slate-100 font-mono text-sm">{flightAnim.callsign}</strong>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                      {flightAnim.aircraftName}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-mono flex items-center gap-3 mt-0.5">
                    <span>
                      ROUTE: <strong className="text-emerald-400">{AIRPORT_REGISTRY[flightAnim.originCityId]?.iata} ➔ {AIRPORT_REGISTRY[flightAnim.targetCityId]?.iata}</strong>
                    </span>
                    <span>•</span>
                    <span>ALT: <strong className="text-sky-300">{flightAnim.altitudeFt.toLocaleString()} FT</strong></span>
                    <span>•</span>
                    <span>SPEED: <strong className="text-amber-300">Mach {flightAnim.mach} ({flightAnim.speedKts} kts)</strong></span>
                  </div>
                </div>
              </div>

              {/* Progress Bar & Skip */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-36 bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full transition-all duration-75"
                    style={{ width: `${Math.round(flightAnim.progress * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-black text-sky-400 w-10">
                  {Math.round(flightAnim.progress * 100)}%
                </span>
                <button
                  onClick={skipFlightAnimation}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  title="Fast-forward and land immediately"
                >
                  <FastForward className="w-3 h-3" />
                  <span>Skip</span>
                </button>
              </div>
            </div>
          )}

          {/* SVG Map Container */}
          <div className="relative w-full aspect-[2/1] max-h-[580px]">
            <svg
              viewBox={REGION_BOUNDS[selectedRegion].viewBox}
              className="w-full h-full transition-all duration-700 ease-out"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Hazard Stripe Pattern for DEA Blockades */}
                <pattern id="hazardStripe" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="4" height="8" fill="rgba(244, 63, 94, 0.15)" />
                  <rect x="4" width="4" height="8" fill="transparent" />
                </pattern>

                {/* Radar Grid Dot Pattern */}
                <pattern id="radarGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.75" fill="rgba(56, 189, 248, 0.08)" />
                </pattern>

                {/* Glow Filter for Active Route */}
                <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Background Radar Grid */}
              <rect width="1000" height="500" fill="#04070d" />
              <rect width="1000" height="500" fill="url(#radarGrid)" />

              {/* Latitude & Longitude Coordinate Lines */}
              <g stroke="rgba(51, 65, 85, 0.25)" strokeWidth="0.75" strokeDasharray="3 3">
                {/* Equator */}
                <line x1="0" y1="285.7" x2="1000" y2="285.7" stroke="rgba(56, 189, 248, 0.3)" strokeDasharray="none" />
                {/* Tropics */}
                <line x1="0" y1="202" x2="1000" y2="202" />
                <line x1="0" y1="369" x2="1000" y2="369" />
                {/* 60 deg N & S */}
                <line x1="0" y1="71" x2="1000" y2="71" />
                <line x1="0" y1="500" x2="1000" y2="500" />
                {/* Prime Meridian & 60 deg increments */}
                <line x1="500" y1="0" x2="500" y2="500" stroke="rgba(56, 189, 248, 0.3)" strokeDasharray="none" />
                <line x1="166" y1="0" x2="166" y2="500" />
                <line x1="333" y1="0" x2="333" y2="500" />
                <line x1="666" y1="0" x2="666" y2="500" />
                <line x1="833" y1="0" x2="833" y2="500" />
              </g>

              {/* World Continents Vector Outlines */}
              <g id="worldLandmasses">
                {WORLD_LANDMASS_PATHS.map((land) => (
                  <path
                    key={land.id}
                    d={land.d}
                    fill="#0b1120"
                    stroke="#1e293b"
                    strokeWidth="1.2"
                    className="transition-colors hover:fill-[#0f172a]"
                  />
                ))}
              </g>

              {/* DEA Naval and Air Blockade Zones */}
              {showBlockades && (
                <g id="deaBlockades">
                  {DEA_BLOCKADE_ZONES.map((zone) => {
                    const pointsStr = zone.polygonPoints.map((p) => `${p.x},${p.y}`).join(' ');
                    return (
                      <g key={zone.id} className="cursor-pointer">
                        <polygon
                          points={pointsStr}
                          fill="url(#hazardStripe)"
                          stroke={zone.threatLevel === 'severe' ? '#f43f5e' : '#f59e0b'}
                          strokeWidth="1"
                          strokeDasharray="4 2"
                          opacity="0.8"
                        />
                        <rect
                          x={zone.labelPosition.x - 28}
                          y={zone.labelPosition.y - 8}
                          width="56"
                          height="14"
                          rx="3"
                          fill="rgba(15, 23, 42, 0.85)"
                          stroke={zone.threatLevel === 'severe' ? '#f43f5e' : '#f59e0b'}
                          strokeWidth="0.75"
                        />
                        <text
                          x={zone.labelPosition.x}
                          y={zone.labelPosition.y + 2.5}
                          fill={zone.threatLevel === 'severe' ? '#fca5a5' : '#fde68a'}
                          fontSize="7"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {zone.code}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Direct Corridors from Current City */}
              {showDirectCorridors && (
                <g id="directCorridors">
                  {directCorridors.map((c) => {
                    if (!c) return null;
                    const isSelected = c.targetId === selectedCityId;
                    if (isSelected) return null; // Drawn separately with glow
                    return (
                      <path
                        key={`direct_${c.targetId}`}
                        d={c.pathString}
                        fill="none"
                        stroke="rgba(56, 189, 248, 0.2)"
                        strokeWidth="1"
                        strokeDasharray="2 4"
                      />
                    );
                  })}
                </g>
              )}

              {/* Active Selected Great-Circle Route (Laser Glow) */}
              {selectedCorridor && (
                <g id="activeCorridor">
                  {/* Outer laser glow */}
                  <path
                    d={selectedCorridor.pathString}
                    fill="none"
                    stroke="rgba(56, 189, 248, 0.35)"
                    strokeWidth="4"
                    filter="url(#laserGlow)"
                  />
                  {/* Core laser beam */}
                  <path
                    d={selectedCorridor.pathString}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="8 6"
                    className="animate-pulse"
                  />
                  {/* Midpoint Distance Pill */}
                  <g transform={`translate(${selectedCorridor.midPoint.x}, ${selectedCorridor.midPoint.y})`}>
                    <rect
                      x="-32"
                      y="-9"
                      width="64"
                      height="16"
                      rx="4"
                      fill="#0f172a"
                      stroke="#38bdf8"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="2.5"
                      fill="#bae6fd"
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {selectedCorridor.distanceNm.toLocaleString()} NM
                    </text>
                  </g>
                </g>
              )}

              {/* In-Transit Couriers on Map */}
              {showCouriers && (
                <g id="courierBlips">
                  {activeCouriers.map((courier) => (
                    <g
                      key={courier.id}
                      transform={`translate(${courier.currentPosition.x}, ${courier.currentPosition.y})`}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredCourier(courier)}
                      onMouseLeave={() => setHoveredCourier(null)}
                    >
                      <circle r="6" fill="#06b6d4" fillOpacity="0.3" className="animate-ping" />
                      <circle r="4" fill="#06b6d4" stroke="#ffffff" strokeWidth="1" />
                      <text x="6" y="3" fill="#67e8f9" fontSize="7" fontWeight="bold">
                        {courier.shipperName.split(' ')[0]} ({courier.units}u)
                      </text>
                    </g>
                  ))}
                </g>
              )}

              {/* 30 City Nodes */}
              <g id="cityNodes">
                {CITIES.map((city) => {
                  const airport = AIRPORT_REGISTRY[city.id];
                  if (!airport) return null;
                  const pos = projectCoordinates(airport.coordinates.lat, airport.coordinates.lng);
                  const isCurrent = city.id === player.currentCityId;
                  const isSelected = city.id === selectedCityId;
                  const isHovered = city.id === hoveredCityId;
                  const heat = getCityHeat(player, city.id);
                  const hotspot = hotspotMap.get(city.id);

                  // Heat color ring
                  const heatColor =
                    heat >= 70 ? '#f43f5e' : heat >= 30 ? '#f59e0b' : '#10b981';

                  // Stash presence
                  const hasStash =
                    player.vaults?.[city.id] &&
                    Object.values(player.vaults[city.id]).some((v) => v > 0);

                  return (
                    <g
                      key={city.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      className="cursor-pointer transition-transform duration-150"
                      onClick={() => setSelectedCityId(city.id)}
                      onMouseEnter={() => setHoveredCityId(city.id)}
                      onMouseLeave={() => setHoveredCityId(null)}
                    >
                      {/* Current City Pulsing Beacon */}
                      {isCurrent && (
                        <circle
                          r="12"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="1.5"
                          className="animate-ping"
                        />
                      )}

                      {/* Selected Reticle */}
                      {isSelected && (
                        <g>
                          <circle r="10" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                          <line x1="-14" y1="0" x2="-8" y2="0" stroke="#38bdf8" strokeWidth="1.5" />
                          <line x1="8" y1="0" x2="14" y2="0" stroke="#38bdf8" strokeWidth="1.5" />
                          <line x1="0" y1="-14" x2="0" y2="-8" stroke="#38bdf8" strokeWidth="1.5" />
                          <line x1="0" y1="8" x2="0" y2="14" stroke="#38bdf8" strokeWidth="1.5" />
                        </g>
                      )}

                      {/* Node Outer Heat Ring */}
                      <circle
                        r={isCurrent ? 6 : isSelected ? 5.5 : 4.5}
                        fill={isCurrent ? '#10b981' : isSelected ? '#38bdf8' : '#0f172a'}
                        stroke={heatColor}
                        strokeWidth={heat >= 70 ? 2 : 1.2}
                      />

                      {/* Inner Dot */}
                      <circle
                        r={isCurrent ? 3 : 2}
                        fill={isCurrent ? '#ffffff' : isSelected ? '#ffffff' : heatColor}
                      />

                      {/* Hotspot Icon Pip */}
                      {showHotspots && hotspot && (
                        <g transform="translate(6, -8)">
                          <circle
                            r="4"
                            fill={
                              hotspot.severity === 'danger'
                                ? '#e11d48'
                                : hotspot.severity === 'sanctuary'
                                ? '#eab308'
                                : '#38bdf8'
                            }
                            stroke="#0f172a"
                            strokeWidth="0.75"
                          />
                        </g>
                      )}

                      {/* Vault Stash Pip */}
                      {showInfrastructure && hasStash && (
                        <g transform="translate(-8, -8)">
                          <rect
                            x="-3"
                            y="-3"
                            width="6"
                            height="6"
                            rx="1"
                            fill="#8b5cf6"
                            stroke="#0f172a"
                            strokeWidth="0.75"
                          />
                        </g>
                      )}

                      {/* City IATA Label */}
                      <text
                        x="0"
                        y={isCurrent ? 14 : 12}
                        fill={
                          isCurrent
                            ? '#34d399'
                            : isSelected
                            ? '#7dd3fc'
                            : isHovered
                            ? '#f8fafc'
                            : '#94a3b8'
                        }
                        fontSize={isCurrent || isSelected ? '8' : '7'}
                        fontWeight={isCurrent || isSelected ? 'bold' : 'normal'}
                        textAnchor="middle"
                      >
                        {airport.iata}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* Traversal Blip (Aircraft during Flight Animation) */}
              {flightAnim && (
                <g
                  transform={`translate(${flightAnim.currentPosition.x}, ${flightAnim.currentPosition.y}) rotate(${flightAnim.headingDegrees})`}
                  className="z-50"
                >
                  {/* Jet Exhaust Trail */}
                  <line x1="-12" y1="0" x2="-2" y2="0" stroke="#38bdf8" strokeWidth="2.5" opacity="0.8" />
                  <circle cx="-12" cy="0" r="3" fill="#38bdf8" opacity="0.4" className="animate-ping" />
                  {/* Plane Silhouette */}
                  <path
                    d="M 6 0 L -3 -5 L -1 -1 L -6 -1 L -8 -3 L -8 3 L -6 1 L -1 1 L -3 5 Z"
                    fill="#38bdf8"
                    stroke="#ffffff"
                    strokeWidth="0.75"
                  />
                </g>
              )}
            </svg>

            {/* Hovered Courier Tooltip Card */}
            {hoveredCourier && (
              <div
                className="absolute z-50 bg-slate-900/95 border border-cyan-500 rounded-lg p-2.5 text-xs shadow-xl pointer-events-none font-mono"
                style={{
                  left: `${(hoveredCourier.currentPosition.x / 1000) * 100}%`,
                  top: `${(hoveredCourier.currentPosition.y / 500) * 100}%`,
                  transform: 'translate(-50%, -120%)',
                }}
              >
                <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{hoveredCourier.shipperName}</span>
                </div>
                <div className="text-slate-300 mt-1">
                  Cargo: <strong>{hoveredCourier.units.toLocaleString()}x {hoveredCourier.drugName}</strong>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Route: {hoveredCourier.originCityId.toUpperCase()} ➔ {hoveredCourier.targetCityId.toUpperCase()}
                </div>
                <div className="text-[10px] text-amber-400 mt-0.5">
                  ETA: {hoveredCourier.daysRemaining}d • Interception Risk: {hoveredCourier.interceptionRisk}%
                </div>
              </div>
            )}
          </div>

          {/* Bottom Map Legend */}
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 px-2">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-950" />
                <span>Base (Present)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border border-sky-400 bg-sky-950" />
                <span>Selected Destination</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>High Heat ({'>'}70%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-purple-500" />
                <span>Safehouse Stash</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Hotspot Warning</span>
              </span>
            </div>

            <span className="text-[10px] text-slate-500">
              Click any city node to target • Press <strong>M</strong> to toggle map
            </span>
          </div>
        </div>

        {/* Right Tactical Destination Dossier Deck */}
        <div className="lg:col-span-4 xl:col-span-3 bg-slate-900/90 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 sm:p-5 flex flex-col justify-between space-y-4">
          {targetCity ? (
            <div className="space-y-4">
              {/* City Header */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                      {targetCity.name}
                      <span className="text-xs px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-bold">
                        {targetAirport?.iata || 'AIR'}
                      </span>
                    </h3>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{targetCity.country}</span>
                      <span>•</span>
                      <span>{targetCity.region}</span>
                    </div>
                  </div>

                  {targetCity.id === player.currentCityId ? (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                      CURRENT BASE
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                        isTargetDirect
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border-amber-800'
                      }`}
                    >
                      {isTargetDirect ? 'Direct Flight' : 'Connecting Route'}
                    </span>
                  )}
                </div>

                {/* Specialty Tag */}
                {targetCity.specialty && (
                  <div className="mt-2 text-xs font-bold text-amber-300 bg-amber-950/40 border border-amber-800/60 px-2.5 py-1 rounded-lg">
                    ★ {targetCity.specialty}
                  </div>
                )}

                <p className="text-xs text-slate-300 mt-2 leading-relaxed font-sans">
                  {targetCity.description}
                </p>
              </div>

              {/* Geopolitical Hotspot Briefing */}
              {activeHotspot && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    activeHotspot.severity === 'danger'
                      ? 'bg-rose-950/50 border-rose-700 text-rose-200'
                      : activeHotspot.severity === 'sanctuary'
                      ? 'bg-amber-950/50 border-amber-600 text-amber-200'
                      : 'bg-sky-950/50 border-sky-700 text-sky-200'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 uppercase text-[11px]">
                    {activeHotspot.severity === 'danger' && <Flame className="w-3.5 h-3.5 text-rose-400" />}
                    {activeHotspot.severity === 'sanctuary' && <Shield className="w-3.5 h-3.5 text-amber-400" />}
                    {activeHotspot.severity === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                    {activeHotspot.severity === 'info' && <Anchor className="w-3.5 h-3.5 text-sky-400" />}
                    <span>{activeHotspot.title}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">{activeHotspot.description}</p>
                </div>
              )}

              {/* Security & Risk Gauges */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-slate-300 uppercase text-[11px] flex items-center justify-between">
                  <span>Customs & Security Profile</span>
                  <span className="text-[10px] text-slate-500">{targetAirport?.terminals} Terminals</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Patrol</span>
                    <strong className="text-slate-100 text-sm">
                      {Math.round(targetCity.policeRisk * 100)}%
                    </strong>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">K9 Customs</span>
                    <strong className="text-slate-100 text-sm">
                      {Math.round(targetCity.dogRisk * 100)}%
                    </strong>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Local Heat</span>
                    <strong
                      className={`text-sm ${
                        targetHeat >= 70
                          ? 'text-red-400 font-black'
                          : targetHeat >= 30
                          ? 'text-amber-400 font-bold'
                          : 'text-emerald-400'
                      }`}
                    >
                      {targetHeat}%
                    </strong>
                  </div>
                </div>

                {hasBaggageHandler && (
                  <div className="text-[10px] text-sky-400 flex items-center gap-1 pt-1">
                    <Check className="w-3 h-3 text-sky-400" />
                    <span>Corrupt Baggage Handler bypasses 100% of customs in commercial flights.</span>
                  </div>
                )}
              </div>

              {/* Infrastructure & Stash Presence */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-slate-300 uppercase text-[11px] flex items-center justify-between">
                  <span>Cartel Assets in {targetCity.name}</span>
                  <span className="text-purple-400 font-bold">
                    {cityVaultUnits.toLocaleString()} units
                  </span>
                </div>

                <div className="space-y-1.5 pt-1 text-[11px]">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Package className="w-3.5 h-3.5 text-purple-400" /> Safehouse Vault:
                    </span>
                    <strong className={cityVaultUnits > 0 ? 'text-purple-300' : 'text-slate-500'}>
                      {cityVaultUnits > 0 ? `${cityVaultUnits.toLocaleString()} units stashed` : 'Empty'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Building className="w-3.5 h-3.5 text-emerald-400" /> Properties Owned:
                    </span>
                    <strong className={cityOwnedProperties.length > 0 ? 'text-emerald-300' : 'text-slate-500'}>
                      {cityOwnedProperties.length > 0 ? `${cityOwnedProperties.length} properties` : 'None'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Beaker className="w-3.5 h-3.5 text-amber-400" /> Clandestine Labs:
                    </span>
                    <strong className={cityLabs.length > 0 ? 'text-amber-300' : 'text-slate-500'}>
                      {cityLabs.length > 0 ? `${cityLabs.length} operational` : 'None'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 font-mono">
              Select a city node on the vector map to inspect flight corridors and customs intelligence.
            </div>
          )}

          {/* Action Departure Buttons */}
          {targetCity && targetCity.id !== player.currentCityId && (
            <div className="space-y-2 pt-3 border-t border-slate-800">
              {/* Private Jet Departure */}
              {activeAircraft && (
                <button
                  onClick={() => startFlight(true)}
                  disabled={player.cash < aircraftFuelCost || !!flightAnim}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-between shadow-lg cursor-pointer ${
                    player.cash >= aircraftFuelCost && !flightAnim
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-950/50 hover:scale-[1.02] active:scale-95'
                      : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed opacity-60'
                  }`}
                  title={`Fly personal ${activeAircraft.name} (-${Math.round(activeAircraft.customsReduction * 100)}% customs)`}
                >
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4" />
                    <span>Fly {activeAircraft.name}</span>
                  </div>
                  <span className="font-mono">
                    {aircraftFuelCost === 0 ? 'FREE (Hangar)' : `$${aircraftFuelCost.toLocaleString()}`}
                  </span>
                </button>
              )}

              {/* Commercial Airline Flight */}
              <button
                onClick={() => startFlight(false)}
                disabled={player.cash < targetCity.flightCost || !!flightAnim}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-between shadow-lg cursor-pointer ${
                  player.cash >= targetCity.flightCost && !flightAnim
                    ? 'bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 text-slate-950 shadow-sky-950/50 hover:scale-[1.02] active:scale-95'
                    : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed opacity-60'
                }`}
                title="Board scheduled commercial flight"
              >
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4" />
                  <span>Fly Commercial Airline</span>
                </div>
                <span className="font-mono">${targetCity.flightCost.toLocaleString()}</span>
              </button>

              {/* Safehouse Stash Fast-Link */}
              {cityVaultUnits > 0 && (
                <button
                  onClick={() => {
                    setActiveTab('places');
                    setPlacesSubTab('vaults');
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 border border-purple-800/80 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5 text-purple-400" />
                  <span>Manage {targetCity.name} Safehouse Stash</span>
                </button>
              )}
            </div>
          )}

          {targetCity && targetCity.id === player.currentCityId && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 text-center space-y-1">
              <span className="font-bold block">CURRENT BASE LOCATION</span>
              <p className="text-[11px] text-slate-400">
                You are currently docked in {targetCity.name}. Click another destination on the vector radar to plot flight routes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
