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
import { CopyToClipboard } from 'react-copy-to-clipboard';
import IssuerInfoDialog from '../common/IssuerInfoDialog';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

// Redux
import { useSelector /*, useDispatch*/ } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';

// Utils
import { fNumber, fNumberWithCurreny } from 'src/utils/formatters';
import { fDate } from 'src/utils/formatters';

import NumberTooltip from 'src/components/NumberTooltip';

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
  fontWeight: '500',
  lineHeight: '16px',
  backgroundColor: '#323546',
  borderRadius: '3px',
  padding: '1px 3px'
};

// Enhanced styled components
const ModernTableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: `1.5px solid ${alpha(theme.palette.divider, 0.1)}`,
  padding: theme.spacing(0.6, 0.8),
  '&:first-of-type': {
    paddingLeft: theme.spacing(0.8),
    fontWeight: 500,
    color: alpha(theme.palette.text.primary, 0.75),
    width: '40%'
  },
  '&:last-of-type': {
    paddingRight: theme.spacing(0.8),
    paddingLeft: theme.spacing(1.2)
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.5, 0.6),
    '&:first-of-type': {
      paddingLeft: theme.spacing(0.6),
      width: '45%'
    },
    '&:last-of-type': {
      paddingRight: theme.spacing(0.6),
      paddingLeft: theme.spacing(0.8)
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
        borderRadius: '12px',
        background: 'transparent',
        border: `1.5px solid ${alpha(theme.palette.divider, 0.2)}`,
        position: 'relative',
        overflow: 'hidden',
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
            borderRadius: '16px',
            background: theme.palette.background.paper,
            border: `2px solid ${theme.palette.error.main}`,
            boxShadow: `0 8px 32px ${alpha(theme.palette.error.main, 0.2)}`
          }
        }}
      >
        <DialogContent sx={{ textAlign: 'center', py: 2, px: 2 }}>
          <WarningAmberIcon
            sx={{
              fontSize: '2rem',
              color: theme.palette.error.main,
              mb: 1
            }}
          />
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.error.main,
              fontWeight: 700,
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
          borderBottom: `1.5px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: '0.6rem',
            fontWeight: 500,
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
                  fontWeight: 500,
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
                    borderRadius: '10px',
                    height: isMobile ? '26px' : '32px',
                    cursor: 'pointer',
                    background: `linear-gradient(145deg, ${alpha(
                      theme.palette.primary.main,
                      0.1
                    )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                                      '&:hover': {
                      background: `linear-gradient(145deg, ${alpha(
                        theme.palette.primary.main,
                        0.15
                      )} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                    }
                  }}
                  onClick={handleOpenIssuerInfo}
                />
                <CopyToClipboard text={issuer} onCopy={() => openSnackbar('Copied!', 'success')}>
                  <Tooltip title="Copy issuer address">
                    <IconButton
                      size="small"
                      sx={{
                        p: 0.5,
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        background: alpha(theme.palette.background.paper, 0.8),
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                              '&:hover': {
                          background: alpha(theme.palette.primary.main, 0.08),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
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
                    fontWeight: 700,
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
                        sx={{ fontWeight: 500, fontSize: isMobile ? '0.65rem' : '0.75rem' }}
                      >
                        {truncate(creator, 16)}
                      </Typography>
                    }
                    size="small"
                    sx={{
                      pl: isMobile ? 0.75 : 1,
                      pr: isMobile ? 0.75 : 1,
                      borderRadius: '10px',
                      height: isMobile ? '20px' : '24px',
                      background:
                        theme.palette.mode === 'dark'
                          ? `linear-gradient(145deg, ${alpha('#9C27B0', 0.15)} 0%, ${alpha('#9C27B0', 0.08)} 100%)`
                          : `linear-gradient(145deg, ${alpha('#7B1FA2', 0.12)} 0%, ${alpha('#7B1FA2', 0.06)} 100%)`,
                      backdropFilter: 'blur(10px)',
                      border:
                        theme.palette.mode === 'dark'
                          ? `1px solid ${alpha('#9C27B0', 0.3)}`
                          : `1px solid ${alpha('#7B1FA2', 0.25)}`,
                      color: theme.palette.mode === 'dark' ? '#CE93D8' : '#7B1FA2',
                      fontWeight: 600,
                                          textShadow:
                        theme.palette.mode === 'dark' ? '0 0 8px rgba(156, 39, 176, 0.4)' : 'none',
                      '&:hover': {
                        background:
                          theme.palette.mode === 'dark'
                            ? `linear-gradient(145deg, ${alpha('#9C27B0', 0.2)} 0%, ${alpha('#9C27B0', 0.12)} 100%)`
                            : `linear-gradient(145deg, ${alpha('#7B1FA2', 0.15)} 0%, ${alpha('#7B1FA2', 0.08)} 100%)`,
                        border:
                          theme.palette.mode === 'dark'
                            ? `1px solid ${alpha('#9C27B0', 0.4)}`
                            : `1px solid ${alpha('#7B1FA2', 0.3)}`,
                                                boxShadow:
                          theme.palette.mode === 'dark'
                            ? `0 4px 12px ${alpha('#9C27B0', 0.3)}`
                            : `0 4px 12px ${alpha('#7B1FA2', 0.2)}`
                      }
                    }}
                  />
                  <CopyToClipboard text={creator} onCopy={() => openSnackbar('Copied!', 'success')}>
                    <Tooltip title="Copy creator address">
                      <IconButton
                        size="small"
                        sx={{
                          p: 0.25,
                          width: 24,
                          height: 24,
                          borderRadius: '8px',
                          background: alpha(theme.palette.background.paper, 0.8),
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                                  '&:hover': {
                            background:
                              theme.palette.mode === 'dark'
                                ? alpha('#9C27B0', 0.08)
                                : alpha('#7B1FA2', 0.06),
                            border:
                              theme.palette.mode === 'dark'
                                ? `1px solid ${alpha('#9C27B0', 0.3)}`
                                : `1px solid ${alpha('#7B1FA2', 0.25)}`,
                                                        boxShadow:
                              theme.palette.mode === 'dark'
                                ? `0 4px 12px ${alpha('#9C27B0', 0.2)}`
                                : `0 4px 12px ${alpha('#7B1FA2', 0.15)}`
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
                  </CopyToClipboard>
                  {creations > 0 ? (
                    <Tooltip title="Number of tokens created by this creator.">
                      <Chip
                        label={
                          isMobile ? creations : `${creations} creation${creations > 1 ? 's' : ''}`
                        }
                        size="small"
                        sx={{
                          borderRadius: '10px',
                          height: isMobile ? '16px' : '20px',
                          background: `linear-gradient(145deg, ${alpha(
                            theme.palette.info.main,
                            0.1
                          )} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                          backdropFilter: 'blur(10px)',
                          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                          color: theme.palette.info.main,
                          fontWeight: 600,
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
                  fontWeight: 500,
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
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${alpha(theme.palette.warning.main, 0.8)} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: isMobile ? '0.75rem' : '0.9rem'
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
                  fontWeight: 500,
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
                  fontWeight: 700,
                  color: theme.palette.mode === 'dark' ? '#66BB6A' : '#2E7D32',
                  fontSize: isMobile ? '0.75rem' : '0.9rem',
                  textShadow:
                    theme.palette.mode === 'dark' ? '0 0 12px rgba(102, 187, 106, 0.3)' : 'none'
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
                  fontWeight: 500,
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
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${alpha(
                    theme.palette.info.main,
                    0.8
                  )} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
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
                    fontWeight: 700,
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
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${alpha(theme.palette.warning.main, 0.8)} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: isMobile ? '0.75rem' : '0.9rem'
                  }}
                >
                  <NumberTooltip number={fNumber(amount)} />
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
                    fontWeight: 700,
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
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${alpha(theme.palette.info.main, 0.8)} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: isMobile ? '0.75rem' : '0.9rem'
                  }}
                >
                  <NumberTooltip number={fNumber(holders)} />
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
                    fontWeight: 700,
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
                    fontWeight: 700,
                    color: theme.palette.mode === 'dark' ? '#64B5F6' : '#1976D2',
                    fontSize: isMobile ? '0.75rem' : '0.9rem',
                    textShadow:
                      theme.palette.mode === 'dark' ? '0 0 12px rgba(100, 181, 246, 0.3)' : 'none'
                  }}
                >
                  <NumberTooltip number={fNumber(trustlines)} />
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
                    fontWeight: 700,
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
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${alpha(theme.palette.warning.main, 0.8)} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: isMobile ? '0.75rem' : '0.9rem'
                  }}
                >
                  <NumberTooltip number={fNumber(uniqueTraders24h)} />
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
                    fontWeight: 700,
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
                    fontWeight: 700,
                    color: theme.palette.mode === 'dark' ? '#FFB74D' : '#F57C00',
                    fontSize: isMobile ? '0.75rem' : '0.9rem',
                    textShadow:
                      theme.palette.mode === 'dark' ? '0 0 12px rgba(255, 183, 77, 0.3)' : 'none'
                  }}
                >
                  <NumberTooltip number={fNumber(vol24htx)} />
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
                    fontWeight: 700,
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
                    fontWeight: 700,
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
              width: isMobile ? 18 : 24,
              height: isMobile ? 18 : 24,
              p: isMobile ? 0.25 : 0.5,
              borderRadius: '8px',
              background: `linear-gradient(145deg, ${alpha(
                theme.palette.primary.main,
                0.1
              )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              color: theme.palette.primary.main,
            
              '&:hover': {
                background: `linear-gradient(145deg, ${alpha(
                  theme.palette.primary.main,
                  0.15
                )} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
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
              width: isMobile ? 18 : 24,
              height: isMobile ? 18 : 24,
              p: isMobile ? 0.25 : 0.5,
              borderRadius: '8px',
              background: `linear-gradient(145deg, ${alpha(
                theme.palette.secondary.main,
                0.1
              )} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
              color: theme.palette.secondary.main,
            
              '&:hover': {
                background: `linear-gradient(145deg, ${alpha(
                  theme.palette.secondary.main,
                  0.15
                )} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                                boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.2)}`
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
              height: isMobile ? '18px' : '22px',
              fontSize: isMobile ? '0.55rem' : '0.65rem',
              borderRadius: '8px',
              px: isMobile ? 0.6 : 1,
              background: `linear-gradient(145deg, ${alpha(
                theme.palette.background.paper,
                0.95
              )} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              color: theme.palette.text.primary,
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: 'auto',
            
              '&:hover': {
                background: `linear-gradient(145deg, ${alpha(
                  theme.palette.primary.main,
                  0.1
                )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                color: theme.palette.primary.main,
                                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
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
            height: isMobile ? '18px' : '26px',
            fontSize: isMobile ? '0.55rem' : '0.75rem',
            borderRadius: '8px',
            px: isMobile ? 0.5 : 1,
            background: `linear-gradient(145deg, ${alpha(
              theme.palette.primary.main,
              0.1
            )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            color: theme.palette.primary.main,
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: 'auto',
          
            '&:hover': {
              background: `linear-gradient(145deg, ${alpha(
                theme.palette.primary.main,
                0.15
              )} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
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
