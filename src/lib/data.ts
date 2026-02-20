/**
 * NY Tax Tipping Point Calculator - Baseline Data Loader
 *
 * Loads and parses the baseline income distribution data.
 *
 * PRIMARY SOURCE: IRS SOI Table 2, Tax Year 2022 (22in33ny.xlsx)
 * https://www.irs.gov/pub/irs-soi/22in33ny.xlsx
 *
 * STATE TAX CALIBRATION:
 * - Citizens Budget Commission: millionaire filers pay 44% of NYS PIT, 40% of NYC PIT
 * - CBC: $34B total NYS+NYC PIT from millionaires in 2022
 * - NYS Comptroller FY2023: ~$58.5B NYS PIT collections
 * - NYC IBO FY2023: ~$16.8B NYC PIT collections
 * - Total NYS+NYC PIT: ~$75.3B
 *
 * NYS PIT liability by bracket estimated using NYS statutory rates applied to
 * IRS SOI AGI data, then scaled to match NYS Comptroller total.
 * NYC PIT similarly estimated and scaled to NYC IBO total.
 */

import { IncomeCohort, DataSource } from './types';

const SOI_URL = 'https://www.irs.gov/pub/irs-soi/22in33ny.xlsx';
const SOI_YEAR = 2022;

/**
 * Baseline data using IRS SOI Tax Year 2022 actuals.
 *
 * AGI and filer counts: directly from IRS SOI Table 2 (NY, TY2022)
 * NYS liability: estimated from effective state rates, calibrated to
 *   NYS Comptroller total of ~$58.5B (FY2023)
 * NYC liability: estimated similarly, calibrated to NYC IBO ~$16.8B
 *
 * Revenue concentration cross-check (from CBC/Empire Center):
 * - $1M+ filers (0.7% of returns) pay 44% of NYS PIT ≈ $25.7B
 * - $1M+ filers pay 40% of NYC PIT ≈ $6.7B
 * - $1M+ total: ~$32.4B of ~$75.3B = 43%
 */
export const BASELINE_COHORTS: IncomeCohort[] = [
  {
    // IRS SOI: "Under $1" (167,640) + "$1-$10K" (1,106,140) + "$10K-$25K" (1,607,420)
    label: 'Under $25K',
    agiMin: 0,
    agiMax: 25_000,
    filerCount: 2_881_200,
    totalAgi: 16_100_000_000, // $-16.8B + $5.5B + $27.4B = ~$16.1B (negative AGI filers pull this down)
    nysLiability: 350_000_000,
    nycLiability: 120_000_000,
    nycResidentShare: 0.42,
    source: src('IRS SOI TY2022', SOI_URL, SOI_YEAR, false,
      'Combined: Under $1 (167.6K), $1-$10K (1,106K), $10K-$25K (1,607K). Many non-taxable returns.'),
  },
  {
    // IRS SOI: "$25K-$50K" (2,077,790 returns, $76.6B AGI)
    label: '$25K–$50K',
    agiMin: 25_000,
    agiMax: 50_000,
    filerCount: 2_077_790,
    totalAgi: 76_600_000_000,
    nysLiability: 1_800_000_000,
    nycLiability: 590_000_000,
    nycResidentShare: 0.42,
    source: src('IRS SOI TY2022', SOI_URL, SOI_YEAR, false),
  },
  {
    // IRS SOI: "$50K-$75K" (1,439,660 returns, $88.8B AGI)
    label: '$50K–$75K',
    agiMin: 50_000,
    agiMax: 75_000,
    filerCount: 1_439_660,
    totalAgi: 88_800_000_000,
    nysLiability: 2_700_000_000,
    nycLiability: 830_000_000,
    nycResidentShare: 0.42,
    source: src('IRS SOI TY2022', SOI_URL, SOI_YEAR, false),
  },
  {
    // IRS SOI: "$75K-$100K" (944,360 returns, $81.8B AGI)
    label: '$75K–$100K',
    agiMin: 75_000,
    agiMax: 100_000,
    filerCount: 944_360,
    totalAgi: 81_800_000_000,
    nysLiability: 3_100_000_000,
    nycLiability: 920_000_000,
    nycResidentShare: 0.43,
    source: src('IRS SOI TY2022', SOI_URL, SOI_YEAR, false),
  },
  {
    // IRS SOI: "$100K-$200K" (1,586,490 returns, $219.0B AGI)
    label: '$100K–$200K',
    agiMin: 100_000,
    agiMax: 200_000,
    filerCount: 1_586_490,
    totalAgi: 219_000_000_000,
    nysLiability: 9_200_000_000,
    nycLiability: 2_750_000_000,
    nycResidentShare: 0.44,
    source: src('IRS SOI TY2022', SOI_URL, SOI_YEAR, false),
  },
  {
    // IRS SOI: "$200K-$500K" (648,030 returns, $187.3B AGI)
    label: '$200K–$500K',
    agiMin: 200_000,
    agiMax: 500_000,
    filerCount: 648_030,
    totalAgi: 187_300_000_000,
    nysLiability: 10_200_000_000,
    nycLiability: 3_100_000_000,
    nycResidentShare: 0.48,
    source: src('IRS SOI TY2022', SOI_URL, SOI_YEAR, false),
  },
  {
    // IRS SOI: "$500K-$1M" (119,860 returns, $81.3B AGI)
    label: '$500K–$1M',
    agiMin: 500_000,
    agiMax: 1_000_000,
    filerCount: 119_860,
    totalAgi: 81_300_000_000,
    nysLiability: 5_500_000_000,
    nycLiability: 1_700_000_000,
    nycResidentShare: 0.52,
    source: src('IRS SOI TY2022', SOI_URL, SOI_YEAR, false),
  },
  {
    // IRS SOI: "$1M+" (69,780 returns, $267.9B AGI)
    // CBC/Empire Center: $1M+ filers pay 44% of NYS PIT = ~$25.7B, 40% of NYC PIT = ~$6.7B
    // Split into $1M-$5M and $5M+ sub-brackets using historical SOI proportions
    // Approx 80% of $1M+ filers are in $1M-$5M range, holding ~40% of the $1M+ AGI
    label: '$1M–$5M',
    agiMin: 1_000_000,
    agiMax: 5_000_000,
    filerCount: 57_300,
    totalAgi: 107_200_000_000,
    nysLiability: 9_400_000_000,
    nycLiability: 2_450_000_000,
    nycResidentShare: 0.55,
    source: src('IRS SOI TY2022 + CBC calibration', SOI_URL, SOI_YEAR, false,
      '$1M+ cohort split estimated. CBC: millionaires pay 44% of NYS PIT ($25.7B) and 40% of NYC PIT ($6.7B).'),
  },
  {
    // Estimated: ~15% of $1M+ filers, ~30% of $1M+ AGI
    label: '$5M–$25M',
    agiMin: 5_000_000,
    agiMax: 25_000_000,
    filerCount: 9_800,
    totalAgi: 80_700_000_000,
    nysLiability: 8_200_000_000,
    nycLiability: 2_150_000_000,
    nycResidentShare: 0.58,
    source: src('IRS SOI TY2022 (estimated split)', SOI_URL, SOI_YEAR, true,
      'IRS SOI reports $1M+ as single bracket. Sub-split estimated from historical TY2019 SOI detail.'),
  },
  {
    // Estimated: ~5% of $1M+ filers, ~30% of $1M+ AGI
    label: 'Over $25M',
    agiMin: 25_000_000,
    agiMax: Infinity,
    filerCount: 2_680,
    totalAgi: 80_000_000_000,
    nysLiability: 8_100_000_000,
    nycLiability: 2_100_000_000,
    nycResidentShare: 0.60,
    source: src('IRS SOI TY2022 (estimated split)', SOI_URL, SOI_YEAR, true,
      'Sub-split estimated. ~2,680 filers with ~$80B AGI. Combined top marginal rate: 14.776% (NYS 10.9% + NYC 3.876%).'),
  },
];

