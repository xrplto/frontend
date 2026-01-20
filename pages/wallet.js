import { useState, useContext, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSelector } from 'react-redux';
import styled from '@emotion/styled';
import { MD5 } from 'crypto-js';
import { Client } from 'xrpl';
import { AppContext } from 'src/AppContext';
import { selectMetrics } from 'src/redux/statusSlice';
import { cn } from 'src/utils/cn';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { withdrawalStorage } from 'src/utils/withdrawalStorage';
import { getNftCoverUrl } from 'src/utils/parseUtils';
import {
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Check,
  Wallet,
  Image,
  RotateCcw,
  TrendingUp,
  Building2,
  ChevronRight,
  ExternalLink,
  ArrowRightLeft,
  ChevronDown,
  Search,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  X,
  Star,
  Coins,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import QRCode from 'react-qr-code';

const BASE_URL = 'https://api.xrpl.to';

export default function WalletPage() {
  const router = useRouter();
  const { tab: initialTab } = router.query;
  const { themeName, accountProfile, setOpenWalletModal, activeFiatCurrency } =
    useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const metrics = useSelector(selectMetrics);
  const exchRate =
    metrics?.[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics?.CNY : null) || 1;
  const currencySymbols = { USD: '$', EUR: '€', JPY: '¥', CNH: '¥', XRP: '✕' };
  const accountLogin = accountProfile?.account;
  const address = accountLogin;

  const [activeTab, setActiveTab] = useState(initialTab || 'overview');
  const [copied, setCopied] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Sync tab with URL query parameter
  useEffect(() => {
    if (initialTab === 'send') {
      setShowPanel('send');
      setActiveTab('overview');
      // Clear the query param after opening panel
      router.replace('/wallet', undefined, { shallow: true });
    } else if (initialTab === 'receive') {
      setShowPanel('receive');
      setActiveTab('overview');
      // Clear the query param after opening panel
      router.replace('/wallet', undefined, { shallow: true });
    } else if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Handle tab switching - clears query param if present
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Clear any send/receive query params when switching tabs
    if (router.query.tab) {
      router.replace('/wallet', undefined, { shallow: true });
    }
  };

  // Form state - declare before restore effect
  const [sendAmount, setSendAmount] = useState('');
  const [sendTo, setSendTo] = useState('');
  const [sendTag, setSendTag] = useState('');
  const [selectedToken, setSelectedToken] = useState('XRP');
  const [showPanel, setShowPanel] = useState(null); // 'send' | 'receive' | null
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [tokenSort, setTokenSort] = useState('value');
  const [hideZeroBalance, setHideZeroBalance] = useState(false);
  const [tokenPage, setTokenPage] = useState(1);
  const tokensPerPage = 20;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [tokenDropdownOpen, setTokenDropdownOpen] = useState(false);
  const [tokenSearch, setTokenSearch] = useState('');
  const [nftToTransfer, setNftToTransfer] = useState(null);
  const [nftRecipient, setNftRecipient] = useState('');
  const [nftToSell, setNftToSell] = useState(null);
  const [nftSellPrice, setNftSellPrice] = useState('');

  // Tokens state
  const [tokens, setTokens] = useState([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [xrpData, setXrpData] = useState(null);

  // NFTs state
  const [collections, setCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [nftPortfolioValue, setNftPortfolioValue] = useState(0);
  const [collectionNfts, setCollectionNfts] = useState([]);
  const [collectionNftsLoading, setCollectionNftsLoading] = useState(false);

  // Transactions state
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txMarker, setTxMarker] = useState(null);
  const [txHasMore, setTxHasMore] = useState(false);
  const txLimit = 20;

  // Offers state
  const [tokenOffers, setTokenOffers] = useState([]);
  const [nftOffers, setNftOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);

  // Withdrawal addresses state
  const [withdrawals, setWithdrawals] = useState([]);
  const [showAddWithdrawal, setShowAddWithdrawal] = useState(false);
  const [newWithdrawal, setNewWithdrawal] = useState({ name: '', address: '', tag: '' });
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState('');

  // Debug info state
  const [debugInfo, setDebugInfo] = useState(null);

  // Account status
  const [isInactive, setIsInactive] = useState(false);

  // Account info & trading stats
  const [accountInfo, setAccountInfo] = useState(null);

  // Activity/History state
  const [historyView, setHistoryView] = useState('tokens');
  const [tokenHistory, setTokenHistory] = useState([]);
  const [tokenHistoryLoading, setTokenHistoryLoading] = useState(false);
  const [tokenHistoryPage, setTokenHistoryPage] = useState(0);
  const [tokenHistoryTotal, setTokenHistoryTotal] = useState(0);
  const [tokenHistoryType, setTokenHistoryType] = useState('all');
  const tokenHistoryLimit = 20;
  const [nftTrades, setNftTrades] = useState([]);
  const [nftTradesLoading, setNftTradesLoading] = useState(false);

  // Performance logging - track initial load
  useEffect(() => {
    if (address) {
      console.log('[Wallet] ========== INITIAL LOAD START ==========');
      console.log('[Wallet] Address:', address);
      console.time('[Wallet] TOTAL INITIAL LOAD');
    }
  }, [address]);

  // Log when all loading states are done
  useEffect(() => {
    if (address && !tokensLoading && !txLoading) {
      console.timeEnd('[Wallet] TOTAL INITIAL LOAD');
      console.log('[Wallet] ========== INITIAL LOAD COMPLETE ==========');
    }
  }, [address, tokensLoading, txLoading]);

  // Debug info loader
  useEffect(() => {
    const loadDebugInfo = async () => {
      if (!accountProfile) {
        setDebugInfo(null);
        return;
      }
      let walletKeyId =
        accountProfile.walletKeyId ||
        (accountProfile.provider && accountProfile.provider_id
          ? `${accountProfile.provider}_${accountProfile.provider_id}`
          : null);
      let seed = accountProfile.seed || null;

      if (
        !seed &&
        (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social')
      ) {
        try {
          const { EncryptedWalletStorage } = await import('src/utils/encryptedWalletStorage');
          const walletStorage = new EncryptedWalletStorage();
          const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
          const storedPassword = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);
          if (storedPassword) {
            const walletData = await walletStorage.getWallet(
              accountProfile.account,
              storedPassword
            );
            seed = walletData?.seed || 'encrypted';
          }
        } catch (e) {
          seed = 'error: ' + e.message;
        }
      }

      if (!seed && accountProfile.wallet_type === 'device') {
        try {
          const { EncryptedWalletStorage, deviceFingerprint } =
            await import('src/utils/encryptedWalletStorage');
          const walletStorage = new EncryptedWalletStorage();
          const deviceKeyId = await deviceFingerprint.getDeviceId();
          walletKeyId = deviceKeyId;
          if (deviceKeyId) {
            const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);
            if (storedPassword) {
              const walletData = await walletStorage.getWallet(
                accountProfile.account,
                storedPassword
              );
              seed = walletData?.seed || 'encrypted';
            }
          }
        } catch (e) {
          seed = 'error: ' + e.message;
        }
      }

      setDebugInfo({
        wallet_type: accountProfile.wallet_type,
        account: accountProfile.account,
        walletKeyId,
        seed: seed || 'N/A'
      });
    };
    loadDebugInfo();
  }, [accountProfile]);

  // Token parsing helper
  const parseTokenLine = (line) => {
    const t = line.token || {};
    const change = t.pro24h ?? 0;
    const displayName = t.name || t.user || 'Unknown';
    const price = t.exch || 0;
    const balance = Math.abs(parseFloat(line.balance || 0));
    return {
      symbol: displayName,
      name: t.user || displayName,
      amount: balance.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
      }),
      rawAmount: balance,
      value: line.value
        ? `${line.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XRP`
        : '0 XRP',
      rawValue: line.value || 0,
      change: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
      positive: change >= 0,
      color: t.color || '#4285f4',
      icon: t.icon || null,
      slug: t.slug || null,
      issuer: line.issuer,
      md5: t.md5 || null,
      // Additional fields
      price: price,
      priceDisplay: price >= 1 ? price.toFixed(4) : price > 0 ? price.toFixed(8).replace(/0+$/, '') : '0',
      vol24h: t.vol24hxrp || t.vol24h || 0,
      marketcap: t.marketcap || 0,
      holders: t.holders || 0,
      trustlines: t.trustlines || 0,
      percentOwned: line.percentOwned || 0,
      verified: t.verified || false,
      kyc: t.kyc || false,
      tags: t.tags || [],
      domain: t.domain || null,
      tvl: t.tvl || 0
    };
  };

  // Transaction parsing helper
  // Decode hex currency to readable name
  const decodeCurrency = (currency) => {
    if (!currency || currency === 'XRP' || currency.length <= 3) return currency;
    if (currency.length === 40 && /^[0-9A-Fa-f]+$/.test(currency)) {
      try {
        const hex = currency.replace(/(00)+$/, '');
        let ascii = '';
        for (let i = 0; i < hex.length; i += 2) {
          const byte = parseInt(hex.substr(i, 2), 16);
          if (byte > 0) ascii += String.fromCharCode(byte);
        }
        return ascii || currency;
      } catch {
        return currency;
      }
    }
    return currency;
  };

  const parseTx = (rawTx) => {
    const tx = rawTx.tx_json || rawTx.tx || rawTx;
    const meta = rawTx.meta || tx.meta;
    const hash = rawTx.hash || tx.hash;
    const type = tx.TransactionType;
    const txResult = meta?.TransactionResult || 'tesSUCCESS';
    const isFailed = txResult !== 'tesSUCCESS';
    // For Payment, check if user is sender (Account) or receiver (Destination)
    const isOutgoing = type === 'Payment'
      ? tx.Account === address && tx.Destination !== address
      : tx.Account === address;
    const isIncoming = type === 'Payment' && tx.Destination === address;
    let label = type;
    let amount = isFailed ? 'Failed' : '';
    let isDust = false;
    let counterparty = null;
    if (isFailed) {
      // Skip amount parsing for failed txs
      counterparty = tx.Account === address ? tx.Destination : tx.Account;
    } else if (type === 'Payment') {
      const delivered = meta?.delivered_amount || tx.DeliverMax || tx.Amount;
      const isSwap = tx.Account === tx.Destination && tx.SendMax;
      const formatAmt = (amt) => {
        if (!amt) return null;
        if (typeof amt === 'string') {
          const xrpAmt = parseInt(amt) / 1000000;
          return xrpAmt < 0.01 ? `${xrpAmt.toFixed(6)} XRP` : `${xrpAmt.toFixed(2)} XRP`;
        } else if (amt?.value) {
          return `${parseFloat(amt.value).toFixed(2)} ${decodeCurrency(amt.currency)}`;
        }
        return null;
      };
      if (isSwap) {
        label = 'Swap';
        const spent = formatAmt(tx.SendMax);
        const received = formatAmt(delivered);
        amount = `${received}`;
      } else {
        if (typeof delivered === 'string') {
          const xrpAmt = parseInt(delivered) / 1000000;
          amount = xrpAmt < 0.01 ? `${xrpAmt.toFixed(6)} XRP` : `${xrpAmt.toFixed(2)} XRP`;
          isDust = isIncoming && xrpAmt < 0.001;
        } else if (delivered?.value) {
          amount = `${parseFloat(delivered.value).toFixed(2)} ${decodeCurrency(delivered.currency)}`;
        }
        label = isIncoming ? 'Received' : 'Sent';
      }
      counterparty = isSwap ? null : (isIncoming ? tx.Account : tx.Destination);
    } else if (type === 'OfferCreate') {
      label = 'Trade';
      counterparty = tx.Account === address ? null : tx.Account;
    } else if (type === 'NFTokenAcceptOffer') {
      const offerNode = meta?.AffectedNodes?.find(
        (n) => (n.DeletedNode || n.ModifiedNode)?.LedgerEntryType === 'NFTokenOffer'
      );
      const offer = offerNode?.DeletedNode?.FinalFields || offerNode?.ModifiedNode?.FinalFields;
      const offerAmt = offer?.Amount;
      const isZeroAmount =
        !offerAmt || offerAmt === '0' || (typeof offerAmt === 'string' && parseInt(offerAmt) === 0);
      if (isZeroAmount) {
        const isSender = offer?.Owner === address;
        label = isSender ? 'Sent NFT' : 'Received NFT';
        amount = 'FREE';
      } else {
        if (typeof offerAmt === 'string') {
          const xrpAmt = parseInt(offerAmt) / 1000000;
          amount = xrpAmt < 0.01 ? `${xrpAmt.toFixed(6)} XRP` : `${xrpAmt.toFixed(2)} XRP`;
        } else if (offerAmt?.value) {
          amount = `${parseFloat(offerAmt.value).toFixed(2)} ${decodeCurrency(offerAmt.currency)}`;
        }
        const isSeller = offer?.Owner === address;
        label = isSeller ? 'Sold NFT' : 'Bought NFT';
      }
      counterparty = offer?.Owner === address ? tx.Account : offer?.Owner;
    } else if (type === 'TrustSet') {
      const limit = tx.LimitAmount;
      const isRemoval = limit?.value === '0';
      label = isRemoval ? 'Remove Trustline' : 'Add Trustline';
      amount = decodeCurrency(limit?.currency);
      counterparty = limit?.issuer;
      // Override type for correct icon
      return {
        id: hash || tx.ctid,
        type: isRemoval ? 'out' : 'in',
        label,
        amount,
        isDust: false,
        time: tx.date ? new Date((tx.date + 946684800) * 1000).toISOString() : '',
        hash,
        counterparty
      };
    } else if (type === 'AMMDeposit' || type === 'AMMWithdraw') {
      label = type === 'AMMDeposit' ? 'AMM Deposit' : 'AMM Withdraw';
      const formatAmt = (amt) => {
        if (!amt) return null;
        if (typeof amt === 'string') {
          const xrpAmt = parseInt(amt) / 1000000;
          return xrpAmt < 0.01 ? `${xrpAmt.toFixed(6)} XRP` : `${xrpAmt.toFixed(2)} XRP`;
        } else if (amt?.value) {
          return `${parseFloat(amt.value).toFixed(2)} ${decodeCurrency(amt.currency)}`;
        }
        return null;
      };
      const amounts = [];
      // For AMMWithdraw, check metadata for actual withdrawn amounts
      if (type === 'AMMWithdraw' && meta?.AffectedNodes) {
        const balanceChanges = [];
        meta.AffectedNodes.forEach((node) => {
          const modified = node.ModifiedNode;
          if (modified?.LedgerEntryType === 'AccountRoot' && modified.FinalFields?.Account === address) {
            const prev = parseInt(modified.PreviousFields?.Balance || 0);
            const final = parseInt(modified.FinalFields?.Balance || 0);
            const diff = final - prev;
            if (diff > 0) balanceChanges.push(formatAmt(String(diff)));
          }
          if (modified?.LedgerEntryType === 'RippleState') {
            const prevBal = parseFloat(modified.PreviousFields?.Balance?.value || 0);
            const finalBal = parseFloat(modified.FinalFields?.Balance?.value || 0);
            const diff = Math.abs(finalBal - prevBal);
            if (diff > 0) {
              const curr = modified.FinalFields?.Balance?.currency;
              balanceChanges.push(`${diff.toFixed(2)} ${decodeCurrency(curr)}`);
            }
          }
        });
        if (balanceChanges.length > 0) amounts.push(...balanceChanges);
      }
      // Fallback to tx fields
      if (amounts.length === 0) {
        const amt1 = formatAmt(tx.Amount);
        const amt2 = formatAmt(tx.Amount2);
        const lpToken = formatAmt(tx.LPTokenOut || tx.LPTokenIn);
        if (amt1) amounts.push(amt1);
        if (amt2) amounts.push(amt2);
        if (lpToken && amounts.length === 0) amounts.push(lpToken);
      }
      amount = amounts.join(' + ') || '';
    } else {
      counterparty = tx.Account === address ? tx.Destination : tx.Account;
    }
    return {
      id: hash || tx.ctid,
      type: isFailed ? 'failed' : (isIncoming ? 'in' : 'out'),
      label,
      amount,
      isDust,
      time: tx.date ? new Date((tx.date + 946684800) * 1000).toISOString() : '',
      hash,
      counterparty
    };
  };

  // Load tokens from API
  useEffect(() => {
    const controller = new AbortController();
    const fetchTokens = async () => {
      if (!address) return;
      setTokensLoading(true);
      setIsInactive(false);
      console.time('[Wallet] fetchTokens');
      try {
        const res = await fetch(
          `${BASE_URL}/api/trustlines/${address}?format=full&sortByValue=true`,
          { signal: controller.signal }
        );
        const data = await res.json();
        console.timeEnd('[Wallet] fetchTokens');
        console.log('[Wallet] fetchTokens: received', data.lines?.length || 0, 'tokens');
        if (data.result === 'success') {
          setXrpData({ ...data.accountData, xrp: data.xrp });
          setTokens(data.lines?.map(parseTokenLine) || []);
          setIsInactive(false);
        } else if (data.error || data.result !== 'success') {
          // Account not found or other error - treat as inactive
          setIsInactive(true);
          setXrpData(null);
          setTokens([]);
        }
      } catch (e) {
        console.timeEnd('[Wallet] fetchTokens');
        if (e.name !== 'AbortError') console.error('Failed to load tokens:', e);
      } finally {
        if (!controller.signal.aborted) setTokensLoading(false);
      }
    };
    fetchTokens();
    return () => controller.abort();
  }, [address]);

  // Load withdrawals from IndexedDB
  useEffect(() => {
    const loadWithdrawals = async () => {
      if (!address) return;
      console.time('[Wallet] loadWithdrawals');
      try {
        const saved = await withdrawalStorage.getAll(address);
        console.timeEnd('[Wallet] loadWithdrawals');
        setWithdrawals(saved);
      } catch (e) {
        console.timeEnd('[Wallet] loadWithdrawals');
        console.error('Failed to load withdrawals:', e);
      }
    };
    loadWithdrawals();
  }, [address]);

  // Load account info (creation date, reserve, objects, trading stats)
  useEffect(() => {
    if (!address) return;
    console.time('[Wallet] fetchAccountInfo');
    fetch(`${BASE_URL}/v1/account/balance/${address}`)
      .then(res => res.json())
      .then(data => {
        console.timeEnd('[Wallet] fetchAccountInfo');
        setAccountInfo(data);
      })
      .catch(() => console.timeEnd('[Wallet] fetchAccountInfo'));
  }, [address]);

  // Load token trading history when trades tab + tokens view
  useEffect(() => {
    if (activeTab !== 'trades' || historyView !== 'tokens' || !address) return;
    setTokenHistoryLoading(true);
    console.time('[Wallet] fetchTokenHistory');
    const url = `${BASE_URL}/v1/history?account=${address}&limit=${tokenHistoryLimit}&page=${tokenHistoryPage}${tokenHistoryType !== 'all' ? `&type=${tokenHistoryType}` : ''}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        console.timeEnd('[Wallet] fetchTokenHistory');
        console.log('[Wallet] fetchTokenHistory: received', data.hists?.length || 0, 'trades');
        setTokenHistory(data.hists || []);
        setTokenHistoryTotal(data.count || data.totalRecords || 0);
      })
      .catch(() => {
        console.timeEnd('[Wallet] fetchTokenHistory');
        setTokenHistory([]);
      })
      .finally(() => setTokenHistoryLoading(false));
  }, [activeTab, historyView, address, tokenHistoryType, tokenHistoryPage]);

  // Load NFT trades when trades tab + nfts view
  useEffect(() => {
    if (activeTab !== 'trades' || historyView !== 'nfts' || !address || nftTrades.length > 0) return;
    setNftTradesLoading(true);
    console.time('[Wallet] fetchNftTrades');
    fetch(`${BASE_URL}/v1/nft/analytics/trader/${address}/trades?limit=50`)
      .then(res => res.json())
      .then(data => {
        console.timeEnd('[Wallet] fetchNftTrades');
        console.log('[Wallet] fetchNftTrades: received', data.trades?.length || 0, 'trades');
        setNftTrades(data.trades || []);
      })
      .catch(() => {
        console.timeEnd('[Wallet] fetchNftTrades');
        setNftTrades([]);
      })
      .finally(() => setNftTradesLoading(false));
  }, [activeTab, historyView, address]);


  // Load recent transactions directly from XRP Ledger node via WebSocket
  useEffect(() => {
    let cancelled = false;
    const fetchTx = async () => {
      if (!address) return;
      setTxLoading(true);
      console.time('[Wallet] fetchTransactions');
      const client = new Client('wss://s1.ripple.com');
      try {
        await client.connect();
        const response = await client.request({
          command: 'account_tx',
          account: address,
          ledger_index_min: -1,
          ledger_index_max: -1,
          limit: txLimit
        });
        console.timeEnd('[Wallet] fetchTransactions');
        if (cancelled) return;
        const txs = response.result?.transactions || [];
        console.log('[Wallet] fetchTransactions: received', txs.length, 'txs');
        setTransactions(txs.map(parseTx));
        setTxMarker(response.result?.marker || null);
        setTxHasMore(!!response.result?.marker);
      } catch (e) {
        console.timeEnd('[Wallet] fetchTransactions');
        if (!cancelled) console.error('Failed to load transactions:', e);
      } finally {
        client.disconnect();
        if (!cancelled) setTxLoading(false);
      }
    };
    fetchTx();
    return () => { cancelled = true; };
  }, [address]);

  // Load NFT collections summary - only when NFTs tab is active
  useEffect(() => {
    if (activeTab !== 'nfts' || !address || collections.length > 0) return;
    const controller = new AbortController();
    const fetchCollections = async () => {
      setCollectionsLoading(true);
      console.time('[Wallet] fetchNftCollections');
      try {
        const res = await fetch(`${BASE_URL}/api/nft/account/${address}/nfts`, {
          signal: controller.signal
        });
        const data = await res.json();
        console.timeEnd('[Wallet] fetchNftCollections');
        console.log('[Wallet] fetchNftCollections: received', data.collections?.length || 0, 'collections');
        if (data.collections) {
          setCollections(
            data.collections.map((col) => ({
              id: col._id,
              name: col.name,
              slug: col.slug,
              count: col.count,
              logo: col.logoImage ? `https://s1.xrpl.to/nft-collection/${col.logoImage}` : '',
              floor: col.floor || 0,
              floor24hAgo: col.floor24hAgo || 0,
              value: col.value || 0
            }))
          );
          setNftPortfolioValue(data.portfolioValue || 0);
        }
      } catch (e) {
        console.timeEnd('[Wallet] fetchNftCollections');
        if (e.name !== 'AbortError') console.error('Failed to load collections:', e);
      } finally {
        if (!controller.signal.aborted) setCollectionsLoading(false);
      }
    };
    fetchCollections();
    return () => controller.abort();
  }, [activeTab, address]);

  // Load offers (DEX + NFT) - only when Offers tab is active
  useEffect(() => {
    if (activeTab !== 'offers' || !address || tokenOffers.length > 0 || nftOffers.length > 0) return;
    const controller = new AbortController();
    const fetchOffers = async () => {
      setOffersLoading(true);
      console.time('[Wallet] fetchOffers (DEX+NFT)');
      try {
        const [dexRes, nftRes] = await Promise.all([
          fetch(`${BASE_URL}/api/account/offers/${address}`, { signal: controller.signal }),
          fetch(`${BASE_URL}/api/nft/account/${address}/offers?limit=50`, {
            signal: controller.signal
          })
        ]);
        const [dexData, nftData] = await Promise.all([dexRes.json(), nftRes.json()]);
        console.timeEnd('[Wallet] fetchOffers (DEX+NFT)');
        console.log('[Wallet] fetchOffers: DEX', dexData.offers?.length || 0, ', NFT', (nftData.offers?.length || 0) + (nftData.incomingOffers?.length || 0));
        if (dexData.result === 'success' && dexData.offers) {
          setTokenOffers(
            dexData.offers.map((offer) => {
              const gets = offer.gets || offer.taker_gets || offer.TakerGets;
              const pays = offer.pays || offer.taker_pays || offer.TakerPays;
              const getsAmt = parseFloat(gets?.value || 0);
              const getsCur = gets?.name || gets?.currency || 'XRP';
              const paysAmt = parseFloat(pays?.value || 0);
              const paysCur = pays?.name || pays?.currency || 'XRP';
              const rate = getsAmt > 0 ? paysAmt / getsAmt : 0;
              const rateDisplay =
                rate > 0
                  ? rate >= 1
                    ? rate.toLocaleString(undefined, { maximumFractionDigits: 4 })
                    : rate.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
                  : '';
              return {
                id: offer.seq || offer.Sequence,
                type: paysCur === 'XRP' ? 'buy' : 'sell',
                from: `${getsAmt.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${getsCur}`,
                to: `${paysAmt.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${paysCur}`,
                rate: rateDisplay ? `${rateDisplay} ${paysCur}/${getsCur}` : '',
                seq: offer.seq || offer.Sequence,
                funded: offer.funded !== false
              };
            })
          );
        }
        const parseNftOffer = (offer, type) => ({
          id: offer._id,
          nftId: offer.NFTokenID,
          name: offer.meta?.name || 'NFT',
          collection: offer.collecion || offer.collection || offer.cslug || '',
          image: offer.files?.[0]?.thumbnail?.small
            ? `https://s1.xrpl.to/nft/${offer.files[0].thumbnail.small}`
            : '',
          price:
            typeof offer.amount === 'number' ? `${(offer.amount / 1000000).toFixed(2)} XRP` : '',
          floor: offer.floor || 0,
          floorDiffPct: offer.floorDiffPct || 0,
          type
        });
        const sellOffers = (nftData.offers || []).map((o) => parseNftOffer(o, 'sell'));
        const buyOffers = (nftData.incomingOffers || []).map((o) => parseNftOffer(o, 'buy'));
        setNftOffers([...sellOffers, ...buyOffers]);
      } catch (e) {
        console.timeEnd('[Wallet] fetchOffers (DEX+NFT)');
        if (e.name !== 'AbortError') console.error('Failed to load offers:', e);
      } finally {
        if (!controller.signal.aborted) setOffersLoading(false);
      }
    };
    fetchOffers();
    return () => controller.abort();
  }, [activeTab, address]);

  // Fetch more tokens when Tokens tab opened
  useEffect(() => {
    if (activeTab !== 'tokens' || !address || tokens.length >= 50) return;
    const controller = new AbortController();
    const fetchMore = async () => {
      setTokensLoading(true);
      console.time('[Wallet] fetchMoreTokens (tab)');
      try {
        const res = await fetch(
          `${BASE_URL}/api/trustlines/${address}?format=full&sortByValue=true&limit=50`,
          { signal: controller.signal }
        );
        const data = await res.json();
        console.timeEnd('[Wallet] fetchMoreTokens (tab)');
        if (data.result === 'success') {
          setXrpData({ ...data.accountData, xrp: data.xrp });
          setTokens(data.lines?.map(parseTokenLine) || []);
        }
      } catch (e) {
        console.timeEnd('[Wallet] fetchMoreTokens (tab)');
        if (e.name !== 'AbortError') console.error('Failed to load more tokens:', e);
      } finally {
        if (!controller.signal.aborted) setTokensLoading(false);
      }
    };
    fetchMore();
    return () => controller.abort();
  }, [activeTab, address]);

  // Fetch more transactions when History tab opened
  useEffect(() => {
    if (activeTab !== 'trades' || !address || transactions.length >= 50) return;
    let cancelled = false;
    const fetchMore = async () => {
      setTxLoading(true);
      console.time('[Wallet] fetchMoreTx (tab)');
      const client = new Client('wss://s1.ripple.com');
      try {
        await client.connect();
        const response = await client.request({
          command: 'account_tx',
          account: address,
          ledger_index_min: -1,
          ledger_index_max: -1,
          limit: 50
        });
        console.timeEnd('[Wallet] fetchMoreTx (tab)');
        if (cancelled) return;
        const txs = response.result?.transactions || [];
        setTransactions(txs.map(parseTx));
        setTxMarker(response.result?.marker || null);
        setTxHasMore(!!response.result?.marker);
      } catch (e) {
        console.timeEnd('[Wallet] fetchMoreTx (tab)');
        if (!cancelled) console.error('Failed to load more transactions:', e);
      } finally {
        client.disconnect();
        if (!cancelled) setTxLoading(false);
      }
    };
    fetchMore();
    return () => { cancelled = true; };
  }, [activeTab, address]);

  // Load NFTs for selected collection (using collection slug endpoint for full data with thumbnails)
  useEffect(() => {
    const fetchCollectionNfts = async () => {
      if (!selectedCollection) {
        setCollectionNfts([]);
        return;
      }
      const col = collections.find((c) => c.name === selectedCollection);
      if (!col?.slug) return;
      setCollectionNftsLoading(true);
      console.time('[Wallet] fetchCollectionNfts');
      try {
        // Use collection endpoint which returns files with thumbnails
        const res = await fetch(
          `${BASE_URL}/api/nft/collections/${col.slug}/nfts?limit=50&skip=0&owner=${address}`
        );
        const data = await res.json();
        console.timeEnd('[Wallet] fetchCollectionNfts');
        console.log('[Wallet] fetchCollectionNfts: received', data.nfts?.length || 0, 'NFTs');
        if (data.nfts) {
          setCollectionNfts(
            data.nfts.map((nft) => ({
              id: nft._id || nft.NFTokenID,
              nftId: nft.NFTokenID || nft._id,
              name: nft.name || nft.meta?.name || 'Unnamed NFT',
              image: getNftCoverUrl(nft, 'large') || '',
              rarity: nft.rarity_rank || 0,
              cost: nft.cost
            }))
          );
        }
      } catch (e) {
        console.timeEnd('[Wallet] fetchCollectionNfts');
        console.error('Failed to load collection NFTs:', e);
      } finally {
        setCollectionNftsLoading(false);
      }
    };
    fetchCollectionNfts();
  }, [address, selectedCollection, collections]);

  // Add withdrawal handler
  const handleAddWithdrawal = async () => {
    if (!newWithdrawal.name.trim() || !newWithdrawal.address.trim()) {
      setWithdrawalError('Name and address are required');
      return;
    }
    // Basic XRPL address validation
    if (!newWithdrawal.address.startsWith('r') || newWithdrawal.address.length < 25) {
      setWithdrawalError('Invalid XRPL address');
      return;
    }
    setWithdrawalLoading(true);
    setWithdrawalError('');
    try {
      const added = await withdrawalStorage.add(address, newWithdrawal);
      setWithdrawals((prev) => [added, ...prev]);
      setNewWithdrawal({ name: '', address: '', tag: '' });
      setShowAddWithdrawal(false);
    } catch (e) {
      console.error('Withdrawal save error:', e);
      setWithdrawalError(e.message || 'Failed to save withdrawal address');
    } finally {
      setWithdrawalLoading(false);
    }
  };

  // Delete withdrawal handler
  const handleDeleteWithdrawal = async (id) => {
    try {
      await withdrawalStorage.remove(id);
      setWithdrawals((prev) => prev.filter((w) => w.id !== id));
      setDeleteConfirmId(null);
    } catch (e) {
      console.error('Failed to delete withdrawal:', e);
    }
  };

  // Computed tokens list with XRP at top
  const xrpToken = xrpData
    ? (() => {
        const x = xrpData.xrp || {};
        const bal = parseFloat(x.balance || xrpData.balance || 0);
        const change = x.pro24h ?? 0;
        return {
          symbol: 'XRP',
          name: 'XRP',
          amount: bal.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
          }),
          rawAmount: bal,
          value: `${bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} XRP`,
          rawValue: x.value || bal,
          change: change ? `${change >= 0 ? '+' : ''}${change.toFixed(1)}%` : '',
          positive: change >= 0,
          color: '#23292F',
          icon: '◎',
          slug: 'xrpl-xrp',
          md5: x.md5 || '84e5efeb89c4eae8f68188982dc290d8'
        };
      })()
    : null;
  const allTokens = xrpToken ? [xrpToken, ...tokens] : tokens;
  const totalValue = allTokens.reduce((sum, t) => sum + (t.rawValue || 0), 0);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Wallet },
    { id: 'tokens', label: 'Tokens', icon: () => <span className="text-xs">◎</span> },
    { id: 'nfts', label: 'NFTs', icon: Image },
    { id: 'offers', label: 'Offers', icon: RotateCcw },
    { id: 'trades', label: 'History', icon: TrendingUp },
    { id: 'withdrawals', label: 'Withdrawals', icon: Building2 }
  ];

  return (
    <>
      <Head>
        <title>Wallet | XRPL.to</title>
      </Head>

      <Header />

      {!address ? (
        <div
          className={cn(
            'min-h-[calc(100vh-64px)] flex items-center justify-center',
            isDark ? 'bg-black' : 'bg-gray-50'
          )}
        >
          <div
            className={cn(
              'text-center p-10 rounded-xl max-w-md',
              isDark
                ? 'bg-white/[0.04] border border-white/[0.15]'
                : 'bg-white border border-gray-200'
            )}
          >
            <div
              className={cn(
                'w-20 h-20 rounded-xl flex items-center justify-center mx-auto mb-6',
                isDark ? 'bg-blue-500/10' : 'bg-blue-50'
              )}
            >
              <Wallet size={36} className="text-blue-500" />
            </div>
            <h2
              className={cn('text-xl font-medium mb-3', isDark ? 'text-white/90' : 'text-gray-900')}
            >
              Connect Wallet
            </h2>
            <p
              className={cn(
                'text-[13px] mb-8 leading-relaxed',
                isDark ? 'text-white/50' : 'text-gray-500'
              )}
            >
              Manage your tokens, NFTs, offers, and transaction history all in one place
            </p>
            <button
              onClick={() => setOpenWalletModal(true)}
              className="w-full py-4 rounded-lg text-[13px] font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              Connect Wallet
            </button>
            <p className={cn('text-[11px] mt-4', isDark ? 'text-white/25' : 'text-gray-400')}>
              Secure • Non-custodial • Encrypted locally
            </p>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'min-h-screen',
            isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
          )}
        >
          <div className="max-w-[1920px] mx-auto w-full px-4 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1
                className={cn(
                  'text-[13px] font-medium',
                  isDark ? 'text-white/90' : 'text-gray-900'
                )}
              >
                Wallet
              </h1>
              <div className="flex items-center gap-2">
                {isInactive && (
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400"
                    title="Fund with 1 XRP to activate"
                  >
                    Inactive
                  </span>
                )}
                <button
                  onClick={() => handleCopy(address)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-mono transition-colors duration-150',
                    copied
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : isDark
                        ? 'bg-white/[0.04] text-white/50 hover:bg-blue-500/5 hover:text-blue-400'
                        : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  )}
                >
                  <div
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      isInactive ? 'bg-amber-400/60' : 'bg-emerald-400'
                    )}
                  />
                  {address?.slice(0, 8)}...{address?.slice(-6)}
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold tracking-widest rounded-lg transition-all whitespace-nowrap',
                    activeTab === tab.id
                      ? cn(isDark ? 'bg-white/[0.08] text-white' : 'bg-gray-100 text-gray-900')
                      : cn(
                          isDark
                            ? 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        )
                  )}
                >
                  <tab.icon size={14} strokeWidth={activeTab === tab.id ? 2 : 1.5} />
                  {tab.label.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Send/Receive Modal */}
            {showPanel && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <div
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  onClick={() => setShowPanel(null)}
                />

                {/* Modal */}
                <div
                  className={cn(
                    'relative w-full max-w-md rounded-2xl overflow-hidden',
                    isDark
                      ? 'bg-[#09090b] border-[1.5px] border-white/15'
                      : 'bg-white border border-gray-200'
                  )}
                >
                  {/* Header with Tabs */}
                  <div
                    className={cn(
                      'flex items-center justify-between p-4 border-b',
                      isDark ? 'border-white/[0.08]' : 'border-gray-100'
                    )}
                  >
                    <div
                      className={cn(
                        'flex p-1 rounded-lg',
                        isDark ? 'bg-white/[0.03]' : 'bg-gray-100'
                      )}
                    >
                      <button
                        onClick={() => setShowPanel('send')}
                        className={cn(
                          'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                          showPanel === 'send'
                            ? 'bg-blue-500 text-white'
                            : isDark
                              ? 'text-white/50 hover:text-white/80'
                              : 'text-gray-500 hover:text-gray-700'
                        )}
                      >
                        <ArrowUpRight size={15} /> Send
                      </button>
                      <button
                        onClick={() => setShowPanel('receive')}
                        className={cn(
                          'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                          showPanel === 'receive'
                            ? 'bg-emerald-500 text-white'
                            : isDark
                              ? 'text-white/50 hover:text-white/80'
                              : 'text-gray-500 hover:text-gray-700'
                        )}
                      >
                        <ArrowDownLeft size={15} /> Receive
                      </button>
                    </div>
                    <button
                      onClick={() => setShowPanel(null)}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        isDark
                          ? 'text-white/40 hover:text-white/70 hover:bg-white/5'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Content */}
                  {showPanel === 'send' ? (
                    <div className="p-5">
                      {/* Amount Section */}
                      {/* Token Selector - Embedded */}
                      <div
                        className={cn(
                          'rounded-xl mb-4 overflow-hidden',
                          isDark
                            ? 'bg-white/[0.02] border border-white/[0.08]'
                            : 'bg-gray-50 border border-gray-100'
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setTokenDropdownOpen(!tokenDropdownOpen)}
                          className={cn(
                            'w-full flex items-center justify-between px-4 py-3 transition-colors',
                            isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-100/50'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {(() => {
                              const t = allTokens.find((t) => t.symbol === selectedToken);
                              return t?.md5 ? (
                                <img
                                  src={`https://s1.xrpl.to/token/${t.md5}`}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                                  style={{ background: t?.color || '#333' }}
                                >
                                  {t?.icon || selectedToken[0]}
                                </div>
                              );
                            })()}
                            <div className="text-left">
                              <p
                                className={cn(
                                  'text-sm font-medium',
                                  isDark ? 'text-white' : 'text-gray-900'
                                )}
                              >
                                {selectedToken}
                              </p>
                              <p
                                className={cn(
                                  'text-[11px]',
                                  isDark ? 'text-white/40' : 'text-gray-500'
                                )}
                              >
                                Tap to change token
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p
                                className={cn(
                                  'text-[10px] uppercase',
                                  isDark ? 'text-white/40' : 'text-gray-500'
                                )}
                              >
                                Balance
                              </p>
                              <p
                                className={cn(
                                  'text-sm font-medium tabular-nums',
                                  isDark ? 'text-white/80' : 'text-gray-700'
                                )}
                              >
                                {allTokens.find((t) => t.symbol === selectedToken)?.amount || '0'}
                              </p>
                            </div>
                            <ChevronDown
                              size={18}
                              className={cn(
                                'transition-transform duration-200',
                                tokenDropdownOpen && 'rotate-180',
                                isDark ? 'text-white/30' : 'text-gray-400'
                              )}
                            />
                          </div>
                        </button>
                        {tokenDropdownOpen && (
                          <div
                            className={cn(
                              'border-t max-h-[160px] overflow-y-auto',
                              isDark ? 'border-white/[0.08]' : 'border-gray-100'
                            )}
                          >
                            {allTokens.map((t) => (
                              <button
                                key={t.symbol}
                                type="button"
                                onClick={() => {
                                  setSelectedToken(t.symbol);
                                  setTokenDropdownOpen(false);
                                }}
                                className={cn(
                                  'w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors',
                                  selectedToken === t.symbol
                                    ? isDark
                                      ? 'bg-blue-500/10'
                                      : 'bg-blue-50'
                                    : '',
                                  isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-100/50'
                                )}
                              >
                                {t.md5 ? (
                                  <img
                                    src={`https://s1.xrpl.to/token/${t.md5}`}
                                    alt=""
                                    className="w-7 h-7 rounded-full object-cover shrink-0"
                                  />
                                ) : (
                                  <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                                    style={{ background: t.color }}
                                  >
                                    {t.icon || t.symbol[0]}
                                  </div>
                                )}
                                <span
                                  className={cn(
                                    'text-sm font-medium flex-1',
                                    isDark ? 'text-white/90' : 'text-gray-900'
                                  )}
                                >
                                  {t.symbol}
                                </span>
                                <span
                                  className={cn(
                                    'text-xs tabular-nums',
                                    isDark ? 'text-white/40' : 'text-gray-500'
                                  )}
                                >
                                  {t.amount}
                                </span>
                                {selectedToken === t.symbol && (
                                  <Check size={16} className="text-blue-500" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Amount Input */}
                      <div
                        className={cn(
                          'rounded-xl p-4 mb-4',
                          isDark ? 'bg-white/[0.02]' : 'bg-gray-50'
                        )}
                      >
                        <input
                          type="text"
                          inputMode="decimal"
                          value={sendAmount}
                          onChange={(e) => setSendAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                          placeholder="0"
                          className={cn(
                            'w-full text-4xl font-semibold bg-transparent outline-none tabular-nums text-center py-3',
                            isDark
                              ? 'text-white placeholder:text-white/15'
                              : 'text-gray-900 placeholder:text-gray-300'
                          )}
                        />
                        {(() => {
                          const amt = parseFloat(sendAmount) || 0;
                          const token = allTokens.find((t) => t.symbol === selectedToken);
                          const pricePerToken =
                            token?.rawAmount > 0 ? token.rawValue / token.rawAmount : 0;
                          const valueInXrp = amt * pricePerToken;
                          const displayValue =
                            activeFiatCurrency === 'XRP' ? valueInXrp : valueInXrp / exchRate;
                          const symbol = currencySymbols[activeFiatCurrency] || '$';
                          return (
                            <p
                              className={cn(
                                'text-xs text-center mb-3',
                                isDark ? 'text-white/30' : 'text-gray-400'
                              )}
                            >
                              ≈ {symbol}
                              {displayValue.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}{' '}
                              {activeFiatCurrency}
                            </p>
                          );
                        })()}

                        {/* Quick Amount Buttons */}
                        <div className="flex items-center justify-center gap-1.5">
                          {[25, 50, 75, 100].map((pct) => {
                            const maxAmt =
                              allTokens.find((t) => t.symbol === selectedToken)?.rawAmount || 0;
                            return (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => setSendAmount(((maxAmt * pct) / 100).toFixed(2))}
                                className={cn(
                                  'px-3 py-1 rounded-md text-[11px] font-medium transition-colors',
                                  isDark
                                    ? 'bg-white/[0.05] text-white/60 hover:bg-white/[0.1] hover:text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-200 border border-gray-200'
                                )}
                              >
                                {pct === 100 ? 'MAX' : `${pct}%`}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Recipient */}
                      <div className="mb-3">
                        <label
                          className={cn(
                            'text-[10px] font-semibold uppercase tracking-wider mb-1.5 block',
                            isDark ? 'text-white/40' : 'text-gray-500'
                          )}
                        >
                          Recipient
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={sendTo}
                            onChange={(e) => setSendTo(e.target.value)}
                            placeholder="rAddress..."
                            className={cn(
                              'w-full pl-3 pr-9 py-2.5 rounded-xl text-sm font-mono outline-none transition-all duration-150',
                              isDark
                                ? 'bg-white/[0.03] text-white border placeholder:text-white/25'
                                : 'bg-gray-50 border placeholder:text-gray-400',
                              sendTo && sendTo.startsWith('r') && sendTo.length >= 25
                                ? isDark
                                  ? 'border-emerald-500/50'
                                  : 'border-emerald-400'
                                : sendTo
                                  ? isDark
                                    ? 'border-amber-500/50'
                                    : 'border-amber-400'
                                  : isDark
                                    ? 'border-white/[0.15] focus:border-blue-500/50'
                                    : 'border-gray-200 focus:border-blue-400'
                            )}
                          />
                          {sendTo && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {sendTo.startsWith('r') && sendTo.length >= 25 ? (
                                <Check size={14} className="text-emerald-500" />
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Destination Tag */}
                      <div className="mb-4">
                        <label
                          className={cn(
                            'text-[10px] font-semibold uppercase tracking-wider mb-1.5 block',
                            isDark ? 'text-white/40' : 'text-gray-500'
                          )}
                        >
                          Destination Tag{' '}
                          <span className={isDark ? 'text-white/20' : 'text-gray-400'}>
                            (optional)
                          </span>
                        </label>
                        <input
                          type="text"
                          value={sendTag}
                          onChange={(e) => setSendTag(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 12345678"
                          className={cn(
                            'w-full px-3 py-2.5 rounded-xl text-sm font-mono outline-none transition-colors duration-150',
                            isDark
                              ? 'bg-white/[0.03] text-white border border-white/[0.15] placeholder:text-white/25 focus:border-blue-500/50'
                              : 'bg-gray-50 border border-gray-200 placeholder:text-gray-400 focus:border-blue-400'
                          )}
                        />
                      </div>

                      {/* Fee Display */}
                      <div
                        className={cn(
                          'flex items-center justify-between py-2.5 px-3 rounded-lg mb-4 text-xs',
                          isDark ? 'bg-white/[0.02] text-white/50' : 'bg-gray-50 text-gray-500'
                        )}
                      >
                        <span>Network Fee</span>
                        <span className="font-medium">~0.00001 XRP</span>
                      </div>

                      {/* Send Button */}
                      <button
                        disabled={
                          !sendTo || !sendAmount || !(sendTo.startsWith('r') && sendTo.length >= 25)
                        }
                        className={cn(
                          'w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200',
                          sendTo && sendAmount && sendTo.startsWith('r') && sendTo.length >= 25
                            ? 'bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98]'
                            : isDark
                              ? 'bg-white/5 text-white/30 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        )}
                      >
                        <Send size={15} /> Send {sendAmount || '0'} {selectedToken}
                      </button>
                    </div>
                  ) : (
                    <div className="p-5">
                      <div className="flex flex-col items-center">
                        {/* QR Code */}
                        <div className="p-3 bg-white rounded-xl mb-4">
                          <QRCode value={address} size={160} />
                        </div>

                        {/* Address Display */}
                        <div
                          className={cn(
                            'w-full rounded-xl p-3 mb-4',
                            isDark ? 'bg-white/[0.03]' : 'bg-gray-50'
                          )}
                        >
                          <p
                            className={cn(
                              'font-mono text-[11px] text-center break-all leading-relaxed',
                              isDark ? 'text-white/70' : 'text-gray-600'
                            )}
                          >
                            {address}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() => handleCopy(address)}
                            className={cn(
                              'flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200',
                              copied
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : 'bg-emerald-500 text-white hover:bg-emerald-600'
                            )}
                          >
                            {copied ? <Check size={15} /> : <Copy size={15} />}{' '}
                            {copied ? 'Copied!' : 'Copy Address'}
                          </button>
                          <button
                            onClick={() => {
                              if (navigator.share) {
                                navigator.share({ title: 'My XRP Address', text: address });
                              } else {
                                handleCopy(address);
                              }
                            }}
                            className={cn(
                              'px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                              isDark
                                ? 'bg-white/[0.05] text-white/60 hover:bg-white/[0.08]'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            )}
                          >
                            <ExternalLink size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Portfolio Header - Single Row */}
                <div
                  className={cn(
                    'rounded-xl p-5 flex flex-wrap items-center gap-6',
                    isDark ? 'bg-black/50 border border-white/[0.15]' : 'bg-white border border-gray-200'
                  )}
                >
                  {/* Portfolio Value */}
                  <div className="flex items-center gap-4">
                    <div>
                      <p className={cn('text-[10px] font-bold uppercase tracking-widest mb-1', isDark ? 'text-white/50' : 'text-gray-500')}>Portfolio</p>
                      <p className={cn('text-3xl font-bold tabular-nums tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
                        {tokensLoading ? '...' : `${(totalValue + nftPortfolioValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        <span className={cn('text-lg font-semibold ml-1.5', isDark ? 'text-white/50' : 'text-gray-400')}>XRP</span>
                      </p>
                    </div>
                    {isInactive && <span className="text-[10px] px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 font-semibold">Inactive</span>}
                  </div>

                  <div className={cn('w-px h-10 hidden sm:block', isDark ? 'bg-white/10' : 'bg-gray-200')} />

                  {/* XRP Balance */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#23292F] flex items-center justify-center text-white text-[10px] font-bold">✕</div>
                    <div>
                      <p className={cn('text-[10px] font-semibold uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-500')}>XRP</p>
                      <p className={cn('text-sm font-semibold tabular-nums', isDark ? 'text-white' : 'text-gray-900')}>{xrpToken ? xrpToken.amount : '0.00'}</p>
                    </div>
                  </div>

                  <div className={cn('w-px h-10 hidden sm:block', isDark ? 'bg-white/10' : 'bg-gray-200')} />

                  {/* Tokens */}
                  <div>
                    <p className={cn('text-[10px] font-semibold uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-500')}>Tokens</p>
                    <p className={cn('text-sm font-semibold tabular-nums', isDark ? 'text-white' : 'text-gray-900')}>
                      {allTokens.length} <span className={cn('font-normal', isDark ? 'text-white/50' : 'text-gray-500')}>· {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XRP</span>
                    </p>
                  </div>

                  <div className={cn('w-px h-10 hidden sm:block', isDark ? 'bg-white/10' : 'bg-gray-200')} />

                  {/* NFTs */}
                  <div>
                    <p className={cn('text-[10px] font-semibold uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-500')}>NFTs</p>
                    <p className={cn('text-sm font-semibold tabular-nums', isDark ? 'text-white' : 'text-gray-900')}>
                      {collections.reduce((sum, c) => sum + c.count, 0)} <span className={cn('font-normal', isDark ? 'text-white/50' : 'text-gray-500')}>· {nftPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XRP</span>
                    </p>
                  </div>

                  {/* Actions - pushed to right */}
                  <div className="flex gap-2 ml-auto">
                    <button onClick={() => setShowPanel('send')} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                      <ArrowUpRight size={14} /> Send
                    </button>
                    <button onClick={() => setShowPanel('receive')} className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors', isDark ? 'bg-white/[0.05] text-white/80 hover:bg-white/[0.08]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
                      <ArrowDownLeft size={14} /> Receive
                    </button>
                    <Link href="/watchlist" className={cn('flex items-center justify-center w-9 h-9 rounded-lg transition-colors', isDark ? 'bg-white/[0.05] text-white/60 hover:bg-white/[0.08] hover:text-amber-400' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-amber-500')} title="Watchlist">
                      <Star size={16} />
                    </Link>
                  </div>
                </div>

                {/* Account Stats Row */}
                {accountInfo && (
                  <div className={cn('flex flex-wrap items-center gap-x-6 gap-y-2 px-1 text-[11px]', isDark ? 'text-white/40' : 'text-gray-500')}>
                    {accountInfo.inception && (
                      <span>Created <span className={isDark ? 'text-white/70' : 'text-gray-700'}>{new Date(accountInfo.inception).toLocaleDateString()}</span></span>
                    )}
                    {accountInfo.reserve > 0 && (
                      <span>Reserve <span className={isDark ? 'text-white/70' : 'text-gray-700'}>{accountInfo.reserve} XRP</span></span>
                    )}
                    {accountInfo.ownerCount > 0 && (
                      <span>Objects <span className={isDark ? 'text-white/70' : 'text-gray-700'}>{accountInfo.ownerCount}</span></span>
                    )}
                    {accountInfo.rank && (
                      <span>Rank <span className={isDark ? 'text-white/70' : 'text-gray-700'}>#{accountInfo.rank.toLocaleString()}</span></span>
                    )}
                    {(accountInfo.pnl !== undefined || accountInfo.dex_profit !== undefined) && (
                      <span>P&L <span className={((accountInfo.pnl || accountInfo.dex_profit || 0) >= 0) ? 'text-emerald-500' : 'text-red-500'}>
                        {((accountInfo.pnl || accountInfo.dex_profit || 0) >= 0 ? '+' : '')}{(accountInfo.pnl || accountInfo.dex_profit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} XRP
                      </span></span>
                    )}
                    {accountInfo.roi !== undefined && (
                      <span>ROI <span className={(accountInfo.roi >= 0) ? 'text-emerald-500' : 'text-red-500'}>
                        {accountInfo.roi >= 0 ? '+' : ''}{accountInfo.roi.toFixed(1)}%
                      </span></span>
                    )}
                  </div>
                )}

                {/* Main Content Grid - Symmetrical 2 columns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left Column - Assets */}
                  <div className="space-y-4">
                    {/* Token Holdings */}
                    <div
                      className={cn(
                        'rounded-xl h-full flex flex-col',
                        isDark
                          ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]'
                          : 'bg-white border border-gray-200'
                      )}
                    >
                      <div className={cn("flex items-center justify-between px-4 py-3 border-b border-l-2 border-l-blue-500/50", isDark ? "border-b-white/[0.08]" : "border-b-gray-100")}>
                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              'text-[11px] font-bold uppercase tracking-wider',
                              isDark ? 'text-white/70' : 'text-gray-600'
                            )}
                          >
                            Top Assets
                          </p>
                          <span
                            className={cn(
                              'text-[9px] px-1.5 py-0.5 rounded font-semibold',
                              isDark ? 'bg-blue-500/10 text-blue-400/70' : 'bg-blue-50 text-blue-500'
                            )}
                          >
                            {allTokens.length}
                          </span>
                        </div>
                        <button
                          onClick={() => handleTabChange('tokens')}
                          className={cn(
                            'text-[10px] font-medium uppercase tracking-wide transition-colors',
                            isDark
                              ? 'text-blue-400 hover:text-blue-300'
                              : 'text-blue-500 hover:text-blue-600'
                          )}
                        >
                          View All
                        </button>
                      </div>
                      {tokensLoading ? (
                        <div className={cn('p-6 text-center', isDark ? 'text-white/40' : 'text-gray-400')}>Loading...</div>
                      ) : allTokens.length === 0 ? (
                        <div className={cn('p-8 text-center', isDark ? 'text-white/35' : 'text-gray-400')}>
                          <div className={cn("w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center", isDark ? "bg-white/[0.04] border border-white/[0.08]" : "bg-gray-50 border border-gray-100")}>
                            <Coins size={20} className={cn(isDark ? "text-blue-400/50" : "text-blue-400")} />
                          </div>
                          <p className={cn('text-[11px] font-semibold tracking-wide mb-1', isDark ? 'text-white/50' : 'text-gray-500')}>No Tokens Yet</p>
                          <p className={cn('text-[10px] mb-3', isDark ? 'text-white/30' : 'text-gray-400')}>Start building your portfolio</p>
                          <a href="/" className={cn("inline-flex items-center gap-1.5 text-[10px] font-medium px-3 py-1.5 rounded-lg transition-colors", isDark ? "text-blue-400 bg-blue-500/10 hover:bg-blue-500/20" : "text-blue-500 bg-blue-50 hover:bg-blue-100")}>Browse tokens</a>
                        </div>
                      ) : (
                        <>
                          {/* Table Header */}
                          <div className={cn("grid grid-cols-[minmax(120px,1fr)_120px_140px_100px_70px_60px] gap-3 px-4 py-2 text-[9px] font-semibold uppercase tracking-wider", isDark ? "text-white/30 border-b border-white/[0.08]" : "text-gray-400 border-b border-gray-100")}>
                            <span>Token</span>
                            <span className="text-right">Balance</span>
                            <span className="text-right">Price</span>
                            <span className="text-right">Value</span>
                            <span className="text-right">24h</span>
                            <span></span>
                          </div>
                          {/* Table Body */}
                          <div className={cn("divide-y", isDark ? "divide-white/5" : "divide-gray-50")}>
                            {allTokens.slice(0, 8).map((token) => (
                              <div key={token.symbol} className={cn("grid grid-cols-[minmax(120px,1fr)_120px_140px_100px_70px_60px] gap-3 items-center px-4 py-2.5 transition-colors", isDark ? "hover:bg-white/[0.04]" : "hover:bg-gray-50")}>
                                {/* Token */}
                                <div className="flex items-center gap-2 min-w-0">
                                  {token.md5 ? (
                                    <img src={`https://s1.xrpl.to/token/${token.md5}`} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ background: token.color }}>{token.icon || token.symbol[0]}</div>
                                  )}
                                  <div className="min-w-0">
                                    <p className={cn("text-xs font-medium truncate", isDark ? "text-white/90" : "text-gray-900")}>{token.symbol}</p>
                                    {token.holders > 0 && <p className={cn("text-[9px]", isDark ? "text-white/30" : "text-gray-400")}>{token.holders.toLocaleString()} holders</p>}
                                  </div>
                                </div>
                                {/* Balance */}
                                <div className="text-right">
                                  <p className={cn("text-[11px] tabular-nums truncate", isDark ? "text-white/70" : "text-gray-700")}>{token.amount}</p>
                                  {token.percentOwned > 0 && <p className={cn("text-[9px] tabular-nums", isDark ? "text-white/30" : "text-gray-400")}>{token.percentOwned.toFixed(2)}%</p>}
                                </div>
                                {/* Price */}
                                <p className={cn("text-[11px] tabular-nums text-right", isDark ? "text-white/50" : "text-gray-500")}>{token.symbol === 'XRP' ? '--' : <>{token.priceDisplay} <span className={isDark ? "text-white/25" : "text-gray-400"}>XRP</span></>}</p>
                                {/* Value */}
                                <p className={cn("text-xs font-semibold tabular-nums text-right tracking-tight", isDark ? "text-white" : "text-gray-900")}>{token.value}</p>
                                {/* 24h Change */}
                                <p className={cn("text-[11px] tabular-nums text-right font-medium", token.positive ? "text-emerald-500" : "text-red-400")}>{token.change}</p>
                                {/* Send */}
                                <button onClick={() => { setSelectedToken(token.symbol); setShowPanel('send'); }} className={cn("flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all justify-self-end border", isDark ? "text-blue-300/80 border-blue-500/20 hover:text-blue-300 hover:border-blue-500/40 hover:bg-blue-500/10" : "text-blue-500 border-blue-200 hover:border-blue-300 hover:bg-blue-50")}>
                                  <Send size={10} /> Send
                                </button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Column - NFTs & Watchlist */}
                  <div className="space-y-4">
                    {/* NFT Collections */}
                    <div
                      className={cn(
                        'rounded-xl h-full flex flex-col',
                        isDark
                          ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]'
                          : 'bg-white border border-gray-200'
                      )}
                    >
                      <div className={cn("flex items-center justify-between px-4 py-3 border-b border-l-2 border-l-blue-500/50", isDark ? "border-b-white/[0.08]" : "border-b-gray-100")}>
                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              'text-[11px] font-bold uppercase tracking-wider',
                              isDark ? 'text-white/70' : 'text-gray-600'
                            )}
                          >
                            NFT Collections
                          </p>
                          <span
                            className={cn(
                              'text-[9px] px-1.5 py-0.5 rounded font-semibold',
                              isDark ? 'bg-blue-500/10 text-blue-400/70' : 'bg-blue-50 text-blue-500'
                            )}
                          >
                            {collections.length}
                          </span>
                        </div>
                        <button
                          onClick={() => handleTabChange('nfts')}
                          className={cn(
                            'text-[10px] font-medium uppercase tracking-wide transition-colors',
                            isDark
                              ? 'text-blue-400 hover:text-blue-300'
                              : 'text-blue-500 hover:text-blue-600'
                          )}
                        >
                          View All
                        </button>
                      </div>
                      {collectionsLoading ? (
                        <div className={cn('p-6 text-center min-h-[300px] flex items-center justify-center', isDark ? 'text-white/40' : 'text-gray-400')}>Loading...</div>
                      ) : collections.length === 0 ? (
                        <div className={cn('flex flex-col items-center justify-center min-h-[300px] p-8', isDark ? 'text-white/35' : 'text-gray-400')}>
                          <div className={cn("w-14 h-14 mb-4 rounded-xl flex items-center justify-center", isDark ? "bg-white/[0.04] border border-white/[0.08]" : "bg-gray-50 border border-gray-100")}>
                            <Image size={24} className={cn(isDark ? "text-blue-400/50" : "text-blue-400")} />
                          </div>
                          <p className={cn('text-[11px] font-semibold tracking-wide mb-1', isDark ? 'text-white/50' : 'text-gray-500')}>No NFTs Yet</p>
                          <p className={cn('text-[10px] mb-4 max-w-[200px] text-center', isDark ? 'text-white/30' : 'text-gray-400')}>Start your collection by exploring NFT marketplaces on XRPL</p>
                          <a href="/nfts" className="px-4 py-2 rounded-lg text-[11px] font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors">Browse NFTs</a>
                        </div>
                      ) : (
                        <>
                          {/* Table Header */}
                          <div className={cn("grid grid-cols-[1fr_80px_80px_80px] gap-2 px-4 py-2 text-[9px] font-semibold uppercase tracking-wider", isDark ? "text-white/30 border-b border-white/[0.08]" : "text-gray-400 border-b border-gray-100")}>
                            <span>Collection</span>
                            <span className="text-right">Items</span>
                            <span className="text-right">Floor</span>
                            <span className="text-right">Value</span>
                          </div>
                          {/* Table Body */}
                          <div className={cn("divide-y", isDark ? "divide-white/5" : "divide-gray-50")}>
                            {collections.slice(0, 8).map((col) => (
                              <button
                                key={col.id}
                                onClick={() => { setSelectedCollection(col.name); handleTabChange('nfts'); }}
                                className={cn("w-full grid grid-cols-[1fr_80px_80px_80px] gap-2 items-center px-4 py-2.5 text-left transition-colors", isDark ? "hover:bg-white/[0.04]" : "hover:bg-gray-50")}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {col.logo ? (
                                    <img src={col.logo} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
                                  ) : (
                                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-[9px] shrink-0", isDark ? "bg-white/5 text-white/30" : "bg-gray-100 text-gray-400")}>NFT</div>
                                  )}
                                  <p className={cn("text-xs font-medium truncate", isDark ? "text-white/90" : "text-gray-900")}>{col.name}</p>
                                </div>
                                <p className={cn("text-[11px] tabular-nums text-right", isDark ? "text-white/60" : "text-gray-600")}>{col.count}</p>
                                <p className={cn("text-[11px] tabular-nums text-right", isDark ? "text-white/50" : "text-gray-500")}>{col.floor} <span className={isDark ? "text-white/25" : "text-gray-400"}>XRP</span></p>
                                <p className={cn("text-[11px] font-medium tabular-nums text-right", isDark ? "text-white/80" : "text-gray-800")}>{col.value.toLocaleString()} <span className={cn("font-normal", isDark ? "text-white/25" : "text-gray-400")}>XRP</span></p>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Activity - Full Width */}
                <div
                  className={cn(
                    'rounded-xl mt-4',
                    isDark
                      ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]'
                      : 'bg-white border border-gray-200'
                  )}
                >
                  <div className={cn("flex items-center justify-between px-4 py-3 border-b border-l-2 border-l-blue-500/50", isDark ? "border-b-white/[0.08]" : "border-b-gray-100")}>
                    <p
                      className={cn(
                        'text-[11px] font-bold uppercase tracking-wider',
                        isDark ? 'text-white/70' : 'text-gray-600'
                      )}
                    >
                      Recent Activity
                    </p>
                    <button
                      onClick={() => handleTabChange('trades')}
                      className={cn(
                        'text-[10px] font-medium uppercase tracking-wide transition-colors',
                        isDark
                          ? 'text-blue-400 hover:text-blue-300'
                          : 'text-blue-500 hover:text-blue-600'
                      )}
                    >
                      View All
                    </button>
                  </div>
                                    {txLoading ? (
                                      <div
                                        className={cn('p-8 text-center', isDark ? 'text-white/40' : 'text-gray-400')}
                                      >
                                        Loading...
                                      </div>
                                    ) : transactions.length === 0 ? (
                                      <div
                                        className={cn('p-6 text-center', isDark ? 'text-white/35' : 'text-gray-400')}
                                      >
                                        <div className="relative w-12 h-12 mx-auto mb-3">
                                          <div
                                            className={cn(
                                              'absolute -top-0.5 left-0.5 w-4 h-4 rounded-full',
                                              isDark ? 'bg-[#4285f4]' : 'bg-blue-400'
                                            )}
                                          />
                                          <div
                                            className={cn(
                                              'absolute -top-0.5 right-0.5 w-4 h-4 rounded-full',
                                              isDark ? 'bg-[#4285f4]' : 'bg-blue-400'
                                            )}
                                          />
                                          <div
                                            className={cn(
                                              'absolute top-0.5 left-1.5 w-2 h-2 rounded-full',
                                              isDark ? 'bg-[#3b78e7]' : 'bg-blue-500/70'
                                            )}
                                          />
                                          <div
                                            className={cn(
                                              'absolute top-0.5 right-1.5 w-2 h-2 rounded-full',
                                              isDark ? 'bg-[#3b78e7]' : 'bg-blue-500/70'
                                            )}
                                          />
                                          <div
                                            className={cn(
                                              'absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full',
                                              isDark ? 'bg-[#4285f4]' : 'bg-blue-400'
                                            )}
                                          >
                                            <div className="absolute top-3 left-2 w-1.5 h-1 rounded-full bg-[#0a0a0a] rotate-[-10deg]" />
                                            <div className="absolute top-3 right-2 w-1.5 h-1 rounded-full bg-[#0a0a0a] rotate-[10deg]" />
                                            <div
                                              className={cn(
                                                'absolute bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-2 rounded-full',
                                                isDark ? 'bg-[#5a9fff]' : 'bg-blue-300'
                                              )}
                                            >
                                              <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1 rounded-full bg-[#0a0a0a]" />
                                            </div>
                                            <div
                                              className={cn(
                                                'absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-1 rounded-t-full border-t border-l border-r',
                                                isDark ? 'border-[#0a0a0a]' : 'border-blue-600'
                                              )}
                                            />
                                          </div>
                                          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 flex flex-col justify-start gap-[2px] pointer-events-none overflow-hidden rounded-full">
                                            {[...Array(8)].map((_, i) => (
                                              <div
                                                key={i}
                                                className={cn(
                                                  'h-[2px] w-full',
                                                  isDark ? 'bg-[#0a0a0a]/40' : 'bg-white/40'
                                                )}
                                              />
                                            ))}
                                          </div>
                                        </div>
                                        <p
                                          className={cn(
                                            'text-[10px] font-medium tracking-wider mb-1',
                                            isDark ? 'text-white/60' : 'text-gray-500'
                                          )}
                                        >
                                          NO RECENT ACTIVITY
                                        </p>
                                      </div>
                                    ) : (
                                      <>
                                        {/* Table Header */}
                                        <div className={cn("grid grid-cols-[40px_minmax(100px,1fr)_180px_140px_120px_36px] gap-3 px-4 py-2 text-[9px] font-semibold uppercase tracking-wider", isDark ? "text-white/30 border-b border-white/[0.08]" : "text-gray-400 border-b border-gray-100")}>
                                          <span></span>
                                          <span>Type</span>
                                          <span>Counterparty</span>
                                          <span className="text-right">Amount</span>
                                          <span className="text-right">Date</span>
                                          <span></span>
                                        </div>
                                        {/* Table Body */}
                                        <div className={cn("divide-y", isDark ? "divide-white/5" : "divide-gray-50")}>
                                          {transactions.slice(0, 6).map((tx) => (
                                            <div
                                              key={tx.id}
                                              className={cn("grid grid-cols-[40px_minmax(100px,1fr)_180px_140px_120px_36px] gap-3 items-center px-4 py-2.5 transition-colors", isDark ? "hover:bg-white/[0.04]" : "hover:bg-gray-50")}
                                            >
                                              {/* Icon */}
                                              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", tx.type === 'failed' ? 'bg-amber-500/10' : tx.type === 'in' ? 'bg-emerald-500/10' : 'bg-red-500/10')}>
                                                {tx.type === 'failed' ? <AlertTriangle size={14} className="text-amber-500" /> : tx.type === 'in' ? <ArrowDownLeft size={14} className="text-emerald-500" /> : <ArrowUpRight size={14} className="text-red-400" />}
                                              </div>
                                              {/* Type */}
                                              <div className="min-w-0">
                                                <p className={cn("text-xs font-medium", isDark ? "text-white/90" : "text-gray-900")}>
                                                  {tx.label}
                                                  {tx.isDust && <span className={cn("ml-2 text-[9px] px-1 py-0.5 rounded font-medium", isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-100 text-amber-600")}>Dust</span>}
                                                </p>
                                              </div>
                                              {/* Counterparty */}
                                              {tx.counterparty ? (
                                                <Link
                                                  href={`/address/${tx.counterparty}`}
                                                  className={cn("text-[11px] font-mono truncate hover:underline", isDark ? "text-white/50 hover:text-blue-400" : "text-gray-500 hover:text-blue-500")}
                                                >
                                                  {`${tx.counterparty.slice(0, 10)}...${tx.counterparty.slice(-8)}`}
                                                </Link>
                                              ) : (
                                                <span className={cn("text-[11px] font-mono", isDark ? "text-white/50" : "text-gray-500")}>—</span>
                                              )}
                                              {/* Amount */}
                                              <p className={cn("text-[11px] font-medium tabular-nums text-right", isDark ? "text-white/80" : "text-gray-800")}>{tx.amount || '—'}</p>
                                              {/* Date */}
                                              <p className={cn("text-[11px] tabular-nums text-right", isDark ? "text-white/40" : "text-gray-500")}>{tx.time ? new Date(tx.time).toLocaleDateString() : '—'}</p>
                                              {/* Link */}
                                              <a href={`/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className={cn("justify-self-end p-1 rounded transition-colors", isDark ? "text-white/30 hover:text-blue-400" : "text-gray-400 hover:text-blue-500")}>
                                                <ExternalLink size={12} />
                                              </a>
                                            </div>
                                          ))}
                                        </div>
                                      </>
                                    )}
                                  </div>
              </div>
            )}

            {/* Tokens Tab - Full Token Management */}
            {activeTab === 'tokens' &&
              (() => {
                const filteredTokens = allTokens
                  .filter((t) => {
                    if (
                      tokenSearch &&
                      !t.symbol.toLowerCase().includes(tokenSearch.toLowerCase()) &&
                      !t.name.toLowerCase().includes(tokenSearch.toLowerCase())
                    )
                      return false;
                    if (hideZeroBalance && t.rawAmount === 0) return false;
                    return true;
                  })
                  .sort((a, b) => {
                    if (tokenSort === 'name') return a.symbol.localeCompare(b.symbol);
                    if (tokenSort === 'change') return parseFloat(b.change) - parseFloat(a.change);
                    return (b.rawValue || 0) - (a.rawValue || 0);
                  });

                return (
                  <div className="space-y-4">
                    {/* Search & Filter Bar */}
                    <div
                      className={cn(
                        'rounded-xl p-4',
                        isDark
                          ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]'
                          : 'bg-white border border-gray-200'
                      )}
                    >
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="flex-1 relative">
                          <Search
                            size={16}
                            className={cn(
                              'absolute left-3 top-1/2 -translate-y-1/2',
                              isDark ? 'text-blue-400' : 'text-blue-500'
                            )}
                          />
                          <input
                            type="text"
                            value={tokenSearch}
                            onChange={(e) => setTokenSearch(e.target.value)}
                            placeholder="Search tokens..."
                            className={cn(
                              'w-full pl-10 pr-4 py-2.5 rounded-lg text-[13px] outline-none transition-colors duration-150',
                              isDark
                                ? 'bg-white/[0.04] text-white border border-white/[0.15] placeholder:text-white/30 focus:border-blue-500/40'
                                : 'bg-gray-50 border border-gray-200 placeholder:text-gray-400 focus:border-blue-400'
                            )}
                          />
                        </div>
                        {/* Sort */}
                        <div className="flex items-center gap-2">
                          <select
                            value={tokenSort}
                            onChange={(e) => setTokenSort(e.target.value)}
                            className={cn(
                              'px-3 py-2.5 rounded-lg text-[13px] outline-none transition-colors duration-150',
                              isDark
                                ? 'bg-[#1a1a1a] text-white border border-white/[0.15] [&>option]:bg-[#1a1a1a]'
                                : 'bg-gray-50 border border-gray-200'
                            )}
                          >
                            <option value="value">Sort by Value</option>
                            <option value="name">Sort by Name</option>
                            <option value="change">Sort by 24h Change</option>
                          </select>
                          <button
                            onClick={() => setHideZeroBalance(!hideZeroBalance)}
                            className={cn(
                              'p-2.5 rounded-lg transition-colors duration-150',
                              hideZeroBalance
                                ? 'bg-blue-500 text-white'
                                : isDark
                                  ? 'bg-white/[0.04] text-white/50 hover:bg-blue-500/5 hover:text-blue-400'
                                  : 'bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                            )}
                            title={hideZeroBalance ? 'Show zero balances' : 'Hide zero balances'}
                          >
                            {hideZeroBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <span
                          className={cn('text-[11px]', isDark ? 'text-white/35' : 'text-gray-400')}
                        >
                          {tokensLoading
                            ? 'Loading...'
                            : `${filteredTokens.length} of ${allTokens.length} tokens`}
                        </span>
                        {tokenSearch && (
                          <button
                            onClick={() => setTokenSearch('')}
                            className={cn(
                              'text-[11px] transition-colors',
                              isDark
                                ? 'text-blue-400 hover:text-blue-300'
                                : 'text-blue-500 hover:text-blue-600'
                            )}
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Token List */}
                    <div
                      className={cn(
                        'rounded-xl overflow-hidden',
                        isDark
                          ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]'
                          : 'bg-white border border-gray-200'
                      )}
                    >
                      {/* Table Header */}
                      <div className={cn("grid grid-cols-[2fr_1fr_1fr_1fr_100px_100px_100px_100px] gap-4 px-5 py-2.5 text-[9px] uppercase tracking-wider font-semibold border-b", isDark ? "text-white/40 border-white/[0.08] bg-white/[0.02]" : "text-gray-500 border-gray-100 bg-gray-50")}>
                        <div>Asset</div>
                        <div className="text-right">Balance</div>
                        <div className="text-right">Price</div>
                        <div className="text-right">Value</div>
                        <div className="text-right">24h</div>
                        <div className="text-right">Vol 24h</div>
                        <div className="text-right">Holders</div>
                        <div className="text-right"></div>
                      </div>

                      {/* Token Rows */}
                      {filteredTokens.length === 0 ? (
                        <div
                          className={cn(
                            'p-6 text-center',
                            isDark ? 'text-white/35' : 'text-gray-400'
                          )}
                        >
                          <div className="relative w-12 h-12 mx-auto mb-3">
                            <div
                              className={cn(
                                'absolute -top-0.5 left-0.5 w-4 h-4 rounded-full',
                                isDark ? 'bg-[#4285f4]' : 'bg-blue-400'
                              )}
                            />
                            <div
                              className={cn(
                                'absolute -top-0.5 right-0.5 w-4 h-4 rounded-full',
                                isDark ? 'bg-[#4285f4]' : 'bg-blue-400'
                              )}
                            />
                            <div
                              className={cn(
                                'absolute top-0.5 left-1.5 w-2 h-2 rounded-full',
                                isDark ? 'bg-[#3b78e7]' : 'bg-blue-500/70'
                              )}
                            />
                            <div
                              className={cn(
                                'absolute top-0.5 right-1.5 w-2 h-2 rounded-full',
                                isDark ? 'bg-[#3b78e7]' : 'bg-blue-500/70'
                              )}
                            />
                            <div
                              className={cn(
                                'absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full',
                                isDark ? 'bg-[#4285f4]' : 'bg-blue-400'
                              )}
                            >
                              <div className="absolute top-3 left-2 w-1.5 h-1 rounded-full bg-[#0a0a0a] rotate-[-10deg]" />
                              <div className="absolute top-3 right-2 w-1.5 h-1 rounded-full bg-[#0a0a0a] rotate-[10deg]" />
                              <div
                                className={cn(
                                  'absolute bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-2 rounded-full',
                                  isDark ? 'bg-[#5a9fff]' : 'bg-blue-300'
                                )}
                              >
                                <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1 rounded-full bg-[#0a0a0a]" />
                              </div>
                              <div
                                className={cn(
                                  'absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-1 rounded-t-full border-t border-l border-r',
                                  isDark ? 'border-[#0a0a0a]' : 'border-blue-600'
                                )}
                              />
                            </div>
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 flex flex-col justify-start gap-[2px] pointer-events-none overflow-hidden rounded-full">
                              {[...Array(8)].map((_, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    'h-[2px] w-full',
                                    isDark ? 'bg-[#0a0a0a]/40' : 'bg-white/40'
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                          <p
                            className={cn(
                              'text-[10px] font-medium tracking-wider mb-1',
                              isDark ? 'text-white/60' : 'text-gray-500'
                            )}
                          >
                            NO TOKENS FOUND
                          </p>
                          <a href="/" className="text-[9px] text-blue-400 hover:underline">
                            Browse tokens
                          </a>
                        </div>
                      ) : (
                        <div className={cn("divide-y", isDark ? "divide-white/5" : "divide-gray-50")}>
                          {filteredTokens.slice((tokenPage - 1) * tokensPerPage, tokenPage * tokensPerPage).map((token) => (
                            <div key={token.symbol} className={cn("grid grid-cols-[2fr_1fr_1fr_1fr_100px_100px_100px_100px] gap-4 px-5 py-3 items-center transition-colors", isDark ? "hover:bg-white/[0.04]" : "hover:bg-gray-50")}>
                              {/* Asset */}
                              <div className="flex items-center gap-2.5 min-w-0">
                                {token.md5 ? (
                                  <img src={`https://s1.xrpl.to/token/${token.md5}`} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: token.color }}>{token.icon || token.symbol[0]}</div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className={cn("text-xs font-medium truncate", isDark ? "text-white/90" : "text-gray-900")}>{token.symbol}</p>
                                    {token.verified && <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-500">✓</span>}
                                  </div>
                                  <p className={cn("text-[10px] truncate", isDark ? "text-white/35" : "text-gray-500")}>{token.name}</p>
                                </div>
                              </div>
                              {/* Balance */}
                              <div className="text-right">
                                <p className={cn("text-[11px] tabular-nums", isDark ? "text-white/70" : "text-gray-700")}>{token.amount}</p>
                                {token.percentOwned > 0 && <p className={cn("text-[9px] tabular-nums", isDark ? "text-white/30" : "text-gray-400")}>{token.percentOwned.toFixed(2)}% supply</p>}
                              </div>
                              {/* Price */}
                              <p className={cn("text-[11px] tabular-nums text-right", isDark ? "text-white/50" : "text-gray-500")}>{token.symbol === 'XRP' ? '--' : <>{token.priceDisplay} <span className={isDark ? "text-white/25" : "text-gray-400"}>XRP</span></>}</p>
                              {/* Value */}
                              <p className={cn("text-xs font-semibold tabular-nums text-right tracking-tight", isDark ? "text-white" : "text-gray-900")}>{token.value}</p>
                              {/* 24h */}
                              <p className={cn("text-[11px] tabular-nums text-right font-medium", token.positive ? "text-emerald-500" : "text-red-400")}>{token.change}</p>
                              {/* Vol 24h */}
                              <p className={cn("text-[11px] tabular-nums text-right", isDark ? "text-white/40" : "text-gray-500")}>{token.vol24h > 0 ? `${token.vol24h >= 1000 ? `${(token.vol24h/1000).toFixed(1)}K` : token.vol24h.toFixed(0)}` : '—'}</p>
                              {/* Holders */}
                              <p className={cn("text-[11px] tabular-nums text-right", isDark ? "text-white/40" : "text-gray-500")}>{token.holders > 0 ? token.holders.toLocaleString() : '—'}</p>
                              {/* Actions */}
                              <div className="flex items-center justify-end gap-1.5">
                                {token.slug && <Link href={`/token/${token.slug}`} className={cn("p-1.5 rounded-md transition-colors border", isDark ? "text-white/40 border-white/10 hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-500/10" : "text-gray-400 border-gray-200 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50")}><ArrowRightLeft size={12} /></Link>}
                                <button onClick={() => { setSelectedToken(token.symbol); setShowPanel('send'); setActiveTab('overview'); }} className={cn("flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all border", isDark ? "text-blue-300/80 border-blue-500/20 hover:text-blue-300 hover:border-blue-500/40 hover:bg-blue-500/10" : "text-blue-500 border-blue-200 hover:border-blue-300 hover:bg-blue-50")}><Send size={10} /> Send</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pagination */}
                    {filteredTokens.length > tokensPerPage && (
                      <div
                        className={cn(
                          'rounded-xl p-3 flex items-center justify-between',
                          isDark
                            ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]'
                            : 'bg-white border border-gray-200'
                        )}
                      >
                        <span
                          className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-gray-500')}
                        >
                          Showing {(tokenPage - 1) * tokensPerPage + 1}-
                          {Math.min(tokenPage * tokensPerPage, filteredTokens.length)} of{' '}
                          {filteredTokens.length}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setTokenPage((p) => Math.max(1, p - 1))}
                            disabled={tokenPage === 1}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-30',
                              isDark
                                ? 'bg-white/[0.04] text-white/70 hover:bg-white/[0.08]'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            )}
                          >
                            Prev
                          </button>
                          {Array.from(
                            { length: Math.ceil(filteredTokens.length / tokensPerPage) },
                            (_, i) => i + 1
                          )
                            .slice(Math.max(0, tokenPage - 3), tokenPage + 2)
                            .map((p) => (
                              <button
                                key={p}
                                onClick={() => setTokenPage(p)}
                                className={cn(
                                  'w-8 h-8 rounded-lg text-[11px] font-medium transition-colors',
                                  p === tokenPage
                                    ? 'bg-blue-500 text-white'
                                    : isDark
                                      ? 'bg-white/[0.04] text-white/70 hover:bg-white/[0.08]'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                )}
                              >
                                {p}
                              </button>
                            ))}
                          <button
                            onClick={() =>
                              setTokenPage((p) =>
                                Math.min(Math.ceil(filteredTokens.length / tokensPerPage), p + 1)
                              )
                            }
                            disabled={tokenPage >= Math.ceil(filteredTokens.length / tokensPerPage)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-30',
                              isDark
                                ? 'bg-white/[0.04] text-white/70 hover:bg-white/[0.08]'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            )}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

            {/* Offers Tab */}
            {activeTab === 'offers' && (
              <div className="space-y-4">
                {offersLoading ? (
                  <div
                    className={cn(
                      'p-8 text-center rounded-xl',
                      isDark
                        ? 'bg-white/[0.04] border border-white/[0.15] text-white/40'
                        : 'bg-white border border-gray-200 text-gray-400'
                    )}
                  >
                    Loading...
                  </div>
                ) : (
                  <>
                    {/* DEX Offers */}
                    <div
                      className={cn(
                        'rounded-xl',
                        isDark
                          ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]'
                          : 'bg-white border border-gray-200'
                      )}
                    >
                      <div className="p-4 border-b border-white/[0.15] flex items-center gap-2">
                        <RotateCcw
                          size={14}
                          className={isDark ? 'text-blue-400' : 'text-blue-500'}
                        />
                        <p
                          className={cn(
                            'text-[11px] font-semibold uppercase tracking-[0.15em]',
                            isDark ? 'text-blue-400' : 'text-blue-500'
                          )}
                        >
                          DEX Offers
                        </p>
                        <span
                          className={cn(
                            'ml-auto text-[9px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide',
                            isDark
                              ? 'bg-white/5 text-white/50 border border-white/[0.15]'
                              : 'bg-gray-100 text-gray-500'
                          )}
                        >
                          {tokenOffers.length}
                        </span>
                      </div>
                      {tokenOffers.length === 0 ? (
                        <div
                          className={cn(
                            'p-6 text-center',
                            isDark ? 'text-white/35' : 'text-gray-400'
                          )}
                        >
                          <div className="relative w-12 h-12 mx-auto mb-3">
                            <div
                              className={cn(
                                'absolute -top-0.5 left-0.5 w-4 h-4 rounded-full',
                                isDark ? 'bg-[#4285f4]' : 'bg-blue-400'
                              )}
                            />
                            <div
                              className={cn(
                                'absolute -top-0.5 right-0.5 w-4 h-4 rounded-full',
                                isDark ? 'bg-[#4285f4]' : 'bg-blue-400'
                              )}
                            />
                            <div
                              className={cn(
                                'absolute top-0.5 left-1.5 w-2 h-2 rounded-full',
                                isDark ? 'bg-[#3b78e7]' : 'bg-blue-500/70'
                              )}
                            />
                            <div
                              className={cn(
                                'absolute top-0.5 right-1.5 w-2 h-2 rounded-full',
                                isDark ? 'bg-[#3b78e7]' : 'bg-blue-500/70'
                              )}
                            />
                            <div
                              className={cn(
                                'absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full',
                                isDark ? 'bg-[#4285f4]' : 'bg-blue-400'
                              )}
                            >
                              <div className="absolute top-3 left-2 w-1.5 h-1 rounded-full bg-[#0a0a0a] rotate-[-10deg]" />
                              <div className="absolute top-3 right-2 w-1.5 h-1 rounded-full bg-[#0a0a0a] rotate-[10deg]" />
                              <div
                                className={cn(
                                  'absolute bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-2 rounded-full',
                                  isDark ? 'bg-[#5a9fff]' : 'bg-blue-300'
                                )}
                              >
                                <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1 rounded-full bg-[#0a0a0a]" />
                              </div>
                              <div
                                className={cn(
                                  'absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-1 rounded-t-full border-t border-l border-r',
                                  isDark ? 'border-[#0a0a0a]' : 'border-blue-600'
                                )}
                              />
                            </div>
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 flex flex-col justify-start gap-[2px] pointer-events-none overflow-hidden rounded-full">
                              {[...Array(8)].map((_, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    'h-[2px] w-full',
                                    isDark ? 'bg-[#0a0a0a]/40' : 'bg-white/40'
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                          <p
                            className={cn(
                              'text-[10px] font-medium tracking-wider',
                              isDark ? 'text-white/60' : 'text-gray-500'
                            )}
                          >
                            NO OPEN DEX OFFERS
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-blue-500/5">
                          {tokenOffers.map((offer) => (
                            <div
                              key={offer.id}
                              className={cn(
                                'flex items-center gap-3 px-3 py-2.5 transition-all duration-150',
                                isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'
                              )}
                            >
                              <div
                                className={cn(
                                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                                  offer.type === 'buy' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                                )}
                              >
                                {offer.type === 'buy' ? (
                                  <ArrowDownLeft size={16} className="text-emerald-500" />
                                ) : (
                                  <ArrowUpRight size={16} className="text-red-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p
                                    className={cn(
                                      'text-[13px] font-medium',
                                      isDark ? 'text-white/90' : 'text-gray-900'
                                    )}
                                  >
                                    {offer.from} → {offer.to}
                                  </p>
                                  {!offer.funded && (
                                    <span
                                      className={cn(
                                        'text-[9px] px-1 py-0.5 rounded font-medium',
                                        isDark
                                          ? 'bg-amber-500/10 text-amber-400'
                                          : 'bg-amber-100 text-amber-600'
                                      )}
                                    >
                                      Unfunded
                                    </span>
                                  )}
                                </div>
                                <p
                                  className={cn(
                                    'text-[10px]',
                                    isDark ? 'text-white/35' : 'text-gray-400'
                                  )}
                                >
                                  Rate: {offer.rate} • Seq: {offer.seq}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* NFT Offers */}
                    <div
                      className={cn(
                        'rounded-xl',
                        isDark
                          ? 'bg-black/40 backdrop-blur-sm border border-gray-500/20'
                          : 'bg-white border border-gray-200'
                      )}
                    >
                      <div className="p-4 border-b border-gray-500/20 flex items-center gap-2">
                        <Image size={14} className={isDark ? 'text-white/50' : 'text-gray-500'} />
                        <p
                          className={cn(
                            'text-[11px] font-semibold uppercase tracking-[0.15em]',
                            isDark ? 'text-white/50' : 'text-gray-500'
                          )}
                        >
                          NFT Offers
                        </p>
                        <span
                          className={cn(
                            'ml-auto text-[9px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide',
                            isDark
                              ? 'bg-white/5 text-white/50 border border-white/[0.15]'
                              : 'bg-gray-100 text-gray-500'
                          )}
                        >
                          {nftOffers.length}
                        </span>
                      </div>
                      {nftOffers.length === 0 ? (
                        <div
                          className={cn(
                            'p-6 text-center',
                            isDark ? 'text-white/35' : 'text-gray-400'
                          )}
                        >
                          <div className="relative w-12 h-12 mx-auto mb-3">
                            <div
                              className={cn(
                                'absolute -top-0.5 left-0.5 w-4 h-4 rounded-full',
                                isDark ? 'bg-[#4285f4]' : 'bg-blue-400'
                              )}
                            />
                            <div
                              className={cn(
                                'absolute -top-0.5 right-0.5 w-4 h-4 rounded-full',
                                isDark ? 'bg-[#4285f4]' : 'bg-blue-400'
                              )}
                            />
                            <div
                              className={cn(
                                'absolute top-0.5 left-1.5 w-2 h-2 rounded-full',
                                isDark ? 'bg-[#3b78e7]' : 'bg-blue-500/70'
                              )}
                            />
                            <div
                              className={cn(
                                'absolute top-0.5 right-1.5 w-2 h-2 rounded-full',
                                isDark ? 'bg-[#3b78e7]' : 'bg-blue-500/70'
                              )}
                            />
                            <div
                              className={cn(
                                'absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full',
                                isDark ? 'bg-[#4285f4]' : 'bg-blue-400'
                              )}
                            >
                              <div className="absolute top-3 left-2 w-1.5 h-1 rounded-full bg-[#0a0a0a] rotate-[-10deg]" />
                              <div className="absolute top-3 right-2 w-1.5 h-1 rounded-full bg-[#0a0a0a] rotate-[10deg]" />
                              <div
                                className={cn(
                                  'absolute bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-2 rounded-full',
                                  isDark ? 'bg-[#5a9fff]' : 'bg-blue-300'
                                )}
                              >
                                <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1 rounded-full bg-[#0a0a0a]" />
                              </div>
                              <div
                                className={cn(
                                  'absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-1 rounded-t-full border-t border-l border-r',
                                  isDark ? 'border-[#0a0a0a]' : 'border-blue-600'
                                )}
                              />
                            </div>
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 flex flex-col justify-start gap-[2px] pointer-events-none overflow-hidden rounded-full">
                              {[...Array(8)].map((_, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    'h-[2px] w-full',
                                    isDark ? 'bg-[#0a0a0a]/40' : 'bg-white/40'
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                          <p
                            className={cn(
                              'text-[10px] font-medium tracking-wider',
                              isDark ? 'text-white/60' : 'text-gray-500'
                            )}
                          >
                            NO NFT OFFERS
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-500/20">
                          {nftOffers.map((offer) => (
                            <Link
                              key={offer.id}
                              href={`/nft/${offer.nftId}`}
                              className={cn(
                                'flex items-center gap-4 px-4 py-3 transition-all duration-150',
                                isDark
                                  ? 'bg-black/40 backdrop-blur-sm hover:bg-white/[0.03]'
                                  : 'bg-white hover:bg-gray-50'
                              )}
                            >
                              {offer.image ? (
                                <img
                                  src={offer.image}
                                  alt={offer.name}
                                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                                />
                              ) : (
                                <div
                                  className={cn(
                                    'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                                    isDark ? 'bg-white/5' : 'bg-gray-100'
                                  )}
                                >
                                  <Image
                                    size={16}
                                    className={isDark ? 'text-white/30' : 'text-gray-400'}
                                  />
                                </div>
                              )}
                              <div className="w-[180px] min-w-0 shrink-0">
                                <p
                                  className={cn(
                                    'text-[13px] font-medium truncate',
                                    isDark ? 'text-white/90' : 'text-gray-900'
                                  )}
                                >
                                  {offer.name}
                                </p>
                                <p
                                  className={cn(
                                    'text-[10px] truncate',
                                    isDark ? 'text-white/40' : 'text-gray-400'
                                  )}
                                >
                                  {offer.collection}
                                </p>
                              </div>
                              <div className="flex-1 flex items-center justify-between">
                                <div className="text-center px-3">
                                  <p
                                    className={cn(
                                      'text-[10px] uppercase tracking-wide mb-0.5',
                                      isDark ? 'text-white/30' : 'text-gray-400'
                                    )}
                                  >
                                    Price
                                  </p>
                                  <p
                                    className={cn(
                                      'text-[13px] font-medium tabular-nums',
                                      isDark ? 'text-white/90' : 'text-gray-900'
                                    )}
                                  >
                                    {offer.price}
                                  </p>
                                </div>
                                <div className="text-center px-3">
                                  <p
                                    className={cn(
                                      'text-[10px] uppercase tracking-wide mb-0.5',
                                      isDark ? 'text-white/30' : 'text-gray-400'
                                    )}
                                  >
                                    Floor
                                  </p>
                                  <p
                                    className={cn(
                                      'text-[13px] font-medium tabular-nums',
                                      isDark ? 'text-white/90' : 'text-gray-900'
                                    )}
                                  >
                                    {offer.floor > 0 ? `${offer.floor.toFixed(2)} XRP` : '-'}
                                  </p>
                                </div>
                                <div className="text-center px-3">
                                  <p
                                    className={cn(
                                      'text-[10px] uppercase tracking-wide mb-0.5',
                                      isDark ? 'text-white/30' : 'text-gray-400'
                                    )}
                                  >
                                    vs Floor
                                  </p>
                                  <p
                                    className={cn(
                                      'text-[13px] font-medium tabular-nums',
                                      offer.floorDiffPct >= 0 ? 'text-emerald-500' : 'text-red-400'
                                    )}
                                  >
                                    {offer.floor > 0
                                      ? `${offer.floorDiffPct >= 0 ? '+' : ''}${offer.floorDiffPct.toFixed(0)}%`
                                      : '-'}
                                  </p>
                                </div>
                                <div className="text-center px-3">
                                  <p
                                    className={cn(
                                      'text-[10px] uppercase tracking-wide mb-0.5',
                                      isDark ? 'text-white/30' : 'text-gray-400'
                                    )}
                                  >
                                    Type
                                  </p>
                                  <span
                                    className={cn(
                                      'text-[11px] px-2 py-0.5 rounded font-medium',
                                      offer.type === 'sell'
                                        ? 'bg-red-500/10 text-red-400'
                                        : 'bg-emerald-500/10 text-emerald-500'
                                    )}
                                  >
                                    {offer.type === 'sell' ? 'Sell' : 'Buy'}
                                  </span>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'trades' && (
              <div
                className={cn(
                  'rounded-xl',
                  isDark
                    ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]'
                    : 'bg-white border border-gray-200'
                )}
              >
                {/* View Toggle */}
                <div className={cn('flex items-center gap-1 p-2 border-b', isDark ? 'border-white/[0.15]' : 'border-gray-200')}>
                  {['tokens', 'nfts', 'onchain'].map((view) => (
                    <button
                      key={view}
                      onClick={() => setHistoryView(view)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors',
                        historyView === view
                          ? isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'
                          : isDark ? 'text-white/50 hover:text-white/70' : 'text-gray-500 hover:text-gray-700'
                      )}
                    >
                      {view === 'tokens' ? 'Tokens' : view === 'nfts' ? 'NFTs' : 'On-chain'}
                    </button>
                  ))}
                </div>

                {/* Tokens View */}
                {historyView === 'tokens' && (
                  <>
                    {/* Type Filter */}
                    <div className={cn('flex items-center gap-2 px-4 py-2 border-b', isDark ? 'border-white/[0.08]' : 'border-gray-100')}>
                      {['all', 'buy', 'sell'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setTokenHistoryType(type)}
                          className={cn(
                            'px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors',
                            tokenHistoryType === type
                              ? type === 'buy' ? 'bg-emerald-500/10 text-emerald-500'
                                : type === 'sell' ? 'bg-red-500/10 text-red-400'
                                : isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-500'
                              : isDark ? 'text-white/40 hover:text-white/60' : 'text-gray-400 hover:text-gray-600'
                          )}
                        >
                          {type === 'all' ? 'All' : type === 'buy' ? 'Buys' : 'Sells'}
                        </button>
                      ))}
                    </div>
                    {tokenHistoryLoading ? (
                      <div className={cn('p-8 text-center text-[11px]', isDark ? 'text-white/40' : 'text-gray-400')}>Loading...</div>
                    ) : tokenHistory.length === 0 ? (
                      <div className={cn('p-8 text-center text-[11px]', isDark ? 'text-white/40' : 'text-gray-400')}>No token trades</div>
                    ) : (
                      <>
                        <div className={cn('grid grid-cols-[40px_1.5fr_1fr_1fr_1fr_40px] gap-3 px-4 py-2 text-[9px] uppercase tracking-wider font-semibold border-b', isDark ? 'text-white/40 border-white/[0.08]' : 'text-gray-500 border-gray-100')}>
                          <div></div>
                          <div>Token</div>
                          <div className="text-right">Amount</div>
                          <div className="text-right">Price</div>
                          <div className="text-right">Time</div>
                          <div></div>
                        </div>
                        <div className={cn('divide-y', isDark ? 'divide-white/5' : 'divide-gray-50')}>
                          {tokenHistory.map((trade, i) => {
                            const isBuy = trade.paid?.currency === 'XRP';
                            const tokenData = isBuy ? trade.got : trade.paid;
                            const xrpData = isBuy ? trade.paid : trade.got;
                            const tokenAmount = Math.abs(parseFloat(tokenData?.value || 0));
                            const xrpAmount = Math.abs(parseFloat(xrpData?.value || 0));
                            const price = tokenAmount > 0 ? xrpAmount / tokenAmount : 0;
                            const tokenName = tokenData?.currency?.length === 40
                              ? Buffer.from(tokenData.currency, 'hex').toString('utf8').replace(/\x00/g, '')
                              : tokenData?.currency || 'Unknown';
                            return (
                              <div key={trade.hash || i} className={cn('grid grid-cols-[40px_1.5fr_1fr_1fr_1fr_40px] gap-3 px-4 py-2.5 items-center', isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50')}>
                                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', isBuy ? 'bg-emerald-500/10' : 'bg-red-500/10')}>
                                  {isBuy ? <ArrowDownLeft size={14} className="text-emerald-500" /> : <ArrowUpRight size={14} className="text-red-400" />}
                                </div>
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={cn('text-[12px] font-medium truncate', isDark ? 'text-white/90' : 'text-gray-900')}>{tokenName}</span>
                                </div>
                                <p className={cn('text-[11px] tabular-nums text-right', isBuy ? 'text-emerald-500' : 'text-red-400')}>
                                  {isBuy ? '+' : '-'}{tokenAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}
                                </p>
                                <p className={cn('text-[11px] tabular-nums text-right', isDark ? 'text-white/60' : 'text-gray-600')}>
                                  {price > 0 ? price.toFixed(6) : '—'} XRP
                                </p>
                                <p className={cn('text-[10px] tabular-nums text-right', isDark ? 'text-white/40' : 'text-gray-400')}>
                                  {trade.time ? new Date(trade.time).toLocaleString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}) : '—'}
                                </p>
                                <a href={`/tx/${trade.hash}`} target="_blank" rel="noopener noreferrer" className={cn('p-1 rounded transition-colors', isDark ? 'text-white/30 hover:text-blue-400' : 'text-gray-400 hover:text-blue-500')}>
                                  <ExternalLink size={12} />
                                </a>
                              </div>
                            );
                          })}
                        </div>
                        {/* Pagination */}
                        {tokenHistoryTotal > tokenHistoryLimit && (
                          <div className={cn('flex items-center justify-center gap-2 p-3 border-t', isDark ? 'border-white/[0.08]' : 'border-gray-100')}>
                            <button
                              onClick={() => setTokenHistoryPage(p => p - 1)}
                              disabled={tokenHistoryPage === 0 || tokenHistoryLoading}
                              className={cn('px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors', tokenHistoryPage === 0 ? 'opacity-30 cursor-not-allowed' : '', isDark ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                            >
                              Prev
                            </button>
                            <span className={cn('text-[11px]', isDark ? 'text-white/50' : 'text-gray-500')}>
                              {tokenHistoryPage + 1} / {Math.ceil(tokenHistoryTotal / tokenHistoryLimit)}
                            </span>
                            <button
                              onClick={() => setTokenHistoryPage(p => p + 1)}
                              disabled={(tokenHistoryPage + 1) * tokenHistoryLimit >= tokenHistoryTotal || tokenHistoryLoading}
                              className={cn('px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors', (tokenHistoryPage + 1) * tokenHistoryLimit >= tokenHistoryTotal ? 'opacity-30 cursor-not-allowed' : '', isDark ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* NFTs View */}
                {historyView === 'nfts' && (
                  <>
                    {nftTradesLoading ? (
                      <div className={cn('p-8 text-center text-[11px]', isDark ? 'text-white/40' : 'text-gray-400')}>Loading...</div>
                    ) : nftTrades.length === 0 ? (
                      <div className={cn('p-8 text-center text-[11px]', isDark ? 'text-white/40' : 'text-gray-400')}>No NFT trades</div>
                    ) : (
                      <>
                        <div className={cn('grid grid-cols-[60px_1.5fr_1fr_1fr_40px] gap-3 px-4 py-2 text-[9px] uppercase tracking-wider font-semibold border-b', isDark ? 'text-white/40 border-white/[0.08]' : 'text-gray-500 border-gray-100')}>
                          <div></div>
                          <div>NFT</div>
                          <div className="text-right">Price</div>
                          <div className="text-right">Time</div>
                          <div></div>
                        </div>
                        <div className={cn('divide-y max-h-[400px] overflow-y-auto', isDark ? 'divide-white/5' : 'divide-gray-50')}>
                          {nftTrades.map((trade, i) => (
                            <div key={i} className={cn('grid grid-cols-[60px_1.5fr_1fr_1fr_40px] gap-3 px-4 py-2.5 items-center', isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50')}>
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5">
                                {trade.nft?.image && <img src={trade.nft.image} alt="" className="w-full h-full object-cover" />}
                              </div>
                              <div className="min-w-0">
                                <p className={cn('text-[12px] font-medium truncate', isDark ? 'text-white/90' : 'text-gray-900')}>{trade.nft?.name || 'NFT'}</p>
                                <p className={cn('text-[10px] truncate', isDark ? 'text-white/40' : 'text-gray-400')}>{trade.collection?.name || ''}</p>
                              </div>
                              <p className={cn('text-[11px] font-medium tabular-nums text-right', isDark ? 'text-white/80' : 'text-gray-700')}>
                                {trade.price ? `${parseFloat(trade.price).toLocaleString()} XRP` : '—'}
                              </p>
                              <p className={cn('text-[10px] tabular-nums text-right', isDark ? 'text-white/40' : 'text-gray-400')}>
                                {trade.time ? new Date(trade.time).toLocaleString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}) : '—'}
                              </p>
                              <a href={`/tx/${trade.hash}`} target="_blank" rel="noopener noreferrer" className={cn('p-1 rounded transition-colors', isDark ? 'text-white/30 hover:text-blue-400' : 'text-gray-400 hover:text-blue-500')}>
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* On-chain View */}
                {historyView === 'onchain' && (
                  <>
                    {txLoading ? (
                      <div className={cn('p-8 text-center text-[11px]', isDark ? 'text-white/40' : 'text-gray-400')}>Loading...</div>
                    ) : transactions.length === 0 ? (
                      <div className={cn('p-8 text-center text-[11px]', isDark ? 'text-white/40' : 'text-gray-400')}>No transactions</div>
                    ) : (
                      <>
                        <div className={cn('grid grid-cols-[40px_1fr_1.5fr_1fr_1fr_40px] gap-4 px-4 py-2 text-[9px] uppercase tracking-wider font-semibold border-b', isDark ? 'text-white/40 border-white/[0.08]' : 'text-gray-500 border-gray-100')}>
                          <div></div>
                          <div>Type</div>
                          <div>Counterparty</div>
                          <div className="text-right">Amount</div>
                          <div className="text-right">Date</div>
                          <div></div>
                        </div>
                        <div className={cn('divide-y', isDark ? 'divide-white/5' : 'divide-gray-50')}>
                          {transactions.map((tx) => (
                            <div key={tx.id} className={cn('grid grid-cols-[40px_1fr_1.5fr_1fr_1fr_40px] gap-4 px-4 py-2.5 items-center', isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50')}>
                              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', tx.type === 'failed' ? 'bg-amber-500/10' : tx.type === 'in' ? 'bg-emerald-500/10' : 'bg-red-500/10')}>
                                {tx.type === 'failed' ? <AlertTriangle size={14} className="text-amber-500" /> : tx.type === 'in' ? <ArrowDownLeft size={14} className="text-emerald-500" /> : <ArrowUpRight size={14} className="text-red-400" />}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <p className={cn('text-[12px] font-medium', isDark ? 'text-white/90' : 'text-gray-900')}>{tx.label}</p>
                                {tx.isDust && <span className={cn('text-[8px] px-1 py-0.5 rounded font-medium', isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-600')}>Dust</span>}
                              </div>
                              <p className={cn('text-[11px] font-mono truncate', isDark ? 'text-white/50' : 'text-gray-500')}>
                                {tx.counterparty ? `${tx.counterparty.slice(0, 8)}...${tx.counterparty.slice(-6)}` : '—'}
                              </p>
                              <p className={cn('text-[11px] font-medium tabular-nums text-right', tx.type === 'failed' ? 'text-amber-500' : tx.type === 'in' ? 'text-emerald-500' : 'text-red-400')}>
                                {tx.amount ? (tx.type === 'failed' ? tx.amount : `${tx.type === 'in' ? '+' : '-'}${tx.amount}`) : '—'}
                              </p>
                              <p className={cn('text-[10px] tabular-nums text-right', isDark ? 'text-white/40' : 'text-gray-400')}>
                                {tx.time ? new Date(tx.time).toLocaleDateString() : '—'}
                              </p>
                              <a href={`/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className={cn('p-1 rounded transition-colors', isDark ? 'text-white/30 hover:text-blue-400' : 'text-gray-400 hover:text-blue-500')}>
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          ))}
                        </div>
                        {txHasMore && (
                          <div className={cn('flex items-center justify-center gap-2 p-3 border-t', isDark ? 'border-white/[0.08]' : 'border-gray-100')}>
                            <button
                              onClick={async () => {
                                if (!txMarker || txLoading) return;
                                setTxLoading(true);
                                const client = new Client('wss://s1.ripple.com');
                                try {
                                  await client.connect();
                                  const response = await client.request({
                                    command: 'account_tx',
                                    account: address,
                                    ledger_index_min: -1,
                                    ledger_index_max: -1,
                                    limit: txLimit,
                                    marker: txMarker
                                  });
                                  const txs = response.result?.transactions || [];
                                  setTransactions(prev => [...prev, ...txs.map(parseTx)]);
                                  setTxMarker(response.result?.marker || null);
                                  setTxHasMore(!!response.result?.marker);
                                } catch (e) {
                                  console.error('Failed to load more:', e);
                                } finally {
                                  client.disconnect();
                                  setTxLoading(false);
                                }
                              }}
                              disabled={txLoading}
                              className={cn('px-4 py-1.5 text-[11px] font-medium rounded-lg transition-colors', isDark ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                            >
                              {txLoading ? 'Loading...' : 'Load More'}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Withdrawals Tab */}
            {activeTab === 'withdrawals' && (
              <div className="space-y-4">
                {/* Delete Confirmation Modal */}
                {deleteConfirmId && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                    onClick={() => setDeleteConfirmId(null)}
                  >
                    <div
                      className={cn(
                        'w-full max-w-sm rounded-xl p-5',
                        isDark
                          ? 'bg-[#070b12]/98 backdrop-blur-xl border border-red-500/20'
                          : 'bg-white/98 backdrop-blur-xl border border-gray-200'
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            isDark ? 'bg-red-500/10' : 'bg-red-50'
                          )}
                        >
                          <Trash2 size={18} className="text-red-500" />
                        </div>
                        <div>
                          <h3
                            className={cn(
                              'text-[14px] font-medium',
                              isDark ? 'text-white/90' : 'text-gray-900'
                            )}
                          >
                            Delete Address?
                          </h3>
                          <p
                            className={cn(
                              'text-[11px]',
                              isDark ? 'text-white/50' : 'text-gray-500'
                            )}
                          >
                            This cannot be undone
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className={cn(
                            'flex-1 py-2.5 rounded-lg text-[12px] font-medium transition-colors',
                            isDark
                              ? 'bg-white/5 text-white/70 hover:bg-white/10'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          )}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeleteWithdrawal(deleteConfirmId)}
                          className="flex-1 py-2.5 rounded-lg text-[12px] font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add Withdrawal Modal */}
                {showAddWithdrawal && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setShowAddWithdrawal(false)}
                  >
                    <div
                      className={cn(
                        'w-full max-w-md rounded-2xl p-6',
                        isDark
                          ? 'bg-[#09090b] border-[1.5px] border-white/15'
                          : 'bg-white border border-gray-200'
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3
                          className={cn(
                            'text-[13px] font-medium',
                            isDark ? 'text-white/90' : 'text-gray-900'
                          )}
                        >
                          Add Withdrawal Address
                        </h3>
                        <button
                          onClick={() => setShowAddWithdrawal(false)}
                          className={cn(
                            'p-2 rounded-lg transition-colors duration-150',
                            isDark
                              ? 'hover:bg-blue-500/5 text-white/40 hover:text-blue-400'
                              : 'hover:bg-blue-50 text-gray-400 hover:text-blue-600'
                          )}
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label
                            className={cn(
                              'text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block',
                              isDark ? 'text-blue-400' : 'text-blue-500'
                            )}
                          >
                            Name
                          </label>
                          <input
                            type="text"
                            value={newWithdrawal.name}
                            onChange={(e) =>
                              setNewWithdrawal((prev) => ({ ...prev, name: e.target.value }))
                            }
                            placeholder="e.g. Binance, Coinbase"
                            className={cn(
                              'w-full px-4 py-3 rounded-lg text-[13px] outline-none transition-colors duration-150',
                              isDark
                                ? 'bg-white/[0.04] text-white border border-white/[0.15] placeholder:text-white/30 focus:border-blue-500/40'
                                : 'bg-gray-50 border border-gray-200 placeholder:text-gray-400 focus:border-blue-400'
                            )}
                          />
                        </div>
                        <div>
                          <label
                            className={cn(
                              'text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block',
                              isDark ? 'text-blue-400' : 'text-blue-500'
                            )}
                          >
                            XRPL Address
                          </label>
                          <input
                            type="text"
                            value={newWithdrawal.address}
                            onChange={(e) =>
                              setNewWithdrawal((prev) => ({ ...prev, address: e.target.value }))
                            }
                            placeholder="rAddress..."
                            className={cn(
                              'w-full px-4 py-3 rounded-lg text-[13px] font-mono outline-none transition-colors duration-150',
                              isDark
                                ? 'bg-white/[0.04] text-white border border-white/[0.15] placeholder:text-white/30 focus:border-blue-500/40'
                                : 'bg-gray-50 border border-gray-200 placeholder:text-gray-400 focus:border-blue-400'
                            )}
                          />
                        </div>
                        <div>
                          <label
                            className={cn(
                              'text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block',
                              isDark ? 'text-blue-400' : 'text-blue-500'
                            )}
                          >
                            Destination Tag (optional)
                          </label>
                          <input
                            type="text"
                            value={newWithdrawal.tag}
                            onChange={(e) =>
                              setNewWithdrawal((prev) => ({
                                ...prev,
                                tag: e.target.value.replace(/\D/g, '')
                              }))
                            }
                            placeholder="e.g. 12345678"
                            className={cn(
                              'w-full px-4 py-3 rounded-lg text-[13px] font-mono outline-none transition-colors duration-150',
                              isDark
                                ? 'bg-white/[0.04] text-white border border-white/[0.15] placeholder:text-white/30 focus:border-blue-500/40'
                                : 'bg-gray-50 border border-gray-200 placeholder:text-gray-400 focus:border-blue-400'
                            )}
                          />
                        </div>
                        {withdrawalError && (
                          <p className="text-[11px] text-red-400">{withdrawalError}</p>
                        )}
                        <button
                          onClick={handleAddWithdrawal}
                          disabled={withdrawalLoading}
                          className="w-full py-4 rounded-lg text-[13px] font-medium disabled:opacity-50 flex items-center justify-center gap-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                        >
                          {withdrawalLoading ? (
                            'Saving...'
                          ) : (
                            <>
                              <Plus size={16} /> Save Address
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div
                  className={cn(
                    'rounded-xl',
                    isDark
                      ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]'
                      : 'bg-white border border-gray-200'
                  )}
                >
                  <div className="p-4 border-b border-white/[0.15] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          'text-[11px] font-semibold uppercase tracking-[0.15em]',
                          isDark ? 'text-blue-400' : 'text-blue-500'
                        )}
                      >
                        Saved Withdrawal Addresses
                      </p>
                      <span
                        className={cn(
                          'text-[9px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide',
                          isDark
                            ? 'bg-white/5 text-white/50 border border-white/[0.15]'
                            : 'bg-gray-100 text-gray-500'
                        )}
                      >
                        {withdrawals.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowAddWithdrawal(true)}
                      className={cn(
                        'text-[11px] font-medium uppercase tracking-wide flex items-center gap-1 transition-colors',
                        isDark
                          ? 'text-blue-400/80 hover:text-blue-300'
                          : 'text-blue-500 hover:text-blue-600'
                      )}
                    >
                      <Plus size={12} /> Add New
                    </button>
                  </div>
                  {withdrawals.length === 0 ? (
                    <div
                      className={cn('p-6 text-center', isDark ? 'text-white/35' : 'text-gray-400')}
                    >
                      <div className="relative w-12 h-12 mx-auto mb-3">
                        <div
                          className={cn(
                            'absolute -top-0.5 left-0.5 w-4 h-4 rounded-full',
                            isDark ? 'bg-[#4285f4]' : 'bg-blue-400'
                          )}
                        />
                        <div
                          className={cn(
                            'absolute -top-0.5 right-0.5 w-4 h-4 rounded-full',
                            isDark ? 'bg-[#4285f4]' : 'bg-blue-400'
                          )}
                        />
                        <div
                          className={cn(
                            'absolute top-0.5 left-1.5 w-2 h-2 rounded-full',
                            isDark ? 'bg-[#3b78e7]' : 'bg-blue-500/70'
                          )}
                        />
                        <div
                          className={cn(
                            'absolute top-0.5 right-1.5 w-2 h-2 rounded-full',
                            isDark ? 'bg-[#3b78e7]' : 'bg-blue-500/70'
                          )}
                        />
                        <div
                          className={cn(
                            'absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full',
                            isDark ? 'bg-[#4285f4]' : 'bg-blue-400'
                          )}
                        >
                          <div className="absolute top-3 left-2 w-1.5 h-1 rounded-full bg-[#0a0a0a] rotate-[-10deg]" />
                          <div className="absolute top-3 right-2 w-1.5 h-1 rounded-full bg-[#0a0a0a] rotate-[10deg]" />
                          <div
                            className={cn(
                              'absolute bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-2 rounded-full',
                              isDark ? 'bg-[#5a9fff]' : 'bg-blue-300'
                            )}
                          >
                            <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1 rounded-full bg-[#0a0a0a]" />
                          </div>
                          <div
                            className={cn(
                              'absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-1 rounded-t-full border-t border-l border-r',
                              isDark ? 'border-[#0a0a0a]' : 'border-blue-600'
                            )}
                          />
                        </div>
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 flex flex-col justify-start gap-[2px] pointer-events-none overflow-hidden rounded-full">
                          {[...Array(8)].map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                'h-[2px] w-full',
                                isDark ? 'bg-[#0a0a0a]/40' : 'bg-white/40'
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <p
                        className={cn(
                          'text-[10px] font-medium tracking-wider mb-1',
                          isDark ? 'text-white/60' : 'text-gray-500'
                        )}
                      >
                        NO SAVED ADDRESSES
                      </p>
                      <p className={cn('text-[9px]', isDark ? 'text-white/40' : 'text-gray-400')}>
                        Add exchange or wallet addresses for quick withdrawals
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-blue-500/5">
                      {withdrawals.map((wallet) => (
                        <div
                          key={wallet.id}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 group transition-all duration-150',
                            isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'
                          )}
                        >
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                              isDark ? 'bg-blue-500/10' : 'bg-blue-50'
                            )}
                          >
                            <Building2
                              size={16}
                              className={isDark ? 'text-blue-400' : 'text-blue-500'}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                'text-[13px] font-medium',
                                isDark ? 'text-white/90' : 'text-gray-900'
                              )}
                            >
                              {wallet.name}
                            </p>
                            <p
                              className={cn(
                                'text-[10px] font-mono truncate',
                                isDark ? 'text-white/35' : 'text-gray-400'
                              )}
                            >
                              {wallet.address}
                            </p>
                            {wallet.tag && (
                              <p
                                className={cn(
                                  'text-[10px]',
                                  isDark ? 'text-white/25' : 'text-gray-400'
                                )}
                              >
                                Tag: {wallet.tag}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleCopy(wallet.address)}
                              className={cn(
                                'p-2 rounded-lg transition-colors duration-150',
                                isDark
                                  ? 'hover:bg-blue-500/5 text-white/40 hover:text-blue-400'
                                  : 'hover:bg-blue-50 text-gray-400 hover:text-blue-600'
                              )}
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedToken('XRP');
                                setSendTo(wallet.address);
                                setSendTag(wallet.tag || '');
                                setShowPanel('send');
                                setActiveTab('overview');
                              }}
                              className={cn(
                                'p-2 rounded-lg transition-colors duration-150',
                                isDark
                                  ? 'hover:bg-blue-500/5 text-white/40 hover:text-blue-400'
                                  : 'hover:bg-blue-50 text-gray-400 hover:text-blue-600'
                              )}
                            >
                              <Send size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(wallet.id)}
                              className={cn(
                                'p-2 rounded-lg transition-colors duration-150 opacity-0 group-hover:opacity-100',
                                isDark
                                  ? 'hover:bg-red-500/10 text-white/40 hover:text-red-400'
                                  : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                              )}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* NFTs Tab */}
            {activeTab === 'nfts' && (
              <div>
                {/* NFT Transfer Modal */}
                {nftToTransfer && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                    onClick={() => setNftToTransfer(null)}
                  >
                    <div
                      className={cn(
                        'w-full max-w-md rounded-xl p-6',
                        isDark
                          ? 'bg-[#070b12]/98 backdrop-blur-xl border border-white/[0.15]'
                          : 'bg-white/98 backdrop-blur-xl border border-gray-200'
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3
                          className={cn(
                            'text-[13px] font-medium',
                            isDark ? 'text-white/90' : 'text-gray-900'
                          )}
                        >
                          Transfer NFT
                        </h3>
                        <button
                          onClick={() => setNftToTransfer(null)}
                          className={cn(
                            'p-2 rounded-lg transition-colors duration-150',
                            isDark
                              ? 'hover:bg-blue-500/5 text-white/40 hover:text-blue-400'
                              : 'hover:bg-blue-50 text-gray-400 hover:text-blue-600'
                          )}
                        >
                          ✕
                        </button>
                      </div>
                      <div
                        className={cn(
                          'flex items-center gap-4 p-3 rounded-lg mb-4',
                          isDark
                            ? 'bg-white/[0.04] border border-white/[0.15]'
                            : 'bg-gray-50 border border-gray-200'
                        )}
                      >
                        <img
                          src={nftToTransfer.image}
                          alt={nftToTransfer.name}
                          className="w-14 h-14 rounded-lg object-cover"
                        />
                        <div>
                          <p
                            className={cn(
                              'text-[13px] font-medium',
                              isDark ? 'text-white/90' : 'text-gray-900'
                            )}
                          >
                            {nftToTransfer.name}
                          </p>
                          <p
                            className={cn(
                              'text-[10px]',
                              isDark ? 'text-white/35' : 'text-gray-400'
                            )}
                          >
                            {nftToTransfer.collection}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label
                            className={cn(
                              'text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block',
                              isDark ? 'text-blue-400' : 'text-blue-500'
                            )}
                          >
                            Recipient Address
                          </label>
                          <input
                            type="text"
                            value={nftRecipient}
                            onChange={(e) => setNftRecipient(e.target.value)}
                            placeholder="rAddress..."
                            className={cn(
                              'w-full px-4 py-3 rounded-lg text-[13px] font-mono outline-none transition-colors duration-150',
                              isDark
                                ? 'bg-white/[0.04] text-white border border-white/[0.15] placeholder:text-white/30 focus:border-blue-500/40'
                                : 'bg-gray-50 border border-gray-200 placeholder:text-gray-400 focus:border-blue-400'
                            )}
                          />
                        </div>
                        <div
                          className={cn(
                            'p-3 rounded-lg text-[11px]',
                            isDark
                              ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                              : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          )}
                        >
                          This will transfer ownership. This action cannot be undone.
                        </div>
                        <button className="w-full py-4 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                          <Send size={16} /> Transfer NFT
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* NFT Sell Modal */}
                {nftToSell && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                    onClick={() => setNftToSell(null)}
                  >
                    <div
                      className={cn(
                        'w-full max-w-md rounded-xl p-6',
                        isDark
                          ? 'bg-[#070b12]/98 backdrop-blur-xl border border-white/[0.15]'
                          : 'bg-white/98 backdrop-blur-xl border border-gray-200'
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3
                          className={cn(
                            'text-[13px] font-medium',
                            isDark ? 'text-white/90' : 'text-gray-900'
                          )}
                        >
                          List NFT for Sale
                        </h3>
                        <button
                          onClick={() => setNftToSell(null)}
                          className={cn(
                            'p-2 rounded-lg transition-colors duration-150',
                            isDark
                              ? 'hover:bg-blue-500/5 text-white/40 hover:text-blue-400'
                              : 'hover:bg-blue-50 text-gray-400 hover:text-blue-600'
                          )}
                        >
                          ✕
                        </button>
                      </div>
                      <div
                        className={cn(
                          'flex items-center gap-4 p-3 rounded-lg mb-4',
                          isDark
                            ? 'bg-white/[0.04] border border-white/[0.15]'
                            : 'bg-gray-50 border border-gray-200'
                        )}
                      >
                        <img
                          src={nftToSell.image}
                          alt={nftToSell.name}
                          className="w-14 h-14 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <p
                            className={cn(
                              'text-[13px] font-medium',
                              isDark ? 'text-white/90' : 'text-gray-900'
                            )}
                          >
                            {nftToSell.name}
                          </p>
                          <p
                            className={cn(
                              'text-[10px]',
                              isDark ? 'text-white/35' : 'text-gray-400'
                            )}
                          >
                            {nftToSell.collection}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={cn(
                              'text-[9px] uppercase font-semibold tracking-wide',
                              isDark ? 'text-white/25' : 'text-gray-400'
                            )}
                          >
                            Floor
                          </p>
                          <p
                            className={cn(
                              'text-[12px] font-medium',
                              isDark ? 'text-white/50' : 'text-gray-500'
                            )}
                          >
                            {nftToSell.floor}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label
                            className={cn(
                              'text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block',
                              isDark ? 'text-blue-400' : 'text-blue-500'
                            )}
                          >
                            Sale Price
                          </label>
                          <div
                            className={cn(
                              'flex items-center rounded-lg overflow-hidden',
                              isDark
                                ? 'bg-white/[0.04] border border-white/[0.15]'
                                : 'bg-gray-50 border border-gray-200'
                            )}
                          >
                            <input
                              type="text"
                              inputMode="decimal"
                              value={nftSellPrice}
                              onChange={(e) =>
                                setNftSellPrice(e.target.value.replace(/[^0-9.]/g, ''))
                              }
                              placeholder="0.00"
                              className={cn(
                                'flex-1 px-4 py-3 text-lg font-light bg-transparent outline-none',
                                isDark
                                  ? 'text-white placeholder:text-white/20'
                                  : 'text-gray-900 placeholder:text-gray-300'
                              )}
                            />
                            <span
                              className={cn(
                                'px-4 py-3 text-[13px] font-medium',
                                isDark
                                  ? 'text-white/50 bg-white/[0.04]'
                                  : 'text-gray-500 bg-gray-100'
                              )}
                            >
                              XRP
                            </span>
                          </div>
                        </div>
                        <div
                          className={cn(
                            'flex items-center justify-between p-3 rounded-lg text-[11px]',
                            isDark
                              ? 'bg-white/[0.04] border border-white/[0.15]'
                              : 'bg-gray-50 border border-gray-200'
                          )}
                        >
                          <span className={isDark ? 'text-white/35' : 'text-gray-400'}>
                            Marketplace fee (2.5%)
                          </span>
                          <span className={isDark ? 'text-white/50' : 'text-gray-500'}>
                            {nftSellPrice ? (parseFloat(nftSellPrice) * 0.025).toFixed(2) : '0.00'}{' '}
                            XRP
                          </span>
                        </div>
                        <div
                          className={cn(
                            'flex items-center justify-between p-3 rounded-lg',
                            isDark
                              ? 'bg-white/[0.04] border border-white/[0.15]'
                              : 'bg-gray-50 border border-gray-200'
                          )}
                        >
                          <span
                            className={cn(
                              'text-[13px]',
                              isDark ? 'text-white/50' : 'text-gray-500'
                            )}
                          >
                            You receive
                          </span>
                          <span
                            className={cn(
                              'text-lg font-medium',
                              isDark ? 'text-white/90' : 'text-gray-900'
                            )}
                          >
                            {nftSellPrice ? (parseFloat(nftSellPrice) * 0.975).toFixed(2) : '0.00'}{' '}
                            XRP
                          </span>
                        </div>
                        <button className="w-full py-4 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                          <ArrowUpRight size={16} /> List for Sale
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedCollection ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={() => setSelectedCollection(null)}
                        className={cn(
                          'text-[11px] transition-colors',
                          isDark
                            ? 'text-white/35 hover:text-blue-400'
                            : 'text-gray-400 hover:text-blue-600'
                        )}
                      >
                        All Collections
                      </button>
                      <span className={isDark ? 'text-white/20' : 'text-gray-300'}>/</span>
                      <span
                        className={cn(
                          'text-[13px] font-medium',
                          isDark ? 'text-white/90' : 'text-gray-900'
                        )}
                      >
                        {selectedCollection}
                      </span>
                      <button
                        onClick={() => setSelectedCollection(null)}
                        className={cn(
                          'ml-auto text-[11px] px-2 py-1 rounded-lg transition-colors duration-150',
                          isDark
                            ? 'bg-white/[0.04] text-white/50 hover:bg-blue-500/5 hover:text-blue-400'
                            : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                        )}
                      >
                        Clear
                      </button>
                    </div>
                    {collectionNftsLoading ? (
                      <div
                        className={cn(
                          'p-12 text-center',
                          isDark ? 'text-white/40' : 'text-gray-400'
                        )}
                      >
                        Loading NFTs...
                      </div>
                    ) : collectionNfts.length === 0 ? (
                      <div
                        className={cn(
                          'rounded-xl py-12 px-8 text-center',
                          isDark
                            ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]'
                            : 'bg-white border border-gray-200'
                        )}
                      >
                        <div className="relative w-16 h-16 mx-auto mb-4">
                          <div
                            className={cn(
                              'absolute -top-1 left-1 w-5 h-5 rounded-full',
                              isDark ? 'bg-[#4285f4]' : 'bg-blue-400'
                            )}
                          />
                          <div
                            className={cn(
                              'absolute -top-1 right-1 w-5 h-5 rounded-full',
                              isDark ? 'bg-[#4285f4]' : 'bg-blue-400'
                            )}
                          />
                          <div
                            className={cn(
                              'absolute top-0.5 left-2 w-2.5 h-2.5 rounded-full',
                              isDark ? 'bg-[#3b78e7]' : 'bg-blue-500/70'
                            )}
                          />
                          <div
                            className={cn(
                              'absolute top-0.5 right-2 w-2.5 h-2.5 rounded-full',
                              isDark ? 'bg-[#3b78e7]' : 'bg-blue-500/70'
                            )}
                          />
                          <div
                            className={cn(
                              'absolute top-2.5 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full',
                              isDark ? 'bg-[#4285f4]' : 'bg-blue-400'
                            )}
                          >
                            <div className="absolute top-4 left-2.5 w-2 h-1.5 rounded-full bg-[#0a0a0a] rotate-[-10deg]" />
                            <div className="absolute top-4 right-2.5 w-2 h-1.5 rounded-full bg-[#0a0a0a] rotate-[10deg]" />
                            <div
                              className={cn(
                                'absolute bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-2.5 rounded-full',
                                isDark ? 'bg-[#5a9fff]' : 'bg-blue-300'
                              )}
                            >
                              <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1 rounded-full bg-[#0a0a0a]" />
                            </div>
                            <div
                              className={cn(
                                'absolute bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-1 rounded-t-full border-t-[1.5px] border-l-[1.5px] border-r-[1.5px]',
                                isDark ? 'border-[#0a0a0a]' : 'border-blue-600'
                              )}
                            />
                          </div>
                          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-12 h-12 flex flex-col justify-start gap-[2px] pointer-events-none overflow-hidden rounded-full">
                            {[...Array(10)].map((_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  'h-[2px] w-full',
                                  isDark ? 'bg-[#0a0a0a]/40' : 'bg-white/40'
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <p
                          className={cn(
                            'text-xs font-medium tracking-widest mb-1',
                            isDark ? 'text-white/60' : 'text-gray-500'
                          )}
                        >
                          NO NFTS FOUND
                        </p>
                        <a
                          href="/nfts"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-400 hover:underline"
                        >
                          Browse collections
                        </a>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {collectionNfts.map((nft) => (
                          <div
                            key={nft.id}
                            className={cn(
                              'rounded-xl overflow-hidden group',
                              isDark
                                ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]'
                                : 'bg-white border border-gray-200'
                            )}
                          >
                            <div className="relative">
                              {nft.image ? (
                                <img
                                  src={nft.image}
                                  alt={nft.name}
                                  className="w-full aspect-square object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div
                                  className={cn(
                                    'w-full aspect-square flex items-center justify-center text-[11px]',
                                    isDark
                                      ? 'bg-white/5 text-white/30'
                                      : 'bg-gray-100 text-gray-400'
                                  )}
                                >
                                  No image
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Link
                                  href={`/nft/${nft.nftId}`}
                                  className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 text-[11px] font-medium flex items-center gap-1 transition-colors"
                                >
                                  <ExternalLink size={12} /> View
                                </Link>
                                <button
                                  onClick={() => setNftToTransfer(nft)}
                                  className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 text-[11px] font-medium flex items-center gap-1 transition-colors"
                                >
                                  <Send size={12} /> Send
                                </button>
                                <button
                                  onClick={() => setNftToSell(nft)}
                                  className="p-2 rounded-lg text-[11px] font-medium flex items-center gap-1 bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                                >
                                  <ArrowUpRight size={12} /> Sell
                                </button>
                              </div>
                            </div>
                            <div className="p-3">
                              <p
                                className={cn(
                                  'text-[13px] font-medium truncate',
                                  isDark ? 'text-white/90' : 'text-gray-900'
                                )}
                              >
                                {nft.name}
                              </p>
                              {nft.rarity > 0 && (
                                <p
                                  className={cn(
                                    'text-[10px]',
                                    isDark ? 'text-white/40' : 'text-gray-500'
                                  )}
                                >
                                  Rank #{nft.rarity}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : collectionsLoading ? (
                  <div
                    className={cn('p-12 text-center', isDark ? 'text-white/40' : 'text-gray-400')}
                  >
                    Loading collections...
                  </div>
                ) : collections.length === 0 ? (
                  <div
                    className={cn(
                      'rounded-xl p-12 text-center',
                      isDark
                        ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]'
                        : 'bg-white border border-gray-200'
                    )}
                  >
                    <div className="relative w-12 h-12 mx-auto mb-3">
                      <div
                        className={cn(
                          'absolute -top-0.5 left-0.5 w-4 h-4 rounded-full',
                          isDark ? 'bg-[#4285f4]' : 'bg-blue-400'
                        )}
                      />
                      <div
                        className={cn(
                          'absolute -top-0.5 right-0.5 w-4 h-4 rounded-full',
                          isDark ? 'bg-[#4285f4]' : 'bg-blue-400'
                        )}
                      />
                      <div
                        className={cn(
                          'absolute top-0.5 left-1.5 w-2 h-2 rounded-full',
                          isDark ? 'bg-[#3b78e7]' : 'bg-blue-500/70'
                        )}
                      />
                      <div
                        className={cn(
                          'absolute top-0.5 right-1.5 w-2 h-2 rounded-full',
                          isDark ? 'bg-[#3b78e7]' : 'bg-blue-500/70'
                        )}
                      />
                      <div
                        className={cn(
                          'absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full',
                          isDark ? 'bg-[#4285f4]' : 'bg-blue-400'
                        )}
                      >
                        <div className="absolute top-3 left-2 w-1.5 h-1 rounded-full bg-[#0a0a0a] rotate-[-10deg]" />
                        <div className="absolute top-3 right-2 w-1.5 h-1 rounded-full bg-[#0a0a0a] rotate-[10deg]" />
                        <div
                          className={cn(
                            'absolute bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-2 rounded-full',
                            isDark ? 'bg-[#5a9fff]' : 'bg-blue-300'
                          )}
                        >
                          <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1 rounded-full bg-[#0a0a0a]" />
                        </div>
                        <div
                          className={cn(
                            'absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-1 rounded-t-full border-t border-l border-r',
                            isDark ? 'border-[#0a0a0a]' : 'border-blue-600'
                          )}
                        />
                      </div>
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 flex flex-col justify-start gap-[2px] pointer-events-none overflow-hidden rounded-full">
                        {[...Array(8)].map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              'h-[2px] w-full',
                              isDark ? 'bg-[#0a0a0a]/40' : 'bg-white/40'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <p
                      className={cn(
                        'text-[10px] font-medium tracking-wider mb-1',
                        isDark ? 'text-white/60' : 'text-gray-500'
                      )}
                    >
                      NO NFTS FOUND
                    </p>
                    <p className={cn('text-[9px]', isDark ? 'text-white/40' : 'text-gray-400')}>
                      NFTs you own will appear here
                    </p>
                    <a
                      href="/nfts"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] text-blue-400 hover:underline mt-2 inline-block"
                    >
                      Browse collections
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {collections.map((col) => (
                      <button
                        key={col.id}
                        onClick={() => setSelectedCollection(col.name)}
                        className={cn(
                          'rounded-xl overflow-hidden text-left group',
                          isDark
                            ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15] hover:border-white/20'
                            : 'bg-white border border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <div className="relative">
                          {col.logo ? (
                            <img
                              src={col.logo}
                              alt={col.name}
                              className="w-full aspect-square object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div
                              className={cn(
                                'w-full aspect-square flex items-center justify-center text-[11px]',
                                isDark ? 'bg-white/5 text-white/30' : 'bg-gray-100 text-gray-400'
                              )}
                            >
                              No image
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p
                            className={cn(
                              'text-[13px] font-medium truncate',
                              isDark ? 'text-white/90' : 'text-gray-900'
                            )}
                          >
                            {col.name}
                          </p>
                          <p
                            className={cn(
                              'text-[10px]',
                              isDark ? 'text-white/40' : 'text-gray-500'
                            )}
                          >
                            {col.count} item{col.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Debug Info */}
      {debugInfo && (
        <div
          className={cn(
            'max-w-5xl mx-auto px-4 py-4 mb-4 rounded-xl text-[11px] font-mono',
            isDark ? 'bg-white/[0.02] border border-white/[0.15]' : 'bg-gray-50 border border-gray-200'
          )}
        >
          <div className={isDark ? 'text-white/50' : 'text-gray-500'}>
            wallet_type:{' '}
            <span className="text-blue-400">{debugInfo.wallet_type || 'undefined'}</span>
          </div>
          <div className={isDark ? 'text-white/50' : 'text-gray-500'}>
            account: <span className="opacity-70">{debugInfo.account || 'undefined'}</span>
          </div>
          <div className={isDark ? 'text-white/50' : 'text-gray-500'}>
            walletKeyId:{' '}
            <span className={debugInfo.walletKeyId ? 'text-emerald-400' : 'text-red-400'}>
              {debugInfo.walletKeyId || 'undefined'}
            </span>
          </div>
          <div className={isDark ? 'text-white/50' : 'text-gray-500'}>
            seed: <span className="text-emerald-400 break-all">{debugInfo.seed}</span>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
