import { fNumber } from '../../../utils/formatNumber';

import {
    Avatar,
    Chip,
    Box,
    Stack,
    Typography
} from '@mui/material';

import { useSelector } from "react-redux";
import { selectStatus } from "../../../redux/statusSlice";
import BearBullChip from './BearBullChip';
import LowHighBar24H from './LowHighBar24H';

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
                <BearBullChip value={p24h[0]} tooltip='24h(%)'/>
                <BearBullChip value={p7d[0]} tooltip={
                    <Stack alignItems='center'>
                        7d (%)
                        <Box
                            component="img"
                            alt=""
                            sx={{ width: 135, height: 50, mt: 2 }}
                            src={`${BASE_URL}/sparkline/${md5}`}
                        />
                    </Stack>
                }/>
            </Stack>

            <LowHighBar24H token={token}/>
        </Stack>
    );
}
