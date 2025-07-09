import Decimal from 'decimal.js';
import PropTypes from 'prop-types';
import { useState, useEffect, useContext } from 'react';
// Material
import {
  alpha,
  styled,
  useTheme,
  CardHeader,
  Stack,
  Typography,
  Table,
  TableRow,
  TableBody,
  TableCell,
  Tooltip,
  IconButton,
  Avatar,
  Chip,
  Link,
  useMediaQuery,
  Box
} from '@mui/material';
import { tableCellClasses } from '@mui/material/TableCell';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LockIcon from '@mui/icons-material/Lock';

// Iconify
import { Icon } from '@iconify/react';
import blackholeIcon from '@iconify/icons-arcticons/blackhole';

// Components
import { CopyToClipboard } from 'react-copy-to-clipboard';
import IssuerInfoDialog from '../common/IssuerInfoDialog';

// Redux
import { useSelector /*, useDispatch*/ } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';

// Utils
import { fNumber, fNumberWithCurreny } from 'src/utils/formatNumber';
import { fDate } from 'src/utils/formatTime';

import NumberTooltip from 'src/components/NumberTooltip';

// ----------------------------------------------------------------------
import StackStyle from 'src/components/StackStyle';
import { currencySymbols } from 'src/utils/constants';
import { AppContext } from 'src/AppContext';

const badge24hStyle = {
  display: 'inline-block',
  marginLeft: '3px',
  color: '#C4CDD5',
  fontSize: '10px',
  fontWeight: '500',
  lineHeight: '16px',
  backgroundColor: '#323546',
  borderRadius: '3px',
  padding: '1px 3px'
};

// Enhanced styled components
const ModernTableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  padding: theme.spacing(1.5),
  '&:first-of-type': {
    paddingLeft: theme.spacing(1.5)
  },
  '&:last-of-type': {
    paddingRight: theme.spacing(1.5),
    paddingLeft: theme.spacing(40)
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
    '&:first-of-type': {
      paddingLeft: theme.spacing(1)
    },
    '&:last-of-type': {
      paddingRight: theme.spacing(1),
      paddingLeft: theme.spacing(20)
    }
  }
}));

