import Image from 'next/image';
import {
  useState,
  useContext,
  useEffect,
  memo,
  useCallback,
  useRef
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import axios from 'axios';
import { throttle } from 'src/utils/formatters';
import { AppContext } from 'src/AppContext';
import Logo from 'src/components/Logo';
import { addTokenToTabs } from 'src/hooks/useTokenTabs';

import { selectProcess, updateProcess } from 'src/redux/transactionSlice';
import { selectMetrics } from 'src/redux/statusSlice';
import { cn } from 'src/utils/cn';
import {
  Search,
  Menu,
  Star,
  ChevronDown,
  ExternalLink,
  Sparkles,
  ArrowLeftRight,
  Palette,
  Check,
  TrendingUp,
  Eye,
  Newspaper,
  Flame,
  Waves,
  X,
  PawPrint,
  Sun,
  Moon,
  BadgeCheck,
  Settings,
  Wallet,
  Trash2,
  Fingerprint,
  Mail,
  Loader2,
  ArrowRight,
  Layers
} from 'lucide-react';

const BASE_URL = 'https://api.xrpl.to/api';

// Validate XRPL 64-65 char hex (tx hash, NFTokenID, or NFTokenID with extra char)
const isValidHexId = (str) => /^[A-Fa-f0-9]{64,65}$/.test(str?.trim());

// Get NFT image: thumbnail first, IPFS fallback
const getNftImage = (nft) => {
  const thumb = nft?.files?.[0]?.thumbnail?.small;
  if (thumb) return `https://s1.xrpl.to/nft/${thumb}`;
  const ipfs = nft?.meta?.image;
  if (ipfs?.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${ipfs.slice(7)}`;
  if (ipfs?.startsWith('http')) return ipfs;
  return null;
};

// Validate XRPL address (starts with r, 25-35 base58 characters)
const isValidXrpAddress = (str) => /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(str?.trim());

// Validate ledger index (numeric, >= 32570 which is first available ledger)
const isValidLedgerIndex = (str) => {
  if (!/^\d+$/.test(str?.trim())) return false;
  const num = parseInt(str, 10);
  return num >= 32570 && num <= 9999999999;
};

const currencySymbols = {
  USD: '$ ',
  EUR: '€ ',
  JPY: '¥ ',
  CNH: '¥ ',
  XRP: '✕ '
};
const currencyConfig = {
  availableFiatCurrencies: ['XRP', 'USD', 'EUR', 'JPY', 'CNH'],
  activeFiatCurrency: 'XRP'
};

const truncateAccount = (account, chars = 4) => {
  if (!account) return '';
  return `${account.slice(0, chars)}...${account.slice(-chars)}`;
};


// Helper functions (from Topbar)
const abbreviateNumber = (num) => {
  if (Math.abs(num) < 1000) return num.toFixed(1);
  const suffixes = ['', 'k', 'M', 'B', 'T'];
  const magnitude = Math.floor(Math.log10(Math.abs(num)) / 3);
  const scaled = num / Math.pow(10, magnitude * 3);
  return scaled.toFixed(2).replace(/\.?0+$/, '') + suffixes[magnitude];
};

// Custom SVG icons as components
const XPMarketIcon = memo(({ className, size = 16 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="currentColor" role="img" aria-label="XPmarket">
    <path d="M17.7872 2.625H4.41504L7.67032 7.88327H14.5L17.9149 13.4089H24.4574L17.7872 2.625Z" />
    <path d="M1 18.6667L7.67014 29.4506L10.9573 24.1627L7.54248 18.6667L10.9573 13.1708L7.67014 7.88281L1 18.6667Z" />
    <path d="M24.3292 24.1931L30.9994 13.4092H24.4569L21.042 18.9051H14.2123L10.957 24.1931H24.3292Z" />
  </svg>
));
XPMarketIcon.displayName = 'XPMarketIcon';

const LedgerMemeIcon = memo(({ className, size = 16 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 26 26" role="img" aria-label="LedgerMeme">
    <g transform="scale(0.55)">
      <rect fill="#cfff04" width="36" height="36" rx="8" ry="8" x="0" y="0" />
      <g>
        <g>
          <path fill="#262626" d="M25.74,9.68c0.64,0,1.24-0.26,1.69-0.72l2.69-2.76h-1.64l-1.87,1.92c-0.23,0.24-0.55,0.37-0.88,0.37s-0.64-0.13-0.88-0.37l-1.87-1.92h-1.64l2.69,2.76c0.45,0.46,1.05,0.72,1.69,0.72Z" />
          <path fill="#262626" d="M27.43,10.62c-0.45-0.46-1.05-0.72-1.69-0.72s-1.24,0.26-1.69,0.72l-2.71,2.78h1.64l1.89-1.93c0.23-0.24,0.55-0.37,0.88-0.37s0.64,0.13,0.88,0.37l1.89,1.93h1.64l-2.71-2.78Z" />
          <path fill="#262626" d="M10.22,9.68c0.64,0,1.24-0.26,1.69-0.72l2.69-2.76h-1.64l-1.87,1.92c-0.23,0.24-0.55,0.37-0.88,0.37s-0.64-0.13-0.88-0.37l-1.87-1.92h-1.64l2.69,2.76c0.45,0.46,1.05,0.72,1.69,0.72Z" />
          <path fill="#262626" d="M10.22,9.90c-0.64,0-1.24,0.26-1.69,0.72l-2.71,2.78h1.64l1.89-1.93c0.23-0.24,0.55-0.37,0.88-0.37s0.64,0.13,0.88,0.37l1.89,1.93h1.64l-2.71-2.78c-0.45-0.46-1.05-0.72-1.69-0.72Z" />
        </g>
        <path fill="#262626" d="M5.81,17.4c0,6.73,5.45,12.18,12.18,12.18s12.18-5.45,12.18-12.18H5.81Z" />
      </g>
    </g>
  </svg>
));
LedgerMemeIcon.displayName = 'LedgerMemeIcon';

const HorizonIcon = memo(({ className, size = 16 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Horizon">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="M4.93 4.93l1.41 1.41" />
    <path d="M17.66 17.66l1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="M6.34 17.66l-1.41 1.41" />
    <path d="M19.07 4.93l-1.41 1.41" />
  </svg>
));
HorizonIcon.displayName = 'HorizonIcon';

const MoonvalveIcon = memo(({ className, size = 16 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 1080 1080" fill="#ff6b35" role="img" aria-label="Moonvalve">
    <g transform="matrix(0.21 0 0 -0.21 405.9 545.69)">
      <path d="M 4690 8839 C 4166 8779 3630 8512 3267 8130 C 2862 7705 2643 7206 2599 6608 C 2561 6084 2717 5513 3023 5055 C 3214 4769 3472 4512 3749 4333 C 4414 3901 5232 3796 5955 4050 C 6070 4091 6193 4147 6188 4157 C 6115 4302 6106 4421 6160 4563 C 6171 4591 6178 4615 6177 4617 C 6175 4618 6150 4613 6120 4604 C 5919 4550 5578 4525 5349 4549 C 4904 4595 4475 4772 4138 5047 C 4035 5132 3858 5318 3774 5430 C 3359 5983 3235 6685 3436 7347 C 3620 7955 4061 8447 4652 8706 C 4758 8752 4989 8830 5021 8830 C 5031 8830 5042 8835 5045 8840 C 5053 8852 4800 8851 4690 8839 z" transform="translate(-4390.76, -6381.14)" />
    </g>
    <g transform="matrix(0.21 0 0 -0.21 592.36 356.11)">
      <path d="M 4344 7780 C 4332 7775 4310 7755 4294 7735 C 4238 7661 4257 7531 4333 7476 C 4360 7456 4376 7455 4726 7452 L 5090 7449 L 5090 7245 L 5090 7040 L 4962 7040 C 4876 7040 4830 7036 4822 7028 C 4805 7011 4805 6789 4822 6772 C 4831 6763 4941 6760 5256 6760 C 5627 6760 5680 6762 5694 6776 C 5707 6788 5710 6815 5710 6899 C 5710 7042 5712 7040 5552 7040 L 5430 7040 L 5430 7245 L 5430 7449 L 5803 7452 L 6175 7455 L 6209 7479 C 6301 7545 6300 7713 6208 7770 C 6176 7790 6160 7790 5270 7789 C 4772 7789 4355 7785 4344 7780 z" transform="translate(-5269.57, -7274.67)" />
    </g>
    <g transform="matrix(0.21 0 0 -0.21 577.88 638.18)">
      <path d="M 4775 6606 C 4731 6586 4709 6557 4703 6508 C 4700 6484 4693 6459 4687 6453 C 4680 6443 4553 6440 4113 6440 C 3639 6440 3549 6438 3544 6426 C 3535 6402 3571 6230 3611 6105 C 3632 6039 3676 5933 3707 5870 L 3765 5755 L 4201 5750 L 4637 5745 L 4671 5717 C 4815 5600 4922 5539 5045 5505 C 5136 5480 5309 5474 5406 5493 C 5554 5521 5666 5576 5804 5689 L 5873 5745 L 5989 5748 C 6095 5751 6109 5749 6149 5728 C 6180 5711 6201 5690 6217 5660 C 6238 5620 6240 5605 6240 5454 C 6240 5303 6241 5290 6259 5280 C 6285 5266 6815 5266 6841 5280 C 6859 5290 6860 5304 6860 5534 C 6860 5797 6850 5868 6796 5985 C 6719 6155 6543 6322 6374 6389 C 6277 6426 6180 6440 6006 6440 C 5822 6440 5810 6444 5810 6504 C 5810 6545 5778 6588 5734 6606 C 5686 6626 4820 6626 4775 6606 z" transform="translate(-5201.3, -5945.25)" />
    </g>
    <g transform="matrix(0.21 0 0 -0.21 992.56 807.22)">
      <path d="M 7461 5547 C 7323 5341 7117 5124 6923 4978 C 6868 4936 6814 4898 6805 4893 C 6789 4884 6790 4880 6813 4844 C 6826 4822 6852 4776 6869 4742 C 6886 4708 6904 4680 6909 4680 C 6925 4680 7115 4886 7186 4980 C 7264 5083 7349 5218 7400 5319 C 7440 5400 7523 5610 7517 5617 C 7514 5619 7489 5588 7461 5547 z" transform="translate(-7155.74, -5148.55)" />
    </g>
    <g transform="matrix(0.21 0 0 -0.21 863.97 931.46)">
      <path d="M 6512 5023 C 6368 4810 6239 4568 6219 4470 C 6183 4296 6260 4139 6416 4068 C 6454 4051 6483 4046 6550 4046 C 6617 4046 6646 4051 6684 4068 C 6759 4102 6813 4152 6850 4221 C 6877 4273 6884 4299 6888 4360 C 6894 4470 6877 4535 6801 4683 C 6743 4797 6568 5080 6555 5080 C 6553 5080 6533 5054 6512 5023 z" transform="translate(-6549.68, -4563)" />
    </g>
  </svg>
));
MoonvalveIcon.displayName = 'MoonvalveIcon';

function Header({ notificationPanelOpen, onNotificationPanelToggle, ...props }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const isProcessing = useSelector(selectProcess);
  const metrics = useSelector(selectMetrics);
  const { darkMode, setDarkMode, accountProfile, accountLogin, activeFiatCurrency, toggleFiatCurrency, themeName, setTheme, setOpenWalletModal, setPendingWalletAuth, profiles } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  // Check if current path matches for active state
  const isActive = useCallback((path) => {
    if (path === '/') return router.pathname === '/';
    return router.pathname.startsWith(path);
  }, [router.pathname]);

  const isTokensActive = router.pathname === '/' ||
    ['/trending', '/spotlight', '/most-viewed', '/gainers', '/new', '/watchlist', '/rsi-analysis', '/amm-pools'].some(p => router.pathname.startsWith(p)) ||
    router.pathname.startsWith('/view/');

  const isNftsActive = router.pathname.startsWith('/collection') || router.pathname.startsWith('/nft');

  const [isDesktop, setIsDesktop] = useState(false);
  const [isTabletOrMobile, setIsTabletOrMobile] = useState(true);
  const [fullSearch, setFullSearch] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [tokensMenuOpen, setTokensMenuOpen] = useState(false);
  const [nftsMenuOpen, setNftsMenuOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [tokensExpanded, setTokensExpanded] = useState(false);
  const [nftsExpanded, setNftsExpanded] = useState(false);
  const [walletExpanded, setWalletExpanded] = useState(false);
  const [mobileEmail, setMobileEmail] = useState('');
  const [mobileEmailLoading, setMobileEmailLoading] = useState(false);

  // Direct auth handlers for mobile (skip wallet modal)
  const handleDirectTwitterAuth = async () => {
    try {
      const callbackUrl = window.location.origin + '/callback';
      sessionStorage.setItem('auth_return_url', window.location.href);
      const response = await fetch('https://api.xrpl.to/api/oauth/twitter/oauth1/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callbackUrl })
      });
      if (!response.ok) return;
      const data = await response.json();
      if (!data.auth_url || !data.oauth_token || !data.oauth_token_secret) return;
      sessionStorage.setItem('oauth1_token', data.oauth_token);
      sessionStorage.setItem('oauth1_token_secret', data.oauth_token_secret);
      sessionStorage.setItem('oauth1_auth_start', Date.now().toString());
      window.location.href = data.auth_url.replace('api.twitter.com', 'api.x.com');
    } catch {}
  };

  const handleDirectDiscordAuth = () => {
    const callbackUrl = window.location.origin + '/callback';
    sessionStorage.setItem('auth_return_url', window.location.href);
    window.location.href = `https://discord.com/api/oauth2/authorize?client_id=1416805602415612085&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=identify`;
  };

  const handleMobileEmailSubmit = async (e) => {
    e.preventDefault();
    if (!mobileEmail || !mobileEmail.includes('@')) return;
    setMobileEmailLoading(true);
    try {
      const res = await fetch('https://api.xrpl.to/api/auth/email/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: mobileEmail })
      });
      if (res.ok) {
        sessionStorage.setItem('pending_email', mobileEmail);
        toggleDrawer(false);
        setPendingWalletAuth('email_code');
        setTimeout(() => setOpenWalletModal(true), 100);
      }
    } catch {} finally {
      setMobileEmailLoading(false);
    }
  };

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ tokens: [], collections: [], txHash: null, nft: null, address: null, ledger: null });
  const [suggestedTokens, setSuggestedTokens] = useState([]);
  const [suggestedCollections, setSuggestedCollections] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [typedText, setTypedText] = useState('');
  const searchWords = ['tokens', 'NFTs', 'collections'];
  const baseText = 'Search for ';

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) setRecentSearches(JSON.parse(stored));
  }, []);

  // Typewriter effect
  useEffect(() => {
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let isBaseTyped = false;
    let timeout;

    const type = () => {
      const currentWord = searchWords[wordIndex];
      const fullText = baseText + currentWord + '...';

      const typeSpeed = 100 + Math.random() * 50; // 100-150ms, slight variation
      const deleteSpeed = 40 + Math.random() * 20; // 40-60ms

      if (!isBaseTyped) {
        // Type base text first
        if (charIndex < baseText.length) {
          setTypedText(baseText.slice(0, charIndex + 1));
          charIndex++;
          timeout = setTimeout(type, typeSpeed);
        } else {
          isBaseTyped = true;
          charIndex = 0;
          timeout = setTimeout(type, 150);
        }
      } else if (!isDeleting) {
        // Type the word
        const word = currentWord + '...';
        if (charIndex < word.length) {
          setTypedText(baseText + word.slice(0, charIndex + 1));
          charIndex++;
          timeout = setTimeout(type, typeSpeed);
        } else {
          // Pause then start deleting
          timeout = setTimeout(() => {
            isDeleting = true;
            type();
          }, 2500);
        }
      } else {
        // Delete only the word (keep base text)
        const word = currentWord + '...';
        if (charIndex > 0) {
          charIndex--;
          setTypedText(baseText + word.slice(0, charIndex));
          timeout = setTimeout(type, deleteSpeed);
        } else {
          isDeleting = false;
          wordIndex = (wordIndex + 1) % searchWords.length;
          timeout = setTimeout(type, 300);
        }
      }
    };

    type();
    return () => clearTimeout(timeout);
  }, []);

  const tokensRef = useRef(null);
  const nftsRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const settingsRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const nftsCloseTimeoutRef = useRef(null);
  const openTimeoutRef = useRef(null);
  const nftsOpenTimeoutRef = useRef(null);

  // Handle responsive breakpoints
  useEffect(() => {
    const checkBreakpoints = throttle(() => {
      setIsDesktop(window.innerWidth >= 1024);
      setIsTabletOrMobile(window.innerWidth < 1024);
    }, 150);
    checkBreakpoints();
    window.addEventListener('resize', checkBreakpoints);
    return () => window.removeEventListener('resize', checkBreakpoints);
  }, []);

  // Search keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Search click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    if (searchOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchOpen]);

  // Load trending when search opens
  useEffect(() => {
    if (!searchOpen && !fullSearch) return;
    axios.post(`${BASE_URL}/search`, { search: '' })
      .then(res => {
        setSuggestedTokens(res.data?.tokens?.slice(0, 4) || []);
        setSuggestedCollections(res.data?.collections?.slice(0, 3) || []);
      })
      .catch(() => {});
  }, [searchOpen, fullSearch]);

  // Search effect
  useEffect(() => {
    if (!searchQuery || (!searchOpen && !fullSearch)) {
      setSearchResults({ tokens: [], collections: [], txHash: null, nft: null, address: null, ledger: null });
      return;
    }
    const trimmedQuery = searchQuery.trim();
    const detectedHexId = isValidHexId(trimmedQuery) ? trimmedQuery.slice(0, 64).toUpperCase() : null;
    const detectedAddress = isValidXrpAddress(trimmedQuery) ? trimmedQuery : null;
    const detectedLedger = isValidLedgerIndex(trimmedQuery) ? trimmedQuery : null;

    if (detectedLedger) {
      setSearchResults({ tokens: [], collections: [], txHash: null, nft: null, address: null, ledger: detectedLedger });
      return;
    }

    if (detectedAddress) {
      setSearchResults({ tokens: [], collections: [], txHash: null, nft: null, address: detectedAddress, ledger: null });
      return;
    }

    if (detectedHexId) {
      const controller = new AbortController();
      axios.post(`${BASE_URL}/search`, { search: detectedHexId }, { signal: controller.signal })
        .then(res => {
          const nftData = res.data?.nfts?.[0];
          setSearchResults({
            tokens: [], collections: [],
            txHash: nftData ? null : detectedHexId,
            nft: nftData || null,
            address: null, ledger: null
          });
        })
        .catch(() => {
          setSearchResults({ tokens: [], collections: [], txHash: detectedHexId, nft: null, address: null, ledger: null });
        });
      return () => controller.abort();
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await axios.post(`${BASE_URL}/search`, { search: searchQuery }, { signal: controller.signal });
        setSearchResults({
          tokens: res.data?.tokens?.slice(0, 5) || [],
          collections: res.data?.collections?.slice(0, 3) || [],
          txHash: null,
          nft: null,
          address: null,
          ledger: null
        });
      } catch {}
      setSearchLoading(false);
    }, 150);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [searchQuery, searchOpen, fullSearch]);

  const handleSearchSelect = useCallback((item, type) => {
    // Transaction hash navigation
    if (type === 'tx') {
      setSearchOpen(false);
      setFullSearch(false);
      setSearchQuery('');
      window.location.href = `/tx/${item}`;
      return;
    }
    // Address navigation
    if (type === 'address') {
      setSearchOpen(false);
      setFullSearch(false);
      setSearchQuery('');
      window.location.href = `/profile/${item}`;
      return;
    }
    // NFT navigation
    if (type === 'nft') {
      setSearchOpen(false);
      setFullSearch(false);
      setSearchQuery('');
      window.location.href = `/nft/${item._id || item}`;
      return;
    }
    // Ledger navigation
    if (type === 'ledger') {
      setSearchOpen(false);
      setFullSearch(false);
      setSearchQuery('');
      window.location.href = `/ledger/${item}`;
      return;
    }

    // Save to recent searches
    const newRecent = { ...item, type, timestamp: Date.now() };
    const updated = [newRecent, ...recentSearches.filter(r => r.slug !== item.slug)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));

    // Add token to tabs history
    if (type === 'token') {
      addTokenToTabs({ md5: item.md5, slug: item.slug, name: item.name, user: item.user });
    }

    setSearchOpen(false);
    setFullSearch(false);
    setSearchQuery('');
    window.location.href = type === 'token' ? `/token/${item.slug}` : `/collection/${item.slug}`;
  }, [recentSearches]);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  }, []);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }, []);

  // Menu items
  const discoverMenuItems = [
    { path: '/trending', name: 'Trending', icon: <Flame size={16} className="text-orange-500" /> },
    { path: '/spotlight', name: 'Spotlight', icon: <Search size={16} className="text-blue-400" /> },
    { path: '/most-viewed', name: 'Most Viewed', icon: <Eye size={16} className="text-purple-500" /> },
    { path: '/gainers/24h', name: 'Gainers', icon: <TrendingUp size={16} className="text-green-500" /> },
    { path: '/new', name: 'New', icon: <Newspaper size={16} className="text-yellow-500" /> }
  ];

  const launchpadItems = [
    { path: '/view/firstledger', name: 'FirstLedger', icon: <ExternalLink size={16} className="text-[#013CFE]" /> },
    { path: '/view/magnetic-x', name: 'Magnetic X', icon: <Image src="/static/magneticx-logo.webp" alt="Magnetic X" width={16} height={16} className="object-contain" /> },
    { path: '/view/xpmarket', name: 'XPmarket', icon: <XPMarketIcon size={16} className="text-[#6D1FEE]" /> },
    { path: '/view/aigentrun', name: 'aigent.run', icon: <Image src="/static/aigentrun.gif?v=1" alt="Aigent.Run" width={16} height={16} unoptimized className="object-contain" /> },
    { path: '/view/ledgermeme', name: 'LedgerMeme', icon: <LedgerMemeIcon size={16} /> },
    { path: '/view/horizon', name: 'Horizon', icon: <HorizonIcon size={16} /> },
    { path: '/view/moonvalve', name: 'Moonvalve', icon: <MoonvalveIcon size={16} /> }
  ];

  const analyticsItems = [
    { path: '/rsi-analysis', name: 'RSI Analysis', icon: <TrendingUp size={16} className="text-blue-500" /> },
    { path: '/amm-pools', name: 'AMM Pools', icon: <Waves size={16} className="text-blue-500" /> },
    ...(accountProfile ? [{ path: '/watchlist', name: 'Watchlist', icon: <Star size={16} className="text-yellow-500" /> }] : [])
  ];

  const nftItems = [
    { path: '/collections', name: 'Collections', icon: <PawPrint size={16} className="text-purple-500" /> },
    { path: '/nft-traders', name: 'NFT Traders', icon: <Sparkles size={16} className="text-pink-500" /> }
  ];

  const handleFullSearch = useCallback(() => {
    setFullSearch(true);
  }, []);

  const toggleDrawer = useCallback((isOpen = true) => {
    setOpenDrawer(isOpen);
  }, []);

  const handleTokensOpen = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
    }
    openTimeoutRef.current = setTimeout(() => {
      setTokensMenuOpen(true);
    }, 80);
  }, []);

  const handleTokensClose = useCallback(() => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    closeTimeoutRef.current = setTimeout(() => {
      setTokensMenuOpen(false);
    }, 120);
  }, []);

  const handleNftsOpen = useCallback(() => {
    if (nftsCloseTimeoutRef.current) {
      clearTimeout(nftsCloseTimeoutRef.current);
      nftsCloseTimeoutRef.current = null;
    }
    if (nftsOpenTimeoutRef.current) {
      clearTimeout(nftsOpenTimeoutRef.current);
    }
    nftsOpenTimeoutRef.current = setTimeout(() => {
      setNftsMenuOpen(true);
    }, 80);
  }, []);

  const handleNftsClose = useCallback(() => {
    if (nftsOpenTimeoutRef.current) {
      clearTimeout(nftsOpenTimeoutRef.current);
      nftsOpenTimeoutRef.current = null;
    }
    nftsCloseTimeoutRef.current = setTimeout(() => {
      setNftsMenuOpen(false);
    }, 120);
  }, []);

  const handleSettingsToggle = useCallback(() => {
    setSettingsMenuOpen((prev) => !prev);
  }, []);

  const handleTokenOptionSelect = useCallback((path) => {
    window.location.href = path;
    setTokensMenuOpen(false);
    setNftsMenuOpen(false);
  }, []);

  useEffect(() => {
    if (isProcessing === 1 && isClosed) {
      dispatch(updateProcess(3));
    }
    if (isClosed) {
      setIsClosed(false);
    }
  }, [isProcessing, isClosed, dispatch]);

  // Close settings menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setSettingsMenuOpen(false);
      }
    };
    if (settingsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [settingsMenuOpen]);

  return (
    <header
      className={cn(
        'fixed left-0 right-0 top-0 z-[1100] flex h-[52px] items-center',
        isDark ? 'bg-black border-b border-blue-500/20' : 'bg-white border-b border-blue-200/50',
        !openDrawer && !isDark && 'bg-white/95 backdrop-blur-md'
      )}
    >
      <div className="mx-auto flex w-full max-w-full items-center px-4 sm:px-6">
        {/* Left: Logo + Nav */}
        <div className="flex shrink-0 items-center gap-6">
          <Logo alt="xrpl.to Logo" style={{ width: 'auto', height: '24px' }} />

          {/* Desktop Navigation - Left Side */}
          {isDesktop && (
            <nav className="flex items-center">
              {/* Tokens Dropdown */}
              <div
                ref={tokensRef}
                className="relative"
                onMouseEnter={handleTokensOpen}
                onMouseLeave={handleTokensClose}
              >
                <a
                  href="/"
                  className={cn(
                    'mr-1 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-200',
                    isTokensActive
                      ? isDark ? 'text-blue-400 bg-blue-500/10' : 'text-blue-600 bg-blue-50'
                      : isDark ? 'text-white/70 hover:text-blue-400 hover:bg-blue-500/5' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50'
                  )}
                >
                  Tokens
                  <ChevronDown size={14} className={cn('transition-transform duration-150', tokensMenuOpen && 'rotate-180')} />
                </a>

                {tokensMenuOpen && (
                  <div
                    onMouseEnter={handleTokensOpen}
                    onMouseLeave={handleTokensClose}
                    className={cn(
                      'absolute left-0 top-full z-[2147483647] mt-2 min-w-[480px] overflow-hidden rounded-xl border animate-in fade-in slide-in-from-top-1 duration-150',
                      isDark
                        ? 'border-blue-500/15 bg-[#0c0c0c]/95 backdrop-blur-xl shadow-2xl shadow-blue-500/5'
                        : 'border-blue-200/50 bg-white/95 backdrop-blur-xl shadow-xl shadow-blue-500/5'
                    )}
                  >
                    <div className="flex gap-0 p-1.5">
                      {/* Column 1: Launchpads */}
                      <div className="min-w-[150px] p-2">
                        <p className={cn('mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>
                          Launchpads
                        </p>
                        {launchpadItems.map((item) => (
                          <div
                            key={item.path}
                            onClick={() => handleTokenOptionSelect(item.path)}
                            className={cn(
                              'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors duration-150',
                              isActive(item.path)
                                ? isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-500/10 text-blue-600'
                                : isDark ? 'hover:bg-blue-500/5 hover:text-blue-400' : 'hover:bg-blue-50 hover:text-blue-600'
                            )}
                          >
                            {item.icon}
                            <span className={cn('text-[13px]', isActive(item.path) ? '' : isDark ? 'text-white/80' : 'text-gray-700')}>{item.name}</span>
                          </div>
                        ))}
                      </div>

                      {/* Column 2: Analytics */}
                      <div className={cn('min-w-[130px] border-l p-2', isDark ? 'border-blue-500/10' : 'border-blue-200/30')}>
                        <p className={cn('mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>
                          Analytics
                        </p>
                        {analyticsItems.map((item) => (
                          <div
                            key={item.path}
                            onClick={() => handleTokenOptionSelect(item.path)}
                            className={cn(
                              'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors duration-150',
                              isActive(item.path)
                                ? isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-500/10 text-blue-600'
                                : isDark ? 'hover:bg-blue-500/5 hover:text-blue-400' : 'hover:bg-blue-50 hover:text-blue-600'
                            )}
                          >
                            {item.icon}
                            <span className={cn('text-[13px]', isActive(item.path) ? '' : isDark ? 'text-white/80' : 'text-gray-700')}>{item.name}</span>
                          </div>
                        ))}
                      </div>

                      {/* Column 3: Discover */}
                      <div className={cn('min-w-[120px] border-l p-2', isDark ? 'border-blue-500/10' : 'border-blue-200/30')}>
                        <p className={cn('mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>
                          Discover
                        </p>
                        {discoverMenuItems.map((item) => (
                          <div
                            key={item.path}
                            onClick={() => handleTokenOptionSelect(item.path)}
                            className={cn(
                              'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors duration-150',
                              isActive(item.path)
                                ? isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-500/10 text-blue-600'
                                : isDark ? 'hover:bg-blue-500/5 hover:text-blue-400' : 'hover:bg-blue-50 hover:text-blue-600'
                            )}
                          >
                            {item.icon}
                            <span className={cn('text-[13px]', isActive(item.path) ? '' : isDark ? 'text-white/80' : 'text-gray-700')}>{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* NFTs Dropdown */}
              <div
                ref={nftsRef}
                className="relative"
                onMouseEnter={handleNftsOpen}
                onMouseLeave={handleNftsClose}
              >
                <a
                  href="/collections"
                  className={cn(
                    'mr-1 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-200',
                    isNftsActive
                      ? isDark ? 'text-blue-400 bg-blue-500/10' : 'text-blue-600 bg-blue-50'
                      : isDark ? 'text-white/70 hover:text-blue-400 hover:bg-blue-500/5' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50'
                  )}
                >
                  NFTs
                  <ChevronDown size={14} className={cn('transition-transform duration-150', nftsMenuOpen && 'rotate-180')} />
                </a>

                {nftsMenuOpen && (
                  <div
                    onMouseEnter={handleNftsOpen}
                    onMouseLeave={handleNftsClose}
                    className={cn(
                      'absolute left-0 top-full z-[2147483647] mt-2 min-w-[160px] overflow-hidden rounded-xl border animate-in fade-in slide-in-from-top-1 duration-150',
                      isDark
                        ? 'border-blue-500/15 bg-[#0c0c0c]/95 backdrop-blur-xl shadow-2xl shadow-blue-500/5'
                        : 'border-blue-200/50 bg-white/95 backdrop-blur-xl shadow-xl shadow-blue-500/5'
                    )}
                  >
                    <div className="p-1.5">
                      {nftItems.map((item) => (
                        <div
                          key={item.path}
                          onClick={() => handleTokenOptionSelect(item.path)}
                          className={cn(
                            'flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 transition-colors duration-150',
                            isActive(item.path)
                              ? isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-500/10 text-blue-600'
                              : isDark ? 'hover:bg-blue-500/5 hover:text-blue-400' : 'hover:bg-blue-50 hover:text-blue-600'
                          )}
                        >
                          {item.icon}
                          <span className={cn('text-[13px]', isActive(item.path) ? '' : isDark ? 'text-white/80' : 'text-gray-700')}>{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <a
                href="/swap"
                className={cn(
                  'mr-1 inline-flex items-center rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-200',
                  isActive('/swap')
                    ? isDark ? 'text-blue-400 bg-blue-500/10' : 'text-blue-600 bg-blue-50'
                    : isDark ? 'text-white/70 hover:text-blue-400 hover:bg-blue-500/5' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50'
                )}
              >
                Swap
              </a>
              <a
                href="/news"
                className={cn(
                  'mr-1 inline-flex items-center rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-200',
                  isActive('/news')
                    ? isDark ? 'text-blue-400 bg-blue-500/10' : 'text-blue-600 bg-blue-50'
                    : isDark ? 'text-white/70 hover:text-blue-400 hover:bg-blue-500/5' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50'
                )}
              >
                News
              </a>
            </nav>
          )}
        </div>

        {/* Center: Search */}
        {isDesktop && (
          <div ref={searchRef} className="relative flex-1 flex justify-center px-8">
            <div
              className={cn(
                "flex items-center gap-3 px-4 h-[52px] w-full max-w-[800px] cursor-text border-0 transition-all duration-200",
                searchOpen
                  ? "bg-primary/5"
                  : isDark
                    ? "bg-white/[0.04] hover:bg-white/[0.06]"
                    : "bg-gray-50 hover:bg-gray-100"
              )}
              onClick={openSearch}
            >
              <Search size={16} className={isDark ? "text-white/40" : "text-gray-400"} />
              {searchOpen ? (
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={typedText || 'Search...'}
                  className={cn("flex-1 bg-transparent text-[14px] outline-none", isDark ? "text-white placeholder:text-white/40" : "text-gray-900 placeholder:text-gray-400")}
                />
              ) : (
                <span className={cn("flex-1 text-[14px]", isDark ? "text-white/40" : "text-gray-500")}>{typedText || 'Search...'}<span className="animate-pulse">|</span></span>
              )}
              {!searchOpen && (
                <div className="flex items-center gap-1">
                  <kbd className={cn("px-1.5 py-0.5 rounded text-[10px]", isDark ? "bg-white/[0.08] text-white/30" : "bg-gray-200 text-gray-400")}>⌘</kbd>
                  <kbd className={cn("px-1.5 py-0.5 rounded text-[10px]", isDark ? "bg-white/[0.08] text-white/30" : "bg-gray-200 text-gray-400")}>/</kbd>
                </div>
              )}
            </div>

            {/* Search Dropdown */}
            {searchOpen && (
              <div className={cn(
                "absolute top-full left-1/2 -translate-x-1/2 w-full max-w-[800px] mt-2 rounded-xl border overflow-hidden max-h-[60vh] overflow-y-auto z-[9999]",
                isDark
                  ? "bg-[#070b12]/98 backdrop-blur-xl border-white/[0.06] shadow-2xl shadow-black/50"
                  : "bg-white/98 backdrop-blur-xl border-gray-200 shadow-xl shadow-gray-200/50"
              )}>
                {!searchQuery && recentSearches.length > 0 && (
                  <div className="px-3 py-2">
                    <div className="flex items-center gap-3 px-1 py-2 mb-1">
                      <span className={cn("text-[11px] font-semibold uppercase tracking-[0.15em] whitespace-nowrap", isDark ? "text-teal-400" : "text-primary")}>Recent Searches</span>
                      <div
                        className="flex-1 h-[14px]"
                        style={{
                          backgroundImage: isDark
                            ? 'radial-gradient(circle, rgba(45,212,191,0.4) 1px, transparent 1px)'
                            : 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)',
                          backgroundSize: '8px 5px',
                          WebkitMaskImage: 'linear-gradient(90deg, black 0%, transparent 100%)',
                          maskImage: 'linear-gradient(90deg, black 0%, transparent 100%)'
                        }}
                      />
                      <button onClick={clearRecentSearches} className={cn("flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide transition-colors", isDark ? "text-teal-400/80 hover:text-teal-300" : "text-primary hover:text-blue-400")}>
                        <Trash2 size={12} />
                        Clear
                      </button>
                    </div>
                    {recentSearches.map((item, i) => (
                      <div key={i} onClick={() => handleSearchSelect(item, item.type)} className={cn("flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                        <img src={item.type === 'token' ? `https://s1.xrpl.to/token/${item.md5}` : `https://s1.xrpl.to/nft-collection/${item.logoImage}`} className={cn("w-8 h-8 object-cover flex-shrink-0", item.type === 'token' ? "rounded-full" : "rounded-md")} alt="" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>{item.user || item.name}</span>
                            <span className={cn("text-[11px]", isDark ? "text-white/25" : "text-gray-400")}>•</span>
                            <span className={cn("text-[11px]", isDark ? "text-white/35" : "text-gray-500")}>({item.name || item.type})</span>
                          </div>
                          <p className={cn("text-[10px] font-mono truncate mt-0.5", isDark ? "text-white/20" : "text-gray-400")}>{item.issuer || item.account || ''}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn("px-2 py-0.5 text-[9px] font-semibold uppercase rounded tracking-wide", isDark ? "bg-white/5 text-white/50 border border-white/10" : "bg-gray-100 text-gray-500")}>{item.type === 'token' ? 'Token' : 'NFT'}</span>
                          {(item.verified === true || item.verified === 'yes') && <span className={cn("flex items-center gap-1 px-2 py-0.5 text-[9px] font-semibold uppercase rounded tracking-wide", isDark ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "bg-green-50 text-green-600")}>✓ Verified</span>}
                          {item.holders && (
                            <div className="text-right min-w-[50px]">
                              <span className={cn("text-[12px] font-medium tabular-nums block", isDark ? "text-white/70" : "text-gray-700")}>{item.holders?.toLocaleString()}</span>
                              <p className={cn("text-[8px] uppercase tracking-wider", isDark ? "text-white/30" : "text-gray-400")}>Holders</p>
                            </div>
                          )}
                          {item.items && (
                            <div className="text-right min-w-[50px]">
                              <span className={cn("text-[12px] font-medium tabular-nums block", isDark ? "text-white/70" : "text-gray-700")}>{item.items?.toLocaleString()}</span>
                              <p className={cn("text-[8px] uppercase tracking-wider", isDark ? "text-white/30" : "text-gray-400")}>Items</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!searchQuery && (suggestedTokens.length > 0 || suggestedCollections.length > 0) && (
                  <>
                    {suggestedTokens.length > 0 && (
                      <div className="px-3 py-2">
                        <div className="flex items-center gap-3 px-1 py-2 mb-1">
                          <span className={cn("text-[11px] font-semibold uppercase tracking-[0.15em] whitespace-nowrap", isDark ? "text-teal-400" : "text-primary")}>Tokens</span>
                          <div
                            className="flex-1 h-[14px]"
                            style={{
                              backgroundImage: isDark
                                ? 'radial-gradient(circle, rgba(45,212,191,0.4) 1px, transparent 1px)'
                                : 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)',
                              backgroundSize: '8px 5px',
                              WebkitMaskImage: 'linear-gradient(90deg, black 0%, transparent 100%)',
                              maskImage: 'linear-gradient(90deg, black 0%, transparent 100%)'
                            }}
                          />
                        </div>
                        {suggestedTokens.map((token, i) => (
                          <div key={i} onClick={() => handleSearchSelect(token, 'token')} className={cn("flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer transition-all duration-150", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                            <img src={`https://s1.xrpl.to/token/${token.md5}`} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>{token.user}</span>
                                <span className={cn("text-[11px]", isDark ? "text-white/25" : "text-gray-400")}>•</span>
                                <span className={cn("text-[11px]", isDark ? "text-white/35" : "text-gray-500")}>({token.name})</span>
                              </div>
                              <p className={cn("text-[10px] font-mono truncate mt-0.5", isDark ? "text-white/20" : "text-gray-400")}>{token.issuer}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={cn("px-2 py-0.5 text-[9px] font-semibold uppercase rounded tracking-wide", isDark ? "bg-white/5 text-white/50 border border-white/10" : "bg-gray-100 text-gray-500")}>Token</span>
                              {token.verified && <span className={cn("flex items-center gap-1 px-2 py-0.5 text-[9px] font-semibold uppercase rounded tracking-wide", isDark ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "bg-green-50 text-green-600")}>✓ Verified</span>}
                              <div className="text-right min-w-[50px]">
                                <span className={cn("text-[12px] font-medium tabular-nums block", isDark ? "text-white/70" : "text-gray-700")}>{token.holders?.toLocaleString()}</span>
                                <p className={cn("text-[8px] uppercase tracking-wider", isDark ? "text-white/30" : "text-gray-400")}>Holders</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {suggestedCollections.length > 0 && (
                      <div className="px-3 py-2">
                        <div className="flex items-center gap-3 px-1 py-2 mb-1">
                          <span className={cn("text-[11px] font-semibold uppercase tracking-[0.15em] whitespace-nowrap", isDark ? "text-teal-400" : "text-primary")}>NFTs</span>
                          <div
                            className="flex-1 h-[14px]"
                            style={{
                              backgroundImage: isDark
                                ? 'radial-gradient(circle, rgba(45,212,191,0.4) 1px, transparent 1px)'
                                : 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)',
                              backgroundSize: '8px 5px',
                              WebkitMaskImage: 'linear-gradient(90deg, black 0%, transparent 100%)',
                              maskImage: 'linear-gradient(90deg, black 0%, transparent 100%)'
                            }}
                          />
                        </div>
                        {suggestedCollections.map((col, i) => (
                          <div key={i} onClick={() => handleSearchSelect(col, 'collection')} className={cn("flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer transition-all duration-150", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                            <img src={`https://s1.xrpl.to/nft-collection/${col.logoImage}`} className="w-8 h-8 rounded-md object-cover flex-shrink-0" alt="" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>{col.name}</span>
                              </div>
                              <p className={cn("text-[10px] font-mono truncate mt-0.5", isDark ? "text-white/20" : "text-gray-400")}>{col.account}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={cn("px-2 py-0.5 text-[9px] font-semibold uppercase rounded tracking-wide", isDark ? "bg-white/5 text-white/50 border border-white/10" : "bg-gray-100 text-gray-500")}>NFT</span>
                              {col.verified === 'yes' && <span className={cn("flex items-center gap-1 px-2 py-0.5 text-[9px] font-semibold uppercase rounded tracking-wide", isDark ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "bg-green-50 text-green-600")}>✓ Verified</span>}
                              <div className="text-right min-w-[50px]">
                                <span className={cn("text-[12px] font-medium tabular-nums block", isDark ? "text-white/70" : "text-gray-700")}>{col.items?.toLocaleString()}</span>
                                <p className={cn("text-[8px] uppercase tracking-wider", isDark ? "text-white/30" : "text-gray-400")}>Items</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {searchQuery && searchResults.txHash && (
                  <div className="px-3 py-2">
                    <div className="flex items-center gap-3 px-1 py-2 mb-1">
                      <span className={cn("text-[11px] font-semibold uppercase tracking-[0.15em] whitespace-nowrap", isDark ? "text-teal-400" : "text-primary")}>Transaction</span>
                      <div className="flex-1 h-[14px]" style={{ backgroundImage: isDark ? 'radial-gradient(circle, rgba(45,212,191,0.4) 1px, transparent 1px)' : 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)', backgroundSize: '8px 5px', WebkitMaskImage: 'linear-gradient(90deg, black 0%, transparent 100%)', maskImage: 'linear-gradient(90deg, black 0%, transparent 100%)' }} />
                    </div>
                    <div onClick={() => handleSearchSelect(searchResults.txHash, 'tx')} className={cn("flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer transition-all duration-150", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", isDark ? "bg-blue-500/10 border border-blue-500/20" : "bg-blue-50")}>
                        <ArrowLeftRight size={16} className={isDark ? "text-blue-400" : "text-blue-500"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>View Transaction</span>
                        <p className={cn("text-[10px] font-mono truncate mt-0.5", isDark ? "text-white/20" : "text-gray-400")}>{searchResults.txHash}</p>
                      </div>
                      <span className={cn("px-2 py-0.5 text-[9px] font-semibold uppercase rounded tracking-wide", isDark ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-blue-50 text-blue-600")}>TX</span>
                    </div>
                  </div>
                )}
                {searchQuery && searchResults.nft && (
                  <div className="px-3 py-2">
                    <div className="flex items-center gap-3 px-1 py-2 mb-1">
                      <span className={cn("text-[11px] font-semibold uppercase tracking-[0.15em] whitespace-nowrap", isDark ? "text-teal-400" : "text-primary")}>NFT</span>
                      <div className="flex-1 h-[14px]" style={{ backgroundImage: isDark ? 'radial-gradient(circle, rgba(45,212,191,0.4) 1px, transparent 1px)' : 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)', backgroundSize: '8px 5px', WebkitMaskImage: 'linear-gradient(90deg, black 0%, transparent 100%)', maskImage: 'linear-gradient(90deg, black 0%, transparent 100%)' }} />
                    </div>
                    <div onClick={() => handleSearchSelect(searchResults.nft, 'nft')} className={cn("flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer transition-all duration-150", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                      {getNftImage(searchResults.nft) ? (
                        <img src={getNftImage(searchResults.nft)} alt="" className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
                      ) : (
                        <div className={cn("w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0", isDark ? "bg-pink-500/10 border border-pink-500/20" : "bg-pink-50")}>
                          <Sparkles size={16} className={isDark ? "text-pink-400" : "text-pink-500"} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>{searchResults.nft.name || 'View NFT'}</span>
                        <p className={cn("text-[10px] truncate mt-0.5", isDark ? "text-white/35" : "text-gray-500")}>{searchResults.nft.collection || searchResults.nft._id}</p>
                      </div>
                      <span className={cn("px-2 py-0.5 text-[9px] font-semibold uppercase rounded tracking-wide", isDark ? "bg-pink-500/10 text-pink-400 border border-pink-500/20" : "bg-pink-50 text-pink-600")}>NFT</span>
                    </div>
                  </div>
                )}
                {searchQuery && searchResults.address && (
                  <div className="px-3 py-2">
                    <div className="flex items-center gap-3 px-1 py-2 mb-1">
                      <span className={cn("text-[11px] font-semibold uppercase tracking-[0.15em] whitespace-nowrap", isDark ? "text-teal-400" : "text-primary")}>Account</span>
                      <div className="flex-1 h-[14px]" style={{ backgroundImage: isDark ? 'radial-gradient(circle, rgba(45,212,191,0.4) 1px, transparent 1px)' : 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)', backgroundSize: '8px 5px', WebkitMaskImage: 'linear-gradient(90deg, black 0%, transparent 100%)', maskImage: 'linear-gradient(90deg, black 0%, transparent 100%)' }} />
                    </div>
                    <div onClick={() => handleSearchSelect(searchResults.address, 'address')} className={cn("flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer transition-all duration-150", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", isDark ? "bg-purple-500/10 border border-purple-500/20" : "bg-purple-50")}>
                        <Wallet size={16} className={isDark ? "text-purple-400" : "text-purple-500"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>View Profile</span>
                        <p className={cn("text-[10px] font-mono truncate mt-0.5", isDark ? "text-white/20" : "text-gray-400")}>{searchResults.address}</p>
                      </div>
                      <span className={cn("px-2 py-0.5 text-[9px] font-semibold uppercase rounded tracking-wide", isDark ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-purple-50 text-purple-600")}>Account</span>
                    </div>
                  </div>
                )}
                {searchQuery && searchResults.ledger && (
                  <div className="px-3 py-2">
                    <div className="flex items-center gap-3 px-1 py-2 mb-1">
                      <span className={cn("text-[11px] font-semibold uppercase tracking-[0.15em] whitespace-nowrap", isDark ? "text-teal-400" : "text-primary")}>Ledger</span>
                      <div className="flex-1 h-[14px]" style={{ backgroundImage: isDark ? 'radial-gradient(circle, rgba(45,212,191,0.4) 1px, transparent 1px)' : 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)', backgroundSize: '8px 5px', WebkitMaskImage: 'linear-gradient(90deg, black 0%, transparent 100%)', maskImage: 'linear-gradient(90deg, black 0%, transparent 100%)' }} />
                    </div>
                    <div onClick={() => handleSearchSelect(searchResults.ledger, 'ledger')} className={cn("flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer transition-all duration-150", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", isDark ? "bg-teal-500/10 border border-teal-500/20" : "bg-cyan-50")}>
                        <Layers size={16} className={isDark ? "text-teal-400" : "text-cyan-500"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>View Ledger</span>
                        <p className={cn("text-[10px] font-mono truncate mt-0.5", isDark ? "text-white/20" : "text-gray-400")}>#{searchResults.ledger}</p>
                      </div>
                      <span className={cn("px-2 py-0.5 text-[9px] font-semibold uppercase rounded tracking-wide", isDark ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "bg-cyan-50 text-cyan-600")}>Ledger</span>
                    </div>
                  </div>
                )}
                {searchQuery && searchResults.tokens.length > 0 && (
                  <div className="px-3 py-2">
                    <div className="flex items-center gap-3 px-1 py-2 mb-1">
                      <span className={cn("text-[11px] font-semibold uppercase tracking-[0.15em] whitespace-nowrap", isDark ? "text-teal-400" : "text-primary")}>Tokens</span>
                      <div
                        className="flex-1 h-[14px]"
                        style={{
                          backgroundImage: isDark
                            ? 'radial-gradient(circle, rgba(45,212,191,0.4) 1px, transparent 1px)'
                            : 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)',
                          backgroundSize: '8px 5px',
                          WebkitMaskImage: 'linear-gradient(90deg, black 0%, transparent 100%)',
                          maskImage: 'linear-gradient(90deg, black 0%, transparent 100%)'
                        }}
                      />
                    </div>
                    {searchResults.tokens.map((token, i) => (
                      <div key={i} onClick={() => handleSearchSelect(token, 'token')} className={cn("flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer transition-all duration-150", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                        <img src={`https://s1.xrpl.to/token/${token.md5}`} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>{token.user}</span>
                            <span className={cn("text-[11px]", isDark ? "text-white/25" : "text-gray-400")}>•</span>
                            <span className={cn("text-[11px]", isDark ? "text-white/35" : "text-gray-500")}>({token.name})</span>
                          </div>
                          <p className={cn("text-[10px] font-mono truncate mt-0.5", isDark ? "text-white/20" : "text-gray-400")}>{token.issuer}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn("px-2 py-0.5 text-[9px] font-semibold uppercase rounded tracking-wide", isDark ? "bg-white/5 text-white/50 border border-white/10" : "bg-gray-100 text-gray-500")}>Token</span>
                          {token.verified && <span className={cn("flex items-center gap-1 px-2 py-0.5 text-[9px] font-semibold uppercase rounded tracking-wide", isDark ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "bg-green-50 text-green-600")}>✓ Verified</span>}
                          <div className="text-right min-w-[50px]">
                            <span className={cn("text-[12px] font-medium tabular-nums block", isDark ? "text-white/70" : "text-gray-700")}>{token.holders?.toLocaleString()}</span>
                            <p className={cn("text-[8px] uppercase tracking-wider", isDark ? "text-white/30" : "text-gray-400")}>Holders</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {searchQuery && searchResults.collections.length > 0 && (
                  <div className="px-3 py-2">
                    <div className="flex items-center gap-3 px-1 py-2 mb-1">
                      <span className={cn("text-[11px] font-semibold uppercase tracking-[0.15em] whitespace-nowrap", isDark ? "text-teal-400" : "text-primary")}>NFTs</span>
                      <div
                        className="flex-1 h-[14px]"
                        style={{
                          backgroundImage: isDark
                            ? 'radial-gradient(circle, rgba(45,212,191,0.4) 1px, transparent 1px)'
                            : 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)',
                          backgroundSize: '8px 5px',
                          WebkitMaskImage: 'linear-gradient(90deg, black 0%, transparent 100%)',
                          maskImage: 'linear-gradient(90deg, black 0%, transparent 100%)'
                        }}
                      />
                    </div>
                    {searchResults.collections.map((col, i) => (
                      <div key={i} onClick={() => handleSearchSelect(col, 'collection')} className={cn("flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer transition-all duration-150", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                        <img src={`https://s1.xrpl.to/nft-collection/${col.logoImage}`} className="w-8 h-8 rounded-md object-cover flex-shrink-0" alt="" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>{col.name}</span>
                          </div>
                          <p className={cn("text-[10px] font-mono truncate mt-0.5", isDark ? "text-white/20" : "text-gray-400")}>{col.account}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn("px-2 py-0.5 text-[9px] font-semibold uppercase rounded tracking-wide", isDark ? "bg-white/5 text-white/50 border border-white/10" : "bg-gray-100 text-gray-500")}>NFT</span>
                          {col.verified === 'yes' && <span className={cn("flex items-center gap-1 px-2 py-0.5 text-[9px] font-semibold uppercase rounded tracking-wide", isDark ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "bg-green-50 text-green-600")}>✓ Verified</span>}
                          <div className="text-right min-w-[50px]">
                            <span className={cn("text-[12px] font-medium tabular-nums block", isDark ? "text-white/70" : "text-gray-700")}>{col.items?.toLocaleString()}</span>
                            <p className={cn("text-[8px] uppercase tracking-wider", isDark ? "text-white/30" : "text-gray-400")}>Items</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {searchQuery && !searchLoading && !searchResults.txHash && !searchResults.nft && !searchResults.address && !searchResults.ledger && searchResults.tokens.length === 0 && searchResults.collections.length === 0 && (
                  <div className="py-6 text-center">
                    <p className={cn("text-[13px]", isDark ? "text-white/40" : "text-gray-400")}>No results</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mobile Full Search */}
        {fullSearch && isTabletOrMobile && (
          <>
          <div className="fixed inset-0 z-[9998] bg-black/50" onClick={() => { setFullSearch(false); setSearchQuery(''); }} />
          <div className="fixed inset-x-0 top-0 z-[9999] px-4 pt-2" ref={searchRef}>
            <div className={cn("flex items-center gap-2 rounded-xl px-4 h-11 border transition-all", isDark ? "bg-[#0a0f1a] border-blue-500/20" : "bg-white border-blue-200/50 shadow-sm")}>
              <Search size={18} className={isDark ? "text-white/40" : "text-gray-400"} />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className={cn("flex-1 bg-transparent text-[15px] outline-none", isDark ? "text-white placeholder:text-white/40" : "text-gray-900 placeholder:text-gray-400")}
              />
              <button onClick={() => { setFullSearch(false); setSearchQuery(''); }} className={cn("p-1.5 rounded-lg", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}>
                <X size={18} className={isDark ? "text-white/50" : "text-gray-500"} />
              </button>
            </div>

            {/* Mobile Search Results */}
            <div className={cn(
              "mt-2 rounded-xl border overflow-hidden max-h-[calc(100vh-70px)] overflow-y-auto",
              isDark
                ? "bg-[#0a0f1a] border-primary/20 shadow-2xl"
                : "bg-white border-blue-200/50 shadow-xl"
            )}>
              {!searchQuery && suggestedTokens.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center gap-3 px-2 py-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap text-primary">Tokens</span>
                    <div className="flex-1 h-[14px]" style={{ backgroundImage: 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)', backgroundSize: '8px 5px' }} />
                  </div>
                  {suggestedTokens.map((token, i) => (
                    <div key={i} onClick={() => handleSearchSelect(token, 'token')} className={cn("flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer", isDark ? "hover:bg-white/[0.03]" : "hover:bg-gray-50")}>
                      <img src={`https://s1.xrpl.to/token/${token.md5}`} className="w-9 h-9 rounded-full object-cover" alt="" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("text-[14px] font-medium", isDark ? "text-white" : "text-gray-900")}>{token.user}</span>
                          <span className={cn("text-[12px]", isDark ? "text-white/40" : "text-gray-500")}>({token.name})</span>
                        </div>
                        <p className={cn("text-[11px] font-mono truncate", isDark ? "text-white/25" : "text-gray-400")}>{token.issuer}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {token.verified && <span className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold uppercase rounded bg-green-500/20 text-green-500">✓</span>}
                        <div className="text-right">
                          <span className={cn("text-[12px] font-medium tabular-nums", isDark ? "text-white/70" : "text-gray-600")}>{token.holders?.toLocaleString()}</span>
                          <p className={cn("text-[8px] uppercase tracking-wide", isDark ? "text-white/30" : "text-gray-400")}>Holders</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!searchQuery && suggestedCollections.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center gap-3 px-2 py-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap text-primary">NFTs</span>
                    <div className="flex-1 h-[14px]" style={{ backgroundImage: 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)', backgroundSize: '8px 5px' }} />
                  </div>
                  {suggestedCollections.map((col, i) => (
                    <div key={i} onClick={() => handleSearchSelect(col, 'collection')} className={cn("flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer", isDark ? "hover:bg-white/[0.03]" : "hover:bg-gray-50")}>
                      <img src={`https://s1.xrpl.to/nft-collection/${col.logoImage}`} className="w-9 h-9 rounded-lg object-cover" alt="" />
                      <div className="flex-1 min-w-0">
                        <span className={cn("text-[14px] font-medium", isDark ? "text-white" : "text-gray-900")}>{col.name}</span>
                        <p className={cn("text-[11px] font-mono truncate", isDark ? "text-white/25" : "text-gray-400")}>{col.account}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {col.verified === 'yes' && <span className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold uppercase rounded bg-green-500/20 text-green-500">✓</span>}
                        <div className="text-right">
                          <span className={cn("text-[12px] font-medium tabular-nums", isDark ? "text-white/70" : "text-gray-600")}>{col.items?.toLocaleString()}</span>
                          <p className={cn("text-[8px] uppercase tracking-wide", isDark ? "text-white/30" : "text-gray-400")}>Items</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {searchQuery && searchResults.txHash && (
                <div className="p-2">
                  <div className="flex items-center gap-3 px-2 py-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap text-primary">Transaction</span>
                    <div className="flex-1 h-[14px]" style={{ backgroundImage: 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)', backgroundSize: '8px 5px' }} />
                  </div>
                  <div onClick={() => handleSearchSelect(searchResults.txHash, 'tx')} className={cn("flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer", isDark ? "hover:bg-white/[0.03]" : "hover:bg-gray-50")}>
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", isDark ? "bg-blue-500/20" : "bg-blue-100")}>
                      <ArrowLeftRight size={18} className="text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={cn("text-[14px] font-medium", isDark ? "text-white" : "text-gray-900")}>View Transaction</span>
                      <p className={cn("text-[11px] font-mono truncate", isDark ? "text-white/25" : "text-gray-400")}>{searchResults.txHash}</p>
                    </div>
                    <span className={cn("px-2 py-1 text-[10px] font-semibold uppercase rounded", isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600")}>TX</span>
                  </div>
                </div>
              )}
              {searchQuery && searchResults.nft && (
                <div className="p-2">
                  <div className="flex items-center gap-3 px-2 py-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap text-primary">NFT</span>
                    <div className="flex-1 h-[14px]" style={{ backgroundImage: 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)', backgroundSize: '8px 5px' }} />
                  </div>
                  <div onClick={() => handleSearchSelect(searchResults.nft, 'nft')} className={cn("flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer", isDark ? "hover:bg-white/[0.03]" : "hover:bg-gray-50")}>
                    {getNftImage(searchResults.nft) ? (
                      <img src={getNftImage(searchResults.nft)} alt="" className="w-9 h-9 rounded-lg object-cover" />
                    ) : (
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", isDark ? "bg-pink-500/20" : "bg-pink-100")}>
                        <Sparkles size={18} className="text-pink-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className={cn("text-[14px] font-medium", isDark ? "text-white" : "text-gray-900")}>{searchResults.nft.name || 'View NFT'}</span>
                      <p className={cn("text-[11px] truncate", isDark ? "text-white/40" : "text-gray-500")}>{searchResults.nft.collection || searchResults.nft._id}</p>
                    </div>
                    <span className={cn("px-2 py-1 text-[10px] font-semibold uppercase rounded", isDark ? "bg-pink-500/20 text-pink-400" : "bg-pink-100 text-pink-600")}>NFT</span>
                  </div>
                </div>
              )}
              {searchQuery && searchResults.address && (
                <div className="p-2">
                  <div className="flex items-center gap-3 px-2 py-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap text-primary">Account</span>
                    <div className="flex-1 h-[14px]" style={{ backgroundImage: 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)', backgroundSize: '8px 5px' }} />
                  </div>
                  <div onClick={() => handleSearchSelect(searchResults.address, 'address')} className={cn("flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer", isDark ? "hover:bg-white/[0.03]" : "hover:bg-gray-50")}>
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", isDark ? "bg-purple-500/20" : "bg-purple-100")}>
                      <Wallet size={18} className="text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={cn("text-[14px] font-medium", isDark ? "text-white" : "text-gray-900")}>View Profile</span>
                      <p className={cn("text-[11px] font-mono truncate", isDark ? "text-white/25" : "text-gray-400")}>{searchResults.address}</p>
                    </div>
                    <span className={cn("px-2 py-1 text-[10px] font-semibold uppercase rounded", isDark ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-600")}>Account</span>
                  </div>
                </div>
              )}
              {searchQuery && searchResults.ledger && (
                <div className="p-2">
                  <div className="flex items-center gap-3 px-2 py-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap text-primary">Ledger</span>
                    <div className="flex-1 h-[14px]" style={{ backgroundImage: 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)', backgroundSize: '8px 5px' }} />
                  </div>
                  <div onClick={() => handleSearchSelect(searchResults.ledger, 'ledger')} className={cn("flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer", isDark ? "hover:bg-white/[0.03]" : "hover:bg-gray-50")}>
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", isDark ? "bg-cyan-500/20" : "bg-cyan-100")}>
                      <Layers size={18} className="text-cyan-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={cn("text-[14px] font-medium", isDark ? "text-white" : "text-gray-900")}>View Ledger</span>
                      <p className={cn("text-[11px] font-mono truncate", isDark ? "text-white/25" : "text-gray-400")}>#{searchResults.ledger}</p>
                    </div>
                    <span className={cn("px-2 py-1 text-[10px] font-semibold uppercase rounded", isDark ? "bg-cyan-500/20 text-cyan-400" : "bg-cyan-100 text-cyan-600")}>Ledger</span>
                  </div>
                </div>
              )}
              {searchQuery && searchResults.tokens.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center gap-3 px-2 py-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap text-primary">Tokens</span>
                    <div className="flex-1 h-[14px]" style={{ backgroundImage: 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)', backgroundSize: '8px 5px' }} />
                  </div>
                  {searchResults.tokens.map((token, i) => (
                    <div key={i} onClick={() => handleSearchSelect(token, 'token')} className={cn("flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer", isDark ? "hover:bg-white/[0.03]" : "hover:bg-gray-50")}>
                      <img src={`https://s1.xrpl.to/token/${token.md5}`} className="w-9 h-9 rounded-full object-cover" alt="" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("text-[14px] font-medium", isDark ? "text-white" : "text-gray-900")}>{token.user}</span>
                          <span className={cn("text-[12px]", isDark ? "text-white/40" : "text-gray-500")}>({token.name})</span>
                        </div>
                        <p className={cn("text-[11px] font-mono truncate", isDark ? "text-white/25" : "text-gray-400")}>{token.issuer}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {token.verified && <span className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold uppercase rounded bg-green-500/20 text-green-500">✓</span>}
                        <div className="text-right">
                          <span className={cn("text-[12px] font-medium tabular-nums", isDark ? "text-white/70" : "text-gray-600")}>{token.holders?.toLocaleString()}</span>
                          <p className={cn("text-[8px] uppercase tracking-wide", isDark ? "text-white/30" : "text-gray-400")}>Holders</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {searchQuery && searchResults.collections.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center gap-3 px-2 py-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap text-primary">NFTs</span>
                    <div className="flex-1 h-[14px]" style={{ backgroundImage: 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)', backgroundSize: '8px 5px' }} />
                  </div>
                  {searchResults.collections.map((col, i) => (
                    <div key={i} onClick={() => handleSearchSelect(col, 'collection')} className={cn("flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer", isDark ? "hover:bg-white/[0.03]" : "hover:bg-gray-50")}>
                      <img src={`https://s1.xrpl.to/nft-collection/${col.logoImage}`} className="w-9 h-9 rounded-lg object-cover" alt="" />
                      <div className="flex-1 min-w-0">
                        <span className={cn("text-[14px] font-medium", isDark ? "text-white" : "text-gray-900")}>{col.name}</span>
                        <p className={cn("text-[11px] font-mono truncate", isDark ? "text-white/25" : "text-gray-400")}>{col.account}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {col.verified === 'yes' && <span className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold uppercase rounded bg-green-500/20 text-green-500">✓</span>}
                        <div className="text-right">
                          <span className={cn("text-[12px] font-medium tabular-nums", isDark ? "text-white/70" : "text-gray-600")}>{col.items?.toLocaleString()}</span>
                          <p className={cn("text-[8px] uppercase tracking-wide", isDark ? "text-white/30" : "text-gray-400")}>Items</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {searchQuery && !searchLoading && !searchResults.txHash && !searchResults.nft && !searchResults.address && !searchResults.ledger && searchResults.tokens.length === 0 && searchResults.collections.length === 0 && (
                <div className="py-6 text-center">
                  <p className={cn("text-[13px]", isDark ? "text-white/40" : "text-gray-400")}>No results</p>
                </div>
              )}
              {!searchQuery && suggestedTokens.length === 0 && suggestedCollections.length === 0 && (
                <div className="py-6 text-center">
                  <p className={cn("text-[13px]", isDark ? "text-white/40" : "text-gray-400")}>Loading...</p>
                </div>
              )}
            </div>
          </div>
          </>
        )}

        {/* Mobile spacer */}
        {!fullSearch && isTabletOrMobile && <div className="flex-1" />}

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Icon */}
          {!fullSearch && isTabletOrMobile && (
            <button
              aria-label="Open search"
              onClick={handleFullSearch}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200',
                isDark ? 'text-white/60 hover:text-blue-400 hover:bg-blue-500/10' : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
              )}
            >
              <Search size={18} />
            </button>
          )}

          {/* Desktop Actions */}
          {!fullSearch && isDesktop && (
            <div className="flex items-center gap-1">
              {/* Watchlist */}
              <a
                href="/watchlist"
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200',
                  isDark ? 'text-white/50 hover:text-blue-400 hover:bg-blue-500/10' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
                )}
              >
                <Star size={16} />
              </a>

              {/* Settings Dropdown */}
              <div ref={settingsRef} className="relative">
                <button
                  onClick={handleSettingsToggle}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200',
                    isDark ? 'text-white/50 hover:text-blue-400 hover:bg-blue-500/10' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
                  )}
                >
                  <Settings size={16} />
                </button>

                {settingsMenuOpen && (
                  <div
                    className={cn(
                      'absolute right-0 top-10 z-[2147483647] w-[200px] overflow-hidden rounded-xl border animate-in fade-in slide-in-from-top-1 duration-150',
                      isDark
                        ? 'border-white/10 bg-[#0a0a0a]/98 backdrop-blur-xl shadow-2xl'
                        : 'border-gray-200 bg-white/98 backdrop-blur-xl shadow-xl'
                    )}
                  >
                    <div className="p-3">
                      {/* Currency Section */}
                      <p className={cn('text-[10px] font-medium uppercase tracking-wider mb-2', isDark ? 'text-white/40' : 'text-gray-400')}>
                        Currency
                      </p>
                      <div className="grid grid-cols-5 gap-1 mb-3">
                        {currencyConfig.availableFiatCurrencies.map((currency) => (
                          <button
                            key={currency}
                            onClick={() => {
                              toggleFiatCurrency(currency);
                              setSettingsMenuOpen(false);
                            }}
                            className={cn(
                              'flex items-center justify-center h-8 rounded-lg text-[11px] font-medium transition-all duration-150',
                              currency === activeFiatCurrency
                                ? isDark ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40' : 'bg-blue-500 text-white'
                                : isDark ? 'text-white/60 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            )}
                          >
                            {currency === 'XRP' ? '✕' : currencySymbols[currency]?.trim() || currency.charAt(0)}
                          </button>
                        ))}
                      </div>

                      <div className={cn('border-t mb-3', isDark ? 'border-white/5' : 'border-gray-100')} />

                      {/* Theme Section */}
                      <p className={cn('text-[10px] font-medium uppercase tracking-wider mb-2', isDark ? 'text-white/40' : 'text-gray-400')}>
                        Theme
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => {
                            setTheme('XrplToLightTheme');
                            setSettingsMenuOpen(false);
                          }}
                          className={cn(
                            'flex items-center justify-center gap-1.5 h-8 rounded-lg text-[12px] font-medium transition-all duration-150',
                            themeName === 'XrplToLightTheme'
                              ? isDark ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40' : 'bg-blue-500 text-white'
                              : isDark ? 'text-white/60 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          )}
                        >
                          <Sun size={12} />
                          Light
                        </button>
                        <button
                          onClick={() => {
                            setTheme('XrplToDarkTheme');
                            setSettingsMenuOpen(false);
                          }}
                          className={cn(
                            'flex items-center justify-center gap-1.5 h-8 rounded-lg text-[12px] font-medium transition-all duration-150',
                            themeName === 'XrplToDarkTheme'
                              ? isDark ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40' : 'bg-blue-500 text-white'
                              : isDark ? 'text-white/60 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          )}
                        >
                          <Moon size={12} />
                          Dark
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Launch Button */}
              <a
                href="/launch"
                className={cn(
                  'flex h-8 items-center rounded-lg px-4 text-[13px] font-medium transition-all duration-200 border',
                  isDark
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50'
                    : 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
                )}
              >
                Launch
              </a>

              <button
                onClick={() => setOpenWalletModal(true)}
                className={cn(
                  'flex h-8 items-center gap-2 rounded-lg px-3 text-[13px] font-medium transition-all duration-200 border',
                  accountProfile
                    ? isDark
                      ? 'bg-white/[0.04] text-white border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/5'
                      : 'bg-gray-50 text-gray-900 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    : isDark
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50'
                      : 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
                )}
              >
                {accountProfile ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <span className="font-medium">{parseFloat(accountProfile.xrp || 0).toFixed(2)} XRP</span>
                    {profiles?.length > 1 && (
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded', isDark ? 'bg-white/10 text-white/60' : 'bg-gray-200 text-gray-500')}>{profiles.length}</span>
                    )}
                    <ChevronDown size={12} className={isDark ? 'text-white/40' : 'text-gray-400'} />
                  </>
                ) : (
                  <>
                    <Wallet size={14} />
                    <span>Connect</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Mobile Wallet + Menu */}
          {isTabletOrMobile && !fullSearch && (
            <div className="flex items-center gap-1">
              {/* Mobile Wallet Button */}
              <button
                onClick={() => setOpenWalletModal(true)}
                className={cn(
                  'flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium transition-all duration-200 border',
                  accountProfile
                    ? isDark
                      ? 'bg-white/[0.04] text-white border-blue-500/20'
                      : 'bg-gray-50 text-gray-900 border-gray-200'
                    : isDark
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      : 'bg-blue-500 text-white border-blue-500'
                )}
              >
                {accountProfile ? (
                  <>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    <span>{parseFloat(accountProfile.xrp || 0).toFixed(1)}</span>
                  </>
                ) : (
                  <Wallet size={14} />
                )}
              </button>
              {/* Menu Button */}
              <button
                aria-label="Open menu"
                onClick={() => toggleDrawer(true)}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200',
                  isDark ? 'text-white/60 hover:text-blue-400 hover:bg-blue-500/10' : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
                )}
              >
                <Menu size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      {openDrawer && (
        <>
          <div className="fixed inset-0 z-[2147483646] bg-black/50" onClick={() => toggleDrawer(false)} />
          <div
            className={cn(
              'fixed inset-x-4 top-2 bottom-4 z-[2147483647] rounded-2xl border animate-in fade-in zoom-in-95 duration-200',
              isDark ? 'bg-[#0a0f1a] border-blue-500/20' : 'bg-white border-blue-200/50 shadow-xl'
            )}
            style={{ overflowY: 'auto' }}
          >
            <div className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className={cn('text-[14px] font-medium', isDark ? 'text-white/90' : 'text-gray-900')}>Menu</span>
                <button
                  onClick={() => toggleDrawer(false)}
                  aria-label="Close menu"
                  className={cn(
                    'rounded-lg p-1.5 transition-colors duration-100',
                    isDark ? 'text-white/50 hover:text-white hover:bg-white/[0.05]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <X size={16} />
                </button>
              </div>

              <nav className="space-y-1">
                {/* Tokens Expandable */}
                <button
                  onClick={() => setTokensExpanded(!tokensExpanded)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-100',
                    isTokensActive
                      ? isDark ? 'bg-white/[0.08] text-white' : 'bg-gray-100 text-gray-900'
                      : isDark ? 'text-white/80 hover:bg-white/[0.05]' : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  Tokens
                  <ChevronDown size={14} className={cn('transition-transform duration-150', tokensExpanded && 'rotate-180', isDark ? 'text-white/40' : 'text-gray-400')} />
                </button>

                {tokensExpanded && (
                  <div className={cn('ml-2 space-y-0.5 border-l pl-2', isDark ? 'border-blue-500/15' : 'border-blue-200/40')}>
                    <p className={cn('px-2 py-1 text-[10px] font-semibold uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>
                      Launchpads
                    </p>
                    {launchpadItems.map((item) => (
                      <a
                        key={item.path}
                        href={item.path}
                        onClick={() => toggleDrawer(false)}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors duration-100',
                          isActive(item.path)
                            ? isDark ? 'bg-white/[0.08] text-white' : 'bg-primary/10 text-primary'
                            : isDark ? 'text-white/70 hover:bg-white/[0.05]' : 'text-gray-600 hover:bg-gray-50'
                        )}
                      >
                        {item.icon}
                        {item.name}
                      </a>
                    ))}

                    <p className={cn('mt-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>
                      Analytics
                    </p>
                    {analyticsItems.map((item) => (
                      <a
                        key={item.path}
                        href={item.path}
                        onClick={() => toggleDrawer(false)}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors duration-100',
                          isActive(item.path)
                            ? isDark ? 'bg-white/[0.08] text-white' : 'bg-primary/10 text-primary'
                            : isDark ? 'text-white/70 hover:bg-white/[0.05]' : 'text-gray-600 hover:bg-gray-50'
                        )}
                      >
                        {item.icon}
                        {item.name}
                      </a>
                    ))}

                    <p className={cn('mt-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>
                      Discover
                    </p>
                    {discoverMenuItems.map((item) => (
                      <a
                        key={item.path}
                        href={item.path}
                        onClick={() => toggleDrawer(false)}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors duration-100',
                          isActive(item.path)
                            ? isDark ? 'bg-white/[0.08] text-white' : 'bg-primary/10 text-primary'
                            : isDark ? 'text-white/70 hover:bg-white/[0.05]' : 'text-gray-600 hover:bg-gray-50'
                        )}
                      >
                        {item.icon}
                        {item.name}
                      </a>
                    ))}
                  </div>
                )}

                {/* NFTs Expandable */}
                <button
                  onClick={() => setNftsExpanded(!nftsExpanded)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-100',
                    isNftsActive
                      ? isDark ? 'bg-white/[0.08] text-white' : 'bg-gray-100 text-gray-900'
                      : isDark ? 'text-white/80 hover:bg-white/[0.05]' : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  NFTs
                  <ChevronDown size={14} className={cn('transition-transform duration-150', nftsExpanded && 'rotate-180', isDark ? 'text-white/40' : 'text-gray-400')} />
                </button>

                {nftsExpanded && (
                  <div className={cn('ml-2 space-y-0.5 border-l pl-2', isDark ? 'border-blue-500/15' : 'border-blue-200/40')}>
                    {nftItems.map((item) => (
                      <a
                        key={item.path}
                        href={item.path}
                        onClick={() => toggleDrawer(false)}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors duration-100',
                          isActive(item.path)
                            ? isDark ? 'bg-white/[0.08] text-white' : 'bg-primary/10 text-primary'
                            : isDark ? 'text-white/70 hover:bg-white/[0.05]' : 'text-gray-600 hover:bg-gray-50'
                        )}
                      >
                        {item.icon}
                        {item.name}
                      </a>
                    ))}
                  </div>
                )}

                <a
                  href="/swap"
                  onClick={() => toggleDrawer(false)}
                  className={cn(
                    'flex items-center rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-100',
                    isActive('/swap')
                      ? isDark ? 'bg-white/[0.08] text-white' : 'bg-gray-100 text-gray-900'
                      : isDark ? 'text-white/80 hover:bg-white/[0.05]' : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  Swap
                </a>
                <a
                  href="/news"
                  onClick={() => toggleDrawer(false)}
                  className={cn(
                    'flex items-center rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-100',
                    isActive('/news')
                      ? isDark ? 'bg-white/[0.08] text-white' : 'bg-gray-100 text-gray-900'
                      : isDark ? 'text-white/80 hover:bg-white/[0.05]' : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  News
                </a>
                <a
                  href="/watchlist"
                  onClick={() => toggleDrawer(false)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-100',
                    isActive('/watchlist')
                      ? 'bg-yellow-500/15 text-yellow-500'
                      : isDark ? 'text-yellow-500/80 hover:bg-yellow-500/10' : 'text-yellow-600 hover:bg-yellow-500/10'
                  )}
                >
                  <Star size={14} />
                  Watchlist
                </a>

                <div className={cn('my-2 border-t', isDark ? 'border-blue-500/10' : 'border-blue-200/30')} />

                <a
                  href="/launch"
                  onClick={() => toggleDrawer(false)}
                  className={cn(
                    'flex items-center justify-center rounded-lg px-4 py-2 text-[13px] font-medium transition-all duration-200 border',
                    isDark
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50'
                      : 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
                  )}
                >
                  Launch
                </a>
              </nav>

              <div className={cn('my-3 border-t', isDark ? 'border-blue-500/10' : 'border-blue-200/30')} />

              <div className="px-1">
                {accountProfile ? (
                  <button
                    onClick={() => {
                      setOpenWalletModal(true);
                      toggleDrawer(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-medium transition-all duration-200 border',
                      isDark
                        ? 'bg-white/[0.04] text-white border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/5'
                        : 'bg-gray-50 text-gray-900 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    )}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <span className="font-medium">{parseFloat(accountProfile.xrp || 0).toFixed(2)} XRP</span>
                    {profiles?.length > 1 && (
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded', isDark ? 'bg-white/10 text-white/60' : 'bg-gray-200 text-gray-500')}>{profiles.length}</span>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setWalletExpanded(!walletExpanded)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-[13px] font-medium transition-all duration-200 border',
                        isDark
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          : 'bg-blue-500 text-white border-blue-500'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Wallet size={14} />
                        <span>Connect Wallet</span>
                      </div>
                      <ChevronDown size={14} className={cn('transition-transform duration-150', walletExpanded && 'rotate-180')} />
                    </button>
                    {walletExpanded && (
                      <div className={cn('mt-2 rounded-lg border p-3', isDark ? 'border-blue-500/20 bg-white/[0.02]' : 'border-gray-200 bg-gray-50')}>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => { toggleDrawer(false); setPendingWalletAuth('google'); setTimeout(() => setOpenWalletModal(true), 100); }}
                            className={cn(
                              'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-[12px] transition-colors',
                              isDark ? 'border-white/10 hover:border-primary/50 hover:bg-primary/5' : 'border-gray-200 hover:border-primary/50 hover:bg-primary/5'
                            )}
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Google
                          </button>
                          <button
                            onClick={() => { toggleDrawer(false); handleDirectTwitterAuth(); }}
                            className={cn(
                              'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-[12px] transition-colors',
                              isDark ? 'border-white/10 hover:border-primary/50 hover:bg-primary/5' : 'border-gray-200 hover:border-primary/50 hover:bg-primary/5'
                            )}
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            Twitter
                          </button>
                          <button
                            onClick={() => { toggleDrawer(false); handleDirectDiscordAuth(); }}
                            className={cn(
                              'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-[12px] transition-colors',
                              isDark ? 'border-white/10 hover:border-primary/50 hover:bg-primary/5' : 'border-gray-200 hover:border-primary/50 hover:bg-primary/5'
                            )}
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#5865F2">
                              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                            </svg>
                            Discord
                          </button>
                          <button
                            onClick={() => { toggleDrawer(false); setPendingWalletAuth('passkey'); setTimeout(() => setOpenWalletModal(true), 100); }}
                            className={cn(
                              'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-[12px] transition-colors',
                              isDark ? 'border-white/10 hover:border-primary/50 hover:bg-primary/5' : 'border-gray-200 hover:border-primary/50 hover:bg-primary/5'
                            )}
                          >
                            <Fingerprint size={16} className="text-primary" />
                            Passkey
                          </button>
                        </div>
                        <form onSubmit={handleMobileEmailSubmit} className="mt-2 flex gap-2">
                          <input
                            type="email"
                            value={mobileEmail}
                            onChange={(e) => setMobileEmail(e.target.value)}
                            placeholder="Enter email"
                            className={cn(
                              'flex-1 rounded-lg border px-3 py-2 text-[12px] outline-none',
                              isDark ? 'border-white/10 bg-white/5 placeholder:text-white/30' : 'border-gray-200 bg-white placeholder:text-gray-400'
                            )}
                          />
                          <button
                            type="submit"
                            disabled={mobileEmailLoading || !mobileEmail.includes('@')}
                            className={cn(
                              'rounded-lg border px-3 py-2 transition-colors disabled:opacity-50',
                              isDark ? 'border-white/10 hover:border-primary/50 hover:bg-primary/5' : 'border-gray-200 hover:border-primary/50 hover:bg-primary/5'
                            )}
                          >
                            {mobileEmailLoading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                          </button>
                        </form>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className={cn('my-3 border-t', isDark ? 'border-blue-500/10' : 'border-blue-200/30')} />

              {/* Currency */}
              <div className="px-1">
                <p className={cn('mb-2 px-2 text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>
                  Currency
                </p>
                <div className="grid grid-cols-5 gap-1.5 px-1">
                  {currencyConfig.availableFiatCurrencies.map((currency) => (
                    <button
                      key={currency}
                      onClick={() => toggleFiatCurrency(currency)}
                      className={cn(
                        'flex items-center justify-center h-10 rounded-lg text-[12px] font-medium transition-all duration-150',
                        currency === activeFiatCurrency
                          ? isDark ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40' : 'bg-blue-500 text-white'
                          : isDark ? 'text-white/60 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      )}
                    >
                      {currency === 'XRP' ? '✕' : currencySymbols[currency]?.trim() || currency.charAt(0)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div className="mt-4 px-1">
                <p className={cn('mb-2 px-2 text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>
                  Theme
                </p>
                <div className="grid grid-cols-2 gap-2 px-1">
                  <button
                    onClick={() => setTheme('XrplToLightTheme')}
                    className={cn(
                      'flex items-center justify-center gap-2 h-10 rounded-lg text-[13px] font-medium transition-all duration-150',
                      themeName === 'XrplToLightTheme'
                        ? isDark ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40' : 'bg-blue-500 text-white'
                        : isDark ? 'text-white/60 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <Sun size={14} />
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('XrplToDarkTheme')}
                    className={cn(
                      'flex items-center justify-center gap-2 h-10 rounded-lg text-[13px] font-medium transition-all duration-150',
                      themeName === 'XrplToDarkTheme'
                        ? isDark ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40' : 'bg-blue-500 text-white'
                        : isDark ? 'text-white/60 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <Moon size={14} />
                    Dark
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}

export default memo(Header);
