import { useState, useContext, useEffect } from 'react';
import React from 'react';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';

import { CopyToClipboard } from 'react-copy-to-clipboard';
import { LazyLoadImage } from 'react-lazy-load-image-component';

// Material
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  Link,
  Rating,
  Stack,
  styled,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import TokenIcon from '@mui/icons-material/Token';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import LocalFloristTwoToneIcon from '@mui/icons-material/LocalFloristTwoTone';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import WarningIcon from '@mui/icons-material/Warning';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LockIcon from '@mui/icons-material/Lock';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { SvgIcon } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VerifiedIcon from '@mui/icons-material/Verified';

// Iconify
import { Icon } from '@iconify/react';
import link45deg from '@iconify/icons-bi/link-45deg';
import linkExternal from '@iconify/icons-charm/link-external';
import paperIcon from '@iconify/icons-akar-icons/paper';
import copyIcon from '@iconify/icons-ph/copy';
import chartLineUp from '@iconify/icons-ph/chart-line-up';
// import arrowsExchange from '@iconify/icons-gg/arrows-exchange';
// import listCheck from '@iconify/icons-ci/list-check';
import blackholeIcon from '@iconify/icons-arcticons/blackhole';
import currencyRipple from '@iconify/icons-tabler/currency-ripple';
import infoFilled from '@iconify/icons-ep/info-filled';

// Context
import { AppContext } from 'src/AppContext';

// Utils
import { fNumber, fIntNumber, fNumberWithSuffix } from 'src/utils/formatNumber';

// Components
import SocialLinksMenu from './SocialLinksMenu';
import Watch from './Watch';
import Share from './Share';
import IssuerInfoDialog from './IssuerInfoDialog';
import EditTokenDialog from 'src/components/EditTokenDialog';
import Drawer from 'src/components/Drawer';
import TagsDrawer from 'src/components/TagsDrawer';
import LinksDrawer from 'src/components/LinksDrawer';
import PriceDesc from './PriceDesc';
import ExtraButtons from './ExtraButtons';

import Decimal from 'decimal.js';
import { currencySymbols } from 'src/utils/constants';
import { alpha } from '@mui/material/styles';

const IconCover = styled('div')(
  ({ theme }) => `
        width: 90px;
        height: 90px;
        border-radius: 20px;
        position: relative;
        overflow: hidden;
        z-index: 1;
        -webkit-tap-highlight-color: transparent;
        &:hover, &.Mui-focusVisible {
            z-index: 1;
            & .MuiImageBackdrop-root {
                opacity: 0.9;
            }
            & .MuiIconEditButton-root {
                opacity: 1;
            }
        }
    `
);

const IconWrapper = styled('div')(
  ({ theme }) => `
        box-sizing: border-box;
        display: inline-block;
        position: relative;
        width: 90px;
        height: 90px;
  `
);

const IconImage = styled('img')(
  ({ theme }) => `
    position: absolute;
    inset: 0px;
    box-sizing: border-box;
    padding: 0px;
    border: none;
    margin: auto;
    display: block;
    width: 0px; height: 0px;
    min-width: 100%;
    max-width: 100%;
    min-height: 100%;
    max-height: 100%;
    object-fit: cover;
    border-radius: 22px;
  `
);

const ImageBackdrop = styled('span')(({ theme }) => ({
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  backgroundColor: theme.palette.common.white,
  opacity: 0
}));

const CardOverlay = styled('div')(
  ({ theme }) => `
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: absolute;
    inset: 0;
`
);

const AdminImage = styled(LazyLoadImage)(({ theme }) => ({
  borderRadius: '50%',
  overflow: 'hidden',
  '&:hover': {
    cursor: 'pointer',
    opacity: 0.6
  }
}));

// Dummy function to prevent ReferenceError since @mui/styles is removed
const withStyles = (styles) => (Component) => Component;

const SupplyTypography = withStyles({
  root: {
    color: '#3366FF'
  }
})(Typography);

const TotalSupplyTypography = withStyles({
  root: {
    color: '#FFC107'
  }
})(Typography);

const VolumeTypography = withStyles({
  root: {
    color: '#FF6C40'
  }
})(Typography);

const MarketTypography = withStyles({
  root: {
    color: '#2CD9C5'
  }
})(Typography);

const KYCBadge = styled('div')(
  ({ theme }) => `
        position: absolute;
        top: -2px;
        right: -2px;
        z-index: 2;
        background: ${theme.palette.background.paper};
        border-radius: 50%;
    `
);

// Add Google Lens badge container
const GoogleLensBadge = styled('div')(
  ({ theme }) => `
        position: absolute;
        top: -6px;
        left: -6px;
        z-index: 2;
        background: ${theme.palette.background.paper};
        border-radius: 50%;
        padding: 2px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    `
);

// Add status badge container for multiple status indicators
const StatusBadgeContainer = styled('div')(
  ({ theme }) => `
        position: absolute;
        bottom: -4px;
        left: -4px;
        z-index: 2;
        display: flex;
        gap: 2px;
    `
);

const StatusBadge = styled('div')(
  ({ theme, bgcolor = theme.palette.success.main }) => `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: ${theme.palette.background.paper};
        border: 2px solid ${bgcolor};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `
);

