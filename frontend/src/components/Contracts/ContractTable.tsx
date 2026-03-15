import { useState } from 'react';
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
    adjudicado: 'bg-green/20 text-green border-green/30',
    en_ejecucion: 'bg-yellow/20 text-yellow border-yellow/30',
    finalizado: 'bg-brand-blue/20 text-brand-blue border-brand-blue/30',
    licitacion: 'bg-brand-card text-slate-300 border-brand-border',
    anulado: 'bg-red-accent/20 text-red-accent border-red-accent/30',
  };
  const colorClass = colors[status] || 'bg-brand-card text-slate-300 border-brand-border';
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

/* === Mobile: Contract Card === */
function ContractCard({ contract }: { contract: Contract }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="rounded-xl bg-brand-card border border-brand-border p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left focus:outline-none"
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="text-sm font-medium text-white line-clamp-2 flex-1">{contract.objeto}</p>
          {statusBadge(contract.estado)}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
          <span className="font-mono">{contract.expediente}</span>
          <span>{contract.fecha}</span>
          <span className="text-white font-mono font-medium">{formatCurrency(contract.importe_adjudicacion)}</span>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-brand-border space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Tipo</span>
            <span className="text-slate-300">{contract.tipo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Licitación</span>
            <span className="text-white font-mono">{formatCurrency(contract.importe_licitacion)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Adjudicación</span>
            <span className="text-white font-mono">{formatCurrency(contract.importe_adjudicacion)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Adjudicatario</span>
            <span className="text-slate-300 text-right max-w-[60%]">{contract.adjudicatario}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Carreteras</span>
            <span className="text-slate-300">{contract.carreteras.join(', ')}</span>
          </div>
          {contract.source_url && (
            <a
              href={contract.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1 text-brand-blue hover:underline"
            >
              Ver fuente &rarr;
            </a>
          )}
        </div>
      )}
    </article>
  );
}

/* === Desktop: Table view === */
function DesktopTable({ contracts }: ContractTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-brand-border">
      <table className="w-full text-left text-sm" role="table">
        <thead>
          <tr className="border-b border-brand-border bg-brand-surface">
            <th scope="col" className="px-3 py-3 font-medium text-slate-400 text-xs whitespace-nowrap">Exp.</th>
            <th scope="col" className="px-3 py-3 font-medium text-slate-400 text-xs min-w-[200px]">Objeto</th>
            <th scope="col" className="px-3 py-3 font-medium text-slate-400 text-xs whitespace-nowrap">Tipo</th>
            <th scope="col" className="px-3 py-3 font-medium text-slate-400 text-xs text-right whitespace-nowrap">Licitación</th>
            <th scope="col" className="px-3 py-3 font-medium text-slate-400 text-xs text-right whitespace-nowrap">Adjudicación</th>
            <th scope="col" className="px-3 py-3 font-medium text-slate-400 text-xs min-w-[150px]">Adjudicatario</th>
            <th scope="col" className="px-3 py-3 font-medium text-slate-400 text-xs whitespace-nowrap">Fecha</th>
            <th scope="col" className="px-3 py-3 font-medium text-slate-400 text-xs whitespace-nowrap">Estado</th>
            <th scope="col" className="px-3 py-3 font-medium text-slate-400 text-xs whitespace-nowrap">Vía</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border/50">
          {contracts.map((c) => (
            <tr key={c.id} className="transition-colors hover:bg-brand-card/50">
              <td className="px-3 py-3 font-mono text-xs whitespace-nowrap text-slate-300">
                {c.source_url ? (
                  <a href={c.source_url} target="_blank" rel="noopener noreferrer"
                     className="text-brand-blue hover:underline">{c.expediente}</a>
                ) : c.expediente}
              </td>
              <td className="px-3 py-3 text-xs max-w-xs truncate text-slate-200" title={c.objeto}>{c.objeto}</td>
              <td className="px-3 py-3 text-xs whitespace-nowrap text-slate-400">{c.tipo}</td>
              <td className="px-3 py-3 text-xs text-right font-mono whitespace-nowrap text-slate-300">
                {formatCurrency(c.importe_licitacion)}
              </td>
              <td className="px-3 py-3 text-xs text-right font-mono whitespace-nowrap text-white">
                {formatCurrency(c.importe_adjudicacion)}
              </td>
              <td className="px-3 py-3 text-xs max-w-[180px] truncate text-slate-300" title={c.adjudicatario}>
                {c.adjudicatario}
              </td>
              <td className="px-3 py-3 text-xs whitespace-nowrap text-slate-400">{c.fecha}</td>
              <td className="px-3 py-3 whitespace-nowrap">{statusBadge(c.estado)}</td>
              <td className="px-3 py-3 text-xs whitespace-nowrap font-mono text-slate-400">
                {c.carreteras.join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* === Main export: responsive table/cards === */
export function ContractTable({ contracts }: ContractTableProps) {
  if (contracts.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 text-sm rounded-xl border border-brand-border bg-brand-card/50">
        No se encontraron contratos con los filtros seleccionados.
      </div>
    );
  }

  return (
    <>
      {/* Desktop: scroll table */}
      <div className="hidden lg:block">
        <DesktopTable contracts={contracts} />
      </div>

      {/* Mobile/Tablet: card list */}
      <div className="lg:hidden space-y-3">
        {contracts.map((c) => (
          <ContractCard key={c.id} contract={c} />
        ))}
      </div>
    </>
  );
}
