import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import { CheckCircle, X } from 'lucide-react';
import { normalizeAmount } from 'src/utils/parseUtils';

export default function ConfirmAcceptOfferDialog({ open, setOpen, offer, onContinue }) {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const price = normalizeAmount(offer?.amount);

  const handleClose = () => {
    setOpen(false);
  };

  const handleYes = () => {
    setOpen(false);
    onContinue();
  };

  const handleNo = () => {
    setOpen(false);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={handleClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4">
        <div
          className={cn(
            "rounded-xl border-[1.5px] p-6",
            isDark ? "border-white/10 bg-black" : "border-gray-200 bg-white"
          )}
        >
          <button
            onClick={handleClose}
            className={cn(
              "absolute right-4 top-4 rounded-lg p-1",
              isDark ? "hover:bg-white/5" : "hover:bg-gray-100"
            )}
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center gap-4 px-4">
            <div className="flex items-center gap-2">
              <CheckCircle size={24} className="text-primary" />
              <h2 className="text-[18px] font-normal text-primary">Confirm Offer</h2>
            </div>

            <p className={cn(
              "text-center text-[13px] font-normal",
              isDark ? "text-white/60" : "text-gray-600"
            )}>
              Are you sure you want to accept the offer of
            </p>

            <div className="text-center text-[28px] font-normal text-primary">
              {price.amount} {price.name}
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleNo}
                className={cn(
                  "rounded-lg border-[1.5px] px-6 py-2 text-[13px] font-normal",
                  isDark
                    ? "border-white/15 hover:bg-white/5"
                    : "border-gray-300 hover:bg-gray-100"
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleYes}
                className="rounded-lg border-[1.5px] border-primary bg-transparent px-6 py-2 text-[13px] font-normal text-primary hover:bg-primary/5"
              >
                Accept Offer
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
