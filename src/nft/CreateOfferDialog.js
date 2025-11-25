import axios from 'axios';
import { useState, useEffect, useContext } from 'react';
import Decimal from 'decimal.js-light';
import { X, PlusCircle, Loader2 } from 'lucide-react';

// Context
import { AppContext } from 'src/AppContext';

// Utils
import { cn } from 'src/utils/cn';

// Loader
import { PulseLoader } from '../components/Spinners';

// Constants
const XRP_TOKEN = { currency: 'XRP', issuer: 'XRPL' };

// Components
import { configureMemos } from 'src/utils/parseUtils';
import { selectProcess, updateProcess, updateTxHash } from 'src/redux/transactionSlice';
import { useDispatch, useSelector } from 'react-redux';

// ----------------------------------------------------------------------

function GetNum(amount) {
  let num = 0;
  try {
    num = new Decimal(amount).toNumber();
    if (num < 0) num = 0;
  } catch (err) {}
  return num;
}

export default function CreateOfferDialog({ open, setOpen, nft, isSellOffer, nftImageUrl }) {
  const { themeName, accountProfile, openSnackbar, sync, setSync } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const dispatch = useDispatch();
  const isProcessing = useSelector(selectProcess);
  const BASE_URL = 'https://api.xrpl.to/api';

  const account = accountProfile?.account;
  const accountToken = accountProfile?.token;

  const [token, setToken] = useState(XRP_TOKEN);
  const [amount, setAmount] = useState('');

  const [openScanQR, setOpenScanQR] = useState(false);
  const [uuid, setUuid] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    var timer = null;
    var isRunning = false;
    var counter = 150;

    var dispatchTimer = null;

    async function getDispatchResult() {
      try {
        const ret = await axios.get(`${BASE_URL}/offers/create/${uuid}?account=${account}`, {
          headers: { 'x-access-token': accountToken }
        });
        const res = ret.data.data.response;
        const dispatched_result = res.dispatched_result;

        return dispatched_result;
      } catch (err) {}
    }

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
      setOpenScanQR(false);
      handleClose();
    };

    async function getPayload() {
      if (isRunning) return;
      isRunning = true;
      try {
        const ret = await axios.get(`${BASE_URL}/offers/create/${uuid}?account=${account}`, {
          headers: { 'x-access-token': accountToken }
        });
        const resolved_at = ret.data?.resolved_at;
        const dispatched_result = ret.data?.dispatched_result;
        if (resolved_at) {
          startInterval();
          return;
        }
      } catch (err) {
      }
      isRunning = false;
      counter--;
      if (counter <= 0) {
        openSnackbar('Create Offer timeout!', 'error');
        handleScanQRClose();
      }
    }
    if (openScanQR) {
      timer = setInterval(getPayload, 2000);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [openScanQR, uuid, sync]);

  const onCreateOfferXumm = async () => {
    openSnackbar('Xaman no longer supported', 'info');
    return;
    if (!account || !accountToken) {
      openSnackbar('Please login', 'error');
      return;
    }

    try {
      const user_token = accountProfile?.user_token;
      const wallet_type = accountProfile.wallet_type;

      const issuer = token.issuer;
      const currency = token.currency;

      const owner = nft.account;
      const NFTokenID = nft.NFTokenID;

      const body = { account, issuer, currency, amount, isSellOffer, NFTokenID, owner, user_token };

      let Amount = {};
      if (currency === 'XRP') {
        Amount = new Decimal(amount).mul(1000000).toString();
      } else {
        Amount.issuer = issuer;
        Amount.currency = currency;
        Amount.value = new Decimal(amount).toString();
      }

      let offerTxData = {
        TransactionType: 'NFTokenCreateOffer',
        Account: account,
        NFTokenID,
        Amount,
        Memos: configureMemos(
          isSellOffer ? 'XRPNFT-nft-create-sell-offer' : 'XRPNFT-nft-create-buy-offer',
          '',
          `https://xrpnft.com/nft/${NFTokenID}`
        )
      };

      if (isSellOffer) {
        offerTxData.Flags = 1;
      } else {
        offerTxData.Owner = owner;
      }

      if (wallet_type === 'device') {
        openSnackbar('Device authentication for NFT offers coming soon', 'info');
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

  const handleScanQRClose = () => {
    setOpenScanQR(false);
  };

  const handleClose = () => {
    setOpen(false);
    setToken(XRP_TOKEN);
    setAmount('');
  };

  const handleChangeAmount = (e) => {
    const value = e.target.value;
    const newAmount = value ? value.replace(/[^0-9.]/g, '') : '';
    setAmount(newAmount);
  };

  const handleCreateOffer = () => {
    if (amount > 0) {
      openSnackbar('Device authentication required', 'info');
    } else {
      openSnackbar('Invalid value!', 'error');
    }
  };

  const handleMsg = () => {
    if (isProcessing === 1) return 'Pending Creating';
    if (!amount) return 'Enter an Amount';
    else return 'Create';
  };

  if (!open) return null;

  return (
    <>
      {/* Loading Backdrop */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <PulseLoader color="#4285f4" size={10} />
        </div>
      )}

      {/* Dialog Backdrop */}
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className={cn(
          'relative w-full max-w-md rounded-xl border-[1.5px] overflow-hidden',
          isDark ? 'border-white/10 bg-black' : 'border-gray-200 bg-white'
        )}>
          {/* Dialog Title */}
          <div className={cn(
            'flex items-center justify-between p-4 border-b-[1.5px]',
            isDark ? 'border-white/10' : 'border-gray-200'
          )}>
            <h2 className={cn('text-[19px] font-normal text-primary')}>
              Create {isSellOffer ? 'Sell' : 'Buy'} Offer
            </h2>
            <button
              onClick={handleClose}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-xl border-[1.5px] transition-colors',
                isDark ? 'border-white/10 hover:border-primary hover:bg-primary/5' : 'border-gray-200 hover:border-primary hover:bg-primary/5'
              )}
            >
              <X size={16} />
            </button>
          </div>

          {/* Dialog Content */}
          <div className="p-4 space-y-4">
            {/* NFT Preview */}
            <div className={cn(
              'p-4 rounded-xl border-[1.5px]',
              isDark ? 'border-white/10' : 'border-gray-200'
            )}>
              <div className="flex items-center gap-3">
                {nftImageUrl && (
                  <img
                    src={nftImageUrl}
                    alt={nft?.name}
                    className="w-16 h-16 rounded-xl border-2 border-primary/20 object-cover"
                  />
                )}
                <div>
                  <p className={cn('text-[18px] font-normal', isDark ? 'text-white' : 'text-gray-900')}>
                    {nft?.name}
                  </p>
                  {nft?.collection && (
                    <p className={cn('text-[13px]', isDark ? 'text-white/60' : 'text-gray-500')}>
                      Collection: {nft.collection}
                    </p>
                  )}
                  {nft?.rarity_rank && (
                    <p className="text-[13px] text-yellow-500">
                      Rank: {nft.rarity_rank} / {nft.total}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Token Selection */}
            <div className={cn(
              'p-4 rounded-xl border-[1.5px]',
              isDark ? 'border-white/10' : 'border-gray-200'
            )}>
              <div className={cn(
                'px-3 py-2 rounded-lg',
                isDark ? 'bg-white/5' : 'bg-gray-100'
              )}>
                <span className={cn('text-[14px] font-normal', isDark ? 'text-white' : 'text-gray-900')}>
                  {token?.name || 'XRP'}
                </span>
              </div>
            </div>

            {/* Amount Input */}
            <div className={cn(
              'p-4 rounded-xl border-[1.5px]',
              isDark ? 'border-white/10' : 'border-gray-200'
            )}>
              <p className={cn('text-[15px] font-normal mb-3', isDark ? 'text-white' : 'text-gray-900')}>
                Cost <span className="text-red-500">*</span>
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={handleChangeAmount}
                  onFocus={(e) => e.target.select()}
                  className={cn(
                    'flex-1 px-4 py-3 rounded-xl border-[1.5px] text-[14px] outline-none transition-colors',
                    isDark
                      ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-primary'
                      : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary'
                  )}
                />
                <span className="text-primary text-[14px] font-normal whitespace-nowrap">
                  {token?.name}
                </span>
              </div>
            </div>

            {/* Create Button */}
            <div className="flex justify-center pt-2">
              <button
                onClick={handleCreateOffer}
                disabled={isProcessing === 1 || !amount}
                className={cn(
                  'flex items-center gap-2 px-8 py-3 rounded-xl text-[14px] font-normal transition-colors',
                  isProcessing === 1 || !amount
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary/90'
                )}
              >
                {isProcessing === 1 ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <PlusCircle size={18} />
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
