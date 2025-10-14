import { Box, styled, Grid, Toolbar, Container, Typography, Paper, Stack, alpha, Chip } from '@mui/material';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Client } from 'xrpl';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import { isValidClassicAddress } from 'ripple-address-codec';
import { fCurrency5, fDateTime } from 'src/utils/formatters';
import { formatDistanceToNow } from 'date-fns';

const OverviewWrapper = styled(Box)(
  ({ theme }) => `
    overflow: hidden;
    flex: 1;
`
);

const OverView = ({ account }) => {
  const [data, setData] = useState(null);
  const [txHistory, setTxHistory] = useState([]);
  const [filteredTxHistory, setFilteredTxHistory] = useState([]);
  const [txFilter, setTxFilter] = useState('all');
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
          axios.get(`https://api.xrpl.to/api/trader/${account}`).catch(() => ({ data: null })),
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
            limit: 200
          });
          const txs = response.result.transactions || [];
          setTxHistory(txs);
          setFilteredTxHistory(txs);
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

  useEffect(() => {
    if (txFilter === 'all') {
      setFilteredTxHistory(txHistory);
      return;
    }

    const filtered = txHistory.filter(tx => {
      const txData = tx.tx_json || tx.tx;
      return txData.TransactionType === txFilter;
    });
    setFilteredTxHistory(filtered);
  }, [txFilter, txHistory]);

  const getAvailableTxTypes = () => {
    const types = new Set(['all']);
    txHistory.forEach(tx => {
      const txData = tx.tx_json || tx.tx;
      if (txData.TransactionType) {
        types.add(txData.TransactionType);
      }
    });
    return Array.from(types);
  };

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

  const winRate = data?.totalTrades > 0 ? (data.profitableTrades / data.totalTrades * 100) : 0;
  const totalPnL = (data?.realizedProfit || 0) + (data?.unrealizedProfit || 0);

  return (
    <OverviewWrapper>
      <Toolbar id="back-to-top-anchor" />
      <Header />
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        {account} Profile on XRPL
      </h1>

      <Container maxWidth="xl" sx={{ py: 1.5 }}>
        {/* Account Header */}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
            {account.substring(0, 8)}...{account.substring(account.length - 6)}
          </Typography>
          {data?.isAMM && <Chip label="AMM" size="small" sx={{ fontSize: '0.55rem', height: '14px', backgroundColor: alpha('#4285f4', 0.08), color: '#4285f4' }} />}
          {data?.firstTradeDate && (
            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4) }}>
              {fDateTime(data.firstTradeDate)} - {fDateTime(data.lastTradeDate)}
            </Typography>
          )}
        </Stack>

        {/* Key Metrics Grid */}
        {data && (
        <>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 2,
          mb: 1,
          pb: 1,
          borderBottom: `1px solid ${alpha('#fff', 0.04)}`
        }}>
          <Box>
            <Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), display: 'block' }}>P&L</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 500, color: totalPnL >= 0 ? '#10b981' : '#ef4444' }}>
              {fCurrency5(totalPnL)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), display: 'block' }}>ROI</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 500, color: data.avgROI >= 0 ? '#10b981' : '#ef4444' }}>
              {fCurrency5(data.avgROI)}%
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), display: 'block' }}>Win Rate</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
              {fCurrency5(winRate)}%
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), display: 'block' }}>Trades</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
              {data.totalTrades}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), display: 'block' }}>Volume</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
              {fCurrency5(data.totalVolume)}
            </Typography>
          </Box>
        </Box>

        {/* Period Stats Grid */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 2,
          mb: 1,
          pb: 1,
          borderBottom: `1px solid ${alpha('#fff', 0.04)}`
        }}>
          {[
            { label: '24H', profit: data.profit24h, volume: data.volume24h },
            { label: '7D', profit: data.profit7d, volume: data.volume7d },
            { label: '1M', profit: data.profit1m, volume: data.volume1m },
            { label: '2M', profit: data.profit2m, volume: data.volume2m },
            { label: '3M', profit: data.profit3m, volume: data.volume3m }
          ].map((period) => (
            <Box key={period.label}>
              <Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), display: 'block', mb: 0.3 }}>
                {period.label}
              </Typography>
              <Typography variant="body2" sx={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: period.profit !== 0 ? (period.profit >= 0 ? '#10b981' : '#ef4444') : (theme) => alpha(theme.palette.text.secondary, 0.3),
                display: 'block'
              }}>
                {period.profit !== 0 ? fCurrency5(period.profit) : '—'}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), display: 'block' }}>
                {period.volume !== 0 ? fCurrency5(period.volume) : '—'}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Detail Stats Grid */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 2,
          mb: 1.5,
          pb: 1,
          borderBottom: `1px solid ${alpha('#fff', 0.04)}`
        }}>
          <Box><Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), display: 'block' }}>Win/Loss</Typography><Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>{data.profitableTrades}/{data.losingTrades}</Typography></Box>
          <Box><Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), display: 'block' }}>Max Win</Typography><Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 500, color: '#10b981' }}>{fCurrency5(data.maxProfitTrade)}</Typography></Box>
          <Box><Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), display: 'block' }}>Max Loss</Typography><Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 500, color: '#ef4444' }}>{fCurrency5(data.maxLossTrade)}</Typography></Box>
          <Box><Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), display: 'block' }}>Buy/Sell</Typography><Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>{data.buyTrades}/{data.sellTrades}</Typography></Box>
          <Box><Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), display: 'block' }}>Realized</Typography><Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 500, color: data.realizedProfit >= 0 ? '#10b981' : '#ef4444' }}>{fCurrency5(data.realizedProfit)}</Typography></Box>
          <Box><Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), display: 'block' }}>Unrealized</Typography><Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 500, color: data.unrealizedProfit >= 0 ? '#10b981' : '#ef4444' }}>{fCurrency5(data.unrealizedProfit)}</Typography></Box>
        </Box>
        </>
        )}

        {/* Holdings */}
        {holdings && (
          <Box sx={{ mb: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.8 }}>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), textTransform: 'uppercase', fontWeight: 600 }}>
                Holdings ({holdings.total})
              </Typography>
              {holdings.accountActive === false ? (
                <Chip label="Deleted" size="small" sx={{ fontSize: '0.55rem', height: '14px', backgroundColor: alpha('#ef4444', 0.1), color: '#ef4444' }} />
              ) : holdings.accountData && (
                <>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                    XRP <Box component="span" sx={{ fontWeight: 500 }}>{fCurrency5(holdings.accountData.balanceDrops / 1000000)}</Box>
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4) }}>
                    Res {fCurrency5(holdings.accountData.reserveDrops / 1000000)}
                  </Typography>
                </>
              )}
            </Stack>
            {holdings.lines?.length > 0 && (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 0.8, mb: 0.8 }}>
                  {holdings.lines.map((line, idx) => (
                  <Box key={idx} sx={{
                    p: 0.6,
                    backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.15),
                    borderRadius: '4px'
                  }}>
                      <Stack direction="row" alignItems="center" spacing={0.4} sx={{ mb: 0.3 }}>
                        <Box component="img" src={`https://s1.xrpl.to/token/${line.token?.md5}`} sx={{ width: 14, height: 14, borderRadius: '2px' }} onError={(e) => { e.target.style.display = 'none'; }} />
                        <Typography variant="body2" sx={{ fontSize: '0.6rem', fontWeight: 500 }}>{line.token?.name || line.currency}</Typography>
                      </Stack>
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 500, display: 'block' }}>
                        {fCurrency5(line.value)} XRP
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), display: 'block' }}>
                        {fCurrency5(Math.abs(parseFloat(line.balance)))}
                      </Typography>
                  </Box>
                  ))}
                </Box>
                <Stack direction="row" spacing={1.5} justifyContent="center">
                  <Typography
                    component="button"
                    onClick={() => setHoldingsPage(Math.max(0, holdingsPage - 1))}
                    disabled={holdingsPage === 0}
                    sx={{
                      fontSize: '0.65rem',
                      color: holdingsPage === 0 ? (theme) => alpha(theme.palette.text.secondary, 0.3) : '#4285f4',
                      cursor: holdingsPage === 0 ? 'default' : 'pointer',
                      background: 'none',
                      border: 'none',
                      p: 0
                    }}
                  >
                    ← Prev
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4) }}>
                    {holdingsPage + 1}/{Math.ceil(holdings.total / 20)}
                  </Typography>
                  <Typography
                    component="button"
                    onClick={() => setHoldingsPage(holdingsPage + 1)}
                    disabled={holdingsPage >= Math.ceil(holdings.total / 20) - 1}
                    sx={{
                      fontSize: '0.65rem',
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
        {data?.tokensTraded?.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" sx={{
              fontSize: '0.6rem',
              color: (theme) => alpha(theme.palette.text.secondary, 0.4),
              textTransform: 'uppercase',
              fontWeight: 600,
              mb: 0.8,
              display: 'block'
            }}>
              Tokens ({data.tokensTraded.length})
            </Typography>
            <Box sx={{
              backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.2),
              borderRadius: '5px',
              overflow: 'hidden'
            }}>
              {/* Table Header */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '120px repeat(7, 1fr)',
                gap: 1.2,
                p: 1,
                borderBottom: `1px solid ${alpha('#fff', 0.04)}`,
                backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.1)
              }}>
                <Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), textTransform: 'uppercase', fontWeight: 600 }}>
                  Token
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), textTransform: 'uppercase', textAlign: 'right', fontWeight: 600 }}>
                  Buy/Sell Vol
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), textTransform: 'uppercase', textAlign: 'right', fontWeight: 600 }}>
                  Tokens
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), textTransform: 'uppercase', textAlign: 'right', fontWeight: 600 }}>
                  Avg Buy
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), textTransform: 'uppercase', textAlign: 'right', fontWeight: 600 }}>
                  Avg Sell
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), textTransform: 'uppercase', textAlign: 'right', fontWeight: 600 }}>
                  Balance
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), textTransform: 'uppercase', textAlign: 'right', fontWeight: 600 }}>
                  Real/Unreal
                </Typography>
              </Box>
              {/* Table Rows */}
              {data.tokensTraded.map((token, idx) => {
                // Calculate meaningful metrics
                const hasActivity = token.buyVolume > 0 || token.sellVolume > 0;
                const totalPnL = (token.realizedPnL || 0) + (token.unrealizedPnL || 0);

                return (
                  <Box key={idx} sx={{
                    display: 'grid',
                    gridTemplateColumns: '120px repeat(7, 1fr)',
                    gap: 1.2,
                    p: 1,
                    borderBottom: idx < data.tokensTraded.length - 1 ? `1px solid ${alpha('#fff', 0.02)}` : 'none',
                    '&:hover': {
                      backgroundColor: alpha('#fff', 0.015)
                    }
                  }}>
                    <Stack direction="row" alignItems="center" spacing={0.8}>
                      <Box
                        component="img"
                        src={`https://s1.xrpl.to/token/${token.tokenId}`}
                        sx={{ width: 18, height: 18, borderRadius: '4px' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                        {token.tokenName}
                      </Typography>
                    </Stack>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                        {token.buyVolume > 0 ? fCurrency5(token.buyVolume) : '—'}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4) }}>
                        {token.sellVolume > 0 ? fCurrency5(token.sellVolume) : '—'}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                        {token.buyTokenAmount > 0 ? fCurrency5(token.buyTokenAmount) : '—'}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4) }}>
                        {token.sellTokenAmount > 0 ? fCurrency5(token.sellTokenAmount) : '—'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', textAlign: 'right' }}>
                      {token.buyAvgPrice > 0 ? fCurrency5(token.buyAvgPrice) : '—'}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', textAlign: 'right' }}>
                      {token.sellAvgPrice > 0 ? fCurrency5(token.sellAvgPrice) : '—'}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', textAlign: 'right', fontWeight: 500 }}>
                      {Math.abs(token.balanceChange) > 0.00001 ? fCurrency5(token.balanceChange) : '0'}
                    </Typography>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        color: token.realizedPnL >= 0 ? '#10b981' : '#ef4444'
                      }}>
                        {Math.abs(token.realizedPnL) > 0.00001 ? fCurrency5(token.realizedPnL) : '0'}
                      </Typography>
                      <Typography variant="caption" sx={{
                        fontSize: '0.6rem',
                        color: token.unrealizedPnL >= 0 ? '#10b981' : '#ef4444'
                      }}>
                        {Math.abs(token.unrealizedPnL) > 0.00001 ? fCurrency5(token.unrealizedPnL) : '0'}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Transaction History */}
        {txHistory.length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.8 }}>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), textTransform: 'uppercase', fontWeight: 600 }}>
                Transactions ({filteredTxHistory.length})
              </Typography>
              <Stack direction="row" spacing={1}>
                {getAvailableTxTypes().map(filter => (
                  <Typography
                    key={filter}
                    component="button"
                    onClick={() => setTxFilter(filter)}
                    sx={{
                      fontSize: '0.6rem',
                      px: 1,
                      py: 0.3,
                      borderRadius: '3px',
                      border: `1px solid ${alpha('#fff', txFilter === filter ? 0.2 : 0.08)}`,
                      backgroundColor: txFilter === filter ? alpha('#4285f4', 0.08) : 'transparent',
                      color: txFilter === filter ? '#4285f4' : (theme) => alpha(theme.palette.text.secondary, 0.5),
                      cursor: 'pointer',
                      textTransform: 'none',
                      fontWeight: txFilter === filter ? 500 : 400
                    }}
                  >
                    {filter === 'all' ? 'All' : filter}
                  </Typography>
                ))}
              </Stack>
            </Stack>
            <Box sx={{ backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.2), borderRadius: '5px', overflow: 'hidden' }}>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '70px 100px 2fr 1fr 100px',
                gap: 1.5,
                p: 1,
                borderBottom: `1px solid ${alpha('#fff', 0.04)}`,
                backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.1)
              }}>
                <Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), fontWeight: 600 }}>Type</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), fontWeight: 600 }}>Hash</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), fontWeight: 600 }}>Action</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), fontWeight: 600, textAlign: 'right' }}>Amount</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.55rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4), fontWeight: 600 }}>Date</Typography>
              </Box>
              {filteredTxHistory.slice(0, 20).map((tx, idx) => {
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
                    gridTemplateColumns: '70px 100px 2fr 1fr 100px',
                    gap: 1.5,
                    p: 1,
                    borderBottom: idx < 19 ? `1px solid ${alpha('#fff', 0.02)}` : 'none',
                    '&:hover': { backgroundColor: alpha('#fff', 0.015) }
                  }}>
                    <Typography variant="caption" sx={{
                      fontSize: '0.6rem',
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
                        fontSize: '0.6rem',
                        fontFamily: 'monospace',
                        color: '#4285f4',
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      {tx.hash?.substring(0, 10)}...
                    </Typography>
                    <Typography variant="caption" sx={{
                      fontSize: '0.65rem',
                      color: actionColor,
                      fontWeight: 400
                    }}>
                      {actionDesc}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', textAlign: 'right', fontWeight: 500 }}>
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
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (theme) => alpha(theme.palette.text.secondary, 0.4) }}>
                      {formatDistanceToNow(date, { addSuffix: true })}
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
