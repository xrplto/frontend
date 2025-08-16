import React, { memo } from 'react';
import styled from '@emotion/styled';
import dynamic from 'next/dynamic';
import { fNumberWithCurreny } from 'src/utils/formatNumber';
import NumberTooltip from 'src/components/NumberTooltip';
import { currencySymbols } from 'src/utils/constants';

const Image = dynamic(() => import('next/image'));

// Mobile-specific container - no tables!
const MobileContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  margin: 0;
  background: ${props => props.darkMode ? '#121212' : '#fff'};
  border: 2px solid lime; /* DEBUG */
`;

const MobileHeader = styled.div`
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

const HeaderCell = styled.div`
  flex: ${props => props.flex || 1};
  text-align: ${props => props.align || 'left'};
  padding: 0 4px;
  cursor: ${props => props.sortable ? 'pointer' : 'default'};
  border: 1px solid ${props => props.debugColor || 'transparent'}; /* DEBUG */
  
  &:hover {
    color: ${props => props.sortable && (props.darkMode ? '#fff' : '#000')};
  }
`;

const TokenCard = styled.div`
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

const TokenInfo = styled.div`
  flex: 2;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 2px;
  min-width: 0;
  border: 1px solid cyan; /* DEBUG */
`;

const TokenImage = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: ${props => props.darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
`;

const TokenDetails = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const TokenName = styled.div`
  font-weight: 600;
  font-size: 12px;
  color: ${props => props.darkMode ? '#fff' : '#000'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
  line-height: 1.2;
`;

const TokenUser = styled.div`
  font-size: 9px;
  color: ${props => props.darkMode ? '#6b7280' : '#9ca3af'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
  line-height: 1.2;
`;

const PriceCell = styled.div`
  flex: 1.2;
  text-align: right;
  padding: 0 2px;
  font-weight: 600;
  font-size: 11px;
  color: ${props => props.darkMode ? '#fff' : '#000'};
  border: 1px solid yellow; /* DEBUG */
  min-width: 65px;
  word-break: break-all;
  line-height: 1.3;
`;

const PercentCell = styled.div`
  flex: 0.7;
  text-align: right;
  padding: 0 2px;
  font-weight: 600;
  font-size: 11px;
  color: ${props => props.color};
  border: 1px solid magenta; /* DEBUG */
  min-width: 45px;
`;

const MobileTokenRow = memo(({ 
  token, 
  darkMode, 
  exchRate, 
  activeFiatCurrency, 
  onClick 
}) => {
  const { name, user, md5, slug, pro24h, exch } = token;
  
  // DEBUG
  React.useEffect(() => {
    console.log('[MobileTokenList] Rendering token:', {
      name: name?.substring(0, 20),
      user: user?.substring(0, 20),
      exch,
      pro24h
    });
  }, [name, user, exch, pro24h]);
  
  const getPercentColor = (value) => {
    if (value === undefined || value === null || isNaN(value)) 
      return darkMode ? '#66BB6A' : '#388E3C';
    return value < 0 ? (darkMode ? '#FF5252' : '#D32F2F') : (darkMode ? '#66BB6A' : '#388E3C');
  };
  
  const handleClick = () => {
    window.location.href = `/token/${slug}`;
  };

  return (
    <TokenCard darkMode={darkMode} onClick={handleClick}>
      <TokenInfo darkMode={darkMode}>
        <TokenImage darkMode={darkMode}>
          <Image
            src={`https://s1.xrpl.to/token/${md5}`}
            alt={name}
            width={24}
            height={24}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.target.src = '/static/alt.webp';
            }}
          />
        </TokenImage>
        <TokenDetails>
          <TokenName darkMode={darkMode}>{name}</TokenName>
          <TokenUser darkMode={darkMode}>{user}</TokenUser>
        </TokenDetails>
      </TokenInfo>
      
      <PriceCell darkMode={darkMode}>
        <NumberTooltip
          prepend={currencySymbols[activeFiatCurrency]}
          number={fNumberWithCurreny(exch, exchRate)}
        />
      </PriceCell>
      
      <PercentCell color={getPercentColor(pro24h)}>
        {pro24h !== undefined && pro24h !== null && !isNaN(pro24h) 
          ? `${pro24h > 0 ? '+' : ''}${pro24h.toFixed(1)}%` 
          : '0.0%'}
      </PercentCell>
    </TokenCard>
  );
});

export default function MobileTokenList({ 
  tokens, 
  darkMode, 
  exchRate, 
  activeFiatCurrency,
  order,
  orderBy,
  onRequestSort
}) {
  
  const handleSort = (field) => {
    onRequestSort(null, field);
  };

  return (
    <MobileContainer darkMode={darkMode}>
      <MobileHeader darkMode={darkMode}>
        <HeaderCell 
          flex={2} 
          align="left" 
          darkMode={darkMode}
          sortable
          onClick={() => handleSort('name')}
          debugColor="cyan"
        >
          Token
        </HeaderCell>
        <HeaderCell 
          flex={1.2} 
          align="right" 
          darkMode={darkMode}
          sortable
          onClick={() => handleSort('exch')}
          debugColor="yellow"
        >
          Price
        </HeaderCell>
        <HeaderCell 
          flex={0.7} 
          align="right" 
          darkMode={darkMode}
          sortable
          onClick={() => handleSort('pro24h')}
          debugColor="magenta"
        >
          24H
        </HeaderCell>
      </MobileHeader>
      
      {tokens.map((token) => (
        <MobileTokenRow
          key={token.md5}
          token={token}
          darkMode={darkMode}
          exchRate={exchRate}
          activeFiatCurrency={activeFiatCurrency}
        />
      ))}
    </MobileContainer>
  );
}