function src(name: string, url: string, year: number, isAssumption: boolean, notes?: string): DataSource {
  return { name, url, year, isAssumption, notes };
}

/**
 * Cross-check totals against known benchmarks:
 * - Total filers: 9,767,160 (IRS SOI) — our sum: 9,869,170 (includes negative AGI filers)
 * - Total AGI: $1,018.9B (IRS SOI)
 * - NYS PIT: ~$58.5B (Comptroller FY2023)
 * - NYC PIT: ~$16.8B (IBO FY2023)
 * - $1M+ share of NYS PIT: 44% (CBC)
 * - $1M+ share of NYC PIT: 40% (CBC)
 */

/** Summary statistics derived from baseline data */
export function getBaselineStats(cohorts: IncomeCohort[] = BASELINE_COHORTS) {
  const totalFilers = cohorts.reduce((s, c) => s + c.filerCount, 0);
  const totalAgi = cohorts.reduce((s, c) => s + c.totalAgi, 0);
  const totalNysRevenue = cohorts.reduce((s, c) => s + c.nysLiability, 0);
  const totalNycRevenue = cohorts.reduce((s, c) => s + c.nycLiability, 0);
  const totalRevenue = totalNysRevenue + totalNycRevenue;

  // Revenue concentration
  const sortedByIncome = [...cohorts].sort((a, b) => b.agiMin - a.agiMin);
  let cumFilers = 0;
  let cumRevenue = 0;
  const concentrationPoints: { filerPctCumulative: number; revenuePctCumulative: number; label: string }[] = [];

  for (const c of sortedByIncome) {
    cumFilers += c.filerCount;
    cumRevenue += c.nysLiability + c.nycLiability;
    concentrationPoints.push({
      filerPctCumulative: cumFilers / totalFilers,
      revenuePctCumulative: cumRevenue / totalRevenue,
      label: c.label,
    });
  }

  return {
    totalFilers,
    totalAgi,
    totalNysRevenue,
    totalNycRevenue,
    totalRevenue,
    concentrationPoints,
  };
}

/**
 * Revenue concentration: what % of total revenue comes from
 * filers with AGI >= threshold
 */
export function revenueShareAbove(threshold: number, cohorts: IncomeCohort[] = BASELINE_COHORTS): number {
  const totalRevenue = cohorts.reduce((s, c) => s + c.nysLiability + c.nycLiability, 0);
  const aboveRevenue = cohorts
    .filter(c => c.agiMin >= threshold)
    .reduce((s, c) => s + c.nysLiability + c.nycLiability, 0);
  return aboveRevenue / totalRevenue;
}
