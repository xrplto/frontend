import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
  RedditShareButton,
  TelegramShareButton,
  VKShareButton,
  WeiboShareButton,
  PinterestShareButton,
  TumblrShareButton,
  EmailShareButton
} from 'react-share';
import {
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  WhatsappIcon,
  RedditIcon,
  TelegramIcon,
  VKIcon,
  WeiboIcon,
  PinterestIcon,
  TumblrIcon,
  EmailIcon
} from 'react-share';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import {
  styled,
  useTheme,
  useMediaQuery,
  Avatar,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
  Box,
  Fade,
  Slide,
  Divider
} from '@mui/material';
import {
  Share as ShareIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { useSelector } from 'react-redux';
import { selectActiveFiatCurrency, selectMetrics } from 'src/redux/statusSlice';
import { Icon } from '@iconify/react';
import copyIcon from '@iconify/icons-fad/copy';
import { fNumber } from 'src/utils/formatNumber';
import { currencySymbols } from 'src/utils/constants';

const ShareButton = styled(IconButton)(({ theme, darkMode }) => ({
  position: 'relative',
  borderRadius: '12px',
  border: `2px solid ${darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'}`,
  background: darkMode
    ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(20, 20, 20, 0.95) 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 100%)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: darkMode
      ? 'linear-gradient(135deg, rgba(0, 123, 85, 0.2) 0%, rgba(85, 105, 255, 0.2) 100%)'
      : 'linear-gradient(135deg, rgba(85, 105, 255, 0.1) 0%, rgba(0, 123, 85, 0.1) 100%)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    zIndex: -1
  },
  '&:hover': {
    transform: 'translateY(-2px) scale(1.02)',
    border: `2px solid ${darkMode ? 'rgba(0, 123, 85, 0.5)' : 'rgba(85, 105, 255, 0.3)'}`,
    boxShadow: darkMode
      ? '0 8px 32px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 123, 85, 0.3)'
      : '0 8px 32px rgba(85, 105, 255, 0.2)',
    '&::before': {
      opacity: 1
    },
    '& .MuiSvgIcon-root': {
      color: darkMode ? '#00C853' : '#5569ff'
    }
  },
  '&:active': {
    transform: 'translateY(0) scale(0.98)'
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.25rem',
    color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.6)',
    transition: 'color 0.3s ease'
  }
}));

const ShareDialog = styled(Dialog)(({ theme }) => ({
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  '& .MuiBackdrop-root': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.4)'
  },
  '& .MuiDialog-paper': {
    borderRadius: '20px',
    background:
      theme.palette.mode === 'dark'
        ? 'linear-gradient(145deg, rgba(0, 0, 0, 0.98) 0%, rgba(10, 10, 10, 0.98) 50%, rgba(0, 0, 0, 0.98) 100%)'
        : 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border:
      theme.palette.mode === 'dark'
        ? '1px solid rgba(255, 255, 255, 0.08)'
        : '1px solid rgba(255, 255, 255, 0.8)',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 32px 64px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        : '0 24px 48px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.8)',
    overflow: 'hidden'
  },
  '& .MuiDialogContent-root': {
    padding: theme.spacing(3),
    position: 'relative',
    background: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '60px',
      height: '4px',
      background:
        theme.palette.mode === 'dark'
          ? 'linear-gradient(90deg, #00C853 0%, #5569ff 100%)'
          : 'linear-gradient(90deg, #5569ff 0%, #00C853 100%)',
      borderRadius: '2px',
      opacity: theme.palette.mode === 'dark' ? 0.8 : 0.6
    }
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(2)
  },
  '@media (max-width: 600px)': {
    '& .MuiDialog-paper': {
      margin: theme.spacing(2),
      borderRadius: '16px'
    },
    '& .MuiDialogContent-root': {
      padding: theme.spacing(2)
    }
  }
}));

const ShareDialogTitle = styled(DialogTitle)(({ theme }) => ({
  margin: 0,
  padding: theme.spacing(2.5, 3),
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(20, 20, 20, 0.9) 50%, rgba(0, 0, 0, 0.8) 100%)'
      : 'linear-gradient(135deg, rgba(85, 105, 255, 0.05) 0%, rgba(0, 123, 85, 0.05) 100%)',
  borderBottom: `1px solid ${
    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : theme.palette.divider
  }`,
  position: 'relative',
  '& .MuiTypography-root': {
    fontWeight: 600,
    fontSize: '1.25rem',
    background:
      theme.palette.mode === 'dark'
        ? 'linear-gradient(135deg, #00C853 0%, #5569ff 100%)'
        : 'linear-gradient(135deg, #5569ff 0%, #00C853 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  }
}));

