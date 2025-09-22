import React, { useContext, memo, useState, useCallback, useMemo } from 'react';
import styled from '@emotion/styled';
import axios from 'axios';
import { useTheme } from '@mui/material/styles';
import { AppContext } from 'src/AppContext';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { BASE_URL } from 'src/utils/constants';
import {
  ShowChart,
  SwapHoriz,
  Palette,
  TrendingUp,
  Api,
  FlashOn
} from '@mui/icons-material';

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

// Hero Section
const HeroSection = styled.div`
  text-align: center;
  padding: 80px 0;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, ${props => props.theme?.palette?.primary?.main}10 0%, transparent 70%);
    animation: pulse 20s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1) rotate(0deg); }
    50% { transform: scale(1.1) rotate(180deg); }
  }
`;

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
  background: linear-gradient(135deg, #147DFE 0%, #00D4FF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.25rem;
  color: ${props => props.theme?.palette?.text?.secondary};
  max-width: 600px;
  margin: 0 auto 48px;
  position: relative;
  z-index: 1;
`;

// Stats Row
const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 80px;
  position: relative;
  z-index: 1;
`;

const StatCard = styled.div`
  text-align: center;
  padding: 24px;
  background: ${props => props.theme?.palette?.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.02)'
    : 'rgba(0, 0, 0, 0.02)'};
  border-radius: 16px;
  border: 1px solid ${props => props.theme?.palette?.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(0, 0, 0, 0.05)'};
  backdrop-filter: blur(10px);
`;

const StatNumber = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props => props.theme?.palette?.primary?.main};
  margin-bottom: 8px;
`;

const StatLabel = styled.p`
  font-size: 0.9rem;
  color: ${props => props.theme?.palette?.text?.secondary};
  text-transform: uppercase;
  letter-spacing: 1px;
`;

// Features Section
const FeaturesSection = styled.div`
  margin: 80px 0;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 48px;
  color: ${props => props.theme?.palette?.text?.primary};
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
  margin-bottom: 80px;
`;

const FeatureCard = styled.div`
  position: relative;
  padding: 40px 32px;
  background: ${props => props.theme?.palette?.mode === 'dark'
    ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)'
    : 'linear-gradient(135deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.01) 100%)'};
  border: 1px solid ${props => props.theme?.palette?.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.06)'
    : 'rgba(0, 0, 0, 0.06)'};
  border-radius: 24px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => props.gradient || 'linear-gradient(90deg, #147DFE, #00D4FF)'};
    transform: scaleX(0);
    transition: transform 0.4s ease;
  }

  &:hover {
    transform: translateY(-4px);
    border-color: ${props => props.theme?.palette?.primary?.main}30;

    &::before {
      transform: scaleX(1);
    }
  }
`;

const FeatureIcon = styled.div`
  width: 56px;
  height: 56px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.gradient || 'linear-gradient(135deg, #147DFE, #00D4FF)'};
  border-radius: 16px;
  color: white;

  .MuiSvgIcon-root {
    font-size: 28px;
  }
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: ${props => props.theme?.palette?.text?.primary};
`;

const FeatureText = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: ${props => props.theme?.palette?.text?.secondary};
`;

// Timeline Section
const TimelineSection = styled.div`
  margin: 80px 0;
  position: relative;
`;

const Timeline = styled.div`
  position: relative;
  max-width: 800px;
  margin: 0 auto;

  &::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 2px;
    background: ${props => props.theme?.palette?.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.1)'};
    transform: translateX(-50%);

    @media (max-width: 768px) {
      left: 20px;
    }
  }
`;

const TimelineItem = styled.div`
  display: flex;
  justify-content: ${props => props.align === 'right' ? 'flex-start' : 'flex-end'};
  padding: 20px 0;
  position: relative;

  @media (max-width: 768px) {
    justify-content: flex-start;
    padding-left: 50px;
  }

  &::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 30px;
    width: 12px;
    height: 12px;
    background: ${props => props.theme?.palette?.primary?.main};
    border-radius: 50%;
    transform: translateX(-50%);
    z-index: 1;

    @media (max-width: 768px) {
      left: 20px;
    }
  }
`;

