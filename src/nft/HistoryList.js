import axios from 'axios';
import { useState, useEffect, useContext } from 'react';

// Material
import {
  useTheme,
  useMediaQuery,
  Box,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Chip,
  Skeleton,
  Button
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';

// Context
import { AppContext } from 'src/AppContext';

// Utils
import { normalizeCurrencyCode } from 'src/utils/parseUtils';
import { fNumber } from 'src/utils/formatters';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: '12px',
  overflow: 'hidden',
  border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
  background: 'transparent'
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  '& .MuiTableCell-head': {
    color: alpha(theme.palette.text.secondary, 0.7),
    fontWeight: 400,
    fontSize: '0.8rem',
    padding: theme.spacing(1.2, 1.5),
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:last-child td': {
    borderBottom: 'none'
  }
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(1.2, 1.5),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
  fontSize: '0.9rem'
}));

const TransactionCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: '12px',
  backgroundColor: 'transparent',
  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`
}));

const getTypeColor = (type, theme) => {
  const colors = {
    SALE: '#10b981',
    MINT: '#8b5cf6',
    TRANSFER: '#3b82f6',
    CREATE_BUY_OFFER: alpha(theme.palette.text.secondary, 0.4),
    CREATE_SELL_OFFER: alpha(theme.palette.text.secondary, 0.4),
    CANCEL_BUY_OFFER: alpha(theme.palette.text.secondary, 0.3),
    CANCEL_SELL_OFFER: alpha(theme.palette.text.secondary, 0.3)
  };
  return colors[type] || alpha(theme.palette.text.secondary, 0.5);
};

const getTypeLabel = (type) => {
  const labels = {
    SALE: 'Sale',
    MINT: 'Mint',
    TRANSFER: 'Transfer',
    CREATE_BUY_OFFER: 'Buy Offer',
    CREATE_SELL_OFFER: 'Sell Offer',
    CANCEL_BUY_OFFER: 'Cancel Buy',
    CANCEL_SELL_OFFER: 'Cancel Sell'
  };
  return labels[type] || type;
};

const TypeChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'transactionType'
})(({ theme, transactionType }) => ({
  height: 22,
  fontSize: '0.75rem',
  fontWeight: 400,
  backgroundColor: alpha(getTypeColor(transactionType, theme), 0.08),
  color: getTypeColor(transactionType, theme),
  border: 'none',
  '& .MuiChip-label': {
    padding: '0 10px'
  }
}));

const AddressLink = styled(Link)(({ theme }) => ({
  color: alpha(theme.palette.text.primary, 0.8),
  textDecoration: 'none',
  fontFamily: 'monospace',
  fontSize: '0.85rem'
}));

const PriceText = styled(Typography)(({ theme }) => ({
  fontWeight: 400,
  fontSize: '0.9rem',
  color: theme.palette.text.primary,
  fontFamily: 'monospace'
}));

function formatAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes}m`;
    }
    return `${diffInHours}h`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
}

// Components extracted to avoid nested component definitions
const LoadingSkeleton = () => (
  <Stack spacing={2} sx={{ p: 2 }}>
    {[1, 2, 3].map((item) => (
      <Skeleton key={item} variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
    ))}
  </Stack>
);

const EmptyState = () => (
  <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
      No transaction history
    </Typography>
  </Stack>
);

