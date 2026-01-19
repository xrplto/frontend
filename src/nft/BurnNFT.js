import axios from 'axios';
import { useState, useEffect, useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import { Trash2 } from 'lucide-react';

// Loader
import { PulseLoader } from '../components/Spinners';

// Components
import ConfirmBurnDialog from './ConfirmBurnDialog';
import { updateProcess, updateTxHash } from 'src/redux/transactionSlice';
import { useDispatch } from 'react-redux';
import { configureMemos } from 'src/utils/parseUtils';

export default function BurnNFT({ nft, onHandleBurn }) {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const BASE_URL = 'https://api.xrpl.to/api';

  const dispatch = useDispatch();
  const { accountProfile, openSnackbar } = useContext(AppContext);
  const accountLogin = accountProfile?.account;
  const accountToken = accountProfile?.token;

  const [loading, setLoading] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);

  const { flag = 0, account = '', NFTokenID = '' } = nft || {};
  const isBurnable = accountLogin === account && account !== '';

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
  };

  return (
    <>
      {loading && (
        <div className={cn("fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md", isDark ? "bg-black/70" : "bg-white/60")}>
          <PulseLoader color="#FF4842" size={10} />
        </div>
      )}

      <ConfirmBurnDialog open={openConfirm} setOpen={setOpenConfirm} onContinue={onBurnNFTXumm} />

      <button
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl border-[1.5px] px-4 py-[10px] text-[13px] font-normal transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isDark
            ? "border-orange-500/50 text-orange-500 hover:bg-orange-500/5"
            : "border-orange-600 text-orange-600 hover:bg-orange-50"
        )}
        onClick={handleBurnNFT}
        disabled={!accountLogin || !isBurnable || !nft}
      >
        <Trash2 size={14} />
        Burn
      </button>
    </>
  );
}
