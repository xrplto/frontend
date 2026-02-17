import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectProcess, selectTxHash, updateProcess } from 'src/redux/transactionSlice';
import { cn } from 'src/utils/cn';

const TransactionAlert = () => {
  const dispatch = useDispatch();
  const isProcessing = useSelector(selectProcess);
  const txHash = useSelector(selectTxHash);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      dispatch(updateProcess(0));
      setIsClosing(false);
    }, 300);
  };

  useEffect(() => {
    if (isProcessing === 2 || isProcessing === 3) {
      const timer = setTimeout(
        () => {
          handleClose();
        },
        isProcessing === 2 ? 6000 : 5000
      );
      return () => clearTimeout(timer);
    }
  }, [isProcessing]);

  const alertConfig = {
    1: {
      title: 'Waiting for Signature',
      content: 'Please review and sign the transaction in your wallet',
      icon: (
        <>
          <svg
            className="w-[18px] h-[18px] fill-white"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
          </svg>
          <div className="absolute w-9 h-9 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </>
      ),
      severity: 'info',
      autoHideDuration: null,
      showClose: false
    },
    2: {
      title: 'Transaction Confirmed',
      content: (
        <>
          Transaction successfully submitted
          {txHash && (
            <a
              href={`/tx/${txHash}`}
              className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 bg-white/20 rounded-lg text-white no-underline text-[13px] font-normal hover:bg-white/30"
            >
              View Transaction
            </a>
          )}
        </>
      ),
      icon: (
        <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
        </svg>
      ),
      severity: 'success',
      autoHideDuration: 6000,
      showClose: true
    },
    3: {
      title: 'Transaction Cancelled',
      content: 'The transaction was cancelled or rejected',
      icon: (
        <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      ),
      severity: 'error',
      autoHideDuration: 5000,
      showClose: true
    }
  };

  const currentConfig = alertConfig[isProcessing];

  if (!isProcessing || !currentConfig) {
    return null;
  }

  const { title, content, icon, severity, autoHideDuration, showClose } = currentConfig;

  const getSeverityBg = () => {
    switch (severity) {
      case 'success':
        return 'rgba(16, 185, 129, 0.95)';
      case 'error':
        return 'rgba(239, 68, 68, 0.95)';
      default:
        return 'rgba(59, 130, 246, 0.95)';
    }
  };

  return (
    <>
      <div
        className={cn(
          'fixed bottom-6 right-6 z-[9999] sm:min-w-[360px] sm:max-w-[480px]',
          'max-sm:left-4 max-sm:right-4 max-sm:bottom-[calc(16px+env(safe-area-inset-bottom))]',
          isClosing ? 'animate-slideOutDown' : 'animate-slideInUp'
        )}
      >
        <div
          className="p-5 rounded-xl backdrop-blur-[20px] border-[1.5px] border-white/20 text-white relative overflow-hidden"
          style={{ background: getSeverityBg() }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 backdrop-blur-[10px] flex-shrink-0 relative">
              {icon}
            </div>
            <h3 className="m-0 text-base font-semibold tracking-tight flex-1">{title}</h3>
            {showClose && (
              <button
                onClick={handleClose}
                className="bg-white/20 border-none w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/30 active:scale-95"
              >
                <svg
                  className="w-4 h-4 fill-white"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                </svg>
              </button>
            )}
          </div>
          <div className="ml-12 text-sm leading-relaxed opacity-95">
            {typeof content === 'string' ? content : content}
          </div>
          {autoHideDuration && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 overflow-hidden">
              <div
                className="absolute top-0 left-0 bottom-0 w-full bg-white/80 animate-progress"
                style={{ animationDuration: `${autoHideDuration}ms` }}
              />
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideOutDown {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(100%);
            opacity: 0;
          }
        }

        @keyframes progress {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }

        :global(.animate-slideInUp) {
          animation: slideInUp 0.3s ease-out;
        }

        :global(.animate-slideOutDown) {
          animation: slideOutDown 0.3s ease-out forwards;
        }

        :global(.animate-progress) {
          animation: progress linear forwards;
        }
      `}</style>
    </>
  );
};

export default TransactionAlert;
