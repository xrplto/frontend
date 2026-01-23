import { useContext, useState, useEffect, useCallback, memo } from 'react';

// Components
import { AppContext } from 'src/context/AppContext';
import Overview from './tabs/overview';
import TokenTabs from './components/TokenTabs';
import { addTokenToTabs } from 'src/hooks/useTokenTabs';

const TokenDetail = memo(
  ({ token, onTransactionPanelToggle, transactionPanelOpen, onOrderBookToggle, orderBookOpen }) => {
    const { themeName } = useContext(AppContext);
    const isDark = themeName === 'XrplToDarkTheme';
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 960;

    // Add current token to tabs on mount
    useEffect(() => {
      if (token?.md5 && token?.slug) {
        addTokenToTabs(token);
      }
    }, [token?.md5, token?.slug]);
    const [selectedTxHash, setSelectedTxHash] = useState(null);
    const [selectedTradeAccount, setSelectedTradeAccount] = useState(null);
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
      setTxDetailsOpen(transactionPanelOpen || false);
    }, [transactionPanelOpen]);

    useEffect(() => {
      if (orderBookOpen !== undefined) {
        setPanelMode(orderBookOpen ? 'orderbook' : 'transaction');
        setTxDetailsOpen(!!orderBookOpen);
      }
    }, [orderBookOpen]);

    // Handle transaction selection
    const handleSelectTransaction = useCallback(
      (hash, tradeAccount = null) => {
        requestAnimationFrame(() => {
          setSelectedTxHash(hash);
          setSelectedTradeAccount(tradeAccount);
          setPanelMode('transaction');
          setTxDetailsOpen(true);
          if (onTransactionPanelToggle) {
            onTransactionPanelToggle(true);
          }
          if (onOrderBookToggle) {
            onOrderBookToggle(false);
          }
        });
      },
      [onTransactionPanelToggle, onOrderBookToggle]
    );

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

    // Handle orderbook data updates from Swap component
    const handleOrderBookData = useCallback((data) => {
      setOrderBookData((prev) => ({ ...prev, ...data }));
    }, []);

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

    return (
      <div className="relative">
        {/* Token Tabs - Full Width */}
        {!isMobile && <TokenTabs currentMd5={token?.md5} />}

        <div id="back-to-top-tab-anchor" />

        <Overview
          token={token}
          onTransactionClick={handleSelectTransaction}
          onOrderBookToggle={handleOrderBookToggle}
          orderBookOpen={txDetailsOpen && panelMode === 'orderbook'}
          onOrderBookData={handleOrderBookData}
        />
      </div>
    );
  }
);

TokenDetail.displayName = 'TokenDetail';

export default TokenDetail;
