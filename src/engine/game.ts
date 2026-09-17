import { RANKS, RANK_MAP, SHARK_MAP, CITY_MAP } from './constants';
import { generateCityMarket } from './economy';
import { PlayerState, GameLogEntry, MarketItem } from './types';

export interface GameEngineState {
  player: PlayerState;
  market: Record<string, MarketItem>;
  logs: GameLogEntry[];
}

export function createInitialState(): GameEngineState {
  const initialCityId = 'new_york';
  const initialSharkId = 'buddles';
  const shark = SHARK_MAP.get(initialSharkId);

  const player: PlayerState = {
    cash: 1000,
    bank: 0,
    debt: 1000,
    loanSharkId: initialSharkId,
    loanDaysLeft: shark ? shark.repayDays : 14,
    health: 100,
    maxHealth: 100,
    currentCityId: initialCityId,
    currentDay: 1,
    maxDays: 30,
    currentRankId: 'wannabe',
    daysHoldingRankCash: 0,
    inventory: {},
    weapons: {},
    ammo: {},
    armor: null,
    noScentCans: 0,
    vaults: {},
    visitedVaultToday: false,
    shipments: [],
    activeEncounter: null,
    isGameOver: false,
  };

  const { market } = generateCityMarket(initialCityId);

  const initialLogs: GameLogEntry[] = [
    {
      day: 1,
      city: 'New York',
      type: 'system',
      message: 'Welcome to New York! Buddles spotted you $1,000 cash, but expects his money back with interest.',
      timestamp: Date.now(),
    },
  ];

  return { player, market, logs: initialLogs };
}

export function getInventoryTotalUnits(player: PlayerState): number {
  return Object.values(player.inventory).reduce((sum, item) => sum + item.units, 0);
}

export function getCarryingCapacity(player: PlayerState): number {
  const rank = RANK_MAP.get(player.currentRankId);
  return rank ? rank.capacity : 10;
}

export function getTotalWealth(player: PlayerState): number {
  return player.cash + player.bank - player.debt;
}

export function getNextRank(player: PlayerState) {
  const currentIndex = RANKS.findIndex((r) => r.id === player.currentRankId);
  if (currentIndex >= 0 && currentIndex < RANKS.length - 1) {
    return RANKS[currentIndex + 1];
  }
  return null;
}

export interface ActionResult {
  success: boolean;
  message: string;
}

export function buyDrug(
  state: GameEngineState,
  drugId: string,
  units: number
): ActionResult {
  if (units <= 0) return { success: false, message: 'Invalid quantity' };

  const marketItem = state.market[drugId];
  if (!marketItem) return { success: false, message: 'Drug not found in market' };
  if (marketItem.availableUnits < units) {
    return { success: false, message: 'Not enough units available in market' };
  }

  const totalCost = marketItem.price * units;
  if (state.player.cash < totalCost) {
    return { success: false, message: "You can't afford this purchase" };
  }

  const currentUnits = getInventoryTotalUnits(state.player);
  const capacity = getCarryingCapacity(state.player);
  if (currentUnits + units > capacity) {
    return { success: false, message: 'You do not have enough pocket/coat capacity' };
  }

  // Deduct cash & market units
  state.player.cash -= totalCost;
  marketItem.availableUnits -= units;

  // Update inventory with weighted average cost
  const existing = state.player.inventory[drugId];
  if (existing) {
    const totalExistingVal = existing.units * existing.avgCost;
    const newTotalUnits = existing.units + units;
    const newAvgCost = Math.round((totalExistingVal + totalCost) / newTotalUnits);
    state.player.inventory[drugId] = {
      drugId,
      units: newTotalUnits,
      avgCost: newAvgCost,
    };
  } else {
    state.player.inventory[drugId] = {
      drugId,
      units,
      avgCost: marketItem.price,
    };
  }

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'market',
    message: `Bought ${units}x ${drugId} for $${totalCost.toLocaleString()} ($${marketItem.price.toLocaleString()}/unit).`,
    timestamp: Date.now(),
  });

  return { success: true, message: `Successfully bought ${units} units.` };
}

