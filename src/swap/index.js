import axios from 'axios';
import { useState, useEffect } from 'react';
import Decimal from 'decimal.js';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import { LazyLoadImage, LazyLoadComponent } from 'react-lazy-load-image-component';

// Material
import { withStyles } from '@mui/styles';
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
import { XRP_TOKEN, USD_TOKEN } from 'src/utils/constants';

// Components
import ConnectWallet from 'src/components/ConnectWallet';
import QRDialog from 'src/components/QRDialog';
import QueryToken from './QueryToken';

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
    // margin: auto -16px;
    box-sizing: border-box;
    position: relative;
    border-radius: 16px;
    display: flex;
    border:${theme.currency.border};

    @media (max-width: 600px) {
        flex-direction: column;
        overflow: hidden;
        // margin: auto -16px;
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

const DisabledButton = withStyles({
    root: {
        "&.Mui-disabled": {
            pointerEvents: "unset", // allow :hover styles to be triggered
            cursor: "not-allowed", // and custom cursor can be defined without :hover state
        }
    }
})(Button);

const ExchangeButton = styled(Button)(
    ({ theme }) => `
    @media (max-width: 600px) {
        border-radius: 0px
    }
`
);

function truncate(str, n){
    if (!str) return '';
    //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
    return (str.length > n) ? str.substr(0, n-1) + '... ' : str;
};

export default function Swap({tokens, asks, bids, pair, setPair, revert, setRevert}) {
    const theme = useTheme();
    const BASE_URL = 'https://api.xrpl.to/api';
    const QR_BLUR = '/static/blurqr.png';

    const { accountProfile, doLogIn, setLoading, sync, setSync, openSnackbar } = useContext(AppContext);

    const [openScanQR, setOpenScanQR] = useState(false);
    const [uuid, setUuid] = useState(null);
    const [qrUrl, setQrUrl] = useState(null);
    const [nextUrl, setNextUrl] = useState(null);

    const [token1, setToken1] = useState(pair.curr1);
    const [token2, setToken2] = useState(pair.curr2);

    const [amount1, setAmount1] = useState(1); // XRP
    const [amount2, setAmount2] = useState(0); // Token

    const [accountPairBalance, setAccountPairBalance] = useState(null);

    const color1 = revert?theme.currency.background2:theme.currency.background1;
    const color2 = revert?theme.currency.background1:theme.currency.background2;

    const isLoggedIn = accountProfile && accountProfile.account && accountPairBalance;

    let isSufficientBalance = false;
    let errMsg = "";

    const buySell = 'SELL';
    const marketLimit = 'market';
    const amount = revert ? amount2 : amount1;
    const [value, setValue] = useState('');

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
            const accountAmount = new Decimal(revert?accountPairBalance.curr2.value:accountPairBalance.curr1.value).toNumber();
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

    useEffect(() => {
        if (marketLimit !== 'market') return;
        const amt = new Decimal(amount || 0).toNumber();
        if (amt === 0) {
            setValue(0);
            return;
        }
        // if (amt > 0) {}

        const val = calcValue(amount, buySell);
        setValue(val);
        if (revert)
            setAmount1(val);
        else
            setAmount2(val);

    }, [asks, bids, marketLimit, buySell, amount, revert]);

    useEffect(() => {
        var timer = null;
        var isRunning = false;
        var counter = 150;
        async function getPayload() {
            // console.log(counter + " " + isRunning, uuid);
            if (isRunning) return;
            isRunning = true;
            try {
                const ret = await axios.get(`${BASE_URL}/xumm/payload/${uuid}`);
                const res = ret.data.data.response;
                // const account = res.account;
                const resolved_at = res.resolved_at;
                const dispatched_result = res.dispatched_result;
                if (resolved_at) {
                    setOpenScanQR(false);
                    if (dispatched_result && dispatched_result === 'tesSUCCESS') {
                        // TRIGGER account refresh
                        setSync(sync + 1);
                        openSnackbar('Exchange successful!', 'success');
                    }
                    else {
                        openSnackbar('Transaction signing rejected!', 'error');
                    }

                    return;
                }
            } catch (err) {
            }
            isRunning = false;
            counter--;
            if (counter <= 0) {
                setOpenScanQR(false);
            }
        }
        if (openScanQR) {
            timer = setInterval(getPayload, 2000);
        }
        return () => {
            if (timer) {
                clearInterval(timer)
            }
        };
    }, [openScanQR, uuid]);

    const onOfferCreateXumm = async () => {
        setLoading(true);
        try {
            const curr1 = revert?pair.curr2:pair.curr1;
            const curr2 = revert?pair.curr1:pair.curr2;
            // const Account = accountProfile.account;
            const user_token = accountProfile.user_token;
            let TakerGets, TakerPays;
            if (buySell === 'BUY') {
                // BUY logic
                TakerGets = {currency:curr2.currency, issuer:curr2.issuer, value: value.toString()};
                TakerPays = {currency:curr1.currency, issuer:curr1.issuer, value: amount.toString()};
            } else {
                // SELL logic
                TakerGets = {currency:curr1.currency, issuer:curr1.issuer, value: amount.toString()};
                TakerPays = {currency:curr2.currency, issuer:curr2.issuer, value: value.toString()};
            }

            const OfferCreate = {
                tfPassive: 0x00010000,
                tfImmediateOrCancel: 0x00020000,
                tfFillOrKill: 0x00040000,
                tfSell: 0x00080000
            };

            let Flags = 0;
            if (marketLimit === "limit") {
                Flags = OfferCreate.tfSell;
            } else {
                if (buySell === 'BUY')
                    Flags = OfferCreate.tfImmediateOrCancel;
                else
                    Flags = OfferCreate.tfSell | OfferCreate.tfImmediateOrCancel;
            }
            const body={/*Account,*/ TakerGets, TakerPays, Flags, user_token};

            const res = await axios.post(`${BASE_URL}/offer/create`, body);

            if (res.status === 200) {
                const uuid = res.data.data.uuid;
                const qrlink = res.data.data.qrUrl;
                const nextlink = res.data.data.next;

                setUuid(uuid);
                setQrUrl(qrlink);
                setNextUrl(nextlink);
                setOpenScanQR(true);
            }
        } catch (err) {
            alert(err);
        }
        setLoading(false);
    };

    const onDisconnectXumm = async (uuid) => {
        setLoading(true);
        try {
            const res = await axios.delete(`${BASE_URL}/offer/logout/${uuid}`);
            if (res.status === 200) {
                setUuid(null);
            }
        } catch(err) {
        }
        setLoading(false);
    };

    const calcValue = (amount, buyorsell) => {
        let val = 0;
        let amt;

        try {
            amt = new Decimal(amount).toNumber();
            if (amt === 0) return 0;
            if (buyorsell === 'BUY') {
                for (var ask of asks) {
                    if (ask.sumAmount >= amt) {
                        val = new Decimal(ask.sumValue).mul(amt).div(ask.sumAmount).toNumber();
                        break;
                    }
                }
            } else {
                for (var bid of bids) {
                    if (bid.sumAmount >= amt) {
                        val = new Decimal(bid.sumValue).mul(amt).div(bid.sumAmount).toNumber();
                        break;
                    }
                }
            }
            return new Decimal(val).toFixed(6, Decimal.ROUND_DOWN);
        } catch (e) {}

        return 0;
    }

    const handleScanQRClose = () => {
        setOpenScanQR(false);
        onDisconnectXumm(uuid);
    };

    const handlePlaceOrder = (e) => {
        const fAmount = Number(amount);
        const fValue = Number(value);
        if (fAmount > 0 && fValue > 0)
            onOfferCreateXumm();
        else {
            openSnackbar('Invalid values!', 'error');
        }

        // if (accountProfile && accountProfile.account) {
        //     // Create offer
        //     /*{
        //         "TransactionType": "OfferCreate",
        //         "Account": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
        //         "Fee": "12",
        //         "Flags": 0,
        //         "LastLedgerSequence": 7108682,
        //         "Sequence": 8,
        //         "TakerGets": "6000000",
        //         "TakerPays": {
        //           "currency": "GKO",
        //           "issuer": "ruazs5h1qEsqpke88pcqnaseXdm6od2xc",
        //           "value": "2"
        //         }
        //     }*/
        //     onOfferCreateXumm();

        // } else {
        //     setShowAccountAlert(true);
        //     setTimeout(() => {
        //         setShowAccountAlert(false);
        //     }, 2000);
        // }
    }

    const handleChangeAmount1 = (e) => {
        const amt = e.target.value;
        setAmount1(amt);

        // const cexch = 0;
        // if (amt) {
        //     cexch = Decimal.mul(amt, exch).toNumber();
        // }
        // setAmount2(fNumber(cexch));
    }

    const handleChangeAmount2 = (e) => {
        const amt = e.target.value;
        setAmount2(amt);

        // const cexch = 0;
        // if (amt && exch > 0) {
        //     cexch = Decimal.div(amt, exch).toNumber();
        // }
        // setAmount1(fNumber(cexch));
    }

    const onChangeToken1 = (token) => {
        if (token.md5 !== token2.md5) {
            setToken1(token);
            configurePair(token, token2);
        }
    }

    const onChangeToken2 = (token) => {
        if (token.md5 !== token1.md5) {
            setToken2(token);
            configurePair(token1, token);
        }
    }

    function configurePair(token1, token2) {
        // const curr1 = tokens.find(e => e.md5 === md51);
        // const curr2 = tokens.find(e => e.md5 === md52);
        const pair = {
            curr1: token1,
            curr2: token2
        }
        setPair(pair);
    }

    return (
        <Stack alignItems="center">
            <ConverterFrame>
                <CurrencyContent style={{order: revert ? 2:1, backgroundColor: color1}}>
                    <QueryToken
                        token={token1}
                        onChangeToken={onChangeToken1}
                    />
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
                        <Typography variant="s7">Balance <Typography variant="s2">{accountPairBalance?.curr1.value}</Typography></Typography>
                    </InputContent>
                </CurrencyContent>
                <CurrencyContent style={{order: revert ? 1:2, backgroundColor: color2}}>
                    <QueryToken
                        token={token2}
                        onChangeToken={onChangeToken2}
                    />
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
                        <Typography variant="s7">Balance <Typography variant="s2">{accountPairBalance?.curr2.value}</Typography></Typography>
                    </InputContent>
                </CurrencyContent>
                <ToggleContent>
                    <IconButton size="medium" onClick={()=>{setRevert(!revert)}}>
                        <Icon icon={arrowsExchangeAltV} width="36" height="36" style={{padding: 4, borderRadius: "50%", color: "#17171AAA", background: "#ffffff"}} />
                    </IconButton>
                </ToggleContent>
            </ConverterFrame>

            <Stack sx={{width: '100%', mt: 2}}>
                {accountProfile && accountProfile.account ? (
                    <>
                        {errMsg &&
                            <Typography variant='s2'>{errMsg}</Typography>
                        }

                        <ExchangeButton
                            variant="contained"
                            sx={{ mt: 1.5 }}
                            onClick={handlePlaceOrder}
                            // color={'primary'}
                            disabled={!canPlaceOrder}
                        >
                            Exchange
                        </ExchangeButton>
                    </>
                ):(
                    <ConnectWallet pair={pair} />
                )}
            </Stack>

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