import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Client } from 'xrpl';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import { isValidClassicAddress } from 'ripple-address-codec';
import { fCurrency5, fDateTime } from 'src/utils/formatters';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

const OverView = ({ account }) => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
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
      <div className="overflow-hidden flex-1">
        <div id="back-to-top-anchor" className="h-16" />
        <Header />
        <div className="max-w-screen-2xl mx-auto w-full px-4">
          <div className="flex justify-center items-center min-h-[60vh]">
            <p className={cn("text-[15px]", isDark ? "text-white/60" : "text-gray-600")}>Loading...</p>
          </div>
        </div>
        <ScrollToTop />
        <Footer />
      </div>
    );
  }

  const winRate = data?.totalTrades > 0 ? (data.profitableTrades / data.totalTrades * 100) : 0;
  const totalPnL = (data?.realizedProfit || 0) + (data?.unrealizedProfit || 0);

  return (
    <div className="overflow-hidden flex-1">
      <div id="back-to-top-anchor" className="h-16" />
      <Header />
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        {account} Profile on XRPL
      </h1>

      <div className="max-w-screen-2xl mx-auto w-full px-4 py-6">
        {/* Account Header */}
        <div className="flex items-center gap-2 mb-4">
          <h2 className={cn("text-xl font-normal", isDark ? "text-white" : "text-gray-900")}>
            {account.substring(0, 10)}...{account.substring(account.length - 8)}
          </h2>
          {data?.isAMM && (
            <span className="text-[11px] h-5 px-2 rounded bg-[#4285f4]/10 text-[#4285f4] font-normal flex items-center">
              AMM
            </span>
          )}
          {data?.firstTradeDate && (
            <span className={cn("text-[0.9rem] ml-auto", isDark ? "text-white/50" : "text-gray-500")}>
              {fDateTime(data.firstTradeDate)} → {fDateTime(data.lastTradeDate)}
            </span>
          )}
        </div>

        {/* Key Metrics */}
        {data && (
        <>
        <div className={cn("grid grid-cols-4 gap-4 mb-4 pb-4 border-b", isDark ? "border-white/[0.06]" : "border-gray-200")}>
          <div>
            <p className={cn("text-[0.85rem] mb-1", isDark ? "text-white/60" : "text-gray-500")}>Balance</p>
            <p className={cn("text-[1.4rem] font-normal mb-0.5", isDark ? "text-white" : "text-gray-900")}>
              {holdings?.accountData ? fCurrency5(holdings.accountData.balanceDrops / 1000000) : '—'} XRP
            </p>
            {holdings?.accountData && (
              <span className={cn("text-[0.85rem]", isDark ? "text-white/50" : "text-gray-500")}>
                {fCurrency5((holdings.accountData.balanceDrops - holdings.accountData.reserveDrops) / 1000000)} available
              </span>
            )}
          </div>
          <div>
            <p className={cn("text-[0.85rem] mb-1", isDark ? "text-white/60" : "text-gray-500")}>Total P&L</p>
            <p className={cn("text-[1.4rem] font-normal mb-0.5", totalPnL >= 0 ? "text-[#10b981]" : "text-[#ef4444]")}>
              {fCurrency5(totalPnL)} XRP
            </p>
            <span className={cn("text-[0.85rem]", data.avgROI >= 0 ? "text-[#10b981]/70" : "text-[#ef4444]/70")}>
              {fCurrency5(data.avgROI)}% ROI
            </span>
          </div>
          <div>
            <p className={cn("text-[0.85rem] mb-1", isDark ? "text-white/60" : "text-gray-500")}>Trading</p>
            <p className={cn("text-[1.4rem] font-normal mb-0.5", isDark ? "text-white" : "text-gray-900")}>
              {data.totalTrades}
            </p>
            <span className={cn("text-[0.85rem]", isDark ? "text-white/50" : "text-gray-500")}>
              {fCurrency5(winRate)}% win rate
            </span>
          </div>
          <div>
            <p className={cn("text-[0.85rem] mb-1", isDark ? "text-white/60" : "text-gray-500")}>Volume</p>
            <p className={cn("text-[1.4rem] font-normal mb-0.5", isDark ? "text-white" : "text-gray-900")}>
              {fCurrency5(data.totalVolume)}
            </p>
            <span className={cn("text-[0.85rem]", isDark ? "text-white/50" : "text-gray-500")}>
              {data.buyTrades} buys · {data.sellTrades} sells
            </span>
          </div>
        </div>

        {/* Period Performance */}
        <div className={cn("grid grid-cols-5 gap-3 mb-4 pb-4 border-b", isDark ? "border-white/[0.06]" : "border-gray-200")}>
          {[
            { label: '24H', profit: data.profit24h, volume: data.volume24h },
            { label: '7D', profit: data.profit7d, volume: data.volume7d },
            { label: '1M', profit: data.profit1m, volume: data.volume1m },
            { label: '2M', profit: data.profit2m, volume: data.volume2m },
            { label: '3M', profit: data.profit3m, volume: data.volume3m }
          ].map((period) => (
            <div key={period.label}>
              <p className={cn("text-[0.85rem] mb-1", isDark ? "text-white/60" : "text-gray-500")}>
                {period.label}
              </p>
              <p className={cn(
                "text-[1.1rem] font-normal mb-0.5",
                period.profit !== 0
                  ? (period.profit >= 0 ? "text-[#10b981]" : "text-[#ef4444]")
                  : (isDark ? "text-white/40" : "text-gray-400")
              )}>
                {period.profit !== 0 ? fCurrency5(period.profit) : '—'}
              </p>
              <span className={cn("text-[0.85rem]", isDark ? "text-white/50" : "text-gray-500")}>
                {period.volume !== 0 ? fCurrency5(period.volume) : '—'} vol
              </span>
            </div>
          ))}
        </div>

        {/* Trading Details */}
        <div className={cn("grid grid-cols-3 gap-4 mb-4 pb-4 border-b", isDark ? "border-white/[0.06]" : "border-gray-200")}>
          <div>
            <p className={cn("text-[0.85rem] mb-1", isDark ? "text-white/60" : "text-gray-500")}>Win/Loss Record</p>
            <p className={cn("text-[1.1rem] font-normal", isDark ? "text-white" : "text-gray-900")}>
              {data.profitableTrades}W · {data.losingTrades}L
            </p>
          </div>
          <div>
            <p className={cn("text-[0.85rem] mb-1", isDark ? "text-white/60" : "text-gray-500")}>Best Trade</p>
            <p className="text-[1.1rem] font-normal text-[#10b981]">
              {fCurrency5(data.maxProfitTrade)} XRP
            </p>
          </div>
          <div>
            <p className={cn("text-[0.85rem] mb-1", isDark ? "text-white/60" : "text-gray-500")}>Worst Trade</p>
            <p className="text-[1.1rem] font-normal text-[#ef4444]">
              {fCurrency5(data.maxLossTrade)} XRP
            </p>
          </div>
        </div>
        </>
        )}

        {/* Holdings */}
        {holdings && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <p className={cn("text-[0.9rem]", isDark ? "text-white/60" : "text-gray-500")}>
                Holdings ({holdings.total})
              </p>
              {holdings.accountActive === false && (
                <span className="text-[11px] h-5 px-2 rounded bg-[#ef4444]/10 text-[#ef4444] font-normal flex items-center">
                  Deleted
                </span>
              )}
            </div>
            {holdings.lines?.length > 0 && (
              <>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {holdings.lines.map((line, idx) => (
                  <div key={idx} className={cn(
                    "p-2 rounded-lg border",
                    isDark ? "bg-white/[0.03] border-white/[0.04]" : "bg-gray-50 border-gray-200"
                  )}>
                      <div className="flex items-center gap-1 mb-1">
                        <img
                          src={`https://s1.xrpl.to/token/${line.token?.md5}`}
                          className="w-[18px] h-[18px] rounded"
                          onError={(e) => { e.target.style.display = 'none'; }}
                          alt=""
                        />
                        <span className={cn("text-[0.9rem] font-normal", isDark ? "text-white" : "text-gray-900")}>
                          {line.token?.name || line.currency}
                        </span>
                      </div>
                      <p className={cn("text-[1rem] font-normal mb-0.5", isDark ? "text-white" : "text-gray-900")}>
                        {fCurrency5(line.value)} XRP
                      </p>
                      <span className={cn("text-[0.85rem]", isDark ? "text-white/50" : "text-gray-500")}>
                        {fCurrency5(Math.abs(parseFloat(line.balance)))} tokens
                      </span>
                  </div>
                  ))}
                </div>
                <div className="flex gap-3 justify-center items-center">
                  <button
                    onClick={() => setHoldingsPage(Math.max(0, holdingsPage - 1))}
                    disabled={holdingsPage === 0}
                    className={cn(
                      "text-[0.9rem] font-normal bg-transparent border-none p-0",
                      holdingsPage === 0 ? (isDark ? "text-white/40 cursor-default" : "text-gray-400 cursor-default") : "text-[#4285f4] cursor-pointer"
                    )}
                  >
                    Previous
                  </button>
                  <span className={cn("text-[0.9rem]", isDark ? "text-white/60" : "text-gray-500")}>
                    {holdingsPage + 1} / {Math.ceil(holdings.total / 20)}
                  </span>
                  <button
                    onClick={() => setHoldingsPage(holdingsPage + 1)}
                    disabled={holdingsPage >= Math.ceil(holdings.total / 20) - 1}
                    className={cn(
                      "text-[0.9rem] font-normal bg-transparent border-none p-0",
                      holdingsPage >= Math.ceil(holdings.total / 20) - 1 ? (isDark ? "text-white/40 cursor-default" : "text-gray-400 cursor-default") : "text-[#4285f4] cursor-pointer"
                    )}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tokens Table */}
        {data?.tokensTraded?.length > 0 && (
          <div className="mb-4">
            <p className={cn("text-[0.9rem] mb-2", isDark ? "text-white/60" : "text-gray-500")}>
              Tokens Traded ({data.tokensTraded.length})
            </p>
            <div className={cn(
              "rounded-lg overflow-hidden border",
              isDark ? "bg-white/[0.03] border-white/[0.04]" : "bg-gray-50 border-gray-200"
            )}>
              {/* Table Header */}
              <div className={cn(
                "grid gap-2 px-2 py-1.5 border-b",
                isDark ? "bg-white/[0.02] border-white/[0.04]" : "bg-gray-100 border-gray-200"
              )} style={{ gridTemplateColumns: '140px repeat(4, 1fr)' }}>
                <span className={cn("text-[0.85rem] font-normal", isDark ? "text-white/60" : "text-gray-500")}>
                  Token
                </span>
                <span className={cn("text-[0.85rem] font-normal text-right", isDark ? "text-white/60" : "text-gray-500")}>
                  Volume
                </span>
                <span className={cn("text-[0.85rem] font-normal text-right", isDark ? "text-white/60" : "text-gray-500")}>
                  Avg Price
                </span>
                <span className={cn("text-[0.85rem] font-normal text-right", isDark ? "text-white/60" : "text-gray-500")}>
                  Position
                </span>
                <span className={cn("text-[0.85rem] font-normal text-right", isDark ? "text-white/60" : "text-gray-500")}>
                  P&L
                </span>
              </div>
              {/* Table Rows */}
              {data.tokensTraded.map((token, idx) => {
                const tokenPnL = (token.realizedPnL || 0) + (token.unrealizedPnL || 0);
                const totalVolume = (token.buyVolume || 0) + (token.sellVolume || 0);
                const avgPrice = token.buyAvgPrice > 0 && token.sellAvgPrice > 0
                  ? (token.buyAvgPrice + token.sellAvgPrice) / 2
                  : token.buyAvgPrice || token.sellAvgPrice || 0;

                return (
                  <div
                    key={idx}
                    className={cn(
                      "grid gap-2 px-2 py-1.5",
                      idx < data.tokensTraded.length - 1 && (isDark ? "border-b border-white/[0.02]" : "border-b border-gray-100"),
                      isDark ? "hover:bg-white/[0.01]" : "hover:bg-gray-50"
                    )}
                    style={{ gridTemplateColumns: '140px repeat(4, 1fr)' }}
                  >
                    <div className="flex items-center gap-1">
                      <img
                        src={`https://s1.xrpl.to/token/${token.tokenId}`}
                        className="w-5 h-5 rounded"
                        onError={(e) => { e.target.style.display = 'none'; }}
                        alt=""
                      />
                      <span className={cn("text-[0.9rem] font-normal", isDark ? "text-white" : "text-gray-900")}>
                        {token.tokenName}
                      </span>
                    </div>
                    <span className={cn("text-[0.9rem] text-right font-normal", isDark ? "text-white" : "text-gray-900")}>
                      {totalVolume > 0 ? fCurrency5(totalVolume) : '—'}
                    </span>
                    <span className={cn("text-[0.9rem] text-right font-normal", isDark ? "text-white" : "text-gray-900")}>
                      {avgPrice > 0 ? fCurrency5(avgPrice) : '—'}
                    </span>
                    <span className={cn("text-[0.9rem] text-right font-normal", isDark ? "text-white" : "text-gray-900")}>
                      {Math.abs(token.balanceChange) > 0.00001 ? fCurrency5(token.balanceChange) : '0'}
                    </span>
                    <span className={cn(
                      "text-[0.9rem] text-right font-normal",
                      tokenPnL >= 0 ? "text-[#10b981]" : "text-[#ef4444]"
                    )}>
                      {Math.abs(tokenPnL) > 0.00001 ? fCurrency5(tokenPnL) : '0'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Transaction History */}
        {txHistory.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className={cn("text-[0.9rem]", isDark ? "text-white/60" : "text-gray-500")}>
                Transactions ({filteredTxHistory.length})
              </p>
              <div className="flex gap-1">
                {getAvailableTxTypes().map(filter => (
                  <button
                    key={filter}
                    onClick={() => setTxFilter(filter)}
                    className={cn(
                      "text-[0.85rem] px-1.5 py-0.5 rounded-md border font-normal",
                      txFilter === filter
                        ? (isDark ? "border-white/15 bg-[#4285f4]/10 text-[#4285f4]" : "border-blue-200 bg-blue-50 text-[#4285f4]")
                        : (isDark ? "border-white/[0.04] bg-transparent text-white/60" : "border-gray-200 bg-transparent text-gray-500")
                    )}
                  >
                    {filter === 'all' ? 'All' : filter}
                  </button>
                ))}
              </div>
            </div>
            <div className={cn(
              "rounded-lg overflow-hidden border",
              isDark ? "bg-white/[0.03] border-white/[0.04]" : "bg-gray-50 border-gray-200"
            )}>
              <div className={cn(
                "grid gap-2 px-2 py-1.5 border-b",
                isDark ? "bg-white/[0.02] border-white/[0.04]" : "bg-gray-100 border-gray-200"
              )} style={{ gridTemplateColumns: '120px 2fr 1fr 120px' }}>
                <span className={cn("text-[0.85rem] font-normal", isDark ? "text-white/60" : "text-gray-500")}>Type</span>
                <span className={cn("text-[0.85rem] font-normal", isDark ? "text-white/60" : "text-gray-500")}>Description</span>
                <span className={cn("text-[0.85rem] font-normal text-right", isDark ? "text-white/60" : "text-gray-500")}>Amount</span>
                <span className={cn("text-[0.85rem] font-normal", isDark ? "text-white/60" : "text-gray-500")}>Time</span>
              </div>
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
                let actionColor = isDark ? 'text-white' : 'text-gray-900';

                if (txData.TransactionType === 'OfferCreate' && offerDetails) {
                  const parts = offerDetails.split(' → ');
                  actionDesc = `Offer to sell ${parts[0]} for ${parts[1]}`;
                  actionColor = 'text-[#4285f4]';
                } else if (txData.TransactionType === 'OfferCancel') {
                  actionDesc = `Cancelled offer #${txData.OfferSequence || 'unknown'}`;
                  actionColor = 'text-[#ef4444]';
                } else if (txData.TransactionType === 'Payment') {
                  const isSender = txData.Account === account;

                  // Check for dusting attack (incoming XRP < 0.001)
                  if (!isSender && typeof txData.Amount === 'string') {
                    const drops = parseInt(txData.Amount);
                    if (drops < 1000) {
                      actionDesc = `Dusting attack from ${txData.Account.substring(0, 8)}...`;
                      actionColor = 'text-[#ef4444]';
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
                        actionColor = 'text-[#10b981]';
                      } else if (!sendIsXRP && deliveredIsXRP) {
                        const curr = decodeCurrency(txData.SendMax.currency);
                        const tokenAmt = parseFloat(txData.SendMax.value);
                        const xrpAmt = parseInt(meta.delivered_amount) / 1000000;
                        actionDesc = `Swapped ${fCurrency5(tokenAmt)} ${curr} → ${fCurrency5(xrpAmt)} XRP`;
                        actionColor = 'text-[#10b981]';
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
                  actionColor = limit === 0 ? 'text-[#ef4444]' : 'text-[#10b981]';
                } else if (txData.TransactionType === 'NFTokenMint') {
                  const nftId = txData.NFTokenID || (meta?.nftoken_id);
                  const shortId = nftId ? `${nftId.substring(0, 8)}...${nftId.substring(nftId.length - 4)}` : '';
                  actionDesc = shortId ? `Minted NFT ${shortId}` : 'Minted NFT';
                  actionColor = 'text-[#10b981]';
                } else if (txData.TransactionType === 'NFTokenBurn') {
                  const nftId = txData.NFTokenID;
                  const shortId = nftId ? `${nftId.substring(0, 8)}...${nftId.substring(nftId.length - 4)}` : '';
                  actionDesc = shortId ? `Burned NFT ${shortId}` : 'Burned NFT';
                  actionColor = 'text-[#ef4444]';
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
                  actionColor = 'text-[#4285f4]';
                } else if (txData.TransactionType === 'NFTokenAcceptOffer') {
                  const nftId = txData.NFTokenID || (meta?.nftoken_id);
                  const shortId = nftId ? `${nftId.substring(0, 8)}...${nftId.substring(nftId.length - 4)}` : '';
                  actionDesc = shortId ? `Accepted offer for NFT ${shortId}` : 'Accepted NFT offer';
                  actionColor = 'text-[#10b981]';
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
                  actionColor = 'text-[#ef4444]';
                } else {
                  actionDesc = txData.TransactionType.replace(/([A-Z])/g, ' $1').trim();
                }

                return (
                  <div
                    key={idx}
                    className={cn(
                      "grid gap-2 px-2 py-1.5",
                      idx < 19 && (isDark ? "border-b border-white/[0.02]" : "border-b border-gray-100"),
                      isDark ? "hover:bg-white/[0.01]" : "hover:bg-gray-50"
                    )}
                    style={{ gridTemplateColumns: '120px 2fr 1fr 120px' }}
                  >
                    <span className={cn(
                      "text-[0.85rem] font-normal",
                      txData.TransactionType === 'Payment' ? "text-[#4285f4]" : (isDark ? "text-white/60" : "text-gray-500")
                    )}>
                      {txData.TransactionType}
                    </span>
                    <div>
                      <p className={cn("text-[0.9rem] font-normal", actionColor, sourceLabel ? "mb-0.5" : "")}>
                        {actionDesc}
                      </p>
                      {sourceLabel && (
                        <span className={cn("text-[0.8rem] font-normal", isDark ? "text-white/50" : "text-gray-400")}>
                          {sourceLabel}
                        </span>
                      )}
                    </div>
                    <span className={cn("text-[0.9rem] text-right font-normal", isDark ? "text-white" : "text-gray-900")}>
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
                    </span>
                    <span className={cn("text-[0.85rem] font-normal", isDark ? "text-white/50" : "text-gray-500")}>
                      {formatDistanceToNow(date, { addSuffix: true })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ScrollToTop />
      <Footer />
    </div>
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
