import axios from 'axios';
import React, { useState, useEffect, useContext, useMemo, useCallback, memo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableSortLabel,
  useMediaQuery,
  useTheme,
  styled,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
  Grid,
  Pagination,
  Select,
  MenuItem
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import EditIcon from '@mui/icons-material/Edit';
import VerifiedIcon from '@mui/icons-material/Verified';
import { AppContext } from 'src/AppContext';
import { formatMonthYearDate } from 'src/utils/formatTime';
import { fNumber, fIntNumber, fVolume } from 'src/utils/formatNumber';

// Styled Components
const StickyTableCell = styled(TableCell)({
  position: 'sticky',
  zIndex: 1000,
  top: 0,
  fontWeight: '500',
  fontSize: '11px',
  letterSpacing: '0.01em',
  textTransform: 'uppercase'
});

const CollectionImageWrapper = styled(Box)(({ theme }) => ({
  borderRadius: '12px',
  overflow: 'hidden',
  width: '32px',
  height: '32px',
  [theme.breakpoints.up('sm')]: {
    width: '40px',
    height: '40px'
  },
  position: 'relative',
  border: '1px solid rgba(145, 158, 171, 0.05)',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    cursor: 'pointer',
    transform: 'scale(1.05)',
    borderColor: 'rgba(99, 115, 129, 0.15)',
    '& > img': {
      opacity: 0.9
    }
  }
}));

const IconImage = styled('img')(`
  position: absolute;
  inset: 0px;
  box-sizing: border-box;
  padding: 0px;
  border: none;
  margin: auto;
  display: block;
  width: 0px; height: 0px;
  min-width: 100%;
  max-width: 100%;
  min-height: 100%;
  max-height: 100%;
  object-fit: cover;
  border-radius: 0px;
`);

const CustomSelect = styled(Select)(({ theme }) => ({
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none'
  },
  minWidth: 'auto'
}));

// Table Head Configuration
const TABLE_HEAD = (isMobile) => {
  if (isMobile) {
    return [
      {
        no: 0,
        id: 'name',
        label: 'Collection',
        align: 'left',
        width: '45%',
        order: false
      },
      {
        no: 1,
        id: 'floor.amount',
        label: 'Floor',
        align: 'right',
        width: '18%',
        order: true
      },
      {
        no: 2,
        id: 'volume',
        label: '24h Vol',
        align: 'right',
        width: '18%',
        order: true
      },
      {
        no: 3,
        id: 'totalVolume',
        label: 'Total',
        align: 'right',
        width: '19%',
        order: true
      }
    ];
  }
  return [
    {
      no: 0,
      id: 'name',
      label: 'Collection',
      align: 'left',
      width: '35%',
      order: false
    },
    {
      no: 1,
      id: 'floor.amount',
      label: 'Floor',
      align: 'right',
      width: '13%',
      order: true
    },
    {
      no: 2,
      id: 'volume',
      label: 'Volume (24h)',
      align: 'right',
      width: '13%',
      order: true
    },
    {
      no: 3,
      id: 'totalVolume',
      label: 'Total Volume',
      align: 'right',
      width: '13%',
      order: true
    },
    {
      no: 4,
      id: 'owners',
      label: 'Owners',
      align: 'right',
      width: '13%',
      order: true
    },
    {
      no: 5,
      id: 'items',
      label: 'Supply',
      align: 'right',
      width: '13%',
      order: true
    }
  ];
};

