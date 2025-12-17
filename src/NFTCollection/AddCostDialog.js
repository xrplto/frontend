import { useState, useEffect, useContext } from 'react';
import Decimal from 'decimal.js-light';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import { X, PlusCircle } from 'lucide-react';

// Constants
const XRP_TOKEN = { currency: 'XRP', issuer: 'XRPL' };

function GetNum(amount) {
  let num = 0;
  try {
    num = new Decimal(amount).toNumber();
    if (num < 0) num = 0;
  } catch (err) {}
  return num;
}

export default function AddCostDialog({ open, setOpen, openSnackbar, onAddCost }) {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const [token, setToken] = useState(XRP_TOKEN);
  const [amount, setAmount] = useState('');

  const handleClose = () => {
    setOpen(false);
  };

  const handleChangeAmount = (e) => {
    const value = e.target.value;
    const newAmount = value ? value.replace(/[^0-9.]/g, '') : '';
    setAmount(newAmount);
  };

  const handleAddCost = () => {
    const numAmount = GetNum(amount);
    if (numAmount === 0) openSnackbar('Invalid cost', 'error');
    else {
      token.amount = amount;
      onAddCost(token);
      setOpen(false);
      setAmount('');
      setToken(XRP_TOKEN);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Dialog */}
      <div className="fixed inset-0 z-[1301] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={handleClose}>
        <div
          className={cn(
            'w-full max-w-xs rounded-2xl border',
            isDark ? 'bg-black/90 backdrop-blur-2xl border-[#3f96fe]/10 shadow-[0_8px_40px_rgba(0,0,0,0.6)]' : 'bg-white/98 backdrop-blur-2xl border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-2 border-b border-white/10">
            <h3 className={cn('text-[15px] font-normal', isDark ? 'text-white' : 'text-gray-900')}>
              Add Cost per Mint
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
            <div className="px-1">
              <div
                className={cn(
                  'flex items-center p-2 border-[1.5px] rounded-lg',
                  isDark
                    ? 'border-white/10 bg-white/[0.02]'
                    : 'border-gray-200 bg-gray-50/50'
                )}
              >
                <span
                  className={cn(
                    'text-[13px] font-normal',
                    isDark ? 'text-white' : 'text-gray-900'
                  )}
                >
                  {token?.name || 'XRP'}
                </span>
              </div>

              <div className="flex flex-col gap-2 mt-3">
                <div className="text-[15px] font-normal">
                  Cost <span className="text-[13px] font-medium text-[#EB5757]">*</span>
                </div>

                <div className="flex flex-row gap-2 items-center">
                  <input
                    type="text"
                    id="id_txt_costamountpermint"
                    className={cn(
                      'flex-1 rounded-lg border-[1.5px] px-3 py-2 text-[13px] font-normal',
                      isDark
                        ? 'bg-black border-white/15 text-white placeholder:text-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
                    )}
                    placeholder=""
                    value={amount}
                    autoComplete="new-password"
                    onChange={handleChangeAmount}
                    onFocus={(event) => {
                      event.target.select();
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                  <span
                    className={cn(
                      'text-[15px] font-normal',
                      isDark ? 'text-white' : 'text-gray-900'
                    )}
                  >
                    {token?.name}
                  </span>
                </div>
              </div>

              <div className="flex flex-row gap-2 justify-center mt-3 mb-3">
                <button
                  className={cn(
                    'flex items-center gap-2 rounded-lg border-[1.5px] px-3 py-1.5 text-[13px] font-normal',
                    isDark
                      ? 'border-white/15 hover:bg-primary/5 text-white'
                      : 'border-gray-300 hover:bg-gray-100 text-gray-900'
                  )}
                  onClick={handleAddCost}
                >
                  <PlusCircle size={16} />
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
