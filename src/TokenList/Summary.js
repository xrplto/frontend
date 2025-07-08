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

// Clean content typography
const ContentTypography = styled(Typography)(({ theme }) => ({
  color: alpha(theme.palette.text.secondary, 0.6),
  fontSize: '0.7rem',
  fontWeight: 500,
  letterSpacing: '0.01em',
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.65rem'
  }
}));

// Ultra-minimalist MetricBox
const MetricBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2)
  },
  height: '100%',
  minHeight: '90px',
  [theme.breakpoints.down('sm')]: {
    minHeight: '75px'
  },
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'flex-start',
  borderRadius: '8px',
  background: 'transparent',
  backdropFilter: 'none',
  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
  boxShadow: 'none',
  transition: 'border-color 0.2s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    borderColor: alpha(theme.palette.divider, 0.2),
  }
}));

// Refined MetricTitle
const MetricTitle = styled(Typography)(({ theme }) => ({
  fontSize: '0.7rem',
  fontWeight: 400,
  color: alpha(theme.palette.text.secondary, 0.5),
  marginBottom: theme.spacing(0.75),
  textTransform: 'none',
  letterSpacing: '0.03em',
  lineHeight: 1,
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.65rem',
    marginBottom: theme.spacing(0.5)
  }
}));

// Premium MetricValue
const MetricValue = styled(Typography)(({ theme }) => ({
  fontSize: '1.25rem',
  fontWeight: 600,
  color: theme.palette.text.primary,
  lineHeight: 1,
  marginBottom: theme.spacing(0.5),
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  letterSpacing: '-0.01em',
  [theme.breakpoints.down('sm')]: {
    fontSize: '1rem',
    marginBottom: theme.spacing(0.25)
  }
}));

// Subtle PercentageChange
const PercentageChange = styled('span', {
  shouldForwardProp: (prop) => prop !== 'isPositive'
})(({ theme, isPositive }) => ({
  fontSize: '0.75rem',
  color: isPositive 
    ? theme.palette.mode === 'dark' ? '#4ade80' : '#16a34a'
    : theme.palette.mode === 'dark' ? '#f87171' : '#dc2626',
  display: 'inline-flex',
  alignItems: 'flex-start',
  gap: '3px',
  fontWeight: 500,
  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  letterSpacing: '0',
  
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.65rem'
  }
}));

// Subtle VolumePercentage
const VolumePercentage = styled(Typography)(({ theme }) => ({
  fontSize: '0.65rem',
  color: alpha(theme.palette.text.secondary, 0.4),
  fontWeight: 400,
  letterSpacing: '0.02em',
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.6rem'
  }
}));

function Rate(num, exch) {
  if (num === 0 || exch === 0) return 0;
  return fNumber(num / exch);
}

