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

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Account Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontSize: '1.25rem', fontWeight: 400 }}>
            {account.substring(0, 10)}...{account.substring(account.length - 8)}
          </Typography>
          {data?.isAMM && <Chip label="AMM" size="small" sx={{ fontSize: '11px', height: '20px', backgroundColor: alpha('#4285f4', 0.08), color: '#4285f4', border: 'none', fontWeight: 400 }} />}
          {data?.firstTradeDate && (
            <Typography variant="body2" sx={{ fontSize: '0.9rem', color: (theme) => alpha(theme.palette.text.secondary, 0.5), ml: 'auto' }}>
              {fDateTime(data.firstTradeDate)} → {fDateTime(data.lastTradeDate)}
            </Typography>
          )}
        </Stack>

        {/* Key Metrics */}
        {data && (
        <>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 4,
          mb: 4,
          pb: 4,
          borderBottom: `1px solid ${alpha('#fff', 0.06)}`
        }}>
          <Box>
            <Typography variant="body2" sx={{ fontSize: '0.85rem', color: (theme) => alpha(theme.palette.text.secondary, 0.6), mb: 1 }}>Balance</Typography>
            <Typography variant="h6" sx={{ fontSize: '1.4rem', fontWeight: 400, mb: 0.5 }}>
              {holdings?.accountData ? fCurrency5(holdings.accountData.balanceDrops / 1000000) : '—'} XRP
            </Typography>
            {holdings?.accountData && (
              <Typography variant="caption" sx={{ fontSize: '0.85rem', color: (theme) => alpha(theme.palette.text.secondary, 0.5) }}>
                {fCurrency5((holdings.accountData.balanceDrops - holdings.accountData.reserveDrops) / 1000000)} available
              </Typography>
            )}
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontSize: '0.85rem', color: (theme) => alpha(theme.palette.text.secondary, 0.6), mb: 1 }}>Total P&L</Typography>
            <Typography variant="h6" sx={{ fontSize: '1.4rem', fontWeight: 400, color: totalPnL >= 0 ? '#10b981' : '#ef4444', mb: 0.5 }}>
              {fCurrency5(totalPnL)} XRP
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.85rem', color: data.avgROI >= 0 ? alpha('#10b981', 0.7) : alpha('#ef4444', 0.7) }}>
              {fCurrency5(data.avgROI)}% ROI
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontSize: '0.85rem', color: (theme) => alpha(theme.palette.text.secondary, 0.6), mb: 1 }}>Trading</Typography>
            <Typography variant="h6" sx={{ fontSize: '1.4rem', fontWeight: 400, mb: 0.5 }}>
              {data.totalTrades}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.85rem', color: (theme) => alpha(theme.palette.text.secondary, 0.5) }}>
              {fCurrency5(winRate)}% win rate
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontSize: '0.85rem', color: (theme) => alpha(theme.palette.text.secondary, 0.6), mb: 1 }}>Volume</Typography>
            <Typography variant="h6" sx={{ fontSize: '1.4rem', fontWeight: 400, mb: 0.5 }}>
              {fCurrency5(data.totalVolume)}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.85rem', color: (theme) => alpha(theme.palette.text.secondary, 0.5) }}>
              {data.buyTrades} buys · {data.sellTrades} sells
            </Typography>
          </Box>
        </Box>

        {/* Period Performance */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 3,
          mb: 4,
          pb: 4,
          borderBottom: `1px solid ${alpha('#fff', 0.06)}`
        }}>
          {[
            { label: '24H', profit: data.profit24h, volume: data.volume24h },
            { label: '7D', profit: data.profit7d, volume: data.volume7d },
            { label: '1M', profit: data.profit1m, volume: data.volume1m },
            { label: '2M', profit: data.profit2m, volume: data.volume2m },
            { label: '3M', profit: data.profit3m, volume: data.volume3m }
          ].map((period) => (
            <Box key={period.label}>
              <Typography variant="body2" sx={{ fontSize: '0.85rem', color: (theme) => alpha(theme.palette.text.secondary, 0.6), mb: 1 }}>
                {period.label}
              </Typography>
              <Typography variant="body1" sx={{
                fontSize: '1.1rem',
                fontWeight: 400,
                color: period.profit !== 0 ? (period.profit >= 0 ? '#10b981' : '#ef4444') : (theme) => alpha(theme.palette.text.secondary, 0.4),
                mb: 0.5
              }}>
                {period.profit !== 0 ? fCurrency5(period.profit) : '—'}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.85rem', color: (theme) => alpha(theme.palette.text.secondary, 0.5) }}>
                {period.volume !== 0 ? fCurrency5(period.volume) : '—'} vol
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Trading Details */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 4,
          mb: 4,
          pb: 4,
          borderBottom: `1px solid ${alpha('#fff', 0.06)}`
        }}>
          <Box>
            <Typography variant="body2" sx={{ fontSize: '0.85rem', color: (theme) => alpha(theme.palette.text.secondary, 0.6), mb: 1 }}>Win/Loss Record</Typography>
            <Typography variant="body1" sx={{ fontSize: '1.1rem', fontWeight: 400 }}>
              {data.profitableTrades}W · {data.losingTrades}L
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontSize: '0.85rem', color: (theme) => alpha(theme.palette.text.secondary, 0.6), mb: 1 }}>Best Trade</Typography>
            <Typography variant="body1" sx={{ fontSize: '1.1rem', fontWeight: 400, color: '#10b981' }}>
              {fCurrency5(data.maxProfitTrade)} XRP
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontSize: '0.85rem', color: (theme) => alpha(theme.palette.text.secondary, 0.6), mb: 1 }}>Worst Trade</Typography>
            <Typography variant="body1" sx={{ fontSize: '1.1rem', fontWeight: 400, color: '#ef4444' }}>
              {fCurrency5(data.maxLossTrade)} XRP
            </Typography>
          </Box>
        </Box>
        </>
        )}

        {/* Holdings */}
        {holdings && (
          <Box sx={{ mb: 4 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontSize: '0.9rem', color: (theme) => alpha(theme.palette.text.secondary, 0.6) }}>
                Holdings ({holdings.total})
              </Typography>
              {holdings.accountActive === false && (
                <Chip label="Deleted" size="small" sx={{ fontSize: '11px', height: '20px', backgroundColor: alpha('#ef4444', 0.08), color: '#ef4444', border: 'none', fontWeight: 400 }} />
              )}
            </Stack>
            {holdings.lines?.length > 0 && (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, mb: 3 }}>
                  {holdings.lines.map((line, idx) => (
                  <Box key={idx} sx={{
                    p: 2,
                    backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.06),
                    borderRadius: '8px',
                    border: `1px solid ${alpha('#fff', 0.04)}`
                  }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <Box component="img" src={`https://s1.xrpl.to/token/${line.token?.md5}`} sx={{ width: 18, height: 18, borderRadius: '4px' }} onError={(e) => { e.target.style.display = 'none'; }} />
                        <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 400 }}>{line.token?.name || line.currency}</Typography>
                      </Stack>
                      <Typography variant="body1" sx={{ fontSize: '1rem', fontWeight: 400, mb: 0.5 }}>
                        {fCurrency5(line.value)} XRP
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.85rem', color: (theme) => alpha(theme.palette.text.secondary, 0.5) }}>
                        {fCurrency5(Math.abs(parseFloat(line.balance)))} tokens
                      </Typography>
                  </Box>
                  ))}
                </Box>
                <Stack direction="row" spacing={3} justifyContent="center" alignItems="center">
                  <Typography
                    component="button"
                    onClick={() => setHoldingsPage(Math.max(0, holdingsPage - 1))}
                    disabled={holdingsPage === 0}
                    sx={{
                      fontSize: '0.9rem',
                      fontWeight: 400,
                      color: holdingsPage === 0 ? (theme) => alpha(theme.palette.text.secondary, 0.4) : '#4285f4',
                      cursor: holdingsPage === 0 ? 'default' : 'pointer',
                      background: 'none',
                      border: 'none',
                      p: 0
                    }}
                  >
                    Previous
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.9rem', color: (theme) => alpha(theme.palette.text.secondary, 0.6) }}>
                    {holdingsPage + 1} / {Math.ceil(holdings.total / 20)}
                  </Typography>
                  <Typography
                    component="button"
                    onClick={() => setHoldingsPage(holdingsPage + 1)}
                    disabled={holdingsPage >= Math.ceil(holdings.total / 20) - 1}
                    sx={{
                      fontSize: '0.9rem',
                      fontWeight: 400,
                      color: holdingsPage >= Math.ceil(holdings.total / 20) - 1 ? (theme) => alpha(theme.palette.text.secondary, 0.4) : '#4285f4',
                      cursor: holdingsPage >= Math.ceil(holdings.total / 20) - 1 ? 'default' : 'pointer',
                      background: 'none',
                      border: 'none',
                      p: 0
                    }}
                  >
                    Next
                  </Typography>
                </Stack>
              </>
            )}
          </Box>
        )}

        {/* Tokens Table */}
        {data?.tokensTraded?.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="body2" sx={{
              fontSize: '0.9rem',
              color: (theme) => alpha(theme.palette.text.secondary, 0.6),
              mb: 2
            }}>
              Tokens Traded ({data.tokensTraded.length})
            </Typography>
            <Box sx={{
              backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.06),
              borderRadius: '8px',
              overflow: 'hidden',
              border: `1px solid ${alpha('#fff', 0.04)}`
            }}>
              {/* Table Header */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '140px repeat(4, 1fr)',
                gap: 2,
                px: 2,
                py: 1.5,
                borderBottom: `1px solid ${alpha('#fff', 0.04)}`,
                backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.04)
              }}>
                <Typography variant="body2" sx={{ fontSize: '0.85rem', color: (theme) => alpha(theme.palette.text.secondary, 0.6), fontWeight: 400 }}>
                  Token
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.85rem', color: (theme) => alpha(theme.palette.text.secondary, 0.6), textAlign: 'right', fontWeight: 400 }}>
                  Volume
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.85rem', color: (theme) => alpha(theme.palette.text.secondary, 0.6), textAlign: 'right', fontWeight: 400 }}>
                  Avg Price
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.85rem', color: (theme) => alpha(theme.palette.text.secondary, 0.6), textAlign: 'right', fontWeight: 400 }}>
                  Position
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.85rem', color: (theme) => alpha(theme.palette.text.secondary, 0.6), textAlign: 'right', fontWeight: 400 }}>
                  P&L
                </Typography>
              </Box>
              {/* Table Rows */}
              {data.tokensTraded.map((token, idx) => {
                const totalPnL = (token.realizedPnL || 0) + (token.unrealizedPnL || 0);
                const totalVolume = (token.buyVolume || 0) + (token.sellVolume || 0);
                const avgPrice = token.buyAvgPrice > 0 && token.sellAvgPrice > 0
                  ? (token.buyAvgPrice + token.sellAvgPrice) / 2
                  : token.buyAvgPrice || token.sellAvgPrice || 0;

                return (
                  <Box key={idx} sx={{
                    display: 'grid',
                    gridTemplateColumns: '140px repeat(4, 1fr)',
                    gap: 2,
                    px: 2,
                    py: 1.5,
                    borderBottom: idx < data.tokensTraded.length - 1 ? `1px solid ${alpha('#fff', 0.02)}` : 'none',
                    '&:hover': {
                      backgroundColor: alpha('#fff', 0.01)
                    }
                  }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box
                        component="img"
                        src={`https://s1.xrpl.to/token/${token.tokenId}`}
                        sx={{ width: 20, height: 20, borderRadius: '4px' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 400 }}>
                        {token.tokenName}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ fontSize: '0.9rem', textAlign: 'right', fontWeight: 400 }}>
                      {totalVolume > 0 ? fCurrency5(totalVolume) : '—'}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.9rem', textAlign: 'right', fontWeight: 400 }}>
                      {avgPrice > 0 ? fCurrency5(avgPrice) : '—'}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.9rem', textAlign: 'right', fontWeight: 400 }}>
                      {Math.abs(token.balanceChange) > 0.00001 ? fCurrency5(token.balanceChange) : '0'}
                    </Typography>
                    <Typography variant="body2" sx={{
                      fontSize: '0.9rem',
                      textAlign: 'right',
                      fontWeight: 400,
                      color: totalPnL >= 0 ? '#10b981' : '#ef4444'
                    }}>
                      {Math.abs(totalPnL) > 0.00001 ? fCurrency5(totalPnL) : '0'}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Transaction History */}
        {txHistory.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontSize: '0.9rem', color: (theme) => alpha(theme.palette.text.secondary, 0.6) }}>
                Transactions ({filteredTxHistory.length})
              </Typography>
              <Stack direction="row" spacing={1}>
                {getAvailableTxTypes().map(filter => (
                  <Typography
                    key={filter}
                    component="button"
                    onClick={() => setTxFilter(filter)}
                    sx={{
                      fontSize: '0.85rem',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '6px',
                      border: `1px solid ${alpha('#fff', txFilter === filter ? 0.15 : 0.04)}`,
                      backgroundColor: txFilter === filter ? alpha('#4285f4', 0.06) : 'transparent',
                      color: txFilter === filter ? '#4285f4' : (theme) => alpha(theme.palette.text.secondary, 0.6),
                      cursor: 'pointer',
                      textTransform: 'none',
                      fontWeight: 400
                    }}
                  >
                    {filter === 'all' ? 'All' : filter}
                  </Typography>
                ))}
              </Stack>
            </Stack>
            <Box sx={{ backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.06), borderRadius: '8px', overflow: 'hidden', border: `1px solid ${alpha('#fff', 0.04)}` }}>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '120px 2fr 1fr 120px',
                gap: 2,
                px: 2,
                py: 1.5,
                borderBottom: `1px solid ${alpha('#fff', 0.04)}`,
                backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.04)
              }}>
                <Typography variant="body2" sx={{ fontSize: '0.85rem', color: (theme) => alpha(theme.palette.text.secondary, 0.6), fontWeight: 400 }}>Type</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.85rem', color: (theme) => alpha(theme.palette.text.secondary, 0.6), fontWeight: 400 }}>Description</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.85rem', color: (theme) => alpha(theme.palette.text.secondary, 0.6), textAlign: 'right', fontWeight: 400 }}>Amount</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.85rem', color: (theme) => alpha(theme.palette.text.secondary, 0.6), fontWeight: 400 }}>Time</Typography>
              </Box>
              {filteredTxHistory.slice(0, 20).map((tx, idx) => {
                const txData = tx.tx_json || tx.tx;
                const meta = tx.meta;
                const date = new Date((txData.date + 946684800) * 1000);
                const sourceTagMap = {
                  10011010: 'Magnetic',
                  101102979: 'xrp.cafe',
                  74920348: 'First Ledger',
                  20221212: 'XPMarket',
                  69420589: 'Bidds',
                  110100111: 'Sologenic',
                  11782013: 'ANODEX',
                  20102305: 'Opulence',
                  42697468: 'Bithomp',
                  13888813: 'Zerpmon',
                  100010010: 'StaticBit',
                  80085: 'Zerpaay',
                  4152544945: 'ArtDept.fun',
                  510162502: 'Sonar Muse',
                  80008000: 'Orchestra',
                  123321: 'BearBull Scalper',
                  411555: 'N/A',
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
                  const parts = offerDetails.split(' → ');
                  actionDesc = `Offer to sell ${parts[0]} for ${parts[1]}`;
                  actionColor = '#4285f4';
                } else if (txData.TransactionType === 'OfferCancel') {
                  actionDesc = `Cancelled offer #${txData.OfferSequence || 'unknown'}`;
                  actionColor = '#ef4444';
                } else if (txData.TransactionType === 'Payment') {
                  const isSender = txData.Account === account;

                  // Check for dusting attack (incoming XRP < 0.001)
                  if (!isSender && typeof txData.Amount === 'string') {
                    const drops = parseInt(txData.Amount);
                    if (drops < 1000) {
                      actionDesc = `Dusting attack from ${txData.Account.substring(0, 8)}...`;
                      actionColor = '#ef4444';
                    }
                  }

                  if (!actionDesc) {
                    if (txData.SendMax && meta?.delivered_amount) {
                      const sendIsXRP = typeof txData.SendMax === 'string';
                      const deliveredIsXRP = typeof meta.delivered_amount === 'string';
                      if (sendIsXRP && !deliveredIsXRP) {
                        const xrpAmt = parseInt(txData.SendMax) / 1000000;
                        const curr = decodeCurrency(meta.delivered_amount.currency);
                        const tokenAmt = parseFloat(meta.delivered_amount.value);
                        actionDesc = `Swapped ${fCurrency5(xrpAmt)} XRP → ${fCurrency5(tokenAmt)} ${curr}`;
                        actionColor = '#10b981';
                      } else if (!sendIsXRP && deliveredIsXRP) {
                        const curr = decodeCurrency(txData.SendMax.currency);
                        const tokenAmt = parseFloat(txData.SendMax.value);
                        const xrpAmt = parseInt(meta.delivered_amount) / 1000000;
                        actionDesc = `Swapped ${fCurrency5(tokenAmt)} ${curr} → ${fCurrency5(xrpAmt)} XRP`;
                        actionColor = '#10b981';
                      } else {
                        actionDesc = isSender ? `Sent to ${txData.Destination.substring(0, 8)}...` : `Received from ${txData.Account.substring(0, 8)}...`;
                      }
                    } else {
                      actionDesc = isSender ? `Sent to ${txData.Destination?.substring(0, 8)}...` : `Received from ${txData.Account?.substring(0, 8)}...`;
                    }
                  }
                } else if (txData.TransactionType === 'TrustSet') {
                  const curr = decodeCurrency(txData.LimitAmount?.currency);
                  const limit = parseFloat(txData.LimitAmount?.value || 0);
                  actionDesc = limit === 0 ? `Removed trust line for ${curr}` : `Set trust line for ${curr}`;
                  actionColor = limit === 0 ? '#ef4444' : '#10b981';
                } else if (txData.TransactionType === 'NFTokenMint') {
                  const nftId = txData.NFTokenID || (meta?.nftoken_id);
                  const shortId = nftId ? `${nftId.substring(0, 8)}...${nftId.substring(nftId.length - 4)}` : '';
                  actionDesc = shortId ? `Minted NFT ${shortId}` : 'Minted NFT';
                  actionColor = '#10b981';
                } else if (txData.TransactionType === 'NFTokenBurn') {
                  const nftId = txData.NFTokenID;
                  const shortId = nftId ? `${nftId.substring(0, 8)}...${nftId.substring(nftId.length - 4)}` : '';
                  actionDesc = shortId ? `Burned NFT ${shortId}` : 'Burned NFT';
                  actionColor = '#ef4444';
                } else if (txData.TransactionType === 'NFTokenCreateOffer') {
                  const isSellOffer = txData.Flags & 1;
                  const nftId = txData.NFTokenID;
                  const shortId = nftId ? `${nftId.substring(0, 8)}...${nftId.substring(nftId.length - 4)}` : '';
                  const amt = txData.Amount ? (typeof txData.Amount === 'string' ? parseInt(txData.Amount) / 1000000 : parseFloat(txData.Amount.value)) : null;
                  if (isSellOffer && amt && shortId) {
                    actionDesc = `Listed NFT ${shortId} for ${fCurrency5(amt)} XRP`;
                  } else if (isSellOffer) {
                    actionDesc = shortId ? `Listed NFT ${shortId}` : 'Created sell offer';
                  } else {
                    actionDesc = shortId ? `Offered to buy NFT ${shortId}` : 'Created buy offer';
                  }
                  actionColor = '#4285f4';
                } else if (txData.TransactionType === 'NFTokenAcceptOffer') {
                  const nftId = txData.NFTokenID || (meta?.nftoken_id);
                  const shortId = nftId ? `${nftId.substring(0, 8)}...${nftId.substring(nftId.length - 4)}` : '';
                  actionDesc = shortId ? `Accepted offer for NFT ${shortId}` : 'Accepted NFT offer';
                  actionColor = '#10b981';
                } else if (txData.TransactionType === 'NFTokenCancelOffer') {
                  const offers = txData.NFTokenOffers || [];
                  if (offers.length === 1) {
                    const shortId = `${offers[0].substring(0, 8)}...${offers[0].substring(offers[0].length - 4)}`;
                    actionDesc = `Cancelled offer ${shortId}`;
                  } else if (offers.length > 1) {
                    actionDesc = `Cancelled ${offers.length} NFT offers`;
                  } else {
                    actionDesc = 'Cancelled NFT offer';
                  }
                  actionColor = '#ef4444';
                } else {
                  actionDesc = txData.TransactionType.replace(/([A-Z])/g, ' $1').trim();
                }

                return (
                  <Box key={idx} sx={{
                    display: 'grid',
                    gridTemplateColumns: '120px 2fr 1fr 120px',
                    gap: 2,
                    px: 2,
                    py: 1.5,
                    borderBottom: idx < 19 ? `1px solid ${alpha('#fff', 0.02)}` : 'none',
                    '&:hover': { backgroundColor: alpha('#fff', 0.01) }
                  }}>
                    <Typography variant="body2" sx={{
                      fontSize: '0.85rem',
                      color: txData.TransactionType === 'Payment' ? '#4285f4' : (theme) => alpha(theme.palette.text.secondary, 0.6),
                      fontWeight: 400
                    }}>
                      {txData.TransactionType}
                    </Typography>
                    <Box>
                      <Typography variant="body2" sx={{
                        fontSize: '0.9rem',
                        color: actionColor,
                        fontWeight: 400,
                        mb: sourceLabel ? 0.3 : 0
                      }}>
                        {actionDesc}
                      </Typography>
                      {sourceLabel && (
                        <Typography variant="caption" sx={{
                          fontSize: '0.8rem',
                          color: (theme) => alpha(theme.palette.text.secondary, 0.5),
                          fontWeight: 400
                        }}>
                          {sourceLabel}
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ fontSize: '0.9rem', textAlign: 'right', fontWeight: 400 }}>
                      {(() => {
                        if (txData.TransactionType === 'OfferCreate' || txData.TransactionType === 'OfferCancel') return '—';

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
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: (theme) => alpha(theme.palette.text.secondary, 0.5), fontWeight: 400 }}>
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
