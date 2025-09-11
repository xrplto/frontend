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
  Fade,
  Avatar
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';

// Icons
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Loader
import { PulseLoader } from 'react-spinners';

// Context
import { AppContext } from 'src/AppContext';

// Utils
import { normalizeCurrencyCodeXummImpl } from 'src/utils/normalizers';
import { fNumber } from 'src/utils/formatNumber';

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
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: theme.spacing(1.5, 2),
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
  padding: theme.spacing(2),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
  fontSize: '0.875rem'
}));

const TransactionCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  transition: 'all 0.2s ease',
  '&:hover': {
    borderColor: alpha(theme.palette.primary.main, 0.2),
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`
  }
}));

const TypeChip = styled(Chip)(({ theme, transactionType }) => ({
  height: 26,
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: transactionType === 'SALE' 
    ? alpha(theme.palette.success.main, 0.1)
    : alpha(theme.palette.info.main, 0.1),
  color: transactionType === 'SALE'
    ? theme.palette.success.dark
    : theme.palette.info.dark,
  border: `1px solid ${transactionType === 'SALE' 
    ? alpha(theme.palette.success.main, 0.3)
    : alpha(theme.palette.info.main, 0.3)}`,
  '& .MuiChip-icon': {
    color: 'inherit'
  }
}));

const AddressLink = styled(Link)(({ theme }) => ({
  color: theme.palette.text.primary,
  textDecoration: 'none',
  fontFamily: 'monospace',
  fontSize: '0.875rem',
  transition: 'color 0.2s ease',
  '&:hover': {
    color: theme.palette.primary.main,
    textDecoration: 'underline'
  }
}));

const PriceText = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.text.primary,
  fontFamily: 'monospace'
}));

function formatAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
      return `${diffInMinutes}m ago`;
    }
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
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
  const BASE_URL = 'https://api.xrpnft.com/api';
  const { sync } = useContext(AppContext);
  const [hists, setHists] = useState([]);
  const [loading, setLoading] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    function getHistories() {
      setLoading(true);
      axios
        .get(`${BASE_URL}/history/${nft.NFTokenID}`)
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
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
            <Fade in key={row.uuid} timeout={300} style={{ transitionDelay: `${index * 50}ms` }}>
              <TransactionCard elevation={0}>
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
                      <AddressLink href={`/account/${row.account}`}>
                        {formatAddress(row.account)}
                      </AddressLink>
                    </Stack>

                    {row.type === 'SALE' && (
                      <Box sx={{ 
                        bgcolor: alpha(theme.palette.success.main, 0.05),
                        borderRadius: 0.5,
                        px: 1.5,
                        py: 0.75,
                        border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
                      }}>
                        <PriceText variant="body2">
                          {row.cost.currency === 'XRP' ? '✕' : ''} {fNumber(row.cost.amount)}{' '}
                          {normalizeCurrencyCodeXummImpl(row.cost.currency)}
                        </PriceText>
                      </Box>
                    )}
                  </Stack>
                </Stack>
              </TransactionCard>
            </Fade>
          ))}
        </Stack>
      ) : (
        // Desktop view - Table
        <Box sx={{ overflow: 'auto', maxHeight: 400 }}>
          <Table stickyHeader size="small">
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
                <Fade in key={row.uuid} timeout={300} style={{ transitionDelay: `${index * 30}ms` }}>
                  <StyledTableRow>
                    <StyledTableCell>
                      <TypeChip
                        label={row.type}
                        size="small"
                        transactionType={row.type}
                        icon={row.type === 'SALE' ? <TrendingUpIcon /> : <SwapHorizIcon />}
                      />
                    </StyledTableCell>
                    <StyledTableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.light' }}>
                          <AccountCircleIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <AddressLink href={`/account/${row.account}`}>
                          {row.account}
                        </AddressLink>
                      </Stack>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      {row.type === 'SALE' ? (
                        <PriceText>
                          {row.cost.currency === 'XRP' ? '✕' : ''} {fNumber(row.cost.amount)}{' '}
                          {normalizeCurrencyCodeXummImpl(row.cost.currency)}
                        </PriceText>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.5}>
                        <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(row.time)}
                        </Typography>
                      </Stack>
                    </StyledTableCell>
                  </StyledTableRow>
                </Fade>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </StyledPaper>
  );
}