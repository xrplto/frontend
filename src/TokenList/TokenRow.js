import Decimal from 'decimal.js';
import { useState, useEffect, useContext, memo, useMemo, useCallback } from 'react';
import React from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { Icon } from '@iconify/react';
import chartLineUp from '@iconify/icons-ph/chart-line-up';

const Image = dynamic(() => import('next/image'));

import { AppContext } from 'src/AppContext';
import { fNumber, fIntNumber, fNumberWithCurreny } from 'src/utils/formatNumber';
import NumberTooltip from 'src/components/NumberTooltip';
import { currencySymbols } from 'src/utils/constants';
import LoadChart from 'src/components/LoadChart';
import { useRouter } from 'next/router';

const StyledRow = styled.tr`
  border-bottom: 1px solid ${props => props.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
  transition: background-color 0.15s ease;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'};
  }
`;

const StyledCell = styled.td`
  padding: ${props => props.isMobile ? '8px 4px' : '12px 8px'};
  white-space: nowrap;
  text-align: ${props => props.align || 'left'};
  font-size: ${props => props.isMobile ? '11px' : '13px'};
  color: ${props => props.darkMode ? '#fff' : '#000'};
  vertical-align: middle;
  
  ${props => props.sticky && `
    position: sticky;
    left: ${props.left}px;
    background: ${props.darkMode ? '#121212' : '#fff'};
    z-index: 1;
  `}
`;

const TokenImage = styled.div`
  width: ${props => props.isMobile ? '24px' : '32px'};
  height: ${props => props.isMobile ? '24px' : '32px'};
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: ${props => props.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
`;

const TokenName = styled.span`
  font-weight: 600;
  font-size: ${props => props.isMobile ? '12px' : '14px'};
  color: ${props => props.darkMode ? '#fff' : '#000'};
  max-width: ${props => props.isMobile ? '80px' : '150px'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const UserName = styled.span`
  font-size: ${props => props.isMobile ? '9px' : '10px'};
  color: ${props => props.darkMode ? '#6b7280' : '#9ca3af'};
  opacity: 0.6;
  font-weight: 400;
`;

const PriceText = styled.span`
  font-weight: 600;
  font-size: ${props => props.isMobile ? '12px' : '14px'};
  color: ${props => props.priceColor || (props.darkMode ? '#fff' : '#000')};
  transition: color 0.3s ease;
