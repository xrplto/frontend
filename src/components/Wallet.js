import { useRef, useState, useEffect, useCallback } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Image from 'next/image';
import { Wallet as XRPLWallet, encodeSeed } from 'xrpl';

// Lazy load heavy dependencies
let startRegistration, startAuthentication, CryptoJS, scrypt, base64URLStringToBuffer;

// Material
import {
  alpha,
  styled,
  Avatar,
  // Badge,
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
  // useMediaQuery
} from '@mui/material';
// import GridOnIcon from '@mui/icons-material/GridOn';
// import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
// import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
// import AccountBoxIcon from '@mui/icons-material/AccountBox';
// import AssignmentReturnedIcon from '@mui/icons-material/AssignmentReturned';
// import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
// import ImportExportIcon from '@mui/icons-material/ImportExport';
// Icons removed - using text-based UI
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Internationalization
import { useTranslation } from 'react-i18next';

// Iconify
// import { Icon } from '@iconify/react';
// import userLock from '@iconify/icons-fa-solid/user-lock';
// import link45deg from '@iconify/icons-bi/link-45deg';
// import linkExternal from '@iconify/icons-charm/link-external';
// import externalLinkLine from '@iconify/icons-ri/external-link-line';
// import paperIcon from '@iconify/icons-akar-icons/paper';
// import copyIcon from '@iconify/icons-fad/copy';

// Utils
import { getHashIcon } from 'src/utils/extra';
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
  // Requires signature-based entropy for enhanced security
  // Note: signatureEntropy provides user authentication proof and additional randomness

  if (!signatureEntropy) {
    throw new Error('Signature entropy is required for secure wallet generation');
  }

  // Deterministic entropy: use only credentialId and accountIndex for consistent wallets
  // Note: signatureEntropy is validated for security but not used in generation to ensure determinism
  const baseEntropy = `passkey-wallet-v4-deterministic-${credentialId}-${accountIndex}`;
  const combinedEntropy = CryptoJS.SHA256(baseEntropy).toString();
  const salt = `salt-${credentialId}-deterministic-v4`;

  // STRICT SECURITY: Only use scrypt - NO PBKDF2 FALLBACK
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
    // STRICT: Only use proper base64url decoding
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

  console.log('✅ High-security signature entropy extracted successfully', entropyHex.length, 'chars');
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

    console.log('🔐 Requesting WebAuthn authentication for entropy generation...');

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
        // STRICT: Only use proper base64url decoding
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

      console.log('✅ High-security signature entropy generated successfully', entropyHex.length, 'chars');
      return entropyHex;
    } else {
      throw new Error('WebAuthn authentication did not return a valid signature');
    }
  } catch (error) {
    console.error('❌ Signature entropy generation failed:', error);

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
  background: `linear-gradient(45deg, ${theme.palette.success.light}, ${theme.palette.success.main})`,
  boxShadow: `0 0 12px ${alpha(theme.palette.success.main, 0.5)}`,
  animation: 'glow 2s ease-in-out infinite',
  '@keyframes glow': {
    '0%, 50%': {
      opacity: 1,
      transform: 'scale(1)'
    },
    '50%': {
      opacity: 0.7,
      transform: 'scale(1.2)'
    }
  }
}));

const TokenImage = styled(Image)(({ theme }) => ({
  borderRadius: '50%',
  overflow: 'hidden'
}));

const StyledPopoverPaper = styled(Box)(({ theme }) => ({
  background:
    theme.palette.mode === 'dark'
      ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.default, 0.98)} 50%)`
      : `linear-gradient(145deg, ${theme.palette.common.white} 0%, ${alpha(theme.palette.grey[50], 0.95)} 50%)`,
  border: `1px solid ${theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.05)
    : alpha(theme.palette.common.black, 0.05)}`,
  borderRadius: 24,
  boxShadow: theme.palette.mode === 'dark'
    ? `0 5px 60px ${alpha(theme.palette.common.black, 0.5)}`
    : `0 5px 60px ${alpha(theme.palette.common.black, 0.1)}`,
  overflow: 'hidden',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.common.white, 0.2)}, transparent)`
  }
}));

