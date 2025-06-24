import Decimal from 'decimal.js';
import { useContext, useState, useEffect, useRef } from 'react';
// Material
import { withStyles } from '@mui/styles';
import { alpha, Box, Grid, Stack, Typography, Skeleton, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

// import i18n (needs to be bundled ;))
import 'src/utils/i18n';
// Translations
import { useTranslation } from 'react-i18next';

// Redux
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';

// Utils
import { fNumber, fNumberWithSuffix } from 'src/utils/formatNumber';

// Components
import BearBull from 'src/components/BearBull';
import { currencySymbols } from 'src/utils/constants';
import { AppContext } from 'src/AppContext';

// Updated styled components with zero top spacing on mobile
const ContentTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#FFFFFF' : alpha('#919EAB', 0.99),
  display: 'block',
  lineHeight: 1.3,
  whiteSpace: 'normal',
  wordWrap: 'break-word',
  fontSize: '0.9rem',
  // Smaller font size on mobile
  [theme.breakpoints.down('md')]: {
    fontSize: '0.75rem'
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.65rem'
  }
}));

// Enhanced MetricBox with modern styling
const MetricBox = styled(Paper)(({ theme }) => ({
  padding: '16px 18px',
  [theme.breakpoints.down('md')]: {
    padding: '3px 4px'
  },
  [theme.breakpoints.down('sm')]: {
    padding: '2px 3px'
  },
  borderRadius: '16px',
  [theme.breakpoints.down('md')]: {
    borderRadius: '4px'
  },
  [theme.breakpoints.down('sm')]: {
    borderRadius: '3px'
  },
  background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(
    theme.palette.background.paper,
    0.95
  )} 50%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
  backdropFilter: 'blur(40px)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  minWidth: '140px',
  [theme.breakpoints.down('md')]: {
    minWidth: '75px'
  },
  [theme.breakpoints.down('sm')]: {
    minWidth: '65px',
    minHeight: '28px'
  },
  border: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
  [theme.breakpoints.down('sm')]: {
    border: 'none'
  },
  boxShadow: 'none',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: `linear-gradient(90deg, 
      ${theme.palette.primary.main} 0%, 
      ${theme.palette.success.main} 25%, 
      ${theme.palette.info.main} 50%, 
      ${theme.palette.warning.main} 75%, 
      ${theme.palette.error.main} 100%
    )`,
    borderRadius: '16px 16px 0 0',
    opacity: 0.9,
    animation: 'shimmer 3s ease-in-out infinite',
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    },
    zIndex: 1
  },
  '@keyframes shimmer': {
    '0%, 100%': { opacity: 0.9 },
    '50%': { opacity: 0.6 }
  }
}));

// Ultra-compact MetricTitle
const MetricTitle = styled(Typography)(({ theme }) => ({
  fontSize: '0.8rem',
  // Ultra-small font size on mobile
  [theme.breakpoints.down('md')]: {
    fontSize: '0.6rem'
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.55rem'
  },
  fontWeight: 600,
  color: theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.9) : alpha('#637381', 0.9),
  marginBottom: '6px',
  // Minimal margin on mobile
  [theme.breakpoints.down('md')]: {
    marginBottom: '1px'
  },
  [theme.breakpoints.down('sm')]: {
    marginBottom: '0px'
  },
  whiteSpace: 'nowrap',
  letterSpacing: '-0.01em',
  // Make title text even smaller and truncate if needed
  [theme.breakpoints.down('sm')]: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%'
  }
}));

// Ultra-compact MetricValue
const MetricValue = styled(Typography)(({ theme }) => ({
  fontSize: '1rem',
  // Ultra-small font size on mobile
  [theme.breakpoints.down('md')]: {
    fontSize: '0.75rem'
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.65rem'
  },
  fontWeight: 700,
  color: theme.palette.mode === 'dark' ? '#FFFFFF' : '#212B36',
  marginBottom: '4px',
  // No margin on mobile
  [theme.breakpoints.down('md')]: {
    marginBottom: '0px'
  },
  [theme.breakpoints.down('sm')]: {
    marginBottom: '0px'
  },
  letterSpacing: '-0.02em',
  lineHeight: 1.2
}));

