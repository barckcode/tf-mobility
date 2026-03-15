import type { Contract } from '@/types';

interface ContractTableProps {
  contracts: Contract[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    adjudicado: 'bg-green/20 text-green',
    en_ejecucion: 'bg-yellow/20 text-yellow',
    finalizado: 'bg-deep-blue/20 text-deep-blue',
    licitacion: 'bg-white/10 text-gray',
    anulado: 'bg-red-accent/20 text-red-accent',
  };
  const colorClass = colors[status] || 'bg-white/10 text-gray';
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export function ContractTable({ contracts }: ContractTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-left text-sm" role="table">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            <th scope="col" className="px-4 py-3 font-medium text-gray">Expediente</th>
            <th scope="col" className="px-4 py-3 font-medium text-gray">Objeto</th>
            <th scope="col" className="px-4 py-3 font-medium text-gray">Tipo</th>
            <th scope="col" className="px-4 py-3 font-medium text-gray text-right">Licitación</th>
            <th scope="col" className="px-4 py-3 font-medium text-gray text-right">Adjudicación</th>
            <th scope="col" className="px-4 py-3 font-medium text-gray">Adjudicatario</th>
            <th scope="col" className="px-4 py-3 font-medium text-gray">Fecha</th>
            <th scope="col" className="px-4 py-3 font-medium text-gray">Estado</th>
            <th scope="col" className="px-4 py-3 font-medium text-gray">Carreteras</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {contracts.map((c) => (
            <tr
              key={c.id}
              className="transition-colors hover:bg-white/5"
            >
              <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                {c.source_url ? (
                  <a
                    href={c.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-deep-blue hover:underline"
                  >
                    {c.expediente}
                  </a>
                ) : (
                  c.expediente
                )}
              </td>
              <td className="px-4 py-3 max-w-xs truncate" title={c.objeto}>
                {c.objeto}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-xs">{c.tipo}</td>
              <td className="px-4 py-3 whitespace-nowrap text-right font-mono text-xs">
                {formatCurrency(c.importe_licitacion)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right font-mono text-xs">
                {formatCurrency(c.importe_adjudicacion)}
              </td>
              <td className="px-4 py-3 max-w-[200px] truncate text-xs" title={c.adjudicatario}>
                {c.adjudicatario}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-xs">{c.fecha}</td>
              <td className="px-4 py-3 whitespace-nowrap">{statusBadge(c.estado)}</td>
              <td className="px-4 py-3 whitespace-nowrap text-xs">
                {c.carreteras.join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {contracts.length === 0 && (
        <div className="py-12 text-center text-gray text-sm">
          No se encontraron contratos con los filtros seleccionados.
        </div>
      )}
    </div>
  );
}
