import React, { memo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { MemoizedTokenRow } from './TokenRow';

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
  page,
  rows
}) => {
  const Row = useCallback(({ index, style }) => {
    const token = tokens[index];
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
        />
      </div>
    );
  }, [tokens, page, rows, setEditToken, setTrustToken, watchList, onChangeWatchList, scrollLeft, activeFiatCurrency, exchRate]);

  return (
    <List
      height={height}
      itemCount={tokens.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </List>
  );
});

VirtualizedTokenList.displayName = 'VirtualizedTokenList';

export default VirtualizedTokenList;