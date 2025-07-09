import React from 'react';
import { useRef, useState } from 'react';
import { FacebookShareButton, TwitterShareButton } from 'react-share';
import { FacebookIcon, TwitterIcon } from 'react-share';
import Image from 'next/image';

// Material
import { useTheme } from '@mui/material/styles';
import {
  styled,
  useMediaQuery,
  Box,
  IconButton,
  Link,
  Popover,
  Stack,
  Tooltip,
  Typography,
  Card,
  Chip,
  Divider
} from '@mui/material';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import VerifiedIcon from '@mui/icons-material/Verified';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import { alpha } from '@mui/material/styles';

// Iconify
import { Icon } from '@iconify/react';

import infoFilled from '@iconify/icons-ep/info-filled';

// Utils
import { formatMonthYear } from 'src/utils/formatTime';
import { fNumber, fIntNumber, fPercent, fVolume } from 'src/utils/formatNumber';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Components
import ExploreNFT from 'src/explore';
import Watch from 'src/components/Watch';

const MainContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  position: 'relative',
  animation: 'fadeInUp 0.6s ease-out',
  '@keyframes fadeInUp': {
    from: { 
      opacity: 0, 
      transform: 'translateY(20px)' 
    },
    to: { 
      opacity: 1, 
      transform: 'translateY(0)' 
    }
  }
}));

const CompactCard = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'dark' 
    ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
        theme.palette.background.paper,
        0.7
      )} 100%)`
    : `linear-gradient(145deg, ${alpha('#ffffff', 0.95)} 0%, ${alpha(
        theme.palette.background.paper,
        0.85
      )} 100%)`,
  backdropFilter: 'blur(20px) saturate(180%)',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  borderRadius: '24px',
  boxShadow: theme.palette.mode === 'dark'
    ? `0 20px 40px ${alpha(theme.palette.common.black, 0.3)}, 0 0 0 1px ${alpha(
        theme.palette.common.white,
        0.05
      )}`
    : `0 20px 40px ${alpha(theme.palette.primary.main, 0.08)}, 0 0 0 1px ${alpha(
        theme.palette.divider,
        0.05
      )}`,
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    borderRadius: '16px',
    boxShadow: theme.palette.mode === 'dark'
      ? `0 10px 20px ${alpha(theme.palette.common.black, 0.2)}`
      : `0 10px 20px ${alpha(theme.palette.primary.main, 0.05)}`
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
    opacity: 0.9,
    borderRadius: '24px 24px 0 0',
    animation: 'shimmer 3s ease-in-out infinite',
    '@keyframes shimmer': {
      '0%': { backgroundPosition: '-200% center' },
      '100%': { backgroundPosition: '200% center' }
    },
    backgroundSize: '200% 100%'
  },
  '&:hover': {
    boxShadow: theme.palette.mode === 'dark'
      ? `0 25px 50px ${alpha(theme.palette.common.black, 0.4)}`
      : `0 25px 50px ${alpha(theme.palette.primary.main, 0.12)}`,
    transition: 'box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2),
    borderRadius: '16px'
  }
}));

const IconCover = styled(Box)(({ theme }) => ({
  width: '80px',
  height: '80px',
  border: `3px solid ${alpha(theme.palette.background.paper, 0.95)}`,
  borderRadius: '16px',
  boxShadow: `0 6px 24px ${alpha(theme.palette.common.black, 0.1)}, 0 2px 8px ${alpha(
    theme.palette.primary.main,
    0.08
  )}`,
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
    theme.palette.background.paper,
    0.8
  )} 100%)`,
  backdropFilter: 'blur(12px)',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  animation: 'logoFloat 3s ease-in-out infinite',
  '@keyframes logoFloat': {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-5px)' }
  },
  '&:hover': {
    transform: 'translateY(-3px) scale(1.05)',
    animation: 'none',
    boxShadow: `0 12px 32px ${alpha(theme.palette.common.black, 0.15)}, 0 4px 12px ${alpha(
      theme.palette.primary.main,
      0.12
    )}`
  },
  [theme.breakpoints.up('sm')]: {
    width: '100px',
    height: '100px'
  },
  [theme.breakpoints.down('sm')]: {
    alignSelf: 'center',
    marginBottom: theme.spacing(1)
  }
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
  position: 'relative',
  borderRadius: '12px',
  overflow: 'hidden',
  '&:hover': {
    '& .MuiImageBackdrop-root': {
      opacity: 0.2
    },
    '& .MuiIconEditButton-root': {
      opacity: 1,
      transform: 'scale(1.15)'
    }
  }
}));

