import React, { memo, useMemo, useState, useContext } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
const Swiper = dynamic(() => import('swiper/react').then((mod) => mod.Swiper), { ssr: false });
const SwiperSlide = dynamic(() => import('swiper/react').then((mod) => mod.SwiperSlide), {
  ssr: false
});
import { Navigation, Pagination } from 'swiper/modules';
import Link from 'next/link';

// Icons
import {
  Copy,
  Calendar,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
  Share,
  Loader2
} from 'lucide-react';

// Context
import { AppContext } from 'src/AppContext';

// Utils
import { cn } from 'src/utils/cn';

// More Utils
import { fVolume, fNumber } from 'src/utils/formatters';
import { convertHexToString, parseNFTokenID, getNftFilesUrls } from 'src/utils/parseUtils';

// Components
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

// Arrow component for carousel navigation
function Arrow(props) {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 p-2 rounded-lg",
        props.left ? "left-2" : "right-2",
        "text-white bg-black/50 hover:bg-black/70",
        "disabled:opacity-30 disabled:cursor-not-allowed"
      )}
    >
      {props.left ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
    </button>
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

// No styled components needed - using Tailwind

// NFT Preview Component (embedded)
const NFTPreviewComponent = memo(function NFTPreviewComponent({ nft, showDetails = false }) {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
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

  // Check if loading from IPFS
  const isIPFS =
    clUrl[contentTab]?.includes('ipfs.io') ||
    (typeof imgOrAnimUrl === 'string' && imgOrAnimUrl?.includes('ipfs.io'));

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
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/70">
          <span className={cn("text-[13px]", isDark ? "text-gray-400" : "text-gray-600")}>
            Image unavailable
          </span>
        </div>
      );
    } else if (!loaded) {
      return (
        <div className="text-center py-5">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      );
    }
  };

  const renderImageLink = (file) => {
    const cdn = 'https://s1.xrpl.to/nft/';

    // Full size image for modal (IPFS or cachedUrl)
    const fullSizeUrl = typeof file === 'string'
      ? file
      : file.cachedUrl
        || (file.IPFSPath ? (() => {
            const pathParts = file.IPFSPath.split('/');
            const encodedPath = pathParts.map(encodeURIComponent).join('/');
            return `https://ipfs.io/ipfs/${encodedPath}`;
          })() : null)
        || file.dfile
        || file.convertedFile;

    // Thumbnail for display (large 768x768 preferred)
    const thumbnailUrl = typeof file === 'string'
      ? file
      : file.thumbnail?.large
        ? cdn + file.thumbnail.large
        : file.thumbnail?.medium
          ? cdn + file.thumbnail.medium
          : file.thumbnail?.small
            ? cdn + file.thumbnail.small
            : fullSizeUrl;

    return (
      <div
        onClick={() => !errored && handleOpenImage(fullSizeUrl)}
        className={cn(
          "w-full h-full flex items-center justify-center relative",
          errored ? "cursor-default" : "cursor-pointer"
        )}
      >
        {loadingImage()}
        <img
          className={cn("absolute top-0 left-0 w-full h-full object-contain", loaded ? "block" : "hidden")}
          onLoad={() => {
            setLoaded(true);
            setErrored(false);
          }}
          onError={() => setErrored(true)}
          src={thumbnailUrl}
          alt={NFTName}
          fetchpriority={thumbnailUrl?.includes('ipfs.io') ? 'low' : 'auto'}
        />
      </div>
    );
  };

  return (
    <div className={cn("rounded-xl overflow-hidden w-full", isDark ? "bg-white/[0.02]" : "bg-gray-50")}>

      {/* Tabs */}
      {contentTabList.length > 1 && (
        <div className={cn("px-4 pb-2 border-b-[1.5px]", isDark ? "border-white/10" : "border-gray-200")}>
          <Tabs tabList={contentTabList} tab={contentTab} setTab={setContentTab} name="content" />
        </div>
      )}

      {/* Media */}
      <div className={cn("relative w-full aspect-square flex items-center justify-center overflow-hidden", isDark ? "bg-gray-900" : "bg-gray-100")}>
        {/* IPFS Debug Badge */}
        {isIPFS && (
          <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded bg-orange-500/90 text-white text-[11px] font-medium">
            IPFS
          </div>
        )}

        {((imageUrl && contentTab === 'image') || (animationUrl && contentTab === 'animation')) && (
          <>
            {renderImageLink(typeof imgOrAnimUrl === 'string' ? imgOrAnimUrl : imgOrAnimUrl[0])}
            {openImage && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                onClick={() => setOpenImage(false)}
              >
                <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
                  <img
                    src={selectedImageUrl}
                    alt={NFTName}
                    className="max-w-[90vw] max-h-[90vh] object-contain"
                    fetchpriority={selectedImageUrl?.includes('ipfs.io') ? 'low' : 'auto'}
                  />
                  <button
                    onClick={() => setOpenImage(false)}
                    className="absolute top-2 right-2 p-2 text-white hover:bg-white/20 rounded-lg"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {videoUrl && contentTab === 'video' && (
          <div className="p-4">
            <video
              playsInline
              muted
              autoPlay
              loop
              controls
              className="w-full h-full max-h-full object-contain"
            >
              <source src={videoUrl[currentSlide]?.cachedUrl} type="video/mp4" />
            </video>
          </div>
        )}
      </div>

      {/* Footer */}
      {showDetails && (
        <div className={cn("p-4 border-t-[1.5px]", isDark ? "border-white/10 bg-black" : "border-gray-200 bg-white")}>
          <div className="flex justify-between items-center gap-4">
            <div className="flex gap-4">
              {nft?.transferFee && (
                <span className={cn("rounded px-2 py-0.5 text-[11px] font-normal", isDark ? "bg-white/10" : "bg-gray-200")}>
                  {(nft.transferFee / 1000).toFixed(1)}% Fee
                </span>
              )}
              {nft?.volume > 0 && (
                <span className={cn("rounded px-2 py-0.5 text-[11px] font-normal", isDark ? "bg-white/10" : "bg-gray-200")}>
                  {fVolume(nft.volume)} XRP Vol
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// Main NFTDetails Component
const NFTDetails = memo(function NFTDetails({ nft }) {
  const { openSnackbar } = useContext(AppContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleCopy = (text, label) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        openSnackbar(`${label} copied`, 'success');
      }).catch(() => {
        openSnackbar('Failed to copy', 'error');
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        openSnackbar(`${label} copied`, 'success');
      } catch (err) {
        openSnackbar('Failed to copy', 'error');
      }
      document.body.removeChild(textArea);
    }
  };

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
        <Typography variant="h6" sx={{ fontSize: '15px', fontWeight: 400, mb: 0.3 }}>
          {nft.name || meta?.name || 'Untitled'}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          {cslug && (
            <Link href={`/collection/${cslug}`} underline="none" color="inherit">
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
                        fontWeight: 400
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
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.2 }}>
                <Label>Owner</Label>
                <IconButton onClick={() => handleCopy(account, 'Owner')} size="small" sx={{ p: 0.3 }}>
                  <ContentCopyIcon sx={{ fontSize: '0.7rem' }} />
                </IconButton>
              </Stack>
              <Link href={`/profile/${account}`} underline="none" color="inherit">
                <Value sx={{ fontSize: '13px', wordBreak: 'break-all', maxWidth: '100%', overflowWrap: 'break-word' }}>{account}</Value>
              </Link>
            </Box>
            <Box>
              <Label sx={{ mb: 0.2 }}>Royalties</Label>
              <Value sx={{ fontSize: '11px' }}>{transferFee}%</Value>
            </Box>
          </Stack>

          <Box>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.2 }}>
              <Label>Issuer</Label>
              <IconButton onClick={() => handleCopy(issuer, 'Issuer')} size="small" sx={{ p: 0.3 }}>
                <ContentCopyIcon sx={{ fontSize: '0.7rem' }} />
              </IconButton>
            </Stack>
            <Link href={`/profile/${issuer}`} underline="none" color="inherit">
              <Value sx={{ fontSize: '13px', wordBreak: 'break-all', maxWidth: '100%', overflowWrap: 'break-word' }}>{issuer}</Value>
            </Link>
          </Box>

          <Box>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.2 }}>
              <Label>Token ID</Label>
              <IconButton onClick={() => handleCopy(NFTokenID, 'Token ID')} size="small" sx={{ p: 0.3 }}>
                <ContentCopyIcon sx={{ fontSize: '0.7rem' }} />
              </IconButton>
            </Stack>
            <Link href={`https://livenet.xrpl.org/nfts/${NFTokenID}`} target="_blank" underline="none" color="inherit">
              <Value sx={{ fontSize: '0.7rem', wordBreak: 'break-all', lineHeight: 1.2, maxWidth: '100%', overflowWrap: 'break-word' }}>{NFTokenID}</Value>
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
