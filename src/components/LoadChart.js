import axios from "axios";
import { useEffect, useState } from "react";
import ReactECharts from 'echarts-for-react';
import { useTheme } from '@mui/material/styles';

const LoadChart = ({ url }) => {
    const theme = useTheme();
    const [chartOption, setChartOption] = useState('');

    useEffect(() => {
        if (url) {
            async function getChart() {
                await axios.get(url).then(res => {
                    const { coodinate, chartColor } = res.data;

                    const option = {
                        tooltip: {},
                        xAxis: {
                            show: false
                        },
                        yAxis: {
                            type: 'value',
                            show: false
                        },
                        series: [{
                            data: coodinate,
                            type: 'line',
                            color: chartColor === "#54D62C" ? theme.palette.primary.main : chartColor,
                            showSymbol: false,
                            lineStyle: {
                                width: 2.4
                            },
                            smooth: true
                        }]
                    };

                    setChartOption(option);
                }).catch(err => {
                    console.log(err);
                });
            }

            getChart();
        }
    }, [url, theme]);

    return (
        <>
            {chartOption ? (
                <ReactECharts
                    option={chartOption}
                    style={{ height: 80, width: 260 }} // Updated width here
                    opts={{ renderer: "svg" }}
                />
            ) : ""}
        </>
    );
}

export default LoadChart;
