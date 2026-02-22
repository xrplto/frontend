import Decimal from 'decimal.js-light';
import { useState, useEffect, useContext, memo, useMemo, useCallback, useRef } from 'react';
import React from 'react';

import { Bookmark } from 'lucide-react';
import api from 'src/utils/api';
import { cn } from 'src/utils/cn';

import { WalletContext } from 'src/context/AppContext';
import { addTokenToTabs } from 'src/hooks/useTokenTabs';

// Constants
const currencySymbols = {
  USD: '$',
  EUR: '€',
  JPY: '¥',
  CNH: '¥',
  XRP: ''
};

// Sparkline API request queue with concurrency limit
const SPARKLINE_MAX_CONCURRENT = 25;
let sparklineActiveCount = 0;
const sparklineQueue = [];
const sparklineCache = new Map();

function enqueueSparklineRequest(fn, id) {
  return new Promise((resolve, reject) => {
    const entry = { id, run: () => fn().then(resolve, reject), cancelled: false };
    sparklineQueue.push(entry);
    drainSparklineQueue();
    return entry;
  });
}

function cancelSparklineRequest(id) {
  for (let i = sparklineQueue.length - 1; i >= 0; i--) {
    if (sparklineQueue[i].id === id && !sparklineQueue[i].running) {
      sparklineQueue.splice(i, 1);
    }
  }
}

function drainSparklineQueue() {
  while (sparklineActiveCount < SPARKLINE_MAX_CONCURRENT && sparklineQueue.length > 0) {
    const entry = sparklineQueue.shift();
    if (entry.cancelled) continue;
    entry.running = true;
    sparklineActiveCount++;
    entry.run().finally(() => {
      sparklineActiveCount--;
      drainSparklineQueue();
    });
  }
}

// Shared IntersectionObserver singleton for sparkline visibility
const sparklineObserverCallbacks = new Map();
let sparklineObserver = null;

function getSparklineObserver() {
  if (sparklineObserver) return sparklineObserver;
  if (typeof IntersectionObserver === 'undefined') return null;
  sparklineObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const cb = sparklineObserverCallbacks.get(entry.target);
          if (cb) {
            cb();
            sparklineObserverCallbacks.delete(entry.target);
            sparklineObserver.unobserve(entry.target);
          }
        }
      });
    },
    { rootMargin: '100px' }
  );
  return sparklineObserver;
}

// Inline Sparkline - SVG based with filled area like Orb design
const SparklineChart = memo(
  ({ url }) => {
    const [linePath, setLinePath] = useState('');
    const [areaPath, setAreaPath] = useState('');
    const [color, setColor] = useState('#22c55e');
    const containerRef = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const obs = getSparklineObserver();
      if (!obs) { setVisible(true); return; }
      sparklineObserverCallbacks.set(el, () => setVisible(true));
      obs.observe(el);
      return () => {
        sparklineObserverCallbacks.delete(el);
        obs.unobserve(el);
      };
    }, []);

    useEffect(() => {
      if (!visible || !url) return;
      let cancelled = false;

      const processData = (prices) => {
        if (prices.length < 2) return;
        const w = 120, h = 32;
        const min = Math.min(...prices), max = Math.max(...prices), range = max - min || 1;
        const pts = prices.map((p, i) => [(i / (prices.length - 1)) * w, h - ((p - min) / range) * (h - 4) - 2]);
        const line = 'M' + pts.map((p) => p.join(',')).join('L');
        setLinePath(line);
        setAreaPath(line + `L${w},${h}L0,${h}Z`);
        setColor(prices[prices.length - 1] >= prices[0] ? '#22c55e' : '#ef4444');
      };

      if (sparklineCache.has(url)) {
        processData(sparklineCache.get(url));
        return;
      }

      const controller = new AbortController();
      enqueueSparklineRequest(() =>
        api
          .get(url, { signal: controller.signal })
          .then((res) => {
            if (cancelled) return;
            const prices = res.data?.data?.prices?.map(Number) || [];
            sparklineCache.set(url, prices);
            processData(prices);
          })
          .catch(err => { if (err?.name !== 'AbortError') console.warn('[TokenRow] Sparkline fetch failed:', err.message); }),
        url
      );
      return () => {
        cancelled = true;
        controller.abort();
        cancelSparklineRequest(url);
      };
    }, [visible, url]);

    const fillColor = color === '#22c55e' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';

    return (
      <div ref={containerRef} className="tr-spark w-[120px] h-[32px]" style={{ '--spark-color': color || 'transparent' }}>
        {linePath ? (
          <svg
            width="120"
            height="32"
            viewBox="0 0 120 32"
            preserveAspectRatio="none"
            className="block"
          >
            <path d={areaPath} fill={fillColor} />
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <div className="w-[120px] h-[32px] bg-[rgba(128,128,128,0.04)] rounded" />
        )}
      </div>
    );
  },
  (prev, next) => prev.url === next.url
);

SparklineChart.displayName = 'SparklineChart';

