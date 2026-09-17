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
  WORLD_TOPOGRAPHY_CONTOURS,
  DEA_BLOCKADE_ZONES,
  CARTEL_PATROL_VECTORS,
  STORM_HAZARD_ZONES,
  calculateDayNightTerminatorPath,
  evaluateCityHotspots,
  calculateCourierBlips,
} from '../engine/smugglingMapData';
import {
  GeopoliticalHotspot,
  ActiveCourierBlip,
  FlightAnimationState,
  CartelPatrolVector,
  StormHazardZone,
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
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Swords,
  Crosshair,
  Wind,
} from 'lucide-react';

const REGIONS = ['All', 'Americas', 'Europe', 'Asia-Pacific', 'Middle East & Africa'] as const;
type RegionFilter = (typeof REGIONS)[number];

// Viewport focus presets for regions
const REGION_BOUNDS: Record<RegionFilter, { x: number; y: number; zoom: number }> = {
  All: { x: 0, y: 0, zoom: 1 },
  Americas: { x: 100, y: 40, zoom: 2.2 },
  Europe: { x: 420, y: 20, zoom: 3.5 },
  'Asia-Pacific': { x: 650, y: 30, zoom: 2.2 },
  'Middle East & Africa': { x: 420, y: 120, zoom: 2.5 },
};

