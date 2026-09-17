import { FlightSeatClass } from './types';

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface MapPoint {
  x: number;
  y: number;
}

export type GeopoliticalHotspotType =
  | 'port_strike'
  | 'cartel_turf_war'
  | 'border_crackdown'
  | 'canine_surge'
  | 'sovereign_sanctuary'
  | 'seaport_hub';

export interface GeopoliticalHotspot {
  id: string;
  type: GeopoliticalHotspotType;
  cityId: string;
  cityName: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'danger' | 'sanctuary';
  badgeLabel: string;
}

export interface BlockadeZone {
  id: string;
  name: string;
  code: string;
  description: string;
  threatLevel: 'medium' | 'high' | 'severe';
  polygonPoints: MapPoint[];
  interceptionRiskModifier: number;
  labelPosition: MapPoint;
}

export interface GreatCircleCorridor {
  originCityId: string;
  targetCityId: string;
  pathString: string;
  distanceNm: number;
  midPoint: MapPoint;
  isDirect: boolean;
}

export interface ActiveCourierBlip {
  id: string;
  shipmentId: string;
  originCityId: string;
  targetCityId: string;
  drugId: string;
  drugName: string;
  units: number;
  shipperId: string;
  shipperName: string;
  daysRemaining: number;
  totalTransitDays: number;
  progressPercent: number;
  currentPosition: MapPoint;
  interceptionRisk: number;
}

export interface FlightAnimationState {
  isActive: boolean;
  originCityId: string;
  targetCityId: string;
  seatClass: FlightSeatClass;
  useOwnedAircraft: boolean;
  aircraftName: string;
  callsign: string;
  progress: number; // 0 to 1
  currentPosition: MapPoint;
  headingDegrees: number;
  speedKts: number;
  mach: number;
  altitudeFt: number;
  distanceNm: number;
  elapsedMs: number;
  totalDurationMs: number;
  isCustomsBypassed: boolean;
  unmaskedContraband: number;
}
