import axios from 'axios';
import { useState, useEffect } from 'react';
import { withStyles } from '@mui/styles';
import Decimal from 'decimal.js';
import {CopyToClipboard} from 'react-copy-to-clipboard';

// Material
import {
    alpha, styled, useTheme,
    Avatar,
    Box,
    Button,
    Card,
    Chip,
    Container,
    Grid,
    IconButton,
    Input,
    Link,
    Stack,
    Tooltip,
    Typography
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import PersonIcon from '@mui/icons-material/Person';
import TokenIcon from '@mui/icons-material/Token';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';

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
    flex-direction: row;
    -webkit-box-align: center;
    align-items: center;
    -webkit-box-pack: end;
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

export default function Swap({tokens}) {
    const theme = useTheme();
    const BASE_URL = 'https://api.xrpl.to/api';
    const QR_BLUR = '/static/blurqr.png';

    const { accountProfile, openSnackbar } = useContext(AppContext);

    const [qrUrl, setQrUrl] = useState(QR_BLUR);
    const [uuid, setUuid] = useState(null);
    const [nextUrl, setNextUrl] = useState(null);

    const [loading, setLoading] = useState(false);

    const [counter, setCounter] = useState(150);


    const token = tokens[1];

    const {
        id,
        name,
        exch,
        usd,
        pro24h,
        amount,
        supply,
        issuer,
        currency,
        vol24h,
        vol24hxrp,
        vol24hx,
        marketcap,
        date,
        md5,
        pro7d,
        trustlines,
        holders,
        offers,
        ext
    } = token;

    let user = token.user;
    if (!user) user = name;

    const price = fNumber(usd || 0);

    // const imgUrl1 = `/static/tokens/${md5}.${ext}`;
    const imgUrl1 = `https://s1.xrpl.to/token/${md5}`;
    const imgUrl2 = `/static/xrp.png`;

    const [revert, setRevert] = useState(false);
    const [amount1, setAmount1] = useState(1); // Token
    const [amount2, setAmount2] = useState(exch?fNumber(exch):0); // XRP

    const color1 = revert?theme.currency.background2:theme.currency.background1;
    const color2 = revert?theme.currency.background1:theme.currency.background2;

    const handleChangeAmount1 = (e) => {
        const amt = e.target.value;
        setAmount1(amt);

        const cexch = 0;
        if (amt) {
            cexch = Decimal.mul(amt, exch).toNumber();
        }
        setAmount2(fNumber(cexch));
    }

    const handleChangeAmount2 = (e) => {
        const amt = e.target.value;
        setAmount2(amt);

        const cexch = 0;
        if (amt && exch > 0) {
            cexch = Decimal.div(amt, exch).toNumber();
        }
        setAmount1(fNumber(cexch));
    }

    useEffect(() => {
        var timer = null;
        var isRunning = false;
        var count = counter;
        async function getPayload() {
            // console.log(count + " " + isRunning, uuid);
            if (isRunning) return;
            isRunning = true;
            try {
                const ret = await axios.get(`${BASE_URL}/xumm/payload/${uuid}`);
                const res = ret.data.data.response;
                // const account = res.account;
                const resolved_at = res.resolved_at;
                const dispatched_result = res.dispatched_result;
                if (resolved_at) {
                    setQrUrl(QR_BLUR); setUuid(null); setNextUrl(null);
                    if (dispatched_result && dispatched_result === 'tesSUCCESS') {
                        openSnackbar('Successfully set trustline!', 'success');
                    }
                    else {
                        openSnackbar('Operation rejected!', 'error');
                    }

                    return;
                }
            } catch (err) {
            }
            isRunning = false;
            count--;
            setCounter(count);
            if (count <= 0) {
                openSnackbar('Timeout!', 'error');
                handleScanQRClose();
            }
        }
        if (uuid) {
            timer = setInterval(getPayload, 2000);
        }
        return () => {
            if (timer) {
                clearInterval(timer)
            }
        };
    }, [uuid]);

    const onTrustSetXumm = async () => {
        /*{
            "TransactionType": "TrustSet",
            "Account": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
            "Fee": "12",
            "Flags": 262144,
            "LastLedgerSequence": 8007750,
            "LimitAmount": {
              "currency": "USD",
              "issuer": "rsP3mgGb2tcYUrxiLFiHJiQXhsziegtwBc",
              "value": "100"
            },
            "Sequence": 12
        }*/
        setCounter(150);
        setLoading(true);
        try {
            // message: "Error: Payload encoding error: Decimal precision out of range"
            let LimitAmount = {};
            LimitAmount.issuer = issuer;
            LimitAmount.currency = currency;
            LimitAmount.value = new Decimal(amount).toDP(0, Decimal.ROUND_DOWN).toNumber();

            const Flags = 0x00020000;

            const body={ LimitAmount, Flags };

            const res = await axios.post(`${BASE_URL}/xumm/trustset`, body);

            if (res.status === 200) {
                const uuid = res.data.data.uuid;
                const qrlink = res.data.data.qrUrl;
                const nextlink = res.data.data.next;

                setUuid(uuid);
                setQrUrl(qrlink);
                setNextUrl(nextlink);
            }
        } catch (err) {
            // console.log(err);
            openSnackbar('Network error!', 'error');
        }
        setLoading(false);
    };

    const onDisconnectXumm = async (uuid) => {
        setLoading(true);
        try {
            const res = await axios.delete(`${BASE_URL}/xumm/logout/${uuid}`);
            if (res.status === 200) {
                setUuid(null);
            }
        } catch(err) {
        }
        setQrUrl(QR_BLUR); setUuid(null); setNextUrl(null);
        setLoading(false);
    };

    const handleScanQRClose = () => {
        onDisconnectXumm(uuid);
    };

    const handleDelete = () => {
    }

    const handleTrustSet = () => {
        if (uuid)
            onDisconnectXumm(uuid);
        else
            onTrustSetXumm();
    }

    return (
        <ConverterFrame>
            <CurrencyContent style={{order: revert ? 2:1, backgroundColor: color1}}>
                <Avatar
                    alt={name}
                    src={imgUrl1}
                    sx={{ mr:1.3, width: 32, height: 32 }}
                />
                <Stack spacing={0}>
                    <Typography variant="s7">{name}</Typography>
                    <Typography variant="s8">{user}</Typography>
                </Stack>
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
                </InputContent>
            </CurrencyContent>
            <CurrencyContent style={{order: revert ? 1:2, backgroundColor: color2}}>
                <Avatar
                    alt={name}
                    src={imgUrl2}
                    sx={{ mr:1.3, width: 32, height: 32 }}
                />
                <Stack spacing={0}>
                    <Typography variant="s7">XRP</Typography>
                    <Typography variant="s8">XRP</Typography>
                </Stack>
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
                </InputContent>
            </CurrencyContent>
            <ToggleContent>
                <IconButton size="medium" onClick={()=>{setRevert(!revert)}}>
                    <Icon icon={arrowsExchangeAltV} width="32" height="32" style={{padding: 4, borderRadius: "50%", color: "#17171AAA", background: "#ffffff"}} />
                </IconButton>
            </ToggleContent>
        </ConverterFrame>
    );
}