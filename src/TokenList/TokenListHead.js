import { visuallyHidden } from '@mui/utils';
import { withStyles } from '@mui/styles';
import {
  useMediaQuery,
  useTheme,
  Box,
  TableRow,
  TableCell,
  TableHead,
  TableSortLabel,
  Tooltip // Import Tooltip component
} from '@mui/material';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import InfoIcon from '@mui/icons-material/Info'; // Import InfoIcon from Material-UI Icons

const SmallInfoIcon = (props) => (
  (<InfoIcon {...props} fontSize="smaller" />) // Make the icon smaller by setting fontSize="small"
);

const StickyTableCell = withStyles((theme) => ({
  head: {
    position: 'sticky',
    zIndex: 1000,
    top: 0
  }
}))(TableCell);

const TABLE_HEAD = [
  { no: 0, id: 'star', label: '', align: 'left', width: '', order: false },
  { no: 1, id: 'id', label: '#', align: 'left', width: '', order: false },
  {
    no: 2,
    id: 'name',
    label: (
      <Tooltip title="Token name, issuer and launch type" placement="top">
        <span>
          Name <SmallInfoIcon />
        </span>
      </Tooltip>
    ),
    align: 'left',
    width: '11%',
    order: true
  },
  {
    no: 3,
    id: 'dateon',
    label: (
      <Tooltip title="Time since token creation" placement="top">
        <span>
          Created <SmallInfoIcon />
        </span>
      </Tooltip>
    ),
    align: 'right',
    width: '7%',
    order: true
  },
  {
    no: 4,
    id: 'exch',
    label: 'Price',
    align: 'right',
    width: '8%',
    order: true
  },
  {
    no: 5,
    id: 'pro5m',
    label: (
      <Tooltip title="Price change in the last 5 minutes" placement="top">
        <span>
          5m % <SmallInfoIcon />
        </span>
      </Tooltip>
    ),
    align: 'right',
    width: '6%',
    order: true
  },
  {
    no: 6,
    id: 'pro1h',
    label: (
      <Tooltip title="Price change in the last hour" placement="top">
        <span>
          1h % <SmallInfoIcon />
        </span>
      </Tooltip>
    ),
    align: 'right',
    width: '6%',
    order: true
  },
  {
    no: 7,
    id: 'pro24h',
    label: (
      <Tooltip title="Price change in the last 24 hours" placement="top">
        <span>
          24h % <SmallInfoIcon />
        </span>
      </Tooltip>
    ),
    align: 'right',
    width: '6%',
    order: true
  },
  {
    no: 8,
    id: 'pro7d',
    label: (
      <Tooltip title="Price change in the last 7 days" placement="top">
        <span>
          7d % <SmallInfoIcon />
        </span>
      </Tooltip>
    ),
    align: 'right',
    width: '6%',
    order: true
  },
  {
    no: 9,
    id: 'vol24hxrp',
    label: (
      <Tooltip
        title="Amount of XRP that has been traded with this token in the last 24 hours"
        placement="top"
      >
        <span>
          Volume <SmallInfoIcon />
        </span>
      </Tooltip>
    ),
    align: 'right',
    width: '10%',
    order: true
  },
  {
    no: 10,
    id: 'vol24htx',
    label: (
      <Tooltip
        title="Trades represents the total number of trade transactions for an asset on the XRPL DEX within the last 24 hours, indicating market activity and liquidity."
        placement="top"
      >
        <span>
          Trades <SmallInfoIcon />
        </span>
      </Tooltip>
    ),
    align: 'right',
    width: '6%',
    order: true
  },
  {
    no: 11,
    id: 'tvl',
    label: (
      <Tooltip
        title="Total Value Locked (TVL) represents the total value of assets deposited in the protocol"
        placement="top"
      >
        <span>
          TVL <SmallInfoIcon />
        </span>
      </Tooltip>
    ),
    align: 'right',
    width: '10%',
    order: true
  },
  {
    no: 12,
    id: 'marketcap',
    label: (
      <Tooltip title="Circulating supply * price" placement="top">
        <span>
          Market Cap <SmallInfoIcon />
        </span>
      </Tooltip>
    ),
    align: 'right',
    width: '10%',
    order: true
  },
  {
    no: 13,
    id: 'holders',
    label: (
      <Tooltip title="Number of unique addresses holding this token on the XRPL" placement="top">
        <span>
          Holders <SmallInfoIcon />
        </span>
      </Tooltip>
    ),
    align: 'right',
    width: '10%',
    order: true
  },
  {
    no: 14,
    id: 'supply',
    label: (
      <Tooltip
        title="The quantity of tokens in circulation within the market and held by the public is comparable to the shares in motion within the stock market."
        placement="top"
      >
        <span>
          Circulating Supply <SmallInfoIcon />
        </span>
      </Tooltip>
    ),
    align: 'right',
    width: '13%',
    order: true
  },
  {
    no: 15,
    id: 'historyGraph',
    label: 'Last 24h',
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
  tokens = [], // Provide a default empty array
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
        zIndex: 1002,
        transform: `translateY(${scrollTopLength}px)`,
        background: darkMode ? '#000000' : '#FFFFFF'
      }}
    >
      <TableRow
        sx={{
          '& .MuiTableCell-root': {
            fontSize: isMobile ? 11 : 12,
            fontWeight: '600',
            padding: '4px 8px',
            height: '36px',
            whiteSpace: 'nowrap',
            '&:not(:first-child)': {
              paddingLeft: '4px'
            }
          },
          '& .MuiTableCell-root:nth-of-type(1)': {
            position: 'sticky',
            zIndex: 1001,
            left: 0,
            background: darkMode ? '#000000' : '#FFFFFF'
          },
          '& .MuiTableCell-root:nth-of-type(2)': {
            position: 'sticky',
            zIndex: 1001,
            left: (tokens?.length ?? 0) > 0 ? (isMobile ? 28 : 48) : isMobile ? 8 : 28,
            background: darkMode ? '#000000' : '#FFFFFF',
            '&:before':
              isMobile && scrollLeft
                ? {
                    content: "''",
                    boxShadow: 'inset 10px 0 8px -8px #00000026',
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
          '& .MuiTableCell-root:nth-of-type(3)': !isMobile && {
            position: 'sticky',
            zIndex: 1001,
            background: darkMode ? '#000000' : '#FFFFFF',
            '&:before': scrollLeft
              ? {
                  content: "''",
                  boxShadow: 'inset 10px 0 8px -8px #00000026',
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
            fontSize: isMobile ? 11 : 12,
            '& .MuiTableSortLabel-icon': {
              fontSize: '16px'
            }
          }
        }}
      >
        {TABLE_HEAD.map((headCell) => {
          if (isMobile && headCell.id === 'id') return null;
          return (
            <StickyTableCell
              key={headCell.id}
              align={headCell.align}
              sortDirection={orderBy === headCell.id ? order : false}
              width={headCell.width}
              // ... [Rest of your StickyTableCell styles]
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
                // Render the label directly without TableSortLabel for unsortable columns
                (headCell.label)
              )}
            </StickyTableCell>
          );
        })}
      </TableRow>
    </TableHead>
  );
}
