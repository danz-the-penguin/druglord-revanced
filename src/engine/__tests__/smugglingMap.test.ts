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
  generateGeodesicArcPoints,
  generateGeodesicArcSegments,
  getGeodesicPointAt,
  wrapLongitudeToCenter,
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

  it('renders trans-pacific geodesic arcs as a single continuous polyline with unwrapped longitudes', () => {
    // Tokyo (lat 35.67, lng 139.65) to Los Angeles (lat 33.94, lng -118.40) crosses the 180° antimeridian
    const tokyoAirport = AIRPORT_REGISTRY['tokyo'];
    const laAirport = AIRPORT_REGISTRY['los_angeles'];
    expect(tokyoAirport).toBeDefined();
    expect(laAirport).toBeDefined();

    const points = generateGeodesicArcPoints(
      tokyoAirport.coordinates.lat,
      tokyoAirport.coordinates.lng,
      laAirport.coordinates.lat,
      laAirport.coordinates.lng,
      60
    );

    // Returns a single continuous array of 61 points
    expect(points.length).toBe(61);
    expect(points[0][0]).toBeCloseTo(tokyoAirport.coordinates.lat, 1);
    expect(points[0][1]).toBeCloseTo(tokyoAirport.coordinates.lng, 1);

    // Endpoint longitude is unwrapped (progressed past 180° into ~241.6°)
    const expectedUnwrappedLng2 = laAirport.coordinates.lng + 360;
    expect(points[points.length - 1][1]).toBeCloseTo(expectedUnwrappedLng2, 1);

    // Verify continuous monotonic progression: smooth step across 180° with NO negative jumps
    for (let i = 1; i < points.length; i++) {
      const step = points[i][1] - points[i - 1][1];
      expect(step).toBeGreaterThan(0);
      expect(step).toBeLessThan(10); // Smooth incremental step
    }

    // Segments wrapper returns single array containing points
    const segments = generateGeodesicArcSegments(
      tokyoAirport.coordinates.lat,
      tokyoAirport.coordinates.lng,
      laAirport.coordinates.lat,
      laAirport.coordinates.lng,
      60
    );
    expect(segments.length).toBe(1);
    expect(segments[0]).toEqual(points);
  });

  it('calculates continuous geodesic points and headings along flight routes', () => {
    const ny = AIRPORT_REGISTRY['new_york'].coordinates;
    const singapore = AIRPORT_REGISTRY['singapore'].coordinates;

    const start = getGeodesicPointAt(ny.lat, ny.lng, singapore.lat, singapore.lng, 0);
    expect(start.lat).toBeCloseTo(ny.lat, 1);
    expect(start.lng).toBeCloseTo(ny.lng, 1);

    const end = getGeodesicPointAt(ny.lat, ny.lng, singapore.lat, singapore.lng, 1);
    expect(end.lat).toBeCloseTo(singapore.lat, 1);
    expect(end.lng).toBeCloseTo(singapore.lng, 1);

    const mid = getGeodesicPointAt(ny.lat, ny.lng, singapore.lat, singapore.lng, 0.5);
    expect(mid.lat).toBeDefined();
    expect(mid.lng).toBeDefined();
    expect(mid.headingDeg).toBeGreaterThanOrEqual(0);
    expect(mid.headingDeg).toBeLessThanOrEqual(360);
  });

  it('correctly calculates shortest path and unwrapped continuous coordinates for New York to Surabaya without Arctic arching', () => {
    const ny = AIRPORT_REGISTRY['new_york'].coordinates;
    const sub = AIRPORT_REGISTRY['surabaya'].coordinates;
    expect(ny).toBeDefined();
    expect(sub).toBeDefined();

    const points = generateGeodesicArcPoints(ny.lat, ny.lng, sub.lat, sub.lng, 60);

    // Single continuous polyline
    expect(points.length).toBe(61);

    // NY to Surabaya wraps across the Pacific: lng moves from -73.78 westward to -247.21
    expect(points[0][1]).toBeCloseTo(ny.lng, 1);
    const expectedUnwrappedLng2 = sub.lng - 360;
    expect(points[points.length - 1][1]).toBeCloseTo(expectedUnwrappedLng2, 1);

    // Monotonic progression with no breaks or jumps
    for (let i = 1; i < points.length; i++) {
      const step = points[i][1] - points[i - 1][1];
      expect(step).toBeLessThan(0);
      expect(Math.abs(step)).toBeLessThan(10);
    }

    // Ensure all points stay well south of the Arctic (never arching into 70°+ Arctic poles)
    for (const [lat] of points) {
      expect(lat).toBeLessThan(65);
      expect(lat).toBeGreaterThan(-65);
    }

    // getGeodesicPointAt matches the continuous unwrapped trajectory
    const midPoint = getGeodesicPointAt(ny.lat, ny.lng, sub.lat, sub.lng, 0.5);
    expect(midPoint.lng).toBeCloseTo((ny.lng + expectedUnwrappedLng2) / 2, 0.5);
    expect(midPoint.lat).toBeLessThan(65);
    expect(midPoint.headingDeg).toBeGreaterThanOrEqual(0);
    expect(midPoint.headingDeg).toBeLessThanOrEqual(360);
  });

  it('correctly re-projects and wraps city longitudes to visible center preventing marker desync on pan', () => {
    const jakarta = AIRPORT_REGISTRY['jakarta'].coordinates;
    const la = AIRPORT_REGISTRY['los_angeles'].coordinates;
    const ny = AIRPORT_REGISTRY['new_york'].coordinates;

    // 1. In standard center (0° to 10° longitude)
    expect(wrapLongitudeToCenter(jakarta.lng, 10)).toBeCloseTo(106.66, 1);
    expect(wrapLongitudeToCenter(la.lng, 10)).toBeCloseTo(-118.40, 1);
    expect(wrapLongitudeToCenter(ny.lng, 10)).toBeCloseTo(-73.78, 1);

    // 2. When panning west into the Pacific (centerLng = -160°)
    // Jakarta wraps across into adjacent world copy (-253.34°) rather than staying 266° away
    const jakartaWrappedWest = wrapLongitudeToCenter(jakarta.lng, -160);
    expect(jakartaWrappedWest).toBeCloseTo(106.6559 - 360, 2);
    expect(Math.abs(jakartaWrappedWest - (-160))).toBeLessThanOrEqual(180);

    // 3. When panning east into the Pacific (centerLng = 200°)
    // LA wraps across into adjacent world copy (241.60°) rather than staying 318° away
    const laWrappedEast = wrapLongitudeToCenter(la.lng, 200);
    expect(laWrappedEast).toBeCloseTo(-118.4085 + 360, 2);
    expect(Math.abs(laWrappedEast - 200)).toBeLessThanOrEqual(180);

    // 4. Verify all 30 cities stay within [centerLng - 180, centerLng + 180] for any pan center
    const testCenters = [-500, -220, -160, 0, 15, 180, 240, 540];
    for (const center of testCenters) {
      for (const city of CITIES) {
        const airport = AIRPORT_REGISTRY[city.id];
        if (!airport) continue;
        const wrapped = wrapLongitudeToCenter(airport.coordinates.lng, center);
        expect(wrapped).toBeGreaterThanOrEqual(center - 180);
        expect(wrapped).toBeLessThanOrEqual(center + 180);
      }
    }
  });
});
