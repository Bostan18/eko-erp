/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Vert EKO — calibré sur OKLCH maquette (hue 152, chroma terrain)
        forest: {
          50:  '#e6f5ec',  // oklch(96% .025 152)
          100: '#d3eedc',  // oklch(93% .055 152) — green-light
          200: '#a7e3c0',  // oklch(85% .09 152)
          300: '#6cc996',  // oklch(73% .13 152)
          400: '#3ba973',  // oklch(62% .15 152)
          500: '#1f8f53',  // oklch(52% .16 152) — primaire vif (CTA, focus)
          600: '#157a45',  // oklch(46% .17 152) — hover CTA
          700: '#1a6539',  // oklch(40% .14 152) — accent foncé
          800: '#1c4f33',  // oklch(31% .09 152) — sidebar active
          900: '#173e29',  // oklch(26% .075 152) — sidebar hover
          950: '#0f2b1c',  // oklch(20% .065 152) — sidebar bg
        },
        // Fond papier / surfaces / texte secondaire
        sand: {
          50:  '#fafaf6',  // oklch(98.5% .005 85)
          100: '#f3f1eb',  // oklch(96.5% .008 85) — bg principal
          200: '#dedbd2',  // oklch(88.5% .01 85) — bordures
          300: '#c1bdb1',  // oklch(78% .013 85) — séparateurs
          400: '#a09b8d',  // oklch(65% .015 85)
          500: '#7e7a6e',  // oklch(53% .015 80) — texte muted
          600: '#605d54',  // oklch(42% .015 80)
          700: '#48463f',  // oklch(33% .015 80)
          800: '#33312c',  // oklch(24% .015 80)
        },
        // Or / warnings & FNE pending — calibré OKLCH hue 78
        gold: {
          50:  '#faf6e6',  // oklch(98% .015 78)
          100: '#f5ecc8',  // oklch(95% .048 78) — gold-light
          200: '#e5cd8b',  // oklch(86% .085 78)
          300: '#d4b257',  // oklch(76% .115 78)
          400: '#d0a634',  // oklch(71% .13 78)
          500: '#c89a1d',  // oklch(67% .135 78) — primaire
          600: '#a98317',  // oklch(58% .12 78)
          700: '#8a6c11',  // oklch(48% .1 78)
        },
        ink: '#211f17',    // oklch(17% .02 80)
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
        lg: '7px',   // boutons, inputs (maquette : 7px)
        xl: '10px',  // cartes, KPI, drawers (maquette : 10px)
      },
    },
  },
  plugins: [],
}
