import axios from 'axios';
import Decimal from 'decimal.js';
import { useState, useEffect } from 'react';
import csvDownload from 'json-to-csv-export';
import createMedianFilter from 'moving-median';

// Material
import {
  useTheme,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Chart
import { Chart } from 'src/components/Chart';

// Utils
import { fCurrency5, fNumber } from 'src/utils/formatNumber';

// Components
import ChartOptions from './ChartOptions';

import { useRouter } from 'next/router'
// ----------------------------------------------------------------------

function PriceChart({ token }) {
  const BASE_URL = process.env.API_URL;
  const theme = useTheme();

  const [data, setData] = useState([]);
  const [range, setRange] = useState('1D');

  const [minTime, setMinTime] = useState(0);
  const [maxTime, setMaxTime] = useState(0);

  const { accountProfile } = useContext(AppContext);
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
      opacity: 0.8,
    },
    selectionXaxis: {
      min: minTime || 0,
      max: maxTime || 0,
    },
  });

  useEffect(() => {
    function getGraph() {
      // https://api.xrpl.to/api/graph/0527842b8550fce65ff44e913a720037?range=1D
      axios.get(`${BASE_URL}/graph/${token.md5}?range=${range}${fromSearch}`)
        .then(res => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
            const items = ret.history;

            if (items && items.length > 0) {
              setMinTime(items[0][0]);
              setMaxTime(items[items.length - 1][0]);
            }

            setData(items);
          }
        }).catch(err => {
          console.log("Error on getting graph data.", err);
        }).then(function () {
          // always executed
        });
    }

    getGraph();
  }, [range]);

  let user = token.user;
  if (!user) user = token.name;
  let name = token.name;

  let options1 = ChartOptions();

  Object.assign(options1, {
    chart: {
      id: 'chart2',
      animations: { enabled: false },
      foreColor: theme.palette.text.primary,
      fontFamily: theme.typography.fontFamily,
      redrawOnParentResize: true,
      toolbar: {
        autoSelected: 'pan',
        show: false
      },
      zoom: {
        type: 'y',
        enabled: true,
        autoScaleYaxis: true
      }
    },

    series: [
      {
        name: 'XRP',
        type: 'area',
        data: data
      },
      {
        //name: 'XRP',
        type: 'line',
        data: data
      },
    ],
    stroke: {
      width: [0, 2]
    },
    // Grid
    grid: {
      strokeDashArray: 3,
      borderColor: theme.palette.divider
    },
    //colors: ['#B72136', '#007B55'],
    colors: ['#007B55'],

    // Fill
    fill: {
      type: 'gradient',
      opacity: 1,
      gradient: {
        inverseColors: false,
        type: 'vertical',
        shadeIntensity: 0,
        //opacityFrom: [0.4, 1],
        //opacityTo: [0, 1],
        //opacityFrom: [0.85],
        //opacityTo: [0.55],
        opacityFrom: [0.6, 1],
        opacityTo: [0.4, 1],
        gradientToColors: ['#B72136', '#B72136'],
        stops: [50, 70]
      },
    },
    legend: { show: false },

    // X Axis
    xaxis: {
      type: 'datetime',
      axisBorder: { show: true },
      axisTicks: { show: false }
    },
    // Y Axis
    yaxis: {
      show: true,
      tickAmount: 6,
      labels: {
        formatter: function (val, index) {
          return fNumber(val);
        }
      }
    },

    // Tooltip
    tooltip: {
      shared: true,
      intersect: false,
      theme: 'dark',
      style: {
        fontSize: '16px',
        fontFamily: undefined
      },
      x: {
        show: false,
        format: 'MM/dd/yyyy, h:mm:ss TT',
      },
      y: {
        formatter: function (value, { series, seriesIndex, dataPointIndex, w }) {
          return `$ ${fCurrency5(value)}`;
        },
        title: {
          formatter: (seriesName) => {
            return '';
          }
        }
      },
      marker: {
        show: true,
      },
      enabledOnSeries: [0]
    },

  });

  useEffect(() => {
    // Update the selectionXaxis when minTime or maxTime change
    setChartControls((prevControls) => ({
      ...prevControls,
      selectionXaxis: {
        min: minTime || 0,
        max: maxTime || 0,
      },
    }));
  }, [minTime, maxTime]);

  const options2 = {
    chart: {
      id: 'chart1',
      animations: { enabled: chartControls.animationsEnabled },
      foreColor: theme.palette.text.disabled,
      fontFamily: theme.typography.fontFamily,
      brush: {
        target: 'chart2',
        enabled: chartControls.brushEnabled,
        autoScaleYaxis: chartControls.autoScaleYaxis,
      },
      selection: {
        enabled: chartControls.selectionEnabled,
        fill: {
          color: chartControls.selectionFill,
          opacity: 0.05,
        },
        stroke: {
          width: 1,
          dashArray: 3,
          color: chartControls.selectionStroke.color,
          opacity: chartControls.selectionStroke.opacity,
        },
        xaxis: {
          min: chartControls.selectionXaxis.min,
          max: chartControls.selectionXaxis.max,
        },
      },
    },


    series: [
      {
        name: '',
        type: 'area',
        data: data
      }
    ],

    colors: ['#008FFB'],
    fill: {
      type: 'gradient',
      gradient: {
        type: 'vertical',
        opacityFrom: 0.91,
        opacityTo: 0.1,
      }
    },

    // Grid
    grid: {
      show: false,
      strokeDashArray: 0,
      borderColor: theme.palette.divider,
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: false
        }
      },
    },

    xaxis: {
      type: 'datetime',
      tooltip: {
        enabled: false
      }
    },
    yaxis: {
      show: true,
      tickAmount: 2,
      labels: {
        style: {
          colors: ['#008FFB00'],
        },
        formatter: function (val, index) {
          return fNumber(val);
        }
      }
    }
  };

  const handleChange = (event, newRange) => {
    if (newRange)
      setRange(newRange);
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
      headers: ['Original', "Median_1", "Median_2", "Time"]
    }
    csvDownload(dataToConvert);
  }

  return (
    <>
      <Grid container rowSpacing={2} alignItems="center" sx={{ mt: 0 }}>
        <Grid container item xs={12} md={6}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h3">{`${user} ${name} to USD Chart`}</Typography>
            {isAdmin && range !== 'OHLC' &&
              <IconButton onClick={handleDownloadCSV}>
                <DownloadIcon fontSize="small" />
              </IconButton>
            }
          </Stack>
        </Grid>

        <Grid container item xs={12} md={6} justifyContent="flex-end" >
          <ToggleButtonGroup
            color="primary"
            value={range}
            exclusive
            onChange={handleChange}
          >
            <ToggleButton sx={{ pt: 0, pb: 0 }} value="1D">1D</ToggleButton>
            <ToggleButton sx={{ pt: 0, pb: 0 }} value="7D">7D</ToggleButton>
            <ToggleButton sx={{ pt: 0, pb: 0 }} value="1M">1M</ToggleButton>
            <ToggleButton sx={{ pt: 0, pb: 0 }} value="3M">3M</ToggleButton>
            <ToggleButton sx={{ pt: 0, pb: 0 }} value="1Y">1Y</ToggleButton>
            <ToggleButton sx={{ pt: 0, pb: 0 }} value="ALL">ALL</ToggleButton>
          </ToggleButtonGroup>
        </Grid>
      </Grid>
      <Box sx={{ p: 0, pb: 0 }} dir="ltr">
        <Chart series={options1.series} options={options1} height={364} />
      </Box>
      <Box sx={{ mt: -5, pb: 1 }} dir="ltr">
        <Chart series={options2.series} options={options2} height={130} />
      </Box>
    </>
  );
}

export default PriceChart;
