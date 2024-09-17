// Material
import {
    Stack
} from '@mui/material';

// Chart
import { Chart } from 'src/components/Chart';


// Components
import ChartOptions from './ChartOptions';

// Utils
import { fNumber } from 'src/utils/formatNumber';
import { useMemo } from 'react';
import { median } from 'src/utils/median';

// ----------------------------------------------------------------------

function getChartData(offers, limit = 30) {
    return offers.slice(0, limit).map(o => [o.price, o.sumAmount]);
}

export default function BidAskChart({asks, bids}) {
    const chartData = useMemo(() => [
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
    ], [asks, bids]);

    const medianPrice = useMemo(() => median([...asks, ...bids].map(o => o.price)), [asks, bids]);
    const shouldTriggerFormatting = medianPrice < 0.000001;

    const chartOptions = useMemo(() => {
        const options = ChartOptions(chartData);
        
        if (shouldTriggerFormatting) {
            Object.assign(options, {
                xaxis: {
                    ...options.xaxis,
                    labels: {
                        ...options.xaxis.labels,
                        trim: true,
                        offsetX: 3,
                        formatter: fNumber,
                        style: {
                            cssClass: 'apexcharts-xaxis-label-infini',
                        }
                    }
                },
            });
        }
        
        return options;
    }, [chartData, shouldTriggerFormatting]);
    
    return (
        <Chart series={chartData} options={chartOptions} height={256} />
    );
}
