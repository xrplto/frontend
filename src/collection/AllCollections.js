import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Stack,
  Typography,
  Box,
  Paper,
  Grid,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Container,
  Button
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import CollectionList from './CollectionList';
import { CollectionListType } from 'src/utils/constants';
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const chartOptions = {
  chart: {
    toolbar: { show: false },
    background: 'transparent'
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'smooth',
    width: 2
  },
  legend: {
    position: 'top',
    horizontalAlign: 'center',
    fontSize: '11px'
  },
  grid: {
    show: true,
    borderColor: '#e0e0e0',
    strokeDashArray: 4
  }
};

// Chart Container Component with updated styling (similar to market-metrics)
const ChartContainer = ({ title, children, showFilter, onFilterChange, filterActive }) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 3, md: 4 },
        mb: { xs: 1.5, sm: 3, md: 4 },
        borderRadius: '24px',
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.background.paper,
          0.95
        )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.06)}, 0 2px 8px ${alpha(
          theme.palette.primary.main,
          0.04
        )}`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 16px 48px ${alpha(theme.palette.common.black, 0.12)}, 0 4px 16px ${alpha(
            theme.palette.primary.main,
            0.1
          )}`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
          opacity: 0.8
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: { xs: 1, sm: 2, md: 3 },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 }
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 600,
            fontSize: { xs: '0.875rem', sm: '1.15rem', md: '1.25rem' },
            letterSpacing: '-0.02em',
            background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(
              theme.palette.primary.main,
              0.8
            )} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          {title}
        </Typography>

        {showFilter && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              onClick={onFilterChange}
              sx={{
                width: { xs: 36, sm: 42 },
                height: { xs: 20, sm: 24 },
                backgroundColor: filterActive
                  ? alpha(theme.palette.primary.main, 0.8)
                  : alpha(theme.palette.text.secondary, 0.2),
                borderRadius: 12,
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                padding: '0 2px',
                border: `1px solid ${alpha(theme.palette.primary.main, filterActive ? 0.3 : 0.1)}`,
                boxShadow: filterActive
                  ? `0 0 12px ${alpha(theme.palette.primary.main, 0.3)}`
                  : 'none'
              }}
            >
              <Box
                sx={{
                  width: { xs: 16, sm: 20 },
                  height: { xs: 16, sm: 20 },
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: '50%',
                  position: 'absolute',
                  left: filterActive ? 'calc(100% - 22px)' : '2px',
                  transition: 'all 0.3s ease',
                  boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.15)}`
                }}
              />
            </Box>
          </Box>
        )}
      </Box>
      {children}
    </Paper>
  );
};

const LatestNFTActivity = ({
  title,
  tooltipText,
  chartData,
  chartType,
  amount24h,
  amount7d,
  amount30d,
  amountAll
}) => {
  const [tab, setTab] = useState('24h');
  const theme = useTheme();

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const series = chartData.datasets.map((d) => ({
    name: d.label,
    data: d.data
  }));

  const options = {
    ...chartOptions,
    chart: {
      ...chartOptions.chart,
      type: chartType,
      height: 300,
      toolbar: { show: false }
    },
    xaxis: {
      categories: chartData.labels,
      labels: {
        style: {
          colors: theme.palette.text.secondary,
          fontSize: '10px'
        },
        rotate: -45,
        rotateAlways: true
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: theme.palette.text.secondary,
          fontSize: '10px'
        },
        formatter: function(value) {
          if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
          } else if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'K';
          }
          return value;
        }
      }
    },
    colors: chartData.datasets.map((d) => d.borderColor),
    legend: {
      ...chartOptions.legend,
      labels: {
        colors: theme.palette.text.primary
      }
    },
    grid: {
      ...chartOptions.grid,
      borderColor: theme.palette.divider
    }
  };

  if (chartType === 'bar') {
    options.plotOptions = {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 8,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'last',
        distributed: false,
        dataLabels: {
          position: 'top'
        }
      }
    };
    options.fill = {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.25,
        inverseColors: false,
        opacityFrom: 0.85,
        opacityTo: 0.55,
        stops: [0, 90, 100]
      },
      colors: chartData.datasets.map((d) => d.borderColor)
    };
    options.stroke = {
      show: true,
      width: 2,
      colors: chartData.datasets.map((d) => d.borderColor)
    };
  } else {
    options.fill = {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'vertical',
        shadeIntensity: 0.3,
        inverseColors: false,
        opacityFrom: 0.8,
        opacityTo: 0.1,
        stops: [0, 70, 100]
      },
      colors: chartData.datasets.map((d) => d.borderColor)
    };
    options.stroke = {
      ...options.stroke,
      curve: 'smooth',
      width: 3
    };
  }

  let displayedAmount = amount24h;
  switch (tab) {
    case '7d':
      displayedAmount = amount7d;
      break;
    case '30d':
      displayedAmount = amount30d;
      break;
    case 'all':
      displayedAmount = amountAll;
      break;
    default:
      displayedAmount = amount24h;
  }

  return (
    <Paper
      sx={{
        padding: { xs: 2, sm: 3 },
        marginBottom: { xs: 2, sm: 3 },
        borderRadius: '20px',
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.background.paper,
          0.95
        )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.06)}, 0 2px 8px ${alpha(
          theme.palette.primary.main,
          0.04
        )}`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
          opacity: 0.8
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            variant="h6"
            sx={{
              mb: 1,
              color: theme.palette.text.primary,
              fontWeight: 600,
              fontSize: { xs: '0.9rem', sm: '1.1rem' },
              letterSpacing: '-0.02em'
            }}
          >
            {title}
          </Typography>
          <Tooltip title={tooltipText}>
            <IconButton
              size="small"
              sx={{
                ml: 1,
                color: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                borderRadius: '12px',
                p: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                  transform: 'scale(1.05)'
                }
              }}
            >
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography
          variant="h6"
          sx={{
            mb: 1,
            color: theme.palette.primary.main,
            fontWeight: 600,
            fontSize: { xs: '0.9rem', sm: '1.1rem' }
          }}
        >
          {displayedAmount}
        </Typography>
      </Box>
      <Tabs
        value={tab}
        onChange={handleTabChange}
        aria-label="chart tabs"
        sx={{
          mb: 2,
          '& .MuiTab-root': {
            borderRadius: '12px',
            color: alpha(theme.palette.text.secondary, 0.8),
            fontSize: { xs: '0.8rem', sm: '0.95rem' },
            fontWeight: 500,
            textTransform: 'none',
            minWidth: { xs: '45px', sm: '60px' },
            px: { xs: 1, sm: 2 },
            py: { xs: 0.5, sm: 1 },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&.Mui-selected': {
              color: theme.palette.primary.main,
              fontWeight: 600,
              background: alpha(theme.palette.primary.main, 0.08)
            },
            '&:hover': {
              background: alpha(theme.palette.primary.main, 0.04)
            }
          },
          '& .MuiTabs-indicator': {
            backgroundColor: theme.palette.primary.main,
            height: '3px',
            borderRadius: '2px'
          }
        }}
      >
        <Tab label="24h" value="24h" />
        <Tab label="7d" value="7d" />
        <Tab label="30d" value="30d" />
        <Tab label="All" value="all" />
      </Tabs>
      <Box sx={{ height: { xs: 250, sm: 300 }, width: '100%', position: 'relative' }}>
        <Chart options={options} series={series} type={chartType} height="100%" width="100%" />
      </Box>
    </Paper>
  );
};