export function sellDrug(
  state: GameEngineState,
  drugId: string,
  units: number
): ActionResult {
  if (units <= 0) return { success: false, message: 'Invalid quantity' };

  const inventoryItem = state.player.inventory[drugId];
  if (!inventoryItem || inventoryItem.units < units) {
    return { success: false, message: 'You do not hold that many units' };
  }

  const marketItem = state.market[drugId];
  if (!marketItem) return { success: false, message: 'No buyers in this city' };

  const totalRevenue = marketItem.price * units;
  const costBasis = inventoryItem.avgCost * units;
  const profit = totalRevenue - costBasis;

  state.player.cash += totalRevenue;
  inventoryItem.units -= units;

  if (inventoryItem.units <= 0) {
    delete state.player.inventory[drugId];
  }

  const profitSign = profit >= 0 ? '+' : '-';
  const profitText = `${profitSign}$${Math.abs(profit).toLocaleString()}`;

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'market',
    message: `Sold ${units}x ${drugId} for $${totalRevenue.toLocaleString()} (${profitText} profit).`,
    timestamp: Date.now(),
  });

  return { success: true, message: `Successfully sold ${units} units.` };
}

export function dumpDrug(
  state: GameEngineState,
  drugId: string,
  units: number
): ActionResult {
  const inventoryItem = state.player.inventory[drugId];
  if (!inventoryItem || inventoryItem.units < units) {
    return { success: false, message: 'You do not hold that many units' };
  }

  inventoryItem.units -= units;
  if (inventoryItem.units <= 0) {
    delete state.player.inventory[drugId];
  }

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'market',
    message: `Dumped ${units}x ${drugId} into the sewer to free up space.`,
    timestamp: Date.now(),
  });

  return { success: true, message: `Dumped ${units} units.` };
}

export function depositBank(state: GameEngineState, amount: number): ActionResult {
  if (amount <= 0) return { success: false, message: 'Invalid amount' };
  if (state.player.cash < amount) return { success: false, message: 'Not enough cash on hand' };

  state.player.cash -= amount;
  state.player.bank += amount;

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'finance',
    message: `Deposited $${amount.toLocaleString()} into your offshore bank account.`,
    timestamp: Date.now(),
  });

  return { success: true, message: 'Deposit successful' };
}

export function withdrawBank(state: GameEngineState, amount: number): ActionResult {
  if (amount <= 0) return { success: false, message: 'Invalid amount' };
  if (state.player.bank < amount) return { success: false, message: 'Insufficient bank balance' };

  state.player.bank -= amount;
  state.player.cash += amount;

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'finance',
    message: `Withdrew $${amount.toLocaleString()} from your bank account.`,
    timestamp: Date.now(),
  });

  return { success: true, message: 'Withdrawal successful' };
}

export function repayLoan(state: GameEngineState, amount: number): ActionResult {
  if (amount <= 0) return { success: false, message: 'Invalid amount' };
  if (state.player.debt <= 0) return { success: false, message: 'You have no outstanding debt' };
  if (state.player.cash < amount) return { success: false, message: 'Not enough cash' };

  const actualPayment = Math.min(amount, state.player.debt);
  state.player.cash -= actualPayment;
  state.player.debt -= actualPayment;

  if (state.player.debt === 0) {
    state.player.loanSharkId = null;
    state.player.loanDaysLeft = 0;
  }

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'finance',
    message: `Paid $${actualPayment.toLocaleString()} toward your loan shark debt. (Remaining: $${state.player.debt.toLocaleString()})`,
    timestamp: Date.now(),
  });

  return { success: true, message: 'Payment recorded' };
}

export function borrowLoan(state: GameEngineState, sharkId: string, amount: number): ActionResult {
  if (state.player.debt > 0) {
    return { success: false, message: 'You already have an outstanding debt with a loan shark' };
  }

  const shark = SHARK_MAP.get(sharkId);
  if (!shark) return { success: false, message: 'Loan shark not found' };

  const maxAllowed = Math.min(shark.maxLoan, Math.max(1000, state.player.cash * shark.multiplier));
  if (amount > maxAllowed) {
    return { success: false, message: `Shark refuses to lend more than $${Math.round(maxAllowed).toLocaleString()}` };
  }

  state.player.cash += amount;
  state.player.debt = amount;
  state.player.loanSharkId = sharkId;
  state.player.loanDaysLeft = shark.repayDays;

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'finance',
    message: `Borrowed $${amount.toLocaleString()} from ${shark.name} at ${Math.round(shark.interestRate * 100)}% daily interest! Repayment due in ${shark.repayDays} days.`,
    timestamp: Date.now(),
  });

  return { success: true, message: 'Loan approved' };
}

