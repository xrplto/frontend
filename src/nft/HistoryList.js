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

// Icons
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Loader
import { PulseLoader } from '../components/Spinners';

// Context
import { AppContext } from 'src/AppContext';

// Utils
import { normalizeCurrencyCode } from 'src/utils/parseUtils';
import { fNumber } from 'src/utils/formatters';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(1.5),
  overflow: 'hidden',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  background: theme.palette.background.paper,
  boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.grey[100], theme.palette.mode === 'dark' ? 0.05 : 0.5),
  '& .MuiTableCell-head': {
    color: theme.palette.text.secondary,
    fontWeight: 600,
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: theme.spacing(1, 1.5),
    borderBottom: 'none'
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.02)
  },
  '&:last-child td': {
    borderBottom: 'none'
  }
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(1.2, 1.5),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
  fontSize: '13px'
}));

const TransactionCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`
}));

const TypeChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'transactionType'
})(({ theme, transactionType }) => ({
  height: 22,
  fontSize: '11px',
  fontWeight: 400,
  backgroundColor:
    transactionType === 'SALE'
      ? alpha(theme.palette.success.main, 0.1)
      : alpha(theme.palette.info.main, 0.1),
  color: transactionType === 'SALE' ? theme.palette.success.dark : theme.palette.info.dark,
  border: `1px solid ${
    transactionType === 'SALE'
      ? alpha(theme.palette.success.main, 0.2)
      : alpha(theme.palette.info.main, 0.2)
  }`,
  '& .MuiChip-icon': {
    fontSize: '14px',
    marginLeft: '4px'
  },
  '& .MuiChip-label': {
    padding: '0 8px'
  }
}));

const AddressLink = styled(Link)(({ theme }) => ({
  color: theme.palette.text.primary,
  textDecoration: 'none',
  fontFamily: 'monospace',
  fontSize: '14px',
  '&:hover': {
    color: theme.palette.primary.main
  }
}));

const PriceText = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '13px',
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
  <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
    <SwapHorizIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
    <Typography variant="body2" color="text.secondary">
      No transaction history yet
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
        <Stack spacing={1.5} sx={{ p: 2 }}>
          {sortedHists.map((row, index) => (
            <TransactionCard key={row.uuid} elevation={0}>
                <Stack spacing={1.5}>
                  {/* Header */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <TypeChip
                      label={row.type}
                      size="small"
                      transactionType={row.type}
                      icon={row.type === 'SALE' ? <TrendingUpIcon /> : <SwapHorizIcon />}
                    />
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(row.time)}
                      </Typography>
                    </Stack>
                  </Stack>

                  {/* Content */}
                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <AccountCircleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <AddressLink href={`/profile/${row.account}`}>
                        {formatAddress(row.account)}
                      </AddressLink>
                    </Stack>

                    {row.type === 'SALE' && (
                      <Box
                        sx={{
                          bgcolor: alpha(theme.palette.success.main, 0.05),
                          borderRadius: 0.5,
                          px: 1.5,
                          py: 0.75,
                          border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
                        }}
                      >
                        <PriceText variant="body2">
                          {row.cost.currency === 'XRP' ? '✕' : ''} {fNumber(row.cost.amount)}{' '}
                          {normalizeCurrencyCode(row.cost.currency)}
                        </PriceText>
                      </Box>
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
                        icon={row.type === 'SALE' ? <TrendingUpIcon /> : <SwapHorizIcon />}
                      />
                    </StyledTableCell>
                    <StyledTableCell>
                      <AddressLink href={`/profile/${row.account}`}>{formatAddress(row.account)}</AddressLink>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      {row.type === 'SALE' && row.cost ? (
                        <PriceText>
                          {row.cost.currency === 'XRP' ? '✕' : ''} {fNumber(row.cost.amount)}{' '}
                          {normalizeCurrencyCode(row.cost.currency)}
                        </PriceText>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
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