export default function HistoryList({ nft }) {
  const theme = useTheme();
  const BASE_URL = 'https://api.xrpl.to/api';
  const { sync } = useContext(AppContext);
  const [hists, setHists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    function getHistories() {
      setLoading(true);
      axios
        .get(`${BASE_URL}/nft/history?NFTokenID=${nft.NFTokenID}&limit=50`)
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret && ret.result === 'success') {
            setHists(ret.histories);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error on getting nft history list!!!', err);
          setLoading(false);
        });
    }
    getHistories();
  }, [sync, nft.NFTokenID]);

  // Filter out noisy transactions unless showAll is true
  const importantTypes = ['SALE', 'MINT', 'TRANSFER'];
  const filteredHists = showAll
    ? hists
    : hists.filter(h => importantTypes.includes(h.type));

  // Deduplicate by creating unique key from type + time + account/seller/buyer
  const uniqueHists = filteredHists.filter((hist, index, self) => {
    const key = `${hist.type}_${hist.time}_${hist.seller || hist.buyer || hist.account}`;
    return index === self.findIndex(h =>
      `${h.type}_${h.time}_${h.seller || h.buyer || h.account}` === key
    );
  });

  if (loading) {
    return (
      <StyledPaper elevation={0}>
        <LoadingSkeleton />
      </StyledPaper>
    );
  }

  if (!hists || hists.length === 0) {
    return (
      <StyledPaper elevation={0}>
        <EmptyState />
      </StyledPaper>
    );
  }

  const sortedHists = uniqueHists.slice().reverse();
  const hasMoreTransactions = hists.length > filteredHists.length;

  return (
    <Stack spacing={1.5}>
      {hasMoreTransactions && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowAll(!showAll)}
            sx={{
              py: 0.5,
              px: 1.5,
              fontSize: '0.8rem',
              fontWeight: 400,
              textTransform: 'none',
              borderColor: alpha(theme.palette.divider, 0.2),
              borderRadius: '8px',
              color: alpha(theme.palette.text.secondary, 0.7),
              backgroundColor: 'transparent'
            }}
          >
            {showAll ? 'Show Key Events' : 'Show All'}
          </Button>
        </Box>
      )}
      <StyledPaper elevation={0}>
      {isMobile ? (
        // Mobile view - Cards
        <Stack spacing={1} sx={{ p: 1.5 }}>
          {sortedHists.map((row, index) => (
            <TransactionCard key={row.uuid} elevation={0}>
                <Stack spacing={1.2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <TypeChip
                      label={getTypeLabel(row.type)}
                      size="small"
                      transactionType={row.type}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      {formatDate(row.time)}
                    </Typography>
                  </Stack>

                  <Stack spacing={0.8}>
                    {row.seller && row.buyer ? (
                      <Box sx={{ fontSize: '0.8rem' }}>
                        <AddressLink href={`/profile/${row.seller}`}>
                          {formatAddress(row.seller)}
                        </AddressLink>
                        <Typography component="span" sx={{ mx: 0.5, color: alpha(theme.palette.text.secondary, 0.5) }}>→</Typography>
                        <AddressLink href={`/profile/${row.buyer}`}>
                          {formatAddress(row.buyer)}
                        </AddressLink>
                      </Box>
                    ) : (
                      <AddressLink href={`/profile/${row.account}`}>
                        {formatAddress(row.account)}
                      </AddressLink>
                    )}

                    {row.type === 'SALE' && (row.cost || row.costXRP) && (
                      <PriceText variant="body2">
                        {row.costXRP ? (
                          <>{fNumber(row.costXRP)} XRP</>
                        ) : (
                          <>
                            {fNumber(row.cost.amount)} {normalizeCurrencyCode(row.cost.currency)}
                          </>
                        )}
                      </PriceText>
                    )}
                  </Stack>
                </Stack>
            </TransactionCard>
          ))}
        </Stack>
      ) : (
        // Desktop view - Table
        <Box sx={{ overflowX: 'auto', width: '100%' }}>
          <Table size="small" sx={{ width: '100%' }}>
            <StyledTableHead>
              <TableRow>
                <StyledTableCell sx={{ width: '100px' }}>Type</StyledTableCell>
                <StyledTableCell sx={{ width: 'auto', minWidth: '280px' }}>From / To</StyledTableCell>
                <StyledTableCell align="right" sx={{ width: '140px' }}>Price</StyledTableCell>
                <StyledTableCell align="right" sx={{ width: '90px' }}>Date</StyledTableCell>
              </TableRow>
            </StyledTableHead>
            <TableBody>
              {sortedHists.map((row, index) => (
                  <StyledTableRow key={row.uuid}>
                    <StyledTableCell>
                      <TypeChip
                        label={getTypeLabel(row.type)}
                        size="small"
                        transactionType={row.type}
                      />
                    </StyledTableCell>
                    <StyledTableCell>
                      {row.seller && row.buyer ? (
                        <Box>
                          <AddressLink href={`/profile/${row.seller}`}>{formatAddress(row.seller)}</AddressLink>
                          <Typography component="span" sx={{ mx: 0.5, color: alpha(theme.palette.text.secondary, 0.5), fontSize: '0.75rem' }}>→</Typography>
                          <AddressLink href={`/profile/${row.buyer}`}>{formatAddress(row.buyer)}</AddressLink>
                        </Box>
                      ) : (
                        <AddressLink href={`/profile/${row.account}`}>{formatAddress(row.account)}</AddressLink>
                      )}
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      {row.type === 'SALE' && (row.cost || row.costXRP) ? (
                        <PriceText>
                          {row.costXRP ? (
                            <>{fNumber(row.costXRP)} XRP</>
                          ) : (
                            <>
                              {fNumber(row.cost.amount)} {normalizeCurrencyCode(row.cost.currency)}
                            </>
                          )}
                        </PriceText>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                          —
                        </Typography>
                      )}
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        {formatDate(row.time)}
                      </Typography>
                    </StyledTableCell>
                  </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
      </StyledPaper>
    </Stack>
  );
}
