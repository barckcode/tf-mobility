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
      <div className="mb-4 text-5xl">!</div>
      <p className="mb-2 text-lg text-red-accent font-semibold">
        Error al cargar datos
      </p>
      <p className="mb-6 text-sm text-gray">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg bg-red-accent px-6 py-2 text-sm font-medium text-white
                     transition-colors hover:bg-red-accent/80 focus:outline-none focus:ring-2
                     focus:ring-red-accent/50"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
