import React, { useState, useContext, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import api from 'src/utils/api';
import { sign } from 'ripple-keypairs';
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Check,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  CreditCard,
  Coins,
  Zap,
  X,
  Calendar,
  Shield,
  BarChart3,
  DollarSign,
  MessageSquare,
  Settings,
  Search,
  Infinity,
  Home,
  Users,
  FileText,
  Mail,
  ExternalLink
} from 'lucide-react';
import { ThemeContext, WalletContext } from 'src/context/AppContext';
import { cn } from 'src/utils/cn';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import PaymentModal from 'src/components/PaymentModal';

const BASE_URL = 'https://api.xrpl.to/v1';

const DashboardPage = () => {
  const { themeName } = useContext(ThemeContext);
  const { accountProfile, setOpenWalletModal } = useContext(WalletContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

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
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, type: null, item: null });
  const [verifyingTx, setVerifyingTx] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null); // 'signing' | 'submitting' | 'verifying'
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' | 'yearly'

  // Admin state
  const [adminTab, setAdminTab] = useState('usage'); // 'usage' | 'credits' | 'revenue' | 'keys' | 'chat'
  const [adminUsage, setAdminUsage] = useState(null);
  const [adminCredits, setAdminCredits] = useState(null);
  const [adminRevenue, setAdminRevenue] = useState(null);
  const [adminChatKeys, setAdminChatKeys] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [showAdminCreateKey, setShowAdminCreateKey] = useState(false);
  const [showAdminAddCredits, setShowAdminAddCredits] = useState(false);
  const [showAdminChatAccess, setShowAdminChatAccess] = useState(false);
  const [showAdminPlatformKey, setShowAdminPlatformKey] = useState(false);
  const [adminFormData, setAdminFormData] = useState({});
  const [adminSearchQuery, setAdminSearchQuery] = useState('');

  // Sidebar navigation
  const [activeSection, setActiveSection] = useState('overview');

  const router = useRouter();

  const tiers = [
    {
      id: 'free',
      name: 'Free',
      description: 'Ideal for testing',
      monthly: 0,
      yearly: 0,
      credits: '1M',
      rps: 10,
      tps: 1,
      features: ['1M credits', '10 Requests / sec', '1 TurboSubmit / sec', 'WebSocket access', 'Community support'],
      color: 'text-gray-500',
      gradient: 'from-gray-400 to-gray-500'
    },
    {
      id: 'developer',
      name: 'Developer',
      description: 'For small projects',
      monthly: 49,
      yearly: 490,
      savings: 98,
      credits: '10M',
      rps: 50,
      tps: 5,
      features: ['10M credits', '50 Requests / sec', '5 TurboSubmit / sec', 'WebSocket access', 'Chat support'],
      color: 'text-blue-500',
      gradient: 'from-blue-400 to-indigo-500',
      recommended: true
    },
    {
      id: 'business',
      name: 'Business',
      description: 'For growing teams',
      monthly: 499,
      yearly: 4990,
      savings: 998,
      credits: '100M',
      rps: 200,
      tps: 50,
      features: ['100M credits', '200 Requests / sec', '50 TurboSubmit / sec', 'Priority WebSocket', 'Priority chat support'],
      color: 'text-purple-500',
      gradient: 'from-purple-400 to-violet-500'
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'For teams at scale',
      monthly: 999,
      yearly: 9990,
      savings: 1998,
      credits: '200M',
      rps: 500,
      tps: 100,
      features: ['200M credits', '500 Requests / sec', '100 TurboSubmit / sec', 'Dedicated WebSocket', 'Telegram + Slack support'],
      color: 'text-amber-500',
      gradient: 'from-amber-400 to-orange-500'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For enterprise scale',
      monthly: null,
      yearly: null,
      credits: '1B+',
      rps: 'Custom',
      tps: 'Custom',
      features: ['Volume discounts', 'Custom rate limits', 'Dedicated XRPL node', 'Private WebSocket', 'Uptime SLAs', 'Direct engineering support'],
      color: 'text-rose-500',
      gradient: 'from-rose-400 to-pink-500',
      enterprise: true
    }
  ];

  const packages = [
    { id: 'starter', name: 'Starter', price: 5, credits: '1M', color: 'text-emerald-500' },
    { id: 'standard', name: 'Standard', price: 20, credits: '5M', color: 'text-blue-500' },
    { id: 'bulk', name: 'Bulk', price: 75, credits: '25M', color: 'text-purple-500' },
    { id: 'mega', name: 'Mega', price: 250, credits: '100M', color: 'text-amber-500' }
  ];

  const walletAddress = accountProfile?.account;
  const [isAdmin, setIsAdmin] = useState(false);

  // Detect algorithm from seed prefix
  const getAlgorithmFromSeed = (seed) => seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';

  // Get wallet for signing based on wallet type
  const getDeviceWallet = useCallback(async () => {
    if (!accountProfile) return null;

    try {
      const { Wallet } = await import('xrpl');

      // If seed is directly available (OAuth wallets after login)
      if (accountProfile.seed) {
        return Wallet.fromSeed(accountProfile.seed, { algorithm: getAlgorithmFromSeed(accountProfile.seed) });
      }

      // Device wallet - retrieve from encrypted storage
      if (accountProfile.wallet_type === 'device') {
        const { UnifiedWalletStorage, deviceFingerprint } = await import('src/utils/encryptedWalletStorage');
        const walletStorage = new UnifiedWalletStorage();
        const deviceKeyId = accountProfile.deviceKeyId || await deviceFingerprint.getDeviceId();
        const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);

        if (storedPassword) {
          const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
          if (walletData?.seed) {
            const wallet = Wallet.fromSeed(walletData.seed, { algorithm: getAlgorithmFromSeed(walletData.seed) });
            // Verify derived wallet matches expected address
            if (wallet.address !== accountProfile.account) {
              console.error('Wallet mismatch:', { derived: wallet.address, expected: accountProfile.account });
              return null;
            }
            return wallet;
          }
        }
        return null;
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
            return Wallet.fromSeed(walletData.seed, { algorithm: getAlgorithmFromSeed(walletData.seed) });
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
      const headers = await getAuthHeaders();
      if (!headers) { setLoading(false); return; }
      const [keysRes, usageRes] = await Promise.all([
        api.get(`${BASE_URL}/keys/${walletAddress}`, { headers }),
        api.get(`${BASE_URL}/keys/${walletAddress}/usage`, { headers })
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
  }, [walletAddress, getAuthHeaders]);

  const fetchCredits = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      const [creditsRes, subRes] = await Promise.all([
        api.get(`${BASE_URL}/keys/${walletAddress}/credits`, { headers }),
        api.get(`${BASE_URL}/keys/${walletAddress}/subscription`, { headers }).catch(() => null)
      ]);
      setCredits(creditsRes.data);
      if (subRes?.data) setSubscription(subRes.data);
      // Check admin status from API response
      if (creditsRes.data?.isAdmin || creditsRes.data?.admin) {
        setIsAdmin(true);
      }
    } catch (err) {
      console.error('Failed to fetch credits:', err);
    }
  }, [walletAddress, getAuthHeaders]);

  // Admin fetch functions
  const fetchAdminData = useCallback(async (tab) => {
    if (!isAdmin) return;

    const headers = await getAuthHeaders();
    if (!headers) return;

    setAdminLoading(true);
    try {
      switch (tab) {
        case 'usage':
          const usageRes = await api.get(`${BASE_URL}/keys/admin/usage`, { headers });
          setAdminUsage(usageRes.data);
          break;
        case 'credits':
          const creditsRes = await api.get(`${BASE_URL}/keys/admin/credits`, { headers });
          setAdminCredits(creditsRes.data);
          break;
        case 'revenue':
          const revenueRes = await api.get(`${BASE_URL}/keys/admin/revenue`, { headers });
          setAdminRevenue(revenueRes.data);
          break;
        case 'chat':
          const chatRes = await api.get(`${BASE_URL}/keys/admin/chat-keys`, { headers });
          setAdminChatKeys(chatRes.data);
          break;
      }
    } catch (err) {
      console.error(`Failed to fetch admin ${tab}:`, err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setIsAdmin(false);
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || `Failed to load admin ${tab}`);
      }
    } finally {
      setAdminLoading(false);
    }
  }, [isAdmin, getAuthHeaders]);

  // Admin action: Create partner key
  const adminCreateKey = async () => {
    if (!isAdmin) return;

    const { wallet, name, tier, credits: creditAmount } = adminFormData;
    if (!wallet || !name) {
      setError('Wallet and name are required');
      return;
    }

    const headers = await getAuthHeaders();
    if (!headers) return;

    setAdminLoading(true);
    try {
      const payload = { wallet, name, tier: tier || 'free' };
      if (creditAmount) payload.credits = parseInt(creditAmount, 10);
      const res = await api.post(`${BASE_URL}/keys/admin/create-key`, payload, { headers });

      setNewKey(res.data.apiKey);
      setShowAdminCreateKey(false);
      setAdminFormData({});
      fetchAdminData('usage');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create partner key');
    } finally {
      setAdminLoading(false);
    }
  };

  // Admin action: Add credits
  const adminAddCredits = async () => {
    if (!isAdmin) return;

    const { wallet, credits: creditAmount, reason } = adminFormData;
    if (!wallet || !creditAmount) {
      setError('Wallet and credits amount are required');
      return;
    }

    const headers = await getAuthHeaders();
    if (!headers) return;

    setAdminLoading(true);
    try {
      const payload = { wallet, credits: parseInt(creditAmount, 10) };
      if (reason) payload.reason = reason;
      await api.post(`${BASE_URL}/keys/admin/add-credits`, payload, { headers });

      setShowAdminAddCredits(false);
      setAdminFormData({});
      fetchAdminData('credits');
      setStripeSuccess({ message: `Added ${parseInt(creditAmount, 10).toLocaleString()} credits to ${wallet}` });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add credits');
    } finally {
      setAdminLoading(false);
    }
  };

  // Admin action: Grant/revoke chat access
  const adminSetChatAccess = async () => {
    if (!isAdmin) return;

    const { wallet, chatAccess, platform } = adminFormData;
    if (!wallet) {
      setError('Wallet is required');
      return;
    }

    const headers = await getAuthHeaders();
    if (!headers) return;

    setAdminLoading(true);
    try {
      await api.post(`${BASE_URL}/keys/admin/chat-access`, {
        wallet,
        chatAccess: chatAccess !== false,
        platform: platform || ''
      }, { headers });

      setShowAdminChatAccess(false);
      setAdminFormData({});
      fetchAdminData('chat');
      setStripeSuccess({ message: `Chat access ${chatAccess !== false ? 'granted' : 'revoked'} for ${wallet}` });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update chat access');
    } finally {
      setAdminLoading(false);
    }
  };

  // Admin action: Create platform key
  const adminCreatePlatformKey = async () => {
    if (!isAdmin) return;

    const { wallet, platform, tier, name, credits: creditAmount } = adminFormData;
    if (!wallet || !platform) {
      setError('Wallet and platform are required');
      return;
    }

    const headers = await getAuthHeaders();
    if (!headers) return;

    setAdminLoading(true);
    try {
      const payload = { wallet, platform, tier: tier || 'developer' };
      if (name) payload.name = name;
      if (creditAmount) payload.credits = parseInt(creditAmount, 10);
      const res = await api.post(`${BASE_URL}/keys/admin/platform-key`, payload, { headers });

      setNewKey(res.data.apiKey);
      setShowAdminPlatformKey(false);
      setAdminFormData({});
      fetchAdminData('usage');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create platform key');
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (accountProfile?.account) {
      fetchApiKeys();
      fetchCredits();
    } else {
      setLoading(false);
      setIsAdmin(false);
    }
  }, [accountProfile, fetchApiKeys, fetchCredits]);

  // Auto-fetch admin data when admin status is confirmed
  useEffect(() => {
    if (isAdmin) {
      fetchAdminData('usage');
    }
  }, [isAdmin, fetchAdminData]);

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
      api
        .get(`${BASE_URL}/keys/stripe/status/${sessionId}`)
        .then((res) => {
          if (res.data.status === 'complete' || res.data.status === 'paid') {
            setStripeSuccess({
              credits: res.data.credits,
              tier: res.data.tier
            });
            fetchCredits();
            fetchApiKeys();
          }
        })
        .catch((err) => console.error('Stripe status check failed:', err))
        .finally(() => {
          router.replace('/dashboard', undefined, { shallow: true });
        });
    }
  }, [router.query, fetchCredits, fetchApiKeys, router]);

  const buyWithStripe = async (type, id) => {
    if (!walletAddress) {
      setOpenWalletModal(true);
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

      const res = await api.post(`${BASE_URL}/keys/stripe/checkout`, payload);

      if (res.data.checkoutUrl) {
        const { safeCheckoutRedirect } = await import('src/utils/api');
        if (!safeCheckoutRedirect(res.data.checkoutUrl)) {
          setError('Invalid checkout URL');
        }
      } else {
        setError(res.data.error || 'Failed to create checkout session');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setPurchasing(null);
    }
  };

  const buyWithXRP = async (type, id) => {
    if (!walletAddress) {
      setOpenWalletModal(true);
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

      const res = await api.post(`${BASE_URL}/keys/purchase`, payload);

      if (res.data.payment) {
        setXrpPayment({
          ...res.data.payment,
          type,
          id,
          name:
            type === 'credits'
              ? packages.find((p) => p.id === id)?.name
              : tiers.find((t) => t.id === id)?.name,
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

      // Submit via API
      setPaymentStatus('submitting');
      const { xrpToDrops } = await import('xrpl');
      const { submitTransaction } = await import('src/utils/api');

      const payment = {
        TransactionType: 'Payment',
        Account: walletAddress,
        Destination: xrpPayment.destination,
        DestinationTag: xrpPayment.destinationTag,
        Amount: xrpToDrops(xrpPayment.amount),
        SourceTag: 161803
      };

      const result = await submitTransaction(wallet, payment);
      const txHash = result.hash || result.tx_json?.hash;

      if (!result?.engine_result || result.engine_result !== 'tesSUCCESS') {
        const txResult = result?.engine_result || 'Unknown error';
        if (txResult === 'tecUNFUNDED_PAYMENT') {
          setError('Insufficient XRP balance. Please fund your wallet or pay with card.');
        } else {
          setError(`Transaction failed: ${txResult}`);
        }
        setPaymentStatus(null);
        return;
      }

      // Verify payment (backend auto-polls)
      setPaymentStatus('verifying');
      const verifyRes = await api.post(`${BASE_URL}/keys/verify-payment`, {
        txHash
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
      const res = await api.post(`${BASE_URL}/keys/verify-payment`, {
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

      const res = await api.post(`${BASE_URL}/keys`, { name: newKeyName.trim() }, { headers });

      setNewKey(res.data.apiKey);
      setNewKeyName('');
      setShowCreateForm(false);
      fetchApiKeys();
    } catch (err) {
      setError(
        err.response?.data?.message || err.response?.data?.error || 'Failed to create API key'
      );
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

      await api.delete(`${BASE_URL}/keys/${walletAddress}/${keyId}`, { headers });
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

  const formatCredits = (balance) => {
    if (balance === -1) return 'Unlimited';
    if (typeof balance === 'number') return balance.toLocaleString();
    return balance || '0';
  };

  // Helper to extract array from various API response structures
  const getDataArray = (data, ...keys) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    for (const key of keys) {
      if (Array.isArray(data[key])) return data[key];
    }
    // If it's an object with entries, try to convert
    if (typeof data === 'object' && !Array.isArray(data)) {
      const values = Object.values(data);
      if (values.length > 0 && typeof values[0] === 'object') {
        return values;
      }
    }
    return [];
  };

  // Helper to normalize and aggregate usage data from API response
  // API returns: { usage: [{ tier, today: { requests }, month: { requests, total } }] }
  const getUsageStats = (usageData) => {
    if (!usageData) return null;

    const usageArray = getDataArray(usageData, 'usage', 'keys', 'data');
    if (usageArray.length === 0) return null;

    // Aggregate usage across all keys
    let totalToday = 0;
    let totalMonth = 0;
    let tier = subscription?.tier || 'free';

    for (const item of usageArray) {
      // Handle { today: { requests: N } } format (actual API response)
      const todayCount = item.today?.requests ?? item.today?.used ?? 0;
      const monthCount = item.month?.requests ?? item.month?.total ?? 0;
      totalToday += todayCount;
      totalMonth += monthCount;
      if (item.tier) tier = item.tier;
    }

    return {
      tier,
      today: { used: totalToday, limit: -1 },
      month: { used: totalMonth }
    };
  };

  // Sidebar navigation items
  const navItems = [
    { id: 'overview', label: 'Home', icon: Home },
    { id: 'keys', label: 'API Keys', icon: Key },
    { id: 'usage', label: 'Usage', icon: BarChart3 },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    ...(isAdmin ? [
      { id: 'admin-users', label: 'All Users', icon: Users },
      { id: 'admin-credits', label: 'Credits', icon: Coins },
      { id: 'admin-revenue', label: 'Revenue', icon: DollarSign },
      { id: 'admin-chat', label: 'Chat Keys', icon: MessageSquare },
    ] : [])
  ];

  if (!accountProfile?.account) {
    return (
      <div className="flex-1">
        <Head>
          <title>Dashboard - XRPL.to</title>
        </Head>
        <Header />
        <div
          className={cn(
            'min-h-screen flex items-center justify-center',
            isDark ? 'bg-black' : 'bg-gray-50'
          )}
        >
          {hydrated && (
            <div
              className={cn(
                'text-center p-8 rounded-xl border-[1.5px]',
                isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white'
              )}
            >
              <Key size={48} className="mx-auto mb-4 opacity-20" />
              <h2 className={cn('text-xl font-medium mb-2', isDark ? 'text-white' : 'text-gray-900')}>
                Sign in Required
              </h2>
              <p className={cn('text-[14px]', isDark ? 'text-white/60' : 'text-gray-600')}>
                Connect your wallet to manage API keys
              </p>
            </div>
          )}
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Head>
        <title>Dashboard - XRPL.to</title>
        <meta name="description" content="Manage your XRPL.to API keys" />
      </Head>

      <Header />

      <div className={cn('flex-1 flex flex-col md:flex-row', isDark ? 'bg-black' : 'bg-gray-50')}>
        {/* Mobile Nav */}
        <div className={cn('md:hidden flex overflow-x-auto border-b shrink-0 px-1 no-scrollbar', isDark ? 'border-white/10 bg-[#0d0d0d]' : 'border-gray-200 bg-white')}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveSection(item.id); if (item.id.startsWith('admin-')) fetchAdminData(item.id.replace('admin-', '')); }}
              className={cn(
                'flex items-center gap-1 px-1.5 py-1 text-[10px] whitespace-nowrap shrink-0 border-b-2 transition-colors',
                activeSection === item.id
                  ? 'border-primary text-primary'
                  : cn('border-transparent', isDark ? 'text-white/50' : 'text-gray-500')
              )}
            >
              <item.icon size={12} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Sidebar - desktop only */}
        <div className={cn(
          'w-52 shrink-0 border-r hidden md:flex flex-col',
          isDark ? 'border-white/10 bg-[#0d0d0d]' : 'border-gray-200 bg-white'
        )}>
          <div className="p-4">
            <div className="space-y-0.5">
              {navItems.filter(item => !item.id.startsWith('admin-')).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors',
                    activeSection === item.id
                      ? isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'
                      : isDark ? 'text-white/60 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </div>

            {/* Admin Section */}
            {isAdmin && (
              <div className={cn('mt-6 pt-6 border-t', isDark ? 'border-white/10' : 'border-gray-200')}>
                <div className={cn('text-[10px] uppercase tracking-wider mb-3 px-3', isDark ? 'text-white/30' : 'text-gray-400')}>Admin</div>
                <div className="space-y-0.5">
                  {navItems.filter(item => item.id.startsWith('admin-')).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveSection(item.id); fetchAdminData(item.id.replace('admin-', '')); }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors',
                        activeSection === item.id
                          ? isDark ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'
                          : isDark ? 'text-white/50 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                      )}
                    >
                      <item.icon size={16} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Support & Docs */}
          <div className={cn('px-4 py-3 border-t space-y-0.5 mt-auto', isDark ? 'border-white/10' : 'border-gray-200')}>
            <a href="/docs" className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors', isDark ? 'text-white/50 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50')}>
              <FileText size={16} />Documentation
            </a>
            <a href="mailto:hello@xrpl.to" className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors', isDark ? 'text-white/50 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50')}>
              <Mail size={16} />Support
            </a>
            <a href="https://x.com/xrplto" target="_blank" rel="noopener noreferrer" className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors', isDark ? 'text-white/50 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50')}>
              <ExternalLink size={16} />@xrplto
            </a>
          </div>

          {/* Wallet Info */}
          <div className={cn('p-4 border-t', isDark ? 'border-white/10' : 'border-gray-200')}>
            <div className={cn('text-[11px] font-mono truncate mb-1', isDark ? 'text-white/40' : 'text-gray-500')}>
              {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
            </div>
            <div className={cn('text-[13px] font-medium flex items-center gap-1.5', isDark ? 'text-white' : 'text-gray-900')}>
              {credits?.balance === -1 ? <><Infinity size={14} className="text-primary" />Unlimited</> : <>{formatCredits(credits?.balance)} credits</>}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-[1400px]">
            {/* Alerts */}
            {error && (
              <div className="mb-6 p-4 rounded-xl border-[1.5px] border-red-500/30 bg-red-500/10 flex items-center gap-3">
                <AlertCircle size={18} className="text-red-500" />
                <span className="text-[13px] text-red-500">{error}</span>
                <button onClick={() => setError(null)} className="ml-auto opacity-60 hover:opacity-100"><X size={16} /></button>
              </div>
            )}

            {newKey && (
              <div className={cn('mb-6 p-4 rounded-xl border-[1.5px]', isDark ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-50')}>
                <div className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-emerald-500 mt-0.5" />
                  <div className="flex-1">
                    <h3 className={cn('text-[14px] font-medium mb-1', isDark ? 'text-white' : 'text-gray-900')}>API Key Created</h3>
                    <p className={cn('text-[12px] mb-3', isDark ? 'text-white/60' : 'text-gray-600')}>Copy this key now. You won't be able to see it again.</p>
                    <div className={cn('flex items-center gap-2 p-3 rounded-lg font-mono text-[13px]', isDark ? 'bg-black/50' : 'bg-white')}>
                      <code className="flex-1 break-all">{newKey}</code>
                      <button onClick={() => copyToClipboard(newKey, 'new')} className="p-1.5 rounded hover:bg-white/10">
                        {copiedId === 'new' ? <CheckCircle size={16} className="text-emerald-500" /> : <Copy size={16} className="opacity-60" />}
                      </button>
                    </div>
                  </div>
                  <button onClick={() => setNewKey(null)} className="opacity-40 hover:opacity-100"><X size={18} /></button>
                </div>
              </div>
            )}

            {stripeSuccess && (
              <div className={cn('mb-6 p-4 rounded-xl border-[1.5px]', isDark ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-50')}>
                <div className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-emerald-500 mt-0.5" />
                  <div className="flex-1">
                    <h3 className={cn('text-[14px] font-medium mb-1', isDark ? 'text-white' : 'text-gray-900')}>Payment Successful!</h3>
                    <p className={cn('text-[12px]', isDark ? 'text-white/60' : 'text-gray-600')}>
                      {stripeSuccess.message || (stripeSuccess.credits ? `${stripeSuccess.credits.toLocaleString()} credits added.` : `Upgraded to ${stripeSuccess.tier} tier.`)}
                    </p>
                  </div>
                  <button onClick={() => setStripeSuccess(null)} className="opacity-40 hover:opacity-100"><X size={18} /></button>
                </div>
              </div>
            )}

            {/* Overview Section - Helius Style */}
            {activeSection === 'overview' && (
              <div className="space-y-8">
                {/* Header Cards - Two Column Symmetrical */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Current Plan Card */}
                  <div className={cn('p-6 rounded-xl border-[1.5px]', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white')}>
                    <div className={cn('text-[12px] uppercase tracking-wide mb-2', isDark ? 'text-white/40' : 'text-gray-500')}>Current Plan</div>
                    <div className={cn('text-3xl font-semibold mb-4 capitalize', isDark ? 'text-white' : 'text-gray-900')}>{credits?.tier || 'Free'}</div>
                    {(!credits?.tier || credits?.tier === 'free') ? (
                      <div className={cn('p-3 rounded-lg flex items-center gap-3', isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200')}>
                        <AlertCircle size={16} className="text-amber-500" />
                        <span className={cn('text-[12px]', isDark ? 'text-white/80' : 'text-gray-700')}>
                          The Free Plan provides basic access. <span className="text-primary cursor-pointer hover:underline" onClick={() => setActiveSection('billing')}>Upgrade Now</span>
                        </span>
                      </div>
                    ) : (
                      <div className={cn('p-3 rounded-lg flex items-center gap-3', isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200')}>
                        <CheckCircle size={16} className="text-emerald-500" />
                        <span className={cn('text-[12px]', isDark ? 'text-white/80' : 'text-gray-700')}>
                          You have full access to all features.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Credit Usage Card */}
                  <div className={cn('p-6 rounded-xl border-[1.5px]', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white')}>
                    <div className={cn('text-[12px] uppercase tracking-wide mb-2', isDark ? 'text-white/40' : 'text-gray-500')}>Credit Usage</div>
                    <div className={cn('text-3xl font-semibold mb-1 flex items-center gap-2', isDark ? 'text-white' : 'text-gray-900')}>
                      {credits?.balance === -1 ? <><Infinity size={28} className="text-primary" />Unlimited</> : (
                        <>{formatCredits(getUsageStats(usage)?.today?.used || 0)} <span className={cn('text-lg', isDark ? 'text-white/40' : 'text-gray-400')}>/ {formatCredits(credits?.balance || 0)}</span></>
                      )}
                    </div>
                    <div className={cn('text-[12px] mb-4', isDark ? 'text-white/40' : 'text-gray-500')}>Credits used / Total credits</div>
                    <button onClick={() => setActiveSection('usage')} className="w-full py-3 rounded-lg text-[13px] font-medium bg-primary text-white hover:bg-primary/90 flex items-center justify-center gap-2">
                      <BarChart3 size={16} />Check Usage
                    </button>
                  </div>
                </div>

                {/* Core Services Section */}
                <div>
                  <h2 className={cn('text-xl font-semibold mb-5', isDark ? 'text-white' : 'text-gray-900')}>Core Services</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* API Keys Card */}
                    <div className={cn('p-6 rounded-xl border-[1.5px] flex flex-col', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white')}>
                      <div className="flex items-center gap-3 mb-3">
                        <Key size={20} className="text-primary" />
                        <span className={cn('text-[16px] font-semibold', isDark ? 'text-white' : 'text-gray-900')}>API Keys</span>
                      </div>
                      <p className={cn('text-[13px] flex-1 mb-4', isDark ? 'text-white/60' : 'text-gray-600')}>
                        Create and manage API keys for programmatic access to XRPL.to services. {apiKeys.length} active key{apiKeys.length !== 1 ? 's' : ''}.
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <button onClick={() => setActiveSection('keys')} className="text-[13px] text-primary hover:underline flex items-center gap-1">Learn more →</button>
                        <button onClick={() => setShowCreateForm(true)} className={cn('px-4 py-2 rounded-lg text-[13px] font-medium', isDark ? 'bg-white/10 hover:bg-white/15' : 'bg-gray-100 hover:bg-gray-200')}>Get Started</button>
                      </div>
                    </div>

                    {/* Usage Card */}
                    <div className={cn('p-6 rounded-xl border-[1.5px] flex flex-col', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white')}>
                      <div className="flex items-center gap-3 mb-3">
                        <Zap size={20} className="text-primary" />
                        <span className={cn('text-[16px] font-semibold', isDark ? 'text-white' : 'text-gray-900')}>Usage Analytics</span>
                      </div>
                      <p className={cn('text-[13px] flex-1 mb-4', isDark ? 'text-white/60' : 'text-gray-600')}>
                        Monitor your API requests, track usage patterns, and optimize your integration with detailed analytics.
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <button onClick={() => setActiveSection('usage')} className="text-[13px] text-primary hover:underline flex items-center gap-1">Learn more →</button>
                        <button onClick={() => setActiveSection('usage')} className={cn('px-4 py-2 rounded-lg text-[13px] font-medium', isDark ? 'bg-white/10 hover:bg-white/15' : 'bg-gray-100 hover:bg-gray-200')}>Get Started</button>
                      </div>
                    </div>

                    {/* Billing Card */}
                    <div className={cn('p-6 rounded-xl border-[1.5px] flex flex-col', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white')}>
                      <div className="flex items-center gap-3 mb-3">
                        <CreditCard size={20} className="text-primary" />
                        <span className={cn('text-[16px] font-semibold', isDark ? 'text-white' : 'text-gray-900')}>Billing & Subscriptions</span>
                      </div>
                      <p className={cn('text-[13px] flex-1 mb-4', isDark ? 'text-white/60' : 'text-gray-600')}>
                        Upgrade your plan, purchase credit packages, and manage your billing preferences with XRP or card payments.
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <button onClick={() => setActiveSection('billing')} className="text-[13px] text-primary hover:underline flex items-center gap-1">Learn more →</button>
                        <button onClick={() => setActiveSection('billing')} className={cn('px-4 py-2 rounded-lg text-[13px] font-medium', isDark ? 'bg-white/10 hover:bg-white/15' : 'bg-gray-100 hover:bg-gray-200')}>Get Started</button>
                      </div>
                    </div>

                    {/* Credits Card */}
                    <div className={cn('p-6 rounded-xl border-[1.5px] flex flex-col', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white')}>
                      <div className="flex items-center gap-3 mb-3">
                        <Coins size={20} className="text-primary" />
                        <span className={cn('text-[16px] font-semibold', isDark ? 'text-white' : 'text-gray-900')}>Credit Packages</span>
                      </div>
                      <p className={cn('text-[13px] flex-1 mb-4', isDark ? 'text-white/60' : 'text-gray-600')}>
                        Purchase additional credits for your API usage. Choose from flexible packages that fit your needs.
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <button onClick={() => setActiveSection('billing')} className="text-[13px] text-primary hover:underline flex items-center gap-1">Learn more →</button>
                        <button onClick={() => setActiveSection('billing')} className={cn('px-4 py-2 rounded-lg text-[13px] font-medium', isDark ? 'bg-white/10 hover:bg-white/15' : 'bg-gray-100 hover:bg-gray-200')}>Get Started</button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* API Keys Section */}
            {activeSection === 'keys' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className={cn('text-xl md:text-2xl font-medium mb-1', isDark ? 'text-white' : 'text-gray-900')}>API Keys</h1>
                    <p className={cn('text-[13px] md:text-[14px]', isDark ? 'text-white/60' : 'text-gray-600')}>Manage your API keys for programmatic access</p>
                  </div>
                  <button onClick={() => setShowCreateForm(true)} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium bg-primary text-white hover:bg-primary/90 shrink-0">
                    <Plus size={16} />Create Key
                  </button>
                </div>

                <div className={cn('rounded-xl border-[1.5px] overflow-hidden', isDark ? 'border-white/10' : 'border-gray-200')}>
                  {loading ? (
                    <div className="p-12 text-center"><Loader2 size={24} className="mx-auto animate-spin opacity-40" /></div>
                  ) : apiKeys.length === 0 ? (
                    <div className="p-12 text-center">
                      <Key size={32} className="mx-auto mb-3 opacity-20" />
                      <p className={cn('text-[14px]', isDark ? 'text-white/40' : 'text-gray-500')}>No API keys yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/10">
                      {apiKeys.map((key) => (
                        <div key={key.id || key._id} className={cn('px-3 md:px-5 py-3 md:py-4 flex items-center gap-2 md:gap-4', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50')}>
                          <div className={cn('p-2 rounded-lg hidden sm:block', isDark ? 'bg-white/5' : 'bg-gray-100')}><Key size={18} className="opacity-60" /></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={cn('text-[13px] md:text-[14px] font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>{key.name}</span>
                              <span className={cn('text-[11px] px-2 py-0.5 rounded-full shrink-0', isDark ? 'bg-white/10 text-white/40' : 'bg-gray-100 text-gray-500')}>{key.tier || 'free'}</span>
                            </div>
                            <div className={cn('text-[11px] md:text-[12px] mt-0.5 font-mono', isDark ? 'text-white/40' : 'text-gray-500')}>{key.keyPrefix}••••••••</div>
                          </div>
                          <div className={cn('text-[12px] text-right hidden md:block', isDark ? 'text-white/40' : 'text-gray-500')}>
                            <div>Created {formatDate(key.createdAt)}</div>
                          </div>
                          <button onClick={() => copyToClipboard(key.keyPrefix, key.id)} className={cn('p-2 rounded-lg', isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100')}>
                            {copiedId === key.id ? <CheckCircle size={16} className="text-emerald-500" /> : <Copy size={16} className="opacity-40" />}
                          </button>
                          <button onClick={() => deleteApiKey(key.id)} disabled={deletingId === key.id} className={cn('p-2 rounded-lg text-red-500', isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50')}>
                            {deletingId === key.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Usage Section */}
            {activeSection === 'usage' && (
              <div className="space-y-6">
                <div>
                  <h1 className={cn('text-2xl font-medium mb-1', isDark ? 'text-white' : 'text-gray-900')}>Usage</h1>
                  <p className={cn('text-[14px]', isDark ? 'text-white/60' : 'text-gray-600')}>Monitor your API usage and limits</p>
                </div>

                {(() => {
                  const tierData = getUsageStats(usage);
                  if (!tierData) return null;
                  const isUnlimited = !tierData.today?.limit || tierData.today?.limit === -1 || tierData.tier === 'god';
                  const usedCount = tierData.today?.used || 0;
                  const tierInfo = tiers.find(t => t.id === (tierData.tier || 'free'));

                  return (
                    <div className={cn('p-5 rounded-xl border-[1.5px]', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white')}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={cn('text-[14px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>Today's Usage</h3>
                        <span className={cn('text-[12px] px-2 py-1 rounded-full', tierInfo?.color, isDark ? 'bg-white/5' : 'bg-gray-100')}>
                          {(tierData.tier || 'free').toUpperCase()}
                        </span>
                      </div>

                      {isUnlimited ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Infinity size={24} className="text-primary" />
                            <div>
                              <div className={cn('text-2xl font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                                {usedCount.toLocaleString()}
                              </div>
                              <div className={cn('text-[12px]', isDark ? 'text-white/40' : 'text-gray-500')}>requests today</div>
                            </div>
                          </div>
                          <div className={cn('text-[13px] px-3 py-1.5 rounded-lg', isDark ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary')}>
                            Unlimited
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className={cn('h-3 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-gray-200')}>
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min((usedCount / tierData.today?.limit) * 100, 100)}%` }} />
                            </div>
                          </div>
                          <span className={cn('text-[13px] font-mono', isDark ? 'text-white/60' : 'text-gray-600')}>
                            {usedCount.toLocaleString()} / {tierData.today?.limit?.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Endpoint Usage Breakdown */}
                {usage?.endpointUsage && Object.keys(usage.endpointUsage).length > 0 && (() => {
                  const entries = Object.entries(usage.endpointUsage).sort(([,a], [,b]) => b - a);
                  const maxCredits = entries[0]?.[1] || 1;
                  const totalCredits = entries.reduce((sum, [,c]) => sum + c, 0);
                  const getEndpointColor = (ep) => {
                    if (ep.includes('ohlc') || ep.includes('sparkline')) return 'bg-purple-500';
                    if (ep.includes('token')) return 'bg-blue-500';
                    if (ep.includes('history') || ep.includes('orderbook')) return 'bg-amber-500';
                    if (ep.includes('account') || ep.includes('trustline')) return 'bg-cyan-500';
                    if (ep.includes('nft')) return 'bg-pink-500';
                    return 'bg-primary';
                  };
                  const formatEndpoint = (ep) => ep.replace(/^\/api\/|^\/v1\//, '').replace(/\/[a-f0-9]{32}/gi, '/:id');
                  return (
                    <div className={cn('p-5 rounded-xl border-[1.5px]', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white')}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={cn('text-[14px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>Endpoint Usage</h3>
                        <span className={cn('text-[12px] font-mono px-2 py-0.5 rounded', isDark ? 'bg-white/5 text-white/60' : 'bg-gray-100 text-gray-600')}>
                          {totalCredits.toLocaleString()} credits
                        </span>
                      </div>
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {entries.slice(0, 12).map(([endpoint, credits]) => (
                          <div key={endpoint}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={cn('text-[11px] font-mono truncate flex-1 mr-2', isDark ? 'text-white/70' : 'text-gray-700')}>{formatEndpoint(endpoint)}</span>
                              <span className={cn('text-[11px] font-medium tabular-nums', isDark ? 'text-white/90' : 'text-gray-900')}>{credits.toLocaleString()}</span>
                            </div>
                            <div className={cn('h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/5' : 'bg-gray-100')}>
                              <div className={cn('h-full rounded-full transition-all', getEndpointColor(endpoint))} style={{ width: `${(credits / maxCredits) * 100}%`, opacity: 0.8 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      {entries.length > 12 && (
                        <div className={cn('text-[11px] mt-3 pt-2 border-t text-center', isDark ? 'text-white/40 border-white/10' : 'text-gray-400 border-gray-200')}>
                          +{entries.length - 12} more endpoints
                        </div>
                      )}
                    </div>
                  );
                })()}

                {credits?.billingCycle && (
                  <div className={cn('p-5 rounded-xl border-[1.5px]', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white')}>
                    <h3 className={cn('text-[14px] font-medium mb-4', isDark ? 'text-white' : 'text-gray-900')}>Billing Cycle</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className={cn('text-[11px] uppercase tracking-wide mb-1', isDark ? 'text-white/40' : 'text-gray-500')}>Days Remaining</div>
                        <div className={cn('text-xl font-medium', isDark ? 'text-white' : 'text-gray-900')}>{credits.billingCycle.daysRemaining}</div>
                      </div>
                      <div>
                        <div className={cn('text-[11px] uppercase tracking-wide mb-1', isDark ? 'text-white/40' : 'text-gray-500')}>Cycle Progress</div>
                        <div className={cn('text-xl font-medium', isDark ? 'text-white' : 'text-gray-900')}>{Math.round(credits.billingCycle.cycleProgress || 0)}%</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Billing Section */}
            {activeSection === 'billing' && (
              <div className="space-y-6">
                <div>
                  <h1 className={cn('text-2xl font-medium mb-1', isDark ? 'text-white' : 'text-gray-900')}>Billing</h1>
                  <p className={cn('text-[14px]', isDark ? 'text-white/60' : 'text-gray-600')}>Manage your subscription and buy credits</p>
                </div>

                {/* Credit Packages */}
                <div>
                  <div className="mb-6">
                    <h2 className={cn('text-lg font-medium flex items-center gap-2', isDark ? 'text-white' : 'text-gray-900')}>
                      <Zap size={18} className="text-primary" />Buy Credits
                    </h2>
                    <p className={cn('text-[13px] mt-1', isDark ? 'text-white/50' : 'text-gray-500')}>One-time credit purchases for extra usage</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {packages.map((pkg, idx) => {
                      const gradients = [
                        'from-emerald-400 to-green-500',
                        'from-blue-400 to-indigo-500',
                        'from-purple-400 to-violet-500',
                        'from-amber-400 to-orange-500'
                      ];
                      const isPopular = pkg.id === 'standard';
                      return (
                        <div key={pkg.id} className={cn(
                          'p-5 rounded-2xl border-[1.5px] relative overflow-hidden transition-all flex flex-col',
                          isPopular ? 'border-primary/50 ring-2 ring-primary/20' : isDark ? 'border-white/10 bg-white/[0.02] hover:border-white/20' : 'border-gray-200 bg-white hover:border-gray-300'
                        )}>
                          {isPopular && (
                            <span className="absolute top-3 right-3 px-2 py-1 rounded-md text-[10px] font-semibold bg-primary/20 text-primary">Popular</span>
                          )}
                          <div className={cn('text-[15px] font-semibold mb-1', isDark ? 'text-white' : 'text-gray-900')}>{pkg.name}</div>
                          <div className={cn('text-[12px] mb-4', isDark ? 'text-white/50' : 'text-gray-500')}>{pkg.credits} credits</div>
                          <div className="flex items-baseline gap-1 mb-6">
                            <span className={cn('text-3xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>${pkg.price}</span>
                            <span className={cn('text-[12px]', isDark ? 'text-white/40' : 'text-gray-400')}>one-time</span>
                          </div>
                          <div className="mt-auto">
                            <button
                              onClick={() => {
                                if (!walletAddress) {
                                  setOpenWalletModal(true);
                                  return;
                                }
                                setPaymentModal({
                                  isOpen: true,
                                  type: 'credits',
                                  item: { id: pkg.id, name: pkg.name, price: pkg.price, credits: pkg.credits }
                                });
                              }}
                              className={cn(
                                'w-full py-3 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90',
                                isPopular ? 'bg-primary shadow-lg shadow-primary/25' : `bg-gradient-to-r ${gradients[idx]} shadow-md`
                              )}
                            >
                              Buy Now
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Subscription Plans */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                      <h2 className={cn('text-base md:text-lg font-medium', isDark ? 'text-white' : 'text-gray-900')}>Simple pricing for teams of any scale</h2>
                      <p className={cn('text-[13px] mt-1', isDark ? 'text-white/50' : 'text-gray-500')}>Choose the plan that fits your needs</p>
                    </div>
                    <div className={cn('flex items-center gap-1 p-1 rounded-xl border-[1.5px] self-start', isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200')}>
                      <button onClick={() => setBillingPeriod('monthly')} className={cn('px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all', billingPeriod === 'monthly' ? 'bg-primary text-white shadow-sm' : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-gray-900')}>Monthly</button>
                      <button onClick={() => setBillingPeriod('yearly')} className={cn('px-4 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-all', billingPeriod === 'yearly' ? 'bg-primary text-white shadow-sm' : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-gray-900')}>
                        Yearly<span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold', billingPeriod === 'yearly' ? 'bg-white/20' : 'bg-emerald-500/20 text-emerald-500')}>2 months free</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {tiers.map((tier) => {
                      const price = billingPeriod === 'yearly' ? tier.yearly : tier.monthly;
                      const monthlyEquiv = billingPeriod === 'yearly' && tier.yearly ? Math.round(tier.yearly / 12) : null;
                      const isCurrentPlan = getUsageStats(usage)?.tier === tier.id;
                      return (
                        <div key={tier.id} className={cn(
                          'p-4 rounded-2xl border-[1.5px] relative overflow-hidden transition-all flex flex-col',
                          tier.recommended && !isCurrentPlan ? 'border-primary/50 ring-2 ring-primary/20' : '',
                          isCurrentPlan ? 'border-emerald-500/50 ring-2 ring-emerald-500/20' : '',
                          tier.enterprise ? (isDark ? 'border-rose-500/30 bg-gradient-to-b from-rose-500/5 to-transparent' : 'border-rose-200 bg-gradient-to-b from-rose-50 to-white') : '',
                          !tier.recommended && !isCurrentPlan && !tier.enterprise ? (isDark ? 'border-white/10 bg-white/[0.02] hover:border-white/20' : 'border-gray-200 bg-white hover:border-gray-300') : ''
                        )}>
                          {/* Top badges */}
                          <div className="flex items-center justify-between mb-2 min-h-[24px]">
                            {tier.recommended && !isCurrentPlan && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-primary/20 text-primary">Recommended</span>
                            )}
                            {isCurrentPlan && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-500">Current</span>
                            )}
                          </div>

                          {/* Plan name & description */}
                          <div className={cn('text-[14px] font-semibold', isDark ? 'text-white' : 'text-gray-900')}>{tier.name}</div>
                          <div className={cn('text-[11px] mb-3', isDark ? 'text-white/50' : 'text-gray-500')}>{tier.description}</div>

                          {/* Price */}
                          <div className="mb-3">
                            {tier.enterprise ? (
                              <div className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>Custom</div>
                            ) : (
                              <>
                                <div className="flex items-baseline gap-1">
                                  <span className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>${billingPeriod === 'yearly' && price > 0 ? monthlyEquiv : price}</span>
                                  {(price > 0 || billingPeriod === 'yearly') && <span className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-gray-400')}>/ mo</span>}
                                </div>
                                {billingPeriod === 'yearly' && price > 0 && (
                                  <div className={cn('text-[10px]', isDark ? 'text-white/40' : 'text-gray-400')}>
                                    ${price.toLocaleString()}/yr
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          {/* Features */}
                          <div className={cn('text-[11px] space-y-1.5 mb-4 flex-1', isDark ? 'text-white/70' : 'text-gray-600')}>
                            {tier.features.map((feature, i) => (
                              <div key={i} className="flex items-start gap-1.5">
                                <Check size={12} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>

                          {/* CTA */}
                          {isCurrentPlan ? (
                            <div className={cn('py-2.5 text-center text-[12px] font-medium rounded-xl', isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')}>
                              Active Plan
                            </div>
                          ) : tier.id === 'free' ? (
                            <div className={cn('py-2.5 text-center text-[12px] font-medium rounded-xl', isDark ? 'bg-white/5 text-white/40' : 'bg-gray-50 text-gray-400')}>
                              Start building
                            </div>
                          ) : tier.enterprise ? (
                            <a
                              href="mailto:enterprise@xrpl.to?subject=Enterprise%20Plan%20Inquiry"
                              className={cn(
                                'w-full py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 transition-all',
                                isDark ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' : 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                              )}
                            >
                              <Mail size={14} />
                              Talk to us
                            </a>
                          ) : (
                            <button
                              onClick={() => {
                                if (!walletAddress) {
                                  setOpenWalletModal(true);
                                  return;
                                }
                                setPaymentModal({
                                  isOpen: true,
                                  type: 'tier',
                                  item: {
                                    id: tier.id,
                                    name: tier.name,
                                    price: billingPeriod === 'yearly' ? tier.yearly : tier.monthly,
                                    credits: tier.credits,
                                    features: tier.features
                                  }
                                });
                              }}
                              className={cn(
                                'w-full py-2.5 rounded-xl text-[12px] font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90',
                                tier.recommended ? 'bg-primary shadow-lg shadow-primary/25' : `bg-gradient-to-r ${tier.gradient} shadow-md`
                              )}
                            >
                              Start building
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Premium Infrastructure */}
                <div className={cn('p-6 rounded-2xl border-[1.5px]', isDark ? 'border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent' : 'border-gray-200 bg-gradient-to-br from-gray-50 to-white')}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', isDark ? 'bg-amber-500/20' : 'bg-amber-100')}>
                      <Zap size={20} className="text-amber-500" />
                    </div>
                    <div>
                      <h3 className={cn('text-[15px] font-semibold', isDark ? 'text-white' : 'text-gray-900')}>Premium Infrastructure</h3>
                      <p className={cn('text-[12px]', isDark ? 'text-white/50' : 'text-gray-500')}>Dedicated XRPL nodes for maximum performance</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
                    <div className={cn('p-4 rounded-xl border-[1.5px]', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white')}>
                      <div className={cn('text-[13px] font-semibold mb-1', isDark ? 'text-white' : 'text-gray-900')}>TurboSubmit</div>
                      <div className={cn('text-[11px] mb-3', isDark ? 'text-white/50' : 'text-gray-500')}>Fast transaction submission API</div>
                      <div className={cn('text-[11px] space-y-1', isDark ? 'text-white/60' : 'text-gray-600')}>
                        <div className="flex items-center gap-1.5"><Check size={11} className="text-emerald-500" />Direct ledger submission</div>
                        <div className="flex items-center gap-1.5"><Check size={11} className="text-emerald-500" />Auto fee estimation</div>
                        <div className="flex items-center gap-1.5"><Check size={11} className="text-emerald-500" />Included with all plans</div>
                      </div>
                    </div>
                    <div className={cn('p-4 rounded-xl border-[1.5px]', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white')}>
                      <div className={cn('text-[13px] font-semibold mb-1', isDark ? 'text-white' : 'text-gray-900')}>Dedicated Node</div>
                      <div className={cn('text-[11px] mb-3', isDark ? 'text-white/50' : 'text-gray-500')}>Private XRPL node access</div>
                      <div className="flex items-baseline gap-1 mb-3">
                        <span className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>$1,500</span>
                        <span className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-gray-400')}>/ month</span>
                      </div>
                      <a href="mailto:enterprise@xrpl.to?subject=Dedicated%20Node%20Inquiry" className="block w-full py-2 rounded-lg text-[11px] font-medium text-center bg-primary/10 text-primary hover:bg-primary/20 transition-all">
                        Contact sales
                      </a>
                    </div>
                    <div className={cn('p-4 rounded-xl border-[1.5px]', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white')}>
                      <div className={cn('text-[13px] font-semibold mb-1', isDark ? 'text-white' : 'text-gray-900')}>Full History Node</div>
                      <div className={cn('text-[11px] mb-3', isDark ? 'text-white/50' : 'text-gray-500')}>Complete ledger history access</div>
                      <div className="flex items-baseline gap-1 mb-3">
                        <span className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>$2,900</span>
                        <span className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-gray-400')}>/ month</span>
                      </div>
                      <a href="mailto:enterprise@xrpl.to?subject=Full%20History%20Node%20Inquiry" className="block w-full py-2 rounded-lg text-[11px] font-medium text-center bg-primary/10 text-primary hover:bg-primary/20 transition-all">
                        Contact sales
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Admin: All Users */}
            {activeSection === 'admin-users' && isAdmin && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className={cn('text-xl md:text-2xl font-medium mb-1 flex items-center gap-2', isDark ? 'text-white' : 'text-gray-900')}>
                      <Shield size={24} className="text-primary" />All Users
                    </h1>
                    <p className={cn('text-[13px] md:text-[14px]', isDark ? 'text-white/60' : 'text-gray-600')}>Manage all API keys across users</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowAdminCreateKey(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium bg-primary text-white hover:bg-primary/90">
                      <Key size={14} />Create Key
                    </button>
                    <button onClick={() => setShowAdminPlatformKey(true)} className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium border-[1.5px]', isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50')}>
                      <Settings size={14} />Platform Key
                    </button>
                  </div>
                </div>

                <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border-[1.5px]', isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white')}>
                  <Search size={16} className="opacity-40" />
                  <input type="text" placeholder="Search by wallet address..." value={adminSearchQuery} onChange={(e) => setAdminSearchQuery(e.target.value)} className="flex-1 bg-transparent text-[13px] outline-none placeholder:opacity-40" />
                </div>

                <div className={cn('rounded-xl border-[1.5px] overflow-hidden', isDark ? 'border-white/10' : 'border-gray-200')}>
                  {adminLoading ? (
                    <div className="p-12 text-center"><Loader2 size={24} className="mx-auto animate-spin opacity-40" /></div>
                  ) : (
                    <div className="divide-y divide-white/10">
                      <div className={cn('px-5 py-3 text-[12px]', isDark ? 'bg-white/[0.02] text-white/40' : 'bg-gray-50 text-gray-500')}>
                        Total: {adminUsage?.summary?.totalUsers || getDataArray(adminUsage, 'users', 'keys', 'data').length} users
                      </div>
                      {getDataArray(adminUsage, 'users', 'keys', 'data').filter(k => !adminSearchQuery || k.wallet?.toLowerCase().includes(adminSearchQuery.toLowerCase())).map((key, idx) => (
                        <div key={key.id || key._id || idx} className={cn('px-3 md:px-5 py-3 md:py-4 flex items-center justify-between gap-2', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50')}>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={cn('text-[13px] font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>{key.name || 'Unnamed'}</span>
                              <span className={cn('text-[11px] px-2 py-0.5 rounded-full shrink-0', isDark ? 'bg-white/10' : 'bg-gray-200')}>{key.tier || 'free'}</span>
                            </div>
                            <div className={cn('text-[11px] font-mono mt-0.5 truncate', isDark ? 'text-white/40' : 'text-gray-500')}>{key.wallet}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={cn('text-[13px]', isDark ? 'text-white' : 'text-gray-900')}>{key.usage?.today?.toLocaleString() || 0} today</div>
                            <div className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-gray-500')}>{key.usage?.total?.toLocaleString() || 0} total</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Admin: All Credits */}
            {activeSection === 'admin-credits' && isAdmin && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className={cn('text-2xl font-medium mb-1 flex items-center gap-2', isDark ? 'text-white' : 'text-gray-900')}>
                      <Coins size={24} className="text-primary" />All Credits
                    </h1>
                    <p className={cn('text-[14px]', isDark ? 'text-white/60' : 'text-gray-600')}>View and manage credit balances</p>
                  </div>
                  <button onClick={() => setShowAdminAddCredits(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium bg-emerald-500 text-white hover:bg-emerald-600">
                    <Coins size={14} />Add Credits
                  </button>
                </div>

                <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border-[1.5px]', isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white')}>
                  <Search size={16} className="opacity-40" />
                  <input type="text" placeholder="Search by wallet address..." value={adminSearchQuery} onChange={(e) => setAdminSearchQuery(e.target.value)} className="flex-1 bg-transparent text-[13px] outline-none placeholder:opacity-40" />
                </div>

                <div className={cn('rounded-xl border-[1.5px] overflow-hidden', isDark ? 'border-white/10' : 'border-gray-200')}>
                  {adminLoading ? (
                    <div className="p-12 text-center"><Loader2 size={24} className="mx-auto animate-spin opacity-40" /></div>
                  ) : (
                    <div className="divide-y divide-white/10">
                      <div className={cn('px-5 py-3 text-[12px]', isDark ? 'bg-white/[0.02] text-white/40' : 'bg-gray-50 text-gray-500')}>
                        Total: {adminCredits?.summary?.totalAccounts || getDataArray(adminCredits, 'accounts', 'wallets', 'data').length} accounts
                      </div>
                      {getDataArray(adminCredits, 'accounts', 'wallets', 'data').filter(w => !adminSearchQuery || w.wallet?.toLowerCase().includes(adminSearchQuery.toLowerCase())).map((wallet, idx) => (
                        <div key={wallet.wallet || idx} className={cn('px-3 md:px-5 py-3 md:py-4 flex items-center justify-between gap-2', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50')}>
                          <div className="font-mono text-[11px] md:text-[12px] truncate min-w-0">{wallet.wallet}</div>
                          <div className="flex items-center gap-3">
                            <div className={cn('text-[14px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                              {wallet.balance === -1 ? <span className="flex items-center gap-1 text-primary"><Infinity size={16} />Unlimited</span> : formatCredits(wallet.balance)}
                            </div>
                            {wallet.tier && <span className={cn('text-[11px] px-2 py-0.5 rounded-full', isDark ? 'bg-white/10' : 'bg-gray-200')}>{wallet.tier}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Admin: Revenue */}
            {activeSection === 'admin-revenue' && isAdmin && (
              <div className="space-y-6">
                <div>
                  <h1 className={cn('text-2xl font-medium mb-1 flex items-center gap-2', isDark ? 'text-white' : 'text-gray-900')}>
                    <DollarSign size={24} className="text-primary" />Revenue
                  </h1>
                  <p className={cn('text-[14px]', isDark ? 'text-white/60' : 'text-gray-600')}>Payment analytics and revenue tracking</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={cn('p-5 rounded-xl border-[1.5px]', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white')}>
                    <div className={cn('text-[11px] uppercase tracking-wide mb-1', isDark ? 'text-white/40' : 'text-gray-500')}>Total Payments</div>
                    <div className={cn('text-2xl font-medium', isDark ? 'text-white' : 'text-gray-900')}>{adminRevenue?.totalPayments || 0}</div>
                  </div>
                  <div className={cn('p-5 rounded-xl border-[1.5px]', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white')}>
                    <div className={cn('text-[11px] uppercase tracking-wide mb-1', isDark ? 'text-white/40' : 'text-gray-500')}>Total XRP</div>
                    <div className={cn('text-2xl font-medium', isDark ? 'text-white' : 'text-gray-900')}>{(adminRevenue?.totalXRP || 0).toLocaleString()} XRP</div>
                  </div>
                  <div className={cn('p-5 rounded-xl border-[1.5px]', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white')}>
                    <div className={cn('text-[11px] uppercase tracking-wide mb-1', isDark ? 'text-white/40' : 'text-gray-500')}>Total USD</div>
                    <div className={cn('text-2xl font-medium', isDark ? 'text-white' : 'text-gray-900')}>${(adminRevenue?.totalUSD || 0).toLocaleString()}</div>
                  </div>
                </div>

                {adminRevenue?.recentPayments?.length > 0 && (
                  <div className={cn('rounded-xl border-[1.5px] overflow-hidden', isDark ? 'border-white/10' : 'border-gray-200')}>
                    <div className={cn('px-5 py-3 text-[12px]', isDark ? 'bg-white/[0.02] text-white/40' : 'bg-gray-50 text-gray-500')}>Recent Payments</div>
                    <div className="divide-y divide-white/10">
                      {adminRevenue.recentPayments.map((p, idx) => (
                        <div key={p.txHash || idx} className={cn('px-5 py-4 flex items-center justify-between', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50')}>
                          <div className="font-mono text-[11px]">{p.wallet?.slice(0, 12)}...</div>
                          <div className={cn('text-[13px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>{p.amount} {p.currency || 'XRP'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Admin: Chat Keys */}
            {activeSection === 'admin-chat' && isAdmin && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className={cn('text-2xl font-medium mb-1 flex items-center gap-2', isDark ? 'text-white' : 'text-gray-900')}>
                      <MessageSquare size={24} className="text-primary" />Chat Keys
                    </h1>
                    <p className={cn('text-[14px]', isDark ? 'text-white/60' : 'text-gray-600')}>Manage chat access permissions</p>
                  </div>
                  <button onClick={() => setShowAdminChatAccess(true)} className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium border-[1.5px]', isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50')}>
                    <MessageSquare size={14} />Manage Access
                  </button>
                </div>

                <div className={cn('rounded-xl border-[1.5px] overflow-hidden', isDark ? 'border-white/10' : 'border-gray-200')}>
                  {adminLoading ? (
                    <div className="p-12 text-center"><Loader2 size={24} className="mx-auto animate-spin opacity-40" /></div>
                  ) : (
                    <div className="divide-y divide-white/10">
                      <div className={cn('px-5 py-3 text-[12px]', isDark ? 'bg-white/[0.02] text-white/40' : 'bg-gray-50 text-gray-500')}>
                        Total: {adminChatKeys?.count || getDataArray(adminChatKeys, 'keys', 'data').length} chat-enabled keys
                      </div>
                      {getDataArray(adminChatKeys, 'keys', 'data').map((key, idx) => (
                        <div key={key.id || key._id || idx} className={cn('px-5 py-4 flex items-center justify-between', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50')}>
                          <div>
                            <div className="flex items-center gap-2">
                              <MessageSquare size={14} className="text-primary" />
                              <span className={cn('text-[13px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>{key.platform || 'Default'}</span>
                            </div>
                            <div className={cn('text-[11px] font-mono mt-0.5', isDark ? 'text-white/40' : 'text-gray-500')}>{key.wallet}</div>
                          </div>
                          <div className={cn('text-[11px]', key.chatAccess ? 'text-emerald-500' : 'text-red-500')}>{key.chatAccess ? 'Active' : 'Revoked'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateForm && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50">
          <div className={cn('w-full max-w-md sm:mx-4 p-5 pb-20 sm:pb-5 md:p-6 rounded-t-2xl sm:rounded-xl border-[1.5px]', isDark ? 'bg-black border-white/10' : 'bg-white border-gray-200')}>
            <h3 className={cn('text-lg font-medium mb-4', isDark ? 'text-white' : 'text-gray-900')}>Create API Key</h3>
            <input type="text" placeholder="Key name (e.g., Production Bot)" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} className={cn('w-full px-4 py-3 rounded-lg border-[1.5px] text-[14px] mb-4', isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200')} autoFocus />
            <div className="flex gap-3">
              <button onClick={() => { setShowCreateForm(false); setNewKeyName(''); }} className={cn('flex-1 py-2.5 rounded-lg text-[13px] font-medium border-[1.5px]', isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50')}>Cancel</button>
              <button onClick={createApiKey} disabled={!newKeyName.trim() || creating} className="flex-1 py-2.5 rounded-lg text-[13px] font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50">
                {creating ? <Loader2 size={16} className="mx-auto animate-spin" /> : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdminCreateKey && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50">
          <div className={cn('w-full max-w-md sm:mx-4 p-5 pb-20 sm:pb-5 md:p-6 rounded-t-2xl sm:rounded-xl border-[1.5px]', isDark ? 'bg-black border-white/10' : 'bg-white border-gray-200')}>
            <h3 className={cn('text-lg font-medium mb-4', isDark ? 'text-white' : 'text-gray-900')}>Create Partner API Key</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Wallet address (rXXX...)" value={adminFormData.wallet || ''} onChange={(e) => setAdminFormData({ ...adminFormData, wallet: e.target.value })} className={cn('w-full px-4 py-3 rounded-lg border-[1.5px] text-[14px] font-mono', isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200')} />
              <input type="text" placeholder="Key name" value={adminFormData.name || ''} onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })} className={cn('w-full px-4 py-3 rounded-lg border-[1.5px] text-[14px]', isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200')} />
              <select value={adminFormData.tier || 'free'} onChange={(e) => setAdminFormData({ ...adminFormData, tier: e.target.value })} className={cn('w-full px-4 py-3 rounded-lg border-[1.5px] text-[14px]', isDark ? 'bg-[#0a0a0a] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900')}>
                <option value="free" className={isDark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'}>Free</option>
                <option value="developer" className={isDark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'}>Developer</option>
                <option value="partner" className={isDark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'}>Partner</option>
                <option value="business" className={isDark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'}>Business</option>
                <option value="professional" className={isDark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'}>Professional</option>
                <option value="god" className={isDark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'}>God</option>
              </select>
              <input type="number" placeholder="Credits (optional, e.g., 10000000)" value={adminFormData.credits || ''} onChange={(e) => setAdminFormData({ ...adminFormData, credits: e.target.value })} className={cn('w-full px-4 py-3 rounded-lg border-[1.5px] text-[14px]', isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200')} />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowAdminCreateKey(false); setAdminFormData({}); }} className={cn('flex-1 py-2.5 rounded-lg text-[13px] font-medium border-[1.5px]', isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50')}>Cancel</button>
              <button onClick={adminCreateKey} disabled={adminLoading} className="flex-1 py-2.5 rounded-lg text-[13px] font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50">
                {adminLoading ? <Loader2 size={16} className="mx-auto animate-spin" /> : 'Create Key'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdminAddCredits && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50">
          <div className={cn('w-full max-w-md sm:mx-4 p-5 pb-20 sm:pb-5 md:p-6 rounded-t-2xl sm:rounded-xl border-[1.5px]', isDark ? 'bg-black border-white/10' : 'bg-white border-gray-200')}>
            <h3 className={cn('text-lg font-medium mb-4', isDark ? 'text-white' : 'text-gray-900')}>Add Credits to Wallet</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Wallet address (rXXX...)" value={adminFormData.wallet || ''} onChange={(e) => setAdminFormData({ ...adminFormData, wallet: e.target.value })} className={cn('w-full px-4 py-3 rounded-lg border-[1.5px] text-[14px] font-mono', isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200')} />
              <input type="number" placeholder="Credits amount (-1 for unlimited)" value={adminFormData.credits || ''} onChange={(e) => setAdminFormData({ ...adminFormData, credits: e.target.value })} className={cn('w-full px-4 py-3 rounded-lg border-[1.5px] text-[14px]', isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200')} />
              <input type="text" placeholder="Reason (optional, e.g., promo)" value={adminFormData.reason || ''} onChange={(e) => setAdminFormData({ ...adminFormData, reason: e.target.value })} className={cn('w-full px-4 py-3 rounded-lg border-[1.5px] text-[14px]', isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200')} />
              <p className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-gray-500')}>Use -1 for unlimited credits</p>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowAdminAddCredits(false); setAdminFormData({}); }} className={cn('flex-1 py-2.5 rounded-lg text-[13px] font-medium border-[1.5px]', isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50')}>Cancel</button>
              <button onClick={adminAddCredits} disabled={adminLoading} className="flex-1 py-2.5 rounded-lg text-[13px] font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50">
                {adminLoading ? <Loader2 size={16} className="mx-auto animate-spin" /> : 'Add Credits'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdminChatAccess && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50">
          <div className={cn('w-full max-w-md sm:mx-4 p-5 pb-20 sm:pb-5 md:p-6 rounded-t-2xl sm:rounded-xl border-[1.5px]', isDark ? 'bg-black border-white/10' : 'bg-white border-gray-200')}>
            <h3 className={cn('text-lg font-medium mb-4', isDark ? 'text-white' : 'text-gray-900')}>Manage Chat Access</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Wallet address (rXXX...)" value={adminFormData.wallet || ''} onChange={(e) => setAdminFormData({ ...adminFormData, wallet: e.target.value })} className={cn('w-full px-4 py-3 rounded-lg border-[1.5px] text-[14px] font-mono', isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200')} />
              <input type="text" placeholder="Platform (optional)" value={adminFormData.platform || ''} onChange={(e) => setAdminFormData({ ...adminFormData, platform: e.target.value })} className={cn('w-full px-4 py-3 rounded-lg border-[1.5px] text-[14px]', isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200')} />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="chatAccess" checked={adminFormData.chatAccess !== false} onChange={() => setAdminFormData({ ...adminFormData, chatAccess: true })} className="accent-primary" /><span className={cn('text-[13px]', isDark ? 'text-white' : 'text-gray-900')}>Grant Access</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="chatAccess" checked={adminFormData.chatAccess === false} onChange={() => setAdminFormData({ ...adminFormData, chatAccess: false })} className="accent-red-500" /><span className={cn('text-[13px]', isDark ? 'text-white' : 'text-gray-900')}>Revoke Access</span></label>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowAdminChatAccess(false); setAdminFormData({}); }} className={cn('flex-1 py-2.5 rounded-lg text-[13px] font-medium border-[1.5px]', isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50')}>Cancel</button>
              <button onClick={adminSetChatAccess} disabled={adminLoading} className="flex-1 py-2.5 rounded-lg text-[13px] font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50">
                {adminLoading ? <Loader2 size={16} className="mx-auto animate-spin" /> : 'Update Access'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdminPlatformKey && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50">
          <div className={cn('w-full max-w-md sm:mx-4 p-5 pb-20 sm:pb-5 md:p-6 rounded-t-2xl sm:rounded-xl border-[1.5px]', isDark ? 'bg-black border-white/10' : 'bg-white border-gray-200')}>
            <h3 className={cn('text-lg font-medium mb-4', isDark ? 'text-white' : 'text-gray-900')}>Create Platform API Key</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Wallet address (rXXX...)" value={adminFormData.wallet || ''} onChange={(e) => setAdminFormData({ ...adminFormData, wallet: e.target.value })} className={cn('w-full px-4 py-3 rounded-lg border-[1.5px] text-[14px] font-mono', isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200')} />
              <input type="text" placeholder="Platform identifier (e.g., partner_app)" value={adminFormData.platform || ''} onChange={(e) => setAdminFormData({ ...adminFormData, platform: e.target.value })} className={cn('w-full px-4 py-3 rounded-lg border-[1.5px] text-[14px]', isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200')} />
              <input type="text" placeholder="Key name (optional)" value={adminFormData.name || ''} onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })} className={cn('w-full px-4 py-3 rounded-lg border-[1.5px] text-[14px]', isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200')} />
              <select value={adminFormData.tier || 'partner'} onChange={(e) => setAdminFormData({ ...adminFormData, tier: e.target.value })} className={cn('w-full px-4 py-3 rounded-lg border-[1.5px] text-[14px]', isDark ? 'bg-[#0a0a0a] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900')}>
                <option value="developer" className={isDark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'}>Developer</option>
                <option value="partner" className={isDark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'}>Partner</option>
                <option value="business" className={isDark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'}>Business</option>
                <option value="professional" className={isDark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'}>Professional</option>
              </select>
              <input type="number" placeholder="Credits (e.g., 50000000)" value={adminFormData.credits || ''} onChange={(e) => setAdminFormData({ ...adminFormData, credits: e.target.value })} className={cn('w-full px-4 py-3 rounded-lg border-[1.5px] text-[14px]', isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200')} />
              <p className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-gray-500')}>Platform keys have chat access enabled automatically</p>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowAdminPlatformKey(false); setAdminFormData({}); }} className={cn('flex-1 py-2.5 rounded-lg text-[13px] font-medium border-[1.5px]', isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50')}>Cancel</button>
              <button onClick={adminCreatePlatformKey} disabled={adminLoading} className="flex-1 py-2.5 rounded-lg text-[13px] font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50">
                {adminLoading ? <Loader2 size={16} className="mx-auto animate-spin" /> : 'Create Platform Key'}
              </button>
            </div>
          </div>
        </div>
      )}

      {xrpPayment && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50">
          <div className={cn('w-full max-w-md sm:mx-4 p-5 pb-20 sm:pb-5 md:p-6 rounded-t-2xl sm:rounded-xl border-[1.5px]', isDark ? 'bg-black border-white/10' : 'bg-white border-gray-200')}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={cn('text-lg font-medium', isDark ? 'text-white' : 'text-gray-900')}>Pay with XRP - {xrpPayment.name}</h3>
              <button onClick={() => { setXrpPayment(null); setTxHash(''); }} className="opacity-40 hover:opacity-100"><X size={20} /></button>
            </div>
            <div className={cn('p-4 rounded-lg mb-4 space-y-3', isDark ? 'bg-white/5' : 'bg-gray-50')}>
              <div>
                <div className={cn('text-[11px] uppercase tracking-wide mb-1', isDark ? 'text-white/40' : 'text-gray-500')}>Send exactly</div>
                <div className={cn('text-2xl font-medium', isDark ? 'text-white' : 'text-gray-900')}>{xrpPayment.amount} XRP</div>
              </div>
              <div>
                <div className={cn('text-[11px] uppercase tracking-wide mb-1', isDark ? 'text-white/40' : 'text-gray-500')}>To address</div>
                <div className="flex items-center gap-2">
                  <code className={cn('text-[13px] font-mono break-all', isDark ? 'text-white/80' : 'text-gray-700')}>{xrpPayment.destination}</code>
                  <button onClick={() => copyToClipboard(xrpPayment.destination, 'dest')} className="p-1 rounded hover:bg-white/10">
                    {copiedId === 'dest' ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} className="opacity-60" />}
                  </button>
                </div>
              </div>
              <div>
                <div className={cn('text-[11px] uppercase tracking-wide mb-1', isDark ? 'text-white/40' : 'text-gray-500')}>Destination Tag (required)</div>
                <div className="flex items-center gap-2">
                  <code className="text-[18px] font-mono font-medium text-primary">{xrpPayment.destinationTag}</code>
                  <button onClick={() => copyToClipboard(String(xrpPayment.destinationTag), 'tag')} className="p-1 rounded hover:bg-white/10">
                    {copiedId === 'tag' ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} className="opacity-60" />}
                  </button>
                </div>
              </div>
            </div>
            <button onClick={submitXrpPayment} disabled={paymentStatus} className="w-full py-3 rounded-lg text-[14px] font-medium flex items-center justify-center gap-2 mb-4 bg-primary text-white hover:bg-primary/90 disabled:opacity-70">
              {paymentStatus === 'signing' ? <><Loader2 size={16} className="animate-spin" /> Signing...</> : paymentStatus === 'submitting' ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : paymentStatus === 'verifying' ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : <>Pay {xrpPayment.amount} XRP Now</>}
            </button>
            <div className={cn('text-center text-[12px] mb-3', isDark ? 'text-white/40' : 'text-gray-500')}>— or pay manually —</div>
            <div className="space-y-3">
              <input type="text" placeholder="Paste transaction hash after sending" value={txHash} onChange={(e) => setTxHash(e.target.value)} className={cn('w-full px-4 py-3 rounded-lg border-[1.5px] text-[13px] font-mono', isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200')} />
              <button onClick={verifyXrpPayment} disabled={!txHash.trim() || verifyingTx} className={cn('w-full py-2.5 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2 border-[1.5px]', isDark ? 'border-white/10 hover:bg-white/5 disabled:opacity-50' : 'border-gray-200 hover:bg-gray-50 disabled:opacity-50')}>
                {verifyingTx ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle size={16} />Verify Payment</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false, type: null, item: null })}
        purchaseType={paymentModal.type}
        item={paymentModal.item}
        billingPeriod={billingPeriod}
        walletAddress={walletAddress}
        onSuccess={(data) => {
          setStripeSuccess({
            credits: data.creditsAdded,
            tier: data.tier,
            message: data.creditsAdded ? `${data.creditsAdded.toLocaleString()} credits added` : `Upgraded to ${data.tier}`
          });
          fetchUsage();
        }}
      />

      <Footer />
    </div>
  );
};

export default DashboardPage;

export async function getStaticProps() {
  return {
    props: {
      ogp: {
        canonical: 'https://xrpl.to/dashboard',
        title: 'Dashboard | XRPL.to Portfolio Overview',
        url: 'https://xrpl.to/dashboard',
        imgUrl: 'https://xrpl.to/api/og/dashboard',
        imgType: 'image/png',
        desc: 'Track your XRPL portfolio with real-time token balances, NFTs, and trading activity.'
      }
    },
    revalidate: 3600
  };
}
