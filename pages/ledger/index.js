import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { AppContext } from 'src/context/AppContext';
import { cn } from 'src/utils/cn';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import {
  Zap,
  Clock,
  Hash,
  Layers,
  ChevronRight,
  Search,
  X,
  Copy,
  Check,
  Volume2,
  VolumeX,
  ChevronDown,
  Share2
} from 'lucide-react';

// All XRPL transaction types
const ALL_TX_TYPES = [
  'Payment',
  'OfferCreate',
  'OfferCancel',
  'TrustSet',
  'AccountSet',
  'AccountDelete',
  'SetRegularKey',
  'SignerListSet',
  'DepositPreauth',
  'TicketCreate',
  'AMMCreate',
  'AMMDeposit',
  'AMMWithdraw',
  'AMMVote',
  'AMMBid',
  'AMMDelete',
  'AMMClawback',
  'NFTokenMint',
  'NFTokenBurn',
  'NFTokenCreateOffer',
  'NFTokenCancelOffer',
  'NFTokenAcceptOffer',
  'CheckCreate',
  'CheckCash',
  'CheckCancel',
  'EscrowCreate',
  'EscrowFinish',
  'EscrowCancel',
  'PaymentChannelCreate',
  'PaymentChannelFund',
  'PaymentChannelClaim',
  'Clawback',
  'DIDSet',
  'DIDDelete',
  'XChainCreateBridge',
  'XChainCommit',
  'XChainClaim',
  'XChainCreateClaimID',
  'EnableAmendment',
  'SetFee',
  'UNLModify'
];

// Transaction type categories with colors
const TX_CATEGORIES = {
  Payment: { color: '#22c55e', label: 'Payment' },
  Dex: { color: '#3b82f6', label: 'DEX' },
  NFT: { color: '#a855f7', label: 'NFT' },
  Account: { color: '#f59e0b', label: 'Account' },
  Pseudo: { color: '#6b7280', label: 'Pseudo-Tx' },
  Other: { color: '#64748b', label: 'Other' }
};

// Action types with shapes
const TX_ACTIONS = {
  Create: { shape: 'circle', label: 'Create' },
  Modify: { shape: 'square', label: 'Modify' },
  Finish: { shape: 'triangle', label: 'Finish' },
  Cancel: { shape: 'x', label: 'Cancel' },
  Send: { shape: 'arrow', label: 'Send' }
};

const getTxAction = (txType) => {
  const createTypes = [
    'OfferCreate',
    'NFTokenCreateOffer',
    'NFTokenMint',
    'AMMCreate',
    'CheckCreate',
    'EscrowCreate',
    'TicketCreate',
    'TrustSet'
  ];
  const modifyTypes = [
    'AccountSet',
    'AMMDeposit',
    'AMMWithdraw',
    'AMMVote',
    'AMMBid',
    'SignerListSet',
    'DepositPreauth'
  ];
  const finishTypes = ['NFTokenAcceptOffer', 'EscrowFinish', 'CheckCash'];
  const cancelTypes = [
    'OfferCancel',
    'NFTokenCancelOffer',
    'NFTokenBurn',
    'EscrowCancel',
    'CheckCancel',
    'AMMDelete',
    'AccountDelete'
  ];
  const sendTypes = ['Payment', 'Clawback'];

  if (createTypes.includes(txType)) return 'Create';
  if (modifyTypes.includes(txType)) return 'Modify';
  if (finishTypes.includes(txType)) return 'Finish';
  if (cancelTypes.includes(txType)) return 'Cancel';
  if (sendTypes.includes(txType)) return 'Send';
  return 'Modify';
};

const getTxCategory = (txType) => {
  if (txType === 'Payment') return 'Payment';
  if (
    [
      'OfferCreate',
      'OfferCancel',
      'TrustSet',
      'AMMCreate',
      'AMMDeposit',
      'AMMWithdraw',
      'AMMBid',
      'AMMVote',
      'AMMDelete',
      'Clawback'
    ].includes(txType)
  )
    return 'Dex';
  if (
    [
      'NFTokenMint',
      'NFTokenBurn',
      'NFTokenCreateOffer',
      'NFTokenCancelOffer',
      'NFTokenAcceptOffer'
    ].includes(txType)
  )
    return 'NFT';
  if (
    ['AccountSet', 'AccountDelete', 'SignerListSet', 'DepositPreauth', 'TicketCreate'].includes(
      txType
    )
  )
    return 'Account';
  if (['EnableAmendment', 'SetFee', 'UNLModify'].includes(txType)) return 'Pseudo';
  return 'Other';
};

