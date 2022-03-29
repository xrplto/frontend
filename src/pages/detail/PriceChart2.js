import { merge } from 'lodash';
import { useState, useEffect } from 'react';
// material
import { Box, CardHeader, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
// chart.js
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
//
import { alpha, styled, useTheme } from '@mui/material/styles';
//import { withStyles } from '@mui/styles';
import { fCurrency5 } from '../../utils/formatNumber';
// ----------------------------------------------------------------------

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export default function PriceChart2({ detail, range, setRange }) {
    const theme = useTheme();
    const data = detail.history;

    let openPrice = 0;
    let minTime = 0;
    let maxTime = 0;

    if (data && data.length > 0) {
        openPrice = data[0][1];
        minTime = data[0][0];
        maxTime = data[data.length - 1][0];
    }

    if (data && data.length > 60) {
        minTime = data[30][0];
        maxTime = data[data.length - 30][0];
    }

    let user = detail.token.user;
    if (!user) user = detail.token.name;

    let res = [
        { date: "1", value: 35.98 },
        { date: "2", value: 147.49 },
        { date: "3", value: 146.93 },
        { date: "4", value: 139.89 },
        { date: "5", value: 125.6 },
        { date: "6", value: 108.13 },
        { date: "7", value: 115 },
        { date: "8", value: 118.8 },
        { date: "9", value: 124.66 },
        { date: "10", value: 113.44 },
        { date: "11", value: 5.78 },
        { date: "12", value: 113.46 },
        { date: "13", value: 122 },
        { date: "14", value: 118.68 },
        { date: "15", value: 117.45 },
        { date: "16", value: 118.7 },
        { date: "17", value: 119.8 },
        { date: "18", value: 115.81 },
        { date: "19", value: 118.76 },
        { date: "20", value: 125.3 },
        { date: "21", value: 118.68 },
        { date: "22", value: 117.45 },
        { date: "23", value: 118.7 },
        { date: "24", value: 119.8 },
        { date: "25", value: 115.81 },
        { date: "26", value: 118.76 },
        { date: "27", value: 125.3 },
        { date: "28", value: 125.25 },
        { date: "29", value: 124.5 },
        { date: "30", value: 14.5 },
        { date: "31", value: 1.5 },
        { date: "32", value: 140.5 },
        { date: "33", value: 4.5 },
        { date: "34", value: 1.5 },
        { date: "35", value: 140.5 },
        { date: "36", value: 1.5 },
        { date: "37", value: 4.5 },
        { date: "38", value: 144.5 },
        { date: "39", value: 14.5 },
        { date: "40", value: 144.5 },
        { date: "41", value: 114.5 },
        { date: "42", value: 14.5 },
        { date: "43", value: 141.5 },
        { date: "44", value: 14.5 },
        { date: "45", value: 141.5 },
        { date: "46", value: 14.5 },
        { date: "47", value: 111.5 },
        { date: "48", value: 14.5 },
        { date: "49", value: 141.5 },
        { date: "50", value: 114.5 }
    ];

    res = [{ date: 1648345500802, value: 0.32418146818357263},
        { date: 1648345800042, value: 0.3240484083009002},
        { date: 1648346100046, value: 0.32394280110326396},
        { date: 1648346400043, value: 0.3238262719394976},
        { date: 1648346700037, value: 0.3238515859880115},
        { date: 1648347000041, value: 0.3238515859880115},
        { date: 1648347300743, value: 0.32383732358922507},
        { date: 1648347600044, value: 0.32384056213951573},
        { date: 1648347900035, value: 0.3238279763446629},
        { date: 1648348200043, value: 0.32603999999999983},
        { date: 1648348500042, value: 0.32603999999999983},
        { date: 1648348800265, value: 0.3260399999999996},
        { date: 1648349100797, value: 0.3260074314785169},
        { date: 1648349400048, value: 0.32591255492714044},
        { date: 1648349700050, value: 0.3257922652885054},
        { date: 1648350000044, value: 0.32613154902273134},
        { date: 1648350300043, value: 0.32613154902273134},
        { date: 1648350600045, value: 0.3235378914600004},
        { date: 1648350900808, value: 0.3235378914600004},
        { date: 1648351200050, value: 0.32533663922126893},
        { date: 1648351500038, value: 0.3239586182906036},
        { date: 1648351800044, value: 0.3222468379228376},
        { date: 1648352100041, value: 0.3213081441613017},
        { date: 1648352400044, value: 0.3212956651114029},
        { date: 1648352701227, value: 0.325218110577321},
        { date: 1648353000040, value: 0.32399715128693635},
        { date: 1648353300038, value: 0.3238677536050146},
        { date: 1648353600044, value: 0.32250057331048465}
    ];

    const dataR = {
        labels: res.map((e) => e.date),
        datasets: [
          {
            label: "First dataset",
            data: res.map((e) => e.value),
            fill: true,
            backgroundColor: "rgba(75,192,192,0.2)",
            borderColor: "rgba(75,192,192,1)"
          }
        ]
    };
      
    const options = {
        scales: {
        xAxes: [
            {
            stacked: true
            }
        ],
        yAxes: [
            {
            stacked: true
            }
        ]
        },
        pan: {
        enabled: true,
        mode: "y"
        },
        zoom: {
        enabled: true,
        mode: "x",
        sensitivity: 0.5
        }
    };

    

    const handleChange = (event, newRange) => {
        if (newRange)
            setRange(newRange);
    };

    return (
        <>
            <Stack direction="row" spacing={2} sx={{mt:4}} alignItems="center">
                <CardHeader title={`${user} to USD Chart`} subheader='' />
                <Box sx={{ flexGrow: 1 }} />
                <ToggleButtonGroup
                    color="primary"
                    value={range}
                    exclusive
                    onChange={handleChange}
                    sx={{pt:2.5,mb:0}}
                >
                    <ToggleButton sx={{pt:0,pb:0}} value="1D">1D</ToggleButton>
                    <ToggleButton sx={{pt:0,pb:0}} value="7D">7D</ToggleButton>
                    <ToggleButton sx={{pt:0,pb:0}} value="1M">1M</ToggleButton>
                    <ToggleButton sx={{pt:0,pb:0}} value="3M">3M</ToggleButton>
                    <ToggleButton sx={{pt:0,pb:0}} value="1Y">1Y</ToggleButton>
                </ToggleButtonGroup>
            </Stack>
            <Box sx={{ p: 0, pb: 0 }} dir="ltr">
                <Line data={dataR} options={options} />
            </Box>
        </>
    );
}
