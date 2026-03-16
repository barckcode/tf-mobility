import { useEffect } from 'react';
import { useCountUp } from '@/hooks/useCountUp';

interface KpiItem {
  icon: string;
  label: string;
  value: number;
  suffix: string;
  decimals?: number;
}

const KPIS: KpiItem[] = [
  { icon: '\u2708', label: 'Turistas/año', value: 7_000_000, suffix: '+' },
  { icon: '\u{1F697}', label: 'Rental cars', value: 100_000, suffix: '~' },
  { icon: '\u{1F4B6}', label: 'Gasto medio/día', value: 190, suffix: '€' },
  { icon: '\u{1F4C5}', label: 'Estancia media', value: 7.6, suffix: ' días', decimals: 1 },
];

function formatCompact(value: number, decimals: number): string {
  if (decimals > 0) return value.toFixed(decimals).replace('.', ',');
  const rounded = Math.round(value);
  if (rounded >= 1_000_000) return (rounded / 1_000_000).toFixed(1).replace('.', ',') + 'M';
  if (rounded >= 10_000) return Math.round(rounded / 1_000).toLocaleString('es-ES') + 'K';
  return rounded.toLocaleString('es-ES');
}

function TourismKpiCard({ icon, label, value, suffix, decimals = 0, visible }: KpiItem & { visible: boolean }) {
  const { value: animValue, start, started } = useCountUp({
    end: value,
    duration: 2200,
    decimals,
  });

  useEffect(() => {
    if (visible && !started) start();
  }, [visible, started, start]);

  const display = visible
    ? (suffix === '~' ? '~' : '') + formatCompact(animValue, decimals) + (suffix !== '~' ? suffix : '')
    : '\u2014';

  return (
    <div className="rounded-xl bg-brand-card border border-brand-border p-4 text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <p className="font-mono text-xl sm:text-2xl font-bold text-yellow truncate">
        {display}
      </p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}

interface TourismKpisProps {
  visible: boolean;
}

export function TourismKpis({ visible }: TourismKpisProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {KPIS.map((kpi) => (
        <TourismKpiCard key={kpi.label} {...kpi} visible={visible} />
      ))}
    </div>
  );
}
