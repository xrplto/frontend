import Decimal from 'decimal.js-light';
import { useState, useEffect, useContext, memo, useMemo, useCallback, useRef } from 'react';
import React from 'react';
import styled from '@emotion/styled';
import Image from 'next/image';
import axios from 'axios';

import { AppContext } from 'src/AppContext';
import { addTokenToTabs } from 'src/hooks/useTokenTabs';

// Constants
const currencySymbols = {
  USD: '$',
  EUR: '€',
  JPY: '¥',
  CNH: '¥',
  XRP: ''
};

// Simple cache for sparkline data
const sparklineCache = new Map();

// Inline Sparkline - SVG based
const SparklineChart = memo(({ url }) => {
  const [path, setPath] = useState('');
  const [color, setColor] = useState('#22c55e');
  const containerRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { rootMargin: '50px' });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !url) return;
    const cached = sparklineCache.get(url);
    if (cached && Date.now() - cached.ts < 300000) {
      setPath(cached.path);
      setColor(cached.color);
      return;
    }
    axios.get(url).then(res => {
      const prices = res.data?.data?.prices?.map(Number) || [];
      if (prices.length < 2) return;
      const w = 260, h = 44;
      const min = Math.min(...prices), max = Math.max(...prices), range = max - min || 1;
      const pts = prices.map((p, i) => [i / (prices.length - 1) * w, h - ((p - min) / range) * h]);
      const d = 'M' + pts.map(p => p.join(',')).join('L');
      const c = prices[prices.length - 1] >= prices[0] ? '#22c55e' : '#ef4444';
      sparklineCache.set(url, { path: d, color: c, ts: Date.now() });
      setPath(d);
      setColor(c);
    }).catch(() => {});
  }, [visible, url]);

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      {path ? (
        <svg width="100%" height="44" viewBox="0 0 260 44" preserveAspectRatio="none" style={{ display: 'block' }}>
          <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <div style={{ width: '100%', height: 44, background: 'rgba(128,128,128,0.05)', borderRadius: 4 }} />
      )}
    </div>
  );
}, (prev, next) => prev.url === next.url);

SparklineChart.displayName = 'SparklineChart';

const StyledRow = styled.tr`
  border-bottom: 1px solid ${(props) => props.isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.1)'};
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: ${(props) => props.isDark ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.03)'};
  }
`;

const StyledCell = styled.td`
  padding: 12px 8px;
  white-space: ${(props) => (props.isTokenColumn ? 'normal' : 'nowrap')};
  text-align: ${(props) => props.align || 'left'};
  font-size: 13px;
  font-weight: ${(props) => props.fontWeight || 400};
  color: ${(props) => props.color || (props.isDark ? 'rgba(255, 255, 255, 0.9)' : '#000000')};
  vertical-align: middle;
  width: ${(props) => props.width || 'auto'};
  min-width: ${(props) => (props.isTokenColumn ? '200px' : 'auto')};
  letter-spacing: 0.01em;

  &:first-of-type {
    padding-left: 12px;
  }

  &:last-of-type {
    padding-right: 4px;
  }
`;

// Mobile-specific flexbox components
const MobileTokenCard = styled.div`
  display: flex;
  width: 100%;
  padding: 10px 12px;
  border-bottom: 1px solid ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0,0,0,0.04)'};
  cursor: pointer;
  box-sizing: border-box;
  align-items: center;

  &:hover {
    background: ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'};
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
  color: ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.9)' : '#000000'};
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
  width: ${(props) => (props.isMobile ? '28px' : '36px')};
  height: ${(props) => (props.isMobile ? '28px' : '36px')};
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'};
`;

const TokenDetails = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TokenName = styled.span`
  font-weight: 600;
  font-size: ${(props) => (props.isMobile ? '13px' : '14px')};
  color: ${(props) => props.isDark ? '#FFFFFF' : '#000000'};
  max-width: ${(props) => (props.isMobile ? '120px' : '160px')};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  line-height: 1.3;
  letter-spacing: 0.01em;
`;

const UserName = styled.span`
  font-size: ${(props) => (props.isMobile ? '11px' : '12px')};
  color: ${(props) => props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'};
  opacity: 1;
  font-weight: 400;
  display: block;
  max-width: ${(props) => (props.isMobile ? '120px' : '160px')};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
`;

const PriceText = ({ flashColor, isDark, isMobile, children }) => (
  <span
    style={{
      fontWeight: 500,
      fontSize: isMobile ? '13px' : '14px',
      color: flashColor || (isDark ? 'rgba(255, 255, 255, 0.9)' : '#000000'),
      transition: 'color 1s ease-out',
      letterSpacing: '0.01em'
    }}
  >
    {children}
  </span>
);

const PercentText = styled.span`
  font-weight: 500;
  color: ${(props) => props.color};
  font-size: ${(props) => (props.isMobile ? '13px' : '14px')};
  letter-spacing: 0.01em;
`;

const truncate = (str, n) => {
  if (!str) return '';
  return str.length > n ? str.substr(0, n - 1) + '...' : str;
};

