// Material
import {
  useTheme,
  styled,
  Link,
  Stack,
  Typography,
  Box,
  useMediaQuery,
  Tooltip,
  Button,
  Card,
  CardContent,
  Skeleton,
  Chip,
  alpha,
  Badge,
  IconButton
} from '@mui/material';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VerifiedIcon from '@mui/icons-material/Verified';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import StackStyle from 'src/components/StackStyle';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

import { useState, useEffect } from 'react';
import axios from 'axios';

import Image from 'next/image';

const TokenImage = styled(Image)(({ theme }) => ({
  borderRadius: '4px',
  overflow: 'hidden',
  objectFit: 'cover',
  width: '18px',
  height: '18px',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
}));

const VerifiedBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#1976d2',
    color: '#fff',
    borderRadius: '50%',
    width: '8px',
    height: '8px',
    minWidth: '8px',
    fontSize: '6px',
    fontWeight: 'bold',
    border: `1px solid ${theme.palette.background.paper}`,
    boxShadow: `0 1px 3px ${alpha('#1976d2', 0.4)}`
  }
}));

const TrendingCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'darkMode' && prop !== 'rank'
})(({ theme, darkMode, rank }) => ({
  position: 'relative',
  borderRadius: '8px',
  background: 'transparent',
  backdropFilter: 'none',
  border:
    rank <= 3
      ? `1.5px solid ${alpha('#FFD700', 0.4)}`
      : `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  boxShadow: rank <= 3
    ? `0 0 20px ${alpha('#FFD700', 0.15)}, 0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`
    : `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
  cursor: 'pointer',
  overflow: 'hidden',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateX(4px)',
    boxShadow: rank <= 3
      ? `0 0 25px ${alpha('#FFD700', 0.2)}, 0 6px 16px ${alpha(theme.palette.common.black, 0.15)}`
      : `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`,
    border: rank <= 3
      ? `1.5px solid ${alpha('#FFD700', 0.5)}`
      : `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
  },
  '&::before': {
    display: 'none'
  }
}));

// Removed styled component - will use inline styles instead

const HeaderSection = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'darkMode'
})(({ theme, darkMode }) => ({
  position: 'relative',
  background: `linear-gradient(135deg, ${alpha('#FF6B35', 0.05)}, ${alpha('#F7931E', 0.05)})`,
  borderRadius: '10px',
  padding: theme.spacing(1.5, 2),
  marginBottom: theme.spacing(1.5),
  border: `1px solid ${alpha('#FF6B35', 0.15)}`,
  overflow: 'hidden',
  boxShadow: `0 2px 8px ${alpha('#FF6B35', 0.1)}`
}));

const GlowingButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'darkMode'
})(({ theme, darkMode }) => ({
  background: `linear-gradient(135deg, ${alpha('#FF6B35', 0.1)}, ${alpha('#F7931E', 0.1)})`,
  color: '#FF6B35',
  borderRadius: '8px',
  padding: theme.spacing(1, 2),
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.75rem',
  position: 'relative',
  overflow: 'hidden',
  border: `1px solid ${alpha('#FF6B35', 0.3)}`,
  boxShadow: `0 2px 8px ${alpha('#FF6B35', 0.15)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha('#FF6B35', 0.2)}, ${alpha('#F7931E', 0.2)})`,
    transform: 'translateY(-2px)',
    boxShadow: `0 4px 16px ${alpha('#FF6B35', 0.25)}`,
    border: `1px solid ${alpha('#FF6B35', 0.4)}`
  },
  '& .MuiButton-endIcon': {
    transition: 'transform 0.3s ease',
    marginLeft: theme.spacing(0.5)
  },
  '&:hover .MuiButton-endIcon': {
    transform: 'translateX(4px)'
  }
}));

const SkeletonCard = () => (
  <Card sx={{ borderRadius: '4px', mb: 0.3, overflow: 'hidden' }}>
    <CardContent sx={{ p: 0.5 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={0.5} alignItems="center" flex={1}>
          <Skeleton variant="circular" width={18} height={18} />
          <Stack spacing={0.1} flex={1}>
            <Skeleton variant="text" width="70%" height={12} />
            <Skeleton variant="text" width="50%" height={10} />
          </Stack>
        </Stack>
        <Skeleton variant="rectangular" width={18} height={14} sx={{ borderRadius: '4px' }} />
      </Box>
    </CardContent>
  </Card>
);

const TrendingTokens = () => {
  const BASE_URL = 'https://api.xrpl.to/api';
  const theme = useTheme();
  const { darkMode } = useContext(AppContext);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [trendingList, setTrendingList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function getTrendingTokens() {
      setLoading(true);
      axios
        .get(
          `${BASE_URL}/tokens?start=0&limit=10&sortBy=trendingScore&sortType=desc&filter=&tags=&showNew=false&showSlug=false`
        )
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
            setTrendingList(ret.tokens);
          }
        })
        .catch((err) => {
          console.log('Error on getting TrendingTokens!', err);
        })
        .finally(() => {
          setTimeout(() => setLoading(false), 800);
        });
    }
    getTrendingTokens();
  }, [BASE_URL]);

  if (loading) {
    return (
      <StackStyle sx={{ 
        mt: 0.5,
        background: 'transparent',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        borderRadius: { xs: '6px', sm: '8px' },
        boxShadow: `
          0 4px 16px ${alpha(theme.palette.common.black, 0.08)}, 
          0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
          inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
        padding: { xs: 0.75, sm: 1 },
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&::before': {
          display: 'none'
        },
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: `
            0 6px 24px ${alpha(theme.palette.common.black, 0.12)}, 
            0 2px 4px ${alpha(theme.palette.common.black, 0.05)},
            inset 0 1px 1px ${alpha(theme.palette.common.white, 0.15)}`,
          border: `1px solid ${alpha(theme.palette.divider, 0.25)}`
        }
      }}>
        <HeaderSection darkMode={darkMode}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box>
              <LocalFireDepartmentIcon sx={{ color: '#FF6B35', fontSize: 14 }} />
            </Box>
            <Box>
              <Typography
                variant="body2"
                fontWeight="700"
                color={darkMode ? '#fff' : '#1a1a1a'}
                sx={{ fontSize: '0.6rem' }}
              >
                Trending XRPL Tokens
              </Typography>
              <Typography
                variant="caption"
                color={darkMode ? alpha('#fff', 0.7) : alpha('#1a1a1a', 0.7)}
                sx={{ fontSize: '0.6rem' }}
              >
                Hottest tokens gaining momentum right now
              </Typography>
            </Box>
          </Stack>
        </HeaderSection>
        {[...Array(6)].map((_, index) => (
          <SkeletonCard key={`skeleton-${index}`} />
        ))}
      </StackStyle>
    );
  }

  return (
    <StackStyle sx={{ 
      mt: 1,
      background: 'transparent',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
      borderRadius: { xs: '12px', sm: '16px' },
      boxShadow: `
        0 4px 16px ${alpha(theme.palette.common.black, 0.08)}, 
        0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
        inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
      padding: { xs: 2, sm: 2.5 },
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&::before': {
        display: 'none'
      },
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: `
          0 6px 24px ${alpha(theme.palette.common.black, 0.12)}, 
          0 2px 4px ${alpha(theme.palette.common.black, 0.05)},
          inset 0 1px 1px ${alpha(theme.palette.common.white, 0.15)}`,
        border: `1px solid ${alpha(theme.palette.divider, 0.25)}`
      }
    }}>
      <HeaderSection darkMode={darkMode}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #FF6B35, #F7931E)',
              boxShadow: `0 4px 12px ${alpha('#FF6B35', 0.3)}`
            }}
          >
            <LocalFireDepartmentIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Box flex={1}>
            <Typography variant="h6" fontWeight="700" color={darkMode ? '#fff' : '#1a1a1a'} sx={{ fontSize: '1rem', lineHeight: 1.3 }}>
              Trending XRPL Tokens
            </Typography>
            <Typography
              variant="body2"
              color={darkMode ? alpha('#fff', 0.7) : alpha('#1a1a1a', 0.6)}
              sx={{ fontSize: '0.75rem', lineHeight: 1.3 }}
            >
              Top performing tokens by momentum and activity
            </Typography>
          </Box>
          <Chip
            label="Live"
            size="small"
            sx={{
              background: alpha('#4caf50', 0.1),
              color: '#4caf50',
              border: `1px solid ${alpha('#4caf50', 0.3)}`,
              fontSize: '0.65rem',
              height: 20,
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.6 },
                '100%': { opacity: 1 }
              }
            }}
          />
        </Stack>
      </HeaderSection>

      <Stack spacing={0.5}>
        {trendingList.map((row, index) => {
          const { 
            md5, id, name, user, slug, verified, isOMCF,
            exch, pro24h, pro7d, marketcap, vol24hxrp, holders, tvl, trendingScore
          } = row;
          const imgUrl = `https://s1.xrpl.to/token/${md5}`;
          const link = `/token/${slug}`;
          const rank = index + 1;
          
          // Format price
          const formatPrice = (price) => {
            if (!price) return '0';
            if (price < 0.0001) return price.toExponential(2);
            if (price < 1) return price.toFixed(6);
            if (price < 100) return price.toFixed(4);
            return price.toFixed(2);
          };
          
          // Format market cap
          const formatMarketCap = (mc) => {
            if (!mc) return '0';
            if (mc >= 1e9) return `$${(mc / 1e9).toFixed(2)}B`;
            if (mc >= 1e6) return `$${(mc / 1e6).toFixed(2)}M`;
            if (mc >= 1e3) return `$${(mc / 1e3).toFixed(2)}K`;
            return `$${mc.toFixed(0)}`;
          };
          
          // Format volume
          const formatVolume = (vol) => {
            if (!vol) return '0';
            if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
            if (vol >= 1e3) return `${(vol / 1e3).toFixed(2)}K`;
            return vol.toFixed(0);
          };

          return (
            <TrendingCard darkMode={darkMode} rank={rank} key={`trending-${index}-${id}-${md5}`}>
              <CardContent sx={{ p: 1 }}>
                <Link
                  underline="none"
                  color="inherit"
                  href={link}
                  rel="noreferrer noopener nofollow"
                  sx={{ textDecoration: 'none' }}
                >
                  <Box display="flex" alignItems="stretch" gap={1.5}>
                    {/* Left Section - Rank and Token Info */}
                    <Box display="flex" alignItems="center" gap={1} flex="0 0 auto">
                      <Box 
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 24,
                          height: 24,
                          borderRadius: '6px',
                          background: rank <= 3 
                            ? `linear-gradient(135deg, #FFD700, #FFA500)`
                            : rank <= 5
                            ? `linear-gradient(135deg, #C0C0C0, #9E9E9E)`
                            : `linear-gradient(135deg, #CD7F32, #8B4513)`,
                          color: '#fff',
                          fontWeight: 'bold',
                          fontSize: '0.65rem',
                          boxShadow: rank <= 3 
                            ? `0 2px 8px ${alpha('#FFD700', 0.4)}`
                            : 'none'
                        }}
                      >
                        {rank}
                      </Box>
                      
                      <Box sx={{ position: 'relative' }}>
                        {verified ? (
                          <VerifiedBadge
                            badgeContent={<VerifiedIcon sx={{ fontSize: 8 }} />}
                            overlap="circular"
                            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                          >
                            <TokenImage
                              src={imgUrl}
                              alt={name}
                              width={32}
                              height={32}
                              style={{ borderRadius: '8px' }}
                            />
                          </VerifiedBadge>
                        ) : (
                          <TokenImage
                            src={imgUrl}
                            alt={name}
                            width={32}
                            height={32}
                            style={{ borderRadius: '8px' }}
                          />
                        )}
                      </Box>

                      <Stack spacing={0.25} minWidth={80} maxWidth={120}>
                        <Typography
                          variant="body2"
                          fontWeight="700"
                          color={theme.palette.primary.main}
                          noWrap
                          sx={{
                            fontSize: '0.75rem',
                            lineHeight: 1.2
                          }}
                        >
                          {user}
                        </Typography>
                        <Typography
                          variant="body2"
                          color={darkMode ? alpha('#fff', 0.7) : alpha('#000', 0.6)}
                          noWrap
                          sx={{
                            fontSize: '0.65rem',
                            fontWeight: 400,
                            lineHeight: 1.2
                          }}
                        >
                          {name}
                        </Typography>
                      </Stack>
                    </Box>

                    {/* Right Section - Stats Grid */}
                    <Box 
                      display="grid" 
                      gridTemplateColumns="repeat(4, 1fr)"
                      gap={1.5}
                      flex={1}
                      alignItems="center"
                      sx={{
                        borderLeft: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        pl: 1.5
                      }}
                    >
                      {/* Price */}
                      <Box>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontSize: '0.55rem',
                            color: darkMode ? alpha('#fff', 0.5) : alpha('#000', 0.5),
                            display: 'block',
                            lineHeight: 1.2,
                            mb: 0.25
                          }}
                        >
                          Price (XRP)
                        </Typography>
                        <Typography 
                          variant="body2" 
                          fontWeight="600"
                          sx={{ 
                            fontSize: '0.7rem',
                            color: darkMode ? '#fff' : '#000',
                            lineHeight: 1.2
                          }}
                        >
                          {formatPrice(exch)}
                        </Typography>
                      </Box>
                      
                      {/* 24h Change */}
                      <Box>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontSize: '0.55rem',
                            color: darkMode ? alpha('#fff', 0.5) : alpha('#000', 0.5),
                            display: 'block',
                            lineHeight: 1.2,
                            mb: 0.25
                          }}
                        >
                          24h
                        </Typography>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Typography 
                            variant="body2" 
                            fontWeight="600"
                            sx={{ 
                              fontSize: '0.7rem',
                              color: pro24h >= 0 ? '#4caf50' : '#f44336',
                              lineHeight: 1.2
                            }}
                          >
                            {pro24h >= 0 ? '+' : ''}{pro24h ? pro24h.toFixed(2) : '0.00'}%
                          </Typography>
                          {pro24h >= 0 ? (
                            <TrendingUpIcon sx={{ fontSize: 10, color: '#4caf50' }} />
                          ) : (
                            <TrendingUpIcon sx={{ fontSize: 10, color: '#f44336', transform: 'rotate(180deg)' }} />
                          )}
                        </Box>
                      </Box>
                      
                      {/* Market Cap */}
                      <Box>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontSize: '0.55rem',
                            color: darkMode ? alpha('#fff', 0.5) : alpha('#000', 0.5),
                            display: 'block',
                            lineHeight: 1.2,
                            mb: 0.25
                          }}
                        >
                          Market Cap
                        </Typography>
                        <Typography 
                          variant="body2" 
                          fontWeight="600"
                          sx={{ 
                            fontSize: '0.7rem',
                            color: darkMode ? '#fff' : '#000',
                            lineHeight: 1.2
                          }}
                        >
                          {formatMarketCap(marketcap)}
                        </Typography>
                      </Box>
                      
                      {/* Volume */}
                      <Box>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontSize: '0.55rem',
                            color: darkMode ? alpha('#fff', 0.5) : alpha('#000', 0.5),
                            display: 'block',
                            lineHeight: 1.2,
                            mb: 0.25
                          }}
                        >
                          Volume 24h
                        </Typography>
                        <Typography 
                          variant="body2" 
                          fontWeight="600"
                          sx={{ 
                            fontSize: '0.7rem',
                            color: darkMode ? '#fff' : '#000',
                            lineHeight: 1.2
                          }}
                        >
                          {formatVolume(vol24hxrp)} XRP
                        </Typography>
                      </Box>
                    </Box>

                    {/* Trending Score Badge */}
                    {trendingScore && (
                      <Box 
                        sx={{ 
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          background: 'linear-gradient(135deg, #FF6B35, #F7931E)',
                          color: '#fff',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '0.5rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          opacity: 0.9
                        }}
                      >
                        <WhatshotIcon sx={{ fontSize: 8 }} />
                        {trendingScore}
                      </Box>
                    )}
                  </Box>
                </Link>
              </CardContent>
            </TrendingCard>
          );
        })}
      </Stack>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: 2,
          pt: 2,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <GlowingButton
          component={Link}
          href={`/trending`}
          endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
          darkMode={darkMode}
        >
          Explore All Trending Tokens
        </GlowingButton>
      </Box>
    </StackStyle>
  );
};

const TrendingScore = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 6,
  right: 6,
  background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
  color: '#fff',
  borderRadius: '4px',
  padding: '1px 4px',
  fontSize: '0.5rem',
  fontWeight: 700,
  boxShadow: `0 2px 6px ${alpha('#FF6B35', 0.3)}`,
  display: 'flex',
  alignItems: 'center',
  gap: 3,
  '& svg': {
    fontSize: 8
  }
}));

export default TrendingTokens;
