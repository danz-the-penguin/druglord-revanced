/**
 * Target Price & Time-to-Peak Estimator Engine
 * Algorithmic projection of days-to-target and probability scores
 * based on historical volatility, momentum drift, and asset price envelopes.
 */

export interface PriceEstimateResult {
  targetPrice: number;
  currentPrice: number;
  priceDelta: number;
  percentDelta: number;
  direction: 'up' | 'down' | 'reached';
  estimatedDays: number;
  estimatedDaysLabel: string;
  probabilityScore: number; // 0 to 100
  probabilityTier: 'very_high' | 'high' | 'moderate' | 'low' | 'extreme';
  probabilityLabel: string;
  momentumState: 'strong_bull' | 'moderate_bull' | 'neutral' | 'moderate_bear' | 'strong_bear';
  momentumLabel: string;
  allTimeHigh: number;
  allTimeLow: number;
  isInHistoricalRange: boolean;
  dailyVolatilityPct: number;
  recommendation: string;
}

/**
 * Calculates algorithmic projection for a target price given historical prices and volatility.
 *
 * @param currentPrice - Current market spot price
 * @param targetPrice - Player-defined target price threshold
 * @param priceHistory - Historical price series (e.g. 14D series)
 * @param drugVolatility - Drug base volatility coefficient (e.g. 0.15 to 0.45)
 */
