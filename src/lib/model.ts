/**
 * NY Tax Tipping Point Calculator - Core Computation Engine
 *
 * Pure functions for tax computation, behavioral migration models,
 * and revenue impact analysis. No side effects, fully testable.
 *
 * Key references for behavioral parameters:
 * - Young et al. (2016) "Millionaire Migration and Taxation of the Elite"
 * - Kleven et al. (2014) "Migration and Wage Effects of Taxing Top Earners"
 * - Moretti & Wilson (2017) "The Effect of State Taxes on the Geographical Location of Top Earners"
 * - Varner, Young, & Prohofsky (2018) "Millionaire Migration in California"
 */

import {
  IncomeCohort,
  PolicyChange,
  BehavioralParams,
  BehavioralModelType,
  ModelInput,
  ModelOutput,
  CohortResult,
  TimeHorizon,
  TaxBracket,
} from './types';
import { BASELINE_COHORTS } from './data';

// ─────────────────────────────────────────
// Current NY Tax Rate Schedules (2024-2027)
// ─────────────────────────────────────────

/**
 * NYS income tax brackets for single filers (2024).
 * Source: NYS Tax Law § 601
 * https://www.tax.ny.gov/pit/file/tax_tables.htm
 *
 * Includes the temporary top rates enacted in 2021 budget
 * (scheduled to sunset after 2027 per current law).
 */
export const NYS_BRACKETS: TaxBracket[] = [
  { min: 0, max: 8_500, rate: 0.04 },
  { min: 8_500, max: 11_700, rate: 0.045 },
  { min: 11_700, max: 13_900, rate: 0.0525 },
  { min: 13_900, max: 80_650, rate: 0.055 },
  { min: 80_650, max: 215_400, rate: 0.06 },
  { min: 215_400, max: 1_077_550, rate: 0.0685 },
  { min: 1_077_550, max: 5_000_000, rate: 0.0965 },
  { min: 5_000_000, max: 25_000_000, rate: 0.103 },
  { min: 25_000_000, max: Infinity, rate: 0.109 },
];

/**
 * NYC income tax brackets (2024).
 * Source: NYC Admin Code § 11-1701
 * https://www.nyc.gov/site/finance/taxes/property-tax-rates.page
 */
export const NYC_BRACKETS: TaxBracket[] = [
  { min: 0, max: 12_000, rate: 0.03078 },
  { min: 12_000, max: 25_000, rate: 0.03762 },
  { min: 25_000, max: 50_000, rate: 0.03819 },
  { min: 50_000, max: Infinity, rate: 0.03876 },
];

// ─────────────────────────────────────
// Tax Computation Functions
// ─────────────────────────────────────

/** Compute tax liability under a given bracket schedule */
export function computeTax(income: number, brackets: TaxBracket[]): number {
  let tax = 0;
  for (const bracket of brackets) {
    if (income <= bracket.min) break;
    const taxableInBracket = Math.min(income, bracket.max) - bracket.min;
    tax += taxableInBracket * bracket.rate;
  }
  return tax;
}

/** Compute additional tax from a surcharge above a threshold */
export function computeSurcharge(income: number, rate: number, threshold: number): number {
  if (income <= threshold) return 0;
  return (income - threshold) * rate;
}

/**
 * Compute the per-filer additional tax burden from a policy change.
 * Uses the cohort's average AGI.
 */
export function computeAdditionalTaxPerFiler(
  avgAgi: number,
  policy: PolicyChange,
  isNycResident: boolean,
): number {
  let additionalTax = 0;

  // NYS flat rate change applied to full income
  if (policy.flatRateChange !== 0) {
    additionalTax += avgAgi * policy.flatRateChange;
  }

  // NYS surcharge on income above threshold
  if (policy.surchargeRate > 0 && policy.surchargeThreshold > 0) {
    additionalTax += computeSurcharge(avgAgi, policy.surchargeRate, policy.surchargeThreshold);
  }

  // NYC changes (only for NYC residents)
  if (isNycResident && policy.includeNyc) {
    if (policy.nycSurchargeRate > 0 && policy.nycSurchargeThreshold > 0) {
      additionalTax += computeSurcharge(avgAgi, policy.nycSurchargeRate, policy.nycSurchargeThreshold);
    }
  }

  return additionalTax;
}

// ─────────────────────────────────────
// Behavioral Migration Models
// ─────────────────────────────────────

