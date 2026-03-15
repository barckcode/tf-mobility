import { useState } from 'react';
import { getProjects } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import { ProjectCard } from './ProjectCard';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { getStatusGroup } from './StatusBadge';
import type { Project } from '@/types';

type SortMode = 'status' | 'date';

function sortProjects(projects: Project[], mode: SortMode): Project[] {
  const statusOrder: Record<string, number> = {
    paralizado: 0,
    sin_iniciar: 1,
    retrasado: 2,
    en_plazo: 3,
    completado: 4,
  };

  return [...projects].sort((a, b) => {
    if (mode === 'status') {
      return (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
    }
    return new Date(b.announced_date).getTime() - new Date(a.announced_date).getTime();
  });
}

export function Promises() {
  const { data, loading, error, refetch } = useFetch(getProjects);
  const [sortMode, setSortMode] = useState<SortMode>('status');

  const sorted = data ? sortProjects(data.projects, sortMode) : [];

  return (
    <section
      id="promises"
      className="relative py-20"
      aria-label="Promesas vs Realidad - Seguimiento de proyectos"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-navy to-navy-light pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section header */}
        <div className="mb-12">
          <p className="text-red-accent font-mono text-sm tracking-widest uppercase mb-3">
            Seguimiento ciudadano
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Promesas vs <span className="text-red-accent">Realidad</span>
          </h2>
          <p className="text-gray max-w-2xl">
            Seguimiento del estado real de los proyectos de infraestructuras viarias
            prometidos por las administraciones.
          </p>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : data ? (
          <>
            {/* Summary counters */}
            <div className="grid grid-cols-3 gap-4 mb-8 max-w-lg">
              <div className="rounded-xl bg-green/10 border border-green/20 p-4 text-center">
                <p className="font-mono text-2xl font-bold text-green">
                  {data.summary.on_track}
                </p>
                <p className="text-xs text-green/70 mt-1">En plazo</p>
              </div>
              <div className="rounded-xl bg-yellow/10 border border-yellow/20 p-4 text-center">
                <p className="font-mono text-2xl font-bold text-yellow">
                  {data.summary.delayed}
                </p>
                <p className="text-xs text-yellow/70 mt-1">Retrasados</p>
              </div>
              <div className="rounded-xl bg-red-accent/10 border border-red-accent/20 p-4 text-center">
                <p className="font-mono text-2xl font-bold text-red-accent">
                  {data.summary.stalled}
                </p>
                <p className="text-xs text-red-accent/70 mt-1">Paralizados</p>
              </div>
            </div>

            {/* Sort controls */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs text-gray">Ordenar por:</span>
              <button
                onClick={() => setSortMode('status')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
                           ${sortMode === 'status'
                             ? 'bg-red-accent/20 text-red-accent border border-red-accent/30'
                             : 'bg-white/5 text-gray border border-white/10 hover:text-white'}`}
              >
                Estado (peor primero)
              </button>
              <button
                onClick={() => setSortMode('date')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
                           ${sortMode === 'date'
                             ? 'bg-red-accent/20 text-red-accent border border-red-accent/30'
                             : 'bg-white/5 text-gray border border-white/10 hover:text-white'}`}
              >
                Fecha (más reciente)
              </button>
            </div>

            {/* Project cards */}
            <div className="space-y-3">
              {sorted.map((project) => (
                <div
                  key={project.id}
                  className={`rounded-l-none border-l-4 ${
                    getStatusGroup(project.status) === 'green'
                      ? 'border-l-green'
                      : getStatusGroup(project.status) === 'yellow'
                        ? 'border-l-yellow'
                        : 'border-l-red-accent'
                  }`}
                >
                  <ProjectCard project={project} />
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
