import { visuallyHidden } from '@mui/utils';
import {
  useMediaQuery,
  useTheme,
  Box,
  TableRow,
  TableCell,
  TableHead,
  TableSortLabel,
  Tooltip,
  Typography,
  alpha,
  styled
} from '@mui/material';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '0.75rem',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  color: theme.palette.text.secondary,
  padding: '16px 12px',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  whiteSpace: 'nowrap'
}));

const StyledTableSortLabel = styled(TableSortLabel)(({ theme }) => ({
  '&.MuiTableSortLabel-root': {
    color: 'inherit',
    '&:hover': {
      color: theme.palette.text.primary
    },
    '&.Mui-active': {
      color: theme.palette.primary.main,
      '& .MuiTableSortLabel-icon': {
        color: theme.palette.primary.main
      }
    }
  }
}));

const TABLE_HEAD = [
  { 
    id: 'star', 
    label: '', 
    align: 'left', 
    width: '', 
    order: false,
    sticky: true,
    mobileHide: false
  },
  {
    id: 'rank',
    label: '#',
    align: 'center',
    width: '3%',
    order: false,
    sticky: true,
    mobileHide: true
  },
  {
    id: 'token',
    label: 'TOKEN',
    align: 'left',
    width: '18%',
    order: true,
    sticky: true,
    mobileHide: false
  },
  {
    id: 'exch',
    label: 'PRICE',
    align: 'right',
    width: '8%',
    order: true,
    sticky: false,
    mobileHide: false
  },
  {
    id: 'pro5m',
    label: '5M %',
    align: 'right',
    width: '7%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: '5 minute change'
  },
  {
    id: 'pro1h',
    label: '1H %',
    align: 'right',
    width: '7%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: '1 hour change'
  },
  {
    id: 'pro24h',
    label: '24H %',
    align: 'right',
    width: '7%',
    order: true,
    sticky: false,
    mobileHide: false,
    tooltip: '24 hour change'
  },
  {
    id: 'marketcapMobile',
    label: 'MCAP',
    align: 'right',
    width: '8%',
    order: true,
    sticky: false,
    mobileHide: false,
    mobileOnly: true,
    tooltip: 'Market cap'
  },
  {
    id: 'pro7d',
    label: '7D %',
    align: 'right',
    width: '7%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: '7 day change'
  },
  {
    id: 'vol24hxrp',
    label: 'VOLUME',
    align: 'right',
    width: '8%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: '24h volume in XRP'
  },
  {
    id: 'dateon',
    label: 'CREATED',
    align: 'right',
    width: '8%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: 'Token creation date'
  },
  {
    id: 'vol24htx',
    label: 'TRADES',
    align: 'right',
    width: '7%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: '24h trade count'
  },
  {
    id: 'tvl',
    label: 'TVL',
    align: 'right',
    width: '10%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: 'Total Value Locked'
  },
  {
    id: 'marketcap',
    label: 'MARKET CAP',
    align: 'right',
    width: '10%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: 'Market capitalization'
  },
  {
    id: 'holders',
    label: 'HOLDERS',
    align: 'right',
    width: '10%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: 'Number of holders'
  },
  {
    id: 'supply',
    label: 'SUPPLY',
    align: 'right',
    width: '13%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: 'Circulating supply'
  },
  {
    id: 'historyGraph',
    label: 'LAST 24H',
    align: 'right',
    width: '15%',
    order: false,
    sticky: false,
    mobileHide: true
  },
];

export default function TokenListHead({
  order,
  orderBy,
  onRequestSort,
  scrollLeft,
  tokens = [],
  scrollTopLength
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { darkMode } = useContext(AppContext);

  const createSortHandler = (id, no) => (event) => {
    onRequestSort(event, id, no);
  };

  const getStickyLeft = (id) => {
    if (!TABLE_HEAD.find(h => h.id === id)?.sticky) return 'unset';
    
    // Fixed positions for sticky columns
    const stickyPositions = {
      'star': 0,
      'rank': isMobile ? 0 : 40,
      'token': isMobile ? 40 : 90
    };
    
    return stickyPositions[id] || 'unset';
  };

  return (
    <TableHead
      sx={{
        position: 'sticky',
        top: scrollTopLength || 0,
        zIndex: 10,
        background: 'transparent',
        '&::after': {
          content: '""',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '1px',
          background: alpha(theme.palette.divider, 0.12)
        }
      }}
    >
      <TableRow>
        {TABLE_HEAD.filter(column => {
          if (!column.id) return true;
          if (isMobile) {
            return !column.mobileHide;
          } else {
            return !column.mobileOnly;
          }
        }).map((headCell) => {
          const isSticky = headCell.sticky && (!isMobile || !headCell.mobileHide);
          
          return (
            <StyledTableCell
              key={headCell.id}
              align={headCell.align}
              sortDirection={orderBy === headCell.id ? order : false}
              sx={{
                width: headCell.width,
                ...(isSticky && {
                  position: 'sticky',
                  ...(headCell.stickyRight ? {
                    right: 0,
                    background: theme.palette.background.default
                  } : {
                    left: getStickyLeft(headCell.id)
                  }),
                  zIndex: 11,
                  background: headCell.stickyRight ? theme.palette.background.default : 'transparent',
                  '&::after': scrollLeft && headCell.id === 'token' ? {
                    content: '""',
                    position: 'absolute',
                    right: -1,
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    background: alpha(theme.palette.divider, 0.12),
                    boxShadow: `2px 0 4px ${alpha(theme.palette.common.black, 0.08)}`
                  } : {}
                })
              }}
            >
              {headCell.order ? (
                headCell.tooltip ? (
                  <Tooltip title={headCell.tooltip} placement="top">
                    <StyledTableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'desc'}
                      onClick={createSortHandler(headCell.id, headCell.no)}
                    >
                      {headCell.label}
                      {orderBy === headCell.id && (
                        <Box component="span" sx={{ ...visuallyHidden }}>
                          {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                        </Box>
                      )}
                    </StyledTableSortLabel>
                  </Tooltip>
                ) : (
                  <StyledTableSortLabel
                    active={orderBy === headCell.id}
                    direction={orderBy === headCell.id ? order : 'desc'}
                    onClick={createSortHandler(headCell.id, headCell.no)}
                  >
                    {headCell.label}
                    {orderBy === headCell.id && (
                      <Box component="span" sx={{ ...visuallyHidden }}>
                        {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                      </Box>
                    )}
                  </StyledTableSortLabel>
                )
              ) : (
                headCell.label
              )}
            </StyledTableCell>
          );
        })}
      </TableRow>
    </TableHead>
  );
}