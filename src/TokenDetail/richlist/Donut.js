import { useState } from 'react';
import Decimal from 'decimal.js';

// Material
import { withStyles } from '@mui/styles';
import { alpha, styled, useTheme } from '@mui/material/styles';
import {
    Avatar,
    Box,
    Button,
    CardHeader,
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
const StackStyle = styled(Stack)(({ theme }) => ({
    //boxShadow: theme.customShadows.z0,
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
    //backgroundColor: alpha(theme.palette.background.default, 0.0),
    borderRadius: '13px',
    padding: '0em 0.5em 1.5em 0.5em',
    // backgroundColor: alpha("#919EAB", 0.03),
}));

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
        <StackStyle>
            <CardHeader title={`Top 10 Holders`}  subheader='' sx={{p:2}}/>
            <Stack alignItems='center'>
                <Chart options={state.options} series={state.series} type="donut" width={400} height={400} />
            </Stack>
        </StackStyle>
    );
}
