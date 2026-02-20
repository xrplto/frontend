// Components
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import AllCollections from 'src/NFTCollection/AllCollections';
import ScrollToTop from 'src/components/ScrollToTop';
import { registerApiCalls } from 'src/components/ApiEndpointsModal';
import { useEffect } from 'react';
import { apiFetch } from 'src/utils/api';

export default function Overview({ collections, total, globalMetrics, tags, collectionCreation }) {
  useEffect(() => {
    registerApiCalls(['https://api.xrpl.to/v1/nft/collections']);
  }, []);

  return (
    <div className="min-h-screen overflow-hidden">
      <Header />
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
        NFT Collections on XRPL
      </h1>

      <div className="mx-auto max-w-[1920px] px-4 mt-4">
        <AllCollections
          initialCollections={collections}
          initialTotal={total}
          initialGlobalMetrics={globalMetrics}
          collectionCreation={collectionCreation}
          tags={tags}
        />
      </div>

      <ScrollToTop />

      <Footer />
    </div>
  );
}

export async function getStaticProps() {
  const BASE_URL = 'https://api.xrpl.to/v1';

  let collections = [];
  let total = 0;
  let globalMetrics = null;
  let tags = [];
  let collectionCreation = [];

  try {
    const response = await apiFetch(
      `${BASE_URL}/nft/collections?page=0&limit=20&sortBy=totalVol24h&order=desc&includeGlobalMetrics=true`
    );
    const data = await response.json();

    collections = data.collections || [];
    total = data.pagination?.total || data.count || 0;
    const gm = data.globalMetrics || null;
    if (gm) {
      // Strip massive arrays to reduce page payload (~3MB → ~30KB)
      // volumeHistory (759KB, 1200 items) is never used by the frontend
      // daily (2.2MB, 1200 items) is only used as fallback for collectionCreation, and only last 30 items
      const { volumeHistory, daily, ...rest } = gm;
      globalMetrics = { ...rest, daily: (daily || []).slice(-30) };
    }
    tags = data.tags || [];
    collectionCreation = data.collectionCreation || [];
  } catch (error) {
    console.error('Failed to fetch collections:', error);
  }

  const ogp = {
    canonical: 'https://xrpl.to/nfts',
    title: 'NFT Collections | XRPL.to',
    url: 'https://xrpl.to/nfts',
    imgUrl: 'https://xrpl.to/api/og/collections',
    desc: 'Browse NFT collections on the XRP Ledger. Discover, trade, and collect digital art and collectibles. Community-centered marketplace for XRPL NFTs.'
  };

  return {
    props: {
      ogp,
      collections,
      total,
      globalMetrics,
      tags,
      collectionCreation
    },
    revalidate: 300 // Regenerate every 5 minutes
  };
}
