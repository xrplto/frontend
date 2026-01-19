import React, { useContext, memo, useState, useCallback, useMemo } from 'react';
import styled from '@emotion/styled';
import axios from 'axios';
import { AppContext } from 'src/AppContext';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { LineChart, ArrowLeftRight, Palette, TrendingUp, Code, Zap } from 'lucide-react';
// Constants
const BASE_URL = 'https://api.xrpl.to/v1';

// Styled components
const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Container = styled.div`
  max-width: 1920px;
  margin: 0 auto;
  padding: 0 16px;
  width: 100%;

  @media (min-width: 768px) {
    padding: 0 16px;
  }
`;

// Hero Section
const HeroSection = styled.div`
  text-align: center;
  padding: 40px 0 24px;
  position: relative;
`;

const HeroTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: ${(props) => (props.isDark ? '#fff' : '#000')};
  display: none;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 14px;
  color: ${(props) => (props.isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)')};
  max-width: 500px;
  margin: 0 auto 32px;
`;

// Stats Row
const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 32px;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div`
  text-align: center;
  padding: 20px 16px;
  background: transparent;
  border-radius: 8px;
  border: 1px solid
    ${(props) => (props.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)')};
`;

const StatNumber = styled.h2`
  font-size: 1.5rem;
  font-weight: 500;
  color: #3b82f6;
  margin-bottom: 4px;
`;

const StatLabel = styled.p`
  font-size: 10px;
  color: ${(props) => (props.isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)')};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

// Features Section
const FeaturesSection = styled.div`
  margin: 32px 0;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 20px;
  color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.9)' : '#000')};
  letter-spacing: 0.5px;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;

  @media (max-width: 800px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled.div`
  position: relative;
  padding: 16px;
  background: transparent;
  border: 1px solid
    ${(props) => (props.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)')};
  border-radius: 8px;

  &:hover {
    border-color: ${(props) =>
      props.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'};
  }
`;

const FeatureIcon = styled.div`
  width: 32px;
  height: 32px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid
    ${(props) => (props.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)')};
  border-radius: 6px;
  color: #3b82f6;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const FeatureTitle = styled.h3`
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 4px;
  color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.9)' : '#000')};
`;

const FeatureText = styled.p`
  font-size: 11px;
  line-height: 1.5;
  color: ${(props) => (props.isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)')};
`;

// Fees Section
const FeesSection = styled.div`
  margin: 32px 0;
`;

const FeesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  max-width: 500px;
  margin: 0 auto;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const FeeCard = styled.div`
  text-align: center;
  padding: 20px 16px;
  background: transparent;
  border-radius: 8px;
  border: 1px solid
    ${(props) => (props.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)')};
`;

const FeeAmount = styled.div`
  font-size: 1.5rem;
  font-weight: 500;
  color: #3b82f6;
  margin-bottom: 4px;
`;

const FeeLabel = styled.div`
  font-size: 11px;
  color: ${(props) => (props.isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)')};
`;

// Timeline Section
const TimelineSection = styled.div`
  margin: 32px 0;
`;

const Timeline = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;

  @media (max-width: 700px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 450px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const TimelineItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 14px 12px;
  background: transparent;
  border: 1px solid
    ${(props) => (props.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)')};
  border-radius: 8px;
`;

const TimelineContent = styled.div`
  text-align: center;
`;

const TimelineDate = styled.div`
  font-size: 10px;
  font-weight: 500;
  color: #3b82f6;
  margin-bottom: 2px;
`;

const TimelineText = styled.div`
  font-size: 11px;
  color: ${(props) => (props.isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)')};
`;

// FAQ Components
const FaqSection = styled.div`
  margin-top: 32px;
  border-top: 1px solid
    ${(props) => (props.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)')};
  padding-top: 32px;
`;

const FaqHeader = styled.div`
  text-align: center;
  margin-bottom: 20px;
`;

const FaqTitle = styled.h2`
  font-size: 14px;
  font-weight: 500;
  color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.9)' : '#000')};
  margin-bottom: 8px;
  display: none;
`;

const FaqSubtitle = styled.h3`
  font-size: 12px;
  color: ${(props) => (props.isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)')};
  margin: 0 auto;
  font-weight: 400;
`;

const FaqList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const AccordionItem = styled.div`
  background: transparent;
  border: 1px solid
    ${(props) => (props.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)')};
  border-radius: 8px;
  overflow: hidden;
`;

const AccordionHeader = styled.button`
  width: 100%;
  padding: 14px 16px;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background-color: ${(props) =>
      props.isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'};
  }
`;

const QuestionText = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.9)' : '#212B36')};
  padding-right: 12px;
  flex: 1;
`;

const ExpandIcon = styled.svg`
  color: #3b82f6;
  flex-shrink: 0;
  transform: ${(props) => (props.expanded ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.2s ease;
`;

const AccordionContent = styled.div`
  max-height: ${(props) => (props.expanded ? '500px' : '0')};
  overflow: hidden;
  transition: max-height 0.2s ease;
`;

const AnswerText = styled.p`
  padding: 0 16px 14px;
  margin: 0;
  line-height: 1.6;
  font-size: 11px;
  color: ${(props) => (props.isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)')};
`;

// Memoized FAQ Item Component
const FAQItem = memo(({ faq, index, isExpanded, onToggle, isDark }) => (
  <AccordionItem isDark={isDark}>
    <AccordionHeader onClick={onToggle} aria-expanded={isExpanded} isDark={isDark}>
      <QuestionText isDark={isDark}>{faq.question}</QuestionText>
      <ExpandIcon
        expanded={isExpanded}
        isDark={isDark}
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
      <AnswerText isDark={isDark}>{faq.answer}</AnswerText>
    </AccordionContent>
  </AccordionItem>
));

function AboutPage() {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleAccordion = useCallback((index) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  }, []);

  const faqs = useMemo(
    () => [
      {
        question: 'How are the prices calculated for the various tokens on xrpl.to?',
        answer:
          'Prices are calculated live using all methods of trading available on the XRP Ledger. The prices reflect real-time market dynamics of the XRP Ledger decentralized exchange (DEX), incorporating data from all trading mechanisms including direct offers, automated market makers (AMMs), and order book transactions to provide the most accurate and current pricing.'
      },
      {
        question: 'What is the XRPL?',
        answer:
          'The XRPL (XRP Ledger) is a fast, energy-efficient, and decentralized blockchain designed for digital payments and tokenization. Built with a unique consensus algorithm, it can process transactions in 3-5 seconds with minimal energy consumption. The XRPL supports native features like decentralized exchange (DEX), automated market makers (AMMs), multi-signing, escrow, and custom token issuance, making it ideal for DeFi applications, cross-border payments, and enterprise solutions.'
      },
      {
        question: 'How do I trade on xrpl.to?',
        answer:
          'To trade on xrpl.to, you need to connect your XRP Ledger-compatible wallet to the DEX. You can use various Web3 wallets to trade at xrpl.to. Once connected, you can browse the available tokens, place buy or sell orders, and execute trades directly on the XRPL with full control of your assets.'
      },
      {
        question:
          'What is the difference between a decentralized exchange (DEX) and a centralized exchange?',
        answer:
          "A decentralized exchange (DEX), like xrpl.to, operates on a blockchain network and allows users to trade tokens directly from their wallets without relying on a centralized intermediary. In contrast, a centralized exchange (CEX) functions as a third-party platform that holds users' funds and facilitates trading on their behalf, requiring users to deposit their assets before trading."
      },
      {
        question: 'How secure is xrpl.to?',
        answer:
          'Xrpl.to operates as a non-custodial interface to the XRP Ledger, meaning your funds never leave your wallet and remain under your complete control. The platform leverages the proven security of the XRP Ledger, which has operated without downtime since 2012 and uses a unique consensus mechanism validated by a global network of independent servers. All transactions are executed directly on-chain, eliminating counterparty risk. For maximum security, always verify transaction details before signing, use hardware wallets when possible, and never share your private keys or seed phrases.'
      },
      {
        question: 'What are the fees for trading on xrpl.to?',
        answer:
          "Xrpl.to charges a 1% trading fee for both token and NFT trades. Additionally, you will encounter standard XRP Ledger network fees (typically a few drops of XRP) for each transaction, which go directly to the blockchain network. Some wallets may also charge their own fees, so we recommend checking your wallet's fee structure."
      },
      {
        question: 'How do I list my token on xrpl.to?',
        answer:
          'Tokens are automatically listed on xrpl.to if they meet all platform requirements. Your token needs to be compatible with the XRP Ledger and satisfy the necessary technical and compliance criteria. Once your token fulfills these requirements, it will appear on the platform without requiring manual submission or approval. For specific listing requirements or assistance, you can reach out to the xrpl.to team.'
      },
      {
        question: 'Can I participate in token sales or initial coin offerings (ICOs) on xrpl.to?',
        answer:
          "Xrpl.to functions as a decentralized exchange for trading tokens that are already issued on the XRP Ledger, rather than hosting token sales or ICOs directly. However, the XRP Ledger's native features enable decentralized token launches through mechanisms like liquidity pools, direct offers, and automated market makers (AMMs). Once tokens are issued and have liquidity, they become tradeable on xrpl.to. For participating in new token launches, you would typically interact directly with the token issuer or use your connected wallet to participate in on-chain distribution events."
      },
      {
        question: 'What is the difference between XRPL and XRP?',
        answer:
          'XRPL (XRP Ledger) is the blockchain infrastructure - a decentralized network that processes transactions and hosts applications like DEXs, AMMs, and smart contracts. XRP is the native token that runs on the XRPL, serving multiple functions: paying network transaction fees, providing liquidity for trading pairs, acting as a bridge currency between different assets, and securing the network through validator incentives. Think of XRPL as the highway system and XRP as the fuel that powers transactions on that highway.'
      },
      {
        question: 'Is xrpl.to available in my country?',
        answer:
          "Xrpl.to is globally accessible as a decentralized interface to the XRP Ledger, available to anyone with an internet connection and a compatible wallet. Since the platform operates as a non-custodial DEX connecting directly to the blockchain, there are no geographic restrictions from our end. However, users are responsible for ensuring compliance with their local laws and regulations regarding digital asset trading. We recommend consulting with local legal experts if you're unsure about the regulatory status of token trading in your jurisdiction."
      },
      {
        question: 'Is there customer support available for xrpl.to?',
        answer:
          'Yes, xrpl.to provides customer support through multiple channels to assist users. You can reach out to the team via X (Twitter) @xrplto for quick responses and updates, email for detailed inquiries, or community forums for peer support and discussions. The support team is available to help with platform-related questions, technical issues, troubleshooting, and general feedback about the platform.'
      }
    ],
    []
  );

  const features = [
    {
      icon: LineChart,
      title: 'Live Price Tracking',
      text: 'Real-time prices for 19,000+ tokens with advanced charts and analytics',
      gradient: 'linear-gradient(135deg, #667eea, #764ba2)'
    },
    {
      icon: ArrowLeftRight,
      title: 'DEX Trading',
      text: 'Trade directly on XRPL DEX with professional tools and order books',
      gradient: 'linear-gradient(135deg, #f093fb, #f5576c)'
    },
    {
      icon: Palette,
      title: 'NFT Marketplace',
      text: 'Explore and trade NFT collections with detailed ownership history',
      gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)'
    },
    {
      icon: TrendingUp,
      title: 'Portfolio Tracker',
      text: 'Monitor your holdings and track performance across all assets',
      gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)'
    },
    {
      icon: Code,
      title: 'API Access',
      text: 'Developer-friendly APIs for seamless integration and data access',
      gradient: 'linear-gradient(135deg, #fa709a, #fee140)'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      text: '3-5 second transactions with minimal fees on XRP Ledger',
      gradient: 'linear-gradient(135deg, #30cfd0, #330867)'
    }
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
      <Header />
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
        About XRPL.to
      </h1>

      <Container>
        {/* Hero Section */}
        <HeroSection>
          <HeroTitle>XRPL.to</HeroTitle>
          <HeroSubtitle isDark={isDark}>
            The premier analytics platform for the XRP Ledger ecosystem
          </HeroSubtitle>

          <StatsRow>
            <StatCard isDark={isDark}>
              <StatNumber>19,000+</StatNumber>
              <StatLabel isDark={isDark}>Tokens Tracked</StatLabel>
            </StatCard>
            <StatCard isDark={isDark}>
              <StatNumber>40,000+</StatNumber>
              <StatLabel isDark={isDark}>Monthly Users</StatLabel>
            </StatCard>
            <StatCard isDark={isDark}>
              <StatNumber>8M+</StatNumber>
              <StatLabel isDark={isDark}>API Queries</StatLabel>
            </StatCard>
            <StatCard isDark={isDark}>
              <StatNumber>Live</StatNumber>
              <StatLabel isDark={isDark}>Data</StatLabel>
            </StatCard>
          </StatsRow>
        </HeroSection>

        {/* Features Section */}
        <FeaturesSection>
          <SectionTitle isDark={isDark}>Platform Features</SectionTitle>
          <FeatureGrid>
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <FeatureCard key={index} isDark={isDark}>
                  <FeatureIcon isDark={isDark}>
                    <IconComponent />
                  </FeatureIcon>
                  <FeatureTitle isDark={isDark}>{feature.title}</FeatureTitle>
                  <FeatureText isDark={isDark}>{feature.text}</FeatureText>
                </FeatureCard>
              );
            })}
          </FeatureGrid>
        </FeaturesSection>

        {/* Fees Section */}
        <FeesSection>
          <SectionTitle isDark={isDark}>Trading Fees</SectionTitle>
          <FeesGrid>
            <FeeCard isDark={isDark}>
              <FeeAmount>1%</FeeAmount>
              <FeeLabel isDark={isDark}>Token Trading</FeeLabel>
            </FeeCard>
            <FeeCard isDark={isDark}>
              <FeeAmount>1%</FeeAmount>
              <FeeLabel isDark={isDark}>NFT Trading</FeeLabel>
            </FeeCard>
          </FeesGrid>
        </FeesSection>

        {/* Timeline Section */}
        <TimelineSection>
          <SectionTitle isDark={isDark}>Our Journey</SectionTitle>
          <Timeline>
            {timelineData.map((item, index) => (
              <TimelineItem key={index} isDark={isDark}>
                <TimelineContent>
                  <TimelineDate>{item.date}</TimelineDate>
                  <TimelineText isDark={isDark}>{item.event}</TimelineText>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </TimelineSection>

        {/* FAQ Section */}
        <FaqSection isDark={isDark}>
          <FaqHeader>
            <FaqTitle>Frequently Asked Questions</FaqTitle>
            <FaqSubtitle isDark={isDark}>
              Find answers to common questions about xrpl.to
            </FaqSubtitle>
          </FaqHeader>

          <FaqList>
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                faq={faq}
                index={index}
                isExpanded={expandedIndex === index}
                onToggle={() => toggleAccordion(index)}
                isDark={isDark}
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
  // https://api.xrpl.to/v1/banxa/currencies
  // const BASE_URL = process.env.API_URL;
  let data = null;
  try {
    // var t1 = performance.now();
    // const res = await axios.get(`${BASE_URL}/banxa/currencies`);
    // data = res.data;
    // var t2 = performance.now();
    // var dt = (t2 - t1).toFixed(2);
    // console.log(`2. getStaticProps fiats: ${data.fiats.length} took: ${dt}ms`);
  } catch (e) {}
  let ret = {};
  if (data) {
    let ogp = {};

    ogp.title = 'About XRPL.to | Premier XRP Ledger Analytics Platform';
    ogp.url = 'https://xrpl.to/about';
    ogp.canonical = 'https://xrpl.to/about';
    ogp.imgUrl = 'https://xrpl.to/static/ogp.webp';
    ogp.desc =
      'XRPL.to tracks 19,000+ tokens with 40,000+ monthly users. Comprehensive XRP Ledger analytics, DEX trading, NFT marketplace, and real-time price data.';

    // FAQPage structured data
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is xrpl.to?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Xrpl.to is a comprehensive platform designed to facilitate seamless interactions within the XRP Ledger (XRPL) ecosystem. As a decentralized exchange (DEX) and analytics hub, xrpl.to enables users to trade tokens and NFTs directly on the XRPL blockchain without intermediaries.'
          }
        },
        {
          '@type': 'Question',
          name: 'How secure is xrpl.to?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Xrpl.to operates as a non-custodial interface to the XRP Ledger, meaning your funds never leave your wallet and remain under your complete control. The platform leverages the proven security of the XRP Ledger, which has operated without downtime since 2012.'
          }
        },
        {
          '@type': 'Question',
          name: 'What are the fees for trading on xrpl.to?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Xrpl.to charges a 1% trading fee for both token and NFT trades. Additionally, you will encounter standard XRP Ledger network fees (typically a few drops of XRP) for each transaction.'
          }
        },
        {
          '@type': 'Question',
          name: 'How do I list my token on xrpl.to?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Tokens are automatically listed on xrpl.to if they meet all platform requirements. Your token needs to be compatible with the XRP Ledger and satisfy the necessary technical and compliance criteria.'
          }
        }
      ]
    };
    ogp.jsonLd = faqSchema;

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
