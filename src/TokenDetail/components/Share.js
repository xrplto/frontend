import PropTypes from 'prop-types';
import { useState } from 'react';
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
  Divider,
  alpha
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
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { fNumber } from 'src/utils/formatters';
// Constants
const currencySymbols = {
  USD: '$ ',
  EUR: '€ ',
  JPY: '¥ ',
  CNH: '¥ ',
  XRP: '✕ '
};

const ShareButton = styled(IconButton)(({ theme }) => {
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return {
    position: 'relative',
    borderRadius: '8px',
    border: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
      theme.palette.background.paper,
      0.7
    )} 100%)`,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
    padding: isMobile ? '4px' : '6px',
    minWidth: isMobile ? '32px' : '36px',
    minHeight: isMobile ? '32px' : '36px',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(
        theme.palette.success.main,
        0.05
      )} 100%)`,
      opacity: 0,
      transition: 'opacity 0.3s ease',
      zIndex: -1
    },
    '&:hover': {
      transform: 'translateY(-4px) scale(1.02)',
      border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
      boxShadow: `0 16px 48px ${alpha(theme.palette.common.black, 0.12)}, 0 4px 16px ${alpha(
        theme.palette.primary.main,
        0.1
      )}`,
      '&::before': {
        opacity: 1
      },
      '& .MuiSvgIcon-root': {
        color: theme.palette.primary.main
      }
    },
    '&:active': {
      transform: 'translateY(-2px) scale(0.98)'
    },
    '& .MuiSvgIcon-root': {
      fontSize: isMobile ? '16px' : '18px',
      color: alpha(theme.palette.text.primary, 0.8),
      transition: 'color 0.3s ease'
    }
  };
});

const ShareDialog = styled(Dialog)(({ theme }) => ({
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  '& .MuiBackdrop-root': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.4)'
  },
  '& .MuiDialog-paper': {
    borderRadius: '0',
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
      theme.palette.background.paper,
      0.8
    )} 100%)`,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.06)}, 0 2px 8px ${alpha(
      theme.palette.primary.main,
      0.04
    )}`,
    overflow: 'hidden',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '2px',
      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
      opacity: 0.8
    }
  },
  '& .MuiDialogContent-root': {
    padding: theme.spacing(3),
    position: 'relative',
    background: 'transparent',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '60px',
      height: '4px',
      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
      borderRadius: '2px',
      opacity: 0.8
    }
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(2)
  },
  '@media (max-width: 600px)': {
    '& .MuiDialog-paper': {
      margin: theme.spacing(2),
      borderRadius: '12px'
    },
    '& .MuiDialogContent-root': {
      padding: theme.spacing(2)
    }
  }
}));

const ShareDialogTitle = styled(DialogTitle)(({ theme }) => ({
  margin: 0,
  padding: theme.spacing(2.5, 3),
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
    theme.palette.background.paper,
    0.4
  )} 100%)`,
  backdropFilter: 'blur(10px)',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
  position: 'relative',
  '& .MuiTypography-root': {
    fontWeight: 600,
    fontSize: '20px',
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  }
}));

const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(1),
  top: theme.spacing(1),
  backgroundColor: alpha(theme.palette.background.paper, 0.6),
  borderRadius: '12px',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    transform: 'scale(1.05)',
    boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.08)}`
  },
  '& .MuiSvgIcon-root': {
    color: theme.palette.text.primary
  }
}));

const TokenAvatar = styled(Avatar)(({ theme }) => ({
  width: 88,
  height: 88,
  border: `3px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: `0 12px 24px ${alpha(theme.palette.common.black, 0.15)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: `0 16px 32px ${alpha(theme.palette.common.black, 0.2)}`
  }
}));

const PriceCard = styled(Box)(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(2.5),
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
    theme.palette.background.paper,
    0.7
  )} 100%)`,
  backdropFilter: 'blur(20px)',
  borderRadius: '12px',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  position: 'relative',
  overflow: 'hidden',
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
    opacity: 0.8
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
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
    theme.palette.background.paper,
    0.7
  )} 100%)`,
  backdropFilter: 'blur(20px)',
  borderRadius: '12px',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  transition: 'all 0.2s ease',
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
      theme.palette.background.paper,
      0.8
    )} 100%)`,
    border: `1px solid ${alpha(theme.palette.divider, 0.12)}`
  }
}));

const CopyButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  borderRadius: '8px',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
    transform: 'scale(1.05)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
  },
  '& .MuiSvgIcon-root': {
    fontSize: '18px',
    color: theme.palette.primary.main
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

  // Share functionality is now handled by custom ShareButtons component

  const canWebShare = typeof navigator !== 'undefined' && !!navigator.share;
  const handleWebShare = async () => {
    if (!canWebShare) return;
    try {
      await navigator.share({ title, text: desc, url });
    } catch (e) {
      // user cancelled or not supported
    }
  };

  const socialPlatforms = [
    {
      Component: TwitterShareButton,
      Icon: TwitterIcon,
      props: { title, url }
    },
    {
      Component: FacebookShareButton,
      Icon: FacebookIcon,
      props: { url }
    },
    {
      Component: LinkedinShareButton,
      Icon: LinkedinIcon,
      props: { url, title }
    },
    {
      Component: WhatsappShareButton,
      Icon: WhatsappIcon,
      props: { url, title }
    },
    {
      Component: TelegramShareButton,
      Icon: TelegramIcon,
      props: { url, title }
    },
    { Component: RedditShareButton, Icon: RedditIcon, props: { url, title } },
    {
      Component: EmailShareButton,
      Icon: EmailIcon,
      props: { subject: title, body: `Check out this link: ${url}` }
    }
  ];

  return (
    <>
      <ShareButton size="small" onClick={handleClickOpen}>
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
                    fontWeight: 600,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
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
                    fontWeight: 400,
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
                    fontWeight: 600,
                    color: theme.palette.primary.main
                  }}
                >
                  {currencySymbols[activeFiatCurrency]}{' '}
                  {fNumber(exch / (metrics[activeFiatCurrency] || 1))}
                </Typography>
              </PriceCard>

              <Divider sx={{ width: '100%', opacity: 0.3 }} />

              {canWebShare && (
                <Box sx={{ width: '100%' }}>
                  <Stack direction="row" justifyContent="center">
                    <Button variant="contained" size="small" onClick={handleWebShare}>
                      Share via device
                    </Button>
                  </Stack>
                </Box>
              )}

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
                  {socialPlatforms.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Loading share options…
                    </Typography>
                  )}
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
                      fontSize: '14px'
                    }}
                  >
                    {url}
                  </Typography>
                  <Tooltip title={copied ? 'Copied!' : 'Copy link'}>
                    <CopyButton
                      onClick={() => {
                        navigator.clipboard.writeText(url).then(() => {
                          handleCopy();
                        });
                      }}
                    >
                      <ContentCopyIcon />
                    </CopyButton>
                  </Tooltip>
                </UrlCopyBox>
              </Box>
            </Stack>
          </Fade>
        </DialogContent>
      </ShareDialog>
    </>
  );
}
