import { merge } from 'lodash';
import ReactApexChart from 'react-apexcharts';
// material
import { CardHeader, Box } from '@mui/material';
//
import BaseOptionChartStyle from './BaseOptionChartStyle';
//import { alpha } from '@mui/material/styles';
//import { withStyles } from '@mui/styles';

// ----------------------------------------------------------------------

// const CHART_DATA = [
//     {
//         name: 'A',
//         type: 'column',
//         data: [23, 11, 22, 27, 13, 22, 37, 21, 44, 22, 30]
//     },
//     {
//         name: 'B',
//         type: 'area',
//         data: [44, 55, 41, 67, 22, 43, 21, 41, 56, 27, 43]
//     },
//     {
//         name: 'C',
//         type: 'line',
//         data: [30, 25, 36, 30, 45, 35, 64, 52, 59, 36, 39]
//     }
// ];

// const CardTransparent = withStyles({
//     root: {
//         backgroundColor: alpha('#B72136', 0.0)
//     }
// }) (Card);
function getChartData(data) {
    let vals = [];
    return data.slice(7300, 8740);
}

export default function PriceChart({detail}) {
    const data = getChartData(detail.history);
    const CHART_DATA = [
        {
            name: 'B',
            type: 'area',
            data
        }
    ];
    const chartOptions = merge(BaseOptionChartStyle(), {
        stroke: { width: [2] },
        plotOptions: { bar: { columnWidth: '11%', borderRadius: 4 } },
        fill: { type: ['gradient'] },
        labels: data,
        xaxis: { type: 'datetime' },
        tooltip: {
            shared: true,
            intersect: false,
            y: {
                formatter: (y) => {
                    if (typeof y !== 'undefined') {
                        return `${y.toFixed(0)} xxx`;
                    }
                    return y;
                }
            }
        }
    });

    return (
        <>
            <CardHeader title="Price charts" subheader="(+43%) than last year" />
            <Box sx={{ p: 0, pb: 1 }} dir="ltr">
                <ReactApexChart type="line" series={CHART_DATA} options={chartOptions} height={364} />
            </Box>
        </>
    );
}
