import { useState, useMemo } from 'react';
// Material
import { alpha, Link, Stack, Typography, Box, Collapse, Divider } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

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
      <Box
        sx={{
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.5),
          borderRadius: 2,
          p: 3,
          mt: 2
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
          XRPL Token Prices Today: Real-Time Charts & Market Data
        </Typography>
        <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
          Welcome to XRPL.to – Your Trusted XRPL Token Analytics Platform
        </Typography>
        <Typography variant="p1">
          Launched in November 2021, XRPL.to is the premier destination for real-time XRPL token
          prices, interactive charts, and comprehensive market data sourced directly from the XRP
          Ledger's decentralized exchange (DEX). Our platform is committed to delivering accurate,
          timely, and unbiased information to empower your investment decisions.
        </Typography>

        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>Comprehensive XRPL Market Insights</Typography>
        <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
          At XRPL.to, we aggregate and present up-to-date information on all tokens, currencies, and
          assets within the XRP Ledger ecosystem. Our goal is to serve as your all-in-one resource
          for XRPL market data, providing the tools and insights needed to navigate the
          decentralized finance landscape effectively.
        </Typography>

        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, mt: 3, color: 'text.primary' }}>Interactive Live & Historical Token Charts</Typography>
        <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
          Each token's dedicated page features dynamic charts showcasing both live and historical
          price movements. Customize your view by selecting specific date ranges to analyze trends
          from an asset's inception to the present. These charts are freely accessible to all users,
          offering valuable insights at no cost.
        </Typography>

        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, mt: 3, color: 'text.primary' }}>Transparent Token Price Calculations</Typography>
        <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
          Our token prices reflect real-time data from the XRP Ledger DEX, ensuring transparency and
          accuracy. This means that as the XRP Ledger produces new ledgers, our platform updates to
          provide the latest information. For developers and analysts seeking programmatic access,
          our comprehensive{' '}
          <Link href="/api-docs" color="primary">
            XRPL API documentation
          </Link>{' '}
          provides detailed guidance on integrating and utilizing our data feeds.
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, mt: 3, color: 'text.primary' }}>XRPL Token Valuation Methodology</Typography>
        <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
          We calculate the market capitalization of XRPL tokens by multiplying the total circulating
          supply by the current reference price. This approach offers a clear and consistent metric
          for assessing the value of individual assets within the XRP Ledger.
        </Typography>

        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>Global XRPL Token Market Overview</Typography>
        <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
          As of June 1, 2025, the XRP Ledger hosts approximately 9,752 tokens, encompassing a
          diverse array of currencies and projects. XRPL.to automatically lists all tokens available
          on the ledger, providing a comprehensive view of the ecosystem. While we strive to present
          accurate information, we encourage users to conduct their own research to assess the
          legitimacy and potential of each project.
        </Typography>

        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, mt: 3, color: 'text.primary' }}>Understanding XRPL Tokens</Typography>
        <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
          Within the XRP Ledger, assets other than XRP are represented as tokens, which can be
          either fungible or non-fungible. These tokens facilitate a wide range of applications,
          including stablecoins backed by external assets, community credits, and unique digital
          collectibles. The ledger's design ensures that tokens are issued and held through{' '}
          <Link href="https://xrpl.org/trust-lines-and-issuing.html" color="primary">
            trust lines
          </Link>
          , maintaining the integrity of transactions.
        </Typography>

        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, mt: 3, color: 'text.primary' }}>Where to Buy XRP?</Typography>
        <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
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

        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>Initial DEX Offerings (IDOs) on XRPL</Typography>
        <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
          Initial DEX Offerings (IDOs) provide a decentralized fundraising mechanism for XRPL-based
          projects. Through the XRP Ledger DEX, investors can participate in early-stage token
          sales, exchanging XRP for newly issued tokens. This model promotes inclusivity and
          broadens access to investment opportunities within the XRPL ecosystem.
        </Typography>

        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, mt: 3, color: 'text.primary' }}>XRPL Token Launchpads</Typography>
        <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
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

        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, mt: 3, color: 'text.primary' }}>Stablecoins on the XRP Ledger</Typography>
        <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
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

        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, mt: 3, color: 'text.primary' }}>In-Game Tokens and the XRPL Gaming Ecosystem</Typography>
        <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
          The XRP Ledger supports a growing gaming ecosystem, where in-game tokens and NFTs enhance
          player engagement and enable play-to-earn models. Projects like{' '}
          <Link href="https://xspectar.com" color="primary">
            xSPECTAR
          </Link>{' '}
          exemplify the integration of XRPL tokens within virtual environments, offering users
          immersive experiences and economic opportunities through tokenized assets.
        </Typography>

        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>Investment Considerations</Typography>
        <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
          While XRPL.to provides comprehensive data and analytics, we do not offer investment
          advice. The cryptocurrency market is volatile, and asset values can fluctuate
          significantly. We recommend consulting with a financial advisor to make informed
          investment decisions tailored to your individual risk tolerance and financial goals.
        </Typography>

        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, mt: 3, color: 'text.primary' }}>Stay Informed with XRPL.to</Typography>
        <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
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

      </Box>
    ),
    [showContent]
  );

  return (
    <Box sx={{ pt: 2, pb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderRadius: 2,
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12)
          }
        }}
        onClick={() => setShowContent(!showContent)}
      >
        <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>
          Discover how XRPL.to works and explore our comprehensive features
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 500 }}>
            {showContent ? 'Show Less' : 'Learn More'}
          </Typography>
          {showContent ? (
            <ExpandLess sx={{ color: 'primary.main' }} />
          ) : (
            <ExpandMore sx={{ color: 'primary.main' }} />
          )}
        </Box>
      </Box>

      <Collapse in={showContent} timeout="auto" unmountOnExit>
        {content}
      </Collapse>
    </Box>
  );
}
