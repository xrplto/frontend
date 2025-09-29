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
  Avatar
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VerifiedIcon from '@mui/icons-material/Verified';
import WhatshotIcon from '@mui/icons-material/Whatshot';

import { useContext, useState, useEffect } from 'react';
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
  border: `1.5px solid ${alpha(theme.palette.divider, 0.15)}`,
  borderRadius: '12px',
  padding: '6px 8px',
  cursor: 'pointer',
  transition: 'none !important',
  '&:hover': {
    background: alpha(theme.palette.primary.main, 0.02),
    borderColor: alpha(theme.palette.divider, 0.2),
    transform: 'none',
    transition: 'none !important'
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
  width: 20,
  height: 20,
  borderRadius: '4px',
  fontWeight: 500,
  fontSize: '0.65rem',
  flexShrink: 0,
  background:
    rank === 1
      ? alpha('#FFD700', 0.15)
      : rank === 2
        ? alpha('#C0C0C0', 0.15)
        : rank === 3
          ? alpha('#CD7F32', 0.15)
          : alpha(theme.palette.action.selected, 0.3),
  color: rank === 1 ? '#FFD700' : rank === 2 ? '#8B8B8B' : rank === 3 ? '#CD7F32' : theme.palette.text.secondary,
  border: `1px solid ${rank === 1 ? alpha('#FFD700', 0.3) : rank === 2 ? alpha('#C0C0C0', 0.3) : rank === 3 ? alpha('#CD7F32', 0.3) : alpha(theme.palette.divider, 0.2)}`,
  [theme.breakpoints.down('sm')]: {
    width: 18,
    height: 18,
    fontSize: '0.6rem'
  }
}));

const StatsBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
  minWidth: '55px',
  '& .value': {
    fontSize: '0.7rem',
    fontWeight: 500,
    lineHeight: 1.2,
    letterSpacing: '-0.01em'
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

  useEffect(() => {
    const getTrendingTokens = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${BASE_URL}/tokens?start=0&limit=15&sortBy=trendingScore&sortType=desc&filter=&tags=&showNew=false&showSlug=false`
        );
        if (res.status === 200 && res.data) {
          setTrendingList(res.data.tokens);
        }
      } catch (err) {
        console.error('Error fetching trending tokens:', err);
      } finally {
        setLoading(false);
      }
    };
    getTrendingTokens();
  }, [BASE_URL]);

  const formatPrice = (price) => {
    if (!price) return `${currencySymbols[activeFiatCurrency]}0`;
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
          <span style={{ fontSize: '0.65rem' }}>
            {symbol}0.0<sub style={{ fontSize: '0.5rem' }}>{zeros}</sub>
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

  const formatCompact = (value, suffix = '') => {
    if (!value) return '0';
    const symbol = currencySymbols[activeFiatCurrency];
    const converted = activeFiatCurrency === 'XRP' ? value : value / exchRate;

    if (converted >= 1e9) return `${symbol}${(converted / 1e9).toFixed(1)}B${suffix}`;
    if (converted >= 1e6) return `${symbol}${(converted / 1e6).toFixed(1)}M${suffix}`;
    if (converted >= 1e3) return `${symbol}${(converted / 1e3).toFixed(1)}K${suffix}`;
    return `${symbol}${Math.round(converted)}${suffix}`;
  };

  if (loading) {
    return (
      <StyledCard elevation={0} sx={{ p: 2 }}>
        <Stack spacing={1}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={`trending-skeleton-${i}`} variant="rounded" height={72} />
          ))}
        </Stack>
      </StyledCard>
    );
  }

  return (
    <StyledCard elevation={0}>
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
          <Typography variant="h6" fontWeight={500} fontSize="0.75rem">
            Trending Tokens
          </Typography>
          <Chip
            label="LIVE"
            size="small"
            sx={{
              height: 14,
              fontSize: '0.45rem',
              bgcolor: alpha('#4caf50', 0.08),
              color: '#4caf50',
              fontWeight: 500,
              px: 0.5
            }}
          />
        </Stack>
        <Button
          component={Link}
          href="/trending"
          endIcon={<ArrowForwardIcon sx={{ fontSize: 12 }} />}
          sx={{
            textTransform: 'none',
            fontSize: '0.65rem',
            fontWeight: 500,
            color: theme.palette.primary.main,
            padding: '2px 6px',
            minHeight: 'auto'
          }}
        >
          View All
        </Button>
      </Box>

      {/* Column Headers */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 0.25,
          px: { xs: 1, sm: 1.25 },
          opacity: 0.6
        }}
      >
        <Box sx={{ width: 18 }} />
        <Box sx={{ width: 32 }} />
        <Box sx={{ flex: '1 1 auto' }} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(55px, 1fr))',
            gap: 1.5,
            ml: 'auto'
          }}
        >
          <Typography sx={{ fontSize: '0.45rem', textTransform: 'uppercase', fontWeight: 500, color: 'text.secondary' }}>
            Price
          </Typography>
          <Typography sx={{ fontSize: '0.45rem', textTransform: 'uppercase', fontWeight: 500, color: 'text.secondary' }}>
            24h
          </Typography>
          <Typography sx={{ fontSize: '0.45rem', textTransform: 'uppercase', fontWeight: 500, color: 'text.secondary' }}>
            MCap
          </Typography>
          <Typography sx={{ fontSize: '0.45rem', textTransform: 'uppercase', fontWeight: 500, color: 'text.secondary' }}>
            Vol
          </Typography>
        </Box>
      </Box>

      {/* Token List */}
      <Stack spacing={0.25} sx={{ px: { xs: 0.75, sm: 1 }, pb: { xs: 0.75, sm: 1 } }}>
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
              sx={{
                '&:hover': {
                  textDecoration: 'none'
                }
              }}>
              <TokenCard>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 } }}>
                  {/* Rank */}
                  <RankBadge rank={rank}>{rank}</RankBadge>

                  {/* Token Avatar */}
                  <Avatar
                    src={`https://s1.xrpl.to/token/${token.md5}`}
                    sx={{ width: 24, height: 24, fontSize: '0.65rem' }}
                  >
                    {token.user?.[0]}
                  </Avatar>

                  {/* Token Info */}
                  <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        sx={{
                          fontSize: '0.7rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {token.user}
                      </Typography>
                      {token.verified && <VerifiedIcon sx={{ fontSize: 10, color: '#1976d2' }} />}
                    </Stack>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontSize: '0.55rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        opacity: 0.7
                      }}
                    >
                      {token.name}
                    </Typography>
                  </Box>

                  {/* Stats Grid */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, minmax(55px, 1fr))',
                      gap: 1.5,
                      ml: 'auto'
                    }}
                  >
                    <StatsBox>
                      <Box className="value">{formatPrice(token.exch)}</Box>
                    </StatsBox>

                    <StatsBox>
                      <Stack direction="row" alignItems="center" spacing={0.25}>
                        <Typography
                          className="value"
                          sx={{ color: isPositive ? '#4caf50' : '#f44336' }}
                        >
                          {isPositive ? '+' : ''}
                          {priceChange.toFixed(1)}%
                        </Typography>
                      </Stack>
                    </StatsBox>

                    <StatsBox>
                      <Typography className="value">{formatCompact(token.marketcap)}</Typography>
                    </StatsBox>

                    <StatsBox>
                      <Typography className="value">{formatCompact(token.vol24hxrp)}</Typography>
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
