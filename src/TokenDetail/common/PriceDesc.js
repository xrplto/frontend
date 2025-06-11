// Material
import {
  Divider,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
  Box,
  Chip,
  Tooltip,
  Slider,
  styled
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useMemo } from 'react';

// Components
import LowHighBar24H from './LowHighBar24H';

// Utils
import { fNumberWithCurreny, fNumber } from 'src/utils/formatNumber';

import NumberTooltip from 'src/components/NumberTooltip';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { currencySymbols } from 'src/utils/constants';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import LoadChart from 'src/components/LoadChart';
import Decimal from 'decimal.js';

// ----------------------------------------------------------------------
const LowhighBarSlider = styled(Slider)(({ theme }) => ({
  '& .MuiSlider-track': {
    border: 'none',
    height: 4,
    background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.primary.main}, ${theme.palette.info.main})`,
    borderRadius: '2px',
    boxShadow: `0 1px 3px ${alpha(theme.palette.primary.main, 0.2)}`
  },
  '& .MuiSlider-rail': {
    height: 4,
    borderRadius: '2px',
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
      theme.palette.background.paper,
      0.4
    )} 100%)`,
    backdropFilter: 'blur(8px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    opacity: 1
  },
  '& .MuiSlider-thumb': {
    height: 12,
    width: 12,
    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(
      theme.palette.background.paper,
      0.9
    )} 100%)`,
    border: `2px solid ${theme.palette.primary.main}`,
    boxShadow: `0 1px 6px ${alpha(theme.palette.primary.main, 0.2)}`,
    backdropFilter: 'blur(8px)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
      boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}, 0 1px 8px ${alpha(
        theme.palette.primary.main,
        0.25
      )}`,
      transform: 'scale(1.05)'
    },
    '&:before': {
      display: 'none'
    }
  },
  '& .MuiSlider-valueLabel': {
    display: 'none'
  }
}));

