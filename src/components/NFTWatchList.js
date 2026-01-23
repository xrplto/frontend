import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { ChevronDown, Trash2, ExternalLink, Loader2, X } from 'lucide-react';
import { cn } from 'src/utils/cn';
import { AppContext } from 'src/context/AppContext';

const BASE_URL = 'https://api.xrpl.to';

function NFTCard({ nft, onRemove, isDark }) {
  const [loadingImg, setLoadingImg] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [removing, setRemoving] = useState(false);

  const imgUrl = nft.image?.startsWith('ipfs://')
    ? `https://ipfs.io/ipfs/${nft.image.replace('ipfs://', '')}`
    : nft.image;

  const handleRemove = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setRemoving(true);
    await onRemove(nft.nftokenId);
    setRemoving(false);
  };

  // Format price from drops to XRP
  const price = nft.offer?.amount ? (nft.offer.amount / 1000000).toFixed(2) : null;

  return (
    <Link href={`/nft/${nft.nftokenId}`} className="block group">
      <div
        className={cn(
          'rounded-lg overflow-hidden transition-all',
          isDark ? 'bg-white/[0.03] hover:bg-white/[0.06]' : 'bg-gray-50 hover:bg-gray-100'
        )}
      >
        <div className="relative aspect-square overflow-hidden">
          {loadingImg && !imageError && (
            <div
              className={cn(
                'absolute inset-0 animate-pulse',
                isDark ? 'bg-white/5' : 'bg-gray-200'
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
                'w-full h-full object-cover transition-transform group-hover:scale-105',
                loadingImg && 'opacity-0'
              )}
            />
          ) : (
            <div
              className={cn(
                'w-full h-full flex items-center justify-center',
                isDark ? 'bg-white/5' : 'bg-gray-200'
              )}
            >
              <span className={cn('text-[11px]', isDark ? 'text-white/30' : 'text-gray-400')}>
                No image
              </span>
            </div>
          )}
          {/* Rarity badge */}
          {nft.rarityRank && nft.total && (
            <div
              className={cn(
                'absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-medium',
                isDark ? 'bg-black/70 text-white/80' : 'bg-white/90 text-gray-700'
              )}
            >
              #{nft.rarityRank}
            </div>
          )}
          <button
            onClick={handleRemove}
            disabled={removing}
            className={cn(
              'absolute top-1.5 right-1.5 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all',
              isDark
                ? 'bg-black/70 hover:bg-red-500'
                : 'bg-white/90 hover:bg-red-500 hover:text-white',
              'text-white/70 hover:text-white'
            )}
          >
            {removing ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
          </button>
        </div>
        <div className="px-2 py-1.5">
          <p
            className={cn(
              'text-[11px] font-normal truncate',
              isDark ? 'text-white/80' : 'text-gray-700'
            )}
          >
            {nft.name || 'Unnamed'}
          </p>
          {price && <p className={cn('text-[10px] font-medium', 'text-primary')}>{price} XRP</p>}
        </div>
      </div>
    </Link>
  );
}

function CollectionGroup({ slug, data, onRemove, isDark, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const items = data.items || [];

  return (
    <div className={cn('rounded-lg overflow-hidden', isDark ? 'bg-white/[0.02]' : 'bg-gray-50')}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 transition-colors',
          isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-100'
        )}
      >
        <div className="flex items-center gap-2">
          <span className={cn('text-[13px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>
            {data.collectionName || slug}
          </span>
          <span
            className={cn(
              'px-1.5 py-0.5 rounded text-[10px] font-normal',
              isDark ? 'bg-white/10 text-white/50' : 'bg-gray-200 text-gray-500'
            )}
          >
            {items.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {slug !== 'uncategorized' && data.collectionId && (
            <Link
              href={`/nfts/${slug}`}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'p-1.5 rounded transition-colors',
                isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'
              )}
            >
              <ExternalLink size={12} className="text-primary" />
            </Link>
          )}
          <ChevronDown
            size={14}
            className={cn(
              'transition-transform',
              isOpen && 'rotate-180',
              isDark ? 'text-white/40' : 'text-gray-400'
            )}
          />
        </div>
      </button>
      {isOpen && (
        <div className="px-3 pb-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
          {items.map((nft) => (
            <NFTCard key={nft.nftokenId} nft={nft} onRemove={onRemove} isDark={isDark} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function NFTWatchList({ account }) {
  const { themeName, openSnackbar } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const [watchlist, setWatchlist] = useState({});
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchWatchlist = async () => {
    if (!account) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/watchlist/nft?account=${account}`);
      if (res.data?.result === 'success') {
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
      await axios.post(`${BASE_URL}/api/watchlist/nft`, {
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
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const collections = Object.keys(watchlist);

  if (collections.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl border-[1.5px] p-12 text-center',
          isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-gray-200 bg-gray-50'
        )}
      >
        <p className={cn('text-[15px]', isDark ? 'text-white/60' : 'text-gray-500')}>
          No NFTs in your watchlist yet
        </p>
        <p className={cn('text-[13px] mt-2', isDark ? 'text-white/40' : 'text-gray-400')}>
          Browse collections and add NFTs to track them here
        </p>
        <Link
          href="/collections"
          className="inline-block mt-4 px-4 py-2 rounded-lg bg-primary text-white text-[13px] font-medium hover:bg-primary/90 transition-colors"
        >
          Explore Collections
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
