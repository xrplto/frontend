import React, { memo } from 'react';
import styled from '@emotion/styled';
import { useTheme } from '@mui/material/styles';
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
  background: linear-gradient(45deg, #ff9800, #f57c00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 16px;

  @media (min-width: 768px) {
    font-size: 3.5rem;
  }
`;

const Subtitle = styled.h2`
  font-size: 1.25rem;
  color: ${props => props.theme?.palette?.text?.secondary};
  max-width: 600px;
  margin: 0 auto;
  font-weight: 400;
`;

const AlertCard = styled.div`
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 32px;
  background: ${props => props.theme?.palette?.mode === 'dark'
    ? 'rgba(255, 152, 0, 0.1)'
    : 'rgba(255, 152, 0, 0.05)'};
  border: 1px solid ${props => props.theme?.palette?.warning?.main};
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

  &:hover {
    background: ${props => props.theme?.palette?.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.04)'
      : 'rgba(0, 0, 0, 0.04)'};
    border-color: ${props => props.theme?.palette?.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.08)'};
  }

  &.warning-card {
    background: ${props => props.theme?.palette?.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(255, 152, 0, 0.08), rgba(244, 67, 54, 0.08))'
      : 'linear-gradient(135deg, rgba(255, 152, 0, 0.03), rgba(244, 67, 54, 0.03))'};
    border: 1px solid rgba(255, 152, 0, 0.18);
  }

  &.success-card {
    background: ${props => props.theme?.palette?.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.08), rgba(33, 150, 243, 0.08))'
      : 'linear-gradient(135deg, rgba(76, 175, 80, 0.03), rgba(33, 150, 243, 0.03))'};
    border: 1px solid rgba(76, 175, 80, 0.18);
  }

  &.info-card {
    background: ${props => props.theme?.palette?.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(33, 150, 243, 0.08), rgba(33, 150, 243, 0.08))'
      : 'linear-gradient(135deg, rgba(33, 150, 243, 0.03), rgba(33, 150, 243, 0.03))'};
    border: 1px solid rgba(33, 150, 243, 0.18);
  }

  &.footer-card {
    background: ${props => props.theme?.palette?.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(33, 150, 243, 0.08), rgba(156, 39, 176, 0.08))'
      : 'linear-gradient(135deg, rgba(33, 150, 243, 0.03), rgba(156, 39, 176, 0.03))'};
    border: 1px solid ${props => props.theme?.palette?.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.12)'
      : 'rgba(0, 0, 0, 0.12)'};
    text-align: center;
    margin-top: 32px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme?.palette?.primary?.main};
  margin-bottom: 24px;

  &.warning {
    color: #ff9800;
  }

  &.success {
    color: #4caf50;
  }

  &.info {
    color: #2196f3;
  }
`;

const SectionContent = styled.p`
  line-height: 1.6;
  color: ${props => props.theme?.palette?.text?.primary};
`;

const AlertTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: #e65100;
  margin-bottom: 12px;
`;

const AlertMessage = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  color: ${props => props.theme?.palette?.text?.primary};
`;

const EmailLink = styled.span`
  color: ${props => props.theme?.palette?.primary?.main};
  font-weight: 600;
`;

function DisclaimerPage() {
  const theme = useTheme();
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
      <Header />

      <Container>
        <PageHeader>
          <PageTitle>Disclaimer</PageTitle>
          <Subtitle theme={theme}>Important legal information and disclosures</Subtitle>
        </PageHeader>

        <AlertCard theme={theme}>
          <AlertTitle>Important Notice</AlertTitle>
          <AlertMessage theme={theme}>
            Please read this disclaimer carefully before using xrpl.to. By accessing and using this
            website, you acknowledge and agree to the terms outlined below.
          </AlertMessage>
        </AlertCard>

        <SectionsGrid>
          {disclaimerSections.map((section) => (
            <SectionCard theme={theme} className={`${section.type}-card`} key={section.title}>
              <SectionTitle theme={theme} className={section.type}>{section.title}</SectionTitle>
              <SectionContent theme={theme}>{section.content}</SectionContent>
            </SectionCard>
          ))}
        </SectionsGrid>

        <SectionCard theme={theme} className="footer-card">
          <SectionTitle theme={theme}>Questions or Concerns?</SectionTitle>
          <SectionContent theme={theme}>
            If you have any questions about this disclaimer or need clarification on any of these
            terms, please contact us at <EmailLink theme={theme}>hello@xrpl.to</EmailLink>
          </SectionContent>
        </SectionCard>
      </Container>

      <Footer />
    </div>
  );
}

export default memo(DisclaimerPage);

export async function getStaticProps() {
  return {
    props: {},
    revalidate: 10
  };
}