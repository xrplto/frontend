import React, { useState, useContext, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import { sign } from 'ripple-keypairs';
import { Key, Plus, Copy, Trash2, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, RefreshCw, CreditCard, Lock, Coins, Zap, X, Calendar } from 'lucide-react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';

const BASE_URL = 'https://api.xrpl.to/api';

const DashboardPage = () => {
  const { themeName, accountProfile } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const [apiKeys, setApiKeys] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKey, setNewKey] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [credits, setCredits] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [purchasing, setPurchasing] = useState(null);
  const [stripeSuccess, setStripeSuccess] = useState(null);
  const [xrpPayment, setXrpPayment] = useState(null);
  const [verifyingTx, setVerifyingTx] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null); // 'signing' | 'submitting' | 'verifying'
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' | 'yearly'

  const router = useRouter();

  const tiers = [
    { id: 'free', name: 'Free', monthly: 0, yearly: 0, credits: '1M', rps: 10, color: 'text-gray-500' },
    { id: 'developer', name: 'Developer', monthly: 49, yearly: 490, savings: 98, credits: '10M', rps: 50, color: 'text-blue-500' },
    { id: 'business', name: 'Business', monthly: 499, yearly: 4990, savings: 998, credits: '100M', rps: 200, color: 'text-purple-500' },
    { id: 'professional', name: 'Professional', monthly: 999, yearly: 9990, savings: 1998, credits: '200M', rps: 500, color: 'text-amber-500' }
  ];

  const packages = [
    { id: 'starter', name: 'Starter', price: 5, credits: '1M', color: 'text-emerald-500' },
    { id: 'standard', name: 'Standard', price: 20, credits: '5M', color: 'text-blue-500' },
    { id: 'bulk', name: 'Bulk', price: 75, credits: '25M', color: 'text-purple-500' },
    { id: 'mega', name: 'Mega', price: 250, credits: '100M', color: 'text-amber-500' }
  ];

  const walletAddress = accountProfile?.account;
  const [debugInfo, setDebugInfo] = useState(null);

  // Debug: Log account profile and fetch seed
  useEffect(() => {
    const loadDebugInfo = async () => {
      if (!accountProfile) return;

      const walletKeyId = accountProfile.walletKeyId ||
        (accountProfile.wallet_type === 'device' ? accountProfile.deviceKeyId : null) ||
        (accountProfile.provider && accountProfile.provider_id ? `${accountProfile.provider}_${accountProfile.provider_id}` : null);

      let seed = accountProfile.seed || null;

      // If no seed in profile, try to fetch from storage
      if (!seed && (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social')) {
        try {
          const { EncryptedWalletStorage } = await import('src/utils/encryptedWalletStorage');
          const walletStorage = new EncryptedWalletStorage();
          const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
          const storedPassword = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);
          if (storedPassword) {
            const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
            seed = walletData?.seed || 'encrypted';
          }
        } catch (e) {
          seed = 'error: ' + e.message;
        }
      }

      setDebugInfo({
        wallet_type: accountProfile.wallet_type,
        account: accountProfile.account,
        walletKeyId: walletKeyId,
        accountIndex: accountProfile.accountIndex,
        seed: seed || 'N/A'
      });
    };
    loadDebugInfo();
  }, [accountProfile]);

  // Get wallet for signing based on wallet type
  const getDeviceWallet = useCallback(async () => {
    if (!accountProfile) return null;

    try {
      const { Wallet } = await import('xrpl');

      // If seed is directly available (OAuth wallets after login)
      if (accountProfile.seed) {
        return Wallet.fromSeed(accountProfile.seed);
      }

      // Device/passkey wallet - derive from deviceKeyId
      if (accountProfile.wallet_type === 'device' && accountProfile.deviceKeyId) {
        const CryptoJS = (await import('crypto-js')).default;
        const entropyString = `passkey-wallet-${accountProfile.deviceKeyId}-${accountProfile.accountIndex || 0}-`;
        const seedHash = CryptoJS.PBKDF2(entropyString, `salt-${accountProfile.deviceKeyId}`, {
          keySize: 256 / 32,
          iterations: 100000
        }).toString();
        return new Wallet(seedHash.substring(0, 64));
      }

      // OAuth wallet - try to get from encrypted storage
      if (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social') {
        const { UnifiedWalletStorage } = await import('src/utils/encryptedWalletStorage');
        const walletStorage = new UnifiedWalletStorage();
        const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
        const storedPassword = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);

        if (storedPassword) {
          const walletData = await walletStorage.findWalletBySocialId(
            walletId,
            storedPassword,
            accountProfile.account || accountProfile.address
          );
          if (walletData?.seed) {
            return Wallet.fromSeed(walletData.seed);
          }
        }
      }

      return null;
    } catch (err) {
      console.error('Failed to get wallet:', err);
      return null;
    }
  }, [accountProfile]);

  // Create auth headers with signature for protected endpoints
  const getAuthHeaders = useCallback(async () => {
    if (!walletAddress) return null;

    try {
      const wallet = await getDeviceWallet();
      if (!wallet) return null;

      const timestamp = Date.now();
      const message = `${walletAddress}:${timestamp}`;
      const messageHex = Buffer.from(message).toString('hex');
      const signature = sign(messageHex, wallet.privateKey);

      return {
        'X-Wallet': walletAddress,
        'X-Timestamp': timestamp.toString(),
        'X-Signature': signature,
        'X-Public-Key': wallet.publicKey
      };
    } catch (err) {
      console.error('Failed to sign:', err);
      return null;
    }
  }, [walletAddress, getDeviceWallet]);

  const fetchApiKeys = useCallback(async () => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    try {
      const [keysRes, usageRes] = await Promise.all([
        axios.get(`${BASE_URL}/api-keys/${walletAddress}`),
        axios.get(`${BASE_URL}/api-keys/${walletAddress}/usage`)
      ]);

      setApiKeys(keysRes.data.keys || []);
      setUsage(usageRes.data);
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setApiKeys([]);
        setUsage(null);
      } else {
        setError('Failed to load API keys');
      }
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  const fetchCredits = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const [creditsRes, subRes] = await Promise.all([
        axios.get(`${BASE_URL}/api-keys/${walletAddress}/credits`),
        axios.get(`${BASE_URL}/api-keys/${walletAddress}/subscription`).catch(() => null)
      ]);
      setCredits(creditsRes.data);
      if (subRes?.data) setSubscription(subRes.data);
    } catch (err) {
      console.error('Failed to fetch credits:', err);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (accountProfile?.account) {
      fetchApiKeys();
      fetchCredits();
    } else {
      setLoading(false);
    }
  }, [accountProfile, fetchApiKeys, fetchCredits]);

  // Handle Stripe return
  useEffect(() => {
    const sessionId = router.query.session_id;
    const canceled = router.query.canceled;

    if (canceled) {
      setError('Payment was canceled');
      router.replace('/dashboard', undefined, { shallow: true });
      return;
    }

    if (sessionId) {
      axios.get(`${BASE_URL}/api-keys/stripe/status/${sessionId}`)
        .then(res => {
          if (res.data.status === 'complete' || res.data.status === 'paid') {
            setStripeSuccess({
              credits: res.data.credits,
              tier: res.data.tier
            });
            fetchCredits();
            fetchApiKeys();
          }
        })
        .catch(err => console.error('Stripe status check failed:', err))
        .finally(() => {
          router.replace('/dashboard', undefined, { shallow: true });
        });
    }
  }, [router.query, fetchCredits, fetchApiKeys, router]);

  const buyWithStripe = async (type, id) => {
    if (!walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    setPurchasing(id);
    setError(null);

    try {
      const payload = { wallet: walletAddress, type };
      if (type === 'credits') {
        payload.package = id;
      } else {
        payload.tier = id;
        payload.billing = billingPeriod;
      }

      const res = await axios.post(`${BASE_URL}/api-keys/stripe/checkout`, payload);

      if (res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        setError('Failed to create checkout session');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setPurchasing(null);
    }
  };

  const buyWithXRP = async (type, id) => {
    if (!walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    setPurchasing(`xrp_${id}`);
    setError(null);

    try {
      const payload = { wallet: walletAddress, type };
      if (type === 'credits') {
        payload.package = id;
      } else {
        payload.tier = id;
        payload.billing = billingPeriod;
      }

      const res = await axios.post(`${BASE_URL}/api-keys/purchase`, payload);

      if (res.data.payment) {
        setXrpPayment({
          ...res.data.payment,
          type,
          id,
          name: type === 'credits'
            ? packages.find(p => p.id === id)?.name
            : tiers.find(t => t.id === id)?.name,
          price: res.data.price,
          expiresIn: res.data.expiresIn
        });
      } else {
        setError('Failed to get payment details');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get payment details');
    } finally {
      setPurchasing(null);
    }
  };

  const submitXrpPayment = async () => {
    if (!xrpPayment) return;

    setError(null);

    try {
      // Get wallet for signing
      setPaymentStatus('signing');
      const wallet = await getDeviceWallet();
      if (!wallet) {
        setError('Unable to access wallet for signing');
        setPaymentStatus(null);
        return;
      }

      // Connect to XRPL
      setPaymentStatus('submitting');
      const xrpl = await import('xrpl');
      const client = new xrpl.Client('wss://xrplcluster.com');
      await client.connect();

      try {
        // Prepare payment
        const payment = {
          TransactionType: 'Payment',
          Account: walletAddress,
          Destination: xrpPayment.destination,
          DestinationTag: xrpPayment.destinationTag,
          Amount: xrpl.xrpToDrops(xrpPayment.amount)
        };

        const prepared = await client.autofill(payment);
        const signed = wallet.sign(prepared);

        // Submit and wait
        const result = await client.submitAndWait(signed.tx_blob);

        if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
          throw new Error(`Transaction failed: ${result.result.meta.TransactionResult}`);
        }

        // Verify payment (backend auto-polls)
        setPaymentStatus('verifying');
        const verifyRes = await axios.post(`${BASE_URL}/api-keys/verify-payment`, {
          txHash: signed.hash
        });

        if (verifyRes.data.success) {
          setStripeSuccess({
            credits: verifyRes.data.creditsAdded,
            message: verifyRes.data.message,
            newBalance: verifyRes.data.newBalance
          });
          setXrpPayment(null);
          fetchCredits();
          fetchApiKeys();
        } else {
          setError(verifyRes.data.message || 'Payment verification failed');
        }
      } finally {
        await client.disconnect();
      }
    } catch (err) {
      console.error('XRP payment error:', err);
      setError(err.message || 'Payment failed');
    } finally {
      setPaymentStatus(null);
    }
  };

  const verifyXrpPayment = async () => {
    if (!txHash.trim()) {
      setError('Please enter the transaction hash');
      return;
    }

    setVerifyingTx(true);
    setError(null);

    try {
      const res = await axios.post(`${BASE_URL}/api-keys/verify-payment`, {
        txHash: txHash.trim()
      });

      if (res.data.success) {
        setStripeSuccess({
          credits: res.data.creditsAdded,
          message: res.data.message,
          newBalance: res.data.newBalance
        });
        setXrpPayment(null);
        setTxHash('');
        fetchCredits();
        fetchApiKeys();
      } else {
        setError(res.data.message || 'Payment verification failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify payment');
    } finally {
      setVerifyingTx(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      setError('Please enter a key name');
      return;
    }

    if (!walletAddress) {
      setError('Not authenticated. Please sign in.');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      // Get signed auth headers (required for this endpoint)
      const headers = await getAuthHeaders();

      if (!headers) {
        setError(
          accountProfile?.wallet_type === 'device'
            ? 'Unable to sign request. Please try again.'
            : 'API key management requires a device/passkey wallet.'
        );
        setCreating(false);
        return;
      }

      const res = await axios.post(
        `${BASE_URL}/api-keys`,
        { name: newKeyName.trim() },
        { headers }
      );

      setNewKey(res.data.apiKey);
      setNewKeyName('');
      setShowCreateForm(false);
      fetchApiKeys();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const deleteApiKey = async (keyId) => {
    if (!walletAddress) return;

    setDeletingId(keyId);
    try {
      // Get signed auth headers (required for this endpoint)
      const headers = await getAuthHeaders();

      if (!headers) {
        setError(
          accountProfile?.wallet_type === 'device'
            ? 'Unable to sign request. Please try again.'
            : 'API key management requires a device/passkey wallet.'
        );
        setDeletingId(null);
        return;
      }

      await axios.delete(
        `${BASE_URL}/api-keys/${walletAddress}/${keyId}`,
        { headers }
      );
      fetchApiKeys();
    } catch (err) {
      setError('Failed to delete API key');
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!accountProfile?.account) {
    return (
      <div className="flex-1">
        <Head>
          <title>Dashboard - XRPL.to</title>
        </Head>
        <Header />
        <div className={cn("min-h-screen flex items-center justify-center", isDark ? "bg-black" : "bg-gray-50")}>
          <div className={cn("text-center p-8 rounded-xl border-[1.5px]", isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white")}>
            <Key size={48} className="mx-auto mb-4 opacity-20" />
            <h2 className={cn("text-xl font-medium mb-2", isDark ? "text-white" : "text-gray-900")}>Sign in Required</h2>
            <p className={cn("text-[14px]", isDark ? "text-white/60" : "text-gray-600")}>
              Connect your wallet to manage API keys
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex-1">
      <Head>
        <title>Dashboard - XRPL.to</title>
        <meta name="description" content="Manage your XRPL.to API keys" />
      </Head>

      <Header />

      <div className={cn("flex-1 py-4 sm:py-6", isDark ? "bg-black" : "bg-gray-50")}>
        <div className="mx-auto max-w-[1920px] px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className={cn("text-2xl font-normal", isDark ? "text-white" : "text-gray-900")}>API Keys</h1>
              <p className={cn("text-[14px] mt-1", isDark ? "text-white/60" : "text-gray-600")}>
                Manage your API keys for programmatic access
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium",
                "bg-primary text-white hover:bg-primary/90 transition-colors"
              )}
            >
              <Plus size={16} />
              Create Key
            </button>
          </div>

          {/* Debug Panel */}
          {debugInfo && (
            <div className={cn("mb-6 p-4 rounded-xl border-[1.5px] font-mono text-[11px]", isDark ? "border-yellow-500/30 bg-yellow-500/10" : "border-yellow-200 bg-yellow-50")}>
              <div className="font-medium mb-2 text-yellow-600">Debug Info:</div>
              <div className="space-y-1">
                <div>wallet_type: <span className="text-primary">{debugInfo.wallet_type || 'undefined'}</span></div>
                <div>account: <span className="opacity-70">{debugInfo.account || 'undefined'}</span></div>
                <div>walletKeyId: <span className={debugInfo.walletKeyId ? "text-green-500" : "text-red-500"}>{debugInfo.walletKeyId || 'undefined'}</span></div>
                <div>accountIndex: <span className="opacity-70">{debugInfo.accountIndex ?? 'undefined'}</span></div>
                <div>seed: <span className="text-green-500 break-all">{debugInfo.seed}</span></div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-xl border-[1.5px] border-red-500/30 bg-red-500/10 flex items-center gap-3">
              <AlertCircle size={18} className="text-red-500" />
              <span className="text-[13px] text-red-500">{error}</span>
            </div>
          )}

          {/* New Key Alert */}
          {newKey && (
            <div className={cn("mb-6 p-4 rounded-xl border-[1.5px]", isDark ? "border-emerald-500/30 bg-emerald-500/10" : "border-emerald-200 bg-emerald-50")}>
              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="text-emerald-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className={cn("text-[14px] font-medium mb-1", isDark ? "text-white" : "text-gray-900")}>
                    API Key Created
                  </h3>
                  <p className={cn("text-[12px] mb-3", isDark ? "text-white/60" : "text-gray-600")}>
                    Copy this key now. You won't be able to see it again.
                  </p>
                  <div className={cn("flex items-center gap-2 p-3 rounded-lg font-mono text-[13px]", isDark ? "bg-black/50" : "bg-white")}>
                    <code className="flex-1 break-all">{newKey}</code>
                    <button
                      onClick={() => copyToClipboard(newKey, 'new')}
                      className="p-1.5 rounded hover:bg-white/10"
                    >
                      {copiedId === 'new' ? <CheckCircle size={16} className="text-emerald-500" /> : <Copy size={16} className="opacity-60" />}
                    </button>
                  </div>
                </div>
                <button onClick={() => setNewKey(null)} className="opacity-40 hover:opacity-100">×</button>
              </div>
            </div>
          )}

          {/* Stripe Success Alert */}
          {stripeSuccess && (
            <div className={cn("mb-6 p-4 rounded-xl border-[1.5px]", isDark ? "border-emerald-500/30 bg-emerald-500/10" : "border-emerald-200 bg-emerald-50")}>
              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="text-emerald-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className={cn("text-[14px] font-medium mb-1", isDark ? "text-white" : "text-gray-900")}>
                    Payment Successful!
                  </h3>
                  <p className={cn("text-[12px]", isDark ? "text-white/60" : "text-gray-600")}>
                    {stripeSuccess.message || (stripeSuccess.credits ? `${stripeSuccess.credits.toLocaleString()} credits added.` : `Upgraded to ${stripeSuccess.tier} tier.`)}
                  </p>
                </div>
                <button onClick={() => setStripeSuccess(null)} className="opacity-40 hover:opacity-100">×</button>
              </div>
            </div>
          )}

          {/* Credits & Billing */}
          {credits && (
            <div className={cn("mb-6 p-5 rounded-xl border-[1.5px]", isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white")}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", isDark ? "bg-primary/10" : "bg-primary/5")}>
                    <Coins size={20} className="text-primary" />
                  </div>
                  <div>
                    <div className={cn("text-[12px] uppercase tracking-wide", isDark ? "text-white/40" : "text-gray-500")}>Credit Balance</div>
                    <div className={cn("text-xl font-medium", isDark ? "text-white" : "text-gray-900")}>
                      {(credits.balance || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {(credits.billingCycle || subscription?.subscription?.billingCycle) && (
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", isDark ? "bg-white/5" : "bg-gray-100")}>
                      <Calendar size={20} className={isDark ? "text-white/60" : "text-gray-500"} />
                    </div>
                    <div>
                      <div className={cn("text-[12px] uppercase tracking-wide", isDark ? "text-white/40" : "text-gray-500")}>
                        {(credits.billingCycle?.billing || subscription?.subscription?.billing) === 'yearly' ? 'Yearly' : 'Monthly'} Cycle
                      </div>
                      <div className={cn("text-[14px]", isDark ? "text-white" : "text-gray-900")}>
                        {credits.billingCycle?.daysRemaining || subscription?.subscription?.billingCycle?.daysRemaining} days remaining
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={fetchCredits}
                  className={cn("p-2 rounded-lg", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}
                >
                  <RefreshCw size={14} className="opacity-40" />
                </button>
              </div>

              {credits.billingCycle && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-[12px]", isDark ? "text-white/40" : "text-gray-500")}>Cycle progress</span>
                    <span className={cn("text-[12px]", isDark ? "text-white/60" : "text-gray-600")}>
                      {Math.round(credits.billingCycle.cycleProgress || 0)}%
                    </span>
                  </div>
                  <div className={cn("h-1.5 rounded-full overflow-hidden", isDark ? "bg-white/10" : "bg-gray-200")}>
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${credits.billingCycle.cycleProgress || 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Create Form Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className={cn("w-full max-w-md mx-4 p-6 rounded-xl border-[1.5px]", isDark ? "bg-black border-white/10" : "bg-white border-gray-200")}>
                <h3 className={cn("text-lg font-medium mb-4", isDark ? "text-white" : "text-gray-900")}>Create API Key</h3>
                <input
                  type="text"
                  placeholder="Key name (e.g., Production Bot)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border-[1.5px] text-[14px] mb-4",
                    isDark ? "bg-white/[0.02] border-white/10 placeholder:text-white/30" : "bg-gray-50 border-gray-200"
                  )}
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowCreateForm(false); setNewKeyName(''); }}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg text-[13px] font-medium border-[1.5px]",
                      isDark ? "border-white/10 hover:bg-white/5" : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createApiKey}
                    disabled={!newKeyName.trim() || creating}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg text-[13px] font-medium",
                      "bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                    )}
                  >
                    {creating ? <Loader2 size={16} className="mx-auto animate-spin" /> : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* XRP Payment Modal */}
          {xrpPayment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className={cn("w-full max-w-md mx-4 p-6 rounded-xl border-[1.5px]", isDark ? "bg-black border-white/10" : "bg-white border-gray-200")}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={cn("text-lg font-medium", isDark ? "text-white" : "text-gray-900")}>
                    Pay with XRP - {xrpPayment.name}
                  </h3>
                  <button onClick={() => { setXrpPayment(null); setTxHash(''); }} className="opacity-40 hover:opacity-100">
                    <X size={20} />
                  </button>
                </div>

                <div className={cn("p-4 rounded-lg mb-4 space-y-3", isDark ? "bg-white/5" : "bg-gray-50")}>
                  <div>
                    <div className={cn("text-[11px] uppercase tracking-wide mb-1", isDark ? "text-white/40" : "text-gray-500")}>Send exactly</div>
                    <div className={cn("text-2xl font-medium", isDark ? "text-white" : "text-gray-900")}>
                      {xrpPayment.amount} XRP
                      {xrpPayment.price && (
                        <span className={cn("text-[13px] ml-2", isDark ? "text-white/40" : "text-gray-500")}>
                          (${xrpPayment.price.usd})
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className={cn("text-[11px] uppercase tracking-wide mb-1", isDark ? "text-white/40" : "text-gray-500")}>To address</div>
                    <div className="flex items-center gap-2">
                      <code className={cn("text-[13px] font-mono break-all", isDark ? "text-white/80" : "text-gray-700")}>
                        {xrpPayment.destination}
                      </code>
                      <button
                        onClick={() => copyToClipboard(xrpPayment.destination, 'dest')}
                        className="p-1 rounded hover:bg-white/10"
                      >
                        {copiedId === 'dest' ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} className="opacity-60" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className={cn("text-[11px] uppercase tracking-wide mb-1", isDark ? "text-white/40" : "text-gray-500")}>Destination Tag (required)</div>
                    <div className="flex items-center gap-2">
                      <code className={cn("text-[18px] font-mono font-medium", isDark ? "text-primary" : "text-primary")}>
                        {xrpPayment.destinationTag}
                      </code>
                      <button
                        onClick={() => copyToClipboard(String(xrpPayment.destinationTag), 'tag')}
                        className="p-1 rounded hover:bg-white/10"
                      >
                        {copiedId === 'tag' ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} className="opacity-60" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pay Now Button */}
                <button
                  onClick={submitXrpPayment}
                  disabled={paymentStatus}
                  className={cn(
                    "w-full py-3 rounded-lg text-[14px] font-medium flex items-center justify-center gap-2 mb-4",
                    "bg-primary text-white hover:bg-primary/90 disabled:opacity-70"
                  )}
                >
                  {paymentStatus === 'signing' ? (
                    <><Loader2 size={16} className="animate-spin" /> Signing...</>
                  ) : paymentStatus === 'submitting' ? (
                    <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                  ) : paymentStatus === 'verifying' ? (
                    <><Loader2 size={16} className="animate-spin" /> Verifying...</>
                  ) : (
                    <>Pay {xrpPayment.amount} XRP Now</>
                  )}
                </button>

                <div className={cn("text-center text-[12px] mb-3", isDark ? "text-white/40" : "text-gray-500")}>
                  — or pay manually —
                </div>

                <div className={cn("p-3 rounded-lg mb-3 text-[12px]", isDark ? "bg-white/5 text-white/60" : "bg-gray-50 text-gray-600")}>
                  Send from external wallet. Expires in {xrpPayment.expiresIn || '30 minutes'}.
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Paste transaction hash after sending"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg border-[1.5px] text-[13px] font-mono",
                      isDark ? "bg-white/[0.02] border-white/10 placeholder:text-white/30" : "bg-gray-50 border-gray-200"
                    )}
                  />
                  <button
                    onClick={verifyXrpPayment}
                    disabled={!txHash.trim() || verifyingTx}
                    className={cn(
                      "w-full py-2.5 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2 border-[1.5px]",
                      isDark ? "border-white/10 hover:bg-white/5 disabled:opacity-50" : "border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                    )}
                  >
                    {verifyingTx ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Verify Payment
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Usage Stats */}
          {usage?.usage?.[0] && (
            <div className={cn("mb-6 p-5 rounded-xl border-[1.5px]", isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white")}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={cn("text-[14px] font-medium", isDark ? "text-white" : "text-gray-900")}>Today's Usage</h3>
                <span className={cn("text-[12px] px-2 py-1 rounded-full", tiers.find(t => t.id === (usage.usage[0].tier || 'free'))?.color, isDark ? "bg-white/5" : "bg-gray-100")}>
                  {(usage.usage[0].tier || 'free').toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className={cn("h-2 rounded-full overflow-hidden", isDark ? "bg-white/10" : "bg-gray-200")}>
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min((usage.usage[0].today?.used / usage.usage[0].today?.limit) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <span className={cn("text-[13px] font-mono", isDark ? "text-white/60" : "text-gray-600")}>
                  {usage.usage[0].today?.used?.toLocaleString()} / {usage.usage[0].today?.limit?.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* API Keys List */}
          <div className={cn("rounded-xl border-[1.5px] overflow-hidden", isDark ? "border-white/10" : "border-gray-200")}>
            <div className={cn("px-5 py-3 border-b", isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50")}>
              <div className="flex items-center justify-between">
                <span className={cn("text-[13px] font-medium", isDark ? "text-white/60" : "text-gray-600")}>Your API Keys</span>
                <button onClick={fetchApiKeys} className="p-1.5 rounded hover:bg-white/10">
                  <RefreshCw size={14} className="opacity-40" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <Loader2 size={24} className="mx-auto animate-spin opacity-40" />
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="p-12 text-center">
                <Key size={32} className="mx-auto mb-3 opacity-20" />
                <p className={cn("text-[14px]", isDark ? "text-white/40" : "text-gray-500")}>No API keys yet</p>
                <p className={cn("text-[12px] mt-1", isDark ? "text-white/30" : "text-gray-400")}>Create one to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {apiKeys.map((key) => (
                  <div key={key.id || key._id} className={cn("px-5 py-4 flex items-center gap-4", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                    <div className={cn("p-2 rounded-lg", isDark ? "bg-white/5" : "bg-gray-100")}>
                      <Key size={18} className="opacity-60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[14px] font-medium", isDark ? "text-white" : "text-gray-900")}>{key.name}</span>
                        <span className={cn("text-[11px] px-2 py-0.5 rounded-full", isDark ? "bg-white/10 text-white/40" : "bg-gray-100 text-gray-500")}>
                          {key.tier || 'free'}
                        </span>
                      </div>
                      <div className={cn("text-[12px] mt-0.5 font-mono", isDark ? "text-white/40" : "text-gray-500")}>
                        {key.keyPrefix}••••••••
                      </div>
                    </div>
                    <div className={cn("text-[12px] text-right", isDark ? "text-white/40" : "text-gray-500")}>
                      <div>Created {formatDate(key.createdAt)}</div>
                      {key.lastUsed && <div>Used {formatDate(key.lastUsed)}</div>}
                    </div>
                    <button
                      onClick={() => copyToClipboard(key.keyPrefix, key.id)}
                      className={cn("p-2 rounded-lg", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}
                      title="Copy prefix"
                    >
                      {copiedId === key.id ? <CheckCircle size={16} className="text-emerald-500" /> : <Copy size={16} className="opacity-40" />}
                    </button>
                    <button
                      onClick={() => deleteApiKey(key.id)}
                      disabled={deletingId === key.id}
                      className={cn("p-2 rounded-lg text-red-500", isDark ? "hover:bg-red-500/10" : "hover:bg-red-50")}
                      title="Delete key"
                    >
                      {deletingId === key.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Credit Packages */}
          <div className="mt-8">
            <h2 className={cn("text-lg font-medium mb-4", isDark ? "text-white" : "text-gray-900")}>
              <Zap size={18} className="inline mr-2 text-primary" />
              Buy Credits
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={cn(
                    "p-5 rounded-xl border-[1.5px] transition-colors",
                    isDark ? "border-white/10 bg-white/[0.02] hover:border-white/20" : "border-gray-200 bg-white hover:border-gray-300"
                  )}
                >
                  <div className={cn("text-[13px] font-medium mb-1", pkg.color)}>{pkg.name}</div>
                  <div className={cn("text-2xl font-normal", isDark ? "text-white" : "text-gray-900")}>
                    ${pkg.price}
                  </div>
                  <div className={cn("text-[12px] mt-1 mb-4", isDark ? "text-white/60" : "text-gray-600")}>
                    {pkg.credits} credits
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => buyWithXRP('credits', pkg.id)}
                      disabled={purchasing === `xrp_${pkg.id}`}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-[12px] font-medium flex items-center justify-center gap-1 border-[1.5px]",
                        isDark ? "border-white/10 hover:bg-white/5" : "border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      {purchasing === `xrp_${pkg.id}` ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <>XRP</>
                      )}
                    </button>
                    <button
                      onClick={() => buyWithStripe('credits', pkg.id)}
                      disabled={purchasing === pkg.id}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-[12px] font-medium flex items-center justify-center gap-1",
                        "bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                      )}
                    >
                      {purchasing === pkg.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <>
                          <CreditCard size={12} />
                          Card
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subscription Tiers */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className={cn("text-lg font-medium", isDark ? "text-white" : "text-gray-900")}>Subscription Plans</h2>
              <div className={cn("flex items-center gap-1 p-1 rounded-lg", isDark ? "bg-white/5" : "bg-gray-100")}>
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors",
                    billingPeriod === 'monthly'
                      ? "bg-primary text-white"
                      : isDark ? "text-white/60 hover:text-white" : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod('yearly')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors flex items-center gap-1.5",
                    billingPeriod === 'yearly'
                      ? "bg-primary text-white"
                      : isDark ? "text-white/60 hover:text-white" : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  Yearly
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[10px]",
                    billingPeriod === 'yearly' ? "bg-white/20" : "bg-emerald-500/20 text-emerald-500"
                  )}>
                    2mo free
                  </span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {tiers.map((tier) => {
                const price = billingPeriod === 'yearly' ? tier.yearly : tier.monthly;
                const isCurrentPlan = usage?.usage?.[0]?.tier === tier.id;

                return (
                  <div
                    key={tier.id}
                    className={cn(
                      "p-5 rounded-xl border-[1.5px] transition-colors",
                      isCurrentPlan
                        ? "border-primary bg-primary/5"
                        : isDark ? "border-white/10 bg-white/[0.02] hover:border-white/20" : "border-gray-200 bg-white hover:border-gray-300"
                    )}
                  >
                    <div className={cn("text-[13px] font-medium mb-1", tier.color)}>{tier.name}</div>
                    <div className={cn("text-2xl font-normal", isDark ? "text-white" : "text-gray-900")}>
                      {price === 0 ? 'Free' : `$${price.toLocaleString()}`}
                      {price > 0 && (
                        <span className={cn("text-[12px] ml-1", isDark ? "text-white/40" : "text-gray-500")}>
                          /{billingPeriod === 'yearly' ? 'yr' : 'mo'}
                        </span>
                      )}
                    </div>
                    {billingPeriod === 'yearly' && tier.savings > 0 && (
                      <div className="text-[11px] text-emerald-500 mt-1">
                        Save ${tier.savings}/year
                      </div>
                    )}
                    <div className={cn("text-[12px] space-y-1 mt-2 mb-4", isDark ? "text-white/60" : "text-gray-600")}>
                      <div>{tier.credits} credits/mo</div>
                      <div>{tier.rps} req/sec</div>
                    </div>
                    {isCurrentPlan ? (
                      <div className="py-2 text-center text-[12px] text-primary font-medium">Current Plan</div>
                    ) : tier.id !== 'free' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => buyWithXRP('tier', tier.id)}
                          disabled={purchasing === `xrp_${tier.id}`}
                          className={cn(
                            "flex-1 py-2 rounded-lg text-[12px] font-medium flex items-center justify-center gap-1 border-[1.5px]",
                            isDark ? "border-white/10 hover:bg-white/5" : "border-gray-200 hover:bg-gray-50"
                          )}
                        >
                          {purchasing === `xrp_${tier.id}` ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <>XRP</>
                          )}
                        </button>
                        <button
                          onClick={() => buyWithStripe('tier', tier.id)}
                          disabled={purchasing === tier.id}
                          className={cn(
                          "flex-1 py-2 rounded-lg text-[12px] font-medium flex items-center justify-center gap-1",
                          "bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                        )}
                      >
                        {purchasing === tier.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <>
                            <CreditCard size={12} />
                            Card
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DashboardPage;
