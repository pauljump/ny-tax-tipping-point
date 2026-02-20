'use client';

import { CohortResult } from '@/lib/types';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/defaults';

interface Props {
  results: CohortResult[];
}

export function CohortTable({ results }: Props) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b-2 border-[var(--card-border)]">
          <th className="text-left py-2 pr-2">Income Bracket</th>
          <th className="text-right py-2 px-2">Filers</th>
          <th className="text-right py-2 px-2">Avg AGI</th>
          <th className="text-right py-2 px-2">+Tax/Filer</th>
          <th className="text-right py-2 px-2">Mechanical</th>
          <th className="text-right py-2 px-2">Migration</th>
          <th className="text-right py-2 px-2">Loss</th>
          <th className="text-right py-2 pl-2">Net</th>
        </tr>
      </thead>
      <tbody>
        {results.map((r, i) => {
          const avgAgi = r.cohort.totalAgi / r.cohort.filerCount;
          return (
            <tr key={i} className="border-b border-[var(--card-border)] hover:bg-[var(--accent-light)] transition-colors">
              <td className="py-1.5 pr-2 font-medium">{r.cohort.label}</td>
              <td className="text-right py-1.5 px-2 font-mono text-xs">{formatNumber(r.cohort.filerCount)}</td>
              <td className="text-right py-1.5 px-2 font-mono text-xs">{formatCurrency(avgAgi, true)}</td>
              <td className="text-right py-1.5 px-2 font-mono text-xs">
                {r.additionalTaxPerFiler > 0 ? formatCurrency(r.additionalTaxPerFiler, true) : '—'}
              </td>
              <td className="text-right py-1.5 px-2 font-mono text-xs text-green-600 dark:text-green-400">
                {r.mechanicalGain > 0 ? formatCurrency(r.mechanicalGain, true) : '—'}
              </td>
              <td className="text-right py-1.5 px-2 font-mono text-xs">
                {r.migrationShare > 0.0001 ? formatPercent(r.migrationShare) : '—'}
              </td>
              <td className="text-right py-1.5 px-2 font-mono text-xs text-red-600 dark:text-red-400">
                {r.migrationLoss > 0 ? `-${formatCurrency(r.migrationLoss, true)}` : '—'}
              </td>
              <td className={`text-right py-1.5 pl-2 font-mono text-xs font-semibold ${
                r.netRevenueChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {Math.abs(r.netRevenueChange) < 1000 ? '—' : `${r.netRevenueChange >= 0 ? '+' : ''}${formatCurrency(r.netRevenueChange, true)}`}
              </td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-[var(--card-border)] font-semibold">
          <td className="py-2 pr-2">Total</td>
          <td className="text-right py-2 px-2 font-mono text-xs">
            {formatNumber(results.reduce((s, r) => s + r.cohort.filerCount, 0))}
          </td>
          <td className="text-right py-2 px-2" />
          <td className="text-right py-2 px-2" />
          <td className="text-right py-2 px-2 font-mono text-xs text-green-600 dark:text-green-400">
            {formatCurrency(results.reduce((s, r) => s + r.mechanicalGain, 0), true)}
          </td>
          <td className="text-right py-2 px-2" />
          <td className="text-right py-2 px-2 font-mono text-xs text-red-600 dark:text-red-400">
            -{formatCurrency(results.reduce((s, r) => s + r.migrationLoss, 0), true)}
          </td>
          <td className={`text-right py-2 pl-2 font-mono text-xs ${
            results.reduce((s, r) => s + r.netRevenueChange, 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {(() => {
              const total = results.reduce((s, r) => s + r.netRevenueChange, 0);
              return `${total >= 0 ? '+' : ''}${formatCurrency(total, true)}`;
            })()}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
