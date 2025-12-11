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
  Copy
} from 'lucide-react';
import { AppContext } from 'src/AppContext';
import { useSelector } from 'react-redux';
import { selectActiveFiatCurrency, selectMetrics } from 'src/redux/statusSlice';
import { fNumber } from 'src/utils/formatters';

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
      return <Twitter {...props} />;
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

const getIconColor = (platform) => {
  switch (platform) {
    case 'twitter':
      return '#000000';
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

const getBgColor = (isDark = true) => isDark ? 'rgba(255,255,255,0.04)' : 'rgba(59,130,246,0.05)';

// Share button component
export const ShareButton = ({ platform, url, title, size = 40, round = true, isDark = true, ...props }) => {
  const shareUrls = getShareUrls(url, title);
  const shareUrl = shareUrls[platform];

  const handleShare = () => {
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=550,height=450');
    }
  };

  const iconColor = getIconColor(platform);
  const bgColor = getBgColor(isDark);

  if (round) {
    return (
      <div
        onClick={handleShare}
        role="button"
        aria-label={`Share on ${platform}`}
        tabIndex={0}
        className={cn(
          "flex items-center justify-center rounded-full cursor-pointer transition-all hover:scale-110"
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
    <div onClick={() => window.open(shareUrl, '_blank', 'width=550,height=450')} role="button" tabIndex={0} aria-label="Share on Twitter" className="cursor-pointer" {...props}>
      {children}
    </div>
  );
};

export const FacebookShareButton = ({ children, url, ...props }) => {
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  return (
    <div onClick={() => window.open(shareUrl, '_blank', 'width=550,height=450')} role="button" tabIndex={0} aria-label="Share on Facebook" className="cursor-pointer" {...props}>
      {children}
    </div>
  );
};

export const TelegramShareButton = ({ children, url, title, ...props }) => {
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
  return (
    <div onClick={() => window.open(shareUrl, '_blank', 'width=550,height=450')} role="button" tabIndex={0} aria-label="Share on Telegram" className="cursor-pointer" {...props}>
      {children}
    </div>
  );
};

export const WhatsAppShareButton = ({ children, url, title, ...props }) => {
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
  return (
    <div onClick={() => window.open(shareUrl, '_blank', 'width=550,height=450')} role="button" tabIndex={0} aria-label="Share on WhatsApp" className="cursor-pointer" {...props}>
      {children}
    </div>
  );
};

export const WhatsappShareButton = WhatsAppShareButton;

export const LinkedInShareButton = ({ children, url, ...props }) => {
  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  return (
    <div onClick={() => window.open(shareUrl, '_blank', 'width=550,height=450')} role="button" tabIndex={0} aria-label="Share on LinkedIn" className="cursor-pointer" {...props}>
      {children}
    </div>
  );
};

export const LinkedinShareButton = LinkedInShareButton;

export const RedditShareButton = ({ children, url, title, ...props }) => {
  const shareUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
  return (
    <div onClick={() => window.open(shareUrl, '_blank', 'width=550,height=450')} role="button" tabIndex={0} aria-label="Share on Reddit" className="cursor-pointer" {...props}>
      {children}
    </div>
  );
};

export const EmailShareButton = ({ children, subject, body, ...props }) => {
  const shareUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return (
    <div onClick={() => window.location.href = shareUrl} role="button" tabIndex={0} aria-label="Share via Email" className="cursor-pointer" {...props}>
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
            ? 'border-blue-500/20 text-white/50 hover:border-blue-500/40 hover:text-blue-400'
            : 'border-blue-200 text-gray-500 hover:border-blue-400 hover:text-blue-600'
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
              isDark ? 'bg-[#070b12]/98 backdrop-blur-xl border-blue-500/20 shadow-2xl shadow-blue-500/10' : 'bg-white backdrop-blur-2xl border-blue-200 shadow-xl shadow-blue-200/50'
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <span className={`text-[15px] font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
                className={`w-16 h-16 rounded-xl border-2 ${isDark ? 'border-blue-500/20' : 'border-blue-200'}`}
              />
              <span className={`text-[16px] font-medium text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {user} {name}
              </span>

              <div className={`w-full p-3 rounded-lg border-[1.5px] text-center ${
                isDark ? 'border-blue-500/20 bg-white/[0.04]' : 'border-blue-200 bg-blue-50/50'
              }`}>
                <p className={`text-[11px] mb-1 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Current Price</p>
                <p className="text-[18px] font-medium text-primary">
                  {currencySymbols[activeFiatCurrency]}
                  {fNumber(exch / (metrics[activeFiatCurrency] || 1))}
                </p>
              </div>

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
                  isDark ? 'border-blue-500/20 bg-white/[0.04]' : 'border-blue-200 bg-blue-50/50'
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

// Default export for backwards compatibility
export default TokenShareModal;
