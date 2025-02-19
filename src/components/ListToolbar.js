// Material
import {
  styled,
  Grid,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Box,
  Typography,
  useTheme
} from '@mui/material';

// ----------------------------------------------------------------------
const CustomSelect = styled(Select)(({ theme }) => ({
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none'
  },
  '& .MuiSelect-select': {
    paddingRight: theme.spacing(4),
    fontWeight: 600,
    color: theme.palette.primary.main
  },
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));

const StyledBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: theme.spacing(1, 1.5),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[1]
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.text.secondary
}));

export default function ListToolbar({ count, rows, setRows, page, setPage }) {
  const theme = useTheme();
  const num = count / rows;
  let page_count = Math.floor(num);
  if (num % 1 != 0) page_count++;

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
      '#back-to-top-tab-anchor'
    );

    if (anchor) {
      anchor.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <Grid container rowSpacing={2} alignItems="center" sx={{ mt: 0 }}>
      <Grid container item xs={12} sx={{ display: { xs: 'block', md: 'none' } }}>
        <Stack alignItems="center">
          <StyledBox>
            <Pagination
              page={page + 1}
              onChange={handleChangePage}
              count={page_count}
              size="small"
            />
          </StyledBox>
        </Stack>
      </Grid>

      <Grid container item xs={6} md={4} lg={4}>
        <StyledTypography variant="body2">
          Showing {start} - {end} out of {count}
        </StyledTypography>
      </Grid>

      <Grid container item xs={0} md={4} lg={4} sx={{ display: { xs: 'none', md: 'block' } }}>
        <Stack alignItems="center">
          <StyledBox>
            <Pagination page={page + 1} onChange={handleChangePage} count={page_count} />
          </StyledBox>
        </Stack>
      </Grid>

      <Grid container item xs={6} md={4} lg={4} justifyContent="flex-end">
        <Stack direction="row" alignItems="center" sx={{ width: '100%', pr: 1 }}>
          <StyledBox sx={{ maxWidth: '100%' }}>
            <StyledTypography variant="body2">Show Rows</StyledTypography>
            <CustomSelect value={rows} onChange={handleChangeRows}>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={5}>5</MenuItem>
            </CustomSelect>
          </StyledBox>
        </Stack>
      </Grid>
    </Grid>
  );
}
