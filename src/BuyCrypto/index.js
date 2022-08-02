import axios from 'axios'
import Decimal from 'decimal.js';
// import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Material
import {
    Grid,
    MenuItem,
    Stack,
    TextField,
    Typography
} from '@mui/material';
import LoopIcon from '@mui/icons-material/Loop';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';


// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Loader
import { PuffLoader } from "react-spinners";


// Components
import PayMethod from './PayMethod';

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

    const [selected, setSelected] = useState(0);
    
    const { accountProfile } = useContext(AppContext);
    const admin = accountProfile && accountProfile.account && accountProfile.admin;

    useEffect(() => {
        const getPrices=() => {
            // https://api.xrpl.to/api/banxa/prices?source_amount=100&source=USD&target=XRP
            const amount = GetNum(fiatAmount);
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
                        setCoinAmount(prices[0].coin_amount);
                        setSelected(0);
                        setPrices(prices);
                    }
                } catch (error) {
                    console.log(error);
                }
            }).catch(err => {
                console.log("err->>", err);
            }).then(function () {
                // Always executed
                setLoading(false);
            });
        };

        let timer = setTimeout(getPrices, 800);

        return () => {
            clearTimeout(timer);
        };
    }, [fiat, fiatAmount]);


    useEffect(() => {
        if (prices.length > 0) {
            const idx = selected;
            setCoinAmount(prices[idx].coin_amount);
        } else {
            setCoinAmount('0');
        }
    }, [selected]);

    const handleChangeAmount = (e) => {
        setFiatAmount(e.target.value);
    }

    const handleChangeFiat = (e) => {
        setFiat(e.target.value);
    }

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
                        {fiats.map((f) => (
                            <MenuItem key={f.fiat_code} value={f.fiat_code}>
                                {f.fiat_code}
                            </MenuItem>
                        ))}
                    </TextField>
                </Stack>
            </Stack>

            <Stack alignItems="center" sx={{mt:4}}>
                {loading ?
                    <PuffLoader color={"#00AB55"} size={35} />
                :
                    (<CurrencyExchangeIcon fontSize="large"/>)
                }
                
            </Stack>

            <Stack sx={{mt:3, mb:3}}>
                <Typography variant="h4a">You will get</Typography>
                <Stack direction="row">
                    <TextField
                        fullWidth
                        id="input-with-sx2"
                        variant="outlined"
                        label=""
                        placeholder="Enter Amount"
                        value={coinAmount}
                        sx={{
                            width: '75%',
                            '& .MuiOutlinedInput-root' : {
                                borderTopRightRadius: 0,
                                borderBottomRightRadius: 0,
                            }
                        }}
                    />
                    <TextField
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

            <Stack sx={{mt:5, mb:3}}>
                <Typography variant="h4a" sx={{mb:2}}>Payment methods</Typography>
                <Typography variant="p2" sx={{mb:2}}>Select a payment method</Typography>
                <Grid container spacing={3} sx={{p:0}}>
                    {prices.map((m, idx) => (
                        <Grid item xs={12} sm={4}>
                            <PayMethod method={m} idx={idx} selected={selected} setSelected={setSelected}/>
                        </Grid>
                    ))}
                </Grid>
            </Stack>
        </>
    );
}
