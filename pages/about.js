import React, { useContext, memo, useState, useCallback, useMemo } from 'react';
import api from 'src/utils/api';
import { ThemeContext } from 'src/context/AppContext';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { LineChart, ArrowLeftRight, Palette, TrendingUp, Code, Zap, Twitter, Send } from 'lucide-react';
import { cn } from 'src/utils/cn';
// Constants
const BASE_URL = 'https://api.xrpl.to/v1';

// Tailwind components
const PageWrapper = ({ className, children, ...p }) => <div className={cn('min-h-screen flex flex-col', className)} {...p}>{children}</div>;

const Container = ({ className, children, ...p }) => <div className={cn('max-w-[1920px] mx-auto px-4 w-full flex-1', className)} {...p}>{children}</div>;

const HeroSection = ({ className, children, ...p }) => <div className={cn('text-center pt-10 pb-8 relative', className)} {...p}>{children}</div>;

const HeroTitle = ({ isDark, className, children, ...p }) => <h1 className={cn('text-[2.5rem] font-semibold mb-3 hidden max-md:text-[2rem]', isDark ? 'text-white' : 'text-black', className)} {...p}>{children}</h1>;

const HeroSubtitle = ({ isDark, className, children, ...p }) => <p className={cn('text-sm max-w-[500px] mx-auto mb-8', isDark ? 'text-white/50' : 'text-black/50', className)} {...p}>{children}</p>;

const StatsRow = ({ className, children, ...p }) => <div className={cn('grid grid-cols-4 gap-4 max-sm:grid-cols-2', className)} {...p}>{children}</div>;

const StatCard = ({ isDark, className, children, ...p }) => <div className={cn('text-center py-5 px-4 bg-transparent rounded-lg border', isDark ? 'border-white/[0.08]' : 'border-black/[0.08]', className)} {...p}>{children}</div>;

const StatNumber = ({ className, children, ...p }) => <h2 className={cn('text-2xl font-medium text-[#3b82f6] mb-1', className)} {...p}>{children}</h2>;

const StatLabel = ({ isDark, className, children, ...p }) => <p className={cn('text-[10px] uppercase tracking-[0.5px]', isDark ? 'text-white/50' : 'text-black/50', className)} {...p}>{children}</p>;

const FeaturesSection = ({ className, children, ...p }) => <div className={cn('py-8', className)} {...p}>{children}</div>;

const SectionTitle = ({ isDark, className, children, ...p }) => <h2 className={cn('text-center text-sm font-medium mb-6 tracking-[0.5px]', isDark ? 'text-white/90' : 'text-black', className)} {...p}>{children}</h2>;

const FeatureGrid = ({ className, children, ...p }) => <div className={cn('grid grid-cols-3 gap-4 max-[600px]:grid-cols-2 max-[400px]:grid-cols-1', className)} {...p}>{children}</div>;

const FeatureCard = ({ isDark, className, children, ...p }) => <div className={cn('relative p-4 bg-transparent rounded-lg border', isDark ? 'border-white/[0.08] hover:border-white/[0.15]' : 'border-black/[0.08] hover:border-black/[0.15]', className)} {...p}>{children}</div>;

const FeatureIcon = ({ isDark, className, children, ...p }) => <div className={cn('w-7 h-7 mb-2 flex items-center justify-center bg-transparent rounded-md border text-[#3b82f6] [&_svg]:w-3.5 [&_svg]:h-3.5', isDark ? 'border-white/[0.12]' : 'border-black/[0.12]', className)} {...p}>{children}</div>;

const FeatureTitle = ({ isDark, className, children, ...p }) => <h3 className={cn('text-xs font-medium mb-1', isDark ? 'text-white/90' : 'text-black', className)} {...p}>{children}</h3>;

const FeatureText = ({ isDark, className, children, ...p }) => <p className={cn('text-[11px] leading-[1.5]', isDark ? 'text-white/50' : 'text-black/50', className)} {...p}>{children}</p>;

const FeesSection = ({ className, children, ...p }) => <div className={cn('py-8', className)} {...p}>{children}</div>;

const FeesGrid = ({ className, children, ...p }) => <div className={cn('grid grid-cols-2 gap-4 max-[500px]:grid-cols-1', className)} {...p}>{children}</div>;

