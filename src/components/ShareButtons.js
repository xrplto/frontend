import { IconButton, Avatar } from '@mui/material';
import MuiTwitterIcon from '@mui/icons-material/Twitter';
import MuiFacebookIcon from '@mui/icons-material/Facebook';
import MuiTelegramIcon from '@mui/icons-material/Telegram';
import MuiRedditIcon from '@mui/icons-material/Reddit';
import MuiEmailIcon from '@mui/icons-material/Email';
import MuiWhatsAppIcon from '@mui/icons-material/WhatsApp';
import MuiLinkedInIcon from '@mui/icons-material/LinkedIn';

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

// Share button component
export const ShareButton = ({ platform, url, title, size = 40, round = true, ...props }) => {
  const shareUrls = getShareUrls(url, title);
  const shareUrl = shareUrls[platform];

  const handleShare = () => {
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=550,height=450');
    }
  };

  const getIcon = () => {
    switch (platform) {
      case 'twitter':
        return <MuiTwitterIcon />;
      case 'facebook':
        return <MuiFacebookIcon />;
      case 'telegram':
        return <MuiTelegramIcon />;
      case 'whatsapp':
        return <MuiWhatsAppIcon />;
      case 'linkedin':
        return <MuiLinkedInIcon />;
      case 'reddit':
        return <MuiRedditIcon />;
      case 'email':
        return <MuiEmailIcon />;
      default:
        return null;
    }
  };

  const getColor = () => {
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

  if (round) {
    return (
      <Avatar
        onClick={handleShare}
        role="button"
        aria-label={`Share on ${platform}`}
        tabIndex={0}
        sx={{
          width: size,
          height: size,
          bgcolor: getColor(),
          cursor: 'pointer',
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'scale(1.1)'
          }
        }}
        {...props}
      >
        {getIcon()}
      </Avatar>
    );
  }

  return (
    <IconButton onClick={handleShare} aria-label={`Share on ${platform}`} sx={{ color: getColor() }} {...props}>
      {getIcon()}
    </IconButton>
  );
};

// Export individual share buttons for compatibility
export const TwitterShareButton = ({ children, url, title, ...props }) => {
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  return (
    <div onClick={() => window.open(shareUrl, '_blank', 'width=550,height=450')} role="button" tabIndex={0} aria-label="Share on Twitter" style={{ cursor: 'pointer' }} {...props}>
      {children}
    </div>
  );
};

export const FacebookShareButton = ({ children, url, ...props }) => {
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  return (
    <div onClick={() => window.open(shareUrl, '_blank', 'width=550,height=450')} role="button" tabIndex={0} aria-label="Share on Facebook" style={{ cursor: 'pointer' }} {...props}>
      {children}
    </div>
  );
};

export const TelegramShareButton = ({ children, url, title, ...props }) => {
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
  return (
    <div onClick={() => window.open(shareUrl, '_blank', 'width=550,height=450')} role="button" tabIndex={0} aria-label="Share on Telegram" style={{ cursor: 'pointer' }} {...props}>
      {children}
    </div>
  );
};

export const WhatsAppShareButton = ({ children, url, title, ...props }) => {
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
  return (
    <div onClick={() => window.open(shareUrl, '_blank', 'width=550,height=450')} role="button" tabIndex={0} aria-label="Share on WhatsApp" style={{ cursor: 'pointer' }} {...props}>
      {children}
    </div>
  );
};

export const WhatsappShareButton = WhatsAppShareButton; // Alias for compatibility

export const LinkedInShareButton = ({ children, url, ...props }) => {
  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  return (
    <div onClick={() => window.open(shareUrl, '_blank', 'width=550,height=450')} role="button" tabIndex={0} aria-label="Share on LinkedIn" style={{ cursor: 'pointer' }} {...props}>
      {children}
    </div>
  );
};

export const LinkedinShareButton = LinkedInShareButton; // Alias for compatibility

export const RedditShareButton = ({ children, url, title, ...props }) => {
  const shareUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
  return (
    <div onClick={() => window.open(shareUrl, '_blank', 'width=550,height=450')} role="button" tabIndex={0} aria-label="Share on Reddit" style={{ cursor: 'pointer' }} {...props}>
      {children}
    </div>
  );
};

export const EmailShareButton = ({ children, subject, body, ...props }) => {
  const shareUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return (
    <div onClick={() => window.location.href = shareUrl} role="button" tabIndex={0} aria-label="Share via Email" style={{ cursor: 'pointer' }} {...props}>
      {children}
    </div>
  );
};

// Icon components for compatibility with react-share
export const TwitterIcon = ({ size = 40, round = false }) => (
  <ShareButton platform="twitter" size={size} round={round} />
);

export const FacebookIcon = ({ size = 40, round = false }) => (
  <ShareButton platform="facebook" size={size} round={round} />
);

export const TelegramIcon = ({ size = 40, round = false }) => (
  <ShareButton platform="telegram" size={size} round={round} />
);

export const WhatsAppIcon = ({ size = 40, round = false }) => (
  <ShareButton platform="whatsapp" size={size} round={round} />
);

export const WhatsappIcon = WhatsAppIcon; // Alias for compatibility

export const LinkedInIcon = ({ size = 40, round = false }) => (
  <ShareButton platform="linkedin" size={size} round={round} />
);

export const LinkedinIcon = LinkedInIcon; // Alias for compatibility

export const RedditIcon = ({ size = 40, round = false }) => (
  <ShareButton platform="reddit" size={size} round={round} />
);

export const EmailIcon = ({ size = 40, round = false }) => (
  <ShareButton platform="email" size={size} round={round} />
);