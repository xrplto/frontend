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

// Enhanced MetricBox with zero top spacing on mobile
const MetricBox = styled(Paper)(({ theme }) => ({
  padding: '16px 18px',
  // Ultra-compact mobile design
  [theme.breakpoints.down('md')]: {
    padding: '3px 4px' // Reduced padding further
  },
  [theme.breakpoints.down('sm')]: {
    padding: '2px 3px' // Ultra-minimal padding
  },
  borderRadius: '20px',
  // Much smaller border radius on mobile
  [theme.breakpoints.down('md')]: {
    borderRadius: '4px'
  },
  [theme.breakpoints.down('sm')]: {
    borderRadius: '3px'
  },
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
  // Much smaller min width on mobile
  [theme.breakpoints.down('md')]: {
    minWidth: '75px'
  },
  [theme.breakpoints.down('sm')]: {
    minWidth: '65px',
    minHeight: '28px' // Very compact height on mobile
  },
  border:
    theme.palette.mode === 'dark'
      ? `1px solid ${alpha(theme.palette.divider, 0.08)}`
      : `1px solid ${alpha(theme.palette.divider, 0.06)}`,
  // Remove border on mobile for cleaner look
  [theme.breakpoints.down('sm')]: {
    border: 'none'
  },
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.06)}, 0 2px 8px ${alpha(
    theme.palette.primary.main,
    0.04
  )}`,
  // Remove shadow on mobile
  [theme.breakpoints.down('sm')]: {
    boxShadow: 'none'
  },
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
    [theme.breakpoints.down('sm')]: {
      display: 'none' // Remove decorative line on mobile
    },
    zIndex: 1
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
            overflowX: 'auto',
            width: '100%',
            maxWidth: '100vw',
            pb: 0, // Zero padding on mobile
            mt: { xs: '-12px', sm: '-8px', md: 0 }, // Extremely aggressive negative margin to pull content up
            [(theme) => theme.breakpoints.up('md')]: {
              pb: 2
            },
            [(theme) => theme.breakpoints.down('sm')]: {
              overflowX: 'hidden'
            },
            '&::-webkit-scrollbar': {
              height: '8px',
              [(theme) => theme.breakpoints.down('sm')]: {
                display: 'none'
              }
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
            {/* Market Cap Box */}
            <Grid
              item
              sx={{
                flex: '1 0 auto',
                // Mobile: 2 items per row with zero spacing
                [(theme) => theme.breakpoints.down('sm')]: {
                  flex: 'none',
                  width: 'calc(50% - 1px)',
                  maxWidth: 'calc(50% - 1px)',
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
              sx={{
                flex: '1 0 auto',
                [(theme) => theme.breakpoints.down('sm')]: {
                  flex: 'none',
                  width: 'calc(50% - 1px)',
                  maxWidth: 'calc(50% - 1px)',
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
              sx={{
                flex: '1 0 auto',
                [(theme) => theme.breakpoints.down('sm')]: {
                  flex: 'none',
                  width: 'calc(50% - 1px)',
                  maxWidth: 'calc(50% - 1px)',
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
              sx={{
                flex: '1 0 auto',
                [(theme) => theme.breakpoints.down('sm')]: {
                  flex: 'none',
                  width: 'calc(50% - 1px)',
                  maxWidth: 'calc(50% - 1px)',
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
              sx={{
                flex: '1 0 auto',
                [(theme) => theme.breakpoints.down('sm')]: {
                  flex: 'none',
                  width: 'calc(50% - 1px)',
                  maxWidth: 'calc(50% - 1px)',
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
              sx={{
                flex: '1 0 auto',
                [(theme) => theme.breakpoints.down('sm')]: {
                  flex: 'none',
                  width: 'calc(50% - 1px)',
                  maxWidth: 'calc(50% - 1px)',
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
        </Box>
      )}
    </Stack>
  );
}
