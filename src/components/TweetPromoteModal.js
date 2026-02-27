import { useState, useEffect, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from 'src/utils/cn';
import { WalletContext, AppContext } from 'src/context/AppContext';
import { Check, Loader2, ExternalLink, AlertCircle, X, Gift, Trophy, Crown, Award, Megaphone, Send, MessageCircle, Facebook, Linkedin, Mail, Copy, Share2, Clock, Info, Timer } from 'lucide-react';
import api from 'src/utils/api';

const BASE_URL = 'https://api.xrpl.to';

const XSocialIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const ShareAction = ({ icon: Icon, color, iconClassName, onClick, label }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1.5 group transition-all">
    <div className={cn(
      "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 active:scale-95",
      "bg-gray-50 border border-gray-100 group-hover:bg-white dark:bg-white/[0.03] dark:border-white/[0.05] dark:group-hover:bg-white/[0.08]"
    )}>
      <Icon size={18} style={color ? { color } : undefined} className={iconClassName} />
    </div>
    <span className={cn("text-[9px] font-medium opacity-50 group-hover:opacity-100", "text-gray-900 dark:text-white")}>{label}</span>
  </button>
);

const TIER_CONFIG = {
  advocate:   { icon: Megaphone, color: 'text-[#137DFE]' },
  ambassador: { icon: Award,     color: 'text-[#650CD4]' },
  champion:   { icon: Trophy,    color: 'text-[#F6AF01]' },
  legend:     { icon: Crown,     color: 'text-yellow-400' },
};

function TierIcon({ tierId, size = 12 }) {
  const config = TIER_CONFIG[tierId] || TIER_CONFIG.advocate;
  const Icon = config.icon;
  return <Icon size={size} className={config.color} />;
}

export default function TweetPromoteModal({ token, tweetCount = 0, onCountChange, open: externalOpen, onOpenChange, wrapperClassName, className, type = 'token' }) {
  const { accountProfile } = useContext(WalletContext);
  const { openSnackbar } = useContext(AppContext);

  const [internalOpen, setInternalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tweetUrl, setTweetUrl] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState(null);
  const [verifyMessage, setVerifyMessage] = useState('');
  const [tweets, setTweets] = useState([]);
  const [poolInfo, setPoolInfo] = useState(null);
  const [rewardInfo, setRewardInfo] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  const [profileStats, setProfileStats] = useState(null);
  const [cooldownLeft, setCooldownLeft] = useState(null); // ms remaining, null = no cooldown

  useEffect(() => setMounted(true), []);

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = (v) => {
    if (onOpenChange) onOpenChange(v);
    else setInternalOpen(v);
  };

  const isNft = type === 'nft';
  const { md5, name, user, issuer, currency, slug: nftSlug } = token || {};
  const ticker = user || name;
  const tokenSlug = isNft ? nftSlug : `${issuer}-${currency}`;
  const tokenPageUrl = isNft ? `https://xrpl.to/nfts/${tokenSlug}` : `https://xrpl.to/token/${tokenSlug}`;
  const tweetText = isNft ? `Check out ${name} NFT collection on XRPL!` : `Check out $${ticker || name} on XRPL!`;
  const tweetIntentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(tokenPageUrl)}`;

  const account = accountProfile?.account;

  const fetchPoolInfo = useCallback(async () => {
    if (!md5) return;
    try {
      const res = await api.get(`${BASE_URL}/api/promotion/pool/${md5}`);
      if (res.data) setPoolInfo(res.data);
    } catch {}
  }, [md5]);

  const fetchRewardInfo = useCallback(async () => {
    if (!md5 || !account) return;
    try {
      const res = await api.get(`${BASE_URL}/api/promotion/reward/${md5}/${account}`);
      if (res.data) setRewardInfo(res.data);
    } catch {}
  }, [md5, account]);

  const fetchLeaderboard = useCallback(async () => {
    if (!md5) return;
    try {
      const res = await api.get(`${BASE_URL}/api/promotion/leaderboard/${md5}?limit=20`);
      if (res.data) {
        setTweets(res.data.promoters || []);
        if (onCountChange) onCountChange(res.data.count || 0);
      }
    } catch {}
  }, [md5, onCountChange]);

  const fetchProfile = useCallback(async () => {
    if (!account) return;
    try {
      const res = await api.get(`${BASE_URL}/api/promotion/profile/${account}`);
      if (res.data) setProfileStats(res.data);
    } catch {}
  }, [account]);

  useEffect(() => {
    if (isOpen) {
      if (!isNft) { fetchPoolInfo(); fetchRewardInfo(); }
      fetchLeaderboard();
      fetchProfile();
    }
  }, [isOpen, isNft, fetchPoolInfo, fetchRewardInfo, fetchLeaderboard, fetchProfile]);

  // Cooldown countdown timer
  useEffect(() => {
    const cd = profileStats?.cooldown;
    if (!cd?.onCooldown || !cd.cooldownEndsAt) { setCooldownLeft(null); return; }
    const tick = () => {
      const remaining = cd.cooldownEndsAt - Date.now();
      if (remaining <= 0) { setCooldownLeft(null); fetchProfile(); return; }
      setCooldownLeft(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [profileStats?.cooldown?.cooldownEndsAt, profileStats?.cooldown?.onCooldown, fetchProfile]);

  const handleVerify = async () => {
    if (!tweetUrl.trim()) return;

    if (!account) {
      setVerifyStatus('error');
      setVerifyMessage('Connect your wallet to verify a tweet.');
      return;
    }

    setVerifying(true);
    setVerifyStatus(null);
    setVerifyMessage('');

    try {
      // Sign request with wallet private key for ownership verification
      const wallet = await getSigningWallet();
      if (!wallet) {
        setVerifyStatus('error');
        setVerifyMessage('Could not access wallet for signing. Please reconnect.');
        setVerifying(false);
        return;
      }

      const { sign } = await import('ripple-keypairs');
      const timestamp = Date.now();
      const message = `${account}:${timestamp}`;
      const messageHex = Buffer.from(message).toString('hex');
      const signature = sign(messageHex, wallet.privateKey);

      const res = await api.post(`${BASE_URL}/api/tweet/verify`, {
        md5,
        tweetUrl: tweetUrl.trim(),
        account,
        ...(isNft && { type: 'nft' })
      }, {
        headers: {
          'X-Wallet': account,
          'X-Timestamp': timestamp.toString(),
          'X-Signature': signature,
          'X-Public-Key': wallet.publicKey
        }
      });

      if (res.data?.success) {
        setVerifyStatus('success');
        if (!isNft && res.data.reward?.earned) {
          setVerifyMessage(`Tweet verified! You earned ${res.data.reward.amount} ${res.data.reward.tokenName || ticker} tokens. Claim below!`);
        } else {
          setVerifyMessage('Tweet verified! Promoter badge updated.');
        }
        setTweetUrl('');
        fetchLeaderboard();
        if (!isNft) { fetchPoolInfo(); fetchRewardInfo(); }
        fetchProfile();
      } else {
        setVerifyStatus('error');
        setVerifyMessage(res.data?.error || 'Verification failed');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Verification failed';
      setVerifyStatus('error');
      setVerifyMessage(msg);
    } finally {
      setVerifying(false);
    }
  };

  const getSigningWallet = async () => {
    if (!accountProfile) return null;
    try {
      const { Wallet } = await import('xrpl');
      const getAlgo = (s) => s.startsWith('sEd') ? 'ed25519' : 'secp256k1';

      if (accountProfile.seed) {
        return Wallet.fromSeed(accountProfile.seed, { algorithm: getAlgo(accountProfile.seed) });
      }

      const { UnifiedWalletStorage, deviceFingerprint } = await import('src/utils/encryptedWalletStorage');
      const walletStorage = new UnifiedWalletStorage();
      const deviceKeyId = accountProfile.deviceKeyId || await deviceFingerprint.getDeviceId();
      const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);
      if (!storedPassword) return null;
      const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
      if (!walletData?.seed) return null;
      return Wallet.fromSeed(walletData.seed, { algorithm: getAlgo(walletData.seed) });
    } catch (err) {
      console.error('[TweetPromoteModal] getSigningWallet error:', err.message);
      return null;
    }
  };

  const handleClaim = async () => {
    if (!md5 || !account || claiming) return;
    setClaiming(true);
    setClaimResult(null);

    try {
      const wallet = await getSigningWallet();
      if (!wallet) {
        setClaimResult({ success: false, error: 'Could not access wallet for signing. Please reconnect.' });
        setClaiming(false);
        return;
      }

      const { sign } = await import('ripple-keypairs');
      const timestamp = Date.now();
      const message = `${account}:${timestamp}`;
      const messageHex = Buffer.from(message).toString('hex');
      const signature = sign(messageHex, wallet.privateKey);

      const res = await api.post(`${BASE_URL}/api/promotion/claim`, { md5, account }, {
        headers: {
          'X-Wallet': account,
          'X-Timestamp': timestamp.toString(),
          'X-Signature': signature,
          'X-Public-Key': wallet.publicKey
        }
      });
      if (res.data?.success) {
        setClaimResult({ success: true, txHash: res.data.txHash, amount: res.data.amount });
        fetchRewardInfo();
        fetchPoolInfo();
        fetchProfile();
      } else {
        setClaimResult({ success: false, error: res.data?.error || 'Claim failed' });
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Claim failed';
      setClaimResult({ success: false, error: msg });
    } finally {
      setClaiming(false);
    }
  };

  const poolActive = !isNft && poolInfo?.exists && poolInfo?.status === 'active' && !poolInfo?.expired;
  const poolExpiredButClaimable = !isNft && poolInfo?.exists && (poolInfo?.expired || poolInfo?.status === 'depleted') && rewardInfo?.exists && (rewardInfo.status === 'earned' || rewardInfo.status === 'failed');

  const modal = isOpen && mounted && createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300 max-sm:h-dvh"
      onClick={() => setIsOpen(false)}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative w-full max-w-xl rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden',
          'bg-white border-gray-100 dark:bg-[#0a0a0a] dark:border-white/10'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <Share2 size={14} className="opacity-40" />
            <span className={cn('text-sm font-bold uppercase tracking-widest opacity-40', 'text-gray-900 dark:text-white')}>
              Share {ticker}
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className={cn('p-1.5 rounded-xl transition-colors', 'hover:bg-gray-100 text-gray-400 dark:hover:bg-white/10 dark:text-white/40')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 space-y-3">
          {/* Share platforms */}
          <div className="grid grid-cols-7 gap-1.5">
            <ShareAction icon={XSocialIcon} iconClassName="text-black dark:text-white" label="X"
              onClick={() => window.open(tweetIntentUrl, '_blank')} />
            <ShareAction icon={Send} color="#229ED9" label="Telegram"
              onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(tokenPageUrl)}&text=${encodeURIComponent(tweetText)}`, '_blank')} />
            <ShareAction icon={MessageCircle} color="#25D366" label="WhatsApp"
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${tweetText} ${tokenPageUrl}`)}`, '_blank')} />
            <ShareAction icon={Facebook} color="#1877F2" label="Facebook"
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(tokenPageUrl)}`, '_blank')} />
            <ShareAction icon={Linkedin} color="#0A66C2" label="LinkedIn"
              onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(tokenPageUrl)}`, '_blank')} />
            <ShareAction icon={Mail} color="#6B7280" label="Email"
              onClick={() => { window.location.href = `mailto:?subject=${encodeURIComponent(tweetText)}&body=${encodeURIComponent(tokenPageUrl)}`; }} />
            <ShareAction icon={Copy} color="#3f96fe" label="Copy"
              onClick={() => { navigator.clipboard.writeText(tokenPageUrl); if (openSnackbar) openSnackbar('Link copied!', 'success'); }} />
          </div>

          {/* Verify tweet for promoter credit */}
          <div className={cn(
            'rounded-xl border px-3 py-2.5 flex items-start gap-2.5',
            'bg-gray-50 border-gray-100 dark:bg-white/[0.03] dark:border-white/[0.06]'
          )}>
            <Trophy size={14} className="text-[#F6AF01] shrink-0 mt-0.5" />
            <div className={cn('text-[11px] leading-[1.5]', 'text-gray-500 dark:text-white/50')}>
              <span className={cn('font-semibold', 'text-gray-700 dark:text-white/80')}>Earn promoter rank.</span> Tweet about {ticker}, then paste your tweet URL below to verify and climb from Advocate to Legend.
            </div>
          </div>

          {/* Reward pool — expired but user has unclaimed reward */}
          {poolExpiredButClaimable && !poolActive && (() => {
            const rewardToken = poolInfo.tokenName || ticker;
            return (
              <div className={cn(
                'rounded-xl border px-3 py-2.5 flex items-start gap-2.5',
                'bg-amber-50 border-amber-100 dark:bg-[#F6AF01]/10 dark:border-[#F6AF01]/20'
              )}>
                <Gift size={14} className="text-[#F6AF01] shrink-0 mt-0.5" />
                <div className={cn('text-[11px] leading-[1.5]', 'text-gray-500 dark:text-white/50')}>
                  <span className={cn('font-semibold', 'text-gray-700 dark:text-white/80')}>You have an unclaimed reward.</span> The promotion period has ended but your <span className={cn('font-semibold', 'text-gray-700 dark:text-white/80')}>{Number(parseFloat(rewardInfo.amount) || 0).toLocaleString()} {rewardToken}</span> tokens are still available to claim.
                </div>
              </div>
            );
          })()}

          {/* Reward pool — only when pool exists (tokens only) */}
          {poolActive && (() => {
            const perUser = parseFloat(poolInfo.rewardPerPromoter) || 0;
            const totalPool = parseFloat(poolInfo.totalAmount) || 0;
            const rewardToken = poolInfo.tokenName || ticker;
            const earned = poolInfo.earnedCount || 0;
            const max = poolInfo.maxPromoters || 500;
            const remaining = max - earned;
            const progressPct = Math.min((earned / max) * 100, 100);

            const msLeft = (poolInfo.expiresAt || 0) - Date.now();
            const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
            const hoursLeft = Math.max(0, Math.ceil(msLeft / (60 * 60 * 1000)));
            const expiryUrgent = daysLeft <= 3;
            const expiryLabel = daysLeft > 1 ? `${daysLeft}d left` : hoursLeft > 0 ? `${hoursLeft}h left` : 'Expiring';

            return (
              <div className={cn(
                'rounded-xl border px-3 py-3 space-y-2.5',
                'bg-purple-50 border-purple-100 dark:bg-[#650CD4]/10 dark:border-[#650CD4]/20'
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift size={14} className="text-[#650CD4]" />
                    <span className={cn('text-[12px] font-semibold', 'text-gray-800 dark:text-white/90')}>
                      Reward Pool
                    </span>
                    <span className={cn('text-[10px] font-medium', 'text-gray-400 dark:text-white/40')}>
                      {Number(totalPool).toLocaleString()} {rewardToken}
                    </span>
                  </div>
                  <span className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                    expiryUrgent
                      ? 'text-red-500 bg-red-500/10'
                      : 'text-[#650CD4] bg-[#650CD4]/10'
                  )}>
                    {earned === 0 ? `New — ${expiryLabel}` : expiryLabel}
                  </span>
                </div>

                <p className={cn('text-[11px] leading-[1.4]', 'text-gray-500 dark:text-white/50')}>
                  The token creator has allocated <span className={cn('font-semibold', 'text-gray-700 dark:text-white/80')}>{Number(totalPool).toLocaleString()} {rewardToken}</span> for promoters. Post about this token on X, then verify your tweet URL to receive <span className={cn('font-semibold', 'text-gray-700 dark:text-white/80')}>{Number(perUser).toLocaleString()} {rewardToken}</span>. {remaining > 0 ? `${remaining} spot${remaining !== 1 ? 's' : ''} remaining.` : 'All spots filled.'}
                </p>

                <div className="grid grid-cols-3 gap-2">
                  <div className={cn('rounded-lg px-2 py-1.5 text-center', 'bg-white/80 dark:bg-white/[0.04]')}>
                    <div className={cn('text-[12px] font-bold', 'text-gray-900 dark:text-white')}>
                      {Number(perUser).toLocaleString()}
                    </div>
                    <div className={cn('text-[9px] uppercase tracking-wide', 'text-gray-400 dark:text-white/30')}>
                      {rewardToken} / user
                    </div>
                  </div>
                  <div className={cn('rounded-lg px-2 py-1.5 text-center', 'bg-white/80 dark:bg-white/[0.04]')}>
                    <div className={cn('text-[12px] font-bold', 'text-gray-900 dark:text-white')}>
                      {remaining}
                    </div>
                    <div className={cn('text-[9px] uppercase tracking-wide', 'text-gray-400 dark:text-white/30')}>
                      Spots open
                    </div>
                  </div>
                  <div className={cn('rounded-lg px-2 py-1.5 text-center', 'bg-white/80 dark:bg-white/[0.04]')}>
                    <div className={cn('text-[12px] font-bold', 'text-gray-900 dark:text-white')}>
                      {earned}/{max}
                    </div>
                    <div className={cn('text-[9px] uppercase tracking-wide', 'text-gray-400 dark:text-white/30')}>
                      Earned
                    </div>
                  </div>
                </div>

                <div className={cn('h-1.5 rounded-full overflow-hidden', 'bg-gray-200 dark:bg-white/[0.06]')}>
                  <div
                    className="h-full rounded-full bg-[#650CD4] transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {/* How it works — show when pool is active */}
          {poolActive && (
            <div className={cn(
              'rounded-xl border px-3 py-2.5 space-y-1.5',
              'bg-gray-50/50 border-gray-100 dark:bg-white/[0.02] dark:border-white/[0.06]'
            )}>
              <div className="flex items-center gap-1.5">
                <Info size={11} className={cn('text-gray-400 dark:text-white/30')} />
                <span className={cn('text-[10px] font-semibold uppercase tracking-wide', 'text-gray-400 dark:text-white/40')}>
                  How it works
                </span>
              </div>
              <ul className={cn('text-[10px] leading-[1.6] space-y-0.5 pl-4', 'text-gray-400 dark:text-white/40')}>
                <li className="list-disc">Post a unique tweet about this token on X, then paste the URL below</li>
                <li className="list-disc">Up to <span className={cn('font-semibold', 'text-gray-600 dark:text-white/60')}>6 verifications per day</span> across different tokens</li>
                <li className="list-disc"><span className={cn('font-semibold', 'text-gray-600 dark:text-white/60')}>2 hour cooldown</span> between each verification</li>
                <li className="list-disc">Each tweet can only be used for one token — no reuse</li>
              </ul>
            </div>
          )}

          {/* Cooldown timer — show when user is on cooldown */}
          {account && cooldownLeft !== null && (() => {
            const hrs = Math.floor(cooldownLeft / 3600000);
            const mins = Math.floor((cooldownLeft % 3600000) / 60000);
            const secs = Math.floor((cooldownLeft % 60000) / 1000);
            const timeStr = hrs > 0 ? `${hrs}h ${mins}m ${secs}s` : `${mins}m ${secs}s`;
            const cd = profileStats?.cooldown;
            const dailyUsed = cd?.dailyUsed || 0;
            const dailyLimit = cd?.dailyLimit || 6;
            const dailyRemaining = Math.max(0, dailyLimit - dailyUsed);
            return (
              <div className={cn(
                'rounded-xl border px-3 py-2.5 flex items-center gap-2.5',
                'bg-blue-50 border-blue-100 dark:bg-[#137DFE]/10 dark:border-[#137DFE]/20'
              )}>
                <Timer size={14} className="text-[#137DFE] shrink-0 animate-pulse" />
                <div className={cn('text-[11px] leading-[1.5] flex-1', 'text-gray-500 dark:text-white/50')}>
                  <span className={cn('font-semibold tabular-nums', 'text-gray-700 dark:text-white/80')}>{timeStr}</span> until next verification
                  <span className={cn('ml-2 text-[10px]', 'text-gray-400 dark:text-white/30')}>
                    {dailyRemaining}/{dailyLimit} left today
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Daily limit reached */}
          {account && cooldownLeft === null && profileStats?.cooldown?.dailyUsed >= 6 && (
            <div className={cn(
              'rounded-xl border px-3 py-2.5 flex items-center gap-2.5',
              'bg-amber-50 border-amber-100 dark:bg-[#F6AF01]/10 dark:border-[#F6AF01]/20'
            )}>
              <AlertCircle size={14} className="text-[#F6AF01] shrink-0" />
              <div className={cn('text-[11px] leading-[1.5]', 'text-gray-500 dark:text-white/50')}>
                You've used all <span className={cn('font-semibold', 'text-gray-700 dark:text-white/80')}>6 verifications</span> for today. Come back tomorrow!
              </div>
            </div>
          )}

          {/* Verify input */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <XSocialIcon size={11} />
              <span className={cn('text-[10px] font-medium', 'text-gray-400 dark:text-white/40')}>
                Only x.com / twitter.com links are supported
              </span>
            </div>
            <div className="flex gap-2">
            <input
              type="text"
              value={tweetUrl}
              onChange={(e) => {
                setTweetUrl(e.target.value);
                setVerifyStatus(null);
                setVerifyMessage('');
              }}
              placeholder="Paste your X (Twitter) post URL..."
              className={cn(
                'flex-1 px-3 py-2 rounded-lg text-[12px] border outline-none transition-colors',
                'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-gray-300 dark:bg-white/[0.04] dark:border-white/10 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/20'
              )}
            />
            <button
              onClick={handleVerify}
              disabled={verifying || !tweetUrl.trim()}
              className={cn(
                'px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors flex items-center gap-1.5',
                verifying || !tweetUrl.trim()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-white/5 dark:text-white/30'
                  : 'bg-[#137DFE] text-white hover:bg-[#137DFE]/90'
              )}
            >
              {verifying ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              Verify
            </button>
            </div>
          </div>

          {/* Status message */}
          {verifyStatus && (
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]',
                verifyStatus === 'success'
                  ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'
                  : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
              )}
            >
              {verifyStatus === 'success' ? <Check size={12} /> : <AlertCircle size={12} />}
              {verifyMessage}
            </div>
          )}

          {/* Claim button — shown when reward earned or failed (retry) */}
          {rewardInfo?.exists && (rewardInfo.status === 'earned' || rewardInfo.status === 'failed') && (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-semibold transition-colors',
                claiming
                  ? 'bg-[#08AA09]/50 text-white/60 cursor-not-allowed'
                  : rewardInfo.status === 'failed'
                    ? 'bg-[#F6AF01] text-black hover:bg-[#F6AF01]/90'
                    : 'bg-[#08AA09] text-white hover:bg-[#08AA09]/90'
              )}
            >
              {claiming ? <Loader2 size={14} className="animate-spin" /> : <Gift size={14} />}
              {claiming ? 'Claiming...' : rewardInfo.status === 'failed' ? `Retry claim ${rewardInfo.amount} tokens` : `Claim ${rewardInfo.amount} tokens`}
            </button>
          )}

          {/* Claim result */}
          {claimResult && (
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]',
              claimResult.success
                ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'
                : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
            )}>
              {claimResult.success ? <Check size={12} /> : <AlertCircle size={12} />}
              {claimResult.success
                ? `Claimed ${claimResult.amount} tokens! Tx: ${claimResult.txHash?.slice(0, 8)}...${claimResult.txHash?.slice(-6)}`
                : claimResult.error
              }
            </div>
          )}

          {/* Already claimed */}
          {rewardInfo?.exists && rewardInfo.status === 'claimed' && !claimResult && (
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]',
              'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'
            )}>
              <Check size={12} />
              Reward claimed! Tx: {rewardInfo.txHash?.slice(0, 8)}...{rewardInfo.txHash?.slice(-6)}
            </div>
          )}

          {/* Promoter leaderboard */}
          {tweets.length > 0 && (
            <div
              className={cn(
                'border-t pt-3 space-y-1.5',
                'border-gray-100 dark:border-white/[0.06]'
              )}
            >
              <span
                className={cn(
                  'text-[10px] font-semibold uppercase tracking-wider',
                  'text-gray-400 dark:text-white/40'
                )}
              >
                Promoter Leaderboard
              </span>
              <div className="max-h-[200px] overflow-y-auto space-y-0.5">
                {tweets.map((promoter) => {
                  const username = promoter.tweetUsername || promoter.tweetAuthor || '';
                  const avatarUrl = username ? `https://unavatar.io/twitter/${username}` : null;
                  return (
                    <a
                      key={promoter.tweetId}
                      href={promoter.latestTweetUrl || promoter.tweetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors group',
                        'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn('text-[10px] font-mono w-4 text-right flex-shrink-0', 'text-gray-300 dark:text-white/30')}>
                          #{promoter.rank}
                        </span>
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt=""
                            className="w-5 h-5 rounded-full flex-shrink-0 object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className={cn('w-5 h-5 rounded-full flex-shrink-0', 'bg-gray-200 dark:bg-white/10')} />
                        )}
                        {promoter.tier && <TierIcon tierId={promoter.tier.id} size={11} />}
                        <span className={cn('text-[11px] font-medium truncate', 'text-gray-600 dark:text-white/60')}>
                          @{username || promoter.account?.slice(0, 8) + '...'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={cn('text-[9px] font-mono', 'text-gray-300 dark:text-white/25')}>
                          {promoter.totalVerified}
                        </span>
                        {promoter.rewardStatus === 'claimed' && (
                          <Check size={10} className="text-[#08AA09]" />
                        )}
                        <ExternalLink
                          size={10}
                          className={cn(
                            'opacity-0 group-hover:opacity-100 transition-opacity',
                            'text-gray-400 dark:text-white/40'
                          )}
                        />
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Your promoter stats */}
          {account && profileStats && profileStats.totalVerified > 0 && (
            <div className={cn(
              'border-t pt-3 space-y-2',
              'border-gray-100 dark:border-white/[0.06]'
            )}>
              <span className={cn('text-[10px] font-semibold uppercase tracking-wider', 'text-gray-400 dark:text-white/40')}>
                Your Stats
              </span>
              <div className="flex items-center gap-3">
                {profileStats.tier && (
                  <div className="flex items-center gap-1.5">
                    <TierIcon tierId={profileStats.tier.id} size={14} />
                    <span className={cn('text-[12px] font-semibold', 'text-gray-700 dark:text-white/80')}>
                      {profileStats.tier.name}
                    </span>
                  </div>
                )}
                <div className={cn('text-[11px]', 'text-gray-400 dark:text-white/40')}>
                  {profileStats.totalVerified} tweet{profileStats.totalVerified !== 1 ? 's' : ''} verified
                </div>
                {profileStats.claimedRewards > 0 && (
                  <div className={cn('text-[11px]', 'text-gray-400 dark:text-white/40')}>
                    {profileStats.claimedRewards} claimed
                  </div>
                )}
              </div>
              {profileStats.nextTier && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={cn('text-[10px]', 'text-gray-400 dark:text-white/30')}>
                      {profileStats.nextTier.tweetsNeeded} more to {profileStats.nextTier.name}
                    </span>
                    <span className={cn('text-[10px] font-mono', 'text-gray-300 dark:text-white/25')}>
                      {profileStats.totalVerified}/{profileStats.nextTier.min}
                    </span>
                  </div>
                  <div className={cn('h-1 rounded-full overflow-hidden', 'bg-gray-200 dark:bg-white/[0.06]')}>
                    <div
                      className="h-full rounded-full bg-[#137DFE] transition-all duration-500"
                      style={{ width: `${Math.min((profileStats.totalVerified / profileStats.nextTier.min) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              {profileStats.earnedBadges?.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {profileStats.earnedBadges.map(badge => {
                    const tierId = badge.replace('badge:promoter_', '');
                    const config = TIER_CONFIG[tierId];
                    if (!config) return null;
                    return (
                      <span key={badge} className={cn(
                        'inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full',
                        'bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-white/50'
                      )}>
                        <TierIcon tierId={tierId} size={9} />
                        {tierId}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <div className={wrapperClassName}>
      <button
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <Share2 size={11} /> Share
        {tweetCount > 0 && (
          <span className={cn(
            'ml-0.5 px-1 py-px rounded-full text-[8px] font-bold',
            'bg-black/[0.06] text-gray-500 dark:bg-white/10 dark:text-white/60'
          )}>
            {tweetCount}
          </span>
        )}
      </button>
      {modal}
    </div>
  );
}
