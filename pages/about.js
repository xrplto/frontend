import React from 'react';
import styled from '@emotion/styled';
import axios from 'axios';
// import { performance } from 'perf_hooks';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { BASE_URL } from 'src/utils/constants';

// Styled components
const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  width: 100%;
`;

const PageHeader = styled.div`
  text-align: center;
  margin: 48px 0;
`;

const PageTitle = styled.h1`
  margin-bottom: 16px;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(45deg, #1976d2, #42a5f5);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  
  @media (min-width: 768px) {
    font-size: 3.5rem;
  }
`;

const PageSubtitle = styled.h5`
  color: rgba(0, 0, 0, 0.6);
  max-width: 600px;
  margin: 0 auto;
  font-size: 1.25rem;
  font-weight: 400;
  line-height: 1.6;
  
  @media (prefers-color-scheme: dark) {
    color: rgba(255, 255, 255, 0.7);
  }
`;

const GridContainer = styled.div`
  display: grid;
  gap: 32px;
  margin-bottom: 48px;
`;

const TwoColumnGrid = styled.div`
  display: grid;
  gap: 32px;
  
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const ThreeColumnGrid = styled.div`
  display: grid;
  gap: 32px;
  
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

const Card = styled.div`
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.04), rgba(156, 39, 176, 0.04));
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: 100%;
  
  @media (prefers-color-scheme: dark) {
    background: linear-gradient(135deg, rgba(25, 118, 210, 0.08), rgba(156, 39, 176, 0.08));
    border-color: rgba(255, 255, 255, 0.12);
  }
`;

const CardTitle = styled.h4`
  font-weight: 600;
  margin-bottom: 16px;
  color: ${props => props.color || '#1976d2'};
  font-size: 1.5rem;
  line-height: 1.334;
`;

const BodyText = styled.p`
  line-height: 1.7;
  font-size: 1.1rem;
  margin: 0;
  color: ${props => props.theme?.palette?.text?.primary || '#212121'};
  
  @media (prefers-color-scheme: dark) {
    color: rgba(255, 255, 255, 0.9);
  }
`;

const TimelineContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
`;

const TimelineItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 0.9rem;
`;

const TimelineDate = styled.div`
  min-width: 100px;
  padding: 2px 8px;
  background: rgba(0, 204, 136, 0.1);
  border-radius: 4px;
  color: #00cc88;
  font-weight: 600;
  font-size: 0.75rem;
  text-align: center;
  white-space: nowrap;
  
  @media (prefers-color-scheme: dark) {
    background: rgba(0, 204, 136, 0.15);
  }
`;

const TimelineEvent = styled.div`
  flex: 1;
  line-height: 1.4;
  font-size: 0.85rem;
  color: ${props => props.theme?.palette?.text?.primary || '#212121'};
  
  @media (prefers-color-scheme: dark) {
    color: rgba(255, 255, 255, 0.9);
  }
`;

const StyledLink = styled.a`
  color: #1976d2;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const InlineSpan = styled.span`
  color: #1976d2;
  font-weight: 600;
