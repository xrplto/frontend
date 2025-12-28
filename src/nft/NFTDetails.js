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
  Loader2,
  Star
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
    // Handle collection being an object {name, family} or a string
    const rawCol = nft?.collection;
    const collectionName = (typeof rawCol === 'string' ? rawCol : rawCol?.name) || nft?.meta?.collection?.name || '';
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
  const collectionName = (typeof rawCollection === 'string' ? rawCollection : rawCollection?.name) || nft?.meta?.collection?.name || '';
  const rarity = nft?.rarity_rank || null;

  return (
    <div className={cn("rounded-xl overflow-hidden w-full", isDark ? "bg-white/[0.02]" : "bg-gray-50")}>

      {/* Tabs */}
      {contentTabList.length > 1 && (
        <div className={cn("px-4 pb-2 border-b-[1.5px]", isDark ? "border-white/[0.08]" : "border-gray-200")}>
          <Tabs tabList={contentTabList} tab={contentTab} setTab={setContentTab} name="content" />
        </div>
      )}

      {/* Media */}
      <div className={cn("relative w-full", isDark ? "bg-gray-900" : "bg-gray-100")}>
        {/* IPFS Debug Badge */}
        {isIPFS && (
          <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded bg-orange-500/90 text-white text-[11px] font-medium">
            IPFS
          </div>
        )}

        {((imageUrl && contentTab === 'image') || (animationUrl && contentTab === 'animation')) && (
          <>
            <div className="w-full">
              <img
                className={cn(
                  "w-full h-auto max-h-[70vh] object-contain mx-auto cursor-pointer transition-transform hover:scale-[1.02]",
                  loaded ? "block" : "hidden"
                )}
                onLoad={() => {
                  setLoaded(true);
                  setErrored(false);
                }}
                onError={() => setErrored(true)}
                onClick={() => {
                  const file = typeof imgOrAnimUrl === 'string' ? imgOrAnimUrl : imgOrAnimUrl[0];
                  const cdn = 'https://s1.xrpl.to/nft/';
                  const fullSizeUrl = typeof file === 'string'
                    ? file
                    : file.cachedUrl
                      || (file.IPFSPath ? `https://ipfs.io/ipfs/${file.IPFSPath.split('/').map(encodeURIComponent).join('/')}` : null)
                      || file.dfile
                      || file.convertedFile;
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
              {!loaded && !errored && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              )}
              {errored && (
                <div className="flex items-center justify-center py-20">
                  <span className={cn("text-[13px]", isDark ? "text-gray-400" : "text-gray-600")}>
                    Image unavailable
                  </span>
                </div>
              )}
            </div>
            {openImage && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
                onClick={() => setOpenImage(false)}
              >
                <div className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center">
                  <img
                    src={selectedImageUrl}
                    alt={NFTName}
                    className="max-w-[95vw] max-h-[95vh] object-contain"
                    fetchpriority={selectedImageUrl?.includes('ipfs.io') ? 'low' : 'auto'}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenImage(false); }}
                    className="absolute top-4 right-4 p-2 text-white bg-black/50 hover:bg-black/70 rounded-full"
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
        <div className={cn("p-4 border-t-[1.5px]", isDark ? "border-white/[0.08] bg-black" : "border-gray-200 bg-white")}>
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
  const { openSnackbar, themeName, accountProfile, setOpenWalletModal } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const accountLogin = accountProfile?.account;
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Check if NFT is in watchlist
  React.useEffect(() => {
    if (!accountLogin || !nft?.NFTokenID) return;
    import('axios').then(({ default: axios }) => {
      axios.get(`https://api.xrpl.to/api/watchlist/nft?account=${accountLogin}`)
        .then((res) => {
          if (res.data?.result === 'success' && res.data.watchlist) {
            const allItems = Object.values(res.data.watchlist).flatMap(col => col.items || []);
            setIsSaved(allItems.some(item => item.nftokenId === nft.NFTokenID));
          }
        })
        .catch(() => {});
    });
  }, [accountLogin, nft?.NFTokenID]);

  const handleSave = async () => {
    if (!accountLogin) {
      setOpenWalletModal(true);
      return;
    }
    setSaveLoading(true);
    try {
      const { default: axios } = await import('axios');
      const action = isSaved ? 'remove' : 'add';
      const res = await axios.post('https://api.xrpl.to/api/watchlist/nft', {
        account: accountLogin,
        nftokenId: nft?.NFTokenID,
        action
      });
      if (res.data?.result === 'success') {
        setIsSaved(!isSaved);
        openSnackbar(isSaved ? 'Removed from watchlist' : 'Added to watchlist', 'success');
      } else {
        openSnackbar(res.data?.message || 'Failed to update', 'error');
      }
    } catch (e) {
      openSnackbar('Failed to update watchlist', 'error');
    }
    setSaveLoading(false);
  };

  const handleCopy = (text, label) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        openSnackbar(`${label} copied`, 'success');
      }).catch(() => {
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
    () => (typeof collection === 'string' ? collection : collection?.name) || meta?.collection?.name || 'No Collection',
    [collection, meta]
  );
  const properties = useMemo(() => props || getProperties(meta), [props, meta]);

  return (
    <div className="flex flex-col w-full">
      {/* NFT Preview */}
      <div className="mb-3 w-full">
        <NFTPreviewComponent nft={nft} showDetails={false} />
      </div>

      {/* Title and Collection */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className={cn("text-xl font-medium", isDark ? "text-white" : "text-gray-900")}>
            {nft.name || meta?.name || 'Untitled'}
          </h1>
          <button
            onClick={handleSave}
            disabled={saveLoading}
            className={cn(
              "flex-shrink-0 p-2 rounded-lg border-[1.5px] transition-all",
              isSaved
                ? "border-primary bg-primary/10 text-primary"
                : isDark
                  ? "border-white/10 text-gray-400 hover:border-primary hover:text-primary"
                  : "border-gray-200 text-gray-400 hover:border-primary hover:text-primary",
              saveLoading && "opacity-50 cursor-not-allowed"
            )}
            title={isSaved ? "Remove from watchlist" : "Add to watchlist"}
          >
            {saveLoading ? <Loader2 size={18} className="animate-spin" /> : <Star size={18} fill={isSaved ? "currentColor" : "none"} />}
          </button>
        </div>
        {cslug && (
          <div className="flex items-center gap-2">
            <Link href={`/collection/${cslug}`} className={cn("text-sm hover:text-primary transition-colors", isDark ? "text-gray-400" : "text-gray-500")}>
              {collectionName}
            </Link>
            {(nft.collectionVerified >= 1 || (typeof collection === 'object' && collection?.verified >= 1)) && (
              <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-medium", isDark ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600")}>Verified</span>
            )}
          </div>
        )}
      </div>

      {/* Properties */}
      {properties && properties.length > 0 && (
        <div className={cn("p-3 mb-3 rounded-xl border", isDark ? "border-white/[0.08]" : "border-gray-200")}>
          <p className={cn("text-[11px] font-medium uppercase tracking-wider mb-2", isDark ? "text-gray-500" : "text-gray-400")}>Properties</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {properties.map((item) => {
              const type = item.type || item.trait_type;
              const value = item.value;
              const count = item.count || 0;
              const rarity = total > 0 && count > 0 ? ((count * 100) / total).toFixed(2) : 0;

              return (
                <Link
                  key={`${type}-${value}`}
                  href={cslug ? `/collection/${cslug}?traits=${encodeURIComponent(`${type}:${value}`)}` : '#'}
                  className={cn(
                    "group p-2.5 text-center rounded-lg border cursor-pointer transition-all duration-200 active:scale-[0.97]",
                    isDark ? "border-white/[0.08] bg-white/[0.02] hover:border-primary hover:bg-primary/10" : "border-gray-200 bg-gray-50 hover:border-primary hover:bg-primary/5"
                  )}
                >
                  <p className={cn("text-[10px] uppercase tracking-wide mb-1 transition-colors", isDark ? "text-gray-500 group-hover:text-primary/70" : "text-gray-400 group-hover:text-primary/70")}>{type}</p>
                  <p className={cn("text-[13px] font-normal transition-colors", isDark ? "text-white group-hover:text-primary" : "text-gray-900 group-hover:text-primary")}>{value}</p>
                  {total > 0 && count > 0 && (
                    <p className={cn("text-[11px] mt-1 text-primary/70 group-hover:text-primary")}>{rarity}%</p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Description - hide if it just matches collection name */}
      {meta?.description && meta.description !== collection && meta.description !== collectionName && (
        <div className={cn("p-3 mb-3 rounded-xl border", isDark ? "border-white/[0.08]" : "border-gray-200")}>
          <p className={cn("text-[11px] font-medium uppercase tracking-wider mb-1.5", isDark ? "text-gray-500" : "text-gray-400")}>Description</p>
          <p className={cn("text-[13px] leading-relaxed", isDark ? "text-gray-300" : "text-gray-600")}>{meta.description}</p>
        </div>
      )}

      {/* Stats */}
      {(rarity_rank > 0 || MasterSequence > 0 || volume > 0) && (
        <div className={cn("p-3 mb-3 rounded-xl border", isDark ? "border-white/[0.08]" : "border-gray-200")}>
          <div className="grid grid-cols-3 gap-4">
            {rarity_rank > 0 && (
              <div className="text-center">
                <p className={cn("text-[10px] font-medium uppercase tracking-wider mb-1", isDark ? "text-gray-500" : "text-gray-400")}>Rarity Rank</p>
                <p className={cn("text-base font-medium", isDark ? "text-white" : "text-gray-900")}>#{rarity_rank}</p>
              </div>
            )}
            {MasterSequence > 0 && (
              <div className="text-center">
                <p className={cn("text-[10px] font-medium uppercase tracking-wider mb-1", isDark ? "text-gray-500" : "text-gray-400")}>On-Chain Rank</p>
                <p className={cn("text-base font-medium", isDark ? "text-white" : "text-gray-900")}>#{MasterSequence}</p>
              </div>
            )}
            {volume > 0 && (
              <div className="text-center">
                <p className={cn("text-[10px] font-medium uppercase tracking-wider mb-1", isDark ? "text-gray-500" : "text-gray-400")}>Volume</p>
                <p className={cn("text-base font-medium", isDark ? "text-white" : "text-gray-900")}>✕{fVolume(volume)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Technical Details */}
      <div className={cn("p-3 mb-4 rounded-xl border", isDark ? "border-white/[0.08]" : "border-gray-200")}>
        <div className="space-y-3">
          {/* Owner + Royalties row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={cn("text-[10px] font-medium uppercase tracking-wider", isDark ? "text-gray-500" : "text-gray-400")}>Owner</span>
                <button onClick={() => handleCopy(account, 'Owner')} className={cn("p-0.5 rounded hover:bg-white/10", isDark ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-gray-900")}>
                  <Copy size={10} />
                </button>
              </div>
              <Link href={`/address/${account}`} className={cn("text-[12px] font-mono break-all block hover:text-primary", isDark ? "text-gray-300" : "text-gray-700")}>{account}</Link>
            </div>
            <div className="text-right">
              <p className={cn("text-[10px] font-medium uppercase tracking-wider mb-0.5", isDark ? "text-gray-500" : "text-gray-400")}>Royalties</p>
              <p className="text-sm font-medium text-primary">{transferFee}%</p>
            </div>
          </div>

          {/* Issuer */}
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={cn("text-[10px] font-medium uppercase tracking-wider", isDark ? "text-gray-500" : "text-gray-400")}>Issuer</span>
              <button onClick={() => handleCopy(issuer, 'Issuer')} className={cn("p-0.5 rounded hover:bg-white/10", isDark ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-gray-900")}>
                <Copy size={10} />
              </button>
            </div>
            <Link href={`/address/${issuer}`} className={cn("text-[12px] font-mono break-all block hover:text-primary", isDark ? "text-gray-300" : "text-gray-700")}>{issuer}</Link>
          </div>

          {/* Token ID */}
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={cn("text-[10px] font-medium uppercase tracking-wider", isDark ? "text-gray-500" : "text-gray-400")}>Token ID</span>
              <button onClick={() => handleCopy(NFTokenID, 'Token ID')} className={cn("p-0.5 rounded hover:bg-white/10", isDark ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-gray-900")}>
                <Copy size={10} />
              </button>
            </div>
            <a href={`https://livenet.xrpl.org/nfts/${NFTokenID}`} target="_blank" rel="noopener noreferrer" className={cn("text-[11px] font-mono break-all block hover:text-primary", isDark ? "text-gray-400" : "text-gray-500")}>{NFTokenID}</a>
          </div>
        </div>
      </div>
    </div>
  );
});

// Export the NFTPreview as a named export for backward compatibility
export const NFTPreview = NFTPreviewComponent;
export default NFTDetails;