// ListHead Component
const ListHead = memo(({ order, orderBy, onRequestSort, scrollTopLength = 0 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { darkMode } = useContext(AppContext);

  const createSortHandler = (id) => (event) => {
    onRequestSort(event, id);
  };

  return (
    <TableHead
      sx={{
        position: 'sticky',
        zIndex: 1002,
        transform: `translateY(${scrollTopLength}px)`,
        background: 'transparent',
        backdropFilter: 'none',
        borderBottom: 'none'
      }}
    >
      <TableRow
        sx={{
          '& .MuiTableCell-root': {
            fontSize: isMobile ? '9px' : '11px',
            fontWeight: '500',
            padding: isMobile ? '8px 4px' : '12px 8px',
            height: 'auto',
            whiteSpace: 'nowrap',
            color: darkMode ? 'rgba(145, 158, 171, 0.8)' : 'rgba(99, 115, 129, 0.8)',
            textTransform: 'uppercase',
            letterSpacing: '0.01em',
            borderBottom: 'none',
            '&:not(:first-of-type)': {
              paddingLeft: isMobile ? '4px' : '6px'
            }
          },
          '& .MuiTableSortLabel-root': {
            fontSize: isMobile ? '9px' : '11px',
            fontWeight: '500',
            color: 'inherit',
            '&:hover': {
              color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(33, 43, 54, 0.9)'
            },
            '&.Mui-active': {
              color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(33, 43, 54, 0.9)',
              '& .MuiTableSortLabel-icon': {
                color: 'inherit'
              }
            },
            '& .MuiTableSortLabel-icon': {
              fontSize: '14px'
            }
          }
        }}
      >
        {TABLE_HEAD(isMobile).map((headCell) => (
          <StickyTableCell
            key={headCell.id}
            align={headCell.align}
            sortDirection={orderBy === headCell.id ? order : false}
            width={headCell.width}
          >
            {headCell.order ? (
              <TableSortLabel
                hideSortIcon={!headCell.order}
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'desc'}
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}
                {orderBy === headCell.id && (
                  <Box component="span" sx={{ ...visuallyHidden }}>
                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                  </Box>
                )}
              </TableSortLabel>
            ) : (
              headCell.label
            )}
          </StickyTableCell>
        ))}
      </TableRow>
    </TableHead>
  );
});