/**
 * Default behavioral parameters.
 *
 * Calibrated from academic literature:
 *
 * MIGRATION SEMI-ELASTICITY (additional pp out-migration per 1pp tax increase):
 * - Young & Varner (2016, ASR): 0.1-0.4 pp for NJ millionaires
 * - Rauh & Shyu (2021, NBER): 0.8 pp for CA top bracket (but migration = only 9.5% of behavioral response)
 * - Kleven et al. (2014, QJE): ~1.5-2.0 for FOREIGN top earners; insignificant for domestic
 * - Moretti & Wilson (2017, AER): 1.6-3.0 for star scientists (upper bound for mobile talent)
 *
 * BASELINE OUT-MIGRATION:
 * - Pre-TCJA: ~1.5-2.5%/year gross out-migration for $1M+ filers
 * - Post-TCJA/pre-COVID: ~2.5-4.0% (SALT cap effectively raised burden ~4pp for NYC $1M+ filers)
 * - IRS SOI: NY net AGI outflow $15-20B/year (2018-19), $25-40B/year (2020-21 w/COVID)
 *
 * KEY INSIGHT (Young 2016): "Millionaires are not very mobile."
 * Migration explains only ~5-10% of total behavioral revenue loss.
 * Income shifting is typically much larger but is NOT modeled here.
 *
 * AGGLOMERATION: NYC has strong industry clustering (finance, media, law)
 * that reduces tax-motivated mobility. Estimated 0.7x discount vs generic state estimates.
 *
 * CONSERVATIVE APPROACH: Defaults use central-to-high estimates because this model
 * ONLY captures migration, not income shifting. Users exploring "total behavioral response"
 * should use higher elasticities.
 */
export const DEFAULT_BEHAVIORAL_PARAMS: BehavioralParams = {
  model: 'hybrid',
  baseMigrationRate: 0.025,          // 2.5%/year (post-TCJA observed rate for high earners)
  migrationElasticity: 1.0,          // Central: between Young's 0.4 and Moretti's 2.3
  maxMigrationShare: 0.12,           // 12% cumulative cap over projection window
  thresholdDollars: 100_000,         // ~$100K additional tax triggers behavioral shift
  logisticSlope: 50_000,             // S-curve steepness
  year1Share: 0.3,                   // 30% of total migration in year 1
  year3Share: 0.7,                   // 70% by year 3
  year5Share: 1.0,                   // Fully realized by year 5
  replacementRate: 0.0,              // Conservative: no replacement (overstates loss)
};

/**
 * Compute the share of filers in a cohort who leave due to tax change.
 * Returns a value between 0 and maxMigrationShare.
 */
export function computeMigrationShare(
  additionalTaxPerFiler: number,
  avgAgi: number,
  params: BehavioralParams,
  timeHorizon: TimeHorizon,
): number {
  if (additionalTaxPerFiler <= 0) return 0;

  let rawShare: number;

  switch (params.model) {
    case 'none':
      return 0;

    case 'elasticity': {
      // Elasticity model: migration proportional to change in net-of-tax rate
      // net-of-tax rate change = -additionalTax / income
      const netOfTaxRateChange = additionalTaxPerFiler / avgAgi;
      rawShare = params.baseMigrationRate + params.migrationElasticity * netOfTaxRateChange;
      break;
    }

    case 'threshold': {
      // Step function: low migration below threshold, sharp increase above
      if (additionalTaxPerFiler < params.thresholdDollars) {
        rawShare = params.baseMigrationRate;
      } else {
        // Linear ramp above threshold
        const overThreshold = additionalTaxPerFiler - params.thresholdDollars;
        rawShare = params.baseMigrationRate +
          (params.maxMigrationShare - params.baseMigrationRate) *
          Math.min(1, overThreshold / params.thresholdDollars);
      }
      break;
    }

    case 'hybrid':
    default: {
      // Logistic (S-curve) centered at threshold
      // P(leave) = maxShare * sigmoid((additionalTax - threshold) / slope)
      const x = (additionalTaxPerFiler - params.thresholdDollars) / params.logisticSlope;
      const sigmoid = 1 / (1 + Math.exp(-x));
      rawShare = params.baseMigrationRate + (params.maxMigrationShare - params.baseMigrationRate) * sigmoid;
      break;
    }
  }

  // Apply time horizon scaling
  const timeScale = getTimeScale(timeHorizon, params);

  // Apply replacement rate (new high earners moving in)
  const netShare = rawShare * timeScale * (1 - params.replacementRate);

  // Clamp to [0, maxMigrationShare]
  return Math.max(0, Math.min(params.maxMigrationShare, netShare));
}

