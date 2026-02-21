'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CohortResult } from '@/lib/types';
import { formatPercent, formatCurrency } from '@/lib/defaults';

interface Props {
  results: CohortResult[];
}

export function MigrationChart({ results }: Props) {
  const data = results
    .filter(r => r.migrationShare > 0.0001)
    .map(r => ({
      name: r.cohort.label,
      migrationPct: r.migrationShare * 100,
      additionalTax: r.additionalTaxPerFiler,
      leavers: Math.round(r.cohort.filerCount * r.migrationShare),
    }));

  if (data.length === 0) {
    return (
      <div className="text-center text-[var(--muted)] py-8">
        No migration predicted under current model settings.
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="name" fontSize={11} angle={-20} textAnchor="end" height={60} />
          <YAxis tickFormatter={v => `${v.toFixed(1)}%`} label={{ value: 'Expected Leavers (%)', angle: -90, position: 'insideLeft', fontSize: 12 }} />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Migration Share']}
            labelFormatter={(label) => {
              const labelStr = String(label);
              const item = data.find(d => d.name === labelStr);
              return item ? `${labelStr} — +${formatCurrency(item.additionalTax, true)}/filer, ~${item.leavers.toLocaleString()} leavers` : labelStr;
            }}
          />
          <Bar dataKey="migrationPct" name="Migration %">
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.migrationPct > 10 ? '#f43f5e' : entry.migrationPct > 5 ? '#a78bfa' : '#3b82f6'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
