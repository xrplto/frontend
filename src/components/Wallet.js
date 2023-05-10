import axios from 'axios';
import { useRef, useState, useEffect } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { LazyLoadImage } from 'react-lazy-load-image-component';

// Material
import {
  alpha,
  styled,
  Avatar,
  Badge,
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
  useTheme,
  useMediaQuery
} from '@mui/material';
import GridOnIcon from '@mui/icons-material/GridOn';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import SettingsIcon from '@mui/icons-material/Settings';
import AssignmentReturnedIcon from '@mui/icons-material/AssignmentReturned';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import HelpIcon from '@mui/icons-material/Help';
import { AccountBalanceWallet as AccountBalanceWalletIcon } from '@mui/icons-material';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Iconify
import { Icon } from '@iconify/react';
import userLock from '@iconify/icons-fa-solid/user-lock';
import link45deg from '@iconify/icons-bi/link-45deg';
import linkExternal from '@iconify/icons-charm/link-external';
import externalLinkLine from '@iconify/icons-ri/external-link-line';
import paperIcon from '@iconify/icons-akar-icons/paper';
import copyIcon from '@iconify/icons-fad/copy';

// Utils
import { getHashIcon } from 'src/utils/extra';

// Components
import LoginDialog from './LoginDialog';

const pair = {
  '534F4C4F00000000000000000000000000000000': 'SOLO',
  XRP: 'XRP'
};

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

function truncate(str, n) {
  if (!str) return '';
  //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
  return str.length > n ? str.substr(0, n - 1) + ' ...' : str;
}

function truncateAccount(str, length = 9) {
  if (!str) return '';
  return str.slice(0, length) + '...' + str.slice(length * -1);
}