const FeeCard = ({ isDark, className, children, ...p }) => <div className={cn('text-center py-6 px-4 bg-transparent rounded-lg border', isDark ? 'border-white/[0.08]' : 'border-black/[0.08]', className)} {...p}>{children}</div>;

const FeeAmount = ({ className, children, ...p }) => <div className={cn('text-2xl font-medium text-[#3b82f6] mb-1', className)} {...p}>{children}</div>;

const FeeLabel = ({ isDark, className, children, ...p }) => <div className={cn('text-[11px]', isDark ? 'text-white/50' : 'text-black/50', className)} {...p}>{children}</div>;

const TimelineSection = ({ className, children, ...p }) => <div className={cn('py-8', className)} {...p}>{children}</div>;

const Timeline = ({ className, children, ...p }) => <div className={cn('grid grid-cols-3 gap-4 max-[600px]:grid-cols-2', className)} {...p}>{children}</div>;

const TimelineItem = ({ isDark, className, children, ...p }) => <div className={cn('flex flex-col items-center justify-center py-[14px] px-3 bg-transparent rounded-lg border', isDark ? 'border-white/[0.08]' : 'border-black/[0.08]', className)} {...p}>{children}</div>;

const TimelineContent = ({ className, children, ...p }) => <div className={cn('text-center', className)} {...p}>{children}</div>;

const TimelineDate = ({ className, children, ...p }) => <div className={cn('text-[10px] font-medium text-[#3b82f6] mb-[2px]', className)} {...p}>{children}</div>;

const TimelineText = ({ isDark, className, children, ...p }) => <div className={cn('text-[11px]', isDark ? 'text-white/60' : 'text-black/60', className)} {...p}>{children}</div>;

const SocialSection = ({ className, children, ...p }) => <div className={cn('py-8', className)} {...p}>{children}</div>;

const SocialGrid = ({ className, children, ...p }) => <div className={cn('grid grid-cols-4 gap-4 max-[500px]:grid-cols-2', className)} {...p}>{children}</div>;

const SocialCard = ({ isDark, className, children, ...p }) => (
  <a
    className={cn(
      'flex flex-col items-center gap-2 py-5 px-4 bg-transparent rounded-lg border no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] focus-visible:ring-offset-1',
      isDark ? 'border-white/[0.08] hover:border-white/[0.15] text-white/70 hover:text-[#3b82f6]' : 'border-black/[0.08] hover:border-black/[0.15] text-black/70 hover:text-[#3b82f6]',
      className
    )}
    target="_blank"
    rel="noreferrer noopener"
    {...p}
  >
    {children}
  </a>
);

const SocialLabel = ({ isDark, className, children, ...p }) => <span className={cn('text-xs font-medium', className)} {...p}>{children}</span>;

const RedditIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
  </svg>
);

const DiscordIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const SOCIALS = [
  { href: 'https://twitter.com/xrplto', label: 'Twitter', Icon: Twitter },
  { href: 'https://t.me/xrplto/', label: 'Telegram', Icon: Send },
  { href: 'https://www.reddit.com/r/xrplto/', label: 'Reddit', Icon: RedditIcon },
  { href: 'https://xrpl.to/discord/', label: 'Discord', Icon: DiscordIcon }
];

const FaqSection = ({ isDark, className, children, ...p }) => <div className={cn('py-8 mt-4 border-t', isDark ? 'border-white/[0.08]' : 'border-black/[0.08]', className)} {...p}>{children}</div>;

const FaqHeader = ({ className, children, ...p }) => <div className={cn('text-center mb-5', className)} {...p}>{children}</div>;

const FaqTitle = ({ isDark, className, children, ...p }) => <h2 className={cn('text-sm font-medium mb-2 hidden', isDark ? 'text-white/90' : 'text-black', className)} {...p}>{children}</h2>;

const FaqSubtitle = ({ isDark, className, children, ...p }) => <h3 className={cn('text-xs mx-auto font-normal', isDark ? 'text-white/50' : 'text-black/50', className)} {...p}>{children}</h3>;

