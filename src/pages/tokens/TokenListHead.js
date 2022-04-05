import PropTypes from 'prop-types';
// material
import { visuallyHidden } from '@mui/utils';
import { Box, TableRow, TableCell, TableHead, TableSortLabel } from '@mui/material';

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
}) {
    const createSortHandler = (id, desc) => (event) => {
        onRequestSort(event, id, desc);
    };

    return (
        <TableHead>
            <TableRow>
                {headLabel.map((headCell) => (
                    <TableCell
                        key={headCell.id}
                        align={headCell.align}
                        sortDirection={orderBy === headCell.id ? order : false}
                        sx={{
                            ...(headCell.id === 'historyGraph' && {
                                minWidth: 130,
                              })
                        }}
                    >
                        <TableSortLabel
                            hideSortIcon
                            active={orderBy === headCell.id}
                            direction={orderBy === headCell.id ? order : 'asc'}
                            onClick={headCell.order?createSortHandler(headCell.id, headCell.label):undefined}
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
            </TableRow>
        </TableHead>
    );
}
