import { useContext } from 'react';
import { ThemeContext } from 'src/context/AppContext';
import { cn } from 'src/utils/cn';
import { Flame, X } from 'lucide-react';

export default function ConfirmBurnDialog({ open, setOpen, onContinue }) {
  const { themeName } = useContext(ThemeContext);
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
          'fixed inset-0 z-50 backdrop-blur-md max-sm:h-dvh',
          'bg-white/60 dark:bg-black/70'
        )}
        onClick={handleClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2">
        <div
          className={cn(
            'rounded-2xl border-[1.5px] p-6',
            'bg-white/80 backdrop-blur-2xl border-gray-200/60 shadow-2xl shadow-gray-300/30 dark:bg-black/80 dark:backdrop-blur-2xl dark:border-white/[0.08] dark:shadow-2xl dark:shadow-black/50'
          )}
        >
          <button
            onClick={handleClose}
            className={cn(
              'absolute right-4 top-4 rounded-lg p-1',
              'hover:bg-gray-100 dark:hover:bg-white/5'
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
                'text-gray-900 dark:text-white'
              )}
            >
              Confirm NFT Burn
            </h2>

            <p
              className={cn(
                'text-center text-[13px] font-normal',
                'text-gray-600 dark:text-white/60'
              )}
            >
              Are you absolutely certain you want to burn this NFT? This action cannot be undone.
            </p>

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleNo}
                className={cn(
                  'rounded-lg border-[1.5px] px-6 py-2 text-[13px] font-normal',
                  'border-gray-300 hover:bg-gray-100 dark:border-white/15 dark:hover:bg-white/5'
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
