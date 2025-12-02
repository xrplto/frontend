import Image from 'next/image';
import {
  useState,
  useContext,
  useEffect,
  memo,
  useCallback,
  lazy,
  Suspense,
  useRef
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { throttle } from 'src/utils/formatters';
import { AppContext } from 'src/AppContext';
import Logo from 'src/components/Logo';
import NavSearchBar from './NavSearchBar';
const SearchModal = lazy(() => import('./SearchModal'));
import Wallet from 'src/components/Wallet';
import { selectProcess, updateProcess } from 'src/redux/transactionSlice';
import { selectMetrics } from 'src/redux/statusSlice';
import { cn } from 'src/utils/cn';
import {
  Search,
  Menu,
  Star,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles,
  Trophy,
  Bell,
  ArrowLeftRight,
  Palette,
  Settings,
  Check,
  TrendingUp,
  Eye,
  Newspaper,
  Flame,
  Info,
  Waves,
  X,
  Fish,
  PawPrint,
  Droplets,
  Sun
} from 'lucide-react';

const BASE_URL = 'https://api.xrpl.to/api';
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

// Server-rendered switchers
import CurrencySwitcher from './CurrencySwitcher';
import ThemeSwitcher from './ThemeSwitcher';

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
  const { darkMode, setDarkMode, accountProfile, activeFiatCurrency, toggleFiatCurrency, themeName, setTheme } = useContext(AppContext);
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
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [tokensExpanded, setTokensExpanded] = useState(false);
  const [nftsExpanded, setNftsExpanded] = useState(false);

  const tokensRef = useRef(null);
  const nftsRef = useRef(null);
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


  // Menu items
  const discoverMenuItems = [
    { path: '/trending', name: 'Trending', icon: <Flame size={16} className="text-orange-500" /> },
    { path: '/spotlight', name: 'Spotlight', icon: <Search size={16} className="text-cyan-400" /> },
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
    { path: '/amm-pools', name: 'AMM Pools', icon: <Waves size={16} className="text-cyan-500" /> },
    ...(accountProfile ? [{ path: '/watchlist', name: 'Watchlist', icon: <Star size={16} className="text-yellow-500" /> }] : [])
  ];

  const nftItems = [
    { path: '/collections', name: 'Collections', icon: <PawPrint size={16} className="text-purple-500" /> },
    { path: '/nft-traders', name: 'NFT Traders', icon: <Sparkles size={16} className="text-pink-500" /> }
  ];

  const handleFullSearch = useCallback(() => {
    setFullSearch(true);
    setSearchModalOpen(true);
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
        'fixed left-0 right-0 top-0 z-[1100] flex h-[52px] items-center transition-all duration-200',
        isDark ? 'bg-black/90 backdrop-blur-xl border-b border-white/[0.04]' : 'bg-white/90 backdrop-blur-xl border-b border-gray-200/60'
      )}
    >
      <div className="mx-auto flex w-full max-w-full items-center justify-between px-4 sm:px-5 md:px-6">
        {/* Logo - Desktop */}
        <div className="mr-4 hidden items-center sm:flex md:mr-6">
          <Logo alt="xrpl.to Logo" style={{ marginRight: '12px', width: 'auto', height: '30px' }} />
        </div>

        {/* Desktop Navigation */}
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
                  'mr-1 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150',
                  isTokensActive
                    ? isDark ? 'text-white bg-white/[0.08]' : 'text-gray-900 bg-gray-100'
                    : isDark ? 'text-white/70 hover:text-white hover:bg-white/[0.05]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                    isDark ? 'border-white/[0.08] bg-[#0d0d0d] shadow-2xl shadow-black/70' : 'border-gray-200 bg-white shadow-xl shadow-black/[0.08]'
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
                            'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors duration-100',
                            isActive(item.path)
                              ? isDark ? 'bg-white/[0.08] text-white' : 'bg-primary/10 text-primary'
                              : isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-gray-50'
                          )}
                        >
                          {item.icon}
                          <span className={cn('text-[13px]', isActive(item.path) ? '' : isDark ? 'text-white/80' : 'text-gray-700')}>{item.name}</span>
                        </div>
                      ))}
                    </div>

                    {/* Column 2: Analytics */}
                    <div className={cn('min-w-[130px] border-l p-2', isDark ? 'border-white/[0.06]' : 'border-gray-100')}>
                      <p className={cn('mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>
                        Analytics
                      </p>
                      {analyticsItems.map((item) => (
                        <div
                          key={item.path}
                          onClick={() => handleTokenOptionSelect(item.path)}
                          className={cn(
                            'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors duration-100',
                            isActive(item.path)
                              ? isDark ? 'bg-white/[0.08] text-white' : 'bg-primary/10 text-primary'
                              : isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-gray-50'
                          )}
                        >
                          {item.icon}
                          <span className={cn('text-[13px]', isActive(item.path) ? '' : isDark ? 'text-white/80' : 'text-gray-700')}>{item.name}</span>
                        </div>
                      ))}
                    </div>

                    {/* Column 3: Discover */}
                    <div className={cn('min-w-[120px] border-l p-2', isDark ? 'border-white/[0.06]' : 'border-gray-100')}>
                      <p className={cn('mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>
                        Discover
                      </p>
                      {discoverMenuItems.map((item) => (
                        <div
                          key={item.path}
                          onClick={() => handleTokenOptionSelect(item.path)}
                          className={cn(
                            'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors duration-100',
                            isActive(item.path)
                              ? isDark ? 'bg-white/[0.08] text-white' : 'bg-primary/10 text-primary'
                              : isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-gray-50'
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
                  'mr-1 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150',
                  isNftsActive
                    ? isDark ? 'text-white bg-white/[0.08]' : 'text-gray-900 bg-gray-100'
                    : isDark ? 'text-white/70 hover:text-white hover:bg-white/[0.05]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                    isDark ? 'border-white/[0.08] bg-[#0d0d0d] shadow-2xl shadow-black/70' : 'border-gray-200 bg-white shadow-xl shadow-black/[0.08]'
                  )}
                >
                  <div className="p-1.5">
                    {nftItems.map((item) => (
                      <div
                        key={item.path}
                        onClick={() => handleTokenOptionSelect(item.path)}
                        className={cn(
                          'flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 transition-colors duration-100',
                          isActive(item.path)
                            ? isDark ? 'bg-white/[0.08] text-white' : 'bg-primary/10 text-primary'
                            : isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-gray-50'
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
                'mr-1 inline-flex items-center rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150',
                isActive('/swap')
                  ? isDark ? 'text-white bg-white/[0.08]' : 'text-gray-900 bg-gray-100'
                  : isDark ? 'text-white/70 hover:text-white hover:bg-white/[0.05]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              Swap
            </a>
            <a
              href="/news"
              className={cn(
                'mr-1 inline-flex items-center rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150',
                isActive('/news')
                  ? isDark ? 'text-white bg-white/[0.08]' : 'text-gray-900 bg-gray-100'
                  : isDark ? 'text-white/70 hover:text-white hover:bg-white/[0.05]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              News
            </a>
          </nav>
        )}

        {/* Full Search (mobile expanded) */}
        {fullSearch && (
          <NavSearchBar
            id="id_search_tokens"
            placeholder="Search XRPL Tokens"
            fullSearch={fullSearch}
            setFullSearch={setFullSearch}
            onOpenSearchModal={() => setSearchModalOpen(true)}
          />
        )}

        {/* Logo - Mobile */}
        {!fullSearch && (
          <div className="flex items-center sm:hidden">
            <Logo alt="xrpl.to Logo" style={{ width: 'auto', height: '26px', paddingLeft: 0 }} />
          </div>
        )}

        {/* Right Side Actions */}
        <div className="flex flex-grow items-center justify-end">
          {/* Desktop Search */}
          {!fullSearch && isDesktop && (
            <div className="mr-2">
              <NavSearchBar
                id="id_search_tokens"
                placeholder="Search XRPL Tokens"
                fullSearch={fullSearch}
                setFullSearch={setFullSearch}
                onOpenSearchModal={() => setSearchModalOpen(true)}
              />
            </div>
          )}

          {/* Mobile Search Icon */}
          {!fullSearch && isTabletOrMobile && (
            <button
              aria-label="Open search"
              onClick={handleFullSearch}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200',
                isDark ? 'text-white/60 hover:text-white hover:bg-white/[0.06]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/80'
              )}
            >
              <Search size={18} />
            </button>
          )}

          {/* Desktop Actions */}
          {!fullSearch && (
            <div className="mr-0 hidden items-center gap-2 md:flex">
              {/* Watchlist Button */}
              <a
                href="/watchlist"
                aria-label="Watchlist"
                title="Watchlist"
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200',
                  isDark
                    ? 'text-white/50 hover:text-yellow-500 hover:bg-yellow-500/10'
                    : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10'
                )}
              >
                <Star size={16} />
              </a>

              {/* Settings Dropdown */}
              <div ref={settingsRef} className="relative">
                <button
                  onClick={handleSettingsToggle}
                  aria-label="Settings"
                  title="Settings"
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200',
                    isDark
                      ? 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/80'
                  )}
                >
                  <Settings size={16} />
                </button>

                {settingsMenuOpen && (
                  <div
                    className={cn(
                      'absolute right-0 top-10 z-[2147483647] min-w-[180px] overflow-hidden rounded-xl border animate-in fade-in slide-in-from-top-1 duration-150',
                      isDark ? 'border-white/[0.08] bg-[#0d0d0d] shadow-2xl shadow-black/70' : 'border-gray-200 bg-white shadow-xl shadow-black/[0.08]'
                    )}
                  >
                    <div className="p-1.5">
                      {/* Currency Section */}
                      <p className={cn('flex items-center gap-2 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>
                        <ArrowLeftRight size={10} />
                        Currency
                      </p>
                      {currencyConfig.availableFiatCurrencies.map((currency) => (
                        <button
                          key={currency}
                          onClick={() => {
                            toggleFiatCurrency(currency);
                            setSettingsMenuOpen(false);
                          }}
                          className={cn(
                            'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors duration-100',
                            currency === activeFiatCurrency
                              ? isDark ? 'bg-white/[0.08] text-white' : 'bg-primary/10 text-primary'
                              : isDark ? 'text-white/80 hover:bg-white/[0.05]' : 'text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          <span className="text-[13px]">
                            {currencySymbols[currency] || ''}{currency}
                          </span>
                          {currency === activeFiatCurrency && <Check size={13} className="text-primary" />}
                        </button>
                      ))}

                      <div className={cn('my-1.5 border-t', isDark ? 'border-white/[0.06]' : 'border-gray-100')} />

                      {/* Theme Section */}
                      <p className={cn('flex items-center gap-2 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>
                        <Palette size={10} />
                        Theme
                      </p>
                      {[
                        { id: 'XrplToLightTheme', name: 'Light', icon: <Sun size={14} /> },
                        { id: 'XrplToDarkTheme', name: 'Dark', icon: <div className="h-3.5 w-3.5 rounded-full bg-gray-800 border border-gray-600" /> }
                      ].map((themeOption) => (
                        <button
                          key={themeOption.id}
                          onClick={() => {
                            setTheme(themeOption.id);
                            setSettingsMenuOpen(false);
                          }}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors duration-100',
                            themeName === themeOption.id
                              ? isDark ? 'bg-white/[0.08] text-white' : 'bg-primary/10 text-primary'
                              : isDark ? 'text-white/80 hover:bg-white/[0.05]' : 'text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          {themeOption.icon}
                          <span className="flex-1 text-left text-[13px]">
                            {themeOption.name}
                          </span>
                          {themeName === themeOption.id && <Check size={13} className="text-primary" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Launch Button */}
              <a
                href="/launch"
                className={cn(
                  'flex h-8 items-center rounded-lg px-4 text-[13px] font-medium transition-all duration-150',
                  isDark
                    ? 'bg-white text-black hover:bg-white/90'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                )}
              >
                Launch
              </a>

              <Wallet style={{ marginRight: '4px' }} buttonOnly={true} />
            </div>
          )}

          {/* Mobile Menu Button */}
          {isTabletOrMobile && !fullSearch && (
            <button
              aria-label="Open menu"
              onClick={() => toggleDrawer(true)}
              className={cn(
                'ml-1 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200',
                isDark ? 'text-white/60 hover:text-white hover:bg-white/[0.06]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/80'
              )}
            >
              <Menu size={18} />
            </button>
          )}
        </div>
      </div>


      {/* Search Modal */}
      <Suspense fallback={null}>
        <SearchModal open={searchModalOpen} onClose={() => { setSearchModalOpen(false); setFullSearch(false); }} />
      </Suspense>

      {/* Mobile Drawer */}
      {openDrawer && (
        <>
          <div className="fixed inset-0 z-[2147483646] bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => toggleDrawer(false)} />
          <div
            className={cn(
              'fixed bottom-0 right-0 top-0 z-[2147483647] w-[280px] animate-in slide-in-from-right duration-200',
              isDark ? 'bg-[#0d0d0d] border-l border-white/[0.08]' : 'bg-white border-l border-gray-200'
            )}
            style={{ overflowY: 'auto', height: '100vh', paddingBottom: '80px' }}
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
                  <div className={cn('ml-2 space-y-0.5 border-l pl-2', isDark ? 'border-white/[0.06]' : 'border-gray-200')}>
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
                  <div className={cn('ml-2 space-y-0.5 border-l pl-2', isDark ? 'border-white/[0.06]' : 'border-gray-200')}>
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

                <div className={cn('my-2 border-t', isDark ? 'border-white/[0.06]' : 'border-gray-100')} />

                <a
                  href="/launch"
                  onClick={() => toggleDrawer(false)}
                  className={cn(
                    'flex items-center justify-center rounded-lg px-4 py-2 text-[13px] font-medium transition-colors duration-100',
                    isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-gray-900 text-white hover:bg-gray-800'
                  )}
                >
                  Launch
                </a>
              </nav>

              <div className={cn('my-3 border-t', isDark ? 'border-white/[0.06]' : 'border-gray-100')} />

              <div className="px-1">
                <Wallet buttonOnly={true} />
              </div>

              <div className={cn('my-3 border-t', isDark ? 'border-white/[0.06]' : 'border-gray-100')} />

              {/* Currency */}
              <div className="px-1">
                <p className={cn('mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>
                  Currency
                </p>
                <div className="flex flex-wrap gap-1">
                  {currencyConfig.availableFiatCurrencies.map((currency) => (
                    <button
                      key={currency}
                      onClick={() => toggleFiatCurrency(currency)}
                      className={cn(
                        'rounded-lg px-3 py-2 text-[13px] transition-colors',
                        currency === activeFiatCurrency
                          ? isDark ? 'bg-white/[0.12] text-white font-medium' : 'bg-primary/10 text-primary font-medium'
                          : isDark ? 'text-white/60 hover:bg-white/[0.06]' : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      {currencySymbols[currency] || ''}{currency}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div className="mt-4 px-1">
                <p className={cn('mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>
                  Theme
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme('XrplToLightTheme')}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] transition-colors',
                      themeName === 'XrplToLightTheme'
                        ? isDark ? 'bg-white/[0.12] text-white font-medium' : 'bg-primary/10 text-primary font-medium'
                        : isDark ? 'text-white/60 hover:bg-white/[0.06]' : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <Sun size={14} />
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('XrplToDarkTheme')}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] transition-colors',
                      themeName === 'XrplToDarkTheme'
                        ? 'bg-white/[0.12] text-white font-medium'
                        : isDark ? 'text-white/60 hover:bg-white/[0.06]' : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <div className="h-3.5 w-3.5 rounded-full bg-gray-700 border border-gray-500" />
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
