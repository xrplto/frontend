import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { withdrawalStorage } from 'src/utils/withdrawalStorage';
import {
  Send, ArrowDownLeft, ArrowUpRight, Copy, Check, QrCode,
  Wallet, Image, RotateCcw, TrendingUp, Building2,
  ChevronRight, ExternalLink, ArrowRightLeft, ChevronDown,
  Search, SlidersHorizontal, Eye, EyeOff, Plus, Trash2, X, Star
} from 'lucide-react';
import Link from 'next/link';

// Mock data
const MOCK_TOKENS = [
  { symbol: 'XRP', name: 'XRP', amount: '1,250.50', value: '$625.25', change: '+2.4%', positive: true, color: '#23292F', icon: '◎', slug: null },
  { symbol: 'SOLO', name: 'Sologenic', amount: '5,000.00', value: '$245.00', change: '+5.2%', positive: true, color: '#00D4AA', slug: 'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz-534F4C4F00000000000000000000000000000000' },
  { symbol: 'LUSD', name: 'LUSD', amount: '500.00', value: '$500.00', change: '+0.1%', positive: true, color: '#4285f4', slug: 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De-524C555344000000000000000000000000000000' },
  { symbol: 'CSC', name: 'CasinoCoin', amount: '125,000', value: '$187.50', change: '-1.8%', positive: false, color: '#E91E63', slug: 'rCSCManTZ8ME9EoLrSHHYKW8PPwWMgkwr-4353430000000000000000000000000000000000' },
  { symbol: 'CORE', name: 'Coreum', amount: '820.00', value: '$164.00', change: '+3.1%', positive: true, color: '#25D695', slug: 'rcoreNywaoz2ZCQ8Lg2EbSLnGuRBmun6D-434F524500000000000000000000000000000000' },
];

const MOCK_TOKEN_OFFERS = [
  { id: 1, type: 'sell', from: '100 SOLO', to: '50 XRP', rate: '0.5 XRP/SOLO', created: '2h ago' },
  { id: 2, type: 'buy', from: '200 XRP', to: '1000 CSC', rate: '0.2 XRP/CSC', created: '5h ago' },
  { id: 3, type: 'sell', from: '50 CORE', to: '25 XRP', rate: '0.5 XRP/CORE', created: '1d ago' },
];

const MOCK_NFT_OFFERS = [
  { id: 1, type: 'sell', nft: 'xPunk #1234', collection: 'xPunks', price: '50 XRP', image: 'https://placehold.co/60x60/1a1a2e/white?text=xP', created: '1h ago' },
  { id: 2, type: 'buy', nft: 'Magnetic #412', collection: 'Magnetic', price: '30 XRP', image: 'https://placehold.co/60x60/3d1a4d/white?text=M', created: '4h ago' },
  { id: 3, type: 'sell', nft: 'xSpectar Land #88', collection: 'xSpectar', price: '200 XRP', image: 'https://placehold.co/60x60/1e3a5f/white?text=xS', created: '1d ago' },
];


const MOCK_TRADES = [
  { id: 1, type: 'buy', pair: 'SOLO/XRP', amount: '500 SOLO', price: '0.049 XRP', total: '24.5 XRP', time: '10m ago' },
  { id: 2, type: 'sell', pair: 'CSC/XRP', amount: '10,000 CSC', price: '0.0015 XRP', total: '15 XRP', time: '1h ago' },
  { id: 3, type: 'buy', pair: 'CORE/XRP', amount: '100 CORE', price: '0.20 XRP', total: '20 XRP', time: '3h ago' },
  { id: 4, type: 'sell', pair: 'SOLO/XRP', amount: '200 SOLO', price: '0.051 XRP', total: '10.2 XRP', time: '1d ago' },
];

const MOCK_NFTS = [
  { id: 1, name: 'xPunk #1234', collection: 'xPunks', collectionSlug: 'xpunks', nftId: '00081388D65E6C7B1F4E9366B0B6D1C8B9F6D9D5F7F8B2C3A4E5D6C7B8A9F0E1', image: 'https://placehold.co/200x200/1a1a2e/white?text=1234', floor: '50 XRP' },
  { id: 2, name: 'xPunk #892', collection: 'xPunks', collectionSlug: 'xpunks', nftId: '00081388D65E6C7B1F4E9366B0B6D1C8B9F6D9D5F7F8B2C3A4E5D6C7B8A9F0E2', image: 'https://placehold.co/200x200/1a1a2e/white?text=892', floor: '55 XRP' },
  { id: 3, name: 'xPunk #3001', collection: 'xPunks', collectionSlug: 'xpunks', nftId: '00081388D65E6C7B1F4E9366B0B6D1C8B9F6D9D5F7F8B2C3A4E5D6C7B8A9F0E3', image: 'https://placehold.co/200x200/1a1a2e/white?text=3001', floor: '48 XRP' },
  { id: 4, name: 'XS Tower #89', collection: 'XS Tower', collectionSlug: 'xs-tower-apartments', nftId: '00081F40ADAB283F8972AAA140FFD5FB528A39470C05996D308D4C87057F67EB', image: 'https://placehold.co/200x200/3d1a4d/white?text=89', floor: '35 XRP' },
  { id: 5, name: 'XS Tower #412', collection: 'XS Tower', collectionSlug: 'xs-tower-apartments', nftId: '00081F40ADAB283F8972AAA140FFD5FB528A39470C05996D308D4C87057F67EC', image: 'https://placehold.co/200x200/3d1a4d/white?text=412', floor: '40 XRP' },
  { id: 6, name: 'xSpectar Land #12', collection: 'xSpectar', collectionSlug: 'xspectar', nftId: '00082A5B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F', image: 'https://placehold.co/200x200/1e3a5f/white?text=12', floor: '200 XRP' },
  { id: 7, name: 'XRPL Ape #567', collection: 'XRPL Apes', collectionSlug: 'xrpl-apes', nftId: '00083B6C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A', image: 'https://placehold.co/200x200/2d132c/white?text=567', floor: '120 XRP' },
  { id: 8, name: 'XRPL Ape #88', collection: 'XRPL Apes', collectionSlug: 'xrpl-apes', nftId: '00083B6C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5B', image: 'https://placehold.co/200x200/2d132c/white?text=88', floor: '115 XRP' },
];

export default function WalletPage() {
  const router = useRouter();
  const { tab: initialTab } = router.query;
  const { themeName, accountProfile, setOpenWalletModal, watchList } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const accountLogin = accountProfile?.account;
  const address = accountLogin;

  const [activeTab, setActiveTab] = useState(initialTab || 'overview');
  const [copied, setCopied] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Sync tab with URL query parameter
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [sendAmount, setSendAmount] = useState('');
  const [sendTo, setSendTo] = useState('');
  const [sendTag, setSendTag] = useState('');
  const [selectedToken, setSelectedToken] = useState('XRP');

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [showPanel, setShowPanel] = useState(null); // 'send' | 'receive' | null
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [tokenDropdownOpen, setTokenDropdownOpen] = useState(false);
  const [tokenSearch, setTokenSearch] = useState('');
  const [tokenSort, setTokenSort] = useState('value'); // value, name, change, balance
  const [hideZeroBalance, setHideZeroBalance] = useState(false);
  const [nftToTransfer, setNftToTransfer] = useState(null);
  const [nftRecipient, setNftRecipient] = useState('');
  const [nftToSell, setNftToSell] = useState(null);
  const [nftSellPrice, setNftSellPrice] = useState('');

  // Withdrawal addresses state
  const [withdrawals, setWithdrawals] = useState([]);
  const [showAddWithdrawal, setShowAddWithdrawal] = useState(false);
  const [newWithdrawal, setNewWithdrawal] = useState({ name: '', address: '', tag: '' });
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState('');

  // Load withdrawals from IndexedDB
  useEffect(() => {
    const loadWithdrawals = async () => {
      if (!address) return;
      try {
        const saved = await withdrawalStorage.getAll(address);
        setWithdrawals(saved);
      } catch (e) {
        console.error('Failed to load withdrawals:', e);
      }
    };
    loadWithdrawals();
  }, [address]);

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
      setWithdrawals(prev => [added, ...prev]);
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
      setWithdrawals(prev => prev.filter(w => w.id !== id));
      setDeleteConfirmId(null);
    } catch (e) {
      console.error('Failed to delete withdrawal:', e);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Wallet },
    { id: 'tokens', label: 'Tokens', icon: () => <span className="text-xs">◎</span> },
    { id: 'offers', label: 'Offers', icon: RotateCcw },
    { id: 'trades', label: 'Trades', icon: TrendingUp },
    { id: 'withdrawals', label: 'Withdrawals', icon: Building2 },
    { id: 'nfts', label: 'NFTs', icon: Image },
  ];

  return (
    <>
      <Head>
        <title>Wallet | XRPL.to</title>
      </Head>

      <Header />

      {!accountLogin ? (
        <div className={cn("min-h-[calc(100vh-64px)] flex items-center justify-center", isDark ? "bg-black" : "bg-gray-50")}>
          <div className={cn("text-center p-10 rounded-xl max-w-md", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-white border border-blue-200/50")}>
            <div className={cn("w-20 h-20 rounded-xl flex items-center justify-center mx-auto mb-6", isDark ? "bg-blue-500/10" : "bg-blue-50")}>
              <Wallet size={36} className="text-blue-500" />
            </div>
            <h2 className={cn("text-xl font-medium mb-3", isDark ? "text-white/90" : "text-gray-900")}>Connect Wallet</h2>
            <p className={cn("text-[13px] mb-8 leading-relaxed", isDark ? "text-white/50" : "text-gray-500")}>
              Manage your tokens, NFTs, offers, and transaction history all in one place
            </p>
            <button onClick={() => setOpenWalletModal(true)} className="w-full py-4 rounded-lg text-[13px] font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200">
              Connect Wallet
            </button>
            <p className={cn("text-[11px] mt-4", isDark ? "text-white/25" : "text-gray-400")}>
              Secure • Non-custodial • Encrypted locally
            </p>
          </div>
        </div>
      ) : (
      <div className={cn("min-h-screen", isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900")}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>Wallet</h1>
            <button
              onClick={() => handleCopy(address)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-mono transition-colors duration-150",
                copied ? "bg-emerald-500/10 text-emerald-500" : isDark ? "bg-white/[0.04] text-white/50 hover:bg-blue-500/5 hover:text-blue-400" : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              )}
            >
              {address?.slice(0, 8)}...{address?.slice(-6)}
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>

          {/* Tabs */}
          <div className={cn("flex gap-1 p-1 rounded-xl mb-6 overflow-x-auto", isDark ? "bg-white/[0.04]" : "bg-gray-100")}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all duration-200",
                  activeTab === tab.id
                    ? isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"
                    : isDark ? "text-white/50 hover:text-blue-400 hover:bg-blue-500/5" : "text-gray-500 hover:text-blue-600 hover:bg-blue-50/50"
                )}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Portfolio Header */}
              <div className={cn("rounded-xl p-6", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-gray-50 border border-blue-200/50")}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <p className={cn("text-[11px] font-semibold uppercase tracking-[0.15em] mb-2", isDark ? "text-blue-400" : "text-blue-500")}>Portfolio Value</p>
                    <p className={cn("text-5xl font-light tracking-tight", isDark ? "text-white" : "text-gray-900")}>$1,266.75</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-emerald-500 text-sm font-medium">+$45.20 (3.7%)</span>
                      <span className={cn("text-xs", isDark ? "text-white/30" : "text-gray-400")}>24h</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowPanel('send')} className={cn("flex items-center gap-2 px-5 py-3 rounded-lg text-[13px] font-medium transition-all duration-200", showPanel === 'send' ? "bg-blue-500 text-white" : "bg-blue-500 text-white hover:bg-blue-600")}>
                      <ArrowUpRight size={16} /> Send
                    </button>
                    <button onClick={() => setShowPanel('receive')} className={cn("flex items-center gap-2 px-5 py-3 rounded-lg text-[13px] font-medium transition-all duration-200", showPanel === 'receive' ? "bg-blue-500/10 text-blue-400" : isDark ? "bg-white/[0.04] text-white/70 hover:bg-blue-500/5 hover:text-blue-400" : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600")}>
                      <ArrowDownLeft size={16} /> Receive
                    </button>
                  </div>
                </div>
              </div>

              {/* Send/Receive Modal */}
              {showPanel && (
                <div className={cn("rounded-xl p-6", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-white border border-blue-200/50")}>
                  {showPanel === 'send' ? (
                    <div className="max-w-md mx-auto">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>Send Token</h3>
                        <button onClick={() => setShowPanel(null)} className={cn("p-2 rounded-lg transition-colors duration-150", isDark ? "hover:bg-blue-500/5 text-white/40 hover:text-blue-400" : "hover:bg-blue-50 text-gray-400 hover:text-blue-600")}>✕</button>
                      </div>
                      <div className="space-y-4">
                        <div className="relative">
                          <label className={cn("text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block", isDark ? "text-blue-400" : "text-blue-500")}>Token</label>
                          <button type="button" onClick={() => setTokenDropdownOpen(!tokenDropdownOpen)} className={cn("w-full px-4 py-3 rounded-lg text-[13px] text-left flex items-center justify-between transition-colors duration-150", isDark ? "bg-white/[0.04] text-white border border-blue-500/15 hover:border-blue-500/30" : "bg-gray-50 border border-blue-200/50 hover:border-blue-300")}>
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: MOCK_TOKENS.find(t => t.symbol === selectedToken)?.color || '#333' }}>
                                {MOCK_TOKENS.find(t => t.symbol === selectedToken)?.icon || selectedToken[0]}
                              </div>
                              <span>{selectedToken}</span>
                              <span className={isDark ? "text-white/40" : "text-gray-400"}>—</span>
                              <span className={isDark ? "text-white/60" : "text-gray-500"}>{MOCK_TOKENS.find(t => t.symbol === selectedToken)?.amount}</span>
                            </div>
                            <ChevronDown size={16} className={cn("transition-transform", tokenDropdownOpen && "rotate-180", isDark ? "text-white/40" : "text-gray-400")} />
                          </button>
                          {tokenDropdownOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setTokenDropdownOpen(false)} />
                              <div className={cn("absolute z-50 w-full mt-2 rounded-xl overflow-hidden", isDark ? "bg-[#070b12]/98 backdrop-blur-xl border border-blue-500/20 shadow-2xl shadow-blue-500/10" : "bg-white/98 backdrop-blur-xl border border-blue-200 shadow-xl shadow-blue-200/50")}>
                                <div className={cn("max-h-[240px] overflow-y-auto", isDark ? "scrollbar-thin scrollbar-thumb-white/10" : "")}>
                                  {MOCK_TOKENS.map((t) => (
                                    <button key={t.symbol} type="button" onClick={() => { setSelectedToken(t.symbol); setTokenDropdownOpen(false); }} className={cn("w-full px-4 py-3 flex items-center gap-3 text-left transition-all duration-150", selectedToken === t.symbol ? (isDark ? "bg-blue-500/10" : "bg-blue-50") : "", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: t.color }}>
                                        {t.icon || t.symbol[0]}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>{t.symbol}</p>
                                        <p className={cn("text-[10px] truncate", isDark ? "text-white/35" : "text-gray-500")}>{t.name}</p>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <p className={cn("text-[12px] font-medium tabular-nums", isDark ? "text-white/70" : "text-gray-700")}>{t.amount}</p>
                                        <p className={cn("text-[10px] tabular-nums", isDark ? "text-white/30" : "text-gray-400")}>{t.value}</p>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        <div>
                          <label className={cn("text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block", isDark ? "text-blue-400" : "text-blue-500")}>Amount</label>
                          <div className={cn("rounded-lg p-4", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-gray-50 border border-blue-200/50")}>
                            <input type="text" inputMode="decimal" value={sendAmount} onChange={(e) => setSendAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" className={cn("w-full text-3xl font-light bg-transparent outline-none", isDark ? "text-white placeholder:text-white/20" : "text-gray-900 placeholder:text-gray-300")} />
                            <p className={cn("text-[10px] mt-2", isDark ? "text-white/30" : "text-gray-400")}>≈ $0.00 USD</p>
                          </div>
                        </div>
                        <div>
                          <label className={cn("text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block", isDark ? "text-blue-400" : "text-blue-500")}>Recipient</label>
                          <input type="text" value={sendTo} onChange={(e) => setSendTo(e.target.value)} placeholder="rAddress..." className={cn("w-full px-4 py-3 rounded-lg text-[13px] font-mono outline-none transition-colors duration-150", isDark ? "bg-white/[0.04] text-white border border-blue-500/15 placeholder:text-white/30 focus:border-blue-500/40" : "bg-gray-50 border border-blue-200/50 placeholder:text-gray-400 focus:border-blue-400")} />
                        </div>
                        <div>
                          <label className={cn("text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block", isDark ? "text-blue-400" : "text-blue-500")}>Destination Tag (optional)</label>
                          <input type="text" value={sendTag} onChange={(e) => setSendTag(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 12345678" className={cn("w-full px-4 py-3 rounded-lg text-[13px] font-mono outline-none transition-colors duration-150", isDark ? "bg-white/[0.04] text-white border border-blue-500/15 placeholder:text-white/30 focus:border-blue-500/40" : "bg-gray-50 border border-blue-200/50 placeholder:text-gray-400 focus:border-blue-400")} />
                        </div>
                        <button className="w-full py-4 rounded-lg text-[13px] font-medium bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center gap-2 mt-2 transition-colors duration-200">
                          <Send size={16} /> Send {selectedToken}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-sm mx-auto text-center">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>Receive</h3>
                        <button onClick={() => setShowPanel(null)} className={cn("p-2 rounded-lg transition-colors duration-150", isDark ? "hover:bg-blue-500/5 text-white/40 hover:text-blue-400" : "hover:bg-blue-50 text-gray-400 hover:text-blue-600")}>✕</button>
                      </div>
                      <div className="inline-block p-3 bg-white rounded-xl mb-4">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${address}&bgcolor=ffffff&color=000000&margin=0`} alt="QR" className="w-[180px] h-[180px]" />
                      </div>
                      <p className={cn("font-mono text-[10px] break-all mb-4 px-4", isDark ? "text-white/50" : "text-gray-500")}>{address}</p>
                      <button onClick={() => handleCopy(address)} className={cn("w-full py-3 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2 transition-colors duration-200", copied ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500 text-white hover:bg-blue-600")}>
                        {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied!' : 'Copy Address'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Token Holdings - Takes 2 columns */}
                <div className={cn("lg:col-span-2 rounded-xl", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-white border border-blue-200/50")}>
                  <div className="flex items-center justify-between p-4 border-b border-blue-500/10">
                    <div className="flex items-center gap-3">
                      <p className={cn("text-[11px] font-semibold uppercase tracking-[0.15em]", isDark ? "text-blue-400" : "text-blue-500")}>Top Assets</p>
                      <span className={cn("text-[9px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide", isDark ? "bg-white/5 text-white/50 border border-white/10" : "bg-gray-100 text-gray-500")}>{MOCK_TOKENS.length} total</span>
                    </div>
                    <button onClick={() => setActiveTab('tokens')} className={cn("text-[11px] font-medium uppercase tracking-wide transition-colors", isDark ? "text-blue-400/80 hover:text-blue-300" : "text-blue-500 hover:text-blue-600")}>View All →</button>
                  </div>
                  <div className="divide-y divide-blue-500/5">
                    {MOCK_TOKENS.slice(0, 5).map((token) => (
                      <div key={token.symbol} className={cn("flex items-center gap-3 px-3 py-2.5 transition-all duration-150", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: token.color }}>
                          {token.icon || token.symbol[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>{token.symbol}</p>
                          <p className={cn("text-[10px]", isDark ? "text-white/35" : "text-gray-500")}>{token.name}</p>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-[12px] font-medium tabular-nums", isDark ? "text-white/70" : "text-gray-700")}>{token.value}</p>
                          <p className={cn("text-[10px] tabular-nums", token.positive ? "text-emerald-500" : "text-red-400")}>{token.change}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {token.slug && (
                            <Link href={`/token/${token.slug}`} className={cn("p-2 rounded-lg transition-colors duration-150", isDark ? "hover:bg-blue-500/5 text-white/40 hover:text-blue-400" : "hover:bg-blue-50 text-gray-400 hover:text-blue-600")}>
                              <ArrowRightLeft size={14} />
                            </Link>
                          )}
                          <button onClick={() => { setSelectedToken(token.symbol); setShowPanel('send'); }} className={cn("p-2 rounded-lg transition-colors duration-150", isDark ? "hover:bg-blue-500/5 text-white/40 hover:text-blue-400" : "hover:bg-blue-50 text-gray-400 hover:text-blue-600")}>
                            <Send size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {MOCK_TOKENS.length > 5 && (
                    <div className={cn("p-3 text-center border-t", isDark ? "border-blue-500/10" : "border-blue-100")}>
                      <button onClick={() => setActiveTab('tokens')} className={cn("text-[11px] py-2 px-4 rounded-lg transition-colors duration-150", isDark ? "text-white/50 hover:bg-blue-500/5 hover:text-blue-400" : "text-gray-500 hover:bg-blue-50 hover:text-blue-600")}>
                        +{MOCK_TOKENS.length - 5} more tokens
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Sidebar */}
                <div className="space-y-4">
                  {/* NFT Collections */}
                  <div className={cn("rounded-xl", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-white border border-blue-200/50")}>
                    <div className="flex items-center justify-between p-4 border-b border-blue-500/10">
                      <p className={cn("text-[11px] font-semibold uppercase tracking-[0.15em]", isDark ? "text-blue-400" : "text-blue-500")}>NFTs</p>
                      <button onClick={() => setActiveTab('nfts')} className={cn("text-[11px] font-medium uppercase tracking-wide transition-colors", isDark ? "text-blue-400/80 hover:text-blue-300" : "text-blue-500 hover:text-blue-600")}>View All</button>
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-2">
                      {[...new Map(MOCK_NFTS.map(n => [n.collection, n])).values()].slice(0, 4).map((nft) => {
                        const count = MOCK_NFTS.filter(n => n.collection === nft.collection).length;
                        return (
                          <button key={nft.collection} onClick={() => { setSelectedCollection(nft.collection); setActiveTab('nfts'); }} className={cn("rounded-lg overflow-hidden text-left transition-all duration-150", isDark ? "hover:ring-1 hover:ring-blue-500/30" : "hover:ring-1 hover:ring-blue-300")}>
                            <img src={nft.image} alt={nft.collection} className="w-full aspect-square object-cover" />
                            <div className="p-2">
                              <p className={cn("text-[11px] font-medium truncate", isDark ? "text-white/80" : "text-gray-700")}>{nft.collection}</p>
                              <p className={cn("text-[10px]", isDark ? "text-white/35" : "text-gray-400")}>{count} items</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className={cn("rounded-xl", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-white border border-blue-200/50")}>
                    <div className="flex items-center justify-between p-4 border-b border-blue-500/10">
                      <p className={cn("text-[11px] font-semibold uppercase tracking-[0.15em]", isDark ? "text-blue-400" : "text-blue-500")}>Activity</p>
                      <button onClick={() => setActiveTab('trades')} className={cn("text-[11px] font-medium uppercase tracking-wide transition-colors", isDark ? "text-blue-400/80 hover:text-blue-300" : "text-blue-500 hover:text-blue-600")}>View All</button>
                    </div>
                    <div className="p-2">
                      {MOCK_TRADES.slice(0, 3).map((trade) => (
                        <div key={trade.id} className={cn("flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all duration-150", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", trade.type === 'buy' ? "bg-emerald-500/10" : "bg-red-500/10")}>
                            {trade.type === 'buy' ? <ArrowDownLeft size={14} className="text-emerald-500" /> : <ArrowUpRight size={14} className="text-red-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-[13px] font-medium truncate", isDark ? "text-white/90" : "text-gray-900")}>{trade.type === 'buy' ? 'Bought' : 'Sold'} {trade.amount}</p>
                            <p className={cn("text-[10px]", isDark ? "text-white/35" : "text-gray-400")}>{trade.time}</p>
                          </div>
                          <p className={cn("text-[12px] tabular-nums", isDark ? "text-white/50" : "text-gray-500")}>{trade.total}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Watchlist Preview */}
                  <div className={cn("rounded-xl", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-white border border-blue-200/50")}>
                    <div className="flex items-center justify-between p-4 border-b border-blue-500/10">
                      <div className="flex items-center gap-2">
                        <Star size={14} className="text-blue-400" />
                        <p className={cn("text-[11px] font-semibold uppercase tracking-[0.15em]", isDark ? "text-blue-400" : "text-blue-500")}>Watchlist</p>
                      </div>
                      <Link href="/watchlist" className={cn("text-[11px] font-medium uppercase tracking-wide transition-colors", isDark ? "text-blue-400/80 hover:text-blue-300" : "text-blue-500 hover:text-blue-600")}>View All</Link>
                    </div>
                    <div className="p-3">
                      {watchList?.length > 0 ? (
                        <div className="space-y-1">
                          <p className={cn("text-[12px]", isDark ? "text-white/50" : "text-gray-500")}>
                            {watchList.length} token{watchList.length !== 1 ? 's' : ''} tracked
                          </p>
                          <Link href="/watchlist" className={cn("block text-[13px] py-2 text-center rounded-lg transition-colors duration-150", isDark ? "bg-white/[0.04] text-white/60 hover:bg-blue-500/5 hover:text-blue-400" : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600")}>
                            View Watchlist
                          </Link>
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <p className={cn("text-[12px] mb-2", isDark ? "text-white/35" : "text-gray-400")}>No tokens tracked yet</p>
                          <Link href="/" className={cn("text-[12px] transition-colors", isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-500 hover:text-blue-600")}>
                            Browse tokens
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tokens Tab - Full Token Management */}
          {activeTab === 'tokens' && (() => {
            const filteredTokens = MOCK_TOKENS
              .filter(t => {
                if (tokenSearch && !t.symbol.toLowerCase().includes(tokenSearch.toLowerCase()) && !t.name.toLowerCase().includes(tokenSearch.toLowerCase())) return false;
                if (hideZeroBalance && t.amount === '0') return false;
                return true;
              })
              .sort((a, b) => {
                if (tokenSort === 'name') return a.symbol.localeCompare(b.symbol);
                if (tokenSort === 'change') return parseFloat(b.change) - parseFloat(a.change);
                return parseFloat(b.value.replace(/[$,]/g, '')) - parseFloat(a.value.replace(/[$,]/g, ''));
              });

            return (
              <div className="space-y-4">
                {/* Search & Filter Bar */}
                <div className={cn("rounded-xl p-4", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-white border border-blue-200/50")}>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="flex-1 relative">
                      <Search size={16} className={cn("absolute left-3 top-1/2 -translate-y-1/2", isDark ? "text-blue-400" : "text-blue-500")} />
                      <input
                        type="text"
                        value={tokenSearch}
                        onChange={(e) => setTokenSearch(e.target.value)}
                        placeholder="Search tokens..."
                        className={cn("w-full pl-10 pr-4 py-2.5 rounded-lg text-[13px] outline-none transition-colors duration-150", isDark ? "bg-white/[0.04] text-white border border-blue-500/15 placeholder:text-white/30 focus:border-blue-500/40" : "bg-gray-50 border border-blue-200/50 placeholder:text-gray-400 focus:border-blue-400")}
                      />
                    </div>
                    {/* Sort */}
                    <div className="flex items-center gap-2">
                      <select
                        value={tokenSort}
                        onChange={(e) => setTokenSort(e.target.value)}
                        className={cn("px-3 py-2.5 rounded-lg text-[13px] outline-none transition-colors duration-150", isDark ? "bg-white/[0.04] text-white border border-blue-500/15" : "bg-gray-50 border border-blue-200/50")}
                      >
                        <option value="value">Sort by Value</option>
                        <option value="name">Sort by Name</option>
                        <option value="change">Sort by 24h Change</option>
                      </select>
                      <button
                        onClick={() => setHideZeroBalance(!hideZeroBalance)}
                        className={cn("p-2.5 rounded-lg transition-colors duration-150", hideZeroBalance ? "bg-blue-500 text-white" : isDark ? "bg-white/[0.04] text-white/50 hover:bg-blue-500/5 hover:text-blue-400" : "bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600")}
                        title={hideZeroBalance ? "Show zero balances" : "Hide zero balances"}
                      >
                        {hideZeroBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <span className={cn("text-[11px]", isDark ? "text-white/35" : "text-gray-400")}>
                      {filteredTokens.length} of {MOCK_TOKENS.length} tokens
                    </span>
                    {tokenSearch && (
                      <button onClick={() => setTokenSearch('')} className={cn("text-[11px] transition-colors", isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-500 hover:text-blue-600")}>Clear search</button>
                    )}
                  </div>
                </div>

                {/* Token List */}
                <div className={cn("rounded-xl overflow-hidden", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-white border border-blue-200/50")}>
                  {/* Table Header */}
                  <div className={cn("grid grid-cols-12 gap-4 px-4 py-3 text-[10px] uppercase tracking-[0.15em] font-semibold border-b", isDark ? "text-blue-400 border-blue-500/10 bg-white/[0.02]" : "text-blue-500 border-blue-100 bg-gray-50")}>
                    <div className="col-span-4">Asset</div>
                    <div className="col-span-2 text-right">Balance</div>
                    <div className="col-span-2 text-right">Value</div>
                    <div className="col-span-2 text-right">24h</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>

                  {/* Token Rows */}
                  <div className="max-h-[500px] overflow-y-auto">
                    {filteredTokens.length === 0 ? (
                      <div className={cn("p-8 text-center", isDark ? "text-white/35" : "text-gray-400")}>
                        <p className="text-[13px]">No tokens found</p>
                      </div>
                    ) : (
                      filteredTokens.map((token) => (
                        <div key={token.symbol} className={cn("grid grid-cols-12 gap-4 px-4 py-3 items-center border-b last:border-0 transition-all duration-150", isDark ? "border-blue-500/5 hover:bg-white/[0.02]" : "border-blue-50 hover:bg-gray-50")}>
                          <div className="col-span-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: token.color }}>
                              {token.icon || token.symbol[0]}
                            </div>
                            <div className="min-w-0">
                              <p className={cn("text-[13px] font-medium truncate", isDark ? "text-white/90" : "text-gray-900")}>{token.symbol}</p>
                              <p className={cn("text-[10px] truncate", isDark ? "text-white/35" : "text-gray-500")}>{token.name}</p>
                            </div>
                          </div>
                          <div className={cn("col-span-2 text-right text-[12px] tabular-nums", isDark ? "text-white/70" : "text-gray-600")}>{token.amount}</div>
                          <div className={cn("col-span-2 text-right text-[12px] font-medium tabular-nums", isDark ? "text-white/90" : "text-gray-900")}>{token.value}</div>
                          <div className={cn("col-span-2 text-right text-[12px] tabular-nums", token.positive ? "text-emerald-500" : "text-red-400")}>{token.change}</div>
                          <div className="col-span-2 flex items-center justify-end gap-1">
                            {token.slug && (
                              <Link href={`/token/${token.slug}`} className={cn("p-2 rounded-lg transition-colors duration-150", isDark ? "hover:bg-blue-500/5 text-white/40 hover:text-blue-400" : "hover:bg-blue-50 text-gray-400 hover:text-blue-600")}>
                                <ArrowRightLeft size={14} />
                              </Link>
                            )}
                            <button onClick={() => { setSelectedToken(token.symbol); setShowPanel('send'); setActiveTab('overview'); }} className={cn("p-2 rounded-lg transition-colors duration-150", isDark ? "hover:bg-blue-500/5 text-white/40 hover:text-blue-400" : "hover:bg-blue-50 text-gray-400 hover:text-blue-600")}>
                              <Send size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Offers Tab */}
          {activeTab === 'offers' && (
            <div className="space-y-4">
              {/* Token Offers */}
              <div className={cn("rounded-xl", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-white border border-blue-200/50")}>
                <div className="p-4 border-b border-blue-500/10 flex items-center gap-2">
                  <RotateCcw size={14} className={isDark ? "text-blue-400" : "text-blue-500"} />
                  <p className={cn("text-[11px] font-semibold uppercase tracking-[0.15em]", isDark ? "text-blue-400" : "text-blue-500")}>Token Offers</p>
                  <span className={cn("ml-auto text-[9px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide", isDark ? "bg-white/5 text-white/50 border border-white/10" : "bg-gray-100 text-gray-500")}>{MOCK_TOKEN_OFFERS.length}</span>
                </div>
                <div className="divide-y divide-blue-500/5">
                  {MOCK_TOKEN_OFFERS.map((offer) => (
                    <div key={offer.id} className={cn("flex items-center gap-3 px-3 py-2.5 transition-all duration-150", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", offer.type === 'buy' ? "bg-emerald-500/10" : "bg-red-500/10")}>
                        {offer.type === 'buy' ? <ArrowDownLeft size={16} className="text-emerald-500" /> : <ArrowUpRight size={16} className="text-red-400" />}
                      </div>
                      <div className="flex-1">
                        <p className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>{offer.from} → {offer.to}</p>
                        <p className={cn("text-[10px]", isDark ? "text-white/35" : "text-gray-400")}>Rate: {offer.rate} • {offer.created}</p>
                      </div>
                      <button className={cn("px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors duration-150", isDark ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-red-50 text-red-600 hover:bg-red-100")}>
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* NFT Offers */}
              <div className={cn("rounded-xl", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-white border border-blue-200/50")}>
                <div className="p-4 border-b border-blue-500/10 flex items-center gap-2">
                  <Image size={14} className={isDark ? "text-blue-400" : "text-blue-500"} />
                  <p className={cn("text-[11px] font-semibold uppercase tracking-[0.15em]", isDark ? "text-blue-400" : "text-blue-500")}>NFT Offers</p>
                  <span className={cn("ml-auto text-[9px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide", isDark ? "bg-white/5 text-white/50 border border-white/10" : "bg-gray-100 text-gray-500")}>{MOCK_NFT_OFFERS.length}</span>
                </div>
                <div className="divide-y divide-blue-500/5">
                  {MOCK_NFT_OFFERS.map((offer) => (
                    <div key={offer.id} className={cn("flex items-center gap-3 px-3 py-2.5 transition-all duration-150", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                      <img src={offer.image} alt={offer.nft} className="w-10 h-10 rounded-lg object-cover" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>{offer.nft}</p>
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide", offer.type === 'sell' ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-500")}>
                            {offer.type === 'sell' ? 'Selling' : 'Buying'}
                          </span>
                        </div>
                        <p className={cn("text-[10px]", isDark ? "text-white/35" : "text-gray-400")}>{offer.collection} • {offer.price} • {offer.created}</p>
                      </div>
                      <button className={cn("px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors duration-150", isDark ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-red-50 text-red-600 hover:bg-red-100")}>
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Trades Tab */}
          {activeTab === 'trades' && (
            <div className={cn("rounded-xl", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-white border border-blue-200/50")}>
              <div className="p-4 border-b border-blue-500/10">
                <p className={cn("text-[11px] font-semibold uppercase tracking-[0.15em]", isDark ? "text-blue-400" : "text-blue-500")}>Trade History</p>
              </div>
              <div className="divide-y divide-blue-500/5">
                {MOCK_TRADES.map((trade) => (
                  <div key={trade.id} className={cn("flex items-center gap-3 px-3 py-2.5 transition-all duration-150", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", trade.type === 'buy' ? "bg-emerald-500/10" : "bg-red-500/10")}>
                      {trade.type === 'buy' ? <ArrowDownLeft size={16} className="text-emerald-500" /> : <ArrowUpRight size={16} className="text-red-400" />}
                    </div>
                    <div className="flex-1">
                      <p className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>
                        <span className={trade.type === 'buy' ? "text-emerald-500" : "text-red-400"}>{trade.type.toUpperCase()}</span> {trade.pair}
                      </p>
                      <p className={cn("text-[10px]", isDark ? "text-white/35" : "text-gray-400")}>{trade.amount} @ {trade.price}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-[12px] font-medium tabular-nums", isDark ? "text-white/70" : "text-gray-700")}>{trade.total}</p>
                      <p className={cn("text-[10px]", isDark ? "text-white/35" : "text-gray-400")}>{trade.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Withdrawals Tab */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-4">
              {/* Delete Confirmation Modal */}
              {deleteConfirmId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDeleteConfirmId(null)}>
                  <div className={cn("w-full max-w-sm rounded-xl p-5", isDark ? "bg-[#070b12]/98 backdrop-blur-xl border border-red-500/20" : "bg-white/98 backdrop-blur-xl border border-gray-200")} onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", isDark ? "bg-red-500/10" : "bg-red-50")}>
                        <Trash2 size={18} className="text-red-500" />
                      </div>
                      <div>
                        <h3 className={cn("text-[14px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>Delete Address?</h3>
                        <p className={cn("text-[11px]", isDark ? "text-white/50" : "text-gray-500")}>This cannot be undone</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setDeleteConfirmId(null)} className={cn("flex-1 py-2.5 rounded-lg text-[12px] font-medium transition-colors", isDark ? "bg-white/5 text-white/70 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                        Cancel
                      </button>
                      <button onClick={() => handleDeleteWithdrawal(deleteConfirmId)} className="flex-1 py-2.5 rounded-lg text-[12px] font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Withdrawal Modal */}
              {showAddWithdrawal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowAddWithdrawal(false)}>
                  <div className={cn("w-full max-w-md rounded-xl p-6", isDark ? "bg-[#070b12]/98 backdrop-blur-xl border border-blue-500/20" : "bg-white/98 backdrop-blur-xl border border-blue-200")} onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>Add Withdrawal Address</h3>
                      <button onClick={() => setShowAddWithdrawal(false)} className={cn("p-2 rounded-lg transition-colors duration-150", isDark ? "hover:bg-blue-500/5 text-white/40 hover:text-blue-400" : "hover:bg-blue-50 text-gray-400 hover:text-blue-600")}><X size={18} /></button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className={cn("text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block", isDark ? "text-blue-400" : "text-blue-500")}>Name</label>
                        <input type="text" value={newWithdrawal.name} onChange={(e) => setNewWithdrawal(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Binance, Coinbase" className={cn("w-full px-4 py-3 rounded-lg text-[13px] outline-none transition-colors duration-150", isDark ? "bg-white/[0.04] text-white border border-blue-500/15 placeholder:text-white/30 focus:border-blue-500/40" : "bg-gray-50 border border-blue-200/50 placeholder:text-gray-400 focus:border-blue-400")} />
                      </div>
                      <div>
                        <label className={cn("text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block", isDark ? "text-blue-400" : "text-blue-500")}>XRPL Address</label>
                        <input type="text" value={newWithdrawal.address} onChange={(e) => setNewWithdrawal(prev => ({ ...prev, address: e.target.value }))} placeholder="rAddress..." className={cn("w-full px-4 py-3 rounded-lg text-[13px] font-mono outline-none transition-colors duration-150", isDark ? "bg-white/[0.04] text-white border border-blue-500/15 placeholder:text-white/30 focus:border-blue-500/40" : "bg-gray-50 border border-blue-200/50 placeholder:text-gray-400 focus:border-blue-400")} />
                      </div>
                      <div>
                        <label className={cn("text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block", isDark ? "text-blue-400" : "text-blue-500")}>Destination Tag (optional)</label>
                        <input type="text" value={newWithdrawal.tag} onChange={(e) => setNewWithdrawal(prev => ({ ...prev, tag: e.target.value.replace(/\D/g, '') }))} placeholder="e.g. 12345678" className={cn("w-full px-4 py-3 rounded-lg text-[13px] font-mono outline-none transition-colors duration-150", isDark ? "bg-white/[0.04] text-white border border-blue-500/15 placeholder:text-white/30 focus:border-blue-500/40" : "bg-gray-50 border border-blue-200/50 placeholder:text-gray-400 focus:border-blue-400")} />
                      </div>
                      {withdrawalError && <p className="text-[11px] text-red-400">{withdrawalError}</p>}
                      <button onClick={handleAddWithdrawal} disabled={withdrawalLoading} className="w-full py-4 rounded-lg text-[13px] font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors duration-200">
                        {withdrawalLoading ? 'Saving...' : <><Plus size={16} /> Save Address</>}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className={cn("rounded-xl", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-white border border-blue-200/50")}>
                <div className="p-4 border-b border-blue-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className={cn("text-[11px] font-semibold uppercase tracking-[0.15em]", isDark ? "text-blue-400" : "text-blue-500")}>Saved Withdrawal Addresses</p>
                    <span className={cn("text-[9px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide", isDark ? "bg-white/5 text-white/50 border border-white/10" : "bg-gray-100 text-gray-500")}>{withdrawals.length}</span>
                  </div>
                  <button onClick={() => setShowAddWithdrawal(true)} className={cn("text-[11px] font-medium uppercase tracking-wide flex items-center gap-1 transition-colors", isDark ? "text-blue-400/80 hover:text-blue-300" : "text-blue-500 hover:text-blue-600")}><Plus size={12} /> Add New</button>
                </div>
                {withdrawals.length === 0 ? (
                  <div className={cn("p-8 text-center", isDark ? "text-white/35" : "text-gray-400")}>
                    <Building2 size={32} className="mx-auto mb-3 opacity-50" />
                    <p className="text-[13px]">No saved addresses yet</p>
                    <p className="text-[11px] mt-1">Add exchange or wallet addresses for quick withdrawals</p>
                  </div>
                ) : (
                  <div className="divide-y divide-blue-500/5">
                    {withdrawals.map((wallet) => (
                      <div key={wallet.id} className={cn("flex items-center gap-3 px-3 py-2.5 group transition-all duration-150", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", isDark ? "bg-blue-500/10" : "bg-blue-50")}>
                          <Building2 size={16} className={isDark ? "text-blue-400" : "text-blue-500"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>{wallet.name}</p>
                          <p className={cn("text-[10px] font-mono truncate", isDark ? "text-white/35" : "text-gray-400")}>{wallet.address}</p>
                          {wallet.tag && <p className={cn("text-[10px]", isDark ? "text-white/25" : "text-gray-400")}>Tag: {wallet.tag}</p>}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleCopy(wallet.address)} className={cn("p-2 rounded-lg transition-colors duration-150", isDark ? "hover:bg-blue-500/5 text-white/40 hover:text-blue-400" : "hover:bg-blue-50 text-gray-400 hover:text-blue-600")}>
                            <Copy size={14} />
                          </button>
                          <button onClick={() => { setSelectedToken('XRP'); setSendTo(wallet.address); setSendTag(wallet.tag || ''); setShowPanel('send'); setActiveTab('overview'); }} className={cn("p-2 rounded-lg transition-colors duration-150", isDark ? "hover:bg-blue-500/5 text-white/40 hover:text-blue-400" : "hover:bg-blue-50 text-gray-400 hover:text-blue-600")}>
                            <Send size={14} />
                          </button>
                          <button onClick={() => setDeleteConfirmId(wallet.id)} className={cn("p-2 rounded-lg transition-colors duration-150 opacity-0 group-hover:opacity-100", isDark ? "hover:bg-red-500/10 text-white/40 hover:text-red-400" : "hover:bg-red-50 text-gray-400 hover:text-red-500")}>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setNftToTransfer(null)}>
                  <div className={cn("w-full max-w-md rounded-xl p-6", isDark ? "bg-[#070b12]/98 backdrop-blur-xl border border-blue-500/20" : "bg-white/98 backdrop-blur-xl border border-blue-200")} onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>Transfer NFT</h3>
                      <button onClick={() => setNftToTransfer(null)} className={cn("p-2 rounded-lg transition-colors duration-150", isDark ? "hover:bg-blue-500/5 text-white/40 hover:text-blue-400" : "hover:bg-blue-50 text-gray-400 hover:text-blue-600")}>✕</button>
                    </div>
                    <div className={cn("flex items-center gap-4 p-3 rounded-lg mb-4", isDark ? "bg-white/[0.04] border border-blue-500/10" : "bg-gray-50 border border-blue-100")}>
                      <img src={nftToTransfer.image} alt={nftToTransfer.name} className="w-14 h-14 rounded-lg object-cover" />
                      <div>
                        <p className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>{nftToTransfer.name}</p>
                        <p className={cn("text-[10px]", isDark ? "text-white/35" : "text-gray-400")}>{nftToTransfer.collection}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className={cn("text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block", isDark ? "text-blue-400" : "text-blue-500")}>Recipient Address</label>
                        <input type="text" value={nftRecipient} onChange={(e) => setNftRecipient(e.target.value)} placeholder="rAddress..." className={cn("w-full px-4 py-3 rounded-lg text-[13px] font-mono outline-none transition-colors duration-150", isDark ? "bg-white/[0.04] text-white border border-blue-500/15 placeholder:text-white/30 focus:border-blue-500/40" : "bg-gray-50 border border-blue-200/50 placeholder:text-gray-400 focus:border-blue-400")} />
                      </div>
                      <div className={cn("p-3 rounded-lg text-[11px]", isDark ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" : "bg-yellow-50 text-yellow-700 border border-yellow-200")}>
                        This will transfer ownership. This action cannot be undone.
                      </div>
                      <button className="w-full py-4 rounded-lg text-[13px] font-medium bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors duration-200">
                        <Send size={16} /> Transfer NFT
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* NFT Sell Modal */}
              {nftToSell && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setNftToSell(null)}>
                  <div className={cn("w-full max-w-md rounded-xl p-6", isDark ? "bg-[#070b12]/98 backdrop-blur-xl border border-blue-500/20" : "bg-white/98 backdrop-blur-xl border border-blue-200")} onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>List NFT for Sale</h3>
                      <button onClick={() => setNftToSell(null)} className={cn("p-2 rounded-lg transition-colors duration-150", isDark ? "hover:bg-blue-500/5 text-white/40 hover:text-blue-400" : "hover:bg-blue-50 text-gray-400 hover:text-blue-600")}>✕</button>
                    </div>
                    <div className={cn("flex items-center gap-4 p-3 rounded-lg mb-4", isDark ? "bg-white/[0.04] border border-blue-500/10" : "bg-gray-50 border border-blue-100")}>
                      <img src={nftToSell.image} alt={nftToSell.name} className="w-14 h-14 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>{nftToSell.name}</p>
                        <p className={cn("text-[10px]", isDark ? "text-white/35" : "text-gray-400")}>{nftToSell.collection}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-[9px] uppercase font-semibold tracking-wide", isDark ? "text-white/25" : "text-gray-400")}>Floor</p>
                        <p className={cn("text-[12px] font-medium", isDark ? "text-white/50" : "text-gray-500")}>{nftToSell.floor}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className={cn("text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block", isDark ? "text-blue-400" : "text-blue-500")}>Sale Price</label>
                        <div className={cn("flex items-center rounded-lg overflow-hidden", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-gray-50 border border-blue-200/50")}>
                          <input type="text" inputMode="decimal" value={nftSellPrice} onChange={(e) => setNftSellPrice(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" className={cn("flex-1 px-4 py-3 text-lg font-light bg-transparent outline-none", isDark ? "text-white placeholder:text-white/20" : "text-gray-900 placeholder:text-gray-300")} />
                          <span className={cn("px-4 py-3 text-[13px] font-medium", isDark ? "text-white/50 bg-white/[0.04]" : "text-gray-500 bg-gray-100")}>XRP</span>
                        </div>
                      </div>
                      <div className={cn("flex items-center justify-between p-3 rounded-lg text-[11px]", isDark ? "bg-white/[0.04] border border-blue-500/10" : "bg-gray-50 border border-blue-100")}>
                        <span className={isDark ? "text-white/35" : "text-gray-400"}>Marketplace fee (2.5%)</span>
                        <span className={isDark ? "text-white/50" : "text-gray-500"}>{nftSellPrice ? (parseFloat(nftSellPrice) * 0.025).toFixed(2) : '0.00'} XRP</span>
                      </div>
                      <div className={cn("flex items-center justify-between p-3 rounded-lg", isDark ? "bg-white/[0.04] border border-blue-500/10" : "bg-gray-50 border border-blue-100")}>
                        <span className={cn("text-[13px]", isDark ? "text-white/50" : "text-gray-500")}>You receive</span>
                        <span className={cn("text-lg font-medium", isDark ? "text-white/90" : "text-gray-900")}>{nftSellPrice ? (parseFloat(nftSellPrice) * 0.975).toFixed(2) : '0.00'} XRP</span>
                      </div>
                      <button className="w-full py-4 rounded-lg text-[13px] font-medium bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors duration-200">
                        <ArrowUpRight size={16} /> List for Sale
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedCollection && (
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={() => setSelectedCollection(null)} className={cn("text-[11px] transition-colors", isDark ? "text-white/35 hover:text-blue-400" : "text-gray-400 hover:text-blue-600")}>All NFTs</button>
                  <span className={isDark ? "text-white/20" : "text-gray-300"}>/</span>
                  <span className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>{selectedCollection}</span>
                  <button onClick={() => setSelectedCollection(null)} className={cn("ml-auto text-[11px] px-2 py-1 rounded-lg transition-colors duration-150", isDark ? "bg-white/[0.04] text-white/50 hover:bg-blue-500/5 hover:text-blue-400" : "bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600")}>Clear</button>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {MOCK_NFTS.filter(nft => !selectedCollection || nft.collection === selectedCollection).map((nft) => (
                  <div key={nft.id} className={cn("rounded-xl overflow-hidden group", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-white border border-blue-200/50")}>
                    <div className="relative">
                      <img src={nft.image} alt={nft.name} className="w-full aspect-square object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Link href={`/nft/${nft.nftId}`} className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 text-[11px] font-medium flex items-center gap-1 transition-colors">
                          <ExternalLink size={12} /> View
                        </Link>
                        <button onClick={() => setNftToTransfer(nft)} className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 text-[11px] font-medium flex items-center gap-1 transition-colors">
                          <Send size={12} /> Send
                        </button>
                        <button onClick={() => setNftToSell(nft)} className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 text-[11px] font-medium flex items-center gap-1 transition-colors">
                          <ArrowUpRight size={12} /> Sell
                        </button>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className={cn("text-[13px] font-medium truncate", isDark ? "text-white/90" : "text-gray-900")}>{nft.name}</p>
                      <Link href={`/collection/${nft.collectionSlug}`} className={cn("text-[10px] truncate block transition-colors", isDark ? "text-white/35 hover:text-blue-400" : "text-gray-400 hover:text-blue-600")}>{nft.collection}</Link>
                      <p className={cn("text-[10px] mt-2", isDark ? "text-white/50" : "text-gray-500")}>Floor: {nft.floor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      <Footer />
    </>
  );
}
