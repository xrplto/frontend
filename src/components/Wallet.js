import { useRef } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Image from 'next/image';

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
  backgroundColor: '#00D4AA',
  boxShadow: `0 0 0 2px ${alpha('#00D4AA', 0.2)}`,
  animation: 'pulse 2s infinite',
  '@keyframes pulse': {
    '0%': {
      boxShadow: `0 0 0 0 ${alpha('#00D4AA', 0.7)}`
    },
    '70%': {
      boxShadow: `0 0 0 4px ${alpha('#00D4AA', 0)}`
    },
    '100%': {
      boxShadow: `0 0 0 0 ${alpha('#00D4AA', 0)}`
    }
  }
}));

const TokenImage = styled(Image)(({ theme }) => ({
  borderRadius: '50%',
  overflow: 'hidden'
}));

const StyledPopoverPaper = styled(Box)(({ theme }) => ({
  background: theme.walletDialog?.background || (theme.palette.mode === 'dark' 
    ? alpha(theme.palette.background.paper, 0.95)
    : alpha(theme.palette.background.paper, 0.98)),
  backdropFilter: 'blur(40px)',
  border: `2px solid ${theme.walletDialog?.border || alpha(theme.palette.divider, 0.1)}`,
  borderRadius: 20,
  boxShadow: `
    0 24px 48px ${alpha(theme.palette.common.black, 0.12)}, 
    0 12px 24px ${alpha(theme.palette.common.black, 0.08)},
    0 4px 16px ${alpha(theme.palette.primary.main, 0.06)},
    inset 0 1px 0 ${alpha(theme.palette.common.white, 0.1)}
  `,
  overflow: 'hidden',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: `linear-gradient(90deg, 
      ${theme.palette.primary.main} 0%, 
      ${theme.palette.success.main} 25%, 
      ${theme.palette.info.main} 50%, 
      ${theme.palette.warning.main} 75%, 
      ${theme.palette.error.main} 100%
    )`,
    borderRadius: '20px 20px 0 0',
    opacity: 0.9,
    animation: 'shimmer 3s ease-in-out infinite',
    zIndex: 1
  },
  '@keyframes shimmer': {
    '0%, 100%': { opacity: 0.9 },
    '50%': { opacity: 0.6 }
  }
}));

const BalanceCard = styled(Card)(({ theme }) => ({
  background: theme.walletDialog?.backgroundSecondary || (theme.palette.mode === 'dark' 
    ? alpha(theme.palette.background.paper, 0.4)
    : alpha(theme.palette.background.paper, 0.98)),
  border: `2px solid ${alpha(theme.palette.primary.main, 0.12)}`,
  borderRadius: 16,
  backdropFilter: 'blur(40px)',
  boxShadow: `
    0 12px 32px ${alpha(theme.palette.common.black, 0.08)}, 
    0 6px 16px ${alpha(theme.palette.common.black, 0.06)},
    0 2px 8px ${alpha(theme.palette.primary.main, 0.04)},
    inset 0 1px 0 ${alpha(theme.palette.common.white, 0.08)}
  `,
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: `linear-gradient(90deg, 
      ${theme.palette.primary.main} 0%, 
      ${theme.palette.success.main} 50%, 
      ${theme.palette.primary.main} 100%
    )`,
    borderRadius: '16px 16px 0 0',
    opacity: 0.7,
    zIndex: 1
  },
  '&:hover': {
    transform: 'translateY(-2px) scale(1.01)',
    boxShadow: `
      0 16px 40px ${alpha(theme.palette.common.black, 0.12)}, 
      0 8px 24px ${alpha(theme.palette.common.black, 0.08)},
      0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}
    `,
    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
  }
}));

