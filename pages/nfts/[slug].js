import api from 'src/utils/api';
import { performance } from 'perf_hooks';
import { cn } from 'src/utils/cn';

// Context
import { useContext } from 'react';
import { ThemeContext } from 'src/context/AppContext';

// Components
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import Collection from 'src/NFTCollection/CollectionView';
import ScrollToTop from 'src/components/ScrollToTop';
import { ApiButton } from 'src/components/ApiEndpointsModal';

const OverviewWrapper = ({ className, ...props }) => (
  <div className={cn('min-h-screen', className)} {...props} />
);

export default function Overview({ collection }) {
  const { darkMode } = useContext(ThemeContext);

  if (!collection) {
    return <div>Loading...</div>;
  }

  // Normalize name: API may return object {collection_name, collection_description} or string
  const rawName = collection.name;
  const collectionName =
    typeof rawName === 'object' && rawName !== null
      ? rawName.collection_name || 'NFT Collection'
      : rawName || 'NFT Collection';

  return (
    <OverviewWrapper>
      <Header />
      <div className="absolute top-20 right-4 z-10">
        <ApiButton />
      </div>
      <h1
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0
        }}
      >
        {collectionName} NFT Collection
      </h1>

      <div id="back-to-top-anchor" className="px-2 sm:px-4 mt-4">
        <Collection collection={collection} />
      </div>

      <ScrollToTop />

      <Footer />
    </OverviewWrapper>
  );
}

export async function getServerSideProps(ctx) {
  const BASE_URL = 'https://api.xrpl.to/v1';

  // Set cache headers for better performance
  ctx.res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

  let data = null;

  try {
    const slug = ctx.params.slug;
    const t1 = performance.now();

    // Fetch collection with NFTs in single request
    const res = await api.get(
      `${BASE_URL}/nft/collections/${slug}?includeNFTs=true&nftLimit=20`,
      {
        timeout: 5000,
        headers: {
          'Accept-Encoding': 'gzip, deflate',
          Accept: 'application/json'
        }
      }
    );

    data = {
      collection: res.data,
      initialNfts: res.data.nfts || [],
      name: res.data.name
    };

    const t2 = performance.now();
    const dt = (t2 - t1).toFixed(2);
  } catch (error) {
    console.error('SSR Error:', error.message, error.response?.data);
    return {
      redirect: {
        permanent: false,
        destination: '/404'
      }
    };
  }

  if (data && data.collection) {
    const {
      name: rawName,
      featuredImage,
      logoImage,
      bannerImage,
      slug,
      uuid,
      description: rawDesc
    } = data.collection;

    // Normalize name/description: API may return object or string
    const name =
      typeof rawName === 'object' && rawName !== null
        ? rawName.collection_name || ''
        : rawName || '';
    const description =
      typeof rawDesc === 'object' && rawDesc !== null
        ? rawDesc.collection_description || ''
        : rawDesc || '';

    // Enhanced OGP metadata
    const ogp = {
      canonical: `https://xrpl.to/nfts/${slug}`,
      title: `${name} | XRPL NFT Collection`,
      url: `https://xrpl.to/nfts/${slug}`,
      imgUrl: logoImage
        ? `https://s1.xrpl.to/nft-collection/${logoImage}`
        : '/logo/xrpl-to-logo-black.svg',
      desc:
        description ||
        `Explore ${name} on XRPL's largest NFT marketplace. Buy, sell, and trade unique digital assets.`,
      type: 'website',
      siteName: 'XRPL.to',
      locale: 'en_US'
    };

    return {
      props: {
        collection: data,
        ogp,
        timestamp: Date.now()
      }
    };
  } else {
    return {
      redirect: {
        permanent: false,
        destination: '/404'
      }
    };
  }
}