function getTimeScale(horizon: TimeHorizon, params: BehavioralParams): number {
  switch (horizon) {
    case 1: return params.year1Share;
    case 3: return params.year3Share;
    case 5: return params.year5Share;
    default: return 1;
  }
}

// ─────────────────────────────────────
// Main Model Computation
// ─────────────────────────────────────

/**
 * Run the full tax model for all cohorts.
 *
 * For each cohort:
 * 1. Compute mechanical revenue gain from the policy change
 * 2. Compute behavioral migration response
 * 3. Compute revenue lost when filers leave (they take ALL their tax revenue with them)
 * 4. Net revenue = mechanical gain - behavioral loss
 */
export function runModel(
  input: ModelInput,
  cohorts: IncomeCohort[] = BASELINE_COHORTS,
): ModelOutput {
  const { policy, behavioral, timeHorizon } = input;

  const cohortResults: CohortResult[] = cohorts.map(cohort => {
    const avgAgi = cohort.totalAgi / cohort.filerCount;

    // For NYC changes, we weight by NYC resident share
    // For NYS changes, we apply to all filers
    const additionalTaxNys = computeAdditionalTaxPerFiler(avgAgi, {
      ...policy,
      includeNyc: false,
    }, false);

    const additionalTaxNyc = policy.includeNyc
      ? computeAdditionalTaxPerFiler(avgAgi, policy, true) - additionalTaxNys
      : 0;

    // Weighted average additional tax per filer
    const additionalTaxPerFiler = additionalTaxNys + additionalTaxNyc * cohort.nycResidentShare;

    // Mechanical gain = additional tax * filer count
    const mechanicalGain = additionalTaxPerFiler * cohort.filerCount;

    // Migration share based on total additional burden
    const migrationShare = computeMigrationShare(
      additionalTaxPerFiler,
      avgAgi,
      behavioral,
      timeHorizon,
    );

    // Revenue lost = departing filers lose BOTH existing liability AND new tax
    const existingTaxPerFiler = (cohort.nysLiability + cohort.nycLiability) / cohort.filerCount;
    const leavingFilers = cohort.filerCount * migrationShare;
    const migrationLoss = leavingFilers * (existingTaxPerFiler + additionalTaxPerFiler);

    const netRevenueChange = mechanicalGain - migrationLoss;

    return {
      cohort,
      additionalTaxPerFiler,
      mechanicalGain,
      migrationShare,
      migrationLoss,
      netRevenueChange,
    };
  });

  const totalMechanicalGain = cohortResults.reduce((s, r) => s + r.mechanicalGain, 0);
  const totalBehavioralLoss = cohortResults.reduce((s, r) => s + r.migrationLoss, 0);
  const netRevenueChange = totalMechanicalGain - totalBehavioralLoss;
  const baselineRevenue = cohorts.reduce((s, c) => s + c.nysLiability + c.nycLiability, 0);

  // Middle-income offset calculation
  const middleOffset = computeMiddleIncomeOffset(
    netRevenueChange,
    input.middleIncomeMin,
    input.middleIncomeMax,
    cohorts,
  );

  return {
    cohortResults,
    totalMechanicalGain,
    totalBehavioralLoss,
    netRevenueChange,
    baselineRevenue,
    middleIncomeOffset: middleOffset.rateIncrease,
    middleIncomeOffsetPerFiler: middleOffset.perFiler,
    middleIncomeOffsetPctIncome: middleOffset.pctIncome,
    middleIncomeFilerCount: middleOffset.filerCount,
    timeHorizon,
  };
}

// ─────────────────────────────────────
// Middle-Income Offset Calculator
// ─────────────────────────────────────

interface MiddleIncomeOffset {
  rateIncrease: number | null;
  perFiler: number | null;
  pctIncome: number | null;
  filerCount: number;
}

/**
 * If net revenue change is negative, compute the uniform rate increase
 * needed on middle-income filers to break even.
 */
