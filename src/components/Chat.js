import { apiFetch } from 'src/utils/api';
import React, { useState, useEffect, useRef, useCallback, useContext, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Inbox, Ban, VolumeX, Shield, HelpCircle, Send, ChevronLeft, ChevronDown, Plus, Clock, CheckCircle, AlertCircle, Loader2, Check, CheckCheck, MessageCircle, Smile } from 'lucide-react';
import { ThemeContext } from 'src/context/AppContext';

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

// User avatar cache - deduplicates fetches so the same wallet is only fetched once
const userAvatarCache = {};
const loadedImgUrls = new Set();
const avatarFetchPromises = {};
const fetchAvatar = (wallet) => {
  if (userAvatarCache[wallet]) return Promise.resolve(userAvatarCache[wallet]);
  if (avatarFetchPromises[wallet]) return avatarFetchPromises[wallet];
  avatarFetchPromises[wallet] = apiFetch(`https://api.xrpl.to/api/user/${wallet}`)
    .then(r => r.json())
    .then(data => {
      const result = { avatar: data?.user?.avatar || null, nftId: data?.user?.avatarNftId || null };
      userAvatarCache[wallet] = result;
      delete avatarFetchPromises[wallet];
      return result;
    })
    .catch(() => {
      const result = { avatar: null, nftId: null };
      userAvatarCache[wallet] = result;
      delete avatarFetchPromises[wallet];
      return result;
    });
  return avatarFetchPromises[wallet];
};

