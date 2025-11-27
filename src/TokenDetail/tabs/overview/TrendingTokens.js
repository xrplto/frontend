import styled from '@emotion/styled';
import Image from 'next/image';

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

// Helper function for alpha
const alpha = (color, opacity) => {
  if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/g, `${opacity})`);
  }
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
  }
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

const Container = styled('div')(({ isDark }) => ({
  borderRadius: '10px',
  background: 'transparent',
  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  marginBottom: '6px'
}));

const TokenCard = styled('div')(({ isDark }) => ({
  background: 'transparent',
  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
  borderRadius: '8px',
  padding: '6px 8px',
  cursor: 'pointer',
  '&:hover': {
    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
  }
}));

const RankBadge = styled('div')(({ isDark, rank }) => {
  const getRankColors = () => {
    if (rank === 1) return { bg: 'rgba(234,179,8,0.15)', color: '#eab308' };
    if (rank === 2) return { bg: 'rgba(156,163,175,0.15)', color: '#9ca3af' };
    if (rank === 3) return { bg: 'rgba(249,115,22,0.15)', color: '#f97316' };
    return {
      bg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
    };
  };
  const colors = getRankColors();

  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    borderRadius: '6px',
    fontWeight: 500,
    fontSize: '10px',
    flexShrink: 0,
    background: colors.bg,
    color: colors.color
  };
});

const StatsBox = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
  minWidth: '60px',
  textAlign: 'right',
  '& .value': {
    fontSize: '11px',
    fontWeight: 400,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
    textAlign: 'right',
    width: '100%'
  }
});

const Stack = styled('div')(({ direction = 'column', spacing = 0, alignItems, justifyContent, sx = {} }) => ({
  display: 'flex',
  flexDirection: direction,
  gap: typeof spacing === 'number' ? `${spacing * 8}px` : spacing,
  alignItems,
  justifyContent,
  ...sx
}));

const Box = styled('div')({});

const Link = styled('a')(({ isDark }) => ({
  color: 'inherit',
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'none'
  },
  '&:focus-visible': {
    outline: '2px solid #4285f4',
    outlineOffset: '2px',
    borderRadius: '12px'
  }
}));

const Button = styled('button')(({ isDark }) => ({
  textTransform: 'none',
  fontSize: '11px',
  fontWeight: 400,
  color: '#3b82f6',
  padding: '4px 8px',
  minHeight: 'auto',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  '&:hover': {
    color: '#60a5fa'
  }
}));

const Typography = styled('span')(({ variant, color, sx = {}, isDark }) => {
  const baseStyles = {};

  if (variant === 'h6') {
    baseStyles.fontSize = '11px';
    baseStyles.fontWeight = 400;
  } else if (variant === 'body2') {
    baseStyles.fontSize = '12px';
    baseStyles.fontWeight = 400;
  } else if (variant === 'caption') {
    baseStyles.fontSize = '10px';
  }

  if (color === 'text.secondary') {
    baseStyles.opacity = 0.6;
  }

  baseStyles.color = isDark ? '#FFFFFF' : '#212B36';

  return { ...baseStyles, ...sx };
});

const Chip = styled('span')(({ isDark }) => ({
  height: 14,
  fontSize: '8px',
  backgroundColor: 'rgba(34,197,94,0.15)',
  color: '#22c55e',
  fontWeight: 500,
  padding: '0 5px',
  borderRadius: '4px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center'
}));

const Avatar = styled('div')(({ isDark }) => ({
  width: 24,
  height: 24,
  fontSize: '10px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  }
}));

const Skeleton = ({ variant, width, height, sx = {} }) => {
  const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
  return (
    <div
      style={{
        width: typeof width === 'number' ? `${width}px` : width || '100%',
        height: typeof height === 'number' ? `${height}px` : height || '20px',
        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        borderRadius: variant === 'rounded' ? '12px' : variant === 'text' ? '4px' : '4px',
        ...sx
      }}
    />
  );
};

