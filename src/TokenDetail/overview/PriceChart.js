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
// ----------------------------------------------------------------------

function convertToOHLC(priceData, interval) {
    var ohlcData = [];
    var currentOHLC = {
        open: null,
        high: null,
        low: null,
        close: null,
        time: null
    };
    var currentTime = null;
  
    for (var i = 0; i < priceData.length; i++) {
        var price = priceData[i];
        const priceTime = price[0];
        const priceValue = price[1];
    
        if (currentTime === null || Math.floor(priceTime / (interval * 60 * 1000)) > Math.floor(currentTime / (interval * 60 * 1000))) {
            if (currentTime !== null) {
                const x = currentOHLC.time;
                const y = [currentOHLC.open, currentOHLC.high, currentOHLC.low, currentOHLC.close];
                // ohlcData.push(currentOHLC);
                ohlcData.push([x, y]);
            }
    
            currentOHLC = {
                open: priceValue,
                high: priceValue,
                low: priceValue,
                close: priceValue,
                time: priceTime
            };
            currentTime = priceTime;
        } else {
            if (currentOHLC.high < priceValue) {
                currentOHLC.high = priceValue;
            }
            if (currentOHLC.low > priceValue) {
                currentOHLC.low = priceValue;
            }
            currentOHLC.close = priceValue;
        }
    }
  
    // Push the last OHLC object to the result array
    ohlcData.push(currentOHLC);

    return ohlcData;
}

export default function PriceChart({ token }) {
    const BASE_URL = 'https://api.xrpl.to/api';
    const theme = useTheme();

    const [candleStick, setCandleStick] = useState(true);

    const [data, setData] = useState([]);
    const [candleStickData, setCandleStickData] = useState([]);
    const [range, setRange] = useState('1D');

    const [minTime, setMinTime] = useState(0);
    const [maxTime, setMaxTime] = useState(0);

    const { accountProfile } = useContext(AppContext);
    const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;

    useEffect(() => {
        function getGraph () {
            // https://api.xrpl.to/api/graph/0527842b8550fce65ff44e913a720037?range=1D
            axios.get(`${BASE_URL}/graph/${token.md5}?range=${range}&candlestick=${candleStick}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        const items = ret.history;

                        if (items && items.length > 0) {
                            setMinTime(items[0][0]);
                            setMaxTime(items[items.length - 1][0]);
                        }

                        setData(items);
                        setCandleStickData(convertToOHLC(items, 5));
                    }
                }).catch(err => {
                    console.log("Error on getting graph data.", err);
                }).then(function () {
                    // always executed
                });
        }

        getGraph();

    }, [range, candleStick]);    

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

        // Tooltip
        tooltip: {
            shared: true,
            intersect: false,
            theme: 'dark',
            style: {
                fontSize: '16px',
                fontFamily: undefined
            },
            // custom: function({series, seriesIndex, dataPointIndex, w}) {
            //     var data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
                
            //     return '<ul>' +
            //     '<li><b>Price</b>: ' + data[0] + '</li>' +
            //     '<li><b>Number</b>: ' + data[1] + '</li>' +
            //     '<li><b>Number</b>: ' + data[2] + '</li>' +
            //     '</ul>';
            // },
            x: {
                show: false,
                format: 'MM/dd/yyyy, h:mm:ss TT',
            },
            y: {
                formatter: function(value, { series, seriesIndex, dataPointIndex, w }) {
                    return `${fCurrency5(value)} XRP`;
                },
                title: {
                    formatter: (seriesName) => {
                        // return seriesName;
                        return '';
                    }
                }
            },
            z: {
                formatter: (z) => {
                    if (typeof z !== 'undefined') {
                        return `$ ${fCurrency5(z)}`;
                    }
                    return z;
                },
                title: ''
            },
            marker: {
                show: true,
            },
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
                style: {
                    colors: ['#008FFB00'],
                },
                /**
                * Allows users to apply a custom formatter function to yaxis labels.
                *
                * @param { String } value - The generated value of the y-axis tick
                * @param { index } index of the tick / currently executing iteration in yaxis labels array
                */
                formatter: function(val, index) {
                    return fNumber(val);
                    // return '   ';
                }
            }
        }
    };

    const CHART_DATA_CANDLESTICK1 = [
        {
            name: '',
            type: 'candlestick',
            data: candleStickData
        }
    ];

    var optionsCandleStick1 = {
        series: [{
            data: candleStickData
        }],
        chart: {
            type: 'candlestick',
            height: 364,
            id: 'candles',
            toolbar: {
                autoSelected: 'pan',
                show: false
            },
            zoom: {
                enabled: false
            },
        },
        plotOptions: {
            candlestick: {
            colors: {
                upward: '#3C90EB',
                downward: '#DF7D46'
            }
            }
        },
        xaxis: {
            type: 'datetime'
        }
    };

    const CHART_DATA_CANDLESTICK2 = [
        {
            name: '',
            type: 'bar',
            data: candleStickData
        }
    ];
    
    var optionsCandleStick2 = {
        series: [{
            name: 'volume',
            type: 'bar',
            data: candleStickData
        }],
        chart: {
            height: 130,
            type: 'bar',
            brush: {
                enabled: true,
                target: 'candles'
            },
            selection: {
                enabled: true,
                xaxis: {
                    min: minTime,
                    max: maxTime
                },
                fill: {
                    color: '#ccc',
                    opacity: 0.4
                },
                stroke: {
                    color: '#0D47A1',
                }
            },
        },
        dataLabels: {
            enabled: false
        },
        plotOptions: {
            bar: {
            columnWidth: '80%',
            colors: {
                ranges: [{
                    from: -1000,
                    to: 0,
                    color: '#F15B46'
                }, {
                    from: 1,
                    to: 10000,
                    color: '#FEB019'
                }],
        
            },
            }
        },
        stroke: {
            width: 0
        },
        xaxis: {
            type: 'datetime',
            axisBorder: {
                offsetX: 13
            }
        },
        yaxis: {
            labels: {
                show: false
            }
        }
    };

    const handleChange = (event, newRange) => {
        if (newRange)
            setRange(newRange);
    };

    const handleDownloadCSV = (event) => {
        // data
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

    const handleChangeCandleStick = (event) => {
        setCandleStick(event.target.checked);
    };

    return (
        <>
            <Grid container rowSpacing={2} alignItems="center" sx={{mt: 0}}>
                <Grid container item xs={12} md={6}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="h3">{`${user} to XRP Chart`}</Typography>
                        {isAdmin &&
                            <IconButton onClick={handleDownloadCSV}>
                                <DownloadIcon fontSize="small" />
                            </IconButton>
                        }
                        <FormControl component="fieldset" variant="standard">
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Switch checked={candleStick} onChange={handleChangeCandleStick} name="candlestick" />
                                    }
                                    label="CandleStick"
                                />
                            </FormGroup>
                        </FormControl>
                    </Stack>
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
                {candleStick?
                    <Chart series={CHART_DATA_CANDLESTICK1} options={optionsCandleStick1} height={364} />
                    :
                    <Chart series={CHART_DATA1} options={options1} height={364} />
                }
                
            </Box>
            <Box sx={{ mt: -5, pb: 1 }} dir="ltr">
                {candleStick?
                    <Chart series={CHART_DATA_CANDLESTICK2} options={optionsCandleStick2} height={130} />
                    :
                    <Chart series={CHART_DATA2} options={options2} height={130} />
                }
            </Box>
        </>
    );
}
