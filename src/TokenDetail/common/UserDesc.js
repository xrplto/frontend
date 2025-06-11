import { useState, useContext, useEffect } from 'react';
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
import ExplorersMenu from './ExplorersMenu';
import CommunityMenu from './CommunityMenu';
import ChatMenu from './ChatMenu';
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
        width: 64px;
        height: 64px;
        border-radius: 16px;
        position: relative;
        overflow: hidden;
        z-index: 1;
        transition: width 1s ease-in-out, height .5s ease-in-out !important;
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
        width: 64px;
        height: 64px;
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
    border-radius: 12px;
  `
);

const ImageBackdrop = styled('span')(({ theme }) => ({
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  backgroundColor: theme.palette.common.white,
  opacity: 0,
  transition: theme.transitions.create('opacity')
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
const XPMarketIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 32 32">
    <path
      d="M17.7872 2.625H4.41504L7.67032 7.88327H14.5L17.9149 13.4089H24.4574L17.7872 2.625Z"
      fill="inherit"
    />
    <path
      d="M1 18.6667L7.67014 29.4506L10.9573 24.1627L7.54248 18.6667L10.9573 13.1708L7.67014 7.88281L1 18.6667Z"
      fill="inherit"
    />
    <path
      d="M24.3292 24.1931L30.9994 13.4092H24.4569L21.042 18.9051H14.2123L10.957 24.1931H24.3292Z"
      fill="inherit"
    />
  </SvgIcon>
);

const LedgerMemeIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 407.1 407.1">
    <g>
      <rect fill="#cfff04" width="407.1" height="407.1" rx="62.91" ry="62.91"></rect>
      <g>
        <g>
          <path
            fill="#262626"
            d="M291.54,109.68c7.23,0,14.03-2.89,19.15-8.13l30.46-31.23h-18.53l-21.19,21.7c-2.66,2.71-6.18,4.21-9.91,4.21s-7.25-1.49-9.91-4.2l-21.17-21.7h-18.54l30.48,31.23c5.12,5.24,11.92,8.13,19.15,8.13Z"
          ></path>
          <path
            fill="#262626"
            d="M310.69,120.24c-5.12-5.24-11.92-8.13-19.15-8.13s-14.03,2.89-19.15,8.13l-30.64,31.4h18.54l21.35-21.87c2.66-2.71,6.18-4.21,9.91-4.21s7.25,1.49,9.91,4.2l21.35,21.87h18.53l-30.64-31.4Z"
          ></path>
          <path
            fill="#262626"
            d="M115.55,109.68c7.23,0,14.03-2.89,19.15-8.13l30.46-31.23h-18.53l-21.19,21.7c-2.66,2.71-6.18,4.21-9.91,4.21s-7.25-1.49-9.91-4.2l-21.17-21.7h-18.54l30.48,31.23c5.12,5.24,11.92,8.13,19.15,8.13Z"
          ></path>
          <path
            fill="#262626"
            d="M115.55,112.12c-7.23,0-14.03,2.89-19.15,8.13l-30.64,31.4h18.53l21.35-21.87c2.66-2.71,6.18,4.21-9.91,4.21s7.25,1.49,9.91,4.2l21.35,21.87h18.53l-30.64-31.4c-5.12-5.24-11.92-8.13-19.15-8.13Z"
          ></path>
        </g>
        <path
          fill="#262626"
          d="M65.76,197c0,76.1,61.69,137.79,137.79,137.79s137.79-61.69,137.79-137.79H65.76Z"
        ></path>
      </g>
    </g>
  </SvgIcon>
);

const getOriginIcon = (origin) => {
  switch (origin) {
    case 'FirstLedger':
      return <OpenInNewIcon sx={{ fontSize: 'inherit', color: '#013CFE' }} />;
    case 'XPMarket':
      return <XPMarketIcon sx={{ fontSize: 'inherit', color: '#6D1FEE' }} />;
    case 'LedgerMeme':
      return <LedgerMemeIcon sx={{ fontSize: 'inherit', width: '14px', height: '14px' }} />;
    case 'Magnetic X':
      return (
        <Box
          component="img"
          src="/magneticx-logo.webp"
          alt="Magnetic X"
          sx={{
            width: '12px',
            height: '12px',
            objectFit: 'contain'
          }}
        />
      );
    case 'xrp.fun':
      return (
        <Icon
          icon={chartLineUp}
          style={{
            fontSize: 'inherit',
            color: '#B72136',
            backgroundColor: '#fff',
            borderRadius: '2px'
          }}
        />
      );
    default:
      return <AutoAwesomeIcon sx={{ fontSize: 'inherit', color: '#637381' }} />;
  }
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
    marketcap,
    vol24hx,
    vol24htx,
    vol24hxrp,
    amount,
    supply
  } = token;

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

  // Move the session initialization useEffect inside the component
  useEffect(() => {
    if (!sessionStorage.getItem('currentSession')) {
      sessionStorage.setItem('currentSession', JSON.stringify({ scamWarnings: [] }));
    }
  }, []);

  // Move the scam warning useEffect inside the component
  useEffect(() => {
    if (tags && tags.some((tag) => tag.toLowerCase() === 'scam') && !hasShownWarningForToken(id)) {
      setOpenScamWarning(true);
      markWarningShownForToken(id);
    }
  }, [tags, id]);

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
    { label: 'Circ. Supply', value: circulatingSupply, color: theme.palette.primary.main }
  ];

  return (
    <Stack
      spacing={1.5}
      sx={{
        p: 1.5,
        borderRadius: '12px',
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.background.paper,
          0.8
        )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
        boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.04)}`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.6)}, ${alpha(
            theme.palette.success.main,
            0.6
          )}, ${alpha(theme.palette.info.main, 0.6)})`,
          opacity: 0.8
        }
      }}
    >
      {editToken && <EditTokenDialog token={editToken} setToken={setEditToken} />}

      <IssuerInfoDialog open={openIssuerInfo} setOpen={setOpenIssuerInfo} token={token} />

      {/* Header Row - Token Info + Actions */}
      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
          {/* Avatar */}
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
                    width: '48px',
                    height: '48px'
                  }}
                  onClick={() => setEditToken(token)}
                >
                  <EditIcon sx={{ width: 24, height: 24 }} />
                </IconButton>
                <ImageBackdrop className="MuiImageBackdrop-root" />
                {kyc && (
                  <KYCBadge>
                    <Tooltip title="KYC Verified">
                      <CheckCircleIcon sx={{ color: '#00AB55', fontSize: 18 }} />
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
                  width: 56,
                  height: 56,
                  borderRadius: '12px',
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                }}
              />
              {kyc && (
                <KYCBadge>
                  <Tooltip title="KYC Verified">
                    <CheckCircleIcon sx={{ color: '#00AB55', fontSize: 18 }} />
                  </Tooltip>
                </KYCBadge>
              )}
            </Box>
          )}

          {/* Token Name & Info */}
          <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography
                variant="h6"
                sx={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2
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
                    borderRadius: '6px',
                    height: '22px',
                    fontSize: '0.7rem',
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.primary.main,
                      0.08
                    )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    fontWeight: 600
                  }}
                />
              </Tooltip>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '120px'
                }}
              >
                {user}
              </Typography>

              {/* Badges Row */}
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Box
                  sx={{
                    p: 0.25,
                    borderRadius: '4px',
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.primary.main,
                      0.08
                    )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Tooltip title={token.origin || 'Standard Launch'}>
                    <Box sx={{ fontSize: '12px', display: 'flex' }}>
                      {getOriginIcon(token.origin)}
                    </Box>
                  </Tooltip>
                </Box>
                {token.origin && (
                  <>
                    <Box
                      sx={{
                        p: 0.25,
                        borderRadius: '4px',
                        background: `linear-gradient(135deg, ${alpha(
                          theme.palette.success.main,
                          0.08
                        )} 0%, ${alpha(theme.palette.success.main, 0.04)} 100%)`,
                        border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Tooltip title="Blackholed Issuer">
                        <LockIcon sx={{ fontSize: '12px', color: theme.palette.success.main }} />
                      </Tooltip>
                    </Box>
                    <Box
                      sx={{
                        p: 0.25,
                        borderRadius: '4px',
                        background: `linear-gradient(135deg, ${alpha(
                          theme.palette.error.main,
                          0.08
                        )} 0%, ${alpha(theme.palette.error.main, 0.04)} 100%)`,
                        border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Tooltip title="Burned Liquidity Pool">
                        <LocalFireDepartmentIcon
                          sx={{ fontSize: '12px', color: theme.palette.error.main }}
                        />
                      </Tooltip>
                    </Box>
                  </>
                )}
              </Stack>
            </Stack>
          </Stack>
        </Stack>

        {/* Action Buttons */}
        <Stack direction="row" spacing={0.5}>
          <Watch token={token} />
          <Share token={token} />
        </Stack>
      </Stack>

      {/* Stats Chips Row */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 0.75,
          width: '100%'
        }}
      >
        <Chip
          label={`${fNumberWithSuffix(holders)} H`}
          color="error"
          variant="outlined"
          size="small"
          sx={{
            borderRadius: '6px',
            height: '28px',
            fontSize: '0.75rem',
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.error.main,
              0.08
            )} 0%, ${alpha(theme.palette.error.main, 0.04)} 100%)`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
            fontWeight: 600
          }}
        />
        <Chip
          label={`${fNumberWithSuffix(offers)} O`}
          color="warning"
          variant="outlined"
          size="small"
          sx={{
            borderRadius: '6px',
            height: '28px',
            fontSize: '0.75rem',
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.warning.main,
              0.08
            )} 0%, ${alpha(theme.palette.warning.main, 0.04)} 100%)`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
            fontWeight: 600
          }}
        />
        <Chip
          label={`${fNumberWithSuffix(vol24htx)} T`}
          color="secondary"
          variant="outlined"
          size="small"
          sx={{
            borderRadius: '6px',
            height: '28px',
            fontSize: '0.75rem',
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.secondary.main,
              0.08
            )} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
            fontWeight: 600
          }}
        />
        <Chip
          label={`${fNumberWithSuffix(trustlines)} TL`}
          color="info"
          variant="outlined"
          size="small"
          sx={{
            borderRadius: '6px',
            height: '28px',
            fontSize: '0.75rem',
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.info.main,
              0.08
            )} 0%, ${alpha(theme.palette.info.main, 0.04)} 100%)`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            fontWeight: 600
          }}
        />
      </Box>

      {/* Mobile Price & Extra Buttons */}
      {isTablet && (
        <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
          <Box sx={{ flex: 1 }}>
            <PriceDesc token={token} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <ExtraButtons token={token} />
          </Box>
        </Stack>
      )}

      {/* Expandable Stats Section */}
      {showStat && (
        <Box
          sx={{
            p: 1.5,
            borderRadius: '8px',
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.6
            )} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
            backdropFilter: 'blur(8px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 1.5
            }}
          >
            {statsData.map((stat, index) => (
              <Stack
                key={stat.label}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
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
                      <Icon icon={infoFilled} width={12} height={12} />
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
                      <Icon icon={infoFilled} width={12} height={12} />
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
                      <Icon icon={infoFilled} width={12} height={12} />
                    </Tooltip>
                  )}
                </Stack>
                <Box
                  sx={{
                    px: 1,
                    py: 0.25,
                    borderRadius: '4px',
                    background: `linear-gradient(135deg, ${alpha(stat.color, 0.08)} 0%, ${alpha(
                      stat.color,
                      0.04
                    )} 100%)`,
                    border: `1px solid ${alpha(stat.color, 0.1)}`
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: stat.color, fontWeight: 600, fontSize: '0.75rem' }}
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
            borderRadius: '6px',
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.8
            )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            color: theme.palette.primary.main,
            fontWeight: 500,
            fontSize: '0.75rem',
            py: 0.5,
            '&:hover': {
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.08
              )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
            }
          }}
        >
          {`${!showStat ? 'More' : 'Less'} stats`}
        </Button>
      )}

      {/* Tags & Links Row */}
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        {/* Tags */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {!isTablet ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {tags &&
                tags.slice(0, 4).map((tag) => (
                  <Link
                    key={`${md5}-${tag}`}
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
                        fontSize: '0.7rem',
                        borderRadius: '4px',
                        background: `linear-gradient(135deg, ${alpha(
                          theme.palette.background.paper,
                          0.8
                        )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        color: theme.palette.text.primary,
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          background: `linear-gradient(135deg, ${alpha(
                            theme.palette.primary.main,
                            0.08
                          )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                          color: theme.palette.primary.main,
                          transform: 'translateY(-1px)'
                        }
                      }}
                    />
                  </Link>
                ))}
              {tags && tags.length > 4 && (
                <Chip
                  label={`+${tags.length - 4}`}
                  size="small"
                  onClick={() => toggleTagsDrawer(true)}
                  sx={{
                    height: '22px',
                    fontSize: '0.7rem',
                    borderRadius: '4px',
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.primary.main,
                      0.08
                    )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    color: theme.palette.primary.main,
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                />
              )}
            </Box>
          ) : (
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                Tags
              </Typography>
              <Box display="flex" alignItems="center" onClick={() => toggleTagsDrawer(true)}>
                {tags &&
                  tags.slice(0, 2).map((tag) => (
                    <Chip
                      key={`${md5}-${tag}`}
                      label={tag}
                      size="small"
                      sx={{
                        height: '20px',
                        fontSize: '0.7rem',
                        borderRadius: '4px',
                        background: `linear-gradient(135deg, ${alpha(
                          theme.palette.background.paper,
                          0.6
                        )} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        fontWeight: 500,
                        mr: 0.25
                      }}
                    />
                  ))}
                {tags && tags.length > 2 && (
                  <Chip
                    label={`+${tags.slice(2).length}`}
                    size="small"
                    sx={{
                      height: '20px',
                      fontSize: '0.7rem',
                      borderRadius: '4px',
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.primary.main,
                        0.08
                      )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      color: theme.palette.primary.main,
                      fontWeight: 500,
                      mr: 0.5
                    }}
                  />
                )}
                <KeyboardArrowRightIcon
                  sx={{
                    width: 16,
                    height: 16,
                    color: theme.palette.primary.main
                  }}
                />
              </Box>
            </Stack>
          )}
        </Box>

        {/* Links */}
        <Box>
          {!isTablet ? (
            <Stack direction="row" spacing={0.5}>
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
                      height: '26px',
                      fontSize: '0.7rem',
                      borderRadius: '6px',
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.background.paper,
                        0.8
                      )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                      backdropFilter: 'blur(8px)',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      color: theme.palette.primary.main,
                      fontWeight: 500,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: `linear-gradient(135deg, ${alpha(
                          theme.palette.primary.main,
                          0.08
                        )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                        transform: 'translateY(-1px)'
                      }
                    }}
                    deleteIcon={
                      <Icon
                        icon={linkExternal}
                        width="12"
                        height="12"
                        style={{ color: theme.palette.primary.main }}
                      />
                    }
                    onDelete={handleDelete}
                    onClick={handleDelete}
                    icon={<Icon icon={link45deg} width="12" height="12" />}
                  />
                </Link>
              )}
              <ExplorersMenu issuer={issuer} />
              {isChat && <ChatMenu token={token} />}
              {isCommunity && <CommunityMenu token={token} />}
            </Stack>
          ) : (
            <Box
              display="flex"
              alignItems="center"
              onClick={() => toggleLinksDrawer(true)}
              sx={{
                cursor: 'pointer',
                p: 0.5,
                borderRadius: '6px',
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.background.paper,
                  0.6
                )} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                }
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary, mr: 0.5 }}
              >
                Links
              </Typography>
              <KeyboardArrowRightIcon
                sx={{
                  width: 16,
                  height: 16,
                  color: theme.palette.primary.main
                }}
              />
            </Box>
          )}
        </Box>
      </Stack>

      <TagsDrawer
        isOpen={openTagsDrawer}
        toggleDrawer={toggleTagsDrawer}
        tags={tags}
        normalizeTag={normalizeTag}
        md5={md5}
      />

      <LinksDrawer isOpen={openLinksDrawer} toggleDrawer={toggleLinksDrawer} token={token} />

      <Dialog
        open={openScamWarning}
        onClose={() => setOpenScamWarning(false)}
        aria-labelledby="scam-warning-dialog"
        PaperProps={{
          sx: {
            maxWidth: '500px',
            border: '2px solid #ff3d00',
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.95
            )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
            backdropFilter: 'blur(20px)',
            boxShadow: `0 8px 32px ${alpha(theme.palette.error.main, 0.25)}`
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 2,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.error.main,
              0.08
            )} 0%, ${alpha(theme.palette.error.main, 0.04)} 100%)`,
            borderBottom: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
          }}
        >
          <WarningIcon sx={{ color: '#ff3d00', width: 24, height: 24 }} />
          <Typography color="error" variant="h6" sx={{ fontWeight: 600 }}>
            Scam Warning!
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <DialogContentText sx={{ color: theme.palette.text.primary }}>
            This token has been tagged as a potential SCAM. Exercise extreme caution:
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Do NOT trust any investment promises</li>
              <li>Do NOT connect your wallet to unknown sites</li>
              <li>Do NOT share your private keys or seed phrase</li>
              <li>DYOR (Do Your Own Research) before any interaction</li>
            </ul>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenScamWarning(false)}
            variant="contained"
            color="error"
            sx={{
              borderRadius: '8px',
              fontWeight: 600,
              px: 3,
              py: 1
            }}
          >
            I Understand
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
