import api from 'src/utils/api';
import { useState, useEffect } from 'react';
import { cn } from 'src/utils/cn';

// Context
import { useContext } from 'react';
import { ThemeContext, WalletContext, AppContext } from 'src/context/AppContext';

// Components
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import EditCollection from 'src/NFTCollection/edit';
import ScrollToTop from 'src/components/ScrollToTop';

const OverviewWrapper = ({ className, ...props }) => (
  <div className={cn('min-h-screen', className)} {...props} />
);

export default function Overview({ data }) {
  const BASE_URL = 'https://api.xrpnft.com/api';
  const { darkMode } = useContext(ThemeContext);
  const { accountProfile } = useContext(WalletContext);
  const { openSnackbar } = useContext(AppContext);

  const accountLogin = accountProfile?.account;
  const accountToken = accountProfile?.token;

  const [collection, setCollection] = useState(null);

  const slug = data?.collection?.slug;

  useEffect(() => {
    function getCollection() {
      if (!accountLogin || !accountToken) {
        openSnackbar('Please login', 'error');
        return;
      }

      // https://api.xrpnft.com/api/nfts/test1
      api
        .get(`${BASE_URL}/nfts/${slug}?account=${accountLogin}`, {
          headers: { 'x-access-token': accountToken }
        })
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
            setCollection(ret.collection);
          }
        })
        .catch((err) => {
          // Error getting collection
        })
        .then(function () {
          // always executed
        });
    }

    if (slug) getCollection();
  }, [accountLogin, accountToken, slug]);

  return (
    <OverviewWrapper>
      <Header />

      <div id="back-to-top-anchor" className="mx-auto max-w-2xl px-4 mt-4">
        {collection ? (
          <EditCollection collection={collection} />
        ) : (
          <div className="mt-10 min-h-[50vh]" />
        )}
      </div>

      <ScrollToTop />

      <Footer />
    </OverviewWrapper>
  );
}

export async function getServerSideProps(ctx) {
  const BASE_URL = 'http://65.109.54.46/api';

  let data = null;
  try {
    const slug = ctx.params.slug;

    // https://api.xrpnft.com/api/nfts/test1
    const res = await api.get(`${BASE_URL}/nfts/${slug}`);

    data = res.data;
  } catch (e) {
    // Error during getServerSideProps
  }
  let ret = {};
  if (data && data.collection) {
    /*{
            "result": "success",
            "took": "1.02",
            "slug": "collection-1",
            "collection": {
                "_id": "6310c27cf81fe46884ef89ba",
                "account": "rpcmZhxthTeWoLMpro5dfRAsAmwZCrsxGK",
                "name": "collection1",
                "slug": "collection-1",
                "description": "",
                "logoImage": "1662042748001_12e8a38273134f0e87f1039958d5b132.png",
                "featuredImage": "1662042748001_70910cc4c6134845bf84cf262e696d05.png",
                "bannerImage": "1662042748002_b32b442dea454998aa29ab61c8fa0887.jpg",
                "created": 1662042748016,
                "creator": "xrpnft.com",
                "uuid": "bc80f29343bb43f09f73d8e5e290ee4a"
            }
        } */

    const { name, featuredImage, logoImage, bannerImage, slug, uuid, description } =
      data.collection;

    let ogp = {};
    ogp.canonical = `https://xrpnft.com/nfts/${slug}`;
    ogp.title = `${name} - Collection`;
    ogp.url = `https://xrpnft.com/nfts/${slug}`;
    ogp.imgUrl = `https://s1.xrpnft.com/nfts/${logoImage}`;
    ogp.desc = description
      ? description
      : `XRPL's largest NFT marketplace: Buy, sell, mint with ease. Experience exclusive NFT creation and trade.`;

    return {
      props: { data, ogp } // will be passed to the page component as props
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