export function computeMiddleIncomeOffset(
  netRevenueChange: number,
  middleIncomeMin: number,
  middleIncomeMax: number,
  cohorts: IncomeCohort[] = BASELINE_COHORTS,
): MiddleIncomeOffset {
  // Only compute if there's a shortfall
  if (netRevenueChange >= 0) {
    const middleCohorts = cohorts.filter(
      c => c.agiMin >= middleIncomeMin && c.agiMax <= middleIncomeMax,
    );
    const filerCount = middleCohorts.reduce((s, c) => s + c.filerCount, 0);
    return { rateIncrease: null, perFiler: null, pctIncome: null, filerCount };
  }

  const shortfall = Math.abs(netRevenueChange);

  // Find cohorts that overlap the middle-income range
  const middleCohorts = cohorts.filter(
    c => c.agiMin < middleIncomeMax && c.agiMax > middleIncomeMin,
  );

  const totalMiddleAgi = middleCohorts.reduce((s, c) => {
    // Prorate if cohort partially overlaps the range
    const overlapMin = Math.max(c.agiMin, middleIncomeMin);
    const overlapMax = Math.min(c.agiMax, middleIncomeMax);
    const overlapFraction = (overlapMax - overlapMin) / (c.agiMax - c.agiMin);
    return s + c.totalAgi * Math.max(0, Math.min(1, overlapFraction));
  }, 0);

  const filerCount = middleCohorts.reduce((s, c) => {
    const overlapMin = Math.max(c.agiMin, middleIncomeMin);
    const overlapMax = Math.min(c.agiMax, middleIncomeMax);
    const overlapFraction = (overlapMax - overlapMin) / (c.agiMax - c.agiMin);
    return s + c.filerCount * Math.max(0, Math.min(1, overlapFraction));
  }, 0);

  if (totalMiddleAgi === 0 || filerCount === 0) {
    return { rateIncrease: null, perFiler: null, pctIncome: null, filerCount: 0 };
  }

  const rateIncrease = shortfall / totalMiddleAgi;
  const perFiler = shortfall / filerCount;
  const avgMiddleIncome = totalMiddleAgi / filerCount;
  const pctIncome = perFiler / avgMiddleIncome;

  return { rateIncrease, perFiler, pctIncome, filerCount: Math.round(filerCount) };
}

// ─────────────────────────────────────
// Scenario / Sensitivity Analysis
// ─────────────────────────────────────

export interface SensitivityResult {
  paramName: string;
  paramValues: number[];
  netRevenues: number[];
  migrationShares: number[];
}

/**
 * Run sensitivity analysis by varying one parameter across a range.
 */
export function runSensitivity(
  baseInput: ModelInput,
  paramName: keyof BehavioralParams,
  values: number[],
  cohorts: IncomeCohort[] = BASELINE_COHORTS,
): SensitivityResult {
  const netRevenues: number[] = [];
  const migrationShares: number[] = [];

  for (const val of values) {
    const input: ModelInput = {
      ...baseInput,
      behavioral: {
        ...baseInput.behavioral,
        [paramName]: val,
      },
    };
    const output = runModel(input, cohorts);
    netRevenues.push(output.netRevenueChange);

    // Average migration share weighted by filer count
    const totalFilers = output.cohortResults.reduce((s, r) => s + r.cohort.filerCount, 0);
    const weightedMigration = output.cohortResults.reduce(
      (s, r) => s + r.migrationShare * r.cohort.filerCount, 0,
    );
    migrationShares.push(weightedMigration / totalFilers);
  }

  return { paramName, paramValues: values, netRevenues, migrationShares };
}

/**
 * Generate preset scenarios for comparison.
 */
export function runScenarios(
  baseInput: ModelInput,
  cohorts: IncomeCohort[] = BASELINE_COHORTS,
): { label: string; output: ModelOutput }[] {
  return [
    {
      label: 'No behavioral response (static)',
      output: runModel({
        ...baseInput,
        behavioral: { ...baseInput.behavioral, model: 'none' },
      }, cohorts),
    },
    {
      label: 'Conservative response (Young & Varner)',
      output: runModel({
        ...baseInput,
        behavioral: {
          ...baseInput.behavioral,
          model: 'hybrid',
          migrationElasticity: 0.4,
          maxMigrationShare: 0.05,
          thresholdDollars: 200_000,
        },
      }, cohorts),
    },
    {
      label: 'Moderate response (default)',
      output: runModel(baseInput, cohorts),
    },
    {
      label: 'Aggressive response (Moretti & Wilson)',
      output: runModel({
        ...baseInput,
        behavioral: {
          ...baseInput.behavioral,
          model: 'hybrid',
          migrationElasticity: 2.3,
          maxMigrationShare: 0.20,
          thresholdDollars: 50_000,
          logisticSlope: 30_000,
        },
      }, cohorts),
    },
  ];
}

