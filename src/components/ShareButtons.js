import { useState, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

import { AppContext } from 'src/context/AppContext';
import { useSelector } from 'react-redux';
import { selectActiveFiatCurrency, selectMetrics } from 'src/redux/statusSlice';
import { fNumber } from 'src/utils/formatters';

// X (Twitter) Social Media Icon
const XSocialIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
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

const platformConfig = {
  twitter: { color: '#000000', darkColor: '#FFFFFF', icon: XSocialIcon },
  telegram: { color: '#229ED9', icon: Telegram },
  whatsapp: { color: '#25D366', icon: WhatsApp },
  facebook: { color: '#1877F2', icon: Facebook },
  linkedin: { color: '#0A66C2', icon: Linkedin },
  reddit: { color: '#FF5700', icon: Reddit },
  email: { color: '#6B7280', icon: Mail },
  copy: { color: '#3f96fe', icon: Copy }
};

const ModalAction = ({ icon: Icon, color, onClick, label, isDark }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 group transition-all"
  >
    <div
      className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 active:scale-95 group-hover:shadow-lg",
        isDark ? "bg-white/[0.03] border border-white/[0.05] group-hover:bg-white/[0.08]" : "bg-gray-50 border border-gray-100 group-hover:bg-white"
      )}
    >
      <Icon size={24} style={{ color: color }} />
    </div>
    <span className={cn("text-[10px] font-medium opacity-60 group-hover:opacity-100", isDark ? "text-white" : "text-gray-900")}>
      {label}
    </span>
  </button>
);

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
export function TokenShareModal({ token, className }) {
  const { openSnackbar, themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const metrics = useSelector(selectMetrics);
  const activeFiatCurrency = useSelector(selectActiveFiatCurrency);

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const { name, md5, exch, user: tokenUser } = token;
  const user = tokenUser || name;
  const imgUrl = `https://s1.xrpl.to/token/${md5}`;
  const url = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';
  const price = fNumber(exch / (metrics[activeFiatCurrency] || 1));

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => openSnackbar('Link copied!', 'success'));
  };

  const actions = [
    { label: 'X', icon: platformConfig.twitter.icon, color: isDark ? '#fff' : '#000', onClick: () => window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(`${user} ${name}: ${url}`)}`, '_blank') },
    { label: 'Telegram', icon: platformConfig.telegram.icon, color: platformConfig.telegram.color, onClick: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`${user} ${name}`)}`, '_blank') },
    { label: 'WhatsApp', icon: platformConfig.whatsapp.icon, color: platformConfig.whatsapp.color, onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(`${user} ${name} ${url}`)}`, '_blank') },
    { label: 'Facebook', icon: platformConfig.facebook.icon, color: platformConfig.facebook.color, onClick: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank') },
    { label: 'LinkedIn', icon: platformConfig.linkedin.icon, color: platformConfig.linkedin.color, onClick: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank') },
    { label: 'Reddit', icon: platformConfig.reddit.icon, color: platformConfig.reddit.color, onClick: () => window.open(`https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(`${user} ${name}`)}`, '_blank') },
    { label: 'Email', icon: platformConfig.email.icon, color: platformConfig.email.color, onClick: () => window.location.href = `mailto:?subject=${encodeURIComponent(`${user} ${name}`)}&body=${encodeURIComponent(url)}` },
    { label: 'Copy', icon: platformConfig.copy.icon, color: platformConfig.copy.color, onClick: handleCopy },
  ];

  const modal = open && mounted && createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative w-full max-w-[380px] rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden',
          isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-100'
        )}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <span className={cn('text-sm font-bold uppercase tracking-widest opacity-40', isDark ? 'text-white' : 'text-gray-900')}>Share Token</span>
          <button onClick={() => setOpen(false)} className={cn("p-1.5 rounded-xl transition-colors", isDark ? "hover:bg-white/10 text-white/40" : "hover:bg-gray-100 text-gray-400")}>
            <X size={20} />
          </button>
        </div>

        <div className="px-8 pb-8 flex flex-col items-center">
          <div className={cn(
            "w-full p-4 rounded-2xl border flex items-center gap-4 mb-8",
            isDark ? "bg-white/[0.03] border-white/[0.05]" : "bg-gray-50 border-gray-100"
          )}>
            <img src={imgUrl} alt={name} className="w-12 h-12 rounded-xl border border-inherit shadow-md" />
            <div className="flex-1 min-w-0 text-left">
              <p className={cn('text-sm font-bold truncate', isDark ? 'text-white' : 'text-gray-900')}>{name}</p>
              <p className="text-[12px] font-medium opacity-50 truncate mb-1">{user}</p>
              <p className="text-[13px] font-bold text-primary">
                {currencySymbols[activeFiatCurrency]}{price}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-x-4 gap-y-6 w-full">
            {actions.map((action, i) => (
              <ModalAction key={i} {...action} isDark={isDark} />
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center justify-center gap-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all duration-200',
          isDark ? 'border-white/10 hover:border-primary/50 bg-white/[0.03] hover:bg-primary/5 text-white/60 hover:text-primary' : 'border-gray-200 hover:border-primary/50 bg-gray-50 hover:bg-primary/5 text-gray-500 hover:text-primary',
          className
        )}
      >
        <ShareIcon size={12} /> Share
      </button>
      {modal}
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
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all duration-200 ${isDark
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
            className={`w-[90%] max-w-[400px] rounded-2xl border overflow-hidden ${isDark
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
                <div className={`flex items-center gap-2 p-3 rounded-lg border-[1.5px] ${isDark ? 'border-gray-600/40 bg-white/[0.04]' : 'border-gray-200 bg-gray-50'
                  }`}>
                  <span className={`flex-1 text-[12px] truncate ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                    {url}
                  </span>
                  <button
                    onClick={handleCopy}
                    className={`p-2 rounded-lg transition-colors ${isDark
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
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all duration-200 ${isDark
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
            className={`w-[90%] max-w-[400px] rounded-2xl border overflow-hidden ${isDark
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
                <div className={`flex items-center gap-2 p-3 rounded-lg border-[1.5px] ${isDark ? 'border-gray-600/40 bg-white/[0.04]' : 'border-gray-200 bg-gray-50'
                  }`}>
                  <span className={`flex-1 text-[12px] truncate ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                    {url}
                  </span>
                  <button
                    onClick={handleCopy}
                    className={`p-2 rounded-lg transition-colors ${isDark
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
