import React from 'react';
import axios from 'axios';
// import { performance } from 'perf_hooks';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { BASE_URL } from 'src/utils/constants';

function PrivacyPage() {

  const sections = [
    {
      title: 'No Data Collection',
      content: [
        {
          subtitle: 'Zero Personal Information',
          text: 'xrpl.to does not collect, store, or process any personal information. We do not track your XRP Ledger address, transaction history, or any account information. Your privacy is absolute.'
        },
        {
          subtitle: 'No Tracking or Analytics',
          text: 'We do not use cookies, tracking pixels, or any analytics tools. We do not collect IP addresses, device information, browser types, or any other data about your usage of xrpl.to.'
        }
      ]
    },
    {
      title: 'No Communication',
      content: [
        {
          subtitle: 'We Will Never Contact You',
          text: 'xrpl.to will never send you emails, messages, or communications of any kind. We do not have your contact information and will never ask for it.'
        },
        {
          subtitle: 'No Marketing or Updates',
          text: 'Since we do not collect any data, we cannot and will not send you marketing materials, updates, or any other communications. Your use of xrpl.to is completely anonymous.'
        },
        {
          subtitle: 'Beware of Scams',
          text: 'If you receive any communication claiming to be from xrpl.to, it is fraudulent. We will never contact you for any reason.'
        }
      ]
    },
    {
      title: 'Your Privacy is Guaranteed',
      content: [
        {
          subtitle: 'No Third-Party Sharing',
          text: 'Since we do not collect any data, there is nothing to share with third parties. Your information remains entirely in your control.'
        },
        {
          subtitle: 'Decentralized by Design',
          text: 'xrpl.to operates as a decentralized interface to the XRP Ledger. All transactions occur directly on the blockchain without any intermediary data collection.'
        },
        {
          subtitle: 'Open Source Transparency',
          text: 'Our commitment to privacy is verifiable through our open-source code. You can audit our practices to confirm that no data collection occurs.'
        }
      ]
    }
  ];

  const additionalSections = [
    {
      title: 'Data Security',
      text: 'Since xrpl.to does not collect any data, there is no user information to secure. All interactions with the XRP Ledger occur directly through your wallet, maintaining complete security and privacy.'
    },
    {
      title: 'Third-Party Links',
      text: 'xrpl.to may contain links to third-party websites or services. We are not responsible for the privacy practices of these third-party sites. Since we collect no data, any information you provide to third parties is solely between you and them.'
    },
    {
      title: 'Use of Service',
      text: 'xrpl.to is accessible to everyone without any data collection requirements. No registration, no tracking, no personal information needed. Just connect your wallet and use the service freely.'
    },
    {
      title: 'Changes to this Privacy Policy',
      text: 'Our commitment to zero data collection is permanent. Any updates to this policy will only strengthen privacy protections. We will never introduce data collection practices.'
    }
  ];

  return (
    <div>
      <div id="back-to-top-anchor" />
      <Topbar />
      <Header />

      <div className="container">
        <div className="privacy-header">
          <h1 className="gradient-title">
            Privacy Policy
          </h1>
          <span className="date-chip">
            Effective Date: May 27, 2023
          </span>
        </div>

        {/* Introduction Card */}
        <div className="intro-card">
          <p className="intro-text">
            At xrpl.to, your privacy is absolute. We do not collect, store, or process any personal 
            information whatsoever. We will never contact you, send you emails, or communicate with 
            you in any way. This Privacy Policy confirms our commitment to zero data collection and 
            complete user anonymity when using our decentralized interface to the XRP Ledger.
          </p>
        </div>

        <div className="sections-grid">
          {/* Main Policy Sections */}
          {sections.map((section) => (
            <div className="section-card main-card" key={section.title}>
              <h2 className="section-title primary">
                {section.title}
              </h2>
              <div className="subsections">
                {section.content.map((item, itemIndex) => (
                  <div className="subsection" key={`${section.title}-${item.subtitle}`}>
                    <h3 className="subsection-title secondary">
                      {item.subtitle}
                    </h3>
                    <p className="subsection-text">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Additional Sections */}
          {additionalSections.map((section, index) => (
            <div className="section-card" key={section.title}>
              <h3 className="section-title">
                {section.title}
              </h3>
              <p className="section-content">
                {section.text}
              </p>
            </div>
          ))}

          {/* Important Notice Section */}
          <div className="section-card full-width contact-card">
            <h2 className="section-title secondary center">
              Important Notice
            </h2>
            <div className="contact-content">
              <p className="section-content center">
                <strong>xrpl.to will NEVER contact you.</strong> We do not have your email or any 
                contact information. If someone claims to represent xrpl.to and contacts you, 
                it is a scam. Report it immediately.
              </p>
              <hr className="divider" />
              <p className="note-text">
                This Privacy Policy applies only to xrpl.to. Third-party services linked from our 
                platform may have different privacy practices. Since we collect no data, any 
                information you provide to third parties is solely your responsibility.
              </p>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="section-card full-width">
            <h3 className="section-title center">
              Policy Updates
            </h3>
            <div className="timeline">
              <span className="timeline-date">
                May 27, 2023
              </span>
              <p className="timeline-text">Privacy Policy Creation</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <style jsx>{`
        .container {
          max-width: 1536px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .privacy-header {
          text-align: center;
          margin: 48px 0;
        }

        .gradient-title {
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(45deg, #1976d2, #42a5f5);
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

        .date-chip {
          display: inline-block;
          padding: 8px 16px;
          border: 1px solid #1976d2;
          border-radius: 16px;
          color: #1976d2;
          font-size: 1rem;
        }

        .intro-card {
          background: white;
          border-radius: 8px;
          padding: 32px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 32px;
        }

        .intro-text {
          line-height: 1.7;
          font-size: 1.1rem;
          color: rgba(0,0,0,0.87);
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
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          height: 100%;
        }

        .section-card.main-card {
          background: linear-gradient(135deg, rgba(33,150,243,0.03), rgba(156,39,176,0.03));
          border: 1px solid rgba(0,0,0,0.12);
        }

        .section-card.contact-card {
          background: linear-gradient(135deg, rgba(156,39,176,0.06), rgba(33,150,243,0.06));
          border: 1px solid rgba(0,0,0,0.12);
        }

        .section-card.full-width {
          grid-column: 1 / -1;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1976d2;
          margin-bottom: 24px;
        }

        .section-title.primary {
          color: #1976d2;
        }

        .section-title.secondary {
          color: #9c27b0;
        }

        .section-title.center {
          text-align: center;
        }

        .section-content {
          line-height: 1.6;
          color: rgba(0,0,0,0.87);
        }

        .section-content.center {
          text-align: center;
          line-height: 1.7;
        }

        .subsections {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .subsection-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1976d2;
          margin-bottom: 8px;
        }

        .subsection-title.secondary {
          color: #9c27b0;
        }

        .subsection-text {
          line-height: 1.6;
          color: rgba(0,0,0,0.87);
        }

        .contact-content {
          text-align: center;
        }

        .email-link {
          color: #1976d2;
          font-weight: 600;
        }

        .divider {
          margin: 16px 0;
          border: 0;
          border-top: 1px solid rgba(0,0,0,0.12);
        }

        .note-text {
          color: rgba(0,0,0,0.6);
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .timeline {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
        }

        .timeline-date {
          display: inline-block;
          padding: 6px 12px;
          border: 1px solid #1976d2;
          border-radius: 16px;
          color: #1976d2;
          font-weight: 600;
        }

        .timeline-text {
          color: rgba(0,0,0,0.87);
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .intro-card,
          .section-card {
            background: #1e1e1e;
          }

          .section-card.main-card {
            background: linear-gradient(135deg, rgba(33,150,243,0.08), rgba(156,39,176,0.08));
            border: 1px solid rgba(255,255,255,0.12);
          }

          .section-card.contact-card {
            background: linear-gradient(135deg, rgba(156,39,176,0.1), rgba(33,150,243,0.1));
            border: 1px solid rgba(255,255,255,0.12);
          }

          .intro-text,
          .section-content,
          .subsection-text,
          .timeline-text {
            color: rgba(255,255,255,0.87);
          }

          .note-text {
            color: rgba(255,255,255,0.6);
          }

          .divider {
            border-top: 1px solid rgba(255,255,255,0.12);
          }
        }
      `}</style>
    </div>
  );
}

export default PrivacyPage;

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
    ogp.title = 'Privacy Policy';
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
