import React, { useContext } from 'react';
import Image from 'next/image';
import NextLink from 'next/link';
import { Box, Container, Link, Typography, IconButton, Tooltip } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { Twitter, Send, Reddit, Forum } from '@mui/icons-material';
import { AppContext } from 'src/AppContext';

const Root = styled('footer')(({ theme }) => ({
  width: '100%',
  borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
  background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, transparent 60%)`,
  marginTop: theme.spacing(3)
}));

const FooterLink = ({ href, children }) => {
  const external = /^https?:\/\//.test(href || '');
  return (
    <Link
      component={external ? 'a' : NextLink}
      href={href}
      underline="none"
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer noopener' : undefined}
      sx={{
        color: 'text.secondary',
        fontSize: '0.86rem',
        px: 0.5,
        borderRadius: 1,
        transition: 'all .15s ease',
        '&:hover': {
          color: 'primary.main',
          backgroundColor: (t) => alpha(t.palette.primary.main, 0.06)
        }
      }}
    >
      {children}
    </Link>
  );
};

// Predefine immutable link groups to avoid re-creation on each render
const PRODUCTS = [
  { href: '/swap', label: 'Token Swap' },
  { href: '/market-metrics', label: 'Market Metrics' },
  { href: '/top-traders', label: 'Top Traders' },
  { href: '/api-docs', label: 'Token API' }
];
const COMPANY = [
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'FAQ' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/disclaimer', label: 'Disclaimer' }
];
const SOCIALS = [
  { href: 'https://twitter.com/xrplto', label: 'Twitter', Icon: Twitter },
  { href: 'https://t.me/xrplto/', label: 'Telegram', Icon: Send },
  { href: 'https://www.reddit.com/r/xrplto/', label: 'Reddit', Icon: Reddit },
  { href: 'https://xrpl.to/discord/', label: 'Discord', Icon: Forum }
];

// Extract nested component to top level and memoize
const Group = React.memo(({ label, items }) => (
  <Box sx={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
    <Typography
      variant="caption"
      sx={{
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        fontWeight: 700,
        color: (t) => alpha(t.palette.primary.main, 0.8),
        fontSize: '0.75rem'
      }}
    >
      {label}
    </Typography>
    <Typography variant="caption" sx={{ color: (t) => alpha(t.palette.primary.main, 0.4) }}>
      •
    </Typography>
    {items.map((it, idx) => (
      <Box key={it.label} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8 }}>
        <FooterLink href={it.href}>{it.label}</FooterLink>
        {idx < items.length - 1 && (
          <Typography variant="caption" sx={{ color: (t) => alpha(t.palette.primary.main, 0.3) }}>
            /
          </Typography>
        )}
      </Box>
    ))}
  </Box>
));

const SocialIcons = React.memo(() => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
    {SOCIALS.map((social) => {
      const { Icon } = social;
      return (
        <Tooltip key={social.label} title={social.label} arrow>
          <IconButton
            component="a"
            href={social.href}
            target="_blank"
            rel="noreferrer noopener"
            size="small"
            sx={{
              color: 'text.secondary',
              padding: 0.5,
              transition: 'all .15s ease',
              '&:hover': {
                color: 'primary.main',
                backgroundColor: (t) => alpha(t.palette.primary.main, 0.06)
              }
            }}
          >
            <Icon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    })}
  </Box>
));

function Footer() {
  const { darkMode } = useContext(AppContext);
  const year = new Date().getFullYear();
  const logo = darkMode ? '/logo/xrpl-to-logo-white.svg' : '/logo/xrpl-to-logo-black.svg';

  // Link groups are hoisted as constants above to keep references stable

  return (
    <Root>
      <Container
        maxWidth={false}
        sx={{ px: { xs: 2, md: 4, xl: 8 }, py: 1.25, pb: { xs: 7, md: 7 } }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap'
          }}
        >
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
            <Link href="/" underline="none" sx={{ display: 'inline-flex' }}>
              <Image src={logo} alt="XRPL.to" width={110} height={38} priority />
            </Link>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: { xs: 'none', md: 'inline' } }}
            >
              © {year}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2.5,
              flex: 1,
              justifyContent: 'flex-end',
              flexWrap: 'wrap'
            }}
          >
            <Group label="Products" items={PRODUCTS} />
            <Group label="Company" items={COMPANY} />
            <SocialIcons />
          </Box>
        </Box>
      </Container>
    </Root>
  );
}

export default Footer;
