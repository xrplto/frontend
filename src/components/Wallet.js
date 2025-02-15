import { useRef } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { LazyLoadImage } from 'react-lazy-load-image-component';

// Material
import {
  alpha,
  styled,
  Avatar,
  // Badge,
  Box,
  Button,
  Divider,
  IconButton,
  Link,
  MenuItem,
  Popover,
  Stack,
  Tooltip,
  Typography,
  useTheme
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

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

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

const ActiveCircle = styled(Box)(
  () => `
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
        background-color: rgb(22, 199, 132);
  `
);

const TokenImage = styled(LazyLoadImage)(({ theme }) => ({
  borderRadius: '50%',
  overflow: 'hidden'
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
      <Button
        direction="row"
        spacing={1}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          padding: '4px 12px',
          borderRadius: '12px',
          backgroundColor: 'transparent',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          minHeight: '32px',
          background: (theme) => `linear-gradient(45deg, 
            ${theme.palette.primary.main} 0%, 
            ${alpha(theme.palette.primary.main, 0.8)} 25%,
            ${alpha(theme.palette.primary.light, 0.9)} 50%,
            ${alpha(theme.palette.primary.main, 0.8)} 75%,
            ${theme.palette.primary.main} 100%)`,
          backgroundSize: '200% 200%',
          animation: 'gradient 5s ease infinite',
          boxShadow: (theme) => `
            0 0 10px ${alpha(theme.palette.primary.main, 0.5)},
            0 0 20px ${alpha(theme.palette.primary.main, 0.3)},
            0 0 30px ${alpha(theme.palette.primary.main, 0.2)}
          `,
          '@keyframes gradient': {
            '0%': {
              backgroundPosition: '0% 50%'
            },
            '50%': {
              backgroundPosition: '100% 50%'
            },
            '100%': {
              backgroundPosition: '0% 50%'
            }
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: (theme) =>
              `radial-gradient(circle, ${alpha(
                theme.palette.primary.light,
                0.15
              )} 0%, transparent 70%)`,
            animation: 'rotate 4s linear infinite',
            opacity: 0,
            transition: 'opacity 0.3s ease'
          },
          '@keyframes rotate': {
            '0%': {
              transform: 'rotate(0deg)'
            },
            '100%': {
              transform: 'rotate(360deg)'
            }
          },
          '&:hover': {
            transform: 'translateY(-2px) scale(1.02)',
            boxShadow: (theme) => `
              0 0 15px ${alpha(theme.palette.primary.main, 0.6)},
              0 0 30px ${alpha(theme.palette.primary.main, 0.4)},
              0 0 45px ${alpha(theme.palette.primary.main, 0.3)}
            `,
            '&::before': {
              opacity: 1
            }
          },
          '&:active': {
            transform: 'translateY(0)'
          }
        }}
        ref={anchorRef}
        onClick={accountLogin ? handleOpen : () => setOpenWalletModal(true)}
      >
        <AccountBalanceWalletIcon
          fontSize="small"
          sx={{
            color: '#fff',
            fontSize: '16px',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': {
                transform: 'scale(1)'
              },
              '50%': {
                transform: 'scale(1.1)'
              },
              '100%': {
                transform: 'scale(1)'
              }
            }
          }}
        />
        <Typography
          variant="s3"
          fontSize={13}
          color="#fff"
          sx={{
            fontWeight: 500,
            letterSpacing: '0.1px'
          }}
        >
          {accountLogin ? truncateAccount(accountLogin, 4) : 'Connect'}
        </Typography>
      </Button>

      {accountLogin && (
        <Popover
          open={open}
          onClose={handleClose}
          anchorEl={anchorRef.current}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: {
              mt: 1.5,
              ml: 0.5,
              overflow: 'inherit',
              // boxShadow: (theme) => theme.customShadows.z20,
              border: (theme) => `solid 1px ${alpha('#919EAB', 0.08)}`,
              minWidth: 300
            }
          }}
        >
          <>
            <Stack
              direction="row"
              style={{ marginTop: '10px' }}
              sx={{ typography: 'body2', py: 1, px: 3 }}
              alignItems="center"
            >
              <Avatar
                variant={accountLogo ? '' : 'square'}
                alt="User"
                src={logoImageUrl}
                sx={{ width: 32, height: 32 }}
              />
              <Stack spacing={0} sx={{ ml: 2, mr: 2 }}>
                <Typography variant="s6">{truncateAccount(accountLogin)}</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <ActiveCircle />
                  <Typography variant="s7">Active XRPL Account</Typography>
                </Stack>
              </Stack>
              <CopyToClipboard
                text={accountLogin}
                onCopy={() => openSnackbar('Copied!', 'success')}
              >
                <Tooltip title={'Click to copy'}>
                  <IconButton size="small">
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
                <Tooltip title={'Settings'}>
                  <IconButton size="small" onClick={() => setOpen(false)}>
                    <SettingsIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Link>
            </Stack>

            <Box
              sx={{
                paddingRight: '27px',
                paddingLeft: '27px',
                marginTop: 2
              }}
            >
              <Typography variant="caption">Total Balance</Typography>

              <Box
                sx={{
                  backgroundColor: darkMode ? '#000000' : '#fff',
                  padding: '10px',
                  borderRadius: '4px'
                }}
              >
                <Stack direction="row" justifyContent="space-between">
                  <Stack direction="row" alignItems="center">
                    <TokenImage
                      src={'/static/xrp.3e1e159f.svg'} // use normal <img> attributes as props
                      width={18}
                      height={18}
                      onError={(event) => (event.target.src = '/static/alt.webp')}
                    />
                    <Typography variant="caption" ml={1}>
                      XRP
                    </Typography>
                  </Stack>

                  <Typography variant="caption">{accountBalance?.curr1?.value}</Typography>
                </Stack>

                {/* <Divider sx={{ my: 1 }} /> */}

                {/* <Stack direction="row" justifyContent="space-between">
                  <Stack direction="row" alignItems="center">
                    <TokenImage
                      src={
                        darkMode
                          ? '/static/solo.94fe652e.svg'
                          : '/static/solo.2a1752f9.svg'
                      } // use normal <img> attributes as props
                      width={18}
                      height={18}
                      onError={(event) =>
                        (event.target.src = '/static/alt.webp')
                      }
                    />
                    <Typography variant="caption" ml={1}>
                      SOLO
                    </Typography>
                  </Stack>

                  <Typography variant="caption">
                    {accountBalance?.curr2?.value}
                  </Typography>
                </Stack> */}
              </Box>

              <Box
                sx={{
                  padding: '10px',
                  border: '1px solid #3E3e3e',
                  margin: '5px 0',
                  borderRadius: '4px'
                }}
              >
                <Stack direction="row" justifyContent="space-between">
                  <Stack direction="row" alignItems="center">
                    <Typography
                      variant="caption"
                      mr={1}
                      sx={{
                        color: '#878787'
                      }}
                    >
                      Account Reserve
                    </Typography>
                    <Tooltip
                      title={`To activate an XRP wallet, a base reserve of 1 XRP is required. Once the XRP address is funded with this amount on the XRP Ledger network, the reserve becomes locked. Additional reserve of 0.2 XRP is required for each ledger object (like trustlines) owned by the account. The reserve can only be retrieved if the network reduces the reserve requirement or if the wallet is deleted. It's possible to pay fees using the reserve funds.`}
                    >
                      <HelpIcon
                        sx={{
                          width: '18px',
                          height: '18px'
                        }}
                      />
                    </Tooltip>
                  </Stack>

                  <Box>
                    <Typography variant="caption" mr="5px">
                      {Number(accountTotalXrp) - Number(accountBalance?.curr1?.value)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#878787',
                        fontSize: '11px'
                      }}
                    >
                      XRP
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Link
                underline="none"
                color="inherit"
                // target="_blank"
                href={`/account/${accountLogin}`}
                rel="noreferrer noopener nofollow"
              >
                <Button
                  key="account_profile"
                  onClick={() => setOpen(false)}
                  sx={{
                    paddingRight: '27px',
                    paddingLeft: '27px',
                    color: 'primary',
                    width: '100%'
                  }}
                >
                  VIEW WALLET
                </Button>
              </Link>
            </Box>

            <Divider />

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
                  sx={{ typography: 'body2', py: 1, px: 3 }}
                  onClick={() => {
                    setActiveProfile(account);
                    setOpen(false);
                  }}
                >
                  <Stack direction="row" sx={{ typography: 'body2' }} alignItems="center">
                    <Avatar
                      variant={accountLogo ? '' : 'square'}
                      alt="User"
                      src={logoImageUrl}
                      sx={{ width: 32, height: 32 }}
                    />
                    <Stack spacing={0} sx={{ ml: 2, mr: 2 }}>
                      <Typography variant="s6">{truncateAccount(account)}</Typography>
                      <Typography variant="s7">Switch to this Account</Typography>
                    </Stack>
                    <div onClick={(e) => e.stopPropagation()}>
                      <CopyToClipboard
                        text={account}
                        onCopy={(e) => openSnackbar('Copied!', 'success')}
                      >
                        <Tooltip title={'Click to copy'}>
                          <IconButton size="small">
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </CopyToClipboard>
                      <Tooltip title={'Remove'}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeProfile(account);
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </Stack>
                </MenuItem>
              );
            })}

            <MenuItem
              key="add_account"
              sx={{ typography: 'body2', py: 1.2, px: 3 }}
              onClick={() => setOpenWalletModal(true)}
            >
              <Stack direction="row" spacing={1} sx={{ mr: 2 }} alignItems="center">
                <AddCircleOutlineIcon />
                <Stack spacing={0} sx={{ ml: 1 }}>
                  <Typography variant="s6">Add Account</Typography>
                  <Typography variant="s7">Connect multiple accounts</Typography>
                </Stack>
              </Stack>
            </MenuItem>

            <MenuItem
              key="log_out"
              sx={{ typography: 'body2', py: 1.5, px: 3 }}
              onClick={handleLogout}
            >
              <Stack direction="row" spacing={1} sx={{ mr: 2 }} alignItems="center">
                <LogoutIcon />
                <Typography variant="s6" style={{ marginLeft: '10px' }}>
                  Logout
                </Typography>
              </Stack>
            </MenuItem>
          </>
        </Popover>
      )}
    </Box>
  );
}
