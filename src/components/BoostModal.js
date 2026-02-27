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
  Clock,
  CreditCard,
  Wallet,
  Flame
} from 'lucide-react';
import api from 'src/utils/api';
import { toast } from 'sonner';

const BASE_URL = 'https://api.xrpl.to/v1';
const EXPLORER = 'https://xrpl.org/transactions/';

const STEPS = ['Select Pack', 'Confirm', 'Processing', 'Complete'];

// Flame intensity tiers — visuals escalate with multiplier
const TIER_CONFIG = {
  10:  { flames: 1, size: 14, color: '#F97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.15)', glow: 'none', label: 'Starter' },
  30:  { flames: 2, size: 15, color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.18)', glow: '0 0 8px rgba(239,68,68,0.15)', label: 'Power' },
  50:  { flames: 3, size: 16, color: '#DC2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.20)', glow: '0 0 12px rgba(220,38,38,0.2)', label: 'Mega' },
  100: { flames: 4, size: 17, color: '#A855F7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.22)', glow: '0 0 16px rgba(168,85,247,0.2)', label: 'Ultra' },
  500: { flames: 5, size: 18, color: '#FFD700', bg: 'rgba(255,215,0,0.06)', border: 'rgba(255,215,0,0.25)', glow: '0 0 20px rgba(255,215,0,0.2)', label: 'Legendary' },
};

const getTier = (multiplier) => TIER_CONFIG[multiplier] || TIER_CONFIG[10];

