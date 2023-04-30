import PropTypes from 'prop-types';
// Material
import { visuallyHidden } from '@mui/utils';
import { withStyles } from '@mui/styles';
import {
    useMediaQuery, useTheme,
    Box,
    TableRow,
    TableCell,
    TableHead,
    TableSortLabel
} from '@mui/material';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
// ----------------------------------------------------------------------

const StickyTableCell = withStyles((theme) => ({
    head: {
        position: "sticky",
        zIndex: 1000,
        top: 0
    }
})) (TableCell);

//    { id: 'holders', label: 'Holders', align: 'left', order: true },
//    { id: 'offers', label: 'Offers', align: 'left', order: true },

const TABLE_HEAD = [
    { no: 0, id: 'star',          label: '',                   align: 'left', width: '', order: false },
    { no: 1, id: 'id',            label: '#',                  align: 'left', width: '', order: false },
    { no: 2, id: 'name',          label: 'Name',               align: 'left', width: '11%', order: true },
    { no: 3, id: 'exch',          label: 'Price',              align: 'right', width: '8%', order: true },
    { no: 4, id: 'pro24h',        label: '24h (%)',            align: 'right', width: '6%', order: true },
    { no: 5, id: 'pro7d',         label: '7d (%)',             align: 'right', width: '6%', order: true },
    { no: 6, id: 'vol24hxrp',     label: 'Volume(24h)',        align: 'right', width: '10%', order: true },
    { no: 7, id: 'vol24htx',      label: 'Trades',             align: 'right', width: '6%', order: true },
    { no: 8, id: 'marketcap',     label: 'Market Cap',         align: 'right', width: '10%', order: true },
    { no: 9, id: 'trustlines',    label: 'TrustLines',         align: 'right', width: '10%', order: true },
    { no: 10, id: 'supply',        label: 'Circulating Supply', align: 'right', width: '13%', order: true },
    { no: 11, id: 'historyGraph', label: 'Last 7 Days',        align: 'right', width: '13%', order: false },
    { id: '' }
];

export default function TokenListHead({
    order,
    orderBy,
    onRequestSort,
    scrollLeft,
    tokens
}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const createSortHandler = (id, no) => (event) => {
        onRequestSort(event, id, no);
    };

    const { darkMode } = useContext(AppContext)

    return (
        <TableHead>
            <TableRow sx={{
                '& .MuiTableCell-root:nth-child(1)': {
                    position: "sticky",
                    zIndex: 1001,
                    left: 0,
                    background: darkMode ? "#17171A" : '#F2F5F9'
                },
                '& .MuiTableCell-root:nth-child(2)': {
                    position: "sticky",
                    zIndex: 1002,
                    left: tokens.length > 0 ? (isMobile ? 28 : 52) : (isMobile ? 8 : 32),
                    background: darkMode ? "#17171A" : '#F2F5F9',
                    '&:before': (isMobile && scrollLeft ? {
                        content: "''",
                        boxShadow: "inset 10px 0 8px -8px #00000026",
                        position: "absolute",
                        top: "0",
                        right: "0",
                        bottom: "-1px",
                        width: "30px",
                        transform: "translate(100%)",
                        transition: "box-shadow .3s",
                        pointerEvents: "none",
                    } : {})
                },
                '& .MuiTableCell-root:nth-child(3)': !isMobile && {
                    position: "sticky",
                    zIndex: 1003,
                    left: tokens.length > 0 ? 99 : 72,
                    background: darkMode ? "#17171A" : '#F2F5F9',
                    '&:before': (scrollLeft ? {
                        content: "''",
                        boxShadow: "inset 10px 0 8px -8px #00000026",
                        position: "absolute",
                        top: "0",
                        right: "0",
                        bottom: "-1px",
                        width: "30px",
                        transform: "translate(100%)",
                        transition: "box-shadow .3s",
                        pointerEvents: "none",
                    } : {})
                }
            }}>
                {TABLE_HEAD.map((headCell) => {
                    if (isMobile && headCell.id === 'id')
                        return null;
                    return (
                        <StickyTableCell
                            key={headCell.id}
                            align={headCell.align}
                            sortDirection={orderBy === headCell.id ? order : false}
                            width={headCell.width}
                            sx={{
                                ...(headCell.no > 0 && {
                                    // pl:0,
                                    // pr:0,
                                })
                            }}
                        >
                            <TableSortLabel
                                hideSortIcon
                                active={orderBy === headCell.id}
                                direction={orderBy === headCell.id ? order : 'desc'}
                                onClick={headCell.order?createSortHandler(headCell.id, headCell.no):undefined}
                            >
                                {headCell.label}
                                {orderBy === headCell.id ? (
                                    <Box sx={{ ...visuallyHidden }}>
                                        {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                    </Box>
                                ) : null}
                            </TableSortLabel>
                        </StickyTableCell>
                    )
                })}
            </TableRow>
        </TableHead>
    );
}
