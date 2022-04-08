//import { useState } from 'react';
import { withStyles } from '@mui/styles';

import { Icon } from '@iconify/react';
import caretDown from '@iconify/icons-bx/caret-down';
import caretUp from '@iconify/icons-bx/caret-up';

import { /*fCurrency5,*/ fNumber, fPercent } from '../../utils/formatNumber';

import {
    Avatar,
    Chip,
    Box,
    Stack,
    Tooltip,
    Typography
} from '@mui/material';

import { useSelector/*, useDispatch*/ } from "react-redux";
import { selectStatus } from "../../redux/statusSlice";

const BearishChip = withStyles({
    root: {
        backgroundColor: "#B72136"
    }
})(Chip);
  
const BullishChip = withStyles({
    root: {
        backgroundColor: "#007B55"
    }
})(Chip);

export default function PriceDesc({token}) {
    const BASE_URL = 'https://ws.xrpl.to/api'; // 'http://localhost/api';

    const status = useSelector(selectStatus);

    const {
        name,
        exch,
        p7d,
        p24h,
        md5,
        /*id,
        acct,
        code,
        date,
        amt,
        trline,
        holders,
        offers*/
    } = token;

    let user = token.user;
    if (!user) user = name;

    const vpro7d = fPercent(p7d[0]);
    const vpro24h = fPercent(p24h[0]);

    let strPro7d = 0;
    if (vpro7d < 0) {
        strPro7d = -vpro7d;
        strPro7d = strPro7d + ' %';
    } else {
        strPro7d = vpro7d + ' %';
    }

    let strPro24h = 0;
    if (vpro24h < 0) {
        strPro24h = -vpro24h;
        strPro24h = strPro24h + ' %';
    } else {
        strPro24h = vpro24h + ' %';
    }

    return (
        <Stack>
            <Stack direction="row" spacing={2}>
                <Typography variant="subtitle1">{user} Price ({name})</Typography>
                <Chip size="small" variant={"outlined"} icon={<Avatar sx={{ width: 24, height: 24 }} alt="xumm" src="/static/sponsor.png"/>} label='Sponsored' />
            </Stack>
            <Stack direction="row" spacing={2} sx={{mt:0}} alignItems='center'>
                <Stack direction="row" spacing={1} alignItems='center'>
                    <Typography variant="h3" noWrap>
                        $ {fNumber(exch / status.USD)}
                    </Typography>
                    <Typography variant="subtitle1" style={{marginTop:8}}>
                        {fNumber(exch)} XRP
                    </Typography>
                </Stack>
            </Stack>

            <Stack direction="row" spacing={1}>
                <Tooltip title="24h(%)">
                    {vpro24h < 0 ? (
                        <BearishChip
                            icon={<Icon icon={caretDown} width="16" height="16" />}
                            size="small"
                            label={<Typography variant="subtitle2">{strPro24h}</Typography>}
                            variant="h3" />
                    ) : (
                        <BullishChip
                            icon={<Icon icon={caretUp} width="16" height="16" />}
                            size="small"
                            label={<Typography variant="subtitle2">{strPro24h}</Typography>}
                            variant="h3" />
                    )}
                </Tooltip>
                <Tooltip title={
                    <Stack alignItems='center'>
                        7d (%)
                        <Box
                            component="img"
                            alt=""
                            sx={{ width: 135, height: 50, mt: 2 }}
                            src={`${BASE_URL}/sparkline/${md5}`}
                        />
                    </Stack>
                }>
                    {vpro7d < 0 ? (
                        <BearishChip
                            icon={<Icon icon={caretDown} width="16" height="16" />}
                            size="small"
                            label={<Typography variant="subtitle2">{strPro7d}</Typography>}
                            variant="h3" />
                    ) : (
                        <BullishChip 
                            icon={<Icon icon={caretUp} width="16" height="16" />}
                            size="small"
                            label={<Typography variant="subtitle2">{strPro7d}</Typography>}
                            variant="h3" />
                    )}
                </Tooltip>
            </Stack>
            {/* <Tooltip title="Last 7 Days">
                <Box
                    component="img"
                    alt=""
                    sx={{ maxWidth:'none', width: 270, height: 50, mt: 2 }}
                    src={`${BASE_URL}/sparkline/${md5}`}
                />
            </Tooltip> */}
        </Stack>
    );
}
