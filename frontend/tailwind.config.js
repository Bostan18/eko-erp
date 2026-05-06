/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50:  '#f0f7f3',
          100: '#dceee4',
          200: '#bbdccb',
          300: '#8dc3a9',
          400: '#5aa382',
          500: '#388562',
          600: '#276a4d',
          700: '#1a5c38',
          800: '#164a2e',
          900: '#123d26',
          950: '#0a2416',
        },
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
