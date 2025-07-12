// Material
import {
    Stack,
    Box,
    useTheme,
    useMediaQuery,
    styled,
    alpha,
    Skeleton,
    Typography,
    Fade
} from '@mui/material';

// Highcharts
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

// Utils
import { fNumber } from 'src/utils/formatNumber';
import { useMemo, useEffect, useState } from 'react';

// ----------------------------------------------------------------------

// Styled Components
const ChartContainer = styled(Box)(({ theme }) => ({
    position: 'relative',
    borderRadius: '8px',
    overflow: 'hidden',
    background: 'transparent',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    transition: 'all 0.2s ease',
    '& .highcharts-container': {
        borderRadius: '8px'
    }
}));

const ChartHeader = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: theme.spacing(1, 1.5),
    background: 'transparent',
    zIndex: 10,
    pointerEvents: 'none'
}));

const DepthIndicator = styled(Box)(({ theme, type }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    padding: theme.spacing(0.25, 0.75),
    borderRadius: '4px',
    background: alpha(type === 'bid' ? '#007B55' : '#B72136', 0.08),
    '& .MuiSvgIcon-root': {
        fontSize: '0.875rem',
        color: type === 'bid' ? '#00D9A3' : '#FF6B6B'
    }
}));

// Remove VolumeBar - not needed for compact design

const ChartSkeleton = styled(Skeleton)(({ theme }) => ({
    borderRadius: '8px'
}));

const DataIndicator = styled(Typography)(({ theme, isPositive }) => ({
    fontSize: '0.7rem',
    fontWeight: 600,
    color: theme.palette.text.secondary,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5)
}));

function getChartData(offers) {
    let data = [];
    let hasSmallValues = false;
    
    for (var o of offers.slice(0, 30)) {
        data.push([o.price, o.sumAmount]);
        if (!hasSmallValues && o.price < 0.000001 ) {
            hasSmallValues = true;
        }
    }
    
    return { data, hasSmallValues };
}

export default function BidAskChart({asks, bids}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [isAnimated, setIsAnimated] = useState(false);
    
    // Check if data is available
    const hasData = asks.length > 0 || bids.length > 0;
    
    // Process chart data
    const bidData = getChartData(bids);
    const askData = getChartData(asks);
    const hasSmallValues = bidData.hasSmallValues || askData.hasSmallValues;
    
    // Calculate spread and depth
    const spread = useMemo(() => {
        if (asks.length > 0 && bids.length > 0) {
            return asks[0].price - bids[0].price;
        }
        return 0;
    }, [asks, bids]);
    
    const totalBidVolume = useMemo(() => {
        return bids.reduce((sum, bid) => sum + bid.sumAmount, 0);
    }, [bids]);
    
    const totalAskVolume = useMemo(() => {
        return asks.reduce((sum, ask) => sum + ask.sumAmount, 0);
    }, [asks]);
    
    useEffect(() => {
        if (hasData) {
            setTimeout(() => setIsAnimated(true), 100);
        }
    }, [hasData]);
    
    // Create enhanced Highcharts options
    const chartOptions = useMemo(() => ({
        chart: {
            type: 'area',
            height: isMobile ? 160 : 220,
            backgroundColor: 'transparent',
            style: {
                fontFamily: theme.typography.fontFamily
            },
            animation: {
                duration: 500
            },
            margin: isMobile ? [40, 10, 20, 10] : [50, 15, 25, 15],
            spacing: [0, 0, 0, 0]
        },
        credits: {
            enabled: false
        },
        title: {
            text: null
        },
        legend: {
            enabled: false // We'll create custom legend in header
        },
        xAxis: {
            type: 'linear',
            gridLineWidth: 0,
            lineWidth: 0,
            tickWidth: 0,
            labels: {
                style: {
                    color: theme.palette.text.secondary,
                    fontSize: '9px'
                },
                formatter: function() {
                    return fNumber(this.value);
                }
            }
        },
        yAxis: {
            title: {
                text: null
            },
            gridLineColor: alpha(theme.palette.divider, 0.1),
            gridLineDashStyle: 'Dot',
            labels: {
                style: {
                    color: theme.palette.text.secondary,
                    fontSize: '9px'
                },
                formatter: function() {
                    return this.value > 1000 ? 
                        Highcharts.numberFormat(this.value / 1000, 0) + 'k' : 
                        fNumber(this.value);
                }
            }
        },
        tooltip: {
            shared: true,
            backgroundColor: theme.palette.background.paper,
            borderColor: theme.palette.divider,
            borderRadius: 4,
            borderWidth: 1,
            shadow: false,
            padding: 8,
            style: {
                color: theme.palette.text.primary,
                fontSize: '11px'
            },
            formatter: function() {
                const points = this.points;
                let html = `<div><b>${fNumber(this.x)}</b></div>`;
                points.forEach(point => {
                    const color = point.series.name === 'BID' ? '#00D9A3' : '#FF6B6B';
                    html += `<div style="color: ${color}">${point.series.name}: ${fNumber(point.y)}</div>`;
                });
                return html;
            },
            useHTML: true
        },
        plotOptions: {
            area: {
                lineWidth: 2,
                states: {
                    hover: {
                        lineWidth: 2
                    }
                },
                marker: {
                    enabled: false,
                    states: {
                        hover: {
                            enabled: true,
                            radius: 3
                        }
                    }
                },
                fillOpacity: 0.1,
                trackByArea: true,
                stickyTracking: true,
                threshold: null
            },
            series: {
                animation: {
                    duration: 500
                },
                states: {
                    hover: {
                        enabled: true
                    },
                    inactive: {
                        opacity: 0.5
                    }
                }
            }
        },
        series: [
            {
                name: 'BID',
                data: bidData.data,
                color: '#00D9A3',
                fillColor: alpha('#00D9A3', 0.1)
            },
            {
                name: 'ASK',
                data: askData.data,
                color: '#FF6B6B',
                fillColor: alpha('#FF6B6B', 0.1)
            }
        ],
        responsive: {
            rules: [
                {
                    condition: {
                        maxWidth: theme.breakpoints.values.sm
                    },
                    chartOptions: {
                        chart: {
                            height: 140
                        }
                    }
                }
            ]
        }
    }), [theme, isMobile, bidData.data, askData.data, hasSmallValues]);
    
    // Show loading skeleton if no data
    if (!hasData) {
        return (
            <ChartSkeleton 
                variant="rectangular" 
                height={isMobile ? 140 : 220} 
                animation="wave"
            />
        );
    }
    
    return (
        <Fade in={isAnimated} timeout={300}>
            <ChartContainer>
                <ChartHeader>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1}>
                            <DepthIndicator type="bid">
                                <Typography variant="caption" fontWeight={600}>
                                    BID: {fNumber(totalBidVolume)}
                                </Typography>
                            </DepthIndicator>
                            <DepthIndicator type="ask">
                                <Typography variant="caption" fontWeight={600}>
                                    ASK: {fNumber(totalAskVolume)}
                                </Typography>
                            </DepthIndicator>
                        </Stack>
                        {!isMobile && spread > 0 && (
                            <DataIndicator>
                                <Typography variant="caption">
                                    Spread: {fNumber(spread)}
                                </Typography>
                            </DataIndicator>
                        )}
                    </Stack>
                </ChartHeader>
                <HighchartsReact 
                    highcharts={Highcharts}
                    options={chartOptions}
                />
            </ChartContainer>
        </Fade>
    );
}