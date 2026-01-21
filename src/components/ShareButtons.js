import { useState, useContext } from 'react';
import { cn } from 'src/utils/cn';
import {
  Twitter,
  Facebook,
  Send as Telegram,
  MessageCircle as Reddit,
  Mail,
  MessageSquare as WhatsApp,
  Linkedin,
  Share as ShareIcon,
  X,
  Copy,
  Link2,
  Check,
  Share2
} from 'lucide-react';

import { AppContext } from 'src/AppContext';
import { useSelector } from 'react-redux';
import { selectActiveFiatCurrency, selectMetrics } from 'src/redux/statusSlice';
import { fNumber } from 'src/utils/formatters';

// X (Twitter) Social Media Icon
const XSocialIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

// Reusable Share Dropdown Component
export function ShareDropdown({ url, title, buttonLabel = 'Share' }) {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [open, setOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const options = [
    {
      name: 'Share on X',
      icon: <XSocialIcon size={14} />,
      url: `https://x.com/intent/tweet?text=${encodeURIComponent(`${title}: ${url}`)}`
    },
    {
      name: 'Share on Telegram',
      icon: <Telegram className="w-3.5 h-3.5" />,
      url: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
    },
    {
      name: linkCopied ? 'Copied!' : 'Copy link',
      icon: linkCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Link2 className="w-3.5 h-3.5" />,
      action: () => {
        navigator.clipboard.writeText(url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      }
    }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all duration-200',
          isDark
            ? 'border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-white/60 hover:text-white/80'
            : 'border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700'
        )}
      >
        <Share2 size={12} />
        {buttonLabel}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={cn(
              'absolute top-full right-0 mt-2 rounded-lg border z-50 p-1.5 min-w-[160px]',
              isDark ? 'bg-[#111] border-white/10' : 'bg-white border-gray-200 shadow-lg'
            )}
          >
            {options.map((opt) => (
              <button
                key={opt.name}
                onClick={() => {
                  if (opt.url) window.open(opt.url, '_blank');
                  else opt.action();
                  if (!opt.action) setOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12px] text-left transition-colors',
                  isDark ? 'hover:bg-white/10 text-white/80' : 'hover:bg-gray-100 text-gray-700'
                )}
              >
                {opt.icon}
                {opt.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Share URL generators
const getShareUrls = (url, title) => ({
  twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  reddit: `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this link: ${url}`)}`
});

// Icon mapping
const getIcon = (platform, size = 20) => {
  const props = { size };
  switch (platform) {
    case 'twitter':
      return <XSocialIcon {...props} />;
    case 'facebook':
      return <Facebook {...props} />;
    case 'telegram':
      return <Telegram {...props} />;
    case 'whatsapp':
      return <WhatsApp {...props} />;
    case 'linkedin':
      return <Linkedin {...props} />;
    case 'reddit':
      return <Reddit {...props} />;
    case 'email':
      return <Mail {...props} />;
    default:
      return null;
  }
};

const getIconColor = (platform, isDark = false) => {
  switch (platform) {
    case 'twitter':
      return isDark ? '#FFFFFF' : '#000000';
    case 'facebook':
      return '#1877F2';
    case 'telegram':
      return '#229ED9';
    case 'whatsapp':
      return '#25D366';
    case 'linkedin':
      return '#0A66C2';
    case 'reddit':
      return '#FF5700';
    case 'email':
      return '#6B7280';
    default:
      return '#6B7280';
  }
};

const getBgColor = (isDark = true) => (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(59,130,246,0.05)');

// Share button component
export const ShareButton = ({
  platform,
  url,
  title,
  size = 40,
  round = true,
  isDark = true,
  ...props
}) => {
  const shareUrls = getShareUrls(url, title);
  const shareUrl = shareUrls[platform];

  const handleShare = () => {
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=550,height=450');
    }
  };

  const iconColor = getIconColor(platform, isDark);
  const bgColor = getBgColor(isDark);

  if (round) {
    return (
      <div
        onClick={handleShare}
        role="button"
        aria-label={`Share on ${platform}`}
        tabIndex={0}
        className={cn(
          'flex items-center justify-center rounded-full cursor-pointer transition-all hover:scale-110'
        )}
        style={{
          width: size,
          height: size,
          backgroundColor: bgColor,
          color: iconColor
        }}
        {...props}
      >
        {getIcon(platform, size * 0.5)}
      </div>
    );
  }

  return (
    <button
      onClick={handleShare}
      aria-label={`Share on ${platform}`}
      className="p-2 rounded-lg transition-colors"
      style={{ color: iconColor, backgroundColor: bgColor }}
      {...props}
    >
      {getIcon(platform, 20)}
    </button>
  );
};

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

export const TelegramShareButton = ({ children, url, title, ...props }) => {
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
  return (
    <div
      onClick={() => window.open(shareUrl, '_blank', 'width=550,height=450')}
      role="button"
      tabIndex={0}
      aria-label="Share on Telegram"
      className="cursor-pointer"
      {...props}
    >
      {children}
    </div>
  );
};

export const WhatsAppShareButton = ({ children, url, title, ...props }) => {
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
  return (
    <div
      onClick={() => window.open(shareUrl, '_blank', 'width=550,height=450')}
      role="button"
      tabIndex={0}
      aria-label="Share on WhatsApp"
      className="cursor-pointer"
      {...props}
    >
      {children}
    </div>
  );
};

export const WhatsappShareButton = WhatsAppShareButton;

export const LinkedInShareButton = ({ children, url, ...props }) => {
  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  return (
    <div
      onClick={() => window.open(shareUrl, '_blank', 'width=550,height=450')}
      role="button"
      tabIndex={0}
      aria-label="Share on LinkedIn"
      className="cursor-pointer"
      {...props}
    >
      {children}
    </div>
  );
};

export const LinkedinShareButton = LinkedInShareButton;

export const RedditShareButton = ({ children, url, title, ...props }) => {
  const shareUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
  return (
    <div
      onClick={() => window.open(shareUrl, '_blank', 'width=550,height=450')}
      role="button"
      tabIndex={0}
      aria-label="Share on Reddit"
      className="cursor-pointer"
      {...props}
    >
      {children}
    </div>
  );
};

export const EmailShareButton = ({ children, subject, body, ...props }) => {
  const shareUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return (
    <div
      onClick={() => (window.location.href = shareUrl)}
      role="button"
      tabIndex={0}
      aria-label="Share via Email"
      className="cursor-pointer"
      {...props}
    >
      {children}
    </div>
  );
};

// Icon components
export const TwitterIcon = ({ size = 40, round = false, isDark = true }) => (
  <ShareButton platform="twitter" size={size} round={round} isDark={isDark} url="" title="" />
);

export const FacebookIcon = ({ size = 40, round = false, isDark = true }) => (
  <ShareButton platform="facebook" size={size} round={round} isDark={isDark} url="" title="" />
);

export const TelegramIcon = ({ size = 40, round = false, isDark = true }) => (
  <ShareButton platform="telegram" size={size} round={round} isDark={isDark} url="" title="" />
);

export const WhatsAppIcon = ({ size = 40, round = false, isDark = true }) => (
  <ShareButton platform="whatsapp" size={size} round={round} isDark={isDark} url="" title="" />
);

export const WhatsappIcon = WhatsAppIcon;

export const LinkedInIcon = ({ size = 40, round = false, isDark = true }) => (
  <ShareButton platform="linkedin" size={size} round={round} isDark={isDark} url="" title="" />
);

export const LinkedinIcon = LinkedInIcon;

export const RedditIcon = ({ size = 40, round = false, isDark = true }) => (
  <ShareButton platform="reddit" size={size} round={round} isDark={isDark} url="" title="" />
);

export const EmailIcon = ({ size = 40, round = false, isDark = true }) => (
  <ShareButton platform="email" size={size} round={round} isDark={isDark} url="" title="" />
);

// Currency symbols for TokenShareModal
const currencySymbols = {
  USD: '$ ',
  EUR: '€ ',
  JPY: '¥ ',
  CNH: '¥ ',
  XRP: '✕ '
};

// Token Share Modal Component
export function TokenShareModal({ token }) {
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
    {
      Component: LinkedinShareButton,
      Icon: LinkedinIcon,
      props: { url, title: `${user} ${name}` }
    },
    {
      Component: WhatsappShareButton,
      Icon: WhatsappIcon,
      props: { url, title: `${user} ${name}` }
    },
    {
      Component: TelegramShareButton,
      Icon: TelegramIcon,
      props: { url, title: `${user} ${name}` }
    },
    { Component: RedditShareButton, Icon: RedditIcon, props: { url, title: `${user} ${name}` } },
    {
      Component: EmailShareButton,
      Icon: EmailIcon,
      props: { subject: `${user} ${name}`, body: `Check out: ${url}` }
    }
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all duration-200 ${
          isDark
            ? 'border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-white/60 hover:text-white/80'
            : 'border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700'
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
            onClick={(e) => e.stopPropagation()}
            className={`w-[90%] max-w-[400px] rounded-2xl border overflow-hidden ${
              isDark
                ? 'bg-black/90 backdrop-blur-2xl border-gray-700/50 shadow-[0_8px_40px_rgba(0,0,0,0.6)]'
                : 'bg-white/98 backdrop-blur-2xl border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <span
                className={`text-[15px] font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
              >
                Share {user}
              </span>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                <X size={16} className={isDark ? 'text-white/40' : 'text-gray-400'} />
              </button>
            </div>

            <div className="px-4 pb-4 flex flex-col items-center gap-4">
              <img
                src={imgUrl}
                alt={name}
                className={`w-16 h-16 rounded-xl border-2 ${isDark ? 'border-gray-600/40' : 'border-gray-200'}`}
              />
              <span
                className={`text-[16px] font-medium text-center ${isDark ? 'text-white' : 'text-gray-900'}`}
              >
                {user} {name}
              </span>

              <div
                className={`w-full p-3 rounded-lg border-[1.5px] text-center ${
                  isDark ? 'border-gray-600/40 bg-white/[0.04]' : 'border-gray-300 bg-gray-50/50'
                }`}
              >
                <p className={`text-[11px] mb-1 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                  Current Price
                </p>
                <p className="text-[18px] font-medium text-primary">
                  {currencySymbols[activeFiatCurrency]}
                  {fNumber(exch / (metrics[activeFiatCurrency] || 1))}
                </p>
              </div>

              <div className="w-full">
                <p className={`text-[10px] font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                  Share on
                </p>
                <div className="grid grid-cols-7 gap-2">
                  {socialPlatforms.map(({ Component, Icon, props }, i) => (
                    <div
                      key={i}
                      className="flex justify-center rounded-lg overflow-hidden hover:scale-105 transition-transform"
                    >
                      <Component {...props}>
                        <Icon size={40} round isDark={isDark} />
                      </Component>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full">
                <p className={`text-[10px] font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                  Copy Link
                </p>
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg border-[1.5px] ${
                    isDark ? 'border-gray-600/40 bg-white/[0.04]' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <span
                    className={`flex-1 text-[12px] truncate ${isDark ? 'text-white/60' : 'text-gray-600'}`}
                  >
                    {url}
                  </span>
                  <button
                    onClick={handleCopy}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark
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

// NFT Collection Share Modal
export function NFTShareModal({ name, imageUrl, url }) {
  const { openSnackbar, themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [open, setOpen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      openSnackbar('Link copied!', 'success');
    });
  };

  const socialPlatforms = [
    { Component: TwitterShareButton, Icon: TwitterIcon, props: { title: `Check out ${name} NFTs on XRPL`, url } },
    { Component: FacebookShareButton, Icon: FacebookIcon, props: { url } },
    { Component: LinkedinShareButton, Icon: LinkedinIcon, props: { url, title: `${name} NFTs` } },
    { Component: WhatsappShareButton, Icon: WhatsappIcon, props: { url, title: `Check out ${name} NFTs on XRPL` } },
    { Component: TelegramShareButton, Icon: TelegramIcon, props: { url, title: `Check out ${name} NFTs on XRPL` } },
    { Component: RedditShareButton, Icon: RedditIcon, props: { url, title: `${name} NFTs on XRPL` } },
    { Component: EmailShareButton, Icon: EmailIcon, props: { subject: `${name} NFTs`, body: `Check out: ${url}` } }
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all duration-200 ${
          isDark
            ? 'border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-white/60 hover:text-white/80'
            : 'border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700'
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
            onClick={(e) => e.stopPropagation()}
            className={`w-[90%] max-w-[400px] rounded-2xl border overflow-hidden ${
              isDark
                ? 'bg-black/90 backdrop-blur-2xl border-gray-700/50 shadow-[0_8px_40px_rgba(0,0,0,0.6)]'
                : 'bg-white/98 backdrop-blur-2xl border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <span className={`text-[15px] font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Share {name}
              </span>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                <X size={16} className={isDark ? 'text-white/40' : 'text-gray-400'} />
              </button>
            </div>

            <div className="px-4 pb-4 flex flex-col items-center gap-4">
              <img
                src={imageUrl}
                alt={name}
                className={`w-16 h-16 rounded-xl border-2 object-cover ${isDark ? 'border-gray-600/40' : 'border-gray-200'}`}
              />
              <span className={`text-[16px] font-medium text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {name}
              </span>

              <div className="w-full">
                <p className={`text-[10px] font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                  Share on
                </p>
                <div className="grid grid-cols-7 gap-2">
                  {socialPlatforms.map(({ Component, Icon, props }, i) => (
                    <div key={i} className="flex justify-center rounded-lg overflow-hidden hover:scale-105 transition-transform">
                      <Component {...props}>
                        <Icon size={40} round isDark={isDark} />
                      </Component>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full">
                <p className={`text-[10px] font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                  Copy Link
                </p>
                <div className={`flex items-center gap-2 p-3 rounded-lg border-[1.5px] ${
                  isDark ? 'border-gray-600/40 bg-white/[0.04]' : 'border-gray-200 bg-gray-50'
                }`}>
                  <span className={`flex-1 text-[12px] truncate ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                    {url}
                  </span>
                  <button
                    onClick={handleCopy}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark
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

// Transaction Share Modal
export function TxShareModal({ hash, type }) {
  const { openSnackbar, themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [open, setOpen] = useState(false);

  const url = `https://xrpl.to/tx/${hash}`;
  const title = `Check out this ${type || 'transaction'} on XRPL`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      openSnackbar('Link copied!', 'success');
    });
  };

  const socialPlatforms = [
    { Component: TwitterShareButton, Icon: TwitterIcon, props: { title, url } },
    { Component: FacebookShareButton, Icon: FacebookIcon, props: { url } },
    { Component: LinkedinShareButton, Icon: LinkedinIcon, props: { url, title } },
    { Component: WhatsappShareButton, Icon: WhatsappIcon, props: { url, title } },
    { Component: TelegramShareButton, Icon: TelegramIcon, props: { url, title } },
    { Component: RedditShareButton, Icon: RedditIcon, props: { url, title } },
    { Component: EmailShareButton, Icon: EmailIcon, props: { subject: 'XRPL Transaction', body: `${title}: ${url}` } }
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all duration-200 ${
          isDark
            ? 'border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-white/60 hover:text-white/80'
            : 'border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700'
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
            onClick={(e) => e.stopPropagation()}
            className={`w-[90%] max-w-[400px] rounded-2xl border overflow-hidden ${
              isDark
                ? 'bg-black/90 backdrop-blur-2xl border-gray-700/50 shadow-[0_8px_40px_rgba(0,0,0,0.6)]'
                : 'bg-white/98 backdrop-blur-2xl border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <span className={`text-[15px] font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Share Transaction
              </span>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                <X size={16} className={isDark ? 'text-white/40' : 'text-gray-400'} />
              </button>
            </div>

            <div className="px-4 pb-4 flex flex-col items-center gap-4">
              <div className={`w-full p-3 rounded-lg border-[1.5px] text-center ${
                isDark ? 'border-gray-600/40 bg-white/[0.04]' : 'border-gray-200 bg-gray-50'
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
                  {socialPlatforms.map(({ Component, Icon, props }, i) => (
                    <div key={i} className="flex justify-center rounded-lg overflow-hidden hover:scale-105 transition-transform">
                      <Component {...props}>
                        <Icon size={40} round isDark={isDark} />
                      </Component>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full">
                <p className={`text-[10px] font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                  Copy Link
                </p>
                <div className={`flex items-center gap-2 p-3 rounded-lg border-[1.5px] ${
                  isDark ? 'border-gray-600/40 bg-white/[0.04]' : 'border-gray-200 bg-gray-50'
                }`}>
                  <span className={`flex-1 text-[12px] truncate ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                    {url}
                  </span>
                  <button
                    onClick={handleCopy}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark
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

// Default export for backwards compatibility
export default TokenShareModal;
