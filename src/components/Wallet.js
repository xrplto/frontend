import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { Wallet as XRPLWallet, encodeSeed, Client, xrpToDrops, dropsToXrp, isValidAddress } from 'xrpl';

// Lazy load heavy dependencies
let startRegistration, startAuthentication, CryptoJS, scrypt, base64URLStringToBuffer;

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
  Fingerprint as FingerprintIcon,
  Mail,
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
  ArrowLeft,
  Check,
  AlertTriangle,
  Send,
  History,
  ArrowUpRight,
  ArrowDownLeft,
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

// Base64url encoding helper
const base64urlEncode = (buffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

// Generate random wallet for passkeys - NO DETERMINISTIC (2025 security standard)
const generateRandomWallet = () => {
  // Generate true random entropy - no derivation from signatures
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

// StyledPopoverPaper component - Glass effect styling with mobile support
const StyledPopoverPaper = ({ children, isDark, isMobile }) => (
  <div className={cn(
    "overflow-hidden max-h-[80vh] overflow-y-auto rounded-xl border-[1.5px]",
    isDark ? "bg-[#070b12]/98 backdrop-blur-xl border-blue-500/20 shadow-2xl shadow-blue-500/10" : "bg-white/98 backdrop-blur-xl border-blue-200 shadow-xl shadow-blue-200/50"
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
    border: variant === 'outlined' ? '1.5px solid rgba(59,130,246,0.2)' : 'none',
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
    border: isDark ? '1.5px solid rgba(59,130,246,0.2)' : '1.5px solid rgba(59,130,246,0.3)',
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

// Social icons (replacing MUI icons)
const Google = ({ sx }) => (
  <svg style={{ width: sx?.fontSize || 18, height: sx?.fontSize || 18, marginRight: sx?.mr ? sx.mr * 8 : 0 }} viewBox="0 0 24 24">
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const Email = ({ sx }) => (
  <Mail size={sx?.fontSize || 18} style={{ marginRight: sx?.mr ? sx.mr * 8 : 0 }} />
);

// X (Twitter) icon - using the imported XIcon from lucide but renamed
const X = ({ sx }) => (
  <XIcon size={sx?.fontSize || 18} style={{ marginRight: sx?.mr ? sx.mr * 8 : 0 }} />
);

// SecurityOutlined icon (for Passkeys)
const SecurityOutlined = ({ sx }) => (
  <Shield size={sx?.fontSize || 18} style={{ marginRight: sx?.mr ? sx.mr * 8 : 0 }} />
);

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
  walletStorage
}) => {
  const needsBackup = typeof window !== 'undefined' && localStorage.getItem(`wallet_needs_backup_${accountLogin}`);
  const [showAllAccounts, setShowAllAccounts] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

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
                : isDark ? "border-blue-500/20 hover:border-blue-500/30" : "border-blue-200 hover:border-blue-300"
            )}
          >
            <div className={cn(
              "w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
              backupAgreed
                ? "bg-primary"
                : isDark ? "border-2 border-blue-500/30" : "border-2 border-blue-300"
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
                  ? "bg-white/[0.04] border-blue-500/20 text-white placeholder:text-white/30 focus:border-blue-500/50 disabled:opacity-40"
                  : "bg-gray-50 border-blue-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 disabled:opacity-40"
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
                  ? "border-blue-500/20 text-white/70 hover:bg-blue-500/5"
                  : "border-blue-200 text-gray-600 hover:bg-blue-50"
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
  return (
    <div className={isDark ? "text-white" : "text-gray-900"}>
      {/* Header with gradient accent */}
      <div className={cn(
        "px-4 py-3 flex items-center justify-between",
        isDark ? "border-b border-white/[0.06]" : "border-b border-gray-100"
      )}>
        <button
          onClick={handleCopyAddress}
          className={cn(
            "flex items-center gap-2 px-2 py-1 -ml-2 rounded-lg transition-all",
            addressCopied
              ? "bg-emerald-500/10"
              : isDark ? "hover:bg-white/5" : "hover:bg-gray-100"
          )}
        >
          <div className="relative">
            <div className={cn("w-2 h-2 rounded-full", addressCopied ? "bg-emerald-400" : "bg-emerald-400")} />
            {!addressCopied && <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />}
          </div>
          <span className={cn(
            "font-mono text-xs",
            addressCopied ? "text-emerald-500" : isDark ? "text-white/60" : "text-gray-500"
          )}>
            {truncateAccount(accountLogin, 6)}
          </span>
          {addressCopied ? (
            <Check size={12} className="text-emerald-500" />
          ) : (
            <Copy size={12} className={isDark ? "text-white/40" : "text-gray-400"} />
          )}
        </button>
        <div className="flex items-center gap-2">
          {needsBackup && (
            <button
              onClick={onBackupSeed}
              className="px-2 py-1 rounded-md text-[10px] font-medium text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
            >
              Backup
            </button>
          )}
          <button
            onClick={onClose}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              isDark ? "hover:bg-white/5 text-white/40 hover:text-white/60" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            )}
          >
            <XIcon size={14} />
          </button>
        </div>
      </div>

      {/* Balance Section */}
      <div className="px-5 pt-5 pb-4 text-center">
        <div className="mb-0.5">
          <span className="font-mono text-3xl font-light tracking-tight">
            {accountTotalXrp || accountBalance?.curr1?.value || '0'}
          </span>
          <span className={cn("text-sm ml-1.5", isDark ? "text-white/30" : "text-gray-400")}>XRP</span>
        </div>
        {/* Balance Stats - Always visible under balance */}
        <div className={cn("flex items-center justify-center gap-3 text-[11px] mt-1", isDark ? "text-white/40" : "text-gray-400")}>
          <span>{accountBalance?.curr1?.value || '0'} available</span>
          <span>•</span>
          <span>{accountBalance?.curr2?.value || Math.max(0, Number(accountTotalXrp || 0) - Number(accountBalance?.curr1?.value || 0)) || '0'} reserved</span>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <a
            href="/wallet?tab=send"
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all",
              isDark ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-primary/10 text-primary hover:bg-primary/20"
            )}
          >
            <Send size={13} />
            Send
          </a>
          <button
            onClick={() => setShowQrCode(!showQrCode)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all",
              showQrCode ? "bg-primary/10 text-primary" : isDark ? "bg-white/[0.04] text-white/70 hover:bg-white/[0.08]" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            <QrCode size={13} />
            Receive
          </button>
          <button
            onClick={onBackupSeed}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all",
              isDark ? "bg-white/[0.04] text-white/70 hover:bg-white/[0.08]" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            <Shield size={13} />
            Backup
          </button>
        </div>

        {/* View Wallet Link */}
        <a
          href="/wallet"
          className={cn(
            "block text-center text-[11px] font-medium mt-3 py-2 transition-colors",
            isDark ? "text-primary hover:text-primary/80" : "text-primary hover:text-primary/80"
          )}
        >
          View Full Wallet →
        </a>
      </div>

      {/* QR Code Section - Compact */}
      {showQrCode && (
        <div className={cn("mx-4 mb-4 p-3 rounded-xl", isDark ? "bg-white/[0.03]" : "bg-gray-50")}>
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white rounded-lg flex-shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${accountLogin}&bgcolor=ffffff&color=000000&margin=0`}
                alt="QR"
                className="w-[80px] h-[80px]"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-[10px] uppercase tracking-wider mb-1", isDark ? "text-white/40" : "text-gray-400")}>Address</p>
              <p className={cn("font-mono text-[10px] break-all leading-relaxed", isDark ? "text-white/60" : "text-gray-600")}>{accountLogin}</p>
              <button
                onClick={handleCopyAddress}
                className={cn(
                  "mt-2 w-full py-1.5 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition-all",
                  addressCopied ? "bg-emerald-500/10 text-emerald-500" : "bg-primary text-white hover:bg-primary/90"
                )}
              >
                {addressCopied ? <Check size={12} /> : <Copy size={12} />}
                {addressCopied ? 'Copied' : 'Copy Address'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Token Holdings - Mock */}
      <div className="px-4 pt-3">
        <p className={cn("text-[10px] font-medium uppercase tracking-wide mb-2", isDark ? "text-white/40" : "text-gray-500")}>Holdings</p>
        <div className="space-y-1">
          {[
            { symbol: 'SOLO', name: 'Sologenic', amount: '1,250.00', value: '$45.20', change: '+2.4%', positive: true, color: '#00D4AA' },
            { symbol: 'CSC', name: 'CasinoCoin', amount: '50,000', value: '$125.00', change: '-1.2%', positive: false, color: '#E91E63' },
            { symbol: 'CORE', name: 'Coreum', amount: '320.50', value: '$89.40', change: '+5.1%', positive: true, color: '#25D695' },
          ].map((token) => (
            <div key={token.symbol} className={cn("flex items-center gap-2 p-2 rounded-lg", isDark ? "hover:bg-white/[0.03]" : "hover:bg-gray-50")}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: token.color }}>
                {token.symbol[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-[12px] font-medium", isDark ? "text-white" : "text-gray-900")}>{token.symbol}</p>
                <p className={cn("text-[10px]", isDark ? "text-white/40" : "text-gray-400")}>{token.amount}</p>
              </div>
              <div className="text-right">
                <p className={cn("text-[11px] font-medium", isDark ? "text-white/80" : "text-gray-700")}>{token.value}</p>
                <p className={cn("text-[10px]", token.positive ? "text-emerald-500" : "text-red-400")}>{token.change}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accounts Section - Enhanced */}
      <div className="px-4 pt-3">
        <button
          onClick={() => setShowAllAccounts(!showAllAccounts)}
          className="w-full flex items-center gap-3 mb-3"
        >
          <span className={cn("text-[10px] font-medium uppercase tracking-wide", isDark ? "text-white/40" : "text-gray-500")}>
            Accounts
          </span>
          <span className={cn(
            "px-1.5 py-0.5 rounded text-[10px] font-medium",
            isDark ? "bg-white/10 text-white/50" : "bg-gray-100 text-gray-500"
          )}>
            {profiles.length}
          </span>
          <div
            className="flex-1 h-px"
            style={{
              backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(66,133,244,0.5)' : 'rgba(66,133,244,0.3)'} 1px, transparent 1px)`,
              backgroundSize: '6px 1px'
            }}
          />
          <ChevronDown
            size={14}
            className={cn(
              "transition-transform duration-200",
              showAllAccounts ? "rotate-180" : "",
              isDark ? "text-white/40" : "text-gray-400"
            )}
          />
        </button>

        {showAllAccounts && (
          <div className={cn("border-t", isDark ? "border-white/[0.04]" : "border-gray-50")}>
            {/* Pagination - Compact */}
            {(() => {
              const totalPages = Math.ceil(profiles.length / walletsPerPage);
              return totalPages > 1 && (
                <div className={cn(
                  "px-4 py-2 flex items-center justify-center gap-3 border-b",
                  isDark ? "border-white/[0.04]" : "border-gray-50"
                )}>
                  <button
                    disabled={walletPage === 0}
                    onClick={() => setWalletPage(Math.max(0, walletPage - 1))}
                    className={cn(
                      "p-1 rounded transition-colors",
                      walletPage === 0
                        ? "opacity-30 cursor-not-allowed"
                        : isDark ? "hover:bg-white/10 text-white/60" : "hover:bg-gray-100 text-gray-500"
                    )}
                  >
                    <ChevronDown size={12} className="rotate-90" />
                  </button>
                  <span className={cn("text-[10px] font-medium min-w-[50px] text-center", isDark ? "text-white/50" : "text-gray-400")}>
                    {walletPage + 1} / {totalPages}
                  </span>
                  <button
                    disabled={walletPage >= totalPages - 1}
                    onClick={() => setWalletPage(Math.min(totalPages - 1, walletPage + 1))}
                    className={cn(
                      "p-1 rounded transition-colors",
                      walletPage >= totalPages - 1
                        ? "opacity-30 cursor-not-allowed"
                        : isDark ? "hover:bg-white/10 text-white/60" : "hover:bg-gray-100 text-gray-500"
                    )}
                  >
                    <ChevronDown size={12} className="-rotate-90" />
                  </button>
                </div>
              );
            })()}

            {/* Wallets List - Enhanced */}
            <div className="max-h-[240px] overflow-y-auto py-1">
              {(() => {
                const activeAccounts = [];
                const inactiveAccounts = [];

                profiles.forEach(profile => {
                  if (accountsActivation[profile.account] === false) {
                    inactiveAccounts.push(profile);
                  } else {
                    activeAccounts.push(profile);
                  }
                });

                const sortByAddress = (a, b) => a.account.localeCompare(b.account);
                activeAccounts.sort(sortByAddress);
                inactiveAccounts.sort(sortByAddress);

                const currentAccount = profiles.find(p => p.account === accountLogin);
                const otherActive = activeAccounts.filter(p => p.account !== accountLogin);
                const sorted = [
                  ...(currentAccount ? [currentAccount] : []),
                  ...otherActive,
                  ...inactiveAccounts
                ];

                const startIndex = walletPage * walletsPerPage;
                const paginatedProfiles = sorted.slice(startIndex, startIndex + walletsPerPage);

                return paginatedProfiles.map((profile) => {
                  const account = profile.account;
                  const isCurrent = account === accountLogin;
                  const isInactive = accountsActivation[account] === false;

                  return (
                    <button
                      key={account}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isCurrent) {
                          onAccountSwitch(account);
                        }
                      }}
                      className={cn(
                        "w-full px-4 py-2.5 flex items-center gap-3 transition-all",
                        isCurrent
                          ? isDark
                            ? "bg-primary/10 border-l-2 border-primary"
                            : "bg-primary/5 border-l-2 border-primary"
                          : isDark
                            ? "hover:bg-white/[0.03] border-l-2 border-transparent"
                            : "hover:bg-gray-50 border-l-2 border-transparent",
                        !isCurrent && "cursor-pointer"
                      )}
                    >
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full flex-shrink-0",
                        isInactive ? "bg-amber-400/60" : "bg-emerald-400"
                      )} />
                      <span className={cn(
                        "font-mono text-xs",
                        isCurrent
                          ? isDark ? "text-white" : "text-gray-900"
                          : isDark ? "text-white/60" : "text-gray-600"
                      )}>
                        {truncateAccount(account, 8)}
                      </span>
                      {isCurrent && (
                        <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wide uppercase bg-emerald-500/20 text-emerald-500">
                          Active
                        </span>
                      )}
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions - Enhanced */}
      <div className={cn(
        "px-3 py-3 flex items-center gap-2 border-t",
        isDark ? "border-white/[0.06]" : "border-gray-100"
      )}>
        {onCreateNewAccount && profiles.length < 25 && (
          <button
            onClick={onCreateNewAccount}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all",
              isDark
                ? "text-primary hover:bg-primary/10"
                : "text-primary hover:bg-primary/5"
            )}
          >
            <Plus size={14} />
            Add Account
          </button>
        )}
        <button
          onClick={onLogout}
          className={cn(
            "py-2.5 rounded-xl text-xs font-medium transition-all",
            profiles.length >= 25 ? "flex-1" : "px-4",
            isDark
              ? "text-white/50 hover:text-red-400 hover:bg-red-500/10"
              : "text-gray-500 hover:text-red-500 hover:bg-red-50"
          )}
        >
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
        'my-2 rounded-xl border-[1.5px] px-4 py-2 text-[0.9rem] font-medium transition-all duration-150',
        fullWidth ? 'w-full' : 'w-auto',
        isDark
          ? 'border-primary/40 bg-primary/5 text-primary hover:border-primary hover:bg-primary/10'
          : 'border-primary/40 bg-primary/5 text-primary hover:border-primary hover:bg-primary/10'
      )}
      {...otherProps}
    >
      {text}
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
  const [showDeviceLogin, setShowDeviceLogin] = useState(false);
  const [status, setStatus] = useState('idle');
  const [showDevicePasswordInput, setShowDevicePasswordInput] = useState(false);
  const [devicePassword, setDevicePassword] = useState('');
  const [devicePasswordConfirm, setDevicePasswordConfirm] = useState('');
  const [devicePasswordMode, setDevicePasswordMode] = useState('create'); // 'create' or 'verify'
  const [pendingDeviceId, setPendingDeviceId] = useState(null);
  const [showDevicePassword, setShowDevicePassword] = useState(false);
  const [error, setError] = useState('');
  const [walletInfo, setWalletInfo] = useState(null);
  const [isLoadingDeps, setIsLoadingDeps] = useState(false);
  const [showSeedDialog, setShowSeedDialog] = useState(false);
  const [walletPage, setWalletPage] = useState(0);
  const walletsPerPage = 5;
  const [seedAuthStatus, setSeedAuthStatus] = useState('idle');
  const [displaySeed, setDisplaySeed] = useState('');
  const [seedPassword, setSeedPassword] = useState('');
  const [showSeedPassword, setShowSeedPassword] = useState(false);
  const [seedWarningAgreed, setSeedWarningAgreed] = useState(false);
  const [backupMode, setBackupMode] = useState(null); // 'seed' or 'full'
  // OAuth wallet manager is now part of unified storage

  // Removed additional wallet generation - each auth method has single wallet

  // OAuth password setup state
  const [showOAuthPasswordSetup, setShowOAuthPasswordSetup] = useState(false);
  // eslint-disable-next-line react/hook-use-state
  const [oauthPassword, setOAuthPassword] = useState('');
  // eslint-disable-next-line react/hook-use-state
  const [oauthConfirmPassword, setOAuthConfirmPassword] = useState('');
  const [showOAuthPassword, setShowOAuthPassword] = useState(false);

  // Email verification states
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [emailStep, setEmailStep] = useState('email'); // 'email', 'code', or 'password'
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  // eslint-disable-next-line react/hook-use-state
  const [oauthPasswordError, setOAuthPasswordError] = useState('');
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const walletStorage = useMemo(() => new EncryptedWalletStorage(), []);
  const [showImportOption, setShowImportOption] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importMethod, setImportMethod] = useState('new'); // 'new', 'import', or 'seed'
  const [importSeed, setImportSeed] = useState('');
  const [importSeeds, setImportSeeds] = useState(['']); // Support multiple seeds
  const [seedCount, setSeedCount] = useState(1);
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
  const [clearSliderValue, setClearSliderValue] = useState(0);
  const [storedWalletCount, setStoredWalletCount] = useState(0);
  const [storedWalletDate, setStoredWalletDate] = useState(null);
  const [storedWalletAddresses, setStoredWalletAddresses] = useState([]);
  const [isMobileView, setIsMobileView] = useState(false);

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
              // Only count actual wallets (have address field, exclude passwords and lookup hashes)
              const wallets = allReq.result.filter(r =>
                r.address && !r.id?.startsWith?.('__pwd__') && !r.id?.startsWith?.('__lookup__')
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

  // Device Password handlers
  const handleDevicePasswordSubmit = async () => {
    if (devicePasswordMode === 'create') {
      const strengthCheck = securityUtils.validatePasswordStrength(devicePassword);
      if (!strengthCheck.valid) {
        setError(strengthCheck.error);
        return;
      }
      if (devicePassword !== devicePasswordConfirm) {
        setError('Passwords do not match');
        return;
      }
    } else if (!devicePassword) {
      setError('Please enter your password');
      return;
    }

    setShowDevicePasswordInput(false);
    const password = devicePassword;
    setDevicePassword('');
    setDevicePasswordConfirm('');

    if (devicePasswordMode === 'create' && pendingDeviceId) {
      await completeDeviceRegistration(pendingDeviceId, password);
    } else if (devicePasswordMode === 'verify' && pendingDeviceId) {
      await completeDeviceAuthentication(pendingDeviceId, password);
    }
  };

  const completeDeviceRegistration = async (deviceId, password) => {
    try {
      console.log('[Passkey] completeDeviceRegistration - deviceId:', deviceId);

      // Store the password for future use
      await walletStorage.storeWalletCredential(deviceId, password);

      // Check if wallets already exist for this device
      setStatus('discovering');
      const existingWallets = await walletStorage.getAllWalletsForDevice(deviceId, password);
      console.log('[Passkey] Existing wallets found:', existingWallets?.length || 0);

      let wallets;
      if (existingWallets && existingWallets.length > 0) {
        // Use existing wallets
        console.log('[Passkey] Using existing wallets');
        wallets = existingWallets;
      } else {
        // Generate 1 new wallet
        console.log('[Passkey] Creating new wallet');
        setStatus('creating');
        const wallet = generateRandomWallet();

        const walletData = {
          deviceKeyId: deviceId,
          accountIndex: 0,
          account: wallet.address,
          address: wallet.address,
          publicKey: wallet.publicKey,
          wallet_type: 'device',
          xrp: '0',
          createdAt: Date.now(),
          seed: wallet.seed
        };

        await walletStorage.storeWallet(walletData, password);
        wallets = [walletData];

        // Mark new wallets as needing backup
        wallets.forEach(w => {
          localStorage.setItem(`wallet_needs_backup_${w.address}`, 'true');
        });
      }

      setError(''); // Clear progress message

      // Update profiles
      const allProfiles = [...profiles];
      wallets.forEach(walletData => {
        const profile = { ...walletData, tokenCreatedAt: Date.now() };
        const exists = allProfiles.find(p => p.account === profile.account);
        if (!exists) {
          allProfiles.push(profile);
        }
      });

      setProfiles(allProfiles);
      await syncProfilesToIndexedDB(allProfiles);

      // Store first wallet info for display
      setWalletInfo({
        address: wallets[0].address,
        publicKey: wallets[0].publicKey,
        deviceKeyId: deviceId,
        totalWallets: wallets.length
      });

      // Login with first wallet
      doLogIn(wallets[0], allProfiles);
      setStatus('success');

      // Close modal after delay to ensure UI updates
      setTimeout(() => {
        setOpenWalletModal(false);
        setOpen(false);
        setStatus('idle');
        setShowDeviceLogin(false);
        setError('');
        if (existingWallets && existingWallets.length > 0) {
          openSnackbar('Wallet restored successfully!', 'success');
        } else {
          setTimeout(() => {
            openSnackbar('Wallet created! Remember to backup your seed phrase', 'warning');
          }, 1000);
        }
      }, 800);
    } catch (err) {
      console.error('[Passkey] Registration error:', err);
      setError('Failed to complete registration: ' + err.message);
      setStatus('idle');
    }
  };

  // Social login handlers
  const handleGoogleConnect = () => {
    try {
      // Check if Google Sign-In is loaded
      if (!window.google?.accounts?.id) {
        openSnackbar('Google Sign-In is still loading, please try again', 'info');
        return;
      }

      // Create a temporary div to render the Google button
      const buttonDiv = document.createElement('div');
      buttonDiv.id = 'temp-google-button';
      buttonDiv.style.position = 'fixed';
      buttonDiv.style.top = '-9999px';
      document.body.appendChild(buttonDiv);

      // Render the button (hidden)
      window.google.accounts.id.renderButton(
        buttonDiv,
        {
          theme: 'outline',
          size: 'large',
          type: 'standard'
        }
      );

      // Click it programmatically after a short delay
      setTimeout(() => {
        const button = buttonDiv.querySelector('div[role="button"]');
        if (button) {
          button.click();
        }
        // Clean up after click
        setTimeout(() => {
          buttonDiv.remove();
        }, 500);
      }, 100);

    } catch (error) {
      devError('Google connect error:', error);
      openSnackbar('Google connect failed: ' + error.message, 'error');
    }
  };

  const processGoogleConnect = async (jwtToken, userData) => {
    console.log('[Wallet] processGoogleConnect called');
    try {
      // Use provided user data or decode JWT
      let payload = userData;
      if (!userData && jwtToken && jwtToken.includes('.')) {
        try {
          payload = JSON.parse(atob(jwtToken.split('.')[1]));
        } catch {
          payload = { id: 'google_user', provider: 'google' };
        }
      }
      console.log('[Wallet] Payload:', { id: payload?.id || payload?.sub, provider: payload?.provider || 'google' });

      // Check if user already has wallets loaded (from AppContext auto-load)
      const walletId = `${payload.provider || 'google'}_${payload.sub || payload.id}`;
      const hasPassword = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);
      console.log('[Wallet] hasPassword:', !!hasPassword, 'profiles.length:', profiles.length);

      if (hasPassword && profiles.length > 0) {
        console.log('[Wallet] Returning user with wallets - auto login');
        await walletStorage.setSecureItem('jwt', jwtToken);
        await walletStorage.setSecureItem('authMethod', 'google');
        await walletStorage.setSecureItem('user', payload);
        setOpenWalletModal(false);
        return;
      }

      // Use unified wallet storage
      const walletStorageInstance = walletStorage || new EncryptedWalletStorage();

      // Create backend object with proper API URL
      const backend = {
        get: (url) => fetch(`https://api.xrpl.to${url}`, {
          headers: { 'Authorization': `Bearer ${jwtToken}` }
        }).then(r => r.json()),
        post: (url, body) => fetch(`https://api.xrpl.to${url}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
          },
          body: JSON.stringify(body)
        }).then(r => r.json())
      };

      // Handle social login
      console.log('[Wallet] Calling handleSocialLogin...');
      const result = await walletStorageInstance.handleSocialLogin(
        {
          id: payload.sub || payload.id,
          provider: 'google',
          email: payload.email,
          name: payload.name,
          ...payload
        },
        jwtToken,
        backend
      );

      console.log('[Wallet] handleSocialLogin result:', { requiresPassword: result.requiresPassword, hasWallet: !!result.wallet });

      if (result.requiresPassword) {
        console.log('[Wallet] Password required - redirecting to /wallet-setup');
        // Store token temporarily for password setup
        sessionStorage.setItem('oauth_temp_token', jwtToken);
        sessionStorage.setItem('oauth_temp_provider', 'google');
        sessionStorage.setItem('oauth_temp_user', JSON.stringify(payload));
        sessionStorage.setItem('oauth_action', result.action);

        // Close modal and redirect to dedicated wallet-setup page
        setOpenWalletModal(false);
        window.location.href = '/wallet-setup';
        return;
      } else {
        devLog('✅ No password required - auto login');
        // Wallet already setup
        await walletStorage.setSecureItem('jwt', jwtToken);
        await walletStorage.setSecureItem('authMethod', 'google');
        await walletStorage.setSecureItem('user', payload);

        if (result.wallet) {
          // Load ALL wallets for this provider into profiles
          if (result.allWallets && result.allWallets.length > 0) {
            const allProfiles = [];
            result.allWallets.forEach(w => {
              const walletProfile = {
                account: w.address,
                address: w.address,
                publicKey: w.publicKey,
                seed: w.seed,
                wallet_type: 'oauth',
                provider: payload.provider || 'google',
                provider_id: payload.sub || payload.id,
                createdAt: w.createdAt || Date.now(),
                tokenCreatedAt: Date.now()
              };
              allProfiles.push(walletProfile);
            });

            setProfiles(allProfiles);
            await syncProfilesToIndexedDB(allProfiles);
            doLogIn(result.wallet, allProfiles);
          } else {
            doLogIn(result.wallet, profiles);
          }
          openSnackbar('Google connect successful!', 'success');
        }
        setOpenWalletModal(false);
      }
    } catch (error) {
      console.error('[Wallet] Error processing Google connect:', error);
      openSnackbar('Failed to process Google connect: ' + (error.message || 'Unknown error'), 'error');
    }
  };

  const handleEmailConnect = () => {
    setShowEmailVerification(true);
    setEmailStep('email');
    setVerificationEmail('');
    setVerificationCode('');
    setEmailPassword('');
  };

  const handleEmailPasswordLogin = async () => {
    if (!emailPassword) {
      setError('Please enter your password');
      return;
    }

    try {
      const walletId = `email_${verificationEmail}`;
      const walletStorageInstance = walletStorage || new EncryptedWalletStorage();
      const wallet = await walletStorageInstance.findWalletBySocialId(walletId, emailPassword);

      if (wallet) {
        // Create full profile for email wallet
        const profile = {
          account: wallet.address,
          publicKey: wallet.publicKey,
          seed: wallet.seed,
          wallet_type: 'oauth',
          provider: 'email',
          provider_id: verificationEmail
        };

        // Store in localStorage for session
        localStorage.setItem('authMethod', 'email');
        localStorage.setItem('user', JSON.stringify({ email: verificationEmail }));

        await doLogIn(profile);
        setShowEmailVerification(false);
        setEmailPassword('');
        setOpen(false);
      } else {
        setError('Incorrect password');
        setEmailPassword('');
      }
    } catch (error) {
      devError('Email login error:', error);
      setError('Incorrect password');
      setEmailPassword('');
    }
  };

  const handleEmailContinue = async () => {
    if (!verificationEmail || !verificationEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      // Always check if wallet exists first
      const walletId = `email_${verificationEmail}`;
      const walletStorageInstance = walletStorage || new EncryptedWalletStorage();
      const existingWallet = await walletStorageInstance.checkWalletExists(walletId);

      if (existingWallet) {
        // Existing user - go to password
        devLog('Existing email wallet - show password');
        setEmailStep('password');
        setError('');
        return;
      }

      // New user - send verification code
      const sendResponse = await fetch('https://api.xrpl.to/api/oauth/email/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail })
      });

      if (!sendResponse.ok) {
        const error = await sendResponse.json().catch(() => ({ error: 'Failed to send code' }));
        setError(error.message || 'Failed to send verification code');
        return;
      }

      setEmailStep('code');
      setError('');
    } catch (error) {
      devError('Send code error:', error);
      setError('Failed to send verification code');
    }
  };

  const handleVerifyEmailCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      const verifyResponse = await fetch('https://api.xrpl.to/api/oauth/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail, code: verificationCode })
      });

      if (!verifyResponse.ok) {
        const error = await verifyResponse.json().catch(() => ({ error: 'Invalid code' }));
        setError(error.message || 'Invalid or expired code');
        return;
      }

      const data = await verifyResponse.json();

      if (!data.token) {
        setError('No token received from server');
        return;
      }

      // Store token temporarily
      sessionStorage.setItem('oauth_temp_token', data.token);
      sessionStorage.setItem('oauth_temp_provider', 'email');
      sessionStorage.setItem('oauth_temp_user', JSON.stringify({ id: verificationEmail, email: verificationEmail, username: verificationEmail.split('@')[0] }));
      sessionStorage.setItem('oauth_action', 'create');

      // Handle as OAuth login
      const walletStorageInstance = walletStorage || new EncryptedWalletStorage();
      const result = await walletStorageInstance.handleSocialLogin(
        { id: verificationEmail, provider: 'email', email: verificationEmail, username: verificationEmail.split('@')[0] },
        data.token,
        null
      );

      setShowEmailVerification(false);

      if (result.requiresPassword) {
        // Redirect to dedicated wallet-setup page (like Google flow)
        setOpenWalletModal(false);
        window.location.href = '/wallet-setup';
        return;
      } else if (result.wallet) {
        localStorage.setItem('jwt', data.token);
        localStorage.setItem('authMethod', 'email');
        await doLogIn(result.wallet.account, result.wallet.publicKey, result.wallet.seed, 'oauth');
        setOpenWalletModal(false);
      }
    } catch (error) {
      console.error('Verify code error:', error);
      setError('Email authentication failed. Please try again.');
    }
  };

  const handleXConnect = async () => {
    try {
      // Use OAuth 1.0a instead of OAuth 2.0 for better rate limits and no token expiration
      const callbackUrl = window.location.origin + '/callback';

      // Store return URL for after auth
      sessionStorage.setItem('auth_return_url', window.location.href);
      sessionStorage.setItem('wallet_modal_open', 'true');

      // Step 1: Get OAuth 1.0a request token and auth URL
      const response = await fetch('https://api.xrpl.to/api/oauth/twitter/oauth1/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          callbackUrl: callbackUrl
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        devError('Failed to get OAuth request token:', error);
        setError('Twitter authentication is currently unavailable. Please try Passkeys or Google instead.');
        return;
      }

      const data = await response.json();

      if (!data.auth_url || !data.oauth_token || !data.oauth_token_secret) {
        devError('Invalid OAuth response:', data);
        setError('Twitter authentication setup failed. Please try another login method.');
        return;
      }

      // Store OAuth 1.0a tokens for callback
      sessionStorage.setItem('oauth1_token', data.oauth_token);
      sessionStorage.setItem('oauth1_token_secret', data.oauth_token_secret);
      sessionStorage.setItem('oauth1_auth_start', Date.now().toString());

      // Replace twitter.com with x.com to avoid redirect
      const authUrl = data.auth_url.replace('api.twitter.com', 'api.x.com');
      devLog('Redirecting to Twitter OAuth 1.0a:', authUrl);
      window.location.href = authUrl;
    } catch (error) {
      openSnackbar('X connect failed: ' + error.message, 'error');
    }
  };

  const handleDiscordConnect = async () => {
    try {
      const callbackUrl = window.location.origin + '/callback';
      const clientId = '1416805602415612085';
      const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=identify`;

      // Store return URL for after auth
      sessionStorage.setItem('auth_return_url', window.location.href);
      sessionStorage.setItem('wallet_modal_open', 'true');

      window.location.href = discordAuthUrl;
    } catch (error) {
      openSnackbar('Discord connect failed: ' + error.message, 'error');
    }
  };

  // Handle OAuth password setup
  const handleOAuthPasswordSetup = async () => {
    // Validate password
    if (importMethod === 'new') {
      const strengthCheck = securityUtils.validatePasswordStrength(oauthPassword);
      if (!strengthCheck.valid) {
        setOAuthPasswordError(strengthCheck.error);
        return;
      }

      if (oauthPassword !== oauthConfirmPassword) {
        setOAuthPasswordError('Passwords do not match');
        return;
      }
    } else {
      // For import, just need any password (it will be validated during decryption)
      if (!oauthPassword) {
        setOAuthPasswordError('Please enter your wallet password');
        return;
      }
    }

    setOAuthPasswordError('');

    // Handle different import methods
    if (importMethod === 'import' && importFile) {
      await handleImportWallet();
      return;
    } else if (importMethod === 'seed' && importSeed) {
      await handleImportSeed();
      return;
    }

    setIsCreatingWallet(true);

    try {
      // Get OAuth data from session
      const token = sessionStorage.getItem('oauth_temp_token');
      const provider = sessionStorage.getItem('oauth_temp_provider');
      const userStr = sessionStorage.getItem('oauth_temp_user');
      const action = sessionStorage.getItem('oauth_action');

      if (!provider || !userStr) {
        throw new Error('Missing OAuth data');
      }

      const user = JSON.parse(userStr);

      // For existing email users logging in, we don't need token/action
      if (provider === 'email' && !token && !action) {
        devLog('Email login - checking existing wallet');
        const walletId = `email_${user.email}`;
        const wallet = await walletStorageInstance.findWalletBySocialId(walletId, oauthPassword);

        if (wallet) {
          // Successfully decrypted existing wallet
          await doLogIn(wallet.address, wallet.publicKey, wallet.seed, 'oauth');
          setShowOAuthPasswordSetup(false);
          setOAuthPassword('');
          setOAuthConfirmPassword('');
          setOpen(false);
          return;
        } else {
          throw new Error('Incorrect password or wallet not found');
        }
      }

      if (!token) {
        throw new Error('Missing OAuth token');
      }

      // Use unified wallet storage
      const walletStorageInstance = walletStorage || new EncryptedWalletStorage();

      // Create 1 wallet for OAuth
      setOAuthPasswordError('Creating wallet...');
      const wallet = generateRandomWallet();

      const walletKeyId = `${provider}_${user.id}`;
      const walletData = {
        accountIndex: 0,
        account: wallet.address,
        address: wallet.address,
        publicKey: wallet.publicKey,
        wallet_type: 'oauth',
        provider: provider,
        provider_id: user.id,
        walletKeyId: walletKeyId,
        xrp: '0',
        createdAt: Date.now(),
        seed: wallet.seed
      };

      await walletStorageInstance.storeWallet(walletData, oauthPassword);
      const wallets = [walletData];

      setOAuthPasswordError(''); // Clear progress

      if (wallets.length > 0) {
        const result = { success: true, wallet: wallets[0] };

        // Clear temporary session data IMMEDIATELY
        sessionStorage.removeItem('oauth_temp_token');
        sessionStorage.removeItem('oauth_temp_provider');
        sessionStorage.removeItem('oauth_temp_user');
        sessionStorage.removeItem('oauth_action');

        // Store permanent auth data
        await walletStorage.setSecureItem('jwt', token);
        await walletStorage.setSecureItem('authMethod', provider);
        await walletStorage.setSecureItem('user', user);

        // Store password for provider (enables auto-loading all wallets on re-login)
        const walletId = `${provider}_${user.id}`;
        await walletStorage.setSecureItem(`wallet_pwd_${walletId}`, oauthPassword);

        // Mark wallet as needing backup (new wallet)
        if (action === 'create') {
          localStorage.setItem(`wallet_needs_backup_${result.wallet.address}`, 'true');
        }

        // Add all wallets to profiles
        const allProfiles = [...profiles];
        wallets.forEach(w => {
          if (!allProfiles.find(p => p.account === w.address)) {
            allProfiles.push({ ...w, tokenCreatedAt: Date.now() });
          }
        });

        // Login with first wallet
        doLogIn(result.wallet, allProfiles);

        // Close dialogs
        setShowOAuthPasswordSetup(false);
        setOpenWalletModal(false);
        setOpen(false);  // Close the main modal

        // Clear password fields
        setOAuthPassword('');
        setOAuthConfirmPassword('');

        openSnackbar(`Wallet created successfully!`, 'success');
      } else {
        throw new Error('Failed to setup wallet');
      }
    } catch (error) {
      devError('Wallet setup error:', error);
      setOAuthPasswordError(error.message || 'Failed to setup wallet');
    } finally {
      setIsCreatingWallet(false);
    }
  };

  // Removed additional wallet generation functions - single wallet per auth method

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


  const completeDeviceAuthentication = async (deviceId, password) => {
    try {
      console.log('[Passkey] completeDeviceAuthentication - deviceId:', deviceId);
      setStatus('discovering');

      // Store for future use
      await walletStorage.storeWalletCredential(deviceId, password);

      // Check if wallets already exist for this device
      const existingWallets = await walletStorage.getAllWalletsForDevice(deviceId, password);
      console.log('[Passkey] Existing wallets found:', existingWallets?.length || 0);

      let wallets;
      let isReturningUser = false;

      if (existingWallets && existingWallets.length > 0) {
        // Use existing wallets - returning user
        console.log('[Passkey] Returning user - restoring wallets');
        wallets = existingWallets;
        isReturningUser = true;
      } else {
        // Generate 1 new wallet - new user
        console.log('[Passkey] New user - creating wallet');
        setStatus('creating');
        const wallet = generateRandomWallet();

        const walletData = {
          deviceKeyId: deviceId,
          accountIndex: 0,
          account: wallet.address,
          address: wallet.address,
          publicKey: wallet.publicKey,
          wallet_type: 'device',
          xrp: '0',
          createdAt: Date.now(),
          seed: wallet.seed
        };

        await walletStorage.storeWallet(walletData, password);
        wallets = [walletData];

        // Mark new wallets as needing backup
        wallets.forEach(w => {
          localStorage.setItem(`wallet_needs_backup_${w.address}`, 'true');
        });
      }

      setError(''); // Clear progress message

      // Update profiles state
      const allProfiles = [...profiles];
      wallets.forEach(walletData => {
        const profile = { ...walletData, tokenCreatedAt: Date.now() };
        const exists = allProfiles.find(p => p.account === profile.account);
        if (!exists) {
          allProfiles.push(profile);
        }
      });

      setProfiles(allProfiles);
      await syncProfilesToIndexedDB(allProfiles);

      // Set wallet info for success message
      setWalletInfo({
        address: wallets[0].address,
        publicKey: wallets[0].publicKey,
        deviceKeyId: deviceId,
        totalWallets: wallets.length
      });

      // Login with first wallet
      doLogIn(wallets[0], allProfiles);
      setStatus('success');

      // Close modal after delay to ensure UI updates
      setTimeout(() => {
        setOpenWalletModal(false);
        setOpen(false);
        setStatus('idle');
        setShowDeviceLogin(false);
        setError('');
        if (isReturningUser) {
          openSnackbar('Wallet restored successfully!', 'success');
        } else {
          openSnackbar('Wallet created! Remember to backup your seed phrase', 'warning');
        }
      }, 800);
    } catch (err) {
      console.error('[Passkey] Authentication error:', err);
      setError('Failed to complete authentication: ' + err.message);
      setStatus('idle');
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

  // Strict security dependency loading - NO FALLBACKS
  const loadDependencies = async () => {
    if (!startRegistration || !startAuthentication || !CryptoJS || !base64URLStringToBuffer) {
      setIsLoadingDeps(true);

      try {
        const [webauthnModule, cryptoModule, scryptModule] = await Promise.all([
          import('@simplewebauthn/browser'),
          import('crypto-js'),
          import('scrypt-js') // REQUIRED for highest security - no fallback allowed
        ]);

        // Validate all required security functions are available
        if (!webauthnModule.startRegistration || !webauthnModule.startAuthentication || !webauthnModule.base64URLStringToBuffer) {
          throw new Error('WebAuthn module missing required security functions');
        }

        if (!cryptoModule.default) {
          throw new Error('Crypto module not properly loaded');
        }

        if (!scryptModule || typeof scryptModule.scrypt !== 'function') {
          throw new Error('Scrypt module required for maximum security - PBKDF2 fallback disabled');
        }

        startRegistration = webauthnModule.startRegistration;
        startAuthentication = webauthnModule.startAuthentication;
        base64URLStringToBuffer = webauthnModule.base64URLStringToBuffer;
        CryptoJS = cryptoModule.default;
        scrypt = scryptModule;

        setIsLoadingDeps(false);
      } catch (error) {
        setIsLoadingDeps(false);
        throw new Error(`Failed to load required security dependencies: ${error.message}`);
      }
    }
  };

  const checkAccountActivity = useCallback(async (address) => {
    try {
      const isDevelopment = true;

      if (isDevelopment) {
        // Use backend testnet endpoint
        const response = await fetch(`https://api.xrpl.to/api/testnet-balance/${address}`);
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

  const generateWalletsFromDeviceKey = async (deviceKeyId) => {
    const wallets = [];

    // Generate only 1 wallet for performance
    const i = 0;
    // Generate random wallet (2025 security standard)
    const wallet = generateRandomWallet();
    const walletData = {
      deviceKeyId,
      accountIndex: i,
      account: wallet.address,  // AppContext expects 'account' field
      address: wallet.address,
      publicKey: wallet.publicKey,
      seed: wallet.seed, // Store the seed for backup purposes
      wallet_type: 'device',
      xrp: '0',
      createdAt: Date.now()
    };
    wallets.push(walletData);
    return wallets;
  };


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

  const handleWalletConnect = () => {
    setShowDeviceLogin(true);
  };

  const handleGoBack = () => {
    setShowDeviceLogin(false);
    setStatus('idle');
    setError('');
    setWalletInfo(null);
    setIsCreatingWallet(false);
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
            const wallets = allReq.result.filter(r => !r.id?.startsWith?.('__pwd__'));
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
      await indexedDB.deleteDatabase('XRPLWalletDB');
      localStorage.removeItem('profiles');
      handleLogout();
      setShowClearConfirm(false);
      setClearSliderValue(0);
      setOpenWalletModal(false);
      openSnackbar('All wallets cleared', 'success');
    } catch (error) {
      openSnackbar('Failed to clear wallets: ' + error.message, 'error');
    }
  };

  // Check if returning from OAuth and reopen wallet modal or show password setup
  useEffect(() => {
    // Check for OAuth wallet profile (auto-login)
    const oauthWalletProfile = sessionStorage.getItem('oauth_wallet_profile');
    if (oauthWalletProfile && sessionStorage.getItem('oauth_logged_in') === 'true') {
      try {
        const profile = JSON.parse(oauthWalletProfile);
        devLog('OAuth auto-login with profile:', profile);

        // Auto-login the OAuth user
        doLogIn(profile);

        // Clean up session storage
        sessionStorage.removeItem('oauth_wallet_profile');
        sessionStorage.removeItem('oauth_logged_in');
        sessionStorage.removeItem('wallet_address');
        sessionStorage.removeItem('wallet_public_key');

        // Close modal if it was open
        setOpenWalletModal(false);
        return;
      } catch (error) {
        devError('Error parsing OAuth wallet profile:', error);
      }
    }

    // Check if we need to show OAuth password setup
    const oauthToken = sessionStorage.getItem('oauth_temp_token');
    const oauthProvider = sessionStorage.getItem('oauth_temp_provider');
    const isOnSetupPage = window.location.pathname === '/wallet-setup';

    if (oauthToken && oauthProvider) {
      // User came from OAuth and needs password setup
      // BUT: Only redirect if user is not already logged in AND not already on setup page
      if (!accountProfile && !isOnSetupPage) {
        // Redirect to dedicated setup page instead of showing modal
        window.location.href = '/wallet-setup';
        return;
      } else if (accountProfile) {
        // User is logged in - clear stale OAuth data
        sessionStorage.removeItem('oauth_temp_token');
        sessionStorage.removeItem('oauth_temp_provider');
        sessionStorage.removeItem('oauth_temp_user');
        sessionStorage.removeItem('oauth_action');
      }
      // If on setup page, let wallet-setup.js handle the OAuth data
    } else if (sessionStorage.getItem('wallet_modal_open') === 'true') {
      // Just reopening wallet modal after OAuth redirect
      // BUT: Only if user is NOT already logged in AND not on auth pages
      sessionStorage.removeItem('wallet_modal_open');
      const isAuthPage = window.location.pathname === '/callback' || window.location.pathname === '/wallet-setup';
      if (!accountProfile && !isAuthPage) {
        setOpenWalletModal(true);
      }
    }

    // Initialize Google Sign-In on mount
    const initGoogleSignIn = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: '511415507514-bglt6vsg7458sfqed1daetsfvqahnkh4.apps.googleusercontent.com',
          callback: window.handleGoogleResponse,
          auto_select: false
        });
      }
    };

    // Set up Google response handler globally
    window.handleGoogleResponse = async (response) => {
      try {
        console.log('[Wallet] Google OAuth response received');

        // Decode Google's ID token directly (it's a signed JWT from Google)
        // This is safe because: 1) Google signs it, 2) wallet encryption is local
        const credential = response.credential;
        if (!credential) {
          throw new Error('No credential received from Google');
        }

        // Decode the JWT payload (Google's ID token)
        const payload = JSON.parse(atob(credential.split('.')[1]));
        console.log('[Wallet] Google user:', { sub: payload.sub, email: payload.email });

        // Create user data from Google's token
        const userData = {
          id: payload.sub,
          sub: payload.sub,
          email: payload.email,
          name: payload.name,
          provider: 'google'
        };

        // Store for processing (use credential as token for consistency)
        sessionStorage.setItem('google_jwt_token', credential);
        sessionStorage.setItem('google_user_data', JSON.stringify(userData));

        // Trigger re-render to process
        console.log('[Wallet] Dispatching google-connect-success event');
        window.dispatchEvent(new Event('google-connect-success'));
      } catch (error) {
        console.error('[Wallet] Google auth error:', error);
        openSnackbar('Google authentication failed: ' + (error.message || 'Unknown error'), 'error');
      }
    };

    // Try to init immediately if loaded, or wait for script
    if (window.google?.accounts?.id) {
      initGoogleSignIn();
    } else {
      const checkGoogle = setInterval(() => {
        if (window.google?.accounts?.id) {
          initGoogleSignIn();
          clearInterval(checkGoogle);
        }
      }, 100);

      // Stop checking after 5 seconds
      setTimeout(() => clearInterval(checkGoogle), 5000);
    }

    // Listen for Google connect success
    const handleGoogleSuccess = async () => {
      console.log('[Wallet] google-connect-success event received');
      const token = sessionStorage.getItem('google_jwt_token');
      const userStr = sessionStorage.getItem('google_user_data');
      if (token) {
        console.log('[Wallet] Processing Google connect with token');
        sessionStorage.removeItem('google_jwt_token');
        sessionStorage.removeItem('google_user_data');
        const userData = userStr ? JSON.parse(userStr) : null;
        await processGoogleConnect(token, userData);
      } else {
        console.warn('[Wallet] No token found in sessionStorage');
      }
    };

    window.addEventListener('google-connect-success', handleGoogleSuccess);

    return () => {
      window.removeEventListener('google-connect-success', handleGoogleSuccess);
    };
  }, [accountProfile]); // Re-run when accountProfile changes to clean up OAuth data

  // Handle pending wallet auth from mobile menu
  useEffect(() => {
    if (openWalletModal && pendingWalletAuth) {
      const timer = setTimeout(() => {
        switch (pendingWalletAuth) {
          case 'google':
            handleGoogleConnect();
            break;
          case 'email':
            handleEmailConnect();
            break;
          case 'email_code': {
            const pendingEmail = sessionStorage.getItem('pending_email');
            if (pendingEmail) {
              setVerificationEmail(pendingEmail);
              setShowEmailVerification(true);
              setEmailStep('code');
              sessionStorage.removeItem('pending_email');
            }
            break;
          }
          case 'twitter':
            handleXConnect();
            break;
          case 'discord':
            handleDiscordConnect();
            break;
          case 'passkey':
            setShowDeviceLogin(true);
            break;
        }
        setPendingWalletAuth(null);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [openWalletModal, pendingWalletAuth]);

  // Don't load profiles here - AppContext handles it
  // This was overwriting the auto-loaded profiles from IndexedDB


  const handleRegister = async () => {
    setStatus('registering');
    setError('');

    // Add global error handler for WebAuthn errors - only for unhandled cases
    const originalOnError = window.onerror;
    const originalUnhandledRejection = window.onunhandledrejection;

    let errorHandled = false;

    window.onerror = (msg, url, lineNo, columnNo, error) => {
      const isWebAuthnCancelError = error && (
        error.name === 'NotAllowedError' ||
        error.constructor?.name === 'WebAuthnError' ||
        (error.message && error.message.includes('NotAllowedError'))
      );

      if (isWebAuthnCancelError && !errorHandled) {
        errorHandled = true;
        setError('Registration cancelled. Please try again and allow the security prompt.');
        setStatus('idle');
        return true; // Prevent default error handling
      }
      return originalOnError ? originalOnError.apply(this, arguments) : false;
    };

    window.onunhandledrejection = (event) => {
      const reason = event.reason;
      const isWebAuthnCancelError = reason && (
        reason.name === 'NotAllowedError' ||
        reason.constructor?.name === 'WebAuthnError' ||
        (reason.message && reason.message.includes('NotAllowedError')) ||
        (reason.cause && reason.cause.name === 'NotAllowedError')
      );

      if (isWebAuthnCancelError && !errorHandled) {
        errorHandled = true;
        setError('Registration cancelled. Please try again and allow the security prompt.');
        setStatus('idle');
        event.preventDefault(); // Prevent error from showing in console
        return;
      }
    };

    try {
      await loadDependencies();

      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn not supported in this browser');
      }

      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        setError('Windows Hello, Touch ID, or Face ID must be enabled in your device settings first.');
        setStatus('idle');
        return;
      }


      const userIdBuffer = crypto.getRandomValues(new Uint8Array(32));
      const challengeBuffer = crypto.getRandomValues(new Uint8Array(32));
      const userId = base64urlEncode(userIdBuffer);
      const challenge = base64urlEncode(challengeBuffer);


      const registrationOptions = {
        rp: {
          name: 'XRPL.to',
          // Omit id for localhost to let browser handle it
          ...(window.location.hostname !== 'localhost' && { id: window.location.hostname }),
        },
        user: {
          id: userId,
          name: `xrplto-${Date.now()}@xrpl.to`,
          displayName: `xrplto-${Date.now()}@xrpl.to`, // Same as name to avoid Chrome bug
        },
        challenge: challenge,
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' } // RS256
        ],
        timeout: 60000,
        attestation: 'none',
        excludeCredentials: [], // Explicitly set empty to avoid duplicate prevention
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          requireResidentKey: false,
          residentKey: 'discouraged' // Prevent storing credentials on authenticator
        }
      };


      let registrationResponse;

      try {
        registrationResponse = await startRegistration({ optionsJSON: registrationOptions });
      } catch (error) {
        // Immediately mark as handled to prevent global handlers from triggering
        errorHandled = true;

        const isUserCancellation = error.name === 'NotAllowedError' ||
          error.constructor?.name === 'WebAuthnError' &&
          (error.message?.includes('NotAllowedError') || error.cause?.name === 'NotAllowedError');

        if (!isUserCancellation) {
        }

        // Check the error name property as documented
        const errorName = error.name || error.constructor?.name;
        switch (errorName) {
          case 'NotAllowedError':
            setError('Registration cancelled or not allowed. Please try again.');
            break;
          case 'InvalidStateError':
            setError('A passkey is already registered. Try signing in instead.');
            break;
          case 'AbortError':
            setError('Registration timed out. Please try again.');
            break;
          case 'NotSupportedError':
            setError('Passkeys not supported on this device or browser.');
            break;
          case 'WebAuthnError':
            // Handle SimpleWebAuthn specific errors
            if (error.message?.includes('NotAllowedError') || error.cause?.name === 'NotAllowedError') {
              setError('Registration cancelled or not allowed. Please try again.');
            } else {
              setError(`Registration failed: ${error.message || 'Unknown error'}`);
            }
            break;
          default:
            setError(`Registration failed: ${error.message || 'Unknown error'}`);
        }

        setStatus('idle');
        return; // Exit the function
      }

      if (registrationResponse.id) {
        // Redirect to wallet-setup like OAuth flows
        console.log('[Passkey] Registration successful, redirecting to wallet-setup');
        sessionStorage.setItem('oauth_temp_token', registrationResponse.id);
        sessionStorage.setItem('oauth_temp_provider', 'passkey');
        sessionStorage.setItem('oauth_temp_user', JSON.stringify({ id: registrationResponse.id, provider: 'passkey' }));
        sessionStorage.setItem('oauth_action', 'create');
        setOpenWalletModal(false);
        setStatus('idle');
        window.location.href = '/wallet-setup';
        return;
      }
    } catch (err) {
      errorHandled = true; // Mark error as handled

      const errorName = err.name || err.cause?.name;
      const errorMessage = err.message || err.cause?.message || '';

      if (errorName === 'NotAllowedError' || errorMessage.includes('not allowed') || errorMessage.includes('denied permission')) {
        setError('Cancelled. Please try again and allow the security prompt.');
      } else if (errorName === 'AbortError') {
        setError('Timed out. Please try again.');
      } else {
        setError('Failed: ' + errorMessage);
      }
      setStatus('idle');
    } finally {
      // Restore original error handlers
      window.onerror = originalOnError;
      window.onunhandledrejection = originalUnhandledRejection;
    }
  };

  const handleAuthenticate = async () => {
    try {
      setStatus('authenticating');
      setError('');

      await loadDependencies();

      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn not supported in this browser');
      }

      const challengeBuffer = crypto.getRandomValues(new Uint8Array(32));
      const challenge = base64urlEncode(challengeBuffer);

      let authResponse;
      try {
        authResponse = await startAuthentication({
          optionsJSON: {
            challenge: challenge,
            timeout: 60000,
            userVerification: 'required'
          }
        });
      } catch (innerErr) {
        if (innerErr.message?.includes('NotSupportedError') || innerErr.message?.includes('not supported')) {
          setError('Passkeys not supported on this device or browser.');
        } else if (innerErr.message?.includes('InvalidStateError')) {
          setError('Windows Hello not set up. Please enable Windows Hello, Touch ID, or Face ID in your device settings first.');
        } else if (innerErr.message?.includes('NotAllowedError') || innerErr.message?.includes('denied')) {
          setError('Cancelled. Please try again and allow the security prompt.');
        } else {
          setError('Authentication failed. Please ensure Windows Hello, Touch ID, or Face ID is enabled on your device.');
        }
        setStatus('idle');
        return;
      }

      if (authResponse.id) {
        console.log('[Passkey] Authentication successful, checking for existing wallets');

        // Check if password exists for this passkey
        const storedPassword = await walletStorage.getWalletCredential(authResponse.id);

        if (storedPassword) {
          // Returning user - try to restore wallets
          console.log('[Passkey] Found stored password, restoring wallets');
          const existingWallets = await walletStorage.getAllWalletsForDevice(authResponse.id, storedPassword);

          if (existingWallets && existingWallets.length > 0) {
            // Auto-login with existing wallets
            console.log('[Passkey] Restoring', existingWallets.length, 'wallets');
            const allProfiles = [...profiles];
            existingWallets.forEach(w => {
              const profile = { ...w, tokenCreatedAt: Date.now() };
              if (!allProfiles.find(p => p.account === profile.account)) {
                allProfiles.push(profile);
              }
            });
            setProfiles(allProfiles);
            await syncProfilesToIndexedDB(allProfiles);
            doLogIn(existingWallets[0], allProfiles);
            setOpenWalletModal(false);
            setStatus('idle');
            openSnackbar('Wallet restored successfully!', 'success');
            return;
          }
        }

        // New user or no wallets found - redirect to wallet-setup
        console.log('[Passkey] No existing wallets, redirecting to wallet-setup');
        sessionStorage.setItem('oauth_temp_token', authResponse.id);
        sessionStorage.setItem('oauth_temp_provider', 'passkey');
        sessionStorage.setItem('oauth_temp_user', JSON.stringify({ id: authResponse.id, provider: 'passkey' }));
        sessionStorage.setItem('oauth_action', 'create');
        setOpenWalletModal(false);
        setStatus('idle');
        window.location.href = '/wallet-setup';
        return;
      }
    } catch (err) {

      const errorName = err.name || err.cause?.name;
      const errorMessage = err.message || err.cause?.message || '';

      if (errorName === 'NotAllowedError' || errorMessage.includes('not allowed') || errorMessage.includes('denied permission')) {
        setError('Cancelled. Please try again and allow the security prompt.');
      } else if (errorName === 'AbortError') {
        setError('Timed out. Please try again.');
      } else {
        setError('Failed: ' + errorMessage);
      }
      setStatus('idle');
    }
  };


  const handleAddPasskeyAccount = async () => {
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const challengeB64 = btoa(String.fromCharCode(...challenge))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      // Authenticate with any available passkey
      const authResponse = await startAuthentication({
        optionsJSON: {
          challenge: challengeB64,
          timeout: 60000,
          userVerification: 'required'
        }
      });

      if (authResponse.id) {
        // Generate wallet with random entropy (2025 security standard)
        const wallets = await generateWalletsFromDeviceKey(authResponse.id);

        // Check if any of these wallets already exist in profiles
        const existingWallet = profiles.find(p =>
          wallets.some(w => w.account === p.account)
        );

        // Profiles managed by context only

        // Update profiles state with wallets
        const allProfiles = [...profiles];
        wallets.forEach(deviceProfile => {
          if (!allProfiles.find(p => p.account === deviceProfile.account)) {
            allProfiles.push(deviceProfile);
          }
        });
        setProfiles(allProfiles);
      await syncProfilesToIndexedDB(allProfiles);

        // Login with first wallet - pass the updated profiles
        doLogIn(wallets[0], allProfiles);
        if (existingWallet) {
          openSnackbar(`Switched to device wallet ${wallets[0].address.slice(0, 8)}... (${wallets.length} total)`, 'success');
        } else {
          openSnackbar(`25 device wallets accessed`, 'success');
        }

        setOpen(false);
      }
    } catch (err) {
      openSnackbar('Failed to create/access device wallet: ' + err.message, 'error');
    }
  };

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
      const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
      const storedPassword = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);

      // Rate limiting check
      const rateLimitKey = `new_account_${walletId}`;
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
      ? `https://s1.xrpl.to/profile/${accountLogo}`
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
            'group flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200',
            accountProfile
              ? 'h-9 min-w-[130px] px-4'
              : 'h-9 px-5',
            isDark
              ? accountProfile
                ? 'bg-white/[0.05] text-white hover:bg-white/[0.08] ring-1 ring-white/[0.06]'
                : 'bg-primary/10 text-primary hover:bg-primary/15 ring-1 ring-primary/20'
              : accountProfile
                ? 'bg-gray-50 text-gray-900 hover:bg-gray-100 ring-1 ring-gray-200'
                : 'bg-primary/5 text-primary hover:bg-primary/10 ring-1 ring-primary/20'
          )}
          title={accountProfile ? 'Account Details' : 'Connect Wallet'}
        >
          {accountProfile ? (
            <>
              <div className="relative">
                <div className={cn(
                  'h-2 w-2 rounded-full',
                  accountsActivation[accountLogin] === false ? 'bg-red-500' : 'bg-emerald-400'
                )} />
                {accountsActivation[accountLogin] !== false && (
                  <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-400 animate-ping opacity-50" />
                )}
              </div>
              <span className="font-mono text-[13px] tracking-tight">
                {truncateAccount(accountLogin, 6)}
              </span>
              <ChevronDown size={12} className={cn(
                "transition-transform duration-200",
                open ? "rotate-180" : "",
                isDark ? "text-white/40" : "text-gray-400"
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
            setOpen(false);
            setOpenWalletModal(false);
            setShowDeviceLogin(false);
            setStatus('idle');
            setError('');
            setWalletInfo(null);
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
            {accountProfile ? (
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
                    onClose={() => setOpen(false)}
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
                  />
                ) : showNewAccountFlow ? (
                  <div className={cn("p-5", isDark ? "text-white" : "text-gray-900")}>
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium">Add Account</h3>
                        <button
                          onClick={() => { setShowNewAccountFlow(false); setNewAccountPassword(''); setNewAccountSeed(''); setNewAccountMode('new'); }}
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
                              ? "border-blue-500/20 text-white hover:border-blue-500/40"
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
                              ? "border-blue-500/20 text-white hover:border-blue-500/40"
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
                                      ? "border-blue-500/20 focus:border-blue-500/50"
                                      : "border-blue-200 focus:border-blue-500",
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
                                ? "bg-white/[0.04] border border-blue-500/20 text-white placeholder:text-white/30 focus:border-blue-500/50"
                                : "bg-white border border-blue-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500"
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
                          onClick={() => { setShowNewAccountFlow(false); setNewAccountPassword(''); setNewAccountSeed(''); setNewAccountMode('new'); }}
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
                                ? "border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/5"
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
                                : isDark ? "border-blue-500/20 hover:border-blue-500/40" : "border-blue-200 hover:border-blue-400"
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
                                    ? "bg-white/[0.04] border-blue-500/20 text-white placeholder:text-white/30 focus:border-blue-500"
                                    : "bg-white border-blue-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500"
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
                                isDark ? "border-blue-500/20 text-white hover:bg-blue-500/5" : "border-blue-200 text-gray-700 hover:bg-blue-50"
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
                          <div className={cn("p-3 rounded-lg", isDark ? "bg-blue-500/10 border border-blue-500/20" : "bg-blue-50 border border-blue-200")}>
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
                              isDark ? "bg-white/[0.04] border border-blue-500/20" : "bg-gray-50 border border-blue-200",
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
                                isDark ? "border-blue-500/20 text-white hover:bg-blue-500/5" : "border-blue-200 text-gray-700 hover:bg-blue-50"
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
              // WalletConnect Modal Content - Enhanced UI
              <div className={isDark ? "text-white" : "text-gray-900"}>
                {/* Header */}
                <div className={cn(
                  "px-5 py-4 flex items-center justify-between",
                  isDark ? "border-b border-white/[0.06]" : "border-b border-gray-100"
                )}>
                  <h2 className="text-lg font-medium">Connect Wallet</h2>
                  <button
                    onClick={() => { setOpenWalletModal(false); setShowDeviceLogin(false); }}
                    className={cn(
                      "p-2 rounded-xl transition-colors",
                      isDark ? "hover:bg-white/5 text-white/40 hover:text-white/60" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    )}
                  >
                    <XIcon size={18} />
                  </button>
                </div>

                {/* Content */}
                <div className="px-5 py-4">
                  {!showDeviceLogin ? (
                    <>
                      {/* Social Options - Grid Layout */}
                      <div className="grid grid-cols-2 gap-2.5">
                        {/* Google */}
                        <button
                          onClick={handleGoogleConnect}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg border-[1.5px] px-4 py-3 text-[13px] font-normal transition-colors group",
                            isDark
                              ? "border-blue-500/20 text-white hover:border-blue-500/40 hover:bg-blue-500/5"
                              : "border-blue-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                          )}
                        >
                          <svg className="h-[18px] w-[18px] flex-shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          <span>Google</span>
                        </button>

                        {/* Email */}
                        <button
                          onClick={handleEmailConnect}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg border-[1.5px] px-4 py-3 text-[13px] font-normal transition-colors group",
                            isDark
                              ? "border-blue-500/20 text-white hover:border-blue-500/40 hover:bg-blue-500/5"
                              : "border-blue-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                          )}
                        >
                          <Mail size={18} className={isDark ? "text-white/50" : "text-gray-400"} />
                          <span>Email</span>
                        </button>

                        {/* Twitter/X */}
                        <button
                          onClick={handleXConnect}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg border-[1.5px] px-4 py-3 text-[13px] font-normal transition-colors group",
                            isDark
                              ? "border-blue-500/20 text-white hover:border-blue-500/40 hover:bg-blue-500/5"
                              : "border-blue-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                          )}
                        >
                          <svg className={cn("h-[18px] w-[18px] flex-shrink-0", isDark ? "text-white/50" : "text-gray-400")} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                          <span>Twitter</span>
                        </button>

                        {/* Discord */}
                        <button
                          onClick={handleDiscordConnect}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg border-[1.5px] px-4 py-3 text-[13px] font-normal transition-colors group",
                            isDark
                              ? "border-blue-500/20 text-white hover:border-blue-500/40 hover:bg-blue-500/5"
                              : "border-blue-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                          )}
                        >
                          <svg className={cn("h-[18px] w-[18px] flex-shrink-0", isDark ? "text-white/50" : "text-gray-400")} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                          </svg>
                          <span>Discord</span>
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="flex items-center gap-3 my-4">
                        <div
                          className="flex-1 h-px"
                          style={{
                            backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(66,133,244,0.5)' : 'rgba(66,133,244,0.3)'} 1px, transparent 1px)`,
                            backgroundSize: '6px 1px'
                          }}
                        />
                        <span className={cn("text-[11px] uppercase tracking-wide", isDark ? "text-white/30" : "text-gray-400")}>
                          or
                        </span>
                        <div
                          className="flex-1 h-px"
                          style={{
                            backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(66,133,244,0.5)' : 'rgba(66,133,244,0.3)'} 1px, transparent 1px)`,
                            backgroundSize: '6px 1px'
                          }}
                        />
                      </div>

                      {/* Passkeys - Most secure */}
                      <button
                        onClick={() => setShowDeviceLogin(true)}
                        className="w-full flex items-center justify-center gap-2 rounded-lg border-[1.5px] border-primary bg-primary px-4 py-2.5 text-[13px] font-normal text-white transition-colors hover:bg-primary/90"
                      >
                        <FingerprintIcon size={16} />
                        <span>Passkey</span>
                      </button>

                      {/* Email Verification UI - Enhanced */}
                      {showEmailVerification && (
                        <div className={cn(
                          "mt-4 p-4 rounded-xl",
                          isDark ? "bg-white/[0.03] ring-1 ring-white/[0.06]" : "bg-gray-50 ring-1 ring-gray-100"
                        )}>
                          {emailStep === 'email' ? (
                            <>
                              <p className={cn("text-sm mb-3", isDark ? "text-white/80" : "text-gray-700")}>
                                Enter your email address
                              </p>
                              <input
                                type="email"
                                placeholder="your@email.com"
                                value={verificationEmail}
                                onChange={(e) => setVerificationEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleEmailContinue()}
                                autoFocus
                                className={cn(
                                  "w-full px-4 py-2.5 rounded-xl text-sm outline-none mb-3",
                                  isDark
                                    ? "bg-white/[0.04] border border-blue-500/20 text-white placeholder:text-white/30 focus:border-blue-500/50"
                                    : "bg-white border border-blue-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500"
                                )}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={handleEmailContinue}
                                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90"
                                >
                                  Continue
                                </button>
                                <button
                                  onClick={() => setShowEmailVerification(false)}
                                  className={cn(
                                    "px-4 py-2.5 rounded-xl text-sm font-medium",
                                    isDark ? "text-white/60 hover:bg-white/5" : "text-gray-600 hover:bg-gray-100"
                                  )}
                                >
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : emailStep === 'code' ? (
                            <>
                              <p className={cn("text-sm mb-3", isDark ? "text-white/80" : "text-gray-700")}>
                                Enter the 6-digit code sent to <span className="font-medium">{verificationEmail}</span>
                              </p>
                              <input
                                type="text"
                                placeholder="000000"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                onKeyDown={(e) => e.key === 'Enter' && handleVerifyEmailCode()}
                                autoFocus
                                className={cn(
                                  "w-full px-4 py-2.5 rounded-xl text-sm text-center font-mono tracking-[0.5em] outline-none mb-3",
                                  isDark
                                    ? "bg-white/[0.04] border border-blue-500/20 text-white placeholder:text-white/30 focus:border-blue-500/50"
                                    : "bg-white border border-blue-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500"
                                )}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={handleVerifyEmailCode}
                                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90"
                                >
                                  Verify
                                </button>
                                <button
                                  onClick={() => setEmailStep('email')}
                                  className={cn(
                                    "px-4 py-2.5 rounded-xl text-sm font-medium",
                                    isDark ? "text-white/60 hover:bg-white/5" : "text-gray-600 hover:bg-gray-100"
                                  )}
                                >
                                  Back
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className={cn("text-sm mb-3", isDark ? "text-white/80" : "text-gray-700")}>
                                Enter your password for <span className="font-medium">{verificationEmail}</span>
                              </p>
                              <input
                                type="password"
                                placeholder="Password"
                                value={emailPassword}
                                onChange={(e) => setEmailPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleEmailPasswordLogin()}
                                autoFocus
                                className={cn(
                                  "w-full px-4 py-2.5 rounded-xl text-sm outline-none mb-3",
                                  isDark
                                    ? "bg-white/[0.04] border border-blue-500/20 text-white placeholder:text-white/30 focus:border-blue-500/50"
                                    : "bg-white border border-blue-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500"
                                )}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={handleEmailPasswordLogin}
                                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90"
                                >
                                  Login
                                </button>
                                <button
                                  onClick={() => { setEmailStep('email'); setEmailPassword(''); }}
                                  className={cn(
                                    "px-4 py-2.5 rounded-xl text-sm font-medium",
                                    isDark ? "text-white/60 hover:bg-white/5" : "text-gray-600 hover:bg-gray-100"
                                  )}
                                >
                                  Back
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Footer - Enhanced */}
                      <div className={cn(
                        "mt-4 pt-4 text-center border-t",
                        isDark ? "border-white/[0.04]" : "border-gray-100"
                      )}>
                        <div className="flex items-center justify-center gap-1.5">
                          <Lock size={11} className={isDark ? "text-white/30" : "text-gray-400"} />
                          <span className={cn("text-[11px]", isDark ? "text-white/30" : "text-gray-400")}>
                            Encrypted and stored locally
                          </span>
                        </div>
                        {(profiles.length > 0 || storedWalletCount > 0) && !showClearConfirm ? (
                          <button
                            onClick={() => { checkStoredWalletCount(); setShowClearConfirm(true); }}
                            className={cn("text-[10px] mt-2", isDark ? "text-red-400/50 hover:text-red-400" : "text-red-400/60 hover:text-red-500")}
                          >
                            Clear all wallets
                          </button>
                        ) : showClearConfirm ? (
                          <div className={cn(
                            "mt-4 rounded-2xl border-[1.5px] overflow-hidden",
                            isDark ? "bg-[#0d0d0d] border-red-500/20" : "bg-white border-red-200"
                          )}>
                            {/* Header with warning */}
                            <div className={cn(
                              "px-4 py-3 border-b",
                              isDark ? "bg-red-500/5 border-red-500/10" : "bg-red-50 border-red-100"
                            )}>
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center",
                                  isDark ? "bg-red-500/10" : "bg-red-100"
                                )}>
                                  <Trash2 size={18} className="text-red-500" />
                                </div>
                                <div>
                                  <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>
                                    Delete {(profiles.length || storedWalletCount) || 'all'} wallet{(profiles.length || storedWalletCount) !== 1 ? 's' : ''}?
                                  </p>
                                  <p className={cn("text-[11px]", isDark ? "text-white/40" : "text-gray-500")}>
                                    This action cannot be undone
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Wallet details */}
                            <div className="px-4 py-3">
                              {(storedWalletDate || storedWalletAddresses.length > 0) && (
                                <div className={cn(
                                  "rounded-xl p-3 mb-3",
                                  isDark ? "bg-white/[0.02]" : "bg-gray-50"
                                )}>
                                  {storedWalletAddresses.slice(0, 3).map((addr, i) => (
                                    <div key={i} className="flex items-center gap-2 mb-1.5 last:mb-0">
                                      <div className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        isDark ? "bg-red-400/60" : "bg-red-400"
                                      )} />
                                      <span className={cn(
                                        "font-mono text-[11px]",
                                        isDark ? "text-white/60" : "text-gray-600"
                                      )}>{addr}</span>
                                    </div>
                                  ))}
                                  {storedWalletAddresses.length > 3 && (
                                    <p className={cn("text-[10px] mt-1 pl-3.5", isDark ? "text-white/30" : "text-gray-400")}>
                                      +{storedWalletAddresses.length - 3} more wallet{storedWalletAddresses.length - 3 !== 1 ? 's' : ''}
                                    </p>
                                  )}
                                  {storedWalletDate && (
                                    <p className={cn("text-[10px] mt-2 pt-2 border-t", isDark ? "text-white/30 border-white/5" : "text-gray-400 border-gray-100")}>
                                      Created {new Date(storedWalletDate).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Slide to delete */}
                              <div
                                className={cn(
                                  "relative h-12 rounded-xl overflow-hidden cursor-pointer select-none",
                                  clearSliderValue >= 95
                                    ? "bg-red-500"
                                    : isDark ? "bg-white/[0.06]" : "bg-gray-100"
                                )}
                                onMouseDown={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const handleMove = (moveEvent) => {
                                    const x = Math.max(0, Math.min(moveEvent.clientX - rect.left, rect.width));
                                    const val = Math.round((x / rect.width) * 100);
                                    setClearSliderValue(val);
                                    if (val >= 95) handleClearAllWallets();
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
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const handleMove = (moveEvent) => {
                                    const touch = moveEvent.touches[0];
                                    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
                                    const val = Math.round((x / rect.width) * 100);
                                    setClearSliderValue(val);
                                    if (val >= 95) handleClearAllWallets();
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
                                {/* Progress fill */}
                                <div
                                  className={cn(
                                    "absolute inset-y-0 left-0",
                                    clearSliderValue >= 95 ? "bg-red-600" : "bg-red-500/30"
                                  )}
                                  style={{ width: `${clearSliderValue}%` }}
                                />

                                {/* Thumb */}
                                <div
                                  className={cn(
                                    "absolute top-1 bottom-1 w-11 rounded-lg flex items-center justify-center",
                                    clearSliderValue >= 95
                                      ? "bg-white"
                                      : clearSliderValue > 0
                                        ? "bg-red-500"
                                        : isDark ? "bg-white/15" : "bg-white border border-blue-200"
                                  )}
                                  style={{
                                    left: `calc(${clearSliderValue}% - ${clearSliderValue * 0.44}px + 4px)`,
                                    transition: clearSliderValue === 0 ? 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none'
                                  }}
                                >
                                  {clearSliderValue >= 95 ? (
                                    <Loader2 size={16} className="text-red-500 animate-spin" />
                                  ) : (
                                    <ChevronRight size={16} className={cn(
                                      clearSliderValue > 0 ? "text-white" : isDark ? "text-white/50" : "text-gray-400"
                                    )} />
                                  )}
                                </div>

                                {/* Label */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <span className={cn(
                                    "text-xs font-medium transition-opacity duration-150",
                                    clearSliderValue > 30 ? "opacity-0" : "opacity-100",
                                    clearSliderValue >= 95
                                      ? "text-white"
                                      : isDark ? "text-white/40" : "text-gray-500"
                                  )}
                                  style={{ marginLeft: '44px' }}
                                  >
                                    Slide to delete
                                  </span>
                                </div>

                                {/* Deleting text */}
                                {clearSliderValue >= 95 && (
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-xs font-medium text-white">
                                      Deleting...
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Cancel button */}
                              <button
                                onClick={() => { setShowClearConfirm(false); setClearSliderValue(0); }}
                                className={cn(
                                  "w-full mt-3 py-2.5 rounded-xl text-xs font-medium border-[1.5px] transition-all",
                                  isDark
                                    ? "border-blue-500/20 text-white/60 hover:border-blue-500/30 hover:text-white/80"
                                    : "border-blue-200 text-gray-500 hover:border-blue-300 hover:text-gray-700"
                                )}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : null}

                        {/* Debug: Test entropy backup recovery */}
                        {process.env.NODE_ENV === 'development' && (
                          <button
                            onClick={() => {
                              localStorage.removeItem('__wk_entropy__');
                              alert('Deleted __wk_entropy__ from localStorage.\n\nNow log out and log back in with OAuth.\nIf IndexedDB backup works, you should auto-login without entering password.');
                            }}
                            className={cn("text-[10px] mt-2 block", isDark ? "text-orange-400/50 hover:text-orange-400" : "text-orange-400/60 hover:text-orange-500")}
                          >
                            [Debug] Delete entropy key
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Passkeys Section - Enhanced */}
                      <div className="space-y-4">
                        {/* Header with back button */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleGoBack}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-[1.5px] text-xs font-normal transition-all",
                              isDark
                                ? "border-blue-500/20 text-white/60 hover:border-blue-500/40 hover:text-blue-400"
                                : "border-blue-200 text-gray-500 hover:border-blue-400 hover:text-blue-600"
                            )}
                          >
                            <ArrowLeft size={14} />
                            Back
                          </button>
                          <div
                            className="flex-1 h-px"
                            style={{
                              backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(66,133,244,0.5)' : 'rgba(66,133,244,0.3)'} 1px, transparent 1px)`,
                              backgroundSize: '6px 1px'
                            }}
                          />
                          <span className={cn("text-[11px] font-medium uppercase tracking-wide", isDark ? "text-white/40" : "text-gray-500")}>Passkey</span>
                        </div>

                        {/* Error Alert */}
                        {error && (
                          <div className={cn(
                            "rounded-xl p-3.5 border",
                            error.includes('Creating wallets')
                              ? isDark ? "bg-primary/5 border-primary/20" : "bg-primary/5 border-primary/20"
                              : isDark ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-200"
                          )}>
                            <div className="flex gap-2.5">
                              {!error.includes('Creating wallets') && (
                                <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                              )}
                              <div>
                                {!error.includes('Creating wallets') && (
                                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Hardware Security Required</p>
                                )}
                                <p className={cn("text-xs mt-0.5 leading-relaxed", isDark ? "text-white/70" : "text-gray-600")}>
                                  {error}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Password Input for Device Connect - Enhanced */}
                        {showDevicePasswordInput && (
                          <div className="space-y-3">
                            <p className={cn("text-sm", isDark ? "text-white/80" : "text-gray-700")}>
                              {devicePasswordMode === 'create'
                                ? 'Create a password to secure your wallet'
                                : 'Enter your password to access your wallet'}
                            </p>

                            <div className="relative">
                              <input
                                type={showDevicePassword ? 'text' : 'password'}
                                value={devicePassword}
                                onChange={(e) => { setDevicePassword(e.target.value); setError(''); }}
                                onKeyDown={(e) => e.key === 'Enter' && handleDevicePasswordSubmit()}
                                placeholder="Password"
                                autoFocus
                                className={cn(
                                  "w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all",
                                  isDark
                                    ? "bg-white/[0.04] border border-blue-500/20 text-white placeholder:text-white/30 focus:border-blue-500/50"
                                    : "bg-gray-50 border border-blue-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500"
                                )}
                              />
                              <button
                                type="button"
                                onClick={() => setShowDevicePassword(!showDevicePassword)}
                                className={cn(
                                  "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors",
                                  isDark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600"
                                )}
                              >
                                {showDevicePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>

                            {devicePasswordMode === 'create' && (
                              <input
                                type={showDevicePassword ? 'text' : 'password'}
                                value={devicePasswordConfirm}
                                onChange={(e) => { setDevicePasswordConfirm(e.target.value); setError(''); }}
                                onKeyDown={(e) => e.key === 'Enter' && handleDevicePasswordSubmit()}
                                placeholder="Confirm Password"
                                className={cn(
                                  "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all",
                                  isDark
                                    ? "bg-white/[0.04] border border-blue-500/20 text-white placeholder:text-white/30 focus:border-blue-500/50"
                                    : "bg-gray-50 border border-blue-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500"
                                )}
                              />
                            )}

                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => {
                                  setShowDevicePasswordInput(false);
                                  setDevicePassword('');
                                  setDevicePasswordConfirm('');
                                  setStatus('idle');
                                  setError('');
                                }}
                                className={cn(
                                  "flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all",
                                  isDark
                                    ? "border-blue-500/20 text-white/70 hover:bg-blue-500/5"
                                    : "border-blue-200 text-gray-600 hover:bg-blue-50"
                                )}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleDevicePasswordSubmit}
                                disabled={devicePasswordMode === 'create' ? !devicePassword || !devicePasswordConfirm : !devicePassword}
                                className={cn(
                                  "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all",
                                  (devicePasswordMode === 'create' ? devicePassword && devicePasswordConfirm : devicePassword)
                                    ? "bg-primary text-white hover:bg-primary/90"
                                    : isDark
                                      ? "bg-white/5 text-white/30 cursor-not-allowed"
                                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                )}
                              >
                                {devicePasswordMode === 'create' ? 'Create Wallet' : 'Authenticate'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Success State */}
                        {status === 'success' && walletInfo && (
                          <div className={cn(
                            "rounded-xl p-4 border",
                            isDark ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"
                          )}>
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                <CheckCircle size={16} className="text-emerald-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                  {walletInfo.isAdditional ? 'Wallet Accessed!' : 'Wallet Created!'}
                                </p>
                                <p className={cn("text-xs mt-1", isDark ? "text-white/60" : "text-gray-600")}>
                                  Secured by hardware authentication
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Loading State */}
                        {isLoadingDeps && (
                          <div className={cn(
                            "rounded-xl p-4 border flex items-center gap-3",
                            isDark ? "bg-white/[0.02] border-white/[0.06]" : "bg-gray-50 border-gray-100"
                          )}>
                            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            <span className={cn("text-sm", isDark ? "text-white/60" : "text-gray-600")}>
                              Loading security modules...
                            </span>
                          </div>
                        )}

                        {/* Action Buttons - Enhanced */}
                        {!showDevicePasswordInput && (
                          <div className="space-y-2.5">
                            <button
                              onClick={handleAuthenticate}
                              disabled={status !== 'idle' || isLoadingDeps}
                              className={cn(
                                "w-full py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2",
                                status === 'idle' && !isLoadingDeps
                                  ? "bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25"
                                  : isDark
                                    ? "bg-white/5 text-white/30 cursor-not-allowed"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              )}
                            >
                              <FingerprintIcon size={16} />
                              {status === 'authenticating' ? 'Authenticating...' :
                               status === 'discovering' ? 'Discovering...' :
                               status === 'creating' ? 'Creating Wallet...' :
                               'Sign In with Passkey'}
                            </button>

                            <button
                              onClick={handleRegister}
                              disabled={status !== 'idle' || isLoadingDeps}
                              className={cn(
                                "w-full py-3 rounded-xl text-sm font-medium transition-all border-[1.5px]",
                                status === 'idle' && !isLoadingDeps
                                  ? isDark
                                    ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50"
                                    : "border-amber-500/30 text-amber-600 hover:bg-amber-50 hover:border-amber-500/50"
                                  : isDark
                                    ? "border-white/5 text-white/20 cursor-not-allowed"
                                    : "border-gray-100 text-gray-300 cursor-not-allowed"
                              )}
                            >
                              {status === 'registering' ? 'Creating...' : 'Create New Passkey'}
                            </button>

                            <div className="flex items-center justify-center gap-1.5 pt-2">
                              <Shield size={11} className={isDark ? "text-white/30" : "text-gray-400"} />
                              <span className={cn("text-[11px]", isDark ? "text-white/30" : "text-gray-400")}>
                                Hardware secured authentication
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            </StyledPopoverPaper>
          </DialogContent>
        </Dialog>

        {/* OAuth Password Setup Dialog */}
        <Dialog
          open={!isAuthPage && showOAuthPasswordSetup}
          onClose={() => {
            if (!isCreatingWallet) {
              setShowOAuthPasswordSetup(false);
              // Clear OAuth session data when closing
              sessionStorage.removeItem('oauth_temp_token');
              sessionStorage.removeItem('oauth_temp_provider');
              sessionStorage.removeItem('oauth_temp_user');
              sessionStorage.removeItem('oauth_action');
              // Clear input fields
              setOAuthPassword('');
              setOAuthConfirmPassword('');
              setImportSeed('');
              setImportFile(null);
              setOAuthPasswordError('');
                  }
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogContent>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 400, fontSize: '18px', mb: 0.5 }}>
                  Setup Your Wallet
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '14px', opacity: 0.7 }}>
                  Choose to create a new wallet or import an existing one.
                </Typography>
              </Box>

              {/* Import/New Wallet Toggle */}
              <Box sx={{
                display: 'flex',
                gap: 1
              }} role="tablist" aria-label="Wallet setup method">
                <Button
                  variant={importMethod === 'new' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => {
                    setImportMethod('new');
                    setImportFile(null);
                    setImportSeeds(['']);
                    setOAuthPassword('');
                    setOAuthConfirmPassword('');
                  }}
                  role="tab"
                  aria-selected={importMethod === 'new'}
                  aria-label="Create new wallet"
                  sx={{
                    flex: 1,
                    fontSize: '13px',
                    py: 1,
                    fontWeight: 400
                  }}
                >
                  New
                </Button>
                <Button
                  variant={importMethod === 'seed' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => {
                    setImportMethod('seed');
                    setImportFile(null);
                    setOAuthPassword('');
                    setOAuthConfirmPassword('');
                  }}
                  role="tab"
                  aria-selected={importMethod === 'seed'}
                  aria-label="Import from seed phrase"
                  sx={{
                    flex: 1,
                    fontSize: '13px',
                    py: 1,
                    fontWeight: 400
                  }}
                >
                  Seed
                </Button>
                <Button
                  variant={importMethod === 'import' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => {
                    setImportMethod('import');
                    setImportSeeds(['']);
                    setOAuthPassword('');
                    setOAuthConfirmPassword('');
                  }}
                  role="tab"
                  aria-selected={importMethod === 'import'}
                  aria-label="Import from file"
                  sx={{
                    flex: 1,
                    fontSize: '13px',
                    py: 1,
                    fontWeight: 400
                  }}
                >
                  File
                </Button>
              </Box>

              {oauthPasswordError && (
                <Alert
                  severity={oauthPasswordError.includes('...') || oauthPasswordError.includes('wallet') ? "info" : "error"}
                  onClose={oauthPasswordError.includes('...') ? null : () => setOAuthPasswordError('')}
                  icon={oauthPasswordError.includes('...') ? <Box sx={{ width: 20, height: 20 }} className="MuiCircularProgress-root MuiCircularProgress-colorPrimary"><svg className="MuiCircularProgress-svg" viewBox="22 22 44 44"><circle className="MuiCircularProgress-circle MuiCircularProgress-circleIndeterminate" cx="44" cy="44" r="20.2" fill="none" strokeWidth="3.6" style={{ strokeDasharray: '80px, 200px', strokeDashoffset: 0, animation: 'MuiCircularProgress-keyframes-circular-rotate 1.4s linear infinite' }}></circle></svg></Box> : undefined}
                >
                  {oauthPasswordError}
                </Alert>
              )}

              {/* Seed Input for Import */}
              {importMethod === 'seed' && (
                <Box>
                  <Stack spacing={1.5}>
                    {importSeeds.map((seed, index) => (
                      <Box key={index}>
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                          <TextField
                            label={`Seed ${index + 1}${index === 0 ? ' (Primary)' : ''}`}
                            placeholder="Enter seed starting with 's'"
                            value={seed}
                            onChange={(e) => {
                              const newSeeds = [...importSeeds];
                              newSeeds[index] = e.target.value;
                              setImportSeeds(newSeeds);
                            }}
                            fullWidth
                            multiline
                            rows={2}
                            inputProps={{
                              'aria-label': `Seed phrase ${index + 1}`,
                              'aria-describedby': `seed-helper-text-${index}`
                            }}
                            helperText={
                              seed.startsWith('sEd') ? 'Valid Ed25519 seed' :
                              seed.startsWith('s') ? 'Valid secp256k1 seed' :
                              index === 0 ? 'Required: XRP Ledger secret (starts with "s")' :
                              'Optional: Additional seed to import'
                            }
                            FormHelperTextProps={{
                              id: `seed-helper-text-${index}`
                            }}
                            sx={{
                              '& .MuiInputBase-input': {
                                fontFamily: 'monospace',
                                fontSize: '14px'
                              },
                              '& .MuiFormHelperText-root': {
                                color: seed.startsWith('s') ? 'success.main' : 'text.secondary',
                                fontSize: '11px'
                              }
                            }}
                          />
                          {importSeeds.length > 1 && (
                            <IconButton
                              size="small"
                              onClick={() => {
                                const newSeeds = importSeeds.filter((_, i) => i !== index);
                                setImportSeeds(newSeeds);
                              }}
                              sx={{
                                mt: 1,
                                color: 'error.main',
                                opacity: 0.6,
                                '&:hover': { opacity: 1 }
                              }}
                              aria-label={`Remove seed ${index + 1}`}
                            >
                              <Box component="svg" sx={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12"/>
                              </Box>
                            </IconButton>
                          )}
                        </Stack>
                      </Box>
                    ))}

                    {importSeeds.length < 5 && (
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => {
                          if (importSeeds.length < 5) {
                            setImportSeeds([...importSeeds, '']);
                          }
                        }}
                        sx={{
                          fontSize: '13px',
                          fontWeight: 400,
                          color: '#4285f4',
                          textTransform: 'none',
                          justifyContent: 'flex-start',
                          pl: 1,
                          '&:hover': {
                            backgroundColor: alpha('#4285f4', 0.04)
                          }
                        }}
                      >
                        + Add another seed ({importSeeds.length}/5)
                      </Button>
                    )}
                  </Stack>

                  <Alert severity="info" sx={{ mt: 1.5, py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '11px' }}>
                      <strong>Tip:</strong> Import up to 5 seeds. We'll create wallets from your seeds in order.
                      {importSeeds.filter(s => s.trim()).length > 0 && importSeeds.filter(s => s.trim()).length < 5 &&
                        ` (${5 - importSeeds.filter(s => s.trim()).length} random wallet${5 - importSeeds.filter(s => s.trim()).length > 1 ? 's' : ''} will be added)`
                      }
                    </Typography>
                  </Alert>
                </Box>
              )}

              {/* File Upload for Import */}
              {importMethod === 'import' && (
                <Box>
                  <Typography variant="body2" component="label" htmlFor="wallet-file-input" sx={{ mb: 1, fontSize: '14px' }}>
                    Select your encrypted wallet backup file
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    aria-label={importFile ? `File selected: ${importFile.name}` : 'Choose wallet backup file'}
                    sx={{
                      py: 1,
                      borderStyle: 'dashed',
                      borderWidth: '1.5px',
                      backgroundColor: importFile ? alpha(theme.palette.success.main, 0.04) : 'transparent',
                      fontWeight: 400,
                      fontSize: '14px'
                    }}
                  >
                    {importFile ? `✓ ${importFile.name}` : 'Choose Wallet File'}
                    <input
                      id="wallet-file-input"
                      type="file"
                      hidden
                      accept=".json,application/json"
                      aria-label="Upload wallet backup file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImportFile(file);
                        }
                      }}
                    />
                  </Button>
                </Box>
              )}

              <TextField
                label={importMethod === 'import' ? 'Wallet Password' : 'Password'}
                type={showOAuthPassword ? 'text' : 'password'}
                value={oauthPassword}
                onChange={(e) => setOAuthPassword(e.target.value)}
                fullWidth
                autoComplete="off"
                inputProps={{
                  'aria-label': importMethod === 'import' ? 'Wallet password' : 'New password',
                  'aria-describedby': 'password-helper-text',
                  autoComplete: 'off'
                }}
                helperText={importMethod === 'import' ?
                  'Enter the password used when you backed up this wallet' :
                  'Minimum 8 characters'}
                FormHelperTextProps={{
                  id: 'password-helper-text'
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowOAuthPassword(!showOAuthPassword)}
                        edge="end"
                        size="small"
                        aria-label={showOAuthPassword ? 'Hide password' : 'Show password'}
                      >
                        {showOAuthPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {importMethod === 'new' && (
                <TextField
                  label="Confirm Password"
                  type={showOAuthPassword ? 'text' : 'password'}
                  value={oauthConfirmPassword}
                  onChange={(e) => setOAuthConfirmPassword(e.target.value)}
                  fullWidth
                  autoComplete="off"
                  inputProps={{
                    'aria-label': 'Confirm new password',
                    autoComplete: 'off'
                  }}
                />
              )}

              <Alert severity="info" sx={{ py: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '13px' }}>
                  {importMethod === 'import' ?
                    <><strong>Note:</strong> You'll be importing your existing wallet with its current balance and history.</> :
                    importMethod === 'seed' ? (
                      importSeeds.filter(s => s.trim()).length === 0 ?
                        <><strong>Note:</strong> Enter up to 5 seed phrases to import existing wallets. Any remaining slots will be filled with new wallets.</> :
                      importSeeds.filter(s => s.trim()).length === 1 ?
                        <><strong>Note:</strong> Your seed will be imported as wallet 1. We'll create 4 new wallets for the remaining slots (5 total).</> :
                      importSeeds.filter(s => s.trim()).length === 5 ?
                        <><strong>Perfect!</strong> All 5 wallet slots will be filled with your imported seeds. No new wallets will be created.</> :
                        <><strong>Note:</strong> You're importing {importSeeds.filter(s => s.trim()).length} seeds. We'll create {5 - importSeeds.filter(s => s.trim()).length} new wallet{5 - importSeeds.filter(s => s.trim()).length > 1 ? 's' : ''} for the remaining slots.</>
                    ) :
                    <><strong>Important:</strong> We'll create 5 wallets for you. Store this password safely - you'll need it to export your wallets or recover them on a new device.</>
                  }
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    setShowOAuthPasswordSetup(false);
                    // Clear OAuth session data when canceling
                    sessionStorage.removeItem('oauth_temp_token');
                    sessionStorage.removeItem('oauth_temp_provider');
                    sessionStorage.removeItem('oauth_temp_user');
                    sessionStorage.removeItem('oauth_action');
                    // Clear input fields
                    setOAuthPassword('');
                    setOAuthConfirmPassword('');
                    setImportSeeds(['']);
                    setImportFile(null);
                    setOAuthPasswordError('');
                              }}
                  disabled={isCreatingWallet}
                  aria-label="Cancel wallet setup"
                  sx={{
                    fontSize: '14px',
                    fontWeight: 400,
                    py: 1
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleOAuthPasswordSetup}
                  disabled={isCreatingWallet || !oauthPassword ||
                    (importMethod === 'new' && !oauthConfirmPassword) ||
                    (importMethod === 'import' && !importFile) ||
                    (importMethod === 'seed' && !importSeeds.some(s => s.trim()))}
                  aria-label={isCreatingWallet ? 'Processing wallet setup' :
                    (importMethod === 'seed' ? 'Import wallet from seed' :
                     importMethod === 'import' ? 'Import wallet from file' : 'Create new wallet')}
                  sx={{
                    fontSize: '14px',
                    fontWeight: 400,
                    py: 1
                  }}
                >
                  {isCreatingWallet ?
                    (importMethod === 'seed' ? 'Importing Seed...' :
                     importMethod === 'import' ? 'Importing File...' : 'Creating...') :
                    (importMethod === 'seed' ? 'Import Seed' :
                     importMethod === 'import' ? 'Import File' : 'Create Wallet')}
                </Button>
              </Box>
            </Stack>
          </DialogContent>
        </Dialog>

    </div>
  );
}
