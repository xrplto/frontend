import axios from 'axios';
import { useState, useEffect } from 'react';
// Material
import {
    useTheme,
    Box,
    Grid,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Typography
} from '@mui/material';

// Chart
import { Chart } from 'src/components/Chart';

// Components
import ChartOptions from './ChartOptions';

// Utils
import { fCurrency5, fNumber } from 'src/utils/formatNumber';
// ----------------------------------------------------------------------
export default function PriceChart({ token }) {
    const BASE_URL = 'https://api.xrpl.to/api';
    const theme = useTheme();
    const [data, setData] = useState([]);
    const [range, setRange] = useState('1D');

    const [minTime, setMinTime] = useState(0);
    const [maxTime, setMaxTime] = useState(0);

    useEffect(() => {
        function getGraph () {
            // https://api.xrpl.to/api/graph/0527842b8550fce65ff44e913a720037?range=1D
            axios.get(`${BASE_URL}/graph/${token.md5}?range=${range}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        const items = ret.history;
                        setData(items);
                        if (items && items.length > 0) {
                            setMinTime(items[0][0]);
                            setMaxTime(items[items.length - 1][0]);
                        }
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

    const CHART_DATA1 = [
        {
            name: 'XRP',
            type: 'area',
            data: data
        }
    ];

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

        series: CHART_DATA1,

        // Grid
        grid: {
            strokeDashArray: 3,
            borderColor: theme.palette.divider
        },
        colors: ['#B72136', '#007B55'],

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
                    return fNumber(val);
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
            foreColor: theme.palette.text.disabled,
            fontFamily: theme.typography.fontFamily,
            brush:{
                target: 'chart2',
                enabled: true,
                autoScaleYaxis: true
            },
            selection: {
                enabled: true,
                fill: {
                    //color: "#00AB55",
                    color: theme.palette.chartFill,
                    opacity: 0.05
                },
                stroke: {
                    width: 1,
                    dashArray: 3,
                    color: theme.palette.divider1,
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

    return (
        <>
            <Grid container rowSpacing={2} alignItems="center" sx={{mt: 0}}>
                <Grid container item xs={12} md={6}>
                    <Typography variant="h3">{`${user} to XRP Chart`}</Typography>
                </Grid>
                {/* <CardHeader title={`${user} to XRP Chart`} subheader='' /> */}

                <Grid container item xs={12} md={6} justifyContent="flex-end" >
                    <ToggleButtonGroup
                        color="primary"
                        value={range}
                        exclusive
                        onChange={handleChange}
                    >
                        <ToggleButton sx={{pt:0,pb:0}} value="1D">1D</ToggleButton>
                        <ToggleButton sx={{pt:0,pb:0}} value="7D">7D</ToggleButton>
                        <ToggleButton sx={{pt:0,pb:0}} value="1M">1M</ToggleButton>
                        <ToggleButton sx={{pt:0,pb:0}} value="3M">3M</ToggleButton>
                        <ToggleButton sx={{pt:0,pb:0}} value="1Y">1Y</ToggleButton>
                        <ToggleButton sx={{pt:0,pb:0}} value="ALL">ALL</ToggleButton>
                    </ToggleButtonGroup>
                </Grid>
            </Grid>
            <Box sx={{ p: 0, pb: 0 }} dir="ltr">
                <Chart series={CHART_DATA1} options={options1} height={364} />
            </Box>
            <Box sx={{ mt: -5, pb: 1 }} dir="ltr">
                <Chart series={CHART_DATA2} options={options2} height={130} />
            </Box>
        </>
    );
}
