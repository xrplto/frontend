import React, { memo } from 'react';
import styled from '@emotion/styled';
import { useTheme } from '@mui/material/styles';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
`;

const PageHeader = styled.div`
  text-align: center;
  margin: 48px 0;
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(45deg, #1976d2, #42a5f5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 16px;

  @media (min-width: 768px) {
    font-size: 3.5rem;
  }
`;

const DateChip = styled.span`
  display: inline-block;
  padding: 8px 16px;
  border: 1px solid ${props => props.theme?.palette?.primary?.main};
  border-radius: 16px;
  color: ${props => props.theme?.palette?.primary?.main};
  font-size: 1rem;
`;

const IntroCard = styled.div`
  background: ${props => props.theme?.palette?.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.02)'
    : 'rgba(0, 0, 0, 0.02)'};
  border: 1px solid ${props => props.theme?.palette?.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(0, 0, 0, 0.05)'};
  border-radius: 12px;
  padding: 32px;
  backdrop-filter: blur(10px);
  margin-bottom: 32px;
`;

const SectionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
  margin-bottom: 48px;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const SectionCard = styled.div`
  background: ${props => props.theme?.palette?.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.02)'
    : 'rgba(0, 0, 0, 0.02)'};
  border: 1px solid ${props => props.theme?.palette?.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(0, 0, 0, 0.05)'};
  border-radius: 12px;
  padding: 32px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  height: 100%;

  &:hover {
    background: ${props => props.theme?.palette?.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.04)'
      : 'rgba(0, 0, 0, 0.04)'};
    border-color: ${props => props.theme?.palette?.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.08)'};
  }

  &.main-card {
    background: ${props => props.theme?.palette?.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(33, 150, 243, 0.08), rgba(156, 39, 176, 0.08))'
      : 'linear-gradient(135deg, rgba(33, 150, 243, 0.03), rgba(156, 39, 176, 0.03))'};
    border: 1px solid ${props => props.theme?.palette?.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.12)'
      : 'rgba(0, 0, 0, 0.12)'};
  }

  &.contact-card {
    background: ${props => props.theme?.palette?.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(156, 39, 176, 0.1), rgba(33, 150, 243, 0.1))'
      : 'linear-gradient(135deg, rgba(156, 39, 176, 0.06), rgba(33, 150, 243, 0.06))'};
    border: 1px solid ${props => props.theme?.palette?.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.12)'
      : 'rgba(0, 0, 0, 0.12)'};
  }

  &.full-width {
    grid-column: 1 / -1;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme?.palette?.primary?.main};
  margin-bottom: 24px;

  &.primary {
    color: #1976d2;
  }

  &.secondary {
    color: #9c27b0;
  }

  &.center {
    text-align: center;
  }
`;

const SectionContent = styled.p`
  line-height: 1.6;
  color: ${props => props.theme?.palette?.text?.primary};

  &.center {
    text-align: center;
    line-height: 1.7;
  }
`;

const SubsectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme?.palette?.primary?.main};
  margin-bottom: 8px;

  &.secondary {
    color: #9c27b0;
  }
`;

const SubsectionText = styled.p`
  line-height: 1.6;
  color: ${props => props.theme?.palette?.text?.primary};
`;

const IntroText = styled.p`
  line-height: 1.7;
  font-size: 1.1rem;
  color: ${props => props.theme?.palette?.text?.primary};
`;

const Divider = styled.hr`
  margin: 16px 0;
  border: 0;
  border-top: 1px solid ${props => props.theme?.palette?.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(0, 0, 0, 0.12)'};
`;

const NoteText = styled.p`
  color: ${props => props.theme?.palette?.text?.secondary};
  font-size: 0.875rem;
  line-height: 1.4;
`;

const Timeline = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
`;

const TimelineDate = styled.span`
  display: inline-block;
  padding: 6px 12px;
  border: 1px solid ${props => props.theme?.palette?.primary?.main};
  border-radius: 16px;
  color: ${props => props.theme?.palette?.primary?.main};
  font-weight: 600;
`;

const TimelineText = styled.p`
  color: ${props => props.theme?.palette?.text?.primary};
`;

function PrivacyPage() {
  const theme = useTheme();
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

      <Container>
        <PageHeader>
          <PageTitle>Privacy Policy</PageTitle>
          <DateChip theme={theme}>Effective Date: May 27, 2023</DateChip>
        </PageHeader>

        <IntroCard theme={theme}>
          <IntroText theme={theme}>
            At xrpl.to, your privacy is absolute. We do not collect, store, or process any personal
            information whatsoever. We will never contact you, send you emails, or communicate with
            you in any way. This Privacy Policy confirms our commitment to zero data collection and
            complete user anonymity when using our decentralized interface to the XRP Ledger.
          </IntroText>
        </IntroCard>

        <SectionsGrid>
          {sections.map((section) => (
            <SectionCard theme={theme} className="main-card" key={section.title}>
              <SectionTitle theme={theme} className="primary">{section.title}</SectionTitle>
              <div>
                {section.content.map((item, itemIndex) => (
                  <div key={`${section.title}-${item.subtitle}`} style={{ marginBottom: '24px' }}>
                    <SubsectionTitle theme={theme} className="secondary">{item.subtitle}</SubsectionTitle>
                    <SubsectionText theme={theme}>{item.text}</SubsectionText>
                  </div>
                ))}
              </div>
            </SectionCard>
          ))}

          {additionalSections.map((section, index) => (
            <SectionCard theme={theme} key={section.title}>
              <SectionTitle theme={theme}>{section.title}</SectionTitle>
              <SectionContent theme={theme}>{section.text}</SectionContent>
            </SectionCard>
          ))}

          <SectionCard theme={theme} className="full-width contact-card">
            <SectionTitle theme={theme} className="secondary center">Important Notice</SectionTitle>
            <div>
              <SectionContent theme={theme} className="center">
                <strong>xrpl.to will NEVER contact you.</strong> We do not have your email or any
                contact information. If someone claims to represent xrpl.to and contacts you, it is
                a scam. Report it immediately.
              </SectionContent>
              <Divider theme={theme} />
              <NoteText theme={theme}>
                This Privacy Policy applies only to xrpl.to. Third-party services linked from our
                platform may have different privacy practices. Since we collect no data, any
                information you provide to third parties is solely your responsibility.
              </NoteText>
            </div>
          </SectionCard>

          <SectionCard theme={theme} className="full-width">
            <SectionTitle theme={theme} className="center">Policy Updates</SectionTitle>
            <Timeline>
              <TimelineDate theme={theme}>May 27, 2023</TimelineDate>
              <TimelineText theme={theme}>Privacy Policy Creation</TimelineText>
            </Timeline>
          </SectionCard>
        </SectionsGrid>
      </Container>

      <Footer />
    </div>
  );
}

export default memo(PrivacyPage);

export async function getStaticProps() {
  return {
    props: {},
    revalidate: 10
  };
}