const ReserveCard = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.warning.light, 0.08)
    : alpha(theme.palette.warning.light, 0.08),
  border: `2px solid ${alpha(theme.palette.warning.main, 0.15)}`,
  borderRadius: 16,
  padding: theme.spacing(2),
  backdropFilter: 'blur(20px)',
  boxShadow: `
    0 8px 24px ${alpha(theme.palette.warning.main, 0.06)}, 
    0 4px 12px ${alpha(theme.palette.common.black, 0.04)},
    inset 0 1px 0 ${alpha(theme.palette.common.white, 0.05)}
  `,
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: `linear-gradient(90deg, 
      ${theme.palette.warning.main} 0%, 
      ${theme.palette.warning.light} 50%, 
      ${theme.palette.warning.main} 100%
    )`,
    borderRadius: '16px 16px 0 0',
    opacity: 0.6,
    zIndex: 1
  },
  '&:hover': {
    border: `2px solid ${alpha(theme.palette.warning.main, 0.25)}`,
    boxShadow: `
      0 12px 32px ${alpha(theme.palette.warning.main, 0.1)}, 
      0 6px 16px ${alpha(theme.palette.common.black, 0.06)}
    `
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

export default function Wallet({ style }) {
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
    handleLogout
  } = useContext(AppContext);
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

  return (
    <Box style={style}>
      <Tooltip title={accountProfile ? 'Account Details' : t('Connect Wallet')} arrow>
        <Button
          onClick={() => {
            if (accountProfile) {
              handleOpen();
            } else {
              setOpenWalletModal(true);
            }
          }}
          ref={anchorRef}
          sx={{
            background: accountProfile
              ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
              : theme.palette.mode === 'dark' ? theme.palette.common.black : theme.palette.background.paper,
            backdropFilter: 'blur(10px)',
            border: accountProfile
              ? `1px solid ${alpha(theme.palette.success.main, 0.3)}`
              : `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
            borderRadius: '12px',
            height: '32px',
            minWidth: 'unset',
            padding: '6px 12px',
            color: theme.palette.common.white,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            fontSize: '0.875rem',
            fontWeight: 500,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.common.white, 0.1)}, transparent)`,
              transition: 'left 0.6s ease'
            },
            '&:hover': {
              color: theme.palette.common.white,
              background: accountProfile
                ? `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`
                : theme.palette.mode === 'dark' ? alpha(theme.palette.common.black, 0.8) : alpha(theme.palette.background.paper, 0.8),
              border: accountProfile
                ? `1px solid ${alpha(theme.palette.success.main, 0.5)}`
                : `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
              transform: 'translateY(-2px)',
              boxShadow: accountProfile
                ? `0 8px 24px ${alpha(theme.palette.success.main, 0.4)}, 0 4px 12px ${alpha(theme.palette.success.main, 0.2)}`
                : `0 8px 24px ${alpha(theme.palette.common.black, 0.4)}, 0 4px 12px ${alpha(theme.palette.common.black, 0.2)}`,
              cursor: 'pointer',
              '&::before': {
                left: '100%'
              }
            },
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <AccountBalanceWalletIcon fontSize="small" sx={{ color: theme.palette.common.white }} />
          <Typography variant="body2" sx={{ color: theme.palette.common.white, fontWeight: 500 }}>
            {accountProfile ? truncateAccount(accountLogin, 6) : t('Connect Wallet')}
          </Typography>
        </Button>
      </Tooltip>

      {accountProfile && (
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

              {/* Reserve Information */}
              <ReserveCard sx={{ mt: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.warning.main,
                        fontWeight: 500,
                        fontSize: '0.85rem'
                      }}
                    >
                      Account Reserve
                    </Typography>
                    <Tooltip
                      title="The XRP Ledger requires a base reserve of 1 XRP to activate accounts, plus 0.2 XRP for each owned object. This reserve is locked but can be used for transaction fees."
                      arrow
                      placement="top"
                    >
                      <HelpIcon
                        sx={{
                          width: 16,
                          height: 16,
                          color: theme.palette.warning.main,
                          opacity: 0.7
                        }}
                      />
                    </Tooltip>
                  </Stack>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.warning.main
                      }}
                    >
                      {Number(accountTotalXrp) - Number(accountBalance?.curr1?.value) || '0'} XRP
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Reserved
                    </Typography>
                  </Box>
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
                  position: 'relative',
                  overflow: 'hidden',
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.success.main,
                    0.06
                  )} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.success.main, 0.12)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: `linear-gradient(90deg, 
                      ${theme.palette.success.main} 0%, 
                      ${theme.palette.primary.main} 50%, 
                      ${theme.palette.success.main} 100%
                    )`,
                    borderRadius: '8px 8px 0 0',
                    opacity: 0.6
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(90deg, transparent, ${alpha(
                      theme.palette.success.main,
                      0.08
                    )}, transparent)`,
                    transition: 'left 0.4s ease'
                  },
                  '&:hover': {
                    backgroundColor: `linear-gradient(135deg, ${alpha(
                      theme.palette.success.main,
                      0.12
                    )} 0%, ${alpha(theme.palette.success.main, 0.06)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                    color: theme.palette.success.main,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 16px ${alpha(theme.palette.success.main, 0.15)}`,
                    '&::after': {
                      left: '100%'
                    }
                  }
                }}
                onClick={() => setOpenWalletModal(true)}
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
                  position: 'relative',
                  overflow: 'hidden',
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.success.main,
                    0.06
                  )} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.error.main, 0.12)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: `linear-gradient(90deg, 
                      ${theme.palette.error.main} 0%, 
                      ${theme.palette.warning.main} 50%, 
                      ${theme.palette.error.main} 100%
                    )`,
                    borderRadius: '8px 8px 0 0',
                    opacity: 0.6
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(90deg, transparent, ${alpha(
                      theme.palette.error.main,
                      0.08
                    )}, transparent)`,
                    transition: 'left 0.4s ease'
                  },
                  '&:hover': {
                    backgroundColor: `linear-gradient(135deg, ${alpha(
                      theme.palette.success.main,
                      0.12
                    )} 0%, ${alpha(theme.palette.success.main, 0.06)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                    color: theme.palette.error.main,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 16px ${alpha(theme.palette.error.main, 0.15)}`,
                    '&::after': {
                      left: '100%'
                    }
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
    </Box>
  );
}
