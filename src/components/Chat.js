import React, { useState, useEffect, useRef, useCallback, useContext, useMemo } from 'react';
import { X, Inbox, Monitor, Smartphone, Globe } from 'lucide-react';
import { AppContext } from 'src/context/AppContext';

const timeAgo = (ts) => {
  if (!ts) return '';
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return 'now';
  if (sec < 3600) return Math.floor(sec / 60) + 'm ago';
  if (sec < 86400) return Math.floor(sec / 3600) + 'h ago';
  if (sec < 2592000) return Math.floor(sec / 86400) + 'd ago';
  if (sec < 31536000) return Math.floor(sec / 2592000) + 'mo ago';
  return Math.floor(sec / 31536000) + 'y ago';
};

const TokenPreview = ({ match }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`https://api.xrpl.to/v1/token/${match}`)
      .then(r => r.json())
      .then(d => { if (d.token) setToken(d.token); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [match]);

  if (loading) return <span className="text-[#137DFE] text-xs">loading...</span>;
  if (!token) return <a href={`/token/${match}`} className="text-[#137DFE] hover:underline text-xs">{match.slice(0, 12)}...</a>;

  const imgSrc = token.md5 ? `https://s1.xrpl.to/token/${token.md5}` : null;
  const change = token.pro24h || 0;
  const isUp = change >= 0;
  const formatPrice = (n) => {
    if (!n) return '-';
    const num = Number(n);
    if (num >= 1) return '$' + num.toFixed(2);
    if (num >= 0.01) return '$' + num.toFixed(4);
    const str = num.toFixed(10);
    const m = str.match(/^0\.(0+)([1-9]\d*)/);
    if (m) return `$0.0(${m[1].length})${m[2].slice(0, 4)}`;
    return '$' + num.toFixed(6);
  };
  const formatMcap = (n) => {
    if (!n) return '-';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(2) + 'K';
    return '$' + n.toFixed(0);
  };

  return (
    <span className="relative inline-block" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      <a href={`/token/${match}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-[#137DFE]/10 border border-[#137DFE]/20 hover:border-[#137DFE]/40 transition-colors text-xs">
        {imgSrc && !imgError ? (
          <img src={imgSrc} alt="" className="w-4 h-4 rounded-full object-cover" onError={() => setImgError(true)} />
        ) : (
          <span className="w-4 h-4 rounded-full bg-[#137DFE]/30 flex items-center justify-center text-[8px] text-[#137DFE]">T</span>
        )}
        <span className="font-medium text-[#137DFE]">{token.name || token.currency?.slice(0, 6)}</span>
      </a>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
          <div className="px-3 py-2.5 rounded-lg bg-[#1a1a1a] border border-white/10 shadow-xl text-[11px] min-w-[180px]">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div><span className="text-white/40">Price</span><div className="font-mono font-medium text-white">{formatPrice(token.exch)}</div></div>
              <div><span className="text-white/40">24h</span><div className={`font-medium ${isUp ? 'text-[#08AA09]' : 'text-red-500'}`}>{isUp ? '+' : ''}{change.toFixed(2)}%</div></div>
              <div><span className="text-white/40">MCap</span><div className="text-white/80">{formatMcap(token.marketcap)}</div></div>
              <div><span className="text-white/40">Holders</span><div className="text-white/80">{token.holders?.toLocaleString() || '-'}</div></div>
            </div>
            <div className="text-white/30 text-[9px] mt-2 pt-1.5 border-t border-white/5">Created {timeAgo(token.dateon)}</div>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-[#1a1a1a] border-r border-b border-white/10 rotate-45" />
        </div>
      )}
    </span>
  );
};

const AttachedTokenPreview = ({ md5 }) => {
  const [token, setToken] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    fetch(`https://api.xrpl.to/v1/token/${md5}`)
      .then(r => r.json())
      .then(d => { if (d.token) setToken(d.token); })
      .catch(() => {});
  }, [md5]);

  if (!token) return <span className="text-[#137DFE] text-xs">loading...</span>;

  const change = token.pro24h || 0;
  const isUp = change >= 0;
  const formatPrice = (n) => {
    if (!n) return '-';
    const num = Number(n);
    if (num >= 1) return '$' + num.toFixed(2);
    if (num >= 0.01) return '$' + num.toFixed(4);
    const str = num.toFixed(10);
    const m = str.match(/^0\.(0+)([1-9]\d*)/);
    if (m) return `$0.0(${m[1].length})${m[2].slice(0, 4)}`;
    return '$' + num.toFixed(6);
  };
  const formatMcap = (n) => {
    if (!n) return '-';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(2) + 'K';
    return '$' + n.toFixed(0);
  };

  return (
    <span className="relative inline-block" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      <a href={`/token/${md5}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-[#137DFE]/10 border border-[#137DFE]/20 hover:border-[#137DFE]/40 transition-colors text-xs">
        {!imgError ? (
          <img src={`https://s1.xrpl.to/token/${md5}`} alt="" className="w-4 h-4 rounded-full object-cover" onError={() => setImgError(true)} />
        ) : (
          <span className="w-4 h-4 rounded-full bg-[#137DFE]/30 flex items-center justify-center text-[8px] text-[#137DFE]">T</span>
        )}
        <span className="font-medium text-[#137DFE]">{token.name || token.currency?.slice(0, 6)}</span>
      </a>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
          <div className="px-3 py-2.5 rounded-lg bg-[#1a1a1a] border border-white/10 shadow-xl text-[11px] min-w-[180px]">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div><span className="text-white/40">Price</span><div className="font-mono font-medium text-white">{formatPrice(token.exch)}</div></div>
              <div><span className="text-white/40">24h</span><div className={`font-medium ${isUp ? 'text-[#08AA09]' : 'text-red-500'}`}>{isUp ? '+' : ''}{change.toFixed(2)}%</div></div>
              <div><span className="text-white/40">MCap</span><div className="text-white/80">{formatMcap(token.marketcap)}</div></div>
              <div><span className="text-white/40">Holders</span><div className="text-white/80">{token.holders?.toLocaleString() || '-'}</div></div>
            </div>
            <div className="text-white/30 text-[9px] mt-2 pt-1.5 border-t border-white/5">Created {timeAgo(token.dateon)}</div>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-[#1a1a1a] border-r border-b border-white/10 rotate-45" />
        </div>
      )}
    </span>
  );
};

