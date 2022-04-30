// material
import axios from 'axios'
import { useState, useEffect } from 'react';
import { /*alpha,*/ styled, useTheme } from '@mui/material/styles';
import { withStyles } from '@mui/styles';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import {
    Alert,
    FormControl,
    Grid,
    InputLabel,
    Link,
    MenuItem,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import { tableCellClasses } from "@mui/material/TableCell";
import MarketToolbar from './MarketToolbar';
import MarketMoreMenu from './MarketMoreMenu';
import PairsList from './PairsList';
import OrdersList from './OrdersList';
import { MD5 } from 'crypto-js';
import { Icon } from '@iconify/react';
import arrowsExchange from '@iconify/icons-gg/arrows-exchange';
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

const CancelTypography = withStyles({
    root: {
        color: "#FF6C40",
        borderRadius: '6px',
        border: '0.05em solid #FF6C40',
        //fontSize: '0.5rem',
        lineHeight: '1',
        paddingLeft: '3px',
        paddingRight: '3px',
    }
})(Typography);

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

function getPair(issuer, code) {
    // issuer, currencyCode, 'XRP', undefined
    const t1 = 'undefined_XRP';
    const t2 = issuer  + '_' +  code;
    let pair = t1 + t2;
    if (t1.localeCompare(t2) > 0)
        pair = t2 + t1;
    return MD5(pair).toString();
}

export default function MarketData({token, pairs}) {
    const EPOCH_OFFSET = 946684800;
    const BASE_URL = 'https://ws.xrpl.to/api';
    const [page, setPage] = useState(0);
    const [rows, setRows] = useState(10);
    const [count, setCount] = useState(0);
    const [copied, setCopied] = useState(false);
    const [exchs, setExchs] = useState([]);
    const [pair, setPair] = useState('');
    const [vol, setVol] = useState(0);
    const theme = useTheme();
    const {
        acct,
        code,
        // md5
    } = token;

    const setPairVolume = (p) => {
        setPair(p);
        for (var pi of pairs) {
            if (pi.pair === p) {
                if (pi.curr1.currency === code)
                    setVol(pi.curr1.value);
                if (pi.curr2.currency === code)
                    setVol(pi.curr2.value);
                break;
            }
        }
    }

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setCopied(false);
    };

    const handleChangePair = (event, value) => {
        setPairVolume(event.target.value);
    }

    useEffect(() => {
        function getExchanges() {
            if (!pair) {
                setPairVolume(getPair(acct, code));
                //console.log(pair);
                return;
            }
            // XPUNK
            // https://ws.xrpl.to/api/exchanges?pair=d12119be3c1749470903414dff032761&page=0&limit=5
            // SOLO
            // https://ws.xrpl.to/api/exchanges?pair=fa99aff608a10186d3b1ff33b5cd665f&page=0&limit=5
            axios.get(`${BASE_URL}/exchanges?pair=${pair}&page=${page}&limit=${rows}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        setCount(ret.count);
                        let exs = [];
                        let i = 0;
                        for (var ex of ret.exchs) {
                            ex.id = i + page * rows + 1;
                            exs.push(ex);
                            i++;
                        }
                        setExchs(exs);
                    }
                }).catch(err => {
                    console.log("Error on getting exchanges!!!", err);
                }).then(function () {
                    // always executed
                });
        }
        getExchanges();

        const timer = setInterval(() => getExchanges(), 10000);

        return () => {
            clearInterval(timer);
        }
    }, [page, rows, pair]);

    return (
        <StackStyle>
            <Grid container spacing={3} sx={{p:0}}>
                <Grid item xs={12} md={4} lg={4} sx={{pl:0}}>
                    <PairsList token={token} pairs={pairs} />
                </Grid>

                <Grid item xs={12} md={8} lg={8}>
                    <OrdersList token={token} pairs={pairs} />
                </Grid>
            </Grid>
        </StackStyle>
    );
}
