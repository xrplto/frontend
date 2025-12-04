import { useState, useContext } from 'react';
import {
  TwitterShareButton,
  FacebookShareButton,
  TelegramShareButton,
  WhatsappShareButton,
  LinkedinShareButton,
  RedditShareButton,
  EmailShareButton,
  TwitterIcon,
  FacebookIcon,
  TelegramIcon,
  WhatsappIcon,
  LinkedinIcon,
  RedditIcon,
  EmailIcon
} from '../../components/ShareButtons';
import { Share as ShareIcon, X, Copy } from 'lucide-react';
import { AppContext } from 'src/AppContext';
import { useSelector } from 'react-redux';
import { selectActiveFiatCurrency, selectMetrics } from 'src/redux/statusSlice';
import { fNumber } from 'src/utils/formatters';

const currencySymbols = {
  USD: '$ ',
  EUR: '€ ',
  JPY: '¥ ',
  CNH: '¥ ',
  XRP: '✕ '
};

export default function Share({ token }) {
  const { openSnackbar, themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const metrics = useSelector(selectMetrics);
  const activeFiatCurrency = useSelector(selectActiveFiatCurrency);

  const [open, setOpen] = useState(false);

  const { name, md5, exch } = token;
  const user = token.user || name;
  const imgUrl = `https://s1.xrpl.to/token/${md5}`;

  const getCleanUrl = () => {
    if (typeof window === 'undefined') return '';
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('fromSearch');
    return currentUrl.toString();
  };

  const url = getCleanUrl();

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      openSnackbar('Link copied!', 'success');
    });
  };

  const socialPlatforms = [
    { Component: TwitterShareButton, Icon: TwitterIcon, props: { title: `${user} ${name}`, url } },
    { Component: FacebookShareButton, Icon: FacebookIcon, props: { url } },
    { Component: LinkedinShareButton, Icon: LinkedinIcon, props: { url, title: `${user} ${name}` } },
    { Component: WhatsappShareButton, Icon: WhatsappIcon, props: { url, title: `${user} ${name}` } },
    { Component: TelegramShareButton, Icon: TelegramIcon, props: { url, title: `${user} ${name}` } },
    { Component: RedditShareButton, Icon: RedditIcon, props: { url, title: `${user} ${name}` } },
    { Component: EmailShareButton, Icon: EmailIcon, props: { subject: `${user} ${name}`, body: `Check out: ${url}` } }
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg border-[1.5px] text-[10px] font-medium transition-colors ${
          isDark
            ? 'border-white/10 text-white/50 hover:border-primary/30 hover:text-primary'
            : 'border-gray-200 text-gray-500 hover:border-primary/30 hover:text-primary'
        }`}
      >
        <ShareIcon size={12} />
        Share
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className={`w-[90%] max-w-[400px] rounded-xl border-[1.5px] overflow-hidden ${
              isDark ? 'bg-[#0a0f1a]/95 backdrop-blur-xl border-primary/20' : 'bg-white border-gray-200'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className={`text-[15px] font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Share {user}
              </span>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                <X size={16} className={isDark ? 'text-white/40' : 'text-gray-400'} />
              </button>
            </div>

            {/* Content */}
            <div className="px-4 pb-4 flex flex-col items-center gap-4">
              <img
                src={imgUrl}
                alt={name}
                className={`w-16 h-16 rounded-xl border-2 ${isDark ? 'border-white/10' : 'border-gray-200'}`}
              />
              <span className={`text-[16px] font-medium text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {user} {name}
              </span>

              {/* Price Card */}
              <div className={`w-full p-3 rounded-lg border-[1.5px] text-center ${
                isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-gray-50'
              }`}>
                <p className={`text-[11px] mb-1 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Current Price</p>
                <p className="text-[18px] font-medium text-primary">
                  {currencySymbols[activeFiatCurrency]}
                  {fNumber(exch / (metrics[activeFiatCurrency] || 1))}
                </p>
              </div>

              {/* Share On Section */}
              <div className="w-full">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-[11px] font-medium uppercase tracking-wide ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                    Share on
                  </span>
                  <div
                    className="flex-1 h-px"
                    style={{
                      backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(66,133,244,0.5)' : 'rgba(66,133,244,0.3)'} 1px, transparent 1px)`,
                      backgroundSize: '6px 1px'
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2.5 justify-center">
                  {socialPlatforms.map(({ Component, Icon, props }, i) => (
                    <div key={i} className="rounded-lg overflow-hidden hover:opacity-80 transition-opacity">
                      <Component {...props}>
                        <Icon size={36} round isDark={isDark} />
                      </Component>
                    </div>
                  ))}
                </div>
              </div>

              {/* Copy Link Section */}
              <div className="w-full">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-[11px] font-medium uppercase tracking-wide ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                    Copy Link
                  </span>
                  <div
                    className="flex-1 h-px"
                    style={{
                      backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(66,133,244,0.5)' : 'rgba(66,133,244,0.3)'} 1px, transparent 1px)`,
                      backgroundSize: '6px 1px'
                    }}
                  />
                </div>
                <div className={`flex items-center gap-2 p-2.5 rounded-lg border-[1.5px] ${
                  isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-gray-50'
                }`}>
                  <span className={`flex-1 text-[12px] truncate ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                    {url}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg border-[1.5px] border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
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
