// Material
import {
    alpha,
    styled,
    Box,
    Grid,
    Stack,
    Pagination,
    Select,
    MenuItem,
    Typography,
    useTheme,
    useMediaQuery
} from '@mui/material';

// ----------------------------------------------------------------------

const CustomSelect = styled(Select)(({ theme }) => ({
    '& .MuiOutlinedInput-notchedOutline' : {
        border: 'none'
    },
    minWidth: 'auto'
}));

export default function ListToolbar({ rows, setRows, page, setPage, total}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    const num = total / rows;
    let page_count = Math.floor(num)
    if (num % 1 != 0) page_count++;
    
    const start = page * rows + 1;
    let end = start + rows - 1;
    if (end > total) end = total;

    const handleChangeRows = (event) => {
        setRows(parseInt(event.target.value, 10));
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage - 1);
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

    // sx={{ display: { xs: 'none', sm: 'none', md: 'block' } }}

    return (
        <Grid container rowSpacing={isMobile ? 1 : 2} alignItems="center" sx={{mt: 0, px: isMobile ? 1 : 0}}>
            <Grid container item xs={12} sx={{ display: { xs: 'block', md: 'none' } }}>
                <Stack alignItems='center'>
                    <Pagination page={page+1} onChange={handleChangePage} count={page_count} size="small"/>
                </Stack>
            </Grid>

            <Grid container item xs={6} md={4} lg={4}>
                <Typography 
                    variant="body2" 
                    sx={{ 
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        color: theme.palette.text.secondary,
                        fontWeight: 500
                    }}
                >
                    {isMobile ? `${start}-${end} of ${total}` : `Showing ${start} - ${end} out of ${total}`}
                </Typography>
            </Grid>

            <Grid container item xs={0} md={4} lg={4} sx={{ display: { xs: 'none', md: 'block' } }}>
                <Stack alignItems='center'>
                    <Pagination page={page+1} onChange={handleChangePage} count={page_count}/>
                </Stack>
            </Grid>

            <Grid container item xs={6} md={4} lg={4} justifyContent="flex-end">
                <Stack direction='row' alignItems='center' spacing={isMobile ? 0.5 : 1}>
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            fontSize: isMobile ? '0.75rem' : '0.875rem',
                            color: theme.palette.text.secondary,
                            display: isMobile ? 'none' : 'block'
                        }}
                    >
                        Show Rows
                    </Typography>
                    <CustomSelect
                        value={rows}
                        onChange={handleChangeRows}
                        size={isMobile ? "small" : "medium"}
                        sx={{
                            fontSize: isMobile ? '0.75rem' : '0.875rem',
                            '& .MuiSelect-select': {
                                py: isMobile ? 0.5 : 1,
                                px: isMobile ? 1 : 2
                            }
                        }}
                    >
                        <MenuItem value={100} sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>100</MenuItem>
                        <MenuItem value={50} sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>50</MenuItem>
                        <MenuItem value={20} sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>20</MenuItem>
                        <MenuItem value={10} sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>10</MenuItem>
                    </CustomSelect>
                </Stack>
            </Grid>
        </Grid>
    );
}
