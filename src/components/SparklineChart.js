import axios from 'axios';
import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '@mui/material/styles';

const SparklineChart = ({ url }) => {
  const theme = useTheme();
  const [chartOption, setChartOption] = useState(null);

  useEffect(() => {
    if (url) {
      async function getChart() {
        try {
          const res = await axios.get(url);
          const { coodinate, chartColor } = res.data;

          const option = {
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
                data: coodinate,
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

          setChartOption(option);
        } catch (err) {
          console.error('Error fetching chart data:', err);
        }
      }

      getChart();
    }
  }, [url, theme]);

  if (!chartOption) {
    return null;
  }

  return (
    <ReactECharts
      option={chartOption}
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  );
};

export default SparklineChart;