// Shape SVG components
const ShapeIcon = ({ shape, size = 10, color = 'currentColor' }) => {
  const s = size;
  switch (shape) {
    case 'circle':
      return <circle cx={s / 2} cy={s / 2} r={s / 2 - 1} fill={color} />;
    case 'square':
      return <rect x={1} y={1} width={s - 2} height={s - 2} fill={color} />;
    case 'triangle':
      return <polygon points={`${s / 2},1 ${s - 1},${s - 1} 1,${s - 1}`} fill={color} />;
    case 'x':
      return (
        <path
          d={`M2,2 L${s - 2},${s - 2} M${s - 2},2 L2,${s - 2}`}
          stroke={color}
          strokeWidth={2}
          fill="none"
        />
      );
    case 'arrow':
      return (
        <path
          d={`M2,${s / 2} L${s - 2},${s / 2} M${s - 4},${s / 4} L${s - 2},${s / 2} L${s - 4},${(s * 3) / 4}`}
          stroke={color}
          strokeWidth={2}
          fill="none"
        />
      );
    default:
      return <circle cx={s / 2} cy={s / 2} r={s / 2 - 1} fill={color} />;
  }
};

// Copy button
const CopyButton = ({ text, isDark }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className={cn(
        'p-1 rounded transition-colors',
        isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
      )}
    >
      {copied ? (
        <Check size={12} className="text-green-500" />
      ) : (
        <Copy size={12} className={isDark ? 'text-white/40' : 'text-gray-400'} />
      )}
    </button>
  );
};

// Play alert sound
const playAlertSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.1;
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {}
};

// Color legend
const ColorLegend = ({ isDark }) => (
  <div className="flex flex-wrap gap-3 sm:gap-4">
    {Object.entries(TX_CATEGORIES).map(([key, { color, label }]) => (
      <div key={key} className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className={cn('text-[11px]', isDark ? 'text-white/50' : 'text-gray-500')}>
          {label}
        </span>
      </div>
    ))}
  </div>
);

// Shapes legend
const ShapesLegend = ({ isDark }) => (
  <div className="flex flex-wrap gap-3 sm:gap-4">
    {Object.entries(TX_ACTIONS).map(([key, { shape, label }]) => (
      <div key={key} className="flex items-center gap-1.5">
        <svg width={10} height={10} className={isDark ? 'text-white/70' : 'text-gray-600'}>
          <ShapeIcon shape={shape} size={10} color="currentColor" />
        </svg>
        <span className={cn('text-[11px]', isDark ? 'text-white/50' : 'text-gray-500')}>
          {label}
        </span>
      </div>
    ))}
  </div>
);

