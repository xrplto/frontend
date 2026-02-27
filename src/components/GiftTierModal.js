import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from 'src/utils/cn';
import { ThemeContext } from 'src/context/AppContext';
import {
  X,
  Gift,
  CreditCard,
  Wallet,
  Loader2,
  Copy,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Star,
  Gem,
  Check
} from 'lucide-react';
import api from 'src/utils/api';

const BASE_URL = 'https://api.xrpl.to/v1';

const GIFT_TIERS = [
  { id: 'vip', name: 'VIP', icon: Sparkles, color: '#08AA09', billing: 'monthly' },
  { id: 'nova', name: 'Nova', icon: Star, color: '#F6AF01', billing: 'lifetime' },
  { id: 'diamond', name: 'Diamond', icon: Gem, color: '#650CD4', billing: 'lifetime' },
  { id: 'verified', name: 'Verified', icon: Check, color: '#FFD700', billing: 'lifetime' }
];

export default function GiftTierModal({ open, onClose, recipientAddress, gifterAddress }) {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const [step, setStep] = useState('select'); // 'select' | 'payment' | 'success'
  const [selectedTier, setSelectedTier] = useState(null);
  const [tierPrices, setTierPrices] = useState(null);
  const [xrpUsd, setXrpUsd] = useState(null);
  const [recipientTier, setRecipientTier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef(false);

  // Fetch tier prices
  useEffect(() => {
    if (!open) return;
    abortRef.current = false;
    setStep('select');
    setSelectedTier(null);
    setError(null);
    setInvoice(null);
    setPaymentStatus(null);
    setRecipientTier(null);

    const fetchData = async () => {
      try {
        const [tiersRes, perksRes] = await Promise.all([
          api.get(`${BASE_URL}/user/tiers`),
          api.get(`${BASE_URL}/user/${recipientAddress}/perks`).catch(() => null)
        ]);
        if (tiersRes.data?.config) setTierPrices(tiersRes.data.config);
        if (tiersRes.data?.xrpUsd > 0) setXrpUsd(tiersRes.data.xrpUsd);
        const roles = perksRes?.data?.roles || [];
        const currentTier = ['verified', 'diamond', 'nova', 'vip'].find(t => roles.includes(t)) || null;
        setRecipientTier(currentTier);
      } catch {
        // Fallback
      }
    };
    fetchData();
    return () => { abortRef.current = true; };
  }, [open, recipientAddress]);

  const getUsdPrice = (tierId) => tierPrices?.[tierId]?.price ?? 0;
  const getXrpPrice = (tierId) => {
    const usd = getUsdPrice(tierId);
    if (!usd || !xrpUsd || xrpUsd <= 0) return null;
    return (Math.ceil((usd / xrpUsd) * 100) / 100).toFixed(2);
  };

  const handleSelectTier = (tier) => {
    setSelectedTier(tier);
    setStep('payment');
    setError(null);
  };

  const handleXrpPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`${BASE_URL}/user/tier/gift/purchase`, {
        gifterAddress,
        recipientAddress,
        tier: selectedTier.id
      });
      if (res.data.success) {
        setInvoice(res.data);
        setPaymentStatus('invoice');
      } else {
        setError(res.data.error || 'Failed to create invoice');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to prepare payment');
    } finally {
      setLoading(false);
    }
  };

  const handleSignAndSend = async () => {
    if (!invoice) return;
    setError(null);
    setPaymentStatus('signing');

    try {
      const { EncryptedWalletStorage, deviceFingerprint } = await import('src/utils/encryptedWalletStorage');
      const walletStorage = new EncryptedWalletStorage();
      const deviceKeyId = await deviceFingerprint.getDeviceId();
      const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);

      if (!storedPassword) {
        setError('Wallet locked. Please unlock your wallet first.');
        setPaymentStatus('invoice');
        return;
      }

      const walletData = await walletStorage.getWallet(gifterAddress, storedPassword);
      if (!walletData?.seed) {
        setError('Could not retrieve wallet credentials');
        setPaymentStatus('invoice');
        return;
      }

      const { Wallet, xrpToDrops } = await import('xrpl');
      const { submitTransaction } = await import('src/utils/api');
      const algorithm = walletData.seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';
      const wallet = Wallet.fromSeed(walletData.seed, { algorithm });

      setPaymentStatus('submitting');
      const payment = {
        TransactionType: 'Payment',
        Account: gifterAddress,
        Destination: invoice.payment.destination,
        Amount: xrpToDrops(String(invoice.payment.xrpAmount)),
        SourceTag: 161803
      };

      const result = await submitTransaction(wallet, payment);

      if (!result?.engine_result || result.engine_result !== 'tesSUCCESS') {
        const txResult = result?.engine_result || 'Unknown error';
        if (txResult === 'tecUNFUNDED_PAYMENT') {
          setError('Insufficient XRP balance.');
        } else {
          setError(`Transaction failed: ${txResult}`);
        }
        setPaymentStatus('invoice');
        return;
      }

      // Poll for verification
      setPaymentStatus('verifying');
      await pollVerification(invoice.invoiceId);
    } catch (err) {
      setError(err.message || 'Payment failed');
      setPaymentStatus('invoice');
    }
  };

  const pollVerification = useCallback(async (invoiceId) => {
    for (let i = 0; i < 20; i++) {
      if (abortRef.current) return;
      try {
        const res = await api.get(`${BASE_URL}/user/tier/gift/verify/${invoiceId}`);
        if (res.data.status === 'completed') {
          if (!abortRef.current) {
            setStep('success');
            setPaymentStatus(null);
          }
          return;
        }
      } catch {}
      await new Promise(r => setTimeout(r, 3000));
    }
    if (!abortRef.current) {
      setError('Verification timed out. If you sent the payment, it will be processed shortly.');
      setPaymentStatus('invoice');
    }
  }, []);

  const handleManualVerify = async () => {
    if (!invoice) return;
    setPaymentStatus('verifying');
    setError(null);
    await pollVerification(invoice.invoiceId);
  };

  const handleStripePayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`${BASE_URL}/user/tier/gift/stripe`, {
        gifterAddress,
        recipientAddress,
        tier: selectedTier.id
      });
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortAddr = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md max-sm:h-dvh',
        'bg-white/60 dark:bg-black/70'
      )}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Gift Tier"
    >
      <div
        className={cn(
          'w-full max-w-xl rounded-2xl border-[1.5px] overflow-hidden',
          'bg-white backdrop-blur-2xl border-gray-200 shadow-2xl shadow-gray-300/30 dark:bg-black/95 dark:backdrop-blur-2xl dark:border-white/[0.08] dark:shadow-2xl dark:shadow-black/50'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between px-5 py-4 border-b',
          'border-gray-100 dark:border-white/[0.06]'
        )}>
          <div className="flex items-center gap-2.5">
            <Gift size={18} className="text-[#137DFE]" />
            <div>
              <div className={cn('font-semibold text-[15px]', 'text-gray-900 dark:text-white')}>
                {step === 'success' ? 'Gift Sent!' : 'Gift a Tier'}
              </div>
              <div className={cn('text-[12px] mt-0.5', 'text-gray-500 dark:text-white/50')}>
                to {shortAddr(recipientAddress)}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className={cn(
              'p-2 rounded-lg transition-colors',
              'hover:bg-gray-100 text-gray-400 dark:hover:bg-white/10 dark:text-white/50'
            )}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Step 1: Tier Selection */}
          {step === 'select' && (
            <div className="space-y-3">
              <div className={cn('text-[13px] font-medium', 'text-gray-600 dark:text-white/70')}>
                Choose a tier to gift
              </div>
              {GIFT_TIERS.map(tier => {
                const Icon = tier.icon;
                const usdPrice = getUsdPrice(tier.id);
                const xrpPrice = getXrpPrice(tier.id);
                const alreadyHas = recipientTier === tier.id;
                return (
                  <button
                    key={tier.id}
                    onClick={() => !alreadyHas && handleSelectTier(tier)}
                    disabled={alreadyHas}
                    className={cn(
                      'w-full flex items-center gap-3 p-3.5 rounded-xl border-[1.5px] transition-all text-left',
                      alreadyHas
                        ? 'opacity-40 cursor-not-allowed'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100 dark:bg-white/[0.02] dark:border-white/10 dark:hover:border-white/20 dark:hover:bg-white/[0.04]',
                      'border-gray-200 dark:border-white/10'
                    )}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${tier.color}15` }}
                    >
                      <Icon size={18} style={{ color: tier.color }} />
                    </div>
                    <div className="flex-1">
                      <div className={cn('font-semibold text-[14px]', 'text-gray-900 dark:text-white')}>
                        {tier.name}
                        {alreadyHas && <span className={cn('ml-1.5 text-[11px] font-normal', 'text-gray-400 dark:text-white/30')}>(Current)</span>}
                      </div>
                      <div className={cn('text-[12px]', 'text-gray-400 dark:text-white/40')}>
                        {tier.billing === 'monthly' ? 'Monthly' : 'Lifetime'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn('font-bold text-[15px]', 'text-gray-900 dark:text-white')}>
                        ${usdPrice}
                      </div>
                      {xrpPrice && (
                        <div className={cn('text-[11px]', 'text-gray-400 dark:text-white/30')}>
                          ~{xrpPrice} XRP
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 'payment' && selectedTier && (
            <div className="space-y-4">
              {/* Summary */}
              <div className={cn(
                'p-4 rounded-xl border-[1.5px]',
                'bg-gray-50 border-gray-200 dark:bg-white/[0.02] dark:border-white/10'
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <selectedTier.icon size={16} style={{ color: selectedTier.color }} />
                    <span className={cn('font-semibold', 'text-gray-900 dark:text-white')}>
                      {selectedTier.name} Tier
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={cn('font-bold text-[16px]', 'text-gray-900 dark:text-white')}>
                      ${getUsdPrice(selectedTier.id)}
                    </span>
                    {getXrpPrice(selectedTier.id) && (
                      <div className={cn('text-[11px]', 'text-gray-400 dark:text-white/30')}>
                        ~{getXrpPrice(selectedTier.id)} XRP
                      </div>
                    )}
                  </div>
                </div>
                <div className={cn('text-[12px] mt-1.5', 'text-gray-400 dark:text-white/40')}>
                  Gift to {shortAddr(recipientAddress)} {selectedTier.billing === 'monthly' ? '(1 month)' : '(Lifetime)'}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                  <span className="text-[12px] text-red-400">{error}</span>
                </div>
              )}

              {/* Invoice details (after XRP purchase created) */}
              {invoice && paymentStatus && paymentStatus !== 'signing' && paymentStatus !== 'submitting' && (
                <div className={cn(
                  'p-4 rounded-xl border-[1.5px] space-y-3',
                  'bg-gray-50 border-gray-200 dark:bg-white/[0.02] dark:border-white/10'
                )}>
                  <div className="flex items-center justify-between">
                    <span className={cn('text-[12px]', 'text-gray-500 dark:text-white/50')}>Send to</span>
                    <button
                      onClick={() => copyToClipboard(invoice.payment.destination)}
                      className="flex items-center gap-1.5"
                    >
                      <span className={cn('text-[12px] font-mono', 'text-gray-700 dark:text-white/80')}>
                        {shortAddr(invoice.payment.destination)}
                      </span>
                      {copied ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} className={'text-gray-400 dark:text-white/30'} />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cn('text-[12px]', 'text-gray-500 dark:text-white/50')}>Amount</span>
                    <span className={cn('font-bold text-[15px]', 'text-gray-900 dark:text-white')}>
                      {invoice.payment.xrpAmount} XRP
                    </span>
                  </div>
                </div>
              )}

              {/* Payment buttons */}
              {!invoice ? (
                <div className="space-y-2.5">
                  <button
                    onClick={handleXrpPayment}
                    disabled={loading}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[14px] transition-all',
                      'bg-[#137DFE] text-white hover:bg-[#137DFE]/90 disabled:opacity-50'
                    )}
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
                    Pay with XRP
                  </button>
                  <button
                    onClick={handleStripePayment}
                    disabled={loading}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[14px] transition-all border-[1.5px]',
                      'border-gray-200 text-gray-900 hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5 dark:disabled:opacity-50'
                    )}
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                    Pay with Card
                  </button>
                  <button
                    onClick={() => { setStep('select'); setError(null); setInvoice(null); }}
                    className={cn('w-full text-center text-[12px] py-1', 'text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/60')}
                  >
                    Back
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {paymentStatus === 'signing' || paymentStatus === 'submitting' || paymentStatus === 'verifying' ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Loader2 size={24} className="animate-spin text-[#137DFE]" />
                      <span className={cn('text-[13px]', 'text-gray-500 dark:text-white/60')}>
                        {paymentStatus === 'signing' && 'Signing transaction...'}
                        {paymentStatus === 'submitting' && 'Submitting payment...'}
                        {paymentStatus === 'verifying' && 'Verifying payment...'}
                      </span>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={handleSignAndSend}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[14px] bg-[#137DFE] text-white hover:bg-[#137DFE]/90"
                      >
                        <Wallet size={16} />
                        Send from Wallet
                      </button>
                      <button
                        onClick={handleManualVerify}
                        className={cn(
                          'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[14px] border-[1.5px]',
                          'border-gray-200 text-gray-900 hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5'
                        )}
                      >
                        I Have Paid
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-14 h-14 rounded-full bg-[#08AA09]/10 flex items-center justify-center">
                <CheckCircle size={28} className="text-[#08AA09]" />
              </div>
              <div className={cn('font-semibold text-[16px]', 'text-gray-900 dark:text-white')}>
                Gift Sent!
              </div>
              <div className={cn('text-[13px] text-center', 'text-gray-500 dark:text-white/50')}>
                {selectedTier?.name} tier gifted to {shortAddr(recipientAddress)}
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 rounded-xl font-semibold text-[14px] bg-[#137DFE] text-white hover:bg-[#137DFE]/90"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
