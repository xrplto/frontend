// Material
import { alpha, styled } from '@mui/material/styles';
import {
    Box,
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
    const page_count = Math.floor(length / rows) + 1;

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

    return (
        <RootStyle sx={{ml:2.5, mr:3}}>
            Showing {start} - {end} out of {length}
            <Pagination page={page+1} onChange={handleChangePage} count={page_count} variant="outlined" shape="rounded" />

            <Stack direction="row" alignItems="center">
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
        </RootStyle>        
    );
}