const TimelineContent = styled.div`
  width: 45%;
  padding: 20px;
  background: ${props => props.theme?.palette?.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.03)'
    : 'rgba(0, 0, 0, 0.02)'};
  border: 1px solid ${props => props.theme?.palette?.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.06)'
    : 'rgba(0, 0, 0, 0.06)'};
  border-radius: 12px;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const TimelineDate = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.theme?.palette?.primary?.main};
  margin-bottom: 8px;
`;

const TimelineText = styled.div`
  font-size: 1rem;
  color: ${props => props.theme?.palette?.text?.secondary};
`;

// FAQ Components
const FaqSection = styled.div`
  margin-top: 64px;
  border-top: 1px solid ${(props) =>
    props.theme?.palette?.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 0, 0, 0.05)'};
  padding-top: 48px;
`;

const FaqHeader = styled.div`
  text-align: center;
  margin-bottom: 48px;
`;

const FaqTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(45deg, #147DFE, #2196F3);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 16px;

  @media (min-width: 768px) {
    font-size: 3rem;
  }
`;

const FaqSubtitle = styled.h3`
  font-size: 1.25rem;
  color: ${(props) =>
    props.theme?.palette?.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.6)'
      : 'rgba(0, 0, 0, 0.6)'};
  max-width: 600px;
  margin: 0 auto;
  font-weight: 400;
`;

const FaqList = styled.div`
  max-width: 900px;
  margin: 0 auto;
`;

const AccordionItem = styled.div`
  margin-bottom: 16px;
  background: ${(props) =>
    props.theme?.palette?.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.02)'
      : 'rgba(0, 0, 0, 0.02)'};
  border: 1px solid ${(props) =>
    props.theme?.palette?.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 0, 0, 0.05)'};
  border-radius: 12px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) =>
      props.theme?.palette?.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.04)'
        : 'rgba(0, 0, 0, 0.04)'};
    border-color: ${(props) =>
      props.theme?.palette?.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0, 0, 0, 0.08)'};
  }
`;

const AccordionHeader = styled.button`
  width: 100%;
  padding: 20px 24px;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${(props) =>
      props.theme?.palette?.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.06)'
        : 'rgba(0, 0, 0, 0.06)'};
  }
`;

const QuestionText = styled.span`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${(props) => props.theme?.palette?.text?.primary || '#212B36'};
  padding-right: 16px;
  flex: 1;
