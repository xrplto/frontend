import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Stack,
  Card,
  CardContent,
  CircularProgress,
  Link,
  Chip,
  useTheme,
  Toolbar,
  Pagination,
  styled,
  alpha
} from '@mui/material';
import axios from 'axios';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { fNumber } from 'src/utils/formatters';

const BASE_URL = 'https://api.xrpl.to/api';

const OverviewWrapper = styled(Box)(({ theme }) => `
  overflow: hidden;
  flex: 1;
  margin: 0;
  padding: 0;
`);

const TraderCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
  borderRadius: '12px',
  backgroundColor: 'transparent',
  border: `1.5px solid ${alpha(theme.palette.divider, 0.2)}`,
  transition: 'all 0.2s ease',
  '&:hover': {
    borderColor: alpha('#4285f4', 0.3),
    backgroundColor: alpha('#4285f4', 0.02)
  }
}));

const StyledPagination = styled(Pagination)(({ theme }) => ({
  '& .MuiPaginationItem-root': {
    color: theme.palette.text.primary,
    borderRadius: '12px',
    margin: '0 3px',
    fontWeight: 400,
    minWidth: '32px',
    height: '32px',
    border: `1.5px solid ${alpha(theme.palette.divider, 0.2)}`,
    '&:hover': {
      backgroundColor: alpha('#4285f4', 0.04),
      borderColor: '#4285f4'
    }
  },
  '& .Mui-selected': {
    backgroundColor: `${theme.palette.primary.main} !important`,
    color: '#fff !important',
    fontWeight: 400,
    borderColor: `${theme.palette.primary.main} !important`,
    '&:hover': {
      backgroundColor: `${theme.palette.primary.dark} !important`
    }
  }
}));

