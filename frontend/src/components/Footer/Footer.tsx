export function Footer() {
  return (
    <footer className="relative border-t border-brand-border py-12" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
        <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Los datos presentados provienen de fuentes públicas oficiales.
          Este proyecto es una iniciativa ciudadana independiente sin afiliación política.
        </p>
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-500">
          <span>TF Mobility &copy; {new Date().getFullYear()}</span>
          <span aria-hidden="true">&middot;</span>
          <a
            href="https://github.com/barckcode/tf-mobility"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <svg
              viewBox="0 0 16 16"
              className="h-4 w-4 fill-current"
              aria-hidden="true"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
            <span>GitHub</span>
          </a>
          <span aria-hidden="true">&middot;</span>
          <span>Datos abiertos de Tenerife</span>
        </div>
      </div>
    </footer>
  );
}
