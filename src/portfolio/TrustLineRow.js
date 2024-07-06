import { Avatar, Stack, TableCell, TableRow, Typography, useMediaQuery } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "src/AppContext";
import { fNumberWithCurreny } from "src/utils/formatNumber";
import CountUp from 'react-countup';
import { currencyIcons } from "src/utils/constants";
import axios from "axios";

const TrustLineRow = ({ idx, currencyName, balance, md5, exchRate }) => {

    const BASE_URL = 'https://api.xrpl.to/api';

    const { darkMode, activeFiatCurrency } = useContext(AppContext);
    const isMobile = useMediaQuery('(max-width:600px)');

    const [token, setToken] = useState({});

    useEffect(() => {
        if (md5) {
            getToken();
        }
    }, [md5]);

    const getToken = async() => {
        await axios.get(`${BASE_URL}/token/get-by-hash/${md5}`).then(res => {
            setToken(res.data.token);
        })
    }

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
                '& .MuiTableCell-root': {
                    paddingLeft: '0px !important', // Ensure no padding
                    marginLeft: '0px !important' // Ensure no margin
                }
            }}
        >

            <TableCell
                align="left"
                sx={{ paddingLeft: 0, marginLeft: 0 }} // Ensure no padding or margin
            >
                <Typography variant="s6" noWrap>
                    {idx}
                </Typography>
            </TableCell>

            <TableCell
                align="left"
                sx={{ py: 1, paddingLeft: 0, marginLeft: 0 }} // Ensure no padding or margin
            >
                <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar src={`https://s1.xrpl.to/token/${md5}`} sx={{ width: 32, height: 32 }} />
                    <Typography variant="s6" noWrap>
                        {currencyName}
                    </Typography>
                </Stack>
            </TableCell>

            <TableCell
                align="left"
                sx={{ display: isMobile ? "none" : "table-cell", paddingLeft: 0, marginLeft: 0 }} // Ensure no padding or margin
            >
                <Typography variant="s6" noWrap>
                    <CountUp
                        end={balance}
                        duration={3.5}
                        decimals={2}
                    />
                </Typography>
            </TableCell>

            <TableCell
                align="right"
                sx={{ paddingLeft: 0, marginLeft: 0 }} // Ensure no padding or margin
            >
                <Stack direction="row" alignItems="center" justifyContent="end" spacing={1}>
                    {currencyIcons[activeFiatCurrency]}
                    <CountUp
                        end={
                            token.exch ? balance * fNumberWithCurreny(token.exch, exchRate) : 0
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
