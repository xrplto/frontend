import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import { Flame, X } from 'lucide-react';

export default function ConfirmBurnDialog({ open, setOpen, onContinue }) {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

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
      <div
        className={cn(
          'fixed inset-0 z-50 backdrop-blur-md',
          isDark ? 'bg-black/70' : 'bg-white/60'
        )}
        onClick={handleClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2">
        <div
          className={cn(
            'rounded-2xl border-[1.5px] p-6',
            isDark
              ? 'bg-black/80 backdrop-blur-2xl border-white/[0.08] shadow-2xl shadow-black/50'
              : 'bg-white/80 backdrop-blur-2xl border-gray-200/60 shadow-2xl shadow-gray-300/30'
          )}
        >
          <button
            onClick={handleClose}
            className={cn(
              'absolute right-4 top-4 rounded-lg p-1',
              isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'
            )}
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-red-500/10 p-4">
              <Flame size={48} className="text-red-500" />
            </div>

            <h2
              className={cn(
                'text-center text-[18px] font-normal',
                isDark ? 'text-white' : 'text-gray-900'
              )}
            >
              Confirm NFT Burn
            </h2>

            <p
              className={cn(
                'text-center text-[13px] font-normal',
                isDark ? 'text-white/60' : 'text-gray-600'
              )}
            >
              Are you absolutely certain you want to burn this NFT? This action cannot be undone.
            </p>

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleNo}
                className={cn(
                  'rounded-lg border-[1.5px] px-6 py-2 text-[13px] font-normal',
                  isDark ? 'border-white/15 hover:bg-white/5' : 'border-gray-300 hover:bg-gray-100'
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleYes}
                className="flex items-center gap-2 rounded-lg bg-red-500 px-6 py-2 text-[13px] font-normal text-white hover:bg-red-600"
              >
                <Flame size={14} />
                Burn NFT
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
