import { describe, it, expect } from 'vitest';
import {
  AIRPORT_REGISTRY,
  generateAirportFlightBoard,
  calculateSeatClassDetails,
  AIRLINE_PREFIXES,
} from '../flightNetwork';
import { CITIES } from '../constants';

describe('Flight Network & Real-Time Airport Departures', () => {
  it('contains airport registry for all 30 world destinations', () => {
    expect(CITIES.length).toBe(30);
    for (const city of CITIES) {
      const airport = AIRPORT_REGISTRY[city.id];
      expect(airport).toBeDefined();
      expect(airport.iata).toHaveLength(3);
      expect(airport.terminals).toBeGreaterThanOrEqual(1);
      expect(airport.directDestinations.length).toBeGreaterThan(0);
      expect(airport.coordinates.lat).not.toBe(0);
      expect(airport.coordinates.lng).not.toBe(0);
    }
  });

  it('generates real-world departure schedules for current airport', () => {
    const schedules = generateAirportFlightBoard('new_york', 1);
    expect(schedules.length).toBe(29); // 30 cities minus origin

    const directFlight = schedules.find((s) => s.isDirect);
    expect(directFlight).toBeDefined();
    expect(directFlight?.originIata).toBe('JFK');
    expect(directFlight?.flightNumber).toMatch(/^[A-Z0-9]{2}\s\d{3,4}$/);
    expect(directFlight?.durationMinutes).toBeGreaterThan(30);
    expect(directFlight?.ticketCost).toBeGreaterThan(0);
    expect(directFlight?.departureTime).toMatch(/^\d{2}:\d{2}$/);
  });

  it('correctly distinguishes direct routes and connecting routes via hubs', () => {
    // New York has direct flights to Miami and London
    const jfkSchedules = generateAirportFlightBoard('new_york', 2);
    const miamiFlight = jfkSchedules.find((s) => s.destinationCityId === 'miami');
    expect(miamiFlight?.isDirect).toBe(true);

    // Ibiza has limited connections, usually via regional hubs
    const ibizaSchedules = generateAirportFlightBoard('ibiza', 3);
    const distantFlight = ibizaSchedules.find((s) => s.destinationCityId === 'tokyo');
    expect(distantFlight?.isDirect).toBe(false);
    expect(distantFlight?.transitCityId).toBeDefined();
    expect(distantFlight?.transitCityName).toBeDefined();
    // Connecting flight has higher fare
    expect(distantFlight?.ticketCost).toBeGreaterThan(500);
  });

  it('calculates ticket costs and perks for Economy, Business, and Private Narco Jet', () => {
    const baseFare = 1000;

    const economy = calculateSeatClassDetails(baseFare, 'economy');
    expect(economy.finalCost).toBe(1000);
    expect(economy.customsRiskReduction).toBe(0);

    const business = calculateSeatClassDetails(baseFare, 'business');
    expect(business.finalCost).toBeGreaterThan(baseFare * 2);
    expect(business.customsRiskReduction).toBe(0.25);

    const privateJet = calculateSeatClassDetails(baseFare, 'private_narco');
    expect(privateJet.finalCost).toBeGreaterThanOrEqual(18000);
    expect(privateJet.customsRiskReduction).toBe(0.60);
  });

  it('has valid real-world airline carriers in prefix map', () => {
    expect(Object.keys(AIRLINE_PREFIXES).length).toBeGreaterThanOrEqual(4);
    for (const region of Object.keys(AIRLINE_PREFIXES)) {
      const carriers = AIRLINE_PREFIXES[region];
      expect(carriers.length).toBeGreaterThan(0);
      for (const carrier of carriers) {
        expect(carrier.code).toHaveLength(2);
        expect(carrier.name.length).toBeGreaterThan(2);
      }
    }
  });
});
