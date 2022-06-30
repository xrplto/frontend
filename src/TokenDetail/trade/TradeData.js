
import { useState } from 'react';

// Material
// import { makeStyles } from "@mui/styles";
import { styled/*, alpha, useTheme*/ } from '@mui/material/styles';
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
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography
} from '@mui/material';

import {
    Token as TokenIcon,
    PriceChange as PriceChangeIcon,
    SwapVerticalCircle as SwapVerticalCircleIcon,
} from '@mui/icons-material';

// Chart
import { Chart } from 'src/components/Chart';

// Iconify
import { Icon } from '@iconify/react';
import arrowsExchange from '@iconify/icons-gg/arrows-exchange';

// Components
import ChartOptions from './ChartOptions';
import OrderBook from "./OrderBook";
import History from './History';
import AccountOrdersHistory from './AccountOrdersHistory';
import AccountBalance from './AccountBalance';
import PlaceOrder from './PlaceOrder';

// Utils
import { fNumber } from 'src/utils/formatNumber';

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

const StackDexStyle = styled(Stack)(({ theme }) => ({
    width: '100%',
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

// const useStyles = makeStyles({
//     gridItem: {
//       border: "1px solid red"
//     }
// });

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

function getChartData(offers) {
    let data = [];
    for (var o of offers.slice(0, 30)) {
        data.push([o.price, o.sumAmount]);
    }
    
    return data;
}

export default function TradeData({pairs, pair, setPair, asks, bids, tradeExchs}) {
    const [buySell, setBuySell] = useState('BUY');
    const [amount, setAmount] = useState('');
    const [price, setPrice] = useState('');
    const [value, setValue] = useState('');

    const CHART_DATA = [
        {
            name: 'BID',
            type: 'area',
            data: getChartData(bids)
        },
        {
            name: 'ASK',
            type: 'area',
            data: getChartData(asks)
        },
    ];

    const CHART_OPTION = ChartOptions();

    const curr1 = pair.curr1;
    const curr2 = pair.curr2;

    const handleChangePair = (event, value) => {
        //const idx = parseInt(event.target.value, 10);
        const strPair = event.target.value;
        const newPair = pairs.find(e => e.pair === strPair);
        if (newPair)
            setPair(newPair);
    }

    const handleChangeBuySell = (event, newValue) => {
        if (newValue)
            setBuySell(newValue);
    };

    const onBidClick = (e, idx) => {
        setBuySell('SELL');
        const bid = bids[idx];
        const sumAmount = bid.sumAmount.toFixed(2);
        const sumValue = bid.sumValue.toFixed(5);
        const price = bid.price.toFixed(5);
        setAmount(sumAmount);
        setPrice(price);
        setValue(sumValue);
    }

    const onAskClick = (e, idx) => {
        setBuySell('BUY');
        const ask = asks[idx];
        const sumAmount = ask.sumAmount.toFixed(2);
        const sumValue = ask.sumValue.toFixed(5);
        const price = ask.price.toFixed(5);
        setAmount(sumAmount);
        setPrice(price);
        setValue(sumValue);
    }

    const handleChangeAmount = (e) => {
        const amt = e.target.value;
        setAmount(amt);
        const val = (amt * price).toFixed(6);
        setValue(val);
    }

    const handleChangePrice = (e) => {
        const newPrice = e.target.value;
        setPrice(newPrice);
        const val = (amount * newPrice).toFixed(6);
        setValue(val);
    }

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
                <Stack direction='row' alignItems="left">
                    <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                        <InputLabel id="demo-select-small">Pairs</InputLabel>
                        <CustomSelect
                            labelId="demo-select-small"
                            id="demo-select-small"
                            value={pair.pair}
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
                                        <MenuItem key={id} value={pair}>
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
                        <StackDexStyle direction="row" sx={{ m: 1, minWidth: 120 }} spacing={2} alignItems="center">
                            DEX
                            <Tooltip title="Sologenic">
                                <Link
                                    underline="none"
                                    color="inherit"
                                    target="_blank"
                                    href={soloDexURL}
                                    rel="noreferrer noopener nofollow"
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
                                    rel="noreferrer noopener nofollow"
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
                                    rel="noreferrer noopener nofollow"
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
            </Stack>
            
            {/* https://mui.com/system/display/ */}

            <Grid container spacing={0} sx={{p:0}}>
                <Grid item xs={12} md={9.5} lg={9.5} >
                    <Grid container spacing={3} sx={{p:0}}>
                        <Grid item xs={12} md={4.5} lg={4.5} sx={{ display: { xs: 'none', sm: 'none', md: 'block' } }}>
                            <History pair={pair} tradeExchs={tradeExchs}/>
                        </Grid>
                        <Grid item xs={12} md={7.5} lg={7.5}>
                            <OrderBook pair={pair} asks={asks} bids={bids} onBidClick={onBidClick} onAskClick={onAskClick}/>
                        </Grid>
                        <Grid item xs={12} md={12} lg={12} sx={{ display: { xs: 'none', sm: 'none', md: 'block' } }}>
                            <AccountOrdersHistory pair={pair}/>
                        </Grid>
                    </Grid>
                </Grid>
                
                <Grid item xs={12} md={2.5} lg={2.5}>
                    <Stack spacing={1} alignItems="center">
                        <Typography variant='subtitle1' sx={{color:'#FFC107', textAlign: 'center', ml:0, mt:2, mb:0}}>Trade Now</Typography>
                        {/* <Stack direction="row" alignItems='center'>
                            <Typography variant="subtitle2" sx={{ color: '#B72136' }}>{curr1.name}</Typography>
                            <Icon icon={arrowsExchange} width="16" height="16"/>
                            <Typography variant="subtitle2" sx={{ color: '#007B55' }}>{curr2.name}</Typography>
                        </Stack> */}
                    </Stack>
                    <StackDexStyle spacing={2} sx={{ m: 1, mt:4, pt:2, pb:2 }}>
                        <AccountBalance pair={pair}/>

                        <ToggleButtonGroup
                            color="primary"
                            // orientation="vertical"
                            value={buySell}
                            fullWidth
                            exclusive
                            onChange={handleChangeBuySell}
                        >
                            <ToggleButton sx={{pt:0.5,pb:0.5}} value="BUY">BUY</ToggleButton>
                            <ToggleButton color="error" sx={{pt:0.5, pb:0.5}} value="SELL">SELL</ToggleButton>
                        </ToggleButtonGroup>

                        <Stack alignItems="center">

                            {buySell === 'BUY' &&
                                <Typography variant='caption' alignItems={'center'}>
                                    Get <Typography variant="caption" sx={{ color: '#B72136' }}>{curr1.name}</Typography> by selling <Typography variant="caption" sx={{ color: '#007B55' }}>{curr2.name}</Typography>
                                </Typography>
                            }

                            {buySell === 'SELL' &&
                                <Typography variant='caption' alignItems={'center'}>
                                    Sell <Typography variant="caption" sx={{ color: '#B72136' }}>{curr1.name}</Typography> to get <Typography variant="caption" sx={{ color: '#007B55' }}>{curr2.name}</Typography>
                                </Typography>
                            }

                        </Stack>

                        <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                            <TokenIcon sx={{ color: 'action.active', mr: 1.5, my: 0.5 }} />
                            <TextField id="input-with-sx1" label="Amount" value={amount} onChange={handleChangeAmount} variant="standard"/>
                            <Typography variant="caption" color='#FF4842'>{curr1.name}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                            <PriceChangeIcon sx={{ color: 'action.active', mr: 1.5, my: 0.5 }} />
                            <TextField id="input-with-sx2" label="Price" value={price} onChange={handleChangePrice} variant="standard"/>
                            <Typography variant="caption" color='#00AB5588'>{curr2.name}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                            <SwapVerticalCircleIcon sx={{ color: 'action.active', mr: 1.5, my: 0.5 }} />
                            <Typography>Total ≈</Typography>
                            <Box sx={{ flexGrow: 1 }} />
                            <Typography alignItems='right'>{value} <Typography variant="caption"> {curr2.name}</Typography></Typography>
                        </Box>
                        <PlaceOrder buySell={buySell} pair={pair} amount={amount} value={value}/>
                    </StackDexStyle>

                    <StackDexStyle spacing={0} sx={{ m: 1, mt:4, pt:1, pb:0, pl:0 }}>
                        <Chart series={CHART_DATA} options={CHART_OPTION} height={256} />
                    </StackDexStyle>
                </Grid>
            </Grid>
        </StackStyle>
    );
}
