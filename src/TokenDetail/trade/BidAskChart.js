// Material
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { styled } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import Fade from '@mui/material/Fade';

// Simplified chart without ECharts

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

function getChartData(offers, isBid = false) {
    let data = [];
    let hasSmallValues = false;
    
    // Take up to 100 data points for much smoother curves
    const limitedOffers = offers.slice(0, 100);
    
    for (var o of limitedOffers) {
        data.push([o.price, o.sumAmount]);
        if (!hasSmallValues && o.price < 0.000001 ) {
            hasSmallValues = true;
        }
    }
    
    // Sort data by price for proper depth chart display
    // Bids should be descending, asks ascending
    if (isBid) {
        data.sort((a, b) => b[0] - a[0]);
    } else {
        data.sort((a, b) => a[0] - b[0]);
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
    const bidData = getChartData(bids, true);
    const askData = getChartData(asks, false);
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
    
    // Create enhanced ECharts options
    const chartOptions = useMemo(() => ({
        backgroundColor: 'transparent',
        animation: true,
        animationDuration: 500,
        grid: {
            top: isMobile ? 40 : 50,
            right: isMobile ? 10 : 15,
            bottom: isMobile ? 20 : 25,
            left: isMobile ? 10 : 15,
            containLabel: true
        },
        xAxis: {
            type: 'value',
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: {
                color: theme.palette.text.secondary,
                fontSize: 9,
                formatter: function(value) {
                    return fNumber(value);
                }
            }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: {
                lineStyle: {
                    color: alpha(theme.palette.divider, 0.1),
                    type: 'dotted'
                }
            },
            axisLabel: {
                color: theme.palette.text.secondary,
                fontSize: 9,
                formatter: function(value) {
                    return value > 1000 ? 
                        (value / 1000).toFixed(0) + 'k' : 
                        fNumber(value);
                }
            }
        },
        tooltip: {
            trigger: 'axis',
            backgroundColor: theme.palette.background.paper,
            borderColor: theme.palette.divider,
            borderWidth: 1,
            borderRadius: 4,
            padding: 8,
            textStyle: {
                color: theme.palette.text.primary,
                fontSize: 11
            },
            formatter: function(params) {
                let html = `<div><b>${fNumber(params[0].axisValue)}</b></div>`;
                params.forEach(point => {
                    const color = point.seriesName === 'BID' ? '#00D9A3' : '#FF6B6B';
                    html += `<div style="color: ${color}">${point.seriesName}: ${fNumber(point.value[1])}</div>`;
                });
                return html;
            }
        },
        series: [
            {
                name: 'BID',
                type: 'line',
                data: bidData.data,
                smooth: false, // Remove smoothing for accurate depth representation
                symbol: 'none',
                step: false, // Remove step for continuous depth curve
                sampling: 'lttb', // Use downsampling for performance with many points
                lineStyle: {
                    width: 2,
                    color: '#00D9A3'
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [{
                            offset: 0, color: alpha('#00D9A3', 0.2)
                        }, {
                            offset: 1, color: alpha('#00D9A3', 0.05)
                        }]
                    }
                },
                emphasis: {
                    lineStyle: {
                        width: 2.5
                    }
                }
            },
            {
                name: 'ASK',
                type: 'line',
                data: askData.data,
                smooth: false, // Remove smoothing for accurate depth representation
                symbol: 'none',
                step: false, // Remove step for continuous depth curve
                sampling: 'lttb', // Use downsampling for performance with many points
                lineStyle: {
                    width: 2,
                    color: '#FF6B6B'
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [{
                            offset: 0, color: alpha('#FF6B6B', 0.2)
                        }, {
                            offset: 1, color: alpha('#FF6B6B', 0.05)
                        }]
                    }
                },
                emphasis: {
                    lineStyle: {
                        width: 2.5
                    }
                }
            }
        ]
    }), [theme, isMobile, bidData.data, askData.data]);
    
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
                <Box 
                    sx={{ 
                        height: isMobile ? 160 : 220, 
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'text.secondary'
                    }}
                >
                    <Typography variant="body2">Order Book Chart</Typography>
                </Box>
            </ChartContainer>
        </Fade>
    );
}