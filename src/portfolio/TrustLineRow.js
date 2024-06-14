import { Avatar, Stack, TableCell, TableRow, Typography } from "@mui/material";
import { useContext, useState } from "react";
import { AppContext } from "src/AppContext";
import { fNumberWithCurreny } from "src/utils/formatNumber";
import CountUp from 'react-countup';
import useWebSocket from "react-use-websocket";
import { currencyIcons } from "src/utils/constants";

const TrustLineRow = ({ idx, currencyName, balance, md5 }) => {

    const WSS_FEED_URL = `wss://api.xrpl.to/ws/token/${md5}`;

    const { darkMode } = useContext(AppContext);
    const [token, setToken] = useState({});
    const [metrics, setMetrics] = useState({});
    const { activeFiatCurrency } = useContext(AppContext);

    const { sendJsonMessage, getWebSocket } = useWebSocket(WSS_FEED_URL, {
        onOpen: () => {},
        onClose: () => {},
        shouldReconnect: (closeEvent) => true,
        onMessage: (event) =>  processMessages(event),
        // reconnectAttempts: 10,
        // reconnectInterval: 3000,
    });

    const processMessages = (event) => {
        try {
            var t1 = Date.now();

            const json = JSON.parse(event.data);

            setMetrics(json.exch);
            setToken(json.token);
            // console.log(`${dt} ms`);
        } catch(err) {
            console.error(err);
        }
    };

    return (
        <TableRow
            sx={{
                '&:hover': {
                    '& .MuiTableCell-root': {
                        backgroundColor: darkMode
                            ? '#232326 !important'
                            : '#D9DCE0 !important'
                    }
                },
            }}
        >

            <TableCell
                align="left"
            >
                <Typography variant="s6" noWrap>
                    {idx}
                </Typography>
            </TableCell>

            <TableCell align="left" sx={{ py: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar src={`https://s1.xrpl.to/token/${md5}`} sx={{ width: 32, height: 32 }} />
                    <Typography variant="s6" noWrap>
                        {currencyName}
                    </Typography>
                </Stack>
            </TableCell>

            <TableCell align="left">
                <Typography variant="s6" noWrap>
                    <CountUp
                        end={balance}
                        duration={3.5}
                        decimals={2}
                    />
                </Typography>
            </TableCell>

            <TableCell align="right">
                <Stack direction="row" alignItems="center" justifyContent="end" spacing={1}>
                    {currencyIcons[activeFiatCurrency]}
                    <CountUp
                        end={
                            token.exch ? balance * fNumberWithCurreny(token.exch, metrics[activeFiatCurrency]) : 0
                        }
                        duration={3.5}
                        decimals={2}
                    />
                </Stack>
            </TableCell>

        </TableRow>
    )
}

export default TrustLineRow;