interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded bg-white/10 ${className}`}
      role="status"
      aria-label="Cargando..."
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl bg-white/5 p-6 space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
