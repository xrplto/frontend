import { useContext, useState, useEffect, useCallback, memo } from 'react';

// Components
import { AppContext } from 'src/AppContext';
import Overview from './tabs/overview';
import LinkCascade from './components/LinkCascade';
import TokenSummary from './components/TokenSummary';
import CreatorTransactionsDialog from './dialogs/CreatorTransactionsDialog';
import TransactionDetailsPanel from './dialogs/TransactionDetailsPanel';
import { cn } from 'src/utils/cn';

const TokenDetail = memo(
  ({
    token,
    onCreatorPanelToggle,
    creatorPanelOpen,
    onTransactionPanelToggle,
    transactionPanelOpen,
    onOrderBookToggle,
    orderBookOpen,
    notificationPanelOpen
  }) => {
    const { themeName } = useContext(AppContext);
    const isDark = themeName === 'XrplToDarkTheme';
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 960;
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

    // Memoize callback functions to prevent re-renders - batched updates
    const handleCreatorTxToggle = useCallback(() => {
      const newState = !creatorTxOpen;

      // Batch state updates
      requestAnimationFrame(() => {
        setCreatorTxOpen(newState);
        if (onCreatorPanelToggle) {
          onCreatorPanelToggle(newState);
        }
      });
    }, [creatorTxOpen, onCreatorPanelToggle]);

    // Handle transaction selection
    const handleSelectTransaction = useCallback((hash) => {
      requestAnimationFrame(() => {
        setSelectedTxHash(hash);
        setPanelMode('transaction');
        setTxDetailsOpen(true);
        if (onTransactionPanelToggle) {
          onTransactionPanelToggle(true);
        }
        if (onOrderBookToggle) {
          onOrderBookToggle(false);
        }
      });
    }, [onTransactionPanelToggle, onOrderBookToggle]);

    // Handle transaction details close - batched updates
    const handleTxDetailsClose = useCallback(() => {
      requestAnimationFrame(() => {
        setTxDetailsOpen(false);
        setPanelMode('transaction');
        if (onTransactionPanelToggle) {
          onTransactionPanelToggle(false);
        }
      });
    }, [onTransactionPanelToggle]);

    // Handle orderbook panel toggle - batched updates
    const handleOrderBookToggle = useCallback(() => {
      const isOpen = txDetailsOpen && panelMode === 'orderbook';
      const newState = !isOpen;

      // Batch state updates to prevent multiple renders
      requestAnimationFrame(() => {
        setPanelMode('orderbook');
        setTxDetailsOpen(newState);
        if (onOrderBookToggle) onOrderBookToggle(newState);
        if (onTransactionPanelToggle) onTransactionPanelToggle(newState);
      });
    }, [txDetailsOpen, panelMode, onOrderBookToggle, onTransactionPanelToggle]);

    // No separate OrderBook panel anymore; handled inside TransactionDetailsPanel

    return (
      <div className="relative flex flex-row">
        {/* Creator Transactions Panel - Only render when open to save memory */}
        {!isMobile && token?.creator && creatorTxOpen && (
          <CreatorTransactionsDialog
            open={creatorTxOpen}
            onClose={handleCreatorTxToggle}
            creatorAddress={token?.creator}
            tokenName={token?.name}
            onLatestTransaction={setLatestCreatorTx}
            onSelectTransaction={handleSelectTransaction}
            isDark={isDark}
          />
        )}

        {/* Main Content Area */}
        <div
          className={cn(
            "flex-1 min-w-0",
            !isMobile && txDetailsOpen && panelMode === 'orderbook' && "md:pr-[280px] lg:pr-[300px] xl:pr-[320px]",
            !isMobile && txDetailsOpen && panelMode !== 'orderbook' && "md:pr-[256px] lg:pr-[272px] xl:pr-[288px]",
            !isMobile && !txDetailsOpen && notificationPanelOpen && "md:pr-[320px] lg:pr-[360px] xl:pr-[380px]",
            !isMobile && creatorTxOpen && "md:pl-[240px] lg:pl-[256px] xl:pl-[272px]"
          )}
        >
          {!isMobile && <LinkCascade token={token} />}

          <div className="pr-0">
            <TokenSummary
              token={token}
              onCreatorTxToggle={handleCreatorTxToggle}
              creatorTxOpen={creatorTxOpen}
              latestCreatorTx={latestCreatorTx}
              setLatestCreatorTx={setLatestCreatorTx}
            />
          </div>

          {!isMobile && (
            <hr className={cn(
              "my-1 mx-4 border-t-[1.5px]",
              isDark ? "border-white/10" : "border-gray-200"
            )} />
          )}

          <div id="back-to-top-tab-anchor" />

          <Overview
            token={token}
            onTransactionClick={handleSelectTransaction}
            onOrderBookToggle={handleOrderBookToggle}
            orderBookOpen={txDetailsOpen && panelMode === 'orderbook'}
            onOrderBookData={(data) => setOrderBookData((prev) => ({ ...prev, ...data }))}
          />
        </div>

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
      </div>
    );
  }
);

TokenDetail.displayName = 'TokenDetail';

export default TokenDetail;
