import { Fragment } from 'react';

// Material
import { styled, Chip, Link, useTheme, alpha, Box } from '@mui/material';

// Iconify
import { Icon } from '@iconify/react';
import chatIcon from '@iconify/icons-bi/chat';

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

export default function ChatMenu({ token }) {
  const theme = useTheme();

  const { social } = token;

  const chatPlatforms = [];

  if (social && social.telegram) {
    chatPlatforms.push({
      name: 'Telegram',
      icon: '/static/telegram.webp',
      url: `https://t.me/${social.telegram}`,
      label: 'Telegram'
    });
  }

  if (social && social.discord) {
    chatPlatforms.push({
      name: 'Discord',
      icon: '/static/discord.webp',
      url: `https://discord.gg/${social.discord}`,
      label: 'Discord'
    });
  }

  // Don't render if no chat platforms available
  if (chatPlatforms.length === 0) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      {chatPlatforms.map((platform, index) => (
        <Link
          key={index}
          underline="none"
          color="inherit"
          target="_blank"
          href={platform.url}
          rel="noreferrer noopener nofollow"
        >
          <LinkChip
            label={platform.label}
            icon={<Icon icon={chatIcon} width="12" height="12" />}
            clickable
          />
        </Link>
      ))}
    </Box>
  );
}
