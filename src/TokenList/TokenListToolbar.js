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
  Typography
} from '@mui/material';
// ----------------------------------------------------------------------
// Redux
import { useSelector, useDispatch } from 'react-redux';
import { selectFilteredCount } from 'src/redux/statusSlice';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
// ----------------------------------------------------------------------
const RootStyle = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
  // borderBottom: `1px solid ${alpha('#CBCCD2', 0.1)}`,
}));
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

export default function TokenListToolbar({ rows, setRows, page, setPage, tokens }) {
  const filteredCount = useSelector(selectFilteredCount);
  const dispatch = useDispatch();
  const router = useRouter();

  const num = filteredCount / rows;
  let page_count = Math.floor(num);
  if (num % 1 != 0) page_count++;

  const start = filteredCount > 0 ? page * rows + 1 : 0;
  let end = start + rows - 1;
  if (end > filteredCount) end = filteredCount;

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

  // sx={{ display: { xs: 'none', sm: 'none', md: 'block' } }}

  return (
    <Grid container rowSpacing={2} alignItems="center" sx={{ mt: 0 }}>
      <Grid container item xs={12} sx={{ display: { xs: 'block', md: 'none' } }}>
        <Stack alignItems="center">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              borderRadius: 2,
              backgroundColor: 'background.paper',
              boxShadow: 1
            }}
          >
            <IconButton
              onClick={handleFirstPage}
              disabled={page === 0}
              sx={{
                '&:hover': { backgroundColor: 'primary.lighter' },
                color: page === 0 ? 'text.disabled' : 'primary.main'
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18.41 16.59L13.82 12L18.41 7.41L17 6L11 12L17 18L18.41 16.59Z"
                  fill="currentColor"
                />
                <path
                  d="M12.41 16.59L7.82 12L12.41 7.41L11 6L5 12L11 18L12.41 16.59Z"
                  fill="currentColor"
                />
              </svg>
            </IconButton>
            <Pagination
              page={page + 1}
              onChange={handleChangePage}
              count={page_count}
              size="small"
              siblingCount={1}
              boundaryCount={1}
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: 1,
                  margin: '0 2px',
                  '&:hover': {
                    backgroundColor: 'primary.lighter'
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: 'primary.dark'
                    }
                  }
                }
              }}
            />
            <IconButton
              onClick={handleLastPage}
              disabled={page === page_count - 1}
              sx={{
                '&:hover': { backgroundColor: 'primary.lighter' },
                color: page === page_count - 1 ? 'text.disabled' : 'primary.main'
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.59 7.41L10.18 12L5.59 16.59L7 18L13 12L7 6L5.59 7.41Z"
                  fill="currentColor"
                />
                <path
                  d="M11.59 7.41L16.18 12L11.59 16.59L13 18L19 12L13 6L11.59 7.41Z"
                  fill="currentColor"
                />
              </svg>
            </IconButton>
          </Box>
        </Stack>
      </Grid>

      <Grid container item xs={6} md={4} lg={4}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: 'text.secondary',
            fontSize: '0.875rem'
          }}
        >
          <Typography variant="body2">
            Showing{' '}
            <Box component="span" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              {start}-{end}
            </Box>{' '}
            of{' '}
            <Box component="span" sx={{ fontWeight: 'bold' }}>
              {filteredCount}
            </Box>{' '}
            tokens
          </Typography>
        </Box>
      </Grid>

      <Grid container item xs={0} md={4} lg={4} sx={{ display: { xs: 'none', md: 'block' } }}>
        <Stack alignItems="center">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              borderRadius: 2,
              backgroundColor: 'background.paper',
              boxShadow: 1
            }}
          >
            <IconButton
              onClick={handleFirstPage}
              disabled={page === 0}
              sx={{
                '&:hover': { backgroundColor: 'primary.lighter' },
                color: page === 0 ? 'text.disabled' : 'primary.main'
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18.41 16.59L13.82 12L18.41 7.41L17 6L11 12L17 18L18.41 16.59Z"
                  fill="currentColor"
                />
                <path
                  d="M12.41 16.59L7.82 12L12.41 7.41L11 6L5 12L11 18L12.41 16.59Z"
                  fill="currentColor"
                />
              </svg>
            </IconButton>
            <Pagination
              page={page + 1}
              onChange={handleChangePage}
              count={page_count}
              siblingCount={1}
              boundaryCount={1}
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: 1,
                  margin: '0 2px',
                  '&:hover': {
                    backgroundColor: 'primary.lighter'
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: 'primary.dark'
                    }
                  }
                }
              }}
            />
            <IconButton
              onClick={handleLastPage}
              disabled={page === page_count - 1}
              sx={{
                '&:hover': { backgroundColor: 'primary.lighter' },
                color: page === page_count - 1 ? 'text.disabled' : 'primary.main'
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.59 7.41L10.18 12L5.59 16.59L7 18L13 12L7 6L5.59 7.41Z"
                  fill="currentColor"
                />
                <path
                  d="M11.59 7.41L16.18 12L11.59 16.59L13 18L19 12L13 6L11.59 7.41Z"
                  fill="currentColor"
                />
              </svg>
            </IconButton>
          </Box>
        </Stack>
      </Grid>

      <Grid container item xs={6} md={4} lg={4} justifyContent="flex-end">
        <Stack direction="row" alignItems="center" sx={{ width: '100%', pr: 1 }}>
          <StyledBox sx={{ maxWidth: '100%' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Show Rows
            </Typography>
            <CustomSelect value={rows} onChange={handleChangeRows}>
              <MenuItem value={100}>100</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={20}>20</MenuItem>
            </CustomSelect>
          </StyledBox>
        </Stack>
      </Grid>
    </Grid>
  );
}
