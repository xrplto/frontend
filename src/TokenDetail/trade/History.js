import Decimal from 'decimal.js';

// Material
import { /*alpha, styled,*/ useTheme } from '@mui/material/styles';
import {
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip,
    Typography
} from '@mui/material';
import { tableCellClasses } from "@mui/material/TableCell";

// Iconify
import { Icon } from '@iconify/react';
import infoFilled from '@iconify/icons-ep/info-filled';

// Utils
import { fNumber } from 'src/utils/formatNumber';
// ----------------------------------------------------------------------
export default function HistoryData({pair, tradeExchs}) {
    const theme = useTheme();
    const EPOCH_OFFSET = 946684800;

    return (
        <Stack>
            <Typography variant='subtitle1' sx={{color:'#3366FF', textAlign: 'center', ml:2, mt:2, mb:1}}>Last Trades</Typography>
            <Table stickyHeader size={'small'}
                sx={{
                    [`& .${tableCellClasses.root}`]: {
                        borderBottom: "0px solid",
                        borderBottomColor: theme.palette.divider
                    }
                }}
            >
                <TableHead>
                    <TableRow
                        sx={{
                            [`& .${tableCellClasses.root}`]: {
                                borderBottom: "1px solid",
                                borderBottomColor: theme.palette.divider
                            }
                        }}
                    >
                        <TableCell align="left" sx={{ p:0 }}>Time</TableCell>
                        <TableCell align="left" sx={{ p:0 }}>
                            <Stack direction="row" alignItems="center" gap={1}>
                                <Typography variant="body2">Paid</Typography>
                                <Tooltip title={<Typography style={{display: 'inline-block'}} variant="body2">Taker Paid Amount<br/>Cancelled offers are yellow colored.</Typography>}>
                                    <Icon icon={infoFilled} />
                                </Tooltip>
                            </Stack>
                        </TableCell>
                        <TableCell align="left" sx={{ p:0 }}>
                            <Stack direction="row" alignItems="center" gap={1}>
                                <Typography variant="body2">Got</Typography>
                                <Tooltip title={<Typography style={{display: 'inline-block'}} variant="body2">Taker Got Amount<br/>Cancelled offers are yellow colored.</Typography>}>
                                    <Icon icon={infoFilled} />
                                </Tooltip>
                            </Stack>
                        </TableCell>
                        <TableCell align="left" sx={{ p:0 }}>Price</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                {
                    tradeExchs.map((row) => {
                            const {
                                _id,
                                dir,
                                //hash,
                                //maker,
                                //taker,
                                //ledger,
                                //seq,
                                takerPaid,
                                takerGot,
                                date,
                                cancel,
                                // pair,
                                // xUSD
                            } = row;
                            const curr1 = pair.curr1;
                            // const curr2 = pair.curr2;
                            
                            const vPaid = takerPaid.value;
                            const vGot = takerGot.value;

                            let exch;
                            // let buy;
                            if (takerPaid.issuer === curr1.issuer && takerPaid.currency === curr1.currency) {
                                // SELL, Red
                                exch = vGot / vPaid;
                                // buy = false;
                            } else {
                                // BUY, Green
                                exch = vPaid / vGot;
                                // buy = true;
                            }
                            
                            const nDate = new Date((date + EPOCH_OFFSET) * 1000);
                            // const year = nDate.getFullYear();
                            // const month = nDate.getMonth() + 1;
                            // const day = nDate.getDate();
                            const hour = nDate.getHours().toLocaleString('en-US', {minimumIntegerDigits: 2,useGrouping: false});
                            const min = nDate.getMinutes().toLocaleString('en-US', {minimumIntegerDigits: 2,useGrouping: false});
                            const sec = nDate.getSeconds().toLocaleString('en-US', {minimumIntegerDigits: 2,useGrouping: false});

                            // const strTime = (new Date(date)).toLocaleTimeString('en-US', { hour12: false });
                            // const strTime = nDate.format("YYYY-MM-DD HH:mm:ss");
                            // const strDate = `${year}-${month}-${day}`;
                            const strTime = `${hour}:${min}:${sec}`;

                            // const namePaid = normalizeCurrencyCodeXummImpl(takerPaid.currency);
                            // const nameGot = normalizeCurrencyCodeXummImpl(takerGot.currency);

                            const namePaid = '';
                            const nameGot = '';

                            return (
                                <TableRow
                                    hover
                                    key={_id}
                                    tabIndex={-1}
                                    sx={{
                                        [`& .${tableCellClasses.root}`]: {
                                            color: (cancel ? '#FFC107': (dir === 'sell' ? '#007B55' : '#B72136'))
                                        }
                                    }}
                                >
                                    <TableCell align="left" sx={{ p:0 }}>
                                        <Stack>
                                            <Typography variant="subtitle2">{strTime}</Typography>
                                            {/* <Typography variant="caption">{strDate}</Typography> */}
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="left" sx={{ p:0 }}>
                                        {new Decimal(vPaid).toFixed(2, Decimal.ROUND_DOWN)} <Typography variant="caption">{namePaid}</Typography>
                                    </TableCell>

                                    <TableCell align="left" sx={{ p:0 }}>
                                        {new Decimal(vGot).toFixed(2, Decimal.ROUND_DOWN)} <Typography variant="caption">{nameGot}</Typography>
                                    </TableCell>
                                    <TableCell align="left" sx={{ p:0 }}><Typography variant="subtitle2">{fNumber(exch)}</Typography></TableCell>
                                </TableRow>
                            );
                        })}
                </TableBody>
            </Table>
        </Stack>
    );
}
