import { Fragment } from 'react';

// Material
import { styled, Chip, Link, useTheme, alpha, Box, Tooltip } from '@mui/material';

// Material UI Icons
import ChatIcon from '@mui/icons-material/Chat';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';

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

export default function SocialLinksMenu({ token, issuer }) {
  const theme = useTheme();
  const { social } = token;

  // Prepare all platform links
  const allLinks = [];

  // Explorer links (always first)
  if (issuer) {
    const explorers = [
      {
        name: 'Bithomp',
        icon: '/static/bithomp.webp',
        url: issuer === 'XRPL' ? 'https://bithomp.com' : `https://bithomp.com/explorer/${issuer}`,
        label: 'Explorer',
        type: 'explorer',
        priority: 1
      }
    ];
    allLinks.push(...explorers);
  }

  // Chat platforms
  if (social) {
    if (social.telegram) {
      allLinks.push({
        name: 'Telegram',
        icon: '/static/telegram.webp',
        url: `https://t.me/${social.telegram}`,
        label: 'Telegram',
        type: 'chat',
        priority: 2
      });
    }

    if (social.discord) {
      allLinks.push({
        name: 'Discord',
        icon: '/static/discord.webp',
        url: `https://discord.gg/${social.discord}`,
        label: 'Discord',
        type: 'chat',
        priority: 3
      });
    }

    // Social media platforms
    const socialPlatforms = [
      {
        key: 'twitter',
        name: 'Twitter',
        icon: '/static/twitter.webp',
        url: (handle) => `https://twitter.com/${handle}`,
        label: 'Twitter',
        type: 'social',
        priority: 4
      },
      {
        key: 'instagram',
        name: 'Instagram',
        icon: '/static/instagram.webp',
        url: (handle) => `https://instagram.com/${handle}`,
        label: 'Instagram',
        type: 'social',
        priority: 5
      },
      {
        key: 'facebook',
        name: 'Facebook',
        icon: '/static/facebook.webp',
        url: (handle) => `https://facebook.com/${handle}`,
        label: 'Facebook',
        type: 'social',
        priority: 6
      },
      {
        key: 'linkedin',
        name: 'LinkedIn',
        icon: '/static/linkedin.webp',
        url: (handle) => `https://linkedin.com/${handle}`,
        label: 'LinkedIn',
        type: 'social',
        priority: 7
      },
      {
        key: 'youtube',
        name: 'YouTube',
        icon: '/static/youtube.webp',
        url: (handle) => `https://youtube.com/${handle}`,
        label: 'YouTube',
        type: 'content',
        priority: 8
      },
      {
        key: 'medium',
        name: 'Medium',
        icon: '/static/medium.webp',
        url: (handle) => `https://medium.com/${handle}`,
        label: 'Medium',
        type: 'content',
        priority: 9
      },
      {
        key: 'reddit',
        name: 'Reddit',
        icon: '/static/reddit.webp',
        url: (handle) => `https://reddit.com/r/${handle}`,
        label: 'Reddit',
        type: 'content',
        priority: 10
      }
    ];

    socialPlatforms.forEach((config) => {
      if (social[config.key]) {
        allLinks.push({
          name: config.name,
          icon: config.icon,
          url: config.url(social[config.key]),
          label: config.label,
          type: config.type,
          priority: config.priority
        });
      }
    });
  }

  // Return null if no links are available
  if (allLinks.length === 0) {
    return null;
  }

  // Sort by priority
  allLinks.sort((a, b) => a.priority - b.priority);

  const getIconForType = (type) => {
    switch (type) {
      case 'explorer':
        return <SearchIcon sx={{ width: 12, height: 12 }} />;
      case 'chat':
        return <ChatIcon sx={{ width: 12, height: 12 }} />;
      case 'social':
      case 'content':
      default:
        return <PersonIcon sx={{ width: 12, height: 12 }} />;
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 0.375, alignItems: 'center', flexWrap: 'wrap' }}>
      {allLinks.map((link, index) => (
        <Link
          key={index}
          underline="none"
          color="inherit"
          target="_blank"
          href={link.url}
          rel="noreferrer noopener nofollow"
        >
          <Tooltip title={`Visit ${link.name}`} arrow>
            <LinkChip label={link.label} icon={getIconForType(link.type)} clickable />
          </Tooltip>
        </Link>
      ))}
    </Box>
  );
}
