export type CorruptOfficialId =
  | 'airport_baggage_handler'
  | 'police_dispatcher'
  | 'fincen_auditor'
  | 'federal_judge'
  | 'dea_special_agent'
  | 'customs_port_director'
  | 'prison_warden';

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

export interface FederalInformant {
  id: string;
  codename: string;
  name: string;
  role: string;
  locationCityId: string;
  agencyTarget: 'DEA' | 'FBI' | 'IRS-CI' | 'CBP' | 'NYPD Task Force';
  threatLevel: 'low' | 'moderate' | 'high' | 'critical';
  snitchProgress: number; // 0-100% how close they are to handing over a complete grand jury indictment packet
  status: 'active_snitch' | 'flipped_double_agent' | 'neutralized' | 'bribed_silent';
  dossier: string;
  leakIntelligence: string;
  bribeHushCost: number;
  flipDoubleAgentCost: number;
  contractHitCost: number;
  daysActive: number;
}

export interface FederalWiretapTranscript {
  id: string;
  frequency: string;
  surveillanceTarget: string;
  interceptAgency:
    | 'DEA Special Ops'
    | 'FBI Wiretap Division'
    | 'FinCEN SIGINT'
    | 'CBP Maritime Radar'
    | 'ATF Violent Crimes';
  status: 'scrambled' | 'intercepted' | 'decrypted';
  recordedDay: number;
  cityId: string;
  headline: string;
  transcript: string;
  marketIntel: {
    drugId?: string;
    cityId?: string;
    effectDescription: string;
    actionableTip: string;
  };
  scrambleCost: number; // Cost to burn / EMP scramble
  blackMarketValue: number; // Cash earned if sold to underworld brokers
  sold?: boolean;
  scrambled?: boolean;
}
