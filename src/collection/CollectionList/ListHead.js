import { visuallyHidden } from '@mui/utils';
import { styled } from '@mui/material/styles';
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

const StickyTableCell = styled(TableCell)({
  position: 'sticky',
  zIndex: 1000,
  top: 0,
  fontWeight: '500',
  fontSize: '11px',
  letterSpacing: '0.01em',
  textTransform: 'uppercase'
});

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
}
