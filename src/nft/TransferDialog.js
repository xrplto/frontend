import axios from 'axios';
import { useState, useEffect, useContext } from 'react';
import Decimal from 'decimal.js-light';
import { X, Send } from 'lucide-react';

// Context
import { AppContext } from 'src/AppContext';

// Loader
import { PulseLoader } from '../components/Spinners';

// Utils
import { cn } from 'src/utils/cn';
import { isValidClassicAddress } from 'ripple-address-codec';
import { configureMemos } from 'src/utils/parseUtils';
import { selectProcess, updateProcess, updateTxHash } from 'src/redux/transactionSlice';
import { useDispatch, useSelector } from 'react-redux';

export default function TransferDialog({ open, setOpen, nft, nftImageUrl }) {
  const BASE_URL = 'https://api.xrpl.to/api';
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const dispatch = useDispatch();
  const isProcessing = useSelector(selectProcess);

  const { accountProfile, openSnackbar, sync, setSync } = useContext(AppContext);
  const account = accountProfile?.account;
  const accountToken = accountProfile?.token;

  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    var timer = null;
    var isRunning = false;
    var counter = 150;
    var dispatchTimer = null;

    const startInterval = () => {
      let times = 0;

      dispatchTimer = setInterval(async () => {
        const dispatched_result = await getDispatchResult();

        if (dispatched_result && dispatched_result === 'tesSUCCESS') {
          setSync(sync + 1);
          openSnackbar('Create Offer successful!', 'success');
          stopInterval();
          return;
        }

        times++;

        if (times >= 10) {
          openSnackbar('Create Offer rejected!', 'error');
          stopInterval();
          return;
        }
      }, 1000);
    };

    const stopInterval = () => {
      clearInterval(dispatchTimer);
      handleClose();
      handleScanQRClose();
    };

    return () => {};
  }, []);

  const handleScanQRClose = () => {};

  const handleClose = () => {
    setOpen(false);
    setDestination('');
  };

  const handleChangeAccount = (e) => {
    setDestination(e.target.value);
  };

  const handleTransferNFT = () => {
    const isValid = isValidClassicAddress(destination) && account !== destination;
    if (isValid) {
    } else {
      openSnackbar('Invalid value!', 'error');
    }
  };

  const handleMsg = () => {
    if (isProcessing === 1) return 'Pending Transferring';
    if (!destination) return 'Enter an Account';
    else return 'Transfer';
  };

  const isLoading = loading || isProcessing === 1;

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      {isLoading && (
        <div className={cn("fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md", isDark ? "bg-black/70" : "bg-white/60")}>
          <PulseLoader color={'#FF4842'} size={10} />
        </div>
      )}

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn("absolute inset-0 backdrop-blur-md", isDark ? "bg-black/70" : "bg-white/60")}
          onClick={!isLoading ? handleClose : undefined}
        />

        <div
          className={cn(
            'relative w-full max-w-md rounded-2xl border-[1.5px]',
            isDark ? 'bg-black/80 backdrop-blur-2xl border-white/[0.08] text-white shadow-2xl shadow-black/50' : 'bg-white/80 backdrop-blur-2xl border-gray-200/60 text-gray-900 shadow-2xl shadow-gray-300/30'
          )}
        >
          {/* Header */}
          <div className={cn("flex items-center justify-between border-b p-4", isDark ? "border-white/[0.08]" : "border-gray-200")}>
            <h2 className="text-[15px] font-normal">Transfer NFT</h2>
            {!isLoading && (
              <button
                onClick={handleClose}
                className={cn(
                  'rounded-lg p-1.5',
                  isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                )}
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* NFT Preview */}
            <div className="mb-6 flex items-center gap-4">
              {nftImageUrl && (
                <img
                  src={nftImageUrl}
                  alt={nft?.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              )}
              <div>
                <p className="text-[13px] font-normal">{nft?.name}</p>
                {nft?.collection && (
                  <p className={cn('text-[11px]', isDark ? 'text-white/50' : 'text-gray-500')}>
                    Collection: {typeof nft.collection === 'string' ? nft.collection : nft.collection?.name}
                  </p>
                )}
                {nft?.rarity_rank && (
                  <p className={cn('text-[11px]', isDark ? 'text-white/50' : 'text-gray-500')}>
                    Rank: {nft.rarity_rank} / {nft.total}
                  </p>
                )}
              </div>
            </div>

            <p
              className={cn(
                'mb-6 text-[11px]',
                isDark ? 'text-white/50' : 'text-gray-500',
                isLoading && 'opacity-70'
              )}
            >
              For this transfer to be completed, the recipient must accept it through their wallet.
            </p>

            {/* Destination Input */}
            <div className="mb-6">
              <label className="mb-2 block text-[13px] font-normal">
                Destination Account <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter destination account"
                value={destination}
                onChange={handleChangeAccount}
                onFocus={(event) => event.target.select()}
                onKeyDown={(e) => e.stopPropagation()}
                disabled={isLoading}
                className={cn(
                  'w-full rounded-lg border-[1.5px] px-4 py-2 text-[13px] outline-none transition-colors',
                  isDark
                    ? 'border-white/15 bg-white/5 placeholder:text-white/30 focus:border-primary'
                    : 'border-gray-300 bg-white placeholder:text-gray-400 focus:border-primary',
                  isLoading && 'cursor-not-allowed opacity-50'
                )}
              />
            </div>

            {/* Transfer Button */}
            <div className="flex justify-center">
              <button
                onClick={handleTransferNFT}
                disabled={isLoading || !destination}
                className={cn(
                  'flex min-w-[200px] items-center justify-center gap-2 rounded-lg border-[1.5px] px-6 py-2 text-[13px] font-normal transition-colors',
                  isLoading || !destination
                    ? isDark
                      ? 'cursor-not-allowed border-white/10 bg-white/5 text-white/30'
                      : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                    : isDark
                      ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
                      : 'border-primary bg-primary/5 text-primary hover:bg-primary/10'
                )}
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Send size={16} />
                )}
                {handleMsg()}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
