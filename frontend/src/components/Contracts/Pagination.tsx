interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-6" aria-label="Paginación">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg px-3 py-2 text-sm text-gray transition-colors
                   hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed
                   focus:outline-none focus:ring-2 focus:ring-deep-blue/50"
        aria-label="Página anterior"
      >
        &larr;
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-2 text-gray">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors
                       focus:outline-none focus:ring-2 focus:ring-deep-blue/50
                       ${p === page
                         ? 'bg-deep-blue text-white'
                         : 'text-gray hover:text-white hover:bg-white/5'
                       }`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-lg px-3 py-2 text-sm text-gray transition-colors
                   hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed
                   focus:outline-none focus:ring-2 focus:ring-deep-blue/50"
        aria-label="Página siguiente"
      >
        &rarr;
      </button>
    </nav>
  );
}
