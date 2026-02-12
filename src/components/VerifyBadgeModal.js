import { useState, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from 'src/utils/cn';
import { TIER_CONFIG } from 'src/components/VerificationBadge';
import { ThemeContext, WalletContext } from 'src/context/AppContext';
import {
  X,
  Star,
  Sparkles,
  Check,
  Shield,
  Loader2,
  ExternalLink,
  AlertCircle,
  ChevronRight,
  CreditCard,
  Wallet,
  Copy,
  CheckCircle
} from 'lucide-react';
import api from 'src/utils/api';
import { toast } from 'sonner';

const BASE_URL = 'https://api.xrpl.to/v1';
const TESTNET_EXPLORER = 'https://testnet.xrpl.org/transactions/';

// Tier configurations with visual styling (matches TokenSummary badges)
// Hierarchy: Green (Basic) → Yellow (Standard) → Violet (Premium) → Blue (Official)
// Prices in USD - XRP amount calculated dynamically
const TIERS = {
  2: {
    name: TIER_CONFIG[2].label,
    priceUsd: 589,
    icon: Sparkles,
    gradient: 'from-fuchsia-400 via-purple-500 to-violet-600',
    badgeGlow: 'shadow-[0_0_10px_rgba(168,85,247,0.5)]',
    shadow: 'shadow-purple-500/30',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    features: ['Violet badge on token', 'Priority in search', 'Verified partner']
  },
  3: {
    name: TIER_CONFIG[3].label,
    priceUsd: 250,
    icon: Check,
    gradient: 'from-yellow-400 via-amber-500 to-orange-500',
    badgeGlow: 'shadow-[0_0_8px_rgba(251,191,36,0.5)]',
    shadow: 'shadow-amber-500/30',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    features: ['Gold badge on token', 'Improved visibility', 'Verified status']
  },
  4: {
    name: TIER_CONFIG[4].label,
    priceUsd: 99,
    icon: Check,
    gradient: 'from-green-500 to-green-500',
    badgeGlow: 'shadow-md shadow-green-500/30',
    shadow: 'shadow-green-500/30',
    border: 'border-green-500/30',
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    features: ['Green badge on token', 'Basic verification', 'Community trust']
  }
};

// Step indicators
const STEPS = ['Select Tier', 'Confirm Payment', 'Processing', 'Complete'];

export default function VerifyBadgeModal({ token, onClose, onSuccess, itemType = 'token', itemId, itemName, itemImage }) {
  const { themeName } = useContext(ThemeContext);
  const { accountProfile, setOpenWalletModal } = useContext(WalletContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const [step, setStep] = useState(0); // 0: select, 1: confirm, 2: processing, 3: complete
  const [selectedTier, setSelectedTier] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState(null); // Dynamic XRP prices
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' or 'xrp'
  const [copied, setCopied] = useState(null);

  // Support both token objects and generic items (collections)
  const resolvedType = itemType;
  const resolvedId = itemId || token?.md5;
  const resolvedName = itemName || token?.name;
  const resolvedImage = itemImage || (token ? `https://s1.xrpl.to/token/${token.md5}` : null);
  const currentVerified = token?.verified || 0;

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Fetch dynamic pricing on mount
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await api.get(`${BASE_URL}/verify/pricing`);
        if (res.data?.success) {
          setPricing(res.data);
        }
      } catch (e) {
        console.error('Failed to fetch pricing:', e);
      }
    };
    fetchPricing();
  }, []);

  // Reset on close
  useEffect(() => {
    return () => {
      setStep(0);
      setSelectedTier(null);
      setPaymentInfo(null);
      setTxHash(null);
      setError(null);
      setCopied(null);
    };
  }, []);

  // Request payment details from API
  const handleSelectTier = async (tier) => {
    setSelectedTier(tier);
    setError(null);
    setLoading(true);

    try {
      const res = await api.post(`${BASE_URL}/verify/request`, {
        type: resolvedType,
        id: resolvedId,
        tier
      });

      if (res.data.error) {
        setError(res.data.error);
        setLoading(false);
        return;
      }

      setPaymentInfo(res.data);
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get payment details');
    } finally {
      setLoading(false);
    }
  };

  // Execute payment on testnet (XRP)
  const handlePayment = async () => {
    if (!accountProfile?.account) {
      setOpenWalletModal(true);
      return;
    }
    if (!paymentInfo) return;

    setStep(2);
    setError(null);

    try {
      const { Client, Wallet, xrpToDrops } = await import('xrpl');
      const { EncryptedWalletStorage, deviceFingerprint } = await import('src/utils/encryptedWalletStorage');

      // Get wallet credentials
      const walletStorage = new EncryptedWalletStorage();
      const deviceKeyId = await deviceFingerprint.getDeviceId();
      const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);

      if (!storedPassword) {
        setError('Wallet locked. Please unlock your wallet first.');
        setStep(1);
        return;
      }

      const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
      if (!walletData?.seed) {
        setError('Could not retrieve wallet credentials');
        setStep(1);
        return;
      }

      // Create wallet from seed
      const algorithm = walletData.seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';
      const wallet = Wallet.fromSeed(walletData.seed, { algorithm });

      // Connect to TESTNET
      const client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();

      // Prepare payment transaction with destination tag
      const payment = {
        TransactionType: 'Payment',
        Account: wallet.address,
        Destination: paymentInfo.destination,
        DestinationTag: paymentInfo.destinationTag,
        Amount: paymentInfo.amountDrops
      };

      // Autofill, sign, and submit
      let prepared;
      try {
        prepared = await client.autofill(payment);
      } catch (autofillErr) {
        await client.disconnect();
        if (autofillErr.message?.includes('Account not found') || autofillErr.data?.error === 'actNotFound') {
          setError('Account not activated. Please fund your wallet with at least 10 XRP first, or pay with card.');
          setStep(1);
          return;
        }
        throw autofillErr;
      }
      const signed = wallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      await client.disconnect();

      if (result.result.meta.TransactionResult === 'tesSUCCESS') {
        setTxHash(result.result.hash);
        // Confirm with API
        await confirmPayment(result.result.hash);
      } else {
        setError(`Transaction failed: ${result.result.meta.TransactionResult}`);
        setStep(1);
      }
    } catch (err) {
      console.error('Payment error:', err);
      const msg = err.message || 'Payment failed';
      if (msg.includes('Account not found') || msg.includes('actNotFound')) {
        setError('Account not activated. Please fund your wallet with at least 10 XRP first, or pay with card.');
      } else {
        setError(msg);
      }
      setStep(1);
    }
  };

  // Confirm payment with API
  const confirmPayment = async (hash) => {
    try {
      const res = await api.post(`${BASE_URL}/verify/confirm`, { txHash: hash });

      if (res.data.success) {
        setStep(3);
        toast.success(`${res.data.tierName} verification applied!`);
        if (onSuccess) {
          onSuccess(res.data.tier);
        }
      } else {
        setError(res.data.error || 'Verification failed');
        setStep(1);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm verification');
      setStep(1);
    }
  };

  // Stripe payment - redirect to checkout
  const handleStripePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.post(`${BASE_URL}/verify/stripe/checkout`, {
        type: resolvedType,
        id: resolvedId,
        tier: selectedTier
      });

      if (res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        setError(res.data.error || 'Failed to create checkout session');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  // Render tier selection cards
  const renderTierSelection = () => (
    <div className="space-y-2">
      <div className={cn('text-center mb-3', isDark ? 'text-white/60' : 'text-gray-500')}>
        <p className="text-xs">Select verification for <span className={cn('font-semibold', isDark ? 'text-white' : 'text-gray-900')}>{resolvedName}</span></p>
        {currentVerified > 0 && currentVerified <= 4 && (
          <p className="text-[10px] mt-1 text-amber-500">
            Current: Tier {currentVerified} ({TIER_CONFIG[currentVerified]?.label || 'Unknown'})
          </p>
        )}
      </div>

      {[2, 3, 4].map((tier) => {
        const config = TIERS[tier];
        const Icon = config.icon;
        const isDisabled = currentVerified > 0 && currentVerified <= tier;
        const isSelected = selectedTier === tier;
        const xrpPrice = pricing?.tiers?.[tier]?.priceXrp;

        return (
          <button
            key={tier}
            onClick={() => !isDisabled && handleSelectTier(tier)}
            disabled={isDisabled || loading}
            className={cn(
              'w-full p-3 rounded-xl border-[1.5px] text-left transition-all duration-200 relative overflow-hidden group',
              isDisabled && 'opacity-40 cursor-not-allowed',
              isSelected && loading && 'animate-pulse',
              !isDisabled && !loading && 'hover:scale-[1.01] cursor-pointer',
              isDark
                ? `bg-white/[0.02] ${config.border} hover:bg-white/[0.05]`
                : `bg-gray-50 ${config.border} hover:bg-gray-100`
            )}
          >
            <div className="flex items-center gap-3 relative z-10">
              {/* Badge Preview with Token Image */}
              <div className="relative flex-shrink-0">
                <img
                  src={resolvedImage}
                  alt={resolvedName}
                  className={cn(
                    'w-10 h-10 rounded-lg object-cover border',
                    isDark ? 'border-white/10' : 'border-gray-200'
                  )}
                />
                {/* Badge preview */}
                <div className={cn(
                  'absolute -bottom-1 -right-1 p-[3px] rounded-full ring-2',
                  isDark ? 'ring-[#0a0a0a]' : 'ring-white',
                  `bg-gradient-to-br ${config.gradient} ${config.badgeGlow}`
                )}>
                  <Icon size={8} strokeWidth={3} className="text-white" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn('font-bold text-sm', isDark ? 'text-white' : 'text-gray-900')}>
                    {config.name}
                  </span>
                  {isDisabled && (
                    <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-500">
                      Current
                    </span>
                  )}
                </div>
                <div className={cn('text-[10px] truncate', isDark ? 'text-white/40' : 'text-gray-400')}>
                  {config.features[0]}
                </div>
              </div>

              {/* Price - USD with XRP equivalent */}
              <div className="text-right flex-shrink-0">
                <div className={cn('text-sm font-black', config.text)}>
                  ${config.priceUsd}
                </div>
                <div className={cn('text-[9px]', isDark ? 'text-white/40' : 'text-gray-400')}>
                  ≈ {xrpPrice || '...'} XRP
                </div>
              </div>

              {/* Arrow */}
              {!isDisabled && (
                <ChevronRight size={16} className={cn('opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0', isDark ? 'text-white' : 'text-gray-600')} />
              )}
            </div>
          </button>
        );
      })}

      <p className={cn('text-[9px] text-center mt-3', isDark ? 'text-white/30' : 'text-gray-400')}>
        Prices update with XRP rate
      </p>
    </div>
  );

  // Render payment confirmation
  const renderPaymentConfirm = () => {
    const config = TIERS[selectedTier];
    const Icon = config.icon;

    return (
      <div className="space-y-3">
        {/* Selected tier summary */}
        <div className={cn(
          'p-3 rounded-xl border-[1.5px] flex items-center gap-3',
          isDark ? `bg-white/[0.02] ${config.border}` : `bg-gray-50 ${config.border}`
        )}>
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
            `bg-gradient-to-br ${config.gradient} ${config.shadow} shadow-md`
          )}>
            <Icon size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className={cn('font-bold text-sm', isDark ? 'text-white' : 'text-gray-900')}>
              {config.name} Verification
            </div>
            <div className={cn('text-xs truncate', isDark ? 'text-white/50' : 'text-gray-500')}>
              for {resolvedName}
            </div>
          </div>
          <div className="text-right">
            <div className={cn('font-bold text-sm', config.text)}>${config.priceUsd}</div>
          </div>
        </div>

        {/* Payment method toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setPaymentMethod('card')}
            className={cn(
              'flex-1 py-2 px-3 rounded-xl border-[1.5px] flex items-center justify-center gap-2 text-xs font-medium transition-all',
              paymentMethod === 'card'
                ? isDark ? 'border-white/30 bg-white/10 text-white' : 'border-gray-400 bg-gray-100 text-gray-900'
                : isDark ? 'border-white/10 text-white/50 hover:bg-white/5' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            )}
          >
            <CreditCard size={14} />
            Card
          </button>
          <button
            onClick={() => setPaymentMethod('xrp')}
            className={cn(
              'flex-1 py-2 px-3 rounded-xl border-[1.5px] flex items-center justify-center gap-2 text-xs font-medium transition-all',
              paymentMethod === 'xrp'
                ? isDark ? 'border-white/30 bg-white/10 text-white' : 'border-gray-400 bg-gray-100 text-gray-900'
                : isDark ? 'border-white/10 text-white/50 hover:bg-white/5' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            )}
          >
            <Wallet size={14} />
            XRP
          </button>
        </div>

        {/* XRP payment details */}
        {paymentMethod === 'xrp' && (
          <div className={cn(
            'p-3 rounded-xl border-[1.5px] space-y-2',
            isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200'
          )}>
            <div className="flex justify-between items-center">
              <span className={cn('text-xs', isDark ? 'text-white/50' : 'text-gray-500')}>Amount</span>
              <span className={cn('font-bold text-sm', isDark ? 'text-white' : 'text-gray-900')}>{paymentInfo?.priceXrp || '...'} XRP</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={cn('text-xs', isDark ? 'text-white/50' : 'text-gray-500')}>Destination</span>
              <div className="flex items-center gap-1">
                <span className={cn('text-[10px] font-mono', isDark ? 'text-white/70' : 'text-gray-700')}>
                  {paymentInfo?.destination?.slice(0, 8)}...{paymentInfo?.destination?.slice(-6)}
                </span>
                <button onClick={() => copyToClipboard(paymentInfo?.destination, 'dest')} className="p-1 rounded hover:bg-white/10">
                  {copied === 'dest' ? <CheckCircle size={11} className="text-emerald-500" /> : <Copy size={11} className="opacity-50" />}
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className={cn('text-xs', isDark ? 'text-white/50' : 'text-gray-500')}>Destination Tag</span>
              <div className="flex items-center gap-1">
                <span className={cn('font-mono font-semibold text-primary')}>{paymentInfo?.destinationTag}</span>
                <button onClick={() => copyToClipboard(String(paymentInfo?.destinationTag), 'tag')} className="p-1 rounded hover:bg-white/10">
                  {copied === 'tag' ? <CheckCircle size={11} className="text-emerald-500" /> : <Copy size={11} className="opacity-50" />}
                </button>
              </div>
            </div>
            <div className={cn('text-[9px] p-2 rounded-lg', isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600')}>
              Important: Include the Destination Tag or payment may be lost
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            <AlertCircle size={14} />
            <span className="truncate">{error}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => { setStep(0); setSelectedTier(null); setError(null); setPaymentMethod('card'); }}
            className={cn(
              'flex-1 py-2.5 rounded-xl border-[1.5px] text-sm font-medium transition-all',
              isDark ? 'border-white/10 text-white/70 hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
            )}
          >
            Back
          </button>
          {paymentMethod === 'card' ? (
            <button
              onClick={handleStripePayment}
              disabled={loading}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all text-white flex items-center justify-center gap-2',
                `bg-gradient-to-r ${config.gradient} hover:opacity-90 ${config.shadow} shadow-md disabled:opacity-50`
              )}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              Pay ${config.priceUsd}
            </button>
          ) : (
            <button
              onClick={handlePayment}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all text-white flex items-center justify-center gap-2',
                `bg-gradient-to-r ${config.gradient} hover:opacity-90 ${config.shadow} shadow-md`
              )}
            >
              <Wallet size={16} />
              Pay {paymentInfo?.priceXrp || '...'} XRP
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render processing state
  const renderProcessing = () => {
    const config = TIERS[selectedTier];

    return (
      <div className="text-center py-6">
        <div className={cn(
          'w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-3',
          `bg-gradient-to-br ${config.gradient} ${config.shadow} shadow-md animate-pulse`
        )}>
          <Loader2 size={28} className="text-white animate-spin" />
        </div>
        <div className={cn('font-bold text-sm mb-1', isDark ? 'text-white' : 'text-gray-900')}>
          Processing Payment
        </div>
        <div className={cn('text-xs', isDark ? 'text-white/50' : 'text-gray-500')}>
          Submitting to XRPL Testnet...
        </div>
        <div className={cn('text-[10px] mt-2', isDark ? 'text-white/30' : 'text-gray-400')}>
          This may take a few seconds
        </div>
      </div>
    );
  };

  // Render success state
  const renderComplete = () => {
    const config = TIERS[selectedTier];
    const Icon = config.icon;

    return (
      <div className="text-center py-4">
        <div className={cn(
          'w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-3 relative',
          `bg-gradient-to-br ${config.gradient} ${config.shadow} shadow-md`
        )}>
          <Icon size={28} className="text-white" />
          <div className={cn(
            'absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center ring-2',
            isDark ? 'ring-black' : 'ring-white'
          )}>
            <Check size={14} className="text-white" strokeWidth={3} />
          </div>
        </div>

        <div className={cn('font-bold text-sm mb-1', isDark ? 'text-white' : 'text-gray-900')}>
          Verification Complete!
        </div>
        <div className={cn('text-xs mb-3', isDark ? 'text-white/50' : 'text-gray-500')}>
          {resolvedName} is now {config.name} Verified
        </div>

        {txHash && (
          <a
            href={`${TESTNET_EXPLORER}${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-1.5 rounded-lg mb-3',
              isDark ? 'bg-white/5 text-white/60 hover:text-white' : 'bg-gray-100 text-gray-600 hover:text-gray-900'
            )}
          >
            <span className="truncate max-w-[180px]">{txHash}</span>
            <ExternalLink size={10} />
          </a>
        )}

        <button
          onClick={onClose}
          className={cn(
            'w-full py-2.5 rounded-xl text-sm font-bold transition-all text-white',
            `bg-gradient-to-r ${config.gradient} hover:opacity-90 ${config.shadow} shadow-md`
          )}
        >
          Done
        </button>
      </div>
    );
  };

  // Use portal to render modal at document body level
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md',
        isDark ? 'bg-black/70' : 'bg-white/60'
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full max-w-sm rounded-2xl border-[1.5px] overflow-hidden',
          isDark
            ? 'bg-black/95 backdrop-blur-2xl border-white/[0.08] shadow-2xl shadow-black/50'
            : 'bg-white backdrop-blur-2xl border-gray-200 shadow-2xl shadow-gray-300/30'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between px-4 py-3 border-b',
          isDark ? 'border-white/[0.06]' : 'border-gray-100'
        )}>
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center',
              isDark ? 'bg-white/10' : 'bg-gray-100'
            )}>
              <Shield size={14} className={isDark ? 'text-white/70' : 'text-gray-600'} />
            </div>
            <div>
              <div className={cn('font-bold text-[13px]', isDark ? 'text-white' : 'text-gray-900')}>
                Get Verified
              </div>
              <div className={cn('text-[9px]', isDark ? 'text-white/40' : 'text-gray-400')}>
                XRPL Testnet
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              isDark ? 'hover:bg-white/10 text-white/50' : 'hover:bg-gray-100 text-gray-400'
            )}
          >
            <X size={16} />
          </button>
        </div>

        {/* Step indicator */}
        <div className={cn('px-4 py-2 border-b', isDark ? 'border-white/[0.04]' : 'border-gray-50')}>
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all',
                  i < step ? 'bg-green-500 text-white' :
                  i === step ? (selectedTier ? `bg-gradient-to-r ${TIERS[selectedTier]?.gradient || 'from-blue-500 to-blue-600'} text-white` : 'bg-blue-500 text-white') :
                  isDark ? 'bg-white/10 text-white/30' : 'bg-gray-100 text-gray-400'
                )}>
                  {i < step ? <Check size={10} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    'w-6 h-0.5 mx-0.5',
                    i < step ? 'bg-green-500' : isDark ? 'bg-white/10' : 'bg-gray-200'
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {step === 0 && renderTierSelection()}
          {step === 1 && renderPaymentConfirm()}
          {step === 2 && renderProcessing()}
          {step === 3 && renderComplete()}
        </div>
      </div>
    </div>,
    document.body
  );
}
