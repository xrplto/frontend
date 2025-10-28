import {
  useTheme,
  styled,
  Link,
  Stack,
  Typography,
  Box,
  useMediaQuery,
  Button,
  Card,
  Skeleton,
  Chip,
  alpha,
  Avatar,
  Alert
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VerifiedIcon from '@mui/icons-material/Verified';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { useContext, useState, useEffect, useMemo } from 'react';
import { AppContext } from 'src/AppContext';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
// Constants
const currencySymbols = {
  USD: '$ ',
  EUR: '€ ',
  JPY: '¥ ',
  CNH: '¥ ',
  XRP: '✕ '
};
import axios from 'axios';

const TokenCard = styled(Card)(({ theme }) => ({
  background: 'transparent',
  backdropFilter: 'none',
  border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
  borderRadius: '10px',
  padding: '6px 10px',
  cursor: 'pointer',
  boxShadow: 'none',
  '&:hover': {
    background: alpha(theme.palette.primary.main, 0.03),
    borderColor: alpha(theme.palette.primary.main, 0.2)
  }
}));

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '12px',
  background: 'transparent',
  border: `1.5px solid ${alpha(theme.palette.divider, 0.2)}`,
  boxShadow: 'none',
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  mb: 0.75,
  '&:hover': {
    boxShadow: 'none',
    borderColor: alpha(theme.palette.divider, 0.3),
    background: alpha(theme.palette.background.paper, 0.04)
  }
}));

const RankBadge = styled(Box)(({ theme, rank }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 22,
  height: 22,
  borderRadius: '6px',
  fontWeight: 500,
  fontSize: '11px',
  flexShrink: 0,
  background:
    rank === 1
      ? alpha('#FFD700', 0.12)
      : rank === 2
        ? alpha('#C0C0C0', 0.12)
        : rank === 3
          ? alpha('#CD7F32', 0.12)
          : alpha(theme.palette.divider, 0.05),
  color: rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : alpha(theme.palette.text.secondary, 0.6),
  border: `1px solid ${rank === 1 ? alpha('#FFD700', 0.4) : rank === 2 ? alpha('#C0C0C0', 0.4) : rank === 3 ? alpha('#CD7F32', 0.4) : alpha(theme.palette.divider, 0.15)}`,
  [theme.breakpoints.down('sm')]: {
    width: 20,
    height: 20,
    fontSize: '10px'
  }
}));

const StatsBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
  minWidth: '60px',
  textAlign: 'right',
  '& .value': {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: 1.3,
    letterSpacing: '-0.02em',
    textAlign: 'right',
    width: '100%'
  }
}));

