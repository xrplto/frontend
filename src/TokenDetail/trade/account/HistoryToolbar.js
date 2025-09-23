// Material
import {
  styled,
  Grid,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Toolbar,
  Box,
  Typography,
  Chip,
  alpha
} from '@mui/material';
import { ViewList } from '@mui/icons-material';

// Utils
import { fIntNumber } from 'src/utils/formatNumber';

// ----------------------------------------------------------------------

const RootStyle = styled(Toolbar)(({ theme }) => ({
  height: 64,
  display: 'flex',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 1, 0, 3)
}));

const RowsSelector = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.5, 1.5),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
  boxShadow: theme.shadows[1]
}));

const CustomSelect = styled(Select)(({ theme }) => ({
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none'
  },
  '& .MuiSelect-select': {
    paddingRight: theme.spacing(3),
    paddingLeft: theme.spacing(1),
    fontWeight: 600,
    color: theme.palette.primary.main,
    minWidth: 60
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04)
  }
}));

export default function HistoryToolbar({ count, rows, setRows, page, setPage }) {
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 0 }}>
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Stack alignItems="center">
          <Pagination page={page + 1} onChange={handleChangePage} count={page_count} size="small" />
        </Stack>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={`${start}-${end} of ${fIntNumber(count)}`}
            variant="outlined"
            size="small"
            sx={{
              fontWeight: 600,
              '& .MuiChip-label': {
                px: 1.5
              }
            }}
          />
          <Typography variant="body2" color="text.secondary">
            entries
          </Typography>
        </Box>

        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Stack alignItems="center">
            <Pagination page={page + 1} onChange={handleChangePage} count={page_count} />
          </Stack>
        </Box>

        <RowsSelector>
          <ViewList fontSize="small" color="action" />
          <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
            Rows
          </Typography>
          <CustomSelect value={rows} onChange={handleChangeRows} size="small">
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={10}>10</MenuItem>
          </CustomSelect>
        </RowsSelector>
      </Box>
    </Box>
  );
}
