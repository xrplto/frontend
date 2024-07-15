import {
    useTheme,
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Paper,
    Radio,
    RadioGroup,
    FormControlLabel,
} from '@mui/material';
import { Client } from "xrpl";
import { useContext, useEffect, useState } from 'react';
import { AppContext } from 'src/AppContext';
import HistoryRow from './HistoryRow';

const rippleServerUrl = process.env.NEXT_PUBLIC_RIPPLED_LIVE_DATA_ONLY_URL;
const client = new Client(rippleServerUrl);

const History = () => {

    const theme = useTheme();
    const { accountProfile } = useContext(AppContext);
    const [activityHistory, setActivityHistory] = useState([]);
    useEffect(() => {
        accountHistory();
    }, [accountProfile])

    const accountHistory = async () => {
        const xrpAddress = accountProfile?.account;
        if (xrpAddress === undefined) return;
        await client.connect();
        try {
            const transaction = {
                command: "account_tx",
                account: xrpAddress,
                ledger_index_min: -1,
                ledger_index_max: -1,
                binary: false,
                // limit: 5,
                forward: false
            };
            const response = await client.request(transaction);
            const totalTransactions = response.result.transactions;
            const filteredTransactions = totalTransactions.filter((item) => {
                const transactionType = item.tx.TransactionType;
                const account = item.tx.Account;
                const destination = item.tx.Destination;
                const deliveredAmount = item.meta.delivered_amount;
                return (
                    (transactionType === "Payment" &&
                        account === destination &&
                        deliveredAmount !== undefined) ||
                    transactionType === "AMMDeposit" ||
                    transactionType === "AMMWithdraw"
                );
            });
            const updatedArray = filteredTransactions.map((item) => ({
                Account: item.tx.Account,
                Destination: item.tx.Destination,
                TransactionType: item.tx.TransactionType,
                Amount: item.tx.Amount,
                Amount2: item.tx.Amount2,
                Asset: item.tx.Asset,
                Asset2: item.tx.Asset2,
                TransactionResult: item.meta.TransactionResult,
                DeliveredAmount: item.meta.delivered_amount,
                SendMax: item.tx.SendMax,
                hash: item.tx.hash,
                date: item.tx.date
            }));

            for (let i = 0; i < updatedArray.length; i++) {
                const eachTransaction = updatedArray[i];
                if (typeof eachTransaction.Destination === "undefined") {
                    eachTransaction.Destination = "XRPL";
                }
            }
            const filteredData = updatedArray.filter((item) => {
                return item.Account === xrpAddress || item.Destination === xrpAddress;
            });
            setActivityHistory(filteredData);
        } catch (error) {
            console.log("The error is occurred in my transaction history", error);
        }
    };

    console.log(activityHistory)
    return (
        <Box>
            <Typography sx={{ color: theme.palette.text.primary, mb: 2 }} variant="h6">Historical Trades</Typography>
            <RadioGroup
                row
                // value={filter}
                // onChange={handleFilterChange}
                sx={{ mb: 2, color: theme.palette.text.primary }}
            >
                <FormControlLabel value="All" control={<Radio sx={{ color: theme.palette.text.primary }} />} label="All" />
                <FormControlLabel value="Tokens" control={<Radio sx={{ color: theme.palette.text.primary }} />} label="Tokens" />
                <FormControlLabel value="NFTs" control={<Radio sx={{ color: theme.palette.text.primary }} />} label="NFTs" />
            </RadioGroup>
            <Paper sx={{ width: '100%', overflow: 'auto', maxHeight: "475px", color: theme.palette.text.primary }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: theme.palette.text.primary }}>Type</TableCell>
                            <TableCell sx={{ color: theme.palette.text.primary }}>Amount</TableCell>
                            <TableCell sx={{ color: theme.palette.text.primary }}>Date</TableCell>
                            <TableCell sx={{ color: theme.palette.text.primary }}>Result</TableCell>
                            <TableCell sx={{ color: theme.palette.text.primary }}>View</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {activityHistory.map((item, index) => (
                            <HistoryRow key={index} {...item} />
                        ))}
                    </TableBody>
                </Table>
            </Paper>
        </Box>
    )
}

export default History;