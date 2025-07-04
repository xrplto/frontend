import Decimal from 'decimal.js';
import { useContext, useState, useEffect, useRef, useMemo } from 'react';
// Material
import {
  alpha,
  Avatar,
  Box,
  Grid,
  Stack,
  Typography,
  Skeleton,
  Paper,
  Divider,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import GroupIcon from '@mui/icons-material/Group';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BusinessIcon from '@mui/icons-material/Business';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';

// import i18n (needs to be bundled ;))
import 'src/utils/i18n';
// Translations
import { useTranslation } from 'react-i18next';

// Redux
import { useSelector } from 'react-redux';
import { selectMetrics, selectTokenCreation } from 'src/redux/statusSlice';

// Utils
import { fNumber } from 'src/utils/formatNumber';

// Components
import { currencySymbols } from 'src/utils/constants';
import { AppContext } from 'src/AppContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { format } from 'date-fns';
import { useTheme } from '@mui/material';

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
    fontSize: '0.55rem' // Even smaller font size
  }
}));

// Enhanced MetricBox with modern styling
const MetricBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.1) // Even more aggressive smaller padding on mobile
  },
  height: '100%',
  [theme.breakpoints.down('sm')]: {
    minHeight: '45px' // Even more aggressive height reduction on mobile
  },
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  borderRadius: '20px',
  background: alpha(theme.palette.background.paper, 0.7),
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.05)}`,
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.1)}, 0 0 15px ${alpha(
      theme.palette.primary.main,
      0.3
    )}`
  }
}));

// Ultra-compact MetricTitle
const MetricTitle = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  fontWeight: 500,
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(0.5),
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.45rem', // Even smaller font size on mobile
    marginBottom: 0 // Remove bottom margin for metric title on mobile
  }
}));

