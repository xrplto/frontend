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

// Chart
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

// Components
import ChartOptions2 from './ChartOptions2';

// Utils
import { fCurrency5, fNumber, fPercent } from 'src/utils/formatNumber';

// ----------------------------------------------------------------------

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
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${alpha(
      theme.palette.primary.main,
      0.1
    )}, transparent)`,
    transition: 'left 0.6s'
  },
  '&:hover::before': {
    left: '100%'
  },
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
  },
  '&.Mui-selected': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    color: theme.palette.primary.main,
    fontWeight: 600,
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.15)
    }
  }
}));

const ChartContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  background:
    theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
          theme.palette.background.default,
          0.9
        )} 100%)`
      : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
          '#f8fafc',
          0.8
        )} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? `0 8px 32px ${alpha('#000', 0.3)}`
      : `0 8px 32px ${alpha('#000', 0.08)}`,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: `linear-gradient(90deg, transparent, ${alpha(
      theme.palette.primary.main,
      0.3
    )}, transparent)`
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

// Optimize array processing with single loop and more efficient iteration
const extractGraphData = (items) => {
  const res1 = [];
  const res2 = [];
  const res3 = [];
  const res4 = [];
  const len = items.length;
  
  for (let i = 0; i < len; i++) {
    const item = items[i];
    res1.push([item.time, item.top100]);
    res2.push([item.time, item.top50]);
    res3.push([item.time, item.top20]);
    res4.push([item.time, item.top10]);
  }
  
  return { top100: res1, top50: res2, top20: res3, top10: res4 };
};

