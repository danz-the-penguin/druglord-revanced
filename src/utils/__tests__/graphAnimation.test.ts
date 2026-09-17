import { describe, it, expect } from 'vitest';
import {
  interpolateSeriesPrice,
  getSeriesSlope,
  stepPlaybackSpeed,
  DEFAULT_SPEEDS,
} from '../graphAnimation';

describe('graphAnimation utilities', () => {
  describe('interpolateSeriesPrice', () => {
    it('returns exact values at integer indices', () => {
      const series = [1000, 2000, 1500, 3000];
      expect(interpolateSeriesPrice(series, 0)).toBe(1000);
      expect(interpolateSeriesPrice(series, 1)).toBe(2000);
      expect(interpolateSeriesPrice(series, 2)).toBe(1500);
      expect(interpolateSeriesPrice(series, 3)).toBe(3000);
    });

    it('interpolates intermediate fractional values smoothly', () => {
      const series = [1000, 2000];
      expect(interpolateSeriesPrice(series, 0.5)).toBe(1500);
      expect(interpolateSeriesPrice(series, 0.25)).toBe(1250);
      expect(interpolateSeriesPrice(series, 0.75)).toBe(1750);
    });

    it('clamps out-of-bounds progress', () => {
      const series = [500, 1000];
      expect(interpolateSeriesPrice(series, -1)).toBe(500);
      expect(interpolateSeriesPrice(series, 5)).toBe(1000);
    });

    it('handles empty and single-element series safely', () => {
      expect(interpolateSeriesPrice([], 0, 999)).toBe(999);
      expect(interpolateSeriesPrice([4200], 0)).toBe(4200);
    });
  });

  describe('getSeriesSlope', () => {
    it('detects rising slope when price increases', () => {
      const series = [1000, 2500, 800];
      expect(getSeriesSlope(series, 0.4)).toBe(1500); // 2500 - 1000
    });

    it('detects falling slope when price decreases', () => {
      const series = [1000, 2500, 800];
      expect(getSeriesSlope(series, 1.2)).toBe(-1700); // 800 - 2500
    });

    it('returns 0 for flat price intervals or insufficient data', () => {
      expect(getSeriesSlope([1000, 1000], 0.5)).toBe(0);
      expect(getSeriesSlope([500], 0)).toBe(0);
      expect(getSeriesSlope([], 0)).toBe(0);
    });
  });

  describe('stepPlaybackSpeed', () => {
    it('has valid default speeds array', () => {
      expect(DEFAULT_SPEEDS).toEqual([0.25, 0.5, 1, 2, 4, 8]);
    });

    it('steps speed up through the presets', () => {
      expect(stepPlaybackSpeed(0.5, 'increase')).toBe(1);
      expect(stepPlaybackSpeed(1, 'increase')).toBe(2);
      expect(stepPlaybackSpeed(2, 'increase')).toBe(4);
      expect(stepPlaybackSpeed(4, 'increase')).toBe(8);
      expect(stepPlaybackSpeed(8, 'increase')).toBe(8); // capped at max
    });

    it('steps speed down through the presets', () => {
      expect(stepPlaybackSpeed(8, 'decrease')).toBe(4);
      expect(stepPlaybackSpeed(4, 'decrease')).toBe(2);
      expect(stepPlaybackSpeed(2, 'decrease')).toBe(1);
      expect(stepPlaybackSpeed(1, 'decrease')).toBe(0.5);
      expect(stepPlaybackSpeed(0.5, 'decrease')).toBe(0.25);
      expect(stepPlaybackSpeed(0.25, 'decrease')).toBe(0.25); // capped at min
    });
  });
});
