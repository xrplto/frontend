import React, { useState, useEffect, useRef, useCallback, useContext, useMemo } from 'react';
import { X, Inbox, Ban, VolumeX, Shield, HelpCircle, Send, ChevronLeft, ChevronDown, Plus, Clock, CheckCircle, AlertCircle, Loader2, Check, CheckCheck } from 'lucide-react';
import { AppContext } from 'src/context/AppContext';

// Local emotes from /emotes/
const EMOTES = [
  'sussy.gif', 'evilpepe.png', 'moyai-the-rock.png', 'crythumbsup.png', 'pepe-yes.png', 'handrub.gif', 'kekw.png', 'kek.png',
  'basedcigar.gif', 'pepesadhug.gif', 'pog.png', 'thinkingpepe.png', 'pepe-pizza.gif', 'catlaugh.gif', 'twerk.gif', 'chadgif.gif',
  'kappa.png', 'sadcat.png', 'peepocomfy.gif', 'lookfish.png', 'sla.gif', 'peposweg.png', 'rickroll.gif', 'kekwait.png',
  'cathumpdance.gif', 'ezpepe.png', 'pepescam.gif', 'galaxybrainmeme.gif', 'geckodance.gif', 'pepegagun.gif', 'doggodance.gif',
  'what.gif', 'pepewheelchair.png', 'dingdong.gif', 'yeah.gif', 'peepoheart.png', 'muskf.gif', 'pepecookie.png', 'pepeangel.png',
  'pokesleep.png', 'vibing.gif', 'fancytroll.png', 'awkward_monke.png', 'dance.gif', 'rollsafe.png', 'bigbrain.png', 'pepe-hmmm.png',
  'thinkink.png', 'pepe-salami.gif', 'kermitsip.png', 'pepegifboxing.gif', 'fax.gif', 'pepegaak47.gif', 'pepeshoot.gif', 'duck.gif',
  'pepeclap.gif', 'eatvibe.gif', 'peepogermany.gif', 'cum.gif', 'nah.gif', 'coffee.gif', 'pepesip.gif', 'peeposex.gif', 'pepecry.png',
  'aintnowway.gif', 'pepehabibi.gif', 'pepeduck.gif', 'doge.png', 'takingshower.gif', 'wine.gif', 'kebab.gif', 'sadgepray.png',
  'vibepepe.png', 'memes.gif', 'ghost-mw2.png', 'worryshy.png', 'peepolove.gif', 'grenouillevertet.png', 'leocheers.png',
  'peepoturkey.gif', 'pepefight.gif', 'pepesleep.png', 'cheemssayitback.png', 'pepeno.png', 'ayo-what.png', 'cute.png', 'chatting.gif',
  'gatoxd.gif', 'sadnigga.gif', 'fullgaykiss.png', 'anibanned.gif', 'excusemewtf.gif', 'hitting.gif', 'money-bag.gif', 'pepeok.png',
  'skull.svg', 'stfu.png', 'worried_monkey.gif', 'shrug.png', 'catdespair.png', 'cum2.gif', 'pain.gif', 'peeporussia.gif',
  'pepepray.png', 'peperich.gif', 'pepestabby.gif', 'uzi.gif', 'verycat.gif', 'onemili.png', 'aintnoway.gif', 'haram.gif', 'huh.gif',
  'kissahomie.gif', 'mwah.gif', 'pepeFat.gif', 'pepemusic.gif', 'xd.gif', 'jew.gif', 'bruh.png', 'exit.png', 'flip.png', 'gamba.gif',
  'love.gif', 'money.gif', 'sheep.gif', 'maam.gif', 'kappo.png', 'whatever.png', 'sus.gif', 'weed.gif', 'snoop.gif', 'sure.gif',
  'police.gif', 'pepebeer.webp', 'awkward_black.gif', 'face_with_open_eyes_and_hand_over_mouth.webp', 'scream.webp',
  'wilted_rose.svg', 'sob.svg', 'pensob.webp', 'clown.svg', 'grinning.svg', 'grimacing.svg', 'cold_face.svg', 'shushing_face.svg',
  'yawning_face.svg', 'broken_heart.svg', 'fuzzybear.png'
].map(f => ({ name: f.replace(/\.(png|gif|webp|svg)(\?.*)?$/, ''), url: `/emotes/${f}` }));

let emoteCache = EMOTES;
const fetchGlobalEmotes = async () => emoteCache;

// User avatar cache
const userAvatarCache = {};
const fetchUserAvatar = async (wallet) => {
  if (!wallet || userAvatarCache[wallet] !== undefined) return userAvatarCache[wallet];
  userAvatarCache[wallet] = null; // Mark as fetching
  try {
    const res = await fetch(`https://api.xrpl.to/api/user/${wallet}`);
    const data = await res.json();
    userAvatarCache[wallet] = data?.user?.avatar || null;
  } catch { userAvatarCache[wallet] = null; }
  return userAvatarCache[wallet];
};

