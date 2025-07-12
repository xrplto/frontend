// Material
import {
    Stack,
    Box,
    useTheme,
    useMediaQuery,
    styled,
    alpha,
    Skeleton,
    keyframes,
    Typography,
    Fade
} from '@mui/material';

// Highcharts
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

// Icons
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

// Utils
import { fNumber } from 'src/utils/formatNumber';
import { useMemo, useEffect, useState } from 'react';

// ----------------------------------------------------------------------

// Animations
const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const glow = keyframes`
  0% { box-shadow: 0 0 5px rgba(0, 123, 85, 0.5); }
  50% { box-shadow: 0 0 20px rgba(0, 123, 85, 0.8), 0 0 40px rgba(0, 123, 85, 0.4); }
  100% { box-shadow: 0 0 5px rgba(0, 123, 85, 0.5); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// Styled Components
const ChartContainer = styled(Box)(({ theme }) => ({
    position: 'relative',
    borderRadius: '16px',
    overflow: 'hidden',
    background: 'transparent',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    boxShadow: `
        0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
        0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
        inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: `
            0 12px 40px ${alpha(theme.palette.common.black, 0.15)}, 
            0 2px 4px ${alpha(theme.palette.common.black, 0.05)},
            inset 0 1px 1px ${alpha(theme.palette.common.white, 0.15)}`,
    },
    '& .highcharts-container': {
        borderRadius: '16px'
    }
}));

const ChartHeader = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: theme.spacing(2, 3),
    background: 'transparent',
    zIndex: 10,
    pointerEvents: 'none'
}));

const DepthIndicator = styled(Box)(({ theme, type }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(0.5, 1.5),
    borderRadius: '20px',
    background: type === 'bid' 
        ? `linear-gradient(135deg, ${alpha('#007B55', 0.1)} 0%, ${alpha('#00D9A3', 0.05)} 100%)`
        : `linear-gradient(135deg, ${alpha('#B72136', 0.1)} 0%, ${alpha('#FF6B6B', 0.05)} 100%)`,
    border: `1px solid ${alpha(type === 'bid' ? '#007B55' : '#B72136', 0.2)}`,
    '& .MuiSvgIcon-root': {
        fontSize: '1rem',
        color: type === 'bid' ? '#00D9A3' : '#FF6B6B',
        animation: `${pulse} 2s ease-in-out infinite`
    }
}));

const VolumeBar = styled(Box)(({ theme }) => ({
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: alpha(theme.palette.divider, 0.1),
    overflow: 'hidden',
    '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: '100%',
        background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.5)}, transparent)`,
        animation: `${shimmer} 3s linear infinite`
    }
}));

const ChartSkeleton = styled(Skeleton)(({ theme }) => ({
    borderRadius: '16px',
    background: theme.palette.mode === 'dark'
        ? `linear-gradient(90deg, 
            ${alpha(theme.palette.grey[900], 0.3)} 0%, 
            ${alpha(theme.palette.grey[800], 0.5)} 50%, 
            ${alpha(theme.palette.grey[900], 0.3)} 100%)`
        : `linear-gradient(90deg, 
            ${alpha(theme.palette.grey[100], 0.8)} 0%, 
            ${alpha(theme.palette.grey[200], 1)} 50%, 
            ${alpha(theme.palette.grey[100], 0.8)} 100%)`,
    '&::after': {
        background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`
    }
}));

