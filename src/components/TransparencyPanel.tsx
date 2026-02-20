'use client';

import { ParamMeta } from '@/lib/types';

interface Props {
  params: ParamMeta[];
}

export function TransparencyPanel({ params }: Props) {
  const dataParams = params.filter(p => !p.source.isAssumption);
  const assumptionParams = params.filter(p => p.source.isAssumption);

  return (
    <div className="space-y-6">
      {/* Data-backed parameters */}
      <div className="card">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
          Data-Backed Parameters
        </h3>
        <div className="space-y-4">
          {dataParams.map((p, i) => (
            <ParamRow key={i} param={p} />
          ))}
        </div>
      </div>

      {/* Assumption-driven parameters */}
      <div className="card">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
          Assumption-Driven Parameters
        </h3>
        <p className="text-sm text-[var(--muted)] mb-4">
          These values are not directly observable. Defaults are informed by academic literature
          but carry significant uncertainty. Use the sensitivity analysis to understand their impact.
        </p>
        <div className="space-y-4">
          {assumptionParams.map((p, i) => (
            <ParamRow key={i} param={p} />
          ))}
        </div>
      </div>

      {/* Interpretation Guide */}
      <div className="card bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <h3 className="font-semibold mb-3">Interpretation Guide</h3>
        <div className="text-sm space-y-3">
          <section>
            <h4 className="font-medium">What this model CAN do:</h4>
            <ul className="list-disc ml-5 mt-1 space-y-1 text-[var(--muted)]">
              <li>Show the mechanical revenue from a tax change before behavior changes</li>
              <li>Illustrate how different behavioral assumptions affect net revenue</li>
              <li>Identify the &quot;tipping point&quot; where behavioral losses exceed gains under specific assumptions</li>
              <li>Compare scenarios across a range of plausible parameters</li>
              <li>Quantify what middle-income filers would need to pay to offset any shortfall</li>
            </ul>
          </section>
          <section>
            <h4 className="font-medium">What this model CANNOT do:</h4>
            <ul className="list-disc ml-5 mt-1 space-y-1 text-[var(--muted)]">
              <li>Predict exactly how many people will move (migration is deeply personal)</li>
              <li>Account for business relocation effects or corporate tax interactions</li>
              <li>Model general equilibrium effects (housing market, labor market, services)</li>
              <li>Capture political dynamics (other states might raise taxes too)</li>
              <li>Predict revenue with precision—uncertainty is inherent</li>
            </ul>
          </section>
          <section>
            <h4 className="font-medium">Key uncertainties:</h4>
            <ul className="list-disc ml-5 mt-1 space-y-1 text-[var(--muted)]">
              <li><strong>Migration elasticity</strong> is the most impactful assumption. Literature estimates range 4-5x.</li>
              <li><strong>Timing</strong> matters: year 1 vs year 5 results differ substantially.</li>
              <li><strong>Replacement</strong> (new high earners moving in) is unknown but non-zero for NYC.</li>
              <li>Results are most reliable for <strong>moderate</strong> tax changes (&lt;3pp surcharge). Extreme scenarios are more uncertain.</li>
            </ul>
          </section>
        </div>
      </div>

      {/* Data Sources */}
      <div className="card">
        <h3 className="font-semibold mb-3">Data Sources</h3>
        <div className="text-sm space-y-2">
          {[
            { name: 'IRS SOI Table 2 (TY2022)', url: 'https://www.irs.gov/pub/irs-soi/22in33ny.xlsx', desc: 'Filer counts and AGI by income bracket for New York — primary data source' },
            { name: 'Citizens Budget Commission', url: 'https://cbcny.org/research/hidden-cost-new-yorks-shrinking-millionaire-share', desc: 'Revenue concentration analysis — millionaires pay 44% of NYS PIT' },
            { name: 'NYS Comptroller', url: 'https://www.osc.ny.gov/reports/finance', desc: 'Annual financial reports — NYS PIT total ~$58.5B (FY2023)' },
            { name: 'NYC Independent Budget Office', url: 'https://www.ibo.nyc.ny.us/', desc: 'NYC PIT analysis — ~$16.8B total (FY2023)' },
            { name: 'Tax Foundation', url: 'https://taxfoundation.org/data/all/federal/latest-federal-income-tax-data-2025/', desc: 'National income tax percentile thresholds' },
            { name: 'IRS Migration Data', url: 'https://www.irs.gov/statistics/soi-tax-stats-migration-data', desc: 'Year-to-year address changes by income' },
            { name: 'Young et al. (2016)', url: 'https://doi.org/10.1177/0003122416639625', desc: 'Millionaire Migration and Taxation of the Elite - ASR' },
            { name: 'Moretti & Wilson (2017)', url: 'https://doi.org/10.1162/REST_a_00653', desc: 'Effect of State Taxes on Location of Top Earners - REStat' },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[var(--accent)] shrink-0">→</span>
              <div>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--accent)] hover:underline">
                  {s.name}
                </a>
                <span className="text-[var(--muted)]"> — {s.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ParamRow({ param }: { param: ParamMeta }) {
  return (
    <div className="border-b border-[var(--card-border)] pb-3 last:border-0 last:pb-0">
      <div className="flex justify-between items-start">
        <div>
          <span className="font-medium text-sm">{param.name}</span>
          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
            param.source.isAssumption
              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
              : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
          }`}>
            {param.source.isAssumption ? 'Assumption' : 'Data'}
          </span>
        </div>
        <span className="font-mono text-sm text-[var(--accent)]">{String(param.defaultValue)}</span>
      </div>
      <p className="text-xs text-[var(--muted)] mt-1">{param.description}</p>
      {param.source.url && (
        <a href={param.source.url} target="_blank" rel="noopener noreferrer"
          className="text-xs text-[var(--accent)] hover:underline mt-0.5 inline-block">
          {param.source.name} ({param.source.year})
        </a>
      )}
      {param.source.notes && (
        <p className="text-xs text-[var(--muted)] italic mt-0.5">{param.source.notes}</p>
      )}
    </div>
  );
}