const EmotePicker = ({ onSelect, inputRef, input, setInput }) => {
  const [emotes, setEmotes] = useState([]);
  const [query, setQuery] = useState('');
  const [show, setShow] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const pickerRef = useRef(null);

  useEffect(() => { fetchGlobalEmotes().then(setEmotes); }, []);

  useEffect(() => {
    const match = input.match(/:(\w{2,})$/);
    if (match) {
      setQuery(match[1].toLowerCase());
      setShow(true);
      setSelectedIdx(0);
    } else {
      setShow(false);
    }
  }, [input]);

  const filtered = useMemo(() =>
    query ? emotes.filter(e => e.name.toLowerCase().includes(query)).slice(0, 8) : [],
    [emotes, query]);

  const insertEmote = (emote) => {
    setInput(input.replace(/:(\w{2,})$/, emote.name + ' '));
    setShow(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (!show) return;
    const handleKey = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, filtered.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
      else if (e.key === 'Tab' || e.key === 'Enter') {
        if (filtered[selectedIdx]) { e.preventDefault(); insertEmote(filtered[selectedIdx]); }
      }
      else if (e.key === 'Escape') setShow(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [show, filtered, selectedIdx]);

  if (!show || !filtered.length) return null;

  return (
    <div ref={pickerRef} className="absolute bottom-full left-0 mb-2 w-72 max-h-52 overflow-y-auto rounded-xl bg-[#1a1a1a] border border-white/10 shadow-2xl z-50 p-1">
      <div className="px-2 py-1.5 text-[10px] uppercase tracking-wide opacity-40 font-medium">Emotes</div>
      {filtered.map((e, i) => (
        <button
          key={e.name}
          onClick={() => insertEmote(e)}
          className={`w-full flex items-center gap-3 px-2 py-2 text-left text-sm rounded-lg transition-colors ${i === selectedIdx ? 'bg-[#137DFE]/20 text-white' : 'hover:bg-white/5 text-white/80'}`}
        >
          <img src={e.url} alt={e.name} className="w-7 h-7 object-contain" loading="lazy" />
          <span className="font-medium">{e.name}</span>
        </button>
      ))}
    </div>
  );
};

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

// Chat avatar component with tooltip
const ChatAvatar = ({ wallet }) => {
  const cached = userAvatarCache[wallet];
  const [avatar, setAvatar] = useState(cached?.avatar);
  const [nftId, setNftId] = useState(cached?.nftId);
  const [nftData, setNftData] = useState(null);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    if (!wallet || userAvatarCache[wallet]) return;
    (async () => {
      try {
        const res = await fetch(`https://api.xrpl.to/api/user/${wallet}`);
        const data = await res.json();
        const url = data?.user?.avatar;
        const id = data?.user?.avatarNftId;
        userAvatarCache[wallet] = { avatar: url, nftId: id };
        setAvatar(url);
        setNftId(id);
      } catch { userAvatarCache[wallet] = { avatar: null, nftId: null }; }
    })();
  }, [wallet]);

  const handleHover = async () => {
    setShowTip(true);
    if (!nftId || nftData) return;
    try {
      const res = await fetch(`https://api.xrpl.to/v1/nft/${nftId}`);
      setNftData(await res.json());
    } catch { }
  };

  if (!avatar) return null;
  return (
    <span className="relative">
      <a href={nftId ? `/nft/${nftId}` : '#'} onClick={e => e.stopPropagation()}>
        <img src={avatar} alt="" className="w-3.5 h-3.5 rounded object-cover shrink-0 cursor-pointer" onMouseEnter={handleHover} onMouseLeave={() => setShowTip(false)} />
      </a>
      {showTip && (
        <div className="absolute bottom-full left-0 mb-1 px-2 py-1 rounded bg-black/95 border border-white/10 text-[10px] whitespace-nowrap z-50">
          {nftData ? (
            <><span className="text-white font-medium">{nftData.name || 'NFT'}</span>{nftData.collection && <span className="text-white/50 ml-1">• {nftData.collection}</span>}</>
          ) : <span className="text-white/50">Loading...</span>}
        </div>
      )}
    </span>
  );
};

