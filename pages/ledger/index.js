import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { Zap, Clock, Hash, Layers, ChevronRight } from 'lucide-react';

// Transaction type categories with colors
const TX_CATEGORIES = {
  Payment: { color: '#22c55e', label: 'Payment' },
  Dex: { color: '#3b82f6', label: 'DEX' },
  NFT: { color: '#a855f7', label: 'NFT' },
  Account: { color: '#f59e0b', label: 'Account' },
  Pseudo: { color: '#6b7280', label: 'Pseudo-Tx' },
  Other: { color: '#64748b', label: 'Other' }
};

// Map transaction types to categories (per xrpl.org/docs/references/protocol/transactions/types)
const getTxCategory = (txType) => {
  const paymentTypes = ['Payment'];
  const dexTypes = [
    'OfferCreate', 'OfferCancel', 'TrustSet',
    'AMMCreate', 'AMMDeposit', 'AMMWithdraw', 'AMMBid', 'AMMVote', 'AMMDelete', 'AMMClawback',
    'Clawback', 'MPTokenAuthorize', 'MPTokenIssuanceCreate', 'MPTokenIssuanceDestroy', 'MPTokenIssuanceSet'
  ];
  const nftTypes = ['NFTokenMint', 'NFTokenBurn', 'NFTokenCreateOffer', 'NFTokenCancelOffer', 'NFTokenAcceptOffer', 'NFTokenModify'];
  const accountTypes = [
    'AccountSet', 'AccountDelete', 'SignerListSet', 'DepositPreauth', 'DelegateSet',
    'DIDSet', 'DIDDelete', 'CredentialCreate', 'CredentialAccept', 'CredentialDelete', 'TicketCreate'
  ];
  const pseudoTypes = ['EnableAmendment', 'SetFee', 'UNLModify'];
  // Other: CheckCreate, CheckCash, CheckCancel, EscrowCreate, EscrowFinish, EscrowCancel,
  // XChain*, Batch, LedgerStateFix

  if (paymentTypes.includes(txType)) return 'Payment';
  if (dexTypes.includes(txType)) return 'Dex';
  if (nftTypes.includes(txType)) return 'NFT';
  if (accountTypes.includes(txType)) return 'Account';
  if (pseudoTypes.includes(txType)) return 'Pseudo';
  return 'Other';
};

// Color legend component
const ColorLegend = ({ isDark }) => (
  <div className="flex flex-wrap gap-3 sm:gap-4">
    {Object.entries(TX_CATEGORIES).map(([key, { color, label }]) => (
      <div key={key} className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className={cn("text-[11px]", isDark ? "text-white/50" : "text-gray-500")}>{label}</span>
      </div>
    ))}
  </div>
);

