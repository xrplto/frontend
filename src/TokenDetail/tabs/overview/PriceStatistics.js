import Decimal from 'decimal.js-light';
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
  Box,
  Dialog,
  DialogContent,
  Button
} from '@mui/material';
import { tableCellClasses } from '@mui/material/TableCell';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LockIcon from '@mui/icons-material/Lock';

// Iconify
import CircleIcon from '@mui/icons-material/Circle';
import TwitterIcon from '@mui/icons-material/Twitter';
import TelegramIcon from '@mui/icons-material/Telegram';
import GitHub from '@mui/icons-material/GitHub';
import Reddit from '@mui/icons-material/Reddit';
import Language from '@mui/icons-material/Language';
import LinkIcon from '@mui/icons-material/Link';

// Components
import IssuerInfoDialog from '../../dialogs/IssuerInfoDialog';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

// Redux
import { useSelector /*, useDispatch*/ } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';

// Utils
import { fNumber } from 'src/utils/formatters';
import { fDate } from 'src/utils/formatters';


// ----------------------------------------------------------------------
// Constants
const currencySymbols = {
  USD: '$ ',
  EUR: '€ ',
  JPY: '¥ ',
  CNH: '¥ ',
  XRP: '✕ '
};
import { AppContext } from 'src/AppContext';

const badge24hStyle = {
  display: 'inline-block',
  marginLeft: '3px',
  color: '#C4CDD5',
  fontSize: '10px',
  fontWeight: 400,
  lineHeight: '16px',
  backgroundColor: '#323546',
  borderRadius: '3px',
  padding: '1px 3px'
};

// Enhanced styled components
const ModernTableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  padding: theme.spacing(0.5, 0.75),
  '&:first-of-type': {
    paddingLeft: theme.spacing(0.75),
    fontWeight: 400,
    color: alpha(theme.palette.text.primary, 0.75),
    width: '40%'
  },
  '&:last-of-type': {
    paddingRight: theme.spacing(0.75),
    paddingLeft: theme.spacing(1)
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.4, 0.5),
    '&:first-of-type': {
      paddingLeft: theme.spacing(0.5),
      width: '45%'
    },
    '&:last-of-type': {
      paddingRight: theme.spacing(0.5),
      paddingLeft: theme.spacing(0.7)
    }
  }
}));

const StyledTable = styled(Table)(({ theme }) => ({
  background: 'transparent'
}));

// ----------------------------------------------------------------------