export function advanceDay(state: GameEngineState, isTravel = false): void {
  if (state.player.isGameOver) return;

  const currentCity = CITY_MAP.get(state.player.currentCityId)?.name ?? 'City';

  // 1. Debt compounding interest
  if (state.player.debt > 0 && state.player.loanSharkId) {
    const shark = SHARK_MAP.get(state.player.loanSharkId);
    const rate = shark ? shark.interestRate : 0.1;
    const interest = Math.round(state.player.debt * rate);
    state.player.debt += interest;
    state.player.loanDaysLeft = Math.max(0, state.player.loanDaysLeft - 1);

    if (state.player.loanDaysLeft === 0 && state.player.debt > 0) {
      // Overdue! Loan shark enforcers attack!
      state.logs.unshift({
        day: state.player.currentDay,
        city: currentCity,
        type: 'combat',
        message: `WARNING: Your loan with ${shark?.name ?? 'the shark'} is overdue! Enforcers have tracked you down!`,
        timestamp: Date.now(),
      });
      state.player.activeEncounter = {
        id: `shark_${Date.now()}`,
        enemyId: 'shark_enforcers',
        enemyName: `${shark?.name ?? 'Loan Shark'}'s Enforcers`,
        count: 3,
        danger: 6,
        bribeCost: Math.round(state.player.debt * 0.5),
        canFlee: true,
        canBribe: true,
        status: 'active',
      };
    }
  }

  // 2. Bank interest: 0.1% daily
  if (state.player.bank > 0) {
    const bankInterest = Math.round(state.player.bank * 0.001);
    state.player.bank += bankInterest;
  }

  // 3. Health recovery for small scrapes
  if (state.player.health < 100 && state.player.health > 80) {
    state.player.health = Math.min(100, state.player.health + 2);
  }

  // 4. Rank promotion check (holding wealth for 3 days)
  const totalWealth = getTotalWealth(state.player);
  const nextRank = getNextRank(state.player);
  if (nextRank && totalWealth >= nextRank.cashRequired) {
    state.player.daysHoldingRankCash += 1;
    if (state.player.daysHoldingRankCash >= 3) {
      state.player.currentRankId = nextRank.id;
      state.player.maxDays += nextRank.bonusDays;
      state.player.daysHoldingRankCash = 0;
      state.logs.unshift({
        day: state.player.currentDay,
        city: currentCity,
        type: 'system',
        message: `PROMOTION! You are now a ${nextRank.name}! Your carrying container upgraded to ${nextRank.container} (${nextRank.capacity} units). Earned +${nextRank.bonusDays} bonus days!`,
        timestamp: Date.now(),
      });
    }
  } else {
    state.player.daysHoldingRankCash = 0;
  }

  // 5. Advance calendar
  state.player.currentDay += 1;
  state.player.visitedVaultToday = false;

  // Check game over by calendar
  if (state.player.currentDay > state.player.maxDays) {
    state.player.isGameOver = true;
    state.player.gameOverReason = `Time limit reached! You finished your run with $${totalWealth.toLocaleString()} net worth.`;
    state.logs.unshift({
      day: state.player.currentDay,
      city: currentCity,
      type: 'system',
      message: `GAME OVER: ${state.player.gameOverReason}`,
      timestamp: Date.now(),
    });
    return;
  }

  // 6. Regenerate market for current city
  const { market, events } = generateCityMarket(state.player.currentCityId);
  state.market = market;

  for (const ev of events) {
    state.logs.unshift({
      day: state.player.currentDay,
      city: currentCity,
      type: 'event',
      message: ev,
      timestamp: Date.now(),
    });
  }

  // 7. Random daily encounters (only if not already in combat)
  if (!state.player.activeEncounter && !isTravel) {
    rollRandomEncounter(state);
  }
}

