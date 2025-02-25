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
  CircularProgress
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

// Context
import { AppContext } from 'src/AppContext';

import { useRouter } from 'next/router';
import { currencySymbols } from 'src/utils/constants';

// import Highcharts from 'highcharts'
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import moment from 'moment';
import { fCurrency5 } from 'src/utils/formatNumber';
// ----------------------------------------------------------------------

const fiatMapping = {
  USD: 'USD',
  EUR: 'EUR',
  JPY: 'JPY',
  CNY: 'CNH',
  XRP: 'XRP'
};

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  [`& .${toggleButtonGroupClasses.grouped}`]: {
    margin: theme.spacing(0.5),
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
      height: '500px',
      events: {
        render: function () {
          const chart = this;
          const imgUrl = darkMode ? '/logo/xrpl-to-logo-white.svg' : '/logo/xrpl-to-logo-black.svg';
          const imgWidth = '50';
          const imgHeight = '15';

          if (chart.watermark) {
            chart.watermark.destroy();
          }

          const xPos = chart.plotWidth - imgWidth - 10; // 10px margin from right edge
          const yPos = chart.plotHeight - imgHeight - 10; // 10px margin from bottom edge

          // Add watermark as an SVG image
          chart.watermark = chart.renderer
            .image(imgUrl, xPos, yPos, imgWidth, imgHeight)
            .attr({
              zIndex: 5, // Ensure it's above other elements
              opacity: 0.6, // Adjust the opacity as needed
              width: '100px'
            })
            .add();
        }
      },
      zoomType: 'x', // Enable horizontal zooming
      marginBottom: 100, // Add margin for volume chart
      animation: {
        duration: 800
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
        dashStyle: 'Dot',
        color: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
      },
      labels: {
        style: {
          color: theme.palette.text.primary,
          fontWeight: 500
        },
        formatter: function () {
          const date = new Date(this.value);
          return moment(date).format('MMM DD');
        }
      },
      lineColor: theme.palette.divider,
      tickColor: theme.palette.divider,
      minPadding: 0.05,
      maxPadding: 0.05
    },
    yAxis: [
      {
        // Main price axis
        title: {
          text: null
        },
        tickAmount: 8,
        tickWidth: 1,
        gridLineColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        labels: {
          style: {
            color: theme.palette.text.primary,
            fontWeight: 500
          },
          formatter: function () {
            return fCurrency5(this.value);
          }
        },
        events: {
          afterSetExtremes: handleAfterSetExtremes
        },
        height: '85%',
        plotLines: [
          {
            width: 1,
            value: mediumValue,
            dashStyle: 'Dot',
            color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
          }
        ],
        crosshair: {
          width: 1,
          dashStyle: 'Dot',
          color: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
        }
      },
      {
        // Volume axis
        title: {
          text: null
        },
        labels: {
          enabled: false
        },
        top: '87%',
        height: '13%',
        offset: 0,
        lineWidth: 0,
        gridLineWidth: 0,
        gridLineColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
      }
    ],
    plotOptions: {
      areaspline: {
        marker: {
          enabled: false,
          symbol: 'circle',
          radius: 2,
          states: {
            hover: {
              enabled: true,
              radius: 4,
              lineWidth: 2,
              lineColor: theme.palette.secondary.main
            }
          }
        },
        lineWidth: 2,
        states: {
          hover: {
            lineWidth: 3,
            brightness: 0.2
          }
        },
        fillOpacity: 0.4,
        zoneAxis: 'y'
      },
      series: {
        states: {
          inactive: {
            opacity: 1
          },
          hover: {
            animation: {
              duration: 300
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
                [0.5, `${theme.palette.error.main}20`],
                [1, `${theme.palette.error.light}10`]
              ]
            }
          },
          {
            color: {
              linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
              stops: [
                [0, theme.palette.primary.light],
                [1, theme.palette.primary.dark]
              ]
            },
            fillColor: {
              linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
              stops: [
                [0, `${theme.palette.primary.main}40`],
                [0.5, `${theme.palette.primary.light}20`],
                [1, `${theme.palette.secondary.main}10`]
              ]
            }
          }
        ]
      },
      column: {
        borderRadius: 1,
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
        lineWidth: 2,
        animation: {
          duration: 1500
        }
      },
      {
        type: 'column',
        name: 'Volume',
        data: data && data.length > 0 ? data.map((point) => [point[0], point[2]]) : [],
        yAxis: 1,
        color: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)'],
            [1, darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)']
          ]
        },
        showInLegend: false
      }
    ],
    tooltip: {
      backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      borderRadius: 12,
      borderWidth: 0,
      shadow: true,
      animation: true,
      style: {
        color: darkMode ? '#FFF' : '#333',
        fontSize: '12px',
        fontFamily: theme.typography.fontFamily,
        filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.2))'
      },
      formatter: function () {
        const points = this.points;
        const pricePoint = points.find((p) => p.series.name === 'Price');
        const volumePoint = points.find((p) => p.series.name === 'Volume');

        if (!pricePoint) {
          return false;
        }

        const prevPoint = pricePoint.series.data[pricePoint.point.index - 1];
        const change = prevPoint ? pricePoint.y - prevPoint.y : 0;
        const changePercent = prevPoint ? (change / prevPoint.y) * 100 : 0;
        const changeColor = change >= 0 ? theme.palette.primary.main : theme.palette.error.main;

        return `<div style="padding: 12px; backdrop-filter: blur(8px);">
          <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px; 
               background: ${
                 darkMode
                   ? 'linear-gradient(45deg, #fff, rgba(255,255,255,0.8))'
                   : 'linear-gradient(45deg, #000, rgba(0,0,0,0.8))'
               };
               -webkit-background-clip: text;
               -webkit-text-fill-color: ${darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)'};">
            ${moment(pricePoint.x).format('MMM DD, YYYY HH:mm')}
          </div>
          <table style="border-spacing: 4px;">
            <tr>
              <td style="opacity: 0.8;">Price:</td>
              <td style="text-align: right; padding-left: 16px; font-weight: 600;">
                ${currencySymbols[activeFiatCurrency]}${fCurrency5(pricePoint.y)}
              </td>
            </tr>
            ${
              volumePoint
                ? `
            <tr>
              <td style="opacity: 0.8;">Volume:</td>
              <td style="text-align: right; padding-left: 16px; font-weight: 600;">
                ${fCurrency5(volumePoint.y)}
              </td>
            </tr>
            `
                : ''
            }
            <tr>
              <td colspan="2" style="padding-top: 8px;">
                <span style="color: ${changeColor}; font-weight: 600; 
                      text-shadow: 0 0 8px ${changeColor}40;">
                  ${change >= 0 ? '▲' : '▼'} ${fCurrency5(
          Math.abs(change)
        )} (${changePercent.toFixed(2)}%)
                </span>
              </td>
            </tr>
          </table>
        </div>`;
      },
      shared: true,
      split: false,
      useHTML: true
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
        upColor: theme.palette.primary.main,
        upLineColor: theme.palette.primary.main,
        lineWidth: 1.5,
        states: {
          hover: {
            lineWidth: 2,
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
      height: '500px',
      events: {
        render: function () {
          const chart = this;
          const imgUrl = darkMode ? '/logo/xrpl-to-logo-white.svg' : '/logo/xrpl-to-logo-black.svg';
          const imgWidth = '50';
          const imgHeight = '15';

          if (chart.watermark) {
            chart.watermark.destroy();
          }

          const xPos = chart.plotWidth - imgWidth - 10; // 10px margin from right edge
          const yPos = chart.plotHeight - imgHeight - 10; // 10px margin from bottom edge

          // Add watermark as an SVG image
          chart.watermark = chart.renderer
            .image(imgUrl, xPos, yPos, imgWidth, imgHeight)
            .attr({
              zIndex: 5, // Ensure it's above other elements
              opacity: 0.6, // Adjust the opacity as needed
              width: '100px'
            })
            .add();
        }
      },
      animation: {
        duration: 800
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
        dashStyle: 'Dot',
        color: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
      },
      labels: {
        style: {
          color: theme.palette.text.primary,
          fontWeight: 500
        },
        formatter: function () {
          const date = new Date(this.value);
          return moment(date).format('MMM DD');
        }
      },
      lineColor: theme.palette.divider,
      tickColor: theme.palette.divider,
      minPadding: 0.05,
      maxPadding: 0.05
    },
    yAxis: {
      crosshair: {
        width: 1,
        dashStyle: 'Dot',
        color: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
      },
      title: {
        text: null
      },
      labels: {
        style: {
          color: theme.palette.text.primary,
          fontWeight: 500
        },
        formatter: function () {
          return fCurrency5(this.value);
        }
      },
      gridLineColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      plotLines: mediumValue
        ? [
            {
              width: 1,
              value: mediumValue,
              dashStyle: 'Dot',
              color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
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
          duration: 1000
        }
      }
    ],
    tooltip: {
      backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      borderRadius: 12,
      borderWidth: 0,
      shadow: true,
      style: {
        color: darkMode ? '#FFF' : '#333',
        fontSize: '12px',
        fontFamily: theme.typography.fontFamily
      },
      formatter: function () {
        const point = this.point;
        const change = point.close - point.open;
        const changePercent = (change / point.open) * 100;
        const changeColor = change >= 0 ? theme.palette.primary.main : theme.palette.error.main;

        return `<div style="padding: 12px; backdrop-filter: blur(8px);">
          <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px; 
               background: ${
                 darkMode
                   ? 'linear-gradient(45deg, #fff, rgba(255,255,255,0.8))'
                   : 'linear-gradient(45deg, #000, rgba(0,0,0,0.8))'
               };
               -webkit-background-clip: text;
               -webkit-text-fill-color: ${darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)'};">
            ${moment(point.x).format('MMM DD, YYYY HH:mm')}
          </div>
          <table style="border-spacing: 4px;">
            <tr><td style="opacity: 0.8;">Open:</td><td style="text-align: right; padding-left: 16px; font-weight: 600;">${
              currencySymbols[activeFiatCurrency]
            }${fCurrency5(point.open)}</td></tr>
            <tr><td style="opacity: 0.8;">High:</td><td style="text-align: right; padding-left: 16px; font-weight: 600;">${
              currencySymbols[activeFiatCurrency]
            }${fCurrency5(point.high)}</td></tr>
            <tr><td style="opacity: 0.8;">Low:</td><td style="text-align: right; padding-left: 16px; font-weight: 600;">${
              currencySymbols[activeFiatCurrency]
            }${fCurrency5(point.low)}</td></tr>
            <tr><td style="opacity: 0.8;">Close:</td><td style="text-align: right; padding-left: 16px; font-weight: 600;">${
              currencySymbols[activeFiatCurrency]
            }${fCurrency5(point.close)}</td></tr>
            <tr><td colspan="2" style="padding-top: 8px;">
              <span style="color: ${changeColor}; font-weight: 600; 
                    text-shadow: 0 0 8px ${changeColor}40;">
                ${change >= 0 ? '▲' : '▼'} ${fCurrency5(Math.abs(change))} (${changePercent.toFixed(
          2
        )}%)
              </span>
            </td></tr>
          </table>
        </div>`;
      },
      useHTML: true
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

  return (
    <>
      <Grid container rowSpacing={1} alignItems="center" sx={{ mt: 0, mb: 1 }}>
        <Grid container item xs={12} md={6}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography
              variant="h4"
              noWrap
            >{`${user} ${name} to ${activeFiatCurrency}(${currencySymbols[activeFiatCurrency]}) Chart`}</Typography>
            {isAdmin && range !== 'OHLC' && (
              <IconButton size="small" onClick={handleDownloadCSV}>
                <DownloadIcon fontSize="small" />
              </IconButton>
            )}
            <Paper
              elevation={0}
              sx={{
                display: 'flex',
                border: (theme) => `1px solid ${theme.palette.divider}`,
                flexWrap: 'wrap'
              }}
            >
              <StyledToggleButtonGroup
                size="small"
                value={chartType}
                exclusive
                onChange={(e, newType) => setChartType(newType)}
                aria-label="text alignment"
              >
                <ToggleButton value={0} sx={{ pt: 0.25, pb: 0.25 }} aria-label="left aligned">
                  <ShowChartIcon />
                </ToggleButton>
                <ToggleButton value={1} sx={{ pt: 0.25, pb: 0.25 }} aria-label="centered">
                  <CandlestickChartIcon />
                </ToggleButton>
              </StyledToggleButtonGroup>
            </Paper>
          </Stack>
        </Grid>
        <Grid container item xs={12} md={6} justifyContent="flex-end">
          <ToggleButtonGroup
            color="primary"
            value={range}
            exclusive
            onChange={handleChange}
            size="small"
          >
            <ToggleButton sx={{ minWidth: '40px', pt: 0, pb: 0 }} value="1D">
              1D
            </ToggleButton>
            <ToggleButton sx={{ minWidth: '40px', pt: 0, pb: 0 }} value="7D">
              7D
            </ToggleButton>
            <ToggleButton sx={{ minWidth: '40px', pt: 0, pb: 0 }} value="1M">
              1M
            </ToggleButton>
            <ToggleButton sx={{ minWidth: '40px', pt: 0, pb: 0 }} value="3M">
              3M
            </ToggleButton>
            <ToggleButton sx={{ minWidth: '40px', pt: 0, pb: 0 }} value="1Y">
              1Y
            </ToggleButton>
            <ToggleButton sx={{ minWidth: '40px', pt: 0, pb: 0 }} value="ALL">
              ALL
            </ToggleButton>
          </ToggleButtonGroup>
        </Grid>
      </Grid>
      {isLoading ? (
        <Box
          sx={{
            height: '500px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: (theme) => `1px dashed ${theme.palette.divider}`,
            borderRadius: 1,
            mt: 2
          }}
        >
          <CircularProgress />
        </Box>
      ) : chartType === 0 ? (
        data && data.length > 0 ? (
          <Stack>
            <HighchartsReact
              highcharts={Highcharts}
              options={options1}
              allowChartUpdate={true}
              constructorType={'chart'}
              key={`line-chart-${range}`}
            />
          </Stack>
        ) : (
          <Box
            sx={{
              height: '500px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: (theme) => `1px dashed ${theme.palette.divider}`,
              borderRadius: 1,
              mt: 2
            }}
          >
            <Typography variant="h6" color="text.secondary">
              No data available for this time range
            </Typography>
          </Box>
        )
      ) : dataOHLC && dataOHLC.length > 0 ? (
        <Stack>
          <HighchartsReact
            highcharts={Highcharts}
            options={options2}
            allowChartUpdate={true}
            constructorType={'chart'}
            key={`candlestick-chart-${range}`}
          />
        </Stack>
      ) : (
        <Box
          sx={{
            height: '500px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: (theme) => `1px dashed ${theme.palette.divider}`,
            borderRadius: 1,
            mt: 2
          }}
        >
          <Typography variant="h6" color="text.secondary">
            No data available for this time range
          </Typography>
        </Box>
      )}
    </>
  );
}

export default PriceChart;
