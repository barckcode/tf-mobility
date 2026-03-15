import type { ContractFilters as Filters } from '@/types';

interface ContractFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  roads: string[];
  companies: string[];
  types: string[];
  statuses: string[];
}

const selectClass = `rounded-lg bg-brand-card border border-brand-border px-3 py-2 text-sm
                     text-white focus:border-brand-blue focus:outline-none focus:ring-1
                     focus:ring-brand-blue`;

export function ContractFiltersBar({
  filters,
  onChange,
  roads,
  companies,
  types,
  statuses,
}: ContractFiltersProps) {
  const update = (key: keyof Filters, value: string | number | undefined) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  return (
    <div
      className="flex flex-wrap gap-3 mb-6"
      role="search"
      aria-label="Filtrar contratos"
    >
      <select
        value={filters.road || ''}
        onChange={(e) => update('road', e.target.value)}
        className={selectClass}
        aria-label="Filtrar por carretera"
      >
        <option value="">Todas las carreteras</option>
        {roads.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      <select
        value={filters.company || ''}
        onChange={(e) => update('company', e.target.value)}
        className={selectClass}
        aria-label="Filtrar por adjudicatario"
      >
        <option value="">Todos los adjudicatarios</option>
        {companies.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        value={filters.type || ''}
        onChange={(e) => update('type', e.target.value)}
        className={selectClass}
        aria-label="Filtrar por tipo"
      >
        <option value="">Todos los tipos</option>
        {types.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <select
        value={filters.status || ''}
        onChange={(e) => update('status', e.target.value)}
        className={selectClass}
        aria-label="Filtrar por estado"
      >
        <option value="">Todos los estados</option>
        {statuses.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <select
        value={filters.year || ''}
        onChange={(e) => update('year', e.target.value ? Number(e.target.value) : undefined)}
        className={selectClass}
        aria-label="Filtrar por año"
      >
        <option value="">Todos los años</option>
        {Array.from({ length: 10 }, (_, i) => 2024 - i).map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      {Object.values(filters).some(Boolean) && (
        <button
          onClick={() => onChange({})}
          className="rounded-lg bg-red-accent/10 border border-red-accent/20 px-4 py-2
                     text-sm text-red-accent hover:bg-red-accent/20 transition-colors
                     focus:outline-none focus:ring-2 focus:ring-red-accent/50"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