const DataIndicator = styled(Typography)(({ theme, isPositive }) => ({
    fontSize: '0.75rem',
    fontWeight: 600,
    color: isPositive ? theme.palette.success.main : theme.palette.error.main,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    '& .indicator': {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: isPositive ? theme.palette.success.main : theme.palette.error.main,
        animation: `${pulse} 2s ease-in-out infinite`,
        boxShadow: `0 0 10px ${alpha(isPositive ? theme.palette.success.main : theme.palette.error.main, 0.6)}`
    }
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
            height: isMobile ? 220 : 320,
            backgroundColor: 'transparent',
            style: {
                fontFamily: theme.typography.fontFamily
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            },
            margin: isMobile ? [60, 15, 30, 15] : [80, 25, 40, 25],
            spacing: [0, 0, 0, 0],
            events: {
                load: function() {
                    // Add custom animations after chart loads
                    this.series.forEach((series, index) => {
                        series.group.attr({ opacity: 0 });
                        series.group.animate({ opacity: 1 }, {
                            duration: 1000 + (index * 300)
                        });
                    });
                }
            }
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
            gridLineColor: theme.palette.divider,
            gridLineDashStyle: 'Dash',
            gridLineWidth: 0,
            lineWidth: 0,
            tickWidth: 0,
            labels: {
                style: {
                    color: theme.palette.text.secondary,
                    fontSize: '11px'
                },
                formatter: function() {
                    return fNumber(this.value);
                },
                rotation: hasSmallValues ? 0 : 0,
                x: hasSmallValues ? 3 : 0
            }
        },
        yAxis: {
            title: {
                text: null
            },
            gridLineColor: theme.palette.divider,
            gridLineDashStyle: 'Dash',
            labels: {
                style: {
                    color: theme.palette.text.secondary,
                    fontSize: '11px'
                },
                formatter: function() {
                    return this.value > 1000 ? 
                        Highcharts.numberFormat(this.value / 1000, 1) + 'k' : 
                        fNumber(this.value);
                }
            }
        },
        tooltip: {
            shared: true,
            backgroundColor: theme.palette.mode === 'dark' ? 
                'rgba(10, 10, 20, 0.95)' : 
                'rgba(255, 255, 255, 0.98)',
            borderColor: 'transparent',
            borderRadius: 12,
            borderWidth: 0,
            shadow: false,
            padding: 0,
            style: {
                color: theme.palette.text.primary,
                fontSize: '13px'
            },
            formatter: function() {
                const points = this.points;
                const price = this.x;
                
                let tooltipHtml = `
                    <div style="
                        padding: 12px 16px;
                        background: ${theme.palette.mode === 'dark' ? 
                            'linear-gradient(135deg, rgba(10, 10, 20, 0.98) 0%, rgba(20, 20, 40, 0.95) 100%)' : 
                            'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(245, 245, 250, 1) 100%)'};
                        border: 1px solid ${alpha(theme.palette.divider, 0.1)};
                        border-radius: 12px;
                        box-shadow: 0 8px 32px ${alpha(theme.palette.common.black, theme.palette.mode === 'dark' ? 0.4 : 0.1)},
                                    inset 0 1px 0 ${alpha(theme.palette.common.white, theme.palette.mode === 'dark' ? 0.1 : 0.8)};
                        backdrop-filter: blur(20px);
                        -webkit-backdrop-filter: blur(20px);
                    ">
                        <div style="
                            font-size: 11px;
                            color: ${theme.palette.text.secondary};
                            margin-bottom: 8px;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            font-weight: 600;
                        ">Price Level</div>
                        <div style="
                            font-size: 16px;
                            font-weight: 700;
                            color: ${theme.palette.text.primary};
                            margin-bottom: 12px;
                            font-family: 'SF Mono', Monaco, monospace;
                        ">${fNumber(price)}</div>
                `;
                
                points.forEach(point => {
                    const isBid = point.series.name === 'BID';
                    const color = isBid ? '#00D9A3' : '#FF6B6B';
                    const bgColor = isBid ? 'rgba(0, 217, 163, 0.1)' : 'rgba(255, 107, 107, 0.1)';
                    
                    tooltipHtml += `
                        <div style="
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            padding: 6px 10px;
                            margin: 4px -10px;
                            background: ${bgColor};
                            border-radius: 8px;
                        ">
                            <span style="
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                font-weight: 600;
                                color: ${color};
                            ">
                                <span style="
                                    width: 8px;
                                    height: 8px;
                                    border-radius: 50%;
                                    background: ${color};
                                    box-shadow: 0 0 8px ${alpha(color, 0.6)};
                                "></span>
                                ${point.series.name}
                            </span>
                            <span style="
                                font-weight: 700;
                                color: ${theme.palette.text.primary};
                                font-family: 'SF Mono', Monaco, monospace;
                            ">${fNumber(point.y)}</span>
                        </div>
                    `;
                });
                
                tooltipHtml += '</div>';
                return tooltipHtml;
            },
            useHTML: true,
            positioner: function(width, height, point) {
                const chart = this.chart;
                const plotLeft = chart.plotLeft;
                const plotWidth = chart.plotWidth;
                let x = point.plotX + plotLeft;
                
                // Keep tooltip within chart bounds
                if (x + width > plotLeft + plotWidth) {
                    x = plotLeft + plotWidth - width;
                }
                if (x < plotLeft) {
                    x = plotLeft;
                }
                
                return {
                    x: x,
                    y: 10
                };
            }
        },
        plotOptions: {
            area: {
                lineWidth: 3,
                states: {
                    hover: {
                        lineWidth: 4,
                        brightness: 0.1,
                        halo: {
                            size: 12,
                            opacity: 0.25
                        }
                    }
                },
                marker: {
                    enabled: false,
                    symbol: 'circle',
                    radius: 4,
                    states: {
                        hover: {
                            enabled: true,
                            radius: 6,
                            lineWidth: 2,
                            lineColor: '#FFFFFF'
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
                    duration: 1500,
                    easing: 'easeOutQuart'
                },
                states: {
                    hover: {
                        enabled: true
                    },
                    inactive: {
                        opacity: 0.6
                    }
                }
            }
        },
        series: [
            {
                name: 'BID',
                data: bidData.data,
                color: '#00D9A3',
                fillColor: {
                    linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
                    stops: [
                        [0, alpha('#00D9A3', 0.3)],
                        [0.5, alpha('#007B55', 0.15)],
                        [1, alpha('#007B55', 0)]
                    ]
                },
                lineColor: {
                    linearGradient: { x1: 0, x2: 1, y1: 0, y2: 0 },
                    stops: [
                        [0, '#007B55'],
                        [0.5, '#00D9A3'],
                        [1, '#00FFB7']
                    ]
                },
                states: {
                    hover: {
                        lineColor: '#00FFB7',
                        fillColor: {
                            linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
                            stops: [
                                [0, alpha('#00D9A3', 0.4)],
                                [0.5, alpha('#007B55', 0.2)],
                                [1, alpha('#007B55', 0)]
                            ]
                        }
                    }
                }
            },
            {
                name: 'ASK',
                data: askData.data,
                color: '#FF6B6B',
                fillColor: {
                    linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
                    stops: [
                        [0, alpha('#FF6B6B', 0.3)],
                        [0.5, alpha('#B72136', 0.15)],
                        [1, alpha('#B72136', 0)]
                    ]
                },
                lineColor: {
                    linearGradient: { x1: 0, x2: 1, y1: 0, y2: 0 },
                    stops: [
                        [0, '#B72136'],
                        [0.5, '#FF6B6B'],
                        [1, '#FF9999']
                    ]
                },
                states: {
                    hover: {
                        lineColor: '#FF9999',
                        fillColor: {
                            linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
                            stops: [
                                [0, alpha('#FF6B6B', 0.4)],
                                [0.5, alpha('#B72136', 0.2)],
                                [1, alpha('#B72136', 0)]
                            ]
                        }
                    }
                }
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
                            height: 180
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
                height={isMobile ? 180 : 256} 
                animation="wave"
            />
        );
    }
    
    return (
        <Fade in={isAnimated} timeout={800}>
            <ChartContainer>
                <ChartHeader>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={2}>
                            <DepthIndicator type="bid">
                                <TrendingUpIcon />
                                <Box>
                                    <Typography variant="caption" sx={{ opacity: 0.7 }}>BID</Typography>
                                    <Typography variant="body2" fontWeight={700}>
                                        {fNumber(totalBidVolume)}
                                    </Typography>
                                </Box>
                            </DepthIndicator>
                            <DepthIndicator type="ask">
                                <TrendingDownIcon />
                                <Box>
                                    <Typography variant="caption" sx={{ opacity: 0.7 }}>ASK</Typography>
                                    <Typography variant="body2" fontWeight={700}>
                                        {fNumber(totalAskVolume)}
                                    </Typography>
                                </Box>
                            </DepthIndicator>
                        </Stack>
                        {!isMobile && (
                            <DataIndicator isPositive={totalBidVolume > totalAskVolume}>
                                <span className="indicator" />
                                Spread: {fNumber(spread)}
                            </DataIndicator>
                        )}
                    </Stack>
                </ChartHeader>
                <HighchartsReact 
                    highcharts={Highcharts}
                    options={chartOptions}
                />
                <VolumeBar />
            </ChartContainer>
        </Fade>
    );
}