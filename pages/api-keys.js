import React, { useState, useContext, useEffect, useCallback } from 'react';
import Head from 'next/head';
import axios from 'axios';
import { Wallet } from 'xrpl';
import { sign } from 'ripple-keypairs';
import { Key, Plus, Copy, Trash2, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, RefreshCw, CreditCard, Lock } from 'lucide-react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { UnifiedWalletStorage } from 'src/utils/encryptedWalletStorage';

const BASE_URL = 'https://api.xrpl.to/api';
const walletStorage = new UnifiedWalletStorage();

const ApiKeysPage = () => {
  const { themeName, accountProfile, seedPassword } = useContext(AppContext);
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

  const tiers = [
    { id: 'free', name: 'Free', price: 0, xrp: 0, rpm: 10, rpd: '2K', color: 'text-gray-500' },
    { id: 'basic', name: 'Basic', price: 29, xrp: 'dynamic', rpm: 100, rpd: '30K', color: 'text-blue-500' },
    { id: 'pro', name: 'Pro', price: 99, xrp: 'dynamic', rpm: 400, rpd: '120K', color: 'text-purple-500' },
    { id: 'enterprise', name: 'Enterprise', price: 249, xrp: 'dynamic', rpm: 1000, rpd: '300K', color: 'text-amber-500' }
  ];

  const walletAddress = accountProfile?.account;

  // Create auth headers with signature for protected endpoints
  const getAuthHeaders = useCallback(async () => {
    if (!walletAddress || !seedPassword) return null;

    try {
      const deviceWallet = await walletStorage.getWallet(walletAddress, seedPassword);
      if (!deviceWallet) return null;

      const timestamp = Date.now();
      // Message format per docs: `${wallet}:${timestamp}`
      const message = `${walletAddress}:${timestamp}`;
      const messageHex = Buffer.from(message).toString('hex');
      const signature = sign(messageHex, deviceWallet.privateKey);

      return {
        'X-Wallet': walletAddress,
        'X-Timestamp': timestamp.toString(),
        'X-Signature': signature,
        'X-Public-Key': deviceWallet.publicKey
      };
    } catch (err) {
      console.error('Failed to sign:', err);
      return null;
    }
  }, [walletAddress, seedPassword]);

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

  useEffect(() => {
    if (accountProfile?.account) {
      fetchApiKeys();
    } else {
      setLoading(false);
    }
  }, [accountProfile, fetchApiKeys]);

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
        setError('Unable to sign request. Please unlock your wallet.');
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
        setError('Unable to sign request. Please unlock your wallet.');
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
          <title>API Keys - XRPL.to</title>
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
        <title>API Keys - XRPL.to</title>
        <meta name="description" content="Manage your XRPL.to API keys" />
      </Head>

      <Header />

      <div className={cn("min-h-screen py-8", isDark ? "bg-black" : "bg-gray-50")}>
        <div className="max-w-4xl mx-auto px-4">
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
                  <div key={key._id} className={cn("px-5 py-4 flex items-center gap-4", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
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
                      onClick={() => copyToClipboard(key.keyPrefix, key._id)}
                      className={cn("p-2 rounded-lg", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}
                      title="Copy prefix"
                    >
                      {copiedId === key._id ? <CheckCircle size={16} className="text-emerald-500" /> : <Copy size={16} className="opacity-40" />}
                    </button>
                    <button
                      onClick={() => deleteApiKey(key._id)}
                      disabled={deletingId === key._id}
                      className={cn("p-2 rounded-lg text-red-500", isDark ? "hover:bg-red-500/10" : "hover:bg-red-50")}
                      title="Delete key"
                    >
                      {deletingId === key._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing Section */}
          <div className="mt-8">
            <h2 className={cn("text-lg font-medium mb-4", isDark ? "text-white" : "text-gray-900")}>Upgrade Your Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className={cn(
                    "p-5 rounded-xl border-[1.5px] transition-colors",
                    usage?.usage?.[0]?.tier === tier.id
                      ? "border-primary bg-primary/5"
                      : isDark ? "border-white/10 bg-white/[0.02] hover:border-white/20" : "border-gray-200 bg-white hover:border-gray-300"
                  )}
                >
                  <div className={cn("text-[13px] font-medium mb-1", tier.color)}>{tier.name}</div>
                  <div className={cn("text-2xl font-normal mb-3", isDark ? "text-white" : "text-gray-900")}>
                    {tier.price === 0 ? 'Free' : `${tier.xrp} XRP`}
                    {tier.price > 0 && <span className={cn("text-[12px] ml-1", isDark ? "text-white/40" : "text-gray-500")}>/mo</span>}
                  </div>
                  <div className={cn("text-[12px] space-y-1", isDark ? "text-white/60" : "text-gray-600")}>
                    <div>{tier.rpm} req/min</div>
                    <div>{tier.rpd} req/day</div>
                  </div>
                  {usage?.usage?.[0]?.tier === tier.id ? (
                    <div className="mt-4 py-2 text-center text-[12px] text-primary font-medium">Current Plan</div>
                  ) : tier.id !== 'free' && (
                    <button className={cn(
                      "w-full mt-4 py-2 rounded-lg text-[12px] font-medium border-[1.5px] transition-colors",
                      isDark ? "border-white/10 hover:bg-white/5" : "border-gray-200 hover:bg-gray-50"
                    )}>
                      Upgrade
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ApiKeysPage;
