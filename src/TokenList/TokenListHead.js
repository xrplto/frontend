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
import InfoIcon from '@mui/icons-material/Info';

const SmallInfoIcon = (props) => {
  const { darkMode, ...otherProps } = props;
  return (
    <InfoIcon
      {...otherProps}
      sx={{
        fontSize: '14px',
        ml: 0.5,
        opacity: 0.7,
        transition: 'opacity 0.2s ease',
        '&:hover': {
          opacity: 1
        }
      }}
    />
  );
};

const StickyTableCell = styled(TableCell)(({ theme }) => ({
  position: 'sticky',
  zIndex: 11,
  top: 0,
  fontWeight: '600',
  fontSize: '13px',
  letterSpacing: '0.02em',
  textTransform: 'uppercase'
}));

const TABLE_HEAD = [
  { no: 0, id: 'star', label: '', align: 'left', width: '', order: false },
  {
    no: 1,
    id: 'name',
    label: (
      <Tooltip
        title="Token name, issuer and launch type"
        placement="top"
        componentsProps={{
          tooltip: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              fontSize: '12px',
              fontWeight: '500'
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
          <Typography variant="inherit" sx={{ fontWeight: '600' }}>
            Name
          </Typography>
          <SmallInfoIcon />
        </Box>
      </Tooltip>
    ),
    align: 'left',
    width: '11%',
    order: true
  },
  {
    no: 2,
    id: 'exch',
    label: (
      <Typography variant="inherit" sx={{ fontWeight: '600' }}>
        Price
      </Typography>
    ),
    align: 'right',
    width: '8%',
    order: true
  },
  {
    no: 3,
    id: 'pro5m',
    label: (
      <Tooltip
        title="Price change in the last 5 minutes"
        placement="top"
        componentsProps={{
          tooltip: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              fontSize: '12px',
              fontWeight: '500'
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
          <Typography variant="inherit" sx={{ fontWeight: '600' }}>
            5m %
          </Typography>
          <SmallInfoIcon />
        </Box>
      </Tooltip>
    ),
    align: 'right',
    width: '6%',
    order: true
  },
  {
    no: 4,
    id: 'pro1h',
    label: (
      <Tooltip
        title="Price change in the last hour"
        placement="top"
        componentsProps={{
          tooltip: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              fontSize: '12px',
              fontWeight: '500'
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
          <Typography variant="inherit" sx={{ fontWeight: '600' }}>
            1h %
          </Typography>
          <SmallInfoIcon />
        </Box>
      </Tooltip>
    ),
    align: 'right',
    width: '6%',
    order: true
  },
  {
    no: 5,
    id: 'pro24h',
    label: (
      <Tooltip
        title="Price change in the last 24 hours"
        placement="top"
        componentsProps={{
          tooltip: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              fontSize: '12px',
              fontWeight: '500'
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
          <Typography variant="inherit" sx={{ fontWeight: '600' }}>
            24h %
          </Typography>
          <SmallInfoIcon />
        </Box>
      </Tooltip>
    ),
    align: 'right',
    width: '6%',
    order: true
  },
  {
    no: 6,
    id: 'pro7d',
    label: (
      <Tooltip
        title="Price change in the last 7 days"
        placement="top"
        componentsProps={{
          tooltip: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              fontSize: '12px',
              fontWeight: '500'
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
          <Typography variant="inherit" sx={{ fontWeight: '600' }}>
            7d %
          </Typography>
          <SmallInfoIcon />
        </Box>
      </Tooltip>
    ),
    align: 'right',
    width: '6%',
    order: true
  },
  {
    no: 7,
    id: 'vol24hxrp',
    label: (
      <Tooltip
        title="Amount of XRP that has been traded with this token in the last 24 hours"
        placement="top"
        componentsProps={{
          tooltip: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              fontSize: '12px',
              fontWeight: '500'
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
          <Typography variant="inherit" sx={{ fontWeight: '600' }}>
            Volume
          </Typography>
          <SmallInfoIcon />
        </Box>
      </Tooltip>
    ),
    align: 'right',
    width: '10%',
    order: true
  },
  {
    no: 8,
    id: 'dateon',
    label: (
      <Tooltip
        title="Time since token creation"
        placement="top"
        componentsProps={{
          tooltip: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              fontSize: '12px',
              fontWeight: '500'
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
          <Typography variant="inherit" sx={{ fontWeight: '600' }}>
            Created
          </Typography>
          <SmallInfoIcon />
        </Box>
      </Tooltip>
    ),
    align: 'right',
    width: '7%',
    order: true
  },
  {
    no: 9,
    id: 'vol24htx',
    label: (
      <Tooltip
        title="Trades represents the total number of trade transactions for an asset on the XRPL DEX within the last 24 hours, indicating market activity and liquidity."
        placement="top"
        componentsProps={{
          tooltip: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              fontSize: '12px',
              fontWeight: '500'
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
          <Typography variant="inherit" sx={{ fontWeight: '600' }}>
            Trades
          </Typography>
          <SmallInfoIcon />
        </Box>
      </Tooltip>
    ),
    align: 'right',
    width: '6%',
    order: true
  },
  {
    no: 10,
    id: 'tvl',
    label: (
      <Tooltip
        title="Total Value Locked (TVL) represents the total value of assets deposited in the protocol"
        placement="top"
        componentsProps={{
          tooltip: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              fontSize: '12px',
              fontWeight: '500'
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
          <Typography variant="inherit" sx={{ fontWeight: '600' }}>
            TVL
          </Typography>
          <SmallInfoIcon />
        </Box>
      </Tooltip>
    ),
    align: 'right',
    width: '10%',
    order: true
  },
  {
    no: 11,
    id: 'marketcap',
    label: (
      <Tooltip
        title="Circulating supply * price"
        placement="top"
        componentsProps={{
          tooltip: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              fontSize: '12px',
              fontWeight: '500'
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
          <Typography variant="inherit" sx={{ fontWeight: '600' }}>
            Market Cap
          </Typography>
          <SmallInfoIcon />
        </Box>
      </Tooltip>
    ),
    align: 'right',
    width: '10%',
    order: true
  },
  {
    no: 12,
    id: 'holders',
    label: (
      <Tooltip
        title="Number of unique addresses holding this token on the XRPL"
        placement="top"
        componentsProps={{
          tooltip: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              fontSize: '12px',
              fontWeight: '500'
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
          <Typography variant="inherit" sx={{ fontWeight: '600' }}>
            Holders
          </Typography>
          <SmallInfoIcon />
        </Box>
      </Tooltip>
    ),
    align: 'right',
    width: '10%',
    order: true
  },
  {
    no: 13,
    id: 'supply',
    label: (
      <Tooltip
        title="Supply is token held by everyone"
        placement="top"
        componentsProps={{
          tooltip: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              fontSize: '12px',
              fontWeight: '500'
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
          <Typography variant="inherit" sx={{ fontWeight: '600' }}>
            Supply
          </Typography>
          <SmallInfoIcon />
        </Box>
      </Tooltip>
    ),
    align: 'right',
    width: '13%',
    order: true
  },
  {
    no: 14,
    id: 'historyGraph',
    label: (
      <Typography variant="inherit" sx={{ fontWeight: '600' }}>
        Last 24h
      </Typography>
    ),
    align: 'right',
    width: '5%',
    order: false
  },
  { id: '' }
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
  const createSortHandler = (id, no) => (event) => {
    onRequestSort(event, id, no);
  };

  const { darkMode } = useContext(AppContext);

  return (
    <TableHead
      sx={{
        position: 'sticky',
        zIndex: 1,
        transform: `translateY(${scrollTopLength}px)`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(
          theme.palette.background.paper,
          0.5
        )} 100%)`,
        backdropFilter: 'blur(25px)',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`
      }}
    >
      <TableRow
        sx={{
          '& .MuiTableCell-root': {
            fontSize: isMobile ? '11px' : '13px',
            fontWeight: '600',
            padding: isMobile ? '8px 4px' : '20px 12px',
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
          // First column (star) - sticky
          '& .MuiTableCell-root:nth-of-type(1)': {
            position: 'sticky',
            zIndex: 2,
            left: 0,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.7
            )} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`,
            backdropFilter: 'blur(25px)',
            width: isMobile ? '20px' : '24px',
            minWidth: isMobile ? '20px' : '24px',
            padding: isMobile ? '6px 4px' : '16px 8px'
          },
          // Second column (name - matches TokenRow combined ID+Name) - sticky
          '& .MuiTableCell-root:nth-of-type(2)': {
            position: 'sticky',
            zIndex: 2,
            left: isMobile ? '20px' : '24px',
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.7
            )} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`,
            backdropFilter: 'blur(25px)',
            padding: isMobile ? '6px 4px' : '16px 12px',
            '&:before': scrollLeft
              ? {
                  content: "''",
                  boxShadow: 'inset 10px 0 8px -8px rgba(145, 158, 171, 0.24)',
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  bottom: '-1px',
                  width: '30px',
                  transform: 'translate(100%)',
                  transition: 'box-shadow .3s',
                  pointerEvents: 'none'
                }
              : {}
          },
          '& .MuiTableSortLabel-root': {
            fontSize: isMobile ? '11px' : '13px',
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
              fontSize: isMobile ? '14px' : '16px'
            }
          }
        }}
      >
        {TABLE_HEAD.map((headCell) => {
          return (
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
                  onClick={createSortHandler(headCell.id, headCell.no)}
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
          );
        })}
      </TableRow>
    </TableHead>
  );
}
