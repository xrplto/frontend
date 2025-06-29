import axios from 'axios';
import { useEffect, useState, useMemo, memo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme, alpha } from '@mui/material/styles';
import { useInView } from 'react-intersection-observer';
import { Box, Skeleton } from '@mui/material';
import Decimal from 'decimal.js';

const SparklineChart = ({
  url,
  height = '100%',
  width = '100%',
  showGradient = true,
  lineWidth = 2,
  ...props
}) => {
  const theme = useTheme();
  const [chartOption, setChartOption] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
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
          `,
          z: 9999
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
            animation: true,
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
    [theme, showGradient, lineWidth]
  );

  useEffect(() => {
    const controller = new AbortController();

    const loadChart = async () => {
      if (!url || !inView) return;

      setIsLoading(true);
      setIsError(false);

      try {
        const response = await axios.get(url, {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'max-age=300' // Cache for 5 minutes
          }
        });
        if (response.data) {
          setChartOption(createChartOptions(response.data));
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching chart data:', err);
          setIsError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadChart();

    return () => {
      controller.abort();
    };
  }, [inView, url, createChartOptions]);

  // Loading state with skeleton
  if (isLoading) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: typeof height === 'string' && height.includes('px') ? height : '40px'
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

  // No data state
  if (!chartOption) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: typeof height === 'string' && height.includes('px') ? height : '40px'
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
    <Box ref={ref} sx={{ height, width, position: 'relative' }}>
      {inView && (
        <ReactECharts
          option={chartOption}
          style={{
            height,
            width,
            transition: 'filter 0.2s ease-in-out'
          }}
          opts={{
            renderer: 'svg',
            devicePixelRatio: window.devicePixelRatio || 1
          }}
          className="echarts-chart"
          {...props}
        />
      )}
    </Box>
  );
};

// Memoize the entire component
export default memo(SparklineChart);