export default function PriceDesc({ token }) {
  const BASE_URL = process.env.API_URL;
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isXsMobile = useMediaQuery(theme.breakpoints.down(400));

  const metrics = useSelector(selectMetrics);
  const { activeFiatCurrency } = useContext(AppContext);

  const { name, exch, pro7d, pro24h, pro5m, pro1h, md5, maxMin24h, usd } = token;

  const tooltipStyles = {
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
      theme.palette.background.paper,
      0.85
    )} 100%)`,
    backdropFilter: 'blur(16px)',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
    borderRadius: '4px',
    boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.12)}`,
    p: 0.75,
    '& .MuiTooltip-arrow': {
      color: alpha(theme.palette.background.paper, 0.9)
    }
  };

  const priceChanges = useMemo(
    () => [
      {
        value: pro5m,
        label: '5m',
        period: '5 minutes',
        color: pro5m >= 0 ? theme.palette.success.main : theme.palette.error.main
      },
      {
        value: pro1h,
        label: '1h',
        period: '1 hour',
        color: pro1h >= 0 ? theme.palette.success.main : theme.palette.error.main
      },
      {
        value: pro24h,
        label: '24h',
        period: '24 hours',
        color: pro24h >= 0 ? theme.palette.success.main : theme.palette.error.main
      },
      {
        value: pro7d,
        label: '7d',
        period: '7 days',
        color: pro7d >= 0 ? theme.palette.success.main : theme.palette.error.main
      }
    ],
    [pro5m, pro1h, pro24h, pro7d, theme.palette.success.main, theme.palette.error.main]
  );

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    const absValue = Math.abs(value);
    return `${value >= 0 ? '+' : '-'}${fNumber(absValue)}%`;
  };

  // 24h Range calculations
  const range24h = useMemo(() => {
    if (!maxMin24h) return null;

    const min = maxMin24h[1];
    const max = maxMin24h[0];
    const delta = max - min;
    let percent = 0;
    if (delta > 0) percent = ((usd - min) / delta) * 100;

    return { min, max, percent };
  }, [maxMin24h, usd]);

  return (
    <Box
      sx={{
        p: { xs: 0.75, sm: 1 },
        borderRadius: '6px',
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.background.paper,
          0.8
        )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
        backdropFilter: 'blur(8px)',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.06)}`,
        boxShadow: `0 1px 6px ${alpha(theme.palette.common.black, 0.03)}`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.5)}, ${alpha(
            theme.palette.success.main,
            0.5
          )}, ${alpha(theme.palette.info.main, 0.5)})`,
          opacity: 0.7
        }
      }}
      role="region"
      aria-label="Token price information"
    >
      <Stack spacing={{ xs: 0.75, sm: 0.5 }}>
        {/* Price Header with expanded 24h Range */}
        <Box>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ xs: 'stretch', md: 'flex-end' }}
            justifyContent="space-between"
            spacing={{ xs: 1, md: 1.5 }}
          >
            <Stack
              spacing={0.125}
              sx={{ flex: { xs: 'none', md: '0 0 auto' }, minWidth: { xs: 'auto', md: '180px' } }}
            >
              <Typography
                component="h1"
                sx={{
                  fontSize: { xs: '0.625rem', sm: '0.65rem' },
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.01em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.25,
                  flexWrap: 'wrap'
                }}
              >
                Price
                <Typography
                  component="span"
                  sx={{
                    fontSize: { xs: '0.55rem', sm: '0.575rem' },
                    fontWeight: 500,
                    color: alpha(theme.palette.text.secondary, 0.7),
                    background: 'none',
                    WebkitTextFillColor: 'unset'
                  }}
                >
                  ({name})
                </Typography>
              </Typography>

              <Typography
                variant="price"
                noWrap
                component="h2"
                sx={{
                  fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.4rem' },
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${alpha(
                    theme.palette.success.main,
                    0.8
                  )} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.1
                }}
              >
                <NumberTooltip
                  prepend={currencySymbols[activeFiatCurrency]}
                  number={fNumberWithCurreny(exch, metrics[activeFiatCurrency])}
                />
              </Typography>
            </Stack>

            {/* Expanded 24h Range */}
            {range24h && (
              <Box
                sx={{
                  flex: { xs: 'none', md: 1 },
                  maxWidth: { xs: 'none', md: '350px' },
                  minWidth: { xs: 'auto', md: '250px' },
                  width: '100%'
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: { xs: '0.625rem', sm: '0.65rem' },
                    fontWeight: 600,
                    color: alpha(theme.palette.text.primary, 0.8),
                    mb: 0.25,
                    display: 'block',
                    textAlign: { xs: 'left', md: 'center' }
                  }}
                >
                  24h Range
                </Typography>

                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={{ xs: 0.75, sm: 1 }}
                  sx={{
                    py: { xs: 0.375, sm: 0.5 },
                    px: { xs: 0.5, sm: 0.75 },
                    borderRadius: '4px',
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.background.paper,
                      0.6
                    )} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
                    backdropFilter: 'blur(6px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.03)}`
                  }}
                >
                  <Box sx={{ textAlign: 'center', minWidth: { xs: '35px', sm: '45px' } }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: { xs: '0.5rem', sm: '0.55rem' },
                        fontWeight: 500,
                        color: alpha(theme.palette.text.secondary, 0.8),
                        display: 'block',
                        lineHeight: 1,
                        mb: 0.125
                      }}
                    >
                      Low
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: { xs: '0.575rem', sm: '0.625rem' },
                        fontWeight: 600,
                        color: theme.palette.success.main,
                        lineHeight: 1
                      }}
                    >
                      <NumberTooltip
                        prepend={currencySymbols[activeFiatCurrency]}
                        number={fNumber(
                          Decimal.mul(
                            Decimal.mul(range24h.min, metrics.USD),
                            1 / metrics[activeFiatCurrency]
                          )
                        )}
                      />
                    </Typography>
                  </Box>

                  <Box sx={{ flexGrow: 1, px: { xs: 0.25, sm: 0.5 } }}>
                    <LowhighBarSlider
                      aria-label="24h Price Range"
                      value={range24h.percent}
                      disabled
                      sx={{
                        mt: 0.125,
                        '& .MuiSlider-track': {
                          height: { xs: 3, sm: 4 }
                        },
                        '& .MuiSlider-rail': {
                          height: { xs: 3, sm: 4 }
                        },
                        '& .MuiSlider-thumb': {
                          height: { xs: 10, sm: 12 },
                          width: { xs: 10, sm: 12 }
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ textAlign: 'center', minWidth: { xs: '35px', sm: '45px' } }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: { xs: '0.5rem', sm: '0.55rem' },
                        fontWeight: 500,
                        color: alpha(theme.palette.text.secondary, 0.8),
                        display: 'block',
                        lineHeight: 1,
                        mb: 0.125
                      }}
                    >
                      High
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: { xs: '0.575rem', sm: '0.625rem' },
                        fontWeight: 600,
                        color: theme.palette.info.main,
                        lineHeight: 1
                      }}
                    >
                      <NumberTooltip
                        prepend={currencySymbols[activeFiatCurrency]}
                        number={fNumber(
                          Decimal.mul(
                            Decimal.mul(range24h.max, metrics.USD),
                            1 / metrics[activeFiatCurrency]
                          )
                        )}
                      />
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Price Changes Grid */}
        <Box>
          <Typography
            variant="caption"
            sx={{
              fontSize: { xs: '0.55rem', sm: '0.575rem' },
              fontWeight: 600,
              color: alpha(theme.palette.text.primary, 0.8),
              mb: 0.25,
              display: 'block'
            }}
          >
            Price Changes
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: isXsMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                sm: 'repeat(4, 1fr)'
              },
              gap: { xs: 0.25, sm: 0.375 }
            }}
          >
            {priceChanges.map((item) => (
              <Tooltip
                key={item.label}
                title={
                  <Box sx={{ minWidth: { xs: 120, sm: 140 }, textAlign: 'center' }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.primary.main,
                        mb: 0.5,
                        fontSize: { xs: '0.625rem', sm: '0.65rem' }
                      }}
                    >
                      {item.period} Change
                    </Typography>

                    <Box
                      sx={{
                        p: { xs: 0.375, sm: 0.5 },
                        mb: 0.5,
                        borderRadius: '3px',
                        background: `linear-gradient(135deg, ${alpha(item.color, 0.08)} 0%, ${alpha(
                          item.color,
                          0.04
                        )} 100%)`,
                        border: `1px solid ${alpha(item.color, 0.12)}`
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 800,
                          color: item.color,
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          mb: 0.125
                        }}
                      >
                        {formatPercentage(item.value)}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          color: alpha(theme.palette.text.secondary, 0.8),
                          fontSize: { xs: '0.5rem', sm: '0.55rem' }
                        }}
                      >
                        vs {item.period} ago
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        p: 0.375,
                        borderRadius: '3px',
                        background: `linear-gradient(135deg, ${alpha(
                          theme.palette.background.paper,
                          0.8
                        )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                        backdropFilter: 'blur(6px)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`
                      }}
                    >
                      <LoadChart
                        url={`${BASE_URL}/sparkline/${md5}?${item.label.toLowerCase()}=${
                          item.value
                        }`}
                        sx={{ width: '100%', height: { xs: 20, sm: 24 } }}
                      />
                    </Box>
                  </Box>
                }
                componentsProps={{
                  tooltip: {
                    sx: {
                      ...tooltipStyles,
                      maxWidth: 'none'
                    },
                    placement: isMobile ? 'top' : 'top'
                  }
                }}
              >
                <Box
                  sx={{
                    p: { xs: 0.375, sm: 0.5 },
                    borderRadius: '4px',
                    background: `linear-gradient(135deg, ${alpha(item.color, 0.08)} 0%, ${alpha(
                      item.color,
                      0.04
                    )} 100%)`,
                    backdropFilter: 'blur(6px)',
                    border: `2px solid ${alpha(item.color, 0.15)}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: `0 3px 8px ${alpha(item.color, 0.2)}`,
                      border: `2px solid ${alpha(item.color, 0.3)}`,
                      background: `linear-gradient(135deg, ${alpha(item.color, 0.12)} 0%, ${alpha(
                        item.color,
                        0.06
                      )} 100%)`
                    }
                  }}
                >
                  <Stack alignItems="center" spacing={0.0625}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: { xs: '0.5rem', sm: '0.55rem' },
                        fontWeight: 700,
                        color: alpha(theme.palette.text.secondary, 0.8),
                        lineHeight: 1
                      }}
                    >
                      {item.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: { xs: '0.55rem', sm: '0.575rem' },
                        fontWeight: 700,
                        color: item.color,
                        lineHeight: 1
                      }}
                    >
                      {formatPercentage(item.value)}
                    </Typography>
                  </Stack>
                </Box>
              </Tooltip>
            ))}
          </Box>

          {/* Mobile: Show additional row for 2-column layout on very small screens */}
          {isXsMobile && (
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.5rem',
                color: alpha(theme.palette.text.secondary, 0.6),
                textAlign: 'center',
                mt: 0.25,
                display: 'block'
              }}
            >
              Tap for detailed charts
            </Typography>
          )}
        </Box>
      </Stack>
    </Box>
  );
}
