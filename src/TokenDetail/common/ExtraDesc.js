import axios from 'axios';
import Decimal from 'decimal.js';
import { useState, useEffect } from 'react';

// Material
import { withStyles } from '@mui/styles';
import {
    useTheme,
    Checkbox,
    Divider,
    FormControlLabel,
    FormGroup,
    Grid,
    Stack,
    Tooltip,
    Typography
} from '@mui/material';

// Iconify
import { Icon } from '@iconify/react';
import infoFilled from '@iconify/icons-ep/info-filled';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Utils
import { fNumber } from 'src/utils/formatNumber';

// Redux
import { useSelector } from "react-redux";
import { selectMetrics } from "src/redux/statusSlice";

import NumberTooltip from 'src/components/NumberTooltip';

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

const TotalSupplyTypography = withStyles({
    root: {
        color: "#FFC107"
    }
})(Typography);

export default function ExtraDesc({token}) {
    const BASE_URL = 'https://api.xrpl.to/api';
    const theme = useTheme();
    const metrics = useSelector(selectMetrics);

    const { accountProfile, setLoading, openSnackbar } = useContext(AppContext);
    const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;

    const {
        md5,
        name,
        amount,
        supply,
        exch,
        vol24h,
        marketcap,
        vol24htx,
        vol24hx,
        vol24hxrp,
        holders,
        offers,
        id,
        issuer,
        currency,
        date,
        trustlines,
    } = token;

    const [omcf, setOMCF] = useState(token.isOMCF || "no"); // is Old Market Cap Formula
  
    let user = token.user;
    if (!user) user = name;

    const circulatingSupply = fNumber(supply);
    const totalSupply = fNumber(amount);
    const volume = fNumber(vol24hx);
    const voldivmarket = marketcap>0?Decimal.div(vol24hxrp, marketcap).toNumber():0; // .toFixed(5, Decimal.ROUND_DOWN)
    const usdMarketCap = Decimal.div(marketcap, metrics.USD).toNumber(); // .toFixed(5, Decimal.ROUND_DOWN)

    const onChangeMarketCalculation = async () => {
        setLoading(true);
        try {
            let res;

            const accountAdmin = accountProfile.account;
            const accountToken = accountProfile.token;

            const body = {md5};

            res = await axios.post(`${BASE_URL}/admin/toggle_marketcap_formula`, body, {
                headers: { 'x-access-account': accountAdmin, 'x-access-token': accountToken }
            });

            if (res.status === 200) {
                const ret = res.data;
                if (ret.status) {
                    setOMCF(ret.isOMCF);
                    openSnackbar('Successful!', 'success');
                } else {
                    const err = ret.err;
                    openSnackbar(err, 'error');
                }
            }
        } catch (err) {
            console.log(err);
        }
        setLoading(false);
    }

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
                {/* <Grid container item xs={12} sx={{ display: { xs: 'block', md: 'none' } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" alignItems="center" gap={1}>
                            <Typography variant="body1">Market Cap</Typography>
                            <Tooltip title={<Typography variant="body2">The total market value of a token's circulating supply represents its overall worth.<br/>This concept is similar to free-float capitalization in the stock market.<br/>{omcf==='yes'?'Market Capitalization = Price x Circulating Supply':'Market Capitalization = (Price x Circulating Supply) x (Average daily trading volume / Average daily trading volume for all tokens)'}.</Typography>}>
                                <Icon icon={infoFilled} />
                            </Tooltip>
                        </Stack>

                        <MarketTypography variant="body1">$ {fNumber(usdMarketCap)}</MarketTypography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{mt: 1}}>
                        <Stack direction="row" alignItems="center" gap={1}>
                            <Typography variant="body1">Volume (24h)</Typography>
                            <Tooltip title={<Typography variant="body2">A metric representing the trading volume of a token within the past 24 hours.</Typography>}>
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
                            <Tooltip title={<Typography variant="body2">The number of tokens in circulation within the market and held by the public is comparable to the concept of outstanding shares in the stock market.</Typography>}>
                                <Icon icon={infoFilled} />
                            </Tooltip>
                        </Stack>
                        <SupplyTypography variant="body1">{circulatingSupply}</SupplyTypography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{mt: 1}}>
                        <Typography variant="body1">Total Supply</Typography>
                        <TotalSupplyTypography variant="body1">{totalSupply}</TotalSupplyTypography>
                    </Stack>
                </Grid> */}

                <Grid item xs={12} md={4} sx={{display: { xs: 'none', md: 'block' }, borderRight: '1px solid', borderRightColor: theme.palette.divider}}>
                    <Stack direction="row" alignItems="center" gap={1} sx={{pl:3}}>
                        <Typography variant="body1">Market Cap</Typography>
                        <Tooltip title={<Typography style={{display: 'inline-block'}} variant="body2">The total market value of a token's circulating supply represents its overall worth.<br/>This concept is similar to free-float capitalization in the stock market.<br/>{omcf==='yes'?'Market Capitalization = Price x Circulating Supply':'Market Capitalization = (Price x Circulating Supply) x (Average daily trading volume / Average daily trading volume for all tokens)'}.</Typography>}>
                            <Icon icon={infoFilled} />
                        </Tooltip>
                        {isAdmin &&
                            <FormGroup sx={{ml: 2}}>
                                <FormControlLabel control={
                                    <Checkbox
                                        size="small"
                                        checked={omcf === 'yes'}
                                        onClick={() => {onChangeMarketCalculation()}}
                                        inputProps={{ 'aria-label': 'controlled' }}
                                    />
                                    }
                                    label="Use original formula"
                                />
                            </FormGroup>
                        }
                    </Stack>
                    <Stack alignItems="center">
                        <MarketTypography variant="desc" sx={{mt:3,mb:3}}>$ {fNumber(usdMarketCap)}</MarketTypography>
                    </Stack>
                </Grid>

                <Grid item xs={12} md={4} sx={{display: { xs: 'none', md: 'block' }, borderRight: '1px solid', borderRightColor: theme.palette.divider}}>
                    <Stack direction="row" alignItems="center" gap={1} sx={{pl:3}}>
                        <Typography variant="body1">Volume (24h)</Typography>
                        <Tooltip title={<Typography variant="body2">A metric representing the trading volume of a token within the past 24 hours.</Typography>}>
                            <Icon icon={infoFilled} />
                        </Tooltip>
                    </Stack>
                    <Stack alignItems="center">
                        <VolumeTypography variant="desc" sx={{mt:3,mb:2}}><NumberTooltip number={volume} /> <VolumeTypography variant="small"> {name}</VolumeTypography></VolumeTypography>
                    </Stack>

                    <Typography variant="body1" sx={{pl:3}}>Volume / Marketcap</Typography>

                    <Stack alignItems="center">
                        <VolumeTypography variant="subtitle2" sx={{mt:1,mb:1}}>{fNumber(voldivmarket)}</VolumeTypography>
                    </Stack>
                </Grid>

                <Grid item xs={12} md={4} sx={{display: { xs: 'none', md: 'block' } }}>
                    <Stack direction="row" alignItems="center" gap={1} sx={{pl:3}}>
                        <Typography variant="body1">Circulating Supply</Typography>
                        <Tooltip title={<Typography variant="body2">The number of tokens in circulation within the market and held by the public is comparable to the concept of outstanding shares in the stock market.</Typography>}>
                            <Icon icon={infoFilled} />
                        </Tooltip>
                    </Stack>
                    <Stack alignItems="center">
                        <SupplyTypography variant="desc" sx={{mt:3,mb:2}}>{circulatingSupply}</SupplyTypography>
                    </Stack>

                    <Typography variant="body1" sx={{pl:3}}>Total Supply</Typography>

                    <Stack alignItems="center">
                        <TotalSupplyTypography variant="desc" sx={{mt:1,mb:1}}>{totalSupply}</TotalSupplyTypography>
                    </Stack>
                </Grid>
            </Grid>
        </Stack>
    );
}
