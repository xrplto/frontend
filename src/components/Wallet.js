import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Wallet as XRPLWallet, encodeSeed } from 'xrpl';

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
  AlertTriangle
} from 'lucide-react';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Translation removed - not using i18n

// Utils
import { getHashIcon } from 'src/utils/formatters';
import { EncryptedWalletStorage } from 'src/utils/encryptedWalletStorage';
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

// Dialog component
const Dialog = ({ open, onClose, children, maxWidth, fullWidth, sx, ...props }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-end" onClick={onClose}>
      <div
        className="mt-[62px] mr-3 w-[340px] max-w-[340px] rounded-2xl bg-transparent animate-in fade-in slide-in-from-top-2 duration-200"
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

// StyledPopoverPaper component
const StyledPopoverPaper = ({ children, isDark }) => (
  <div className={cn(
    "overflow-hidden rounded-xl border shadow-2xl",
    isDark
      ? "border-white/[0.08] bg-[#0d0d0d] shadow-black/70"
      : "border-gray-200 bg-white shadow-black/[0.08]"
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
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 400,
    cursor: disabled ? 'not-allowed' : 'pointer',
    width: fullWidth ? '100%' : 'auto',
    border: variant === 'outlined' ? '1px solid rgba(255,255,255,0.2)' : 'none',
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
    borderRadius: 8,
    border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.2)',
    background: 'transparent',
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
  walletsPerPage
}) => {
  const needsBackup = typeof window !== 'undefined' && localStorage.getItem(`wallet_needs_backup_${accountLogin}`);
  const [showQR, setShowQR] = useState(false);
  const [showAllAccounts, setShowAllAccounts] = useState(false);

  // Show backup section instead of wallet when downloading
  if (showBackupPassword) {
    return (
      <Box sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 1 }}>
            <Typography sx={{ fontSize: '16px', fontWeight: 500, display: 'block' }}>
              Download Backup
            </Typography>
            <Typography sx={{ fontSize: '12px', opacity: 0.6, display: 'block', mt: 0.5 }}>
              All {profiles.length} wallets encrypted
            </Typography>
          </Box>

          {/* Warning */}
          <Alert severity="warning" icon={false} sx={{ py: 1 }}>
            <Box sx={{ display: 'block' }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 500, display: 'block', mb: 0.5, color: '#b45309' }}>
                Keep this file safe
              </Typography>
              <Typography sx={{ fontSize: '11px', display: 'block', lineHeight: 1.4 }}>
                Contains all wallet seeds. Never share it.
              </Typography>
            </Box>
          </Alert>

          {/* Acknowledgment */}
          <Box
            onClick={() => setBackupAgreed(!backupAgreed)}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
              p: 1.2,
              borderRadius: '8px',
              border: `1.5px solid ${backupAgreed ? theme.palette.primary.main : alpha(theme.palette.divider, 0.3)}`,
              cursor: 'pointer',
              backgroundColor: backupAgreed ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
              '&:hover': { borderColor: theme.palette.primary.main }
            }}
          >
            <Box sx={{
              width: 16,
              height: 16,
              borderRadius: '3px',
              border: `2px solid ${backupAgreed ? theme.palette.primary.main : alpha(theme.palette.divider, 0.4)}`,
              background: backupAgreed ? theme.palette.primary.main : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              mt: 0.2
            }}>
              {backupAgreed && <Check size={12} color="white" />}
            </Box>
            <Typography sx={{ fontSize: '11px', lineHeight: 1.4 }}>
              I understand and will keep this file safe
            </Typography>
          </Box>

          {/* Password Input */}
          <TextField
            type={showBackupPasswordVisible ? 'text' : 'password'}
            value={backupPassword}
            onChange={(e) => setBackupPassword(e.target.value)}
            placeholder="Enter password"
            fullWidth
            disabled={!backupAgreed}
            isDark={isDark}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && backupPassword && backupAgreed) {
                processBackupDownload();
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowBackupPasswordVisible(!showBackupPasswordVisible)}
                    edge="end"
                  >
                    {showBackupPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          {/* Actions */}
          <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
            <Button
              variant="contained"
              size="small"
              onClick={processBackupDownload}
              disabled={!backupPassword || !backupAgreed}
              sx={{ fontSize: '13px', py: 0.6, px: 2, flex: 1 }}
            >
              Download
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setShowBackupPassword(false);
                setBackupPassword('');
                setShowBackupPasswordVisible(false);
                setBackupAgreed(false);
              }}
              sx={{ fontSize: '13px', py: 0.6, px: 2 }}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Box>
    );
  }

  return (
    <>
      {/* Header */}
      <Box sx={{
        p: 1.2,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: theme.palette.success.main
            }} />
            <Typography sx={{
              fontFamily: 'monospace',
              fontSize: '11px',
              fontWeight: 400,
              opacity: 0.7
            }}>
              {truncateAccount(accountLogin, 6)}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            {needsBackup && (
              <Typography
                onClick={onBackupSeed}
                sx={{
                  fontSize: '11px',
                  color: '#f59e0b',
                  cursor: 'pointer',
                  '&:hover': { color: '#fbbf24' }
                }}
              >
                backup
              </Typography>
            )}
            <IconButton
              size="small"
              onClick={onClose}
              sx={{
                p: 0.3,
                opacity: 0.5,
                '&:hover': { opacity: 0.8 }
              }}
            >
              <Box component="svg" sx={{ width: 12, height: 12 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </Box>
            </IconButton>
          </Stack>
        </Stack>
      </Box>

      {/* Balance */}
      <Box sx={{
        py: 2,
        px: 2,
        textAlign: 'center'
      }}>
        <Typography sx={{
          fontSize: '28px',
          fontWeight: 400,
          lineHeight: 1,
          fontFamily: 'monospace'
        }}>
          {accountTotalXrp || accountBalance?.curr1?.value || '0'}
        </Typography>
        <Typography sx={{
          fontSize: '11px',
          opacity: 0.5,
          fontWeight: 400,
          mt: 0.5
        }}>
          XRP
        </Typography>

        {/* Actions */}
        <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1.5 }}>
          <Button
            size="small"
            onClick={() => {
              navigator.clipboard.writeText(accountLogin);
              openSnackbar('Address copied', 'success');
            }}
            sx={{
              fontSize: '11px',
              fontWeight: 400,
              textTransform: 'none',
              color: 'text.secondary',
              minWidth: 'auto',
              px: 1.5,
              py: 0.5,
              '&:hover': { backgroundColor: alpha(theme.palette.text.primary, 0.04) }
            }}
          >
            Copy
          </Button>
          <Button
            size="small"
            onClick={() => setShowQR(!showQR)}
            sx={{
              fontSize: '11px',
              fontWeight: 400,
              textTransform: 'none',
              color: 'text.secondary',
              minWidth: 'auto',
              px: 1.5,
              py: 0.5,
              '&:hover': { backgroundColor: alpha(theme.palette.text.primary, 0.04) }
            }}
          >
            QR
          </Button>
          <Button
            size="small"
            onClick={onBackupSeed}
            sx={{
              fontSize: '11px',
              fontWeight: 400,
              textTransform: 'none',
              color: 'text.secondary',
              minWidth: 'auto',
              px: 1.5,
              py: 0.5,
              '&:hover': { backgroundColor: alpha(theme.palette.text.primary, 0.04) }
            }}
          >
            Backup
          </Button>
        </Stack>

        {showQR && (
          <Box sx={{
            mt: 1.5,
            p: 1,
            borderRadius: '8px',
            background: 'white',
            display: 'inline-block'
          }}>
            <Box
              component="img"
              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${accountLogin}`}
              alt="QR Code"
              sx={{ display: 'block', width: 100, height: 100 }}
            />
          </Box>
        )}
      </Box>

      {/* Stats */}
      <Box sx={{ px: 2, pb: 1.5 }}>
        <Stack direction="row" spacing={1} justifyContent="center">
          <Typography sx={{ fontSize: '11px', opacity: 0.5 }}>
            {accountBalance?.curr1?.value || '0'} available
          </Typography>
          <Typography sx={{ fontSize: '11px', opacity: 0.3 }}>•</Typography>
          <Typography sx={{ fontSize: '11px', opacity: 0.5, color: theme.palette.warning.main }}>
            {accountBalance?.curr2?.value || Math.max(0, Number(accountTotalXrp || 0) - Number(accountBalance?.curr1?.value || 0)) || '0'} reserved
          </Typography>
        </Stack>
      </Box>

      {/* Accounts */}
      <Box sx={{
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`
      }}>
          <Button
            fullWidth
            onClick={() => setShowAllAccounts(!showAllAccounts)}
            sx={{
              py: 1,
              px: 2,
              justifyContent: 'space-between',
              textTransform: 'none',
              fontSize: '12px',
              fontWeight: 500,
              color: theme.palette.text.primary,
              borderRadius: 0,
              '&:hover': {
                backgroundColor: alpha(theme.palette.text.primary, 0.04)
              }
            }}
          >
            <span>Accounts ({profiles.length})</span>
            <Box
              component="svg"
              sx={{
                width: 12,
                height: 12,
                transform: showAllAccounts ? 'rotate(180deg)' : 'rotate(0deg)',
                opacity: 0.4,
                transition: 'transform 0.2s'
              }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </Box>
          </Button>

          {showAllAccounts && (
            <Box sx={{
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.06)}`
            }}>
              {/* Compact Pagination */}
              {(() => {
                const totalPages = Math.ceil(profiles.length / walletsPerPage);
                return totalPages > 1 && (
                  <Box sx={{
                    px: 2,
                    py: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 1.5,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
                  }}>
                    <IconButton
                      size="small"
                      disabled={walletPage === 0}
                      onClick={() => setWalletPage(Math.max(0, walletPage - 1))}
                      sx={{
                        p: 0.4,
                        minWidth: 24,
                        height: 24,
                        opacity: walletPage === 0 ? 0.2 : 0.5,
                        '&:hover': { opacity: walletPage === 0 ? 0.2 : 0.8 }
                      }}
                    >
                      <Box component="svg" sx={{ width: 10, height: 10 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="15 18 9 12 15 6" />
                      </Box>
                    </IconButton>

                    <Typography sx={{
                      fontSize: '11px',
                      opacity: 0.45,
                      fontWeight: 400,
                      letterSpacing: '0.5px',
                      minWidth: 60,
                      textAlign: 'center'
                    }}>
                      {walletPage + 1} / {totalPages}
                    </Typography>

                    <IconButton
                      size="small"
                      disabled={walletPage >= totalPages - 1}
                      onClick={() => setWalletPage(Math.min(totalPages - 1, walletPage + 1))}
                      sx={{
                        p: 0.4,
                        minWidth: 24,
                        height: 24,
                        opacity: walletPage >= totalPages - 1 ? 0.2 : 0.5,
                        '&:hover': { opacity: walletPage >= totalPages - 1 ? 0.2 : 0.8 }
                      }}
                    >
                      <Box component="svg" sx={{ width: 10, height: 10 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="9 18 15 12 9 6" />
                      </Box>
                    </IconButton>
                  </Box>
                );
              })()}

              {/* Wallets list */}
              <Box sx={{
                maxHeight: '280px',
                overflowY: 'auto',
                py: 0.5,
                '&::-webkit-scrollbar': {
                  width: '3px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: alpha(theme.palette.text.primary, 0.08),
                  borderRadius: '3px',
                }
              }}>
                {(() => {
                  // Group accounts by activation status
                  const activeAccounts = [];
                  const inactiveAccounts = [];

                  profiles.forEach(profile => {
                    if (accountsActivation[profile.account] === false) {
                      inactiveAccounts.push(profile);
                    } else {
                      activeAccounts.push(profile);
                    }
                  });

                  // Sort each group by address
                  const sortByAddress = (a, b) => a.account.localeCompare(b.account);
                  activeAccounts.sort(sortByAddress);
                  inactiveAccounts.sort(sortByAddress);

                  // Combine: current account first, then active, then inactive
                  const currentAccount = profiles.find(p => p.account === accountLogin);
                  const otherActive = activeAccounts.filter(p => p.account !== accountLogin);
                  const sorted = [
                    ...(currentAccount ? [currentAccount] : []),
                    ...otherActive,
                    ...inactiveAccounts
                  ];

                  // Paginate
                  const startIndex = walletPage * walletsPerPage;
                  const paginatedProfiles = sorted.slice(startIndex, startIndex + walletsPerPage);

                  return paginatedProfiles.map((profile, index) => {
                const account = profile.account;
                const isCurrent = account === accountLogin;
                const isInactive = accountsActivation[account] === false;

                return (
                  <Box
                    key={account}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isCurrent) {
                        onAccountSwitch(account);
                      }
                    }}
                    sx={{
                      py: 0.9,
                      px: 2,
                      cursor: isCurrent ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isCurrent ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                      borderLeft: isCurrent ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                      transition: 'background 0.15s',
                      '&:hover': !isCurrent ? {
                        background: alpha(theme.palette.text.primary, 0.05)
                      } : {}
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        flexShrink: 0,
                        background: isInactive ? alpha(theme.palette.warning.main, 0.5) : '#22c55e'
                      }} />
                      <Typography sx={{
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        fontWeight: 400,
                        color: isCurrent ? theme.palette.text.primary : theme.palette.text.secondary
                      }}>
                        {truncateAccount(account, 7)}
                      </Typography>
                      {isCurrent && (
                        <Typography sx={{
                          fontSize: '10px',
                          fontWeight: 500,
                          color: '#22c55e'
                        }}>
                          active
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                );
                  });
                })()}
              </Box>
            </Box>
          )}
      </Box>


      {/* Actions */}
      <Box sx={{
        p: 1,
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        display: 'flex',
        gap: 0.5
      }}>
        {onCreateNewAccount && profiles.length < 25 && (
          <Button
            onClick={onCreateNewAccount}
            size="small"
            sx={{
              flex: 1,
              py: 0.5,
              borderRadius: '8px',
              color: '#4285f4',
              fontSize: '11px',
              textTransform: 'none',
              fontWeight: 400,
              '&:hover': {
                background: alpha('#4285f4', 0.04)
              }
            }}
          >
            + Account
          </Button>
        )}

        <Button
          onClick={onLogout}
          size="small"
          sx={{
            flex: profiles.length >= 25 ? 1 : 'none',
            px: profiles.length >= 25 ? 0 : 1.5,
            py: 0.5,
            borderRadius: '8px',
            color: 'text.secondary',
            fontSize: '11px',
            textTransform: 'none',
            fontWeight: 400,
            '&:hover': {
              color: 'error.main',
              background: alpha(theme.palette.error.main, 0.04)
            }
          }}
        >
          Logout
        </Button>
      </Box>
    </>
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
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  // Create a simple theme object to replace MUI's useTheme
  const theme = {
    palette: {
      divider: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
      success: { main: '#4caf50' },
      warning: { main: '#ff9800', dark: '#f57c00' },
      error: { main: '#f44336' },
      primary: { main: '#4285f4' },
      text: { primary: isDark ? '#fff' : '#000', secondary: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' },
      background: { default: isDark ? '#000000' : '#fff', paper: isDark ? '#0d0d0d' : '#fff' },
      action: { hover: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', disabled: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.26)' }
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
  const [showBackupPassword, setShowBackupPassword] = useState(false);
  const [backupPassword, setBackupPassword] = useState('');
  const [showBackupPasswordVisible, setShowBackupPasswordVisible] = useState(false);
  const [backupAgreed, setBackupAgreed] = useState(false);


  // Device Password handlers
  const handleDevicePasswordSubmit = async () => {
    if (devicePasswordMode === 'create') {
      if (devicePassword.length < 8) {
        setError('Password must be at least 8 characters');
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
      // Store the password for future use
      await walletStorage.storeWalletCredential(deviceId, password);

      // Generate 1 wallet
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
      const wallets = [walletData];

      setError(''); // Clear progress message

      // Update profiles
      const allProfiles = [...profiles];
      wallets.forEach(walletData => {
        const profile = { ...walletData, tokenCreatedAt: Date.now() };
        const exists = allProfiles.find(p => p.account === profile.account);
        if (!exists) {
          allProfiles.push(profile);
        } else {
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

      // Mark all wallets as needing backup
      wallets.forEach(w => {
        localStorage.setItem(`wallet_needs_backup_${w.address}`, 'true');
      });

      // Login with first wallet
      doLogIn(wallets[0], allProfiles);
      setStatus('success');

      // Close modal after delay to ensure UI updates
      setTimeout(() => {
        setOpenWalletModal(false);
        setOpen(false);  // Close the main modal
        setStatus('idle');
        setShowDeviceLogin(false);
        setError('');
        // Show backup reminder
        setTimeout(() => {
          openSnackbar('Wallet created! Remember to backup your seed phrase', 'warning');
        }, 1000);
      }, 800);
    } catch (err) {
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

      // Check if user already has wallets loaded (from AppContext auto-load)
      const walletId = `${payload.provider || 'google'}_${payload.sub || payload.id}`;
      const hasPassword = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);

      if (hasPassword && profiles.length > 0) {
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

      devLog('processGoogleConnect result:', result);

      if (result.requiresPassword) {
        devLog('❌ Password required - showing setup dialog');
        // Store token temporarily for password setup
        sessionStorage.setItem('oauth_temp_token', jwtToken);
        sessionStorage.setItem('oauth_temp_provider', 'google');
        sessionStorage.setItem('oauth_temp_user', JSON.stringify(payload));
        sessionStorage.setItem('oauth_action', result.action);
        // No backend data to store - wallets are local only

        // Show password setup dialog
        setShowOAuthPasswordSetup(true);
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
                provider: profile.provider,
                provider_id: profile.id,
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
      devError('Error processing Google connect:', error);
      openSnackbar('Failed to process Google connect', 'error');
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
        setShowOAuthPasswordSetup(true);
      } else if (result.wallet) {
        localStorage.setItem('jwt', data.token);
        localStorage.setItem('authMethod', 'email');
        await doLogIn(result.wallet.account, result.wallet.publicKey, result.wallet.seed, 'oauth');
        setOpen(false);
      }
    } catch (error) {
      devError('Verify code error:', error);
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
      if (oauthPassword.length < 8) {
        setOAuthPasswordError('Password must be at least 8 characters');
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
      setStatus('discovering');

      // Store for future use
      await walletStorage.storeWalletCredential(deviceId, password);

      // Generate 1 wallet
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
      const wallets = [walletData];

      setError(''); // Clear progress message

      // Check if any of these wallets already exist in profiles
      const existingWallet = profiles.find(p =>
        wallets.some(w => w.account === p.account)
      );

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
        isAdditional: existingWallet !== undefined,
        totalWallets: wallets.length
      });

      // Login with first wallet
      doLogIn(wallets[0], allProfiles);
      setStatus('success');

      // Close modal after delay to ensure UI updates
      setTimeout(() => {
        setOpenWalletModal(false);
        setOpen(false);  // Close the main modal
        setStatus('idle');
        setShowDeviceLogin(false);
        setError('');
        openSnackbar('Wallet created successfully!', 'success');
      }, 800);
    } catch (err) {
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

  // Debug function to delete IndexedDB
  const handleDeleteIndexedDB = async () => {
    if (!confirm('WARNING: This will delete all encrypted wallet data from IndexedDB. Are you sure?')) {
      return;
    }
    try {
      await indexedDB.deleteDatabase('XRPLWalletDB');
      openSnackbar('IndexedDB deleted. Please refresh the page.', 'success');
    } catch (error) {
      openSnackbar('Failed to delete IndexedDB: ' + error.message, 'error');
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

    if (oauthToken && oauthProvider) {
      // User came from OAuth and needs password setup
      // BUT: Only show if user is not already logged in
      if (!accountProfile) {
        // Redirect to dedicated setup page instead of showing modal
        window.location.href = '/wallet-setup';
        return;
      } else {
        sessionStorage.removeItem('oauth_temp_token');
        sessionStorage.removeItem('oauth_temp_provider');
        sessionStorage.removeItem('oauth_temp_user');
        sessionStorage.removeItem('oauth_action');
      }
    } else if (sessionStorage.getItem('wallet_modal_open') === 'true') {
      // Just reopening wallet modal after OAuth redirect
      // BUT: Only if user is NOT already logged in
      sessionStorage.removeItem('wallet_modal_open');
      if (!accountProfile) {
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
        devLog('Google OAuth response received');
        const res = await fetch('https://api.xrpl.to/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: response.credential })
        });

        const data = await res.json();
        if (data.token) {
          // Store for processing
          sessionStorage.setItem('google_jwt_token', data.token);
          sessionStorage.setItem('google_user_data', JSON.stringify(data.user));
          // Trigger re-render to process
          window.dispatchEvent(new Event('google-connect-success'));
        }
      } catch (error) {
        devError('Google auth error:', error);
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
      const token = sessionStorage.getItem('google_jwt_token');
      const userStr = sessionStorage.getItem('google_user_data');
      if (token) {
        sessionStorage.removeItem('google_jwt_token');
        sessionStorage.removeItem('google_user_data');
        const userData = userStr ? JSON.parse(userStr) : null;
        await processGoogleConnect(token, userData);
      }
    };

    window.addEventListener('google-connect-success', handleGoogleSuccess);

    return () => {
      window.removeEventListener('google-connect-success', handleGoogleSuccess);
    };
  }, [accountProfile]); // Re-run when accountProfile changes to clean up OAuth data

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
        // Show password input for wallet creation
        setPendingDeviceId(registrationResponse.id);
        setDevicePasswordMode('create');
        setShowDevicePasswordInput(true);
        setStatus('idle');
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
        // Always ask for password on authentication for security
        setPendingDeviceId(authResponse.id);
        setDevicePasswordMode('verify');
        setShowDevicePasswordInput(true);
        setStatus('idle');
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

      if (!storedPassword || storedPassword !== newAccountPassword) {
        openSnackbar('Incorrect password', 'error');
        setNewAccountPassword('');
        return;
      }

      // Password verified - create new wallet with SAME auth type
      const wallet = generateRandomWallet();

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

      // Mark as needing backup
      localStorage.setItem(`wallet_needs_backup_${wallet.address}`, 'true');

      // Close and switch
      setShowNewAccountFlow(false);
      setNewAccountPassword('');
      setOpen(false);
      requestAnimationFrame(() => {
        doLogIn(walletData, allProfiles);
      });

      openSnackbar(`Account #${allProfiles.length} created`, 'success');
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
  return (
    <div style={style}>
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
          'flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200',
          accountProfile
            ? 'h-8 min-w-[120px] px-4'
            : 'h-8 px-5',
          isDark
            ? accountProfile
              ? 'bg-white/[0.06] text-white hover:bg-white/[0.1]'
              : 'border border-white/[0.08] text-white hover:bg-white/[0.06]'
            : accountProfile
              ? 'bg-gray-100 text-gray-900 hover:bg-gray-200/80'
              : 'border border-gray-200 text-gray-700 hover:bg-gray-100/80'
        )}
        title={accountProfile ? 'Account Details' : 'Connect Wallet'}
      >
        {accountProfile ? (
          <>
            <div className={cn(
              'h-2 w-2 rounded-full',
              accountsActivation[accountLogin] === false ? 'bg-red-500' : 'bg-emerald-400'
            )} />
            <span className="font-mono text-[13px]">
              {truncateAccount(accountLogin, 6)}
            </span>
          </>
        ) : (
          <span className="text-[13px]">Connect</span>
        )}
      </button>

      <Dialog
          open={open || (openWalletModal && !accountProfile)}
          onClose={() => {
            setOpen(false);
            if (!accountProfile) setOpenWalletModal(false);
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
          hideBackdrop={true}
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
            <StyledPopoverPaper isDark={isDark}>
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
                  />
                ) : showNewAccountFlow ? (
                  <Box sx={{ p: 3 }}>
                    <Stack spacing={2.5}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6" sx={{ fontWeight: 400 }}>
                          Create New Account
                        </Typography>
                        <Button size="small" onClick={() => { setShowNewAccountFlow(false); setNewAccountPassword(''); }}>
                          ×
                        </Button>
                      </Box>

                      <Typography variant="body2" sx={{ fontSize: '14px', opacity: 0.7, color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>
                        Creating account #{profiles.length + 1}
                      </Typography>

                      <Alert severity="info" sx={{ py: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '13px' }}>
                          Enter your password to create a new account. The new account will use the same password.
                        </Typography>
                      </Alert>

                      <TextField
                        fullWidth
                        type={showNewAccountPassword ? 'text' : 'password'}
                        label="Password"
                        placeholder="Enter your password"
                        value={newAccountPassword}
                        onChange={(e) => setNewAccountPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && newAccountPassword && handleCreateNewAccount()}
                        autoFocus
                        autoComplete="off"
                        isDark={isDark}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() => setShowNewAccountPassword(!showNewAccountPassword)}
                                edge="end"
                              >
                                {showNewAccountPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />

                      <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => { setShowNewAccountFlow(false); setNewAccountPassword(''); }}
                          sx={{
                            py: 0.75,
                            fontSize: '13px',
                            textTransform: 'none',
                            borderRadius: '8px',
                            fontWeight: 400
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={handleCreateNewAccount}
                          disabled={!newAccountPassword}
                          sx={{
                            py: 0.75,
                            fontSize: '13px',
                            textTransform: 'none',
                            borderRadius: '8px',
                            fontWeight: 400
                          }}
                        >
                          Create Account
                        </Button>
                      </Box>
                    </Stack>
                  </Box>
                ) : (
                  <Box sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6" sx={{ fontWeight: 500 }}>
                          Backup Options
                        </Typography>
                        <IconButton size="small" onClick={() => {
                          setShowSeedDialog(false);
                          setSeedAuthStatus('idle');
                          setDisplaySeed('');
                          setSeedBlurred(true);
                          setSeedWarningAgreed(false);
                          setBackupMode(null);
                          setSeedPassword('');
                        }} sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}>
                          <XIcon size={16} />
                        </IconButton>
                      </Box>

                      {seedAuthStatus === 'select-mode' && (
                        <Box>
                          <Typography variant="body2" sx={{ mb: 2, fontSize: '13px', color: theme.palette.text.secondary }}>
                            Choose your backup method:
                          </Typography>
                          <Stack spacing={1.5}>
                            <Box
                              onClick={() => {
                                setBackupMode('seed');
                                setSeedAuthStatus('password-required');
                              }}
                              sx={{
                                p: 2,
                                cursor: 'pointer',
                                borderRadius: '10px',
                                border: `1.5px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                '&:hover': {
                                  borderColor: theme.palette.primary.main,
                                  backgroundColor: alpha(theme.palette.primary.main, 0.04)
                                }
                              }}
                            >
                              <Typography sx={{ fontWeight: 400, fontSize: '13px', color: theme.palette.primary.main, display: 'block' }}>
                                View Current Seed
                              </Typography>
                              <Typography sx={{ fontSize: '11px', color: theme.palette.text.secondary, mt: 0.5, display: 'block' }}>
                                Wallet {profiles.findIndex(p => p.account === accountProfile?.account) + 1} only
                              </Typography>
                            </Box>
                            <Box
                              onClick={() => {
                                setShowSeedDialog(false);
                                handleDownloadBackup();
                              }}
                              sx={{
                                p: 2,
                                cursor: 'pointer',
                                borderRadius: '10px',
                                backgroundColor: theme.palette.primary.main,
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.9)
                                }
                              }}
                            >
                              <Typography sx={{ fontWeight: 400, fontSize: '13px', color: '#fff', display: 'block' }}>
                                Download Full Backup
                              </Typography>
                              <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', mt: 0.5, display: 'block' }}>
                                All {profiles.length} wallets encrypted
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      )}

                      {seedAuthStatus === 'password-required' && backupMode === 'seed' && (
                        <Box sx={{ p: 1 }}>
                          <Alert severity="warning" icon={false} sx={{ mb: 2, py: 1 }}>
                            <Box sx={{ display: 'block' }}>
                              <Typography sx={{ fontWeight: 500, fontSize: '12px', display: 'block', mb: 0.5, color: '#b45309' }}>
                                Keep your seed safe
                              </Typography>
                              <Typography sx={{ fontSize: '11px', display: 'block', lineHeight: 1.4, color: theme.palette.text.secondary }}>
                                Your seed is stored locally. We cannot recover it. Never share it with anyone.
                              </Typography>
                            </Box>
                          </Alert>

                          <Box sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1,
                            mb: 2,
                            p: 1.2,
                            borderRadius: '8px',
                            border: `1.5px solid ${seedWarningAgreed ? theme.palette.primary.main : alpha(theme.palette.divider, 0.3)}`,
                            cursor: 'pointer',
                            backgroundColor: seedWarningAgreed ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
                            '&:hover': {
                              borderColor: theme.palette.primary.main
                            }
                          }}
                          onClick={() => setSeedWarningAgreed(!seedWarningAgreed)}
                          >
                            <Box sx={{
                              width: 16,
                              height: 16,
                              borderRadius: '3px',
                              border: `2px solid ${seedWarningAgreed ? theme.palette.primary.main : alpha(theme.palette.divider, 0.4)}`,
                              background: seedWarningAgreed ? theme.palette.primary.main : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              mt: 0.2
                            }}>
                              {seedWarningAgreed && (
                                <Check size={12} color="white" />
                              )}
                            </Box>
                            <Typography sx={{ fontSize: '11px', lineHeight: 1.4, color: theme.palette.text.primary }}>
                              I understand and will keep my seed safe
                            </Typography>
                          </Box>

                          <Typography sx={{ mb: 1, fontSize: '11px', color: theme.palette.text.secondary }}>
                            Enter password to view seed
                          </Typography>
                          <TextField
                            fullWidth
                            type={showSeedPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={seedPassword}
                            onChange={(e) => setSeedPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && seedWarningAgreed && handleSeedPasswordSubmit()}
                            autoFocus
                            size="small"
                            autoComplete="off"
                            isDark={isDark}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    size="small"
                                    onClick={() => setShowSeedPassword(!showSeedPassword)}
                                    edge="end"
                                  >
                                    {showSeedPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            }}
                          />
                          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => {
                                setShowSeedDialog(false);
                                setSeedAuthStatus('idle');
                                setSeedPassword('');
                                setShowSeedPassword(false);
                                setSeedWarningAgreed(false);
                              }}
                              sx={{
                                fontSize: '13px',
                                py: 0.5,
                                px: 2
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={handleSeedPasswordSubmit}
                              disabled={!seedPassword || !seedWarningAgreed}
                              sx={{
                                fontSize: '13px',
                                py: 0.5,
                                px: 2
                              }}
                            >
                              View Seed
                            </Button>
                          </Box>
                        </Box>
                      )}

                      {seedAuthStatus === 'success' && (
                        <>
                          <Alert severity="info" sx={{ mb: 1.5 }}>
                            <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 400 }}>
                              Seed for wallet {profiles.findIndex(p => p.account === accountProfile?.account) + 1} of {profiles.length}
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '11px', opacity: 0.8, mt: 0.3 }}>
                              This only backs up one wallet. Use download backup for all {profiles.length} wallets.
                            </Typography>
                          </Alert>

                          <Box sx={{
                            py: 1,
                            px: 1,
                            borderRadius: 1,
                            background: alpha(theme.palette.background.paper, 0.8),
                            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            wordBreak: 'break-all',
                            lineHeight: 1.5,
                            filter: seedBlurred ? 'blur(5px)' : 'none',
                            cursor: seedBlurred ? 'pointer' : 'default',
                            userSelect: seedBlurred ? 'none' : 'auto'
                          }}
                          onClick={seedBlurred ? () => setSeedBlurred(false) : undefined}
                          title={seedBlurred ? 'Click to reveal seed' : ''}
                          >
                            {displaySeed}
                          </Box>

                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => {
                                navigator.clipboard.writeText(displaySeed).then(() => {
                                  openSnackbar('Seed copied to clipboard', 'success');
                                });
                              }}
                              sx={{ fontSize: '11px', py: 0.5, px: 2 }}
                            >
                              Copy Seed
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => setSeedBlurred(!seedBlurred)}
                              sx={{ fontSize: '11px', py: 0.5, px: 2 }}
                            >
                              {seedBlurred ? 'Show' : 'Hide'}
                            </Button>
                          </Stack>
                        </>
                      )}

                      {seedAuthStatus === 'error' && (
                        <Alert severity="error">
                          Authentication failed. Please try again.
                        </Alert>
                      )}
                    </Stack>
                  </Box>
                )}
              </>
            ) : (
              // WalletConnect Modal Content with full styling
              <Box sx={{
                borderRadius: '12px',
                background: theme.palette.background.paper,
                border: 'none',
                boxShadow: 'none',
                overflow: 'hidden'
              }}>
                {/* Header */}
                <Box sx={{
                  padding: theme.spacing(2, 2.5),
                  background: 'transparent',
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
                }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" sx={{
                      fontWeight: 400,
                      fontSize: '18px',
                      color: theme.palette.text.primary
                    }}>
                      Connect Wallet
                    </Typography>
                    <Box
                      onClick={() => { setOpenWalletModal(false); setShowDeviceLogin(false); }}
                      sx={{
                        cursor: 'pointer',
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '12px',
                        color: theme.palette.text.secondary,
                        '&:hover': {
                          color: theme.palette.text.primary,
                          backgroundColor: alpha(theme.palette.text.primary, 0.04)
                        }
                      }}
                    >
                      <XIcon size={20} />
                    </Box>
                  </Stack>
                </Box>

                {/* Content */}
                <Box sx={{
                  padding: theme.spacing(2.5, 2.5, 1.5, 2.5),
                  background: 'transparent'
                }}>
                  {!showDeviceLogin ? (
                    <>
                      {/* Social Options */}
                      <div className="flex flex-col gap-2">
                        {/* Google */}
                        <button
                          onClick={handleGoogleConnect}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-medium transition-all duration-200',
                            isDark
                              ? 'bg-white/[0.04] text-white hover:bg-white/[0.08]'
                              : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                          )}
                        >
                          <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Google
                        </button>

                        {/* Email */}
                        <button
                          onClick={handleEmailConnect}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-medium transition-all duration-200',
                            isDark
                              ? 'bg-white/[0.04] text-white hover:bg-white/[0.08]'
                              : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                          )}
                        >
                          <Mail size={18} className="opacity-60" />
                          Email
                        </button>

                        {/* Twitter/X */}
                        <button
                          onClick={handleXConnect}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-medium transition-all duration-200',
                            isDark
                              ? 'bg-white/[0.04] text-white hover:bg-white/[0.08]'
                              : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                          )}
                        >
                          <XIcon size={18} className="opacity-60" />
                          Twitter
                        </button>

                        {/* Discord */}
                        <button
                          onClick={handleDiscordConnect}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-medium transition-all duration-200',
                            isDark
                              ? 'bg-white/[0.04] text-white hover:bg-white/[0.08]'
                              : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                          )}
                        >
                          <svg className="h-[18px] w-[18px] opacity-60" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                          </svg>
                          Discord
                        </button>
                      </div>

                      {/* Passkeys - Most secure */}
                      <button
                        onClick={() => setShowDeviceLogin(true)}
                        className="mt-3 mb-3 flex w-full items-center justify-center gap-2.5 rounded-xl bg-primary px-4 py-3.5 text-[14px] font-medium text-white transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25"
                      >
                        <Shield size={17} />
                        Passkeys
                      </button>

                      {/* Email Verification UI */}
                      {showEmailVerification && (
                        <Box sx={{ mt: 2, p: 2, background: alpha(theme.palette.background.default, 0.4), borderRadius: '12px' }}>
                          {emailStep === 'email' ? (
                            <>
                              <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px' }}>
                                Enter your email address
                              </Typography>
                              <TextField
                                fullWidth
                                type="email"
                                placeholder="your@email.com"
                                value={verificationEmail}
                                onChange={(e) => setVerificationEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleEmailContinue()}
                                autoFocus
                                size="small"
                                sx={{ mb: 1.5 }}
                              />
                              <Stack direction="row" spacing={1}>
                                <Button
                                  variant="outlined"
                                  fullWidth
                                  onClick={handleEmailContinue}
                                  sx={{
                                    py: 1,
                                    fontSize: '14px',
                                    textTransform: 'none',
                                    borderRadius: '12px'
                                  }}
                                >
                                  Continue
                                </Button>
                                <Button
                                  variant="outlined"
                                  onClick={() => setShowEmailVerification(false)}
                                  sx={{
                                    py: 1,
                                    fontSize: '14px',
                                    textTransform: 'none',
                                    borderRadius: '12px'
                                  }}
                                >
                                  Cancel
                                </Button>
                              </Stack>
                            </>
                          ) : emailStep === 'code' ? (
                            <>
                              <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px' }}>
                                Enter the 6-digit code sent to {verificationEmail}
                              </Typography>
                              <TextField
                                fullWidth
                                type="text"
                                placeholder="000000"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                onKeyDown={(e) => e.key === 'Enter' && handleVerifyEmailCode()}
                                autoFocus
                                size="small"
                                sx={{ mb: 1.5 }}
                              />
                              <Stack direction="row" spacing={1}>
                                <Button
                                  variant="outlined"
                                  fullWidth
                                  onClick={handleVerifyEmailCode}
                                  sx={{
                                    py: 1,
                                    fontSize: '14px',
                                    textTransform: 'none',
                                    borderRadius: '12px'
                                  }}
                                >
                                  Verify
                                </Button>
                                <Button
                                  variant="outlined"
                                  onClick={() => setEmailStep('email')}
                                  sx={{
                                    py: 1,
                                    fontSize: '14px',
                                    textTransform: 'none',
                                    borderRadius: '12px'
                                  }}
                                >
                                  Back
                                </Button>
                              </Stack>
                            </>
                          ) : (
                            <>
                              <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px' }}>
                                Enter your password for {verificationEmail}
                              </Typography>
                              <TextField
                                fullWidth
                                type="password"
                                placeholder="Password"
                                value={emailPassword}
                                onChange={(e) => setEmailPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleEmailPasswordLogin()}
                                autoFocus
                                size="small"
                                sx={{ mb: 1.5 }}
                              />
                              <Stack direction="row" spacing={1}>
                                <Button
                                  variant="outlined"
                                  fullWidth
                                  onClick={handleEmailPasswordLogin}
                                  sx={{
                                    py: 1,
                                    fontSize: '14px',
                                    textTransform: 'none',
                                    borderRadius: '12px'
                                  }}
                                >
                                  Login
                                </Button>
                                <Button
                                  variant="outlined"
                                  onClick={() => { setEmailStep('email'); setEmailPassword(''); }}
                                  sx={{
                                    py: 1,
                                    fontSize: '14px',
                                    textTransform: 'none',
                                    borderRadius: '12px'
                                  }}
                                >
                                  Back
                                </Button>
                              </Stack>
                            </>
                          )}
                        </Box>
                      )}

                      {/* Footer */}
                      <div className={cn(
                        'mt-2 border-t pt-3 pb-1 text-center',
                        isDark ? 'border-white/5' : 'border-gray-100'
                      )}>
                        <span className="text-[11px] opacity-40">
                          Encrypted and stored locally
                        </span>
                        <button
                          onClick={handleDeleteIndexedDB}
                          className="mt-1 block w-full text-[11px] text-red-500/50 hover:text-red-500"
                        >
                          [Debug] Clear IndexedDB
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Passkeys Connect Header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <Button
                          onClick={handleGoBack}
                          size="small"
                          sx={{
                            minWidth: 'auto',
                            px: 1.5,
                            py: 0.5,
                            fontSize: '13px',
                            borderRadius: '8px',
                            color: theme.palette.primary.main,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) }
                          }}
                        >
                          <ArrowLeft size={14} style={{ marginRight: 4 }} /> Back
                        </Button>
                        <Typography sx={{ fontWeight: 500, color: theme.palette.primary.main, fontSize: '15px' }}>
                          Key Authentication
                        </Typography>
                      </Box>

                      {error && (
                        <Alert
                          severity={error.includes('Creating wallets') ? "info" : "warning"}
                          icon={error.includes('Creating wallets') ? undefined : <AlertCircle size={18} />}
                          sx={{ mb: 2, py: 1.5 }}
                        >
                          {error.includes('Creating wallets') ? (
                            <Typography variant="body2">
                              {error}
                            </Typography>
                          ) : (
                            <Stack spacing={0.5}>
                              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '13px' }}>
                                Hardware Security Required
                              </Typography>
                              <Typography variant="body2" sx={{ fontSize: '12px', opacity: 0.9, lineHeight: 1.4 }}>
                                {error}
                              </Typography>
                            </Stack>
                          )}
                        </Alert>
                      )}

                      {/* Password Input for Device Connect */}
                      {showDevicePasswordInput && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="body2" sx={{ mb: 2, fontWeight: 400 }}>
                            {devicePasswordMode === 'create'
                              ? 'Create a password to secure your wallet'
                              : 'Enter your password to access your wallet'}
                          </Typography>
                          <TextField
                            fullWidth
                            type={showDevicePassword ? 'text' : 'password'}
                            value={devicePassword}
                            onChange={(e) => { setDevicePassword(e.target.value); setError(''); }}
                            onKeyDown={(e) => e.key === 'Enter' && handleDevicePasswordSubmit()}
                            placeholder="Password"
                            autoFocus
                            sx={{ mb: 2 }}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    onClick={() => setShowDevicePassword(!showDevicePassword)}
                                    edge="end"
                                  >
                                    {showDevicePassword ? <VisibilityOff /> : <Visibility />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            }}
                          />
                          {devicePasswordMode === 'create' && (
                            <TextField
                              fullWidth
                              type={showDevicePassword ? 'text' : 'password'}
                              value={devicePasswordConfirm}
                              onChange={(e) => { setDevicePasswordConfirm(e.target.value); setError(''); }}
                              onKeyDown={(e) => e.key === 'Enter' && handleDevicePasswordSubmit()}
                              placeholder="Confirm Password"
                              sx={{ mb: 2 }}
                            />
                          )}
                          {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                          )}
                          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => {
                                setShowDevicePasswordInput(false);
                                setDevicePassword('');
                                setDevicePasswordConfirm('');
                                setStatus('idle');
                                setError('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={handleDevicePasswordSubmit}
                              disabled={devicePasswordMode === 'create' ? !devicePassword || !devicePasswordConfirm : !devicePassword}
                            >
                              {devicePasswordMode === 'create' ? 'Create Wallet' : 'Authenticate'}
                            </Button>
                          </Box>
                        </Box>
                      )}

                      {status === 'success' && walletInfo && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            🎉 {walletInfo.isAdditional ? `Device Wallets Accessed!` : `Device Wallets Created!`}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Wallets Available:</strong> {walletInfo.totalWallets} wallets
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Security:</strong> Deterministically generated from your device key
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Your wallet is secured by hardware authentication.
                          </Typography>
                        </Alert>
                      )}

                      {isLoadingDeps && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography>Loading...</Typography>
                            <Typography variant="body2">Loading security modules...</Typography>
                          </Box>
                        </Alert>
                      )}

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Button
                          variant="contained"
                          size="large"
                          fullWidth
                          onClick={handleAuthenticate}
                          disabled={status !== 'idle' || isLoadingDeps}
                          sx={{
                            py: 1,
                            fontSize: '14px',
                            fontWeight: 500,
                            background: 'transparent',
                            '&:hover': {
                              background: 'transparent'
                            }
                          }}
                        >
                          {status === 'authenticating' ? 'Authenticating...' :
                           status === 'discovering' ? 'Discovering...' :
                           status === 'creating' ? 'Creating Wallets...' :
                           'Sign In (Existing Key)'}
                        </Button>

                        <Button
                          variant="outlined"
                          size="large"
                          fullWidth
                          onClick={handleRegister}
                          disabled={status !== 'idle' || isLoadingDeps}
                          sx={{
                            py: 1,
                            fontSize: '14px',
                            fontWeight: 500,
                            borderColor: theme.palette.warning.main,
                            color: theme.palette.warning.main,
                            '&:hover': {
                              borderColor: theme.palette.warning.dark,
                              backgroundColor: alpha(theme.palette.warning.main, 0.08)
                            }
                          }}
                        >
                          {status === 'registering' ? 'Creating...' : 'Create New Key'}
                        </Button>

                        <Typography variant="caption" sx={{
                          textAlign: 'center',
                          color: 'text.secondary',
                          mt: 1,
                          fontSize: '11px'
                        }}>
                          Hardware Secured
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </Box>
            )}
            </StyledPopoverPaper>
          </DialogContent>
        </Dialog>

        {/* OAuth Password Setup Dialog */}
        <Dialog
          open={showOAuthPasswordSetup}
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
