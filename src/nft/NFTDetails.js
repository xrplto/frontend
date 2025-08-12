import React, { memo, useMemo, useState, useContext, lazy, Suspense } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
const Lightbox = lazy(() => import('react-modal-image').then(module => ({ default: module.Lightbox })));
import Head from 'next/head';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';

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
  Backdrop,
  Avatar
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
import { Icon } from '@iconify/react';
import infoFilled from '@iconify/icons-ep/info-filled';

// Context
import { AppContext } from 'src/AppContext';

// Utils
import { fVolume, fNumber } from 'src/utils/formatNumber';
import { convertHexToString, parseNFTokenID, getNftFilesUrls } from 'src/utils/parse/utils';

// Components
import FlagsContainer from 'src/components/Flags';
import Properties from './Properties';
import Tabs from './Tabs';

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
    'Rarity', 'Signature', 'Background', 'Base', 'Mouth', 'Accessories',
    'Base Effects', 'Blade Effect', 'End Scene', 'Music', 'Blades In Video', 'Special'
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
  padding: theme.spacing(1.5),
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(1)
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.5)
  }
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '0.7rem',
  fontWeight: 600,
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(0.5),
  textTransform: 'uppercase',
  letterSpacing: '0.03em'
}));

const Label = styled(Typography)(({ theme }) => ({
  fontSize: '0.65rem',
  color: theme.palette.text.secondary,
  marginBottom: 2,
  lineHeight: 1.2
}));

const Value = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.primary,
  wordBreak: 'break-all',
  lineHeight: 1.3
}));

const CopyButton = styled(IconButton)(({ theme }) => ({
  padding: 2,
  marginLeft: theme.spacing(0.25),
  '& .MuiSvgIcon-root': {
    fontSize: '0.75rem'
  }
}));

const CompactChip = styled(Chip)(({ theme }) => ({
  height: 18,
  fontSize: '0.65rem',
  '& .MuiChip-icon': {
    fontSize: '0.75rem'
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
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8]
  }
}));

const MediaContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  aspectRatio: '1 / 1',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100],
  overflow: 'hidden',
  [theme.breakpoints.down('md')]: {
    aspectRatio: '4 / 3'
  },
  [theme.breakpoints.down('sm')]: {
    aspectRatio: '16 / 9'
  }
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
  
  const [sliderRef, instanceRef] = useKeenSlider({
    initial: 0,
    loop: true,
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
    created() {
      setLoadedSlider(true);
    }
  });

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

  const imgOrAnimUrl = contentTab === 'image' ? imageUrl : contentTab === 'animation' ? animationUrl : '';

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
      return <div style={{ textAlign: 'center', marginTop: '40px' }}>{t('general.load-failed')}<br /></div>;
    } else if (!loaded) {
      return <div style={{ textAlign: 'center', marginTop: '40px' }}><span className="waiting"></span><br />{t('general.loading')}</div>;
    }
  };

  const renderImageLink = (file) => (
    <Link
      component="button"
      underline="none"
      onClick={() => handleOpenImage(file.cachedUrl)}
      sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
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
        onLoad={() => { setLoaded(true); setErrored(false); }}
        onError={() => setErrored(true)}
        src={typeof file === 'string' ? file : file.thumbnail ? 'https://s2.xrpnft.com/d1/' + (file.thumbnail?.big || file.thumbnail?.small) : file.cachedUrl}
        alt={NFTName}
      />
    </Link>
  );

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

  return (
    <StyledCard>
      {/* Header */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {NFTName}
            </Typography>
            {collectionName && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Avatar sx={{ width: 20, height: 20 }} src="/static/collection-placeholder.png" />
                <Typography variant="body2" color="text.secondary">{collectionName}</Typography>
              </Stack>
            )}
          </Box>
          <Stack direction="row" spacing={1}>
            {rarity && <Chip label={`Rank #${rarity}`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />}
            <Tooltip title="Share">
              <IconButton size="small" onClick={handleTweetNFT}>
                <ShareIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

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
            {typeof imgOrAnimUrl === 'object' && imgOrAnimUrl.length > 1 ? (
              <div className="navigation-wrapper" style={{ width: '100%', height: '100%' }}>
                <div ref={sliderRef} className="keen-slider" style={{ height: '100%' }}>
                  {imgOrAnimUrl.map((file, index) => (
                    <div key={index} className={`keen-slider__slide number-slide${index + 1}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      {renderImageLink(file)}
                    </div>
                  ))}
                </div>
                {loadedSlider && instanceRef.current && (
                  <>
                    <Arrow left onClick={(e) => e.stopPropagation() || instanceRef.current?.prev()} disabled={currentSlide === 0} />
                    <Arrow onClick={(e) => e.stopPropagation() || instanceRef.current?.next()} disabled={currentSlide === instanceRef.current.track.details.slides.length - 1} />
                  </>
                )}
              </div>
            ) : (
              renderImageLink(typeof imgOrAnimUrl === 'string' ? imgOrAnimUrl : imgOrAnimUrl[0])
            )}
            <Modal open={openImage} onClose={() => setOpenImage(false)} closeAfterTransition BackdropComponent={Backdrop}>
              <Box sx={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={selectedImageUrl} alt={NFTName} style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }} />
                <IconButton onClick={() => setOpenImage(false)} sx={{ position: 'absolute', top: 10, right: 10, color: 'white' }}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </Modal>
          </>
        )}

        {videoUrl && contentTab === 'video' && (
          <Box sx={{ p: 2 }}>
            <video playsInline muted loop controls style={{ width: '100%', height: '100%', maxHeight: '100%', objectFit: 'contain' }}>
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
              {nft?.transferFee && <Chip label={`${(nft.transferFee / 1000).toFixed(1)}% Fee`} size="small" variant="filled" sx={{ bgcolor: 'action.selected' }} />}
              {nft?.volume > 0 && <Chip label={`${fVolume(nft.volume)} XRP Vol`} size="small" variant="filled" sx={{ bgcolor: 'action.selected' }} />}
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

  const { collection, account, date, meta, cslug, NFTokenID, props, total, volume, rarity_rank, files } = nft;

  const { flag, issuer, taxon, transferFee } = useMemo(() => parseNFTokenID(NFTokenID), [NFTokenID]);

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

  const collectionName = useMemo(() => collection || meta?.collection?.name || 'No Collection', [collection, meta]);
  const properties = useMemo(() => props || getProperties(meta), [props, meta]);

  return (
    <Container>
      {/* NFT Preview */}
      <Box sx={{ mb: 1.5, width: '100%' }}>
        <NFTPreviewComponent nft={nft} showDetails={true} />
      </Box>

      {/* Basic Info */}
      <Paper sx={{ p: 1, mb: 1, backgroundColor: alpha(theme.palette.background.paper, 0.5) }}>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Label>Collection</Label>
                {cslug ? (
                  <Link href={`/collection/${cslug}`} underline="hover">
                    <Value sx={{ color: 'primary.main', fontSize: '0.7rem' }}>{collectionName}</Value>
                  </Link>
                ) : (
                  <Value sx={{ fontSize: '0.7rem' }}>{collectionName}</Value>
                )}
              </Box>
              {rarity_rank > 0 && <CompactChip label={`Rank #${rarity_rank}`} size="small" color="primary" variant="outlined" />}
            </Stack>
          </Grid>
          
          {(strDateTime || volume > 0) && (
            <Grid item xs={12}>
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                {strDateTime && (
                  <Stack direction="row" alignItems="center" spacing={0.25}>
                    <CalendarTodayIcon sx={{ fontSize: '0.65rem', color: 'text.secondary' }} />
                    <Value sx={{ fontSize: '0.65rem' }}>{strDateTime}</Value>
                  </Stack>
                )}
                {volume > 0 && (
                  <Stack direction="row" alignItems="center" spacing={0.25}>
                    <Value sx={{ fontSize: '0.65rem' }}>✕ {fVolume(volume)}</Value>
                    <Tooltip title="Traded volume on XRPL">
                      <InfoOutlinedIcon sx={{ fontSize: '0.65rem', color: 'text.secondary' }} />
                    </Tooltip>
                  </Stack>
                )}
              </Stack>
            </Grid>
          )}
        </Grid>
      </Paper>

      <Divider sx={{ mb: 1 }} />

      {/* Properties */}
      {properties && properties.length > 0 && (
        <Paper sx={{ p: 1, mb: 1, backgroundColor: alpha(theme.palette.background.paper, 0.5) }}>
          <SectionTitle>Properties</SectionTitle>
          <Box sx={{ maxHeight: 120, overflowY: 'auto' }}>
            <Properties properties={properties} total={total} />
          </Box>
        </Paper>
      )}

      {/* Description */}
      {meta?.description && (
        <Paper sx={{ p: 1, mb: 1, backgroundColor: alpha(theme.palette.background.paper, 0.5) }}>
          <SectionTitle>Description</SectionTitle>
          <Value sx={{ lineHeight: 1.4, fontSize: '0.7rem', maxHeight: 60, overflowY: 'auto' }}>{meta.description}</Value>
        </Paper>
      )}

      {/* Technical Details */}
      <Paper sx={{ p: 1, backgroundColor: alpha(theme.palette.background.paper, 0.5) }}>
        <SectionTitle>Details</SectionTitle>
        
        <Grid container spacing={0.5}>
          <Grid item xs={12}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Label sx={{ mb: 0 }}>Flags:</Label>
              <Box sx={{ transform: 'scale(0.85)', transformOrigin: 'left' }}>
                <FlagsContainer Flags={flag} />
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Stack spacing={0.5}>
              <Stack direction="row" alignItems="center">
                <Label sx={{ mb: 0, minWidth: 40 }}>Owner:</Label>
                <Link href={`/account/${account}`} underline="hover">
                  <Value sx={{ fontSize: '0.65rem' }}>{`${account.slice(0, 8)}...${account.slice(-6)}`}</Value>
                </Link>
                <CopyToClipboard text={account} onCopy={() => openSnackbar('Copied!', 'success')}>
                  <Tooltip title="Copy">
                    <CopyButton size="small"><ContentCopyIcon /></CopyButton>
                  </Tooltip>
                </CopyToClipboard>
              </Stack>
              
              <Stack direction="row" alignItems="center">
                <Label sx={{ mb: 0, minWidth: 40 }}>Issuer:</Label>
                <Link href={`/account/${issuer}`} underline="hover">
                  <Value sx={{ fontSize: '0.65rem' }}>{`${issuer.slice(0, 8)}...${issuer.slice(-6)}`}</Value>
                </Link>
                <CopyToClipboard text={issuer} onCopy={() => openSnackbar('Copied!', 'success')}>
                  <Tooltip title="Copy">
                    <CopyButton size="small"><ContentCopyIcon /></CopyButton>
                  </Tooltip>
                </CopyToClipboard>
              </Stack>
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
              <Stack direction="row" spacing={0.5}>
                <Label sx={{ mb: 0 }}>Taxon:</Label>
                <Value sx={{ fontSize: '0.65rem' }}>{taxon}</Value>
              </Stack>
              <Stack direction="row" spacing={0.5}>
                <Label sx={{ mb: 0 }}>Fee:</Label>
                <Value sx={{ fontSize: '0.65rem' }}>{transferFee}%</Value>
              </Stack>
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Stack direction="row" alignItems="center" sx={{ mt: 0.5 }}>
              <Label sx={{ mb: 0, minWidth: 60 }}>TokenID:</Label>
              <Link href={`https://livenet.xrpl.org/nfts/${NFTokenID}`} target="_blank" rel="noreferrer noopener nofollow" underline="hover">
                <Value sx={{ fontSize: '0.6rem', color: 'primary.main' }}>{`${NFTokenID.slice(0, 12)}...${NFTokenID.slice(-12)}`}</Value>
              </Link>
            </Stack>
          </Grid>
        </Grid>

        {/* Media Files */}
        {files && files.length > 0 && (
          <Box sx={{ mt: 1, pt: 0.5, borderTop: 1, borderColor: 'divider' }}>
            <Label>Media Files</Label>
            <Box sx={{ maxHeight: 60, overflowY: 'auto' }}>
              {files.map((file, index) => {
                let cachedHref;
                if (file.isIPFS && file.IPFSPinned) {
                  cachedHref = `https://gateway.xrpnft.com/ipfs/${file.IPFSPath}`;
                } else if (!file.isIPFS && file.dfile) {
                  cachedHref = `https://s2.xrpnft.com/d1/${file.dfile}`;
                }

                return (
                  <Stack key={file.type} direction="row" spacing={0.5} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                      {file.type}:
                    </Typography>
                    {/^https?:\/\//.test(file.parsedUrl) ? (
                      <Link href={file.parsedUrl} target="_blank" rel="noreferrer noopener nofollow" underline="hover">
                        <Typography variant="caption" sx={{ fontSize: '0.6rem', wordBreak: 'break-all' }}>
                          {file.parsedUrl.length > 30 ? `${file.parsedUrl.slice(0, 30)}...` : file.parsedUrl}
                        </Typography>
                      </Link>
                    ) : (
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', wordBreak: 'break-all' }}>
                        {file.parsedUrl.length > 30 ? `${file.parsedUrl.slice(0, 30)}...` : file.parsedUrl}
                      </Typography>
                    )}
                    {cachedHref && (
                      <Link href={cachedHref} target="_blank" rel="noreferrer noopener nofollow" underline="hover">
                        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'primary.main' }}>[C]</Typography>
                      </Link>
                    )}
                  </Stack>
                );
              })}
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
});

// Export the NFTPreview as a named export for backward compatibility
export const NFTPreview = NFTPreviewComponent;
export default NFTDetails;