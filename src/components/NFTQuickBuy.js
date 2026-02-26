import { useState, useEffect, useContext, useCallback, memo, useRef } from 'react';
import { toast } from 'sonner';
import api, { submitTransaction } from 'src/utils/api';
import { ThemeContext, WalletContext, AppContext } from 'src/context/AppContext';
import { cn } from 'src/utils/cn';
import { fNumber } from 'src/utils/formatters';
import { getNftCoverUrl } from 'src/utils/parseUtils';
import { ConnectWallet } from 'src/components/Wallet';
import {
  Image as ImageIcon,
  ChevronDown,
  ShoppingCart,
  X,
  CheckCircle,
  ExternalLink,
  Layers,
  HandCoins,
  Search,
  TrendingUp,
  Flame,
  Zap
} from 'lucide-react';
import BoostModal from './BoostModal';

const BASE_URL = 'https://api.xrpl.to/v1';

// Tiny inline sparkline SVG
const MiniSparkline = memo(({ data, color, width = 48, height = 16 }) => {
  if (!data?.length || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="flex-shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});
MiniSparkline.displayName = 'MiniSparkline';

const fmtStat = (n) => {
  if (!n) return '0';
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return Math.round(n).toLocaleString();
};

const BROKER_ADDRESSES = {
  rnPNSonfEN1TWkPH4Kwvkk3693sCT4tsZv: { fee: 0.015, name: 'Art Dept Fun' },
  rpx9JThQ2y37FaGeeJP7PXDUVEXY3PHZSC: { fee: 0.01589, name: 'XRP Cafe' },
  rpZqTPC8GvrSvEfFsUuHkmPCg29GdQuXhC: { fee: 0.015, name: 'BIDDS' },
  rDeizxSRo6JHjKnih9ivpPkyD2EgXQvhSB: { fee: 0.015, name: 'XPMarket' },
  rJcCJyJkiTXGcxU4Lt4ZvKJz8YmorZXu8r: { fee: 0.01, name: 'OpulenceX' }
};

// ─── Tiny helpers ────────────────────────────────────────────────
const nftImg = (nft, size = 'small') => {
  const url = getNftCoverUrl(nft, size, 'image');
  return url || '/static/alt.webp';
};

const collectionImg = (logo) =>
  logo ? `https://s1.xrpl.to/nft-collection/${logo}` : '/static/alt.webp';

const xrpPrice = (cost) => {
  if (!cost?.amount) return null;
  const v = typeof cost.amount === 'string' ? parseFloat(cost.amount) : cost.amount;
  // cost is in drops for XRP listings
  if (cost.currency === 'XRP' && v > 1000) return v / 1_000_000;
  return v;
};

// ─── NFTQuickBuy ─────────────────────────────────────────────────
function NFTQuickBuy() {
  const { darkMode } = useContext(ThemeContext);
  const { accountProfile } = useContext(WalletContext);
  const { setLoading, sync, setSync } = useContext(AppContext);
  const isDark = darkMode;

  // State
  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [loadingNfts, setLoadingNfts] = useState(false);
  const [buyingNft, setBuyingNft] = useState(null); // NFTokenID being purchased
  const [previewNft, setPreviewNft] = useState(null); // selected NFT for inline detail
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [recentCollections, setRecentCollections] = useState([]);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const detailPanelRef = useRef(null);

  // Trending collections state
  const [trendingCollections, setTrendingCollections] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [boostCollection, setBoostCollection] = useState(null);
  const [nftSparklines, setNftSparklines] = useState({});
  const [nftGlobalStats, setNftGlobalStats] = useState(null);
  const [recentNftSales, setRecentNftSales] = useState([]);

  // Inline detail panel state
  const [actionMode, setActionMode] = useState('buy'); // 'buy' or 'offer'
  const [offerAmount, setOfferAmount] = useState('');
  const [makingOffer, setMakingOffer] = useState(false);
  const [userOffers, setUserOffers] = useState([]); // user's buy offers on selected NFT
  const [cancellingOffer, setCancellingOffer] = useState(null);

  // ── Load recent collections from localStorage ─────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nftRecentCollections');
      if (stored) setRecentCollections(JSON.parse(stored));
    } catch {}
  }, []);

  const saveRecentCollection = useCallback((col) => {
    setRecentCollections((prev) => {
      const entry = { slug: col.slug, name: col.name, logoImage: col.logoImage, floor: col.floor, items: col.items };
      const updated = [entry, ...prev.filter((r) => r.slug !== col.slug)].slice(0, 5);
      localStorage.setItem('nftRecentCollections', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ── Close dropdown on click outside ───────────────────────────
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  // ── Focus search input when dropdown opens ────────────────────
  useEffect(() => {
    if (dropdownOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
    else { setSearchQuery(''); setSearchResults([]); }
  }, [dropdownOpen]);

  // ── Search collections via API ────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearchLoading(true);
      api
        .post(`${BASE_URL}/search`, { search: searchQuery }, { signal: controller.signal })
        .then((res) => {
          setSearchResults(res.data?.collections?.slice(0, 12) || []);
        })
        .catch(() => {})
        .finally(() => setSearchLoading(false));
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [searchQuery]);

  // ── Fetch top collections ──────────────────────────────────────
  useEffect(() => {
    const ctrl = new AbortController();
    api
      .get(`${BASE_URL}/nft/collections?limit=12&sortBy=totalVol24h&order=desc`, {
        signal: ctrl.signal
      })
      .then((res) => {
        const cols = res.data?.collections || [];
        setCollections(cols);
        if (cols.length > 0 && !selectedSlug) {
          setSelectedSlug(cols[0].slug);
          setSelectedCollection(cols[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCollections(false));
    return () => ctrl.abort();
  }, []);

  // ── Fetch trending collections ────────────────────────────────
  useEffect(() => {
    const ctrl = new AbortController();
    api
      .get(`${BASE_URL}/nft/collections?limit=5&sortBy=trendingScore&order=desc`, {
        signal: ctrl.signal
      })
      .then((res) => {
        const cols = res.data?.collections || [];
        setTrendingCollections(cols);
        // Fetch floor sparklines for each
        cols.forEach((col) => {
          if (!col.slug) return;
          api.get(`${BASE_URL}/nft/collections/${col.slug}/sparkline?period=7d&lightweight=true&maxPoints=14`)
            .then((r) => {
              const prices = r.data?.data?.prices;
              if (prices?.length) setNftSparklines((prev) => ({ ...prev, [col.slug]: prices.map(Number) }));
            })
            .catch(() => {});
        });
      })
      .catch(() => {})
      .finally(() => setTrendingLoading(false));
    return () => ctrl.abort();
  }, []);

  // ── Fetch recent NFT sales from top trending collections ────
  useEffect(() => {
    if (!trendingCollections.length) return;
    const top3 = trendingCollections.slice(0, 3).filter((c) => c.slug);
    if (!top3.length) return;
    Promise.allSettled(
      top3.map((col) =>
        api.get(`${BASE_URL}/nft/collections/${col.slug}/history?limit=2&type=SALE`)
          .then((r) => (r.data?.history || []).map((h) => ({ ...h, _col: col })))
      )
    ).then((results) => {
      const all = results
        .filter((r) => r.status === 'fulfilled')
        .flatMap((r) => r.value)
        .sort((a, b) => (b.time || 0) - (a.time || 0))
        .slice(0, 5);
      if (all.length) setRecentNftSales(all);
    });
  }, [trendingCollections]);

  // ── Fetch global NFT stats ──────────────────────────────────
  useEffect(() => {
    api.get(`${BASE_URL}/nft/global-metrics`)
      .then((res) => { if (res.data) setNftGlobalStats(res.data); })
      .catch(() => {});
  }, []);

  // ── Fetch cheapest listed NFTs for selected collection ─────────
  useEffect(() => {
    if (!selectedSlug) return;
    const ctrl = new AbortController();
    setLoadingNfts(true);
    setNfts([]);
    setPreviewNft(null);
    api
      .get(
        `${BASE_URL}/nft/collections/${selectedSlug}/nfts?listed=xrp&sortBy=price-low&limit=6&page=0`,
        { signal: ctrl.signal }
      )
      .then((res) => {
        setNfts(res.data?.nfts || []);
      })
      .catch(() => {})
      .finally(() => setLoadingNfts(false));
    return () => ctrl.abort();
  }, [selectedSlug]);

  // ── Scroll detail panel into view ─────────────────────────────
  useEffect(() => {
    if (previewNft && detailPanelRef.current) {
      requestAnimationFrame(() => {
        detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }, [previewNft]);

  // ── Fetch user's buy offers for selected NFT ──────────────────
  useEffect(() => {
    if (!previewNft || !accountProfile?.account) { setUserOffers([]); return; }
    const nftId = previewNft.NFTokenID || previewNft.nftokenID || previewNft._id;
    if (!nftId) return;
    const ctrl = new AbortController();
    api
      .get(`${BASE_URL}/nft/offers/buy/${nftId}`, { signal: ctrl.signal })
      .then((res) => {
        const buyOffers = res.data?.offers || res.data?.buyOffers || [];
        setUserOffers(
          buyOffers
            .filter((o) => o.owner === accountProfile.account)
            .map((o) => ({
              id: o.nft_offer_index || o.index || o._id,
              amount: typeof o.amount === 'number' ? o.amount / 1_000_000 : Number(o.amount || 0) / 1_000_000,
              owner: o.owner
            }))
        );
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [previewNft, accountProfile?.account]);

  // ── Cancel NFT offer ──────────────────────────────────────────
  const handleCancelOffer = useCallback(
    async (offerId) => {
      if (!accountProfile?.account || !offerId) return;
      setCancellingOffer(offerId);
      const toastId = toast.loading('Cancelling offer...');

      try {
        const { Wallet } = await import('xrpl');
        const { EncryptedWalletStorage, deviceFingerprint } = await import(
          'src/utils/encryptedWalletStorage'
        );

        const walletStorage = new EncryptedWalletStorage();
        const deviceKeyId = await deviceFingerprint.getDeviceId();
        const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);
        if (!storedPassword) {
          toast.error('Wallet locked', { id: toastId });
          setCancellingOffer(null);
          return;
        }

        const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
        if (!walletData?.seed) {
          toast.error('Wallet error', { id: toastId });
          setCancellingOffer(null);
          return;
        }

        const seed = walletData.seed.trim();
        const algorithm = seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';
        const deviceWallet = Wallet.fromSeed(seed, { algorithm });

        toast.loading('Signing...', { id: toastId });
        const tx = {
          TransactionType: 'NFTokenCancelOffer',
          Account: accountProfile.account,
          NFTokenOffers: [offerId],
          SourceTag: 161803
        };

        const result = await submitTransaction(deviceWallet, tx);
        const txHash = result.hash;

        toast.loading('Confirming...', { id: toastId });
        for (let i = 0; i < 15; i++) {
          await new Promise((r) => setTimeout(r, 500));
          try {
            const txRes = await api.get(`${BASE_URL}/tx/${txHash}`);
            if (txRes.data?.validated) {
              const txResult = txRes.data?.meta?.TransactionResult || txRes.data?.engine_result;
              if (txResult === 'tesSUCCESS') {
                toast.success('Offer cancelled', { id: toastId });
                setUserOffers((prev) => prev.filter((o) => o.id !== offerId));
              } else {
                toast.error('Cancel failed', { id: toastId, description: txResult });
              }
              setCancellingOffer(null);
              return;
            }
          } catch { /* continue */ }
        }
        toast.success('Cancel submitted', { id: toastId, description: 'Validation pending...' });
      } catch (err) {
        console.error('Cancel offer error:', err);
        toast.error('Cancel failed', { id: toastId, description: err.message?.slice(0, 60) });
      } finally {
        setCancellingOffer(null);
      }
    },
    [accountProfile]
  );

  // ── Buy NFT (accept sell offer or create buy offer for brokered listings) ──
  const handleBuy = useCallback(
    async (nft) => {
      if (!accountProfile?.account) {
        toast.error('Connect your wallet first');
        return;
      }
      const nftId = nft.NFTokenID || nft.nftokenID || nft._id;
      if (!nftId) return;

      setBuyingNft(nftId);
      const toastId = toast.loading('Preparing purchase...');

      try {
        // 1. Fetch live sell offers
        const offersRes = await api.get(`${BASE_URL}/nft/offers/sell/${nftId}`);
        const sellOffers = offersRes.data?.offers || offersRes.data?.sellOffers || [];

        if (!sellOffers.length) {
          toast.error('No sell offers found', { id: toastId });
          setBuyingNft(null);
          return;
        }

        const nftOwner = nft.account || nft.owner;
        const sortByAmount = (a, b) => {
          const aAmt = typeof a.amount === 'object' ? parseFloat(a.amount?.value || 0) : Number(a.amount || 0);
          const bAmt = typeof b.amount === 'object' ? parseFloat(b.amount?.value || 0) : Number(b.amount || 0);
          return aAmt - bAmt;
        };

        // Try direct offers first (no destination, or destination is buyer)
        const directOffers = sellOffers
          .filter(
            (o) =>
              o.owner === nftOwner &&
              o.amount && Number(o.amount) > 0 &&
              o.orphaned !== 'yes' &&
              (!o.destination || o.destination === accountProfile.account) &&
              !o.fraud
          )
          .sort(sortByAmount);

        // If no direct offers, look for brokered offers
        const brokeredOffers = directOffers.length === 0
          ? sellOffers
              .filter(
                (o) =>
                  o.owner === nftOwner &&
                  o.amount && Number(o.amount) > 0 &&
                  o.orphaned !== 'yes' &&
                  o.destination &&
                  o.destination !== accountProfile.account &&
                  !o.fraud
              )
              .sort(sortByAmount)
          : [];

        const isBrokered = directOffers.length === 0 && brokeredOffers.length > 0;
        const offer = isBrokered ? brokeredOffers[0] : directOffers[0];

        if (!offer) {
          toast.error('No valid offers available', { id: toastId });
          setBuyingNft(null);
          return;
        }

        // 2. Get wallet
        toast.loading('Signing transaction...', { id: toastId });
        const { Wallet, xrpToDrops } = await import('xrpl');
        const { dropsToXrp } = await import('xrpl');
        const { EncryptedWalletStorage, deviceFingerprint } = await import(
          'src/utils/encryptedWalletStorage'
        );

        const walletStorage = new EncryptedWalletStorage();
        const deviceKeyId = await deviceFingerprint.getDeviceId();
        const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);
        if (!storedPassword) {
          toast.error('Wallet locked', { id: toastId, description: 'Please unlock first' });
          setBuyingNft(null);
          return;
        }

        const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
        if (!walletData?.seed) {
          toast.error('Wallet error', { id: toastId });
          setBuyingNft(null);
          return;
        }

        const seed = walletData.seed.trim();
        const algorithm = seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';
        const deviceWallet = Wallet.fromSeed(seed, { algorithm });

        // 3. Build transaction
        let tx;
        if (isBrokered) {
          // Brokered: create a buy offer with broker as Destination
          const baseAmount = parseFloat(dropsToXrp(offer.amount.toString()));
          const brokerInfo = BROKER_ADDRESSES[offer.destination];
          const brokerFeeRate = brokerInfo?.fee || 0.01589; // default XRP Cafe rate
          const brokerFee = parseFloat((baseAmount * brokerFeeRate).toFixed(6));
          const totalAmount = parseFloat((baseAmount + brokerFee).toFixed(6));

          toast.loading(`Buying via ${brokerInfo?.name || 'marketplace'}...`, { id: toastId });

          tx = {
            TransactionType: 'NFTokenCreateOffer',
            Account: accountProfile.account,
            NFTokenID: nftId,
            Owner: nftOwner,
            Amount: xrpToDrops(totalAmount.toString()),
            Destination: offer.destination, // Broker address
            Flags: 0, // Buy offer
            SourceTag: 161803
          };
        } else {
          // Direct: accept the sell offer
          const offerIndex = offer.nft_offer_index || offer.index;
          tx = {
            TransactionType: 'NFTokenAcceptOffer',
            Account: accountProfile.account,
            NFTokenSellOffer: offerIndex,
            SourceTag: 161803
          };
        }

        toast.loading('Submitting to XRPL...', { id: toastId });
        const result = await submitTransaction(deviceWallet, tx);
        const txHash = result.hash;

        // 4. Wait for validation
        toast.loading('Confirming...', { id: toastId });
        let validated = false;
        for (let i = 0; i < 15; i++) {
          await new Promise((r) => setTimeout(r, 500));
          try {
            const txRes = await api.get(`${BASE_URL}/tx/${txHash}`);
            if (txRes.data?.validated) {
              const txResult =
                txRes.data?.meta?.TransactionResult || txRes.data?.engine_result;
              if (txResult === 'tesSUCCESS') {
                validated = true;
              } else {
                toast.error('Purchase failed', { id: toastId, description: txResult });
                setBuyingNft(null);
                return;
              }
              break;
            }
          } catch {
            /* continue polling */
          }
        }

        if (validated) {
          const successMsg = isBrokered ? 'Buy offer placed!' : 'NFT purchased!';
          const successDesc = isBrokered
            ? 'Waiting for broker to complete trade...'
            : `TX: ${txHash.slice(0, 8)}...`;
          toast.success(successMsg, { id: toastId, description: successDesc });
          setSync?.((s) => s + 1);
          // Refresh listings
          setSelectedSlug((s) => {
            setTimeout(() => setSelectedSlug(s), 100);
            return null;
          });
        } else {
          toast.success('Purchase submitted', {
            id: toastId,
            description: 'Validation pending...'
          });
        }
      } catch (err) {
        console.error('NFT buy error:', err);
        toast.error('Purchase failed', {
          id: toastId,
          description: err.message?.slice(0, 60)
        });
      } finally {
        setBuyingNft(null);
        setPreviewNft(null);
      }
    },
    [accountProfile, setSync]
  );

  // ── Make Offer (NFTokenCreateOffer) ────────────────────────────
  const handleMakeOffer = useCallback(
    async (nft, xrpAmount) => {
      if (!accountProfile?.account) {
        toast.error('Connect your wallet first');
        return;
      }
      const nftId = nft.NFTokenID || nft.nftokenID || nft._id;
      if (!nftId) return;

      const amount = parseFloat(xrpAmount);
      if (!amount || amount <= 0) {
        toast.error('Enter a valid XRP amount');
        return;
      }

      setMakingOffer(true);
      const toastId = toast.loading('Preparing offer...');

      try {
        // Get wallet
        toast.loading('Signing transaction...', { id: toastId });
        const { Wallet } = await import('xrpl');
        const { xrpToDrops } = await import('xrpl');
        const { EncryptedWalletStorage, deviceFingerprint } = await import(
          'src/utils/encryptedWalletStorage'
        );

        const walletStorage = new EncryptedWalletStorage();
        const deviceKeyId = await deviceFingerprint.getDeviceId();
        const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);
        if (!storedPassword) {
          toast.error('Wallet locked', { id: toastId, description: 'Please unlock first' });
          setMakingOffer(false);
          return;
        }

        const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
        if (!walletData?.seed) {
          toast.error('Wallet error', { id: toastId });
          setMakingOffer(false);
          return;
        }

        const seed = walletData.seed.trim();
        const algorithm = seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';
        const deviceWallet = Wallet.fromSeed(seed, { algorithm });

        // Build NFTokenCreateOffer (buy offer)
        const nftOwner = nft.account || nft.owner;
        if (!nftOwner) {
          toast.error('Cannot determine NFT owner', { id: toastId });
          setMakingOffer(false);
          return;
        }

        const tx = {
          TransactionType: 'NFTokenCreateOffer',
          Account: accountProfile.account,
          NFTokenID: nftId,
          Amount: xrpToDrops(amount.toString()),
          Flags: 0, // 0 = buy offer
          Owner: nftOwner,
          SourceTag: 161803
        };

        toast.loading('Submitting to XRPL...', { id: toastId });
        const result = await submitTransaction(deviceWallet, tx);
        const txHash = result.hash;

        // Wait for validation
        toast.loading('Confirming...', { id: toastId });
        let validated = false;
        for (let i = 0; i < 15; i++) {
          await new Promise((r) => setTimeout(r, 500));
          try {
            const txRes = await api.get(`${BASE_URL}/tx/${txHash}`);
            if (txRes.data?.validated) {
              const txResult =
                txRes.data?.meta?.TransactionResult || txRes.data?.engine_result;
              if (txResult === 'tesSUCCESS') {
                validated = true;
              } else {
                toast.error('Offer failed', { id: toastId, description: txResult });
                setMakingOffer(false);
                return;
              }
              break;
            }
          } catch {
            /* continue polling */
          }
        }

        if (validated) {
          toast.success('Offer placed!', {
            id: toastId,
            description: `${amount} XRP offer submitted`
          });
          setOfferAmount('');
          setSync?.((s) => s + 1);
          // Add to userOffers so cancel button appears immediately
          if (txHash) {
            setUserOffers((prev) => [...prev, { id: txHash, amount, owner: accountProfile.account }]);
          }
        } else {
          toast.success('Offer submitted', {
            id: toastId,
            description: 'Validation pending...'
          });
        }
      } catch (err) {
        console.error('NFT offer error:', err);
        toast.error('Offer failed', {
          id: toastId,
          description: err.message?.slice(0, 60)
        });
      } finally {
        setMakingOffer(false);
      }
    },
    [accountProfile, setSync]
  );

  // ── Derived ────────────────────────────────────────────────────
  const floorNft = nfts[0] || null;
  const topNfts = nfts.slice(0, 6);
  const previewNftId = previewNft ? (previewNft.NFTokenID || previewNft.nftokenID || previewNft._id) : null;

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        'w-full rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 md:p-8 border-[1.5px] relative overflow-hidden backdrop-blur-3xl',
        isDark
          ? 'border-white/[0.06] bg-white/[0.01]'
          : 'border-[#E2E8F0] bg-white/40'
      )}
    >
      {/* Background glow */}
      {isDark && (
        <div className="absolute -bottom-[30%] -left-[20%] w-[50%] h-[50%] bg-purple-500/[0.03] rounded-full blur-[80px] pointer-events-none" />
      )}

      {/* ── Global NFT Stats ──────────────────────────────────── */}
      {nftGlobalStats && (
        <div className={cn(
          'flex items-center justify-center gap-4 sm:gap-5 mb-3 flex-wrap',
        )}>
          {[
            { label: '24h Volume', value: `${fmtStat(nftGlobalStats.total24hVolume)} XRP` },
            { label: 'Sales', value: fmtStat(nftGlobalStats.total24hSales) },
            { label: 'Traders', value: fmtStat(nftGlobalStats.activeTraders24h) },
            { label: 'Mints', value: fmtStat(nftGlobalStats.total24hMints) },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={cn('text-[10px] font-mono', isDark ? 'text-white/25' : 'text-black/25')}>
                {label}
              </span>
              <span className={cn('text-[10px] font-mono font-semibold', isDark ? 'text-white/50' : 'text-black/50')}>
                {value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Collection Dropdown ──────────────────────────────── */}
      <div className="relative z-20 mb-4" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-[1.5px] transition-all cursor-pointer bg-transparent',
            dropdownOpen
              ? isDark
                ? 'border-[#650CD4]/60 bg-[#650CD4]/5'
                : 'border-[#650CD4]/40 bg-[#650CD4]/5'
              : isDark
                ? 'border-white/[0.06] hover:border-white/[0.12]'
                : 'border-gray-200 hover:border-gray-300'
          )}
        >
          {loadingCollections ? (
            <div className="flex items-center gap-2">
              <div className={cn('w-7 h-7 rounded-lg animate-pulse', isDark ? 'bg-white/[0.06]' : 'bg-gray-200')} />
              <div className={cn('w-24 h-4 rounded animate-pulse', isDark ? 'bg-white/[0.06]' : 'bg-gray-200')} />
            </div>
          ) : selectedCollection ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={collectionImg(selectedCollection.logoImage)}
                alt=""
                className="w-7 h-7 rounded-lg object-cover flex-shrink-0"
                onError={(e) => { e.target.src = '/static/alt.webp'; }}
              />
              <div className="flex flex-col min-w-0">
                <span className={cn('text-[13px] font-semibold truncate', isDark ? 'text-white' : 'text-gray-900')}>
                  {selectedCollection.name}
                </span>
                <div className="flex items-center gap-3">
                  {selectedCollection.floor > 0 && (
                    <span className={cn('text-[10px] font-mono', isDark ? 'text-white/40' : 'text-gray-400')}>
                      Floor {fNumber(selectedCollection.floor)} XRP
                    </span>
                  )}
                  {selectedCollection.items > 0 && (
                    <span className={cn('text-[10px] font-mono', isDark ? 'text-white/30' : 'text-gray-400')}>
                      {fNumber(selectedCollection.items)} items
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <span className={cn('text-[13px]', isDark ? 'text-white/40' : 'text-gray-400')}>
              Select collection
            </span>
          )}
          <div className="flex items-center gap-2 flex-shrink-0">
            {selectedCollection && (
              <a
                href={`/nfts/${selectedSlug}`}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'p-1 rounded-md transition-colors',
                  isDark ? 'hover:bg-white/[0.06] text-white/30' : 'hover:bg-gray-100 text-gray-400'
                )}
              >
                <ExternalLink size={13} />
              </a>
            )}
            <ChevronDown
              size={16}
              className={cn(
                'transition-transform duration-200',
                dropdownOpen && 'rotate-180',
                isDark ? 'text-white/40' : 'text-gray-400'
              )}
            />
          </div>
        </button>

        {/* Dropdown list */}
        {dropdownOpen && !loadingCollections && (
          <div
            className={cn(
              'absolute left-0 right-0 top-[calc(100%+4px)] rounded-xl border-[1.5px] overflow-hidden',
              isDark
                ? 'border-white/[0.08] bg-[#0a0a0f]/95 backdrop-blur-xl'
                : 'border-gray-200 bg-white/95 backdrop-blur-xl'
            )}
          >
            {/* Search input */}
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 border-b-[1.5px]',
              isDark ? 'border-white/[0.06]' : 'border-gray-200'
            )}>
              <Search size={14} className={isDark ? 'text-white/30' : 'text-gray-400'} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'flex-1 bg-transparent outline-none border-none text-[12px]',
                  isDark ? 'text-white placeholder:text-white/20' : 'text-gray-900 placeholder:text-gray-400'
                )}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-0.5 border-none bg-transparent cursor-pointer"
                >
                  <X size={12} className={isDark ? 'text-white/30' : 'text-gray-400'} />
                </button>
              )}
            </div>

            {/* Collection list */}
            <div className="max-h-[240px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {/* Recent collections */}
              {!searchQuery.trim() && recentCollections.length > 0 && (
                <div className={cn('border-b-[1.5px]', isDark ? 'border-white/[0.06]' : 'border-gray-200')}>
                  <div className="flex items-center justify-between px-3 pt-2 pb-1">
                    <span className={cn('text-[10px] font-semibold uppercase tracking-wider', isDark ? 'text-white/30' : 'text-gray-400')}>
                      Recent
                    </span>
                    <button
                      onClick={() => { setRecentCollections([]); localStorage.removeItem('nftRecentCollections'); }}
                      className={cn('text-[10px] border-none bg-transparent cursor-pointer', isDark ? 'text-white/20 hover:text-white/40' : 'text-gray-400 hover:text-gray-500')}
                    >
                      Clear
                    </button>
                  </div>
                  {recentCollections.map((col) => (
                    <button
                      key={`recent-${col.slug}`}
                      onClick={() => {
                        setSelectedSlug(col.slug);
                        setSelectedCollection(col);
                        setDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2 transition-colors cursor-pointer bg-transparent text-left border-none',
                        col.slug === selectedSlug
                          ? isDark ? 'bg-[#650CD4]/10' : 'bg-[#650CD4]/5'
                          : isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'
                      )}
                    >
                      <img
                        src={collectionImg(col.logoImage)}
                        alt=""
                        className="w-6 h-6 rounded-md object-cover flex-shrink-0"
                        onError={(e) => { e.target.src = '/static/alt.webp'; }}
                      />
                      <span className={cn('text-[12px] font-semibold truncate', isDark ? 'text-white/70' : 'text-gray-700')}>
                        {col.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {(() => {
                const displayList = searchQuery.trim() ? searchResults : collections;
                if (searchLoading && searchQuery.trim()) {
                  return (
                    <div className="flex items-center justify-center py-6">
                      <div className="w-4 h-4 border-2 border-[#650CD4]/20 border-t-[#650CD4] rounded-full animate-spin" />
                    </div>
                  );
                }
                if (searchQuery.trim() && !displayList.length) {
                  return (
                    <div className={cn('text-center py-6 text-[12px]', isDark ? 'text-white/30' : 'text-gray-400')}>
                      No collections found
                    </div>
                  );
                }
                return displayList.map((col) => {
                  const isSelected = col.slug === selectedSlug;
                  return (
                    <button
                      key={col.slug}
                      onClick={() => {
                        setSelectedSlug(col.slug);
                        setSelectedCollection(col);
                        setDropdownOpen(false);
                        if (searchQuery.trim()) saveRecentCollection(col);
                      }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors cursor-pointer bg-transparent text-left border-none',
                        isSelected
                          ? isDark
                            ? 'bg-[#650CD4]/10'
                            : 'bg-[#650CD4]/5'
                          : isDark
                            ? 'hover:bg-white/[0.04]'
                            : 'hover:bg-gray-50'
                      )}
                    >
                      <img
                        src={collectionImg(col.logoImage)}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                        loading="lazy"
                        onError={(e) => { e.target.src = '/static/alt.webp'; }}
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span
                          className={cn(
                            'text-[12px] font-semibold truncate',
                            isSelected
                              ? 'text-[#650CD4]'
                              : isDark ? 'text-white/80' : 'text-gray-800'
                          )}
                        >
                          {col.name}
                        </span>
                        <div className="flex items-center gap-3">
                          {col.floor > 0 && (
                            <span className={cn('text-[10px] font-mono', isDark ? 'text-white/30' : 'text-gray-400')}>
                              Floor {fNumber(col.floor)} XRP
                            </span>
                          )}
                          {col.items > 0 && (
                            <span className={cn('text-[10px] font-mono', isDark ? 'text-white/25' : 'text-gray-400')}>
                              {fNumber(col.items)} items
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#650CD4] flex-shrink-0" />
                      )}
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </div>

      {/* ── NFT Listings Grid ─────────────────────────────────── */}
      <div className="relative z-10">
        {loadingNfts ? (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-xl aspect-square animate-pulse border-[1.5px]',
                  isDark
                    ? 'bg-white/[0.02] border-white/[0.04]'
                    : 'bg-gray-100 border-gray-200'
                )}
              />
            ))}
          </div>
        ) : topNfts.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {topNfts.map((nft, i) => {
              const nftId = nft.NFTokenID || nft.nftokenID || nft._id;
              const price = xrpPrice(nft.cost);
              const name =
                nft.name || nft.meta?.name || `#${nft.sequence ?? nft.serial ?? i + 1}`;
              const isFloor = i === 0;
              const isBuying = buyingNft === nftId;
              const isSelected = previewNftId === nftId;

              return (
                <button
                  key={nftId || i}
                  onClick={() => {
                    if (isSelected) {
                      setPreviewNft(null);
                    } else {
                      setPreviewNft(nft);
                      setActionMode('buy');
                      setOfferAmount('');
                    }
                  }}
                  className={cn(
                    'flex flex-col rounded-xl border-[1.5px] overflow-hidden transition-all duration-200 group cursor-pointer relative bg-transparent text-left',
                    isSelected
                      ? 'border-[#650CD4] ring-1 ring-[#650CD4]/30'
                      : isFloor
                        ? isDark
                          ? 'border-[#650CD4]/40 hover:border-[#650CD4]/60'
                          : 'border-[#650CD4]/30 hover:border-[#650CD4]/50'
                        : isDark
                          ? 'border-white/[0.06] hover:border-white/[0.12]'
                          : 'border-gray-200 hover:border-gray-300',
                    'hover:scale-[1.02] active:scale-[0.98]'
                  )}
                >
                  {/* Floor badge */}
                  {isFloor && (
                    <div className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded-md bg-[#650CD4] text-white text-[8px] font-bold uppercase tracking-wider">
                      Floor
                    </div>
                  )}

                  {/* Image */}
                  <div
                    className={cn(
                      'aspect-square overflow-hidden',
                      isDark ? 'bg-white/[0.03]' : 'bg-gray-100'
                    )}
                  >
                    <img
                      src={nftImg(nft, 'medium')}
                      alt={name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = '/static/alt.webp';
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="p-2 flex flex-col gap-1">
                    <span
                      className={cn(
                        'text-[10px] sm:text-[11px] font-semibold truncate',
                        isDark ? 'text-white/80' : 'text-gray-800'
                      )}
                    >
                      {name}
                    </span>
                    {price !== null && (
                      <span
                        className={cn(
                          'text-[11px] sm:text-[12px] font-mono font-bold',
                          isDark ? 'text-white' : 'text-gray-900'
                        )}
                      >
                        {fNumber(price)} XRP
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div
            className={cn(
              'flex flex-col items-center justify-center py-10 gap-2',
              isDark ? 'text-white/30' : 'text-gray-400'
            )}
          >
            <ImageIcon size={24} />
            <span className="text-[12px]">No NFTs listed for sale</span>
          </div>
        )}
      </div>

      {/* ── Inline Detail Panel ─────────────────────────────────── */}
      {previewNft && (
        <div
          ref={detailPanelRef}
          className={cn(
            'mt-4 rounded-xl border-[1.5px] overflow-hidden relative z-10 animate-in fade-in duration-200',
            isDark
              ? 'border-white/[0.08] bg-white/[0.02]'
              : 'border-gray-200 bg-gray-50/50'
          )}
        >
          {/* NFT Info Row */}
          <div className="flex gap-4 p-4">
            {/* Image */}
            <img
              src={nftImg(previewNft, 'large')}
              alt={previewNft.name || previewNft.meta?.name || 'NFT'}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover flex-shrink-0"
              onError={(e) => { e.target.src = '/static/alt.webp'; }}
            />

            {/* Details */}
            <div className="flex flex-col flex-1 min-w-0 gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <h3
                  className={cn(
                    'text-[14px] sm:text-[15px] font-bold truncate',
                    isDark ? 'text-white' : 'text-gray-900'
                  )}
                >
                  {previewNft.name || previewNft.meta?.name || `NFT #${previewNft.sequence || ''}`}
                </h3>
                <button
                  onClick={() => setPreviewNft(null)}
                  className={cn(
                    'p-1 rounded-lg transition-colors flex-shrink-0 border-none cursor-pointer',
                    isDark
                      ? 'text-white/40 hover:text-white/70 hover:bg-white/[0.06]'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <X size={14} />
                </button>
              </div>

              {selectedCollection && (
                <a
                  href={`/nfts/${selectedSlug}`}
                  className="text-[11px] font-medium no-underline text-[#650CD4]"
                >
                  {selectedCollection.name}
                </a>
              )}

              {xrpPrice(previewNft.cost) !== null && (
                <span className={cn('text-[14px] font-mono font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                  {fNumber(xrpPrice(previewNft.cost))} XRP
                </span>
              )}

              {previewNft.rarity_rank > 0 && (
                <span className={cn('text-[11px] font-mono', isDark ? 'text-white/40' : 'text-gray-500')}>
                  Rarity #{previewNft.rarity_rank}
                </span>
              )}
            </div>
          </div>

          {/* Action Tabs */}
          <div className={cn(
            'border-t-[1.5px] px-4 pt-3 pb-4',
            isDark ? 'border-white/[0.06]' : 'border-gray-200'
          )}>
            <div role="tablist" aria-label="Action type" className={cn(
              'flex p-0.5 rounded-lg mb-3 border-[1.5px]',
              isDark ? 'bg-white/5 border-white/[0.06]' : 'bg-gray-100 border-gray-200'
            )}>
              <button
                role="tab"
                aria-selected={actionMode === 'buy'}
                onClick={() => setActionMode('buy')}
                className={cn(
                  'flex-1 px-3 py-1.5 rounded-md text-[12px] font-bold transition-all duration-200 outline-none',
                  actionMode === 'buy'
                    ? 'bg-[#650CD4] text-white'
                    : isDark
                      ? 'text-white/40 hover:text-white/60'
                      : 'text-gray-500 hover:text-gray-700'
                )}
              >
                Buy Now
              </button>
              <button
                role="tab"
                aria-selected={actionMode === 'offer'}
                onClick={() => setActionMode('offer')}
                className={cn(
                  'flex-1 px-3 py-1.5 rounded-md text-[12px] font-bold transition-all duration-200 outline-none',
                  actionMode === 'offer'
                    ? 'bg-[#650CD4] text-white'
                    : isDark
                      ? 'text-white/40 hover:text-white/60'
                      : 'text-gray-500 hover:text-gray-700'
                )}
              >
                Make Offer
              </button>
            </div>

            {/* Buy Now Action */}
            {actionMode === 'buy' && (
              accountProfile?.account ? (
                <button
                  onClick={() => handleBuy(previewNft)}
                  disabled={!!buyingNft}
                  className={cn(
                    'w-full py-3 rounded-xl text-[13px] font-bold transition-all duration-300 flex items-center justify-center gap-2 border-none cursor-pointer',
                    buyingNft
                      ? isDark
                        ? 'bg-white/5 text-white/20 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#650CD4] text-white hover:bg-[#650CD4]/90 active:scale-[0.98]'
                  )}
                >
                  {buyingNft ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Purchasing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={15} />
                      Buy for {xrpPrice(previewNft.cost) !== null ? `${fNumber(xrpPrice(previewNft.cost))} XRP` : 'N/A'}
                    </>
                  )}
                </button>
              ) : (
                <ConnectWallet
                  text="Connect to Buy"
                  fullWidth
                  className="!py-2.5 !px-3 !rounded-xl !text-[12px] sm:!text-[13px] !font-bold !bg-[#650CD4] !text-white !whitespace-nowrap !overflow-hidden !text-ellipsis"
                />
              )
            )}

            {/* Make Offer Action */}
            {actionMode === 'offer' && (
              accountProfile?.account ? (
                <div className="flex flex-col gap-3">
                  <div className={cn(
                    'flex items-center rounded-xl border-[1.5px] overflow-hidden',
                    isDark ? 'border-white/[0.08] bg-transparent' : 'border-gray-200 bg-white'
                  )}>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(e.target.value)}
                      className={cn(
                        'flex-1 px-3 py-2.5 text-[15px] font-mono bg-transparent outline-none border-none',
                        isDark ? 'text-white placeholder:text-white/20' : 'text-gray-900 placeholder:text-gray-300'
                      )}
                    />
                    <span className={cn(
                      'px-3 text-[12px] font-bold',
                      isDark ? 'text-white/40' : 'text-gray-400'
                    )}>
                      XRP
                    </span>
                  </div>
                  <button
                    onClick={() => handleMakeOffer(previewNft, offerAmount)}
                    disabled={makingOffer || !offerAmount || parseFloat(offerAmount) <= 0}
                    className={cn(
                      'w-full py-3 rounded-xl text-[13px] font-bold transition-all duration-300 flex items-center justify-center gap-2 border-none cursor-pointer',
                      makingOffer || !offerAmount || parseFloat(offerAmount) <= 0
                        ? isDark
                          ? 'bg-white/5 text-white/20 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-[#650CD4] text-white hover:bg-[#650CD4]/90 active:scale-[0.98]'
                    )}
                  >
                    {makingOffer ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <HandCoins size={15} />
                        {offerAmount && parseFloat(offerAmount) > 0
                          ? `Offer ${fNumber(parseFloat(offerAmount))} XRP`
                          : 'Enter Amount'}
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <ConnectWallet
                  text="Connect to Offer"
                  fullWidth
                  className="!py-2.5 !px-3 !rounded-xl !text-[12px] sm:!text-[13px] !font-bold !bg-[#650CD4] !text-white !whitespace-nowrap !overflow-hidden !text-ellipsis"
                />
              )
            )}

            {/* Your Offers */}
            {userOffers.length > 0 && (
              <div className={cn(
                'mt-3 pt-3 border-t-[1.5px]',
                isDark ? 'border-white/[0.06]' : 'border-gray-200'
              )}>
                <span className={cn('text-[11px] font-semibold uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>
                  Your Offers
                </span>
                <div className="mt-2 flex flex-col gap-1.5">
                  {userOffers.map((offer) => (
                    <div
                      key={offer.id}
                      className={cn(
                        'flex items-center justify-between px-2.5 py-2 rounded-lg border-[1.5px]',
                        isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-gray-200 bg-gray-50'
                      )}
                    >
                      <span className={cn('text-[12px] font-mono font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                        {fNumber(offer.amount)} XRP
                      </span>
                      <button
                        onClick={() => handleCancelOffer(offer.id)}
                        disabled={cancellingOffer === offer.id}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-[11px] font-semibold border-[1.5px] transition-colors cursor-pointer',
                          cancellingOffer === offer.id
                            ? isDark
                              ? 'border-white/[0.06] text-white/20 cursor-not-allowed bg-transparent'
                              : 'border-gray-200 text-gray-400 cursor-not-allowed bg-transparent'
                            : isDark
                              ? 'border-red-500/30 text-red-400 hover:bg-red-500/10 bg-transparent'
                              : 'border-red-300 text-red-500 hover:bg-red-50 bg-transparent'
                        )}
                      >
                        {cancellingOffer === offer.id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* View full details link */}
            <a
              href={`/nft/${previewNft.NFTokenID || previewNft.nftokenID || previewNft._id}`}
              className={cn(
                'block text-center text-[11px] font-medium mt-2.5 no-underline transition-colors',
                isDark ? 'text-white/30 hover:text-white/50' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              View full details
            </a>
          </div>
        </div>
      )}
      {/* ── Trending Collections ──────────────────────────────── */}
      <div className={cn(
        'mt-4 rounded-xl border-[1.5px] p-4 sm:p-5 relative overflow-hidden',
        isDark
          ? 'border-white/[0.06] bg-white/[0.01]'
          : 'border-[#E2E8F0] bg-white/40'
      )}>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-6 h-6 rounded-lg flex items-center justify-center',
              isDark ? 'bg-white/[0.06]' : 'bg-[#137DFE]/10'
            )}>
              <TrendingUp size={12} className={isDark ? 'text-white/60' : 'text-[#137DFE]'} />
            </div>
            <span className={cn(
              'text-[12px] sm:text-[13px] font-bold uppercase tracking-[1.5px] font-mono',
              isDark ? 'text-[#F5F5F5]' : 'text-[#0F172A]'
            )}>
              Trending Collections
            </span>
          </div>
          <button
            onClick={() => setBoostCollection(trendingCollections[0] || null)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold tracking-wide transition-all border cursor-pointer',
              'bg-[#F6AF01]/10 text-[#F6AF01] border-[#F6AF01]/20',
              'hover:bg-[#F6AF01]/20 hover:border-[#F6AF01]/40'
            )}
          >
            Boost Trending
          </button>
        </div>

        <div className="flex flex-col gap-1">
          {trendingLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className={cn(
                'h-12 rounded-lg animate-pulse',
                isDark ? 'bg-white/[0.03]' : 'bg-gray-100'
              )} />
            ))
          ) : trendingCollections.length > 0 ? (
            trendingCollections.map((col, i) => {
              const isBoosted = col.trendingBoost > 0 && col.trendingBoostExpires > Date.now();
              const floorChange = col.floor1dPercent || 0;
              const isUp = floorChange >= 0;
              const rankColors = ['text-[#FFD700]', 'text-[#C0C0C0]', 'text-[#CD7F32]'];
              const listed = col.listedCount || 0;
              const items = col.items || 0;
              const listedPct = items > 0 ? Math.round((listed / items) * 100) : 0;

              return (
                <button
                  key={col.slug || i}
                  onClick={() => {
                    setSelectedSlug(col.slug);
                    setSelectedCollection(col);
                    saveRecentCollection(col);
                  }}
                  className={cn(
                    'grid items-center gap-2 w-full px-2 py-1.5 rounded-lg transition-all duration-200 border-none cursor-pointer text-left',
                    isDark ? 'bg-transparent hover:bg-white/[0.04]' : 'bg-transparent hover:bg-gray-50'
                  )}
                  style={{ gridTemplateColumns: '20px 28px 1fr 72px 56px 56px 48px 80px 52px' }}
                >
                  {/* Rank */}
                  <span className={cn(
                    'text-[11px] font-mono font-bold text-center',
                    i < 3 ? rankColors[i] : isDark ? 'text-white/20' : 'text-gray-300'
                  )}>
                    {i + 1}
                  </span>

                  {/* Logo */}
                  <div className={cn(
                    'w-7 h-7 rounded-lg overflow-hidden border-[1.5px]',
                    isDark ? 'border-white/[0.06] bg-white/[0.03]' : 'border-[#E2E8F0] bg-white'
                  )}>
                    <img src={collectionImg(col.logoImage)} alt="" className="w-full h-full object-cover" loading="lazy" onError={(e) => { e.target.src = '/static/alt.webp'; }} />
                  </div>

                  {/* Name + boost */}
                  <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                    <span className={cn(
                      'text-[12px] font-semibold truncate',
                      isBoosted && col.trendingBoost >= 500 ? 'text-[#FFD700]' : isDark ? 'text-[#F5F5F5]' : 'text-[#0F172A]'
                    )}>
                      {col.name}
                    </span>
                    {isBoosted && (
                      <span className="inline-flex items-center gap-0.5 flex-shrink-0 text-[#F6AF01]">
                        <Flame size={10} fill="#F6AF01" />
                        <span className="text-[9px] font-bold">{col.trendingBoost}</span>
                      </span>
                    )}
                  </div>

                  {/* Owners */}
                  <span className={cn('text-[11px] font-mono text-right tabular-nums', isDark ? 'text-white/50' : 'text-black/50')}>
                    {fmtStat(col.owners || 0)} <span className={cn('text-[9px]', isDark ? 'text-white/30' : 'text-black/30')}>owners</span>
                  </span>

                  {/* 24h Sales */}
                  <span className={cn('text-[11px] font-mono text-right tabular-nums', isDark ? 'text-white/50' : 'text-black/50')}>
                    {fmtStat(col.sales24h || 0)} <span className={cn('text-[9px]', isDark ? 'text-white/30' : 'text-black/30')}>sales</span>
                  </span>

                  {/* Listed */}
                  <span className={cn('text-[11px] font-mono text-right tabular-nums', isDark ? 'text-white/50' : 'text-black/50')}>
                    {fmtStat(listed)} <span className={cn('text-[9px]', isDark ? 'text-white/30' : 'text-black/30')}>listed</span>
                  </span>

                  {/* Sparkline */}
                  <MiniSparkline data={nftSparklines[col.slug]} color={isUp ? '#08AA09' : '#ef4444'} width={48} height={16} />

                  {/* Floor */}
                  <span className={cn('text-[11px] font-mono font-medium text-right tabular-nums', isDark ? 'text-white/70' : 'text-[#0F172A]/70')}>
                    {col.floor > 0 ? `${fNumber(col.floor)} XRP` : '-'}
                  </span>
                  {/* Floor change */}
                  <span className={cn('text-[11px] font-mono font-bold text-right tabular-nums min-w-[48px]', isUp ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                    {floorChange !== 0 ? `${isUp ? '+' : ''}${floorChange.toFixed(1)}%` : '-'}
                  </span>
                </button>
              );
            })
          ) : (
            <div className={cn('text-center py-4 text-[12px]', isDark ? 'text-white/30' : 'text-gray-400')}>
              No trending collections
            </div>
          )}
        </div>

        {/* Boost CTA footer */}
        {!trendingLoading && trendingCollections.length > 0 && (
          <div className={cn(
            'flex items-center justify-between mt-2 pt-3 border-t',
            isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
          )}>
            <div className="flex items-center gap-2">
              <Flame size={12} className="text-[#F6AF01]" fill="#F6AF01" />
              <span className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-black/40')}>
                Want your collection here?
              </span>
            </div>
            <button
              onClick={() => setBoostCollection(trendingCollections[0])}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold tracking-wide transition-all border cursor-pointer',
                'bg-[#F6AF01]/10 text-[#F6AF01] border-[#F6AF01]/20',
                'hover:bg-[#F6AF01]/20 hover:border-[#F6AF01]/40'
              )}
            >
              Boost Trending
            </button>
          </div>
        )}
      </div>

      {/* ── Recent NFT Sales ──────────────────────────────────── */}
      {recentNftSales.length > 0 && (
      <div className={cn(
        'mt-4 rounded-xl border-[1.5px] p-4 sm:p-5 relative overflow-hidden',
        isDark
          ? 'border-white/[0.06] bg-white/[0.01]'
          : 'border-[#E2E8F0] bg-white/40'
      )}>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div className={cn(
            'w-6 h-6 rounded-lg flex items-center justify-center',
            isDark ? 'bg-white/[0.06]' : 'bg-[#137DFE]/10'
          )}>
            <Zap size={12} className={isDark ? 'text-white/60' : 'text-[#137DFE]'} />
          </div>
          <span className={cn(
            'text-[12px] sm:text-[13px] font-bold uppercase tracking-[1.5px] font-mono',
            isDark ? 'text-[#F5F5F5]' : 'text-[#0F172A]'
          )}>
            Recent Sales
          </span>
        </div>
        <div className="flex flex-col gap-1">
          {recentNftSales.map((sale, i) => {
            const col = sale._col;
            const price = sale.costXRP || 0;
            const buyer = sale.buyer || '';
            const seller = sale.seller || '';
            const origin = sale.origin || '';
            const maxPrice = Math.max(...recentNftSales.map((s) => s.costXRP || 0));
            const barPct = maxPrice > 0 ? Math.max(8, Math.min(100, Math.sqrt(price / maxPrice) * 100)) : 8;
            const barBg = isDark
              ? 'linear-gradient(90deg, rgba(34,197,94,0.18) 0%, rgba(34,197,94,0.05) 100%)'
              : 'linear-gradient(90deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.03) 100%)';
            const barBorder = isDark ? '#22c55e' : '#16a34a';
            const elapsed = sale.time ? (() => {
              const s = Math.floor((Date.now() - sale.time) / 1000);
              if (s < 60) return `${s}s ago`;
              if (s < 3600) return `${Math.floor(s / 60)}m ago`;
              if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
              return `${Math.floor(s / 86400)}d ago`;
            })() : '';
            return (
              <button
                key={sale.hash || sale.NFTokenID || i}
                onClick={() => {
                  if (col?.slug) {
                    setSelectedSlug(col.slug);
                    setSelectedCollection(col);
                  }
                }}
                className={cn(
                  'grid items-center gap-2 w-full px-2 py-1.5 rounded-lg transition-all duration-200 text-left cursor-pointer',
                  isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'
                )}
                style={{ gridTemplateColumns: '52px 36px 1fr 1fr 72px' }}
              >
                {/* Time */}
                <span suppressHydrationWarning className={cn('text-[11px] font-semibold tabular-nums', isDark ? 'text-white/60' : 'text-black/60')}>
                  {elapsed}
                </span>
                {/* Sale label */}
                <span className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-[#22c55e]">
                  Sale
                </span>
                {/* Collection name with bar */}
                <div className="relative flex items-center h-7 px-[10px] rounded-[6px] overflow-hidden">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[80%] rounded-sm" style={{ width: `${barPct}%`, background: barBg, borderLeft: `3px solid ${barBorder}`, transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)' }} />
                  <span className={cn('relative z-[1] text-[11px] font-mono font-medium truncate', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
                    {col?.name || sale.name || 'NFT'}
                    {origin && <span className="opacity-50 text-[9px] font-normal ml-1">{origin}</span>}
                  </span>
                </div>
                {/* XRP price with bar */}
                <div className="relative flex items-center h-7 px-[10px] rounded-[6px] overflow-hidden">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[80%] rounded-sm" style={{ width: `${barPct}%`, background: barBg, borderLeft: `3px solid ${barBorder}`, transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)' }} />
                  <span className={cn('relative z-[1] text-[11px] font-mono font-medium', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
                    {fmtStat(price)}{' '}
                    <span className="opacity-60 text-[9px] font-normal">XRP</span>
                  </span>
                </div>
                {/* Buyer address */}
                <a
                  href={`/address/${buyer}`}
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    'inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px] font-mono no-underline truncate',
                    isDark
                      ? 'bg-white/[0.03] border-white/[0.06] text-white/50 hover:text-white/80'
                      : 'bg-black/[0.02] border-black/[0.04] text-gray-500 hover:text-gray-900'
                  )}
                  title={buyer}
                >
                  {buyer ? `${buyer.slice(0, 4)}...${buyer.slice(-4)}` : '-'}
                </a>
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* ── Boost Modal ────────────────────────────────────────── */}
      {boostCollection && (
        <BoostModal
          collection={boostCollection}
          onClose={() => setBoostCollection(null)}
          onSuccess={() => setBoostCollection(null)}
        />
      )}
    </div>
  );
}

export default memo(NFTQuickBuy);
