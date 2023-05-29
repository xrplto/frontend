import axios from 'axios';
import Decimal from 'decimal.js';
import { useState, useEffect, useContext } from 'react';
import {
  useTheme,
  Typography,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material';
import { tableCellClasses } from "@mui/material/TableCell";
import { AccountBalanceWallet as AccountBalanceWalletIcon } from '@mui/icons-material';
import LoginDialog from 'src/components/LoginDialog';
import { AppContext } from 'src/AppContext';
import { fNumber } from 'src/utils/formatNumber';

const ConnectWallet = () => {
  const BASE_URL = 'https://api.xrpl.to/api';
  const {
    accountProfile,
    doLogIn,
    setLoading,
    sync,
    setSync
  } = useContext(AppContext);

  const accountLogin = accountProfile?.account;
  const accountToken = accountProfile?.token;
  const accountLogo = accountProfile?.logo;
  const accountUuid = accountProfile?.xuuid;
  const isAdmin = accountProfile?.admin;

  const [openLogin, setOpenLogin] = useState(false);
  const [uuid, setUuid] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);

  useEffect(() => {
    let timer = null;
    let isRunning = false;
    let counter = 150;

    if (openLogin) {
      timer = setInterval(async () => {
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
        } catch (err) {
          // Handle error
        }

        isRunning = false;
        counter--;

        if (counter <= 0) {
          setOpenLogin(false);
        }
      }, 2000);
    }

    return () => {
      clearInterval(timer);
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
      await axios.delete(`${BASE_URL}/account/cancellogin/${xuuid}`);
    } catch (err) {
      // Handle error
    }

    setUuid(null);
    setLoading(false);
  };

  const handleLogin = () => {
    onConnectXumm();
  };

  const handleLoginClose = () => {
    setOpenLogin(false);
    onCancelLoginXumm(uuid);
  };

  return (
    <>
      <Button variant="contained" onClick={handleLogin} startIcon={<AccountBalanceWalletIcon />} sx={{ mt: 1.5 }}>
        Connect Wallet
      </Button>

      <LoginDialog
        open={openLogin}
        handleClose={handleLoginClose}
        qrUrl={qrUrl}
        nextUrl={nextUrl}
      />
    </>
  );
};

export default ConnectWallet;
