import Decimal from 'decimal.js-light';
import { useState, useEffect, useContext, memo, useMemo, useCallback, useRef } from 'react';
import React from 'react';
import styled from '@emotion/styled';
import Image from 'next/image';

import { AppContext } from 'src/AppContext';

// Constants
const currencySymbols = {
  USD: '$ ',
  EUR: '€ ',
  JPY: '¥ ',
  CNH: '¥ ',
  XRP: '✕ '
};
import Sparkline from 'src/components/Sparkline';

// Optimized chart wrapper with intersection observer
const OptimizedChart = memo(
  ({ url, darkMode }) => {
    const [isVisible, setIsVisible] = useState(typeof window === 'undefined');
    const chartRef = useRef(null);
    const observerRef = useRef(null);

    useEffect(() => {
      if (!chartRef.current) return;

      // Delay observer creation slightly to avoid initial render overhead
      const timer = setTimeout(() => {
        if (!chartRef.current) return;

        observerRef.current = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
              }
            }
          },
          {
            rootMargin: '200px', // Increased for earlier loading
            threshold: 0.01
          }
        );

        if (chartRef.current) {
          observerRef.current.observe(chartRef.current);
        }
      }, 50);

      return () => {
        clearTimeout(timer);
        if (observerRef.current) {
          observerRef.current.disconnect();
          observerRef.current = null;
        }
      };
    }, []);

    // Don't render chart until visible
    if (!isVisible) {
      return (
        <div
          ref={chartRef}
          style={{
            width: '260px',
            height: '60px',
            background: 'rgba(128, 128, 128, 0.05)',
            borderRadius: '4px',
            contain: 'layout size style'
          }}
        />
      );
    }

    return (
      <div
        ref={chartRef}
        style={{
          width: '260px',
          height: '60px',
          display: 'inline-block',
          contain: 'layout size style'
        }}
      >
        <Sparkline
          url={url}
          style={{ width: '100%', height: '100%' }}
          animation={false}
          showGradient={false}
          lineWidth={1}
          opts={{
            renderer: 'svg', // Use SVG to reduce memory usage
            width: 260,
            height: 60,
            devicePixelRatio: 1,
            animation: false
          }}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if URL changes
    return prevProps.url === nextProps.url && prevProps.darkMode === nextProps.darkMode;
  }
);

OptimizedChart.displayName = 'OptimizedChart';

const StyledRow = styled.tr`
  border-bottom: 1px solid ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
  cursor: pointer;

  &:hover {
    background: ${(props) => props.isDark ? 'rgba(66, 133, 244, 0.02)' : 'rgba(66, 133, 244, 0.015)'};
  }
`;

const StyledCell = styled.td`
  padding: 12px 10px;
  white-space: ${(props) => (props.isTokenColumn ? 'normal' : 'nowrap')};
  text-align: ${(props) => props.align || 'left'};
  font-size: 13px;
  font-weight: ${(props) => props.fontWeight || 400};
  color: ${(props) => props.color || (props.isDark ? '#FFFFFF' : '#000000')};
  vertical-align: middle;
  width: ${(props) => props.width || 'auto'};
  min-width: ${(props) => (props.isTokenColumn ? '250px' : 'auto')};
`;

// Mobile-specific flexbox components
const MobileTokenCard = styled.div`
  display: flex;
  width: 100%;
  padding: 10px 8px;
  border-bottom: 1px solid ${(props) => props.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'};
  cursor: pointer;
  box-sizing: border-box;
  align-items: center;

  &:hover {
    background: ${(props) => props.isDark ? 'rgba(66, 133, 244, 0.02)' : 'rgba(66, 133, 244, 0.015)'};
  }
`;

const MobileTokenInfo = styled.div`
  flex: 2;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 2px;
  min-width: 0;
`;

const MobilePriceCell = styled.div`
  flex: 1.2;
  text-align: right;
  padding: 0 2px;
  font-weight: 600;
  font-size: 11px;
  color: ${(props) => props.isDark ? '#FFFFFF' : '#000000'};
  min-width: 65px;
  word-break: break-all;
  line-height: 1.3;
`;

const MobilePercentCell = styled.div`
  flex: 0.7;
  text-align: right;
  padding: 0 2px;
  font-weight: 600;
  font-size: 11px;
  color: ${(props) => props.color};
  min-width: 45px;
`;

// Shared components with mobile/desktop variations
const TokenImage = styled.div`
  width: ${(props) => (props.isMobile ? '20px' : '28px')};
  height: ${(props) => (props.isMobile ? '20px' : '28px')};
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
`;