const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(1),
  top: theme.spacing(1),
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.04)',
  borderRadius: '10px',
  border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.08)',
    transform: 'scale(1.05)',
    boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.5)' : 'none'
  },
  '& .MuiSvgIcon-root': {
    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'inherit'
  }
}));

const TokenAvatar = styled(Avatar)(({ theme }) => ({
  width: 88,
  height: 88,
  border: `3px solid ${
    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'
  }`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 12px 24px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 20px rgba(0, 123, 85, 0.2)'
      : '0 12px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.8)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 16px 32px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 30px rgba(0, 123, 85, 0.3)'
        : '0 16px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.9)'
  }
}));

const PriceCard = styled(Box)(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(2.5),
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(20, 20, 20, 0.8) 50%, rgba(0, 0, 0, 0.6) 100%)'
      : 'linear-gradient(135deg, rgba(85, 105, 255, 0.05) 0%, rgba(0, 123, 85, 0.05) 100%)',
  borderRadius: '16px',
  border: `1px solid ${
    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'
  }`,
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  position: 'relative',
  overflow: 'hidden',
  boxShadow:
    theme.palette.mode === 'dark'
      ? 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 12px rgba(0, 0, 0, 0.3)'
      : 'none',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background:
      theme.palette.mode === 'dark'
        ? 'linear-gradient(90deg, #00C853 0%, #5569ff 100%)'
        : 'linear-gradient(90deg, #5569ff 0%, #00C853 100%)',
    opacity: theme.palette.mode === 'dark' ? 0.8 : 0.6
  }
}));

const SocialIconWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: '12px',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px) scale(1.1)',
    '& .social-icon': {
      filter: 'brightness(1.1) saturate(1.2)'
    }
  },
  '&:active': {
    transform: 'translateY(-2px) scale(1.05)'
  },
  '& .social-icon': {
    transition: 'filter 0.3s ease',
    borderRadius: '12px !important'
  }
}));

const UrlCopyBox = styled(Box)(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(2),
  background: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.02)',
  borderRadius: '12px',
  border: `1px solid ${
    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'
  }`,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  transition: 'all 0.2s ease',
  boxShadow: theme.palette.mode === 'dark' ? 'inset 0 1px 0 rgba(255, 255, 255, 0.05)' : 'none',
  '&:hover': {
    background: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.04)',
    border: `1px solid ${
      theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'
    }`
  }
}));

const CopyButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(85, 105, 255, 0.1)',
  borderRadius: '8px',
  border: theme.palette.mode === 'dark' ? '1px solid rgba(0, 123, 85, 0.3)' : 'none',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor:
      theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(85, 105, 255, 0.2)',
    transform: 'scale(1.05)',
    boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0, 123, 85, 0.2)' : 'none'
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.1rem',
    color: theme.palette.mode === 'dark' ? '#00C853' : '#5569ff'
  }
}));

