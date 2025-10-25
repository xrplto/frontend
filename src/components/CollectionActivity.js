import axios from 'axios';
import { useState, useEffect, useContext } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Stack,
  Chip,
  Skeleton,
  Link,
  IconButton,
  Tooltip,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  CardMedia,
  Button,
  CircularProgress,
  Card,
  CardContent,
  useTheme,
  Grid,
  MenuItem,
  Pagination,
  Select
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { tableCellClasses } from '@mui/material/TableCell';
import { alpha } from '@mui/material/styles';
import PaymentIcon from '@mui/icons-material/Payment';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CollectionsIcon from '@mui/icons-material/Collections';
import SellIcon from '@mui/icons-material/Sell';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { formatDateTime } from 'src/utils/formatters';
import { AppContext } from 'src/AppContext';

// Styled components for ListToolbar
const CustomSelect = styled(Select)(({ theme }) => ({
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none'
  },
  '& .MuiSelect-select': {
    paddingRight: theme.spacing(4),
    fontWeight: 500,
    color: theme.palette.primary.main
  },
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));

const StyledBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: theme.spacing(1, 1.5),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: 'transparent',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  boxShadow: 'none'
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  color: theme.palette.text.secondary
}));

const StyledPagination = styled(Pagination)(({ theme }) => ({
  '& .MuiPaginationItem-root': {
    color: theme.palette.text.primary,
    borderRadius: '8px',
    margin: '0 3px',
    fontWeight: 400,
    minWidth: '32px',
    height: '32px',
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
    },
    '&.Mui-selected': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.common.white,
      fontWeight: 500,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark
      }
    }
  }
}));

