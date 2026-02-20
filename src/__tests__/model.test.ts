import { describe, it, expect } from 'vitest';
import {
  computeTax,
  computeSurcharge,
  computeAdditionalTaxPerFiler,
  computeMigrationShare,
  runModel,
  generateRevenueCurve,
  NYS_BRACKETS,
  NYC_BRACKETS,
  DEFAULT_BEHAVIORAL_PARAMS,
  exportResultsCSV,
  exportAssumptionsJSON,
} from '../lib/model';
import { computeMiddleIncomeOffset } from '../lib/model';
import { BASELINE_COHORTS, getBaselineStats, revenueShareAbove } from '../lib/data';
import { DEFAULT_INPUT } from '../lib/defaults';
import { BehavioralParams, ModelInput, PolicyChange } from '../lib/types';

describe('computeTax', () => {
  it('returns 0 for zero income', () => {
    expect(computeTax(0, NYS_BRACKETS)).toBe(0);
  });

  it('computes correct tax for income in first bracket', () => {
    const tax = computeTax(5000, NYS_BRACKETS);
    expect(tax).toBeCloseTo(5000 * 0.04, 2);
  });

  it('computes correct tax for income spanning multiple brackets', () => {
    const tax = computeTax(100_000, NYS_BRACKETS);
    // Should be sum across brackets
    let expected = 0;
    expected += 8500 * 0.04;
    expected += (11700 - 8500) * 0.045;
    expected += (13900 - 11700) * 0.0525;
    expected += (80650 - 13900) * 0.055;
    expected += (100000 - 80650) * 0.06;
    expect(tax).toBeCloseTo(expected, 2);
  });

  it('NYC tax increases with income', () => {
    const tax50k = computeTax(50_000, NYC_BRACKETS);
    const tax100k = computeTax(100_000, NYC_BRACKETS);
    expect(tax100k).toBeGreaterThan(tax50k);
  });
});

describe('computeSurcharge', () => {
  it('returns 0 below threshold', () => {
    expect(computeSurcharge(500_000, 0.02, 1_000_000)).toBe(0);
  });

  it('computes correct surcharge above threshold', () => {
    expect(computeSurcharge(2_000_000, 0.02, 1_000_000)).toBe(20_000);
  });
});

describe('computeMigrationShare', () => {
  const baseParams: BehavioralParams = {
    ...DEFAULT_BEHAVIORAL_PARAMS,
    model: 'hybrid',
  };

  it('returns 0 for no migration model', () => {
    const share = computeMigrationShare(50_000, 1_000_000, { ...baseParams, model: 'none' }, 5);
    expect(share).toBe(0);
  });

  it('returns 0 when additional tax is 0 or negative', () => {
    expect(computeMigrationShare(0, 1_000_000, baseParams, 5)).toBe(0);
    expect(computeMigrationShare(-10_000, 1_000_000, baseParams, 5)).toBe(0);
  });

  it('increases with additional tax burden', () => {
    const low = computeMigrationShare(10_000, 1_000_000, baseParams, 5);
    const high = computeMigrationShare(200_000, 1_000_000, baseParams, 5);
    expect(high).toBeGreaterThan(low);
  });

  it('never exceeds maxMigrationShare', () => {
    const share = computeMigrationShare(10_000_000, 1_000_000, baseParams, 5);
    expect(share).toBeLessThanOrEqual(baseParams.maxMigrationShare);
  });

  it('is lower at year 1 than year 5', () => {
    const y1 = computeMigrationShare(100_000, 1_000_000, baseParams, 1);
    const y5 = computeMigrationShare(100_000, 1_000_000, baseParams, 5);
    expect(y5).toBeGreaterThan(y1);
  });

  it('elasticity model responds to net-of-tax rate change', () => {
    const elasticParams = { ...baseParams, model: 'elasticity' as const };
    const low = computeMigrationShare(10_000, 1_000_000, elasticParams, 5);
    const high = computeMigrationShare(100_000, 1_000_000, elasticParams, 5);
    expect(high).toBeGreaterThan(low);
  });

  it('threshold model has sharp increase at threshold', () => {
    const threshParams = { ...baseParams, model: 'threshold' as const, thresholdDollars: 100_000 };
    const below = computeMigrationShare(90_000, 5_000_000, threshParams, 5);
    const above = computeMigrationShare(150_000, 5_000_000, threshParams, 5);
    expect(above).toBeGreaterThan(below * 1.5); // Should be noticeably higher
  });
});