// Ultra-compact MetricValue
const MetricValue = styled(Typography)(({ theme }) => ({
  fontSize: '1.4rem',
  fontWeight: 700,
  color: theme.palette.text.primary,
  lineHeight: 1.2,
  marginBottom: 0,
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.65rem' // Even smaller on mobile for very tight spaces
  }
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
    fontSize: '0.4rem' // Even smaller font size
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
    fontSize: '0.4rem' // Even smaller font size
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
  const tokenCreation = useSelector(selectTokenCreation);
  const { activeFiatCurrency } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(true);
  const theme = useTheme();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const platforms = data.platforms || {};

      const platformEntries = Object.entries(platforms).filter(([, value]) => value > 0);

      const tokensInvolved = (data.tokensInvolved || [])
        .slice()
        .sort((a, b) => (b.marketcap || 0) - (a.marketcap || 0));

      const renderStat = (Icon, label, value) => (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={0.5}
          sx={{ width: '100%' }}
        >
          <Stack direction="row" alignItems="center" spacing={0.25}>
            <Icon sx={{ fontSize: '0.7rem', color: 'text.secondary' }} />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}
            >
              {label}
            </Typography>
          </Stack>
          <Typography
            variant="caption"
            sx={{ fontWeight: 'bold', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
          >
            {value}
          </Typography>
        </Stack>
      );

      return (
        <Paper
          sx={{
            p: { xs: 0.1, sm: 1.5 },
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.95
            )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            boxShadow: theme.shadows[5],
            border: `1px solid ${theme.palette.divider}`,
            minWidth: { xs: 150, sm: 220 }
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ mb: 0.5, textAlign: 'center', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
          >
            {data.date}
          </Typography>
          <Stack spacing={0.25}>
            {renderStat(FiberNewIcon, 'New Tokens', fNumber(data.Tokens))}
            {renderStat(
              MonetizationOnIcon,
              'Total MCap',
              `${currencySymbols[activeFiatCurrency]}${formatNumberWithDecimals(
                data.totalMarketcap
              )}`
            )}
            {renderStat(
              MonetizationOnIcon,
              'Avg MCap',
              `${currencySymbols[activeFiatCurrency]}${formatNumberWithDecimals(data.avgMarketcap)}`
            )}
            {renderStat(GroupIcon, 'Avg Holders', fNumber(data.avgHolders))}
            {renderStat(
              ShowChartIcon,
              '24h Vol',
              `${currencySymbols[activeFiatCurrency]}${formatNumberWithDecimals(
                data.totalVolume24h
              )}`
            )}
          </Stack>

          {platformEntries.length > 0 && (
            <>
              <Divider sx={{ my: 0.5 }} />
              <Stack direction="row" alignItems="center" spacing={0.25} sx={{ mb: 0.25 }}>
                <BusinessIcon sx={{ fontSize: '0.7rem', color: 'text.secondary' }} />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}
                >
                  New Tokens by Platform
                </Typography>
              </Stack>
              <Stack spacing={0} sx={{ pl: 0.5 }}>
                {platformEntries.map(([platform, count]) => (
                  <Stack key={platform} direction="row" justifyContent="space-between">
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' } }}
                    >{`• ${platform}`}</Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ fontWeight: 'bold', fontSize: { xs: '0.55rem', sm: '0.65rem' } }}
                    >
                      {count}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </>
          )}
          {tokensInvolved.length > 0 && (
            <>
              <Divider sx={{ my: 0.5 }} />
              <Stack direction="row" alignItems="center" spacing={0.25} sx={{ mb: 0.25 }}>
                <SentimentVerySatisfiedIcon sx={{ fontSize: '0.7rem', color: 'text.secondary' }} />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}
                >
                  Top Tokens by Market Cap
                </Typography>
              </Stack>
              <Stack spacing={0} sx={{ pl: 0.25 }}>
                {tokensInvolved.slice(0, 3).map((token) => (
                  <Stack
                    key={token.name}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={0}
                  >
                    <Stack direction="row" alignItems="center" spacing={0} sx={{ minWidth: 0 }}>
                      {token.md5 && (
                        <Avatar
                          alt={token.name}
                          src={`https://s1.xrpl.to/token/${token.md5}`}
                          sx={{ width: 14, height: 14 }}
                        />
                      )}
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: { xs: '0.5rem', sm: '0.65rem' }
                        }}
                      >
                        {token.name}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{
                        fontWeight: 'bold',
                        flexShrink: 0,
                        fontSize: { xs: '0.5rem', sm: '0.65rem' }
                      }}
                    >
                      {`${currencySymbols[activeFiatCurrency]}${formatNumberWithDecimals(
                        new Decimal(token.marketcap || 0).div(fiatRate).toNumber()
                      )}`}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </>
          )}
        </Paper>
      );
    }
    return null;
  };

  // Simulate loading completion after data is available
  useEffect(() => {
    if (metrics.global && metrics[activeFiatCurrency] && tokenCreation) {
      setIsLoading(false);
    }
  }, [metrics, activeFiatCurrency, tokenCreation]);

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

  const sentimentScore = metrics.global?.sentimentScore || 0;

  const newTokensToday =
    tokenCreation && tokenCreation.length > 0 ? tokenCreation[0].totalTokens : 0;

  // Define platform colors
  const platformColors = {
    FirstLedger: '#ADD8E6', // Very Light Blue
    'Magnetic X': '#dc2626', // Red
    XPMarket: '#8A2BE2', // Purple
    LedgerMeme: '#16a34a', // Green
    'xrp.fun': '#9333ea', // Purple
    Other: '#6b7280' // Gray for any other platforms
  };

  // Process chart data using actual API data
  const chartData = useMemo(() => {
    return tokenCreation && tokenCreation.length > 0
      ? tokenCreation
          .slice(0, 30)
          .reverse()
          .map((d) => {
            const totalMarketcapFromInvolved = d.tokensInvolved?.reduce(
              (sum, token) => sum + (token.marketcap || 0),
              0
            );

            const totalMarketcap = totalMarketcapFromInvolved ?? d.totalMarketcap ?? 0;

            const processedData = {
              date: d.date.substring(5, 7) + '/' + d.date.substring(8, 10),
              originalDate: d.date,
              Tokens: d.totalTokens,
              platforms: d.platforms,
              avgMarketcap: new Decimal(d.avgMarketcap || 0).div(fiatRate).toNumber(),
              rawAvgMarketcap: d.avgMarketcap,
              avgHolders: d.avgHolders || 0,
              totalVolume24h: new Decimal(d.avgVolume24h || 0).div(fiatRate).toNumber(),
              totalMarketcap: new Decimal(totalMarketcap || 0).div(fiatRate).toNumber(),
              tokensInvolved: d.tokensInvolved || []
            };
            return processedData;
          })
      : [];
  }, [tokenCreation, fiatRate]);

  // Get all platforms that have token data
  const activePlatforms = Object.keys(platformColors).filter((platform) => {
    if (platform === 'Other') return false;
    return chartData.some((d) => (d.platforms?.[platform] || 0) > 0);
  });

  // Show XRP price in USD when currency is XRP, otherwise show in active currency
  const xrpPrice =
    activeFiatCurrency === 'XRP'
      ? Rate(1, metrics.USD || 1)
      : Rate(1, metrics[activeFiatCurrency] || 1);

  // Get the currency symbol for XRP price display
  const xrpPriceSymbol =
    activeFiatCurrency === 'XRP' ? currencySymbols.USD : currencySymbols[activeFiatCurrency];

  return (
    <Stack
      sx={{
        position: 'relative',
        zIndex: 2,
        // EXTREMELY AGGRESSIVE negative margins on mobile to eliminate ALL top spacing
        mt: { xs: '-32px', sm: '-24px', md: 0 }, // Even more aggressive negative margin
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
          top: '-16px' // Pull entire component up extremely aggressively on mobile
        },
        [(theme) => theme.breakpoints.down('md')]: {
          position: 'relative',
          top: '-12px' // Pull up more on medium screens
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
          background: `linear-gradient(135deg, ${(theme) => theme.palette.text.primary} 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}
      >
        {t("Today's Top XRPL Token Prices by Volume")}
      </Typography>

      <Stack spacing={{ xs: 0, sm: 1 }} sx={{ width: '100%' }}>
        {/* Main Metrics Section */}
        {isLoading ? (
          <Box
            sx={{
              overflowX: 'auto',
              width: '100%',
              maxWidth: '100vw',
              pb: 0, // Zero padding on mobile
              mt: { xs: '-16px', sm: '-12px', md: 0 }, // Even more aggressive negative margin on loading state
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
                  gap: '0px' // Ultra-minimal gap - removed gap entirely
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
              {[...Array(5)].map((_, index) => (
                <Grid
                  item
                  key={index}
                  sx={{
                    flex: '1 0 auto',
                    [(theme) => theme.breakpoints.down('sm')]: {
                      flex: 'none',
                      width: 'calc(50%)', // Make width exactly 50% without gap consideration
                      maxWidth: 'calc(50%)',
                      padding: '0 !important'
                    }
                  }}
                >
                  <Skeleton
                    variant="rectangular"
                    height={25}
                    sx={{
                      borderRadius: '3px',
                      [(theme) => theme.breakpoints.down('sm')]: {
                        height: 28, // Even smaller height
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
              mt: { xs: '-16px', sm: '-12px', md: 0 }, // Even more aggressive negative margin
              [(theme) => theme.breakpoints.up('md')]: {
                pb: 2
              }
            }}
          >
            <Grid
              container
              spacing={1}
              sx={{
                flexWrap: 'wrap',
                width: '100%',
                [(theme) => theme.breakpoints.down('sm')]: {
                  spacing: 0, // Remove spacing
                  gap: '0px' // Remove gap
                }
              }}
            >
              {/* Main metrics taking full width */}
              <Grid item xs={12}>
                <Grid
                  container
                  spacing={{ xs: 0.5, md: 1.5 }} // Reduced spacing for metric boxes on mobile
                >
                  {/* Market Cap Box */}
                  <Grid item xs={6} md={1.5}>
                    <MetricBox>
                      <MetricTitle>{t('Global Market Cap')}</MetricTitle>
                      <MetricValue>
                        {currencySymbols[activeFiatCurrency]}
                        {formatNumberWithDecimals(Number(gMarketcap))}
                      </MetricValue>
                      <PercentageChange isPositive={gMarketcapPro >= 0}>
                        {gMarketcapPro >= 0 ? '▲' : '▼'} {Math.abs(gMarketcapPro).toFixed(2)}%
                      </PercentageChange>
                    </MetricBox>
                  </Grid>

                  {/* DEX Volume Box */}
                  <Grid item xs={6} md={1.5}>
                    <MetricBox>
                      <MetricTitle>{t('24h DEX Volume')}</MetricTitle>
                      <MetricValue>
                        {currencySymbols[activeFiatCurrency]}
                        {formatNumberWithDecimals(gDexVolume)}
                      </MetricValue>
                      <PercentageChange isPositive={gDexVolumePro >= 0}>
                        {gDexVolumePro >= 0 ? '▲' : '▼'} {Math.abs(gDexVolumePro).toFixed(2)}%
                      </PercentageChange>
                    </MetricBox>
                  </Grid>

                  {/* XRP Price Box */}
                  <Grid item xs={6} md={1.5}>
                    <MetricBox>
                      <MetricTitle>{t('XRP Price')}</MetricTitle>
                      <MetricValue>
                        {xrpPriceSymbol}
                        {xrpPrice}
                      </MetricValue>
                      <ContentTypography
                        sx={{
                          fontSize: '0.7rem',
                          [theme.breakpoints.down('xs')]: {
                            fontSize: '0.55rem' // Even smaller font size for XRP price desc on tiny screens
                          },
                          color: 'text.secondary'
                        }}
                      >
                        {activeFiatCurrency === 'XRP' ? 'USD Value' : 'Native XRPL'}
                      </ContentTypography>
                    </MetricBox>
                  </Grid>

                  {/* Stablecoins Box */}
                  <Grid item xs={6} md={1.5}>
                    <MetricBox>
                      <MetricTitle>{t('Stablecoins')}</MetricTitle>
                      <MetricValue>
                        {currencySymbols[activeFiatCurrency]}
                        {formatNumberWithDecimals(gStableVolume)}
                      </MetricValue>
                      <VolumePercentage>{gStableVolumePro}% of volume</VolumePercentage>
                    </MetricBox>
                  </Grid>

                  {/* Meme Tokens Box */}
                  <Grid item xs={6} md={1.5}>
                    <MetricBox>
                      <MetricTitle>{t('Meme Tokens')}</MetricTitle>
                      <MetricValue>
                        {currencySymbols[activeFiatCurrency]}
                        {formatNumberWithDecimals(gMemeVolume)}
                      </MetricValue>
                      <VolumePercentage>{gMemeVolumePro}% of volume</VolumePercentage>
                    </MetricBox>
                  </Grid>

                  {/* Sentiment Score */}
                  <Grid item xs={6} md={1.5}>
                    <MetricBox>
                      <MetricTitle
                        sx={{
                          [theme.breakpoints.down('sm')]: {
                            marginBottom: 0 // Remove bottom margin for metric title on mobile
                          }
                        }}
                      >
                        {t('Sentiment Score')}
                      </MetricTitle>
                      <Box
                        sx={{
                          position: 'relative',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: 40, // Increased height
                          width: 40 // Increased width
                        }}
                      >
                        <CircularProgress
                          variant="determinate"
                          value={100}
                          size={40} // Increased size
                          thickness={1.5}
                          sx={{
                            color: (theme) => alpha(theme.palette.divider, 0.1),
                            position: 'absolute'
                          }}
                        />
                        <CircularProgress
                          variant="determinate"
                          value={sentimentScore}
                          size={40} // Increased size
                          thickness={1.5}
                          color={(() => {
                            if (sentimentScore > 80) return 'success'; // Dark green
                            if (sentimentScore > 60) return 'primary'; // Light green
                            if (sentimentScore > 40) return 'warning'; // Yellow
                            if (sentimentScore > 20) return 'warning'; // Orange - use warning instead of hex
                            return 'error'; // Red
                          })()}
                          sx={{
                            strokeLinecap: 'round',
                            position: 'absolute',
                            filter: (theme) =>
                              `drop-shadow(0 0 2px ${alpha(
                                (() => {
                                  if (sentimentScore > 80) return theme.palette.success.main;
                                  if (sentimentScore > 60) return theme.palette.primary.main;
                                  if (sentimentScore > 40) return theme.palette.warning.main;
                                  if (sentimentScore > 20) return theme.palette.warning.main; // Orange - use warning theme color
                                  return theme.palette.error.main;
                                })(),
                                0.5
                              )})`
                          }}
                        />
                        <Typography
                          variant="h6"
                          component="div"
                          color="text.primary"
                          sx={{ fontWeight: 'bold', fontSize: '0.85rem' }} // Increased font size
                        >
                          {`${sentimentScore}`}
                        </Typography>
                      </Box>
                    </MetricBox>
                  </Grid>

                  {/* Combined Platform Chart */}
                  <Grid item xs={12} md={3}>
                    <MetricBox sx={{ p: 0 }}>
                      <Box sx={{ width: '100%', pt: 0.5, px: 0.5 }}>
                        <MetricTitle>{t('New Tokens Created (30-Day)')}</MetricTitle>
                      </Box>
                      <ResponsiveContainer width="100%" height={35}>
                        <LineChart
                          key={`combined-${chartData.length}`}
                          data={chartData}
                          margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                        >
                          <YAxis yAxisId="tokens" orientation="left" hide />
                          <YAxis yAxisId="marketcap" orientation="right" hide />
                          <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 99999 }} />

                          {/* New Tokens Line - left Y-axis */}
                          <Line
                            yAxisId="tokens"
                            type="monotone"
                            dataKey="Tokens"
                            stroke={theme.palette.primary.main}
                            strokeWidth={3}
                            dot={false}
                            name="New Tokens"
                            connectNulls={false}
                          />

                          {/* Average Market Cap Line - right Y-axis */}
                          <Line
                            yAxisId="marketcap"
                            type="monotone"
                            dataKey="avgMarketcap"
                            stroke={theme.palette.secondary.main}
                            strokeWidth={2}
                            dot={false}
                            name="Average Market Cap"
                            connectNulls={false}
                            strokeDasharray="5 5"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </MetricBox>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        )}
      </Stack>
    </Stack>
  );
}