`;

function AboutPage() {
  const timelineData = [
    { date: 'Nov 2021', event: 'XRPL.to Launches' },
    { date: 'Dec 2021', event: 'Reached 55,000 monthly page views' },
    { date: 'Jul 2022', event: 'XRPL Grants Wave 3 Recipient' },
    { date: 'Aug 2022', event: 'On-Ramp Fiat Integration' },
    { date: 'Oct 2022', event: 'Weighted market cap for low liquidity tokens' },
    { date: 'Feb 2023', event: 'Full XRPL History Implemented' },
    { date: 'Apr 2023', event: 'Public API Documentation Released' },
    { date: 'Aug 2025', event: 'Reached 40,000 unique monthly users' }
  ];

  return (
    <PageWrapper>
      <Topbar />
      <Header />

      <Container>
        <PageHeader>
          <PageTitle>About xrpl.to</PageTitle>
          <PageSubtitle>
            The largest price-tracking onchain app for tokenized assets on the XRPL ecosystem
          </PageSubtitle>
        </PageHeader>

        <GridContainer>
          <ThreeColumnGrid>
            {/* Mission Statement Card */}
            <Card>
              <CardTitle color="#1976d2">Our Mission</CardTitle>
              <BodyText>
                At XRPL.to, we make XRPL tokens discoverable and efficient globally by
                empowering retail users with unbiased, high-quality, and accurate information.
                We strive to provide all relevant and current information on XRPL tokens,
                currencies, and assets in a single, easy-to-find location.
              </BodyText>
            </Card>

            {/* Company Info Card */}
            <Card>
              <CardTitle color="#9c27b0">Our Story</CardTitle>
              <BodyText>
                Founded in November 2021 by NFT Labs, XRPL.to provides up-to-date XRPL token
                prices, charts, and data for emerging XRPL DEX markets. Our efforts have been
                recognized by Bloomberg, New York Times, and Digital Trends.
              </BodyText>
            </Card>

            {/* Timeline Section */}
            <Card>
              <CardTitle color="#00cc88">Our Journey</CardTitle>
              <TimelineContainer>
                {timelineData.map((item) => (
                  <TimelineItem key={item.date}>
                    <TimelineDate>{item.date}</TimelineDate>
                    <TimelineEvent>{item.event}</TimelineEvent>
                  </TimelineItem>
                ))}
              </TimelineContainer>
            </Card>
          </ThreeColumnGrid>

          {/* Platform Features Row */}
          <ThreeColumnGrid>
            {/* Market Insights Card */}
            <Card>
              <CardTitle color="#ff6b6b">Market Insights</CardTitle>
              <BodyText>
                We aggregate real-time data from the XRP Ledger DEX, providing comprehensive 
                market insights for over 9,750 tokens. Our platform offers interactive charts, 
                historical data analysis, and transparent price calculations sourced directly 
                from on-chain data.
              </BodyText>
            </Card>

            {/* Trading Tools Card */}
            <Card>
              <CardTitle color="#4ecdc4">Trading & Portfolio</CardTitle>
              <BodyText>
                Advanced trading tools including real-time order books, direct DEX trading, 
                and portfolio tracking. Monitor your holdings, execute trades, and manage 
                your digital assets with professional-grade tools designed for traders at 
                every level of expertise.
              </BodyText>
            </Card>

            {/* NFT Marketplace Card */}
            <Card>
              <CardTitle color="#ffe66d">NFT Marketplace</CardTitle>
              <BodyText>
                Explore, buy, and sell NFTs directly on the XRP Ledger. Browse collections, 
                view ownership history, and participate in the growing XRPL NFT ecosystem 
                with detailed analytics and seamless trading experiences for digital 
                collectibles.
              </BodyText>
            </Card>
          </ThreeColumnGrid>

          {/* Community Row */}
          <TwoColumnGrid>
            {/* How It Works Card */}
            <Card>
              <CardTitle color="#1976d2">How XRPL.to Works</CardTitle>
              <BodyText>
                Our platform connects directly to the XRP Ledger, processing real-time data 
                from every new ledger. Token prices are calculated using actual DEX trading 
                data, ensuring accuracy and transparency. We automatically list all tokens 
                on the ledger, providing comprehensive coverage of the ecosystem. Developers 
                can access our data through our{' '}
                <StyledLink href="/api-docs">comprehensive API</StyledLink>
                {' '}for integration into their applications.
              </BodyText>
            </Card>

            {/* Get Involved Card */}
            <Card>
              <CardTitle color="#9c27b0">Get Involved</CardTitle>
              <BodyText>
                Join millions of users tracking XRPL tokens with us. Connect through our 
                social channels on Twitter, Telegram, Facebook, and Instagram. For token 
                listing inquiries, refer to our listing policy and FAQ. Business partnerships 
                and advertising opportunities are available - contact us at{' '}
                <InlineSpan>hello@xrpl.to</InlineSpan>. 
                Check our careers page for open positions.
              </BodyText>
            </Card>
          </TwoColumnGrid>
        </GridContainer>
      </Container>

      <Footer />
    </PageWrapper>
  );
}

export default AboutPage;

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export async function getStaticProps() {
  // https://api.xrpl.to/api/banxa/currencies
  // const BASE_URL = process.env.API_URL;
  let data = null;
  try {
    // var t1 = performance.now();
    // const res = await axios.get(`${BASE_URL}/banxa/currencies`);
    // data = res.data;
    // var t2 = performance.now();
    // var dt = (t2 - t1).toFixed(2);
    // console.log(`2. getStaticProps fiats: ${data.fiats.length} took: ${dt}ms`);
  } catch (e) {
    console.log(e);
  }
  let ret = {};
  if (data) {
    let ogp = {};

    ogp.canonical = 'https://xrpl.to';
    ogp.title = 'About us';
    ogp.url = 'https://xrpl.to/';
    ogp.imgUrl = 'https://xrpl.to/static/ogp.webp';
    //ogp.desc = 'Meta description here';

    ret = { data, ogp };
  }

  return {
    props: ret, // will be passed to the page component as props
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 10 seconds
    revalidate: 10 // In seconds
  };
}