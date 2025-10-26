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
  Skeleton
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';

// Context
import { AppContext } from 'src/AppContext';

// Utils
import { normalizeCurrencyCode } from 'src/utils/parseUtils';
import { fNumber } from 'src/utils/formatters';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: '8px',
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
  '&:hover': {
    backgroundColor: alpha(theme.palette.divider, 0.02)
  },
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
  borderRadius: '8px',
  backgroundColor: 'transparent',
  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`
}));

const TypeChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'transactionType'
})(({ theme, transactionType }) => ({
  height: 20,
  fontSize: '0.75rem',
  fontWeight: 400,
  backgroundColor: 'transparent',
  color: alpha(theme.palette.text.secondary, 0.7),
  border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
  '& .MuiChip-label': {
    padding: '0 8px'
  }
}));

const AddressLink = styled(Link)(({ theme }) => ({
  color: alpha(theme.palette.text.primary, 0.8),
  textDecoration: 'none',
  fontFamily: 'monospace',
  fontSize: '0.85rem',
  '&:hover': {
    color: theme.palette.text.primary
  }
}));

const PriceText = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
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

  const sortedHists = hists.slice().reverse();

  return (
    <StyledPaper elevation={0}>
      {isMobile ? (
        // Mobile view - Cards
        <Stack spacing={1} sx={{ p: 1.5 }}>
          {sortedHists.map((row, index) => (
            <TransactionCard key={row.uuid} elevation={0}>
                <Stack spacing={1.2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <TypeChip
                      label={row.type}
                      size="small"
                      transactionType={row.type}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      {formatDate(row.time)}
                    </Typography>
                  </Stack>

                  <Stack spacing={0.8}>
                    <AddressLink href={`/profile/${row.account}`}>
                      {formatAddress(row.account)}
                    </AddressLink>

                    {row.type === 'SALE' && (row.cost || row.costXRP) && (
                      <PriceText variant="body2">
                        {row.costXRP ? (
                          <>✕ {fNumber(row.costXRP)} XRP</>
                        ) : (
                          <>
                            {row.cost.currency === 'XRP' ? '✕' : ''} {fNumber(row.cost.amount)}{' '}
                            {normalizeCurrencyCode(row.cost.currency)}
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
        <Box>
          <Table size="small">
            <StyledTableHead>
              <TableRow>
                <StyledTableCell>Type</StyledTableCell>
                <StyledTableCell>From / To</StyledTableCell>
                <StyledTableCell align="right">Price</StyledTableCell>
                <StyledTableCell align="right">Date</StyledTableCell>
              </TableRow>
            </StyledTableHead>
            <TableBody>
              {sortedHists.map((row, index) => (
                  <StyledTableRow key={row.uuid}>
                    <StyledTableCell>
                      <TypeChip
                        label={row.type}
                        size="small"
                        transactionType={row.type}
                      />
                    </StyledTableCell>
                    <StyledTableCell>
                      <AddressLink href={`/profile/${row.account}`}>{formatAddress(row.account)}</AddressLink>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      {row.type === 'SALE' && (row.cost || row.costXRP) ? (
                        <PriceText>
                          {row.costXRP ? (
                            <>✕ {fNumber(row.costXRP)} XRP</>
                          ) : (
                            <>
                              {row.cost.currency === 'XRP' ? '✕' : ''} {fNumber(row.cost.amount)}{' '}
                              {normalizeCurrencyCode(row.cost.currency)}
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
  );
}