function rollRandomEncounter(state: GameEngineState): void {
  const roll = Math.random();
  const currentCity = CITY_MAP.get(state.player.currentCityId)?.name ?? 'City';

  if (roll < 0.05) {
    // Found wallet
    const found = Math.floor(150 + Math.random() * 600);
    state.player.cash += found;
    state.logs.unshift({
      day: state.player.currentDay,
      city: currentCity,
      type: 'event',
      message: `Lucky find! You found an abandoned wallet on the street with $${found.toLocaleString()} in cash!`,
      timestamp: Date.now(),
    });
  } else if (roll < 0.09) {
    // Pickpocket on subway
    if (state.player.cash > 200) {
      const lost = Math.min(state.player.cash, Math.floor(100 + Math.random() * 400));
      state.player.cash -= lost;
      state.logs.unshift({
        day: state.player.currentDay,
        city: currentCity,
        type: 'event',
        message: `Unlucky! You get off the subway and find $${lost.toLocaleString()} has been lifted from your pocket!`,
        timestamp: Date.now(),
      });
    }
  } else if (roll < 0.13) {
    // Police patrol encounter
    const policeRisk = CITY_MAP.get(state.player.currentCityId)?.policeRisk ?? 0.2;
    if (Math.random() < policeRisk) {
      state.player.activeEncounter = {
        id: `encounter_${Date.now()}`,
        enemyId: 'police',
        enemyName: 'the Police',
        count: Math.floor(2 + Math.random() * 3),
        danger: 5,
        bribeCost: Math.max(500, Math.round(state.player.cash * 0.3)),
        canFlee: true,
        canBribe: true,
        status: 'active',
      };
      state.logs.unshift({
        day: state.player.currentDay,
        city: currentCity,
        type: 'combat',
        message: 'Sirens blare! The police are closing in on your position!',
        timestamp: Date.now(),
      });
    }
  }
}

export function travelToCity(state: GameEngineState, targetCityId: string): ActionResult {
  if (state.player.currentCityId === targetCityId) {
    return { success: false, message: 'You are already in this city' };
  }

  const targetCity = CITY_MAP.get(targetCityId);
  if (!targetCity) return { success: false, message: 'Unknown destination' };

  if (state.player.cash < targetCity.flightCost) {
    return { success: false, message: `You need $${targetCity.flightCost} for the plane ticket` };
  }

  state.player.cash -= targetCity.flightCost;
  const originName = CITY_MAP.get(state.player.currentCityId)?.name ?? 'City';
  state.player.currentCityId = targetCityId;

  state.logs.unshift({
    day: state.player.currentDay,
    city: originName,
    type: 'travel',
    message: `Flew to ${targetCity.name} for $${targetCity.flightCost}.`,
    timestamp: Date.now(),
  });

  // Check airport sniffer dogs
  const totalDrugs = getInventoryTotalUnits(state.player);
  if (totalDrugs > 0) {
    const maskedUnits = state.player.noScentCans * 100;
    const unmasked = Math.max(0, totalDrugs - maskedUnits);

    if (unmasked > 0) {
      const dogRoll = Math.random();
      if (dogRoll < targetCity.dogRisk) {
        state.player.activeEncounter = {
          id: `airport_${Date.now()}`,
          enemyId: 'airport_security',
          enemyName: 'Airport Security & Drug Dogs',
          count: 4,
          danger: 6,
          bribeCost: Math.max(1000, Math.round(state.player.cash * 0.4)),
          canFlee: false,
          canBribe: true,
          status: 'active',
        };
        state.logs.unshift({
          day: state.player.currentDay,
          city: targetCity.name,
          type: 'combat',
          message: `ALARM! Airport sniffer dogs detected your unmasked contraband! Customs officers surround you!`,
          timestamp: Date.now(),
        });
      }
    }

    // Consume 1 can of No-Scent during international flight
    if (state.player.noScentCans > 0) {
      state.player.noScentCans -= 1;
    }
  }

  advanceDay(state, true);
  return { success: true, message: `Arrived in ${targetCity.name}.` };
}

export function healAtHospital(state: GameEngineState, targetHp: number): ActionResult {
  if (state.player.health >= targetHp) {
    return { success: false, message: 'You are already in good health' };
  }

  const hpToHeal = targetHp - state.player.health;
  const cost = Math.round(hpToHeal * 25 + Math.pow(100 - state.player.health, 1.3) * 5);

  if (state.player.cash < cost) {
    return { success: false, message: `Medical care costs $${cost.toLocaleString()}, but you only have $${state.player.cash.toLocaleString()}` };
  }

  state.player.cash -= cost;
  state.player.health = targetHp;

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'system',
    message: `Underworld doctors patched you up to ${targetHp}% HP for $${cost.toLocaleString()}.`,
    timestamp: Date.now(),
  });

  return { success: true, message: 'Health restored' };
}
