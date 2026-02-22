import React, { useContext } from 'react';
import NextLink from 'next/link';
import Logo from 'src/components/Logo';
import { ThemeContext } from 'src/context/AppContext';
import { cn } from 'src/utils/cn';

const NAV_LINKS = [
  { href: '/', label: 'Tokens' },
  { href: '/nfts', label: 'NFTs' },
  { href: '/swap', label: 'Swap' },
  { href: '/news', label: 'News' },
  { href: '/docs', label: 'API' },
  { href: '/about', label: 'About' }
];

function Footer() {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const year = new Date().getFullYear();

  return (
    <footer
      className="w-full bg-transparent"
      style={{ borderTop: `1.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}` }}
    >
      <div className="w-full px-4 pt-4 pb-16 max-sm:pb-14">
        <div className="flex flex-col items-center gap-3">
          {/* Nav links */}
          <nav aria-label="Footer navigation" className="flex items-center flex-wrap justify-center gap-1">
            {NAV_LINKS.map((link) => (
              <NextLink
                key={link.label}
                href={link.href}
                className={cn(
                  'no-underline text-[13px] px-2 py-1 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] focus-visible:ring-offset-1',
                  isDark
                    ? 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                    : 'text-black/50 hover:text-black/80 hover:bg-black/[0.04]'
                )}
              >
                {link.label}
              </NextLink>
            ))}
          </nav>

          {/* Logo + copyright */}
          <div className="flex items-center gap-2">
            <NextLink href="/" aria-label="XRPL.to home" className="inline-flex no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] focus-visible:ring-offset-1 rounded-lg">
              <Logo asLink={false} style={{ width: '48px', height: 'auto' }} />
            </NextLink>
            <span className={cn('text-[11px]', isDark ? 'text-white/30' : 'text-black/30')}>
              &copy; {year}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
