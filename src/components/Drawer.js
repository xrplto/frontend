import { useState, useEffect, useContext, Fragment } from 'react';
import Box from '@mui/material/Box';
import {
  Button,
  Divider,
  Link,
  MenuItem,
  Drawer as MuiDrawer,
  Typography,
  IconButton
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';

import Logo from './Logo';
import LoginDialog from './LoginDialog';
import { AppContext } from 'src/AppContext';
import axios from 'axios';

export default function Drawer({ toggleDrawer, isOpen }) {
  const BASE_URL = 'https://api.xrpl.to/api';

  const { darkMode, accountProfile, doLogIn, doLogOut, setLoading } =
    useContext(AppContext);
  const accountLogin = accountProfile?.account;

  const [open, setOpen] = useState(false);
  const [openLogin, setOpenLogin] = useState(false);
  const [qrUrl, setQrUrl] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);
  const [uuid, setUuid] = useState(null);

  const handleLoginClose = () => {
    setOpenLogin(false);
    onCancelLoginXumm(uuid);
  };

  const handleLogin = () => {
    setOpen(false);
    onConnectXumm();
  };

  const handleLogout = () => {
    setOpen(false);
    onLogoutXumm();
  };

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
    try {
      const res = await axios.delete(
        `${BASE_URL}/account/cancellogin/${xuuid}`
      );
      if (res.status === 200) {
      }
    } catch (err) {}
    setUuid(null);
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
            setOpen(true);
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

  return (
    <Fragment>
      <MuiDrawer
        open={isOpen}
        onClose={() => toggleDrawer(false)}
        PaperProps={{
          sx: {
            width: '100%'
          }
        }}
      >
        <Box
          id="logo-container-laptop"
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: darkMode ? '#17171A' : '#fff',
            px: 2,
            boxShadow:
              'rgba(128, 138, 157, 0.12) 0px 8px 32px, rgba(128, 138, 157, 0.08) 0px 1px 2px'
          }}
        >
          <Logo
            style={{ marginRight: 10, paddingTop: 15, paddingBottom: 15 }}
          />
          <IconButton aria-label="close" onClick={() => toggleDrawer(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Link
          underline="none"
          color="inherit"
          href="https://xrpl.to"
          rel="noreferrer noopener nofollow"
        >
          <MenuItem divider={true} sx={{ py: 1.5, px: 3 }}>
            <Typography variant="s6">Tokens</Typography>
          </MenuItem>
        </Link>

        <Link
          underline="none"
          color="inherit"
          href="/swap"
          rel="noreferrer noopener nofollow"
        >
          <MenuItem divider={true} sx={{ py: 1.5, px: 3 }}>
            <Typography variant="s6">Swap</Typography>
          </MenuItem>
        </Link>

        <Link
          underline="none"
          color="inherit"
          href="/buy-xrp"
          rel="noreferrer noopener nofollow"
        >
          <MenuItem divider={true} sx={{ py: 1.5, px: 3 }}>
            <Typography variant="s6">Fiat</Typography>
          </MenuItem>
        </Link>

        <Button
          key={accountLogin ? 'log_out' : 'xumm'}
          onClick={accountLogin ? handleLogout : handleLogin}
          sx={{
            typography: 'body2',
            py: 1.5,
            px: 3,
            mt: 3,
            mx: 2,
            color: 'inherit',
            backgroundColor: darkMode ? 'rgb(45, 43, 55)' : '#fff',
            '&:hover': {
              backgroundColor: darkMode ? 'rgb(45, 43, 55, 0.8)' : '#EFF2F5'
            }
          }}
        >
          {accountLogin ? 'Logout' : 'Login with XUMM'}
        </Button>
      </MuiDrawer>

      <LoginDialog
        open={openLogin}
        handleClose={handleLoginClose}
        qrUrl={qrUrl}
        nextUrl={nextUrl}
      />
    </Fragment>
  );
}
