/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core palette — aligned with agentcrew.sh
        'brand': {
          bg: '#0a0f1e',
          surface: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          blue: '#3b82f6',
          'blue-hover': '#2563eb',
          violet: '#8b5cf6',
        },
        // Legacy aliases (components still reference these)
        'navy': {
          DEFAULT: '#0a0f1e',
          light: '#0f172a',
          dark: '#060a14',
        },
        'red-accent': '#E94560',
        'deep-blue': '#3b82f6',
        'green': '#16C79A',
        'yellow': '#F5A623',
        'gray': '#94a3b8',
        'light-bg': '#F0F2F5',
        // Slate text scale
        'slate': {
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#0a0f1e',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
