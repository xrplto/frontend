// Material
import {
    alpha,
    useTheme
} from '@mui/material';

// Utils
import { fCurrency5, fNumber, fIntNumber } from 'src/utils/formatNumber';

// ----------------------------------------------------------------------
export default function ChartOptions(series) {
    const theme = useTheme();

    return {
        chart: {
            id: 'chart2',
            animations: { enabled: true },
            redrawOnParentResize: true,
            toolbar: {
                autoSelected: 'pan',
                show: false
            },
            zoom: {
                type: 'y',
                enabled: true,
                autoScaleYaxis: true
            }
        },
        series: series,
        // Grid
        grid: {
            strokeDashArray: 3,
            borderColor: theme.palette.divider
        },
        // Colors
        colors: ['#00AB55'],
        // colors: [
        //     '#00AB55',
        //     '#FFE700',
        //     '#2D99FF',
        //     '#826AF9',
        //     '#2CD9C5',
        //     '#FF6C40',
        //     '#B72136'
        // ],

        // Fill
        fill: {
            type: 'gradient',
            opacity: 1,
            gradient: {
                type: 'vertical',
                shadeIntensity: 0,
                opacityFrom: 0.4,
                opacityTo: 0,
                stops: [0, 100]
            },
        },
        // States
        states: {
            hover: {
                filter: {
                    type: 'lighten',
                    value: 0.04
                }
            },
            active: {
                filter: {
                    type: 'darken',
                    value: 0.88
                }
            }
        },

        // Datalabels
        dataLabels: { enabled: false },

        // Stroke
        stroke: {
            width: 2,
            curve: 'smooth',
            lineCap: 'round'
        },

        // Markers
        markers: {
            size: 0,
            strokeColors: theme.palette.background.paper
        },

        // X Axis
        xaxis: {
            type: 'datetime',
            axisBorder: { show: true },
            axisTicks: { show: false }
        },
        // Y Axis
        yaxis: {
            show: true,
            tickAmount: 6,
            labels: {
                /**
                * Allows users to apply a custom formatter function to yaxis labels.
                *
                * @param { String } value - The generated value of the y-axis tick
                * @param { index } index of the tick / currently executing iteration in yaxis labels array
                */
                formatter: function(val, index) {
                    return fNumber(val);
                }
            }
        },

        // Tooltip
        tooltip: {
            shared: true,
            intersect: false,
            theme: theme.palette.mode,
            style: {
                fontSize: '12px',
                fontFamily: theme.typography.fontFamily,
                fontWeight: 500
            },
            custom: function({ series, seriesIndex, dataPointIndex, w }) {
                const value = series[seriesIndex][dataPointIndex];
                const date = new Date(w.globals.seriesX[seriesIndex][dataPointIndex]);
                
                return `<div style="
                    background: ${theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.grey[900], 0.95)
                        : alpha(theme.palette.background.paper, 0.98)};
                    color: ${theme.palette.text.primary};
                    padding: 12px 16px;
                    border-radius: ${theme.shape.borderRadius * 1.5}px;
                    border: 1px solid ${alpha(theme.palette.divider, 0.1)};
                    box-shadow: ${theme.palette.mode === 'dark'
                        ? `0 0 20px ${alpha(theme.palette.primary.main, 0.2)}`
                        : `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`};
                    backdrop-filter: blur(10px);
                    min-width: 180px;
                ">
                    <div style="font-weight: 700; color: ${theme.palette.primary.main}; margin-bottom: 8px;">
                        Address Statistics
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="opacity: 0.8;">Total Addresses:</span>
                        <strong style="color: ${theme.palette.success.main};">${fIntNumber(value)}</strong>
                    </div>
                    <div style="font-size: 11px; opacity: 0.7; margin-top: 8px;">
                        ${date.toLocaleDateString()} ${date.toLocaleTimeString()}
                    </div>
                </div>`;
            }
        },

        // plotOptions
        plotOptions: {
            // Bar
            bar: {
                columnWidth: '50%',
                borderRadius: 0
            },
        },

        // Responsive
        responsive: [
            {
                // sm
                breakpoint: theme.breakpoints.values.sm,
                options: {
                    plotOptions: { bar: { columnWidth: '40%' } }
                }
            },
            {
                // md
                breakpoint: theme.breakpoints.values.md,
                options: {
                    plotOptions: { bar: { columnWidth: '32%' } }
                }
            }
        ]
    };
}
