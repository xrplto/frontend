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

// Updated styled components with much higher contrast for dark theme
const ContentTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#FFFFFF' : alpha('#919EAB', 0.99),
  display: 'block',
  lineHeight: 1.3,
  whiteSpace: 'normal',
  wordWrap: 'break-word',
  fontSize: '0.9rem'
}));

// Styled box for each metric section
const MetricBox = styled(Paper)(({ theme }) => ({
  padding: '8px 10px',
  borderRadius: '8px',
  backgroundColor:
    theme.palette.mode === 'dark'
      ? alpha('#121212', 0.95) // Nearly black background
      : alpha('#F4F6F8', 0.8),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  minWidth: '140px',
  // Add stronger border in dark mode for better visibility
  border:
    theme.palette.mode === 'dark' ? `1px solid ${alpha(theme.palette.common.white, 0.2)}` : 'none',
  // Add box shadow in dark mode for better separation
  boxShadow: theme.palette.mode === 'dark' ? '0 4px 8px rgba(0,0,0,0.3)' : 'none'
}));

// Title for each metric box
const MetricTitle = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  fontWeight: 600,
  color:
    theme.palette.mode === 'dark'
      ? '#FFFFFF' // Pure white for maximum visibility
      : alpha('#637381', 0.9),
  marginBottom: '4px',
  whiteSpace: 'nowrap'
}));

// Value for each metric
const MetricValue = styled(Typography)(({ theme }) => ({
  fontSize: '0.95rem',
  fontWeight: 700,
  color:
    theme.palette.mode === 'dark'
      ? '#FFFFFF' // Pure white for maximum visibility
      : '#212B36',
  marginBottom: '2px'
}));

function Rate(num, exch) {
  if (num === 0 || exch === 0) return 0;
  return fNumber(num / exch);
}

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

  const gMarketcap = new Decimal(metrics.global.gMarketcap)
    .div(metrics[activeFiatCurrency])
    .toFixed(2, Decimal.ROUND_DOWN);
  const gMarketcapPro = new Decimal(metrics.global.gMarketcapPro || 0).toNumber();
  const gDexVolume = new Decimal(metrics.global.gDexVolume)
    .div(metrics[activeFiatCurrency])
    .toNumber();
  const gDexVolumePro = new Decimal(metrics.global.gDexVolumePro || 0).toNumber();
  const gNFTIOUVolume = new Decimal(metrics.global.gNFTIOUVolume || 0)
    .div(metrics[activeFiatCurrency])
    .toNumber();
  const gNFTIOUVolumePro = new Decimal(metrics.global.gNFTIOUVolumePro || 0).toFixed(
    2,
    Decimal.ROUND_DOWN
  );
  const gStableVolume = new Decimal(metrics.global.gStableVolume)
    .div(metrics[activeFiatCurrency])
    .toNumber();
  const gStableVolumePro = new Decimal(metrics.global.gStableVolumePro || 0).toFixed(
    2,
    Decimal.ROUND_DOWN
  );
  const gMemeVolume = new Decimal(metrics.global.gMemeVolume || 0)
    .div(metrics[activeFiatCurrency])
    .toNumber();
  const gMemeVolumePro = new Decimal(metrics.global.gMemeVolumePro || 0).toFixed(
    2,
    Decimal.ROUND_DOWN
  );

  // Show XRP price in USD when currency is XRP, otherwise show in active currency
  const xrpPrice =
    activeFiatCurrency === 'XRP' ? Rate(1, metrics.USD) : Rate(1, metrics[activeFiatCurrency]);

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
        px: 0 // Remove any horizontal padding
      }}
    >
      <Typography
        variant="h1"
        sx={{
          mb: 1,
          fontSize: '1.3rem',
          width: '100%' // Ensure title takes full width
        }}
      >
        {t("Today's Top XRPL Token Prices by Volume")}
      </Typography>

      {isLoading ? (
        <Box
          sx={{
            overflowX: 'auto',
            width: '100%',
            maxWidth: '100vw' // Allow full viewport width
          }}
        >
          <Grid
            container
            spacing={1}
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
                  height={80}
                  sx={{ borderRadius: '8px', minWidth: '140px' }}
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
            maxWidth: '100vw' // Allow full viewport width
          }}
        >
          <Grid
            container
            spacing={1}
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
                    {fNumberWithSuffix(Number(gMarketcap))}
                  </MetricValue>
                  <ContentTypography sx={{ fontSize: '0.75rem' }}>
                    {gMarketcapPro >= 0 ? '↑' : '↓'} {Math.abs(gMarketcapPro).toFixed(2)}%
                  </ContentTypography>
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
                    {fNumberWithSuffix(gDexVolume)}
                  </MetricValue>
                  <ContentTypography sx={{ fontSize: '0.75rem' }}>
                    {gDexVolumePro >= 0 ? '↑' : '↓'} {Math.abs(gDexVolumePro).toFixed(2)}%
                  </ContentTypography>
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
                  <ContentTypography sx={{ fontSize: '0.75rem' }}>
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
                    {fNumberWithSuffix(gNFTIOUVolume)}
                  </MetricValue>
                  <ContentTypography sx={{ fontSize: '0.75rem' }}>
                    {gNFTIOUVolumePro}% of volume
                  </ContentTypography>
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
                    {fNumberWithSuffix(gStableVolume)}
                  </MetricValue>
                  <ContentTypography sx={{ fontSize: '0.75rem' }}>
                    {gStableVolumePro}% of volume
                  </ContentTypography>
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
                    {fNumberWithSuffix(gMemeVolume)}
                  </MetricValue>
                  <ContentTypography sx={{ fontSize: '0.75rem' }}>
                    {gMemeVolumePro}% of volume
                  </ContentTypography>
                </div>
              </MetricBox>
            </Grid>
          </Grid>
        </Box>
      )}
    </Stack>
  );
}