const Alert = styled('div')(({ severity, isDark }) => ({
  background: 'transparent',
  border: `1.5px solid ${severity === 'error' ? alpha('#f44336', 0.2) : alpha('#4285f4', 0.2)}`,
  borderRadius: '10px',
  padding: '10px 12px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: severity === 'error' ? '#f44336' : '#4285f4'
}));

const BASE_URL = 'https://api.xrpl.to/api';

const TrendingTokens = () => {
  const { darkMode, activeFiatCurrency } = useContext(AppContext);
  const metrics = useSelector(selectMetrics);
  const exchRate = metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null) || 1;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;

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
  }, []);

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
      <Container isDark={darkMode}>
        {/* Header Skeleton */}
        <Box
          style={{
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '6px' : '8px',
            borderBottom: `1.5px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            paddingBottom: '6px'
          }}
        >
          <Skeleton variant="text" width={140} height={24} />
          <Skeleton variant="text" width={80} height={24} />
        </Box>

        {/* Column Headers Skeleton */}
        <Box style={{ padding: '8px 10px', marginBottom: '2px', marginTop: '8px' }}>
          <Skeleton variant="text" width="100%" height={16} />
        </Box>

        {/* Token List Skeleton */}
        <Stack spacing={0.25} sx={{ padding: isMobile ? '6px' : '8px', paddingBottom: isMobile ? '6px' : '8px' }}>
          {[...Array(isMobile ? 5 : 15)].map((_, i) => (
            <Skeleton key={`trending-skeleton-${i}`} variant="rounded" height={58} sx={{ borderRadius: '12px' }} />
          ))}
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container isDark={darkMode} style={{ padding: '16px' }}>
        <Alert severity="error" isDark={darkMode}>
          <span style={{ marginRight: '4px' }}>⚠</span>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!trendingList || trendingList.length === 0) {
    return (
      <Container isDark={darkMode} style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', marginBottom: '8px' }}>📈</div>
        <Typography variant="body2" isDark={darkMode} style={{ fontSize: '0.9rem', opacity: 0.7 }}>
          No trending tokens available
        </Typography>
      </Container>
    );
  }

  return (
    <Container isDark={darkMode} role="region" aria-label="Trending Tokens">
      {/* Header */}
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px 4px'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography variant="h6" isDark={darkMode} style={{ fontWeight: 500, fontSize: '10px', color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(33,43,54,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Trending Tokens
          </Typography>
          <Chip isDark={darkMode}>LIVE</Chip>
        </Stack>
        <Button isDark={darkMode} as="a" href="/trending" aria-label="View all trending tokens">
          View All→
        </Button>
      </Box>

      {/* Column Headers - Desktop */}
      <Box
        style={{
          display: isMobile ? 'none' : 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '2px 10px 6px'
        }}
      >
        <Box style={{ width: 20 }} />
        <Box style={{ width: 24 }} />
        <Box style={{ flex: '1 1 auto', minWidth: 0, marginLeft: '6px' }}>
          <Typography isDark={darkMode} style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 500, letterSpacing: '0.5px', color: darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }}>
            Token
          </Typography>
        </Box>
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: '70px 55px 65px 65px',
            gap: '8px',
            marginLeft: 'auto'
          }}
        >
          <Typography isDark={darkMode} style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 500, letterSpacing: '0.5px', textAlign: 'right', color: darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }}>
            Price
          </Typography>
          <Typography isDark={darkMode} style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 500, letterSpacing: '0.5px', textAlign: 'right', color: darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }}>
            24h %
          </Typography>
          <Typography isDark={darkMode} style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 500, letterSpacing: '0.5px', textAlign: 'right', color: darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }}>
            MCap
          </Typography>
          <Typography isDark={darkMode} style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 500, letterSpacing: '0.5px', textAlign: 'right', color: darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }}>
            Volume
          </Typography>
        </Box>
      </Box>

      {/* Column Headers - Mobile */}
      {isMobile && (
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '4px',
            padding: '4px 8px',
            opacity: 0.5
          }}
        >
          <Box style={{ width: 20 }} />
          <Box style={{ width: 28 }} />
          <Box style={{ flex: '1 1 auto', minWidth: 0, marginLeft: '4px' }}>
            <Typography isDark={darkMode} style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 400, letterSpacing: '0.5px' }}>
              Token
            </Typography>
          </Box>
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: '55px 65px',
              gap: '8px',
              marginLeft: 'auto'
            }}
          >
            <Typography isDark={darkMode} style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 400, letterSpacing: '0.5px', textAlign: 'right' }}>
              24h %
            </Typography>
            <Typography isDark={darkMode} style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 400, letterSpacing: '0.5px', textAlign: 'right' }}>
              Volume
            </Typography>
          </Box>
        </Box>
      )}

      {/* Token List */}
      <Stack spacing={0.25} sx={{ padding: '6px 8px 8px' }}>
        {trendingList.slice(0, isMobile ? 5 : 15).map((token, index) => {
          const rank = index + 1;
          const priceChange = token.pro24h || 0;
          const isPositive = priceChange >= 0;

          return (
            <Link
              key={token.md5 || token.slug || `trending-${index}`}
              href={`/token/${token.slug}`}
              isDark={darkMode}
              aria-label={`View ${token.user} token details`}
            >
              <TokenCard isDark={darkMode}>
                <Box
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '6px' : '8px'
                  }}
                >
                  {/* Rank */}
                  <RankBadge rank={rank} isDark={darkMode}>{rank}</RankBadge>

                  {/* Token Avatar */}
                  <Avatar isDark={darkMode}>
                    {token.md5 ? (
                      <img
                        src={`https://s1.xrpl.to/token/${token.md5}`}
                        alt={token.user}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentNode.textContent = token.user?.[0]?.toUpperCase();
                        }}
                      />
                    ) : (
                      token.user?.[0]?.toUpperCase()
                    )}
                  </Avatar>

                  {/* Token Info */}
                  <Box style={{ flex: '1 1 auto', minWidth: 0, marginLeft: isMobile ? '4px' : '6px' }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography
                        variant="body2"
                        isDark={darkMode}
                        style={{
                          fontSize: '12px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: isMobile ? '90px' : 'none'
                        }}
                      >
                        {token.user}
                      </Typography>
                      {token.verified && (
                        <span
                          style={{
                            width: 14,
                            height: 14,
                            background: '#4285f4',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 8,
                            color: '#fff',
                            fontWeight: 500,
                            flexShrink: 0
                          }}
                          title="Verified"
                        >
                          ✓
                        </span>
                      )}
                    </Stack>
                    {token.name && token.name !== token.user && !isMobile && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        isDark={darkMode}
                        style={{
                          fontSize: '10px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          opacity: 0.5,
                          marginTop: '-2px',
                          display: 'block'
                        }}
                      >
                        {token.name}
                      </Typography>
                    )}
                  </Box>

                  {/* Stats Grid */}
                  <Box
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '55px 65px' : '70px 55px 65px 65px',
                      gap: '8px',
                      marginLeft: 'auto'
                    }}
                  >
                    {!isMobile && (
                      <StatsBox>
                        <Box className="value">{formatPrice(token.exch)}</Box>
                      </StatsBox>
                    )}

                    <StatsBox>
                      <Box
                        className="value"
                        style={{
                          color: isPositive ? '#22c55e' : '#ef4444'
                        }}
                      >
                        {isPositive ? '+' : ''}
                        {priceChange.toFixed(1)}%
                      </Box>
                    </StatsBox>

                    {!isMobile && (
                      <StatsBox>
                        <Box className="value">{formatCompact(token.marketcap)}</Box>
                      </StatsBox>
                    )}

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
    </Container>
  );
};

export default TrendingTokens;