const ImageBackdrop = styled('span')(({ theme }) => ({
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  backgroundColor: theme.palette.common.black,
  opacity: 0,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
}));

const CardOverlay = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'absolute',
  inset: 0,
  zIndex: 2
});

const CompactStatsCard = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.6)} 0%, ${alpha(
        theme.palette.background.paper,
        0.4
      )} 100%)`
    : `linear-gradient(135deg, ${alpha('#ffffff', 0.9)} 0%, ${alpha(
        theme.palette.background.paper,
        0.7
      )} 100%)`,
  backdropFilter: 'blur(16px) saturate(150%)',
  border: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
  borderRadius: { xs: '12px', sm: '16px' },
  padding: { xs: theme.spacing(1.5), sm: theme.spacing(2) },
  textAlign: 'center',
  minWidth: { xs: 'unset', sm: '100px' },
  width: { xs: '100%', sm: 'auto' },
  aspectRatio: { xs: '1 / 1', sm: 'unset' },
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: `linear-gradient(90deg, transparent 0%, ${alpha(
      theme.palette.primary.main,
      0.3
    )} 50%, transparent 100%)`,
    opacity: 0.6
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 6px 20px ${alpha(theme.palette.common.black, 0.08)}, 0 2px 8px ${alpha(
      theme.palette.primary.main,
      0.06
    )}`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`
  }
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
        theme.palette.background.paper,
        0.6
      )} 100%)`
    : `linear-gradient(135deg, ${alpha('#ffffff', 0.95)} 0%, ${alpha(
        theme.palette.background.paper,
        0.85
      )} 100%)`,
  backdropFilter: 'blur(16px) saturate(180%)',
  border: `2px solid ${alpha(theme.palette.primary.main, 0.08)}`,
  borderRadius: '14px',
  padding: { xs: '8px', sm: '12px' },
  minWidth: { xs: '40px', sm: '48px' },
  minHeight: { xs: '40px', sm: '48px' },
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: `linear-gradient(90deg, transparent 0%, ${alpha(
      theme.palette.primary.main,
      0.4
    )} 50%, transparent 100%)`,
    opacity: 0.6
  },
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(
      theme.palette.primary.main,
      0.05
    )} 100%)`,
    border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
    transform: 'translateY(-3px) scale(1.05)',
    boxShadow: `0 10px 30px ${alpha(theme.palette.primary.main, 0.25)}, 0 3px 10px ${alpha(
      theme.palette.common.black,
      0.1
    )}`
  },
  '& svg': {
    transition: 'transform 0.3s ease'
  },
  '&:hover svg': {
    transform: 'scale(1.1)'
  }
}));

const WatchlistButton = styled(Box)(({ theme }) => ({
  '& .MuiIconButton-root': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
      theme.palette.background.paper,
      0.8
    )} 100%)`,
    backdropFilter: 'blur(12px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    borderRadius: '12px',
    padding: '10px',
    minWidth: '44px',
    minHeight: '44px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '1px',
      background: `linear-gradient(90deg, transparent 0%, ${alpha(
        theme.palette.warning.main,
        0.4
      )} 50%, transparent 100%)`,
      opacity: 0.6
    },
    '&:hover': {
      background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.12)} 0%, ${alpha(
        theme.palette.background.paper,
        0.95
      )} 100%)`,
      border: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`,
      transform: 'translateY(-2px)',
      boxShadow: `0 6px 20px ${alpha(theme.palette.warning.main, 0.2)}, 0 2px 8px ${alpha(
        theme.palette.common.black,
        0.08
      )}`
    }
  }
}));

