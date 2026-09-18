import React, { useState, useMemo, useEffect, useRef } from 'react';
import L from 'leaflet';
import { useGameStore } from '../store/gameStore';
import { CITIES } from '../engine/constants';
import { AIRPORT_REGISTRY } from '../engine/flightNetwork';
import { AIRCRAFT_MAP, calculateAircraftFlightCost } from '../engine/aviation';
import { getCityHeat, getInventoryTotalUnits } from '../engine/game';
import {
  calculateHaversineDistanceNm,
  DEA_BLOCKADE_ZONES,
  evaluateCityHotspots,
  calculateCourierBlips,
  ASEAN_WATERWAYS,
  generateGeodesicArcPoints,
  getGeodesicPointAt,
  wrapLongitudeToCenter,
} from '../engine/smugglingMapData';
import {
  GeopoliticalHotspot,
  FlightAnimationState,
} from '../engine/smugglingMapTypes';
import { soundEngine } from '../utils/audio';
import {
  Plane,
  Shield,
  AlertTriangle,
  Flame,
  Radio,
  Building,
  Beaker,
  FastForward,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Swords,
  Compass,
  Sparkles,
} from 'lucide-react';

const REGIONS = ['All', 'Americas', 'Europe', 'Asia-Pacific', 'Middle East & Africa'] as const;
type RegionFilter = (typeof REGIONS)[number];

export type MapTileStyle = 'satellite' | 'street' | 'dark_canvas';

const REGION_CENTERS: Record<RegionFilter, { lat: number; lng: number; zoom: number }> = {
  All: { lat: 20, lng: 10, zoom: 2 },
  Americas: { lat: 15, lng: -75, zoom: 3 },
  Europe: { lat: 50, lng: 10, zoom: 4 },
  'Asia-Pacific': { lat: 10, lng: 110, zoom: 4 },
  'Middle East & Africa': { lat: 15, lng: 35, zoom: 3 },
};

const TILE_CONFIGS: Record<MapTileStyle, { name: string; url: string; attribution: string }> = {
  satellite: {
    name: 'Esri Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &copy; Earthstar Geographics',
  },
  street: {
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  dark_canvas: {
    name: 'Tactical Radar',
    url: '',
    attribution: 'Tactical Vector Canvas Grid',
  },
};

/**
 * Creates an offline-resilient tactical radar grid layer using native HTML5 Canvas
 * with high-contrast tactical grid lines, concentric radar rings, luminous crosshairs,
 * and high-DPI Retina display scaling.
 */
function createDarkCanvasGridLayer(): L.GridLayer {
  const DarkCanvasGrid = L.GridLayer.extend({
    options: {
      minZoom: 1,
      maxZoom: 19,
      tileSize: 256,
      pane: 'tilePane',
      className: 'tactical-radar-canvas-layer',
    },
    createTile: function (coords: L.Coords, done?: (error: Error | null, tile: HTMLElement) => void) {
      const tile = document.createElement('canvas');
      const size = this.getTileSize();
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      tile.width = size.x * dpr;
      tile.height = size.y * dpr;
      tile.style.width = `${size.x}px`;
      tile.style.height = `${size.y}px`;

      const ctx = tile.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        const w = size.x;
        const h = size.y;

        // 1. Radar background: Deep tactical midnight navy
        ctx.fillStyle = '#050a16';
        ctx.fillRect(0, 0, w, h);

        // 2. Fine subgrid lines (64px intervals)
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.12)';
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        for (let x = 64; x < w; x += 64) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
        }
        for (let y = 64; y < h; y += 64) {
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
        }
        ctx.stroke();

        // 3. Tile boundary borders (Tactical major grid line)
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, w, h);

        // 4. Circular radar range rings centered on tile
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 48, 0, Math.PI * 2);
        ctx.arc(w / 2, h / 2, 96, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 5. High-contrast center tactical crosshair with reticle ring
        const cx = w / 2;
        const cy = h / 2;

        // Subtle glow halo
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 16, cy); ctx.lineTo(cx + 16, cy);
        ctx.moveTo(cx, cy - 16); ctx.lineTo(cx, cy + 16);
        ctx.stroke();

        // Sharp core crosshair with center reticle ring
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 16, cy); ctx.lineTo(cx - 4, cy);
        ctx.moveTo(cx + 4, cy); ctx.lineTo(cx + 16, cy);
        ctx.moveTo(cx, cy - 16); ctx.lineTo(cx, cy - 4);
        ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy + 16);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.stroke();

        // 6. Corner reticle markers at tile corners
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.45)';
        ctx.lineWidth = 1.2;
        const cornerLen = 10;
        ctx.beginPath();
        // Top-left
        ctx.moveTo(0, cornerLen); ctx.lineTo(0, 0); ctx.lineTo(cornerLen, 0);
        // Top-right
        ctx.moveTo(w - cornerLen, 0); ctx.lineTo(w, 0); ctx.lineTo(w, cornerLen);
        // Bottom-left
        ctx.moveTo(0, h - cornerLen); ctx.lineTo(0, h); ctx.lineTo(cornerLen, h);
        // Bottom-right
        ctx.moveTo(w - cornerLen, h); ctx.lineTo(w, h); ctx.lineTo(w, h - cornerLen);
        ctx.stroke();

        // 7. Tactical sector & coordinates watermark
        ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`SEC [Z${coords.z}:${coords.x},${coords.y}]`, 8, 8);

        ctx.fillStyle = 'rgba(14, 165, 233, 0.45)';
        ctx.font = '8px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`TACTICAL RADAR // VECTOR 2D`, w - 8, h - 8);
      }

      if (done) {
        setTimeout(() => done(null, tile), 0);
      }
      return tile;
    },
  });

  return new (DarkCanvasGrid as any)({
    minZoom: 1,
    maxZoom: 19,
    tileSize: 256,
    pane: 'tilePane',
  });
}