// Row Component
const Row = memo(({ id, item }) => {
  const {
    uuid,
    name,
    slug,
    items,
    logoImage,
    verified,
    created,
    totalVol24h,
    totalVolume,
    floor,
    owners
  } = item;

  const { darkMode } = useContext(AppContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const floorPrice = floor?.amount || 0;
  const volume24h = fVolume(totalVol24h || 0);
  const totalVolumeDisplay = fVolume(totalVolume || 0);

  const strDateTime = formatMonthYearDate(created);
  const logoImageUrl = `https://s1.xrpnft.com/collection/${logoImage}`;

  const tableRowStyle = useMemo(
    () => ({
      borderBottom: 'none',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      backgroundColor: 'transparent',
      '&:hover': {
        '& .MuiTableCell-root': {
          backgroundColor: 'transparent'
        },
        cursor: 'pointer',
        transform: 'translateY(-1px)'
      },
      '& .MuiTypography-root': {
        fontSize: isMobile ? '11px' : '14px',
        fontWeight: '500'
      },
      '& .MuiTableCell-root': {
        padding: isMobile ? '8px 4px' : '16px 12px',
        whiteSpace: 'nowrap',
        borderBottom: 'none',
        backgroundColor: 'transparent',
        '&:not(:first-of-type)': {
          paddingLeft: isMobile ? '4px' : '8px'
        }
      }
    }),
    [darkMode, isMobile]
  );

  const handleRowClick = () => {
    document.location = `/collection/${slug}`;
  };

  return (
    <TableRow key={uuid} sx={tableRowStyle} onClick={handleRowClick}>
      <TableCell align="left" sx={{ padding: isMobile ? '8px 4px' : '16px 12px' }}>
        <Stack direction="row" alignItems="center" spacing={isMobile ? 0.5 : 1}>
          <Typography
            variant={isMobile ? 'caption' : 'body2'}
            sx={{
              minWidth: '24px',
              color: darkMode ? '#919EAB' : '#637381',
              fontWeight: '500'
            }}
          >
            {id}
          </Typography>

          <Box
            sx={{
              width: isMobile ? 32 : 40,
              height: isMobile ? 32 : 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CollectionImageWrapper>
              <IconImage src={logoImageUrl} alt={`${name} Logo`} loading="lazy" />
            </CollectionImageWrapper>
          </Box>

          <Link
            underline="none"
            color="inherit"
            href={`/collection/${slug}`}
            rel="noreferrer noopener nofollow"
          >
            <Stack direction="column" spacing={0.5}>
              <Stack direction="row" spacing={isMobile ? 0.5 : 1} alignItems="center">
                <Typography
                  variant={isMobile ? 'subtitle2' : 'h6'}
                  sx={{
                    fontWeight: '700',
                    fontSize: isMobile ? '12px' : '16px',
                    lineHeight: 1.2,
                    width: isMobile ? '90px' : '180px',
                    minWidth: isMobile ? '90px' : '180px',
                    letterSpacing: '-0.02em',
                    color: darkMode ? '#fff' : '#212B36'
                  }}
                  noWrap
                >
                  {name}
                </Typography>
                {verified && (
                  <VerifiedIcon
                    sx={{
                      fontSize: isMobile ? 14 : 18,
                      color: theme.palette.primary.main
                    }}
                  />
                )}
              </Stack>
              <Typography
                variant={isMobile ? 'caption' : 'body2'}
                sx={{
                  fontWeight: '500',
                  fontSize: isMobile ? '10px' : '13px',
                  lineHeight: 1.2,
                  color: darkMode ? '#919EAB' : '#637381'
                }}
              >
                {strDateTime}
              </Typography>
            </Stack>
          </Link>
        </Stack>
      </TableCell>

      <TableCell align="right" sx={{ padding: isMobile ? '8px 4px' : '16px 12px' }}>
        <Typography
          variant={isMobile ? 'subtitle2' : 'h6'}
          noWrap
          sx={{
            fontWeight: '600',
            fontSize: isMobile ? '12px' : '16px',
            color: darkMode ? '#fff' : '#212B36'
          }}
        >
          ✕ {fNumber(floorPrice)}
        </Typography>
      </TableCell>

      <TableCell align="right" sx={{ padding: isMobile ? '8px 4px' : '16px 12px' }}>
        <Typography
          variant={isMobile ? 'subtitle2' : 'h6'}
          noWrap
          sx={{
            color: '#00AB55',
            fontWeight: '600',
            fontSize: isMobile ? '12px' : '16px'
          }}
        >
          ✕ {volume24h}
        </Typography>
      </TableCell>

      <TableCell align="right" sx={{ padding: isMobile ? '8px 4px' : '16px 12px' }}>
        <Typography
          variant={isMobile ? 'subtitle2' : 'h6'}
          noWrap
          sx={{
            color: '#00AB55',
            fontWeight: '600',
            fontSize: isMobile ? '12px' : '16px'
          }}
        >
          ✕ {totalVolumeDisplay}
        </Typography>
      </TableCell>

      <TableCell
        align="right"
        sx={{
          padding: isMobile ? '8px 4px' : '16px 12px',
          display: { xs: 'none', sm: 'table-cell' }
        }}
      >
        <Typography
          variant="h6"
          noWrap
          sx={{
            fontWeight: '600',
            fontSize: isMobile ? '12px' : '16px',
            color: darkMode ? '#fff' : '#212B36'
          }}
        >
          {fIntNumber(owners || 0)}
        </Typography>
      </TableCell>

      <TableCell
        align="right"
        sx={{
          padding: isMobile ? '8px 4px' : '16px 12px',
          display: { xs: 'none', sm: 'table-cell' }
        }}
      >
        <Typography
          variant="h6"
          noWrap
          sx={{
            fontWeight: '600',
            fontSize: isMobile ? '12px' : '16px',
            color: darkMode ? '#fff' : '#212B36'
          }}
        >
          {fIntNumber(items)}
        </Typography>
      </TableCell>
    </TableRow>
  );
});

// ListToolbar Component
const ListToolbar = ({ rows, setRows, page, setPage, total }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const num = total / rows;
  let page_count = Math.floor(num);
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
    const anchor = (event.target.ownerDocument || document).querySelector('#back-to-top-anchor');
    if (anchor) {
      anchor.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  return (
    <Grid container rowSpacing={isMobile ? 1 : 2} alignItems="center" sx={{ mt: 0, px: isMobile ? 1 : 0 }}>
      <Grid container item xs={12} sx={{ display: { xs: 'block', md: 'none' } }}>
        <Stack alignItems="center">
          <Pagination page={page + 1} onChange={handleChangePage} count={page_count} size="small" />
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
        <Stack alignItems="center">
          <Pagination page={page + 1} onChange={handleChangePage} count={page_count} />
        </Stack>
      </Grid>

      <Grid container item xs={6} md={4} lg={4} justifyContent="flex-end">
        <Stack direction="row" alignItems="center" spacing={isMobile ? 0.5 : 1}>
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
            size={isMobile ? 'small' : 'medium'}
            sx={{
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              '& .MuiSelect-select': {
                py: isMobile ? 0.5 : 1,
                px: isMobile ? 1 : 2
              }
            }}
          >
            <MenuItem value={100} sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
              100
            </MenuItem>
            <MenuItem value={50} sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
              50
            </MenuItem>
            <MenuItem value={20} sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
              20
            </MenuItem>
            <MenuItem value={10} sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
              10
            </MenuItem>
          </CustomSelect>
        </Stack>
      </Grid>
    </Grid>
  );
};

// Main CollectionList Component
export default function CollectionList({ type, category }) {
  const BASE_URL = 'https://api.xrpnft.com/api';

  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(50);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('totalVol24h');

  const [total, setTotal] = useState(0);
  const [collections, setCollections] = useState([]);

  const [sync, setSync] = useState(0);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const loadCollections = () => {
      const params = new URLSearchParams({
        limit: rows.toString(),
        orderBy: orderBy,
        order: order,
        compact: 'true'
      });

      if (page > 0) {
        params.append('offset', (page * rows).toString());
      }

      axios
        .get(`${BASE_URL}/collections?${params.toString()}`)
        .then((res) => {
          try {
            if (res.status === 200 && res.data) {
              const ret = res.data;
              setTotal(ret.count);
              setCollections(ret.collections);
            }
          } catch (error) {
            console.log(error);
          }
        })
        .catch((err) => {
          console.log('err->>', err);
        });
    };
    loadCollections();
  }, [sync, order, orderBy, page, rows]);


  const handleRequestSort = useCallback(
    (event, id) => {
      const isDesc = orderBy === id && order === 'desc';
      setOrder(isDesc ? 'asc' : 'desc');
      setOrderBy(id);
      setPage(0);
      setSync(sync + 1);
    },
    [orderBy, order, sync]
  );


  return (
    <>
      <Box sx={{ mb: 1 }} />

      <Box
        sx={{
          display: 'flex',
          gap: 1,
          py: 1,
          overflow: 'auto',
          width: '100%',
          '& > *': {
            scrollSnapAlign: 'center'
          },
          '::-webkit-scrollbar': { display: 'none' }
        }}
      >
        <Table style={{ minWidth: isMobile ? undefined : '1000px' }}>
          <ListHead order={order} orderBy={orderBy} onRequestSort={handleRequestSort} />
          <TableBody>
            {collections.map((row, idx) => (
              <Row key={row.slug || row.name || idx} id={page * rows + idx + 1} item={row} />
            ))}
          </TableBody>
        </Table>
      </Box>
      <ListToolbar rows={rows} setRows={setRows} page={page} setPage={setPage} total={total} />
    </>
  );
}