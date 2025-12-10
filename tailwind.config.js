/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'Courier New', 'monospace'],
      },
      fontSize: {
        // Standardized scale (use these instead of arbitrary values)
        'xs': ['11px', { lineHeight: '1.4' }],      // labels, captions
        'sm': ['13px', { lineHeight: '1.5' }],      // body small, buttons
        'base': ['14px', { lineHeight: '1.5' }],    // body text
        'lg': ['16px', { lineHeight: '1.4' }],      // subheadings
        'xl': ['20px', { lineHeight: '1.3' }],      // headings
        '2xl': ['24px', { lineHeight: '1.2' }],     // page titles
      },
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
