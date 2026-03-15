/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'navy': {
          DEFAULT: '#1A1A2E',
          light: '#232342',
          dark: '#12121F',
        },
        'red-accent': '#E94560',
        'deep-blue': '#0F3460',
        'green': '#16C79A',
        'yellow': '#F5A623',
        'gray': '#6C757D',
        'light-bg': '#F0F2F5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