describe('runModel - invariants', () => {
  it('produces approximately zero delta when tax change is zero', () => {
    const zeroPolicy: PolicyChange = {
      surchargeRate: 0,
      surchargeThreshold: 1_000_000,
      flatRateChange: 0,
      includeNyc: false,
      nycSurchargeRate: 0,
      nycSurchargeThreshold: 1_000_000,
    };
    const input: ModelInput = {
      ...DEFAULT_INPUT,
      policy: zeroPolicy,
    };
    const output = runModel(input);
    expect(Math.abs(output.totalMechanicalGain)).toBeLessThan(1); // essentially 0
    expect(Math.abs(output.totalBehavioralLoss)).toBeLessThan(1);
    expect(Math.abs(output.netRevenueChange)).toBeLessThan(1);
  });

  it('mechanical gain is positive for a tax increase', () => {
    const output = runModel(DEFAULT_INPUT);
    expect(output.totalMechanicalGain).toBeGreaterThan(0);
  });

  it('behavioral loss is non-negative', () => {
    const output = runModel(DEFAULT_INPUT);
    expect(output.totalBehavioralLoss).toBeGreaterThanOrEqual(0);
  });

  it('net = mechanical - behavioral', () => {
    const output = runModel(DEFAULT_INPUT);
    expect(output.netRevenueChange).toBeCloseTo(
      output.totalMechanicalGain - output.totalBehavioralLoss,
      0
    );
  });

  it('static model (no migration) has zero behavioral loss', () => {
    const input: ModelInput = {
      ...DEFAULT_INPUT,
      behavioral: { ...DEFAULT_BEHAVIORAL_PARAMS, model: 'none' },
    };
    const output = runModel(input);
    expect(output.totalBehavioralLoss).toBe(0);
    expect(output.netRevenueChange).toBe(output.totalMechanicalGain);
  });

  it('higher surcharge produces more mechanical gain', () => {
    const low = runModel({
      ...DEFAULT_INPUT,
      policy: { ...DEFAULT_INPUT.policy, surchargeRate: 0.01 },
    });
    const high = runModel({
      ...DEFAULT_INPUT,
      policy: { ...DEFAULT_INPUT.policy, surchargeRate: 0.05 },
    });
    expect(high.totalMechanicalGain).toBeGreaterThan(low.totalMechanicalGain);
  });
});

describe('baseline data', () => {
  it('has 10 cohorts', () => {
    expect(BASELINE_COHORTS).toHaveLength(10);
  });

  it('total filers approximately 10.4M', () => {
    const stats = getBaselineStats();
    expect(stats.totalFilers).toBeGreaterThan(9_000_000);
    expect(stats.totalFilers).toBeLessThan(12_000_000);
  });

  it('total NYS revenue approximately $59.5B', () => {
    const stats = getBaselineStats();
    // Allow 20% tolerance for bracket-level estimation
    expect(stats.totalNysRevenue).toBeGreaterThan(45_000_000_000);
    expect(stats.totalNysRevenue).toBeLessThan(75_000_000_000);
  });

  it('revenue is highly concentrated at the top', () => {
    const top1MShare = revenueShareAbove(1_000_000);
    expect(top1MShare).toBeGreaterThan(0.3); // Top brackets should be >30%
  });

  it('all cohorts have positive filer counts and AGI', () => {
    for (const c of BASELINE_COHORTS) {
      expect(c.filerCount).toBeGreaterThan(0);
      expect(c.totalAgi).toBeGreaterThan(0);
    }
  });
});

describe('middle income offset', () => {
  it('returns null rate when net revenue is positive', () => {
    const result = computeMiddleIncomeOffset(1_000_000, 75_000, 200_000);
    expect(result.rateIncrease).toBeNull();
  });

  it('returns positive rate when net revenue is negative', () => {
    const result = computeMiddleIncomeOffset(-1_000_000_000, 75_000, 200_000);
    expect(result.rateIncrease).toBeGreaterThan(0);
    expect(result.perFiler).toBeGreaterThan(0);
  });
});

describe('revenue curve', () => {
  it('starts at zero net revenue for zero surcharge', () => {
    const curve = generateRevenueCurve(DEFAULT_INPUT, 0.10, 20);
    expect(curve[0].surchargeRate).toBe(0);
    expect(Math.abs(curve[0].netRevenue)).toBeLessThan(1);
  });

  it('mechanical gain increases monotonically with rate', () => {
    const curve = generateRevenueCurve(DEFAULT_INPUT, 0.10, 20);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].mechanicalGain).toBeGreaterThanOrEqual(curve[i - 1].mechanicalGain - 0.01);
    }
  });
});

describe('export functions', () => {
  it('exportResultsCSV produces valid CSV', () => {
    const output = runModel(DEFAULT_INPUT);
    const csv = exportResultsCSV(output, DEFAULT_INPUT);
    expect(csv).toContain('Cohort');
    expect(csv).toContain('Under $25K');
    expect(csv.split('\n').length).toBeGreaterThan(10);
  });

  it('exportAssumptionsJSON produces valid JSON', () => {
    const json = exportAssumptionsJSON(DEFAULT_INPUT);
    const parsed = JSON.parse(json);
    expect(parsed.policy).toBeDefined();
    expect(parsed.behavioral).toBeDefined();
    expect(parsed.dataSources).toBeDefined();
  });
});
