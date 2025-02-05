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
  styled
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
      // https://api.xrpl.to/api/graph/0527842b8550fce65ff44e913a720037?range=1D
      axios
        .get(
          `${BASE_URL}/graph-with-metrics/${token.md5}?range=${range}&vs_currency=${fiatMapping[activeFiatCurrency]}${fromSearch}`
        )
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
            const items = ret.history;

            if (items && items.length > 0) {
              setMinTime(items[0][0]);
              setMaxTime(items[items.length - 1][0]);
            }

            setData(items);
          }
        })
        .catch((err) => {
          console.log('Error on getting graph data.', err);
        })
        .then(function () {
          // always executed
        });

      axios
        .get(
          `${BASE_URL}/graph-ohlc-with-metrics/${token.md5}?range=${range}&vs_currency=${fiatMapping[activeFiatCurrency]}${fromSearch}`
        )
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
            const items = ret.history;

            if (items && items.length > 0) {
              setMinTime(items[0][0]);
              setMaxTime(items[items.length - 1][0]);
            }

            setDataOHLC(items);
          }
        })
        .catch((err) => {
          console.log('Error on getting graph data.', err);
        })
        .then(function () {
          // always executed
        });
    }

    getGraph();
  }, [range, activeFiatCurrency, token.md5, BASE_URL, fromSearch]);

  let user = token.user;
  if (!user) user = token.name;
  let name = token.name;

  // let options1 = ChartOptions();

  // Object.assign(options1, {
  //   chart: {
  //     id: 'chart2',
  //     animations: { enabled: false },
  //     foreColor: theme.palette.text.primary,
  //     fontFamily: theme.typography.fontFamily,
  //     redrawOnParentResize: true,
  //     toolbar: {
  //       autoSelected: 'pan',
  //       show: false
  //     },
  //     zoom: {
  //       type: 'y',
  //       enabled: true,
  //       autoScaleYaxis: true
  //     }
  //   },

  //   series: [
  //     {
  //       name: 'XRP',
  //       type: 'area',
  //       data: data
  //     },
  //     {
  //       //name: 'XRP',
  //       type: 'line',
  //       data: data
  //     }
  //   ],
  //   stroke: {
  //     width: [0, 2.5]
  //   },
  //   // Grid
  //   grid: {
  //     strokeDashArray: 3,
  //     borderColor: theme.palette.divider
  //   },
  //   colors: [theme.palette.primary.light], // Set the primary color from the theme

  //   // Fill
  //   fill: {
  //     type: 'gradient',
  //     opacity: 1,
  //     gradient: {
  //       inverseColors: false,
  //       type: 'vertical',
  //       shadeIntensity: 0,
  //       opacityFrom: [0.6, 1],
  //       opacityTo: [0.4, 1],
  //       gradientToColors: ['#B72136', '#B72136'],
  //       stops: [50, 70]
  //     }
  //   },
  //   legend: { show: false },

  //   // X Axis
  //   xaxis: {
  //     type: 'datetime',
  //     axisBorder: { show: true },
  //     axisTicks: { show: false }
  //   },
  //   // Y Axis
  //   yaxis: {
  //     show: true,
  //     tickAmount: 6,
  //     labels: {
  //       formatter: function (val, index) {
  //         return fNumber(val);
  //       }
  //     }
  //   },

  //   // Tooltip
  //   tooltip: {
  //     shared: true,
  //     intersect: false,
  //     theme: 'dark',
  //     style: {
  //       fontSize: '16px',
  //       fontFamily: undefined
  //     },
  //     x: {
  //       show: false,
  //       format: 'MM/dd/yyyy, h:mm:ss TT'
  //     },
  //     y: {
  //       formatter: function (
  //         value,
  //         { series, seriesIndex, dataPointIndex, w }
  //       ) {
  //         return `${activeFiatCurrency} ${fCurrency5(value)}`;
  //       },
  //       title: {
  //         formatter: (seriesName) => {
  //           return '';
  //         }
  //       }
  //     },
  //     marker: {
  //       show: true
  //     },
  //     enabledOnSeries: [0]
  //   }
  // });

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
  console.log('data', data);

  // const options2 = {
  //   chart: {
  //     id: 'chart1',
  //     animations: { enabled: chartControls.animationsEnabled },
  //     foreColor: theme.palette.text.disabled,
  //     fontFamily: theme.typography.fontFamily,
  //     brush: {
  //       target: 'chart2',
  //       enabled: chartControls.brushEnabled,
  //       autoScaleYaxis: chartControls.autoScaleYaxis
  //     },
  //     selection: {
  //       enabled: chartControls.selectionEnabled,
  //       fill: {
  //         color: chartControls.selectionFill,
  //         opacity: 0.05
  //       },
  //       stroke: {
  //         width: 1,
  //         dashArray: 3,
  //         color: chartControls.selectionStroke.color,
  //         opacity: chartControls.selectionStroke.opacity
  //       },
  //       xaxis: {
  //         min: chartControls.selectionXaxis.min,
  //         max: chartControls.selectionXaxis.max
  //       }
  //     }
  //   },

  //   series: [
  //     {
  //       name: '',
  //       type: 'area',
  //       data: data
  //     }
  //   ],

  //   colors: ['#008FFB'],
  //   fill: {
  //     type: 'gradient',
  //     gradient: {
  //       type: 'vertical',
  //       opacityFrom: 0.91,
  //       opacityTo: 0.1
  //     }
  //   },

  //   // Grid
  //   grid: {
  //     show: false,
  //     strokeDashArray: 0,
  //     borderColor: theme.palette.divider,
  //     xaxis: {
  //       lines: {
  //         show: false
  //       }
  //     },
  //     yaxis: {
  //       lines: {
  //         show: false
  //       }
  //     }
  //   },

  //   xaxis: {
  //     type: 'datetime',
  //     tooltip: {
  //       enabled: false
  //     }
  //   },
  //   yaxis: {
  //     show: true,
  //     tickAmount: 2,
  //     labels: {
  //       style: {
  //         colors: ['#008FFB00']
  //       },
  //       formatter: function (val, index) {
  //         return fNumber(val);
  //       }
  //     }
  //   }
  // };

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
      marginBottom: 100 // Add margin for volume chart
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
          color: theme.palette.text.primary
        }
      },
      lineColor: theme.palette.divider,
      tickColor: theme.palette.divider
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
            color: theme.palette.text.primary
          },
          formatter: function () {
            return fCurrency5(this.value);
          }
        },
        events: {
          afterSetExtremes: handleAfterSetExtremes
        },
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
          style: {
            color: theme.palette.text.secondary
          }
        },
        top: '70%',
        height: '30%',
        offset: 0,
        lineWidth: 1,
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
              enabled: true
            }
          }
        },
        lineWidth: 2,
        states: {
          hover: {
            lineWidth: 3
          }
        },
        fillOpacity: 0.2,
        zoneAxis: 'y'
      },
      series: {
        states: {
          inactive: {
            opacity: 1
          }
        },
        zones: [
          {
            value: mediumValue,
            color: '#ff6968',
            fillColor: {
              linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
              stops: [
                [0, 'rgba(255, 105, 104, 0.2)'],
                [1, 'rgba(255, 105, 104, 0)']
              ]
            }
          },
          {
            color: '#94caae',
            fillColor: {
              linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
              stops: [
                [0, 'rgba(148, 202, 174, 0.2)'],
                [1, 'rgba(148, 202, 174, 0)']
              ]
            }
          }
        ]
      }
    },
    series: [
      {
        name: 'Price',
        data: data.map((point) => [point[0], point[1]]),
        threshold: mediumValue
      },
      {
        type: 'column',
        name: 'Volume',
        data: data.map((point) => [point[0], point[2]]),
        yAxis: 1,
        color: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
      }
    ],
    tooltip: {
      backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      borderRadius: 8,
      borderWidth: 0,
      shadow: true,
      style: {
        color: darkMode ? '#FFF' : '#333',
        fontSize: '12px'
      },
      formatter: function () {
        const points = this.points;
        const pricePoint = points.find((p) => p.series.name === 'Price');
        const volumePoint = points.find((p) => p.series.name === 'Volume');
        const prevPoint = pricePoint.series.data[pricePoint.point.index - 1];
        const change = prevPoint ? pricePoint.y - prevPoint.y : 0;
        const changePercent = prevPoint ? (change / prevPoint.y) * 100 : 0;
        const changeColor = change >= 0 ? '#94caae' : '#ff6968';

        return `<div style="padding: 8px;">
          <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">
            ${moment(pricePoint.x).format('MMM DD, YYYY HH:mm')}
          </div>
          <table>
            <tr><td>Price:</td><td style="text-align: right; padding-left: 10px;">${
              currencySymbols[activeFiatCurrency]
            }${fCurrency5(pricePoint.y)}</td></tr>
            <tr><td>Volume:</td><td style="text-align: right; padding-left: 10px;">${fCurrency5(
              volumePoint.y
            )}</td></tr>
            <tr><td colspan="2" style="padding-top: 5px;">
              <span style="color: ${changeColor};">
                ${change >= 0 ? '▲' : '▼'} ${fCurrency5(Math.abs(change))} (${changePercent.toFixed(
          2
        )}%)
              </span>
            </td></tr>
          </table>
        </div>`;
      },
      shared: true,
      split: false,
      useHTML: true
    }
  };

  const options2 = {
    plotOptions: {
      candlestick: {
        color: '#ff6968',
        lineColor: '#ff6968',
        upColor: '#94caae',
        upLineColor: '#94caae',
        lineWidth: 1,
        states: {
          hover: {
            lineWidth: 2
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
          color: theme.palette.text.primary
        }
      },
      lineColor: theme.palette.divider,
      tickColor: theme.palette.divider
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
          color: theme.palette.text.primary
        },
        formatter: function () {
          return fCurrency5(this.value);
        }
      },
      gridLineColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
    },
    series: [
      {
        type: 'candlestick',
        name: `${user} ${name}`,
        data: dataOHLC
      }
    ],
    tooltip: {
      backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      borderRadius: 8,
      borderWidth: 0,
      shadow: true,
      style: {
        color: darkMode ? '#FFF' : '#333',
        fontSize: '12px'
      },
      formatter: function () {
        const point = this.point;
        const change = point.close - point.open;
        const changePercent = (change / point.open) * 100;
        const changeColor = change >= 0 ? '#94caae' : '#ff6968';

        return `<div style="padding: 8px;">
          <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">
            ${moment(point.x).format('MMM DD, YYYY HH:mm')}
          </div>
          <table>
            <tr><td>Open:</td><td style="text-align: right; padding-left: 10px;">${
              currencySymbols[activeFiatCurrency]
            }${fCurrency5(point.open)}</td></tr>
            <tr><td>High:</td><td style="text-align: right; padding-left: 10px;">${
              currencySymbols[activeFiatCurrency]
            }${fCurrency5(point.high)}</td></tr>
            <tr><td>Low:</td><td style="text-align: right; padding-left: 10px;">${
              currencySymbols[activeFiatCurrency]
            }${fCurrency5(point.low)}</td></tr>
            <tr><td>Close:</td><td style="text-align: right; padding-left: 10px;">${
              currencySymbols[activeFiatCurrency]
            }${fCurrency5(point.close)}</td></tr>
            <tr><td colspan="2" style="padding-top: 5px;">
              <span style="color: ${changeColor};">
                ${change >= 0 ? '▲' : '▼'} ${fCurrency5(Math.abs(change))} (${changePercent.toFixed(
          2
        )}%)
              </span>
            </td></tr>
          </table>
        </div>`;
      },
      useHTML: true
    }
  };

  return (
    <>
      <Grid container rowSpacing={2} alignItems="center" sx={{ mt: 0 }}>
        <Grid container item xs={12} md={6}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h3">{`${user} ${name} to ${activeFiatCurrency}(${currencySymbols[activeFiatCurrency]}) Chart`}</Typography>
            {isAdmin && range !== 'OHLC' && (
              <IconButton onClick={handleDownloadCSV}>
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
          <ToggleButtonGroup color="primary" value={range} exclusive onChange={handleChange}>
            <ToggleButton sx={{ pt: 0, pb: 0 }} value="1D">
              1D
            </ToggleButton>
            <ToggleButton sx={{ pt: 0, pb: 0 }} value="7D">
              7D
            </ToggleButton>
            <ToggleButton sx={{ pt: 0, pb: 0 }} value="1M">
              1M
            </ToggleButton>
            <ToggleButton sx={{ pt: 0, pb: 0 }} value="3M">
              3M
            </ToggleButton>
            <ToggleButton sx={{ pt: 0, pb: 0 }} value="1Y">
              1Y
            </ToggleButton>
            <ToggleButton sx={{ pt: 0, pb: 0 }} value="ALL">
              ALL
            </ToggleButton>
          </ToggleButtonGroup>
        </Grid>
      </Grid>
      <Stack display={!chartType ? 'flex' : 'none'}>
        <HighchartsReact highcharts={Highcharts} options={options1} allowChartUpdate={true} />
      </Stack>
      <Stack display={chartType ? 'flex' : 'none'}>
        <HighchartsReact highcharts={Highcharts} options={options2} allowChartUpdate={true} />
      </Stack>
      {/* <Box sx={{ p: 0, pb: 0 }} dir="ltr">
        <Chart series={options1.series} options={options1} height={364} />
      </Box>
      <Box sx={{ mt: -5, pb: 1 }} dir="ltr">
        <Chart series={options2.series} options={options2} height={130} />
      </Box> */}
    </>
  );
}

export default PriceChart;
