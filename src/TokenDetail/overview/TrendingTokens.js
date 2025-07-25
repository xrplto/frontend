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
  width: '24px',
  height: '24px',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
}));

const VerifiedBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#1976d2',
    color: '#fff',
    borderRadius: '50%',
    width: '10px',
    height: '10px',
    minWidth: '10px',
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
      ? `1.5px solid ${alpha('#FFD700', 0.3)}`
      : `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
  boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.03)}`,
  cursor: 'pointer',
  overflow: 'hidden',
  '&::before': {
    display: 'none'
  }
}));

// Removed styled component - will use inline styles instead

const HeaderSection = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'darkMode'
})(({ theme, darkMode }) => ({
  position: 'relative',
  background: 'transparent',
  borderRadius: '6px',
  padding: theme.spacing(0.5, 1),
  marginBottom: theme.spacing(0.75),
  border: `1px solid ${alpha('#FF6B35', 0.2)}`,
  overflow: 'hidden'
}));

const GlowingButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'darkMode'
})(({ theme, darkMode }) => ({
  background: 'transparent',
  color: `${theme.palette.primary.main} !important`,
  borderRadius: '6px',
  padding: theme.spacing(0.5, 2),
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.75rem',
  position: 'relative',
  overflow: 'hidden',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  boxShadow: 'none',
  '&:hover': {
    background: alpha(theme.palette.primary.main, 0.05),
    color: `${theme.palette.primary.dark} !important`,
    transform: 'translateY(-1px)',
    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`
  }
}));

const SkeletonCard = () => (
  <Card sx={{ borderRadius: '6px', mb: 0.5, overflow: 'hidden' }}>
    <CardContent sx={{ p: 0.75 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={0.75} alignItems="center" flex={1}>
          <Skeleton variant="circular" width={24} height={24} />
          <Stack spacing={0.1} flex={1}>
            <Skeleton variant="text" width="70%" height={16} />
            <Skeleton variant="text" width="50%" height={12} />
          </Stack>
        </Stack>
        <Skeleton variant="rectangular" width={20} height={18} sx={{ borderRadius: '6px' }} />
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
        mt: 1,
        background: 'transparent',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        borderRadius: { xs: '8px', sm: '10px' },
        boxShadow: `
          0 4px 16px ${alpha(theme.palette.common.black, 0.08)}, 
          0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
          inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
        padding: { xs: 1.5, sm: 2 },
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
              <LocalFireDepartmentIcon sx={{ color: '#FF6B35', fontSize: 16 }} />
            </Box>
            <Box>
              <Typography
                variant="body2"
                fontWeight="700"
                color={darkMode ? '#fff' : '#1a1a1a'}
                sx={{ fontSize: '0.85rem' }}
              >
                Trending XRPL Tokens
              </Typography>
              <Typography
                variant="caption"
                color={darkMode ? alpha('#fff', 0.7) : alpha('#1a1a1a', 0.7)}
                sx={{ fontSize: '0.7rem' }}
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
      borderRadius: { xs: '8px', sm: '10px' },
      boxShadow: `
        0 4px 16px ${alpha(theme.palette.common.black, 0.08)}, 
        0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
        inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
      padding: { xs: 1.5, sm: 2 },
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
            <LocalFireDepartmentIcon sx={{ color: '#FF6B35', fontSize: 16 }} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="700" color={darkMode ? '#fff' : '#1a1a1a'} sx={{ fontSize: '0.85rem' }}>
              Trending XRPL Tokens
            </Typography>
            <Typography
              variant="caption"
              color={darkMode ? alpha('#fff', 0.7) : alpha('#1a1a1a', 0.7)}
              sx={{ fontSize: '0.7rem' }}
            >
              Hottest tokens gaining momentum right now
            </Typography>
          </Box>
        </Stack>
      </HeaderSection>

      <Stack spacing={0.4}>
        {trendingList.map((row, index) => {
          const { md5, id, name, user, slug, verified, isOMCF } = row;
          const imgUrl = `https://s1.xrpl.to/token/${md5}`;
          const link = `/token/${slug}`;
          const rank = index + 1;

          return (
            <TrendingCard darkMode={darkMode} rank={rank} key={`trending-${index}-${id}-${md5}`}>
              <CardContent sx={{ p: 0.6 }}>
                <Link
                  underline="none"
                  color="inherit"
                  href={link}
                  rel="noreferrer noopener nofollow"
                  sx={{ textDecoration: 'none' }}
                >
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Stack
                      direction="row"
                      spacing={0.6}
                      alignItems="center"
                      flex={1}
                      className="token-info"
                    >
                      <Box sx={{ position: 'relative' }}>
                        {verified ? (
                          <VerifiedBadge
                            badgeContent={<VerifiedIcon sx={{ fontSize: 7 }} />}
                            overlap="circular"
                            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                          >
                            <TokenImage
                              className="token-image"
                              src={imgUrl}
                              alt={name}
                              width={28}
                              height={28}
                            />
                          </VerifiedBadge>
                        ) : (
                          <TokenImage
                            className="token-image"
                            src={imgUrl}
                            alt={name}
                            width={24}
                            height={24}
                          />
                        )}
                      </Box>

                      <Stack spacing={0} flex={1} minWidth={0}>
                        <Box display="flex" alignItems="center" gap={0.2}>
                          <Typography
                            variant="body2"
                            fontWeight="700"
                            color={theme.palette.primary.main}
                            noWrap
                            sx={{
                              fontSize: '0.75rem',
                              lineHeight: 1.1,
                              textShadow: darkMode ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                            }}
                          >
                            {user}
                          </Typography>
                          {rank <= 3 && (
                            <Tooltip title="Top Performer" arrow placement="top">
                              <TrendingUpIcon
                                sx={{
                                  color: '#FF6B35',
                                  fontSize: 10
                                }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                        <Typography
                          variant="body2"
                          color={darkMode ? alpha('#fff', 0.65) : alpha('#1a1a1a', 0.65)}
                          noWrap
                          sx={{
                            fontSize: '0.65rem',
                            fontWeight: 500
                          }}
                        >
                          {name}
                        </Typography>
                      </Stack>
                    </Stack>

                    <Chip 
                      className="rank-chip" 
                      label={`#${rank}`} 
                      size="small"
                      sx={{
                        background: 'transparent',
                        color: rank <= 3 
                          ? '#FFD700'
                          : rank <= 5
                          ? '#C0C0C0'
                          : '#CD7F32',
                        fontWeight: 'bold',
                        fontSize: '0.65rem',
                        height: '18px',
                        minWidth: '22px',
                        boxShadow: 'none',
                        border: `1px solid ${rank <= 3 ? '#FFD700' : rank <= 5 ? '#C0C0C0' : '#CD7F32'}`,
                        '& .MuiChip-label': {
                          padding: '0 3px'
                        }
                      }}
                    />
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
          mt: 0.75,
          mb: 0
        }}
      >
        <GlowingButton
          component={Link}
          href={`/trending`}
          endIcon={<ArrowForwardIcon />}
          darkMode={darkMode}
        >
          View All Trending Tokens
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
  padding: '1px 6px',
  fontSize: '0.6rem',
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
