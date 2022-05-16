// material
import PropTypes from 'prop-types';
import { useState } from 'react';
import { /*alpha,*/ styled, useTheme } from '@mui/material/styles';
// import { withStyles } from '@mui/styles';
import { makeStyles } from "@mui/styles";

import {
    Avatar,
    Box,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    Link,
    MenuItem,
    Select,
    Stack,
    Switch,
    Tooltip,
    Typography
} from '@mui/material';
import { Icon } from '@iconify/react';
import arrowsExchange from '@iconify/icons-gg/arrows-exchange';
import OrderBook from "./OrderBook";
import History from './History';

import Inbox from '@mui/icons-material/Inbox';
import SellIcon from '@mui/icons-material/Sell';
// ----------------------------------------------------------------------
// utils
import { fNumber } from '../../../utils/formatNumber';
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
const StackStyle = styled(Stack)(({ theme }) => ({
    //boxShadow: theme.customShadows.z0,
    //backdropFilter: 'blur(2px)',
    //WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
    //backgroundColor: alpha(theme.palette.background.default, 0.0),
    //borderRadius: '13px',
    //padding: '0em 0.5em 1.5em 0.5em',
    //backgroundColor: alpha("#919EAB", 0.03),
}));

const CustomSelect = styled(Select)(({ theme }) => ({
    // '& .MuiOutlinedInput-notchedOutline' : {
    //     border: 'none'
    // }
}));
// ----------------------------------------------------------------------

const badge24hStyle = {
    display: 'inline-block',
    marginLeft: '4px',
    marginRight: '4px',
    color: '#C4CDD5',
    fontSize: '11px',
    fontWeight: '500',
    lineHeight: '18px',
    //backgroundColor: '#323546',
    borderRadius: '4px',
    border: '1px solid #323546',
    padding: '1px 4px'
};

const badgeDEXStyle = {
    display: 'inline-block',
    marginLeft: '4px',
    marginRight: '4px',
    color: '#C4CDD5',
    fontSize: '11px',
    fontWeight: '500',
    lineHeight: '18px',
    // backgroundColor: '#7A0C2E',
    borderRadius: '4px',
    border: '1px solid #B78103',
    padding: '1px 4px'
};

const StackDexStyle = styled(Stack)(({ theme }) => ({
    display: 'inline-block',
    marginLeft: '4px',
    marginRight: '4px',
    color: '#C4CDD5',
    fontSize: '11px',
    fontWeight: '500',
    lineHeight: '18px',
    // backgroundColor: '#7A0C2E',
    borderRadius: '8px',
    border: `1px solid ${theme.palette.divider}`,
    padding: '0px 12px'
}));

const MaterialUISwitch = styled(Switch)(({ theme }) => ({
    width: 62,
    height: 34,
    padding: 7,
    '& .MuiSwitch-switchBase': {
        margin: 1,
        padding: 0,
        transform: 'translateX(6px)',
        '&.Mui-checked': {
            color: '#fff',
            transform: 'translateX(22px)',
            // '& .MuiSwitch-thumb:before': {
            //     backgroundColor: '#FF484288'
            // },
            '& + .MuiSwitch-track': {
                opacity: 1,
                backgroundColor: '#FF484288',
            },
        },
    },
    '& .MuiSwitch-thumb': {
        backgroundColor: '#FF4842',
        width: 32,
        height: 32,
        '&:before': {
            content: "''",
            position: 'absolute',
            width: '100%',
            height: '100%',
            left: 0,
            top: 0,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
        },
    },
    '& .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: '#00AB5588',
        borderRadius: 20 / 2,
    },
}));

const AntSwitch = styled(Switch)(({ theme }) => ({
    width: 28,
    height: 16,
    padding: 0,
    display: 'flex',
    '&:active': {
        '& .MuiSwitch-thumb': {
            width: 15,
        },
        '& .MuiSwitch-switchBase.Mui-checked': {
            transform: 'translateX(9px)',
        },
    },
    '& .MuiSwitch-switchBase': {
        padding: 2,
        '&.Mui-checked': {
            transform: 'translateX(12px)',
            color: '#fff',
            '& + .MuiSwitch-track': {
                opacity: 1,
                backgroundColor: '#FF484288',
            },
        },
    },
    '& .MuiSwitch-thumb': {
        boxShadow: '0 2px 4px 0 rgb(0 35 11 / 20%)',
        width: 12,
        height: 12,
        borderRadius: 6,
        transition: theme.transitions.create(['width'], {
            duration: 200,
        }),
    },
    '& .MuiSwitch-track': {
        borderRadius: 16 / 2,
        opacity: 1,
        backgroundColor: '#00AB5588',
        boxSizing: 'border-box',
    },
}));

// function getPair(issuer, code) {
//     // issuer, currencyCode, 'XRP', undefined
//     const t1 = 'undefined_XRP';
//     const t2 = issuer  + '_' +  code;
//     let pair = t1 + t2;
//     if (t1.localeCompare(t2) > 0)
//         pair = t2 + t1;
//     return MD5(pair).toString();
// }

// function getInitialPair(pairs) {
//     if (pairs.length > 0)
//         return pairs[0].pair;
//     return '';
// }