export default function BoostModal({ token, collection, onClose, onSuccess }) {
  const { themeName } = useContext(ThemeContext);
  const { accountProfile, setOpenWalletModal } = useContext(WalletContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const [step, setStep] = useState(0);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState(null);
  const [purchaseData, setPurchaseData] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('xrp');
  const mountedRef = useRef(true);

  // NFT collection mode
  const isNFT = !!collection;
  const identifier = isNFT ? collection.slug : token?.md5;
  const displayName = isNFT ? (typeof collection.name === 'string' ? collection.name : collection.name?.collection_name || collection.slug) : token?.name;
  const imageUrl = isNFT
    ? `https://s1.xrpl.to/nft-collection/${collection.logoImage || collection.slug}`
    : `https://s1.xrpl.to/token/${token?.md5}`;
  const quoteUrl = isNFT ? `${BASE_URL}/boost/nft/quote/${identifier}` : `${BASE_URL}/boost/quote/${identifier}`;
  const purchaseUrl = isNFT ? `${BASE_URL}/boost/nft/purchase` : `${BASE_URL}/boost/purchase`;
  const stripeUrl = isNFT ? `${BASE_URL}/boost/nft/stripe` : `${BASE_URL}/boost/stripe`;
  const verifyUrl = isNFT ? `${BASE_URL}/boost/nft/verify` : `${BASE_URL}/boost/verify`;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Fetch quote on mount
  useEffect(() => {
    if (!identifier) return;
    let cancelled = false;
    const fetchQuote = async () => {
      setQuoteLoading(true);
      try {
        const res = await api.get(quoteUrl);
        if (!cancelled && res.data) {
          setQuote(res.data);
          if (res.data.packs?.length) {
            setSelectedPack(res.data.packs[0].id);
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
  }, [identifier]);

  const activeBoosts = quote?.activeBoosts || 0;
  const goldenThreshold = quote?.goldenTickerThreshold || 500;
  const packs = quote?.packs || [];
  const currentPack = packs.find(p => p.id === selectedPack);

  // Step 0 → 1: Create purchase invoice
  const handleConfirm = async () => {
    if (!accountProfile?.account) {
      setOpenWalletModal(true);
      return;
    }
    if (!currentPack) return;
    setLoading(true);
    setError(null);
    try {
      const purchaseBody = isNFT
        ? { slug: identifier, packId: currentPack.id, payerAddress: accountProfile.account }
        : { md5: identifier, packId: currentPack.id, payerAddress: accountProfile.account };
      const res = await api.post(purchaseUrl, purchaseBody);
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

  // Stripe checkout
  const handleStripeBoost = async () => {
    if (!accountProfile?.account) {
      setOpenWalletModal(true);
      return;
    }
    if (!currentPack) return;
    setLoading(true);
    setError(null);
    try {
      const stripeBody = isNFT
        ? { slug: identifier, packId: currentPack.id, payerAddress: accountProfile.account }
        : { md5: identifier, packId: currentPack.id, payerAddress: accountProfile.account };
      const res = await api.post(stripeUrl, stripeBody);
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

  // Step 1 → 2 → 3: Pay with XRP
  const handlePayment = async () => {
    if (!accountProfile?.account || !purchaseData?.payment) return;

    setStep(2);
    setError(null);

    const { destination, amount, destinationTag } = purchaseData.payment;

    try {
      const { Wallet, xrpToDrops } = await import('xrpl');
      const { submitTransaction } = await import('src/utils/api');
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

      const payment = {
        TransactionType: 'Payment',
        Account: wallet.address,
        Destination: destination,
        Amount: xrpToDrops(String(amount)),
        SourceTag: 161803
      };
      if (destinationTag != null) {
        payment.DestinationTag = destinationTag;
      }

      const result = await submitTransaction(wallet, payment);
      if (result.success) {
        setTxHash(result.hash);
        await verifyPayment(purchaseData.invoiceId);
      } else {
        setError(`Transaction failed: ${result.engine_result || 'Unknown error'}`);
        setStep(1);
      }
    } catch (err) {
      console.error('Boost payment error:', err);
      const msg = err.message || 'Payment failed';
      if (msg.includes('Account not found') || msg.includes('actNotFound')) {
        setError('Account not activated. Please fund your wallet with at least 10 XRP first.');
      } else {
        setError(msg);
      }
      setStep(1);
    }
  };

  const verifyPayment = async (invId) => {
    const maxAttempts = 6;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const res = await api.get(`${verifyUrl}/${invId}`);
        if (res.data?.status === 'completed') {
          setStep(3);
          toast.success(`Boost applied! ${currentPack?.name} (${currentPack?.multiplier}x)`);
          if (onSuccess) onSuccess(res.data);
          return;
        }
        if (attempt < maxAttempts - 1) {
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        setError(res.data?.error || 'Payment not yet confirmed. Try again shortly.');
        setStep(1);
      } catch (err) {
        if (attempt < maxAttempts - 1) {
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        setError(err.response?.data?.error || 'Failed to verify boost payment');
        setStep(1);
      }
    }
  };

  const renderPackSelect = () => {
    if (quoteLoading) {
      return (
        <div className="text-center py-8">
          <Loader2 size={20} className={cn('mx-auto animate-spin mb-2', 'text-gray-400 dark:text-white/40')} />
          <div className={cn('text-[11px]', 'text-gray-400 dark:text-white/30')}>Loading boost packs...</div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* Active boost info */}
        {activeBoosts > 0 && (
          <div className={cn(
            'flex items-center gap-2 py-2 px-3 rounded-[10px] border',
            activeBoosts >= goldenThreshold
              ? 'bg-amber-50 border-amber-200 dark:bg-[#FFD700]/5 dark:border-[#FFD700]/20'
              : 'bg-amber-50 border-amber-200 dark:bg-amber-500/5 dark:border-amber-500/15'
          )}>
            <Flame size={13} className={activeBoosts >= goldenThreshold ? 'text-[#FFD700]' : 'text-amber-500'} fill={activeBoosts >= goldenThreshold ? '#FFD700' : 'none'} />
            <span className={cn('text-[11px]', activeBoosts >= goldenThreshold ? 'text-[#FFD700] font-bold' : 'text-amber-600 dark:text-amber-400')}>
              {activeBoosts >= goldenThreshold
                ? `Golden Ticker active! (${activeBoosts} boosts)`
                : `Active boosts: ${activeBoosts} — new packs stack on top`}
            </span>
          </div>
        )}

        {/* Token/Collection preview */}
        <div className={cn(
          'flex items-center gap-3 py-[10px] px-3 rounded-[10px] border',
          'bg-black/[0.02] border-black/[0.06] dark:bg-white/[0.025] dark:border-white/[0.06]'
        )}>
          <img
            src={imageUrl}
            alt={displayName}
            className="w-9 h-9 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className={cn('font-bold text-[13px] truncate', 'text-gray-900 dark:text-white')}>{displayName}</div>
            <div className={cn('text-[10px]', 'text-gray-400 dark:text-white/35')}>Boost trending position</div>
          </div>
        </div>

        {/* Pack selection */}
        <div>
          <div className={cn('text-[10px] font-bold uppercase tracking-wider mb-2', 'text-gray-400 dark:text-white/35')}>
            Select Boost Pack
          </div>
          <div className="space-y-1.5">
            {packs.map(pack => {
              const isSelected = selectedPack === pack.id;
              const tier = getTier(pack.multiplier);
              const isLegendary = pack.multiplier >= 500;
              return (
                <button
                  key={pack.id}
                  onClick={() => setSelectedPack(pack.id)}
                  style={{
                    borderColor: isSelected ? tier.border : undefined,
                    backgroundColor: isSelected ? tier.bg : undefined,
                    boxShadow: isSelected ? tier.glow : undefined,
                  }}
                  className={cn(
                    'w-full py-[10px] px-3 rounded-[10px] border flex items-center gap-3 transition-all duration-200 text-left',
                    !isSelected && 'border-black/[0.06] hover:border-black/[0.1] hover:bg-black/[0.02] dark:border-white/[0.06] dark:hover:border-white/[0.1] dark:hover:bg-white/[0.02]',
                    isLegendary && isSelected && 'ring-1 ring-[#FFD700]/10'
                  )}
                >
                  {/* Flame icon */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: isSelected ? `${tier.color}15` : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
                    }}
                  >
                    <Flame
                      size={tier.size}
                      style={{ color: isSelected ? tier.color : (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)') }}
                      fill={isSelected ? tier.color : 'none'}
                      strokeWidth={isSelected ? 0 : 1.5}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[13px] font-bold', 'text-gray-900 dark:text-white')}>
                        {pack.multiplier}x {pack.name}
                      </span>
                      {isLegendary && (
                        <span className="text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded bg-[#FFD700]/10 text-[#FFD700]">
                          Golden Ticker
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn('text-[10px] flex items-center gap-0.5', 'text-gray-400 dark:text-white/30')}>
                        <Clock size={9} /> {pack.durationHours}h
                      </span>
                      <span className={cn('text-[3px]', 'text-gray-300 dark:text-white/15')}>&#x25CF;</span>
                      <span style={{ color: isSelected ? tier.color : undefined }} className={cn('text-[13px] font-bold', !isSelected && 'text-gray-600 dark:text-white/70')}>
                        ${pack.priceUsd}
                      </span>
                      <span className={cn('text-[10px]', 'text-gray-400 dark:text-white/25')}>
                        ~{pack.priceXrp} XRP
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: tier.color }}>
                      <Check size={11} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Golden ticker hint */}
        {currentPack && (() => {
          const afterBoost = activeBoosts + currentPack.multiplier;
          const remaining = goldenThreshold - afterBoost;
          if (afterBoost >= goldenThreshold) {
            return (
              <div className={cn(
                'flex items-center gap-2 py-2 px-3 rounded-lg text-[10px] font-bold',
                'bg-amber-50 text-amber-600 dark:bg-[#FFD700]/10 dark:text-[#FFD700]'
              )}>
                <Flame size={11} fill="currentColor" />
                <span>This pack activates Golden Ticker!</span>
              </div>
            );
          }
          if (activeBoosts < goldenThreshold) {
            return (
              <div className={cn(
                'flex items-center gap-2 py-2 px-3 rounded-lg text-[10px]',
                'bg-amber-50 text-amber-400 dark:bg-[#FFD700]/5 dark:text-[#FFD700]/50'
              )}>
                <Flame size={11} />
                <span>{remaining} more boosts after this pack until Golden Ticker</span>
              </div>
            );
          }
          return null;
        })()}

        {/* Payment method selector */}
        <div>
          <div className={cn('text-[10px] font-bold uppercase tracking-wider mb-2', 'text-gray-400 dark:text-white/35')}>
            Payment Method
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPaymentMethod('xrp')}
              className={cn(
                'flex-1 py-2 rounded-[10px] border flex items-center justify-center gap-1.5 text-[11px] font-bold transition-[background-color,border-color] duration-150',
                paymentMethod === 'xrp'
                  ? 'border-blue-500/50 bg-blue-500/[0.06] text-blue-600 dark:border-blue-500/40 dark:bg-blue-500/[0.08] dark:text-blue-400'
                  : 'border-black/[0.06] text-gray-400 hover:bg-black/[0.02] dark:border-white/[0.06] dark:text-white/35 dark:hover:bg-white/[0.03]'
              )}
            >
              <Wallet size={12} />
              XRP
            </button>
            <button
              onClick={() => setPaymentMethod('stripe')}
              className={cn(
                'flex-1 py-2 rounded-[10px] border flex items-center justify-center gap-1.5 text-[11px] font-bold transition-[background-color,border-color] duration-150',
                paymentMethod === 'stripe'
                  ? 'border-blue-500/50 bg-blue-500/[0.06] text-blue-600 dark:border-blue-500/40 dark:bg-blue-500/[0.08] dark:text-blue-400'
                  : 'border-black/[0.06] text-gray-400 hover:bg-black/[0.02] dark:border-white/[0.06] dark:text-white/35 dark:hover:bg-white/[0.03]'
              )}
            >
              <CreditCard size={12} />
              Card / Crypto
            </button>
          </div>
        </div>

        {error && (
          <div className={cn('flex items-center gap-2 py-2 px-3 rounded-lg text-[11px]', 'bg-red-50 border border-red-200 text-red-500 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400')}>
            <AlertCircle size={13} />
            <span className="truncate">{error}</span>
          </div>
        )}

        {(() => {
          const cTier = currentPack ? getTier(currentPack.multiplier) : null;
          return (
            <button
              onClick={paymentMethod === 'xrp' ? handleConfirm : handleStripeBoost}
              disabled={loading || !currentPack}
              style={cTier ? {
                backgroundColor: cTier.color,
                boxShadow: `0 4px 14px ${cTier.color}40`,
              } : undefined}
              className={cn(
                'w-full rounded-xl text-white font-bold py-3 text-sm uppercase tracking-[0.03em] transition-all duration-200 flex items-center justify-center gap-2',
                'hover:-translate-y-px hover:brightness-110',
                !cTier && 'bg-blue-500 shadow-[0_4px_12px_rgba(59,130,246,0.25)]',
                'disabled:!bg-white/[0.04] disabled:text-white/20 disabled:shadow-none disabled:hover:translate-y-0 disabled:cursor-not-allowed disabled:brightness-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
              )}
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Flame size={15} fill="white" strokeWidth={0} />}
              {currentPack ? (
                paymentMethod === 'xrp'
                  ? `Boost ${currentPack.multiplier}x (~${currentPack.priceXrp} XRP)`
                  : `Pay $${currentPack.priceUsd}`
              ) : 'Select a pack'}
            </button>
          );
        })()}

        <p className={cn('text-[9px] text-center', 'text-gray-400 dark:text-white/25')}>
          {paymentMethod === 'xrp' ? 'Payment on XRPL' : 'Card, Cash App, Link, Crypto - powered by Stripe'}
          {' · '}
          <a href="/docs#trending-guide" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">How Trending Works</a>
          {' · '}
          <a href="/docs#terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">Terms of Service</a>
        </p>
      </div>
    );
  };

  const renderConfirm = () => (
    <div className="space-y-3">
      <div className={cn(
        'py-[10px] px-3 rounded-[10px] border flex items-center gap-3',
        'bg-black/[0.02] border-black/[0.06] dark:bg-white/[0.025] dark:border-white/[0.06]'
      )}>
        <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-blue-500 shrink-0">
          <Zap size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className={cn('font-bold text-[13px]', 'text-gray-900 dark:text-white')}>
            Boost {displayName}
          </div>
          <div className={cn('text-[11px]', 'text-gray-500 dark:text-white/40')}>
            {currentPack?.name} — {currentPack?.multiplier}x for {currentPack?.durationHours}h
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-bold text-[13px] text-blue-500">{purchaseData?.payment?.amount} XRP</div>
          <div className={cn('text-[10px]', 'text-gray-400 dark:text-white/30')}>${currentPack?.priceUsd}</div>
        </div>
      </div>

      {error && (
        <div className={cn('flex items-center gap-2 py-2 px-3 rounded-lg text-[11px]', 'bg-red-50 border border-red-200 text-red-500 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400')}>
          <AlertCircle size={13} />
          <span className="truncate">{error}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => { setStep(0); setError(null); setPurchaseData(null); }}
          className={cn(
            'flex-1 py-2.5 rounded-xl border text-[13px] font-medium transition-[background-color,border-color] duration-150',
            'border-black/[0.08] text-gray-500 hover:bg-black/[0.02] dark:border-white/[0.08] dark:text-white/60 dark:hover:bg-white/[0.04]'
          )}
        >
          Back
        </button>
        <button
          onClick={handlePayment}
          className={cn(
            'flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-[background-color,transform] duration-200',
            'hover:bg-blue-600 hover:-translate-y-px shadow-[0_4px_12px_rgba(59,130,246,0.25)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
          )}
        >
          <Zap size={14} />
          Pay {purchaseData?.payment?.amount} XRP
        </button>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center py-8">
      <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 bg-blue-500 animate-pulse">
        <Loader2 size={24} className="text-white animate-spin" />
      </div>
      <div className={cn('font-bold text-[13px] mb-1', 'text-gray-900 dark:text-white')}>
        Processing Payment
      </div>
      <div className={cn('text-[11px]', 'text-gray-500 dark:text-white/40')}>
        Submitting to XRPL...
      </div>
      <div className={cn('text-[10px] mt-2', 'text-gray-400 dark:text-white/25')}>
        This may take a few seconds
      </div>
    </div>
  );

  const renderComplete = () => (
    <div className="text-center py-6">
      <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 relative bg-blue-500">
        <Zap size={24} className="text-white" />
        <div className={cn(
          'absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center ring-2',
          'ring-white dark:ring-black'
        )}>
          <Check size={12} className="text-white" strokeWidth={3} />
        </div>
      </div>

      <div className={cn('font-bold text-[13px] mb-1', 'text-gray-900 dark:text-white')}>
        Boost Applied!
      </div>
      <div className={cn('text-[11px] mb-3', 'text-gray-500 dark:text-white/40')}>
        {displayName} boosted with {currentPack?.name} ({currentPack?.multiplier}x) for {currentPack?.durationHours}h
      </div>

      {txHash && (
        <a
          href={`${EXPLORER}${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-1.5 rounded-lg mb-3',
            'bg-gray-100 text-gray-500 hover:text-gray-700 dark:bg-white/[0.04] dark:text-white/50 dark:hover:text-white/70'
          )}
        >
          <span className="truncate max-w-[180px]">{txHash}</span>
          <ExternalLink size={10} />
        </a>
      )}

      <button
        onClick={onClose}
        className={cn(
          'w-full py-2.5 rounded-xl bg-blue-500 text-white text-[13px] font-bold transition-[background-color] duration-200',
          'hover:bg-blue-600 shadow-[0_4px_12px_rgba(59,130,246,0.25)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
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
      aria-label={isNFT ? 'Boost collection' : 'Boost token'}
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md max-sm:h-dvh',
        'bg-white/60 dark:bg-black/70'
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full max-w-xl rounded-2xl border overflow-hidden',
          'bg-white border-black/[0.08] shadow-2xl shadow-gray-300/30 dark:bg-[#0d0d0f] dark:border-white/[0.08] dark:shadow-2xl dark:shadow-black/50'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between px-4 py-3 border-b',
          'border-black/[0.06] dark:border-white/[0.06]'
        )}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-500">
              <Zap size={14} className="text-white" />
            </div>
            <span className={cn('font-bold text-[13px]', 'text-gray-900 dark:text-white')}>
              {isNFT ? 'Boost Collection' : 'Boost Token'}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className={cn(
              'p-1.5 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              'hover:bg-gray-100 text-gray-400 dark:hover:bg-white/[0.06] dark:text-white/40'
            )}
          >
            <X size={16} />
          </button>
        </div>

        {/* Step indicator */}
        <div className={cn('px-4 py-2 border-b', 'border-black/[0.04] dark:border-white/[0.04]')}>
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all',
                  i < step ? 'bg-green-500 text-white' :
                  i === step ? 'bg-blue-500 text-white' :
                  'bg-black/[0.06] text-black/25 dark:bg-white/[0.06] dark:text-white/25'
                )}>
                  {i < step ? <Check size={10} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    'w-6 h-0.5 mx-0.5',
                    i < step ? 'bg-green-500' : 'bg-black/[0.06] dark:bg-white/[0.06]'
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {step === 0 && renderPackSelect()}
          {step === 1 && renderConfirm()}
          {step === 2 && renderProcessing()}
          {step === 3 && renderComplete()}
        </div>
      </div>
    </div>,
    document.body
  );
}