const TrendingTokens = () => {
  const BASE_URL = 'https://api.xrpl.to/api';
  const theme = useTheme();
  const { darkMode, activeFiatCurrency } = useContext(AppContext);
  const metrics = useSelector(selectMetrics);
  const exchRate = metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null) || 1;
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [trendingList, setTrendingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getTrendingTokens = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `${BASE_URL}/tokens?start=0&limit=15&sortBy=trendingScore&sortType=desc&filter=&tags=&showNew=false&showSlug=false`
        );
        if (res.status === 200 && res.data && res.data.tokens) {
          setTrendingList(res.data.tokens);
        } else {
          setError('No trending tokens available');
        }
      } catch (err) {
        console.error('Error fetching trending tokens:', err);
        setError('Failed to load trending tokens');
      } finally {
        setLoading(false);
      }
    };
    getTrendingTokens();
  }, [BASE_URL]);

  // Memoize formatting functions to avoid recalculation on every render
  const formatPrice = useMemo(() => {
    return (price) => {
      if (!price || price === 0) return `${currencySymbols[activeFiatCurrency]}0`;
      const convertedPrice = activeFiatCurrency === 'XRP' ? price : price / exchRate;
      const symbol = currencySymbols[activeFiatCurrency];

      // Check if price has many leading zeros (better UX threshold)
      if (convertedPrice < 0.01) {
        const str = convertedPrice.toFixed(15);
        const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;

        // Use compact notation for 4+ zeros (e.g., 0.0001 becomes 0.0₄1)
        if (zeros >= 4) {
          const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
          // Show up to 4 significant digits for better precision
          const sigDigits = significant.slice(0, 4);
          return (
            <span style={{ fontSize: '11px' }}>
              {symbol}0.0<sub style={{ fontSize: '9px' }}>{zeros}</sub>
              {sigDigits}
            </span>
          );
        }
        // For 3 or fewer zeros, show normally but trim trailing zeros
        return `${symbol}${convertedPrice.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')}`;
      } else if (convertedPrice < 1) {
        return `${symbol}${convertedPrice.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')}`;
      } else if (convertedPrice < 100) {
        return `${symbol}${convertedPrice.toFixed(2)}`;
      } else if (convertedPrice >= 1e6) {
        return `${symbol}${(convertedPrice / 1e6).toFixed(1)}M`;
      } else if (convertedPrice >= 1e3) {
        return `${symbol}${(convertedPrice / 1e3).toFixed(1)}K`;
      }
      return `${symbol}${Math.round(convertedPrice)}`;
    };
  }, [activeFiatCurrency, exchRate]);

  const formatCompact = useMemo(() => {
    return (value, suffix = '') => {
      if (!value || value === 0) return '—';
      const symbol = currencySymbols[activeFiatCurrency];
      const converted = activeFiatCurrency === 'XRP' ? value : value / exchRate;

      if (converted >= 1e9) return `${symbol}${(converted / 1e9).toFixed(1)}B${suffix}`;
      if (converted >= 1e6) return `${symbol}${(converted / 1e6).toFixed(1)}M${suffix}`;
      if (converted >= 1e3) return `${symbol}${(converted / 1e3).toFixed(1)}K${suffix}`;
      return `${symbol}${Math.round(converted)}${suffix}`;
    };
  }, [activeFiatCurrency, exchRate]);

  if (loading) {
    return (
      <StyledCard elevation={0}>
        {/* Header Skeleton */}
        <Box
          sx={{
            mb: 0.75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 0.75, sm: 1 },
            pt: { xs: 0.75, sm: 1 },
            borderBottom: `1.5px solid ${alpha(theme.palette.divider, 0.1)}`,
            pb: 0.75
          }}
        >
          <Skeleton variant="text" width={140} height={24} />
          <Skeleton variant="text" width={80} height={24} />
        </Box>

        {/* Column Headers Skeleton */}
        <Box sx={{ px: { xs: 1, sm: 1.25 }, mb: 0.25, mt: 1 }}>
          <Skeleton variant="text" width="100%" height={16} />
        </Box>

        {/* Token List Skeleton */}
        <Stack spacing={0.25} sx={{ px: { xs: 0.75, sm: 1 }, pb: { xs: 0.75, sm: 1 } }}>
          {[...Array(isMobile ? 5 : 15)].map((_, i) => (
            <Skeleton key={`trending-skeleton-${i}`} variant="rounded" height={58} sx={{ borderRadius: '12px' }} />
          ))}
        </Stack>
      </StyledCard>
    );
  }

  if (error) {
    return (
      <StyledCard elevation={0} sx={{ p: 2 }}>
        <Alert
          severity="error"
          icon={<ErrorOutlineIcon fontSize="small" />}
          sx={{
            background: 'transparent',
            border: `1.5px solid ${alpha(theme.palette.error.main, 0.2)}`,
            borderRadius: '12px',
            '& .MuiAlert-icon': {
              color: theme.palette.error.main
            }
          }}
        >
          {error}
        </Alert>
      </StyledCard>
    );
  }

  if (!trendingList || trendingList.length === 0) {
    return (
      <StyledCard elevation={0} sx={{ p: 3, textAlign: 'center' }}>
        <TrendingUpIcon sx={{ fontSize: 48, color: alpha(theme.palette.text.secondary, 0.3), mb: 1 }} />
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
          No trending tokens available
        </Typography>
      </StyledCard>
    );
  }

  return (
    <StyledCard elevation={0} component="section" aria-label="Trending Tokens">
      {/* Header */}
      <Box
        sx={{
          mb: 0.75,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 0.75, sm: 1 },
          pt: { xs: 0.75, sm: 1 },
          borderBottom: `1.5px solid ${alpha(theme.palette.divider, 0.1)}`,
          pb: 0.75
        }}
      >
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography variant="h6" component="h2" fontWeight={400} fontSize="0.75rem">
            Trending Tokens
          </Typography>
          <Chip
            label="LIVE"
            size="small"
            sx={{
              height: 14,
              fontSize: '9px',
              bgcolor: alpha('#4caf50', 0.08),
              color: '#4caf50',
              fontWeight: 400,
              px: 0.5
            }}
          />
        </Stack>
        <Button
          component={Link}
          href="/trending"
          endIcon={<ArrowForwardIcon sx={{ fontSize: 11 }} />}
          aria-label="View all trending tokens"
          sx={{
            textTransform: 'none',
            fontSize: '12px',
            fontWeight: 400,
            color: theme.palette.primary.main,
            padding: '4px 8px',
            minHeight: 'auto',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.04)
            },
            '&:focus-visible': {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: '2px'
            }
          }}
        >
          View All
        </Button>
      </Box>

      {/* Column Headers - Desktop */}
      <Box
        sx={{
          display: { xs: 'none', sm: 'flex' },
          alignItems: 'center',
          gap: 1,
          mb: 0.5,
          px: 1.25,
          opacity: 0.5
        }}
      >
        <Box sx={{ width: 22 }} />
        <Box sx={{ width: 32 }} />
        <Box sx={{ flex: '1 1 auto', minWidth: 0, ml: 0.75 }}>
          <Typography sx={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 400, letterSpacing: '0.5px' }}>
            Token
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '75px 60px 70px 70px',
            gap: 1,
            ml: 'auto'
          }}
        >
          <Typography sx={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 400, letterSpacing: '0.5px', textAlign: 'right' }}>
            Price
          </Typography>
          <Typography sx={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 400, letterSpacing: '0.5px', textAlign: 'right' }}>
            24h %
          </Typography>
          <Typography sx={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 400, letterSpacing: '0.5px', textAlign: 'right' }}>
            MCap
          </Typography>
          <Typography sx={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 400, letterSpacing: '0.5px', textAlign: 'right' }}>
            Volume
          </Typography>
        </Box>
      </Box>

      {/* Column Headers - Mobile */}
      <Box
        sx={{
          display: { xs: 'flex', sm: 'none' },
          alignItems: 'center',
          gap: 0.75,
          mb: 0.5,
          px: 0.75,
          opacity: 0.5
        }}
      >
        <Box sx={{ width: 22 }} />
        <Box sx={{ width: 32 }} />
        <Box sx={{ flex: '1 1 auto', minWidth: 0, ml: 0.5 }}>
          <Typography sx={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 400, letterSpacing: '0.5px' }}>
            Token
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '60px 70px',
            gap: 1,
            ml: 'auto'
          }}
        >
          <Typography sx={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 400, letterSpacing: '0.5px', textAlign: 'right' }}>
            24h %
          </Typography>
          <Typography sx={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 400, letterSpacing: '0.5px', textAlign: 'right' }}>
            Volume
          </Typography>
        </Box>
      </Box>

      {/* Token List */}
      <Stack spacing={0.5} sx={{ px: { xs: 0.75, sm: 1 }, pb: { xs: 0.75, sm: 1 } }}>
        {trendingList.slice(0, isMobile ? 5 : 15).map((token, index) => {
          const rank = index + 1;
          const priceChange = token.pro24h || 0;
          const isPositive = priceChange >= 0;

          return (
            <Link
              key={token.md5 || token.slug || `trending-${index}`}
              href={`/token/${token.slug}`}
              underline="none"
              color="inherit"
              aria-label={`View ${token.user} token details`}
              sx={{
                '&:hover': {
                  textDecoration: 'none'
                },
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: '2px',
                  borderRadius: '12px'
                }
              }}>
              <TokenCard>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 0.75, sm: 1 }
                  }}
                >
                  {/* Rank */}
                  <RankBadge rank={rank}>{rank}</RankBadge>

                  {/* Token Avatar */}
                  <Avatar
                    src={`https://s1.xrpl.to/token/${token.md5}`}
                    alt={token.user}
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: '14px',
                      border: `1px solid ${alpha(theme.palette.divider, 0.15)}`
                    }}
                  >
                    {token.user?.[0]?.toUpperCase()}
                  </Avatar>

                  {/* Token Info */}
                  <Box sx={{ flex: '1 1 auto', minWidth: 0, ml: { xs: 0.5, sm: 0.75 } }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography
                        variant="body2"
                        fontWeight={400}
                        sx={{
                          fontSize: { xs: '13px', sm: '13px' },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: { xs: '90px', sm: 'none' }
                        }}
                      >
                        {token.user}
                      </Typography>
                      {token.verified && (
                        <VerifiedIcon
                          sx={{
                            fontSize: 12,
                            color: '#1976d2',
                            flexShrink: 0
                          }}
                        />
                      )}
                    </Stack>
                    {token.name && token.name !== token.user && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontSize: '10px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          opacity: 0.5,
                          display: { xs: 'none', sm: 'block' },
                          mt: -0.25
                        }}
                      >
                        {token.name}
                      </Typography>
                    )}
                  </Box>

                  {/* Stats Grid */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '60px 70px',
                        sm: '75px 60px 70px 70px'
                      },
                      gap: 1,
                      ml: 'auto'
                    }}
                  >
                    <StatsBox sx={{ display: { xs: 'none', sm: 'flex' } }}>
                      <Box className="value">{formatPrice(token.exch)}</Box>
                    </StatsBox>

                    <StatsBox>
                      <Box
                        className="value"
                        sx={{
                          color: isPositive ? '#4caf50' : '#f44336'
                        }}
                      >
                        {isPositive ? '+' : ''}
                        {priceChange.toFixed(1)}%
                      </Box>
                    </StatsBox>

                    <StatsBox sx={{ display: { xs: 'none', sm: 'flex' } }}>
                      <Box className="value">{formatCompact(token.marketcap)}</Box>
                    </StatsBox>

                    <StatsBox>
                      <Box className="value">{formatCompact(token.vol24hxrp)}</Box>
                    </StatsBox>
                  </Box>
                </Box>
              </TokenCard>
            </Link>
          );
        })}
      </Stack>
    </StyledCard>
  );
};

export default TrendingTokens;