export default function TradersPage({ traders: initialTraders = [] }) {
  const theme = useTheme();
  const [traders] = useState(initialTraders);
  const [loading] = useState(false);
  const [page, setPage] = useState(0);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const rowsPerPage = 20;

  const paginatedTraders = traders.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const totalPages = Math.ceil(traders.length / rowsPerPage);

  return (
    <OverviewWrapper>
      <Toolbar id="back-to-top-anchor" />
      <Header
        notificationPanelOpen={notificationPanelOpen}
        onNotificationPanelToggle={setNotificationPanelOpen}
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography
          variant="h4"
          sx={{
            mb: 1,
            fontWeight: 400,
            fontSize: '1.75rem',
            color: theme.palette.text.primary
          }}
        >
          NFT Traders
        </Typography>
        <Typography
          variant="body2"
          sx={{
            mb: 4,
            color: alpha(theme.palette.text.secondary, 0.7),
            fontSize: '0.95rem'
          }}
        >
          Active NFT traders sorted by XRP balance
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress size={40} thickness={4} />
          </Box>
        ) : traders.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              backgroundColor: 'transparent',
              borderRadius: '12px',
              border: `1.5px dashed ${alpha(theme.palette.divider, 0.3)}`
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Traders Data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Trader data will appear here when available
            </Typography>
          </Box>
        ) : (
          <>
            {/* Header */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: '0.5fr 2fr 1.5fr 1.5fr 1.5fr 1.5fr 1.5fr'
                },
                gap: 2,
                p: 2,
                mb: 1,
                borderRadius: '12px',
                border: `1.5px solid ${alpha(theme.palette.divider, 0.2)}`,
                backgroundColor: 'transparent'
              }}
            >
              <Typography sx={{ display: { xs: 'none', md: 'block' }, fontWeight: 400, color: alpha(theme.palette.text.secondary, 0.7), fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>#</Typography>
              <Typography sx={{ display: { xs: 'none', md: 'block' }, fontWeight: 400, color: alpha(theme.palette.text.secondary, 0.7), fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trader</Typography>
              <Typography sx={{ display: { xs: 'none', md: 'block' }, fontWeight: 400, color: alpha(theme.palette.text.secondary, 0.7), fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>XRP Balance</Typography>
              <Typography sx={{ display: { xs: 'none', md: 'block' }, fontWeight: 400, color: alpha(theme.palette.text.secondary, 0.7), fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Buy Volume</Typography>
              <Typography sx={{ display: { xs: 'none', md: 'block' }, fontWeight: 400, color: alpha(theme.palette.text.secondary, 0.7), fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Sell Volume</Typography>
              <Typography sx={{ display: { xs: 'none', md: 'block' }, fontWeight: 400, color: alpha(theme.palette.text.secondary, 0.7), fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Collections</Typography>
              <Typography sx={{ display: { xs: 'none', md: 'block' }, fontWeight: 400, color: alpha(theme.palette.text.secondary, 0.7), fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Marketplaces</Typography>
            </Box>

            {/* Traders List */}
            <Stack spacing={0}>
              {paginatedTraders.map((trader, index) => (
                <TraderCard key={trader._id || trader.address || index}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          md: '0.5fr 2fr 1.5fr 1.5fr 1.5fr 1.5fr 1.5fr'
                        },
                        gap: 2,
                        alignItems: 'center'
                      }}
                    >
                      {/* Rank */}
                      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                        <Typography variant="body2" fontWeight="400" color="text.primary">
                          {page * rowsPerPage + index + 1}
                        </Typography>
                      </Box>

                      {/* Address */}
                      <Box>
                        <Link
                          href={`/profile/${trader._id || trader.address}`}
                          sx={{
                            textDecoration: 'none',
                            color: '#4285f4',
                            fontWeight: 400,
                            fontSize: '0.95rem',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          {(trader._id || trader.address)
                            ? `${(trader._id || trader.address).slice(0, 6)}...${(trader._id || trader.address).slice(-4)}`
                            : 'Unknown'}
                        </Link>
                      </Box>

                      {/* XRP Balance */}
                      <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: '0.7rem', display: { xs: 'block', md: 'none' }, mb: 0.5 }}
                        >
                          XRP Balance
                        </Typography>
                        <Typography variant="body2" fontWeight="400" color="text.primary">
                          {fNumber(trader.balance || 0)}
                        </Typography>
                      </Box>

                      {/* Buy Volume */}
                      <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: '0.7rem', display: { xs: 'block', md: 'none' }, mb: 0.5 }}
                        >
                          Buy Volume
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                          <TrendingUpIcon sx={{ color: theme.palette.primary.main, fontSize: 14 }} />
                          <Typography variant="body2" fontWeight="400" color="text.primary">
                            {fNumber(trader.buyVolume || 0)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            ({trader.buyCount || 0})
                          </Typography>
                        </Stack>
                      </Box>

                      {/* Sell Volume */}
                      <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: '0.7rem', display: { xs: 'block', md: 'none' }, mb: 0.5 }}
                        >
                          Sell Volume
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                          <TrendingDownIcon sx={{ color: '#F44336', fontSize: 14 }} />
                          <Typography variant="body2" fontWeight="400" color="text.primary">
                            {fNumber(trader.sellVolume || 0)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            ({trader.sellCount || 0})
                          </Typography>
                        </Stack>
                      </Box>

                      {/* Collections */}
                      <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: '0.7rem', display: { xs: 'block', md: 'none' }, mb: 0.5 }}
                        >
                          Collections
                        </Typography>
                        <Typography variant="body2" fontWeight="400" color="text.primary">
                          {trader.collectionsCount || (Array.isArray(trader.collectionsTraded)
                            ? trader.collectionsTraded.length
                            : trader.collectionsTraded || 0)}
                        </Typography>
                      </Box>

                      {/* Marketplaces */}
                      <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: '0.7rem', display: { xs: 'block', md: 'none' }, mb: 0.5 }}
                        >
                          Marketplaces
                        </Typography>
                        <Typography variant="body2" fontWeight="400" color="text.primary">
                          {trader.marketplacesCount || (Array.isArray(trader.marketplaces)
                            ? trader.marketplaces.length
                            : trader.marketplaces || 0)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </TraderCard>
              ))}
            </Stack>

            {/* Pagination */}
            {totalPages > 1 && (
              <Stack direction="row" justifyContent="center" sx={{ mt: 4 }}>
                <StyledPagination
                  count={totalPages}
                  page={page + 1}
                  onChange={(e, newPage) => setPage(newPage - 1)}
                  size="large"
                  showFirstButton
                  showLastButton
                />
              </Stack>
            )}
          </>
        )}
      </Container>

      <ScrollToTop />
      <Footer />
    </OverviewWrapper>
  );
}

export async function getStaticProps() {
  try {
    const response = await axios.get(`${BASE_URL}/nft/traders/active?sortBy=balance&limit=100`);
    const traders = response.data.traders || response.data || [];

    return {
      props: {
        traders
      },
      revalidate: 60
    };
  } catch (error) {
    console.error('Failed to fetch traders:', error.message);
    return {
      props: {
        traders: []
      },
      revalidate: 60
    };
  }
}
