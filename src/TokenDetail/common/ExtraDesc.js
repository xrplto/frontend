import Decimal from 'decimal.js';

// Material
import { withStyles } from '@mui/styles';
import {
    useTheme,
    Divider,
    Grid,
    Stack,
    Tooltip,
    Typography
} from '@mui/material';

// Iconify
import { Icon } from '@iconify/react';
import infoFilled from '@iconify/icons-ep/info-filled';

// Utils
import { fNumber } from 'src/utils/formatNumber';

// Redux
import { useSelector } from "react-redux";
import { selectMetrics } from "src/redux/statusSlice";

// ----------------------------------------------------------------------
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
    const theme = useTheme();
    const metrics = useSelector(selectMetrics);

    const {
        name,
        amount,
        exch,
        vol24h,
        /*vol24htx,
        holders,
        offers,
        id
        issuer,
        currency,
        date,
        trustlines,*/
    } = token;
  
    let user = token.user;
    if (!user) user = name;

    const marketcap = fNumber(amount * exch / metrics.USD);
    const supply = fNumber(amount);
    const volume = fNumber(vol24h);
    const voldivmarket = Decimal.div(vol24h, amount).toNumber(); // .toFixed(5, Decimal.ROUND_DOWN)

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
            
            

            <Grid item container>
                <Grid container item xs={12} sx={{ display: { xs: 'block', md: 'none' } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" alignItems="center" gap={1}>
                            <Typography variant="body1">Market Cap</Typography>
                            <Tooltip title={<Typography variant="body2">The total market value of a cryptocurrency's circulating supply.<br/>It is analogous to the free-float capitalization in the stock market.<br/>Market Cap = Current Price x Circulating Supply.</Typography>}>
                                <Icon icon={infoFilled} />
                            </Tooltip>
                        </Stack>

                        <MarketTypography variant="body1">$ {marketcap}</MarketTypography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{mt: 1}}>
                        <Stack direction="row" alignItems="center" gap={1}>
                            <Typography variant="body1">Volume (24h)</Typography>
                            <Tooltip title={<Typography variant="body2">A measure of how much of a token was traded in the last 24 hours.</Typography>}>
                                <Icon icon={infoFilled} />
                            </Tooltip>
                        </Stack>
                        <VolumeTypography variant="body1">{volume} <VolumeTypography variant="small"> {name}</VolumeTypography></VolumeTypography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{mt: 1}}>
                        <Typography variant="body1">Volume / Marketcap</Typography>
                        <VolumeTypography variant="body1">{fNumber(voldivmarket)}</VolumeTypography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{mt: 1}}>
                        <Stack direction="row" alignItems="center" gap={1}>
                            <Typography variant="body1">Circulating Supply</Typography>
                            <Tooltip title={<Typography variant="body2">The amount of coins that are circulating in the market and are in public hands. It is analogous to the flowing shares in the stock market.</Typography>}>
                                <Icon icon={infoFilled} />
                            </Tooltip>
                        </Stack>
                        <SupplyTypography variant="body1">{supply}</SupplyTypography>
                    </Stack>
                </Grid>

                <Grid item xs={12} md={4} sx={{display: { xs: 'none', md: 'block' }, borderRight: '1px solid', borderRightColor: theme.palette.divider}}>
                    <Stack direction="row" alignItems="center" gap={1} sx={{pl:3}}>
                        <Typography variant="body1">Market Cap</Typography>
                        <Tooltip title={<Typography style={{display: 'inline-block'}} variant="body2">The total market value of a cryptocurrency's circulating supply.<br/>It is analogous to the free-float capitalization in the stock market.<br/>Market Cap = Current Price x Circulating Supply.</Typography>}>
                            <Icon icon={infoFilled} />
                        </Tooltip>
                    </Stack>
                    <Stack alignItems="center">
                        <MarketTypography variant="desc" sx={{mt:3,mb:3}}>$ {marketcap}</MarketTypography>
                    </Stack>
                </Grid>

                <Grid item xs={12} md={4} sx={{display: { xs: 'none', md: 'block' }, borderRight: '1px solid', borderRightColor: theme.palette.divider}}>
                    <Stack direction="row" alignItems="center" gap={1} sx={{pl:3}}>
                        <Typography variant="body1">Volume (24h)</Typography>
                        <Tooltip title={<Typography variant="body2">A measure of how much of a token was traded in the last 24 hours.</Typography>}>
                            <Icon icon={infoFilled} />
                        </Tooltip>
                    </Stack>
                    <Stack alignItems="center">
                        <VolumeTypography variant="desc" sx={{mt:3,mb:2}}>{volume} <VolumeTypography variant="small"> {name}</VolumeTypography></VolumeTypography>
                    </Stack>

                    <Typography variant="body1" sx={{pl:3}}>Volume / Marketcap</Typography>

                    <Stack alignItems="center">
                        <VolumeTypography variant="subtitle2" sx={{mt:1,mb:1}}>{fNumber(voldivmarket)}</VolumeTypography>
                    </Stack>
                </Grid>

                <Grid item xs={12} md={4} sx={{display: { xs: 'none', md: 'block' } }}>
                    <Stack direction="row" alignItems="center" gap={1} sx={{pl:3}}>
                        <Typography variant="body1">Circulating Supply</Typography>
                        <Tooltip title={<Typography variant="body2">The amount of coins that are circulating in the market and are in public hands. It is analogous to the flowing shares in the stock market.</Typography>}>
                            <Icon icon={infoFilled} />
                        </Tooltip>
                    </Stack>
                    <Stack alignItems="center">
                        <SupplyTypography variant="desc" sx={{mt:3,mb:3}}>{supply}</SupplyTypography>
                    </Stack>
                </Grid>
            </Grid>
        </Stack>
    );
}
