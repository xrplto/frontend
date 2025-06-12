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
import StarIcon from '@mui/icons-material/Star';
import VerifiedIcon from '@mui/icons-material/Verified';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import StackStyle from 'src/components/StackStyle';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

import { useState, useEffect } from 'react';
import axios from 'axios';

import { LazyLoadImage } from 'react-lazy-load-image-component';

const TokenImage = styled(LazyLoadImage)(({ theme }) => ({
  borderRadius: '6px',
  overflow: 'hidden',
  objectFit: 'cover',
  width: '28px',
  height: '28px',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
}));

const KYCBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#00AB55',
    color: '#fff',
    borderRadius: '50%',
    width: '12px',
    height: '12px',
    minWidth: '12px',
    fontSize: '7px',
    fontWeight: 'bold',
    border: `1px solid ${theme.palette.background.paper}`,
    boxShadow: `0 1px 3px ${alpha('#00AB55', 0.4)}`
  }
}));

const TrendingCard = styled(Card)(({ theme, darkMode, rank }) => {
  return {
    position: 'relative',
    backgroundColor:
      theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    border:
      rank <= 3
        ? `2px solid ${alpha('#FFD700', 0.3)}`
        : `1px solid ${
            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
          }`,
    borderRadius: '12px',
    boxShadow: darkMode
      ? `0 4px 16px ${alpha('#000', 0.4)}, inset 0 1px 0 ${alpha('#fff', 0.1)}`
      : `0 4px 16px ${alpha('#000', 0.12)}, inset 0 1px 0 ${alpha('#fff', 0.8)}`,
    cursor: 'pointer',
    overflow: 'hidden'
  };
});

const RankChip = styled(Chip)(({ theme, rank }) => {
  const getGradient = (rank) => {
    if (rank <= 3) {
      return 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)';
    } else if (rank <= 5) {
      return 'linear-gradient(135deg, #E5E5E5 0%, #C0C0C0 50%, #A9A9A9 100%)';
    } else {
      return 'linear-gradient(135deg, #CD7F32 0%, #B8860B 50%, #DAA520 100%)';
    }
  };

  return {
    background: getGradient(rank),
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '0.6rem',
    height: '20px',
    minWidth: '24px',
    boxShadow: `0 1px 4px ${alpha('#000', 0.3)}`,
    border: '1px solid rgba(255,255,255,0.2)',
    '& .MuiChip-label': {
      padding: '0 4px',
      textShadow: '0 1px 2px rgba(0,0,0,0.3)'
    }
  };
});

const HeaderSection = styled(Box)(({ theme, darkMode }) => ({
  position: 'relative',
  background: darkMode
    ? `linear-gradient(135deg, ${alpha('#FF6B35', 0.15)} 0%, ${alpha('#F7931E', 0.15)} 50%, ${alpha(
        '#FF6B35',
        0.1
      )} 100%)`
    : `linear-gradient(135deg, ${alpha('#FF6B35', 0.08)} 0%, ${alpha('#F7931E', 0.08)} 50%, ${alpha(
        '#FF6B35',
        0.05
      )} 100%)`,
  borderRadius: '10px',
  padding: theme.spacing(1, 1.5),
  marginBottom: theme.spacing(1.5),
  border: `1px solid ${alpha('#FF6B35', 0.2)}`,
  overflow: 'hidden'
}));

const GlowingButton = styled(Button)(({ theme, darkMode }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
  color: '#fff',
  borderRadius: '10px',
  padding: theme.spacing(0.75, 2.5),
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.8rem',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.4)}`
}));

