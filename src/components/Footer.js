import React, { useContext } from 'react';
import NextLink from 'next/link';
import { Twitter, Send, MessageCircle } from 'lucide-react';
import Logo from 'src/components/Logo';
import { ThemeContext } from 'src/context/AppContext';
import { alpha } from 'src/utils/color';
import { cn } from 'src/utils/cn';

// Custom functional components replacing styled components
const Box = ({ className, children, ...p }) => <div className={className} {...p}>{children}</div>;

const Container = ({ className, children, px = '16px', py = '14px', pb, ...p }) => (
  <div
    className={cn('w-full', className)}
    style={{ padding: `${px} ${py}`, paddingBottom: pb || py }}
    {...p}
  >
    {children}
  </div>
);

const Typography = ({ className, children, variant, color, isDark, opacity, ...p }) => (
  <div
    className={cn(className)}
    style={{
      fontSize: variant === 'body2' ? '0.875rem' : '1rem',
      color:
        color === 'text.secondary'
          ? isDark
            ? 'rgba(255,255,255,0.7)'
            : 'rgba(0,0,0,0.7)'
          : 'inherit',
      opacity: opacity || 1,
      ...p.style
    }}
    {...(({ style, ...rest }) => rest)(p)}
  >
    {children}
  </div>
);

const Tooltip = ({ title, children, arrow }) => {
  const [show, setShow] = React.useState(false);
  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 py-1 px-2 bg-[rgba(0,0,0,0.9)] text-white rounded-lg text-xs whitespace-nowrap z-[1000] mb-1">
          {title}
        </div>
      )}
    </div>
  );
};

const Root = ({ className, children, isDark, ...p }) => (
  <footer
    className={cn('w-full bg-transparent', className)}
    style={{
      borderTop: `1.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`
    }}
    {...p}
  >
    {children}
  </footer>
);

const Link = ({ className, children, isDark, ...p }) => (
  <a
    className={cn(
      'no-underline text-[0.95rem] font-normal p-[4px_8px] rounded-lg hover:text-[#4285f4] hover:bg-[rgba(66,133,244,0.04)]',
      isDark ? 'text-white/70' : 'text-black/70',
      className
    )}
    {...p}
  >
    {children}
  </a>
);

const IconButton = ({ className, children, $isDark, ...p }) => (
  <a
    className={cn(
      'inline-flex items-center justify-center p-[6px] rounded-lg no-underline hover:text-[#4285f4] hover:bg-[rgba(66,133,244,0.08)]',
      $isDark ? 'text-white/70' : 'text-black/70',
      className
    )}
    {...p}
  >
    {children}
  </a>
);

const FooterLink = ({ href, children, isDark }) => {
  const external = /^https?:\/\//.test(href || '');
  if (external) {
    return (
      <Link href={href} target="_blank" rel="noreferrer noopener" isDark={isDark}>
        {children}
      </Link>
    );
  }
  return (
    <NextLink
      href={href}
      className={cn(
        'footer-link no-underline text-[0.95rem] font-normal p-[4px_8px] rounded-lg',
        isDark ? 'dark text-white/70' : 'light text-black/70'
      )}
    >
      {children}
    </NextLink>
  );
};

// Predefine immutable link groups to avoid re-creation on each render
const PRODUCTS = [
  { href: '/', label: 'Tokens' },
  { href: '/nfts', label: 'NFTs' },
  { href: '/swap', label: 'Swap' },
  { href: '/news', label: 'News' },
  { href: '/docs', label: 'API' },
  { href: '/about', label: 'About' }
];
const RedditIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
  </svg>
);

const DiscordIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const SOCIALS = [
  { href: 'https://twitter.com/xrplto', label: 'Twitter', Icon: Twitter },
  { href: 'https://t.me/xrplto/', label: 'Telegram', Icon: Send },
  { href: 'https://www.reddit.com/r/xrplto/', label: 'Reddit', Icon: RedditIcon },
  { href: 'https://xrpl.to/discord/', label: 'Discord', Icon: DiscordIcon }
];

const Group = React.memo(({ items, isDark }) => (
  <Box className="flex items-center flex-wrap gap-[2px_4px] justify-center">
    {items.map((it) => (
      <FooterLink key={it.label} href={it.href} isDark={isDark}>
        {it.label}
      </FooterLink>
    ))}
  </Box>
));

const SocialIcons = React.memo(({ isDark }) => (
  <Box className="flex items-center gap-1">
    {SOCIALS.map((social) => (
      <Tooltip key={social.label} title={social.label} arrow>
        <IconButton href={social.href} target="_blank" rel="noreferrer noopener" $isDark={isDark} aria-label={social.label}>
          <social.Icon size={18} />
        </IconButton>
      </Tooltip>
    ))}
  </Box>
));

function Footer() {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const year = new Date().getFullYear();

  return (
    <Root isDark={isDark}>
      <Container px="16px" py="10px" pb="12px">
        <Box className="flex flex-col gap-3">
          {/* Mobile: stacked, Desktop: row */}
          <Box className="flex flex-row items-center justify-between flex-wrap gap-3">
            <Box className="flex items-center gap-2">
              <NextLink href="/" className="inline-flex no-underline">
                <Logo asLink={false} style={{ width: '60px', height: 'auto' }} />
              </NextLink>
              <Typography
                variant="body2"
                color="text.secondary"
                isDark={isDark}
                opacity={0.7}
                style={{ fontSize: '0.85rem' }}
              >
                &copy; {year}
              </Typography>
            </Box>
            <SocialIcons isDark={isDark} />
          </Box>
          <Group items={PRODUCTS} isDark={isDark} />
        </Box>
      </Container>
    </Root>
  );
}

export default Footer;
