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
    defaultValue: '9.77M total filers',
    source: {
      name: 'IRS SOI Table 2 (TY2022)',
      url: 'https://www.irs.gov/pub/irs-soi/22in33ny.xlsx',
      year: 2022,
      isAssumption: false,
    },
    description: 'Number of individual income tax returns filed in New York State by income bracket. 69,780 filers ($1M+) = 0.7% of all filers.',
    unit: 'filers',
  },
  {
    name: 'NYS PIT Revenue',
    defaultValue: '$58.5B total',
    source: {
      name: 'NYS Comptroller Annual Report (FY2023)',
      url: 'https://www.osc.ny.gov/reports/finance',
      year: 2023,
      isAssumption: false,
    },
    description: 'Total NYS personal income tax collections. $1M+ filers pay 44% ($25.7B) per CBC.',
    unit: 'dollars',
  },
  {
    name: 'NYC PIT Revenue',
    defaultValue: '$16.8B total',
    source: {
      name: 'NYC IBO Fiscal Brief (FY2023)',
      url: 'https://www.ibo.nyc.ny.us/',
      year: 2023,
      isAssumption: false,
    },
    description: 'Total NYC personal income tax collections. $1M+ filers pay 40% ($6.7B) per CBC.',
    unit: 'dollars',
  },
  {
    name: 'Revenue Concentration',
    defaultValue: '$1M+ = 44% of NYS PIT',
    source: {
      name: 'Citizens Budget Commission / Empire Center',
      url: 'https://cbcny.org/research/hidden-cost-new-yorks-shrinking-millionaire-share',
      year: 2022,
      isAssumption: false,
      notes: 'NY\'s share of national millionaires fell from 12.7% (2010) to 8.7% (2022). Estimated $13B/year lost revenue.',
    },
    description: '69,780 millionaire filers (0.7%) pay 44% of NYS PIT and 40% of NYC PIT. Combined top marginal rate: 14.776%.',
    unit: 'percent',
  },
  {
    name: 'Base Migration Rate',
    defaultValue: '2.5%/year',
    source: {
      name: 'IRS SOI Migration Data (post-TCJA)',
      url: 'https://www.irs.gov/statistics/soi-tax-stats-migration-data',
      year: 2022,
      isAssumption: false,
      notes: 'Post-TCJA gross out-migration rate for $1M+ filers. Pre-TCJA was ~1.5%. SALT cap effectively added ~4pp burden.',
    },
    description: 'Annual baseline rate at which high-income filers leave NY, independent of new tax changes. Elevated post-2017 due to SALT cap.',
    unit: 'fraction',
  },
  {
    name: 'Migration Elasticity',
    defaultValue: '1.0',
    source: {
      name: 'Academic literature composite',
      url: 'https://doi.org/10.1177/0003122416639625',
      year: 2016,
      isAssumption: true,
      notes: 'Young & Varner: 0.1-0.4 (NJ millionaires). Moretti & Wilson: 1.6-2.3 (star scientists, upper bound). Rauh & Shyu: migration is only ~10% of total behavioral response. Default 1.0 is a central estimate since model only captures migration.',
    },
    description: 'Responsiveness of migration to changes in the net-of-tax rate. Key finding: "Millionaires are not very mobile" (Young 2016). Higher values appropriate if interpreting as total behavioral response.',
    unit: 'elasticity',
  },
  {
    name: 'Max Migration Share',
    defaultValue: '12%',
    source: {
      name: 'Assumption',
      url: '',
      year: 2024,
      isAssumption: true,
      notes: 'Cumulative cap. Young & Varner found ~0.3pp/year additional migration per 1pp tax increase, implying ~1.5% cumulative over 5 years for a moderate increase.',
    },
    description: 'Maximum fraction of a cohort that would leave over the projection period. Acts as a ceiling on the most extreme scenarios.',
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
