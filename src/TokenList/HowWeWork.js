import { useState, useMemo } from 'react';
// Material
import { alpha, Link, Stack, Typography } from '@mui/material';

// Utils
import { fNumber } from 'src/utils/formatNumber';

function Rate(num, exch) {
  if (num === 0 || exch === 0) return 0;
  return fNumber(num / exch);
}

export default function HowWeWork({ data }) {
  const [showContent, setShowContent] = useState(false);

  const content = useMemo(
    () => (
      <div
        style={{
          display: showContent ? 'flex' : 'none',
          flexDirection: 'column'
        }}
      >
        <Typography variant="wallet_h2">
          XRPL Token Prices Today: Real-Time Charts & Market Data
        </Typography>
        <Typography variant="p1">
          Welcome to XRPL.to – Your Trusted XRPL Token Analytics Platform
        </Typography>
        <Typography variant="p1">
          Launched in November 2021, XRPL.to is the premier destination for real-time XRPL token
          prices, interactive charts, and comprehensive market data sourced directly from the XRP
          Ledger's decentralized exchange (DEX). Our platform is committed to delivering accurate,
          timely, and unbiased information to empower your investment decisions.
        </Typography>

        <Typography variant="wallet_h2">Comprehensive XRPL Market Insights</Typography>
        <Typography variant="p1">
          At XRPL.to, we aggregate and present up-to-date information on all tokens, currencies, and
          assets within the XRP Ledger ecosystem. Our goal is to serve as your all-in-one resource
          for XRPL market data, providing the tools and insights needed to navigate the
          decentralized finance landscape effectively.
        </Typography>

        <Typography variant="wallet_h2">Interactive Live & Historical Token Charts</Typography>
        <Typography variant="p1">
          Each token's dedicated page features dynamic charts showcasing both live and historical
          price movements. Customize your view by selecting specific date ranges to analyze trends
          from an asset's inception to the present. These charts are freely accessible to all users,
          offering valuable insights at no cost.
        </Typography>

        <Typography variant="wallet_h2">Transparent Token Price Calculations</Typography>
        <Typography variant="p1">
          Our token prices reflect real-time data from the XRP Ledger DEX, ensuring transparency and
          accuracy. This means that as the XRP Ledger produces new ledgers, our platform updates to
          provide the latest information. For developers and analysts seeking programmatic access,
          our comprehensive{' '}
          <Link href="/api-docs" color="primary">
            XRPL API documentation
          </Link>{' '}
          provides detailed guidance on integrating and utilizing our data feeds.
        </Typography>
        <Typography variant="wallet_h2">XRPL Token Valuation Methodology</Typography>
        <Typography variant="p1">
          We calculate the market capitalization of XRPL tokens by multiplying the total circulating
          supply by the current reference price. This approach offers a clear and consistent metric
          for assessing the value of individual assets within the XRP Ledger.
        </Typography>

        <Typography variant="wallet_h2">Global XRPL Token Market Overview</Typography>
        <Typography variant="p1">
          As of June 1, 2025, the XRP Ledger hosts approximately 9,752 tokens, encompassing a
          diverse array of currencies and projects. XRPL.to automatically lists all tokens available
          on the ledger, providing a comprehensive view of the ecosystem. While we strive to present
          accurate information, we encourage users to conduct their own research to assess the
          legitimacy and potential of each project.
        </Typography>

        <Typography variant="wallet_h2">Understanding XRPL Tokens</Typography>
        <Typography variant="p1">
          Within the XRP Ledger, assets other than XRP are represented as tokens, which can be
          either fungible or non-fungible. These tokens facilitate a wide range of applications,
          including stablecoins backed by external assets, community credits, and unique digital
          collectibles. The ledger's design ensures that tokens are issued and held through{' '}
          <Link href="https://xrpl.org/trust-lines-and-issuing.html" color="primary">
            trust lines
          </Link>
          , maintaining the integrity of transactions.
        </Typography>

        <Typography variant="wallet_h2">Where to Buy XRP?</Typography>
        <Typography variant="p1">
          XRP can be acquired through various cryptocurrency exchanges. These platforms allow users
          to buy, sell, and trade XRP. Some well-known exchanges include Uphold, Kraken, Binance,
          and others. Additionally, services like{' '}
          <Link
            href="https://changelly.com/"
            color="primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Changelly
          </Link>{' '}
          and{' '}
          <Link
            href="https://changenow.io/"
            color="primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            ChangeNOW
          </Link>{' '}
          offer ways to exchange other cryptocurrencies for XRP or purchase XRP directly. It's
          recommended to research and choose a reputable exchange or service that operates in your
          jurisdiction and meets your security and feature requirements. You can often find links to
          these exchanges on official XRP-related websites or cryptocurrency market aggregators.
        </Typography>

        <Typography variant="wallet_h2">Initial DEX Offerings (IDOs) on XRPL</Typography>
        <Typography variant="p1">
          Initial DEX Offerings (IDOs) provide a decentralized fundraising mechanism for XRPL-based
          projects. Through the XRP Ledger DEX, investors can participate in early-stage token
          sales, exchanging XRP for newly issued tokens. This model promotes inclusivity and
          broadens access to investment opportunities within the XRPL ecosystem.
        </Typography>

        <Typography variant="wallet_h2">XRPL Token Launchpads</Typography>
        <Typography variant="p1">
          The XRP Ledger ecosystem also offers platforms known as launchpads, which facilitate the
          creation and launch of new tokens for projects and individuals. These platforms provide
          tools and services to streamline the token issuance process. Some examples of XRPL
          launchpads include{' '}
          <Link
            href="https://firstledger.net"
            color="primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            firstledger.net
          </Link>
          ,{' '}
          <Link
            href="https://ledger.meme"
            color="primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            ledger.meme
          </Link>
          , and{' '}
          <Link
            href="https://xpmarket.com"
            color="primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            xpmarket.com
          </Link>
          . Users interested in launching their own tokens can explore these and other similar
          platforms.
        </Typography>

        <Typography variant="wallet_h2">Stablecoins on the XRP Ledger</Typography>
        <Typography variant="p1">
          Stablecoins on XRPL are typically issued by gateways that hold equivalent off-ledger
          assets, ensuring a 1:1 backing. These tokens offer price stability and can be redeemed
          through the issuing gateway. However, the XRP Ledger itself cannot enforce off-ledger
          obligations, so the reliability of stablecoins depends on the trustworthiness of their
          issuers. Users should perform due diligence before engaging with stablecoin offerings. An
          example of such a stablecoin is{' '}
          <Link href="https://xrpl.to/token/ripple-rlusd" color="primary">
            RLUSD
          </Link>
          .
        </Typography>

        <Typography variant="wallet_h2">In-Game Tokens and the XRPL Gaming Ecosystem</Typography>
        <Typography variant="p1">
          The XRP Ledger supports a growing gaming ecosystem, where in-game tokens and NFTs enhance
          player engagement and enable play-to-earn models. Projects like{' '}
          <Link href="https://xspectar.com" color="primary">
            xSPECTAR
          </Link>{' '}
          exemplify the integration of XRPL tokens within virtual environments, offering users
          immersive experiences and economic opportunities through tokenized assets.
        </Typography>

        <Typography variant="wallet_h2">Investment Considerations</Typography>
        <Typography variant="p1">
          While XRPL.to provides comprehensive data and analytics, we do not offer investment
          advice. The cryptocurrency market is volatile, and asset values can fluctuate
          significantly. We recommend consulting with a financial advisor to make informed
          investment decisions tailored to your individual risk tolerance and financial goals.
        </Typography>

        <Typography variant="wallet_h2">Stay Informed with XRPL.to</Typography>
        <Typography variant="p1">
          Monitor your XRPL investments and explore the latest market trends with XRPL.to. Our
          platform offers real-time updates and in-depth analytics to support your engagement with
          the XRP Ledger ecosystem. Join our community, follow us on{' '}
          <Link
            href="https://x.com/xrplto"
            color="primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            X
          </Link>
          , and stay ahead in the dynamic world of decentralized finance.
        </Typography>

        <Typography variant="p1"></Typography>
        <Typography variant="wallet_h2"></Typography>

        <Typography variant="wallet_h2" sx={{ mb: 5 }}>
          <Link
            component="button"
            underline="always"
            variant="body2"
            color="#637381"
            onClick={() => {
              setShowContent(!showContent);
            }}
          >
            Read Less
          </Link>
        </Typography>
      </div>
    ),
    [showContent]
  );

  return (
    <Stack sx={{ pt: 2 }}>
      <Stack direction="row" sx={{ mt: 1, mb: 6 }}>
        <Typography variant="subtitle1" sx={{ color: alpha('#919EAB', 0.99) }}>
          Discover our process by clicking here.
        </Typography>
        <Link
          component="button"
          underline="always"
          variant="body2"
          color="#637381"
          onClick={() => setShowContent(!showContent)}
        >
          <Typography variant="subtitle1" sx={{ ml: 1, color: alpha('#919EAB', 0.99) }}>
            {showContent ? 'Read Less' : 'Read More'}
          </Typography>
        </Link>
      </Stack>

      {content}
    </Stack>
  );
}
