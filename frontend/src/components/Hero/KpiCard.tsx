import { useEffect } from 'react';
import { useCountUp } from '@/hooks/useCountUp';

interface KpiCardProps {
  icon: string;
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  source?: string;
  visible: boolean;
}

/**
 * Format large numbers in a compact way:
 * - < 10,000: full number with locale separators (e.g. "2.034")
 * - >= 10,000 and < 1M: "531K"
 * - >= 1M: "1,03M"
 */
function formatCompact(value: number, decimals: number): string {
  if (decimals > 0) {
    return value.toFixed(decimals).replace('.', ',');
  }
  const rounded = Math.round(value);
  if (rounded >= 1_000_000) {
    return (rounded / 1_000_000).toFixed(2).replace('.', ',') + 'M';
  }
  if (rounded >= 10_000) {
    return Math.round(rounded / 1_000).toLocaleString('es-ES') + 'K';
  }
  return rounded.toLocaleString('es-ES');
}

export function KpiCard({
  icon,
  label,
  value,
  suffix = '',
  decimals = 0,
  source,
  visible,
}: KpiCardProps) {
  const { value: animValue, start, started } = useCountUp({
    end: value,
    duration: 2200,
    decimals,
    suffix,
  });

  useEffect(() => {
    if (visible && !started) start();
  }, [visible, started, start]);

  const displayValue = visible ? formatCompact(animValue, decimals) + suffix : '—';

  return (
    <article
      className={`group relative overflow-hidden rounded-xl
                  bg-brand-card border border-brand-border
                  p-5 transition-all duration-500
                  hover:border-brand-blue/40 hover:shadow-lg hover:shadow-brand-blue/5
                  ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transitionDelay: '200ms' }}
    >
      {/* Glow on hover */}
      <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-brand-blue/10
                      opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />

      <div className="relative z-10">
        <span className="text-2xl mb-3 block" role="img" aria-hidden="true">
          {icon}
        </span>
        <p className="font-mono text-2xl sm:text-3xl lg:text-4xl font-bold text-white
                      tracking-tight leading-none mb-2">
          {displayValue}
        </p>
        <p className="text-sm text-slate-400 font-medium">{label}</p>
        {source && (
          <p className="mt-2 text-xs text-slate-500">{source}</p>
        )}
      </div>
    </article>
  );
}
