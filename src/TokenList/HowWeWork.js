import { useState, useMemo } from 'react';
import styled from '@emotion/styled';
import { Icon } from '@iconify/react';

// Utils
import { fNumber } from 'src/utils/formatNumber';

function Rate(num, exch) {
  if (num === 0 || exch === 0) return 0;
  return fNumber(num / exch);
}

// Styled components
const MainContainer = styled.div`
  padding-top: 16px;
  padding-bottom: 32px;
`;

const ToggleButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-radius: 8px;
  background-color: rgba(25, 118, 210, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: rgba(25, 118, 210, 0.12);
  }
`;

const ToggleText = styled.div`
  font-size: 1rem;
  font-weight: 500;
  color: ${props => props.theme?.palette?.text?.primary || '#212121'};
`;

const ToggleControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ToggleLabel = styled.div`
  font-size: 0.875rem;
  color: #1976d2;
  font-weight: 500;
`;

const CollapseContainer = styled.div`
  max-height: ${props => props.expanded ? 'none' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease;
`;

const ContentContainer = styled.div`
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 24px;
  margin-top: 16px;
  
  @media (prefers-color-scheme: dark) {
    background-color: rgba(18, 18, 18, 0.5);
  }
`;

const MainTitle = styled.h5`
  font-weight: 600;
  margin-bottom: 16px;
  color: #1976d2;
  font-size: 1.5rem;
  line-height: 1.334;
  margin: 0 0 16px 0;
`;

const Subtitle = styled.div`
  font-size: 1rem;
  margin-bottom: 16px;
  color: rgba(145, 158, 171, 0.6);
  font-weight: 400;
  line-height: 1.5;
`;

const BodyText = styled.p`
  font-size: 1rem;
  margin: 0;
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: 0.00938em;
`;

const StyledDivider = styled.div`
  width: 100%;
  height: 1px;
  background: rgba(145, 158, 171, 0.12);
  margin: 24px 0;
`;

const SectionTitle = styled.h6`
  font-weight: 600;
  margin-bottom: 12px;
  color: ${props => props.theme?.palette?.text?.primary || '#212121'};
  font-size: 1.25rem;
  line-height: 1.6;
  margin: 0 0 12px 0;
`;

const StyledLink = styled.a`
  color: #1976d2;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

export default function HowWeWork({ data }) {
  const [showContent, setShowContent] = useState(false);


  return (
    <MainContainer>
      <ToggleButton onClick={() => setShowContent(!showContent)}>
        <ToggleText>
          Discover how XRPL.to works and explore our comprehensive features
        </ToggleText>
        <ToggleControls>
          <ToggleLabel>
            {showContent ? 'Show Less' : 'Learn More'}
          </ToggleLabel>
          <Icon 
            icon={showContent ? 'mdi:chevron-up' : 'mdi:chevron-down'} 
            width={24} 
            height={24} 
            style={{ color: '#1976d2' }}
          />
        </ToggleControls>
      </ToggleButton>

      <CollapseContainer expanded={showContent}>
        {showContent && (
          <ContentContainer>
            <MainTitle>
              XRPL Token Prices Today: Real-Time Charts & Market Data
            </MainTitle>
            <Subtitle>
              Welcome to XRPL.to – Your Trusted XRPL Token Analytics Platform
            </Subtitle>
            <BodyText>
              Launched in November 2021, XRPL.to is the premier destination for real-time XRPL token
              prices, interactive charts, and comprehensive market data sourced directly from the XRP
              Ledger's decentralized exchange (DEX). Our platform is committed to delivering accurate,
              timely, and unbiased information to empower your investment decisions.
            </BodyText>
            <StyledDivider />
            <SectionTitle>Comprehensive XRPL Market Insights</SectionTitle>
            <BodyText>
              At XRPL.to, we aggregate and present up-to-date information on all tokens, currencies, and
              assets within the XRP Ledger ecosystem. Our goal is to serve as your all-in-one resource
              for XRPL market data, providing the tools and insights needed to navigate the
              decentralized finance landscape effectively.
            </BodyText>

            <SectionTitle style={{ marginTop: '24px' }}>Interactive Live & Historical Token Charts</SectionTitle>
            <BodyText>
              Each token's dedicated page features dynamic charts showcasing both live and historical
              price movements. Customize your view by selecting specific date ranges to analyze trends
              from an asset's inception to the present. These charts are freely accessible to all users,
              offering valuable insights at no cost.
            </BodyText>

            <SectionTitle style={{ marginTop: '24px' }}>Transparent Token Price Calculations</SectionTitle>
            <BodyText>
              Our token prices reflect real-time data from the XRP Ledger DEX, ensuring transparency and
              accuracy. This means that as the XRP Ledger produces new ledgers, our platform updates to
              provide the latest information. For developers and analysts seeking programmatic access,
              our comprehensive{' '}
              <StyledLink href="/api-docs">
                XRPL API documentation
              </StyledLink>{' '}
              provides detailed guidance on integrating and utilizing our data feeds.
            </BodyText>

            <SectionTitle style={{ marginTop: '24px' }}>XRPL Token Valuation Methodology</SectionTitle>
            <BodyText>
              We calculate the market capitalization of XRPL tokens by multiplying the total circulating
              supply by the current reference price. This approach offers a clear and consistent metric
              for assessing the value of individual assets within the XRP Ledger.
            </BodyText>

            <StyledDivider />
            
            <SectionTitle>Global XRPL Token Market Overview</SectionTitle>
            <BodyText>
              As of June 1, 2025, the XRP Ledger hosts approximately 9,752 tokens, encompassing a
              diverse array of currencies and projects. XRPL.to automatically lists all tokens available
              on the ledger, providing a comprehensive view of the ecosystem. While we strive to present
              accurate information, we encourage users to conduct their own research to assess the
              legitimacy and potential of each project.
            </BodyText>

            <SectionTitle style={{ marginTop: '24px' }}>Understanding XRPL Tokens</SectionTitle>
            <BodyText>
              Within the XRP Ledger, assets other than XRP are represented as tokens, which can be
              either fungible or non-fungible. These tokens facilitate a wide range of applications,
              including stablecoins backed by external assets, community credits, and unique digital
              collectibles. The ledger's design ensures that tokens are issued and held through{' '}
              <StyledLink href="https://xrpl.org/trust-lines-and-issuing.html" target="_blank" rel="noopener noreferrer">
                trust lines
              </StyledLink>
              , providing flexibility and security for various use cases.
            </BodyText>

            <SectionTitle style={{ marginTop: '24px' }}>NFT Trading on the XRP Ledger</SectionTitle>
            <BodyText>
              XRPL.to offers a seamless NFT trading experience, allowing users to explore, buy, and
              sell non-fungible tokens directly on the XRP Ledger. Our platform provides detailed
              information about collections, individual NFTs, ownership history, and current market
              offers, making it easy to participate in the growing XRPL NFT ecosystem.
            </BodyText>

            <SectionTitle style={{ marginTop: '24px' }}>Advanced Trading & Portfolio Management</SectionTitle>
            <BodyText>
              Beyond market data, XRPL.to features comprehensive trading tools including real-time
              order books, trade execution capabilities, and portfolio tracking. Monitor your token
              holdings, track transaction history, and manage your digital assets all in one place.
              Our platform supports both casual investors and professional traders with tools designed
              for every level of expertise.
            </BodyText>

            <StyledDivider />

            <SectionTitle>Stay Informed with XRPL.to</SectionTitle>
            <BodyText>
              Join our growing community of XRPL enthusiasts and stay updated with the latest market
              trends, token launches, and ecosystem developments. XRPL.to is committed to being your
              trusted companion in the XRP Ledger journey, providing the data, tools, and insights
              you need to make informed decisions in the evolving world of decentralized finance.
            </BodyText>
          </ContentContainer>
        )}
      </CollapseContainer>
    </MainContainer>
  );
}
