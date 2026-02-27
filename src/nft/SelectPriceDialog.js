import api from 'src/utils/api';
import { useState, useContext } from 'react';
import Decimal from 'decimal.js-light';
import { X, CheckCircle, ArrowRight } from 'lucide-react';
import { WalletContext, AppContext } from 'src/context/AppContext';
import { normalizeAmount } from 'src/utils/parseUtils';
import { formatDateTime, checkExpiration } from 'src/utils/formatters';
import { cn } from 'src/utils/cn';

function GetNum(amount) {
  let num = 0;
  try {
    num = new Decimal(amount).toNumber();
    if (num < 0) num = 0;
  } catch (err) {}
  return num;
}

export default function SelectPriceDialog({ open, setOpen, offers, handleAccept }) {
  const { accountProfile } = useContext(WalletContext);
  const { openSnackbar } = useContext(AppContext);

  const [offer, setOffer] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleClose = () => {
    setOpen(false);
  };

  const handleOK = () => {
    if (offer) {
      handleAccept(offer);
      setOpen(false);
    } else {
      openSnackbar('Please select one payment method', 'error');
    }
  };

  const handleListItemClick = (event, index) => {
    setSelectedIndex(index);
    setOffer(offers[index]);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1302] flex items-center justify-center p-4 max-sm:h-dvh">
      <div className="absolute inset-0 backdrop-blur-sm" onClick={handleClose} />

      <div
        className={cn(
          'relative w-full max-w-xs rounded-xl',
          'bg-white text-gray-900 dark:bg-[#0d0d0d] dark:border dark:border-white/[0.08] dark:text-white'
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between border-b p-4',
            'border-gray-200 dark:border-white/[0.08]'
          )}
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={18} />
            <h2 className="text-[15px] font-normal">Checkout</h2>
          </div>
          <button
            onClick={handleClose}
            className={cn('rounded-lg p-1.5', 'hover:bg-gray-100 dark:hover:bg-white/10')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {offers.map((offer, idx) => {
            const price = normalizeAmount(offer.amount);
            let priceAmount = price.amount;
            if (priceAmount < 1) {
            } else {
              priceAmount = new Decimal(price.amount).toDP(2, Decimal.ROUND_DOWN).toNumber();
            }

            const expired = checkExpiration(offer.expiration);

            return (
              <div key={offer.nft_offer_index}>
                {idx > 0 && (
                  <div className={cn('my-2 h-px', 'bg-gray-200 dark:bg-white/10')} />
                )}
                <button
                  onClick={(event) => handleListItemClick(event, idx)}
                  className={cn(
                    'w-full rounded-lg p-4 text-left transition-colors',
                    selectedIndex === idx
                      ? 'bg-primary/5 dark:bg-primary/10'
                      : 'hover:bg-gray-50 dark:hover:bg-white/5'
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-normal text-primary">
                        {priceAmount} {price.name}
                      </p>
                    </div>
                    {offer.destination && (
                      <div className="flex items-center gap-2">
                        <ArrowRight size={14} />
                        <p
                          className={cn('text-[11px]', 'text-gray-500 dark:text-white/50')}
                        >
                          {offer.destination}
                        </p>
                      </div>
                    )}
                    {offer.expiration && (
                      <p className={cn('text-[11px]', 'text-gray-500 dark:text-white/50')}>
                        {expired ? 'Expired' : 'Expires'} on{' '}
                        {formatDateTime(offer.expiration * 1000)}
                      </p>
                    )}
                  </div>
                </button>
              </div>
            );
          })}

          <div className="mt-6 flex justify-center">
            <button
              onClick={handleOK}
              className={cn(
                'rounded-lg border-[1.5px] px-8 py-2 text-[13px] font-normal transition-colors',
                'border-primary bg-primary/5 text-primary hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/20'
              )}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
