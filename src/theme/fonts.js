import { JetBrains_Mono } from 'next/font/google';

export const jetbrainsMono = JetBrains_Mono({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Courier New', 'monospace'],
  variable: '--font-jetbrains-mono'
});
