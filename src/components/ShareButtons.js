import { useState, useContext } from 'react';
import { cn } from 'src/utils/cn';
import {
  Facebook,
  Send as Telegram,
  MessageCircle as Reddit,
  Mail,
  MessageSquare as WhatsApp,
  Linkedin,
  Share as ShareIcon,
  X,
  Copy
} from 'lucide-react';

import { ThemeContext, AppContext } from 'src/context/AppContext';

// X (Twitter) Social Media Icon
const XSocialIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Individual share buttons for compatibility
export const TwitterShareButton = ({ children, url, title, ...props }) => {
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  return (
    <div
      onClick={() => window.open(shareUrl, '_blank', 'width=550,height=450')}
      role="button"
      tabIndex={0}
      aria-label="Share on Twitter"
      className="cursor-pointer"
      {...props}
    >
      {children}
    </div>
  );
};

export const FacebookShareButton = ({ children, url, ...props }) => {
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  return (
    <div
      onClick={() => window.open(shareUrl, '_blank', 'width=550,height=450')}
      role="button"
      tabIndex={0}
      aria-label="Share on Facebook"
      className="cursor-pointer"
      {...props}
    >
      {children}
    </div>
  );
};

export const FacebookIcon = ({ size = 40, round = false, isDark = true }) => (
  <div
    className={cn('flex items-center justify-center', round ? 'rounded-full' : 'rounded-lg')}
    style={{
      width: size,
      height: size,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(59,130,246,0.05)',
      color: '#1877F2'
    }}
  >
    <Facebook size={size * 0.5} />
  </div>
);

// Transaction Share Modal
export function TxShareModal({ hash, type }) {
  const { themeName } = useContext(ThemeContext);
  const { openSnackbar } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [open, setOpen] = useState(false);

  const url = `https://xrpl.to/tx/${hash}`;
  const title = `Check out this ${type || 'transaction'} on XRPL`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      openSnackbar('Link copied!', 'success');
    });
  };

  const platforms = [
    { label: 'X', icon: XSocialIcon, color: isDark ? '#fff' : '#000', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}` },
    { label: 'Facebook', icon: Facebook, color: '#1877F2', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { label: 'LinkedIn', icon: Linkedin, color: '#0A66C2', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { label: 'WhatsApp', icon: WhatsApp, color: '#25D366', url: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
    { label: 'Telegram', icon: Telegram, color: '#229ED9', url: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
    { label: 'Reddit', icon: Reddit, color: '#FF5700', url: `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}` },
    { label: 'Email', icon: Mail, color: '#6B7280', url: `mailto:?subject=${encodeURIComponent('XRPL Transaction')}&body=${encodeURIComponent(`${title}: ${url}`)}` }
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-[background-color,border-color] duration-200 ${isDark
          ? 'border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-white/60 hover:text-white/80'
          : 'border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          }`}
      >
        <ShareIcon size={12} />
        Share
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/60 backdrop-blur-sm max-sm:h-dvh"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-[90%] max-w-xl rounded-2xl border overflow-hidden ${isDark
              ? 'bg-black/90 backdrop-blur-2xl border-gray-700/50 shadow-[0_8px_40px_rgba(0,0,0,0.6)]'
              : 'bg-white/98 backdrop-blur-2xl border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
              }`}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <span className={`text-[15px] font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Share Transaction
              </span>
              <button onClick={() => setOpen(false)} aria-label="Close" className="p-1.5 rounded-lg hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]">
                <X size={16} className={isDark ? 'text-white/40' : 'text-gray-400'} />
              </button>
            </div>

            <div className="px-4 pb-4 flex flex-col items-center gap-4">
              <div className={`w-full p-3 rounded-lg border-[1.5px] text-center ${isDark ? 'border-gray-600/40 bg-white/[0.04]' : 'border-gray-200 bg-gray-50'
                }`}>
                <p className={`text-[11px] mb-1 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                  Transaction Hash
                </p>
                <p className={`font-mono text-[12px] truncate ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                  {hash}
                </p>
              </div>

              <div className="w-full">
                <p className={`text-[10px] font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                  Share on
                </p>
                <div className="grid grid-cols-7 gap-2">
                  {platforms.map(({ label, icon: Icon, color, url: shareUrl }) => (
                    <div
                      key={label}
                      role="button"
                      tabIndex={0}
                      aria-label={`Share on ${label}`}
                      onClick={() => {
                        if (shareUrl.startsWith('mailto:')) window.location.href = shareUrl;
                        else window.open(shareUrl, '_blank', 'width=550,height=450');
                      }}
                      className="flex justify-center rounded-lg overflow-hidden hover:scale-105 transition-transform cursor-pointer"
                    >
                      <div
                        className="flex items-center justify-center rounded-full"
                        style={{
                          width: 40,
                          height: 40,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(59,130,246,0.05)',
                          color
                        }}
                      >
                        <Icon size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full">
                <p className={`text-[10px] font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                  Copy Link
                </p>
                <div className={`flex items-center gap-2 p-3 rounded-lg border-[1.5px] ${isDark ? 'border-gray-600/40 bg-white/[0.04]' : 'border-gray-200 bg-gray-50'
                  }`}>
                  <span className={`flex-1 text-[12px] truncate ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                    {url}
                  </span>
                  <button
                    onClick={handleCopy}
                    aria-label="Copy link"
                    className={`p-2 rounded-lg transition-[background-color] ${isDark
                      ? 'bg-white/10 hover:bg-white/15 text-white/60'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
                      }`}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
