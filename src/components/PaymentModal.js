import { useState, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from 'src/utils/cn';
import { ThemeContext, WalletContext } from 'src/context/AppContext';
import {
  X,
  Check,
  CreditCard,
  Wallet,
  Loader2,
  Copy,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import api from 'src/utils/api';

const BASE_URL = 'https://api.xrpl.to/v1';

export default function PaymentModal({
  isOpen,
  onClose,
  purchaseType, // 'credits' | 'tier'
  item, // { id, name, price, credits?, features? }
  billingPeriod, // 'monthly' | 'yearly'
  walletAddress,
  onSuccess
}) {
  const { themeName } = useContext(ThemeContext);
  const { setOpenWalletModal } = useContext(WalletContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'preparing' | 'signing' | 'submitting' | 'verifying'
  const [copied, setCopied] = useState(null);

  // Fetch XRP payment info when switching to XRP
  useEffect(() => {
    if (paymentMethod === 'xrp' && !paymentInfo && walletAddress) {
      fetchXrpPaymentInfo();
    }
  }, [paymentMethod, walletAddress]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPaymentMethod('stripe');
      setLoading(false);
      setError(null);
      setPaymentInfo(null);
      setPaymentStatus(null);
    }
  }, [isOpen]);

  const fetchXrpPaymentInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = { wallet: walletAddress, type: purchaseType };
      if (purchaseType === 'credits') {
        payload.package = item.id;
      } else {
        payload.tier = item.id;
        payload.billing = billingPeriod;
      }
      const res = await api.post(`${BASE_URL}/keys/purchase`, payload);
      if (res.data.success) {
        setPaymentInfo(res.data.payment);
      } else {
        setError(res.data.error || 'Failed to get payment details');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to prepare payment');
    } finally {
      setLoading(false);
    }
  };

  const handleStripePayment = async (method) => {
    if (!walletAddress) {
      setOpenWalletModal(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = { wallet: walletAddress, type: purchaseType };
      if (method) payload.method = method;
      if (purchaseType === 'credits') {
        payload.package = item.id;
      } else {
        payload.tier = item.id;
        payload.billing = billingPeriod;
      }
      const res = await api.post(`${BASE_URL}/keys/stripe/checkout`, payload);
      if (res.data.checkoutUrl) {
        const { safeCheckoutRedirect } = await import('src/utils/api');
        if (!safeCheckoutRedirect(res.data.checkoutUrl)) {
          setError('Invalid checkout URL');
        }
      } else {
        setError(res.data.error || 'Failed to create checkout');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleXrpPayment = async () => {
    if (!walletAddress) {
      setOpenWalletModal(true);
      return;
    }
    if (!paymentInfo) {
      await fetchXrpPaymentInfo();
      return;
    }

    setError(null);
    setPaymentStatus('signing');

    try {
      // Get wallet for signing
      const { EncryptedWalletStorage, deviceFingerprint } = await import('src/utils/encryptedWalletStorage');
      const walletStorage = new EncryptedWalletStorage();
      const deviceKeyId = await deviceFingerprint.getDeviceId();
      const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);

      if (!storedPassword) {
        setError('Wallet locked. Please unlock your wallet first.');
        setPaymentStatus(null);
        return;
      }

      const walletData = await walletStorage.getWallet(walletAddress, storedPassword);
      if (!walletData?.seed) {
        setError('Could not retrieve wallet credentials');
        setPaymentStatus(null);
        return;
      }

      // Create wallet and submit via API
      const { Wallet, xrpToDrops } = await import('xrpl');
      const { submitTransaction } = await import('src/utils/api');
      const algorithm = walletData.seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';
      const wallet = Wallet.fromSeed(walletData.seed, { algorithm });

      setPaymentStatus('submitting');
      const payment = {
        TransactionType: 'Payment',
        Account: walletAddress,
        Destination: paymentInfo.destination,
        DestinationTag: paymentInfo.destinationTag,
        Amount: xrpToDrops(paymentInfo.amount),
        SourceTag: 161803
      };

      const result = await submitTransaction(wallet, payment);
      const txHash = result.hash || result.tx_json?.hash;

      if (!result?.engine_result || result.engine_result !== 'tesSUCCESS') {
        const txResult = result?.engine_result || 'Unknown error';
        if (txResult === 'tecUNFUNDED_PAYMENT') {
          setError('Insufficient XRP balance. Fund your wallet or pay with card.');
        } else {
          setError(`Transaction failed: ${txResult}`);
        }
        setPaymentStatus(null);
        return;
      }

      // Verify payment
      setPaymentStatus('verifying');
      const verifyRes = await api.post(`${BASE_URL}/keys/verify-payment`, {
        txHash
      });

      if (verifyRes.data.success) {
        if (onSuccess) {
          onSuccess(verifyRes.data);
        }
        onClose();
      } else {
        setError(verifyRes.data.error || 'Payment verification failed');
        setPaymentStatus(null);
      }
    } catch (err) {
      console.error('XRP payment error:', err);
      setError(err.message || 'Payment failed');
      setPaymentStatus(null);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const price = item?.price || 0;
  const xrpAmount = paymentInfo?.amount;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md max-sm:h-dvh',
        isDark ? 'bg-black/70' : 'bg-white/60'
      )}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Payment"
    >
      <div
        className={cn(
          'w-full max-w-md rounded-2xl border-[1.5px] overflow-hidden',
          isDark
            ? 'bg-black/95 backdrop-blur-2xl border-white/[0.08] shadow-2xl shadow-black/50'
            : 'bg-white backdrop-blur-2xl border-gray-200 shadow-2xl shadow-gray-300/30'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between px-5 py-4 border-b',
          isDark ? 'border-white/[0.06]' : 'border-gray-100'
        )}>
          <div>
            <div className={cn('font-semibold text-[15px]', isDark ? 'text-white' : 'text-gray-900')}>
              Complete Purchase
            </div>
            <div className={cn('text-[12px] mt-0.5', isDark ? 'text-white/50' : 'text-gray-500')}>
              {purchaseType === 'credits' ? 'Credit Package' : 'Subscription Plan'}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className={cn(
              'p-2 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
              isDark ? 'hover:bg-white/10 text-white/50' : 'hover:bg-gray-100 text-gray-400'
            )}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Purchase summary */}
          <div className={cn(
            'p-4 rounded-xl border-[1.5px]',
            isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200'
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className={cn('font-semibold', isDark ? 'text-white' : 'text-gray-900')}>{item?.name}</span>
              <span className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>${price}</span>
            </div>
            {item?.credits && (
              <div className={cn('text-[12px]', isDark ? 'text-white/50' : 'text-gray-500')}>
                {item.credits} credits {purchaseType === 'tier' ? '/ month' : ''}
              </div>
            )}
            {purchaseType === 'tier' && billingPeriod && (
              <div className={cn('text-[12px]', isDark ? 'text-white/50' : 'text-gray-500')}>
                Billed {billingPeriod}
              </div>
            )}
          </div>

          {/* Payment method toggle */}
          <div>
            <div className={cn('text-[12px] font-medium mb-2', isDark ? 'text-white/60' : 'text-gray-600')}>
              Payment Method
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPaymentMethod('stripe')}
                disabled={paymentStatus}
                className={cn(
                  'flex-1 py-3 px-4 rounded-xl border-[1.5px] flex items-center justify-center gap-2 text-[13px] font-medium transition-all',
                  paymentMethod === 'stripe'
                    ? 'border-primary bg-primary/10 text-primary'
                    : isDark ? 'border-white/10 text-white/60 hover:bg-white/5' : 'border-gray-200 text-gray-500 hover:bg-gray-50',
                  paymentStatus && 'opacity-50 cursor-not-allowed'
                )}
              >
                <CreditCard size={18} />
                Card / Crypto
              </button>
              <button
                onClick={() => setPaymentMethod('xrp')}
                disabled={paymentStatus}
                className={cn(
                  'flex-1 py-3 px-4 rounded-xl border-[1.5px] flex items-center justify-center gap-2 text-[13px] font-medium transition-all',
                  paymentMethod === 'xrp'
                    ? 'border-primary bg-primary/10 text-primary'
                    : isDark ? 'border-white/10 text-white/60 hover:bg-white/5' : 'border-gray-200 text-gray-500 hover:bg-gray-50',
                  paymentStatus && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Wallet size={18} />
                XRP
              </button>
            </div>
          </div>

          {/* XRP payment details */}
          {paymentMethod === 'xrp' && paymentInfo && (
            <div className={cn(
              'p-4 rounded-xl border-[1.5px] space-y-3',
              isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200'
            )}>
              <div className="flex items-center justify-between">
                <span className={cn('text-[12px]', isDark ? 'text-white/50' : 'text-gray-500')}>Amount</span>
                <span className={cn('font-bold', isDark ? 'text-white' : 'text-gray-900')}>{xrpAmount} XRP</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={cn('text-[12px]', isDark ? 'text-white/50' : 'text-gray-500')}>Destination</span>
                <div className="flex items-center gap-1">
                  <span className={cn('text-[11px] font-mono', isDark ? 'text-white/70' : 'text-gray-600')}>
                    {paymentInfo.destination?.slice(0, 8)}...{paymentInfo.destination?.slice(-6)}
                  </span>
                  <button onClick={() => copyToClipboard(paymentInfo.destination, 'dest')} aria-label="Copy destination address" className="p-1 rounded hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]">
                    {copied === 'dest' ? <CheckCircle size={12} className="text-emerald-500" /> : <Copy size={12} className="opacity-50" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={cn('text-[12px]', isDark ? 'text-white/50' : 'text-gray-500')}>Destination Tag</span>
                <div className="flex items-center gap-1">
                  <span className={cn('font-mono font-semibold text-primary')}>{paymentInfo.destinationTag}</span>
                  <button onClick={() => copyToClipboard(String(paymentInfo.destinationTag), 'tag')} aria-label="Copy destination tag" className="p-1 rounded hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]">
                    {copied === 'tag' ? <CheckCircle size={12} className="text-emerald-500" /> : <Copy size={12} className="opacity-50" />}
                  </button>
                </div>
              </div>
              <div className={cn('text-[10px] p-2 rounded-lg', isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600')}>
                Important: Include the Destination Tag or payment may be lost
              </div>
            </div>
          )}

          {/* Loading XRP info */}
          {paymentMethod === 'xrp' && loading && !paymentInfo && (
            <div className={cn('p-6 text-center', isDark ? 'text-white/50' : 'text-gray-500')}>
              <Loader2 size={24} className="mx-auto animate-spin mb-2" />
              <div className="text-[12px]">Fetching payment details...</div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[12px]">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Action button */}
          <button
            onClick={paymentMethod === 'xrp' ? handleXrpPayment : () => handleStripePayment()}
            disabled={loading || paymentStatus || (paymentMethod === 'xrp' && !paymentInfo)}
            className="w-full py-3.5 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Preparing...</>
            ) : paymentStatus === 'signing' ? (
              <><Loader2 size={18} className="animate-spin" /> Signing...</>
            ) : paymentStatus === 'submitting' ? (
              <><Loader2 size={18} className="animate-spin" /> Submitting...</>
            ) : paymentStatus === 'verifying' ? (
              <><Loader2 size={18} className="animate-spin" /> Verifying...</>
            ) : paymentMethod === 'stripe' ? (
              <><CreditCard size={18} /> Pay ${price}</>
            ) : (
              <><Wallet size={18} /> Pay {xrpAmount || '...'} XRP</>
            )}
          </button>

          {/* Footer */}
          <div className={cn('text-[10px] text-center', isDark ? 'text-white/30' : 'text-gray-400')}>
            {paymentMethod === 'xrp' ? 'Payment processed on XRPL Mainnet' : 'Card, Cash App, Link, Crypto - powered by Stripe'}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
