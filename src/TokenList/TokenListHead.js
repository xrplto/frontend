import PropTypes from 'prop-types';
// Material
import { visuallyHidden } from '@mui/utils';
import { withStyles } from '@mui/styles';
import {
    Box,
    TableRow,
    TableCell,
    TableHead,
    TableSortLabel
} from '@mui/material';
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
    { no: 0, id: 'id', label: '#', align: 'left', order: false },
    { no: 1, id: 'name', label: 'Name', align: 'left', order: true },
    { no: 2, id: 'exch', label: 'Price', align: 'right', order: true },
    { no: 3, id: 'pro24h', label: '24h (%)', align: 'right', order: true },
    { no: 4, id: 'pro7d', label: '7d (%)', align: 'right', order: true },
    { no: 5, id: 'vol24hxrp', label: 'Volume(24h)', align: 'right', order: true },
    { no: 6, id: 'vol24htx', label: 'Trades', align: 'right', order: true },
    { no: 7, id: 'marketcap', label: 'Market Cap', align: 'right', order: true },
    { no: 8, id: 'trustlines', label: 'TrustLines', align: 'right', order: true },
    { no: 9, id: 'amount', label: 'Total Supply', align: 'right', order: true },
    { no: 10, id: 'historyGraph', label: 'Last 7 Days', align: 'right', order: false },
    { id: '' }
];

export default function TokenListHead({
    order,
    orderBy,
    onRequestSort
}) {
    const createSortHandler = (id, no) => (event) => {
        onRequestSort(event, id, no);
    };

    return (
        <TableHead>
            <TableRow>
                {TABLE_HEAD.map((headCell) => (
                    <StickyTableCell
                        key={headCell.id}
                        align={headCell.align}
                        sortDirection={orderBy === headCell.id ? order : false}
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
                ))}
            </TableRow>
        </TableHead>
    );
}
