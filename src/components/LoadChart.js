import { styled } from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";

const VolumeChart = styled("div")(() => `
    position: relative;
    height: 50px;
    overflow: hidden;

    & svg {
        position: absolute;
        top: 0;
        left: 0;
        user-select: none;
    }

    @keyframes chartEffect {
        0% {
            width: 0%;
        }

        100% {
            width: 100%;
        }
    }

    &.animated {
        animation: chartEffect 3s linear 2;
    }
`);

const LoadChart = ({ url }) => {
    
    const [chartText, setChartText] = useState('');

    useEffect(() => {
        if (url) {
            function getChart() {
                axios.get(url).then(res => {
                    setChartText(res.data);
                }).catch(err => {

                })
            }

            getChart();
        }
    }, [url]);

    return (
        <>
            { chartText ? <VolumeChart className={chartText ? "animated" : "" } dangerouslySetInnerHTML={{ __html: chartText }}/> : ""}
        </>
    )
}

export default LoadChart;