const TokenDetails = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const TokenName = styled.span`
  font-weight: 600;
  font-size: ${(props) => (props.isMobile ? '11px' : '13px')};
  color: ${(props) => props.isDark ? '#FFFFFF' : '#000000'};
  max-width: ${(props) => (props.isMobile ? '100px' : '150px')};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  line-height: 1.2;
`;

const UserName = styled.span`
  font-size: ${(props) => (props.isMobile ? '9px' : '10px')};
  color: ${(props) => props.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'};
  opacity: 1;
  font-weight: 400;
  display: block;
  max-width: ${(props) => (props.isMobile ? '100px' : '150px')};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
  margin-top: 0;
`;

const PriceText = styled.span`
  font-weight: 600;
  font-size: ${(props) => (props.isMobile ? '11px' : '14px')};
  color: ${(props) => props.priceColor || (props.isDark ? '#FFFFFF' : '#000000')};
`;

const PercentText = styled.span`
  font-weight: 600;
  color: ${(props) => props.color};
  font-size: ${(props) => (props.isMobile ? '11px' : '13px')};
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
  const [priceColor, setPriceColor] = useState('');

  const getPercentColor = (value) => {
    if (value === undefined || value === null || isNaN(value))
      return darkMode ? '#4CAF50' : '#2E7D32';
    return value < 0
      ? darkMode ? '#EF5350' : '#C62828'
      : darkMode ? '#4CAF50' : '#2E7D32';
  };

  const getMarketCapColor = (mcap) => {
    if (!mcap || isNaN(mcap)) return darkMode ? '#FFFFFF' : '#000000';
    // Elite: $5M+ (3% - dark green)
    if (mcap >= 5e6) return darkMode ? '#2E7D32' : '#1B5E20';
    // Established: $1M-$5M (8% - green)
    if (mcap >= 1e6) return darkMode ? '#4CAF50' : '#2E7D32';
    // Mid-tier: $100K-$1M (24% - blue)
    if (mcap >= 1e5) return darkMode ? '#42A5F5' : '#1976D2';
    // Small: $10K-$100K (32% - yellow)
    if (mcap >= 1e4) return darkMode ? '#FFC107' : '#F57F17';
    // Micro: $1K-$10K (orange)
    if (mcap >= 1e3) return darkMode ? '#FF9800' : '#E65100';
    // Nano: <$1K (red)
    return darkMode ? '#EF5350' : '#C62828';
  };

  useEffect(() => {
    setPriceColor(token.bearbull === -1 ? '#EF5350' : token.bearbull === 1 ? '#4CAF50' : '');
    const timer = setTimeout(() => setPriceColor(''), 1500);
    return () => clearTimeout(timer);
  }, [token.bearbull]);

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
        <span style={{ color, fontWeight: '400' }}>
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
            size={20}
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

      <MobilePriceCell isDark={darkMode}>{formatMobileValue(mobilePercentColumn)}</MobilePriceCell>
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
  const [priceColor, setPriceColor] = useState('');

  const getPercentColor = (value) => {
    if (value === undefined || value === null || isNaN(value))
      return darkMode ? '#4CAF50' : '#2E7D32';
    return value < 0
      ? darkMode ? '#EF5350' : '#C62828'
      : darkMode ? '#4CAF50' : '#2E7D32';
  };

  const getMarketCapColor = (mcap) => {
    if (!mcap || isNaN(mcap)) return darkMode ? '#FFFFFF' : '#000000';
    // Elite: $5M+ (3% - dark green)
    if (mcap >= 5e6) return darkMode ? '#2E7D32' : '#1B5E20';
    // Established: $1M-$5M (8% - green)
    if (mcap >= 1e6) return darkMode ? '#4CAF50' : '#2E7D32';
    // Mid-tier: $100K-$1M (24% - blue)
    if (mcap >= 1e5) return darkMode ? '#42A5F5' : '#1976D2';
    // Small: $10K-$100K (32% - yellow)
    if (mcap >= 1e4) return darkMode ? '#FFC107' : '#F57F17';
    // Micro: $1K-$10K (orange)
    if (mcap >= 1e3) return darkMode ? '#FF9800' : '#E65100';
    // Nano: <$1K (red)
    return darkMode ? '#EF5350' : '#C62828';
  };

  useEffect(() => {
    setPriceColor(token.bearbull === -1 ? '#EF5350' : token.bearbull === 1 ? '#4CAF50' : '');
    const timer = setTimeout(() => setPriceColor(''), 1500);
    return () => clearTimeout(timer);
  }, [token.bearbull]);

  const imgUrl = `https://s1.xrpl.to/token/${md5}`;

  // Render different columns based on view mode
  const renderColumns = () => {
    const tokenCell = (
      <StyledCell
        align="left"
        isDark={darkMode}
        isTokenColumn={true}
        style={{
          width: '250px',
          minWidth: '250px',
          maxWidth: '250px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TokenImage isDark={darkMode}>
            <OptimizedImage
              src={imgError ? '/static/alt.webp' : imgUrl}
              alt={name || 'Token'}
              size={28}
              onError={() => setImgError(true)}
              priority={false}
              md5={md5}
            />
          </TokenImage>
          <div style={{ minWidth: 0, flex: 1 }}>
            <TokenName isDark={darkMode} title={name}>{truncate(name, 20)}</TokenName>
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
              <PriceText priceColor={priceColor} isDark={darkMode}>
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
          <PriceText priceColor={priceColor} isDark={darkMode}>
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
            <StyledCell align="center" isDark={darkMode} style={{ minWidth: '280px' }}>
              {sparklineUrl ? (
                <OptimizedChart url={sparklineUrl} darkMode={darkMode} />
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
            <StyledCell align="center" isDark={darkMode} style={{ minWidth: '280px' }}>
              {sparklineUrl ? (
                <OptimizedChart url={sparklineUrl} darkMode={darkMode} />
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
            <StyledCell align="center" isDark={darkMode} style={{ minWidth: '280px' }}>
              {sparklineUrl ? (
                <OptimizedChart url={sparklineUrl} darkMode={darkMode} />
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
              <StyledCell
                align="right"
                isDark={darkMode}
                style={{ minWidth: '280px', paddingLeft: '16px' }}
              >
                {sparklineUrl ? (
                  <div style={{ width: '260px', height: '60px', display: 'inline-block' }}>
                    <Sparkline
                      url={sparklineUrl}
                      style={{ width: '100%', height: '100%' }}
                      animation={false}
                      showGradient={false}
                      lineWidth={1}
                      opts={{ renderer: 'svg', width: 260, height: 60, devicePixelRatio: 1 }}
                    />
                  </div>
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
          const extraStyle = isLastColumn ? { paddingRight: '24px' } : {};

          switch (column) {
            case 'price':
              const customPrice = activeFiatCurrency === 'XRP' ? exch : exch / exchRate;
              columnElements.push(
                <StyledCell key="price" align="right" isDark={darkMode} style={extraStyle}>
                  <PriceText priceColor={priceColor}>
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
                <StyledCell
                  key="sparkline"
                  align="right"
                  darkMode={darkMode}
                  style={{ minWidth: '280px', paddingLeft: '16px' }}
                >
                  {sparklineUrl ? (
                    <div style={{ width: '260px', height: '60px', display: 'inline-block' }}>
                      <Sparkline
                        url={sparklineUrl}
                        style={{ width: '100%', height: '100%' }}
                        animation={false}
                        showGradient={false}
                        lineWidth={1}
                        opts={{ renderer: 'svg', width: 260, height: 60, devicePixelRatio: 1 }}
                      />
                    </div>
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
            <StyledCell align="right" isDark={darkMode} style={{ paddingRight: '16px' }}>
              {origin || 'XRPL'}
            </StyledCell>
            <StyledCell
              align="center"
              isDark={darkMode}
              style={{ minWidth: '280px', paddingLeft: '16px' }}
            >
              {sparklineUrl ? (
                <OptimizedChart url={sparklineUrl} darkMode={darkMode} />
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
    const BASE_URL = process.env.API_URL;
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
      window.location.href = `/token/${slug}`;
    }, [slug]);

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
      if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
      if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
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
      prev.bearbull === next.bearbull &&
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
  background: ${(props) => props.isDark ? '#000000' : '#FFFFFF'};
`;

export const MobileHeader = styled.div`
  display: flex;
  width: 100%;
  padding: 6px 4px;
  background: ${(props) => props.isDark ? '#000000' : '#FFFFFF'};
  border-bottom: 1px solid ${(props) => props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: ${(props) => props.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'};
  position: sticky;
  top: 0;
  z-index: 10;
  box-sizing: border-box;
`;

export const HeaderCell = styled.div`
  flex: ${(props) => props.flex || 1};
  text-align: ${(props) => props.align || 'left'};
  padding: 0 4px;
  cursor: ${(props) => (props.sortable ? 'pointer' : 'default')};

  &:hover {
    color: ${(props) => props.sortable && (props.isDark ? '#FFFFFF' : '#000000')};
  }
`;

export const TokenRow = FTokenRow;
