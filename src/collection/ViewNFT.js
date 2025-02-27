import React from 'react';
import { useRef, useState } from 'react';
import { FacebookShareButton, TwitterShareButton } from 'react-share';
import { FacebookIcon, TwitterIcon } from 'react-share';

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
  Typography
} from '@mui/material';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import VerifiedIcon from '@mui/icons-material/Verified';
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
import SeeMoreTypography from 'src/components/SeeMoreTypography';
import Watch from 'src/components/Watch';

// Combine styled components with similar styles
const IconCover = styled('div')(({ theme }) => ({
  width: '102px',
  height: '102px',
  marginTop: '-56px',
  marginBottom: '16px',
  border: `6px solid ${theme.colors?.alpha.black[50]}`,
  borderRadius: '10px',
  boxShadow: 'rgb(0 0 0 / 8%) 0px 5px 10px',
  backgroundColor: theme.colors?.alpha.white[70],
  position: 'relative',
  overflow: 'hidden',
  [theme.breakpoints.up('sm')]: {
    width: '132px',
    height: '132px',
    marginTop: '-86px'
  },
  [theme.breakpoints.up('md')]: {
    width: '192px',
    height: '192px',
    marginTop: '-156px'
  }
}));

const IconWrapper = styled('div')(({ theme }) => ({
  boxSizing: 'border-box',
  display: 'inline-block',
  position: 'relative',
  width: '90px',
  height: '90px',
  [theme.breakpoints.up('sm')]: {
    width: '120px',
    height: '120px'
  },
  [theme.breakpoints.up('md')]: {
    width: '180px',
    height: '180px'
  },
  '&:hover, &.Mui-focusVisible': {
    zIndex: 1,
    '& .MuiImageBackdrop-root': {
      opacity: 0.1
    },
    '& .MuiIconEditButton-root': {
      opacity: 1
    }
  }
}));

const IconImage = styled('img')({
  position: 'absolute',
  inset: 0,
  boxSizing: 'border-box',
  padding: 0,
  border: 'none',
  margin: 'auto',
  display: 'block',
  width: 0,
  height: 0,
  minWidth: '100%',
  maxWidth: '100%',
  minHeight: '100%',
  maxHeight: '100%',
  objectFit: 'cover'
});

const ImageBackdrop = styled('span')(({ theme }) => ({
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  backgroundColor: theme.palette.common.black,
  opacity: 0,
  transition: theme.transitions.create('opacity')
}));

const CardOverlay = styled('div')(
  ({ theme }) => `
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: absolute;
    inset: 0;
`
);

const GlassBox = styled(Box)(({ theme }) => ({
  backdropFilter: 'blur(10px)',
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  boxShadow: theme.shadows[10]
}));

function truncate(str, n) {
  if (!str) return '';
  //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
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
    { label: 'Floor Price', value: fNumber(floorPrice), icon: '✕' },
    { label: '24h Vol', value: fNumber(totalVol24h), icon: '✕' },
    { label: 'All Vol', value: volume2, icon: '✕', tooltip: true },
    { label: 'Supply', value: items },
    { label: 'Owners', value: extra.owners }
  ];

  const handleOpenShare = () => {
    setOpenShare(true);
  };

  const handleCloseShare = () => {
    setOpenShare(false);
  };

  return (
    <GlassBox>
      <Popover
        open={openShare}
        onClose={handleCloseShare}
        anchorEl={anchorRef.current}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <Stack direction="row" spacing={2} sx={{ p: 2 }}>
          <FacebookShareButton url={shareUrl} quote={shareTitle}>
            <Tooltip title="Share on Facebook">
              <FacebookIcon size={32} round />
            </Tooltip>
          </FacebookShareButton>

          <TwitterShareButton
            title={`Check out ${shareTitle} on XRPNFT`}
            url={shareUrl}
            hashtags={['XRPNFT', 'NFT']}
          >
            <Tooltip title="Share on Twitter">
              <TwitterIcon size={32} round />
            </Tooltip>
          </TwitterShareButton>
        </Stack>
      </Popover>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <Box>
          <IconCover sx={{ mt: { xs: 7, md: 0 } }}>
            <IconWrapper>
              <IconImage src={`https://s1.xrpnft.com/collection/${logoImage}`} />
              {accountLogin === collection.account && (
                <Link href={`/collection/${slug}/edit`} underline="none">
                  <CardOverlay>
                    <EditIcon
                      className="MuiIconEditButton-root"
                      fontSize="large"
                      sx={{ opacity: 0, zIndex: 1 }}
                    />
                  </CardOverlay>
                  <ImageBackdrop className="MuiImageBackdrop-root" />
                </Link>
              )}
            </IconWrapper>
          </IconCover>
        </Box>

        <Stack spacing={2} flex={1}>
          <Stack
            direction={fullScreen ? 'column' : 'row'}
            spacing={1}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="h4" fontWeight="bold">
                {name}
              </Typography>
              {verified === 'yes' && (
                <Tooltip title="Verified">
                  <VerifiedIcon style={{ color: '#4589ff' }} />
                </Tooltip>
              )}
            </Stack>

            <Stack direction="row" alignItems="center" spacing={0.5}>
              {accountLogin === collection.account && (
                <Link href={`/collection/${slug}/edit`} underline="none">
                  <Tooltip title="Edit your collection">
                    <IconButton size="small" sx={{ padding: 0.5 }}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </Link>
              )}

              <Tooltip title="Add to watchlist">
                <Watch collection={collection} />
              </Tooltip>

              <Tooltip title="Share">
                <IconButton
                  size="small"
                  sx={{ padding: 0.5 }}
                  ref={anchorRef}
                  onClick={handleOpenShare}
                >
                  <ShareIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={0.5}>
            <Typography variant="body2" style={{ wordBreak: 'break-word' }}>
              By&nbsp;
              <Link color="inherit" href={`/account/${account}`}>
                <Typography variant="body2" color="primary" component="span">
                  {accountName || account.slice(0, 4) + '...' + account.slice(-4)}
                </Typography>
              </Link>
              <Typography variant="body2" component="span">
                &nbsp;·&nbsp;Created{' '}
                <Typography variant="body2" component="span">
                  {formatMonthYear(created)}
                </Typography>
              </Typography>
            </Typography>
          </Stack>

          <SeeMoreTypography variant="body2" text={description} />

          <Box
            sx={{
              display: 'flex',
              gap: 1,
              py: 2,
              overflow: 'auto',
              width: '100%',
              '& > *': {
                scrollSnapAlign: 'center'
              },
              '::-webkit-scrollbar': { display: 'none' }
            }}
          >
            <Stack
              direction="row"
              width="100%"
              spacing={{ xs: 2, sm: 3 }}
              alignItems="flex-start"
              justifyContent={{ xs: 'space-around', sm: 'space-between' }}
            >
              {statsData.map((item, index) => (
                <Stack key={index} alignItems="center" sx={{ minWidth: 80 }}>
                  <Typography variant="subtitle1" fontWeight="bold" noWrap>
                    {item.icon && <span style={{ marginRight: '2px' }}>{item.icon}</span>}
                    {item.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {item.label}
                  </Typography>
                  {item.tooltip && (
                    <Tooltip title={`Volume on XRPNFT: ${volume1}`}>
                      <Icon icon={infoFilled} style={{ marginTop: '2px', fontSize: '14px' }} />
                    </Tooltip>
                  )}
                </Stack>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Stack>

      <ExploreNFT collection={collection} />
    </GlassBox>
  );
}
