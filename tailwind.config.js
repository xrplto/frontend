/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4285f4',
          50: '#e8f1fe',
          100: '#d1e3fd',
          200: '#a3c7fb',
          300: '#75abf9',
          400: '#4285f4',
          500: '#1a73e8',
          600: '#1557b0',
          700: '#103c78',
          800: '#0a2040',
          900: '#050f20',
        },
      },
    },
  },
  plugins: [],
}
