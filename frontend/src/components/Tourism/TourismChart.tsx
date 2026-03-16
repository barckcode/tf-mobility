import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { TourismMonthly } from '@/types';

interface TourismChartProps {
  data: TourismMonthly[];
}

function formatMillions(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

/** Generate a gradient color from light yellow to dark orange based on position */
function getBarColor(index: number, total: number): string {
  const ratio = total > 1 ? index / (total - 1) : 0;
  // Interpolate from #FCD34D (light yellow) to #D97706 (dark amber/orange)
  const r = Math.round(252 - ratio * (252 - 217));
  const g = Math.round(211 - ratio * (211 - 119));
  const b = Math.round(77 - ratio * (77 - 6));
  return `rgb(${r}, ${g}, ${b})`;
}

const DARK_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '13px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  itemStyle: { color: '#e2e8f0' },
  labelStyle: { color: '#94a3b8', marginBottom: '4px' },
  cursor: { fill: 'rgba(59, 130, 246, 0.08)' },
};

export function TourismChart({ data }: TourismChartProps) {
  // Filter for Tenerife only
  const tenerifeData = data.filter((d) => d.island === 'Tenerife');

  // Group by year and sum tourists
  const yearMap = new Map<number, { total: number; months: number }>();
  for (const d of tenerifeData) {
    const entry = yearMap.get(d.year) || { total: 0, months: 0 };
    entry.total += d.tourists;
    entry.months += 1;
    yearMap.set(d.year, entry);
  }

  // Only include years with all 12 months (complete years)
  const completeYears = Array.from(yearMap.entries())
    .filter(([, v]) => v.months === 12)
    .sort(([a], [b]) => a - b);

  const chartData = completeYears.map(([year, v]) => ({
    year: String(year),
    tourists: v.total,
  }));

  const firstYear = chartData.length > 0 ? chartData[0].year : '—';
  const lastYear = chartData.length > 0 ? chartData[chartData.length - 1].year : '—';

  return (
    <div className="rounded-xl bg-brand-card border border-brand-border p-6">
      <h3 className="text-lg font-semibold mb-1">
        Evolución del turismo en Tenerife
      </h3>
      <p className="text-xs text-slate-400 mb-6">
        Llegadas anuales acumuladas · Fuente: ISTAC ({firstYear} - {lastYear})
      </p>

      <div className="h-[300px] sm:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" />
            <XAxis
              dataKey="year"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              tickFormatter={formatMillions}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#334155' }}
            />
            <Tooltip
              {...DARK_TOOLTIP_STYLE}
              formatter={(value: number) => [
                value.toLocaleString('es-ES') + ' turistas',
                'Llegadas anuales',
              ]}
            />
            <Bar dataKey="tourists" radius={[4, 4, 0, 0]} barSize={28}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={getBarColor(i, chartData.length)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
