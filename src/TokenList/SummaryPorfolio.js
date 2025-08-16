import styled from '@emotion/styled';
import { Icon } from '@iconify/react';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Utils
import { fNumber } from 'src/utils/formatNumber';

// Components
const ContentTypography = styled.div`
  color: rgba(145, 158, 171, 0.99);
`;

const FlexContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const ContentBox = styled.div`
  flex: 1;
`;

const MaxWidthContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  
  @media (max-width: 600px) {
    padding: 0 16px;
  }
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 48px;
  align-items: center;
  justify-content: center;
  margin-top: 48px;
  
  @media (min-width: 1200px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const TextContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const MainTitle = styled.h2`
  margin: 0;
  font-size: 2.125rem;
  font-weight: 300;
  line-height: 1.235;
  letter-spacing: -0.00833em;
  
  @media (max-width: 600px) {
    font-size: 1.5rem;
  }
`;

const CTAContainer = styled.div`
  margin-top: 24px;
`;

const CTATitle = styled.h6`
  margin: 0 0 16px 0;
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 1.6;
  letter-spacing: 0.0075em;
  color: #1976d2;
`;

const CTAButton = styled.button`
  background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 22px;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 3px 1px -2px rgba(0,0,0,0.2), 0 2px 2px 0 rgba(0,0,0,0.14), 0 1px 5px 0 rgba(0,0,0,0.12);
  
  &:hover {
    box-shadow: 0 2px 4px -1px rgba(0,0,0,0.2), 0 4px 5px 0 rgba(0,0,0,0.14), 0 1px 10px 0 rgba(0,0,0,0.12);
    background: linear-gradient(135deg, #1565c0 0%, #1e88e5 100%);
  }
`;

const IntroSection = styled.div`
  margin-top: 40px;
`;

const IntroTitle = styled.h5`
  margin: 0 0 16px 0;
  font-size: 1.5rem;
  font-weight: 400;
  line-height: 1.334;
  letter-spacing: 0;
`;

const IntroText = styled.p`
  margin: 16px 0;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: 0.00938em;
`;

const ImageContent = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
`;

const ResponsiveImage = styled.img`
  max-width: 100%;
  height: auto;
`;

const FeaturesSection = styled.div`
  margin: 80px auto;
  max-width: 1200px;
  padding: 0 24px;
  
  @media (max-width: 600px) {
    padding: 0 16px;
    margin: 40px auto;
  }
`;

const FeaturesTitle = styled.h3`
  margin: 0 0 32px 0;
  font-size: 1.875rem;
  font-weight: 400;
  line-height: 1.334;
  letter-spacing: 0;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 40px;
  
  @media (min-width: 600px) {
    grid-template-columns: 1fr 1fr;
  }
  
  @media (min-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const FeatureCard = styled.div`
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  border-radius: 4px;
  box-shadow: 0 2px 1px -1px rgba(0,0,0,0.2), 0 1px 1px 0 rgba(0,0,0,0.14), 0 1px 3px 0 rgba(0,0,0,0.12);
  background: #fff;
  
  @media (prefers-color-scheme: dark) {
    background: #121212;
  }
`;

const FeatureIcon = styled.div`
  color: #1976d2;
  font-size: 60px;
  margin-bottom: 16px;
`;

const FeatureTitle = styled.h6`
  margin: 0 0 16px 0;
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 1.6;
  letter-spacing: 0.0075em;
  color: #1976d2;
`;

const FeatureDescription = styled.div`
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: 0.00938em;
`;

export default function SummaryPortfolio({}) {
  const { accountProfile, openSnackbar, setLoading } = useContext(AppContext);

  const account = accountProfile?.account;

  return (
    <FlexContainer>
      <ContentBox>
        <MaxWidthContainer>
          <GridContainer>
            {/* Left side - Text Content */}
            <TextContent>
              <MainTitle>XRPL Token Portfolio</MainTitle>

              {/* Prominent CTA */}
              {!account && (
                <CTAContainer>
                  <CTATitle>
                    Discover and Track XRP Ledger Tokens
                  </CTATitle>
                  <CTAButton>
                    <Icon icon="mdi:wallet" width={20} height={20} />
                    Connect Wallet & Track Tokens
                  </CTAButton>
                </CTAContainer>
              )}

              {/* Introduction */}
              <IntroSection>
                <IntroTitle>
                  Track Your Tokens on the XRPL With Ease
                </IntroTitle>
                <IntroText>
                  Delve into the dynamic world of XRP Ledger tokens. Our platform empowers you, whether you're an investor seeking growth, a developer looking for opportunities, or an enthusiast eager for insights. Experience seamless tracking of token prices and market trends, all in one intuitive DApp
                </IntroText>
              </IntroSection>
            </TextContent>

            {/* Right side - Image Content */}
            <ImageContent>
              <ResponsiveImage
                src="https://s2.coinmarketcap.com/static/cloud/img/portfolio/home/safari-darkmode-v2.png?_=1db0ce4"
                alt="XRP Ledger"
              />
            </ImageContent>
          </GridContainer>
        </MaxWidthContainer>

        {/* Features Section moved to the bottom */}
        <FeaturesSection>
          <FeaturesTitle>
            Key Features
          </FeaturesTitle>
          <FeaturesGrid>
            <FeatureCard>
              <FeatureIcon>
                <Icon icon="mdi:monetization-on" width={60} height={60} />
              </FeatureIcon>
              <FeatureTitle>
                Real-time Prices
              </FeatureTitle>
              <FeatureDescription>
                <ContentTypography>
                  Stay updated with real-time token prices and market data using XRP Ledger.
                </ContentTypography>
              </FeatureDescription>
            </FeatureCard>
            <FeatureCard>
              <FeatureIcon>
                <Icon icon="mdi:bell-ring" width={60} height={60} />
              </FeatureIcon>
              <FeatureTitle>
                Price Alerts
              </FeatureTitle>
              <FeatureDescription>
                <ContentTypography>
                  Set up price alerts to get notified when your favorite tokens reach your desired prices.
                </ContentTypography>
              </FeatureDescription>
            </FeatureCard>
            <FeatureCard>
              <FeatureIcon>
                <Icon icon="mdi:share" width={60} height={60} />
              </FeatureIcon>
              <FeatureTitle>
                Share Portfolio
              </FeatureTitle>
              <FeatureDescription>
                <ContentTypography>
                  Share your portfolio with others or collaborate on token tracking.
                </ContentTypography>
              </FeatureDescription>
            </FeatureCard>
            <FeatureCard>
              <FeatureIcon>
                <Icon icon="mdi:email" width={60} height={60} />
              </FeatureIcon>
              <FeatureTitle>
                News Alerts
              </FeatureTitle>
              <FeatureDescription>
                <ContentTypography>
                  Get immediate News Alerts on XRP Ledger tokens for smart, swift decision-making.
                </ContentTypography>
              </FeatureDescription>
            </FeatureCard>
          </FeaturesGrid>
        </FeaturesSection>
      </ContentBox>
    </FlexContainer>
  );
}
