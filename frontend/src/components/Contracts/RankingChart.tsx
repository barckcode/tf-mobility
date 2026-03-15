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
  '#E94560', '#0F3460', '#16C79A', '#F5A623', '#6C757D',
  '#E94560CC', '#0F3460CC', '#16C79ACC', '#F5A623CC', '#6C757DCC',
];

export function RankingChart({ rankings }: RankingChartProps) {
  const data = rankings.map((r) => ({
    name: r.company.length > 25 ? r.company.slice(0, 25) + '...' : r.company,
    fullName: r.company,
    amount: r.total_amount,
    contracts: r.contract_count,
  }));

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
      <h3 className="text-lg font-semibold mb-1">Top 10 Adjudicatarios</h3>
      <p className="text-xs text-gray mb-6">Por importe total adjudicado</p>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              type="number"
              tickFormatter={formatMillions}
              tick={{ fill: '#6C757D', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={180}
              tick={{ fill: '#6C757D', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1A1A2E',
                border: '1px solid rgba(255,255,255,0.1)',
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
