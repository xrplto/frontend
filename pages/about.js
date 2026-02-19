import React, { useContext, memo, useState, useCallback, useMemo } from 'react';
import api from 'src/utils/api';
import { ThemeContext } from 'src/context/AppContext';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { LineChart, ArrowLeftRight, Palette, TrendingUp, Code, Zap } from 'lucide-react';
import { cn } from 'src/utils/cn';
// Constants
const BASE_URL = 'https://api.xrpl.to/v1';

// Tailwind components
const PageWrapper = ({ className, children, ...p }) => <div className={cn('min-h-screen flex flex-col', className)} {...p}>{children}</div>;

const Container = ({ className, children, ...p }) => <div className={cn('max-w-[1920px] mx-auto px-4 w-full flex-1', className)} {...p}>{children}</div>;

const HeroSection = ({ className, children, ...p }) => <div className={cn('text-center pt-10 pb-6 relative', className)} {...p}>{children}</div>;

const HeroTitle = ({ isDark, className, children, ...p }) => <h1 className={cn('text-[2.5rem] font-semibold mb-3 hidden max-md:text-[2rem]', isDark ? 'text-white' : 'text-black', className)} {...p}>{children}</h1>;

const HeroSubtitle = ({ isDark, className, children, ...p }) => <p className={cn('text-sm max-w-[500px] mx-auto mb-8', isDark ? 'text-white/50' : 'text-black/50', className)} {...p}>{children}</p>;

const StatsRow = ({ className, children, ...p }) => <div className={cn('grid grid-cols-4 gap-3 mb-8 max-sm:grid-cols-2', className)} {...p}>{children}</div>;

const StatCard = ({ isDark, className, children, ...p }) => <div className={cn('text-center py-5 px-4 bg-transparent rounded-lg border', isDark ? 'border-white/[0.08]' : 'border-black/[0.08]', className)} {...p}>{children}</div>;

const StatNumber = ({ className, children, ...p }) => <h2 className={cn('text-2xl font-medium text-[#3b82f6] mb-1', className)} {...p}>{children}</h2>;

const StatLabel = ({ isDark, className, children, ...p }) => <p className={cn('text-[10px] uppercase tracking-[0.5px]', isDark ? 'text-white/50' : 'text-black/50', className)} {...p}>{children}</p>;

const FeaturesSection = ({ className, children, ...p }) => <div className={cn('my-8', className)} {...p}>{children}</div>;

const SectionTitle = ({ isDark, className, children, ...p }) => <h2 className={cn('text-center text-sm font-medium mb-5 tracking-[0.5px]', isDark ? 'text-white/90' : 'text-black', className)} {...p}>{children}</h2>;

const FeatureGrid = ({ className, children, ...p }) => <div className={cn('grid grid-cols-4 gap-3 max-[800px]:grid-cols-2 max-[500px]:grid-cols-1', className)} {...p}>{children}</div>;

const FeatureCard = ({ isDark, className, children, ...p }) => <div className={cn('relative p-4 bg-transparent rounded-lg border', isDark ? 'border-white/[0.08] hover:border-white/[0.15]' : 'border-black/[0.08] hover:border-black/[0.15]', className)} {...p}>{children}</div>;

const FeatureIcon = ({ isDark, className, children, ...p }) => <div className={cn('w-8 h-8 mb-[10px] flex items-center justify-center bg-transparent rounded-md border text-[#3b82f6] [&_svg]:w-4 [&_svg]:h-4', isDark ? 'border-white/[0.12]' : 'border-black/[0.12]', className)} {...p}>{children}</div>;

const FeatureTitle = ({ isDark, className, children, ...p }) => <h3 className={cn('text-xs font-medium mb-1', isDark ? 'text-white/90' : 'text-black', className)} {...p}>{children}</h3>;

const FeatureText = ({ isDark, className, children, ...p }) => <p className={cn('text-[11px] leading-[1.5]', isDark ? 'text-white/50' : 'text-black/50', className)} {...p}>{children}</p>;

const FeesSection = ({ className, children, ...p }) => <div className={cn('my-8', className)} {...p}>{children}</div>;

const FeesGrid = ({ className, children, ...p }) => <div className={cn('grid grid-cols-2 gap-3 max-w-[500px] mx-auto max-[500px]:grid-cols-1', className)} {...p}>{children}</div>;

const FeeCard = ({ isDark, className, children, ...p }) => <div className={cn('text-center py-5 px-4 bg-transparent rounded-lg border', isDark ? 'border-white/[0.08]' : 'border-black/[0.08]', className)} {...p}>{children}</div>;

const FeeAmount = ({ className, children, ...p }) => <div className={cn('text-2xl font-medium text-[#3b82f6] mb-1', className)} {...p}>{children}</div>;

