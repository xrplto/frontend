import { apiFetch, submitTransaction } from 'src/utils/api';
import { useRef, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { useRouter } from 'next/router';

import Link from 'next/link';
// xrpl imported dynamically to avoid 68KB bundle on every page
const getXrpl = () => import('xrpl');

// Development logging helper — devLog/devError are no-ops in production.
// Remaining console.warn/error calls in catch blocks are intentional: they log non-sensitive
// error messages (not state or secrets) for production debugging. An attacker with devtools
// already has full JS access, so suppressing these adds no security value.
const isDev = process.env.NODE_ENV === 'development';
const devLog = () => {};
const devError = () => {};

// Icons
import {
  Eye,
  EyeOff,
  Lock,
  Shield,
  X as XIcon,
  ChevronDown,
  Copy,
  QrCode,
  Download,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle,
  Info,
  Check,
  AlertTriangle,
  Send,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Loader2,
  ExternalLink,
  RefreshCw,
  ChevronRight,
  Camera,
  SwitchCamera,
  WifiOff,
  LogOut,
  Wallet2
} from 'lucide-react';

// Context
import { ThemeContext, WalletContext, WalletUIContext, AppContext } from 'src/context/AppContext';

// Translation removed - not using i18n

// Utils

import { getHashIcon } from 'src/utils/formatters';
import { EncryptedWalletStorage, securityUtils, deviceFingerprint } from 'src/utils/encryptedWalletStorage';
import { cn } from 'src/utils/cn';
import { alpha } from 'src/utils/formatters';
import dynamic from 'next/dynamic';
const QRCode = dynamic(() => import('react-qr-code'), { ssr: false });

// Generate random wallet with true random entropy
const generateRandomWallet = async () => {
  const { Wallet: XRPLWallet } = await getXrpl();
  const entropy = crypto.getRandomValues(new Uint8Array(32));
  return XRPLWallet.fromEntropy(Array.from(entropy));
};

// XRPL Seed validation and algorithm detection
const BASE58_ALPHABET = 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz';
const validateSeed = (seed) => {
  const trimmed = seed.trim();
  if (!trimmed) return { valid: false, error: '' };
  if (!trimmed.startsWith('s')) return { valid: false, error: 'Seed must start with "s"' };
  if (trimmed.length < 20 || trimmed.length > 35)
    return { valid: false, error: 'Invalid seed length' };
  const invalidChar = [...trimmed].find((c) => !BASE58_ALPHABET.includes(c));
  if (invalidChar) return { valid: false, error: `Invalid character "${invalidChar}"` };
  return { valid: true, error: '' };
};
const getAlgorithmFromSeed = (seed) => (seed.startsWith('sEd') ? 'ed25519' : 'secp256k1');

// Note: Removed signature entropy functions - no longer deriving wallets from WebAuthn signatures
// WebAuthn is now used only for authentication, not key derivation (2025 security standard)

// const pair = {
//   '534F4C4F00000000000000000000000000000000': 'SOLO',
//   XRP: 'XRP'
// };

// Removed PinField component - now using password for all authentication methods

// ============================================
// MUI Replacement Components (Tailwind-based)
// ============================================

// Dialog component - Enhanced with smooth animations and mobile support
const Dialog = ({ open, onClose, children, maxWidth, fullWidth, sx, ...props }) => {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile on mount and resize
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      // Small delay to trigger CSS transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      // Prevent body scroll on mobile when open
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 200);
      document.body.style.overflow = '';
      // Reset iOS Safari auto-zoom caused by input focus
      const vp = document.querySelector('meta[name="viewport"]');
      if (vp) {
        const orig = vp.getAttribute('content');
        vp.setAttribute('content', orig.replace(/maximum-scale=[^,]*/, 'maximum-scale=1.0'));
        setTimeout(() => vp.setAttribute('content', orig), 100);
      }
      return () => clearTimeout(timer);
    }
  }, [open, isMobile]);

  if (!shouldRender) return null;

  // Mobile: Centered modal with symmetric margins
  if (isMobile) {
    return (
      <div
        className={cn(
          'fixed inset-0 z-[9999] flex items-start justify-center pt-16 px-4 transition-opacity duration-200 backdrop-blur-md max-sm:h-dvh',
          isVisible ? 'opacity-100' : 'opacity-0',
          isDark ? 'bg-black/70' : 'bg-white/60'
        )}
        onClick={onClose}
      >
        <div
          className={cn(
            'relative w-full max-w-[400px] max-h-[80dvh] overflow-hidden transition-all duration-200 ease-out',
            isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    );
  }

  // Desktop: Top-right dropdown style
  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex items-start justify-end transition-opacity duration-200 max-sm:h-dvh',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
      onClick={onClose}
    >
      {/* Invisible click-away area (no blur, no background) */}
      <div className="absolute inset-0" />
      <div
        className={cn(
          'relative mt-[62px] mr-3 w-[380px] max-w-[380px] transition-all duration-200 ease-out',
          isVisible
            ? 'translate-y-0 opacity-100 scale-100'
            : '-translate-y-2 opacity-0 scale-[0.98]'
        )}
        onClick={(e) => e.stopPropagation()}
        style={sx?.['& .MuiDialog-paper'] || {}}
      >
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children, sx }) => (
  <div className={sx?.p === 0 ? 'p-0' : 'p-4'}>{children}</div>
);

// StyledPopoverPaper component - Clean styling with mobile support
const StyledPopoverPaper = ({ children, isDark, isMobile }) => (
  <div
    className={cn(
      'overflow-hidden max-h-[80dvh] overflow-y-auto rounded-2xl border',
      isDark
        ? 'bg-black border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.6)]'
        : 'bg-white border-gray-200/80 shadow-[0_8px_24px_rgba(0,0,0,0.08)]'
    )}
  >
    {children}
  </div>
);

// Box component
const Box = ({ children, component, sx, onClick, className, ...props }) => {
  const Component = component || 'div';
  const style = sx ? convertSxToStyle(sx) : {};
  return (
    <Component style={style} onClick={onClick} className={className} {...props}>
      {children}
    </Component>
  );
};

// Stack component
const Stack = ({
  children,
  direction = 'column',
  spacing = 0,
  alignItems,
  justifyContent,
  sx,
  ...props
}) => {
  const style = {
    display: 'flex',
    flexDirection: direction === 'row' ? 'row' : 'column',
    gap: spacing * 8,
    alignItems,
    justifyContent,
    ...convertSxToStyle(sx || {})
  };
  return (
    <div style={style} {...props}>
      {children}
    </div>
  );
};

// Typography component
const Typography = ({ children, variant, sx, onClick, ...props }) => {
  const style = convertSxToStyle(sx || {});
  return (
    <span style={style} onClick={onClick} {...props}>
      {children}
    </span>
  );
};

// Button component
const Button = ({
  children,
  variant = 'text',
  size,
  fullWidth,
  disabled,
  onClick,
  sx,
  startIcon,
  ...props
}) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: size === 'small' ? '4px 10px' : '8px 16px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 400,
    cursor: disabled ? 'not-allowed' : 'pointer',
    width: fullWidth ? '100%' : 'auto',
    border: variant === 'outlined' ? '1.5px solid rgba(156,163,175,0.3)' : 'none',
    background: variant === 'contained' ? (disabled ? '#94a3b8' : '#4285f4') : 'transparent',
    color: variant === 'contained' ? '#fff' : '#4285f4',
    opacity: disabled && variant !== 'contained' ? 0.5 : 1,
    ...convertSxToStyle(sx || {})
  };
  return (
    <button style={baseStyle} disabled={disabled} onClick={onClick} {...props}>
      {startIcon}
      {children}
    </button>
  );
};

// TextField component
const TextField = ({
  label,
  placeholder,
  value,
  onChange,
  onKeyDown,
  onKeyPress,
  type = 'text',
  fullWidth,
  disabled,
  autoFocus,
  autoComplete,
  multiline,
  rows,
  size,
  helperText,
  error,
  InputProps,
  inputProps,
  sx,
  FormHelperTextProps,
  isDark = true,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const inputStyle = {
    width: fullWidth ? '100%' : 'auto',
    padding: size === 'small' ? '8px 12px' : '12px 14px',
    fontSize: 16,
    borderRadius: 12,
    border: isDark ? '1.5px solid rgba(156,163,175,0.25)' : '1.5px solid rgba(156,163,175,0.4)',
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(249,250,251,1)',
    color: isDark ? '#fff' : '#000',
    outline: 'none',
    fontFamily: inputProps?.style?.fontFamily || 'inherit',
    ...convertSxToStyle(sx?.['& .MuiInputBase-input'] || {})
  };
  return (
    <div className={fullWidth ? 'w-full' : 'w-auto'}>
      {label && (
        <label className="block mb-1 text-xs opacity-70">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {multiline ? (
          <textarea
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onKeyPress={onKeyPress}
            disabled={disabled}
            autoFocus={autoFocus}
            autoComplete={autoComplete}
            rows={rows}
            style={inputStyle}
            {...inputProps}
          />
        ) : (
          <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onKeyPress={onKeyPress}
            disabled={disabled}
            autoFocus={autoFocus}
            autoComplete={autoComplete}
            style={{ ...inputStyle, paddingRight: InputProps?.endAdornment ? 40 : 12 }}
            {...inputProps}
          />
        )}
        {InputProps?.endAdornment && (
          <div className="absolute right-2">{InputProps.endAdornment}</div>
        )}
      </div>
      {helperText && (
        <div className="mt-1 text-[11px] opacity-70" {...FormHelperTextProps}>
          {helperText}
        </div>
      )}
    </div>
  );
};

// Alert component
const Alert = ({ children, severity = 'info', icon, onClose, sx }) => {
  const colors = {
    error: { bg: 'rgba(244,67,54,0.1)', border: '#f44336', icon: <AlertTriangle size={16} /> },
    warning: { bg: 'rgba(255,152,0,0.1)', border: '#ff9800', icon: <AlertTriangle size={16} /> },
    info: { bg: 'rgba(33,150,243,0.1)', border: '#2196f3', icon: <Info size={16} /> },
    success: { bg: 'rgba(76,175,80,0.1)', border: '#4caf50', icon: <Check size={16} /> }
  };
  const c = colors[severity];
  return (
    <div
      className="px-4 py-3 rounded-lg flex items-start gap-2 border-l-[3px]"
      style={{
        background: c.bg,
        borderLeftColor: c.border,
        ...convertSxToStyle(sx || {})
      }}
    >
      {icon !== false && <span className="flex" style={{ color: c.border }}>{icon || c.icon}</span>}
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="bg-transparent border-none cursor-pointer opacity-70"
        >
          <XIcon size={14} />
        </button>
      )}
    </div>
  );
};

// IconButton component
const IconButton = ({ children, onClick, size, disabled, edge, sx, ...props }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'bg-transparent border-none rounded-full flex items-center justify-center',
      size === 'small' ? 'p-1' : 'p-2',
      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer opacity-100'
    )}
    style={convertSxToStyle(sx || {})}
    {...props}
  >
    {children}
  </button>
);

// InputAdornment component
const InputAdornment = ({ children, position }) => (
  <div className="flex items-center">{children}</div>
);

// FormControlLabel component
const FormControlLabel = ({ control, label }) => (
  <label className="flex items-start gap-2 cursor-pointer">
    {control}
    {label}
  </label>
);

// Checkbox component
const Checkbox = ({ checked, onChange, size }) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={onChange}
    className={cn(
      'cursor-pointer',
      size === 'small' ? 'w-3.5 h-3.5' : 'w-[18px] h-[18px]'
    )}
  />
);

// Visibility icons (replacing MUI icons)
const Visibility = () => <Eye size={18} />;
const VisibilityOff = () => <EyeOff size={18} />;

// Helper to convert MUI sx prop to inline styles
const convertSxToStyle = (sx) => {
  if (!sx) return {};
  const style = {};
  Object.entries(sx).forEach(([key, value]) => {
    if (key.startsWith('&') || key.startsWith('.')) return; // Skip pseudo-selectors
    if (typeof value === 'number') {
      // Convert spacing values (multiply by 8)
      if (
        [
          'p',
          'px',
          'py',
          'pt',
          'pb',
          'pl',
          'pr',
          'm',
          'mx',
          'my',
          'mt',
          'mb',
          'ml',
          'mr',
          'gap'
        ].includes(key)
      ) {
        const pixels = value * 8;
        if (key === 'p') {
          style.padding = pixels;
        } else if (key === 'px') {
          style.paddingLeft = pixels;
          style.paddingRight = pixels;
        } else if (key === 'py') {
          style.paddingTop = pixels;
          style.paddingBottom = pixels;
        } else if (key === 'pt') {
          style.paddingTop = pixels;
        } else if (key === 'pb') {
          style.paddingBottom = pixels;
        } else if (key === 'pl') {
          style.paddingLeft = pixels;
        } else if (key === 'pr') {
          style.paddingRight = pixels;
        } else if (key === 'm') {
          style.margin = pixels;
        } else if (key === 'mx') {
          style.marginLeft = pixels;
          style.marginRight = pixels;
        } else if (key === 'my') {
          style.marginTop = pixels;
          style.marginBottom = pixels;
        } else if (key === 'mt') {
          style.marginTop = pixels;
        } else if (key === 'mb') {
          style.marginBottom = pixels;
        } else if (key === 'ml') {
          style.marginLeft = pixels;
        } else if (key === 'mr') {
          style.marginRight = pixels;
        } else if (key === 'gap') {
          style.gap = pixels;
        }
      } else {
        style[key] = value;
      }
    } else {
      style[key] = value;
    }
  });
  return style;
};

// Converted styled components to regular components with Tailwind

// function truncate(str, n) {
//   if (!str) return '';
//   //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
//   return str.length > n ? str.substr(0, n - 1) + ' ...' : str;
// }

function truncateAccount(str, length = 9) {
  if (!str) return '';
  return str.slice(0, length) + '...' + str.slice(length * -1);
}

// Format XRP balance for display
function formatXrpBalance(value, opts = {}) {
  const num = parseFloat(value);
  if (isNaN(num)) return '0';

  const { compact = false } = opts;

  // Large amounts: no decimals, with separators
  if (num >= 10000) {
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  // Medium amounts: 2 decimals
  if (num >= 1) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  // Small amounts: up to 6 decimals, trim trailing zeros
  if (num > 0) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  }
  return '0';
}