function getLandmassGradientId(landId: string): string {
  switch (landId) {
    case 'north_america':
      return 'naTerrain';
    case 'south_america':
      return 'saTerrain';
    case 'europe':
      return 'euTerrain';
    case 'africa':
      return 'afTerrain';
    case 'asia':
      return 'asTerrain';
    case 'australia':
      return 'auTerrain';
    case 'greenland':
    case 'iceland':
      return 'arcticTerrain';
    default:
      return 'tropicalIslandTerrain';
  }
}

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
  const [hoveredPatrol, setHoveredPatrol] = useState<CartelPatrolVector | null>(null);
  const [hoveredStorm, setHoveredStorm] = useState<StormHazardZone | null>(null);

  // Interactive Zoom & Pan State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Layer Toggles
  const [showDirectCorridors, setShowDirectCorridors] = useState(true);
  const [showBlockades, setShowBlockades] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showCouriers, setShowCouriers] = useState(true);
  const [showInfrastructure, setShowInfrastructure] = useState(true);
  const [showTopography, setShowTopography] = useState(true);
  const [showTerminator, setShowTerminator] = useState(true);
  const [showStorms, setShowStorms] = useState(true);
  const [showCartelPatrols, setShowCartelPatrols] = useState(true);
  const [showTurfWars, setShowTurfWars] = useState(true);

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

  // Day/Night Solar Terminator Shadow Curve
  const terminatorPath = useMemo(() => {
    return calculateDayNightTerminatorPath(player.currentDay, 14);
  }, [player.currentDay]);

  // Selected route curve
  const selectedCorridor = useMemo(() => {
    if (!selectedCityId || selectedCityId === player.currentCityId) return null;
    return calculateGreatCirclePath(player.currentCityId, selectedCityId);
  }, [player.currentCityId, selectedCityId]);

  // Dynamic SVG ViewBox calculation based on zoom & pan
  const visibleW = 1000 / zoom;
  const visibleH = 500 / zoom;
  const clampedPanX = Math.max(0, Math.min(1000 - visibleW, pan.x));
  const clampedPanY = Math.max(0, Math.min(500 - visibleH, pan.y));
  const currentViewBox = `${clampedPanX} ${clampedPanY} ${visibleW} ${visibleH}`;

  // Node scale factor to eliminate collisions when zoomed in or out
  const nodeScale = Math.max(0.45, 1 / Math.sqrt(zoom));

  // Zoom & Pan Handlers
  const handleSelectRegion = (region: RegionFilter) => {
    setSelectedRegion(region);
    const b = REGION_BOUNDS[region];
    setZoom(b.zoom);
    setPan({ x: b.x, y: b.y });
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(5, Math.round((prev + 0.4) * 10) / 10));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(1, Math.round((prev - 0.4) * 10) / 10);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetView = () => {
    setSelectedRegion('All');
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || !svgRef.current) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });

    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = visibleW / rect.width;
    const scaleY = visibleH / rect.height;

    setPan((prev) => ({
      x: Math.max(0, Math.min(1000 - visibleW, prev.x - dx * scaleX)),
      y: Math.max(0, Math.min(500 - visibleH, prev.y - dy * scaleY)),
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.85 : 1.18;
    setZoom((prev) => {
      const next = Math.max(1, Math.min(5, Math.round(prev * factor * 100) / 100));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

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

  // Active turf war & macro shocks targeting selected city
  const cityTurfWar = targetCity
    ? player.activeTurfWars?.find((w) => w.contestedCityIds.includes(targetCity.id))
    : null;
  const cityMacroEvents = targetCity
    ? player.activeMacroEvents?.filter((ev) => !ev.affectedCityIds || ev.affectedCityIds.includes(targetCity.id)) || []
    : [];

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
                onClick={() => handleSelectRegion(region)}
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
        <div className="flex items-center gap-2.5 text-[11px] text-slate-400 flex-wrap">
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
            <span>DEA</span>
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
            <span>Vaults</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200">
            <input
              type="checkbox"
              checked={showTopography}
              onChange={(e) => setShowTopography(e.target.checked)}
              className="rounded accent-slate-400 cursor-pointer"
            />
            <span>Topography</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200">
            <input
              type="checkbox"
              checked={showTerminator}
              onChange={(e) => setShowTerminator(e.target.checked)}
              className="rounded accent-indigo-400 cursor-pointer"
            />
            <span>Day/Night</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200">
            <input
              type="checkbox"
              checked={showStorms}
              onChange={(e) => setShowStorms(e.target.checked)}
              className="rounded accent-sky-400 cursor-pointer"
            />
            <span>Storms</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200">
            <input
              type="checkbox"
              checked={showCartelPatrols}
              onChange={(e) => setShowCartelPatrols(e.target.checked)}
              className="rounded accent-emerald-400 cursor-pointer"
            />
            <span>Patrols</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200">
            <input
              type="checkbox"
              checked={showTurfWars}
              onChange={(e) => setShowTurfWars(e.target.checked)}
              className="rounded accent-red-500 cursor-pointer"
            />
            <span className="text-red-400 font-bold">Turf Wars</span>
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
          <div className="relative w-full aspect-[2/1] max-h-[580px] overflow-hidden rounded-xl">
            {/* Floating Zoom & Pan Tactical HUD Controls */}
            <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl p-1.5 shadow-xl backdrop-blur-md">
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white transition-colors cursor-pointer"
                title="Zoom In (or scroll wheel up)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono font-bold text-slate-300 px-1 min-w-[36px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white transition-colors cursor-pointer"
                title="Zoom Out (or scroll wheel down)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <div className="h-4 w-px bg-slate-700 mx-0.5" />
              <button
                onClick={handleResetView}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Reset View to 100%"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <svg
              ref={svgRef}
              viewBox={currentViewBox}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              className={`w-full h-full select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Deep Oceanic Bathymetry Radial Gradient */}
                <radialGradient id="oceanRadialGradient" cx="50%" cy="50%" r="75%" fx="50%" fy="50%">
                  <stop offset="0%" stopColor="#0b2c56" />
                  <stop offset="40%" stopColor="#082042" />
                  <stop offset="75%" stopColor="#041226" />
                  <stop offset="100%" stopColor="#020914" />
                </radialGradient>

                {/* Oceanic Bathymetry Depth Wave Pattern */}
                <pattern id="bathymetryRipples" width="36" height="36" patternUnits="userSpaceOnUse">
                  <path d="M 0 18 Q 9 12 18 18 T 36 18" fill="none" stroke="rgba(56, 189, 248, 0.05)" strokeWidth="0.75" />
                  <circle cx="18" cy="18" r="0.75" fill="rgba(56, 189, 248, 0.08)" />
                </pattern>

                {/* Natural Earth / Satellite Biome Gradients */}
                {/* North America: Pacific NW evergreen -> Great Plains tan -> Sonoran desert */}
                <linearGradient id="naTerrain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1e3a24" />
                  <stop offset="35%" stopColor="#254a2e" />
                  <stop offset="60%" stopColor="#554728" />
                  <stop offset="85%" stopColor="#694b29" />
                  <stop offset="100%" stopColor="#274626" />
                </linearGradient>

                {/* South America: Colombian jungle -> Amazon deep rainforest -> Cerrado -> Pampas */}
                <linearGradient id="saTerrain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#184824" />
                  <stop offset="30%" stopColor="#0f391b" />
                  <stop offset="65%" stopColor="#2f4e26" />
                  <stop offset="85%" stopColor="#484429" />
                  <stop offset="100%" stopColor="#38362b" />
                </linearGradient>

                {/* Europe: Scandinavian taiga -> Central European green woodland -> Mediterranean olive */}
                <linearGradient id="euTerrain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1a4228" />
                  <stop offset="40%" stopColor="#255431" />
                  <stop offset="75%" stopColor="#3d5229" />
                  <stop offset="100%" stopColor="#4e4628" />
                </linearGradient>

                {/* Africa: Sahara golden sands -> Sahel savannah -> Congo rainforest -> Kalahari */}
                <linearGradient id="afTerrain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7e5d2e" />
                  <stop offset="20%" stopColor="#a3783a" />
                  <stop offset="40%" stopColor="#785930" />
                  <stop offset="55%" stopColor="#12401e" />
                  <stop offset="75%" stopColor="#385026" />
                  <stop offset="90%" stopColor="#6e522b" />
                  <stop offset="100%" stopColor="#2a4628" />
                </linearGradient>

                {/* Asia / Eurasia: Siberian taiga -> Urals/Altai -> Gobi sands -> Tropical SE Asia */}
                <linearGradient id="asTerrain" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#193d28" />
                  <stop offset="30%" stopColor="#3d4f3b" />
                  <stop offset="50%" stopColor="#6f5634" />
                  <stop offset="70%" stopColor="#444f3e" />
                  <stop offset="85%" stopColor="#22542e" />
                  <stop offset="100%" stopColor="#134723" />
                </linearGradient>

                {/* Australia: Outback red sandstone -> Simpson Desert ochre -> Coastal eucalyptus */}
                <linearGradient id="auTerrain" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#873f1f" />
                  <stop offset="45%" stopColor="#9e4c27" />
                  <stop offset="80%" stopColor="#744423" />
                  <stop offset="100%" stopColor="#2a4524" />
                </linearGradient>

                {/* Arctic / Greenland / Iceland: Frosty glacier ice sheet -> Tundra rock */}
                <linearGradient id="arcticTerrain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3e5964" />
                  <stop offset="100%" stopColor="#293f48" />
                </linearGradient>

                {/* Tropical Islands (Caribbean, SE Asia, Japan, NZ, Madagascar): Lush canopy */}
                <linearGradient id="tropicalIslandTerrain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#184e29" />
                  <stop offset="100%" stopColor="#236b3b" />
                </linearGradient>

                {/* Hazard Stripe Pattern for DEA Blockades */}
                <pattern id="hazardStripe" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="4" height="8" fill="rgba(244, 63, 94, 0.2)" />
                  <rect x="4" width="4" height="8" fill="transparent" />
                </pattern>

                {/* Radar Grid Dot Pattern */}
                <pattern id="radarGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.75" fill="rgba(56, 189, 248, 0.08)" />
                </pattern>

                {/* Glow Filter for Active Route */}
                <filter id="laserGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Deep Gradient Ocean Background */}
              <rect width="1000" height="500" fill="url(#oceanRadialGradient)" />
              {/* Bathymetry Wave Pattern Grid */}
              <rect width="1000" height="500" fill="url(#bathymetryRipples)" />
              <rect width="1000" height="500" fill="url(#radarGrid)" />

              {/* Latitude & Longitude Coordinate Lines */}
              <g stroke="rgba(56, 189, 248, 0.14)" strokeWidth={0.75 * nodeScale} strokeDasharray="3 3">
                {/* Equator */}
                <line x1="0" y1="285.7" x2="1000" y2="285.7" stroke="rgba(56, 189, 248, 0.35)" strokeDasharray="none" />
                {/* Tropics */}
                <line x1="0" y1="202" x2="1000" y2="202" />
                <line x1="0" y1="369" x2="1000" y2="369" />
                {/* 60 deg N & S */}
                <line x1="0" y1="71" x2="1000" y2="71" />
                <line x1="0" y1="500" x2="1000" y2="500" />
                {/* Prime Meridian & 60 deg increments */}
                <line x1="500" y1="0" x2="500" y2="500" stroke="rgba(56, 189, 248, 0.35)" strokeDasharray="none" />
                <line x1="166" y1="0" x2="166" y2="500" />
                <line x1="333" y1="0" x2="333" y2="500" />
                <line x1="666" y1="0" x2="666" y2="500" />
                <line x1="833" y1="0" x2="833" y2="500" />
              </g>

              {/* Continental Shelf Marine Water Halo (Natural Earth / Mapbox Turquoise Shelf) */}
              <g id="continentalShelves" pointerEvents="none">
                {/* Deep Outer Marine Shelf */}
                {WORLD_LANDMASS_PATHS.map((land) => (
                  <path
                    key={`shelf_deep_${land.id}`}
                    d={land.d}
                    fill="none"
                    stroke="rgba(8, 47, 73, 0.55)"
                    strokeWidth={14 * nodeScale}
                    strokeLinejoin="round"
                  />
                ))}
                {/* Mid Coastal Shelf */}
                {WORLD_LANDMASS_PATHS.map((land) => (
                  <path
                    key={`shelf_mid_${land.id}`}
                    d={land.d}
                    fill="none"
                    stroke="rgba(14, 116, 144, 0.4)"
                    strokeWidth={7 * nodeScale}
                    strokeLinejoin="round"
                  />
                ))}
                {/* Shallow Lagoon Shoreline Fringe */}
                {WORLD_LANDMASS_PATHS.map((land) => (
                  <path
                    key={`shelf_lagoon_${land.id}`}
                    d={land.d}
                    fill="none"
                    stroke="rgba(6, 182, 212, 0.32)"
                    strokeWidth={3 * nodeScale}
                    strokeLinejoin="round"
                  />
                ))}
              </g>

              {/* Day/Night Solar Terminator Twilight Shadow */}
              {showTerminator && (
                <g id="dayNightTerminator" pointerEvents="none">
                  <path
                    d={terminatorPath}
                    fill="rgba(1, 4, 14, 0.55)"
                    stroke="rgba(56, 189, 248, 0.3)"
                    strokeWidth={1.2 * nodeScale}
                    strokeDasharray="4 2"
                  />
                </g>
              )}

              {/* World Continents with Textured Earth Biome Gradients */}
              <g id="worldLandmasses">
                {WORLD_LANDMASS_PATHS.map((land) => (
                  <path
                    key={land.id}
                    d={land.d}
                    fill={`url(#${getLandmassGradientId(land.id)})`}
                    stroke="#1c3a22"
                    strokeWidth={1.1 * nodeScale}
                    className="transition-all duration-200 hover:brightness-110"
                    filter="drop-shadow(0 2px 6px rgba(0, 0, 0, 0.55))"
                  />
                ))}
              </g>

              {/* Topographic Elevation Contours & Mountain Walls */}
              {showTopography && (
                <g id="topography" pointerEvents="none">
                  {WORLD_TOPOGRAPHY_CONTOURS.map((topo) => (
                    <g key={topo.id}>
                      {/* Shadow underlay for high contrast against terrain */}
                      <path
                        d={topo.pathString}
                        fill="none"
                        stroke="rgba(0, 0, 0, 0.7)"
                        strokeWidth={2.6 * nodeScale}
                        strokeLinecap="round"
                      />
                      {/* Glowing golden alpine ridge */}
                      <path
                        d={topo.pathString}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth={1.3 * nodeScale}
                        strokeDasharray="4 2"
                        strokeLinecap="round"
                      />
                    </g>
                  ))}
                </g>
              )}

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
                          strokeWidth={1 * nodeScale}
                          strokeDasharray="4 2"
                          opacity="0.8"
                        />
                        <rect
                          x={zone.labelPosition.x - 28 * nodeScale}
                          y={zone.labelPosition.y - 7 * nodeScale}
                          width={56 * nodeScale}
                          height={14 * nodeScale}
                          rx={3 * nodeScale}
                          fill="rgba(15, 23, 42, 0.85)"
                          stroke={zone.threatLevel === 'severe' ? '#f43f5e' : '#f59e0b'}
                          strokeWidth={0.75 * nodeScale}
                        />
                        <text
                          x={zone.labelPosition.x}
                          y={zone.labelPosition.y + 2.5 * nodeScale}
                          fill={zone.threatLevel === 'severe' ? '#fca5a5' : '#fde68a'}
                          fontSize={7 * nodeScale}
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

              {/* Severe Storm & Cyclone Weather Hazards */}
              {showStorms && (
                <g id="stormHazards">
                  {STORM_HAZARD_ZONES.map((storm) => (
                    <g
                      key={storm.id}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredStorm(storm)}
                      onMouseLeave={() => setHoveredStorm(null)}
                    >
                      <circle
                        cx={storm.center.x}
                        cy={storm.center.y}
                        r={storm.radius}
                        fill="rgba(56, 189, 248, 0.06)"
                        stroke={storm.severity === 'severe' ? '#f43f5e' : '#38bdf8'}
                        strokeWidth={0.8 * nodeScale}
                        strokeDasharray="3 3"
                      />
                      <path
                        d={storm.spiralPath}
                        fill="none"
                        stroke={storm.severity === 'severe' ? '#f43f5e' : '#38bdf8'}
                        strokeWidth={1.2 * nodeScale}
                        opacity="0.8"
                      />
                      <text
                        x={storm.center.x}
                        y={storm.center.y + storm.radius + 9 * nodeScale}
                        fill={storm.severity === 'severe' ? '#fca5a5' : '#7dd3fc'}
                        fontSize={6.5 * nodeScale}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {storm.code}
                      </text>
                    </g>
                  ))}
                </g>
              )}

              {/* Active Cartel Patrol & Speedboat Infiltration Vectors */}
              {showCartelPatrols && (
                <g id="cartelPatrols">
                  {CARTEL_PATROL_VECTORS.map((patrol) => (
                    <g
                      key={patrol.id}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPatrol(patrol)}
                      onMouseLeave={() => setHoveredPatrol(null)}
                    >
                      <path
                        d={patrol.pathString}
                        fill="none"
                        stroke={patrol.color}
                        strokeWidth={2 * nodeScale}
                        strokeDasharray="6 4"
                        strokeOpacity="0.85"
                      />
                    </g>
                  ))}
                </g>
              )}

              {/* Active Syndicate Turf War Battlegrounds */}
              {showTurfWars && player.activeTurfWars && player.activeTurfWars.map((war) => {
                const pairs: Array<[string, string]> = [];
                for (let i = 0; i < war.contestedCityIds.length; i++) {
                  for (let j = i + 1; j < war.contestedCityIds.length; j++) {
                    pairs.push([war.contestedCityIds[i], war.contestedCityIds[j]]);
                  }
                }
                return (
                  <g key={war.id} id={`war_${war.id}`}>
                    {pairs.map(([c1, c2], idx) => {
                      const pathData = calculateGreatCirclePath(c1, c2);
                      if (!pathData.pathString) return null;
                      return (
                        <path
                          key={`war_line_${idx}`}
                          d={pathData.pathString}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth={1.8 * nodeScale}
                          strokeDasharray="4 3"
                          opacity="0.8"
                          className="animate-pulse"
                        />
                      );
                    })}
                  </g>
                );
              })}

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
                        strokeWidth={1 * nodeScale}
                        strokeDasharray="2 4"
                      />
                    );
                  })}
                </g>
              )}

              {/* Active Selected Great-Circle Route (Laser Glow) */}
              {selectedCorridor && (
                <g id="activeCorridor">
                  {/* High-contrast dark backing rim */}
                  <path
                    d={selectedCorridor.pathString}
                    fill="none"
                    stroke="#020617"
                    strokeWidth={5.5 * nodeScale}
                  />
                  {/* Outer laser glow */}
                  <path
                    d={selectedCorridor.pathString}
                    fill="none"
                    stroke="rgba(0, 240, 255, 0.45)"
                    strokeWidth={3.8 * nodeScale}
                    filter="url(#laserGlow)"
                  />
                  {/* Core laser beam */}
                  <path
                    d={selectedCorridor.pathString}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth={2 * nodeScale}
                    strokeDasharray="8 6"
                    className="animate-pulse"
                  />
                  {/* Center white hot beam */}
                  <path
                    d={selectedCorridor.pathString}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={0.8 * nodeScale}
                  />
                  {/* Midpoint Distance Pill */}
                  <g transform={`translate(${selectedCorridor.midPoint.x}, ${selectedCorridor.midPoint.y})`}>
                    <rect
                      x={-32 * nodeScale}
                      y={-9 * nodeScale}
                      width={64 * nodeScale}
                      height={16 * nodeScale}
                      rx={4 * nodeScale}
                      fill="#0f172a"
                      stroke="#38bdf8"
                      strokeWidth={1 * nodeScale}
                    />
                    <text
                      x="0"
                      y={2.5 * nodeScale}
                      fill="#bae6fd"
                      fontSize={8 * nodeScale}
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
                      <circle r={6 * nodeScale} fill="#06b6d4" fillOpacity="0.3" className="animate-ping" />
                      <circle r={4 * nodeScale} fill="#06b6d4" stroke="#ffffff" strokeWidth={1 * nodeScale} />
                      <text x={6 * nodeScale} y={3 * nodeScale} fill="#67e8f9" fontSize={7 * nodeScale} fontWeight="bold">
                        {courier.shipperName.split(' ')[0]} ({courier.units}u)
                      </text>
                    </g>
                  ))}
                </g>
              )}

              {/* 30 City Nodes with Dynamic Scaling */}
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
                  const warInCity = player.activeTurfWars?.find((w) => w.contestedCityIds.includes(city.id));

                  // Heat color ring
                  const heatColor =
                    warInCity
                      ? '#ef4444'
                      : heat >= 70
                      ? '#f43f5e'
                      : heat >= 30
                      ? '#f59e0b'
                      : '#10b981';

                  // Stash presence
                  const hasStash =
                    player.vaults?.[city.id] &&
                    Object.values(player.vaults[city.id]).some((v) => v > 0);

                  const rOuter = (isCurrent ? 6 : isSelected ? 5.5 : 4) * nodeScale;
                  const rInner = (isCurrent ? 3 : 1.8) * nodeScale;
                  const fontSize = (isCurrent || isSelected ? 8 : 6.5) * nodeScale;
                  const labelY = (isCurrent ? 13 : 11) * nodeScale;

                  return (
                    <g
                      key={city.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      className="cursor-pointer transition-transform duration-150"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCityId(city.id);
                      }}
                      onMouseEnter={() => setHoveredCityId(city.id)}
                      onMouseLeave={() => setHoveredCityId(null)}
                    >
                      {/* Active Turf War Crossfire Combat Ring */}
                      {showTurfWars && warInCity && (
                        <circle
                          r={14 * nodeScale}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth={1.5 * nodeScale}
                          strokeDasharray="2 2"
                          className="animate-spin"
                          style={{ animationDuration: '6s' }}
                        />
                      )}

                      {/* Current City Pulsing Beacon */}
                      {isCurrent && (
                        <circle
                          r={12 * nodeScale}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth={1.5 * nodeScale}
                          className="animate-ping"
                        />
                      )}

                      {/* Selected Reticle */}
                      {isSelected && (
                        <g>
                          <circle
                            r={10 * nodeScale}
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth={1.2 * nodeScale}
                            strokeDasharray="2 2"
                          />
                          <line
                            x1={-13 * nodeScale}
                            y1={0}
                            x2={-7 * nodeScale}
                            y2={0}
                            stroke="#38bdf8"
                            strokeWidth={1.2 * nodeScale}
                          />
                          <line
                            x1={7 * nodeScale}
                            y1={0}
                            x2={13 * nodeScale}
                            y2={0}
                            stroke="#38bdf8"
                            strokeWidth={1.2 * nodeScale}
                          />
                          <line
                            x1={0}
                            y1={-13 * nodeScale}
                            x2={0}
                            y2={-7 * nodeScale}
                            stroke="#38bdf8"
                            strokeWidth={1.2 * nodeScale}
                          />
                          <line
                            x1={0}
                            y1={7 * nodeScale}
                            x2={0}
                            y2={13 * nodeScale}
                            stroke="#38bdf8"
                            strokeWidth={1.2 * nodeScale}
                          />
                        </g>
                      )}

                      {/* Node Outer Heat Ring */}
                      <circle
                        r={rOuter}
                        fill={isCurrent ? '#10b981' : isSelected ? '#38bdf8' : '#0f172a'}
                        stroke={heatColor}
                        strokeWidth={(heat >= 70 || warInCity ? 2 : 1) * nodeScale}
                      />

                      {/* Inner Dot */}
                      <circle
                        r={rInner}
                        fill={isCurrent ? '#ffffff' : isSelected ? '#ffffff' : heatColor}
                      />

                      {/* Hotspot Icon Pip */}
                      {showHotspots && hotspot && (
                        <g transform={`translate(${5 * nodeScale}, ${-7 * nodeScale})`}>
                          <circle
                            r={3.5 * nodeScale}
                            fill={
                              hotspot.severity === 'danger'
                                ? '#e11d48'
                                : hotspot.severity === 'sanctuary'
                                ? '#eab308'
                                : '#38bdf8'
                            }
                            stroke="#0f172a"
                            strokeWidth={0.6 * nodeScale}
                          />
                        </g>
                      )}

                      {/* Vault Stash Pip */}
                      {showInfrastructure && hasStash && (
                        <g transform={`translate(${-7 * nodeScale}, ${-7 * nodeScale})`}>
                          <rect
                            x={-2.5 * nodeScale}
                            y={-2.5 * nodeScale}
                            width={5 * nodeScale}
                            height={5 * nodeScale}
                            rx={0.8 * nodeScale}
                            fill="#8b5cf6"
                            stroke="#0f172a"
                            strokeWidth={0.6 * nodeScale}
                          />
                        </g>
                      )}

                      {/* City IATA Label with High-Contrast Halo */}
                      <text
                        x="0"
                        y={labelY}
                        fill={
                          warInCity
                            ? '#fca5a5'
                            : isCurrent
                            ? '#34d399'
                            : isSelected
                            ? '#7dd3fc'
                            : isHovered
                            ? '#ffffff'
                            : '#cbd5e1'
                        }
                        fontSize={fontSize}
                        fontWeight={isCurrent || isSelected || warInCity ? 'bold' : '600'}
                        textAnchor="middle"
                        paintOrder="stroke"
                        stroke="#020617"
                        strokeWidth={2.8 * nodeScale}
                        strokeLinejoin="round"
                        className="select-none"
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
                  <line x1="-12" y1="0" x2="-2" y2="0" stroke="#38bdf8" strokeWidth={2.5 * nodeScale} opacity="0.8" />
                  <circle cx="-12" cy="0" r={3 * nodeScale} fill="#38bdf8" opacity="0.4" className="animate-ping" />
                  {/* Plane Silhouette */}
                  <path
                    d="M 6 0 L -3 -5 L -1 -1 L -6 -1 L -8 -3 L -8 3 L -6 1 L -1 1 L -3 5 Z"
                    fill="#38bdf8"
                    stroke="#ffffff"
                    strokeWidth={0.75 * nodeScale}
                  />
                </g>
              )}
            </svg>

            {/* Hovered Storm Tooltip Card */}
            {hoveredStorm && (
              <div
                className="absolute z-50 bg-slate-900/95 border border-sky-500 rounded-lg p-2.5 text-xs shadow-xl pointer-events-none font-mono"
                style={{
                  left: `${((hoveredStorm.center.x - clampedPanX) / visibleW) * 100}%`,
                  top: `${((hoveredStorm.center.y - clampedPanY) / visibleH) * 100}%`,
                  transform: 'translate(-50%, -120%)',
                }}
              >
                <div className="font-bold text-sky-300 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-sky-400" />
                  <span>{hoveredStorm.name} ({hoveredStorm.code})</span>
                </div>
                <div className="text-slate-300 text-[11px] mt-1 leading-tight">
                  {hoveredStorm.description}
                </div>
                <div className="text-[10px] text-amber-400 mt-0.5 uppercase font-bold">
                  Severity: {hoveredStorm.severity}
                </div>
              </div>
            )}

            {/* Hovered Cartel Patrol Vector Tooltip Card */}
            {hoveredPatrol && (
              <div className="absolute top-4 left-4 z-50 bg-slate-900/95 border border-emerald-500 rounded-lg p-2.5 text-xs shadow-xl pointer-events-none font-mono max-w-xs">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{hoveredPatrol.name}</span>
                </div>
                <div className="text-slate-400 text-[10px] mt-0.5">
                  Cartel: <strong className="text-slate-200">{hoveredPatrol.syndicateName}</strong> • Type: {hoveredPatrol.type}
                </div>
                <div className="text-slate-300 text-[11px] mt-1 leading-tight">
                  {hoveredPatrol.description}
                </div>
              </div>
            )}

            {/* Hovered Courier Tooltip Card */}
            {hoveredCourier && (
              <div
                className="absolute z-50 bg-slate-900/95 border border-cyan-500 rounded-lg p-2.5 text-xs shadow-xl pointer-events-none font-mono"
                style={{
                  left: `${((hoveredCourier.currentPosition.x - clampedPanX) / visibleW) * 100}%`,
                  top: `${((hoveredCourier.currentPosition.y - clampedPanY) / visibleH) * 100}%`,
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

              {/* Active Cartel Turf War Briefing */}
              {cityTurfWar && (
                <div className="p-3 rounded-xl bg-red-950/70 border border-red-600/80 text-xs space-y-1.5 animate-pulse">
                  <div className="font-black text-red-300 flex items-center gap-2 uppercase tracking-wide">
                    <Swords className="w-4 h-4 text-red-400" />
                    <span>{cityTurfWar.headline}</span>
                  </div>
                  <p className="text-slate-200 text-[11px] leading-relaxed">
                    {cityTurfWar.description}
                  </p>
                  <div className="flex items-center gap-2.5 pt-1 text-[10px] font-mono font-bold flex-wrap">
                    <span className="text-red-300">
                      PRICE SURGE: +{Math.round((cityTurfWar.priceSurgeMultiplier - 1) * 100)}%
                    </span>
                    <span>•</span>
                    <span className="text-amber-300">
                      CROSSFIRE RISK: +{Math.round(cityTurfWar.travelDangerBonus * 100)}%
                    </span>
                    <span>•</span>
                    <span className="text-slate-400">{cityTurfWar.daysRemaining}d remaining</span>
                  </div>
                </div>
              )}

              {/* Active Global Macro Shocks */}
              {cityMacroEvents.map((shock) => (
                <div
                  key={shock.id}
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    shock.severity === 'danger'
                      ? 'bg-rose-950/60 border-rose-700 text-rose-200'
                      : 'bg-amber-950/60 border-amber-700 text-amber-200'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 uppercase text-[11px]">
                    <span className="text-sm">{shock.icon}</span>
                    <span>{shock.title}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">{shock.headline}</p>
                  <div className="text-[10px] font-bold pt-1 opacity-80 flex items-center justify-between">
                    <span>Duration: {shock.daysRemaining}d remaining</span>
                    {shock.priceMultiplier && (
                      <span className="text-amber-300 font-mono">
                        Price Mod: {shock.priceMultiplier}x
                      </span>
                    )}
                  </div>
                </div>
              ))}

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
