import axios from 'axios';
import { useEffect, useState, useMemo, memo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme, alpha } from '@mui/material/styles';
import { Box, Skeleton } from '@mui/material';
import Decimal from 'decimal.js';
import { useInView } from 'react-intersection-observer';

// Simple in-memory cache with TTL
const chartDataCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedData = (url) => {
  const cached = chartDataCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

const setCachedData = (url, data) => {
  chartDataCache.set(url, {
    data,
    timestamp: Date.now()
  });
};

const LoadChart = ({ url, showGradient = true, lineWidth = 2, animation = true, ...props }) => {
  const theme = useTheme();
  const [chartOption, setChartOption] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const previousUrlRef = useRef(url);

  const { ref, inView } = useInView({
    triggerOnce: true, // Only trigger once
    threshold: 0.1 // Trigger when 10% of the element is visible
  });

  // Memoize the chart options creation function
  const createChartOptions = useMemo(
    () => (data) => {
      const { chartColor, data: chartData } = data;

      // If no data, return null to render nothing
      if (!chartData?.prices?.length) {
        return null;
      }

      const isLightweight = data.isLightweight || false;

      let displayPrices = chartData.prices;
      let displayTimestamps = chartData.timestamps;

      // For tokens with less than 24h of data (less than ~288 data points for 5-min intervals),
      // show the full sparkline without trimming
      const is24hOrLess = data.period === '24h' || chartData.prices.length < 300;

      // Always trim the leading flat line for non-lightweight charts
      if (!isLightweight) {
        // Find the index of the first significant price change to trim the leading flat line
        let firstChangeIndex = 0;
        if (chartData.prices.length > 1) {
          const firstPriceDecimal = new Decimal(chartData.prices[0]);
          for (let i = 1; i < chartData.prices.length; i++) {
            const currentPriceDecimal = new Decimal(
              typeof chartData.prices[i] === 'string'
                ? chartData.prices[i]
                : chartData.prices[i].toString()
            );
            if (!currentPriceDecimal.equals(firstPriceDecimal)) {
              // Start one point before the change to show the start of the ramp-up
              firstChangeIndex = i > 0 ? i - 1 : 0;
              break;
            }
          }
        }
        displayPrices = chartData.prices.slice(firstChangeIndex);
        displayTimestamps = chartData.timestamps.slice(firstChangeIndex);
      }

      // Parse prices as Decimal objects to handle very small numbers correctly
      // Then normalize the values for display while preserving the shape
      const priceCoordinates = [];
      const originalPrices = [];
      let isPositiveTrend = false;
      let isFlatLine = false;

      if (displayPrices?.length) {
        // Find min and max to normalize values
        let minPrice = new Decimal(displayPrices[0]);
        let maxPrice = new Decimal(displayPrices[0]);
        
        // Track unique price values to detect truly flat lines
        const uniquePrices = new Set();

        displayPrices.forEach((price) => {
          const decPrice =
            typeof price === 'string' ? new Decimal(price) : new Decimal(price.toString());
          if (decPrice.lt(minPrice)) minPrice = decPrice;
          if (decPrice.gt(maxPrice)) maxPrice = decPrice;
          
          // Track unique prices
          uniquePrices.add(price.toString());
        });

        // Calculate range for normalization
        const range = maxPrice.minus(minPrice);
        // Dynamic threshold: consider flat if variation is less than 0.0001% of the average price
        const avgPrice = maxPrice.plus(minPrice).div(2);
        const relativeVariation = avgPrice.isZero() ? new Decimal(0) : range.div(avgPrice);
        
        // Check if we have any price variation
        // Since we've already trimmed the leading flat line, we should show actual variations
        isFlatLine = uniquePrices.size === 1 || range.isZero();

        // Determine trend direction
        const firstPrice = new Decimal(displayPrices[0]);
        const lastPrice = new Decimal(displayPrices[displayPrices.length - 1]);
        isPositiveTrend = lastPrice.gte(firstPrice);

        // Create normalized coordinates that preserve the shape
        displayPrices.forEach((price, index) => {
          const decPrice =
            typeof price === 'string' ? new Decimal(price) : new Decimal(price.toString());
          originalPrices[index] = price;
          let normalizedValue;
          if (isFlatLine) {
            // For flat lines, create a subtle wave pattern for visual feedback
            const waveAmplitude = 5; // Small amplitude for subtle effect
            const waveFrequency = 0.02; // Frequency of the wave
            normalizedValue = 50 + waveAmplitude * Math.sin(index * waveFrequency);
          } else if (range.isZero()) {
            // If range is exactly zero but we're not treating it as flat (e.g., for 24h tokens)
            // Show a horizontal line at 50
            normalizedValue = 50;
          } else {
            // Enhanced normalization for very small variations
            // Scale to 20-80 range to make variations more visible
            const scaledValue = decPrice.minus(minPrice).div(range);
            normalizedValue = 20 + scaledValue.times(60).toNumber();
          }
          priceCoordinates.push([displayTimestamps[index], normalizedValue]);
        });
      }

      // Futuristic color scheme based on trend
      // For flat lines, use the provided chartColor or a neutral color
      const baseColor = isFlatLine 
        ? (chartColor || theme.palette.divider)
        : (chartColor || (isPositiveTrend ? '#00ff88' : '#ff3366'));
      const glowColor = isFlatLine
        ? (chartColor || theme.palette.divider) 
        : (isPositiveTrend ? '#00ff88' : '#ff3366');
      const gradientColor = isFlatLine
        ? [baseColor, baseColor, baseColor]
        : (isPositiveTrend
            ? ['#00ff88', '#00cc66', '#004422']
            : ['#ff3366', '#cc2255', '#440011']);

      return {
        grid: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          containLabel: false
        },
        tooltip: {
          trigger: 'axis',
          appendTo: 'body',
          axisPointer: {
            type: 'line',
            lineStyle: {
              color: glowColor,
              width: 2,
              type: 'solid',
              shadowColor: glowColor,
              shadowBlur: 8
            }
          },
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(0, 0, 0, 0.9)' 
            : 'rgba(15, 15, 35, 0.95)',
          borderColor: glowColor,
          borderWidth: 2,
          borderRadius: 12,
          textStyle: {
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'inherit'
          },
          formatter: function (params) {
            if (!params || !params[0]) return '';

            // Get the index from the x-value of the data point
            const index = params[0].dataIndex;
            // Use the original price value from our stored array
            const originalPrice = originalPrices[index];

            if (!displayTimestamps || !displayTimestamps[index]) {
              return `Price: ${originalPrice}`;
            }

            // Get the timestamp from the data
            const timestamp = displayTimestamps[index];
            // Format timestamp to readable date/time
            const date = new Date(timestamp);
            const formattedDate = date.toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            // Futuristic tooltip with neon styling
            const trendIcon = isPositiveTrend ? '▲' : '▼';
            const trendColor = isPositiveTrend ? '#00ff88' : '#ff3366';

            return `
              <div style="padding: 8px 12px; background: linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(15,15,35,0.95) 100%); border: 1px solid ${glowColor}; border-radius: 8px; box-shadow: 0 0 20px ${alpha(glowColor, 0.3)};">
                <div style="color: #888; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; font-family: inherit;">
                  ${formattedDate}
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="color: ${trendColor}; font-size: 16px; text-shadow: 0 0 10px ${trendColor};">${trendIcon}</span>
                  <span style="font-weight: 700; color: #ffffff; font-family: inherit; text-shadow: 0 0 10px ${glowColor};">
                    ${originalPrice}
                  </span>
                </div>
              </div>
            `;
          },
          padding: [0, 0],
          extraCssText: `
            box-shadow: 0 0 30px ${alpha(glowColor, 0.4)}, 0 0 60px ${alpha(glowColor, 0.2)};
            backdrop-filter: blur(20px);
            border-radius: 12px;
            position: fixed !important;
            z-index: 99999 !important;
            pointer-events: none;
            border: 2px solid ${glowColor};
          `,
          z: 99999
        },
        xAxis: {
          type: 'time',
          show: false,
          boundaryGap: false
        },
        yAxis: {
          type: 'value',
          show: false,
          scale: false,
          // Set appropriate bounds based on the data
          min: isFlatLine ? 40 : 0,
          max: isFlatLine ? 60 : 100
        },
        series: [
          {
            data: priceCoordinates,
            type: 'line',
            // sampling: 'lttb', // Disabled to show all data points
            large: true, // Enable large data optimization
            largeThreshold: 5000, // Threshold for large data mode
            color: baseColor,
            showSymbol: false,
            symbolSize: 0,
            lineStyle: {
              width: isFlatLine ? lineWidth : lineWidth + 1,
              shadowColor: glowColor,
              shadowBlur: isFlatLine ? 0 : 15,
              shadowOffsetY: 0,
              cap: 'round',
              join: 'round'
            },
            smooth: isFlatLine ? false : 0.3,
            animation: animation,
            animationDuration: 1500,
            animationEasing: 'elasticOut',
            // Futuristic gradient fill
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
                      offset: 0.3,
                      color: alpha(gradientColor[1], 0.2)
                    },
                    {
                      offset: 0.7,
                      color: alpha(gradientColor[2], 0.1)
                    },
                    {
                      offset: 1,
                      color: alpha(gradientColor[2], 0.02)
                    }
                  ]
                },
                shadowColor: glowColor,
                shadowBlur: 20,
                shadowOffsetY: 0
              }
            }),
            // Futuristic hover effects
            emphasis: {
              lineStyle: {
                width: lineWidth + 2,
                shadowBlur: 25,
                shadowColor: glowColor
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
                        color: alpha(gradientColor[0], 0.6)
                      },
                      {
                        offset: 0.3,
                        color: alpha(gradientColor[1], 0.3)
                      },
                      {
                        offset: 0.7,
                        color: alpha(gradientColor[2], 0.15)
                      },
                      {
                        offset: 1,
                        color: alpha(gradientColor[2], 0.05)
                      }
                    ]
                  },
                  shadowColor: glowColor,
                  shadowBlur: 30
                }
              })
            }
          }
        ]
      };
    },
    [theme, showGradient, lineWidth, animation]
  );

  // Store fetched data to prevent refetching when dependencies change
  const [fetchedData, setFetchedData] = useState(null);
  
  // Fetch data only when URL changes or component comes into view
  useEffect(() => {
    // Skip if URL hasn't changed
    if (previousUrlRef.current === url && fetchedData) {
      return;
    }
    previousUrlRef.current = url;

    const controller = new AbortController();

    const fetchChartData = async () => {
      if (!url || !inView) {
        setIsLoading(false);
        return;
      }
      
      // Check cache first
      const cachedData = getCachedData(url);
      if (cachedData) {
        setFetchedData(cachedData);
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
        // Add isLightweight flag to the data based on URL
        const dataWithFlag = {
          ...response.data,
          isLightweight: url?.includes('lightweight=true')
        };
        setFetchedData(dataWithFlag);
        setCachedData(url, dataWithFlag); // Cache the data
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
  }, [url, inView, fetchedData]); // Only fetch when URL or visibility changes

  // Update chart options when data or visual properties change
  useEffect(() => {
    if (fetchedData) {
      setChartOption(createChartOptions(fetchedData));
    }
  }, [fetchedData, createChartOptions]);

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
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            '&::after': {
              background: `linear-gradient(90deg, transparent, ${alpha('#00ff88', 0.2)}, transparent)`
            }
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
            bgcolor: 'transparent'
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
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          '& .echarts-chart': {
            filter: 'brightness(1.1) saturate(1.2)'
          }
        }
      }}
    >
      <ReactECharts
        option={chartOption}
        style={{
          height: '100%',
          width: '100%',
          transition: 'filter 0.3s ease-in-out',
          background: 'transparent'
        }}
        opts={{
          renderer: 'svg',
          devicePixelRatio: window.devicePixelRatio || 2,
          ...props.opts
        }}
        className="echarts-chart"
        {...props}
      />
    </Box>
  );
};

// Memoize the entire component
export default memo(LoadChart);
