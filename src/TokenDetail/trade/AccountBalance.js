import axios from 'axios';
import Decimal from 'decimal.js';
import { useState, useEffect } from 'react';

// Material
import {
    useTheme,
    Typography,
    Button,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableRow,
} from '@mui/material';
import { tableCellClasses } from "@mui/material/TableCell";

// Context
import { useContext } from 'react'
import { AppContext } from 'src/AppContext'

// Utils

// Components

export default function AccountBalance({pair, accountPairBalance, setAccountPairBalance}) {
    const theme = useTheme();
    const BASE_URL = 'https://api.xrpl.to/api';
    const { accountProfile, doLogIn, setLoading, sync, setSync } = useContext(AppContext);

    let curr1 = pair.curr1;
    let curr2 = pair.curr2;

    /*
        {
            "currency": "534F4C4F00000000000000000000000000000000",
            "issuer": "rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz",
            "value": "0.0199999",
            "md5": "0413ca7cfc258dfaf698c02fe304e607",
            "name": "SOLO",
            "user": "Sologenic",
            "domain": "sologenic.com",
            "verified": true,
            "twitter": "realSologenic"
        },
        {
            "currency": "XRP",
            "issuer": "XRPL",
            "value": 408593.89259000024,
            "md5": "84e5efeb89c4eae8f68188982dc290d8",
            "name": "XRP"
        }
    */

    useEffect(() => {
        function getAccountInfo() {
            if (!accountProfile || !accountProfile.account) {
                setAccountPairBalance(null);
                return;
            }

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
                    console.log("Error on getting account pair balance info.", err);
                }).then(function () {
                    // always executed
                });
        }
        // console.log('account_info')
        getAccountInfo();

    }, [accountProfile, pair, sync]);

    return (
        <>
            {accountPairBalance ? (
                <Table size={'small'}
                    sx={{
                        [`& .${tableCellClasses.root}`]: {
                            borderBottom: "0px solid",
                            borderBottomColor: theme.palette.divider
                        }
                    }}
                >
                    <TableBody>
                        <TableRow
                            key={-1}
                        >
                            <TableCell align="center" sx={{ p:0 }}>
                                <Typography variant="subtitle2" sx={{ color: '#B72136' }}>{curr1.name}</Typography>
                                {new Decimal(accountPairBalance.curr1.value).toFixed(8, Decimal.ROUND_DOWN)}
                            </TableCell>
                            <TableCell align="center" sx={{ p:0 }}>
                                <Typography variant="subtitle2" sx={{ color: '#007B55' }}>{curr2.name}</Typography>
                                {new Decimal(accountPairBalance.curr2.value).toFixed(6, Decimal.ROUND_DOWN)}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            ):(
                <Stack sx={{mt:2}} />
            )}
        </>
    );
}
