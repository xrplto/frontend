import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Wallet as XRPLWallet, encodeSeed } from 'xrpl';

// Lazy load heavy dependencies
let startRegistration, startAuthentication, CryptoJS, scrypt, base64URLStringToBuffer;

// Development logging helper
const isDev = process.env.NODE_ENV === 'development';
const devLog = (...args) => isDev && console.log(...args);
const devError = (...args) => isDev && console.error(...args);

// Material
import {
  alpha,
  styled,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  Link,
  MenuItem,
  Dialog,
  DialogContent,
  Stack,
  Tooltip,
  Typography,
  useTheme,
  Chip,
  Fade
} from '@mui/material';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import { Visibility, VisibilityOff, LockOutlined, SecurityOutlined, Fingerprint, Google, X, Email } from '@mui/icons-material';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Translation removed - not using i18n

// Utils
import { getHashIcon } from 'src/utils/formatters';
import { EncryptedWalletStorage } from 'src/utils/encryptedWalletStorage';

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

const ActiveIndicator = styled(Box)(({ theme }) => ({
  width: 6,
  height: 6,
  borderRadius: '50%',
  flexShrink: 0,
  background: theme.palette.success.main
}));

const TokenImage = styled(Image)(({ theme }) => ({
  borderRadius: '50%',
  overflow: 'hidden'
}));

const StyledPopoverPaper = styled(Box)(({ theme }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  borderRadius: 10,
  boxShadow: theme.palette.mode === 'dark'
    ? '0 8px 32px rgba(0,0,0,0.4)'
    : '0 4px 24px rgba(0,0,0,0.08)',
  overflow: 'hidden',
  position: 'relative'
}));

const BalanceCard = styled(Card)(({ theme }) => ({
  background: 'transparent',
  border: 'none',
  borderRadius: 8,
  boxShadow: 'none'
}));