const StyledTable = styled(Table)(({ theme }) => ({
  background: 'transparent',
  '& .MuiTableRow-root': {
    transition: 'all 0.2s ease',
    '&:hover': {
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(
        theme.palette.primary.main,
        0.01
      )} 100%)`,
      backdropFilter: 'blur(5px)'
    }
  }
}));

// ----------------------------------------------------------------------

export default function PriceStatistics({ token }) {
  const theme = useTheme();
  const metrics = useSelector(selectMetrics);
  const { activeFiatCurrency, openSnackbar } = useContext(AppContext);
  const [openIssuerInfo, setOpenIssuerInfo] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [creations, setCreations] = useState(0);

  const {
    id,
    name,
    amount,
    exch,
    maxMin24h = [0, 0],
    vol24hxrp,
    marketcap,
    dom,
    issuer,
    issuer_info,
    creator,
    tags,
    social,
    origin,
    holders,
    trustlines,
    uniqueTraders24h,
    vol24htx,
    date,
    dateon
  } = token;

  useEffect(() => {
    if (creator) {
      fetch(`https://api.xrpscan.com/api/v1/account/${creator}/activated`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.accounts) {
            let count = 0;
            const hasLegacy = data.accounts.some((acc) => acc.ledger_index <= 91444888);
            if (hasLegacy) {
              count = 1;
            } else {
              count = data.accounts.filter((acc) => acc.initial_balance > 98).length;
            }
            setCreations(count);
          }
        })
        .catch((err) => console.error('Failed to fetch account creations:', err));
    }
  }, [creator]);

  const info = issuer_info || {};

  function truncate(str, n) {
    if (!str) return '';
    const effectiveN = isMobile ? Math.floor(n * 0.7) : n; // Make truncation more aggressive on mobile
    return str.length > effectiveN ? str.substr(0, effectiveN - 1) + '... ' : str;
  }

  let user = token.user;
  if (!user) user = name;

  const voldivmarket =
    marketcap > 0 && vol24hxrp != null ? Decimal.div(vol24hxrp || 0, marketcap || 1).toNumber() : 0;

  const handleOpenIssuerInfo = () => {
    setOpenIssuerInfo(true);
  };

  // Create enhanced tags array that includes origin-based tags (same as UserDesc.js)
  const getOriginTag = (origin) => {
    switch (origin) {
      case 'FirstLedger':
        return 'FirstLedger';
      case 'XPMarket':
        return 'XPMarket';
      case 'LedgerMeme':
        return 'LedgerMeme';
      case 'Horizon':
        return 'Horizon';
      case 'aigent.run':
        return 'aigent.run';
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
    const originTag = getOriginTag(origin);

    if (originTag && !baseTags.includes(originTag)) {
      return [originTag, ...baseTags];
    }

    return baseTags;
  })();

  return (
    <Box
      sx={{
        borderRadius: '24px',
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.background.paper,
          0.7
        )} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`,
        backdropFilter: 'blur(25px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        boxShadow: `0 8px 32px 0 ${alpha(theme.palette.common.black, 0.1)}`,
        position: 'relative',
        overflow: 'hidden',
        mb: 2
      }}
    >
      <IssuerInfoDialog open={openIssuerInfo} setOpen={setOpenIssuerInfo} token={token} />

      {/* Enhanced Header */}
      <Box
        sx={{
          p: isMobile ? 1.5 : 2,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.05
          )} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: isMobile ? '0.95rem' : '1.1rem',
            fontWeight: 700,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.01em'
          }}
        >
          {name} Additional Details
        </Typography>
      </Box>

      <StyledTable size="small">
        <TableBody>
          {/* Issuer Row */}
          <TableRow>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: alpha(theme.palette.text.primary, 0.9),
                  fontSize: isMobile ? '0.8rem' : '0.875rem'
                }}
                noWrap
              >
                Issuer
              </Typography>
            </ModernTableCell>
            <ModernTableCell align="left">
              <Stack direction="row" alignItems="center" spacing={isMobile ? 0.5 : 1}>
                <Chip
                  label={
                    <Stack direction="row" alignItems="center" spacing={isMobile ? 0.25 : 0.5}>
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 500, fontSize: isMobile ? '0.65rem' : '0.75rem' }}
                      >
                        {truncate(issuer, 16)}
                      </Typography>
                      {info.blackholed && (
                        <Tooltip title="Blackholed - Cannot issue more tokens">
                          <LockIcon
                            sx={{
                              fontSize: isMobile ? '12px' : '14px',
                              color: theme.palette.success.main
                            }}
                          />
                        </Tooltip>
                      )}
                    </Stack>
                  }
                  size="small"
                  sx={{
                    pl: isMobile ? 0.75 : 1,
                    pr: isMobile ? 0.75 : 1,
                    borderRadius: '8px',
                    height: isMobile ? '24px' : '28px',
                    cursor: 'pointer',
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.primary.main,
                      0.08
                    )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                    color: theme.palette.primary.main,
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.primary.main,
                        0.12
                      )} 0%, ${alpha(theme.palette.primary.main, 0.06)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                      transform: 'translateY(-1px)'
                    }
                  }}
                  onClick={handleOpenIssuerInfo}
                />
                <CopyToClipboard text={issuer} onCopy={() => openSnackbar('Copied!', 'success')}>
                  <Tooltip title="Copy issuer address">
                    <IconButton
                      size="small"
                      sx={{
                        p: isMobile ? 0.5 : 0.75,
                        borderRadius: '6px',
                        background: `linear-gradient(135deg, ${alpha(
                          theme.palette.background.paper,
                          0.8
                        )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          background: `linear-gradient(135deg, ${alpha(
                            theme.palette.primary.main,
                            0.08
                          )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      <ContentCopyIcon
                        sx={{
                          width: isMobile ? 12 : 14,
                          height: isMobile ? 12 : 14,
                          color: theme.palette.primary.main
                        }}
                      />
                    </IconButton>
                  </Tooltip>
                </CopyToClipboard>
              </Stack>
            </ModernTableCell>
          </TableRow>

          {/* Creator Row */}
          {creator && (
            <TableRow>
              <ModernTableCell align="left">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: alpha(theme.palette.text.primary, 0.9),
                    fontSize: isMobile ? '0.8rem' : '0.875rem'
                  }}
                  noWrap
                >
                  Creator
                </Typography>
              </ModernTableCell>
              <ModernTableCell align="left">
                <Stack direction="row" alignItems="center" spacing={isMobile ? 0.5 : 1}>
                  <Chip
                    label={
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 500, fontSize: isMobile ? '0.65rem' : '0.75rem' }}
                      >
                        {truncate(creator, 16)}
                      </Typography>
                    }
                    size="small"
                    sx={{
                      pl: isMobile ? 0.75 : 1,
                      pr: isMobile ? 0.75 : 1,
                      borderRadius: '8px',
                      height: isMobile ? '24px' : '28px',
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.secondary.main,
                        0.08
                      )} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
                      backdropFilter: 'blur(8px)',
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                      color: theme.palette.secondary.main,
                      fontWeight: 500,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: `linear-gradient(135deg, ${alpha(
                          theme.palette.secondary.main,
                          0.12
                        )} 0%, ${alpha(theme.palette.secondary.main, 0.06)} 100%)`,
                        border: `1px solid ${alpha(theme.palette.secondary.main, 0.25)}`,
                        transform: 'translateY(-1px)'
                      }
                    }}
                  />
                  <CopyToClipboard text={creator} onCopy={() => openSnackbar('Copied!', 'success')}>
                    <Tooltip title="Copy creator address">
                      <IconButton
                        size="small"
                        sx={{
                          p: isMobile ? 0.5 : 0.75,
                          borderRadius: '6px',
                          background: `linear-gradient(135deg, ${alpha(
                            theme.palette.background.paper,
                            0.8
                          )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                          backdropFilter: 'blur(8px)',
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            background: `linear-gradient(135deg, ${alpha(
                              theme.palette.secondary.main,
                              0.08
                            )} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
                            border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                            transform: 'translateY(-1px)'
                          }
                        }}
                      >
                        <ContentCopyIcon
                          sx={{
                            width: isMobile ? 12 : 14,
                            height: isMobile ? 12 : 14,
                            color: theme.palette.secondary.main
                          }}
                        />
                      </IconButton>
                    </Tooltip>
                  </CopyToClipboard>
                  {creations > 0 && (
                    <Tooltip title="Number of tokens created by this creator.">
                      <Chip
                        label={
                          isMobile ? creations : `${creations} creation${creations > 1 ? 's' : ''}`
                        }
                        size="small"
                        sx={{
                          borderRadius: '8px',
                          height: isMobile ? '18px' : '28px',
                          background: `linear-gradient(135deg, ${alpha(
                            theme.palette.info.main,
                            0.1
                          )} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                          backdropFilter: 'blur(8px)',
                          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                          color: theme.palette.info.main,
                          fontWeight: 500,
                          fontSize: isMobile ? '0.65rem' : '0.75rem',
                          minWidth: isMobile ? '18px' : 'unset',
                          justifyContent: isMobile ? 'center' : 'flex-start',
                          pl: isMobile ? 0 : 1,
                          pr: isMobile ? 0 : 1
                        }}
                      />
                    </Tooltip>
                  )}
                </Stack>
              </ModernTableCell>
            </TableRow>
          )}





          {/* Volume/Market Cap Row */}
          <TableRow>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: alpha(theme.palette.text.primary, 0.9),
                  fontSize: isMobile ? '0.8rem' : '0.875rem'
                }}
                noWrap
              >
                Volume / Market Cap
              </Typography>
            </ModernTableCell>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.warning.main,
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}
              >
                <NumberTooltip number={fNumber(voldivmarket)} />
              </Typography>
            </ModernTableCell>
          </TableRow>

          {/* Market Dominance Row */}
          <TableRow>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: alpha(theme.palette.text.primary, 0.9),
                  fontSize: isMobile ? '0.8rem' : '0.875rem'
                }}
                noWrap
              >
                Market Dominance
              </Typography>
            </ModernTableCell>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.secondary.main,
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}
              >
                <NumberTooltip number={fNumber(dom || 0)} /> %
              </Typography>
            </ModernTableCell>
          </TableRow>



          {/* Diluted Market Cap Row */}
          <TableRow>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: alpha(theme.palette.text.primary, 0.9),
                  fontSize: isMobile ? '0.8rem' : '0.875rem'
                }}
                noWrap
              >
                Diluted Market Cap
              </Typography>
            </ModernTableCell>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${alpha(
                    theme.palette.info.main,
                    0.8
                  )} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}
              >
                {currencySymbols[activeFiatCurrency]}{' '}
                {fNumber(amount * (exch / metrics[activeFiatCurrency]))}
              </Typography>
            </ModernTableCell>
          </TableRow>

          {/* Supply Row */}
          {amount && (
            <TableRow>
              <ModernTableCell align="left">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: alpha(theme.palette.text.primary, 0.9),
                    fontSize: isMobile ? '0.8rem' : '0.875rem'
                  }}
                  noWrap
                >
                  Supply
                </Typography>
              </ModernTableCell>
              <ModernTableCell align="left">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.warning.main,
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  }}
                >
                  <NumberTooltip number={fNumber(amount)} />
                </Typography>
              </ModernTableCell>
            </TableRow>
          )}

          {/* Holders Row */}
          {holders && (
            <TableRow>
              <ModernTableCell align="left">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: alpha(theme.palette.text.primary, 0.9),
                    fontSize: isMobile ? '0.8rem' : '0.875rem'
                  }}
                  noWrap
                >
                  Holders
                </Typography>
              </ModernTableCell>
              <ModernTableCell align="left">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.info.main,
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  }}
                >
                  <NumberTooltip number={fNumber(holders)} />
                </Typography>
              </ModernTableCell>
            </TableRow>
          )}

          {/* Trustlines Row */}
          {trustlines && (
            <TableRow>
              <ModernTableCell align="left">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: alpha(theme.palette.text.primary, 0.9),
                    fontSize: isMobile ? '0.8rem' : '0.875rem'
                  }}
                  noWrap
                >
                  Trustlines
                </Typography>
              </ModernTableCell>
              <ModernTableCell align="left">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.secondary.main,
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  }}
                >
                  <NumberTooltip number={fNumber(trustlines)} />
                </Typography>
              </ModernTableCell>
            </TableRow>
          )}

          {/* Unique Traders (24h) Row */}
          {uniqueTraders24h && (
            <TableRow>
              <ModernTableCell align="left">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: alpha(theme.palette.text.primary, 0.9),
                    fontSize: isMobile ? '0.8rem' : '0.875rem'
                  }}
                  noWrap
                >
                  Unique Traders (24h)
                </Typography>
              </ModernTableCell>
              <ModernTableCell align="left">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.warning.main,
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  }}
                >
                  <NumberTooltip number={fNumber(uniqueTraders24h)} />
                </Typography>
              </ModernTableCell>
            </TableRow>
          )}

          {/* Trades (24h) Row */}
          {vol24htx && (
            <TableRow>
              <ModernTableCell align="left">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: alpha(theme.palette.text.primary, 0.9),
                    fontSize: isMobile ? '0.8rem' : '0.875rem'
                  }}
                  noWrap
                >
                  Trades (24h)
                </Typography>
              </ModernTableCell>
              <ModernTableCell align="left">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.secondary.main,
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  }}
                >
                  <NumberTooltip number={fNumber(vol24htx)} />
                </Typography>
              </ModernTableCell>
            </TableRow>
          )}

          {/* Created Date Row */}
          {(date || dateon) && (
            <TableRow>
              <ModernTableCell align="left">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: alpha(theme.palette.text.primary, 0.9),
                    fontSize: isMobile ? '0.8rem' : '0.875rem'
                  }}
                  noWrap
                >
                  Created
                </Typography>
              </ModernTableCell>
              <ModernTableCell align="left">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.secondary,
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  }}
                >
                  {fDate(date || dateon)}
                </Typography>
              </ModernTableCell>
            </TableRow>
          )}

          {/* Social Links & Tags Row */}
          {(social || enhancedTags.length > 0) && (
            <TableRow>
              <ModernTableCell align="left">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: alpha(theme.palette.text.primary, 0.9),
                    fontSize: isMobile ? '0.8rem' : '0.875rem'
                  }}
                  noWrap
                >
                  Social & Tags
                </Typography>
              </ModernTableCell>
              <ModernTableCell align="left">
                <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  <CompactTags 
                    enhancedTags={enhancedTags}
                    maxTags={isMobile ? 2 : 3}
                  />
                  <CompactSocialLinks 
                    social={social}
                    size="small"
                  />
                </Stack>
              </ModernTableCell>
            </TableRow>
          )}
        </TableBody>
      </StyledTable>
    </Box>
  );
}

PriceStatistics.propTypes = {
  token: PropTypes.object.isRequired
};

// Helper function to normalize tags for URL slugs
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

// Helper function to get full URLs for social platforms
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
export const CompactSocialLinks = ({ social, toggleLinksDrawer, size = 'small' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
      {socialEntries.length > (isMobile ? 3 : 4) && toggleLinksDrawer && (
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
export const CompactTags = ({ enhancedTags, toggleTagsDrawer, maxTags = 3 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
      {enhancedTags.length > maxTags && toggleTagsDrawer && (
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

// Combined component for easy usage
export const CompactSocialAndTags = ({ 
  social, 
  enhancedTags, 
  toggleLinksDrawer, 
  toggleTagsDrawer, 
  maxTags = 3, 
  socialSize = 'small' 
}) => {
  const theme = useTheme();
  
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
      <CompactTags 
        enhancedTags={enhancedTags}
        toggleTagsDrawer={toggleTagsDrawer}
        maxTags={maxTags}
      />
      <CompactSocialLinks 
        social={social}
        toggleLinksDrawer={toggleLinksDrawer}
        size={socialSize}
      />
    </Stack>
  );
};