export default function PriceStatistics({ token }) {
  const theme = useTheme();
  const metrics = useSelector(selectMetrics);
  const { activeFiatCurrency, openSnackbar } = useContext(AppContext);
  const [openIssuerInfo, setOpenIssuerInfo] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [creations, setCreations] = useState(0);
  const [openScamWarning, setOpenScamWarning] = useState(false);

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
    marketcap > 0 && vol24hxrp != null
      ? new Decimal(vol24hxrp || 0).div(marketcap || 1).toNumber()
      : 0;

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

  const hasScamTag = enhancedTags.some((tag) => tag.toLowerCase() === 'scam');

  useEffect(() => {
    if (hasScamTag) {
      setOpenScamWarning(true);
    }
  }, [hasScamTag]);

  return (
    <Box
      sx={{
        borderRadius: '8px',
        background: 'transparent',
        border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
        width: '100%',
        mb: 0.5,
      }}
    >
      <IssuerInfoDialog open={openIssuerInfo} setOpen={setOpenIssuerInfo} token={token} />

      {/* Scam Warning Dialog */}
      <Dialog
        open={openScamWarning}
        onClose={() => setOpenScamWarning(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            background: theme.palette.background.paper,
            border: `2px solid ${theme.palette.error.main}`
          }
        }}
      >
        <DialogContent sx={{ textAlign: 'center', py: 2, px: 2 }}>
          <WarningAmberIcon
            sx={{
              fontSize: '32px',
              color: theme.palette.error.main,
              mb: 1
            }}
          />
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.error.main,
              fontWeight: 600,
              mb: 1,
              letterSpacing: '-0.02em'
            }}
          >
            Scam Warning
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: alpha(theme.palette.text.primary, 0.7),
              mb: 2
            }}
          >
            This token has been flagged as a potential scam. Please exercise extreme caution.
          </Typography>
          <Button
            variant="contained"
            onClick={() => setOpenScamWarning(false)}
            sx={{
              backgroundColor: theme.palette.error.main,
              color: theme.palette.common.white,
              px: 3,
              py: 0.75,
              borderRadius: '12px',
              fontWeight: 600
            }}
          >
            I Understand
          </Button>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <Box
        sx={{
          p: 0.5,
          px: 0.75,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: '12px',
            fontWeight: 400,
            color: alpha(theme.palette.text.primary, 0.5),
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}
        >
          Additional Details
        </Typography>
      </Box>

      <StyledTable size="small" sx={{ mt: 0.5 }}>
        <TableBody>
          {/* Issuer Row */}
          <TableRow>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 400,
                  color: alpha(theme.palette.text.primary, 0.75),
                  fontSize: isMobile ? '0.6rem' : '0.7rem'
                }}
                noWrap
              >
                Issuer
              </Typography>
            </ModernTableCell>
            <ModernTableCell align="left">
              <Stack direction="row" alignItems="center" spacing={isMobile ? 0.75 : 1.25}>
                <Chip
                  label={
                    <Stack direction="row" alignItems="center" spacing={isMobile ? 0.25 : 0.5}>
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 400, fontSize: isMobile ? '0.65rem' : '0.75rem' }}
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
                    borderRadius: '6px',
                    height: isMobile ? '22px' : '26px',
                    cursor: 'pointer',
                    background: alpha(theme.palette.primary.main, 0.08),
                    backdropFilter: 'none',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                    color: theme.palette.primary.main,
                    fontWeight: 400,
                    boxShadow: 'none',
                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.12),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                      boxShadow: 'none'
                    }
                  }}
                  onClick={handleOpenIssuerInfo}
                />
                <Tooltip title="Copy issuer address">
                  <IconButton
                    onClick={() => {
                      navigator.clipboard.writeText(issuer).then(() => {
                        openSnackbar('Copied!', 'success');
                      });
                    }}
                      size="small"
                      sx={{
                        p: 0.4,
                        width: 28,
                        height: 28,
                        borderRadius: '6px',
                        background: 'transparent',
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        '&:hover': {
                          background: alpha(theme.palette.primary.main, 0.04),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
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
                    color: alpha(theme.palette.text.primary, 0.85),
                    fontSize: isMobile ? '0.65rem' : '0.75rem'
                  }}
                  noWrap
                >
                  Creator
                </Typography>
              </ModernTableCell>
              <ModernTableCell align="left">
                <Stack direction="row" alignItems="center" spacing={isMobile ? 0.75 : 1.25}>
                  <Chip
                    label={
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 400, fontSize: isMobile ? '0.65rem' : '0.75rem' }}
                      >
                        {truncate(creator, 16)}
                      </Typography>
                    }
                    size="small"
                    sx={{
                      pl: isMobile ? 0.75 : 1,
                      pr: isMobile ? 0.75 : 1,
                      borderRadius: '6px',
                      height: isMobile ? '18px' : '22px',
                      background: alpha('#9C27B0', 0.08),
                      border: `1px solid ${alpha('#9C27B0', 0.15)}`,
                      color: '#9C27B0',
                      fontWeight: 400,
                      '&:hover': {
                        background: alpha('#9C27B0', 0.12),
                        border: `1px solid ${alpha('#9C27B0', 0.25)}`
                      }
                    }}
                  />
                  <Tooltip title="Copy creator address">
                    <IconButton
                      onClick={() => {
                        navigator.clipboard.writeText(creator).then(() => {
                          openSnackbar('Copied!', 'success');
                        });
                      }}
                        size="small"
                        sx={{
                          p: 0.25,
                          width: 22,
                          height: 22,
                          borderRadius: '6px',
                          background: 'transparent',
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          '&:hover': {
                            background: alpha('#9C27B0', 0.04),
                            border: `1px solid ${alpha('#9C27B0', 0.2)}`
                          }
                        }}
                      >
                        <ContentCopyIcon
                          sx={{
                            width: isMobile ? 10 : 12,
                            height: isMobile ? 10 : 12,
                            color: theme.palette.mode === 'dark' ? '#CE93D8' : '#7B1FA2'
                          }}
                        />
                    </IconButton>
                  </Tooltip>
                  {creations > 0 ? (
                    <Tooltip title="Number of tokens created by this creator.">
                      <Chip
                        label={
                          isMobile ? creations : `${creations} creation${creations > 1 ? 's' : ''}`
                        }
                        size="small"
                        sx={{
                          borderRadius: '6px',
                          height: isMobile ? '16px' : '18px',
                          background: alpha(theme.palette.info.main, 0.08),
                          border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                          color: theme.palette.info.main,
                          fontWeight: 400,
                          fontSize: isMobile ? '0.55rem' : '0.65rem',
                          minWidth: isMobile ? '20px' : 'unset',
                          justifyContent: isMobile ? 'center' : 'flex-start',
                          pl: isMobile ? 0.5 : 1,
                          pr: isMobile ? 0.5 : 1
                        }}
                      />
                    </Tooltip>
                  ) : null}
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
                  fontWeight: 400,
                  color: alpha(theme.palette.text.primary, 0.75),
                  fontSize: isMobile ? '0.6rem' : '0.7rem'
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
                  fontSize: isMobile ? '0.75rem' : '0.9rem'
                }}
              >
                {fNumber(voldivmarket)}
              </Typography>
            </ModernTableCell>
          </TableRow>

          {/* Market Dominance Row */}
          <TableRow>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 400,
                  color: alpha(theme.palette.text.primary, 0.75),
                  fontSize: isMobile ? '0.6rem' : '0.7rem'
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
                  color: '#2E7D32',
                  fontSize: isMobile ? '0.75rem' : '0.9rem'
                }}
              >
                {fNumber(dom || 0)} %
              </Typography>
            </ModernTableCell>
          </TableRow>

          {/* Diluted Market Cap Row */}
          <TableRow>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 400,
                  color: alpha(theme.palette.text.primary, 0.75),
                  fontSize: isMobile ? '0.6rem' : '0.7rem'
                }}
                noWrap
              >
                Fully Diluted Market Cap
              </Typography>
            </ModernTableCell>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.info.main,
                  fontSize: isMobile ? '0.75rem' : '0.9rem'
                }}
              >
                {currencySymbols[activeFiatCurrency]}{' '}
                {fNumber(amount * (exch / (metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null) || 1)))}
              </Typography>
            </ModernTableCell>
          </TableRow>

          {/* Supply Row */}
          {amount ? (
            <TableRow>
              <ModernTableCell align="left">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: alpha(theme.palette.text.primary, 0.85),
                    fontSize: isMobile ? '0.65rem' : '0.75rem'
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
                    fontSize: isMobile ? '0.75rem' : '0.9rem'
                  }}
                >
                  {fNumber(amount)}
                </Typography>
              </ModernTableCell>
            </TableRow>
          ) : null}

          {/* Holders Row */}
          {holders ? (
            <TableRow>
              <ModernTableCell align="left">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: alpha(theme.palette.text.primary, 0.85),
                    fontSize: isMobile ? '0.65rem' : '0.75rem'
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
                    fontSize: isMobile ? '0.75rem' : '0.9rem'
                  }}
                >
                  {fNumber(holders)}
                </Typography>
              </ModernTableCell>
            </TableRow>
          ) : null}

          {/* Trustlines Row */}
          {trustlines ? (
            <TableRow>
              <ModernTableCell align="left">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: isMobile ? '0.65rem' : '0.75rem'
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
                    color: '#1976D2',
                    fontSize: isMobile ? '0.75rem' : '0.9rem'
                  }}
                >
                  {fNumber(trustlines)}
                </Typography>
              </ModernTableCell>
            </TableRow>
          ) : null}

          {/* Unique Traders (24h) Row */}
          {uniqueTraders24h ? (
            <TableRow>
              <ModernTableCell align="left">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: alpha(theme.palette.text.primary, 0.85),
                    fontSize: isMobile ? '0.65rem' : '0.75rem'
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
                    fontSize: isMobile ? '0.75rem' : '0.9rem'
                  }}
                >
                  {fNumber(uniqueTraders24h)}
                </Typography>
              </ModernTableCell>
            </TableRow>
          ) : null}

          {/* Trades (24h) Row */}
          {vol24htx ? (
            <TableRow>
              <ModernTableCell align="left">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: isMobile ? '0.65rem' : '0.75rem'
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
                    color: '#F57C00',
                    fontSize: isMobile ? '0.75rem' : '0.9rem'
                  }}
                >
                  {fNumber(vol24htx)}
                </Typography>
              </ModernTableCell>
            </TableRow>
          ) : null}

          {/* Created Date Row */}
          {date || dateon ? (
            <TableRow>
              <ModernTableCell align="left">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: alpha(theme.palette.text.primary, 0.85),
                    fontSize: isMobile ? '0.65rem' : '0.75rem'
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
                    color: alpha(theme.palette.text.secondary, 0.8),
                    fontSize: isMobile ? '0.7rem' : '0.85rem'
                  }}
                >
                  {fDate(date || dateon)}
                </Typography>
              </ModernTableCell>
            </TableRow>
          ) : null}

          {/* Social Links & Tags Row */}
          {social || enhancedTags.length > 0 ? (
            <TableRow>
              <ModernTableCell align="left">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: alpha(theme.palette.text.primary, 0.85),
                    fontSize: isMobile ? '0.65rem' : '0.75rem'
                  }}
                  noWrap
                >
                  Social & Tags
                </Typography>
              </ModernTableCell>
              <ModernTableCell align="left">
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={isMobile ? 0.5 : 1.25}
                  sx={{ flexWrap: 'wrap', gap: isMobile ? 0.25 : 0.75 }}
                >
                  <CompactTags enhancedTags={enhancedTags} maxTags={isMobile ? 2 : 3} />
                  <CompactSocialLinks social={social} size="small" />
                </Stack>
              </ModernTableCell>
            </TableRow>
          ) : null}
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
    <Stack direction="row" spacing={isMobile ? 0.25 : 0.75} alignItems="center">
      {socialEntries.slice(0, isMobile ? 2 : 4).map(([platform, url]) => (
        <Tooltip key={platform} title={`${platform}: ${url}`} arrow>
          <IconButton
            component="a"
            href={getFullUrl(platform, url)}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={{
              width: isMobile ? 18 : 22,
              height: isMobile ? 18 : 22,
              p: isMobile ? 0.25 : 0.4,
              borderRadius: '6px',
              background: alpha(theme.palette.primary.main, 0.08),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              color: theme.palette.primary.main,
              '&:hover': {
                background: alpha(theme.palette.primary.main, 0.12),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`
              }
            }}
          >
            {(platform === 'twitter' || platform === 'x') && (
              <TwitterIcon sx={{ width: iconSize, height: iconSize }} />
            )}
            {platform === 'telegram' && <TelegramIcon sx={{ width: iconSize, height: iconSize }} />}
            {platform === 'discord' && <CircleIcon sx={{ width: iconSize, height: iconSize }} />}
            {platform === 'website' && <Language sx={{ width: iconSize, height: iconSize }} />}
            {platform === 'github' && <GitHub sx={{ width: iconSize, height: iconSize }} />}
            {platform === 'reddit' && <Reddit sx={{ width: iconSize, height: iconSize }} />}
            {!['twitter', 'x', 'telegram', 'discord', 'website', 'github', 'reddit'].includes(
              platform
            ) && <LinkIcon sx={{ width: iconSize, height: iconSize }} />}
          </IconButton>
        </Tooltip>
      ))}
      {socialEntries.length > (isMobile ? 2 : 4) && toggleLinksDrawer && (
        <Tooltip title="View all links" arrow>
          <IconButton
            onClick={() => toggleLinksDrawer(true)}
            size="small"
            sx={{
              width: isMobile ? 18 : 22,
              height: isMobile ? 18 : 22,
              p: isMobile ? 0.25 : 0.4,
              borderRadius: '6px',
              background: alpha(theme.palette.secondary.main, 0.08),
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
              color: theme.palette.secondary.main,
              '&:hover': {
                background: alpha(theme.palette.secondary.main, 0.12),
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.25)}`
              }
            }}
          >
            <Typography sx={{ fontSize: isMobile ? '0.55rem' : '0.65rem', fontWeight: 600 }}>
              +{socialEntries.length - (isMobile ? 2 : 4)}
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
    <Stack
      direction="row"
      spacing={isMobile ? 0.4 : 0.75}
      alignItems="center"
      sx={{ flexWrap: 'wrap', gap: isMobile ? 0.4 : 0.75 }}
    >
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
              height: isMobile ? '18px' : '20px',
              fontSize: isMobile ? '0.55rem' : '0.65rem',
              borderRadius: '6px',
              px: isMobile ? 0.6 : 0.8,
              background: alpha(theme.palette.background.paper, 0.5),
              border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
              color: theme.palette.text.primary,
              fontWeight: 400,
              cursor: 'pointer',
              minHeight: 'auto',
              '&:hover': {
                background: alpha(theme.palette.primary.main, 0.08),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                color: theme.palette.primary.main
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
            height: isMobile ? '18px' : '20px',
            fontSize: isMobile ? '0.55rem' : '0.65rem',
            borderRadius: '6px',
            px: isMobile ? 0.5 : 0.8,
            background: alpha(theme.palette.primary.main, 0.08),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            color: theme.palette.primary.main,
            fontWeight: 400,
            cursor: 'pointer',
            minHeight: 'auto',
            '&:hover': {
              background: alpha(theme.palette.primary.main, 0.12),
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={isMobile ? 0.5 : 1.25}
      sx={{ flexWrap: 'wrap', gap: isMobile ? 0.25 : 0.75 }}
    >
      <CompactTags
        enhancedTags={enhancedTags}
        toggleTagsDrawer={toggleTagsDrawer}
        maxTags={maxTags}
      />
      <CompactSocialLinks social={social} toggleLinksDrawer={toggleLinksDrawer} size={socialSize} />
    </Stack>
  );
};
