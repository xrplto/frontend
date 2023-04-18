import axios from 'axios';
import { useState, useEffect } from 'react';
import { withStyles } from '@mui/styles';
import Decimal from 'decimal.js';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import { LazyLoadImage, LazyLoadComponent } from 'react-lazy-load-image-component';

// Material
import {
    alpha, styled, useTheme,
    Avatar,
    Box,
    Button,
    Card,
    Chip,
    Container,
    FormControl,
    Grid,
    IconButton,
    Input,
    Link,
    MenuItem,
    Select,
    Stack,
    Tooltip,
    Typography
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import PersonIcon from '@mui/icons-material/Person';
import TokenIcon from '@mui/icons-material/Token';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

// Iconify
import { Icon } from '@iconify/react';
import link45deg from '@iconify/icons-bi/link-45deg';
import linkExternal from '@iconify/icons-charm/link-external';
import paperIcon from '@iconify/icons-akar-icons/paper';
import copyIcon from '@iconify/icons-fad/copy';
import exchangeIcon from '@iconify/icons-uil/exchange';
import arrowsExchangeAltV from '@iconify/icons-gg/arrows-exchange-alt-v';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext'

// Utils
import { fNumber } from 'src/utils/formatNumber';

// Components
import Wallet from './Wallet';

const Label = withStyles({
    root: {
        color: alpha('#637381', 0.99)
    }
})(Typography);

const CurrencyContent = styled('div')(
    ({ theme }) => `
    box-sizing: border-box;
    margin: 0px;
    display: flex;
    flex: 1 1 0%;
    flex-direction: row;
    padding: 20px 24px;
    -webkit-box-align: center;
    align-items: center;
`
);

const InputContent = styled('div')(
    ({ theme }) => `
    box-sizing: border-box;
    margin: 0px;
    display: flex;
    flex: 1 1 0%;
    flex-direction: column;
    -webkit-box-align: flex-end;
    align-items: flex-end;
    -webkit-box-pack: flex-end;
    justify-content: flex-end;
    color: rgb(255, 255, 255);
`
);

const ConverterFrame = styled('div')(
    ({ theme }) => `
    flex-direction: column;
    overflow: hidden;
    margin: auto -16px;
    box-sizing: border-box;
    position: relative;
    border-radius: 16px;
    display: flex;
    border:${theme.currency.border};

    @media (max-width: 600px) {
        flex-direction: column;
        overflow: hidden;
        margin: auto -16px;
        border-right: none;
        border-left: none;
        border-image: initial;
        border-radius: unset;
        border-top: ${theme.currency.border};
        border-bottom: ${theme.currency.border};
    }
`
);

const ToggleContent = styled('div')(
    ({ theme }) => `
    cursor: pointer;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
`
);

const TokenImage = styled(LazyLoadImage)(({ theme }) => ({
    borderRadius: '50%',
    overflow: 'hidden'
}));

const CURRENCY_ISSUERS = {
    USD: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B', // bitstamp
    BTC: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B', // bitstamp
    CNY: 'rKiCet8SdvWxPXnAgYarFUXMh1zCPz432Y', // ripplefox
    EUR: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq', // gatehub
    JPY: 'r94s8px6kSw1uZ1MV98dhSRTvc6VMPoPcN', // tokyojpy

    XRP_MD5: '84e5efeb89c4eae8f68188982dc290d8',
    USD_MD5: 'c9ac9a6c44763c1bd9ccc6e47572fd26',
    BTC_MD5: 'ce7b81b078cf2c4f6391c39de3425e54',
    CNY_MD5: '0f036e757e4aca67a2d4ae7aab638a95',
    EUR_MD5: 'd129c5dd925a53dc55448798ba718c0f',
    JPY_MD5: '52dda274a00d29232f2b860cac26e2ca',
    XRP: ''
}

const DEFAULT_PAIR = {
    curr1: {
        issuer: 'XRPL',
        currency: 'XRP',
        name: 'XRP',
        md5: '84e5efeb89c4eae8f68188982dc290d8'
    },
    curr2: {
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        currency: 'USD',
        name: 'USD',
        md5: 'c9ac9a6c44763c1bd9ccc6e47572fd26'
    },

}

function truncate(str, n){
    if (!str) return '';
    //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
    return (str.length > n) ? str.substr(0, n-1) + '... ' : str;
};

export default function Swap({tokens}) {
    const theme = useTheme();
    const BASE_URL = 'https://api.xrpl.to/api';
    const QR_BLUR = '/static/blurqr.png';

    const { accountProfile, doLogIn, setLoading, sync, setSync, openSnackbar } = useContext(AppContext);

    const [openLogin, setOpenLogin] = useState(false);
    const [uuid, setUuid] = useState(null);
    const [qrUrl, setQrUrl] = useState(QR_BLUR);
    const [nextUrl, setNextUrl] = useState(null);

    const [counter, setCounter] = useState(150);

    const [revert, setRevert] = useState(false);
    const [token1, setToken1] = useState(DEFAULT_PAIR.curr1.md5);
    const [token2, setToken2] = useState(DEFAULT_PAIR.curr2.md5);
    const [pair, setPair] = useState(DEFAULT_PAIR)
    const [amount1, setAmount1] = useState(1); // XRP
    const [amount2, setAmount2] = useState(0); // Token

    const [accountPairBalance, setAccountPairBalance] = useState(null);

    const color1 = revert?theme.currency.background2:theme.currency.background1;
    const color2 = revert?theme.currency.background1:theme.currency.background2;

    const isLoggedIn = accountProfile && accountProfile.account && accountPairBalance;
    let isSufficientBalance = false;

    const amount = revert ? amount2 : amount1;

    if (isLoggedIn && amount && value) {
        /* accountPairBalance
        {
            "curr1": {
                "currency": "534F4C4F00000000000000000000000000000000",
                "issuer": "rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz",
                "value": "0.00000383697235788"
            },
            "curr2": {
                "currency": "XRP",
                "issuer": "XRPL",
                "value": 26.733742000000007
            }
        }
        */
        
        const fAmount = Number(amount); // SOLO
        const fValue = Number(value); // XRP

        if (fAmount > 0 && fValue > 0) {
            const accountAmount = new Decimal(accountPairBalance.curr1.value).toNumber();
            const accountValue = new Decimal(accountPairBalance.curr2.value).toNumber();
            if (buySell === 'BUY') {
                if (accountValue >= fValue) {
                    isSufficientBalance = true;
                    errMsg = "";
                } else {
                    isSufficientBalance = false;
                    errMsg = "Insufficient wallet balance";
                }
            } else {
                if (accountAmount >= fAmount) {
                    isSufficientBalance = true;
                    errMsg = "";
                } else {
                    isSufficientBalance = false;
                    errMsg = "Insufficient wallet balance";
                }
            }
        }
    } else {
        errMsg = "";
        isSufficientBalance = false;
        if (!isLoggedIn) {
            errMsg = "Connect your wallet!";
        }
    }

    const canPlaceOrder = isLoggedIn && isSufficientBalance;

    useEffect(() => {
        function getAccountInfo() {
            if (!accountProfile || !accountProfile.account) return;
            if (!pair) return;

            const curr1 = pair.curr1;
            const curr2 = pair.curr2;
            const account = accountProfile.account;
            // https://api.xrpl.to/api/account/info/r22G1hNbxBVapj2zSmvjdXyKcedpSDKsm?curr1=534F4C4F00000000000000000000000000000000&issuer1=rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz&curr2=XRP&issuer2=XRPL
            axios.get(`${BASE_URL}/account/info/${account}?curr1=${curr1.currency}&issuer1=${curr1.issuer}&curr2=${curr2.currency}&issuer2=${curr2.issuer}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        setAccountPairBalance(ret.pair);
                    }
                }).catch(err => {
                    console.log("Error on getting details!!!", err);
                }).then(function () {
                    // always executed
                });
        }
        // console.log('account_info')
        getAccountInfo();

    }, [accountProfile, pair, sync]);

    const handleChangeAmount1 = (e) => {
        const amt = e.target.value;
        setAmount1(amt);

        const cexch = 0;
        if (amt) {
            // cexch = Decimal.mul(amt, exch).toNumber();
        }
        setAmount2(fNumber(cexch));
    }

    const handleChangeAmount2 = (e) => {
        const amt = e.target.value;
        setAmount2(amt);

        const cexch = 0;
        // if (amt && exch > 0) {
        //     cexch = Decimal.div(amt, exch).toNumber();
        // }
        setAmount1(fNumber(cexch));
    }

    const handleChangeToken1 = (e) => {
        const value = e.target.value;
        if (value !== token2) {
            setToken1(value);
            configurePair(value, token2);
        }
    }

    const handleChangeToken2 = (e) => {
        const value = e.target.value;
        console.log(value);
        if (value !== token1) {
            setToken2(value);
            configurePair(token1, value);
        }
    }

    function configurePair(md51, md52) {
        const curr1 = tokens.find(e => e.md5 === md51);
        const curr2 = tokens.find(e => e.md5 === md52);
        const pair = {
            curr1,
            curr2
        }
        setPair(pair);
    }

    return (
        <Stack alignItems="center">
            <ConverterFrame>
                <CurrencyContent style={{order: revert ? 2:1, backgroundColor: color1}}>
                    <FormControl sx={{ m: 1, maxHeight: 200}}>
                        <Select
                            value={token1}
                            onChange={handleChangeToken1}
                            MenuProps={{
                                PaperProps: {
                                    style: {
                                        maxHeight: 400, // set the desired height here
                                    },
                                },
                            }}
                            sx={{
                                mt:0,
                                '& .MuiOutlinedInput-notchedOutline' : { border: 'none' },
                            }}
                        >
                            {
                                tokens.map((row, idx) => {
                                    const {
                                        md5,
                                        name,
                                        user,
                                        kyc
                                    } = row;

                                    const imgUrl = `https://s1.xrpl.to/token/${md5}`;
                                    // const imgUrl = `/static/tokens/${md5}.${ext}`;

                                    return (
                                        <MenuItem
                                            key={md5 + "_token1"}
                                            value={md5}
                                        >
                                            <Stack direction="row" alignItems="center" spacing={1} sx={{p:0}}>
                                                <TokenImage
                                                    src={imgUrl} // use normal <img> attributes as props
                                                    width={48}
                                                    height={48}
                                                    onError={(event) => event.target.src = '/static/alt.png'}
                                                />
                                                <Stack>
                                                    <Typography variant="token" noWrap>{truncate(name, 8)}</Typography>
                                                    <Typography variant="caption" noWrap>
                                                        {truncate(user, 13)}
                                                        {kyc && (<Typography variant='kyc' sx={{ml: 0.2}}>KYC</Typography>)}
                                                    </Typography>
                                                </Stack>
                                            </Stack>
                                        </MenuItem>
                                    );
                                })
                            }
                        </Select>
                    </FormControl>
                    <InputContent>
                        <Input
                            placeholder=''
                            autoComplete='new-password'
                            // margin='dense'
                            disabled={revert?true:false}
                            disableUnderline
                            value={amount1}
                            onChange={handleChangeAmount1}
                            sx={{
                                width: '100%',
                                input: {
                                    autoComplete: 'off',
                                    padding: '10px 0px',
                                    border: 'none',
                                    fontSize: '18px',
                                    textAlign: 'end',
                                    appearance: 'none',
                                    fontWeight: 700,
                                }
                            }}
                        />
                        <Typography variant="s2">{accountPairBalance?.curr1.value}</Typography>
                    </InputContent>
                </CurrencyContent>
                <CurrencyContent style={{order: revert ? 1:2, backgroundColor: color2}}>
                    <Select
                        value={token2}
                        onChange={handleChangeToken2}
                        MenuProps={{
                            PaperProps: {
                                style: {
                                    maxHeight: 400, // set the desired height here
                                },
                            },
                        }}
                        sx={{
                            mt:0,
                            '& .MuiOutlinedInput-notchedOutline' : { border: 'none' }
                        }}
                    >
                        {
                            tokens.map((row, idx) => {
                                const {
                                    md5,
                                    name,
                                    user,
                                    kyc
                                } = row;

                                const imgUrl = `https://s1.xrpl.to/token/${md5}`;
                                // const imgUrl = `/static/tokens/${md5}.${ext}`;

                                return (
                                    <MenuItem
                                        key={md5 + "_token2"}
                                        value={md5}
                                    >
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{p:0}}>
                                            <TokenImage
                                                src={imgUrl} // use normal <img> attributes as props
                                                width={48}
                                                height={48}
                                                onError={(event) => event.target.src = '/static/alt.png'}
                                            />
                                            <Stack>
                                                <Typography variant="token" noWrap>{truncate(name, 8)}</Typography>
                                                <Typography variant="caption" noWrap>
                                                    {truncate(user, 13)}
                                                    {kyc && (<Typography variant='kyc' sx={{ml: 0.2}}>KYC</Typography>)}
                                                </Typography>
                                            </Stack>
                                        </Stack>
                                    </MenuItem>
                                );
                            })
                        }
                    </Select>
                    <InputContent>
                        <Input
                            placeholder=''
                            autoComplete='new-password'
                            // margin='dense'
                            disabled={revert?false:true}
                            disableUnderline
                            value={amount2}
                            onChange={handleChangeAmount2}
                            sx={{
                                width: '100%',
                                input: {
                                    autoComplete: 'off',
                                    padding: '10px 0px',
                                    border: 'none',
                                    fontSize: '18px',
                                    textAlign: 'end',
                                    appearance: 'none',
                                    fontWeight: 700,
                                }
                            }}
                        />
                        <Typography variant="s2">{accountPairBalance?.curr2.value}</Typography>
                    </InputContent>
                </CurrencyContent>
                <ToggleContent>
                    <IconButton size="medium" onClick={()=>{setRevert(!revert)}}>
                        <Icon icon={arrowsExchangeAltV} width="36" height="36" style={{padding: 4, borderRadius: "50%", color: "#17171AAA", background: "#ffffff"}} />
                    </IconButton>
                </ToggleContent>
            </ConverterFrame>

            <Wallet />

            {canPlaceOrder ? (
                <Button
                    variant="outlined"
                    sx={{ mt: 1.5 }}
                    onClick={handlePlaceOrder}
                    color={buySell === 'BUY' ? 'primary':'error'}
                >
                    PLACE ORDER
                </Button>
            ) : (
                <DisabledButton
                    variant="outlined"
                    sx={{ mt: 1.5 }}
                    // onClick={()=>openSnackbar('Please connect wallet!', 'error')}
                    disabled
                >
                    PLACE ORDER
                </DisabledButton>
            )}

            <QRDialog
                open={openScanQR}
                type="OfferCreate"
                onClose={handleScanQRClose}
                qrUrl={qrUrl}
                nextUrl={nextUrl}
            />
        </Stack>
    );
}