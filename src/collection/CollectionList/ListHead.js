import { visuallyHidden } from '@mui/utils';
import { withStyles } from '@mui/styles';
import {
  Box,
  TableRow,
  TableCell,
  TableHead,
  TableSortLabel,
  useTheme,
  useMediaQuery,
  Typography
} from '@mui/material';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

const StickyTableCell = withStyles((theme) => ({
  head: {
    position: 'sticky',
    zIndex: 1000,
    top: 0,
    fontWeight: '600',
    fontSize: '13px',
    letterSpacing: '0.02em',
    textTransform: 'uppercase'
  }
}))(TableCell);

const TABLE_HEAD = (isMobile) => {
  if (isMobile) {
    return [
      {
        no: 0,
        id: 'name',
        label: (
          <Typography variant="inherit" sx={{ fontWeight: '600' }}>
            Collection
          </Typography>
        ),
        align: 'left',
        width: '40%',
        order: false
      },
      {
        no: 1,
        id: 'volume',
        label: (
          <Typography variant="inherit" sx={{ fontWeight: '600' }}>
            Volume (24h)
          </Typography>
        ),
        align: 'right',
        width: '30%',
        order: true
      },
      {
        no: 2,
        id: 'totalVolume',
        label: (
          <Typography variant="inherit" sx={{ fontWeight: '600' }}>
            Total Volume
          </Typography>
        ),
        align: 'right',
        width: '30%',
        order: true
      },
      {
        no: 3,
        id: 'floor.amount',
        label: (
          <Typography variant="inherit" sx={{ fontWeight: '600' }}>
            Floor
          </Typography>
        ),
        align: 'right',
        width: '30%',
        order: true
      }
    ];
  }
  return [
    {
      no: 0,
      id: 'name',
      label: (
        <Typography variant="inherit" sx={{ fontWeight: '600' }}>
          Collection
        </Typography>
      ),
      align: 'left',
      width: '35%',
      order: false
    },
    {
      no: 1,
      id: 'floor.amount',
      label: (
        <Typography variant="inherit" sx={{ fontWeight: '600' }}>
          Floor
        </Typography>
      ),
      align: 'right',
      width: '13%',
      order: true
    },
    {
      no: 2,
      id: 'volume',
      label: (
        <Typography variant="inherit" sx={{ fontWeight: '600' }}>
          Volume (24h)
        </Typography>
      ),
      align: 'right',
      width: '13%',
      order: true
    },
    {
      no: 3,
      id: 'totalVolume',
      label: (
        <Typography variant="inherit" sx={{ fontWeight: '600' }}>
          Total Volume
        </Typography>
      ),
      align: 'right',
      width: '13%',
      order: true
    },
    {
      no: 4,
      id: 'owners',
      label: (
        <Typography variant="inherit" sx={{ fontWeight: '600' }}>
          Owners
        </Typography>
      ),
      align: 'right',
      width: '13%',
      order: true
    },
    {
      no: 5,
      id: 'items',
      label: (
        <Typography variant="inherit" sx={{ fontWeight: '600' }}>
          Supply
        </Typography>
      ),
      align: 'right',
      width: '13%',
      order: true
    }
  ];
};

export default function ListHead({ order, orderBy, onRequestSort, scrollTopLength = 0 }) {
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
        background: darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${
          darkMode ? 'rgba(145, 158, 171, 0.12)' : 'rgba(145, 158, 171, 0.24)'
        }`,
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${
            darkMode ? 'rgba(145, 158, 171, 0.12)' : 'rgba(145, 158, 171, 0.24)'
          }, transparent)`
        }
      }}
    >
      <TableRow
        sx={{
          '& .MuiTableCell-root': {
            fontSize: isMobile ? '12px' : '13px',
            fontWeight: '600',
            padding: isMobile ? '16px 8px' : '20px 12px',
            height: 'auto',
            whiteSpace: 'nowrap',
            color: darkMode ? '#919EAB' : '#637381',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            borderBottom: 'none',
            '&:not(:first-of-type)': {
              paddingLeft: '8px'
            }
          },
          '& .MuiTableSortLabel-root': {
            fontSize: isMobile ? '12px' : '13px',
            fontWeight: '600',
            color: 'inherit',
            '&:hover': {
              color: darkMode ? '#fff' : '#212B36'
            },
            '&.Mui-active': {
              color: darkMode ? '#fff' : '#212B36',
              '& .MuiTableSortLabel-icon': {
                color: 'inherit'
              }
            },
            '& .MuiTableSortLabel-icon': {
              fontSize: '16px'
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
}
