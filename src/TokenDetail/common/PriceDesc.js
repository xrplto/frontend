// Material
import {
    Avatar,
    Chip,
    Box,
    Stack,
    Typography
} from '@mui/material';

// Redux
import { useSelector } from "react-redux";
import { selectMetrics } from "src/redux/statusSlice";

// Components
import BearBullChip from './BearBullChip';
import LowHighBar24H from './LowHighBar24H';

// Utils
import { fNumber } from 'src/utils/formatNumber';
// ----------------------------------------------------------------------
export default function PriceDesc({token}) {
    const BASE_URL = 'https://api.xrpl.to/api'; // 'http://localhost/api';

    const metrics = useSelector(selectMetrics);

    const {
        name,
        exch,
        pro7d,
        pro24h,
        md5,
    } = token;

    let user = token.user;
    if (!user) user = name;

    return (
        <Stack>
            <Typography variant="h1" color='#33C2FF' fontSize='1.2rem'>{user} Price ({name})</Typography>
            <Stack direction="row" spacing={2} sx={{mt:0}} alignItems='center'>
                <Stack direction="row" spacing={1} alignItems='center'>
                    <Typography variant="price" noWrap>
                        $ {fNumber(exch / metrics.USD)}
                    </Typography>
                    <Typography variant="subtitle1" style={{marginTop:8}}>
                        {fNumber(exch)} XRP
                    </Typography>
                </Stack>
            </Stack>

            <Stack direction="row" spacing={1} sx={{mt:0.5}}>
                <BearBullChip value={pro24h} tooltip='24h(%)'/>
                <BearBullChip value={pro7d} tooltip={
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