export const SmugglingMap: React.FC = () => {
  const {
    player,
    travel,
    openFlightBoard,
  } = useGameStore();

  const [selectedCityId, setSelectedCityId] = useState<string>(
    player.currentCityId === 'miami' ? 'bogota' : 'miami'
  );
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>('All');
  const [tileStyle, setTileStyle] = useState<MapTileStyle>('satellite');

  // Layer Toggles
  const [showDirectCorridors, setShowDirectCorridors] = useState(true);
  const [showWaterways, setShowWaterways] = useState(true);
  const [showBlockades, setShowBlockades] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showCouriers, setShowCouriers] = useState(true);

  // Flight Animation State
  const [flightAnim, setFlightAnim] = useState<FlightAnimationState | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Leaflet references
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.Layer | null>(null);
  const cityMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const routesGroupRef = useRef<L.LayerGroup | null>(null);
  const waterwaysGroupRef = useRef<L.LayerGroup | null>(null);
  const blockadesGroupRef = useRef<L.LayerGroup | null>(null);
  const couriersGroupRef = useRef<L.LayerGroup | null>(null);
  const animatedFlightMarkerRef = useRef<L.Marker | null>(null);
  const [worldShift, setWorldShift] = useState(0);
  const cityMarkersMapRef = useRef<Map<string, { marker: L.Marker; baseLat: number; baseLng: number }>>(new Map());

  const reprojectMarkers = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const centerLng = map.getCenter().lng;

    cityMarkersMapRef.current.forEach(({ marker, baseLat, baseLng }) => {
      const targetLng = wrapLongitudeToCenter(baseLng, centerLng);
      const currentPos = marker.getLatLng();
      if (Math.abs(currentPos.lng - targetLng) > 0.0001 || Math.abs(currentPos.lat - baseLat) > 0.0001) {
        marker.setLatLng([baseLat, targetLng]);
      }
    });

    const newShift = Math.round(centerLng / 360) * 360;
    setWorldShift((prev) => (prev !== newShift ? newShift : prev));
  };

  const currentCity = CITIES.find((c) => c.id === player.currentCityId);
  const targetCity = CITIES.find((c) => c.id === selectedCityId) || currentCity;
  const originAirport = AIRPORT_REGISTRY[player.currentCityId];
  const targetAirport = AIRPORT_REGISTRY[selectedCityId];

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

  const hotspots = useMemo(() => evaluateCityHotspots(player, player.currentDay), [player]);
  const hotspotMap = useMemo(() => {
    const map = new Map<string, GeopoliticalHotspot>();
    for (const h of hotspots) {
      map.set(h.cityId, h);
    }
    return map;
  }, [hotspots]);

  const activeCouriers = useMemo(() => calculateCourierBlips(player), [player]);

  const applyTileLayer = (map: L.Map, style: MapTileStyle) => {
    if (tileLayerRef.current) {
      try {
        map.removeLayer(tileLayerRef.current);
      } catch {
        // Safe layer cleanup
      }
      tileLayerRef.current = null;
    }

    if (style === 'dark_canvas') {
      const canvasLayer = createDarkCanvasGridLayer();
      canvasLayer.addTo(map);
      tileLayerRef.current = canvasLayer;
      (canvasLayer as any).redraw();
      map.invalidateSize({ pan: false });
      return;
    }

    const cfg = TILE_CONFIGS[style] || TILE_CONFIGS.satellite;
    const tile = L.tileLayer(cfg.url, {
      maxZoom: 19,
      attribution: cfg.attribution,
    }).addTo(map);
    tileLayerRef.current = tile;
    map.invalidateSize({ pan: false });
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20, 10],
      zoom: 2,
      minZoom: 2,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: false,
    });

    applyTileLayer(map, tileStyle);

    cityMarkersGroupRef.current = L.layerGroup().addTo(map);
    routesGroupRef.current = L.layerGroup().addTo(map);
    waterwaysGroupRef.current = L.layerGroup().addTo(map);
    blockadesGroupRef.current = L.layerGroup().addTo(map);
    couriersGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Immediate & deferred invalidateSize calls to lock in container geometry
    map.invalidateSize({ pan: false });
    const animId = requestAnimationFrame(() => {
      map.invalidateSize({ pan: false });
      reprojectMarkers();
    });
    const timerId = setTimeout(() => {
      map.invalidateSize({ pan: false });
      reprojectMarkers();
    }, 150);

    // Event bindings: re-project markers to visible world coordinates during drag, move, and zoom
    map.on('move', reprojectMarkers);
    map.on('drag', reprojectMarkers);
    map.on('zoom', reprojectMarkers);
    map.on('viewreset', reprojectMarkers);
    map.on('moveend', reprojectMarkers);
    map.on('zoomend', reprojectMarkers);
    map.on('resize', reprojectMarkers);

    // Responsive container ResizeObserver to trigger invalidateSize
    const container = mapContainerRef.current;
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize({ pan: false });
          reprojectMarkers();
        }
      });
      resizeObserver.observe(container);
    }

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(timerId);
      if (resizeObserver && container) {
        resizeObserver.unobserve(container);
        resizeObserver.disconnect();
      }
      map.off('move', reprojectMarkers);
      map.off('drag', reprojectMarkers);
      map.off('zoom', reprojectMarkers);
      map.off('viewreset', reprojectMarkers);
      map.off('moveend', reprojectMarkers);
      map.off('zoomend', reprojectMarkers);
      map.off('resize', reprojectMarkers);

      if (tileLayerRef.current && mapInstanceRef.current) {
        try {
          mapInstanceRef.current.removeLayer(tileLayerRef.current);
        } catch {
          // ignore
        }
        tileLayerRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Style
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    applyTileLayer(mapInstanceRef.current, tileStyle);
  }, [tileStyle]);

  // Update Region Center / Pan
  const handleSelectRegion = (region: RegionFilter) => {
    setSelectedRegion(region);
    soundEngine.play('click');
    const center = REGION_CENTERS[region];
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([center.lat, center.lng], center.zoom, {
        duration: 1.2,
      });
      mapInstanceRef.current.invalidateSize({ pan: false });
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetView = () => {
    handleSelectRegion('All');
  };

  // Render City Markers
  useEffect(() => {
    if (!cityMarkersGroupRef.current || !mapInstanceRef.current) return;
    cityMarkersGroupRef.current.clearLayers();
    cityMarkersMapRef.current.clear();

    const map = mapInstanceRef.current;
    const centerLng = map ? map.getCenter().lng : 0;

    for (const city of CITIES) {
      const airport = AIRPORT_REGISTRY[city.id];
      if (!airport) continue;

      const isCurrent = city.id === player.currentCityId;
      const isSelected = city.id === selectedCityId;
      const cityHeat = getCityHeat(player, city.id);
      const hotspot = hotspotMap.get(city.id);

      // Create Custom DivIcon
      let markerHtml = '';
      if (isCurrent) {
        markerHtml = `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
            <span class="absolute w-8 h-8 rounded-full bg-emerald-500/30 animate-ping"></span>
            <span class="absolute w-5 h-5 rounded-full bg-emerald-500/50 border border-emerald-400"></span>
            <span class="relative w-2.5 h-2.5 rounded-full bg-emerald-300 shadow-md"></span>
            <span class="absolute top-4 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-950/90 text-emerald-300 border border-emerald-500 font-mono text-[10px] font-black whitespace-nowrap shadow-lg">
              BASE: ${city.name}
            </span>
          </div>
        `;
      } else if (isSelected) {
        markerHtml = `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
            <span class="absolute w-8 h-8 rounded-full bg-cyan-500/30 animate-pulse"></span>
            <span class="absolute w-4 h-4 rounded-full border-2 border-cyan-400 border-dashed animate-spin"></span>
            <span class="relative w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-md"></span>
            <span class="absolute top-4 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-cyan-950/95 text-cyan-300 border border-cyan-400 font-mono text-[10px] font-black whitespace-nowrap shadow-lg">
              TARGET: ${city.name}
            </span>
          </div>
        `;
      } else {
        const dotColor =
          hotspot?.severity === 'danger'
            ? 'bg-rose-500 ring-rose-400'
            : cityHeat >= 50
            ? 'bg-amber-500 ring-amber-400'
            : 'bg-sky-400 ring-sky-300';

        markerHtml = `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group hover:scale-125 transition-transform">
            <span class="w-2.5 h-2.5 rounded-full ${dotColor} ring-2 ring-slate-950 shadow-md"></span>
            <span class="hidden group-hover:block absolute top-3 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-950/90 text-slate-200 border border-slate-700 font-mono text-[9px] font-bold whitespace-nowrap shadow-lg z-50">
              ${city.name} (${airport.iata})
            </span>
          </div>
        `;
      }

      const icon = L.divIcon({
        className: 'tactical-city-icon',
        html: markerHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const initialLng = wrapLongitudeToCenter(airport.coordinates.lng, centerLng);
      const marker = L.marker([airport.coordinates.lat, initialLng], { icon });

      marker.on('click', () => {
        soundEngine.play('click');
        setSelectedCityId(city.id);
      });

      cityMarkersGroupRef.current.addLayer(marker);
      cityMarkersMapRef.current.set(city.id, {
        marker,
        baseLat: airport.coordinates.lat,
        baseLng: airport.coordinates.lng,
      });
    }
  }, [player.currentCityId, selectedCityId, hotspotMap, player.cityHeat]);

  // Render Flight Corridors & Active Route
  useEffect(() => {
    if (!routesGroupRef.current || !originAirport || !mapInstanceRef.current) return;
    routesGroupRef.current.clearLayers();

    const centerLng = mapInstanceRef.current.getCenter().lng;
    const origWrappedLng = wrapLongitudeToCenter(originAirport.coordinates.lng, centerLng);

    // 1. Direct connections from current base
    if (showDirectCorridors && originAirport.directDestinations) {
      for (const destId of originAirport.directDestinations) {
        const destAirport = AIRPORT_REGISTRY[destId];
        if (!destAirport || destId === selectedCityId) continue;

        const destWrappedLng = wrapLongitudeToCenter(destAirport.coordinates.lng, origWrappedLng);

        const arcPoints = generateGeodesicArcPoints(
          originAirport.coordinates.lat,
          origWrappedLng,
          destAirport.coordinates.lat,
          destWrappedLng,
          35
        );

        const poly = L.polyline(arcPoints, {
          color: '#0284c7',
          weight: 1.5,
          opacity: 0.35,
          dashArray: '4, 6',
        });

        routesGroupRef.current.addLayer(poly);
      }
    }

    // 2. High-priority selected corridor
    if (selectedCityId && selectedCityId !== player.currentCityId && targetAirport) {
      const destWrappedLng = wrapLongitudeToCenter(targetAirport.coordinates.lng, origWrappedLng);

      const selectedArcPoints = generateGeodesicArcPoints(
        originAirport.coordinates.lat,
        origWrappedLng,
        targetAirport.coordinates.lat,
        destWrappedLng,
        50
      );

      // Glow layer
      const glowPoly = L.polyline(selectedArcPoints, {
        color: '#06b6d4',
        weight: 6,
        opacity: 0.3,
      });

      // Sharp central route line
      const routePoly = L.polyline(selectedArcPoints, {
        color: '#22d3ee',
        weight: 2.5,
        opacity: 0.95,
        dashArray: '8, 4',
      });

      routesGroupRef.current.addLayer(glowPoly);
      routesGroupRef.current.addLayer(routePoly);
    }
  }, [originAirport, targetAirport, selectedCityId, showDirectCorridors, player.currentCityId, worldShift]);

  // Render ASEAN Waterways & Maritime Smuggling Corridors
  useEffect(() => {
    if (!waterwaysGroupRef.current || !mapInstanceRef.current) return;
    waterwaysGroupRef.current.clearLayers();

    if (!showWaterways) return;

    for (const waterway of ASEAN_WATERWAYS) {
      const shiftedCoords = waterway.coordinates.map(
        ([lat, lng]) => [lat, lng + worldShift] as [number, number]
      );

      const poly = L.polyline(shiftedCoords, {
        color: waterway.color,
        weight: 3.5,
        opacity: 0.85,
        dashArray: '6, 5',
      });

      poly.bindTooltip(
        `<div class="font-mono text-xs text-slate-100">
          <strong class="text-cyan-400 block">${waterway.name}</strong>
          <span class="text-slate-400 text-[10px] block mt-0.5">${waterway.description}</span>
        </div>`,
        { sticky: true, className: 'waterway-tooltip' }
      );

      waterwaysGroupRef.current.addLayer(poly);
    }
  }, [showWaterways, worldShift]);

  // Render DEA Blockade Zones
  useEffect(() => {
    if (!blockadesGroupRef.current || !mapInstanceRef.current) return;
    blockadesGroupRef.current.clearLayers();

    if (!showBlockades) return;

    // Approximate real-world geographic bounding polygons for DEA naval cordons
    const BLOCKADE_COORDS: Record<string, [number, number][]> = {
      caribbean_basin: [
        [24.5, -84.0],
        [22.0, -74.0],
        [12.0, -68.0],
        [10.0, -82.0],
        [18.0, -88.0],
      ],
      eastern_pacific: [
        [20.0, -110.0],
        [28.0, -118.0],
        [10.0, -100.0],
        [4.0, -85.0],
        [12.0, -92.0],
      ],
      strait_of_gibraltar: [
        [37.5, -9.0],
        [37.5, 0.0],
        [34.5, 0.0],
        [34.5, -9.0],
      ],
      malacca_strait: [
        [6.5, 98.0],
        [6.5, 102.5],
        [0.5, 105.0],
        [0.5, 101.0],
      ],
    };

    for (const zone of DEA_BLOCKADE_ZONES) {
      const coords = BLOCKADE_COORDS[zone.id];
      if (!coords) continue;

      const shiftedCoords = coords.map(
        ([lat, lng]) => [lat, lng + worldShift] as [number, number]
      );

      const polygon = L.polygon(shiftedCoords, {
        color: '#f43f5e',
        fillColor: '#f43f5e',
        fillOpacity: 0.15,
        weight: 1.5,
        dashArray: '5, 5',
      });

      polygon.bindTooltip(
        `<div class="font-mono text-xs text-rose-300">
          <strong>${zone.name}</strong>
          <span class="block text-[10px] text-slate-400 mt-0.5">${zone.description}</span>
        </div>`,
        { sticky: true }
      );

      blockadesGroupRef.current.addLayer(polygon);
    }
  }, [showBlockades, worldShift]);

  // Render Active Courier Blips
  useEffect(() => {
    if (!couriersGroupRef.current || !mapInstanceRef.current) return;
    couriersGroupRef.current.clearLayers();

    if (!showCouriers) return;

    const centerLng = mapInstanceRef.current.getCenter().lng;

    for (const courier of activeCouriers) {
      const orig = AIRPORT_REGISTRY[courier.originCityId];
      const dest = AIRPORT_REGISTRY[courier.targetCityId];
      if (!orig || !dest) continue;

      const origWrappedLng = wrapLongitudeToCenter(orig.coordinates.lng, centerLng);
      const destWrappedLng = wrapLongitudeToCenter(dest.coordinates.lng, origWrappedLng);

      const pt = getGeodesicPointAt(
        orig.coordinates.lat,
        origWrappedLng,
        dest.coordinates.lat,
        destWrappedLng,
        courier.progressPercent / 100
      );

      const courierIcon = L.divIcon({
        className: 'courier-blip',
        html: `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer">
            <span class="absolute w-4 h-4 rounded-full bg-amber-400/40 animate-ping"></span>
            <span class="w-3 h-3 rounded-full bg-amber-400 border border-slate-900 shadow"></span>
            <span class="absolute -top-4 left-1/2 -translate-x-1/2 px-1 py-0.5 rounded bg-slate-950 text-amber-300 text-[9px] font-mono font-bold whitespace-nowrap border border-amber-500/50">
              📦 ${courier.drugName} (${courier.units}u)
            </span>
          </div>
        `,
        iconSize: [20, 20],
      });

      const marker = L.marker([pt.lat, pt.lng], { icon: courierIcon });
      couriersGroupRef.current.addLayer(marker);
    }
  }, [activeCouriers, showCouriers, worldShift]);

  // Handle Flight Execution with Animation
  const startFlight = (useJet: boolean) => {
    if (!targetCity || selectedCityId === player.currentCityId) return;
    if (useJet && player.cash < aircraftFuelCost) return;
    if (!useJet && player.cash < targetCity.flightCost) return;

    soundEngine.play('travel');

    const totalDurationMs = 2000;
    const startTime = performance.now();
    const distanceNm = targetAirport && originAirport
      ? calculateHaversineDistanceNm(originAirport.coordinates, targetAirport.coordinates)
      : 1500;

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
      currentPosition: { x: 0, y: 0 },
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

    // Set up plane marker for flight
    const planeIcon = L.divIcon({
      className: 'flight-anim-plane',
      html: `
        <div id="flight-anim-plane-icon" class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-transform duration-75">
          <span class="absolute w-8 h-8 rounded-full bg-cyan-400/40 animate-ping"></span>
          <div class="w-7 h-7 rounded-full bg-cyan-500 border border-slate-900 shadow-xl flex items-center justify-center text-slate-950 font-black text-sm">
            ✈️
          </div>
        </div>
      `,
      iconSize: [28, 28],
    });

    const centerLng = mapInstanceRef.current?.getCenter().lng ?? 0;
    const origWrappedLng = wrapLongitudeToCenter(originAirport.coordinates.lng, centerLng);

    if (mapInstanceRef.current && originAirport) {
      if (animatedFlightMarkerRef.current) {
        mapInstanceRef.current.removeLayer(animatedFlightMarkerRef.current);
      }
      animatedFlightMarkerRef.current = L.marker(
        [originAirport.coordinates.lat, origWrappedLng],
        { icon: planeIcon }
      ).addTo(mapInstanceRef.current);
    }

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / totalDurationMs);

      let currentHeading = 90;
      if (originAirport && targetAirport && animatedFlightMarkerRef.current) {
        const curCenterLng = mapInstanceRef.current?.getCenter().lng ?? 0;
        const curOrigLng = wrapLongitudeToCenter(originAirport.coordinates.lng, curCenterLng);
        const curDestLng = wrapLongitudeToCenter(targetAirport.coordinates.lng, curOrigLng);

        const pt = getGeodesicPointAt(
          originAirport.coordinates.lat,
          curOrigLng,
          targetAirport.coordinates.lat,
          curDestLng,
          progress
        );
        animatedFlightMarkerRef.current.setLatLng([pt.lat, pt.lng]);
        currentHeading = Math.round(pt.headingDeg);

        const planeEl = document.getElementById('flight-anim-plane-icon');
        if (planeEl) {
          planeEl.style.transform = `rotate(${pt.headingDeg - 45}deg)`;
        }
      }

      setFlightAnim((prev) =>
        prev
          ? {
              ...prev,
              progress,
              elapsedMs: elapsed,
              headingDegrees: currentHeading,
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

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Landed!
        if (animatedFlightMarkerRef.current && mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(animatedFlightMarkerRef.current);
          animatedFlightMarkerRef.current = null;
        }
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
    if (animatedFlightMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(animatedFlightMarkerRef.current);
      animatedFlightMarkerRef.current = null;
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
      if (animatedFlightMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(animatedFlightMarkerRef.current);
      }
    };
  }, []);

  const activeHotspot = targetCity ? hotspotMap.get(targetCity.id) : null;
  const isTargetDirect = originAirport?.directDestinations?.includes(selectedCityId);

  const cityTurfWar = targetCity
    ? player.activeTurfWars?.find((w) => w.contestedCityIds.includes(targetCity.id))
    : null;

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
                Cartel Geopolitical Smuggling Radar & Open-Source Global Grid
              </h2>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                LEAFLET TACTICAL ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>
                BASE: <strong className="text-sky-400">{currentCity?.name} ({originAirport?.iata})</strong>
              </span>
              <span>•</span>
              <span>HEAT: <strong className={originHeat >= 70 ? 'text-red-400' : originHeat >= 30 ? 'text-amber-400' : 'text-emerald-400'}>{originHeat}%</strong></span>
              <span>•</span>
              <span>TOTAL WORLD HUBS: <strong className="text-cyan-400">{CITIES.length} Cities</strong></span>
            </p>
          </div>
        </div>

        {/* Global Controls & Raster Layer Selector */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Tile Style Picker */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
            {(['satellite', 'street', 'dark_canvas'] as MapTileStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => {
                  setTileStyle(style);
                  soundEngine.play('click');
                }}
                className={`px-2.5 py-1 rounded font-bold transition-all text-[11px] ${
                  tileStyle === style
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {TILE_CONFIGS[style].name}
              </button>
            ))}
          </div>

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
            <span>Routes</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200">
            <input
              type="checkbox"
              checked={showWaterways}
              onChange={(e) => setShowWaterways(e.target.checked)}
              className="rounded accent-cyan-500 cursor-pointer"
            />
            <span>ASEAN Waterways</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200">
            <input
              type="checkbox"
              checked={showBlockades}
              onChange={(e) => setShowBlockades(e.target.checked)}
              className="rounded accent-rose-500 cursor-pointer"
            />
            <span>DEA Cordon</span>
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
              className="rounded accent-amber-500 cursor-pointer"
            />
            <span>Couriers</span>
          </label>
        </div>
      </div>

      {/* Main Grid: Interactive Leaflet Map + Briefing Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Leaflet Map Stage */}
        <div className="lg:col-span-8 relative h-[360px] sm:h-[460px] lg:h-[580px] xl:h-[640px] bg-slate-950 overflow-hidden select-none border-b lg:border-b-0 lg:border-r border-slate-800">
          {/* Leaflet Container */}
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Interactive Zoom & Reset HUD Controls */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-700/80 backdrop-blur-md shadow-2xl">
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-cyan-400 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-cyan-400 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetView}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-cyan-400 transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Flight Animation HUD Overlay */}
          {flightAnim && (
            <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex flex-col justify-between p-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-xl animate-pulse">
                    ✈️
                  </div>
                  <div>
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider">
                      IN FLIGHT TELEMETRY • {flightAnim.callsign}
                    </div>
                    <div className="text-lg font-black text-slate-100">
                      {flightAnim.aircraftName}
                    </div>
                  </div>
                </div>

                <button
                  onClick={skipFlightAnimation}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-600 transition-colors"
                >
                  <FastForward className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Skip Telemetry</span>
                </button>
              </div>

              {/* Progress Bar & Mid-Flight Stats */}
              <div className="space-y-4 max-w-xl mx-auto w-full text-center">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                  <span className="text-emerald-400">{currentCity?.name} ({originAirport?.iata})</span>
                  <span className="text-cyan-400 font-black">{Math.round(flightAnim.progress * 100)}% EN ROUTE</span>
                  <span className="text-cyan-400">{targetCity?.name} ({targetAirport?.iata})</span>
                </div>

                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-sky-400 rounded-full transition-all duration-75 shadow-lg shadow-cyan-500/50"
                    style={{ width: `${flightAnim.progress * 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-4 gap-2 pt-2 text-xs">
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Altitude</span>
                    <strong className="text-slate-100 text-sm">{flightAnim.altitudeFt.toLocaleString()} FT</strong>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Speed</span>
                    <strong className="text-slate-100 text-sm">{flightAnim.speedKts} KTS</strong>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Mach</span>
                    <strong className="text-cyan-400 text-sm">M {flightAnim.mach}</strong>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Distance</span>
                    <strong className="text-slate-100 text-sm">{flightAnim.distanceNm.toLocaleString()} NM</strong>
                  </div>
                </div>

                {flightAnim.isCustomsBypassed && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-xs font-bold">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Airport Tarmac Baggage Handler Bypass Active</span>
                  </div>
                )}
              </div>

              <div className="text-center text-[11px] text-slate-500">
                Approaching terminal airspace at {targetCity?.name} • Preparing final landing approach
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Tactical Target Briefing & Actions */}
        <div className="lg:col-span-4 p-4 sm:p-5 flex flex-col justify-between space-y-4 bg-slate-900/50 overflow-y-auto max-h-[500px] lg:max-h-[580px] xl:max-h-[640px]">
          {targetCity ? (
            <div className="space-y-4">
              {/* Target City Header */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-100">{targetCity.name}</h3>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                      {targetAirport?.iata}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{targetCity.country} • {targetCity.region}</div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase">Commercial Fare</div>
                  <div className="text-base font-black text-emerald-400">
                    ${targetCity.flightCost.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Specialty & Description */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
                {targetCity.specialty && (
                  <div className="text-amber-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{targetCity.specialty}</span>
                  </div>
                )}
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {targetCity.description}
                </p>
              </div>

              {/* Tactical Status Badges */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Police Heat</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Flame className="w-3.5 h-3.5 text-red-400" />
                    <strong className={targetHeat >= 70 ? 'text-red-400' : targetHeat >= 30 ? 'text-amber-400' : 'text-emerald-400'}>
                      {targetHeat}% Heat
                    </strong>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Route Status</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    <strong className={isTargetDirect ? 'text-cyan-400' : 'text-amber-400'}>
                      {isTargetDirect ? 'Direct Flight' : 'Connecting Hub'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Geopolitical Hotspot Alert */}
              {activeHotspot && (
                <div className="bg-slate-950/90 p-2.5 rounded-xl border border-amber-500/40 flex items-start gap-2 text-xs text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      <span>{activeHotspot.title}</span>
                      <span className="px-1 py-0.2 rounded bg-amber-950 text-amber-300 text-[9px] font-black border border-amber-700">
                        {activeHotspot.badgeLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {activeHotspot.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Active Turf War Warning */}
              {cityTurfWar && (
                <div className="bg-rose-950/30 p-2.5 rounded-xl border border-rose-600/50 flex items-start gap-2 text-xs text-rose-200">
                  <Swords className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-rose-300">
                      {cityTurfWar.headline}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {cityTurfWar.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Local Drug Price Modifiers */}
              {targetCity.drugModifiers && Object.keys(targetCity.drugModifiers).length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] text-slate-400 font-bold uppercase">Regional Market Modifiers:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(targetCity.drugModifiers).map(([drug, mod]) => {
                      const percent = Math.round((mod - 1) * 100);
                      const isHigh = percent > 0;
                      return (
                        <span
                          key={drug}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isHigh
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                              : 'bg-rose-950/80 text-rose-300 border-rose-700'
                          }`}
                        >
                          {drug.toUpperCase()}: {isHigh ? `+${percent}%` : `${percent}%`}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Local Owned Infrastructure */}
              {(cityOwnedProperties.length > 0 || cityLabs.length > 0) && (
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-xs space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Local Syndicate Assets:</div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {cityOwnedProperties.length > 0 && (
                      <span className="text-amber-300 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5" /> {cityOwnedProperties.length} Safehouse(s)
                      </span>
                    )}
                    {cityLabs.length > 0 && (
                      <span className="text-cyan-300 flex items-center gap-1">
                        <Beaker className="w-3.5 h-3.5" /> {cityLabs.length} Clandestine Lab(s)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select any city on the tactical radar to inspect flight schedules and market conditions.
            </div>
          )}

          {/* Action Departure Buttons */}
          <div className="space-y-2 pt-3 border-t border-slate-800">
            {targetCity && targetCity.id !== player.currentCityId ? (
              <>
                {activeAircraft && (
                  <button
                    onClick={() => startFlight(true)}
                    disabled={player.cash < aircraftFuelCost}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>🚀 Dispatch {activeAircraft.name.split(' ')[0]}</span>
                    <span>({aircraftFuelCost === 0 ? 'Free Fuel' : `$${aircraftFuelCost.toLocaleString()}`})</span>
                  </button>
                )}

                <button
                  onClick={() => startFlight(false)}
                  disabled={player.cash < targetCity.flightCost}
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Plane className="w-3.5 h-3.5" />
                  <span>Depart on Commercial Coach (${targetCity.flightCost.toLocaleString()})</span>
                </button>
              </>
            ) : (
              <div className="text-center py-2 text-xs font-bold text-slate-400 bg-slate-950 p-2 rounded-xl border border-slate-800">
                📍 You are currently stationed in {targetCity?.name}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