const DmAvatar = ({ wallet, size = 'sm' }) => {
  const cached = userAvatarCache[wallet];
  const [avatar, setAvatar] = useState(cached?.avatar || null);

  useEffect(() => {
    if (!wallet) return;
    if (userAvatarCache[wallet]) { setAvatar(userAvatarCache[wallet].avatar); return; }
    (async () => {
      try {
        const res = await fetch(`https://api.xrpl.to/api/user/${wallet}`);
        const data = await res.json();
        const url = data?.user?.avatar || null;
        userAvatarCache[wallet] = { avatar: url, nftId: data?.user?.avatarNftId || null };
        setAvatar(url);
      } catch { userAvatarCache[wallet] = { avatar: null, nftId: null }; }
    })();
  }, [wallet]);

  const s = size === 'sm' ? 'w-4 h-4' : 'w-8 h-8';
  const t = size === 'sm' ? 'text-[7px]' : 'text-[10px]';

  if (avatar) return <img src={avatar} alt="" className={`${s} rounded-full object-cover shrink-0`} />;
  return (
    <span className={`${s} rounded-full bg-[#650CD4]/20 flex items-center justify-center ${t} text-[#650CD4] font-medium shrink-0`}>
      {wallet?.slice(1, 3).toUpperCase()}
    </span>
  );
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
      .catch(() => { })
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
      .catch(() => { });
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
      .catch(() => { })
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
  const formatXrp = (p) => p >= 1e6 ? (p / 1e6).toFixed(2) + 'M' : p >= 1e3 ? (p / 1e3).toFixed(1) + 'K' : p?.toLocaleString();

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

const EmoteInMessage = ({ name }) => {
  const [emote, setEmote] = useState(null);
  useEffect(() => {
    fetchGlobalEmotes().then(emotes => {
      const found = emotes.find(e => e.name.toLowerCase() === name.toLowerCase());
      if (found) setEmote(found);
    });
  }, [name]);
  if (!emote) return <span>{name}</span>;
  return <img src={emote.url} alt={name} title={name} className="inline-block w-5 h-5 align-middle mx-0.5" />;
};

const renderMessage = (text) => {
  if (!text || typeof text !== 'string') return text;
  const tokenRegex = /(?:https?:\/\/xrpl\.to)?\/token\/([a-fA-F0-9]{32}|[a-zA-Z0-9]+-[A-Fa-f0-9]+)|https?:\/\/firstledger\.net\/token(?:-v2)?\/([a-zA-Z0-9]+)\/([A-Fa-f0-9]+)|https?:\/\/xpmarket\.com\/token\/([a-zA-Z0-9]+)-([a-zA-Z0-9]+)|\b([a-fA-F0-9]{32})\b/g;
  const nftRegex = /(?:https?:\/\/xrpl\.to\/nft\/)?([A-Fa-f0-9]{64})/g;
  const emoteRegex = /\b([A-Za-z][A-Za-z0-9]{2,}(?:[A-Z][a-z0-9]*)*)\b/g;

  const parts = [];
  let last = 0;

  // Process NFT and token links
  const nftMatches = [...text.matchAll(nftRegex)];
  const tokenMatches = [...text.matchAll(tokenRegex)];
  const allMatches = [...nftMatches.map(m => ({ ...m, type: 'nft' })), ...tokenMatches.map(m => ({ ...m, type: 'token' }))].sort((a, b) => a.index - b.index);

  if (allMatches.length === 0) {
    // No token/NFT matches, check for emotes in plain text
    return text.split(/(\s+)/).map((word, i) => {
      if (/^[A-Za-z][A-Za-z0-9_-]{1,}$/.test(word) && emoteCache?.some(e => e.name.toLowerCase() === word.toLowerCase())) {
        return <EmoteInMessage key={i} name={word} />;
      }
      return word;
    });
  }

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

// Support Ticket Components
const SUPPORT_TIERS = ['vip', 'nova', 'diamond', 'verified', 'god', 'developer', 'partner', 'business', 'professional'];
const BASE_URL = 'https://api.xrpl.to';

const SupportTickets = ({ wallet, isStaff, tier, isDark, onBack }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('open');

  const canAccess = SUPPORT_TIERS.includes(tier?.toLowerCase());

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ action: 'list', limit: '50' });
      if (filter !== 'all') params.set('status', filter);
      if (wallet) params.set('wallet', wallet);
      const res = await fetch(`/api/chat/support?${params}`);
      const data = await res.json();
      if (data.success) setTickets(data.tickets || []);
    } catch (e) { console.error('Support fetch error:', e); }
    finally { setLoading(false); }
  }, [filter, wallet]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  if (!canAccess) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center text-center px-6">
        <HelpCircle size={32} className="opacity-20 mb-3" />
        <p className="text-sm opacity-60">Support tickets require VIP, Nova, Diamond, or Verified tier</p>
        <button onClick={onBack} className="mt-4 px-4 py-1.5 text-xs rounded-lg bg-white/10 hover:bg-white/20">Back to Chat</button>
      </div>
    );
  }

  if (selectedTicket) {
    return <TicketDetail ticketId={selectedTicket} wallet={wallet} isStaff={isStaff} isDark={isDark} onBack={() => { setSelectedTicket(null); fetchTickets(); }} />;
  }

  if (showCreate) {
    return <CreateTicket wallet={wallet} isDark={isDark} onBack={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchTickets(); }} />;
  }

  return (
    <div className="h-[400px] flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-inherit">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1 hover:bg-white/10 rounded"><ChevronLeft size={16} /></button>
          <span className="text-sm font-medium">Support Tickets</span>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-[#137DFE] text-white hover:bg-[#137DFE]/80">
          <Plus size={12} /> New
        </button>
      </div>
      <div className="flex gap-1 px-2 py-1.5 border-b border-inherit">
        {['open', 'in_progress', 'resolved', 'all'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-2 py-0.5 text-[10px] rounded capitalize ${filter === s ? 'bg-[#650CD4] text-white' : 'opacity-60 hover:opacity-100'}`}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full"><Loader2 size={20} className="animate-spin opacity-40" /></div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-40">
            <HelpCircle size={24} className="mb-2" />
            <p className="text-xs">No tickets found</p>
          </div>
        ) : (
          tickets.map(t => (
            <button key={t._id} onClick={() => setSelectedTicket(t._id)} className="w-full text-left px-3 py-2.5 hover:bg-white/5 border-b border-inherit last:border-b-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm truncate flex-1">{t.subject}</span>
                <TicketStatus status={t.status} />
              </div>
              <div className="flex items-center gap-2 mt-1 text-[10px] opacity-50">
                <span>{t.username || t.wallet?.slice(0, 8)}</span>
                <span>{timeAgo(t.createdAt)}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

const TicketStatus = ({ status }) => {
  const config = {
    open: { icon: AlertCircle, color: 'text-[#F6AF01]', bg: 'bg-[#F6AF01]/10' },
    in_progress: { icon: Clock, color: 'text-[#137DFE]', bg: 'bg-[#137DFE]/10' },
    resolved: { icon: CheckCircle, color: 'text-[#08AA09]', bg: 'bg-[#08AA09]/10' },
    closed: { icon: X, color: 'text-white/40', bg: 'bg-white/5' }
  }[status] || { icon: AlertCircle, color: 'text-white/40', bg: 'bg-white/5' };
  const Icon = config.icon;
  return (
    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${config.color} ${config.bg}`}>
      <Icon size={10} /> {status?.replace('_', ' ')}
    </span>
  );
};

const CreateTicket = ({ wallet, isDark, onBack, onCreated }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (subject.length < 3 || message.length < 10) {
      setError('Subject (3+ chars) and message (10+ chars) required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const params = new URLSearchParams({ action: 'create' });
      if (wallet) params.set('wallet', wallet);
      const res = await fetch(`/api/chat/support?${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message })
      });
      const data = await res.json();
      if (data.success) onCreated();
      else setError(data.error || 'Failed to create ticket');
    } catch { setError('Network error'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="h-[400px] flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-inherit">
        <button onClick={onBack} className="p-1 hover:bg-white/10 rounded"><ChevronLeft size={16} /></button>
        <span className="text-sm font-medium">New Ticket</span>
      </div>
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {error && <div className="px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs">{error}</div>}
        <div>
          <label className="text-[10px] uppercase opacity-50 mb-1 block">Subject</label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value.slice(0, 100))}
            placeholder="Brief description..."
            className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
          />
          <span className="text-[10px] opacity-40 mt-0.5 block text-right">{subject.length}/100</span>
        </div>
        <div>
          <label className="text-[10px] uppercase opacity-50 mb-1 block">Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value.slice(0, 2000))}
            placeholder="Describe your issue in detail..."
            rows={6}
            className={`w-full px-3 py-2 rounded-lg border text-sm resize-none ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
          />
          <span className="text-[10px] opacity-40 mt-0.5 block text-right">{message.length}/2000</span>
        </div>
      </div>
      <div className="p-3 border-t border-inherit">
        <button
          onClick={submit}
          disabled={submitting || subject.length < 3 || message.length < 10}
          className="w-full py-2 rounded-lg bg-[#137DFE] text-white text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Submit Ticket
        </button>
      </div>
    </div>
  );
};

const TicketDetail = ({ ticketId, wallet, isStaff, isDark, onBack }) => {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const messagesEnd = useRef(null);

  const buildParams = useCallback((action) => {
    const params = new URLSearchParams({ action, ticketId });
    if (wallet) params.set('wallet', wallet);
    return params.toString();
  }, [ticketId, wallet]);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/support?${buildParams('get')}`);
      const data = await res.json();
      if (data.success) setTicket(data.ticket);
    } catch { } finally { setLoading(false); }
  }, [buildParams]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);
  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [ticket?.replies]);

  const sendReply = async () => {
    if (!reply.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/chat/support?${buildParams('reply')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply })
      });
      const data = await res.json();
      if (data.success) {
        setReply('');
        fetchTicket();
      }
    } catch { } finally { setSubmitting(false); }
  };

  const updateStatus = async (status) => {
    try {
      await fetch(`/api/chat/support?${buildParams('status')}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchTicket();
    } catch { }
  };

  if (loading) return <div className="h-[400px] flex items-center justify-center"><Loader2 size={20} className="animate-spin opacity-40" /></div>;
  if (!ticket) return <div className="h-[400px] flex items-center justify-center opacity-40">Ticket not found</div>;

  const canReply = ticket.status !== 'closed';

  return (
    <div className="h-[400px] flex flex-col">
      <div className="px-3 py-2 border-b border-inherit">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-1 hover:bg-white/10 rounded"><ChevronLeft size={16} /></button>
            <span className="text-sm font-medium truncate max-w-[200px]">{ticket.subject}</span>
          </div>
          <TicketStatus status={ticket.status} />
        </div>
        {isStaff && ticket.status !== 'closed' && (
          <div className="flex gap-1 mt-2 pl-7">
            {['open', 'in_progress', 'resolved', 'closed'].filter(s => s !== ticket.status).map(s => (
              <button key={s} onClick={() => updateStatus(s)} className="px-2 py-0.5 text-[10px] rounded bg-white/10 hover:bg-white/20 capitalize">
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
          <div className="flex items-center justify-between text-[10px] opacity-50 mb-1">
            <span>{ticket.username || ticket.wallet?.slice(0, 8)}</span>
            <span>{timeAgo(ticket.createdAt)}</span>
          </div>
          <p className="text-sm whitespace-pre-wrap">{ticket.message}</p>
        </div>
        {ticket.replies?.map((r, i) => (
          <div key={i} className={`p-3 rounded-lg ${r.isStaff ? 'bg-[#650CD4]/10 border border-[#650CD4]/20' : isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className={r.isStaff ? 'text-[#650CD4]' : 'opacity-50'}>
                {r.username || r.wallet?.slice(0, 8)} {r.isStaff && <span className="opacity-60">(Staff)</span>}
              </span>
              <span className="opacity-50">{timeAgo(r.timestamp)}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{r.message}</p>
          </div>
        ))}
        <div ref={messagesEnd} />
      </div>
      {canReply && (
        <div className="p-2 border-t border-inherit flex gap-2">
          <input
            value={reply}
            onChange={e => setReply(e.target.value.slice(0, 2000))}
            placeholder="Type your reply..."
            onKeyDown={e => e.key === 'Enter' && sendReply()}
            className={`flex-1 px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
          />
          <button onClick={sendReply} disabled={!reply.trim() || submitting} className="px-3 py-2 rounded-lg bg-[#137DFE] text-white disabled:opacity-40">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      )}
    </div>
  );
};

const Chat = () => {
  const getLoggedInWallet = () => {
    if (typeof window === 'undefined') return null;
    try {
      const profile = JSON.parse(localStorage.getItem('account_profile_2') || 'null');
      return profile?.account || null;
    } catch { return null; }
  };
  const getWsUrl = async () => {
    const wallet = getLoggedInWallet();
    if (!wallet) return null;
    try {
      const res = await fetch(`/api/chat/session?wallet=${wallet}`);
      const data = await res.json();
      return data.wsUrl || null;
    } catch {
      return null;
    }
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [modLevel, setModLevel] = useState(null); // 'admin' | 'verified' | null
  const [modError, setModError] = useState(null);
  const [showSupport, setShowSupport] = useState(false);
  const [supportNotif, setSupportNotif] = useState(0);
  const containerRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);

  const getWallet = (m) => m.wallet || m.address || m.username;
  const getRecipient = (m) => m.recipientWallet || m.recipient;
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

  const getTierTextColor = (tier) => {
    const t = tier?.toLowerCase();
    if (t === 'god') return 'inline-block bg-gradient-to-r from-[#F6AF01] to-[#ff6b6b] bg-clip-text text-transparent';
    if (t === 'verified') return 'inline-block bg-gradient-to-r from-[#FFD700] via-[#FF6B9D] to-[#00FFFF] bg-clip-text text-transparent';
    if (t === 'developer' || t === 'partner') return 'text-[#650CD4]';
    if (t === 'business' || t === 'nova') return 'text-[#F6AF01]';
    if (t === 'professional') return 'text-[#137DFE]';
    if (t === 'vip') return 'text-[#08AA09]';
    if (t === 'diamond') return 'text-[#a855f7]';
    if (t === 'member') return 'text-white/50';
    return 'text-[#650CD4]';
  };

  const getUserTier = (wallet) => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (getWallet(messages[i]) === wallet && messages[i].tier) return messages[i].tier;
    }
    return null;
  };

  const handleMessagesScroll = useCallback((e) => {
    const el = e.target;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    isNearBottomRef.current = nearBottom;
    setShowScrollBtn(!nearBottom);
    if (nearBottom) setNewMsgCount(0);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewMsgCount(0);
    setShowScrollBtn(false);
  };

  const getApiKey = () => {
    try {
      const profile = JSON.parse(localStorage.getItem('account_profile_2') || 'null');
      return profile?.apiKey || null;
    } catch { return null; }
  };

  const modAction = async (action, wallet, duration = null) => {
    const apiKey = getApiKey();
    if (!apiKey) { setModError('No API key'); return null; }
    try {
      const res = await fetch(`https://api.xrpl.to/v1/chat/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
        body: JSON.stringify({ wallet, duration })
      });
      const data = await res.json();
      if (!data.success) setModError(data.error || data.message || 'Action failed');
      else setModError(null);
      return data;
    } catch (e) {
      setModError('Network error');
      return null;
    }
  };

  // Tiers that verified users can mute (per API: VIP, Nova, Diamond only)
  const MUTABLE_BY_VERIFIED = ['vip', 'nova', 'diamond'];

  const canMute = (targetTier = null) => {
    if (!modLevel) return false;
    if (modLevel === 'admin') return true;
    // Verified can only mute VIP/Nova/Diamond (if tier provided), otherwise allow attempt
    if (!targetTier) return modLevel === 'verified';
    const t = targetTier?.toLowerCase();
    return MUTABLE_BY_VERIFIED.includes(t);
  };

  const canBan = () => modLevel === 'admin';

  const banUser = (wallet, duration = null) => modAction('ban', wallet, duration);
  const unbanUser = (wallet) => modAction('unban', wallet);
  const muteUser = (wallet, duration = 30) => modAction('mute', wallet, duration);
  const unmuteUser = (wallet) => modAction('unmute', wallet);

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

  // Poll status when chat is closed
  useEffect(() => {
    if (isOpen) return;
    const fetchStatus = async () => {
      try {
        const wallet = getLoggedInWallet();
        const url = wallet
          ? `https://api.xrpl.to/v1/chat/status?wallet=${wallet}`
          : 'https://api.xrpl.to/v1/chat/status';
        const res = await fetch(url);
        const data = await res.json();
        if (data.online !== undefined) setOnlineCount(data.online);
        if (data.unread !== undefined) setUnreadCount(data.unread);
      } catch { }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const connect = useCallback(async () => {
    const wsUrl = await getWsUrl();
    if (!wsUrl) return null;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => { };
    ws.onerror = () => { };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.users !== undefined) setOnlineCount(data.users);
      switch (data.type) {
        case 'authenticated':
          setRegistered(true);
          // Use local wallet from localStorage, not server's (server may have stale data)
          const localWallet = getLoggedInWallet();
          setAuthUser({ wallet: localWallet || data.wallet, username: data.username, tier: data.tier, roles: data.roles });
          // Check moderation level
          const tier = data.tier?.toLowerCase();
          const roles = data.roles || [];
          if (roles.includes('admin') || roles.includes('moderator') || tier === 'god') {
            setModLevel('admin');
          } else if (tier === 'verified') {
            setModLevel('verified');
          } else {
            setModLevel(null);
          }
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
            const newMsgs = (data.messages || []).map(m => ({
              ...m,
              readAt: m.wallet === authUserRef.current?.wallet && data.theirLastRead && m.timestamp < data.theirLastRead ? data.theirLastRead : null
            })).filter(m => !ids.has(m._id));
            return [...newMsgs, ...prev].sort((a, b) => a.timestamp - b.timestamp);
          });
          break;
        case 'read_receipt':
          // Mark all my messages to this user before timestamp as read
          setMessages((prev) => prev.map(m =>
            (m.isPrivate || m.type === 'private') &&
              m.wallet === authUserRef.current?.wallet &&
              (m.recipientWallet === data.by || m.recipient === data.by) &&
              m.timestamp <= data.at
              ? { ...m, readAt: data.at }
              : m
          ));
          break;
        case 'error':
          console.error('Chat error:', data.message);
          if (data.code === 4030) setModError(`Banned: ${data.reason || data.message}`);
          else if (data.code === 4031) setModError(`Muted: ${data.reason || data.message}`);
          break;
        case 'kicked':
          setModError(`Kicked: ${data.reason}`);
          setRegistered(false);
          setModLevel(null);
          break;
        case 'support_ticket':
          // Handle support ticket notifications
          if (data.action === 'new' || data.action === 'reply') {
            setSupportNotif(n => n + 1);
          }
          break;
        default:
          break;
      }
    };

    ws.onclose = () => { setRegistered(false); setModLevel(null); };

    return ws;
  }, []);

  useEffect(() => {
    if (!isOpen || !getLoggedInWallet()) return;

    // Mark chat as read
    fetch('https://api.xrpl.to/v1/chat/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: getLoggedInWallet() })
    }).catch(() => { });

    let ws = null;
    let pingInterval = null;

    const init = async () => {
      ws = await connect();
      if (!ws) return;

      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
      }, 30000);

      ws.addEventListener('close', () => {
        if (isOpen && getLoggedInWallet()) {
          setTimeout(() => wsRef.current?.readyState !== WebSocket.OPEN && connect(), 3000);
        }
      });
    };

    init();

    return () => {
      if (pingInterval) clearInterval(pingInterval);
      if (ws) ws.close();
      setRegistered(false);
      setModLevel(null);
    };
  }, [isOpen, connect, authUser?.wallet]);

  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setNewMsgCount(c => c + 1);
    }
  }, [messages]);

  useEffect(() => {
    try { localStorage.setItem('chat_open', isOpen); } catch { }
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

  // Listen for badge changes from wallet settings
  useEffect(() => {
    const handleBadgeChange = (e) => {
      const { badge } = e.detail || {};
      if (badge) {
        setAuthUser(prev => prev ? { ...prev, tier: badge } : prev);
        // Reconnect WebSocket to sync new badge with server
        if (wsRef.current) wsRef.current.close();
      }
    };
    window.addEventListener('badgeChanged', handleBadgeChange);
    return () => window.removeEventListener('badgeChanged', handleBadgeChange);
  }, []);

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
    // Request DM history and mark as read
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'history', with: user }));
      wsRef.current.send(JSON.stringify({ type: 'read', with: user }));
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
          className="relative flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#0a0a0a] border-[1.5px] border-white/10 hover:border-white/20 transition-colors shadow-xl"
        >
          <span className="text-white font-semibold">Shoutbox</span>
          <span className="flex items-center gap-1.5 text-[#08AA09] text-sm">
            <span className="w-2 h-2 rounded-full bg-[#08AA09] animate-pulse" />
            {onlineCount >= 1000 ? `${(onlineCount / 1000).toFixed(1)}K` : onlineCount}
          </span>
          {unreadCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#650CD4]/20 text-[#650CD4] text-xs font-medium">
              <Inbox size={12} />
              {unreadCount}
            </span>
          )}
          <span className="px-3 py-1.5 rounded-lg bg-[#137DFE] text-white text-sm font-medium">
            <Send size={14} />
          </span>
        </button>
      ) : (
        <div
          ref={containerRef}
          onClick={() => { if (!isFocused) inputRef.current?.focus(); }}
          className={`w-[560px] rounded-xl border-[1.5px] ${baseClasses} overflow-hidden shadow-2xl`}
        >
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-inherit">
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm">Shoutbox</span>
              {onlineCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-[#08AA09]/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#08AA09] animate-pulse" />
                  <span className="text-[#08AA09] font-medium">{onlineCount}</span>
                </span>
              )}
              {modLevel && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#650CD4]/10 text-[10px] text-[#650CD4] font-medium" title={modLevel === 'admin' ? 'Moderator' : 'Verified'}>
                  <Shield size={12} />
                  {modLevel === 'admin' ? 'Mod' : 'Verified'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => { setShowSupport(true); setSupportNotif(0); }} className={`relative p-2 rounded-lg transition-colors ${showSupport ? 'bg-[#137DFE] text-white' : 'hover:bg-white/10'}`} title="Support Tickets">
                <HelpCircle size={16} />
                {supportNotif > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">{supportNotif}</span>
                )}
              </button>
              <div className="relative inbox-dropdown">
                <button onClick={() => setShowInbox(!showInbox)} className={`relative p-2 rounded-lg transition-colors ${showInbox ? 'bg-[#650CD4] text-white' : 'hover:bg-white/10'}`}>
                  <Inbox size={16} />
                  {conversations.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#650CD4] text-white text-[9px] font-medium flex items-center justify-center">{conversations.length}</span>
                  )}
                </button>
                {showInbox && (
                  <div className={`absolute right-0 top-10 w-80 rounded-xl border-[1.5px] ${baseClasses} shadow-2xl z-50 overflow-hidden`}>
                    <div className="px-3 py-2.5 border-b border-inherit flex items-center gap-2">
                      <Inbox size={14} className="text-[#650CD4]" />
                      <span className="text-xs font-semibold">Direct Messages</span>
                      <span className="ml-auto text-[10px] opacity-40">{conversations.length}</span>
                    </div>
                    {conversations.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Inbox size={24} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm opacity-40">No messages yet</p>
                      </div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto">
                        {conversations.map(([user, msg]) => (
                          <button
                            key={user}
                            onClick={() => { openDmTab(user); setShowInbox(false); }}
                            className="w-full text-left px-3 py-3 hover:bg-white/5 border-b border-inherit last:border-b-0 transition-colors group"
                          >
                            <div className="flex items-center gap-2">
                              <DmAvatar wallet={user} size="lg" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`font-medium text-sm ${getTierTextColor(getUserTier(user))}`}>{user.slice(0, 6)}...{user.slice(-4)}</span>
                                  <span className="text-[10px] opacity-40">{timeAgo(msg.timestamp)}</span>
                                </div>
                                <div className="text-xs opacity-50 truncate">{msg.message}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          {modError && (
            <div className="px-3 py-2 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs flex items-center justify-between">
              <span>{modError}</span>
              <button onClick={() => setModError(null)} className="hover:text-red-300"><X size={14} /></button>
            </div>
          )}
          {!registered ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center opacity-50">
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm">Connecting...</p>
              </div>
            </div>
          ) : showSupport ? (
            <SupportTickets
              wallet={authUser?.wallet}
              isStaff={modLevel === 'admin'}
              tier={authUser?.tier}
              isDark={isDark}
              onBack={() => setShowSupport(false)}
            />
          ) : (
            <>
              {(() => {
                const filtered = activeTab === 'general'
                  ? messages.filter(m => !m.isPrivate && m.type !== 'private')
                  : messages.filter(m => (m.isPrivate || m.type === 'private') &&
                    (getWallet(m) === activeTab || getRecipient(m) === activeTab));

                return (
                  <>
                    <div className="flex gap-1 px-2 py-1.5 border-b border-inherit overflow-x-auto scrollbar-hide">
                      <button
                        onClick={() => { setActiveTab('general'); setPrivateTo(''); }}
                        className={`px-3 py-1 text-[11px] rounded-lg shrink-0 font-medium transition-all ${activeTab === 'general' ? 'bg-[#137DFE] text-white' : 'bg-white/5 hover:bg-white/10'}`}
                      >
                        General
                      </button>
                      {[...dmTabs].sort((a, b) => {
                        const aMsg = conversations.find(([u]) => u === a)?.[1]?.timestamp || 0;
                        const bMsg = conversations.find(([u]) => u === b)?.[1]?.timestamp || 0;
                        return bMsg - aMsg;
                      }).map(user => {
                        const hasUnread = activeTab !== user && messages.some(m => (m.isPrivate || m.type === 'private') && getWallet(m) === user && !m.readAt);
                        return (
                        <button
                          key={user}
                          onClick={() => openDmTab(user)}
                          className={`group/tab px-2 py-1 text-[11px] rounded-lg shrink-0 flex items-center gap-1.5 font-medium transition-all ${activeTab === user ? 'bg-[#650CD4] text-white' : hasUnread ? 'bg-[#F6AF01]/10 hover:bg-[#F6AF01]/20' : 'bg-white/5 hover:bg-white/10'}`}
                        >
                          <span className="relative">
                            <DmAvatar wallet={user} size="sm" />
                            {hasUnread && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#F6AF01] animate-pulse" />}
                          </span>
                          <span className={`${getTierTextColor(getUserTier(user))}`}>{user.slice(0, 4)}...{user.slice(-4)}</span>
                          <span onClick={(e) => closeDmTab(user, e)} className="opacity-50 hover:opacity-100 hover:text-red-400 ml-0.5">×</span>
                        </button>
                        );
                      })}
                    </div>
                    <div className="relative h-[400px]">
                    <div className="h-full overflow-y-auto px-3 py-2 space-y-0.5 scroll-smooth" onScroll={handleMessagesScroll}>
                      {filtered.length === 0 && (
                        <div className="h-full flex items-center justify-center opacity-30 text-sm">
                          {activeTab === 'general' ? 'No messages yet' : 'Start a conversation'}
                        </div>
                      )}
                      {filtered.map((msg, i) => {
                        const msgWallet = getWallet(msg);
                        const isOwn = msgWallet === authUser?.wallet;
                        const displayName = msg.username || msgWallet;
                        const shortName = displayName?.length > 12
                          ? `${displayName.slice(0, 6)}...${displayName.slice(-4)}`
                          : displayName;

                        return (
                          <div key={msg._id || i} className="flex items-baseline gap-1.5 py-0.5 text-[13px] leading-relaxed">
                            <span className="text-[10px] opacity-30 shrink-0">
                              {timeAgo(msg.timestamp)}
                            </span>
                            <ChatAvatar wallet={msgWallet} />
                            <span className="relative group shrink-0">
                              <button
                                onClick={() => { if (!isOwn) openDmTab(msgWallet); }}
                                className={`font-medium hover:underline ${isOwn ? 'text-[#137DFE]' : msg.tier?.toLowerCase() === 'god' ? 'inline-block bg-gradient-to-r from-[#F6AF01] to-[#ff6b6b] bg-clip-text text-transparent' : msg.tier?.toLowerCase() === 'verified' ? 'inline-block bg-gradient-to-r from-[#FFD700] via-[#FF6B9D] to-[#00FFFF] bg-clip-text text-transparent' : msg.tier?.toLowerCase() === 'developer' ? 'text-[#650CD4]' : msg.tier?.toLowerCase() === 'partner' ? 'text-[#650CD4]' : msg.tier?.toLowerCase() === 'business' ? 'text-[#F6AF01]' : msg.tier?.toLowerCase() === 'professional' ? 'text-[#137DFE]' : msg.tier?.toLowerCase() === 'vip' ? 'text-[#08AA09]' : msg.tier?.toLowerCase() === 'nova' ? 'text-[#F6AF01]' : msg.tier?.toLowerCase() === 'diamond' ? 'text-[#a855f7]' : msg.tier?.toLowerCase() === 'member' ? 'text-white/50' : activeTab !== 'general' ? 'text-[#650CD4]' : 'text-[#08AA09]'}`}
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
                                    {(canMute(msg.tier) || canBan()) && (
                                      <div className="flex gap-2 mt-2 pt-2 border-t border-white/10">
                                        {canMute(msg.tier) && (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); muteUser(msgWallet, 30); }}
                                            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F6AF01]/20 text-[#F6AF01] hover:bg-[#F6AF01]/30"
                                          >
                                            <VolumeX size={10} /> Mute 30m
                                          </button>
                                        )}
                                        {canBan() && (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); banUser(msgWallet, 60); }}
                                            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                          >
                                            <Ban size={10} /> Ban 1h
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </span>
                            <span className="break-words min-w-0">{renderMessage(msg.message)}</span>
                            {isOwn && (msg.isPrivate || msg.type === 'private') && (
                              msg.readAt ? (
                                <div className="relative group/read shrink-0 ml-1">
                                  <CheckCheck size={12} className="text-[#137DFE]" />
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/read:block z-50 px-2 py-1 rounded bg-[#1a1a1a] border border-white/10 text-[10px] text-white/80 whitespace-nowrap">
                                    Read {new Date(msg.readAt).toLocaleTimeString()}
                                  </div>
                                </div>
                              ) : <Check size={12} className="opacity-30 shrink-0 ml-1" />
                            )}
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                    {showScrollBtn && (
                      <button onClick={scrollToBottom} className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#137DFE] text-white text-xs font-medium shadow-lg hover:bg-[#137DFE]/90 transition-colors z-10">
                        <ChevronDown size={14} />
                        {newMsgCount > 0 ? `${newMsgCount} new` : 'Latest'}
                      </button>
                    )}
                    </div>
                  </>
                );
              })()}
              <div className="px-2 py-2 border-t border-inherit">
                {(attachedNft || attachedToken) && (
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {attachedToken && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#137DFE]/10 border border-[#137DFE]/20">
                        <AttachedTokenPreview md5={attachedToken} />
                        <button onClick={() => setAttachedToken(null)} className="p-0.5 hover:bg-white/10 rounded text-white/40 hover:text-white">
                          <X size={12} />
                        </button>
                      </div>
                    )}
                    {attachedNft && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#650CD4]/10 border border-[#650CD4]/20">
                        <NFTPreview nftId={attachedNft} />
                        <button onClick={() => setAttachedNft(null)} className="p-0.5 hover:bg-white/10 rounded text-white/40 hover:text-white">
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <div className="relative flex items-center gap-2">
                  <EmotePicker inputRef={inputRef} input={input} setInput={setInput} />
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value.slice(0, 256))}
                    placeholder={activeTab === 'general' ? 'Message... (type : for emotes)' : `DM ${activeTab.slice(0, 6)}...`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !input.match(/:(\w{2,})$/)) {
                        const whisperMatch = input.match(/^\/whisper\s+(r[a-zA-Z0-9]{24,34})\s*(.*)$/i);
                        if (whisperMatch) {
                          const [, target, msg] = whisperMatch;
                          setPrivateTo(target);
                          openDmTab(target);
                          if (msg.trim()) {
                            wsRef.current?.send(JSON.stringify({ type: 'private', to: target, message: msg.trim() }));
                          }
                          setInput('');
                          return;
                        }
                        const muteMatch = input.match(/^\/mute\s+(r[a-zA-Z0-9]{24,34})(?:\s+(\d+))?$/i);
                        if (muteMatch && canMute()) {
                          muteUser(muteMatch[1], parseInt(muteMatch[2]) || 30);
                          setInput('');
                          return;
                        }
                        const unmuteMatch = input.match(/^\/unmute\s+(r[a-zA-Z0-9]{24,34})$/i);
                        if (unmuteMatch && canMute()) {
                          unmuteUser(unmuteMatch[1]);
                          setInput('');
                          return;
                        }
                        const banMatch = input.match(/^\/ban\s+(r[a-zA-Z0-9]{24,34})(?:\s+(\d+))?$/i);
                        if (banMatch && canBan()) {
                          banUser(banMatch[1], parseInt(banMatch[2]) || 60);
                          setInput('');
                          return;
                        }
                        const unbanMatch = input.match(/^\/unban\s+(r[a-zA-Z0-9]{24,34})$/i);
                        if (unbanMatch && canBan()) {
                          unbanUser(unbanMatch[1]);
                          setInput('');
                          return;
                        }
                        sendMessage();
                      }
                    }}
                    className={`flex-1 px-3 py-2.5 rounded-xl outline-none text-sm transition-colors ${isDark ? 'bg-white/5 text-white placeholder-white/30 focus:bg-white/[0.07]' : 'bg-black/5 text-black placeholder-black/30 focus:bg-black/[0.07]'}`}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input && !attachedNft && !attachedToken}
                    className="p-2.5 rounded-xl bg-[#137DFE] text-white disabled:opacity-30 hover:bg-[#137DFE]/80 transition-colors shrink-0"
                  >
                    <Send size={16} />
                  </button>
                  {input.length > 200 && (
                    <span className={`absolute right-14 top-1/2 -translate-y-1/2 text-[10px] ${input.length >= 256 ? 'text-red-500' : 'opacity-40'}`}>
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
