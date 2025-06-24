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
  IconButton,
  Typography,
  Chip
} from '@mui/material';
import { FirstPage, LastPage, ViewList } from '@mui/icons-material';
// ----------------------------------------------------------------------
// Redux
import { useSelector, useDispatch } from 'react-redux';
import { selectFilteredCount } from 'src/redux/statusSlice';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
// ----------------------------------------------------------------------

const StyledToolbar = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 0),
  gap: theme.spacing(2)
}));

const PaginationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1, 2),
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
  boxShadow: theme.shadows[1]
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

const NavButton = styled(IconButton)(({ theme }) => ({
  width: 36,
  height: 36,
  borderRadius: theme.shape.borderRadius,
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08)
  },
  '&:disabled': {
    color: theme.palette.text.disabled
  }
}));

export default function TokenListToolbar({ rows, setRows, page, setPage, tokens }) {
  const filteredCount = useSelector(selectFilteredCount);
  const dispatch = useDispatch();
  const router = useRouter();

  const currentFilteredCount = filteredCount;
  const num = currentFilteredCount / rows;
  let page_count = Math.floor(num);
  if (num % 1 != 0) page_count++;

  const start = currentFilteredCount > 0 ? page * rows + 1 : 0;
  let end = start + rows - 1;
  if (end > currentFilteredCount) end = currentFilteredCount;

  const handleChangeRows = (event) => {
    setRows(parseInt(event.target.value, 10));
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage - 1);
    gotoTop(event);
  };

  const gotoTop = (event) => {
    const anchor = (event.target.ownerDocument || document).querySelector('#back-to-top-anchor');
    if (anchor) {
      anchor.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  const handleFirstPage = () => {
    setPage(0);
    gotoTop({ target: document });
  };

  const handleLastPage = () => {
    setPage(page_count - 1);
    gotoTop({ target: document });
  };

  const PaginationControls = () => (
    <PaginationContainer>
      <NavButton onClick={handleFirstPage} disabled={page === 0} size="small" title="First page">
        <FirstPage fontSize="small" />
      </NavButton>

      <Pagination
        page={page + 1}
        onChange={handleChangePage}
        count={page_count}
        size="small"
        siblingCount={1}
        boundaryCount={1}
        sx={{
          '& .MuiPaginationItem-root': {
            borderRadius: 1.5,
            margin: '0 1px',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: 'primary.lighter'
            },
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'white',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: 'primary.dark'
              }
            }
          }
        }}
      />

      <NavButton
        onClick={handleLastPage}
        disabled={page === page_count - 1}
        size="small"
        title="Last page"
      >
        <LastPage fontSize="small" />
      </NavButton>
    </PaginationContainer>
  );

  return (
    <StyledToolbar>
      {/* Results Info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          label={`${start}-${end} of ${currentFilteredCount.toLocaleString()}`}
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
          tokens
        </Typography>
      </Box>

      {/* Pagination - Hidden on mobile */}
      <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
        <PaginationControls />
      </Box>

      {/* Rows Selector */}
      <RowsSelector>
        <ViewList fontSize="small" color="action" />
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
          Rows
        </Typography>
        <CustomSelect value={rows} onChange={handleChangeRows} size="small">
          <MenuItem value={100}>100</MenuItem>
          <MenuItem value={50}>50</MenuItem>
          <MenuItem value={20}>20</MenuItem>
        </CustomSelect>
      </RowsSelector>

      {/* Mobile Pagination */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          display: { xs: 'block', md: 'none' }
        }}
      >
        <PaginationControls />
      </Box>
    </StyledToolbar>
  );
}
