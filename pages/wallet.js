import { useState, useContext, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Client, xrpToDrops, dropsToXrp, isValidAddress } from 'xrpl';
import {
  Send,
  QrCode,
  Copy,
  Check,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  ExternalLink,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { cn } from 'src/utils/cn';
import { AppContext } from 'src/AppContext';
import { EncryptedWalletStorage, securityUtils } from 'src/utils/encryptedWalletStorage';

const WalletPage = () => {
  const router = useRouter();
  const { tab: urlTab } = router.query;
  const {
    themeName,
    accountProfile,
    accountBalance,
    openSnackbar
  } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const walletStorage = useMemo(() => new EncryptedWalletStorage(), []);

  // Tab state
  const [activeTab, setActiveTab] = useState('send');

  // Send state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [destinationTag, setDestinationTag] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [txResult, setTxResult] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [checkingUnlock, setCheckingUnlock] = useState(true);
  const [storedPassword, setStoredPassword] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Receive state
  const [copied, setCopied] = useState(false);

  // History state
  const [transactions, setTransactions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);


  // Update tab from URL
  useEffect(() => {
    if (urlTab && ['send', 'receive', 'history'].includes(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  // Redirect if not logged in
  useEffect(() => {
    if (!accountProfile) {
      router.push('/');
    }
  }, [accountProfile, router]);

  // Check if wallet is unlocked (stored password exists)
  useEffect(() => {
    const checkUnlockStatus = async () => {
      if (!accountProfile?.provider || !accountProfile?.provider_id) {
        setCheckingUnlock(false);
        return;
      }
      try {
        const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
        const pwd = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);
        if (pwd) {
          const walletData = await walletStorage.getWalletByAddress(accountProfile.account, pwd);
          if (walletData?.seed) {
            setStoredPassword(pwd);
            setIsUnlocked(true);
          }
        }
      } catch (err) {
        console.error('Error checking unlock status:', err);
      } finally {
        setCheckingUnlock(false);
      }
    };
    checkUnlockStatus();
  }, [accountProfile, walletStorage]);

  // Load transaction history
  useEffect(() => {
    if (activeTab === 'history' && accountProfile?.account) {
      loadTransactionHistory();
    }
  }, [activeTab, accountProfile?.account]);

  const loadTransactionHistory = async () => {
    if (!accountProfile?.account) return;
    setLoadingHistory(true);
    try {
      const response = await fetch(
        `https://api.xrpl.to/api/account/${accountProfile.account}/transactions?limit=20`
      );
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(accountProfile?.account || '');
    setCopied(true);
    openSnackbar('Address copied', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const availableBalance = parseFloat(accountBalance?.curr1?.value || '0');
  const maxSendable = Math.max(0, availableBalance - 10.000012);

  const validateSend = () => {
    if (!recipient) return 'Enter recipient address';
    if (!isValidAddress(recipient)) return 'Invalid XRPL address';
    if (recipient === accountProfile?.account) return 'Cannot send to yourself';
    if (!amount || parseFloat(amount) <= 0) return 'Enter amount';
    if (parseFloat(amount) > maxSendable) return 'Insufficient balance';
    if (!isUnlocked && !password) return 'Enter password';
    return null;
  };

  const handleSend = async () => {
    const error = validateSend();
    if (error) {
      setSendError(error);
      return;
    }

    const rateLimitKey = `send_${accountProfile?.account}`;
    const rateCheck = securityUtils.rateLimiter.check(rateLimitKey);
    if (!rateCheck.allowed) {
      setSendError(rateCheck.error);
      return;
    }

    setIsSending(true);
    setSendError('');
    setTxResult(null);

    try {
      const pwdToUse = isUnlocked && storedPassword ? storedPassword : password;
      let wallet;
      if (accountProfile.wallet_type === 'oauth') {
        const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
        wallet = await walletStorage.findWalletBySocialId(walletId, pwdToUse, accountProfile.account);
      } else {
        wallet = await walletStorage.getWalletByAddress(accountProfile.account, pwdToUse);
      }

      if (!wallet?.seed) {
        securityUtils.rateLimiter.recordFailure(rateLimitKey);
        throw new Error('Incorrect password');
      }
      securityUtils.rateLimiter.recordSuccess(rateLimitKey);

      const client = new Client('wss://xrplcluster.com');
      await client.connect();

      try {
        const payment = {
          TransactionType: 'Payment',
          Account: accountProfile.account,
          Destination: recipient,
          Amount: xrpToDrops(amount)
        };

        if (destinationTag) {
          payment.DestinationTag = parseInt(destinationTag);
        }

        const { Wallet: XRPLWallet } = await import('xrpl');
        const xrplWallet = XRPLWallet.fromSeed(wallet.seed);

        const prepared = await client.autofill(payment);
        const signed = xrplWallet.sign(prepared);
        const result = await client.submitAndWait(signed.tx_blob);

        if (result.result.meta.TransactionResult === 'tesSUCCESS') {
          setTxResult({
            success: true,
            hash: result.result.hash,
            amount: amount,
            recipient: recipient
          });
          openSnackbar('Transaction successful', 'success');
          setRecipient('');
          setAmount('');
          setDestinationTag('');
          if (!isUnlocked) setPassword('');
        } else {
          throw new Error(result.result.meta.TransactionResult);
        }
      } finally {
        await client.disconnect();
      }
    } catch (err) {
      setSendError(err.message || 'Transaction failed');
    } finally {
      setIsSending(false);
    }
  };

  if (!accountProfile || checkingUnlock) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", isDark ? "bg-black" : "bg-gray-50")}>
        <Loader2 className={cn("animate-spin", isDark ? "text-white/40" : "text-gray-400")} size={24} />
      </div>
    );
  }

  const truncateAddress = (addr, len = 6) =>
    addr ? `${addr.slice(0, len)}...${addr.slice(-4)}` : '';

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={cn("min-h-screen pb-8", isDark ? "bg-black" : "bg-gray-50")}>
      {/* Header */}
      <div className={cn(
        "sticky top-[52px] z-10 border-b backdrop-blur-xl",
        isDark ? "border-white/10 bg-black/90" : "border-gray-200 bg-white/90"
      )}>
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <a
              href="/"
              className={cn(
                "p-2 -ml-2 rounded-lg transition-colors",
                isDark ? "hover:bg-white/5" : "hover:bg-gray-100"
              )}
            >
              <ArrowLeft size={20} className={isDark ? "text-white" : "text-gray-900"} />
            </a>
            <button
              onClick={handleCopyAddress}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors",
                copied
                  ? "bg-emerald-500/10 text-emerald-500"
                  : isDark
                    ? "bg-white/5 text-white/70 hover:bg-white/10"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {truncateAddress(accountProfile.account)}
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>

          {/* Balance */}
          <div className="mt-3 mb-4 text-center">
            <p className={cn("text-[10px] uppercase tracking-wider mb-0.5", isDark ? "text-white/40" : "text-gray-400")}>
              Available
            </p>
            <p className={cn("text-3xl font-light tracking-tight", isDark ? "text-white" : "text-gray-900")}>
              {Number(availableBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              <span className={cn("text-sm ml-1", isDark ? "text-white/30" : "text-gray-400")}>XRP</span>
            </p>
          </div>

          {/* Tabs */}
          <div className={cn(
            "flex rounded-lg p-0.5 gap-0.5",
            isDark ? "bg-white/5" : "bg-gray-100"
          )}>
            {[
              { id: 'send', label: 'Send', icon: ArrowUpRight },
              { id: 'receive', label: 'Receive', icon: ArrowDownLeft },
              { id: 'history', label: 'Activity', icon: History }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-[12px] font-medium transition-all",
                  activeTab === tab.id
                    ? isDark
                      ? "bg-white/10 text-white"
                      : "bg-white text-gray-900 shadow-sm"
                    : isDark
                      ? "text-white/50 hover:text-white/70"
                      : "text-gray-500 hover:text-gray-700"
                )}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-5">
        {/* Send Tab */}
        {activeTab === 'send' && (
          <div className="space-y-3">
            {txResult?.success ? (
              <div className={cn(
                "rounded-2xl p-8 text-center",
                isDark ? "bg-emerald-500/5" : "bg-emerald-50"
              )}>
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-emerald-500" />
                </div>
                <p className={cn("text-2xl font-light mb-1", isDark ? "text-white" : "text-gray-900")}>
                  {txResult.amount} XRP
                </p>
                <p className={cn("text-sm mb-6", isDark ? "text-white/50" : "text-gray-500")}>
                  Sent to {truncateAddress(txResult.recipient)}
                </p>
                <div className="flex gap-2">
                  <a
                    href={`https://xrpl.to/tx/${txResult.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5",
                      isDark ? "bg-white/5 text-white/70 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    View <ExternalLink size={14} />
                  </a>
                  <button
                    onClick={() => setTxResult(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90"
                  >
                    Send more
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Amount Input - Prominent */}
                <div className={cn(
                  "rounded-2xl p-5 text-center",
                  isDark ? "bg-white/[0.03]" : "bg-white border border-gray-200"
                )}>
                  <p className={cn("text-[11px] uppercase tracking-wider mb-3", isDark ? "text-white/40" : "text-gray-400")}>
                    Amount
                  </p>
                  <div className="relative inline-flex items-baseline">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setAmount(val);
                          setSendError('');
                        }
                      }}
                      placeholder="0"
                      className={cn(
                        "text-5xl font-light text-center bg-transparent outline-none w-full max-w-[200px]",
                        isDark ? "text-white placeholder:text-white/20" : "text-gray-900 placeholder:text-gray-300"
                      )}
                    />
                    <span className={cn("text-xl ml-2", isDark ? "text-white/30" : "text-gray-400")}>XRP</span>
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-3">
                    <span className={cn("text-xs", isDark ? "text-white/40" : "text-gray-400")}>
                      Max: {maxSendable.toFixed(2)}
                    </span>
                    <button
                      onClick={() => setAmount(maxSendable.toFixed(6))}
                      className="text-xs text-primary font-medium hover:text-primary/80"
                    >
                      Send all
                    </button>
                  </div>
                </div>

                {/* Recipient */}
                <div className={cn(
                  "rounded-xl p-4",
                  isDark ? "bg-white/[0.03]" : "bg-white border border-gray-200"
                )}>
                  <label className={cn("block text-[11px] uppercase tracking-wider mb-2", isDark ? "text-white/40" : "text-gray-400")}>
                    To
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => { setRecipient(e.target.value.trim()); setSendError(''); }}
                    placeholder="Enter XRPL address"
                    className={cn(
                      "w-full text-sm bg-transparent outline-none font-mono",
                      isDark ? "text-white placeholder:text-white/30" : "text-gray-900 placeholder:text-gray-400"
                    )}
                  />
                </div>

                {/* Advanced Options Toggle */}
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={cn(
                    "w-full py-2 text-xs font-medium",
                    isDark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {showAdvanced ? 'Hide' : 'Show'} destination tag
                </button>

                {/* Destination Tag */}
                {showAdvanced && (
                  <div className={cn(
                    "rounded-xl p-4",
                    isDark ? "bg-white/[0.03]" : "bg-white border border-gray-200"
                  )}>
                    <label className={cn("block text-[11px] uppercase tracking-wider mb-2", isDark ? "text-white/40" : "text-gray-400")}>
                      Destination Tag
                    </label>
                    <input
                      type="number"
                      value={destinationTag}
                      onChange={(e) => setDestinationTag(e.target.value)}
                      placeholder="Optional"
                      className={cn(
                        "w-full text-sm bg-transparent outline-none",
                        isDark ? "text-white placeholder:text-white/30" : "text-gray-900 placeholder:text-gray-400"
                      )}
                    />
                  </div>
                )}

                {/* Password */}
                {!isUnlocked && (
                  <div className={cn(
                    "rounded-xl p-4",
                    isDark ? "bg-white/[0.03]" : "bg-white border border-gray-200"
                  )}>
                    <label className={cn("block text-[11px] uppercase tracking-wider mb-2", isDark ? "text-white/40" : "text-gray-400")}>
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setSendError(''); }}
                        placeholder="Enter to confirm"
                        className={cn(
                          "w-full text-sm bg-transparent outline-none pr-10",
                          isDark ? "text-white placeholder:text-white/30" : "text-gray-900 placeholder:text-gray-400"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={cn("absolute right-0 top-0", isDark ? "text-white/30" : "text-gray-400")}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Error */}
                {sendError && (
                  <div className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-xl text-sm",
                    isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600"
                  )}>
                    <AlertTriangle size={16} />
                    {sendError}
                  </div>
                )}

                {/* Send Button */}
                <button
                  onClick={handleSend}
                  disabled={isSending}
                  className={cn(
                    "w-full py-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2",
                    isSending
                      ? "bg-primary/50 text-white/70 cursor-not-allowed"
                      : "bg-primary text-white hover:bg-primary/90 active:scale-[0.98]"
                  )}
                >
                  {isSending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      Send
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {/* Receive Tab */}
        {activeTab === 'receive' && (
          <div className="space-y-4">
            <div className={cn(
              "rounded-2xl p-6 text-center",
              isDark ? "bg-white/[0.03]" : "bg-white border border-gray-200"
            )}>
              <div className="inline-block p-3 bg-white rounded-2xl mb-4 shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${accountProfile.account}&bgcolor=ffffff&color=000000&margin=0`}
                  alt="QR"
                  className="w-[200px] h-[200px]"
                />
              </div>

              <p className={cn("text-[11px] uppercase tracking-wider mb-2", isDark ? "text-white/40" : "text-gray-400")}>
                Your Address
              </p>
              <p className={cn("font-mono text-[13px] break-all leading-relaxed", isDark ? "text-white/80" : "text-gray-700")}>
                {accountProfile.account}
              </p>

              <button
                onClick={handleCopyAddress}
                className={cn(
                  "mt-4 w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all",
                  copied
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-primary text-white hover:bg-primary/90 active:scale-[0.98]"
                )}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy Address'}
              </button>
            </div>

            {availableBalance === 0 && (
              <div className={cn(
                "flex items-start gap-3 p-4 rounded-xl",
                isDark ? "bg-amber-500/5" : "bg-amber-50"
              )}>
                <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className={cn("text-sm font-medium", isDark ? "text-amber-400" : "text-amber-700")}>
                    Activate your account
                  </p>
                  <p className={cn("text-xs mt-0.5", isDark ? "text-white/50" : "text-gray-600")}>
                    Receive at least 10 XRP to activate.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <p className={cn("text-[11px] uppercase tracking-wider", isDark ? "text-white/40" : "text-gray-400")}>
                Recent Activity
              </p>
              <button
                onClick={loadTransactionHistory}
                disabled={loadingHistory}
                className={cn("p-1.5 rounded-lg", isDark ? "hover:bg-white/5" : "hover:bg-gray-100")}
              >
                <RefreshCw size={14} className={cn(loadingHistory && "animate-spin", isDark ? "text-white/40" : "text-gray-400")} />
              </button>
            </div>

            {loadingHistory && transactions.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className={cn("animate-spin", isDark ? "text-white/30" : "text-gray-300")} size={24} />
              </div>
            ) : transactions.length === 0 ? (
              <div className={cn("text-center py-16", isDark ? "text-white/30" : "text-gray-400")}>
                <History size={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">No activity yet</p>
              </div>
            ) : (
              <>
                {transactions.map((tx, i) => {
                  const isReceived = tx.Destination === accountProfile.account;
                  const txAmount = tx.Amount?.value || (typeof tx.Amount === 'string' ? dropsToXrp(tx.Amount) : '0');
                  const otherParty = isReceived ? tx.Account : tx.Destination;

                  return (
                    <a
                      key={tx.hash || i}
                      href={`https://xrpl.to/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl transition-colors",
                        isDark ? "hover:bg-white/[0.03]" : "hover:bg-gray-50"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        isReceived ? "bg-emerald-500/10" : isDark ? "bg-white/5" : "bg-gray-100"
                      )}>
                        {isReceived ? (
                          <ArrowDownLeft size={18} className="text-emerald-500" />
                        ) : (
                          <ArrowUpRight size={18} className={isDark ? "text-white/60" : "text-gray-500"} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>
                          {isReceived ? 'Received' : 'Sent'}
                        </p>
                        <p className={cn("text-xs truncate", isDark ? "text-white/40" : "text-gray-400")}>
                          {isReceived ? 'From' : 'To'} {truncateAddress(otherParty)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "text-sm font-medium tabular-nums",
                          isReceived ? "text-emerald-500" : isDark ? "text-white" : "text-gray-900"
                        )}>
                          {isReceived ? '+' : '-'}{Number(txAmount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                        <p className={cn("text-[11px]", isDark ? "text-white/30" : "text-gray-400")}>
                          {formatDate(tx.date)}
                        </p>
                      </div>
                    </a>
                  );
                })}

                <a
                  href={`https://xrpl.to/account/${accountProfile.account}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-4 text-sm font-medium",
                    "text-primary hover:text-primary/80"
                  )}
                >
                  View all <ExternalLink size={14} />
                </a>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default WalletPage;
