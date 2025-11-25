import { cn } from 'src/utils/cn';
import {
  Twitter,
  Facebook,
  Send as Telegram,
  MessageCircle as Reddit,
  Mail,
  MessageSquare as WhatsApp,
  Linkedin
} from 'lucide-react';

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

const getColor = (platform) => {
  switch (platform) {
    case 'twitter':
      return '#1DA1F2';
    case 'facebook':
      return '#1877F2';
    case 'telegram':
      return '#0088cc';
    case 'whatsapp':
      return '#25D366';
    case 'linkedin':
      return '#0A66C2';
    case 'reddit':
      return '#FF4500';
    case 'email':
      return '#DD4B39';
    default:
      return '#666';
  }
};

// Share button component
export const ShareButton = ({ platform, url, title, size = 40, round = true, ...props }) => {
  const shareUrls = getShareUrls(url, title);
  const shareUrl = shareUrls[platform];

  const handleShare = () => {
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=550,height=450');
    }
  };

  const bgColor = getColor(platform);

  if (round) {
    return (
      <div
        onClick={handleShare}
        role="button"
        aria-label={`Share on ${platform}`}
        tabIndex={0}
        className={cn(
          "flex items-center justify-center rounded-full cursor-pointer transition-transform hover:scale-110"
        )}
        style={{
          width: size,
          height: size,
          backgroundColor: bgColor,
          color: 'white'
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
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      style={{ color: bgColor }}
      {...props}
    >
      {getIcon(platform, 20)}
    </button>
  );
};

// Export individual share buttons for compatibility
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

export const WhatsappShareButton = WhatsAppShareButton; // Alias for compatibility

export const LinkedInShareButton = ({ children, url, ...props }) => {
  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  return (
    <div onClick={() => window.open(shareUrl, '_blank', 'width=550,height=450')} role="button" tabIndex={0} aria-label="Share on LinkedIn" className="cursor-pointer" {...props}>
      {children}
    </div>
  );
};

export const LinkedinShareButton = LinkedInShareButton; // Alias for compatibility

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

// Icon components for compatibility with react-share
export const TwitterIcon = ({ size = 40, round = false }) => (
  <ShareButton platform="twitter" size={size} round={round} url="" title="" />
);

export const FacebookIcon = ({ size = 40, round = false }) => (
  <ShareButton platform="facebook" size={size} round={round} url="" title="" />
);

export const TelegramIcon = ({ size = 40, round = false }) => (
  <ShareButton platform="telegram" size={size} round={round} url="" title="" />
);

export const WhatsAppIcon = ({ size = 40, round = false }) => (
  <ShareButton platform="whatsapp" size={size} round={round} url="" title="" />
);

export const WhatsappIcon = WhatsAppIcon; // Alias for compatibility

export const LinkedInIcon = ({ size = 40, round = false }) => (
  <ShareButton platform="linkedin" size={size} round={round} url="" title="" />
);

export const LinkedinIcon = LinkedInIcon; // Alias for compatibility

export const RedditIcon = ({ size = 40, round = false }) => (
  <ShareButton platform="reddit" size={size} round={round} url="" title="" />
);

export const EmailIcon = ({ size = 40, round = false }) => (
  <ShareButton platform="email" size={size} round={round} url="" title="" />
);