const SharePopover = styled(Popover)(({ theme }) => ({
  '& .MuiPaper-root': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(
      theme.palette.background.paper,
      0.85
    )} 100%)`,
    backdropFilter: 'blur(24px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    borderRadius: '16px',
    boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.15)}, 0 4px 16px ${alpha(
      theme.palette.primary.main,
      0.08
    )}`,
    padding: theme.spacing(1)
  }
}));

const SocialButton = styled(Box)(({ theme }) => ({
  borderRadius: '12px',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  '&:hover': {
    transform: 'translateY(-2px) scale(1.05)',
    boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.15)}`
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: '12px',
    padding: '2px',
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    maskComposite: 'xor',
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    opacity: 0,
    transition: 'opacity 0.3s ease'
  },
  '&:hover::before': {
    opacity: 0.6
  }
}));

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.substr(0, n - 1) + ' ...' : str;
}

export default function ViewNFT({ collection }) {
  const anchorRef = useRef(null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { accountProfile } = useContext(AppContext);
  const accountLogin = accountProfile?.account;

  const [openShare, setOpenShare] = useState(false);

  const {
    account,
    accountName,
    name,
    slug,
    items,
    description,
    logoImage,
    verified,
    created,
    volume,
    totalVolume,
    floor,
    totalVol24h,
    extra
  } = collection;

  const floorPrice = floor?.amount || 0;
  const volume1 = fVolume(volume || 0);
  const volume2 = fVolume(totalVolume || 0);

  const shareUrl = `https://xrpnft.com/collection/${slug}`;
  const shareTitle = name;

  const statsData = [
    {
      label: 'Floor',
      value: fNumber(floorPrice),
      icon: '✕',
      color: 'primary',
      bgIcon: AccountBalanceWalletIcon,
      order: { xs: 1, sm: 1 }
    },
    {
      label: '24h Vol',
      value: fNumber(totalVol24h),
      icon: '✕',
      color: 'success',
      bgIcon: TrendingUpIcon,
      order: { xs: 2, sm: 2 }
    },
    {
      label: 'Total Vol',
      value: volume2,
      icon: '✕',
      tooltip: true,
      color: 'info',
      bgIcon: TrendingUpIcon,
      order: { xs: 3, sm: 3 }
    },
    {
      label: 'Supply',
      value: items,
      color: 'warning',
      bgIcon: InventoryIcon,
      order: { xs: 4, sm: 4 }
    },
    {
      label: 'Owners',
      value: extra.owners,
      color: 'secondary',
      bgIcon: PeopleIcon,
      order: { xs: 5, sm: 5 }
    }
  ];

  const handleOpenShare = () => {
    setOpenShare(true);
  };

  const handleCloseShare = () => {
    setOpenShare(false);
  };

  return (
    <MainContainer>
      <SharePopover
        open={openShare}
        onClose={handleCloseShare}
        anchorEl={anchorRef.current}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Box sx={{ p: 2 }}>
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            sx={{
              mb: 2,
              textAlign: 'center',
              color: 'text.primary',
              fontSize: '0.9rem'
            }}
          >
            Share Collection
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <FacebookShareButton url={shareUrl} quote={shareTitle}>
              <Tooltip title="Share on Facebook" arrow>
                <SocialButton>
                  <FacebookIcon size={40} round />
                </SocialButton>
              </Tooltip>
            </FacebookShareButton>

            <TwitterShareButton
              title={`Check out ${shareTitle} on XRPNFT`}
              url={shareUrl}
              hashtags={['XRPNFT', 'NFT']}
            >
              <Tooltip title="Share on Twitter" arrow>
                <SocialButton>
                  <TwitterIcon size={40} round />
                </SocialButton>
              </Tooltip>
            </TwitterShareButton>

            <Tooltip title="Copy Link" arrow>
              <SocialButton
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.info.main,
                    0.9
                  )}, ${alpha(theme.palette.info.dark, 0.9)})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`
                  }
                }}
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  handleCloseShare();
                }}
              >
                <Icon
                  icon="material-symbols:content-copy"
                  style={{
                    fontSize: '18px',
                    color: 'white'
                  }}
                />
              </SocialButton>
            </Tooltip>
          </Stack>
        </Box>
      </SharePopover>

      <CompactCard sx={{ position: 'relative' }}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={{ xs: 2, sm: 3 }} 
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          {/* Logo Section */}
          <Box sx={{ flexShrink: 0, display: { xs: 'flex', sm: 'block' }, justifyContent: 'center' }}>
            <IconCover>
              <IconWrapper>
                <Image
                  src={`https://s1.xrpnft.com/collection/${logoImage}`}
                  alt={`${name} collection logo`}
                  fill
                  priority
                  sizes="(max-width: 600px) 90px, 100px"
                  style={{ objectFit: 'cover', borderRadius: '12px' }}
                />
                {accountLogin === collection.account && (
                  <Link href={`/collection/${slug}/edit`} underline="none">
                    <CardOverlay>
                      <EditIcon
                        className="MuiIconEditButton-root"
                        sx={{
                          opacity: 0,
                          color: 'white',
                          fontSize: '1.6rem',
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.5))'
                        }}
                      />
                    </CardOverlay>
                    <ImageBackdrop className="MuiImageBackdrop-root" />
                  </Link>
                )}
              </IconWrapper>
            </IconCover>
          </Box>

          {/* Main Content Section */}
          <Stack spacing={1.5} flex={1} sx={{ minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
            {/* Title and Actions Row */}
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={{ xs: 1, sm: 2 }} 
              justifyContent="space-between" 
              alignItems={{ xs: 'center', sm: 'flex-start' }}
            >
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{ minWidth: 0, flex: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}
              >
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.text.primary}, ${theme.palette.primary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: { xs: '1.1rem', sm: '1.4rem' },
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    letterSpacing: '-0.02em',
                    maxWidth: { xs: '200px', sm: 'none' },
                    textAlign: { xs: 'center', sm: 'left' }
                  }}
                >
                  {name}
                </Typography>
                {verified === 'yes' && (
                  <Tooltip title="Verified Collection" arrow>
                    <Chip
                      icon={<VerifiedIcon sx={{ fontSize: '14px !important' }} />}
                      label="Verified"
                      size="small"
                      sx={{
                        background: `linear-gradient(135deg, ${alpha(
                          theme.palette.info.main,
                          0.15
                        )} 0%, ${alpha(theme.palette.info.main, 0.08)} 100%)`,
                        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                        color: theme.palette.info.main,
                        fontWeight: 600,
                        height: '24px',
                        fontSize: '0.7rem',
                        '& .MuiChip-icon': {
                          color: theme.palette.info.main
                        }
                      }}
                    />
                  </Tooltip>
                )}
              </Stack>

              <Stack 
                direction="row" 
                alignItems="center" 
                spacing={{ xs: 1, sm: 1.5 }} 
                sx={{ flexShrink: 0, ml: { xs: 0, sm: 2 }, mt: { xs: 1, sm: 0 } }}
              >
                  {accountLogin === collection.account && (
                    <Link href={`/collection/${slug}/edit`} underline="none">
                      <Tooltip title="Edit Collection" arrow placement="top">
                        <ActionButton size="small">
                          <EditIcon sx={{ fontSize: { xs: '0.9rem', sm: '1.1rem' }, color: 'text.primary' }} />
                        </ActionButton>
                      </Tooltip>
                    </Link>
                  )}

                  <WatchlistButton>
                    <Watch collection={collection} />
                  </WatchlistButton>

                  <Tooltip title="Share Collection" arrow placement="top">
                    <ActionButton size="small" ref={anchorRef} onClick={handleOpenShare}>
                      <ShareIcon sx={{ fontSize: { xs: '0.9rem', sm: '1.1rem' }, color: 'text.primary' }} />
                    </ActionButton>
                  </Tooltip>
              </Stack>
            </Stack>

            {/* Creator and Description Row */}
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={{ xs: 1.5, sm: 3 }} 
              alignItems={{ xs: 'center', sm: 'center' }} 
              sx={{ minWidth: 0, textAlign: { xs: 'center', sm: 'left' } }}
            >
              {fullScreen ? (
                <Chip
                  size="small"
                  label={
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          color: theme.palette.primary.main
                        }}
                      >
                        {account.slice(0, 4) + '...' + account.slice(-4)}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ fontSize: '0.65rem' }}
                      >
                        • {formatMonthYear(created).slice(0, 3)}
                      </Typography>
                    </Stack>
                  }
                  component={Link}
                  href={`/profile/${account}`}
                  clickable
                  sx={{
                    height: '22px',
                    backgroundColor: alpha(theme.palette.background.paper, 0.6),
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    '& .MuiChip-label': {
                      px: 1,
                      py: 0
                    },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      borderColor: alpha(theme.palette.primary.main, 0.2)
                    }
                  }}
                />
              ) : (
                <Box
                  sx={{
                    p: { xs: '6px 10px', sm: '8px 16px' },
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.background.paper,
                      0.6
                    )} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                    flexShrink: 0
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                      Created by
                    </Typography>
                    <Link color="inherit" href={`/profile/${account}`} underline="none">
                      <Typography
                        variant="body2"
                        color="primary"
                        fontWeight={600}
                        sx={{
                          fontSize: '0.8rem',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        {accountName || account + account.slice(-6)}
                      </Typography>
                    </Link>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                      • {formatMonthYear(created)}
                    </Typography>
                  </Stack>
                </Box>
              )}

              {description && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontSize: { xs: '0.75rem', sm: '0.85rem' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: { xs: 'nowrap', sm: 'nowrap' },
                    flex: 1,
                    minWidth: 0,
                    lineHeight: 1.3,
                    fontStyle: 'italic',
                    maxWidth: { xs: '100%', sm: 'none' },
                    px: { xs: 1, sm: 0 }
                  }}
                >
                  "{truncate(description, fullScreen ? 60 : 100)}"
                </Typography>
              )}
            </Stack>
          </Stack>

          {/* Stats Section */}
          <Box
            sx={{
              display: { xs: 'grid', sm: 'flex' },
              gridTemplateColumns: { xs: 'repeat(2, 1fr)' },
              gap: { xs: 0.5, sm: 1.5 },
              flexDirection: 'row',
              flexShrink: 0,
              width: { xs: '100%', sm: 'auto' },
              mt: { xs: 2, sm: 0 },
              justifyContent: { xs: 'stretch', sm: 'flex-end' },
            }}
          >
            {statsData.filter((item, index) => index < 4).map((item, index) => {
              const IconComponent = item.bgIcon;
              return (
                <CompactStatsCard key={item.label}>
                  <Box sx={{ width: '100%' }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      sx={{
                        fontSize: { xs: '1rem', sm: '1.1rem' },
                        color: 'text.primary',
                        lineHeight: 1.2,
                        mb: 0.5
                      }}
                    >
                      {item.icon && (
                        <span style={{ marginRight: '3px', fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                          {item.icon}
                        </span>
                      )}
                      {item.value}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        fontWeight: 500,
                        lineHeight: 1,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5
                      }}
                    >
                      {item.label}
                      {item.tooltip && (
                        <Tooltip title={`Volume on XRPNFT: ${volume1}`} arrow>
                          <Icon
                            icon={infoFilled}
                            style={{
                              fontSize: '10px',
                              color: theme.palette.text.secondary,
                              cursor: 'help'
                            }}
                          />
                        </Tooltip>
                      )}
                    </Typography>
                  </Box>
                </CompactStatsCard>
              );
            })}
          </Box>
        </Stack>
      </CompactCard>

      <CompactCard sx={{ '&::before': { display: 'none' } }}>
        <ExploreNFT collection={collection} />
      </CompactCard>
    </MainContainer>
  );
}
