import Decimal from 'decimal.js';
import { useState, useEffect, useContext, memo, useMemo, useCallback, useRef } from 'react';
import React from 'react';
import Image from 'next/image';
import styled from '@emotion/styled';

import { AppContext } from 'src/AppContext';
import { fNumber, fIntNumber, fNumberWithCurreny } from 'src/utils/formatNumber';
import NumberTooltip from 'src/components/NumberTooltip';
import { currencySymbols } from 'src/utils/constants';
import LoadChart from 'src/components/LoadChart';

const StyledRow = styled.tr`
  border-bottom: 1px solid ${props => props.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
  transition: background-color 0.15s ease;
  cursor: pointer;
  margin: 0;
  padding: 0;
  
  &:hover {
    background-color: ${props => props.darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'};
  }
`;

const StyledCell = styled.td`
  padding: 12px 8px;
  white-space: nowrap;
  text-align: ${props => props.align || 'left'};
  font-size: 13px;
  color: ${props => props.darkMode ? '#fff' : '#000'};
  vertical-align: middle;
`;

// Mobile-specific flexbox components
const MobileTokenCard = styled.div`
  display: flex;
  width: 100%;
  padding: 6px 4px;
  border-bottom: 1px solid ${props => props.darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
  cursor: pointer;
  transition: background-color 0.2s;
  box-sizing: border-box;
  align-items: center;
  
  &:hover {
    background-color: ${props => props.darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'};
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
  color: ${props => props.darkMode ? '#fff' : '#000'};
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
  color: ${props => props.color};
  min-width: 45px;
`;

// Shared components with mobile/desktop variations
const TokenImage = styled.div`
  width: ${props => props.isMobile ? '24px' : '32px'};
  height: ${props => props.isMobile ? '24px' : '32px'};
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: ${props => props.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
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
  font-size: ${props => props.isMobile ? '12px' : '14px'};
  color: ${props => props.darkMode ? '#fff' : '#000'};
  max-width: ${props => props.isMobile ? '100px' : '150px'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  line-height: ${props => props.isMobile ? '1.2' : '1.4'};
`;

const UserName = styled.span`
  font-size: ${props => props.isMobile ? '9px' : '10px'};
  color: ${props => props.darkMode ? '#6b7280' : '#9ca3af'};
  opacity: 0.8;
  font-weight: 400;
  display: block;
  max-width: ${props => props.isMobile ? '100px' : '150px'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: ${props => props.isMobile ? '1.2' : '1.4'};
  margin-top: ${props => props.isMobile ? '1px' : '3px'};
`;

const PriceText = styled.span`
  font-weight: 600;
  font-size: ${props => props.isMobile ? '11px' : '14px'};
  color: ${props => props.priceColor || (props.darkMode ? '#fff' : '#000')};
  transition: color 0.3s ease;
`;

