import axios from 'axios';
import Decimal from 'decimal.js';
import { useState, useEffect, useContext } from 'react';

// Material
import { CardHeader, Stack, Box, Typography, CircularProgress, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Chart
import { Chart } from 'src/components/Chart';

// Context
import { AppContext } from 'src/AppContext';

// Utils
import { fNumber, fPercent } from 'src/utils/formatNumber';

// ----------------------------------------------------------------------
import StackStyle from 'src/components/StackStyle';

function getSeries(richList) {
  let series = [];
  let sum = 0;
  for (var l of richList) {
    const holding = new Decimal(l.holding).toFixed(2, Decimal.ROUND_DOWN);
    const percent = new Decimal(holding).toNumber();
    sum = Decimal.add(sum, holding);
    series.push(percent);
  }
  const otherPercent = Decimal.sub(100, sum).toNumber();
  series.push(otherPercent);

  return series;
}

function getModernColors(darkMode) {
  return darkMode
    ? [
        '#FF6B8A',
        '#FF8F6B',
        '#FFB366',
        '#FFD93D',
        '#BCEB5F',
        '#7ED957',
        '#4ECDC4',
        '#45B7D1',
        '#96CEB4',
        '#FFEAA7',
        '#6C5CE7'
      ]
    : [
        '#FF6B8A',
        '#FF8F6B',
        '#FFB366',
        '#FFD93D',
        '#BCEB5F',
        '#7ED957',
        '#4ECDC4',
        '#45B7D1',
        '#96CEB4',
        '#FFEAA7',
        '#6C5CE7'
      ];
}

export default function Donut({ token }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const { darkMode } = useContext(AppContext);
  const BASE_URL = process.env.API_URL;

  const [richList, setRichList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    async function getTop10RichList() {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(
          `${BASE_URL}/richlist/${token.md5}?start=0&limit=10&freeze=false`
        );

        if (response.status === 200 && response.data) {
          setRichList(response.data.richList);
        } else {
          setError('Failed to load holder data');
        }
      } catch (err) {
        console.error('Error on getting richlist!', err);
        setError('Failed to load holder data');
      } finally {
        setLoading(false);
      }
    }
    getTop10RichList();
  }, [BASE_URL, token.md5]);

  const modernColors = getModernColors(darkMode);
  const chartSize = isMobile ? 180 : isTablet ? 220 : 280;

  const state = {
    series: getSeries(richList),
    options: {
      chart: {
        background: 'transparent',
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 600,
          animateGradually: {
            enabled: true,
            delay: 100
          },
          dynamicAnimation: {
            enabled: true,
            speed: 250
          }
        },
        events: {
          dataPointMouseEnter: function (event, chartContext, opts) {
            setHoveredIndex(opts.dataPointIndex);
          },
          dataPointMouseLeave: function (event, chartContext, opts) {
            setHoveredIndex(null);
          }
        }
      },
      plotOptions: {
        pie: {
          startAngle: -90,
          endAngle: 270,
          donut: {
            size: isMobile ? '65%' : '70%',
            background: 'transparent',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: isMobile ? '10px' : '12px',
                fontWeight: '600',
                color: darkMode ? '#fff' : '#212B36',
                offsetY: isMobile ? -6 : -8,
                formatter: function (val) {
                  return val === 'Others' ? 'Others' : `#${val}`;
                }
              },
              value: {
                show: true,
                fontSize: isMobile ? '14px' : '18px',
                fontWeight: '700',
                color: darkMode ? '#fff' : '#212B36',
                offsetY: isMobile ? 8 : 12,
                formatter: function (val) {
                  return fPercent(val);
                }
              },
              total: {
                show: true,
                showAlways: false,
                label: 'Total',
                fontSize: isMobile ? '9px' : '11px',
                fontWeight: '500',
                color: darkMode ? '#919EAB' : '#637381',
                formatter: function (w) {
                  return token.holders ? fNumber(token.holders) : 'N/A';
                }
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: darkMode ? 'dark' : 'light',
          type: 'radial',
          shadeIntensity: 0.4,
          gradientToColors: modernColors.map((color) => color + '80'),
          inverseColors: false,
          opacityFrom: 0.8,
          opacityTo: 0.6,
          stops: [0, 50, 100]
        },
        colors: modernColors
      },
      stroke: {
        show: true,
        curve: 'smooth',
        lineCap: 'round',
        colors: [darkMode ? '#000' : '#fff'],
        width: 1,
        dashArray: 0
      },
      legend: {
        show: false
      },
      tooltip: {
        enabled: true,
        theme: darkMode ? 'dark' : 'light',
        style: {
          fontSize: '12px',
          fontWeight: '500'
        },
        custom: function ({ series, seriesIndex, w }) {
          const value = series[seriesIndex];
          const color = modernColors[seriesIndex];
          const pos = seriesIndex + 1;
          const label = pos === 11 ? 'Others' : `#${pos}`;
          const isOthers = pos === 11;

          return `
                        <div style="
                            padding: 8px 12px; 
                            background: ${
                              darkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)'
                            }; 
                            border: 1px solid ${
                              darkMode ? 'rgba(145, 158, 171, 0.12)' : 'rgba(145, 158, 171, 0.24)'
                            };
                            border-radius: 6px;
                            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
                            backdrop-filter: blur(20px);
                        ">
                            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                                <div style="
                                    width: 8px; 
                                    height: 8px; 
                                    border-radius: 50%; 
                                    background: ${color};
                                "></div>
                                <span style="
                                    font-weight: 600; 
                                    color: ${darkMode ? '#fff' : '#212B36'};
                                    font-size: 12px;
                                ">${label}</span>
                            </div>
                            <div style="
                                font-weight: 700; 
                                color: ${color}; 
                                font-size: 14px;
                                margin-left: 14px;
                            ">${fPercent(value)}</div>
                            ${
                              !isOthers
                                ? `
                                <div style="
                                    font-size: 10px; 
                                    color: ${darkMode ? '#919EAB' : '#637381'}; 
                                    margin-top: 2px;
                                    margin-left: 14px;
                                ">
                                    ${fNumber(richList[seriesIndex]?.balance || 0)} ${token.name}
                                </div>
                            `
                                : ''
                            }
                        </div>
                    `;
        }
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200,
              height: 200
            }
          }
        },
        {
          breakpoint: 768,
          options: {
            chart: {
              width: 240,
              height: 240
            }
          }
        }
      ]
    }
  };

  if (loading) {
    return (
      <StackStyle>
        <CardHeader title="Top 10 Holders" subheader="" sx={{ p: isMobile ? 1.5 : 2 }} />
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ height: chartSize * 0.8, width: '100%', p: isMobile ? 1.5 : 2 }}
        >
          <CircularProgress
            size={32}
            thickness={4}
            sx={{
              color: 'primary.main',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round'
              }
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, fontWeight: '500' }}>
            Loading...
          </Typography>
        </Stack>
      </StackStyle>
    );
  }

  if (error) {
    return (
      <StackStyle>
        <CardHeader title="Top 10 Holders" subheader="" sx={{ p: isMobile ? 1.5 : 2 }} />
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ height: chartSize * 0.8, width: '100%', p: isMobile ? 1.5 : 2 }}
        >
          <Typography
            variant="body2"
            color="error.main"
            sx={{ fontWeight: '600', textAlign: 'center', fontSize: '14px' }}
          >
            {error}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, textAlign: 'center' }}
          >
            Try refreshing
          </Typography>
        </Stack>
      </StackStyle>
    );
  }

  return (
    <StackStyle>
      <CardHeader title="Top 10 Holders" subheader="" sx={{ p: 2 }} />

      {/* Chart */}
      <Stack alignItems="center" justifyContent="center" sx={{ p: isMobile ? 1.5 : 2 }}>
        <Chart
          options={state.options}
          series={state.series}
          type="donut"
          width={chartSize}
          height={chartSize}
        />
      </Stack>
    </StackStyle>
  );
}
