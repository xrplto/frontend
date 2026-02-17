import { useState, useMemo, useContext, useEffect } from 'react';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import TokenList from 'src/TokenList';
import ScrollToTop from 'src/components/ScrollToTop';
import Summary from 'src/TokenList/Summary';
import { getTokens } from 'src/utils/formatters';
import { ThemeContext } from 'src/context/AppContext';

function getInitialTokens(data) {
  if (data) return data.tokens;
  return [];
}

function MPTTokensPage({ data }) {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [tokens, setTokens] = useState(() => getInitialTokens(data));
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

  const tMap = useMemo(() => {
    const map = new Map();
    for (const t of tokens) {
      map.set(t.md5, t);
    }
    return map;
  }, [tokens]);

  return (
    <div className="flex-1 overflow-hidden m-0 p-0">
      <Header
        notificationPanelOpen={notificationPanelOpen}
        onNotificationPanelToggle={setNotificationPanelOpen}
      />
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
        MPT Tokens on XRPL
      </h1>

      <div
        id="back-to-top-anchor"
        className={
          notificationPanelOpen ? 'mx-auto w-full px-4 mt-4' : 'mx-auto max-w-[1920px] px-4 mt-4'
        }
      >
        <div className="w-full px-0 py-0">
          <Summary />
        </div>
      </div>

      <div className="mx-auto max-w-[1920px] px-4">
        <div>
          {data && data.tags ? (
            <TokenList
              tags={data.tags}
              tokens={tokens}
              tMap={tMap}
              setTokens={setTokens}
              initialOrderBy="dateon"
              tokenType="mpt"
            />
          ) : (
            <></>
          )}
        </div>
      </div>

      <ScrollToTop />
      <Footer />
    </div>
  );
}

export default MPTTokensPage;

export async function getStaticProps() {
  const data = await getTokens('dateon', 'desc', 'yes', false, false, 100, 'mpt');

  let ret = {};
  if (data) {
    let ogp = {};

    ogp.canonical = 'https://xrpl.to/mpt';
    ogp.title = 'MPT Tokens | Multi-Purpose Tokens | XRP Ledger';
    ogp.url = 'https://xrpl.to/mpt';
    ogp.imgUrl = 'https://xrpl.to/og/mpt.webp';
    ogp.desc =
      'Discover Multi-Purpose Tokens (MPT) on the XRP Ledger. Browse the latest MPT token listings and explore new tokenization possibilities on XRPL.';
    ogp.type = 'website';
    ogp.siteName = 'XRPL.to';
    ogp.locale = 'en_US';
    ogp.twitterCard = 'summary_large_image';
    ogp.twitterCreator = '@xrplto';

    ret = { data, ogp };
  }

  return {
    props: ret,
    revalidate: 5
  };
}
