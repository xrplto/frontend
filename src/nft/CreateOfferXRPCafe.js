import axios from 'axios';
import { useState, useContext, useEffect } from 'react';
import { X, PlusCircle } from 'lucide-react';
import { AppContext } from 'src/AppContext';
import { PulseLoader } from '../components/Spinners';
import { cn } from 'src/utils/cn';

const BASE_URL = 'https://api.xrpl.to/api';

export default function CreateOfferXRPCafe({
  open,
  setOpen,
  nft,
  isSellOffer,
  initialAmount,
  brokerFeePercentage,
  onOfferCreated
}) {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const { accountProfile, openSnackbar, sync, setSync } = useContext(AppContext);
  const account = accountProfile?.account;
  const accountToken = accountProfile?.token;

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const isAmountFixed = Boolean(initialAmount);

  useEffect(() => {
    if (open && initialAmount) {
      setAmount(initialAmount.toString());
    }
  }, [open, initialAmount]);

  useEffect(() => {
    const startInterval = () => {
      let times = 0;
      dispatchTimer = setInterval(async () => {
        const dispatched_result = await getDispatchResult();
        if (dispatched_result && dispatched_result === 'tesSUCCESS') {
          if (onOfferCreated) {
            onOfferCreated();
          }
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
    };

    return () => {};
  }, []);

  const handleClose = () => {
    setOpen(false);
    setAmount('');
  };

  const handleChangeAmount = (e) => {
    const value = e.target.value;
    const newAmount = value ? value.replace(/[^0-9.]/g, '') : '';
    setAmount(newAmount);
  };

  const handleCreateOffer = async () => {
    if (!account || !accountToken) {
      openSnackbar('Please login', 'error');
      return;
    }

    if (parseFloat(amount) <= 0) {
      openSnackbar('Invalid amount', 'error');
      return;
    }

    setLoading(true);
    try {
      const body = {
        account,
        issuer: 'XRPL',
        currency: 'XRP',
        amount,
        isSellOffer,
        NFTokenID: nft.NFTokenID,
        owner: nft.account,
        user_token: accountProfile?.user_token,
        brokerFeePercentage
      };

      const res = await axios.post(`${BASE_URL}/offers/create`, body, {
        headers: { 'x-access-token': accountToken }
      });

      if (res.status === 200) {
        const nextlink = res.data.data.next;
      }
    } catch (err) {
      console.error(err);
      openSnackbar('Failed to create offer', 'error');
    }
    setLoading(false);
  };

  const handleScanQRClose = () => {};

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      {loading && (
        <div className="fixed inset-0 z-[1303] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <PulseLoader color="#4285f4" size={10} />
        </div>
      )}

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

        <div
          className={cn(
            'relative w-full max-w-sm rounded-xl border-2 border-primary',
            isDark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-primary p-4 text-white">
            <h2 className="text-[15px] font-normal">
              Create {isSellOffer ? 'Sell' : 'Buy'} Offer (XRP)
            </h2>
            <button
              onClick={handleClose}
              className="rounded-lg p-1.5 hover:bg-white/10"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-4">
              <label className="mb-2 block text-[13px] font-normal">
                Amount (XRP) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter amount in XRP"
                value={amount}
                onChange={handleChangeAmount}
                onFocus={(event) => event.target.select()}
                disabled={isAmountFixed}
                className={cn(
                  'w-full rounded-lg border-[1.5px] px-4 py-2 text-[13px] outline-none transition-colors',
                  isDark
                    ? 'border-white/15 bg-white/5 placeholder:text-white/30 focus:border-primary'
                    : 'border-gray-300 bg-white placeholder:text-gray-400 focus:border-primary',
                  isAmountFixed && 'cursor-not-allowed opacity-50'
                )}
              />
              {isAmountFixed && (
                <p className={cn('mt-2 text-[11px]', isDark ? 'text-white/50' : 'text-gray-500')}>
                  This amount includes the broker fee of {(brokerFeePercentage * 100).toFixed(3)}%
                  and cannot be changed.
                </p>
              )}
            </div>

            <button
              onClick={handleCreateOffer}
              disabled={loading}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-lg border-[1.5px] px-6 py-2 text-[13px] font-normal transition-colors',
                loading
                  ? isDark
                    ? 'cursor-not-allowed border-white/10 bg-white/5 text-white/30'
                    : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                  : isDark
                    ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
                    : 'border-primary bg-primary/5 text-primary hover:bg-primary/10'
              )}
            >
              {loading ? (
                <PulseLoader color="#ffffff" size={10} />
              ) : (
                <>
                  <PlusCircle size={16} />
                  Create Offer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