const NFTPreview = ({ nftId }) => {
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`https://api.xrpl.to/v1/nft/${nftId}`)
      .then(r => r.json())
      .then(d => { setNft(d.nft || d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [nftId]);

  if (loading) return <span className="text-[#650CD4] text-xs">loading...</span>;

  const cdn = 'https://s1.xrpl.to/nft/';
  const file = nft?.files?.[0] || nft;
  const thumb = file?.thumbnail?.small || file?.thumbnail?.medium || file?.thumbnail?.large;
  const imgSrc = thumb ? cdn + thumb : null;
  const name = nft?.name || nft?.meta?.name;
  const collection = nft?.collection;
  const owner = nft?.account;
  const buyNow = nft?.cost?.amount;
  const bestOffer = nft?.costb?.amount;
  const volume = nft?.volume;
  const rank = nft?.rarity_rank;
  const total = nft?.total;
  const created = nft?.created;
  const formatXrp = (p) => p >= 1e6 ? (p/1e6).toFixed(2)+'M' : p >= 1e3 ? (p/1e3).toFixed(1)+'K' : p?.toLocaleString();

  return (
    <span className="relative inline-block" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      <a href={`/nft/${nftId}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-[#650CD4]/10 border border-[#650CD4]/20 hover:border-[#650CD4]/40 transition-colors text-xs">
        {imgSrc ? <img src={imgSrc} alt="" className="w-4 h-4 rounded object-cover" /> : <span className="w-4 h-4 rounded bg-[#650CD4]/30 flex items-center justify-center text-[8px] text-[#650CD4]">N</span>}
        <span className="font-medium text-[#650CD4]">{name || `${nftId.slice(0, 6)}...`}</span>
      </a>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
          <div className="px-3 py-2.5 rounded-lg bg-[#1a1a1a] border border-white/10 shadow-xl text-[11px] min-w-[180px]">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div><span className="text-white/40">Buy Now</span><div className="font-mono font-medium text-white">{buyNow ? formatXrp(buyNow) + ' XRP' : '-'}</div></div>
              <div><span className="text-white/40">Best Offer</span><div className="font-mono text-white/80">{bestOffer ? formatXrp(bestOffer) + ' XRP' : '-'}</div></div>
              <div><span className="text-white/40">Rank</span><div className="text-[#650CD4] font-medium">{rank ? `#${rank.toLocaleString()}` : '-'}</div></div>
              <div><span className="text-white/40">Supply</span><div className="text-white/80">{total ? total.toLocaleString() : '-'}</div></div>
            </div>
            <div className="text-white/30 text-[9px] mt-2 pt-1.5 border-t border-white/5 flex justify-between">
              <span>{collection}</span>
              <span>{created ? timeAgo(created) : ''}</span>
            </div>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-[#1a1a1a] border-r border-b border-white/10 rotate-45" />
        </div>
      )}
    </span>
  );
};

const renderMessage = (text) => {
  if (!text || typeof text !== 'string') return text;
  const tokenRegex = /(?:https?:\/\/xrpl\.to)?\/token\/([a-fA-F0-9]{32}|[a-zA-Z0-9]+-[A-Fa-f0-9]+)|https?:\/\/firstledger\.net\/token(?:-v2)?\/([a-zA-Z0-9]+)\/([A-Fa-f0-9]+)|https?:\/\/xpmarket\.com\/token\/([a-zA-Z0-9]+)-([a-zA-Z0-9]+)|\b([a-fA-F0-9]{32})\b/g;
  const nftRegex = /(?:https?:\/\/xrpl\.to\/nft\/)?([A-Fa-f0-9]{64})/g;

  const parts = [];
  let last = 0;

  // Process NFT and token links
  const nftMatches = [...text.matchAll(nftRegex)];
  const tokenMatches = [...text.matchAll(tokenRegex)];
  const allMatches = [...nftMatches.map(m => ({ ...m, type: 'nft' })), ...tokenMatches.map(m => ({ ...m, type: 'token' }))].sort((a, b) => a.index - b.index);

  if (allMatches.length === 0) return text;

  for (const m of allMatches) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m.type === 'nft') {
      parts.push(<NFTPreview key={`nft-${m.index}`} nftId={m[1]} />);
    } else {
      const tokenId = m[1] || m[6] || (m[2] && m[3] ? `${m[2]}-${m[3]}` : `${m[5]}-${m[4]}`);
      parts.push(<TokenPreview key={`token-${m.index}`} match={tokenId} />);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
};

const Chat = () => {
  const getLoggedInWallet = () => {
    if (typeof window === 'undefined') return null;
    try {
      const profile = JSON.parse(localStorage.getItem('account_profile_2') || 'null');
      return profile?.account || null;
    } catch { return null; }
  };
  const getWsUrl = () => {
    const wallet = getLoggedInWallet();
    return wallet ? `wss://api.xrpl.to/ws/chat?apiKey=xrpl_p3PKb-sf3JfGCtcUIdRS_UV8acyvQ1ta&wallet=${wallet}` : null;
  };
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('chat_open') === 'true';
    } catch { return false; }
  });
  const [registered, setRegistered] = useState(false);
  const [authUser, setAuthUser] = useState(() => {
    const acc = getLoggedInWallet();
    return acc ? { wallet: acc } : null;
  });
  const [messages, setMessages] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [input, setInput] = useState('');
  const [attachedNft, setAttachedNft] = useState(null);
  const [attachedToken, setAttachedToken] = useState(null);
  const [privateTo, setPrivateTo] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [dmTabs, setDmTabs] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('chat_dm_tabs') || '[]');
    } catch { return []; }
  });
  const [closedDms, setClosedDms] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('chat_closed_dms') || '[]');
    } catch { return []; }
  });
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const dmTabsRef = useRef(dmTabs);
  const authUserRef = useRef(null);
  useEffect(() => { dmTabsRef.current = dmTabs; }, [dmTabs]);
  useEffect(() => { authUserRef.current = authUser; }, [authUser]);
  // Sync authUser wallet with localStorage
  useEffect(() => {
    const handleStorage = () => {
      const acc = getLoggedInWallet();
      if (acc && acc !== authUser?.wallet) setAuthUser(prev => ({ ...prev, wallet: acc }));
    };
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(handleStorage, 500);
    return () => { window.removeEventListener('storage', handleStorage); clearInterval(interval); };
  }, [authUser?.wallet]);
  const [showInbox, setShowInbox] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null);

  const getWallet = (m) => m.wallet || m.address || m.username;
  const getRecipient = (m) => m.recipientWallet || m.recipient;
  const getPlatformIcon = (p) => {
    if (!p) return null;
    const pl = p.toLowerCase();
    const Icon = pl.includes('mobile') || pl.includes('ios') || pl.includes('android') ? Smartphone : pl.includes('xrpl.to') || pl.includes('web') || pl.includes('desktop') ? Monitor : Globe;
    return <span title={p}><Icon size={10} className="opacity-40 cursor-help" /></span>;
  };
  const getTierStyle = (t) => {
    if (!t) return null;
    const tier = t.toLowerCase();
    if (tier === 'god') return 'bg-gradient-to-r from-[#F6AF01] to-[#ff6b6b] text-black font-bold';
    if (tier === 'verified') return 'bg-gradient-to-r from-[#10B981] via-[#06B6D4] to-[#8B5CF6] text-white font-medium';
    if (tier === 'developer') return 'bg-[#650CD4]/20 text-[#650CD4]';
    if (tier === 'partner') return 'bg-[#650CD4]/20 text-[#650CD4]';
    if (tier === 'business') return 'bg-[#F6AF01]/20 text-[#F6AF01]';
    if (tier === 'professional') return 'bg-[#137DFE]/20 text-[#137DFE]';
    return 'bg-white/10 text-white/50';
  };

  const conversations = useMemo(() => {
    const convos = {};
    messages.filter(m => m.isPrivate || m.type === 'private').forEach(m => {
      const other = getWallet(m) === authUser?.wallet ? getRecipient(m) : getWallet(m);
      if (other && (!convos[other] || m.timestamp > convos[other].timestamp)) {
        convos[other] = { ...m, unread: !convos[other]?.read && getWallet(m) !== authUser?.wallet };
      }
    });
    return Object.entries(convos).sort((a, b) => b[1].timestamp - a[1].timestamp);
  }, [messages, authUser?.wallet]);

  const connect = useCallback(() => {
    const wsUrl = getWsUrl();
    console.log('[Chat] connect() - wsUrl:', wsUrl);
    console.log('[Chat] connect() - wallet:', getLoggedInWallet());
    if (!wsUrl) {
      console.log('[Chat] No wallet, skipping connect');
      return null;
    }
    const t0 = Date.now();
    console.log('[Chat] Creating WebSocket...');
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    console.log('[Chat] WebSocket created, readyState:', ws.readyState);

    ws.onopen = () => console.log('[Chat] ws.onopen', Date.now() - t0, 'ms, readyState:', ws.readyState);
    ws.onerror = (e) => console.log('[Chat] ws.onerror', Date.now() - t0, 'ms', e);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('[Chat] msg:', data.type, Date.now() - t0, 'ms');
      if (data.users !== undefined) setOnlineCount(data.users);
      switch (data.type) {
        case 'authenticated':
          console.log('[Chat] setRegistered(true)', Date.now() - t0, 'ms');
          setRegistered(true);
          // Use local wallet from localStorage, not server's (server may have stale data)
          const localWallet = getLoggedInWallet();
          setAuthUser({ wallet: localWallet || data.wallet, username: data.username, tier: data.tier });
          // Fetch inbox and DM history
          ws.send(JSON.stringify({ type: 'inbox' }));
          dmTabsRef.current.forEach(user => {
            ws.send(JSON.stringify({ type: 'history', with: user }));
          });
          break;
        case 'init':
          setMessages(data.messages || []);
          break;
        case 'userCount':
          setOnlineCount(data.count);
          break;
        case 'inbox':
          if (data.conversations?.length) {
            // Add users to DM tabs (except closed ones and self)
            const closed = JSON.parse(localStorage.getItem('chat_closed_dms') || '[]');
            const myWallet = authUserRef.current?.wallet;
            const newUsers = data.conversations.map(c => c.wallet).filter(u => u && u !== myWallet && !dmTabsRef.current.includes(u) && !closed.includes(u));
            if (newUsers.length) {
              const newTabs = [...dmTabsRef.current, ...newUsers];
              setDmTabs(newTabs);
              localStorage.setItem('chat_dm_tabs', JSON.stringify(newTabs));
            }
            // Add last messages to state
            setMessages(prev => {
              const ids = new Set(prev.map(m => m._id));
              const newMsgs = data.conversations
                .filter(c => c.lastMessage && !ids.has(c.lastMessage._id))
                .map(c => c.lastMessage);
              return [...prev, ...newMsgs].sort((a, b) => a.timestamp - b.timestamp);
            });
          }
          break;
        case 'message':
          setMessages((prev) => {
            if (data._id && prev.some((m) => m._id === data._id)) return prev;
            return [...prev, data];
          });
          break;
        case 'private':
          setMessages((prev) => {
            if (data._id && prev.some((m) => m._id === data._id)) return prev;
            return [...prev, data];
          });
          // Auto-open tab for incoming DM
          const senderWallet = data.wallet || data.address || data.username;
          const myWallet2 = authUserRef.current?.wallet;
          const dmUser = senderWallet === myWallet2 ? (data.recipientWallet || data.recipient) : senderWallet;
          if (dmUser && dmUser !== myWallet2 && !dmTabsRef.current.includes(dmUser)) {
            const newTabs = [...dmTabsRef.current, dmUser];
            setDmTabs(newTabs);
            localStorage.setItem('chat_dm_tabs', JSON.stringify(newTabs));
          }
          break;
        case 'history':
          setMessages((prev) => {
            const ids = new Set(prev.map(m => m._id));
            const newMsgs = (data.messages || []).filter(m => !ids.has(m._id));
            return [...newMsgs, ...prev].sort((a, b) => a.timestamp - b.timestamp);
          });
          break;
        case 'error':
          console.error('Chat error:', data.message);
          break;
        default:
          break;
      }
    };

    ws.onclose = (e) => {
      console.log('[Chat] ws.onclose code:', e.code, 'reason:', e.reason, 'wasClean:', e.wasClean);
      console.log('[Chat] Setting registered=false');
      setRegistered(false);
    };

    return ws;
  }, []);

  useEffect(() => {
    console.log('[Chat] useEffect - isOpen:', isOpen, 'registered:', registered);
    if (!isOpen) {
      console.log('[Chat] useEffect - not open, skipping');
      return;
    }
    const wallet = getLoggedInWallet();
    console.log('[Chat] useEffect - wallet:', wallet);
    if (!wallet) {
      console.log('[Chat] useEffect - no wallet, skipping');
      return;
    }
    console.log('[Chat] useEffect - calling connect()');
    const ws = connect();
    console.log('[Chat] useEffect - connect() returned:', ws ? 'WebSocket' : 'null');
    if (!ws) return;

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
    }, 30000);

    // Reconnect on unexpected close
    const handleClose = () => {
      if (isOpen && getLoggedInWallet()) {
        setTimeout(() => wsRef.current?.readyState !== WebSocket.OPEN && connect(), 3000);
      }
    };
    ws.addEventListener('close', handleClose);

    return () => {
      ws.removeEventListener('close', handleClose);
      clearInterval(pingInterval);
      ws.close();
      setRegistered(false);
    };
  }, [isOpen, connect, authUser?.wallet]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    try { localStorage.setItem('chat_open', isOpen); } catch {}
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const container = containerRef.current;
    const handleFocusIn = () => setIsFocused(true);
    const handleFocusOut = (e) => {
      if (!container.contains(e.relatedTarget)) setIsFocused(false);
    };
    container.addEventListener('focusin', handleFocusIn);
    container.addEventListener('focusout', handleFocusOut);
    return () => {
      container.removeEventListener('focusin', handleFocusIn);
      container.removeEventListener('focusout', handleFocusOut);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!showInbox) return;
    const close = (e) => { if (!e.target.closest('.inbox-dropdown')) setShowInbox(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showInbox]);

  // Listen for external DM requests
  useEffect(() => {
    const handleOpenDm = (e) => {
      const { user, nftId, tokenMd5 } = e.detail || {};
      if (user && user !== authUser?.wallet) {
        setIsOpen(true);
        setTimeout(() => {
          openDmTab(user);
          if (nftId) setAttachedNft(nftId);
          if (tokenMd5) setAttachedToken(tokenMd5);
        }, 100);
      }
    };
    window.addEventListener('openDm', handleOpenDm);
    return () => window.removeEventListener('openDm', handleOpenDm);
  }, [authUser?.wallet]);

  const openDmTab = (user) => {
    if (user && user !== authUser?.wallet && !dmTabs.includes(user)) {
      const newTabs = [...dmTabs, user];
      setDmTabs(newTabs);
      localStorage.setItem('chat_dm_tabs', JSON.stringify(newTabs));
    }
    // Remove from closed list if reopening
    if (closedDms.includes(user)) {
      const newClosed = closedDms.filter(u => u !== user);
      setClosedDms(newClosed);
      localStorage.setItem('chat_closed_dms', JSON.stringify(newClosed));
    }
    setActiveTab(user);
    setPrivateTo(user);
    inputRef.current?.focus();
    // Request DM history
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'history', with: user }));
    }
  };

  const closeDmTab = (user, e) => {
    e.stopPropagation();
    const newTabs = dmTabs.filter(t => t !== user);
    setDmTabs(newTabs);
    localStorage.setItem('chat_dm_tabs', JSON.stringify(newTabs));
    // Track closed DMs so they don't reappear from inbox
    if (!closedDms.includes(user)) {
      const newClosed = [...closedDms, user];
      setClosedDms(newClosed);
      localStorage.setItem('chat_closed_dms', JSON.stringify(newClosed));
    }
    if (activeTab === user) {
      setActiveTab('general');
      setPrivateTo('');
    }
  };


  const sendMessage = () => {
    if ((!input && !attachedNft && !attachedToken) || wsRef.current?.readyState !== WebSocket.OPEN) return;

    const tokenLink = attachedToken || '';
    const nftLink = attachedNft || '';
    const msg = `${tokenLink} ${nftLink} ${input}`.trim();
    if (privateTo) {
      wsRef.current.send(JSON.stringify({ type: 'private', to: privateTo, message: msg }));
    } else {
      wsRef.current.send(JSON.stringify({ type: 'message', message: msg }));
    }
    setInput('');
    setAttachedNft(null);
    setAttachedToken(null);
  };

  const baseClasses = isDark ? 'bg-[#0a0a0a] text-white border-white/10' : 'bg-[#fafafa] text-black border-black/10';

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#1a1a1a] border-[1.5px] border-white/10 hover:border-white/20"
        >
          <span className="text-white font-medium">Shoutbox</span>
          <span className="text-[#08AA09] text-sm">{onlineCount >= 1000 ? `${(onlineCount / 1000).toFixed(1)}K` : onlineCount}</span>
          {conversations.length > 0 && (
            <span className="flex items-center gap-1 text-[#650CD4] text-sm">
              <Inbox size={14} />
              {conversations.length}
            </span>
          )}
          <span className="px-3 py-1 rounded-lg border-[1.5px] border-white/20 text-white text-sm">Send</span>
        </button>
      ) : (
        <div
          ref={containerRef}
          onClick={() => { if (!isFocused) inputRef.current?.focus(); }}
          className={`w-[560px] rounded-xl border-[1.5px] ${baseClasses} overflow-hidden shadow-2xl`}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-inherit">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Shoutbox</span>
              {onlineCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#08AA09] animate-pulse" />
                  <span className="text-[#08AA09]">{onlineCount}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <div className="relative inbox-dropdown">
                <button onClick={() => setShowInbox(!showInbox)} className={`p-1.5 rounded-lg transition-colors ${showInbox ? 'bg-[#650CD4] text-white' : 'hover:bg-white/10'}`}>
                  <Inbox size={18} />
                  {conversations.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#650CD4] text-white text-[10px] flex items-center justify-center">{conversations.length}</span>
                  )}
                </button>
                {showInbox && (
                  <div className={`absolute right-0 top-10 w-72 rounded-xl border-[1.5px] ${baseClasses} shadow-2xl z-50 overflow-hidden`}>
                    <div className="px-3 py-2 border-b border-inherit text-xs font-medium opacity-50">Messages</div>
                    {conversations.length === 0 ? (
                      <div className="px-3 py-6 text-center text-sm opacity-40">No messages yet</div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto">
                        {conversations.map(([user, msg]) => (
                          <button
                            key={user}
                            onClick={() => { openDmTab(user); setShowInbox(false); }}
                            className="w-full text-left px-3 py-2.5 hover:bg-white/5 border-b border-inherit last:border-b-0 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-sm text-[#650CD4]">{user.slice(0,6)}...{user.slice(-4)}</span>
                              <span className="text-[10px] opacity-40">{timeAgo(msg.timestamp)}</span>
                            </div>
                            <div className="text-xs opacity-50 truncate mt-0.5">{msg.message}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {!registered ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center opacity-50">
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm">Connecting...</p>
              </div>
            </div>
          ) : (
            <>
              {(() => {
                const filtered = activeTab === 'general'
                  ? messages.filter(m => !m.isPrivate && m.type !== 'private')
                  : messages.filter(m => (m.isPrivate || m.type === 'private') &&
                      (getWallet(m) === activeTab || getRecipient(m) === activeTab));

                return (
                  <>
                    <div className="flex gap-1 px-2 py-1.5 border-b border-inherit overflow-x-auto">
                      <button
                        onClick={() => { setActiveTab('general'); setPrivateTo(''); }}
                        className={`px-2 py-0.5 text-[11px] rounded shrink-0 ${activeTab === 'general' ? 'bg-[#137DFE] text-white' : 'opacity-60 hover:opacity-100'}`}
                      >
                        General
                      </button>
                      {[...dmTabs].sort((a, b) => {
                        const aMsg = conversations.find(([u]) => u === a)?.[1]?.timestamp || 0;
                        const bMsg = conversations.find(([u]) => u === b)?.[1]?.timestamp || 0;
                        return bMsg - aMsg;
                      }).map(user => (
                        <button
                          key={user}
                          onClick={() => openDmTab(user)}
                          className={`px-2 py-0.5 text-[11px] rounded shrink-0 flex items-center gap-1 ${activeTab === user ? 'bg-[#650CD4] text-white' : 'opacity-60 hover:opacity-100'}`}
                        >
                          {user.slice(0, 6)}...{user.slice(-4)}
                          <span onClick={(e) => closeDmTab(user, e)} className="hover:text-red-400">×</span>
                        </button>
                      ))}
                    </div>
                    <div className="h-[400px] overflow-y-auto px-3 py-2 space-y-0.5 scroll-smooth">
                      {filtered.map((msg, i) => {
                        const msgWallet = getWallet(msg);
                        const isOwn = msgWallet === authUser?.wallet;
                        const displayName = msg.username || msgWallet;
                        const shortName = displayName?.length > 12
                          ? `${displayName.slice(0, 6)}...${displayName.slice(-4)}`
                          : displayName;

                        return (
                          <div key={msg._id || i} className="flex items-baseline gap-1.5 py-0.5 text-[13px] leading-relaxed">
                            <span className="flex items-center gap-1 text-[10px] opacity-30 shrink-0">
                              {timeAgo(msg.timestamp)}
                              {getPlatformIcon(msg.platform)}
                            </span>
                            <span className="relative group shrink-0">
                              <button
                                onClick={() => { if (!isOwn) openDmTab(msgWallet); }}
                                className={`font-medium hover:underline ${isOwn ? 'text-[#137DFE]' : msg.tier?.toLowerCase() === 'god' ? 'inline-block bg-gradient-to-r from-[#F6AF01] to-[#ff6b6b] bg-clip-text text-transparent' : msg.tier?.toLowerCase() === 'verified' ? 'inline-block bg-gradient-to-r from-[#10B981] via-[#06B6D4] to-[#8B5CF6] bg-clip-text text-transparent' : msg.tier?.toLowerCase() === 'developer' ? 'text-[#650CD4]' : msg.tier?.toLowerCase() === 'partner' ? 'text-[#650CD4]' : msg.tier?.toLowerCase() === 'business' ? 'text-[#F6AF01]' : msg.tier?.toLowerCase() === 'professional' ? 'text-[#137DFE]' : activeTab !== 'general' ? 'text-[#650CD4]' : 'text-[#08AA09]'}`}
                              >
                                {isOwn ? 'You' : shortName}:
                              </button>
                              {!isOwn && (
                                <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover:block z-50">
                                  <div className="px-2 py-1.5 rounded-lg bg-[#1a1a1a] border border-white/10 shadow-xl text-[10px] whitespace-nowrap">
                                    <div className="text-white/90 font-mono mb-1">{msgWallet}</div>
                                    <div className="flex gap-3 text-white/50">
                                      {msg.tier && <span>Tier: <span className="text-white/80">{msg.tier}</span></span>}
                                      {msg.platform && <span>Platform: <span className="text-white/80">{msg.platform}</span></span>}
                                    </div>
                                    <div className="text-[#650CD4] mt-1">Click to DM</div>
                                  </div>
                                </div>
                              )}
                            </span>
                            <span className="break-words min-w-0">{renderMessage(msg.message)}</span>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </>
                );
              })()}
              <div className="p-2 border-t border-inherit">
                {(attachedNft || attachedToken) && (
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {attachedToken && (
                      <div className="flex items-center gap-1">
                        <AttachedTokenPreview md5={attachedToken} />
                        <button onClick={() => setAttachedToken(null)} className="p-0.5 hover:bg-white/10 rounded text-white/40 hover:text-white">
                          <X size={12} />
                        </button>
                      </div>
                    )}
                    {attachedNft && (
                      <>
                        <NFTPreview nftId={attachedNft} />
                        <button onClick={() => setAttachedNft(null)} className="p-0.5 hover:bg-white/10 rounded text-white/40 hover:text-white">
                          <X size={12} />
                        </button>
                      </>
                    )}
                  </div>
                )}
                <div className="relative">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value.slice(0, 256))}
                    placeholder={activeTab === 'general' ? 'Message everyone...' : `DM ${activeTab.slice(0, 6)}...`}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    className={`w-full px-3 py-2 border-t border-b shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] outline-none text-sm ${isDark ? 'bg-[#1a1410]/90 text-[#d4b896] placeholder-[#6b5a45] border-[#3d3225] focus:border-[#8b7355]' : 'bg-[#f5ebe0] text-[#3d2b1f] placeholder-[#a08060] border-[#c9b896] focus:border-[#8b7355]'}`}
                  />
                  {input.length > 200 && (
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${input.length >= 256 ? 'text-red-500' : isDark ? 'text-[#6b5a45]' : 'text-[#a08060]'}`}>
                      {256 - input.length}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Chat;
