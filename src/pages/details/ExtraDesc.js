//import { useState } from 'react';
import { withStyles } from '@mui/styles';

import { Icon } from '@iconify/react';
import infoFilled from '@iconify/icons-ep/info-filled';
import { selectStatus } from "../../redux/statusSlice";
import { fNumber } from '../../utils/formatNumber';
import { useSelector/*, useDispatch*/ } from "react-redux";
import {
    Divider,
    Grid,
    Stack,
    Tooltip,
    Typography
} from '@mui/material';

// const ActionButton = withStyles({
//     root: {
//       backgroundColor: "#007B55"
//     }
// })(Button);

const MarketTypography = withStyles({
    root: {
        color: "#2CD9C5"
    }
})(Typography);

const VolumeTypography = withStyles({
    root: {
        color: "#FF6C40"
    }
})(Typography);

const SupplyTypography = withStyles({
    root: {
        color: "#3366FF"
    }
})(Typography);

export default function ExtraDesc({token}) {

    const status = useSelector(selectStatus);

    const {
        name,
        amt,
        exch,
        vol24h,
        vol24ht,
        /*
        holders,
        offers,
        id
        acct,
        code,
        date,
        trline,*/
    } = token;
  
    let user = token.user;
    if (!user) user = name;

    const marketcap = fNumber(amt * exch / status.USD);
    const supply = fNumber(amt);
    const volume = fNumber(vol24h);

    return (
        <Stack spacing={2}>
            {/* <Stack direction="row" spacing={1} alignItems='start' justify="top">
                <ActionButton variant="contained" endIcon={<Icon icon={caretDown} width="16" height="16" />}>
                Buy
                </ActionButton>
                <ActionButton variant="contained" endIcon={<Icon icon={caretDown} width="16" height="16" />}>
                Exchange
                </ActionButton>
                <ActionButton variant="contained" endIcon={<Icon icon={caretDown} width="16" height="16" />}>
                Gaming
                </ActionButton>
                <ActionButton variant="contained" endIcon={<Icon icon={caretDown} width="16" height="16" />}>
                Earn Crypto
                </ActionButton>
            </Stack> */}
            
            <Divider orientation="horizontal" variant="middle" flexItem />

            <Grid item container direction="row" sx={{height:'100%'}}>
                <Grid item xs={4} sx={{pr:3, borderRight: '1px solid #323546'}}>
                    <Stack direction="row" alignItems="center" gap={1}>
                        <Typography variant="body1">Market Cap</Typography>
                        <Tooltip title={<Typography style={{display: 'inline-block'}} variant="body2">The total market value of a cryptocurrency's circulating supply.<br/>It is analogous to the free-float capitalization in the stock market.<br/>Market Cap = Current Price x Circulating Supply.</Typography>}>
                            <Icon icon={infoFilled} />
                        </Tooltip>
                    </Stack>
                    <Stack alignItems="start">
                        <MarketTypography variant="h5" sx={{mt:5,mb:5}}>$ {marketcap}</MarketTypography>
                    </Stack>
                    
                </Grid>
                <Grid item xs={4} sx={{pl:3, borderRight: '1px solid #323546'}}>
                    <Stack direction="row" alignItems="center" gap={1}>
                        <Typography variant="body1">Volume (24h)</Typography>
                        <Tooltip title={<Typography variant="body2">A measure of how much of a cryptocurrency was traded in the last 24 hours.</Typography>}>
                            <Icon icon={infoFilled} />
                        </Tooltip>
                    </Stack>
                    <Stack alignItems="center">
                        <VolumeTypography variant="h5" sx={{mt:5,mb:5}}>${volume}</VolumeTypography>
                    </Stack>
                </Grid>

                <Grid item xs={4} sx={{pl:3}}>
                    <Stack direction="row" alignItems="center" gap={1}>
                        <Typography variant="body1">Circulating Supply</Typography>
                        <Tooltip title={<Typography variant="body2">The amount of coins that are circulating in the market and are in public hands. It is analogous to the flowing shares in the stock market.</Typography>}>
                            <Icon icon={infoFilled} />
                        </Tooltip>
                    </Stack>
                    <Stack alignItems="start">
                        <SupplyTypography variant="h5" sx={{mt:5,mb:5}}>{supply}</SupplyTypography>
                    </Stack>
                </Grid>
            </Grid>
        </Stack>
    );
}
