import { IconButton, Avatar } from '@mui/material';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import TelegramIcon from '@mui/icons-material/Telegram';
import RedditIcon from '@mui/icons-material/Reddit';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

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
        return <TwitterIcon />;
      case 'facebook':
        return <FacebookIcon />;
      case 'telegram':
        return <TelegramIcon />;
      case 'whatsapp':
        return <WhatsAppIcon />;
      case 'linkedin':
        return <LinkedInIcon />;
      case 'reddit':
        return <RedditIcon />;
      case 'email':
        return <EmailIcon />;
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
    <IconButton onClick={handleShare} sx={{ color: getColor() }} {...props}>
      {getIcon()}
    </IconButton>
  );
};

// Export individual share buttons for compatibility
export const TwitterShareButton = ({ children, url, title, ...props }) => {
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  return (
    <div onClick={() => window.open(shareUrl, '_blank', 'width=550,height=450')} style={{ cursor: 'pointer' }} {...props}>
      {children}
    </div>
  );
};

export const FacebookShareButton = ({ children, url, ...props }) => {
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  return (
    <div onClick={() => window.open(shareUrl, '_blank', 'width=550,height=450')} style={{ cursor: 'pointer' }} {...props}>
      {children}
    </div>
  );
};

export const TelegramShareButton = ({ children, url, title, ...props }) => {
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
  return (
    <div onClick={() => window.open(shareUrl, '_blank', 'width=550,height=450')} style={{ cursor: 'pointer' }} {...props}>
      {children}
    </div>
  );
};

export const WhatsAppShareButton = ({ children, url, title, ...props }) => {
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
  return (
    <div onClick={() => window.open(shareUrl, '_blank', 'width=550,height=450')} style={{ cursor: 'pointer' }} {...props}>
      {children}
    </div>
  );
};

export const WhatsappShareButton = WhatsAppShareButton; // Alias for compatibility

export const LinkedInShareButton = ({ children, url, ...props }) => {
  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  return (
    <div onClick={() => window.open(shareUrl, '_blank', 'width=550,height=450')} style={{ cursor: 'pointer' }} {...props}>
      {children}
    </div>
  );
};

export const LinkedinShareButton = LinkedInShareButton; // Alias for compatibility

export const RedditShareButton = ({ children, url, title, ...props }) => {
  const shareUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
  return (
    <div onClick={() => window.open(shareUrl, '_blank', 'width=550,height=450')} style={{ cursor: 'pointer' }} {...props}>
      {children}
    </div>
  );
};

export const EmailShareButton = ({ children, subject, body, ...props }) => {
  const shareUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return (
    <div onClick={() => window.location.href = shareUrl} style={{ cursor: 'pointer' }} {...props}>
      {children}
    </div>
  );
};

// Icon components for compatibility
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