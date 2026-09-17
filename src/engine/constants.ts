import drugsData from '../data/drugs.json';
import citiesData from '../data/cities.json';
import weaponsData from '../data/weapons.json';
import ranksData from '../data/ranks.json';
import loansharksData from '../data/loansharks.json';
import shippersData from '../data/shippers.json';
import eventsData from '../data/events.json';
import propertiesData from '../data/properties.json';
import { Drug, City, Weapon, Rank, LoanShark, Property, Shipper } from './types';

export const DRUGS: Drug[] = drugsData as Drug[];
export const CITIES: City[] = citiesData as unknown as City[];
export const WEAPONS: Weapon[] = weaponsData as unknown as Weapon[];
export const RANKS: Rank[] = ranksData as Rank[];
export const LOAN_SHARKS: LoanShark[] = loansharksData as LoanShark[];
export const PROPERTIES: Property[] = propertiesData as Property[];
export const SHIPPERS: Shipper[] = shippersData as Shipper[];
export const EVENTS = eventsData;

export const DRUG_MAP = new Map<string, Drug>(DRUGS.map((d) => [d.id, d]));
export const CITY_MAP = new Map<string, City>(CITIES.map((c) => [c.id, c]));
export const WEAPON_MAP = new Map<string, Weapon>(WEAPONS.map((w) => [w.id, w]));
export const RANK_MAP = new Map<string, Rank>(RANKS.map((r) => [r.id, r]));
export const SHARK_MAP = new Map<string, LoanShark>(LOAN_SHARKS.map((s) => [s.id, s]));
export const PROPERTY_MAP = new Map<string, Property>(PROPERTIES.map((p) => [p.id, p]));
export const SHIPPER_MAP = new Map<string, Shipper>(SHIPPERS.map((s) => [s.id, s]));