function Collections() {
  const [marketCap, setMarketCap] = useState(null);
  const [salesVolume, setSalesVolume] = useState(null);
  const [totalSales, setTotalSales] = useState(null);

  const theme = useTheme();

  useEffect(() => {
    // Simulating data fetch with filler data
    const fetchData = () => {
      const marketCapData = {
        labels: [
          '08:00 PM',
          '10:00 PM',
          '12:00 AM',
          '02:00 AM',
          '04:00 AM',
          '06:00 AM',
          '08:00 AM'
        ],
        datasets: [
          {
            label: 'Market Cap',
            data: [
              3000000000, 3200000000, 3100000000, 3300000000, 3400000000, 3200000000, 3000000000
            ],
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.4
          }
        ]
      };
      setMarketCap(marketCapData);

      const salesVolumeData = {
        labels: [
          '08:00 PM',
          '10:00 PM',
          '12:00 AM',
          '02:00 AM',
          '04:00 AM',
          '06:00 AM',
          '08:00 AM'
        ],
        datasets: [
          {
            label: 'xrp.cafe',
            data: [200000, 300000, 250000, 200000, 250000, 350000, 300000],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            borderRadius: 4,
            barThickness: 12
          },
          {
            label: 'onxrp',
            data: [100000, 200000, 300000, 200000, 300000, 200000, 400000],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            borderRadius: 4,
            barThickness: 12
          },
          {
            label: 'P2P',
            data: [200000, 200000, 250000, 200000, 150000, 350000, 100000],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            borderRadius: 4,
            barThickness: 12
          }
        ]
      };
      setSalesVolume(salesVolumeData);

      const totalSalesData = {
        labels: [
          '08:00 PM',
          '10:00 PM',
          '12:00 AM',
          '02:00 AM',
          '04:00 AM',
          '06:00 AM',
          '08:00 AM'
        ],
        datasets: [
          {
            label: 'xrp.cafe',
            data: [400, 600, 500, 400, 500, 700, 600],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            borderRadius: 4,
            barThickness: 12
          },
          {
            label: 'onxrp',
            data: [200, 400, 600, 400, 600, 400, 800],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            borderRadius: 4,
            barThickness: 12
          },
          {
            label: 'P2P',
            data: [400, 400, 500, 400, 300, 700, 200],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            borderRadius: 4,
            barThickness: 12
          }
        ]
      };
      setTotalSales(totalSalesData);
    };

    fetchData();
  }, []);

  if (!marketCap || !salesVolume || !totalSales) {
    return <div>Loading...</div>;
  }

  return (
    <Box
      sx={{
        flex: 1,
        py: { xs: 2, sm: 3, md: 4 },
        backgroundColor: 'transparent',
        backgroundImage: `linear-gradient(135deg, ${alpha(
          theme.palette.background.default,
          0.95
        )} 0%, ${alpha(theme.palette.background.default, 0.8)} 100%)`,
        minHeight: '100vh',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 50%, ${alpha(
              theme.palette.primary.main,
              0.05
            )} 0%, transparent 40%), 
            radial-gradient(circle at 80% 20%, ${alpha(
              theme.palette.success.main,
              0.05
            )} 0%, transparent 40%),
            radial-gradient(circle at 50% 80%, ${alpha(
              theme.palette.info.main,
              0.03
            )} 0%, transparent 50%)
          `,
          animation: 'breathe 10s ease-in-out infinite',
          '@keyframes breathe': {
            '0%, 100%': { opacity: 0.8 },
            '50%': { opacity: 1 }
          },
          pointerEvents: 'none'
        }
      }}
    >
      {/* Updated Header Section */}
      <Container maxWidth="xl" sx={{ mt: { xs: 1, sm: 3, md: 4 }, mb: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            textAlign: 'center',
            mb: { xs: 3, sm: 4, md: 5 }
          }}
        >
          <Typography
            variant="h3"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 800,
              fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
              letterSpacing: '-0.03em',
              mb: 2,
              position: 'relative',
              display: 'inline-block',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '80px',
                height: '4px',
                background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
                borderRadius: 2
              }
            }}
          >
            NFT Collections
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: { xs: '0.875rem', sm: '1.1rem', md: '1.2rem' },
              maxWidth: '700px',
              mx: 'auto',
              lineHeight: 1.8,
              mt: 3
            }}
          >
            Explore the top NFT collections on XRPL sorted by trading volume and floor price
          </Typography>
        </Box>
      </Container>

      {/* Statistics Cards Section */}
      <Container maxWidth="xl" sx={{ mb: { xs: 3, sm: 5, md: 6 }, px: { xs: 2, sm: 3 } }}>
        <Grid container spacing={{ xs: 1.5, sm: 3, md: 4 }}>
          {/* Market Cap Card */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 4 },
                height: '100%',
                borderRadius: '20px',
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.05
                )} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`
                }
              }}
            >
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight={600} color="primary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' } }}>
                    Total Market Cap
                  </Typography>
                  <Box
                    sx={{
                      width: { xs: 32, sm: 40 },
                      height: { xs: 32, sm: 40 },
                      borderRadius: '12px',
                      background: alpha(theme.palette.primary.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>📊</Typography>
                  </Box>
                </Box>
                <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}>
                  $3.2B
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  +12.5% from last month
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          {/* Total Volume Card */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 4 },
                height: '100%',
                borderRadius: '20px',
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.success.main,
                  0.05
                )} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.success.main, 0.15)}`
                }
              }}
            >
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight={600} color="success.main" sx={{ fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' } }}>
                    24h Volume
                  </Typography>
                  <Box
                    sx={{
                      width: { xs: 32, sm: 40 },
                      height: { xs: 32, sm: 40 },
                      borderRadius: '12px',
                      background: alpha(theme.palette.success.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>💰</Typography>
                  </Box>
                </Box>
                <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}>
                  850K XRP
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  +8.3% from yesterday
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          {/* Active Collections Card */}
          <Grid item xs={12} sm={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 4 },
                height: '100%',
                borderRadius: '20px',
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.info.main,
                  0.05
                )} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.info.main, 0.15)}`
                }
              }}
            >
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight={600} color="info.main" sx={{ fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' } }}>
                    Active Collections
                  </Typography>
                  <Box
                    sx={{
                      width: { xs: 32, sm: 40 },
                      height: { xs: 32, sm: 40 },
                      borderRadius: '12px',
                      background: alpha(theme.palette.info.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>🎨</Typography>
                  </Box>
                </Box>
                <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}>
                  1,245
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  156 new this week
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Collections List Section */}
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              mb: 1,
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}
          >
            Top Collections by Volume
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            Collections with highest trading volume in the last 30 days
          </Typography>
        </Box>
      </Container>

      <Stack
        sx={{
          minHeight: '50vh',
          px: { xs: 1, sm: 3, md: 4 },
          position: 'relative',
          zIndex: 1,
          animation: 'fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          '@keyframes fadeInUp': {
            '0%': {
              opacity: 0,
              transform: 'translateY(30px)'
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0)'
            }
          }
        }}
      >
        <Box
          sx={{
            borderRadius: '24px',
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.95
            )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.06)}, 0 2px 8px ${alpha(
              theme.palette.primary.main,
              0.04
            )}`,
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
              opacity: 0.8
            }
          }}
        >
          <CollectionList type={CollectionListType.ALL} />
        </Box>
      </Stack>
    </Box>
  );
}

export default React.memo(Collections);
