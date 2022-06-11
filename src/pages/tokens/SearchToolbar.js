// Material
import { styled } from '@mui/material/styles';

// Iconify
import { Icon } from '@iconify/react';
import searchFill from '@iconify/icons-eva/search-fill';

import {
    Box,
    MenuItem,
    Stack,
    Select,
    Toolbar,
    OutlinedInput,
    InputAdornment
} from '@mui/material';
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
export default function SearchToolbar({ filterName, onFilterName, rows, setRows }) {
   
    const handleChangeRows = (event) => {
        setRows(parseInt(event.target.value, 10));
    };

    return (
        <RootStyle>
            <SearchStyle
                value={filterName}
                onChange={onFilterName}
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
        </RootStyle>
    );
}
