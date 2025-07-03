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
import BearBullLabel from './BearBullLabel';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import IssuerInfoDialog from '../common/IssuerInfoDialog';

// Redux
import { useSelector /*, useDispatch*/ } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';

// Utils
import { fNumber, fNumberWithCurreny } from 'src/utils/formatNumber';

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
    paddingLeft: theme.spacing(2)
  },
  '&:last-of-type': {
    paddingRight: theme.spacing(2)
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
    pro24h,
    p24h,
    vol24h,
    vol24hxrp,
    vol24hx,
    marketcap,
    dom,
    issuer,
    issuer_info,
    creator
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
    return str.length > n ? str.substr(0, n - 1) + '... ' : str;
  }

  let user = token.user;
  if (!user) user = name;

  const voldivmarket =
    marketcap > 0 && vol24hxrp != null ? Decimal.div(vol24hxrp || 0, marketcap || 1).toNumber() : 0;
  const convertedMarketCap =
    marketcap != null && metrics[activeFiatCurrency] != null
      ? Decimal.div(marketcap || 0, metrics[activeFiatCurrency] || 1).toNumber()
      : 0;

  let strPc24h = fNumber(p24h < 0 ? -p24h : p24h);
  let strPc24hPrep = (p24h < 0 ? '-' : '') + currencySymbols[activeFiatCurrency];

  const handleOpenIssuerInfo = () => {
    setOpenIssuerInfo(true);
  };

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
          p: 2,
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
            fontSize: '1.1rem',
            fontWeight: 700,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.01em'
          }}
        >
          {name} Token Details
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
                  fontSize: '0.875rem'
                }}
                noWrap
              >
                Issuer
              </Typography>
            </ModernTableCell>
            <ModernTableCell align="left">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Chip
                  label={
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography variant="caption" sx={{ fontWeight: 500 }}>
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
                    pl: 1,
                    pr: 1,
                    borderRadius: '8px',
                    height: '28px',
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
                        p: 0.75,
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
                          width: 14,
                          height: 14,
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
                    fontSize: '0.875rem'
                  }}
                  noWrap
                >
                  Creator
                </Typography>
              </ModernTableCell>
              <ModernTableCell align="left">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Chip
                    label={
                      <Typography variant="caption" sx={{ fontWeight: 500 }}>
                        {truncate(creator, 16)}
                      </Typography>
                    }
                    size="small"
                    sx={{
                      pl: 1,
                      pr: 1,
                      borderRadius: '8px',
                      height: '28px',
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
                          p: 0.75,
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
                            width: 14,
                            height: 14,
                            color: theme.palette.secondary.main
                          }}
                        />
                      </IconButton>
                    </Tooltip>
                  </CopyToClipboard>
                  {creations > 0 && (
                    <Tooltip title="Number of tokens created by this creator.">
                      <Chip
                        label={`${creations} creation${creations > 1 ? 's' : ''}`}
                        size="small"
                        sx={{
                          borderRadius: '8px',
                          height: '28px',
                          background: `linear-gradient(135deg, ${alpha(
                            theme.palette.info.main,
                            0.1
                          )} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                          backdropFilter: 'blur(8px)',
                          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                          color: theme.palette.info.main,
                          fontWeight: 500
                        }}
                      />
                    </Tooltip>
                  )}
                </Stack>
              </ModernTableCell>
            </TableRow>
          )}

          {/* Price Row */}
          <TableRow>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: alpha(theme.palette.text.primary, 0.9),
                  fontSize: '0.875rem'
                }}
                noWrap
              >
                {user} Price
              </Typography>
            </ModernTableCell>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${alpha(
                    theme.palette.success.main,
                    0.8
                  )} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                <NumberTooltip
                  prepend={currencySymbols[activeFiatCurrency]}
                  number={fNumberWithCurreny(exch, metrics[activeFiatCurrency])}
                />
              </Typography>
            </ModernTableCell>
          </TableRow>

          {/* Price Change Row */}
          <TableRow>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: alpha(theme.palette.text.primary, 0.9),
                  fontSize: '0.875rem'
                }}
                noWrap
              >
                Price Change
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    ml: 0.5,
                    px: 0.5,
                    py: 0.25,
                    borderRadius: '4px',
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.background.paper,
                      0.8
                    )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    color: alpha(theme.palette.text.secondary, 0.8)
                  }}
                >
                  24h
                </Box>
              </Typography>
            </ModernTableCell>
            <ModernTableCell align="left">
              <Stack spacing={0.5}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: pro24h >= 0 ? theme.palette.success.main : theme.palette.error.main
                  }}
                >
                  <NumberTooltip
                    prepend={strPc24hPrep}
                    number={fNumberWithCurreny(Number(strPc24h), metrics[activeFiatCurrency])}
                  />
                </Typography>
                <BearBullLabel value={pro24h} variant="small" />
              </Stack>
            </ModernTableCell>
          </TableRow>

          {/* 24h Low/High Row */}
          <TableRow>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: alpha(theme.palette.text.primary, 0.9),
                  fontSize: '0.875rem'
                }}
                noWrap
              >
                24h Low / 24h High
              </Typography>
            </ModernTableCell>
            <ModernTableCell align="left">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: theme.palette.success.main
                  }}
                >
                  <NumberTooltip
                    prepend={currencySymbols[activeFiatCurrency]}
                    number={fNumber(
                      Decimal.mul(
                        Decimal.mul(maxMin24h?.[1] || 0, metrics?.USD || 1),
                        1 / (metrics?.[activeFiatCurrency] || 1)
                      )
                    )}
                  />
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: alpha(theme.palette.text.secondary, 0.6) }}
                >
                  /
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: theme.palette.info.main
                  }}
                >
                  <NumberTooltip
                    prepend={currencySymbols[activeFiatCurrency]}
                    number={fNumber(
                      Decimal.mul(
                        Decimal.mul(maxMin24h?.[0] || 0, metrics?.USD || 1),
                        1 / (metrics?.[activeFiatCurrency] || 1)
                      )
                    )}
                  />
                </Typography>
              </Stack>
            </ModernTableCell>
          </TableRow>

          {/* Trading Volume Row */}
          <TableRow>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: alpha(theme.palette.text.primary, 0.9),
                  fontSize: '0.875rem'
                }}
                noWrap
              >
                Trading Volume
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    ml: 0.5,
                    px: 0.5,
                    py: 0.25,
                    borderRadius: '4px',
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.background.paper,
                      0.8
                    )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    color: alpha(theme.palette.text.secondary, 0.8)
                  }}
                >
                  24h
                </Box>
              </Typography>
            </ModernTableCell>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${alpha(
                    theme.palette.error.main,
                    0.8
                  )} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {currencySymbols[activeFiatCurrency]}
                {fNumber(vol24hxrp / metrics[activeFiatCurrency])}
              </Typography>
            </ModernTableCell>
          </TableRow>

          {/* Volume/Market Cap Row */}
          <TableRow>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: alpha(theme.palette.text.primary, 0.9),
                  fontSize: '0.875rem'
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
                  color: theme.palette.warning.main
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
                  fontSize: '0.875rem'
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
                  color: theme.palette.secondary.main
                }}
              >
                <NumberTooltip number={fNumber(dom || 0)} /> %
              </Typography>
            </ModernTableCell>
          </TableRow>

          {/* Market Rank Row */}
          <TableRow>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: alpha(theme.palette.text.primary, 0.9),
                  fontSize: '0.875rem'
                }}
                noWrap
              >
                Market Rank
              </Typography>
            </ModernTableCell>
            <ModernTableCell align="left">
              <Chip
                label={`#${id - 1}`}
                size="small"
                sx={{
                  borderRadius: '6px',
                  height: '24px',
                  fontSize: '0.75rem',
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  color: theme.palette.primary.main,
                  fontWeight: 600
                }}
              />
            </ModernTableCell>
          </TableRow>

          {/* Market Cap Row */}
          <TableRow>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: alpha(theme.palette.text.primary, 0.9),
                  fontSize: '0.875rem'
                }}
                noWrap
              >
                Market Cap
              </Typography>
            </ModernTableCell>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${alpha(
                    theme.palette.success.main,
                    0.8
                  )} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {currencySymbols[activeFiatCurrency]} {fNumber(convertedMarketCap)}
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
                  fontSize: '0.875rem'
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
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {currencySymbols[activeFiatCurrency]}{' '}
                {fNumber(amount * (exch / metrics[activeFiatCurrency]))}
              </Typography>
            </ModernTableCell>
          </TableRow>
        </TableBody>
      </StyledTable>
    </Box>
  );
}

PriceStatistics.propTypes = {
  token: PropTypes.object.isRequired
};
