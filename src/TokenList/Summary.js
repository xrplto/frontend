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

// Updated styled components with enhanced theme matching portfolio design
const ContentTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#FFFFFF' : alpha('#919EAB', 0.99),
  display: 'block',
  lineHeight: 1.3,
  whiteSpace: 'normal',
  wordWrap: 'break-word',
  fontSize: '0.9rem'
}));

// Enhanced MetricBox with portfolio-style design
const MetricBox = styled(Paper)(({ theme }) => ({
  padding: '16px 18px',
  borderRadius: '20px',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
    theme.palette.background.paper,
    0.8
  )} 100%)`,
  backdropFilter: 'blur(20px)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  minWidth: '140px',
  border:
    theme.palette.mode === 'dark'
      ? `1px solid ${alpha(theme.palette.divider, 0.08)}`
      : `1px solid ${alpha(theme.palette.divider, 0.06)}`,
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.06)}, 0 2px 8px ${alpha(
    theme.palette.primary.main,
    0.04
  )}`,
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.4)}, ${alpha(
      theme.palette.success.main,
      0.4
    )}, ${alpha(theme.palette.info.main, 0.4)})`,
    opacity: 0.6,
    borderRadius: '20px 20px 0 0',
    zIndex: 1
  }
}));

// Enhanced MetricTitle with portfolio styling
const MetricTitle = styled(Typography)(({ theme }) => ({
  fontSize: '0.8rem',
  fontWeight: 600,
  color: theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.9) : alpha('#637381', 0.9),
  marginBottom: '6px',
  whiteSpace: 'nowrap',
  letterSpacing: '-0.01em'
}));

// Enhanced MetricValue with portfolio styling
const MetricValue = styled(Typography)(({ theme }) => ({
  fontSize: '1rem',
  fontWeight: 700,
  color: theme.palette.mode === 'dark' ? '#FFFFFF' : '#212B36',
  marginBottom: '4px',
  letterSpacing: '-0.02em'
}));

// Enhanced PercentageChange with portfolio styling
const PercentageChange = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isPositive'
})(({ theme, isPositive }) => ({
  fontSize: '0.75rem',
  color: isPositive ? theme.palette.success.main : theme.palette.error.main,
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontWeight: 600,
  padding: '2px 6px',
  borderRadius: '6px',
  background: 'transparent',
  border: 'none'
}));

// Enhanced VolumePercentage with portfolio styling
const VolumePercentage = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.7) : alpha('#637381', 0.9),
  display: 'flex',
  alignItems: 'center',
  fontWeight: 500,
  padding: '2px 6px',
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

  return (
    <Stack
      sx={{
        mt: 1,
        mb: 2,
        width: '100%',
        maxWidth: '100%',
        px: 0
      }}
    >
      <Typography
        variant="h1"
        sx={{
          mb: 2,
          fontSize: '1.4rem',
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

      {isLoading ? (
        <Box
          sx={{
            overflowX: 'auto',
            width: '100%',
            maxWidth: '100vw',
            pb: 1
          }}
        >
          <Grid
            container
            spacing={2}
            sx={{
              flexWrap: 'nowrap',
              minWidth: '900px',
              width: '100%'
            }}
          >
            {[...Array(6)].map((_, index) => (
              <Grid item key={index} sx={{ flex: '1 0 auto' }}>
                <Skeleton
                  variant="rectangular"
                  height={100}
                  sx={{
                    borderRadius: '20px',
                    minWidth: '140px',
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
            overflowX: 'auto',
            width: '100%',
            maxWidth: '100vw',
            pb: 2,
            '&::-webkit-scrollbar': {
              height: '8px'
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark' ? alpha('#FFF', 0.05) : alpha('#000', 0.05),
              borderRadius: '4px'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark' ? alpha('#FFF', 0.2) : alpha('#000', 0.2),
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: (theme) =>
                  theme.palette.mode === 'dark' ? alpha('#FFF', 0.3) : alpha('#000', 0.3)
              }
            }
          }}
        >
          <Grid
            container
            spacing={2}
            sx={{
              flexWrap: 'nowrap',
              minWidth: '900px',
              width: '100%'
            }}
          >
            {/* Market Cap Box */}
            <Grid item sx={{ flex: '1 0 auto' }}>
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
            <Grid item sx={{ flex: '1 0 auto' }}>
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
            <Grid item sx={{ flex: '1 0 auto' }}>
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
                      padding: '2px 6px',
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
            <Grid item sx={{ flex: '1 0 auto' }}>
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
            <Grid item sx={{ flex: '1 0 auto' }}>
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
            <Grid item sx={{ flex: '1 0 auto' }}>
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
        </Box>
      )}
    </Stack>
  );
}
