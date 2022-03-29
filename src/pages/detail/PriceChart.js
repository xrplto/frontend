import { merge } from 'lodash';
import { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import ApexCharts from 'apexcharts';
// material
import { Box, CardHeader, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
//
import ChartOptions from './ChartOptions';
import { alpha, styled, useTheme } from '@mui/material/styles';
//import { withStyles } from '@mui/styles';
import { fCurrency5 } from '../../utils/formatNumber';
// ----------------------------------------------------------------------

// const CardTransparent = withStyles({
//     root: {
//         backgroundColor: alpha('#B72136', 0.0)
//     }
// }) (Card);

const CustomChart = styled(ReactApexChart)(({ theme }) => ({
    '&.apexcharts-canvas': {
        // Tooltip
        '.apexcharts-xaxistooltip': {
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)', // Fix on Mobile
            backgroundColor: alpha(theme.palette.background.default, 0.2),
            border: 0,
            boxShadow: theme.customShadows.z16,
            color: theme.palette.text.primary,
            borderRadius: theme.shape.borderRadiusSm,
            '&:before': { borderBottomColor: 'transparent' },
            '&:after': { borderBottomColor: alpha(theme.palette.background.default, 0.72) }
        },
        '.apexcharts-tooltip.apexcharts-theme-light': {
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)', // Fix on Mobile
            backgroundColor: alpha(theme.palette.background.default, 0.2),
            border: 0,
            boxShadow: theme.customShadows.z24,
            borderRadius: theme.shape.borderRadiusSm,
            '& .apexcharts-tooltip-title': {
                border: 0,
                textAlign: 'center',
                fontWeight: theme.typography.fontWeightBold,
                backgroundColor: theme.palette.grey[500_16],
                color: theme.palette.text[theme.palette.mode === 'light' ? 'secondary' : 'primary']
            }
        },
        // Legend
        '.apexcharts-legend': {
            padding: 0
        },
        '.apexcharts-legend-series': {
            display: 'flex !important',
            alignItems: 'center'
        },
        '.apexcharts-legend-marker': {
            marginRight: 8
        },
        '.apexcharts-legend-text': {
            lineHeight: '18px',
            textTransform: 'capitalize'
        }
    }
}));

export default function PriceChart({ detail, range, setRange }) {
    const theme = useTheme();
    const data = detail.history;

    let openPrice = 0;
    let minTime = 0;
    let maxTime = 0;

    if (data && data.length > 0) {
        openPrice = data[0][1];
        minTime = data[0][0];
        maxTime = data[data.length - 1][0];
    }

    if (data && data.length > 60) {
        minTime = data[30][0];
        maxTime = data[data.length - 30][0];
    }

    let user = detail.token.user;
    if (!user) user = detail.token.name;

    const CHART_DATA1 = [
        {
            name: '',
            type: 'area',
            data: data
        }
    ];

    const options1 = merge(ChartOptions(), {
        chart: {
            id: 'chart2',
            animations: { enabled: false },
            foreColor: theme.palette.text.disabled,
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

        series:[
            {
                name: '',
                type: 'area',
                data: data
            }
        ],

        // Grid
        grid: {
            strokeDashArray: 3,
            borderColor: theme.palette.divider
        },
        colors: ['#B72136'],
        // colors: [function({ value, seriesIndex, w }) {
        //     console.log("Value:", value);
        //     if (value < openPrice) {
        //         // Bearish
        //         return '#B72136'
        //     } else {
        //         // Bullish
        //         return '#007B55'
        //     }
        // }],

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
            },
        },
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

    });

    const CHART_DATA2 = [
        {
            name: '',
            type: 'area',
            data: data
        }
    ];

    /*selection: {
        enabled: true,
        xaxis: {
          min: _.max(series.map(i => i.data.length)) - 12,
          max: _.max(series.map(i => i.data.length))
        }
    }
    gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.9,
        stops: [0, 100]
    }
    */

    var options2 = {
        chart: {
            id: 'chart1',
            animations: { enabled: false },
            brush:{
                target: 'chart2',
                enabled: true,
                autoScaleYaxis: true
            },
            selection: {
                enabled: true,
                fill: {
                    //color: "#00AB55",
                    color: "#fff",
                    opacity: 0.05
                },
                stroke: {
                    width: 1,
                    dashArray: 3,
                    color: '#fff',
                    opacity: 0.8
                },
                xaxis: {
                    min: minTime,
                    max: maxTime
                },
                // yaxis: {
                //     min: 0.3103,
                //     max: 0.3123,
                // },
            },
        },

        series:[
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
            //min: 0,
            show: true,
            tickAmount: 2,
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
        }
    };

    const handleChange = (event, newRange) => {
        if (newRange)
            setRange(newRange);
    };

    // https://github.com/apexcharts/apexcharts.js/issues/2132
    // https://codesandbox.io/embed/react-brush-example-6ijx5
    // https://www.infragistics.com/products/ignite-ui-react/react/components/charts/types/stock-chart

    return (
        <>
            <Stack direction="row" spacing={2} sx={{mt:4}} alignItems="center">
                <CardHeader title={`${user} to USD Chart`} subheader='' />
                <Box sx={{ flexGrow: 1 }} />
                <ToggleButtonGroup
                    color="primary"
                    value={range}
                    exclusive
                    onChange={handleChange}
                    sx={{pt:2.5,mb:0}}
                >
                    <ToggleButton sx={{pt:0,pb:0}} value="1D">1D</ToggleButton>
                    <ToggleButton sx={{pt:0,pb:0}} value="7D">7D</ToggleButton>
                    <ToggleButton sx={{pt:0,pb:0}} value="1M">1M</ToggleButton>
                    <ToggleButton sx={{pt:0,pb:0}} value="3M">3M</ToggleButton>
                    <ToggleButton sx={{pt:0,pb:0}} value="1Y">1Y</ToggleButton>
                </ToggleButtonGroup>
            </Stack>
            <Box sx={{ p: 0, pb: 0 }} dir="ltr">
                <ReactApexChart series={CHART_DATA1} options={options1} height={364} />
            </Box>
            <Box sx={{ mt: -5, pb: 1 }} dir="ltr">
                <ReactApexChart series={CHART_DATA2} options={options2} height={130} />
            </Box>
        </>
    );
}
