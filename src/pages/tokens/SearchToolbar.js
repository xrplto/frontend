import { useState, useEffect } from 'react';
// Material
import { styled } from '@mui/material/styles';
import {
    Box,
    IconButton,
    MenuItem,
    Stack,
    Select,
    ToggleButton,
    ToggleButtonGroup,
    Toolbar,
    Tooltip,
    OutlinedInput,
    InputAdornment
} from '@mui/material';

// Iconify
import { Icon } from '@iconify/react';
import searchFill from '@iconify/icons-eva/search-fill';

// Components
import TokenSort from './TokenSort';

// Context
import { useContext } from 'react'
import Context from '../../Context'

import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import DoNotTouchIcon from '@mui/icons-material/DoNotTouch';

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
export default function SearchToolbar({ filterName, onFilterName, rows, setRows, showNew, setShowNew, showSlug, setShowSlug }) {
    const { accountProfile } = useContext(Context);

    const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;

    const handleChangeRows = (e) => {
        setRows(parseInt(e.target.value, 10));
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
            <Stack direction="row" alignItems="center" spacing={2}>
                <Stack direction="row">
                    {isAdmin &&
                        <Tooltip title="Show recently added tokens">
                            <IconButton
                                disableRipple
                                aria-label="new"
                                size="medium"
                                color={showNew?'error':'inherit'}
                                onClick={()=>{
                                    setShowNew(!showNew);
                                }}
                            >
                                <FiberNewIcon fontSize="large" />
                            </IconButton>
                        </Tooltip>
                    }
                    
                    {isAdmin &&
                        <Tooltip title="Show tokens without URL Slug set">
                            <IconButton
                                disableRipple
                                aria-label="new"
                                size="medium"
                                color={showSlug?'error':'inherit'}
                                onClick={()=>{
                                    setShowSlug(!showSlug);
                                }}
                            >
                                <DoNotTouchIcon fontSize="large" />
                            </IconButton>
                        </Tooltip>
                    }
                </Stack>
                
                {/* <Select
                    value={show}
                    onChange={handleChangeShow}
                    sx={{'& .MuiOutlinedInput-notchedOutline' : {
                        border: 'none'
                    }}}
                >
                    <MenuItem value={'all'}>All</MenuItem>
                    <MenuItem value={'recent'}>Recent</MenuItem>
                </Select> */}
                <Stack direction='row' alignItems="center">
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
            </Stack>
        </RootStyle>
    );
}
