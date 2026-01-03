import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { Wallet as XRPLWallet, encodeSeed, Client, xrpToDrops, dropsToXrp, isValidAddress } from 'xrpl';

// Development logging helper
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
  ChevronRight
} from 'lucide-react';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Translation removed - not using i18n

// Utils
import { getHashIcon } from 'src/utils/formatters';
import { EncryptedWalletStorage, securityUtils } from 'src/utils/encryptedWalletStorage';
import { cn } from 'src/utils/cn';

// Generate random wallet with true random entropy
const generateRandomWallet = () => {
  const entropy = crypto.getRandomValues(new Uint8Array(32));
  return XRPLWallet.fromEntropy(Array.from(entropy));
};

// XRPL Seed validation and algorithm detection
const BASE58_ALPHABET = 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz';
const validateSeed = (seed) => {
  const trimmed = seed.trim();
  if (!trimmed) return { valid: false, error: '' };
  if (!trimmed.startsWith('s')) return { valid: false, error: 'Seed must start with "s"' };
  if (trimmed.length < 20 || trimmed.length > 35) return { valid: false, error: 'Invalid seed length' };
  const invalidChar = [...trimmed].find(c => !BASE58_ALPHABET.includes(c));
  if (invalidChar) return { valid: false, error: `Invalid character "${invalidChar}"` };
  return { valid: true, error: '' };
};
const getAlgorithmFromSeed = (seed) => seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';

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

// Simple alpha utility
const alpha = (color, opacity) => {
  if (!color) return `rgba(0,0,0,${opacity})`;
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
  }
  if (color.startsWith('rgba(')) {
    return color.replace(/,\s*[\d.]+\)$/, `, ${opacity})`);
  }
  return color;
};

// Dialog component - Enhanced with smooth animations and mobile support
const Dialog = ({ open, onClose, children, maxWidth, fullWidth, sx, ...props }) => {
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
      return () => clearTimeout(timer);
    }
  }, [open, isMobile]);

  if (!shouldRender) return null;

  // Mobile: Centered modal with symmetric margins
  if (isMobile) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-[9999] flex items-start justify-center pt-16 px-4 transition-opacity duration-200",
          isVisible ? "opacity-100 bg-black/50" : "opacity-0"
        )}
        onClick={onClose}
      >
        <div
          className={cn(
            "relative w-full max-w-[360px] max-h-[80vh] overflow-hidden transition-all duration-200 ease-out",
            isVisible
              ? "translate-y-0 opacity-100 scale-100"
              : "-translate-y-4 opacity-0 scale-95"
          )}
          onClick={e => e.stopPropagation()}
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
        "fixed inset-0 z-[9999] flex items-start justify-end transition-opacity duration-200",
        isVisible ? "opacity-100" : "opacity-0"
      )}
      onClick={onClose}
    >
      {/* Invisible click-away area (no blur, no background) */}
      <div className="absolute inset-0" />
      <div
        className={cn(
          "relative mt-[62px] mr-3 w-[340px] max-w-[340px] transition-all duration-200 ease-out",
          isVisible
            ? "translate-y-0 opacity-100 scale-100"
            : "-translate-y-2 opacity-0 scale-[0.98]"
        )}
        onClick={e => e.stopPropagation()}
        style={sx?.['& .MuiDialog-paper'] || {}}
      >
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children, sx }) => (
  <div style={{ padding: sx?.p === 0 ? 0 : 16 }}>{children}</div>
);

// StyledPopoverPaper component - Clean styling with mobile support
const StyledPopoverPaper = ({ children, isDark, isMobile }) => (
  <div className={cn(
    "overflow-hidden max-h-[80vh] overflow-y-auto rounded-2xl border",
    isDark
      ? "bg-black border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
      : "bg-white border-gray-200/80 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
  )}>
    {children}
  </div>
);

// Box component
const Box = ({ children, component, sx, onClick, className, ...props }) => {
  const Component = component || 'div';
  const style = sx ? convertSxToStyle(sx) : {};
  return <Component style={style} onClick={onClick} className={className} {...props}>{children}</Component>;
};

// Stack component
const Stack = ({ children, direction = 'column', spacing = 0, alignItems, justifyContent, sx, ...props }) => {
  const style = {
    display: 'flex',
    flexDirection: direction === 'row' ? 'row' : 'column',
    gap: spacing * 8,
    alignItems,
    justifyContent,
    ...convertSxToStyle(sx || {})
  };
  return <div style={style} {...props}>{children}</div>;
};

// Typography component
const Typography = ({ children, variant, sx, onClick, ...props }) => {
  const style = convertSxToStyle(sx || {});
  return <span style={style} onClick={onClick} {...props}>{children}</span>;
};

// Button component
const Button = ({ children, variant = 'text', size, fullWidth, disabled, onClick, sx, startIcon, ...props }) => {
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
const TextField = ({ label, placeholder, value, onChange, onKeyDown, onKeyPress, type = 'text', fullWidth, disabled, autoFocus, autoComplete, multiline, rows, size, helperText, error, InputProps, inputProps, sx, FormHelperTextProps, isDark = true, ...props }) => {
  const [focused, setFocused] = useState(false);
  const inputStyle = {
    width: fullWidth ? '100%' : 'auto',
    padding: size === 'small' ? '8px 12px' : '12px 14px',
    fontSize: 14,
    borderRadius: 12,
    border: isDark ? '1.5px solid rgba(156,163,175,0.25)' : '1.5px solid rgba(156,163,175,0.4)',
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(249,250,251,1)',
    color: isDark ? '#fff' : '#000',
    outline: 'none',
    fontFamily: inputProps?.style?.fontFamily || 'inherit',
    ...convertSxToStyle(sx?.['& .MuiInputBase-input'] || {})
  };
  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && <label style={{ display: 'block', marginBottom: 4, fontSize: 12, opacity: 0.7 }}>{label}</label>}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
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
          <div style={{ position: 'absolute', right: 8 }}>{InputProps.endAdornment}</div>
        )}
      </div>
      {helperText && <div style={{ marginTop: 4, fontSize: 11, opacity: 0.7 }} {...FormHelperTextProps}>{helperText}</div>}
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
    <div style={{
      padding: '12px 16px',
      borderRadius: 8,
      background: c.bg,
      borderLeft: `3px solid ${c.border}`,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 8,
      ...convertSxToStyle(sx || {})
    }}>
      {icon !== false && <span style={{ display: 'flex', color: c.border }}>{icon || c.icon}</span>}
      <div style={{ flex: 1 }}>{children}</div>
      {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7 }}><XIcon size={14} /></button>}
    </div>
  );
};

// IconButton component
const IconButton = ({ children, onClick, size, disabled, edge, sx, ...props }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: 'transparent',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      padding: size === 'small' ? 4 : 8,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled ? 0.5 : 1,
      ...convertSxToStyle(sx || {})
    }}
    {...props}
  >
    {children}
  </button>
);

// InputAdornment component
const InputAdornment = ({ children, position }) => (
  <div style={{ display: 'flex', alignItems: 'center' }}>{children}</div>
);

