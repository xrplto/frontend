import api from 'src/utils/api';
import { useState, useEffect, useContext } from 'react';
import { ThemeContext, WalletContext, AppContext } from 'src/context/AppContext';
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
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const BASE_URL = 'https://api.xrpl.to/v1';

  const dispatch = useDispatch();
  const { accountProfile } = useContext(WalletContext);
  const { openSnackbar } = useContext(AppContext);
  const accountLogin = accountProfile?.account;
  const accountToken = accountProfile?.token;

  const [loading, setLoading] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);

  const { flag = 0, account = '', NFTokenID = '' } = nft || {};
  const isBurnable = accountLogin === account && account !== '';

  const onBurnNFT = async () => {
    if (!accountLogin || !accountToken) {
      openSnackbar('Please login', 'error');
      return;
    }

    setLoading(true);
    try {
      const wallet_type = accountProfile?.wallet_type;

      if (wallet_type === 'device') {
        openSnackbar('NFT burn coming soon', 'info');
      } else {
        openSnackbar('Device wallet required', 'error');
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
        <div
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md',
            isDark ? 'bg-black/70' : 'bg-white/60'
          )}
        >
          <PulseLoader color="#FF4842" size={10} />
        </div>
      )}

      <ConfirmBurnDialog open={openConfirm} setOpen={setOpenConfirm} onContinue={onBurnNFT} />

      <button
        className={cn(
          'flex-1 flex items-center justify-center gap-2 rounded-xl border py-3 text-[15px] font-normal transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isDark
            ? 'border-gray-700/50 text-gray-300 hover:border-gray-600 hover:text-white'
            : 'border-gray-300 text-gray-700 hover:border-gray-400'
        )}
        onClick={handleBurnNFT}
        disabled={!accountLogin || !isBurnable || !nft}
      >
        <Trash2 size={16} />
        Burn
      </button>
    </>
  );
}
