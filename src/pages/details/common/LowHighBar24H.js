import * as React from 'react';
// material
import { styled/*, useTheme*/ } from '@mui/material/styles';
import { Box, Slider, Stack, Typography } from '@mui/material';
// components
//
import { fNumber } from '../../../utils/formatNumber';
// ----------------------------------------------------------------------
import { useSelector } from "react-redux";
import { selectStatus } from "../../../redux/statusSlice";
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
const LowhighBarSlider = styled(Slider)(({ theme }) => ({
    //color: "#52af77",
    //height: 5,
    "& .MuiSlider-track": {
        border: "none"
    },
    "& .MuiSlider-thumb": {
        height: 24,
        width: 24,
        backgroundColor: "unset",
        border: "0px solid currentColor",
        "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
            boxShadow: "inherit"
        },
        "&:before": {
            display: "none"
        }
    },
    "& .MuiSlider-valueLabel": {
        lineHeight: 1.2,
        fontSize: 0,
        background: "unset",
        padding: 0,
        width: 13,
        height: 13,
        borderRadius: "0 50% 50% 50%",
        backgroundColor: "#52af77",
        transformOrigin: "bottom left",
        transform: "translate(-20%, 180%) rotate(45deg) scale(0)",
        "&:before": { display: "none" },
        "&.MuiSlider-valueLabelOpen": {
            transform: "translate(-20%, 180%) rotate(45deg) scale(1)"
        },
        "& > *": {
            transform: "rotate(45deg)"
        }
    }
}));

export default function LowHighBar24H({token}) {
    const status = useSelector(selectStatus);
    const {
        exch,
        maxmin24h
    } = token;
    const price = fNumber(exch / status.USD);
    const min = maxmin24h[1];
    const max = maxmin24h[0];
    const delta = max - min;
    let percent = 0;
    if (delta > 0)
        percent = (price - min) / delta * 100;
    return (
        <Stack direction="row" alignItems='center' spacing={1}>
            <Typography variant="caption">Low: ${fNumber(min)}</Typography>
            <Box sx={{ width: 160 }}>
                <LowhighBarSlider
                    valueLabelDisplay="on"
                    aria-label="Low High Bar Slider"
                    value={percent}
                    sx={{ mt: 1 }}
                />
            </Box>
            <Typography variant="caption">High: ${fNumber(max)}</Typography>
        </Stack>
    );
}
