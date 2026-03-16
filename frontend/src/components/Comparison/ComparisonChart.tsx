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
import type { IslandComparison } from '@/types';

interface ComparisonChartProps {
  islands: IslandComparison[];
}

function formatMillions(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

const COLORS = ['#3b82f6', '#8b5cf6', '#16C79A', '#F5A623', '#E94560', '#60a5fa', '#a78bfa'];

export function ComparisonChart({ islands }: ComparisonChartProps) {
  const data = [...islands]
    .sort((a, b) => b.road_investment - a.road_investment)
    .map((island) => ({
      name: island.island,
      investment: island.road_investment,
    }));

  return (
    <div className="rounded-xl bg-brand-card border border-brand-border p-6">
      <h3 className="text-lg font-semibold mb-1">Inversión en carreteras por isla</h3>
      <p className="text-xs text-slate-400 mb-6">Presupuesto en infraestructura viaria (Canarias)</p>

      <div className="h-[300px] sm:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" />
            <XAxis
              type="number"
              tickFormatter={formatMillions}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
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
                new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0,
                }).format(value),
                'Inversión',
              ]}
            />
            <Bar dataKey="investment" radius={[0, 6, 6, 0]} barSize={24}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
