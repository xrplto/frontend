import axios from 'axios';
import { useEffect, useState, useMemo, memo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '@mui/material/styles';
import { LazyLoadComponent } from 'react-lazy-load-image-component';

const LoadChart = ({ url }) => {
  const theme = useTheme();
  const [chartOption, setChartOption] = useState(null);
  const [isError, setIsError] = useState(false);

  // Memoize the chart options creation function
  const createChartOptions = useMemo(
    () => (data) => {
      const { coodinate, chartColor } = data;

      // Invert the negative values to fix upside-down chart
      const normalizedCoordinates = coodinate.map(([x, y]) => {
        // If y is negative, make it positive (invert it)
        return [x, y < 0 ? Math.abs(y) : y];
      });

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
            type: 'cross',
            animation: false,
            label: {
              backgroundColor: '#202020'
            }
          },
          backgroundColor: 'rgba(32, 32, 32, 0.9)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          textStyle: {
            color: '#fff',
            fontSize: 12
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
            data: normalizedCoordinates,
            type: 'line',
            color:
              chartColor === '#54D62C'
                ? theme.palette.primary.light
                : chartColor === '#FF6C40'
                ? theme.palette.error.main
                : chartColor,
            showSymbol: false,
            symbolSize: 0,
            lineStyle: {
              width: 2,
              shadowColor:
                chartColor === '#54D62C'
                  ? theme.palette.primary.light
                  : chartColor === '#FF6C40'
                  ? theme.palette.error.main
                  : chartColor,
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

  if (isError || !chartOption) return null;

  return (
    <LazyLoadComponent threshold={100}>
      <ReactECharts
        option={chartOption}
        style={{ height: 48, width: 200 }}
        opts={{
          renderer: 'svg',
          width: 'auto',
          height: 'auto'
        }}
        notMerge={true}
        lazyUpdate={true}
      />
    </LazyLoadComponent>
  );
};

// Memoize the entire component
export default memo(LoadChart);
