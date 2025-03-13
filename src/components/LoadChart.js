import axios from 'axios';
import { useEffect, useState, useMemo, memo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '@mui/material/styles';
import { LazyLoadComponent } from 'react-lazy-load-image-component';
import Decimal from 'decimal.js';

const LoadChart = ({ url, ...props }) => {
  const theme = useTheme();
  const [chartOption, setChartOption] = useState(null);
  const [isError, setIsError] = useState(false);

  // Memoize the chart options creation function
  const createChartOptions = useMemo(
    () => (data) => {
      const { chartColor, data: chartData } = data;

      // Parse prices as Decimal objects to handle very small numbers correctly
      // Then normalize the values for display while preserving the shape
      const priceCoordinates = [];
      const originalPrices = [];
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
          axisPointer: {
            type: 'none'
          },
          backgroundColor: 'rgba(32, 32, 32, 0.9)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          textStyle: {
            color: '#fff',
            fontSize: 12
          },
          formatter: function (params) {
            // Get the index from the x-value of the data point
            const index = params[0].value[0];
            // Use the original price value from our stored array
            const originalPrice = originalPrices[index];
            // Get the timestamp from the data
            const timestamp = chartData.timestamps[index];
            // Format timestamp to readable date/time
            const date = new Date(timestamp);
            const formattedDate = date.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });

            // Return only the formatted date and price
            return `${formattedDate}<br/>Price: ${originalPrice}`;
          },
          padding: [8, 12]
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
            color: chartColor,
            showSymbol: false,
            symbolSize: 0,
            lineStyle: {
              width: 2,
              shadowColor: chartColor,
              shadowBlur: 10,
              shadowOffsetY: 5,
              cap: 'round'
            },
            smooth: 0.3,
            animation: false
          }
        ]
      };
    },
    [theme]
  );

  // Memoize the axios request
  const fetchChartData = useMemo(() => {
    const controller = new AbortController();

    return async () => {
      try {
        const response = await axios.get(url, {
          signal: controller.signal,
          // Add caching headers
          headers: {
            'Cache-Control': 'max-age=300' // Cache for 5 minutes
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
      }
    };
  }, [url]);

  useEffect(() => {
    let isMounted = true;

    const loadChart = async () => {
      if (!url) return;

      const data = await fetchChartData();
      if (data && isMounted) {
        setChartOption(createChartOptions(data));
      }
    };

    loadChart();

    return () => {
      isMounted = false;
    };
  }, [url, fetchChartData, createChartOptions]);

  if (isError) return null;
  if (!chartOption) return null; // Add this check to prevent rendering with null options

  return (
    <LazyLoadComponent threshold={100}>
      <ReactECharts
        option={chartOption}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
        {...props}
      />
    </LazyLoadComponent>
  );
};

// Memoize the entire component
export default memo(LoadChart);
