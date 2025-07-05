import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import Decimal from 'decimal.js';
import CryptoJS from 'crypto-js';
// Material
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
  IconButton,
  Select,
  MenuItem,
  Avatar,
  alpha
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
// Loader
import { PulseLoader } from 'react-spinners';
// Utils
import { normalizeCurrencyCodeXummImpl } from 'src/utils/normalizers';
import { currencySymbols } from 'src/utils/constants';
// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
// Components
import TrustLineRow from './TrustLineRow';
import useWebSocket from 'react-use-websocket';
import { selectMetrics, update_metrics } from 'src/redux/statusSlice';
import { useDispatch, useSelector } from 'react-redux';

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.substr(0, n - 1) + ' ...' : str;
}

function truncateAccount(str) {
  if (!str) return '';
  return str.slice(0, 9) + '...' + str.slice(-9);
}

const trustlineFlags = {
  lsfLowReserve: 0x00010000,
  lsfHighReserve: 0x00020000,
  lsfLowAuth: 0x00040000,
  lsfHighAuth: 0x00080000,
  lsfLowNoRipple: 0x00100000,
  lsfHighNoRipple: 0x00200000,
  lsfLowFreeze: 0x00400000,
  lsfHighFreeze: 0x00800000
};

// Function to get color based on percentage
const getPercentageColor = (percentage) => {
  if (percentage <= 20) {
    // Green for low percentages (0-20%)
    return '#007B55';
  } else if (percentage <= 50) {
    // Transition from green to yellow (20-50%)
    const ratio = (percentage - 20) / 30;
    const r = Math.round(0 + (255 - 0) * ratio);
    const g = Math.round(123 + (193 - 123) * ratio);
    const b = Math.round(85 + (7 - 85) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Transition from yellow to red (50%+)
    const ratio = Math.min((percentage - 50) / 30, 1);
    const r = Math.round(255 + (244 - 255) * ratio);
    const g = Math.round(193 + (67 - 193) * ratio);
    const b = Math.round(7 + (54 - 7) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  }
};

export default function TrustLines({ account, xrpBalance, onUpdateTotalValue, onTrustlinesData }) {
  const BASE_URL = process.env.API_URL;

  const theme = useTheme();
  const { accountProfile, openSnackbar, sync, activeFiatCurrency, darkMode } =
    useContext(AppContext);
  const isLoggedIn = accountProfile && accountProfile.account;
  const isMobile = useMediaQuery('(max-width:600px)');
  const dispatch = useDispatch();
  const metrics = useSelector(selectMetrics);
  const exchRate = metrics[activeFiatCurrency];

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [lines, setLines] = useState([]);
  const [totalValue, setTotalValue] = useState(0);

  const WSS_FEED_URL = 'wss://api.xrpl.to/ws/sync';

  const { sendJsonMessage, getWebSocket } = useWebSocket(WSS_FEED_URL, {
    onOpen: () => {},
    onClose: () => {},
    shouldReconnect: (closeEvent) => true,
    onMessage: (event) => processMessages(event)
  });

  const processMessages = (event) => {
    try {
      var t1 = Date.now();
      const json = JSON.parse(event.data);
      dispatch(update_metrics(json));
    } catch (err) {
      console.error(err);
    }
  };

  const getLines = () => {
    setLoading(true);
    axios
      .get(`https://api.xrpl.to/api/trustlines?account=${account}&includeRates=true&limit=400`)
      .then((res) => {
        let ret = res.status === 200 ? res.data : undefined;
        if (ret && ret.success) {
          setTotal(ret.total);
          setLines(ret.trustlines);
          const totalValue = ret.trustlines.reduce((acc, line) => {
            const value = parseFloat(line.value) || 0;
            return acc + value;
          }, 0);
          setTotalValue(totalValue);
        }
      })
      .catch((err) => {
        console.log('Error on getting account lines!!!', err);
      })
      .then(function () {
        setLoading(false);
      });
  };

  useEffect(() => {
    getLines();
  }, [account, sync]);

  useEffect(() => {
    const trustlinesSum = lines.reduce((acc, line) => {
      const value = parseFloat(line.value) || 0;
      return acc + value;
    }, 0);

    const xrpValue = (xrpBalance || 0) * (exchRate || 1);
    const totalSum = trustlinesSum + xrpValue;

    setTotalValue(totalSum);

    if (typeof onUpdateTotalValue === 'function') {
      onUpdateTotalValue(totalSum);
    }

    if (typeof onTrustlinesData === 'function') {
      // Include XRP as the first item in trustlines data
      const allAssets = xrpBalance
        ? [
            {
              currency: 'XRP',
              balance: xrpBalance,
              value: xrpValue,
              issuer: null,
              md5: '84e5efeb89c4eae8f68188982dc290d8' // XRP's md5 hash
            },
            ...lines
          ]
        : lines;
      onTrustlinesData(allAssets);
    }
  }, [lines, xrpBalance, exchRate, onUpdateTotalValue, onTrustlinesData]);

  const tableRef = useRef(null);

  const handleChangePage = (newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedLines = lines.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      {loading ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            py: 8,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            backdropFilter: 'blur(10px)'
          }}
        >
          <PulseLoader color={theme.palette.primary.main} size={12} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontWeight: 500 }}>
            Loading your assets...
          </Typography>
        </Stack>
      ) : (
        lines &&
        lines.length === 0 && (
          <Stack
            direction="column"
            alignItems="center"
            justifyContent="center"
            spacing={2}
            sx={{
              py: 8,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              backdropFilter: 'blur(10px)'
            }}
          >
            <Box
              sx={{
                p: 2,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
              }}
            >
              <ErrorOutlineIcon
                sx={{
                  fontSize: 32,
                  color: theme.palette.primary.main,
                  opacity: 0.7
                }}
              />
            </Box>
            <Stack spacing={0.5} textAlign="center">
              <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
                No TrustLines Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This account doesn't have any token trustlines yet
              </Typography>
            </Stack>
          </Stack>
        )
      )}

      {(total > 0 || (xrpBalance !== null && xrpBalance !== undefined)) && (
        <Box
          sx={{
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 50%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
            borderRadius: 3,
            p: 0,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
            }
          }}
          ref={tableRef}
        >
          <Table
            size="small"
            sx={{
              '& .MuiTableCell-root': {
                py: 1.5,
                px: isMobile ? 1 : 2,
                fontSize: '0.875rem',
                lineHeight: 1.4,
                borderBottom: 'none'
              },
              '& .MuiTableBody-root .MuiTableRow-root': {
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.12)}`,
                  '& .MuiTableCell-root': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08)
                  }
                },
                '&:not(:last-child)': {
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
                }
              }
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: 'none',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
                    backdropFilter: 'blur(10px)',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                    }
                  }}
                >
                  Currency
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    display: { xs: 'none', sm: 'table-cell' },
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: 'none',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
                    backdropFilter: 'blur(10px)',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                    }
                  }}
                >
                  Balance
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: 'none',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
                    backdropFilter: 'blur(10px)',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                    }
                  }}
                >
                  Value ({activeFiatCurrency})
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    display: { xs: 'none', md: 'table-cell' },
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: 'none',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
                    backdropFilter: 'blur(10px)',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                    }
                  }}
                >
                  % Owned
                </TableCell>
                {isLoggedIn && accountProfile?.account === account && (
                  <TableCell
                    align="center"
                    sx={{
                      color: theme.palette.primary.main,
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: 'none',
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
                      backdropFilter: 'blur(10px)',
                      position: 'relative',
                      width: '80px',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                      }
                    }}
                  >
                    Action
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {xrpBalance && page === 0 && (
                <TableRow
                  sx={{
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04)
                    }
                  }}
                >
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          position: 'relative',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: -2,
                            left: -2,
                            right: -2,
                            bottom: -2,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            borderRadius: '12px',
                            zIndex: 0,
                            opacity: 0.4
                          }
                        }}
                      >
                        <Avatar
                          alt="XRP"
                          src="/xrp.svg"
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px 0 rgba(0,0,0,0.15)',
                            backgroundColor:
                              theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#fff',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            zIndex: 1,
                            '&:hover': {
                              transform: 'scale(1.1) rotate(5deg)',
                              boxShadow: '0 8px 25px 0 rgba(0,0,0,0.2)'
                            },
                            '& img': {
                              objectFit: 'contain',
                              width: '100%',
                              height: '100%',
                              borderRadius: '8px',
                              padding: '2px'
                            }
                          }}
                        />
                      </Box>
                      <Stack spacing={0.5}>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                          }}
                        >
                          XRP
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.secondary,
                            fontSize: '0.75rem',
                            fontWeight: 500
                          }}
                        >
                          Native Asset
                        </Typography>
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      display: { xs: 'none', sm: 'table-cell' }
                    }}
                  >
                    <Typography variant="body2" noWrap>
                      {new Decimal(xrpBalance).toDP(2, Decimal.ROUND_DOWN).toString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" noWrap>
                      {currencySymbols[activeFiatCurrency]}
                      {new Decimal((xrpBalance || 0) * (exchRate || 1))
                        .toDP(2, Decimal.ROUND_DOWN)
                        .toString()}
                    </Typography>
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      display: { xs: 'none', md: 'table-cell' }
                    }}
                  >
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{
                        color:
                          xrpBalance > 0
                            ? getPercentageColor((parseFloat(xrpBalance) / 99_990_000_000) * 100)
                            : theme.palette.text.primary,
                        fontWeight: 600
                      }}
                    >
                      {xrpBalance > 0
                        ? ((parseFloat(xrpBalance) / 99_990_000_000) * 100).toFixed(12)
                        : '0.000000000000'}
                      %
                    </Typography>
                  </TableCell>
                  {isLoggedIn && accountProfile?.account === account && (
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    </TableCell>
                  )}
                </TableRow>
              )}
              {paginatedLines
                .filter((line) => line.currency !== 'XRP')
                .map((line, idx) => (
                  <TrustLineRow key={idx} line={line} />
                ))}
            </TableBody>
          </Table>
        </Box>
      )}
      {total > 0 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            px: 3,
            py: 2,
            gap: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
            borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
              backdropFilter: 'blur(20px)',
              borderRadius: 2,
              px: 2,
              py: 1,
              minHeight: '48px',
              border: `2px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                opacity: 0.6
              }
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              {`${page + 1} / ${Math.ceil(total / rowsPerPage)} pages`}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                borderLeft: `2px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                pl: 2
              }}
            >
              <IconButton
                onClick={() => handleChangePage(page - 1)}
                disabled={page === 0}
                size="small"
                sx={{
                  color: theme.palette.primary.main,
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.15)} 100%)`,
                    borderColor: theme.palette.primary.main,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                  },
                  '&.Mui-disabled': {
                    color: alpha(theme.palette.primary.main, 0.3),
                    borderColor: alpha(theme.palette.primary.main, 0.1),
                    background: alpha(theme.palette.primary.main, 0.02),
                    transform: 'none',
                    boxShadow: 'none'
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: '22px'
                  }
                }}
              >
                <KeyboardArrowLeft />
              </IconButton>
              <IconButton
                onClick={() => handleChangePage(page + 1)}
                disabled={page >= Math.ceil(total / rowsPerPage) - 1}
                size="small"
                sx={{
                  color: theme.palette.primary.main,
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.15)} 100%)`,
                    borderColor: theme.palette.primary.main,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                  },
                  '&.Mui-disabled': {
                    color: alpha(theme.palette.primary.main, 0.3),
                    borderColor: alpha(theme.palette.primary.main, 0.1),
                    background: alpha(theme.palette.primary.main, 0.02),
                    transform: 'none',
                    boxShadow: 'none'
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: '22px'
                  }
                }}
              >
                <KeyboardArrowRight />
              </IconButton>
            </Box>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
              backdropFilter: 'blur(20px)',
              borderRadius: 2,
              px: 2,
              py: 1,
              minHeight: '48px',
              boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
              border: `2px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                opacity: 0.6
              }
            }}
          >
            <Select
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              size="small"
              sx={{
                height: '36px',
                width: '50px',
                minWidth: '50px',
                color: theme.palette.primary.main,
                '.MuiSelect-select': {
                  py: 0,
                  px: 0,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  letterSpacing: '0.5px',
                  marginRight: '-8px',
                  paddingLeft: '4px'
                },
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.primary.main, 0.25),
                  borderWidth: '2px',
                  borderRadius: '8px'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.primary.main, 0.5)
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                  borderWidth: '2px'
                },
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    mt: 1,
                    borderRadius: '8px',
                    boxShadow: theme.shadows[8],
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                    backdropFilter: 'blur(20px)',
                    '.MuiMenuItem-root': {
                      color: theme.palette.primary.main,
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      letterSpacing: '0.5px',
                      py: 1.5,
                      fontWeight: 600,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
                      },
                      '&.Mui-selected': {
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.15)} 100%)`,
                        '&:hover': {
                          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.25)} 0%, ${alpha(theme.palette.secondary.main, 0.18)} 100%)`
                        }
                      }
                    }
                  }
                }
              }}
            >
              {[10, 25, 50].map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 600,
                fontSize: '0.9rem',
                whiteSpace: 'nowrap'
              }}
            >
              items / page
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
