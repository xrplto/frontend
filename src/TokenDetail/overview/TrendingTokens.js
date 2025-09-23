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
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VerifiedIcon from '@mui/icons-material/Verified';
import WhatshotIcon from '@mui/icons-material/Whatshot';

import { useContext, useState, useEffect } from 'react';
import { AppContext } from 'src/AppContext';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { currencySymbols } from 'src/utils/constants';
import axios from 'axios';

const TokenCard = styled(Card)(({ theme }) => ({
  background: 'transparent',
  backdropFilter: 'none',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: '8px',
  padding: '8px 12px',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`,
    borderColor: alpha(theme.palette.primary.main, 0.2),
    background: alpha(theme.palette.action.hover, 0.04)
  }
}));

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: { xs: '8px', sm: '10px' },
  background: 'transparent',
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  boxShadow: `
    0 4px 16px ${alpha(theme.palette.common.black, 0.08)}, 
    0 1px 2px ${alpha(theme.palette.common.black, 0.04)}`,
  position: 'relative',
  overflow: 'hidden',
  // Slightly inset to align with TokenSummary
  width: '100%',
  maxWidth: '100%',
  mb: { xs: 1, sm: 1.5 },
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&::before': {
    display: 'none'
  },
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: `
      0 6px 24px ${alpha(theme.palette.common.black, 0.1)}, 
      0 2px 4px ${alpha(theme.palette.common.black, 0.05)}`,
    border: `1px solid ${alpha(theme.palette.divider, 0.25)}`
  }
}));

const RankBadge = styled(Box)(({ theme, rank }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  borderRadius: '6px',
  fontWeight: 700,
  fontSize: '0.8rem',
  flexShrink: 0,
  background:
    rank === 1
      ? 'linear-gradient(135deg, #FFD700, #FFA500)'
      : rank === 2
        ? 'linear-gradient(135deg, #E5E4E2, #BCC6CC)'
        : rank === 3
          ? 'linear-gradient(135deg, #CD7F32, #B87333)'
          : alpha(theme.palette.action.selected, 0.6),
  color: rank <= 3 ? '#fff' : theme.palette.text.primary,
  boxShadow: rank <= 3 ? `0 1px 4px ${alpha('#FFD700', 0.2)}` : 'none',
  [theme.breakpoints.down('sm')]: {
    width: 24,
    height: 24,
    fontSize: '0.75rem'
  }
}));

const StatsBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '1px',
  minWidth: '70px',
  '& .label': {
    fontSize: '0.5rem',
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    lineHeight: 1
  },
  '& .value': {
    fontSize: '0.75rem',
    fontWeight: 600,
    lineHeight: 1.1
  }
}));

const TrendingTokens = () => {
  const BASE_URL = 'https://api.xrpl.to/api';
  const theme = useTheme();
  const { darkMode, activeFiatCurrency } = useContext(AppContext);
  const metrics = useSelector(selectMetrics);
  const exchRate = metrics[activeFiatCurrency] || 1;
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
    const convertedPrice = activeFiatCurrency === 'XRP' ? price : price / (exchRate || 1);
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
          <span style={{ fontSize: '0.75rem' }}>
            {symbol}0.0<sub style={{ fontSize: '0.6rem' }}>{zeros}</sub>
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
    const converted = activeFiatCurrency === 'XRP' ? value : value / (exchRate || 1);

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
          mb: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 1, sm: 1.5 },
          pt: { xs: 1, sm: 1.5 }
        }}
      >
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <WhatshotIcon sx={{ color: '#ff6b35', fontSize: 18 }} />
          <Typography variant="h6" fontWeight={700} fontSize="0.9rem">
            Trending Tokens
          </Typography>
          <Chip
            label="LIVE"
            size="small"
            sx={{
              height: 16,
              fontSize: '0.5rem',
              bgcolor: alpha('#4caf50', 0.1),
              color: '#4caf50',
              fontWeight: 600
            }}
          />
        </Stack>
        <Button
          component={Link}
          href="/trending"
          endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
          sx={{
            textTransform: 'none',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: theme.palette.primary.main,
            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
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
          gap: 1.5,
          mb: 0.5,
          px: { xs: 2, sm: 2.5 },
          opacity: 0.7
        }}
      >
        <Box sx={{ width: 24 }} />
        <Box sx={{ width: 40 }} />
        <Box sx={{ flex: '1 1 auto' }} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(70px, 1fr))',
            gap: 2,
            ml: 'auto'
          }}
        >
          <Typography sx={{ fontSize: '0.5rem', textTransform: 'uppercase', fontWeight: 600 }}>
            Price
          </Typography>
          <Typography sx={{ fontSize: '0.5rem', textTransform: 'uppercase', fontWeight: 600 }}>
            24h
          </Typography>
          <Typography sx={{ fontSize: '0.5rem', textTransform: 'uppercase', fontWeight: 600 }}>
            MCap
          </Typography>
          <Typography sx={{ fontSize: '0.5rem', textTransform: 'uppercase', fontWeight: 600 }}>
            Vol
          </Typography>
        </Box>
      </Box>

      {/* Token List */}
      <Stack spacing={0.5} sx={{ px: { xs: 1, sm: 1.5 }, pb: { xs: 1, sm: 1.5 } }}>
        {trendingList.slice(0, isMobile ? 5 : 15).map((token, index) => {
          const rank = index + 1;
          const priceChange = token.pro24h || 0;
          const isPositive = priceChange >= 0;

          return (
            <Link key={token.md5 || token.slug || `trending-${index}`} href={`/token/${token.slug}`} underline="none" color="inherit">
              <TokenCard>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
                  {/* Rank */}
                  <RankBadge rank={rank}>{rank}</RankBadge>

                  {/* Token Avatar */}
                  <Avatar
                    src={`https://s1.xrpl.to/token/${token.md5}`}
                    sx={{ width: 32, height: 32 }}
                  >
                    {token.user?.[0]}
                  </Avatar>

                  {/* Token Info */}
                  <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{
                          fontSize: '0.8rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {token.user}
                      </Typography>
                      {token.verified && <VerifiedIcon sx={{ fontSize: 14, color: '#1976d2' }} />}
                    </Stack>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontSize: '0.65rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {token.name}
                    </Typography>
                  </Box>

                  {/* Stats Grid */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, minmax(70px, 1fr))',
                      gap: 2,
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
                        {isPositive ? (
                          <TrendingUpIcon sx={{ fontSize: 10, color: '#4caf50' }} />
                        ) : (
                          <TrendingDownIcon sx={{ fontSize: 10, color: '#f44336' }} />
                        )}
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
