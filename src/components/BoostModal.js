import { useState, useContext, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from 'src/utils/cn';
import { ThemeContext, WalletContext } from 'src/context/AppContext';
import {
  X,
  Check,
  Loader2,
  ExternalLink,
  AlertCircle,
  Zap,
  TrendingUp,
  Clock,
  Minus,
  Plus,
  CreditCard,
  Wallet
} from 'lucide-react';
import api from 'src/utils/api';
import { toast } from 'sonner';

const BASE_URL = 'https://api.xrpl.to/v1';
const TESTNET_EXPLORER = 'https://testnet.xrpl.org/transactions/';

const MIN_BOOST = 10;
const STEPS = ['Select Amount', 'Confirm', 'Processing', 'Complete'];

export default function BoostModal({ token, onClose, onSuccess }) {
  const { themeName } = useContext(ThemeContext);
  const { accountProfile, setOpenWalletModal } = useContext(WalletContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const [step, setStep] = useState(0);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [boostAmount, setBoostAmount] = useState(MIN_BOOST);
  const [purchaseData, setPurchaseData] = useState(null); // { invoiceId, payment: { destination, amount, destinationTag } }
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('xrp'); // 'xrp' | 'stripe'
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Fetch quote on mount
  // API: GET /v1/boost/quote/:md5
  // Returns: { pricing: { xrpPerPoint, minXrp, feeCollector, network }, current: { boost, boostExpires, ... }, ... }
  useEffect(() => {
    if (!token?.md5) return;
    let cancelled = false;
    const fetchQuote = async () => {
      setQuoteLoading(true);
      try {
        const res = await api.get(`${BASE_URL}/boost/quote/${token.md5}`);
        if (!cancelled && res.data) {
          setQuote(res.data);
          // Use API's minXrp if available
          if (res.data.pricing?.minXrp) {
            setBoostAmount(res.data.pricing.minXrp);
          }
        }
      } catch (e) {
        if (!cancelled) setError('Failed to load boost pricing');
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    };
    fetchQuote();
    return () => { cancelled = true; };
  }, [token?.md5]);

  // Derive points from quote pricing
  const xrpPerPoint = quote?.pricing?.xrpPerPoint || 0.01;
  const totalPoints = Math.floor(boostAmount / xrpPerPoint);
  const minXrp = quote?.pricing?.minXrp || MIN_BOOST;

  // Compute remaining hours from boostExpires timestamp
  const currentBoost = quote?.current?.boost || 0;
  const remainingHours = (() => {
    if (!quote?.current?.boostExpires) return 0;
    const ms = new Date(quote.current.boostExpires).getTime() - Date.now();
    return ms > 0 ? Math.ceil(ms / 3600000) : 0;
  })();

  // Estimate rank after boost
  const currentRank = quote?.current?.rank || null;
  const totalRanked = quote?.totalRanked || 0;
  const estimatedRank = (() => {
    if (!quote?.topTokens?.length) return null;
    const organicScore = quote?.current?.organicScore || 0;
    const estimatedScore = organicScore + currentBoost + totalPoints;
    // Find position in topTokens where our score would slot in
    for (let i = 0; i < quote.topTokens.length; i++) {
      if (quote.topTokens[i].md5 === token?.md5) continue; // skip self
      if (estimatedScore >= quote.topTokens[i].score) return i + 1;
    }
    // Below all returned tokens
    return totalRanked > quote.topTokens.length ? totalRanked : quote.topTokens.length + 1;
  })();

  // Step 0 → 1: Create purchase invoice
  // API: POST /v1/boost/purchase { md5, boostAmount, payerAddress }
  // Returns: { invoiceId, payment: { destination, amount, destinationTag, ... }, ... }
  const handleConfirm = async () => {
    if (!accountProfile?.account) {
      setOpenWalletModal(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`${BASE_URL}/boost/purchase`, {
        md5: token.md5,
        boostAmount,
        payerAddress: accountProfile.account
      });
      if (res.data?.error) {
        setError(res.data.error);
        setLoading(false);
        return;
      }
      if (!res.data.invoiceId || !res.data.payment?.destination) {
        setError('Invalid invoice response');
        setLoading(false);
        return;
      }
      setPurchaseData(res.data);
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create boost invoice');
    } finally {
      setLoading(false);
    }
  };

  // Stripe/Cash App checkout
  const handleStripeBoost = async (method) => {
    if (!accountProfile?.account) {
      setOpenWalletModal(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`${BASE_URL}/boost/stripe`, {
        md5: token.md5,
        boostAmount,
        payerAddress: accountProfile.account,
        ...(method ? { method } : {})
      });
      if (res.data?.checkoutUrl) {
        const { safeCheckoutRedirect } = await import('src/utils/api');
        if (!safeCheckoutRedirect(res.data.checkoutUrl)) {
          setError('Invalid checkout URL');
        }
      } else {
        setError(res.data?.error || 'Failed to create checkout');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 1 → 2 → 3: Pay on testnet using purchase response payment details
  const handlePayment = async () => {
    if (!accountProfile?.account || !purchaseData?.payment) return;

    setStep(2);
    setError(null);

    const { destination, amount, destinationTag } = purchaseData.payment;

    try {
      const { Client, Wallet, xrpToDrops } = await import('xrpl');
      const { EncryptedWalletStorage, deviceFingerprint } = await import('src/utils/encryptedWalletStorage');

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

      const algorithm = walletData.seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';
      const wallet = Wallet.fromSeed(walletData.seed, { algorithm });

      let client;
      try {
        client = new Client('wss://s.altnet.rippletest.net:51233');
        await client.connect();

        const payment = {
          TransactionType: 'Payment',
          Account: wallet.address,
          Destination: destination,
          Amount: xrpToDrops(String(amount))
        };
        if (destinationTag != null) {
          payment.DestinationTag = destinationTag;
        }

        let prepared;
        try {
          prepared = await client.autofill(payment);
        } catch (autofillErr) {
          if (autofillErr.message?.includes('Account not found') || autofillErr.data?.error === 'actNotFound') {
            setError('Account not activated on testnet. Please fund your wallet with at least 10 XRP first.');
            setStep(1);
            return;
          }
          throw autofillErr;
        }

        const signed = wallet.sign(prepared);
        const result = await client.submitAndWait(signed.tx_blob);

        if (result?.result?.meta?.TransactionResult === 'tesSUCCESS') {
          setTxHash(result.result.hash);
          await verifyPayment(purchaseData.invoiceId);
        } else {
          setError(`Transaction failed: ${result?.result?.meta?.TransactionResult || 'Unknown error'}`);
          setStep(1);
        }
      } finally {
        try { await client?.disconnect(); } catch {}
      }
    } catch (err) {
      console.error('Boost payment error:', err);
      const msg = err.message || 'Payment failed';
      if (msg.includes('Account not found') || msg.includes('actNotFound')) {
        setError('Account not activated on testnet. Please fund your wallet with at least 10 XRP first.');
      } else {
        setError(msg);
      }
      setStep(1);
    }
  };

  // API: GET /v1/boost/verify/:invoiceId
  // Returns: { success, status: 'pending'|'completed', boost: { addedBoost, totalBoost, ... } }
  const verifyPayment = async (invId) => {
    try {
      const res = await api.get(`${BASE_URL}/boost/verify/${invId}`);
      if (res.data?.status === 'completed') {
        setStep(3);
        const added = res.data.boost?.addedBoost || totalPoints;
        toast.success(`Boost applied! +${added} points`);
        if (onSuccess) onSuccess(res.data);
      } else {
        setError(res.data?.error || 'Payment not yet confirmed. Try again shortly.');
        setStep(1);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify boost payment');
      setStep(1);
    }
  };

  const renderAmountSelect = () => {
    if (quoteLoading) {
      return (
        <div className="text-center py-8">
          <Loader2 size={24} className={cn('mx-auto animate-spin mb-2', isDark ? 'text-white/50' : 'text-gray-400')} />
          <div className={cn('text-xs', isDark ? 'text-white/40' : 'text-gray-500')}>Loading boost pricing...</div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* Current boost info */}
        {currentBoost > 0 && remainingHours > 0 && (
          <div className={cn(
            'flex items-center gap-2 p-2.5 rounded-xl border-[1.5px]',
            isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'
          )}>
            <Zap size={14} className="text-amber-500" />
            <span className={cn('text-xs', isDark ? 'text-amber-400' : 'text-amber-600')}>
              Current boost: {currentBoost} points ({remainingHours}h remaining)
            </span>
          </div>
        )}

        {/* Token preview */}
        <div className={cn(
          'flex items-center gap-3 p-3 rounded-xl border-[1.5px]',
          isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200'
        )}>
          <img
            src={`https://s1.xrpl.to/token/${token.md5}`}
            alt={token.name}
            className={cn('w-10 h-10 rounded-lg object-cover border', isDark ? 'border-white/10' : 'border-gray-200')}
          />
          <div className="flex-1 min-w-0">
            <div className={cn('font-bold text-sm truncate', isDark ? 'text-white' : 'text-gray-900')}>{token.name}</div>
            <div className={cn('text-[10px]', isDark ? 'text-white/40' : 'text-gray-400')}>Boost trending position</div>
          </div>
        </div>

        {/* Amount selector */}
        <div>
          <div className={cn('text-[10px] font-bold uppercase tracking-wider mb-2', isDark ? 'text-white/40' : 'text-gray-400')}>
            Boost Amount (XRP)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBoostAmount(Math.max(minXrp, boostAmount - 10))}
              disabled={boostAmount <= minXrp}
              aria-label="Decrease amount"
              className={cn(
                'w-10 h-10 rounded-xl border-[1.5px] flex items-center justify-center transition-all disabled:opacity-30 outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-100'
              )}
            >
              <Minus size={14} className={isDark ? 'text-white/70' : 'text-gray-600'} />
            </button>
            <div className={cn(
              'flex-1 text-center py-2 rounded-xl border-[1.5px] font-bold text-lg',
              isDark ? 'bg-white/[0.02] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
            )}>
              {boostAmount} <span className={cn('text-sm font-normal', isDark ? 'text-white/40' : 'text-gray-400')}>XRP</span>
            </div>
            <button
              onClick={() => setBoostAmount(boostAmount + 10)}
              aria-label="Increase amount"
              className={cn(
                'w-10 h-10 rounded-xl border-[1.5px] flex items-center justify-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-100'
              )}
            >
              <Plus size={14} className={isDark ? 'text-white/70' : 'text-gray-600'} />
            </button>
          </div>

          {/* Quick amounts */}
          <div className="flex gap-1.5 mt-2">
            {[10, 25, 50, 100].map(amt => (
              <button
                key={amt}
                onClick={() => setBoostAmount(amt)}
                className={cn(
                  'flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all border-[1.5px]',
                  boostAmount === amt
                    ? 'bg-[#137DFE]/10 border-[#137DFE]/30 text-[#137DFE]'
                    : isDark ? 'border-white/[0.06] text-white/40 hover:bg-white/[0.04]' : 'border-gray-100 text-gray-400 hover:bg-gray-50'
                )}
              >
                {amt} XRP
              </button>
            ))}
          </div>
        </div>

        {/* Cost breakdown */}
        <div className={cn(
          'p-3 rounded-xl border-[1.5px] space-y-1.5',
          isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200'
        )}>
          <div className="flex justify-between items-center">
            <span className={cn('text-xs', isDark ? 'text-white/50' : 'text-gray-500')}>Boost Points</span>
            <span className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>{totalPoints.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className={cn('text-xs flex items-center gap-1', isDark ? 'text-white/50' : 'text-gray-500')}>
              <Clock size={10} /> Duration
            </span>
            <span className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>24 hours</span>
          </div>
          {estimatedRank && (
            <div className="flex justify-between items-center">
              <span className={cn('text-xs flex items-center gap-1', isDark ? 'text-white/50' : 'text-gray-500')}>
                <TrendingUp size={10} /> Est. Rank
              </span>
              <span className="flex items-center gap-1.5">
                {currentRank && (
                  <span className={cn('text-[10px] line-through', isDark ? 'text-white/30' : 'text-gray-400')}>
                    #{currentRank}
                  </span>
                )}
                <span className={cn(
                  'text-sm font-bold',
                  estimatedRank <= 3 ? 'text-amber-500' :
                  estimatedRank <= 10 ? 'text-[#137DFE]' :
                  isDark ? 'text-white' : 'text-gray-900'
                )}>
                  #{estimatedRank}
                </span>
                {currentRank && estimatedRank < currentRank && (
                  <span className="text-[10px] font-bold text-green-500">
                    +{currentRank - estimatedRank}
                  </span>
                )}
              </span>
            </div>
          )}
          <div className={cn('border-t pt-1.5 mt-1.5', isDark ? 'border-white/[0.06]' : 'border-gray-200')}>
            <div className="flex justify-between items-center">
              <span className={cn('text-xs font-bold', isDark ? 'text-white/70' : 'text-gray-600')}>Total Cost</span>
              <span className="text-sm font-black text-[#137DFE]">{boostAmount} XRP</span>
            </div>
          </div>
        </div>

        {/* Payment method selector */}
        <div>
          <div className={cn('text-[10px] font-bold uppercase tracking-wider mb-2', isDark ? 'text-white/40' : 'text-gray-400')}>
            Payment Method
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPaymentMethod('xrp')}
              className={cn(
                'flex-1 py-2 rounded-xl border-[1.5px] flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all',
                paymentMethod === 'xrp'
                  ? 'border-[#137DFE]/30 bg-[#137DFE]/10 text-[#137DFE]'
                  : isDark ? 'border-white/[0.06] text-white/40 hover:bg-white/[0.04]' : 'border-gray-100 text-gray-400 hover:bg-gray-50'
              )}
            >
              <Wallet size={12} />
              XRP
            </button>
            <button
              onClick={() => setPaymentMethod('stripe')}
              className={cn(
                'flex-1 py-2 rounded-xl border-[1.5px] flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all',
                paymentMethod === 'stripe'
                  ? 'border-[#137DFE]/30 bg-[#137DFE]/10 text-[#137DFE]'
                  : isDark ? 'border-white/[0.06] text-white/40 hover:bg-white/[0.04]' : 'border-gray-100 text-gray-400 hover:bg-gray-50'
              )}
            >
              <CreditCard size={12} />
              Card / Crypto
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            <AlertCircle size={14} />
            <span className="truncate">{error}</span>
          </div>
        )}

        <button
          onClick={paymentMethod === 'xrp' ? handleConfirm : () => handleStripeBoost()}
          disabled={loading || boostAmount < minXrp}
          className="w-full py-2.5 rounded-xl text-sm font-bold transition-all text-white flex items-center justify-center gap-2 disabled:opacity-50 bg-gradient-to-r from-[#137DFE] to-[#650CD4] hover:opacity-90 shadow-md shadow-blue-500/20"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : paymentMethod === 'xrp' ? <Zap size={16} /> : <CreditCard size={16} />}
          {paymentMethod === 'xrp' ? `Boost for ${boostAmount} XRP` : `Pay $${(boostAmount * (quote?.pricing?.xrpUsd || 0)).toFixed(2) || '...'}`}
        </button>

        <p className={cn('text-[9px] text-center', isDark ? 'text-white/30' : 'text-gray-400')}>
          {paymentMethod === 'xrp' ? 'Payment on XRPL Testnet' : 'Card, Cash App, Link, Crypto - powered by Stripe'}
        </p>
      </div>
    );
  };

  const renderConfirm = () => (
    <div className="space-y-3">
      <div className={cn(
        'p-3 rounded-xl border-[1.5px] flex items-center gap-3',
        isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200'
      )}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#137DFE] to-[#650CD4] shadow-md shadow-blue-500/20">
          <Zap size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className={cn('font-bold text-sm', isDark ? 'text-white' : 'text-gray-900')}>
            Boost {token.name}
          </div>
          <div className={cn('text-xs', isDark ? 'text-white/50' : 'text-gray-500')}>
            {totalPoints.toLocaleString()} points for 24 hours
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-sm text-[#137DFE]">{purchaseData?.payment?.amount || boostAmount} XRP</div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <AlertCircle size={14} />
          <span className="truncate">{error}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => { setStep(0); setError(null); setPurchaseData(null); }}
          className={cn(
            'flex-1 py-2.5 rounded-xl border-[1.5px] text-sm font-medium transition-all',
            isDark ? 'border-white/10 text-white/70 hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
          )}
        >
          Back
        </button>
        <button
          onClick={handlePayment}
          className={cn(
            'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all text-white flex items-center justify-center gap-2',
            'bg-gradient-to-r from-[#137DFE] to-[#650CD4] hover:opacity-90 shadow-md shadow-blue-500/20'
          )}
        >
          <Zap size={16} />
          Pay {purchaseData?.payment?.amount || boostAmount} XRP
        </button>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center py-6">
      <div className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br from-[#137DFE] to-[#650CD4] shadow-md shadow-blue-500/20 animate-pulse">
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

  const renderComplete = () => (
    <div className="text-center py-4">
      <div className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-3 relative bg-gradient-to-br from-[#137DFE] to-[#650CD4] shadow-md shadow-blue-500/20">
        <Zap size={28} className="text-white" />
        <div className={cn(
          'absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center ring-2',
          isDark ? 'ring-black' : 'ring-white'
        )}>
          <Check size={14} className="text-white" strokeWidth={3} />
        </div>
      </div>

      <div className={cn('font-bold text-sm mb-1', isDark ? 'text-white' : 'text-gray-900')}>
        Boost Applied!
      </div>
      <div className={cn('text-xs mb-3', isDark ? 'text-white/50' : 'text-gray-500')}>
        {token.name} boosted with {totalPoints.toLocaleString()} points for 24h
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
          'bg-gradient-to-r from-[#137DFE] to-[#650CD4] hover:opacity-90 shadow-md shadow-blue-500/20'
        )}
      >
        Done
      </button>
    </div>
  );

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Boost token"
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md max-sm:h-dvh',
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
              'bg-gradient-to-br from-[#137DFE] to-[#650CD4]'
            )}>
              <TrendingUp size={14} className="text-white" />
            </div>
            <div>
              <div className={cn('font-bold text-[13px]', isDark ? 'text-white' : 'text-gray-900')}>
                Boost Token
              </div>
              <div className={cn('text-[9px]', isDark ? 'text-white/40' : 'text-gray-400')}>
                XRPL Testnet
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className={cn(
              'p-1.5 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
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
                  i === step ? 'bg-gradient-to-r from-[#137DFE] to-[#650CD4] text-white' :
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
          {step === 0 && renderAmountSelect()}
          {step === 1 && renderConfirm()}
          {step === 2 && renderProcessing()}
          {step === 3 && renderComplete()}
        </div>
      </div>
    </div>,
    document.body
  );
}
