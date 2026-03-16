import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TourismMonthly } from '@/types';

interface TourismChartProps {
  data: TourismMonthly[];
}

const MONTH_LABELS: Record<number, string> = {
  1: 'Ene', 2: 'Feb', 3: 'Mar', 4: 'Abr',
  5: 'May', 6: 'Jun', 7: 'Jul', 8: 'Ago',
  9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dic',
};

function formatThousands(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

export function TourismChart({ data }: TourismChartProps) {
  // Filter for Tenerife only and get the latest full year
  const tenerifeData = data.filter((d) => d.island === 'Tenerife');
  const years = [...new Set(tenerifeData.map((d) => d.year))].sort();
  const latestYear = years[years.length - 1] || new Date().getFullYear();
  const yearData = tenerifeData
    .filter((d) => d.year === latestYear)
    .sort((a, b) => a.month - b.month);

  const chartData = yearData.map((d) => ({
    month: MONTH_LABELS[d.month] || `M${d.month}`,
    tourists: d.tourists,
  }));

  return (
    <div className="rounded-xl bg-brand-card border border-brand-border p-6">
      <h3 className="text-lg font-semibold mb-1">Turistas mensuales</h3>
      <p className="text-xs text-slate-400 mb-6">Llegadas a Tenerife por mes</p>

      <div className="h-[300px] sm:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" />
            <XAxis
              dataKey="month"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              tickFormatter={formatThousands}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#334155' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '13px',
              }}
              formatter={(value: number) => [
                value.toLocaleString('es-ES') + ' turistas',
                'Llegadas',
              ]}
            />
            <Bar dataKey="tourists" fill="#F5A623" radius={[4, 4, 0, 0]} barSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
