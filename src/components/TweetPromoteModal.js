import { useState, useEffect, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from 'src/utils/cn';
import { ThemeContext, WalletContext } from 'src/context/AppContext';
import { Check, Loader2, ExternalLink, AlertCircle, X, Gift, Trophy, Crown, Award, Megaphone, Info } from 'lucide-react';
import api from 'src/utils/api';

const BASE_URL = 'https://api.xrpl.to';

const XSocialIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
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

export default function TweetPromoteModal({ token, tweetCount = 0, onCountChange, open: externalOpen, onOpenChange, wrapperClassName, className }) {
  const { themeName } = useContext(ThemeContext);
  const { accountProfile } = useContext(WalletContext);
  const isDark = themeName === 'XrplToDarkTheme';

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

  useEffect(() => setMounted(true), []);

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = (v) => {
    if (onOpenChange) onOpenChange(v);
    else setInternalOpen(v);
  };

  const { md5, name, user, issuer, currency } = token || {};
  const ticker = user || name;
  const tokenSlug = `${issuer}-${currency}`;
  const tokenPageUrl = `https://xrpl.to/token/${tokenSlug}`;
  const tweetText = `Check out $${ticker || name} on XRPL!`;
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
      fetchPoolInfo();
      fetchRewardInfo();
      fetchLeaderboard();
      fetchProfile();
    }
  }, [isOpen, fetchPoolInfo, fetchRewardInfo, fetchLeaderboard, fetchProfile]);

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
      const res = await api.post(`${BASE_URL}/api/tweet/verify`, {
        md5,
        tweetUrl: tweetUrl.trim(),
        account
      });

      if (res.data?.success) {
        setVerifyStatus('success');
        if (res.data.reward?.earned) {
          setVerifyMessage(`Tweet verified! You earned ${res.data.reward.amount} ${res.data.reward.tokenName || ticker} tokens. Claim below!`);
        } else {
          setVerifyMessage('Tweet verified! Promoter badge updated.');
        }
        setTweetUrl('');
        fetchLeaderboard();
        fetchPoolInfo();
        fetchRewardInfo();
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
      // Sign claim request with wallet private key (decentralized verification)
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

  const poolActive = poolInfo?.exists && poolInfo?.status === 'active' && !poolInfo?.expired;
  const MIN_TRUSTLINES = 100;
  const tokenTrustlines = token?.trustlines || 0;
  const eligible = tokenTrustlines >= MIN_TRUSTLINES || poolActive;

  const modal = isOpen && mounted && createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300 max-sm:h-dvh"
      onClick={() => setIsOpen(false)}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative w-full max-w-[380px] rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden',
          isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-100'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <XSocialIcon size={14} />
            <span className={cn('text-sm font-bold uppercase tracking-widest opacity-40', isDark ? 'text-white' : 'text-gray-900')}>
              Promote {ticker}
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className={cn('p-1.5 rounded-xl transition-colors', isDark ? 'hover:bg-white/10 text-white/40' : 'hover:bg-gray-100 text-gray-400')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 space-y-3">
          {/* Tweet button */}
          <a
            href={tweetIntentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-semibold transition-colors',
              isDark
                ? 'bg-white text-black hover:bg-white/90'
                : 'bg-black text-white hover:bg-black/90'
            )}
          >
            <XSocialIcon size={14} />
            Tweet about {ticker}
          </a>

          {/* Non-pool: badge/tier info */}
          {!poolActive && (
            <div className={cn(
              'rounded-xl border px-3 py-2.5 flex items-start gap-2.5',
              isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-gray-50 border-gray-100'
            )}>
              <Trophy size={14} className="text-[#F6AF01] shrink-0 mt-0.5" />
              <div className={cn('text-[11px] leading-[1.5]', isDark ? 'text-white/50' : 'text-gray-500')}>
                <span className={cn('font-semibold', isDark ? 'text-white/80' : 'text-gray-700')}>Earn promoter rank.</span> Verify tweets to climb from Advocate to Legend. Ranks show as profile badges.
              </div>
            </div>
          )}

          {/* Reward pool — only when pool exists */}
          {poolActive && (() => {
            const total = parseFloat(poolInfo.totalAmount) || 0;
            const perUser = parseFloat(poolInfo.rewardPerPromoter) || 0;
            const claimed = poolInfo.claimedCount || 0;
            const max = poolInfo.maxPromoters || 100;
            const remaining = total - (claimed * perUser);
            const sharePct = (3 / 100).toFixed(2);
            const progressPct = Math.min((claimed / max) * 100, 100);

            const msLeft = (poolInfo.expiresAt || 0) - Date.now();
            const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
            const hoursLeft = Math.max(0, Math.ceil(msLeft / (60 * 60 * 1000)));
            const expiryUrgent = daysLeft <= 3;
            const expiryLabel = daysLeft > 1 ? `${daysLeft}d left` : hoursLeft > 0 ? `${hoursLeft}h left` : 'Expiring';

            return (
              <div className={cn(
                'rounded-xl border px-3 py-3 space-y-2.5',
                isDark ? 'bg-[#650CD4]/10 border-[#650CD4]/20' : 'bg-purple-50 border-purple-100'
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift size={14} className="text-[#650CD4]" />
                    <span className={cn('text-[12px] font-semibold', isDark ? 'text-white/90' : 'text-gray-800')}>
                      Reward Pool
                    </span>
                  </div>
                  <span className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                    expiryUrgent
                      ? 'text-red-500 bg-red-500/10'
                      : 'text-[#650CD4] bg-[#650CD4]/10'
                  )}>
                    {claimed === 0 ? `New — ${expiryLabel}` : expiryLabel}
                  </span>
                </div>

                <div className={cn('text-[11px] leading-[1.6] space-y-0.5', isDark ? 'text-white/50' : 'text-gray-500')}>
                  <div className="flex gap-2"><span className="text-[#650CD4] font-bold shrink-0">1.</span><span>Tweet about {ticker} — mention the name or link to xrpl.to</span></div>
                  <div className="flex gap-2"><span className="text-[#650CD4] font-bold shrink-0">2.</span><span>Paste your tweet URL and hit verify</span></div>
                  <div className="flex gap-2"><span className="text-[#650CD4] font-bold shrink-0">3.</span><span>Claim your token reward — each promoter gets <span className="font-semibold text-[#650CD4]">{sharePct}%</span> of total supply</span></div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className={cn('rounded-lg px-2 py-1.5 text-center', isDark ? 'bg-white/[0.04]' : 'bg-white/80')}>
                    <div className={cn('text-[12px] font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                      {Number(perUser).toLocaleString()}
                    </div>
                    <div className={cn('text-[9px] uppercase tracking-wide', isDark ? 'text-white/30' : 'text-gray-400')}>
                      Per user
                    </div>
                  </div>
                  <div className={cn('rounded-lg px-2 py-1.5 text-center', isDark ? 'bg-white/[0.04]' : 'bg-white/80')}>
                    <div className="text-[12px] font-bold text-[#650CD4]">
                      {sharePct}%
                    </div>
                    <div className={cn('text-[9px] uppercase tracking-wide', isDark ? 'text-white/30' : 'text-gray-400')}>
                      Your share
                    </div>
                  </div>
                  <div className={cn('rounded-lg px-2 py-1.5 text-center', isDark ? 'bg-white/[0.04]' : 'bg-white/80')}>
                    <div className={cn('text-[12px] font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                      {Number(remaining.toFixed(0)).toLocaleString()}
                    </div>
                    <div className={cn('text-[9px] uppercase tracking-wide', isDark ? 'text-white/30' : 'text-gray-400')}>
                      Remaining
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn('text-[10px]', isDark ? 'text-white/40' : 'text-gray-400')}>
                      {claimed} of {max} promoters claimed
                    </span>
                    <span className={cn('text-[10px] font-medium', isDark ? 'text-white/50' : 'text-gray-500')}>
                      {max - claimed} slots left
                    </span>
                  </div>
                  <div className={cn('h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/[0.06]' : 'bg-gray-200')}>
                    <div
                      className="h-full rounded-full bg-[#650CD4] transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                <p className={cn('text-[10px]', isDark ? 'text-white/25' : 'text-gray-400')}>
                  3% of supply split across {max} promoters. Trustline required to claim.
                </p>
              </div>
            );
          })()}

          {/* Ineligible notice */}
          {!eligible && (
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]',
              isDark ? 'bg-white/[0.04] text-white/40' : 'bg-gray-50 text-gray-500'
            )}>
              <Info size={12} className="shrink-0" />
              This token needs at least {MIN_TRUSTLINES.toLocaleString()} trustlines to be eligible for promotion. Currently {tokenTrustlines.toLocaleString()}.
            </div>
          )}

          {/* Verify input */}
          <div className={cn('flex gap-2', !eligible && 'opacity-40 pointer-events-none')}>
            <input
              type="text"
              value={tweetUrl}
              onChange={(e) => {
                setTweetUrl(e.target.value);
                setVerifyStatus(null);
                setVerifyMessage('');
              }}
              placeholder="Paste your tweet URL..."
              disabled={!eligible}
              className={cn(
                'flex-1 px-3 py-2 rounded-lg text-[12px] border outline-none transition-colors',
                isDark
                  ? 'bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 focus:border-white/20'
                  : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-gray-300'
              )}
            />
            <button
              onClick={handleVerify}
              disabled={!eligible || verifying || !tweetUrl.trim()}
              className={cn(
                'px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors flex items-center gap-1.5',
                verifying || !tweetUrl.trim()
                  ? isDark
                    ? 'bg-white/5 text-white/30 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#137DFE] text-white hover:bg-[#137DFE]/90'
              )}
            >
              {verifying ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              Verify
            </button>
          </div>

          {/* Status message */}
          {verifyStatus && (
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]',
                verifyStatus === 'success'
                  ? isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'
                  : isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'
              )}
            >
              {verifyStatus === 'success' ? <Check size={12} /> : <AlertCircle size={12} />}
              {verifyMessage}
            </div>
          )}

          {/* Claim button — shown for earned or failed (retry) */}
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

          {/* Failed reason */}
          {rewardInfo?.exists && rewardInfo.status === 'failed' && rewardInfo.failReason && !claimResult && (
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]',
              isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'
            )}>
              <AlertCircle size={12} />
              Previous claim failed: {rewardInfo.failReason}
            </div>
          )}

          {/* Claim result */}
          {claimResult && (
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]',
              claimResult.success
                ? isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'
                : isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'
            )}>
              {claimResult.success ? <Check size={12} /> : <AlertCircle size={12} />}
              {claimResult.success
                ? `Claimed ${claimResult.amount} tokens! Tx: ${claimResult.txHash?.slice(0, 8)}...${claimResult.txHash?.slice(-6)}`
                : claimResult.error
              }
            </div>
          )}

          {/* Already claimed indicator */}
          {rewardInfo?.exists && rewardInfo.status === 'claimed' && !claimResult && (
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]',
              isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'
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
                isDark ? 'border-white/[0.06]' : 'border-gray-100'
              )}
            >
              <span
                className={cn(
                  'text-[10px] font-semibold uppercase tracking-wider',
                  isDark ? 'text-white/40' : 'text-gray-400'
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
                        isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn('text-[10px] font-mono w-4 text-right flex-shrink-0', isDark ? 'text-white/30' : 'text-gray-300')}>
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
                          <div className={cn('w-5 h-5 rounded-full flex-shrink-0', isDark ? 'bg-white/10' : 'bg-gray-200')} />
                        )}
                        {promoter.tier && <TierIcon tierId={promoter.tier.id} size={11} />}
                        <span className={cn('text-[11px] font-medium truncate', isDark ? 'text-white/60' : 'text-gray-600')}>
                          @{username || promoter.account?.slice(0, 8) + '...'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={cn('text-[9px] font-mono', isDark ? 'text-white/25' : 'text-gray-300')}>
                          {promoter.totalVerified}
                        </span>
                        {promoter.rewardStatus === 'claimed' && (
                          <Check size={10} className="text-[#08AA09]" />
                        )}
                        <ExternalLink
                          size={10}
                          className={cn(
                            'opacity-0 group-hover:opacity-100 transition-opacity',
                            isDark ? 'text-white/40' : 'text-gray-400'
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
              isDark ? 'border-white/[0.06]' : 'border-gray-100'
            )}>
              <span className={cn('text-[10px] font-semibold uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>
                Your Stats
              </span>
              <div className="flex items-center gap-3">
                {profileStats.tier && (
                  <div className="flex items-center gap-1.5">
                    <TierIcon tierId={profileStats.tier.id} size={14} />
                    <span className={cn('text-[12px] font-semibold', isDark ? 'text-white/80' : 'text-gray-700')}>
                      {profileStats.tier.name}
                    </span>
                  </div>
                )}
                <div className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-gray-400')}>
                  {profileStats.totalVerified} tweet{profileStats.totalVerified !== 1 ? 's' : ''} verified
                </div>
                {profileStats.claimedRewards > 0 && (
                  <div className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-gray-400')}>
                    {profileStats.claimedRewards} claimed
                  </div>
                )}
              </div>
              {profileStats.nextTier && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={cn('text-[10px]', isDark ? 'text-white/30' : 'text-gray-400')}>
                      {profileStats.nextTier.tweetsNeeded} more to {profileStats.nextTier.name}
                    </span>
                    <span className={cn('text-[10px] font-mono', isDark ? 'text-white/25' : 'text-gray-300')}>
                      {profileStats.totalVerified}/{profileStats.nextTier.min}
                    </span>
                  </div>
                  <div className={cn('h-1 rounded-full overflow-hidden', isDark ? 'bg-white/[0.06]' : 'bg-gray-200')}>
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
                        isDark ? 'bg-white/[0.06] text-white/50' : 'bg-gray-100 text-gray-500'
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
        <XSocialIcon size={12} /> Promote
        {tweetCount > 0 && (
          <span className={cn(
            'ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold',
            isDark ? 'bg-white/10 text-white/60' : 'bg-black/[0.06] text-gray-500'
          )}>
            {tweetCount}
          </span>
        )}
      </button>
      {modal}
    </div>
  );
}
