import { useState, useEffect } from 'react';
// Material
import {
    alpha, styled, useTheme,
    Box,
    IconButton,
    InputAdornment,
    Link,
    MenuItem,
    OutlinedInput,
    Select,
    Stack
} from '@mui/material';

import FiberNewIcon from '@mui/icons-material/FiberNew';
import DoNotTouchIcon from '@mui/icons-material/DoNotTouch';
import UpdateDisabledIcon from '@mui/icons-material/UpdateDisabled';

// Iconify
import { Icon } from '@iconify/react';
import searchFill from '@iconify/icons-eva/search-fill';

// ----------------------------------------------------------------------
const RootStyle = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${alpha('#CBCCD2', 0.1)}`,
}));

const SearchBox = styled(OutlinedInput)(({ theme }) => ({
    width: 200,
    transition: theme.transitions.create(['width'], {
        easing: theme.transitions.easing.easeInOut,
        duration: theme.transitions.duration.shorter
    }),
    '&.Mui-focused': { width: 280 },
    '& fieldset': {
        borderWidth: `1px !important`,
        borderColor: `${theme.palette.grey[500_32]} !important`
    }
}));

// ----------------------------------------------------------------------
export default function SearchToolbar({
    filter,
    setFilter,
    rows,
    setRows
}) {

    const handleChangeRows = (e) => {
        setRows(parseInt(e.target.value, 10));
    };

    return (
        <RootStyle sx={{pl:1, pr:1}}>
            <SearchBox
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search ..."
                size="small"
                startAdornment={
                    <InputAdornment position="start">
                        <Box component={Icon} icon={searchFill} sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                }
                sx={{pb:0.3}}
            />

            <Stack direction='row' alignItems="center" sx={{ml: 2}}>
                Rows
                <Select
                    value={rows}
                    onChange={handleChangeRows}
                    sx={{
                        mt:0.4,
                        '& .MuiOutlinedInput-notchedOutline' : { border: 'none' }
                    }}
                >
                    <MenuItem value={50}>50</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                </Select>
            </Stack>
        </RootStyle>
    );
}