// Ultra-compact PercentageChange
const PercentageChange = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isPositive'
})(({ theme, isPositive }) => ({
  fontSize: '0.75rem',
  // Ultra-small font size on mobile
  [theme.breakpoints.down('md')]: {
    fontSize: '0.55rem'
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.5rem'
  },
  color: isPositive ? theme.palette.success.main : theme.palette.error.main,
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  // No gap on mobile
  [theme.breakpoints.down('sm')]: {
    gap: '0px'
  },
  fontWeight: 600,
  padding: '2px 6px',
  // No padding on mobile
  [theme.breakpoints.down('md')]: {
    padding: '0px'
  },
  [theme.breakpoints.down('sm')]: {
    padding: '0px'
  },
  borderRadius: '6px',
  background: 'transparent',
  border: 'none'
}));

// Ultra-compact VolumePercentage
const VolumePercentage = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  // Ultra-small font size on mobile
  [theme.breakpoints.down('md')]: {
    fontSize: '0.55rem'
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.5rem'
  },
  color: theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.7) : alpha('#637381', 0.9),
  display: 'flex',
  alignItems: 'center',
  fontWeight: 500,
  padding: '2px 6px',
  // No padding on mobile
  [theme.breakpoints.down('md')]: {
    padding: '0px'
  },
  [theme.breakpoints.down('sm')]: {
    padding: '0px'
  },
  borderRadius: '6px',
  background: 'transparent',
  border: 'none'
}));

function Rate(num, exch) {
  if (num === 0 || exch === 0) return 0;
  return fNumber(num / exch);
}

// Helper function for consistent number formatting with 2 decimal places
const formatNumberWithDecimals = (num) => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
};

