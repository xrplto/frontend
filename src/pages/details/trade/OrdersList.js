// material
import axios from 'axios'
import { useState, useEffect } from 'react';
import { alpha, styled, useTheme } from '@mui/material/styles';
import { withStyles } from '@mui/styles';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import {
    Avatar,
    Link,
    ListItemText,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import { tableCellClasses } from "@mui/material/TableCell";
import TradeToolbar from './TradeToolbar';
import TradeMoreMenu from './TradeMoreMenu';
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
    //borderRadius: '1px',
    //border: '1px solid #323546',
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

export default function OrdersList({token, pair}) {
    const theme = useTheme();
    const BASE_URL = 'https://ws.xrpl.to/api';
    const [offers1, setOffers1] = useState([]);
    const [offers2, setOffers2] = useState([]);

    useEffect(() => {
        function getOrders() {
            if (!pair) return;
            const curr1 = '0413ca7cfc258dfaf698c02fe304e607'; // pair.curr1;
            const curr2 = '71dbd3aabf2d99d205e0e2556ae4cf55'; // pair.curr2;
            // SOLO
            // https://ws.xrpl.to/api/orders?curr1=0413ca7cfc258dfaf698c02fe304e607&curr2=71dbd3aabf2d99d205e0e2556ae4cf55&limit=100
            axios.get(`${BASE_URL}/orders?curr1=${curr1}&curr2=${curr2}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        /*
                        {
                            "result": "success",
                            "took": "29.08ms",
                            "token1": {},
                            "token2": {},
                            "limit": 200,
                            "count1": 200,
                            "count2": 200,
                            "offers1": [],
                            "offers2": []
                        }
                         */
                        setOffers1(ret.offers1.reverse());
                        setOffers2(ret.offers2);
                    }
                }).catch(err => {
                    console.log("Error on getting exchanges!!!", err);
                }).then(function () {
                    // always executed
                });
        }
        getOrders();

        //const timer = setInterval(() => getOrders(), 10000);

        // return () => {
        //     clearInterval(timer);
        // }
    }, [pair]);

    return (
        <StackStyle sx={{height: 200}}>
            <Typography variant="h5" sx={{ pl: 2, pt: 2 }}>Order Book</Typography>
                <TableContainer
                    sx={{
                        border: "0px solid rgba(0,0,0,0.2)",
                        padding: 0,
                        width: 400,
                        height: 200,
                        "&::-webkit-scrollbar": {
                            width: 8
                        },
                        "&::-webkit-scrollbar-track": {
                            backgroundColor: alpha(theme.palette.grey[500], 0.1)
                        },
                        "&::-webkit-scrollbar-thumb": {
                            backgroundColor: alpha(theme.palette.grey[500], 0.4),
                            borderRadius: 2
                        },
                        overflowX: "hidden"
                    }}
              
                >
                <Table stickyHeader sx={{
                    tableLayout: "auto",
                    width: "max-content",
                    //height: "max-content",
                    [`& .${tableCellClasses.root}`]: {
                        borderBottom: "1px solid",
                        borderBottomColor: theme.palette.divider
                    }
                }}>
                    <TableHead>
                        <TableRow>
                            <TableCell align="left">Price</TableCell>
                            <TableCell align="left">Volume</TableCell>
                            <TableCell align="left">Total</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                    {
                        // exchs.slice(page * rows, page * rows + rows)
                        /*{
                            "Account": "rUgWjzwoinACRZjZr2LHnFvMFX6MDAf967",
                            "BookDirectory": "5C8970D155D65DB8FF49B291D7EFFA4A09F9E8A68D9974B25A1978288E592C00",
                            "BookNode": "0",
                            "Flags": 131072,
                            "LedgerEntryType": "Offer",
                            "OwnerNode": "11",
                            "PreviousTxnID": "39565E268B708D88571C31AE9AD1C8F443A1AB11CD9DE8884658120003406C32",
                            "PreviousTxnLgrSeq": 71397176,
                            "Sequence": 86611,
                            "TakerGets": {
                                "currency": "534F4C4F00000000000000000000000000000000",
                                "issuer": "rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz",
                                "value": "14395.46402770823"
                            },
                            "TakerPays": "10320093766",
                            "index": "4859AD33D6FCE618F9DC3319F4B8A1D98D034A46CE9D1259226DCD3D195E409A",
                            "owner_funds": "67857.26136425166",
                            "quality": "716899"
                        },
                        {
                            "Account": "rn5jUH8oXgovFpVNpV3bHTkth5tEyb5kjB",
                            "BookDirectory": "5C8970D155D65DB8FF49B291D7EFFA4A09F9E8A68D9974B25A1981432EA60D66",
                            "BookNode": "0",
                            "Flags": 131072,
                            "LedgerEntryType": "Offer",
                            "OwnerNode": "0",
                            "PreviousTxnID": "D9E9500A9AB1D0920CC47D0BA72B24FCC0D41862AAD1AE78180E1D4EC6CADB77",
                            "PreviousTxnLgrSeq": 71396805,
                            "Sequence": 68250677,
                            "TakerGets": {
                                "currency": "534F4C4F00000000000000000000000000000000",
                                "issuer": "rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz",
                                "value": "182.4895329038795"
                            },
                            "TakerPays": "131009235",
                            "index": "3502998694F20DE409BD4B2DCA88F1B32CB62FC8636A9AAE34E54C0323172DB1",
                            "owner_funds": "182.4895329038795",
                            "quality": "717899.9963192678",
                            "taker_gets_funded": {
                                "currency": "534F4C4F00000000000000000000000000000000",
                                "issuer": "rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz",
                                "value": "182.4712857753019"
                            },
                            "taker_pays_funded": "130996135"
                            }*/
                        offers1.map((row) => {
                            const {
                                TakerGets,
                                TakerPays,
                                owner_funds,
                                taker_gets_funded,
                                taker_pays_funded,
                                quality
                            } = row;
                            // quality: The exchange rate, as the ratio taker_pays divided by taker_gets
                            const gets = taker_gets_funded || TakerGets;
                            const pays = taker_pays_funded || TakerPays;

                            const takerPays = pays.value || pays / 1000000;
                            const takerGets = gets.value || gets / 1000000;

                            //const exch = parseFloat(quality);
                            const exch = takerPays / takerGets;

                            const id = MD5(JSON.stringify(row)).toString();

                            return (
                                <TableRow
                                    hover
                                    key={id}
                                    tabIndex={-1}
                                >
                                    <TableCell align="left">
                                        <Typography variant="subtitle2" sx={{ color: '#B72136' }}>{fNumber(exch)}</Typography>
                                    </TableCell>
                                    <TableCell align="left">
                                        <Typography variant="subtitle2" sx={{ color: '#B72136' }}>{fNumber(takerGets)}</Typography>
                                    </TableCell>
                                    <TableCell align="left" sx={{ p:0 }}>
                                        <Typography variant="subtitle2" sx={{ color: '#B72136' }}>{fNumber(takerPays)}</Typography>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </StackStyle>
    );
}
