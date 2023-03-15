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

const TABLE_HEAD = [
    { no: 0, id: 'id',            label: '#',                  align: 'left', width: '' },
    { no: 1, id: 'name',          label: 'Name',               align: 'left', width: '11%'},
    { no: 2, id: 'exch',          label: 'Price',              align: 'right', width: '8%'},
    { no: 3, id: 'pro24h',        label: '24h (%)',            align: 'right', width: '6%'},
    { no: 4, id: 'pro7d',         label: '7d (%)',             align: 'right', width: '6%'},
    { no: 5, id: 'vol24hxrp',     label: 'Volume(24h)',        align: 'right', width: '10%'},
    { no: 6, id: 'vol24htx',      label: 'Trades',             align: 'right', width: '6%'},
    { no: 7, id: 'marketcap',     label: 'Market Cap',         align: 'right', width: '10%'},
    { no: 8, id: 'trustlines',    label: 'TrustLines',         align: 'right', width: '10%'},
    { no: 9, id: 'supply',        label: 'Circulating Supply', align: 'right', width: '13%'},
    { no: 10, id: 'historyGraph', label: 'Last 7 Days',        align: 'right', width: '13%'},
    { id: '' }
];

export default function TokenListHead({}) {

    return (
        <TableHead>
            <TableRow>
                {TABLE_HEAD.map((headCell) => (
                    <StickyTableCell
                        key={headCell.id}
                        align={headCell.align}
                        sortDirection={false}
                        width={headCell.width}
                        sx={{
                            ...(headCell.no > 0 && {
                                // pl:0,
                                // pr:0,
                            })
                        }}
                    >
                        {headCell.label}
                    </StickyTableCell>
                ))}
            </TableRow>
        </TableHead>
    );
}