// Premium number formatting
const formatNumberWithDecimals = (num) => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(0)}K`;
  return Math.round(num).toLocaleString();
};

export default function Summary() {
  const { t } = useTranslation(); // set translation const
  const metrics = useSelector(selectMetrics);
  const tokenCreation = useSelector(selectTokenCreation);
  const { activeFiatCurrency } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(true);
  const theme = useTheme();

  // Add default value of 1 for the divisor to prevent DecimalError
  const fiatRate = metrics[activeFiatCurrency] || 1;

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
            <Icon sx={{ fontSize: '0.85rem', color: 'text.secondary' }} />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: '0.75rem' }}
            >
              {label}
            </Typography>
          </Stack>
          <Typography
            variant="caption"
            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
          >
            {value}
          </Typography>
        </Stack>
      );

      return (
        <Paper
          sx={{
            p: 2,
            background: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.background.paper, 0.95)
              : theme.palette.background.paper,
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            boxShadow: theme.palette.mode === 'dark'
              ? `0 2px 8px ${alpha('#000', 0.3)}`
              : `0 2px 8px ${alpha('#000', 0.08)}`,
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            minWidth: 240,
            position: 'absolute',
            zIndex: 999999999,
            pointerEvents: 'auto',
            overflow: 'hidden',
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ mb: 0.5, textAlign: 'center', fontSize: '0.75rem', fontWeight: 500, color: 'text.secondary' }}
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
                  sx={{ fontSize: '0.75rem' }}
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
                      sx={{ fontSize: '0.7rem' }}
                    >{`• ${platform}`}</Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ fontWeight: 600, fontSize: '0.7rem' }}
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
                  sx={{ fontSize: '0.75rem' }}
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
        mt: { xs: 0, sm: 0, md: 2 },
        mb: { xs: 2, sm: 2, md: 3 },
        width: '100%',
        maxWidth: '100%'
      }}
    >

      <Stack spacing={{ xs: 0, sm: 1 }} sx={{ width: '100%' }}>
        {/* Main Metrics Section */}
        {isLoading ? (
          <Box
            sx={{
              overflowX: 'auto',
              width: '100%',
              maxWidth: '100vw',
              pb: 0, // Zero padding on mobile
              mt: { xs: 0, sm: 0, md: 0 }, // on loading state
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
                minWidth: { xs: 'unset', sm: '700px', md: '900px' },
                width: '100%',
                [(theme) => theme.breakpoints.down('sm')]: {
                  flexWrap: 'wrap',
                  gap: '8px'
                }
              }}
            >
              {[...Array(5)].map((_, index) => (
                <Grid
                  item
                  key={`summary-skeleton-${index}`}
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
                    sx={{
                      borderRadius: '8px',
                      height: { xs: 75, sm: 90, md: 90 },
                      minWidth: { xs: 'unset', sm: '110px', md: '140px' },
                      width: { xs: '100%' },
                      background: (theme) =>
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.background.paper, 0.3)
                          : alpha(theme.palette.background.paper, 0.5)
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
              mt: { xs: 0, sm: 0, md: 0 },
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
                  spacing={{ xs: 1, sm: 1.5, md: 2 }}
                >
                  {/* Market Cap Box */}
                  <Grid item xs={6} md={1.5}>
                    <MetricBox>
                      <MetricTitle>Market Cap</MetricTitle>
                      <MetricValue>
                        {currencySymbols[activeFiatCurrency]}
                        {formatNumberWithDecimals(Number(gMarketcap))}
                      </MetricValue>
                      <PercentageChange isPositive={gMarketcapPro >= 0}>
                        {gMarketcapPro >= 0 ? '+' : ''}{gMarketcapPro.toFixed(1)}%
                      </PercentageChange>
                    </MetricBox>
                  </Grid>

                  {/* DEX Volume Box */}
                  <Grid item xs={6} md={1.5}>
                    <MetricBox>
                      <MetricTitle>24h Volume</MetricTitle>
                      <MetricValue>
                        {currencySymbols[activeFiatCurrency]}
                        {formatNumberWithDecimals(gDexVolume)}
                      </MetricValue>
                      <PercentageChange isPositive={gDexVolumePro >= 0}>
                        {gDexVolumePro >= 0 ? '+' : ''}{gDexVolumePro.toFixed(1)}%
                      </PercentageChange>
                    </MetricBox>
                  </Grid>

                  {/* XRP Price Box */}
                  <Grid item xs={6} md={1.5}>
                    <MetricBox>
                      <MetricTitle>XRP</MetricTitle>
                      <MetricValue>
                        {xrpPriceSymbol}
                        {xrpPrice}
                      </MetricValue>
                      <ContentTypography>
                        {activeFiatCurrency === 'XRP' ? 'in USD' : 'Native'}
                      </ContentTypography>
                    </MetricBox>
                  </Grid>

                  {/* Stablecoins Box */}
                  <Grid item xs={6} md={1.5}>
                    <MetricBox>
                      <MetricTitle>Stables</MetricTitle>
                      <MetricValue>
                        {currencySymbols[activeFiatCurrency]}
                        {formatNumberWithDecimals(gStableVolume)}
                      </MetricValue>
                      <VolumePercentage>{gStableVolumePro}% of vol</VolumePercentage>
                    </MetricBox>
                  </Grid>

                  {/* Meme Tokens Box */}
                  <Grid item xs={6} md={1.5}>
                    <MetricBox>
                      <MetricTitle>Memes</MetricTitle>
                      <MetricValue>
                        {currencySymbols[activeFiatCurrency]}
                        {formatNumberWithDecimals(gMemeVolume)}
                      </MetricValue>
                      <VolumePercentage>{gMemeVolumePro}% of vol</VolumePercentage>
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
                        Sentiment
                      </MetricTitle>
                      <Stack spacing={0.75} sx={{ width: '100%' }}>
                        <Stack direction="row" alignItems="baseline" spacing={0.5}>
                          <Typography
                            sx={{ 
                              fontSize: '1.25rem',
                              fontWeight: 600,
                              color: 'text.primary',
                              lineHeight: 1,
                              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                              letterSpacing: '-0.01em',
                              [theme.breakpoints.down('sm')]: {
                                fontSize: '1rem'
                              }
                            }}
                          >
                            {sentimentScore}
                          </Typography>
                          <Typography
                            sx={{ 
                              fontSize: '0.7rem',
                              fontWeight: 400,
                              color: alpha(theme.palette.text.secondary, 0.4),
                              lineHeight: 1
                            }}
                          >
                            /100
                          </Typography>
                        </Stack>
                        <Box
                          sx={{
                            width: '100%',
                            height: 3,
                            borderRadius: 1.5,
                            bgcolor: alpha(theme.palette.divider, 0.08),
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          <Box
                            sx={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              height: '100%',
                              width: `${sentimentScore}%`,
                              bgcolor: (() => {
                                if (sentimentScore > 80) return theme.palette.success.main;
                                if (sentimentScore > 60) return theme.palette.primary.main;
                                if (sentimentScore > 40) return theme.palette.warning.main;
                                return theme.palette.error.main;
                              })(),
                              borderRadius: 1.5,
                              transition: 'width 0.8s ease'
                            }}
                          />
                        </Box>
                      </Stack>
                    </MetricBox>
                  </Grid>

                  {/* Combined Platform Chart */}
                  <Grid item xs={12} md={3}>
                    <MetricBox sx={{ 
                      p: { xs: 2, sm: 2.5 }, 
                      background: theme => alpha(theme.palette.background.paper, 0.3),
                      border: theme => `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      alignItems: 'center'
                    }}>
                      <MetricTitle sx={{ mb: 1.5, textAlign: 'center' }}>New Tokens • 30d</MetricTitle>
                      <ResponsiveContainer width="100%" height={45}>
                        <AreaChart
                          key={`combined-${chartData.length}`}
                          data={chartData}
                          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="tokensGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.15}/>
                              <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="marketcapGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.1}/>
                              <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <YAxis yAxisId="tokens" orientation="left" hide />
                          <YAxis yAxisId="marketcap" orientation="right" hide />
                          <Tooltip 
                            content={<CustomTooltip />} 
                            wrapperStyle={{ 
                              zIndex: 99999999,
                              position: 'relative'
                            }} 
                            contentStyle={{
                              zIndex: 99999999,
                              position: 'relative'
                            }}
                          />

                          {/* New Tokens Area - left Y-axis */}
                          <Area
                            yAxisId="tokens"
                            type="monotone"
                            dataKey="Tokens"
                            stroke={theme.palette.primary.main}
                            strokeWidth={1.5}
                            fill="url(#tokensGradient)"
                            dot={false}
                            name="New Tokens"
                            connectNulls={false}
                          />

                          {/* Average Market Cap Area - right Y-axis */}
                          <Area
                            yAxisId="marketcap"
                            type="monotone"
                            dataKey="avgMarketcap"
                            stroke={theme.palette.secondary.main}
                            strokeWidth={1.5}
                            fill="url(#marketcapGradient)"
                            dot={false}
                            name="Average Market Cap"
                            connectNulls={false}
                            strokeDasharray="3 3"
                            opacity={0.6}
                          />
                        </AreaChart>
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