export default function Summary() {
  const { t } = useTranslation(); // set translation const
  const metrics = useSelector(selectMetrics);
  const { activeFiatCurrency } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(true);
  const [trendingTokens, setTrendingTokens] = useState([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);

  // Fetch trending tokens
  useEffect(() => {
    const fetchTrendingTokens = async () => {
      try {
        setIsTrendingLoading(true);
        const response = await fetch(
          'https://api.xrpl.to/api/tokens?sort=trendingScore&order=desc&limit=5&skipMetrics=true'
        );
        const data = await response.json();

        if (data.result === 'success' && data.tokens) {
          setTrendingTokens(data.tokens);
        }
      } catch (error) {
        console.error('Error fetching trending tokens:', error);
      } finally {
        setIsTrendingLoading(false);
      }
    };

    fetchTrendingTokens();
  }, []);

  // Simulate loading completion after data is available
  useEffect(() => {
    if (metrics.global && metrics[activeFiatCurrency]) {
      setIsLoading(false);
    }
  }, [metrics, activeFiatCurrency]);

  if (
    !metrics.global ||
    !metrics[activeFiatCurrency] ||
    !metrics.global.gMarketcap ||
    !metrics.global.gMarketcapPro ||
    !metrics.global.gDexVolume ||
    !metrics.global.gDexVolumePro
  ) {
    console.log(
      '----------->Empty metrics value detected (Summary block disabled): metrics.global',
      metrics.global,
      'metrics[activeFiatCurrency]',
      metrics[activeFiatCurrency]
    );
  }

  // Add default value of 1 for the divisor to prevent DecimalError
  const fiatRate = metrics[activeFiatCurrency] || 1;

  const gMarketcap = new Decimal(metrics.global?.gMarketcap || 0)
    .div(fiatRate)
    .toFixed(2, Decimal.ROUND_DOWN);
  const gMarketcapPro = new Decimal(metrics.global?.gMarketcapPro || 0).toNumber();
  const gDexVolume = new Decimal(metrics.global?.gDexVolume || 0).div(fiatRate).toNumber();
  const gDexVolumePro = new Decimal(metrics.global?.gDexVolumePro || 0).toNumber();
  const gNFTIOUVolume = new Decimal(metrics.global?.gNFTIOUVolume || 0).div(fiatRate).toNumber();
  const gNFTIOUVolumePro = new Decimal(metrics.global?.gNFTIOUVolumePro || 0).toFixed(
    2,
    Decimal.ROUND_DOWN
  );
  const gStableVolume = new Decimal(metrics.global?.gStableVolume || 0).div(fiatRate).toNumber();
  const gStableVolumePro = new Decimal(metrics.global?.gStableVolumePro || 0).toFixed(
    2,
    Decimal.ROUND_DOWN
  );
  const gMemeVolume = new Decimal(metrics.global?.gMemeVolume || 0).div(fiatRate).toNumber();
  const gMemeVolumePro = new Decimal(metrics.global?.gMemeVolumePro || 0).toFixed(
    2,
    Decimal.ROUND_DOWN
  );

  // Show XRP price in USD when currency is XRP, otherwise show in active currency
  const xrpPrice =
    activeFiatCurrency === 'XRP'
      ? Rate(1, metrics.USD || 1)
      : Rate(1, metrics[activeFiatCurrency] || 1);

  // Get the currency symbol for XRP price display
  const xrpPriceSymbol =
    activeFiatCurrency === 'XRP' ? currencySymbols.USD : currencySymbols[activeFiatCurrency];

  const formatTokenPrice = (token, fiatRate) => {
    if (!token.usd || !fiatRate) return '0.00';
    const price = new Decimal(token.usd).div(fiatRate).toNumber();
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    if (price >= 0.0001) return price.toFixed(6);
    return price.toExponential(2);
  };

  const getTokenImageUrl = (token) => {
    if (token.md5 && token.ext) {
      return `https://xrpl.to/static/tokens/${token.md5}.${token.ext}`;
    }
    return null;
  };

  return (
    <Stack
      sx={{
        // EXTREMELY AGGRESSIVE negative margins on mobile to eliminate ALL top spacing
        mt: { xs: '-24px', sm: '-20px', md: 0 }, // Even more aggressive negative margin
        mb: 0,
        pt: 0,
        pb: 0,
        [(theme) => theme.breakpoints.up('md')]: {
          mt: 0,
          mb: 2
        },
        width: '100%',
        maxWidth: '100%',
        px: 0,
        // Extremely aggressive mobile-specific positioning
        [(theme) => theme.breakpoints.down('sm')]: {
          position: 'relative',
          top: '-12px' // Pull entire component up extremely aggressively on mobile
        },
        [(theme) => theme.breakpoints.down('md')]: {
          position: 'relative',
          top: '-10px' // Pull up more on medium screens
        }
      }}
    >
      <Typography
        variant="h1"
        sx={{
          // ZERO margins on mobile, hidden completely on small screens
          mb: 0,
          mt: 0,
          pt: 0,
          pb: 0,
          [(theme) => theme.breakpoints.up('md')]: {
            mb: 1.5
          },
          [(theme) => theme.breakpoints.down('sm')]: {
            display: 'none' // Completely hide title on mobile to save space
          },
          fontSize: '1.4rem',
          [(theme) => theme.breakpoints.down('md')]: {
            fontSize: '0.85rem'
          },
          fontWeight: 700,
          width: '100%',
          letterSpacing: '-0.02em',
          background: `linear-gradient(135deg, ${(theme) => theme.palette.text.primary} 0%, ${(
            theme
          ) => alpha(theme.palette.primary.main, 0.8)} 100%)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}
      >
        {t("Today's Top XRPL Token Prices by Volume")}
      </Typography>

      <Stack spacing={3} sx={{ width: '100%' }}>
        {/* Main Metrics Section */}
        {isLoading ? (
          <Box
            sx={{
              overflowX: 'auto',
              width: '100%',
              maxWidth: '100vw',
              pb: 0, // Zero padding on mobile
              mt: { xs: '-12px', sm: '-8px', md: 0 }, // Extremely aggressive negative margin on loading state
              [(theme) => theme.breakpoints.up('md')]: {
                pb: 1
              },
              [(theme) => theme.breakpoints.down('sm')]: {
                overflowX: 'hidden'
              }
            }}
          >
            <Grid
              container
              spacing={0} // Zero spacing on mobile
              sx={{
                flexWrap: 'nowrap',
                minWidth: '900px',
                [(theme) => theme.breakpoints.down('sm')]: {
                  flexWrap: 'wrap',
                  minWidth: 'unset',
                  width: '100%',
                  margin: 0,
                  gap: '1px' // Ultra-minimal gap
                },
                [(theme) => theme.breakpoints.down('md')]: {
                  minWidth: '700px'
                },
                [(theme) => theme.breakpoints.up('md')]: {
                  spacing: 2
                },
                width: '100%'
              }}
            >
              {[...Array(6)].map((_, index) => (
                <Grid
                  item
                  key={index}
                  sx={{
                    flex: '1 0 auto',
                    [(theme) => theme.breakpoints.down('sm')]: {
                      flex: 'none',
                      width: 'calc(50% - 0.5px)', // Even tighter width
                      maxWidth: 'calc(50% - 0.5px)',
                      padding: '0 !important'
                    }
                  }}
                >
                  <Skeleton
                    variant="rectangular"
                    height={100}
                    sx={{
                      borderRadius: '20px',
                      [(theme) => theme.breakpoints.down('sm')]: {
                        height: 32, // Even smaller height
                        borderRadius: '3px'
                      },
                      minWidth: '140px',
                      [(theme) => theme.breakpoints.down('sm')]: {
                        minWidth: 'unset',
                        width: '100%'
                      },
                      [(theme) => theme.breakpoints.down('md')]: {
                        minWidth: '110px'
                      },
                      background: (theme) =>
                        `linear-gradient(135deg, ${alpha(
                          theme.palette.background.paper,
                          0.8
                        )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : (
          <Box
            sx={{
              width: '100%',
              pb: 0,
              mt: { xs: '-12px', sm: '-8px', md: 0 },
              [(theme) => theme.breakpoints.up('md')]: {
                pb: 2
              }
            }}
          >
            <Grid
              container
              spacing={2}
              sx={{
                flexWrap: 'wrap',
                width: '100%',
                [(theme) => theme.breakpoints.down('sm')]: {
                  spacing: 1,
                  gap: '1px'
                }
              }}
            >
              {/* Left side - Main metrics in 2 rows */}
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  {/* Market Cap Box */}
                  <Grid
                    item
                    xs={6}
                    md={4}
                    sx={{
                      [(theme) => theme.breakpoints.down('sm')]: {
                        padding: '0 !important'
                      }
                    }}
                  >
                    <MetricBox elevation={0}>
                      <MetricTitle>{t('Global Market Cap')}</MetricTitle>
                      <div>
                        <MetricValue>
                          {currencySymbols[activeFiatCurrency]}
                          {formatNumberWithDecimals(Number(gMarketcap))}
                        </MetricValue>
                        <PercentageChange isPositive={gMarketcapPro >= 0}>
                          {gMarketcapPro >= 0 ? '▲' : '▼'} {Math.abs(gMarketcapPro).toFixed(2)}%
                        </PercentageChange>
                      </div>
                    </MetricBox>
                  </Grid>

                  {/* DEX Volume Box */}
                  <Grid
                    item
                    xs={6}
                    md={4}
                    sx={{
                      [(theme) => theme.breakpoints.down('sm')]: {
                        padding: '0 !important'
                      }
                    }}
                  >
                    <MetricBox elevation={0}>
                      <MetricTitle>{t('24h DEX Volume')}</MetricTitle>
                      <div>
                        <MetricValue>
                          {currencySymbols[activeFiatCurrency]}
                          {formatNumberWithDecimals(gDexVolume)}
                        </MetricValue>
                        <PercentageChange isPositive={gDexVolumePro >= 0}>
                          {gDexVolumePro >= 0 ? '▲' : '▼'} {Math.abs(gDexVolumePro).toFixed(2)}%
                        </PercentageChange>
                      </div>
                    </MetricBox>
                  </Grid>

                  {/* XRP Price Box */}
                  <Grid
                    item
                    xs={6}
                    md={4}
                    sx={{
                      [(theme) => theme.breakpoints.down('sm')]: {
                        padding: '0 !important'
                      }
                    }}
                  >
                    <MetricBox elevation={0}>
                      <MetricTitle>{t('XRP Price')}</MetricTitle>
                      <div>
                        <MetricValue>
                          {xrpPriceSymbol}
                          {xrpPrice}
                        </MetricValue>
                        <ContentTypography
                          sx={{
                            fontSize: '0.75rem',
                            [(theme) => theme.breakpoints.down('md')]: {
                              fontSize: '0.6rem'
                            },
                            [(theme) => theme.breakpoints.down('sm')]: {
                              fontSize: '0.55rem'
                            },
                            padding: '2px 6px',
                            [(theme) => theme.breakpoints.down('md')]: {
                              padding: '1px 3px'
                            },
                            [(theme) => theme.breakpoints.down('sm')]: {
                              padding: '0px 2px'
                            },
                            borderRadius: '6px',
                            background: 'transparent',
                            border: 'none',
                            display: 'inline-block',
                            color: (theme) =>
                              theme.palette.mode === 'dark'
                                ? alpha('#FFFFFF', 0.7)
                                : alpha('#637381', 0.9)
                          }}
                        >
                          {activeFiatCurrency === 'XRP' ? 'USD Value' : 'Native XRPL'}
                        </ContentTypography>
                      </div>
                    </MetricBox>
                  </Grid>

                  {/* NFT Volume Box */}
                  <Grid
                    item
                    xs={6}
                    md={4}
                    sx={{
                      [(theme) => theme.breakpoints.down('sm')]: {
                        padding: '0 !important'
                      }
                    }}
                  >
                    <MetricBox elevation={0}>
                      <MetricTitle>{t('Collectibles & NFTs')}</MetricTitle>
                      <div>
                        <MetricValue>
                          {currencySymbols[activeFiatCurrency]}
                          {formatNumberWithDecimals(gNFTIOUVolume)}
                        </MetricValue>
                        <VolumePercentage>{gNFTIOUVolumePro}% of volume</VolumePercentage>
                      </div>
                    </MetricBox>
                  </Grid>

                  {/* Stablecoins Box */}
                  <Grid
                    item
                    xs={6}
                    md={4}
                    sx={{
                      [(theme) => theme.breakpoints.down('sm')]: {
                        padding: '0 !important'
                      }
                    }}
                  >
                    <MetricBox elevation={0}>
                      <MetricTitle>{t('Stablecoins')}</MetricTitle>
                      <div>
                        <MetricValue>
                          {currencySymbols[activeFiatCurrency]}
                          {formatNumberWithDecimals(gStableVolume)}
                        </MetricValue>
                        <VolumePercentage>{gStableVolumePro}% of volume</VolumePercentage>
                      </div>
                    </MetricBox>
                  </Grid>

                  {/* Meme Tokens Box */}
                  <Grid
                    item
                    xs={6}
                    md={4}
                    sx={{
                      [(theme) => theme.breakpoints.down('sm')]: {
                        padding: '0 !important'
                      }
                    }}
                  >
                    <MetricBox elevation={0}>
                      <MetricTitle>{t('Meme Tokens')}</MetricTitle>
                      <div>
                        <MetricValue>
                          {currencySymbols[activeFiatCurrency]}
                          {formatNumberWithDecimals(gMemeVolume)}
                        </MetricValue>
                        <VolumePercentage>{gMemeVolumePro}% of volume</VolumePercentage>
                      </div>
                    </MetricBox>
                  </Grid>
                </Grid>
              </Grid>

              {/* Right side - Trending Tokens */}
              <Grid item xs={12} md={4}>
                {!isTrendingLoading && trendingTokens.length > 0 && (
                  <MetricBox
                    elevation={0}
                    sx={{
                      background: (theme) =>
                        `linear-gradient(145deg, ${alpha(
                          theme.palette.background.paper,
                          0.98
                        )} 0%, ${alpha(theme.palette.background.paper, 0.95)} 50%, ${alpha(
                          theme.palette.primary.main,
                          0.02
                        )} 100%)`,
                      borderLeft: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                      [(theme) => theme.breakpoints.down('sm')]: {
                        borderLeft: 'none'
                      },
                      height: '100%'
                    }}
                  >
                    <MetricTitle
                      sx={{ display: 'flex', alignItems: 'center', gap: '4px', mb: '4px' }}
                    >
                      <Box
                        sx={{
                          fontSize: '0.65rem',
                          [(theme) => theme.breakpoints.down('sm')]: {
                            fontSize: '0.55rem'
                          }
                        }}
                      >
                        🔥
                      </Box>
                      <Box sx={{ flex: 1 }}>{t('Trending Tokens')}</Box>
                      <Box
                        sx={{
                          fontSize: '0.55rem',
                          [(theme) => theme.breakpoints.down('md')]: {
                            fontSize: '0.45rem'
                          },
                          [(theme) => theme.breakpoints.down('sm')]: {
                            fontSize: '0.4rem'
                          },
                          color: (theme) => alpha(theme.palette.text.secondary, 0.7),
                          fontWeight: 500
                        }}
                      >
                        TOP 5
                      </Box>
                    </MetricTitle>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px'
                      }}
                    >
                      {trendingTokens.map((token, index) => (
                        <Box
                          key={token._id}
                          onClick={() => {
                            window.open(`/token/${token.slug}`, '_blank');
                          }}
                          sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            [(theme) => theme.breakpoints.down('sm')]: {
                              padding: '3px 6px'
                            },
                            borderRadius: '6px',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                              transform: 'translateX(2px)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                            <Typography
                              sx={{
                                fontSize: '0.6rem',
                                [(theme) => theme.breakpoints.down('md')]: {
                                  fontSize: '0.55rem'
                                },
                                [(theme) => theme.breakpoints.down('sm')]: {
                                  fontSize: '0.5rem'
                                },
                                fontWeight: 700,
                                color: (theme) => alpha(theme.palette.text.secondary, 0.8),
                                minWidth: '14px',
                                textAlign: 'center'
                              }}
                            >
                              {index + 1}
                            </Typography>
                            <Box
                              sx={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '1px' }}
                            >
                              <Typography
                                sx={{
                                  fontSize: '0.72rem',
                                  [(theme) => theme.breakpoints.down('md')]: {
                                    fontSize: '0.65rem'
                                  },
                                  [(theme) => theme.breakpoints.down('sm')]: {
                                    fontSize: '0.6rem'
                                  },
                                  fontWeight: 650,
                                  color: (theme) => theme.palette.text.primary,
                                  lineHeight: 1.1
                                }}
                              >
                                {token.name}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '0.62rem',
                                  [(theme) => theme.breakpoints.down('md')]: {
                                    fontSize: '0.55rem'
                                  },
                                  [(theme) => theme.breakpoints.down('sm')]: {
                                    fontSize: '0.5rem'
                                  },
                                  color: (theme) => theme.palette.text.secondary,
                                  fontWeight: 500,
                                  lineHeight: 1.0
                                }}
                              >
                                {currencySymbols[activeFiatCurrency]}
                                {formatTokenPrice(token, fiatRate)}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <Typography
                              sx={{
                                fontSize: '0.55rem',
                                [(theme) => theme.breakpoints.down('md')]: {
                                  fontSize: '0.5rem'
                                },
                                [(theme) => theme.breakpoints.down('sm')]: {
                                  fontSize: '0.45rem'
                                },
                                color:
                                  token.pro24h >= 0
                                    ? (theme) => theme.palette.success.main
                                    : (theme) => theme.palette.error.main,
                                fontWeight: 500
                              }}
                            >
                              {token.pro24h >= 0 ? '↗' : '↘'}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: '0.68rem',
                                [(theme) => theme.breakpoints.down('md')]: {
                                  fontSize: '0.6rem'
                                },
                                [(theme) => theme.breakpoints.down('sm')]: {
                                  fontSize: '0.55rem'
                                },
                                color:
                                  token.pro24h >= 0
                                    ? (theme) => theme.palette.success.main
                                    : (theme) => theme.palette.error.main,
                                fontWeight: 700
                              }}
                            >
                              {Math.abs(token.pro24h).toFixed(1)}%
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </MetricBox>
                )}

                {/* Loading skeleton for trending tokens */}
                {isTrendingLoading && (
                  <Skeleton
                    variant="rectangular"
                    height={140}
                    sx={{
                      borderRadius: '16px',
                      [(theme) => theme.breakpoints.down('sm')]: {
                        height: 100,
                        borderRadius: '8px'
                      },
                      background: (theme) =>
                        `linear-gradient(135deg, ${alpha(
                          theme.palette.background.paper,
                          0.8
                        )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`
                    }}
                  />
                )}
              </Grid>
            </Grid>
          </Box>
        )}
      </Stack>
    </Stack>
  );
}