export default function TradeData({token, pairs, pair, setPair, asks, bids}) {
    const [sel, setSel] = useState(1);

    const handleChangePair = (event, value) => {
        const idx = parseInt(event.target.value, 10);
        setSel(idx);
        setPair(pairs[idx-1]);
    }

    const curr1 = pair.curr1;
    const curr2 = pair.curr2;

    let soloDexURL = '';
    if (curr2.issuer)
        soloDexURL = `https://sologenic.org/trade?network=mainnet&market=${curr1.currency}%2B${curr1.issuer}%2F${curr2.currency}%2B${curr2.issuer}`;
    else
        soloDexURL = `https://sologenic.org/trade?network=mainnet&market=${curr1.currency}%2B${curr1.issuer}%2F${curr2.currency}`;

    let gatehubDexURL = '';
    if (curr2.issuer)
        gatehubDexURL = `https://gatehub.net/markets/${curr1.currency}+${curr1.issuer}/${curr2.currency}+${curr2.issuer}`;
    else
        gatehubDexURL = `https://gatehub.net/markets/${curr1.currency}+${curr1.issuer}/${curr2.currency}`;
        

    let xummDexURL = `https://xumm.app/detect/xapp:xumm.dex?issuer=${curr1.issuer}&currency=${curr1.currency}`;

    return (
        <StackStyle>
            <Stack direction="row">
                <Stack alignItems="left">
                    <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                        <InputLabel id="demo-select-small">Pairs</InputLabel>
                        <CustomSelect
                            labelId="demo-select-small"
                            id="demo-select-small"
                            value={sel}
                            label="Pair"
                            onChange={handleChangePair}
                        >
                            {
                            pairs.map((row) => {
                                    const {
                                        id,
                                        pair,
                                        curr1,
                                        curr2
                                    } = row;

                                    const name1 = curr1.name;
                                    const name2 = curr2.name;

                                    return (
                                        <MenuItem key={id} value={id}>
                                            <Stack direction="row" alignItems='center'>
                                                <Typography variant="subtitle2" sx={{ color: '#B72136' }}>{name1}</Typography>
                                                <Icon icon={arrowsExchange} width="16" height="16"/>
                                                <Typography variant="subtitle2" sx={{ color: '#007B55' }}>{name2}</Typography>
                                                <span style={badge24hStyle}>24h</span>
                                                <Typography variant="subtitle2" sx={{ color: '#B72136' }}>{fNumber(curr1.value)}</Typography>
                                            </Stack>
                                        </MenuItem>
                                    );
                                })
                            }
                        </CustomSelect>
                    </FormControl>
                    <Stack direction="row">
                    {/* B78103 */}
                        <StackDexStyle direction="row" sx={{ m: 1, minWidth: 120 }} spacing={2} alignItems="center">
                            DEX
                            <Tooltip title="Sologenic">
                                <Link
                                    underline="none"
                                    color="inherit"
                                    target="_blank"
                                    href={soloDexURL}
                                    rel="noreferrer noopener"
                                >
                                    <IconButton edge="end" aria-label="solo">
                                        <Avatar variant="rounded" alt="sologenic" src="/static/solo.jpg" sx={{ width: 24, height: 24 }} />
                                    </IconButton>
                                </Link>
                            </Tooltip>
                            <Tooltip title="GateHub">
                                <Link
                                    underline="none"
                                    color="inherit"
                                    target="_blank"
                                    href={gatehubDexURL}
                                    rel="noreferrer noopener"
                                >
                                    <IconButton edge="end" aria-label="solo">
                                        <Avatar variant="rounded" alt="gatehub" src="/static/gatehub.jpg" sx={{ width: 24, height: 24 }} />
                                    </IconButton>
                                </Link>
                            </Tooltip>
                            <Tooltip title="XUMM">
                                <Link
                                    underline="none"
                                    color="inherit"
                                    target="_blank"
                                    href={xummDexURL}
                                    rel="noreferrer noopener"
                                >
                                    <IconButton edge="end" aria-label="solo">
                                        <Avatar variant="rounded" alt="xumm" src="/static/xumm.jpg" sx={{ width: 24, height: 24 }} />
                                    </IconButton>
                                </Link>
                            </Tooltip>
                        </StackDexStyle>
                    </Stack>
                    {/* <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption">24H Volume:</Typography>
                        <Typography variant="h5" sx={{ color: '#B72136' }}>{fNumber(vol)}</Typography>
                    </Stack> */}
                </Stack>
                <StackDexStyle sx={{ m: 1, minWidth: 200 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant='h6'>Buy</Typography>
                        <AntSwitch defaultChecked inputProps={{ 'aria-label': 'ant design' }} />
                        <Typography variant='h6'>Sell</Typography>
                    </Stack>
                </StackDexStyle>
            </Stack>
            
            <Grid container spacing={3} sx={{p:0}}>
                <Grid item xs={12} md={4} lg={4}>
                    <History token={token} pair={pair}/>
                </Grid>
                <Grid item xs={12} md={8} lg={8}>
                    <OrderBook token={token} pair={pair} asks={asks} bids={bids}/>
                </Grid>
            </Grid>
        </StackStyle>
    );
}
