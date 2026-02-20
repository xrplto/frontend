import React, { useContext, useEffect, useState } from 'react';
import api from 'src/utils/api';
import { cn } from 'src/utils/cn';

// Utils
import { getNftCoverUrl } from 'src/utils/parseUtils';

// Components
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import TokenTabs from 'src/TokenDetail/components/TokenTabs';
import { addTokenToTabs } from 'src/hooks/useTokenTabs';
import NFTDetail from 'src/nft';

import { ThemeContext } from 'src/context/AppContext';

export default function Overview({ nft }) {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth < 960);
  }, []);

  const nftName = nft?.nft?.meta?.name || nft?.nft?.meta?.Name || 'No Name';
  const nftTokenId = nft?.nft?.NFTokenID;
  const collectionSlug = nft?.nft?.cslug;
  // Handle collection being an object {name, family} or a string
  const rawCollection = nft?.nft?.collection;
  const collectionName = typeof rawCollection === 'string' ? rawCollection : rawCollection?.name;
  const nftThumbnail =
    nft?.nft?.files?.[0]?.thumbnail?.small || nft?.nft?.files?.[0]?.thumbnail?.medium;
  const nftCoverUrl = nft?.nft ? getNftCoverUrl(nft.nft, 'small', 'image') : null;

  // Add current NFT to tabs on mount
  useEffect(() => {
    if (nftTokenId && nftName) {
      addTokenToTabs({
        slug: nftTokenId,
        name: nftName,
        type: 'nft',
        thumbnail: nftThumbnail,
        coverUrl: nftCoverUrl,
        collectionSlug,
        collectionName
      });
    }
  }, [nftTokenId, nftName, nftThumbnail, nftCoverUrl, collectionSlug, collectionName]);

  // Also add collection to tabs - fetch logoImage from collection API
  useEffect(() => {
    if (collectionSlug && collectionName) {
      api
        .get(`https://api.xrpl.to/v1/nft/collections/${collectionSlug}`)
        .then((res) => {
          addTokenToTabs({
            slug: collectionSlug,
            name: collectionName,
            type: 'collection',
            logoImage: res.data?.logoImage || collectionSlug
          });
        })
        .catch(() => {});
    }
  }, [collectionSlug, collectionName]);

  return (
    <div className="flex min-h-screen flex-col">
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
        {nftName} NFT on XRPL
      </h1>

      {!isMobile && <TokenTabs currentMd5={nftTokenId} />}

      <div id="back-to-top-anchor" className="mx-auto max-w-7xl flex-1 px-4 mt-4 min-h-[calc(100vh-120px)]">
        <NFTDetail nft={nft.nft} />
      </div>

      <ScrollToTop />

      <Footer />
    </div>
  );
}

export async function getServerSideProps(ctx) {
  const BASE_URL = 'https://api.xrpl.to/v1';

  let data = null;
  try {
    const params = ctx.params.nftokenid;
    const NFTokenID = params[0];

    const res = await api.get(`${BASE_URL}/nft/${NFTokenID}`);

    data = { nft: res.data };
  } catch (e) {
    // Error fetching NFT
  }
  let ret = {};
  const nft = data?.nft;
  if (nft) {
    const { NFTokenID, meta, dfile, collection } = nft;

    const name = meta?.name || nft.meta?.Name || 'No Name';
    const description = meta?.description;
    // Handle collection being an object {name, family} or a string
    const cname = (typeof collection === 'string' ? collection : collection?.name) || '';

    let ogp = {};
    ogp.canonical = `https://xrpl.to/nft/${NFTokenID}`;
    ogp.title = cname ? `${name} - ${cname}` : `${name}`;
    ogp.url = `https://xrpl.to/nft/${NFTokenID}`;
    const nftImage = getNftCoverUrl(nft, '', 'image') || getNftCoverUrl(nft, '', 'animation');
    ogp.imgUrl = `https://xrpl.to/api/og/nft/${NFTokenID}`;
    ogp.imgType = 'image/png';
    ogp.imgWidth = 1200;
    ogp.imgHeight = 630;
    ogp.desc = description
      ? description
      : `XRPL's largest NFT marketplace: Buy, sell, mint with ease. Experience exclusive NFT creation and trade.`;

    // Product schema for NFT
    const nftSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: name,
      description: ogp.desc,
      image: ogp.imgUrl,
      url: ogp.canonical,
      ...(nft.offers &&
        nft.offers.length > 0 && {
          offers: {
            '@type': 'Offer',
            price: nft.offers[0].amount,
            priceCurrency: 'XRP',
            availability: 'https://schema.org/InStock',
            seller: {
              '@type': 'Organization',
              name: 'XRPL.to NFT Marketplace'
            }
          }
        })
    };
    ogp.jsonLd = nftSchema;

    ret = { nft: data, ogp };
  } else {
    return { notFound: true };
  }

  return {
    props: ret // will be passed to the page component as props
  };
}
