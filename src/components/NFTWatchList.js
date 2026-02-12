import { useState, useEffect, useContext } from 'react';
import api from 'src/utils/api';
import Link from 'next/link';
import { ChevronDown, Trash2, ExternalLink, Loader2, X, Compass } from 'lucide-react';
import { cn } from 'src/utils/cn';
import { ThemeContext, AppContext } from 'src/context/AppContext';

const BASE_URL = 'https://api.xrpl.to';
const CDN_URL = 'https://s1.xrpl.to/nft/';

// Get NFT image URL - same logic as NFTDetails.js
const getNftImageUrl = (nft) => {
  // 1. Check files array for thumbnails (preferred - fast CDN)
  const file = nft.files?.[0];
  if (file) {
    if (file.thumbnail?.large) return CDN_URL + file.thumbnail.large;
    if (file.thumbnail?.medium) return CDN_URL + file.thumbnail.medium;
    if (file.thumbnail?.small) return CDN_URL + file.thumbnail.small;
    if (file.cachedUrl) return file.cachedUrl;
    if (file.dfile) return file.dfile;
    if (file.convertedFile) return file.convertedFile;
    // IPFS path in file
    if (file.IPFSPath) return `https://ipfs.io/ipfs/${file.IPFSPath.split('/').map(encodeURIComponent).join('/')}`;
  }

  // 2. Check meta.image
  const metaImage = nft.meta?.image;
  if (metaImage) {
    if (metaImage.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${metaImage.slice(7)}`;
    if (metaImage.startsWith('http')) return metaImage;
  }

  // 3. Fallback to nft.image
  if (nft.image) {
    if (nft.image.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${nft.image.slice(7)}`;
    return nft.image;
  }

  return null;
};

function NFTCard({ nft, onRemove, isDark }) {
  const [loadingImg, setLoadingImg] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [removing, setRemoving] = useState(false);

  const imgUrl = getNftImageUrl(nft);

  const handleRemove = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setRemoving(true);
    await onRemove(nft.nftokenId);
    setRemoving(false);
  };

  const price = nft.offer?.amount ? (nft.offer.amount / 1000000).toFixed(2) : null;

  return (
    <Link href={`/nft/${nft.nftokenId}`} className="block group">
      <div
        className={cn(
          'relative rounded-2xl overflow-hidden transition-all duration-300 border-[1.5px]',
          isDark
            ? 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5 hover:border-white/10'
            : 'bg-white border-black/[0.03] shadow-sm hover:shadow-md'
        )}
      >
        <div className="relative aspect-square overflow-hidden">
          {loadingImg && !imageError && (
            <div
              className={cn(
                'absolute inset-0 animate-pulse',
                isDark ? 'bg-white/5' : 'bg-gray-100'
              )}
            />
          )}
          {!imageError ? (
            <img
              src={imgUrl}
              alt={nft.name}
              loading="lazy"
              onLoad={() => setLoadingImg(false)}
              onError={() => {
                setLoadingImg(false);
                setImageError(true);
              }}
              className={cn(
                'w-full h-full object-cover transition-transform duration-500 group-hover:scale-110',
                loadingImg && 'opacity-0'
              )}
            />
          ) : (
            <div
              className={cn(
                'w-full h-full flex items-center justify-center',
                isDark ? 'bg-white/5' : 'bg-gray-100'
              )}
            >
              <span className={cn('text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/20' : 'text-gray-400')}>
                No Image
              </span>
            </div>
          )}

          {/* Badges container */}
          <div className="absolute top-2 left-2 right-2 flex justify-between items-start pointer-events-none">
            {nft.rarityRank && (
              <div className={cn(
                'px-2 py-0.5 rounded-lg text-[9px] font-bold backdrop-blur-md border pointer-events-auto',
                isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-white/70 border-black/5 text-gray-900'
              )}>
                #{nft.rarityRank}
              </div>
            )}

            <button
              onClick={handleRemove}
              disabled={removing}
              className={cn(
                'p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-auto backdrop-blur-md border',
                isDark
                  ? 'bg-black/40 border-white/10 hover:bg-red-500/80 text-white/70 hover:text-white'
                  : 'bg-white/70 border-black/5 hover:bg-red-500 hover:text-white text-gray-400'
              )}
            >
              {removing ? <Loader2 size={12} className="animate-spin" /> : <X size={12} strokeWidth={3} />}
            </button>
          </div>

          {/* Price overlay */}
          {price && (
            <div className="absolute bottom-2 left-2 right-2">
              <div className={cn(
                'px-2.5 py-1 rounded-xl text-[10px] font-bold backdrop-blur-md border inline-flex items-center gap-1',
                isDark ? 'bg-black/40 border-white/10 text-primary' : 'bg-white/80 border-black/5 text-primary shadow-sm'
              )}>
                {price} XRP
              </div>
            </div>
          )}
        </div>
        <div className="px-3 py-2.5">
          <p
            className={cn(
              'text-[12px] font-bold truncate tracking-tight',
              isDark ? 'text-gray-200' : 'text-gray-900'
            )}
          >
            {nft.name || 'Unnamed NFT'}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <div className={cn('w-1.5 h-1.5 rounded-full bg-primary/40')} />
            <p className={cn('text-[10px] font-medium truncate', isDark ? 'text-white/30' : 'text-gray-400')}>
              {nft.collectionName || 'XRPL Collection'}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CollectionGroup({ slug, data, onRemove, isDark, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const items = data.items || [];

  return (
    <div className={cn(
      'rounded-3xl border overflow-hidden transition-all duration-300 mb-4',
      isDark ? 'bg-white/[0.02] border-white/5 shadow-2xl shadow-black/20' : 'bg-white border-black/5 shadow-sm'
    )}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-6 py-5 transition-colors',
          isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.02]'
        )}
      >
        <div className="flex items-center gap-4">
          <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-[14px]', isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-gray-900')}>
            {items.length}
          </div>
          <div className="text-left">
            <span className={cn('block text-[15px] font-bold tracking-tight leading-none mb-1', isDark ? 'text-white' : 'text-gray-900')}>
              {data.collectionName || slug}
            </span>
            <span className={cn('text-[11px] font-medium uppercase tracking-[0.1em]', isDark ? 'text-white/30' : 'text-gray-400')}>
              Collection
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {slug !== 'uncategorized' && data.collectionId && (
            <Link
              href={`/nfts/${slug}`}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all border',
                isDark ? 'border-white/10 hover:bg-white/10 text-white/50 hover:text-white' : 'border-black/5 hover:bg-black/5 text-gray-500'
              )}
            >
              <span className="text-[11px] font-bold">View</span>
              <ExternalLink size={12} className="text-primary" />
            </Link>
          )}
          <div className={cn('w-[1px] h-6 mx-1', isDark ? 'bg-white/10' : 'bg-black/10')} />
          <ChevronDown
            size={18}
            className={cn(
              'transition-transform duration-300',
              isOpen && 'rotate-180',
              isDark ? 'text-white/40' : 'text-gray-400'
            )}
          />
        </div>
      </button>
      {isOpen && (
        <div className="px-6 pb-6 pt-2">
          <div className="h-[1px] w-full mb-6 opacity-10 bg-gradient-to-r from-transparent via-current to-transparent" />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {items.map((nft) => (
              <NFTCard key={nft.nftokenId} nft={nft} onRemove={onRemove} isDark={isDark} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NFTWatchList({ account }) {
  const { themeName } = useContext(ThemeContext);
  const { openSnackbar } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const [watchlist, setWatchlist] = useState({});
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchWatchlist = async () => {
    if (!account) return;
    setLoading(true);
    try {
      const res = await api.get(`${BASE_URL}/api/watchlist/nft?account=${account}`);
      if (res.data?.success) {
        setWatchlist(res.data.watchlist || {});
        const count = Object.values(res.data.watchlist || {}).reduce(
          (acc, col) => acc + (col.items?.length || 0),
          0
        );
        setTotalCount(count);
      }
    } catch (err) {
      console.error('Failed to fetch NFT watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();

    // Refetch when tab becomes visible (user returns from NFT page)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchWatchlist();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [account]);

  const handleRemove = async (nftokenId) => {
    try {
      await api.post(`${BASE_URL}/api/watchlist/nft`, {
        account,
        nftokenId,
        action: 'remove'
      });
      openSnackbar?.('NFT removed from watchlist', 'success');
      fetchWatchlist();
    } catch (err) {
      openSnackbar?.('Failed to remove NFT', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full" />
        </div>
        <p className={cn('text-[13px] font-bold mt-6 tracking-widest uppercase opacity-40', isDark ? 'text-white' : 'text-gray-900')}>
          Loading Collections
        </p>
      </div>
    );
  }

  const collections = Object.keys(watchlist);

  if (collections.length === 0) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-3xl border-[1.5px] py-20 px-6 text-center group',
          isDark
            ? 'border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent'
            : 'border-black/[0.08] bg-gradient-to-b from-black/[0.02] to-transparent'
        )}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-primary/20 blur-[100px] -z-10 group-hover:bg-primary/30 transition-all duration-700" />

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 group-hover:scale-110 transition-transform duration-500">
          <Compass size={32} className="text-primary" fill="currentColor" fillOpacity={0.2} />
        </div>
        <h2
          className={cn(
            'text-2xl font-bold mb-3 tracking-tight',
            isDark ? 'text-white' : 'text-gray-900'
          )}
        >
          Build Your NFT Gallery
        </h2>
        <p
          className={cn('text-[15px] mb-8 max-w-sm mx-auto leading-relaxed', isDark ? 'text-white/50' : 'text-gray-500')}
        >
          Keep track of your favorite NFT collections in one place. Start exploring the marketplace to add items to your watchlist.
        </p>
        <Link
          href="/collections"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-white text-[15px] font-bold hover:bg-primary/90 shadow-[0_8px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.3)] transition-all active:scale-95"
        >
          Explore Collections
          <ExternalLink size={18} strokeWidth={2.5} />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {collections.map((slug, idx) => (
        <CollectionGroup
          key={slug}
          slug={slug}
          data={watchlist[slug]}
          onRemove={handleRemove}
          isDark={isDark}
          defaultOpen={true}
        />
      ))}
    </div>
  );
}