const TopListChart = memo(({ token }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const BASE_URL = process.env.API_URL;

  const [range, setRange] = useState('7D');
  // Combine multiple states into one to reduce re-renders
  const [graphData, setGraphData] = useState({
    top100: [],
    top50: [],
    top20: [],
    top10: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function getGraph() {
      setIsLoading(true);
      // https://api.xrpl.to/api/graphrich/c9ac9a6c44763c1bd9ccc6e47572fd26?range=ALL
      // https://api.xrpl.to/api/graphrich/84e5efeb89c4eae8f68188982dc290d8?range=ALL
      axios
        .get(`${BASE_URL}/graphrich/${token.md5}?range=${range}`)
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
            const items = ret.history;
            if (items && items.length > 0) {
              const len = items.length;
              // Single state update instead of 4 separate updates
              const data = extractGraphData(items);
              setGraphData(data);
            } else {
              setGraphData({
                top100: [],
                top50: [],
                top20: [],
                top10: []
              });
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

  // Memoize chart data and options
  const CHART_DATA = useMemo(() => [
    {
      name: 'Top 100 Holders',
      type: 'area',
      data: graphData.top100
    },
    {
      name: 'Top 50 Holders',
      type: 'area',
      data: graphData.top50
    },
    {
      name: 'Top 20 Holders',
      type: 'area',
      data: graphData.top20
    },
    {
      name: 'Top 10 Holders',
      type: 'area',
      data: graphData.top10
    }
  ], [graphData]);

  const options = useMemo(() => ChartOptions2(CHART_DATA), [CHART_DATA]);

  // Transform data for Recharts
  const transformedData = useMemo(() => {
    if (!graphData.labels || graphData.labels.length === 0) return [];
    
    return graphData.labels.map((label, index) => {
      const dataPoint = { name: label };
      CHART_DATA.forEach((series) => {
        dataPoint[series.name] = series.data[index] || 0;
      });
      return dataPoint;
    });
  }, [graphData.labels, CHART_DATA]);

  // Memoize helper functions
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
    const intervals = {
      ALL: 'All available data - Complete holder history',
      '3M': 'Last 3 months - Recent holder trends',
      '1M': 'Last month - Monthly holder changes',
      '7D': 'Last week - Weekly holder activity'
    };
    return intervals[currentRange] || 'Holder data intervals';
  }, []);

  const hasData = useMemo(() => 
    graphData.top100.length > 0 ||
    graphData.top50.length > 0 ||
    graphData.top20.length > 0 ||
    graphData.top10.length > 0
  , [graphData]);

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
                  background:
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.6) 100%)'
                      : 'linear-gradient(135deg, #000 0%, rgba(0,0,0,0.9) 50%, rgba(0,0,0,0.7) 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow:
                    theme.palette.mode === 'dark'
                      ? '0px 2px 8px rgba(255,255,255,0.1)'
                      : '0px 2px 8px rgba(0,0,0,0.1)',
                  whiteSpace: 'nowrap'
                }}
              >
                {isMobile ? `Top ${token.name}` : `Top ${token.name} addresses by balance`}
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
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                borderRadius: 1.5,
                background: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(10px)',
                flexWrap: 'wrap',
                p: isMobile ? 0.05 : 0.2,
                boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`
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
                <Tooltip title={getIntervalTooltip('7D')} arrow placement="top">
                  <EnhancedToggleButton
                    sx={{ minWidth: isMobile ? '24px' : '32px', p: isMobile ? 0.15 : 0.5, height: isMobile ? '20px' : '28px', borderRadius: 1 }}
                    value="7D"
                  >
                    <Typography variant="caption" fontWeight={600} fontSize={isMobile ? '0.55rem' : '0.7rem'}>
                      7D
                    </Typography>
                  </EnhancedToggleButton>
                </Tooltip>
                <Tooltip title={getIntervalTooltip('1M')} arrow placement="top">
                  <EnhancedToggleButton
                    sx={{ minWidth: isMobile ? '24px' : '32px', p: isMobile ? 0.15 : 0.5, height: isMobile ? '20px' : '28px', borderRadius: 1 }}
                    value="1M"
                  >
                    <Typography variant="caption" fontWeight={600} fontSize={isMobile ? '0.55rem' : '0.7rem'}>
                      1M
                    </Typography>
                  </EnhancedToggleButton>
                </Tooltip>
                <Tooltip title={getIntervalTooltip('3M')} arrow placement="top">
                  <EnhancedToggleButton
                    sx={{ minWidth: isMobile ? '24px' : '32px', p: isMobile ? 0.15 : 0.5, height: isMobile ? '20px' : '28px', borderRadius: 1 }}
                    value="3M"
                  >
                    <Typography variant="caption" fontWeight={600} fontSize={isMobile ? '0.55rem' : '0.7rem'}>
                      3M
                    </Typography>
                  </EnhancedToggleButton>
                </Tooltip>
                <Tooltip title={getIntervalTooltip('ALL')} arrow placement="top">
                  <EnhancedToggleButton
                    sx={{ minWidth: isMobile ? '26px' : '34px', p: isMobile ? 0.15 : 0.5, height: isMobile ? '20px' : '28px', borderRadius: 1 }}
                    value="ALL"
                  >
                    <Typography variant="caption" fontWeight={600} fontSize={isMobile ? '0.55rem' : '0.7rem'}>
                      ALL
                    </Typography>
                  </EnhancedToggleButton>
                </Tooltip>
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
        ) : hasData ? (
          <Fade in={!isLoading}>
            <Box sx={{ p: 0, pb: 0 }} dir="ltr">
              <ResponsiveContainer width="100%" height={isMobile ? 240 : 364}>
                <AreaChart data={transformedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    {CHART_DATA.map((series, index) => (
                      <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={options.colors[index]} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={options.colors[index]} stopOpacity={0.2}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                    axisLine={{ stroke: theme.palette.divider }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                      return value;
                    }}
                  />
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} opacity={0.3} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8
                    }}
                    formatter={(value) => fPercent(value)}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: '20px',
                      fontSize: '12px'
                    }}
                  />
                  {CHART_DATA.map((series, index) => (
                    <Area
                      key={series.name}
                      type="monotone"
                      dataKey={series.name}
                      stroke={options.colors[index]}
                      fillOpacity={1}
                      fill={`url(#gradient-${index})`}
                      strokeWidth={2}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </Box>
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
                📈
              </Typography>
            </Box>
            <Typography variant="subtitle1" color="text.secondary" fontWeight={600}>
              No data available
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              No holder data found for the selected time range.
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

TopListChart.displayName = 'TopListChart';

export default TopListChart;
