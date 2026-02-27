import { Check, AlertTriangle, X } from 'lucide-react';
import { PuffLoader } from './Spinners';
import { cn } from 'src/utils/cn';

/**
 * Transaction Preview Modal - shared between Swap and NFT actions
 * @param {boolean} isDark - Theme
 * @param {boolean} simulating - Show loading state
 * @param {object} preview - { status: 'success'|'warning'|'error', title, description, error, engineResult }
 * @param {function} onClose - Close handler
 * @param {function} onConfirm - Confirm handler (optional, only for success/warning)
 * @param {string} confirmLabel - Button label (default: "Confirm")
 * @param {string} confirmColor - Button color for success (default: "#3b82f6")
 * @param {React.ReactNode} children - Additional content
 */
export default function TxPreviewModal({
  isDark,
  simulating,
  preview,
  onClose,
  onConfirm,
  confirmLabel = 'Confirm',
  confirmColor = '#3b82f6',
  children
}) {
  if (!simulating && !preview) return null;

  const iconContainerStyle = (color) => ({
    background: `${color}15`
  });

  return (
    <div role="dialog" aria-modal="true" aria-label="Transaction preview" className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(0,0,0,0.92)] backdrop-blur-[4px] max-sm:h-dvh">
      <div className={cn(
        'w-full max-w-[340px] mx-4 p-5 rounded-2xl border',
        'bg-white border-black/[0.08] dark:bg-black dark:border-white/[0.08]'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className={cn('text-[11px]', 'text-black/30 dark:text-white/30')}>
            Preview · No funds sent yet
          </span>
          <button aria-label="Close" className={cn('p-1.5 rounded-lg border-none bg-transparent cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]', 'text-black/40 dark:text-white/40')} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {simulating ? (
          <div className="py-8 text-center">
            <PuffLoader size={40} color="#3b82f6" />
            <p className={cn('mt-3 text-[13px]', 'text-black/50 dark:text-white/50')}>
              Simulating transaction...
            </p>
          </div>
        ) : preview && (
          <>
            {/* Status Icon */}
            {preview.status === 'success' && (
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={iconContainerStyle('#22c55e')}>
                <Check size={24} color="#22c55e" />
              </div>
            )}
            {preview.status === 'warning' && (
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={iconContainerStyle('#f59e0b')}>
                <AlertTriangle size={24} color="#f59e0b" />
              </div>
            )}
            {preview.status === 'error' && (
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={iconContainerStyle('#ef4444')}>
                <AlertTriangle size={24} color="#ef4444" />
              </div>
            )}

            {/* Title */}
            <h3 className={cn('text-center text-base font-semibold mb-1.5', 'text-[#111] dark:text-white')}>{preview.title}</h3>

            {/* Description */}
            {preview.description && <p className={cn('text-center text-[13px] mb-4', 'text-black/50 dark:text-white/50')}>{preview.description}</p>}

            {/* Error Box */}
            {preview.status === 'error' && preview.error && (
              <div className="p-3 rounded-[10px] mb-4 bg-red-500/[0.08]">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} color="#ef4444" className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-red-500 mb-0.5">
                      {preview.engineResult}
                    </p>
                    <p className="text-[11px] text-red-500/80">{preview.error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Warning Box */}
            {preview.status === 'warning' && preview.warning && (
              <div className="p-3 rounded-[10px] mb-4 bg-amber-500/[0.08]">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} color="#f59e0b" className="mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-500">{preview.warning}</p>
                </div>
              </div>
            )}

            {/* Custom content */}
            {children}

            {/* Buttons */}
            <div className="flex gap-[10px]">
              <button className={cn('flex-1 p-3 rounded-[10px] border bg-transparent text-[13px] font-medium cursor-pointer', 'border-black/10 text-black/60 dark:border-white/10 dark:text-white/60')} onClick={onClose}>Cancel</button>
              {preview.status !== 'error' && onConfirm && (
                <button className="flex-1 p-3 rounded-[10px] border-none text-[13px] font-semibold cursor-pointer text-white" style={{ background: confirmColor }} onClick={onConfirm}>
                  {confirmLabel}
                </button>
              )}
              {preview.status === 'error' && (
                <button className={cn('flex-1 p-3 rounded-[10px] border-none text-[13px] font-semibold cursor-not-allowed', 'bg-black/5 text-black/30 dark:bg-white/5 dark:text-white/30')} disabled>
                  Cannot Execute
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