export default function Wallet({ style }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const BASE_URL = 'https://api.xrpl.to/api';
  const anchorRef = useRef(null);
  const {
    setActiveProfile,
    accountProfile,
    doLogIn,
    profiles,
    removeProfile,
    doLogOut,
    openSnackbar,
    setLoading,
    sync,
    darkMode
  } = useContext(AppContext);
  const accountLogin = accountProfile?.account;
  const accountToken = accountProfile?.token;
  const accountLogo = accountProfile?.logo;
  const accountUuid = accountProfile?.xuuid;
  const isAdmin = accountProfile?.admin;

  const [open, setOpen] = useState(false);
  const [openLogin, setOpenLogin] = useState(false);
  const [uuid, setUuid] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);
  const [accountBalance, setAccountBalance] = useState(null);

  let logoImageUrl = null;
  if (accountProfile) {
    logoImageUrl = accountLogo
      ? `https://s1.xrpl.to/profile/${accountLogo}`
      : getHashIcon(accountLogin);
  }

  useEffect(() => {
    var timer = null;
    var isRunning = false;
    var counter = 150;
    if (openLogin) {
      timer = setInterval(async () => {
        // console.log(counter + " " + isRunning, uuid);
        if (isRunning) return;
        isRunning = true;
        try {
          const res = await axios.get(`${BASE_URL}/account/login/${uuid}`);
          const ret = res?.data;
          if (ret?.profile) {
            const profile = ret.profile;
            // setOpen(true);
            setOpenLogin(false);
            doLogIn(profile);
            return;
          }
        } catch (err) {}
        isRunning = false;
        counter--;
        if (counter <= 0) {
          setOpenLogin(false);
        }
      }, 2000);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [openLogin, uuid, doLogIn]);

  const onConnectXumm = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/account/login`);
      if (res.status === 200) {
        const uuid = res.data.data.uuid;
        const qrlink = res.data.data.qrUrl;
        const nextlink = res.data.data.next;

        setUuid(uuid);
        setQrUrl(qrlink);
        setNextUrl(nextlink);
        setOpenLogin(true);
      }
    } catch (err) {
      alert(err);
    }
    setLoading(false);
  };

  const onCancelLoginXumm = async (xuuid) => {
    setLoading(true);
    try {
      const res = await axios.delete(
        `${BASE_URL}/account/cancellogin/${xuuid}`
      );
      if (res.status === 200) {
      }
    } catch (err) {}
    setUuid(null);
    setLoading(false);
  };

  const onLogoutXumm = async () => {
    setLoading(true);
    try {
      const res = await axios.delete(
        `${BASE_URL}/account/logout/${accountLogin}/${accountUuid}`,
        { headers: { 'x-access-token': accountToken } }
      );
      if (res.status === 200) {
      }
    } catch (err) {}
    doLogOut();
    setUuid(null);
    setLoading(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleLogin = () => {
    setOpen(false);
    onConnectXumm();
  };

  const handleLogout = () => {
    setOpen(false);
    onLogoutXumm();
  };

  const handleLoginClose = () => {
    setOpenLogin(false);
    onCancelLoginXumm(uuid);
  };

  useEffect(() => {
    function getAccountInfo() {
      if (!accountProfile || !accountProfile.account) {
        return;
      }

      const account = accountProfile.account;
      // https://api.xrpl.to/api/account/info/r22G1hNbxBVapj2zSmvjdXyKcedpSDKsm?curr1=534F4C4F00000000000000000000000000000000&issuer1=rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz&curr2=XRP&issuer2=XRPL
      axios
        .get(
          `${BASE_URL}/account/info/${account}?curr1=XRP&issuer1=XRPL&curr2=534F4C4F00000000000000000000000000000000&issuer2=rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz`
        )
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
            setAccountBalance(ret.pair);
          }
        })
        .catch((err) => {
          console.log('Error on getting account pair balance info.', err);
        })
        .then(function () {
          // always executed
        });
    }
    // console.log('account_info')
    getAccountInfo();
  }, [accountProfile, sync]);

  return (
    <Box style={style}>
      <Button
        direction="row"
        spacing={1}
        sx={{
          padding: '3px 7px',
          backgroundImage: 'linear-gradient(to right, #721DA6 0%, #3021C1 51%, #721DA6 100%)',
          transition: '0.5s',
          backgroundSize: '200% auto',
          '&:hover': {
            backgroundPosition: 'right center'
          }
        }}
        alignItems="center"
        ref={anchorRef}
        onClick={accountLogin ? handleOpen : handleLogin}
      >
        <AccountBalanceWalletIcon
          fontSize="small"
          sx={{
            color: '#fff',
            marginRight: '6px'
          }}
        />
        <Typography variant="s3" fontSize={13} color="#fff">
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
                alt="user"
                src={logoImageUrl}
                sx={{ width: 32, height: 32 }}
              />
              <Stack spacing={0} sx={{ ml: 2, mr: 2 }}>
                <Typography variant="s6">
                  {truncateAccount(accountLogin)}
                </Typography>
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
                  backgroundColor: darkMode ? '#2D2D2D' : '#fff',
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
                      onError={(event) =>
                        (event.target.src = '/static/alt.webp')
                      }
                    />
                    <Typography variant="caption" ml={1}>
                      XRP
                    </Typography>
                  </Stack>

                  <Typography variant="caption">
                    {accountBalance?.curr1?.value}
                  </Typography>
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
                      title={`To activate an XRP wallet, a reserve of 10 XRP is mandatory. Once the XRP address is funded with this amount on the ledger network, the reserve becomes locked and unable to be retrieved unless either the network decides to reduce the reserve requirement, or the user deletes the wallet. It's possible to pay fees using the reserve funds.`}
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
                    {/* <Typography variant="caption">12</Typography> */}
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
                    color: 'inherit',
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
                  <Stack
                    direction="row"
                    sx={{ typography: 'body2' }}
                    alignItems="center"
                  >
                    <Avatar
                      variant={accountLogo ? '' : 'square'}
                      alt="user"
                      src={logoImageUrl}
                      sx={{ width: 32, height: 32 }}
                    />
                    <Stack spacing={0} sx={{ ml: 2, mr: 2 }}>
                      <Typography variant="s6">
                        {truncateAccount(account)}
                      </Typography>
                      <Typography variant="s7">
                        Switch to this Account
                      </Typography>
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
              onClick={handleLogin}
            >
              <Stack
                direction="row"
                spacing={1}
                sx={{ mr: 2 }}
                alignItems="center"
              >
                <AddCircleOutlineIcon />
                <Stack spacing={0} sx={{ ml: 1 }}>
                  <Typography variant="s6">Add Account</Typography>
                  <Typography variant="s7">
                    Connect multiple accounts
                  </Typography>
                </Stack>
              </Stack>
            </MenuItem>

            <MenuItem
              key="log_out"
              sx={{ typography: 'body2', py: 1.5, px: 3 }}
              onClick={handleLogout}
            >
              <Stack
                direction="row"
                spacing={1}
                sx={{ mr: 2 }}
                alignItems="center"
              >
                <LogoutIcon />
                <Typography variant="s6" style={{ marginLeft: '10px' }}>
                  Logout
                </Typography>
              </Stack>
            </MenuItem>
          </>
        </Popover>
      )}

      <LoginDialog
        open={openLogin}
        handleClose={handleLoginClose}
        qrUrl={qrUrl}
        nextUrl={nextUrl}
      />
    </Box>
  );
}
