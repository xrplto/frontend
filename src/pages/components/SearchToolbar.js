//import PropTypes from 'prop-types';
import { Icon } from '@iconify/react';
import searchFill from '@iconify/icons-eva/search-fill';
// material
import { styled } from '@mui/material/styles';
//import { Link as RouterLink } from 'react-router-dom';
//import { fCurrency3 } from '../../utils/formatNumber';
import { useSelector, useDispatch } from "react-redux";

import {
    Box,
    MenuItem,
    Stack,
    Select,
    Toolbar,
    OutlinedInput,
    InputAdornment
} from '@mui/material';

import {
    // setOrder,
    // setOrderBy,
    // setPage,
    // loadTokens,
    setRowsPerPage,
    selectContent,
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

export default function SearchToolbar(props) {
    const dispatch = useDispatch();
    const content = useSelector(selectContent);

    const handleChangeRowsPerPage = (event) => {
        dispatch(setRowsPerPage(parseInt(event.target.value, 10)));
    };

    return (
        <RootStyle>
            <SearchStyle
                value={props.filterName}
                onChange={props.onFilterName}
                placeholder="Search ..."
                startAdornment={
                  <InputAdornment position="start">
                    <Box component={Icon} icon={searchFill} sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                }
            />
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
    );
}
