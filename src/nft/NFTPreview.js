import * as React from 'react';
import { Lightbox } from 'react-modal-image';
import { useState, useContext } from 'react';
import { AppContext } from 'src/AppContext';
import Head from 'next/head';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';

//import { useTranslation } from 'next-i18next'
function t(key) {
  let val = '';
  switch (key) {
    case 'general.loading':
      'image';
      val = 'Loading...';
      break;
    case 'general.load-failed':
      val = 'Failed to load';
      break;
    case 'general.no-uri':
      val = 'No URI specified';
      break;
    case 'general.no-image':
      val = 'No media found';
      break;
    case 'tabs.image':
      val = 'Image';
      break;
    case 'tabs.video':
      val = 'Video';
      break;
    case 'tabs.animation':
      val = 'Animation';
      break;
    case 'tabs.audio':
      val = 'Audio';
      break;
    case 'tabs.model':
      val = '3D model';
      break;
    case 'tabs.viewer':
      val = 'Viewer';
      break;
    case 'general.viewer':
      val = 'Viewer';
      break;
  }
  return val;
}
//import { stripText } from "../utils" // for model

import Tabs from './Tabs';

// Material
import { Card, CardMedia, Link, Typography, Box, IconButton, Modal, Backdrop, Tooltip, Stack, Chip, Avatar } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Icon } from '@iconify/react';
import { styled } from '@mui/material/styles';

// Utils
import { getNftFilesUrls /*, nftName*/ } from 'src/utils/parse/utils';
import { fVolume } from 'src/utils/formatNumber';

