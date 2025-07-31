import dynamic from 'next/dynamic';
import { useContext, useState, useEffect } from 'react';

// Material
import { Box, Divider, useTheme, useMediaQuery } from '@mui/material';

// Components
import LinkCascade from './LinkCascade';
import TokenSummary from './common/TokenSummary';
import CreatorTransactionsDialog from './common/CreatorTransactionsDialog';
import TransactionDetailsPanel from './common/TransactionDetailsPanel';
import { AppContext } from 'src/AppContext';

// Lazy load components
const Overview = dynamic(() => import('./overview'));

export default function TokenDetail({ token, onCreatorPanelToggle, creatorPanelOpen, onTransactionPanelToggle, transactionPanelOpen }) {
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

  // Notify parent when state changes
  const handleCreatorTxToggle = () => {
    const newState = !creatorTxOpen;
    setCreatorTxOpen(newState);
    if (onCreatorPanelToggle) {
      onCreatorPanelToggle(newState);
    }
  };

  // Handle transaction selection
  const handleSelectTransaction = (hash) => {
    setSelectedTxHash(hash);
    setTxDetailsOpen(true);
    if (onTransactionPanelToggle) {
      onTransactionPanelToggle(true);
    }
  };

  // Handle transaction details close
  const handleTxDetailsClose = () => {
    setTxDetailsOpen(false);
    if (onTransactionPanelToggle) {
      onTransactionPanelToggle(false);
    }
  };

  return (
    <Box sx={{ position: 'relative', display: 'flex' }}>
      {/* Creator Transactions Panel - Left Sidebar */}
      {!isMobile && creatorTxOpen && (
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
}