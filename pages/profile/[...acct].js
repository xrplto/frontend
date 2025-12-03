import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import { isValidClassicAddress } from 'ripple-address-codec';
import { fCurrency5, fDateTime } from 'src/utils/formatters';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Wallet } from 'lucide-react';

const OverView = ({ account }) => {
  const { themeName, accountProfile } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const isOwnAccount = accountProfile?.account === account;
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
          axios.get(`https://api.xrpl.to/api/trustlines/${account}?limit=20&page=0&format=full`)
            .catch(() => axios.get(`https://api.xrpl.to/api/trustlines/${account}?limit=20&page=0`))
            .catch(() => ({ data: null }))
        ]);

        setData(profileRes.data);
        setHoldings(holdingsRes.data);

        // Fetch transaction history via xrpl.to API
        axios.get(`https://api.xrpl.to/api/account_tx/${account}?limit=200`)
          .then(res => {
            const txs = res.data?.transactions || [];
            setTxHistory(txs);
            setFilteredTxHistory(txs);
          })
          .catch(err => console.error('TX history fetch failed:', err));
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

    axios.get(`https://api.xrpl.to/api/trustlines/${account}?limit=20&page=${holdingsPage}&format=full`)
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
      <div className="min-h-screen flex flex-col">
        <div id="back-to-top-anchor" />
        <Header />
        <div className="max-w-screen-2xl mx-auto w-full px-4 flex-1 flex justify-center items-center">
          <p className={cn("text-[15px]", isDark ? "text-white/60" : "text-gray-600")}>Loading...</p>
        </div>
        <ScrollToTop />
        <Footer />
      </div>
    );
  }

  const winRate = data?.totalTrades > 0 ? (data.profitableTrades / data.totalTrades * 100) : 0;
  const totalPnL = data?.totalProfit || data?.profit || 0;
  const hasNoTradingData = !data || data.error;

  return (
    <div className="min-h-screen flex flex-col">
      <div id="back-to-top-anchor" />
      <Header />
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        {account} Profile on XRPL
      </h1>

      <div className="max-w-screen-2xl mx-auto w-full px-4 py-2 flex-1">
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
          {isOwnAccount && (
            <Link
              href="/wallet"
              className="flex items-center gap-1.5 text-[12px] px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Wallet size={14} />
              Manage
            </Link>
          )}
          {data?.firstTradeDate && (
            <span className={cn("text-[0.9rem] ml-auto", isDark ? "text-white/50" : "text-gray-500")}>
              {fDateTime(data.firstTradeDate)} → {fDateTime(data.lastTradeDate)}
            </span>
          )}
        </div>

        {/* Account Not Activated */}
        {holdings?.accountActive === false && (
          <div className={cn("text-center py-8 mb-4 rounded-xl border", isDark ? "border-[#ef4444]/20 bg-[#ef4444]/5" : "border-red-200 bg-red-50")}>
            <p className={cn("text-[15px] font-medium", "text-[#ef4444]")}>
              Account not activated
            </p>
            <p className={cn("text-[13px] mt-1", isDark ? "text-white/40" : "text-gray-500")}>
              This account has been deleted or was never funded
            </p>
          </div>
        )}

        {/* XRP Balance for accounts with no trading data */}
        {hasNoTradingData && holdings?.accountActive !== false && holdings?.accountData && (
          <div className={cn("mb-4 pb-4 border-b", isDark ? "border-white/[0.06]" : "border-gray-200")}>
            <p className={cn("text-[11px] uppercase tracking-wide mb-1", isDark ? "text-white/40" : "text-gray-400")}>XRP Balance</p>
            <p className={cn("text-[1.3rem] font-medium", isDark ? "text-white" : "text-gray-900")}>
              {fCurrency5(holdings.accountData.balanceDrops / 1000000)}
            </p>
            <span className={cn("text-[12px]", isDark ? "text-white/40" : "text-gray-400")}>
              {fCurrency5(holdings.accountData.spendableDrops / 1000000)} spendable
            </span>
          </div>
        )}

        {/* No Trading Data Message */}
        {hasNoTradingData && holdings?.accountActive !== false && (
          <div className={cn("text-center py-6 mb-4 rounded-xl border", isDark ? "border-white/[0.06] bg-white/[0.02]" : "border-gray-200 bg-gray-50")}>
            <p className={cn("text-[14px]", isDark ? "text-white/50" : "text-gray-500")}>
              No trading history
            </p>
          </div>
        )}

        {/* Key Metrics */}
        {data && (
        <>
        <div className={cn("grid grid-cols-4 gap-4 mb-3 pb-3 border-b", isDark ? "border-white/[0.06]" : "border-gray-200")}>
          <div>
            <p className={cn("text-[11px] uppercase tracking-wide mb-1", isDark ? "text-white/40" : "text-gray-400")}>XRP Balance</p>
            <p className={cn("text-[1.3rem] font-medium", isDark ? "text-white" : "text-gray-900")}>
              {holdings?.accountData ? fCurrency5(holdings.accountData.balanceDrops / 1000000) : '—'}
            </p>
            {holdings?.accountData && (
              <span className={cn("text-[12px]", isDark ? "text-white/40" : "text-gray-400")}>
                {fCurrency5(holdings.accountData.spendableDrops / 1000000)} spendable
              </span>
            )}
          </div>
          <div>
            <p className={cn("text-[11px] uppercase tracking-wide mb-1", isDark ? "text-white/40" : "text-gray-400")}>Profit / Loss</p>
            <p className={cn("text-[1.3rem] font-medium", totalPnL >= 0 ? "text-[#10b981]" : "text-[#ef4444]")}>
              {fCurrency5(totalPnL)} XRP
            </p>
            <span className={cn("text-[12px]", (data.roi || 0) >= 0 ? "text-[#10b981]/60" : "text-[#ef4444]/60")}>
              {(data.roi || 0) >= 0 ? '+' : ''}{fCurrency5(data.roi || 0)}% return
            </span>
          </div>
          <div>
            <p className={cn("text-[11px] uppercase tracking-wide mb-1", isDark ? "text-white/40" : "text-gray-400")}>Total Trades</p>
            <p className={cn("text-[1.3rem] font-medium", isDark ? "text-white" : "text-gray-900")}>
              {fCurrency5(data.totalTrades)}
            </p>
            <span className={cn("text-[12px]", winRate >= 50 ? "text-[#10b981]/60" : "text-[#ef4444]/60")}>
              {fCurrency5(winRate)}% winners
            </span>
          </div>
          <div>
            <p className={cn("text-[11px] uppercase tracking-wide mb-1", isDark ? "text-white/40" : "text-gray-400")}>Total Volume</p>
            <p className={cn("text-[1.3rem] font-medium", isDark ? "text-white" : "text-gray-900")}>
              {fCurrency5(data.totalVolume)}
            </p>
            <span className={cn("text-[12px]", isDark ? "text-white/40" : "text-gray-400")}>
              {fCurrency5(data.buyVolume || 0)} in · {fCurrency5(data.sellVolume || 0)} out
            </span>
          </div>
        </div>

        {/* Period P&L + Stats Row */}
        <div className={cn("grid grid-cols-10 gap-2 mb-3 pb-3 border-b", isDark ? "border-white/[0.06]" : "border-gray-200")}>
          {[
            { label: '24h P&L', profit: data.profit24h },
            { label: '7d P&L', profit: data.profit7d },
            { label: '30d P&L', profit: data.profit1m },
            { label: '60d P&L', profit: data.profit2m },
            { label: '90d P&L', profit: data.profit3m }
          ].map((period) => (
            <div key={period.label}>
              <p className={cn("text-[10px] uppercase tracking-wide mb-0.5", isDark ? "text-white/40" : "text-gray-400")}>
                {period.label}
              </p>
              <p className={cn(
                "text-[13px] font-medium",
                period.profit !== 0
                  ? (period.profit >= 0 ? "text-[#10b981]" : "text-[#ef4444]")
                  : (isDark ? "text-white/30" : "text-gray-300")
              )}>
                {period.profit !== 0 ? fCurrency5(period.profit) : '—'}
              </p>
            </div>
          ))}
          <div>
            <p className={cn("text-[10px] uppercase tracking-wide mb-0.5", isDark ? "text-white/40" : "text-gray-400")}>Wins</p>
            <p className={cn("text-[13px] font-medium text-[#10b981]")}>{fCurrency5(data.profitableTrades)}</p>
          </div>
          <div>
            <p className={cn("text-[10px] uppercase tracking-wide mb-0.5", isDark ? "text-white/40" : "text-gray-400")}>Losses</p>
            <p className={cn("text-[13px] font-medium text-[#ef4444]")}>{fCurrency5(data.losingTrades)}</p>
          </div>
          <div>
            <p className={cn("text-[10px] uppercase tracking-wide mb-0.5", isDark ? "text-white/40" : "text-gray-400")}>Best</p>
            <p className="text-[13px] font-medium text-[#10b981]">{fCurrency5(data.maxProfitTrade)}</p>
          </div>
          <div>
            <p className={cn("text-[10px] uppercase tracking-wide mb-0.5", isDark ? "text-white/40" : "text-gray-400")}>Worst</p>
            <p className="text-[13px] font-medium text-[#ef4444]">-{fCurrency5(Math.abs(data.maxLossTrade || 0))}</p>
          </div>
          <div>
            <p className={cn("text-[10px] uppercase tracking-wide mb-0.5", isDark ? "text-white/40" : "text-gray-400")}>Avg Hold</p>
            <p className={cn("text-[13px] font-medium", isDark ? "text-white" : "text-gray-900")}>
              {data.avgHoldingTime ? `${Math.round(data.avgHoldingTime / 86400)}d` : '—'}
            </p>
          </div>
        </div>
        </>
        )}

        {/* Holdings */}
        {holdings && holdings.accountActive !== false && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <p className={cn("text-[11px] uppercase tracking-wide", isDark ? "text-white/40" : "text-gray-400")}>
                Token Holdings ({holdings.total})
              </p>
            </div>
            {holdings.lines?.length > 0 && (
              <>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {holdings.lines.map((line, idx) => (
                  <div key={idx} className={cn(
                    "p-2 rounded border",
                    isDark ? "bg-white/[0.02] border-white/[0.04]" : "bg-gray-50 border-gray-200"
                  )}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <img
                          src={`https://s1.xrpl.to/token/${line.token?.md5}`}
                          className="w-4 h-4 rounded"
                          onError={(e) => { e.target.style.display = 'none'; }}
                          alt=""
                        />
                        <span className={cn("text-[13px] font-medium", isDark ? "text-white" : "text-gray-900")}>
                          {line.token?.name || line.currency}
                        </span>
                      </div>
                      <p className={cn("text-[15px] font-medium", isDark ? "text-white" : "text-gray-900")}>
                        {fCurrency5(line.value)} <span className={cn("text-[11px] font-normal", isDark ? "text-white/40" : "text-gray-400")}>XRP</span>
                      </p>
                      <span className={cn("text-[11px]", isDark ? "text-white/40" : "text-gray-400")}>
                        {fCurrency5(Math.abs(parseFloat(line.balance)))} tokens
                      </span>
                  </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-center items-center text-[12px]">
                  <button
                    onClick={() => setHoldingsPage(Math.max(0, holdingsPage - 1))}
                    disabled={holdingsPage === 0}
                    className={cn(
                      "bg-transparent border-none p-0",
                      holdingsPage === 0 ? (isDark ? "text-white/30 cursor-default" : "text-gray-300 cursor-default") : "text-[#4285f4] cursor-pointer"
                    )}
                  >
                    ← Prev
                  </button>
                  <span className={isDark ? "text-white/40" : "text-gray-400"}>
                    {holdingsPage + 1}/{Math.ceil(holdings.total / 20)}
                  </span>
                  <button
                    onClick={() => setHoldingsPage(holdingsPage + 1)}
                    disabled={holdingsPage >= Math.ceil(holdings.total / 20) - 1}
                    className={cn(
                      "bg-transparent border-none p-0",
                      holdingsPage >= Math.ceil(holdings.total / 20) - 1 ? (isDark ? "text-white/30 cursor-default" : "text-gray-300 cursor-default") : "text-[#4285f4] cursor-pointer"
                    )}
                  >
                    Next →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tokens Table */}
        {data?.tokenPerformance?.length > 0 && (
          <div className="mb-3">
            <p className={cn("text-[11px] uppercase tracking-wide mb-2", isDark ? "text-white/40" : "text-gray-400")}>
              Trading Performance by Token ({data.totalTokensTraded || data.tokenPerformance.length})
            </p>
            <div className={cn(
              "rounded border overflow-hidden",
              isDark ? "bg-white/[0.02] border-white/[0.04]" : "bg-gray-50 border-gray-200"
            )}>
              <div className={cn(
                "grid gap-2 px-2 py-1 border-b",
                isDark ? "border-white/[0.04]" : "border-gray-200"
              )} style={{ gridTemplateColumns: '120px repeat(4, 1fr)' }}>
                <span className={cn("text-[10px] uppercase tracking-wide", isDark ? "text-white/40" : "text-gray-400")}>Token</span>
                <span className={cn("text-[10px] uppercase tracking-wide text-right", isDark ? "text-white/40" : "text-gray-400")}>Volume (XRP)</span>
                <span className={cn("text-[10px] uppercase tracking-wide text-right", isDark ? "text-white/40" : "text-gray-400")}>Trades</span>
                <span className={cn("text-[10px] uppercase tracking-wide text-right", isDark ? "text-white/40" : "text-gray-400")}>Return %</span>
                <span className={cn("text-[10px] uppercase tracking-wide text-right", isDark ? "text-white/40" : "text-gray-400")}>Profit (XRP)</span>
              </div>
              {data.tokenPerformance.map((token, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "grid gap-2 px-2 py-1",
                    idx < data.tokenPerformance.length - 1 && (isDark ? "border-b border-white/[0.02]" : "border-b border-gray-100")
                  )}
                  style={{ gridTemplateColumns: '120px repeat(4, 1fr)' }}
                >
                  <div className="flex items-center gap-1.5">
                    <img
                      src={`https://s1.xrpl.to/token/${token.tokenId}`}
                      className="w-4 h-4 rounded"
                      onError={(e) => { e.target.style.display = 'none'; }}
                      alt=""
                    />
                    <span className={cn("text-[12px] font-medium", isDark ? "text-white" : "text-gray-900")}>
                      {token.name}
                    </span>
                  </div>
                  <span className={cn("text-[12px] text-right", isDark ? "text-white/70" : "text-gray-700")}>
                    {fCurrency5(token.volume || 0)}
                  </span>
                  <span className={cn("text-[12px] text-right", isDark ? "text-white/70" : "text-gray-700")}>
                    {fCurrency5(token.trades || 0)}
                  </span>
                  <span className={cn(
                    "text-[12px] text-right font-medium",
                    (token.roi || 0) >= 0 ? "text-[#10b981]" : "text-[#ef4444]"
                  )}>
                    {(token.roi || 0) >= 0 ? '+' : ''}{fCurrency5(token.roi || 0)}%
                  </span>
                  <span className={cn(
                    "text-[12px] text-right font-medium",
                    (token.profit || 0) >= 0 ? "text-[#10b981]" : "text-[#ef4444]"
                  )}>
                    {(token.profit || 0) >= 0 ? '+' : ''}{fCurrency5(token.profit || 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction History */}
        {txHistory.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-2">
              <p className={cn("text-[11px] uppercase tracking-wide", isDark ? "text-white/40" : "text-gray-400")}>
                Recent Transactions ({filteredTxHistory.length})
              </p>
              <div className="flex gap-1">
                {getAvailableTxTypes().map(filter => (
                  <button
                    key={filter}
                    onClick={() => setTxFilter(filter)}
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded border",
                      txFilter === filter
                        ? (isDark ? "border-[#4285f4]/30 bg-[#4285f4]/10 text-[#4285f4]" : "border-blue-200 bg-blue-50 text-[#4285f4]")
                        : (isDark ? "border-white/[0.06] bg-transparent text-white/50" : "border-gray-200 bg-transparent text-gray-400")
                    )}
                  >
                    {filter === 'all' ? 'ALL' : filter}
                  </button>
                ))}
              </div>
            </div>
            <div className={cn(
              "rounded border overflow-hidden",
              isDark ? "bg-white/[0.02] border-white/[0.04]" : "bg-gray-50 border-gray-200"
            )}>
              <div className={cn(
                "grid px-2 py-1.5 border-b",
                isDark ? "border-white/[0.04]" : "border-gray-200"
              )} style={{ gridTemplateColumns: '140px 1fr 100px 70px 70px' }}>
                <span className={cn("text-[10px] uppercase tracking-wide", isDark ? "text-white/40" : "text-gray-400")}>Type</span>
                <span className={cn("text-[10px] uppercase tracking-wide", isDark ? "text-white/40" : "text-gray-400")}>Details</span>
                <span className={cn("text-[10px] uppercase tracking-wide text-right", isDark ? "text-white/40" : "text-gray-400")}>Amount</span>
                <span className={cn("text-[10px] uppercase tracking-wide text-right", isDark ? "text-white/40" : "text-gray-400")}>Fee</span>
                <span className={cn("text-[10px] uppercase tracking-wide text-right", isDark ? "text-white/40" : "text-gray-400")}>When</span>
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

                // Calculate amount for display
                let amountDisplay = '—';
                let amountColor = isDark ? 'text-white/50' : 'text-gray-500';

                if (txData.TransactionType === 'Payment') {
                  const isSender = txData.Account === account;
                  if (meta?.delivered_amount) {
                    if (typeof meta.delivered_amount === 'string') {
                      const xrp = parseInt(meta.delivered_amount) / 1000000;
                      amountDisplay = `${isSender ? '-' : '+'}${fCurrency5(xrp)} XRP`;
                      amountColor = isSender ? 'text-[#ef4444]' : 'text-[#10b981]';
                    } else {
                      const val = parseFloat(meta.delivered_amount.value);
                      const curr = decodeCurrency(meta.delivered_amount.currency);
                      amountDisplay = `${isSender ? '-' : '+'}${fCurrency5(val)} ${curr}`;
                      amountColor = isSender ? 'text-[#ef4444]' : 'text-[#10b981]';
                    }
                  } else if (txData.Amount) {
                    if (typeof txData.Amount === 'string') {
                      const xrp = parseInt(txData.Amount) / 1000000;
                      amountDisplay = `${isSender ? '-' : '+'}${fCurrency5(xrp)} XRP`;
                      amountColor = isSender ? 'text-[#ef4444]' : 'text-[#10b981]';
                    }
                  }
                } else if (txData.TransactionType === 'OfferCreate') {
                  if (offerDetails) {
                    amountDisplay = offerDetails.split(' → ')[0];
                  }
                }

                const fee = txData.Fee ? parseInt(txData.Fee) / 1000000 : 0;
                const txHash = txData.hash || tx.hash;

                return (
                  <Link
                    key={idx}
                    href={`/tx/${txHash}`}
                    className={cn(
                      "grid px-2 py-1.5 hover:bg-white/[0.02] transition-colors",
                      idx < 19 && (isDark ? "border-b border-white/[0.02]" : "border-b border-gray-100")
                    )}
                    style={{ gridTemplateColumns: '140px 1fr 100px 70px 70px' }}
                  >
                    <span className={cn(
                      "text-[11px]",
                      txData.TransactionType === 'Payment' ? "text-[#4285f4]" : (isDark ? "text-white/50" : "text-gray-500")
                    )}>
                      {txData.TransactionType}
                    </span>
                    <div className="min-w-0">
                      <p className={cn("text-[12px] truncate", actionColor)}>
                        {actionDesc}
                      </p>
                      {sourceLabel && (
                        <span className={cn("text-[10px]", isDark ? "text-white/40" : "text-gray-400")}>
                          via {sourceLabel}
                        </span>
                      )}
                    </div>
                    <span className={cn("text-[11px] text-right font-medium", amountColor)}>
                      {amountDisplay}
                    </span>
                    <span className={cn("text-[11px] text-right", isDark ? "text-white/30" : "text-gray-400")}>
                      {fee > 0 ? `${fee.toFixed(6)}` : '—'}
                    </span>
                    <span className={cn("text-[11px] text-right", isDark ? "text-white/40" : "text-gray-400")}>
                      {formatDistanceToNow(date, { addSuffix: false })}
                    </span>
                  </Link>
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
