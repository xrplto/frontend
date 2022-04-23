//import PropTypes from 'prop-types';
//import { Icon } from '@iconify/react';
//import searchFill from '@iconify/icons-eva/search-fill';
//import trash2Fill from '@iconify/icons-eva/trash-2-fill';
//import roundFilterList from '@iconify/icons-ic/round-filter-list';
// material
import { styled } from '@mui/material/styles';
//import { Link as RouterLink } from 'react-router-dom';
//import { fCurrency3 } from '../../utils/formatNumber';
import {
    Stack,
    Toolbar,
    Pagination,
    Select,
    MenuItem
} from '@mui/material';

//import { makeStyles } from "@mui/styles";

import { useSelector } from "react-redux";

import { selectStatus } from "../../redux/statusSlice";
// ----------------------------------------------------------------------

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

/*const dropdownStyles = makeStyles({
    underline: {
        borderBottom: "0px solid red !important",
        "&:hover": {
            borderBottom: "0px solid rgba(0,0,0,0)"
        }
    }
});*/

const CustomSelect = styled(Select)(({ theme }) => ({
    '& .MuiOutlinedInput-notchedOutline' : {
        border: 'none'
    }
}));

export default function HistoryDataToolbar({ count, rows, setRows, page, setPage}) {
    const page_count = Math.floor(count / rows) + 1;

    const start = page * rows + 1;
    let end = start + rows - 1;
    if (end > count) end = count;

    const handleChangeRows = (event) => {
        setRows(parseInt(event.target.value, 10));
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage - 1);
        gotoTop(event);
    };

    const gotoTop = (event) => {
        const anchor = (event.target.ownerDocument || document).querySelector(
            '#back-to-top-tab-anchor',
        );
    
        if (anchor) {
            anchor.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    };

    return (
        <RootStyle>
            Showing {start} - {end} out of {count}
            <Pagination page={page+1} onChange={handleChangePage} count={page_count} variant="outlined" shape="rounded" />

            <Stack direction="row" alignItems="center">
                Show Rows
                <CustomSelect
                    value={rows}
                    onChange={handleChangeRows}
                >
                    <MenuItem value={50}>50</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                </CustomSelect>
            </Stack>
        </RootStyle>        
    );
}
