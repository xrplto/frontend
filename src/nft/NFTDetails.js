import React, { memo, useMemo, useState, useContext, useEffect } from 'react';
import { apiFetch } from 'src/utils/api';
import Link from 'next/link';

// Icons
import {
  Copy,
  Info,
  ImageOff,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Bookmark,
  MessageCircle
} from 'lucide-react';
import { ApiButton, registerApiCalls } from 'src/components/ApiEndpointsModal';

// Context
import { WalletContext, AppContext } from 'src/context/AppContext';

// Utils
import { cn } from 'src/utils/cn';
import { VerificationLabel } from 'src/components/VerificationBadge';

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
  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      aria-label={props.left ? 'Previous image' : 'Next image'}
      className={cn(
        'absolute top-1/2 -translate-y-1/2 p-2 rounded-lg',
        props.left ? 'left-2' : 'right-2',
        'text-white bg-black/50 hover:bg-black/70',
        'disabled:opacity-30 disabled:cursor-not-allowed'
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
    // Handle collection being an object {name, family} or a string
    const rawCol = nft?.collection;
    const collectionName =
      (typeof rawCol === 'string' ? rawCol : rawCol?.name) || nft?.meta?.collection?.name || '';
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
  // Handle collection being an object {name, family} or a string
  const rawCollection = nft?.collection;
  const collectionName =
    (typeof rawCollection === 'string' ? rawCollection : rawCollection?.name) ||
    nft?.meta?.collection?.name ||
    '';
  const rarity = nft?.rarity_rank || null;

  return (
    <div
      className={cn('rounded-xl overflow-hidden w-full', 'bg-gray-50 dark:bg-white/[0.02]')}
    >
      {/* Tabs */}
      {contentTabList.length > 1 && (
        <div
          className={cn(
            'px-4 pb-2 border-b-[1.5px]',
            'border-gray-200 dark:border-white/[0.08]'
          )}
        >
          <Tabs tabList={contentTabList} tab={contentTab} setTab={setContentTab} name="content" />
        </div>
      )}

      {/* Media */}
      <div className={cn('relative w-full min-h-[280px] sm:min-h-[400px]', 'bg-gray-100 dark:bg-gray-900')}>
        {/* Burned Badge */}
        {nft?.is_burned && (
          <div className="absolute top-2 right-2 z-10 px-2.5 py-1 rounded-lg bg-red-500/90 text-white text-[11px] font-semibold uppercase tracking-wide">
            Burned
          </div>
        )}
        {/* IPFS Debug Badge */}
        {isIPFS && (
          <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded bg-orange-500/90 text-white text-[11px] font-medium">
            IPFS
          </div>
        )}

        {((imageUrl && contentTab === 'image') || (animationUrl && contentTab === 'animation')) && (
          <>
            <div className="w-full relative">
              {!loaded && !errored && (
                <div
                  className={cn(
                    'absolute inset-0 flex items-center justify-center',
                    'bg-gray-100 dark:bg-white/[0.04]'
                  )}
                >
                  <Loader2
                    size={22}
                    strokeWidth={1.5}
                    className="animate-spin text-[#94A3B8] dark:text-[#4B5563]"
                  />
                </div>
              )}
              <img
                width={600}
                height={600}
                fetchPriority="high"
                decoding="sync"
                className={cn(
                  'w-full h-auto max-h-[70vh] object-contain mx-auto cursor-pointer transition-[transform] duration-300',
                  'hover:scale-[1.02]',
                  errored && 'hidden'
                )}
                onLoad={() => {
                  setLoaded(true);
                  setErrored(false);
                }}
                onError={() => setErrored(true)}
                onClick={() => {
                  const file = typeof imgOrAnimUrl === 'string' ? imgOrAnimUrl : imgOrAnimUrl[0];
                  const cdn = 'https://s1.xrpl.to/nft/';
                  const fullSizeUrl =
                    typeof file === 'string'
                      ? file
                      : file.cachedUrl ||
                        (file.IPFSPath
                          ? `https://ipfs.io/ipfs/${file.IPFSPath.split('/').map(encodeURIComponent).join('/')}`
                          : null) ||
                        file.dfile ||
                        file.convertedFile;
                  if (!errored && fullSizeUrl) handleOpenImage(fullSizeUrl);
                }}
                src={(() => {
                  const file = typeof imgOrAnimUrl === 'string' ? imgOrAnimUrl : imgOrAnimUrl[0];
                  const cdn = 'https://s1.xrpl.to/nft/';
                  if (typeof file === 'string') return file;
                  return file?.thumbnail?.large
                    ? cdn + file.thumbnail.large
                    : file?.thumbnail?.medium
                      ? cdn + file.thumbnail.medium
                      : file?.thumbnail?.small
                        ? cdn + file.thumbnail.small
                        : file?.cachedUrl || file?.dfile || file?.convertedFile;
                })()}
                alt={NFTName}
              />
              {errored && (
                <div
                  className={cn(
                    'flex flex-col items-center justify-center aspect-square max-h-[70vh] gap-3',
                    'bg-gray-100 text-gray-500 dark:bg-white/[0.04] dark:text-gray-400'
                  )}
                >
                  <ImageOff size={48} strokeWidth={1.2} />
                  <span className="text-sm font-medium">Image Unavailable</span>
                  <span className={cn('text-xs', 'text-gray-400 dark:text-gray-600')}>
                    Media source is offline
                  </span>
                </div>
              )}
            </div>
            {openImage && (
              <div
                className={cn(
                  'fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md max-sm:h-dvh',
                  'bg-black/70 dark:bg-black/80'
                )}
                role="dialog"
                aria-modal="true"
                aria-label="Full size image"
                onClick={() => setOpenImage(false)}
              >
                <div className="relative max-w-[95vw] max-h-[95dvh] flex items-center justify-center">
                  <img
                    src={selectedImageUrl}
                    alt={NFTName}
                    className="max-w-[95vw] max-h-[95dvh] object-contain"
                    fetchpriority={selectedImageUrl?.includes('ipfs.io') ? 'low' : 'auto'}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenImage(false);
                    }}
                    aria-label="Close full size image"
                    className="absolute top-4 right-4 p-2 text-white bg-black/60 hover:bg-black/80 rounded-full backdrop-blur-sm outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {videoUrl && contentTab === 'video' && (
          <div className="w-full">
            <video
              playsInline
              muted
              autoPlay
              loop
              controls
              className="w-full h-auto max-h-[70vh] object-contain"
            >
              <source src={videoUrl[currentSlide]?.cachedUrl} type="video/mp4" />
            </video>
          </div>
        )}
      </div>

      {/* Footer */}
      {showDetails && (
        <div
          className={cn(
            'p-4 border-t-[1.5px]',
            'border-gray-200 bg-white dark:border-white/[0.08] dark:bg-black'
          )}
        >
          <div className="flex justify-between items-center gap-4">
            <div className="flex gap-4">
              {nft?.transferFee && (
                <span
                  className={cn(
                    'rounded px-2 py-0.5 text-[11px] font-normal',
                    'bg-gray-200 dark:bg-white/10'
                  )}
                >
                  {(nft.transferFee / 1000).toFixed(1)}% Fee
                </span>
              )}
              {nft?.volume > 0 && (
                <span
                  className={cn(
                    'rounded px-2 py-0.5 text-[11px] font-normal',
                    'bg-gray-200 dark:bg-white/10'
                  )}
                >
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
  const { accountProfile, setOpenWalletModal } = useContext(WalletContext);
  const { openSnackbar } = useContext(AppContext);
  const accountLogin = accountProfile?.account;
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  // Register server-side API calls
  useEffect(() => {
    if (nft?.NFTokenID) {
      registerApiCalls([`https://api.xrpl.to/v1/nft/${nft.NFTokenID}`]);
    }
  }, [nft?.NFTokenID]);

  // Check if NFT is in watchlist
  React.useEffect(() => {
    if (!accountLogin || !nft?.NFTokenID) return;
    apiFetch(`https://api.xrpl.to/v1/watchlist/nft?account=${accountLogin}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data.watchlist) {
          const allItems = Object.values(data.watchlist).flatMap((col) => col.items || []);
          setIsSaved(allItems.some((item) => item.nftokenId === nft.NFTokenID));
        }
      })
      .catch(err => { console.warn('[NFTDetails] NFT watchlist check failed:', err.message); });
  }, [accountLogin, nft?.NFTokenID]);

  const handleSave = async () => {
    if (!accountLogin) {
      setOpenWalletModal(true);
      return;
    }
    setSaveLoading(true);
    try {
      const action = isSaved ? 'remove' : 'add';
      const res = await apiFetch('https://api.xrpl.to/v1/watchlist/nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: accountLogin,
          nftokenId: nft?.NFTokenID,
          action
        })
      });
      const data = await res.json();
      if (data?.success) {
        setIsSaved(!isSaved);
        openSnackbar(isSaved ? 'Removed from watchlist' : 'Added to watchlist', 'success');
      } else {
        openSnackbar(data?.message || 'Failed to update', 'error');
      }
    } catch (e) {
      openSnackbar('Failed to update watchlist', 'error');
    }
    setSaveLoading(false);
  };

  const handleCopy = (text, label) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          openSnackbar(`${label} copied`, 'success');
        })
        .catch(() => {
          openSnackbar('Failed to copy', 'error');
        });
    } else {
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
    royalty,
    MasterSequence
  } = nft;

  const { issuer } = useMemo(() => parseNFTokenID(NFTokenID), [NFTokenID]);
  const transferFee = royalty ? (royalty / 1000).toFixed(1) : 0;

  // Handle collection being an object {name, family} or a string
  const collectionName = useMemo(
    () =>
      (typeof collection === 'string' ? collection : collection?.name) ||
      meta?.collection?.name ||
      'No Collection',
    [collection, meta]
  );
  const properties = useMemo(() => props || getProperties(meta), [props, meta]);

  return (
    <div className="flex flex-col w-full">
      {/* NFT Preview */}
      <div className="mb-2 sm:mb-3 w-full">
        <NFTPreviewComponent nft={nft} showDetails={false} />
      </div>

      {/* Burned Status Banner */}
      {nft.is_burned && (
        <div
          className={cn(
            'mb-2 sm:mb-3 px-3 py-2 sm:px-4 sm:py-3 rounded-xl border-[1.5px] flex items-center gap-2 sm:gap-3',
            'border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10'
          )}
        >
          <Info size={16} className="text-red-400 shrink-0 sm:w-[18px] sm:h-[18px]" />
          <p className={cn('text-xs sm:text-sm font-medium', 'text-red-600 dark:text-red-400')}>
            This NFT has been burned and no longer exists on the XRPL.
          </p>
        </div>
      )}

      {/* Title and Collection */}
      <div
        className={cn(
          'mb-2 sm:mb-4 p-3 sm:p-4 rounded-xl border-[1.5px]',
          'border-gray-200 dark:border-white/[0.08]'
        )}
      >
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex-1 min-w-0 flex items-baseline gap-2 sm:gap-2.5">
            <h1
              className={cn(
                'text-base sm:text-xl font-semibold tracking-tight truncate shrink',
                'text-gray-900 dark:text-white'
              )}
            >
              {nft.name || meta?.name || 'Untitled'}
            </h1>
            {cslug && (
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href={`/nfts/${cslug}`}
                  className={cn(
                    'text-[10px] sm:text-[12px] font-medium uppercase tracking-wider hover:text-primary whitespace-nowrap',
                    'text-primary/80 dark:text-primary'
                  )}
                >
                  {collectionName}
                </Link>
                {(() => {
                  const v = nft.collectionVerified >= 1 ? nft.collectionVerified
                    : (typeof collection === 'object' && collection?.verified >= 1) ? collection.verified
                    : 0;
                  return <VerificationLabel verified={v} />;
                })()}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ApiButton />
            <button
              onClick={handleSave}
              disabled={saveLoading}
              aria-label={isSaved ? 'Remove from watchlist' : 'Add to watchlist'}
              className={cn(
                'flex-shrink-0 h-[26px] w-[26px] sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-lg border-[1.5px] transition-[border-color,background-color]',
                'outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                isSaved
                  ? 'border-primary bg-primary/15 text-primary shadow-[0_0_12px_rgba(66,133,244,0.25)]'
                  : 'border-gray-200 text-gray-400 hover:border-primary/50 hover:text-primary hover:bg-primary/5 dark:border-white/10 dark:text-white/60 dark:hover:border-primary/50 dark:hover:text-primary dark:hover:bg-primary/5',
                saveLoading && 'opacity-50 cursor-not-allowed'
              )}
              title={isSaved ? 'Remove from watchlist' : 'Add to watchlist'}
            >
              {saveLoading ? (
                <Loader2 size={16} className="animate-spin sm:w-[18px] sm:h-[18px]" />
              ) : (
                <Bookmark size={16} className="sm:w-[18px] sm:h-[18px]" fill={isSaved ? 'currentColor' : 'none'} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Properties */}
      {properties && properties.length > 0 && (
        <div
          className={cn(
            'p-2.5 sm:p-3 mb-2 sm:mb-3 rounded-xl border',
            'border-gray-200 dark:border-white/[0.08]'
          )}
        >
          <p
            className={cn(
              'text-[10px] sm:text-[11px] font-medium uppercase tracking-wider mb-1.5 sm:mb-2',
              'text-gray-400 dark:text-white/60'
            )}
          >
            Properties
          </p>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {properties.map((item) => {
              const type = item.type || item.trait_type;
              const value = item.value;
              const count = item.count || 0;
              const rarity = total > 0 && count > 0 ? ((count * 100) / total).toFixed(2) : 0;

              return (
                <Link
                  key={`${type}-${value}`}
                  href={
                    cslug ? `/nfts/${cslug}?traits=${encodeURIComponent(`${type}:${value}`)}` : '#'
                  }
                  className={cn(
                    'group p-1.5 sm:p-2.5 text-center rounded-lg border cursor-pointer transition-[border-color,background-color] duration-200 active:scale-[0.97]',
                    'border-gray-200 bg-gray-50 hover:border-primary/50 hover:bg-primary/5',
                    'dark:border-white/[0.08] dark:bg-white/[0.02] dark:hover:border-primary/50 dark:hover:bg-primary/10'
                  )}
                >
                  <p
                    className={cn(
                      'text-[9px] sm:text-[10px] uppercase tracking-wide mb-0.5',
                      'text-gray-500 group-hover:text-primary dark:text-white/60 dark:group-hover:text-primary truncate'
                    )}
                  >
                    {type}
                  </p>
                  <p
                    className={cn(
                      'text-[11px] sm:text-[13px] font-normal',
                      'text-gray-900 group-hover:text-primary dark:text-white dark:group-hover:text-primary truncate'
                    )}
                  >
                    {value}
                  </p>
                  {total > 0 && count > 0 && (
                    <p className={cn('text-[10px] sm:text-[11px] mt-0.5 text-primary')}>
                      {rarity}%
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Description - hide if it just matches collection name */}
      {meta?.description &&
        meta.description !== collection &&
        meta.description !== collectionName && (
          <div
            className={cn(
              'p-2.5 sm:p-3 mb-2 sm:mb-3 rounded-xl border',
              'border-gray-200 dark:border-white/[0.08]'
            )}
          >
            <p
              className={cn(
                'text-[10px] sm:text-[11px] font-medium uppercase tracking-wider mb-1',
                'text-gray-400 dark:text-white/60'
              )}
            >
              Description
            </p>
            <p
              className={cn(
                'text-[12px] sm:text-[13px] leading-relaxed',
                'text-gray-600 dark:text-gray-300'
              )}
            >
              {meta.description}
            </p>
          </div>
        )}

      {/* Stats */}
      {(rarity_rank > 0 || MasterSequence > 0 || volume > 0) && (
        <div
          className={cn(
            'p-2.5 sm:p-3 mb-2 sm:mb-3 rounded-xl border',
            'border-gray-200 dark:border-white/[0.08]'
          )}
        >
          <div className="flex justify-between">
            {rarity_rank > 0 && (
              <div className="text-left">
                <p
                  className={cn(
                    'text-[9px] sm:text-[10px] font-medium uppercase tracking-wider mb-0.5',
                    'text-gray-400 dark:text-white/60'
                  )}
                >
                  Rarity
                </p>
                <p
                  className={cn(
                    'text-sm sm:text-base font-semibold tabular-nums',
                    'text-gray-900 dark:text-white'
                  )}
                >
                  #{rarity_rank}
                </p>
              </div>
            )}
            {MasterSequence > 0 && (
              <div className="text-center">
                <p
                  className={cn(
                    'text-[9px] sm:text-[10px] font-medium uppercase tracking-wider mb-0.5',
                    'text-gray-400 dark:text-white/60'
                  )}
                >
                  On-Chain
                </p>
                <p
                  className={cn(
                    'text-sm sm:text-base font-semibold tabular-nums',
                    'text-gray-900 dark:text-white'
                  )}
                >
                  #{MasterSequence}
                </p>
              </div>
            )}
            {volume > 0 && (
              <div className="text-right">
                <p
                  className={cn(
                    'text-[9px] sm:text-[10px] font-medium uppercase tracking-wider mb-0.5',
                    'text-gray-400 dark:text-white/60'
                  )}
                >
                  Volume
                </p>
                <p
                  className={cn(
                    'text-sm sm:text-base font-semibold tabular-nums',
                    'text-gray-900 dark:text-white'
                  )}
                >
                  {fVolume(volume)} XRP
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Technical Details */}
      <div
        className={cn(
          'p-2.5 sm:p-3 mb-3 sm:mb-4 rounded-xl border-[1.5px]',
          'border-gray-200 dark:border-white/[0.08]'
        )}
      >
        <div className="space-y-2 sm:space-y-3">
          {/* Owner + Royalties row */}
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    'text-[9px] sm:text-[10px] font-medium uppercase tracking-wider',
                    'text-gray-400 dark:text-white/60'
                  )}
                >
                  Owner
                </span>
                <button
                  onClick={() => handleCopy(account, 'Owner')}
                  aria-label="Copy owner address"
                  className={cn(
                    'min-w-[20px] min-h-[20px] sm:min-w-[24px] sm:min-h-[24px] inline-flex items-center justify-center rounded hover:bg-white/10 transition-[background-color] outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                    'text-gray-400 hover:text-gray-900 dark:text-white/60 dark:hover:text-white'
                  )}
                >
                  <Copy size={11} />
                </button>
                {account !== accountLogin && (
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('openDm', { detail: { user: account, nftId: NFTokenID } }))}
                    aria-label="Message owner"
                    className={cn(
                      'min-w-[20px] min-h-[20px] sm:min-w-[24px] sm:min-h-[24px] inline-flex items-center justify-center rounded hover:bg-white/10 transition-[background-color] outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                      'text-gray-400 hover:text-[#650CD4] dark:text-white/60 dark:hover:text-[#650CD4]'
                    )}
                  >
                    <MessageCircle size={11} />
                  </button>
                )}
              </div>
              <Link
                href={`/address/${account}`}
                className={cn(
                  'text-[11px] sm:text-[12px] font-mono break-all min-h-[20px] inline-flex items-center hover:text-primary transition-[background-color]',
                  'text-gray-700 dark:text-gray-300'
                )}
              >
                {account}
              </Link>
            </div>
            <div className="text-right shrink-0">
              <p
                className={cn(
                  'text-[9px] sm:text-[10px] font-medium uppercase tracking-wider mb-0.5',
                  'text-gray-400 dark:text-white/60'
                )}
              >
                Royalties
              </p>
              <p
                className={cn(
                  'text-xs sm:text-sm font-semibold',
                  'text-primary dark:text-primary dark:drop-shadow-[0_0_8px_rgba(66,133,244,0.3)]'
                )}
              >
                {transferFee}%
              </p>
            </div>
          </div>

          {/* Issuer */}
          <div>
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  'text-[9px] sm:text-[10px] font-medium uppercase tracking-wider',
                  'text-gray-400 dark:text-white/60'
                )}
              >
                Issuer
              </span>
              <button
                onClick={() => handleCopy(issuer, 'Issuer')}
                aria-label="Copy issuer address"
                className={cn(
                  'min-w-[20px] min-h-[20px] sm:min-w-[24px] sm:min-h-[24px] inline-flex items-center justify-center rounded hover:bg-white/10 transition-[background-color] outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                  'text-gray-400 hover:text-gray-900 dark:text-white/60 dark:hover:text-white'
                )}
              >
                <Copy size={11} />
              </button>
              {issuer !== accountLogin && (
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('openDm', { detail: { user: issuer } }))}
                  aria-label="Message issuer"
                  className={cn(
                    'min-w-[20px] min-h-[20px] sm:min-w-[24px] sm:min-h-[24px] inline-flex items-center justify-center rounded hover:bg-white/10 transition-[background-color] outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                    'text-gray-400 hover:text-[#650CD4] dark:text-white/60 dark:hover:text-[#650CD4]'
                  )}
                  title="Chat with issuer"
                >
                  <MessageCircle size={11} />
                </button>
              )}
            </div>
            <Link
              href={`/address/${issuer}`}
              className={cn(
                'text-[11px] sm:text-[12px] font-mono break-all min-h-[20px] inline-flex items-center hover:text-primary transition-[background-color]',
                'text-gray-700 dark:text-gray-300'
              )}
            >
              {issuer}
            </Link>
          </div>

          {/* Token ID */}
          <div>
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  'text-[9px] sm:text-[10px] font-medium uppercase tracking-wider',
                  'text-gray-400 dark:text-white/60'
                )}
              >
                Token ID
              </span>
              <button
                onClick={() => handleCopy(NFTokenID, 'Token ID')}
                aria-label="Copy token ID"
                className={cn(
                  'min-w-[20px] min-h-[20px] sm:min-w-[24px] sm:min-h-[24px] inline-flex items-center justify-center rounded hover:bg-white/10 transition-[background-color] outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                  'text-gray-400 hover:text-gray-900 dark:text-white/60 dark:hover:text-white'
                )}
              >
                <Copy size={11} />
              </button>
            </div>
            <a
              href={`https://livenet.xrpl.org/nfts/${NFTokenID}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'text-[10px] sm:text-[11px] font-mono break-all min-h-[20px] inline-flex items-center hover:text-primary transition-[background-color]',
                'text-gray-500 dark:text-gray-400'
              )}
            >
              {NFTokenID}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
});

// Export the NFTPreview as a named export for backward compatibility
export const NFTPreview = NFTPreviewComponent;
export default NFTDetails;
