/**
 * NY Tax Tipping Point Calculator - Data Types
 *
 * All types for the tax computation model, behavioral response,
 * and UI state management.
 */

/** A single income cohort with filer counts, income, and tax data */
export interface IncomeCohort {
  /** Label for the bracket, e.g., "$200K-$500K" */
  label: string;
  /** Lower bound of AGI range (inclusive) */
  agiMin: number;
  /** Upper bound of AGI range (exclusive, Infinity for top bracket) */
  agiMax: number;
  /** Number of tax filers in this bracket */
  filerCount: number;
  /** Total AGI for all filers in this bracket */
  totalAgi: number;
  /** Total NYS income tax liability */
  nysLiability: number;
  /** Total NYC income tax liability (0 if non-NYC) */
  nycLiability: number;
  /** Fraction of filers who are NYC residents (0-1) */
  nycResidentShare: number;
  /** Source for the data */
  source: DataSource;
}

export interface DataSource {
  name: string;
  url: string;
  year: number;
  isAssumption: boolean;
  notes?: string;
}

/** NYS tax bracket definition */
export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

/** User-configurable tax policy change */
export interface PolicyChange {
  /** Additional surcharge rate on income above surchargeThreshold */
  surchargeRate: number;
  /** Income threshold above which surcharge applies */
  surchargeThreshold: number;
  /** Flat rate change applied to all brackets (pp) */
  flatRateChange: number;
  /** Whether to model NYC tax changes too */
  includeNyc: boolean;
  /** NYC-specific surcharge rate */
  nycSurchargeRate: number;
  /** NYC surcharge threshold */
  nycSurchargeThreshold: number;
}

/** Behavioral response model type */
export type BehavioralModelType = 'none' | 'elasticity' | 'threshold' | 'hybrid';

/** Parameters for behavioral response models */
export interface BehavioralParams {
  model: BehavioralModelType;

  // Elasticity model
  /** Base annual out-migration rate (fraction, e.g., 0.015 = 1.5%) */
  baseMigrationRate: number;
  /** Elasticity of migration w.r.t. net-of-tax rate change */
  migrationElasticity: number;
  /** Maximum share that could leave in response */
  maxMigrationShare: number;

  // Threshold model
  /** Dollar amount of additional annual tax that triggers sharp response */
  thresholdDollars: number;
  /** Slope of logistic curve (for hybrid model) */
  logisticSlope: number;

  // Timing
  /** Share of total migration that occurs in year 1 */
  year1Share: number;
  /** Share by year 3 (cumulative) */
  year3Share: number;
  /** Share by year 5 (cumulative, should be ~1.0) */
  year5Share: number;

  // Replacement
  /** Fraction of departed high-income filers replaced by new arrivals */
  replacementRate: number;
}

/** Time horizon for projections */
export type TimeHorizon = 1 | 3 | 5;

/** Full model input configuration */
export interface ModelInput {
  policy: PolicyChange;
  behavioral: BehavioralParams;
  timeHorizon: TimeHorizon;
  /** Middle-income range for offset calculation */
  middleIncomeMin: number;
  middleIncomeMax: number;
}

/** Result for a single cohort */
export interface CohortResult {
  cohort: IncomeCohort;
  /** Additional tax per filer under the policy (before behavioral response) */
  additionalTaxPerFiler: number;
  /** Total mechanical revenue gain (no behavioral response) */
  mechanicalGain: number;
  /** Estimated share of filers who leave */
  migrationShare: number;
  /** Revenue lost due to migration (includes all their existing taxes) */
  migrationLoss: number;
  /** Net revenue change for this cohort */
  netRevenueChange: number;
}

/** Full model output */
export interface ModelOutput {
  /** Results by cohort */
  cohortResults: CohortResult[];
  /** Total mechanical gain across all cohorts */
  totalMechanicalGain: number;
  /** Total behavioral loss */
  totalBehavioralLoss: number;
  /** Net revenue change */
  netRevenueChange: number;
  /** Baseline total revenue */
  baselineRevenue: number;
  /** Required middle-income offset (pp rate increase) to break even */
  middleIncomeOffset: number | null;
  /** Per-filer impact of offset on middle-income filers */
  middleIncomeOffsetPerFiler: number | null;
  /** As percentage of income for middle cohort */
  middleIncomeOffsetPctIncome: number | null;
  /** Number of middle-income filers affected */
  middleIncomeFilerCount: number;
  /** Time horizon used */
  timeHorizon: TimeHorizon;
}

/** Sensitivity scenario */
export interface ScenarioResult {
  label: string;
  params: Partial<BehavioralParams>;
  output: ModelOutput;
}

/** Parameter metadata for the transparency panel */
export interface ParamMeta {
  name: string;
  defaultValue: number | string;
  source: DataSource;
  description: string;
  unit: string;
}
