// material
import axios from 'axios'
import { useState, useEffect } from 'react';
import { /*alpha,*/ styled, useTheme } from '@mui/material/styles';
import { withStyles } from '@mui/styles';
import OB from "./OB/OB";
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
import TradeToolbar from './TradeToolbar';
import TradeMoreMenu from './TradeMoreMenu';
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

function getInitialPair(pairs) {
    if (pairs.length > 0)
        return pairs[0].pair;
    return '';
}

export default function TradeData({token, pairs}) {
    const theme = useTheme();
    const EPOCH_OFFSET = 946684800;
    const BASE_URL = 'https://ws.xrpl.to/api';
    const [sel, setSel] = useState(1);
    const [pair, setPair] = useState(pairs[0]);
    const {
        acct,
        code,
        // md5
    } = token;

    const handleChangePair = (event, value) => {
        const idx = parseInt(event.target.value, 10);
        setSel(idx);
        setPair(pairs[idx-1]);
    }

    return (
        <StackStyle>
            <Stack direction="row" alignItems="center">
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
                {/* <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption">24H Volume:</Typography>
                    <Typography variant="h5" sx={{ color: '#B72136' }}>{fNumber(vol)}</Typography>
                </Stack> */}
            </Stack>
            <Grid container spacing={3} sx={{p:0}}>
                <Grid item xs={12} md={4} lg={4}>
                    <OrdersList token={token} pair={pair} />
                </Grid>
                <Grid item xs={12} md={4} lg={4}>
                    <OB product_id="BTC-USD" />
                </Grid>
            </Grid>
        </StackStyle>
    );
}
