import axios from 'axios'
import Decimal from 'decimal.js';
// import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Material
import { withStyles } from '@mui/styles';
import {
    alpha, styled, useTheme,
    Button,
    Card,
    Checkbox,
    FormControlLabel,
    Grid,
    MenuItem,
    Stack,
    TextField,
    Typography
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import LoopIcon from '@mui/icons-material/Loop';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Loader
import { PuffLoader } from "react-spinners";


// Components
import PayMethod from './PayMethod';

// Utils
import { fIntNumber, fNumber } from 'src/utils/formatNumber';

const Label = withStyles({
    root: {
        color: alpha('#637381', 0.99),
    }
})(Typography);

function GetNum(amount) {
    let num = 0;
    try {
        num = new Decimal(amount).toNumber();
        if (num < 0) num = 0;
    } catch (err) {}
    return num;
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            // width: 180,
        },
    },
};

export default function BuyCrypto({fiats, coins}) {
    const BASE_URL = 'https://api.xrpl.to/api';

    const [fiat, setFiat] = useState('USD');
    const [coin, setCoin] = useState('XRP');
    const [fiatAmount, setFiatAmount] = useState('0');
    const [coinAmount, setCoinAmount] = useState('0');
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [disclaimer, setDisclaimer] = useState(false);

    const [selPay, setSelPay] = useState(0);
    const [error, setError] = useState(0);

    const [sync, setSync] = useState(0);
    const [counter, setCounter] = useState(60);
    
    const { accountProfile, darkMode } = useContext(AppContext);
    const admin = accountProfile && accountProfile.account && accountProfile.admin;

    const banxa_black = "/banxa-logo-black.png";
    const banxa_white = "/banxa-logo-white.png";
    
    const banxa_img = darkMode?banxa_white:banxa_black;

    let limit_min = 0;
    let limit_max = 0;
    if (prices.length > 0) {
        const m = prices[selPay];
        try {
            limit_min = m.transaction_limit.min;
            limit_max = m.transaction_limit.max;
        } catch (err) {}
    }

    let isBuyCryptoDisabled = true;
    const amount = GetNum(fiatAmount);
    if (amount > 0 && limit_min > 0 && amount > limit_min && amount < limit_max && disclaimer)
        isBuyCryptoDisabled = false;

    useEffect(() => {
        const getPrices=() => {
            // https://xrplto.banxa-sandbox.com/
            // https://api.xrpl.to/api/banxa/prices?source_amount=100&source=USD&target=XRP
            const amount = GetNum(fiatAmount);
            setCounter(0);

            if (amount === 0) {
                setCoinAmount('0');
                return;
            }

            setLoading(true);
            axios.get(`${BASE_URL}/banxa/prices?source_amount=${amount}&source=${fiat}&target=XRP`)
            .then(res => {
                try {
                    if (res.status === 200 && res.data) {
                        const prices = res.data.prices;
                        setPrices(prices);
                        setCoinAmount(prices[0].coin_amount);
                        setSelPay(0);
                    }
                } catch (error) {
                    setCoinAmount('0');
                    console.log(error);
                }
            }).catch(err => {
                setCoinAmount('0');
                console.log("err->>", err);
            }).then(function () {
                // Always executed
                setLoading(false);
                setCounter(60);
            });
        };

        let timer = setTimeout(getPrices, 800);

        return () => {
            clearTimeout(timer);
        };
    }, [sync]); // fiat, fiatAmount

    useEffect(() => {
        const loop = () => {
            if (counter > 0) {
                counter--;
                setCounter(counter)
                if (counter === 0) {
                    setSync(sync + 1);
                }
            }
        };

        let timer = null;
        if (counter > 0)
            timer = setTimeout(loop, 1000);

        return () => {
            if (timer)
                clearTimeout(timer);
        };
    }, [counter]);


    useEffect(() => {
        if (prices.length > 0) {
            const idx = selPay;
            setCoinAmount(prices[idx].coin_amount);
        } else {
            setCoinAmount('0');
        }
    }, [selPay]);

    const handleChangeAmount = (e) => {
        setFiatAmount(e.target.value);
        setSync(sync + 1);
    }

    const handleChangeFiat = (e) => {
        setFiat(e.target.value);
        setSync(sync + 1);
    }

    const handleBuyCrypto = (e) => {
    }

    const handleRefresh = (e) => {
        setCounter(0);
        setCoinAmount('0');
        setSync(sync + 1);
    }

    const handleChangeDisclaimer = (e) => {
        setDisclaimer(e.target.checked);
    };

    return (
        <>
            {/* {admin &&
                <Stack sx={{ mt:2, mb:2, display: { xs: 'none', sm: 'none', md: 'none', lg: 'block' } }}>
                    <WidgetNew showNew={showNew} setShowNew={updateShowNew}/>
                    <WidgetSlug showSlug={showSlug} setShowSlug={updateShowSlug}/>
                    <WidgetDate showDate={showDate} setShowDate={updateShowDate}/>
                    <EditToken token={editToken} setToken={setEditToken}/>
                </Stack>
            } */}
            <Stack alignItems="center" sx={{mt:5, mb:3}}>
                <Typography variant="h2a">Buy Crypto with Fiat</Typography>
            </Stack>

            <Stack sx={{mt:5, mb:3}}>
                <Typography variant="h4a">I WANT TO SPEND</Typography>
                <Stack direction="row">
                    <TextField
                        id="input-with-sx1"
                        variant="outlined"
                        label=""
                        placeholder="Enter Amount"
                        value={fiatAmount}
                        onChange={handleChangeAmount}
                        onFocus={event => {
                            event.target.select();
                        }}
                        sx={{
                            width: '75%',
                            '& .MuiOutlinedInput-root' : {
                                borderTopRightRadius: 0,
                                borderBottomRightRadius: 0,
                            }
                        }}
                    />
                    <TextField
                        id="outlined-select-currency1"
                        select
                        label=""
                        value={fiat}
                        onChange={handleChangeFiat}
                        helperText=""
                        sx={{
                            width: '25%',
                            '& .MuiOutlinedInput-root' : {
                                borderTopLeftRadius: 0,
                                borderBottomLeftRadius: 0,
                            }
                        }}
                        SelectProps={{
                            MenuProps
                        }}
                    >
                        {fiats.map((f, idx) => (
                            <MenuItem key={idx + "_" + f.fiat_code} value={f.fiat_code}>
                                {f.fiat_code}
                            </MenuItem>
                        ))}
                    </TextField>
                </Stack>
                {limit_min > 0 &&
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <ErrorOutlineOutlinedIcon fontSize="small" color="error"/>
                        <Typography variant="p3">Min: {fIntNumber(limit_min)} {fiat} - Max: {fIntNumber(limit_max)} {fiat}</Typography>
                    </Stack>
                }
            </Stack>

            <Stack alignItems="center" sx={{mt:4}}>
                <CurrencyExchangeIcon fontSize="large"/>
            </Stack>

            <Stack sx={{mt:3, mb:3}}>
                <Typography variant="h4a">You will get</Typography>
                <Stack direction="row">
                    <TextField
                        fullWidth
                        disabled
                        id="input-with-sx2"
                        variant="outlined"
                        label=""
                        placeholder="Enter Amount"
                        value={coinAmount}
                        onFocus={event => {
                            event.target.select();
                        }}
                        sx={{
                            width: '75%',
                            '& .MuiOutlinedInput-root' : {
                                borderTopRightRadius: 0,
                                borderBottomRightRadius: 0,
                            }
                        }}
                    />
                    <TextField
                        disabled
                        id="outlined-select-currency2"
                        select
                        label=""
                        value={coin}
                        helperText=""
                        sx={{
                            width: '25%',
                            '& .MuiOutlinedInput-root' : {
                                borderTopLeftRadius: 0,
                                borderBottomLeftRadius: 0,
                            }
                        }}
                    >
                        <MenuItem key={'XRP'} value={'XRP'}>
                            XRP
                        </MenuItem>
                    </TextField>
                </Stack>
            </Stack>

            {(fiatAmount !== '0' || coinAmount !== '0') &&
                <Stack sx={{mt:5, mb:3}}>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={2}
                    >
                        <Stack>
                            <Typography variant="h4a" sx={{mb:2}}>Payment methods</Typography>
                            <Typography variant="p2" sx={{mb:2}}>Select a payment method</Typography>
                        </Stack>

                        {counter > 0 &&
                            <LoadingButton
                                size="small"
                                onClick={handleRefresh}
                                loading={loading}
                                variant="outlined"
                                color={"error"}
                                sx={{mt:0}}
                            >
                                {`Refresh (${counter})`}
                            </LoadingButton>
                        }
                    </Stack>

                    {loading ?
                        <Stack alignItems="center" sx={{mt: 5, mb: 5}}>
                            <PuffLoader color={"#00AB55"} size={35} sx={{mt:5, mb:5}}/>
                        </Stack>
                    :(
                        <Grid container spacing={3} sx={{p:0}}>
                            {prices.map((m, idx) => (
                                <Grid key={idx} item xs={12} sm={4}>
                                    <PayMethod method={m} idx={idx} selected={selPay} setSelected={setSelPay}/>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Stack>
            }

            <Stack sx={{mt:5, mb:3}}>
                <Typography variant="h4a" sx={{mb:2}}>Service Provider Info</Typography>
                <Card variant="outlined" sx={{p:3}}>
                    <Stack direction="row" spacing={2} sx={{mb: 5}}>
                        <img
                            alt={'banxa'}
                            src={banxa_img}
                            style={{
                                width:'30%',
                                justifySelf: 'center',
                                objectFit: 'contain'
                            }}
                        />
                        <Stack sx={{width:'70%'}}>
                            <Typography variant="p2">You will receive <Typography variant="s1" noWrap> ≈ {fNumber(coinAmount)} XRP</Typography></Typography>
                            <Typography variant="p3" noWrap>Up to 48 hours</Typography>
                        </Stack>
                    </Stack>

                    <FormControlLabel control={<Checkbox checked={disclaimer} onChange={handleChangeDisclaimer}/>}
                        label="I understand that I will be purchasing cryptocurrency directly through 3rd party service providers. The XRPL.to is a decentralized platform; hence, will not take responsability for any issues that may affect my transactions through the 3rd party service providers."
                    />

                    <Stack alignItems='flex-end'>
                        <Button
                            disabled={isBuyCryptoDisabled}
                            variant="outlined"
                            sx={{ mt: 3 }}
                            onClick={handleBuyCrypto}
                            color={error > 0 ? 'error':'primary'}
                        >
                            BUY CRYPTO
                        </Button>
                    </Stack>
                </Card>
            </Stack>
        </>
    );
}
