import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { Zap, Clock, Hash, Layers, ChevronRight, Search, X } from 'lucide-react';

// Transaction type categories with colors (per xrpl.org/docs/references/protocol/transactions/types)
const TX_CATEGORIES = {
  Payment: { color: '#22c55e', label: 'Payment' },
  Dex: { color: '#3b82f6', label: 'DEX' },
  NFT: { color: '#a855f7', label: 'NFT' },
  Account: { color: '#f59e0b', label: 'Account' },
  Pseudo: { color: '#6b7280', label: 'Pseudo-Tx' },
  Other: { color: '#64748b', label: 'Other' }
};

// Map transaction types to categories
const getTxCategory = (txType) => {
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

  if (txType === 'Payment') return 'Payment';
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

// Transaction bar that lazy-loads real data
const TransactionBar = ({ ledgerIndex, txnCount, isDark, watchAddress, onAddressMatch }) => {
  const [txSequence, setTxSequence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matchCount, setMatchCount] = useState(0);

  useEffect(() => {
    if (!ledgerIndex || txnCount === 0) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    fetch(`https://api.xrpscan.com/api/v1/ledger/${ledgerIndex}/transactions`, {
      signal: controller.signal
    })
      .then(res => res.json())
      .then(transactions => {
        if (Array.isArray(transactions)) {
          // Sort by TransactionIndex
          const sorted = transactions.sort(
            (a, b) => (a.meta?.TransactionIndex || 0) - (b.meta?.TransactionIndex || 0)
          );

          // Check if address is involved in transaction
          const isAddressInvolved = (tx, addr) => {
            if (!addr) return false;
            return tx.Account === addr || tx.Destination === addr ||
              tx.Owner === addr || tx.Issuer === addr;
          };

          // Map to categories, highlight watched address
          const sequence = sorted.map(tx => ({
            category: getTxCategory(tx.TransactionType),
            matched: watchAddress ? isAddressInvolved(tx, watchAddress) : false,
            hash: tx.hash
          }));

          const matches = sequence.filter(s => s.matched).length;
          setMatchCount(matches);
          setTxSequence(sequence);
          if (matches > 0 && onAddressMatch) {
            onAddressMatch(ledgerIndex, matches);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [ledgerIndex, txnCount, watchAddress, onAddressMatch]);

  if (txnCount === 0) return null;

  // Loading skeleton
  if (loading) {
    return (
      <div className={cn(
        "h-1.5 rounded-full overflow-hidden animate-pulse",
        isDark ? "bg-white/10" : "bg-gray-200"
      )} />
    );
  }

  if (!txSequence || txSequence.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="h-1.5 rounded-full overflow-hidden flex">
        {txSequence.map((item, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              backgroundColor: item.matched ? '#fff' : (TX_CATEGORIES[item.category]?.color || TX_CATEGORIES.Other.color),
              boxShadow: item.matched ? '0 0 4px #fff' : 'none'
            }}
            className="h-full"
          />
        ))}
      </div>
      {watchAddress && matchCount > 0 && (
        <p className="text-[10px] text-primary font-medium">{matchCount} tx from watched address</p>
      )}
    </div>
  );
};

// Address filter input
const AddressFilter = ({ value, onChange, isDark }) => {
  const [input, setInput] = useState(value);

  const handleSubmit = (e) => {
    e.preventDefault();
    onChange(input.trim());
  };

  const handleClear = () => {
    setInput('');
    onChange('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search size={14} className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2",
          isDark ? "text-white/40" : "text-gray-400"
        )} />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Watch address (r...)"
          className={cn(
            "w-full pl-9 pr-8 py-2 text-[13px] rounded-lg border-[1.5px] outline-none transition-colors",
            isDark
              ? "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary"
              : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary"
          )}
        />
        {input && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded",
              isDark ? "text-white/40 hover:text-white" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <X size={14} />
          </button>
        )}
      </div>
      <button
        type="submit"
        className={cn(
          "px-4 py-2 text-[13px] rounded-lg border-[1.5px] transition-colors",
          isDark
            ? "border-primary/50 text-primary hover:bg-primary/10"
            : "border-primary/50 text-primary hover:bg-primary/5"
        )}
      >
        Watch
      </button>
    </form>
  );
};

// Single ledger card in the stream
const LedgerCard = ({ ledger, isDark, isLatest, watchAddress }) => {
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

          {/* Transaction bar - lazy loads real data */}
          <TransactionBar
            ledgerIndex={ledger.ledger_index}
            txnCount={totalTx}
            isDark={isDark}
            watchAddress={watchAddress}
          />
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

  const reserveBase = latestLedger.reserve_base / 1000000;
  const reserveInc = latestLedger.reserve_inc / 1000000;

  const stats = [
    { label: 'Base Reserve', value: `${reserveBase} XRP` },
    { label: 'Owner Reserve', value: `${reserveInc} XRP` },
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
  const [watchAddress, setWatchAddress] = useState('');
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

        const ledger = {
          ledger_index: data.ledger_index,
          ledger_hash: data.ledger_hash,
          close_time: data.close_time,
          txn_count: data.txn_count,
          reserve_base: data.reserve_base,
          reserve_inc: data.reserve_inc,
          fee_base: data.fee_base,
          validated: data.validated
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

        {/* Legend + Address Filter */}
        <div className={cn(
          "p-3 rounded-xl border-[1.5px] mb-4 space-y-3",
          isDark ? "border-white/10" : "border-gray-200"
        )}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <ColorLegend isDark={isDark} />
            <div className="w-full sm:w-80">
              <AddressFilter value={watchAddress} onChange={setWatchAddress} isDark={isDark} />
            </div>
          </div>
          {watchAddress && (
            <p className={cn("text-[11px]", isDark ? "text-white/50" : "text-gray-500")}>
              Watching: <span className="font-mono text-primary">{watchAddress}</span>
            </p>
          )}
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
                watchAddress={watchAddress}
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
