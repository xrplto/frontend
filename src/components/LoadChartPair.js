import axios from 'axios';
import { useEffect, useState, useMemo, memo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme, alpha } from '@mui/material/styles';
import { useInView } from 'react-intersection-observer';
import { Box, Skeleton } from '@mui/material';
import Decimal from 'decimal.js';

const LoadChart = ({ url, showGradient = true, lineWidth = 2, ...props }) => {
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
      const { coodinate, chartColor } = data;

      if (!coodinate || !Array.isArray(coodinate) || coodinate.length === 0) {
        return null;
      }

      // Determine trend direction
      const firstValue = coodinate[0];
      const lastValue = coodinate[coodinate.length - 1];
      const isPositiveTrend = lastValue >= firstValue;

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

            const value = params[0].value;
            const trendIcon = isPositiveTrend ? '↗' : '↘';
            const trendColor = isPositiveTrend ? '#22c55e' : '#ef4444';

            return `
              <div style="padding: 4px 0;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="color: ${trendColor}; font-size: 14px;">${trendIcon}</span>
                  <span style="font-weight: 600; color: ${theme.palette.text.primary};">
                    ${value}
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
            data: coodinate,
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

  // Memoize the axios request
  const fetchChartData = useMemo(() => {
    const controller = new AbortController();

    return async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(url, {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'max-age=300'
          }
        });
        return response.data;
      } catch (err) {
        if (err.name === 'AbortError') {
          console.log('Request aborted');
        } else {
          console.error('Error fetching chart data:', err);
          setIsError(true);
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    };
  }, [url]);

  useEffect(() => {
    let isMounted = true;

    const loadChart = async () => {
      if (!url || !inView) return;

      const data = await fetchChartData();
      if (data && isMounted) {
        const options = createChartOptions(data);
        if (options) {
          setChartOption(options);
        }
      }
    };

    loadChart();

    return () => {
      isMounted = false;
    };
  }, [url, fetchChartData, createChartOptions, inView]);

  // Loading state with skeleton
  if (isLoading) {
    return (
      <Box
        ref={ref}
        sx={{
          width: 210,
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Skeleton
          variant="rectangular"
          width={210}
          height={80}
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
          width: 210,
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.3
        }}
      >
        <Box
          sx={{
            width: '80%',
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
          width: 210,
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Skeleton
          variant="rectangular"
          width={210}
          height={80}
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
        width: 210,
        height: 80,
        position: 'relative',
        overflow: 'hidden',
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
          height: 80,
          width: 210,
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

export default memo(LoadChart);
