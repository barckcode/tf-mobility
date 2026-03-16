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

const MONTH_LABELS: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
};

function formatMonth(month: string): string {
  const parts = month.split('-');
  const mm = parts[1] || '';
  return MONTH_LABELS[mm] || month;
}

function formatThousands(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

export function TourismChart({ data }: TourismChartProps) {
  const chartData = data.map((d) => ({
    month: formatMonth(d.month),
    tourists: d.tourists,
    raw: d.month,
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
