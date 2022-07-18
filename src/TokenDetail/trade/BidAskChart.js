// Material
import {
    Stack
} from '@mui/material';

// Chart
import { Chart } from 'src/components/Chart';


// Components
import ChartOptions from './ChartOptions';

// ----------------------------------------------------------------------

function getChartData(offers) {
    let data = [];
    for (var o of offers.slice(0, 30)) {
        data.push([o.price, o.sumAmount]);
    }
    return data;
}

export default function BidAskChart({asks, bids}) {
    const CHART_DATA = [
        {
            name: 'BID',
            type: 'area',
            data: getChartData(bids)
        },
        {
            name: 'ASK',
            type: 'area',
            data: getChartData(asks)
        },
    ];

    const CHART_OPTION = ChartOptions(CHART_DATA);
    
    return (
        <Chart series={CHART_DATA} options={CHART_OPTION} height={256} />
    );
}
