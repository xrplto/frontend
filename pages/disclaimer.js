import React from 'react';
import axios from 'axios';
// import { performance } from 'perf_hooks';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { BASE_URL } from 'src/utils/constants';

function DisclaimerPage() {
  const disclaimerSections = [
    {
      title: 'No Investment Advice',
      content:
        "The information provided on xrpl.to does not constitute investment advice, financial advice, trading advice, or any other form of advice, and you should not consider any of the website's content as such. Xrpl.to does not recommend that you buy, sell, or hold any cryptocurrency. Please conduct your own due diligence and consult with a financial advisor before making any investment decisions.",
      type: 'warning'
    },
    {
      title: 'Accuracy of Information',
      content:
        'Xrpl.to strives to ensure the accuracy of the information listed on this website; however, it will not be held responsible for any missing or incorrect information. Xrpl.to provides all information "as is." You understand that you use any and all information available on this website at your own risk.',
      type: 'info'
    },
    {
      title: 'Non-Endorsement',
      content:
        'The presence of third-party advertisements and hyperlinks on xrpl.to does not constitute an endorsement, guarantee, warranty, or recommendation by Xrpl.to. Please conduct your own due diligence before deciding to use any third-party services.',
      type: 'info'
    },
    {
      title: 'Affiliate Disclosure',
      content:
        'Xrpl.to may receive compensation for affiliate links. This compensation may be in the form of money or services and could occur without any action from a site visitor. By engaging in activities related to an affiliate link, you acknowledge and understand that some form of compensation may be provided to Xrpl.to. For instance, if you click on an affiliate link, sign up, and trade on an exchange, Xrpl.to may receive compensation. Each affiliate link is clearly indicated with an icon next to it.',
      type: 'success'
    }
  ];

  return (
    <div>
      <div id="back-to-top-anchor" />
      <Topbar />
      <Header />

      <div className="container">
        <div className="disclaimer-header">
          <h1 className="gradient-title">Disclaimer</h1>
          <h2 className="subtitle">Important legal information and disclosures</h2>
        </div>

        {/* Important Notice */}
        <div className="alert alert-warning">
          <h3 className="alert-title">Important Notice</h3>
          <p className="alert-message">
            Please read this disclaimer carefully before using xrpl.to. By accessing and using this
            website, you acknowledge and agree to the terms outlined below.
          </p>
        </div>

        <div className="sections-grid">
          {disclaimerSections.map((section) => (
            <div className={`section-card ${section.type}-card`} key={section.title}>
              <h2 className={`section-title ${section.type}`}>{section.title}</h2>
              <p className="section-content">{section.content}</p>
            </div>
          ))}
        </div>

        {/* Footer Notice */}
        <div className="footer-card">
          <h3 className="footer-title">Questions or Concerns?</h3>
          <p className="footer-text">
            If you have any questions about this disclaimer or need clarification on any of these
            terms, please contact us at <span className="email-link">hello@xrpl.to</span>
          </p>
        </div>
      </div>

      <Footer />

      <style jsx>{`
        .container {
          max-width: 1536px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .disclaimer-header {
          text-align: center;
          margin: 48px 0;
        }

        .gradient-title {
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(45deg, #ff9800, #f57c00);
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
          color: rgba(0, 0, 0, 0.6);
          max-width: 600px;
          margin: 0 auto;
          font-weight: 400;
        }

        .alert {
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 32px;
        }

        .alert-warning {
          background: #fff3e0;
          border: 1px solid #ff9800;
        }

        .alert-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #e65100;
          margin-bottom: 12px;
        }

        .alert-message {
          font-size: 1.1rem;
          line-height: 1.6;
          color: rgba(0, 0, 0, 0.87);
        }

        .sections-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          margin-bottom: 48px;
        }

        @media (min-width: 768px) {
          .sections-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .section-card {
          background: white;
          border-radius: 8px;
          padding: 32px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          height: 100%;
        }

        .section-card.warning-card {
          background: linear-gradient(135deg, rgba(255, 152, 0, 0.03), rgba(244, 67, 54, 0.03));
          border: 1px solid rgba(255, 152, 0, 0.18);
        }

        .section-card.success-card {
          background: linear-gradient(135deg, rgba(76, 175, 80, 0.03), rgba(33, 150, 243, 0.03));
          border: 1px solid rgba(76, 175, 80, 0.18);
        }

        .section-card.info-card {
          background: linear-gradient(135deg, rgba(33, 150, 243, 0.03), rgba(33, 150, 243, 0.03));
          border: 1px solid rgba(33, 150, 243, 0.18);
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 24px;
        }

        .section-title.warning {
          color: #ff9800;
        }

        .section-title.success {
          color: #4caf50;
        }

        .section-title.info {
          color: #2196f3;
        }

        .section-content {
          line-height: 1.7;
          font-size: 1.05rem;
          color: rgba(0, 0, 0, 0.87);
        }

        .footer-card {
          background: linear-gradient(135deg, rgba(33, 150, 243, 0.03), rgba(156, 39, 176, 0.03));
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 8px;
          padding: 32px;
          text-align: center;
          margin-top: 32px;
        }

        .footer-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: rgba(0, 0, 0, 0.87);
          margin-bottom: 16px;
        }

        .footer-text {
          line-height: 1.7;
          color: rgba(0, 0, 0, 0.87);
        }

        .email-link {
          color: #1976d2;
          font-weight: 600;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .subtitle {
            color: rgba(255, 255, 255, 0.6);
          }

          .alert-warning {
            background: rgba(255, 152, 0, 0.15);
            border: 1px solid #ff9800;
          }

          .alert-message {
            color: rgba(255, 255, 255, 0.87);
          }

          .section-card {
            background: #1e1e1e;
          }

          .section-card.warning-card {
            background: linear-gradient(135deg, rgba(255, 152, 0, 0.08), rgba(244, 67, 54, 0.08));
          }

          .section-card.success-card {
            background: linear-gradient(135deg, rgba(76, 175, 80, 0.08), rgba(33, 150, 243, 0.08));
          }

          .section-card.info-card {
            background: linear-gradient(135deg, rgba(33, 150, 243, 0.08), rgba(33, 150, 243, 0.08));
          }

          .section-content,
          .footer-title,
          .footer-text {
            color: rgba(255, 255, 255, 0.87);
          }

          .footer-card {
            background: linear-gradient(135deg, rgba(33, 150, 243, 0.08), rgba(156, 39, 176, 0.08));
            border: 1px solid rgba(255, 255, 255, 0.12);
          }
        }
      `}</style>
    </div>
  );
}

export default DisclaimerPage;

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
    ogp.title = 'Disclaimer';
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
