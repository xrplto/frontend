//import PropTypes from 'prop-types';
import { Icon } from '@iconify/react';
import searchFill from '@iconify/icons-eva/search-fill';
//import trash2Fill from '@iconify/icons-eva/trash-2-fill';
//import roundFilterList from '@iconify/icons-ic/round-filter-list';
// material
import { alpha, styled } from '@mui/material/styles';
//import { Link as RouterLink } from 'react-router-dom';
//import { fCurrency3 } from '../../utils/formatNumber';
import {
    AppBar,
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

import {
    setOrder,
    setOrderBy,
    setPage,
    setRowsPerPage,
    selectContent,
    loadTokens
} from "../../../redux/tokenSlice";
// ----------------------------------------------------------------------
const AppBarStyle = styled(AppBar)(({ theme }) => ({
    boxShadow: 'none',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
    backgroundColor: alpha(theme.palette.background.default, 0.9),
    borderRadius: '0px',
    color: theme.palette.text.primary
    //backgroundColor: alpha("#00AB88", 0.7),
}));

const RootStyle = styled(Toolbar)(({ theme }) => ({
    height: 64,
    display: 'flex',
    justifyContent: 'space-between',
    padding: theme.spacing(0, 1, 0, 3)
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


/*
<AppBarStyle position="fixed" color="primary" sx={{ top: 'auto', bottom: 0 }}>
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
        </Stack>
    </RootStyle>
</AppBarStyle>
*/

const CustomSelect = styled(Select)(({ theme }) => ({
    '& .MuiOutlinedInput-notchedOutline' : {
        border: 'none'
    }
}));

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
        gotoTop(event);
    };

    const gotoTop = (event) => {
        const anchor = (event.target.ownerDocument || document).querySelector(
          '#back-to-top-anchor',
        );
    
        if (anchor) {
          anchor.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
          });
        }
    };

    return (
        <RootStyle>
            Showing {start} - {end} out of {count}
            <Pagination page={content.page+1} onChange={handleChangePage} count={page_count} variant="outlined" shape="rounded" />

            <Stack direction="row" alignItems="center">
                Show Rows
                <CustomSelect
                    value={content.rowsPerPage}
                    onChange={handleChangeRowsPerPage}
                >
                    <MenuItem value={100}>100</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                </CustomSelect>
            </Stack>
        </RootStyle>        
    );
}
