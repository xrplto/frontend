import { Box, styled, Grid, Toolbar, Container, Typography, Paper, Stack, alpha, Chip } from '@mui/material';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Client } from 'xrpl';
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
  const [txHistory, setTxHistory] = useState([]);
  const [holdings, setHoldings] = useState(null);
  const [holdingsPage, setHoldingsPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reset data and loading state when account changes
    setData(null);
    setTxHistory([]);
    setHoldings(null);
    setHoldingsPage(0);
    setLoading(true);

    const fetchData = async () => {
      try {
        // Fetch profile data and holdings
        const [profileRes, holdingsRes] = await Promise.all([
          axios.get(`https://api.xrpl.to/api/trader/${account}`),
          axios.get(`https://api.xrpl.to/api/trustlines/${account}?sortByValue=true&limit=20&page=0&format=full`)
        ]);

        setData(profileRes.data);
        setHoldings(holdingsRes.data);

        // Fetch XRPL transaction history via WebSocket
        const client = new Client('wss://s1.ripple.com');
        client.connect().then(async () => {
          const response = await client.request({
            command: 'account_tx',
            account: account,
            limit: 50
          });
          setTxHistory(response.result.transactions || []);
          client.disconnect();
        }).catch(err => {
          console.error('XRPL fetch failed:', err);
        });
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [account]);

  useEffect(() => {
    if (!account) return;
    const isInitialLoad = holdingsPage === 0 && !holdings;
    if (isInitialLoad) return;

    axios.get(`https://api.xrpl.to/api/trustlines/${account}?sortByValue=true&limit=20&page=${holdingsPage}&format=full`)
      .then(res => setHoldings(res.data))
      .catch(err => console.error('Failed to fetch holdings page:', err));
  }, [holdingsPage]);

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
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        {account} Profile on XRPL
      </h1>

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

        {/* Holdings */}
        {holdings && (
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), textTransform: 'uppercase', fontWeight: 600 }}>
                Holdings {holdings.total > 0 ? `(${holdings.total})` : ''}
              </Typography>
              {holdings.accountActive === false ? (
                <Chip label="Account Deleted" size="small" sx={{ fontSize: '0.6rem', height: '16px', backgroundColor: alpha('#ef4444', 0.1), color: '#ef4444' }} />
              ) : holdings.accountData && (
                <>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                    XRP: <Box component="span" sx={{ fontWeight: 500 }}>{fCurrency5(holdings.accountData.balanceDrops / 1000000)}</Box>
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: (theme) => alpha(theme.palette.text.secondary, 0.5) }}>
                    Reserve: {fCurrency5(holdings.accountData.reserveDrops / 1000000)}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: (theme) => alpha(theme.palette.text.secondary, 0.5) }}>
                    Spendable: {fCurrency5(holdings.accountData.spendableDrops / 1000000)}
                  </Typography>
                </>
              )}
            </Stack>
            {holdings.lines?.length > 0 && (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 1, mb: 1 }}>
                  {holdings.lines.map((line, idx) => (
                  <Box key={idx} sx={{
                    p: 0.8,
                    backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.15),
                    borderRadius: '5px'
                  }}>
                      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
                        <Box component="img" src={`https://s1.xrpl.to/token/${line.token?.md5}`} sx={{ width: 16, height: 16, borderRadius: '3px' }} onError={(e) => { e.target.style.display = 'none'; }} />
                        <Typography variant="body2" sx={{ fontSize: '0.65rem', fontWeight: 500 }}>{line.token?.name || line.currency}</Typography>
                      </Stack>
                      <Stack spacing={0.1}>
                        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.5) }}>
                          Bal: {fCurrency5(Math.abs(parseFloat(line.balance)))}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 500 }}>
                          {fCurrency5(line.value)} XRP
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4) }}>
                          {(line.percentOwned || 0).toFixed(2)}%
                        </Typography>
                      </Stack>
                  </Box>
                  ))}
                </Box>
                <Stack direction="row" spacing={2} justifyContent="center">
                  <Typography
                    component="button"
                    onClick={() => setHoldingsPage(Math.max(0, holdingsPage - 1))}
                    disabled={holdingsPage === 0}
                    sx={{
                      fontSize: '0.7rem',
                      color: holdingsPage === 0 ? (theme) => alpha(theme.palette.text.secondary, 0.3) : '#4285f4',
                      cursor: holdingsPage === 0 ? 'default' : 'pointer',
                      background: 'none',
                      border: 'none',
                      p: 0
                    }}
                  >
                    ← Prev
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: (theme) => alpha(theme.palette.text.secondary, 0.5) }}>
                    Page {holdingsPage + 1} of {Math.ceil(holdings.total / 20)}
                  </Typography>
                  <Typography
                    component="button"
                    onClick={() => setHoldingsPage(holdingsPage + 1)}
                    disabled={holdingsPage >= Math.ceil(holdings.total / 20) - 1}
                    sx={{
                      fontSize: '0.7rem',
                      color: holdingsPage >= Math.ceil(holdings.total / 20) - 1 ? (theme) => alpha(theme.palette.text.secondary, 0.3) : '#4285f4',
                      cursor: holdingsPage >= Math.ceil(holdings.total / 20) - 1 ? 'default' : 'pointer',
                      background: 'none',
                      border: 'none',
                      p: 0
                    }}
                  >
                    Next →
                  </Typography>
                </Stack>
              </>
            )}
          </Box>
        )}

        {/* Tokens Table */}
        {data.tokensTraded?.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{
              fontSize: '0.65rem',
              color: (theme) => alpha(theme.palette.text.secondary, 0.4),
              textTransform: 'uppercase',
              fontWeight: 600,
              mb: 1,
              display: 'block'
            }}>
              Tokens Traded ({data.tokensTraded.length})
            </Typography>
            <Box sx={{
              backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.2),
              borderRadius: '6px',
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

        {/* Transaction History */}
        {txHistory.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), textTransform: 'uppercase', fontWeight: 600, mb: 1, display: 'block' }}>
              Transaction History ({txHistory.length})
            </Typography>
            <Box sx={{ backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.2), borderRadius: '6px', overflow: 'hidden' }}>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '80px 110px 2fr 1fr 80px 110px',
                gap: 2,
                p: 1.2,
                borderBottom: `1px solid ${alpha('#fff', 0.04)}`,
                backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.1)
              }}>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), fontWeight: 600 }}>TYPE</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), fontWeight: 600 }}>HASH</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), fontWeight: 600 }}>ACTION</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), fontWeight: 600, textAlign: 'right' }}>AMOUNT</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), fontWeight: 600 }}>SOURCE</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), fontWeight: 600 }}>DATE</Typography>
              </Box>
              {txHistory.slice(0, 20).map((tx, idx) => {
                const txData = tx.tx_json || tx.tx;
                const meta = tx.meta;
                const date = new Date((txData.date + 946684800) * 1000);
                const sourceTagMap = {
                  101102979: 'xrp.cafe',
                  10011010: 'Magnetic',
                  74920348: 'First Ledger',
                  20221212: 'XPMarket',
                  69420589: 'Bidds',
                  110100111: 'Sologenic',
                  11782013: 'ANODEX',
                  20102305: 'Opulence',
                  13888813: 'Zerpmon',
                  100010010: 'StaticBit',
                  80085: 'Zerpaay',
                  4152544945: 'ArtDept.fun',
                  123321: 'BearBull Scalper',
                  411555: 'N/A',
                  80008000: 'Orchestra',
                  19089388: 'Bot'
                };
                const sourceLabel = txData.SourceTag ? sourceTagMap[txData.SourceTag] || `Tag ${txData.SourceTag}` : '';

                // Helper to decode hex currency codes
                const decodeCurrency = (code) => {
                  if (!code || code === 'XRP') return code;
                  if (code.length === 3) return code;
                  try {
                    const hex = code.replace(/0+$/, '');
                    if (hex.length === 0) return code;
                    const decoded = Buffer.from(hex, 'hex').toString('utf8').replace(/\0/g, '');
                    return decoded.match(/^[A-Za-z0-9]+$/) ? decoded : code.substring(0, 6);
                  } catch {
                    return code.substring(0, 6);
                  }
                };

                // Parse offer details for OfferCreate/OfferCancel
                let offerDetails = '';
                if (txData.TransactionType === 'OfferCreate' && txData.TakerGets && txData.TakerPays) {
                  // TakerGets = what maker is SELLING
                  // TakerPays = what maker is BUYING
                  const getsVal = typeof txData.TakerGets === 'string'
                    ? parseInt(txData.TakerGets) / 1000000
                    : parseFloat(txData.TakerGets.value);
                  const paysVal = typeof txData.TakerPays === 'string'
                    ? parseInt(txData.TakerPays) / 1000000
                    : parseFloat(txData.TakerPays.value);

                  const getsCurr = typeof txData.TakerGets === 'string'
                    ? 'XRP'
                    : decodeCurrency(txData.TakerGets.currency);
                  const paysCurr = typeof txData.TakerPays === 'string'
                    ? 'XRP'
                    : decodeCurrency(txData.TakerPays.currency);

                  if (getsVal < 1e15 && paysVal < 1e15) {
                    // Show from maker's perspective: selling → buying
                    offerDetails = `${fCurrency5(getsVal)} ${getsCurr} → ${fCurrency5(paysVal)} ${paysCurr}`;
                  }
                }

                // Build action description
                let actionDesc = '';
                let actionColor = 'inherit';

                if (txData.TransactionType === 'OfferCreate' && offerDetails) {
                  actionDesc = `Sell ${offerDetails.split(' → ')[0]} for ${offerDetails.split(' → ')[1]}`;
                  actionColor = '#4285f4';
                } else if (txData.TransactionType === 'OfferCancel') {
                  actionDesc = 'Cancel offer';
                  actionColor = '#ef4444';
                } else if (txData.TransactionType === 'Payment') {
                  if (txData.SendMax && meta?.delivered_amount) {
                    const sendIsXRP = typeof txData.SendMax === 'string';
                    const deliveredIsXRP = typeof meta.delivered_amount === 'string';
                    if (sendIsXRP && !deliveredIsXRP) {
                      const curr = decodeCurrency(meta.delivered_amount.currency);
                      actionDesc = `Convert XRP to ${curr}`;
                      actionColor = '#10b981';
                    } else if (!sendIsXRP && deliveredIsXRP) {
                      const curr = decodeCurrency(txData.SendMax.currency);
                      actionDesc = `Convert ${curr} to XRP`;
                      actionColor = '#10b981';
                    } else {
                      actionDesc = `Send to ${txData.Destination.substring(0, 12)}...`;
                    }
                  } else {
                    actionDesc = `Send to ${txData.Destination?.substring(0, 12)}...` || 'Payment';
                  }
                } else {
                  actionDesc = txData.TransactionType;
                }

                return (
                  <Box key={idx} sx={{
                    display: 'grid',
                    gridTemplateColumns: '80px 110px 2fr 1fr 80px 110px',
                    gap: 2,
                    p: 1.2,
                    borderBottom: idx < 19 ? `1px solid ${alpha('#fff', 0.02)}` : 'none',
                    '&:hover': { backgroundColor: alpha('#fff', 0.015) }
                  }}>
                    <Typography variant="caption" sx={{
                      fontSize: '0.65rem',
                      color: txData.TransactionType === 'OfferCreate' ? '#4285f4' : txData.TransactionType === 'OfferCancel' ? '#ef4444' : (theme) => alpha(theme.palette.text.secondary, 0.5),
                      fontWeight: 500
                    }}>
                      {txData.TransactionType}
                    </Typography>
                    <Typography
                      component="a"
                      href={`/tx/${tx.hash}`}
                      target="_blank"
                      variant="caption"
                      sx={{
                        fontSize: '0.65rem',
                        fontFamily: 'monospace',
                        color: '#4285f4',
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      {tx.hash?.substring(0, 12)}...
                    </Typography>
                    <Typography variant="caption" sx={{
                      fontSize: '0.7rem',
                      color: actionColor,
                      fontWeight: 400
                    }}>
                      {actionDesc}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', textAlign: 'right', fontWeight: 500 }}>
                      {(() => {
                        if (txData.TransactionType === 'OfferCreate' || txData.TransactionType === 'OfferCancel') return '—';

                        // Use delivered_amount from metadata if available
                        let amt = meta?.delivered_amount || txData.DeliverMax || txData.Amount;
                        if (!amt) return '—';

                        if (typeof amt === 'string') {
                          const xrp = parseInt(amt) / 1000000;
                          if (xrp > 1e9) return '—';
                          return `${fCurrency5(xrp)} XRP`;
                        }

                        const val = parseFloat(amt.value);
                        if (val > 1e12) return '—';
                        const curr = decodeCurrency(amt.currency);
                        return `${fCurrency5(val)} ${curr}`;
                      })()}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: (theme) => alpha(theme.palette.text.secondary, 0.5) }}>
                      {sourceLabel || '—'}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4) }}>
                      {fDateTime(date)}
                    </Typography>
                  </Box>
                );
              })}
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