const EmotePicker = ({ onSelect, inputRef, input, setInput }) => {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [emotes, setEmotes] = useState([]);
  const [query, setQuery] = useState('');
  const [show, setShow] = useState(false);
  const [gridOpen, setGridOpen] = useState(false);
  const [gridSearch, setGridSearch] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const pickerRef = useRef(null);
  const gridRef = useRef(null);
  const gridSearchRef = useRef(null);

  useEffect(() => { fetchGlobalEmotes().then(setEmotes); }, []);

  // Autocomplete mode (typing :name)
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

  const gridFiltered = useMemo(() =>
    gridSearch ? emotes.filter(e => e.name.toLowerCase().includes(gridSearch.toLowerCase())) : emotes,
    [emotes, gridSearch]);

  const insertEmote = (emote) => {
    setInput(input.replace(/:(\w{2,})$/, emote.name + ' '));
    setShow(false);
    inputRef.current?.focus();
  };

  const pickEmote = (emote) => {
    setInput((prev) => prev + emote.name + ' ');
    setGridOpen(false);
    setGridSearch('');
    inputRef.current?.focus();
  };

  // Keyboard nav for autocomplete
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

  // Close grid on outside click
  useEffect(() => {
    if (!gridOpen) return;
    const handleClick = (e) => {
      if (gridRef.current && !gridRef.current.contains(e.target)) setGridOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [gridOpen]);

  // Focus search when grid opens
  useEffect(() => {
    if (gridOpen) gridSearchRef.current?.focus();
  }, [gridOpen]);

  return (
    <>
      {/* Autocomplete dropdown */}
      {show && filtered.length > 0 && (
        <div ref={pickerRef} className={`absolute bottom-full left-0 max-sm:left-0 max-sm:right-0 mb-2 w-72 max-sm:w-full max-h-52 overflow-y-auto overscroll-contain scrollbar-hide rounded-xl border-[1.5px] z-50 p-1 ${isDark ? 'bg-black border-white/[0.08]' : 'bg-white border-black/[0.08]'}`}>
          <div className={`px-2 py-1.5 text-[10px] uppercase tracking-wide font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>Emotes</div>
          {filtered.map((e, i) => (
            <button
              key={e.name}
              onClick={() => insertEmote(e)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm rounded-lg transition-colors ${i === selectedIdx ? 'bg-[#137DFE]/15 text-[#137DFE]' : isDark ? 'hover:bg-white/5 active:bg-white/10 text-white/80' : 'hover:bg-black/5 active:bg-black/10 text-black/80'}`}
            >
              <img src={e.url} alt={e.name} className="w-7 h-7 object-contain" loading="lazy" />
              <span className="font-medium">{e.name}</span>
            </button>
          ))}
        </div>
      )}
      {/* Emoji picker button */}
      <button
        onClick={() => setGridOpen(o => !o)}
        className={`p-2.5 max-sm:p-3 rounded-xl shrink-0 transition-all ${gridOpen ? 'bg-[#137DFE]/15 text-[#137DFE]' : isDark ? 'text-white/40 hover:text-white/70 hover:bg-white/5 active:bg-white/10' : 'text-black/40 hover:text-black/70 hover:bg-black/5 active:bg-black/10'}`}
      >
        <Smile size={18} className="max-sm:w-5 max-sm:h-5" />
      </button>
      {/* Grid picker */}
      {gridOpen && (
        <div ref={gridRef} className={`absolute bottom-full left-0 max-sm:left-0 max-sm:right-0 mb-2 w-80 max-sm:w-full rounded-xl border-[1.5px] z-50 ${isDark ? 'bg-black border-white/[0.08]' : 'bg-white border-black/[0.08]'}`}>
          <div className="p-2">
            <input
              ref={gridSearchRef}
              value={gridSearch}
              onChange={(e) => setGridSearch(e.target.value)}
              placeholder="Search emotes..."
              className={`w-full px-3 py-2 rounded-lg text-sm outline-none ${isDark ? 'bg-white/5 text-white placeholder-white/25' : 'bg-black/5 text-black placeholder-black/25'}`}
            />
          </div>
          <div className="grid grid-cols-7 max-sm:grid-cols-8 gap-0.5 p-2 pt-0 max-h-60 overflow-y-auto overscroll-contain scrollbar-hide">
            {gridFiltered.map((e) => (
              <button
                key={e.name}
                onClick={() => pickEmote(e)}
                title={e.name}
                className={`p-1.5 rounded-lg flex items-center justify-center transition-colors ${isDark ? 'hover:bg-white/10 active:bg-white/15' : 'hover:bg-black/10 active:bg-black/15'}`}
              >
                <img src={e.url} alt={e.name} className="w-7 h-7 object-contain" loading="lazy" />
              </button>
            ))}
            {gridFiltered.length === 0 && (
              <div className={`col-span-full py-6 text-center text-sm ${isDark ? 'text-white/30' : 'text-black/30'}`}>No emotes found</div>
            )}
          </div>
        </div>
      )}
    </>
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
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const cached = userAvatarCache[wallet];
  const [avatar, setAvatar] = useState(cached?.avatar);
  const [nftId, setNftId] = useState(cached?.nftId);
  const [nftData, setNftData] = useState(null);
  const [showTip, setShowTip] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(() => loadedImgUrls.has(cached?.avatar));

  useEffect(() => {
    if (!wallet) return;
    if (userAvatarCache[wallet]) {
      setAvatar(userAvatarCache[wallet].avatar);
      setNftId(userAvatarCache[wallet].nftId);
      if (loadedImgUrls.has(userAvatarCache[wallet].avatar)) setImgLoaded(true);
      return;
    }
    fetchAvatar(wallet).then(({ avatar: url, nftId: id }) => {
      setAvatar(url);
      setNftId(id);
      if (loadedImgUrls.has(url)) setImgLoaded(true);
    });
  }, [wallet]);

  const handleHover = async () => {
    setShowTip(true);
    if (!nftId || nftData) return;
    try {
      const res = await apiFetch(`https://api.xrpl.to/v1/nft/${nftId}`);
      setNftData(await res.json());
    } catch { }
  };

  if (!avatar) return null;
  return (
    <span className="relative">
      <a href={nftId ? `/nft/${nftId}` : '#'} onClick={e => e.stopPropagation()}>
        <img src={avatar} alt="" loading="lazy" decoding="async" className={`w-3.5 h-3.5 rounded object-cover shrink-0 cursor-pointer transition-opacity duration-200 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`} onLoad={() => { loadedImgUrls.add(avatar); setImgLoaded(true); }} onMouseEnter={handleHover} onMouseLeave={() => setShowTip(false)} />
      </a>
      {showTip && (
        <div className={`absolute bottom-full left-0 mb-1.5 px-2.5 py-1.5 rounded-xl border-[1.5px] text-[10px] whitespace-nowrap z-50 ${isDark ? 'bg-black border-white/[0.08]' : 'bg-white border-black/[0.08]'}`}>
          {nftData ? (
            <><span className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{nftData.name || 'NFT'}</span>{nftData.collection && <span className={`ml-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>• {nftData.collection}</span>}</>
          ) : <span className={isDark ? 'text-white/50' : 'text-black/50'}>Loading...</span>}
        </div>
      )}
    </span>
  );
};

const DmAvatar = ({ wallet, size = 'sm' }) => {
  const cached = userAvatarCache[wallet];
  const [avatar, setAvatar] = useState(cached?.avatar || null);
  const [imgLoaded, setImgLoaded] = useState(() => loadedImgUrls.has(cached?.avatar));

  useEffect(() => {
    if (!wallet) return;
    if (userAvatarCache[wallet]) {
      setAvatar(userAvatarCache[wallet].avatar);
      if (loadedImgUrls.has(userAvatarCache[wallet].avatar)) setImgLoaded(true);
      return;
    }
    fetchAvatar(wallet).then(({ avatar: url }) => {
      setAvatar(url);
      if (loadedImgUrls.has(url)) setImgLoaded(true);
    });
  }, [wallet]);

  const s = size === 'sm' ? 'w-5 h-5' : 'w-8 h-8';
  const t = size === 'sm' ? 'text-[8px]' : 'text-[10px]';

  const fallback = (
    <span className={`${s} rounded-full bg-[#650CD4]/20 flex items-center justify-center ${t} text-[#650CD4] font-medium shrink-0`}>
      {wallet?.slice(1, 3).toUpperCase()}
    </span>
  );

  if (avatar) return (
    <span className={`${s} relative shrink-0`}>
      {!imgLoaded && fallback}
      <img src={avatar} alt="" loading="lazy" decoding="async" className={`${s} rounded-full object-cover shrink-0 ${imgLoaded ? '' : 'absolute inset-0'} transition-opacity duration-200 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`} onLoad={() => { loadedImgUrls.add(avatar); setImgLoaded(true); }} />
    </span>
  );
  return fallback;
};

const TokenPreview = ({ match }) => {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const triggerRef = useRef(null);
  const [tooltipPos, setTooltipPos] = useState(null);

  useEffect(() => {
    setLoading(true);
    apiFetch(`https://api.xrpl.to/v1/token/${match}`)
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

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setTooltipPos({ top: rect.top, left: rect.left + rect.width / 2 });
    }
    setShowTooltip(true);
  };

  return (
    <span className="relative inline-block" ref={triggerRef} onMouseEnter={handleMouseEnter} onMouseLeave={() => setShowTooltip(false)}>
      <a href={`/token/${match}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-1 py-px rounded bg-[#137DFE]/10 border border-[#137DFE]/20 hover:border-[#137DFE]/40 transition-colors text-[11px] leading-tight">
        {imgSrc && !imgError ? (
          <img src={imgSrc} alt="" className="w-3.5 h-3.5 rounded-full object-cover" onError={() => setImgError(true)} />
        ) : (
          <span className="w-3.5 h-3.5 rounded-full bg-[#137DFE]/30 flex items-center justify-center text-[7px] text-[#137DFE]">T</span>
        )}
        <span className="font-medium text-[#137DFE]">{token.name || token.currency?.slice(0, 6)}</span>
        <span className={`font-mono ${isUp ? 'text-[#08AA09]' : 'text-red-500'}`}>{isUp ? '+' : ''}{change.toFixed(1)}%</span>
      </a>
      {showTooltip && tooltipPos && createPortal(
        <div className="fixed z-[9999] pointer-events-none" style={{ top: tooltipPos.top - 8, left: tooltipPos.left, transform: 'translate(-50%, -100%)' }}>
          <div className={`px-3 py-2.5 rounded-xl border-[1.5px] text-[11px] min-w-[200px] ${isDark ? 'bg-black border-white/[0.08]' : 'bg-white border-black/[0.08]'}`}>
            <div className="flex items-center gap-2 mb-2">
              {imgSrc && !imgError ? (
                <img src={imgSrc} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-[#137DFE]/20 flex items-center justify-center text-[8px] text-[#137DFE]">T</span>
              )}
              <span className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-black'}`}>{token.name || token.currency?.slice(0, 6)}</span>
              <span className={`ml-auto font-mono font-semibold text-xs ${isDark ? 'text-white' : 'text-black'}`}>{formatPrice(token.exch)}</span>
            </div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
              <div><span className={isDark ? 'text-white/40' : 'text-black/40'}>24h</span><div className={`font-mono font-medium ${isUp ? 'text-[#08AA09]' : 'text-red-500'}`}>{isUp ? '+' : ''}{change.toFixed(1)}%</div></div>
              <div><span className={isDark ? 'text-white/40' : 'text-black/40'}>MCap</span><div className={`font-mono ${isDark ? 'text-white/70' : 'text-black/70'}`}>{formatMcap(token.marketcap)}</div></div>
              <div><span className={isDark ? 'text-white/40' : 'text-black/40'}>Holders</span><div className={`font-mono ${isDark ? 'text-white/70' : 'text-black/70'}`}>{token.holders?.toLocaleString() || '-'}</div></div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </span>
  );
};

const AttachedTokenPreview = ({ md5 }) => {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [token, setToken] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const triggerRef = useRef(null);
  const [tooltipPos, setTooltipPos] = useState(null);

  useEffect(() => {
    apiFetch(`https://api.xrpl.to/v1/token/${md5}`)
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

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setTooltipPos({ top: rect.top, left: rect.left + rect.width / 2 });
    }
    setShowTooltip(true);
  };

  return (
    <span className="relative inline-block" ref={triggerRef} onMouseEnter={handleMouseEnter} onMouseLeave={() => setShowTooltip(false)}>
      <a href={`/token/${md5}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-1 py-px rounded bg-[#137DFE]/10 border border-[#137DFE]/20 hover:border-[#137DFE]/40 transition-colors text-[11px] leading-tight">
        {!imgError ? (
          <img src={`https://s1.xrpl.to/token/${md5}`} alt="" className="w-3.5 h-3.5 rounded-full object-cover" onError={() => setImgError(true)} />
        ) : (
          <span className="w-3.5 h-3.5 rounded-full bg-[#137DFE]/30 flex items-center justify-center text-[7px] text-[#137DFE]">T</span>
        )}
        <span className="font-medium text-[#137DFE]">{token.name || token.currency?.slice(0, 6)}</span>
        <span className={`font-mono ${isUp ? 'text-[#08AA09]' : 'text-red-500'}`}>{isUp ? '+' : ''}{change.toFixed(1)}%</span>
      </a>
      {showTooltip && tooltipPos && createPortal(
        <div className="fixed z-[9999] pointer-events-none" style={{ top: tooltipPos.top - 8, left: tooltipPos.left, transform: 'translate(-50%, -100%)' }}>
          <div className={`px-3 py-2.5 rounded-xl border-[1.5px] text-[11px] min-w-[200px] ${isDark ? 'bg-black border-white/[0.08]' : 'bg-white border-black/[0.08]'}`}>
            <div className="flex items-center gap-2 mb-2">
              {!imgError ? (
                <img src={`https://s1.xrpl.to/token/${md5}`} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-[#137DFE]/20 flex items-center justify-center text-[8px] text-[#137DFE]">T</span>
              )}
              <span className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-black'}`}>{token.name || token.currency?.slice(0, 6)}</span>
              <span className={`ml-auto font-mono font-semibold text-xs ${isDark ? 'text-white' : 'text-black'}`}>{formatPrice(token.exch)}</span>
            </div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
              <div><span className={isDark ? 'text-white/40' : 'text-black/40'}>24h</span><div className={`font-mono font-medium ${isUp ? 'text-[#08AA09]' : 'text-red-500'}`}>{isUp ? '+' : ''}{change.toFixed(1)}%</div></div>
              <div><span className={isDark ? 'text-white/40' : 'text-black/40'}>MCap</span><div className={`font-mono ${isDark ? 'text-white/70' : 'text-black/70'}`}>{formatMcap(token.marketcap)}</div></div>
              <div><span className={isDark ? 'text-white/40' : 'text-black/40'}>Holders</span><div className={`font-mono ${isDark ? 'text-white/70' : 'text-black/70'}`}>{token.holders?.toLocaleString() || '-'}</div></div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </span>
  );
};

const NFTPreview = ({ nftId }) => {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const triggerRef = useRef(null);
  const [tooltipPos, setTooltipPos] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
    apiFetch(`https://api.xrpl.to/v1/nft/${nftId}`)
      .then(r => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then(d => {
        const data = d.nft || d;
        if (!data || (!data.NFTokenID && !data._id)) throw new Error('invalid nft');
        setNft(data);
      })
      .catch(() => { setError(true); })
      .finally(() => setLoading(false));
  }, [nftId]);

  if (loading) return <span className="text-[#650CD4] text-xs">loading...</span>;

  if (error || !nft) return <span className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>{nftId.slice(0, 8)}...{nftId.slice(-4)}</span>;

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

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setTooltipPos({ top: rect.top, left: rect.left + rect.width / 2 });
    }
    setShowTooltip(true);
  };

  return (
    <span className="relative inline-block" ref={triggerRef} onMouseEnter={handleMouseEnter} onMouseLeave={() => setShowTooltip(false)}>
      <a href={`/nft/${nftId}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-[#650CD4]/10 border border-[#650CD4]/20 hover:border-[#650CD4]/40 transition-colors text-xs">
        {imgSrc ? <img src={imgSrc} alt="" className="w-4 h-4 rounded object-cover" /> : <span className="w-4 h-4 rounded bg-[#650CD4]/30 flex items-center justify-center text-[8px] text-[#650CD4]">N</span>}
        <span className="font-medium text-[#650CD4]">{name || `${nftId.slice(0, 6)}...`}</span>
      </a>
      {showTooltip && tooltipPos && createPortal(
        <div className="fixed z-[9999] pointer-events-none" style={{ top: tooltipPos.top - 8, left: tooltipPos.left, transform: 'translate(-50%, -100%)' }}>
          <div className={`px-3 py-2.5 rounded-xl border-[1.5px] text-[11px] min-w-[200px] ${isDark ? 'bg-black border-white/[0.08]' : 'bg-white border-black/[0.08]'}`}>
            <div className="flex items-center gap-2 mb-2">
              {imgSrc ? (
                <img src={imgSrc} alt="" className="w-5 h-5 rounded object-cover" />
              ) : (
                <span className="w-5 h-5 rounded bg-[#650CD4]/20 flex items-center justify-center text-[8px] text-[#650CD4]">N</span>
              )}
              <div className="min-w-0">
                <div className={`font-semibold text-xs truncate ${isDark ? 'text-white' : 'text-black'}`}>{name || `${nftId.slice(0, 6)}...`}</div>
                {collection && <div className={`text-[10px] truncate ${isDark ? 'text-white/40' : 'text-black/40'}`}>{collection}</div>}
              </div>
              {buyNow && <span className={`ml-auto font-mono font-semibold text-xs shrink-0 ${isDark ? 'text-white' : 'text-black'}`}>{formatXrp(buyNow)} XRP</span>}
            </div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
              <div><span className={isDark ? 'text-white/40' : 'text-black/40'}>Best Offer</span><div className={`font-mono font-medium ${isDark ? 'text-white/70' : 'text-black/70'}`}>{bestOffer ? formatXrp(bestOffer) + ' XRP' : '-'}</div></div>
              <div><span className={isDark ? 'text-white/40' : 'text-black/40'}>Rank</span><div className="font-mono font-medium text-[#650CD4]">{rank ? `#${rank.toLocaleString()}` : '-'}</div></div>
              <div><span className={isDark ? 'text-white/40' : 'text-black/40'}>Supply</span><div className={`font-mono ${isDark ? 'text-white/70' : 'text-black/70'}`}>{total ? total.toLocaleString() : '-'}</div></div>
            </div>
            {created && (
              <div className={`text-[10px] mt-2 pt-1.5 ${isDark ? 'text-white/30 border-t border-white/[0.06]' : 'text-black/30 border-t border-black/[0.06]'}`}>
                {timeAgo(created)}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </span>
  );
};

const CollectionPreview = ({ slug }) => {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [col, setCol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const triggerRef = useRef(null);
  const [tooltipPos, setTooltipPos] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
    apiFetch(`https://api.xrpl.to/v1/nft/collections/${slug}`)
      .then(r => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then(d => {
        if (!d || !d.slug) throw new Error('invalid');
        setCol(d);
      })
      .catch(() => { setError(true); })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <span className="text-[#650CD4] text-xs">loading...</span>;
  if (error || !col) return <a href={`/nfts/${slug}`} className="text-[#650CD4] hover:underline text-xs">/nfts/{slug}</a>;

  const formatXrp = (p) => !p ? '-' : p >= 1e6 ? (p / 1e6).toFixed(2) + 'M' : p >= 1e3 ? (p / 1e3).toFixed(1) + 'K' : p?.toLocaleString();
  const floorChange = col.floor7dPercent || 0;
  const isUp = floorChange >= 0;

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setTooltipPos({ top: rect.top, left: rect.left + rect.width / 2 });
    }
    setShowTooltip(true);
  };

  return (
    <span className="relative inline-block" ref={triggerRef} onMouseEnter={handleMouseEnter} onMouseLeave={() => setShowTooltip(false)}>
      <a href={`/nfts/${slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-[#650CD4]/10 border border-[#650CD4]/20 hover:border-[#650CD4]/40 transition-colors text-xs">
        {col.logoImage ? <img src={`https://s1.xrpl.to/nft-collection/${col.logoImage}`} className="w-4 h-4 rounded object-cover" alt="" /> : <span className="w-4 h-4 rounded bg-[#650CD4]/30 flex items-center justify-center text-[8px] text-[#650CD4]">C</span>}
        <span className="font-medium text-[#650CD4]">{col.name}</span>
        <span className={`font-mono text-[10px] ${isUp ? 'text-[#08AA09]' : 'text-red-500'}`}>{col.floor ? formatXrp(col.floor) + ' XRP' : ''}</span>
      </a>
      {showTooltip && tooltipPos && createPortal(
        <div className="fixed z-[9999] pointer-events-none" style={{ top: tooltipPos.top - 8, left: tooltipPos.left, transform: 'translate(-50%, -100%)' }}>
          <div className={`px-3 py-2.5 rounded-xl border-[1.5px] text-[11px] min-w-[220px] ${isDark ? 'bg-black border-white/[0.08]' : 'bg-white border-black/[0.08]'}`}>
            <div className="flex items-center gap-2 mb-2">
              {col.logoImage ? <img src={`https://s1.xrpl.to/nft-collection/${col.logoImage}`} className="w-5 h-5 rounded object-cover" alt="" /> : <span className="w-5 h-5 rounded bg-[#650CD4]/20 flex items-center justify-center text-[8px] text-[#650CD4]">C</span>}
              <div className="min-w-0">
                <div className={`font-semibold text-xs truncate ${isDark ? 'text-white' : 'text-black'}`}>{col.name}</div>
                {col.origin && <div className={`text-[10px] truncate ${isDark ? 'text-white/40' : 'text-black/40'}`}>{col.origin}</div>}
              </div>
              {col.floor && <span className={`ml-auto font-mono font-semibold text-xs shrink-0 ${isDark ? 'text-white' : 'text-black'}`}>{formatXrp(col.floor)} XRP</span>}
            </div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
              <div><span className={isDark ? 'text-white/40' : 'text-black/40'}>Items</span><div className={`font-mono ${isDark ? 'text-white/70' : 'text-black/70'}`}>{col.items?.toLocaleString() || '-'}</div></div>
              <div><span className={isDark ? 'text-white/40' : 'text-black/40'}>Owners</span><div className={`font-mono ${isDark ? 'text-white/70' : 'text-black/70'}`}>{col.owners?.toLocaleString() || '-'}</div></div>
              <div><span className={isDark ? 'text-white/40' : 'text-black/40'}>Listed</span><div className={`font-mono ${isDark ? 'text-white/70' : 'text-black/70'}`}>{col.listedCount?.toLocaleString() || '-'}</div></div>
              <div><span className={isDark ? 'text-white/40' : 'text-black/40'}>Volume</span><div className={`font-mono ${isDark ? 'text-white/70' : 'text-black/70'}`}>{formatXrp(col.totalVolume)} XRP</div></div>
              <div><span className={isDark ? 'text-white/40' : 'text-black/40'}>7d Floor</span><div className={`font-mono font-medium ${isUp ? 'text-[#08AA09]' : 'text-red-500'}`}>{isUp ? '+' : ''}{floorChange.toFixed(1)}%</div></div>
              <div><span className={isDark ? 'text-white/40' : 'text-black/40'}>Sales 24h</span><div className={`font-mono ${isDark ? 'text-white/70' : 'text-black/70'}`}>{col.sales24h?.toLocaleString() || '-'}</div></div>
            </div>
          </div>
        </div>,
        document.body
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
  const collectionRegex = /(?:https?:\/\/xrpl\.to)?\/nfts\/([a-zA-Z0-9_-]+)/g;
  const emoteRegex = /\b([A-Za-z][A-Za-z0-9]{2,}(?:[A-Z][a-z0-9]*)*)\b/g;

  const parts = [];
  let last = 0;

  // Process NFT, token, and collection links
  const nftMatches = [...text.matchAll(nftRegex)];
  const tokenMatches = [...text.matchAll(tokenRegex)];
  const collectionMatches = [...text.matchAll(collectionRegex)];
  const allMatches = [...nftMatches.map(m => ({ ...m, type: 'nft' })), ...tokenMatches.map(m => ({ ...m, type: 'token' })), ...collectionMatches.map(m => ({ ...m, type: 'collection' }))].sort((a, b) => a.index - b.index);

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
    } else if (m.type === 'collection') {
      parts.push(<CollectionPreview key={`col-${m.index}`} slug={m[1]} />);
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

const getApiKey = () => {
  if (typeof window === 'undefined') return null;
  try {
    const profile = JSON.parse(localStorage.getItem('account_profile_2') || 'null');
    return profile?.apiKey || null;
  } catch { return null; }
};

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
      <div className="h-[400px] max-sm:h-full max-sm:flex-1 flex flex-col items-center justify-center text-center px-6">
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
    <div className="h-[400px] max-sm:h-full max-sm:flex-1 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-inherit shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1.5 hover:bg-white/10 rounded-lg active:bg-white/20"><ChevronLeft size={18} /></button>
          <span className="text-sm font-medium">Support Tickets</span>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-[#137DFE] text-white hover:bg-[#137DFE]/80 active:bg-[#137DFE]/60">
          <Plus size={14} /> New
        </button>
      </div>
      <div className="flex gap-1.5 px-2 py-2 border-b border-inherit overflow-x-auto scrollbar-hide">
        {['open', 'in_progress', 'resolved', 'all'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-2.5 py-1 text-[11px] rounded-lg capitalize shrink-0 transition-all active:scale-95 ${filter === s ? 'bg-[#650CD4] text-white' : 'opacity-60 hover:opacity-100 active:opacity-100'}`}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center h-full"><Loader2 size={20} className="animate-spin opacity-40" /></div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-40">
            <HelpCircle size={24} className="mb-2" />
            <p className="text-xs">No tickets found</p>
          </div>
        ) : (
          tickets.map(t => (
            <button key={t._id} onClick={() => setSelectedTicket(t._id)} className="w-full text-left px-3 py-3 hover:bg-white/5 active:bg-white/10 border-b border-inherit last:border-b-0 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm truncate flex-1">{t.subject}</span>
                <TicketStatus status={t.status} />
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-[11px] opacity-50">
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
    <div className="h-[400px] max-sm:h-full max-sm:flex-1 flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-inherit shrink-0">
        <button onClick={onBack} className="p-1.5 hover:bg-white/10 rounded-lg active:bg-white/20"><ChevronLeft size={18} /></button>
        <span className="text-sm font-medium">New Ticket</span>
      </div>
      <div className="flex-1 p-3 max-sm:p-4 space-y-4 overflow-y-auto overscroll-contain scrollbar-hide">
        {error && <div className="px-3 py-2.5 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>}
        <div>
          <label className="text-[11px] uppercase opacity-50 mb-1.5 block">Subject</label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value.slice(0, 100))}
            placeholder="Brief description..."
            className={`w-full px-3 py-2.5 max-sm:py-3 rounded-lg border text-sm max-sm:text-base ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
          />
          <span className="text-[11px] opacity-40 mt-1 block text-right">{subject.length}/100</span>
        </div>
        <div>
          <label className="text-[11px] uppercase opacity-50 mb-1.5 block">Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value.slice(0, 2000))}
            placeholder="Describe your issue in detail..."
            rows={6}
            className={`w-full px-3 py-2.5 max-sm:py-3 rounded-lg border text-sm max-sm:text-base resize-none ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
          />
          <span className="text-[11px] opacity-40 mt-1 block text-right">{message.length}/2000</span>
        </div>
      </div>
      <div className="p-3 max-sm:p-4 max-sm:pb-[calc(16px+env(safe-area-inset-bottom))] border-t border-inherit">
        <button
          onClick={submit}
          disabled={submitting || subject.length < 3 || message.length < 10}
          className="w-full py-2.5 max-sm:py-3 rounded-lg bg-[#137DFE] text-white text-sm max-sm:text-base font-medium disabled:opacity-40 active:bg-[#137DFE]/60 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
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

  if (loading) return <div className="h-[400px] max-sm:h-full max-sm:flex-1 flex items-center justify-center"><Loader2 size={20} className="animate-spin opacity-40" /></div>;
  if (!ticket) return <div className="h-[400px] max-sm:h-full max-sm:flex-1 flex items-center justify-center opacity-40">Ticket not found</div>;

  const canReply = ticket.status !== 'closed';

  return (
    <div className="h-[400px] max-sm:h-full max-sm:flex-1 flex flex-col">
      <div className="px-3 py-2 border-b border-inherit">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={onBack} className="p-1.5 hover:bg-white/10 rounded-lg active:bg-white/20 shrink-0"><ChevronLeft size={18} /></button>
            <span className="text-sm font-medium truncate max-sm:max-w-[180px] max-w-[200px]">{ticket.subject}</span>
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
        {!isStaff && ticket.wallet === wallet && !['resolved', 'closed'].includes(ticket.status) && (
          <div className="flex gap-1 mt-2 pl-7">
            {['resolved', 'closed'].map(s => (
              <button key={s} onClick={() => updateStatus(s)} className="px-2 py-0.5 text-[10px] rounded bg-white/10 hover:bg-white/20 capitalize">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide px-3 py-2 space-y-3">
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
        <div className="p-2 max-sm:p-3 max-sm:pb-[calc(12px+env(safe-area-inset-bottom))] border-t border-inherit flex gap-2">
          <input
            value={reply}
            onChange={e => setReply(e.target.value.slice(0, 2000))}
            placeholder="Type your reply..."
            onKeyDown={e => e.key === 'Enter' && sendReply()}
            className={`flex-1 px-3 py-2.5 max-sm:py-3 rounded-lg border text-sm max-sm:text-base ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
          />
          <button onClick={sendReply} disabled={!reply.trim() || submitting} className={`px-3 py-2.5 max-sm:px-4 max-sm:py-3 rounded-lg transition-all duration-200 ${reply.trim() && !submitting ? 'bg-[#137DFE] text-white hover:bg-[#137DFE]/80 active:scale-90' : isDark ? 'bg-white/5 text-white/20' : 'bg-black/5 text-black/20'}`}>
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className={`transition-transform duration-200 ${reply.trim() ? '-rotate-45 translate-x-[1px] -translate-y-[1px]' : ''}`} />}
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
  const { themeName } = useContext(ThemeContext);
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
  const [dmTabs, setDmTabs] = useState([]);
  const [closedDms, setClosedDms] = useState([]);
  const [dmReadAt, setDmReadAt] = useState({});
  const walletKeyRef = useRef(authUser?.wallet);
  const dmKey = useCallback((key) => walletKeyRef.current ? `${key}_${walletKeyRef.current}` : null, []);
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const justOpenedRef = useRef(false);
  const inputRef = useRef(null);
  const dmTabsRef = useRef(dmTabs);
  const authUserRef = useRef(null);
  const activeTabRef = useRef(activeTab);
  const dmReadAtRef = useRef(dmReadAt);
  useEffect(() => { dmTabsRef.current = dmTabs; }, [dmTabs]);
  useEffect(() => { authUserRef.current = authUser; }, [authUser]);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { dmReadAtRef.current = dmReadAt; }, [dmReadAt]);
  // Reload DM state when wallet changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = authUser?.wallet;
    walletKeyRef.current = w;
    if (!w) {
      setDmTabs([]);
      setClosedDms([]);
      setDmReadAt({});
      setActiveTab('general');
      setPrivateTo('');
      return;
    }
    try { setDmTabs(JSON.parse(localStorage.getItem(`chat_dm_tabs_${w}`) || '[]')); } catch { setDmTabs([]); }
    try { setClosedDms(JSON.parse(localStorage.getItem(`chat_closed_dms_${w}`) || '[]')); } catch { setClosedDms([]); }
    try { setDmReadAt(JSON.parse(localStorage.getItem(`chat_dm_read_at_${w}`) || '{}')); } catch { setDmReadAt({}); }
    setActiveTab('general');
    setPrivateTo('');
  }, [authUser?.wallet]);
  // Sync authUser wallet with localStorage (event-driven, no polling)
  useEffect(() => {
    const handleStorage = (e) => {
      // null key = clear(), otherwise only react to account_profile_2
      if (e && e.key !== null && e.key !== 'account_profile_2') return;
      const acc = getLoggedInWallet();
      if (acc !== (authUser?.wallet || null)) {
        setAuthUser(prev => acc ? { ...prev, wallet: acc } : { ...prev, wallet: null });
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => { window.removeEventListener('storage', handleStorage); };
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
    if (t === 'member' || !t) return isDark ? 'text-white/50' : 'text-black/50';
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
    const sh = el.scrollHeight;
    const st = el.scrollTop;
    const ch = el.clientHeight;
    requestAnimationFrame(() => {
      const nearBottom = sh - st - ch < 80;
      isNearBottomRef.current = nearBottom;
      setShowScrollBtn(!nearBottom);
      if (nearBottom) setNewMsgCount(0);
    });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewMsgCount(0);
    setShowScrollBtn(false);
  };

  const modAction = async (action, wallet, duration = null) => {
    const apiKey = getApiKey();
    if (!apiKey) { setModError('No API key'); return null; }
    try {
      const res = await apiFetch(`https://api.xrpl.to/v1/chat/${action}`, {
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
        convos[other] = { ...m };
      }
    });
    Object.keys(convos).forEach(other => {
      const msg = convos[other];
      const lastRead = dmReadAt[other] || 0;
      convos[other].unread = getWallet(msg) !== authUser?.wallet && msg.timestamp > lastRead;
    });
    return Object.entries(convos).sort((a, b) => b[1].timestamp - a[1].timestamp);
  }, [messages, authUser?.wallet, dmReadAt]);

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
          if (data.dmReadAt) {
            setDmReadAt(prev => {
              const merged = { ...prev, ...data.dmReadAt };
              localStorage.setItem(dmKey('chat_dm_read_at'), JSON.stringify(merged));
              return merged;
            });
          }
          if (data.conversations?.length) {
            // Add users to DM tabs (except closed ones and self)
            const closed = JSON.parse(localStorage.getItem(dmKey('chat_closed_dms')) || '[]');
            const myWallet = authUserRef.current?.wallet;
            const newUsers = data.conversations.map(c => c.wallet).filter(u => u && u !== myWallet && !dmTabsRef.current.includes(u) && !closed.includes(u));
            if (newUsers.length) {
              const newTabs = [...dmTabsRef.current, ...newUsers];
              setDmTabs(newTabs);
              localStorage.setItem(dmKey('chat_dm_tabs'), JSON.stringify(newTabs));
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
            localStorage.setItem(dmKey('chat_dm_tabs'), JSON.stringify(newTabs));
          }
          // Auto-read if user is viewing this conversation
          if (dmUser && dmUser === activeTabRef.current && senderWallet !== myWallet2) {
            const now = Date.now();
            setDmReadAt(prev => {
              const updated = { ...prev, [dmUser]: now };
              localStorage.setItem(dmKey('chat_dm_read_at'), JSON.stringify(updated));
              return updated;
            });
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'read', with: dmUser }));
            }
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

  // Fetch messages via REST for non-logged-in users (read-only mode)
  useEffect(() => {
    if (!isOpen || authUser?.wallet) return;

    let cancelled = false;
    const fetchMessages = async () => {
      try {
        const res = await apiFetch('https://api.xrpl.to/api/chat/messages?limit=50');
        const data = await res.json();
        if (!cancelled && data.messages) {
          setMessages(data.messages);
          setOnlineCount(data.online || 0);
        }
      } catch { }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 10000); // Refresh every 10s

    return () => { cancelled = true; clearInterval(interval); };
  }, [isOpen, authUser?.wallet]);

  useEffect(() => {
    if (!isOpen || !getLoggedInWallet()) return;

    // Mark chat as read
    apiFetch('https://api.xrpl.to/v1/chat/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: getLoggedInWallet() })
    }).catch(() => { });

    let ws = null;
    let pingInterval = null;
    let reconnectTimeout = null;
    let unmounted = false;

    const init = async () => {
      ws = await connect();
      if (!ws || unmounted) {
        if (ws) ws.close();
        return;
      }

      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
      }, 30000);

      ws.onclose = () => {
        clearInterval(pingInterval);
        if (!unmounted && isOpen && getLoggedInWallet()) {
          reconnectTimeout = setTimeout(() => wsRef.current?.readyState !== WebSocket.OPEN && connect(), 3000);
        }
      };
    };

    init();

    return () => {
      unmounted = true;
      if (pingInterval) clearInterval(pingInterval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      setRegistered(false);
      setModLevel(null);
    };
  }, [isOpen, connect, authUser?.wallet]);

  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView(justOpenedRef.current ? { block: 'end' } : { behavior: 'smooth' });
    } else if (!justOpenedRef.current) {
      setNewMsgCount(c => c + 1);
    }
    if (justOpenedRef.current) {
      messagesEndRef.current?.scrollIntoView({ block: 'end' });
    }
  }, [messages]);

  useEffect(() => {
    try { localStorage.setItem('chat_open', isOpen); } catch { }
    if (isOpen) {
      justOpenedRef.current = true;
      // Scroll immediately and again after messages render
      const scroll = () => messagesEndRef.current?.scrollIntoView({ block: 'end' });
      scroll();
      setTimeout(scroll, 100);
      setTimeout(scroll, 300);
      setTimeout(scroll, 600);
      setTimeout(() => { scroll(); justOpenedRef.current = false; }, 1500);
    }
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
    if (isOpen) messagesEndRef.current?.scrollIntoView();
  }, [activeTab]);

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
      localStorage.setItem(dmKey('chat_dm_tabs'), JSON.stringify(newTabs));
    }
    // Remove from closed list if reopening
    if (closedDms.includes(user)) {
      const newClosed = closedDms.filter(u => u !== user);
      setClosedDms(newClosed);
      localStorage.setItem(dmKey('chat_closed_dms'), JSON.stringify(newClosed));
    }
    setActiveTab(user);
    setPrivateTo(user);
    inputRef.current?.focus();
    // Mark conversation as read locally
    setDmReadAt(prev => {
      const updated = { ...prev, [user]: Date.now() };
      localStorage.setItem(dmKey('chat_dm_read_at'), JSON.stringify(updated));
      return updated;
    });
    // Request DM history and mark as read on server
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'history', with: user }));
      wsRef.current.send(JSON.stringify({ type: 'read', with: user }));
    }
  };

  const closeDmTab = (user, e) => {
    e.stopPropagation();
    const newTabs = dmTabs.filter(t => t !== user);
    setDmTabs(newTabs);
    localStorage.setItem(dmKey('chat_dm_tabs'), JSON.stringify(newTabs));
    // Track closed DMs so they don't reappear from inbox
    if (!closedDms.includes(user)) {
      const newClosed = [...closedDms, user];
      setClosedDms(newClosed);
      localStorage.setItem(dmKey('chat_closed_dms'), JSON.stringify(newClosed));
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

  const baseClasses = isDark ? 'bg-black text-white border-white/[0.08]' : 'bg-white text-black border-black/[0.08]';

  return (
    <div className={`fixed z-50 ${isOpen ? 'bottom-4 right-4 max-sm:top-0 max-sm:left-0 max-sm:right-0 max-sm:bottom-0 max-sm:touch-manipulation' : 'bottom-4 right-4 max-sm:bottom-0 max-sm:right-0 max-sm:left-0'}`}>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-xl border-[1.5px] transition-all duration-200 active:scale-[0.97] max-sm:w-full max-sm:justify-center max-sm:rounded-none max-sm:border-x-0 max-sm:border-b-0 max-sm:py-3 ${isDark ? 'bg-black border-white/[0.08] hover:border-[#137DFE]/30' : 'bg-white border-black/[0.08] hover:border-[#137DFE]/30'}`}
        >
          <MessageCircle size={18} className="text-[#137DFE] shrink-0" />
          <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-black'}`}>Shoutbox</span>
          <span className={`h-5 w-px shrink-0 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
          <span className="flex items-center gap-1.5 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#08AA09] animate-pulse" />
            <span className={`tabular-nums ${isDark ? 'text-white/50' : 'text-black/50'}`}>{onlineCount >= 1000 ? `${(onlineCount / 1000).toFixed(1)}K` : onlineCount}</span>
          </span>
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-md bg-[#650CD4] text-white text-[11px] font-bold leading-none max-sm:hidden">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      ) : (
        <div
          ref={containerRef}
          onClick={() => { if (!isFocused) inputRef.current?.focus(); }}
          className={`w-[560px] max-sm:w-full max-sm:h-full max-sm:rounded-none rounded-xl border-[1.5px] max-sm:border-0 ${baseClasses} overflow-hidden shadow-2xl flex flex-col`}
        >
          <div className="flex items-center justify-between px-3 py-2.5 max-sm:py-3 max-sm:pt-[calc(12px+env(safe-area-inset-top))] border-b border-inherit shrink-0">
            <div className="flex items-center gap-2 max-sm:gap-2.5">
              <span className="font-bold text-sm max-sm:text-base">Shoutbox</span>
              {onlineCount > 0 && (
                <span className="flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-[#08AA09]/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#08AA09] animate-pulse" />
                  <span className="text-[#08AA09] font-semibold tabular-nums">{onlineCount >= 1000 ? `${(onlineCount / 1000).toFixed(1)}K` : onlineCount}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5 max-sm:gap-1">
              <button onClick={() => { setShowSupport(true); setSupportNotif(0); }} className={`relative p-2 max-sm:p-2.5 rounded-lg transition-colors active:scale-95 ${showSupport ? 'bg-[#137DFE] text-white' : 'hover:bg-white/10 active:bg-white/20'}`} title="Support Tickets">
                <HelpCircle size={16} className="max-sm:w-5 max-sm:h-5" />
                {supportNotif > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">{supportNotif}</span>
                )}
              </button>
              <div className="relative inbox-dropdown">
                <button onClick={() => setShowInbox(!showInbox)} className={`relative p-2 max-sm:p-2.5 rounded-lg transition-colors active:scale-95 ${showInbox ? 'bg-[#650CD4] text-white' : 'hover:bg-white/10 active:bg-white/20'}`}>
                  <Inbox size={16} className="max-sm:w-5 max-sm:h-5" />
                  {conversations.filter(([, m]) => m.unread).length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#650CD4] text-white text-[9px] font-medium flex items-center justify-center">{conversations.filter(([, m]) => m.unread).length}</span>
                  )}
                </button>
                {showInbox && (
                  <div className={`absolute right-0 max-sm:-right-2 top-10 w-80 max-sm:w-[calc(100vw-32px)] max-sm:max-w-[320px] rounded-xl border-[1.5px] ${baseClasses} shadow-2xl z-50 overflow-hidden`}>
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
                      <div className="max-h-[480px] max-sm:max-h-[60vh] overflow-y-auto overscroll-contain scrollbar-hide">
                        {conversations.map(([user, msg]) => (
                          <button
                            key={user}
                            onClick={() => { openDmTab(user); setShowInbox(false); }}
                            className={`w-full text-left px-3 py-1.5 border-b border-inherit last:border-b-0 transition-colors group ${isDark ? 'hover:bg-white/5 active:bg-white/10' : 'hover:bg-black/5 active:bg-black/10'}`}
                          >
                            <div className="flex items-center gap-2">
                              <DmAvatar wallet={user} size="sm" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`font-medium text-xs ${getTierTextColor(getUserTier(user))}`}>{user.slice(0, 6)}...{user.slice(-4)}</span>
                                  <span className="text-[10px] opacity-40">{timeAgo(msg.timestamp)}</span>
                                </div>
                                <div className="text-[11px] opacity-50 truncate">{msg.message}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 max-sm:p-2.5 rounded-lg hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all">
                <X size={16} className="max-sm:w-5 max-sm:h-5" />
              </button>
            </div>
          </div>

          {modError && (
            <div className="px-3 py-2 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs flex items-center justify-between">
              <span>{modError}</span>
              <button onClick={() => setModError(null)} className="hover:text-red-300"><X size={14} /></button>
            </div>
          )}
          {!registered && authUser?.wallet ? (
            <div className="h-[400px] max-sm:h-full max-sm:flex-1 flex items-center justify-center">
              <div className="text-center opacity-40">
                <Loader2 size={20} className="animate-spin mx-auto mb-2.5" />
                <p className="text-sm font-medium">Connecting...</p>
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
                    <div className="flex gap-0.5 px-1 py-1 border-b border-inherit overflow-x-auto scrollbar-hide overscroll-x-contain touch-pan-x shrink-0">
                      <button
                        onClick={() => { setActiveTab('general'); setPrivateTo(''); }}
                        className={`px-2 py-0.5 text-[10px] rounded-md shrink-0 font-medium transition-all active:scale-95 ${activeTab === 'general' ? 'bg-[#137DFE] text-white' : isDark ? 'bg-white/5 hover:bg-white/10 active:bg-white/15' : 'bg-black/5 hover:bg-black/10 active:bg-black/15'}`}
                      >
                        General
                      </button>
                      {authUser?.wallet && [...dmTabs].sort((a, b) => {
                        const aMsg = conversations.find(([u]) => u === a)?.[1]?.timestamp || 0;
                        const bMsg = conversations.find(([u]) => u === b)?.[1]?.timestamp || 0;
                        return bMsg - aMsg;
                      }).map(user => {
                        const lastRead = dmReadAt[user] || 0;
                        const hasUnread = activeTab !== user && messages.some(m => (m.isPrivate || m.type === 'private') && getWallet(m) === user && m.timestamp > lastRead);
                        return (
                        <button
                          key={user}
                          onClick={() => openDmTab(user)}
                          title={user}
                          className={`group/tab px-1 py-0.5 text-[10px] rounded-md shrink-0 flex items-center gap-0.5 font-medium transition-all active:scale-95 ${activeTab === user ? 'bg-[#650CD4] text-white' : hasUnread ? 'bg-[#F6AF01]/10 hover:bg-[#F6AF01]/20 active:bg-[#F6AF01]/30' : isDark ? 'bg-white/5 hover:bg-white/10 active:bg-white/15' : 'bg-black/5 hover:bg-black/10 active:bg-black/15'}`}
                        >
                          <span className="relative">
                            <DmAvatar wallet={user} size="sm" />
                            {hasUnread && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#F6AF01] animate-pulse" />}
                          </span>
                          <span className={`${getTierTextColor(getUserTier(user))}`}>{user.slice(0, 4)}..{user.slice(-3)}</span>
                          <span onClick={(e) => closeDmTab(user, e)} className="p-0.5 -mr-0.5 rounded opacity-0 group-hover/tab:opacity-50 hover:!opacity-100 active:!opacity-100 hover:text-red-400 active:text-red-400 transition-opacity"><X size={9} /></span>
                        </button>
                        );
                      })}
                    </div>
                    <div className="relative h-[400px] max-sm:!h-0 max-sm:flex-1 max-sm:min-h-0">
                    <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide px-2 py-1 max-sm:px-1.5 scroll-smooth overscroll-contain" onScroll={handleMessagesScroll}>
                      {filtered.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-25 text-sm gap-1">
                          <Send size={16} />
                          <span>{activeTab === 'general' ? 'No messages yet' : 'Start a conversation'}</span>
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
                          <div key={msg._id || i} className={`flex items-baseline gap-1 py-0.5 px-1 -mx-1 rounded text-[12px] max-sm:text-[11px] leading-relaxed transition-colors overflow-hidden ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-black/[0.03]'}`}>
                            <span className="text-[10px] opacity-25 shrink-0 tabular-nums w-[44px] text-right whitespace-nowrap">
                              {timeAgo(msg.timestamp)}
                            </span>
                            <ChatAvatar wallet={msgWallet} />
                            <span className="relative group shrink-0">
                              <button
                                onClick={() => { if (!isOwn) openDmTab(msgWallet); }}
                                className={`font-semibold hover:underline ${isOwn ? 'text-[#137DFE]' : msg.tier && msg.tier.toLowerCase() !== 'member' ? getTierTextColor(msg.tier) : activeTab !== 'general' ? 'text-[#650CD4]' : 'text-[#08AA09]'}`}
                              >
                                {isOwn ? 'You' : shortName}:
                              </button>
                              {!isOwn && (
                                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
                                  <div className={`px-3 py-2.5 rounded-xl border-[1.5px] text-[11px] whitespace-nowrap ${isDark ? 'bg-black border-white/[0.08]' : 'bg-white border-black/[0.08]'}`}>
                                    <div className={`font-mono text-xs mb-1.5 ${isDark ? 'text-white' : 'text-black'}`}>{msgWallet}</div>
                                    <div className={`flex gap-3 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                      {msg.tier && <span>Tier <span className={isDark ? 'text-white/70' : 'text-black/70'}>{msg.tier}</span></span>}
                                      {msg.platform && <span>Platform <span className={isDark ? 'text-white/70' : 'text-black/70'}>{msg.platform}</span></span>}
                                    </div>
                                    <div className="text-[#137DFE] mt-2 text-[10px] font-medium">Click to DM</div>
                                    {(canMute(msg.tier) || canBan()) && (
                                      <div className={`flex gap-2 mt-2 pt-2 border-t ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                                        {canMute(msg.tier) && (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); muteUser(msgWallet, 30); }}
                                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F6AF01]/10 text-[#F6AF01] hover:bg-[#F6AF01]/20 text-[10px] font-medium"
                                          >
                                            <VolumeX size={10} /> Mute 30m
                                          </button>
                                        )}
                                        {canBan() && (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); banUser(msgWallet, 60); }}
                                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[10px] font-medium"
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
                                  <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/read:block z-50 px-2 py-1 rounded text-[10px] whitespace-nowrap ${isDark ? 'bg-[#1a1a1a] border border-white/10 text-white/80' : 'bg-white border border-black/10 text-black/80'}`}>
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
                      <button onClick={scrollToBottom} className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#137DFE] text-white text-[11px] font-semibold shadow-lg hover:bg-[#137DFE]/90 active:scale-95 transition-all z-10 backdrop-blur-sm">
                        <ChevronDown size={12} />
                        {newMsgCount > 0 ? `${newMsgCount} new` : 'Latest'}
                      </button>
                    )}
                    </div>
                  </>
                );
              })()}
              <div className="px-2 py-2 max-sm:px-3 max-sm:py-3 max-sm:pb-[calc(12px+env(safe-area-inset-bottom))] border-t border-inherit shrink-0">
                {!authUser?.wallet ? (
                  <div className={`flex items-center justify-center gap-2 py-3 text-sm rounded-xl ${isDark ? 'text-white/40 bg-white/[0.02]' : 'text-black/40 bg-black/[0.02]'}`}>
                    <Send size={14} />
                    <span>Connect wallet to chat</span>
                  </div>
                ) : (
                  <>
                    {(attachedNft || attachedToken) && (
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {attachedToken && (
                          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[#137DFE]/10 border border-[#137DFE]/20">
                            <AttachedTokenPreview md5={attachedToken} />
                            <button onClick={() => setAttachedToken(null)} className="p-1 hover:bg-white/10 active:bg-white/20 rounded text-white/40 hover:text-white">
                              <X size={14} />
                            </button>
                          </div>
                        )}
                        {attachedNft && (
                          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[#650CD4]/10 border border-[#650CD4]/20">
                            <NFTPreview nftId={attachedNft} />
                            <button onClick={() => setAttachedNft(null)} className="p-1 hover:bg-white/10 active:bg-white/20 rounded text-white/40 hover:text-white">
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="relative flex items-center gap-1">
                      <EmotePicker inputRef={inputRef} input={input} setInput={setInput} />
                      <input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value.slice(0, 256))}
                        placeholder={activeTab === 'general' ? 'Message...' : `DM ${activeTab.slice(0, 6)}...`}
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
                        className={`flex-1 px-3 py-2.5 max-sm:py-3 rounded-xl outline-none text-sm max-sm:text-base transition-all ${isDark ? 'bg-white/5 text-white placeholder-white/25 focus:bg-white/[0.07] focus:ring-1 focus:ring-white/10' : 'bg-black/5 text-black placeholder-black/25 focus:bg-black/[0.07] focus:ring-1 focus:ring-black/10'}`}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!input && !attachedNft && !attachedToken}
                        className={`px-3 max-sm:px-3.5 self-stretch rounded-xl transition-all duration-200 shrink-0 flex items-center justify-center ${(input || attachedNft || attachedToken) ? 'bg-[#137DFE] text-white hover:bg-[#137DFE]/80 active:scale-90' : isDark ? 'bg-white/5 text-white/20' : 'bg-black/5 text-black/20'}`}
                      >
                        <Send size={16} className={`max-sm:w-5 max-sm:h-5 transition-transform duration-200 ${(input || attachedNft || attachedToken) ? '-rotate-45 translate-x-[1px] -translate-y-[1px]' : ''}`} />
                      </button>
                      {input.length > 200 && (
                        <span className={`absolute right-14 top-1/2 -translate-y-1/2 text-[10px] ${input.length >= 256 ? 'text-red-500' : 'opacity-40'}`}>
                          {256 - input.length}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Chat;
