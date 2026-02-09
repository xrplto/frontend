import Decimal from 'decimal.js-light';
import { useState, useEffect, useContext, memo, useMemo, useCallback, useRef } from 'react';
import React from 'react';
import styled from '@emotion/styled';
import Image from 'next/image';
import { Bookmark } from 'lucide-react';
import api from 'src/utils/api';

import { AppContext } from 'src/context/AppContext';
import { addTokenToTabs } from 'src/hooks/useTokenTabs';

// Constants
const currencySymbols = {
  USD: '$',
  EUR: '€',
  JPY: '¥',
  CNH: '¥',
  XRP: ''
};

// Inline Sparkline - SVG based with filled area like Orb design
const SparklineChart = memo(
  ({ url }) => {
    const [linePath, setLinePath] = useState('');
    const [areaPath, setAreaPath] = useState('');
    const [color, setColor] = useState('#22c55e');
    const containerRef = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
      if (!containerRef.current) return;
      const el = containerRef.current;
      const obs = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        },
        { rootMargin: '100px' }
      );
      obs.observe(el);
      return () => obs.disconnect();
    }, []);

    useEffect(() => {
      if (!visible || !url) return;
      let cancelled = false;
      api
        .get(url)
        .then((res) => {
          if (cancelled) return;
          const prices = res.data?.data?.prices?.map(Number) || [];
          if (prices.length < 2) return;
          const w = 120,
            h = 32;
          const min = Math.min(...prices),
            max = Math.max(...prices),
            range = max - min || 1;
          const pts = prices.map((p, i) => [
            (i / (prices.length - 1)) * w,
            h - ((p - min) / range) * (h - 4) - 2
          ]);
          const line = 'M' + pts.map((p) => p.join(',')).join('L');
          const area = line + `L${w},${h}L0,${h}Z`;
          const c = prices[prices.length - 1] >= prices[0] ? '#22c55e' : '#ef4444';
          setLinePath(line);
          setAreaPath(area);
          setColor(c);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, [visible, url]);

    const fillColor = color === '#22c55e' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';

    return (
      <div ref={containerRef} style={{ width: 120, height: 32 }}>
        {linePath ? (
          <svg
            width="120"
            height="32"
            viewBox="0 0 120 32"
            preserveAspectRatio="none"
            style={{ display: 'block' }}
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
          <div
            style={{
              width: 120,
              height: 32,
              background: 'rgba(128,128,128,0.04)',
              borderRadius: 4
            }}
          />
        )}
      </div>
    );
  },
  (prev, next) => prev.url === next.url
);

SparklineChart.displayName = 'SparklineChart';

const StyledRow = styled.tr`
  border-bottom: 1px solid
    ${(props) => (props.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)')};
  cursor: pointer;
  transition: background 0.15s ease;
  ${(props) =>
    props.isNew &&
    `
    background: ${props.isDark ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.06)'};
  `}

  &:hover {
    background: ${(props) => (props.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)')};
  }
`;

const StyledCell = styled.td`
  padding: 14px 4px;
  white-space: ${(props) => (props.isTokenColumn ? 'normal' : 'nowrap')};
  text-align: ${(props) => props.align || 'left'};
  font-size: 14px;
  font-weight: ${(props) => props.fontWeight || 400};
  color: ${(props) => props.color || (props.isDark ? 'rgba(255, 255, 255, 0.9)' : '#1a1a1a')};
  vertical-align: middle;

  &:first-of-type {
    padding-left: 12px;
  }

  &:last-of-type {
    padding-right: 12px;
  }
`;

// Mobile-specific flexbox components
const MobileTokenCard = styled.div`
  display: flex;
  width: 100%;
  padding: 10px 12px;
  border-bottom: 1.5px solid
    ${(props) => (props.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)')};
  cursor: pointer;
  box-sizing: border-box;
  align-items: center;
  transition: all 0.15s ease;
  background: transparent;
  ${(props) =>
    props.isNew &&
    `
    background: ${props.isDark ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.06)'};
    border-left: 2px solid #22c55e;
  `}

  &:hover {
    background: ${(props) => (props.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)')};
  }
`;

const MobileTokenInfo = styled.div`
  flex: 2;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 4px;
  min-width: 0;
`;

const MobilePriceCell = styled.div`
  flex: 1.2;
  text-align: right;
  padding: 0 6px;
  font-weight: 500;
  font-size: 13px;
  color: ${(props) => (props.isDark ? 'rgba(255, 255, 255, 0.9)' : '#000000')};
  min-width: 0;
  letter-spacing: 0.01em;
`;

const MobilePercentCell = styled.div`
  flex: 0.8;
  text-align: right;
  padding: 0 6px;
  font-weight: 500;
  font-size: 13px;
  min-width: 0;
  letter-spacing: 0.01em;
`;

// Shared components with mobile/desktop variations
const TokenImage = styled.div`
  width: ${(props) => (props.isMobile ? '32px' : '40px')};
  height: ${(props) => (props.isMobile ? '32px' : '40px')};
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: ${(props) => (props.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)')};
`;

const TokenDetails = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TokenName = styled.span`
  font-weight: 500;
  font-size: ${(props) => (props.isMobile ? '14px' : '15px')};
  color: ${(props) => (props.isDark ? '#FFFFFF' : '#1a1a1a')};
  max-width: ${(props) => (props.isMobile ? '120px' : '180px')};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  line-height: 1.4;
`;

const UserName = styled.span`
  font-size: ${(props) => (props.isMobile ? '12px' : '13px')};
  color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)')};
  font-weight: 400;
  display: block;
  max-width: ${(props) => (props.isMobile ? '120px' : '180px')};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
`;

const PriceText = ({ flashColor, isDark, isMobile, children }) => (
  <span
    style={{
      fontWeight: 400,
      fontSize: isMobile ? '14px' : '15px',
      color: flashColor || (isDark ? 'rgba(255, 255, 255, 0.9)' : '#1a1a1a'),
      transition: 'color 0.8s ease-out',
      fontFamily: 'var(--font-mono)'
    }}
  >
    {children}
  </span>
);

const PercentText = styled.span`
  font-weight: 400;
  color: ${(props) => props.color};
  font-size: ${(props) => (props.isMobile ? '14px' : '14px')};
  font-family: var(--font-mono);
`;

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
        {symbol}0.0<sub style={{ fontSize: '0.6em' }}>{formatted.zeros}</sub>
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

// Optimized image component with intersection observer for lazy loading
const OptimizedImage = memo(
  ({ src, alt, size, onError, priority = false, md5 }) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [isInView, setIsInView] = useState(priority || typeof window === 'undefined');
    const imgRef = useRef(null);
    const observerRef = useRef(null);

    useEffect(() => {
      if (priority || !imgRef.current) return;

      // Delay observer creation to reduce initial overhead
      const timer = setTimeout(() => {
        if (!imgRef.current) return;

        observerRef.current = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
              }
            }
          },
          {
            rootMargin: '100px', // Increased margin
            threshold: 0.01
          }
        );

        if (imgRef.current) {
          observerRef.current.observe(imgRef.current);
        }
      }, 20);

      return () => {
        clearTimeout(timer);
        if (observerRef.current) {
          observerRef.current.disconnect();
          observerRef.current = null;
        }
      };
    }, [priority]);

    const handleError = useCallback(() => {
      setImgSrc('/static/alt.webp');
      if (onError) onError();
    }, [onError]);

    // Show placeholder until in view
    if (!isInView) {
      return (
        <div
          ref={imgRef}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: 'rgba(128, 128, 128, 0.1)',
            willChange: 'auto'
          }}
        />
      );
    }

    return (
      <div
        ref={imgRef}
        style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden' }}
      >
        <Image
          src={imgSrc}
          alt={alt}
          width={size}
          height={size}
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          unoptimized={true}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.src === nextProps.src &&
      prevProps.size === nextProps.size &&
      prevProps.md5 === nextProps.md5
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
  customColumns = []
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
            alt={name || 'Token'}
            size={32}
            onError={() => setImgError(true)}
            priority={false}
            md5={md5}
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
  customColumns = []
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TokenImage isDark={darkMode}>
            <OptimizedImage
              src={imgError ? '/static/alt.webp' : imgUrl}
              alt={name || 'Token'}
              size={40}
              onError={() => setImgError(true)}
              priority={false}
              md5={md5}
            />
          </TokenImage>
          <div style={{ minWidth: 0 }}>
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
                <sub style={{ fontSize: '0.6em' }}>{formatted.zeros}</sub>
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
                <span style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
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
            <StyledCell align="right" isDark={darkMode}>
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
                <span style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
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
                <span style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
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
                          <sub style={{ fontSize: '0.6em' }}>{customFormatted.zeros}</sub>
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
                      style={{
                        fontSize: '11px',
                        color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'
                      }}
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
                  <StyledCell key="origin" align="right" isDark={darkMode} style={extraStyle}>
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
                        style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
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
            <td style={{ padding: '14px 4px', width: 128, maxWidth: 128 }}>
              {sparklineUrl ? (
                <SparklineChart key={sparklineUrl} url={sparklineUrl} darkMode={darkMode} />
              ) : (
                <div
                  style={{
                    width: 120,
                    height: 32,
                    background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    borderRadius: 4
                  }}
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
                style={{
                  fontSize: '13px',
                  color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'
                }}
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
            <StyledCell align="right" isDark={darkMode}>
              {origin || 'XRPL'}
            </StyledCell>
          </>
        );
    }
  };

  return (
    <StyledRow onClick={handleRowClick} isDark={darkMode} isNew={isNew}>
      {isLoggedIn && (
        <StyledCell
          align="center"
          isDark={darkMode}
          style={{
            width: '40px',
            minWidth: '40px',
            maxWidth: '40px'
          }}
        >
          <span
            onClick={handleWatchlistClick}
            style={{
              cursor: 'pointer',
              color: watchList.includes(md5)
                ? '#F59E0B'
                : darkMode
                  ? 'rgba(255,255,255,0.25)'
                  : 'rgba(0,0,0,0.2)',
              display: 'inline-flex',
              justifyContent: 'center',
              width: '100%',
              transition: 'color 0.15s ease'
            }}
          >
            <Bookmark size={16} fill={watchList.includes(md5) ? 'currentColor' : 'none'} />
          </span>
        </StyledCell>
      )}

      <StyledCell
        align="center"
        isDark={darkMode}
        style={{
          width: '50px',
          minWidth: '50px',
          maxWidth: '50px'
        }}
      >
        <span
          style={{
            fontWeight: '400',
            fontSize: '13px',
            color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
            fontFamily: 'var(--font-mono)'
          }}
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
    rows = 50
  }) {
    const BASE_URL = 'https://api.xrpl.to/v1';
    const { accountProfile } = useContext(AppContext);
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

    const formatValue = (val, type = 'number') => {
      if (val === undefined || val === null || isNaN(val)) return '0';
      if (val >= 1e12) return `${(val / 1e12).toFixed(1)}T`;
      if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
      if (val >= 999500) return `${(val / 1e6).toFixed(1)}M`;
      if (val >= 999.5) return `${(val / 1e3).toFixed(1)}K`;
      return type === 'int' ? formatInt(val) : formatNumber(val);
    };

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

export const MobileContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  margin: 0;
  background: transparent;
`;

export const MobileHeader = styled.div`
  display: flex;
  width: 100%;
  padding: 12px 16px;
  background: ${(props) => (props.isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.8)')};
  backdrop-filter: blur(16px);
  border-bottom: 1.5px solid
    ${(props) => (props.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)')};
  font-size: 12px;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0.01em;
  color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)')};
  position: sticky;
  top: 0;
  z-index: 10;
  box-sizing: border-box;
`;

export const HeaderCell = styled.div`
  flex: ${(props) => props.flex || 1};
  text-align: ${(props) => props.align || 'left'};
  padding: 0 6px;
  cursor: ${(props) => (props.sortable ? 'pointer' : 'default')};
  transition: color 0.15s ease;

  &:hover {
    color: ${(props) =>
      props.sortable && (props.isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)')};
  }
`;

export const TokenRow = FTokenRow;
