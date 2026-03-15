import { useState, useCallback, useMemo } from 'react';
import { getContracts, getRankings } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import { ContractFiltersBar } from './ContractFilters';
import { ContractTable } from './ContractTable';
import { RankingChart } from './RankingChart';
import { Pagination } from './Pagination';
import { TableSkeleton, CardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import type { ContractFilters } from '@/types';

export function Contracts() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ContractFilters>({});

  const fetchContracts = useCallback(
    () => getContracts(page, 20, filters),
    [page, filters]
  );

  const {
    data: contractsData,
    loading: contractsLoading,
    error: contractsError,
    refetch: refetchContracts,
  } = useFetch(fetchContracts, [page, filters]);

  const {
    data: rankingsData,
    loading: rankingsLoading,
    error: rankingsError,
    refetch: refetchRankings,
  } = useFetch(getRankings);

  // Extract unique values for filter dropdowns from current data
  const filterOptions = useMemo(() => {
    const items = contractsData?.items || [];
    return {
      roads: [...new Set<string>(items.flatMap((c) => c.carreteras))].sort(),
      companies: [...new Set<string>(items.map((c) => c.adjudicatario))].sort(),
      types: [...new Set<string>(items.map((c) => c.tipo))].sort(),
      statuses: [...new Set<string>(items.map((c) => c.estado))].sort(),
    };
  }, [contractsData]);

  const handleFilterChange = (newFilters: ContractFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  };

  return (
    <section
      id="contracts"
      className="relative py-20"
      aria-label="El Dinero Público - Contratos de infraestructura"
    >
      {/* Section background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-light to-navy pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-deep-blue/30 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section header */}
        <div className="mb-12">
          <p className="text-deep-blue font-mono text-sm tracking-widest uppercase mb-3">
            Transparencia presupuestaria
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            El Dinero <span className="text-deep-blue">Público</span>
          </h2>
          <p className="text-gray max-w-2xl">
            Todos los contratos de infraestructuras viarias de Tenerife. Filtra, busca
            y descubre a dónde va el dinero de todos.
          </p>
        </div>

        {/* Rankings chart */}
        <div className="mb-12">
          {rankingsError ? (
            <ErrorState message={rankingsError} onRetry={refetchRankings} />
          ) : rankingsLoading ? (
            <CardSkeleton />
          ) : rankingsData ? (
            <RankingChart rankings={rankingsData.top_companies} />
          ) : null}
        </div>

        {/* Contracts table */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Contratos</h3>

          <ContractFiltersBar
            filters={filters}
            onChange={handleFilterChange}
            roads={filterOptions.roads}
            companies={filterOptions.companies}
            types={filterOptions.types}
            statuses={filterOptions.statuses}
          />

          {contractsError ? (
            <ErrorState message={contractsError} onRetry={refetchContracts} />
          ) : contractsLoading ? (
            <TableSkeleton rows={10} />
          ) : contractsData ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray">
                  {contractsData.total.toLocaleString('es-ES')} contratos encontrados
                </p>
                <p className="text-xs text-gray/60">
                  Página {contractsData.page} de {contractsData.pages}
                </p>
              </div>
              <ContractTable contracts={contractsData.items} />
              <Pagination
                page={contractsData.page}
                totalPages={contractsData.pages}
                onPageChange={setPage}
              />
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
