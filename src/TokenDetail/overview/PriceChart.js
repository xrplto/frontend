import axios from 'axios';
import { useState, useEffect, useContext } from 'react';
import csvDownload from 'json-to-csv-export';
import createMedianFilter from 'moving-median';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import CandlestickChartIcon from '@mui/icons-material/CandlestickChart';

// Material
import {
  useTheme,
  Grid,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Paper,
  toggleButtonGroupClasses,
  styled,
  Box,
  CircularProgress,
  Skeleton,
  Fade,
  Chip,
  Tooltip
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { alpha, keyframes } from '@mui/material/styles';

// Context
import { AppContext } from 'src/AppContext';

import { useRouter } from 'next/router';
import { currencySymbols } from 'src/utils/constants';

// import Highcharts from 'highcharts'
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { format } from 'date-fns';
import { fCurrency5 } from 'src/utils/formatNumber';
// ----------------------------------------------------------------------

const fiatMapping = {
  USD: 'USD',
  EUR: 'EUR',
  JPY: 'JPY',
  CNY: 'CNH',
  XRP: 'XRP'
};

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
  borderRadius: theme.shape.borderRadius * 2,
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

function PriceChart({ token }) {
  const BASE_URL = process.env.API_URL;
  const theme = useTheme();

  const [data, setData] = useState([]);
  const [dataOHLC, setDataOHLC] = useState([]);
  const [chartType, setChartType] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState('1D');

  const [minTime, setMinTime] = useState(0);
  const [maxTime, setMaxTime] = useState(0);

  const [mediumValue, setMediumValue] = useState(null);

  const { accountProfile, activeFiatCurrency, darkMode } = useContext(AppContext);
  const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;

  const router = useRouter();
  const fromSearch = router.query.fromSearch ? '&fromSearch=1' : '';

  const [chartControls, setChartControls] = useState({
    animationsEnabled: false,
    brushEnabled: true,
    autoScaleYaxis: true,
    selectionEnabled: true,
    selectionFill: theme.palette.chartFill,
    selectionStroke: {
      width: 1,
      dashArray: 3,
      color: theme.palette.divider1,
      opacity: 0.8
    },
    selectionXaxis: {
      min: minTime || 0,
      max: maxTime || 0
    }
  });

  useEffect(() => {
    function getGraph() {
      setIsLoading(true);

      Promise.all([
        axios.get(
          `${BASE_URL}/graph-with-metrics/${token.md5}?range=${range}&vs_currency=${fiatMapping[activeFiatCurrency]}${fromSearch}`
        ),
        axios.get(
          `${BASE_URL}/graph-ohlc-with-metrics/${token.md5}?range=${range}&vs_currency=${fiatMapping[activeFiatCurrency]}${fromSearch}`
        )
      ])
        .then(([lineRes, ohlcRes]) => {
          if (lineRes.status === 200) {
            const items = lineRes.data.history;
            if (items && items.length > 0) {
              setMinTime(items[0][0]);
              setMaxTime(items[items.length - 1][0]);
            }
            setData(items || []);
          }

          if (ohlcRes.status === 200) {
            const items = ohlcRes.data.history;
            if (items && items.length > 0) {
              setMinTime(items[0][0]);
              setMaxTime(items[items.length - 1][0]);
            }
            setDataOHLC(items || []);
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
  }, [range, activeFiatCurrency, token.md5, BASE_URL, fromSearch]);

  let user = token.user;
  if (!user) user = token.name;
  let name = token.name;

  useEffect(() => {
    // Update the selectionXaxis when minTime or maxTime change
    setChartControls((prevControls) => ({
      ...prevControls,
      selectionXaxis: {
        min: minTime || 0,
        max: maxTime || 0
      }
    }));
  }, [minTime, maxTime]);

  // Add a useEffect to recalculate mediumValue when chart type changes
  useEffect(() => {
    if (chartType === 0 && data && data.length > 0) {
      // For line chart
      const prices = data.map((point) => point[1]);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      setMediumValue((min + max) / 2);
    } else if (chartType === 1 && dataOHLC && dataOHLC.length > 0) {
      // For candlestick chart
      const closes = dataOHLC.map((point) => point[4]); // Close prices
      const min = Math.min(...closes);
      const max = Math.max(...closes);
      setMediumValue((min + max) / 2);
    }
  }, [chartType, data, dataOHLC]);

  console.log('data', data);

  const handleChange = (event, newRange) => {
    if (newRange) setRange(newRange);
  };

  const handleDownloadCSV = (event) => {
    const median1 = createMedianFilter(2);
    const median2 = createMedianFilter(3);
    const csvData = [];
    for (const p of data) {
      const val = p[1];
      const row = {};

      row.original = val;
      row.median1 = median1(val);
      row.median2 = median2(val);
      row.time = p[0];
      csvData.push(row);
    }

    const dataToConvert = {
      data: csvData,
      filename: 'filter_report',
      delimiter: ',',
      headers: ['Original', 'Median_1', 'Median_2', 'Time']
    };
    csvDownload(dataToConvert);
  };

  const handleAfterSetExtremes = (e) => {
    if (e.dataMin && e.dataMax) {
      setMediumValue((e.dataMin + e.dataMax) / 2);
    }
  };

  const options1 = {
    title: {
      text: null
    },
    chart: {
      backgroundColor: 'transparent',
      type: 'areaspline',
      height: '350px',
      events: {
        render: function () {
          const chart = this;
          const imgUrl = darkMode ? '/logo/xrpl-to-logo-white.svg' : '/logo/xrpl-to-logo-black.svg';
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
              opacity: 0.4,
              width: '100px'
            })
            .add();
        }
      },
      zoomType: 'x',
      marginBottom: 40,
      animation: {
        duration: 1200,
        easing: 'easeOutCubic'
      },
      style: {
        fontFamily: theme.typography.fontFamily
      }
    },
    legend: { enabled: false },
    credits: {
      text: ''
    },
    xAxis: {
      type: 'datetime',
      crosshair: {
        width: 1,
        dashStyle: 'Solid',
        color: alpha(theme.palette.primary.main, 0.6),
        zIndex: 2
      },
      labels: {
        style: {
          color: theme.palette.text.primary,
          fontWeight: 500,
          fontSize: '10px'
        },
        formatter: function () {
          const date = new Date(this.value);
          return range === '1MIN' ? format(date, 'HH:mm') : format(date, 'MMM dd');
        }
      },
      lineColor: alpha(theme.palette.divider, 0.6),
      tickColor: alpha(theme.palette.divider, 0.6),
      minPadding: 0,
      maxPadding: 0,
      gridLineWidth: 1,
      gridLineColor: alpha(theme.palette.divider, 0.1)
    },
    yAxis: [
      {
        title: {
          text: null
        },
        tickAmount: 6,
        tickWidth: 1,
        gridLineColor: alpha(theme.palette.divider, 0.1),
        labels: {
          style: {
            color: theme.palette.text.primary,
            fontWeight: 500,
            fontSize: '10px'
          },
          formatter: function () {
            return fCurrency5(this.value);
          }
        },
        events: {
          afterSetExtremes: handleAfterSetExtremes
        },
        height: '60%',
        plotLines: [
          {
            width: 1,
            value: mediumValue,
            dashStyle: 'Dash',
            color: alpha(theme.palette.warning.main, 0.7),
            zIndex: 1
          }
        ],
        crosshair: {
          width: 1,
          dashStyle: 'Solid',
          color: alpha(theme.palette.primary.main, 0.6),
          zIndex: 2
        }
      },
      {
        title: {
          text: null
        },
        labels: {
          enabled: false
        },
        top: '60%',
        height: '40%',
        offset: 0,
        lineWidth: 0,
        gridLineWidth: 0,
        gridLineColor: alpha(theme.palette.divider, 0.1)
      }
    ],
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
        zoneAxis: 'y'
      },
      series: {
        states: {
          inactive: {
            opacity: 1
          },
          hover: {
            animation: {
              duration: 200
            }
          }
        },
        zones: [
          {
            value: mediumValue,
            color: {
              linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
              stops: [
                [0, theme.palette.error.light],
                [1, theme.palette.error.main]
              ]
            },
            fillColor: {
              linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
              stops: [
                [0, `${theme.palette.error.light}40`],
                [0.5, `${theme.palette.error.main}25`],
                [1, `${theme.palette.error.light}15`]
              ]
            }
          },
          {
            color: {
              linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
              stops: [
                [0, theme.palette.success.light],
                [1, theme.palette.success.main]
              ]
            },
            fillColor: {
              linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
              stops: [
                [0, `${theme.palette.success.main}40`],
                [0.5, `${theme.palette.success.light}25`],
                [1, `${theme.palette.success.main}15`]
              ]
            }
          }
        ]
      },
      column: {
        borderRadius: 2,
        animation: {
          duration: 1000
        }
      }
    },
    series: [
      {
        name: 'Price',
        data: data && data.length > 0 ? data.map((point) => [point[0], point[1]]) : [],
        threshold: mediumValue,
        lineWidth: 2.5,
        animation: {
          duration: 1500,
          easing: 'easeOutCubic'
        }
      },
      {
        type: 'column',
        name: 'Volume',
        data:
          data && data.length > 0
            ? data.map((point, i) => {
                let color;
                if (i > 0) {
                  if (point[1] > data[i - 1][1]) {
                    color = alpha(theme.palette.success.main, 0.6); // Price up
                  } else if (point[1] < data[i - 1][1]) {
                    color = alpha(theme.palette.error.main, 0.6); // Price down
                  } else {
                    color = alpha(theme.palette.grey[500], 0.4); // No change
                  }
                } else {
                  color = alpha(theme.palette.grey[500], 0.4); // First bar
                }
                return {
                  x: point[0],
                  y: point[2],
                  color
                };
              })
            : [],
        yAxis: 1,
        showInLegend: false,
        borderWidth: 0
      }
    ],
    tooltip: {
      enabled: true,
      backgroundColor: darkMode
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
        const formatString = range === '1MIN' ? 'MMM dd, yyyy HH:mm:ss' : 'MMM dd, yyyy HH:mm';
        return `<div style="padding: 8px;">
            <div style="font-weight: 600; color: ${
              theme.palette.primary.main
            }; margin-bottom: 4px;">
              ${format(this.x, formatString)}
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: ${
                theme.palette.success.main
              };"></div>
              <span>Price: <strong>${fCurrency5(this.y)}</strong></span>
            </div>
          </div>`;
      },
      shared: false,
      useHTML: true,
      hideDelay: 100
    },
    responsive: {
      rules: [
        {
          condition: {
            maxWidth: 500
          },
          chartOptions: {
            yAxis: [
              {
                labels: {
                  align: 'right',
                  x: -5,
                  y: 0
                }
              }
            ]
          }
        }
      ]
    }
  };

  const options2 = {
    plotOptions: {
      candlestick: {
        color: theme.palette.error.main,
        lineColor: theme.palette.error.main,
        upColor: theme.palette.success.main,
        upLineColor: theme.palette.success.main,
        lineWidth: 1.5,
        states: {
          hover: {
            lineWidth: 2.5,
            brightness: 0.1
          }
        }
      }
    },
    rangeSelector: {
      enabled: false
    },
    title: {
      text: null
    },
    chart: {
      backgroundColor: 'transparent',
      height: '350px',
      events: {
        render: function () {
          const chart = this;
          const imgUrl = darkMode ? '/logo/xrpl-to-logo-white.svg' : '/logo/xrpl-to-logo-black.svg';
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
              opacity: 0.4,
              width: '100px'
            })
            .add();
        }
      },
      animation: {
        duration: 1200,
        easing: 'easeOutCubic'
      },
      style: {
        fontFamily: theme.typography.fontFamily
      }
    },
    legend: { enabled: false },
    credits: {
      enabled: false
    },
    xAxis: {
      type: 'datetime',
      crosshair: {
        width: 1,
        dashStyle: 'Solid',
        color: alpha(theme.palette.primary.main, 0.6)
      },
      labels: {
        style: {
          color: theme.palette.text.primary,
          fontWeight: 500,
          fontSize: '10px'
        },
        formatter: function () {
          const date = new Date(this.value);
          return range === '1MIN' ? format(date, 'HH:mm') : format(date, 'MMM dd');
        }
      },
      lineColor: alpha(theme.palette.divider, 0.6),
      tickColor: alpha(theme.palette.divider, 0.6),
      minPadding: 0,
      maxPadding: 0,
      gridLineWidth: 1,
      gridLineColor: alpha(theme.palette.divider, 0.1)
    },
    yAxis: {
      crosshair: {
        width: 1,
        dashStyle: 'Solid',
        color: alpha(theme.palette.primary.main, 0.6)
      },
      title: {
        text: null
      },
      labels: {
        style: {
          color: theme.palette.text.primary,
          fontWeight: 500,
          fontSize: '10px'
        },
        formatter: function () {
          return fCurrency5(this.value);
        }
      },
      gridLineColor: alpha(theme.palette.divider, 0.1),
      plotLines: mediumValue
        ? [
            {
              width: 1,
              value: mediumValue,
              dashStyle: 'Dash',
              color: alpha(theme.palette.warning.main, 0.7)
            }
          ]
        : []
    },
    series: [
      {
        type: 'candlestick',
        name: `${user} ${name}`,
        data: dataOHLC,
        animation: {
          duration: 1200,
          easing: 'easeOutCubic'
        }
      }
    ],
    tooltip: {
      enabled: true,
      backgroundColor: darkMode
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
        const formatString = range === '1MIN' ? 'MMM dd, yyyy HH:mm:ss' : 'MMM dd, yyyy HH:mm';
        return `<div style="padding: 8px;">
            <div style="font-weight: 600; color: ${
              theme.palette.primary.main
            }; margin-bottom: 6px;">
              ${format(this.x, formatString)}
            </div>
            <div style="display: grid; gap: 4px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: ${theme.palette.text.secondary};">Open:</span>
                <strong>${fCurrency5(this.point.open)}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: ${theme.palette.success.main};">High:</span>
                <strong style="color: ${theme.palette.success.main};">${fCurrency5(
                  this.point.high
                )}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: ${theme.palette.error.main};">Low:</span>
                <strong style="color: ${theme.palette.error.main};">${fCurrency5(
                  this.point.low
                )}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: ${theme.palette.text.secondary};">Close:</span>
                <strong>${fCurrency5(this.point.close)}</strong>
              </div>
            </div>
          </div>`;
      },
      useHTML: true,
      hideDelay: 100
    },
    responsive: {
      rules: [
        {
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
        }
      ]
    }
  };

  const getRangeColor = (currentRange) => {
    const colors = {
      '1MIN': theme.palette.info.main,
      '1D': theme.palette.primary.main,
      '7D': theme.palette.success.main,
      '1M': theme.palette.warning.main,
      '3M': theme.palette.info.main,
      '1Y': theme.palette.secondary.main,
      ALL: theme.palette.error.main
    };
    return colors[currentRange] || theme.palette.primary.main;
  };

  const getIntervalTooltip = (currentRange) => {
    const intervals = {
      ALL: '4 Day intervals - Long-term price trends',
      '1Y': '1 Day intervals - Daily price movements over a year',
      '3M': '3 Hour intervals - Intraday trends over 3 months',
      '1M': '1 Hour intervals - Hourly price changes over a month',
      '7D': '20 Minute intervals - Short-term trends over a week',
      '1D': '5 Minute intervals - High-frequency data for one day',
      '1MIN': '1 Minute intervals - Real-time price movements'
    };
    return intervals[currentRange] || 'Price data intervals';
  };

  return (
    <>
      <Grid container rowSpacing={1} alignItems="center" sx={{ mt: 0, mb: 1.5 }}>
        <Grid container item xs={12} alignItems="center" justifyContent="space-between">
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
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
                {`${user} ${name}`}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  whiteSpace: 'nowrap'
                }}
              >
                to
                <Box
                  component="span"
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                    mx: 0.5
                  }}
                >
                  {currencySymbols[activeFiatCurrency]}
                </Box>
                {activeFiatCurrency}
              </Typography>

              <Chip
                size="small"
                label={range}
                sx={{
                  bgcolor: alpha(getRangeColor(range), 0.1),
                  color: getRangeColor(range),
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: '20px',
                  '& .MuiChip-label': {
                    px: 0.75
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

            {isAdmin && range !== 'OHLC' && (
              <IconButton
                size="small"
                onClick={handleDownloadCSV}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  width: '28px',
                  height: '28px',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                  }
                }}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            )}

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
                  p: 0.2,
                  boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`
                }}
              >
                <StyledToggleButtonGroup
                  size="small"
                  value={chartType}
                  exclusive
                  onChange={(e, newType) => setChartType(newType)}
                  aria-label="chart type"
                  sx={{ m: 0 }}
                >
                  <EnhancedToggleButton
                    value={0}
                    sx={{
                      p: 0.5,
                      minWidth: '28px',
                      height: '28px',
                      borderRadius: 1
                    }}
                    aria-label="line chart"
                  >
                    <ShowChartIcon fontSize="small" />
                  </EnhancedToggleButton>
                  <EnhancedToggleButton
                    value={1}
                    sx={{
                      p: 0.5,
                      minWidth: '28px',
                      height: '28px',
                      borderRadius: 1
                    }}
                    aria-label="candlestick chart"
                  >
                    <CandlestickChartIcon fontSize="small" />
                  </EnhancedToggleButton>
                </StyledToggleButtonGroup>
              </Paper>
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
                p: 0.2,
                boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`
              }}
            >
              <ToggleButtonGroup
                color="primary"
                value={range}
                exclusive
                onChange={handleChange}
                size="small"
                sx={{ m: 0 }}
              >
                <Tooltip title={getIntervalTooltip('1MIN')} arrow placement="top">
                  <EnhancedToggleButton
                    sx={{ minWidth: '38px', p: 0.5, height: '28px', borderRadius: 1 }}
                    value="1MIN"
                  >
                    <Typography variant="caption" fontWeight={600} fontSize="0.7rem">
                      1MIN
                    </Typography>
                  </EnhancedToggleButton>
                </Tooltip>
                <Tooltip title={getIntervalTooltip('1D')} arrow placement="top">
                  <EnhancedToggleButton
                    sx={{ minWidth: '32px', p: 0.5, height: '28px', borderRadius: 1 }}
                    value="1D"
                  >
                    <Typography variant="caption" fontWeight={600} fontSize="0.7rem">
                      1D
                    </Typography>
                  </EnhancedToggleButton>
                </Tooltip>
                <Tooltip title={getIntervalTooltip('7D')} arrow placement="top">
                  <EnhancedToggleButton
                    sx={{ minWidth: '32px', p: 0.5, height: '28px', borderRadius: 1 }}
                    value="7D"
                  >
                    <Typography variant="caption" fontWeight={600} fontSize="0.7rem">
                      7D
                    </Typography>
                  </EnhancedToggleButton>
                </Tooltip>
                <Tooltip title={getIntervalTooltip('1M')} arrow placement="top">
                  <EnhancedToggleButton
                    sx={{ minWidth: '32px', p: 0.5, height: '28px', borderRadius: 1 }}
                    value="1M"
                  >
                    <Typography variant="caption" fontWeight={600} fontSize="0.7rem">
                      1M
                    </Typography>
                  </EnhancedToggleButton>
                </Tooltip>
                <Tooltip title={getIntervalTooltip('3M')} arrow placement="top">
                  <EnhancedToggleButton
                    sx={{ minWidth: '32px', p: 0.5, height: '28px', borderRadius: 1 }}
                    value="3M"
                  >
                    <Typography variant="caption" fontWeight={600} fontSize="0.7rem">
                      3M
                    </Typography>
                  </EnhancedToggleButton>
                </Tooltip>
                <Tooltip title={getIntervalTooltip('1Y')} arrow placement="top">
                  <EnhancedToggleButton
                    sx={{ minWidth: '32px', p: 0.5, height: '28px', borderRadius: 1 }}
                    value="1Y"
                  >
                    <Typography variant="caption" fontWeight={600} fontSize="0.7rem">
                      1Y
                    </Typography>
                  </EnhancedToggleButton>
                </Tooltip>
                <Tooltip title={getIntervalTooltip('ALL')} arrow placement="top">
                  <EnhancedToggleButton
                    sx={{ minWidth: '34px', p: 0.5, height: '28px', borderRadius: 1 }}
                    value="ALL"
                  >
                    <Typography variant="caption" fontWeight={600} fontSize="0.7rem">
                      ALL
                    </Typography>
                  </EnhancedToggleButton>
                </Tooltip>
              </ToggleButtonGroup>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      <ChartContainer>
        {isLoading ? (
          <Box
            sx={{
              height: '350px',
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
        ) : chartType === 0 ? (
          data && data.length > 0 ? (
            <Fade in={!isLoading}>
              <Stack>
                <HighchartsReact
                  highcharts={Highcharts}
                  options={options1}
                  allowChartUpdate={true}
                  constructorType={'chart'}
                  key={`line-chart-${range}`}
                />
              </Stack>
            </Fade>
          ) : (
            <Box
              sx={{
                height: '350px',
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
                <ShowChartIcon sx={{ fontSize: '24px', color: theme.palette.warning.main }} />
              </Box>
              <Typography variant="subtitle1" color="text.secondary" fontWeight={600}>
                No data available
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                No price data found for the selected time range.
                <br />
                Try selecting a different time period.
              </Typography>
            </Box>
          )
        ) : dataOHLC && dataOHLC.length > 0 ? (
          <Fade in={!isLoading}>
            <Stack>
              <HighchartsReact
                highcharts={Highcharts}
                options={options2}
                allowChartUpdate={true}
                constructorType={'chart'}
                key={`candlestick-chart-${range}`}
              />
            </Stack>
          </Fade>
        ) : (
          <Box
            sx={{
              height: '350px',
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
              <CandlestickChartIcon sx={{ fontSize: '24px', color: theme.palette.warning.main }} />
            </Box>
            <Typography variant="subtitle1" color="text.secondary" fontWeight={600}>
              No data available
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              No candlestick data found for the selected time range.
              <br />
              Try selecting a different time period.
            </Typography>
          </Box>
        )}
      </ChartContainer>
    </>
  );
}

export default PriceChart;
