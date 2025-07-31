import dynamic from 'next/dynamic';
import { useContext, useState, useEffect } from 'react';

// Material
import { Box, Divider, useTheme, useMediaQuery } from '@mui/material';

// Components
import LinkCascade from './LinkCascade';
import TokenSummary from './common/TokenSummary';
import CreatorTransactionsDialog from './common/CreatorTransactionsDialog';
import { AppContext } from 'src/AppContext';

// Lazy load components
const Overview = dynamic(() => import('./overview'));

export default function TokenDetail({ token, onCreatorPanelToggle, creatorPanelOpen }) {
  const { darkMode } = useContext(AppContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [creatorTxOpen, setCreatorTxOpen] = useState(creatorPanelOpen || false);
  const [latestCreatorTx, setLatestCreatorTx] = useState(null);

  // Sync internal state with parent
  useEffect(() => {
    setCreatorTxOpen(creatorPanelOpen || false);
  }, [creatorPanelOpen]);

  // Notify parent when state changes
  const handleCreatorTxToggle = () => {
    const newState = !creatorTxOpen;
    setCreatorTxOpen(newState);
    if (onCreatorPanelToggle) {
      onCreatorPanelToggle(newState);
    }
  };

  return (
    <Box sx={{ position: 'relative', display: 'flex' }}>
      {/* Creator Transactions Panel - Fixed Sidebar */}
      {!isMobile && (
        <CreatorTransactionsDialog
          open={creatorTxOpen}
          onClose={handleCreatorTxToggle}
          creatorAddress={token?.creator}
          tokenName={token?.name}
          onLatestTransaction={setLatestCreatorTx}
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

        <Overview token={token} />
      </Box>
    </Box>
  );
}