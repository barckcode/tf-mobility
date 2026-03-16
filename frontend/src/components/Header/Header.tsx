import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { id: 'hero', label: 'El Impacto' },
  { id: 'tourism', label: 'Turismo' },
  { id: 'contracts', label: 'El Dinero Público' },
  { id: 'promises', label: 'Promesas vs Realidad' },
  { id: 'alternatives', label: 'Alternativas' },
  { id: 'comparison', label: 'Comparativa' },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-brand-bg/95 backdrop-blur-md shadow-lg shadow-black/30 border-b border-brand-border/50'
          : 'bg-transparent'
      }`}
      role="banner"
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6"
        aria-label="Navegación principal"
      >
        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 text-xl font-bold tracking-tight focus:outline-none
                     focus:ring-2 focus:ring-brand-blue/50 rounded-lg px-2 py-1"
          aria-label="Ir al inicio"
        >
          <span className="text-white">TF</span>
          <span className="gradient-text">Mobility</span>
        </button>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => scrollTo(item.id)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors
                           hover:text-white hover:bg-brand-card/60 focus:outline-none focus:ring-2
                           focus:ring-brand-blue/50"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg focus:outline-none
                     focus:ring-2 focus:ring-brand-blue/50"
          aria-expanded={menuOpen}
          aria-label="Menú de navegación"
        >
          <span
            className={`block h-0.5 w-6 bg-white transition-transform ${
              menuOpen ? 'translate-y-2 rotate-45' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-white transition-opacity ${
              menuOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-white transition-transform ${
              menuOpen ? '-translate-y-2 -rotate-45' : ''
            }`}
          />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-brand-bg/95 backdrop-blur-md border-t border-brand-border">
          <ul className="flex flex-col px-4 py-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => scrollTo(item.id)}
                  className="w-full text-left rounded-lg px-4 py-3 text-sm font-medium
                             text-slate-400 transition-colors hover:text-white hover:bg-brand-card/60"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
