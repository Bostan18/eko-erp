/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Vert EKO — re-tonné depuis la maquette (HTML EKO ERP)
        forest: {
          50:  '#f1f6f1',
          100: '#dceee2',
          200: '#b6dac4',
          300: '#86c09e',
          400: '#52a075',
          500: '#2e8253',  // accent vif (boutons, focus)
          600: '#236940',
          700: '#1c5435',  // primaire CTA
          800: '#163f28',  // hover sidebar
          900: '#0e2a1b',  // sidebar dim
          950: '#081a10',  // sidebar bg
        },
        // Fond papier / surfaces / texte secondaire
        sand: {
          50:  '#fbfaf6',
          100: '#f6f4ee',   // bg principal
          200: '#ebe7dc',   // bordures cartes
          300: '#dcd6c5',   // séparateurs
          400: '#bdb39c',
          500: '#928874',   // texte muted
          600: '#6f6757',
          700: '#54493d',
          800: '#36302a',
        },
        // Or / warnings & FNE pending
        gold: {
          50:  '#fbf6e8',
          100: '#f5ebca',
          200: '#ead17a',
          300: '#d9b446',
          400: '#bf9a2c',
          500: '#9b7c1f',
          600: '#765e16',
          700: '#544411',
        },
        ink: '#1a1c14',
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.03)',
        drawer: '-8px 0 40px rgb(0 0 0 / 0.12)',
      },
      borderRadius: {
        xl: '12px',
      },
    },
  },
  plugins: [],
}
