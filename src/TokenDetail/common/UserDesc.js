import { useState, useContext, useEffect } from 'react';
import React from 'react';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';

import { CopyToClipboard } from 'react-copy-to-clipboard';
import { LazyLoadImage } from 'react-lazy-load-image-component';

// Material
import { withStyles } from '@mui/styles';
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
        border-radius: 22px;
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

// Add XPMarket icon component
const XPMarketIcon = React.forwardRef((props, ref) => {
  // Remove any width="auto" that might be in props
  const { width, ...otherProps } = props;

  return (
    <SvgIcon
      {...otherProps}
      ref={ref}
      viewBox="0 0 36 36"
      sx={{ borderRadius: '50%', ...otherProps.sx }}
    >
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

const LedgerMemeIcon = React.forwardRef((props, ref) => (
  <SvgIcon {...props} ref={ref} viewBox="0 0 56 56" sx={{ borderRadius: '50%', ...props.sx }}>
    <circle
      cx="26"
      cy="26"
      r="26"
      fill="rgba(207, 255, 4, 0.2)"
      stroke="rgba(207, 255, 4, 0.4)"
      strokeWidth="1"
    />
    <g transform="translate(8, 8) scale(0.75)">
      <rect fill="#cfff04" width="36" height="36" rx="8" ry="8" x="0" y="0"></rect>
      <g>
        <g>
          <path
            fill="#262626"
            d="M25.74,9.68c0.64,0,1.24-0.26,1.69-0.72l2.69-2.76h-1.64l-1.87,1.92c-0.23,0.24-0.55,0.37-0.88,0.37s-0.64-0.13-0.88-0.37l-1.87-1.92h-1.64l2.69,2.76c0.45,0.46,1.05,0.72,1.69,0.72Z"
          ></path>
          <path
            fill="#262626"
            d="M27.43,10.62c-0.45-0.46-1.05-0.72-1.69-0.72s-1.24,0.26-1.69,0.72l-2.71,2.78h1.64l1.89-1.93c0.23-0.24,0.55-0.37,0.88-0.37s0.64,0.13,0.88,0.37l1.89,1.93h1.64l-2.71-2.78Z"
          ></path>
          <path
            fill="#262626"
            d="M10.22,9.68c0.64,0,1.24-0.26,1.69-0.72l2.69-2.76h-1.64l-1.87,1.92c-0.23,0.24-0.55,0.37-0.88,0.37s-0.64-0.13-0.88-0.37l-1.87-1.92h-1.64l2.69,2.76c0.45,0.46,1.05,0.72,1.69,0.72Z"
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
));

LedgerMemeIcon.displayName = 'LedgerMemeIcon';

const getOriginIcon = (origin) => {
  switch (origin) {
    case 'FirstLedger':
      return (
        <Box
          sx={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: 'rgba(1, 60, 254, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(1, 60, 254, 0.2)',
            marginRight: '2px',
            marginBottom: '2px'
          }}
        >
          <OpenInNewIcon sx={{ fontSize: '11px', color: '#013CFE' }} />
        </Box>
      );
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
    case 'Magnetic X':
      return (
        <Box
          sx={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden',
            marginRight: '2px',
            marginBottom: '2px'
          }}
        >
          <Box
            component="img"
            src="/magneticx-logo.webp"
            alt="Magnetic X"
            sx={{
              width: '13px',
              height: '13px',
              objectFit: 'contain'
            }}
          />
        </Box>
      );
    case 'xrp.fun':
      return (
        <Box
          sx={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: 'rgba(183, 33, 54, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(183, 33, 54, 0.2)',
            marginRight: '2px',
            marginBottom: '2px'
          }}
        >
          <Icon
            icon={chartLineUp}
            style={{
              fontSize: '11px',
              color: '#B72136'
            }}
          />
        </Box>
      );
    default:
      return (
        <Box
          sx={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: 'rgba(99, 115, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(99, 115, 129, 0.2)',
            marginRight: '2px',
            marginBottom: '2px'
          }}
        >
          <AutoAwesomeIcon sx={{ fontSize: '11px', color: '#637381' }} />
        </Box>
      );
  }
};