// Styled components for AccountTransactions
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: 'transparent',
    color: theme.palette.text.secondary,
    fontWeight: 400,
    fontSize: '12px',
    padding: '16px 16px',
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    backdropFilter: 'blur(10px)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    letterSpacing: '0.3px',
    textTransform: 'none'
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: '13px',
    padding: '14px 16px',
    lineHeight: 1.6,
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.04)}`,
    backgroundColor: 'transparent'
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  position: 'relative',
  backgroundColor: 'transparent',
  '&:nth-of-type(even)': {
    backgroundColor: alpha(theme.palette.action.hover, 0.04)
  },
  '&:last-child td, &:last-child th': {
    border: 0
  }
}));

const CompactChip = styled(Chip)(({ theme }) => ({
  height: '32px',
  fontSize: '13px',
  fontWeight: 500,
  borderRadius: '12px',
  letterSpacing: '0.3px',
  '& .MuiChip-icon': {
    fontSize: '18px'
  }
}));

const CompactAccordion = styled(Accordion)(({ theme }) => ({
  '&.MuiAccordion-root': {
    marginBottom: '8px',
    borderRadius: '12px',
    background: 'transparent',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    boxShadow: 'none',
    '&:before': {
      display: 'none'
    }
  },
  '& .MuiAccordionSummary-root': {
    minHeight: '48px',
    padding: '0 20px',
    borderRadius: '12px',
    backgroundColor: 'transparent',
    '&.Mui-expanded': {
      minHeight: '48px'
    }
  },
  '& .MuiAccordionSummary-content': {
    margin: '12px 0',
    '&.Mui-expanded': {
      margin: '12px 0'
    }
  },
  '& .MuiAccordionDetails-root': {
    padding: '16px 20px 20px',
    borderTop: `1px solid ${alpha(theme.palette.divider, 0.04)}`,
    backgroundColor: 'transparent'
  }
}));

// ListToolbar Component
function NftListToolbar({ count, rows, setRows, page, setPage }) {
  const theme = useTheme();
  const num = count / rows;
  let page_count = Math.floor(num);
  if (num % 1 != 0) page_count++;

  const start = page * rows + 1;
  let end = start + rows - 1;
  if (end > count) end = count;

  const handleChangeRows = (event) => {
    setRows(parseInt(event.target.value, 10));
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage - 1);
    gotoTop(event);
  };

  const gotoTop = (event) => {
    const anchor = (event.target.ownerDocument || document).querySelector(
      '#back-to-top-tab-anchor'
    );

    if (anchor) {
      anchor.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <Grid container spacing={2} alignItems="center" sx={{ mt: 2, mb: 2 }}>
      <Grid size={{ xs: 12, md: 4 }}>
        <StyledTypography variant="body2">
          Showing {start} - {end} out of {count}
        </StyledTypography>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Stack alignItems="center">
          <StyledBox>
            <StyledPagination
              page={page + 1}
              onChange={handleChangePage}
              count={page_count}
              size={theme.breakpoints.down('md') ? 'small' : 'medium'}
            />
          </StyledBox>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="flex-end"
          sx={{ width: '100%', pr: 1 }}
        >
          <StyledBox sx={{ maxWidth: '100%' }}>
            <StyledTypography variant="body2">Show Rows</StyledTypography>
            <CustomSelect value={rows} onChange={handleChangeRows}>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={5}>5</MenuItem>
            </CustomSelect>
          </StyledBox>
        </Stack>
      </Grid>
    </Grid>
  );
}

// Helper function to render XRP address as a link
const renderAddressLink = (address, displayText = null) => {
  if (!address) return null;

  const text = displayText || `${address.slice(0, 6)}...`;

  return (
    <Link
      href={`/profile/${address}`}
      color="primary"
      underline="hover"
      sx={{
        fontSize: 'inherit',
        fontWeight: 500
      }}
    >
      {text}
    </Link>
  );
};

// Main AccountTransactions Component
export default function AccountTransactions({ creatorAccount, collectionSlug }) {
  const theme = useTheme();
  const { openSnackbar } = useContext(AppContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filterType, setFilterType] = useState('SALE');

  const fetchHistory = async () => {
    if (!collectionSlug) return;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (filterType) params.append('type', filterType);

      const res = await axios.get(`https://api.xrpl.to/api/nft/collections/${collectionSlug}/history?${params}`);

      setTransactions(res.data.history || []);
      setTotal(res.data.pagination?.total || 0);
      setHasMore(res.data.pagination?.hasMore || false);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Failed to fetch collection history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [collectionSlug, page, filterType]);

  const getTransactionColor = (type) => {
    if (type === 'SALE') return 'success';
    if (type.includes('BUY')) return 'primary';
    if (type.includes('SELL')) return 'info';
    if (type.includes('CANCEL')) return 'warning';
    if (type === 'TRANSFER') return 'secondary';
    return 'default';
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (!collectionSlug) {
    return (
      <Container
        maxWidth={false}
        sx={{
          pl: { xs: 2, sm: 0 },
          pr: { xs: 2, sm: 0 },
          maxWidth: '2000px'
        }}
      >
        <Card
          sx={{
            p: 4,
            mb: 3,
            borderRadius: '0',
            background: 'transparent',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            boxShadow: 'none',
            textAlign: 'center'
          }}
        >
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
            No creator account available
          </Typography>
        </Card>
      </Container>
    );
  }

  return (
    <Container
      maxWidth={false}
      sx={{
        pl: { xs: 2, sm: 0 },
        pr: { xs: 2, sm: 0 },
        maxWidth: '2000px'
      }}
    >
      <Box sx={{ mb: 3 }}>

          <Box sx={{ mb: 2.5, px: 2 }}>
            <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
              {['ALL', 'SALE', 'CREATE_BUY_OFFER', 'CREATE_SELL_OFFER', 'CANCEL_BUY_OFFER', 'TRANSFER'].map(type => (
                <Chip
                  key={type}
                  label={type === 'ALL' ? 'All' : type.replace(/_/g, ' ').toLowerCase()}
                  onClick={() => setFilterType(type === 'ALL' ? '' : type)}
                  variant="outlined"
                  size="small"
                  sx={{
                    fontSize: '11px',
                    height: '26px',
                    fontWeight: 400,
                    borderRadius: '8px',
                    textTransform: 'capitalize',
                    borderColor: (type === 'ALL' && !filterType) || filterType === type
                      ? alpha(theme.palette.primary.main, 0.5)
                      : alpha(theme.palette.divider, 0.2),
                    color: (type === 'ALL' && !filterType) || filterType === type
                      ? theme.palette.primary.main
                      : 'text.secondary',
                    backgroundColor: (type === 'ALL' && !filterType) || filterType === type
                      ? alpha(theme.palette.primary.main, 0.1)
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      borderColor: alpha(theme.palette.primary.main, 0.3)
                    }
                  }}
                />
              ))}
            </Stack>
          </Box>

          <Box sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ p: 2 }}>
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} variant="rectangular" height={50} sx={{ mb: 1, borderRadius: '6px' }} />
                ))}
              </Box>
            ) : error ? (
              <Box
                sx={{
                  p: 6,
                  textAlign: 'center',
                  background: 'transparent'
                }}
              >
                <Typography variant="h6" color="error.main" sx={{ fontWeight: 500, mb: 1 }}>
                  {error}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Please try refreshing the page or check back later
                </Typography>
              </Box>
            ) : transactions.length === 0 ? (
              <Box
                sx={{
                  p: 6,
                  textAlign: 'center',
                  background: 'transparent'
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
                  No Transactions Found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This collection hasn't had any recent activity
                </Typography>
              </Box>
            ) : (
              <>
                <Box
                  sx={{
                    overflow: 'auto',
                    maxHeight: { xs: '400px', sm: '600px', md: 'none' },
                    '&::-webkit-scrollbar': {
                      width: '8px',
                      height: '8px'
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'transparent',
                      borderRadius: '4px'
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.4),
                      borderRadius: '4px'
                    }
                  }}
                >
                  <Table
                    stickyHeader
                    size="medium"
                    sx={{
                      minWidth: { xs: '600px', sm: '700px', md: '100%' }
                    }}
                  >
                    <TableHead>
                      <TableRow>
                        <StyledTableCell>Type</StyledTableCell>
                        <StyledTableCell>NFT</StyledTableCell>
                        <StyledTableCell>Price</StyledTableCell>
                        <StyledTableCell>Fees</StyledTableCell>
                        <StyledTableCell>From</StyledTableCell>
                        <StyledTableCell>To</StyledTableCell>
                        <StyledTableCell>Origin</StyledTableCell>
                        <StyledTableCell>Date</StyledTableCell>
                        <StyledTableCell align="center">Tx</StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map((item, idx) => (
                        <StyledTableRow key={item.hash || idx}>
                          <StyledTableCell>
                            <Chip
                              label={item.type.replace(/_/g, ' ')}
                              variant="outlined"
                              size="small"
                              sx={{
                                fontSize: '10px',
                                height: '22px',
                                fontWeight: 400,
                                borderRadius: '6px',
                                borderColor: alpha(theme.palette[getTransactionColor(item.type)]?.main || theme.palette.divider, 0.3),
                                color: alpha(theme.palette[getTransactionColor(item.type)]?.main || theme.palette.text.secondary, 0.9),
                                backgroundColor: alpha(theme.palette[getTransactionColor(item.type)]?.main || theme.palette.divider, 0.08),
                                borderWidth: '1px',
                                textTransform: 'capitalize'
                              }}
                            />
                          </StyledTableCell>
                          <StyledTableCell>
                            {item.NFTokenID ? (
                              <Link href={`/nft/${item.NFTokenID}`} underline="none" color="inherit" sx={{ fontSize: '11px', color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                                {item.NFTokenID.slice(0,8)}...{item.NFTokenID.slice(-6)}
                              </Link>
                            ) : '-'}
                          </StyledTableCell>
                          <StyledTableCell>
                            {item.costXRP || item.amountXRP ? (
                              <Typography variant="caption" sx={{ fontSize: '11px', color: '#00AB55', fontWeight: 500 }}>
                                ✕{item.costXRP || item.amountXRP}
                              </Typography>
                            ) : '-'}
                          </StyledTableCell>
                          <StyledTableCell>
                            {item.brokerFeeXRP || item.royaltyAmountXRP ? (
                              <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center', flexWrap: 'wrap' }}>
                                {item.brokerFeeXRP && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                    <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: alpha(theme.palette.warning.main, 0.9) }} />
                                    <Typography variant="caption" sx={{ fontSize: '10px', color: 'text.secondary' }}>
                                      {item.brokerFeeXRP}
                                    </Typography>
                                  </Box>
                                )}
                                {item.royaltyAmountXRP && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                    <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: alpha(theme.palette.info.main, 0.9) }} />
                                    <Typography variant="caption" sx={{ fontSize: '10px', color: 'text.secondary' }}>
                                      {item.royaltyAmountXRP}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            ) : '-'}
                          </StyledTableCell>
                          <StyledTableCell>
                            {item.seller || item.account ? (
                              <Link href={`/profile/${item.seller || item.account}`} underline="none" color="inherit" sx={{ fontSize: '11px', color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                                {(item.seller || item.account).slice(0,6)}...{(item.seller || item.account).slice(-4)}
                              </Link>
                            ) : '-'}
                          </StyledTableCell>
                          <StyledTableCell>
                            {item.buyer || item.destination ? (
                              <Link href={`/profile/${item.buyer || item.destination}`} underline="none" color="inherit" sx={{ fontSize: '11px', color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                                {(item.buyer || item.destination).slice(0,6)}...{(item.buyer || item.destination).slice(-4)}
                              </Link>
                            ) : '-'}
                          </StyledTableCell>
                          <StyledTableCell>
                            {item.origin ? (
                              <Typography variant="caption" sx={{ fontSize: '11px', color: 'text.secondary' }}>
                                {item.origin === 'XRPL' && (item.broker === 'rpx9JThQ2y37FaGeeJP7PXDUVEXY3PHZSC' || item.SourceTag === 101102979) ? 'XRP Cafe' : item.origin}
                              </Typography>
                            ) : '-'}
                          </StyledTableCell>
                          <StyledTableCell>
                            <Typography variant="caption" sx={{ fontSize: '11px', color: 'text.secondary' }}>
                              {formatDate(item.time)}
                            </Typography>
                          </StyledTableCell>
                          <StyledTableCell align="center">
                            <IconButton
                              size="small"
                              sx={{ p: 0.4 }}
                              onClick={() => window.open(`/tx/${item.hash}`, '_blank')}
                            >
                              <OpenInNewIcon sx={{ fontSize: '13px', color: 'text.secondary' }} />
                            </IconButton>
                          </StyledTableCell>
                        </StyledTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>

                {/* Pagination */}
                {total > 20 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <Pagination
                      page={page + 1}
                      count={Math.ceil(total / 20)}
                      onChange={(e, newPage) => setPage(newPage - 1)}
                      color="primary"
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
      </Box>
    </Container>
  );
}

// Export the toolbar component as well
export { NftListToolbar };
