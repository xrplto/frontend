import { merge } from 'lodash';
import ReactApexChart from 'react-apexcharts';
// material
import { CardHeader, Box } from '@mui/material';
//
import ChartOptions from './ChartOptions';
import { alpha, styled } from '@mui/material/styles';
//import { withStyles } from '@mui/styles';
//import { fCurrency5 } from '../../../utils/formatNumber';
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

/*function getChartData(data) {
    let vals = [];
    let labels = [];
    for (var i in data) {
        const d = data[i];
        let val = fCurrency5(parseFloat(d.v));
        vals.push(val);
        labels.push(d.t);
    }
    return { labels: labels, data: vals };
}*/

export default function PriceChart({ detail }) {
    //const {labels, data} = getChartData(detail.history);
    let user = detail.token.user;
    if (!user) user = detail.token.name;

    const CHART_DATA = [
        {
            name: '',
            type: 'area',
            data: detail.history
        }
    ];
    const chartOptions = merge(ChartOptions(), {
    });

    return (
        <>
            <CardHeader title={`${user} to USD Chart`} subheader="" />
            <Box sx={{ p: 0, pb: 1 }} dir="ltr">
                <CustomChart type="line" series={CHART_DATA} options={chartOptions} height={364} />
            </Box>
        </>
    );
}
