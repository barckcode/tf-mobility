import { useState } from 'react';
import type { Project } from '@/types';
import { StatusBadge } from './StatusBadge';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className="rounded-xl bg-brand-card border border-brand-border overflow-hidden
                 transition-all duration-300 hover:border-brand-border/80"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 focus:outline-none focus:ring-2
                   focus:ring-inset focus:ring-brand-blue/50"
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-base mb-1 truncate text-white">{project.name}</h4>
            <p className="text-sm text-slate-400 line-clamp-2">{project.description}</p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-3">
            <StatusBadge status={project.status} />
            <svg
              className={`h-5 w-5 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
          <span>Anunciado: {project.announced_date}</span>
          <span>Prometido: {project.promised_date}</span>
          <span>Responsable: {project.responsible_entity}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-brand-border p-5 bg-brand-surface/50">
          {project.sources.length > 0 && (
            <div className="mb-4">
              <h5 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Fuentes
              </h5>
              <ul className="space-y-1">
                {project.sources.map((src, i) => (
                  <li key={i}>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-brand-blue hover:underline"
                    >
                      {src.label} &rarr;
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {project.related_contracts.length > 0 && (
            <div className="mb-4">
              <h5 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Contratos relacionados
              </h5>
              <div className="flex flex-wrap gap-2">
                {project.related_contracts.map((c) => (
                  <span
                    key={c}
                    className="rounded-lg bg-brand-surface border border-brand-border px-2.5 py-1
                               text-xs font-mono text-slate-300"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-500 mt-3">
            Última actualización: {project.last_update}
          </p>
        </div>
      )}
    </article>
  );
}
