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
import ListToolbar from 'src/account/ListToolbar';
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
      .get(
        `https://api.xrpl.to/api/trustlines?account=${account}&includeRates=true&limit=${rowsPerPage}&offset=${
          page * rowsPerPage
        }`
      )
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
  }, [account, sync, page, rowsPerPage]);

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

  return (
    <Box>
      {loading ? (
        <Stack alignItems="center">
          <PulseLoader color={darkMode ? '#007B55' : '#5569ff'} size={10} />
        </Stack>
      ) : (
        lines &&
        lines.length === 0 && (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={1}
            sx={{
              py: 4,
              opacity: 0.8
            }}
          >
            <ErrorOutlineIcon fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              No TrustLines
            </Typography>
          </Stack>
        )
      )}

      {(total > 0 || (xrpBalance !== null && xrpBalance !== undefined)) && (
        <Box
          sx={{
            background: darkMode
              ? `linear-gradient(${alpha(theme.palette.primary.main, 0.05)}, ${alpha(
                  theme.palette.primary.main,
                  0.02
                )})`
              : `linear-gradient(${alpha(theme.palette.primary.main, 0.02)}, ${alpha(
                  theme.palette.primary.main,
                  0.01
                )})`,
            borderRadius: 2,
            p: isMobile ? 0.5 : 1,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            display: 'flex',
            flexDirection: 'column'
          }}
          ref={tableRef}
        >
          <Table
            size="small"
            sx={{
              '& .MuiTableCell-root': {
                py: 0.75,
                px: isMobile ? 0.5 : 1,
                fontSize: '0.875rem',
                lineHeight: 1.2
              }
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 'bold',
                    borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    background: alpha(theme.palette.primary.main, 0.03),
                    '&:first-of-type': {
                      borderTopLeftRadius: 8
                    },
                    '&:last-child': {
                      borderTopRightRadius: 8
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
                    fontWeight: 'bold',
                    borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    background: alpha(theme.palette.primary.main, 0.03)
                  }}
                >
                  Balance
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 'bold',
                    borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    background: alpha(theme.palette.primary.main, 0.03)
                  }}
                >
                  Value
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    display: { xs: 'none', md: 'table-cell' },
                    color: theme.palette.primary.main,
                    fontWeight: 'bold',
                    borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    background: alpha(theme.palette.primary.main, 0.03)
                  }}
                >
                  % Owned
                </TableCell>
                {isLoggedIn && accountProfile?.account === account && (
                  <TableCell
                    align="center"
                    sx={{
                      color: theme.palette.primary.main,
                      fontWeight: 'bold',
                      borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      background: alpha(theme.palette.primary.main, 0.03),
                      width: '48px'
                    }}
                  >
                    Action
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {/* XRP Balance Row */}
              {xrpBalance !== null && xrpBalance !== undefined && (
                <TableRow
                  sx={{
                    position: 'relative',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: (theme) =>
                        `0 0 8px 0 ${
                          theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.05)'
                        }`,
                      '& .MuiTableCell-root': {
                        backgroundColor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.04)'
                            : 'rgba(0, 0, 0, 0.02)'
                      }
                    },
                    '& .MuiTableCell-root': {
                      padding: '8px 16px',
                      height: '60px',
                      borderBottom: (theme) =>
                        `1px solid ${
                          theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.08)'
                        }`,
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}
                >
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        src="https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8"
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px 0 rgba(0,0,0,0.1)',
                          backgroundColor: (theme) =>
                            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#fff',
                          transition: 'transform 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'scale(1.1)'
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
                      <Box>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <Typography
                            variant="subtitle2"
                            noWrap
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              letterSpacing: '0.015em'
                            }}
                          >
                            XRP
                          </Typography>
                        </Stack>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          sx={{
                            lineHeight: 1.2,
                            fontSize: '0.75rem',
                            opacity: 0.9,
                            mt: 0.5
                          }}
                        >
                          Native Currency
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      display: { xs: 'none', sm: 'table-cell' }
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      noWrap
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        fontFamily: 'monospace'
                      }}
                    >
                      {(() => {
                        const num = Number(xrpBalance);
                        if (num === 0) return '0';
                        if (num < 0.000001) return num.toExponential(2);
                        if (num < 1) return num.toFixed(6).replace(/\.?0+$/, '');
                        return num.toLocaleString('en-US', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: num < 1000 ? 4 : 2
                        });
                      })()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="subtitle2"
                      noWrap
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        color: (theme) => theme.palette.primary.main
                      }}
                    >
                      {currencySymbols[activeFiatCurrency]}
                      {(() => {
                        const value = xrpBalance * (exchRate || 1);
                        if (isNaN(value) || value === 0) return '0.00';
                        return value.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        });
                      })()}
                    </Typography>
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      display: { xs: 'none', md: 'table-cell' }
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      noWrap
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}
                    >
                      -
                    </Typography>
                  </TableCell>
                  {isLoggedIn && accountProfile?.account === account && (
                    <TableCell align="center">
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontSize: '0.9rem',
                          color: 'text.secondary'
                        }}
                      >
                        -
                      </Typography>
                    </TableCell>
                  )}
                </TableRow>
              )}
              {lines.map((row, idx) => {
                const {
                  currency,
                  issuer,
                  balance,
                  limit,
                  rate,
                  value,
                  md5,
                  percentOwned,
                  verified,
                  origin,
                  user
                } = row;
                const currencyName = normalizeCurrencyCodeXummImpl(currency);

                return (
                  <TrustLineRow
                    key={idx}
                    currencyName={currencyName}
                    currency={currency}
                    balance={balance}
                    md5={md5}
                    exchRate={exchRate}
                    issuer={issuer}
                    account={account}
                    limit={limit}
                    percentOwned={percentOwned}
                    verified={verified}
                    rate={rate}
                    value={value}
                    origin={origin}
                    user={user}
                  />
                );
              })}
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
            borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            px: 2,
            minHeight: '52px',
            gap: 4,
            background: alpha(theme.palette.primary.main, 0.02)
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              background: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(8px)',
              borderRadius: 1.5,
              px: 1.5,
              py: 0.5,
              minHeight: '40px',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              boxShadow: theme.shadows[1]
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 500
              }}
            >
              {`${page + 1} / ${Math.ceil(total / rowsPerPage)} pages`}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 0.5,
                borderLeft: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                pl: 1
              }}
            >
              <IconButton
                onClick={() => handleChangePage(page - 1)}
                disabled={page === 0}
                size="small"
                sx={{
                  color: theme.palette.primary.main,
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  background: alpha(theme.palette.primary.main, 0.05),
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.15),
                    borderColor: theme.palette.primary.main
                  },
                  '&.Mui-disabled': {
                    color: alpha(theme.palette.primary.main, 0.3),
                    borderColor: alpha(theme.palette.primary.main, 0.1),
                    background: 'none'
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: '20px'
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
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  background: alpha(theme.palette.primary.main, 0.05),
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.15),
                    borderColor: theme.palette.primary.main
                  },
                  '&.Mui-disabled': {
                    color: alpha(theme.palette.primary.main, 0.3),
                    borderColor: alpha(theme.palette.primary.main, 0.1),
                    background: 'none'
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: '20px'
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
              gap: 1,
              background: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(8px)',
              borderRadius: 1.5,
              px: 1.5,
              py: 0.5,
              minHeight: '40px',
              boxShadow: theme.shadows[1],
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}
          >
            <Select
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              size="small"
              sx={{
                height: '32px',
                width: '44px',
                minWidth: '44px',
                color: theme.palette.primary.main,
                '.MuiSelect-select': {
                  py: 0,
                  px: 0,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  letterSpacing: '0.5px',
                  marginRight: '-8px',
                  paddingLeft: '4px'
                },
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                  borderWidth: '1px',
                  borderRadius: '6px'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.primary.main, 0.4)
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.primary.main, 0.4),
                  borderWidth: '1px'
                },
                background: alpha(theme.palette.primary.main, 0.05),
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.1)
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    mt: 1,
                    borderRadius: '6px',
                    boxShadow: theme.shadows[2],
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    '.MuiMenuItem-root': {
                      color: theme.palette.primary.main,
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      letterSpacing: '0.5px',
                      py: 1,
                      '&:hover': {
                        background: alpha(theme.palette.primary.main, 0.1)
                      },
                      '&.Mui-selected': {
                        background: alpha(theme.palette.primary.main, 0.08),
                        '&:hover': {
                          background: alpha(theme.palette.primary.main, 0.12)
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
                fontWeight: 500,
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                pr: 0.5
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
