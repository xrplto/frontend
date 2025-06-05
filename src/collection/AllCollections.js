import React, { useState, useEffect } from 'react';
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
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import CollectionList from './CollectionList';
import { CollectionListType } from 'src/utils/constants';
import { withStyles } from '@mui/styles';
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Link from 'next/link';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: {
          size: 14
        },
        color: '#333'
      }
    },
    tooltip: {
      titleFont: { size: 16 },
      bodyFont: { size: 14 }
    }
  },
  scales: {
    x: {
      ticks: {
        font: {
          size: 12
        },
        color: '#666'
      }
    },
    y: {
      ticks: {
        font: {
          size: 12
        },
        color: '#666'
      }
    }
  }
};

const ContentTypography = withStyles((theme) => ({
  root: {
    color: alpha(theme.palette.text.secondary, 0.9),
    display: 'inline',
    verticalAlign: 'middle',
    lineHeight: 1.6,
    fontSize: '1rem',
    fontWeight: 400
  }
}))(Typography);

// Chart Container Component with updated styling (similar to market-metrics)
const ChartContainer = ({ title, children, showFilter, onFilterChange, filterActive }) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        mb: { xs: 2, sm: 3, md: 4 },
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
          mb: { xs: 1.5, sm: 2, md: 3 }
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 600,
            fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' },
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
        padding: 3,
        marginBottom: 3,
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            variant="h6"
            sx={{
              mb: 1,
              color: theme.palette.text.primary,
              fontWeight: 600,
              fontSize: '1.1rem',
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
            fontSize: '1.1rem'
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
            fontSize: '0.95rem',
            fontWeight: 500,
            textTransform: 'none',
            minWidth: '60px',
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
      <Box sx={{ height: 300 }}>
        {chartType === 'line' ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <Bar data={chartData} options={chartOptions} />
        )}
      </Box>
    </Paper>
  );
};

export default function Collections() {
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
          background: `radial-gradient(circle at 20% 50%, ${alpha(
            theme.palette.primary.main,
            0.03
          )} 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${alpha(
            theme.palette.success.main,
            0.03
          )} 0%, transparent 50%)`,
          pointerEvents: 'none'
        }
      }}
    >
      {/* Updated Overview Section - Similar to market-metrics */}
      <Container maxWidth="xl" sx={{ mt: { xs: 2, sm: 3, md: 4 }, mb: { xs: 3, sm: 4, md: 5 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
            mb: 1.5,
            p: 3,
            borderRadius: '20px',
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.9
            )} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
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
              height: '2px',
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
              opacity: 0.8
            }
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h4"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 700,
                fontSize: { xs: '1.6rem', sm: '1.8rem', md: '2.1rem' },
                letterSpacing: '-0.02em',
                background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(
                  theme.palette.primary.main,
                  0.8
                )} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              Highest Price NFT Stats
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
                maxWidth: '600px',
                lineHeight: 1.6
              }}
            >
              Listed below are the stats for NFT collections and individual assets that have sold
              for the highest prices. We list the data in descending order. Data can be reordered by
              clicking on the column title. Only collections with a transaction in the last 30 days
              are included.
            </Typography>
          </Box>
          <Link href="/collections">
            <Button
              variant="contained"
              size="medium"
              sx={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.9
                )} 0%, ${alpha(theme.palette.primary.dark, 0.8)} 100%)`,
                color: theme.palette.primary.contrastText,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`
                },
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                padding: { xs: '8px 16px', sm: '10px 20px' },
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              View All Collections
            </Button>
          </Link>
        </Box>
      </Container>

      <Stack
        sx={{
          mt: 5,
          minHeight: '50vh',
          px: { xs: 2, sm: 3, md: 4 },
          position: 'relative',
          zIndex: 1
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