export function calculatePriceEstimate(
  currentPrice: number,
  targetPrice: number,
  priceHistory: number[] = [],
  drugVolatility: number = 0.25
): PriceEstimateResult {
  const safeCurrent = Math.max(1, Math.round(currentPrice));
  const safeTarget = Math.max(1, Math.round(targetPrice));

  const series = priceHistory.length > 0 ? priceHistory : [safeCurrent];
  const allTimeHigh = Math.max(...series, safeCurrent);
  const allTimeLow = Math.min(...series, safeCurrent);

  const priceDelta = safeTarget - safeCurrent;
  const percentDelta = Math.round(((priceDelta) / safeCurrent) * 1000) / 10;

  // Direction
  const direction: 'up' | 'down' | 'reached' =
    Math.abs(priceDelta) < 1 ? 'reached' : priceDelta > 0 ? 'up' : 'down';

  // Momentum Drift Calculation (weighted moving average velocity of recent points)
  let driftPct = 0;
  if (series.length >= 2) {
    const recentPoints = series.slice(-Math.min(5, series.length));
    const firstP = recentPoints[0];
    const lastP = recentPoints[recentPoints.length - 1];
    const ticks = recentPoints.length - 1;
    driftPct = ticks > 0 ? (lastP - firstP) / (firstP * ticks) : 0;
  }

  // Momentum State Classification
  let momentumState: PriceEstimateResult['momentumState'] = 'neutral';
  let momentumLabel = 'STEADY / NEUTRAL';
  if (driftPct >= 0.08) {
    momentumState = 'strong_bull';
    momentumLabel = 'STRONG BULLISH BREAKOUT (+8%/day)';
  } else if (driftPct >= 0.02) {
    momentumState = 'moderate_bull';
    momentumLabel = 'MODERATE BULLISH ACCUMULATION';
  } else if (driftPct <= -0.08) {
    momentumState = 'strong_bear';
    momentumLabel = 'SEVERE BEARISH CRASH (-8%/day)';
  } else if (driftPct <= -0.02) {
    momentumState = 'moderate_bear';
    momentumLabel = 'MODERATE BEARISH RETRACEMENT';
  }

  // Expected Daily Volatility Range
  // Baseline swing per day derived from asset volatility
  const dailyVolatilityPct = Math.max(0.04, Math.round(drugVolatility * 0.35 * 100) / 100);

  // Historical envelope check
  const isInHistoricalRange = safeTarget >= allTimeLow && safeTarget <= allTimeHigh;

  // -------------------------------------------------------------
  // 1. Estimated Days to Target Calculation
  // -------------------------------------------------------------
  let estimatedDays = 0;
  let estimatedDaysLabel = 'REACHED TODAY';

  if (direction !== 'reached') {
    const absFraction = Math.abs(safeTarget - safeCurrent) / safeCurrent;

    // Momentum Alignment Factor
    const isBullTarget = direction === 'up';
    const isMomentumAligned =
      (isBullTarget && (momentumState === 'strong_bull' || momentumState === 'moderate_bull')) ||
      (!isBullTarget && (momentumState === 'strong_bear' || momentumState === 'moderate_bear'));

    const isMomentumOpposed =
      (isBullTarget && (momentumState === 'strong_bear' || momentumState === 'moderate_bear')) ||
      (!isBullTarget && (momentumState === 'strong_bull' || momentumState === 'moderate_bull'));

    // Effective daily pace
    let effectiveDailyRate = dailyVolatilityPct * 0.75;
    if (isMomentumAligned) {
      effectiveDailyRate += Math.abs(driftPct) * 0.65;
    } else if (isMomentumOpposed) {
      effectiveDailyRate *= 0.6; // Lag due to trend resistance
    }

    effectiveDailyRate = Math.max(0.02, effectiveDailyRate);
    const rawDays = absFraction / effectiveDailyRate;

    // Penalty for counter-trend reversals
    const reversalPenalty = isMomentumOpposed ? 2 : 0;
    estimatedDays = Math.max(1, Math.round(rawDays + reversalPenalty));

    // Cap labels
    if (estimatedDays <= 1) {
      estimatedDaysLabel = '1 Day (Imminent)';
    } else if (estimatedDays <= 3) {
      estimatedDaysLabel = `~${estimatedDays} Days (Short-Term)`;
    } else if (estimatedDays <= 7) {
      estimatedDaysLabel = `~${estimatedDays} Days (Medium-Term)`;
    } else if (estimatedDays <= 14) {
      estimatedDaysLabel = `~${estimatedDays} Days (Extended Run)`;
    } else if (estimatedDays <= 30) {
      estimatedDaysLabel = `~${estimatedDays} Days (Long-Term Horizon)`;
    } else {
      estimatedDays = 30;
      estimatedDaysLabel = '> 30 Days (Outlier Target)';
    }
  }

  // -------------------------------------------------------------
  // 2. Probability Score Calculation (0 - 100)
  // -------------------------------------------------------------
  let probabilityScore = 75;

  if (direction === 'reached') {
    probabilityScore = 100;
  } else {
    // A. Historical Envelope Distance
    if (safeTarget > allTimeHigh) {
      // Exceeding ATH
      const excessRatio = (safeTarget - allTimeHigh) / allTimeHigh;
      probabilityScore -= Math.min(60, Math.round(excessRatio * 90));
    } else if (safeTarget < allTimeLow) {
      // Below ATL
      const deficitRatio = (allTimeLow - safeTarget) / allTimeLow;
      probabilityScore -= Math.min(60, Math.round(deficitRatio * 90));
    } else {
      // Inside historical range: high confidence baseline
      probabilityScore = 80;
    }

    // B. Distance Penalty
    const percentDistance = Math.abs(percentDelta);
    if (percentDistance > 100) {
      probabilityScore -= Math.min(35, Math.round((percentDistance - 100) * 0.35));
    } else if (percentDistance > 40) {
      probabilityScore -= Math.round((percentDistance - 40) * 0.25);
    }

    // C. Momentum Synergy Modifier
    if (direction === 'up') {
      if (momentumState === 'strong_bull') probabilityScore += 18;
      else if (momentumState === 'moderate_bull') probabilityScore += 10;
      else if (momentumState === 'moderate_bear') probabilityScore -= 14;
      else if (momentumState === 'strong_bear') probabilityScore -= 24;
    } else {
      // Target is below current price
      if (momentumState === 'strong_bear') probabilityScore += 18;
      else if (momentumState === 'moderate_bear') probabilityScore += 10;
      else if (momentumState === 'moderate_bull') probabilityScore -= 14;
      else if (momentumState === 'strong_bull') probabilityScore -= 24;
    }

    // D. Volatility Factor (higher volatility gives higher odds of reaching large targets)
    if (percentDistance > 50 && drugVolatility >= 0.3) {
      probabilityScore += Math.round(drugVolatility * 15);
    }

    // Clamp between 3% and 98%
    probabilityScore = Math.max(3, Math.min(98, probabilityScore));
  }

  // Probability Tier and Label
  let probabilityTier: PriceEstimateResult['probabilityTier'] = 'moderate';
  let probabilityLabel = 'MODERATE (50-50 CHANCE)';
  if (probabilityScore >= 85) {
    probabilityTier = 'very_high';
    probabilityLabel = 'VERY HIGH (Strong Momentum Convergence)';
  } else if (probabilityScore >= 65) {
    probabilityTier = 'high';
    probabilityLabel = 'HIGH PROBABILITY (Favorable Trend)';
  } else if (probabilityScore >= 40) {
    probabilityTier = 'moderate';
    probabilityLabel = 'BALANCED (Market Volatility Dependent)';
  } else if (probabilityScore >= 20) {
    probabilityTier = 'low';
    probabilityLabel = 'SPECULATIVE (Requires Market Shock)';
  } else {
    probabilityTier = 'extreme';
    probabilityLabel = 'EXTREME LONGSHOT (Deep Outlier)';
  }

  // -------------------------------------------------------------
  // 3. Narrative Recommendation
  // -------------------------------------------------------------
  let recommendation = '';
  if (direction === 'reached') {
    recommendation = `Target price $${safeTarget.toLocaleString()} matches current spot price exactly.`;
  } else if (probabilityScore >= 75) {
    recommendation = `High probability target. Momentum is favorable; consider holding or accumulating stash for the projected peak in ${estimatedDaysLabel}.`;
  } else if (probabilityScore >= 50) {
    recommendation = `Target is achievable within current market cycle, but monitor local police heat and cartel turf wars for unexpected shocks.`;
  } else if (probabilityScore >= 25) {
    recommendation = `Contrarian target. Current momentum resists this level; would likely require an informant wire event or port strike to trigger.`;
  } else {
    recommendation = `Extreme target far outside typical price distribution. Highly speculative unless a global macro shock or all-out turf war occurs.`;
  }

  return {
    targetPrice: safeTarget,
    currentPrice: safeCurrent,
    priceDelta,
    percentDelta,
    direction,
    estimatedDays,
    estimatedDaysLabel,
    probabilityScore,
    probabilityTier,
    probabilityLabel,
    momentumState,
    momentumLabel,
    allTimeHigh,
    allTimeLow,
    isInHistoricalRange,
    dailyVolatilityPct,
    recommendation,
  };
}
