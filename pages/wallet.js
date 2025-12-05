import { useState, useContext } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import {
  Send, ArrowDownLeft, ArrowUpRight, Copy, Check, QrCode,
  Wallet, Image, RotateCcw, TrendingUp, Building2,
  ChevronRight, ExternalLink, ArrowRightLeft, ChevronDown
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

const MOCK_WITHDRAWALS = [
  { id: 1, name: 'Binance', address: 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh', tag: '12345678' },
  { id: 2, name: 'Coinbase', address: 'rw2ciyaNshpHe7bCHo4bRWq6pqqynnWKQg', tag: '87654321' },
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
  const { themeName, accountProfile, accountLogin } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const [activeTab, setActiveTab] = useState(initialTab || 'overview');
  const [copied, setCopied] = useState(false);
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Wallet },
    { id: 'offers', label: 'Offers', icon: RotateCcw },
    { id: 'trades', label: 'Trades', icon: TrendingUp },
    { id: 'withdrawals', label: 'Withdrawals', icon: Building2 },
    { id: 'nfts', label: 'NFTs', icon: Image },
  ];

  const address = accountLogin || 'rEym11CoJ5RkbiLGP7gCEdE9P2pMF3Nt8N';

  return (
    <>
      <Head>
        <title>Wallet | XRPL.to</title>
      </Head>

      <Header />

      <div className={cn("min-h-screen", isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900")}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className={cn("text-xl font-medium", isDark ? "text-white" : "text-gray-900")}>Wallet</h1>
            <button
              onClick={() => handleCopy(address)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono",
                copied ? "bg-emerald-500/10 text-emerald-500" : isDark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {address.slice(0, 8)}...{address.slice(-6)}
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>

          {/* Tabs */}
          <div className={cn("flex gap-1 p-1 rounded-xl mb-6 overflow-x-auto", isDark ? "bg-white/5" : "bg-gray-100")}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium whitespace-nowrap transition-all",
                  activeTab === tab.id
                    ? isDark ? "bg-white/10 text-white" : "bg-white text-gray-900 shadow-sm"
                    : isDark ? "text-white/50 hover:text-white/70" : "text-gray-500 hover:text-gray-700"
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
              <div className={cn("rounded-2xl p-6", isDark ? "bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10" : "bg-gradient-to-br from-gray-50 to-white border border-gray-200")}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <p className={cn("text-xs uppercase tracking-wider mb-2", isDark ? "text-white/40" : "text-gray-400")}>Portfolio Value</p>
                    <p className={cn("text-5xl font-light tracking-tight", isDark ? "text-white" : "text-gray-900")}>$1,266.75</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-emerald-500 text-sm font-medium">+$45.20 (3.7%)</span>
                      <span className={cn("text-xs", isDark ? "text-white/30" : "text-gray-400")}>24h</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowPanel('send')} className={cn("flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all", showPanel === 'send' ? "bg-primary text-white" : "bg-primary text-white hover:bg-primary/90")}>
                      <ArrowUpRight size={18} /> Send
                    </button>
                    <button onClick={() => setShowPanel('receive')} className={cn("flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all", showPanel === 'receive' ? "bg-primary text-white" : isDark ? "bg-white/10 text-white hover:bg-white/15" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}>
                      <ArrowDownLeft size={18} /> Receive
                    </button>
                  </div>
                </div>
              </div>

              {/* Send/Receive Modal */}
              {showPanel && (
                <div className={cn("rounded-2xl p-6", isDark ? "bg-white/[0.03] border border-white/10" : "bg-white border border-gray-200")}>
                  {showPanel === 'send' ? (
                    <div className="max-w-md mx-auto">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className={cn("text-lg font-medium", isDark ? "text-white" : "text-gray-900")}>Send Token</h3>
                        <button onClick={() => setShowPanel(null)} className={cn("p-2 rounded-lg", isDark ? "hover:bg-white/10 text-white/40" : "hover:bg-gray-100 text-gray-400")}>✕</button>
                      </div>
                      <div className="space-y-4">
                        <div className="relative">
                          <label className={cn("text-xs uppercase tracking-wider mb-2 block", isDark ? "text-white/40" : "text-gray-400")}>Token</label>
                          <button type="button" onClick={() => setTokenDropdownOpen(!tokenDropdownOpen)} className={cn("w-full px-4 py-3 rounded-xl text-sm text-left flex items-center justify-between", isDark ? "bg-white/5 text-white border border-white/10 hover:border-white/20" : "bg-gray-50 border border-gray-200 hover:border-gray-300")}>
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
                            <div className={cn("absolute z-50 w-full mt-2 rounded-xl overflow-hidden shadow-xl", isDark ? "bg-[#1a1a1a] border border-white/10" : "bg-white border border-gray-200")}>
                              <div className="max-h-[200px] overflow-y-auto">
                                {MOCK_TOKENS.map((t) => (
                                  <button key={t.symbol} type="button" onClick={() => { setSelectedToken(t.symbol); setTokenDropdownOpen(false); }} className={cn("w-full px-4 py-3 flex items-center gap-3 text-left transition-colors", selectedToken === t.symbol ? (isDark ? "bg-white/10" : "bg-primary/5") : "", isDark ? "hover:bg-white/5" : "hover:bg-gray-50")}>
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: t.color }}>
                                      {t.icon || t.symbol[0]}
                                    </div>
                                    <div className="flex-1">
                                      <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>{t.symbol}</p>
                                      <p className={cn("text-xs", isDark ? "text-white/40" : "text-gray-400")}>{t.name}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className={cn("text-sm tabular-nums", isDark ? "text-white/80" : "text-gray-600")}>{t.amount}</p>
                                      <p className={cn("text-xs", isDark ? "text-white/40" : "text-gray-400")}>{t.value}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className={cn("text-xs uppercase tracking-wider mb-2 block", isDark ? "text-white/40" : "text-gray-400")}>Amount</label>
                          <div className={cn("rounded-xl p-4", isDark ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-200")}>
                            <input type="text" inputMode="decimal" value={sendAmount} onChange={(e) => setSendAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" className={cn("w-full text-3xl font-light bg-transparent outline-none", isDark ? "text-white placeholder:text-white/20" : "text-gray-900 placeholder:text-gray-300")} />
                            <p className={cn("text-xs mt-2", isDark ? "text-white/40" : "text-gray-400")}>≈ $0.00 USD</p>
                          </div>
                        </div>
                        <div>
                          <label className={cn("text-xs uppercase tracking-wider mb-2 block", isDark ? "text-white/40" : "text-gray-400")}>Recipient</label>
                          <input type="text" value={sendTo} onChange={(e) => setSendTo(e.target.value)} placeholder="rAddress..." className={cn("w-full px-4 py-3 rounded-xl text-sm font-mono outline-none", isDark ? "bg-white/5 text-white border border-white/10 placeholder:text-white/30 focus:border-primary" : "bg-gray-50 border border-gray-200 placeholder:text-gray-400 focus:border-primary")} />
                        </div>
                        <button className="w-full py-4 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90 flex items-center justify-center gap-2 mt-2">
                          <Send size={16} /> Send {selectedToken}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-sm mx-auto text-center">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className={cn("text-lg font-medium", isDark ? "text-white" : "text-gray-900")}>Receive</h3>
                        <button onClick={() => setShowPanel(null)} className={cn("p-2 rounded-lg", isDark ? "hover:bg-white/10 text-white/40" : "hover:bg-gray-100 text-gray-400")}>✕</button>
                      </div>
                      <div className="inline-block p-3 bg-white rounded-2xl mb-4">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${address}&bgcolor=ffffff&color=000000&margin=0`} alt="QR" className="w-[180px] h-[180px]" />
                      </div>
                      <p className={cn("font-mono text-xs break-all mb-4 px-4", isDark ? "text-white/60" : "text-gray-500")}>{address}</p>
                      <button onClick={() => handleCopy(address)} className={cn("w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2", copied ? "bg-emerald-500/10 text-emerald-500" : "bg-primary text-white")}>
                        {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied!' : 'Copy Address'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Token Holdings - Takes 2 columns */}
                <div className={cn("lg:col-span-2 rounded-2xl", isDark ? "bg-white/[0.02] border border-white/5" : "bg-white border border-gray-200")}>
                  <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>Assets</p>
                    <span className={cn("text-xs px-2 py-1 rounded-full", isDark ? "bg-white/10 text-white/60" : "bg-gray-100 text-gray-500")}>{MOCK_TOKENS.length}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={cn("text-[10px] uppercase tracking-wider", isDark ? "text-white/30" : "text-gray-400")}>
                          <th className="text-left py-3 px-4 font-medium">Asset</th>
                          <th className="text-right py-3 px-4 font-medium">Balance</th>
                          <th className="text-right py-3 px-4 font-medium">Price</th>
                          <th className="text-right py-3 px-4 font-medium">24h</th>
                          <th className="text-right py-3 px-4 font-medium w-20"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {MOCK_TOKENS.map((token) => (
                          <tr key={token.symbol} className={cn("border-t transition-colors", isDark ? "border-white/5 hover:bg-white/[0.02]" : "border-gray-100 hover:bg-gray-50")}>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: token.color }}>
                                  {token.icon || token.symbol[0]}
                                </div>
                                <div>
                                  <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>{token.symbol}</p>
                                  <p className={cn("text-xs", isDark ? "text-white/40" : "text-gray-400")}>{token.name}</p>
                                </div>
                              </div>
                            </td>
                            <td className={cn("py-3 px-4 text-right tabular-nums", isDark ? "text-white/80" : "text-gray-600")}>
                              <p className="text-sm">{token.amount}</p>
                              <p className={cn("text-xs", isDark ? "text-white/40" : "text-gray-400")}>{token.value}</p>
                            </td>
                            <td className={cn("py-3 px-4 text-right text-sm tabular-nums", isDark ? "text-white" : "text-gray-900")}>{token.value}</td>
                            <td className={cn("py-3 px-4 text-right text-sm tabular-nums", token.positive ? "text-emerald-500" : "text-red-400")}>{token.change}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {token.slug && (
                                  <Link href={`/token/${token.slug}`} className={cn("p-2 rounded-lg transition-colors", isDark ? "hover:bg-white/10 text-white/40 hover:text-white" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600")}>
                                    <ArrowRightLeft size={14} />
                                  </Link>
                                )}
                                <button onClick={() => { setSelectedToken(token.symbol); setShowPanel('send'); }} className={cn("p-2 rounded-lg transition-colors", isDark ? "hover:bg-white/10 text-white/40 hover:text-white" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600")}>
                                  <Send size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-4">
                  {/* NFT Collections */}
                  <div className={cn("rounded-2xl", isDark ? "bg-white/[0.02] border border-white/5" : "bg-white border border-gray-200")}>
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                      <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>NFTs</p>
                      <button onClick={() => setActiveTab('nfts')} className="text-xs text-primary font-medium">View All</button>
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-2">
                      {[...new Map(MOCK_NFTS.map(n => [n.collection, n])).values()].slice(0, 4).map((nft) => {
                        const count = MOCK_NFTS.filter(n => n.collection === nft.collection).length;
                        return (
                          <button key={nft.collection} onClick={() => { setSelectedCollection(nft.collection); setActiveTab('nfts'); }} className={cn("rounded-xl overflow-hidden text-left", isDark ? "hover:ring-1 hover:ring-white/20" : "hover:ring-1 hover:ring-gray-300")}>
                            <img src={nft.image} alt={nft.collection} className="w-full aspect-square object-cover" />
                            <div className="p-2">
                              <p className={cn("text-[11px] font-medium truncate", isDark ? "text-white/80" : "text-gray-700")}>{nft.collection}</p>
                              <p className={cn("text-[10px]", isDark ? "text-white/40" : "text-gray-400")}>{count} items</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className={cn("rounded-2xl", isDark ? "bg-white/[0.02] border border-white/5" : "bg-white border border-gray-200")}>
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                      <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>Activity</p>
                      <button onClick={() => setActiveTab('trades')} className="text-xs text-primary font-medium">View All</button>
                    </div>
                    <div className="p-2">
                      {MOCK_TRADES.slice(0, 3).map((trade) => (
                        <div key={trade.id} className={cn("flex items-center gap-3 p-2 rounded-lg", isDark ? "hover:bg-white/[0.03]" : "hover:bg-gray-50")}>
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", trade.type === 'buy' ? "bg-emerald-500/10" : "bg-red-500/10")}>
                            {trade.type === 'buy' ? <ArrowDownLeft size={14} className="text-emerald-500" /> : <ArrowUpRight size={14} className="text-red-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-xs font-medium truncate", isDark ? "text-white" : "text-gray-900")}>{trade.type === 'buy' ? 'Bought' : 'Sold'} {trade.amount}</p>
                            <p className={cn("text-[10px]", isDark ? "text-white/40" : "text-gray-400")}>{trade.time}</p>
                          </div>
                          <p className={cn("text-xs tabular-nums", isDark ? "text-white/60" : "text-gray-500")}>{trade.total}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Offers Tab */}
          {activeTab === 'offers' && (
            <div className="space-y-4">
              {/* Token Offers */}
              <div className={cn("rounded-2xl", isDark ? "bg-white/[0.03] border border-white/5" : "bg-white border border-gray-200")}>
                <div className="p-4 border-b border-white/5 flex items-center gap-2">
                  <RotateCcw size={14} className={isDark ? "text-white/40" : "text-gray-400"} />
                  <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>Token Offers</p>
                  <span className={cn("ml-auto text-[10px] px-2 py-0.5 rounded-full", isDark ? "bg-white/10 text-white/60" : "bg-gray-100 text-gray-500")}>{MOCK_TOKEN_OFFERS.length}</span>
                </div>
                <div className="divide-y divide-white/5">
                  {MOCK_TOKEN_OFFERS.map((offer) => (
                    <div key={offer.id} className="flex items-center gap-4 p-4">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", offer.type === 'buy' ? "bg-emerald-500/10" : "bg-red-500/10")}>
                        {offer.type === 'buy' ? <ArrowDownLeft size={18} className="text-emerald-500" /> : <ArrowUpRight size={18} className="text-red-400" />}
                      </div>
                      <div className="flex-1">
                        <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>{offer.from} → {offer.to}</p>
                        <p className={cn("text-xs", isDark ? "text-white/40" : "text-gray-400")}>Rate: {offer.rate} • {offer.created}</p>
                      </div>
                      <button className={cn("px-3 py-1.5 rounded-lg text-xs font-medium", isDark ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-red-50 text-red-600 hover:bg-red-100")}>
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* NFT Offers */}
              <div className={cn("rounded-2xl", isDark ? "bg-white/[0.03] border border-white/5" : "bg-white border border-gray-200")}>
                <div className="p-4 border-b border-white/5 flex items-center gap-2">
                  <Image size={14} className={isDark ? "text-white/40" : "text-gray-400"} />
                  <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>NFT Offers</p>
                  <span className={cn("ml-auto text-[10px] px-2 py-0.5 rounded-full", isDark ? "bg-white/10 text-white/60" : "bg-gray-100 text-gray-500")}>{MOCK_NFT_OFFERS.length}</span>
                </div>
                <div className="divide-y divide-white/5">
                  {MOCK_NFT_OFFERS.map((offer) => (
                    <div key={offer.id} className="flex items-center gap-4 p-4">
                      <img src={offer.image} alt={offer.nft} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>{offer.nft}</p>
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded", offer.type === 'sell' ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-500")}>
                            {offer.type === 'sell' ? 'Selling' : 'Buying'}
                          </span>
                        </div>
                        <p className={cn("text-xs", isDark ? "text-white/40" : "text-gray-400")}>{offer.collection} • {offer.price} • {offer.created}</p>
                      </div>
                      <button className={cn("px-3 py-1.5 rounded-lg text-xs font-medium", isDark ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-red-50 text-red-600 hover:bg-red-100")}>
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
            <div className={cn("rounded-2xl", isDark ? "bg-white/[0.03] border border-white/5" : "bg-white border border-gray-200")}>
              <div className="p-4 border-b border-white/5">
                <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>Trade History</p>
              </div>
              <div className="divide-y divide-white/5">
                {MOCK_TRADES.map((trade) => (
                  <div key={trade.id} className="flex items-center gap-4 p-4">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", trade.type === 'buy' ? "bg-emerald-500/10" : "bg-red-500/10")}>
                      {trade.type === 'buy' ? <ArrowDownLeft size={18} className="text-emerald-500" /> : <ArrowUpRight size={18} className="text-red-400" />}
                    </div>
                    <div className="flex-1">
                      <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>
                        <span className={trade.type === 'buy' ? "text-emerald-500" : "text-red-400"}>{trade.type.toUpperCase()}</span> {trade.pair}
                      </p>
                      <p className={cn("text-xs", isDark ? "text-white/40" : "text-gray-400")}>{trade.amount} @ {trade.price}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-medium", isDark ? "text-white/80" : "text-gray-700")}>{trade.total}</p>
                      <p className={cn("text-xs", isDark ? "text-white/40" : "text-gray-400")}>{trade.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Withdrawals Tab */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-4">
              <div className={cn("rounded-2xl", isDark ? "bg-white/[0.03] border border-white/5" : "bg-white border border-gray-200")}>
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>Saved Withdrawal Addresses</p>
                  <button className="text-xs text-primary font-medium">+ Add New</button>
                </div>
                <div className="divide-y divide-white/5">
                  {MOCK_WITHDRAWALS.map((wallet) => (
                    <div key={wallet.id} className="flex items-center gap-4 p-4">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", isDark ? "bg-white/5" : "bg-gray-100")}>
                        <Building2 size={18} className={isDark ? "text-white/60" : "text-gray-500"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>{wallet.name}</p>
                        <p className={cn("text-xs font-mono truncate", isDark ? "text-white/40" : "text-gray-400")}>{wallet.address}</p>
                        {wallet.tag && <p className={cn("text-xs", isDark ? "text-white/30" : "text-gray-400")}>Tag: {wallet.tag}</p>}
                      </div>
                      <button onClick={() => handleCopy(wallet.address)} className={cn("p-2 rounded-lg", isDark ? "hover:bg-white/5" : "hover:bg-gray-100")}>
                        <Copy size={14} className={isDark ? "text-white/40" : "text-gray-400"} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* NFTs Tab */}
          {activeTab === 'nfts' && (
            <div>
              {selectedCollection && (
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={() => setSelectedCollection(null)} className={cn("text-xs", isDark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600")}>All NFTs</button>
                  <span className={isDark ? "text-white/20" : "text-gray-300"}>/</span>
                  <span className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>{selectedCollection}</span>
                  <button onClick={() => setSelectedCollection(null)} className={cn("ml-auto text-xs px-2 py-1 rounded", isDark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}>Clear</button>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {MOCK_NFTS.filter(nft => !selectedCollection || nft.collection === selectedCollection).map((nft) => (
                  <div key={nft.id} className={cn("rounded-2xl overflow-hidden group", isDark ? "bg-white/[0.03] border border-white/5" : "bg-white border border-gray-200")}>
                    <div className="relative">
                      <img src={nft.image} alt={nft.name} className="w-full aspect-square object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Link href={`/nft/${nft.nftId}`} className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 text-xs font-medium flex items-center gap-1">
                          <ExternalLink size={12} /> View
                        </Link>
                        <button className="p-2 rounded-lg bg-primary text-white hover:bg-primary/80 text-xs font-medium flex items-center gap-1">
                          <ArrowUpRight size={12} /> Sell
                        </button>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className={cn("text-sm font-medium truncate", isDark ? "text-white" : "text-gray-900")}>{nft.name}</p>
                      <Link href={`/collection/${nft.collectionSlug}`} className={cn("text-xs truncate block hover:text-primary", isDark ? "text-white/40" : "text-gray-400")}>{nft.collection}</Link>
                      <p className={cn("text-xs mt-2", isDark ? "text-white/60" : "text-gray-500")}>Floor: {nft.floor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