const FeeLabel = ({ isDark, className, children, ...p }) => <div className={cn('text-[11px]', isDark ? 'text-white/50' : 'text-black/50', className)} {...p}>{children}</div>;

const TimelineSection = ({ className, children, ...p }) => <div className={cn('my-8', className)} {...p}>{children}</div>;

const Timeline = ({ className, children, ...p }) => <div className={cn('grid grid-cols-5 gap-3 max-[700px]:grid-cols-3 max-[450px]:grid-cols-2', className)} {...p}>{children}</div>;

const TimelineItem = ({ isDark, className, children, ...p }) => <div className={cn('flex flex-col items-center justify-center py-[14px] px-3 bg-transparent rounded-lg border', isDark ? 'border-white/[0.08]' : 'border-black/[0.08]', className)} {...p}>{children}</div>;

const TimelineContent = ({ className, children, ...p }) => <div className={cn('text-center', className)} {...p}>{children}</div>;

const TimelineDate = ({ className, children, ...p }) => <div className={cn('text-[10px] font-medium text-[#3b82f6] mb-[2px]', className)} {...p}>{children}</div>;

const TimelineText = ({ isDark, className, children, ...p }) => <div className={cn('text-[11px]', isDark ? 'text-white/60' : 'text-black/60', className)} {...p}>{children}</div>;

const FaqSection = ({ isDark, className, children, ...p }) => <div className={cn('mt-8 pt-8 border-t', isDark ? 'border-white/[0.08]' : 'border-black/[0.08]', className)} {...p}>{children}</div>;

const FaqHeader = ({ className, children, ...p }) => <div className={cn('text-center mb-5', className)} {...p}>{children}</div>;

const FaqTitle = ({ isDark, className, children, ...p }) => <h2 className={cn('text-sm font-medium mb-2 hidden', isDark ? 'text-white/90' : 'text-black', className)} {...p}>{children}</h2>;

const FaqSubtitle = ({ isDark, className, children, ...p }) => <h3 className={cn('text-xs mx-auto font-normal', isDark ? 'text-white/50' : 'text-black/50', className)} {...p}>{children}</h3>;

const FaqList = ({ className, children, ...p }) => <div className={cn('flex flex-col gap-2', className)} {...p}>{children}</div>;

const AccordionItem = ({ isDark, className, children, ...p }) => <div className={cn('bg-transparent rounded-lg border overflow-hidden', isDark ? 'border-white/[0.08]' : 'border-black/[0.08]', className)} {...p}>{children}</div>;

const AccordionHeader = ({ isDark, className, children, ...p }) => (
  <button className={cn('w-full py-[14px] px-4 bg-transparent border-none text-left cursor-pointer flex justify-between items-center', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.02]', className)} {...p}>{children}</button>
);

const QuestionText = ({ isDark, className, children, ...p }) => <span className={cn('text-xs font-medium pr-3 flex-1', isDark ? 'text-white/90' : 'text-[#212B36]', className)} {...p}>{children}</span>;

const ExpandIcon = ({ expanded, isDark, className, ...p }) => (
  <svg className={cn('text-[#3b82f6] shrink-0 transition-transform duration-200', expanded && 'rotate-180', className)} {...p} />
);

const AccordionContent = ({ expanded, className, children, ...p }) => <div className={cn('overflow-hidden transition-[max-height] duration-200', className)} style={{ maxHeight: expanded ? '500px' : '0' }} {...p}>{children}</div>;

const AnswerText = ({ isDark, className, children, ...p }) => <p className={cn('px-4 pb-[14px] m-0 leading-[1.6] text-[11px]', isDark ? 'text-white/60' : 'text-black/60', className)} {...p}>{children}</p>;

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
  const { themeName } = useContext(ThemeContext);
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
    // const res = await api.get(`${BASE_URL}/banxa/currencies`);
    // data = res.data;
    // var t2 = performance.now();
    // var dt = (t2 - t1).toFixed(2);
    // console.log(`2. getStaticProps fiats: ${data.fiats.length} took: ${dt}ms`);
  } catch (e) {}

  const ogp = {
    title: 'About XRPL.to | Premier XRP Ledger Analytics Platform',
    url: 'https://xrpl.to/about',
    canonical: 'https://xrpl.to/about',
    imgUrl: 'https://xrpl.to/api/og/about',
    imgType: 'image/png',
    desc: 'XRPL.to tracks 19,000+ tokens with 40,000+ monthly users. Comprehensive XRP Ledger analytics, DEX trading, NFT marketplace, and real-time price data.',
    jsonLd: {
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
    }
  };

  return {
    props: { data, ogp },
    revalidate: 10
  };
}
