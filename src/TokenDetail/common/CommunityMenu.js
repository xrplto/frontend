import { Fragment, useState } from 'react';

// Material
import {
  styled,
  Chip,
  Link,
  useTheme,
  alpha,
  Box,
  Collapse,
  IconButton,
  Tooltip
} from '@mui/material';

// Iconify
import { Icon } from '@iconify/react';
import personFill from '@iconify/icons-bi/person-fill';
import chevronDown from '@iconify/icons-akar-icons/chevron-down';
import chevronUp from '@iconify/icons-akar-icons/chevron-up';

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

const ExpandButton = styled(IconButton)(({ theme }) => ({
  width: '28px',
  height: '28px',
  padding: 0,
  borderRadius: '6px',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
    theme.palette.background.paper,
    0.4
  )} 100%)`,
  backdropFilter: 'blur(8px)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  color: theme.palette.primary.main,
  transition: 'all 0.2s ease',
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(
      theme.palette.primary.main,
      0.04
    )} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
    transform: 'translateY(-1px)'
  },
  [theme.breakpoints.down('sm')]: {
    width: '24px',
    height: '24px'
  }
}));

export default function CommunityMenu({ token }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const { social } = token;

  // Return null if no social links are available
  if (!social || Object.keys(social).every((key) => !social[key])) {
    return null;
  }

  const socialPlatforms = [];

  const platformConfigs = [
    {
      key: 'twitter',
      name: 'Twitter',
      icon: '/static/twitter.webp',
      url: (handle) => `https://twitter.com/${handle}`,
      label: 'Twitter',
      priority: 1
    },
    {
      key: 'telegram',
      name: 'Telegram',
      icon: '/static/telegram.webp',
      url: (handle) => `https://t.me/${handle}`,
      label: 'Telegram',
      priority: 2
    },
    {
      key: 'discord',
      name: 'Discord',
      icon: '/static/discord.webp',
      url: (handle) => `https://discord.gg/${handle}`,
      label: 'Discord',
      priority: 3
    },
    {
      key: 'youtube',
      name: 'YouTube',
      icon: '/static/youtube.webp',
      url: (handle) => `https://youtube.com/${handle}`,
      label: 'YouTube',
      priority: 4
    },
    {
      key: 'instagram',
      name: 'Instagram',
      icon: '/static/instagram.webp',
      url: (handle) => `https://instagram.com/${handle}`,
      label: 'Instagram',
      priority: 5
    },
    {
      key: 'facebook',
      name: 'Facebook',
      icon: '/static/facebook.webp',
      url: (handle) => `https://facebook.com/${handle}`,
      label: 'Facebook',
      priority: 6
    },
    {
      key: 'linkedin',
      name: 'LinkedIn',
      icon: '/static/linkedin.webp',
      url: (handle) => `https://linkedin.com/${handle}`,
      label: 'LinkedIn',
      priority: 7
    },
    {
      key: 'medium',
      name: 'Medium',
      icon: '/static/medium.webp',
      url: (handle) => `https://medium.com/${handle}`,
      label: 'Medium',
      priority: 8
    },
    {
      key: 'reddit',
      name: 'Reddit',
      icon: '/static/reddit.webp',
      url: (handle) => `https://reddit.com/r/${handle}`,
      label: 'Reddit',
      priority: 9
    }
  ];

  platformConfigs.forEach((config) => {
    if (social && social[config.key]) {
      socialPlatforms.push({
        name: config.name,
        icon: config.icon,
        url: config.url(social[config.key]),
        label: config.label,
        priority: config.priority
      });
    }
  });

  // Sort by priority
  socialPlatforms.sort((a, b) => a.priority - b.priority);

  // Split into primary (first 6) and secondary (rest)
  const maxVisible = 6;
  const primaryPlatforms = socialPlatforms.slice(0, maxVisible);
  const secondaryPlatforms = socialPlatforms.slice(maxVisible);
  const hasMore = secondaryPlatforms.length > 0;

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {/* Primary row - always visible */}
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
        {primaryPlatforms.map((platform, index) => (
          <Link
            key={index}
            underline="none"
            color="inherit"
            target="_blank"
            href={platform.url}
            rel="noreferrer noopener nofollow"
          >
            <Tooltip title={`Visit ${platform.name}`} arrow>
              <LinkChip
                label={platform.label}
                icon={<Icon icon={personFill} width="12" height="12" />}
                clickable
              />
            </Tooltip>
          </Link>
        ))}

        {/* Show expand/collapse button if there are more platforms */}
        {hasMore && (
          <Tooltip title={expanded ? 'Show less' : `Show ${secondaryPlatforms.length} more`} arrow>
            <ExpandButton onClick={handleToggleExpand} size="small">
              <Icon
                icon={expanded ? chevronUp : chevronDown}
                width="14"
                height="14"
                style={{
                  transition: 'transform 0.2s ease'
                }}
              />
            </ExpandButton>
          </Tooltip>
        )}
      </Box>

      {/* Secondary row - collapsible */}
      {hasMore && (
        <Collapse in={expanded} timeout={300}>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
            {secondaryPlatforms.map((platform, index) => (
              <Link
                key={index + maxVisible}
                underline="none"
                color="inherit"
                target="_blank"
                href={platform.url}
                rel="noreferrer noopener nofollow"
              >
                <Tooltip title={`Visit ${platform.name}`} arrow>
                  <LinkChip
                    label={platform.label}
                    icon={<Icon icon={personFill} width="12" height="12" />}
                    clickable
                  />
                </Tooltip>
              </Link>
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}
