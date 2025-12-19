import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import styled from '@emotion/styled';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import TokenTabs from 'src/TokenDetail/components/TokenTabs';
import { addTokenToTabs } from 'src/hooks/useTokenTabs';
import { isValidClassicAddress } from 'ripple-address-codec';
import { fCurrency5, fDateTime } from 'src/utils/formatters';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Wallet, Copy, ExternalLink, Coins, Image, Clock } from 'lucide-react';
import CryptoJS from 'crypto-js';

// Same wrapper as index.js for consistent width
const PageWrapper = styled.div`
  overflow: hidden;
  min-height: 100vh;
  margin: 0;
  padding: 0;
`;

const OverView = ({ account }) => {
  const { themeName, accountProfile, setOpenWalletModal } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const isOwnAccount = accountProfile?.account === account;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 960;
  const [data, setData] = useState(null);
  const [txHistory, setTxHistory] = useState([]);
  const [filteredTxHistory, setFilteredTxHistory] = useState([]);
  const [txFilter, setTxFilter] = useState('all');
  const [holdings, setHoldings] = useState(null);
  const [holdingsPage, setHoldingsPage] = useState(0);
  const [txPage, setTxPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedTx, setExpandedTx] = useState(null);
  const [aiExplanation, setAiExplanation] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const [showAllTokens, setShowAllTokens] = useState(false);
  const [tokenSearch, setTokenSearch] = useState('');
  const [hideZeroHoldings, setHideZeroHoldings] = useState(true);
  const [txSearch, setTxSearch] = useState('');
  const [activeTab, setActiveTab] = useState('tokens');

  useEffect(() => {
    // Reset data and loading state when account changes
    setData(null);
    setTxHistory([]);
    setHoldings(null);
    setHoldingsPage(0);
    setTxPage(0);
    setTxSearch('');
    setTxFilter('all');
    setLoading(true);

    const fetchData = async () => {
      try {
        // Fetch profile data and holdings
        const [profileRes, holdingsRes] = await Promise.all([
          axios.get(`https://api.xrpl.to/api/traders/${account}`).catch(() => ({ data: null })),
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

  // Add account to tabs
  useEffect(() => {
    if (account) {
      addTokenToTabs({
        slug: account,
        name: account.slice(0, 8) + '...',
        type: 'account'
      });
    }
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
    let filtered = txHistory;

    // Filter by transaction type
    if (txFilter !== 'all') {
      filtered = filtered.filter(tx => {
        const txData = tx.tx_json || tx.tx;
        return txData.TransactionType === txFilter;
      });
    }

    // Filter by search term
    if (txSearch.trim()) {
      const search = txSearch.toLowerCase().trim();
      filtered = filtered.filter(tx => {
        const txData = tx.tx_json || tx.tx;
        const hash = (txData.hash || tx.hash || '').toLowerCase();
        const account = (txData.Account || '').toLowerCase();
        const destination = (txData.Destination || '').toLowerCase();
        const txType = (txData.TransactionType || '').toLowerCase();

        // Check amounts for currency
        const getCurrency = (amt) => {
          if (!amt) return '';
          if (typeof amt === 'string') return 'xrp';
          return (amt.currency || '').toLowerCase();
        };
        const amountCurr = getCurrency(txData.Amount);
        const sendMaxCurr = getCurrency(txData.SendMax);
        const takerGetsCurr = getCurrency(txData.TakerGets);
        const takerPaysCurr = getCurrency(txData.TakerPays);

        return hash.includes(search) ||
          account.includes(search) ||
          destination.includes(search) ||
          txType.includes(search) ||
          amountCurr.includes(search) ||
          sendMaxCurr.includes(search) ||
          takerGetsCurr.includes(search) ||
          takerPaysCurr.includes(search);
      });
    }

    setFilteredTxHistory(filtered);
    setTxPage(0);
  }, [txFilter, txSearch, txHistory]);

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
      <PageWrapper>
        <div className="h-0" id="back-to-top-anchor" />
        <Header />
        {!isMobile && <TokenTabs currentMd5={account} />}
        <div className="mx-auto max-w-[1920px] px-4 mt-4">
          <div className="flex flex-col gap-4">
            {/* Header skeleton */}
            <div className="flex items-center gap-3">
              <div className={cn("h-6 w-48 rounded animate-pulse", isDark ? "bg-white/10" : "bg-gray-200")} />
              <div className={cn("h-5 w-5 rounded animate-pulse", isDark ? "bg-white/5" : "bg-gray-100")} />
            </div>
            {/* Metrics skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="space-y-2">
                  <div className={cn("h-3 w-16 rounded animate-pulse", isDark ? "bg-white/5" : "bg-gray-100")} />
                  <div className={cn("h-7 w-24 rounded animate-pulse", isDark ? "bg-white/10" : "bg-gray-200")} />
                  <div className={cn("h-3 w-20 rounded animate-pulse", isDark ? "bg-white/5" : "bg-gray-100")} />
                </div>
              ))}
            </div>
            {/* Holdings skeleton */}
            <div className={cn("rounded-xl border p-4", isDark ? "border-white/10" : "border-gray-200")}>
              <div className={cn("h-4 w-32 rounded animate-pulse mb-3", isDark ? "bg-white/10" : "bg-gray-200")} />
              {[1,2,3].map(i => (
                <div key={i} className={cn("h-10 rounded animate-pulse mb-2", isDark ? "bg-white/5" : "bg-gray-100")} />
              ))}
            </div>
          </div>
        </div>
        <ScrollToTop />
        <Footer />
      </PageWrapper>
    );
  }

  const winRate = data?.totalTrades > 0 ? (data.profitableTrades / data.totalTrades * 100) : 0;
  const totalPnL = data?.totalProfit || data?.profit || 0;
  const hasNoTradingData = !data || data.error;

  return (
    <PageWrapper>
      <div className="h-0" id="back-to-top-anchor" />
      <Header />
      {!isMobile && <TokenTabs currentMd5={account} />}
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        {account} Profile on XRPL
      </h1>

      <div className="mx-auto max-w-[1920px] px-4 mt-4">
        <div className="flex flex-col">
          <div className="w-full">
        {/* Account Header */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className={cn("text-lg md:text-xl font-normal", isDark ? "text-white" : "text-gray-900")}>
              <span className="hidden md:inline">{account.substring(0, 10)}...{account.substring(account.length - 8)}</span>
              <span className="md:hidden">{account.substring(0, 6)}...{account.substring(account.length - 4)}</span>
            </h2>
            <button
              onClick={() => navigator.clipboard.writeText(account)}
              className={cn("p-1.5 rounded-lg transition-colors", isDark ? "text-white/40 hover:text-white/70 hover:bg-white/5" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100")}
              title="Copy address"
            >
              <Copy size={14} />
            </button>
            <a
              href={`https://xrpscan.com/account/${account}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("p-1.5 rounded-lg transition-colors", isDark ? "text-white/40 hover:text-white/70 hover:bg-white/5" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100")}
              title="View on XRPScan"
            >
              <ExternalLink size={14} />
            </a>
            {data?.isAMM && (
              <span className="text-[11px] h-5 px-2 rounded bg-[#3b82f6]/10 text-[#3b82f6] font-normal flex items-center">
                AMM
              </span>
            )}
            {isOwnAccount && (
              <button
                onClick={() => setOpenWalletModal(true)}
                className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <Wallet size={14} />
                Manage
              </button>
            )}
          </div>
          {data?.firstTradeDate && (
            <span className={cn("text-[12px] md:text-[13px] md:ml-auto", isDark ? "text-white/40" : "text-gray-400")}>
              {fDateTime(data.firstTradeDate)} → {fDateTime(data.lastTradeDate)}
            </span>
          )}
        </div>

        {/* Account Not Activated */}
        {holdings?.accountActive === false && (
          <div className={cn("text-center py-10 mb-4 rounded-xl border", isDark ? "border-[#ef4444]/20 bg-[#ef4444]/5" : "border-red-200 bg-red-50")}>
            <div className={cn("w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center", isDark ? "bg-[#ef4444]/10" : "bg-red-100")}>
              <Wallet size={20} className="text-[#ef4444]" />
            </div>
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
          <div className={cn("mb-4 pb-4 border-b", isDark ? "border-white/10" : "border-gray-200")}>
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
          <div className={cn("text-center py-8 mb-4 rounded-xl border", isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50")}>
            <div className={cn("w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center", isDark ? "bg-white/5" : "bg-gray-100")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isDark ? "text-white/30" : "text-gray-400"}>
                <path d="M3 3v18h18M7 16l4-4 4 4 6-6" />
              </svg>
            </div>
            <p className={cn("text-[14px]", isDark ? "text-white/50" : "text-gray-500")}>
              No trading history
            </p>
          </div>
        )}

        {/* Key Metrics */}
        {data && (
        <>
        <div className="mb-6">
          {/* Main Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-1 mb-3 rounded bg-gradient-to-r from-[#1e3a5f] to-[#0f172a] border border-[#3b82f6]/30">
                <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#60a5fa]">Balance</span>
              </div>
              <p className={cn("text-[28px] font-normal tabular-nums tracking-tight", isDark ? "text-white" : "text-gray-900")}>
                {holdings?.accountData ? fCurrency5(holdings.accountData.balanceDrops / 1000000) : '—'}
              </p>
              <p className={cn("text-[13px] mt-1", isDark ? "text-white/40" : "text-gray-400")}>
                ≈ {holdings?.accountData ? fCurrency5(holdings.accountData.spendableDrops / 1000000) : '—'} spendable
              </p>
            </div>
            <div>
              <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 mb-3 rounded border", totalPnL >= 0 ? "bg-gradient-to-r from-[#14532d]/50 to-[#052e16]/50 border-[#22c55e]/30" : "bg-gradient-to-r from-[#450a0a]/50 to-[#1c0606]/50 border-[#ef4444]/30")}>
                <div className={cn("w-1.5 h-1.5 rounded-full", totalPnL >= 0 ? "bg-[#22c55e]" : "bg-[#ef4444]")} />
                <span className={cn("text-[10px] font-medium uppercase tracking-wider", totalPnL >= 0 ? "text-[#4ade80]" : "text-[#f87171]")}>P&L</span>
              </div>
              <p className={cn("text-[28px] font-normal tabular-nums tracking-tight", totalPnL >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>
                {fCurrency5(totalPnL)}
              </p>
              <p className={cn("text-[13px] mt-1", isDark ? "text-white/40" : "text-gray-400")}>
                XRP
              </p>
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-1 mb-3 rounded bg-gradient-to-r from-[#1e293b] to-[#0f172a] border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <span className={cn("text-[10px] font-medium uppercase tracking-wider", isDark ? "text-white/60" : "text-gray-500")}>Trades</span>
              </div>
              <p className={cn("text-[28px] font-normal tabular-nums tracking-tight", isDark ? "text-white" : "text-gray-900")}>
                {fCurrency5(data.totalTrades)}
              </p>
              <p className={cn("text-[13px] mt-1", isDark ? "text-white/40" : "text-gray-400")}>
                total executions
              </p>
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-1 mb-3 rounded bg-gradient-to-r from-[#312e81]/50 to-[#1e1b4b]/50 border border-[#8b5cf6]/30">
                <div className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#a78bfa]">Volume</span>
              </div>
              <p className={cn("text-[28px] font-normal tabular-nums tracking-tight", isDark ? "text-white" : "text-gray-900")}>
                {fCurrency5(data.totalVolume)}
              </p>
              <p className={cn("text-[13px] mt-1", isDark ? "text-white/40" : "text-gray-400")}>
                XRP traded
              </p>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className={cn("flex items-center divide-x py-3 mb-4", isDark ? "divide-white/10" : "divide-gray-200")}>
            {[
              { label: 'WIN RATE', value: `${fCurrency5(winRate)}%`, color: winRate >= 50 ? 'text-[#22c55e]' : 'text-[#ef4444]' },
              { label: 'BUYS', value: fCurrency5(data.buyCount || 0), color: 'text-[#ef4444]' },
              { label: 'SELLS', value: fCurrency5(data.sellCount || 0), color: 'text-[#22c55e]' },
              { label: 'SHARPE', value: (data.sharpeRatio || 0).toFixed(2), color: isDark ? 'text-white/70' : 'text-gray-600' },
              { label: 'DEX P&L', value: fCurrency5(data.dexProfit || 0), color: (data.dexProfit || 0) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]' },
              { label: 'AMM P&L', value: fCurrency5(data.ammProfit || 0), color: (data.ammProfit || 0) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]' },
              { label: 'BEST', value: `+${fCurrency5(data.maxProfitTrade || 0)}`, color: 'text-[#22c55e]' },
              { label: 'WORST', value: fCurrency5(data.maxLossTrade || 0), color: 'text-[#ef4444]' }
            ].map((stat, idx) => (
              <div key={stat.label} className={cn("flex-1 text-center", idx === 0 ? "pl-0" : "pl-3")}>
                <p className={cn("text-[10px] uppercase tracking-wider mb-1", isDark ? "text-white/30" : "text-gray-400")}>{stat.label}</p>
                <p className={cn("text-[14px] font-medium tabular-nums", stat.color)}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Period P&L */}
          <div className={cn("flex items-center gap-6 py-3", isDark ? "border-t border-white/10" : "border-t border-gray-200")}>
            {[
              { label: '7D', value: data.profit7d },
              { label: '30D', value: data.profit1m },
              { label: '90D', value: data.profit3m }
            ].map(p => (
              <div key={p.label} className="flex items-center gap-2">
                <span className={cn("text-[11px] uppercase tracking-wider", isDark ? "text-white/30" : "text-gray-400")}>{p.label}</span>
                <span className={cn("text-[13px] font-medium tabular-nums", (p.value || 0) >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>
                  {(p.value || 0) >= 0 ? '+' : ''}{fCurrency5(p.value || 0)}
                </span>
              </div>
            ))}
            <div className="flex-1" />
            <div className="hidden md:flex items-center gap-2">
              <span className={cn("text-[11px] uppercase tracking-wider", isDark ? "text-white/30" : "text-gray-400")}>GROSS</span>
              <span className="text-[13px] font-medium text-[#22c55e] tabular-nums">+{fCurrency5(data.grossProfit || 0)}</span>
              <span className={cn("text-[13px]", isDark ? "text-white/20" : "text-gray-300")}>/</span>
              <span className="text-[13px] font-medium text-[#ef4444] tabular-nums">-{fCurrency5(data.grossLoss || 0)}</span>
            </div>
          </div>
        </div>
        </>
        )}

        {/* Tabs */}
        <div className={cn("flex items-center gap-8 border-b mb-6", isDark ? "border-white/10" : "border-gray-200")}>
          {[
            { id: 'tokens', label: 'TOKENS', icon: Coins, count: holdings?.total || 0 },
            { id: 'nfts', label: 'NFTS', icon: Image, count: 0 },
            { id: 'activity', label: 'HISTORY', icon: Clock, count: txHistory.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 py-3 text-[13px] font-medium tracking-wider border-b-2 -mb-px transition-colors",
                activeTab === tab.id
                  ? "text-[#c53030] border-[#c53030]"
                  : cn("border-transparent", isDark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600")
              )}
            >
              <tab.icon size={16} strokeWidth={1.5} />
              {tab.label}
              <span className={cn("text-[12px]", isDark ? "text-white/30" : "text-gray-400")}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Tokens Tab */}
        {activeTab === 'tokens' && (
        <>
        {/* Holdings */}
        {holdings && holdings.accountActive !== false && (() => {
          const filteredLines = hideZeroHoldings
            ? holdings.lines?.filter(l => parseFloat(l.balance) !== 0) || []
            : holdings.lines || [];
          const zeroCount = (holdings.lines?.length || 0) - filteredLines.length;
          const totalValue = filteredLines.reduce((sum, l) => sum + (l.value || 0), 0);

          return (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <p className={cn("text-[11px] uppercase tracking-wider", isDark ? "text-white/40" : "text-gray-400")}>
                  HOLDINGS ({holdings.total})
                </p>
                {zeroCount > 0 && (
                  <button
                    onClick={() => setHideZeroHoldings(!hideZeroHoldings)}
                    className={cn("text-[10px] px-2 py-0.5 rounded transition-colors", hideZeroHoldings ? "text-[#22c55e]" : (isDark ? "text-white/30" : "text-gray-400"))}
                  >
                    {hideZeroHoldings ? `+${zeroCount} hidden` : 'Hide empty'}
                  </button>
                )}
              </div>
              {filteredLines.length > 0 && (
                <p className={cn("text-[13px] font-medium tabular-nums", isDark ? "text-white" : "text-gray-900")}>
                  {fCurrency5(totalValue)} XRP
                </p>
              )}
            </div>
            {filteredLines.length > 0 ? (
              <>
                {/* Table Header */}
                <div className={cn("grid px-0 py-2 border-b", isDark ? "border-white/10" : "border-gray-200")} style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
                  <span className={cn("text-[10px] uppercase tracking-wider", isDark ? "text-white/30" : "text-gray-400")}>TOKEN</span>
                  <span className={cn("text-[10px] uppercase tracking-wider text-right", isDark ? "text-white/30" : "text-gray-400")}>BALANCE</span>
                  <span className={cn("text-[10px] uppercase tracking-wider text-right", isDark ? "text-white/30" : "text-gray-400")}>VALUE</span>
                </div>
                {/* Table Rows */}
                {filteredLines.map((line, idx) => (
                  <div key={idx} className={cn("grid py-3 items-center transition-colors", isDark ? "border-b border-white/[0.04] hover:bg-white/[0.02]" : "border-b border-gray-100 hover:bg-gray-50")} style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
                    <div className="flex items-center gap-3">
                      <img src={`https://s1.xrpl.to/token/${line.token?.md5}`} className="w-6 h-6 rounded-full" onError={(e) => { e.target.style.display = 'none'; }} alt="" />
                      <span className={cn("text-[14px]", isDark ? "text-white" : "text-gray-900")}>{line.token?.name || line.currency}</span>
                    </div>
                    <span className={cn("text-[14px] text-right tabular-nums", isDark ? "text-white/60" : "text-gray-500")}>{fCurrency5(Math.abs(parseFloat(line.balance)))}</span>
                    <span className={cn("text-[14px] text-right tabular-nums font-medium", isDark ? "text-white" : "text-gray-900")}>{fCurrency5(line.value)} XRP</span>
                  </div>
                ))}
                {/* Pagination */}
                <div className="flex items-center justify-end gap-2 mt-4">
                  <button onClick={() => setHoldingsPage(Math.max(0, holdingsPage - 1))} disabled={holdingsPage === 0} className={cn("text-[12px] transition-colors", holdingsPage === 0 ? (isDark ? "text-white/10" : "text-gray-200") : (isDark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600"))}>‹</button>
                  <span className={cn("text-[12px] tabular-nums", isDark ? "text-white/40" : "text-gray-400")}>{holdingsPage + 1}</span>
                  <button onClick={() => setHoldingsPage(holdingsPage + 1)} disabled={holdingsPage >= Math.ceil(holdings.total / 20) - 1} className={cn("text-[12px] transition-colors", holdingsPage >= Math.ceil(holdings.total / 20) - 1 ? (isDark ? "text-white/10" : "text-gray-200") : (isDark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600"))}>›</button>
                </div>
              </>
            ) : (
              <p className={cn("text-[13px] py-8 text-center", isDark ? "text-white/30" : "text-gray-400")}>
                {hideZeroHoldings ? 'No tokens with balance' : 'No token holdings'}
              </p>
            )}
          </div>
          );
        })()}

        {/* Trading Performance */}
        {data?.tokenPerformance?.length > 0 && (() => {
          const filteredTokens = data.tokenPerformance.filter(t =>
            !tokenSearch || t.name?.toLowerCase().includes(tokenSearch.toLowerCase())
          );
          const displayTokens = showAllTokens ? filteredTokens : filteredTokens.slice(0, 10);
          const totalCount = data.totalTokensTraded || data.tokenPerformance.length;
          const maxRoi = Math.max(...filteredTokens.map(t => Math.abs(t.roi || 0)), 100);
          const maxProfit = Math.max(...filteredTokens.map(t => Math.abs(t.profit || 0)), 1);

          return (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <p className={cn("text-[11px] uppercase tracking-wider", isDark ? "text-white/40" : "text-gray-400")}>
                TRADING PERFORMANCE ({totalCount})
              </p>
              <input
                type="text"
                placeholder="Search..."
                value={tokenSearch}
                onChange={(e) => setTokenSearch(e.target.value)}
                className={cn(
                  "text-[12px] px-3 py-1.5 rounded border-none outline-none w-32",
                  isDark ? "bg-white/[0.05] text-white/70 placeholder:text-white/30" : "bg-gray-100 text-gray-600 placeholder:text-gray-400"
                )}
              />
            </div>
            {/* Table Header */}
            <div className={cn("grid gap-4 py-2 border-b", isDark ? "border-white/10" : "border-gray-200")} style={{ gridTemplateColumns: '180px 100px 80px 1fr 1fr' }}>
              <span className={cn("text-[10px] uppercase tracking-wider", isDark ? "text-white/30" : "text-gray-400")}>TOKEN</span>
              <span className={cn("text-[10px] uppercase tracking-wider text-right", isDark ? "text-white/30" : "text-gray-400")}>VOLUME</span>
              <span className={cn("text-[10px] uppercase tracking-wider text-right", isDark ? "text-white/30" : "text-gray-400")}>TRADES</span>
              <span className={cn("text-[10px] uppercase tracking-wider text-right", isDark ? "text-white/30" : "text-gray-400")}>RETURN</span>
              <span className={cn("text-[10px] uppercase tracking-wider text-right", isDark ? "text-white/30" : "text-gray-400")}>PROFIT</span>
            </div>
            {/* Table Rows */}
            {displayTokens.map((token, idx) => {
              const roi = token.roi || 0;
              const profit = token.profit || 0;
              const roiWidth = Math.min(Math.abs(roi) / maxRoi * 100, 100);
              const profitWidth = Math.min(Math.abs(profit) / maxProfit * 100, 100);

              return (
                <div key={idx} className={cn("grid gap-4 py-3 items-center transition-colors", isDark ? "border-b border-white/[0.04] hover:bg-white/[0.02]" : "border-b border-gray-100 hover:bg-gray-50")} style={{ gridTemplateColumns: '180px 100px 80px 1fr 1fr' }}>
                  <div className="flex items-center gap-3">
                    <img src={`https://s1.xrpl.to/token/${token.tokenId}`} className="w-6 h-6 rounded-full" onError={(e) => { e.target.style.display = 'none'; }} alt="" />
                    <span className={cn("text-[14px]", isDark ? "text-white" : "text-gray-900")}>{token.name}</span>
                  </div>
                  <span className={cn("text-[14px] text-right tabular-nums", isDark ? "text-white/60" : "text-gray-500")}>{fCurrency5(token.volume || 0)}</span>
                  <span className={cn("text-[14px] text-right tabular-nums", isDark ? "text-white/60" : "text-gray-500")}>{fCurrency5(token.trades || 0)}</span>
                  {/* Return with progress bar */}
                  <div className="flex items-center gap-2 justify-end">
                    <div className={cn("h-2 rounded-sm", roi >= 0 ? "bg-[#22c55e]/20" : "bg-[#ef4444]/20")} style={{ width: '60px' }}>
                      <div className={cn("h-full rounded-sm", roi >= 0 ? "bg-[#22c55e]" : "bg-[#ef4444]")} style={{ width: `${roiWidth}%` }} />
                    </div>
                    <span className={cn("text-[13px] tabular-nums font-medium min-w-[70px] text-right", roi >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>
                      {roi >= 0 ? '+' : ''}{fCurrency5(roi)}%
                    </span>
                  </div>
                  {/* Profit with progress bar */}
                  <div className="flex items-center gap-2 justify-end">
                    <div className={cn("h-2 rounded-sm", profit >= 0 ? "bg-[#22c55e]/20" : "bg-[#ef4444]/20")} style={{ width: '60px' }}>
                      <div className={cn("h-full rounded-sm", profit >= 0 ? "bg-[#22c55e]" : "bg-[#ef4444]")} style={{ width: `${profitWidth}%` }} />
                    </div>
                    <span className={cn("text-[13px] tabular-nums font-medium min-w-[70px] text-right", profit >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>
                      {profit >= 0 ? '+' : ''}{fCurrency5(profit)}
                    </span>
                  </div>
                </div>
              );
            })}
            {filteredTokens.length > 10 && (
              <button onClick={() => setShowAllTokens(!showAllTokens)} className={cn("w-full text-center py-3 text-[12px] mt-4 transition-colors", isDark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600")}>
                {showAllTokens ? 'Show less' : `Show all ${filteredTokens.length} tokens`}
              </button>
            )}
          </div>
          );
        })()}
        </>
        )}

        {/* NFTs Tab */}
        {activeTab === 'nfts' && (
          <div className="space-y-4">
            {/* Mock NFT Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className={cn("rounded-xl border overflow-hidden", isDark ? "border-white/[0.06] bg-white/[0.015]" : "border-black/[0.06] bg-black/[0.01]")}>
                  <div className={cn("aspect-square", isDark ? "bg-white/[0.03]" : "bg-black/[0.02]")} />
                  <div className="p-3">
                    <p className={cn("text-[12px] font-medium truncate", isDark ? "text-white/80" : "text-gray-800")}>NFT #{i}</p>
                    <p className={cn("text-[11px]", isDark ? "text-white/40" : "text-gray-400")}>Collection</p>
                  </div>
                </div>
              ))}
            </div>
            <p className={cn("text-center text-[12px] py-4", isDark ? "text-white/30" : "text-gray-400")}>
              NFT display coming soon
            </p>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
        <>
        {/* Transaction History */}
        {txHistory.length > 0 && (
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3 px-1">
              <p className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-800")}>
                Account transactions ({filteredTxHistory.length})
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  className={cn(
                    "text-[12px] px-3 py-1.5 rounded-lg border outline-none flex-1 md:w-40",
                    isDark
                      ? "bg-transparent border-white/10 text-white/70 placeholder:text-white/30 focus:border-white/20"
                      : "bg-white border-gray-200 text-gray-600 placeholder:text-gray-400 focus:border-gray-300"
                  )}
                />
                <select
                  value={txFilter}
                  onChange={(e) => setTxFilter(e.target.value)}
                  className={cn(
                    "text-[12px] px-3 py-1.5 rounded-lg border cursor-pointer outline-none",
                    isDark
                      ? "bg-transparent border-white/10 text-white/60"
                      : "bg-white border-gray-200 text-gray-500"
                  )}
                  style={isDark ? { colorScheme: 'dark' } : {}}
                >
                  {getAvailableTxTypes().map(filter => (
                    <option key={filter} value={filter}>
                      {filter === 'all' ? 'All types' : filter}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className={cn("overflow-hidden rounded-xl", isDark ? "bg-transparent" : "bg-white border border-gray-200")}>
              {/* Header */}
              <div className="hidden md:grid items-center px-4 py-2" style={{ gridTemplateColumns: '0.8fr 4fr 1fr 1.5fr' }}>
                <span className={cn("text-[11px] uppercase tracking-wide", isDark ? "text-white/25" : "text-gray-400")}>Type</span>
                <span className={cn("text-[11px] uppercase tracking-wide", isDark ? "text-white/25" : "text-gray-400")}>Info</span>
                <span className={cn("text-[11px] uppercase tracking-wide text-right", isDark ? "text-white/25" : "text-gray-400")}>Time</span>
                <span className={cn("text-[11px] uppercase tracking-wide text-right", isDark ? "text-white/25" : "text-gray-400")}>Signature</span>
              </div>

              {/* Rows */}
              {filteredTxHistory.slice(txPage * 20, txPage * 20 + 20).map((tx, idx) => {
                const txData = tx.tx_json || tx.tx;
                const meta = tx.meta;
                const date = new Date((txData.date + 946684800) * 1000);
                const txHash = txData.hash || tx.hash;
                const shortHash = txHash ? `${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 6)}` : '';

                // Decode hex currency
                const decodeCurrency = (code) => {
                  if (!code || code === 'XRP') return 'XRP';
                  if (code.length === 3) return code;
                  try {
                    const hex = code.replace(/0+$/, '');
                    const decoded = Buffer.from(hex, 'hex').toString('utf8').replace(/\0/g, '');
                    return decoded.match(/^[A-Za-z0-9]+$/) ? decoded : code.substring(0, 6);
                  } catch { return code.substring(0, 6); }
                };

                // Get token icon URL
                const getTokenIcon = (currency, issuer) => {
                  if (currency === 'XRP') return 'https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8';
                  if (!issuer) return null;
                  const slug = `${issuer}_${currency}`;
                  const md5 = CryptoJS.MD5(slug).toString();
                  return `https://s1.xrpl.to/token/${md5}`;
                };

                // Format number with K/M/B suffix
                const formatNum = (n) => {
                  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
                  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
                  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
                  return n < 1 ? n.toFixed(4) : n.toFixed(2);
                };

                // Token with icon component - compact like reference
                const TokenBadge = ({ currency, issuer, amount, isNegative }) => {
                  const icon = getTokenIcon(currency, issuer);
                  return (
                    <span className="inline-flex items-center gap-1">
                      <span className={isNegative ? "text-[#c53030]" : "text-[#22863a]"}>{isNegative ? '-' : '+'}</span>
                      {icon && <img src={icon} className="w-3.5 h-3.5 rounded-full" onError={(e) => e.target.style.display='none'} alt="" />}
                      <span className={isDark ? "text-white/70" : "text-gray-600"}>{formatNum(amount)}</span>
                      <span className={isDark ? "text-white/40" : "text-gray-400"}>{currency}</span>
                    </span>
                  );
                };

                // Determine type label and info
                let typeLabel = 'Transaction';
                let info = null;

                if (txData.TransactionType === 'Payment') {
                  const isSender = txData.Account === account;

                  // Check dusting attack
                  if (!isSender && typeof txData.Amount === 'string' && parseInt(txData.Amount) < 1000) {
                    typeLabel = 'Payment';
                    info = <span className="text-[#c53030]">Dusting attack from {txData.Account?.substring(0, 8)}...</span>;
                  }
                  // Check swap (Payment with SendMax)
                  else if (txData.SendMax && meta?.delivered_amount) {
                    const sendIsXRP = typeof txData.SendMax === 'string';
                    const recvIsXRP = typeof meta.delivered_amount === 'string';

                    if (sendIsXRP !== recvIsXRP) {
                      typeLabel = 'Swap';
                      const sendAmt = sendIsXRP ? parseInt(txData.SendMax) / 1e6 : parseFloat(txData.SendMax.value);
                      const sendCurr = sendIsXRP ? 'XRP' : decodeCurrency(txData.SendMax.currency);
                      const sendIssuer = sendIsXRP ? null : txData.SendMax.issuer;
                      const recvAmt = recvIsXRP ? parseInt(meta.delivered_amount) / 1e6 : parseFloat(meta.delivered_amount.value);
                      const recvCurr = recvIsXRP ? 'XRP' : decodeCurrency(meta.delivered_amount.currency);
                      const recvIssuer = recvIsXRP ? null : meta.delivered_amount.issuer;

                      info = (
                        <span className="flex items-center gap-2">
                          <TokenBadge currency={sendCurr} issuer={sendIssuer} amount={sendAmt} isNegative />
                          <TokenBadge currency={recvCurr} issuer={recvIssuer} amount={recvAmt} />
                        </span>
                      );
                    }
                  }

                  if (!info) {
                    typeLabel = 'Payment';
                    const dest = isSender ? txData.Destination : txData.Account;
                    const delivered = meta?.delivered_amount || txData.Amount;
                    const amtIsXRP = typeof delivered === 'string';
                    const amt = amtIsXRP ? parseInt(delivered) / 1e6 : parseFloat(delivered?.value || 0);
                    const curr = amtIsXRP ? 'XRP' : decodeCurrency(delivered?.currency);
                    const issuer = amtIsXRP ? null : delivered?.issuer;
                    info = (
                      <span className="flex items-center gap-2">
                        <TokenBadge currency={curr} issuer={issuer} amount={amt} isNegative={isSender} />
                        <span className={isDark ? "text-white/40" : "text-gray-400"}>{isSender ? 'to' : 'from'}</span>
                        <span className={isDark ? "text-white/70" : "text-gray-600"}>{dest?.substring(0, 8)}...</span>
                      </span>
                    );
                  }
                } else if (txData.TransactionType === 'OfferCreate') {
                  typeLabel = 'Swap';
                  const getsVal = typeof txData.TakerGets === 'string' ? parseInt(txData.TakerGets) / 1e6 : parseFloat(txData.TakerGets?.value || 0);
                  const getsCurr = typeof txData.TakerGets === 'string' ? 'XRP' : decodeCurrency(txData.TakerGets?.currency);
                  const getsIssuer = typeof txData.TakerGets === 'string' ? null : txData.TakerGets?.issuer;
                  const paysVal = typeof txData.TakerPays === 'string' ? parseInt(txData.TakerPays) / 1e6 : parseFloat(txData.TakerPays?.value || 0);
                  const paysCurr = typeof txData.TakerPays === 'string' ? 'XRP' : decodeCurrency(txData.TakerPays?.currency);
                  const paysIssuer = typeof txData.TakerPays === 'string' ? null : txData.TakerPays?.issuer;

                  info = (
                    <span className="flex items-center gap-2">
                      <TokenBadge currency={getsCurr} issuer={getsIssuer} amount={getsVal} isNegative />
                      <TokenBadge currency={paysCurr} issuer={paysIssuer} amount={paysVal} />
                    </span>
                  );
                } else if (txData.TransactionType === 'TrustSet') {
                  typeLabel = 'TrustSet';
                  const curr = decodeCurrency(txData.LimitAmount?.currency);
                  const issuer = txData.LimitAmount?.issuer;
                  const icon = getTokenIcon(curr, issuer);
                  info = (
                    <span className="flex items-center gap-1.5">
                      {icon && <img src={icon} className="w-4 h-4 rounded-full" onError={(e) => e.target.style.display='none'} alt="" />}
                      <span className={isDark ? "text-white/70" : "text-gray-600"}>Trust line for {curr}</span>
                    </span>
                  );
                } else {
                  typeLabel = txData.TransactionType?.length > 10 ? txData.TransactionType.substring(0, 10) + '...' : txData.TransactionType;
                  info = <span className={isDark ? "text-white/50" : "text-gray-400"}>See more details</span>;
                }

                const isSuccess = meta?.TransactionResult === 'tesSUCCESS';
                const sourceTag = txData.SourceTag;
                const destTag = txData.DestinationTag;
                const isExpanded = expandedTx === txHash;

                const handleExplainWithAI = async (e) => {
                  e.stopPropagation();
                  if (aiLoading[txHash] || aiExplanation[txHash]) return;
                  setAiLoading(prev => ({ ...prev, [txHash]: true }));
                  try {
                    const res = await axios.get(`https://api.xrpl.to/api/ai/${txHash}`);
                    setAiExplanation(prev => ({ ...prev, [txHash]: res.data }));
                  } catch {
                    setAiExplanation(prev => ({ ...prev, [txHash]: { summary: { summary: `${typeLabel} transaction ${isSuccess ? 'completed successfully' : 'failed'}.`, keyPoints: [] } } }));
                  } finally {
                    setAiLoading(prev => ({ ...prev, [txHash]: false }));
                  }
                };

                return (
                  <div key={idx}>
                    <div
                      onClick={() => setExpandedTx(isExpanded ? null : txHash)}
                      className={cn(
                        "px-4 py-2.5 transition-colors cursor-pointer",
                        isDark ? "hover:bg-white/[0.02] border-t border-white/[0.04]" : "hover:bg-gray-50 border-t border-gray-100",
                        isExpanded && (isDark ? "bg-white/[0.02]" : "bg-gray-50")
                      )}
                    >
                      {/* Desktop layout */}
                      <div className="hidden md:grid items-center" style={{ gridTemplateColumns: '0.8fr 4fr 1fr 1.5fr' }}>
                        {/* TYPE */}
                        <div className="flex items-center gap-1.5">
                          <span className={isSuccess ? "text-[#22c55e] text-[12px]" : "text-[#ef4444] text-[12px]"}>
                            {isSuccess ? '✓' : '✗'}
                          </span>
                          <span className={cn(
                            "text-[12px]",
                            typeLabel === 'Swap' && "text-[#a78bfa]",
                            typeLabel === 'Transfer' && "text-[#60a5fa]",
                            typeLabel === 'Payment' && "text-[#60a5fa]",
                            typeLabel === 'TrustSet' && "text-[#34d399]",
                            !['Swap', 'Transfer', 'Payment', 'TrustSet'].includes(typeLabel) && (isDark ? "text-white/60" : "text-gray-600")
                          )}>{typeLabel}</span>
                        </div>

                        {/* INFO */}
                        <div className="text-[12px] truncate flex items-center gap-2">
                          {info}
                          {sourceTag && <span className={cn("px-1.5 py-0.5 rounded text-[10px]", isDark ? "bg-white/5 text-white/40" : "bg-gray-100 text-gray-500")}>ST:{sourceTag}</span>}
                          {destTag && <span className={cn("px-1.5 py-0.5 rounded text-[10px]", isDark ? "bg-white/5 text-white/40" : "bg-gray-100 text-gray-500")}>DT:{destTag}</span>}
                        </div>

                        {/* TIME */}
                        <span className={cn("text-[12px] text-right", isDark ? "text-white/40" : "text-gray-400")}>
                          {formatDistanceToNow(date, { addSuffix: false })}
                        </span>

                        {/* SIGNATURE */}
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/tx/${txHash}`}
                            onClick={(e) => e.stopPropagation()}
                            className={cn("text-[12px] hover:underline", isDark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600")}
                          >
                            {shortHash}
                          </Link>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(txHash); }}
                            className={cn("p-0.5", isDark ? "text-white/20 hover:text-white/40" : "text-gray-300 hover:text-gray-400")}
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Mobile layout */}
                      <div className="md:hidden space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={isSuccess ? "text-[#22c55e] text-[12px]" : "text-[#ef4444] text-[12px]"}>
                              {isSuccess ? '✓' : '✗'}
                            </span>
                            <span className={cn(
                              "text-[12px] font-medium",
                              typeLabel === 'Swap' && "text-[#a78bfa]",
                              typeLabel === 'Payment' && "text-[#60a5fa]",
                              typeLabel === 'TrustSet' && "text-[#34d399]",
                              !['Swap', 'Payment', 'TrustSet'].includes(typeLabel) && (isDark ? "text-white/70" : "text-gray-700")
                            )}>{typeLabel}</span>
                          </div>
                          <span className={cn("text-[11px]", isDark ? "text-white/30" : "text-gray-400")}>
                            {formatDistanceToNow(date, { addSuffix: false })}
                          </span>
                        </div>
                        <div className="text-[12px] truncate">{info}</div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {sourceTag && <span className={cn("px-1.5 py-0.5 rounded text-[10px]", isDark ? "bg-white/5 text-white/40" : "bg-gray-100 text-gray-500")}>ST:{sourceTag}</span>}
                            {destTag && <span className={cn("px-1.5 py-0.5 rounded text-[10px]", isDark ? "bg-white/5 text-white/40" : "bg-gray-100 text-gray-500")}>DT:{destTag}</span>}
                          </div>
                          <Link
                            href={`/tx/${txHash}`}
                            onClick={(e) => e.stopPropagation()}
                            className={cn("text-[11px]", isDark ? "text-white/40" : "text-gray-400")}
                          >
                            {shortHash}
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Section */}
                    {isExpanded && (
                      <div className={cn(
                        "border-l-2 border-l-[#c53030] px-4 py-4",
                        isDark ? "bg-[#0a0a0a]" : "bg-gray-50"
                      )}>
                        {/* AI Loading/Explanation Box */}
                        {(aiLoading[txHash] || aiExplanation[txHash]) && (
                          <div className={cn(
                            "mb-4 p-4 rounded-lg border",
                            isDark ? "bg-[#0d0d0d] border-white/[0.06]" : "bg-white border-gray-200"
                          )}>
                            <style jsx>{`
                              @keyframes scanline { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
                              @keyframes glow { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
                              @keyframes pulse-bar { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.35; } }
                            `}</style>
                            {aiLoading[txHash] ? (
                              <>
                                <div className="space-y-2.5">
                                  {[95, 80, 88, 65, 92, 100, 70, 85].map((w, i) => (
                                    <div key={i} className="h-[6px] rounded-sm overflow-hidden relative" style={{ width: `${w}%` }}>
                                      <div className="absolute inset-0 rounded-sm" style={{ background: i === 5 ? 'rgba(197,48,48,0.4)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', animation: 'pulse-bar 2s ease-in-out infinite', animationDelay: `${i * 0.12}s` }} />
                                      <div className="absolute inset-0 rounded-sm" style={{ background: i === 5 ? 'linear-gradient(90deg, transparent, #c53030, transparent)' : `linear-gradient(90deg, transparent, ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}, transparent)`, animation: 'scanline 1.8s ease-in-out infinite', animationDelay: `${i * 0.08}s` }} />
                                    </div>
                                  ))}
                                </div>
                                <div className={cn("mt-4 text-[12px] flex items-center gap-1", isDark ? "text-white/50" : "text-gray-500")}>
                                  Analyzing
                                  {[0,1,2].map(i => <span key={i} className="inline-block w-1 h-1 rounded-full bg-current ml-0.5" style={{ animation: 'glow 1.2s ease-in-out infinite', animationDelay: `${i * 0.25}s` }} />)}
                                </div>
                              </>
                            ) : (() => {
                              let summaryText = 'AI analysis complete.';
                              let keyPoints = [];
                              const raw = aiExplanation[txHash]?.summary?.raw || aiExplanation[txHash]?.summary;
                              if (typeof raw === 'string') {
                                const summaryMatch = raw.match(/"summary"\s*:\s*"([^"]+)"/);
                                if (summaryMatch) summaryText = summaryMatch[1];
                                const keyPointsMatch = raw.match(/"keyPoints"\s*:\s*\[([^\]]*)/);
                                if (keyPointsMatch) {
                                  const points = keyPointsMatch[1].match(/"([^"]+)"/g);
                                  if (points) keyPoints = points.map(p => p.replace(/"/g, ''));
                                }
                              } else if (typeof raw === 'object' && raw?.summary) {
                                summaryText = raw.summary;
                                keyPoints = raw.keyPoints || [];
                              }
                              return (
                                <>
                                  <p className={cn("text-[13px] leading-relaxed font-mono", isSuccess ? "text-[#3b82f6]" : "text-[#ef4444]")}>
                                    {typeLabel} ({isSuccess ? 'Success' : 'Failed'}): {summaryText}
                                  </p>
                                  {keyPoints.length > 0 && (
                                    <>
                                      <p className={cn("mt-4 mb-2 text-[11px] uppercase tracking-widest font-medium", isDark ? "text-white/40" : "text-gray-500")}>Key Points</p>
                                      <ul className="space-y-1.5">
                                        {keyPoints.map((point, i) => (
                                          <li key={i} className={cn("text-[12px] flex items-start gap-2 font-mono", isDark ? "text-white/70" : "text-gray-600")}>
                                            <span className="text-[#3b82f6]">•</span>
                                            <span>{point}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </>
                                  )}
                                  <p className={cn("mt-4 mb-1 text-[11px] uppercase tracking-widest font-medium", isDark ? "text-white/40" : "text-gray-500")}>Additional Information</p>
                                  <p className={cn("text-[12px] font-mono", isDark ? "text-white/50" : "text-gray-500")}>
                                    Transaction on XRPL • Fee: {txData.Fee ? (parseInt(txData.Fee) / 1e6).toFixed(6) : '0'} XRP • Ledger: {txData.ledger_index || 'N/A'}
                                  </p>
                                </>
                              );
                            })()}
                          </div>
                        )}

                        {/* Action Row */}
                        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
                          <Link
                            href={`/tx/${txHash}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#c53030] hover:bg-[#b91c1c] transition-colors"
                          >
                            <span className="text-[13px] text-white font-medium">See advanced details</span>
                            <ExternalLink size={14} className="text-white" />
                          </Link>

                          {!aiLoading[txHash] && !aiExplanation[txHash] ? (
                            <button
                              onClick={handleExplainWithAI}
                              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#f97316] hover:bg-[#ea580c] transition-colors"
                            >
                              <span className="text-[13px] text-white font-medium">Explain with AI</span>
                            </button>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setAiExplanation(prev => { const n = {...prev}; delete n[txHash]; return n; }); setAiLoading(prev => { const n = {...prev}; delete n[txHash]; return n; }); }}
                              className={cn("w-full md:w-10 h-10 flex items-center justify-center rounded-lg transition-colors", isDark ? "bg-white/[0.05] hover:bg-white/[0.1] text-white/60" : "bg-gray-100 hover:bg-gray-200 text-gray-500")}
                            >
                              <span className="text-[16px]">×</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className={cn("text-[11px]", isDark ? "text-white/30" : "text-gray-400")}>Transactions per page</span>
                <span className={cn("text-[11px]", isDark ? "text-white/50" : "text-gray-500")}>20</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setTxPage(0)} disabled={txPage === 0} className={cn("px-1 text-[11px]", txPage === 0 ? (isDark ? "text-white/10" : "text-gray-200") : (isDark ? "text-white/30 hover:text-white/50" : "text-gray-400 hover:text-gray-600"))}>«</button>
                <button onClick={() => setTxPage(Math.max(0, txPage - 1))} disabled={txPage === 0} className={cn("px-1 text-[11px]", txPage === 0 ? (isDark ? "text-white/10" : "text-gray-200") : (isDark ? "text-white/30 hover:text-white/50" : "text-gray-400 hover:text-gray-600"))}>‹</button>
                <span className={cn("text-[11px] px-2", isDark ? "text-white/40" : "text-gray-400")}>Page {txPage + 1}</span>
                <button onClick={() => setTxPage(txPage + 1)} disabled={txPage >= Math.ceil(filteredTxHistory.length / 20) - 1} className={cn("px-1 text-[11px]", txPage >= Math.ceil(filteredTxHistory.length / 20) - 1 ? (isDark ? "text-white/10" : "text-gray-200") : (isDark ? "text-white/30 hover:text-white/50" : "text-gray-400 hover:text-gray-600"))}>›</button>
                <button onClick={() => setTxPage(Math.ceil(filteredTxHistory.length / 20) - 1)} disabled={txPage >= Math.ceil(filteredTxHistory.length / 20) - 1} className={cn("px-1 text-[11px]", txPage >= Math.ceil(filteredTxHistory.length / 20) - 1 ? (isDark ? "text-white/10" : "text-gray-200") : (isDark ? "text-white/30 hover:text-white/50" : "text-gray-400 hover:text-gray-600"))}>»</button>
              </div>
            </div>
          </div>
        )}
        {txHistory.length === 0 && (
          <div className={cn("text-center py-10 rounded-xl border", isDark ? "border-white/[0.06] bg-white/[0.015]" : "border-black/[0.06] bg-black/[0.01]")}>
            <p className={cn("text-[13px]", isDark ? "text-white/40" : "text-gray-400")}>No activity yet</p>
          </div>
        )}
        </>
        )}
          </div>
        </div>
      </div>

      <ScrollToTop />
      <Footer />
    </PageWrapper>
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
