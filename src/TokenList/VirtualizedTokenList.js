import React, { memo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { TokenRow } from './TokenRow';

// Re-export memoized version
const MemoizedTokenRow = memo(TokenRow, (prevProps, nextProps) => {
  const prev = prevProps.token;
  const next = nextProps.token;
  
  // Fast path: check only critical fields
  if (prev.exch !== next.exch) return false;
  if (prev.pro24h !== next.pro24h) return false;
  if (prev.pro5m !== next.pro5m) return false;
  if (prev.pro1h !== next.pro1h) return false;
  if (prev.pro7d !== next.pro7d) return false;
  if (prev.vol24hxrp !== next.vol24hxrp) return false;
  if (prev.time !== next.time) return false;
  
  // Check watchlist only if changed
  if (prevProps.watchList !== nextProps.watchList) {
    const prevInWatchlist = prevProps.watchList.includes(prev.md5);
    const nextInWatchlist = nextProps.watchList.includes(next.md5);
    if (prevInWatchlist !== nextInWatchlist) return false;
  }
  
  // Check currency changes
  if (prevProps.exchRate !== nextProps.exchRate) return false;
  
  // Check if view mode changed
  if (prevProps.viewMode !== nextProps.viewMode) return false;
  if (prevProps.customColumns !== nextProps.customColumns) return false;
  
  return true; // Skip re-render
});

const VirtualizedTokenList = memo(({ 
  tokens, 
  height, 
  itemHeight = 40,
  setEditToken,
  setTrustToken,
  watchList,
  onChangeWatchList,
  scrollLeft,
  activeFiatCurrency,
  exchRate,
  darkMode,
  page,
  rows,
  isLoggedIn,
  viewMode,
  customColumns
}) => {
  const Row = useCallback(({ index, style }) => {
    const token = tokens[index];
    if (!token) return null;
    
    return (
      <div style={style}>
        <MemoizedTokenRow
          key={token.md5}
          time={token.time}
          idx={index + page * rows}
          token={token}
          setEditToken={setEditToken}
          setTrustToken={setTrustToken}
          watchList={watchList}
          onChangeWatchList={onChangeWatchList}
          scrollLeft={scrollLeft}
          activeFiatCurrency={activeFiatCurrency}
          exchRate={exchRate}
          darkMode={darkMode}
          isMobile={false}
          isLoggedIn={isLoggedIn}
          viewMode={viewMode}
          customColumns={customColumns}
        />
      </div>
    );
  }, [tokens, page, rows, setEditToken, setTrustToken, watchList, onChangeWatchList, 
      scrollLeft, activeFiatCurrency, exchRate, darkMode, isLoggedIn, viewMode, customColumns]);

  return (
    <List
      height={height}
      itemCount={tokens.length}
      itemSize={itemHeight}
      width="100%"
      overscanCount={5}
    >
      {Row}
    </List>
  );
});

VirtualizedTokenList.displayName = 'VirtualizedTokenList';

export default VirtualizedTokenList;