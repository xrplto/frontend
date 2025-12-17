import axios from 'axios';
import { useState, useEffect, useContext } from 'react';
import Decimal from 'decimal.js-light';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import { X, ShoppingCart } from 'lucide-react';
import { PulseLoader } from '../components/Spinners';
import { fNumber } from 'src/utils/formatters';

function GetNum(amount) {
  let num = 0;
  try {
    num = new Decimal(amount).toNumber();
    if (num < 0) num = 0;
  } catch (err) {}
  return num;
}

export default function BuyMintDialog({
  open,
  setOpen,
  type,
  cid,
  costs,
  setMints,
  setXrpBalance
}) {
  const BASE_URL = 'https://api.xrpl.to/api';
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const { accountProfile, openSnackbar } = useContext(AppContext);
  const account = accountProfile?.account;
  const accountToken = accountProfile?.token;

  const [openScanQR, setOpenScanQR] = useState(false);
  const [uuid, setUuid] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(0);

  const [disclaimer, setDisclaimer] = useState(false);

  const [cost, setCost] = useState(costs[0]);

  let canApprove = false;
  const amt = GetNum(quantity);
  if (amt > 0 && disclaimer) canApprove = true;

  useEffect(() => {
    var timer = null;
    var isRunning = false;
    var counter = 150;
    async function getPayload() {
      if (isRunning) return;
      isRunning = true;
      try {
        const ret = await axios.get(
          `${BASE_URL}/spin/buymint/${uuid}?account=${account}&cid=${cid}`,
          { headers: { 'x-access-token': accountToken } }
        );
        const resolved_at = ret.data?.resolved_at;
        const dispatched_result = ret.data?.dispatched_result;
        if (resolved_at) {
          setOpenScanQR(false);
          if (dispatched_result === 'tesSUCCESS') {
            const newMints = ret.data.mints;
            const newXrpBalance = ret.data.xrpBalance;

            setMints(newMints);
            setXrpBalance(newXrpBalance);
            handleClose();
            openSnackbar('Buy Mints successful!', 'success');
          } else openSnackbar('Buy Mints rejected!', 'error');

          return;
        }
      } catch (err) {}
      isRunning = false;
      counter--;
      if (counter <= 0) {
        openSnackbar('Buy Mints timeout!', 'error');
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
  }, [openScanQR, uuid]);

  const onPaymentXumm = async () => {
    openSnackbar('Xaman no longer supported', 'info');
    return; // Function disabled
  };

  const handleScanQRClose = () => {
    setOpenScanQR(false);
  };

  const handleClose = () => {
    setOpen(false);

    setCost(costs[0]);
    setQuantity(0);
    setDisclaimer(false);
  };

  const handleChangeQuantity = (e) => {
    const value = e.target.value;
    try {
      const amt = value ? Number(value.replace(/[^0-9]/g, '')) : 0;
      setQuantity(amt);
    } catch (e) {}
  };

  const handleApprove = (e) => {
    if (quantity > 0) {
      openSnackbar('Device authentication required', 'info');
    } else {
      openSnackbar('Invalid value!', 'error');
    }
  };

  const handleChangeDisclaimer = (e) => {
    setDisclaimer(e.target.checked);
  };

  const handleChangeCost = (e) => {
    const value = e.target.value;

    let newCost = null;
    for (var t of costs) {
      if (t.md5 === value) {
        newCost = t;
        break;
      }
    }
    if (newCost) setCost(newCost);
  };

  if (!open) return null;

  return (
    <>
      {/* Loading Backdrop */}
      {loading && (
        <div className="fixed inset-0 z-[1303] flex items-center justify-center bg-black/50">
          <PulseLoader color={'#FF4842'} size={10} />
        </div>
      )}

      {/* Dialog */}
      <div className="fixed inset-0 z-[1302] flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={handleClose}>
        <div
          className={cn(
            'w-full max-w-md rounded-2xl border my-8',
            isDark ? 'bg-black/90 backdrop-blur-2xl border-[#3f96fe]/10 shadow-[0_8px_40px_rgba(0,0,0,0.6)]' : 'bg-white/98 backdrop-blur-2xl border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-2 border-b border-white/10">
            <h3 className={cn('text-[15px] font-normal', isDark ? 'text-white' : 'text-gray-900')}>
              Buy Mint
            </h3>
            <button
              onClick={handleClose}
              className={cn(
                'p-1 rounded-lg',
                isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              )}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-2">
            <div className="px-1 pr-1">
              <p
                className={cn(
                  'text-[13px] font-normal mt-0',
                  isDark ? 'text-white' : 'text-gray-900'
                )}
              >
                To power up the spinner, you need at least 1 or more Mints. This will enable you to
                purchase NFTs {type === 'random' ? 'randomly' : 'sequentially'} selected from this
                collection.
              </p>
              <p
                className={cn(
                  'text-[13px] font-normal mt-2',
                  isDark ? 'text-white' : 'text-gray-900'
                )}
              >
                Mints purchased for this collection cannot be used on other collections.
              </p>

              <div className="flex flex-col gap-2 mt-2">
                <div className="flex flex-row gap-2 items-center">
                  <span
                    className={cn(
                      'text-[13px] font-medium',
                      isDark ? 'text-white' : 'text-gray-900'
                    )}
                  >
                    Cost
                  </span>
                  <select
                    id="select_cost"
                    value={cost.md5}
                    onChange={handleChangeCost}
                    className={cn(
                      'rounded-lg border-[1.5px] px-2 py-1 text-[13px] font-normal',
                      isDark
                        ? 'bg-black border-white/15 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    )}
                  >
                    {costs.map((cost, idx) => (
                      <option key={cost.md5} value={cost.md5}>
                        {cost.amount} {cost.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-row gap-2 mt-2 items-center">
                <span
                  className={cn(
                    'text-[13px] font-medium',
                    isDark ? 'text-white' : 'text-gray-900'
                  )}
                >
                  Quantity <span className="text-[11px] text-[#EB5757]">*</span>
                </span>
                <input
                  type="text"
                  id="input-with-sx2"
                  value={quantity}
                  autoComplete="new-password"
                  onChange={handleChangeQuantity}
                  onFocus={(event) => event.target.select()}
                  onKeyDown={(e) => e.stopPropagation()}
                  className={cn(
                    'w-20 rounded-lg border-[1.5px] px-3 py-1 text-center text-[13px] font-normal',
                    isDark
                      ? 'bg-black border-white/15 text-white placeholder:text-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
                  )}
                />
              </div>

              <div className="flex flex-row gap-2 mt-3">
                <span
                  className={cn(
                    'text-[13px] font-medium',
                    isDark ? 'text-white' : 'text-gray-900'
                  )}
                >
                  Total {cost.name} Required
                </span>
                <span className="text-[13px] font-medium text-[#33C2FF]">
                  {fNumber(cost.amount * quantity)} {cost.name}
                </span>
              </div>

              <div className="mt-3 flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={disclaimer}
                  onChange={handleChangeDisclaimer}
                  className="mt-1"
                  id="disclaimer-checkbox"
                />
                <label
                  htmlFor="disclaimer-checkbox"
                  className={cn('text-[11px] font-normal', isDark ? 'text-white' : 'text-gray-900')}
                >
                  I understand that I will be purchasing{' '}
                  <span className="text-[11px] font-normal text-[#33C2FF]">{quantity} Mints</span>{' '}
                  with total{' '}
                  <span className="text-[11px] font-normal text-[#33C2FF]">
                    {fNumber(cost.amount * quantity)} {cost.name}
                  </span>
                  . Each Mint will mint the NFT on XRPL and transfer it to my wallet address which
                  is{' '}
                  <span className="text-[11px] font-normal text-[#33C2FF]">{account}</span>
                </label>
              </div>

              <div className="flex flex-row gap-2 justify-center mt-3 mb-4">
                <button
                  className={cn(
                    'rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal',
                    isDark
                      ? 'border-white/15 hover:bg-primary/5 text-white'
                      : 'border-gray-300 hover:bg-gray-100 text-gray-900',
                    !canApprove && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={handleApprove}
                  disabled={!canApprove}
                >
                  Approve in My Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