const PercentText = styled.span`
  font-weight: 600;
  color: ${props => props.color};
  font-size: ${props => props.isMobile ? '11px' : '13px'};
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
    const fallbackDate = typeof fallbackValue === 'number' ? new Date(fallbackValue) : new Date(fallbackValue);
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
const OptimizedImage = ({ src, alt, size, onError, priority = false, md5 }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef(null);
  const observerRef = useRef(null);
  
  useEffect(() => {
    if (priority || !imgRef.current) return;
    
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (observerRef.current) {
            observerRef.current.disconnect();
          }
        }
      },
      { 
        rootMargin: '50px',
        threshold: 0.01 
      }
    );
    
    observerRef.current.observe(imgRef.current);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
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
          background: 'rgba(128, 128, 128, 0.1)'
        }} 
      />
    );
  }
  
  return (
    <div ref={imgRef} style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden' }}>
      <Image
        src={imgSrc}
        alt={alt}
        width={size}
        height={size}
        quality={75}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        onError={handleError}
        unoptimized={true}
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover'
        }}
      />
    </div>
  );
};

const MobileTokenRow = ({ token, darkMode, exchRate, activeFiatCurrency, handleRowClick, imgError, setImgError }) => {
  const { name, user, md5, slug, pro24h, exch } = token;
  const [priceColor, setPriceColor] = useState('');
  
  const getPercentColor = (value) => {
    if (value === undefined || value === null || isNaN(value)) return darkMode ? '#66BB6A' : '#388E3C';
    return value < 0 ? (darkMode ? '#FF5252' : '#D32F2F') : (darkMode ? '#66BB6A' : '#388E3C');
  };

  useEffect(() => {
    setPriceColor(token.bearbull === -1 ? '#FF5252' : token.bearbull === 1 ? '#66BB6A' : '');
    const timer = setTimeout(() => setPriceColor(''), 1500);
    return () => clearTimeout(timer);
  }, [token.bearbull]);

  const imgUrl = useMemo(() => `https://s1.xrpl.to/token/${md5}`, [md5]);

  // Using flexbox layout instead of table
  return (
    <MobileTokenCard darkMode={darkMode} onClick={handleRowClick}>
      <MobileTokenInfo darkMode={darkMode}>
        <TokenImage darkMode={darkMode} isMobile={true}>
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
          <TokenName darkMode={darkMode} isMobile={true}>{name}</TokenName>
          <UserName darkMode={darkMode} isMobile={true}>{user}</UserName>
        </TokenDetails>
      </MobileTokenInfo>
      
      <MobilePriceCell darkMode={darkMode}>
        <NumberTooltip
          prepend={currencySymbols[activeFiatCurrency]}
          number={fNumberWithCurreny(exch, exchRate)}
        />
      </MobilePriceCell>
      
      <MobilePercentCell color={getPercentColor(pro24h)}>
        {pro24h !== undefined && pro24h !== null && !isNaN(pro24h) 
          ? `${pro24h > 0 ? '+' : ''}${pro24h.toFixed(1)}%` 
          : '0.0%'}
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
  isLoggedIn
}) => {
  const { 
    name, user, md5, slug, pro24h, pro7d, pro1h, pro5m, exch, 
    vol24htx, tvl, holders, amount, dateon, date, origin 
  } = token;
  const [priceColor, setPriceColor] = useState('');
  
  const getPercentColor = (value) => {
    if (value === undefined || value === null || isNaN(value)) return darkMode ? '#66BB6A' : '#388E3C';
    return value < 0 ? (darkMode ? '#FF5252' : '#D32F2F') : (darkMode ? '#66BB6A' : '#388E3C');
  };

  useEffect(() => {
    setPriceColor(token.bearbull === -1 ? '#FF5252' : token.bearbull === 1 ? '#66BB6A' : '');
    const timer = setTimeout(() => setPriceColor(''), 1500);
    return () => clearTimeout(timer);
  }, [token.bearbull]);

  const imgUrl = useMemo(() => `https://s1.xrpl.to/token/${md5}`, [md5]);

  return (
    <StyledRow darkMode={darkMode} onClick={handleRowClick}>
      {isLoggedIn && (
        <StyledCell 
          align="center" 
          darkMode={darkMode} 
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
              color: watchList.includes(md5) ? '#FFB800' : 'rgba(255, 255, 255, 0.3)',
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
        <span style={{ fontWeight: '600', color: darkMode ? '#999' : '#666' }}>
          {idx + 1}
        </span>
      </StyledCell>
      
      <StyledCell 
        align="left" 
        darkMode={darkMode} 
        style={{ 
          width: '250px', 
          minWidth: '250px',
          maxWidth: '250px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TokenImage darkMode={darkMode}>
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
            <TokenName darkMode={darkMode} title={name}>
              {truncate(name, 20)}
            </TokenName>
            <UserName darkMode={darkMode} title={user}>
              {truncate(user, 12)}
            </UserName>
          </div>
        </div>
      </StyledCell>
      
      <StyledCell align="right" darkMode={darkMode}>
        <PriceText darkMode={darkMode} priceColor={priceColor}>
          <NumberTooltip
            prepend={currencySymbols[activeFiatCurrency]}
            number={fNumberWithCurreny(exch, exchRate)}
          />
        </PriceText>
      </StyledCell>
      
      <StyledCell align="right" darkMode={darkMode}>
        <PercentText color={getPercentColor(pro5m)}>
          {pro5m !== undefined && pro5m !== null && !isNaN(pro5m) ? `${pro5m.toFixed(2)}%` : '0.00%'}
        </PercentText>
      </StyledCell>
      
      <StyledCell align="right" darkMode={darkMode}>
        <PercentText color={getPercentColor(pro1h)}>
          {pro1h !== undefined && pro1h !== null && !isNaN(pro1h) ? `${pro1h.toFixed(2)}%` : '0.00%'}
        </PercentText>
      </StyledCell>
      
      <StyledCell align="right" darkMode={darkMode}>
        <PercentText color={getPercentColor(pro24h)}>
          {pro24h !== undefined && pro24h !== null && !isNaN(pro24h) ? `${pro24h > 0 ? '+' : ''}${pro24h.toFixed(1)}%` : '0.0%'}
        </PercentText>
      </StyledCell>
      
      <StyledCell align="right" darkMode={darkMode}>
        <PercentText color={getPercentColor(pro7d)}>
          {pro7d !== undefined && pro7d !== null && !isNaN(pro7d) ? `${pro7d.toFixed(2)}%` : '0.00%'}
        </PercentText>
      </StyledCell>
      
      <StyledCell align="right" darkMode={darkMode}>
        {currencySymbols[activeFiatCurrency]}{formatValue(convertedValues.volume)}
      </StyledCell>
      
      <StyledCell align="right" darkMode={darkMode}>
        <span style={{ fontSize: '11px', color: darkMode ? '#999' : '#666' }}>
          {formatTimeAgo(dateon, date)}
        </span>
      </StyledCell>
      
      <StyledCell align="right" darkMode={darkMode}>
        {formatValue(vol24htx, 'int')}
      </StyledCell>
      
      <StyledCell align="right" darkMode={darkMode}>
        {currencySymbols[activeFiatCurrency]}{formatValue(convertedValues.tvl)}
      </StyledCell>
      
      <StyledCell align="right" darkMode={darkMode}>
        <span style={{ fontWeight: '600' }}>
          {currencySymbols[activeFiatCurrency]}{formatValue(convertedValues.marketCap)}
        </span>
      </StyledCell>
      
      <StyledCell align="right" darkMode={darkMode}>
        {formatValue(holders, 'int')}
      </StyledCell>
      
      <StyledCell align="right" darkMode={darkMode}>
        {origin || 'XRPL'}
      </StyledCell>
      
      <StyledCell align="center" darkMode={darkMode} style={{ minWidth: '280px' }}>
        {sparklineUrl ? (
          <div style={{ width: '260px', height: '60px', display: 'inline-block' }}>
            <LoadChart
              url={sparklineUrl}
              style={{ width: '100%', height: '100%' }}
              animation={false}
              showGradient={false}
              lineWidth={1.5}
              opts={{ renderer: 'svg', width: 260, height: 60 }}
            />
          </div>
        ) : (
          <span style={{ color: darkMode ? '#666' : '#ccc' }}>-</span>
        )}
      </StyledCell>
    </StyledRow>
  );
};

const FTokenRow = React.memo(function FTokenRow({
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
  isLoggedIn
}) {
  const BASE_URL = process.env.API_URL;
  const { accountProfile } = useContext(AppContext);
  const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;
  
  const [imgError, setImgError] = useState(false);
  
  const {
    id, name, date, amount, vol24hxrp, vol24htx, md5, slug, user,
    pro7d, pro24h, pro1h, pro5m, exch, marketcap, isOMCF, tvl,
    origin, holders, dateon
  } = token;
  
  const handleWatchlistClick = useCallback((e) => {
    e.stopPropagation();
    onChangeWatchList(md5);
  }, [md5, onChangeWatchList]);
  
  const handleRowClick = useCallback(() => {
    window.location.href = `/token/${slug}`;
  }, [slug]);
  
  const convertedValues = useMemo(() => ({
    marketCap: marketcap && exchRate ? Decimal.div(marketcap || 0, exchRate).toNumber() : 0,
    volume: vol24hxrp && exchRate ? Decimal.div(vol24hxrp || 0, exchRate).toNumber() : 0,
    tvl: tvl && exchRate ? Decimal.div(tvl || 0, exchRate).toNumber() : 0
  }), [marketcap, vol24hxrp, tvl, exchRate]);
  
  const formatValue = (val, type = 'number') => {
    if (val >= 1e12) return `${(val / 1e12).toFixed(1)}T`;
    if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
    return type === 'int' ? fIntNumber(val) : fNumber(val);
  };
  
  const sparklineUrl = useMemo(() => {
    if (!BASE_URL || !md5 || isMobile) return null;
    return `${BASE_URL}/sparkline/${md5}?period=24h&lightweight=true&maxPoints=20`;
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
    />
  );
}, (prevProps, nextProps) => {
  const prev = prevProps.token;
  const next = nextProps.token;
  
  if (prev.exch !== next.exch) return false;
  if (prev.pro24h !== next.pro24h) return false;
  if (prev.pro5m !== next.pro5m) return false;
  if (prev.pro1h !== next.pro1h) return false;
  if (prev.time !== next.time) return false;
  if (prevProps.exchRate !== nextProps.exchRate) return false;
  if (prevProps.isLoggedIn !== nextProps.isLoggedIn) return false;
  
  if (prevProps.watchList !== nextProps.watchList) {
    const prevInWatchlist = prevProps.watchList.includes(prev.md5);
    const nextInWatchlist = nextProps.watchList.includes(next.md5);
    if (prevInWatchlist !== nextInWatchlist) return false;
  }
  
  return true;
});

// Mobile list components for header and container
export const MobileTokenList = ({ tokens, darkMode, exchRate, activeFiatCurrency, order, orderBy, onRequestSort }) => {
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
          darkMode={darkMode}
          isMobile={true}
          activeFiatCurrency={activeFiatCurrency}
          isLoggedIn={false}
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
  background: ${props => props.darkMode ? '#121212' : '#fff'};
`;

export const MobileHeader = styled.div`
  display: flex;
  width: 100%;
  padding: 6px 4px;
  background: ${props => props.darkMode ? '#1a1a1a' : '#f5f5f5'};
  border-bottom: 1px solid ${props => props.darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: ${props => props.darkMode ? '#999' : '#666'};
  position: sticky;
  top: 0;
  z-index: 10;
  box-sizing: border-box;
`;

export const HeaderCell = styled.div`
  flex: ${props => props.flex || 1};
  text-align: ${props => props.align || 'left'};
  padding: 0 4px;
  cursor: ${props => props.sortable ? 'pointer' : 'default'};
  
  &:hover {
    color: ${props => props.sortable && (props.darkMode ? '#fff' : '#000')};
  }
`;

export const TokenRow = FTokenRow;