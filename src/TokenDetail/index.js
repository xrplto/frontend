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

const TokenDetail = memo(({ token, onCreatorPanelToggle, creatorPanelOpen, onTransactionPanelToggle, transactionPanelOpen }) => {
  const { darkMode } = useContext(AppContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [creatorTxOpen, setCreatorTxOpen] = useState(creatorPanelOpen || false);
  const [latestCreatorTx, setLatestCreatorTx] = useState(null);
  const [selectedTxHash, setSelectedTxHash] = useState(null);
  const [txDetailsOpen, setTxDetailsOpen] = useState(transactionPanelOpen || false);

  // Sync internal state with parent
  useEffect(() => {
    setCreatorTxOpen(creatorPanelOpen || false);
  }, [creatorPanelOpen]);

  useEffect(() => {
    setTxDetailsOpen(transactionPanelOpen || false);
  }, [transactionPanelOpen]);

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

  return (
    <Box sx={{ position: 'relative', display: 'flex' }}>
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
          minWidth: 0 // Prevent content overflow
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

        <Overview token={token} onTransactionClick={handleSelectTransaction} />
      </Box>
      
      {/* Transaction Details Panel - Right Sidebar */}
      {!isMobile && txDetailsOpen && (
        <TransactionDetailsPanel
          open={txDetailsOpen}
          onClose={handleTxDetailsClose}
          transactionHash={selectedTxHash}
          onSelectTransaction={handleSelectTransaction}
        />
      )}
    </Box>
  );
});

TokenDetail.displayName = 'TokenDetail';

export default TokenDetail;