// Single ledger card in the stream
const LedgerCard = ({ ledger, isDark, isLatest }) => {
  const txCounts = ledger.txCounts || {};
  const totalTx = ledger.txn_count || 0;

  return (
    <div className={cn(
      "relative p-4 rounded-xl border-[1.5px] transition-all duration-300",
      isLatest && "ring-1 ring-primary/30",
      isDark
        ? "border-white/10 bg-white/[0.02]"
        : "border-gray-200 bg-gray-50/50"
    )}>
      {isLatest && (
        <div className="absolute -top-2 left-4">
          <span className={cn(
            "px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-full",
            "bg-primary text-white"
          )}>
            Latest
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Layers size={14} className="text-primary" />
            <a
              href={`/ledger/${ledger.ledger_index}`}
              className={cn(
                "text-[15px] font-medium hover:text-primary transition-colors",
                isDark ? "text-white" : "text-gray-900"
              )}
            >
              #{ledger.ledger_index?.toLocaleString()}
            </a>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1">
              <Clock size={12} className={isDark ? "text-white/40" : "text-gray-400"} />
              <span className={cn("text-[11px]", isDark ? "text-white/50" : "text-gray-500")}>
                {new Date(ledger.close_time).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Zap size={12} className={isDark ? "text-white/40" : "text-gray-400"} />
              <span className={cn("text-[11px]", isDark ? "text-white/50" : "text-gray-500")}>
                {totalTx} txns
              </span>
            </div>
          </div>

          {/* Transaction type distribution bar */}
          {totalTx > 0 && (
            <div className="h-1.5 rounded-full overflow-hidden flex bg-black/10">
              {Object.entries(TX_CATEGORIES).map(([key, { color }]) => {
                const count = txCounts[key] || 0;
                const pct = (count / totalTx) * 100;
                if (pct === 0) return null;
                return (
                  <div
                    key={key}
                    style={{ width: `${pct}%`, backgroundColor: color }}
                    className="h-full transition-all duration-300"
                    title={`${TX_CATEGORIES[key].label}: ${count}`}
                  />
                );
              })}
            </div>
          )}
        </div>

        <a
          href={`/ledger/${ledger.ledger_index}`}
          className={cn(
            "p-2 rounded-lg border-[1.5px] transition-colors",
            isDark
              ? "border-white/10 hover:border-primary hover:bg-primary/5"
              : "border-gray-200 hover:border-primary hover:bg-primary/5"
          )}
        >
          <ChevronRight size={14} className={isDark ? "text-white/60" : "text-gray-400"} />
        </a>
      </div>

      {/* Hash preview */}
      <div className={cn(
        "mt-3 pt-3 border-t flex items-center gap-1.5",
        isDark ? "border-white/5" : "border-gray-100"
      )}>
        <Hash size={10} className={isDark ? "text-white/30" : "text-gray-300"} />
        <span className={cn(
          "text-[10px] font-mono truncate",
          isDark ? "text-white/30" : "text-gray-400"
        )}>
          {ledger.ledger_hash}
        </span>
      </div>
    </div>
  );
};

// Stats bar at the top
const StatsBar = ({ latestLedger, isDark }) => {
  if (!latestLedger) return null;

  const stats = [
    { label: 'Reserve', value: `${(latestLedger.reserve_base / 1000000).toFixed(0)} XRP` },
    { label: 'Owner Reserve', value: `${(latestLedger.reserve_inc / 1000000).toFixed(0)} XRP` },
    { label: 'Base Fee', value: `${latestLedger.fee_base} drops` }
  ];

  return (
    <div className={cn(
      "flex flex-wrap gap-4 sm:gap-6 p-4 rounded-xl border-[1.5px] mb-4",
      isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50/50"
    )}>
      {stats.map(({ label, value }) => (
        <div key={label}>
          <p className={cn("text-[10px] uppercase tracking-wider mb-0.5", isDark ? "text-white/40" : "text-gray-400")}>
            {label}
          </p>
          <p className={cn("text-[13px] font-medium", isDark ? "text-white" : "text-gray-900")}>
            {value}
          </p>
        </div>
      ))}
    </div>
  );
};

// Connection status indicator
const ConnectionStatus = ({ status, isDark }) => {
  const statusConfig = {
    connecting: { color: 'bg-yellow-500', text: 'Connecting...' },
    connected: { color: 'bg-green-500', text: 'Live' },
    disconnected: { color: 'bg-red-500', text: 'Disconnected' }
  };

  const config = statusConfig[status] || statusConfig.disconnected;

  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("w-1.5 h-1.5 rounded-full", config.color, status === 'connected' && "animate-pulse")} />
      <span className={cn("text-[11px]", isDark ? "text-white/50" : "text-gray-500")}>
        {config.text}
      </span>
    </div>
  );
};

const LedgerStreamPage = () => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const [ledgers, setLedgers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');
    const ws = new WebSocket('wss://api.xrpl.to/ws/ledger');

    ws.onopen = () => {
      setConnectionStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Skip pong messages
        if (data.type === 'pong') return;

        // Generate random tx distribution for demo (since we don't have actual tx breakdown)
        const totalTx = data.txn_count || 0;
        const txCounts = {};
        if (totalTx > 0) {
          let remaining = totalTx;
          const categories = ['Payment', 'Dex', 'NFT', 'Account', 'Pseudo', 'Other'];
          categories.forEach((cat, i) => {
            if (i === categories.length - 1) {
              txCounts[cat] = remaining;
            } else {
              const max = Math.floor(remaining * 0.6);
              const count = Math.floor(Math.random() * max);
              txCounts[cat] = count;
              remaining -= count;
            }
          });
        }

        const ledger = {
          ledger_index: data.ledger_index,
          ledger_hash: data.ledger_hash,
          close_time: data.close_time,
          txn_count: data.txn_count,
          reserve_base: data.reserve_base,
          reserve_inc: data.reserve_inc,
          fee_base: data.fee_base,
          validated: data.validated,
          txCounts
        };

        setLedgers(prev => {
          // Avoid duplicates
          if (prev.some(l => l.ledger_index === ledger.ledger_index)) {
            return prev;
          }
          // Keep last 20 ledgers
          const updated = [ledger, ...prev].slice(0, 20);
          return updated;
        });
      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;

    // Keep-alive ping
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => clearInterval(pingInterval);
  }, []);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1 py-6 max-w-[1920px] mx-auto w-full px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className={cn("text-xl font-medium mb-1", isDark ? "text-white" : "text-gray-900")}>
              Ledger Stream
            </h1>
            <p className={cn("text-[13px]", isDark ? "text-white/50" : "text-gray-500")}>
              Real-time XRP Ledger updates
            </p>
          </div>
          <ConnectionStatus status={connectionStatus} isDark={isDark} />
        </div>

        {/* Legend */}
        <div className={cn(
          "p-3 rounded-xl border-[1.5px] mb-4",
          isDark ? "border-white/10" : "border-gray-200"
        )}>
          <ColorLegend isDark={isDark} />
        </div>

        {/* Stats */}
        {ledgers.length > 0 && (
          <StatsBar latestLedger={ledgers[0]} isDark={isDark} />
        )}

        {/* Ledger stream */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {ledgers.length === 0 ? (
            <div className={cn(
              "col-span-full p-8 rounded-xl border-[1.5px] text-center",
              isDark ? "border-white/10" : "border-gray-200"
            )}>
              <div className="animate-pulse">
                <Layers size={24} className={cn("mx-auto mb-2", isDark ? "text-white/30" : "text-gray-300")} />
                <p className={cn("text-[13px]", isDark ? "text-white/50" : "text-gray-500")}>
                  Waiting for ledgers...
                </p>
              </div>
            </div>
          ) : (
            ledgers.map((ledger, index) => (
              <LedgerCard
                key={ledger.ledger_index}
                ledger={ledger}
                isDark={isDark}
                isLatest={index === 0}
              />
            ))
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LedgerStreamPage;