const FaqList = ({ className, children, ...p }) => <div className={cn('flex flex-col gap-3', className)} {...p}>{children}</div>;

const AccordionItem = ({ isDark, className, children, ...p }) => <div className={cn('bg-transparent rounded-lg border overflow-hidden', isDark ? 'border-white/[0.08]' : 'border-black/[0.08]', className)} {...p}>{children}</div>;

const AccordionHeader = ({ isDark, className, children, ...p }) => (
  <button className={cn('w-full py-[14px] px-4 bg-transparent border-none text-left cursor-pointer flex justify-between items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] focus-visible:ring-offset-1', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.02]', className)} {...p}>{children}</button>
);

const QuestionText = ({ isDark, className, children, ...p }) => <span className={cn('text-xs font-medium pr-3 flex-1', isDark ? 'text-white/90' : 'text-[#212B36]', className)} {...p}>{children}</span>;

const ExpandIcon = ({ expanded, isDark, className, ...p }) => (
  <svg className={cn('text-[#3b82f6] shrink-0 transition-transform duration-200', expanded && 'rotate-180', className)} {...p} />
);

const AccordionContent = ({ expanded, id, className, children, ...p }) => <div role="region" id={id} className={cn('overflow-hidden transition-[max-height] duration-200', className)} style={{ maxHeight: expanded ? '500px' : '0' }} {...p}>{children}</div>;

const AnswerText = ({ isDark, className, children, ...p }) => <p className={cn('px-4 pb-[14px] m-0 leading-[1.6] text-[11px]', isDark ? 'text-white/60' : 'text-black/60', className)} {...p}>{children}</p>;

// Memoized FAQ Item Component
const FAQItem = memo(({ faq, index, isExpanded, onToggle, isDark }) => {
  const headerId = `faq-header-${index}`;
  const panelId = `faq-panel-${index}`;
  return (
    <AccordionItem isDark={isDark}>
      <AccordionHeader id={headerId} onClick={onToggle} aria-expanded={isExpanded} aria-controls={panelId} isDark={isDark}>
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
      <AccordionContent expanded={isExpanded} id={panelId} aria-labelledby={headerId}>
        <AnswerText isDark={isDark}>{faq.answer}</AnswerText>
      </AccordionContent>
    </AccordionItem>
  );
});

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
        question: 'What kind of wallet does xrpl.to use?',
        answer:
          'xrpl.to uses an embedded client-side encrypted wallet powered by device binding and password protection. All encryption and decryption happens entirely in your browser using industry-standard methods (AES-GCM). The wallet is fully non-custodial — xrpl.to never has access to your private keys. You are solely responsible for managing your private seed and storing it securely as a backup. If you lose your seed and your device, there is no way to recover your funds.'
      },
      {
        question: 'How secure is xrpl.to?',
        answer:
          'Xrpl.to operates as a non-custodial interface to the XRP Ledger, meaning your funds never leave your device and are protected by device binding and password. The platform leverages the proven security of the XRP Ledger, which has operated without downtime since 2012 and uses a unique consensus mechanism validated by a global network of independent servers. All transactions are executed directly on-chain, eliminating counterparty risk. For maximum security, always verify transaction details before signing, use hardware wallets when possible, and never share your private keys or seed phrases.'
      },
      {
        question: 'What are the fees for trading on xrpl.to?',
        answer:
          "Xrpl.to charges a 0.8% trading fee for token trades. NFT trading is completely free with 0% fees. Additionally, you will encounter standard XRP Ledger network fees (typically a few drops of XRP) for each transaction, which go directly to the blockchain network. Some wallets may also charge their own fees, so we recommend checking your wallet's fee structure."
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
      text: 'Real-time prices for 19,000+ tokens with advanced charts and analytics. All token and NFT images hosted directly, optimized for speed.',
      gradient: 'linear-gradient(135deg, #667eea, #764ba2)'
    },
    {
      icon: ArrowLeftRight,
      title: 'DEX Trading',
      text: 'Trade tokens and NFTs directly on the XRPL DEX with a built-in social layer. No third-party dependencies.',
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
      text: '140+ endpoints covering tokens, NFTs, AMM pools, trader analytics, and market history. LLM and AI friendly.',
      gradient: 'linear-gradient(135deg, #fa709a, #fee140)'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      text: '3,000+ transactions per second with lightning-fast confirmation. High-speed data feeds for bots and algorithmic strategies.',
      gradient: 'linear-gradient(135deg, #30cfd0, #330867)'
    }
  ];

  const timelineData = [
    { date: 'Nov 2021', event: 'XRPL.to Launches' },
    { date: 'Jul 2022', event: 'XRPL Grants Wave 3' },
    { date: 'Feb 2023', event: 'Full XRPL History' },
    { date: 'Apr 2023', event: 'Public API Released' },
    { date: 'Aug 2025', event: '40,000 Monthly Users' },
    { date: 'Feb 2026', event: 'Relaunch New xrpl.to Platform Rebuild' }
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

      <main>
      <Container>
        {/* Hero Section */}
        <section aria-label="Platform overview">
        <HeroSection>
          <HeroTitle>XRPL.to</HeroTitle>
          <HeroSubtitle isDark={isDark}>
            A high-performance SocialFi trading platform built entirely on the XRP Ledger
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
        </section>

        {/* Features Section */}
        <section aria-label="Platform features">
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
        </section>

        {/* Fees Section */}
        <section aria-label="Trading fees">
        <FeesSection>
          <SectionTitle isDark={isDark}>Trading Fees</SectionTitle>
          <FeesGrid>
            <FeeCard isDark={isDark}>
              <FeeAmount>0.8%</FeeAmount>
              <FeeLabel isDark={isDark}>Token Trading (currently FREE)</FeeLabel>
            </FeeCard>
            <FeeCard isDark={isDark}>
              <FeeAmount>0%</FeeAmount>
              <FeeLabel isDark={isDark}>Free NFT Trading</FeeLabel>
            </FeeCard>
          </FeesGrid>
        </FeesSection>
        </section>

        {/* Timeline Section */}
        <section aria-label="Our journey">
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
        </section>

        {/* Social / Community Section */}
        <section aria-label="Community links">
        <SocialSection>
          <SectionTitle isDark={isDark}>Community</SectionTitle>
          <SocialGrid>
            {SOCIALS.map((social) => (
              <SocialCard key={social.label} href={social.href} isDark={isDark}>
                <social.Icon size={20} />
                <SocialLabel isDark={isDark}>{social.label}</SocialLabel>
              </SocialCard>
            ))}
          </SocialGrid>
        </SocialSection>
        </section>

        {/* FAQ Section */}
        <section aria-label="Frequently asked questions">
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
        </section>
      </Container>
      </main>

      <Footer />
    </PageWrapper>
  );
}

