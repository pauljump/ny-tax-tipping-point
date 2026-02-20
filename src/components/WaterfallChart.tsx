'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ModelOutput } from '@/lib/types';
import { formatCurrency } from '@/lib/defaults';

interface Props {
  output: ModelOutput;
}

export function WaterfallChart({ output }: Props) {
  const data = [
    {
      name: 'Baseline',
      value: output.baselineRevenue / 1e9,
      fill: '#64748b',
      base: 0,
    },
    {
      name: 'Mechanical Gain',
      value: output.totalMechanicalGain / 1e9,
      fill: '#16a34a',
      base: output.baselineRevenue / 1e9,
    },
    {
      name: 'Behavioral Loss',
      value: -output.totalBehavioralLoss / 1e9,
      fill: '#dc2626',
      base: (output.baselineRevenue + output.totalMechanicalGain) / 1e9,
    },
    {
      name: 'Net Result',
      value: (output.baselineRevenue + output.netRevenueChange) / 1e9,
      fill: output.netRevenueChange >= 0 ? '#2563eb' : '#dc2626',
      base: 0,
    },
  ];

  // For waterfall, we need stacked bars with invisible bases
  const chartData = data.map(d => ({
    name: d.name,
    base: d.name === 'Baseline' || d.name === 'Net Result' ? 0 : d.base,
    value: d.name === 'Baseline' || d.name === 'Net Result' ? d.value : Math.abs(d.value),
    actualValue: d.value,
    fill: d.fill,
    isNegative: d.value < 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="name" fontSize={12} />
        <YAxis tickFormatter={v => `$${v.toFixed(0)}B`} />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: any, props: any) => {
            if (name === 'base') return [null, null];
            return [`$${props?.payload?.actualValue?.toFixed(2)}B`, props?.payload?.name];
          }}
        />
        <Bar dataKey="base" stackId="a" fill="transparent" />
        <Bar dataKey="value" stackId="a">
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
