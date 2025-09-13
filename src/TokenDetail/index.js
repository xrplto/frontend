import dynamic from 'next/dynamic';
import { useContext, useState, useEffect, useCallback, memo, useMemo } from 'react';

// Material
import { Box, Divider, useTheme, useMediaQuery } from '@mui/material';

// Components
import { AppContext } from 'src/AppContext';

// Lazy load all heavy components
const Overview = dynamic(() => import('./overview'), {
  loading: () => <div style={{ height: '400px' }} />,
  ssr: false
});

const LinkCascade = dynamic(() => import('./LinkCascade'), {
  ssr: false
});

const TokenSummary = dynamic(() => import('./common/TokenSummary'), {
  loading: () => <div style={{ height: '200px' }} />,
  ssr: false
});

const CreatorTransactionsDialog = dynamic(() => import('./common/CreatorTransactionsDialog'), {
  ssr: false
});

const TransactionDetailsPanel = dynamic(() => import('./common/TransactionDetailsPanel'), {
  ssr: false
});

const OrderBookPanel = dynamic(() => import('./trade/OrderBookPanel'), {
  ssr: false
});

const TokenDetail = memo(({ token, onCreatorPanelToggle, creatorPanelOpen, onTransactionPanelToggle, transactionPanelOpen, onOrderBookToggle, orderBookOpen }) => {
  const { darkMode } = useContext(AppContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [creatorTxOpen, setCreatorTxOpen] = useState(creatorPanelOpen || false);
  const [latestCreatorTx, setLatestCreatorTx] = useState(null);
  const [selectedTxHash, setSelectedTxHash] = useState(null);
  const [txDetailsOpen, setTxDetailsOpen] = useState(transactionPanelOpen || false);
  const [orderBookPanelOpen, setOrderBookPanelOpen] = useState(orderBookOpen || false);
  const [orderBookData, setOrderBookData] = useState({
    pair: { curr1: { currency: 'XRP' }, curr2: token },
    asks: [],
    bids: [],
    limitPrice: null,
    isBuyOrder: true,
    onAskClick: () => {},
    onBidClick: () => {}
  });

  // Sync internal state with parent
  useEffect(() => {
    setCreatorTxOpen(creatorPanelOpen || false);
  }, [creatorPanelOpen]);

  useEffect(() => {
    setTxDetailsOpen(transactionPanelOpen || false);
  }, [transactionPanelOpen]);

  useEffect(() => {
    setOrderBookPanelOpen(orderBookOpen || false);
  }, [orderBookOpen]);

  // Memoize callback functions to prevent re-renders
  const handleCreatorTxToggle = useCallback(() => {
    const newState = !creatorTxOpen;
    setCreatorTxOpen(newState);
    if (onCreatorPanelToggle) {
      onCreatorPanelToggle(newState);
    }
  }, [creatorTxOpen, onCreatorPanelToggle]);

  // Handle transaction selection
  const handleSelectTransaction = useCallback((hash) => {
    setSelectedTxHash(hash);
    setTxDetailsOpen(true);
    if (onTransactionPanelToggle) {
      onTransactionPanelToggle(true);
    }
  }, [onTransactionPanelToggle]);

  // Handle transaction details close
  const handleTxDetailsClose = useCallback(() => {
    setTxDetailsOpen(false);
    if (onTransactionPanelToggle) {
      onTransactionPanelToggle(false);
    }
  }, [onTransactionPanelToggle]);

  // Handle orderbook panel toggle
  const handleOrderBookToggle = useCallback(() => {
    const newState = !orderBookPanelOpen;
    setOrderBookPanelOpen(newState);
    if (onOrderBookToggle) {
      onOrderBookToggle(newState);
    }
  }, [orderBookPanelOpen, onOrderBookToggle]);

  const handleOrderBookClose = useCallback(() => {
    setOrderBookPanelOpen(false);
    if (onOrderBookToggle) {
      onOrderBookToggle(false);
    }
  }, [onOrderBookToggle]);

  return (
    <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'row' }}>
      {/* Creator Transactions Panel - Always render but conditionally show */}
      {!isMobile && (
        <CreatorTransactionsDialog
          open={creatorTxOpen}
          onClose={handleCreatorTxToggle}
          creatorAddress={token?.creator}
          tokenName={token?.name}
          onLatestTransaction={setLatestCreatorTx}
          onSelectTransaction={handleSelectTransaction}
        />
      )}
      
      {/* Main Content Area */}
      <Box 
        sx={{ 
          flex: 1,
          minWidth: 0, // Prevent content overflow
          pr: {
            md: (txDetailsOpen && orderBookPanelOpen) ? '520px' : 
                txDetailsOpen ? '256px' : 
                orderBookPanelOpen ? '280px' : 0,
            lg: (txDetailsOpen && orderBookPanelOpen) ? '576px' : 
                txDetailsOpen ? '272px' : 
                orderBookPanelOpen ? '320px' : 0,
            xl: (txDetailsOpen && orderBookPanelOpen) ? '632px' : 
                txDetailsOpen ? '288px' : 
                orderBookPanelOpen ? '360px' : 0
          },
          pl: {
            md: creatorTxOpen ? '240px' : 0,
            lg: creatorTxOpen ? '256px' : 0,
            xl: creatorTxOpen ? '272px' : 0
          }
        }}
      >
        {!isMobile && <LinkCascade token={token} />}
        
        <TokenSummary 
          token={token} 
          onCreatorTxToggle={handleCreatorTxToggle}
          creatorTxOpen={creatorTxOpen}
          latestCreatorTx={latestCreatorTx}
          setLatestCreatorTx={setLatestCreatorTx}
        />

        {!isMobile && (
          <Divider orientation="horizontal" sx={{ mt: 2, mb: 2 }} variant="middle" flexItem />
        )}

        <div id="back-to-top-tab-anchor" />

        <Overview 
          token={token} 
          onTransactionClick={handleSelectTransaction}
          onOrderBookToggle={handleOrderBookToggle}
          orderBookOpen={orderBookPanelOpen}
          onOrderBookData={(data) => setOrderBookData((prev) => ({ ...prev, ...data }))}
        />
      </Box>
      
      {/* Transaction Details Panel - Right Sidebar (Closest to content) */}
      {!isMobile && (
        <TransactionDetailsPanel
          open={txDetailsOpen}
          onClose={handleTxDetailsClose}
          transactionHash={selectedTxHash}
          onSelectTransaction={handleSelectTransaction}
        />
      )}
      
      {/* OrderBook Panel - Right Sidebar (Outermost) */}
      {!isMobile && (
        <OrderBookPanel
          open={orderBookPanelOpen}
          onClose={handleOrderBookClose}
          pair={orderBookData.pair}
          asks={orderBookData.asks}
          bids={orderBookData.bids}
          limitPrice={orderBookData.limitPrice}
          isBuyOrder={orderBookData.isBuyOrder}
          onAskClick={orderBookData.onAskClick}
          onBidClick={orderBookData.onBidClick}
          isSecondary={txDetailsOpen}
          autoShiftContent={false}
        />
      )}
    </Box>
  );
});

TokenDetail.displayName = 'TokenDetail';

export default TokenDetail;
