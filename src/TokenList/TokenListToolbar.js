// Material
import { alpha, styled } from '@mui/material/styles';
import {
    Box,
    Grid,
    Stack,
    Pagination,
    Select,
    MenuItem
} from '@mui/material';
// ----------------------------------------------------------------------
// Redux
import { useSelector } from "react-redux";
import { selectMetrics } from "src/redux/statusSlice";
// ----------------------------------------------------------------------
const RootStyle = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    // borderBottom: `1px solid ${alpha('#CBCCD2', 0.1)}`,
}));
// ----------------------------------------------------------------------

const CustomSelect = styled(Select)(({ theme }) => ({
    '& .MuiOutlinedInput-notchedOutline' : {
        border: 'none'
    }
}));

export default function TokenListToolbar({ rows, setRows, page, setPage}) {
    const metrics = useSelector(selectMetrics);
    const length = metrics.length;

    const num = length / rows;
    let page_count = Math.floor(num)
    if (num % 1 != 0) page_count++;
    
    const start = page * rows + 1;
    let end = start + rows - 1;
    if (end > length) end = length;

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

    // return (
    //     <Grid
    //         container
    //         spacing={0}
    //         sx={{mt:0}}
    //         alignItems="center"
    //     >
    //         <Grid container item xs={12} md={12} lg={12} sx={{ display: { xs: 'block', sm: 'block', md: 'none' } }}>
    //             <Stack alignItems='center' sx={{mt:2, mb:2}}>
    //                 <Pagination page={page+1} onChange={handleChangePage} count={page_count} shape="rounded" size="small" />
    //             </Stack>
    //         </Grid>

    //         <Grid container item xs={6} md={4} lg={4}>
    //             <Stack alignItems='center'>
    //                 Showing {start} - {end} out of {length}
    //             </Stack>
    //         </Grid>

    //         <Grid container item xs={12} md={4} lg={4} sx={{ display: { xs: 'none', sm: 'none', md: 'block' } }}>
    //             <Stack alignItems='center'>
    //                 <Pagination page={page+1} onChange={handleChangePage} count={page_count} shape="rounded"/>
    //             </Stack>
    //         </Grid>

    //         <Grid container item justifyContent="flex-end" xs={6} md={4} lg={4} >
    //             <Stack direction='row' alignItems='center'>
    //                 Show Rows
    //                 <CustomSelect
    //                     value={rows}
    //                     onChange={handleChangeRows}
    //                 >
    //                     <MenuItem value={100}>100</MenuItem>
    //                     <MenuItem value={50}>50</MenuItem>
    //                     <MenuItem value={20}>20</MenuItem>
    //                 </CustomSelect>
    //             </Stack>
    //         </Grid>
    //     </Grid>
    // );

    return (
        <>
            <Stack sx={{ mt:2, mb:2, display: { xs: 'block', sm: 'block', md: 'none' } }}>
                <Stack alignItems="center">
                    <Pagination page={page+1} onChange={handleChangePage} count={page_count} shape="rounded" size="small" />
                </Stack>
            </Stack>
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={0}
            >
                <Stack>
                    Showing {start} - {end} out of {length}
                </Stack>

                <Stack sx={{ display: { xs: 'none', sm: 'none', md: 'block' } }}>
                    <Pagination page={page+1} onChange={handleChangePage} count={page_count} shape="rounded"/>
                </Stack>

                <Stack direction='row' alignItems='center'>
                    Show Rows
                    <CustomSelect
                        value={rows}
                        onChange={handleChangeRows}
                    >
                        <MenuItem value={100}>100</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                        <MenuItem value={20}>20</MenuItem>
                    </CustomSelect>
                </Stack>
            </Stack>
        </>
    );
}
