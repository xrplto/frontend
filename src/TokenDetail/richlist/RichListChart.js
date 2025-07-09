import axios from 'axios';
import { useState, useEffect, useMemo, useCallback, memo } from 'react';

// Material
import {
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
  Grid,
  Paper,
  toggleButtonGroupClasses,
  styled,
  Fade,
  Chip,
  Tooltip,
  useMediaQuery
} from '@mui/material';
import { alpha, keyframes } from '@mui/material/styles';

// Highcharts
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import accessibility from 'highcharts/modules/accessibility';

// Initialize the accessibility module
if (typeof Highcharts === 'object') {
  accessibility(Highcharts);
}

// ----------------------------------------------------------------------

// Move styled components outside to prevent recreation on each render
const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  [`& .${toggleButtonGroupClasses.grouped}`]: {
    margin: theme.spacing(0.25),
    border: 0,
    borderRadius: theme.shape.borderRadius,
    [`&.${toggleButtonGroupClasses.disabled}`]: {
      border: 0
    }
  },
  [`& .${toggleButtonGroupClasses.middleButton},& .${toggleButtonGroupClasses.lastButton}`]: {
    marginLeft: -1,
    borderLeft: '1px solid transparent'
  }
}));

const EnhancedToggleButton = styled(ToggleButton)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  background: theme.palette.mode === 'dark' 
    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.default, 0.9)} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.grey[100], 0.8)} 0%, ${alpha(theme.palette.grey[200], 0.9)} 100%)`,
  color: theme.palette.text.primary,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.3)}, transparent)`,
    transition: 'left 0.6s'
  },
  '&:hover::before': {
    left: '100%'
  },
  '&:hover': {
    transform: 'translateY(-1px) scale(1.02)',
    boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.4)}`,
    filter: 'brightness(1.1)'
  },
  '&.Mui-selected': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.info.main, 0.1)} 100%)`,
    color: theme.palette.primary.main,
    fontWeight: 700,
    boxShadow: `0 0 15px ${alpha(theme.palette.primary.main, 0.3)}`,
    textShadow: theme.palette.mode === 'dark' ? `0 0 10px ${alpha(theme.palette.primary.main, 0.6)}` : 'none',
    '&:hover': {
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.3)} 0%, ${alpha(theme.palette.info.main, 0.15)} 100%)`
    }
  }
}));

const ChartContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: '16px',
  overflow: 'hidden',
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.grey[50], 0.9)} 100%)`,
  backdropFilter: 'blur(24px)',
  boxShadow: theme.palette.mode === 'dark'
    ? `0 0 40px ${alpha(theme.palette.primary.main, 0.15)}, 0 0 80px ${alpha(theme.palette.info.main, 0.1)}`
    : `0 4px 24px ${alpha(theme.palette.grey[400], 0.2)}, 0 0 40px ${alpha(theme.palette.primary.light, 0.1)}`,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: theme.palette.mode === 'dark'
      ? `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.8)}, ${alpha(theme.palette.info.main, 0.6)}, transparent)`
      : `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.6)}, transparent)`
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.divider, 0.4)}, transparent)`
  }
}));

const LoadingSkeleton = styled(Box)(({ theme }) => ({
  background: `linear-gradient(90deg, ${alpha(theme.palette.divider, 0.1)} 25%, ${alpha(
    theme.palette.divider,
    0.2
  )} 50%, ${alpha(theme.palette.divider, 0.1)} 75%)`,
  backgroundSize: '200px 100%',
  animation: `${shimmer} 1.5s infinite linear`,
  borderRadius: theme.shape.borderRadius
}));

const StyledTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .MuiTooltip-tooltip`]: {
    backgroundColor: theme.palette.mode === 'dark' 
      ? alpha(theme.palette.grey[900], 0.95)
      : alpha(theme.palette.background.paper, 0.98),
    color: theme.palette.text.primary,
    boxShadow: theme.palette.mode === 'dark'
      ? `0 0 20px ${alpha(theme.palette.primary.main, 0.2)}`
      : `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
    fontSize: '0.75rem',
    padding: '10px 14px',
    borderRadius: theme.shape.borderRadius * 1.5,
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    backdropFilter: 'blur(10px)',
    maxWidth: 220,
    fontWeight: 500,
    lineHeight: 1.5
  },
  [`& .MuiTooltip-arrow`]: {
    color: theme.palette.mode === 'dark' 
      ? alpha(theme.palette.grey[900], 0.95)
      : alpha(theme.palette.background.paper, 0.98),
    '&::before': {
      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
    }
  }
}));

// Optimize array processing with more efficient loop
const extractGraphData = (items) => {
  const res = [];
  const len = items.length;
  for (let i = 0; i < len; i++) {
    res.push([items[i].time, items[i].length]);
  }
  return res;
};

const RichListChart = memo(({ token }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const BASE_URL = process.env.API_URL;

  const [range, setRange] = useState('7D');
  const [graphData, setGraphData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function getGraph() {
      setIsLoading(true);
      // https://api.xrpl.to/api/graphrich/0413ca7cfc258dfaf698c02fe304e607?range=7D
      axios
        .get(`${BASE_URL}/graphrich/${token.md5}?range=${range}`)
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
            const items = ret.history;
            if (items && items.length > 0) {
              const len = items.length;
              setGraphData(extractGraphData(items));
            } else {
              setGraphData([]);
            }
          }
        })
        .catch((err) => {
          console.log('Error on getting graph data.', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }

    getGraph();
  }, [range, BASE_URL, token.md5]);

  // Memoize callback to prevent recreation
  const handleChange = useCallback((event, newRange) => {
    if (newRange) setRange(newRange);
  }, []);

  // Memoize Highcharts options
  const chartOptions = useMemo(() => ({
    chart: {
      type: 'areaspline',
      backgroundColor: 'transparent',
      height: isMobile ? '240px' : '364px',
      animation: {
        duration: 1200,
        easing: 'easeOutCubic'
      },
      style: {
        fontFamily: theme.typography.fontFamily
      },
      zoomType: 'x',
      marginBottom: isMobile ? 30 : 40,
      plotBorderWidth: 0,
      events: {
        render: function () {
          const chart = this;
          const imgUrl = theme.palette.mode === 'dark'
            ? '/logo/xrpl-to-logo-white.svg'
            : '/logo/xrpl-to-logo-black.svg';
          const imgWidth = '50';
          const imgHeight = '15';

          if (chart.watermark) {
            chart.watermark.destroy();
          }

          const xPos = chart.plotWidth - imgWidth - 10;
          const yPos = chart.plotHeight - imgHeight - 10;

          chart.watermark = chart.renderer
            .image(imgUrl, xPos, yPos, imgWidth, imgHeight)
            .attr({
              zIndex: 5,
              opacity: theme.palette.mode === 'dark' ? 0.4 : 0.2,
              width: '100px'
            })
            .add();
        }
      }
    },
    title: {
      text: null
    },
    credits: {
      enabled: false
    },
    legend: {
      enabled: false
    },
    xAxis: {
      type: 'datetime',
      lineColor: alpha(theme.palette.divider, 0.6),
      tickColor: alpha(theme.palette.divider, 0.6),
      gridLineWidth: 1,
      gridLineColor: alpha(theme.palette.divider, 0.1),
      labels: {
        style: {
          color: theme.palette.text.primary,
          fontWeight: 500,
          fontSize: '10px'
        }
      },
      crosshair: {
        width: 1,
        dashStyle: 'Solid',
        color: alpha(theme.palette.primary.main, 0.6)
      }
    },
    yAxis: {
      title: {
        text: null
      },
      gridLineColor: alpha(theme.palette.divider, 0.1),
      labels: {
        style: {
          color: theme.palette.text.primary,
          fontWeight: 500,
          fontSize: '10px'
        },
        formatter: function() {
          return Highcharts.numberFormat(this.value, 0);
        }
      },
      crosshair: {
        width: 1,
        dashStyle: 'Solid',
        color: alpha(theme.palette.primary.main, 0.6)
      }
    },
    plotOptions: {
      areaspline: {
        marker: {
          enabled: false,
          symbol: 'circle',
          radius: 3,
          states: {
            hover: {
              enabled: true,
              radius: 6,
              lineWidth: 2,
              lineColor: theme.palette.background.paper,
              fillColor: theme.palette.primary.main
            }
          }
        },
        lineWidth: 2.5,
        states: {
          hover: {
            lineWidth: 3.5,
            brightness: 0.1
          }
        },
        fillOpacity: 0.3,
        color: theme.palette.primary.main,
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, alpha(theme.palette.primary.main, 0.4)],
            [0.5, alpha(theme.palette.primary.light, 0.25)],
            [1, alpha(theme.palette.primary.main, 0.15)]
          ]
        }
      }
    },
    series: [{
      name: 'Total Addresses',
      data: graphData,
      threshold: null
    }],
    tooltip: {
      enabled: true,
      backgroundColor: theme.palette.mode === 'dark'
        ? alpha(theme.palette.grey[900], 0.95)
        : alpha(theme.palette.background.paper, 0.95),
      borderColor: alpha(theme.palette.primary.main, 0.3),
      borderRadius: theme.shape.borderRadius * 1.5,
      borderWidth: 1,
      shadow: {
        color: alpha(theme.palette.primary.main, 0.2),
        offsetX: 0,
        offsetY: 4,
        opacity: 0.3,
        width: 8
      },
      style: {
        color: theme.palette.text.primary,
        fontSize: '11px',
        fontWeight: 500
      },
      formatter: function () {
        return `<div style="padding: 8px;">
          <div style="font-weight: 600; color: ${theme.palette.primary.main}; margin-bottom: 4px;">
            ${Highcharts.dateFormat('%b %d, %Y', this.x)}
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: ${theme.palette.primary.main};"></div>
            <span>Addresses: <strong>${Highcharts.numberFormat(this.y, 0)}</strong></span>
          </div>
        </div>`;
      },
      shared: false,
      useHTML: true,
      hideDelay: 100
    },
    responsive: {
      rules: [{
        condition: {
          maxWidth: 500
        },
        chartOptions: {
          yAxis: {
            labels: {
              align: 'right',
              x: -5,
              y: 0
            }
          }
        }
      }]
    }
  }), [graphData, theme, isMobile]);

  // Memoize color and tooltip functions
  const getRangeColor = useCallback((currentRange) => {
    const colors = {
      '7D': theme.palette.success.main,
      '1M': theme.palette.warning.main,
      '3M': theme.palette.info.main,
      ALL: theme.palette.error.main
    };
    return colors[currentRange] || theme.palette.primary.main;
  }, [theme]);

  const getIntervalTooltip = useCallback((currentRange) => {
    const tooltipContent = {
      ALL: {
        title: 'All Time Data',
        description: 'Complete historical address data',
        details: 'Shows the full history of unique addresses holding this token'
      },
      '3M': {
        title: '3 Month View',
        description: 'Quarterly address trends',
        details: 'Displays address growth patterns over the last 90 days'
      },
      '1M': {
        title: '1 Month View',
        description: 'Monthly address activity',
        details: 'Recent 30-day holder distribution changes'
      },
      '7D': {
        title: '7 Day View',
        description: 'Weekly address movements',
        details: 'Short-term holder activity for the past week'
      }
    };
    
    const content = tooltipContent[currentRange];
    if (!content) return 'Address data intervals';
    
    return (
      <Box sx={{ p: 0.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: theme.palette.primary.main }}>
          {content.title}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
          {content.description}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', opacity: 0.8 }}>
          {content.details}
        </Typography>
      </Box>
    );
  }, [theme]);

  return (
    <>
      <Grid container rowSpacing={1} alignItems="center" sx={{ mt: 0, mb: isMobile ? 0.5 : 1.5 }}>
        <Grid container item xs={12} alignItems="center" justifyContent="space-between">
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: isMobile ? 0.5 : 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75
              }}
            >
              <Typography
                variant={isMobile ? 'subtitle1' : 'h6'}
                sx={{
                  fontWeight: 700,
                  fontSize: isMobile ? '0.8rem' : undefined,
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #00ff88 0%, #00ccff 50%, #ffffff 100%)'
                    : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.info.main} 50%, ${theme.palette.primary.dark} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: theme.palette.mode === 'dark' 
                    ? '0px 0px 20px rgba(0,255,136,0.5)'
                    : `0px 0px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                  filter: theme.palette.mode === 'dark'
                    ? 'drop-shadow(0 0 10px rgba(0, 255, 136, 0.6))'
                    : `drop-shadow(0 0 10px ${alpha(theme.palette.primary.main, 0.4)})`,
                  whiteSpace: 'nowrap'
                }}
              >
                {isMobile ? 'Total' : 'Total Addresses'}
              </Typography>

              <Chip
                size="small"
                label={range}
                sx={{
                  bgcolor: alpha(getRangeColor(range), 0.1),
                  color: getRangeColor(range),
                  fontWeight: 600,
                  fontSize: isMobile ? '0.55rem' : '0.7rem',
                  height: isMobile ? '16px' : '20px',
                  '& .MuiChip-label': {
                    px: isMobile ? 0.4 : 0.75
                  }
                }}
                icon={
                  <Box
                    sx={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      bgcolor: getRangeColor(range),
                      boxShadow: `0 0 8px ${alpha(getRangeColor(range), 0.5)}`
                    }}
                  />
                }
              />
            </Box>
          </Box>

          <Box>
            <Paper
              elevation={0}
              sx={{
                display: 'flex',
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.15)} 0%, ${alpha(theme.palette.background.paper, 0.08)} 100%)`,
                backdropFilter: 'blur(24px)',
                flexWrap: 'wrap',
                p: isMobile ? 0.1 : 0.3,
                boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.08)}`
              }}
            >
              <StyledToggleButtonGroup
                color="primary"
                value={range}
                exclusive
                onChange={handleChange}
                size="small"
                sx={{ m: 0 }}
              >
                <StyledTooltip title={getIntervalTooltip('7D')} arrow placement="top" PopperProps={{ style: { zIndex: 9999 } }}>
                  <EnhancedToggleButton
                    sx={{ minWidth: isMobile ? '24px' : '32px', p: isMobile ? 0.15 : 0.5, height: isMobile ? '20px' : '28px', borderRadius: 1 }}
                    value="7D"
                  >
                    <Typography variant="caption" fontWeight={600} fontSize={isMobile ? '0.55rem' : '0.7rem'}>
                      7D
                    </Typography>
                  </EnhancedToggleButton>
                </StyledTooltip>
                <StyledTooltip title={getIntervalTooltip('1M')} arrow placement="top" PopperProps={{ style: { zIndex: 9999 } }}>
                  <EnhancedToggleButton
                    sx={{ minWidth: isMobile ? '24px' : '32px', p: isMobile ? 0.15 : 0.5, height: isMobile ? '20px' : '28px', borderRadius: 1 }}
                    value="1M"
                  >
                    <Typography variant="caption" fontWeight={600} fontSize={isMobile ? '0.55rem' : '0.7rem'}>
                      1M
                    </Typography>
                  </EnhancedToggleButton>
                </StyledTooltip>
                <StyledTooltip title={getIntervalTooltip('3M')} arrow placement="top" PopperProps={{ style: { zIndex: 9999 } }}>
                  <EnhancedToggleButton
                    sx={{ minWidth: isMobile ? '24px' : '32px', p: isMobile ? 0.15 : 0.5, height: isMobile ? '20px' : '28px', borderRadius: 1 }}
                    value="3M"
                  >
                    <Typography variant="caption" fontWeight={600} fontSize={isMobile ? '0.55rem' : '0.7rem'}>
                      3M
                    </Typography>
                  </EnhancedToggleButton>
                </StyledTooltip>
                <StyledTooltip title={getIntervalTooltip('ALL')} arrow placement="top" PopperProps={{ style: { zIndex: 9999 } }}>
                  <EnhancedToggleButton
                    sx={{ minWidth: isMobile ? '26px' : '34px', p: isMobile ? 0.15 : 0.5, height: isMobile ? '20px' : '28px', borderRadius: 1 }}
                    value="ALL"
                  >
                    <Typography variant="caption" fontWeight={600} fontSize={isMobile ? '0.55rem' : '0.7rem'}>
                      ALL
                    </Typography>
                  </EnhancedToggleButton>
                </StyledTooltip>
              </StyledToggleButtonGroup>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      <ChartContainer>
        {isLoading ? (
          <Box
            sx={{
              height: isMobile ? '240px' : '364px',
              p: 2
            }}
          >
            <Fade in={isLoading}>
              <Box>
                <LoadingSkeleton sx={{ height: '40px', mb: 1.5 }} />
                <LoadingSkeleton sx={{ height: '240px', mb: 1.5 }} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <LoadingSkeleton sx={{ height: '30px', flex: 1 }} />
                  <LoadingSkeleton sx={{ height: '30px', flex: 1 }} />
                  <LoadingSkeleton sx={{ height: '30px', flex: 1 }} />
                </Box>
              </Box>
            </Fade>
          </Box>
        ) : graphData && graphData.length > 0 ? (
          <Fade in={!isLoading}>
            <Stack>
              <HighchartsReact
                highcharts={Highcharts}
                options={chartOptions}
                allowChartUpdate={true}
                constructorType={'chart'}
                key={`richlist-chart-${range}`}
              />
            </Stack>
          </Fade>
        ) : (
          <Box
            sx={{
              height: isMobile ? '240px' : '364px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5
            }}
          >
            <Box
              sx={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography sx={{ fontSize: '24px', color: theme.palette.warning.main }}>
                📊
              </Typography>
            </Box>
            <Typography variant="subtitle1" color="text.secondary" fontWeight={600}>
              No data available
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              No address data found for the selected time range.
              <br />
              Try selecting a different time period.
            </Typography>
          </Box>
        )}
      </ChartContainer>
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  return prevProps.token.md5 === nextProps.token.md5;
});

RichListChart.displayName = 'RichListChart';

export default RichListChart;
