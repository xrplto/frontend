import Decimal from 'decimal.js-light';
import { useState, useEffect, useContext, memo, useMemo, useCallback, useRef } from 'react';
import React from 'react';
import styled from '@emotion/styled';
import { useTheme } from '@mui/material/styles';
import Image from 'next/image';

import { AppContext } from 'src/AppContext';
import { fNumber, fIntNumber, fNumberWithCurreny } from 'src/utils/formatters';
import NumberTooltip from 'src/components/NumberTooltip';
import { currencySymbols } from 'src/utils/constants';
import dynamic from 'next/dynamic';

// Lazy load chart component
const Sparkline = dynamic(() => import('src/components/Sparkline'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '260px',
        height: '60px',
        background: 'rgba(128, 128, 128, 0.05)',
        borderRadius: '4px'
      }}
    />
  )
});

// Optimized chart wrapper with intersection observer
const OptimizedChart = memo(
  ({ url, darkMode }) => {
    const [isVisible, setIsVisible] = useState(false);
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
  border-bottom: 1px solid
    ${(props) =>
      props.theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
  cursor: pointer;
  margin: 0;
  padding: 0;
  contain: layout style;
  will-change: auto;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      ${(props) => props.theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'} 50%,
      transparent 100%
    );
  }

  &:hover {
    background: ${(props) =>
      props.theme.palette.mode === 'dark'
        ? 'linear-gradient(90deg, rgba(66, 133, 244, 0.02) 0%, rgba(66, 133, 244, 0.01) 100%)'
        : 'linear-gradient(90deg, rgba(66, 133, 244, 0.015) 0%, rgba(66, 133, 244, 0.005) 100%)'};
  }
`;

const StyledCell = styled.td`
  padding: 14px 12px;
  white-space: ${(props) => (props.isTokenColumn ? 'normal' : 'nowrap')};
  text-align: ${(props) => props.align || 'left'};
  font-size: 13px;
  font-weight: ${(props) => props.fontWeight || 400};
  color: ${(props) => props.color || props.theme.palette.text.primary};
  vertical-align: middle;
  width: ${(props) => props.width || 'auto'};
  min-width: ${(props) => (props.isTokenColumn ? '250px' : 'auto')};
  contain: layout style paint;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  letter-spacing: -0.01em;
`;

// Mobile-specific flexbox components
const MobileTokenCard = styled.div`
  display: flex;
  width: 100%;
  padding: 10px 8px;
  border-bottom: 1px solid
    ${(props) =>
      props.theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'};
  cursor: pointer;
  box-sizing: border-box;
  align-items: center;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      ${(props) => props.theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'} 50%,
      transparent 100%
    );
  }

  &:hover {
    background: ${(props) =>
      props.theme.palette.mode === 'dark'
        ? 'linear-gradient(90deg, rgba(66, 133, 244, 0.02) 0%, transparent 100%)'
        : 'linear-gradient(90deg, rgba(66, 133, 244, 0.015) 0%, transparent 100%)'};
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
  color: ${(props) => props.theme.palette.text.primary};
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
  width: ${(props) => (props.isMobile ? '24px' : '32px')};
  height: ${(props) => (props.isMobile ? '24px' : '32px')};
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: ${(props) =>
    props.theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
`;

const TokenDetails = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const TokenName = styled.span`
  font-weight: 600;
  font-size: ${(props) => (props.isMobile ? '12px' : '14px')};
  color: ${(props) => props.theme.palette.text.primary};
  max-width: ${(props) => (props.isMobile ? '100px' : '150px')};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  line-height: ${(props) => (props.isMobile ? '1.2' : '1.4')};
`;

const UserName = styled.span`
  font-size: ${(props) => (props.isMobile ? '9px' : '10px')};
  color: ${(props) => props.theme.palette.text.secondary};
  opacity: 1;
  font-weight: 400;
  display: block;
  max-width: ${(props) => (props.isMobile ? '100px' : '150px')};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: ${(props) => (props.isMobile ? '1.2' : '1.4')};
  margin-top: ${(props) => (props.isMobile ? '1px' : '3px')};
`;

const PriceText = styled.span`
  font-weight: 600;
  font-size: ${(props) => (props.isMobile ? '11px' : '14px')};
  color: ${(props) => props.priceColor || props.theme.palette.text.primary};
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
    const [isInView, setIsInView] = useState(priority);
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
  const theme = useTheme();
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
      return theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32';
    return value < 0
      ? theme.palette.mode === 'dark'
        ? '#EF5350'
        : '#C62828'
      : theme.palette.mode === 'dark'
        ? '#4CAF50'
        : '#2E7D32';
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
        <span style={{ color, fontWeight: '600' }}>
          {val !== undefined && val !== null && !isNaN(val)
            ? `${val > 0 ? '+' : ''}${val.toFixed(1)}%`
            : '0.0%'}
        </span>
      );
    }

    // Handle other data types
    switch (columnId) {
      case 'price':
        return (
          <NumberTooltip
            prepend={currencySymbols[activeFiatCurrency]}
            number={fNumberWithCurreny(exch, exchRate)}
          />
        );
      case 'volume24h':
        const vol =
          vol24hxrp && exchRate ? new Decimal(vol24hxrp || 0).div(exchRate).toNumber() : 0;
        return `${currencySymbols[activeFiatCurrency]}${vol >= 1e6 ? `${(vol / 1e6).toFixed(1)}M` : vol >= 1e3 ? `${(vol / 1e3).toFixed(1)}K` : fNumber(vol)}`;
      case 'volume7d':
        const vol7 =
          vol24hxrp && exchRate ? new Decimal((vol24hxrp || 0) * 7).div(exchRate).toNumber() : 0;
        return `${currencySymbols[activeFiatCurrency]}${vol7 >= 1e6 ? `${(vol7 / 1e6).toFixed(1)}M` : vol7 >= 1e3 ? `${(vol7 / 1e3).toFixed(1)}K` : fNumber(vol7)}`;
      case 'marketCap':
        const mcap =
          marketcap && exchRate ? new Decimal(marketcap || 0).div(exchRate).toNumber() : 0;
        return `${currencySymbols[activeFiatCurrency]}${mcap >= 1e9 ? `${(mcap / 1e9).toFixed(1)}B` : mcap >= 1e6 ? `${(mcap / 1e6).toFixed(1)}M` : mcap >= 1e3 ? `${(mcap / 1e3).toFixed(1)}K` : fNumber(mcap)}`;
      case 'tvl':
        const tvlVal = tvl && exchRate ? new Decimal(tvl || 0).div(exchRate).toNumber() : 0;
        return `${currencySymbols[activeFiatCurrency]}${tvlVal >= 1e6 ? `${(tvlVal / 1e6).toFixed(1)}M` : tvlVal >= 1e3 ? `${(tvlVal / 1e3).toFixed(1)}K` : fNumber(tvlVal)}`;
      case 'holders':
        return holders >= 1e3 ? `${(holders / 1e3).toFixed(1)}K` : fIntNumber(holders);
      case 'trades':
        return vol24htx >= 1e3 ? `${(vol24htx / 1e3).toFixed(1)}K` : fIntNumber(vol24htx);
      case 'supply':
        return amount >= 1e9
          ? `${(amount / 1e9).toFixed(1)}B`
          : amount >= 1e6
            ? `${(amount / 1e6).toFixed(1)}M`
            : amount >= 1e3
              ? `${(amount / 1e3).toFixed(1)}K`
              : fIntNumber(amount);
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
    <MobileTokenCard onClick={handleRowClick}>
      <MobileTokenInfo>
        <TokenImage isMobile={true}>
          <OptimizedImage
            src={imgError ? '/static/alt.webp' : imgUrl}
            alt={name || 'Token'}
            size={24}
            onError={() => setImgError(true)}
            priority={false}
            md5={md5}
          />
        </TokenImage>
        <TokenDetails>
          <TokenName isMobile={true}>{name}</TokenName>
          <UserName isMobile={true}>{user}</UserName>
        </TokenDetails>
      </MobileTokenInfo>

      <MobilePriceCell>{formatMobileValue(mobilePriceColumn)}</MobilePriceCell>

      <MobilePriceCell>{formatMobileValue(mobilePercentColumn)}</MobilePriceCell>
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
  const theme = useTheme();
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
      return theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32';
    return value < 0
      ? theme.palette.mode === 'dark'
        ? '#EF5350'
        : '#C62828'
      : theme.palette.mode === 'dark'
        ? '#4CAF50'
        : '#2E7D32';
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
        darkMode={darkMode}
        isTokenColumn={true}
        style={{
          width: '250px',
          minWidth: '250px',
          maxWidth: '250px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TokenImage>
            <OptimizedImage
              src={imgError ? '/static/alt.webp' : imgUrl}
              alt={name || 'Token'}
              size={32}
              onError={() => setImgError(true)}
              priority={false}
              md5={md5}
            />
          </TokenImage>
          <div style={{ minWidth: 0, flex: 1 }}>
            <TokenName title={name}>{truncate(name, 20)}</TokenName>
            <UserName title={user}>{truncate(user, 12)}</UserName>
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
            <StyledCell align="right" darkMode={darkMode}>
              <PriceText priceColor={priceColor}>
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
      return (
        <StyledCell align="right" darkMode={darkMode}>
          <PriceText priceColor={priceColor}>
            <NumberTooltip
              prepend={currencySymbols[activeFiatCurrency]}
              number={fNumberWithCurreny(exch, exchRate)}
            />
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
            <StyledCell align="right" darkMode={darkMode}>
              <PercentText color={getPercentColor(pro1h)}>
                {pro1h !== undefined && pro1h !== null && !isNaN(pro1h)
                  ? `${pro1h.toFixed(2)}%`
                  : '0.00%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              <PercentText color={getPercentColor(pro24h)}>
                {pro24h !== undefined && pro24h !== null && !isNaN(pro24h)
                  ? `${pro24h > 0 ? '+' : ''}${pro24h.toFixed(1)}%`
                  : '0.0%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              <PercentText color={getPercentColor(pro7d)}>
                {pro7d !== undefined && pro7d !== null && !isNaN(pro7d)
                  ? `${pro7d.toFixed(2)}%`
                  : '0.00%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              <PercentText color={getPercentColor(pro24h * 30)}>
                {pro24h !== undefined && pro24h !== null && !isNaN(pro24h)
                  ? `${(pro24h * 30).toFixed(0)}%`
                  : '0%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              {currencySymbols[activeFiatCurrency]}
              {formatValue(convertedValues.volume)}
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              {currencySymbols[activeFiatCurrency]}
              {formatValue(convertedValues.volume * 7)}
            </StyledCell>
            <StyledCell align="center" darkMode={darkMode} style={{ minWidth: '280px' }}>
              {sparklineUrl ? (
                <OptimizedChart url={sparklineUrl} darkMode={darkMode} />
              ) : (
                <span style={{ color: theme.palette.text.disabled }}>-</span>
              )}
            </StyledCell>
          </>
        );

      case 'marketData':
        return (
          <>
            {tokenCell}
            {priceCell}
            <StyledCell align="right" darkMode={darkMode}>
              <span style={{ fontWeight: '600' }}>
                {currencySymbols[activeFiatCurrency]}
                {formatValue(convertedValues.marketCap)}
              </span>
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              {currencySymbols[activeFiatCurrency]}
              {formatValue(convertedValues.volume)}
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              {currencySymbols[activeFiatCurrency]}
              {formatValue(convertedValues.tvl)}
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              {formatValue(holders, 'int')}
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              {formatValue(amount, 'int')}
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              {origin || 'XRPL'}
            </StyledCell>
          </>
        );

      case 'topGainers':
        return (
          <>
            {tokenCell}
            {priceCell}
            <StyledCell align="right" darkMode={darkMode}>
              <PercentText color={getPercentColor(pro5m)}>
                {pro5m !== undefined && pro5m !== null && !isNaN(pro5m)
                  ? `${pro5m.toFixed(2)}%`
                  : '0.00%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              <PercentText color={getPercentColor(pro1h)}>
                {pro1h !== undefined && pro1h !== null && !isNaN(pro1h)
                  ? `${pro1h.toFixed(2)}%`
                  : '0.00%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              <PercentText color={getPercentColor(pro24h)}>
                {pro24h !== undefined && pro24h !== null && !isNaN(pro24h)
                  ? `${pro24h > 0 ? '+' : ''}${pro24h.toFixed(1)}%`
                  : '0.0%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              <PercentText color={getPercentColor(pro7d)}>
                {pro7d !== undefined && pro7d !== null && !isNaN(pro7d)
                  ? `${pro7d.toFixed(2)}%`
                  : '0.00%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              {currencySymbols[activeFiatCurrency]}
              {formatValue(convertedValues.volume)}
            </StyledCell>
            <StyledCell align="center" darkMode={darkMode} style={{ minWidth: '280px' }}>
              {sparklineUrl ? (
                <OptimizedChart url={sparklineUrl} darkMode={darkMode} />
              ) : (
                <span style={{ color: theme.palette.text.disabled }}>-</span>
              )}
            </StyledCell>
          </>
        );

      case 'trader':
        return (
          <>
            {tokenCell}
            {priceCell}
            <StyledCell align="right" darkMode={darkMode}>
              {formatValue(vol24htx, 'int')}
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              {currencySymbols[activeFiatCurrency]}
              {formatValue(convertedValues.volume)}
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              <PercentText color={getPercentColor(pro24h)}>
                {pro24h !== undefined && pro24h !== null && !isNaN(pro24h)
                  ? `${pro24h > 0 ? '+' : ''}${pro24h.toFixed(1)}%`
                  : '0.0%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              {currencySymbols[activeFiatCurrency]}
              {formatValue(convertedValues.tvl)}
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              <span style={{ fontSize: '11px', color: theme.palette.text.secondary }}>
                {formatTimeAgo(dateon, date)}
              </span>
            </StyledCell>
            <StyledCell align="center" darkMode={darkMode} style={{ minWidth: '280px' }}>
              {sparklineUrl ? (
                <OptimizedChart url={sparklineUrl} darkMode={darkMode} />
              ) : (
                <span style={{ color: theme.palette.text.disabled }}>-</span>
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
              <StyledCell align="right" darkMode={darkMode}>
                <PercentText color={getPercentColor(pro24h)}>
                  {pro24h !== undefined && pro24h !== null && !isNaN(pro24h)
                    ? `${pro24h > 0 ? '+' : ''}${pro24h.toFixed(1)}%`
                    : '0.0%'}
                </PercentText>
              </StyledCell>
              <StyledCell align="right" darkMode={darkMode}>
                {currencySymbols[activeFiatCurrency]}
                {formatValue(convertedValues.volume)}
              </StyledCell>
              <StyledCell align="right" darkMode={darkMode}>
                <span style={{ fontWeight: '600' }}>
                  {currencySymbols[activeFiatCurrency]}
                  {formatValue(convertedValues.marketCap)}
                </span>
              </StyledCell>
              <StyledCell
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
                  <span style={{ color: theme.palette.text.disabled }}>-</span>
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
              columnElements.push(
                <StyledCell key="price" align="right" darkMode={darkMode} style={extraStyle}>
                  <PriceText priceColor={priceColor}>
                    <NumberTooltip
                      prepend={currencySymbols[activeFiatCurrency]}
                      number={fNumberWithCurreny(exch, exchRate)}
                    />
                  </PriceText>
                </StyledCell>
              );
              break;
            case 'pro5m':
              columnElements.push(
                <StyledCell key="pro5m" align="right" darkMode={darkMode} style={extraStyle}>
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
                <StyledCell key="pro1h" align="right" darkMode={darkMode} style={extraStyle}>
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
                <StyledCell key="pro24h" align="right" darkMode={darkMode} style={extraStyle}>
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
                <StyledCell key="pro7d" align="right" darkMode={darkMode} style={extraStyle}>
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
                <StyledCell key="pro30d" align="right" darkMode={darkMode} style={extraStyle}>
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
                <StyledCell key="volume24h" align="right" darkMode={darkMode} style={extraStyle}>
                  {currencySymbols[activeFiatCurrency]}
                  {formatValue(convertedValues.volume)}
                </StyledCell>
              );
              break;
            case 'volume7d':
              columnElements.push(
                <StyledCell key="volume7d" align="right" darkMode={darkMode} style={extraStyle}>
                  {currencySymbols[activeFiatCurrency]}
                  {formatValue(convertedValues.volume * 7)}
                </StyledCell>
              );
              break;
            case 'marketCap':
              columnElements.push(
                <StyledCell key="marketCap" align="right" darkMode={darkMode} style={extraStyle}>
                  <span style={{ fontWeight: '600' }}>
                    {currencySymbols[activeFiatCurrency]}
                    {formatValue(convertedValues.marketCap)}
                  </span>
                </StyledCell>
              );
              break;
            case 'tvl':
              columnElements.push(
                <StyledCell key="tvl" align="right" darkMode={darkMode} style={extraStyle}>
                  {currencySymbols[activeFiatCurrency]}
                  {formatValue(convertedValues.tvl)}
                </StyledCell>
              );
              break;
            case 'holders':
              columnElements.push(
                <StyledCell key="holders" align="right" darkMode={darkMode} style={extraStyle}>
                  {formatValue(holders, 'int')}
                </StyledCell>
              );
              break;
            case 'trades':
              columnElements.push(
                <StyledCell key="trades" align="right" darkMode={darkMode} style={extraStyle}>
                  {formatValue(vol24htx, 'int')}
                </StyledCell>
              );
              break;
            case 'created':
              columnElements.push(
                <StyledCell key="created" align="right" darkMode={darkMode} style={extraStyle}>
                  <span style={{ fontSize: '11px', color: theme.palette.text.secondary }}>
                    {formatTimeAgo(dateon, date)}
                  </span>
                </StyledCell>
              );
              break;
            case 'supply':
              columnElements.push(
                <StyledCell key="supply" align="right" darkMode={darkMode} style={extraStyle}>
                  {formatValue(amount, 'int')}
                </StyledCell>
              );
              break;
            case 'origin':
              columnElements.push(
                <StyledCell key="origin" align="right" darkMode={darkMode} style={extraStyle}>
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
                    <span style={{ color: theme.palette.text.disabled }}>-</span>
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
            <StyledCell align="right" darkMode={darkMode}>
              <PercentText color={getPercentColor(pro5m)}>
                {pro5m !== undefined && pro5m !== null && !isNaN(pro5m)
                  ? `${pro5m.toFixed(2)}%`
                  : '0.00%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              <PercentText color={getPercentColor(pro1h)}>
                {pro1h !== undefined && pro1h !== null && !isNaN(pro1h)
                  ? `${pro1h.toFixed(2)}%`
                  : '0.00%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              <PercentText color={getPercentColor(pro24h)}>
                {pro24h !== undefined && pro24h !== null && !isNaN(pro24h)
                  ? `${pro24h > 0 ? '+' : ''}${pro24h.toFixed(1)}%`
                  : '0.0%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              <PercentText color={getPercentColor(pro7d)}>
                {pro7d !== undefined && pro7d !== null && !isNaN(pro7d)
                  ? `${pro7d.toFixed(2)}%`
                  : '0.00%'}
              </PercentText>
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              {currencySymbols[activeFiatCurrency]}
              {formatValue(convertedValues.volume)}
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              <span style={{ fontSize: '11px', color: theme.palette.text.secondary }}>
                {formatTimeAgo(dateon, date)}
              </span>
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              {formatValue(vol24htx, 'int')}
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              {currencySymbols[activeFiatCurrency]}
              {formatValue(convertedValues.tvl)}
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              <span style={{ fontWeight: '600' }}>
                {currencySymbols[activeFiatCurrency]}
                {formatValue(convertedValues.marketCap)}
              </span>
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode}>
              {formatValue(holders, 'int')}
            </StyledCell>
            <StyledCell align="right" darkMode={darkMode} style={{ paddingRight: '16px' }}>
              {origin || 'XRPL'}
            </StyledCell>
            <StyledCell
              align="center"
              darkMode={darkMode}
              style={{ minWidth: '280px', paddingLeft: '16px' }}
            >
              {sparklineUrl ? (
                <OptimizedChart url={sparklineUrl} darkMode={darkMode} />
              ) : (
                <span style={{ color: theme.palette.text.disabled }}>-</span>
              )}
            </StyledCell>
          </>
        );
    }
  };

  return (
    <StyledRow onClick={handleRowClick}>
      {isLoggedIn && (
        <StyledCell
          align="center"
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
              color: watchList.includes(md5) ? '#FFB800' : theme.palette.action.disabled,
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
        darkMode={darkMode}
        style={{
          width: '40px',
          minWidth: '40px',
          maxWidth: '40px'
        }}
      >
        <span style={{ fontWeight: '600', color: theme.palette.text.secondary }}>{idx + 1}</span>
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
      return type === 'int' ? fIntNumber(val) : fNumber(val);
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
  background: ${(props) => props.theme.palette.background.default};
`;

export const MobileHeader = styled.div`
  display: flex;
  width: 100%;
  padding: 6px 4px;
  background: ${(props) => props.theme.palette.background.paper};
  border-bottom: 1px solid
    ${(props) =>
      props.theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: ${(props) => props.theme.palette.text.secondary};
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
    color: ${(props) => props.sortable && props.theme.palette.text.primary};
  }
`;

export const TokenRow = FTokenRow;