export default memo(AboutPage);

// This function gets called at build time on server-side.
export async function getStaticProps() {
  const ogp = {
    title: 'About XRPL.to | Premier XRP Ledger Analytics Platform',
    url: 'https://xrpl.to/about',
    canonical: 'https://xrpl.to/about',
    imgUrl: 'https://xrpl.to/api/og/about',
    imgType: 'image/png',
    desc: 'XRPL.to is a high-performance DEX and SocialFi platform on the XRP Ledger. 19,000+ tokens, 40,000+ monthly users, 140+ API endpoints, and no third-party dependencies.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is xrpl.to?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Xrpl.to is a high-speed decentralized exchange (DEX) and SocialFi platform on the XRP Ledger. Users can trade tokens and NFTs, communicate through a built-in social layer, and interact with 140+ API endpoints. All data is sourced directly from the XRP Ledger with no third-party dependencies.'
          }
        },
        {
          '@type': 'Question',
          name: 'How secure is xrpl.to?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Xrpl.to operates as a non-custodial interface to the XRP Ledger, meaning your funds never leave your device and are protected by device binding and password. The platform leverages the proven security of the XRP Ledger, which has operated without downtime since 2012.'
          }
        },
        {
          '@type': 'Question',
          name: 'What are the fees for trading on xrpl.to?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Xrpl.to charges a 0.8% trading fee for token trades. NFT trading is completely free with 0% fees. Additionally, you will encounter standard XRP Ledger network fees (typically a few drops of XRP) for each transaction.'
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
    props: { ogp }
  };
}
