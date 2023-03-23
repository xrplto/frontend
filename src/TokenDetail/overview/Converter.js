import React from 'react';
import Decimal from 'decimal.js';
import { useState, useEffect } from 'react';

// Material
import {
    styled, useTheme,
    Avatar,
    Box,
    Card,
    CardHeader,
    IconButton,
    Link,
    Stack,
    Tooltip,
    Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Redux
import { useSelector/*, useDispatch*/ } from "react-redux";
import { selectMetrics } from "src/redux/statusSlice";

// Utils
import { fPercent, fNumber } from 'src/utils/formatNumber';

const CurrencyContent = styled('div')(
    ({ theme }) => `
    box-sizing: border-box;
    margin: 0px;
    display: flex;
    flex: 1 1 0%;
    flex-direction: row;
    padding: 20px 24px;
    -webkit-box-align: center;
    align-items: center;
`
);

const ConverterFrame = styled('div')(
    ({ theme }) => `
    margin: 0px;
    box-sizing: border-box;
    position: relative;
    border-radius: 16px;
    display: flex;
    flex-direction: row;
    overflow: hidden;
    border: 1px solid ${theme.palette.background.default};
`
);

const ToggleContent = styled('div')(
    ({ theme }) => `
    cursor: pointer;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
`
);

export default function Converter({token}) {
    const theme = useTheme();
    const { accountProfile } = useContext(AppContext);

    const metrics = useSelector(selectMetrics);
    const {
        id,
        name,
        exch,
        usd,
        pro24h,
        amount,
        supply,
        issuer,
        currency,
        vol24h,
        vol24hxrp,
        vol24hx,
        urlSlug,
        marketcap,
        date,
        md5,
        pro7d,
        trustlines,
        holders,
        offers,
        imgExt
    } = token;

    let user = token.user;
    if (!user) user = name;

    const price = fNumber(usd || 0);

    const imgUrl1 = `/static/tokens/${md5}.${imgExt}`;
    const imgUrl2 = `/static/xrp.png`;

    const [revert, setRevert] = useState(false);

    const color1 = revert?theme.currency.background2:theme.currency.background1;
    const color2 = revert?theme.currency.background1:theme.currency.background2;

    return (
        <Stack>
            <Typography variant="h3" fontSize='1.1rem' sx={{mt:{xs: 4, md: 0}, mb: 3 }}>{`${name} to XRP Converter`}</Typography>
            <ConverterFrame>
                <CurrencyContent style={{order: revert ? 2:1, backgroundColor: color1}}>
                    <Stack direction="row" spacing={1.3} alignItems="center">
                        <Avatar
                            alt={name}
                            src={imgUrl1}
                            sx={{ width: 32, height: 32 }}
                        />
                        <Stack spacing={0}>
                            <Typography variant="s7">{name}</Typography>
                            <Typography variant="s8">{user}</Typography>
                        </Stack>
                    </Stack>
                </CurrencyContent>
                <CurrencyContent style={{order: revert ? 1:2, backgroundColor: color2}}>
                    <Stack direction="row" spacing={1.3} alignItems="center">
                        <Avatar
                            alt={name}
                            src={imgUrl2}
                            sx={{ width: 32, height: 32 }}
                        />
                        <Stack spacing={0}>
                            <Typography variant="s7">XRP</Typography>
                            <Typography variant="s8">Ripple</Typography>
                        </Stack>
                    </Stack>
                </CurrencyContent>
                <ToggleContent>
                    <IconButton size="medium" onClick={()=>{setRevert(!revert)}}>
                        <CurrencyExchangeIcon />
                    </IconButton>
                </ToggleContent>
            </ConverterFrame>
        </Stack>
    );
}