// Transaction bar
const TransactionBar = ({
  ledgerIndex,
  txnCount,
  isDark,
  watchAddresses = [],
  watchTxType,
  onTypeMatch
}) => {
  const [txSequence, setTxSequence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matchCount, setMatchCount] = useState(0);
  const [typeMatchCount, setTypeMatchCount] = useState(0);
  const [txDistribution, setTxDistribution] = useState({});

  useEffect(() => {
    if (!ledgerIndex || txnCount === 0) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    fetch(`https://api.xrpl.to/v1/ledger/${ledgerIndex}?expand=true`, {
      signal: controller.signal
    })
      .then((res) => res.json())
      .then((data) => {
        const transactions = data?.transactions || [];
        if (Array.isArray(transactions)) {
          const sorted = transactions.sort(
            (a, b) => (a.meta?.TransactionIndex || 0) - (b.meta?.TransactionIndex || 0)
          );

          const isAddressInvolved = (tx) => {
            if (!watchAddresses.length) return false;
            const txData = tx.tx_json || tx;
            return watchAddresses.some(
              (addr) =>
                txData.Account === addr ||
                txData.Destination === addr ||
                txData.Owner === addr ||
                txData.Issuer === addr
            );
          };

          const sequence = sorted.map((tx) => {
            const txData = tx.tx_json || tx;
            return {
              category: getTxCategory(txData.TransactionType),
              txType: txData.TransactionType,
              matched: isAddressInvolved(tx),
              typeMatched: watchTxType ? txData.TransactionType === watchTxType : false
            };
          });

          const matches = sequence.filter((s) => s.matched).length;
          const typeMatches = sequence.filter((s) => s.typeMatched).length;
          setMatchCount(matches);
          setTypeMatchCount(typeMatches);
          setTxSequence(sequence);
          if (onTypeMatch) onTypeMatch(typeMatches);

          // Calculate distribution
          const dist = {};
          sequence.forEach((s) => {
            dist[s.category] = (dist[s.category] || 0) + 1;
          });
          setTxDistribution(dist);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setLoading(false);
      });

    return () => controller.abort();
  }, [ledgerIndex, txnCount, watchAddresses.join(','), watchTxType]);

  if (txnCount === 0) return null;

  if (loading) {
    return (
      <div className={cn('h-5 rounded-lg animate-pulse', isDark ? 'bg-white/10' : 'bg-gray-200')} />
    );
  }

  if (!txSequence || txSequence.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="h-2 rounded-full overflow-hidden flex">
        {txSequence.map((item, i) => {
          let bgColor = TX_CATEGORIES[item.category]?.color || TX_CATEGORIES.Other.color;
          let glow = 'none';
          if (item.typeMatched) {
            bgColor = '#facc15';
            glow = '0 0 6px #facc15';
          }
          if (item.matched) {
            bgColor = '#fff';
            glow = '0 0 6px #fff';
          }
          return (
            <div
              key={i}
              className="h-full"
              style={{
                flex: 1,
                backgroundColor: bgColor,
                boxShadow: glow,
                minWidth: 2
              }}
              title={`${item.txType} (${item.category})`}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(txDistribution)
          .slice(0, 4)
          .map(([cat, count]) => (
            <span
              key={cat}
              className="flex items-center gap-1 text-[10px]"
              style={{ color: TX_CATEGORIES[cat]?.color }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: TX_CATEGORIES[cat]?.color }}
              />
              {count}
            </span>
          ))}
        {watchAddresses.length > 0 && matchCount > 0 && (
          <span className="text-[10px] text-primary font-medium">{matchCount} watched</span>
        )}
        {watchTxType && typeMatchCount > 0 && (
          <span className="text-[10px] text-yellow-400 font-medium">
            {typeMatchCount} {watchTxType}
          </span>
        )}
      </div>
    </div>
  );
};

// Transaction type filter
const TxTypeFilter = ({ selected, onChange, isDark }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-[13px] rounded-lg border-[1.5px] transition-colors',
          selected
            ? 'border-primary bg-primary/10 text-primary'
            : isDark
              ? 'border-white/10 text-white/70 hover:border-white/20'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
        )}
      >
        <Layers size={14} />
        {selected || 'Filter by Tx Type'}
        {selected && (
          <X
            size={12}
            className="hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              setOpen(false);
            }}
          />
        )}
      </button>
      {open && (
        <div
          className={cn(
            'absolute top-full left-0 mt-1 w-56 max-h-64 overflow-y-auto rounded-lg border-[1.5px] shadow-lg z-50',
            isDark ? 'bg-black border-white/10' : 'bg-white border-gray-200'
          )}
        >
          {ALL_TX_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => {
                onChange(type);
                setOpen(false);
              }}
              className={cn(
                'w-full text-left px-3 py-2 text-[12px] transition-colors',
                selected === type
                  ? 'bg-primary/20 text-primary'
                  : isDark
                    ? 'text-white/70 hover:bg-white/5'
                    : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              {type}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Address filter
const AddressFilter = ({ value, onChange, isDark }) => {
  const [input, setInput] = useState(value);

  const handleSubmit = (e) => {
    e.preventDefault();
    onChange(input.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search
          size={14}
          className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2',
            isDark ? 'text-white/40' : 'text-gray-400'
          )}
        />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Watch addresses (comma-separated)"
          className={cn(
            'w-full pl-9 pr-8 py-2 text-[13px] rounded-lg border-[1.5px] outline-none transition-colors',
            isDark
              ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary'
              : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary'
          )}
        />
        {input && (
          <button
            type="button"
            onClick={() => {
              setInput('');
              onChange('');
            }}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded',
              isDark ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <X size={14} />
          </button>
        )}
      </div>
      <button
        type="submit"
        className={cn(
          'px-4 py-2 text-[13px] rounded-lg border-[1.5px] transition-colors',
          isDark
            ? 'border-primary/50 text-primary hover:bg-primary/10'
            : 'border-primary/50 text-primary hover:bg-primary/5'
        )}
      >
        Watch
      </button>
    </form>
  );
};

// Ledger card
const LedgerCard = ({ ledger, isDark, isLatest, watchAddresses = [], watchTxType }) => {
  const totalTx = ledger.txn_count || 0;
  const [hasTypeMatch, setHasTypeMatch] = useState(false);

  return (
    <div
      className={cn(
        'relative p-4 rounded-xl border-[1.5px] transition-all duration-300',
        isLatest && 'ring-1 ring-primary/30',
        hasTypeMatch && watchTxType && 'ring-2 ring-yellow-400/50 border-yellow-400/30',
        isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-gray-50/50'
      )}
    >
      {isLatest && (
        <div className="absolute -top-2 left-4">
          <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-full bg-primary text-white">
            Latest
          </span>
        </div>
      )}
      {hasTypeMatch && watchTxType && (
        <div className="absolute -top-2 right-4">
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-yellow-400 text-black">
            {watchTxType}
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
                'text-[15px] font-medium hover:text-primary transition-colors',
                isDark ? 'text-white' : 'text-gray-900'
              )}
            >
              #{ledger.ledger_index?.toLocaleString()}
            </a>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1">
              <Clock size={12} className={isDark ? 'text-white/40' : 'text-gray-400'} />
              <span className={cn('text-[11px]', isDark ? 'text-white/50' : 'text-gray-500')}>
                {new Date(ledger.close_time).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Zap size={12} className={isDark ? 'text-white/40' : 'text-gray-400'} />
              <span className={cn('text-[11px]', isDark ? 'text-white/50' : 'text-gray-500')}>
                {totalTx} txns
              </span>
            </div>
          </div>

          <TransactionBar
            ledgerIndex={ledger.ledger_index}
            txnCount={totalTx}
            isDark={isDark}
            watchAddresses={watchAddresses}
            watchTxType={watchTxType}
            onTypeMatch={(count) => setHasTypeMatch(count > 0)}
          />
        </div>

        <a
          href={`/ledger/${ledger.ledger_index}`}
          className={cn(
            'p-2 rounded-lg border-[1.5px] transition-colors',
            isDark
              ? 'border-white/10 hover:border-primary hover:bg-primary/5'
              : 'border-gray-200 hover:border-primary hover:bg-primary/5'
          )}
        >
          <ChevronRight size={14} className={isDark ? 'text-white/60' : 'text-gray-400'} />
        </a>
      </div>

      <div
        className={cn(
          'mt-3 pt-3 border-t flex items-center gap-1.5',
          isDark ? 'border-white/5' : 'border-gray-100'
        )}
      >
        <Hash size={10} className={isDark ? 'text-white/30' : 'text-gray-300'} />
        <span
          className={cn(
            'text-[10px] font-mono truncate',
            isDark ? 'text-white/30' : 'text-gray-400'
          )}
        >
          {ledger.ledger_hash}
        </span>
      </div>
    </div>
  );
};

// Stats bar
const StatsBar = ({ latestLedger, networkStats, isDark }) => {
  if (!latestLedger) return null;

  const reserveBase = latestLedger.reserve_base / 1000000;
  const reserveInc = latestLedger.reserve_inc / 1000000;

  const stats = [
    { label: 'TPS', value: networkStats.tps || '-', highlight: true },
    {
      label: 'Success Rate',
      value: networkStats.successRate ? `${networkStats.successRate}%` : '-',
      color:
        networkStats.successRate >= 95
          ? 'text-green-500'
          : networkStats.successRate >= 80
            ? 'text-yellow-500'
            : 'text-red-500'
    },
    { label: 'Avg Fee', value: networkStats.avgFee ? `${networkStats.avgFee} drops` : '-' },
    { label: 'Base Reserve', value: `${reserveBase} XRP` },
    { label: 'Owner Reserve', value: `${reserveInc} XRP` }
  ];

  return (
    <div
      className={cn(
        'flex flex-wrap gap-4 sm:gap-6 p-4 rounded-xl border-[1.5px] mb-4',
        isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-gray-50/50'
      )}
    >
      {stats.map(({ label, value, highlight, color }) => (
        <div key={label}>
          <p
            className={cn(
              'text-[10px] uppercase tracking-wider mb-0.5',
              isDark ? 'text-white/40' : 'text-gray-400'
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              'text-[13px] font-medium',
              color || (isDark ? 'text-white' : 'text-gray-900'),
              highlight && 'text-primary'
            )}
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  );
};

// Connection status
const ConnectionStatus = ({ status, isDark }) => {
  const config = {
    connecting: { color: 'bg-yellow-500', text: 'Connecting...' },
    connected: { color: 'bg-green-500', text: 'Live' },
    disconnected: { color: 'bg-red-500', text: 'Disconnected' }
  }[status] || { color: 'bg-red-500', text: 'Disconnected' };

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          config.color,
          status === 'connected' && 'animate-pulse'
        )}
      />
      <span className={cn('text-[11px]', isDark ? 'text-white/50' : 'text-gray-500')}>
        {config.text}
      </span>
    </div>
  );
};

export default function LedgerStreamPage() {
  const router = useRouter();
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const [ledgers, setLedgers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [watchAddresses, setWatchAddresses] = useState([]);
  const [watchTxType, setWatchTxType] = useState('');
  const [watchedTxs, setWatchedTxs] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [expandedTx, setExpandedTx] = useState(null);
  const [networkStats, setNetworkStats] = useState({ tps: 0, successRate: 0, avgFee: 0 });
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const statsWindowRef = useRef({ txCounts: [], times: [], successes: [], totals: [], fees: [] });

  // Load from URL params
  useEffect(() => {
    if (router.isReady) {
      if (router.query.address) setWatchAddresses(router.query.address.split(',').filter(Boolean));
      if (router.query.type) setWatchTxType(router.query.type);
      if (router.query.sound === '1') setSoundEnabled(true);
    }
  }, [router.isReady, router.query]);

  // Sync to URL
  const updateURL = useCallback(
    (addresses, txType, sound) => {
      const params = new URLSearchParams();
      if (addresses.length) params.set('address', addresses.join(','));
      if (txType) params.set('type', txType);
      if (sound) params.set('sound', '1');
      const url = params.toString() ? `?${params.toString()}` : '/ledger';
      router.replace(url, undefined, { shallow: true });
    },
    [router]
  );

  const handleAddressChange = (input) => {
    const addresses = input
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);
    setWatchAddresses(addresses);
    updateURL(addresses, watchTxType, soundEnabled);
  };

  const handleTxTypeChange = (type) => {
    setWatchTxType(type);
    updateURL(watchAddresses, type, soundEnabled);
  };

  const handleSoundToggle = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    updateURL(watchAddresses, watchTxType, newVal);
    if (newVal) playAlertSound();
  };

  const copyShareURL = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  // Fetch transactions for watched addresses when new ledger arrives
  useEffect(() => {
    if (watchAddresses.length === 0 || ledgers.length === 0) return;

    const latestLedger = ledgers[0];
    if (!latestLedger?.ledger_index || latestLedger.txn_count === 0) return;

    const controller = new AbortController();

    fetch(`https://api.xrpl.to/v1/ledger/${latestLedger.ledger_index}?expand=true`, {
      signal: controller.signal
    })
      .then((res) => res.json())
      .then((data) => {
        const transactions = data?.transactions || [];
        if (!Array.isArray(transactions)) return;

        const isAddressInvolved = (tx) => {
          const txData = tx.tx_json || tx;
          return watchAddresses.some(
            (addr) =>
              txData.Account === addr ||
              txData.Destination === addr ||
              txData.Owner === addr ||
              txData.Issuer === addr
          );
        };

        const decodeHexCurrency = (code) => {
          if (!code || code.length <= 3) return code;
          if (code.length === 40 && /^[0-9A-Fa-f]+$/.test(code)) {
            try {
              const hex = code.replace(/0+$/, '');
              let str = '';
              for (let i = 0; i < hex.length; i += 2) {
                const char = parseInt(hex.substr(i, 2), 16);
                if (char >= 32 && char < 127) str += String.fromCharCode(char);
              }
              return str || code.slice(0, 8);
            } catch {
              return code.slice(0, 8);
            }
          }
          return code;
        };

        const formatValue = (val) => {
          const num = parseFloat(val);
          if (isNaN(num)) return '0';
          if (num > 1e20) return 'MAX';
          if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
          if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
          if (num < 0.01 && num > 0) return '<0.01';
          return num.toFixed(2);
        };

        const parseAmount = (amt) => {
          if (!amt) return null;
          if (typeof amt === 'string')
            return { currency: 'XRP', value: formatValue(parseInt(amt) / 1000000) };
          return {
            currency: decodeHexCurrency(amt.currency),
            value: formatValue(amt.value),
            issuer: amt.issuer
          };
        };

        const getTxLabel = (tx) => {
          const txData = tx.tx_json || tx;
          if (txData.TransactionType === 'Payment') {
            const sendMax = parseAmount(txData.SendMax);
            const amount = parseAmount(txData.Amount || txData.DeliverMax);
            const delivered = parseAmount(tx.meta?.delivered_amount || tx.meta?.DeliveredAmount);

            // Has SendMax = cross-currency swap
            if (sendMax && amount) {
              const received = delivered || amount;
              return {
                label: 'Swap',
                detail: `${sendMax.value} ${sendMax.currency} → ${received.value} ${received.currency}`
              };
            }
            // Same currency = transfer
            const transferAmt = delivered || amount;
            return {
              label: 'Transfer',
              detail: transferAmt ? `${transferAmt.value} ${transferAmt.currency}` : ''
            };
          }
          if (txData.TransactionType === 'OfferCreate') {
            const pays = parseAmount(txData.TakerPays);
            const gets = parseAmount(txData.TakerGets);
            return {
              label: 'DEX Order',
              detail:
                pays && gets
                  ? `${gets.value} ${gets.currency} for ${pays.value} ${pays.currency}`
                  : ''
            };
          }
          if (txData.TransactionType === 'TrustSet') {
            const limit = txData.LimitAmount;
            return {
              label: 'Trust Line',
              detail: limit ? `${limit.currency}` : ''
            };
          }
          return { label: txData.TransactionType, detail: '' };
        };

        const matched = transactions.filter(isAddressInvolved).map((tx) => {
          const txData = tx.tx_json || tx;
          const { label, detail } = getTxLabel(tx);
          const result = tx.meta?.TransactionResult || '';
          const success = result === 'tesSUCCESS';
          return {
            hash: tx.hash,
            type: txData.TransactionType,
            label,
            detail,
            success,
            result,
            account: txData.Account,
            accountName: txData.AccountName,
            destination: txData.Destination,
            destinationName: txData.DestinationName,
            ledger: latestLedger.ledger_index,
            time: latestLedger.close_time,
            category: getTxCategory(txData.TransactionType),
            raw: tx
          };
        });

        if (matched.length > 0) {
          setWatchedTxs((prev) => [...matched, ...prev].slice(0, 50));
          if (soundEnabled) playAlertSound();
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [ledgers[0]?.ledger_index, watchAddresses, soundEnabled]);

  // Clear watched txs when addresses change
  useEffect(() => {
    setWatchedTxs([]);
    setExpandedTx(null);
  }, [watchAddresses.join(',')]);

  // Calculate rolling TPS and network stats (10 ledger window)
  useEffect(() => {
    if (ledgers.length === 0) return;
    const latest = ledgers[0];
    const stats = statsWindowRef.current;
    const WINDOW = 10;

    // Add to rolling window
    stats.txCounts.push(latest.txn_count || 0);
    stats.times.push(latest.close_time);
    if (stats.txCounts.length > WINDOW) {
      stats.txCounts.shift();
      stats.times.shift();
    }

    // Calculate rolling TPS (total txs / total time span)
    if (stats.times.length >= 2) {
      const totalTx = stats.txCounts.reduce((a, b) => a + b, 0);
      const timeSpan = (stats.times[stats.times.length - 1] - stats.times[0]) / 1000; // seconds
      const tps = timeSpan > 0 ? (totalTx / timeSpan).toFixed(1) : 0;
      setNetworkStats((prev) => ({ ...prev, tps: parseFloat(tps) }));
    }

    // Fetch success rate and fee stats (accumulate over window)
    if (latest.txn_count > 0) {
      fetch(`https://api.xrpl.to/v1/ledger/${latest.ledger_index}?expand=true`)
        .then((res) => res.json())
        .then((data) => {
          const txs = data?.transactions || [];
          if (!Array.isArray(txs)) return;
          const success = txs.filter((tx) => tx.meta?.TransactionResult === 'tesSUCCESS').length;
          const totalFees = txs.reduce((sum, tx) => sum + parseInt(tx.tx_json?.Fee || 0), 0);

          stats.successes.push(success);
          stats.totals.push(txs.length);
          stats.fees.push(totalFees);
          if (stats.successes.length > WINDOW) {
            stats.successes.shift();
            stats.totals.shift();
            stats.fees.shift();
          }

          const totalSuccesses = stats.successes.reduce((a, b) => a + b, 0);
          const totalTxs = stats.totals.reduce((a, b) => a + b, 0);
          const totalFeesSum = stats.fees.reduce((a, b) => a + b, 0);

          const successRate = totalTxs > 0 ? ((totalSuccesses / totalTxs) * 100).toFixed(0) : 0;
          const avgFee = totalTxs > 0 ? (totalFeesSum / totalTxs).toFixed(0) : 0;

          setNetworkStats((prev) => ({
            ...prev,
            successRate: parseFloat(successRate),
            avgFee: parseFloat(avgFee)
          }));
        })
        .catch(() => {});
    }
  }, [ledgers[0]?.ledger_index]);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');
    const ws = new WebSocket('wss://api.xrpl.to/ws/ledger');

    ws.onopen = () => setConnectionStatus('connected');

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
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

        setLedgers((prev) => {
          if (prev.some((l) => l.ledger_index === ledger.ledger_index)) return prev;
          return [ledger, ...prev].slice(0, 20);
        });
      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = () => ws.close();

    wsRef.current = ws;

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
    }, 30000);

    return () => clearInterval(pingInterval);
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWebSocket]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1 py-6 max-w-[1920px] mx-auto w-full px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className={cn('text-xl font-medium mb-1', isDark ? 'text-white' : 'text-gray-900')}>
              Ledger Stream
            </h1>
            <p className={cn('text-[13px]', isDark ? 'text-white/50' : 'text-gray-500')}>
              Real-time XRP Ledger updates
            </p>
          </div>
          <ConnectionStatus status={connectionStatus} isDark={isDark} />
        </div>

        {/* Legend + Filters */}
        <div
          className={cn(
            'p-3 rounded-xl border-[1.5px] mb-4 space-y-3',
            isDark ? 'border-white/10' : 'border-gray-200'
          )}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <ColorLegend isDark={isDark} />
              <div className="w-px h-4 bg-white/10 hidden lg:block" />
              <TxTypeFilter selected={watchTxType} onChange={handleTxTypeChange} isDark={isDark} />
              <button
                onClick={handleSoundToggle}
                className={cn(
                  'p-2 rounded-lg border-[1.5px] transition-colors',
                  soundEnabled
                    ? 'border-primary bg-primary/10 text-primary'
                    : isDark
                      ? 'border-white/10 text-white/50'
                      : 'border-gray-200 text-gray-400'
                )}
                title={soundEnabled ? 'Sound alerts on' : 'Sound alerts off'}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
              {(watchAddresses.length > 0 || watchTxType) && (
                <button
                  onClick={copyShareURL}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1.5 rounded-lg border-[1.5px] text-[11px] transition-colors',
                    isDark
                      ? 'border-white/10 text-white/50 hover:text-primary'
                      : 'border-gray-200 text-gray-500 hover:text-primary'
                  )}
                  title="Copy shareable URL"
                >
                  <Share2 size={12} /> Share
                </button>
              )}
            </div>
            <div className="w-full lg:w-96">
              <AddressFilter
                value={watchAddresses.join(', ')}
                onChange={handleAddressChange}
                isDark={isDark}
              />
            </div>
          </div>
          {watchAddresses.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('text-[11px]', isDark ? 'text-white/50' : 'text-gray-500')}>
                Watching:
              </span>
              {watchAddresses.map((a) => (
                <span
                  key={a}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono',
                    isDark ? 'bg-primary/10 text-primary' : 'bg-primary/10 text-primary'
                  )}
                >
                  {a.slice(0, 8)}...
                  <button
                    onClick={() =>
                      handleAddressChange(watchAddresses.filter((addr) => addr !== a).join(', '))
                    }
                    className="hover:text-white"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
              {watchAddresses.length > 1 && (
                <button
                  onClick={() => handleAddressChange('')}
                  className={cn(
                    'text-[10px] hover:text-red-400',
                    isDark ? 'text-white/40' : 'text-gray-400'
                  )}
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        {ledgers.length > 0 && (
          <StatsBar latestLedger={ledgers[0]} networkStats={networkStats} isDark={isDark} />
        )}

        {/* Ledger stream */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {ledgers.length === 0 ? (
            <div
              className={cn(
                'col-span-full p-8 rounded-xl border-[1.5px] text-center',
                isDark ? 'border-white/10' : 'border-gray-200'
              )}
            >
              <div className="animate-pulse">
                <Layers
                  size={24}
                  className={cn('mx-auto mb-2', isDark ? 'text-white/30' : 'text-gray-300')}
                />
                <p className={cn('text-[13px]', isDark ? 'text-white/50' : 'text-gray-500')}>
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
                watchAddresses={watchAddresses}
                watchTxType={watchTxType}
              />
            ))
          )}
        </div>

        {/* Watched Address Transactions */}
        {watchAddresses.length > 0 && (
          <div className="mt-6">
            <h2
              className={cn(
                'text-[15px] font-medium mb-3',
                isDark ? 'text-white' : 'text-gray-900'
              )}
            >
              Transactions for watched addresses
            </h2>
            {watchedTxs.length === 0 ? (
              <div
                className={cn(
                  'p-4 rounded-xl border-[1.5px] text-center',
                  isDark ? 'border-white/10' : 'border-gray-200'
                )}
              >
                <p className={cn('text-[13px]', isDark ? 'text-white/50' : 'text-gray-500')}>
                  Waiting for transactions...
                </p>
              </div>
            ) : (
              <div
                className={cn(
                  'rounded-xl border-[1.5px] overflow-hidden',
                  isDark ? 'border-white/10' : 'border-gray-200'
                )}
              >
                <div className={cn('divide-y', isDark ? 'divide-white/5' : 'divide-gray-100')}>
                  {watchedTxs.map((tx, i) => (
                    <div key={`${tx.hash}-${i}`}>
                      <div
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 cursor-pointer',
                          isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'
                        )}
                        onClick={() => setExpandedTx(expandedTx === tx.hash ? null : tx.hash)}
                      >
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full flex-shrink-0',
                            !tx.success && 'ring-2 ring-red-500/50'
                          )}
                          style={{
                            backgroundColor: tx.success
                              ? TX_CATEGORIES[tx.category]?.color
                              : '#ef4444'
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={cn(
                                'text-[13px] font-medium',
                                isDark ? 'text-white' : 'text-gray-900'
                              )}
                            >
                              {tx.label}
                            </span>
                            {!tx.success && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">
                                FAILED
                              </span>
                            )}
                            {tx.detail && (
                              <span
                                className={cn(
                                  'text-[12px]',
                                  isDark ? 'text-white/60' : 'text-gray-600'
                                )}
                              >
                                {tx.detail}
                              </span>
                            )}
                            <span
                              className={cn(
                                'text-[11px]',
                                isDark ? 'text-white/40' : 'text-gray-400'
                              )}
                            >
                              #{tx.ledger?.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {tx.accountName && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                {tx.accountName}
                              </span>
                            )}
                            {tx.destinationName && tx.destinationName !== tx.accountName && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">
                                → {tx.destinationName}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className={cn(
                                'text-[11px] font-mono truncate',
                                isDark ? 'text-white/30' : 'text-gray-400'
                              )}
                            >
                              {tx.hash.slice(0, 16)}...
                            </span>
                            <CopyButton text={tx.hash} isDark={isDark} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={cn(
                              'text-[11px]',
                              isDark ? 'text-white/40' : 'text-gray-400'
                            )}
                          >
                            {new Date(tx.time).toLocaleTimeString()}
                          </span>
                          <ChevronDown
                            size={14}
                            className={cn(
                              'transition-transform',
                              expandedTx === tx.hash && 'rotate-180',
                              isDark ? 'text-white/30' : 'text-gray-400'
                            )}
                          />
                        </div>
                      </div>
                      {expandedTx === tx.hash && tx.raw && (
                        <div className={cn('px-4 pb-3', isDark ? 'bg-white/[0.01]' : 'bg-gray-50')}>
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={cn(
                                'text-[10px] uppercase tracking-wider',
                                isDark ? 'text-white/40' : 'text-gray-400'
                              )}
                            >
                              Raw JSON
                            </span>
                            <CopyButton text={JSON.stringify(tx.raw, null, 2)} isDark={isDark} />
                          </div>
                          <pre
                            className={cn(
                              'text-[11px] font-mono p-3 rounded-lg overflow-x-auto max-h-64',
                              isDark ? 'bg-black/50 text-white/70' : 'bg-white text-gray-700'
                            )}
                          >
                            {JSON.stringify(tx.raw, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
