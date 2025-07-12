import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  IconButton,
  Link,
  Tooltip,
  Paper,
  Stack,
  Chip,
  useTheme,
  useMediaQuery,
  Alert,
  Button,
  Skeleton,
  alpha
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { fNumber, fPercent } from 'src/utils/formatNumber';
import { currencySymbols } from 'src/utils/constants';
import RichListToolbar from './RichListToolbar';

// Exchange mapping
const EXCHANGE_ADDRESSES = {
  rNU4eAowPuixS5ZCWaRL72UUeKgxcKExpK: 'Binance',
  rDAE53VfMvftPB4ogpWGWvzkQxfht6JPxr: 'Binance',
  rfQ9EcLkU6WnNmkS3EwUkFeXeN47Rk8Cvi: 'Binance',
  rarG6FaeYhnzSKSS5EEPofo4gFsPn2bZKk: 'Binance',
  rBtttd61FExHC68vsZ8dqmS3DfjFEceA1A: 'Binance',
  rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh: 'Binance',
  rJb5KsHsDHF1YS5B5DU6QCkH5NsPaKQTcy: 'Binance',
  rhWj9gaovwu2hZxYW7p388P8GRbuXFLQkK: 'Binance',
  rK7D3QnTrYdkp1fGKKzHFNXZpqN8dUCfaf: 'Coinfield',
  rLoD9U2ghXP2xUYbtML6G6v1p8LhM9mSnc: 'Bitstamp',
  rUzWJkXyEtT8ekSSxkBYPqCvHpngcy6Fks: 'OKX',
  rnW8je5SsuFjkMSWkgfXvqZH3gLTpXxfFH: 'Mercado Bitcoin',
  rEeEWeP88cpKUddKk37B2EZeiHBGiBXY3: 'Binance.US',
  rnd8KJ4qeip6FPJvC1fyv82nW2Lm8C8KjQ: 'Snapswap',
  rBRVqcXrm1YAbanngTxDfH15LNb6TjNmxk: 'Snapswap',
  rDCgaaSBAWYfsxUYhCk1n26Na7x8PQGmkq: 'Poloniex',
  rKKbNYZRqwPgZYkFWvqNUFBuscEyiFyCE: 'Changenow',
  rhotcWYdfn6qxhVMbPKGDF3XCKqwXar5J4: 'Gatehub',
  rD4G6gtD2KwHqsRf7pcyA8r1neUzXT61ix: 'Bitgo',
  r3ztejgGSdZNTXiUUMGYLLq93ibpRquQwM: 'Bitgo',
  r3S8AV7DQ6URd9qhKkDc2vD6XCaNU34328: 'NEXO',
  rwADc5YVbAfDmRyjbqPoG48H5jmnbD2xV5: 'NEXO',
  rbrCJQZVk6jYra1MPuSvX3Vpe4to9fAvh: 'Bitpanda',
  rrpNnNLKrartuEqfJGpqyDwPj1AFPg9vn1: 'Bitstamp',
  rDsbeomae4FXwgQTJp9Rs64Qg9vDiTCdBv: 'Bitstamp',
  rGFuMiw48HdbnrUbkRYuitXTmfrDBNTCnX: 'Bitstamp',
  rPVMhWBsfF9iMXYj3aAzJVkPDTFNSyWdKy: 'Bittrex',
  rBgnUKAEiFhCRLPoYNPPe3JUWayRjP6Ayg: 'CoinSpot',
  rfNLrtuCRys9wMUAvQDTvBoQ9wQzsQBbGn: 'Bitgo',
  rEW8BjpMyFZfGMjqbykbhpnr4KEb2qr6PC: 'Kucoin',
  rhSmsXurfnFV4gpaqP6eJHAm9m2afrgL7h: 'Kucoin',
  rLpvuHZFE46NUyZH5XaMvmYRJZF7aory7t: 'Kucoin',
  r3ch8xGMeegCAJrCYiZe47GdnYVvKMfpdr: 'Coinsquare',
  rBxszqhQkhPALtkSpGuVeqR6hNtZ8xTH3T: 'Kucoin',
  rp4gqz1XdqMsWRZbzPdPAQWw1tg5LuwUVP: 'Kucoin',
  rpVTz6jPYE3HbXX7RmCUMCirBYcfJU2q4j: 'Thodex',
  rHcFoo6a9qT5NHiVn1THQRhsEGcxtYCV4d: 'Gate.io',
  rDKsbvy9uaNpPtvVFraJyNGfjvTw8xivgK: 'HitBTC',
  rwpMvfxoodXggJ1g4qv6MWAPQqWDwQyHUW: 'HitBTC',
  rLCmrXtyLNSma1g4YPpnwWF664zGaUhMc8: 'HitBTC',
  rNUyxNugxv67vhQZZCif2Ru1Hb4APNmwUS: 'HitBTC',
  rnvV2fcH4LK2mnHQaeAus7RvRXUxijVBnT: 'Coinbase',
  rKrYJvto1MH2QT3KV8MiZdc2NaSZztDSf: 'Coinbase',
  rJXrgcmqaqKZnCE4TqEdbMxwJUbFVcpy27: 'Coinbase',
  rPPBKe3eUjPNer5FUrEVJDK7kofTjYSS1v: 'Coinbase',
  rLHzPsX6oXkzU2qL12kHCH8G8cnZv1rBJh: 'Kraken',
  rfexLLNpC6dqyLagjV439EyvfqdYNHsWSH: 'Huobi',
  raTQAD4isuvnGERc1jBhiFBpoTYMwQG7Yi: 'Huobi',
  rMvCasZ9cohYrSZRNYPTZfoaaSUQMfgQ8G: 'Bybit',
  rfKsmLP6sTfVGDvga6rW6XbmSFUzc3G9f3: 'Bitrue',
  raLPjTYeGezfdb6crXZzcC8RkLBEwbBHJ5: 'Bitrue',
  rs2dgzYeqYqsk8bvkQR5YPyqsXYcA24MP2: 'MXC',
  rMdG3ju8pgyVh29ELPWaDuA74CpWW6Fxns: 'Uphold',
  rQrQMKhcw3WnptGeWiYSwX5Tz3otyJqPnq: 'Uphold',
  rKfzfrk1RsUxWmHimWyNwk8AoWHoFneu4m: 'Uphold',
  r4DymtkgUAh2wqRxVfdd3Xtswzim6eC6c5: 'Crypto.com',
  rRmgo6NW1W7GHjC5qEpcpQnq8NE74ZS1P: 'Coinbase',
  r4sRyacXpbh4HbagmgfoQq8Q3j8ZJzbZ1J: 'Coinbase',
  rLNaPoKeeBjZe2qs6x52yVPZpZ8td4dc6w: 'Coinbase',
  rwpTh9DDa52XkM9nTKp2QrJuCGV5d1mQVP: 'Coinbase',
  rw2ciyaNshpHe7bCHo4bRWq6pqqynnWKQg: 'Coinbase',
  rUjfTQpvBr6wsGGxMw6sRmRQGG76nvp8Ln: 'Coinbase',
  rwWr7KUZ3ZFwzgaDGjKBysADByzxvohQ3C: 'Bitcoin.co.id',
  rffGCKC7Mk4cQ5aUGg8pfRe3MPC7Cy8gfe: 'FixedFloat',
  rKwWsi1XWCevQmVL9VhPD8DuYF4dobFdoT: 'Unknown Exchange'
};