// Shared component for consistent wallet content across both modes
const WalletContent = ({
  theme,
  isDark,
  accountLogin,
  accountBalance,
  accountTotalXrp,
  accountsActivation,
  profiles,
  onClose,
  onAccountSwitch,
  onLogout,
  onRemoveProfile,
  onBackupSeed,
  openSnackbar,
  isEmbedded = false,
  accountProfile,
  showSeedDialog,
  seedAuthStatus,
  seedPassword,
  setSeedPassword,
  showSeedPassword,
  setShowSeedPassword,
  handleSeedPasswordSubmit,
  setShowSeedDialog,
  setSeedAuthStatus,
  onCreateNewAccount,
  walletPage,
  setWalletPage,
  walletsPerPage,
  walletStorage,
  // Bridge props
  showBridgeInDropdown,
  setShowBridgeInDropdown,
  currencies,
  selectedCurrency,
  setSelectedCurrency,
  bridgeAmount,
  setBridgeAmount,
  bridgeLoading,
  bridgeData,
  setBridgeData,
  bridgeError,
  bridgeAddressCopied,
  setBridgeAddressCopied,
  estimatedXrp,
  minAmount,
  showCurrencyDropdown,
  setShowCurrencyDropdown,
  currencySearch,
  setCurrencySearch,
  handleCreateBridge,
  initBridgeForm,
  swapDirection,
  setSwapDirection,
  destAddress,
  setDestAddress,
  // QR Sync props
  onQrSyncExport,
  onQrSyncImport
}) => {
  const needsBackup =
    typeof window !== 'undefined' && localStorage.getItem(`wallet_needs_backup_${accountLogin}`);
  const avatarCache = useRef(null);
  if (avatarCache.current === null && typeof window !== 'undefined') {
    try { avatarCache.current = JSON.parse(localStorage.getItem('__user_avatars__') || '{}'); } catch { avatarCache.current = {}; }
  }
  const [showAllAccounts, setShowAllAccounts] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Send state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [destinationTag, setDestinationTag] = useState('');
  const [sendPassword, setSendPassword] = useState('');
  const [showSendPassword, setShowSendPassword] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [txResult, setTxResult] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  // Security: password in ref (not state) — invisible to React DevTools
  const storedPasswordRef = useRef(null);

  // Security: clear sensitive state on tab hide + 5min inactivity auto-lock (audit)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const clearSensitive = () => {
      storedPasswordRef.current = null;
      setIsUnlocked(false);
      setSendPassword('');
    };
    const handleVisibility = () => { if (document.hidden) clearSensitive(); };
    // Inactivity auto-lock: re-lock wallet after 5 min of no interaction
    let idleTimer = null;
    const resetIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(clearSensitive, 5 * 60 * 1000);
    };
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((e) => document.addEventListener(e, resetIdle, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibility);
    resetIdle();
    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      events.forEach((e) => document.removeEventListener(e, resetIdle));
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const handleCopyAddress = () => {
    if (accountLogin) {
      navigator.clipboard.writeText(accountLogin);
      setAddressCopied(true);
      openSnackbar('Address copied', 'success');
      setTimeout(() => setAddressCopied(false), 2000);
    }
  };

  // Check unlock status
  useEffect(() => {
    const checkUnlock = async () => {
      if (!accountProfile?.provider || !accountProfile?.provider_id || !walletStorage) return;
      try {
        const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
        const pwd = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);
        if (pwd) {
          const walletData = await walletStorage.getWalletByAddress(accountLogin, pwd);
          if (walletData?.seed) {
            storedPasswordRef.current = pwd;
            setIsUnlocked(true);
          }
        }
      } catch (err) {
        /* ignore */
      }
    };
    checkUnlock();
  }, [accountProfile, accountLogin, walletStorage]);


  const availableBalance = parseFloat(accountBalance?.curr1?.value || '0');
  const maxSendable = Math.max(0, availableBalance - 10.000012);

  const validateSend = () => {
    if (!recipient) return 'Enter recipient address';
    if (!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(recipient)) return 'Invalid XRPL address';
    if (recipient === accountLogin) return 'Cannot send to yourself';
    if (!amount || parseFloat(amount) <= 0) return 'Enter amount';
    if (parseFloat(amount) > maxSendable) return 'Insufficient balance';
    if (!isUnlocked && !sendPassword) return 'Enter password';
    return null;
  };

  const handleSend = async () => {
    const error = validateSend();
    if (error) {
      setSendError(error);
      return;
    }

    setIsSending(true);
    setSendError('');
    setTxResult(null);

    try {
      const pwdToUse = isUnlocked && storedPasswordRef.current ? storedPasswordRef.current : sendPassword;
      let wallet;
      if (accountProfile?.wallet_type === 'oauth') {
        const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
        wallet = await walletStorage.findWalletBySocialId(walletId, pwdToUse, accountLogin);
      } else {
        wallet = await walletStorage.getWalletByAddress(accountLogin, pwdToUse);
      }

      if (!wallet?.seed) throw new Error('Incorrect password');

      const { Wallet: XRPLWallet, xrpToDrops } = await getXrpl();
      const payment = {
        TransactionType: 'Payment',
        Account: accountLogin,
        Destination: recipient,
        Amount: xrpToDrops(amount),
        SourceTag: 161803
      };
      if (destinationTag) payment.DestinationTag = parseInt(destinationTag);

      const algorithm = wallet.seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';
      const xrplWallet = XRPLWallet.fromSeed(wallet.seed, { algorithm });
      // Best-effort memory zeroing (audit: clear sensitive data post-use)
      wallet.seed = '';
      wallet.privateKey = '';

      const result = await submitTransaction(xrplWallet, payment);

      if (result.success) {
        setTxResult({ success: true, hash: result.hash, amount, recipient });
        openSnackbar('Transaction successful', 'success');
        setRecipient('');
        setAmount('');
        setDestinationTag('');
        if (!isUnlocked) setSendPassword('');
      } else {
        throw new Error(result.engine_result);
      }
    } catch (err) {
      setSendError(err.message || 'Transaction failed');
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  const truncAddr = (addr, len = 6) => (addr ? `${addr.slice(0, len)}...${addr.slice(-4)}` : '');

  // ============================================
  // COMPACT DROPDOWN MODE
  // ============================================

  // Bridge form view for logged-in users
  if (showBridgeInDropdown) {
    return (
      <div className={isDark ? 'text-white' : 'text-gray-900'}>
        {/* Header - symmetric 3-column layout */}
        <div
          className={cn(
            'px-4 py-3 grid grid-cols-[auto_1fr_auto] items-center gap-4',
            isDark ? 'border-b border-white/[0.06]' : 'border-b border-gray-100'
          )}
        >
          <button
            onClick={() => {
              setShowBridgeInDropdown(false);
              setBridgeData(null);
            }}
            className={cn(
              'flex items-center gap-1.5 text-[12px] font-medium px-2 py-1.5 -ml-2 rounded-lg transition-colors',
              isDark ? 'text-white/60 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            )}
          >
            <ChevronDown size={16} className="rotate-90" />
            Back
          </button>
          <span className={cn('text-[13px] font-medium text-center', isDark ? 'text-white' : 'text-gray-900')}>
            Bridge
          </span>
          <button
            onClick={onClose}
            className={cn(
              'p-2 rounded-xl transition-colors',
              isDark
                ? 'hover:bg-white/5 text-white/40 hover:text-white/60'
                : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
            )}
          >
            <XIcon size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {bridgeData ? (
            // Bridge created - show deposit address
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2.5 py-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <Check size={16} className="text-emerald-500" />
                </div>
                <span
                  className={cn('text-[13px] font-medium', isDark ? 'text-white' : 'text-gray-900')}
                >
                  Exchange Created
                </span>
              </div>

              <div
                className={cn(
                  'rounded-xl border p-4',
                  isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-gray-100 bg-gray-50'
                )}
              >
                <div className={cn('flex items-center justify-center gap-2.5 mb-3 pb-3 border-b', isDark ? 'border-white/[0.06]' : 'border-[#e5e7eb]')}>
                  {bridgeData.swapDirection === 'fromXrp' ? (
                    <>
                      <span
                        className={cn('text-[12px] font-medium', isDark ? 'text-white/70' : 'text-gray-700')}
                      >
                        {bridgeAmount} XRP
                      </span>
                      <ArrowLeftRight
                        size={14}
                        className={isDark ? 'text-white/30' : 'text-gray-400'}
                      />
                      {selectedCurrency?.image && (
                        <img src={selectedCurrency.image} alt="" className="w-5 h-5 rounded-full" />
                      )}
                      <span className="text-[12px] text-emerald-500 font-medium">
                        ~{bridgeData.expectedAmountTo || estimatedXrp || '?'}{' '}
                        {selectedCurrency?.ticker?.toUpperCase()}
                      </span>
                    </>
                  ) : (
                    <>
                      {selectedCurrency?.image && (
                        <img src={selectedCurrency.image} alt="" className="w-5 h-5 rounded-full" />
                      )}
                      <span
                        className={cn('text-[12px] font-medium', isDark ? 'text-white/70' : 'text-gray-700')}
                      >
                        {bridgeAmount} {selectedCurrency?.ticker?.toUpperCase()}
                      </span>
                      <ArrowLeftRight
                        size={14}
                        className={isDark ? 'text-white/30' : 'text-gray-400'}
                      />
                      <span className="text-[12px] text-emerald-500 font-medium">
                        ~{bridgeData.expectedAmountTo || estimatedXrp || '?'} XRP
                      </span>
                    </>
                  )}
                </div>

                <p
                  className={cn(
                    'text-[10px] uppercase tracking-wide mb-2',
                    isDark ? 'text-white/40' : 'text-gray-500'
                  )}
                >
                  Deposit Address
                </p>
                <div
                  className={cn(
                    'rounded-xl border p-3',
                    isDark ? 'border-white/[0.08] bg-black/30' : 'border-gray-200 bg-white'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <code
                      className={cn(
                        'text-[11px] font-mono break-all flex-1 leading-relaxed',
                        isDark ? 'text-white/90' : 'text-gray-900'
                      )}
                    >
                      {bridgeData.payinAddress}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(bridgeData.payinAddress);
                        setBridgeAddressCopied(true);
                        setTimeout(() => setBridgeAddressCopied(false), 2000);
                      }}
                      className={cn(
                        'flex-shrink-0 p-2 rounded-xl transition-colors',
                        bridgeAddressCopied
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : isDark
                            ? 'bg-white/10 text-white/60 hover:bg-white/15'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {bridgeAddressCopied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => window.open(`/bridge/${bridgeData.id}`, '_blank')}
                  className="w-full py-3 rounded-xl text-[13px] font-medium bg-primary text-white hover:bg-primary/90 flex items-center justify-center gap-2 transition-all"
                >
                  <ExternalLink size={16} />
                  Track Exchange
                </button>
                <button
                  onClick={() => {
                    setShowBridgeInDropdown(false);
                    setBridgeData(null);
                  }}
                  className={cn(
                    'w-full py-2.5 rounded-xl text-[12px] font-medium transition-all',
                    isDark ? 'text-white/50 hover:text-white/70 hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  )}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            // Bridge form
            <>
              {/* Direction Toggle - symmetric tabs */}
              <div
                className={cn(
                  'flex gap-1 p-1.5 rounded-xl',
                  isDark ? 'bg-white/[0.03]' : 'bg-gray-100'
                )}
              >
                <button
                  onClick={() => {
                    setSwapDirection('toXrp');
                    setBridgeAmount('');
                    setDestAddress('');
                  }}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-[12px] font-medium transition-all',
                    swapDirection === 'toXrp'
                      ? 'bg-primary text-white shadow-sm'
                      : isDark
                        ? 'text-white/50 hover:text-white/70'
                        : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  Buy XRP
                </button>
                <button
                  onClick={() => {
                    setSwapDirection('fromXrp');
                    setBridgeAmount('');
                    setDestAddress('');
                  }}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-[12px] font-medium transition-all',
                    swapDirection === 'fromXrp'
                      ? 'bg-primary text-white shadow-sm'
                      : isDark
                        ? 'text-white/50 hover:text-white/70'
                        : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  Sell XRP
                </button>
              </div>

              {/* Currency Selector - symmetric card */}
              <div className="relative">
                <button
                  onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                  className={cn(
                    'w-full flex items-center justify-between p-3.5 rounded-xl border transition-all',
                    isDark
                      ? 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                      : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                  )}
                >
                  {selectedCurrency ? (
                    <div className="flex items-center gap-2.5">
                      {selectedCurrency.image && (
                        <img src={selectedCurrency.image} alt="" className="w-6 h-6 rounded-full" />
                      )}
                      <span
                        className={cn(
                          'text-[14px] font-medium',
                          isDark ? 'text-white' : 'text-gray-900'
                        )}
                      >
                        {selectedCurrency.ticker.toUpperCase()}
                      </span>
                    </div>
                  ) : (
                    <span className={cn('text-[14px]', isDark ? 'text-white/40' : 'text-gray-400')}>
                      {currencies.length ? 'Select currency' : 'Loading...'}
                    </span>
                  )}
                  <ChevronDown
                    size={18}
                    className={cn(
                      'transition-transform duration-200',
                      isDark ? 'text-white/40' : 'text-gray-400',
                      showCurrencyDropdown && 'rotate-180'
                    )}
                  />
                </button>

                {showCurrencyDropdown && (
                  <div
                    className={cn(
                      'absolute z-50 mt-1 w-full rounded-lg border shadow-lg max-h-[200px] overflow-hidden',
                      isDark ? 'border-white/10 bg-[#1a1a1a]' : 'border-gray-200 bg-white'
                    )}
                  >
                    <div
                      className={cn('p-2 border-b', isDark ? 'border-white/[0.06]' : 'border-[#e5e7eb]')}
                    >
                      <input
                        type="text"
                        value={currencySearch}
                        onChange={(e) => setCurrencySearch(e.target.value)}
                        placeholder="Search..."
                        autoFocus
                        className={cn(
                          'w-full px-2 py-1.5 rounded text-[12px] outline-none',
                          isDark
                            ? 'bg-white/5 text-white placeholder:text-white/30'
                            : 'bg-gray-50 text-gray-900 placeholder:text-gray-400'
                        )}
                      />
                    </div>
                    <div className="overflow-y-auto max-h-[200px]">
                      {(() => {
                        const filtered = currencies.filter(
                          (c) =>
                            !currencySearch ||
                            c.ticker.toLowerCase().includes(currencySearch.toLowerCase()) ||
                            c.name.toLowerCase().includes(currencySearch.toLowerCase())
                        );
                        const shown = filtered.slice(0, currencySearch ? 100 : 30);
                        return shown.length === 0 ? (
                          <div
                            className={cn(
                              'px-3 py-4 text-center text-[11px]',
                              isDark ? 'text-white/30' : 'text-gray-400'
                            )}
                          >
                            No results
                          </div>
                        ) : (
                          shown.map((c) => (
                            <button
                              key={`${c.ticker}-${c.network}`}
                              onClick={() => {
                                setSelectedCurrency(c);
                                setShowCurrencyDropdown(false);
                                setCurrencySearch('');
                              }}
                              className={cn(
                                'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
                                isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                              )}
                            >
                              {c.image && (
                                <img src={c.image} alt="" className="w-5 h-5 rounded-full" />
                              )}
                              <span
                                className={cn(
                                  'text-[12px] font-medium',
                                  isDark ? 'text-white' : 'text-gray-900'
                                )}
                              >
                                {c.ticker.toUpperCase()}
                              </span>
                              <span
                                className={cn(
                                  'text-[10px] flex-1',
                                  isDark ? 'text-white/30' : 'text-gray-400'
                                )}
                              >
                                {c.name}
                              </span>
                            </button>
                          ))
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Destination Address (for selling XRP) - symmetric card */}
              {swapDirection === 'fromXrp' && (
                <div
                  className={cn(
                    'rounded-xl border p-4',
                    isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-gray-100 bg-gray-50'
                  )}
                >
                  <label
                    className={cn(
                      'text-[10px] uppercase tracking-wide font-medium',
                      isDark ? 'text-white/40' : 'text-gray-500'
                    )}
                  >
                    {selectedCurrency?.ticker?.toUpperCase() || 'Destination'} Address
                  </label>
                  <input
                    type="text"
                    value={destAddress}
                    onChange={(e) => setDestAddress(e.target.value)}
                    placeholder={`Your ${selectedCurrency?.ticker?.toUpperCase() || ''} address`}
                    className={cn(
                      'w-full mt-2 bg-transparent text-[14px] outline-none',
                      isDark
                        ? 'text-white placeholder:text-white/20'
                        : 'text-gray-900 placeholder:text-gray-300'
                    )}
                  />
                </div>
              )}

              {/* Amount - symmetric card */}
              <div
                className={cn(
                  'rounded-xl border p-4',
                  isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-gray-100 bg-gray-50'
                )}
              >
                <label
                  className={cn(
                    'text-[10px] uppercase tracking-wide font-medium',
                    isDark ? 'text-white/40' : 'text-gray-500'
                  )}
                >
                  Amount
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="number"
                    value={bridgeAmount}
                    onChange={(e) => setBridgeAmount(e.target.value)}
                    placeholder={minAmount ? `Min: ${minAmount}` : '0.00'}
                    step="0.0001"
                    min="0"
                    className={cn(
                      'flex-1 bg-transparent text-[20px] font-semibold outline-none',
                      isDark
                        ? 'text-white placeholder:text-white/20'
                        : 'text-gray-900 placeholder:text-gray-300'
                    )}
                  />
                  <span
                    className={cn(
                      'text-[14px] font-medium px-3 py-1.5 rounded-lg',
                      isDark ? 'text-white/60 bg-white/[0.05]' : 'text-gray-600 bg-gray-100'
                    )}
                  >
                    {swapDirection === 'toXrp'
                      ? selectedCurrency?.ticker?.toUpperCase() || '---'
                      : 'XRP'}
                  </span>
                </div>
                {estimatedXrp && (
                  <div
                    className={cn('flex items-center justify-between mt-3 pt-3 border-t', isDark ? 'border-white/[0.06]' : 'border-[#e5e7eb]')}
                  >
                    <span className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-gray-500')}>
                      You'll receive
                    </span>
                    <span className="text-[14px] font-semibold text-emerald-500">
                      ~{estimatedXrp}{' '}
                      {swapDirection === 'toXrp' ? 'XRP' : selectedCurrency?.ticker?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {bridgeError && (
                <div className="p-3 rounded-xl text-[12px] bg-red-500/10 text-red-400 border border-red-500/20">
                  {bridgeError}
                </div>
              )}

              <button
                onClick={() => handleCreateBridge(accountLogin)}
                disabled={
                  bridgeLoading ||
                  !bridgeAmount ||
                  !selectedCurrency ||
                  !estimatedXrp ||
                  (swapDirection === 'fromXrp' && !destAddress)
                }
                className={cn(
                  'w-full py-3 rounded-xl text-[13px] font-medium transition-all flex items-center justify-center gap-2',
                  bridgeAmount &&
                    selectedCurrency &&
                    estimatedXrp &&
                    (swapDirection === 'toXrp' || destAddress)
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : isDark
                      ? 'bg-white/[0.05] text-white/30 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                {bridgeLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <ArrowLeftRight size={16} />
                    Create Exchange
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={isDark ? 'text-white' : 'text-gray-900'}>
      {/* Header - symmetric layout */}
      <div
        className={cn(
          'px-5 py-4 flex items-center justify-between',
          isDark ? 'border-b border-white/[0.08]' : 'border-b border-gray-100'
        )}
      >
        <button
          onClick={handleCopyAddress}
          className={cn(
            'group flex items-center gap-2.5 px-3 py-1.5 -ml-2 rounded-full transition-all duration-300',
            addressCopied ? 'bg-emerald-500/10' : isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-gray-100'
          )}
        >
          <div className="relative flex-shrink-0">
            {(() => {
              const masked = accountLogin ? `${accountLogin.slice(0, 6)}...${accountLogin.slice(-4)}` : null;
              const avatarUrl = masked ? (avatarCache.current || {})[masked] : null;
              return (
                <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-white/10">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : accountProfile?.logo ? (
                    <img src={`https://s1.xrpl.to/address/${accountProfile.logo}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <img src={getHashIcon(accountLogin)} alt="" className="w-full h-full" />
                  )}
                </div>
              );
            })()}
            <div
              className={cn(
                'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2',
                isDark ? 'border-[#1a1a2e]' : 'border-white',
                accountsActivation[accountLogin] === false && !parseFloat(accountBalance?.curr1?.value) ? 'bg-amber-400' : 'bg-emerald-500'
              )}
            />
          </div>
          <span
            className={cn(
              'font-mono text-xs font-medium tracking-wide transition-colors',
              addressCopied ? 'text-emerald-500' : isDark ? 'text-white/50 group-hover:text-white/80' : 'text-gray-500'
            )}
          >
            {truncateAccount(accountLogin, 6)}
          </span>
          <div className="transition-transform duration-300 group-hover:scale-110">
            {addressCopied ? (
              <Check size={14} className="text-emerald-500" />
            ) : (
              <Copy size={13} className={cn('transition-opacity', isDark ? 'text-white/30 group-hover:text-white/60' : 'text-gray-400')} />
            )}
          </div>
        </button>
        <button
          onClick={onClose}
          className={cn(
            'p-2 rounded-full transition-all duration-300 hover:rotate-90',
            isDark
              ? 'hover:bg-white/10 text-white/40 hover:text-white'
              : 'hover:bg-gray-100 text-gray-400 hover:text-gray-900'
          )}
        >
          <XIcon size={18} />
        </button>
      </div>

      {/* Balance - symmetric card layout */}
      <Link
        href="/wallet"
        className={cn(
          'block mx-4 mt-5 mb-4 p-5 rounded-2xl transition-all duration-300 group relative overflow-hidden hover:-translate-y-0.5',
          isDark
            ? 'bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent hover:from-white/[0.08] border border-white/[0.08] shadow-2xl hover:shadow-primary/5'
            : 'bg-white hover:bg-gray-50/80 border border-gray-100 shadow-sm hover:shadow-md'
        )}
      >
        {/* Decorative dot pattern */}
        <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.03] pointer-events-none">
          <div className="grid grid-cols-4 gap-2 p-3">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-current" />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between mb-3 relative">
          <div className="flex items-baseline gap-2.5">
            <span className="font-mono text-[32px] font-extrabold tracking-tighter leading-none">
              {accountBalance ? formatXrpBalance(accountBalance.curr1?.value) : '...'}
            </span>
            <span className={cn('text-[10px] font-extrabold tracking-[0.2em] uppercase', isDark ? 'text-white/30' : 'text-gray-300')}>XRP</span>
          </div>
          <div className={cn(
            'p-1.5 rounded-full transition-all duration-300 group-hover:translate-x-1',
            isDark ? 'bg-white/5 group-hover:bg-white/10' : 'bg-gray-100 group-hover:bg-gray-200'
          )}>
            <ChevronRight size={14} className={cn(isDark ? 'text-white/40' : 'text-gray-400')} />
          </div>
        </div>
        <div className="flex items-center gap-2 relative">
          <div className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold',
            isDark ? 'bg-white/[0.04] text-white/35' : 'bg-gray-100 text-gray-400'
          )}>
            <span className="w-1 h-1 rounded-full bg-primary/40" />
            {accountBalance ? formatXrpBalance(accountTotalXrp || Number(accountBalance.curr1?.value || 0) + Number(accountBalance.curr2?.value || 0)) : '...'} total
          </div>
          <div className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold',
            isDark ? 'bg-white/[0.04] text-white/35' : 'bg-gray-100 text-gray-400'
          )}>
            <span className="w-1 h-1 rounded-full bg-amber-400/40" />
            {accountBalance ? formatXrpBalance(accountBalance.curr2?.value) : '...'} reserved
          </div>
        </div>
      </Link>

      {/* Actions - symmetric 3-column grid */}
      <div className="px-4 pb-5">
        <div className="grid grid-cols-3 gap-3">
          <a
            href="/wallet?tab=send"
            className={cn(
              'flex flex-col items-center justify-center gap-2.5 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 active:scale-95',
              'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5'
            )}
          >
            <div className="p-2.5 rounded-xl bg-white/15">
              <ArrowUpRight size={18} strokeWidth={2.5} />
            </div>
            Send
          </a>
          <a
            href="/wallet?tab=receive"
            className={cn(
              'flex flex-col items-center justify-center gap-2.5 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 hover:-translate-y-0.5',
              isDark
                ? 'bg-white/[0.04] hover:bg-white/[0.07] text-white/80 border border-white/[0.08] hover:border-emerald-400/20'
                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-emerald-200'
            )}
          >
            <div className={cn('p-2.5 rounded-xl transition-colors duration-200', isDark ? 'bg-emerald-400/10' : 'bg-emerald-50')}>
              <ArrowDownLeft size={18} strokeWidth={2.5} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
            </div>
            Receive
          </a>
          <button
            onClick={() => {
              initBridgeForm();
              setShowBridgeInDropdown(true);
            }}
            className={cn(
              'flex flex-col items-center justify-center gap-2.5 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 hover:-translate-y-0.5',
              isDark
                ? 'bg-white/[0.04] hover:bg-white/[0.07] text-white/80 border border-white/[0.08] hover:border-purple-400/20'
                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-purple-200'
            )}
          >
            <div className={cn('p-2.5 rounded-xl transition-colors duration-200', isDark ? 'bg-purple-400/10' : 'bg-purple-50')}>
              <ArrowLeftRight size={18} strokeWidth={2.5} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
            </div>
            Bridge
          </button>
        </div>
      </div>

      {/* Accounts - unified section with inline actions */}
      <div
        className={cn(
          'mx-4 mb-4 rounded-2xl overflow-hidden transition-all duration-200',
          isDark
            ? 'bg-white/[0.02] border border-white/[0.08]'
            : 'bg-gray-50/80 border border-gray-200'
        )}
      >
        <button
          onClick={() => setShowAllAccounts(!showAllAccounts)}
          className={cn(
            'w-full px-4 py-3 flex items-center justify-between transition-all duration-200',
            isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-100'
          )}
        >
          <div className="flex items-center gap-2.5">
            <span className={cn('text-[11px] font-bold uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-500')}>
              Accounts
            </span>
            <span
              className={cn(
                'min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-[10px] font-bold',
                isDark ? 'bg-white/[0.06] text-white/40' : 'bg-gray-200/80 text-gray-500'
              )}
            >
              {profiles.length}
            </span>
          </div>
          <ChevronDown
            size={16}
            className={cn(
              'transition-transform duration-300 ease-out',
              showAllAccounts && 'rotate-180',
              isDark ? 'text-white/20' : 'text-gray-300'
            )}
          />
        </button>

        {showAllAccounts && (<>
          <div
            className={cn(
              'border-t max-h-[320px] overflow-y-auto',
              isDark ? 'border-white/[0.06]' : 'border-gray-100'
            )}
          >
            {(() => {
              const currentAccount = profiles.find((p) => p.account === accountLogin);
              const others = profiles.filter((p) => p.account !== accountLogin);
              const sorted = [...(currentAccount ? [currentAccount] : []), ...others];
              return sorted.map((profile) => {
                const isCurrent = profile.account === accountLogin;
                const isInactive = accountsActivation[profile.account] === false && !(isCurrent && parseFloat(accountBalance?.curr1?.value));
                const isDeleting = deleteConfirm === profile.account;
                return (
                  <div
                    key={profile.account}
                    className={cn(
                      'group relative w-full px-4 py-2.5 flex items-center gap-3 transition-all duration-200',
                      isCurrent
                        ? isDark
                          ? 'bg-primary/10 border-l-2 border-l-primary'
                          : 'bg-primary/5 border-l-2 border-l-primary'
                        : isDark
                          ? 'hover:bg-white/[0.03] border-l-2 border-l-transparent'
                          : 'hover:bg-gray-100/50 border-l-2 border-l-transparent'
                    )}
                  >
                    <button
                      onClick={() => !isCurrent && onAccountSwitch(profile.account)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      disabled={isCurrent}
                    >
                      {isCurrent ? (
                        <Check size={14} className="text-primary flex-shrink-0" />
                      ) : (
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full flex-shrink-0',
                            isInactive ? 'bg-amber-400/60' : 'bg-white/20'
                          )}
                        />
                      )}
                      <span
                        className={cn(
                          'font-mono text-[12px] flex-1 truncate',
                          isCurrent
                            ? isDark
                              ? 'text-white font-medium'
                              : 'text-gray-900 font-medium'
                            : isDark
                              ? 'text-white/60'
                              : 'text-gray-600'
                        )}
                      >
                        {truncateAccount(profile.account, 8)}
                      </span>
                      {isInactive && (
                        <span
                          className="text-[10px] font-medium text-amber-500 px-2 py-0.5 rounded-full bg-amber-500/10"
                          title="Fund with 1 XRP to activate"
                        >
                          Inactive
                        </span>
                      )}
                    </button>
                    {/* Inline actions - visible on hover or when confirming delete */}
                    <div className={cn(
                      'flex items-center gap-0.5 transition-opacity duration-200',
                      isDeleting ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    )}>
                      {isDeleting ? (
                        <div className="flex items-center gap-1.5 animate-in fade-in">
                          <button
                            onClick={() => {
                              onRemoveProfile(profile.account);
                              setDeleteConfirm(null);
                            }}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-red-500 hover:bg-red-600 text-white transition-colors duration-200"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors duration-200',
                              isDark ? 'bg-white/[0.06] text-white/50 hover:bg-white/10' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                            )}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => onBackupSeed(profile, true)}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors',
                              isDark
                                ? 'text-white/30 hover:text-amber-400 hover:bg-amber-500/10'
                                : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                            )}
                            title="Backup seed"
                          >
                            <Shield size={13} />
                          </button>
                          {!isCurrent && (
                            <button
                              onClick={() => setDeleteConfirm(profile.account)}
                              className={cn(
                                'p-1.5 rounded-lg transition-colors',
                                isDark
                                  ? 'text-white/30 hover:text-red-400 hover:bg-red-500/10'
                                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                              )}
                              title="Remove account"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
          {/* Quick actions row */}
          <div className={cn(
            'px-3 py-2.5 border-t flex items-center gap-1',
            isDark ? 'border-white/[0.06]' : 'border-gray-100'
          )}>
            <button
              onClick={onCreateNewAccount}
              disabled={!onCreateNewAccount || profiles.length >= 25}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200',
                !onCreateNewAccount || profiles.length >= 25 ? 'opacity-30 cursor-not-allowed' : '',
                isDark
                  ? 'text-white/40 hover:text-white hover:bg-white/[0.06]'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              )}
            >
              <Plus size={13} />
              Add
            </button>
            <div className={cn('w-px h-4 mx-0.5', isDark ? 'bg-white/[0.06]' : 'bg-gray-200')} />
            <button
              onClick={() => onQrSyncExport?.()}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200',
                isDark
                  ? 'text-white/40 hover:text-white hover:bg-white/[0.06]'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              )}
            >
              <QrCode size={13} />
              Export
            </button>
            <button
              onClick={() => onQrSyncImport?.()}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200',
                isDark
                  ? 'text-white/40 hover:text-white hover:bg-white/[0.06]'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              )}
            >
              <Download size={13} />
              Import
            </button>
          </div>
        </>)}
      </div>

      {/* Footer - logout */}
      <div className="mx-4 mb-4">
        <button
          onClick={onLogout}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-200 active:scale-[0.97]',
            isDark
              ? 'text-white/20 hover:text-red-400 hover:bg-red-500/[0.08]'
              : 'text-gray-300 hover:text-red-500 hover:bg-red-50'
          )}
        >
          <LogOut size={13} />
          <span>Disconnect</span>
        </button>
      </div>
    </div>
  );
};

// ConnectWallet button component for wallet connection
export const ConnectWallet = ({ text = 'Connect', fullWidth = true, ...otherProps }) => {
  const { themeName } = useContext(ThemeContext);
  const { setOpenWalletModal } = useContext(WalletContext);
  const isDark = themeName === 'XrplToDarkTheme';

  return (
    <button
      onClick={() => setOpenWalletModal(true)}
      className={cn(
        'group relative my-2 rounded-xl border-[1.5px] px-4 py-2 text-[0.9rem] font-medium transition-[border-color,background-color] duration-300 overflow-hidden',
        'before:absolute before:inset-0 before:rounded-[inherit] before:bg-[length:250%_250%,100%_100%] before:bg-[position:200%_0,0_0] before:bg-no-repeat before:transition-[background-position] before:duration-0 hover:before:bg-[position:-100%_0,0_0] hover:before:duration-[1500ms]',
        fullWidth ? 'w-full' : 'w-auto',
        isDark
          ? 'bg-[#0a0a12] text-white/70 border-white/20 hover:border-white/40 hover:text-white before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.15)_50%,transparent_75%,transparent_100%)]'
          : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100 hover:border-gray-400 before:bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.05)_50%,transparent_75%,transparent_100%)]'
      )}
      {...otherProps}
    >
      <span className="relative z-10">{text}</span>
    </button>
  );
};

export default function Wallet({ style, embedded = false, onClose, buttonOnly = false }) {
  const router = useRouter();
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';

  // Prevent wallet modal from rendering on auth pages
  const isAuthPage = router.pathname === '/callback' || router.pathname === '/wallet-setup';

  // Create a simple theme object to replace MUI's useTheme
  const theme = {
    palette: {
      divider: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.2)',
      success: { main: '#4caf50' },
      warning: { main: '#ff9800', dark: '#f57c00' },
      error: { main: '#f44336' },
      primary: { main: '#4285f4' },
      text: {
        primary: isDark ? '#fff' : '#000',
        secondary: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'
      },
      background: { default: isDark ? '#000000' : '#fff', paper: isDark ? '#070b12' : '#fff' },
      action: {
        hover: isDark ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.05)',
        disabled: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.26)'
      }
    },
    spacing: (...args) => args.map((v) => v * 8).join('px ') + 'px'
  };
  // Translation removed - using hardcoded English text

  // Cache avatars from localStorage once (avoid JSON.parse in render)
  const walletAvatarCache = useRef(null);
  if (walletAvatarCache.current === null && typeof window !== 'undefined') {
    try { walletAvatarCache.current = JSON.parse(localStorage.getItem('__user_avatars__') || '{}'); } catch { walletAvatarCache.current = {}; }
  }

  // Helper to sync profiles to localStorage (profiles are NOT stored in IndexedDB)
  const syncProfilesToIndexedDB = async (profilesArray) => {
    try {
      // Remove duplicates before storing
      const uniqueProfiles = [];
      const seen = new Set();

      profilesArray.forEach((profile) => {
        if (!seen.has(profile.account)) {
          seen.add(profile.account);
          uniqueProfiles.push(profile);
        }
      });

      // Store in localStorage (profiles array for UI state management)
      // Strip seeds — seeds only live in IndexedDB (encrypted) and React state (memory)
      if (typeof window !== 'undefined') {
        localStorage.setItem('profiles', JSON.stringify(uniqueProfiles.map(({ seed, ...safe }) => safe)));
      }
      // Note: Individual wallets are already encrypted in IndexedDB via storeWallet()
    } catch (error) {
      devError('Failed to sync profiles:', error);
    }
  };
  const anchorRef = useRef(null);
  const [showingSeed, setShowingSeed] = useState(false);
  const [currentSeed, setCurrentSeed] = useState('');
  const [seedBlurred, setSeedBlurred] = useState(true);
  const [showAllAccounts, setShowAllAccounts] = useState(false);
  const [accountsActivation, setAccountsActivation] = useState(() => {
    try {
      const cached = localStorage.getItem('accountsActivation');
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < 30 * 60 * 1000) return data;
      }
    } catch {}
    return {};
  });
  const [isCheckingActivation, setIsCheckingActivation] = useState(false);
  const [showSeedDialog, setShowSeedDialog] = useState(false);
  const [walletPage, setWalletPage] = useState(0);
  const walletsPerPage = 5;
  const [seedAuthStatus, setSeedAuthStatus] = useState('idle');
  const [displaySeed, setDisplaySeed] = useState('');
  const [seedPassword, setSeedPassword] = useState('');
  const [showSeedPassword, setShowSeedPassword] = useState(false);
  const [seedWarningAgreed, setSeedWarningAgreed] = useState(false);
  const [seedWarningText, setSeedWarningText] = useState('');
  const [backupMode, setBackupMode] = useState(null); // 'seed' or 'full'
  const [backupTargetProfile, setBackupTargetProfile] = useState(null); // profile to backup
  const walletStorage = useMemo(() => new EncryptedWalletStorage(), []);

  // Auto-clear seed from memory after 30s, on tab switch, and on unmount
  const [seedCountdown, setSeedCountdown] = useState(0);
  useEffect(() => {
    if (!displaySeed) { setSeedCountdown(0); return; }
    setSeedCountdown(30);
    const tick = setInterval(() => {
      setSeedCountdown((c) => {
        if (c <= 1) { setDisplaySeed(''); return 0; }
        return c - 1;
      });
    }, 1000);
    // Clear seed when user switches tabs or minimizes (audit: screen timeout enforcement)
    const onVisChange = () => { if (document.hidden) setDisplaySeed(''); };
    document.addEventListener('visibilitychange', onVisChange);
    return () => { clearInterval(tick); document.removeEventListener('visibilitychange', onVisChange); };
  }, [displaySeed]);
  useEffect(() => () => setDisplaySeed(''), []);
  const [showNewAccountFlow, setShowNewAccountFlow] = useState(false);
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [showNewAccountPassword, setShowNewAccountPassword] = useState(false);
  const [newAccountMode, setNewAccountMode] = useState('new'); // 'new' or 'import'
  const [newAccountSeed, setNewAccountSeed] = useState('');

  // QR Sync state (transfer wallet between devices)
  const [qrSyncFromManage, setQrSyncFromManage] = useState(false); // true when QR sync entered from Manage panel
  const [qrSyncMode, setQrSyncMode] = useState(null); // 'export' | 'import'
  const [qrSyncData, setQrSyncData] = useState('');
  const [qrSyncPassword, setQrSyncPassword] = useState('');
  const [showQrSyncPassword, setShowQrSyncPassword] = useState(false);
  const [qrSyncError, setQrSyncError] = useState('');
  const [qrSyncLoading, setQrSyncLoading] = useState(false);
  const [qrSyncExpiry, setQrSyncExpiry] = useState(null);
  const [qrImportData, setQrImportData] = useState('');
  const [qrCountdown, setQrCountdown] = useState(0);
  const [qrScannerActive, setQrScannerActive] = useState(false);
  const [qrScannerSupported, setQrScannerSupported] = useState(false);
  const qrVideoRef = useRef(null);
  const qrStreamRef = useRef(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearWarningAgreed, setClearWarningAgreed] = useState(false);
  const [clearWarningText, setClearWarningText] = useState('');
  const [clearSliderValue, setClearSliderValue] = useState(0);
  const [storedWalletCount, setStoredWalletCount] = useState(0);
  const [storedWalletDate, setStoredWalletDate] = useState(null);
  const [storedWalletAddresses, setStoredWalletAddresses] = useState([]);
  const [isMobileView, setIsMobileView] = useState(false);

  // Returning user unlock flow state
  const [hasExistingWallet, setHasExistingWallet] = useState(false);
  const [walletMetadata, setWalletMetadata] = useState([]);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [showUnlockPassword, setShowUnlockPassword] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  // New user create wallet state
  const [createPassword, setCreatePassword] = useState('');
  const [createPasswordConfirm, setCreatePasswordConfirm] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createMode, setCreateMode] = useState('new'); // 'new' | 'import' | 'qr'
  const [createSeed, setCreateSeed] = useState('');

  // Password strength meter for create/import flow
  const passwordStrength = useMemo(() => {
    if (!createPassword) return null;
    const len = createPassword.length;
    const hasUpper = /[A-Z]/.test(createPassword);
    const hasLower = /[a-z]/.test(createPassword);
    const hasNumber = /[0-9]/.test(createPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(createPassword);
    const variety = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    const weak = ['password', '12345678', 'qwerty12', 'letmein1', 'welcome1'];
    const isCommon = weak.some((w) => createPassword.toLowerCase().includes(w));

    let score = 0;
    if (len >= 8) score++;
    if (len >= 12) score++;
    if (variety >= 3) score++;
    if (variety >= 4) score++;
    if (isCommon) score = Math.min(score, 1);

    if (score <= 1) return { level: 1, label: 'Weak', color: '#ef4444' };
    if (score === 2) return { level: 2, label: 'Fair', color: '#F6AF01' };
    if (score === 3) return { level: 3, label: 'Good', color: '#08AA09' };
    return { level: 4, label: 'Strong', color: '#08AA09' };
  }, [createPassword]);

  // Post-creation backup screen state
  const [newWalletData, setNewWalletData] = useState(null);
  const [showNewWalletScreen, setShowNewWalletScreen] = useState(false);
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [showNewSeed, setShowNewSeed] = useState(false);
  const [newSeedCopied, setNewSeedCopied] = useState(false);
  const [newAddressCopied, setNewAddressCopied] = useState(false);

  // Security: seed stored in ref (not state) to avoid DOM/React DevTools exposure
  const newWalletSeedRef = useRef(null);
  const [newSeedAvailable, setNewSeedAvailable] = useState(false);
  const [newSeedCountdown, setNewSeedCountdown] = useState(0);

  // Auto-clear seed ref after 60s
  useEffect(() => {
    if (!newSeedAvailable) { setNewSeedCountdown(0); return; }
    setNewSeedCountdown(60);
    const tick = setInterval(() => {
      setNewSeedCountdown((c) => {
        if (c <= 1) {
          newWalletSeedRef.current = null;
          setNewSeedAvailable(false);
          setShowNewSeed(false);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    const onVis = () => { if (document.hidden) { newWalletSeedRef.current = null; setNewSeedAvailable(false); setShowNewSeed(false); } };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(tick); document.removeEventListener('visibilitychange', onVis); };
  }, [newSeedAvailable]);
  // Clear on unmount
  useEffect(() => () => { newWalletSeedRef.current = null; }, []);

  // Crypto bridge state
  const [showBridgeForm, setShowBridgeForm] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [bridgeAmount, setBridgeAmount] = useState('');
  const [bridgeLoading, setBridgeLoading] = useState(false);
  const [bridgeData, setBridgeData] = useState(null);
  const [bridgeError, setBridgeError] = useState('');
  const [bridgeAddressCopied, setBridgeAddressCopied] = useState(false);
  const [estimatedXrp, setEstimatedXrp] = useState(null);
  const [minAmount, setMinAmount] = useState(null);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [showBridgeInDropdown, setShowBridgeInDropdown] = useState(false);
  const [swapDirection, setSwapDirection] = useState('toXrp'); // 'toXrp' or 'fromXrp'
  const [destAddress, setDestAddress] = useState(''); // destination address for fromXrp swaps

  // QR Sync countdown timer
  useEffect(() => {
    if (!qrSyncExpiry) {
      setQrCountdown(0);
      return;
    }

    // Initial countdown
    const remaining = Math.max(0, Math.ceil((qrSyncExpiry - Date.now()) / 1000));
    setQrCountdown(remaining);

    // Update every second
    const interval = setInterval(() => {
      const secs = Math.max(0, Math.ceil((qrSyncExpiry - Date.now()) / 1000));
      setQrCountdown(secs);

      if (secs <= 0) {
        clearInterval(interval);
        setQrSyncData('');
        setQrSyncExpiry(null);
        setSeedAuthStatus('select-mode');
        openSnackbar('QR code expired', 'warning');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [qrSyncExpiry]);

  // Restore wallet modal state from sessionStorage on mount
  // Note: setOpenWalletModal comes from AppContext, so the auto-open effect handles opening the modal
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = sessionStorage.getItem('wallet_modal_state');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        // Restore post-creation backup screen state
        if (data.showNewWalletScreen && data.newWalletData) {
          setShowNewWalletScreen(true);
          setNewWalletData(data.newWalletData);
          setBackupConfirmed(data.backupConfirmed || false);
          setShowBridgeForm(data.showBridgeForm || false);
          if (data.bridgeData) setBridgeData(data.bridgeData);
          if (data.bridgeAmount) setBridgeAmount(data.bridgeAmount);
          if (data.selectedCurrency) setSelectedCurrency(data.selectedCurrency);
          if (data.estimatedXrp) setEstimatedXrp(data.estimatedXrp);
        }
        // Restore new account flow state (but not password)
        if (data.showNewAccountFlow) {
          setShowNewAccountFlow(true);
          setNewAccountMode(data.newAccountMode || 'new');
        }
      } catch (e) { console.warn('[Wallet] Session restore failed:', e.message); }
    }
  }, []);

  // Persist wallet modal state to sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Only persist if we're in an important flow that shouldn't be lost
    if (showNewWalletScreen && newWalletData) {
      sessionStorage.setItem(
        'wallet_modal_state',
        JSON.stringify({
          showNewWalletScreen: true,
          newWalletData: {
            address: newWalletData.address,
            publicKey: newWalletData.publicKey,
            // seed intentionally omitted — stays in React state only
            createdAt: newWalletData.createdAt
          },
          backupConfirmed,
          showBridgeForm,
          bridgeData,
          bridgeAmount,
          selectedCurrency,
          estimatedXrp
        })
      );
    } else if (showNewAccountFlow) {
      sessionStorage.setItem(
        'wallet_modal_state',
        JSON.stringify({
          showNewAccountFlow: true,
          newAccountMode
        })
      );
    } else {
      // Clear when no active flow
      sessionStorage.removeItem('wallet_modal_state');
    }
  }, [
    showNewWalletScreen,
    newWalletData,
    backupConfirmed,
    showBridgeForm,
    bridgeData,
    bridgeAmount,
    selectedCurrency,
    estimatedXrp,
    showNewAccountFlow,
    newAccountMode
  ]);

  // Clear persisted state when wallet setup is complete
  const clearPersistedState = useCallback(() => {
    sessionStorage.removeItem('wallet_modal_state');
  }, []);

  // Security: clear sensitive state when user switches away from tab
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Clear any plaintext seeds/passwords from React state
        setDisplaySeed('');
        setSeedPassword('');
        // Clear seed ref (backup screen)
        newWalletSeedRef.current = null;
        setNewSeedAvailable(false);
        // Strip seed from newWalletData if present (keep address/publicKey)
        setNewWalletData((prev) => {
          if (prev?.seed) {
            const { seed, ...safe } = prev;
            return safe;
          }
          return prev;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check stored wallet count on mount for delete button visibility
  useEffect(() => {
    const checkWallets = async () => {
      try {
        // Open without version to get current version, avoiding version mismatch errors
        const request = indexedDB.open('XRPLWalletDB');
        request.onsuccess = () => {
          const db = request.result;
          if (db.objectStoreNames.contains('wallets')) {
            const tx = db.transaction(['wallets'], 'readonly');
            const store = tx.objectStore('wallets');
            const allReq = store.getAll();
            allReq.onsuccess = () => {
              // Count actual wallets: have encrypted data blob and maskedAddress (exclude password/lookup entries)
              const wallets = allReq.result.filter(
                (r) =>
                  r.data &&
                  r.maskedAddress &&
                  !r.id?.startsWith?.('__pwd__') &&
                  !r.id?.startsWith?.('__lookup__')
              );
              setStoredWalletCount(wallets.length);
            };
          }
          db.close();
        };
      } catch (e) {
        // Ignore errors
      }
    };
    checkWallets();
  }, []);

  const handleSeedPasswordSubmit = async () => {
    const profile = backupTargetProfile || accountProfile;
    if (!seedPassword) {
      openSnackbar('Please enter password', 'error');
      return;
    }

    // Audit (Temple/Thanos): rate-limit seed reveal to prevent brute force
    const rateCheck = securityUtils.rateLimiter.check('seed_reveal');
    if (!rateCheck.allowed) {
      openSnackbar(rateCheck.error, 'error');
      return;
    }

    try {
      let wallet;

      // OAuth wallets are stored differently - use OAuth ID lookup
      if (profile.wallet_type === 'oauth' || profile.wallet_type === 'social') {
        const walletId = `${profile.provider}_${profile.provider_id}`;
        wallet = await walletStorage.findWalletBySocialId(walletId, seedPassword);
      } else if (profile.wallet_type === 'device') {
        // Device wallets - try multiple retrieval methods
        try {
          // First try getting by address directly
          wallet = await walletStorage.getWallet(profile.address, seedPassword);
        } catch (e) {
          // If that fails, try getting all wallets
          const wallets = await walletStorage.getAllWallets(seedPassword);
          wallet = wallets.find((w) => w.address === profile.address);
        }
      } else {
        // Other wallets use address lookup
        wallet = await walletStorage.getWallet(profile.address, seedPassword);
      }

      if (wallet && wallet.seed) {
        if (backupMode === 'seed') {
          securityUtils.rateLimiter.recordSuccess('seed_reveal');
          setSeedAuthStatus('success');
          setDisplaySeed(wallet.seed);
          setSeedBlurred(true);
          setSeedPassword('');
          setShowSeedPassword(false);
          // Mark wallet as backed up only for individual seed view
          localStorage.removeItem(`wallet_needs_backup_${profile.address || profile.account}`);
        }
      } else {
        throw new Error('Wallet not found or incorrect password');
      }
    } catch (error) {
      securityUtils.rateLimiter.recordFailure('seed_reveal');
      devError('Error retrieving wallet:', error);
      openSnackbar('Incorrect password', 'error');
      setSeedPassword('');
      setSeedAuthStatus('password-required');
    }
  };

  // OAuth provider functions (handleImportSeed, handleImportWallet) removed — dead code

  const { darkMode } = useContext(ThemeContext);
  const {
    setActiveProfile,
    accountProfile,
    profiles,
    setProfiles,
    removeProfile,
    accountBalance,
    handleLogin,
    handleLogout,
    doLogIn,
    getActiveWalletFromIDB
  } = useContext(WalletContext);
  const {
    open,
    setOpen,
    openWalletModal,
    setOpenWalletModal,
    connecting,
    setConnecting,
    handleOpen,
    handleClose
  } = useContext(WalletUIContext);
  const { openSnackbar } = useContext(AppContext);

  // Auto-open modal if there's pending wallet setup flow
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Auto-open if ANY part of wallet setup is incomplete
    // This includes: backup screen, bridge form, bridge in progress
    const hasIncompleteSetup = showNewWalletScreen && newWalletData;
    const hasPendingFlow = hasIncompleteSetup || showNewAccountFlow;

    if (hasPendingFlow && !openWalletModal && !open) {
      // Small delay to ensure DOM is ready after navigation/refresh
      const timer = setTimeout(() => {
        setOpenWalletModal(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [
    showNewWalletScreen,
    newWalletData,
    showNewAccountFlow,
    openWalletModal,
    open,
    setOpenWalletModal
  ]);

  // Check for existing wallets when modal opens (for returning users)
  useEffect(() => {
    if (!openWalletModal) {
      // Reset state when modal closes
      setUnlockPassword('');
      setUnlockError('');
      return;
    }

    // Only check when user is not logged in
    if (accountProfile) return;

    const checkExistingWallets = async () => {
      try {
        const hasWallet = await walletStorage.hasWallet();
        const metadata = hasWallet ? await walletStorage.getWalletMetadata() : [];
        setHasExistingWallet(hasWallet && metadata.length > 0);
        setWalletMetadata(metadata);
      } catch (e) {
        console.error('[Wallet] Error checking existing wallets:', e);
      }
    };
    checkExistingWallets();
  }, [openWalletModal, accountProfile, walletStorage]);

  // Handle password unlock for returning users
  const handlePasswordUnlock = async () => {
    if (!unlockPassword) {
      setUnlockError('Enter password');
      return;
    }

    // Audit (Temple/Thanos): rate-limit unlock attempts to prevent brute force
    const rateCheck = securityUtils.rateLimiter.check('wallet_unlock');
    if (!rateCheck.allowed) {
      setUnlockError(rateCheck.error);
      return;
    }

    setIsUnlocking(true);
    setUnlockError('');

    try {
      const wallets = await walletStorage.unlockWithPassword(unlockPassword);

      if (!wallets || wallets.length === 0) {
        securityUtils.rateLimiter.recordFailure('wallet_unlock');
        setUnlockError('Incorrect password');
        return;
      }

      // Get device fingerprint ID for device wallets (survives storage clearing)
      const hasDeviceWallets = wallets.some((w) => w.wallet_type === 'device');
      let deviceKeyId = null;
      if (hasDeviceWallets) {
        const { deviceFingerprint } = await import('src/utils/encryptedWalletStorage');
        deviceKeyId = await deviceFingerprint.getDeviceId();
      }

      // Store password for auto-retrieval on device wallets
      if (hasDeviceWallets && deviceKeyId) {
        await walletStorage.storeWalletCredential(deviceKeyId, unlockPassword);
      }

      // Convert to profile format
      const allProfiles = wallets.map((w, index) => ({
        account: w.address,
        address: w.address,
        publicKey: w.publicKey,
        wallet_type: w.wallet_type || 'oauth',
        provider: w.provider,
        provider_id: w.provider_id,
        deviceKeyId: w.wallet_type === 'device' ? w.deviceKeyId || deviceKeyId : w.deviceKeyId,
        walletKeyId: w.walletKeyId || (w.wallet_type === 'device' ? w.deviceKeyId || deviceKeyId : null),
        accountIndex: w.accountIndex ?? index,
        createdAt: w.createdAt || Date.now(),
        tokenCreatedAt: Date.now()
      }));

      setProfiles(allProfiles);
      localStorage.setItem('profiles', JSON.stringify(allProfiles));

      // Restore previously active wallet from IndexedDB (survives localStorage clearing)
      let activeProfile = allProfiles[0];
      try {
        const savedAddress = await getActiveWalletFromIDB();
        if (savedAddress) {
          const found = allProfiles.find(p => p.account === savedAddress);
          if (found) activeProfile = found;
        }
      } catch (e) { /* fall back to first wallet */ }
      doLogIn(activeProfile, allProfiles);

      securityUtils.rateLimiter.recordSuccess('wallet_unlock');
      setUnlockPassword('');
      setOpenWalletModal(false);
    } catch (error) {
      securityUtils.rateLimiter.recordFailure('wallet_unlock');
      setUnlockError(error.message || 'Incorrect password');
    } finally {
      setIsUnlocking(false);
    }
  };

  // Create new wallet with password (simplified device login)
  const handlePasswordCreate = async () => {
    const strengthCheck = securityUtils.validatePasswordStrength(createPassword);
    if (!strengthCheck.valid) {
      setCreateError(strengthCheck.error);
      return;
    }
    if (createPassword !== createPasswordConfirm) {
      setCreateError('Passwords do not match');
      return;
    }
    // Validate seed if importing
    if (createMode === 'import') {
      const validation = validateSeed(createSeed);
      if (!validation.valid) {
        setCreateError(validation.error || 'Invalid seed');
        return;
      }
    }

    setIsCreating(true);
    setCreateError('');

    try {
      const { Wallet: XRPLWallet } = await getXrpl();
      let wallet;
      if (createMode === 'import' && createSeed) {
        const algorithm = getAlgorithmFromSeed(createSeed.trim());
        wallet = XRPLWallet.fromSeed(createSeed.trim(), { algorithm });
      } else {
        wallet = await generateRandomWallet();
      }

      // Generate stable device fingerprint ID (survives storage clearing)
      const { deviceFingerprint } = await import('src/utils/encryptedWalletStorage');
      const deviceKeyId = await deviceFingerprint.getDeviceId();

      const walletData = {
        account: wallet.address,
        address: wallet.address,
        publicKey: wallet.publicKey,
        wallet_type: 'device',
        deviceKeyId: deviceKeyId,
        walletKeyId: deviceKeyId,
        xrp: '0',
        createdAt: Date.now(),
        seed: wallet.seed
      };

      // Audit: zero seed from wallet object after copying to walletData
      wallet.seed = '';
      wallet.privateKey = '';

      await walletStorage.storeWallet(walletData, createPassword);
      // Store password for auto-retrieval (like OAuth wallets do)
      await walletStorage.storeWalletCredential(deviceKeyId, createPassword);

      const profile = {
        account: wallet.address,
        address: wallet.address,
        publicKey: wallet.publicKey,
        wallet_type: 'device',
        deviceKeyId: deviceKeyId,
        walletKeyId: deviceKeyId,
        accountIndex: 0,
        createdAt: Date.now(),
        tokenCreatedAt: Date.now()
      };

      setProfiles([profile]);
      localStorage.setItem('profiles', JSON.stringify([profile]));
      doLogIn(profile, [profile]);

      // Auto-register for referral program if referred
      const storedRef = localStorage.getItem('referral_code');
      if (storedRef || true) { // Always register, with or without referral
        apiFetch('https://api.xrpl.to/api/referral/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: wallet.address, ...(storedRef && { referredBy: storedRef }) })
        }).catch(err => { console.warn('[Wallet] Referral register failed:', err.message); });
        localStorage.removeItem('referral_code');
      }

      // For new wallets, show backup screen. For imports, skip (user already has seed)
      if (createMode === 'new') {
        localStorage.setItem(`wallet_needs_backup_${wallet.address}`, 'true');
        // Security: store seed in ref (never in state/DOM), strip from walletData
        newWalletSeedRef.current = walletData.seed;
        setNewSeedAvailable(true);
        const { seed: _s, ...safeWalletData } = walletData;
        setNewWalletData({ ...safeWalletData, profile });
        setShowNewWalletScreen(true);
        setBackupConfirmed(false);
        setShowNewSeed(false);
        setNewSeedCopied(false);
        setNewAddressCopied(false);
        setShowBridgeForm(false);
        setBridgeData(null);
        setBridgeError('');
      } else {
        // Import mode - show success notification
        openSnackbar('Wallet imported successfully', 'success');
      }

      setCreatePassword('');
      setCreatePasswordConfirm('');
      setCreateSeed('');
      setCreateMode('new');
    } catch (error) {
      setCreateError(error.message || 'Failed to create wallet');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle QR import from connect wallet screen
  const handleQrImportCreate = async () => {
    if (!qrImportData || !createPassword) return;

    setIsCreating(true);
    setCreateError('');

    try {
      // Import wallet from QR data using the password
      const imported = await walletStorage.importFromQRSync(qrImportData, createPassword);

      // Store the password for future use
      const deviceKeyId = await deviceFingerprint.getDeviceId();
      await walletStorage.storeWalletCredential(deviceKeyId, createPassword);

      // Create profile for localStorage
      const newProfile = {
        account: imported.address,
        address: imported.address,
        publicKey: imported.publicKey,
        wallet_type: 'imported',
        importedAt: Date.now(),
        importedVia: 'qr_sync'
      };

      // Save to localStorage
      const existingProfiles = localStorage.getItem('profiles');
      const currentProfiles = existingProfiles ? JSON.parse(existingProfiles) : [];

      // Check if already exists
      if (currentProfiles.find((p) => p.account === imported.address)) {
        throw new Error('Wallet already exists');
      }

      currentProfiles.push(newProfile);
      localStorage.setItem('profiles', JSON.stringify(currentProfiles));

      // Fetch and cache the user's avatar so it shows on the login screen
      try {
        const res = await apiFetch(`https://api.xrpl.to/api/user/${imported.address}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user?.avatar) {
            const masked = `${imported.address.slice(0, 6)}...${imported.address.slice(-4)}`;
            const cached = { ...(walletAvatarCache.current || {}), [masked]: data.user.avatar };
            walletAvatarCache.current = cached;
            localStorage.setItem('__user_avatars__', JSON.stringify(cached));
          }
        }
      } catch (e) { /* avatar cache is non-critical */ }

      // Set as active
      setActiveProfile(imported.address);
      setProfiles(currentProfiles);

      // Reset state
      setQrImportData('');
      setCreatePassword('');
      setCreateMode('new');
      setOpenWalletModal(false);

      openSnackbar('Wallet imported successfully!', 'success');
    } catch (error) {
      setCreateError(error.message || 'Failed to import wallet');
    } finally {
      setIsCreating(false);
    }
  };

  // Complete wallet setup after backup confirmation
  const handleCompleteSetup = () => {
    newWalletSeedRef.current = null;
    setNewSeedAvailable(false);
    setShowNewWalletScreen(false);
    setNewWalletData(null);
    setShowBridgeForm(false);
    setBridgeData(null);
    setOpenWalletModal(false);
    clearPersistedState(); // Clear sessionStorage
  };

  // Fetch available currencies
  const fetchCurrencies = useCallback(async () => {
    if (currencies.length > 0) return;
    try {
      const res = await apiFetch('https://api.xrpl.to/v1/bridge/currencies');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Handle both array and object with currencies property
      const currencyList = Array.isArray(data) ? data : data.currencies || data.data || [];
      if (!currencyList.length) throw new Error('Empty response');

      const popular = [
        'btc',
        'eth',
        'usdt',
        'usdc',
        'bnb',
        'sol',
        'ada',
        'doge',
        'matic',
        'ltc',
        'trx',
        'avax'
      ];
      const sorted = currencyList
        .filter((c) => c.ticker !== 'xrp')
        .sort((a, b) => {
          const aIdx = popular.indexOf(a.ticker);
          const bIdx = popular.indexOf(b.ticker);
          if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
          if (aIdx !== -1) return -1;
          if (bIdx !== -1) return 1;
          return (a.name || '').localeCompare(b.name || '');
        });
      setCurrencies(sorted);
      if (sorted.length > 0 && !selectedCurrency) setSelectedCurrency(sorted[0]);
    } catch (err) {
      console.error('Currency fetch failed:', err);
      setBridgeError('Failed to load currencies');
    }
  }, [currencies.length, selectedCurrency]);

  // Fetch estimate when amount changes
  const fetchEstimate = useCallback(async () => {
    if (!selectedCurrency || !bridgeAmount) {
      setEstimatedXrp(null);
      return;
    }
    const isToXrp = swapDirection === 'toXrp';
    const fromCurr = isToXrp ? selectedCurrency.ticker : 'xrp';
    const toCurr = isToXrp ? 'xrp' : selectedCurrency.ticker;
    const fromNet = isToXrp ? selectedCurrency.network : 'xrp';
    const toNet = isToXrp ? 'xrp' : selectedCurrency.network;
    try {
      const minRes = await fetch(
        `https://api.xrpl.to/v1/bridge/min-amount?fromCurrency=${fromCurr}&toCurrency=${toCurr}&fromNetwork=${fromNet}&toNetwork=${toNet}`
      );
      if (minRes.ok) {
        const minData = await minRes.json();
        setMinAmount(minData.minAmount);
        if (parseFloat(bridgeAmount) < minData.minAmount) {
          setBridgeError(
            `Min: ${minData.minAmount} ${isToXrp ? selectedCurrency.ticker.toUpperCase() : 'XRP'}`
          );
          setEstimatedXrp(null);
          return;
        }
      }
      setBridgeError('');
      const estRes = await fetch(
        `https://api.xrpl.to/v1/bridge/estimate?fromCurrency=${fromCurr}&toCurrency=${toCurr}&fromAmount=${bridgeAmount}&fromNetwork=${fromNet}&toNetwork=${toNet}`
      );
      if (estRes.ok) {
        const estData = await estRes.json();
        setEstimatedXrp(estData.toAmount || estData.estimatedAmount);
      }
    } catch (err) {
      console.warn('Estimate failed:', err);
    }
  }, [selectedCurrency, bridgeAmount, swapDirection]);

  // Debounced estimate
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedCurrency && bridgeAmount) fetchEstimate();
    }, 500);
    return () => clearTimeout(timer);
  }, [selectedCurrency, bridgeAmount, fetchEstimate]);

  // Show bridge form for crypto swap
  const handleShowBridge = () => {
    setShowBridgeForm(true);
    setBridgeData(null);
    setBridgeError('');
    setBridgeAmount('');
    setEstimatedXrp(null);
    fetchCurrencies();
  };

  // Initialize bridge form for logged-in users dropdown
  const initBridgeForm = () => {
    setBridgeData(null);
    setBridgeError('');
    setBridgeAmount('');
    setEstimatedXrp(null);
    setSelectedCurrency(null);
    setSwapDirection('toXrp');
    setDestAddress('');
    fetchCurrencies();
  };

  // Create bridge exchange
  // Security note: no CSRF token needed — POST goes through same-origin /api/proxy which injects
  // the API key server-side. Same-origin policy prevents cross-origin CSRF. XSS is the real threat
  // vector, mitigated by CSP + no innerHTML (see audit Finding 2/16).
  const handleCreateBridge = async (targetAddress = null) => {
    const address = targetAddress || newWalletData?.address || accountLogin;
    if (!bridgeAmount || !address || !selectedCurrency) return;

    setBridgeLoading(true);
    setBridgeError('');

    const isToXrp = swapDirection === 'toXrp';
    try {
      const res = await apiFetch('https://api.xrpl.to/v1/bridge/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCurrency: isToXrp ? selectedCurrency.ticker : 'xrp',
          toCurrency: isToXrp ? 'xrp' : selectedCurrency.ticker,
          fromNetwork: isToXrp ? selectedCurrency.network : 'xrp',
          toNetwork: isToXrp ? 'xrp' : selectedCurrency.network,
          fromAmount: parseFloat(bridgeAmount),
          address: isToXrp ? address : destAddress,
          refundAddress: isToXrp ? undefined : address
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `Error ${res.status}`);
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!data.payinAddress) throw new Error('Invalid response');

      setBridgeData({ ...data, swapDirection });

      // Store for tracking
      localStorage.setItem(
        `bridge_tx_${data.id}`,
        JSON.stringify({
          id: data.id,
          fromCurrency: isToXrp ? selectedCurrency.ticker : 'xrp',
          toCurrency: isToXrp ? 'xrp' : selectedCurrency.ticker,
          fromAmount: bridgeAmount,
          expectedAmount: estimatedXrp,
          address: address,
          createdAt: Date.now()
        })
      );
    } catch (err) {
      setBridgeError(err.message || 'Failed to create exchange');
    } finally {
      setBridgeLoading(false);
    }
  };

  const checkAccountActivity = useCallback(async (address) => {
    try {
      const response = await apiFetch(`https://api.xrpl.to/v1/account/balance/${address}`);
      if (!response.ok) return false;

      const data = await response.json();
      if (data.status === false || data.err) return false;
      if (data.balance !== undefined) {
        return data.balance >= 1;
      }
      return false;
    } catch (err) {
      return false;
    }
  }, []);

  // Removed visibleWalletCount - now showing all accounts by default with search/pagination

  // Check activation status for all accounts (parallel, cached in localStorage)
  // Active account is always re-checked; others use cache
  useEffect(() => {
    if (!profiles?.length) return;

    const activeAccount = accountProfile?.account;
    const checkActivations = async () => {
      const toCheck = profiles.filter(p =>
        accountsActivation[p.account] === undefined || p.account === activeAccount
      );

      if (!toCheck.length) return;

      const results = await Promise.allSettled(
        toCheck.map(async (profile) => ({
          account: profile.account,
          isActive: await checkAccountActivity(profile.account)
        }))
      );

      setAccountsActivation((prev) => {
        const updated = { ...prev };
        let changed = false;
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            const { account, isActive } = result.value;
            if (prev[account] !== isActive) changed = true;
            updated[account] = isActive;
          }
        });
        if (changed || Object.keys(prev).length !== Object.keys(updated).length) {
          try {
            localStorage.setItem('accountsActivation', JSON.stringify({ data: updated, ts: Date.now() }));
          } catch {}
        }
        return updated;
      });
    };

    checkActivations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles, checkAccountActivity, accountProfile?.account]);

  const handleBackupSeed = async (targetProfile = null, seedOnly = false) => {
    const profile = targetProfile || accountProfile;
    if (!profile) return;

    setBackupTargetProfile(profile);
    setShowSeedDialog(true);
    setSeedPassword('');
    setDisplaySeed('');

    if (seedOnly) {
      // Skip mode selection, go directly to seed backup
      setBackupMode('seed');
      setSeedAuthStatus('password-required');
    } else {
      setSeedAuthStatus('select-mode');
      setBackupMode(null);
    }
  };


  // QR Sync - Export wallet as QR code
  const handleQrExport = async () => {
    const profile = backupTargetProfile || accountProfile;
    if (!profile || !qrSyncPassword) return;

    setQrSyncLoading(true);
    setQrSyncError('');

    try {
      const qrData = await walletStorage.exportForQRSync(
        profile.account || profile.address,
        qrSyncPassword
      );

      setQrSyncData(qrData);
      setQrSyncExpiry(Date.now() + 300000); // 5 minutes
      setSeedAuthStatus('qr-sync-display');

    } catch (error) {
      setQrSyncError(error.message === 'Invalid PIN' ? 'Incorrect password' : error.message);
    } finally {
      setQrSyncLoading(false);
    }
  };

  // Load jsQR library dynamically
  const loadJsQR = async () => {
    if (window.jsQR) return window.jsQR;

    // Self-hosted — no CDN dependency, no SRI risk
    const url = '/js/jsQR.min.js';
    try {
      const existing = document.querySelector(`script[src="${url}"]`);
      if (!existing) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = url;
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      // Wait for global to appear
      for (let i = 0; i < 20; i++) {
        if (window.jsQR) return window.jsQR;
        await new Promise(r => setTimeout(r, 100));
      }
      return null;
    } catch (e) {
      return null;
    }
  };


  // QR Scanner - Direct camera access (simplified for iOS Safari)
  const startQrScanner = async () => {
    const setError = (msg) => {
      setQrSyncError(msg);
      if (createMode === 'qr') setCreateError(msg);
    };

    try {
      setQrScannerSupported(true);
      setQrSyncError('');
      setCreateError('');
      setQrScannerActive(true);

      await new Promise((resolve) => setTimeout(resolve, 150));

      // Find the container
      const container = document.getElementById('qr-video-container') ||
                       document.getElementById('qr-video-container-create');

      if (!container) {
        throw new Error('Video container not found');
      }

      // Clear container and create video element (DOM API — no innerHTML)
      while (container.firstChild) container.removeChild(container.firstChild);
      const video = document.createElement('video');
      video.id = 'qr-camera-video';
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.setAttribute('webkit-playsinline', '');
      Object.assign(video.style, { width: '100%', height: '180px', objectFit: 'cover', background: '#000', display: 'block' });
      container.appendChild(video);

      qrVideoRef.current = video;

      // Request camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      qrStreamRef.current = stream;

      // Attach stream to video
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.muted = true;

      // Wait for video to be ready and force play
      await new Promise((resolve) => {
        video.onloadedmetadata = async () => {
          try {
            await video.play();
          } catch (e) {
            // Play failed, retrying
          }
          resolve();
        };
        // Timeout fallback
        setTimeout(async () => {
          try { await video.play(); } catch(e) {}
          resolve();
        }, 2000);
      });

      // Force video to be visible (iOS Safari workaround)
      video.style.opacity = '1';
      video.style.visibility = 'visible';
      video.style.display = 'block';

      // Try to load QR scanning library
      const jsQR = await loadJsQR();

      if (!jsQR) {
        // Library failed to load - show message
        setError('QR scanner library failed to load. Please paste the code manually.');
        return;
      }

      // Get dimensions from track (iOS Safari fix for 0 dimensions)
      const track = stream.getVideoTracks()[0];
      const trackSettings = track?.getSettings() || {};
      const trackWidth = trackSettings.width || 640;
      const trackHeight = trackSettings.height || 480;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      let scanCount = 0;
      let lastLogTime = 0;

      const scanFrame = () => {
        if (!qrStreamRef.current) return;

        try {
          // Use track dimensions if video dimensions are 0 (iOS Safari portrait bug)
          const width = video.videoWidth > 0 ? video.videoWidth : trackWidth;
          const height = video.videoHeight > 0 ? video.videoHeight : trackHeight;

          // Log dimensions every 3 seconds for debugging
          const now = Date.now();
          if (now - lastLogTime > 3000) {
            devLog('QR Scan - video:', video.videoWidth, 'x', video.videoHeight);
            lastLogTime = now;
          }

          if (width > 0 && height > 0) {
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(video, 0, 0, width, height);

            // Check if canvas has actual image data (not just black)
            const imageData = ctx.getImageData(0, 0, width, height);

            // Quick check if image has content (not all zeros)
            let hasContent = false;
            for (let i = 0; i < Math.min(1000, imageData.data.length); i += 4) {
              if (imageData.data[i] > 10 || imageData.data[i+1] > 10 || imageData.data[i+2] > 10) {
                hasContent = true;
                break;
              }
            }

            if (hasContent) {
              const code = jsQR(imageData.data, width, height);

              if (code?.data) {
                devLog('QR code detected');
                // Check if it's our wallet QR format
                if (code.data.startsWith('XRPLTO:') || code.data.startsWith('XRPL:')) {
                  setQrImportData(code.data);
                  stopQrScanner();
                  openSnackbar('QR code scanned successfully', 'success');
                  return;
                } else {
                  // Found a QR but wrong format - show once
                  if (scanCount === 0) {
                    openSnackbar('QR detected but wrong format: ' + code.data.substring(0, 20), 'warning');
                  }
                }
              }
            } else if (scanCount % 100 === 0) {
              devLog('Canvas appears empty');
            }
          }
          scanCount++;
        } catch (e) {
          devLog('Scan error:', e.message);
        }

        requestAnimationFrame(scanFrame);
      };

      // Start scanning
      setTimeout(scanFrame, 500);
      devLog('QR Scanner started');

      // Show help message after 8 seconds if nothing detected
      setTimeout(() => {
        if (qrStreamRef.current) {
          openSnackbar('Tap "Take Photo" button if auto-scan doesn\'t work', 'info');
        }
      }, 8000);

    } catch (error) {
      console.error('QR Scanner error:', error);
      setQrScannerActive(false);

      if (error.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera access and try again.');
      } else {
        setError('Could not start camera: ' + (error.message || 'Unknown error'));
      }
    }
  };

  // Stop QR scanner and release camera
  const stopQrScanner = () => {
    setQrScannerActive(false);

    // Stop camera stream
    if (qrStreamRef.current) {
      qrStreamRef.current.getTracks().forEach((track) => track.stop());
      qrStreamRef.current = null;
    }
    if (qrVideoRef.current) {
      qrVideoRef.current.srcObject = null;
      qrVideoRef.current = null;
    }

    // Clean up containers (DOM API — no innerHTML)
    for (const id of ['qr-video-container', 'qr-video-container-create']) {
      const el = document.getElementById(id);
      if (el) while (el.firstChild) el.removeChild(el.firstChild);
    }
  };

  // Capture photo and scan QR (fallback for iOS Safari)
  const captureAndScanPhoto = async () => {
    const video = qrVideoRef.current;
    if (!video) {
      openSnackbar('Camera not ready', 'error');
      return;
    }

    try {
      const jsQR = await loadJsQR();
      if (!jsQR) {
        openSnackbar('Scanner library failed. Paste code manually.', 'error');
        stopQrScanner();
        return;
      }

      // Create canvas and capture frame
      const canvas = document.createElement('canvas');
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, width, height);

      // Try to scan
      const imageData = ctx.getImageData(0, 0, width, height);
      const code = jsQR(imageData.data, width, height);

      if (code?.data) {
        if (code.data.startsWith('XRPLTO:') || code.data.startsWith('XRPL:')) {
          setQrImportData(code.data);
          stopQrScanner();
          openSnackbar('QR code captured successfully!', 'success');
        } else {
          openSnackbar('QR found but wrong format', 'warning');
        }
      } else {
        openSnackbar('No QR code found in photo. Try again.', 'error');
      }
    } catch (e) {
      console.error('Capture error:', e);
      openSnackbar('Failed to capture: ' + e.message, 'error');
    }
  };

  // Scan QR from uploaded image file
  const scanQrFromFile = async (file) => {
    if (!file) return;

    try {
      const jsQR = await loadJsQR();
      if (!jsQR) {
        openSnackbar('Scanner library failed. Paste code manually.', 'error');
        stopQrScanner();
        return;
      }

      // Load image
      const img = new Image();
      const url = URL.createObjectURL(file);

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      // Draw to canvas and scan
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      URL.revokeObjectURL(url);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);

      if (code?.data) {
        if (code.data.startsWith('XRPLTO:') || code.data.startsWith('XRPL:')) {
          setQrImportData(code.data);
          openSnackbar('QR code scanned from image!', 'success');
        } else {
          openSnackbar('QR found but wrong format', 'warning');
        }
      } else {
        openSnackbar('No QR code found in image', 'error');
      }
    } catch (e) {
      openSnackbar('Failed to scan image', 'error');
    }
  };

  // Cleanup scanner when unmounting
  useEffect(() => {
    return () => {
      if (qrStreamRef.current) {
        qrStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Stop scanner when leaving import mode
  useEffect(() => {
    if (seedAuthStatus !== 'qr-sync-import') {
      stopQrScanner();
    }
  }, [seedAuthStatus]);

  // QR Sync - Import wallet from QR data
  const handleQrImport = async () => {
    if (!qrImportData || !qrSyncPassword) return;

    setQrSyncLoading(true);
    setQrSyncError('');

    try {
      // Get the device's local password so the imported wallet is encrypted
      // with the same password as existing wallets on this device
      const deviceKeyId = await deviceFingerprint.getDeviceId();
      const localPassword = await walletStorage.getWalletCredential(deviceKeyId);

      const imported = await walletStorage.importFromQRSync(qrImportData, qrSyncPassword, localPassword);

      // Add to profiles in localStorage
      const storedProfiles = localStorage.getItem('profiles');
      const currentProfiles = storedProfiles ? JSON.parse(storedProfiles) : [];

      // Check if wallet already exists
      if (currentProfiles.find((p) => p.account === imported.address)) {
        openSnackbar('Wallet already exists', 'warning');
      } else {
        currentProfiles.push({
          account: imported.address,
          address: imported.address,
          publicKey: imported.publicKey,
          wallet_type: 'imported',
          importedAt: Date.now(),
          importedVia: 'qr_sync'
        });
        localStorage.setItem('profiles', JSON.stringify(currentProfiles));
        openSnackbar('Wallet imported successfully', 'success');
      }

      // Fetch and cache the user's avatar so it shows on the login screen
      try {
        const res = await apiFetch(`https://api.xrpl.to/api/user/${imported.address}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user?.avatar) {
            const masked = `${imported.address.slice(0, 6)}...${imported.address.slice(-4)}`;
            const cached = { ...(walletAvatarCache.current || {}), [masked]: data.user.avatar };
            walletAvatarCache.current = cached;
            localStorage.setItem('__user_avatars__', JSON.stringify(cached));
          }
        }
      } catch (e) { /* avatar cache is non-critical */ }

      // Reset state
      setSeedAuthStatus('select-mode');
      setQrSyncMode(null);
      setQrSyncPassword('');
      setQrImportData('');
      setDisplaySeed('');
      setShowSeedDialog(false);

      // Intentional full reload: ensures clean state after QR import — resetting ~30 state
      // variables via React would be error-prone. Reload also flushes any residual sensitive data.
      window.location.reload();
    } catch (error) {
      setQrSyncError(error.message);
    } finally {
      setQrSyncLoading(false);
    }
  };

  // Get wallet count, oldest date, and addresses from IndexedDB
  const checkStoredWalletCount = async () => {
    try {
      // Open without version to get current version, avoiding version mismatch errors
      const request = indexedDB.open('XRPLWalletDB');
      request.onsuccess = () => {
        const db = request.result;
        if (db.objectStoreNames.contains('wallets')) {
          const tx = db.transaction(['wallets'], 'readonly');
          const store = tx.objectStore('wallets');
          const allReq = store.getAll();
          allReq.onsuccess = () => {
            // Count actual wallets: have encrypted data blob and maskedAddress (exclude entropy backups, password entries)
            const wallets = allReq.result.filter(
              (r) =>
                r.data &&
                r.maskedAddress &&
                !r.id?.startsWith?.('__pwd__') &&
                !r.id?.startsWith?.('__entropy_backup__')
            );
            setStoredWalletCount(wallets.length);
            if (wallets.length > 0) {
              const oldest = Math.min(...wallets.map((w) => w.timestamp || Date.now()));
              setStoredWalletDate(oldest);
              // Get masked addresses from IndexedDB (or fallback to localStorage)
              const masked = wallets.map((w) => w.maskedAddress).filter(Boolean);
              if (masked.length > 0) {
                setStoredWalletAddresses(masked);
              } else {
                // Fallback: try localStorage profiles
                const storedProfiles = localStorage.getItem('profiles');
                if (storedProfiles) {
                  const parsed = JSON.parse(storedProfiles);
                  setStoredWalletAddresses(
                    parsed
                      .map((p) => {
                        const addr = p.account || p.address;
                        return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : null;
                      })
                      .filter(Boolean)
                  );
                }
              }
            }
          };
        } else {
          // No wallets store, but check localStorage profiles
          const storedProfiles = localStorage.getItem('profiles');
          if (storedProfiles) {
            const parsed = JSON.parse(storedProfiles);
            if (parsed.length > 0) {
              setStoredWalletCount(parsed.length);
              setStoredWalletAddresses(
                parsed
                  .map((p) => {
                    const addr = p.account || p.address;
                    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : null;
                  })
                  .filter(Boolean)
              );
            }
          }
        }
        db.close();
      };
      request.onerror = () => {
        // Database error - still check localStorage
        const storedProfiles = localStorage.getItem('profiles');
        if (storedProfiles) {
          const parsed = JSON.parse(storedProfiles);
          setStoredWalletCount(parsed.length);
        }
      };
    } catch (e) {
      setStoredWalletCount(0);
      setStoredWalletDate(null);
    }
  };

  // Clear all wallets
  const handleClearAllWallets = async () => {
    try {
      // Close any existing connections first
      const dbs = (await indexedDB.databases?.()) || [];
      for (const db of dbs) {
        if (db.name === 'XRPLWalletDB') {
          indexedDB.deleteDatabase('XRPLWalletDB');
        }
      }

      // Fallback: directly delete database
      const deleteRequest = indexedDB.deleteDatabase('XRPLWalletDB');
      deleteRequest.onsuccess = () => {};
      deleteRequest.onerror = () => {};
      deleteRequest.onblocked = () => {};

      // Clear all wallet-related localStorage keys
      localStorage.removeItem('profiles');
      localStorage.removeItem('accountLogin');
      localStorage.removeItem('authMethod');
      localStorage.removeItem('user');

      // Clear all backup flags and encrypted items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('wallet_') || key.startsWith('jwt') || key.endsWith('_enc'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // Clear state
      setProfiles([]);
      setStoredWalletCount(0);

      // Logout
      handleLogout();
      setShowClearConfirm(false);
      setClearSliderValue(0);
      setClearWarningText('');
      setOpenWalletModal(false);
      openSnackbar('All wallets cleared', 'success');

      // Intentional full reload after clear-all: guarantees no stale wallet state survives
      // in React, IndexedDB connections, or closure-scoped caches. This is the nuclear option
      // and appropriate here since the user just wiped all wallets.
      window.location.reload();
    } catch (error) {
      openSnackbar('Failed to clear wallets: ' + error.message, 'error');
    }
  };

  // Don't load profiles here - AppContext handles it
  // This was overwriting the auto-loaded profiles from IndexedDB

  const handleCreateNewAccount = async () => {
    if (!newAccountPassword) {
      openSnackbar('Please enter your password', 'error');
      return;
    }

    try {
      // Count all existing wallets (don't filter by type - all count toward limit)
      if (profiles.length >= 25) {
        openSnackbar('Maximum 25 accounts reached', 'warning');
        setShowNewAccountFlow(false);
        setNewAccountPassword('');
        return;
      }

      // Get stored password and compare directly
      let storedPassword;
      let rateLimitKey;
      if (accountProfile.wallet_type === 'device') {
        storedPassword = await walletStorage.getWalletCredential(accountProfile.deviceKeyId);
        rateLimitKey = `new_account_${accountProfile.deviceKeyId}`;
      } else {
        const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
        storedPassword = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);
        rateLimitKey = `new_account_${walletId}`;
      }

      // Rate limiting check
      const rateCheck = securityUtils.rateLimiter.check(rateLimitKey);
      if (!rateCheck.allowed) {
        openSnackbar(rateCheck.error, 'error');
        setNewAccountPassword('');
        return;
      }

      // Timing-safe password comparison
      if (!storedPassword || !securityUtils.timingSafeEqual(storedPassword, newAccountPassword)) {
        securityUtils.rateLimiter.recordFailure(rateLimitKey);
        openSnackbar('Incorrect password', 'error');
        setNewAccountPassword('');
        return;
      }
      securityUtils.rateLimiter.recordSuccess(rateLimitKey);

      // Password verified - create or import wallet with SAME auth type
      let wallet;
      if (newAccountMode === 'import' && newAccountSeed) {
        // Validate seed
        const validation = validateSeed(newAccountSeed);
        if (!validation.valid) {
          openSnackbar(validation.error || 'Invalid seed', 'error');
          return;
        }
        // Import from seed with correct algorithm
        const { Wallet: XRPLWallet } = await getXrpl();
        const algorithm = getAlgorithmFromSeed(newAccountSeed.trim());
        wallet = XRPLWallet.fromSeed(newAccountSeed.trim(), { algorithm });
        // Check if already exists
        if (profiles.find((p) => p.account === wallet.address)) {
          openSnackbar('This wallet is already added', 'warning');
          return;
        }
      } else {
        wallet = await generateRandomWallet();
      }

      const walletData = {
        deviceKeyId: accountProfile.deviceKeyId,
        walletKeyId: accountProfile.walletKeyId || accountProfile.deviceKeyId,
        accountIndex: profiles.length,
        account: wallet.address,
        address: wallet.address,
        publicKey: wallet.publicKey,
        wallet_type: accountProfile.wallet_type, // Inherit from current (device/oauth/social)
        provider: accountProfile.provider, // Inherit OAuth provider (google/twitter/email)
        provider_id: accountProfile.provider_id, // Inherit OAuth ID
        xrp: '0',
        createdAt: Date.now(),
        seed: wallet.seed
      };

      // Audit: zero seed from wallet object after copying to walletData
      wallet.seed = '';
      wallet.privateKey = '';

      // Store encrypted with same password
      await walletStorage.storeWallet(walletData, newAccountPassword);

      // For OAuth wallets, ensure password is stored for provider
      if (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social') {
        const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
        await walletStorage.setSecureItem(`wallet_pwd_${walletId}`, newAccountPassword);
      }

      // Update profiles (strip seed - seeds only go in encrypted IndexedDB)
      const { seed: _seed, ...profileData } = walletData;
      const allProfiles = [...profiles, { ...profileData, tokenCreatedAt: Date.now() }];
      setProfiles(allProfiles);
      await syncProfilesToIndexedDB(allProfiles);

      // Mark as needing backup (only new wallets, not imported)
      if (newAccountMode === 'new') {
        localStorage.setItem(`wallet_needs_backup_${wallet.address}`, 'true');
      }

      // Close and switch
      setShowNewAccountFlow(false);
      setNewAccountPassword('');
      setNewAccountSeed('');
      setNewAccountMode('new');
      setOpen(false);
      clearPersistedState();
      requestAnimationFrame(() => {
        doLogIn(walletData, allProfiles);
      });

      openSnackbar(
        newAccountMode === 'import' ? 'Wallet imported' : `Account #${allProfiles.length} created`,
        'success'
      );
    } catch (error) {
      devError('Create account error:', error);
      openSnackbar('Incorrect password', 'error');
      setNewAccountPassword('');
    }
  };

  const accountLogin = accountProfile?.account;
  const accountLogo = accountProfile?.logo;
  const accountTotalXrp = accountProfile?.xrp;
  // const isAdmin = accountProfile?.admin;

  let logoImageUrl = null;
  if (accountProfile) {
    logoImageUrl = accountLogo
      ? `https://s1.xrpl.to/address/${accountLogo}`
      : getHashIcon(accountLogin);
  }

  // Default button mode with popover
  // When no style prop is passed (global usage in _app.js), only render the Dialog
  // The button should only appear when explicitly placed somewhere with styling
  const showButton = style !== undefined;

  return (
    <div style={style}>
      {showButton && (
        <button
          onClick={() => {
            // Prevent closing if wallet setup is incomplete (backup, bridge, etc.)
            if (showNewWalletScreen && newWalletData) {
              // Force open the modal to resume setup
              if (!open && !openWalletModal) {
                setOpenWalletModal(true);
              }
              return;
            }
            if (accountProfile) {
              setOpen(!open);
            } else {
              setOpenWalletModal(true);
            }
          }}
          ref={anchorRef}
          aria-label={
            accountProfile
              ? `Wallet menu for ${truncateAccount(accountProfile.account)}`
              : 'Connect wallet'
          }
          className={cn(
            'group relative flex items-center justify-center gap-2.5 rounded-xl font-bold transition-all duration-300 active:scale-95',
            accountProfile ? 'h-9 min-w-[140px] px-4' : 'h-9 px-6',
            isDark
              ? accountProfile
                ? showNewWalletScreen && newWalletData
                  ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 ring-1 ring-amber-500/30 shadow-lg shadow-amber-500/10'
                  : 'bg-white/[0.05] text-white/90 hover:bg-white/[0.08] ring-1 ring-white/[0.08] hover:text-white shadow-xl shadow-black/20'
                : 'bg-primary/10 text-primary hover:bg-primary/20 ring-1 ring-primary/30 shadow-lg shadow-primary/10'
              : accountProfile
                ? showNewWalletScreen && newWalletData
                  ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 ring-1 ring-amber-200'
                  : 'bg-white text-gray-900 hover:bg-gray-50 ring-1 ring-gray-200 shadow-sm'
                : 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20'
          )}
          title={
            showNewWalletScreen && newWalletData
              ? 'Complete wallet setup'
              : accountProfile
                ? 'Account Details'
                : 'Connect Wallet'
          }
        >
          {/* Pending setup indicator */}
          {showNewWalletScreen && newWalletData && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-black" />
            </span>
          )}
          {accountProfile ? (
            <>
              <div className="relative flex-shrink-0">
                {(() => {
                  const masked = accountLogin ? `${accountLogin.slice(0, 6)}...${accountLogin.slice(-4)}` : null;
                  const avatarUrl = masked ? (walletAvatarCache.current || {})[masked] : null;
                  return (
                    <div className="w-5 h-5 rounded-full overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : accountProfile?.logo ? (
                        <img src={`https://s1.xrpl.to/address/${accountProfile.logo}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <img src={getHashIcon(accountLogin)} alt="" className="w-full h-full" />
                      )}
                    </div>
                  );
                })()}
                <div
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-[1.5px]',
                    isDark ? 'border-black' : 'border-white',
                    showNewWalletScreen && newWalletData
                      ? 'bg-amber-400'
                      : accountsActivation[accountLogin] === false && !parseFloat(accountBalance?.curr1?.value)
                        ? 'bg-red-500'
                        : 'bg-emerald-400'
                  )}
                />
              </div>
              <span className="font-mono text-[13px] tracking-tight transition-colors">
                {showNewWalletScreen && newWalletData ? 'SETUP' : truncateAccount(accountLogin, 6)}
              </span>
              <ChevronDown
                size={14}
                className={cn(
                  'transition-all duration-300',
                  open ? 'rotate-180' : '',
                  showNewWalletScreen && newWalletData
                    ? 'text-amber-500'
                    : isDark
                      ? 'text-white/30 group-hover:text-white/60'
                      : 'text-gray-400 group-hover:text-gray-600'
                )}
              />
            </>
          ) : (
            <>
              <span className={cn('text-[13px] font-bold uppercase tracking-wider', !isDark && 'text-white')}>Connect</span>
            </>
          )}
        </button>
      )}

      <Dialog
        open={!isAuthPage && (open || openWalletModal)}
        onClose={() => {
          // Block close if wallet setup is incomplete (backup screen, bridge form, etc.)
          if (showNewWalletScreen && newWalletData) return;
          // Block/warn if user is in the middle of password entry
          if (!accountProfile) {
            const hasProgress =
              (!hasExistingWallet && (createPassword || createPasswordConfirm)) ||
              (hasExistingWallet && unlockPassword);
            if (hasProgress) {
              if (!window.confirm('You have unsaved progress. Close anyway?')) return;
              setCreatePassword('');
              setCreatePasswordConfirm('');
              setCreateSeed('');
              setCreateMode('new');
              setUnlockPassword('');
            }
          }
          // Just close the modal
          setOpen(false);
          setOpenWalletModal(false);
        }}
        disableScrollLock={true}
        maxWidth="sm"
        fullWidth
        disableEnforceFocus
        disableAutoFocus
        disableRestoreFocus
        hideBackdrop
        TransitionProps={{ timeout: 0 }}
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: '12px',
            width: '380px',
            maxWidth: '380px',
            background: 'transparent',
            boxShadow: 'none',
            position: 'fixed',
            top: '60px',
            right: '12px',
            left: 'auto',
            transform: 'none !important',
            margin: 0
          },
          zIndex: 9999
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <StyledPopoverPaper isDark={isDark} isMobile={isMobileView}>
            {/* Show backup screen even when logged in */}
            {showNewWalletScreen && newWalletData ? (
              <div className={isDark ? 'text-white' : 'text-gray-900'}>
                {/* Header */}
                <div
                  className={cn(
                    'px-5 py-4 flex items-center justify-between',
                    isDark ? 'border-b border-white/[0.08]' : 'border-b border-gray-100'
                  )}
                >
                  <h2 className="text-[15px] font-medium tracking-tight">Wallet Created</h2>
                  <button
                    onClick={() => {
                      // X button disabled during entire setup - user must complete flow
                      return;
                    }}
                    className={cn(
                      'p-1.5 rounded-lg transition-all duration-150 relative opacity-30 cursor-not-allowed',
                      isDark ? 'text-white/30' : 'text-gray-400'
                    )}
                    title="Complete setup to close"
                  >
                    <XIcon size={16} />
                    <Lock size={8} className="absolute -bottom-0.5 -right-0.5 text-amber-500" />
                  </button>
                </div>

                {/* Backup Screen Content */}
                <div className="px-5 py-4 space-y-4">
                  {/* Success Header */}
                  <div className="text-center pb-2">
                    <div
                      className={cn(
                        'mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full',
                        'bg-emerald-500/15'
                      )}
                    >
                      <Check size={20} className="text-emerald-500" />
                    </div>
                    <h3
                      className={cn(
                        'text-[14px] font-medium',
                        isDark ? 'text-white' : 'text-gray-900'
                      )}
                    >
                      Wallet Created
                    </h3>
                    <p
                      className={cn(
                        'text-[11px] mt-0.5',
                        isDark ? 'text-white/40' : 'text-gray-400'
                      )}
                    >
                      Fund with 1+ XRP to activate
                    </p>
                  </div>

                  {/* Backup Warning */}
                  <div
                    className={cn('rounded-lg border p-3', 'border-amber-500/20 bg-amber-500/5')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle size={12} className="text-amber-500" />
                        <span
                          className={cn(
                            'text-[11px] font-medium',
                            isDark ? 'text-white' : 'text-gray-900'
                          )}
                        >
                          Backup Secret Key
                        </span>
                      </div>
                      {newSeedAvailable && (
                        <span className={cn('text-[10px] px-2 py-0.5 rounded', 'text-emerald-500 bg-emerald-500/10')}>
                          <Lock size={10} className="inline mr-1 -mt-0.5" />
                          Ready to copy
                        </span>
                      )}
                    </div>

                    {newSeedAvailable ? (
                      <div
                        className={cn(
                          'rounded border p-2 mb-2',
                          isDark ? 'border-white/10 bg-black/30' : 'border-gray-200 bg-white'
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => {
                              const seed = newWalletSeedRef.current;
                              if (!seed) return;
                              navigator.clipboard.writeText(seed);
                              setNewSeedCopied(true);
                              setTimeout(() => setNewSeedCopied(false), 2000);
                              // Clear clipboard after 30s
                              setTimeout(() => navigator.clipboard.writeText('').catch(() => {}), 30000);
                            }}
                            className={cn(
                              'w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium transition-colors',
                              newSeedCopied
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : isDark
                                  ? 'bg-white/[0.06] text-white/70 hover:bg-white/10'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            )}
                          >
                            {newSeedCopied ? <Check size={13} /> : <Copy size={13} />}
                            {newSeedCopied ? 'Copied to clipboard' : 'Copy secret key to clipboard'}
                          </button>
                        </div>
                        {newSeedCountdown > 0 && (
                          <p className={cn('text-[10px] text-center mt-1.5', newSeedCountdown <= 10 ? 'text-red-400' : 'opacity-40')}>
                            Available for {newSeedCountdown}s
                          </p>
                        )}
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'rounded border p-2 mb-2 text-center',
                          isDark ? 'border-white/10 bg-black/30' : 'border-gray-200 bg-white'
                        )}
                      >
                        <span
                          className={cn('text-[10px]', isDark ? 'text-white/30' : 'text-gray-400')}
                        >
                          {newWalletData?.address ? 'Seed expired — use Backup in account menu to view later' : 'Click "Reveal" to view'}
                        </span>
                      </div>
                    )}

                    <label className="flex cursor-pointer items-start gap-2">
                      <input
                        type="checkbox"
                        checked={backupConfirmed}
                        onChange={(e) => setBackupConfirmed(e.target.checked)}
                        className="mt-0.5 h-3.5 w-3.5 rounded accent-amber-500"
                      />
                      <span
                        className={cn(
                          'text-[10px] leading-relaxed',
                          isDark ? 'text-white/50' : 'text-gray-500'
                        )}
                      >
                        I've saved my secret key securely
                      </span>
                    </label>
                  </div>

                  {/* Wallet Address with QR */}
                  <div
                    className={cn(
                      'rounded-lg border p-3',
                      isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-gray-200 bg-gray-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white p-1.5">
                        <QRCode value={newWalletData.address} size={60} level="M" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-[9px] uppercase tracking-wide mb-1',
                            isDark ? 'text-white/30' : 'text-gray-400'
                          )}
                        >
                          Your Address
                        </p>
                        <div className="flex items-center gap-1.5">
                          <code
                            className={cn(
                              'text-[11px] font-mono truncate',
                              isDark ? 'text-white/70' : 'text-gray-700'
                            )}
                          >
                            {newWalletData.address.slice(0, 10)}...{newWalletData.address.slice(-6)}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(newWalletData.address);
                              setNewAddressCopied(true);
                              setTimeout(() => setNewAddressCopied(false), 2000);
                            }}
                            className={cn(
                              'p-1 rounded transition-colors',
                              newAddressCopied
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : isDark
                                  ? 'text-white/40 hover:text-white/60'
                                  : 'text-gray-400 hover:text-gray-600'
                            )}
                          >
                            {newAddressCopied ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons / Bridge Form */}
                  {showBridgeForm ? (
                    <div className="space-y-3 pt-1">
                      {bridgeData ? (
                        // Bridge created - show deposit address
                        <div className="space-y-3">
                          {/* Success indicator */}
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center">
                              <Check size={14} className="text-emerald-500" />
                            </div>
                            <span
                              className={cn(
                                'text-[12px] font-medium',
                                isDark ? 'text-white' : 'text-gray-900'
                              )}
                            >
                              Exchange Created
                            </span>
                          </div>

                          {/* Deposit info card */}
                          <div
                            className={cn(
                              'rounded-xl border p-3',
                              isDark
                                ? 'border-white/[0.08] bg-white/[0.02]'
                                : 'border-gray-200 bg-gray-50'
                            )}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {selectedCurrency?.image ? (
                                <img
                                  src={selectedCurrency.image}
                                  alt=""
                                  className="w-5 h-5 rounded-full"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center text-[9px] font-bold text-white">
                                  {selectedCurrency?.ticker?.[0]?.toUpperCase() || '?'}
                                </div>
                              )}
                              <span
                                className={cn(
                                  'text-[11px]',
                                  isDark ? 'text-white/60' : 'text-gray-600'
                                )}
                              >
                                Send {bridgeAmount} {selectedCurrency?.ticker?.toUpperCase()}
                              </span>
                              <ArrowLeftRight
                                size={12}
                                className={isDark ? 'text-white/30' : 'text-gray-400'}
                              />
                              <span className={cn('text-[11px] text-emerald-500 font-medium')}>
                                ~{bridgeData.expectedAmountTo || estimatedXrp || '?'} XRP
                              </span>
                            </div>

                            <p
                              className={cn(
                                'text-[9px] uppercase tracking-wide mb-1',
                                isDark ? 'text-white/30' : 'text-gray-400'
                              )}
                            >
                              Deposit Address
                            </p>
                            <div
                              className={cn(
                                'rounded-lg border p-2',
                                isDark ? 'border-white/10 bg-black/30' : 'border-gray-200 bg-white'
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <code
                                  className={cn(
                                    'text-[10px] font-mono break-all flex-1',
                                    isDark ? 'text-white/90' : 'text-gray-900'
                                  )}
                                >
                                  {bridgeData.payinAddress}
                                </code>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(bridgeData.payinAddress);
                                    setBridgeAddressCopied(true);
                                    setTimeout(() => setBridgeAddressCopied(false), 2000);
                                  }}
                                  className={cn(
                                    'flex-shrink-0 p-1.5 rounded-lg transition-colors',
                                    bridgeAddressCopied
                                      ? 'bg-emerald-500/15 text-emerald-500'
                                      : isDark
                                        ? 'bg-white/10 text-white/60 hover:bg-white/15'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  )}
                                >
                                  {bridgeAddressCopied ? <Check size={12} /> : <Copy size={12} />}
                                </button>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              window.open(`/bridge/${bridgeData.id}`, '_blank');
                              handleCompleteSetup();
                            }}
                            className="w-full py-2.5 rounded-lg text-[12px] font-medium bg-primary text-white hover:bg-primary/90 flex items-center justify-center gap-2"
                          >
                            <ExternalLink size={14} />
                            Track Exchange
                          </button>
                          <button
                            onClick={handleCompleteSetup}
                            className={cn(
                              'w-full py-2 rounded-lg text-[11px] transition-all',
                              isDark
                                ? 'text-white/50 hover:text-white/70'
                                : 'text-gray-500 hover:text-gray-700'
                            )}
                          >
                            Done
                          </button>
                        </div>
                      ) : (
                        // Bridge form
                        <>
                          {/* Currency Selector */}
                          <div className="relative">
                            <button
                              onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                              className={cn(
                                'w-full flex items-center justify-between p-3 rounded-lg border transition-colors',
                                isDark
                                  ? 'border-white/[0.08] bg-white/[0.02] hover:border-white/15'
                                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                              )}
                            >
                              {selectedCurrency ? (
                                <div className="flex items-center gap-2">
                                  {selectedCurrency.image && (
                                    <img
                                      src={selectedCurrency.image}
                                      alt=""
                                      className="w-5 h-5 rounded-full"
                                    />
                                  )}
                                  <span
                                    className={cn(
                                      'text-[13px] font-medium',
                                      isDark ? 'text-white' : 'text-gray-900'
                                    )}
                                  >
                                    {selectedCurrency.ticker.toUpperCase()}
                                  </span>
                                  <span
                                    className={cn(
                                      'text-[11px]',
                                      isDark ? 'text-white/40' : 'text-gray-400'
                                    )}
                                  >
                                    {selectedCurrency.name}
                                  </span>
                                </div>
                              ) : (
                                <span
                                  className={cn(
                                    'text-[13px]',
                                    isDark ? 'text-white/40' : 'text-gray-400'
                                  )}
                                >
                                  {currencies.length ? 'Select currency' : 'Loading...'}
                                </span>
                              )}
                              <ChevronDown
                                size={16}
                                className={cn(
                                  isDark ? 'text-white/40' : 'text-gray-400',
                                  showCurrencyDropdown && 'rotate-180'
                                )}
                              />
                            </button>

                            {showCurrencyDropdown && (
                              <div
                                className={cn(
                                  'absolute z-50 mt-1 w-full rounded-lg border shadow-lg max-h-[200px] overflow-hidden',
                                  isDark
                                    ? 'border-white/10 bg-[#1a1a1a]'
                                    : 'border-gray-200 bg-white'
                                )}
                              >
                                <div
                                  className={cn('p-2 border-b', isDark ? 'border-white/[0.06]' : 'border-[#e5e7eb]')}
                                >
                                  <input
                                    type="text"
                                    value={currencySearch}
                                    onChange={(e) => setCurrencySearch(e.target.value)}
                                    placeholder="Search..."
                                    autoFocus
                                    className={cn(
                                      'w-full px-2 py-1.5 rounded text-[12px] outline-none',
                                      isDark
                                        ? 'bg-white/5 text-white placeholder:text-white/30'
                                        : 'bg-gray-50 text-gray-900 placeholder:text-gray-400'
                                    )}
                                  />
                                </div>
                                <div className="overflow-y-auto max-h-[200px]">
                                  {(() => {
                                    const filtered = currencies.filter(
                                      (c) =>
                                        !currencySearch ||
                                        c.ticker
                                          .toLowerCase()
                                          .includes(currencySearch.toLowerCase()) ||
                                        c.name.toLowerCase().includes(currencySearch.toLowerCase())
                                    );
                                    const shown = filtered.slice(0, currencySearch ? 100 : 30);
                                    return shown.length === 0 ? (
                                      <div
                                        className={cn(
                                          'px-3 py-4 text-center text-[11px]',
                                          isDark ? 'text-white/30' : 'text-gray-400'
                                        )}
                                      >
                                        No results for "{currencySearch}"
                                      </div>
                                    ) : (
                                      shown.map((c) => (
                                        <button
                                          key={`${c.ticker}-${c.network}`}
                                          onClick={() => {
                                            setSelectedCurrency(c);
                                            setShowCurrencyDropdown(false);
                                            setCurrencySearch('');
                                            setEstimatedXrp(null);
                                          }}
                                          className={cn(
                                            'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
                                            selectedCurrency?.ticker === c.ticker &&
                                              selectedCurrency?.network === c.network
                                              ? isDark
                                                ? 'bg-white/10'
                                                : 'bg-blue-50'
                                              : isDark
                                                ? 'hover:bg-white/5'
                                                : 'hover:bg-gray-50'
                                          )}
                                        >
                                          {c.image && (
                                            <img
                                              src={c.image}
                                              alt=""
                                              className="w-5 h-5 rounded-full"
                                            />
                                          )}
                                          <span
                                            className={cn(
                                              'text-[12px] font-medium',
                                              isDark ? 'text-white' : 'text-gray-900'
                                            )}
                                          >
                                            {c.ticker.toUpperCase()}
                                          </span>
                                          <span
                                            className={cn(
                                              'text-[10px] flex-1',
                                              isDark ? 'text-white/30' : 'text-gray-400'
                                            )}
                                          >
                                            {c.name}
                                          </span>
                                          {c.network !== c.ticker && (
                                            <span
                                              className={cn(
                                                'text-[9px] px-1.5 py-0.5 rounded',
                                                isDark
                                                  ? 'bg-white/10 text-white/50'
                                                  : 'bg-gray-100 text-gray-500'
                                              )}
                                            >
                                              {c.network}
                                            </span>
                                          )}
                                        </button>
                                      ))
                                    );
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Amount Input */}
                          <div
                            className={cn(
                              'rounded-lg border p-3',
                              isDark
                                ? 'border-white/[0.06] bg-white/[0.02]'
                                : 'border-gray-100 bg-gray-50'
                            )}
                          >
                            <label
                              className={cn(
                                'text-[10px] uppercase tracking-wide',
                                isDark ? 'text-white/30' : 'text-gray-400'
                              )}
                            >
                              Amount
                            </label>
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="number"
                                value={bridgeAmount}
                                onChange={(e) => setBridgeAmount(e.target.value)}
                                placeholder={minAmount ? `Min: ${minAmount}` : '0.00'}
                                step="0.0001"
                                min="0"
                                className={cn(
                                  'flex-1 bg-transparent text-[18px] font-medium outline-none',
                                  isDark
                                    ? 'text-white placeholder:text-white/20'
                                    : 'text-gray-900 placeholder:text-gray-300'
                                )}
                              />
                              <span
                                className={cn(
                                  'text-[13px] font-medium',
                                  isDark ? 'text-white/50' : 'text-gray-500'
                                )}
                              >
                                {selectedCurrency?.ticker?.toUpperCase() || '---'}
                              </span>
                            </div>
                            {/* Estimate display */}
                            {estimatedXrp && (
                              <div
                                className={cn('flex items-center justify-between mt-2 pt-2 border-t', isDark ? 'border-white/[0.06]' : 'border-[#e5e7eb]')}
                              >
                                <span
                                  className={cn(
                                    'text-[10px]',
                                    isDark ? 'text-white/40' : 'text-gray-400'
                                  )}
                                >
                                  You'll receive
                                </span>
                                <span className={cn('text-[13px] font-medium text-emerald-500')}>
                                  ~{estimatedXrp} XRP
                                </span>
                              </div>
                            )}
                          </div>
                          {bridgeError && (
                            <div
                              className={cn(
                                'p-2 rounded-lg text-[11px]',
                                'bg-red-500/10 text-red-400 border border-red-500/20'
                              )}
                            >
                              {bridgeError}
                            </div>
                          )}
                          <button
                            onClick={handleCreateBridge}
                            disabled={
                              bridgeLoading || !bridgeAmount || !selectedCurrency || !estimatedXrp
                            }
                            className={cn(
                              'w-full py-2.5 rounded-lg text-[12px] font-medium transition-all flex items-center justify-center gap-2',
                              bridgeAmount && selectedCurrency && estimatedXrp
                                ? 'bg-primary text-white hover:bg-primary/90'
                                : isDark
                                  ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            )}
                          >
                            {bridgeLoading ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <>
                                <ArrowLeftRight size={14} />
                                {estimatedXrp ? `Swap to ~${estimatedXrp} XRP` : 'Enter amount'}
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setShowBridgeForm(false)}
                            className={cn(
                              'w-full py-2 rounded-lg text-[11px] transition-all',
                              isDark
                                ? 'text-white/50 hover:text-white/70'
                                : 'text-gray-500 hover:text-gray-700'
                            )}
                          >
                            Back
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <button
                        onClick={handleShowBridge}
                        disabled={!backupConfirmed}
                        className={cn(
                          'w-full py-2.5 rounded-lg text-[12px] font-medium transition-all flex items-center justify-center gap-2',
                          backupConfirmed
                            ? 'bg-primary text-white hover:bg-primary/90'
                            : isDark
                              ? 'bg-white/5 text-white/30 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        )}
                      >
                        <ArrowLeftRight size={14} />
                        Fund with Crypto Swap
                      </button>
                      <button
                        onClick={handleCompleteSetup}
                        disabled={!backupConfirmed}
                        className={cn(
                          'w-full py-2 rounded-lg text-[11px] transition-all',
                          backupConfirmed
                            ? isDark
                              ? 'text-white/50 hover:text-white/70'
                              : 'text-gray-500 hover:text-gray-700'
                            : isDark
                              ? 'text-white/20 cursor-not-allowed'
                              : 'text-gray-300 cursor-not-allowed'
                        )}
                      >
                        Skip, I'll fund later
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : accountProfile ? (
              <>
                {!showSeedDialog && !showNewAccountFlow ? (
                  <WalletContent
                    theme={theme}
                    isDark={isDark}
                    accountLogin={accountLogin}
                    accountBalance={accountBalance}
                    accountTotalXrp={accountTotalXrp}
                    accountsActivation={accountsActivation}
                    profiles={profiles}
                    onClose={() => {
                      setOpen(false);
                      setOpenWalletModal(false);
                    }}
                    onAccountSwitch={(account) => {
                      if (account !== accountProfile?.account) {
                        setOpen(false);
                        requestAnimationFrame(() => {
                          setActiveProfile(account);
                        });
                      }
                    }}
                    onLogout={() => {
                      handleLogout();
                      setOpen(false);
                    }}
                    onRemoveProfile={removeProfile}
                    onBackupSeed={handleBackupSeed}
                    openSnackbar={openSnackbar}
                    accountProfile={accountProfile}
                    isEmbedded={false}
                    showSeedDialog={showSeedDialog}
                    seedAuthStatus={seedAuthStatus}
                    seedPassword={seedPassword}
                    setSeedPassword={setSeedPassword}
                    showSeedPassword={showSeedPassword}
                    setShowSeedPassword={setShowSeedPassword}
                    handleSeedPasswordSubmit={handleSeedPasswordSubmit}
                    setShowSeedDialog={setShowSeedDialog}
                    setSeedAuthStatus={setSeedAuthStatus}
                    onCreateNewAccount={() => setShowNewAccountFlow(true)}
                    walletPage={walletPage}
                    setWalletPage={setWalletPage}
                    walletsPerPage={walletsPerPage}
                    walletStorage={walletStorage}
                    showBridgeInDropdown={showBridgeInDropdown}
                    setShowBridgeInDropdown={setShowBridgeInDropdown}
                    currencies={currencies}
                    selectedCurrency={selectedCurrency}
                    setSelectedCurrency={setSelectedCurrency}
                    bridgeAmount={bridgeAmount}
                    setBridgeAmount={setBridgeAmount}
                    bridgeLoading={bridgeLoading}
                    bridgeData={bridgeData}
                    setBridgeData={setBridgeData}
                    bridgeError={bridgeError}
                    bridgeAddressCopied={bridgeAddressCopied}
                    setBridgeAddressCopied={setBridgeAddressCopied}
                    estimatedXrp={estimatedXrp}
                    minAmount={minAmount}
                    showCurrencyDropdown={showCurrencyDropdown}
                    setShowCurrencyDropdown={setShowCurrencyDropdown}
                    currencySearch={currencySearch}
                    setCurrencySearch={setCurrencySearch}
                    handleCreateBridge={handleCreateBridge}
                    initBridgeForm={initBridgeForm}
                    swapDirection={swapDirection}
                    setSwapDirection={setSwapDirection}
                    destAddress={destAddress}
                    setDestAddress={setDestAddress}
                    onQrSyncExport={() => {
                      setShowSeedDialog(true);
                      setQrSyncFromManage(true);
                      setQrSyncMode('export');
                      setSeedAuthStatus('qr-sync-password');
                      setQrSyncPassword('');
                      setQrSyncError('');
                      setQrSyncData('');
                    }}
                    onQrSyncImport={() => {
                      setShowSeedDialog(true);
                      setQrSyncFromManage(true);
                      setQrSyncMode('import');
                      setSeedAuthStatus('qr-sync-import');
                      setQrSyncPassword('');
                      setQrSyncError('');
                      setQrImportData('');
                    }}
                  />
                ) : showNewAccountFlow ? (
                  <div className={cn('p-5', isDark ? 'text-white' : 'text-gray-900')}>
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium">Add Account</h3>
                        <button
                          onClick={() => {
                            setShowNewAccountFlow(false);
                            setNewAccountPassword('');
                            setNewAccountSeed('');
                            setNewAccountMode('new');
                            clearPersistedState();
                          }}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            isDark
                              ? 'hover:bg-white/5 text-white/40 hover:text-white/60'
                              : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                          )}
                        >
                          <XIcon size={16} />
                        </button>
                      </div>

                      {/* Mode Toggle */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setNewAccountMode('new')}
                          className={cn(
                            'flex-1 rounded-lg border-[1.5px] px-3 py-2 text-[13px] font-normal transition-colors',
                            newAccountMode === 'new'
                              ? 'border-primary bg-primary text-white'
                              : isDark
                                ? 'border-[#3f96fe]/20 text-white hover:border-[#3f96fe]/40'
                                : 'border-blue-200 text-gray-900 hover:bg-blue-50'
                          )}
                        >
                          New
                        </button>
                        <button
                          onClick={() => setNewAccountMode('import')}
                          className={cn(
                            'flex-1 rounded-lg border-[1.5px] px-3 py-2 text-[13px] font-normal transition-colors',
                            newAccountMode === 'import'
                              ? 'border-primary bg-primary text-white'
                              : isDark
                                ? 'border-[#3f96fe]/20 text-white hover:border-[#3f96fe]/40'
                                : 'border-blue-200 text-gray-900 hover:bg-blue-50'
                          )}
                        >
                          Import Seed
                        </button>
                      </div>

                      {/* Seed Input (import mode only) */}
                      {newAccountMode === 'import' && (
                        <div className="space-y-2">
                          <label
                            className={cn(
                              'text-xs font-medium',
                              isDark ? 'text-white/60' : 'text-gray-500'
                            )}
                          >
                            Seed
                          </label>
                          {(() => {
                            const validation = validateSeed(newAccountSeed);
                            const hasInput = newAccountSeed.trim().length > 0;
                            return (
                              <>
                                <input
                                  type="text"
                                  placeholder='Enter seed (starts with "s")'
                                  value={newAccountSeed}
                                  onChange={(e) => setNewAccountSeed(e.target.value)}
                                  className={cn(
                                    'w-full px-4 py-3 rounded-xl text-sm font-mono outline-none transition-all',
                                    hasInput && !validation.valid
                                      ? 'border-red-500/50 focus:border-red-500'
                                      : hasInput && validation.valid
                                        ? 'border-green-500/50 focus:border-green-500'
                                        : isDark
                                          ? 'border-[#3f96fe]/20 focus:border-[#3f96fe]/50'
                                          : 'border-blue-200 focus:border-[#3f96fe]',
                                    isDark
                                      ? 'bg-white/[0.03] border text-white placeholder:text-white/30'
                                      : 'bg-white border text-gray-900 placeholder:text-gray-400'
                                  )}
                                />
                                {hasInput && validation.error && (
                                  <p className="text-[11px] text-red-500">{validation.error}</p>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {/* Password Input */}
                      <div className="space-y-2">
                        <label
                          className={cn(
                            'text-xs font-medium',
                            isDark ? 'text-white/60' : 'text-gray-500'
                          )}
                        >
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showNewAccountPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            value={newAccountPassword}
                            onChange={(e) => setNewAccountPassword(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === 'Enter' &&
                              newAccountPassword &&
                              (newAccountMode === 'new' || validateSeed(newAccountSeed).valid) &&
                              handleCreateNewAccount()
                            }
                            autoFocus={newAccountMode === 'new'}
                            autoComplete="off"
                            className={cn(
                              'w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all',
                              isDark
                                ? 'bg-white/[0.04] border border-[#3f96fe]/20 text-white placeholder:text-white/30 focus:border-[#3f96fe]/50'
                                : 'bg-white border border-blue-200 text-gray-900 placeholder:text-gray-400 focus:border-[#3f96fe]'
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewAccountPassword(!showNewAccountPassword)}
                            className={cn(
                              'absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors',
                              isDark
                                ? 'text-white/40 hover:text-white/60'
                                : 'text-gray-400 hover:text-gray-600'
                            )}
                          >
                            {showNewAccountPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-1">
                        <button
                          onClick={() => {
                            setShowNewAccountFlow(false);
                            setNewAccountPassword('');
                            setNewAccountSeed('');
                            setNewAccountMode('new');
                            clearPersistedState();
                          }}
                          className={cn(
                            'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all',
                            isDark
                              ? 'text-white/60 hover:bg-white/5 ring-1 ring-white/10'
                              : 'text-gray-600 hover:bg-gray-50 ring-1 ring-gray-200'
                          )}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateNewAccount}
                          disabled={
                            !newAccountPassword ||
                            (newAccountMode === 'import' && !validateSeed(newAccountSeed).valid)
                          }
                          className={cn(
                            'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2',
                            newAccountPassword &&
                              (newAccountMode === 'new' || validateSeed(newAccountSeed).valid)
                              ? 'bg-primary text-white hover:bg-primary/90'
                              : isDark
                                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          )}
                        >
                          <Plus size={14} />
                          {newAccountMode === 'import' ? 'Import' : 'Create'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={cn(
                          'text-[14px] font-medium',
                          isDark ? 'text-white' : 'text-gray-900'
                        )}
                      >
                        Backup
                      </span>
                      <button
                        onClick={() => {
                          setShowSeedDialog(false);
                          setSeedAuthStatus('idle');
                          setDisplaySeed('');
                          setSeedBlurred(true);
                          setSeedWarningAgreed(false);
                          setSeedWarningText('');
                          setBackupMode(null);
                          setSeedPassword('');
                          setBackupTargetProfile(null);
                          setQrSyncFromManage(false);
                        }}
                        className={cn(
                          'p-1 rounded-md transition-colors',
                          isDark
                            ? 'text-white/40 hover:text-white'
                            : 'text-gray-400 hover:text-gray-600'
                        )}
                      >
                        <XIcon size={14} />
                      </button>
                    </div>

                    {seedAuthStatus === 'select-mode' && (
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            setBackupMode('seed');
                            setSeedAuthStatus('password-required');
                          }}
                          className={cn(
                            'w-full flex items-center justify-between p-3 rounded-lg border-[1.5px] transition-colors',
                            isDark
                              ? 'border-[#3f96fe]/20 hover:border-[#3f96fe]/40 hover:bg-[#3f96fe]/5'
                              : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50'
                          )}
                        >
                          <span
                            className={cn('text-[13px]', isDark ? 'text-white' : 'text-gray-900')}
                          >
                            View Seed
                          </span>
                          <span
                            className={cn(
                              'text-[11px]',
                              isDark ? 'text-white/40' : 'text-gray-400'
                            )}
                          >
                            Wallet{' '}
                            {profiles.findIndex(
                              (p) =>
                                p.account ===
                                (backupTargetProfile?.account || accountProfile?.account)
                            ) + 1}
                          </span>
                        </button>
                        {/* QR Sync - Transfer wallet between devices */}
                        <div className="pt-2 mt-2 border-t border-white/10">
                          <p
                            className={cn(
                              'text-[11px] mb-2',
                              isDark ? 'text-white/40' : 'text-gray-400'
                            )}
                          >
                            Transfer to another device
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setQrSyncMode('export');
                                setSeedAuthStatus('qr-sync-password');
                                setQrSyncPassword('');
                                setQrSyncError('');
                                setQrSyncData('');
                              }}
                              className={cn(
                                'flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-lg border-[1.5px] transition-colors',
                                isDark
                                  ? 'border-[#3f96fe]/20 hover:border-[#3f96fe]/40 hover:bg-[#3f96fe]/5'
                                  : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50'
                              )}
                            >
                              <QrCode size={14} className={isDark ? 'text-white/70' : 'text-gray-600'} />
                              <span className={cn('text-[12px]', isDark ? 'text-white' : 'text-gray-900')}>
                                Export QR
                              </span>
                            </button>
                            <button
                              onClick={() => {
                                setQrSyncMode('import');
                                setSeedAuthStatus('qr-sync-import');
                                setQrSyncPassword('');
                                setQrSyncError('');
                                setQrImportData('');
                              }}
                              className={cn(
                                'flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-lg border-[1.5px] transition-colors',
                                isDark
                                  ? 'border-[#3f96fe]/20 hover:border-[#3f96fe]/40 hover:bg-[#3f96fe]/5'
                                  : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50'
                              )}
                            >
                              <Download size={14} className={isDark ? 'text-white/70' : 'text-gray-600'} />
                              <span className={cn('text-[12px]', isDark ? 'text-white' : 'text-gray-900')}>
                                Import QR
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {seedAuthStatus === 'password-required' && backupMode === 'seed' && (
                      <div className="space-y-3">
                        <div
                          className={cn(
                            'p-3 rounded-lg',
                            isDark
                              ? 'bg-red-500/10 border border-red-500/20'
                              : 'bg-red-50 border border-red-200'
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <AlertTriangle size={14} className={isDark ? 'text-red-400' : 'text-red-600'} />
                            <p className={cn('text-[12px] font-semibold', isDark ? 'text-red-400' : 'text-red-600')}>
                              Never share your seed with anyone
                            </p>
                          </div>
                          <p
                            className={cn(
                              'text-[11px] leading-relaxed',
                              isDark ? 'text-white/60' : 'text-gray-600'
                            )}
                          >
                            Anyone with your seed has full control of your wallet and can steal your funds. No support agent, developer, or website will ever ask for it.
                          </p>
                        </div>

                        <div
                          className={cn(
                            'p-3 rounded-lg',
                            isDark
                              ? 'bg-amber-500/10 border border-amber-500/20'
                              : 'bg-amber-50 border border-amber-200'
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <WifiOff size={14} className="text-amber-500" />
                            <p className={cn('text-[12px] font-semibold', isDark ? 'text-amber-400' : 'text-amber-600')}>
                              Store offline only
                            </p>
                          </div>
                          <p
                            className={cn(
                              'text-[11px] leading-relaxed',
                              isDark ? 'text-white/60' : 'text-gray-600'
                            )}
                          >
                            Write it down on paper or store on a device that is not connected to the internet. Never save in cloud storage, email, or screenshots.
                          </p>
                        </div>

                        <div
                          className={cn(
                            'p-3 rounded-lg',
                            isDark
                              ? 'bg-purple-500/10 border border-purple-500/20'
                              : 'bg-purple-50 border border-purple-200'
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <Shield size={14} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                            <p className={cn('text-[12px] font-semibold', isDark ? 'text-purple-400' : 'text-purple-600')}>
                              Do not import into other apps
                            </p>
                          </div>
                          <p
                            className={cn(
                              'text-[11px] leading-relaxed',
                              isDark ? 'text-white/60' : 'text-gray-600'
                            )}
                          >
                            Importing your seed into another application risks contamination. Always create a new account when interacting with a new service or app.
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <p
                            className={cn(
                              'text-[11px] leading-relaxed',
                              isDark ? 'text-white/50' : 'text-gray-500'
                            )}
                          >
                            Type <span className={cn('font-medium', isDark ? 'text-amber-400' : 'text-amber-600')}>I understand</span> to confirm you have read the warnings above
                          </p>
                          <input
                            type="text"
                            value={seedWarningText}
                            onChange={(e) => {
                              setSeedWarningText(e.target.value);
                              setSeedWarningAgreed(e.target.value.trim().toLowerCase() === 'i understand');
                            }}
                            placeholder="Type here..."
                            autoComplete="off"
                            className={cn(
                              'w-full px-2.5 py-1.5 rounded-md border-[1.5px] text-[11px] outline-none transition-colors',
                              seedWarningAgreed
                                ? 'border-emerald-500/40 bg-emerald-500/5'
                                : isDark
                                  ? 'border-white/10 bg-black/30 text-white/80 placeholder:text-white/20'
                                  : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-300'
                            )}
                          />
                        </div>

                        <div>
                          <p
                            className={cn(
                              'text-[11px] mb-1.5',
                              isDark ? 'text-white/50' : 'text-gray-500'
                            )}
                          >
                            Enter password to view seed
                          </p>
                          <div className="relative">
                            <input
                              type={showSeedPassword ? 'text' : 'password'}
                              placeholder="Password"
                              value={seedPassword}
                              onChange={(e) => setSeedPassword(e.target.value)}
                              onKeyDown={(e) =>
                                e.key === 'Enter' && seedWarningAgreed && handleSeedPasswordSubmit()
                              }
                              autoFocus
                              autoComplete="off"
                              className={cn(
                                'w-full px-3 py-2 pr-10 rounded-lg border-[1.5px] text-[13px] outline-none transition-colors',
                                isDark
                                  ? 'bg-white/[0.04] border-[#3f96fe]/20 text-white placeholder:text-white/30 focus:border-[#3f96fe]'
                                  : 'bg-white border-blue-200 text-gray-900 placeholder:text-gray-400 focus:border-[#3f96fe]'
                              )}
                            />
                            <button
                              type="button"
                              onClick={() => setShowSeedPassword(!showSeedPassword)}
                              className={cn(
                                'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded',
                                isDark
                                  ? 'text-white/50 hover:text-white'
                                  : 'text-gray-400 hover:text-gray-600'
                              )}
                            >
                              {showSeedPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setShowSeedDialog(false);
                              setSeedAuthStatus('idle');
                              setDisplaySeed('');
                              setSeedPassword('');
                              setShowSeedPassword(false);
                              setSeedWarningAgreed(false);
                              setSeedWarningText('');
                              setBackupTargetProfile(null);
                            }}
                            className={cn(
                              'px-3 py-1.5 rounded-lg border-[1.5px] text-[13px] font-normal transition-colors',
                              isDark
                                ? 'border-[#3f96fe]/20 text-white hover:bg-[#3f96fe]/5'
                                : 'border-blue-200 text-gray-700 hover:bg-blue-50'
                            )}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSeedPasswordSubmit}
                            disabled={!seedPassword || !seedWarningAgreed}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-[13px] font-normal text-white transition-colors',
                              seedPassword && seedWarningAgreed
                                ? 'bg-primary hover:bg-primary/90'
                                : 'bg-primary/50 cursor-not-allowed'
                            )}
                          >
                            View Seed
                          </button>
                        </div>
                      </div>
                    )}

                    {seedAuthStatus === 'success' && (
                      <div className="space-y-2">
                        <div
                          className={cn(
                            'p-2.5 rounded-lg',
                            isDark
                              ? 'bg-red-500/10 border border-red-500/20'
                              : 'bg-red-50 border border-red-200'
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <AlertTriangle size={13} className={cn('flex-shrink-0 mt-0.5', isDark ? 'text-red-400' : 'text-red-600')} />
                            <div>
                              <p
                                className={cn('text-[11px] font-semibold mb-0.5', isDark ? 'text-red-400' : 'text-red-600')}
                              >
                                Do not share or import into other apps
                              </p>
                              <p
                                className={cn('text-[10px] leading-relaxed', isDark ? 'text-red-400/70' : 'text-red-500')}
                              >
                                Store offline only. Create a new account for each service. If lost, funds are permanently unrecoverable.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div
                          onClick={seedBlurred ? () => setSeedBlurred(false) : undefined}
                          title={seedBlurred ? 'Click to reveal' : ''}
                          className={cn(
                            'p-3 rounded-lg font-mono text-[11px] break-all leading-relaxed',
                            isDark
                              ? 'bg-white/[0.04] border border-[#3f96fe]/20'
                              : 'bg-gray-50 border border-blue-200',
                            seedBlurred && 'blur-[5px] cursor-pointer select-none'
                          )}
                        >
                          {displaySeed}
                        </div>

                        {seedCountdown > 0 && (
                          <p className={cn('text-[10px] text-center', seedCountdown <= 10 ? 'text-red-400' : 'opacity-40')}>
                            Auto-clearing in {seedCountdown}s
                          </p>
                        )}

                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(displaySeed).then(() => {
                                openSnackbar('Seed copied - clipboard clears in 30s', 'success');
                                setTimeout(() => navigator.clipboard.writeText('').catch(() => {}), 30000);
                              });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-[11px] transition-colors"
                          >
                            Copy Seed
                          </button>
                          <button
                            onClick={() => setSeedBlurred(!seedBlurred)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg border-[1.5px] text-[11px] transition-colors',
                              isDark
                                ? 'border-[#3f96fe]/20 text-white hover:bg-[#3f96fe]/5'
                                : 'border-blue-200 text-gray-700 hover:bg-blue-50'
                            )}
                          >
                            {seedBlurred ? 'Show' : 'Hide'}
                          </button>
                        </div>
                      </div>
                    )}

                    {seedAuthStatus === 'error' && (
                      <div
                        className={cn(
                          'p-3 rounded-lg text-[12px]',
                          isDark
                            ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                            : 'bg-red-50 border border-red-200 text-red-600'
                        )}
                      >
                        Authentication failed. Please try again.
                      </div>
                    )}

                    {/* QR Sync - Export: Password Entry */}
                    {seedAuthStatus === 'qr-sync-password' && qrSyncMode === 'export' && (
                      <div className="space-y-3">
                        {(() => {
                          const exportAccount = (backupTargetProfile || accountProfile)?.account || (backupTargetProfile || accountProfile)?.address;
                          const maskedAddr = exportAccount ? `${exportAccount.slice(0, 6)}...${exportAccount.slice(-4)}` : null;
                          const avatarUrl = maskedAddr ? (walletAvatarCache.current || {})[maskedAddr] : null;
                          return exportAccount ? (
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'w-10 h-10 rounded-xl overflow-hidden border-[1.5px] flex-shrink-0',
                                isDark ? 'border-white/10' : 'border-gray-200'
                              )}>
                                {avatarUrl ? (
                                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className={cn(
                                    'w-full h-full flex items-center justify-center text-[14px] font-bold',
                                    isDark ? 'bg-white/5 text-white/30' : 'bg-gray-100 text-gray-400'
                                  )}>
                                    {exportAccount.slice(1, 3)}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className={cn('text-[12px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                                  Exporting Account
                                </p>
                                <p className={cn('text-[11px] font-mono', isDark ? 'text-white/40' : 'text-gray-400')}>
                                  {maskedAddr}
                                </p>
                              </div>
                            </div>
                          ) : null;
                        })()}
                        <div
                          className={cn(
                            'p-3 rounded-lg',
                            isDark
                              ? 'bg-blue-500/10 border border-blue-500/20'
                              : 'bg-blue-50 border border-blue-200'
                          )}
                        >
                          <p className={cn('text-[12px]', isDark ? 'text-blue-400' : 'text-blue-600')}>
                            Generate a QR code to transfer this wallet to another device.
                          </p>
                          <p className={cn('text-[11px] mt-1', isDark ? 'text-white/50' : 'text-gray-500')}>
                            QR expires in 5 minutes. Same password required on both devices.
                          </p>
                        </div>

                        <div
                          className={cn(
                            'p-3 rounded-lg',
                            isDark
                              ? 'bg-red-500/10 border border-red-500/20'
                              : 'bg-red-50 border border-red-200'
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle size={13} className={isDark ? 'text-red-400' : 'text-red-600'} />
                            <p className={cn('text-[11px] font-semibold', isDark ? 'text-red-400' : 'text-red-600')}>
                              Only import on xrpl.to
                            </p>
                          </div>
                          <p className={cn('text-[10px] leading-relaxed', isDark ? 'text-red-400/70' : 'text-red-500')}>
                            Only scan this QR on the official site. Impersonating sites may steal your wallet. Always make sure you're on <span className="font-semibold">xrpl.to</span> before importing.
                          </p>
                        </div>

                        <div>
                          <p className={cn('text-[11px] mb-1.5', isDark ? 'text-white/50' : 'text-gray-500')}>
                            Enter your wallet password
                          </p>
                          <div className="relative">
                            <input
                              type={showQrSyncPassword ? 'text' : 'password'}
                              placeholder="Password"
                              value={qrSyncPassword}
                              onChange={(e) => {
                                setQrSyncPassword(e.target.value);
                                setQrSyncError('');
                              }}
                              onKeyDown={(e) => e.key === 'Enter' && qrSyncPassword && handleQrExport()}
                              autoFocus
                              autoComplete="off"
                              className={cn(
                                'w-full px-3 py-2 pr-10 rounded-lg border-[1.5px] text-[13px] outline-none transition-colors',
                                isDark
                                  ? 'bg-white/[0.04] border-[#3f96fe]/20 text-white placeholder:text-white/30 focus:border-[#3f96fe]'
                                  : 'bg-white border-blue-200 text-gray-900 placeholder:text-gray-400 focus:border-[#3f96fe]'
                              )}
                            />
                            <button
                              type="button"
                              onClick={() => setShowQrSyncPassword(!showQrSyncPassword)}
                              className={cn(
                                'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded',
                                isDark ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                              )}
                            >
                              {showQrSyncPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>

                        {qrSyncError && (
                          <p className="text-[11px] text-red-500">{qrSyncError}</p>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (qrSyncFromManage) {
                                setShowSeedDialog(false);
                                setQrSyncFromManage(false);
                                setQrSyncMode(null);
                                setQrSyncPassword('');
                                setSeedAuthStatus('idle');
                              } else {
                                setSeedAuthStatus('select-mode');
                                setQrSyncMode(null);
                                setQrSyncPassword('');
                              }
                            }}
                            className={cn(
                              'px-3 py-1.5 rounded-lg border-[1.5px] text-[13px] transition-colors',
                              isDark
                                ? 'border-[#3f96fe]/20 text-white hover:bg-[#3f96fe]/5'
                                : 'border-blue-200 text-gray-700 hover:bg-blue-50'
                            )}
                          >
                            Back
                          </button>
                          <button
                            onClick={handleQrExport}
                            disabled={!qrSyncPassword || qrSyncLoading}
                            className={cn(
                              'flex-1 px-3 py-1.5 rounded-lg text-[13px] font-normal text-white transition-colors flex items-center justify-center gap-2',
                              qrSyncPassword && !qrSyncLoading
                                ? 'bg-primary hover:bg-primary/90'
                                : 'bg-primary/50 cursor-not-allowed'
                            )}
                          >
                            {qrSyncLoading ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <>
                                <QrCode size={14} />
                                Generate QR
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* QR Sync - Export: Display QR Code */}
                    {seedAuthStatus === 'qr-sync-display' && qrSyncData && (
                      <div className="space-y-3">
                        {(() => {
                          const exportAccount = (backupTargetProfile || accountProfile)?.account || (backupTargetProfile || accountProfile)?.address;
                          const maskedAddr = exportAccount ? `${exportAccount.slice(0, 6)}...${exportAccount.slice(-4)}` : null;
                          const avatarUrl = maskedAddr ? (walletAvatarCache.current || {})[maskedAddr] : null;
                          return exportAccount ? (
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'w-10 h-10 rounded-xl overflow-hidden border-[1.5px] flex-shrink-0',
                                isDark ? 'border-white/10' : 'border-gray-200'
                              )}>
                                {avatarUrl ? (
                                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className={cn(
                                    'w-full h-full flex items-center justify-center text-[14px] font-bold',
                                    isDark ? 'bg-white/5 text-white/30' : 'bg-gray-100 text-gray-400'
                                  )}>
                                    {exportAccount.slice(1, 3)}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className={cn('text-[12px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                                  Exporting Account
                                </p>
                                <p className={cn('text-[11px] font-mono', isDark ? 'text-white/40' : 'text-gray-400')}>
                                  {maskedAddr}
                                </p>
                              </div>
                            </div>
                          ) : null;
                        })()}
                        <div
                          className={cn(
                            'p-3 rounded-lg',
                            isDark
                              ? 'bg-amber-500/10 border border-amber-500/20'
                              : 'bg-amber-50 border border-amber-200'
                          )}
                        >
                          <p className={cn('text-[12px] font-medium', isDark ? 'text-amber-400' : 'text-amber-600')}>
                            Scan on your other device
                          </p>
                          <p className={cn('text-[11px] mt-1', isDark ? 'text-white/50' : 'text-gray-500')}>
                            {qrCountdown > 0 ? `Expires in ${qrCountdown}s` : 'Generating...'}
                          </p>
                        </div>

                        <div className={cn(
                          'p-4 rounded-lg flex justify-center',
                          isDark ? 'bg-white' : 'bg-gray-50'
                        )}>
                          <QRCode
                            value={qrSyncData}
                            size={200}
                            level="M"
                            bgColor="transparent"
                            fgColor={isDark ? '#000000' : '#1f2937'}
                          />
                        </div>

                        <p className={cn('text-[10px] text-center', isDark ? 'text-white/40' : 'text-gray-400')}>
                          Or copy and paste the code manually
                        </p>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(qrSyncData);
                              openSnackbar('QR data copied', 'success');
                            }}
                            className={cn(
                              'flex-1 px-3 py-1.5 rounded-lg border-[1.5px] text-[13px] transition-colors flex items-center justify-center gap-1.5',
                              isDark
                                ? 'border-[#3f96fe]/20 text-white hover:bg-[#3f96fe]/5'
                                : 'border-blue-200 text-gray-700 hover:bg-blue-50'
                            )}
                          >
                            <Copy size={14} />
                            Copy
                          </button>
                          <button
                            onClick={() => {
                              if (qrSyncFromManage) {
                                setShowSeedDialog(false);
                                setQrSyncFromManage(false);
                                setSeedAuthStatus('idle');
                              } else {
                                setSeedAuthStatus('select-mode');
                              }
                              setQrSyncMode(null);
                              setQrSyncData('');
                              setQrSyncExpiry(null);
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-[13px] transition-colors"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}

                    {/* QR Sync - Import: Scan or Paste Data & Password */}
                    {seedAuthStatus === 'qr-sync-import' && qrSyncMode === 'import' && (
                      <div className="space-y-3">
                        <div
                          className={cn(
                            'p-3 rounded-lg',
                            isDark
                              ? 'bg-blue-500/10 border border-blue-500/20'
                              : 'bg-blue-50 border border-blue-200'
                          )}
                        >
                          <p className={cn('text-[12px]', isDark ? 'text-blue-400' : 'text-blue-600')}>
                            Import wallet from another device
                          </p>
                          <p className={cn('text-[11px] mt-1', isDark ? 'text-white/50' : 'text-gray-500')}>
                            Scan the QR code or paste the data manually.
                          </p>
                        </div>

                        {/* QR Scanner Camera View */}
                        {qrScannerActive ? (
                          <div className="space-y-2">
                            <div className={cn(
                              'relative rounded-lg overflow-hidden',
                              isDark ? 'bg-black' : 'bg-gray-900'
                            )}>
                              {/* Camera video container */}
                              <div
                                id="qr-video-container"
                                className="w-full bg-black h-[180px] min-h-[180px]"
                              />
                              {/* Scanning overlay */}
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-40 h-40 border-2 border-white/50 rounded-lg">
                                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br-lg" />
                                </div>
                              </div>
                              <p className="absolute bottom-2 left-0 right-0 text-center text-[11px] text-white/70 animate-pulse">
                                Scanning... Point at QR code
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={captureAndScanPhoto}
                                className={cn(
                                  'flex-1 py-2 rounded-lg text-[12px] font-medium transition-colors',
                                  isDark
                                    ? 'bg-primary text-white hover:bg-primary/90'
                                    : 'bg-primary text-white hover:bg-primary/90'
                                )}
                              >
                                📸 Capture
                              </button>
                              <label
                                className={cn(
                                  'flex-1 py-2 rounded-lg text-[12px] font-medium transition-colors text-center cursor-pointer',
                                  isDark
                                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                )}
                              >
                                📁 Upload
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      stopQrScanner();
                                      scanQrFromFile(file);
                                    }
                                    e.target.value = '';
                                  }}
                                />
                              </label>
                              <button
                                onClick={stopQrScanner}
                                className={cn(
                                  'px-4 py-2 rounded-lg text-[12px] font-medium transition-colors',
                                  isDark
                                    ? 'bg-white/10 text-white hover:bg-white/15'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                )}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Scan Button */}
                            <button
                              onClick={startQrScanner}
                              className={cn(
                                'w-full flex items-center justify-center gap-2 py-3 rounded-lg text-[13px] font-medium transition-colors',
                                isDark
                                  ? 'bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30'
                                  : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'
                              )}
                            >
                              <Camera size={18} />
                              Scan QR Code
                            </button>

                            {/* Divider */}
                            <div className="flex items-center gap-3">
                              <div className={cn('flex-1 h-px', isDark ? 'bg-white/10' : 'bg-gray-200')} />
                              <span className={cn('text-[11px]', isDark ? 'text-white/30' : 'text-gray-400')}>or paste manually</span>
                              <div className={cn('flex-1 h-px', isDark ? 'bg-white/10' : 'bg-gray-200')} />
                            </div>

                            {/* Manual Paste */}
                            <textarea
                              placeholder="XRPL:..."
                              value={qrImportData}
                              onChange={(e) => {
                                setQrImportData(e.target.value);
                                setQrSyncError('');
                              }}
                              rows={2}
                              className={cn(
                                'w-full px-3 py-2 rounded-lg border-[1.5px] text-[12px] font-mono outline-none transition-colors resize-none',
                                isDark
                                  ? 'bg-white/[0.04] border-[#3f96fe]/20 text-white placeholder:text-white/30 focus:border-[#3f96fe]'
                                  : 'bg-white border-blue-200 text-gray-900 placeholder:text-gray-400 focus:border-[#3f96fe]'
                              )}
                            />
                          </div>
                        )}

                        {/* Show scanned data indicator */}
                        {qrImportData && !qrScannerActive && (
                          <div className={cn(
                            'flex items-center gap-2 p-2 rounded-lg text-[11px]',
                            isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'
                          )}>
                            <CheckCircle size={14} />
                            QR data loaded ({qrImportData.length} chars)
                          </div>
                        )}

                        <div>
                          <p className={cn('text-[11px] mb-1.5', isDark ? 'text-white/50' : 'text-gray-500')}>
                            Enter the same password used during export
                          </p>
                          <div className="relative">
                            <input
                              type={showQrSyncPassword ? 'text' : 'password'}
                              placeholder="Password"
                              value={qrSyncPassword}
                              onChange={(e) => {
                                setQrSyncPassword(e.target.value);
                                setQrSyncError('');
                              }}
                              onKeyDown={(e) => e.key === 'Enter' && qrImportData && qrSyncPassword && handleQrImport()}
                              autoComplete="off"
                              className={cn(
                                'w-full px-3 py-2 pr-10 rounded-lg border-[1.5px] text-[13px] outline-none transition-colors',
                                isDark
                                  ? 'bg-white/[0.04] border-[#3f96fe]/20 text-white placeholder:text-white/30 focus:border-[#3f96fe]'
                                  : 'bg-white border-blue-200 text-gray-900 placeholder:text-gray-400 focus:border-[#3f96fe]'
                              )}
                            />
                            <button
                              type="button"
                              onClick={() => setShowQrSyncPassword(!showQrSyncPassword)}
                              className={cn(
                                'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded',
                                isDark ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                              )}
                            >
                              {showQrSyncPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>

                        {qrSyncError && (
                          <p className="text-[11px] text-red-500">{qrSyncError}</p>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (qrSyncFromManage) {
                                setShowSeedDialog(false);
                                setQrSyncFromManage(false);
                                setQrSyncMode(null);
                                setQrSyncPassword('');
                                setQrImportData('');
                                setSeedAuthStatus('idle');
                              } else {
                                setSeedAuthStatus('select-mode');
                                setQrSyncMode(null);
                                setQrSyncPassword('');
                                setQrImportData('');
                              }
                            }}
                            className={cn(
                              'px-3 py-1.5 rounded-lg border-[1.5px] text-[13px] transition-colors',
                              isDark
                                ? 'border-[#3f96fe]/20 text-white hover:bg-[#3f96fe]/5'
                                : 'border-blue-200 text-gray-700 hover:bg-blue-50'
                            )}
                          >
                            Back
                          </button>
                          <button
                            onClick={handleQrImport}
                            disabled={!qrImportData || !qrSyncPassword || qrSyncLoading}
                            className={cn(
                              'flex-1 px-3 py-1.5 rounded-lg text-[13px] font-normal text-white transition-colors flex items-center justify-center gap-2',
                              qrImportData && qrSyncPassword && !qrSyncLoading
                                ? 'bg-primary hover:bg-primary/90'
                                : 'bg-primary/50 cursor-not-allowed'
                            )}
                          >
                            {qrSyncLoading ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <>
                                <Download size={14} />
                                Import Wallet
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              // WalletConnect Modal Content
              <div className={isDark ? 'text-white' : 'text-gray-900'}>
                {/* Header */}
                <div
                  className={cn(
                    'px-6 py-5 flex items-center justify-between',
                    isDark ? 'border-b border-white/[0.08]' : 'border-b border-gray-100'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-xl',
                      isDark ? 'bg-primary/10' : 'bg-primary/5'
                    )}>
                      {hasExistingWallet
                        ? <Shield size={18} className="text-primary" />
                        : <Wallet2 size={18} className="text-primary" />
                      }
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-[16px] font-bold tracking-tight">
                        {hasExistingWallet ? 'Welcome Back' : 'Connect Wallet'}
                      </h2>
                      <p className={cn('text-[10px] font-medium uppercase tracking-widest mt-0.5', isDark ? 'text-white/30' : 'text-gray-400')}>
                        {hasExistingWallet ? 'Securely Unlock' : 'Create or Import'}
                      </p>
                    </div>
                  </div>
                  {(() => {
                    const hasProgress =
                      (!hasExistingWallet && (createPassword || createPasswordConfirm)) ||
                      (hasExistingWallet && unlockPassword);
                    return (
                      <button
                        onClick={() => {
                          if (
                            hasProgress &&
                            !window.confirm('You have unsaved progress. Close anyway?')
                          )
                            return;
                          setOpenWalletModal(false);
                          setCreatePassword('');
                          setCreatePasswordConfirm('');
                          setCreateSeed('');
                          setCreateMode('new');
                          setUnlockPassword('');
                        }}
                        className={cn(
                          'p-2 rounded-full transition-all duration-300 relative',
                          isDark
                            ? 'hover:bg-white/[0.08] text-white/30 hover:text-white'
                            : 'hover:bg-gray-100 text-gray-400 hover:text-gray-900'
                        )}
                        title={hasProgress ? 'You have unsaved progress' : 'Close'}
                      >
                        <XIcon size={18} />
                        {hasProgress && (
                          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-black animate-pulse" />
                        )}
                      </button>
                    );
                  })()}
                </div>

                {/* Content */}
                <div className="px-6 py-5">
                  {/* Password Unlock for Returning Users */}
                  {hasExistingWallet && (
                    <div className="space-y-4">
                      {/* Cached profile avatar */}
                      {(() => {
                        try {
                          const cached = walletAvatarCache.current || {};
                          const match = walletMetadata.find((w) => cached[w.maskedAddress]);
                          const avatarUrl = match ? cached[match.maskedAddress] : null;
                          if (avatarUrl) {
                            return (
                              <div className="flex flex-col items-center gap-2 pb-1">
                                <div className={cn(
                                  'w-16 h-16 rounded-xl overflow-hidden border-[1.5px]',
                                  isDark ? 'border-white/10' : 'border-gray-200'
                                )}>
                                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                                <span className={cn('text-[11px] font-mono', isDark ? 'text-white/40' : 'text-gray-400')}>
                                  {match.maskedAddress}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        } catch { return null; }
                      })()}
                      <div className={cn(
                        'p-5 rounded-2xl border transition-all duration-300',
                        isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-gray-50/80 border-gray-100'
                      )}>
                        <div className="flex items-center justify-between mb-4">
                          <span className={cn('text-[11px] font-bold uppercase tracking-wider', isDark ? 'text-white/35' : 'text-gray-400')}>
                            Found {walletMetadata.length} account{walletMetadata.length !== 1 ? 's' : ''}
                          </span>
                          <div className={cn('p-1.5 rounded-lg', isDark ? 'bg-white/[0.04]' : 'bg-gray-100')}>
                            <Lock size={14} className={isDark ? 'text-white/25' : 'text-gray-300'} />
                          </div>
                        </div>

                        <div className="relative group">
                          <input
                            type={showUnlockPassword ? 'text' : 'password'}
                            value={unlockPassword}
                            onChange={(e) => setUnlockPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePasswordUnlock()}
                            placeholder="Enter password to unlock"
                            className={cn(
                              'w-full px-4 py-2.5 pr-12 rounded-xl text-[16px] outline-none transition-all duration-300 font-medium',
                              isDark
                                ? 'bg-black/40 border border-white/[0.08] text-white placeholder:text-white/20 focus:border-primary/50'
                                : 'bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary/50'
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                            className={cn(
                              'absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors',
                              isDark
                                ? 'text-white/20 hover:text-white/50'
                                : 'text-gray-400 hover:text-gray-600'
                            )}
                          >
                            {showUnlockPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>

                        {unlockError && (
                          <div className={cn(
                            'mt-3 flex items-center gap-2 px-3 py-2 rounded-xl',
                            isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-500'
                          )}>
                            <AlertCircle size={13} className="flex-shrink-0" />
                            <p className="text-[11px] font-semibold">{unlockError}</p>
                          </div>
                        )}

                        <button
                          onClick={handlePasswordUnlock}
                          disabled={isUnlocking || !unlockPassword}
                          className={cn(
                            'w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[13px] font-bold uppercase tracking-widest transition-all duration-200 active:scale-[0.97]',
                            unlockPassword && !isUnlocking
                              ? 'bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30'
                              : isDark
                                ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                                : 'bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-200'
                          )}
                        >
                          {isUnlocking ? <Loader2 size={16} className="animate-spin" /> : 'Unlock Wallet'}
                        </button>
                      </div>

                      <div className="pt-3 text-center">
                        <button
                          onClick={() => {
                            checkStoredWalletCount();
                            setShowClearConfirm(true);
                            setClearWarningAgreed(false);
                            setClearWarningText('');
                          }}
                          className={cn(
                            'inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 group',
                            isDark
                              ? 'text-white/20 hover:text-red-400'
                              : 'text-gray-300 hover:text-red-500'
                          )}
                        >
                          <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
                          Reset & Clear All
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Create Wallet - Only show if no existing wallet */}
                  {!hasExistingWallet && (
                    <div className="space-y-5">
                      {/* Mode toggle: Create New / Import / QR Sync */}
                      <div
                        className={cn(
                          'flex rounded-2xl p-1 gap-1',
                          isDark ? 'bg-white/[0.04]' : 'bg-gray-100'
                        )}
                      >
                        <button
                          onClick={() => {
                            setCreateMode('new');
                            setCreateError('');
                            stopQrScanner();
                          }}
                          className={cn(
                            'flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all duration-200',
                            createMode === 'new'
                              ? isDark
                                ? 'bg-white/[0.08] text-white shadow-lg ring-1 ring-white/[0.08]'
                                : 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/50'
                              : isDark
                                ? 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                          )}
                        >
                          Create
                        </button>
                        <button
                          onClick={() => {
                            setCreateMode('import');
                            setCreateError('');
                            stopQrScanner();
                          }}
                          className={cn(
                            'flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all duration-200',
                            createMode === 'import'
                              ? isDark
                                ? 'bg-white/[0.08] text-white shadow-lg ring-1 ring-white/[0.08]'
                                : 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/50'
                              : isDark
                                ? 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                          )}
                        >
                          Import
                        </button>
                        <button
                          onClick={() => {
                            setCreateMode('qr');
                            setCreateError('');
                            setQrImportData('');
                            setQrSyncPassword('');
                          }}
                          className={cn(
                            'flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5',
                            createMode === 'qr'
                              ? isDark
                                ? 'bg-white/[0.08] text-white shadow-lg ring-1 ring-white/[0.08]'
                                : 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/50'
                              : isDark
                                ? 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                          )}
                        >
                          <QrCode size={14} />
                          Sync
                        </button>
                      </div>

                      {/* Seed input for import mode */}
                      {createMode === 'import' && (
                        <div className="space-y-2">
                          <label className={cn('text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1')}>
                            Secret Seed
                          </label>
                          {(() => {
                            const validation = validateSeed(createSeed);
                            const hasInput = createSeed.trim().length > 0;
                            return (
                              <div className="relative">
                                <input
                                  type="password"
                                  value={createSeed}
                                  onChange={(e) => {
                                    setCreateSeed(e.target.value);
                                    setCreateError('');
                                  }}
                                  placeholder="Starts with 's'..."
                                  autoFocus
                                  className={cn(
                                    'w-full px-4 py-2.5 rounded-xl text-[16px] font-mono outline-none transition-all duration-300',
                                    isDark
                                      ? 'bg-white/[0.04] border text-white placeholder:text-white/20 focus:border-primary/50'
                                      : 'bg-gray-50 border text-gray-900 placeholder:text-gray-400 focus:border-primary/50',
                                    hasInput && !validation.valid
                                      ? 'border-red-500/50'
                                      : hasInput && validation.valid
                                        ? 'border-emerald-500/50'
                                        : isDark
                                          ? 'border-white/[0.08]'
                                          : 'border-gray-200'
                                  )}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20">
                                  <Shield size={18} />
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* QR Sync mode - scan or paste */}
                      {createMode === 'qr' && (
                        <div className="space-y-3">
                          {/* QR Scanner Camera View */}
                          {qrScannerActive ? (
                            <div className="space-y-2">
                              <div className={cn(
                                'relative rounded-lg overflow-hidden',
                                isDark ? 'bg-black' : 'bg-gray-900'
                              )}>
                                {/* Camera video container */}
                                <div
                                  id="qr-video-container-create"
                                  className="w-full bg-black h-[180px] min-h-[180px]"
                                />
                                {/* Scanning overlay */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="w-32 h-32 border-2 border-white/50 rounded-lg relative">
                                    <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                                    <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br-lg" />
                                  </div>
                                </div>
                                <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-white/70 animate-pulse">
                                  Scanning... Point at QR code
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={captureAndScanPhoto}
                                  className={cn(
                                    'flex-1 py-2 rounded-lg text-[12px] font-medium transition-colors',
                                    isDark
                                      ? 'bg-primary text-white hover:bg-primary/90'
                                      : 'bg-primary text-white hover:bg-primary/90'
                                  )}
                                >
                                  📸 Capture
                                </button>
                                <label
                                  className={cn(
                                    'flex-1 py-2 rounded-lg text-[12px] font-medium transition-colors text-center cursor-pointer',
                                    isDark
                                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  )}
                                >
                                  📁 Upload
                                  <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        stopQrScanner();
                                        scanQrFromFile(file);
                                      }
                                      e.target.value = '';
                                    }}
                                  />
                                </label>
                                <button
                                  onClick={stopQrScanner}
                                  className={cn(
                                    'px-4 py-2 rounded-lg text-[12px] font-medium transition-colors',
                                    isDark
                                      ? 'bg-white/10 text-white hover:bg-white/15'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  )}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Scan Button */}
                              <button
                                onClick={startQrScanner}
                                className={cn(
                                  'w-full flex items-center justify-center gap-2 py-3 rounded-lg text-[13px] font-medium transition-colors',
                                  isDark
                                    ? 'bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30'
                                    : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'
                                )}
                              >
                                <Camera size={18} />
                                Scan QR Code
                              </button>

                              {/* Divider */}
                              <div className="flex items-center gap-3">
                                <div className={cn('flex-1 h-px', isDark ? 'bg-white/10' : 'bg-gray-200')} />
                                <span className={cn('text-[10px]', isDark ? 'text-white/30' : 'text-gray-400')}>or paste</span>
                                <div className={cn('flex-1 h-px', isDark ? 'bg-white/10' : 'bg-gray-200')} />
                              </div>

                              {/* Manual Paste */}
                              <textarea
                                placeholder="Paste QR data (XRPL:...)"
                                value={qrImportData}
                                onChange={(e) => {
                                  setQrImportData(e.target.value);
                                  setCreateError('');
                                }}
                                rows={2}
                                className={cn(
                                  'w-full px-3 py-2 rounded-lg text-[11px] font-mono outline-none transition-colors resize-none',
                                  isDark
                                    ? 'bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/25 focus:border-white/20'
                                    : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-gray-300'
                                )}
                              />
                            </>
                          )}

                          {/* Show scanned data indicator */}
                          {qrImportData && !qrScannerActive && (
                            <div className={cn(
                              'flex items-center gap-2 p-2 rounded-lg text-[11px]',
                              isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'
                            )}>
                              <CheckCircle size={14} />
                              QR data ready ({qrImportData.length} chars)
                            </div>
                          )}
                        </div>
                      )}

                      {/* Password section - only show for new/import modes, or after QR data is scanned */}
                      {(createMode !== 'qr' || qrImportData) && !qrScannerActive && (
                        <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-500">
                          <div className="space-y-1">
                            <p className={cn('text-[11px] font-bold uppercase tracking-widest opacity-40 ml-1')}>
                              {createMode === 'qr'
                                ? 'Unlock Password'
                                : 'Secure Password'}
                            </p>
                            <div className="relative group">
                              <input
                                type={showCreatePassword ? 'text' : 'password'}
                                value={createPassword}
                                onChange={(e) => {
                                  setCreatePassword(e.target.value);
                                  setCreateError('');
                                }}
                                onKeyDown={(e) =>
                                  e.key === 'Enter' &&
                                  createPasswordConfirm &&
                                  (createMode === 'new' || validateSeed(createSeed).valid) &&
                                  handlePasswordCreate()
                                }
                                placeholder={createMode === 'qr' ? 'Export password' : 'Create strong password'}
                                autoFocus={createMode === 'new'}
                                className={cn(
                                  'w-full px-4 py-2.5 pr-12 rounded-xl text-[16px] outline-none transition-all duration-300 font-medium',
                                  isDark
                                    ? 'bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:border-primary/50'
                                    : 'bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary/50'
                                )}
                              />
                              <button
                                type="button"
                                onClick={() => setShowCreatePassword(!showCreatePassword)}
                                className={cn(
                                  'absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors',
                                  isDark
                                    ? 'text-white/20 hover:text-white/50'
                                    : 'text-gray-400 hover:text-gray-600'
                                )}
                              >
                                {showCreatePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>

                          {/* Password strength indicator */}
                          {createPassword && createMode !== 'qr' && passwordStrength && (
                            <div className="flex items-center gap-2 px-1">
                              <div className="flex gap-1 flex-1">
                                {[1, 2, 3, 4].map((i) => (
                                  <div
                                    key={i}
                                    className="h-1 flex-1 rounded-full transition-all duration-300"
                                    style={{
                                      backgroundColor: i <= passwordStrength.level ? passwordStrength.color : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')
                                    }}
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] font-semibold" style={{ color: passwordStrength.color }}>
                                {passwordStrength.label}
                              </span>
                            </div>
                          )}

                          {/* Confirm password - only for new/import modes, not QR */}
                          {createMode !== 'qr' && (
                            <div className="space-y-1">
                              <p className={cn('text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1')}>
                                Confirm Password
                              </p>
                              <input
                                type={showCreatePassword ? 'text' : 'password'}
                                value={createPasswordConfirm}
                                onChange={(e) => {
                                  setCreatePasswordConfirm(e.target.value);
                                  setCreateError('');
                                }}
                                onKeyDown={(e) =>
                                  e.key === 'Enter' &&
                                  (createMode === 'new' || validateSeed(createSeed).valid) &&
                                  handlePasswordCreate()
                                }
                                placeholder="Repeat your password"
                                className={cn(
                                  'w-full px-4 py-2.5 rounded-xl text-[16px] outline-none transition-all duration-300 font-medium',
                                  isDark
                                    ? 'bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:border-primary/50'
                                    : 'bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary/50'
                                )}
                              />
                            </div>
                          )}

                          {createError && (
                            <div className={cn(
                              'flex items-center gap-2 px-3 py-2 rounded-xl',
                              isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-500'
                            )}>
                              <AlertCircle size={13} className="flex-shrink-0" />
                              <p className="text-[11px] font-semibold">{createError}</p>
                            </div>
                          )}

                          <button
                            onClick={createMode === 'qr' ? handleQrImportCreate : handlePasswordCreate}
                            disabled={
                              isCreating ||
                              !createPassword ||
                              (createMode !== 'qr' && !createPasswordConfirm) ||
                              (createMode === 'import' && !validateSeed(createSeed).valid) ||
                              (createMode === 'qr' && !qrImportData)
                            }
                            className={cn(
                              'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[13px] font-bold uppercase tracking-widest transition-all active:scale-[0.98]',
                              (createPassword && (createMode === 'qr' || createPasswordConfirm)) && !isCreating
                                ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90'
                                : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                            )}
                          >
                            {isCreating ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : createMode === 'qr' ? (
                              'Import Wallet'
                            ) : createMode === 'import' ? (
                              'Finish Import'
                            ) : (
                              'Create Wallet'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div
                    className={cn(
                      'mt-5 pt-4 text-center border-t',
                      isDark ? 'border-white/[0.08]' : 'border-gray-100'
                    )}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <Lock size={10} className={isDark ? 'text-white/20' : 'text-gray-400'} />
                      <span
                        className={cn('text-[10px]', isDark ? 'text-white/20' : 'text-gray-400')}
                      >
                        Encrypted and stored locally
                      </span>
                    </div>
                    {showClearConfirm && (
                      <div
                        className={cn(
                          'mt-2 p-3 rounded-xl border-[1.5px]',
                          isDark ? 'bg-black/40 border-red-500/20' : 'bg-white border-red-200'
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Trash2 size={14} className="text-red-500" />
                            <span
                              className={cn(
                                'text-[12px] font-medium',
                                isDark ? 'text-white' : 'text-gray-900'
                              )}
                            >
                              Delete {profiles.length || storedWalletCount || 'all'} wallet
                              {(profiles.length || storedWalletCount) !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setShowClearConfirm(false);
                              setClearSliderValue(0);
                              setClearWarningAgreed(false);
                              setClearWarningText('');
                            }}
                            className={cn(
                              'text-[11px] px-2 py-0.5 rounded-md transition-colors',
                              isDark
                                ? 'text-white/40 hover:text-white/70 hover:bg-white/5'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            )}
                          >
                            Cancel
                          </button>
                        </div>

                        {storedWalletAddresses.length > 0 && (
                          <div
                            className={cn(
                              'mb-2 px-2 py-1 rounded-lg flex flex-wrap gap-x-3 gap-y-0.5',
                              isDark ? 'bg-white/[0.02]' : 'bg-gray-50'
                            )}
                          >
                            {storedWalletAddresses.slice(0, 3).map((addr, idx) => (
                              <span
                                key={idx}
                                className={cn(
                                  'text-[10px] font-mono',
                                  isDark ? 'text-white/40' : 'text-gray-400'
                                )}
                              >
                                {addr}
                              </span>
                            ))}
                            {storedWalletAddresses.length > 3 && (
                              <span
                                className={cn(
                                  'text-[9px]',
                                  isDark ? 'text-white/30' : 'text-gray-400'
                                )}
                              >
                                +{storedWalletAddresses.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        <div className="space-y-1.5 mb-2">
                          <p
                            className={cn(
                              'text-[10px] leading-relaxed',
                              isDark ? 'text-white/50' : 'text-gray-500'
                            )}
                          >
                            Type <span className="font-medium text-red-500">I understand</span> to confirm this cannot be undone
                          </p>
                          <input
                            type="text"
                            value={clearWarningText}
                            onChange={(e) => {
                              setClearWarningText(e.target.value);
                              setClearWarningAgreed(e.target.value.trim().toLowerCase() === 'i understand');
                            }}
                            placeholder="Type here..."
                            autoComplete="off"
                            className={cn(
                              'w-full px-2.5 py-1.5 rounded-md border-[1.5px] text-[11px] outline-none transition-colors',
                              clearWarningAgreed
                                ? 'border-red-500/40 bg-red-500/5'
                                : isDark
                                  ? 'border-white/10 bg-black/30 text-white/80 placeholder:text-white/20'
                                  : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-300'
                            )}
                          />
                        </div>

                        <div
                          className={cn(
                            'relative h-11 rounded-xl overflow-hidden select-none transition-all',
                            clearWarningAgreed
                              ? 'cursor-pointer'
                              : 'cursor-not-allowed opacity-30',
                            clearSliderValue >= 95
                              ? 'bg-red-500'
                              : isDark
                                ? 'bg-white/[0.04] border border-white/[0.06]'
                                : 'bg-gray-100 border border-gray-200/60'
                          )}
                          onMouseDown={(e) => {
                            if (!clearWarningAgreed) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const pad = 4;
                            const thumbSize = rect.height - pad * 2;
                            const travel = rect.width - thumbSize - pad * 2;
                            const handleMove = (moveEvent) => {
                              const x = Math.max(0, Math.min(moveEvent.clientX - rect.left - pad - thumbSize / 2, travel));
                              const pct = Math.round((x / travel) * 100);
                              setClearSliderValue(pct);
                              if (pct >= 95) handleClearAllWallets();
                            };
                            const handleUp = () => {
                              document.removeEventListener('mousemove', handleMove);
                              document.removeEventListener('mouseup', handleUp);
                              if (clearSliderValue < 95) setClearSliderValue(0);
                            };
                            handleMove(e);
                            document.addEventListener('mousemove', handleMove);
                            document.addEventListener('mouseup', handleUp);
                          }}
                          onTouchStart={(e) => {
                            if (!clearWarningAgreed) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const pad = 4;
                            const thumbSize = rect.height - pad * 2;
                            const travel = rect.width - thumbSize - pad * 2;
                            const handleMove = (moveEvent) => {
                              const touch = moveEvent.touches[0];
                              const x = Math.max(0, Math.min(touch.clientX - rect.left - pad - thumbSize / 2, travel));
                              const pct = Math.round((x / travel) * 100);
                              setClearSliderValue(pct);
                              if (pct >= 95) handleClearAllWallets();
                            };
                            const handleEnd = () => {
                              document.removeEventListener('touchmove', handleMove);
                              document.removeEventListener('touchend', handleEnd);
                              if (clearSliderValue < 95) setClearSliderValue(0);
                            };
                            handleMove(e);
                            document.addEventListener('touchmove', handleMove);
                            document.addEventListener('touchend', handleEnd);
                          }}
                        >
                          {/* Fill track */}
                          <div
                            className={cn(
                              'absolute inset-y-0 left-0 rounded-xl',
                              clearSliderValue >= 95 ? 'bg-red-600' : 'bg-red-500/90'
                            )}
                            style={{ width: `calc(${clearSliderValue}% - ${clearSliderValue * 0.36}px + 4px + 36px)` }}
                          />
                          {/* Thumb — square, matches inner height */}
                          <div
                            className={cn(
                              'absolute top-1 bottom-1 aspect-square rounded-lg flex items-center justify-center transition-colors',
                              clearSliderValue >= 95
                                ? 'bg-white'
                                : clearSliderValue > 0
                                  ? 'bg-white/95'
                                  : isDark
                                    ? 'bg-white/10'
                                    : 'bg-white'
                            )}
                            style={{
                              left: `calc(${clearSliderValue}% - ${clearSliderValue * 0.36}px + 4px)`,
                              transition: clearSliderValue === 0 ? 'left 0.3s cubic-bezier(0.32, 0.72, 0, 1)' : 'none'
                            }}
                          >
                            {clearSliderValue >= 95 ? (
                              <Loader2 size={14} className="text-red-500 animate-spin" />
                            ) : (
                              <ChevronRight
                                size={14}
                                className={
                                  clearSliderValue > 0
                                    ? 'text-red-500'
                                    : isDark
                                      ? 'text-white/40'
                                      : 'text-gray-400'
                                }
                              />
                            )}
                          </div>
                          {/* Label */}
                          <span
                            className={cn(
                              'absolute inset-0 flex items-center justify-center text-[10px] font-medium pointer-events-none tracking-[0.15em] uppercase transition-opacity duration-200',
                              clearSliderValue > 10 ? 'opacity-0' : 'opacity-100',
                              isDark ? 'text-white/30' : 'text-gray-400'
                            )}
                            style={{ paddingLeft: 'calc(36px + 8px)' }}
                          >
                            Slide to delete
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </StyledPopoverPaper>
        </DialogContent>
      </Dialog>
    </div>
  );
}
