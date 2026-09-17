import { SyndicateId } from './types';

export type MacroEventType =
  | 'deep_web_takedown'
  | 'port_strike'
  | 'federal_task_force'
  | 'border_clashes'
  | 'precursor_embargo';

export interface ActiveTurfWar {
  id: string;
  attackerSyndicateId: SyndicateId;
  defenderSyndicateId: SyndicateId;
  attackerName: string;
  defenderName: string;
  contestedCityIds: string[];
  startDay: number;
  durationDays: number;
  daysRemaining: number;
  priceSurgeMultiplier: number; // e.g. 2.5 = +150% to +250% surge
  travelDangerBonus: number;    // e.g. +0.25 (25% extra combat ambush chance)
  headline: string;
  description: string;
  affectedDrugIds: string[];
}

export interface ActiveMacroEvent {
  id: string;
  type: MacroEventType;
  title: string;
  headline: string;
  description: string;
  startDay: number;
  durationDays: number;
  daysRemaining: number;
  affectedCityIds?: string[];   // undefined means global
  affectedDrugIds?: string[];   // undefined means all
  priceMultiplier?: number;     // multiplier applied to market price
  customsRiskMultiplier?: number; // multiplier applied to airport dog/police risk
  courierDelayDays?: number;    // delays shipments
  icon: string;
  severity: 'info' | 'warning' | 'danger';
}