// Compact origin and status indicator component
const OriginStatusIndicator = ({ origin, isBlackholed, isBurned, verified, size = 'normal' }) => {
  const theme = useTheme();
  const isCompact = size === 'compact';

  return (
    <Stack direction="row" spacing={isCompact ? 0.75 : 1} alignItems="center">
      {/* Origin indicator */}
      <Tooltip title={origin || 'Standard Launch'}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            minHeight: isCompact ? '22px' : '28px',
            position: 'relative'
          }}
        >
          <Box sx={{ fontSize: isCompact ? '14px' : '16px', display: 'flex' }}>
            {getOriginIcon(origin)}
          </Box>
        </Box>
      </Tooltip>

      {/* Verified indicator - shows before KYC */}
      {verified && (
        <Tooltip title="Verified Token">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, 
                #1976D2 0%, 
                #1565C0 25%, 
                #0D47A1 50%, 
                #1976D2 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: isCompact ? '16px' : '18px',
              marginRight: isCompact ? '4px' : '6px',
              marginBottom: '2px',
              position: 'relative',
              filter: 'drop-shadow(0 2px 4px rgba(25, 118, 210, 0.4))',
              animation: 'verifiedPremium 4s ease-in-out infinite',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

              '&::before': {
                content: '""',
                position: 'absolute',
                inset: '-3px',
                background: `linear-gradient(45deg, 
                  transparent 30%, 
                  rgba(25, 118, 210, 0.1) 50%, 
                  transparent 70%)`,
                borderRadius: '50%',
                animation: 'premiumGlow 3s linear infinite',
                zIndex: -1
              },

              '@keyframes verifiedPremium': {
                '0%, 100%': {
                  transform: 'scale(1) rotate(0deg)',
                  filter: 'drop-shadow(0 2px 4px rgba(25, 118, 210, 0.4))'
                },
                '25%': {
                  transform: 'scale(1.05) rotate(1deg)',
                  filter: 'drop-shadow(0 3px 6px rgba(25, 118, 210, 0.5))'
                },
                '50%': {
                  transform: 'scale(1.1) rotate(0deg)',
                  filter: 'drop-shadow(0 4px 8px rgba(25, 118, 210, 0.6))'
                },
                '75%': {
                  transform: 'scale(1.05) rotate(-1deg)',
                  filter: 'drop-shadow(0 3px 6px rgba(25, 118, 210, 0.5))'
                }
              },

              '@keyframes premiumGlow': {
                '0%': {
                  transform: 'rotate(0deg) scale(1)',
                  opacity: 0.3
                },
                '50%': {
                  transform: 'rotate(180deg) scale(1.2)',
                  opacity: 0.6
                },
                '100%': {
                  transform: 'rotate(360deg) scale(1)',
                  opacity: 0.3
                }
              },

              '&:hover': {
                transform: 'scale(1.3)',
                background: `linear-gradient(135deg, 
                  #0D47A1 0%, 
                  #1976D2 25%, 
                  #42A5F5 50%, 
                  #1976D2 75%,
                  #0D47A1 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 6px 12px rgba(25, 118, 210, 0.8))',
                animation: 'none',

                '&::before': {
                  background: `linear-gradient(45deg, 
                    rgba(25, 118, 210, 0.2) 0%, 
                    rgba(66, 165, 245, 0.3) 50%, 
                    rgba(25, 118, 210, 0.2) 100%)`,
                  transform: 'rotate(45deg) scale(1.5)',
                  opacity: 0.8
                }
              },

              '&:active': {
                transform: 'scale(0.9)',
                filter: 'drop-shadow(0 1px 2px rgba(25, 118, 210, 0.3))'
              }
            }}
          >
            <VerifiedIcon
              sx={{
                fontSize: isCompact ? '16px' : '18px',
                background: `linear-gradient(135deg, 
                  #1976D2 0%, 
                  #1565C0 25%, 
                  #0D47A1 50%, 
                  #1976D2 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                position: 'relative',
                zIndex: 1,

                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(135deg, 
                    rgba(25, 118, 210, 0.1) 0%, 
                    rgba(21, 101, 192, 0.15) 50%, 
                    rgba(13, 71, 161, 0.1) 100%)`,
                  borderRadius: '2px',
                  zIndex: -1,
                  animation: 'iconShimmer 2s ease-in-out infinite alternate'
                },

                '@keyframes iconShimmer': {
                  '0%': {
                    opacity: 0.3,
                    transform: 'scale(0.95)'
                  },
                  '100%': {
                    opacity: 0.7,
                    transform: 'scale(1.05)'
                  }
                }
              }}
            />
          </Box>
        </Tooltip>
      )}
    </Stack>
  );
};

function truncate(str, n) {
  if (!str) return '';
  //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
  return str.length > n ? str.substr(0, n - 1) + '... ' : str;
}

function normalizeTag(tag) {
  if (tag && tag.length > 0) {
    const tag1 = tag.split(' ').join('-'); // Replace space
    const tag2 = tag1.replace(/&/g, 'and'); // Replace &
    const tag3 = tag2.toLowerCase(); // Make lowercase
    const final = tag3.replace(/[^a-zA-Z0-9-]/g, '');
    return final;
  }
  return '';
}

// Helper functions before component
const hasShownWarningForToken = (tokenId) => {
  const currentSession = sessionStorage.getItem('currentSession');
  if (!currentSession) return false;

  try {
    const session = JSON.parse(currentSession);
    return session.scamWarnings.includes(tokenId);
  } catch (e) {
    return false;
  }
};

const markWarningShownForToken = (tokenId) => {
  let session;
  try {
    session = JSON.parse(sessionStorage.getItem('currentSession') || '{"scamWarnings":[]}');
  } catch (e) {
    session = { scamWarnings: [] };
  }

  if (!session.scamWarnings.includes(tokenId)) {
    session.scamWarnings.push(tokenId);
    sessionStorage.setItem('currentSession', JSON.stringify(session));
  }
};

// Add Google Lens search function
const openGoogleLens = (imageUrl) => {
  const encodedImageUrl = encodeURIComponent(imageUrl);
  const googleLensUrl = `https://lens.google.com/uploadbyurl?url=${encodedImageUrl}`;
  window.open(googleLensUrl, '_blank', 'noopener,noreferrer');
};

// Add XPMarket icon component
const XPMarketIcon = React.forwardRef((props, ref) => {
  // Filter out non-DOM props that might cause warnings
  const { darkMode, ...otherProps } = props;

  return (
    <SvgIcon {...otherProps} ref={ref} viewBox="0 0 36 36">
      <defs>
        <linearGradient id="xpmarket-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#9333EA', stopOpacity: 1 }} />
          <stop offset="30%" style={{ stopColor: '#7C3AED', stopOpacity: 1 }} />
          <stop offset="70%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#6D28D9', stopOpacity: 1 }} />
        </linearGradient>
        <filter id="xpmarket-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="rgba(109, 31, 238, 0.4)" />
        </filter>
      </defs>
      <g transform="translate(2, 2) scale(1.1)" filter="url(#xpmarket-shadow)">
        <path
          d="M17.7872 2.625H4.41504L7.67032 7.88327H14.5L17.9149 13.4089H24.4574L17.7872 2.625Z"
          fill="url(#xpmarket-icon-gradient)"
        />
        <path
          d="M1 18.6667L7.67014 29.4506L10.9573 24.1627L7.54248 18.6667L10.9573 13.1708L7.67014 7.88281L1 18.6667Z"
          fill="url(#xpmarket-icon-gradient)"
        />
        <path
          d="M24.3292 24.1931L30.9994 13.4092H24.4569L21.042 18.9051H14.2123L10.957 24.1931H24.3292Z"
          fill="url(#xpmarket-icon-gradient)"
        />
      </g>
    </SvgIcon>
  );
});

// Add display name for better debugging
XPMarketIcon.displayName = 'XPMarketIcon';

const LedgerMemeIcon = React.forwardRef((props, ref) => {
  // Filter out non-DOM props that might cause warnings
  const { darkMode, ...otherProps } = props;

  return (
    <SvgIcon {...otherProps} ref={ref} viewBox="0 0 26 26">
      <g transform="scale(0.75)">
        <rect fill="#cfff04" width="36" height="36" rx="8" ry="8" x="0" y="0"></rect>
        <g>
          <g>
            <path
              fill="#262626"
              d="M25.74,9.68c0.64,0,1.24-0.26,1.69-0.72l2.69-2.76h-1.64l-1.87,1.92c-0.23,0.24-0.55,0.37-0.88-0.37s-0.64-0.13-0.88-0.37l-1.87-1.92h-1.64l2.69,2.76c0.45,0.46,1.05,0.72,1.69,0.72Z"
            ></path>
            <path
              fill="#262626"
              d="M27.43,10.62c-0.45-0.46-1.05-0.72-1.69-0.72s-1.24,0.26-1.69,0.72l-2.71,2.78h1.64l1.89-1.93c0.23-0.24,0.55-0.37,0.88-0.37s0.64,0.13,0.88,0.37l1.89,1.93h1.64l-2.71-2.78Z"
            ></path>
            <path
              fill="#262626"
              d="M10.22,9.68c0.64,0,1.24-0.26,1.69-0.72l2.69-2.76h-1.64l-1.87,1.92c-0.23,0.24-0.55,0.37-0.88-0.37s-0.64-0.13-0.88-0.37l-1.87-1.92h-1.64l2.69,2.76c0.45,0.46,1.05,0.72,1.69,0.72Z"
            ></path>
            <path
              fill="#262626"
              d="M10.22,9.90c-0.64,0-1.24,0.26-1.69,0.72l-2.71,2.78h1.64l1.89-1.93c0.23-0.24,0.55-0.37,0.88-0.37s0.64,0.13,0.88,0.37l1.89,1.93h1.64l-2.71-2.78c-0.45-0.46-1.05-0.72-1.69-0.72Z"
            ></path>
          </g>
          <path
            fill="#262626"
            d="M5.81,17.4c0,6.73,5.45,12.18,12.18,12.18s12.18-5.45,12.18-12.18H5.81Z"
          ></path>
        </g>
      </g>
    </SvgIcon>
  );
});

LedgerMemeIcon.displayName = 'LedgerMemeIcon';

const getOriginIcon = (origin) => {
  switch (origin) {
    case 'FirstLedger':
      return <OpenInNewIcon sx={{ fontSize: '16px', color: '#013CFE' }} />;
    case 'XPMarket':
      return (
        <XPMarketIcon
          sx={{ fontSize: '18px', color: '#6D1FEE', marginRight: '2px', marginBottom: '2px' }}
        />
      );
    case 'LedgerMeme':
      return (
        <LedgerMemeIcon
          sx={{ fontSize: '18px', color: '#cfff04', marginRight: '2px', marginBottom: '2px' }}
        />
      );
    case 'aigent.run':
      return (
        <Box
          component="img"
          src="/static/aigentrun.gif"
          alt="Aigent.Run"
          sx={{
            width: '16px',
            height: '16px',
            objectFit: 'contain'
          }}
        />
      );
    case 'Magnetic X':
      return (
        <Box
          component="img"
          src="/magneticx-logo.webp"
          alt="Magnetic X"
          sx={{
            width: '18px',
            height: '18px',
            objectFit: 'contain',
            marginRight: '2px',
            marginBottom: '2px'
          }}
        />
      );
    case 'xrp.fun':
      return (
        <Icon
          icon={chartLineUp}
          style={{
            fontSize: '18px',
            color: '#B72136',
            marginRight: '2px',
            marginBottom: '2px'
          }}
        />
      );
    default:
      return <AutoAwesomeIcon sx={{ fontSize: '11px', color: '#637381' }} />;
  }
};

// ----------------------------------------------------------------------

const TagsSection = ({ tags, md5, normalizeTag, theme, handleDelete, toggleTagsDrawer }) => {
  const [expanded, setExpanded] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isXsMobile = useMediaQuery(theme.breakpoints.down(400));

  if (!tags || tags.length === 0) return null;

  const maxVisibleTags = isMobile ? (isXsMobile ? 2 : 4) : 8;
  const shouldUseVerticalLayout = tags.length > (isMobile ? 4 : 8);
  const hasMore = tags.length > maxVisibleTags;

  const handleToggleExpand = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const TagChip = ({ tag, isExpand = false }) => {
    if (isExpand) {
      return (
        <Chip
          size="small"
          label={tag}
          onClick={handleToggleExpand}
          sx={{
            height: isMobile ? '28px' : '32px',
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            borderRadius: '4px',
            px: isMobile ? 0.75 : 1.25,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.08
            )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            color: theme.palette.primary.main,
            fontWeight: 500,
            cursor: 'pointer',
            minHeight: isMobile ? '36px' : 'auto',

            '&:hover': {
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.12
              )} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
              transform: isMobile ? 'scale(1.02)' : 'none'
            },

            '&:active': {
              transform: isMobile ? 'scale(0.98)' : 'none'
            }
          }}
        />
      );
    }

    return (
      <Link
        href={`/view/${normalizeTag(tag)}`}
        sx={{ display: 'inline-flex' }}
        underline="none"
        rel="noreferrer noopener nofollow"
      >
        <Chip
          size="small"
          label={
            tag === 'aigent.run' ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  component="img"
                  src="/static/aigentrun.gif"
                  alt="Aigent.Run"
                  sx={{
                    width: '12px',
                    height: '12px',
                    objectFit: 'contain'
                  }}
                />
                {tag}
              </Box>
            ) : (
              tag
            )
          }
          onClick={handleDelete}
          sx={{
            height: isMobile ? '28px' : '32px',
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            borderRadius: '4px',
            px: isMobile ? 0.75 : 1.25,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.8
            )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
            border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
            color: theme.palette.text.primary,
            fontWeight: 500,
            cursor: 'pointer',
            minHeight: isMobile ? '36px' : 'auto',

            '&:hover': {
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.08
              )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              color: theme.palette.primary.main,
              transform: isMobile ? 'scale(1.02)' : 'none'
            },

            '&:active': {
              transform: isMobile ? 'scale(0.98)' : 'none'
            }
          }}
        />
      </Link>
    );
  };

  if (shouldUseVerticalLayout) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? 0.75 : 1,
          width: '100%'
        }}
      >
        {/* Primary row */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 0.5 : 0.75, width: '100%' }}>
          {tags.slice(0, isMobile ? (isXsMobile ? 2 : 4) : 6).map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
          {hasMore && !expanded && (
            <TagChip
              tag={`+${tags.length - (isMobile ? (isXsMobile ? 2 : 4) : 6)} more`}
              isExpand={true}
            />
          )}
        </Box>

        {/* Additional rows when expanded */}
        {expanded && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 0.75 : 1, mt: 0.5 }}>
            {/* Split remaining tags into rows */}
            {Array.from(
              {
                length: Math.ceil(
                  (tags.length - (isMobile ? (isXsMobile ? 2 : 4) : 6)) /
                    (isMobile ? (isXsMobile ? 2 : 4) : 6)
                )
              },
              (_, rowIndex) => (
                <Box
                  key={rowIndex}
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: isMobile ? 0.5 : 0.75,
                    width: '100%'
                  }}
                >
                  {tags
                    .slice(
                      (isMobile ? (isXsMobile ? 2 : 4) : 6) +
                        rowIndex * (isMobile ? (isXsMobile ? 2 : 4) : 6),
                      (isMobile ? (isXsMobile ? 2 : 4) : 6) +
                        (rowIndex + 1) * (isMobile ? (isXsMobile ? 2 : 4) : 6)
                    )
                    .map((tag) => (
                      <TagChip key={tag} tag={tag} />
                    ))}
                </Box>
              )
            )}
            {/* Show less button */}
            <Box sx={{ display: 'flex', gap: isMobile ? 0.5 : 0.75 }}>
              <TagChip tag="Show less" isExpand={true} />
            </Box>
          </Box>
        )}
      </Box>
    );
  }

  // Standard horizontal layout for fewer tags
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 0.5 : 0.75, width: '100%' }}>
      {tags.slice(0, maxVisibleTags).map((tag) => (
        <TagChip key={tag} tag={tag} />
      ))}
      {hasMore && (
        <Chip
          label={`+${tags.length - maxVisibleTags}`}
          size="small"
          onClick={() => toggleTagsDrawer(true)}
          sx={{
            height: isMobile ? '28px' : '32px',
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            borderRadius: '4px',
            px: isMobile ? 0.75 : 1.25,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.08
            )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            color: theme.palette.primary.main,
            fontWeight: 500,
            cursor: 'pointer',
            minHeight: isMobile ? '36px' : 'auto',

            '&:hover': {
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.12
              )} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
              transform: isMobile ? 'scale(1.02)' : 'none'
            },

            '&:active': {
              transform: isMobile ? 'scale(0.98)' : 'none'
            }
          }}
        />
      )}
    </Box>
  );
};

