// Material
import {
    Stack,
    Box,
    useTheme,
    useMediaQuery,
    styled,
    alpha,
    Skeleton
} from '@mui/material';

// Chart
import { Chart } from 'src/components/Chart';


// Components
import ChartOptions from './ChartOptions';

// Utils
import { fNumber } from 'src/utils/formatNumber';

// ----------------------------------------------------------------------

// Styled Components
const ChartContainer = styled(Box)(({ theme }) => ({
    position: 'relative',
    borderRadius: '8px',
    overflow: 'hidden',
    background: alpha(theme.palette.background.paper, 0.02),
    '& .apexcharts-canvas': {
        borderRadius: '8px'
    },
    '& .apexcharts-tooltip': {
        borderRadius: '6px',
        boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.15)}`,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        '& .apexcharts-tooltip-title': {
            background: alpha(theme.palette.background.paper, 0.95),
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            fontSize: '0.75rem',
            fontWeight: 600
        }
    }
}));

const ChartSkeleton = styled(Skeleton)(({ theme }) => ({
    borderRadius: '8px',
    background: `linear-gradient(90deg, 
        ${alpha(theme.palette.background.paper, 0.1)} 0%, 
        ${alpha(theme.palette.background.paper, 0.2)} 50%, 
        ${alpha(theme.palette.background.paper, 0.1)} 100%)`
}));

var triggerFormatting = 0; //adding trimming for very small

function getChartData(offers) {
    let data = [];
    for (var o of offers.slice(0, 30)) {
        data.push([o.price, o.sumAmount]);
        if (!triggerFormatting && o.price < 0.000001 ) {
			triggerFormatting = 1;
		}
    }
    
    return data;
}

export default function BidAskChart({asks, bids}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    // Check if data is available
    const hasData = asks.length > 0 || bids.length > 0;
    
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

    const CHART_OPTION = ChartOptions(CHART_DATA, theme, isMobile);
    
    if (triggerFormatting)
		Object.assign(CHART_OPTION, {
			xaxis: {
				type: 'numeric',
				tickAmount: 1,
				axisBorder: { show: false },
				axisTicks: { show: false },
				/* above from ChartOptions */
				labels: { // webxtor too small numbers are shown as 0 fix 
					trim: true,
					/*rotate: -45, //to better fit the screen
					rotateAlways: true,	
					maxHeight: 50,*/
					offsetX: 3,
					formatter: function(val, index) {
						return fNumber(val);
					},
					style: {
						cssClass: 'apexcharts-xaxis-label-infini', // CSS in zMain.css or need to install style-sx
					}
				}
			},
	});
    
    // Show loading skeleton if no data
    if (!hasData) {
        return (
            <ChartSkeleton 
                variant="rectangular" 
                height={isMobile ? 180 : 256} 
                animation="wave"
            />
        );
    }
    
    return (
        <ChartContainer>
            <Chart 
                series={CHART_DATA} 
                options={CHART_OPTION} 
                height={isMobile ? 180 : 256} 
            />
        </ChartContainer>
    );
}