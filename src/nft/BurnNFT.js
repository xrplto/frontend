import axios from 'axios';
import { useState, useEffect } from 'react';

// Material
import { useTheme, Backdrop, Button } from '@mui/material';

// Iconify
import DeleteIcon from '@mui/icons-material/Delete';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Loader
import { PulseLoader } from '../components/Spinners';

// Components
// QRDialog removed - Xaman no longer used
import ConfirmBurnDialog from './ConfirmBurnDialog';
import { updateProcess, updateTxHash } from 'src/redux/transactionSlice';
import { useDispatch } from 'react-redux';
import { configureMemos } from 'src/utils/parseUtils';

// ----------------------------------------------------------------------
export default function BurnNFT({ nft, onHandleBurn }) {
  const theme = useTheme();
  const BASE_URL = 'https://api.xrpl.to/api';

  const dispatch = useDispatch();
  const { accountProfile, openSnackbar } = useContext(AppContext);
  const accountLogin = accountProfile?.account;
  const accountToken = accountProfile?.token;


  const [loading, setLoading] = useState(false);

  const [openConfirm, setOpenConfirm] = useState(false);

  const { flag = 0, account = '', NFTokenID = '' } = nft || {};

  // const isBurnable = (flag & 0x00000001) > 0;
  const isBurnable = accountLogin === account && account !== '';

  // Legacy Xaman functionality removed

  const onBurnNFTXumm = async () => {
    if (!accountLogin || !accountToken) {
      openSnackbar('Please login', 'error');
      return;
    }

    setLoading(true);
    try {
      const user_token = accountProfile?.user_token;
      const wallet_type = accountProfile?.wallet_type;

      const burnTxData = {
        TransactionType: 'NFTokenBurn',
        Account: accountLogin,
        Owner: account,
        NFTokenID,
        Memos: configureMemos('XRPNFT-nft-burn', '', `https://xrpnft.com`)
      };

      if (wallet_type === 'device') {
        // Device authentication required for NFT operations
        openSnackbar('Device authentication for NFT burn coming soon', 'info');
      } else {
        openSnackbar('Device authentication required', 'error');
      }
    } catch (err) {
      console.error(err);
      openSnackbar('Network error!', 'error');
      dispatch(updateProcess(0));
    }
    setLoading(false);
  };


  const handleBurnNFT = () => {
    setOpenConfirm(true);
    // onBurnNFTXumm();
  };

  return (
    <>
      <Backdrop sx={{ color: '#000', zIndex: 1303 }} open={loading}>
        <PulseLoader color={'#FF4842'} size={10} />
      </Backdrop>

      <ConfirmBurnDialog open={openConfirm} setOpen={setOpenConfirm} onContinue={onBurnNFTXumm} />

      <Button
        variant="outlined"
        fullWidth
        // sx={{ minWidth: 150 }}
        color="warning"
        startIcon={<DeleteIcon />}
        onClick={() => handleBurnNFT()}
        disabled={!accountLogin || !isBurnable || !nft} // Added !nft check
      >
        Burn
      </Button>

      {/* QRDialog removed - Xaman no longer used */}
    </>
  );
}