const ReserveCard = styled(Box)(({ theme }) => ({
  background: 'transparent',
  border: 'none',
  borderRadius: 8,
  padding: theme.spacing(2)
}));

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
      <Box sx={{ p: 2.5 }}>
        <Stack spacing={2} alignItems="center">
          {/* Header */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 500, mb: 0.5 }}>
              Download Full Wallet Backup
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', opacity: 0.7 }}>
              Export all {profiles.length} wallet{profiles.length !== 1 ? 's' : ''} in a single encrypted file
            </Typography>
          </Box>

          {/* Icon */}
          <Box sx={{ py: 0.5 }}>
            <Box component="svg" sx={{ width: 40, height: 40, opacity: 0.3 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              <path d="M12 11v6m0 0l-2-2m2 2l2-2"/>
            </Box>
          </Box>

          {/* Warning */}
          <Alert severity="warning" sx={{ maxWidth: 350 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 0.5 }}>
              ⚠️ Critical Security Information
            </Typography>
            <Typography sx={{ fontSize: '0.7rem' }}>
              This file contains all {profiles.length} wallet seeds. Anyone with this file and password can access ALL your funds. Never share it.
            </Typography>
          </Alert>

          {/* Acknowledgment */}
          <Box sx={{ maxWidth: 350, width: '100%' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={backupAgreed}
                  onChange={(e) => setBackupAgreed(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography sx={{ fontSize: '0.75rem' }}>
                  I understand this backup file is my responsibility. XRPL.to cannot recover it, and I will never share it.
                </Typography>
              }
            />
          </Box>

          {/* Password Input */}
          <TextField
            type={showBackupPasswordVisible ? 'text' : 'password'}
            value={backupPassword}
            onChange={(e) => setBackupPassword(e.target.value)}
            placeholder="Enter your wallet password"
            fullWidth
            disabled={!backupAgreed}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && backupPassword && backupAgreed) {
                processBackupDownload();
              }
            }}
            sx={{ maxWidth: 300 }}
            InputProps={{
              sx: { fontSize: '0.9rem' },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowBackupPasswordVisible(!showBackupPasswordVisible)}
                    edge="end"
                  >
                    {showBackupPasswordVisible ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          {/* Actions */}
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              size="small"
              onClick={processBackupDownload}
              disabled={!backupPassword || !backupAgreed}
              sx={{ fontSize: '0.8rem', py: 0.6, px: 2 }}
            >
              Download Backup
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
              sx={{ fontSize: '0.8rem', py: 0.6, px: 2 }}
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
      {/* Compact Header */}
      <Box sx={{
        p: 1.4,
        background: 'transparent',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={0.8} alignItems="center">
            <Box sx={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              // Always green for instant display
              background: theme.palette.success.main
            }} />
            <Typography sx={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              fontWeight: 500,
              opacity: 0.9
            }}>
              {truncateAccount(accountLogin, 6)}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            {needsBackup && (
              <Typography
                onClick={onBackupSeed}
                sx={{
                  fontSize: '0.65rem',
                  color: theme.palette.warning.main,
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                needs backup
              </Typography>
            )}
            <IconButton
              size="small"
              onClick={onClose}
              sx={{
                p: 0.25,
                opacity: 0.4,
                '&:hover': { opacity: 1 }
              }}
            >
              <Box component="svg" sx={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </Box>
            </IconButton>
          </Stack>
        </Stack>
      </Box>

      {/* Streamlined Balance */}
      <Box sx={{
        py: 1.5,
        px: 2,
        textAlign: 'center',
        background: 'transparent'
      }}>
        <Typography sx={{
          fontSize: '2rem',
          fontWeight: 300,
          lineHeight: 1.2,
          fontFamily: 'system-ui',
          color: theme.palette.text.primary
        }}>
          {accountTotalXrp || accountBalance?.curr1?.value || '0'}
        </Typography>
        <Typography sx={{
          fontSize: '0.7rem',
          letterSpacing: '0.5px',
          opacity: 0.5,
          fontWeight: 400,
          mt: 0.2
        }}>
          XRP BALANCE
        </Typography>

        {/* Backup Warning */}
        {needsBackup && (
          <Chip
            label="⚠ Backup needed"
            size="small"
            onClick={onBackupSeed}
            sx={{
              mt: 1,
              height: 20,
              fontSize: '0.6rem',
              backgroundColor: alpha(theme.palette.warning.main, 0.1),
              color: theme.palette.warning.main,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: alpha(theme.palette.warning.main, 0.15)
              }
            }}
          />
        )}

        {/* Action Buttons */}
        <Stack direction="row" spacing={0.8} justifyContent="center" sx={{ mt: 1.2 }}>
          <IconButton
            size="small"
            onClick={() => {
              navigator.clipboard.writeText(accountLogin);
              openSnackbar('Address copied', 'success');
            }}
            title="Copy address"
            sx={{
              p: 0.7,
              opacity: 0.7,
              '&:hover': { opacity: 1, backgroundColor: alpha(theme.palette.text.primary, 0.04) }
            }}
          >
            <Box component="svg" sx={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </Box>
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setShowQR(!showQR)}
            title="Show QR code"
            sx={{
              p: 0.7,
              opacity: 0.7,
              '&:hover': { opacity: 1, backgroundColor: alpha(theme.palette.text.primary, 0.04) }
            }}
          >
            <Box component="svg" sx={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
              <rect x="15" y="15" width="5" height="5"/>
              <rect x="11" y="11" width="2" height="2"/>
            </Box>
          </IconButton>
          <IconButton
            size="small"
            onClick={onBackupSeed}
            title="Backup options"
            sx={{
              p: 0.7,
              opacity: 0.7,
              '&:hover': { opacity: 1, backgroundColor: alpha(theme.palette.text.primary, 0.04) }
            }}
          >
            <Box component="svg" sx={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
            </Box>
          </IconButton>
        </Stack>

        {/* QR Code Display */}
        {showQR && (
          <Box sx={{
            mt: 1,
            p: 1,
            borderRadius: '8px',
            background: 'white',
            display: 'inline-block'
          }}>
            <Box
              component="img"
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${accountLogin}`}
              alt="QR Code"
              sx={{ display: 'block', width: 120, height: 120 }}
            />
          </Box>
        )}
      </Box>

      {/* Inline Stats */}
      <Box sx={{ px: 1.8, pb: 1.2 }}>
        <Stack direction="row" spacing={0.6} justifyContent="center">
          <Chip
            label={`${accountBalance?.curr1?.value || '0'} available`}
            size="small"
            sx={{
              height: 24,
              fontSize: '0.7rem',
              fontWeight: 400,
              backgroundColor: 'transparent',
              border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
              '& .MuiChip-label': { px: 1.2 }
            }}
          />
          <Chip
            label={`${accountBalance?.curr2?.value || Math.max(0, Number(accountTotalXrp || 0) - Number(accountBalance?.curr1?.value || 0)) || '0'} reserved`}
            size="small"
            sx={{
              height: 24,
              fontSize: '0.7rem',
              fontWeight: 400,
              backgroundColor: 'transparent',
              border: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`,
              color: theme.palette.warning.main,
              '& .MuiChip-label': { px: 1.2 }
            }}
          />
        </Stack>
      </Box>

      {/* Accounts Section - Collapsible */}
      {profiles.length > 1 && (
        <Box sx={{
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`
        }}>
          {/* Toggle Button */}
          <Button
            fullWidth
            onClick={() => setShowAllAccounts(!showAllAccounts)}
            sx={{
              py: 1.2,
              px: 1.8,
              justifyContent: 'space-between',
              textTransform: 'none',
              fontSize: '0.82rem',
              fontWeight: 400,
              color: theme.palette.text.secondary,
              borderRadius: 0,
              '&:hover': {
                backgroundColor: alpha(theme.palette.text.primary, 0.02)
              }
            }}
          >
            <span style={{ letterSpacing: '0.3px' }}>All Accounts ({profiles.length})</span>
            <Box
              component="svg"
              sx={{
                width: 12,
                height: 12,
                transform: showAllAccounts ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s ease-out',
                opacity: 0.6
              }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </Box>
          </Button>

          {/* Expandable Accounts List */}
          {showAllAccounts && (
            <Box sx={{
              backgroundColor: alpha(theme.palette.background.default, 0.3),
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`
            }}>
              {/* Compact Pagination */}
              {(() => {
                const totalPages = Math.ceil(profiles.length / walletsPerPage);
                return totalPages > 1 && (
                  <Box sx={{
                    px: 1.8,
                    py: 0.8,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 1.5,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`
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
                      fontSize: '0.7rem',
                      opacity: 0.45,
                      fontWeight: 500,
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
                      px: 1.8,
                      cursor: isCurrent ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isCurrent ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
                      borderLeft: isCurrent ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                      '&:hover': !isCurrent ? {
                        background: alpha(theme.palette.text.primary, 0.02)
                      } : {}
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        flexShrink: 0,
                        background: isInactive ? alpha(theme.palette.warning.main, 0.5) : '#22c55e'
                      }} />
                      <Stack spacing={0} sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={0.8} alignItems="center">
                          <Typography sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            fontWeight: isCurrent ? 500 : 400,
                            opacity: isCurrent ? 1 : 0.8
                          }}>
                            {truncateAccount(account, 8)}
                          </Typography>
                          {isCurrent && (
                            <Typography sx={{
                              fontSize: '0.55rem',
                              fontWeight: 500,
                              color: theme.palette.primary.main,
                              letterSpacing: '0.3px'
                            }}>
                              active
                            </Typography>
                          )}
                        </Stack>
                      </Stack>
                    </Stack>
                    {profile.xrp !== undefined && parseFloat(profile.xrp) > 0 && (
                      <Typography sx={{
                        fontSize: '0.65rem',
                        opacity: 0.4,
                        fontFamily: 'monospace',
                        ml: 'auto'
                      }}>
                        {parseFloat(profile.xrp).toFixed(0)} XRP
                      </Typography>
                    )}
                  </Box>
                );
                  });
                })()}
              </Box>
            </Box>
          )}
        </Box>
      )}


      {/* Bottom Actions - Compact */}
      <Box sx={{
        p: 1.2,
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        display: 'flex',
        gap: 0.6
      }}>
        {/* New Account Button */}
        {onCreateNewAccount && profiles.length < 25 && (
          <Button
            onClick={onCreateNewAccount}
            variant="text"
            size="small"
            sx={{
              flex: 1,
              py: 0.6,
              borderRadius: '6px',
              color: '#4285f4',
              fontSize: '0.7rem',
              textTransform: 'none',
              fontWeight: 400,
              '&:hover': {
                background: alpha('#4285f4', 0.06)
              }
            }}
          >
            + Account ({profiles.length}/25)
          </Button>
        )}

        {/* Logout */}
        <Button
          onClick={onLogout}
          variant="text"
          size="small"
          sx={{
            flex: profiles.length >= 25 ? 1 : 'none',
            px: profiles.length >= 25 ? 0 : 2,
            py: 0.6,
            borderRadius: '6px',
            color: theme.palette.text.secondary,
            fontSize: '0.7rem',
            textTransform: 'none',
            fontWeight: 400,
            '&:hover': {
              color: theme.palette.error.main,
              background: alpha(theme.palette.error.main, 0.06)
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
export const ConnectWallet = () => {
  const { setOpenWalletModal } = useContext(AppContext);
  const theme = useTheme();

  return (
    <Button
      variant="outlined"
      onClick={() => setOpenWalletModal(true)}
      fullWidth
      sx={{
        mt: 1,
        mb: 0.5,
        px: 2,
        py: 1.5,
        fontWeight: 400,
        borderRadius: '12px',
        borderWidth: '1.5px',
        borderColor: alpha(theme.palette.divider, 0.2),
        color: '#4285f4',
        backgroundColor: 'transparent',
        textTransform: 'none',
        fontSize: '0.95rem',
        '&:hover': {
          borderColor: '#4285f4',
          backgroundColor: alpha('#4285f4', 0.04),
          borderWidth: '1.5px'
        }
      }}
    >
      Connect Wallet
    </Button>
  );
};

export default function Wallet({ style, embedded = false, onClose, buttonOnly = false }) {
  const theme = useTheme();
  // Translation removed - using hardcoded English text
  // const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
  const [oauthPassword, setOAuthPassword] = useState('');
  const [oauthConfirmPassword, setOAuthConfirmPassword] = useState('');
  const [showOAuthPassword, setShowOAuthPassword] = useState(false);

  // Email verification states
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [emailStep, setEmailStep] = useState('email'); // 'email', 'code', or 'password'
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [oauthPasswordError, setOAuthPasswordError] = useState('');
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [walletStorage, setWalletStorage] = useState(new EncryptedWalletStorage());
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
        console.log('✅ Wallets already loaded - skipping OAuth callback processing');
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
          console.log('🔍 OAuth result.allWallets:', result.allWallets ? result.allWallets.length : 'NONE');

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

            console.log('✅ Setting', allProfiles.length, 'profiles for OAuth');
            setProfiles(allProfiles);
            await syncProfilesToIndexedDB(allProfiles);
            doLogIn(result.wallet, allProfiles);
          } else {
            console.log('❌ No allWallets - using single wallet');
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
    console.log('🔧 [DEBUG] handleOAuthPasswordSetup called');
    console.log('🔧 [DEBUG] importMethod:', importMethod);

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
    console.log('🔧 [DEBUG] Password validation passed');

    // Handle different import methods
    if (importMethod === 'import' && importFile) {
      console.log('🔧 [DEBUG] Redirecting to handleImportWallet');
      await handleImportWallet();
      return;
    } else if (importMethod === 'seed' && importSeed) {
      console.log('🔧 [DEBUG] Redirecting to handleImportSeed');
      await handleImportSeed();
      return;
    }

    setIsCreatingWallet(true);
    console.log('🔧 [DEBUG] Creating new wallet...');

    try {
      // Get OAuth data from session
      const token = sessionStorage.getItem('oauth_temp_token');
      const provider = sessionStorage.getItem('oauth_temp_provider');
      const userStr = sessionStorage.getItem('oauth_temp_user');
      const action = sessionStorage.getItem('oauth_action');

      console.log('🔧 [DEBUG] OAuth session data:');
      console.log('  - token:', token ? 'EXISTS' : 'MISSING');
      console.log('  - provider:', provider);
      console.log('  - action:', action);
      console.log('  - user:', userStr ? 'EXISTS' : 'MISSING');

      if (!provider || !userStr) {
        throw new Error('Missing OAuth data');
      }

      const user = JSON.parse(userStr);
      console.log('🔧 [DEBUG] Parsed user:', user);

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

      const walletData = {
        accountIndex: 0,
        account: wallet.address,
        address: wallet.address,
        publicKey: wallet.publicKey,
        wallet_type: 'oauth',
        provider: provider,
        provider_id: user.id,
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
        console.log('🔧 [DEBUG] Clearing OAuth session data NOW...');
        sessionStorage.removeItem('oauth_temp_token');
        sessionStorage.removeItem('oauth_temp_provider');
        sessionStorage.removeItem('oauth_temp_user');
        sessionStorage.removeItem('oauth_action');
        console.log('🔧 [DEBUG] OAuth session cleared. Verifying...');
        console.log('  - oauth_temp_token:', sessionStorage.getItem('oauth_temp_token'));
        console.log('  - oauth_temp_provider:', sessionStorage.getItem('oauth_temp_provider'));

        // Store permanent auth data
        await walletStorage.setSecureItem('jwt', token);
        await walletStorage.setSecureItem('authMethod', provider);
        await walletStorage.setSecureItem('user', user);

        // Store password for provider (enables auto-loading all wallets on re-login)
        const walletId = `${provider}_${user.id}`;
        await walletStorage.setSecureItem(`wallet_pwd_${walletId}`, oauthPassword);
        console.log('Password saved for provider:', walletId);

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

        console.log('🔧 [DEBUG] Wallet creation SUCCESS!');
        console.log('🔧 [DEBUG] Created', wallets.length, 'wallets');
        console.log('🔧 [DEBUG] Logging in with first wallet:', result.wallet.address);

        // Login with first wallet
        doLogIn(result.wallet, allProfiles);

        console.log('🔧 [DEBUG] Closing dialogs and cleaning up...');

        // Close dialogs
        setShowOAuthPasswordSetup(false);
        setOpenWalletModal(false);
        setOpen(false);  // Close the main modal

        // Clear password fields
        setOAuthPassword('');
        setOAuthConfirmPassword('');

        console.log('🔧 [DEBUG] All dialogs closed, showing success message');
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
    const oauthAction = sessionStorage.getItem('oauth_action');

    console.log('🔧 [MOUNT] OAuth session check:');
    console.log('  - oauthToken:', oauthToken ? 'EXISTS' : 'NONE');
    console.log('  - oauthProvider:', oauthProvider);
    console.log('  - oauthAction:', oauthAction);
    console.log('  - accountProfile:', accountProfile ? accountProfile.account : 'NONE');

    if (oauthToken && oauthProvider) {
      // User came from OAuth and needs password setup
      // BUT: Only show if user is not already logged in
      if (!accountProfile) {
        console.log('🔧 [MOUNT] OAuth password required - redirecting to /wallet-setup');
        // Redirect to dedicated setup page instead of showing modal
        window.location.href = '/wallet-setup';
        return;
      } else {
        console.log('🔧 [MOUNT] User already logged in, clearing stale OAuth session data');
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
        console.log('🔧 [MOUNT] Reopening wallet modal (user not logged in)');
        setOpenWalletModal(true);
      } else {
        console.log('🔧 [MOUNT] User already logged in, NOT reopening wallet modal');
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

      console.log('Password check - Provider:', accountProfile.provider);
      console.log('Password check - Stored:', !!storedPassword);
      console.log('Password check - Match:', storedPassword === newAccountPassword);

      if (!storedPassword || storedPassword !== newAccountPassword) {
        openSnackbar('Incorrect password', 'error');
        setNewAccountPassword('');
        return;
      }

      // Password verified - create new wallet with SAME auth type
      console.log('=== CREATING NEW ACCOUNT ===');
      console.log('Current profile:', accountProfile);
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

      console.log('New wallet data:', { ...walletData, seed: '[HIDDEN]' });

      // Store encrypted with same password
      await walletStorage.storeWallet(walletData, newAccountPassword);
      console.log('Wallet stored in IndexedDB');

      // For OAuth wallets, ensure password is stored for provider
      if (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social') {
        const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
        await walletStorage.setSecureItem(`wallet_pwd_${walletId}`, newAccountPassword);
        console.log('Password stored for provider:', walletId);
      }

      // Update profiles
      const allProfiles = [...profiles, { ...walletData, tokenCreatedAt: Date.now() }];
      setProfiles(allProfiles);
      await syncProfilesToIndexedDB(allProfiles);

      // Mark as needing backup
      localStorage.setItem(`wallet_needs_backup_${wallet.address}`, 'true');

      // Close and switch
      console.log('=== NEW ACCOUNT CREATED ===');
      console.log('New wallet address:', walletData.address);
      console.log('All profiles after creation:', allProfiles.map(p => p.account));
      setShowNewAccountFlow(false);
      setNewAccountPassword('');
      setOpen(false);
      requestAnimationFrame(() => {
        console.log('Logging in to new account...');
        doLogIn(walletData, allProfiles);
        console.log('Login called');
      });

      openSnackbar(`Account ${allProfiles.length} of 25 created`, 'success');
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

  // Debug: Log when accountProfile changes
  useEffect(() => {
    console.log('🔄 accountProfile changed:', {
      account: accountProfile?.account,
      wallet_type: accountProfile?.wallet_type,
      profilesCount: profiles.length
    });
  }, [accountProfile, profiles.length]);

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
        style={{
          background: 'transparent',
          border: `1.5px solid ${alpha(theme.palette.divider, 0.2)}`,
          borderRadius: '12px',
          height: '38px',
          padding: accountProfile ? '0 14px' : '0 16px',
          minWidth: accountProfile ? '110px' : '90px',
          color: '#4285f4',
          fontSize: '0.9rem',
          fontWeight: '400',
          fontFamily: 'inherit',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = '#4285f4';
          e.target.style.background = alpha('#4285f4', 0.04);
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = alpha(theme.palette.divider, 0.2);
          e.target.style.background = 'transparent';
        }}
        title={accountProfile ? 'Account Details' : 'Connect Wallet'}
      >
{accountProfile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: accountsActivation[accountLogin] === false
                ? '#ef5350'
                : '#4caf50'
            }} />
            <span style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              fontWeight: '500'
            }}>
              {truncateAccount(accountLogin, 6)}
            </span>
          </div>
        ) : (
          <span>{'Connect'}</span>
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
              borderRadius: '10px',
              width: '280px',
              maxWidth: '280px',
              background: 'transparent',
              boxShadow: 'none',
              position: 'fixed',
              top: '60px',
              right: '12px',
              left: 'auto',
              transform: 'none !important',
              margin: 0,
              transition: 'none !important'
            },
            zIndex: 9999
          }}
        >
          <DialogContent sx={{ p: 0 }}>
            <StyledPopoverPaper>
            {accountProfile ? (
              <>

                {!showSeedDialog && !showNewAccountFlow ? (
                  <WalletContent
                    theme={theme}
                    accountLogin={accountLogin}
                    accountBalance={accountBalance}
                    accountTotalXrp={accountTotalXrp}
                    accountsActivation={accountsActivation}
                    profiles={profiles}
                    onClose={() => setOpen(false)}
                    onAccountSwitch={(account) => {
                      console.log('=== ACCOUNT SWITCH START ===');
                      console.log('Switching from:', accountProfile?.account);
                      console.log('Switching to:', account);
                      console.log('Current profiles:', profiles.map(p => p.account));
                      if (account !== accountProfile?.account) {
                        console.log('Closing modal...');
                        setOpen(false);
                        requestAnimationFrame(() => {
                          console.log('Calling setActiveProfile...');
                          setActiveProfile(account);
                          console.log('setActiveProfile called');
                        });
                      } else {
                        console.log('Same account - no switch needed');
                      }
                      console.log('=== ACCOUNT SWITCH END ===');
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
                        <Typography variant="h6" sx={{ fontWeight: 500 }}>
                          Create New Account
                        </Typography>
                        <Button size="small" onClick={() => { setShowNewAccountFlow(false); setNewAccountPassword(''); }}>
                          ×
                        </Button>
                      </Box>

                      <Typography variant="body2" sx={{ fontSize: '0.85rem', opacity: 0.7 }}>
                        Account {profiles.length} of 25 (creating #{profiles.length + 1})
                      </Typography>

                      <Alert severity="info" sx={{ py: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
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
                            py: 1,
                            fontSize: '0.85rem',
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
                            py: 1,
                            fontSize: '0.85rem',
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
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Backup Options
                        </Typography>
                        <Button size="small" onClick={() => {
                          setShowSeedDialog(false);
                          setSeedAuthStatus('idle');
                          setDisplaySeed('');
                          setSeedBlurred(true);
                          setSeedWarningAgreed(false);
                          setBackupMode(null);
                          setSeedPassword('');
                        }}>
                          ×
                        </Button>
                      </Box>

                      {seedAuthStatus === 'select-mode' && (
                        <Box>
                          <Typography variant="body2" sx={{ mb: 2, fontSize: '0.85rem', opacity: 0.8 }}>
                            Choose your backup method:
                          </Typography>
                          <Stack spacing={2}>
                            <Button
                              variant="outlined"
                              onClick={() => {
                                setBackupMode('seed');
                                setSeedAuthStatus('password-required');
                              }}
                              sx={{
                                p: 2,
                                textAlign: 'left',
                                justifyContent: 'flex-start',
                                borderRadius: '8px'
                              }}
                            >
                              <Stack>
                                <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
                                  View Current Seed
                                </Typography>
                                <Typography sx={{ fontSize: '0.75rem', opacity: 0.7, mt: 0.5 }}>
                                  Shows seed for wallet {profiles.findIndex(p => p.account === accountProfile?.account) + 1} only
                                </Typography>
                              </Stack>
                            </Button>
                            <Button
                              variant="contained"
                              onClick={() => {
                                setShowSeedDialog(false);
                                handleDownloadBackup();
                              }}
                              sx={{
                                p: 2,
                                textAlign: 'left',
                                justifyContent: 'flex-start',
                                borderRadius: '8px'
                              }}
                            >
                              <Stack>
                                <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
                                  Download Full Backup
                                </Typography>
                                <Typography sx={{ fontSize: '0.75rem', opacity: 0.9, mt: 0.5 }}>
                                  All {profiles.length} wallets in one encrypted file
                                </Typography>
                              </Stack>
                            </Button>
                          </Stack>
                        </Box>
                      )}

                      {seedAuthStatus === 'password-required' && backupMode === 'seed' && (
                        <Box sx={{ p: 2 }}>
                          <Alert severity="error" icon={false} sx={{ mb: 2, py: 1.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.8, fontSize: '0.8rem' }}>
                              If you lose your Secret Seed, we cannot help you
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.72rem', mb: 1, lineHeight: 1.3 }}>
                              Your seed is stored locally in your browser only. xrpl.to has no access to it and cannot recover or reset it. Write it down and store it somewhere safe.
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'error.main', mb: 0.3 }}>
                              NEVER share your seed with:
                            </Typography>
                            <Box component="ul" sx={{ mt: 0, mb: 0, pl: 2, fontSize: '0.7rem', lineHeight: 1.4 }}>
                              <li>xrpl.to admins or support (we cannot see your seed)</li>
                              <li>Anyone claiming to be from xrpl.to</li>
                              <li>Any website or service</li>
                              <li>Random people on the internet</li>
                            </Box>
                          </Alert>

                          <Box sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1,
                            mb: 1.5,
                            p: 1.2,
                            borderRadius: '6px',
                            border: `1.5px solid ${alpha(theme.palette.divider, 0.2)}`,
                            cursor: 'pointer',
                            '&:hover': {
                              borderColor: theme.palette.primary.main,
                              background: alpha(theme.palette.primary.main, 0.02)
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
                              mt: 0.1
                            }}>
                              {seedWarningAgreed && (
                                <Box component="span" sx={{ color: 'white', fontSize: '0.7rem', fontWeight: 600 }}>✓</Box>
                              )}
                            </Box>
                            <Typography variant="body2" sx={{ fontSize: '0.72rem', lineHeight: 1.35 }}>
                              I understand my Secret Seed is my responsibility. xrpl.to cannot recover it, and I will never share it.
                            </Typography>
                          </Box>

                          <Typography variant="body2" sx={{ mb: 1.2, fontSize: '0.75rem', opacity: 0.8 }}>
                            Enter your password to view the seed phrase
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
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    size="small"
                                    onClick={() => setShowSeedPassword(!showSeedPassword)}
                                    edge="end"
                                  >
                                    {showSeedPassword ? <VisibilityOff /> : <Visibility />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            }}
                            sx={{
                              '& .MuiInputBase-input': {
                                fontSize: '0.9rem',
                                py: 1
                              }
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
                                fontSize: '0.8rem',
                                py: 0.6,
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
                                fontSize: '0.8rem',
                                py: 0.6,
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
                            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                              Seed for wallet {profiles.findIndex(p => p.account === accountProfile?.account) + 1} of {profiles.length}
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.7rem', opacity: 0.8, mt: 0.3 }}>
                              ⚠️ This only backs up one wallet. Use download backup for all {profiles.length} wallets.
                            </Typography>
                          </Alert>

                          <Box sx={{
                            py: 0.75,
                            px: 1,
                            borderRadius: 1,
                            background: alpha(theme.palette.background.paper, 0.8),
                            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            wordBreak: 'break-all',
                            lineHeight: 1.5,
                            filter: seedBlurred ? 'blur(5px)' : 'none',
                            transition: 'filter 0.3s ease',
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
                              sx={{ fontSize: '0.75rem', py: 0.6, px: 2 }}
                            >
                              Copy Seed
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => setSeedBlurred(!seedBlurred)}
                              sx={{ fontSize: '0.75rem', py: 0.6, px: 2 }}
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
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" sx={{
                      fontWeight: 500,
                      fontSize: '1.15rem',
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
                        borderRadius: '8px',
                        color: theme.palette.text.secondary,
                        transition: 'all 0.2s',
                        '&:hover': {
                          color: theme.palette.text.primary,
                          backgroundColor: alpha(theme.palette.text.primary, 0.05)
                        }
                      }}
                    >
                      <Typography sx={{ fontSize: '24px', lineHeight: 1, fontWeight: 300 }}>×</Typography>
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
                      {/* Social Options - Ordered from easiest to hardest */}
                      <Stack spacing={1}>
                        {/* Google - Easiest (one-click) */}
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={handleGoogleConnect}
                          sx={{
                            py: 1.5,
                            fontSize: '0.9rem',
                            fontWeight: 400,
                            textTransform: 'none',
                            borderRadius: '12px',
                            borderWidth: '1px',
                            borderColor: alpha(theme.palette.divider, 0.2),
                            color: theme.palette.text.primary,
                            backgroundColor: 'transparent',
                            '&:hover': {
                              borderWidth: '1px',
                              borderColor: alpha(theme.palette.divider, 0.3),
                              backgroundColor: alpha(theme.palette.action.hover, 0.04)
                            }
                          }}
                        >
                          <Google sx={{ fontSize: '1.1rem', mr: 0.5 }} />
                          Google
                        </Button>

                        {/* Email - Easy (verification code) */}
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={handleEmailConnect}
                          sx={{
                            py: 1.5,
                            fontSize: '0.9rem',
                            fontWeight: 400,
                            textTransform: 'none',
                            borderRadius: '12px',
                            borderWidth: '1px',
                            borderColor: alpha(theme.palette.divider, 0.2),
                            color: theme.palette.text.primary,
                            backgroundColor: 'transparent',
                            '&:hover': {
                              borderWidth: '1px',
                              borderColor: alpha(theme.palette.divider, 0.3),
                              backgroundColor: alpha(theme.palette.action.hover, 0.04)
                            }
                          }}
                        >
                          <Email sx={{ fontSize: '1.1rem', mr: 0.5 }} />
                          Email
                        </Button>

                        {/* Twitter/X - Moderate (OAuth redirect) */}
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={handleXConnect}
                          sx={{
                            py: 1.5,
                            fontSize: '0.9rem',
                            fontWeight: 400,
                            textTransform: 'none',
                            borderRadius: '12px',
                            borderWidth: '1px',
                            borderColor: alpha(theme.palette.divider, 0.2),
                            color: theme.palette.text.primary,
                            backgroundColor: 'transparent',
                            '&:hover': {
                              borderWidth: '1px',
                              borderColor: alpha(theme.palette.divider, 0.3),
                              backgroundColor: alpha(theme.palette.action.hover, 0.04)
                            }
                          }}
                        >
                          <X sx={{ fontSize: '1.1rem', mr: 0.5 }} />
                          Twitter
                        </Button>

                        {/* Discord - OAuth */}
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={handleDiscordConnect}
                          sx={{
                            py: 1.5,
                            fontSize: '0.9rem',
                            fontWeight: 400,
                            textTransform: 'none',
                            borderRadius: '12px',
                            borderWidth: '1px',
                            borderColor: alpha(theme.palette.divider, 0.2),
                            color: theme.palette.text.primary,
                            backgroundColor: 'transparent',
                            '&:hover': {
                              borderWidth: '1px',
                              borderColor: alpha(theme.palette.divider, 0.3),
                              backgroundColor: alpha(theme.palette.action.hover, 0.04)
                            }
                          }}
                        >
                          <Box component="svg" sx={{ width: '1.1rem', height: '1.1rem', mr: 0.5 }} viewBox="0 0 24 24">
                            <path fill="currentColor" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                          </Box>
                          Discord
                        </Button>
                      </Stack>

                      {/* Passkeys - Most secure but requires device setup */}
                      <Button
                        variant="contained"
                        onClick={() => setShowDeviceLogin(true)}
                        fullWidth
                        startIcon={<SecurityOutlined sx={{ fontSize: '1.1rem' }} />}
                        sx={{
                          mt: 1.5,
                          mb: 1.5,
                          py: 1.8,
                          fontSize: '0.95rem',
                          fontWeight: 500,
                          textTransform: 'none',
                          borderRadius: '12px',
                          backgroundColor: theme.palette.primary.main,
                          color: '#fff',
                          boxShadow: 'none',
                          '&:hover': {
                            backgroundColor: theme.palette.primary.dark,
                            boxShadow: 'none'
                          }
                        }}
                      >
                        Passkeys
                      </Button>

                      {/* Email Verification UI */}
                      {showEmailVerification && (
                        <Box sx={{ mt: 2, p: 2, background: alpha(theme.palette.background.default, 0.5), borderRadius: '12px' }}>
                          {emailStep === 'email' ? (
                            <>
                              <Typography variant="body2" sx={{ mb: 1.5, fontSize: '0.85rem' }}>
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
                                    fontSize: '0.85rem',
                                    textTransform: 'none',
                                    borderRadius: '8px'
                                  }}
                                >
                                  Continue
                                </Button>
                                <Button
                                  variant="outlined"
                                  onClick={() => setShowEmailVerification(false)}
                                  sx={{
                                    py: 1,
                                    fontSize: '0.85rem',
                                    textTransform: 'none',
                                    borderRadius: '8px'
                                  }}
                                >
                                  Cancel
                                </Button>
                              </Stack>
                            </>
                          ) : emailStep === 'code' ? (
                            <>
                              <Typography variant="body2" sx={{ mb: 1.5, fontSize: '0.85rem' }}>
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
                                    fontSize: '0.85rem',
                                    textTransform: 'none',
                                    borderRadius: '8px'
                                  }}
                                >
                                  Verify
                                </Button>
                                <Button
                                  variant="outlined"
                                  onClick={() => setEmailStep('email')}
                                  sx={{
                                    py: 1,
                                    fontSize: '0.85rem',
                                    textTransform: 'none',
                                    borderRadius: '8px'
                                  }}
                                >
                                  Back
                                </Button>
                              </Stack>
                            </>
                          ) : (
                            <>
                              <Typography variant="body2" sx={{ mb: 1.5, fontSize: '0.85rem' }}>
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
                                    fontSize: '0.85rem',
                                    textTransform: 'none',
                                    borderRadius: '8px'
                                  }}
                                >
                                  Login
                                </Button>
                                <Button
                                  variant="outlined"
                                  onClick={() => { setEmailStep('email'); setEmailPassword(''); }}
                                  sx={{
                                    py: 1,
                                    fontSize: '0.85rem',
                                    textTransform: 'none',
                                    borderRadius: '8px'
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
                      <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
                        <Typography variant="caption" sx={{
                          fontSize: '0.7rem',
                          color: alpha(theme.palette.text.secondary, 0.5),
                          display: 'block',
                          textAlign: 'center',
                          mb: 1
                        }}>
                          Encrypted and stored locally
                        </Typography>
                        <Button
                          size="small"
                          onClick={handleDeleteIndexedDB}
                          sx={{
                            fontSize: '0.65rem',
                            color: alpha(theme.palette.error.main, 0.6),
                            textTransform: 'none',
                            display: 'block',
                            margin: '0 auto',
                            '&:hover': {
                              color: theme.palette.error.main
                            }
                          }}
                        >
                          [Debug] Clear IndexedDB
                        </Button>
                      </Box>
                    </>
                  ) : (
                    <>
                      {/* Passkeys Connect */}
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 2,
                        p: 1.5,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.light, 0.04)} 50%)`,
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`
                      }}>
                        <Button
                          onClick={handleGoBack}
                          sx={{
                            mr: 1.5,
                            flexShrink: 0,
                            backgroundColor: alpha(theme.palette.background.paper, 0.6),
                            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                            borderRadius: '8px',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.background.paper, 0.8),
                              transform: 'scale(1.05)'
                            }
                          }}
                        >
                          ← Back
                        </Button>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main, fontSize: '1rem' }}>
                          Key Authentication
                        </Typography>
                      </Box>

                      <Stack spacing={1} sx={{ mb: 2 }}>
                      </Stack>

                      {error && (
                        <Alert severity={error.includes('Creating wallets') ? "info" : "error"} sx={{ mb: 2 }}>
                          {error.includes('Creating wallets') ? (
                            <Typography variant="body2">
                              {error}
                            </Typography>
                          ) : (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Hardware Security Required</strong>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1.5 }}>
                                {error}
                              </Typography>
                            </>
                          )}
                        </Alert>
                      )}

                      {/* Password Input for Device Connect */}
                      {showDevicePasswordInput && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
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
                            py: 1.2,
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 50%)`,
                            '&:hover': {
                              background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 50%)`
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
                            py: 1.2,
                            fontSize: '0.95rem',
                            fontWeight: 600,
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
                          fontSize: '0.75rem'
                        }}>
                          Hardware Secured • Zero-Knowledge
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
                <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem', mb: 0.5 }}>
                  Setup Your Wallet
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.85rem', opacity: 0.7 }}>
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
                    fontSize: '0.8rem',
                    py: 0.8,
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
                    fontSize: '0.8rem',
                    py: 0.8,
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
                    fontSize: '0.8rem',
                    py: 0.8,
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
                              seed.startsWith('sEd') ? '✓ Ed25519 seed' :
                              seed.startsWith('s') ? '✓ secp256k1 seed' :
                              index === 0 ? 'Required: XRP Ledger secret (starts with "s")' :
                              'Optional: Additional seed to import'
                            }
                            FormHelperTextProps={{
                              id: `seed-helper-text-${index}`
                            }}
                            sx={{
                              '& .MuiInputBase-input': {
                                fontFamily: 'monospace',
                                fontSize: '0.85rem'
                              },
                              '& .MuiFormHelperText-root': {
                                color: seed.startsWith('s') ? 'success.main' : 'text.secondary',
                                fontSize: '0.7rem'
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
                          fontSize: '0.8rem',
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
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
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
                  <Typography variant="body2" component="label" htmlFor="wallet-file-input" sx={{ mb: 1, fontSize: '0.85rem' }}>
                    Select your encrypted wallet backup file
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    aria-label={importFile ? `File selected: ${importFile.name}` : 'Choose wallet backup file'}
                    sx={{
                      py: 1.2,
                      borderStyle: 'dashed',
                      borderWidth: '1.5px',
                      backgroundColor: importFile ? alpha(theme.palette.success.main, 0.05) : 'transparent',
                      fontWeight: 400,
                      fontSize: '0.85rem'
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
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
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
                    fontSize: '0.85rem',
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
                    fontSize: '0.85rem',
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
