import axios from 'axios';
import { useState, useEffect } from 'react';

// Material
import {
    alpha, styled, useTheme,
    Box,
    Button,
    Chip,
    Divider,
    IconButton,
    InputAdornment,
    Link,
    MenuItem,
    OutlinedInput,
    Select,
    Stack,
    Tooltip
} from '@mui/material';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import StarRateIcon from '@mui/icons-material/StarRate';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';

import FiberNewIcon from '@mui/icons-material/FiberNew';
import DoNotTouchIcon from '@mui/icons-material/DoNotTouch';
import UpdateDisabledIcon from '@mui/icons-material/UpdateDisabled';

// Iconify
import { Icon } from '@iconify/react';
import searchFill from '@iconify/icons-eva/search-fill';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

function normalizeTag(tag) {
    if (tag && tag.length > 0) {
        const tag1 = tag.split(' ').join('-');  // Replace space
        const tag2 = tag1.replace(/&/g, "and"); // Replace &
        const tag3 = tag2.toLowerCase(); // Make lowercase
        const final = tag3.replace(/[^a-zA-Z0-9-]/g, '');
        return final;
    }
    return '';
}

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

const ShadowContent = styled('div')(
    ({ theme }) => `
    -webkit-box-flex: 1;
    flex-grow: 1;
    height: 30em;
    overflow: hidden;
    text-overflow: ellipsis;
    position: relative;

    &::after {
        content: "";
        position: absolute;
        left: 0px;
        bottom: 0px;
        width: 100%;
        height: 8em;
        background: linear-gradient(180deg, rgba(255,255,255,0), ${theme.palette.background.default});
        z-index: 1000;
    }
`
);

// ----------------------------------------------------------------------
export default function SearchToolbar({
    filterName,
    onFilterName,
    rows,
    setRows,
    isAdmin,
    showNew,
    setShowNew,
    showSlug,
    setShowSlug,
    showDate,
    setShowDate
}) {
    const theme = useTheme();
    const BASE_URL = 'https://api.xrpl.to/api';

    const { openSnackbar } = useContext(AppContext);

    const [tags, setTags] = useState([]);

    useEffect(() => {
        function getTags() {
            // https://api.xrpl.to/api/tags
            axios.get(`${BASE_URL}/tags`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        setTags(ret.tags);
                    }
                }).catch(err => {
                    console.log("Error on getting watchlist!", err);
                }).then(function () {
                    // always executed
                });
        }
        getTags();
    }, []);

    const handleChangeRows = (e) => {
        setRows(parseInt(e.target.value, 10));
    };

    const handleDelete = () => {
    }

    return (
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" justifyContent="space-between" style={{borderBottom: `1px solid ${alpha('#CBCCD2', 0.1)}`}}>
            {/* <SearchBox
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
            /> */}

            <Stack direction="row" alignItems="center" spacing={0.5} sx={{mr: 0}}>
                <Link
                    underline="none"
                    color="inherit"
                    // target="_blank"
                    href={`/watchlist`}
                    rel="noreferrer noopener nofollow"
                >
                    {/* <Button variant="outlined" startIcon={<StarRateIcon />} size="small" color="disabled">
                        Watchlist
                    </Button> */}
                    <Chip variant={"outlined"} icon={<StarOutlineIcon fontSize="small" />} label={'Watchlist'} onClick={()=>{}}/>
                </Link>

                <Chip variant={"outlined"} icon={<TroubleshootIcon fontSize="small" />} label={'Portfolio'} onClick={()=>{openSnackbar("Coming soon!", "success")}}/>

                
                
            </Stack>

            <Divider orientation="vertical" variant="middle" flexItem sx={{display: { xs: 'none', md: 'flex' }, ml: 1, mr: 1, mt: 2, mb: 2}} />

            <Box
                sx={{
                    display: "flex",
                    gap: 0.5,
                    py: 1,
                    overflow: "auto",
                    width: "100%",
                    "& > *": {
                        scrollSnapAlign: "center",
                    },
                    "::-webkit-scrollbar": { display: "none" },
                }}

                style={{
                    '&::after': {
                        position: "absolute",
                        right: "0px",
                        top: "0px",
                        height: "100%",
                        width: "8em",
                        background: `linear-gradient(270deg, rgba(255,255,255,0), ${theme.palette.background.default})`,
                        zIndex: 1000
                    }
                }}
            >
                {tags && tags.map((tag, idx) => {
                    return (
                        <Link
                            href={`/view/${normalizeTag(tag)}`}
                            sx={{ pl: 0, pr: 0, display: 'inline-flex' }}
                            underline="none"
                            rel="noreferrer noopener nofollow"
                        >
                            <Chip
                                size="small"
                                label={tag}
                                onClick={handleDelete}
                            />
                        </Link>
                    );
                })}
            </Box>

            <Stack direction='row' alignItems="center" sx={{display: { xs: 'none', md: 'flex' }, ml: 2}}>
                {isAdmin &&
                    <Stack direction='row' alignItems="center" sx={{mr: 2, mt: 0.5}}>
                        <IconButton onClick={() => { setShowNew(!showNew); }} >
                            <FiberNewIcon color={showNew?'error':'inherit'}/>
                        </IconButton>

                        <IconButton onClick={() => { setShowSlug(!showSlug);; }} >
                            <DoNotTouchIcon color={showSlug?'error':'inherit'}/>
                        </IconButton>

                        <IconButton onClick={() => { setShowDate(!showDate); }} >
                            <UpdateDisabledIcon color={showDate?'error':'inherit'}/>
                        </IconButton>
                    </Stack>
                }

                Rows
                <Select
                    value={rows}
                    onChange={handleChangeRows}
                    sx={{
                        mt:0.4,
                        '& .MuiOutlinedInput-notchedOutline' : { border: 'none' }
                    }}
                >
                    <MenuItem value={100}>100</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                </Select>
            </Stack>
        </Stack>
    );
}
