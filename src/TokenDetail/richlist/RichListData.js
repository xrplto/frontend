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
  alpha,
  styled,
  keyframes,
  Card,
  CardContent,
  Pagination
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
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

// Define highlight animation with softer colors
const highlightAnimation = (theme) => keyframes`
  0% {
    background-color: ${theme.palette.primary.main}30;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px ${theme.palette.primary.main}40;
  }
  50% {
    background-color: ${theme.palette.primary.main}15;
    transform: translateY(0);
    box-shadow: 0 2px 4px ${theme.palette.primary.main}20;
  }
  100% {
    background-color: transparent;
    transform: translateY(0);
    box-shadow: none;
  }
`;

// Styled components with improved design
const HolderCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isNew'
})(({ theme, isNew }) => ({
  marginBottom: theme.spacing(0.5),
  borderRadius: '8px',
  backgroundColor: 'transparent',
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  boxShadow: `
    0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
    0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
    inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
  transition: 'all 0.3s ease-in-out',
  position: 'relative',
  overflow: 'hidden',
  animation: isNew ? `${highlightAnimation(theme)} 1s ease-in-out` : 'none',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: `
      0 12px 40px ${alpha(theme.palette.common.black, 0.15)}, 
      0 2px 4px ${alpha(theme.palette.common.black, 0.05)},
      inset 0 1px 1px ${alpha(theme.palette.common.white, 0.15)}`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
  }
}));

const BalanceIndicator = styled('div')(({ theme, balance }) => ({
  position: 'absolute',
  left: 0,
  top: 0,
  height: '100%',
  width: `${balance}%`,
  background: `linear-gradient(90deg, 
    ${theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.08)' : 'rgba(33, 150, 243, 0.05)'} 0%, 
    ${
      theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.02)' : 'rgba(33, 150, 243, 0.01)'
    } 100%)`,
  transition: 'width 0.3s ease-in-out',
  borderRadius: '12px'
}));

const StyledPagination = styled(Pagination)(({ theme }) => ({
  '& .MuiPaginationItem-root': {
    color: theme.palette.text.primary,
    borderRadius: '8px',
    margin: '0 2px',
    fontWeight: '500',
    '&:hover': {
      backgroundColor:
        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
    }
  },
  '& .Mui-selected': {
    backgroundColor: `${theme.palette.primary.main} !important`,
    color: '#fff !important',
    fontWeight: 'bold',
    borderRadius: '8px',
    '&:hover': {
      backgroundColor: `${theme.palette.primary.dark} !important`
    }
  }
}));

const ExchangeChip = styled(Chip)(({ theme }) => ({
  fontSize: '0.7rem',
  height: '24px',
  fontWeight: 'bold',
  borderRadius: '12px',
  backgroundColor: 'transparent',
  color: theme.palette.primary.main,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
  boxShadow: `
    0 2px 8px ${alpha(theme.palette.primary.main, 0.15)},
    inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`
}));

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
      <Stack spacing={1}>
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress size={40} thickness={4} />
        </Box>
      </Stack>
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
      <Stack spacing={1}>
        <Box
          sx={{
            textAlign: 'center',
            py: 6,
            backgroundColor: 'transparent',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            borderRadius: '12px',
            border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`,
            boxShadow: `
              0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
              0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
              inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Rich List Data
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Holder data will appear here when available
          </Typography>
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={handleRefresh}
            sx={{ mt: 2 }}
            variant="outlined"
            size="small"
          >
            Refresh
          </Button>
        </Box>
      </Stack>
    );
  }

  return (
    <Stack spacing={1}>
      {/* Table Headers with integrated title */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            md: '0.5fr 2.5fr 1.5fr 1.5fr 1fr 1.5fr 0.5fr'
          },
          gap: 2,
          p: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          backgroundColor: 'transparent',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          borderRadius: '8px 8px 0 0',
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          boxShadow: `
            0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
            0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
            inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
          '& > *': {
            fontWeight: 'bold',
            color: theme.palette.text.secondary,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }
        }}
      >
        <Typography sx={{ display: { xs: 'none', md: 'block' } }}>#</Typography>
        <Typography sx={{ display: { xs: 'none', md: 'block' } }}>Address</Typography>
        <Typography sx={{ display: { xs: 'none', md: 'block' } }}>Balance</Typography>
        <Typography sx={{ display: { xs: 'none', md: 'block' } }}>24h Change</Typography>
        <Typography sx={{ display: { xs: 'none', md: 'block' } }}>Holdings</Typography>
        <Typography sx={{ display: { xs: 'none', md: 'block' } }}>Value ({activeFiatCurrency})</Typography>
        <Typography sx={{ display: { xs: 'none', md: 'block' } }}></Typography>
      </Box>

      <Stack spacing={0.5}>
        {richList.map((row, index) => {
          // Calculate value directly without useMemo
          const value = (!token?.exch || !row.balance) ? 0 : (token.exch * row.balance) / metrics[activeFiatCurrency];

          // Calculate change24h directly without useMemo
          const change24h = (() => {
            if (!row.balance24h) return null;
            const change = row.balance - row.balance24h;
            const percentChange = row.balance24h ? (change / row.balance24h) * 100 : 0;
            return {
              value: change,
              percent: percentChange,
              isPositive: change >= 0
            };
          })();

          const balancePercentage = Math.min(100, Math.max(5, (row.holding || 0) * 10));
          
          return (
            <HolderCard key={row.id}>
              <BalanceIndicator balance={balancePercentage} />
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: '1fr 1fr',
                      md: '0.5fr 2.5fr 1.5fr 1.5fr 1fr 1.5fr 0.5fr'
                    },
                    gap: 1.5,
                    alignItems: 'center'
                  }}
                >
                  {/* Rank */}
                  <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                    <Typography
                      variant="body2"
                      fontWeight="600"
                      color="text.primary"
                      sx={{ fontSize: '0.85rem' }}
                    >
                      {row.id}
                    </Typography>
                  </Box>

                  {/* Address */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Link
                      href={`/profile/${row.account}`}
                      sx={{
                        textDecoration: 'none',
                        color: 'primary.main',
                        fontWeight: '500',
                        '&:hover': {
                          textDecoration: 'underline',
                          color: 'primary.dark'
                        }
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight="500"
                        sx={{ fontSize: '0.8rem', color: 'primary.main' }}
                      >
                        {truncateAddress(row.account, 12)}
                      </Typography>
                    </Link>
                    {EXCHANGE_ADDRESSES[row.account] && (
                      <ExchangeChip
                        label={EXCHANGE_ADDRESSES[row.account]}
                        size="small"
                      />
                    )}
                    <CopyButton text={row.account} />
                  </Box>

                  {/* Balance */}
                  <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: '0.7rem', display: { xs: 'block', md: 'none' } }}
                    >
                      Balance
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="600"
                      color="text.primary"
                      sx={{ fontSize: '0.85rem' }}
                    >
                      {fNumber(row.balance)}
                    </Typography>
                  </Box>

                  {/* 24h Change */}
                  <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: '0.7rem', display: { xs: 'block', md: 'none' } }}
                    >
                      24h Change
                    </Typography>
                    {change24h && (
                      <Stack direction="row" alignItems="center" justifyContent={{ xs: 'flex-start', md: 'flex-end' }} spacing={0.5}>
                        {change24h.isPositive ? (
                          <TrendingUpIcon sx={{ color: theme.palette.primary.main, fontSize: 14 }} />
                        ) : (
                          <TrendingDownIcon sx={{ color: '#F44336', fontSize: 14 }} />
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            color: change24h.isPositive ? theme.palette.primary.main : '#F44336',
                            fontWeight: 600,
                            fontSize: '0.85rem'
                          }}
                        >
                          {change24h.isPositive ? '+' : '-'}{fNumber(Math.abs(change24h.value))}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: change24h.isPositive ? theme.palette.primary.main : '#F44336',
                            fontSize: '0.75rem'
                          }}
                        >
                          ({fPercent(Math.abs(change24h.percent))})
                        </Typography>
                      </Stack>
                    )}
                  </Box>

                  {/* Holdings */}
                  <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: '0.7rem', display: { xs: 'block', md: 'none' } }}
                    >
                      Holdings
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="600"
                      color="text.primary"
                      sx={{ fontSize: '0.85rem' }}
                    >
                      {row.holding}%
                    </Typography>
                  </Box>

                  {/* Value */}
                  <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: '0.7rem', display: { xs: 'block', md: 'none' } }}
                    >
                      Value
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="600"
                      color="primary.main"
                      sx={{ fontSize: '0.85rem' }}
                    >
                      {currencySymbols[activeFiatCurrency]} {fNumber(value)}
                    </Typography>
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Tooltip title="View on Bithomp" arrow>
                      <IconButton
                        size="small"
                        component={Link}
                        href={`https://bithomp.com/explorer/${row.account}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: `${theme.palette.primary.main} !important`,
                          padding: '4px',
                          '&:hover': {
                            color: `${theme.palette.primary.dark} !important`,
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.04)',
                            transform: 'scale(1.1)'
                          },
                          '& .MuiSvgIcon-root': {
                            color: `${theme.palette.primary.main} !important`
                          },
                          '&:hover .MuiSvgIcon-root': {
                            color: `${theme.palette.primary.dark} !important`
                          }
                        }}
                      >
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </HolderCard>
          );
        })}
      </Stack>

      {totalCount > rows && (
        <Stack direction="row" justifyContent="center" sx={{ mt: 4 }}>
          <StyledPagination
            count={Math.ceil(totalCount / rows)}
            page={page + 1}
            onChange={(e, newPage) => handlePageChange(newPage - 1)}
            size="large"
            showFirstButton
            showLastButton
          />
        </Stack>
      )}
    </Stack>
  );
};

export default RichListData;