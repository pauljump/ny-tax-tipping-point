/**
 * Default model inputs and formatting utilities
 */

import { ModelInput, PolicyChange, BehavioralParams, ParamMeta } from './types';
import { DEFAULT_BEHAVIORAL_PARAMS } from './model';

export const DEFAULT_POLICY: PolicyChange = {
  surchargeRate: 0.02,
  surchargeThreshold: 1_000_000,
  flatRateChange: 0,
  includeNyc: true,
  nycSurchargeRate: 0,
  nycSurchargeThreshold: 1_000_000,
};

export const DEFAULT_INPUT: ModelInput = {
  policy: DEFAULT_POLICY,
  behavioral: DEFAULT_BEHAVIORAL_PARAMS,
  timeHorizon: 5,
  middleIncomeMin: 75_000,
  middleIncomeMax: 200_000,
};

export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    const abs = Math.abs(value);
    if (abs >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (abs >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (abs >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

/** Parameter metadata for the transparency panel */
export const PARAM_METADATA: ParamMeta[] = [
  {
    name: 'Baseline Filer Distribution',
    defaultValue: '10.4M total filers',
    source: {
      name: 'IRS SOI Table 2 + NYS DTF',
      url: 'https://www.irs.gov/statistics/soi-tax-stats-historic-table-2',
      year: 2021,
      isAssumption: false,
    },
    description: 'Number of individual income tax returns filed in New York State by income bracket.',
    unit: 'filers',
  },
  {
    name: 'NYS PIT Revenue',
    defaultValue: '$59.5B total',
    source: {
      name: 'NYS Comptroller Annual Report',
      url: 'https://www.osc.ny.gov/reports/finance',
      year: 2022,
      isAssumption: false,
    },
    description: 'Total NYS personal income tax collections.',
    unit: 'dollars',
  },
  {
    name: 'NYC PIT Revenue',
    defaultValue: '$15.5B total',
    source: {
      name: 'NYC IBO Fiscal Brief',
      url: 'https://www.ibo.nyc.ny.us/',
      year: 2022,
      isAssumption: false,
    },
    description: 'Total NYC personal income tax collections.',
    unit: 'dollars',
  },
  {
    name: 'Base Migration Rate',
    defaultValue: '1.5%/year',
    source: {
      name: 'IRS SOI Migration Data',
      url: 'https://www.irs.gov/statistics/soi-tax-stats-migration-data',
      year: 2021,
      isAssumption: false,
      notes: 'Background rate of high-income out-migration from NY',
    },
    description: 'Annual baseline rate at which high-income filers leave NY, independent of tax changes.',
    unit: 'fraction',
  },
  {
    name: 'Migration Elasticity',
    defaultValue: '1.5',
    source: {
      name: 'Academic literature (Young 2016, Moretti & Wilson 2017)',
      url: 'https://doi.org/10.1177/0003122416639625',
      year: 2016,
      isAssumption: true,
      notes: 'Literature range: 0.4 (Young) to 2.3 (Moretti & Wilson). Default is midpoint.',
    },
    description: 'Responsiveness of migration to changes in the net-of-tax rate. Higher = more migration.',
    unit: 'elasticity',
  },
  {
    name: 'Max Migration Share',
    defaultValue: '15%',
    source: {
      name: 'Assumption',
      url: '',
      year: 2024,
      isAssumption: true,
      notes: 'Cap on cumulative departure. No empirical basis for exact value.',
    },
    description: 'Maximum fraction of a cohort that would leave over the projection period.',
    unit: 'fraction',
  },
  {
    name: 'Tipping Threshold',
    defaultValue: '$100,000',
    source: {
      name: 'Assumption',
      url: '',
      year: 2024,
      isAssumption: true,
      notes: 'Point at which migration response accelerates. Informed by cost-of-moving analysis.',
    },
    description: 'Additional annual tax burden at which migration probability increases sharply.',
    unit: 'dollars',
  },
  {
    name: 'NYC Resident Share',
    defaultValue: '42-60% by bracket',
    source: {
      name: 'Census ACS + IRS SOI',
      url: 'https://www.census.gov/programs-surveys/acs',
      year: 2021,
      isAssumption: true,
      notes: 'NYC is ~42% of state population but higher share of high-income filers.',
    },
    description: 'Fraction of NYS filers in each bracket who are NYC residents.',
    unit: 'fraction',
  },
  {
    name: 'Migration Timing',
    defaultValue: '30% yr1 / 70% yr3 / 100% yr5',
    source: {
      name: 'Assumption based on Young et al. lag analysis',
      url: 'https://doi.org/10.1177/0003122416639625',
      year: 2016,
      isAssumption: true,
    },
    description: 'Cumulative share of total migration that occurs by each time horizon.',
    unit: 'fraction',
  },
  {
    name: 'Replacement Rate',
    defaultValue: '0%',
    source: {
      name: 'Assumption (conservative)',
      url: '',
      year: 2024,
      isAssumption: true,
      notes: 'Some new high earners always move to NY. Default 0% is conservative (overstates loss).',
    },
    description: 'Fraction of departing high earners replaced by new arrivals.',
    unit: 'fraction',
  },
];
