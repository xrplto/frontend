import React, { useEffect, useRef, useState } from 'react';
import { createChart, LineSeries } from 'lightweight-charts';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const LightweightChart = ({ 
  data = [], 
  series = [], 
  height = 400,
  showLegend = true,
  onCrosshairMove,
  onClick
}) => {
  const theme = useTheme();
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const seriesRefs = useRef([]);
  const [hoveredData, setHoveredData] = useState(null);
  const isDarkMode = theme.palette.mode === 'dark';

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) return;

    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth 
        });
      }
    };

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: theme.palette.text.secondary,
        fontSize: 12,
      },
      grid: {
        vertLines: {
          color: alpha(theme.palette.divider, 0.1),
          style: 1,
          visible: true,
        },
        horzLines: {
          color: alpha(theme.palette.divider, 0.1),
          style: 1,
          visible: true,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: alpha(theme.palette.text.secondary, 0.3),
          style: 0,
        },
        horzLine: {
          visible: true,
          labelVisible: true,
          width: 1,
          color: alpha(theme.palette.text.secondary, 0.3),
          style: 0,
        },
      },
      rightPriceScale: {
        borderColor: alpha(theme.palette.divider, 0.1),
        visible: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: alpha(theme.palette.divider, 0.1),
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 3,
        fixLeftEdge: true,
        lockVisibleTimeRangeOnResize: true,
        rightBarStaysOnScroll: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    chartRef.current = chart;
    seriesRefs.current = [];

    // Process data for each series
    series.forEach((seriesConfig, index) => {
      if (!seriesConfig.visible) return;

      const lineData = data
        .filter(item => item[seriesConfig.dataKey] !== null && item[seriesConfig.dataKey] !== undefined)
        .map(item => {
          let value = parseFloat(item[seriesConfig.dataKey] || 0);
          
          // Scale down large values to fit lightweight-charts limits
          // Max value is ~90 trillion, so scale down values > 1 billion to millions
          if (Math.abs(value) > 1000000000) {
            value = value / 1000000; // Convert to millions
          }
          
          return {
            time: Math.floor(new Date(item.date || item.time).getTime() / 1000),
            value: value
          };
        })
        .sort((a, b) => a.time - b.time);

      if (lineData.length === 0) return;

      const lineSeries = chart.addSeries(LineSeries, {
        color: seriesConfig.color || theme.palette.primary.main,
        lineWidth: seriesConfig.lineWidth || 2,
        title: seriesConfig.name || seriesConfig.dataKey,
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        lineStyle: 0,
        lineType: 2,
      });

      lineSeries.setData(lineData);
      seriesRefs.current.push({ 
        series: lineSeries, 
        config: seriesConfig 
      });
    });

    // Handle crosshair move
    chart.subscribeCrosshairMove((param) => {
      if (param.time) {
        const prices = {};
        seriesRefs.current.forEach(({ series, config }) => {
          const data = param.seriesData.get(series);
          if (data) {
            prices[config.dataKey] = data.value;
          }
        });
        setHoveredData({ time: param.time, prices });
        if (onCrosshairMove) {
          onCrosshairMove({ time: param.time, prices });
        }
      } else {
        setHoveredData(null);
      }
    });

    // Handle click
    if (onClick) {
      chart.subscribeClick((param) => {
        if (param.time) {
          const clickData = data.find(d => 
            Math.floor(new Date(d.date).getTime() / 1000) === param.time
          );
          if (clickData) {
            onClick(clickData);
          }
        }
      });
    }

    chart.timeScale().fitContent();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [data, series, height, theme, isDarkMode, onCrosshairMove, onClick]);

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {showLegend && series.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            mb: 1,
            px: 1,
          }}
        >
          {series.filter(s => s.visible).map((seriesConfig, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 3,
                  backgroundColor: seriesConfig.color || theme.palette.primary.main,
                  borderRadius: 1,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {seriesConfig.name || seriesConfig.dataKey}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
      
      <div ref={chartContainerRef} style={{ width: '100%' }} />
      
      {hoveredData && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            borderRadius: 1,
            p: 1,
            fontSize: '0.75rem',
            zIndex: 1000,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {new Date(hoveredData.time * 1000).toLocaleDateString()}
          </Typography>
          {Object.entries(hoveredData.prices).map(([key, value]) => {
            const seriesConfig = series.find(s => s.dataKey === key);
            return (
              <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    backgroundColor: seriesConfig?.color || theme.palette.primary.main,
                    borderRadius: '50%',
                  }}
                />
                <Typography variant="caption">
                  {seriesConfig?.name || key}: {(value > 1000 ? value * 1000000 : value).toLocaleString()}
                  {value > 1000 ? ' (scaled)' : ''}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default LightweightChart;