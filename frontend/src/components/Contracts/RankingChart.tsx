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
import type { CompanyRanking } from '@/types';

interface RankingChartProps {
  rankings: CompanyRanking[];
}

function formatMillions(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

const COLORS = [
  '#3b82f6', '#8b5cf6', '#16C79A', '#F5A623', '#E94560',
  '#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#f87171',
];

export function RankingChart({ rankings }: RankingChartProps) {
  const data = rankings.map((r) => ({
    name: r.company.length > 25 ? r.company.slice(0, 25) + '...' : r.company,
    fullName: r.company,
    amount: r.total_amount,
    contracts: r.contract_count,
  }));

  return (
    <div className="rounded-xl bg-brand-card border border-brand-border p-6">
      <h3 className="text-lg font-semibold mb-1">Top 10 Adjudicatarios</h3>
      <p className="text-xs text-slate-400 mb-6">Por importe total adjudicado</p>

      <div className="h-[400px]">
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
              width={180}
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
                }).format(value),
                'Importe total',
              ]}
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.fullName ?? ''
              }
            />
            <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={24}>
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
