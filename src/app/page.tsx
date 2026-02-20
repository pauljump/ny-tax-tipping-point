'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  ModelInput,
  PolicyChange,
  BehavioralParams,
  BehavioralModelType,
  TimeHorizon,
  ModelOutput,
} from '@/lib/types';
import { runModel, runScenarios, generateRevenueCurve, exportResultsCSV, exportAssumptionsJSON, DEFAULT_BEHAVIORAL_PARAMS } from '@/lib/model';
import { getBaselineStats, revenueShareAbove } from '@/lib/data';
import { DEFAULT_INPUT, formatCurrency, formatPercent, formatNumber, PARAM_METADATA } from '@/lib/defaults';
import { RevenueChart } from '@/components/RevenueChart';
import { WaterfallChart } from '@/components/WaterfallChart';
import { MigrationChart } from '@/components/MigrationChart';
import { CohortTable } from '@/components/CohortTable';
import { TransparencyPanel } from '@/components/TransparencyPanel';

export default function Home() {
  const [input, setInput] = useState<ModelInput>(DEFAULT_INPUT);
  const [activeTab, setActiveTab] = useState<'results' | 'scenarios' | 'sensitivity' | 'transparency'>('results');

  const updatePolicy = useCallback((updates: Partial<PolicyChange>) => {
    setInput(prev => ({ ...prev, policy: { ...prev.policy, ...updates } }));
  }, []);

  const updateBehavioral = useCallback((updates: Partial<BehavioralParams>) => {
    setInput(prev => ({ ...prev, behavioral: { ...prev.behavioral, ...updates } }));
  }, []);

  const output = useMemo(() => runModel(input), [input]);
  const scenarios = useMemo(() => runScenarios(input), [input]);
  const revenueCurve = useMemo(
    () => generateRevenueCurve(input, 0.10, 50),
    [input],
  );
  const baselineStats = useMemo(() => getBaselineStats(), []);

  const handleExportCSV = () => {
    const csv = exportResultsCSV(output, input);
    downloadFile(csv, 'ny_tax_results.csv', 'text/csv');
  };

  const handleExportJSON = () => {
    const json = exportAssumptionsJSON(input);
    downloadFile(json, 'ny_tax_assumptions.json', 'application/json');
  };

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <header className="border-b border-[var(--card-border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">NY Tax Tipping Point Calculator</h1>
          <p className="text-[var(--muted)] mt-1">
            Model how proposed NYS + NYC tax changes affect revenue after behavioral migration response
          </p>
          <div className="flex gap-4 mt-3 text-sm">
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
              Data: Tax Year 2022 (IRS SOI)
            </span>
            <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded">
              {formatNumber(baselineStats.totalFilers)} filers
            </span>
            <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded">
              Baseline: {formatCurrency(baselineStats.totalRevenue, true)} total PIT
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        {/* Left: Input Panel */}
        <aside className="space-y-4">
          {/* Policy Changes */}
          <section className="card">
            <h2 className="font-semibold text-lg mb-4">Policy Changes</h2>

            <div className="space-y-4">
              <SliderInput
                label="NYS Surcharge Rate"
                value={input.policy.surchargeRate}
                min={0} max={0.10} step={0.001}
                format={v => formatPercent(v)}
                onChange={v => updatePolicy({ surchargeRate: v })}
              />
              <SelectInput
                label="Surcharge Threshold"
                value={input.policy.surchargeThreshold}
                options={[
                  { label: '$500K', value: 500_000 },
                  { label: '$1M', value: 1_000_000 },
                  { label: '$2M', value: 2_000_000 },
                  { label: '$5M', value: 5_000_000 },
                  { label: '$10M', value: 10_000_000 },
                  { label: '$25M', value: 25_000_000 },
                ]}
                onChange={v => updatePolicy({ surchargeThreshold: v })}
              />
              <SliderInput
                label="Flat Rate Change (all brackets)"
                value={input.policy.flatRateChange}
                min={-0.02} max={0.02} step={0.001}
                format={v => `${v >= 0 ? '+' : ''}${formatPercent(v)}`}
                onChange={v => updatePolicy({ flatRateChange: v })}
              />
              <CheckboxInput
                label="Include NYC tax changes"
                checked={input.policy.includeNyc}
                onChange={v => updatePolicy({ includeNyc: v })}
              />
              {input.policy.includeNyc && (
                <>
                  <SliderInput
                    label="NYC Surcharge Rate"
                    value={input.policy.nycSurchargeRate}
                    min={0} max={0.05} step={0.001}
                    format={v => formatPercent(v)}
                    onChange={v => updatePolicy({ nycSurchargeRate: v })}
                  />
                  <SelectInput
                    label="NYC Surcharge Threshold"
                    value={input.policy.nycSurchargeThreshold}
                    options={[
                      { label: '$500K', value: 500_000 },
                      { label: '$1M', value: 1_000_000 },
                      { label: '$5M', value: 5_000_000 },
                    ]}
                    onChange={v => updatePolicy({ nycSurchargeThreshold: v })}
                  />
                </>
              )}
            </div>
          </section>

          {/* Behavioral Model */}
          <section className="card">
            <h2 className="font-semibold text-lg mb-4">Behavioral Response Model</h2>
            <div className="space-y-4">
              <SelectInput
                label="Migration Model"
                value={input.behavioral.model}
                options={[
                  { label: 'No migration (static)', value: 'none' },
                  { label: 'Elasticity model', value: 'elasticity' },
                  { label: 'Threshold/tipping model', value: 'threshold' },
                  { label: 'Hybrid logistic (recommended)', value: 'hybrid' },
                ]}
                onChange={v => updateBehavioral({ model: v as BehavioralModelType })}
              />
              {input.behavioral.model !== 'none' && (
                <>
                  <SliderInput
                    label="Migration Elasticity"
                    value={input.behavioral.migrationElasticity}
                    min={0} max={4} step={0.1}
                    format={v => v.toFixed(1)}
                    onChange={v => updateBehavioral({ migrationElasticity: v })}
                    note="Literature range: 0.4–2.3"
                  />
                  <SliderInput
                    label="Max Migration Share"
                    value={input.behavioral.maxMigrationShare}
                    min={0} max={0.40} step={0.01}
                    format={v => formatPercent(v, 0)}
                    onChange={v => updateBehavioral({ maxMigrationShare: v })}
                    note="Assumption"
                  />
                  {(input.behavioral.model === 'threshold' || input.behavioral.model === 'hybrid') && (
                    <SliderInput
                      label="Tipping Threshold ($/year)"
                      value={input.behavioral.thresholdDollars}
                      min={10_000} max={500_000} step={10_000}
                      format={v => formatCurrency(v, true)}
                      onChange={v => updateBehavioral({ thresholdDollars: v })}
                      note="Assumption"
                    />
                  )}
                  {input.behavioral.model === 'hybrid' && (
                    <SliderInput
                      label="Logistic Slope"
                      value={input.behavioral.logisticSlope}
                      min={10_000} max={200_000} step={5_000}
                      format={v => formatCurrency(v, true)}
                      onChange={v => updateBehavioral({ logisticSlope: v })}
                      note="Controls steepness of S-curve"
                    />
                  )}
                  <SliderInput
                    label="Replacement Rate"
                    value={input.behavioral.replacementRate}
                    min={0} max={0.5} step={0.05}
                    format={v => formatPercent(v, 0)}
                    onChange={v => updateBehavioral({ replacementRate: v })}
                    note="New arrivals offsetting departures"
                  />
                </>
              )}
            </div>
          </section>

          {/* Time Horizon & Middle Income */}
          <section className="card">
            <h2 className="font-semibold text-lg mb-4">Projection Settings</h2>
            <div className="space-y-4">
              <SelectInput
                label="Time Horizon"
                value={input.timeHorizon}
                options={[
                  { label: '1 Year', value: 1 },
                  { label: '3 Years', value: 3 },
                  { label: '5 Years', value: 5 },
                ]}
                onChange={v => setInput(prev => ({ ...prev, timeHorizon: v as TimeHorizon }))}
              />
              <SelectInput
                label="Middle-Income Range (for offset)"
                value={`${input.middleIncomeMin}-${input.middleIncomeMax}`}
                options={[
                  { label: '$50K–$150K', value: '50000-150000' },
                  { label: '$75K–$200K', value: '75000-200000' },
                  { label: '$100K–$250K', value: '100000-250000' },
                ]}
                onChange={v => {
                  const [min, max] = v.split('-').map(Number);
                  setInput(prev => ({ ...prev, middleIncomeMin: min, middleIncomeMax: max }));
                }}
              />
            </div>
          </section>

          {/* Export */}
          <section className="card">
            <h2 className="font-semibold text-lg mb-3">Export</h2>
            <div className="flex gap-2">
              <button onClick={handleExportCSV} className="btn-secondary flex-1">
                Results CSV
              </button>
              <button onClick={handleExportJSON} className="btn-secondary flex-1">
                Assumptions JSON
              </button>
            </div>
          </section>
        </aside>

        {/* Right: Results */}
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard
              label="Mechanical Gain"
              value={formatCurrency(output.totalMechanicalGain, true)}
              color="text-green-600 dark:text-green-400"
              subtitle="Before behavioral response"
            />
            <SummaryCard
              label="Behavioral Loss"
              value={formatCurrency(-output.totalBehavioralLoss, true)}
              color="text-red-600 dark:text-red-400"
              subtitle="From migration"
            />
            <SummaryCard
              label="Net Revenue Change"
              value={`${output.netRevenueChange >= 0 ? '+' : ''}${formatCurrency(output.netRevenueChange, true)}`}
              color={output.netRevenueChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
              subtitle={`${formatPercent(output.netRevenueChange / output.baselineRevenue)} of baseline`}
            />
            <SummaryCard
              label="Middle-Class Offset"
              value={output.middleIncomeOffsetPerFiler !== null
                ? `${formatCurrency(output.middleIncomeOffsetPerFiler)}/filer`
                : 'N/A (surplus)'}
              color={output.middleIncomeOffsetPerFiler !== null ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500'}
              subtitle={output.middleIncomeOffset !== null
                ? `+${formatPercent(output.middleIncomeOffset)} rate increase on ${formatNumber(output.middleIncomeFilerCount)} filers`
                : 'No revenue shortfall'}
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-[var(--card-border)]">
            {(['results', 'scenarios', 'sensitivity', 'transparency'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'results' && (
            <div className="space-y-4">
              {/* Waterfall Chart */}
              <div className="card">
                <h3 className="font-semibold mb-3">Revenue Impact Waterfall</h3>
                <WaterfallChart output={output} />
              </div>

              {/* Revenue Curve */}
              <div className="card">
                <h3 className="font-semibold mb-3">
                  Net Revenue vs Surcharge Rate
                  <span className="text-sm font-normal text-[var(--muted)] ml-2">
                    (threshold: {formatCurrency(input.policy.surchargeThreshold, true)}+)
                  </span>
                </h3>
                <RevenueChart data={revenueCurve} currentRate={input.policy.surchargeRate} />
              </div>

              {/* Migration Chart */}
              <div className="card">
                <h3 className="font-semibold mb-3">Migration Response by Cohort</h3>
                <MigrationChart results={output.cohortResults} />
              </div>

              {/* Cohort Table */}
              <div className="card overflow-x-auto">
                <h3 className="font-semibold mb-3">Detailed Cohort Breakdown</h3>
                <CohortTable results={output.cohortResults} />
              </div>

              {/* Plain English Summary */}
              <div className="card bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold mb-2">Plain English Summary</h3>
                <PlainEnglishSummary output={output} input={input} />
              </div>
            </div>
          )}

          {activeTab === 'scenarios' && (
            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold mb-4">Scenario Comparison</h3>
                <p className="text-sm text-[var(--muted)] mb-4">
                  Same policy change modeled with different behavioral assumptions.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scenarios.map((s, i) => (
                    <div key={i} className="border border-[var(--card-border)] rounded-lg p-4">
                      <h4 className="font-medium text-sm mb-2">{s.label}</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[var(--muted)]">Mechanical gain:</span>
                          <span className="text-green-600 dark:text-green-400">{formatCurrency(s.output.totalMechanicalGain, true)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--muted)]">Behavioral loss:</span>
                          <span className="text-red-600 dark:text-red-400">{formatCurrency(-s.output.totalBehavioralLoss, true)}</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t border-[var(--card-border)] pt-1 mt-1">
                          <span>Net change:</span>
                          <span className={s.output.netRevenueChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {s.output.netRevenueChange >= 0 ? '+' : ''}{formatCurrency(s.output.netRevenueChange, true)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue Concentration */}
              <div className="card">
                <h3 className="font-semibold mb-3">Revenue Concentration</h3>
                <p className="text-sm text-[var(--muted)] mb-3">
                  How much of total NYS+NYC income tax revenue comes from each income group.
                </p>
                <div className="space-y-2">
                  {[
                    { label: '$1M+', threshold: 1_000_000 },
                    { label: '$500K+', threshold: 500_000 },
                    { label: '$200K+', threshold: 200_000 },
                    { label: '$100K+', threshold: 100_000 },
                  ].map(({ label, threshold }) => {
                    const share = revenueShareAbove(threshold);
                    return (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-sm w-16 text-right font-mono">{label}</span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-5 relative">
                          <div
                            className="bg-blue-500 h-5 rounded-full"
                            style={{ width: `${share * 100}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                            {formatPercent(share, 0)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tax Rate Comparison */}
              <div className="card">
                <h3 className="font-semibold mb-3">Combined Top Marginal Rates — Competing Jurisdictions</h3>
                <p className="text-sm text-[var(--muted)] mb-3">
                  NYC has the highest combined state+local income tax rate in the nation.
                  SALT deduction cap: $40,000 (raised from $10,000 in 2025).
                </p>
                <div className="space-y-2">
                  {[
                    { label: 'NYC (NYS+NYC)', rate: 0.14776, federal: 0.37, color: '#dc2626' },
                    { label: 'California', rate: 0.133, federal: 0.37, color: '#f59e0b' },
                    { label: 'New Jersey', rate: 0.1075, federal: 0.37, color: '#f59e0b' },
                    { label: 'Connecticut', rate: 0.0699, federal: 0.37, color: '#3b82f6' },
                    { label: 'Florida / Texas', rate: 0, federal: 0.37, color: '#16a34a' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-3">
                      <span className="text-sm w-28 text-right">{s.label}</span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-5 relative">
                        <div
                          className="h-5 rounded-full"
                          style={{ width: `${((s.rate + s.federal) / 0.55) * 100}%`, backgroundColor: s.color }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                          {formatPercent(s.rate + s.federal, 1)} total ({formatPercent(s.rate, 1)} state/local)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[var(--muted)] mt-2 italic">
                  NYS surcharges (10.30%, 10.90%) sunset after 2027. The 9.65% rate extended through 2032.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'sensitivity' && (
            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold mb-2">Sensitivity Analysis</h3>
                <p className="text-sm text-[var(--muted)] mb-4">
                  How net revenue changes as you vary key behavioral parameters.
                  Current policy: {formatPercent(input.policy.surchargeRate)} surcharge above {formatCurrency(input.policy.surchargeThreshold, true)}.
                </p>
                <SensitivityTable input={input} />
              </div>
            </div>
          )}

          {activeTab === 'transparency' && (
            <TransparencyPanel params={PARAM_METADATA} />
          )}
        </div>
      </div>
    </main>
  );
}

// ─────────────────────────────────────
// Sub-components (inline for simplicity)
// ─────────────────────────────────────

function SummaryCard({ label, value, color, subtitle }: {
  label: string; value: string; color: string; subtitle: string;
}) {
  return (
    <div className="card">
      <div className="text-xs text-[var(--muted)] uppercase tracking-wide">{label}</div>
      <div className={`text-xl font-bold mt-1 ${color}`}>{value}</div>
      <div className="text-xs text-[var(--muted)] mt-1">{subtitle}</div>
    </div>
  );
}

function SliderInput({ label, value, min, max, step, format, onChange, note }: {
  label: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void; note?: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <label className="font-medium">{label}</label>
        <span className="font-mono text-[var(--accent)]">{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-[var(--accent)]"
      />
      {note && <div className="text-xs text-[var(--muted)] mt-0.5 italic">{note}</div>}
    </div>
  );
}

function SelectInput<T extends string | number>({ label, value, options, onChange }: {
  label: string; value: T; options: { label: string; value: T }[]; onChange: (v: T) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      <select
        value={String(value)}
        onChange={e => {
          const opt = options.find(o => String(o.value) === e.target.value);
          if (opt) onChange(opt.value);
        }}
        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded px-2 py-1.5 text-sm"
      >
        {options.map(o => (
          <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function CheckboxInput({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="accent-[var(--accent)]" />
      {label}
    </label>
  );
}

function PlainEnglishSummary({ output, input }: { output: ModelOutput; input: ModelInput }) {
  const policyDesc = input.policy.surchargeRate > 0
    ? `a ${formatPercent(input.policy.surchargeRate)} surcharge on income above ${formatCurrency(input.policy.surchargeThreshold, true)}`
    : 'the proposed tax change';

  const modelDesc = input.behavioral.model === 'none' ? 'no behavioral response' : `the ${input.behavioral.model} behavioral model`;

  return (
    <div className="text-sm space-y-2">
      <p>
        Under {policyDesc}, the <strong>mechanical revenue gain</strong> (assuming nobody changes behavior)
        would be <strong className="text-green-700 dark:text-green-400">{formatCurrency(output.totalMechanicalGain, true)}</strong>.
      </p>
      <p>
        Using {modelDesc} over a <strong>{input.timeHorizon}-year</strong> horizon,
        an estimated <strong className="text-red-700 dark:text-red-400">{formatCurrency(output.totalBehavioralLoss, true)}</strong> would
        be lost due to high-income filers relocating, taking both their existing tax payments and the new surcharge with them.
      </p>
      <p>
        The <strong>net revenue impact</strong> is{' '}
        <strong className={output.netRevenueChange >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
          {output.netRevenueChange >= 0 ? '+' : ''}{formatCurrency(output.netRevenueChange, true)}
        </strong>
        {' '}({formatPercent(Math.abs(output.netRevenueChange / output.baselineRevenue))} of baseline revenue).
      </p>
      {output.middleIncomeOffset !== null && (
        <p>
          To close this gap, middle-income filers ({formatCurrency(input.middleIncomeMin, true)}–{formatCurrency(input.middleIncomeMax, true)})
          would need a rate increase of <strong className="text-orange-700 dark:text-orange-400">{formatPercent(output.middleIncomeOffset, 2)}</strong>,
          costing each of the {formatNumber(output.middleIncomeFilerCount)} affected filers
          an additional <strong>{formatCurrency(output.middleIncomeOffsetPerFiler!, false)}</strong>/year.
        </p>
      )}
      <p className="text-[var(--muted)] italic">
        These estimates are sensitive to behavioral assumptions. See the Scenarios and Sensitivity tabs for ranges.
        This model cannot predict whether any specific individual will move.
      </p>
    </div>
  );
}

function SensitivityTable({ input }: { input: ModelInput }) {
  const params = [
    { name: 'Migration Elasticity', key: 'migrationElasticity' as const, values: [0, 0.5, 1.0, 1.5, 2.0, 3.0, 4.0] },
    { name: 'Max Migration Share', key: 'maxMigrationShare' as const, values: [0.05, 0.10, 0.15, 0.20, 0.30] },
    { name: 'Threshold ($K)', key: 'thresholdDollars' as const, values: [25_000, 50_000, 100_000, 200_000, 500_000] },
  ];

  return (
    <div className="space-y-6">
      {params.map(p => (
        <div key={p.key}>
          <h4 className="text-sm font-medium mb-2">{p.name}</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--card-border)]">
                  <th className="text-left py-1 pr-4 text-[var(--muted)]">Value</th>
                  <th className="text-right py-1 px-2 text-[var(--muted)]">Net Revenue</th>
                  <th className="text-right py-1 pl-2 text-[var(--muted)]">Change</th>
                </tr>
              </thead>
              <tbody>
                {p.values.map(val => {
                  const modInput = {
                    ...input,
                    behavioral: { ...input.behavioral, [p.key]: val },
                  };
                  const result = runModel(modInput);
                  const isDefault = val === input.behavioral[p.key];
                  return (
                    <tr key={val} className={`border-b border-[var(--card-border)] ${isDefault ? 'bg-blue-50 dark:bg-blue-950' : ''}`}>
                      <td className="py-1 pr-4 font-mono">
                        {p.key === 'thresholdDollars' ? formatCurrency(val, true) :
                         p.key === 'maxMigrationShare' ? formatPercent(val, 0) :
                         val.toFixed(1)}
                        {isDefault && <span className="text-xs text-[var(--accent)] ml-1">(default)</span>}
                      </td>
                      <td className={`text-right py-1 px-2 font-mono ${result.netRevenueChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {result.netRevenueChange >= 0 ? '+' : ''}{formatCurrency(result.netRevenueChange, true)}
                      </td>
                      <td className="text-right py-1 pl-2 text-[var(--muted)] font-mono">
                        {formatPercent(result.netRevenueChange / result.baselineRevenue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