export default function Share({ token }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const metrics = useSelector(selectMetrics);
  const activeFiatCurrency = useSelector(selectActiveFiatCurrency);
  const { accountProfile, openSnackbar, darkMode } = useContext(AppContext);

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { name, ext, md5, exch } = token;

  let user = token.user;
  if (!user) user = name;

  const imgUrl = `https://s1.xrpl.to/token/${md5}`;
  const title = `${user} price today: ${name} to ${activeFiatCurrency} conversion, live rates, trading volume, historical data, and interactive chart`;
  const desc = `Access up-to-date ${user} prices, ${name} market cap, trading pairs, interactive charts, and comprehensive data from the leading XRP Ledger token price-tracking platform.`;

  // Create clean URL without query parameters like ?fromSearch=1
  const getCleanUrl = () => {
    if (typeof window === 'undefined') return '';

    const currentUrl = new URL(window.location.href);
    // Remove unwanted query parameters
    currentUrl.searchParams.delete('fromSearch');

    return currentUrl.toString();
  };

  const url = getCleanUrl();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCopied(false);
  };

  const handleCopy = () => {
    setCopied(true);
    openSnackbar('Link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const socialPlatforms = [
    {
      Component: TwitterShareButton,
      Icon: TwitterIcon,
      props: { title, url, hashtags: ['crypto', 'XRPL'] }
    },
    {
      Component: FacebookShareButton,
      Icon: FacebookIcon,
      props: { url, quote: title, hashtag: '#crypto' }
    },
    { Component: LinkedinShareButton, Icon: LinkedinIcon, props: { url, title, summary: desc } },
    { Component: WhatsappShareButton, Icon: WhatsappIcon, props: { url, title, separator: ' - ' } },
    { Component: TelegramShareButton, Icon: TelegramIcon, props: { url, title } },
    { Component: RedditShareButton, Icon: RedditIcon, props: { url, title } },
    {
      Component: EmailShareButton,
      Icon: EmailIcon,
      props: { subject: title, body: `Check out this link: ${url}` }
    }
  ];

  return (
    <>
      <ShareButton darkMode={darkMode} onClick={handleClickOpen}>
        <ShareIcon />
      </ShareButton>

      <ShareDialog
        fullScreen={fullScreen}
        onClose={handleClose}
        open={open}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' }}
      >
        <ShareDialogTitle>
          <Typography>
            Share {user} {name}
          </Typography>
          <CloseButton onClick={handleClose}>
            <CloseIcon />
          </CloseButton>
        </ShareDialogTitle>

        <DialogContent>
          <Fade in={open} timeout={600}>
            <Stack alignItems="center" spacing={3}>
              <TokenAvatar alt={`${user} ${name} Logo`} src={imgUrl} />

              <Stack spacing={1} alignItems="center" sx={{ width: '100%' }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    background: darkMode
                      ? 'linear-gradient(135deg, #00C853 0%, #5569ff 100%)'
                      : 'linear-gradient(135deg, #5569ff 0%, #00C853 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textAlign: 'center'
                  }}
                >
                  {user} {name}
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    textAlign: 'center',
                    color: 'text.secondary',
                    fontWeight: 500,
                    opacity: 0.8
                  }}
                >
                  Share this token with your network
                </Typography>
              </Stack>

              <PriceCard>
                <Typography
                  variant="body2"
                  sx={{
                    textAlign: 'center',
                    color: 'text.secondary',
                    mb: 1
                  }}
                >
                  Current Price
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    textAlign: 'center',
                    fontWeight: 700,
                    color: darkMode ? '#00C853' : '#5569ff'
                  }}
                >
                  {currencySymbols[activeFiatCurrency]}{' '}
                  {fNumber(exch / metrics[activeFiatCurrency])}
                </Typography>
              </PriceCard>

              <Divider sx={{ width: '100%', opacity: 0.3 }} />

              <Box sx={{ width: '100%' }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    textAlign: 'center',
                    color: 'text.secondary',
                    mb: 2,
                    fontWeight: 600
                  }}
                >
                  Choose Platform
                </Typography>

                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    py: 1
                  }}
                >
                  {socialPlatforms.map(({ Component, Icon, props }, index) => (
                    <Fade in={open} timeout={800 + index * 100} key={index}>
                      <SocialIconWrapper>
                        <Component {...props}>
                          <Icon size={40} round className="social-icon" />
                        </Component>
                      </SocialIconWrapper>
                    </Fade>
                  ))}
                </Stack>
              </Box>

              <Divider sx={{ width: '100%', opacity: 0.3 }} />

              <Box sx={{ width: '100%' }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    textAlign: 'center',
                    color: 'text.secondary',
                    mb: 2,
                    fontWeight: 600
                  }}
                >
                  Or Copy Link
                </Typography>

                <UrlCopyBox>
                  <Typography
                    variant="body2"
                    sx={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'text.secondary',
                      fontSize: '0.875rem'
                    }}
                  >
                    {url}
                  </Typography>
                  <CopyToClipboard text={url} onCopy={handleCopy}>
                    <Tooltip title={copied ? 'Copied!' : 'Copy link'}>
                      <CopyButton>
                        <Icon icon={copyIcon} />
                      </CopyButton>
                    </Tooltip>
                  </CopyToClipboard>
                </UrlCopyBox>
              </Box>
            </Stack>
          </Fade>
        </DialogContent>
      </ShareDialog>
    </>
  );
}
