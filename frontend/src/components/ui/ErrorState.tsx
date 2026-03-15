interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      role="alert"
    >
      <div className="mb-4 text-5xl text-red-accent">!</div>
      <p className="mb-2 text-lg text-red-accent font-semibold">
        Error al cargar datos
      </p>
      <p className="mb-6 text-sm text-slate-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg bg-brand-blue px-6 py-2 text-sm font-medium text-white
                     transition-all hover:bg-brand-blue-hover glow-blue
                     focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