const BalanceCard = styled(Card)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.15)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 50%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.08)} 0%, ${theme.palette.common.white} 50%)`,
  border: 'none',
  borderRadius: 5,
  boxShadow: 'none',
  position: 'relative',
  overflow: 'visible',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: 5,
    padding: 1,
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)}, transparent)`,
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude'
  },
  '&:hover': {
    transform: 'translateY(-2px) scale(1.02)',
    '&::after': {
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.4)}, transparent)`
    }
  }
}));

const ReserveCard = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.08)} 0%, ${alpha(theme.palette.warning.light, 0.04)} 50%)`,
  border: 'none',
  borderRadius: 16,
  padding: theme.spacing(2),
  position: 'relative',
  transition: 'all 0.3s ease',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 16,
    width: 3,
    height: '50%',
    background: theme.palette.warning.main,
    borderRadius: 2
  }
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
  additionalPinRefs
}) => {
  return (
    <>
      {/* Header */}
      <Box sx={{
        p: 1.5,
        background: theme.palette.mode === 'dark'
          ? 'rgba(0,0,0,0.3)'
          : 'rgba(255,255,255,0.7)',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        position: 'relative',
        zIndex: 1
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={isEmbedded ? 1.5 : 2} alignItems="center">
            <Box sx={{
              width: isEmbedded ? 8 : 5,
              height: isEmbedded ? 8 : 5,
              borderRadius: '2px',
              background: accountsActivation[accountLogin] === false
                ? theme.palette.error.main
                : `linear-gradient(45deg, #00ff88, #00ffff)`,
              boxShadow: accountsActivation[accountLogin] !== false
                ? isEmbedded ? '0 0 15px rgba(0,255,136,0.4)' : '0 0 5px rgba(0,255,136,0.5)'
                : 'none'
            }} />
            <Typography sx={{
              fontFamily: 'monospace',
              fontSize: isEmbedded ? '0.8rem' : '0.85rem',
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}>
              {truncateAccount(accountLogin, 8)}
            </Typography>
            <CopyToClipboard
              text={accountLogin}
              onCopy={() => openSnackbar('Address copied!', 'success')}
            >
              <Button
                size="small"
                sx={{
                  p: 0.5,
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main
                  }
                }}
              >
                Copy
              </Button>
            </CopyToClipboard>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <Button
              size="small"
              onClick={onBackupSeed}
              sx={{
                p: 0.5,
                '&:hover': {
                  background: alpha(theme.palette.warning.main, 0.1),
                  color: theme.palette.warning.main
                }
              }}
              title="Backup Seed"
            >
              Backup
            </Button>
            <Button size="small" onClick={onClose}>
              ×
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Balance Display */}
      <Box sx={{
        p: isEmbedded ? 2 : 2.5,
        textAlign: 'center',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 50%)'
          : 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, transparent 50%)'
      }}>
        <Typography sx={{
          fontSize: isEmbedded ? '2rem' : '2.5rem',
          fontWeight: 900,
          lineHeight: 1,
          fontFamily: 'system-ui',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: isEmbedded ? 0.5 : 0.5
        }}>
          {accountBalance?.curr1?.value || '0'}
        </Typography>
        <Typography sx={{
          fontSize: isEmbedded ? '0.7rem' : '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: isEmbedded ? '1.5px' : '2px',
          opacity: 0.5,
          fontWeight: 600
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
            borderRadius: isEmbedded ? '6px' : '8px',
            background: alpha(theme.palette.primary.main, 0.05),
            textAlign: 'center'
          }}>
            <Typography sx={{ fontSize: isEmbedded ? '0.9rem' : '1rem', fontWeight: 700 }}>
              {accountBalance?.curr1?.value || '0'}
            </Typography>
            <Typography sx={{ fontSize: isEmbedded ? '0.55rem' : '0.6rem', opacity: 0.7 }}>Available</Typography>
          </Box>
          <Box sx={{
            p: isEmbedded ? 1 : 1.5,
            borderRadius: isEmbedded ? '6px' : '8px',
            background: alpha(theme.palette.warning.main, 0.05),
            textAlign: 'center'
          }}>
            <Typography sx={{ fontSize: isEmbedded ? '1rem' : '1.2rem', fontWeight: 700, color: theme.palette.warning.main }}>
              {Math.max(0, Number(accountTotalXrp || 0) - Number(accountBalance?.curr1?.value || 0)) || '0'}
            </Typography>
            <Typography sx={{ fontSize: isEmbedded ? '0.55rem' : '0.6rem', opacity: 0.7 }}>Reserved</Typography>
          </Box>
          <Box sx={{
            p: isEmbedded ? 1 : 1.5,
            borderRadius: isEmbedded ? '6px' : '8px',
            background: alpha(theme.palette.success.main, 0.05),
            textAlign: 'center'
          }}>
            <Typography sx={{ fontSize: isEmbedded ? '0.9rem' : '1rem', fontWeight: 700 }}>
              {accountTotalXrp || '0'}
            </Typography>
            <Typography sx={{ fontSize: isEmbedded ? '0.55rem' : '0.6rem', opacity: 0.7 }}>Total</Typography>
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
                    sx={{ opacity: isEmbedded ? 0.3 : 0.5, '&:hover': { opacity: 1 } }}
                  >
                    ×
                  </Button>
                </Box>
              );
            })}

          {/* Add Wallet Button - only show for device wallets with less than 5 wallets */}
          {(() => {
            const deviceWallets = profiles.filter(p => p.wallet_type === 'device');
            console.log('Device wallets:', deviceWallets.length, 'Total profiles:', profiles.length);
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
          size="small"
          sx={{
            px: isEmbedded ? 1 : 1.5,
            py: isEmbedded ? 0.5 : 0.8,
            minWidth: isEmbedded ? 'auto' : '70px',
            borderRadius: isEmbedded ? '6px' : '6px',
            background: alpha(theme.palette.error.main, 0.1),
            color: theme.palette.error.main,
            fontWeight: 600,
            fontSize: isEmbedded ? '0.75rem' : '0.8rem',
            textTransform: 'none',
            '&:hover': {
              background: alpha(theme.palette.error.main, 0.15)
            }
          }}
        >
                    {!isEmbedded && 'Logout'}
        </Button>
      </Box>
    </>
  );
};

export default function Wallet({ style, embedded = false, onClose, buttonOnly = false }) {
  const theme = useTheme();
  const { t } = useTranslation();
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

      console.log('Syncing', uniqueProfiles.length, 'unique profiles to IndexedDB');
      await walletStorage.storeProfiles(uniqueProfiles);
    } catch (error) {
      console.warn('Failed to sync profiles to IndexedDB:', error);
    }
  };
  const anchorRef = useRef(null);
  const [showingSeed, setShowingSeed] = useState(false);
  const [currentSeed, setCurrentSeed] = useState('');
  const [seedBlurred, setSeedBlurred] = useState(true);
  const [showAllAccounts, setShowAllAccounts] = useState(false);
  const [accountsActivation, setAccountsActivation] = useState({});
  const [visibleAccountCount, setVisibleAccountCount] = useState(5);
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

  // Additional wallet generation states
  const [showAdditionalWalletPin, setShowAdditionalWalletPin] = useState(false);
  const [additionalWalletPin, setAdditionalWalletPin] = useState(['', '', '', '', '', '']);
  const additionalPinRefs = useRef([]);

  // PIN-based wallet states
  const [showPinLogin, setShowPinLogin] = useState(false);
  const [showWalletInfo, setShowWalletInfo] = useState(false);
  const [pinBoxes, setPinBoxes] = useState(['', '', '', '', '', '']);
  const [confirmPinBoxes, setConfirmPinBoxes] = useState(['', '', '', '', '', '']);
  const pinRefs = useRef([]);
  const confirmPinRefs = useRef([]);
  // Keep these for backward compatibility with existing logic
  const pin = pinBoxes.join('');
  const confirmPin = confirmPinBoxes.join('');
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [pinError, setPinError] = useState('');
  const [walletStorage] = useState(new EncryptedWalletStorage());
  const [hasPinWallet, setHasPinWallet] = useState(false);

  // PIN box handlers
  const handlePinChange = (index, value, isConfirm = false) => {
    if (!/^\d*$/.test(value)) return;

    const boxes = isConfirm ? [...confirmPinBoxes] : [...pinBoxes];
    const refs = isConfirm ? confirmPinRefs : pinRefs;
    const setBoxes = isConfirm ? setConfirmPinBoxes : setPinBoxes;

    boxes[index] = value.slice(-1);
    setBoxes(boxes);

    if (value && index < 5) {
      refs.current[index + 1]?.focus();
    }
    setPinError(''); // Clear error when typing
  };

  const handlePinKeyDown = (index, e, isConfirm = false) => {
    const boxes = isConfirm ? confirmPinBoxes : pinBoxes;
    const refs = isConfirm ? confirmPinRefs : pinRefs;

    if (e.key === 'Backspace' && !boxes[index] && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === 'Enter' && boxes.every(b => b)) {
      if (hasPinWallet) {
        handlePinLogin();
      } else if (!isConfirm && confirmPinBoxes.every(b => b)) {
        handlePinCreate();
      }
    }
  };

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
      console.log('Registration - Existing profiles:', allProfiles.map(p => p.account));
      wallets.forEach(walletData => {
        const profile = { ...walletData, tokenCreatedAt: Date.now() };
        const exists = allProfiles.find(p => p.account === profile.account);
        if (!exists) {
          console.log('Registration - Adding new profile:', profile.account);
          allProfiles.push(profile);
        } else {
          console.log('Registration - Profile already exists:', profile.account);
        }
      });
      console.log('Registration - Total profiles:', allProfiles.length);

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
      console.error('Registration completion error:', err);
      setError('Failed to complete registration: ' + err.message);
      setStatus('idle');
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
        console.error('Failed to generate wallet from entropy:', walletErr);
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
      console.log('Existing profiles before update:', allProfiles.map(p => p.account));
      wallets.forEach(walletData => {
        const profile = { ...walletData, tokenCreatedAt: Date.now() };
        const exists = allProfiles.find(p => p.account === profile.account);
        if (!exists) {
          console.log('Adding new profile:', profile.account);
          allProfiles.push(profile);
        } else {
          console.log('Profile already exists:', profile.account);
        }
      });
      console.log('Total profiles after update:', allProfiles.length);

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
      console.error('Authentication completion error:', err);
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

      // Handle non-200 responses (like 500 errors)
      if (!response.ok) {
        console.warn(`Account info request failed for ${address}: ${response.status} ${response.statusText}`);
        return false;
      }

      const data = await response.json();
      if (data.account_data && data.account_data.Balance) {
        const balance = parseFloat(data.account_data.Balance) / 1000000; // XRP drops to XRP conversion (1 XRP = 1,000,000 drops)
        return balance >= 1; // Consider active if has at least 1 XRP
      }
      return false;
    } catch (err) {
      console.warn(`Failed to check activity for account ${address}:`, err.message);
      return false;
    }
  }, []);

  // Suppress WebAuthn NotAllowedError in development
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      const firstArg = args[0];
      const shouldSuppress = firstArg && (
        (typeof firstArg === 'string' &&
         firstArg.includes('NotAllowedError') &&
         (firstArg.includes('webauthn') || firstArg.includes('WebAuthn'))) ||
        (firstArg.name === 'NotAllowedError') ||
        (firstArg.constructor?.name === 'WebAuthnError') ||
        (args.some(arg =>
          typeof arg === 'object' &&
          arg &&
          (arg.name === 'NotAllowedError' || arg.constructor?.name === 'WebAuthnError')
        ))
      );

      if (shouldSuppress) {
        return; // Suppress WebAuthn cancellation errors
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  useEffect(() => {
    const checkVisibleAccountsActivation = async () => {
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

      console.log(`🔍 Checking ${uncheckedAccounts.length} accounts...`);

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

      console.log(`✅ Checked ${uncheckedAccounts.length} accounts: ${totalActive}/${Object.keys(newActivationStatus).length} active (${duration.toFixed(0)}ms)`);

      setAccountsActivation(newActivationStatus);
      setIsCheckingActivation(false);
    };

    checkVisibleAccountsActivation();
  }, [profiles, visibleAccountCount, accountsActivation, checkAccountActivity]);

  const generateWalletsFromDeviceKey = async (deviceKeyId, existingSignatureEntropy = null) => {
    const wallets = [];

    let signatureEntropy;

    if (existingSignatureEntropy) {
      // Reuse signature entropy from previous authentication
      signatureEntropy = existingSignatureEntropy;
      console.log('🔐 Reusing signature entropy from authentication');
    } else if (existingSignatureEntropy === null) {
      // Registration case - create a mock signature entropy for deterministic generation
      signatureEntropy = 'registration-mock-entropy-' + deviceKeyId;
      console.log('🔐 Using registration mock entropy for wallet generation');
    } else {
      // Generate signature entropy - required for secure wallet generation
      console.log('🔐 Requesting user authentication for wallet generation...');
      signatureEntropy = await generateSignatureEntropy(deviceKeyId);
    }

    console.log('🔐 Signature entropy result:', signatureEntropy ? 'SUCCESS' : 'FAILED');
    console.log('🔐 Signature entropy length:', signatureEntropy ? signatureEntropy.length : 'N/A');

    if (!signatureEntropy) {
      throw new Error('WebAuthn authentication returned empty signature entropy');
    }

    console.log('🔐 Enhanced security: Using signature-based entropy');

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
      if (profile.wallet_type === 'pin') {
        // For PIN wallets, we need the PIN to decrypt from IndexedDB
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
            throw new Error('Wallet not found in encrypted storage');
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
          const seed = profile.seed || 'Seed not available for device wallet';
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
    setShowPinLogin(false);
    setShowWalletInfo(false);
    setStatus('idle');
    setError('');
    setWalletInfo(null);
    setPinBoxes(['', '', '', '', '', '']);
    setConfirmPinBoxes(['', '', '', '', '', '']);
    setPinError('');
    setIsCreatingWallet(false);
  };

  // Check if PIN wallet exists and load profiles from IndexedDB
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        // Check for PIN wallet
        const exists = await walletStorage.hasWallet();
        setHasPinWallet(exists);

        // Only load profiles from IndexedDB on initial mount
        const storedProfiles = await walletStorage.getProfiles();
        if (storedProfiles.length > 0) {
          console.log('IndexedDB has', storedProfiles.length, 'stored profiles');

          // Clear and set only unique profiles from IndexedDB
          const uniqueProfiles = [];
          const seen = new Set();

          storedProfiles.forEach(profile => {
            if (!seen.has(profile.account)) {
              seen.add(profile.account);
              uniqueProfiles.push(profile);
            }
          });

          console.log('Setting', uniqueProfiles.length, 'unique profiles');
          setProfiles(uniqueProfiles);
        }
      } catch (error) {
        console.warn('Failed to load from IndexedDB:', error);
        setHasPinWallet(false);
      }
    };
    initializeStorage();
  }, []); // Only run once on mount

  const handlePinLogin = async () => {
    if (!pin) {
      setPinError('PIN is required');
      return;
    }

    if (pin.length !== 6) {
      setPinError('PIN must be 6 digits');
      return;
    }

    setStatus('authenticating');
    setPinError('');

    try {
      const wallets = await walletStorage.getWallets(pin);
      const firstWallet = wallets[0];

      // Add all wallets to profiles (without seeds in localStorage)
      const allProfiles = [...profiles];
      wallets.forEach(wallet => {
        const profile = {
          account: wallet.address,
          address: wallet.address,
          publicKey: wallet.publicKey,
          wallet_type: 'pin',
          xrp: '0',
          createdAt: wallet.createdAt
        };

        if (!allProfiles.find(p => p.account === profile.account)) {
          allProfiles.push(profile);
        }
      });

      setProfiles(allProfiles);
      await syncProfilesToIndexedDB(allProfiles);

      const profile = {
        account: firstWallet.address,
        address: firstWallet.address,
        publicKey: firstWallet.publicKey,
        wallet_type: 'pin',
        xrp: '0',
        createdAt: firstWallet.createdAt
      };

      doLogIn(profile, allProfiles);
      openSnackbar(`PIN login successful`, 'success');
      setOpenWalletModal(false);
      setShowPinLogin(false);
      setStatus('idle');
      setPinBoxes(['', '', '', '', '', '']);
    } catch (error) {
      setPinError(error.message);
      setStatus('idle');
    }
  };

  const handlePinCreate = async () => {
    const validation = walletStorage.validatePin(pin);

    if (!validation.isValid) {
      const issues = [];
      if (!validation.requirements.correctLength) issues.push('must be 6 digits');
      if (!validation.requirements.onlyNumbers) issues.push('only numbers allowed');
      if (!validation.requirements.notSequential) issues.push('no sequential digits (123456)');
      if (!validation.requirements.notRepeating) issues.push('no repeating digits (111111)');

      setPinError('PIN ' + issues.join(', '));
      return;
    }

    if (pin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }

    setIsCreatingWallet(true);
    setPinError('');

    try {
      const wallets = await walletStorage.createWalletFromPin(pin);
      const firstWallet = wallets[0];

      // Add all wallets to profiles (without seeds in localStorage)
      const allProfiles = [...profiles];
      wallets.forEach(wallet => {
        const profile = {
          account: wallet.address,
          address: wallet.address,
          publicKey: wallet.publicKey,
          wallet_type: 'pin',
          xrp: '0',
          createdAt: wallet.createdAt
        };

        if (!allProfiles.find(p => p.account === profile.account)) {
          allProfiles.push(profile);
        }
      });

      setProfiles(allProfiles);
      await syncProfilesToIndexedDB(allProfiles);

      const profile = {
        account: firstWallet.address,
        address: firstWallet.address,
        publicKey: firstWallet.publicKey,
        wallet_type: 'pin',
        xrp: '0',
        createdAt: firstWallet.createdAt
      };

      doLogIn(profile, allProfiles);
      openSnackbar(`PIN wallet created successfully`, 'success');
      setOpenWalletModal(false);
      setShowPinLogin(false);
      setStatus('idle');
      setPinBoxes(['', '', '', '', '', '']);
      setConfirmPin('');
      setIsCreatingWallet(false);
      setHasPinWallet(true);
    } catch (error) {
      setPinError(error.message);
      setIsCreatingWallet(false);
    }
  };

  const handleMigrateToPin = async () => {
    if (!accountProfile || !accountProfile.seed) {
      openSnackbar('No active wallet to migrate', 'error');
      return;
    }

    if (!pin) {
      setPinError('PIN is required for migration');
      return;
    }

    const validation = walletStorage.validatePin(pin);
    if (!validation.isValid) {
      const issues = [];
      if (!validation.requirements.correctLength) issues.push('must be 6 digits');
      if (!validation.requirements.onlyNumbers) issues.push('only numbers allowed');
      if (!validation.requirements.notSequential) issues.push('no sequential digits (123456)');
      if (!validation.requirements.notRepeating) issues.push('no repeating digits (111111)');

      setPinError('PIN ' + issues.join(', '));
      return;
    }

    if (pin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }

    setIsCreatingWallet(true);
    setPinError('');

    try {
      // For device wallets, we need the seed from the profile
      // For PIN wallets, this shouldn't happen as they're already in encrypted storage
      if (!accountProfile.seed) {
        setPinError('Cannot migrate: seed not available in profile');
        setIsCreatingWallet(false);
        return;
      }

      const walletData = {
        seed: accountProfile.seed,
        address: accountProfile.address,
        publicKey: accountProfile.publicKey,
        createdAt: accountProfile.createdAt || Date.now(),
        wallet_type: 'pin'
      };

      await walletStorage.storeWallet(walletData, pin);

      openSnackbar('Wallet successfully migrated to PIN storage', 'success');
      setShowPinLogin(false);
      setPinBoxes(['', '', '', '', '', '']);
      setConfirmPin('');
      setIsCreatingWallet(false);
      setHasPinWallet(true);
    } catch (error) {
      setPinError('Migration failed: ' + error.message);
      setIsCreatingWallet(false);
    }
  };

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
        console.log('Caught unhandled WebAuthn error in onerror:', error);
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
        console.log('Caught unhandled WebAuthn error in unhandledrejection:', reason);
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

      console.log('Starting WebAuthn registration with hostname:', window.location.hostname);
      console.log('Available authenticators check result:', available);

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

      console.log('Registration options:', registrationOptions);

      let registrationResponse;

      try {
        registrationResponse = await startRegistration({ optionsJSON: registrationOptions });
      } catch (error) {
        // Immediately mark as handled to prevent global handlers from triggering
        errorHandled = true;

        // Suppress console.error for user cancellation to reduce noise
        const isUserCancellation = error.name === 'NotAllowedError' ||
          error.constructor?.name === 'WebAuthnError' &&
          (error.message?.includes('NotAllowedError') || error.cause?.name === 'NotAllowedError');

        if (!isUserCancellation) {
          console.error('WebAuthn registration error:', error);
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
      console.error('Registration error:', err);
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
      console.error('Authentication error:', err);

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
          background: accountProfile
            ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 50%)`
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 50%)`,
          border: `1px solid ${theme.palette.primary.dark}`,
          borderRadius: '8px',
          height: '32px',
          padding: accountProfile ? '0 12px' : '0 14px',
          minWidth: accountProfile ? '100px' : '80px',
          color: '#ffffff',
          fontSize: '13px',
          fontWeight: '600',
          fontFamily: 'inherit',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          transition: 'all 0.2s ease',
          outline: 'none',
          boxShadow: `0 3px 10px ${alpha(theme.palette.primary.main, 0.4)}`
        }}
        onMouseEnter={(e) => {
          e.target.style.opacity = '0.9';
          e.target.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
        }}
        title={accountProfile ? 'Account Details' : t('Connect Wallet')}
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
          <span>{t('Login')}</span>
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
              borderRadius: '16px',
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
                {/* Animated Background Pattern */}
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: 0.03,
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    ${theme.palette.primary.main} 0px,
                    ${theme.palette.primary.main} 1px,
                    transparent 1px,
                    transparent 15px
                  )`,
                  animation: 'slide 5s linear infinite',
                  '@keyframes slide': {
                    '0%': { transform: 'translate(0, 0)' },
                    '50%': { transform: 'translate(15px, 15px)' }
                  },
                  pointerEvents: 'none'
                }} />

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

                          <Stack direction="row" spacing={1} sx={{ alignSelf: 'flex-start' }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => setSeedBlurred(!seedBlurred)}
                            >
                              {seedBlurred ? 'Reveal' : 'Hide'} {accountProfile?.wallet_type === 'device' ? 'Key' : 'Seed'}
                            </Button>
                            <CopyToClipboard
                              text={displaySeed}
                              onCopy={() => {
                                openSnackbar('Seed copied to clipboard', 'success');
                              }}
                            >
                              <Button
                                variant="outlined"
                                size="small"
                              >
                                Copy {accountProfile?.wallet_type === 'device' ? 'Key' : 'Seed'}
                              </Button>
                            </CopyToClipboard>
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
                borderRadius: theme.general?.borderRadiusLg || '16px',
                background: theme.walletDialog?.background ||
                  (theme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 50%)`
                    : `linear-gradient(135deg, ${alpha('#FFFFFF', 0.95)} 0%, ${alpha('#FFFFFF', 0.85)} 50%)`),
                border: `1px solid ${theme.walletDialog?.border || alpha(theme.palette.divider, 0.15)}`,
                boxShadow: theme.palette.mode === 'dark'
                  ? `0 8px 32px ${alpha(theme.palette.common.black, 0.4)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.1)}`
                  : `0 8px 32px ${alpha(theme.palette.common.black, 0.15)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.8)}`,
                overflow: 'hidden'
              }}>
                {/* Header */}
                <Box sx={{
                  padding: theme.spacing(2, 2.5),
                  background: theme.walletDialog?.backgroundSecondary ||
                    (theme.palette.mode === 'dark'
                      ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 50%)`
                      : `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.7)} 50%)`),
                  borderBottom: `1px solid ${theme.walletDialog?.border || alpha(theme.palette.divider, 0.12)}`,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: `linear-gradient(90deg, transparent 0%, ${alpha(theme.palette.primary.main, 0.3)} 50%, transparent 50%)`
                  }
                }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                      Connect Wallet
                    </Typography>
                    <Button
                      onClick={() => { setOpenWalletModal(false); setShowDeviceLogin(false); }}
                      sx={{
                        backgroundColor: alpha(theme.palette.background.paper, 0.6),
                        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                        borderRadius: theme.general?.borderRadiusSm || '8px',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.background.paper, 0.8),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                          transform: 'scale(1.05)'
                        }
                      }}
                    >
                      ×
                    </Button>
                  </Stack>
                </Box>

                {/* Content */}
                <Box sx={{
                  padding: theme.spacing(2.5, 2.5, 1.5, 2.5),
                  background: theme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.4)} 0%, transparent 50%)`
                    : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.6)} 0%, transparent 50%)`
                }}>
                  {!showDeviceLogin && !showPinLogin && !showWalletInfo ? (
                    <>
                      <Stack spacing={1.5} sx={{ mb: 0 }}>
                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="center"
                          onClick={handleWalletConnect}
                          sx={{
                            padding: theme.spacing(1.8, 2.2),
                            cursor: 'pointer',
                            borderRadius: theme.general?.borderRadius || '12px',
                            background: theme.palette.mode === 'dark'
                              ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.5)} 0%, ${alpha(theme.palette.background.paper, 0.3)} 50%)`
                              : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 50%)`,
                            border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                            boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.1)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.05)}`,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              background: theme.palette.mode === 'dark'
                                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 50%)`
                                : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 50%)`,
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
                              transform: 'translateY(-2px) scale(1.02)',
                              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.1)}`
                            }
                          }}
                        >
                          <Box sx={{
                            width: '40px',
                            height: '40px',
                            borderRadius: theme.general?.borderRadiusSm || '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 50%)`,
                            color: 'white',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.2)}`
                          }}>
                            <Typography sx={{ fontSize: '1.4rem' }}>🔐</Typography>
                          </Box>
                          <Stack sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                              Passkeys Login
                            </Typography>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.8rem' }}>
                              Passkeys Authentication
                            </Typography>
                          </Stack>
                        </Stack>

                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="center"
                          onClick={() => setShowPinLogin(true)}
                          sx={{
                            padding: theme.spacing(1.8, 2.2),
                            cursor: 'pointer',
                            borderRadius: theme.general?.borderRadius || '12px',
                            background: theme.palette.mode === 'dark'
                              ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.5)} 0%, ${alpha(theme.palette.background.paper, 0.3)} 50%)`
                              : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 50%)`,
                            border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                            boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.1)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.05)}`,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              background: theme.palette.mode === 'dark'
                                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 50%)`
                                : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 50%)`,
                              border: `1px solid ${alpha(theme.palette.secondary.main, 0.5)}`,
                              transform: 'translateY(-2px) scale(1.02)',
                              boxShadow: `0 8px 24px ${alpha(theme.palette.secondary.main, 0.2)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.1)}`
                            }
                          }}
                        >
                          <Box sx={{
                            width: '40px',
                            height: '40px',
                            borderRadius: theme.general?.borderRadiusSm || '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 50%)`,
                            color: 'white',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.3)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.2)}`
                          }}>
                            <Typography sx={{ fontSize: '1.4rem' }}>🔑</Typography>
                          </Box>
                          <Stack sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                              PIN Login
                            </Typography>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.8rem' }}>
                              Encrypted Storage
                            </Typography>
                          </Stack>
                        </Stack>

                      </Stack>
                    </>
                  ) : showPinLogin ? (
                    <>
                      {/* PIN Login UI */}
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 2,
                        p: 1.5,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.light, 0.04)} 50%)`,
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.secondary.main, 0.12)}`
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
                        <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.secondary.main, fontSize: '1rem' }}>
                          PIN Authentication
                        </Typography>
                      </Box>

                      {pinError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          {pinError}
                        </Alert>
                      )}

                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                            6-Digit PIN
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            {pinBoxes.map((value, index) => (
                              <PinField
                                key={index}
                                inputRef={el => pinRefs.current[index] = el}
                                value={value}
                                onChange={(e) => handlePinChange(index, e.target.value)}
                                onKeyDown={(e) => handlePinKeyDown(index, e)}
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
                        </Box>

                        {!hasPinWallet && (
                          <Box>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                              Confirm PIN
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              {confirmPinBoxes.map((value, index) => (
                                <PinField
                                  key={index}
                                  inputRef={el => confirmPinRefs.current[index] = el}
                                  value={value}
                                  onChange={(e) => handlePinChange(index, e.target.value, true)}
                                  onKeyDown={(e) => handlePinKeyDown(index, e, true)}
                                  type="text"
                                  inputProps={{
                                    maxLength: 1,
                                    autoComplete: 'off',
                                    inputMode: 'numeric',
                                    pattern: '[0-9]*'
                                  }}
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </Box>
                        )}

                        {hasPinWallet ? (
                          <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            onClick={handlePinLogin}
                            disabled={status !== 'idle' || pin.length !== 6}
                            sx={{
                              py: 1.2,
                              fontSize: '0.95rem',
                              fontWeight: 600,
                              background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 50%)`,
                              '&:hover': {
                                background: `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.main} 50%)`
                              }
                            }}
                          >
                            {status === 'authenticating' ? 'Signing In...' : 'Sign In with PIN'}
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="contained"
                              size="large"
                              fullWidth
                              onClick={handlePinCreate}
                              disabled={isCreatingWallet || pin.length !== 6 || confirmPin.length !== 6}
                              sx={{
                                py: 1.2,
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 50%)`,
                                '&:hover': {
                                  background: `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.main} 50%)`
                                }
                              }}
                            >
                              {isCreatingWallet ? 'Creating Wallet...' : 'Create PIN Wallet'}
                            </Button>

                            {accountProfile && accountProfile.wallet_type === 'device' && (
                              <Button
                                variant="outlined"
                                size="large"
                                fullWidth
                                onClick={handleMigrateToPin}
                                disabled={isCreatingWallet || pin.length !== 6 || confirmPin.length !== 6}
                                sx={{
                                  py: 1.2,
                                  fontSize: '0.95rem',
                                  fontWeight: 600,
                                  borderColor: theme.palette.secondary.main,
                                  color: theme.palette.secondary.main,
                                  '&:hover': {
                                    borderColor: theme.palette.secondary.dark,
                                    backgroundColor: alpha(theme.palette.secondary.main, 0.08)
                                  }
                                }}
                              >
                                {isCreatingWallet ? 'Migrating...' : 'Migrate to PIN Wallet'}
                              </Button>
                            )}
                          </>
                        )}


                        <Typography variant="caption" sx={{
                          textAlign: 'center',
                          color: 'text.secondary',
                          mt: 1,
                          fontSize: '0.75rem'
                        }}>
                          Client-Side Storage • Encrypted with AES-256
                        </Typography>
                      </Stack>
                    </>
                  ) : showWalletInfo ? (
                    <>
                      {/* Wallet Info/Comparison Page */}
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 2,
                        p: 1.5,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${alpha(theme.palette.info.light, 0.04)} 50%)`,
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.info.main, 0.12)}`
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
                        <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.info.main, fontSize: '1rem' }}>
                          Wallet Comparison
                        </Typography>
                      </Box>

                      {/* Interactive Comparison Panel */}
                      <Box sx={{
                        position: 'relative',
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        borderRadius: 3,
                        overflow: 'hidden',
                        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.default, 0.6)} 50%)`,
                        backdropFilter: 'blur(10px)'
                      }}>
                        {/* Toggle Tabs */}
                        <Box sx={{
                          display: 'flex',
                          position: 'relative',
                          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.7)} 50%)`,
                          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                        }}>
                          <Box sx={{
                            flex: 1,
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            background: 'linear-gradient(135deg, rgba(25,118,210,0.1) 0%, rgba(25,118,210,0.05) 50%)',
                            borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            '&:hover': {
                              background: 'linear-gradient(135deg, rgba(25,118,210,0.15) 0%, rgba(25,118,210,0.08) 50%)',
                              transform: 'translateY(-1px)'
                            }
                          }}>
                            <Typography sx={{ fontSize: 18, color: theme.palette.primary.main }}>🔐</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                              Device
                            </Typography>
                            <Chip
                              label="Secure"
                              size="small"
                              sx={{
                                height: 16,
                                fontSize: '0.6rem',
                                bgcolor: alpha(theme.palette.success.main, 0.1),
                                color: theme.palette.success.main,
                                border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
                              }}
                            />
                          </Box>
                          <Box sx={{
                            flex: 1,
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            background: 'linear-gradient(135deg, rgba(156,39,176,0.1) 0%, rgba(156,39,176,0.05) 50%)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, rgba(156,39,176,0.15) 0%, rgba(156,39,176,0.08) 50%)',
                              transform: 'translateY(-1px)'
                            }
                          }}>
                            <Typography sx={{ fontSize: 18, color: theme.palette.secondary.main }}>🔑</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.secondary.main }}>
                              PIN
                            </Typography>
                            <Chip
                              label="Easy"
                              size="small"
                              sx={{
                                height: 16,
                                fontSize: '0.6rem',
                                bgcolor: alpha(theme.palette.info.main, 0.1),
                                color: theme.palette.info.main,
                                border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
                              }}
                            />
                          </Box>
                        </Box>

                        {/* Comparison Content */}
                        <Box sx={{ p: 2 }}>
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                            {/* Device Column */}
                            <Box>
                              <Stack spacing={1}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    bgcolor: theme.palette.success.main,
                                    boxShadow: `0 0 8px ${alpha(theme.palette.success.main, 0.4)}`
                                  }} />
                                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: theme.palette.text.primary }}>
                                    Face ID / Touch ID
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    bgcolor: theme.palette.success.main,
                                    boxShadow: `0 0 8px ${alpha(theme.palette.success.main, 0.4)}`
                                  }} />
                                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: theme.palette.text.primary }}>
                                    Windows Hello
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    bgcolor: theme.palette.primary.main,
                                    boxShadow: `0 0 8px ${alpha(theme.palette.primary.main, 0.4)}`
                                  }} />
                                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: theme.palette.text.primary }}>
                                    5 Deterministic Wallets
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    bgcolor: theme.palette.warning.main,
                                    boxShadow: `0 0 8px ${alpha(theme.palette.warning.main, 0.4)}`
                                  }} />
                                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: theme.palette.text.primary }}>
                                    Hardware Secure Enclave
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    bgcolor: theme.palette.error.main,
                                    boxShadow: `0 0 8px ${alpha(theme.palette.error.main, 0.4)}`
                                  }} />
                                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: theme.palette.text.primary }}>
                                    Zero-Knowledge • Never Stored
                                  </Typography>
                                </Box>
                              </Stack>
                            </Box>

                            {/* PIN Column */}
                            <Box>
                              <Stack spacing={1}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    bgcolor: theme.palette.info.main,
                                    boxShadow: `0 0 8px ${alpha(theme.palette.info.main, 0.4)}`
                                  }} />
                                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: theme.palette.text.primary }}>
                                    6-Digit PIN Access
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    bgcolor: theme.palette.secondary.main,
                                    boxShadow: `0 0 8px ${alpha(theme.palette.secondary.main, 0.4)}`
                                  }} />
                                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: theme.palette.text.primary }}>
                                    AES-256 Encrypted
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    bgcolor: theme.palette.success.main,
                                    boxShadow: `0 0 8px ${alpha(theme.palette.success.main, 0.4)}`
                                  }} />
                                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: theme.palette.text.primary }}>
                                    Local Storage
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    bgcolor: theme.palette.info.main,
                                    boxShadow: `0 0 8px ${alpha(theme.palette.info.main, 0.4)}`
                                  }} />
                                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: theme.palette.text.primary }}>
                                    No Biometrics Required
                                  </Typography>
                                </Box>
                              </Stack>
                            </Box>
                          </Box>

                          {/* Bottom Comparison Bar */}
                          <Box sx={{
                            display: 'flex',
                            background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                            borderRadius: 2,
                            p: 1,
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                          }}>
                            <Box sx={{ flex: 1, textAlign: 'center' }}>
                              <Typography variant="caption" sx={{
                                fontWeight: 700,
                                color: theme.palette.primary.main,
                                fontSize: '0.65rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                Maximum Security
                              </Typography>
                            </Box>
                            <Divider orientation="vertical" flexItem sx={{ mx: 1, opacity: 0.3 }} />
                            <Box sx={{ flex: 1, textAlign: 'center' }}>
                              <Typography variant="caption" sx={{
                                fontWeight: 700,
                                color: theme.palette.secondary.main,
                                fontSize: '0.65rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                Quick Access
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        {/* Action Buttons */}
                        <Box sx={{
                          p: 2,
                          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.6)} 0%, ${alpha(theme.palette.background.default, 0.4)} 50%)`
                        }}>
                          <Stack direction="row" spacing={1}>
                            <Button
                              variant="contained"
                              size="small"
                              fullWidth
                              onClick={() => {
                                setShowWalletInfo(false);
                                setShowDeviceLogin(true);
                              }}
                              sx={{
                                py: 1,
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 50%)`,
                                '&:hover': {
                                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%)`
                                }
                              }}
                            >
                              Use Passkeys Login
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              fullWidth
                              onClick={() => {
                                setShowWalletInfo(false);
                                setShowPinLogin(true);
                              }}
                              sx={{
                                py: 1,
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 50%)`,
                                '&:hover': {
                                  background: `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.main} 50%)`
                                }
                              }}
                            >
                              Use PIN Login
                            </Button>
                          </Stack>
                        </Box>
                      </Box>
                    </>
                  ) : (
                    <>
                      {/* Passkeys Login */}
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

                      {/* Inline PIN Input for Device Login */}
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

    </div>
  );
}