const truncateAddress = (address, length = 8) => {
  if (!address) return '';
  return `${address.slice(0, length)}...${address.slice(-4)}`;
};

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Tooltip title={copied ? 'Copied!' : 'Copy Address'}>
      <IconButton size="small" onClick={handleCopy}>
        <ContentCopyIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Tooltip>
  );
};

const RichListRow = ({ row, index, token, metrics, activeFiatCurrency, theme }) => {
  const { id, account, balance, holding, freeze } = row;
  const value = useMemo(() => {
    if (!token?.exch || !balance) return 0;
    return (token.exch * balance) / metrics[activeFiatCurrency];
  }, [token?.exch, balance, metrics, activeFiatCurrency]);

  const change24h = useMemo(() => {
    if (!row.balance24h) return null;
    const change = balance - row.balance24h;
    const percentChange = row.balance24h ? (change / row.balance24h) * 100 : 0;
    return {
      value: change,
      percent: percentChange,
      isPositive: change >= 0
    };
  }, [balance, row.balance24h]);

  const bgColor = 'transparent';

  return (
    <TableRow
      hover
      sx={{
        backgroundColor: 'transparent',
        '&:hover': {
          backgroundColor: alpha(theme.palette.action.hover, 0.04)
        }
      }}
    >
      <TableCell>{id}</TableCell>
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Link
            href={`https://bithomp.com/explorer/${account}`}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
          >
            <Typography variant="body2" color="primary">
              {truncateAddress(account, 12)}
            </Typography>
          </Link>
          {EXCHANGE_ADDRESSES[account] && (
            <Chip
              label={EXCHANGE_ADDRESSES[account]}
              size="small"
              color="primary"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}
          <CopyButton text={account} />
        </Stack>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2">{fNumber(balance)}</Typography>
      </TableCell>
      <TableCell align="right">
        {change24h && (
          <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.5}>
            {change24h.isPositive ? (
              <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
            )}
            <Typography
              variant="body2"
              color={change24h.isPositive ? 'success.main' : 'error.main'}
              fontWeight="medium"
            >
              {change24h.isPositive ? '+' : '-'}{fNumber(Math.abs(change24h.value))} ({fPercent(Math.abs(change24h.percent))})
            </Typography>
          </Stack>
        )}
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2">{holding}%</Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" fontWeight="medium">
          {currencySymbols[activeFiatCurrency]} {fNumber(value)}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Stack direction="row" spacing={1} justifyContent="center">
          <Tooltip title="View on Explorer">
            <IconButton
              size="small"
              href={`https://bithomp.com/explorer/${account}`}
              target="_blank"
              rel="noopener noreferrer"
              component="a"
            >
              <LinkIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
};

const MobileRichListCard = ({ row, token, metrics, activeFiatCurrency, theme }) => {
  const { id, account, balance, holding } = row;
  const value = useMemo(() => {
    if (!token?.exch || !balance) return 0;
    return (token.exch * balance) / metrics[activeFiatCurrency];
  }, [token?.exch, balance, metrics, activeFiatCurrency]);

  const change24h = useMemo(() => {
    if (!row.balance24h) return null;
    const change = balance - row.balance24h;
    const percentChange = row.balance24h ? (change / row.balance24h) * 100 : 0;
    return {
      value: change,
      percent: percentChange,
      isPositive: change >= 0
    };
  }, [balance, row.balance24h]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 1,
        borderRadius: 2,
        backgroundColor: 'transparent',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        boxShadow: `
          0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
          0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
          inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" color="text.secondary">
              #{id}
            </Typography>
            <Link
              href={`https://bithomp.com/explorer/${account}`}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
            >
              <Typography variant="body2" color="primary" fontWeight="medium">
                {truncateAddress(account, 8)}
              </Typography>
            </Link>
            {EXCHANGE_ADDRESSES[account] && (
              <Chip
                label={EXCHANGE_ADDRESSES[account]}
                size="small"
                color="primary"
                sx={{ height: 18, fontSize: '0.65rem' }}
              />
            )}
          </Stack>
          <CopyButton text={account} />
        </Stack>

        <Stack direction="row" justifyContent="space-between">
          <Stack>
            <Typography variant="caption" color="text.secondary">
              Balance
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {fNumber(balance)}
            </Typography>
          </Stack>
          {change24h && (
            <Stack alignItems="center">
              <Typography variant="caption" color="text.secondary">
                24h Change
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {change24h.isPositive ? (
                  <TrendingUpIcon sx={{ fontSize: 14, color: 'success.main' }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 14, color: 'error.main' }} />
                )}
                <Typography
                  variant="caption"
                  color={change24h.isPositive ? 'success.main' : 'error.main'}
                  fontWeight="medium"
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  {change24h.isPositive ? '+' : '-'}{fNumber(Math.abs(change24h.value))} ({fPercent(Math.abs(change24h.percent))})
                </Typography>
              </Stack>
            </Stack>
          )}
          <Stack alignItems="flex-end">
            <Typography variant="caption" color="text.secondary">
              Holdings
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {holding}%
            </Typography>
          </Stack>
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack>
            <Typography variant="caption" color="text.secondary">
              Value
            </Typography>
            <Typography variant="body1" fontWeight="bold" color="primary">
              {currencySymbols[activeFiatCurrency]} {fNumber(value)}
            </Typography>
          </Stack>
          <Tooltip title="View on Explorer">
            <IconButton
              size="small"
              href={`https://bithomp.com/explorer/${account}`}
              target="_blank"
              rel="noopener noreferrer"
              component="a"
            >
              <LinkIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
};

const RichListData = ({ token }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const metrics = useSelector(selectMetrics);
  const { activeFiatCurrency } = useContext(AppContext);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [richList, setRichList] = useState([]);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const API_URL = process.env.API_URL || 'https://api.xrpl.to/api';

  const fetchRichList = useCallback(async () => {
    if (!token?.md5) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `${API_URL}/richlist/${token.md5}`,
        {
          params: {
            start: page * rows,
            limit: rows,
            sortBy: 'balance',
            sortType: 'desc'
          },
          timeout: 30000
        }
      );

      if (response.data && response.data.richList) {
        setRichList(response.data.richList);
        setTotalCount(response.data.length || response.data.richList.length);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching rich list:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load rich list data');
      setRichList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token?.md5, page, rows, API_URL]);

  useEffect(() => {
    fetchRichList();
  }, [fetchRichList]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRichList();
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRowsChange = (newRows) => {
    setRows(newRows);
    setPage(0);
  };

  if (loading && !refreshing) {
    return (
      <Box sx={{ p: 3 }}>
        <Stack spacing={2}>
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={60} />
          ))}
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!richList.length) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No rich list data available
        </Typography>
        <Button 
          startIcon={<RefreshIcon />} 
          onClick={handleRefresh}
          sx={{ mt: 2 }}
        >
          Refresh
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">
          Top {token?.name || 'Token'} Holders
        </Typography>
        <IconButton onClick={handleRefresh} disabled={refreshing}>
          <RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
        </IconButton>
      </Stack>

      {isMobile ? (
        <Stack spacing={1}>
          {richList.map((row) => (
            <MobileRichListCard
              key={row.id}
              row={row}
              token={token}
              metrics={metrics}
              activeFiatCurrency={activeFiatCurrency}
              theme={theme}
            />
          ))}
        </Stack>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ 
          backgroundColor: 'transparent',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          borderRadius: '12px',
          boxShadow: `
            0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
            0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
            inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`
        }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Address</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  Balance ({token?.name})
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  24h Change
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  Holdings
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  Value ({activeFiatCurrency})
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {richList.map((row, index) => (
                <RichListRow
                  key={row.id}
                  row={row}
                  index={index}
                  token={token}
                  metrics={metrics}
                  activeFiatCurrency={activeFiatCurrency}
                  theme={theme}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <RichListToolbar
        count={totalCount}
        rows={rows}
        setRows={handleRowsChange}
        page={page}
        setPage={handlePageChange}
      />
    </Box>
  );
};

export default RichListData;