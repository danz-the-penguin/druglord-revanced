import { describe, it, expect } from 'vitest';
import {
  projectCoordinates,
  calculateHaversineDistanceNm,
  calculateGreatCirclePath,
  interpolateQuadraticBezier,
  WORLD_LANDMASS_PATHS,
  DEA_BLOCKADE_ZONES,
  evaluateCityHotspots,
  calculateCourierBlips,
} from '../smugglingMapData';
import { AIRPORT_REGISTRY } from '../flightNetwork';
import { CITIES } from '../constants';
import { createInitialState } from '../game';
import { ActiveShipment } from '../types';

describe('Smuggling Map Engine & Geodesic Navigation', () => {
  it('projects all 30 cities into valid SVG coordinate bounds (1000x500)', () => {
    for (const city of CITIES) {
      const airport = AIRPORT_REGISTRY[city.id];
      expect(airport).toBeDefined();
      if (!airport) continue;

      const p = projectCoordinates(airport.coordinates.lat, airport.coordinates.lng);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1000);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(500);
    }
  });

  it('calculates accurate Haversine distance in nautical miles', () => {
    const ny = AIRPORT_REGISTRY['new_york'].coordinates;
    const london = AIRPORT_REGISTRY['london'].coordinates;
    const distanceNm = calculateHaversineDistanceNm(ny, london);

    // JFK to LHR is ~2,990 to 3,020 nautical miles
    expect(distanceNm).toBeGreaterThan(2900);
    expect(distanceNm).toBeLessThan(3150);

    const miami = AIRPORT_REGISTRY['miami'].coordinates;
    const bogota = AIRPORT_REGISTRY['bogota'].coordinates;
    const distMIA_BOG = calculateHaversineDistanceNm(miami, bogota);
    // MIA to BOG is ~1,300 to 1,350 nm
    expect(distMIA_BOG).toBeGreaterThan(1250);
    expect(distMIA_BOG).toBeLessThan(1400);
  });

  it('generates great-circle curved bezier paths between origin and target cities', () => {
    const corridor = calculateGreatCirclePath('miami', 'bogota');
    expect(corridor.pathString).toMatch(/^M\s+\d+(\.\d+)?\s+\d+(\.\d+)?\s+Q\s+\d+(\.\d+)?\s+\d+(\.\d+)?\s+\d+(\.\d+)?\s+\d+(\.\d+)?/);
    expect(corridor.distanceNm).toBeGreaterThan(1000);
    expect(corridor.midPoint.x).toBeGreaterThan(0);
    expect(corridor.midPoint.y).toBeGreaterThan(0);
  });

  it('interpolates intermediate flight points and headings along quadratic bezier', () => {
    const p0 = { x: 100, y: 100 };
    const pControl = { x: 300, y: 50 };
    const p1 = { x: 500, y: 100 };

    const start = interpolateQuadraticBezier(p0, pControl, p1, 0);
    expect(start.point.x).toBe(100);
    expect(start.point.y).toBe(100);

    const mid = interpolateQuadraticBezier(p0, pControl, p1, 0.5);
    expect(mid.point.x).toBe(300);
    expect(mid.point.y).toBe(75);
    expect(mid.headingDeg).toBeGreaterThanOrEqual(0);
    expect(mid.headingDeg).toBeLessThan(360);

    const end = interpolateQuadraticBezier(p0, pControl, p1, 1);
    expect(end.point.x).toBe(500);
    expect(end.point.y).toBe(100);
  });

  it('contains comprehensive world landmass vector outlines', () => {
    expect(WORLD_LANDMASS_PATHS.length).toBeGreaterThanOrEqual(7);
    const continentIds = WORLD_LANDMASS_PATHS.map((c) => c.id);
    expect(continentIds).toContain('north_america');
    expect(continentIds).toContain('south_america');
    expect(continentIds).toContain('europe');
    expect(continentIds).toContain('africa');
    expect(continentIds).toContain('asia');
    expect(continentIds).toContain('australia');

    for (const land of WORLD_LANDMASS_PATHS) {
      expect(land.d.trim().startsWith('M')).toBe(true);
    }
  });

  it('provides official DEA naval and aerial blockade zones with valid polygon definitions', () => {
    expect(DEA_BLOCKADE_ZONES.length).toBe(4);
    for (const zone of DEA_BLOCKADE_ZONES) {
      expect(zone.polygonPoints.length).toBeGreaterThanOrEqual(3);
      expect(zone.interceptionRiskModifier).toBeGreaterThan(0);
      expect(zone.labelPosition.x).toBeGreaterThan(0);
      expect(zone.labelPosition.y).toBeGreaterThan(0);
    }
  });

  it('dynamically identifies sovereign sanctuaries and high-heat border crackdowns', () => {
    const state = createInitialState();
    state.player.cityHeat = {
      miami: 75, // Crackdown!
      new_york: 10,
    };

    const hotspots = evaluateCityHotspots(state.player, 1);
    expect(hotspots.length).toBeGreaterThan(0);

    // Miami should have a border crackdown hotspot
    const miamiHotspot = hotspots.find((h) => h.cityId === 'miami' && h.type === 'border_crackdown');
    expect(miamiHotspot).toBeDefined();
    expect(miamiHotspot?.severity).toBe('danger');

    // Zurich should be identified as a Sovereign Sanctuary
    const zurichHotspot = hotspots.find((h) => h.cityId === 'zurich' && h.type === 'sovereign_sanctuary');
    expect(zurichHotspot).toBeDefined();
    expect(zurichHotspot?.severity).toBe('sanctuary');
  });

  it('calculates active courier blip positions along smuggling corridors', () => {
    const state = createInitialState();
    expect(calculateCourierBlips(state.player)).toEqual([]);

    const activeShipment: ActiveShipment = {
      id: 'ship_001',
      shipperId: 'quicker_shipper',
      originCityId: 'bogota',
      targetCityId: 'miami',
      drugId: 'cocaine',
      units: 1500,
      costPaid: 4500,
      daysRemaining: 1,
      status: 'in_transit',
    };

    state.player.shipments = [activeShipment];
    const blips = calculateCourierBlips(state.player);

    expect(blips.length).toBe(1);
    expect(blips[0].originCityId).toBe('bogota');
    expect(blips[0].targetCityId).toBe('miami');
    expect(blips[0].drugName).toBe('Cocaine');
    expect(blips[0].units).toBe(1500);
    expect(blips[0].currentPosition.x).toBeGreaterThan(200);
    expect(blips[0].currentPosition.y).toBeGreaterThan(150);
  });
});
