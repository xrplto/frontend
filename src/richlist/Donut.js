import { useState } from 'react';
import Decimal from 'decimal.js';

// Material
import { withStyles } from '@mui/styles';
import { useTheme } from '@mui/material/styles';
import {
    Avatar,
    Box,
    Button,
    Chip,
    Grid,
    IconButton,
    Link,
    Rating,
    Stack,
    Tooltip,
    Typography
} from '@mui/material';

// Components

// Redux
import { useSelector } from "react-redux";
import { selectMetrics } from "src/redux/statusSlice";

// Utils
import { fNumber } from 'src/utils/formatNumber';

// Chart
import { Chart } from 'src/components/Chart';

// ----------------------------------------------------------------------
function getSeries(richList) {
    let series = [];
    let sum = 0;
    for (var l of richList) {
        const holding = new Decimal(l.holding).toFixed(2, Decimal.ROUND_DOWN);
        const percent = new Decimal(holding).toNumber();
        sum = Decimal.add(sum, holding);
        // series.push({name:l.account, data:[percent]});
        series.push(percent);
    }
    const otherPercent = Decimal.sub(100, sum).toNumber();
    series.push(otherPercent);
    // series.push({name:'Others', data:[otherPercent]});

    return series;
}
export default function Donut({richList}) {
    const theme = useTheme();

    const state = {
        series: getSeries(richList),
        options: {
            plotOptions: {
                pie: {
                    startAngle: -90,
                    endAngle: 270
                }
            },
            dataLabels: {
                enabled: false
            },
            fill: {
                type: 'gradient',
            },
            legend: {
                show: false,
                formatter: function(val, opts) {
                    return val + " - " + opts.w.globals.series[opts.seriesIndex]
                }
            },
            tooltip: {
                enabled: true,
                enabledOnSeries: undefined,
                shared: true,
                followCursor: false,
                intersect: false,
                inverseOrder: false,
                custom: undefined,
                fillSeriesColor: false,
                // theme: true,
                style: {
                    fontSize: '18px',
                    fontFamily: undefined
                },
                y: {
                    // formatter: undefined,
                    formatter: function(value, { series, seriesIndex, dataPointIndex, w }) {
                        const pos = seriesIndex + 1;
                        if (pos === 11)
                            return 'Others - ' + value + '%';
                        return (seriesIndex+1) + ' -  ' + value + ' %';
                    },
                    title: {
                        formatter: function(seriesName) {
                            // return seriesName;
                            return '';
                        },
                    },
                },
                z: {
                    formatter: undefined,
                    title: 'Size: '
                },
                marker: {
                    show: true,
                },
                items: {
                   display: 'flex',
                },
                fixed: {
                    enabled: false,
                    position: 'topRight',
                    offsetX: 0,
                    offsetY: 0,
                },
            },
            title: {
                text: 'Top 10 Holders',
                align: 'center',
                margin: 20,
                style: {
                    fontSize:  '24px',
                    fontWeight:  'bold',
                    fontFamily:  undefined,
                    color:  theme.colors.alpha.black[100]
                },
            },
            responsive: [
                {
                    breakpoint: 380,
                    options: {
                        chart: {
                            width: 200,
                            height: 200
                        },
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            ]
        },
      
      
    };
      
    return (
        <>
            <Chart options={state.options} series={state.series} type="donut" width={400} height={400} />
        </>
    );
}
