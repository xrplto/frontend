import axios from 'axios';
import Decimal from 'decimal.js';
import { useState, useEffect } from 'react';

// Material
import {
    styled,
    CardHeader,
    Stack
} from '@mui/material';

// Chart
import { Chart } from 'src/components/Chart';

// ----------------------------------------------------------------------
import StackStyle from 'src/components/StackStyle';

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
export default function Donut({token}) {
    const BASE_URL = process.env.API_URL;
    const [richList, setRichList] = useState([]);

    useEffect(() => {
        function getTop10RichList() {
            // https://api.xrpl.to/api/richlist/0413ca7cfc258dfaf698c02fe304e607?start=0&limit=10&freeze=false
            axios.get(`${BASE_URL}/richlist/${token.md5}?start=0&limit=10&freeze=false`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        setRichList(ret.richList);
                    }
                }).catch(err => {
                    console.log("Error on getting richlist!", err);
                }).then(function () {
                    // always executed
                });
        }
        getTop10RichList();
    }, []);

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
