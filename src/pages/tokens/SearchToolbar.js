import { useState, useEffect } from 'react';
// Material
import { styled } from '@mui/material/styles';
import {
    Box,
    Toolbar,
    OutlinedInput,
    InputAdornment
} from '@mui/material';

// Iconify
import { Icon } from '@iconify/react';
import searchFill from '@iconify/icons-eva/search-fill';

// ----------------------------------------------------------------------
const RootStyle = styled(Toolbar)(({ theme }) => ({
    height: 96,
    display: 'flex',
    justifyContent: 'space-between',
    padding: theme.spacing(0, 1, 0, 3)
}));

const SearchStyle = styled(OutlinedInput)(({ theme }) => ({
    width: 200,
    transition: theme.transitions.create(['box-shadow', 'width'], {
        easing: theme.transitions.easing.easeInOut,
        duration: theme.transitions.duration.shorter
    }),
    '&.Mui-focused': { width: 280, boxShadow: theme.customShadows.z8 },
    '& fieldset': {
        borderWidth: `1px !important`,
        borderColor: `${theme.palette.grey[500_32]} !important`
    }
}));

// ----------------------------------------------------------------------
export default function SearchToolbar({ filterName, onFilterName }) {
    return (
        <RootStyle>
            <SearchStyle
                value={filterName}
                onChange={onFilterName}
                placeholder="Search ..."
                size="small"
                startAdornment={
                    <InputAdornment position="start">
                        <Box component={Icon} icon={searchFill} sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                }
                sx={{pb:0.3}}
            />
        </RootStyle>
    );
}
