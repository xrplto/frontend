import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Wallet as XRPLWallet, encodeSeed } from 'xrpl';

// Lazy load heavy dependencies
let startRegistration, startAuthentication, CryptoJS, scrypt, base64URLStringToBuffer;

// Material
import {
  alpha,
  styled,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
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
import { Visibility, VisibilityOff, LockOutlined, SecurityOutlined } from '@mui/icons-material';

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

// Secure deterministic wallet generation using scrypt with PBKDF2 fallback and signature entropy
const generateSecureDeterministicWallet = async (credentialId, accountIndex, signatureEntropy) => {

  if (!signatureEntropy) {
    throw new Error('Signature entropy is required for secure wallet generation');
  }

  const baseEntropy = `passkey-wallet-v4-deterministic-${credentialId}-${accountIndex}`;
  const combinedEntropy = CryptoJS.SHA256(baseEntropy).toString();
  const salt = `salt-${credentialId}-deterministic-v4`;

  if (!scrypt || typeof scrypt.scrypt !== 'function') {
    throw new Error('Scrypt not available - refusing to use weaker PBKDF2 fallback for wallet generation');
  }

  let entropyHash;
  try {
    // Use scrypt with optimized parameters for better UX while maintaining security
    const scryptResult = await scrypt.scrypt(
      Buffer.from(combinedEntropy, 'utf8'),
      Buffer.from(salt, 'utf8'),
      2048,  // N (CPU cost) - reduced for better UX while still secure
      8,     // r (memory cost) - standard
      1,     // p (parallelization) - single thread for mobile compatibility
      32     // output length in bytes - maintain high entropy
    );
    entropyHash = Array.from(scryptResult).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    throw new Error(`Scrypt key derivation failed: ${error.message} - cannot proceed with wallet generation`);
  }

  // Use first 32 hex chars (16 bytes) for seed entropy
  const seedEntropy = Buffer.from(entropyHash.substring(0, 32), 'hex');
  const seed = encodeSeed(seedEntropy, 'secp256k1');

  // Create wallet from seed (this ensures we can backup the seed later)
  return XRPLWallet.fromSeed(seed);
};

// Extract signature entropy from existing WebAuthn response
const extractSignatureEntropy = (authResponse) => {
  if (!authResponse || !authResponse.response || !authResponse.response.signature) {
    throw new Error('Invalid WebAuthn response - no signature found');
  }

  const signature = authResponse.response.signature;

  // Enforce strict base64url decoding - NO FALLBACKS
  if (!base64URLStringToBuffer) {
    throw new Error('base64URLStringToBuffer not available - security dependencies not properly loaded');
  }

  if (typeof signature !== 'string') {
    throw new Error('Invalid signature format - expected base64url string from WebAuthn');
  }

  let signatureArray;
  try {
    const signatureBuffer = base64URLStringToBuffer(signature);
    signatureArray = new Uint8Array(signatureBuffer);
  } catch (decodeError) {
    throw new Error(`Failed to decode WebAuthn signature: ${decodeError.message}. Refusing insecure fallback.`);
  }

  // Validate signature length for security
  if (signatureArray.length < 32) {
    throw new Error(`Signature too short (${signatureArray.length} bytes) - insufficient entropy for secure wallet generation`);
  }

  const entropyBytes = signatureArray.slice(0, 32);
  const entropyHex = Array.from(entropyBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  // Validate entropy quality
  if (entropyHex.length !== 64) {
    throw new Error(`Invalid entropy length: ${entropyHex.length} chars, expected 64`);
  }

  return entropyHex;
};

// Generate signature-based entropy by requesting WebAuthn authentication
const generateSignatureEntropy = async (credentialId) => {
  if (!startAuthentication) {
    throw new Error('WebAuthn authentication not available - ensure dependencies are loaded');
  }

  if (!window.PublicKeyCredential) {
    throw new Error('WebAuthn not supported in this browser');
  }

  try {
    // Generate a random challenge for signature
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const challengeB64 = base64urlEncode(challenge);


    // Create proper WebAuthn options structure
    const optionsJSON = {
      challenge: challengeB64,
      timeout: 30000,
      userVerification: 'required'
      // Note: Not specifying allowCredentials to work with any available credential
      // The credentialId is used later for entropy generation
    };

    // Request WebAuthn authentication with proper SimpleWebAuthn call structure
    const authResponse = await startAuthentication({ optionsJSON });

    if (authResponse && authResponse.response && authResponse.response.signature) {
      // Use the signature as entropy (first 32 bytes) - STRICT SECURITY ONLY
      const signature = authResponse.response.signature;

      // Enforce strict base64url decoding - NO FALLBACKS
      if (!base64URLStringToBuffer) {
        throw new Error('base64URLStringToBuffer not available - security dependencies not properly loaded');
      }

      if (typeof signature !== 'string') {
        throw new Error('Invalid signature format - expected base64url string from WebAuthn');
      }

      let signatureArray;
      try {
        const signatureBuffer = base64URLStringToBuffer(signature);
        signatureArray = new Uint8Array(signatureBuffer);
      } catch (decodeError) {
        throw new Error(`Failed to decode WebAuthn signature: ${decodeError.message}. Refusing insecure fallback.`);
      }

      // Validate signature length for security
      if (signatureArray.length < 32) {
        throw new Error(`Signature too short (${signatureArray.length} bytes) - insufficient entropy for secure wallet generation`);
      }

      const entropyBytes = signatureArray.slice(0, 32);
      const entropyHex = Array.from(entropyBytes).map(b => b.toString(16).padStart(2, '0')).join('');

      // Validate entropy quality
      if (entropyHex.length !== 64) {
        throw new Error(`Invalid entropy length: ${entropyHex.length} chars, expected 64`);
      }

      return entropyHex;
    } else {
      throw new Error('WebAuthn authentication did not return a valid signature');
    }
  } catch (error) {

    // Provide more specific error messages
    if (error.name === 'NotAllowedError') {
      throw new Error('User cancelled authentication or authentication not allowed');
    } else if (error.name === 'NotSupportedError') {
      throw new Error('WebAuthn authentication not supported on this device');
    } else if (error.name === 'SecurityError') {
      throw new Error('Security error during authentication - ensure HTTPS connection');
    } else if (error.name === 'AbortError') {
      throw new Error('Authentication timed out - please try again');
    } else {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }
};


// const pair = {
//   '534F4C4F00000000000000000000000000000000': 'SOLO',
//   XRP: 'XRP'
// };

// PIN Input Field styling for 6 separate boxes
const PinField = styled(TextField)(({ theme }) => ({
  '& input': {
    textAlign: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    padding: '12px 0',
    width: '48px',
    height: '48px',
  },
  '& .MuiOutlinedInput-root': {
    width: '48px',
    height: '48px',
  }
}));

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
  border: 'none',
  borderRadius: 16,
  boxShadow: 'none',
  overflow: 'hidden',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.divider, 0.2)}, transparent)`
  }
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
  generateAdditionalWallet,
  showAdditionalWalletPin,
  setShowAdditionalWalletPin,
  additionalWalletPin,
  handleAdditionalPinChange,
  handleAdditionalPinKeyDown,
  handleAdditionalWalletPinSubmit,
  additionalPinRefs,
  showSeedDialog,
  seedAuthStatus,
  seedPassword,
  setSeedPassword,
  showSeedPassword,
  setShowSeedPassword,
  handleSeedPasswordSubmit,
  setShowSeedDialog,
  setSeedAuthStatus
}) => {
  return (
    <>
      {/* Header */}
      <Box sx={{
        p: 1.5,
        background: 'transparent',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
        position: 'relative',
        zIndex: 1
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={isEmbedded ? 1.5 : 2} alignItems="center">
            <Box sx={{
              width: isEmbedded ? 8 : 5,
              height: isEmbedded ? 8 : 5,
              borderRadius: '50%',
              background: accountsActivation[accountLogin] === false
                ? theme.palette.error.main
                : theme.palette.success.main
            }} />
            <Typography sx={{
              fontFamily: 'monospace',
              fontSize: isEmbedded ? '0.8rem' : '0.85rem',
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}>
              {truncateAccount(accountLogin, 8)}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <Typography
              onClick={onBackupSeed}
              sx={{
                fontSize: '0.7rem',
                opacity: 0.5,
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8
                }
              }}
            >
              backup
            </Typography>
            <Button
              size="small"
              onClick={onClose}
              sx={{
                p: 0.5,
                fontSize: '1.2rem',
                fontWeight: 400,
                minWidth: 'auto',
                '&:hover': {
                  background: alpha(theme.palette.text.primary, 0.04)
                }
              }}
            >
              ×
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Balance Display */}
      <Box sx={{
        p: isEmbedded ? 2 : 2.5,
        textAlign: 'center',
        background: 'transparent'
      }}>
        <Typography sx={{
          fontSize: isEmbedded ? '2rem' : '2.5rem',
          fontWeight: 500,
          lineHeight: 1,
          fontFamily: 'system-ui',
          color: theme.palette.text.primary,
          mb: isEmbedded ? 0.5 : 0.5
        }}>
          {accountBalance?.curr1?.value || '0'}
        </Typography>
        <Typography sx={{
          fontSize: isEmbedded ? '0.7rem' : '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: isEmbedded ? '1.5px' : '2px',
          opacity: 0.6,
          fontWeight: 400
        }}>
          XRP Balance
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Box sx={{ px: isEmbedded ? 1.5 : 2, pb: isEmbedded ? 1.5 : 2 }}>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 0.8,
          mb: isEmbedded ? 1.5 : 2
        }}>
          <Box sx={{
            p: isEmbedded ? 1 : 1.5,
            borderRadius: '8px',
            border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
            background: 'transparent',
            textAlign: 'center'
          }}>
            <Typography sx={{ fontSize: isEmbedded ? '0.9rem' : '1rem', fontWeight: 500 }}>
              {accountBalance?.curr1?.value || '0'}
            </Typography>
            <Typography sx={{ fontSize: isEmbedded ? '0.55rem' : '0.6rem', opacity: 0.6 }}>Available</Typography>
          </Box>
          <Box sx={{
            p: isEmbedded ? 1 : 1.5,
            borderRadius: '8px',
            border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
            background: 'transparent',
            textAlign: 'center'
          }}>
            <Typography sx={{ fontSize: isEmbedded ? '1rem' : '1.2rem', fontWeight: 500, color: theme.palette.warning.main }}>
              {Math.max(0, Number(accountTotalXrp || 0) - Number(accountBalance?.curr1?.value || 0)) || '0'}
            </Typography>
            <Typography sx={{ fontSize: isEmbedded ? '0.55rem' : '0.6rem', opacity: 0.6 }}>Reserved</Typography>
          </Box>
          <Box sx={{
            p: isEmbedded ? 1 : 1.5,
            borderRadius: '8px',
            border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
            background: 'transparent',
            textAlign: 'center'
          }}>
            <Typography sx={{ fontSize: isEmbedded ? '0.9rem' : '1rem', fontWeight: 500 }}>
              {accountTotalXrp || '0'}
            </Typography>
            <Typography sx={{ fontSize: isEmbedded ? '0.55rem' : '0.6rem', opacity: 0.6 }}>Total</Typography>
          </Box>
        </Box>

      </Box>

      {/* Accounts List */}
      {profiles.filter((profile) => profile.account !== accountLogin).length > 0 && (
        <Box sx={{
          maxHeight: isEmbedded ? 'none' : 'none',
          overflowY: 'visible',
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderBottom: isEmbedded ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          flex: isEmbedded ? 1 : 'none'
        }}>
          <Typography sx={{
            px: 2,
            py: 1,
            fontSize: isEmbedded ? '0.65rem' : '0.7rem',
            fontWeight: 600,
            opacity: 0.5,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Switch Account
          </Typography>
          {profiles
            .filter((profile) => profile.account !== accountLogin)
            .slice(0, isEmbedded ? 6 : undefined)
            .map((profile, idx) => {
              const account = profile.account;
              return (
                <Box
                  key={'account' + idx}
                  onClick={() => onAccountSwitch(account)}
                  sx={{
                    px: 2,
                    py: isEmbedded ? 1 : 1.2,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background 0.2s',
                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.05)
                    }
                  }}
                >
                  <Stack direction="row" spacing={isEmbedded ? 1 : 1.5} alignItems="center">
                    <Box sx={{
                      width: isEmbedded ? 6 : 8,
                      height: isEmbedded ? 6 : 8,
                      borderRadius: '50%',
                      background: accountsActivation[account] === false
                        ? theme.palette.error.main
                        : theme.palette.success.main
                    }} />
                    <Typography sx={{
                      fontFamily: 'monospace',
                      fontSize: isEmbedded ? '0.75rem' : '0.8rem'
                    }}>
                      {truncateAccount(account, 8)}
                    </Typography>
                  </Stack>
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveProfile(account);
                    }}
                    sx={{
                      opacity: 0.5,
                      fontSize: '1.2rem',
                      fontWeight: 400,
                      minWidth: 'auto',
                      '&:hover': {
                        opacity: 1,
                        background: alpha(theme.palette.error.main, 0.04)
                      }
                    }}
                  >
                    ×
                  </Button>
                </Box>
              );
            })}

          {/* Add Wallet Button - only show for device wallets with less than 5 wallets */}
          {(() => {
            const deviceWallets = profiles.filter(p => p.wallet_type === 'device');
            return deviceWallets.length > 0 && deviceWallets.length < 5;
          })() && (
            <Box
              onClick={generateAdditionalWallet}
              sx={{
                px: 2,
                py: isEmbedded ? 1 : 1.2,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.05)
                }
              }}
            >
              <Typography sx={{
                fontSize: isEmbedded ? '0.75rem' : '0.8rem',
                color: theme.palette.primary.main,
                fontWeight: 600
              }}>
                + Generate Wallet ({profiles.filter(p => p.wallet_type === 'device').length}/5)
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* PIN Input for Additional Wallet Generation */}
      {showAdditionalWalletPin && (
        <Box sx={{
          p: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: alpha(theme.palette.primary.main, 0.02)
        }}>
          <Typography variant="body2" sx={{ mb: 2, fontWeight: 500, textAlign: 'center' }}>
            Enter your 6-digit PIN to generate wallet #{profiles.filter(p => p.wallet_type === 'device').length + 1}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
            {additionalWalletPin.map((value, index) => (
              <TextField
                key={index}
                inputRef={el => additionalPinRefs.current[index] = el}
                value={value}
                onChange={(e) => handleAdditionalPinChange(index, e.target.value)}
                onKeyDown={(e) => handleAdditionalPinKeyDown(index, e)}
                type="text"
                inputProps={{
                  maxLength: 1,
                  autoComplete: 'off',
                  inputMode: 'numeric',
                  pattern: '[0-9]*'
                }}
                sx={{
                  width: 40,
                  '& .MuiInputBase-input': {
                    textAlign: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    padding: '8px 4px'
                  }
                }}
                variant="outlined"
                autoFocus={index === 0}
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setShowAdditionalWalletPin(false);
                additionalWalletPin.forEach((_, i) => additionalWalletPin[i] = '');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleAdditionalWalletPinSubmit}
              disabled={additionalWalletPin.some(p => !p)}
            >
              Generate
            </Button>
          </Box>
        </Box>
      )}

      {/* Add Wallet Button - show for logged in device wallet users */}
      {accountProfile && !showAdditionalWalletPin && (() => {
        const deviceWallets = profiles.filter(p => p.wallet_type === 'device');
        return deviceWallets.length > 0 && deviceWallets.length < 5;
      })() && (
        <Box
          onClick={generateAdditionalWallet}
          sx={{
            mx: 1.5,
            mb: 1,
            py: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            borderRadius: '6px',
            transition: 'all 0.2s',
            '&:hover': {
              background: alpha(theme.palette.primary.main, 0.05),
              borderColor: theme.palette.primary.main
            }
          }}
        >
          <Typography sx={{
            fontSize: '0.8rem',
            color: theme.palette.primary.main,
            fontWeight: 600
          }}>
            + Generate Additional Wallet ({profiles.filter(p => p.wallet_type === 'device').length}/5)
          </Typography>
        </Box>
      )}


      {/* Bottom Actions */}
      <Box sx={{
        p: 1.5,
        borderTop: isEmbedded ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
        display: 'flex',
        gap: 0.5
      }}>
        <Button
          onClick={onLogout}
          variant="outlined"
          size="small"
          sx={{
            px: isEmbedded ? 1 : 1.5,
            py: isEmbedded ? 0.5 : 0.8,
            minWidth: isEmbedded ? 'auto' : '70px',
            borderRadius: '8px',
            borderWidth: '1.5px',
            borderColor: alpha(theme.palette.error.main, 0.3),
            background: 'transparent',
            color: theme.palette.error.main,
            fontWeight: 400,
            fontSize: isEmbedded ? '0.75rem' : '0.8rem',
            textTransform: 'none',
            '&:hover': {
              borderWidth: '1.5px',
              borderColor: theme.palette.error.main,
              background: alpha(theme.palette.error.main, 0.04)
            }
          }}
        >
          {!isEmbedded && 'Logout'}
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

  // Helper to sync profiles to IndexedDB
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

      await walletStorage.storeProfiles(uniqueProfiles);
    } catch (error) {
    }
  };
  const anchorRef = useRef(null);
  const [showingSeed, setShowingSeed] = useState(false);
  const [currentSeed, setCurrentSeed] = useState('');
  const [seedBlurred, setSeedBlurred] = useState(true);
  const [showAllAccounts, setShowAllAccounts] = useState(false);
  const [accountsActivation, setAccountsActivation] = useState({});
  const [visibleAccountCount, setVisibleAccountCount] = useState(5);
  const [twitterAvailable, setTwitterAvailable] = useState(true);
  const [isCheckingActivation, setIsCheckingActivation] = useState(false);
  const [showDeviceLogin, setShowDeviceLogin] = useState(false);
  const [status, setStatus] = useState('idle');
  const [showDevicePinInput, setShowDevicePinInput] = useState(false);
  const [devicePin, setDevicePin] = useState(['', '', '', '', '', '']);
  const [devicePinMode, setDevicePinMode] = useState('create'); // 'create' or 'verify'
  const [pendingDeviceId, setPendingDeviceId] = useState(null);
  const devicePinRefs = useRef([]);
  const [error, setError] = useState('');
  const [walletInfo, setWalletInfo] = useState(null);
  const [isLoadingDeps, setIsLoadingDeps] = useState(false);
  const [showSeedDialog, setShowSeedDialog] = useState(false);
  const [seedAuthStatus, setSeedAuthStatus] = useState('idle');
  const [displaySeed, setDisplaySeed] = useState('');
  const [seedPassword, setSeedPassword] = useState('');
  const [showSeedPassword, setShowSeedPassword] = useState(false);
  // OAuth wallet manager is now part of unified storage

  // Additional wallet generation states
  const [showAdditionalWalletPin, setShowAdditionalWalletPin] = useState(false);
  const [additionalWalletPin, setAdditionalWalletPin] = useState(['', '', '', '', '', '']);
  const additionalPinRefs = useRef([]);

  // OAuth password setup state
  const [showOAuthPasswordSetup, setShowOAuthPasswordSetup] = useState(false);
  const [oauthPassword, setOAuthPassword] = useState('');
  const [oauthConfirmPassword, setOAuthConfirmPassword] = useState('');
  const [showOAuthPassword, setShowOAuthPassword] = useState(false);
  const [oauthPasswordError, setOAuthPasswordError] = useState('');
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [walletStorage, setWalletStorage] = useState(new EncryptedWalletStorage());
  const [showImportOption, setShowImportOption] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importMethod, setImportMethod] = useState('new'); // 'new', 'import', or 'seed'
  const [importSeed, setImportSeed] = useState('');


  // Device PIN handlers
  const handleDevicePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const boxes = [...devicePin];
    boxes[index] = value.slice(-1);
    setDevicePin(boxes);

    if (value && index < 5) {
      devicePinRefs.current[index + 1]?.focus();
    }
    setError(''); // Clear error when typing
  };

  const handleDevicePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !devicePin[index] && index > 0) {
      devicePinRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter' && devicePin.every(b => b)) {
      handleDevicePinSubmit();
    }
  };

  const handleDevicePinSubmit = async () => {
    const pin = devicePin.join('');
    if (pin.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setShowDevicePinInput(false);
    setDevicePin(['', '', '', '', '', '']);

    if (devicePinMode === 'create' && pendingDeviceId) {
      await completeDeviceRegistration(pendingDeviceId, pin);
    } else if (devicePinMode === 'verify' && pendingDeviceId) {
      await completeDeviceAuthentication(pendingDeviceId, pin);
    }
  };

  const completeDeviceRegistration = async (deviceId, userPin) => {
    try {
      // Store the PIN encrypted for future use
      await walletStorage.storeWalletCredential(deviceId, userPin);

      // Generate only 1 wallet initially for performance
      const wallets = [];
      const i = 0; // Generate only the first wallet

      // Use PBKDF2 to generate wallet with PIN
      const entropyString = `xrpl-passkey-${deviceId}-${userPin}-${i}`;
      // Use lower iterations since passkey already provides hardware security
      // 10,000 iterations provides reasonable additional entropy without blocking UI
      const seedHash = CryptoJS.PBKDF2(entropyString, `salt-${deviceId}`, {
        keySize: 256/32,
        iterations: 10000,
        hasher: CryptoJS.algo.SHA512
      }).toString();

      // Convert hash to entropy array (32 bytes)
      const entropy = [];
      for (let j = 0; j < 32; j++) {
        entropy.push(parseInt(seedHash.substr(j * 2, 2), 16));
      }
      const wallet = XRPLWallet.fromEntropy(entropy);

      const walletData = {
        deviceKeyId: deviceId,
        accountIndex: i,
        account: wallet.address,
        address: wallet.address,
        publicKey: wallet.publicKey,
        wallet_type: 'device',
        xrp: '0',
        createdAt: Date.now(),
        seed: wallet.seed
      };

      wallets.push(walletData);

      // Store wallet encrypted in IndexedDB
      await walletStorage.storeWallet(walletData, userPin);

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

      // Login with first wallet
      doLogIn(wallets[0], allProfiles);
      setStatus('success');

      // Close modal after brief delay to show success
      setTimeout(() => {
        setOpenWalletModal(false);
        setStatus('idle');
        setShowDeviceLogin(false);
      }, 500);
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
      console.error('Google connect error:', error);
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
          // Failed to decode JWT
          payload = { id: 'google_user', provider: 'google' };
        }
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

      console.log('processGoogleConnect result:', result);

      if (result.requiresPassword) {
        console.log('❌ Password required - showing setup dialog');
        // Store token temporarily for password setup
        sessionStorage.setItem('oauth_temp_token', jwtToken);
        sessionStorage.setItem('oauth_temp_provider', 'google');
        sessionStorage.setItem('oauth_temp_user', JSON.stringify(payload));
        sessionStorage.setItem('oauth_action', result.action);
        // No backend data to store - wallets are local only

        // Show password setup dialog
        setShowOAuthPasswordSetup(true);
      } else {
        console.log('✅ No password required - auto login');
        // Wallet already setup
        await walletStorage.setSecureItem('jwt', jwtToken);
        await walletStorage.setSecureItem('authMethod', 'google');
        await walletStorage.setSecureItem('user', payload);

        if (result.wallet) {
          doLogIn(result.wallet, profiles);
          openSnackbar('Google connect successful!', 'success');
        }
        setOpenWalletModal(false);
      }
    } catch (error) {
      console.error('Error processing Google connect:', error);
      openSnackbar('Failed to process Google connect', 'error');
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
        console.error('Failed to get OAuth request token:', error);
        setError('Twitter authentication is currently unavailable. Please try Passkeys or Google instead.');
        return;
      }

      const data = await response.json();

      if (!data.auth_url || !data.oauth_token || !data.oauth_token_secret) {
        console.error('Invalid OAuth response:', data);
        setError('Twitter authentication setup failed. Please try another login method.');
        return;
      }

      // Store OAuth 1.0a tokens for callback
      sessionStorage.setItem('oauth1_token', data.oauth_token);
      sessionStorage.setItem('oauth1_token_secret', data.oauth_token_secret);
      sessionStorage.setItem('oauth1_auth_start', Date.now().toString());

      // Replace twitter.com with x.com to avoid redirect
      const authUrl = data.auth_url.replace('api.twitter.com', 'api.x.com');
      console.log('Redirecting to Twitter OAuth 1.0a:', authUrl);
      window.location.href = authUrl;
    } catch (error) {
      openSnackbar('X connect failed: ' + error.message, 'error');
    }
  };

  const handleDiscordConnect = async () => {
    try {
      openSnackbar('Discord connect integration coming soon', 'info');
      // When ready: window.location.href = '/api/oauth/discord';
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

      if (!token || !provider || !userStr) {
        throw new Error('Missing OAuth data');
      }

      const user = JSON.parse(userStr);

      // Use unified wallet storage
      const walletStorageInstance = walletStorage || new EncryptedWalletStorage();

      // Complete wallet setup with password - no backend needed
      const result = await walletStorageInstance.completeSocialWalletSetup(
        {
          id: user.id,
          provider: provider,
          email: user.account || user.email,
          ...user
        },
        oauthPassword,
        action
      );

      if (result.success && result.wallet) {
        // Clear temporary session data
        sessionStorage.removeItem('oauth_temp_token');
        sessionStorage.removeItem('oauth_temp_provider');
        sessionStorage.removeItem('oauth_temp_user');
        sessionStorage.removeItem('oauth_action');

        // Store permanent auth data
        await walletStorage.setSecureItem('jwt', token);
        await walletStorage.setSecureItem('authMethod', provider);
        await walletStorage.setSecureItem('user', user);

        // Login with the wallet
        doLogIn(result.wallet, profiles);

        // Close dialogs
        setShowOAuthPasswordSetup(false);
        setOpenWalletModal(false);

        // Clear password fields
        setOAuthPassword('');
        setOAuthConfirmPassword('');

        openSnackbar('Wallet created successfully!', 'success');
      } else {
        throw new Error('Failed to setup wallet');
      }
    } catch (error) {
      console.error('Wallet setup error:', error);
      setOAuthPasswordError(error.message || 'Failed to setup wallet');
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const generateAdditionalWallet = async () => {
    try {
      const existingProfiles = profiles.filter(p => p.wallet_type === 'device');
      const deviceId = existingProfiles[0]?.deviceKeyId;

      if (!deviceId) {
        openSnackbar('No device wallet found', 'error');
        return;
      }

      const nextIndex = existingProfiles.length;
      if (nextIndex >= 5) {
        openSnackbar('Maximum 5 wallets reached', 'info');
        return;
      }

      // Show inline PIN input
      setShowAdditionalWalletPin(true);
      setAdditionalWalletPin(['', '', '', '', '', '']);
      return;
    } catch (err) {
      openSnackbar('Failed to generate additional wallet: ' + err.message, 'error');
    }
  };

  const handleAdditionalWalletPinSubmit = async () => {
    try {
      const userPin = additionalWalletPin.join('');
      if (userPin.length !== 6) {
        openSnackbar('Please enter all 6 digits', 'error');
        return;
      }

      // Ensure CryptoJS is loaded
      await loadDependencies();

      const existingProfiles = profiles.filter(p => p.wallet_type === 'device');
      const deviceId = existingProfiles[0]?.deviceKeyId;
      const nextIndex = existingProfiles.length;

      // Generate next wallet
      const entropyString = `xrpl-passkey-${deviceId}-${userPin}-${nextIndex}`;
      const seedHash = CryptoJS.PBKDF2(entropyString, `salt-${deviceId}`, {
        keySize: 256/32,
        iterations: 10000,
        hasher: CryptoJS.algo.SHA512
      }).toString();

      const entropy = [];
      for (let j = 0; j < 32; j++) {
        entropy.push(parseInt(seedHash.substr(j * 2, 2), 16));
      }
      const wallet = XRPLWallet.fromEntropy(entropy);

      const newWallet = {
        deviceKeyId: deviceId,
        accountIndex: nextIndex,
        account: wallet.address,
        address: wallet.address,
        publicKey: wallet.publicKey,
        wallet_type: 'device',
        xrp: '0',
        createdAt: Date.now()
      };

      // Add to profiles
      const allProfiles = [...profiles, newWallet];
      setProfiles(allProfiles);
      await syncProfilesToIndexedDB(allProfiles);

      openSnackbar(`Wallet ${nextIndex + 1} generated: ${wallet.address.slice(0, 8)}...`, 'success');

      // Hide PIN input and reset
      setShowAdditionalWalletPin(false);
      setAdditionalWalletPin(['', '', '', '', '', '']);
    } catch (err) {
      openSnackbar('Failed to generate additional wallet: ' + err.message, 'error');
    }
  };

  const handleAdditionalPinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const boxes = [...additionalWalletPin];
    boxes[index] = value.slice(-1);
    setAdditionalWalletPin(boxes);

    if (value && index < 5) {
      additionalPinRefs.current[index + 1]?.focus();
    }
  };

  const handleSeedPasswordSubmit = async () => {
    const profile = accountProfile;
    if (!seedPassword) {
      openSnackbar('Please enter password', 'error');
      return;
    }

    try {
      const wallet = await walletStorage.getWallet(profile.address, seedPassword);
      if (wallet && wallet.seed) {
        setSeedAuthStatus('success');
        setDisplaySeed(wallet.seed);
        setSeedBlurred(true);
        setSeedPassword('');
        setShowSeedPassword(false);
      } else {
        throw new Error('Wallet not found');
      }
    } catch (error) {
      openSnackbar('Incorrect password', 'error');
      setSeedPassword('');
    }
  };

  const handleImportSeed = async () => {
    setIsCreatingWallet(true);
    try {
      // Validate seed
      const seed = importSeed.trim();
      if (!seed.startsWith('s')) {
        throw new Error('Invalid seed format - must start with "s"');
      }

      // Algorithm detection based on seed prefix
      // Ed25519 seeds start with 'sEd', secp256k1 seeds start with 's' (but not 'sEd')
      const algorithm = seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';

      console.log(`Importing ${algorithm} wallet from seed`);

      // Create wallet from seed with correct algorithm
      let wallet;
      try {
        // The second parameter should be the algorithm string directly, not an object
        wallet = XRPLWallet.fromSeed(seed, algorithm);
        console.log(`Successfully created wallet with address: ${wallet.address}`);
      } catch (seedError) {
        throw new Error(`Invalid ${algorithm} seed: ${seedError.message}`);
      }

      // Verify the wallet was created successfully
      if (!wallet.address || !wallet.publicKey) {
        throw new Error('Failed to derive wallet from seed');
      }

      // Get OAuth data
      const token = sessionStorage.getItem('oauth_temp_token');
      const provider = sessionStorage.getItem('oauth_temp_provider');
      const userStr = sessionStorage.getItem('oauth_temp_user');
      const user = JSON.parse(userStr);

      // Create wallet profile
      const walletProfile = {
        account: wallet.address,
        address: wallet.address,
        publicKey: wallet.publicKey,
        seed: wallet.seed,
        wallet_type: 'oauth',
        provider: provider,
        imported: true,
        xrp: '0'
      };

      // Store encrypted with password
      await walletStorage.storeWallet(walletProfile, oauthPassword);

      // Clear session
      sessionStorage.removeItem('oauth_temp_token');
      sessionStorage.removeItem('oauth_temp_provider');
      sessionStorage.removeItem('oauth_temp_user');

      // Store auth
      await walletStorage.setSecureItem('jwt', token);
      await walletStorage.setSecureItem('authMethod', provider);
      await walletStorage.setSecureItem('user', user);

      // Login
      doLogIn(walletProfile, profiles);

      setShowOAuthPasswordSetup(false);
      setOpenWalletModal(false);
      setOAuthPassword('');
      setImportSeed('');

      openSnackbar('Wallet imported from seed!', 'success');
    } catch (error) {
      setOAuthPasswordError(error.message || 'Invalid seed phrase');
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const handleImportWallet = async () => {
    setIsCreatingWallet(true);
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

      // Import the wallet with the password
      const walletStorageInstance = walletStorage || new EncryptedWalletStorage();

      // Store the imported wallet
      const wallet = {
        address: importData.address,
        provider: provider,
        wallet_type: 'oauth',
        imported: true,
        encryptedData: importData.data
      };

      // Store with password encryption
      await walletStorageInstance.storeWallet(wallet, oauthPassword);

      // Clear temporary session data
      sessionStorage.removeItem('oauth_temp_token');
      sessionStorage.removeItem('oauth_temp_provider');
      sessionStorage.removeItem('oauth_temp_user');
      sessionStorage.removeItem('oauth_action');

      // Store permanent auth data
      await walletStorage.setSecureItem('jwt', token);
      await walletStorage.setSecureItem('authMethod', provider);
      await walletStorage.setSecureItem('user', user);

      // Login with the imported wallet
      doLogIn(wallet, profiles);

      // Close dialogs
      setShowOAuthPasswordSetup(false);
      setOpenWalletModal(false);

      // Reset state
      setOAuthPassword('');
      setOAuthConfirmPassword('');
      setImportFile(null);
      setImportMethod('new');

      openSnackbar('Wallet imported successfully!', 'success');
    } catch (error) {
      console.error('Import error:', error);
      setOAuthPasswordError(error.message || 'Failed to import wallet');
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const handleAdditionalPinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !additionalWalletPin[index] && index > 0) {
      additionalPinRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter' && additionalWalletPin.every(b => b)) {
      handleAdditionalWalletPinSubmit();
    }
  };

  const completeDeviceAuthentication = async (deviceId, userPin) => {
    try {
      setStatus('discovering');

      // Store for future use
      await walletStorage.storeWalletCredential(deviceId, userPin);

      // Generate only 1 wallet initially for performance
      const wallets = [];
      const i = 0; // Generate only the first wallet

      // Use PBKDF2 to generate wallet with PIN
      const entropyString = `xrpl-passkey-${deviceId}-${userPin}-${i}`;
      // Use lower iterations since passkey already provides hardware security
      // 10,000 iterations provides reasonable additional entropy without blocking UI
      const seedHash = CryptoJS.PBKDF2(entropyString, `salt-${deviceId}`, {
        keySize: 256/32,
        iterations: 10000,
        hasher: CryptoJS.algo.SHA512
      }).toString();

      // Convert hash to entropy array (32 bytes)
      const entropy = [];
      for (let j = 0; j < 32; j++) {
        entropy.push(parseInt(seedHash.substr(j * 2, 2), 16));
      }

      let wallet;
      try {
        wallet = XRPLWallet.fromEntropy(entropy);
      } catch (walletErr) {
        throw new Error(`Wallet generation failed: ${walletErr.message}`);
      }

      wallets.push({
        deviceKeyId: deviceId,
        accountIndex: i,
        account: wallet.address,
        address: wallet.address,
        publicKey: wallet.publicKey,
        wallet_type: 'device',
        xrp: '0',
        createdAt: Date.now()
      })

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
        } else {
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

      // Close modal after brief delay to show success
      setTimeout(() => {
        setOpenWalletModal(false);
        setStatus('idle');
        setShowDeviceLogin(false);
      }, 500);
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
      const response = await fetch(`https://api.xrpl.to/api/account/account_info/${address}`);

      // Handle 404 silently - account not activated yet
      if (response.status === 404) {
        return false;
      }

      // Handle other non-200 responses
      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      if (data.account_data && data.account_data.Balance) {
        const balance = parseFloat(data.account_data.Balance) / 1000000; // XRP drops to XRP conversion (1 XRP = 1,000,000 drops)
        return balance >= 1; // Consider active if has at least 1 XRP
      }
      return false;
    } catch (err) {
      return false;
    }
  }, []);

  useEffect(() => {
    const checkVisibleAccountsActivation = async () => {
      // Don't check if no user is logged in
      if (!accountProfile) return;

      if (profiles.length === 0) return;

      setIsCheckingActivation(true);
      const startTime = performance.now();

      // Get visible accounts (exclude current account, then take first visibleAccountCount)
      const otherAccounts = profiles.filter(profile => profile.account !== accountProfile?.account);
      const visibleAccounts = otherAccounts.slice(0, visibleAccountCount);
      const uncheckedAccounts = visibleAccounts.filter(
        profile => !(profile.account in accountsActivation)
      );

      // Also check current account if not already checked
      if (accountProfile?.account && !(accountProfile.account in accountsActivation)) {
        uncheckedAccounts.unshift({ account: accountProfile.account });
      }

      if (uncheckedAccounts.length === 0) {
        setIsCheckingActivation(false);
        return;
      }


      // Process in smaller batches to avoid rate limiting
      const batchSize = 3;
      const newActivationStatus = { ...accountsActivation };
      let activeCount = 0;

      for (let i = 0; i < uncheckedAccounts.length; i += batchSize) {
        const batch = uncheckedAccounts.slice(i, i + batchSize);
        const batchPromises = batch.map(async (profile) => {
          const isActive = await checkAccountActivity(profile.account);
          return { account: profile.account, isActive };
        });

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(({ account, isActive }) => {
          newActivationStatus[account] = isActive;
          if (isActive) activeCount++;
        });

        // Add delay between batches to avoid rate limiting
        if (i + batchSize < uncheckedAccounts.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const totalActive = Object.values(newActivationStatus).filter(Boolean).length;


      setAccountsActivation(newActivationStatus);
      setIsCheckingActivation(false);
    };

    checkVisibleAccountsActivation();
  }, [profiles, visibleAccountCount, accountsActivation, checkAccountActivity, accountProfile]);

  const generateWalletsFromDeviceKey = async (deviceKeyId, existingSignatureEntropy = null) => {
    const wallets = [];

    let signatureEntropy;

    if (existingSignatureEntropy) {
      // Reuse signature entropy from previous authentication
      signatureEntropy = existingSignatureEntropy;
    } else if (existingSignatureEntropy === null) {
      // Registration case - create a mock signature entropy for deterministic generation
      signatureEntropy = 'registration-mock-entropy-' + deviceKeyId;
    } else {
      // Generate signature entropy - required for secure wallet generation
      signatureEntropy = await generateSignatureEntropy(deviceKeyId);
    }


    if (!signatureEntropy) {
      throw new Error('WebAuthn authentication returned empty signature entropy');
    }


    // Generate only 1 wallet for performance
    const i = 0;
    const wallet = await generateSecureDeterministicWallet(deviceKeyId, i, signatureEntropy);
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
    setSeedAuthStatus('authenticating');

    try {
      if (profile.wallet_type === 'oauth' || profile.wallet_type === 'social') {
        // OAuth wallets - show password input
        setSeedAuthStatus('password-required');
        return;
      } else if (profile.wallet_type === 'pin') {
        // PIN wallets
        const pin = prompt('Enter your 6-digit PIN to view seed:');
        if (!pin) {
          setSeedAuthStatus('idle');
          setShowSeedDialog(false);
          return;
        }

        try {
          const wallets = await walletStorage.getWallets(pin);
          const currentWallet = wallets.find(w => w.address === profile.address);
          if (currentWallet && currentWallet.seed) {
            setSeedAuthStatus('success');
            setDisplaySeed(currentWallet.seed);
            setSeedBlurred(true);
          } else {
            throw new Error('Wallet not found');
          }
        } catch (error) {
          setSeedAuthStatus('error');
          openSnackbar('Failed to decrypt wallet: ' + error.message, 'error');
          return;
        }
      } else {
        // Device wallets - use WebAuthn
        await loadDependencies();

        const challengeBuffer = crypto.getRandomValues(new Uint8Array(32));
        const challenge = base64urlEncode(challengeBuffer);

        const authResponse = await startAuthentication({
          optionsJSON: {
            challenge: challenge,
            timeout: 30000,
            userVerification: 'required'
          }
        });

        if (authResponse.id) {
          setSeedAuthStatus('success');
          const seed = profile.seed || 'Seed not available';
          setDisplaySeed(seed);
          setSeedBlurred(true);
        }
      }
    } catch (err) {
      setSeedAuthStatus('error');
      openSnackbar('Authentication failed: ' + err.message, 'error');
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
        console.log('OAuth auto-login with profile:', profile);

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
        console.error('Error parsing OAuth wallet profile:', error);
      }
    }

    // Check if we need to show OAuth password setup
    const oauthToken = sessionStorage.getItem('oauth_temp_token');
    const oauthProvider = sessionStorage.getItem('oauth_temp_provider');

    if (oauthToken && oauthProvider) {
      // User came from OAuth and needs password setup
      setShowOAuthPasswordSetup(true);
      setOpenWalletModal(false);
      // Don't clear session data here - we need it for password setup
    } else if (sessionStorage.getItem('wallet_modal_open') === 'true') {
      // Just reopening wallet modal after OAuth redirect
      sessionStorage.removeItem('wallet_modal_open');
      setOpenWalletModal(true);
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
        console.log('Google OAuth response received');
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
        console.error('Google auth error:', error);
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
  }, []);

  // Load profiles from localStorage on mount
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        // Load profiles from localStorage (backward compatibility)
        const storedProfiles = localStorage.getItem('profiles');
        if (storedProfiles) {
          const parsedProfiles = JSON.parse(storedProfiles);

          // Remove duplicates
          const uniqueProfiles = [];
          const seen = new Set();

          parsedProfiles.forEach(profile => {
            if (!seen.has(profile.account)) {
              seen.add(profile.account);
              uniqueProfiles.push(profile);
            }
          });

          setProfiles(uniqueProfiles);
        }
      } catch (error) {
        console.error('Failed to load profiles:', error);
      }
    };
    initializeStorage();
  }, []); // Only run once on mount

  // OAuth 1.0a doesn't have the same rate limit issues as OAuth 2.0
  // So we can remove the availability checking
  useEffect(() => {
    if (open) {
      // OAuth 1.0a is always available
      setTwitterAvailable(true);
    }
  }, [open]);

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
        // Show inline PIN input instead of browser prompt
        setPendingDeviceId(registrationResponse.id);
        setDevicePinMode('create');
        setShowDevicePinInput(true);
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
        // Always ask for PIN on authentication for security
        setPendingDeviceId(authResponse.id);
        setDevicePinMode('verify');
        setShowDevicePinInput(true);
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
        // Extract signature entropy from the authentication response to avoid double prompts
        const signatureEntropy = extractSignatureEntropy(authResponse);

        // Generate wallet deterministically
        const wallets = await generateWalletsFromDeviceKey(authResponse.id, signatureEntropy);

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
          openSnackbar(`5 device wallets accessed`, 'success');
        }

        setOpen(false);
      }
    } catch (err) {
      openSnackbar('Failed to create/access device wallet: ' + err.message, 'error');
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
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: '12px',
              maxWidth: '320px',
              minHeight: accountProfile ? 'auto' : 'auto',
              background: 'transparent',
              boxShadow: 'none',
              position: 'fixed',
              top: '64px',
              right: '16px',
              left: 'auto',
              transform: 'none',
              margin: 0
            },
            zIndex: 9999
          }}
        >
          <DialogContent sx={{ p: 0 }}>
            <StyledPopoverPaper>
            {accountProfile ? (
              <>

                {!showSeedDialog ? (
                  <WalletContent
                    theme={theme}
                    accountLogin={accountLogin}
                    accountBalance={accountBalance}
                    accountTotalXrp={accountTotalXrp}
                    accountsActivation={accountsActivation}
                    profiles={profiles}
                    onClose={() => setOpen(false)}
                    onAccountSwitch={(account) => {
                      setActiveProfile(account);
                      setOpen(false);
                    }}
                    onLogout={handleLogout}
                    onRemoveProfile={removeProfile}
                    onBackupSeed={handleBackupSeed}
                    openSnackbar={openSnackbar}
                    accountProfile={accountProfile}
                    generateAdditionalWallet={generateAdditionalWallet}
                    showAdditionalWalletPin={showAdditionalWalletPin}
                    setShowAdditionalWalletPin={setShowAdditionalWalletPin}
                    additionalWalletPin={additionalWalletPin}
                    handleAdditionalPinChange={handleAdditionalPinChange}
                    handleAdditionalPinKeyDown={handleAdditionalPinKeyDown}
                    handleAdditionalWalletPinSubmit={handleAdditionalWalletPinSubmit}
                    additionalPinRefs={additionalPinRefs}
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
                  />
                ) : (
                  <Box sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ color: theme.palette.warning.main }}>Backup</Typography>
                          {accountProfile?.wallet_type === 'device' ? 'Backup Private Key' : 'Backup Seed Phrase'}
                        </Typography>
                        <Button size="small" onClick={() => { setShowSeedDialog(false); setSeedAuthStatus('idle'); setDisplaySeed(''); setSeedBlurred(true); }}>
                          ×
                        </Button>
                      </Box>

                      {seedAuthStatus === 'authenticating' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                          <Typography>Loading...</Typography>
                          <Typography>Authenticating with passkey...</Typography>
                        </Box>
                      )}

                      {seedAuthStatus === 'password-required' && (
                        <Box sx={{ p: 2 }}>
                          <Typography variant="body2" sx={{ mb: 2, fontSize: '0.85rem', opacity: 0.8 }}>
                            Enter your password to view the seed phrase
                          </Typography>
                          <TextField
                            fullWidth
                            type={showSeedPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={seedPassword}
                            onChange={(e) => setSeedPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSeedPasswordSubmit()}
                            autoFocus
                            size="small"
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
                              disabled={!seedPassword}
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
                          <Alert severity="warning">
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.8rem' }}>
                              Keep this {accountProfile?.wallet_type === 'device' ? 'private key' : 'seed phrase'} secure
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1, fontSize: '0.75rem' }}>
                              Anyone with access to this {accountProfile?.wallet_type === 'device' ? 'private key' : 'seed'} can control your wallet. Store it safely offline.
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.65rem', opacity: 0.8, wordBreak: 'break-all' }}>
                              Address: {accountLogin}
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.65rem', opacity: 0.7, mt: 0.5 }}>
                              This backup only restores funds in this specific wallet address.
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

                          <Stack direction="row" spacing={1} sx={{ alignSelf: 'flex-start', flexWrap: 'wrap' }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => setSeedBlurred(!seedBlurred)}
                              sx={{ fontSize: '0.75rem' }}
                            >
                              {seedBlurred ? 'Reveal' : 'Hide'} {accountProfile?.wallet_type === 'device' ? 'Key' : 'Seed'}
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => {
                                navigator.clipboard.writeText(displaySeed).then(() => {
                                  openSnackbar('Seed copied to clipboard', 'success');
                                });
                              }}
                              sx={{ fontSize: '0.75rem' }}
                            >
                              Copy {accountProfile?.wallet_type === 'device' ? 'Key' : 'Seed'}
                            </Button>
                            {(accountProfile?.wallet_type === 'oauth' || accountProfile?.wallet_type === 'social') && (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={async () => {
                                  try {
                                    // Get encrypted wallet data from storage
                                    const encryptedData = await walletStorage.getEncryptedWalletBlob(accountProfile.address);
                                    if (!encryptedData) {
                                      openSnackbar('No encrypted backup available', 'error');
                                      return;
                                    }

                                    // Create downloadable blob - NO METADATA EXPOSED
                                    const blob = new Blob([JSON.stringify({
                                      version: encryptedData.version,
                                      format: encryptedData.format,
                                      data: encryptedData.data // Only encrypted blob
                                      // NO address, provider, or other metadata
                                    }, null, 2)], { type: 'application/json' });

                                    // Create download link
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `xrpl-wallet-${accountProfile.address.slice(0, 8)}-encrypted.json`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);

                                    openSnackbar('Encrypted backup downloaded', 'success');
                                  } catch (error) {
                                    openSnackbar('Failed to download backup: ' + error.message, 'error');
                                  }
                                }}
                                sx={{ fontSize: '0.75rem' }}
                              >
                                Download Encrypted
                              </Button>
                            )}
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
                      {/* Primary Option - Passkeys */}
                      <Button
                        variant="contained"
                        onClick={() => setShowDeviceLogin(true)}
                        fullWidth
                        startIcon={<SecurityOutlined sx={{ fontSize: '1.1rem' }} />}
                        sx={{
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

                      {/* Social Options */}
                      <Stack spacing={1}>
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
                          Google
                        </Button>

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
                          X
                        </Button>

                        <Button
                          variant="outlined"
                          fullWidth
                          disabled
                          sx={{
                            py: 1.5,
                            fontSize: '0.9rem',
                            fontWeight: 400,
                            textTransform: 'none',
                            borderRadius: '12px',
                            borderWidth: '1px',
                            '&.Mui-disabled': {
                              borderColor: alpha(theme.palette.divider, 0.1),
                              color: alpha(theme.palette.text.secondary, 0.3)
                            }
                          }}
                        >
                          Discord (Soon)
                        </Button>
                      </Stack>

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
                        <Alert severity="error" sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Hardware Security Required</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1.5 }}>
                            {error}
                          </Typography>
                        </Alert>
                      )}

                      {/* Inline PIN Input for Device Connect */}
                      {showDevicePinInput && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                            {devicePinMode === 'create'
                              ? 'Create a 6-digit PIN to secure your wallet'
                              : 'Enter your 6-digit PIN to access your wallet'}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
                            {devicePin.map((value, index) => (
                              <PinField
                                key={index}
                                inputRef={el => devicePinRefs.current[index] = el}
                                value={value}
                                onChange={(e) => handleDevicePinChange(index, e.target.value)}
                                onKeyDown={(e) => handleDevicePinKeyDown(index, e)}
                                type="text"
                                inputProps={{
                                  maxLength: 1,
                                  autoComplete: 'off',
                                  inputMode: 'numeric',
                                  pattern: '[0-9]*'
                                }}
                                variant="outlined"
                                autoFocus={index === 0}
                              />
                            ))}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => {
                                setShowDevicePinInput(false);
                                setDevicePin(['', '', '', '', '', '']);
                                setStatus('idle');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={handleDevicePinSubmit}
                              disabled={devicePin.some(p => !p)}
                            >
                              {devicePinMode === 'create' ? 'Create PIN' : 'Verify PIN'}
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
                          {status === 'authenticating' ? 'Authenticating...' : status === 'discovering' ? 'Discovering...' : 'Sign In (Existing Key)'}
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
                  }
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogContent>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h5" gutterBottom>
                  Setup Your Wallet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose to create a new wallet or import an existing one.
                </Typography>
              </Box>

              {/* Import/New Wallet Toggle */}
              <Box sx={{
                display: 'flex',
                gap: 0.5,
                p: 0.5,
                background: alpha(theme.palette.divider, 0.05),
                borderRadius: '8px'
              }}>
                <Button
                  variant={importMethod === 'new' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => {
                    setImportMethod('new');
                    setImportFile(null);
                    setImportSeed('');
                  }}
                  sx={{
                    flex: 1,
                    fontSize: '0.75rem',
                    py: 0.8
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
                  }}
                  sx={{
                    flex: 1,
                    fontSize: '0.75rem',
                    py: 0.8
                  }}
                >
                  Seed
                </Button>
                <Button
                  variant={importMethod === 'import' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => {
                    setImportMethod('import');
                    setImportSeed('');
                  }}
                  sx={{
                    flex: 1,
                    fontSize: '0.75rem',
                    py: 0.8
                  }}
                >
                  File
                </Button>
              </Box>

              {oauthPasswordError && (
                <Alert severity="error" onClose={() => setOAuthPasswordError('')}>
                  {oauthPasswordError}
                </Alert>
              )}

              {/* Seed Input for Import */}
              {importMethod === 'seed' && (
                <TextField
                  label="Family Seed"
                  placeholder="Enter your seed starting with 's'"
                  value={importSeed}
                  onChange={(e) => setImportSeed(e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  helperText={
                    importSeed.startsWith('sEd') ? '✓ Ed25519 seed detected' :
                    importSeed.startsWith('s') ? '✓ secp256k1 seed detected' :
                    'Your XRP Ledger secret key (starts with "s")'
                  }
                  sx={{
                    '& .MuiInputBase-input': {
                      fontFamily: 'monospace',
                      fontSize: '0.85rem'
                    },
                    '& .MuiFormHelperText-root': {
                      color: importSeed.startsWith('s') ? 'success.main' : 'text.secondary'
                    }
                  }}
                />
              )}

              {/* File Upload for Import */}
              {importMethod === 'import' && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontSize: '0.85rem' }}>
                    Select your encrypted wallet backup file
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    sx={{
                      py: 1.5,
                      borderStyle: 'dashed',
                      borderWidth: '2px',
                      backgroundColor: importFile ? alpha(theme.palette.success.main, 0.05) : 'transparent'
                    }}
                  >
                    {importFile ? `✓ ${importFile.name}` : 'Choose Wallet File'}
                    <input
                      type="file"
                      hidden
                      accept=".json,application/json"
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
                helperText={importMethod === 'import' ?
                  'Enter the password used when you backed up this wallet' :
                  'Minimum 8 characters'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowOAuthPassword(!showOAuthPassword)}
                        edge="end"
                        size="small"
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
                />
              )}

              <Alert severity="info">
                <Typography variant="body2">
                  {importMethod === 'import' ?
                    <><strong>Note:</strong> You'll be importing your existing wallet with its current balance and history.</> :
                    <><strong>Important:</strong> Store this password safely. You'll need it to export your wallet or recover it on a new device.</>
                  }
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', gap: 2 }}>
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
                              }}
                  disabled={isCreatingWallet}
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
                    (importMethod === 'seed' && !importSeed)}
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