`;

const PercentText = styled.span`
  font-weight: 500;
  color: ${props => props.color};
  text-shadow: ${props => props.shadow || 'none'};
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
  activeFiatCurrency
}) {
  const BASE_URL = process.env.API_URL;
  const { accountProfile } = useContext(AppContext);
  const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;
  
  const [priceColor, setPriceColor] = useState('');
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
  
  const getPercentColor = (value) => {
    if (!value || isNaN(value)) return darkMode ? '#999' : '#666';
    return value < 0 
      ? (darkMode ? '#FF5252' : '#D32F2F')
      : (darkMode ? '#66BB6A' : '#388E3C');
  };
  
  useEffect(() => {
    setPriceColor(token.bearbull === -1 ? '#FF5252' : token.bearbull === 1 ? '#66BB6A' : '');
    const timer = setTimeout(() => setPriceColor(''), 1500);
    return () => clearTimeout(timer);
  }, [time, token.bearbull]);
  
  const imgUrl = `https://s1.xrpl.to/token/${md5}`;
  const sparklineUrl = useMemo(() => {
    if (!BASE_URL || !md5 || isMobile) return null;
    return `${BASE_URL}/sparkline/${md5}?period=24h&lightweight=true&maxPoints=20`;
  }, [BASE_URL, md5, isMobile]);
  
  return (
    <StyledRow darkMode={darkMode} onClick={handleRowClick}>
      <StyledCell align="center" darkMode={darkMode} isMobile={isMobile}>
        <span 
          onClick={handleWatchlistClick}
          style={{ 
            cursor: 'pointer', 
            fontSize: isMobile ? '14px' : '18px',
            color: watchList.includes(md5) ? '#FFB800' : 'rgba(255, 255, 255, 0.3)'
          }}
        >
          {watchList.includes(md5) ? '★' : '☆'}
        </span>
      </StyledCell>
      
      <StyledCell align="center" darkMode={darkMode} isMobile={isMobile}>
        <span style={{ fontWeight: '600', color: darkMode ? '#999' : '#666' }}>
          {idx + 1}
        </span>
      </StyledCell>
      
      <StyledCell align="left" darkMode={darkMode} isMobile={isMobile}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TokenImage darkMode={darkMode} isMobile={isMobile}>
            <Image
              src={imgError ? '/static/alt.webp' : imgUrl}
              alt={name}
              width={isMobile ? 24 : 32}
              height={isMobile ? 24 : 32}
              onError={() => setImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </TokenImage>
          <div>
            <TokenName darkMode={darkMode} isMobile={isMobile} title={name} style={{ display: 'block' }}>
              {name}
            </TokenName>
            <UserName darkMode={darkMode} isMobile={isMobile} title={user} style={{ display: 'block' }}>
              {truncate(user, 12)}
            </UserName>
          </div>
        </div>
      </StyledCell>
      
      <StyledCell align="right" darkMode={darkMode} isMobile={isMobile}>
        <PriceText darkMode={darkMode} isMobile={isMobile} priceColor={priceColor}>
          <NumberTooltip
            prepend={currencySymbols[activeFiatCurrency]}
            number={fNumberWithCurreny(exch, exchRate)}
          />
        </PriceText>
      </StyledCell>
      
      {!isMobile && (
        <StyledCell align="right" darkMode={darkMode} isMobile={isMobile}>
          <PercentText color={getPercentColor(pro5m)}>
            {pro5m ? `${pro5m.toFixed(2)}%` : '-'}
          </PercentText>
        </StyledCell>
      )}
      
      {!isMobile && (
        <StyledCell align="right" darkMode={darkMode} isMobile={isMobile}>
          <PercentText color={getPercentColor(pro1h)}>
            {pro1h ? `${pro1h.toFixed(2)}%` : '-'}
          </PercentText>
        </StyledCell>
      )}
      
      <StyledCell align="right" darkMode={darkMode} isMobile={isMobile}>
        <PercentText color={getPercentColor(pro24h)}>
          {pro24h ? `${pro24h.toFixed(isMobile ? 1 : 2)}%` : '-'}
        </PercentText>
      </StyledCell>
      
      {isMobile && (
        <StyledCell align="right" darkMode={darkMode} isMobile={isMobile}>
          <span style={{ fontWeight: '600' }}>
            {currencySymbols[activeFiatCurrency]}{formatValue(convertedValues.marketCap)}
          </span>
        </StyledCell>
      )}
      
      {!isMobile && (
        <>
          <StyledCell align="right" darkMode={darkMode} isMobile={isMobile}>
            <PercentText color={getPercentColor(pro7d)}>
              {pro7d ? `${pro7d.toFixed(2)}%` : '-'}
            </PercentText>
          </StyledCell>
          
          <StyledCell align="right" darkMode={darkMode} isMobile={isMobile}>
            {currencySymbols[activeFiatCurrency]}{formatValue(convertedValues.volume)}
          </StyledCell>
          
          <StyledCell align="right" darkMode={darkMode} isMobile={isMobile}>
            <span style={{ fontSize: '11px', color: darkMode ? '#999' : '#666' }}>
              {formatTimeAgo(dateon, date)}
            </span>
          </StyledCell>
          
          <StyledCell align="right" darkMode={darkMode} isMobile={isMobile}>
            {formatValue(vol24htx, 'int')}
          </StyledCell>
          
          <StyledCell align="right" darkMode={darkMode} isMobile={isMobile}>
            {currencySymbols[activeFiatCurrency]}{formatValue(convertedValues.tvl)}
          </StyledCell>
          
          <StyledCell align="right" darkMode={darkMode} isMobile={isMobile}>
            <span style={{ fontWeight: '600' }}>
              {currencySymbols[activeFiatCurrency]}{formatValue(convertedValues.marketCap)}
            </span>
          </StyledCell>
          
          <StyledCell align="right" darkMode={darkMode} isMobile={isMobile}>
            {formatValue(holders, 'int')}
          </StyledCell>
          
          <StyledCell align="right" darkMode={darkMode} isMobile={isMobile}>
            {formatValue(amount)} {truncate(name, 6)}
          </StyledCell>
          
          <StyledCell align="center" darkMode={darkMode} isMobile={isMobile} style={{ minWidth: '280px' }}>
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
        </>
      )}
    </StyledRow>
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
  
  if (prevProps.watchList !== nextProps.watchList) {
    const prevInWatchlist = prevProps.watchList.includes(prev.md5);
    const nextInWatchlist = nextProps.watchList.includes(next.md5);
    if (prevInWatchlist !== nextInWatchlist) return false;
  }
  
  return true;
});

export const TokenRow = FTokenRow;