import React, { useState } from 'react';
import axios from 'axios';
// import { performance } from 'perf_hooks';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { BASE_URL } from 'src/utils/constants';

function FAQPage() {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleAccordion = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const faqs = [
    {
      question: 'How are the prices calculated for the various cryptocurrencies on xrpl.to?',
      answer:
        'The prices of cryptocurrencies on xrpl.to are determined by the market dynamics of the XRP Ledger decentralized exchange (DEX). The prices are based on the supply and demand of the tokens traded on the XRPL, taking into account the latest executed trades and order book data.'
    },
    {
      question: 'What is the XRPL?',
      answer:
        'The XRPL, or XRP Ledger, is an open-source blockchain and decentralized digital asset platform. It serves as the underlying technology for the XRP cryptocurrency and provides a secure and efficient infrastructure for issuing, transferring, and trading tokens.'
    },
    {
      question: 'How do I trade on xrpl.to?',
      answer:
        'To trade on xrpl.to, you need to connect your XRP Ledger-compatible wallet to the DEX. You can use wallets such as XUMM, XRPL Wallet, or XRP Toolkit. Once connected, you can browse the available tokens, place buy or sell orders, and execute trades directly on the XRPL.'
    },
    {
      question:
        'What is the difference between a decentralized exchange (DEX) and a centralized exchange?',
      answer:
        "A decentralized exchange (DEX), like xrpl.to, operates on a blockchain network and allows users to trade cryptocurrencies directly from their wallets without relying on a centralized intermediary. In contrast, a centralized exchange (CEX) functions as a third-party platform that holds users' funds and facilitates trading on their behalf."
    },
    {
      question: 'How secure is xrpl.to?',
      answer:
        "Xrpl.to leverages the security and immutability of the XRP Ledger, which is a decentralized and well-established blockchain network. As a non-custodial DEX, xrpl.to does not hold users' funds, minimizing the risk of centralized hacks or theft. However, it's important to ensure the security of your own wallet and exercise caution when interacting with any online platform."
    },
    {
      question: 'What are the fees for trading on xrpl.to?',
      answer:
        'Xrpl.to operates with a fee structure that is typically lower compared to many centralized exchanges. The fees vary depending on the specific trade and the network congestion at the time. The fees primarily cover the transaction costs on the XRP Ledger, including network fees and ledger reserves.'
    },
    {
      question: 'How do I list my token on xrpl.to?',
      answer:
        'To list your token on xrpl.to, you need to ensure that your token is compatible with the XRP Ledger and meets the necessary technical requirements. You can reach out to the xrpl.to team or follow the guidelines provided on the platform to initiate the listing process. Please note that listing decisions are subject to evaluation and compliance checks.'
    },
    {
      question: 'Can I participate in token sales or initial coin offerings (ICOs) on xrpl.to?',
      answer:
        "Xrpl.to is primarily a decentralized exchange for trading existing tokens on the XRP Ledger. It does not directly facilitate token sales or ICOs. However, if a token sale is conducted using the XRP Ledger's decentralized issuance capabilities, you may be able to participate in such sales through compatible wallets."
    },
    {
      question: 'What is the difference between XRPL and XRP?',
      answer:
        'XRPL stands for XRP Ledger, which is the underlying technology and blockchain network that powers the XRP cryptocurrency. XRP is the native digital asset of the XRP Ledger and serves as a bridge currency for facilitating fast and low-cost transactions between different currencies.'
    },
    {
      question: 'Is xrpl.to available in my country?',
      answer:
        "Xrpl.to is accessible to users worldwide, as long as they have an internet connection and a compatible XRP Ledger wallet. However, it's important to comply with the local regulations and legal requirements regarding cryptocurrency trading in your country."
    },
    {
      question: 'Is there customer support available for xrpl.to?',
      answer:
        'Xrpl.to provides customer support through various channels, including email and community forums. You can reach out to the xrpl.to support team for assistance with any platform-related inquiries, technical issues, or general feedback.'
    }
  ];

  return (
    <div>
      <div id="back-to-top-anchor" />
      <Topbar />
      <Header />

      <div className="container">
        <div className="faq-header">
          <h1 className="gradient-title">
            Frequently Asked Questions
          </h1>
          <h2 className="subtitle">
            Find answers to common questions about xrpl.to
          </h2>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div className="accordion-item" key={index}>
              <button
                className={`accordion-header ${expandedIndex === index ? 'expanded' : ''}`}
                onClick={() => toggleAccordion(index)}
                aria-expanded={expandedIndex === index}
              >
                <span className="question-text">{faq.question}</span>
                <svg
                  className="expand-icon"
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
                </svg>
              </button>
              <div className={`accordion-content ${expandedIndex === index ? 'expanded' : ''}`}>
                <p className="answer-text">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />

      <style jsx>{`
        .container {
          max-width: 1536px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .faq-header {
          text-align: center;
          margin: 48px 0;
        }

        .gradient-title {
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(45deg, #9c27b0, #e91e63);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 16px;
        }

        @media (min-width: 768px) {
          .gradient-title {
            font-size: 3.5rem;
          }
        }

        .subtitle {
          font-size: 1.25rem;
          color: rgba(0,0,0,0.6);
          max-width: 600px;
          margin: 0 auto;
          font-weight: 400;
        }

        .faq-list {
          max-width: 900px;
          margin: 0 auto;
        }

        .accordion-item {
          margin-bottom: 16px;
          background: linear-gradient(135deg, rgba(33,150,243,0.03), rgba(156,39,176,0.03));
          border: 1px solid rgba(0,0,0,0.12);
          border-radius: 8px;
          overflow: hidden;
        }

        .accordion-header {
          width: 100%;
          padding: 20px 24px;
          background: transparent;
          border: none;
          text-align: left;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: background-color 0.3s ease;
        }

        .accordion-header:hover {
          background-color: rgba(33,150,243,0.06);
        }

        .question-text {
          font-size: 1.125rem;
          font-weight: 600;
          color: rgba(0,0,0,0.87);
          padding-right: 16px;
          flex: 1;
        }

        .expand-icon {
          color: #1976d2;
          transition: transform 0.3s ease;
          flex-shrink: 0;
        }

        .accordion-header.expanded .expand-icon {
          transform: rotate(180deg);
        }

        .accordion-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .accordion-content.expanded {
          max-height: 500px;
        }

        .answer-text {
          padding: 0 24px 24px;
          margin: 0;
          line-height: 1.7;
          font-size: 1.05rem;
          color: rgba(0,0,0,0.6);
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .subtitle {
            color: rgba(255,255,255,0.6);
          }

          .accordion-item {
            background: linear-gradient(135deg, rgba(33,150,243,0.08), rgba(156,39,176,0.08));
            border: 1px solid rgba(255,255,255,0.12);
          }

          .accordion-header:hover {
            background-color: rgba(33,150,243,0.12);
          }

          .question-text {
            color: rgba(255,255,255,0.87);
          }

          .answer-text {
            color: rgba(255,255,255,0.6);
          }
        }
      `}</style>
    </div>
  );
}

export default FAQPage;

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
    ogp.title = 'FAQ';
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
