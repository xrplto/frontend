import PropTypes from 'prop-types';
import { StickyContainer, Sticky } from 'react-sticky';
// Material
import { visuallyHidden } from '@mui/utils';
import {
    Box,
    MenuItem,
    Stack,
    Select,
    TableRow,
    TableCell,
    TableHead,
    TableSortLabel
} from '@mui/material';
// ----------------------------------------------------------------------

TokenListHead.propTypes = {
    order: PropTypes.oneOf(['asc', 'desc']),
    orderBy: PropTypes.string,
    headLabel: PropTypes.array,
    onRequestSort: PropTypes.func,
};

export default function TokenListHead({
    order,
    orderBy,
    headLabel,
    onRequestSort,
    rows,
    setRows
}) {
    const createSortHandler = (id, no) => (event) => {
        onRequestSort(event, id, no);
    };

    const handleChangeRows = (e) => {
        setRows(parseInt(e.target.value, 10));
    };

    return (
        <TableHead>
            <TableRow>
                {headLabel.map((headCell) => (
                    <TableCell
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
                    </TableCell>
                ))}
                {/* { no: 10, id: 'historyGraph', label: 'Last 7 Days', align: 'left', order: false }, */}
                <TableCell
                    key={'historyGraph'}
                    align={'left'}
                    sortDirection={false}
                    colSpan={2}
                    sx={{ minWidth: 160 }}
                >
                    <Stack direction='row' alignItems="center">
                        Last 7 Days
                        <Stack direction='row' alignItems="center" sx={{ml: 2}}>
                            Rows
                            <Select
                                value={rows}
                                onChange={handleChangeRows}
                                sx={{'& .MuiOutlinedInput-notchedOutline' : {
                                    border: 'none'
                                }}}
                            >
                                <MenuItem value={100}>100</MenuItem>
                                <MenuItem value={50}>50</MenuItem>
                                <MenuItem value={20}>20</MenuItem>
                            </Select>
                        </Stack>
                    </Stack>
                </TableCell>
            </TableRow>
        </TableHead>
    );
}
