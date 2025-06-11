// Material
import { styled, Chip, Link, useTheme, alpha, Box } from '@mui/material';

// Iconify
import { Icon } from '@iconify/react';
import zoomIcon from '@iconify/icons-cil/zoom';

// ----------------------------------------------------------------------
const LinkChip = styled(Chip)(({ theme }) => ({
  height: '28px',
  fontSize: '0.75rem',
  borderRadius: '6px',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
    theme.palette.background.paper,
    0.4
  )} 100%)`,
  backdropFilter: 'blur(8px)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  color: theme.palette.primary.main,
  fontWeight: 500,
  transition: 'all 0.2s ease',
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(
      theme.palette.primary.main,
      0.04
    )} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
    transform: 'translateY(-1px)',
    cursor: 'pointer'
  },
  '&:focus': {
    outline: 'none'
  },
  [theme.breakpoints.down('sm')]: {
    height: '24px',
    fontSize: '0.7rem',
    '& .MuiChip-icon': {
      fontSize: '10px'
    }
  }
}));

export default function ExplorersMenu({ issuer }) {
  const theme = useTheme();

  const explorers = [
    {
      name: 'Bithomp',
      icon: '/static/bithomp.webp',
      url: issuer === 'XRPL' ? 'https://bithomp.com' : `https://bithomp.com/explorer/${issuer}`
    },
    {
      name: 'XRPScan',
      icon: '/static/xrpscan.webp',
      url: issuer === 'XRPL' ? 'https://xrpscan.com' : `https://xrpscan.com/account/${issuer}`
    },
    {
      name: 'XRPL Explorer',
      icon: '/static/xrpl-org.webp',
      url:
        issuer === 'XRPL'
          ? 'https://livenet.xrpl.org'
          : `https://livenet.xrpl.org/accounts/${issuer}`
    }
  ];

  // Use the first explorer as the primary link
  const primaryExplorer = explorers[0];

  return (
    <Link
      underline="none"
      color="inherit"
      target="_blank"
      href={primaryExplorer.url}
      rel="noreferrer noopener nofollow"
    >
      <LinkChip label="Explorer" icon={<Icon icon={zoomIcon} width="12" height="12" />} clickable />
    </Link>
  );
}
