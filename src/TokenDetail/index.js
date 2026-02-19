import { useContext, useState, useEffect, useLayoutEffect, useCallback, memo } from 'react';

// Components
import { ThemeContext } from 'src/context/AppContext';
import Overview from './tabs/overview';
import TokenTabs from './components/TokenTabs';
import { addTokenToTabs } from 'src/hooks/useTokenTabs';

const TokenDetail = memo(
  ({ token, onTransactionPanelToggle, transactionPanelOpen }) => {
    const { themeName } = useContext(ThemeContext);
    const isDark = themeName === 'XrplToDarkTheme';
    const [isMobile, setIsMobile] = useState(false);
    // useLayoutEffect prevents CLS from layout flip before paint
    const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
    useIsomorphicLayoutEffect(() => {
      setIsMobile(window.innerWidth < 960);
    }, []);

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

    // Sync internal state with parent
    useEffect(() => {
      setTxDetailsOpen(transactionPanelOpen || false);
    }, [transactionPanelOpen]);

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
        });
      },
      [onTransactionPanelToggle]
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

    return (
      <div className="relative">
        {/* Token Tabs - Full Width */}
        {!isMobile && <TokenTabs currentMd5={token?.md5} />}

        <div id="back-to-top-tab-anchor" />

        <Overview
          token={token}
          onTransactionClick={handleSelectTransaction}
        />
      </div>
    );
  }
);

TokenDetail.displayName = 'TokenDetail';

export default TokenDetail;
