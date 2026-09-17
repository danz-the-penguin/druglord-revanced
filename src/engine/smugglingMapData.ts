import {
  MapPoint,
  GeoCoordinates,
  BlockadeZone,
  GeopoliticalHotspot,
  ActiveCourierBlip,
} from './smugglingMapTypes';
import { AIRPORT_REGISTRY } from './flightNetwork';
import { CITIES, DRUG_MAP, SHIPPER_MAP } from './constants';
import { PlayerState } from './types';
import { SOVEREIGN_SANCTUARIES } from './corruption';

export const MAP_VIEWBOX = {
  width: 1000,
  height: 500,
};

/**
 * Converts real-world latitude and longitude to equirectangular SVG coordinates.
 * Lng: [-180, 180] -> X: [0, 1000]
 * Lat: [80, -60]   -> Y: [0, 500]
 */
export function projectCoordinates(lat: number, lng: number): MapPoint {
  const x = ((lng + 180) / 360) * MAP_VIEWBOX.width;
  const y = ((80 - lat) / 140) * MAP_VIEWBOX.height;
  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
  };
}

/**
 * Calculates Great-Circle distance in Nautical Miles using Haversine formula.
 */
export function calculateHaversineDistanceNm(coord1: GeoCoordinates, coord2: GeoCoordinates): number {
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const lat1 = (coord1.lat * Math.PI) / 180;
  const lat2 = (coord2.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Generates an authentic Great-Circle quadratic curve path between two cities.
 */
export function calculateGreatCirclePath(
  originCityId: string,
  targetCityId: string
): { pathString: string; midPoint: MapPoint; distanceNm: number } {
  const airport1 = AIRPORT_REGISTRY[originCityId];
  const airport2 = AIRPORT_REGISTRY[targetCityId];

  if (!airport1 || !airport2) {
    return { pathString: '', midPoint: { x: 500, y: 250 }, distanceNm: 0 };
  }

  const p1 = projectCoordinates(airport1.coordinates.lat, airport1.coordinates.lng);
  const p2 = projectCoordinates(airport2.coordinates.lat, airport2.coordinates.lng);
  const distanceNm = calculateHaversineDistanceNm(airport1.coordinates, airport2.coordinates);

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const chordLen = Math.sqrt(dx * dx + dy * dy);

  // Curvature amount based on chord length, arched towards the respective pole
  const midX = (p1.x + p2.x) / 2;
  const avgLat = (airport1.coordinates.lat + airport2.coordinates.lat) / 2;
  
  // Arched upwards in Northern hemisphere, downwards in Southern hemisphere
  const arcLift = Math.min(65, Math.max(18, chordLen * 0.14));
  const midY = avgLat >= 0 ? Math.min(p1.y, p2.y) - arcLift : Math.max(p1.y, p2.y) + arcLift;

  const pathString = `M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`;
  return {
    pathString,
    midPoint: { x: midX, y: midY },
    distanceNm,
  };
}

/**
 * Interpolates point along a quadratic bezier curve for animated blips.
 */
export function interpolateQuadraticBezier(
  p0: MapPoint,
  pControl: MapPoint,
  p1: MapPoint,
  t: number
): { point: MapPoint; headingDeg: number } {
  const clampedT = Math.max(0, Math.min(1, t));
  const oneMinusT = 1 - clampedT;

  const x = oneMinusT * oneMinusT * p0.x + 2 * oneMinusT * clampedT * pControl.x + clampedT * clampedT * p1.x;
  const y = oneMinusT * oneMinusT * p0.y + 2 * oneMinusT * clampedT * pControl.y + clampedT * clampedT * p1.y;

  // Tangent vector for heading
  const dx = 2 * (1 - clampedT) * (pControl.x - p0.x) + 2 * clampedT * (p1.x - pControl.x);
  const dy = 2 * (1 - clampedT) * (pControl.y - p0.y) + 2 * clampedT * (p1.y - pControl.y);
  let heading = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (heading < 0) heading += 360;

  return {
    point: { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 },
    headingDeg: Math.round(heading),
  };
}

/**
 * High-fidelity SVG vector landmass paths representing the 7 continents and major islands.
 */
export const WORLD_LANDMASS_PATHS: Array<{ id: string; name: string; d: string }> = [
  {
    id: 'north_america',
    name: 'North America',
    d: `M 45 42 L 80 35 L 120 38 L 155 45 L 205 40 L 260 52 L 290 65 L 320 82 L 318 115 L 305 130 
        L 292 145 L 278 185 L 285 200 L 275 220 L 255 242 L 235 238 L 220 220 L 205 190 L 175 170 
        L 155 130 L 140 100 L 95 85 L 60 70 Z`,
  },
  {
    id: 'greenland',
    name: 'Greenland',
    d: `M 380 30 L 430 35 L 450 55 L 440 85 L 405 105 L 375 75 Z`,
  },
  {
    id: 'south_america',
    name: 'South America',
    d: `M 275 250 L 300 245 L 335 255 L 380 270 L 405 295 L 385 340 L 370 385 L 350 435 L 330 480 
        L 315 485 L 310 440 L 290 380 L 275 320 L 265 285 Z`,
  },
  {
    id: 'europe',
    name: 'Europe',
    d: `M 470 70 L 515 40 L 550 45 L 575 75 L 565 105 L 585 125 L 565 145 L 530 155 L 500 160 
        L 480 155 L 470 135 L 490 120 L 475 95 Z`,
  },
  {
    id: 'british_isles',
    name: 'British Isles',
    d: `M 488 90 L 505 85 L 502 110 L 485 115 Z M 478 95 L 485 92 L 483 108 L 475 105 Z`,
  },
  {
    id: 'africa',
    name: 'Africa',
    d: `M 465 165 L 530 160 L 580 170 L 615 200 L 635 235 L 610 275 L 595 325 L 585 385 L 570 410 
        L 540 405 L 520 350 L 500 295 L 460 275 L 445 235 L 450 195 Z`,
  },
  {
    id: 'madagascar',
    name: 'Madagascar',
    d: `M 625 345 L 638 340 L 632 385 L 620 380 Z`,
  },
  {
    id: 'asia',
    name: 'Asia',
    d: `M 575 75 L 640 60 L 720 50 L 820 55 L 910 70 L 965 95 L 940 125 L 890 145 L 860 175 
        L 830 215 L 795 245 L 775 275 L 755 240 L 730 220 L 710 255 L 685 240 L 655 210 L 620 200 
        L 580 170 L 570 125 Z`,
  },
  {
    id: 'japan',
    name: 'Japan',
    d: `M 885 140 L 905 135 L 900 165 L 880 175 Z`,
  },
  {
    id: 'southeast_asia_islands',
    name: 'Maritime Southeast Asia',
    d: `M 770 290 L 810 285 L 830 305 L 790 315 Z M 815 260 L 835 255 L 830 280 L 815 285 Z`,
  },
  {
    id: 'australia',
    name: 'Australia',
    d: `M 815 340 L 870 330 L 915 345 L 925 390 L 910 425 L 850 420 L 820 395 L 805 365 Z`,
  },
  {
    id: 'new_zealand',
    name: 'New Zealand',
    d: `M 955 420 L 970 415 L 965 445 L 950 440 Z`,
  },
];

/**
 * Official DEA and International Naval/Air Interdiction Blockade Zones.
 */
export const DEA_BLOCKADE_ZONES: BlockadeZone[] = [
  {
    id: 'caribbean_vector',
    name: 'Operation Caribbean Shield (JIATF-South)',
    code: 'SEC-CRB-01',
    description: 'Joint naval cutter cordons & P-3 Orion radar sweeps across Florida Straits & Gulf of Darien.',
    threatLevel: 'severe',
    polygonPoints: [
      { x: 255, y: 185 },
      { x: 335, y: 195 },
      { x: 325, y: 265 },
      { x: 265, y: 255 },
    ],
    interceptionRiskModifier: 0.35,
    labelPosition: { x: 295, y: 225 },
  },
  {
    id: 'east_pacific_vector',
    name: 'Eastern Pacific Narco-Sub Task Force',
    code: 'SEC-PAC-02',
    description: 'Anti-submarine frigate patrols & sonar buoys hunting low-profile smuggling vessels.',
    threatLevel: 'high',
    polygonPoints: [
      { x: 160, y: 195 },
      { x: 235, y: 235 },
      { x: 250, y: 285 },
      { x: 175, y: 275 },
    ],
    interceptionRiskModifier: 0.28,
    labelPosition: { x: 205, y: 245 },
  },
  {
    id: 'gibraltar_gateway',
    name: 'Frontex Mediterranean Air-Sea Perimeter',
    code: 'SEC-MED-03',
    description: 'High-altitude thermal drone reconnaissance tracking maritime traffic from North Africa.',
    threatLevel: 'high',
    polygonPoints: [
      { x: 465, y: 135 },
      { x: 535, y: 135 },
      { x: 525, y: 175 },
      { x: 460, y: 170 },
    ],
    interceptionRiskModifier: 0.25,
    labelPosition: { x: 495, y: 152 },
  },
  {
    id: 'golden_triangle_airspace',
    name: 'ASEAN Regional Narcotics Airborne Grid',
    code: 'SEC-ASN-04',
    description: 'Military radar surveillance and jungle flight interceptors guarding mountain airstrips.',
    threatLevel: 'medium',
    polygonPoints: [
      { x: 755, y: 195 },
      { x: 825, y: 195 },
      { x: 815, y: 260 },
      { x: 745, y: 250 },
    ],
    interceptionRiskModifier: 0.20,
    labelPosition: { x: 785, y: 225 },
  },
];

/**
 * Dynamically identifies geopolitical hotspots based on active world events, local heat, and cartel presence.
 */
export function evaluateCityHotspots(player: PlayerState, currentDay: number): GeopoliticalHotspot[] {
  const hotspots: GeopoliticalHotspot[] = [];

  for (const city of CITIES) {
    const cityHeat = player.cityHeat?.[city.id] ?? 0;

    // 1. Sovereign Sanctuaries
    const isSanctuary = SOVEREIGN_SANCTUARIES.some((s) => s.cityId === city.id);
    if (isSanctuary) {
      hotspots.push({
        id: `sanctuary_${city.id}`,
        type: 'sovereign_sanctuary',
        cityId: city.id,
        cityName: city.name,
        title: 'Sovereign Non-Extradition Sanctuary',
        description: 'Hostile federal warrants voided. Safe banking harbor and 0% extradition risk.',
        severity: 'sanctuary',
        badgeLabel: 'SANCTUARY',
      });
      continue;
    }

    // 2. High-Heat Border Crackdowns & DEA Raids
    if (cityHeat >= 65 || (player.pendingRaidWarning && player.pendingRaidWarning.cityId === city.id)) {
      hotspots.push({
        id: `crackdown_${city.id}`,
        type: 'border_crackdown',
        cityId: city.id,
        cityName: city.name,
        title: 'Tactical DEA / SWAT Border Lockdown',
        description: `Extreme municipal heat (${cityHeat}%). Tactical checkpoints and raid search cordons active.`,
        severity: 'danger',
        badgeLabel: 'CRACKDOWN',
      });
      continue;
    }

    // 3. Port Strikes & Seaport Discount Hubs
    const isCommercialSeaport = ['amsterdam', 'singapore', 'dubai', 'hong_kong', 'tokyo'].includes(city.id);
    // Deterministic periodic strike based on day and city hash
    const hasPortStrike = (currentDay + city.name.length) % 7 === 0;
    if (isCommercialSeaport && hasPortStrike) {
      hotspots.push({
        id: `strike_${city.id}`,
        type: 'port_strike',
        cityId: city.id,
        cityName: city.name,
        title: 'Maritime Dockworkers Port Strike',
        description: 'Container cargo delayed at customs terminals. Commercial seaport precursor logistics disrupted.',
        severity: 'warning',
        badgeLabel: 'PORT STRIKE',
      });
      continue;
    } else if (isCommercialSeaport) {
      hotspots.push({
        id: `seaport_${city.id}`,
        type: 'seaport_hub',
        cityId: city.id,
        cityName: city.name,
        title: 'Industrial Chemical Seaport Hub',
        description: 'Bulk maritime freight logistics active. -30% discount on chemical precursor consignments.',
        severity: 'info',
        badgeLabel: 'SEAPORT -30%',
      });
      continue;
    }

    // 4. Cartel Syndicate Turf Disputes
    const isCartelHome = ['medellin', 'bangkok', 'berlin', 'ibiza', 'istanbul'].includes(city.id);
    if (isCartelHome && (currentDay + city.flightCost) % 5 === 0) {
      hotspots.push({
        id: `turf_${city.id}`,
        type: 'cartel_turf_war',
        cityId: city.id,
        cityName: city.name,
        title: 'Underworld Cartel Turf Dispute',
        description: 'Rival syndicate hit squads contesting street distribution. High price volatility on specialty cargo.',
        severity: 'warning',
        badgeLabel: 'TURF WAR',
      });
      continue;
    }

    // 5. Canine Customs Interdiction Surges
    if (city.dogRisk >= 0.22) {
      hotspots.push({
        id: `k9_${city.id}`,
        type: 'canine_surge',
        cityId: city.id,
        cityName: city.name,
        title: 'K-9 Sniffer Dog Tactical Unit',
        description: `Customs inspection teams equipped with narcotic detector dogs (${Math.round(city.dogRisk * 100)}% base risk).`,
        severity: 'warning',
        badgeLabel: 'K-9 CORRIDOR',
      });
    }
  }

  return hotspots;
}

/**
 * Calculates live on-map positions for all active in-transit shipments.
 */
export function calculateCourierBlips(player: PlayerState): ActiveCourierBlip[] {
  if (!player.shipments || player.shipments.length === 0) {
    return [];
  }

  const blips: ActiveCourierBlip[] = [];

  for (const shipment of player.shipments) {
    if (shipment.status !== 'in_transit') continue;

    const airport1 = AIRPORT_REGISTRY[shipment.originCityId];
    const airport2 = AIRPORT_REGISTRY[shipment.targetCityId];
    if (!airport1 || !airport2) continue;

    const p0 = projectCoordinates(airport1.coordinates.lat, airport1.coordinates.lng);
    const p1 = projectCoordinates(airport2.coordinates.lat, airport2.coordinates.lng);

    const totalTransitDays = shipment.shipperId === 'quicker_shipper' || shipment.shipperId === 'international_couriers' ? 1 : 2;
    // Progress is based on days elapsed
    const daysElapsed = totalTransitDays - shipment.daysRemaining;
    const progressPercent = Math.max(0.15, Math.min(0.85, (daysElapsed + 0.5) / (totalTransitDays + 1)));

    const { midPoint } = calculateGreatCirclePath(shipment.originCityId, shipment.targetCityId);
    const { point } = interpolateQuadraticBezier(p0, midPoint, p1, progressPercent);

    const drug = DRUG_MAP.get(shipment.drugId);
    const shipper = SHIPPER_MAP.get(shipment.shipperId);

    const originHeat = player.cityHeat?.[shipment.originCityId] ?? 0;
    const targetHeat = player.cityHeat?.[shipment.targetCityId] ?? 0;
    const avgHeat = (originHeat + targetHeat) / 2;
    const interceptionRisk = Math.min(0.85, Math.round((1 - (shipper?.reliability ?? 0.8) + avgHeat * 0.003) * 100));

    blips.push({
      id: `blip_${shipment.id}`,
      shipmentId: shipment.id,
      originCityId: shipment.originCityId,
      targetCityId: shipment.targetCityId,
      drugId: shipment.drugId,
      drugName: drug?.name ?? shipment.drugId,
      units: shipment.units,
      shipperId: shipment.shipperId,
      shipperName: shipper?.name ?? 'Contract Courier',
      daysRemaining: shipment.daysRemaining,
      totalTransitDays,
      progressPercent: Math.round(progressPercent * 100),
      currentPosition: point,
      interceptionRisk,
    });
  }

  return blips;
}