// ----------------------------------------------------------------------

export default function UserDesc({ token }) {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isXsMobile = useMediaQuery(theme.breakpoints.down(400));
  const { darkMode, accountProfile, openSnackbar, activeFiatCurrency } = useContext(AppContext);
  const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;
  const [rating, setRating] = useState(2);
  // const [trustToken, setTrustToken] = useState(null);
  const [openIssuerInfo, setOpenIssuerInfo] = useState(false);
  const [editToken, setEditToken] = useState(null);

  const [openTagsDrawer, setOpenTagsDrawer] = useState(false);
  const [openLinksDrawer, setOpenLinksDrawer] = useState(false);

  const {
    id,
    issuer,
    name,
    domain,
    whitepaper,
    verified,
    holders,
    offers,
    trustlines,
    ext,
    md5,
    slug,
    tags,
    social,
    issuer_info,
    assessment,
    date,
    dateon,
    marketcap,
    vol24hx,
    vol24htx,
    vol24hxrp,
    amount,
    supply
  } = token;

  // Create enhanced tags array that includes origin-based tags
  const getOriginTag = (origin) => {
    switch (origin) {
      case 'FirstLedger':
        return 'FirstLedger';
      case 'XPMarket':
        return 'XPMarket';
      case 'LedgerMeme':
        return 'LedgerMeme';
      case 'Magnetic X':
        return 'Magnetic X';
      case 'xrp.fun':
        return 'xrp.fun';
      default:
        return null;
    }
  };

  const enhancedTags = (() => {
    const baseTags = tags || [];
    const originTag = getOriginTag(token.origin);

    if (originTag && !baseTags.includes(originTag)) {
      return [originTag, ...baseTags];
    }

    return baseTags;
  })();

  const [showStat, setShowStat] = useState(false);
  const metrics = useSelector(selectMetrics);

  const [omcf, setOMCF] = useState(token.isOMCF || 'no'); // is Old Market Cap Formula
  const convertedMarketCap =
    marketcap && metrics && metrics[activeFiatCurrency]
      ? Decimal.div(marketcap, metrics[activeFiatCurrency]).toNumber()
      : 0;
  const volume = fNumber(vol24hx);
  const voldivmarket =
    marketcap > 0 && vol24hxrp ? Decimal.div(vol24hxrp, marketcap).toNumber() : 0;
  const circulatingSupply = fNumber(supply);
  const totalSupply = fNumber(amount);

  const info = issuer_info || {};

  let user = token.user;
  if (!user) user = name;

  const isCommunity = true; /*social && (social.twitter || social.facebook || social.linkedin 
        || social.instagram || social.youtube || social.medium || social.twitch || social.tiktok || social.reddit);*/
  const isChat = social && (social.telegram || social.discord);

  // const imgUrl = `/static/tokens/${md5}.${ext}`;
  const imgUrl = `https://s1.xrpl.to/token/${md5}`;

  const img_xrplf_black = '/static/xrplf_black.svg';
  const img_xrplf_white = '/static/xrplf_white.svg';

  const img_xrplf = darkMode ? img_xrplf_white : img_xrplf_black;

  // const img_xrplf = "/static/xrp.webp";

  const handleDelete = () => {};

  const handleOpenIssuerInfo = () => {
    setOpenIssuerInfo(true);
  };

  const toggleTagsDrawer = (isOpen = true) => {
    setOpenTagsDrawer(isOpen);
  };

  const toggleLinksDrawer = (isOpen = true) => {
    setOpenLinksDrawer(isOpen);
  };

  const [openScamWarning, setOpenScamWarning] = useState(false);
  const [openHighRiskWarning, setOpenHighRiskWarning] = useState(false);
  const [openLedgerMemeWarning, setOpenLedgerMemeWarning] = useState(false);

  // Move the session initialization useEffect inside the component
  useEffect(() => {
    if (!sessionStorage.getItem('currentSession')) {
      sessionStorage.setItem('currentSession', JSON.stringify({ scamWarnings: [] }));
    }
  }, []);

  // Move the scam warning useEffect inside the component
  useEffect(() => {
    if (
      enhancedTags &&
      enhancedTags.some((tag) => tag.toLowerCase() === 'scam') &&
      !hasShownWarningForToken(id)
    ) {
      setOpenScamWarning(true);
      markWarningShownForToken(id);
    }
  }, [enhancedTags, id]);

  // Move the high risk warning useEffect inside the component
  useEffect(() => {
    if (
      enhancedTags &&
      enhancedTags.some((tag) => tag.toLowerCase() === 'high risk') &&
      !hasShownWarningForToken(`${id}-highrisk`)
    ) {
      setOpenHighRiskWarning(true);
      markWarningShownForToken(`${id}-highrisk`);
    }
  }, [enhancedTags, id]);

  // LedgerMeme graduation warning
  useEffect(() => {
    if (
      token.origin === 'LedgerMeme' &&
      holders === 1 &&
      !hasShownWarningForToken(`${id}-ledgermeme`)
    ) {
      setOpenLedgerMemeWarning(true);
      markWarningShownForToken(`${id}-ledgermeme`);
    }
  }, [token.origin, holders, id]);

  const statsData = [
    {
      label: 'Market Cap',
      value: fNumberWithSuffix(convertedMarketCap),
      color: theme.palette.info.main
    },
    {
      label: 'Volume (24h)',
      value: fNumberWithSuffix(vol24hx),
      color: theme.palette.warning.main,
      subValue: `${name}`
    },
    { label: 'Vol/Market', value: fNumber(voldivmarket), color: theme.palette.warning.main },
    { label: 'Circ. Supply', value: fNumberWithSuffix(supply), color: theme.palette.primary.main },
    {
      label: 'Created',
      value: (() => {
        // Try date first (string format like "2024-10-27")
        if (date) {
          return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
        // Fallback to dateon (timestamp format)
        if (dateon) {
          return new Date(dateon).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
        return 'N/A';
      })(),
      color: theme.palette.success.main
    }
  ];

  const getFullUrl = (platform, handle) => {
    if (!handle) return '#';
    if (handle.startsWith('http')) return handle;
    switch (platform) {
      case 'twitter':
      case 'x':
        return `https://x.com/${handle}`;
      case 'telegram':
        return `https://t.me/${handle}`;
      case 'discord':
        return `https://discord.gg/${handle}`;
      case 'github':
        return `https://github.com/${handle}`;
      case 'reddit':
        return `https://www.reddit.com/user/${handle}`;
      case 'facebook':
        return `https://www.facebook.com/${handle}`;
      case 'linkedin':
        return `https://www.linkedin.com/company/${handle}`;
      case 'instagram':
        return `https://www.instagram.com/${handle}`;
      case 'youtube':
        return `https://www.youtube.com/@${handle}`;
      case 'medium':
        return `https://medium.com/@${handle}`;
      case 'tiktok':
        return `https://www.tiktok.com/@${handle}`;
      case 'twitch':
        return `https://www.twitch.tv/${handle}`;
      case 'website':
        return `https://${handle}`;
      default:
        return handle;
    }
  };

  // Compact social links component for header integration
  const CompactSocialLinks = ({ size = 'small' }) => {
    if (!social) return null;

    const socialEntries = Object.entries(social).filter(([key, value]) => value);
    if (socialEntries.length === 0) return null;

    const iconSize = size === 'small' ? 14 : 16;

    return (
      <Stack direction="row" spacing={0.5} alignItems="center">
        {socialEntries.slice(0, isMobile ? 3 : 4).map(([platform, url]) => (
          <Tooltip key={platform} title={`${platform}: ${url}`} arrow>
            <IconButton
              component="a"
              href={getFullUrl(platform, url)}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{
                width: isMobile ? 24 : 28,
                height: isMobile ? 24 : 28,
                p: 0.5,
                borderRadius: '6px',
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.08
                )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                color: theme.palette.primary.main,

                '&:hover': {
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.15
                  )} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  transform: 'scale(1.05)'
                }
              }}
            >
              {(platform === 'twitter' || platform === 'x') && (
                <Icon icon="mdi:twitter" width={iconSize} height={iconSize} />
              )}
              {platform === 'telegram' && (
                <Icon icon="mdi:telegram" width={iconSize} height={iconSize} />
              )}
              {platform === 'discord' && (
                <Icon icon="mdi:discord" width={iconSize} height={iconSize} />
              )}
              {platform === 'website' && <Icon icon="mdi:web" width={iconSize} height={iconSize} />}
              {platform === 'github' && (
                <Icon icon="mdi:github" width={iconSize} height={iconSize} />
              )}
              {platform === 'reddit' && (
                <Icon icon="mdi:reddit" width={iconSize} height={iconSize} />
              )}
              {!['twitter', 'x', 'telegram', 'discord', 'website', 'github', 'reddit'].includes(
                platform
              ) && <Icon icon="mdi:link" width={iconSize} height={iconSize} />}
            </IconButton>
          </Tooltip>
        ))}
        {socialEntries.length > (isMobile ? 3 : 4) && (
          <Tooltip title="View all links" arrow>
            <IconButton
              onClick={() => toggleLinksDrawer(true)}
              size="small"
              sx={{
                width: isMobile ? 24 : 28,
                height: isMobile ? 24 : 28,
                p: 0.5,
                borderRadius: '6px',
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.secondary.main,
                  0.08
                )} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.12)}`,
                color: theme.palette.secondary.main,

                '&:hover': {
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.secondary.main,
                    0.15
                  )} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`
                }
              }}
            >
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 600 }}>
                +{socialEntries.length - (isMobile ? 3 : 4)}
              </Typography>
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    );
  };

  // Compact tags component for inline integration
  const CompactTags = ({ maxTags = 3 }) => {
    if (!enhancedTags || enhancedTags.length === 0) return null;

    return (
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
        {enhancedTags.slice(0, maxTags).map((tag) => (
          <Link
            key={tag}
            href={`/view/${normalizeTag(tag)}`}
            sx={{ display: 'inline-flex' }}
            underline="none"
            rel="noreferrer noopener nofollow"
          >
            <Chip
              size="small"
              label={
                tag === 'aigent.run' ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box
                      component="img"
                      src="/static/aigentrun.gif"
                      alt="Aigent.Run"
                      sx={{
                        width: '12px',
                        height: '12px',
                        objectFit: 'contain'
                      }}
                    />
                    {tag}
                  </Box>
                ) : (
                  tag
                )
              }
              sx={{
                height: isMobile ? '20px' : '22px',
                fontSize: isMobile ? '0.6rem' : '0.65rem',
                borderRadius: '4px',
                px: isMobile ? 0.5 : 0.75,
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.background.paper,
                  0.8
                )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                color: theme.palette.text.primary,
                fontWeight: 500,
                cursor: 'pointer',
                minHeight: 'auto',

                '&:hover': {
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                  color: theme.palette.primary.main,
                  transform: isMobile ? 'scale(1.02)' : 'none'
                }
              }}
            />
          </Link>
        ))}
        {enhancedTags.length > maxTags && (
          <Chip
            label={`+${enhancedTags.length - maxTags}`}
            size="small"
            onClick={() => toggleTagsDrawer(true)}
            sx={{
              height: isMobile ? '20px' : '22px',
              fontSize: isMobile ? '0.6rem' : '0.65rem',
              borderRadius: '4px',
              px: isMobile ? 0.5 : 0.75,
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.08
              )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              color: theme.palette.primary.main,
              fontWeight: 500,
              cursor: 'pointer',
              minHeight: 'auto',

              '&:hover': {
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.12
                )} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`
              }
            }}
          />
        )}
      </Stack>
    );
  };

  return (
    <Stack
      spacing={isMobile ? 0.5 : 0.75}
      sx={{
        p: isMobile ? 1 : 1.5,
        borderRadius: isMobile ? '8px' : '16px',
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.background.paper, 0.95)} 0%, 
          ${alpha(theme.palette.background.paper, 0.85)} 50%,
          ${alpha(theme.palette.background.paper, 0.75)} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(8px)',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at top right, 
            ${alpha(theme.palette.primary.main, 0.03)} 0%, 
            transparent 50%
          )`,
          pointerEvents: 'none'
        }
      }}
    >
      {editToken && <EditTokenDialog token={editToken} setToken={setEditToken} />}

      <IssuerInfoDialog open={openIssuerInfo} setOpen={setOpenIssuerInfo} token={token} />

      {/* Main Content Row */}
      <Stack
        direction={isMobile ? 'column' : 'row'}
        spacing={isMobile ? 0.75 : 1.5}
        alignItems={isMobile ? 'stretch' : 'flex-start'}
        justifyContent="space-between"
      >
        {/* Mobile: Header with Avatar, Name/User, and Actions */}
        {isMobile && (
          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            spacing={1}
            sx={{ width: '100%' }}
          >
            {/* Avatar */}
            <Box sx={{ position: 'relative', zIndex: 1, flexShrink: 0, p: 0.75 }}>
              <Avatar
                alt={`${user} ${name} Logo`}
                src={imgUrl}
                sx={{
                  width: isXsMobile ? 76 : 84,
                  height: isXsMobile ? 76 : 84,
                  borderRadius: '14px',
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.15)}`
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 2,
                  background: theme.palette.background.paper,
                  borderRadius: '50%',
                  padding: '2px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                <Tooltip title="Search image with Google Lens">
                  <IconButton
                    onClick={() => openGoogleLens(imgUrl)}
                    size="small"
                    sx={{
                      width: isXsMobile ? 18 : 22,
                      height: isXsMobile ? 18 : 22,
                      p: 0,
                      background: `linear-gradient(135deg, #4285f4 0%, #34a853 50%, #fbbc04 75%, #ea4335 100%)`,
                      color: 'white',
                      '&:hover': {
                        background: `linear-gradient(135deg, #3367d6 0%, #2d8f47 50%, #f9ab00 75%, #d33b01 100%)`,
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <SearchIcon sx={{ fontSize: isXsMobile ? 10 : 12 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Name, User, Tags, Social - Middle Section */}
            <Stack
              spacing={0.5}
              sx={{
                flex: 1,
                minWidth: 0,
                mx: 1,
                justifyContent: 'flex-start'
              }}
            >
              {/* Name and Rank Row */}
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: isXsMobile ? '1.35rem' : '1.45rem',
                    fontWeight: 700,
                    background: `linear-gradient(135deg, 
                      ${theme.palette.primary.main} 0%, 
                      ${theme.palette.success.main} 50%,
                      ${theme.palette.info.main} 100%
                    )`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    minWidth: 0
                  }}
                >
                  {name}
                </Typography>

                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Tooltip title={`Rank by 24h Volume: #${id - 1}`}>
                    <Chip
                      label={`#${id - 1}`}
                      color="primary"
                      variant="outlined"
                      size="small"
                      sx={{
                        borderRadius: '6px',
                        height: isXsMobile ? '26px' : '30px',
                        fontSize: isXsMobile ? '0.8rem' : '0.9rem',
                        background: `linear-gradient(135deg, 
                          ${alpha(theme.palette.primary.main, 0.12)} 0%, 
                          ${alpha(theme.palette.primary.main, 0.06)} 100%
                        )`,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        fontWeight: 600,
                        px: 0.75,
                        minWidth: 'auto',
                        flexShrink: 0
                      }}
                    />
                  </Tooltip>

                  {/* Origin status indicator next to rank */}
                  <OriginStatusIndicator
                    origin={token.origin}
                    isBlackholed={!!token.origin}
                    isBurned={!!token.origin}
                    verified={verified}
                    size="compact"
                  />

                  {/* Liquidity Status */}
                  {token.origin && token.origin !== 'xrp.fun' && (
                    <Tooltip
                      title={
                        token.origin === 'LedgerMeme' && holders === 1
                          ? 'Liquidity Not Burned'
                          : 'Burned Liquidity Pool'
                      }
                    >
                      {token.origin === 'LedgerMeme' && holders === 1 ? (
                        <Icon
                          icon="mdi:water-outline"
                          style={{
                            fontSize: '18px',
                            color: '#FFC107',
                            marginRight: '2px',
                            marginBottom: '2px'
                          }}
                        />
                      ) : (
                        <LocalFireDepartmentIcon
                          sx={{
                            fontSize: '18px',
                            color: '#1890FF',
                            marginRight: '2px',
                            marginBottom: '2px'
                          }}
                        />
                      )}
                    </Tooltip>
                  )}

                  {/* Blackholed Status */}
                  {(info.blackholed || token.origin) && (
                    <Tooltip title="Blackholed Issuer">
                      <LockIcon
                        sx={{
                          fontSize: '18px',
                          color: '#00AB55',
                          marginRight: '2px',
                          marginBottom: '2px'
                        }}
                      />
                    </Tooltip>
                  )}
                </Stack>
              </Stack>

              {/* User Row */}
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: isXsMobile ? '1rem' : '1.1rem',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: alpha(theme.palette.text.primary, 0.7),
                  lineHeight: 1.1,
                  mb: 0.25
                }}
              >
                {user}
              </Typography>

              {/* Compact Tags and Social Row */}
              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}
              >
                <CompactTags maxTags={isXsMobile ? 2 : 3} />
                <CompactSocialLinks size="small" />
              </Stack>
            </Stack>

            {/* Actions */}
            <Stack direction="row" spacing={0.5} alignItems="flex-start" sx={{ flexShrink: 0 }}>
              <Watch token={token} />
              <Share token={token} />
            </Stack>
          </Stack>
        )}

        {/* Token Info Section - Desktop and remaining mobile content */}
        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={isMobile ? 1 : 2}
          alignItems={isMobile ? 'stretch' : 'flex-start'}
          sx={{ flex: 1, minWidth: 0 }}
        >
          {/* Desktop Avatar - same as before */}
          {!isMobile && (
            <>
              {isAdmin ? (
                <div style={{ padding: '8px' }}>
                  <IconCover>
                    <IconWrapper>
                      <IconImage src={imgUrl} />
                    </IconWrapper>
                    <IconButton
                      className="MuiIconEditButton-root"
                      aria-label="edit"
                      sx={{
                        position: 'absolute',
                        left: '0vw',
                        top: '0vh',
                        opacity: 0,
                        zIndex: 1,
                        width: '70px',
                        height: '70px'
                      }}
                      onClick={() => setEditToken(token)}
                    >
                      <EditIcon sx={{ width: 40, height: 40 }} />
                    </IconButton>
                    <ImageBackdrop className="MuiImageBackdrop-root" />
                  </IconCover>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      zIndex: 2,
                      background: theme.palette.background.paper,
                      borderRadius: '50%',
                      padding: '2px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  >
                    <Tooltip title="Search image with Google Lens">
                      <IconButton
                        onClick={() => openGoogleLens(imgUrl)}
                        size="small"
                        sx={{
                          width: 26,
                          height: 26,
                          p: 0,
                          background: `linear-gradient(135deg, #4285f4 0%, #34a853 50%, #fbbc04 75%, #ea4335 100%)`,
                          color: 'white',
                          '&:hover': {
                            background: `linear-gradient(135deg, #3367d6 0%, #2d8f47 50%, #f9ab00 75%, #d33b01 100%)`,
                            transform: 'scale(1.1)'
                          }
                        }}
                      >
                        <SearchIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </div>
              ) : (
                <Box sx={{ position: 'relative', zIndex: 1, p: 1 }}>
                  <Avatar
                    alt={`${user} ${name} Logo`}
                    src={imgUrl}
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: '22px',
                      border: `3px solid ${alpha(theme.palette.primary.main, 0.15)}`
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      zIndex: 2,
                      background: theme.palette.background.paper,
                      borderRadius: '50%',
                      padding: '2px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  >
                    <Tooltip title="Search image with Google Lens">
                      <IconButton
                        onClick={() => openGoogleLens(imgUrl)}
                        size="small"
                        sx={{
                          width: 30,
                          height: 30,
                          p: 0,
                          background: `linear-gradient(135deg, #4285f4 0%, #34a853 50%, #fbbc04 75%, #ea4335 100%)`,
                          color: 'white',
                          '&:hover': {
                            background: `linear-gradient(135deg, #3367d6 0%, #2d8f47 50%, #f9ab00 75%, #d33b01 100%)`,
                            transform: 'scale(1.1)'
                          }
                        }}
                      >
                        <SearchIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              )}
            </>
          )}

          {/* Token Details - Desktop with integrated tags and social */}
          {!isMobile && (
            <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
              {/* Name and Rank Row */}
              <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    background: `linear-gradient(135deg, 
                      ${theme.palette.primary.main} 0%, 
                      ${theme.palette.success.main} 50%,
                      ${theme.palette.info.main} 100%
                    )`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.01em',
                    lineHeight: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '280px'
                  }}
                >
                  {name}
                </Typography>

                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Tooltip title={`Rank by 24h Volume: #${id - 1}`}>
                    <Chip
                      label={`#${id - 1}`}
                      color="primary"
                      variant="outlined"
                      size="small"
                      sx={{
                        borderRadius: '6px',
                        height: '38px',
                        fontSize: '1.05rem',
                        background: `linear-gradient(135deg, 
                          ${alpha(theme.palette.primary.main, 0.12)} 0%, 
                          ${alpha(theme.palette.primary.main, 0.06)} 100%
                        )`,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        fontWeight: 600,
                        px: 1.5,
                        minWidth: 'auto'
                      }}
                    />
                  </Tooltip>

                  {/* Origin status indicator next to rank */}
                  <OriginStatusIndicator
                    origin={token.origin}
                    isBlackholed={!!token.origin}
                    isBurned={!!token.origin}
                    verified={verified}
                    size="normal"
                  />

                  {/* Burned Liquidity Status */}
                  {token.origin &&
                    token.origin !== 'xrp.fun' &&
                    !(token.origin === 'LedgerMeme' && holders === 1) && (
                      <Tooltip title="Burned Liquidity Pool">
                        <LocalFireDepartmentIcon
                          sx={{
                            fontSize: '20px',
                            color: '#1890FF',
                            marginRight: '2px',
                            marginBottom: '2px'
                          }}
                        />
                      </Tooltip>
                    )}

                  {/* Blackholed Status */}
                  {(info.blackholed || token.origin) && (
                    <Tooltip title="Blackholed Issuer">
                      <LockIcon
                        sx={{
                          fontSize: '20px',
                          color: '#00AB55',
                          marginRight: '2px',
                          marginBottom: '2px'
                        }}
                      />
                    </Tooltip>
                  )}
                </Stack>
              </Stack>

              {/* User, Tags, and Social Row */}
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.25}
                sx={{ minWidth: 0, flexWrap: 'wrap', gap: 0.75 }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontSize: '1.15rem',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '180px',
                    color: alpha(theme.palette.text.primary, 0.7),
                    lineHeight: 1
                  }}
                >
                  {user}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <CompactTags maxTags={4} />
                </Box>

                <CompactSocialLinks />
              </Stack>

              {/* Ultra Compact Stats Row - Desktop */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  flexWrap: 'wrap',
                  mt: 0.5
                }}
              >
                {[
                  {
                    label: 'Holders',
                    value: fNumberWithSuffix(holders),
                    color: theme.palette.error.main
                  },
                  {
                    label: 'Offers',
                    value: fNumberWithSuffix(offers),
                    color: theme.palette.warning.main
                  },
                  {
                    label: 'Transactions',
                    value: fNumberWithSuffix(vol24htx),
                    color: theme.palette.secondary.main
                  },
                  {
                    label: 'Trustlines',
                    value: fNumberWithSuffix(trustlines),
                    color: theme.palette.info.main
                  },
                  {
                    label: 'Created',
                    value: (() => {
                      if (date) {
                        return new Date(date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        });
                      }
                      if (dateon) {
                        return new Date(dateon).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        });
                      }
                      return 'N/A';
                    })(),
                    color: theme.palette.success.main
                  }
                ].map((stat, index) => (
                  <Box
                    key={stat.label}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      px: 1.25,
                      py: 0.75,
                      borderRadius: '10px',
                      border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                      background: alpha(theme.palette.background.paper, 0.6),
                      transition: 'all 0.2s ease',

                      '&:hover': {
                        border: `1px solid ${alpha(stat.color, 0.3)}`,
                        background: alpha(stat.color, 0.04),
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color: alpha(theme.palette.text.secondary, 0.8),
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {stat.label}:
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: stat.color
                      }}
                    >
                      {stat.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Stack>
          )}

          {/* Mobile Stats Grid - Enhanced Version */}
          {isMobile && (
            <Stack spacing={0.75} sx={{ width: '100%' }}>
              {/* Primary Stats Row - Always Visible */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: isXsMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                  gap: 0.5,
                  p: 0.75,
                  borderRadius: '10px',
                  background: `linear-gradient(135deg, 
                    ${alpha(theme.palette.background.paper, 0.8)} 0%, 
                    ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                  position: 'relative',
                  overflow: 'hidden',
                  backdropFilter: 'blur(8px)',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `radial-gradient(circle at top right, 
                      ${alpha(theme.palette.primary.main, 0.03)} 0%, 
                      transparent 50%
                    )`,
                    pointerEvents: 'none'
                  }
                }}
              >
                {[
                  {
                    label: 'Market Cap',
                    value: fNumberWithSuffix(convertedMarketCap),
                    color: theme.palette.info.main,
                    gradientFrom: '#2196F3',
                    gradientTo: '#64B5F6'
                  },
                  {
                    label: 'Volume',
                    value: fNumberWithSuffix(vol24hx),
                    color: theme.palette.warning.main,
                    gradientFrom: '#FF9800',
                    gradientTo: '#FFB74D'
                  },
                  {
                    label: 'Holders',
                    value: fNumberWithSuffix(holders),
                    color: theme.palette.error.main,
                    gradientFrom: '#FF1744',
                    gradientTo: '#FF6B6B'
                  },
                  {
                    label: 'TVL',
                    value: (() => {
                      // Calculate TVL estimate based on market cap and trustlines ratio
                      if (!convertedMarketCap || convertedMarketCap === 0) {
                        return '0';
                      }

                      // More sophisticated TVL estimation
                      let tvlEstimate;
                      if (trustlines > 0 && holders > 0) {
                        // Use trustlines to holders ratio as a liquidity indicator
                        const liquidityRatio = Math.min(trustlines / holders, 1);
                        // TVL typically ranges from 10% to 80% of market cap depending on liquidity
                        const tvlPercentage = 0.1 + liquidityRatio * 0.7;
                        tvlEstimate = convertedMarketCap * tvlPercentage;
                      } else {
                        // Default to 20% of market cap for tokens without trustline data
                        tvlEstimate = convertedMarketCap * 0.2;
                      }

                      return fNumberWithSuffix(tvlEstimate);
                    })(),
                    color: theme.palette.success.main,
                    gradientFrom: '#4CAF50',
                    gradientTo: '#81C784'
                  },
                  {
                    label: 'Txns',
                    value: fNumberWithSuffix(vol24htx),
                    color: theme.palette.secondary.main,
                    gradientFrom: '#9C27B0',
                    gradientTo: '#BA68C8'
                  },
                  {
                    label: 'Offers',
                    value: fNumberWithSuffix(offers),
                    color: theme.palette.warning.main,
                    gradientFrom: '#FF9800',
                    gradientTo: '#FFB74D'
                  }
                ]
                  .slice(0, isXsMobile ? 4 : 6)
                  .map((stat, index) => (
                    <Box
                      key={stat.label}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        p: 1.25,
                        borderRadius: '10px',
                        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                        background: alpha(theme.palette.background.paper, 0.6),
                        minHeight: '68px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',

                        '&:hover': {
                          border: `1px solid ${alpha(stat.color, 0.3)}`,
                          background: alpha(stat.color, 0.04),
                          transform: 'translateY(-2px)'
                        },

                        '&:active': {
                          transform: isMobile ? 'scale(0.98)' : 'none'
                        }
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          color: alpha(theme.palette.text.secondary, 0.8),
                          textTransform: 'uppercase',
                          letterSpacing: '0.3px',
                          mb: 0.5
                        }}
                      >
                        {stat.label}:
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          color: stat.color,
                          textShadow: `0 1px 2px ${alpha(stat.color, 0.3)}`
                        }}
                      >
                        {stat.value}
                      </Typography>
                    </Box>
                  ))}
              </Box>

              {/* Secondary Stats - Expandable */}
              <Box
                sx={{
                  borderRadius: '10px',
                  background: `linear-gradient(135deg, 
                    ${alpha(theme.palette.background.paper, 0.6)} 0%, 
                    ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                  overflow: 'hidden'
                }}
              >
                {/* Toggle Button */}
                <Button
                  onClick={() => setShowStat(!showStat)}
                  fullWidth
                  sx={{
                    p: 1,
                    justifyContent: 'space-between',
                    color: theme.palette.text.primary,
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    textTransform: 'none',
                    borderRadius: 0,
                    minHeight: '44px',

                    '&:hover': {
                      background: `linear-gradient(135deg, 
                        ${alpha(theme.palette.primary.main, 0.08)} 0%, 
                        ${alpha(theme.palette.primary.main, 0.04)} 100%)`
                    }
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      {showStat ? 'Hide' : 'Show'} Detailed Stats
                    </Typography>
                  </Stack>
                  <KeyboardArrowRightIcon
                    sx={{
                      width: isMobile ? 14 : 12,
                      height: isMobile ? 14 : 12,
                      color: theme.palette.primary.main
                    }}
                  />
                </Button>

                {/* Expanded Stats */}
                {showStat && (
                  <Box
                    sx={{
                      p: 1,
                      borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      background: `linear-gradient(135deg, 
                        ${alpha(theme.palette.background.paper, 0.4)} 0%, 
                        ${alpha(theme.palette.background.paper, 0.2)} 100%)`,
                      animation: 'fadeInUp 0.3s ease-out',
                      '@keyframes fadeInUp': {
                        '0%': {
                          opacity: 0,
                          transform: 'translateY(-10px)'
                        },
                        '100%': {
                          opacity: 1,
                          transform: 'translateY(0)'
                        }
                      }
                    }}
                  >
                    <Stack spacing={1}>
                      {/* Financial Metrics */}
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: theme.palette.primary.main,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            mb: 1,
                            display: 'block'
                          }}
                        >
                          Financial Metrics
                        </Typography>
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 1
                          }}
                        >
                          {[
                            {
                              label: 'Vol/Market Ratio',
                              value: fNumber(voldivmarket),
                              color: theme.palette.warning.main,
                              tooltip:
                                'Volume to Market Cap ratio - indicates trading activity relative to market size'
                            },
                            {
                              label: 'Circulating Supply',
                              value: fNumberWithSuffix(supply),
                              color: theme.palette.primary.main,
                              tooltip: 'The number of tokens in circulation within the market'
                            },
                            {
                              label: 'Total Supply',
                              value: fNumberWithSuffix(amount),
                              color: theme.palette.success.main,
                              tooltip: 'The total number of tokens that exist'
                            },
                            {
                              label: 'Trustlines',
                              value: fNumberWithSuffix(trustlines),
                              color: theme.palette.info.main,
                              tooltip:
                                'Number of accounts that have established trust lines for this token'
                            },
                            {
                              label: 'TVL Estimate',
                              value: (() => {
                                if (!convertedMarketCap || convertedMarketCap === 0) {
                                  return '0';
                                }

                                let tvlEstimate;
                                if (trustlines > 0 && holders > 0) {
                                  const liquidityRatio = Math.min(trustlines / holders, 1);
                                  const tvlPercentage = 0.1 + liquidityRatio * 0.7;
                                  tvlEstimate = convertedMarketCap * tvlPercentage;
                                } else {
                                  tvlEstimate = convertedMarketCap * 0.2;
                                }

                                return fNumberWithSuffix(tvlEstimate);
                              })(),
                              color: theme.palette.success.main,
                              tooltip:
                                'Estimated Total Value Locked - calculated based on market cap and trustline adoption ratio. Higher trustline-to-holder ratios indicate better liquidity and higher TVL estimates.',
                              gradientFrom: '#4CAF50',
                              gradientTo: '#81C784'
                            },
                            {
                              label: 'Created Date',
                              value: (() => {
                                if (date) {
                                  return new Date(date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  });
                                }
                                if (dateon) {
                                  return new Date(dateon).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  });
                                }
                                return 'N/A';
                              })(),
                              color: theme.palette.secondary.main,
                              tooltip: 'The date when this token was first created or launched',
                              gradientFrom: '#9C27B0',
                              gradientTo: '#BA68C8'
                            }
                          ].map((stat, index) => (
                            <Tooltip key={stat.label} title={stat.tooltip} arrow>
                              <Box
                                sx={{
                                  p: 1,
                                  borderRadius: '12px',
                                  background: `linear-gradient(135deg, ${alpha(
                                    stat.color,
                                    0.08
                                  )} 0%, ${alpha(stat.color, 0.04)} 100%)`,
                                  border: '2px solid transparent',
                                  cursor: 'help',
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  position: 'relative',
                                  overflow: 'hidden',

                                  // Consistent gradient border for all stats
                                  '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    inset: 0,
                                    padding: '2px',
                                    background: `linear-gradient(135deg, ${stat.gradientFrom}, ${stat.gradientTo})`,
                                    borderRadius: '12px',
                                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                    maskComposite: 'subtract',
                                    WebkitMask:
                                      'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                    WebkitMaskComposite: 'xor',
                                    zIndex: -1
                                  },

                                  // Subtle glow effect
                                  '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    inset: 0,
                                    background: `radial-gradient(circle at center, ${alpha(
                                      stat.color,
                                      0.15
                                    )} 0%, transparent 70%)`,
                                    borderRadius: '12px',
                                    opacity: 0.6,
                                    zIndex: -1
                                  },

                                  '&:hover': {
                                    background: `linear-gradient(135deg, ${alpha(
                                      stat.color,
                                      0.15
                                    )} 0%, ${alpha(stat.color, 0.08)} 100%)`,
                                    transform: 'translateY(-2px) scale(1.02)',
                                    boxShadow: `
                                      0 6px 20px ${alpha(stat.color, 0.25)},
                                      0 0 0 1px ${alpha(stat.color, 0.1)},
                                      inset 0 1px 0 ${alpha('#fff', 0.1)}
                                    `,

                                    '&::before': {
                                      padding: '3px',
                                      background: `linear-gradient(135deg, ${stat.gradientFrom}, ${stat.gradientTo}, ${stat.gradientFrom})`
                                    },

                                    '&::after': {
                                      opacity: 1
                                    }
                                  }
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontSize: '0.7rem',
                                    fontWeight: 500,
                                    color: alpha(theme.palette.text.secondary, 0.8),
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.2px',
                                    display: 'block',
                                    mb: 0.5,
                                    lineHeight: 1
                                  }}
                                >
                                  {stat.label}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    color: stat.color,
                                    lineHeight: 1,
                                    wordBreak: 'break-all'
                                  }}
                                >
                                  {stat.value}
                                </Typography>
                              </Box>
                            </Tooltip>
                          ))}
                        </Box>
                      </Box>

                      {/* Network Activity */}
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: theme.palette.success.main,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            mb: 1,
                            display: 'block'
                          }}
                        >
                          Network Activity
                        </Typography>
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 1
                          }}
                        >
                          {[
                            {
                              label: 'Active Holders',
                              value: fNumberWithSuffix(holders),
                              color: theme.palette.error.main,
                              percentage: holders > 0 ? '100%' : '0%'
                            },
                            {
                              label: 'Open Offers',
                              value: fNumberWithSuffix(offers),
                              color: theme.palette.warning.main,
                              percentage:
                                offers > 0
                                  ? Math.min((offers / holders) * 100, 100).toFixed(1) + '%'
                                  : '0%'
                            },
                            {
                              label: '24h Transactions',
                              value: fNumberWithSuffix(vol24htx),
                              color: theme.palette.secondary.main,
                              percentage: vol24htx > 0 ? 'Active' : 'Inactive'
                            }
                          ].map((stat, index) => (
                            <Box
                              key={stat.label}
                              sx={{
                                p: 1.25,
                                borderRadius: '10px',
                                border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                background: alpha(theme.palette.background.paper, 0.6),
                                transition: 'all 0.2s ease',

                                '&:hover': {
                                  border: `1px solid ${alpha(stat.color, 0.3)}`,
                                  background: alpha(stat.color, 0.04),
                                  transform: 'translateY(-1px)'
                                }
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '0.8rem',
                                  fontWeight: 500,
                                  color: alpha(theme.palette.text.secondary, 0.8),
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.2px',
                                  display: 'block',
                                  mb: 0.5,
                                  lineHeight: 1
                                }}
                              >
                                {stat.label}:
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '0.9rem',
                                  fontWeight: 600,
                                  color: stat.color
                                }}
                              >
                                {stat.value}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    </Stack>
                  </Box>
                )}
              </Box>
            </Stack>
          )}
        </Stack>

        {/* Desktop Actions */}
        {!isMobile && (
          <Stack direction="row" spacing={0.75} alignItems="flex-start">
            <Watch token={token} />
            <Share token={token} />
          </Stack>
        )}
      </Stack>

      {/* Mobile Price & Extra Buttons */}
      {isTablet && (
        <Stack direction="column" spacing={0.75} sx={{ width: '100%', mt: 0.5 }}>
          <Box sx={{ width: '100%' }}>
            <PriceDesc token={token} />
          </Box>
          <Box sx={{ width: '100%' }}>
            <ExtraButtons token={token} />
          </Box>
        </Stack>
      )}

      {/* Mobile Expanded Stats - Only for detailed view */}
      {isMobile && (
        <Box
          sx={{
            borderRadius: '8px',
            background: `linear-gradient(135deg, 
              ${alpha(theme.palette.background.paper, 0.6)} 0%, 
              ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            overflow: 'hidden'
          }}
        >
          {/* Toggle Button */}
          <Button
            onClick={() => setShowStat(!showStat)}
            fullWidth
            sx={{
              p: 1,
              justifyContent: 'space-between',
              color: theme.palette.text.primary,
              fontWeight: 500,
              fontSize: '0.75rem',
              textTransform: 'none',
              borderRadius: 0,
              minHeight: '44px',

              '&:hover': {
                background: `linear-gradient(135deg, 
                  ${alpha(theme.palette.primary.main, 0.08)} 0%, 
                  ${alpha(theme.palette.primary.main, 0.04)} 100%)`
              }
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                {showStat ? 'Hide' : 'Show'} Market Stats
              </Typography>
            </Stack>
            <KeyboardArrowRightIcon
              sx={{
                width: 14,
                height: 14,
                color: theme.palette.primary.main,
                transform: showStat ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
            />
          </Button>

          {/* Expanded Stats */}
          {showStat && (
            <Box
              sx={{
                p: 1,
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                background: `linear-gradient(135deg, 
                  ${alpha(theme.palette.background.paper, 0.4)} 0%, 
                  ${alpha(theme.palette.background.paper, 0.2)} 100%)`,
                animation: 'fadeInUp 0.3s ease-out',
                '@keyframes fadeInUp': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateY(-10px)'
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateY(0)'
                  }
                }
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 0.75
                }}
              >
                {[
                  {
                    label: 'Market Cap',
                    value: fNumberWithSuffix(convertedMarketCap),
                    color: theme.palette.info.main
                  },
                  {
                    label: 'Volume (24h)',
                    value: fNumberWithSuffix(vol24hx),
                    color: theme.palette.warning.main
                  },
                  {
                    label: 'Vol/Market Ratio',
                    value: fNumber(voldivmarket),
                    color: theme.palette.warning.main
                  },
                  {
                    label: 'Circulating Supply',
                    value: fNumberWithSuffix(supply),
                    color: theme.palette.primary.main
                  },
                  {
                    label: 'Total Supply',
                    value: fNumberWithSuffix(amount),
                    color: theme.palette.success.main
                  },
                  {
                    label: 'Trustlines',
                    value: fNumberWithSuffix(trustlines),
                    color: theme.palette.info.main
                  }
                ].map((stat, index) => (
                  <Box
                    key={stat.label}
                    sx={{
                      p: 1,
                      borderRadius: '8px',
                      background: `linear-gradient(135deg, 
                        ${alpha(stat.color, 0.06)} 0%, 
                        ${alpha(stat.color, 0.02)} 100%)`,
                      border: `1px solid ${alpha(stat.color, 0.1)}`,
                      transition: 'all 0.2s ease',

                      '&:hover': {
                        background: `linear-gradient(135deg, 
                          ${alpha(stat.color, 0.1)} 0%, 
                          ${alpha(stat.color, 0.04)} 100%)`,
                        border: `1px solid ${alpha(stat.color, 0.15)}`,
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        color: alpha(theme.palette.text.secondary, 0.8),
                        textTransform: 'uppercase',
                        letterSpacing: '0.2px',
                        display: 'block',
                        mb: 0.5,
                        lineHeight: 1
                      }}
                    >
                      {stat.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: stat.color,
                        lineHeight: 1,
                        wordBreak: 'break-all'
                      }}
                    >
                      {stat.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      <TagsDrawer
        isOpen={openTagsDrawer}
        toggleDrawer={toggleTagsDrawer}
        tags={enhancedTags}
        normalizeTag={normalizeTag}
        md5={md5}
      />

      <LinksDrawer
        isOpen={openLinksDrawer}
        toggleDrawer={toggleLinksDrawer}
        token={token}
        getFullUrl={getFullUrl}
      />

      <Dialog
        open={openScamWarning}
        onClose={() => setOpenScamWarning(false)}
        aria-labelledby="scam-warning-dialog"
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            maxWidth: '480px',
            border: '3px solid #ff1744',
            borderRadius: '20px',
            background: `linear-gradient(135deg, 
              ${alpha(theme.palette.background.paper, 0.98)} 0%, 
              ${alpha(theme.palette.background.paper, 0.95)} 50%,
              ${alpha('#ff1744', 0.02)} 100%)`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #ff1744, #ff5722, #ff9800, #ff5722, #ff1744)',
              backgroundSize: '200% 100%'
            }
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: alpha('#000', 0.7)
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
            p: 3,
            pb: 2,
            background: `linear-gradient(135deg, 
              ${alpha('#ff1744', 0.08)} 0%, 
              ${alpha('#ff1744', 0.04)} 50%,
              transparent 100%)`,
            borderBottom: `1px solid ${alpha('#ff1744', 0.15)}`,
            position: 'relative'
          }}
        >
          {/* Animated Warning Icon */}
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: `linear-gradient(135deg, 
                ${alpha('#ff1744', 0.15)} 0%, 
                ${alpha('#ff1744', 0.08)} 100%)`,
              border: `2px solid ${alpha('#ff1744', 0.3)}`
            }}
          >
            <WarningIcon
              sx={{
                color: '#ff1744',
                width: 32,
                height: 32,
                filter: 'drop-shadow(0 2px 4px rgba(255, 23, 68, 0.3))'
              }}
            />
          </Box>

          {/* Title with gradient text */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                fontSize: '1.75rem',
                background: 'linear-gradient(135deg, #ff1744 0%, #ff5722 50%, #ff9800 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: `0 2px 8px ${alpha('#ff1744', 0.3)}`,
                letterSpacing: '-0.02em',
                mb: 0.5
              }}
            >
              ⚠️ SCAM ALERT ⚠️
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                color: alpha(theme.palette.error.main, 0.8),
                fontWeight: 600,
                fontSize: '0.95rem'
              }}
            >
              High Risk Token Detected
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 2 }}>
          {/* Main warning message */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: '12px',
              background: `linear-gradient(135deg, 
                ${alpha('#ff1744', 0.06)} 0%, 
                ${alpha('#ff1744', 0.02)} 100%)`,
              border: `1px solid ${alpha('#ff1744', 0.15)}`,
              mb: 2.5
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 600,
                fontSize: '1rem',
                lineHeight: 1.6,
                textAlign: 'center',
                mb: 1
              }}
            >
              This token has been flagged as a potential{' '}
              <strong style={{ color: '#ff1744' }}>SCAM</strong>.
              <br />
              Proceed with extreme caution!
            </Typography>
          </Box>

          {/* Safety guidelines */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: '12px',
              background: `linear-gradient(135deg, 
                ${alpha(theme.palette.background.paper, 0.8)} 0%, 
                ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
              border: `1px solid ${alpha(theme.palette.divider, 0.15)}`
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 700,
                fontSize: '1rem',
                mb: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.primary.main})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography sx={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  !
                </Typography>
              </Box>
              Safety Guidelines
            </Typography>

            <Stack spacing={1.5}>
              {[
                { icon: '🚫', text: 'Never invest more than you can lose' },
                { icon: '🔐', text: 'Never share private keys' },
                { icon: '🌐', text: 'Avoid suspicious websites' },
                { icon: '🔍', text: 'Always do your own research' },
                { icon: '⚡', text: 'Beware of guaranteed returns' }
              ].map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    p: 1,
                    borderRadius: '8px',
                    background: alpha(theme.palette.background.paper, 0.5),
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,

                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.04),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
                    }
                  }}
                >
                  <Typography sx={{ fontSize: '1.1rem', lineHeight: 1 }}>{item.icon}</Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      lineHeight: 1.5
                    }}
                  >
                    {item.text}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: 3,
            pt: 1,
            display: 'flex',
            gap: 1.5,
            justifyContent: 'center'
          }}
        >
          <Button
            onClick={() => setOpenScamWarning(false)}
            variant="contained"
            size="large"
            sx={{
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '1rem',
              px: 4,
              py: 1.5,
              minWidth: '200px',
              background: 'linear-gradient(135deg, #ff1744 0%, #d32f2f 100%)',

              '&:hover': {
                background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)'
              },
              '&:active': {}
            }}
          >
            I Understand the Risks
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openHighRiskWarning}
        onClose={() => setOpenHighRiskWarning(false)}
        aria-labelledby="high-risk-warning-dialog"
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            maxWidth: '480px',
            border: '3px solid #ff9800',
            borderRadius: '20px',
            background: `linear-gradient(135deg, 
              ${alpha(theme.palette.background.paper, 0.98)} 0%, 
              ${alpha(theme.palette.background.paper, 0.95)} 50%,
              ${alpha('#ff9800', 0.02)} 100%)`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #ff9800, #ffc107, #ffeb3b, #ffc107, #ff9800)',
              backgroundSize: '200% 100%'
            }
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: alpha('#000', 0.7)
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
            p: 3,
            pb: 2,
            background: `linear-gradient(135deg, 
              ${alpha('#ff9800', 0.08)} 0%, 
              ${alpha('#ff9800', 0.04)} 50%,
              transparent 100%)`,
            borderBottom: `1px solid ${alpha('#ff9800', 0.15)}`,
            position: 'relative'
          }}
        >
          {/* Animated Warning Icon */}
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: `linear-gradient(135deg, 
                ${alpha('#ff9800', 0.15)} 0%, 
                ${alpha('#ff9800', 0.08)} 100%)`,
              border: `2px solid ${alpha('#ff9800', 0.3)}`
            }}
          >
            <WarningIcon
              sx={{
                color: '#ff9800',
                width: 32,
                height: 32,
                filter: 'drop-shadow(0 2px 4px rgba(255, 152, 0, 0.3))'
              }}
            />
          </Box>

          {/* Title with gradient text */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                fontSize: '1.75rem',
                background: 'linear-gradient(135deg, #ff9800 0%, #ffc107 50%, #ffeb3b 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: `0 2px 8px ${alpha('#ff9800', 0.3)}`,
                letterSpacing: '-0.02em',
                mb: 0.5
              }}
            >
              ⚠️ HIGH RISK ⚠️
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                color: alpha(theme.palette.warning.main, 0.8),
                fontWeight: 600,
                fontSize: '0.95rem'
              }}
            >
              High Risk Investment Detected
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 2 }}>
          {/* Main warning message */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: '12px',
              background: `linear-gradient(135deg, 
                ${alpha('#ff9800', 0.06)} 0%, 
                ${alpha('#ff9800', 0.02)} 100%)`,
              border: `1px solid ${alpha('#ff9800', 0.15)}`,
              mb: 2.5
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 600,
                fontSize: '1rem',
                lineHeight: 1.6,
                textAlign: 'center',
                mb: 1
              }}
            >
              This token has been classified as{' '}
              <strong style={{ color: '#ff9800' }}>HIGH RISK</strong>.
              <br />
              Exercise extreme caution before investing!
            </Typography>
          </Box>

          {/* Risk factors */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: '12px',
              background: `linear-gradient(135deg, 
                ${alpha(theme.palette.background.paper, 0.8)} 0%, 
                ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
              border: `1px solid ${alpha(theme.palette.divider, 0.15)}`
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 700,
                fontSize: '1rem',
                mb: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.error.main})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography sx={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  !
                </Typography>
              </Box>
              Risk Factors
            </Typography>

            <Stack spacing={1.5}>
              {[
                { icon: '📉', text: 'High volatility and price swings' },
                { icon: '💸', text: 'Potential for significant losses' },
                { icon: '🔍', text: 'Limited or unverified project information' },
                { icon: '⏰', text: 'New or experimental token' },
                { icon: '🎯', text: 'Speculative investment nature' }
              ].map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    p: 1,
                    borderRadius: '8px',
                    background: alpha(theme.palette.background.paper, 0.5),
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,

                    '&:hover': {
                      background: alpha(theme.palette.warning.main, 0.04),
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`
                    }
                  }}
                >
                  <Typography sx={{ fontSize: '1.1rem', lineHeight: 1 }}>{item.icon}</Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      lineHeight: 1.5
                    }}
                  >
                    {item.text}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: 3,
            pt: 1,
            display: 'flex',
            gap: 1.5,
            justifyContent: 'center'
          }}
        >
          <Button
            onClick={() => setOpenHighRiskWarning(false)}
            variant="contained"
            size="large"
            sx={{
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '1rem',
              px: 4,
              py: 1.5,
              minWidth: '200px',
              background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',

              '&:hover': {
                background: 'linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)'
              },
              '&:active': {}
            }}
          >
            I Acknowledge the Risks
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openLedgerMemeWarning}
        onClose={() => setOpenLedgerMemeWarning(false)}
        aria-labelledby="ledgermeme-warning-dialog"
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            maxWidth: '400px',
            border: `2px solid ${theme.palette.info.main}`,
            borderRadius: '12px',
            background: theme.palette.background.paper
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: theme.palette.info.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}
          >
            <LedgerMemeIcon sx={{ fontSize: '24px' }} />
            LedgerMeme Token
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ textAlign: 'center', py: 2 }}>
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 500,
              lineHeight: 1.5,
              mb: 1.5
            }}
          >
            This token has yet to graduated from LedgerMeme and a liquidity pool has not been
            deployed on-chain.
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 400,
              lineHeight: 1.4
            }}
          >
            You can trade this token off-chain at{' '}
            <Link
              href={`https://ledger.meme/${issuer}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: theme.palette.info.main,
                fontWeight: 600,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              Ledger.Meme
            </Link>
          </Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            onClick={() => setOpenLedgerMemeWarning(false)}
            variant="contained"
            sx={{
              borderRadius: '8px',
              fontWeight: 600,
              px: 3,
              background: theme.palette.info.main,
              '&:hover': {
                background: theme.palette.info.dark
              }
            }}
          >
            Understood
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
