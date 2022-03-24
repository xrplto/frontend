// material
import { /*alpha,*/ useTheme } from '@mui/material/styles';
//import { GlobalStyles } from '@mui/material';
import { fCurrency5/*, fNumber*/ } from '../../../utils/formatNumber';

// ----------------------------------------------------------------------

export default function ChartOptions() {
  const theme = useTheme();

  const LABEL_TOTAL = {
    show: true,
    label: 'Total',
    color: theme.palette.text.secondary,
    ...theme.typography.subtitle2
  };

  const LABEL_VALUE = {
    offsetY: 8,
    color: theme.palette.text.primary,
    ...theme.typography.h3
  };

  return {
    // Colors
    colors: [
      theme.palette.primary.main,
      theme.palette.chart.yellow[0],
      theme.palette.chart.blue[0],
      theme.palette.chart.violet[0],
      theme.palette.chart.green[0],
      theme.palette.chart.red[0]
    ],

    // Chart
    chart: {
      toolbar: { show: true },
      zoom: { enabled: false },
      animations: { enabled: true },
      foreColor: theme.palette.text.disabled,
      fontFamily: theme.typography.fontFamily
    },

    // States
    states: {
      hover: {
        filter: {
          type: 'lighten',
          value: 0.04
        }
      },
      active: {
        filter: {
          type: 'darken',
          value: 0.88
        }
      }
    },

    // Fill
    fill: {
      type: 'gradient',
      opacity: 1,
      gradient: {
        type: 'vertical',
        shadeIntensity: 0,
        opacityFrom: 0.4,
        opacityTo: 0,
        stops: [0, 100]
      }
    },

    // Datalabels
    dataLabels: { enabled: false },

    // Stroke
    stroke: {
      width: 2,
      curve: 'smooth',
      lineCap: 'round'
    },

    // Grid
    grid: {
      strokeDashArray: 3,
      borderColor: theme.palette.divider
    },

    // Xaxis
    xaxis: {
      type: 'datetime',
      axisBorder: { show: true },
      axisTicks: { show: true }
    },

    yaxis: {
        show: true,
        tickAmount: 6,
        labels: {
            /**
            * Allows users to apply a custom formatter function to yaxis labels.
            *
            * @param { String } value - The generated value of the y-axis tick
            * @param { index } index of the tick / currently executing iteration in yaxis labels array
            */
            formatter: function(val, index) {
                return fCurrency5(val);
            }
        }
    },

    // Markers
    markers: {
      size: 0,
      strokeColors: theme.palette.background.paper
    },

    // Tooltip
    tooltip: {
      shared: true,
      intersect: false,
      theme: 'dark',
      x: {
        show: false,
        format: 'MM/dd/yyyy, h:mm:ss TT',
      },
      y: {
        formatter: (y) => {
          if (typeof y !== 'undefined') {
            return `Price: $${fCurrency5(y)}`;
          }
          return y;
        },
        title: {
          formatter: (seriesName) => {
            return seriesName;
          }
        }
      },
      marker: {
        show: true,
      },
      // custom: function({ series, seriesIndex, dataPointIndex, w }) {
      //   console.log(w);
      //   return (
      //     '<div class="arrow_box">' +
      //     "<span>" +
      //         w.globals.labels[dataPointIndex] +
      //     ": " +
      //         series[seriesIndex][dataPointIndex] +
      //     "</span>" +
      //     "</div>"
      //   );
      // }
    },

    // Legend
    legend: {
      show: true,
      fontSize: 13,
      position: 'top',
      horizontalAlign: 'right',
      markers: {
        radius: 12
      },
      fontWeight: 500,
      itemMargin: { horizontal: 12 },
      labels: {
        colors: theme.palette.text.primary
      }
    },

    // plotOptions
    plotOptions: {
      // Bar
      bar: {
        columnWidth: '11%',
        borderRadius: 4
      },
      // Pie + Donut
      pie: {
        donut: {
          labels: {
            show: true,
            value: LABEL_VALUE,
            total: LABEL_TOTAL
          }
        }
      },
      // Radialbar
      radialBar: {
        track: {
          strokeWidth: '100%',
          background: theme.palette.grey[500_16]
        },
        dataLabels: {
          value: LABEL_VALUE,
          total: LABEL_TOTAL
        }
      },
      // Radar
      radar: {
        polygons: {
          fill: { colors: ['transparent'] },
          strokeColors: theme.palette.divider,
          connectorColors: theme.palette.divider
        }
      },
      // polarArea
      polarArea: {
        rings: {
          strokeColor: theme.palette.divider
        },
        spokes: {
          connectorColors: theme.palette.divider
        }
      }
    },

    // Responsive
    responsive: [
      {
        // sm
        breakpoint: theme.breakpoints.values.sm,
        options: {
          plotOptions: { bar: { columnWidth: '40%' } }
        }
      },
      {
        // md
        breakpoint: theme.breakpoints.values.md,
        options: {
          plotOptions: { bar: { columnWidth: '32%' } }
        }
      }
    ]
  };
}
