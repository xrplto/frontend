import { useRef } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Image from 'next/image';
import { startAuthentication } from '@simplewebauthn/browser';
import { Wallet as XRPLWallet } from 'xrpl';
import CryptoJS from 'crypto-js';

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
  IconButton,
  Link,
  MenuItem,
  Popover,
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
import SettingsIcon from '@mui/icons-material/Settings';
// import AssignmentReturnedIcon from '@mui/icons-material/AssignmentReturned';
// import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
// import ImportExportIcon from '@mui/icons-material/ImportExport';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LogoutIcon from '@mui/icons-material/Logout';
// import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import HelpIcon from '@mui/icons-material/Help';
import { AccountBalanceWallet as AccountBalanceWalletIcon } from '@mui/icons-material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

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

// const pair = {
//   '534F4C4F00000000000000000000000000000000': 'SOLO',
//   XRP: 'XRP'
// };

const ActiveIndicator = styled(Box)(({ theme }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  flexShrink: 0,
  backgroundColor: theme.palette.success.main,
  boxShadow: `0 0 0 2px ${alpha(theme.palette.success.main, 0.2)}`,
  animation: 'pulse 2s infinite',
  '@keyframes pulse': {
    '0%': {
      boxShadow: `0 0 0 0 ${alpha(theme.palette.success.main, 0.7)}`
    },
    '70%': {
      boxShadow: `0 0 0 4px ${alpha(theme.palette.success.main, 0)}`
    },
    '100%': {
      boxShadow: `0 0 0 0 ${alpha(theme.palette.success.main, 0)}`
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
      ? alpha(theme.palette.background.paper, 0.97)
      : alpha(theme.palette.background.paper, 0.99),
  backdropFilter: 'blur(24px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: 16,
  boxShadow: `
    0 8px 32px ${alpha(theme.palette.common.black, 0.08)},
    0 4px 16px ${alpha(theme.palette.common.black, 0.04)}
  `,
  overflow: 'hidden',
  position: 'relative'
}));

const BalanceCard = styled(Card)(({ theme }) => ({
  background:
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.background.paper, 0.6)
      : alpha(theme.palette.background.paper, 0.95),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: 12,
  backdropFilter: 'blur(16px)',
  boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.04)}`,
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: `0 6px 20px ${alpha(theme.palette.common.black, 0.06)}`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
  }
}));

const ReserveCard = styled(Box)(({ theme }) => ({
  background: alpha(theme.palette.warning.main, 0.05),
  border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
  borderRadius: 8,
  padding: theme.spacing(1.5),
  backdropFilter: 'blur(8px)',
  boxShadow: `0 2px 8px ${alpha(theme.palette.warning.main, 0.02)}`,
  transition: 'all 0.2s ease',
  '&:hover': {
    border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`,
    boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.04)}`
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

export default function Wallet({ style, embedded = false, onClose, buttonOnly = false }) {
  const theme = useTheme();
  const { t } = useTranslation();
  // const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const anchorRef = useRef(null);
  const {
    setActiveProfile,
    accountProfile,
    profiles,
    removeProfile,
    openSnackbar,
    darkMode,
    setOpenWalletModal,
    open,
    setOpen,
    accountBalance,
    handleOpen,
    handleClose,
    handleLogin,
    handleLogout,
    doLogIn
  } = useContext(AppContext);

  const generateWalletFromPasskey = (passkeyId, accountIndex = 0) => {
    const baseHash = CryptoJS.SHA256(passkeyId).toString();
    const indexedHash = CryptoJS.SHA256(baseHash + accountIndex.toString()).toString();
    const entropy = [];
    for (let i = 0; i < 32; i++) {
      entropy.push(parseInt(indexedHash.substr(i * 2, 2), 16));
    }
    return XRPLWallet.fromEntropy(entropy);
  };

  const handleAddPasskeyAccount = async () => {
    try {
      const passkeyId = localStorage.getItem('passkey-id');
      if (!passkeyId) {
        openSnackbar('No device login found. Please login with Device Login first.', 'error');
        return;
      }

      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const challengeB64 = btoa(String.fromCharCode(...challenge))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      await startAuthentication({
        challenge: challengeB64,
        timeout: 60000,
        userVerification: 'required',
        allowCredentials: [{
          id: passkeyId,
          type: 'public-key',
        }],
      });

      const existingAccounts = profiles.filter(p => p.wallet_type === 'device').length;
      const newWallet = generateWalletFromPasskey(passkeyId, existingAccounts);

      const profile = {
        account: newWallet.address,
        address: newWallet.address,
        publicKey: newWallet.publicKey,
        wallet_type: 'device',
        xrp: '0'
      };

      doLogIn(profile);

      // Update account count for future logins
      const currentCount = parseInt(localStorage.getItem('device-account-count') || '1');
      localStorage.setItem('device-account-count', (currentCount + 1).toString());

      openSnackbar(`New account created: ${newWallet.address.slice(0, 8)}...`, 'success');
      setOpen(false);
    } catch (err) {
      openSnackbar('Failed to create new account: ' + err.message, 'error');
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

  // Embedded panel mode - positioned by PageLayout
  if (embedded && accountProfile && open) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          background: theme.palette.background.default,
          borderLeft: `1px solid ${alpha(theme.palette.divider, 0.2)} !important`,
          boxShadow: 'none !important',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header Section */}
        <Box
          sx={{
            p: 1.5,
            pb: 1,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.15)} !important`,
            flexShrink: 0
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
              Wallet Details
            </Typography>

            <Stack direction="row" spacing={0.5}>
              <CopyToClipboard
                text={accountLogin}
                onCopy={() => openSnackbar('Address copied!', 'success')}
              >
                <Tooltip title="Copy Address">
                  <IconButton
                    size="small"
                    sx={{
                      '&:hover': {
                        background: alpha(theme.palette.primary.main, 0.1)
                      }
                    }}
                  >
                    <ContentCopyIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </CopyToClipboard>
              <Link
                underline="none"
                color="inherit"
                href={`/setting`}
                rel="noreferrer noopener nofollow"
              >
                <Tooltip title="Settings">
                  <IconButton
                    size="small"
                    onClick={() => setOpen(false)}
                    sx={{
                      '&:hover': {
                        background: alpha(theme.palette.primary.main, 0.1)
                      }
                    }}
                  >
                    <SettingsIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Link>
              <IconButton
                size="small"
                onClick={onClose || handleClose}
                sx={{
                  '&:hover': {
                    background: alpha(theme.palette.error.main, 0.1)
                  }
                }}
              >
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
          </Stack>
        </Box>

        {/* Scrollable Content */}
        <Box sx={{ p: 1.5, flex: 1, overflowY: 'auto' }}>
          {/* Account Info */}
          <Stack spacing={2}>
            <Box>
              <Typography
                variant="caption"
                sx={{ color: alpha(theme.palette.text.secondary, 0.7), mb: 0.5, display: 'block' }}
              >
                Account
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <TokenImage alt="photoURL" src={logoImageUrl} width={32} height={32} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {truncateAccount(accountLogin)}
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <ActiveIndicator />
                    <Typography variant="caption" sx={{ color: theme.palette.success.main }}>
                      Active
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* Balance Section */}
            <Box>
              <Typography
                variant="caption"
                sx={{ color: alpha(theme.palette.text.secondary, 0.7), mb: 0.5, display: 'block' }}
              >
                Portfolio Balance
              </Typography>
              <Stack spacing={0.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">
                    Available
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {accountBalance?.curr1?.value || '0'} XRP
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">
                    Reserve
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, color: theme.palette.warning.main }}
                  >
                    {Number(accountTotalXrp) - Number(accountBalance?.curr1?.value) || '0'} XRP
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">
                    Total
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {accountTotalXrp || '0'} XRP
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* Other Accounts Section */}
            {profiles.filter((profile) => profile.account !== accountLogin).length > 0 && (
              <>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: alpha(theme.palette.text.secondary, 0.7),
                      mb: 0.5,
                      display: 'block'
                    }}
                  >
                    Other Accounts
                  </Typography>
                  {profiles.map((profile, idx) => {
                    const account = profile.account;

                    if (account === accountLogin) return null;

                    const accountLogo = profile.logo;
                    const logoImageUrl = accountLogo
                      ? `https://s1.xrpl.to/profile/${accountLogo}`
                      : getHashIcon(account);

                    return (
                      <Box
                        key={'account' + idx}
                        sx={{
                          p: 1,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          '&:hover': {
                            background: alpha(theme.palette.primary.main, 0.08)
                          }
                        }}
                        onClick={() => {
                          setActiveProfile(account);
                          setOpen(false);
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <TokenImage alt="photoURL" src={logoImageUrl} width={24} height={24} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 500, display: 'block' }}
                            >
                              {truncateAccount(account, 8)}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeProfile(account);
                            }}
                            sx={{
                              padding: '2px',
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.error.main, 0.1)
                              }
                            }}
                          >
                            <CloseIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>
                <Divider />
              </>
            )}

            {/* Actions Section */}
            <Box>
              <Typography
                variant="caption"
                sx={{ color: alpha(theme.palette.text.secondary, 0.7), mb: 0.5, display: 'block' }}
              >
                Quick Actions
              </Typography>
              <Stack spacing={1}>
                <Link
                  underline="none"
                  color="inherit"
                  href={`/profile/${accountLogin}`}
                  rel="noreferrer noopener nofollow"
                >
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => setOpen(false)}
                    sx={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      color: theme.palette.text.primary,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08)
                      }
                    }}
                  >
                    View Full Profile
                  </Button>
                </Link>

                <Button
                  size="small"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={() => {
                    const hasDeviceAccount = profiles.some(p => p.wallet_type === 'device');
                    if (hasDeviceAccount) {
                      handleAddPasskeyAccount();
                    } else {
                      setOpenWalletModal(true);
                    }
                  }}
                  sx={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    color: theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08)
                    }
                  }}
                >
                  Add Account
                </Button>

                <Button
                  size="small"
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                  sx={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    color: theme.palette.error.main,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.error.main, 0.08)
                    }
                  }}
                >
                  Logout
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Box>
    );
  }

  // Default button mode with popover
  return (
    <div style={style}>
      <button
        onClick={() => {
          if (accountProfile) {
            // If buttonOnly, don't open popover, just toggle the embedded panel
            if (buttonOnly) {
              // Just toggle the embedded panel state
              setOpen(!open);
            } else {
              handleOpen();
            }
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
            ? theme.palette.primary.main
            : theme.palette.mode === 'dark'
              ? '#2d3436'
              : '#ffffff',
          border: accountProfile
            ? `1px solid ${theme.palette.primary.dark}`
            : `1px solid ${theme.palette.mode === 'dark' ? '#636e72' : '#ddd'}`,
          borderRadius: '6px',
          height: '32px',
          padding: '0 12px',
          color: accountProfile ? '#ffffff' : theme.palette.mode === 'dark' ? '#ffffff' : '#2d3436',
          fontSize: '14px',
          fontWeight: '500',
          fontFamily: 'inherit',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s ease',
          outline: 'none'
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21,18V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5V6H12C10.89,6 10,6.9 10,8V16A2,2 0 0,0 12,18M12,16H22V8H12M16,13.5A1.5,1.5 0 0,1 14.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,12A1.5,1.5 0 0,1 16,13.5Z" />
        </svg>
        {accountProfile && (
          <span style={{ fontFamily: 'monospace' }}>{truncateAccount(accountLogin, 6)}</span>
        )}
        {!accountProfile && <span>{t('Connect')}</span>}
      </button>

      {accountProfile && !buttonOnly && (
        <Popover
          open={open}
          onClose={handleClose}
          anchorEl={anchorRef.current}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          TransitionComponent={Fade}
          transitionDuration={300}
          PaperProps={{
            sx: {
              mt: 5.5,
              ml: 0.5,
              background: 'transparent',
              boxShadow: 'none',
              border: 'none',
              minWidth: 360
            }
          }}
        >
          <StyledPopoverPaper>
            {/* Header Section */}
            <Box sx={{ p: 3, pb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <IconButton
                  sx={{
                    padding: 0,
                    width: 44,
                    height: 44,
                    ...(open && {
                      '&:before': {
                        zIndex: 1,
                        content: "''",
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        position: 'absolute',
                        bgcolor: (theme) => alpha(theme.palette.grey[900], 0.72)
                      }
                    })
                  }}
                >
                  <TokenImage alt="photoURL" src={logoImageUrl} width={40} height={40} />
                </IconButton>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      mb: 0.5
                    }}
                  >
                    {truncateAccount(accountLogin)}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ActiveIndicator />
                    <Chip
                      label="Active Account"
                      size="small"
                      variant="outlined"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        borderColor: alpha(theme.palette.success.main, 0.3),
                        color: theme.palette.success.main,
                        backgroundColor: alpha(theme.palette.success.main, 0.1)
                      }}
                    />
                  </Stack>
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <CopyToClipboard
                    text={accountLogin}
                    onCopy={() => openSnackbar('Address copied!', 'success')}
                  >
                    <Tooltip title="Copy Address" arrow>
                      <IconButton
                        size="small"
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.2)
                          }
                        }}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CopyToClipboard>
                  <Link
                    underline="none"
                    color="inherit"
                    href={`/setting`}
                    rel="noreferrer noopener nofollow"
                  >
                    <Tooltip title="Settings" arrow>
                      <IconButton
                        size="small"
                        onClick={() => setOpen(false)}
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.2)
                          }
                        }}
                      >
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Link>
                </Stack>
              </Stack>
            </Box>

            {/* Balance Section */}
            <Box sx={{ px: 3, pb: 2 }}>
              <Typography
                variant="overline"
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: theme.palette.text.secondary,
                  mb: 1.5,
                  display: 'block'
                }}
              >
                Portfolio Balance
              </Typography>

              <BalanceCard elevation={0}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <TokenImage
                        src={'/xrp.svg'}
                        width={28}
                        height={28}
                        onError={(event) => (event.target.src = '/static/alt.webp')}
                      />
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                          XRP
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          XRP Ledger
                        </Typography>
                      </Box>
                    </Stack>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          fontSize: '1.4rem',
                          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                      >
                        {accountBalance?.curr1?.value || '0'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Available Balance
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </BalanceCard>

              {/* Reserve Information - Compact */}
              <ReserveCard sx={{ mt: 1.5, py: 1, px: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.warning.main,
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    >
                      Reserve
                    </Typography>
                    <Tooltip
                      title="XRP Ledger base reserve (1 XRP + 0.2 XRP per object)"
                      arrow
                      placement="top"
                    >
                      <HelpIcon
                        sx={{
                          width: 14,
                          height: 14,
                          color: theme.palette.warning.main,
                          opacity: 0.6
                        }}
                      />
                    </Tooltip>
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.warning.main,
                      fontSize: '0.8rem'
                    }}
                  >
                    {Number(accountTotalXrp) - Number(accountBalance?.curr1?.value) || '0'} XRP
                  </Typography>
                </Stack>
              </ReserveCard>

              {/* View Wallet Button */}
              <Link
                underline="none"
                color="inherit"
                href={`/profile/${accountLogin}`}
                rel="noreferrer noopener nofollow"
                sx={{ display: 'block', mt: 2 }}
              >
                <Button
                  key="account_profile"
                  onClick={() => setOpen(false)}
                  variant="contained"
                  startIcon={<VisibilityIcon />}
                  sx={{
                    width: '100%',
                    py: 1.5,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                      transform: 'translateY(-1px)',
                      boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.5)}`
                    }
                  }}
                >
                  View Wallet Details
                </Button>
              </Link>
            </Box>

            <Divider sx={{ mx: 0, opacity: 0.6 }} />

            {/* Other Accounts Section */}
            {profiles.filter((profile) => profile.account !== accountLogin).length > 0 && (
              <Box sx={{ py: 1 }}>
                <Typography
                  variant="overline"
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: theme.palette.text.secondary,
                    px: 3,
                    py: 1,
                    display: 'block'
                  }}
                >
                  Other Accounts
                </Typography>
                {profiles.map((profile, idx) => {
                  const account = profile.account;

                  if (account === accountLogin) return null;

                  const accountLogo = profile.logo;
                  const logoImageUrl = accountLogo
                    ? `https://s1.xrpl.to/profile/${accountLogo}`
                    : getHashIcon(account);

                  return (
                    <MenuItem
                      key={'account' + idx}
                      sx={{
                        typography: 'body2',
                        py: 1.5,
                        px: 3,
                        borderRadius: 0,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.08)
                        }
                      }}
                      onClick={() => {
                        setActiveProfile(account);
                        setOpen(false);
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                        <IconButton
                          sx={{
                            padding: 0,
                            width: 44,
                            height: 44,
                            ...(open && {
                              '&:before': {
                                zIndex: 1,
                                content: "''",
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                position: 'absolute',
                                bgcolor: (theme) => alpha(theme.palette.grey[900], 0.72)
                              }
                            })
                          }}
                        >
                          <TokenImage alt="photoURL" src={logoImageUrl} width={40} height={40} />
                        </IconButton>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {truncateAccount(account)}
                          </Typography>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <SwapHorizIcon
                              sx={{ fontSize: 14, color: theme.palette.text.secondary }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              Switch Account
                            </Typography>
                          </Stack>
                        </Box>
                        <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
                          <CopyToClipboard
                            text={account}
                            onCopy={() => openSnackbar('Address copied!', 'success')}
                          >
                            <Tooltip title="Copy Address">
                              <IconButton size="small">
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </CopyToClipboard>
                          <Tooltip title="Remove Account">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeProfile(account);
                              }}
                              sx={{
                                color: theme.palette.error.main,
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.error.main, 0.1)
                                }
                              }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    </MenuItem>
                  );
                })}
              </Box>
            )}

            <Divider sx={{ mx: 0, opacity: 0.6 }} />

            {/* Actions Section */}
            <Box sx={{ p: 1 }}>
              <MenuItem
                key="add_account"
                sx={{
                  typography: 'body2',
                  py: 1.5,
                  px: 3,
                  borderRadius: 2,
                  mx: 1,
                  mb: 0.5,
                  background: alpha(theme.palette.success.main, 0.04),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.success.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
                    transform: 'translateY(-1px)'
                  }
                }}
                onClick={() => {
                  const hasDeviceAccount = profiles.some(p => p.wallet_type === 'device');
                  if (hasDeviceAccount) {
                    handleAddPasskeyAccount();
                  } else {
                    setOpenWalletModal(true);
                  }
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <AddCircleOutlineIcon sx={{ color: 'inherit' }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Add Account
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Connect additional wallets
                    </Typography>
                  </Box>
                </Stack>
              </MenuItem>

              <MenuItem
                key="log_out"
                sx={{
                  typography: 'body2',
                  py: 1.5,
                  px: 3,
                  borderRadius: 2,
                  mx: 1,
                  background: alpha(theme.palette.error.main, 0.04),
                  border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.error.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`,
                    color: theme.palette.error.main,
                    transform: 'translateY(-1px)'
                  }
                }}
                onClick={handleLogout}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <LogoutIcon sx={{ color: 'inherit' }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Logout
                  </Typography>
                </Stack>
              </MenuItem>
            </Box>
          </StyledPopoverPaper>
        </Popover>
      )}
    </div>
  );
}
