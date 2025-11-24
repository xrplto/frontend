import React from 'react';
import NextLink from 'next/link';
import styled from '@emotion/styled';
import Logo from 'src/components/Logo';

// Helper function
const alpha = (color, opacity) => color.replace(')', `, ${opacity})`);

// Custom styled components
const Box = styled.div``;
const Container = styled.div`
  max-width: 100%;
  padding: ${props => props.px || '16px'} ${props => props.py || '14px'};
  padding-bottom: ${props => props.pb || props.py || '14px'};
`;

const Typography = styled.div`
  font-size: ${props =>
    props.variant === 'body2' ? '0.875rem' : '1rem'};
  color: ${props =>
    props.color === 'text.secondary' ? (props.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)') : 'inherit'};
  opacity: ${props => props.opacity || 1};
`;

const Tooltip = ({ title, children, arrow }) => {
  const [show, setShow] = React.useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '4px 8px',
          background: 'rgba(0,0,0,0.9)',
          color: '#fff',
          borderRadius: '4px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          zIndex: 1000,
          marginBottom: '4px'
        }}>
          {title}
        </div>
      )}
    </div>
  );
};

const Root = styled.footer`
  width: 100%;
  border-top: 1.5px solid ${props => props.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'};
  background-color: transparent;
  margin-top: 12px;
`;

const Link = styled.a`
  text-decoration: none;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'};
  font-size: 0.95rem;
  font-weight: 400;
  padding: 4px 8px;
  border-radius: 8px;
  &:hover {
    color: #4285f4;
    background-color: rgba(66, 133, 244, 0.04);
  }
`;

const IconButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'};
  border-radius: 8px;
  text-decoration: none;
  &:hover {
    color: #4285f4;
    background-color: rgba(66, 133, 244, 0.04);
  }
`;

const FooterLink = ({ href, children, isDark }) => {
  const external = /^https?:\/\//.test(href || '');
  if (external) {
    return (
      <Link
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        isDark={isDark}
      >
        {children}
      </Link>
    );
  }
  return (
    <NextLink href={href} passHref legacyBehavior>
      <Link isDark={isDark}>
        {children}
      </Link>
    </NextLink>
  );
};

// Predefine immutable link groups to avoid re-creation on each render
const PRODUCTS = [
  { href: '/', label: 'Tokens' },
  { href: '/collections', label: 'NFTs' },
  { href: '/swap', label: 'Swap' },
  { href: '/news', label: 'News' },
  { href: '/api-docs', label: 'API' },
  { href: '/about', label: 'About' }
];
const SOCIALS = [
  { href: 'https://twitter.com/xrplto', label: 'Twitter', icon: '🐦' },
  { href: 'https://t.me/xrplto/', label: 'Telegram', icon: '✈️' },
  { href: 'https://www.reddit.com/r/xrplto/', label: 'Reddit', icon: '🔥' },
  { href: 'https://xrpl.to/discord/', label: 'Discord', icon: '💬' }
];

const Group = React.memo(({ items, isDark }) => (
  <Box style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
    {items.map((it) => (
      <FooterLink key={it.label} href={it.href} isDark={isDark}>{it.label}</FooterLink>
    ))}
  </Box>
));

const SocialIcons = React.memo(({ isDark }) => (
  <Box style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    {SOCIALS.map((social) => (
      <Tooltip key={social.label} title={social.label} arrow>
        <IconButton
          href={social.href}
          target="_blank"
          rel="noreferrer noopener"
          isDark={isDark}
        >
          <span style={{ fontSize: '18px' }}>{social.icon}</span>
        </IconButton>
      </Tooltip>
    ))}
  </Box>
));

function Footer({ isDark = false }) {
  const year = new Date().getFullYear();

  return (
    <Root isDark={isDark}>
      <Container px="32px" py="14px" pb="20px">
        <Box style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <NextLink href="/" passHref legacyBehavior>
              <Link isDark={isDark} style={{ display: 'inline-flex' }}>
                <Logo alt="XRPL.to" style={{ width: '70px', height: 'auto' }} />
              </Link>
            </NextLink>
            <Typography
              variant="body2"
              color="text.secondary"
              isDark={isDark}
              style={{ fontSize: '0.9rem', opacity: 0.5 }}
            >
              © {year}
            </Typography>
          </Box>

          <Box style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Group items={PRODUCTS} isDark={isDark} />
            <SocialIcons isDark={isDark} />
          </Box>
        </Box>
      </Container>
    </Root>
  );
}

export default Footer;