const SkeletonCard = () => (
  <Card sx={{ borderRadius: '10px', mb: 0.75, overflow: 'hidden' }}>
    <CardContent sx={{ p: 1 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center" flex={1}>
          <Skeleton variant="circular" width={28} height={28} />
          <Stack spacing={0.2} flex={1}>
            <Skeleton variant="text" width="70%" height={18} />
            <Skeleton variant="text" width="50%" height={14} />
          </Stack>
        </Stack>
        <Skeleton variant="rectangular" width={24} height={20} sx={{ borderRadius: '10px' }} />
      </Box>
    </CardContent>
  </Card>
);

const TrendingTokens = () => {
  const BASE_URL = process.env.API_URL;
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
      <StackStyle sx={{ mt: 1.5 }}>
        <HeaderSection darkMode={darkMode}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box>
              <LocalFireDepartmentIcon sx={{ color: '#FF6B35', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight="700"
                color={darkMode ? '#fff' : '#1a1a1a'}
              >
                Trending XRPL Tokens
              </Typography>
              <Typography
                variant="body2"
                color={darkMode ? alpha('#fff', 0.7) : alpha('#1a1a1a', 0.7)}
                sx={{ fontSize: '0.75rem' }}
              >
                Hottest tokens gaining momentum right now
              </Typography>
            </Box>
          </Stack>
        </HeaderSection>
        {[...Array(6)].map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </StackStyle>
    );
  }

  return (
    <StackStyle sx={{ mt: 1.5 }}>
      <HeaderSection darkMode={darkMode}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box>
            <LocalFireDepartmentIcon sx={{ color: '#FF6B35', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight="700" color={darkMode ? '#fff' : '#1a1a1a'}>
              Trending XRPL Tokens
            </Typography>
            <Typography
              variant="body2"
              color={darkMode ? alpha('#fff', 0.7) : alpha('#1a1a1a', 0.7)}
              sx={{ fontSize: '0.75rem' }}
            >
              Hottest tokens gaining momentum right now
            </Typography>
          </Box>
        </Stack>
      </HeaderSection>

      <Stack spacing={0.75}>
        {trendingList.map((row, index) => {
          const { md5, id, name, user, slug, kyc, isOMCF } = row;
          const imgUrl = `https://s1.xrpl.to/token/${md5}`;
          const link = `/token/${slug}`;
          const rank = index + 1;

          return (
            <TrendingCard darkMode={darkMode} rank={rank} key={id}>
              <CardContent sx={{ p: 1 }}>
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
                      spacing={1}
                      alignItems="center"
                      flex={1}
                      className="token-info"
                    >
                      <Box sx={{ position: 'relative' }}>
                        {kyc ? (
                          <KYCBadge
                            badgeContent={<VerifiedIcon sx={{ fontSize: 7 }} />}
                            overlap="circular"
                            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                          >
                            <TokenImage
                              className="token-image"
                              src={imgUrl}
                              width={28}
                              height={28}
                              onError={(event) => (event.target.src = '/static/alt.webp')}
                            />
                          </KYCBadge>
                        ) : (
                          <TokenImage
                            className="token-image"
                            src={imgUrl}
                            width={28}
                            height={28}
                            onError={(event) => (event.target.src = '/static/alt.webp')}
                          />
                        )}
                      </Box>

                      <Stack spacing={0.1} flex={1} minWidth={0}>
                        <Box display="flex" alignItems="center" gap={0.3}>
                          <Typography
                            variant="body2"
                            fontWeight="700"
                            color={
                              isOMCF !== 'yes'
                                ? darkMode
                                  ? '#fff'
                                  : '#1a1a1a'
                                : darkMode
                                ? '#4FC3F7'
                                : '#1976d2'
                            }
                            noWrap
                            sx={{
                              fontSize: '0.85rem',
                              lineHeight: 1.2,
                              textShadow: darkMode ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                            }}
                          >
                            {user}
                          </Typography>
                          {isOMCF === 'yes' && (
                            <Tooltip title="OMCF Premium Token" arrow placement="top">
                              <StarIcon
                                sx={{
                                  color: '#FFD700',
                                  fontSize: 12,
                                  filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.6))'
                                }}
                              />
                            </Tooltip>
                          )}
                          {rank <= 3 && (
                            <Tooltip title="Top Performer" arrow placement="top">
                              <TrendingUpIcon
                                sx={{
                                  color: '#FF6B35',
                                  fontSize: 12
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
                            fontSize: '0.7rem',
                            fontWeight: 500
                          }}
                        >
                          {name}
                        </Typography>
                      </Stack>
                    </Stack>

                    <RankChip className="rank-chip" rank={rank} label={`#${rank}`} size="small" />
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
          mt: 1,
          mb: 0
        }}
      >
        <GlowingButton
          component={Link}
          href={`/?sort=trendingScore&order=desc`}
          endIcon={<ArrowForwardIcon />}
          darkMode={darkMode}
        >
          View All Trending Tokens
        </GlowingButton>
      </Box>
    </StackStyle>
  );
};

export default TrendingTokens;