`;

const ExpandIcon = styled.svg`
  color: ${(props) => props.theme?.palette?.primary?.main || '#147DFE'};
  transition: transform 0.3s ease;
  flex-shrink: 0;
  transform: ${(props) => props.expanded ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const AccordionContent = styled.div`
  max-height: ${(props) => props.expanded ? '500px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease;
`;

const AnswerText = styled.p`
  padding: 0 24px 24px;
  margin: 0;
  line-height: 1.7;
  font-size: 1.05rem;
  color: ${(props) =>
    props.theme?.palette?.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.7)'
      : 'rgba(0, 0, 0, 0.6)'};
`;

// Memoized FAQ Item Component
const FAQItem = memo(({ faq, index, isExpanded, onToggle, theme }) => (
  <AccordionItem theme={theme}>
    <AccordionHeader onClick={onToggle} aria-expanded={isExpanded} theme={theme}>
      <QuestionText theme={theme}>{faq.question}</QuestionText>
      <ExpandIcon
        expanded={isExpanded}
        theme={theme}
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7 10l5 5 5-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </ExpandIcon>
    </AccordionHeader>
    <AccordionContent expanded={isExpanded}>
      <AnswerText theme={theme}>{faq.answer}</AnswerText>
    </AccordionContent>
  </AccordionItem>
));

function AboutPage() {
  const theme = useTheme();
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleAccordion = useCallback((index) => {
    setExpandedIndex(prev => prev === index ? null : index);
  }, []);

  const faqs = useMemo(() => [
    {
      question: 'How are the prices calculated for the various tokens on xrpl.to?',
      answer: 'Prices are calculated live using all methods of trading available on the XRP Ledger. The prices reflect real-time market dynamics of the XRP Ledger decentralized exchange (DEX), incorporating data from all trading mechanisms including direct offers, automated market makers (AMMs), and order book transactions to provide the most accurate and current pricing.'
    },
    {
      question: 'What is the XRPL?',
      answer: 'The XRPL (XRP Ledger) is a fast, energy-efficient, and decentralized blockchain designed for digital payments and tokenization. Built with a unique consensus algorithm, it can process transactions in 3-5 seconds with minimal energy consumption. The XRPL supports native features like decentralized exchange (DEX), automated market makers (AMMs), multi-signing, escrow, and custom token issuance, making it ideal for DeFi applications, cross-border payments, and enterprise solutions.'
    },
    {
      question: 'How do I trade on xrpl.to?',
      answer: 'To trade on xrpl.to, you need to connect your XRP Ledger-compatible wallet to the DEX. You can use wallets such as Xaman, Crossmark, and Gem Wallet to trade at xrpl.to. Once connected, you can browse the available tokens, place buy or sell orders, and execute trades directly on the XRPL with full control of your assets.'
    },
    {
      question: 'What is the difference between a decentralized exchange (DEX) and a centralized exchange?',
      answer: 'A decentralized exchange (DEX), like xrpl.to, operates on a blockchain network and allows users to trade tokens directly from their wallets without relying on a centralized intermediary. In contrast, a centralized exchange (CEX) functions as a third-party platform that holds users\' funds and facilitates trading on their behalf, requiring users to deposit their assets before trading.'
    },
    {
      question: 'How secure is xrpl.to?',
      answer: 'Xrpl.to operates as a non-custodial interface to the XRP Ledger, meaning your funds never leave your wallet and remain under your complete control. The platform leverages the proven security of the XRP Ledger, which has operated without downtime since 2012 and uses a unique consensus mechanism validated by a global network of independent servers. All transactions are executed directly on-chain, eliminating counterparty risk. For maximum security, always verify transaction details before signing, use hardware wallets when possible, and never share your private keys or seed phrases.'
    },
    {
      question: 'What are the fees for trading on xrpl.to?',
      answer: 'There are no fees to trade on xrpl.to itself. The platform is completely free to use. However, you will encounter standard XRP Ledger network fees (typically a few drops of XRP) for each transaction, which go directly to the blockchain network. Additionally, some wallets like Xaman may charge their own fees, so we recommend checking your wallet\'s fee structure. These minimal network costs ensure fast transaction processing and network security.'
    },
    {
      question: 'How do I list my token on xrpl.to?',
      answer: 'Tokens are automatically listed on xrpl.to if they meet all platform requirements. Your token needs to be compatible with the XRP Ledger and satisfy the necessary technical and compliance criteria. Once your token fulfills these requirements, it will appear on the platform without requiring manual submission or approval. For specific listing requirements or assistance, you can reach out to the xrpl.to team.'
    },
    {
      question: 'Can I participate in token sales or initial coin offerings (ICOs) on xrpl.to?',
      answer: 'Xrpl.to functions as a decentralized exchange for trading tokens that are already issued on the XRP Ledger, rather than hosting token sales or ICOs directly. However, the XRP Ledger\'s native features enable decentralized token launches through mechanisms like liquidity pools, direct offers, and automated market makers (AMMs). Once tokens are issued and have liquidity, they become tradeable on xrpl.to. For participating in new token launches, you would typically interact directly with the token issuer or use your connected wallet to participate in on-chain distribution events.'
    },
    {
      question: 'What is the difference between XRPL and XRP?',
      answer: 'XRPL (XRP Ledger) is the blockchain infrastructure - a decentralized network that processes transactions and hosts applications like DEXs, AMMs, and smart contracts. XRP is the native token that runs on the XRPL, serving multiple functions: paying network transaction fees, providing liquidity for trading pairs, acting as a bridge currency between different assets, and securing the network through validator incentives. Think of XRPL as the highway system and XRP as the fuel that powers transactions on that highway.'
    },
    {
      question: 'Is xrpl.to available in my country?',
      answer: 'Xrpl.to is globally accessible as a decentralized interface to the XRP Ledger, available to anyone with an internet connection and a compatible wallet. Since the platform operates as a non-custodial DEX connecting directly to the blockchain, there are no geographic restrictions from our end. However, users are responsible for ensuring compliance with their local laws and regulations regarding digital asset trading. We recommend consulting with local legal experts if you\'re unsure about the regulatory status of token trading in your jurisdiction.'
    },
    {
      question: 'Is there customer support available for xrpl.to?',
      answer: 'Yes, xrpl.to provides customer support through multiple channels to assist users. You can reach out to the team via X (Twitter) @xrplto for quick responses and updates, email for detailed inquiries, or community forums for peer support and discussions. The support team is available to help with platform-related questions, technical issues, troubleshooting, and general feedback about the platform.'
    }
  ], []);

  const features = [
    { icon: ShowChart, title: 'Live Price Tracking', text: 'Real-time prices for 19,000+ tokens with advanced charts and analytics', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
    { icon: SwapHoriz, title: 'DEX Trading', text: 'Trade directly on XRPL DEX with professional tools and order books', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
    { icon: Palette, title: 'NFT Marketplace', text: 'Explore and trade NFT collections with detailed ownership history', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
    { icon: TrendingUp, title: 'Portfolio Tracker', text: 'Monitor your holdings and track performance across all assets', gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
    { icon: Api, title: 'API Access', text: 'Developer-friendly APIs for seamless integration and data access', gradient: 'linear-gradient(135deg, #fa709a, #fee140)' },
    { icon: FlashOn, title: 'Lightning Fast', text: '3-5 second transactions with minimal fees on XRP Ledger', gradient: 'linear-gradient(135deg, #30cfd0, #330867)' }
  ];

  const timelineData = [
    { date: 'Nov 2021', event: 'XRPL.to Launches' },
    { date: 'Jul 2022', event: 'XRPL Grants Wave 3' },
    { date: 'Feb 2023', event: 'Full XRPL History' },
    { date: 'Apr 2023', event: 'Public API Released' },
    { date: 'Aug 2025', event: '40,000 Monthly Users' }
  ];

  return (
    <PageWrapper>
      <Topbar />
      <Header />

      <Container>
        {/* Hero Section */}
        <HeroSection theme={theme}>
          <HeroTitle>XRPL.to</HeroTitle>
          <HeroSubtitle theme={theme}>
            The premier analytics platform for the XRP Ledger ecosystem
          </HeroSubtitle>

          <StatsRow>
            <StatCard theme={theme}>
              <StatNumber theme={theme}>19,000+</StatNumber>
              <StatLabel theme={theme}>Tokens Tracked</StatLabel>
            </StatCard>
            <StatCard theme={theme}>
              <StatNumber theme={theme}>40,000+</StatNumber>
              <StatLabel theme={theme}>Monthly Users</StatLabel>
            </StatCard>
            <StatCard theme={theme}>
              <StatNumber theme={theme}>8M+</StatNumber>
              <StatLabel theme={theme}>API Queries</StatLabel>
            </StatCard>
            <StatCard theme={theme}>
              <StatNumber theme={theme}>3-5 sec</StatNumber>
              <StatLabel theme={theme}>Transaction Speed</StatLabel>
            </StatCard>
          </StatsRow>
        </HeroSection>

        {/* Features Section */}
        <FeaturesSection>
          <SectionTitle theme={theme}>Platform Features</SectionTitle>
          <FeatureGrid>
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <FeatureCard key={index} theme={theme} gradient={feature.gradient}>
                  <FeatureIcon gradient={feature.gradient}>
                    <IconComponent />
                  </FeatureIcon>
                  <FeatureTitle theme={theme}>{feature.title}</FeatureTitle>
                  <FeatureText theme={theme}>{feature.text}</FeatureText>
                </FeatureCard>
              );
            })}
          </FeatureGrid>
        </FeaturesSection>

        {/* Timeline Section */}
        <TimelineSection>
          <SectionTitle theme={theme}>Our Journey</SectionTitle>
          <Timeline theme={theme}>
            {timelineData.map((item, index) => (
              <TimelineItem key={index} align={index % 2 === 0 ? 'left' : 'right'} theme={theme}>
                <TimelineContent theme={theme}>
                  <TimelineDate theme={theme}>{item.date}</TimelineDate>
                  <TimelineText theme={theme}>{item.event}</TimelineText>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </TimelineSection>

        {/* FAQ Section */}
        <FaqSection theme={theme}>
          <FaqHeader>
            <FaqTitle>Frequently Asked Questions</FaqTitle>
            <FaqSubtitle theme={theme}>Find answers to common questions about xrpl.to</FaqSubtitle>
          </FaqHeader>

          <FaqList>
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                faq={faq}
                index={index}
                isExpanded={expandedIndex === index}
                onToggle={() => toggleAccordion(index)}
                theme={theme}
              />
            ))}
          </FaqList>
        </FaqSection>
      </Container>

      <Footer />
    </PageWrapper>
  );
}

export default memo(AboutPage);

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
