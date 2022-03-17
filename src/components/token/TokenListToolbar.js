//import PropTypes from 'prop-types';
import { Icon } from '@iconify/react';
import searchFill from '@iconify/icons-eva/search-fill';
//import trash2Fill from '@iconify/icons-eva/trash-2-fill';
//import roundFilterList from '@iconify/icons-ic/round-filter-list';
// material
import { styled } from '@mui/material/styles';
//import { Link as RouterLink } from 'react-router-dom';
//import { fCurrency3 } from '../../utils/formatNumber';
import {
    Box,
    Stack,
    Toolbar,
    Tooltip,
    IconButton,
    OutlinedInput,
    InputAdornment,
    Pagination,
    Select,
    MenuItem,
    TablePagination
} from '@mui/material';

import { makeStyles } from "@mui/styles";

import { useSelector, useDispatch } from "react-redux";
import { selectStatus } from "../../redux/statusSlice";
import {
    setOrder,
    setOrderBy,
    setPage,
    setRowsPerPage,
    selectContent,
    loadTokens
} from "../../redux/tokenSlice";
// ----------------------------------------------------------------------

const RootStyle = styled(Toolbar)(({ theme }) => ({
    height: 96,
    display: 'flex',
    justifyContent: 'space-between',
    padding: theme.spacing(0, 1, 0, 3)
}));

const SearchStyle = styled(OutlinedInput)(({ theme }) => ({
    width: 240,
    transition: theme.transitions.create(['box-shadow', 'width'], {
        easing: theme.transitions.easing.easeInOut,
        duration: theme.transitions.duration.shorter
    }),
    '&.Mui-focused': { width: 320, boxShadow: theme.customShadows.z8 },
    '& fieldset': {
        borderWidth: `1px !important`,
        borderColor: `${theme.palette.grey[500_32]} !important`
    }
}));

// ----------------------------------------------------------------------

/*TokenListToolbar.propTypes = {
  filterName: PropTypes.string,
  onFilterName: PropTypes.func
};*/

const dropdownStyles = makeStyles({
    underline: {
        borderBottom: "0px solid red !important",
        "&:hover": {
            borderBottom: "0px solid rgba(0,0,0,0)"
        }
    }
});

export default function TokenListToolbar(props) {
    const dispatch = useDispatch();
    const content = useSelector(selectContent);

    const rowsPerPage = content.rowsPerPage;
    const count = content.tokenCount;
    const page_count = Math.floor(count / rowsPerPage) + 1;

    const start = content.page * rowsPerPage + 1;
    let end = start + rowsPerPage - 1;
    if (end > count) end = count;

    const handleChangeRowsPerPage = (event) => {
        dispatch(setRowsPerPage(parseInt(event.target.value, 10)));
    };

    const handleChangePage = (event, newPage) => {
        dispatch(setPage(newPage - 1));
    };

    return (
        <RootStyle>
            Showing {start} - {end} out of {count}
            <Pagination page={content.page+1} onChange={handleChangePage} count={page_count} variant="outlined" shape="rounded" />

            <Stack direction="row" alignItems="center">
                Show Rows
                <Select
                    value={content.rowsPerPage}
                    onChange={handleChangeRowsPerPage}
                    sx={{'& .MuiOutlinedInput-notchedOutline' : {
                        border: 'none'
                    }}}
                >
                    <MenuItem value={100}>100</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                </Select>
                {/* <TablePagination
                    rowsPerPageOptions={[100, 50, 20]}
                    component="div"
                    count={props.count}
                    rowsPerPage={props.rowsPerPage}
                    labelRowsPerPage={props.labelRowsPerPage}
                    page={props.page}
                    onPageChange={props.onPageChange}
                    onRowsPerPageChange={props.onRowsPerPageChange}
                /> */}
            </Stack>
        </RootStyle>
    );
}
