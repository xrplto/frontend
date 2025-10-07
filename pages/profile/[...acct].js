import { Box, styled, Grid, Toolbar, Container, Typography, Paper, Stack, alpha, Chip } from '@mui/material';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import { isValidClassicAddress } from 'ripple-address-codec';
import { fCurrency5, fDateTime } from 'src/utils/formatters';

const OverviewWrapper = styled(Box)(
  ({ theme }) => `
    overflow: hidden;
    flex: 1;
`
);

const OverView = ({ account }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reset data and loading state when account changes
    setData(null);
    setLoading(true);

    const fetchProfile = async () => {
      try {
        console.log('🔥 REQUESTING TRADER:', account);
        const res = await axios.get(`https://api.xrpl.to/api/trader/${account}?t=${Date.now()}`);
        console.log('🔥 RECEIVED ADDRESS:', res.data.address);
        console.log('🔥 MATCH:', account === res.data.address);

        // Only set data if address matches what we requested
        if (res.data.address === account) {
          setData(res.data);
        } else {
          console.error('❌ ADDRESS MISMATCH! Requested:', account, 'Got:', res.data.address);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [account]);

  if (loading) {
    return (
      <OverviewWrapper>
        <Toolbar id="back-to-top-anchor" />
        <Header />
        <Container maxWidth="xl">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <Typography variant="body1" color="textSecondary">Loading...</Typography>
          </Box>
        </Container>
        <ScrollToTop />
        <Footer />
      </OverviewWrapper>
    );
  }

  if (!data) {
    return (
      <OverviewWrapper>
        <Toolbar id="back-to-top-anchor" />
        <Header />
        <Container maxWidth="xl">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <Typography variant="body1" color="textSecondary">No data available</Typography>
          </Box>
        </Container>
        <ScrollToTop />
        <Footer />
      </OverviewWrapper>
    );
  }

  const winRate = data.totalTrades > 0 ? (data.profitableTrades / data.totalTrades * 100) : 0;
  const totalPnL = (data.realizedProfit || 0) + (data.unrealizedProfit || 0);

  return (
    <OverviewWrapper>
      <Toolbar id="back-to-top-anchor" />
      <Header />

      <Container maxWidth="xl" sx={{ py: 2 }}>
        {/* Header - Ultra Compact */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5, pb: 1, borderBottom: `1px solid ${alpha('#fff', 0.04)}` }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 500 }}>Trader Profile</Typography>
            {data.isAMM && <Chip label="AMM" size="small" sx={{ fontSize: '0.6rem', height: '16px', backgroundColor: alpha('#4285f4', 0.08), color: '#4285f4' }} />}
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: (theme) => alpha(theme.palette.text.secondary, 0.5), fontFamily: 'monospace' }}>
              {account}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: (theme) => alpha(theme.palette.text.secondary, 0.35) }}>
              First: {fDateTime(data.firstTradeDate)}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: (theme) => alpha(theme.palette.text.secondary, 0.35) }}>
              Last: {fDateTime(data.lastTradeDate)}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: (theme) => alpha(theme.palette.text.secondary, 0.35) }}>
              Ledger: {data.lastProcessedLedger.toLocaleString()}
            </Typography>
          </Stack>

          {/* Key metrics - tighter */}
          <Stack direction="row" spacing={3}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600, color: totalPnL >= 0 ? '#10b981' : '#ef4444' }}>
                {fCurrency5(totalPnL)} XRP
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4) }}>P&L</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600, color: data.avgROI >= 0 ? '#10b981' : '#ef4444' }}>
                {fCurrency5(data.avgROI)}%
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4) }}>ROI</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                {fCurrency5(winRate)}%
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4) }}>Win Rate</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                {data.totalTrades}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4) }}>Trades</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                {fCurrency5(data.totalVolume)}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4) }}>Volume</Typography>
            </Box>
          </Stack>
        </Stack>

        {/* Time Periods - Inline */}
        <Stack direction="row" spacing={3} sx={{ mb: 1.5 }}>
          {[
            { label: '24H', profit: data.profit24h, volume: data.volume24h, trades: data.trades24h },
            { label: '7D', profit: data.profit7d, volume: data.volume7d, trades: data.trades7d },
            { label: '1M', profit: data.profit1m, volume: data.volume1m, trades: data.trades1m },
            { label: '2M', profit: data.profit2m, volume: data.volume2m, trades: data.trades2m },
            { label: '3M', profit: data.profit3m, volume: data.volume3m, trades: data.trades3m }
          ].map((period) => (
            <Box key={period.label} sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.3), fontWeight: 600, mb: 0.3, display: 'block' }}>
                {period.label}
              </Typography>
              <Stack direction="row" spacing={1.5}>
                <Box>
                  <Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4) }}>P&L</Typography>
                  <Typography variant="body2" sx={{
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    color: period.profit !== 0 ? (period.profit >= 0 ? '#10b981' : '#ef4444') : (theme) => alpha(theme.palette.text.secondary, 0.3)
                  }}>
                    {period.profit !== 0 ? fCurrency5(period.profit) : '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4) }}>Vol</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.7rem', color: period.volume === 0 ? (theme) => alpha(theme.palette.text.secondary, 0.3) : 'inherit' }}>
                    {period.volume !== 0 ? fCurrency5(period.volume) : '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4) }}>Tx</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.7rem', color: period.trades === 0 ? (theme) => alpha(theme.palette.text.secondary, 0.3) : 'inherit' }}>
                    {period.trades !== 0 ? period.trades : '—'}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          ))}
        </Stack>

        {/* Stats - Single Line */}
        <Stack direction="row" spacing={3} sx={{ mb: 2, pb: 1.5, borderBottom: `1px solid ${alpha('#fff', 0.04)}` }}>
          <Box><Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.3), fontWeight: 600 }}>WIN</Typography><Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{data.profitableTrades}</Typography></Box>
          <Box><Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.3), fontWeight: 600 }}>LOSS</Typography><Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{data.losingTrades}</Typography></Box>
          <Box><Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.3), fontWeight: 600 }}>MAX PROFIT</Typography><Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#10b981' }}>{fCurrency5(data.maxProfitTrade)}</Typography></Box>
          <Box><Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.3), fontWeight: 600 }}>MAX LOSS</Typography><Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#ef4444' }}>{fCurrency5(data.maxLossTrade)}</Typography></Box>
          <Box><Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.3), fontWeight: 600 }}>BUY TRADES</Typography><Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{data.buyTrades}</Typography></Box>
          <Box><Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.3), fontWeight: 600 }}>SELL TRADES</Typography><Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{data.sellTrades}</Typography></Box>
          <Box><Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.3), fontWeight: 600 }}>REALIZED</Typography><Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500, color: data.realizedProfit >= 0 ? '#10b981' : '#ef4444' }}>{fCurrency5(data.realizedProfit)} XRP</Typography></Box>
          <Box><Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.3), fontWeight: 600 }}>UNREALIZED</Typography><Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500, color: data.unrealizedProfit >= 0 ? '#10b981' : '#ef4444' }}>{fCurrency5(data.unrealizedProfit)} XRP</Typography></Box>
          <Box><Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.3), fontWeight: 600 }}>BUY VOL</Typography><Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{fCurrency5(data.buyVolume)} XRP</Typography></Box>
          <Box><Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.3), fontWeight: 600 }}>SELL VOL</Typography><Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{fCurrency5(data.sellVolume)} XRP</Typography></Box>
        </Stack>

        {/* Tokens Table */}
        {data.tokensTraded?.length > 0 && (
          <Box>
            <Typography variant="caption" sx={{
              fontSize: '0.75rem',
              color: (theme) => alpha(theme.palette.text.secondary, 0.5),
              textTransform: 'uppercase',
              fontWeight: 500,
              mb: 1.5,
              display: 'block'
            }}>
              Tokens Traded ({data.tokensTraded.length})
            </Typography>
            <Box sx={{
              backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.3),
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              {/* Table Header */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '140px repeat(9, 1fr)',
                gap: 1.5,
                p: 1.2,
                borderBottom: `1px solid ${alpha('#fff', 0.04)}`,
                backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.1)
              }}>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), textTransform: 'uppercase', fontWeight: 600 }}>
                  Token
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), textTransform: 'uppercase', textAlign: 'right', fontWeight: 600 }}>
                  Buy Vol
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), textTransform: 'uppercase', textAlign: 'right', fontWeight: 600 }}>
                  Sell Vol
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), textTransform: 'uppercase', textAlign: 'right', fontWeight: 600 }}>
                  Buy Tokens
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), textTransform: 'uppercase', textAlign: 'right', fontWeight: 600 }}>
                  Sell Tokens
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), textTransform: 'uppercase', textAlign: 'right', fontWeight: 600 }}>
                  Avg Buy
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), textTransform: 'uppercase', textAlign: 'right', fontWeight: 600 }}>
                  Avg Sell
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), textTransform: 'uppercase', textAlign: 'right', fontWeight: 600 }}>
                  Balance
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), textTransform: 'uppercase', textAlign: 'right', fontWeight: 600 }}>
                  Realized
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), textTransform: 'uppercase', textAlign: 'right', fontWeight: 600 }}>
                  Unrealized
                </Typography>
              </Box>
              {/* Table Rows */}
              {data.tokensTraded.map((token, idx) => (
                <Box key={idx} sx={{
                  display: 'grid',
                  gridTemplateColumns: '140px repeat(9, 1fr)',
                  gap: 1.5,
                  p: 1.2,
                  borderBottom: idx < data.tokensTraded.length - 1 ? `1px solid ${alpha('#fff', 0.02)}` : 'none',
                  '&:hover': {
                    backgroundColor: alpha('#fff', 0.015)
                  }
                }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      component="img"
                      src={`https://s1.xrpl.to/token/${token.tokenId}`}
                      sx={{ width: 22, height: 22, borderRadius: '5px' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <Box>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        {token.tokenName}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), fontFamily: 'monospace' }}>
                        {token.tokenCurrency}
                      </Typography>
                    </Box>
                  </Stack>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      {fCurrency5(token.buyVolume)}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4) }}>
                      {token.buyCount}×
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      {fCurrency5(token.sellVolume)}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4) }}>
                      {token.sellCount}×
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', textAlign: 'right' }}>
                    {fCurrency5(token.buyTokenAmount)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', textAlign: 'right' }}>
                    {fCurrency5(token.sellTokenAmount)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', textAlign: 'right' }}>
                    {fCurrency5(token.buyAvgPrice)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', textAlign: 'right' }}>
                    {fCurrency5(token.sellAvgPrice)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', textAlign: 'right' }}>
                    {fCurrency5(token.balanceChange)}
                  </Typography>
                  <Typography variant="body2" sx={{
                    fontSize: '0.75rem',
                    textAlign: 'right',
                    fontWeight: 500,
                    color: token.realizedPnL >= 0 ? '#10b981' : '#ef4444'
                  }}>
                    {fCurrency5(token.realizedPnL)}
                  </Typography>
                  <Typography variant="body2" sx={{
                    fontSize: '0.75rem',
                    textAlign: 'right',
                    fontWeight: 500,
                    color: token.unrealizedPnL >= 0 ? '#10b981' : '#ef4444'
                  }}>
                    {fCurrency5(token.unrealizedPnL)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Container>

      <ScrollToTop />
      <Footer />
    </OverviewWrapper>
  );
};

export default OverView;

export async function getServerSideProps(ctx) {
  try {
    const params = ctx.params.acct;
    const account = params[0];
    const tab = params[1] || 'overview';

    // Validate XRP address
    const isValid = isValidClassicAddress(account);
    if (!isValid) {
      return {
        redirect: {
          destination: '/404',
          permanent: false
        }
      };
    }

    // Build data object
    let data = {
      account,
      tab,
      limit: 32
    };

    // Handle collection-specific tabs
    if (tab?.includes('collection')) {
      data.collection = params[2];
      data.type = tab.replace('collection', '').toLowerCase();
    }

    // Add OGP metadata for better SEO and social sharing
    const ogp = {
      canonical: `https://xrpl.to/profile/${account}`,
      title: `Profile - ${account.substring(0, 8)}...${account.substring(account.length - 6)}`,
      url: `https://xrpl.to/profile/${account}`,
      imgUrl: 'https://xrpl.to/static/ogp.png',
      desc: `View portfolio, NFT collections, and trading activity for XRP Ledger account ${account.substring(0, 12)}...`
    };

    return {
      props: {
        ...data,
        ogp
      }
    };
  } catch (err) {
    console.error('Error in profile getServerSideProps:', err);
    return {
      redirect: {
        destination: '/404',
        permanent: false
      }
    };
  }
}
