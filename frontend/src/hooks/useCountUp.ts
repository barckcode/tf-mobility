import { useState, useEffect, useRef } from 'react';

interface UseCountUpOptions {
  end: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  startOnMount?: boolean;
}

export function useCountUp({
  end,
  duration = 2000,
  decimals = 0,
  suffix = '',
  startOnMount = false,
}: UseCountUpOptions) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(startOnMount);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!started || end === 0) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);

      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * end);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setValue(end);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [started, end, duration]);

  const start = () => {
    startTimeRef.current = 0;
    setValue(0);
    setStarted(true);
  };

  const formattedValue = decimals > 0
    ? value.toFixed(decimals)
    : Math.round(value).toLocaleString('es-ES');

  return {
    value,
    formattedValue: formattedValue + suffix,
    start,
    started,
  };
}
