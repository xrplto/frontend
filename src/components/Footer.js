import React from 'react';
import NextLink from 'next/link';
import { Box, Container, Link, Typography, IconButton, Tooltip } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { Twitter, Send, Reddit, Forum } from '@mui/icons-material';
import Logo from 'src/components/Logo';

const Root = styled('footer')(({ theme }) => ({
  width: '100%',
  borderTop: `1.5px solid ${alpha(theme.palette.divider, 0.15)}`,
  backgroundColor: 'transparent',
  marginTop: theme.spacing(4)
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
        fontSize: { xs: '0.85rem', md: '0.9rem' },
        px: { xs: 0.5, md: 0.8 },
        py: 0.3,
        borderRadius: '8px',
        '&:hover': {
          color: '#4285f4',
          backgroundColor: alpha('#4285f4', 0.04)
        }
      }}
    >
      {children}
    </Link>
  );
};

// Predefine immutable link groups to avoid re-creation on each render
const PRODUCTS = [
  { href: '/swap', label: 'Swap' },
  { href: '/market-metrics', label: 'Metrics' },
  { href: '/top-traders', label: 'Traders' },
  { href: '/api-docs', label: 'API' },
  { href: '/about', label: 'About' }
];
const SOCIALS = [
  { href: 'https://twitter.com/xrplto', label: 'Twitter', Icon: Twitter },
  { href: 'https://t.me/xrplto/', label: 'Telegram', Icon: Send },
  { href: 'https://www.reddit.com/r/xrplto/', label: 'Reddit', Icon: Reddit },
  { href: 'https://xrpl.to/discord/', label: 'Discord', Icon: Forum }
];

// Extract nested component to top level and memoize
const Group = React.memo(({ items }) => (
  <Box sx={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: { xs: 0.8, md: 1.2 } }}>
    {items.map((it) => (
      <FooterLink key={it.label} href={it.href}>{it.label}</FooterLink>
    ))}
  </Box>
));

const SocialIcons = React.memo(() => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.3, md: 0.5 } }}>
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
              padding: { xs: 0.6, md: 0.8 },
              '&:hover': {
                color: '#4285f4',
                backgroundColor: alpha('#4285f4', 0.04)
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
  const year = new Date().getFullYear();

  return (
    <Root>
      <Container
        maxWidth={false}
        sx={{ px: { xs: 2, md: 4, xl: 8 }, py: 2, pb: { xs: 8, md: 3 } }}
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
              <Logo alt="XRPL.to" style={{ width: '110px', height: 'auto' }} />
            </Link>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: { xs: 'none', md: 'inline' },
                fontSize: '14px',
                opacity: 0.6
              }}
            >
              © {year}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 2, md: 3 },
              flex: 1,
              justifyContent: 'flex-end',
              flexWrap: 'wrap'
            }}
          >
            <Group items={PRODUCTS} />
            <SocialIcons />
          </Box>
        </Box>
      </Container>
    </Root>
  );
}

export default Footer;
