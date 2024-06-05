import { useContext } from 'react';
import {
  Button,
} from '@mui/material';
import { AccountBalanceWallet as AccountBalanceWalletIcon } from '@mui/icons-material';
import { AppContext } from 'src/AppContext';

const ConnectWallet = () => {
  const {
    handleLogin
  } = useContext(AppContext);

  return (
    <>
      <Button variant="contained" onClick={handleLogin} startIcon={<AccountBalanceWalletIcon />} sx={{ mt: 1.5 }}>
        Connect Wallet
      </Button>
    </>
  );
};

export default ConnectWallet;
