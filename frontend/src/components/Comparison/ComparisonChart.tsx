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

const DEFAULT_COLOR = '#3b82f6';
const TENERIFE_COLOR = '#E94560';

export function ComparisonChart({ islands }: ComparisonChartProps) {
  const data = [...islands]
    .sort((a, b) => (b.road_investment_m_eur || 0) - (a.road_investment_m_eur || 0))
    .map((island) => ({
      name: island.island,
      investment: island.road_investment_m_eur || 0,
      isTenerife: island.island === 'Tenerife',
    }));

  return (
    <div className="rounded-xl bg-brand-card border border-brand-border p-6">
      <h3 className="text-lg font-semibold mb-1">Inversión en carreteras por isla</h3>
      <p className="text-xs text-slate-400 mb-6">
        Presupuesto en infraestructura viaria · Fuente: INE, ISTAC, DGT · Datos 2023
      </p>

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
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '13px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
              itemStyle={{ color: '#e2e8f0' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
              formatter={(value: number) => [
                `${value.toLocaleString('es-ES', { maximumFractionDigits: 1 })} M€`,
                'Inversión',
              ]}
            />
            <Bar dataKey="investment" radius={[0, 6, 6, 0]} barSize={24}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.isTenerife ? TENERIFE_COLOR : DEFAULT_COLOR} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
