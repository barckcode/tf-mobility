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
          <span>Datos abiertos de Tenerife</span>
        </div>
      </div>
    </footer>
  );
}