export default function NFTPreview({ nft, showDetails = false }) {
  const { darkMode } = useContext(AppContext);
  const noImg = '/static/nft_no_image.webp';
  //const imgUrl = getImgUrl(nft/*, 480*/) || noImg;
  //const ipfsImgUrl = getImgUrl(nft) || noImg; //getImgUrl(NFTokenID, meta) // TODO: check if all ok as required dfile, size missing
  //const isVideo = nft.meta?.video?true:false;

  // slider
  const [loadedSlider, setLoadedSlider] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
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
  function Arrow(props) {
    const disabled = props.disabled ? ' arrow--disabled' : '';
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
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.7)'
          }
        }}
      >
        {props.left ? <ArrowBackIosNewIcon /> : <ArrowForwardIosIcon />}
      </IconButton>
    );
  }

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

  // const imgUrl = '/static/test.mp4';
  // const isVideo = true;

  const [openImage, setOpenImage] = useState(false);
  const [openAnimation, setOpenAnimation] = useState(false);

  const closeLightboxImage = () => {
    setOpenImage(false);
  };
  /*const closeLightboxAnimation = () => {
        setOpenAnimation(false);
    }*/

  //const nftName = nft.meta?.name || nft.meta?.Name || "No Name";

  //const [contentTab, setContentTab] = useState("image")
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const style = {
    textAlign: 'center',
    marginTop: '40px',
    marginBottom: '20px',
    marginLeft: '18px'
  };

  const loadingImage = () => {
    if (errored) {
      return (
        <div style={style}>
          {t('general.load-failed')}
          <br />
        </div>
      );
    } else if (!loaded) {
      return (
        <div style={style}>
          <span className="waiting"></span>
          <br />
          {t('general.loading')}
        </div>
      );
    }
  };

  let imageUrl = getNftFilesUrls(nft, 'image'); //console.log('imageUrl before', imageUrl)
  const animationUrl = getNftFilesUrls(nft, 'animation'); //console.log('animationUrl before', animationUrl)
  const videoUrl = getNftFilesUrls(nft, 'video'); //console.log('videoUrl before', videoUrl)
  const audioUrl = getNftFilesUrls(nft, 'audio');
  const modelUrl = getNftFilesUrls(nft, 'model');
  const viewerUrl = getNftFilesUrls(nft, 'viewer');

  const [contentTab, setContentTab] = useState(
    videoUrl ? 'video' : animationUrl ? 'animation' : 'image'
  );

  let modelState = null;

  const clUrl = {
    image: imageUrl?.[currentSlide]?.cachedUrl,
    animation: animationUrl?.[currentSlide]?.cachedUrl,
    video: videoUrl?.[currentSlide]?.cachedUrl,
    audio: audioUrl?.[currentSlide]?.cachedUrl,
    model: modelUrl?.[currentSlide]?.cachedUrl
  };
  const contentTabList = [];
  if (videoUrl) {
    contentTabList.push({ value: 'video', label: t('tabs.video') });
  }
  if (animationUrl) {
    contentTabList.push({ value: 'animation', label: t('tabs.animation') });
  }
  if (imageUrl) {
    contentTabList.push({ value: 'image', label: t('tabs.image') });
  }
  if (modelUrl) {
    contentTabList.push({ value: 'model', label: t('tabs.model') });
  }

  if (!contentTabList.length) {
    contentTabList.push({ value: 'image', label: t('tabs.image') });
    imageUrl = noImg;
  }

  const imgOrAnimUrl =
    contentTab === 'image' ? imageUrl : contentTab === 'animation' ? animationUrl : '';

  //console.log('imageUrl after', imageUrl, 'imgOrAnimUrl', imgOrAnimUrl)

  let imageStyle = { 
    width: '100%', 
    height: '100%', 
    objectFit: 'contain',
    maxWidth: '100%',
    maxHeight: '100%'
  };
  if (imageUrl) {
    if (imageUrl.slice(0, 10) === 'data:image') {
      imageStyle.imageRendering = 'pixelated';
    }
    if (nft.deletedAt) {
      imageStyle.filter = 'grayscale(1)';
    }
  }
  let errorStyle = { marginTop: '40px' };
  let defaultTab = contentTab;
  let defaultUrl = clUrl[contentTab];
  if (!imageUrl && contentTab === 'image') {
    if (clUrl['video']) {
      defaultTab = 'video';
      defaultUrl = clUrl['video'];
    } else if (clUrl['model']) {
      defaultTab = 'model';
      defaultUrl = clUrl['model'];
    }
  }

  //add attributes for the 3D model viewer
  let modelAttr = [];
  if (nft.metadata && (nft.metadata['3D_attributes'] || nft.metadata['3d_attributes'])) {
    modelAttr = nft.metadata['3D_attributes'] || nft.metadata['3d_attributes'];
    const supportedAttr = [
      'environment-image',
      'exposure',
      'shadow-intensity',
      'shadow-softness',
      'camera-orbit',
      'camera-target',
      'skybox-image',
      'auto-rotate-delay',
      'rotation-per-second',
      'field-of-view',
      'max-camera-orbit',
      'min-camera-orbit',
      'max-field-of-view',
      'min-field-of-view',
      'disable-zoom',
      'orbit-sensitivity',
      'animation-name',
      'animation-crossfade-duration',
      'variant-name',
      'orientation',
      'scale'
    ];
    if (Array.isArray(modelAttr)) {
      for (let i = 0; i < modelAttr.length; i++) {
        if (supportedAttr.includes(modelAttr[i].attribute)) {
          modelAttr[i].value = stripText(modelAttr[i].value);
        } else {
          delete modelAttr[i];
        }
      }
    } else if (typeof modelAttr === 'object') {
      let metaModelAttr = modelAttr;
      modelAttr = [];
      Object.keys(metaModelAttr).forEach((e) => {
        if (supportedAttr.includes(e)) {
          modelAttr.push({
            attribute: e,
            value: stripText(metaModelAttr[e])
          });
        }
      });
    }
  }

  const renderImageLink = (file) => (
    <Link
      component="button"
      underline="none"
      onClick={() => handleOpenImage(file.cachedUrl)}
      sx={{ 
        width: '100%', 
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      {loadingImage(nft)}
      <img
        style={{
          ...imageStyle,
          display: loaded ? 'block' : 'none',
          position: 'absolute',
          top: 0,
          left: 0
        }}
        onLoad={() => {
          setLoaded(true);
          setErrored(false);
        }}
        onError={({ currentTarget }) => {
          if (currentTarget.src === imageUrl && imageUrl !== clUrl.image) {
            currentTarget.src = clUrl.image;
          } else {
            setErrored(true);
          }
        }}
        src={
          typeof file === 'string'
            ? file
            : file.thumbnail
              ? 'https://s2.xrpnft.com/d1/' + (file.thumbnail?.big || file.thumbnail?.small)
              : file.cachedUrl
        }
        alt={nft?.name || 'NFT Image'}
      />
    </Link>
  );

  // Styled components
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

  const NFTName = nft?.name || nft?.meta?.name || nft?.meta?.Name || 'Untitled NFT';
  const collectionName = nft?.collection || nft?.meta?.collection?.name || '';
  const ownerAddress = nft?.account || '';
  const rarity = nft?.rarity_rank || null;

  return (
    <>
      <StyledCard>
        {/* Header Section */}
        <Box sx={{ p: 2, pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {NFTName}
              </Typography>
              {collectionName && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar sx={{ width: 20, height: 20 }} src="/static/collection-placeholder.png" />
                  <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {collectionName}
                  </Typography>
                </Stack>
              )}
            </Box>
            <Stack direction="row" spacing={1}>
              {rarity && (
                <Chip 
                  label={`Rank #${rarity}`} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              )}
              <Tooltip title="Share">
                <IconButton size="small" onClick={handleTweetNFT}>
                  <ShareIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>

        {/* Tabs Section */}
        {contentTabList.length > 1 && (
          <Box
            sx={{
              px: 2,
              pb: 1,
              borderBottom: 1,
              borderColor: 'divider'
            }}
          >
            <Tabs
              tabList={contentTabList}
              tab={contentTab}
              setTab={setContentTab}
              name="content"
              sx={{ '& .MuiTab-root': { minWidth: 'auto', py: 1 } }}
            />
          </Box>
        )}

        {/* Media Container */}
        <MediaContainer>
          {((imageUrl && contentTab === 'image') ||
            (animationUrl && contentTab === 'animation')) && (
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
                      <Arrow
                        left
                        onClick={(e) => e.stopPropagation() || instanceRef.current?.prev()}
                        disabled={currentSlide === 0}
                      />

                      <Arrow
                        onClick={(e) => e.stopPropagation() || instanceRef.current?.next()}
                        disabled={
                          currentSlide === instanceRef.current.track.details.slides.length - 1
                        }
                      />
                    </>
                  )}

                  {loadedSlider && instanceRef.current && (
                    <div className="dots">
                      {[...Array(instanceRef.current.track.details.slides.length).keys()].map(
                        (idx) => {
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                instanceRef.current?.moveToIdx(idx);
                              }}
                              className={'dot' + (currentSlide === idx ? ' active' : '')}
                            ></button>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              ) : (
                renderImageLink(typeof imgOrAnimUrl === 'string' ? imgOrAnimUrl : imgOrAnimUrl[0])
              )}
              <Modal
                open={openImage}
                onClose={() => setOpenImage(false)}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                  timeout: 500,
                  sx: {
                    backgroundColor: 'rgba(0, 0, 0, 0.95)'
                  }
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
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
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={selectedImageUrl}
                    alt={nft?.name || 'NFT Image'}
                    style={{
                      maxWidth: '90vw',
                      maxHeight: '90vh',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      display: 'flex',
                      gap: 1
                    }}
                  >
                    <Tooltip title="Share on X">
                      <IconButton
                        onClick={handleTweetNFT}
                        sx={{
                          color: 'white',
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 1)'
                          }
                        }}
                      >
                        <Icon icon="ri:twitter-x-fill" fontSize={20} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Close">
                      <IconButton
                        onClick={() => setOpenImage(false)}
                        sx={{
                          color: 'white',
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.7)'
                          }
                        }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Modal>
            </>
          )}

          {videoUrl && defaultTab === 'video' && (
            <Box sx={{ p: 2 }}>
              <video
                poster={
                  videoUrl[currentSlide].thumbnail
                    ? 'https://s2.xrpnft.com/d1/' +
                      (videoUrl[currentSlide].thumbnail?.big ||
                        videoUrl[currentSlide].thumbnail?.static)
                    : ''
                }
                playsInline
                muted
                loop
                controls
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: 8 
                }}
              >
                <source src={videoUrl[currentSlide]?.cachedUrl} type="video/mp4" />
              </video>
            </Box>
          )}
          {modelUrl && defaultTab === 'model' && (
            <>
              {modelState === 'loading' && (
                <div style={style}>
                  <span className="waiting"></span>
                  <br />
                  {t('general.loading')}
                </div>
              )}
              {modelState !== 'ready' && (
                <>
                  <Head>
                    <script type="module" src="/js/model-viewer.min.js" defer />
                  </Head>
                  <model-viewer
                    className="model-viewer"
                    src={modelUrl[currentSlide]?.cachedUrl}
                    camera-controls
                    auto-rotate
                    ar
                    poster={LoadingGif}
                    autoplay
                    style={{ width: '100%', height: '100%' }}
                    {...modelAttr?.reduce((prev, curr) => {
                      prev[curr.attribute] = curr.value;
                      return prev;
                    }, {})}
                  ></model-viewer>
                </>
              )}
            </>
          )}

          {defaultTab !== 'model' && audioUrl && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <audio
                src={audioUrl[currentSlide]?.cachedUrl}
                controls
                style={{ width: '100%' }}
              ></audio>
            </Box>
          )}
          {viewerUrl && (
            <Box sx={{ p: 2, textAlign: 'right' }}>
              <Link
                href={viewerUrl[currentSlide]?.cachedUrl}
                target="_blank"
                rel="noreferrer"
                sx={{ textDecoration: 'none' }}
              >
                <Typography variant="body2" color="primary">
                  {t('general.viewer')}
                </Typography>
              </Link>
            </Box>
          )}
        </MediaContainer>

        {/* Footer Section - Quick Info */}
        {showDetails && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
              <Stack direction="row" spacing={2}>
                {nft?.transferFee && (
                  <Chip
                    icon={<Icon icon="mdi:percent" />}
                    label={`${(nft.transferFee / 1000).toFixed(1)}% Fee`}
                    size="small"
                    variant="filled"
                    sx={{ bgcolor: 'action.selected' }}
                  />
                )}
                {nft?.volume > 0 && (
                  <Chip
                    icon={<Icon icon="mdi:chart-line" />}
                    label={`${fVolume(nft.volume)} XRP Vol`}
                    size="small"
                    variant="filled"
                    sx={{ bgcolor: 'action.selected' }}
                  />
                )}
              </Stack>
              {ownerAddress && (
                <Typography variant="caption" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>
                  Owner: {ownerAddress.slice(0, 6)}...{ownerAddress.slice(-4)}
                </Typography>
              )}
            </Stack>
          </Box>
        )}
      </StyledCard>
    </>
  );
}
