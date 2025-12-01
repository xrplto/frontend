import React, { useState, useEffect, useCallback, useContext } from 'react';
import styled from '@emotion/styled';
import axios from 'axios';
import { Loader2, Copy, Check, TrendingUp, Gauge, Eye, Wallet, Timer, Info, Calculator, Megaphone, Sparkles } from 'lucide-react';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { AppContext } from 'src/AppContext';
import { ConnectWallet } from 'src/components/Wallet';
import { useDispatch, useSelector } from 'react-redux';
import { selectProcess, updateProcess, updateTxHash } from 'src/redux/transactionSlice';
import { enqueueSnackbar } from 'notistack';
import Decimal from 'decimal.js-light';
import { cn } from 'src/utils/cn';

// Debounce hook with proper cleanup
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    if (delay <= 0) {
      setDebouncedValue(value);
      return;
    }

    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${(props) =>
    props.theme.palette.mode === 'dark'
      ? 'linear-gradient(180deg, #000000 0%, #0a0a0a 100%)'
      : 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)'};
`;

const MainContent = styled.main`
  flex: 1;
  padding: 60px 0;
  @media (max-width: 768px) {
    padding: 40px 0;
  }
`;

const API_URL = 'https://api.xrpl.to/api';

export default function Advertise() {
  const dispatch = useDispatch();
  const { accountProfile, openSnackbar, sync, setSync, setOpenWalletModal, setLoading, themeName } =
    useContext(AppContext);
  const process = useSelector(selectProcess);
  const isDark = themeName === 'XrplToDarkTheme';

  const [impressionInput, setImpressionInput] = useState('');
  const [customImpressions, setCustomImpressions] = useState('');
  const [copied, setCopied] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [xrpRate, setXrpRate] = useState(0.65);
  const [totalTokens, setTotalTokens] = useState(0);

  const [openScanQR, setOpenScanQR] = useState(false);
  const [uuid, setUuid] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);
  const [destinationTag, setDestinationTag] = useState(
    Math.floor(Math.random() * 1000000) + 100000
  );

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    fetchTopTokens();
  }, []);

  useEffect(() => {
    if (debouncedSearchQuery) {
      searchTokens(debouncedSearchQuery);
    } else {
      fetchTopTokens();
    }
  }, [debouncedSearchQuery]);

  const fetchTopTokens = async () => {
    setLocalLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/tokens?limit=50&sortBy=vol24hxrp&sortType=desc`
      );

      if (response.data.total) {
        setTotalTokens(response.data.total);
      }

      if (response.data.exch && response.data.exch.USD) {
        setXrpRate(1 / response.data.exch.USD);
      }

      const tokenList = response.data.tokens.map((token) => ({
        label: `${token.name || token.currencyCode} - ${token.issuer?.substring(0, 8)}...`,
        value: token.md5,
        currency: token.currencyCode,
        name: token.name,
        issuer: token.issuer,
        marketcap: parseFloat(token.marketcap) || 0,
        price: parseFloat(token.exch) || parseFloat(token.price) || 0,
        volume24h: parseFloat(token.vol24hxrp) || 0,
        change24h: parseFloat(token.pro24h) || 0,
        trustlines: token.trustlines || 0
      }));
      setTokens(tokenList);
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  const searchTokens = async (query) => {
    setLocalLoading(true);
    try {
      const response = await axios.post(`${API_URL}/search`, { search: query });
      if (response.data?.tokens) {
        const tokenList = response.data.tokens.map((token) => ({
          label: `${token.user || token.name} - ${token.name || ''}`,
          value: token.md5,
          currency: token.currency,
          name: token.name,
          user: token.user,
          marketcap: parseFloat(token.marketcap) || 0,
          price: parseFloat(token.exch) || 0,
          volume24h: parseFloat(token.vol24hxrp) || 0,
          change24h: parseFloat(token.pro24h) || 0,
          verified: token.verified || false
        }));
        setTokens(tokenList);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  const pricingTiers = [
    { impressions: 10000, price: 299, label: '10k views' },
    { impressions: 25000, price: 699, label: '25k views' },
    { impressions: 50000, price: 999, label: '50k views' },
    { impressions: 100000, price: 1999, label: '100k views' },
    { impressions: 200000, price: 3999, label: '200k views' },
    { impressions: 400000, price: 6999, label: '400k views' }
  ];

  const calculatePrice = (impressions) => {
    const tier = pricingTiers.find((t) => t.impressions === impressions);
    if (tier) return tier.price;

    if (impressions <= 0) return 0;

    let price = 0;
    let remaining = impressions;

    const brackets = [
      { max: 10000, rate: 29.9 },
      { max: 25000, rate: 27.96 },
      { max: 50000, rate: 19.98 },
      { max: 100000, rate: 19.99 },
      { max: 200000, rate: 19.995 },
      { max: 400000, rate: 17.495 },
      { max: Infinity, rate: 15 }
    ];

    let prevMax = 0;
    for (const bracket of brackets) {
      const bracketSize = Math.min(remaining, bracket.max - prevMax);
      if (bracketSize > 0) {
        price += (bracketSize / 1000) * bracket.rate;
        remaining -= bracketSize;
        prevMax = bracket.max;
      }
      if (remaining <= 0) break;
    }

    return Math.round(price);
  };

  const getCPMRate = (impressions) => {
    const price = calculatePrice(impressions);
    return price ? price / (impressions / 1000) : 0;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const handleImpressionChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setImpressionInput(value ? formatNumber(value) : '');
    setCustomImpressions(value);
  };

  const handlePayment = async () => {
    if (!accountProfile || !accountProfile.account) {
      setOpenWalletModal(true);
      return;
    }

    const Account = accountProfile.account;
    const user_token = accountProfile.user_token;
    const wallet_type = accountProfile.wallet_type;
    const xrpAmount = (calculatePrice(parseInt(customImpressions)) / xrpRate).toFixed(6);
    const xrpDrops = new Decimal(xrpAmount).mul(1000000).toString();

    const transactionData = {
      TransactionType: 'Payment',
      Account,
      Destination: 'rN7n7otQDd6FczFgLdAtqCSVvUV6jGUMxt',
      Amount: xrpDrops,
      DestinationTag: destinationTag,
      Fee: '12',
      Memos: [
        {
          Memo: {
            MemoType: Buffer.from('advertising', 'utf8').toString('hex').toUpperCase(),
            MemoData: Buffer.from(
              JSON.stringify({
                token: selectedToken?.name || selectedToken?.currency,
                impressions: customImpressions,
                price: calculatePrice(parseInt(customImpressions))
              }),
              'utf8'
            )
              .toString('hex')
              .toUpperCase()
          }
        }
      ]
    };

    try {
      openSnackbar('Payment no longer supported in this wallet type', 'info');
      dispatch(updateProcess(0));
    } catch (err) {
      console.error('Payment error:', err);
      dispatch(updateProcess(0));
      setLocalLoading(false);
      const errorMessage = err.response?.data?.message || 'Payment failed. Please try again.';
      openSnackbar(errorMessage, 'error');
    }
  };

  useEffect(() => {
    return;
  }, [openScanQR, uuid]);

  const handleScanQRClose = () => {
    setOpenScanQR(false);
  };

  return (
    <PageWrapper>
      <Header />
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        Advertise on XRPL.to
      </h1>
      <MainContent>
        <div className="mx-auto max-w-5xl px-4">
          {/* Hero Section */}
          <div className={cn(
            "text-center mb-12 p-12 rounded-2xl relative overflow-hidden",
            isDark
              ? "bg-gradient-to-br from-blue-500/10 to-blue-500/5"
              : "bg-gradient-to-br from-blue-500/5 to-blue-500/2"
          )}>
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Megaphone size={20} className="text-primary" />
                <span className={cn(
                  "inline-block px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide",
                  "bg-gradient-to-r from-primary to-blue-600 text-white"
                )}>
                  Token Advertising Platform
                </span>
              </div>

              <h2 className={cn(
                "text-3xl font-semibold mb-4",
                "bg-gradient-to-r bg-clip-text text-transparent",
                isDark
                  ? "from-white to-gray-400"
                  : "from-blue-600 to-blue-400"
              )}>
                Reach Millions on XRPL
              </h2>

              <p className={cn(
                "text-base max-w-2xl mx-auto leading-relaxed",
                isDark ? "text-white/70" : "text-gray-600"
              )}>
                Promote your token to our engaged community of traders and investors. Simple
                pricing, instant activation, real-time analytics.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg border-[1.5px]",
                  isDark ? "border-white/15" : "border-gray-200"
                )}>
                  <Eye size={14} />
                  <span className="text-sm font-normal">40K+ Monthly Users</span>
                </div>
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg border-[1.5px]",
                  isDark ? "border-white/15" : "border-gray-200"
                )}>
                  <TrendingUp size={14} />
                  <span className="text-sm font-normal">
                    {totalTokens > 0 ? `${totalTokens.toLocaleString()} Tokens` : 'Loading...'}
                  </span>
                </div>
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg border-[1.5px]",
                  isDark ? "border-white/15" : "border-gray-200"
                )}>
                  <Gauge size={14} />
                  <span className="text-sm font-normal">Instant Activation</span>
                </div>
              </div>
            </div>
          </div>

          {/* Calculator Card */}
          <div className={cn(
            "max-w-3xl mx-auto mb-12 overflow-hidden rounded-2xl border-[1.5px] transition-all",
            isDark
              ? "bg-gradient-to-br from-gray-900/50 to-gray-900/30 border-gray-800/15 backdrop-blur-xl"
              : "bg-white border-gray-200"
          )}>
            {/* Card Header */}
            <div className={cn(
              "p-6 border-b-[3px] border-primary relative",
              isDark ? "bg-primary/15" : "bg-primary/8"
            )}>
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 shadow-lg shadow-primary/30">
                  <Calculator size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-bold">Advertising Calculator</h3>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
              {/* Token Selection */}
              <div className="mb-6">
                <label className={cn(
                  "block text-sm font-medium mb-2",
                  isDark ? "text-white/80" : "text-gray-700"
                )}>
                  Select Token to Advertise
                </label>
                <select
                  value={selectedToken?.value || ''}
                  onChange={(e) => {
                    const token = tokens.find(t => t.value === e.target.value);
                    setSelectedToken(token);
                  }}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border-[1.5px] text-sm",
                    isDark
                      ? "bg-gray-900/80 border-white/15 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  )}
                >
                  <option value="">Choose a token...</option>
                  {tokens.map((token) => (
                    <option key={token.value} value={token.value}>
                      {token.label}
                    </option>
                  ))}
                </select>
                <p className={cn(
                  "flex items-center gap-1 mt-2 text-xs",
                  isDark ? "text-white/60" : "text-gray-600"
                )}>
                  <TrendingUp size={14} />
                  {searchQuery
                    ? `Searching for "${searchQuery}"...`
                    : totalTokens > 0
                      ? `Showing top ${tokens.length} of ${totalTokens.toLocaleString()} total tokens by 24h volume`
                      : 'Showing top 100 most traded tokens - type to search all tokens'}
                </p>
              </div>

              {/* Impressions Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className={cn(
                    "block text-sm font-medium mb-2",
                    isDark ? "text-white/80" : "text-gray-700"
                  )}>
                    Number of Impressions
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Sparkles size={18} className="text-primary animate-pulse" />
                    </div>
                    <input
                      type="text"
                      value={impressionInput}
                      onChange={handleImpressionChange}
                      placeholder="Enter any amount"
                      className={cn(
                        "w-full pl-10 pr-4 py-3 rounded-lg border-[1.5px] text-lg font-normal transition-all",
                        isDark
                          ? "bg-gray-900/80 border-white/15 text-white placeholder:text-white/40"
                          : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                      )}
                    />
                  </div>
                  <p className={cn(
                    "flex items-center gap-1 mt-2 text-xs",
                    isDark ? "text-white/60" : "text-gray-600"
                  )}>
                    <Info size={14} />
                    Enter any amount or click packages below for popular options
                  </p>
                </div>

                <div>
                  {customImpressions && parseInt(customImpressions) > 0 ? (
                    <div className={cn(
                      "p-6 rounded-2xl border-2 border-primary text-center relative overflow-hidden",
                      isDark ? "bg-primary/8" : "bg-primary/5"
                    )}>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Total Cost</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-3">
                        {formatPrice(calculatePrice(parseInt(customImpressions)))}
                      </p>
                      <div className={cn(
                        "inline-flex items-center gap-1 px-3 py-1 rounded-full border-[1.5px] border-primary text-sm font-normal",
                        "text-primary"
                      )}>
                        <Sparkles size={14} />
                        ≈ {(calculatePrice(parseInt(customImpressions)) / xrpRate).toFixed(2)} XRP
                      </div>
                      <button
                        onClick={() => {
                          document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        disabled={!selectedToken}
                        className={cn(
                          "w-full mt-4 px-4 py-2 rounded-lg border-[1.5px] text-sm font-normal transition-all",
                          !selectedToken
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-primary/5"
                        )}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Wallet size={16} />
                          {selectedToken ? 'Pay with XRP' : 'Select Token First'}
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className={cn(
                      "p-12 rounded-2xl border-2 border-dashed text-center",
                      isDark ? "border-white/15" : "border-gray-300"
                    )}>
                      <p className={cn("text-sm", isDark ? "text-white/60" : "text-gray-600")}>
                        Enter impressions to see price
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Buy Packages */}
              <div className={cn(
                "p-6 rounded-xl",
                isDark ? "bg-gray-900/20 border-[1.5px] border-gray-800/15" : "bg-gray-50 border-[1.5px] border-gray-200"
              )}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} />
                    <p className="text-sm font-semibold">Quick Buy Packages</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-normal rounded bg-green-500/10 text-green-500 border border-green-500/30">
                    Best Value
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {pricingTiers.map((tier, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setImpressionInput(formatNumber(tier.impressions));
                        setCustomImpressions(tier.impressions.toString());
                      }}
                      className={cn(
                        "p-4 rounded-lg border-2 cursor-pointer transition-all relative overflow-hidden",
                        isDark
                          ? "bg-gray-900/10 border-gray-800/20 hover:border-primary hover:bg-primary/8"
                          : "bg-gray-50 border-gray-200 hover:border-primary hover:bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-normal">{tier.label}</span>
                        <span className="text-sm font-semibold text-primary">${formatNumber(tier.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className={cn(
                  "text-center mt-4 text-xs",
                  isDark ? "text-white/60" : "text-gray-600"
                )}>
                  💡 Custom amounts welcome • Flexible pricing for any budget
                </p>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          {selectedToken && customImpressions && parseInt(customImpressions) > 0 && (
            <div id="payment-section" className={cn(
              "max-w-3xl mx-auto overflow-hidden rounded-2xl border-[1.5px]",
              isDark
                ? "bg-gradient-to-br from-gray-900/50 to-gray-900/30 border-gray-800/15 backdrop-blur-xl"
                : "bg-white border-gray-200"
            )}>
              <div className="p-4 bg-gradient-to-r from-primary to-blue-600 text-white">
                <div className="flex items-center justify-center gap-2">
                  <Wallet size={20} />
                  <h3 className="text-xl font-semibold">Complete Your Order</h3>
                </div>
              </div>

              <div className="p-6">
                <div className={cn(
                  "p-6 mb-8 rounded-xl border-2 border-primary relative overflow-hidden",
                  isDark ? "bg-primary/5" : "bg-primary/3"
                )}>
                  <div className="text-center space-y-4">
                    {selectedToken && (
                      <div className="mb-4">
                        <p className={cn("text-xs uppercase tracking-wide", isDark ? "text-white/60" : "text-gray-600")}>
                          Advertising for
                        </p>
                        <div className="flex items-center justify-center gap-4 mt-2">
                          <div className="w-14 h-14 rounded-full overflow-hidden border-[3px] border-primary shadow-lg shadow-primary/30">
                            <img
                              src={`https://s1.xrpl.to/token/${selectedToken.value}`}
                              alt={selectedToken.name || selectedToken.currency}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-lg font-bold">{selectedToken.name || selectedToken.currency}</p>
                            <p className={cn("text-xs", isDark ? "text-white/60" : "text-gray-600")}>
                              Vol: {selectedToken.volume24h > 1000000
                                ? `${(selectedToken.volume24h / 1000000).toFixed(1)}M`
                                : selectedToken.volume24h > 1000
                                  ? `${(selectedToken.volume24h / 1000).toFixed(1)}K`
                                  : selectedToken.volume24h?.toFixed(0) || '0'} XRP
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-primary uppercase tracking-wide font-semibold">Total Amount Due</p>
                    <p className="text-4xl font-bold">{formatPrice(calculatePrice(parseInt(customImpressions)))}</p>
                    <div className="flex items-center justify-center gap-4">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-4 py-1.5 rounded-full border-[1.5px] border-primary text-lg font-normal",
                        "text-primary"
                      )}>
                        <Sparkles size={16} />
                        ≈ {(calculatePrice(parseInt(customImpressions)) / xrpRate).toFixed(2)} XRP
                      </span>
                      <p className={cn("text-xs", isDark ? "text-white/60" : "text-gray-600")}>
                        @ ${xrpRate.toFixed(2)}/XRP
                      </p>
                    </div>
                    <p className={cn("text-sm", isDark ? "text-white/70" : "text-gray-600")}>
                      {formatNumber(customImpressions)} impressions • $
                      {getCPMRate(parseInt(customImpressions)).toFixed(2)} CPM
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Wallet size={18} className="text-primary" />
                      <h4 className="text-lg font-semibold">Payment Information</h4>
                    </div>

                    <div className="space-y-4">
                      <div className={cn(
                        "p-6 rounded-xl border-[1.5px]",
                        isDark ? "bg-black/20 border-white/10" : "bg-gray-50 border-gray-200"
                      )}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={cn(
                              "text-xs uppercase tracking-wide font-semibold mb-2",
                              isDark ? "text-white/60" : "text-gray-600"
                            )}>
                              XRP Address
                            </p>
                            <p className="text-lg font-mono font-normal break-all">
                              rN7n7otQDd6FczFgLdAtqCSVvUV6jGUMxt
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText('rN7n7otQDd6FczFgLdAtqCSVvUV6jGUMxt');
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className={cn(
                              "ml-4 p-2 rounded-lg border-[1.5px] transition-colors",
                              isDark ? "border-white/15 hover:bg-white/5" : "border-gray-300 hover:bg-gray-100"
                            )}
                            title={copied ? 'Copied!' : 'Copy address'}
                          >
                            {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                          </button>
                        </div>
                      </div>

                      <div className={cn(
                        "p-6 rounded-xl border-[1.5px]",
                        isDark ? "bg-black/20 border-white/10" : "bg-gray-50 border-gray-200"
                      )}>
                        <p className={cn(
                          "text-xs uppercase tracking-wide font-semibold mb-2",
                          isDark ? "text-white/60" : "text-gray-600"
                        )}>
                          Destination Tag (Required)
                        </p>
                        <p className="text-2xl font-mono font-normal text-primary">
                          {destinationTag}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={cn(
                    "p-4 rounded-xl border-[1.5px]",
                    "bg-yellow-500/10 border-yellow-500/30"
                  )}>
                    <div className="flex items-start gap-2">
                      <Info size={20} className="text-yellow-500 mt-0.5" />
                      <p className="text-sm font-normal">
                        Include the destination tag in your transaction to ensure proper order processing
                      </p>
                    </div>
                  </div>

                  {accountProfile && accountProfile.account ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={handlePayment}
                        disabled={process.status === 'processing'}
                        className={cn(
                          "flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-[1.5px] text-sm font-normal transition-all",
                          process.status === 'processing'
                            ? "opacity-50 cursor-not-allowed"
                            : "bg-primary text-white border-primary hover:opacity-90"
                        )}
                      >
                        <Wallet size={16} />
                        {process.status === 'processing' ? 'Processing...' : 'Pay with Wallet'}
                      </button>
                      <button
                        onClick={() => {
                          setCustomImpressions('');
                          setImpressionInput('');
                        }}
                        className={cn(
                          "px-4 py-3 rounded-lg border-[1.5px] text-sm font-normal transition-all",
                          isDark
                            ? "border-white/15 hover:bg-white/5"
                            : "border-gray-300 hover:bg-gray-100"
                        )}
                      >
                        Change Amount
                      </button>
                    </div>
                  ) : (
                    <div>
                      <ConnectWallet />
                      <p className={cn(
                        "text-center mt-2 text-xs",
                        isDark ? "text-white/60" : "text-gray-600"
                      )}>
                        Connect your wallet to complete payment
                      </p>
                    </div>
                  )}

                  <div className={cn(
                    "p-6 rounded-xl border-[1.5px]",
                    "bg-green-500/5 border-green-500/20"
                  )}>
                    <div className="flex items-start gap-4">
                      <Gauge size={20} className="text-green-500 mt-1" />
                      <div>
                        <p className="text-sm font-semibold mb-2">What Happens Next?</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Check size={16} className="text-green-500" />
                            <p className="text-sm">Send XRP to the address with destination tag</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check size={16} className="text-green-500" />
                            <p className="text-sm font-semibold">Campaign starts instantly</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check size={16} className="text-green-500" />
                            <p className="text-sm">Receive analytics dashboard access</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check size={16} className="text-green-500" />
                            <p className="text-sm">Track impressions in real-time</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </MainContent>
      <Footer />
    </PageWrapper>
  );
}
