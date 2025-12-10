import { Inter, JetBrains_Mono } from 'next/font/google';

// Main UI font - Inter (only 400/500 per design guidelines)
export const inter = Inter({
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

// Monospace for data/numbers - JetBrains Mono (tabular figures)
export const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono'
});
