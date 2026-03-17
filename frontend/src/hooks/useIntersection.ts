import { useState, useEffect, useCallback } from 'react';

export function useIntersection(threshold = 0.2): [(node: HTMLDivElement | null) => void, boolean] {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [node, threshold]);

  const ref = useCallback((el: HTMLDivElement | null) => {
    setNode(el);
  }, []);

  return [ref, isVisible];
}
