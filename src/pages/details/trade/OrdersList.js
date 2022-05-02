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

export default function OrdersList({pair, curr1, curr2}) {
    const BASE_URL = 'https://ws.xrpl.to/api';
    const [orders, setOrders] = useState([]);
    const theme = useTheme();

    console.log(curr1, curr2);

    return (
        <StackStyle>
            <Typography variant="h5" sx={{ pl: 2, pt: 2 }}>Order Book</Typography>
            <Table stickyHeader sx={{
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
                    orders.map((row) => {
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
                                <TableCell align="left">
                                    <Typography variant="subtitle2" sx={{ color: '#B72136' }}>{fNumber(curr1.value)}</Typography>
                                </TableCell>
                                <TableCell align="left" sx={{ p:0 }}>
                                    
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </StackStyle>
    );
}
