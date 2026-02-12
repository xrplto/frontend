import { useContext } from 'react';
import { ThemeContext } from 'src/context/AppContext';
import { cn } from 'src/utils/cn';
import { ChevronRight } from 'lucide-react';
import { normalizeCollectionName } from 'src/utils/formatters';

export default function CollectionBreadcrumb({ collection, nftName, nftId }) {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const collectionName = normalizeCollectionName(collection?.collection?.name);

  return (
    <div
      className={cn(
        'mt-2 mb-2 flex flex-row items-center gap-1',
        isDark ? 'text-gray-400' : 'text-gray-600'
      )}
    >
      <a
        href="/collections"
        rel="noreferrer noopener nofollow"
        className="text-primary hover:underline text-[13px] font-normal"
      >
        NFTs
      </a>
      <ChevronRight size={12} className="mt-0.5" />
      <a
        href={`/nfts/${collection.collection.slug || ''}`}
        rel="noreferrer noopener nofollow"
        className="text-primary hover:underline text-[13px] font-normal"
      >
        {collectionName}
      </a>
      {nftName && (
        <>
          <ChevronRight size={12} className="mt-0.5" />
          <span className="text-[13px] font-normal">{nftName}</span>
        </>
      )}
    </div>
  );
}