// Simple price formatter without rounding issues
const formatPrice = (price) => {
  if (!price || isNaN(price)) return '0';

  // Handle very small prices with compact notation
  if (price < 0.0001) {
    const str = price.toFixed(15);
    const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
    if (zeros >= 4) {
      const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
      return `0.0(${zeros})${significant.slice(0, 4)}`;
    }
    return price.toFixed(8);
  }

  // Regular prices
  if (price < 1) return price.toFixed(4);
  if (price < 100) return price.toFixed(4).replace(/\.?0+$/, '').replace(/(\.\d)$/, '$10');
  if (price < 1000) return price.toFixed(2);
  if (price < 1000000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
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
    date
  } = token;

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
      return darkMode ? '#22c55e' : '#16a34a';
    return value < 0
      ? '#ef4444'
      : '#22c55e';
  };

  const getMarketCapColor = (mcap) => {
    if (!mcap || isNaN(mcap)) return darkMode ? 'rgba(255,255,255,0.9)' : '#000000';
    if (mcap >= 5e6) return '#22c55e';
    if (mcap >= 1e6) return '#22c55e';
    if (mcap >= 1e5) return '#3b82f6';
    if (mcap >= 1e4) return '#eab308';
    if (mcap >= 1e3) return '#f97316';
    return '#ef4444';
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
        return currencySymbols[activeFiatCurrency] + formatPrice(price);
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
    <MobileTokenCard onClick={handleRowClick} isDark={darkMode}>
      <MobileTokenInfo>
        <TokenImage isMobile={true} isDark={darkMode}>
          <OptimizedImage
            src={imgError ? '/static/alt.webp' : imgUrl}
            alt={name || 'Token'}
            size={28}
            onError={() => setImgError(true)}
            priority={false}
            md5={md5}
          />
        </TokenImage>
        <TokenDetails>
          <TokenName isMobile={true} isDark={darkMode}>{name}</TokenName>
          <UserName isMobile={true} isDark={darkMode}>{user}</UserName>
        </TokenDetails>
      </MobileTokenInfo>

      <MobilePriceCell isDark={darkMode}>{formatMobileValue(mobilePriceColumn)}</MobilePriceCell>

      <MobilePercentCell isDark={darkMode}>{formatMobileValue(mobilePercentColumn)}</MobilePercentCell>
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
    origin
  } = token;

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
      return darkMode ? '#22c55e' : '#16a34a';
    return value < 0
      ? '#ef4444'
      : '#22c55e';
  };

  const getMarketCapColor = (mcap) => {
    if (!mcap || isNaN(mcap)) return darkMode ? 'rgba(255,255,255,0.9)' : '#000000';
    if (mcap >= 5e6) return '#22c55e';
    if (mcap >= 1e6) return '#22c55e';
    if (mcap >= 1e5) return '#3b82f6';
    if (mcap >= 1e4) return '#eab308';
    if (mcap >= 1e3) return '#f97316';
    return '#ef4444';
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
          width: '220px',
          minWidth: '220px',
          maxWidth: '220px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <TokenImage isDark={darkMode}>
            <OptimizedImage
              src={imgError ? '/static/alt.webp' : imgUrl}
              alt={name || 'Token'}
              size={36}
              onError={() => setImgError(true)}
              priority={false}
              md5={md5}
            />
          </TokenImage>
          <div style={{ minWidth: 0, flex: 1 }}>
            <TokenName isDark={darkMode} title={name}>{truncate(name, 18)}</TokenName>
            <UserName isDark={darkMode} title={user}>{truncate(user, 12)}</UserName>
          </div>
        </div>
      </StyledCell>
    );

    const priceCell = (() => {
      const rawPrice = activeFiatCurrency === 'XRP' ? exch : exch / exchRate;
      if (rawPrice && rawPrice < 0.01) {
        const str = rawPrice.toFixed(15);
        const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
        if (zeros >= 4) {
          const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
          return (
            <StyledCell align="right" isDark={darkMode}>
              <PriceText flashColor={flashColor} isDark={darkMode}>
                <span>
                  {currencySymbols[activeFiatCurrency]}0.0
                  <sub style={{ fontSize: '0.6em' }}>{zeros}</sub>
                  {significant.slice(0, 4)}
                </span>
              </PriceText>
            </StyledCell>
          );
        }
      }
      const formattedPrice = activeFiatCurrency === 'XRP' ? exch : exch / exchRate;
      return (
        <StyledCell align="right" isDark={darkMode}>
          <PriceText flashColor={flashColor} isDark={darkMode}>
            {currencySymbols[activeFiatCurrency]}{formatPrice(formattedPrice)}
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
              <PercentText color={getPercentColor(pro24h * 30)}>
                {pro24h !== undefined && pro24h !== null && !isNaN(pro24h)
                  ? `${(pro24h * 30).toFixed(0)}%`
                  : '0%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              {currencySymbols[activeFiatCurrency]}
              {formatValue(convertedValues.volume)}
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              {currencySymbols[activeFiatCurrency]}
              {formatValue(convertedValues.volume * 7)}
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              {sparklineUrl ? (
                <SparklineChart url={sparklineUrl} darkMode={darkMode} />
              ) : (
                <span style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>-</span>
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
              <span style={{ fontWeight: '400', color: getMarketCapColor(convertedValues.marketCap) }}>
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
              {sparklineUrl ? (
                <SparklineChart url={sparklineUrl} darkMode={darkMode} />
              ) : (
                <span style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>-</span>
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
              {formatValue(vol24htx, 'int')}
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              {currencySymbols[activeFiatCurrency]}
              {formatValue(convertedValues.volume)}
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
              {formatValue(convertedValues.tvl)}
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              <span style={{ fontSize: '11px', color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                {formatTimeAgo(dateon, date)}
              </span>
            </StyledCell>
            <StyledCell align="right" isDark={darkMode}>
              {sparklineUrl ? (
                <SparklineChart url={sparklineUrl} darkMode={darkMode} />
              ) : (
                <span style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>-</span>
              )}
            </StyledCell>
          </>
        );

      case 'custom':
        // If customColumns is empty or undefined, show default columns
        if (!customColumns || customColumns.length === 0) {
          return (
            <>
              {tokenCell}
              {priceCell}
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
                <span style={{ fontWeight: '400', color: getMarketCapColor(convertedValues.marketCap) }}>
                  {currencySymbols[activeFiatCurrency]}
                  {formatValue(convertedValues.marketCap)}
                </span>
              </StyledCell>
              <StyledCell align="right" isDark={darkMode}>
                {sparklineUrl ? (
                  <SparklineChart url={sparklineUrl} darkMode={darkMode} />
                ) : (
                  <span style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>-</span>
                )}
              </StyledCell>
            </>
          );
        }

        // Render custom columns with last column padding
        const columnElements = [];
        const lastColumnIndex = customColumns.length - 1;

        customColumns.forEach((column, index) => {
          const isLastColumn = index === lastColumnIndex;
          const extraStyle = {};

          switch (column) {
            case 'price':
              const customPrice = activeFiatCurrency === 'XRP' ? exch : exch / exchRate;
              columnElements.push(
                <StyledCell key="price" align="right" isDark={darkMode} style={extraStyle}>
                  <PriceText flashColor={flashColor} isDark={darkMode}>
                    {currencySymbols[activeFiatCurrency]}{formatPrice(customPrice)}
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
                  <span style={{ fontWeight: '400', color: getMarketCapColor(convertedValues.marketCap) }}>
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
                  <span style={{ fontSize: '11px', color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
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
                    <SparklineChart url={sparklineUrl} darkMode={darkMode} />
                  ) : (
                    <span style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>-</span>
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

      case 'classic':
      default:
        return (
          <>
            {tokenCell}
            {priceCell}
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
              <span style={{ fontSize: '11px', color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
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
              <span style={{ fontWeight: '400', color: getMarketCapColor(convertedValues.marketCap) }}>
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
            <StyledCell align="right" isDark={darkMode}>
              {sparklineUrl ? (
                <SparklineChart url={sparklineUrl} darkMode={darkMode} />
              ) : (
                <span style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>-</span>
              )}
            </StyledCell>
          </>
        );
    }
  };

  return (
    <StyledRow onClick={handleRowClick} isDark={darkMode}>
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
              fontSize: '18px',
              color: watchList.includes(md5) ? '#FFB800' : (darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'),
              display: 'inline-block',
              width: '100%'
            }}
          >
            {watchList.includes(md5) ? '★' : '☆'}
          </span>
        </StyledCell>
      )}

      <StyledCell
        align="center"
        isDark={darkMode}
        style={{
          width: '40px',
          minWidth: '40px',
          maxWidth: '40px'
        }}
      >
        <span style={{ fontWeight: '400', color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>{idx + 1}</span>
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
    const BASE_URL = 'https://api.xrpl.to/api';
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
      dateon
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
      // Use 30 second cache for /new page, 10 minutes for others
      const isNewPage = window.location.pathname === '/new';
      const cacheMs = isNewPage ? 30000 : 600000; // 30s or 10min
      const cacheTime = Math.floor(Date.now() / cacheMs);
      return `${BASE_URL}/sparkline/${md5}?period=24h&lightweight=true&maxPoints=50&cache=${cacheTime}`;
    }, [BASE_URL, md5, isMobile]);

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
      // Watchlist check
      (prevProps.watchList === nextProps.watchList ||
        (prevProps.watchList.includes(prev.md5) === nextProps.watchList.includes(next.md5)))
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
  padding: 10px 12px;
  background: ${(props) => props.isDark ? 'rgba(7, 11, 18, 0.98)' : 'rgba(255, 255, 255, 0.98)'};
  backdrop-filter: blur(12px);
  border-bottom: 1.5px solid ${(props) => props.isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.2)'};
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${(props) => props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)'};
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
    color: ${(props) => props.sortable && (props.isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)')};
  }
`;

export const TokenRow = FTokenRow;
