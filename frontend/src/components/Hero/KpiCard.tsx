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

export function KpiCard({
  icon,
  label,
  value,
  suffix = '',
  decimals = 0,
  source,
  visible,
}: KpiCardProps) {
  const { formattedValue, start, started } = useCountUp({
    end: value,
    duration: 2200,
    decimals,
    suffix,
  });

  useEffect(() => {
    if (visible && !started) start();
  }, [visible, started, start]);

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10
                  p-6 backdrop-blur-sm transition-all duration-500 hover:bg-white/10
                  hover:border-red-accent/30 hover:shadow-lg hover:shadow-red-accent/5
                  ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transitionDelay: '200ms' }}
    >
      {/* Glow effect on hover */}
      <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-red-accent/10
                      opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />

      <div className="relative z-10">
        <span className="text-3xl mb-3 block" role="img" aria-hidden="true">
          {icon}
        </span>
        <p
          className="font-mono text-3xl sm:text-4xl lg:text-5xl font-bold text-white
                     tracking-tight leading-none mb-2"
        >
          {visible ? formattedValue : '—'}
        </p>
        <p className="text-sm text-gray font-medium">{label}</p>
        {source && (
          <p className="mt-2 text-xs text-gray/60">{source}</p>
        )}
      </div>
    </article>
  );
}
