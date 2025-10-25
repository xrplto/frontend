import { Inter, JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';

// Main UI font - Inter (industry standard for fintech 2025)
export const inter = Inter({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

// Monospace for data/numbers - JetBrains Mono (tabular figures)
export const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Courier New', 'monospace'],
  variable: '--font-jetbrains-mono'
});

// Optional: Geist for ultra-modern look (if you have local files)
// export const geist = localFont({
//   src: '../fonts/GeistVF.woff2',
//   variable: '--font-geist',
//   weight: '100 900',
// });
