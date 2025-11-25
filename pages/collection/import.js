import styled from '@emotion/styled';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Components
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ImportCollection from 'src/NFTCollection/import';
import ScrollToTop from 'src/components/ScrollToTop';

const OverviewWrapper = styled.div`
  flex: 1;
`;

export default function Overview({ data }) {
  const { darkMode, accountProfile, openSnackbar } = useContext(AppContext);

  const isAdmin = accountProfile?.admin;

  return (
    <OverviewWrapper>
      <div className="h-16" id="back-to-top-anchor" />

      <Header />

      <div className="mx-auto max-w-2xl px-4">{isAdmin && <ImportCollection />}</div>

      <ScrollToTop />

      <Footer />
    </OverviewWrapper>
  );
}

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export async function getStaticProps() {
  let ret = {};

  const ogp = {};
  ogp.canonical = 'https://xrpnft.com';
  ogp.title = 'XRP NFT Marketplace, Buy, Sell & Collect NFTs';
  ogp.url = 'https://xrpnft.com/';
  ogp.imgUrl = 'https://xrpnft.com/static/ogp.png';
  ogp.desc =
    "XRPL's largest NFT marketplace: Buy, sell, mint with ease. Experience exclusive NFT creation and trade.";

  ret = { ogp };

  return {
    props: ret // will be passed to the page component as props
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 10 seconds
    // revalidate: 10, // In seconds
  };
}
