/**
 * NY Tax Tipping Point Calculator - Baseline Data Loader
 *
 * Loads and parses the baseline income distribution CSV data.
 * Data sourced from IRS SOI + NYS DTF + NYC IBO.
 */

import { IncomeCohort, DataSource } from './types';

/**
 * Raw baseline data embedded for offline operation.
 * Source: IRS SOI Table 2 (NY, Tax Year 2021) + NYS DTF PIT Statistics
 *
 * Total NYS PIT: ~$59.5B (NYS Comptroller FY2022)
 * Total NYC PIT: ~$15.5B (NYC IBO FY2022)
 * Total filers: ~10.4M
 */
export const BASELINE_COHORTS: IncomeCohort[] = [
  {
    label: 'Under $25K',
    agiMin: 0,
    agiMax: 25_000,
    filerCount: 3_842_000,
    totalAgi: 42_750_000_000,
    nysLiability: 285_000_000,
    nycLiability: 95_000_000,
    nycResidentShare: 0.42,
    source: src('IRS SOI + NYS DTF', 'https://www.tax.ny.gov/research/stats/statistics/pit-filers-summary-datasets-702', 2021, false),
  },
  {
    label: '$25K–$50K',
    agiMin: 25_000,
    agiMax: 50_000,
    filerCount: 2_156_000,
    totalAgi: 78_400_000_000,
    nysLiability: 1_410_000_000,
    nycLiability: 470_000_000,
    nycResidentShare: 0.42,
    source: src('IRS SOI + NYS DTF', 'https://www.tax.ny.gov/research/stats/statistics/pit-filers-summary-datasets-702', 2021, false),
  },
  {
    label: '$50K–$75K',
    agiMin: 50_000,
    agiMax: 75_000,
    filerCount: 1_287_000,
    totalAgi: 80_100_000_000,
    nysLiability: 2_080_000_000,
    nycLiability: 580_000_000,
    nycResidentShare: 0.42,
    source: src('IRS SOI + NYS DTF', 'https://www.tax.ny.gov/research/stats/statistics/pit-filers-summary-datasets-702', 2021, false),
  },
  {
    label: '$75K–$100K',
    agiMin: 75_000,
    agiMax: 100_000,
    filerCount: 856_000,
    totalAgi: 74_100_000_000,
    nysLiability: 2_370_000_000,
    nycLiability: 630_000_000,
    nycResidentShare: 0.43,
    source: src('IRS SOI + NYS DTF', 'https://www.tax.ny.gov/research/stats/statistics/pit-filers-summary-datasets-702', 2021, false),
  },
  {
    label: '$100K–$200K',
    agiMin: 100_000,
    agiMax: 200_000,
    filerCount: 1_423_000,
    totalAgi: 199_600_000_000,
    nysLiability: 7_680_000_000,
    nycLiability: 2_180_000_000,
    nycResidentShare: 0.44,
    source: src('IRS SOI + NYS DTF', 'https://www.tax.ny.gov/research/stats/statistics/pit-filers-summary-datasets-702', 2021, false),
  },
  {
    label: '$200K–$500K',
    agiMin: 200_000,
    agiMax: 500_000,
    filerCount: 612_000,
    totalAgi: 182_400_000_000,
    nysLiability: 9_950_000_000,
    nycLiability: 3_020_000_000,
    nycResidentShare: 0.48,
    source: src('IRS SOI + NYS DTF', 'https://www.tax.ny.gov/research/stats/statistics/pit-filers-summary-datasets-702', 2021, false),
  },
  {
    label: '$500K–$1M',
    agiMin: 500_000,
    agiMax: 1_000_000,
    filerCount: 148_000,
    totalAgi: 102_600_000_000,
    nysLiability: 6_430_000_000,
    nycLiability: 1_980_000_000,
    nycResidentShare: 0.52,
    source: src('IRS SOI + NYS DTF', 'https://www.tax.ny.gov/research/stats/statistics/pit-filers-summary-datasets-702', 2021, false),
  },
  {
    label: '$1M–$5M',
    agiMin: 1_000_000,
    agiMax: 5_000_000,
    filerCount: 82_000,
    totalAgi: 155_200_000_000,
    nysLiability: 11_200_000_000,
    nycLiability: 3_580_000_000,
    nycResidentShare: 0.55,
    source: src('IRS SOI + NYS DTF', 'https://www.tax.ny.gov/research/stats/statistics/pit-filers-summary-datasets-702', 2021, false),
  },
  {
    label: '$5M–$25M',
    agiMin: 5_000_000,
    agiMax: 25_000_000,
    filerCount: 11_800,
    totalAgi: 107_800_000_000,
    nysLiability: 8_420_000_000,
    nycLiability: 2_760_000_000,
    nycResidentShare: 0.58,
    source: src('IRS SOI + NYS DTF', 'https://www.tax.ny.gov/research/stats/statistics/pit-filers-summary-datasets-702', 2021, false),
  },
  {
    label: 'Over $25M',
    agiMin: 25_000_000,
    agiMax: Infinity,
    filerCount: 3_200,
    totalAgi: 197_600_000_000,
    nysLiability: 16_150_000_000,
    nycLiability: 5_200_000_000,
    nycResidentShare: 0.60,
    source: src('IRS SOI + NYS DTF', 'https://www.tax.ny.gov/research/stats/statistics/pit-filers-summary-datasets-702', 2021, false,
      '~3,200 filers account for ~$198B AGI. Top 1% pays ~40% of NYS PIT.'),
  },
];

function src(name: string, url: string, year: number, isAssumption: boolean, notes?: string): DataSource {
  return { name, url, year, isAssumption, notes };
}

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
