//import { useState } from 'react';
import { withStyles } from '@mui/styles';

import { Icon } from '@iconify/react';
import caretDown from '@iconify/icons-bx/caret-down';
import caretUp from '@iconify/icons-bx/caret-up';

import { fCurrency5, fPercent } from '../../utils/formatNumber';


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

export default function TokenDetail({token}) {
    const BASE_URL = 'https://ws.xrpl.to/api'; // 'http://localhost/api';

    const status = useSelector(selectStatus);

    const {
        name,
        exch,
        pro7d,
        pro24h,
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

    const vpro7d = fPercent(pro7d);
    const vpro24h = fPercent(pro24h);

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
            <Stack direction="row" spacing={2} sx={{mt:1}} alignItems='center'>
                <Stack>
                    <Typography variant="h3" noWrap>
                        $ {fCurrency5(exch / status.USD)}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <Typography variant="subtitle1">
                            {fCurrency5(exch)} XRP
                        </Typography>
                        <Tooltip title="24h(%)">
                            {pro24h < 0 ? (
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
                        <Tooltip title="7d(%)">
                            {pro7d < 0 ? (
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
                </Stack>
            </Stack>
            <Box
                component="img"
                alt=""
                sx={{ maxWidth:'none', width: 270, height: 100, mt: 2 }}
                src={`${BASE_URL}/sparkline/${md5}`}
            />
        </Stack>
    );
}