// ─────────────────────────────────────
// Revenue Curve Generator
// ─────────────────────────────────────

export interface RevenueCurvePoint {
  surchargeRate: number;
  mechanicalGain: number;
  behavioralLoss: number;
  netRevenue: number;
}

/**
 * Generate a revenue curve by varying the surcharge rate from 0 to maxRate.
 * This produces the "Laffer-like" curve showing how net revenue changes.
 */
export function generateRevenueCurve(
  baseInput: ModelInput,
  maxRate: number = 0.10,
  steps: number = 50,
  cohorts: IncomeCohort[] = BASELINE_COHORTS,
): RevenueCurvePoint[] {
  const points: RevenueCurvePoint[] = [];

  for (let i = 0; i <= steps; i++) {
    const rate = (maxRate * i) / steps;
    const input: ModelInput = {
      ...baseInput,
      policy: {
        ...baseInput.policy,
        surchargeRate: rate,
      },
    };
    const output = runModel(input, cohorts);
    points.push({
      surchargeRate: rate,
      mechanicalGain: output.totalMechanicalGain,
      behavioralLoss: output.totalBehavioralLoss,
      netRevenue: output.netRevenueChange,
    });
  }

  return points;
}

// ─────────────────────────────────────
// Export Helpers
// ─────────────────────────────────────

export function exportResultsCSV(output: ModelOutput, input: ModelInput): string {
  const lines: string[] = [
    'Cohort,Filers,Avg AGI,Additional Tax/Filer,Mechanical Gain,Migration %,Migration Loss,Net Revenue Change',
  ];

  for (const r of output.cohortResults) {
    const avgAgi = r.cohort.totalAgi / r.cohort.filerCount;
    lines.push([
      `"${r.cohort.label}"`,
      r.cohort.filerCount,
      Math.round(avgAgi),
      Math.round(r.additionalTaxPerFiler),
      Math.round(r.mechanicalGain),
      (r.migrationShare * 100).toFixed(2) + '%',
      Math.round(r.migrationLoss),
      Math.round(r.netRevenueChange),
    ].join(','));
  }

  lines.push('');
  lines.push(`Total Mechanical Gain,${Math.round(output.totalMechanicalGain)}`);
  lines.push(`Total Behavioral Loss,${Math.round(output.totalBehavioralLoss)}`);
  lines.push(`Net Revenue Change,${Math.round(output.netRevenueChange)}`);
  lines.push(`Time Horizon,${output.timeHorizon} years`);

  return lines.join('\n');
}

export function exportAssumptionsJSON(input: ModelInput): string {
  return JSON.stringify({
    policy: input.policy,
    behavioral: {
      ...input.behavioral,
      _sources: {
        baseMigrationRate: 'IRS SOI migration data for NY high-income filers (~1.5%/year)',
        migrationElasticity: 'Literature range 0.4-2.3; default 1.5 (Young et al., Moretti & Wilson)',
        maxMigrationShare: 'Assumption: cap at 15% cumulative departure',
        thresholdDollars: 'Assumption: $100K additional annual tax triggers behavioral shift',
        logisticSlope: 'Assumption: controls steepness of response curve',
        year1Share: 'Assumption: 30% of total migration occurs in year 1',
        year3Share: 'Assumption: 70% by year 3',
        year5Share: 'Assumption: fully realized by year 5',
        replacementRate: 'Assumption: 0% replacement by default (conservative)',
      },
    },
    timeHorizon: input.timeHorizon,
    middleIncomeRange: {
      min: input.middleIncomeMin,
      max: input.middleIncomeMax,
    },
    dataYear: 2022,
    dataSources: [
      'IRS Statistics of Income (SOI) Table 2 - New York State (TY2022)',
      'Citizens Budget Commission - Revenue Concentration Analysis',
      'NYS Comptroller Annual Financial Reports (FY2023)',
      'NYC Independent Budget Office fiscal analysis (FY2023)',
      'Empire Center - Millionaire Migration Analysis',
    ],
  }, null, 2);
}