// ----------------------------------------------------------------------

const TagsSection = ({ tags, md5, normalizeTag, theme, handleDelete, toggleTagsDrawer }) => {
  const [expanded, setExpanded] = useState(false);

  if (!tags || tags.length === 0) return null;

  const maxVisibleTags = 8; // Increased since chips are smaller now
  const shouldUseVerticalLayout = tags.length > 8;
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
            height: '22px',
            fontSize: '0.65rem',
            borderRadius: '4px',
            px: 1,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.08
            )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            color: theme.palette.primary.main,
            fontWeight: 500,

            '&:hover': {
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.12
              )} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`
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
          label={tag}
          onClick={handleDelete}
          sx={{
            height: '22px',
            fontSize: '0.65rem',
            borderRadius: '4px',
            px: 1,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.8
            )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
            border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
            color: theme.palette.text.primary,
            fontWeight: 500,

            '&:hover': {
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.08
              )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              color: theme.palette.primary.main
            }
          }}
        />
      </Link>
    );
  };

  if (shouldUseVerticalLayout) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.625, width: '100%' }}>
        {/* Primary row */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.375, width: '100%' }}>
          {tags.slice(0, 6).map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
          {hasMore && !expanded && <TagChip tag={`+${tags.length - 6} more`} isExpand={true} />}
        </Box>

        {/* Additional rows when expanded */}
        {expanded && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.625, mt: 0.25 }}>
            {/* Split remaining tags into rows of 6 */}
            {Array.from({ length: Math.ceil((tags.length - 6) / 6) }, (_, rowIndex) => (
              <Box
                key={rowIndex}
                sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.375, width: '100%' }}
              >
                {tags.slice(6 + rowIndex * 6, 6 + (rowIndex + 1) * 6).map((tag) => (
                  <TagChip key={tag} tag={tag} />
                ))}
              </Box>
            ))}
            {/* Show less button */}
            <Box sx={{ display: 'flex', gap: 0.375 }}>
              <TagChip tag="Show less" isExpand={true} />
            </Box>
          </Box>
        )}
      </Box>
    );
  }

  // Standard horizontal layout for fewer tags
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.375, width: '100%' }}>
      {tags.slice(0, maxVisibleTags).map((tag) => (
        <TagChip key={tag} tag={tag} />
      ))}
      {hasMore && (
        <Chip
          label={`+${tags.length - maxVisibleTags}`}
          size="small"
          onClick={() => toggleTagsDrawer(true)}
          sx={{
            height: '22px',
            fontSize: '0.65rem',
            borderRadius: '4px',
            px: 1,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.08
            )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            color: theme.palette.primary.main,
            fontWeight: 500,
            cursor: 'pointer'
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
    kyc,
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

  const statsData = [
    {
      label: 'Market Cap',
      value: `${currencySymbols[activeFiatCurrency]} ${fNumber(convertedMarketCap)}`,
      color: theme.palette.info.main
    },
    {
      label: 'Volume (24h)',
      value: volume,
      color: theme.palette.warning.main,
      subValue: `${name}`
    },
    { label: 'Vol/Market', value: fNumber(voldivmarket), color: theme.palette.warning.main },
    { label: 'Circ. Supply', value: circulatingSupply, color: theme.palette.primary.main },
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

  return (
    <Stack
      spacing={1.25}
      sx={{
        p: 2,
        borderRadius: '12px',
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.background.paper, 0.95)} 0%, 
          ${alpha(theme.palette.background.paper, 0.85)} 50%,
          ${alpha(theme.palette.background.paper, 0.75)} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(8px)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.4)}, ${alpha(
            theme.palette.success.main,
            0.4
          )}, ${alpha(theme.palette.info.main, 0.4)})`,
          opacity: 0.6
        },
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
      <Stack direction="row" spacing={1.5} alignItems="flex-start" justifyContent="space-between">
        {/* Left Section - Token Info */}
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
          {/* Compact Avatar */}
          {isAdmin ? (
            <div>
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
                    width: '90px',
                    height: '90px'
                  }}
                  onClick={() => setEditToken(token)}
                >
                  <EditIcon sx={{ width: 40, height: 40 }} />
                </IconButton>
                <ImageBackdrop className="MuiImageBackdrop-root" />
                {kyc && (
                  <KYCBadge>
                    <Tooltip title="KYC Verified">
                      <CheckCircleIcon sx={{ color: '#00AB55', fontSize: 26 }} />
                    </Tooltip>
                  </KYCBadge>
                )}
              </IconCover>
            </div>
          ) : (
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Avatar
                alt={`${user} ${name} Logo`}
                src={imgUrl}
                sx={{
                  width: 90,
                  height: 90,
                  borderRadius: '22px',
                  border: `3px solid ${alpha(theme.palette.primary.main, 0.15)}`
                }}
              />
              {kyc && (
                <KYCBadge>
                  <Tooltip title="KYC Verified">
                    <CheckCircleIcon
                      sx={{
                        color: '#00AB55',
                        fontSize: 26,
                        filter: 'drop-shadow(0 2px 4px rgba(0, 171, 85, 0.3))'
                      }}
                    />
                  </Tooltip>
                </KYCBadge>
              )}
            </Box>
          )}

          {/* Token Details */}
          <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
            {/* Name and Rank Row */}
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  fontSize: '1.35rem',
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
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '240px'
                }}
              >
                {name}
              </Typography>

              <Tooltip title={`Rank by 24h Volume: #${id}`}>
                <Chip
                  label={`#${id}`}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{
                    borderRadius: '8px',
                    height: '28px',
                    fontSize: '0.8rem',
                    background: `linear-gradient(135deg, 
                      ${alpha(theme.palette.primary.main, 0.12)} 0%, 
                      ${alpha(theme.palette.primary.main, 0.06)} 100%
                    )`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    fontWeight: 600,
                    px: 1.25,
                    minWidth: 'auto'
                  }}
                />
              </Tooltip>
            </Stack>

            {/* User and Badges Row */}
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '160px',
                  color: alpha(theme.palette.text.primary, 0.7)
                }}
              >
                {user}
              </Typography>

              {/* Compact Badges */}
              <Stack direction="row" spacing={0.625} alignItems="center">
                <Box
                  sx={{
                    p: 0.625,
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, 
                      ${alpha(theme.palette.primary.main, 0.12)} 0%, 
                      ${alpha(theme.palette.primary.main, 0.06)} 100%
                    )`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Tooltip title={token.origin || 'Standard Launch'}>
                    <Box sx={{ fontSize: '18px', display: 'flex' }}>
                      {getOriginIcon(token.origin)}
                    </Box>
                  </Tooltip>
                </Box>
                {token.origin && (
                  <>
                    <Box
                      sx={{
                        p: 0.625,
                        borderRadius: '8px',
                        background: `linear-gradient(135deg, 
                          ${alpha(theme.palette.success.main, 0.12)} 0%, 
                          ${alpha(theme.palette.success.main, 0.06)} 100%
                        )`,
                        border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Tooltip title="Blackholed Issuer">
                        <LockIcon sx={{ fontSize: '18px', color: theme.palette.success.main }} />
                      </Tooltip>
                    </Box>
                    <Box
                      sx={{
                        p: 0.625,
                        borderRadius: '8px',
                        background: `linear-gradient(135deg, 
                          ${alpha(theme.palette.error.main, 0.12)} 0%, 
                          ${alpha(theme.palette.error.main, 0.06)} 100%
                        )`,
                        border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Tooltip title="Burned Liquidity Pool">
                        <LocalFireDepartmentIcon sx={{ fontSize: '18px', color: '#1890FF' }} />
                      </Tooltip>
                    </Box>
                  </>
                )}
              </Stack>
            </Stack>

            {/* Compact Stats Row */}
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
              ].map((stat, index) => (
                <Box key={stat.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      color: alpha(theme.palette.text.secondary, 0.8),
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px'
                    }}
                  >
                    {stat.label}:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.75rem',
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
        </Stack>

        {/* Right Section - Actions */}
        <Stack direction="row" spacing={0.5} alignItems="flex-start">
          <Watch token={token} />
          <Share token={token} />
        </Stack>
      </Stack>

      {/* Mobile Price & Extra Buttons */}
      {isTablet && (
        <Stack direction="row" spacing={0.625} sx={{ width: '100%' }}>
          <Box sx={{ flex: 1 }}>
            <PriceDesc token={token} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <ExtraButtons token={token} />
          </Box>
        </Stack>
      )}

      {/* Expandable Stats Section for Mobile */}
      {isTablet && showStat && (
        <Box
          sx={{
            p: 0.75,
            borderRadius: '6px',
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.6
            )} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 0.75
            }}
          >
            {statsData.map((stat, index) => (
              <Stack
                key={stat.label}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Stack direction="row" alignItems="center" gap={0.25}>
                  <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.55rem' }}>
                    {stat.label}
                  </Typography>
                  {stat.label === 'Market Cap' && (
                    <Tooltip
                      title={
                        <Typography variant="body2">
                          The total market value of a token's circulating supply represents its
                          overall worth.
                        </Typography>
                      }
                    >
                      <Icon icon={infoFilled} width={6} height={6} />
                    </Tooltip>
                  )}
                  {stat.label === 'Volume (24h)' && (
                    <Tooltip
                      title={
                        <Typography variant="body2">
                          Trading volume of {name} within the past 24 hours.
                        </Typography>
                      }
                    >
                      <Icon icon={infoFilled} width={6} height={6} />
                    </Tooltip>
                  )}
                  {stat.label === 'Vol/Market' && (
                    <Tooltip
                      title={
                        <Typography variant="body2">
                          Volume to Market Cap ratio - indicates trading activity relative to market
                          size.
                        </Typography>
                      }
                    >
                      <Icon icon={infoFilled} width={6} height={6} />
                    </Tooltip>
                  )}
                  {stat.label === 'Circ. Supply' && (
                    <Tooltip
                      title={
                        <Typography variant="body2">
                          The number of tokens in circulation within the market.
                        </Typography>
                      }
                    >
                      <Icon icon={infoFilled} width={6} height={6} />
                    </Tooltip>
                  )}
                  {stat.label === 'Created' && (
                    <Tooltip
                      title={
                        <Typography variant="body2">
                          The date when this token was first created or launched.
                        </Typography>
                      }
                    >
                      <Icon icon={infoFilled} width={6} height={6} />
                    </Tooltip>
                  )}
                </Stack>
                <Box
                  sx={{
                    px: 0.375,
                    py: 0.125,
                    borderRadius: '2px',
                    background: `linear-gradient(135deg, ${alpha(stat.color, 0.08)} 0%, ${alpha(
                      stat.color,
                      0.04
                    )} 100%)`,
                    border: `1px solid ${alpha(stat.color, 0.08)}`
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: stat.color, fontWeight: 600, fontSize: '0.55rem' }}
                  >
                    {stat.value}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Box>
        </Box>
      )}

      {/* Stats Toggle Button */}
      {isTablet && (
        <Button
          color="inherit"
          onClick={() => setShowStat(!showStat)}
          size="small"
          sx={{
            width: '100%',
            borderRadius: '4px',
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.8
            )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
            color: theme.palette.primary.main,
            fontWeight: 500,
            fontSize: '0.65rem',
            py: 0.25,
            minHeight: '28px',
            '&:hover': {
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.12
              )} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`
            }
          }}
        >
          {`${!showStat ? 'More' : 'Less'} stats`}
        </Button>
      )}

      {/* Compact Tags & Links Section */}
      <Stack spacing={0.75} sx={{ width: '100%' }}>
        {/* Tags */}
        {enhancedTags && enhancedTags.length > 0 && (
          <Box sx={{ width: '100%' }}>
            {!isTablet ? (
              <TagsSection
                tags={enhancedTags}
                md5={md5}
                normalizeTag={normalizeTag}
                theme={theme}
                handleDelete={handleDelete}
                toggleTagsDrawer={toggleTagsDrawer}
              />
            ) : (
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.65rem' }}>
                  Tags
                </Typography>
                <Box display="flex" alignItems="center" onClick={() => toggleTagsDrawer(true)}>
                  {enhancedTags &&
                    enhancedTags.slice(0, 2).map((tag) => (
                      <Chip
                        key={`${md5}-${tag}`}
                        label={tag}
                        size="small"
                        sx={{
                          height: '22px',
                          fontSize: '0.65rem',
                          borderRadius: '5px',
                          px: 1,
                          background: `linear-gradient(135deg, ${alpha(
                            theme.palette.background.paper,
                            0.6
                          )} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
                          border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                          fontWeight: 500,
                          mr: 0.375
                        }}
                      />
                    ))}
                  {enhancedTags && enhancedTags.length > 2 && (
                    <Chip
                      label={`+${enhancedTags.slice(2).length}`}
                      size="small"
                      sx={{
                        height: '22px',
                        fontSize: '0.65rem',
                        borderRadius: '5px',
                        px: 1,
                        background: `linear-gradient(135deg, ${alpha(
                          theme.palette.primary.main,
                          0.08
                        )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                        color: theme.palette.primary.main,
                        fontWeight: 500,
                        mr: 0.375
                      }}
                    />
                  )}
                  <KeyboardArrowRightIcon
                    sx={{
                      width: 12,
                      height: 12,
                      color: theme.palette.primary.main
                    }}
                  />
                </Box>
              </Stack>
            )}
          </Box>
        )}

        {/* Links */}
        {(domain || issuer || isChat || isCommunity) && (
          <Box sx={{ width: '100%' }}>
            {!isTablet ? (
              <Stack
                direction="row"
                spacing={0.375}
                flexWrap="wrap"
                useFlexGap
                sx={{ alignItems: 'flex-start' }}
              >
                {domain && (
                  <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://${domain}`}
                    rel="noreferrer noopener nofollow"
                  >
                    <Chip
                      label={domain}
                      size="small"
                      sx={{
                        height: '20px',
                        fontSize: '0.6rem',
                        borderRadius: '4px',
                        background: `linear-gradient(135deg, ${alpha(
                          theme.palette.background.paper,
                          0.8
                        )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                        color: theme.palette.primary.main,
                        fontWeight: 500,

                        '&:hover': {
                          background: `linear-gradient(135deg, ${alpha(
                            theme.palette.primary.main,
                            0.08
                          )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
                        }
                      }}
                      deleteIcon={
                        <Icon
                          icon={linkExternal}
                          width="7"
                          height="7"
                          style={{ color: theme.palette.primary.main }}
                        />
                      }
                      onDelete={handleDelete}
                      onClick={handleDelete}
                      icon={<Icon icon={link45deg} width="7" height="7" />}
                    />
                  </Link>
                )}
                <SocialLinksMenu token={token} issuer={issuer} />
              </Stack>
            ) : (
              <Box
                display="flex"
                alignItems="center"
                onClick={() => toggleLinksDrawer(true)}
                sx={{
                  cursor: 'pointer',
                  p: 0.375,
                  borderRadius: '5px',
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.background.paper,
                    0.6
                  )} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,

                  '&:hover': {
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.primary.main,
                      0.08
                    )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
                  }
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontSize: '0.6rem', color: theme.palette.text.secondary, mr: 0.375 }}
                >
                  Links
                </Typography>
                <KeyboardArrowRightIcon
                  sx={{
                    width: 12,
                    height: 12,
                    color: theme.palette.primary.main
                  }}
                />
              </Box>
            )}
          </Box>
        )}
      </Stack>

      <TagsDrawer
        isOpen={openTagsDrawer}
        toggleDrawer={toggleTagsDrawer}
        tags={enhancedTags}
        normalizeTag={normalizeTag}
        md5={md5}
      />

      <LinksDrawer isOpen={openLinksDrawer} toggleDrawer={toggleLinksDrawer} token={token} />

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
    </Stack>
  );
}
