import dynamic from 'next/dynamic';
import { useContext, useState, useEffect, useCallback, memo } from 'react';

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

const TokenDetail = memo(({ token, onCreatorPanelToggle, creatorPanelOpen, onTransactionPanelToggle, transactionPanelOpen, onOrderBookToggle, orderBookOpen }) => {
  const { darkMode } = useContext(AppContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [creatorTxOpen, setCreatorTxOpen] = useState(creatorPanelOpen || false);
  const [latestCreatorTx, setLatestCreatorTx] = useState(null);
  const [selectedTxHash, setSelectedTxHash] = useState(null);
  const [txDetailsOpen, setTxDetailsOpen] = useState(transactionPanelOpen || false);
  const [panelMode, setPanelMode] = useState('transaction');
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
    if (orderBookOpen !== undefined) {
      setPanelMode(orderBookOpen ? 'orderbook' : 'transaction');
      setTxDetailsOpen(!!orderBookOpen);
    }
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
    setPanelMode('transaction');
    setTxDetailsOpen(true);
    if (onTransactionPanelToggle) {
      onTransactionPanelToggle(true);
    }
    if (onOrderBookToggle) {
      onOrderBookToggle(false);
    }
  }, [onTransactionPanelToggle, onOrderBookToggle]);

  // Handle transaction details close
  const handleTxDetailsClose = useCallback(() => {
    setTxDetailsOpen(false);
    setPanelMode('transaction');
    if (onTransactionPanelToggle) {
      onTransactionPanelToggle(false);
    }
  }, [onTransactionPanelToggle]);

  // Handle orderbook panel toggle
  const handleOrderBookToggle = useCallback(() => {
    const isOpen = txDetailsOpen && panelMode === 'orderbook';
    const newState = !isOpen;
    setPanelMode('orderbook');
    setTxDetailsOpen(newState);
    if (onOrderBookToggle) onOrderBookToggle(newState);
    if (onTransactionPanelToggle) onTransactionPanelToggle(newState);
  }, [txDetailsOpen, panelMode, onOrderBookToggle, onTransactionPanelToggle]);

  // No separate OrderBook panel anymore; handled inside TransactionDetailsPanel

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
            md: txDetailsOpen ? (panelMode === 'orderbook' ? '288px' : '256px') : 0,
            lg: txDetailsOpen ? (panelMode === 'orderbook' ? '328px' : '272px') : 0,
            xl: txDetailsOpen ? (panelMode === 'orderbook' ? '368px' : '288px') : 0
          },
          pl: {
            md: creatorTxOpen ? '240px' : 0,
            lg: creatorTxOpen ? '256px' : 0,
            xl: creatorTxOpen ? '272px' : 0
          }
        }}
      >
        {!isMobile && <LinkCascade token={token} />}
        
        <Box sx={{ pr: { md: (txDetailsOpen && panelMode === 'orderbook') ? 0.75 : 1.5, lg: (txDetailsOpen && panelMode === 'orderbook') ? 1 : 2 } }}>
          <TokenSummary 
            token={token} 
            onCreatorTxToggle={handleCreatorTxToggle}
            creatorTxOpen={creatorTxOpen}
            latestCreatorTx={latestCreatorTx}
            setLatestCreatorTx={setLatestCreatorTx}
          />
        </Box>

        {!isMobile && (
          <Divider orientation="horizontal" sx={{ mt: 2, mb: 2 }} variant="middle" flexItem />
        )}

        <div id="back-to-top-tab-anchor" />

        <Overview 
          token={token} 
          onTransactionClick={handleSelectTransaction}
          onOrderBookToggle={handleOrderBookToggle}
          orderBookOpen={txDetailsOpen && panelMode === 'orderbook'}
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
          mode={panelMode}
          pair={orderBookData.pair}
          asks={orderBookData.asks}
          bids={orderBookData.bids}
          limitPrice={orderBookData.limitPrice}
          isBuyOrder={orderBookData.isBuyOrder}
          onAskClick={orderBookData.onAskClick}
          onBidClick={orderBookData.onBidClick}
        />
      )}
      
      {/* OrderBook now renders inside TransactionDetailsPanel (mode === 'orderbook') */}
    </Box>
  );
});

TokenDetail.displayName = 'TokenDetail';

export default TokenDetail;
