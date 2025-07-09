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
  fontWeight: '600',
  fontSize: '13px',
  letterSpacing: '0.02em',
  textTransform: 'uppercase'
});

const TABLE_HEAD = (isMobile) => {
  if (isMobile) {
    return [
      {
        no: 0,
        id: 'name',
        label: (
          <Typography variant="inherit" sx={{ fontWeight: '600', fontSize: '10px' }}>
            Collection
          </Typography>
        ),
        align: 'left',
        width: '45%',
        order: false
      },
      {
        no: 1,
        id: 'floor.amount',
        label: (
          <Typography variant="inherit" sx={{ fontWeight: '600', fontSize: '10px' }}>
            Floor
          </Typography>
        ),
        align: 'right',
        width: '18%',
        order: true
      },
      {
        no: 2,
        id: 'volume',
        label: (
          <Typography variant="inherit" sx={{ fontWeight: '600', fontSize: '10px' }}>
            24h Vol
          </Typography>
        ),
        align: 'right',
        width: '18%',
        order: true
      },
      {
        no: 3,
        id: 'totalVolume',
        label: (
          <Typography variant="inherit" sx={{ fontWeight: '600', fontSize: '10px' }}>
            Total
          </Typography>
        ),
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
            fontSize: isMobile ? '10px' : '13px',
            fontWeight: '600',
            padding: isMobile ? '12px 4px' : '20px 12px',
            height: 'auto',
            whiteSpace: 'nowrap',
            color: darkMode ? '#919EAB' : '#637381',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            borderBottom: 'none',
            '&:not(:first-of-type)': {
              paddingLeft: isMobile ? '4px' : '8px'
            }
          },
          '& .MuiTableSortLabel-root': {
            fontSize: isMobile ? '10px' : '13px',
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
