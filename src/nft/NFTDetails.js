import React, { memo, useMemo, useState, useContext } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
const Swiper = dynamic(() => import('swiper/react').then((mod) => mod.Swiper), { ssr: false });
const SwiperSlide = dynamic(() => import('swiper/react').then((mod) => mod.SwiperSlide), {
  ssr: false
});
import { Navigation, Pagination } from 'swiper/modules';

// Material
import {
  Box,
  Typography,
  Stack,
  Divider,
  IconButton,
  Link,
  Tooltip,
  Chip,
  useTheme,
  useMediaQuery,
  Grid,
  Paper,
  Card,
  CardMedia,
  Modal,
  Avatar,
  CircularProgress
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CloseIcon from '@mui/icons-material/Close';
import ShareIcon from '@mui/icons-material/Share';
import { styled, alpha } from '@mui/material/styles';

// Iconify
import InfoIcon from '@mui/icons-material/Info';

// Context
import { AppContext } from 'src/AppContext';

// Utils
import { fVolume, fNumber } from 'src/utils/formatters';
import { convertHexToString, parseNFTokenID, getNftFilesUrls } from 'src/utils/parseUtils';

// Components
// Removed import of Flags.js - component inlined below
import Tabs from './Tabs';

// Material UI Icons for Flags component
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

// Translation function
function t(key) {
  const translations = {
    'general.loading': 'Loading...',
    'general.load-failed': 'Failed to load',
    'general.no-uri': 'No URI specified',
    'general.no-image': 'No media found',
    'tabs.image': 'Image',
    'tabs.video': 'Video',
    'tabs.animation': 'Animation',
    'tabs.audio': 'Audio',
    'tabs.model': '3D model',
    'tabs.viewer': 'Viewer',
    'general.viewer': 'Viewer'
  };
  return translations[key] || '';
}

// Arrow component for carousel navigation
function Arrow(props) {
  return (
    <IconButton
      onClick={props.onClick}
      disabled={props.disabled}
      sx={{
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        [props.left ? 'left' : 'right']: 8,
        color: 'white',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
      }}
    >
      {props.left ? <ArrowBackIosNewIcon /> : <ArrowForwardIosIcon />}
    </IconButton>
  );
}

function getProperties(meta) {
  const properties = [];
  if (!meta) return [];

  // Attributes
  try {
    const attributes = meta.attributes;
    if (attributes && attributes.length > 0) {
      for (const attr of attributes) {
        const type = attr.type || attr.trait_type;
        const value = attr.value;
        properties.push({ type, value });
      }
    }
  } catch (e) {}

  // Other props
  const props = [
    'Rarity',
    'Signature',
    'Background',
    'Base',
    'Mouth',
    'Accessories',
    'Base Effects',
    'Blade Effect',
    'End Scene',
    'Music',
    'Blades In Video',
    'Special'
  ];

  try {
    for (const prop of props) {
      if (meta[prop]) {
        properties.push({ type: prop, value: meta[prop] });
      }
    }
  } catch (e) {}

  return properties;
}

// Styled components
const Container = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: '480px',
  padding: 0,
  [theme.breakpoints.down('sm')]: {
    maxWidth: '100%'
  }
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '11px',
  fontWeight: 600,
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(0.5),
  textTransform: 'uppercase',
  letterSpacing: '0.03em'
}));

const Label = styled(Typography)(({ theme }) => ({
  fontSize: '13px',
  color: theme.palette.text.secondary,
  marginBottom: 2,
  lineHeight: 1.2
}));

const Value = styled(Typography)(({ theme }) => ({
  fontSize: '12px',
  color: theme.palette.text.primary,
  wordBreak: 'break-all',
  lineHeight: 1.3
}));

const CopyButton = styled(IconButton)(({ theme }) => ({
  padding: 2,
  marginLeft: theme.spacing(0.25),
  '& .MuiSvgIcon-root': {
    fontSize: '12px'
  }
}));

const CompactChip = styled(Chip)(({ theme }) => ({
  height: 18,
  fontSize: '13px',
  '& .MuiChip-icon': {
    fontSize: '12px'
  },
  '& .MuiChip-label': {
    padding: '0 6px'
  }
}));

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  boxShadow: theme.shadows[4],
  backgroundColor: theme.palette.background.paper,
  width: '100%'
}));

const MediaContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  aspectRatio: '1 / 1',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor:
    theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100],
  overflow: 'hidden'
}));

// NFT Preview Component (embedded)
const NFTPreviewComponent = memo(function NFTPreviewComponent({ nft, showDetails = false }) {
  const { darkMode } = useContext(AppContext);
  const noImg = '/static/nft_no_image.webp';

  // Slider state
  const [loadedSlider, setLoadedSlider] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [openImage, setOpenImage] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  // Get media URLs
  let imageUrl = getNftFilesUrls(nft, 'image');
  const animationUrl = getNftFilesUrls(nft, 'animation');
  const videoUrl = getNftFilesUrls(nft, 'video');
  const audioUrl = getNftFilesUrls(nft, 'audio');
  const modelUrl = getNftFilesUrls(nft, 'model');
  const viewerUrl = getNftFilesUrls(nft, 'viewer');

  const [contentTab, setContentTab] = useState(
    videoUrl ? 'video' : animationUrl ? 'animation' : 'image'
  );

  const clUrl = {
    image: imageUrl?.[currentSlide]?.cachedUrl,
    animation: animationUrl?.[currentSlide]?.cachedUrl,
    video: videoUrl?.[currentSlide]?.cachedUrl,
    audio: audioUrl?.[currentSlide]?.cachedUrl,
    model: modelUrl?.[currentSlide]?.cachedUrl
  };

  const contentTabList = [];
  if (videoUrl) contentTabList.push({ value: 'video', label: t('tabs.video') });
  if (animationUrl) contentTabList.push({ value: 'animation', label: t('tabs.animation') });
  if (imageUrl) contentTabList.push({ value: 'image', label: t('tabs.image') });
  if (modelUrl) contentTabList.push({ value: 'model', label: t('tabs.model') });

  if (!contentTabList.length) {
    contentTabList.push({ value: 'image', label: t('tabs.image') });
    imageUrl = noImg;
  }

  const imgOrAnimUrl =
    contentTab === 'image' ? imageUrl : contentTab === 'animation' ? animationUrl : '';

  const handleOpenImage = (imageUrl) => {
    setSelectedImageUrl(imageUrl);
    setOpenImage(true);
  };

  const handleTweetNFT = () => {
    const nftName = nft?.name || 'this NFT';
    const collectionName = nft?.collection || nft?.meta?.collection?.name || '';
    const currentUrl = window.location.href;

    let tweetText = `Check out ${nftName}`;
    if (collectionName) {
      tweetText += ` from ${collectionName} collection`;
    }
    tweetText += ` on @xrplto! 🚀\n\n`;

    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(currentUrl)}`;
    window.open(tweetUrl, '_blank', 'width=550,height=420');
  };

  const NFTName = nft?.name || nft?.meta?.name || nft?.meta?.Name || 'Untitled NFT';
  const collectionName = nft?.collection || nft?.meta?.collection?.name || '';
  const rarity = nft?.rarity_rank || null;

  const loadingImage = () => {
    if (errored) {
      return (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (theme) => alpha(theme.palette.common.black, 0.7)
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Image unavailable
          </Typography>
        </Box>
      );
    } else if (!loaded) {
      return (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <CircularProgress size={24} />
        </Box>
      );
    }
  };

  const renderImageLink = (file) => {
    const cdn = 'https://s2.xrpnft.com/d1/';
    const imageUrl = typeof file === 'string'
      ? file
      : file.thumbnail?.big
        ? cdn + file.thumbnail.big
        : file.thumbnail?.small
          ? cdn + file.thumbnail.small
          : file.cachedUrl;

    return (
      <Box
        onClick={() => handleOpenImage(imageUrl)}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          cursor: 'pointer'
        }}
      >
        {loadingImage()}
        <img
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            maxWidth: '100%',
            maxHeight: '100%',
            display: loaded ? 'block' : 'none',
            position: 'absolute',
            top: 0,
            left: 0
          }}
          onLoad={() => {
            setLoaded(true);
            setErrored(false);
          }}
          onError={() => setErrored(true)}
          src={imageUrl}
          alt={NFTName}
        />
      </Box>
    );
  };

  return (
    <StyledCard>

      {/* Tabs */}
      {contentTabList.length > 1 && (
        <Box sx={{ px: 2, pb: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Tabs tabList={contentTabList} tab={contentTab} setTab={setContentTab} name="content" />
        </Box>
      )}

      {/* Media */}
      <MediaContainer>
        {((imageUrl && contentTab === 'image') || (animationUrl && contentTab === 'animation')) && (
          <>
            {renderImageLink(typeof imgOrAnimUrl === 'string' ? imgOrAnimUrl : imgOrAnimUrl[0])}
            <Modal
              open={openImage}
              onClose={() => setOpenImage(false)}
            >
              <Box
                sx={{
                  position: 'relative',
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img
                  src={selectedImageUrl}
                  alt={NFTName}
                  style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
                />
                <IconButton
                  onClick={() => setOpenImage(false)}
                  sx={{ position: 'absolute', top: 10, right: 10, color: 'white' }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Modal>
          </>
        )}

        {videoUrl && contentTab === 'video' && (
          <Box sx={{ p: 2 }}>
            <video
              playsInline
              muted
              loop
              controls
              style={{ width: '100%', height: '100%', maxHeight: '100%', objectFit: 'contain' }}
            >
              <source src={videoUrl[currentSlide]?.cachedUrl} type="video/mp4" />
            </video>
          </Box>
        )}
      </MediaContainer>

      {/* Footer */}
      {showDetails && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Stack direction="row" spacing={2}>
              {nft?.transferFee && (
                <Chip
                  label={`${(nft.transferFee / 1000).toFixed(1)}% Fee`}
                  size="small"
                  variant="filled"
                  sx={{ bgcolor: 'action.selected' }}
                />
              )}
              {nft?.volume > 0 && (
                <Chip
                  label={`${fVolume(nft.volume)} XRP Vol`}
                  size="small"
                  variant="filled"
                  sx={{ bgcolor: 'action.selected' }}
                />
              )}
            </Stack>
          </Stack>
        </Box>
      )}
    </StyledCard>
  );
});

// Main NFTDetails Component
const NFTDetails = memo(function NFTDetails({ nft }) {
  const { openSnackbar } = useContext(AppContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    collection,
    account,
    date,
    meta,
    cslug,
    NFTokenID,
    props,
    total,
    volume,
    rarity_rank,
    files,
    royalty,
    MasterSequence
  } = nft;

  const { flag, issuer } = useMemo(() => parseNFTokenID(NFTokenID), [NFTokenID]);
  const transferFee = royalty ? (royalty / 1000).toFixed(1) : 0;

  const strDateTime = useMemo(() => {
    if (!date) return '';
    try {
      const dt = new Date(date);
      if (!isNaN(dt.getTime())) {
        return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      }
    } catch (error) {
      console.error('Error formatting date:', error);
    }
    return '';
  }, [date]);

  const collectionName = useMemo(
    () => collection || meta?.collection?.name || 'No Collection',
    [collection, meta]
  );
  const properties = useMemo(() => props || getProperties(meta), [props, meta]);

  return (
    <Container>
      {/* NFT Preview */}
      <Box sx={{ mb: 1, width: '100%' }}>
        <NFTPreviewComponent nft={nft} showDetails={false} />
      </Box>

      {/* Title and Collection */}
      <Box sx={{ mb: 1, px: 1, py: 0.8 }}>
        <Typography variant="h6" sx={{ fontSize: '15px', fontWeight: 600, mb: 0.3 }}>
          {nft.name || meta?.name || 'Untitled'}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          {cslug && (
            <Link href={`/collection/${cslug}`} underline="none" color="inherit" sx={{ '&:hover': { color: 'primary.main' } }}>
              <Typography variant="caption" sx={{ fontSize: '11px', color: 'text.secondary' }}>
                {collectionName}
              </Typography>
            </Link>
          )}
          {date && (
            <Typography variant="caption" sx={{ fontSize: '13px', color: 'text.disabled' }}>
              {new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </Typography>
          )}
        </Stack>
      </Box>

      {/* Properties */}
      {properties && properties.length > 0 && (
        <Paper sx={{ p: 1, mb: 1, backgroundColor: alpha(theme.palette.background.paper, 0.5) }}>
          <SectionTitle>Properties</SectionTitle>
          <Grid container spacing={0.5}>
            {properties.map((item, idx) => {
              const type = item.type || item.trait_type;
              const value = item.value;
              const count = item.count || 0;
              const rarity = total > 0 && count > 0 ? ((count * 100) / total).toFixed(2) : 0;

              return (
                <Grid key={`${type}-${value}`} size={{ xs: 6, sm: 4, md: 3 }}>
                  <Paper
                    sx={{
                      p: 0.5,
                      textAlign: 'center',
                      borderRadius: '4px',
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      backgroundColor: alpha(theme.palette.background.paper, 0.3),
                      height: '100%'
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                        fontWeight: 600
                      }}
                    >
                      {type}
                    </Typography>
                    <Typography sx={{ fontSize: '11px', fontWeight: 400, my: 0.25 }}>
                      {value}
                    </Typography>
                    {total > 0 && count > 0 && (
                      <Typography sx={{ fontSize: '11px', color: 'text.secondary' }}>
                        {count} ({rarity}%)
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      )}

      {/* Description */}
      {meta?.description && (
        <Paper sx={{ p: 1, mb: 1, backgroundColor: alpha(theme.palette.background.paper, 0.5) }}>
          <SectionTitle>Description</SectionTitle>
          <Value sx={{ lineHeight: 1.4, fontSize: '11px', maxHeight: 60, overflowY: 'auto' }}>
            {meta.description}
          </Value>
        </Paper>
      )}

      {/* Stats */}
      {(rarity_rank > 0 || MasterSequence > 0 || volume > 0) && (
        <Paper sx={{ p: 1, mb: 1, backgroundColor: alpha(theme.palette.background.paper, 0.5) }}>
          <Stack direction="row" spacing={3}>
            {rarity_rank > 0 && (
              <Box>
                <Label sx={{ mb: 0.3 }}>Rarity Rank</Label>
                <Value sx={{ fontSize: '12px' }}>#{rarity_rank}</Value>
              </Box>
            )}
            {MasterSequence > 0 && (
              <Box>
                <Label sx={{ mb: 0.3 }}>On-Chain Rank</Label>
                <Value sx={{ fontSize: '12px' }}>#{MasterSequence}</Value>
              </Box>
            )}
            {volume > 0 && (
              <Box>
                <Label sx={{ mb: 0.3 }}>Volume</Label>
                <Value sx={{ fontSize: '12px' }}>✕{fVolume(volume)}</Value>
              </Box>
            )}
          </Stack>
        </Paper>
      )}

      {/* Technical Details */}
      <Paper sx={{ p: 1.2, mb: 1, backgroundColor: alpha(theme.palette.background.paper, 0.5) }}>
        <Stack spacing={0.6}>
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Label sx={{ mb: 0.2 }}>Owner</Label>
              <Link href={`/account/${account}`} underline="none" color="inherit" sx={{ '&:hover': { color: 'primary.main' } }}>
                <Value sx={{ fontSize: '13px', wordBreak: 'break-all' }}>{account}</Value>
              </Link>
            </Box>
            <Box>
              <Label sx={{ mb: 0.2 }}>Royalties</Label>
              <Value sx={{ fontSize: '11px' }}>{transferFee}%</Value>
            </Box>
          </Stack>

          <Box>
            <Label sx={{ mb: 0.2 }}>Issuer</Label>
            <Link href={`/account/${issuer}`} underline="none" color="inherit" sx={{ '&:hover': { color: 'primary.main' } }}>
              <Value sx={{ fontSize: '13px', wordBreak: 'break-all' }}>{issuer}</Value>
            </Link>
          </Box>

          <Box>
            <Label sx={{ mb: 0.2 }}>Token ID</Label>
            <Link href={`https://livenet.xrpl.org/nfts/${NFTokenID}`} target="_blank" underline="none" color="inherit" sx={{ '&:hover': { color: 'primary.main' } }}>
              <Value sx={{ fontSize: '12px', wordBreak: 'break-all' }}>{NFTokenID}</Value>
            </Link>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
});

// Export the NFTPreview as a named export for backward compatibility
export const NFTPreview = NFTPreviewComponent;
export default NFTDetails;
