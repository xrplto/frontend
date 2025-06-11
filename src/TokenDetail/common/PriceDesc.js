// Material
import {
  Divider,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
  Box,
  Chip,
  Tooltip
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

// ----------------------------------------------------------------------
export default function PriceDesc({ token }) {
  const BASE_URL = process.env.API_URL;
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const metrics = useSelector(selectMetrics);
  const { activeFiatCurrency } = useContext(AppContext);

  const { name, exch, pro7d, pro24h, pro5m, pro1h, md5 } = token;

  const tooltipStyles = {
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
      theme.palette.background.paper,
      0.85
    )} 100%)`,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    borderRadius: '8px',
    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.15)}`,
    p: 1.5,
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

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: '12px',
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.background.paper,
          0.8
        )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
        boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.04)}`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.6)}, ${alpha(
            theme.palette.success.main,
            0.6
          )}, ${alpha(theme.palette.info.main, 0.6)})`,
          opacity: 0.8
        }
      }}
      role="region"
      aria-label="Token price information"
    >
      <Stack spacing={1}>
        {/* Header with Price and Changes in one row */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              component="h1"
              sx={{
                fontSize: '0.875rem',
                fontWeight: 600,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.01em',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              Price
              <Typography
                component="span"
                sx={{
                  fontSize: '0.75rem',
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
                fontSize: { xs: '1.5rem', md: '1.75rem' },
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

          {/* Enhanced Price Changes */}
          <Box
            sx={{
              p: 1,
              borderRadius: '8px',
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.background.paper,
                0.6
              )} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
              backdropFilter: 'blur(8px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: alpha(theme.palette.text.primary, 0.8),
                mb: 0.75,
                display: 'block',
                textAlign: 'center'
              }}
            >
              Price Changes
            </Typography>

            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              sx={{
                flexWrap: 'wrap',
                gap: 0.5,
                justifyContent: 'center'
              }}
            >
              {priceChanges.map((item) => (
                <Tooltip
                  key={item.label}
                  title={
                    <Box sx={{ minWidth: 200, textAlign: 'center' }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 700,
                          color: theme.palette.primary.main,
                          mb: 1
                        }}
                      >
                        {item.period} Change
                      </Typography>

                      <Box
                        sx={{
                          p: 1,
                          mb: 1,
                          borderRadius: '6px',
                          background: `linear-gradient(135deg, ${alpha(
                            item.color,
                            0.08
                          )} 0%, ${alpha(item.color, 0.04)} 100%)`,
                          border: `1px solid ${alpha(item.color, 0.15)}`
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 800,
                            color: item.color,
                            fontSize: '1.1rem',
                            mb: 0.5
                          }}
                        >
                          {formatPercentage(item.value)}
                        </Typography>

                        <Typography
                          variant="caption"
                          sx={{
                            color: alpha(theme.palette.text.secondary, 0.8),
                            fontSize: '0.7rem'
                          }}
                        >
                          vs {item.period} ago
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          p: 0.75,
                          borderRadius: '6px',
                          background: `linear-gradient(135deg, ${alpha(
                            theme.palette.background.paper,
                            0.8
                          )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                          backdropFilter: 'blur(8px)',
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                        }}
                      >
                        <LoadChart
                          url={`${BASE_URL}/sparkline/${md5}?${item.label.toLowerCase()}=${
                            item.value
                          }`}
                          sx={{ width: '100%', height: 45 }}
                        />
                      </Box>
                    </Box>
                  }
                  componentsProps={{
                    tooltip: {
                      sx: {
                        ...tooltipStyles,
                        p: 1.5,
                        maxWidth: 'none'
                      },
                      placement: 'top'
                    }
                  }}
                >
                  <Chip
                    label={
                      <Stack alignItems="center" spacing={0.25}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            lineHeight: 1
                          }}
                        >
                          {item.label}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            lineHeight: 1,
                            opacity: 0.9
                          }}
                        >
                          {formatPercentage(item.value)}
                        </Typography>
                      </Stack>
                    }
                    size="small"
                    sx={{
                      height: 40,
                      minWidth: { xs: 60, sm: 70 },
                      borderRadius: '8px',
                      background: `linear-gradient(135deg, ${alpha(item.color, 0.08)} 0%, ${alpha(
                        item.color,
                        0.04
                      )} 100%)`,
                      backdropFilter: 'blur(8px)',
                      border: `2px solid ${alpha(item.color, 0.2)}`,
                      color: item.color,
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: `linear-gradient(90deg, ${alpha(item.color, 0.6)}, ${alpha(
                          item.color,
                          0.3
                        )})`,
                        opacity: 0.8
                      },
                      '& .MuiChip-label': {
                        fontWeight: 700,
                        px: 1,
                        fontSize: '0.75rem',
                        lineHeight: 1.2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0
                      },
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 6px 20px ${alpha(item.color, 0.25)}`,
                        border: `2px solid ${alpha(item.color, 0.4)}`,
                        background: `linear-gradient(135deg, ${alpha(item.color, 0.12)} 0%, ${alpha(
                          item.color,
                          0.06
                        )} 100%)`,
                        '&::before': {
                          height: '3px',
                          opacity: 1
                        }
                      }
                    }}
                  />
                </Tooltip>
              ))}
            </Stack>
          </Box>
        </Stack>

        {/* Compact 24h Range */}
        <Box sx={{ mt: 1.5 }}>
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: alpha(theme.palette.text.primary, 0.8),
              mb: 0.5,
              display: 'block'
            }}
          >
            24h Range
          </Typography>
          <LowHighBar24H token={token} />
        </Box>

        {isTablet && (
          <Box
            sx={{
              height: '1px',
              background: `linear-gradient(90deg, transparent 0%, ${alpha(
                theme.palette.divider,
                0.3
              )} 50%, transparent 100%)`,
              mt: 0.5
            }}
          />
        )}
      </Stack>
    </Box>
  );
}
