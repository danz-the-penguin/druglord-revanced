export type LabType =
  | 'hydro_greenhouse'
  | 'chemical_reflux'
  | 'pill_press'
  | 'bio_reactor';

export interface LabRoom {
  id: LabType;
  name: string;
  codename: string;
  cost: number;
  eligibleProperties: string[];
  description: string;
  flavor: string;
  icon: string;
  outputSummary: string;
}

export interface PrecursorChemical {
  id: string;
  name: string;
  chemicalFormula: string;
  casNumber: string;
  basePrice: number;
  seaportDiscount: number;
  description: string;
  hazardRating: 'Low' | 'Moderate' | 'High' | 'Severe';
}

export interface RecipeIngredient {
  precursorId: string;
  amount: number;
}

export interface CookRecipe {
  id: string;
  labType: LabType;
  name: string;
  outputDrugId: string;
  outputUnits: number;
  cookDays: number;
  ingredients: RecipeIngredient[];
  heatProduced: number;
  description: string;
}

export interface ActiveCookBatch {
  id: string;
  propertyId: string;
  labType: LabType;
  recipeId: string;
  recipeName: string;
  outputDrugId: string;
  outputUnits: number;
  daysRemaining: number;
  totalDays: number;
  status: 'cooking' | 'ready' | 'collected';
  startedAtDay: number;
  batchCount: number;
}
