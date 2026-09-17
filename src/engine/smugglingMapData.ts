import {
  MapPoint,
  GeoCoordinates,
  BlockadeZone,
  GeopoliticalHotspot,
  ActiveCourierBlip,
  CartelPatrolVector,
  StormHazardZone,
  TopographyContour,
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
 * High-fidelity, smooth SVG vector landmass paths representing realistic world coastlines.
 */
export const WORLD_LANDMASS_PATHS: Array<{ id: string; name: string; d: string }> = [
  {
    id: 'north_america',
    name: 'North America',
    d: `M 38 52 C 48 38, 75 30, 115 35 C 145 38, 175 42, 215 38 C 248 35, 275 48, 292 62 
        C 285 75, 268 85, 255 78 C 242 70, 235 88, 252 98 C 265 105, 285 92, 292 80 
        C 305 70, 318 62, 335 72 C 342 85, 328 102, 320 115 C 315 125, 324 130, 318 138 
        C 308 140, 296 148, 292 160 C 285 178, 282 192, 278 202 C 275 208, 278 214, 280 216 
        C 275 218, 268 208, 262 198 C 250 192, 232 196, 222 208 C 218 218, 224 232, 238 238 
        C 252 242, 268 235, 274 240 C 276 246, 268 250, 258 252 C 245 248, 232 240, 218 226 
        C 208 215, 198 185, 192 172 C 185 160, 172 165, 166 158 C 158 145, 158 128, 162 112 
        C 155 102, 142 98, 130 92 C 112 88, 92 85, 78 78 C 65 72, 50 68, 38 52 Z 
        M 194 175 C 200 185, 206 202, 214 220 C 216 225, 210 226, 208 218 C 202 198, 196 182, 194 175 Z`,
  },
  {
    id: 'greenland',
    name: 'Greenland',
    d: `M 368 28 C 392 20, 428 22, 452 42 C 458 58, 448 85, 436 98 C 418 108, 396 102, 382 88 C 370 75, 362 52, 368 28 Z`,
  },
  {
    id: 'iceland',
    name: 'Iceland',
    d: `M 444 68 C 454 65, 464 66, 466 74 C 462 82, 450 84, 444 78 C 440 74, 440 70, 444 68 Z`,
  },
  {
    id: 'caribbean_islands',
    name: 'Caribbean Islands',
    d: `M 266 206 C 278 205, 294 210, 304 215 C 298 219, 282 216, 268 212 Z 
        M 308 218 C 318 216, 328 218, 332 222 C 324 226, 314 225, 308 220 Z 
        M 336 223 C 342 223, 345 225, 343 228 C 339 229, 335 227, 336 223 Z 
        M 288 224 C 296 223, 298 226, 294 229 C 288 229, 286 226, 288 224 Z`,
  },
  {
    id: 'south_america',
    name: 'South America',
    d: `M 268 254 C 278 248, 295 248, 315 250 C 335 254, 362 262, 386 275 C 405 288, 412 305, 402 328 
        C 392 348, 382 372, 375 392 C 362 422, 345 448, 332 478 C 324 488, 315 488, 312 478 
        C 308 462, 305 442, 295 422 C 282 392, 274 365, 270 338 C 265 315, 258 292, 262 278 
        C 264 268, 265 258, 268 254 Z`,
  },
  {
    id: 'europe',
    name: 'Europe',
    d: `M 466 156 C 460 145, 464 135, 474 130 C 484 125, 492 118, 490 110 C 486 102, 502 98, 514 98 
        C 525 96, 528 85, 525 78 C 518 68, 525 45, 542 35 C 558 32, 574 48, 565 72 
        C 555 88, 568 95, 578 108 C 585 120, 578 132, 568 140 C 555 148, 545 156, 538 162 
        C 532 158, 535 145, 532 138 C 525 132, 515 136, 506 142 C 495 152, 482 158, 466 156 Z 
        M 536 138 C 542 142, 546 150, 544 158 C 540 162, 536 156, 535 148 Z`,
  },
  {
    id: 'british_isles',
    name: 'British Isles',
    d: `M 488 88 C 496 82, 506 82, 504 98 C 502 112, 494 118, 486 114 C 484 105, 485 95, 488 88 Z 
        M 474 95 C 482 92, 484 100, 480 108 C 475 110, 472 104, 474 95 Z`,
  },
  {
    id: 'mediterranean_islands',
    name: 'Mediterranean Islands',
    d: `M 535 156 C 542 154, 544 160, 536 162 C 532 160, 532 156, 535 156 Z 
        M 522 142 C 526 140, 526 146, 522 147 Z 
        M 568 161 C 576 160, 576 164, 568 164 Z 
        M 590 158 C 596 157, 596 161, 590 161 Z`,
  },
  {
    id: 'africa',
    name: 'Africa',
    d: `M 464 162 C 482 158, 515 158, 538 165 C 562 172, 592 168, 608 178 C 625 192, 638 212, 642 232 
        C 630 252, 615 278, 608 308 C 598 342, 592 375, 582 405 C 572 415, 552 415, 540 405 
        C 525 385, 515 348, 502 312 C 492 282, 478 262, 458 245 C 445 232, 442 208, 448 195 
        C 452 182, 458 170, 464 162 Z`,
  },
  {
    id: 'madagascar',
    name: 'Madagascar',
    d: `M 622 344 C 634 338, 638 362, 634 382 C 628 392, 620 382, 618 365 C 618 352, 620 346, 622 344 Z`,
  },
  {
    id: 'asia',
    name: 'Asia',
    d: `M 572 75 C 615 58, 678 45, 755 42 C 825 40, 895 52, 948 68 C 965 78, 955 105, 938 122 
        C 915 138, 882 148, 858 152 C 848 165, 835 182, 825 205 C 815 225, 798 242, 788 268 
        C 782 282, 775 265, 768 252 C 758 238, 742 225, 730 232 C 715 242, 705 262, 695 248 
        C 685 232, 672 215, 655 205 C 640 198, 630 215, 620 208 C 610 198, 598 185, 582 178 
        C 572 155, 568 128, 570 102 C 572 88, 570 78, 572 75 Z`,
  },
  {
    id: 'japan',
    name: 'Japan',
    d: `M 882 145 C 895 140, 905 150, 898 165 C 890 172, 880 168, 878 158 C 876 150, 878 145, 882 145 Z 
        M 898 128 C 908 125, 912 134, 906 138 C 898 140, 895 134, 898 128 Z`,
  },
  {
    id: 'southeast_asia_islands',
    name: 'Maritime Southeast Asia',
    d: `M 764 275 C 778 288, 792 308, 790 318 C 780 322, 768 302, 762 285 Z 
        M 802 322 C 818 322, 832 325, 830 328 C 818 330, 804 328, 802 322 Z 
        M 810 274 C 825 268, 832 288, 824 300 C 815 304, 808 288, 810 274 Z 
        M 830 218 C 838 215, 842 228, 836 240 C 830 242, 828 228, 830 218 Z 
        M 836 248 C 844 246, 846 262, 838 268 C 832 268, 832 255, 836 248 Z 
        M 872 295 C 910 302, 922 318, 912 325 C 885 328, 870 315, 872 295 Z`,
  },
  {
    id: 'australia',
    name: 'Australia',
    d: `M 818 345 C 848 332, 885 330, 912 348 C 928 368, 924 398, 914 422 C 895 428, 858 426, 832 418 
        C 815 408, 808 385, 810 365 C 812 352, 814 348, 818 345 Z 
        M 894 435 C 905 432, 906 445, 898 448 C 892 446, 892 438, 894 435 Z`,
  },
  {
    id: 'new_zealand',
    name: 'New Zealand',
    d: `M 956 414 C 966 412, 968 425, 960 432 C 954 430, 952 420, 956 414 Z 
        M 945 434 C 956 430, 954 448, 946 455 C 940 452, 940 440, 945 434 Z`,
  },
];

/**
 * Topographic elevation contours representing continental mountain ranges and choke points.
 */
export const WORLD_TOPOGRAPHY_CONTOURS: TopographyContour[] = [
  {
    id: 'rockies',
    name: 'Rocky Mountains & Sierra Madre Ridge',
    pathString: 'M 155 60 Q 165 110 180 145 Q 195 180 225 220',
  },
  {
    id: 'andes',
    name: 'Andes Cordillera Mountain Wall',
    pathString: 'M 275 255 Q 268 310 275 370 Q 285 420 310 475',
  },
  {
    id: 'alps',
    name: 'European Alps & Pyrenees System',
    pathString: 'M 480 128 Q 510 120 535 125 M 485 138 Q 470 140 455 142',
  },
  {
    id: 'himalayas',
    name: 'Himalayas & Tibetan Plateau Ridge',
    pathString: 'M 710 160 Q 755 155 800 165 Q 820 180 840 195',
  },
  {
    id: 'great_rift',
    name: 'East African Rift Valley Corridor',
    pathString: 'M 605 190 Q 595 240 590 290 Q 580 340 575 380',
  },
];

/**
 * High-risk active Cartel Patrol and Infiltration Vectors.
 */
export const CARTEL_PATROL_VECTORS: CartelPatrolVector[] = [
  {
    id: 'caribbean_speedboat',
    name: 'Florida Straits "Go-Fast" Infiltration Track',
    syndicateName: 'Medellin Cartel',
    type: 'speedboat',
    pathString: 'M 290 263 Q 275 225 255 198 Q 265 190 277 194',
    description: 'Triple-outboard 50-knot stealth boats smuggling high-grade cocaine past naval radar into the Florida Keys.',
    color: '#06b6d4',
  },
  {
    id: 'pacific_sub',
    name: 'Eastern Pacific Narco-Submarine Deep Vector',
    syndicateName: 'Sinaloa Chemical Cartel',
    type: 'speedboat',
    pathString: 'M 285 275 Q 230 250 185 220 Q 170 185 171 164',
    description: 'Low-profile semi-submersibles ferrying 6-ton synthetic drug shipments off the coast of Central America.',
    color: '#10b981',
  },
  {
    id: 'balkan_express',
    name: 'Balkan Highway E80 TIR Truck Pipeline',
    syndicateName: 'Balkan Transit Syndicate',
    type: 'overland_pipeline',
    pathString: 'M 580 138 Q 555 125 530 115 Q 515 105 513 98',
    description: 'Refrigerated commercial container convoy concealing Afghan heroin through Bulgaria and Serbia into Munich and Amsterdam.',
    color: '#f59e0b',
  },
  {
    id: 'golden_mekong',
    name: 'Mekong River Golden Triangle River Transit',
    syndicateName: 'Golden Triangle Cartel',
    type: 'jungle_river',
    pathString: 'M 775 218 Q 785 221 792 235 Q 795 242 796 247',
    description: 'Armed longtail river barges traversing the Mekong River gorges from Chiang Mai through Vientiane and Phnom Penh into the Mekong delta.',
    color: '#a855f7',
  },
  {
    id: 'malacca_strait_lane',
    name: 'Strait of Malacca Super-Container Channel',
    syndicateName: 'Maritime Syndicate Consortium',
    type: 'container_corridor',
    pathString: 'M 778 266 Q 782 276 788 280',
    description: 'The world\'s busiest shipping choke point connecting Penang, Kuala Lumpur, and Singapore. Thousands of uninspected intermodal containers transit daily.',
    color: '#06b6d4',
  },
  {
    id: 'andaman_speedboat',
    name: 'Andaman Sea Offshore Interceptor Corridor',
    syndicateName: 'Siam Gulf Runners',
    type: 'speedboat',
    pathString: 'M 779 236 Q 770 250 778 266 Q 785 285 796 307',
    description: 'Kevlar-reinforced high-speed stealth boats skimming the Andaman Sea and Sunda Strait between Bangkok, Penang, and Jakarta.',
    color: '#ec4899',
  },
];

export interface WaterwayRoute {
  id: string;
  name: string;
  syndicate: string;
  color: string;
  coordinates: [number, number][]; // [lat, lng]
  description: string;
}

export const ASEAN_WATERWAYS: WaterwayRoute[] = [
  {
    id: 'mekong_barge_route',
    name: 'Mekong River Opium Flotilla',
    syndicate: 'Golden Triangle Triads',
    color: '#a855f7',
    coordinates: [
      [18.7668, 98.9626],  // Chiang Mai
      [17.9883, 102.5633], // Vientiane
      [11.5466, 104.8441], // Phnom Penh
      [10.8188, 106.6519], // Ho Chi Minh City
    ],
    description: 'Inland river barges transporting raw Golden Triangle opium and precursor barrels across porous international riverbanks.',
  },
  {
    id: 'malacca_container_channel',
    name: 'Strait of Malacca Container Expressway',
    syndicate: 'Asian Port Logistics Consortium',
    color: '#06b6d4',
    coordinates: [
      [5.2971, 100.2768],  // Penang
      [2.7456, 101.7099],  // Kuala Lumpur
      [1.3644, 103.9915],  // Singapore
    ],
    description: 'Mega-freighter corridor connecting Malaysian free ports to Singapore. Industrial-scale MDMA and precursor container transshipment.',
  },
  {
    id: 'andaman_sea_speedboat_corridor',
    name: 'Andaman Sea High-Velocity Narco-Run',
    syndicate: 'Apex Maritime Runners',
    color: '#ec4899',
    coordinates: [
      [13.69, 100.7501],   // Bangkok
      [5.2971, 100.2768],   // Penang
      [-6.1256, 106.6559], // Jakarta
      [-7.3798, 112.7874], // Surabaya
    ],
    description: 'Nighttime high-speed boat route bypassing naval coastal radar across the Andaman Sea and Sunda Strait into Java.',
  },
];

/**
 * Atmospheric Weather and Extreme Storm Hazard Zones.
 */
export const STORM_HAZARD_ZONES: StormHazardZone[] = [
  {
    id: 'north_atlantic_gale',
    name: 'North Atlantic Force 10 Severe Gale',
    code: 'WX-ATLN-98',
    center: { x: 415, y: 105 },
    radius: 40,
    description: 'Violent North Atlantic extratropical cyclone. Heavy turbulence and maritime cargo delays.',
    severity: 'warning',
    spiralPath: 'M 415 105 m 0 -30 a 30 30 0 1 1 -20 52 a 20 20 0 1 1 25 -32 a 12 12 0 1 1 -15 18',
  },
  {
    id: 'caribbean_hurricane',
    name: 'Tropical Hurricane "Bravo" (Cat 3)',
    code: 'WX-HURR-04',
    center: { x: 300, y: 215 },
    radius: 34,
    description: 'Cat 3 hurricane churning over Greater Antilles. Coast guard cutters grounded in port.',
    severity: 'severe',
    spiralPath: 'M 300 215 m 0 -26 a 26 26 0 1 1 -18 44 a 17 17 0 1 1 20 -27 a 10 10 0 1 1 -12 15',
  },
  {
    id: 'western_pacific_typhoon',
    name: 'Super-Typhoon "Kuroshio" (Cat 4)',
    code: 'WX-TYPH-12',
    center: { x: 865, y: 195 },
    radius: 44,
    description: 'Super-typhoon bearing 135-knot winds across Philippine Sea flight corridors.',
    severity: 'severe',
    spiralPath: 'M 865 195 m 0 -35 a 35 35 0 1 1 -24 60 a 24 24 0 1 1 28 -38 a 14 14 0 1 1 -18 22',
  },
];

/**
 * Calculates equirectangular Day/Night solar terminator shadow curve.
 * Sun advances across longitude; shifts each day and hour.
 */
export function calculateDayNightTerminatorPath(currentDay: number, currentHour: number = 14): string {
  const totalHours = (currentDay * 24 + currentHour) % 24;
  const sunX = ((totalHours / 24) * 1000 + 500) % 1000;
  
  const steps = 20;
  const amplitude = 80;
  const midY = 250;
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * 1000;
    const angle = ((x - sunX) * 2 * Math.PI) / 1000;
    const y = midY + amplitude * Math.sin(angle);
    points.push({ x: Math.round(x), y: Math.round(y * 10) / 10 });
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  d += ` L 1000 500 L 0 500 Z`;
  return d;
}

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

    // 4. Active Cartel Turf Wars (Syndicate Warfare)
    const activeTurfWar = player.activeTurfWars?.find((w) => w.contestedCityIds.includes(city.id));
    if (activeTurfWar) {
      hotspots.push({
        id: `turf_war_${activeTurfWar.id}_${city.id}`,
        type: 'cartel_turf_war',
        cityId: city.id,
        cityName: city.name,
        title: `⚔️ TURF WAR: ${activeTurfWar.attackerName} vs. ${activeTurfWar.defenderName}`,
        description: `Armed clashes for dominance over ${city.name}! Contraband prices +${Math.round((activeTurfWar.priceSurgeMultiplier - 1) * 100)}%, crossfire danger +${Math.round((activeTurfWar.travelDangerBonus || 0.35) * 100)}%.`,
        severity: 'danger',
        badgeLabel: 'ACTIVE TURF WAR',
      });
      continue;
    }

    // 5. Active Global Macro Shocks
    const activeMacro = player.activeMacroEvents?.find((ev) => !ev.affectedCityIds || ev.affectedCityIds.includes(city.id));
    if (activeMacro) {
      hotspots.push({
        id: `macro_${activeMacro.id}_${city.id}`,
        type: activeMacro.type === 'port_strike' ? 'port_strike' : 'border_crackdown',
        cityId: city.id,
        cityName: city.name,
        title: `${activeMacro.icon} ${activeMacro.title}`,
        description: `${activeMacro.headline} ${activeMacro.description}`,
        severity: activeMacro.severity,
        badgeLabel: activeMacro.type.toUpperCase().replace(/_/g, ' '),
      });
      continue;
    }

    // 6. Cartel Syndicate Turf Disputes (Ambient background)
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
