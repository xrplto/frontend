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

  return (
    <GlassBox>
      <Popover
        open={openShare}
        onClose={() => setOpenShare(false)}
        anchorEl={anchorRef.current}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Stack direction="row" spacing={2} sx={{ p: 1.5 }}>
          <FacebookShareButton url={shareUrl} quote={shareTitle}>
            <FacebookIcon size={24} round />
          </FacebookShareButton>
          <TwitterShareButton title={shareTitle} url={shareUrl}>
            <TwitterIcon size={24} round />
          </TwitterShareButton>
        </Stack>
      </Popover>
      <IconCover>
        <IconWrapper>
          <IconImage src={`https://s1.xrpnft.com/collection/${logoImage}`} />
          {accountLogin === collection.account && (
            <Link href={`/collection/${slug}/edit`} underline="none">
              <CardOverlay>
                <EditIcon
                  className="MuiIconEditButton-root"
                  // color='primary'
                  fontSize="large"
                  sx={{ opacity: 0, zIndex: 1 }}
                />
              </CardOverlay>
              <ImageBackdrop className="MuiImageBackdrop-root" />
            </Link>
          )}
        </IconWrapper>
      </IconCover>
      <Stack
        direction={fullScreen ? 'column' : 'row'}
        spacing={2}
        justifyContent="space-between"
        sx={{ mt: 1, mb: 1 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h4" fontWeight="bold">
            {name}
          </Typography>
          {verified === 'yes' && (
            <Tooltip title="Verified">
              <VerifiedIcon style={{ color: '#4589ff' }} />
            </Tooltip>
          )}
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          {accountLogin === collection.account && (
            <Link href={`/collection/${slug}/edit`} underline="none">
              <Tooltip title="Edit your collection">
                <IconButton size="medium" sx={{ padding: 1 }}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
            </Link>
          )}

          <Tooltip title="Add to watchlist">
            <Watch collection={collection} />
          </Tooltip>

          <Tooltip title="Share">
            <IconButton size="medium" sx={{ padding: 1 }} ref={anchorRef} onClick={() => {}}>
              <ShareIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Stack direction="row" sx={{ mt: 2, mb: 3 }} spacing={1}>
        <Typography variant="s5" style={{ wordBreak: 'break-word' }}>
          By&nbsp;
          <Link
            color="inherit"
            // target="_blank"
            href={`/account/${account}`}
            // rel="noreferrer noopener nofollow"
          >
            <Typography variant="s5" color="primary">
              {accountName || account.slice(0, 4) + '...' + account.slice(-4)}
            </Typography>
          </Link>
          <Typography variant="s10">
            &nbsp;&nbsp;·&nbsp;Created{' '}
            <Typography variant="s3">{formatMonthYear(created)}</Typography>
          </Typography>
        </Typography>
      </Stack>

      <SeeMoreTypography variant="d3" text={description} />

      {/* {description &&
                <Typography variant="d3" style={{ wordBreak: "break-word" }}>{description}</Typography>
            } */}

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          py: 3,
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
          spacing={{ xs: 3, sm: 5 }}
          alignItems="flex-start"
          justifyContent={{ xs: 'space-around', sm: 'space-between' }}
        >
          {statsData.map((item, index) => (
            <Stack key={index} alignItems="center" sx={{ minWidth: 100 }}>
              <Typography variant="h6" fontWeight="bold" noWrap>
                {item.icon && <span style={{ marginRight: '4px' }}>{item.icon}</span>}
                {item.value}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {item.label}
              </Typography>
              {item.tooltip && (
                <Tooltip title={`Volume on XRPNFT: ${volume1}`}>
                  <Icon icon={infoFilled} style={{ marginTop: '4px' }} />
                </Tooltip>
              )}
            </Stack>
          ))}
        </Stack>
      </Box>

      <ExploreNFT collection={collection} />

      {/* <Button component={Link} href="/collection/create" variant="contained" color="primary">
                Create a collection
            </Button> */}
      {/* <Stack sx={{mt:5, minHeight: '50vh'}}>
            </Stack> */}
    </GlassBox>
  );
}
