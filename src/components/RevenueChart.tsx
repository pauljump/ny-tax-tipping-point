'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from 'recharts';
import { RevenueCurvePoint } from '@/lib/model';
import { formatCurrency, formatPercent } from '@/lib/defaults';

interface Props {
  data: RevenueCurvePoint[];
  currentRate: number;
}

export function RevenueChart({ data, currentRate }: Props) {
  const chartData = data.map(d => ({
    rate: d.surchargeRate,
    rateLabel: formatPercent(d.surchargeRate),
    mechanical: d.mechanicalGain / 1e9,
    behavioral: -d.behavioralLoss / 1e9,
    net: d.netRevenue / 1e9,
  }));

  // Find peak net revenue
  const peak = chartData.reduce((best, d) => d.net > best.net ? d : best, chartData[0]);
  // Find tipping point (where net crosses zero)
  const tippingIdx = chartData.findIndex(d => d.net < 0);
  const tippingRate = tippingIdx >= 0 ? chartData[tippingIdx].rate : null;

  return (
    <div>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="rate"
            tickFormatter={v => formatPercent(v, 0)}
            label={{ value: 'Surcharge Rate', position: 'insideBottom', offset: -5, fontSize: 12 }}
          />
          <YAxis
            tickFormatter={v => `$${v.toFixed(1)}B`}
            label={{ value: 'Revenue ($B)', angle: -90, position: 'insideLeft', fontSize: 12 }}
          />
          <Tooltip
            formatter={(value, name) => [`$${Number(value).toFixed(2)}B`, name]}
            labelFormatter={v => `Rate: ${formatPercent(Number(v))}`}
          />
          <Legend />
          <Area type="monotone" dataKey="mechanical" name="Mechanical Gain" stroke="#14b8a6" fill="#99f6e4" fillOpacity={0.5} />
          <Area type="monotone" dataKey="net" name="Net Revenue" stroke="#2563eb" fill="#dbeafe" fillOpacity={0.5} />
          <Area type="monotone" dataKey="behavioral" name="Behavioral Loss" stroke="#f43f5e" fill="#fecdd3" fillOpacity={0.5} />
          <ReferenceLine x={currentRate} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Current', position: 'top', fontSize: 11 }} />
          {tippingRate !== null && (
            <ReferenceLine x={tippingRate} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Tipping Point', position: 'top', fontSize: 11 }} />
          )}
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex gap-4 text-xs text-[var(--muted)] mt-2 justify-center">
        {peak && <span>Peak net revenue at {formatPercent(peak.rate)} surcharge</span>}
        {tippingRate !== null && <span>Net negative above {formatPercent(tippingRate)}</span>}
      </div>
    </div>
  );
}
