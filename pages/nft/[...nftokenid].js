import React, { lazy, Suspense } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';

// Material
import { Box, Container, styled, Toolbar, CircularProgress } from '@mui/material';

// Utils
import { getNftCoverUrl } from 'src/utils/parseUtils';

// Components
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import CollectionBreadcrumb from 'src/NFTCollection/CollectionBreadcrumb';
import { useContext } from 'react';
const TokenDetail = lazy(() => import('src/nft'));
import useWebSocket from 'react-use-websocket';
import { useDispatch } from 'react-redux';
import { update_metrics } from 'src/redux/statusSlice';

// const DynamicTokenDetail = dynamic(() => import('src/detail'));
import { AppContext } from 'src/AppContext';

const OverviewWrapper = styled(Box)(
  ({ theme }) => `
        // overflow: hidden;
        flex: 1;
`
);

export default function Overview({ nft }) {
  const { darkMode } = useContext(AppContext);
  const dispatch = useDispatch();

  // Add WebSocket connection
  const WSS_FEED_URL = 'wss://api.xrpl.to/ws/sync';
  const { sendJsonMessage } = useWebSocket(WSS_FEED_URL, {
    shouldReconnect: (closeEvent) => true,
    onMessage: (event) => {
      try {
        const json = JSON.parse(event.data);
        dispatch(update_metrics(json));
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    }
  });

  // Create the properly structured collection data
  const collectionData = nft?.nft
    ? {
        collection: {
          name: nft.nft.collection || 'No Collection',
          slug: nft.nft.cslug || ''
        }
      }
    : null;

  const nftName = nft?.nft?.meta?.name || nft?.nft?.meta?.Name || 'No Name';
  const nftId = nft?.nft?.NFTokenID;

  return (
    <OverviewWrapper>
      <Toolbar id="back-to-top-anchor" />
      <Header />
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        {nftName} NFT on XRPL
      </h1>

      <Container maxWidth="xl">
        {collectionData && (
          <CollectionBreadcrumb collection={collectionData} nftName={nftName} nftId={nftId} />
        )}
        <Suspense
          fallback={
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 400
              }}
            >
              <CircularProgress />
            </Box>
          }
        >
          <TokenDetail nft={nft.nft} />
        </Suspense>
      </Container>

      <ScrollToTop />

      <Footer />
    </OverviewWrapper>
  );
}

export async function getServerSideProps(ctx) {
  const BASE_URL = process.env.API_URL || 'https://api.xrpl.to/api';

  let data = null;
  try {
    const params = ctx.params.nftokenid;

    const NFTokenID = params[0];

    // Self: true  https://api.xrpnft.com/api/nft/00081388A47691FB124F91B5FF0F5246AED2B5275385689F9494918200001FE8
    // Self: false https://api.xrpnft.com/api/nft/00081388C182B4F213B82CCFA4C6F59AD76F0AFCFBDF04D5048B654B00000070
    const res = await axios.get(`${BASE_URL}/nft/${NFTokenID}`);

    data = res.data;
  } catch (e) {
    console.log(e);
  }
  let ret = {};
  const nft = data?.nft;
  if (nft) {
    const { NFTokenID, meta, dfile, collection } = nft;

    const name = meta?.name || nft.meta?.Name || 'No Name';
    const description = meta?.description;
    const cname = collection || '';

    let ogp = {};
    ogp.canonical = `https://xrpl.to/nft/${NFTokenID}`;
    ogp.title = cname ? `${name} - ${cname}` : `${name}`;
    ogp.url = `https://xrpl.to/nft/${NFTokenID}`;
    ogp.imgUrl = getNftCoverUrl(nft, '', 'image') || getNftCoverUrl(nft, '', 'animation'); // (NFTokenID, meta, dfile, 48)
    ogp.videoUrl = getNftCoverUrl(nft, '', 'video');
    ogp.desc = description
      ? description
      : `XRPL's largest NFT marketplace: Buy, sell, mint with ease. Experience exclusive NFT creation and trade.`;
    ogp.isVideo = meta?.video ? true : false;

    // Product schema for NFT
    const nftSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: name,
      description: ogp.desc,
      image: ogp.imgUrl,
      url: ogp.canonical,
      ...(nft.offers && nft.offers.length > 0 && {
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
    return {
      redirect: {
        permanent: false,
        destination: '/404'
      }
    };
  }

  return {
    props: ret // will be passed to the page component as props
  };
}
