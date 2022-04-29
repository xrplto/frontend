// material
import axios from 'axios'
import { useState, useEffect } from 'react';
import { alpha, styled, useTheme } from '@mui/material/styles';
//import {CopyToClipboard} from 'react-copy-to-clipboard';
import {
    CardHeader,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import { tableCellClasses } from "@mui/material/TableCell";
import TokenPairsToolbar from './TokenPairsToolbar';
//import { MD5 } from 'crypto-js';
import { Icon } from '@iconify/react';
import arrowsExchange from '@iconify/icons-gg/arrows-exchange';
// ----------------------------------------------------------------------
// utils
import { fNumber } from '../../utils/formatNumber';
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
const StackStyle = styled(Stack)(({ theme }) => ({
    //boxShadow: theme.customShadows.z0,
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
    //backgroundColor: alpha(theme.palette.background.default, 0.0),
    borderRadius: '13px',
    padding: '0em 0.5em 1.5em 0.5em',
    backgroundColor: alpha("#919EAB", 0.03),
}));
// ----------------------------------------------------------------------
const badge24hStyle = {
    display: 'inline-block',
    marginLeft: '4px',
    color: '#C4CDD5',
    fontSize: '11px',
    fontWeight: '500',
    lineHeight: '18px',
    backgroundColor: '#323546',
    borderRadius: '4px',
    padding: '2px 4px'
};

export default function TokenPairs({token, pairs}) {
    const BASE_URL = 'https://ws.xrpl.to/api';
    const [page, setPage] = useState(0);
    const [rows, setRows] = useState(5);
    const theme = useTheme();
    const {
        //acct,
        //code,
        md5
    } = token;

    if (!pairs || pairs.length === 0)
        return (
            <>
                {/* <CircularProgress /> */}
            </>
        );

    return (
        <StackStyle>
            <CardHeader title={<>
                Pairs
                <span style={badge24hStyle}>24h</span>
                </>}  subheader='' sx={{p:2}}/>
            <Table stickyHeader sx={{
                [`& .${tableCellClasses.root}`]: {
                    borderBottom: "1px solid",
                    borderBottomColor: theme.palette.divider,
                    backgroundColor: alpha("#919EAB", 0)
                }
            }}>
                <TableHead>
                    <TableRow>
                        <TableCell align="left">PAIR</TableCell>
                        <TableCell align="left">AMOUNT</TableCell>
                        <TableCell align="left"></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                {
                    pairs.slice(page * rows, page * rows + rows)
                    .map((row) => {
                            const {
                                pair,
                                curr1,
                                curr2
                            } = row;

                            const name1 = curr1.name;
                            const name2 = curr2.name;

                            return (
                                <TableRow
                                    hover
                                    key={pair}
                                    tabIndex={-1}
                                >
                                    <TableCell align="left">
                                        <Stack direction="row" alignItems='center'>
                                            <Typography variant="subtitle2" sx={{ color: '#B72136' }}>{name1}</Typography>
                                            <Icon icon={arrowsExchange} width="16" height="16"/>
                                            <Typography variant="subtitle2" sx={{ color: '#007B55' }}>{name2}</Typography>
                                        </Stack>
                                    </TableCell>
                                    
                                    <TableCell align="left" sx={{ color: '#B72136' }}>
                                        {fNumber(curr1.value)}
                                    </TableCell>

                                    <TableCell align="left" sx={{ color: '#007B55' }}>
                                        {fNumber(curr2.value)}
                                    </TableCell>
                                </TableRow>
                            );
                        })
                }
                </TableBody>
            </Table>
            <TokenPairsToolbar
                count={pairs.length}
                rows={rows}
                setRows={setRows}
                page={page}
                setPage={setPage}
            />
        </StackStyle>
    );
}
