import Decimal from 'decimal.js';
import { useState, useEffect, useContext, memo, useMemo, useCallback } from 'react';
import React from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';

const Image = dynamic(() => import('next/image'));

import { AppContext } from 'src/AppContext';
import { fNumber, fIntNumber, fNumberWithCurreny } from 'src/utils/formatNumber';
import NumberTooltip from 'src/components/NumberTooltip';
import { currencySymbols } from 'src/utils/constants';
import LoadChart from 'src/components/LoadChart';

const StyledRow = styled.tr`
  border-bottom: 1px solid ${props => props.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
  transition: background-color 0.15s ease;
  cursor: pointer;
  margin: 0; /* Ensure no margin */
  padding: 0; /* Ensure no padding */
  
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

const MobileCell = styled.td`
  padding: 16px 8px; /* Reduced horizontal padding */
  white-space: nowrap;
  text-align: ${props => props.align || 'left'};
  font-size: 14px;
  color: ${props => props.darkMode ? '#fff' : '#000'};
  vertical-align: middle;
  box-sizing: border-box; /* Ensure padding is included in width calculation */
`;

const TokenImage = styled.div`
  width: ${props => props.isMobile ? '36px' : '32px'};
  height: ${props => props.isMobile ? '36px' : '32px'};
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: ${props => props.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
`;

const TokenName = styled.span`
  font-weight: 600;
  font-size: ${props => props.isMobile ? '15px' : '14px'};
  color: ${props => props.darkMode ? '#fff' : '#000'};
  max-width: ${props => props.isMobile ? '160px' : '150px'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  line-height: 1.4;
`;

const UserName = styled.span`
  font-size: ${props => props.isMobile ? '13px' : '10px'};
  color: ${props => props.darkMode ? '#6b7280' : '#9ca3af'};
  opacity: 0.8;
  font-weight: 400;
  display: block;
  max-width: ${props => props.isMobile ? '160px' : '150px'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
  margin-top: 3px;
`;

const PriceText = styled.span`
  font-weight: 600;
  font-size: ${props => props.isMobile ? '15px' : '14px'};
  color: ${props => props.priceColor || (props.darkMode ? '#fff' : '#000')};
  transition: color 0.3s ease;
`;

const PercentText = styled.span`
  font-weight: 600;
  color: ${props => props.color};
  font-size: ${props => props.isMobile ? '14px' : '13px'};
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

const MobileTokenRow = ({ token, darkMode, exchRate, activeFiatCurrency, handleRowClick, imgError, setImgError }) => {
  const { name, user, md5, slug, pro24h, exch } = token;
  const [priceColor, setPriceColor] = useState('');
  
  // DEBUG: Mobile row logging - enhanced
  useEffect(() => {
    console.log(`[Mobile Debug] Token:`, {
      name: name?.substring(0, 20),
      md5,
      exch,
      pro24h,
      isMobileComponent: true,
      windowWidth: window.innerWidth
    });
  }, [name, md5, exch, pro24h]);
  
  const getPercentColor = (value) => {
    if (value === undefined || value === null || isNaN(value)) return darkMode ? '#66BB6A' : '#388E3C';
    return value < 0 ? (darkMode ? '#FF5252' : '#D32F2F') : (darkMode ? '#66BB6A' : '#388E3C');
  };

  useEffect(() => {
    setPriceColor(token.bearbull === -1 ? '#FF5252' : token.bearbull === 1 ? '#66BB6A' : '');
    const timer = setTimeout(() => setPriceColor(''), 1500);
    return () => clearTimeout(timer);
  }, [token.bearbull]);

  const imgUrl = `https://s1.xrpl.to/token/${md5}`;

  return (
    <StyledRow darkMode={darkMode} onClick={handleRowClick} style={{ width: '100%' }}>
      <MobileCell 
        align="left" 
        darkMode={darkMode}
        style={{
          border: '1px solid cyan', // DEBUG: Cyan border for mobile token cell
          width: '60%',  // Increased from 50% to give more space to token
          minWidth: '60%',
          maxWidth: '60%',
          paddingLeft: '8px',
          paddingRight: '8px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <TokenImage darkMode={darkMode} isMobile={true}>
            <Image
              src={imgError ? '/static/alt.webp' : imgUrl}
              alt={name}
              width={36}
              height={36}
              onError={() => setImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </TokenImage>
          <div style={{ minWidth: 0, flex: 1 }}>
            <TokenName darkMode={darkMode} isMobile={true} title={name}>
              {truncate(name, 20)}
            </TokenName>
            <UserName darkMode={darkMode} isMobile={true} title={user}>
              {truncate(user, 20)}
            </UserName>
          </div>
        </div>
      </MobileCell>
      
      <MobileCell 
        align="right" 
        darkMode={darkMode}
        style={{
          border: '1px solid yellow', // DEBUG: Yellow border for price cell
          width: '20%',
          minWidth: '20%',
          maxWidth: '20%',
          boxSizing: 'border-box'
        }}
      >
        <PriceText darkMode={darkMode} isMobile={true} priceColor={priceColor}>
          <NumberTooltip
            prepend={currencySymbols[activeFiatCurrency]}
            number={fNumberWithCurreny(exch, exchRate)}
          />
        </PriceText>
      </MobileCell>
      
      <MobileCell 
        align="right" 
        darkMode={darkMode}
        style={{
          border: '1px solid magenta', // DEBUG: Magenta border for percent cell
          width: '20%',
          minWidth: '20%',
          maxWidth: '20%',
          boxSizing: 'border-box'
        }}
      >
        <PercentText color={getPercentColor(pro24h)} isMobile={true}>
          {pro24h !== undefined && pro24h !== null && !isNaN(pro24h) ? `${pro24h > 0 ? '+' : ''}${pro24h.toFixed(1)}%` : '0.0%'}
        </PercentText>
      </MobileCell>
    </StyledRow>
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
    vol24htx, tvl, holders, amount, dateon, date 
  } = token;
  const [priceColor, setPriceColor] = useState('');
  
  // DEBUG: Desktop row logging
  useEffect(() => {
    console.log(`[Desktop Debug] Row ${idx}:`, {
      md5,
      name: name?.substring(0, 20),
      isLoggedIn,
      watchList: watchList?.length
    });
  }, [idx, md5, name, isLoggedIn, watchList]);
  
  const getPercentColor = (value) => {
    if (value === undefined || value === null || isNaN(value)) return darkMode ? '#66BB6A' : '#388E3C';
    return value < 0 ? (darkMode ? '#FF5252' : '#D32F2F') : (darkMode ? '#66BB6A' : '#388E3C');
  };

  useEffect(() => {
    setPriceColor(token.bearbull === -1 ? '#FF5252' : token.bearbull === 1 ? '#66BB6A' : '');
    const timer = setTimeout(() => setPriceColor(''), 1500);
    return () => clearTimeout(timer);
  }, [token.bearbull]);

  const imgUrl = `https://s1.xrpl.to/token/${md5}`;

  return (
    <StyledRow darkMode={darkMode} onClick={handleRowClick}>
      {isLoggedIn && (
        <StyledCell 
          align="center" 
          darkMode={darkMode} 
          style={{ 
            width: '40px', 
            minWidth: '40px',
            maxWidth: '40px',
            border: '1px solid red' // DEBUG
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
          maxWidth: '250px',
          border: '1px solid green' // DEBUG
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TokenImage darkMode={darkMode}>
            <Image
              src={imgError ? '/static/alt.webp' : imgUrl}
              alt={name}
              width={32}
              height={32}
              onError={() => setImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
        {formatValue(amount)} {truncate(name, 6)}
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
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
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

export const TokenRow = FTokenRow;