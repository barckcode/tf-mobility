const REGULATIONS = [
  { island: 'Formentera', region: 'Baleares', regulated: true, measure: 'Límite de vehículos en verano' },
  { island: 'Ibiza', region: 'Baleares', regulated: true, measure: 'Tasa de circulación turística' },
  { island: 'Mallorca', region: 'Baleares', regulated: true, measure: 'Restricción de alquiler diésel' },
  { island: 'Azores', region: 'Portugal', regulated: true, measure: 'Tasa ecológica por vehículo' },
  { island: 'Madeira', region: 'Portugal', regulated: true, measure: 'Control de acceso a zonas protegidas' },
  { island: 'Canarias', region: 'España', regulated: false, measure: 'Sin regulación vigente' },
];

export function RegulationTable() {
  return (
    <div className="rounded-xl bg-brand-card border border-brand-border p-6">
      <h3 className="text-lg font-semibold mb-1">Regulación en islas europeas</h3>
      <p className="text-xs text-slate-400 mb-4">Comparativa de medidas de control vehicular turístico</p>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border text-left text-xs text-slate-500 uppercase tracking-wider">
              <th className="pb-3 pr-4">Isla</th>
              <th className="pb-3 pr-4">Región</th>
              <th className="pb-3 pr-4">Estado</th>
              <th className="pb-3">Medida</th>
            </tr>
          </thead>
          <tbody>
            {REGULATIONS.map((r) => (
              <tr
                key={r.island}
                className={`border-b border-brand-border/50 ${
                  !r.regulated ? 'bg-red-accent/5' : ''
                }`}
              >
                <td className="py-3 pr-4 font-medium">{r.island}</td>
                <td className="py-3 pr-4 text-slate-400">{r.region}</td>
                <td className="py-3 pr-4">
                  {r.regulated ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green/10 px-2.5 py-0.5 text-xs font-medium text-green">
                      Regulado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-accent/10 px-2.5 py-0.5 text-xs font-medium text-red-accent">
                      Sin regular
                    </span>
                  )}
                </td>
                <td className="py-3 text-slate-300">{r.measure}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {REGULATIONS.map((r) => (
          <div
            key={r.island}
            className={`rounded-lg border p-3 ${
              !r.regulated
                ? 'border-red-accent/30 bg-red-accent/5'
                : 'border-brand-border bg-brand-surface'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">{r.island}</span>
              {r.regulated ? (
                <span className="rounded-full bg-green/10 px-2 py-0.5 text-xs font-medium text-green">
                  Regulado
                </span>
              ) : (
                <span className="rounded-full bg-red-accent/10 px-2 py-0.5 text-xs font-medium text-red-accent">
                  Sin regular
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">{r.region}</p>
            <p className="text-xs text-slate-300 mt-1">{r.measure}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
