// Material
import {
  alpha,
  styled,
  Box,
  Pagination,
  Select,
  MenuItem,
  IconButton,
  Typography,
  Chip,
  useTheme
} from '@mui/material';
import { FirstPage, LastPage, ViewList } from '@mui/icons-material';
// ----------------------------------------------------------------------
// Redux
import { useSelector, useDispatch } from 'react-redux';
import { selectFilteredCount } from 'src/redux/statusSlice';
import { useCallback, memo } from 'react';
// ----------------------------------------------------------------------

const StyledToolbar = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0.5, 0),
  gap: theme.spacing(0.75),
  flexWrap: 'wrap',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'row',
    alignItems: 'stretch',
    flexWrap: 'wrap',
    gap: theme.spacing(0.25),
    padding: theme.spacing(0.25)
  }
}));

const PaginationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
  boxShadow: theme.shadows[1],
  [theme.breakpoints.down('md')]: {
    width: '100%',
    justifyContent: 'center',
    padding: theme.spacing(0.25, 0.5)
  }
}));

const RowsSelector = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
  boxShadow: theme.shadows[1],
  [theme.breakpoints.down('md')]: {
    flex: 1,
    minWidth: 'calc(50% - 8px)',
    justifyContent: 'center',
    padding: theme.spacing(0.5, 1),
    gap: theme.spacing(0.25)
  }
}));

const CustomSelect = styled(Select)(({ theme }) => ({
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none'
  },
  '& .MuiSelect-select': {
    paddingRight: theme.spacing(1),
    paddingLeft: 0,
    fontWeight: 600,
    color: theme.palette.primary.main,
    minWidth: 40
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04)
  }
}));

const NavButton = styled(IconButton)(({ theme }) => ({
  width: 28,
  height: 28,
  borderRadius: theme.shape.borderRadius,
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08)
  },
  '&:disabled': {
    color: theme.palette.text.disabled
  }
}));

const TokenListToolbar = memo(function TokenListToolbar({ rows, setRows, page, setPage, tokens }) {
  const filteredCount = useSelector(selectFilteredCount);
  const dispatch = useDispatch();
  const theme = useTheme();

  const currentFilteredCount = filteredCount ?? 0;
  const num = currentFilteredCount / rows;
  let page_count = Math.floor(num);
  if (num % 1 !== 0) page_count++;
  page_count = Math.max(page_count, 1); // Ensure at least 1 page

  const start = currentFilteredCount > 0 ? page * rows + 1 : 0;
  let end = start + rows - 1;
  if (end > currentFilteredCount) end = currentFilteredCount;

  const handleChangeRows = (event) => {
    setRows(parseInt(event.target.value, 10));
  };

  const gotoTop = useCallback((event) => {
    const anchor = (event.target.ownerDocument || document).querySelector('#back-to-top-anchor');
    if (anchor) {
      anchor.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, []);

  const handleChangePage = useCallback(
    (event, newPage) => {
      setPage(newPage - 1);
      gotoTop(event);
    },
    [setPage, gotoTop]
  );

  const handleFirstPage = useCallback(() => {
    setPage(0);
    gotoTop({ target: document });
  }, [setPage, gotoTop]);

  const handleLastPage = useCallback(() => {
    setPage(page_count - 1);
    gotoTop({ target: document });
  }, [setPage, gotoTop, page_count]);

  return (
    <StyledToolbar>
      {/* Section 1: Results Info */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          flexWrap: 'wrap',
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          borderRadius: theme.shape.borderRadius * 2,
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.shadows[1],
          [theme.breakpoints.down('md')]: {
            flex: 1,
            minWidth: 'calc(50% - 8px)',
            justifyContent: 'flex-start',
            gap: theme.spacing(0.5),
            padding: theme.spacing(0.5, 1)
          }
        }}
      >
        <Chip
          label={`${start}-${end} of ${currentFilteredCount.toLocaleString()}`}
          variant="outlined"
          size="small"
          sx={{
            fontWeight: 600,
            '& .MuiChip-label': {
              px: 0.5
            }
          }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          tokens
        </Typography>
      </Box>

      {/* Section 3: Pagination controls - Wrapped in a new Box for centering */}
      <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
        <PaginationContainer>
          <NavButton
            onClick={handleFirstPage}
            disabled={page === 0}
            size="small"
            title="First page"
          >
            <FirstPage sx={{ fontSize: '0.875rem' }} />
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
                minWidth: '20px',
                height: '20px',
                borderRadius: 1.5,
                margin: '0 0px',
                padding: '0 1px',
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
            <LastPage sx={{ fontSize: '0.875rem' }} />
          </NavButton>
        </PaginationContainer>
      </Box>

      {/* Section 2: Rows Selector - Moved to the end */}
      <RowsSelector>
        <ViewList sx={{ fontSize: '0.875rem' }} color="action" />
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, color: 'text.secondary', fontSize: '0.75rem' }}
        >
          Rows
        </Typography>
        <CustomSelect value={rows} onChange={handleChangeRows} size="small">
          <MenuItem value={100}>100</MenuItem>
          <MenuItem value={50}>50</MenuItem>
          <MenuItem value={20}>20</MenuItem>
        </CustomSelect>
      </RowsSelector>
    </StyledToolbar>
  );
});

export default TokenListToolbar;
