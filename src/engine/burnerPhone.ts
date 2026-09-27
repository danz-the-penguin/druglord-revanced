import { PlayerState, BurnerMessage } from './types';
import { SHARK_MAP } from './constants';

export const INITIAL_BURNER_MESSAGES: BurnerMessage[] = [
  {
    id: 'msg_welcome',
    sender: 'Anonymous Informant',
    role: 'informant',
    text: 'Welcome to the circuit. Keep your head down, watch local police heat, and remember: Loan Shark Buddles doesn\'t do extensions.',
    day: 1,
    read: false,
    actionType: 'open_market',
    actionLabel: 'View Market',
  },
  {
    id: 'msg_shark_intro',
    sender: 'Buddles (Loan Shark)',
    role: 'shark',
    text: 'You took $2,000 from me, kid. Vig is 10% daily. Don\'t test my patience.',
    day: 1,
    read: false,
    actionType: 'pay_shark',
    actionLabel: 'Repay Debt',
  },
];

export function generateDailyBurnerMessages(player: PlayerState): BurnerMessage[] {
  const messages: BurnerMessage[] = [];
  const shark = player.loanSharkId ? SHARK_MAP.get(player.loanSharkId) : null;
  const currentHeat = player.cityHeat?.[player.currentCityId] ?? 0;

  // 1. Loan Shark Alerts
  if (player.debt > 0) {
    const daysLeft = player.loanDaysLeft ?? 0;
    const sharkName = shark?.name ?? 'Loan Shark';

    if (daysLeft <= 0) {
      messages.push({
        id: `shark_overdue_${player.currentDay}`,
        sender: sharkName,
        role: 'shark',
        text: `You're overdue on $${player.debt.toLocaleString()}! My enforcers are already staking out your safehouse. PAY UP TODAY.`,
        day: player.currentDay,
        read: false,
        actionType: 'pay_shark',
        actionLabel: 'Pay Debt Now',
      });
    } else if (daysLeft <= 2) {
      messages.push({
        id: `shark_warning_${player.currentDay}`,
        sender: sharkName,
        role: 'shark',
        text: `Tick tock, kid. Only ${daysLeft} day${daysLeft === 1 ? '' : 's'} left on your loan. Have my $${player.debt.toLocaleString()} ready.`,
        day: player.currentDay,
        read: false,
        actionType: 'pay_shark',
        actionLabel: 'Pay Debt',
      });
    }
  }

  // 2. High Heat / Police Informant Alert
  if (currentHeat >= 65) {
    messages.push({
      id: `police_heat_${player.currentDay}`,
      sender: 'Underworld Pager',
      role: 'police',
      text: `⚠️ HOT PURSUIT: Police Heat reached ${currentHeat}% in this precinct! K9 units and plainclothes squads are patrolling the airport corridors.`,
      day: player.currentDay,
      read: false,
      actionType: 'dismiss',
      actionLabel: 'Understood',
    });
  }

  // 3. Hostile Takeover Alert
  if (player.activeHostileTakeover && player.activeHostileTakeover.status === 'active') {
    messages.push({
      id: `hostile_takeover_${player.currentDay}`,
      sender: 'Corporate Spy',
      role: 'front',
      text: `🚨 HOSTILE RAID: ${player.activeHostileTakeover.syndicateName} launched a raid on your shell shares! Check Corporate Portfolio to defend or tender.`,
      day: player.currentDay,
      read: false,
      actionType: 'open_market',
      actionLabel: 'Review Fronts',
    });
  }

  // 4. Swiss Banker Matured Bonds
  const maturedBonds = player.bearerBonds?.filter((b) => !b.isClaimed && player.currentDay >= b.matureDay) ?? [];
  if (maturedBonds.length > 0) {
    messages.push({
      id: `swiss_bonds_${player.currentDay}`,
      sender: 'Zurich Private Banker',
      role: 'banker',
      text: `Guten Tag. You have ${maturedBonds.length} matured bearer bond tranche(s) ready for disbursement at the Zurich vault counter.`,
      day: player.currentDay,
      read: false,
      actionType: 'open_market',
      actionLabel: 'Claim Yield',
    });
  }

  return messages;
}
