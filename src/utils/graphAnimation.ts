/**
 * Graph Animation & Playback Engine Utilities
 * Handles price series interpolation, slope detection (rising/falling),
 * and playback speed stepping.
 */

export const DEFAULT_SPEEDS = [0.25, 0.5, 1, 2, 4, 8];

/**
 * Linearly interpolates between price points given a floating progress index.
 */
export function interpolateSeriesPrice(series: number[], progress: number, fallback = 100): number {
  if (!series || series.length === 0) return fallback;
  if (series.length === 1) return series[0];

  const maxIdx = series.length - 1;
  const clamped = Math.max(0, Math.min(maxIdx, progress));
  const currIdx = Math.floor(clamped);
  const frac = clamped - currIdx;
  const nextIdx = Math.min(maxIdx, currIdx + 1);

  const p1 = series[currIdx];
  const p2 = series[nextIdx];
  return Math.round(p1 + (p2 - p1) * frac);
}

/**
 * Calculates instantaneous slope between the current interval of the series.
 * Returns > 0 for rising, < 0 for falling, and 0 for flat.
 */
export function getSeriesSlope(series: number[], progress: number): number {
  if (!series || series.length <= 1) return 0;

  const maxIdx = series.length - 1;
  const clamped = Math.max(0, Math.min(maxIdx, progress));
  const currIdx = Math.floor(clamped);
  const nextIdx = Math.min(maxIdx, currIdx + 1);

  return series[nextIdx] - series[currIdx];
}

/**
 * Steps the playback speed up or down through the preset list.
 */
export function stepPlaybackSpeed(
  currentSpeed: number,
  direction: 'increase' | 'decrease',
  speeds = DEFAULT_SPEEDS
): number {
  const idx = speeds.indexOf(currentSpeed);
  if (direction === 'increase') {
    if (idx >= 0 && idx < speeds.length - 1) return speeds[idx + 1];
    if (idx === -1) return 2.0;
    return speeds[speeds.length - 1];
  } else {
    if (idx > 0) return speeds[idx - 1];
    if (idx === -1) return 0.5;
    return speeds[0];
  }
}
