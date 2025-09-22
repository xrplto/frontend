import React, { useEffect, useRef, useState } from 'react';
import { createChart, LineSeries, HistogramSeries } from 'lightweight-charts';
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
  onClick,
  showVolume = false
}) => {
  const theme = useTheme();
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const seriesRefs = useRef([]);
  const [hoveredData, setHoveredData] = useState(null);
  const [visibleSeries, setVisibleSeries] = useState(
    series.reduce((acc, s, idx) => ({ ...acc, [idx]: s.visible !== false }), {})
  );
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
        background: { type: 'solid', color: theme.chart?.background || 'transparent' },
        textColor: theme.palette.text.secondary,
        fontSize: 12
      },
      grid: {
        vertLines: {
          color: theme.chart?.gridColor || alpha(theme.palette.divider, 0.1),
          style: 1,
          visible: true
        },
        horzLines: {
          color: theme.chart?.gridColor || alpha(theme.palette.divider, 0.1),
          style: 1,
          visible: true
        }
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: alpha(theme.palette.text.secondary, 0.3),
          style: 0
        },
        horzLine: {
          visible: true,
          labelVisible: true,
          width: 1,
          color: alpha(theme.palette.text.secondary, 0.3),
          style: 0
        }
      },
      rightPriceScale: {
        borderColor: theme.chart?.borderColor || alpha(theme.palette.divider, 0.1),
        visible: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.25 // More space at bottom for volume bars
        }
      },
      leftPriceScale: {
        borderColor: theme.chart?.borderColor || alpha(theme.palette.divider, 0.1),
        visible: false,
        scaleMargins: {
          top: 0.7, // Volume bars only use bottom 30% of chart
          bottom: 0
        }
      },
      timeScale: {
        borderColor: theme.chart?.borderColor || alpha(theme.palette.divider, 0.1),
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 3,
        fixLeftEdge: true,
        lockVisibleTimeRangeOnResize: true,
        rightBarStaysOnScroll: true
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true
      }
    });

    chartRef.current = chart;
    seriesRefs.current = [];

    // Process data for each series
    series.forEach((seriesConfig, index) => {
      if (!seriesConfig.visible) return;


      const processedData = data
        .filter(
          (item) => item[seriesConfig.dataKey] !== null && item[seriesConfig.dataKey] !== undefined
        )
        .map((item, idx) => {
          let value = parseFloat(item[seriesConfig.dataKey] || 0);

          // Scale down large values to fit lightweight-charts limits
          if (Math.abs(value) > 1000000000) {
            value = value / 1000000; // Convert to millions
          }

          // Parse date with better error handling
          let timestamp;
          const dateValue = item.date || item.time;

          if (!dateValue) {
            console.warn(`Missing date for item ${idx}:`, item);
            return null;
          }

          const parsedDate = new Date(dateValue);
          if (isNaN(parsedDate.getTime())) {
            console.warn(`Invalid date at index ${idx}: ${dateValue}`);
            return null;
          }

          timestamp = Math.floor(parsedDate.getTime() / 1000);

          return {
            time: timestamp,
            value: value
          };
        })
        .filter((item) => item !== null) // Remove invalid entries
        .sort((a, b) => a.time - b.time);

      if (processedData.length === 0) {
        return;
      }


      let series;

      // Create the appropriate series type based on configuration
      if (seriesConfig.type === 'histogram' || seriesConfig.type === 'column') {
        // Check if this is a volume series in ROI view
        const isVolumeInRoi =
          seriesConfig.isVolumeInRoi ||
          (seriesConfig.name &&
            seriesConfig.name.toLowerCase().includes('volume') &&
            data.some((d) => d.dailyroi !== undefined));

        series = chart.addSeries(HistogramSeries, {
          color: isVolumeInRoi
            ? alpha(seriesConfig.color || theme.palette.info.main, 0.3)
            : seriesConfig.color || theme.palette.primary.main,
          priceFormat: {
            type: 'volume',
            precision: 0,
            minMove: 1
          },
          title: seriesConfig.name || seriesConfig.dataKey,
          priceScaleId: isVolumeInRoi ? 'left' : 'right'
        });
      } else {
        // Default to line series
        series = chart.addSeries(LineSeries, {
          color: seriesConfig.color || theme.palette.primary.main,
          lineWidth: seriesConfig.lineWidth || 2,
          title: seriesConfig.name || seriesConfig.dataKey,
          priceLineVisible: false,
          lastValueVisible: true,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 4,
          lineStyle: 0,
          lineType: 2,
          priceScaleId: 'right'
        });
      }


      series.setData(processedData);
      seriesRefs.current.push({
        series: series,
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
          const clickData = data.find(
            (d) => Math.floor(new Date(d.date).getTime() / 1000) === param.time
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
            mb: 1.5,
            px: 1
          }}
        >
          {series.map((seriesConfig, index) => (
            <Box
              key={index}
              onClick={() => {
                const newVisible = { ...visibleSeries, [index]: !visibleSeries[index] };
                setVisibleSeries(newVisible);
                if (seriesRefs.current[index]) {
                  const seriesRef = seriesRefs.current.find((ref) => ref.config === seriesConfig);
                  if (seriesRef) {
                    seriesRef.series.applyOptions({
                      visible: newVisible[index]
                    });
                  }
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                opacity: visibleSeries[index] ? 1 : 0.4,
                transition: 'all 0.2s ease',
                '&:hover': {
                  opacity: visibleSeries[index] ? 0.8 : 0.6
                }
              }}
            >
              <Box
                sx={{
                  width: 14,
                  height:
                    seriesConfig.type === 'column' || seriesConfig.type === 'histogram' ? 8 : 3,
                  backgroundColor: seriesConfig.color || theme.palette.primary.main,
                  borderRadius:
                    seriesConfig.type === 'column' || seriesConfig.type === 'histogram'
                      ? '2px'
                      : '4px'
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: '0.8rem', fontWeight: 500 }}
              >
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
            backgroundColor: alpha(theme.palette.background.paper, 0.95),
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            borderRadius: '8px',
            p: 1.5,
            minWidth: 180,
            boxShadow: theme.shadows[4],
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1000
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 600,
              display: 'block',
              mb: 0.75,
              fontSize: '0.75rem'
            }}
          >
            {new Date(hoveredData.time * 1000).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </Typography>
          {Object.entries(hoveredData.prices).map(([key, value]) => {
            const seriesConfig = series.find((s) => s.dataKey === key);
            const formattedValue = seriesConfig?.valueFormatter
              ? seriesConfig.valueFormatter(value)
              : value.toLocaleString();

            return (
              <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    backgroundColor: seriesConfig?.color || theme.palette.primary.main,
                    borderRadius:
                      seriesConfig?.type === 'column' || seriesConfig?.type === 'histogram'
                        ? '2px'
                        : '50%',
                    flexShrink: 0
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem' }}
                  >
                    {seriesConfig?.name || key}:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      ml: 1
                    }}
                  >
                    {formattedValue}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default LightweightChart;
