export type CorruptOfficialId = 'airport_baggage_handler' | 'police_dispatcher' | 'fincen_auditor';

export interface CorruptOfficialDefinition {
  id: CorruptOfficialId;
  name: string;
  roleTitle: string;
  agency: string;
  initialBribeCost: number; // One-time placement bribe to recruit
  dailyRetainer: number; // Daily payroll/bribe upkeep
  monthlyCostEstimate: number; // Displayed monthly fee (30 * dailyRetainer)
  perkTitle: string;
  perkDescription: string;
  icon: string;
  quote: string;
}

export interface CorruptOfficialState {
  id: CorruptOfficialId;
  hiredDay: number;
  active: boolean;
  assignedBusinessId?: string;
  totalBribesPaid: number;
}

export interface SovereignSanctuary {
  cityId: string;
  name: string;
  country: string;
  extraditionShield: string;
  icon: string;
  description: string;
}

export interface RaidWarning {
  cityId: string;
  day: number;
  message: string;
  severity: 'warning' | 'imminent';
}