// FormControlLabel component
const FormControlLabel = ({ control, label }) => (
  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
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
    style={{ width: size === 'small' ? 14 : 18, height: size === 'small' ? 14 : 18, cursor: 'pointer' }}
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
      if (['p', 'px', 'py', 'pt', 'pb', 'pl', 'pr', 'm', 'mx', 'my', 'mt', 'mb', 'ml', 'mr', 'gap'].includes(key)) {
        const pixels = value * 8;
        if (key === 'p') { style.padding = pixels; }
        else if (key === 'px') { style.paddingLeft = pixels; style.paddingRight = pixels; }
        else if (key === 'py') { style.paddingTop = pixels; style.paddingBottom = pixels; }
        else if (key === 'pt') { style.paddingTop = pixels; }
        else if (key === 'pb') { style.paddingBottom = pixels; }
        else if (key === 'pl') { style.paddingLeft = pixels; }
        else if (key === 'pr') { style.paddingRight = pixels; }
        else if (key === 'm') { style.margin = pixels; }
        else if (key === 'mx') { style.marginLeft = pixels; style.marginRight = pixels; }
        else if (key === 'my') { style.marginTop = pixels; style.marginBottom = pixels; }
        else if (key === 'mt') { style.marginTop = pixels; }
        else if (key === 'mb') { style.marginBottom = pixels; }
        else if (key === 'ml') { style.marginLeft = pixels; }
        else if (key === 'mr') { style.marginRight = pixels; }
        else if (key === 'gap') { style.gap = pixels; }
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
  handleDownloadBackup,
  showBackupPassword,
  backupPassword,
  setBackupPassword,
  showBackupPasswordVisible,
  setShowBackupPasswordVisible,
  processBackupDownload,
  setShowBackupPassword,
  backupAgreed,
  setBackupAgreed,
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
  setDestAddress
}) => {
  const needsBackup = typeof window !== 'undefined' && localStorage.getItem(`wallet_needs_backup_${accountLogin}`);
  const [showAllAccounts, setShowAllAccounts] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // account to delete

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
  const [storedPassword, setStoredPassword] = useState(null);

  // History state
  const [transactions, setTransactions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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
            setStoredPassword(pwd);
            setIsUnlocked(true);
          }
        }
      } catch (err) { /* ignore */ }
    };
    checkUnlock();
  }, [accountProfile, accountLogin, walletStorage]);

  const loadTransactionHistory = async () => {
    if (!accountLogin) return;
    setLoadingHistory(true);
    try {
      const response = await fetch(`https://api.xrpl.to/api/account/${accountLogin}/transactions?limit=20`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) { /* ignore */ }
    finally { setLoadingHistory(false); }
  };

  const availableBalance = parseFloat(accountBalance?.curr1?.value || '0');
  const maxSendable = Math.max(0, availableBalance - 10.000012);

  const validateSend = () => {
    if (!recipient) return 'Enter recipient address';
    if (!isValidAddress(recipient)) return 'Invalid XRPL address';
    if (recipient === accountLogin) return 'Cannot send to yourself';
    if (!amount || parseFloat(amount) <= 0) return 'Enter amount';
    if (parseFloat(amount) > maxSendable) return 'Insufficient balance';
    if (!isUnlocked && !sendPassword) return 'Enter password';
    return null;
  };

  const handleSend = async () => {
    const error = validateSend();
    if (error) { setSendError(error); return; }

    setIsSending(true);
    setSendError('');
    setTxResult(null);

    try {
      const pwdToUse = isUnlocked && storedPassword ? storedPassword : sendPassword;
      let wallet;
      if (accountProfile?.wallet_type === 'oauth') {
        const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
        wallet = await walletStorage.findWalletBySocialId(walletId, pwdToUse, accountLogin);
      } else {
        wallet = await walletStorage.getWalletByAddress(accountLogin, pwdToUse);
      }

      if (!wallet?.seed) throw new Error('Incorrect password');

      const client = new Client('wss://xrplcluster.com');
      await client.connect();

      try {
        const payment = {
          TransactionType: 'Payment',
          Account: accountLogin,
          Destination: recipient,
          Amount: xrpToDrops(amount)
        };
        if (destinationTag) payment.DestinationTag = parseInt(destinationTag);

        const xrplWallet = XRPLWallet.fromSeed(wallet.seed);
        const prepared = await client.autofill(payment);
        const signed = xrplWallet.sign(prepared);
        const result = await client.submitAndWait(signed.tx_blob);

        if (result.result.meta.TransactionResult === 'tesSUCCESS') {
          setTxResult({ success: true, hash: result.result.hash, amount, recipient });
          openSnackbar('Transaction successful', 'success');
          setRecipient(''); setAmount(''); setDestinationTag('');
          if (!isUnlocked) setSendPassword('');
        } else {
          throw new Error(result.result.meta.TransactionResult);
        }
      } finally { await client.disconnect(); }
    } catch (err) {
      setSendError(err.message || 'Transaction failed');
    } finally { setIsSending(false); }
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

  const truncAddr = (addr, len = 6) => addr ? `${addr.slice(0, len)}...${addr.slice(-4)}` : '';

  // Show backup section instead of wallet when downloading
  if (showBackupPassword) {
    return (
      <div className={cn("p-5", isDark ? "text-white" : "text-gray-900")}>
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center pb-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 mb-3">
              <Download size={22} className="text-amber-500" />
            </div>
            <h3 className="text-base font-medium">Download Backup</h3>
            <p className={cn("text-xs mt-1", isDark ? "text-white/50" : "text-gray-500")}>
              All {profiles.length} wallets • Encrypted
            </p>
          </div>

          {/* Warning */}
          <div className={cn(
            "rounded-xl p-3.5 border",
            isDark ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-200"
          )}>
            <div className="flex gap-2.5">
              <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Keep this file safe</p>
                <p className={cn("text-[11px] mt-0.5 leading-relaxed", isDark ? "text-white/60" : "text-gray-600")}>
                  Contains all wallet seeds. Never share it with anyone.
                </p>
              </div>
            </div>
          </div>

          {/* Acknowledgment */}
          <button
            onClick={() => setBackupAgreed(!backupAgreed)}
            className={cn(
              "w-full flex items-start gap-3 p-3.5 rounded-xl border-[1.5px] text-left transition-all",
              backupAgreed
                ? "border-primary bg-primary/5"
                : isDark ? "border-gray-600/40 hover:border-gray-500/50" : "border-gray-300 hover:border-gray-400"
            )}
          >
            <div className={cn(
              "w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
              backupAgreed
                ? "bg-primary"
                : isDark ? "border-2 border-gray-600/50" : "border-2 border-gray-300"
            )}>
              {backupAgreed && <Check size={12} className="text-white" />}
            </div>
            <span className={cn("text-xs leading-relaxed", isDark ? "text-white/80" : "text-gray-700")}>
              I understand and will keep this file safe
            </span>
          </button>

          {/* Password Input */}
          <div className="relative">
            <input
              type={showBackupPasswordVisible ? 'text' : 'password'}
              value={backupPassword}
              onChange={(e) => setBackupPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={!backupAgreed}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && backupPassword && backupAgreed) {
                  processBackupDownload();
                }
              }}
              className={cn(
                "w-full px-4 py-3 pr-12 rounded-xl border-[1.5px] text-sm outline-none transition-all",
                isDark
                  ? "bg-white/[0.04] border-gray-600/40 text-white placeholder:text-white/30 focus:border-gray-500 disabled:opacity-40"
                  : "bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 disabled:opacity-40"
              )}
            />
            <button
              type="button"
              onClick={() => setShowBackupPasswordVisible(!showBackupPasswordVisible)}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors",
                isDark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {showBackupPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => {
                setShowBackupPassword(false);
                setBackupPassword('');
                setShowBackupPasswordVisible(false);
                setBackupAgreed(false);
              }}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-medium border-[1.5px] transition-all",
                isDark
                  ? "border-gray-600/40 text-white/70 hover:bg-gray-700/30"
                  : "border-gray-300 text-gray-600 hover:bg-gray-100"
              )}
            >
              Cancel
            </button>
            <button
              onClick={processBackupDownload}
              disabled={!backupPassword || !backupAgreed}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all",
                backupPassword && backupAgreed
                  ? "bg-primary text-white hover:bg-primary/90"
                  : isDark
                    ? "bg-white/5 text-white/30 cursor-not-allowed"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              Download
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // COMPACT DROPDOWN MODE
  // ============================================

  // Bridge form view for logged-in users
  if (showBridgeInDropdown) {
    return (
      <div className={isDark ? "text-white" : "text-gray-900"}>
        {/* Header */}
        <div className={cn(
          "px-4 py-2.5 flex items-center justify-between",
          isDark ? "border-b border-white/[0.06]" : "border-b border-gray-100"
        )}>
          <button
            onClick={() => { setShowBridgeInDropdown(false); setBridgeData(null); }}
            className={cn("flex items-center gap-1.5 text-[12px] font-medium", isDark ? "text-white/60 hover:text-white" : "text-gray-500 hover:text-gray-700")}
          >
            <ChevronDown size={14} className="rotate-90" />
            Back
          </button>
          <span className={cn("text-[12px] font-medium", isDark ? "text-white" : "text-gray-900")}>Bridge</span>
          <button
            onClick={onClose}
            className={cn("p-1.5 rounded-lg transition-colors", isDark ? "hover:bg-white/5 text-white/40 hover:text-white/60" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600")}
          >
            <XIcon size={14} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {bridgeData ? (
            // Bridge created - show deposit address
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <Check size={14} className="text-emerald-500" />
                </div>
                <span className={cn("text-[12px] font-medium", isDark ? "text-white" : "text-gray-900")}>
                  Exchange Created
                </span>
              </div>

              <div className={cn("rounded-xl border p-3", isDark ? "border-white/[0.08] bg-white/[0.02]" : "border-gray-200 bg-gray-50")}>
                <div className="flex items-center gap-2 mb-2">
                  {bridgeData.swapDirection === 'fromXrp' ? (
                    <>
                      <span className={cn("text-[11px]", isDark ? "text-white/60" : "text-gray-600")}>
                        Send {bridgeAmount} XRP
                      </span>
                      <ArrowLeftRight size={12} className={isDark ? "text-white/30" : "text-gray-400"} />
                      {selectedCurrency?.image && <img src={selectedCurrency.image} alt="" className="w-4 h-4 rounded-full" />}
                      <span className="text-[11px] text-emerald-500 font-medium">
                        ~{bridgeData.expectedAmountTo || estimatedXrp || '?'} {selectedCurrency?.ticker?.toUpperCase()}
                      </span>
                    </>
                  ) : (
                    <>
                      {selectedCurrency?.image && <img src={selectedCurrency.image} alt="" className="w-4 h-4 rounded-full" />}
                      <span className={cn("text-[11px]", isDark ? "text-white/60" : "text-gray-600")}>
                        Send {bridgeAmount} {selectedCurrency?.ticker?.toUpperCase()}
                      </span>
                      <ArrowLeftRight size={12} className={isDark ? "text-white/30" : "text-gray-400"} />
                      <span className="text-[11px] text-emerald-500 font-medium">
                        ~{bridgeData.expectedAmountTo || estimatedXrp || '?'} XRP
                      </span>
                    </>
                  )}
                </div>

                <p className={cn("text-[9px] uppercase tracking-wide mb-1", isDark ? "text-white/30" : "text-gray-400")}>
                  Deposit Address
                </p>
                <div className={cn("rounded-lg border p-2", isDark ? "border-white/10 bg-black/30" : "border-gray-200 bg-white")}>
                  <div className="flex items-center justify-between gap-2">
                    <code className={cn("text-[10px] font-mono break-all flex-1", isDark ? "text-white/90" : "text-gray-900")}>
                      {bridgeData.payinAddress}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(bridgeData.payinAddress);
                        setBridgeAddressCopied(true);
                        setTimeout(() => setBridgeAddressCopied(false), 2000);
                      }}
                      className={cn(
                        "flex-shrink-0 p-1.5 rounded-lg transition-colors",
                        bridgeAddressCopied
                          ? "bg-emerald-500/15 text-emerald-500"
                          : isDark ? "bg-white/10 text-white/60 hover:bg-white/15" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {bridgeAddressCopied ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => window.open(`/bridge/${bridgeData.id}`, '_blank')}
                className="w-full py-2.5 rounded-lg text-[12px] font-medium bg-primary text-white hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                <ExternalLink size={14} />
                Track Exchange
              </button>
              <button
                onClick={() => { setShowBridgeInDropdown(false); setBridgeData(null); }}
                className={cn("w-full py-2 rounded-lg text-[11px] transition-all", isDark ? "text-white/50 hover:text-white/70" : "text-gray-500 hover:text-gray-700")}
              >
                Done
              </button>
            </div>
          ) : (
            // Bridge form
            <>
              {/* Direction Toggle */}
              <div className="flex gap-1 p-1 rounded-lg" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#f3f4f6' }}>
                <button
                  onClick={() => { setSwapDirection('toXrp'); setBridgeAmount(''); setDestAddress(''); }}
                  className={cn("flex-1 py-1.5 rounded-md text-[11px] font-medium transition-all",
                    swapDirection === 'toXrp'
                      ? "bg-primary text-white"
                      : isDark ? "text-white/50 hover:text-white/70" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  Buy XRP
                </button>
                <button
                  onClick={() => { setSwapDirection('fromXrp'); setBridgeAmount(''); setDestAddress(''); }}
                  className={cn("flex-1 py-1.5 rounded-md text-[11px] font-medium transition-all",
                    swapDirection === 'fromXrp'
                      ? "bg-primary text-white"
                      : isDark ? "text-white/50 hover:text-white/70" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  Sell XRP
                </button>
              </div>

              {/* Currency Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg border transition-colors",
                    isDark ? "border-white/[0.08] bg-white/[0.02] hover:border-white/15" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                  )}
                >
                  {selectedCurrency ? (
                    <div className="flex items-center gap-2">
                      {selectedCurrency.image && <img src={selectedCurrency.image} alt="" className="w-5 h-5 rounded-full" />}
                      <span className={cn("text-[13px] font-medium", isDark ? "text-white" : "text-gray-900")}>
                        {selectedCurrency.ticker.toUpperCase()}
                      </span>
                    </div>
                  ) : (
                    <span className={cn("text-[13px]", isDark ? "text-white/40" : "text-gray-400")}>
                      {currencies.length ? 'Select currency' : 'Loading...'}
                    </span>
                  )}
                  <ChevronDown size={16} className={cn(isDark ? "text-white/40" : "text-gray-400", showCurrencyDropdown && "rotate-180")} />
                </button>

                {showCurrencyDropdown && (
                  <div className={cn("absolute z-50 mt-1 w-full rounded-lg border shadow-lg max-h-[200px] overflow-hidden", isDark ? "border-white/10 bg-[#1a1a1a]" : "border-gray-200 bg-white")}>
                    <div className="p-2 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb' }}>
                      <input
                        type="text"
                        value={currencySearch}
                        onChange={(e) => setCurrencySearch(e.target.value)}
                        placeholder="Search..."
                        autoFocus
                        className={cn("w-full px-2 py-1.5 rounded text-[12px] outline-none", isDark ? "bg-white/5 text-white placeholder:text-white/30" : "bg-gray-50 text-gray-900 placeholder:text-gray-400")}
                      />
                    </div>
                    <div className="overflow-y-auto max-h-[200px]">
                      {(() => {
                        const filtered = currencies.filter(c => !currencySearch || c.ticker.toLowerCase().includes(currencySearch.toLowerCase()) || c.name.toLowerCase().includes(currencySearch.toLowerCase()));
                        const shown = filtered.slice(0, currencySearch ? 100 : 30);
                        return shown.length === 0 ? (
                          <div className={cn("px-3 py-4 text-center text-[11px]", isDark ? "text-white/30" : "text-gray-400")}>
                            No results
                          </div>
                        ) : shown.map((c) => (
                          <button
                            key={`${c.ticker}-${c.network}`}
                            onClick={() => { setSelectedCurrency(c); setShowCurrencyDropdown(false); setCurrencySearch(''); }}
                            className={cn("w-full flex items-center gap-2 px-3 py-2 text-left transition-colors", isDark ? "hover:bg-white/5" : "hover:bg-gray-50")}
                          >
                            {c.image && <img src={c.image} alt="" className="w-5 h-5 rounded-full" />}
                            <span className={cn("text-[12px] font-medium", isDark ? "text-white" : "text-gray-900")}>{c.ticker.toUpperCase()}</span>
                            <span className={cn("text-[10px] flex-1", isDark ? "text-white/30" : "text-gray-400")}>{c.name}</span>
                          </button>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Destination Address (for selling XRP) */}
              {swapDirection === 'fromXrp' && (
                <div className={cn("rounded-lg border p-3", isDark ? "border-white/[0.06] bg-white/[0.02]" : "border-gray-100 bg-gray-50")}>
                  <label className={cn("text-[10px] uppercase tracking-wide", isDark ? "text-white/30" : "text-gray-400")}>
                    {selectedCurrency?.ticker?.toUpperCase() || 'Destination'} Address
                  </label>
                  <input
                    type="text"
                    value={destAddress}
                    onChange={(e) => setDestAddress(e.target.value)}
                    placeholder={`Your ${selectedCurrency?.ticker?.toUpperCase() || ''} address`}
                    className={cn("w-full mt-1 bg-transparent text-[13px] outline-none", isDark ? "text-white placeholder:text-white/20" : "text-gray-900 placeholder:text-gray-300")}
                  />
                </div>
              )}

              {/* Amount */}
              <div className={cn("rounded-lg border p-3", isDark ? "border-white/[0.06] bg-white/[0.02]" : "border-gray-100 bg-gray-50")}>
                <label className={cn("text-[10px] uppercase tracking-wide", isDark ? "text-white/30" : "text-gray-400")}>Amount</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={bridgeAmount}
                    onChange={(e) => setBridgeAmount(e.target.value)}
                    placeholder={minAmount ? `Min: ${minAmount}` : "0.00"}
                    step="0.0001"
                    min="0"
                    className={cn("flex-1 bg-transparent text-[18px] font-medium outline-none", isDark ? "text-white placeholder:text-white/20" : "text-gray-900 placeholder:text-gray-300")}
                  />
                  <span className={cn("text-[13px] font-medium", isDark ? "text-white/50" : "text-gray-500")}>
                    {swapDirection === 'toXrp' ? (selectedCurrency?.ticker?.toUpperCase() || '---') : 'XRP'}
                  </span>
                </div>
                {estimatedXrp && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb' }}>
                    <span className={cn("text-[10px]", isDark ? "text-white/40" : "text-gray-400")}>You'll receive</span>
                    <span className="text-[13px] font-medium text-emerald-500">
                      ~{estimatedXrp} {swapDirection === 'toXrp' ? 'XRP' : selectedCurrency?.ticker?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {bridgeError && (
                <div className="p-2 rounded-lg text-[11px] bg-red-500/10 text-red-400 border border-red-500/20">
                  {bridgeError}
                </div>
              )}

              <button
                onClick={() => handleCreateBridge(accountLogin)}
                disabled={bridgeLoading || !bridgeAmount || !selectedCurrency || !estimatedXrp || (swapDirection === 'fromXrp' && !destAddress)}
                className={cn(
                  "w-full py-2.5 rounded-lg text-[12px] font-medium transition-all flex items-center justify-center gap-2",
                  bridgeAmount && selectedCurrency && estimatedXrp && (swapDirection === 'toXrp' || destAddress)
                    ? "bg-primary text-white hover:bg-primary/90"
                    : isDark ? "bg-white/5 text-white/30 cursor-not-allowed" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                {bridgeLoading ? <Loader2 size={14} className="animate-spin" /> : <><ArrowLeftRight size={14} /> Create Exchange</>}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={isDark ? "text-white" : "text-gray-900"}>
      {/* Header */}
      <div className={cn(
        "px-4 py-2.5 flex items-center justify-between",
        isDark ? "border-b border-white/[0.06]" : "border-b border-gray-100"
      )}>
        <button
          onClick={handleCopyAddress}
          className={cn(
            "flex items-center gap-2 px-2 py-1 -ml-2 rounded-lg transition-all",
            addressCopied ? "bg-emerald-500/10" : isDark ? "hover:bg-white/5" : "hover:bg-gray-100"
          )}
        >
          <div className="relative">
            <div className={cn("w-2 h-2 rounded-full", "bg-emerald-400")} />
            {!addressCopied && <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />}
          </div>
          <span className={cn("font-mono text-xs", addressCopied ? "text-emerald-500" : isDark ? "text-white/60" : "text-gray-500")}>
            {truncateAccount(accountLogin, 6)}
          </span>
          {addressCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className={isDark ? "text-white/40" : "text-gray-400"} />}
        </button>
        <button
          onClick={onClose}
          className={cn("p-1.5 rounded-lg transition-colors", isDark ? "hover:bg-white/5 text-white/40 hover:text-white/60" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600")}
        >
          <XIcon size={14} />
        </button>
      </div>

      {/* Balance */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <span className="font-mono text-2xl font-semibold tracking-tight">
            {accountTotalXrp || accountBalance?.curr1?.value || '0'}
          </span>
          <span className={cn("text-sm", isDark ? "text-white/40" : "text-gray-400")}>XRP</span>
        </div>
        <div className={cn("text-[11px] mb-4", isDark ? "text-white/35" : "text-gray-400")}>
          {accountBalance?.curr1?.value || '0'} available · {accountBalance?.curr2?.value || Math.max(0, Number(accountTotalXrp || 0) - Number(accountBalance?.curr1?.value || 0)) || '0'} reserved
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2">
          <a href="/wallet?tab=send" className={cn(
            "flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-[11px] font-medium transition-all",
            isDark ? "bg-white/[0.04] hover:bg-white/[0.07] text-white/70" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          )}>
            <Send size={16} className="text-primary" />
            Send
          </a>
          <button onClick={() => setShowQrCode(!showQrCode)} className={cn(
            "flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-[11px] font-medium transition-all",
            showQrCode
              ? "bg-primary/10 text-primary"
              : isDark ? "bg-white/[0.04] hover:bg-white/[0.07] text-white/70" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          )}>
            <QrCode size={16} className={showQrCode ? "text-primary" : isDark ? "text-white/50" : "text-gray-500"} />
            Receive
          </button>
          <button onClick={() => { initBridgeForm(); setShowBridgeInDropdown(true); }} className={cn(
            "flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-[11px] font-medium transition-all",
            isDark ? "bg-white/[0.04] hover:bg-white/[0.07] text-white/70" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          )}>
            <ArrowLeftRight size={16} className="text-emerald-400" />
            Bridge
          </button>
        </div>
      </div>

      {/* QR Code */}
      {showQrCode && (
        <div className={cn("mx-4 mb-3 p-3 rounded-xl", isDark ? "bg-white/[0.03]" : "bg-gray-50")}>
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white rounded-lg">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${accountLogin}&bgcolor=ffffff&color=000000&margin=0`} alt="QR" className="w-[72px] h-[72px]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("font-mono text-[10px] break-all leading-relaxed mb-2", isDark ? "text-white/50" : "text-gray-500")}>{accountLogin}</p>
              <button onClick={handleCopyAddress} className={cn(
                "w-full py-1.5 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1",
                addressCopied ? "bg-emerald-500/10 text-emerald-500" : "bg-primary text-white hover:bg-primary/90"
              )}>
                {addressCopied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accounts */}
      <div className={cn("mx-4 mb-3 rounded-xl overflow-hidden", isDark ? "bg-white/[0.02] border border-white/[0.06]" : "bg-gray-50 border border-gray-100")}>
        <button onClick={() => setShowAllAccounts(!showAllAccounts)} className={cn(
          "w-full px-3 py-2 flex items-center justify-between",
          isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-100/50"
        )}>
          <span className={cn("text-[11px] font-medium", isDark ? "text-white/60" : "text-gray-600")}>
            Accounts <span className={cn("ml-1 px-1.5 py-0.5 rounded text-[9px]", isDark ? "bg-white/[0.06] text-white/40" : "bg-gray-200 text-gray-500")}>{profiles.length}</span>
          </span>
          <ChevronDown size={14} className={cn("transition-transform", showAllAccounts && "rotate-180", isDark ? "text-white/30" : "text-gray-400")} />
        </button>

        {showAllAccounts && (
          <div className={cn("border-t max-h-[180px] overflow-y-auto", isDark ? "border-white/[0.04]" : "border-gray-100")}>
            {(() => {
              const currentAccount = profiles.find(p => p.account === accountLogin);
              const others = profiles.filter(p => p.account !== accountLogin);
              const sorted = [...(currentAccount ? [currentAccount] : []), ...others];
              const startIndex = walletPage * walletsPerPage;
              return sorted.slice(startIndex, startIndex + walletsPerPage).map((profile) => {
                const isCurrent = profile.account === accountLogin;
                const isInactive = accountsActivation[profile.account] === false;
                return (
                  <div key={profile.account} className={cn("flex items-center px-3 py-2 gap-2 transition-all",
                    isCurrent ? (isDark ? "bg-primary/10" : "bg-primary/5") : deleteConfirm === profile.account ? (isDark ? "bg-red-500/10" : "bg-red-50") : (isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-100/50")
                  )}>
                    {deleteConfirm === profile.account ? (
                      <div className="flex items-center gap-2 flex-1">
                        <AlertTriangle size={12} className="text-red-400" />
                        <span className={cn("text-[10px] flex-1", isDark ? "text-white/70" : "text-gray-600")}>Delete? Backup seed first!</span>
                        <button onClick={() => { onRemoveProfile(profile.account); setDeleteConfirm(null); }} className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-500 text-white">Yes</button>
                        <button onClick={() => setDeleteConfirm(null)} className={cn("px-2 py-0.5 rounded text-[10px] font-medium", isDark ? "bg-white/10 text-white/60" : "bg-gray-200 text-gray-600")}>No</button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => !isCurrent && onAccountSwitch(profile.account)} className="flex items-center gap-2 flex-1 text-left">
                          <div className={cn("w-1.5 h-1.5 rounded-full", isInactive ? "bg-amber-400/60" : "bg-emerald-400")} />
                          <span className={cn("font-mono text-[11px] flex-1", isCurrent ? (isDark ? "text-white" : "text-gray-900") : (isDark ? "text-white/50" : "text-gray-500"))}>
                            {truncateAccount(profile.account, 8)}
                          </span>
                        </button>
                        {isCurrent ? (
                          <span className="text-[9px] font-medium text-emerald-500">Active</span>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(profile.account); }}
                            className={cn("p-1 rounded transition-colors", isDark ? "text-white/20 hover:text-red-400 hover:bg-red-500/10" : "text-gray-300 hover:text-red-500 hover:bg-red-50")}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={cn("px-4 py-2.5 flex items-center justify-between border-t", isDark ? "border-white/[0.06]" : "border-gray-100")}>
        {onCreateNewAccount && profiles.length < 25 ? (
          <button onClick={onCreateNewAccount} className={cn("flex items-center gap-1 text-[11px] font-medium", "text-primary hover:text-primary/80")}>
            <Plus size={13} /> Add
          </button>
        ) : <div />}
        {needsBackup && (
          <button onClick={onBackupSeed} className="flex items-center gap-1 text-[11px] font-medium text-amber-500 hover:text-amber-400">
            <Shield size={13} /> Backup
          </button>
        )}
        <button onClick={onLogout} className={cn("text-[11px] font-medium", isDark ? "text-white/40 hover:text-red-400" : "text-gray-400 hover:text-red-500")}>
          Logout
        </button>
      </div>
    </div>
  );
};

// ConnectWallet button component for wallet connection
export const ConnectWallet = ({
  text = 'Connect',
  fullWidth = true,
  ...otherProps
}) => {
  const { setOpenWalletModal, themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  return (
    <button
      onClick={() => setOpenWalletModal(true)}
      className={cn(
        'group relative my-2 rounded-xl border-[1.5px] px-4 py-2 text-[0.9rem] font-medium transition-all duration-300 overflow-hidden',
        'before:absolute before:inset-0 before:rounded-[inherit] before:bg-[length:250%_250%,100%_100%] before:bg-[position:200%_0,0_0] before:bg-no-repeat before:transition-[background-position_0s_ease] hover:before:bg-[position:-100%_0,0_0] hover:before:duration-[1500ms]',
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
  const { themeName } = useContext(AppContext);
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
      text: { primary: isDark ? '#fff' : '#000', secondary: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' },
      background: { default: isDark ? '#000000' : '#fff', paper: isDark ? '#070b12' : '#fff' },
      action: { hover: isDark ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.05)', disabled: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.26)' }
    },
    spacing: (...args) => args.map(v => v * 8).join('px ') + 'px'
  };
  // Translation removed - using hardcoded English text

  // Helper to sync profiles to localStorage (profiles are NOT stored in IndexedDB)
  const syncProfilesToIndexedDB = async (profilesArray) => {
    try {
      // Remove duplicates before storing
      const uniqueProfiles = [];
      const seen = new Set();

      profilesArray.forEach(profile => {
        if (!seen.has(profile.account)) {
          seen.add(profile.account);
          uniqueProfiles.push(profile);
        }
      });

      // Store in localStorage (profiles array for UI state management)
      if (typeof window !== 'undefined') {
        localStorage.setItem('profiles', JSON.stringify(uniqueProfiles));
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
  const [accountsActivation, setAccountsActivation] = useState({});
  const [isCheckingActivation, setIsCheckingActivation] = useState(false);
  const [showSeedDialog, setShowSeedDialog] = useState(false);
  const [walletPage, setWalletPage] = useState(0);
  const walletsPerPage = 5;
  const [seedAuthStatus, setSeedAuthStatus] = useState('idle');
  const [displaySeed, setDisplaySeed] = useState('');
  const [seedPassword, setSeedPassword] = useState('');
  const [showSeedPassword, setShowSeedPassword] = useState(false);
  const [seedWarningAgreed, setSeedWarningAgreed] = useState(false);
  const [backupMode, setBackupMode] = useState(null); // 'seed' or 'full'
  const walletStorage = useMemo(() => new EncryptedWalletStorage(), []);
  const [showNewAccountFlow, setShowNewAccountFlow] = useState(false);
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [showNewAccountPassword, setShowNewAccountPassword] = useState(false);
  const [newAccountMode, setNewAccountMode] = useState('new'); // 'new' or 'import'
  const [newAccountSeed, setNewAccountSeed] = useState('');
  const [showBackupPassword, setShowBackupPassword] = useState(false);
  const [backupPassword, setBackupPassword] = useState('');
  const [showBackupPasswordVisible, setShowBackupPasswordVisible] = useState(false);
  const [backupAgreed, setBackupAgreed] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearWarningAgreed, setClearWarningAgreed] = useState(false);
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

  // Post-creation backup screen state
  const [newWalletData, setNewWalletData] = useState(null);
  const [showNewWalletScreen, setShowNewWalletScreen] = useState(false);
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [showNewSeed, setShowNewSeed] = useState(false);
  const [newSeedCopied, setNewSeedCopied] = useState(false);
  const [newAddressCopied, setNewAddressCopied] = useState(false);

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
      } catch (e) {}
    }
  }, []);

  // Persist wallet modal state to sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Only persist if we're in an important flow that shouldn't be lost
    if (showNewWalletScreen && newWalletData) {
      sessionStorage.setItem('wallet_modal_state', JSON.stringify({
        showNewWalletScreen: true,
        newWalletData: {
          address: newWalletData.address,
          publicKey: newWalletData.publicKey,
          seed: newWalletData.seed, // Needed for backup display
          createdAt: newWalletData.createdAt
        },
        backupConfirmed,
        showBridgeForm,
        bridgeData,
        bridgeAmount,
        selectedCurrency,
        estimatedXrp
      }));
    } else if (showNewAccountFlow) {
      sessionStorage.setItem('wallet_modal_state', JSON.stringify({
        showNewAccountFlow: true,
        newAccountMode
      }));
    } else {
      // Clear when no active flow
      sessionStorage.removeItem('wallet_modal_state');
    }
  }, [showNewWalletScreen, newWalletData, backupConfirmed, showBridgeForm, bridgeData, bridgeAmount, selectedCurrency, estimatedXrp, showNewAccountFlow, newAccountMode]);

  // Clear persisted state when wallet setup is complete
  const clearPersistedState = useCallback(() => {
    sessionStorage.removeItem('wallet_modal_state');
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
              const wallets = allReq.result.filter(r =>
                r.data && r.maskedAddress && !r.id?.startsWith?.('__pwd__') && !r.id?.startsWith?.('__lookup__')
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
    const profile = accountProfile;
    if (!seedPassword) {
      openSnackbar('Please enter password', 'error');
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
          wallet = wallets.find(w => w.address === profile.address);
        }
      } else {
        // Other wallets use address lookup
        wallet = await walletStorage.getWallet(profile.address, seedPassword);
      }

      // Also check if seed exists in profile (for legacy wallets)
      if (!wallet && profile.seed) {
        wallet = { seed: profile.seed };
      }

      if (wallet && wallet.seed) {
        if (backupMode === 'seed') {
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
      devError('Error retrieving wallet:', error);
      openSnackbar('Incorrect password', 'error');
      setSeedPassword('');
      setSeedAuthStatus('password-required');
    }
  };

  const handleImportSeed = async () => {
    setIsCreatingWallet(true);
    setOAuthPasswordError('Validating seeds...');
    try {
      // Get all non-empty seeds
      const seedsToImport = importSeeds.filter(s => s.trim()).map(s => s.trim());

      if (seedsToImport.length === 0) {
        throw new Error('Please enter at least one seed');
      }

      // Validate all seeds first
      const validatedWallets = [];
      for (let i = 0; i < seedsToImport.length; i++) {
        const seed = seedsToImport[i];
        if (!seed.startsWith('s')) {
          throw new Error(`Seed ${i + 1} invalid: must start with "s"`);
        }

        const algorithm = seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';

        try {
          const wallet = XRPLWallet.fromSeed(seed, algorithm);
          if (!wallet.address || !wallet.publicKey) {
            throw new Error(`Failed to derive wallet from seed ${i + 1}`);
          }

          // Check for duplicates
          if (validatedWallets.some(w => w.address === wallet.address)) {
            throw new Error(`Seed ${i + 1} creates duplicate wallet`);
          }

          validatedWallets.push(wallet);
          devLog(`Validated seed ${i + 1}: ${wallet.address}`);
        } catch (seedError) {
          throw new Error(`Seed ${i + 1} invalid: ${seedError.message}`);
        }
      }

      // Get OAuth data
      const token = sessionStorage.getItem('oauth_temp_token');
      const provider = sessionStorage.getItem('oauth_temp_provider');
      const userStr = sessionStorage.getItem('oauth_temp_user');
      const user = JSON.parse(userStr);

      // Create wallets array
      const wallets = [];
      const totalWallets = Math.min(25, validatedWallets.length + Math.max(1, 25 - validatedWallets.length));

      // Import all seed wallets first
      for (let i = 0; i < validatedWallets.length && i < 25; i++) {
        const wallet = validatedWallets[i];
        const walletProfile = {
          accountIndex: i,
          account: wallet.address,
          address: wallet.address,
          publicKey: wallet.publicKey,
          seed: wallet.seed,
          wallet_type: 'oauth',
          provider: provider,
          provider_id: user.id,
          imported: true,
          xrp: '0',
          createdAt: Date.now()
        };

        wallets.push(walletProfile);
        await walletStorage.storeWallet(walletProfile, oauthPassword);
        setOAuthPasswordError(`Imported seed wallet ${i + 1}/${validatedWallets.length}...`);
      }

      // Generate additional random wallets if needed to reach 25
      const randomWalletsNeeded = Math.max(0, 25 - validatedWallets.length);
      if (randomWalletsNeeded > 0) {
        setOAuthPasswordError(`Creating ${randomWalletsNeeded} additional wallet${randomWalletsNeeded > 1 ? 's' : ''}...`);

        for (let i = 0; i < randomWalletsNeeded; i++) {
          const wallet = generateRandomWallet();
          const walletData = {
            accountIndex: validatedWallets.length + i,
            account: wallet.address,
            address: wallet.address,
            publicKey: wallet.publicKey,
            seed: wallet.seed,
            wallet_type: 'oauth',
            provider: provider,
            provider_id: user.id,
            xrp: '0',
            createdAt: Date.now()
          };

          wallets.push(walletData);
          await walletStorage.storeWallet(walletData, oauthPassword);
        }
      }

      // Store password for provider
      const walletId = `${provider}_${user.id}`;
      await walletStorage.setSecureItem(`wallet_pwd_${walletId}`, oauthPassword);

      // Clear session
      sessionStorage.removeItem('oauth_temp_token');
      sessionStorage.removeItem('oauth_temp_provider');
      sessionStorage.removeItem('oauth_temp_user');

      // Store auth
      await walletStorage.setSecureItem('jwt', token);
      await walletStorage.setSecureItem('authMethod', provider);
      await walletStorage.setSecureItem('user', user);

      // Add all wallets to profiles
      const allProfiles = [...profiles];
      wallets.forEach(w => {
        if (!allProfiles.find(p => p.account === w.address)) {
          allProfiles.push({ ...w, tokenCreatedAt: Date.now() });
        }
      });

      // Login with first wallet
      doLogIn(wallets[0], allProfiles);

      setShowOAuthPasswordSetup(false);
      setOpenWalletModal(false);
      setOAuthPassword('');
      setImportSeeds(['']);
      setSeedCount(1);

      const importedCount = validatedWallets.length;
      const newCount = randomWalletsNeeded;

      if (importedCount === 25) {
        openSnackbar(`Imported all 25 wallets from seeds!`, 'success');
      } else if (newCount === 0) {
        openSnackbar(`Imported ${importedCount} wallet${importedCount > 1 ? 's' : ''} from seed${importedCount > 1 ? 's' : ''}!`, 'success');
      } else {
        openSnackbar(`Created 25 wallets (${importedCount} from seed${importedCount > 1 ? 's' : ''}, ${newCount} new)`, 'success');
      }
    } catch (error) {
      setOAuthPasswordError(error.message || 'Invalid seed phrase');
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const handleImportWallet = async () => {
    setIsCreatingWallet(true);
    setOAuthPasswordError('Processing backup file...');
    try {
      // Read the import file
      const fileContent = await importFile.text();
      const importData = JSON.parse(fileContent);

      // Validate import file structure
      if (!importData.type || importData.type !== 'xrpl-encrypted-wallet') {
        throw new Error('Invalid wallet backup file');
      }

      if (!importData.data || !importData.data.encrypted) {
        throw new Error('Invalid encrypted wallet data');
      }

      // Get OAuth data from session
      const token = sessionStorage.getItem('oauth_temp_token');
      const provider = sessionStorage.getItem('oauth_temp_provider');
      const userStr = sessionStorage.getItem('oauth_temp_user');

      if (!token || !provider || !userStr) {
        throw new Error('Missing OAuth data');
      }

      const user = JSON.parse(userStr);

      // Decrypt backup to get wallets
      let wallets = [];
      try {
        // Try to decrypt with provided password
        const decrypted = await walletStorage.decryptData(importData.data.encrypted, oauthPassword);

        // Check if it's multi-wallet format (v3.0) or single wallet
        if (decrypted.wallets && Array.isArray(decrypted.wallets)) {
          // Multi-wallet backup (v3.0)
          wallets = decrypted.wallets;
          setOAuthPasswordError(`Found ${wallets.length} wallet${wallets.length > 1 ? 's' : ''} in backup...`);
        } else if (decrypted.seed) {
          // Single wallet or old format
          wallets = [decrypted];
        } else {
          throw new Error('Invalid backup format');
        }
      } catch (decryptError) {
        throw new Error('Incorrect password or corrupted backup file');
      }

      // Store all imported wallets
      const storedWallets = [];
      for (let i = 0; i < wallets.length; i++) {
        const walletData = wallets[i];
        const profile = {
          accountIndex: i,
          account: walletData.address,
          address: walletData.address,
          publicKey: walletData.publicKey,
          seed: walletData.seed,
          wallet_type: 'oauth',
          provider: provider,
          provider_id: user.id,
          imported: true,
          xrp: '0',
          createdAt: walletData.createdAt || Date.now()
        };

        await walletStorage.storeWallet(profile, oauthPassword);
        storedWallets.push(profile);
        setOAuthPasswordError(`Importing wallet ${i + 1}/${wallets.length}...`);
      }

      // Store password for provider
      const walletId = `${provider}_${user.id}`;
      await walletStorage.setSecureItem(`wallet_pwd_${walletId}`, oauthPassword);

      // Clear temporary session data
      sessionStorage.removeItem('oauth_temp_token');
      sessionStorage.removeItem('oauth_temp_provider');
      sessionStorage.removeItem('oauth_temp_user');
      sessionStorage.removeItem('oauth_action');

      // Store permanent auth data
      await walletStorage.setSecureItem('jwt', token);
      await walletStorage.setSecureItem('authMethod', provider);
      await walletStorage.setSecureItem('user', user);

      // Add all wallets to profiles
      const allProfiles = [...profiles];
      storedWallets.forEach(w => {
        if (!allProfiles.find(p => p.account === w.address)) {
          allProfiles.push({ ...w, tokenCreatedAt: Date.now() });
        }
      });

      // Login with the first imported wallet
      doLogIn(storedWallets[0], allProfiles);

      // Close dialogs
      setShowOAuthPasswordSetup(false);
      setOpenWalletModal(false);

      // Reset state
      setOAuthPassword('');
      setOAuthConfirmPassword('');
      setImportFile(null);
      setImportMethod('new');

      openSnackbar(`Imported ${storedWallets.length} wallet${storedWallets.length > 1 ? 's' : ''} successfully!`, 'success');
    } catch (error) {
      devError('Import error:', error);
      setOAuthPasswordError(error.message || 'Failed to import wallet');
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const {
    setActiveProfile,
    accountProfile,
    profiles,
    setProfiles,
    removeProfile,
    openSnackbar,
    darkMode,
    setOpenWalletModal,
    openWalletModal,
    pendingWalletAuth,
    setPendingWalletAuth,
    open,
    setOpen,
    accountBalance,
    handleOpen,
    handleClose,
    handleLogin,
    handleLogout,
    doLogIn
  } = useContext(AppContext);

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
  }, [showNewWalletScreen, newWalletData, showNewAccountFlow, openWalletModal, open, setOpenWalletModal]);

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

    setIsUnlocking(true);
    setUnlockError('');

    try {
      const wallets = await walletStorage.unlockWithPassword(unlockPassword);

      if (!wallets || wallets.length === 0) {
        setUnlockError('Incorrect password');
        return;
      }

      // Get device fingerprint ID for device wallets (survives storage clearing)
      const hasDeviceWallets = wallets.some(w => w.wallet_type === 'device');
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
        deviceKeyId: w.wallet_type === 'device' ? (w.deviceKeyId || deviceKeyId) : w.deviceKeyId,
        accountIndex: w.accountIndex ?? index,
        createdAt: w.createdAt || Date.now(),
        tokenCreatedAt: Date.now()
      }));

      setProfiles(allProfiles);
      localStorage.setItem('profiles', JSON.stringify(allProfiles));
      doLogIn(allProfiles[0], allProfiles);

      setUnlockPassword('');
      setOpenWalletModal(false);
      openSnackbar('Wallet unlocked', 'success');
    } catch (error) {
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

    setIsCreating(true);
    setCreateError('');

    try {
      const wallet = generateRandomWallet();

      // Generate stable device fingerprint ID (survives storage clearing)
      const { deviceFingerprint } = await import('src/utils/encryptedWalletStorage');
      const deviceKeyId = await deviceFingerprint.getDeviceId();

      const walletData = {
        account: wallet.address,
        address: wallet.address,
        publicKey: wallet.publicKey,
        wallet_type: 'device',
        deviceKeyId: deviceKeyId,
        xrp: '0',
        createdAt: Date.now(),
        seed: wallet.seed
      };

      await walletStorage.storeWallet(walletData, createPassword);
      // Store password for auto-retrieval (like OAuth wallets do)
      await walletStorage.storeWalletCredential(deviceKeyId, createPassword);
      localStorage.setItem(`wallet_needs_backup_${wallet.address}`, 'true');

      const profile = {
        account: wallet.address,
        address: wallet.address,
        publicKey: wallet.publicKey,
        wallet_type: 'device',
        deviceKeyId: deviceKeyId,
        accountIndex: 0,
        createdAt: Date.now(),
        tokenCreatedAt: Date.now()
      };

      setProfiles([profile]);
      localStorage.setItem('profiles', JSON.stringify([profile]));
      doLogIn(profile, [profile]);

      // Store wallet data for backup screen (includes seed)
      setNewWalletData({ ...walletData, profile });
      setShowNewWalletScreen(true);
      setBackupConfirmed(false);
      setShowNewSeed(false);
      setNewSeedCopied(false);
      setNewAddressCopied(false);
      setShowBridgeForm(false);
      setBridgeData(null);
      setBridgeError('');

      setCreatePassword('');
      setCreatePasswordConfirm('');
    } catch (error) {
      setCreateError(error.message || 'Failed to create wallet');
    } finally {
      setIsCreating(false);
    }
  };

  // Complete wallet setup after backup confirmation
  const handleCompleteSetup = () => {
    setShowNewWalletScreen(false);
    setNewWalletData(null);
    setShowBridgeForm(false);
    setBridgeData(null);
    setOpenWalletModal(false);
    clearPersistedState(); // Clear sessionStorage
    openSnackbar('Wallet ready!', 'success');
  };

  // Fetch available currencies
  const fetchCurrencies = useCallback(async () => {
    if (currencies.length > 0) return;
    try {
      const res = await fetch('https://api.xrpl.to/api/bridge/currencies');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Handle both array and object with currencies property
      const currencyList = Array.isArray(data) ? data : (data.currencies || data.data || []);
      if (!currencyList.length) throw new Error('Empty response');

      const popular = ['btc', 'eth', 'usdt', 'usdc', 'bnb', 'sol', 'ada', 'doge', 'matic', 'ltc', 'trx', 'avax'];
      const sorted = currencyList
        .filter(c => c.ticker !== 'xrp')
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
        `https://api.xrpl.to/api/bridge/min-amount?fromCurrency=${fromCurr}&toCurrency=${toCurr}&fromNetwork=${fromNet}&toNetwork=${toNet}`
      );
      if (minRes.ok) {
        const minData = await minRes.json();
        setMinAmount(minData.minAmount);
        if (parseFloat(bridgeAmount) < minData.minAmount) {
          setBridgeError(`Min: ${minData.minAmount} ${isToXrp ? selectedCurrency.ticker.toUpperCase() : 'XRP'}`);
          setEstimatedXrp(null);
          return;
        }
      }
      setBridgeError('');
      const estRes = await fetch(
        `https://api.xrpl.to/api/bridge/estimate?fromCurrency=${fromCurr}&toCurrency=${toCurr}&fromAmount=${bridgeAmount}&fromNetwork=${fromNet}&toNetwork=${toNet}`
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
  const handleCreateBridge = async (targetAddress = null) => {
    const address = targetAddress || newWalletData?.address || accountLogin;
    if (!bridgeAmount || !address || !selectedCurrency) return;

    setBridgeLoading(true);
    setBridgeError('');

    const isToXrp = swapDirection === 'toXrp';
    try {
      const res = await fetch('https://api.xrpl.to/api/bridge/create', {
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
      localStorage.setItem(`bridge_tx_${data.id}`, JSON.stringify({
        id: data.id,
        fromCurrency: isToXrp ? selectedCurrency.ticker : 'xrp',
        toCurrency: isToXrp ? 'xrp' : selectedCurrency.ticker,
        fromAmount: bridgeAmount,
        expectedAmount: estimatedXrp,
        address: address,
        createdAt: Date.now()
      }));
    } catch (err) {
      setBridgeError(err.message || 'Failed to create exchange');
    } finally {
      setBridgeLoading(false);
    }
  };

  const checkAccountActivity = useCallback(async (address) => {
    try {
      const isDevelopment = true;

      if (isDevelopment) {
        // Use backend testnet endpoint
        const response = await fetch(`https://api.xrpl.to/api/testnet/${address}`);
        if (response.ok) {
          const data = await response.json();
          if (data.balanceXRP) {
            return parseFloat(data.balanceXRP) >= 1;
          }
        }
        return false;
      } else {
        // Production
        const response = await fetch(`https://api.xrpl.to/api/account/account_info/${address}`);
        if (response.status === 404) return false;
        if (!response.ok) return false;

        const data = await response.json();
        if (data.account_data?.Balance) {
          const balance = parseFloat(data.account_data.Balance) / 1000000;
          return balance >= 1;
        }
        return false;
      }
    } catch (err) {
      return false;
    }
  }, []);

  // Removed visibleWalletCount - now showing all accounts by default with search/pagination

  // Disabled - activation checks were slowing down modal open
  // Accounts now show green by default (optimistic UI)
  // Balance is shown from profile.xrp which is updated on account switch
  useEffect(() => {
    // Skip activation checks - instant display is more important
    // The green/red dots will always show green now (optimistic)
    return;
  }, [profiles, accountProfile, walletPage, walletsPerPage]);

  const handleBackupSeed = async () => {
    const profile = accountProfile;
    if (!profile) return;

    setShowSeedDialog(true);
    setSeedAuthStatus('select-mode'); // Show mode selection first
    setBackupMode(null);
    setSeedPassword('');
    setDisplaySeed('');
  };

  const handleDownloadBackup = async () => {
    const profile = accountProfile;
    if (!profile) return;

    // Show password input UI
    setShowBackupPassword(true);
    setBackupPassword('');
  };

  const processBackupDownload = async () => {
    const profile = accountProfile;
    if (!profile || !backupPassword) {
      openSnackbar('Please enter your password', 'error');
      return;
    }

    try {
      let backupData;

      if (profile.wallet_type === 'oauth' || profile.wallet_type === 'social') {
        // Export all wallets for OAuth provider
        backupData = await walletStorage.exportAllWallets(
          profile.provider,
          profile.provider_id,
          backupPassword
        );
      } else if (profile.wallet_type === 'device') {
        // Export all wallets for device
        const allWallets = await walletStorage.getAllWallets(backupPassword);
        const deviceWallets = allWallets.filter(w => w.deviceKeyId === profile.deviceKeyId);

        if (deviceWallets.length === 0) {
          throw new Error('No wallets found');
        }

        backupData = {
          type: 'xrpl-encrypted-wallet',
          version: '3.0',
          walletCount: deviceWallets.length,
          data: {
            encrypted: await walletStorage.encryptData({
              wallets: deviceWallets.map(w => ({
                address: w.address,
                publicKey: w.publicKey,
                seed: w.seed,
                createdAt: w.createdAt || Date.now()
              }))
            }, backupPassword)
          },
          exportedAt: new Date().toISOString()
        };
      } else {
        throw new Error('Unsupported wallet type');
      }

      // Create download
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `xrpl-wallet-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      openSnackbar(`Backup downloaded (${backupData.walletCount} wallets)`, 'success');

      // Mark as backed up
      profiles.forEach(p => {
        if (p.account) {
          localStorage.removeItem(`wallet_needs_backup_${p.account}`);
        }
      });

      // Reset and hide password UI
      setShowBackupPassword(false);
      setBackupPassword('');
      setShowBackupPasswordVisible(false);
      setBackupAgreed(false);
    } catch (error) {
      openSnackbar('Backup failed: ' + (error.message === 'Invalid PIN' ? 'Incorrect password' : error.message), 'error');
      setBackupPassword('');
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
            const wallets = allReq.result.filter(r =>
              r.data && r.maskedAddress && !r.id?.startsWith?.('__pwd__') && !r.id?.startsWith?.('__entropy_backup__')
            );
            setStoredWalletCount(wallets.length);
            if (wallets.length > 0) {
              const oldest = Math.min(...wallets.map(w => w.timestamp || Date.now()));
              setStoredWalletDate(oldest);
              // Get masked addresses from IndexedDB (or fallback to localStorage)
              const masked = wallets.map(w => w.maskedAddress).filter(Boolean);
              if (masked.length > 0) {
                setStoredWalletAddresses(masked);
              } else {
                // Fallback: try localStorage profiles
                const storedProfiles = localStorage.getItem('profiles');
                if (storedProfiles) {
                  const parsed = JSON.parse(storedProfiles);
                  setStoredWalletAddresses(parsed.map(p => {
                    const addr = p.account || p.address;
                    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : null;
                  }).filter(Boolean));
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
              setStoredWalletAddresses(parsed.map(p => {
                const addr = p.account || p.address;
                return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : null;
              }).filter(Boolean));
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
      const dbs = await indexedDB.databases?.() || [];
      for (const db of dbs) {
        if (db.name === 'XRPLWalletDB') {
          indexedDB.deleteDatabase('XRPLWalletDB');
        }
      }

      // Fallback: directly delete database
      const deleteRequest = indexedDB.deleteDatabase('XRPLWalletDB');
      deleteRequest.onsuccess = () => console.log('IndexedDB deleted');
      deleteRequest.onerror = () => console.log('IndexedDB delete error');
      deleteRequest.onblocked = () => console.log('IndexedDB delete blocked - will clear on reload');

      // Clear all wallet-related localStorage keys
      localStorage.removeItem('profiles');
      localStorage.removeItem('accountLogin');
      localStorage.removeItem('authMethod');
      localStorage.removeItem('user');

      // Clear all backup flags and encrypted items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('wallet_') ||
          key.startsWith('jwt') ||
          key.endsWith('_enc')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Clear session storage OAuth data
      sessionStorage.removeItem('oauth_temp_token');
      sessionStorage.removeItem('oauth_temp_provider');
      sessionStorage.removeItem('oauth_temp_user');
      sessionStorage.removeItem('oauth_action');

      // Clear state
      setProfiles([]);
      setStoredWalletCount(0);

      // Logout
      handleLogout();
      setShowClearConfirm(false);
      setClearSliderValue(0);
      setOpenWalletModal(false);
      openSnackbar('All wallets cleared', 'success');

      // Force reload to ensure clean state
      setTimeout(() => window.location.reload(), 500);
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
        const algorithm = getAlgorithmFromSeed(newAccountSeed.trim());
        wallet = XRPLWallet.fromSeed(newAccountSeed.trim(), { algorithm });
        // Check if already exists
        if (profiles.find(p => p.account === wallet.address)) {
          openSnackbar('This wallet is already added', 'warning');
          return;
        }
      } else {
        wallet = generateRandomWallet();
      }

      const walletData = {
        deviceKeyId: accountProfile.deviceKeyId,
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

      // Store encrypted with same password
      await walletStorage.storeWallet(walletData, newAccountPassword);

      // For OAuth wallets, ensure password is stored for provider
      if (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social') {
        const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
        await walletStorage.setSecureItem(`wallet_pwd_${walletId}`, newAccountPassword);
      }

      // Update profiles
      const allProfiles = [...profiles, { ...walletData, tokenCreatedAt: Date.now() }];
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

      openSnackbar(newAccountMode === 'import' ? 'Wallet imported' : `Account #${allProfiles.length} created`, 'success');
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
            'group relative flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200',
            accountProfile
              ? 'h-9 min-w-[130px] px-4'
              : 'h-9 px-5',
            isDark
              ? accountProfile
                ? showNewWalletScreen && newWalletData
                  ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/15 ring-1 ring-amber-500/30'
                  : 'bg-white/[0.05] text-white hover:bg-white/[0.08] ring-1 ring-white/[0.06]'
                : 'bg-primary/10 text-primary hover:bg-primary/15 ring-1 ring-primary/20'
              : accountProfile
                ? showNewWalletScreen && newWalletData
                  ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 ring-1 ring-amber-200'
                  : 'bg-gray-50 text-gray-900 hover:bg-gray-100 ring-1 ring-gray-200'
                : 'bg-primary/5 text-primary hover:bg-primary/10 ring-1 ring-primary/20'
          )}
          title={showNewWalletScreen && newWalletData ? 'Complete wallet setup' : (accountProfile ? 'Account Details' : 'Connect Wallet')}
        >
          {/* Pending setup indicator */}
          {showNewWalletScreen && newWalletData && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
            </span>
          )}
          {accountProfile ? (
            <>
              <div className="relative">
                <div className={cn(
                  'h-2 w-2 rounded-full',
                  showNewWalletScreen && newWalletData
                    ? 'bg-amber-400'
                    : accountsActivation[accountLogin] === false ? 'bg-red-500' : 'bg-emerald-400'
                )} />
                {!(showNewWalletScreen && newWalletData) && accountsActivation[accountLogin] !== false && (
                  <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-400 animate-ping opacity-50" />
                )}
              </div>
              <span className="font-mono text-[13px] tracking-tight">
                {showNewWalletScreen && newWalletData ? 'Setup' : truncateAccount(accountLogin, 6)}
              </span>
              <ChevronDown size={12} className={cn(
                "transition-transform duration-200",
                open ? "rotate-180" : "",
                showNewWalletScreen && newWalletData
                  ? "text-amber-500"
                  : isDark ? "text-white/40" : "text-gray-400"
              )} />
            </>
          ) : (
            <>
              <span className="text-[13px] font-medium">Connect</span>
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
              const hasProgress = (!hasExistingWallet && (createPassword || createPasswordConfirm)) ||
                                 (hasExistingWallet && unlockPassword);
              if (hasProgress) {
                if (!window.confirm('You have unsaved progress. Close anyway?')) return;
                setCreatePassword('');
                setCreatePasswordConfirm('');
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
              width: '320px',
              maxWidth: '320px',
              background: 'transparent',
              boxShadow: 'none',
              position: 'fixed',
              top: '60px',
              right: '12px',
              left: 'auto',
              transform: 'none !important',
              margin: 0,
            },
            zIndex: 9999
          }}
        >
          <DialogContent sx={{ p: 0 }}>
            <StyledPopoverPaper isDark={isDark} isMobile={isMobileView}>
            {/* Show backup screen even when logged in */}
            {showNewWalletScreen && newWalletData ? (
              <div className={isDark ? "text-white" : "text-gray-900"}>
                {/* Header */}
                <div className={cn(
                  "px-5 py-4 flex items-center justify-between",
                  isDark ? "border-b border-white/[0.04]" : "border-b border-gray-100"
                )}>
                  <h2 className="text-[15px] font-medium tracking-tight">Wallet Created</h2>
                  <button
                    onClick={() => {
                      // X button disabled during entire setup - user must complete flow
                      return;
                    }}
                    className={cn(
                      "p-1.5 rounded-lg transition-all duration-150 relative opacity-30 cursor-not-allowed",
                      isDark ? "text-white/30" : "text-gray-400"
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
                    <div className={cn(
                      "mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full",
                      "bg-emerald-500/15"
                    )}>
                      <Check size={20} className="text-emerald-500" />
                    </div>
                    <h3 className={cn("text-[14px] font-medium", isDark ? "text-white" : "text-gray-900")}>
                      Wallet Created
                    </h3>
                    <p className={cn("text-[11px] mt-0.5", isDark ? "text-white/40" : "text-gray-400")}>
                      Fund with 1+ XRP to activate
                    </p>
                  </div>

                  {/* Backup Warning */}
                  <div className={cn(
                    "rounded-lg border p-3",
                    "border-amber-500/20 bg-amber-500/5"
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle size={12} className="text-amber-500" />
                        <span className={cn("text-[11px] font-medium", isDark ? "text-white" : "text-gray-900")}>
                          Backup Secret Key
                        </span>
                      </div>
                      <button
                        onClick={() => setShowNewSeed(!showNewSeed)}
                        className={cn(
                          "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-colors",
                          isDark ? "text-amber-400 hover:bg-amber-500/10" : "text-amber-600 hover:bg-amber-50"
                        )}
                      >
                        {showNewSeed ? <EyeOff size={11} /> : <Eye size={11} />}
                        {showNewSeed ? 'Hide' : 'Reveal'}
                      </button>
                    </div>

                    {showNewSeed ? (
                      <div className={cn(
                        "rounded border p-2 mb-2",
                        isDark ? "border-white/10 bg-black/30" : "border-gray-200 bg-white"
                      )}>
                        <div className="flex items-center justify-between gap-2">
                          <code className={cn(
                            "text-[10px] font-mono break-all flex-1",
                            isDark ? "text-white/90" : "text-gray-900"
                          )}>
                            {newWalletData.seed}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(newWalletData.seed);
                              setNewSeedCopied(true);
                              setTimeout(() => setNewSeedCopied(false), 2000);
                            }}
                            className={cn(
                              "flex-shrink-0 p-1 rounded transition-colors",
                              newSeedCopied
                                ? "bg-emerald-500/15 text-emerald-500"
                                : isDark
                                ? "bg-white/10 text-white/60 hover:bg-white/15"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            )}
                          >
                            {newSeedCopied ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={cn(
                        "rounded border p-2 mb-2 text-center",
                        isDark ? "border-white/10 bg-black/30" : "border-gray-200 bg-white"
                      )}>
                        <span className={cn("text-[10px]", isDark ? "text-white/30" : "text-gray-400")}>
                          Click "Reveal" to view
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
                      <span className={cn("text-[10px] leading-relaxed", isDark ? "text-white/50" : "text-gray-500")}>
                        I've saved my secret key securely
                      </span>
                    </label>
                  </div>

                  {/* Wallet Address with QR */}
                  <div className={cn(
                    "rounded-lg border p-3",
                    isDark ? "border-white/[0.08] bg-white/[0.02]" : "border-gray-200 bg-gray-50"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white p-1.5">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${newWalletData.address}`}
                          alt="QR"
                          width={60}
                          height={60}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[9px] uppercase tracking-wide mb-1", isDark ? "text-white/30" : "text-gray-400")}>
                          Your Address
                        </p>
                        <div className="flex items-center gap-1.5">
                          <code className={cn(
                            "text-[11px] font-mono truncate",
                            isDark ? "text-white/70" : "text-gray-700"
                          )}>
                            {newWalletData.address.slice(0, 10)}...{newWalletData.address.slice(-6)}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(newWalletData.address);
                              setNewAddressCopied(true);
                              setTimeout(() => setNewAddressCopied(false), 2000);
                            }}
                            className={cn(
                              "p-1 rounded transition-colors",
                              newAddressCopied
                                ? "bg-emerald-500/15 text-emerald-500"
                                : isDark
                                ? "text-white/40 hover:text-white/60"
                                : "text-gray-400 hover:text-gray-600"
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
                            <span className={cn("text-[12px] font-medium", isDark ? "text-white" : "text-gray-900")}>
                              Exchange Created
                            </span>
                          </div>

                          {/* Deposit info card */}
                          <div className={cn(
                            "rounded-xl border p-3",
                            isDark ? "border-white/[0.08] bg-white/[0.02]" : "border-gray-200 bg-gray-50"
                          )}>
                            <div className="flex items-center gap-2 mb-2">
                              {selectedCurrency?.image ? (
                                <img src={selectedCurrency.image} alt="" className="w-5 h-5 rounded-full" />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center text-[9px] font-bold text-white">
                                  {selectedCurrency?.ticker?.[0]?.toUpperCase() || '?'}
                                </div>
                              )}
                              <span className={cn("text-[11px]", isDark ? "text-white/60" : "text-gray-600")}>
                                Send {bridgeAmount} {selectedCurrency?.ticker?.toUpperCase()}
                              </span>
                              <ArrowLeftRight size={12} className={isDark ? "text-white/30" : "text-gray-400"} />
                              <span className={cn("text-[11px] text-emerald-500 font-medium")}>
                                ~{bridgeData.expectedAmountTo || estimatedXrp || '?'} XRP
                              </span>
                            </div>

                            <p className={cn("text-[9px] uppercase tracking-wide mb-1", isDark ? "text-white/30" : "text-gray-400")}>
                              Deposit Address
                            </p>
                            <div className={cn(
                              "rounded-lg border p-2",
                              isDark ? "border-white/10 bg-black/30" : "border-gray-200 bg-white"
                            )}>
                              <div className="flex items-center justify-between gap-2">
                                <code className={cn(
                                  "text-[10px] font-mono break-all flex-1",
                                  isDark ? "text-white/90" : "text-gray-900"
                                )}>
                                  {bridgeData.payinAddress}
                                </code>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(bridgeData.payinAddress);
                                    setBridgeAddressCopied(true);
                                    setTimeout(() => setBridgeAddressCopied(false), 2000);
                                  }}
                                  className={cn(
                                    "flex-shrink-0 p-1.5 rounded-lg transition-colors",
                                    bridgeAddressCopied
                                      ? "bg-emerald-500/15 text-emerald-500"
                                      : isDark
                                      ? "bg-white/10 text-white/60 hover:bg-white/15"
                                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                              "w-full py-2 rounded-lg text-[11px] transition-all",
                              isDark ? "text-white/50 hover:text-white/70" : "text-gray-500 hover:text-gray-700"
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
                                "w-full flex items-center justify-between p-3 rounded-lg border transition-colors",
                                isDark ? "border-white/[0.08] bg-white/[0.02] hover:border-white/15" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                              )}
                            >
                              {selectedCurrency ? (
                                <div className="flex items-center gap-2">
                                  {selectedCurrency.image && (
                                    <img src={selectedCurrency.image} alt="" className="w-5 h-5 rounded-full" />
                                  )}
                                  <span className={cn("text-[13px] font-medium", isDark ? "text-white" : "text-gray-900")}>
                                    {selectedCurrency.ticker.toUpperCase()}
                                  </span>
                                  <span className={cn("text-[11px]", isDark ? "text-white/40" : "text-gray-400")}>
                                    {selectedCurrency.name}
                                  </span>
                                </div>
                              ) : (
                                <span className={cn("text-[13px]", isDark ? "text-white/40" : "text-gray-400")}>
                                  {currencies.length ? 'Select currency' : 'Loading...'}
                                </span>
                              )}
                              <ChevronDown size={16} className={cn(isDark ? "text-white/40" : "text-gray-400", showCurrencyDropdown && "rotate-180")} />
                            </button>

                            {showCurrencyDropdown && (
                              <div className={cn(
                                "absolute z-50 mt-1 w-full rounded-lg border shadow-lg max-h-[200px] overflow-hidden",
                                isDark ? "border-white/10 bg-[#1a1a1a]" : "border-gray-200 bg-white"
                              )}>
                                <div className="p-2 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb' }}>
                                  <input
                                    type="text"
                                    value={currencySearch}
                                    onChange={(e) => setCurrencySearch(e.target.value)}
                                    placeholder="Search..."
                                    autoFocus
                                    className={cn(
                                      "w-full px-2 py-1.5 rounded text-[12px] outline-none",
                                      isDark ? "bg-white/5 text-white placeholder:text-white/30" : "bg-gray-50 text-gray-900 placeholder:text-gray-400"
                                    )}
                                  />
                                </div>
                                <div className="overflow-y-auto max-h-[200px]">
                                  {(() => {
                                    const filtered = currencies.filter(c =>
                                      !currencySearch ||
                                      c.ticker.toLowerCase().includes(currencySearch.toLowerCase()) ||
                                      c.name.toLowerCase().includes(currencySearch.toLowerCase())
                                    );
                                    const shown = filtered.slice(0, currencySearch ? 100 : 30);
                                    return shown.length === 0 ? (
                                      <div className={cn("px-3 py-4 text-center text-[11px]", isDark ? "text-white/30" : "text-gray-400")}>
                                        No results for "{currencySearch}"
                                      </div>
                                    ) : shown.map((c) => (
                                      <button
                                        key={`${c.ticker}-${c.network}`}
                                        onClick={() => { setSelectedCurrency(c); setShowCurrencyDropdown(false); setCurrencySearch(''); setEstimatedXrp(null); }}
                                        className={cn(
                                          "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors",
                                          selectedCurrency?.ticker === c.ticker && selectedCurrency?.network === c.network
                                            ? isDark ? "bg-white/10" : "bg-blue-50"
                                            : isDark ? "hover:bg-white/5" : "hover:bg-gray-50"
                                        )}
                                      >
                                        {c.image && <img src={c.image} alt="" className="w-5 h-5 rounded-full" />}
                                        <span className={cn("text-[12px] font-medium", isDark ? "text-white" : "text-gray-900")}>
                                          {c.ticker.toUpperCase()}
                                        </span>
                                        <span className={cn("text-[10px] flex-1", isDark ? "text-white/30" : "text-gray-400")}>
                                          {c.name}
                                        </span>
                                        {c.network !== c.ticker && (
                                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded", isDark ? "bg-white/10 text-white/50" : "bg-gray-100 text-gray-500")}>
                                            {c.network}
                                          </span>
                                        )}
                                      </button>
                                    ));
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Amount Input */}
                          <div className={cn(
                            "rounded-lg border p-3",
                            isDark ? "border-white/[0.06] bg-white/[0.02]" : "border-gray-100 bg-gray-50"
                          )}>
                            <label className={cn("text-[10px] uppercase tracking-wide", isDark ? "text-white/30" : "text-gray-400")}>
                              Amount
                            </label>
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="number"
                                value={bridgeAmount}
                                onChange={(e) => setBridgeAmount(e.target.value)}
                                placeholder={minAmount ? `Min: ${minAmount}` : "0.00"}
                                step="0.0001"
                                min="0"
                                className={cn(
                                  "flex-1 bg-transparent text-[18px] font-medium outline-none",
                                  isDark ? "text-white placeholder:text-white/20" : "text-gray-900 placeholder:text-gray-300"
                                )}
                              />
                              <span className={cn("text-[13px] font-medium", isDark ? "text-white/50" : "text-gray-500")}>
                                {selectedCurrency?.ticker?.toUpperCase() || '---'}
                              </span>
                            </div>
                            {/* Estimate display */}
                            {estimatedXrp && (
                              <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb' }}>
                                <span className={cn("text-[10px]", isDark ? "text-white/40" : "text-gray-400")}>You'll receive</span>
                                <span className={cn("text-[13px] font-medium text-emerald-500")}>~{estimatedXrp} XRP</span>
                              </div>
                            )}
                          </div>
                          {bridgeError && (
                            <div className={cn("p-2 rounded-lg text-[11px]", "bg-red-500/10 text-red-400 border border-red-500/20")}>
                              {bridgeError}
                            </div>
                          )}
                          <button
                            onClick={handleCreateBridge}
                            disabled={bridgeLoading || !bridgeAmount || !selectedCurrency || !estimatedXrp}
                            className={cn(
                              "w-full py-2.5 rounded-lg text-[12px] font-medium transition-all flex items-center justify-center gap-2",
                              bridgeAmount && selectedCurrency && estimatedXrp
                                ? "bg-primary text-white hover:bg-primary/90"
                                : isDark
                                ? "bg-white/5 text-white/30 cursor-not-allowed"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            )}
                          >
                            {bridgeLoading ? <Loader2 size={14} className="animate-spin" /> : (
                              <>
                                <ArrowLeftRight size={14} />
                                {estimatedXrp ? `Swap to ~${estimatedXrp} XRP` : 'Enter amount'}
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setShowBridgeForm(false)}
                            className={cn(
                              "w-full py-2 rounded-lg text-[11px] transition-all",
                              isDark ? "text-white/50 hover:text-white/70" : "text-gray-500 hover:text-gray-700"
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
                          "w-full py-2.5 rounded-lg text-[12px] font-medium transition-all flex items-center justify-center gap-2",
                          backupConfirmed
                            ? "bg-primary text-white hover:bg-primary/90"
                            : isDark
                            ? "bg-white/5 text-white/30 cursor-not-allowed"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        )}
                      >
                        <ArrowLeftRight size={14} />
                        Fund with Crypto Swap
                      </button>
                      <button
                        onClick={handleCompleteSetup}
                        disabled={!backupConfirmed}
                        className={cn(
                          "w-full py-2 rounded-lg text-[11px] transition-all",
                          backupConfirmed
                            ? isDark ? "text-white/50 hover:text-white/70" : "text-gray-500 hover:text-gray-700"
                            : isDark ? "text-white/20 cursor-not-allowed" : "text-gray-300 cursor-not-allowed"
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
                    onClose={() => { setOpen(false); setOpenWalletModal(false); }}
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
                    handleDownloadBackup={handleDownloadBackup}
                    showBackupPassword={showBackupPassword}
                    backupPassword={backupPassword}
                    setBackupPassword={setBackupPassword}
                    showBackupPasswordVisible={showBackupPasswordVisible}
                    setShowBackupPasswordVisible={setShowBackupPasswordVisible}
                    processBackupDownload={processBackupDownload}
                    setShowBackupPassword={setShowBackupPassword}
                    backupAgreed={backupAgreed}
                    setBackupAgreed={setBackupAgreed}
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
                  />
                ) : showNewAccountFlow ? (
                  <div className={cn("p-5", isDark ? "text-white" : "text-gray-900")}>
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium">Add Account</h3>
                        <button
                          onClick={() => { setShowNewAccountFlow(false); setNewAccountPassword(''); setNewAccountSeed(''); setNewAccountMode('new'); clearPersistedState(); }}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            isDark ? "hover:bg-white/5 text-white/40 hover:text-white/60" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
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
                            "flex-1 rounded-lg border-[1.5px] px-3 py-2 text-[13px] font-normal transition-colors",
                            newAccountMode === 'new'
                              ? "border-primary bg-primary text-white"
                              : isDark
                              ? "border-[#3f96fe]/20 text-white hover:border-[#3f96fe]/40"
                              : "border-blue-200 text-gray-900 hover:bg-blue-50"
                          )}
                        >
                          New
                        </button>
                        <button
                          onClick={() => setNewAccountMode('import')}
                          className={cn(
                            "flex-1 rounded-lg border-[1.5px] px-3 py-2 text-[13px] font-normal transition-colors",
                            newAccountMode === 'import'
                              ? "border-primary bg-primary text-white"
                              : isDark
                              ? "border-[#3f96fe]/20 text-white hover:border-[#3f96fe]/40"
                              : "border-blue-200 text-gray-900 hover:bg-blue-50"
                          )}
                        >
                          Import Seed
                        </button>
                      </div>

                      {/* Seed Input (import mode only) */}
                      {newAccountMode === 'import' && (
                        <div className="space-y-2">
                          <label className={cn("text-xs font-medium", isDark ? "text-white/60" : "text-gray-500")}>
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
                                    "w-full px-4 py-3 rounded-xl text-sm font-mono outline-none transition-all",
                                    hasInput && !validation.valid
                                      ? "border-red-500/50 focus:border-red-500"
                                      : hasInput && validation.valid
                                      ? "border-green-500/50 focus:border-green-500"
                                      : isDark
                                      ? "border-[#3f96fe]/20 focus:border-[#3f96fe]/50"
                                      : "border-blue-200 focus:border-[#3f96fe]",
                                    isDark
                                      ? "bg-white/[0.03] border text-white placeholder:text-white/30"
                                      : "bg-white border text-gray-900 placeholder:text-gray-400"
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
                        <label className={cn("text-xs font-medium", isDark ? "text-white/60" : "text-gray-500")}>
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showNewAccountPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            value={newAccountPassword}
                            onChange={(e) => setNewAccountPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && newAccountPassword && (newAccountMode === 'new' || validateSeed(newAccountSeed).valid) && handleCreateNewAccount()}
                            autoFocus={newAccountMode === 'new'}
                            autoComplete="off"
                            className={cn(
                              "w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all",
                              isDark
                                ? "bg-white/[0.04] border border-[#3f96fe]/20 text-white placeholder:text-white/30 focus:border-[#3f96fe]/50"
                                : "bg-white border border-blue-200 text-gray-900 placeholder:text-gray-400 focus:border-[#3f96fe]"
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewAccountPassword(!showNewAccountPassword)}
                            className={cn(
                              "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors",
                              isDark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600"
                            )}
                          >
                            {showNewAccountPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-1">
                        <button
                          onClick={() => { setShowNewAccountFlow(false); setNewAccountPassword(''); setNewAccountSeed(''); setNewAccountMode('new'); clearPersistedState(); }}
                          className={cn(
                            "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all",
                            isDark
                              ? "text-white/60 hover:bg-white/5 ring-1 ring-white/10"
                              : "text-gray-600 hover:bg-gray-50 ring-1 ring-gray-200"
                          )}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateNewAccount}
                          disabled={!newAccountPassword || (newAccountMode === 'import' && !validateSeed(newAccountSeed).valid)}
                          className={cn(
                            "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2",
                            newAccountPassword && (newAccountMode === 'new' || validateSeed(newAccountSeed).valid)
                              ? "bg-primary text-white hover:bg-primary/90"
                              : isDark
                                ? "bg-white/5 text-white/30 cursor-not-allowed"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
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
                      <span className={cn("text-[14px] font-medium", isDark ? "text-white" : "text-gray-900")}>
                        Backup
                      </span>
                      <button
                        onClick={() => {
                          setShowSeedDialog(false);
                          setSeedAuthStatus('idle');
                          setDisplaySeed('');
                          setSeedBlurred(true);
                          setSeedWarningAgreed(false);
                          setBackupMode(null);
                          setSeedPassword('');
                        }}
                        className={cn("p-1 rounded-md transition-colors", isDark ? "text-white/40 hover:text-white" : "text-gray-400 hover:text-gray-600")}
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
                              "w-full flex items-center justify-between p-3 rounded-lg border-[1.5px] transition-colors",
                              isDark
                                ? "border-[#3f96fe]/20 hover:border-[#3f96fe]/40 hover:bg-[#3f96fe]/5"
                                : "border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                            )}
                          >
                            <span className={cn("text-[13px]", isDark ? "text-white" : "text-gray-900")}>View Seed</span>
                            <span className={cn("text-[11px]", isDark ? "text-white/40" : "text-gray-400")}>Wallet {profiles.findIndex(p => p.account === accountProfile?.account) + 1}</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowSeedDialog(false);
                              handleDownloadBackup();
                            }}
                            className="w-full text-left p-3 rounded-lg bg-primary hover:bg-primary/90 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[13px] text-white">Download Backup</span>
                              <span className="text-[11px] text-white/60">{profiles.length} wallet{profiles.length > 1 ? 's' : ''}</span>
                            </div>
                            <p className="text-[11px] text-white/50 mt-1">Full encrypted backup file</p>
                          </button>
                        </div>
                      )}

                      {seedAuthStatus === 'password-required' && backupMode === 'seed' && (
                        <div className="space-y-3">
                          <div className={cn("p-3 rounded-lg", isDark ? "bg-amber-500/10 border border-amber-500/20" : "bg-amber-50 border border-amber-200")}>
                            <p className="text-[12px] font-medium text-amber-600 mb-0.5">Keep your seed safe</p>
                            <p className={cn("text-[11px] leading-relaxed", isDark ? "text-white/60" : "text-gray-600")}>
                              Stored locally. Cannot be recovered. Never share it.
                            </p>
                          </div>

                          <button
                            onClick={() => setSeedWarningAgreed(!seedWarningAgreed)}
                            className={cn(
                              "w-full flex items-start gap-2 p-2.5 rounded-lg border-[1.5px] text-left transition-colors",
                              seedWarningAgreed
                                ? "border-primary bg-primary/5"
                                : isDark ? "border-[#3f96fe]/20 hover:border-[#3f96fe]/40" : "border-blue-200 hover:border-blue-400"
                            )}
                          >
                            <div className={cn(
                              "w-4 h-4 rounded flex-shrink-0 flex items-center justify-center mt-0.5 border-2 transition-colors",
                              seedWarningAgreed ? "border-primary bg-primary" : isDark ? "border-white/30" : "border-gray-300"
                            )}>
                              {seedWarningAgreed && <Check size={12} color="white" />}
                            </div>
                            <span className={cn("text-[11px] leading-relaxed", isDark ? "text-white" : "text-gray-900")}>
                              I understand and will keep my seed safe
                            </span>
                          </button>

                          <div>
                            <p className={cn("text-[11px] mb-1.5", isDark ? "text-white/50" : "text-gray-500")}>
                              Enter password to view seed
                            </p>
                            <div className="relative">
                              <input
                                type={showSeedPassword ? 'text' : 'password'}
                                placeholder="Password"
                                value={seedPassword}
                                onChange={(e) => setSeedPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && seedWarningAgreed && handleSeedPasswordSubmit()}
                                autoFocus
                                autoComplete="off"
                                className={cn(
                                  "w-full px-3 py-2 pr-10 rounded-lg border-[1.5px] text-[13px] outline-none transition-colors",
                                  isDark
                                    ? "bg-white/[0.04] border-[#3f96fe]/20 text-white placeholder:text-white/30 focus:border-[#3f96fe]"
                                    : "bg-white border-blue-200 text-gray-900 placeholder:text-gray-400 focus:border-[#3f96fe]"
                                )}
                              />
                              <button
                                type="button"
                                onClick={() => setShowSeedPassword(!showSeedPassword)}
                                className={cn("absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded", isDark ? "text-white/50 hover:text-white" : "text-gray-400 hover:text-gray-600")}
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
                                setSeedPassword('');
                                setShowSeedPassword(false);
                                setSeedWarningAgreed(false);
                              }}
                              className={cn(
                                "px-3 py-1.5 rounded-lg border-[1.5px] text-[13px] font-normal transition-colors",
                                isDark ? "border-[#3f96fe]/20 text-white hover:bg-[#3f96fe]/5" : "border-blue-200 text-gray-700 hover:bg-blue-50"
                              )}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSeedPasswordSubmit}
                              disabled={!seedPassword || !seedWarningAgreed}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-[13px] font-normal text-white transition-colors",
                                seedPassword && seedWarningAgreed
                                  ? "bg-primary hover:bg-primary/90"
                                  : "bg-primary/50 cursor-not-allowed"
                              )}
                            >
                              View Seed
                            </button>
                          </div>
                        </div>
                      )}

                      {seedAuthStatus === 'success' && (
                        <div className="space-y-3">
                          <div className={cn("p-3 rounded-lg", isDark ? "bg-[#3f96fe]/10 border border-[#3f96fe]/20" : "bg-blue-50 border border-blue-200")}>
                            <p className={cn("text-[11px]", isDark ? "text-blue-400" : "text-blue-700")}>
                              Wallet {profiles.findIndex(p => p.account === accountProfile?.account) + 1} of {profiles.length}
                            </p>
                            <p className={cn("text-[11px] mt-0.5", isDark ? "text-white/50" : "text-gray-500")}>
                              Use download backup for all wallets.
                            </p>
                          </div>

                          <div
                            onClick={seedBlurred ? () => setSeedBlurred(false) : undefined}
                            title={seedBlurred ? 'Click to reveal' : ''}
                            className={cn(
                              "p-3 rounded-lg font-mono text-[11px] break-all leading-relaxed",
                              isDark ? "bg-white/[0.04] border border-[#3f96fe]/20" : "bg-gray-50 border border-blue-200",
                              seedBlurred && "blur-[5px] cursor-pointer select-none"
                            )}
                          >
                            {displaySeed}
                          </div>

                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(displaySeed).then(() => {
                                  openSnackbar('Seed copied', 'success');
                                });
                              }}
                              className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-[11px] transition-colors"
                            >
                              Copy Seed
                            </button>
                            <button
                              onClick={() => setSeedBlurred(!seedBlurred)}
                              className={cn(
                                "px-3 py-1.5 rounded-lg border-[1.5px] text-[11px] transition-colors",
                                isDark ? "border-[#3f96fe]/20 text-white hover:bg-[#3f96fe]/5" : "border-blue-200 text-gray-700 hover:bg-blue-50"
                              )}
                            >
                              {seedBlurred ? 'Show' : 'Hide'}
                            </button>
                          </div>
                        </div>
                      )}

                      {seedAuthStatus === 'error' && (
                        <div className={cn("p-3 rounded-lg text-[12px]", isDark ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-red-50 border border-red-200 text-red-600")}>
                          Authentication failed. Please try again.
                        </div>
                      )}
                  </div>
                )}
              </>
            ) : (
              // WalletConnect Modal Content
              <div className={isDark ? "text-white" : "text-gray-900"}>
                {/* Header */}
                <div className={cn(
                  "px-5 py-4 flex items-center justify-between",
                  isDark ? "border-b border-white/[0.04]" : "border-b border-gray-100"
                )}>
                  <h2 className="text-[15px] font-medium tracking-tight">
                    Connect Wallet
                  </h2>
                  {(() => {
                    const hasProgress = (!hasExistingWallet && (createPassword || createPasswordConfirm)) ||
                                       (hasExistingWallet && unlockPassword);
                    return (
                      <button
                        onClick={() => {
                          if (hasProgress && !window.confirm('You have unsaved progress. Close anyway?')) return;
                          setOpenWalletModal(false);
                          setCreatePassword('');
                          setCreatePasswordConfirm('');
                          setUnlockPassword('');
                        }}
                        className={cn(
                          "p-1.5 rounded-lg transition-all duration-150 relative",
                          isDark ? "hover:bg-white/[0.06] text-white/30 hover:text-white/50" : "hover:bg-gray-100 text-gray-400 hover:text-gray-500"
                        )}
                        title={hasProgress ? "You have unsaved progress" : "Close"}
                      >
                        <XIcon size={16} />
                        {hasProgress && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                        )}
                      </button>
                    );
                  })()}
                </div>

                {/* Content */}
                <div className="px-5 py-4">
                  {/* Password Unlock for Returning Users */}
                      {hasExistingWallet && (
                        <div className="mb-4">
                          <p className={cn("text-[11px] mb-2", isDark ? "text-white/40" : "text-gray-400")}>
                            {walletMetadata.length} wallet{walletMetadata.length !== 1 ? 's' : ''} found
                          </p>

                          <div className="relative mb-2">
                            <input
                              type={showUnlockPassword ? 'text' : 'password'}
                              value={unlockPassword}
                              onChange={(e) => setUnlockPassword(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handlePasswordUnlock()}
                              placeholder="Password"
                              autoFocus
                              className={cn(
                                "w-full px-3 py-2.5 pr-10 rounded-lg text-[13px] outline-none transition-colors",
                                isDark
                                  ? "bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/25 focus:border-white/20"
                                  : "bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-gray-300"
                              )}
                            />
                            <button
                              type="button"
                              onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                              className={cn(
                                "absolute right-3 top-1/2 -translate-y-1/2",
                                isDark ? "text-white/25 hover:text-white/40" : "text-gray-400 hover:text-gray-500"
                              )}
                            >
                              {showUnlockPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>

                          {unlockError && (
                            <p className="text-[11px] text-red-400 mb-2">{unlockError}</p>
                          )}

                          <button
                            onClick={handlePasswordUnlock}
                            disabled={isUnlocking}
                            className={cn(
                              "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium transition-all",
                              "bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                            )}
                          >
                            {isUnlocking ? <Loader2 size={14} className="animate-spin" /> : 'Unlock'}
                          </button>

                          <button
                            onClick={() => { checkStoredWalletCount(); setShowClearConfirm(true); setClearWarningAgreed(false); }}
                            className={cn(
                              "w-full mt-3 text-[11px] transition-colors",
                              isDark ? "text-white/30 hover:text-red-400" : "text-gray-400 hover:text-red-500"
                            )}
                          >
                            Forgot password? Reset wallet
                          </button>
                        </div>
                      )}

                      {/* Create Wallet - Only show if no existing wallet */}
                      {!hasExistingWallet && (
                        <div className="space-y-3">
                          <p className={cn("text-[12px] mb-1", isDark ? "text-white/50" : "text-gray-500")}>
                            Create a password to secure your wallet
                          </p>

                          <div className="relative">
                            <input
                              type={showCreatePassword ? 'text' : 'password'}
                              value={createPassword}
                              onChange={(e) => { setCreatePassword(e.target.value); setCreateError(''); }}
                              onKeyDown={(e) => e.key === 'Enter' && createPasswordConfirm && handlePasswordCreate()}
                              placeholder="Password"
                              autoFocus
                              className={cn(
                                "w-full px-3 py-2.5 pr-10 rounded-lg text-[13px] outline-none transition-colors",
                                isDark
                                  ? "bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/25 focus:border-white/20"
                                  : "bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-gray-300"
                              )}
                            />
                            <button
                              type="button"
                              onClick={() => setShowCreatePassword(!showCreatePassword)}
                              className={cn(
                                "absolute right-3 top-1/2 -translate-y-1/2",
                                isDark ? "text-white/25 hover:text-white/40" : "text-gray-400 hover:text-gray-500"
                              )}
                            >
                              {showCreatePassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>

                          <input
                            type={showCreatePassword ? 'text' : 'password'}
                            value={createPasswordConfirm}
                            onChange={(e) => { setCreatePasswordConfirm(e.target.value); setCreateError(''); }}
                            onKeyDown={(e) => e.key === 'Enter' && handlePasswordCreate()}
                            placeholder="Confirm Password"
                            className={cn(
                              "w-full px-3 py-2.5 rounded-lg text-[13px] outline-none transition-colors",
                              isDark
                                ? "bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/25 focus:border-white/20"
                                : "bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-gray-300"
                            )}
                          />

                          {createError && (
                            <p className="text-[11px] text-red-400">{createError}</p>
                          )}

                          <button
                            onClick={handlePasswordCreate}
                            disabled={isCreating || !createPassword || !createPasswordConfirm}
                            className={cn(
                              "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium transition-all",
                              "bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                            )}
                          >
                            {isCreating ? <Loader2 size={14} className="animate-spin" /> : 'Create Wallet'}
                          </button>
                        </div>
                      )}

                      {/* Footer */}
                      <div className={cn(
                        "mt-5 pt-4 text-center border-t",
                        isDark ? "border-white/[0.04]" : "border-gray-100"
                      )}>
                        <div className="flex items-center justify-center gap-1.5">
                          <Lock size={10} className={isDark ? "text-white/20" : "text-gray-400"} />
                          <span className={cn("text-[10px]", isDark ? "text-white/20" : "text-gray-400")}>
                            Encrypted and stored locally
                          </span>
                        </div>
                        {showClearConfirm && (
                            <div className={cn("mt-2 p-3 rounded-xl border-[1.5px] relative overflow-hidden", isDark ? "bg-black/40 border-red-500/20" : "bg-white border-red-200")}>
                              {/* Dot pattern background */}
                              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: isDark ? 'radial-gradient(circle, rgba(239,68,68,0.3) 1px, transparent 1px)' : 'radial-gradient(circle, rgba(239,68,68,0.2) 1px, transparent 1px)', backgroundSize: '10px 10px' }} />

                              <div className="relative z-10">
                                {/* Header */}
                                <div className="flex items-center gap-2 mb-2">
                                  <Trash2 size={14} className="text-red-500" />
                                  <span className={cn("text-[12px] font-medium", isDark ? "text-white" : "text-gray-900")}>
                                    Delete {(profiles.length || storedWalletCount) || 'all'} wallet{(profiles.length || storedWalletCount) !== 1 ? 's' : ''}
                                  </span>
                                </div>

                                {/* Wallet addresses */}
                                {storedWalletAddresses.length > 0 && (
                                  <div className={cn("mb-2 px-2 py-1.5 rounded-lg", isDark ? "bg-white/[0.02]" : "bg-gray-50")}>
                                    {storedWalletAddresses.slice(0, 3).map((addr, idx) => (
                                      <div key={idx} className="flex items-center gap-1.5 py-0.5">
                                        <div className="w-1 h-1 rounded-full bg-red-400/60" />
                                        <span className={cn("text-[10px] font-mono", isDark ? "text-white/50" : "text-gray-500")}>{addr}</span>
                                      </div>
                                    ))}
                                    {storedWalletAddresses.length > 3 && (
                                      <span className={cn("text-[9px] ml-2.5", isDark ? "text-white/30" : "text-gray-400")}>+{storedWalletAddresses.length - 3} more</span>
                                    )}
                                  </div>
                                )}

                                {/* Confirmation toggle */}
                                <button
                                  onClick={() => setClearWarningAgreed(!clearWarningAgreed)}
                                  className={cn(
                                    "w-full flex items-center gap-2 p-2 rounded-lg text-left mb-2 transition-all border",
                                    clearWarningAgreed ? "border-red-500/50 bg-red-500/10" : isDark ? "border-white/10" : "border-gray-200"
                                  )}
                                >
                                  <div className={cn(
                                    "w-4 h-4 rounded flex items-center justify-center flex-shrink-0",
                                    clearWarningAgreed ? "bg-red-500" : isDark ? "border border-white/20" : "border border-gray-300"
                                  )}>
                                    {clearWarningAgreed && <Check size={10} className="text-white" />}
                                  </div>
                                  <span className={cn("text-[10px]", isDark ? "text-white/60" : "text-gray-500")}>I understand this is permanent</span>
                                </button>

                                {/* Slide to delete */}
                                <div
                                  className={cn(
                                    "relative h-10 rounded-lg overflow-hidden select-none transition-all",
                                    clearWarningAgreed ? "cursor-pointer" : "cursor-not-allowed opacity-40",
                                    clearSliderValue >= 95 ? "bg-red-500" : isDark ? "bg-white/[0.03]" : "bg-gray-100"
                                  )}
                                  onMouseDown={(e) => {
                                    if (!clearWarningAgreed) return;
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const handleMove = (moveEvent) => {
                                      const x = Math.max(0, Math.min(moveEvent.clientX - rect.left, rect.width));
                                      setClearSliderValue(Math.round((x / rect.width) * 100));
                                      if (x / rect.width >= 0.95) handleClearAllWallets();
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
                                    const handleMove = (moveEvent) => {
                                      const touch = moveEvent.touches[0];
                                      const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
                                      setClearSliderValue(Math.round((x / rect.width) * 100));
                                      if (x / rect.width >= 0.95) handleClearAllWallets();
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
                                  <div className={cn("absolute inset-y-0 left-0", clearSliderValue >= 95 ? "bg-red-600" : "bg-red-500")} style={{ width: `${clearSliderValue}%` }} />
                                  <div
                                    className={cn("absolute top-1 bottom-1 w-8 rounded-md flex items-center justify-center", clearSliderValue >= 95 ? "bg-white" : clearSliderValue > 0 ? "bg-red-500" : isDark ? "bg-white/10" : "bg-white")}
                                    style={{ left: `calc(${clearSliderValue}% - ${clearSliderValue * 0.32}px + 4px)`, transition: clearSliderValue === 0 ? 'left 0.2s ease-out' : 'none' }}
                                  >
                                    {clearSliderValue >= 95 ? <Loader2 size={14} className="text-red-500 animate-spin" /> : <ChevronRight size={14} className={clearSliderValue > 0 ? "text-white" : isDark ? "text-white/40" : "text-gray-400"} />}
                                  </div>
                                  <span className={cn("absolute inset-0 flex items-center justify-center text-[10px] font-medium pointer-events-none tracking-wide", clearSliderValue > 15 ? "opacity-0" : "opacity-100", isDark ? "text-white/30" : "text-gray-400")} style={{ paddingLeft: 32 }}>
                                    SLIDE TO DELETE
                                  </span>
                                </div>

                                <button onClick={() => { setShowClearConfirm(false); setClearSliderValue(0); setClearWarningAgreed(false); }} className={cn("w-full mt-2 py-1 text-[10px]", isDark ? "text-white/30 hover:text-white/50" : "text-gray-400 hover:text-gray-600")}>Cancel</button>
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