const StyledRow = ({ className, children, isDark, isNew, ...p }) => (
  <tr
    className={cn('tr-row cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#137DFE]', isNew && 'tr-row-new', className)}
    style={{
      borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`
    }}
    {...p}
  >
    {children}
  </tr>
);

const StyledCell = ({ className, children, isDark, isTokenColumn, align, fontWeight, color, ...p }) => (
  <td
    className={cn(
      'tr-cell text-sm align-middle first:pl-3 last:pr-3 py-[14px] px-1 font-normal',
      isTokenColumn ? 'whitespace-normal' : 'whitespace-nowrap',
      className
    )}
    style={{
      textAlign: align || 'left',
      fontWeight: fontWeight || undefined,
      color: color || (isDark ? 'rgba(255, 255, 255, 0.9)' : '#1a1a1a'),
      ...p.style
    }}
    {...(({ style, ...rest }) => rest)(p)}
  >
    {children}
  </td>
);

// Mobile-specific flexbox components
const MobileTokenCard = ({ className, children, isDark, isNew, ...p }) => (
  <div
    className={cn(
      'mobile-card flex w-full items-center cursor-pointer box-border outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#137DFE]',
      'py-[7px] px-2.5 border-b border-l-2 bg-transparent',
      isDark ? 'border-white/10' : 'border-black/[0.06]',
      isNew ? 'border-l-green-500 tr-row-new' : 'border-l-transparent',
      className
    )}
    {...p}
  >
    {children}
  </div>
);

const MobileTokenInfo = ({ className, children, ...p }) => (
  <div
    className={cn('flex items-center gap-2 min-w-0 flex-[2] px-0.5', className)}
    {...p}
  >
    {children}
  </div>
);

const MobilePriceCell = ({ className, children, isDark, ...p }) => (
  <div
    className={cn(
      'text-right text-[12.5px] font-medium min-w-0 flex-[1.2] px-1 tracking-[0.01em] overflow-hidden text-ellipsis whitespace-nowrap',
      isDark ? 'text-white/90' : 'text-black',
      className
    )}
    {...p}
  >
    {children}
  </div>
);

const MobilePercentCell = ({ className, children, isDark, ...p }) => (
  <div
    className={cn('text-right text-[12.5px] font-medium min-w-0 flex-[0.8] px-1 tracking-[0.01em] overflow-hidden text-ellipsis whitespace-nowrap', className)}
    {...p}
  >
    {children}
  </div>
);

// Shared components with mobile/desktop variations
const TokenImage = ({ className, children, isDark, isMobile, ...p }) => (
  <div
    className={cn(
      'rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center',
      isMobile ? 'w-7 h-7' : 'tr-img w-10 h-10',
      isDark ? 'bg-white/[0.08]' : 'bg-black/[0.05]',
      className
    )}
    {...p}
  >
    {children}
  </div>
);

const TokenDetails = ({ className, children, ...p }) => (
  <div className={cn('flex-1 min-w-0 flex flex-col gap-px', className)} {...p}>
    {children}
  </div>
);

const TokenName = ({ className, children, isDark, isMobile, ...p }) => (
  <span
    className={cn(
      'font-medium overflow-hidden text-ellipsis whitespace-nowrap block leading-[1.4]',
      isMobile ? 'text-[13px] max-w-[110px]' : 'tr-name text-[15px] max-w-[180px]',
      isDark ? 'text-white' : 'text-[#1a1a1a]',
      className
    )}
    {...p}
  >
    {children}
  </span>
);

const UserName = ({ className, children, isDark, isMobile, ...p }) => (
  <span
    className={cn(
      'font-normal block overflow-hidden text-ellipsis whitespace-nowrap leading-[1.3]',
      isMobile ? 'text-[11px] max-w-[110px]' : 'tr-user text-[13px] max-w-[180px]',
      isDark ? 'text-white/60' : 'text-black/60',
      className
    )}
    {...p}
  >
    {children}
  </span>
);

const PriceText = ({ flashColor, isDark, isMobile, children }) => (
  <span
    className={cn(
      'font-normal font-mono price-flash',
      isMobile ? 'text-[14px]' : 'text-[15px]'
    )}
    style={{
      color: flashColor || (isDark ? 'rgba(255, 255, 255, 0.9)' : '#1a1a1a')
    }}
  >
    {children}
  </span>
);

const PercentText = ({ className, children, color, isMobile, ...p }) => (
  <span
    className={cn('font-normal text-sm font-mono', className)}
    style={{ color }}
    {...p}
  >
    {children}
  </span>
);

const truncate = (str, n) => {
  if (!str) return '';
  return str.length > n ? str.substr(0, n - 1) + '...' : str;
};

// Price formatter - returns object for compact notation or string
const formatPrice = (price) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (numPrice == null || isNaN(numPrice) || !isFinite(numPrice) || numPrice === 0) return '0';

  if (numPrice < 0.01) {
    const str = numPrice.toFixed(15);
    const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
    if (zeros >= 4) {
      const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
      return { compact: true, zeros, significant: significant.slice(0, 4) };
    }
    return numPrice.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  } else if (numPrice < 1) {
    return numPrice.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  } else if (numPrice < 100) {
    return numPrice.toFixed(2);
  } else if (numPrice >= 1e6) {
    return `${(numPrice / 1e6).toFixed(1)}M`;
  } else if (numPrice >= 1e3) {
    return `${(numPrice / 1e3).toFixed(1)}K`;
  }
  return Math.round(numPrice).toString();
};

// Render price with compact notation support
const PriceDisplay = ({ price, symbol = '' }) => {
  const formatted = formatPrice(price);
  if (formatted?.compact) {
    return (
      <>
        {symbol}0.0<sub className="text-[0.6em]">{formatted.zeros}</sub>
        {formatted.significant}
      </>
    );
  }
  return (
    <>
      {symbol}
      {formatted}
    </>
  );
};

// Simple number formatter with thousand separators
const formatNumber = (num) => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  if (num < 1) return num.toFixed(4);
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

// Simple integer formatter
const formatInt = (num) => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return Math.round(num).toLocaleString('en-US');
};

const formatTimeAgo = (dateValue, fallbackValue) => {
  if (!dateValue) return 'N/A';
  const date = typeof dateValue === 'number' ? new Date(dateValue) : new Date(dateValue);
  const now = new Date();
  let seconds = Math.floor((now - date) / 1000);

  if (seconds < 0 && fallbackValue) {
    const fallbackDate =
      typeof fallbackValue === 'number' ? new Date(fallbackValue) : new Date(fallbackValue);
    seconds = Math.floor((now - fallbackDate) / 1000);
    if (seconds < 0) return 'Just now';
  }

  if (seconds < 0) return 'Just now';
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  return `${days}d`;
};

// Optimized image component — uses server-side thumb endpoint for resize + animation stripping
const OptimizedImage = memo(
  ({ src, alt, size, onError, priority = false, md5, noCache }) => {
    const [errored, setErrored] = useState(false);

    // Request 2x for retina, snapped to allowed sizes [16,32,40,48,64,96,128]
    const s2 = size * 2;
    const thumbSize = s2 <= 32 ? 32 : s2 <= 48 ? 48 : s2 <= 64 ? 64 : s2 <= 96 ? 96 : 128;
    const cacheBust = noCache ? `?v=${Math.floor(Date.now() / 300000)}` : '';
    const imgSrc = errored
      ? '/static/alt.webp'
      : md5
        ? `https://s1.xrpl.to/thumb/${md5}_${thumbSize}${cacheBust}`
        : src;

    const handleError = useCallback(() => {
      setErrored(true);
      if (onError) onError();
    }, [onError]);

    return (
      <div className="rounded-full overflow-hidden relative" style={{ width: size, height: size }}>
        <img
          src={imgSrc}
          alt={alt}
          width={size}
          height={size}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onError={handleError}
          className="object-cover"
          style={{ width: size, height: size }}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.src === nextProps.src &&
      prevProps.size === nextProps.size &&
      prevProps.md5 === nextProps.md5 &&
      prevProps.noCache === nextProps.noCache
    );
  }
);

const MobileTokenRow = ({
  token,
  darkMode,
  exchRate,
  activeFiatCurrency,
  handleRowClick,
  imgError,
  setImgError,
  viewMode = 'classic',
  customColumns = [],
  noImageCache = false
}) => {
  const {
    name,
    user,
    md5,
    slug,
    pro24h,
    pro1h,
    pro5m,
    pro7d,
    pro30d,
    exch,
    vol24hxrp,
    vol24htx,
    marketcap,
    tvl,
    holders,
    amount,
    dateon,
    date,
    isNew,
    tokenType,
    mptIssuanceID,
    metadata
  } = token;

  // MPT token display name fallback
  const displayName = name || metadata?.name || metadata?.ticker || 'MPT';
  const displayUser = user || (mptIssuanceID ? truncate(mptIssuanceID, 16) : '');

  const [flashColor, setFlashColor] = useState(null);
  const prevBearbullTime = useRef(token.bearbullTime);

  useEffect(() => {
    if (token.bearbullTime && token.bearbullTime !== prevBearbullTime.current) {
      prevBearbullTime.current = token.bearbullTime;
      const color = token.bearbull === -1 ? '#ef4444' : token.bearbull === 1 ? '#10b981' : null;
      setFlashColor(color);
      const timer = setTimeout(() => setFlashColor(null), 800);
      return () => clearTimeout(timer);
    }
  }, [token.bearbullTime, token.bearbull]);

  const getPercentColor = (value) => {
    if (value === undefined || value === null || isNaN(value))
      return darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
    return value < 0 ? '#c75050' : '#22a86b';
  };

  const getMarketCapColor = () => {
    return darkMode ? 'rgba(255,255,255,0.9)' : '#1a1a1a';
  };

  const imgUrl = `https://s1.xrpl.to/token/${md5}`;

  // Get mobile column preferences - use customColumns when available
  const mobilePriceColumn = customColumns && customColumns[0] ? customColumns[0] : 'price';
  const mobilePercentColumn = customColumns && customColumns[1] ? customColumns[1] : 'pro24h';

  // Format value based on column type - handles all field types
  const formatMobileValue = (columnId) => {
    // Check if it's a percentage column
    if (['pro5m', 'pro1h', 'pro24h', 'pro7d', 'pro30d'].includes(columnId)) {
      const val = columnId === 'pro30d' ? pro24h * 30 : token[columnId];
      const color = getPercentColor(val);
      return (
        <span style={{ color, fontWeight: '500' }}>
          {val !== undefined && val !== null && !isNaN(val)
            ? `${val > 0 ? '+' : ''}${val.toFixed(1)}%`
            : '0.0%'}
        </span>
      );
    }

    // Handle other data types
    switch (columnId) {
      case 'price':
        const price = activeFiatCurrency === 'XRP' ? exch : exch / exchRate;
        return <PriceDisplay price={price} symbol={currencySymbols[activeFiatCurrency]} />;
      case 'volume24h':
        const vol =
          vol24hxrp && exchRate ? new Decimal(vol24hxrp || 0).div(exchRate).toNumber() : 0;
        return `${currencySymbols[activeFiatCurrency]}${vol >= 1e6 ? `${(vol / 1e6).toFixed(1)}M` : vol >= 1e3 ? `${(vol / 1e3).toFixed(1)}K` : formatNumber(vol)}`;
      case 'volume7d':
        const vol7 =
          vol24hxrp && exchRate ? new Decimal((vol24hxrp || 0) * 7).div(exchRate).toNumber() : 0;
        return `${currencySymbols[activeFiatCurrency]}${vol7 >= 1e6 ? `${(vol7 / 1e6).toFixed(1)}M` : vol7 >= 1e3 ? `${(vol7 / 1e3).toFixed(1)}K` : formatNumber(vol7)}`;
      case 'marketCap':
        const mcap =
          marketcap && exchRate ? new Decimal(marketcap || 0).div(exchRate).toNumber() : 0;
        return (
          <span style={{ color: getMarketCapColor(mcap), fontWeight: '400' }}>
            {`${currencySymbols[activeFiatCurrency]}${mcap >= 1e9 ? `${(mcap / 1e9).toFixed(1)}B` : mcap >= 1e6 ? `${(mcap / 1e6).toFixed(1)}M` : mcap >= 1e3 ? `${(mcap / 1e3).toFixed(1)}K` : formatNumber(mcap)}`}
          </span>
        );
      case 'tvl':
        const tvlVal = tvl && exchRate ? new Decimal(tvl || 0).div(exchRate).toNumber() : 0;
        return `${currencySymbols[activeFiatCurrency]}${tvlVal >= 1e6 ? `${(tvlVal / 1e6).toFixed(1)}M` : tvlVal >= 1e3 ? `${(tvlVal / 1e3).toFixed(1)}K` : formatNumber(tvlVal)}`;
      case 'holders':
        return holders >= 1e3 ? `${(holders / 1e3).toFixed(1)}K` : formatInt(holders);
      case 'trades':
        return vol24htx >= 1e3 ? `${(vol24htx / 1e3).toFixed(1)}K` : formatInt(vol24htx);
      case 'supply':
        return amount >= 1e9
          ? `${(amount / 1e9).toFixed(1)}B`
          : amount >= 1e6
            ? `${(amount / 1e6).toFixed(1)}M`
            : amount >= 1e3
              ? `${(amount / 1e3).toFixed(1)}K`
              : formatInt(amount);
      case 'created':
        return formatTimeAgo(dateon, date);
      case 'origin':
        return token.origin || 'XRPL';
      default:
        return '-';
    }
  };

  // Using flexbox layout instead of table
  return (
    <MobileTokenCard onClick={handleRowClick} isDark={darkMode} isNew={isNew}>
      <MobileTokenInfo>
        <TokenImage isMobile={true} isDark={darkMode}>
          <OptimizedImage
            src={imgError ? '/static/alt.webp' : imgUrl}
            alt=""
            size={28}
            onError={() => setImgError(true)}
            priority={false}
            md5={md5}
            noCache={noImageCache}
          />
        </TokenImage>
        <TokenDetails>
          <TokenName isMobile={true} isDark={darkMode}>
            {displayName}
          </TokenName>
          <UserName isMobile={true} isDark={darkMode}>
            {displayUser}
          </UserName>
        </TokenDetails>
      </MobileTokenInfo>

      <MobilePriceCell isDark={darkMode}>{formatMobileValue(mobilePriceColumn)}</MobilePriceCell>

      <MobilePercentCell isDark={darkMode}>
        {formatMobileValue(mobilePercentColumn)}
      </MobilePercentCell>
    </MobileTokenCard>
  );
};

const DesktopTokenRow = ({
  token,
  darkMode,
  exchRate,
  activeFiatCurrency,
  handleRowClick,
  handleWatchlistClick,
  watchList,
  idx,
  imgError,
  setImgError,
  sparklineUrl,
  convertedValues,
  formatValue,
  isLoggedIn,
  viewMode = 'classic',
  customColumns = [],
  noImageCache = false
}) => {
  const {
    name,
    user,
    md5,
    slug,
    pro24h,
    pro7d,
    pro1h,
    pro5m,
    exch,
    vol24htx,
    tvl,
    holders,
    amount,
    dateon,
    date,
    origin,
    isNew,
    tokenType,
    mptIssuanceID,
    metadata
  } = token;

  // MPT token display name fallback
  const displayName = name || metadata?.name || metadata?.ticker || 'MPT';
  const displayUser = user || (mptIssuanceID ? truncate(mptIssuanceID, 16) : '');

  const [flashColor, setFlashColor] = useState(null);
  const prevBearbullTime = useRef(token.bearbullTime);

  useEffect(() => {
    if (token.bearbullTime && token.bearbullTime !== prevBearbullTime.current) {
      prevBearbullTime.current = token.bearbullTime;
      const color = token.bearbull === -1 ? '#ef4444' : token.bearbull === 1 ? '#10b981' : null;
      setFlashColor(color);
      const timer = setTimeout(() => setFlashColor(null), 800);
      return () => clearTimeout(timer);
    }
  }, [token.bearbullTime, token.bearbull]);

  const getPercentColor = (value) => {
    if (value === undefined || value === null || isNaN(value))
      return darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
    return value < 0 ? '#c75050' : '#22a86b';
  };

  const getMarketCapColor = () => {
    return darkMode ? 'rgba(255,255,255,0.9)' : '#1a1a1a';
  };

  const imgUrl = `https://s1.xrpl.to/token/${md5}`;

  // Render different columns based on view mode
  const renderColumns = () => {
    const tokenCell = (
      <StyledCell
        align="left"
        isDark={darkMode}
        isTokenColumn={true}
        style={{
          width: 'auto',
          paddingRight: '8px'
        }}
      >
        <div className="flex items-center gap-[10px]">
          <TokenImage isDark={darkMode}>
            <OptimizedImage
              src={imgError ? '/static/alt.webp' : imgUrl}
              alt=""
              size={40}
              onError={() => setImgError(true)}
              priority={false}
              md5={md5}
              noCache={noImageCache}
            />
          </TokenImage>
          <div className="min-w-0">
            <TokenName isDark={darkMode} title={displayName}>
              {truncate(displayName, 16)}
            </TokenName>
            <UserName isDark={darkMode} title={displayUser}>
              {truncate(displayUser, 12)}
            </UserName>
          </div>
        </div>
      </StyledCell>
    );

    const priceCell = (() => {
      const rawPrice = activeFiatCurrency === 'XRP' ? exch : exch / exchRate;
      const formatted = formatPrice(rawPrice);
      return (
        <StyledCell align="right" isDark={darkMode} style={{ minWidth: 100 }}>
          <PriceText flashColor={flashColor} isDark={darkMode}>
            {formatted?.compact ? (
              <>
                {currencySymbols[activeFiatCurrency]}0.0
                <sub className="text-[0.6em]">{formatted.zeros}</sub>
                {formatted.significant}
              </>
            ) : (
              <>
                {currencySymbols[activeFiatCurrency]}
                {formatted}
              </>
            )}
          </PriceText>
        </StyledCell>
      );
    })();

    switch (viewMode) {
      case 'priceChange':
        return (
          <>
            {tokenCell}
            {priceCell}
            <StyledCell align="right" isDark={darkMode}>
              <PercentText color={getPercentColor(pro5m)}>
                {pro5m !== undefined && pro5m !== null && !isNaN(pro5m)
                  ? `${pro5m > 0 ? '+' : ''}${pro5m.toFixed(2)}%`
                  : '0.00%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              <PercentText color={getPercentColor(pro1h)}>
                {pro1h !== undefined && pro1h !== null && !isNaN(pro1h)
                  ? `${pro1h > 0 ? '+' : ''}${pro1h.toFixed(2)}%`
                  : '0.00%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              <PercentText color={getPercentColor(pro24h)}>
                {pro24h !== undefined && pro24h !== null && !isNaN(pro24h)
                  ? `${pro24h > 0 ? '+' : ''}${pro24h.toFixed(1)}%`
                  : '0.0%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              <PercentText color={getPercentColor(pro7d)}>
                {pro7d !== undefined && pro7d !== null && !isNaN(pro7d)
                  ? `${pro7d > 0 ? '+' : ''}${pro7d.toFixed(2)}%`
                  : '0.00%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              <PercentText color={getPercentColor(pro24h * 30)}>
                {pro24h !== undefined && pro24h !== null && !isNaN(pro24h)
                  ? `${pro24h * 30 > 0 ? '+' : ''}${(pro24h * 30).toFixed(0)}%`
                  : '0%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              {currencySymbols[activeFiatCurrency]}
              {formatValue(convertedValues.volume)}
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              {sparklineUrl ? (
                <SparklineChart key={sparklineUrl} url={sparklineUrl} darkMode={darkMode} />
              ) : (
                <span className={darkMode ? 'text-white/50' : 'text-black/50'}>
                  -
                </span>
              )}
            </StyledCell>
          </>
        );

      case 'marketData':
        return (
          <>
            {tokenCell}
            {priceCell}
            <StyledCell align="right" isDark={darkMode}>
              <span
                style={{ fontWeight: '400', color: getMarketCapColor(convertedValues.marketCap) }}
              >
                {currencySymbols[activeFiatCurrency]}
                {formatValue(convertedValues.marketCap)}
              </span>
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              {currencySymbols[activeFiatCurrency]}
              {formatValue(convertedValues.volume)}
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              {currencySymbols[activeFiatCurrency]}
              {formatValue(convertedValues.tvl)}
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              {formatValue(holders, 'int')}
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              {formatValue(amount, 'int')}
            </StyledCell>
            <StyledCell align="right" isDark={darkMode} style={{ paddingLeft: 12, paddingRight: 16 }}>
              {origin || 'XRPL'}
            </StyledCell>
          </>
        );

      case 'topGainers':
        return (
          <>
            {tokenCell}
            {priceCell}
            <StyledCell align="right" isDark={darkMode}>
              <PercentText color={getPercentColor(pro5m)}>
                {pro5m !== undefined && pro5m !== null && !isNaN(pro5m)
                  ? `${pro5m > 0 ? '+' : ''}${pro5m.toFixed(2)}%`
                  : '0.00%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              <PercentText color={getPercentColor(pro1h)}>
                {pro1h !== undefined && pro1h !== null && !isNaN(pro1h)
                  ? `${pro1h > 0 ? '+' : ''}${pro1h.toFixed(2)}%`
                  : '0.00%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              <PercentText color={getPercentColor(pro24h)}>
                {pro24h !== undefined && pro24h !== null && !isNaN(pro24h)
                  ? `${pro24h > 0 ? '+' : ''}${pro24h.toFixed(1)}%`
                  : '0.0%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              <PercentText color={getPercentColor(pro7d)}>
                {pro7d !== undefined && pro7d !== null && !isNaN(pro7d)
                  ? `${pro7d > 0 ? '+' : ''}${pro7d.toFixed(2)}%`
                  : '0.00%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              {currencySymbols[activeFiatCurrency]}
              {formatValue(convertedValues.volume)}
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              <span style={{ fontWeight: '400', color: getMarketCapColor() }}>
                {currencySymbols[activeFiatCurrency]}
                {formatValue(convertedValues.marketCap)}
              </span>
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              {sparklineUrl ? (
                <SparklineChart key={sparklineUrl} url={sparklineUrl} darkMode={darkMode} />
              ) : (
                <span className={darkMode ? 'text-white/50' : 'text-black/50'}>
                  -
                </span>
              )}
            </StyledCell>
          </>
        );

      case 'trader':
        return (
          <>
            {tokenCell}
            {priceCell}
            <StyledCell align="right" isDark={darkMode}>
              <PercentText color={getPercentColor(pro5m)}>
                {pro5m !== undefined && pro5m !== null && !isNaN(pro5m)
                  ? `${pro5m > 0 ? '+' : ''}${pro5m.toFixed(2)}%`
                  : '0.00%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              <PercentText color={getPercentColor(pro1h)}>
                {pro1h !== undefined && pro1h !== null && !isNaN(pro1h)
                  ? `${pro1h > 0 ? '+' : ''}${pro1h.toFixed(2)}%`
                  : '0.00%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              <PercentText color={getPercentColor(pro24h)}>
                {pro24h !== undefined && pro24h !== null && !isNaN(pro24h)
                  ? `${pro24h > 0 ? '+' : ''}${pro24h.toFixed(1)}%`
                  : '0.0%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              {currencySymbols[activeFiatCurrency]}
              {formatValue(convertedValues.volume)}
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              {formatValue(vol24htx, 'int')}
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              {currencySymbols[activeFiatCurrency]}
              {formatValue(convertedValues.tvl)}
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              {sparklineUrl ? (
                <SparklineChart key={sparklineUrl} url={sparklineUrl} darkMode={darkMode} />
              ) : (
                <span className={darkMode ? 'text-white/50' : 'text-black/50'}>
                  -
                </span>
              )}
            </StyledCell>
          </>
        );

      case 'custom':
        // If customColumns is empty or undefined, fall through to classic view
        if (!customColumns || customColumns.length === 0) {
          // Fall through to classic case
        } else {
          // Render custom columns with last column padding
          const columnElements = [];
          const lastColumnIndex = customColumns.length - 1;

          customColumns.forEach((column, index) => {
            const isLastColumn = index === lastColumnIndex;
            const extraStyle = {};

            switch (column) {
              case 'price':
                const customPrice = activeFiatCurrency === 'XRP' ? exch : exch / exchRate;
                const customFormatted = formatPrice(customPrice);
                columnElements.push(
                  <StyledCell key="price" align="right" isDark={darkMode} style={extraStyle}>
                    <PriceText flashColor={flashColor} isDark={darkMode}>
                      {customFormatted?.compact ? (
                        <>
                          {currencySymbols[activeFiatCurrency]}0.0
                          <sub className="text-[0.6em]">{customFormatted.zeros}</sub>
                          {customFormatted.significant}
                        </>
                      ) : (
                        <>
                          {currencySymbols[activeFiatCurrency]}
                          {customFormatted}
                        </>
                      )}
                    </PriceText>
                  </StyledCell>
                );
                break;
              case 'pro5m':
                columnElements.push(
                  <StyledCell key="pro5m" align="right" isDark={darkMode} style={extraStyle}>
                    <PercentText color={getPercentColor(pro5m)}>
                      {pro5m !== undefined && pro5m !== null && !isNaN(pro5m)
                        ? `${pro5m.toFixed(2)}%`
                        : '0.00%'}
                    </PercentText>
                  </StyledCell>
                );
                break;
              case 'pro1h':
                columnElements.push(
                  <StyledCell key="pro1h" align="right" isDark={darkMode} style={extraStyle}>
                    <PercentText color={getPercentColor(pro1h)}>
                      {pro1h !== undefined && pro1h !== null && !isNaN(pro1h)
                        ? `${pro1h.toFixed(2)}%`
                        : '0.00%'}
                    </PercentText>
                  </StyledCell>
                );
                break;
              case 'pro24h':
                columnElements.push(
                  <StyledCell key="pro24h" align="right" isDark={darkMode} style={extraStyle}>
                    <PercentText color={getPercentColor(pro24h)}>
                      {pro24h !== undefined && pro24h !== null && !isNaN(pro24h)
                        ? `${pro24h > 0 ? '+' : ''}${pro24h.toFixed(1)}%`
                        : '0.0%'}
                    </PercentText>
                  </StyledCell>
                );
                break;
              case 'pro7d':
                columnElements.push(
                  <StyledCell key="pro7d" align="right" isDark={darkMode} style={extraStyle}>
                    <PercentText color={getPercentColor(pro7d)}>
                      {pro7d !== undefined && pro7d !== null && !isNaN(pro7d)
                        ? `${pro7d.toFixed(2)}%`
                        : '0.00%'}
                    </PercentText>
                  </StyledCell>
                );
                break;
              case 'pro30d':
                columnElements.push(
                  <StyledCell key="pro30d" align="right" isDark={darkMode} style={extraStyle}>
                    <PercentText color={getPercentColor(pro24h * 30)}>
                      {pro24h !== undefined && pro24h !== null && !isNaN(pro24h)
                        ? `${(pro24h * 30).toFixed(0)}%`
                        : '0%'}
                    </PercentText>
                  </StyledCell>
                );
                break;
              case 'volume24h':
                columnElements.push(
                  <StyledCell key="volume24h" align="right" isDark={darkMode} style={extraStyle}>
                    {currencySymbols[activeFiatCurrency]}
                    {formatValue(convertedValues.volume)}
                  </StyledCell>
                );
                break;
              case 'volume7d':
                columnElements.push(
                  <StyledCell key="volume7d" align="right" isDark={darkMode} style={extraStyle}>
                    {currencySymbols[activeFiatCurrency]}
                    {formatValue(convertedValues.volume * 7)}
                  </StyledCell>
                );
                break;
              case 'marketCap':
                columnElements.push(
                  <StyledCell key="marketCap" align="right" isDark={darkMode} style={extraStyle}>
                    <span
                      style={{
                        fontWeight: '400',
                        color: getMarketCapColor(convertedValues.marketCap)
                      }}
                    >
                      {currencySymbols[activeFiatCurrency]}
                      {formatValue(convertedValues.marketCap)}
                    </span>
                  </StyledCell>
                );
                break;
              case 'tvl':
                columnElements.push(
                  <StyledCell key="tvl" align="right" isDark={darkMode} style={extraStyle}>
                    {currencySymbols[activeFiatCurrency]}
                    {formatValue(convertedValues.tvl)}
                  </StyledCell>
                );
                break;
              case 'holders':
                columnElements.push(
                  <StyledCell key="holders" align="right" isDark={darkMode} style={extraStyle}>
                    {formatValue(holders, 'int')}
                  </StyledCell>
                );
                break;
              case 'trades':
                columnElements.push(
                  <StyledCell key="trades" align="right" isDark={darkMode} style={extraStyle}>
                    {formatValue(vol24htx, 'int')}
                  </StyledCell>
                );
                break;
              case 'created':
                columnElements.push(
                  <StyledCell key="created" align="right" isDark={darkMode} style={extraStyle}>
                    <span
                      className={cn('text-[11px]', darkMode ? 'text-white/70' : 'text-black/70')}
                    >
                      {formatTimeAgo(dateon, date)}
                    </span>
                  </StyledCell>
                );
                break;
              case 'supply':
                columnElements.push(
                  <StyledCell key="supply" align="right" isDark={darkMode} style={extraStyle}>
                    {formatValue(amount, 'int')}
                  </StyledCell>
                );
                break;
              case 'origin':
                columnElements.push(
                  <StyledCell key="origin" align="right" isDark={darkMode} style={{ ...extraStyle, paddingLeft: 12, paddingRight: 16 }}>
                    {origin || 'XRPL'}
                  </StyledCell>
                );
                break;
              case 'sparkline':
                columnElements.push(
                  <StyledCell key="sparkline" align="right" isDark={darkMode}>
                    {sparklineUrl ? (
                      <SparklineChart key={sparklineUrl} url={sparklineUrl} darkMode={darkMode} />
                    ) : (
                      <span
                        className={darkMode ? 'text-white/50' : 'text-black/50'}
                      >
                        -
                      </span>
                    )}
                  </StyledCell>
                );
                break;
            }
          });

          return (
            <>
              {tokenCell}
              {columnElements}
            </>
          );
        }
      // Fall through to classic when customColumns is empty

      case 'classic':
      default:
        return (
          <>
            {tokenCell}
            {priceCell}
            {/* Trendline after price */}
            <td className="py-[14px] px-1 w-[128px] max-w-[128px]">
              {sparklineUrl ? (
                <SparklineChart key={sparklineUrl} url={sparklineUrl} darkMode={darkMode} />
              ) : (
                <div
                  className={cn(
                    'w-[120px] h-[32px] rounded',
                    darkMode ? 'bg-white/[0.03]' : 'bg-black/[0.02]'
                  )}
                />
              )}
            </td>
            <StyledCell align="right" isDark={darkMode}>
              <PercentText color={getPercentColor(pro5m)}>
                {pro5m !== undefined && pro5m !== null && !isNaN(pro5m)
                  ? `${pro5m.toFixed(2)}%`
                  : '0.00%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              <PercentText color={getPercentColor(pro1h)}>
                {pro1h !== undefined && pro1h !== null && !isNaN(pro1h)
                  ? `${pro1h.toFixed(2)}%`
                  : '0.00%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              <PercentText color={getPercentColor(pro24h)}>
                {pro24h !== undefined && pro24h !== null && !isNaN(pro24h)
                  ? `${pro24h > 0 ? '+' : ''}${pro24h.toFixed(1)}%`
                  : '0.0%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              <PercentText color={getPercentColor(pro7d)}>
                {pro7d !== undefined && pro7d !== null && !isNaN(pro7d)
                  ? `${pro7d.toFixed(2)}%`
                  : '0.00%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              {currencySymbols[activeFiatCurrency]}
              {formatValue(convertedValues.volume)}
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              <span
                className={cn('text-[13px]', darkMode ? 'text-white/60' : 'text-black/60')}
              >
                {formatTimeAgo(dateon, date)}
              </span>
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              {formatValue(vol24htx, 'int')}
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              {currencySymbols[activeFiatCurrency]}
              {formatValue(convertedValues.tvl)}
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              <span style={{ fontWeight: '400', color: getMarketCapColor() }}>
                {currencySymbols[activeFiatCurrency]}
                {formatValue(convertedValues.marketCap)}
              </span>
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              {formatValue(holders, 'int')}
            </StyledCell>
            <StyledCell align="right" isDark={darkMode} style={{ paddingLeft: 12, paddingRight: 16 }}>
              {origin || 'XRPL'}
            </StyledCell>
          </>
        );
    }
  };

  return (
    <StyledRow onClick={handleRowClick} isDark={darkMode} isNew={isNew}>
      <StyledCell
        align="center"
        isDark={darkMode}
        style={{
          width: '40px',
          minWidth: '40px',
          maxWidth: '40px'
        }}
      >
        {isLoggedIn && (
          <button
            onClick={handleWatchlistClick}
            aria-label={watchList.includes(md5) ? 'Remove from watchlist' : 'Add to watchlist'}
            className={cn(
              'cursor-pointer inline-flex justify-center w-full transition-colors duration-150 bg-transparent border-none p-0 outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] rounded',
              watchList.includes(md5)
                ? 'text-[#F59E0B]'
                : darkMode
                  ? 'text-white/25'
                  : 'text-black/20'
            )}
          >
            <Bookmark size={16} fill={watchList.includes(md5) ? 'currentColor' : 'none'} />
          </button>
        )}
      </StyledCell>

      <StyledCell
        className="tr-idx"
        align="center"
        isDark={darkMode}
        style={{
          width: '50px',
          minWidth: '50px',
          maxWidth: '50px'
        }}
      >
        <span
          className={cn(
            'font-normal text-[13px] font-mono',
            darkMode ? 'text-white/50' : 'text-black/50'
          )}
        >
          {idx + 1}
        </span>
      </StyledCell>

      {renderColumns()}
    </StyledRow>
  );
};

const FTokenRow = memo(
  function FTokenRow({
    time,
    token,
    setEditToken,
    watchList,
    onChangeWatchList,
    scrollLeft,
    exchRate,
    idx,
    darkMode,
    isMobile,
    activeFiatCurrency,
    isLoggedIn,
    viewMode = 'classic',
    customColumns = [],
    rows = 50,
    noImageCache = false
  }) {
    const BASE_URL = 'https://api.xrpl.to/v1';
    const { accountProfile } = useContext(WalletContext);
    const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;

    const [imgError, setImgError] = useState(false);

    const {
      id,
      name,
      date,
      amount,
      vol24hxrp,
      vol24htx,
      md5,
      slug,
      user,
      pro7d,
      pro24h,
      pro1h,
      pro5m,
      exch,
      marketcap,
      isOMCF,
      tvl,
      origin,
      holders,
      dateon,
      isNew
    } = token;

    const handleWatchlistClick = useCallback(
      (e) => {
        e.stopPropagation();
        onChangeWatchList(md5);
      },
      [md5, onChangeWatchList]
    );

    const handleRowClick = useCallback(() => {
      addTokenToTabs({ md5, slug, name, user });
      window.location.href = `/token/${slug}`;
    }, [md5, slug, name, user]);

    const convertedValues = useMemo(
      () => ({
        marketCap: marketcap && exchRate ? new Decimal(marketcap || 0).div(exchRate).toNumber() : 0,
        volume: vol24hxrp && exchRate ? new Decimal(vol24hxrp || 0).div(exchRate).toNumber() : 0,
        tvl: tvl && exchRate ? new Decimal(tvl || 0).div(exchRate).toNumber() : 0
      }),
      [marketcap, vol24hxrp, tvl, exchRate]
    );

    const formatValue = useCallback((val, type = 'number') => {
      if (val === undefined || val === null || isNaN(val)) return '0';
      if (val >= 1e12) return `${(val / 1e12).toFixed(1)}T`;
      if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
      if (val >= 999500) return `${(val / 1e6).toFixed(1)}M`;
      if (val >= 999.5) return `${(val / 1e3).toFixed(1)}K`;
      return type === 'int' ? formatInt(val) : formatNumber(val);
    }, []);

    const sparklineUrl = useMemo(() => {
      if (!BASE_URL || !md5 || isMobile) return null;
      const vsCurrency = activeFiatCurrency === 'XRP' ? 'XRP' : 'USD';
      return `${BASE_URL}/sparkline/${md5}?period=24h&lightweight=true&maxPoints=50&vs_currency=${vsCurrency}`;
    }, [BASE_URL, md5, isMobile, activeFiatCurrency]);

    if (isMobile) {
      return (
        <MobileTokenRow
          token={token}
          darkMode={darkMode}
          exchRate={exchRate}
          activeFiatCurrency={activeFiatCurrency}
          handleRowClick={handleRowClick}
          imgError={imgError}
          setImgError={setImgError}
          viewMode={viewMode}
          customColumns={customColumns}
          noImageCache={noImageCache}
        />
      );
    }

    return (
      <DesktopTokenRow
        token={token}
        darkMode={darkMode}
        exchRate={exchRate}
        activeFiatCurrency={activeFiatCurrency}
        handleRowClick={handleRowClick}
        handleWatchlistClick={handleWatchlistClick}
        watchList={watchList}
        idx={idx}
        imgError={imgError}
        setImgError={setImgError}
        sparklineUrl={sparklineUrl}
        convertedValues={convertedValues}
        formatValue={formatValue}
        isLoggedIn={isLoggedIn}
        viewMode={viewMode}
        customColumns={customColumns}
        noImageCache={noImageCache}
      />
    );
  },
  (prevProps, nextProps) => {
    const prev = prevProps.token;
    const next = nextProps.token;

    // Only re-render if critical data changes - optimized checks
    return (
      prev.exch === next.exch &&
      prev.pro24h === next.pro24h &&
      prev.pro5m === next.pro5m &&
      prev.pro1h === next.pro1h &&
      prev.pro7d === next.pro7d &&
      prev.bearbullTime === next.bearbullTime &&
      prev.vol24hxrp === next.vol24hxrp &&
      prev.marketcap === next.marketcap &&
      prev.tvl === next.tvl &&
      prevProps.exchRate === nextProps.exchRate &&
      prevProps.isLoggedIn === nextProps.isLoggedIn &&
      prevProps.darkMode === nextProps.darkMode &&
      prevProps.isMobile === nextProps.isMobile &&
      prevProps.viewMode === nextProps.viewMode &&
      prevProps.rows === nextProps.rows &&
      prevProps.activeFiatCurrency === nextProps.activeFiatCurrency &&
      // Watchlist check
      (prevProps.watchList === nextProps.watchList ||
        prevProps.watchList.includes(prev.md5) === nextProps.watchList.includes(next.md5))
    );
  }
);

// Mobile list components for header and container
export const MobileTokenList = ({
  tokens,
  darkMode,
  exchRate,
  activeFiatCurrency,
  order,
  orderBy,
  onRequestSort,
  rows = 50
}) => {
  const handleSort = (field) => {
    onRequestSort(null, field);
  };

  return (
    <>
      {tokens.map((token, idx) => (
        <FTokenRow
          key={token.md5}
          time={token.time}
          idx={idx}
          token={token}
          watchList={[]}
          onChangeWatchList={() => {}}
          scrollLeft={false}
          exchRate={exchRate}
          isMobile={true}
          activeFiatCurrency={activeFiatCurrency}
          isLoggedIn={false}
          rows={rows}
        />
      ))}
    </>
  );
};

export const MobileContainer = ({ className, children, ...p }) => (
  <div className={cn('w-full flex flex-col bg-transparent p-0 m-0', className)} {...p}>
    {children}
  </div>
);

export const MobileHeader = ({ className, children, isDark, ...p }) => (
  <div
    className={cn(
      'flex w-full text-xs font-normal sticky top-0 z-10 box-border',
      'py-2 px-2.5 backdrop-blur-[16px] border-b tracking-[0.01em]',
      isDark ? 'bg-black/50 border-white/10 text-white/50' : 'bg-white/80 border-black/[0.06] text-black/50',
      className
    )}
    {...p}
  >
    {children}
  </div>
);

export const HeaderCell = ({ className, children, isDark, flex, align, sortable, ...p }) => (
  <div
    role={sortable ? 'button' : undefined}
    tabIndex={sortable ? 0 : undefined}
    className={cn(
      'transition-colors duration-150 px-[6px]',
      sortable ? 'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] rounded' : 'cursor-default',
      className
    )}
    style={{
      flex: flex || 1,
      textAlign: align || 'left'
    }}
    onMouseEnter={(e) => {
      if (sortable) e.currentTarget.style.color = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
    }}
    onMouseLeave={(e) => {
      if (sortable) e.currentTarget.style.color = '';
    }}
    {...p}
  >
    {children}
  </div>
);

export const TokenRow = FTokenRow;
