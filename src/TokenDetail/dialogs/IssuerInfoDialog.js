import Decimal from 'decimal.js-light';
import { useContext } from 'react';
import { X, Copy, MessageCircle } from 'lucide-react';

// Context
import { AppContext } from 'src/context/AppContext';

// Utils
import { cn } from 'src/utils/cn';
import { fNumber } from 'src/utils/formatters';

export default function IssuerInfoDialog({ open, setOpen, token }) {
  const { themeName, openSnackbar } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const { issuer, name, user, currency, md5, ext, issuer_info } = token;

  const imgUrl = `https://s1.xrpl.to/token/${md5}`;

  const info = issuer_info || {};

  const handleClose = () => {
    setOpen(false);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      openSnackbar(`${label} copied!`, 'success');
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1302] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className={cn(
          'relative w-full max-w-md rounded-2xl border overflow-hidden',
          isDark
            ? 'bg-black/90 backdrop-blur-2xl border-[#3f96fe]/10 shadow-[0_8px_40px_rgba(0,0,0,0.6)]'
            : 'bg-white/98 backdrop-blur-2xl border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
        )}
      >
        {/* Dialog Title */}
        <div
          className={cn('flex items-center justify-between p-4', isDark ? 'bg-black' : 'bg-white')}
        >
          <div className="flex items-center gap-2">
            <img
              src={imgUrl}
              alt={`${user} ${name} Logo`}
              className="w-10 h-10 rounded-lg object-cover"
            />
            <div>
              <p className="text-primary text-[15px] font-normal">{name}</p>
              <p className={cn('text-[12px]', isDark ? 'text-white/60' : 'text-gray-500')}>
                {user}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
              isDark ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <X size={20} />
          </button>
        </div>

        {/* Dialog Content */}
        <div className={cn('p-4 space-y-4', isDark ? 'bg-black' : 'bg-gray-50')}>
          {/* Issuer */}
          <div className="flex items-center gap-2">
            <span
              className={cn('text-[13px] font-normal', isDark ? 'text-white/60' : 'text-gray-500')}
            >
              Issuer:
            </span>
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <a
                href={`/address/${issuer}`}
                className={cn(
                  'flex-1 font-mono text-[13px] px-2 py-1 rounded truncate transition-colors',
                  isDark
                    ? 'bg-white/5 text-white/60 hover:text-primary'
                    : 'bg-gray-100 text-gray-600 hover:text-primary'
                )}
              >
                {issuer}
              </a>
              <button
                onClick={() => copyToClipboard(issuer, 'Address')}
                className={cn(
                  'flex-shrink-0 p-1 rounded transition-colors',
                  isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                )}
                title="Copy address"
              >
                <Copy size={14} className={isDark ? 'text-white/60' : 'text-gray-500'} />
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openDm', { detail: { user: issuer } }))}
                className={cn(
                  'flex-shrink-0 p-1 rounded transition-colors',
                  isDark ? 'hover:bg-white/10 text-white/60 hover:text-[#650CD4]' : 'hover:bg-gray-200 text-gray-500 hover:text-[#650CD4]'
                )}
                title="Message issuer"
              >
                <MessageCircle size={14} />
              </button>
            </div>
          </div>

          {/* Currency */}
          <div className="flex items-center gap-2">
            <span
              className={cn('text-[13px] font-normal', isDark ? 'text-white/60' : 'text-gray-500')}
            >
              Currency:
            </span>
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  'text-[13px] font-normal text-primary px-2 py-1 rounded',
                  isDark ? 'bg-white/5' : 'bg-gray-100'
                )}
              >
                {currency}
              </span>
              <button
                onClick={() => copyToClipboard(currency, 'Currency code')}
                className={cn(
                  'p-1 rounded transition-colors',
                  isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                )}
                title="Copy currency code"
              >
                <Copy size={14} className={isDark ? 'text-white/60' : 'text-gray-500'} />
              </button>
            </div>
          </div>

          {/* Blackholed Warning */}
          {info.blackholed && (
            <div className="p-3 rounded-lg bg-red-500/10">
              <p className="text-[13px] text-red-500">
                This account is BLACKHOLED. It can not issue more tokens.
              </p>
            </div>
          )}

          {/* Domain */}
          {info.domain && (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-[13px] font-normal',
                  isDark ? 'text-white/60' : 'text-gray-500'
                )}
              >
                Domain:
              </span>
              <a
                href={info.domain.startsWith('https://') ? info.domain : `https://${info.domain}`}
                target="_blank"
                rel="noreferrer noopener nofollow"
                className="text-[13px] text-primary hover:opacity-80 transition-opacity"
              >
                {info.domain}
              </a>
            </div>
          )}

          {/* Other Info Fields */}
          {Object.entries({
            tickSize: 'Tick Size',
            globalFreeze: 'Global Freeze',
            requireAuth: 'Token Auth',
            disableMaster: 'Disable Master',
            depositAuth: 'Deposit Auth',
            requireDestTag: 'Destination Tag',
            disallowXRP: 'Receiving XRP',
            transferRate: 'Transfer Fee',
            noFreeze: 'No Freeze',
            defaultRipple: 'Rippling'
          }).map(
            ([key, label]) =>
              info[key] && (
                <div key={key} className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-[13px] font-normal',
                      isDark ? 'text-white/60' : 'text-gray-500'
                    )}
                  >
                    {label}:
                  </span>
                  <span className={cn('text-[13px]', isDark ? 'text-white' : 'text-gray-900')}>
                    {key === 'transferRate'
                      ? `${fNumber(new Decimal(info[key]).sub(1).mul(100).toNumber())}%`
                      : key === 'tickSize'
                        ? info[key]
                        : key === 'globalFreeze'
                          ? 'Freeze'
                          : key === 'requireAuth'
                            ? 'Required'
                            : key === 'disableMaster'
                              ? 'Disallowed'
                              : key === 'depositAuth'
                                ? 'Enabled'
                                : key === 'requireDestTag'
                                  ? 'Required'
                                  : key === 'disallowXRP'
                                    ? 'Disabled'
                                    : key === 'noFreeze'
                                      ? 'True'
                                      : 'Enabled'}
                  </span>
                </div>
              )
          )}
        </div>
      </div>
    </div>
  );
}
