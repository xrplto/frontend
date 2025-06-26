import axios from 'axios';
import { useEffect, useState, useMemo, memo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme, alpha } from '@mui/material/styles';
import { Box, Skeleton } from '@mui/material';
import Decimal from 'decimal.js';
import { useInView } from 'react-intersection-observer';

const LoadChart = ({ url, showGradient = true, lineWidth = 2, animation = true, ...props }) => {
  const theme = useTheme();
  const [chartOption, setChartOption] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { ref, inView } = useInView({
    triggerOnce: true, // Only trigger once
    threshold: 0.1 // Trigger when 10% of the element is visible
  });

  // Memoize the chart options creation function
  const createChartOptions = useMemo(
    () => (data) => {
      const { chartColor, data: chartData } = data;

      // Parse prices as Decimal objects to handle very small numbers correctly
      // Then normalize the values for display while preserving the shape
      const priceCoordinates = [];
      const originalPrices = [];
      let isPositiveTrend = false;

      if (chartData?.prices?.length) {
        // Find min and max to normalize values
        let minPrice = new Decimal(chartData.prices[0]);
        let maxPrice = new Decimal(chartData.prices[0]);

        chartData.prices.forEach((price) => {
          const decPrice =
            typeof price === 'string' ? new Decimal(price) : new Decimal(price.toString());
          if (decPrice.lt(minPrice)) minPrice = decPrice;
          if (decPrice.gt(maxPrice)) maxPrice = decPrice;
        });

        // Calculate range for normalization
        const range = maxPrice.minus(minPrice);

        // Determine trend direction
        const firstPrice = new Decimal(chartData.prices[0]);
        const lastPrice = new Decimal(chartData.prices[chartData.prices.length - 1]);
        isPositiveTrend = lastPrice.gte(firstPrice);

        // Create normalized coordinates that preserve the shape
        chartData.prices.forEach((price, index) => {
          const decPrice =
            typeof price === 'string' ? new Decimal(price) : new Decimal(price.toString());
          // Store original price for tooltip
          originalPrices[index] = price;
          // Normalize to values between 0 and 100 for better display
          const normalizedValue = range.isZero()
            ? 50
            : decPrice.minus(minPrice).div(range).times(100).toNumber();
          priceCoordinates.push([index, normalizedValue]);
        });
      }

      // Enhanced color scheme based on trend
      const baseColor =
        chartColor || (isPositiveTrend ? theme.palette.success.main : theme.palette.error.main);
      const gradientColor = isPositiveTrend
        ? [theme.palette.success.main, theme.palette.success.light]
        : [theme.palette.error.main, theme.palette.error.light];

      return {
        grid: {
          left: 2,
          right: 2,
          top: 2,
          bottom: 2,
          containLabel: false
        },
        tooltip: {
          trigger: 'axis',
          appendTo: 'body',
          axisPointer: {
            type: 'line',
            lineStyle: {
              color: alpha(baseColor, 0.6),
              width: 1,
              type: 'dashed'
            }
          },
          backgroundColor:
            theme.palette.mode === 'dark' ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: alpha(baseColor, 0.3),
          borderWidth: 1,
          borderRadius: 8,
          textStyle: {
            color: theme.palette.text.primary,
            fontSize: 12,
            fontWeight: 500
          },
          formatter: function (params) {
            if (!params || !params[0]) return '';

            // Get the index from the x-value of the data point
            const index = params[0].value[0];
            // Use the original price value from our stored array
            const originalPrice = originalPrices[index];

            if (!chartData?.timestamps || !chartData.timestamps[index]) {
              return `Price: ${originalPrice}`;
            }

            // Get the timestamp from the data
            const timestamp = chartData.timestamps[index];
            // Format timestamp to readable date/time
            const date = new Date(timestamp);
            const formattedDate = date.toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            // Enhanced tooltip with trend indicator
            const trendIcon = isPositiveTrend ? '↗' : '↘';
            const trendColor = isPositiveTrend ? '#22c55e' : '#ef4444';

            return `
              <div style="padding: 4px 0;">
                <div style="color: ${theme.palette.text.secondary}; font-size: 11px; margin-bottom: 2px;">
                  ${formattedDate}
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="color: ${trendColor}; font-size: 14px;">${trendIcon}</span>
                  <span style="font-weight: 600; color: ${theme.palette.text.primary};">
                    ${originalPrice}
                  </span>
                </div>
              </div>
            `;
          },
          padding: [12, 16],
          extraCssText: `
            box-shadow: 0 8px 32px ${alpha(theme.palette.common.black, 0.12)};
            backdrop-filter: blur(8px);
            border-radius: 8px;
            position: fixed !important;
            z-index: 99999 !important;
            pointer-events: none;
          `,
          z: 99999
        },
        xAxis: {
          type: 'category',
          show: false,
          boundaryGap: false
        },
        yAxis: {
          type: 'value',
          show: false,
          scale: true
        },
        series: [
          {
            data: priceCoordinates,
            type: 'line',
            color: baseColor,
            showSymbol: false,
            symbolSize: 0,
            lineStyle: {
              width: lineWidth,
              shadowColor: alpha(baseColor, 0.4),
              shadowBlur: 8,
              shadowOffsetY: 2,
              cap: 'round',
              join: 'round'
            },
            smooth: 0.4,
            animation: animation,
            animationDuration: 1000,
            animationEasing: 'cubicOut',
            // Add gradient fill if enabled
            ...(showGradient && {
              areaStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    {
                      offset: 0,
                      color: alpha(gradientColor[0], 0.3)
                    },
                    {
                      offset: 0.5,
                      color: alpha(gradientColor[0], 0.15)
                    },
                    {
                      offset: 1,
                      color: alpha(gradientColor[1], 0.05)
                    }
                  ]
                },
                shadowColor: alpha(baseColor, 0.2),
                shadowBlur: 4
              }
            }),
            // Enhanced hover effects
            emphasis: {
              lineStyle: {
                width: lineWidth + 1,
                shadowBlur: 12,
                shadowColor: alpha(baseColor, 0.6)
              },
              ...(showGradient && {
                areaStyle: {
                  color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                      {
                        offset: 0,
                        color: alpha(gradientColor[0], 0.4)
                      },
                      {
                        offset: 0.5,
                        color: alpha(gradientColor[0], 0.2)
                      },
                      {
                        offset: 1,
                        color: alpha(gradientColor[1], 0.08)
                      }
                    ]
                  }
                }
              })
            }
          }
        ]
      };
    },
    [theme, showGradient, lineWidth, animation]
  );

  useEffect(() => {
    const controller = new AbortController();

    const fetchChartData = async () => {
      if (!url || !inView) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setIsError(false);
      try {
        const response = await axios.get(url, {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'max-age=300' // Cache for 5 minutes
          }
        });
        setChartOption(createChartOptions(response.data));
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error('Error fetching chart data:', err);
          setIsError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchChartData();

    return () => {
      controller.abort();
    };
  }, [url, createChartOptions, inView]);

  // Loading state with skeleton
  if (isLoading) {
    return (
      <Box
        ref={ref}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '40px'
        }}
      >
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
          sx={{
            borderRadius: 1,
            bgcolor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.white, 0.05)
                : alpha(theme.palette.common.black, 0.05)
          }}
        />
      </Box>
    );
  }

  // Error state
  if (isError) {
    return (
      <Box
        ref={ref}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '40px',
          opacity: 0.3
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${alpha(
              theme.palette.divider,
              0.5
            )}, transparent)`,
            borderRadius: 1
          }}
        />
      </Box>
    );
  }

  // No data state
  if (!chartOption) {
    return (
      <Box
        ref={ref}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '40px'
        }}
      >
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation={false}
          sx={{
            borderRadius: 1,
            bgcolor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.white, 0.02)
                : alpha(theme.palette.common.black, 0.02)
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      ref={ref}
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        borderRadius: 1,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'scale(1.02)',
          '& .echarts-chart': {
            filter: 'brightness(1.1)'
          }
        }
      }}
    >
      <ReactECharts
        option={chartOption}
        style={{
          height: '100%',
          width: '100%',
          transition: 'filter 0.2s ease-in-out'
        }}
        opts={{
          renderer: 'svg',
          devicePixelRatio: window.devicePixelRatio || 1
        }}
        className="echarts-chart"
        {...props}
      />
    </Box>
  );
};

// Memoize the entire component
export default memo(LoadChart);
