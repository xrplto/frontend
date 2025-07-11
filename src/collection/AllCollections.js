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

// Removed unused ApexCharts-dependent components

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
        minHeight: '100vh',
        position: 'relative'
      }}
    >

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
                background: 'transparent',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  borderColor: alpha(theme.palette.primary.main, 0.3)
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
                      background: 'transparent',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
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
                background: 'transparent',
                border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  borderColor: alpha(theme.palette.success.main, 0.3)
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
                      background: 'transparent',
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
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
                background: 'transparent',
                border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  borderColor: alpha(theme.palette.info.main, 0.3)
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
                      background: 'transparent',
                      border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
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
            background: 'transparent',
            backdropFilter: 'none',
            border: 'none',
            boxShadow: 'none',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <CollectionList type={CollectionListType.ALL} />
        </Box>
      </Stack>
    </Box>
  );
}

export default React.memo(Collections);
