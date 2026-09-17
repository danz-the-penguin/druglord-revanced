import { describe, it, expect } from 'vitest';
import { calculatePriceEstimate } from '../priceEstimator';

describe('Target Price & Time-to-Peak Estimator Engine', () => {
  const sampleHistory = [18000, 19500, 20200, 21000, 22000, 23500, 24000]; // Bullish trend, ATH 24,000, ATL 18,000

  it('handles target price matching current spot price exactly', () => {
    const res = calculatePriceEstimate(24000, 24000, sampleHistory, 0.35);

    expect(res.direction).toBe('reached');
    expect(res.priceDelta).toBe(0);
    expect(res.percentDelta).toBe(0);
    expect(res.estimatedDays).toBe(0);
    expect(res.estimatedDaysLabel).toBe('REACHED TODAY');
    expect(res.probabilityScore).toBe(100);
  });

  it('calculates short-term bullish target with favorable momentum and high probability', () => {
    // Current 24,000, Target 26,000 (+8.3%), History has strong upward momentum
    const res = calculatePriceEstimate(24000, 26000, sampleHistory, 0.35);

    expect(res.direction).toBe('up');
    expect(res.percentDelta).toBeGreaterThan(0);
    expect(res.momentumState).toMatch(/strong_bull|moderate_bull/);
    expect(res.estimatedDays).toBeGreaterThanOrEqual(1);
    expect(res.estimatedDays).toBeLessThanOrEqual(5);
    expect(res.probabilityScore).toBeGreaterThanOrEqual(60);
    expect(res.probabilityTier).toMatch(/high|very_high/);
  });

  it('penalizes target that opposes current momentum', () => {
    // Current 24,000, Target 18,000 (-25%), while market is strongly bullish
    const opposedRes = calculatePriceEstimate(24000, 18000, sampleHistory, 0.35);

    // Contrasted with a target of 18,000 during a bearish market
    const bearHistory = [24000, 23000, 22000, 21000, 20000];
    const alignedRes = calculatePriceEstimate(20000, 18000, bearHistory, 0.35);

    expect(opposedRes.direction).toBe('down');
    expect(opposedRes.estimatedDays).toBeGreaterThan(alignedRes.estimatedDays);
    expect(alignedRes.probabilityScore).toBeGreaterThan(opposedRes.probabilityScore);
  });

  it('identifies targets inside and outside the historical envelope', () => {
    const insideRes = calculatePriceEstimate(22000, 23000, sampleHistory, 0.35);
    expect(insideRes.isInHistoricalRange).toBe(true);

    const outsideRes = calculatePriceEstimate(22000, 48000, sampleHistory, 0.35); // 2x ATH
    expect(outsideRes.isInHistoricalRange).toBe(false);
    expect(outsideRes.probabilityScore).toBeLessThan(insideRes.probabilityScore);
    expect(outsideRes.estimatedDays).toBeGreaterThan(insideRes.estimatedDays);
  });

  it('correctly assesses extreme outlier targets', () => {
    const outlierRes = calculatePriceEstimate(20000, 150000, sampleHistory, 0.35);

    expect(outlierRes.probabilityTier).toBe('extreme');
    expect(outlierRes.probabilityScore).toBeLessThan(25);
    expect(outlierRes.estimatedDaysLabel).toContain('> 30 Days');
  });
});
