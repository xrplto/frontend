import Head from 'next/head';

const BASE = 'https://xrpl.to';
const OG_API = `${BASE}/api/og`;

// Normalize name: API may return object {collection_name, collection_description} or string
const normalizeName = (name) => typeof name === 'object' && name !== null
  ? name.collection_name || ''
  : name || '';

// All static pages
const PAGES = {
  index: { title: 'XRPL.to - XRP Ledger Token Prices & Analytics', desc: 'Real-time XRP Ledger token prices, charts, and trading data.' },
  trending: { title: 'Trending Tokens - XRPL.to', desc: 'Most popular tokens on XRP Ledger.' },
  spotlight: { title: 'Spotlight - XRPL.to', desc: 'Featured tokens on XRP Ledger.' },
  'most-viewed': { title: 'Most Viewed - XRPL.to', desc: 'Popular tokens by views on XRPL.' },
  new: { title: 'New Tokens - XRPL.to', desc: 'Recently listed tokens on XRP Ledger.' },
  'amm-pools': { title: 'AMM Pools - XRPL.to', desc: 'XRPL liquidity pools with APY analytics.' },
  swap: { title: 'Swap - XRPL.to', desc: 'Trade tokens on the XRP Ledger DEX.' },
  collections: { title: 'NFT Collections - XRPL.to', desc: 'Browse NFT collections on XRP Ledger.' },
  'nft-traders': { title: 'NFT Traders - XRPL.to', desc: 'Top NFT traders on XRP Ledger.' },
  watchlist: { title: 'Watchlist - XRPL.to', desc: 'Track your favorite XRPL tokens.' },
  news: { title: 'News - XRPL.to', desc: 'Latest XRP Ledger ecosystem updates.' },
  about: { title: 'About - XRPL.to', desc: 'Learn about XRPL.to analytics platform.' },
  'rsi-analysis': { title: 'RSI Analysis - XRPL.to', desc: 'Technical RSI analysis for XRPL tokens.' },
  launch: { title: 'Token Launch - XRPL.to', desc: 'Launch your token on XRP Ledger.' },
  advertise: { title: 'Advertise - XRPL.to', desc: 'Promote your project on XRPL.to.' },
  docs: { title: 'Documentation - XRPL.to', desc: 'XRPL.to API documentation and guides.' },
  404: { title: 'Page Not Found - XRPL.to', desc: 'This page does not exist.' },
  ledger: { title: 'Ledger Explorer - XRPL.to', desc: 'Browse XRP Ledger transactions.' },
  'device-login': { title: 'Device Login - XRPL.to', desc: 'Secure wallet authentication.' },
  'wallet-setup': { title: 'Wallet Setup - XRPL.to', desc: 'Create your XRPL wallet.' },
  'collection-create': { title: 'Create Collection - XRPL.to', desc: 'Launch your NFT collection on XRPL.' },
  'collection-import': { title: 'Import Collection - XRPL.to', desc: 'Import existing NFTs to XRPL.to.' },
};

export default function OGMeta({ page, type, token, nft, collection, tag, period, profile, tx, ledgerIndex, title: customTitle, description: customDesc, image: customImage }) {
  let title, desc, image, url;

  if (page && PAGES[page]) {
    title = customTitle || PAGES[page].title;
    desc = customDesc || PAGES[page].desc;
    image = customImage || `${OG_API}/${page}`;
    url = page === 'index' ? BASE : `${BASE}/${page}`;
  } else if (type === 'token' && token) {
    const name = token.name || token.currency;
    title = customTitle || `${name} Price - XRPL.to`;
    desc = customDesc || `${name} real-time price and market data on XRP Ledger.`;
    const params = new URLSearchParams({ name, price: token.price || '', change: token.pro24h || token.priceChange || '' });
    image = customImage || `${OG_API}/token/${token.currency}/${token.issuer}?${params}`;
    url = `${BASE}/token/${token.slug || `${token.currency}+${token.issuer}`}`;
  } else if (type === 'nft' && nft) {
    const name = nft.name || nft.nftokenid?.slice(0, 12);
    title = customTitle || `${name} - XRPL.to`;
    desc = customDesc || `${name} NFT on XRP Ledger.`;
    const params = new URLSearchParams({ name, collection: normalizeName(nft.collection?.name), image: nft.image || '' });
    image = customImage || `${OG_API}/nft/${nft.nftokenid}?${params}`;
    url = `${BASE}/nft/${nft.nftokenid}`;
  } else if (type === 'collection' && collection) {
    const name = normalizeName(collection.name);
    title = customTitle || `${name} Collection - XRPL.to`;
    desc = customDesc || `${name} - ${collection.nfts || 0} NFTs on XRP Ledger.`;
    const params = new URLSearchParams({ name, nfts: collection.nfts || '', image: collection.image || '' });
    image = customImage || `${OG_API}/nfts/${collection.slug}?${params}`;
    url = `${BASE}/nfts/${collection.slug}`;
  } else if (type === 'tag' && tag) {
    title = customTitle || `${tag} Tokens - XRPL.to`;
    desc = customDesc || `Browse ${tag} tokens on XRP Ledger.`;
    image = customImage || `${OG_API}/tag/${encodeURIComponent(tag)}`;
    url = `${BASE}/view/${encodeURIComponent(tag)}`;
  } else if (type === 'gainers' && period) {
    title = customTitle || `Top Gainers ${period} - XRPL.to`;
    desc = customDesc || `Biggest price gainers in ${period} on XRP Ledger.`;
    image = customImage || `${OG_API}/gainers/${period}`;
    url = `${BASE}/gainers/${period}`;
  } else if (type === 'profile' && profile) {
    const addr = profile.address || profile;
    title = customTitle || `${addr.slice(0, 8)}... - XRPL.to`;
    desc = customDesc || `XRPL wallet profile and holdings.`;
    image = customImage || `${OG_API}/address/${addr}`;
    url = `${BASE}/address/${addr}`;
  } else if (type === 'tx' && tx) {
    title = customTitle || `Transaction - XRPL.to`;
    desc = customDesc || `XRPL transaction ${tx.slice(0, 16)}...`;
    image = customImage || `${OG_API}/tx/${tx}`;
    url = `${BASE}/tx/${tx}`;
  } else if (type === 'ledger' && ledgerIndex) {
    title = customTitle || `Ledger #${ledgerIndex} - XRPL.to`;
    desc = customDesc || `XRP Ledger block ${ledgerIndex}.`;
    image = customImage || `${OG_API}/ledger-block/${ledgerIndex}`;
    url = `${BASE}/ledger/${ledgerIndex}`;
  } else if (type === 'collection-edit' && collection) {
    const editName = normalizeName(collection.name);
    title = customTitle || `Edit ${editName} - XRPL.to`;
    desc = customDesc || `Manage your NFT collection.`;
    image = customImage || `${OG_API}/collection-edit?name=${encodeURIComponent(editName)}`;
    url = `${BASE}/nfts/${collection.slug}/edit`;
  } else {
    title = customTitle || 'XRPL.to';
    desc = customDesc || 'XRP Ledger analytics platform.';
    image = customImage || `${OG_API}/index`;
    url = BASE;
  }

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={desc} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="XRPL.to" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={image} />
    </Head>
  );
}
