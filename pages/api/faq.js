import React from 'react';
import Head from 'next/head';
import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ApiDocsHeader from 'src/components/ApiDocsHeader';
import ApiDocsFooter from 'src/components/ApiDocsFooter';

const ApiFaqPage = () => {
  const theme = useTheme();

  const faqSections = [
    {
      title: 'General FAQ',
      questions: [
        {
          question: 'What is the XRPL.to API for?',
          answer: 'The XRPL.to API is our enterprise-grade cryptocurrency API for all crypto data use cases from personal, academic, to commercial. The API is a suite of high-performance RESTful JSON endpoints that allow application developers, data scientists, and enterprise business platforms to tap into the latest raw and derived cryptocurrency and exchange market data as well as years of historical data. This is the same data that powers xrpl.to which has been opened up for your use cases.'
        },
        {
          question: 'What can I expect from the Developer Portal?',
          answer: 'The XRPL.to Developer portal is the central account management portal for your API Key and optional subscription plan while using the API. Outside of viewing the API Documentation and FAQ, you can self-provision your API Key, change and upgrade your plan, manage billing, view your monthly usage, audit your API request logs, and manage account level configuration like notifications.'
        },
        {
          question: 'Do you have a free version of the XRPL.to API?',
          answer: 'XRPL.to is committed to always providing the crypto community with a robust free API through our free Basic tier. Even on free Basic our users can benefits from enterprise grade infrastructure, documentation, and flexibility. If your needs outgrow our free offering check out our commercial use and enterprise offerings.'
        }
      ]
    },
    {
      title: 'Data FAQ',
      questions: [
        {
          question: 'What cryptocurrencies and exchanges are available with the XRPL.to API?',
          answer: 'The API surfaces all current and historical cryptocurrency and exchange data available on xrpl.to since it originally went live in 2021. The API focuses primarily on XRP Ledger tokens and DEX data, providing comprehensive coverage of the XRPL ecosystem.'
        },
        {
          question: 'How frequently do the market data endpoints update?',
          answer: 'Most endpoints update every 1 minute. The update frequency for each endpoint is outlined in the endpoint\'s description in our API Documentation.'
        },
        {
          question: 'Do you support pricing data in my local currency?',
          answer: 'The API supports displaying market pricing data in multiple fiat currencies including USD, EUR, and others. You can view the full list of supported currencies in our API documentation. This list can be fetched programmatically using our currency conversion endpoints.'
        },
        {
          question: 'I need a large volume of historical market data. What\'s the best way to get that?',
          answer: 'All of our historical market data is available over API and that is the preferred delivery method for many of our customers. Higher tier plans provide access to more extensive historical data with different time intervals and longer retention periods.'
        },
        {
          question: 'How far back does your historical cryptocurrency and exchange data go?',
          answer: 'Our historical cryptocurrency data goes back to 2021 when XRPL.to launched. You can list all active and inactive cryptocurrencies using our token map endpoint. Each token returned from these endpoints include a "first_historical_data" timestamp letting you know how far our historical records go back.'
        },
        {
          question: 'Are cryptocurrency and exchange logo image assets available via API?',
          answer: 'Yes, our token info metadata endpoints include hosted logo assets in various formats. Different sizes are available and can be accessed through our image CDN endpoints.'
        }
      ]
    },
    {
      title: 'Pricing Plans',
      questions: [
        {
          question: 'When should I consider an Enterprise plan?',
          answer: 'You should consider an enterprise plan if you need higher API call credit and rate limits, access to more historical data, a custom license outside of our standard commercial agreement and/or a Service Level Agreement.'
        },
        {
          question: 'How can I tell if a pricing tier has the data I need?',
          answer: 'You can check the expanded feature matrix on the API Plan Feature Comparison page. The API documentation also outlines what plans support what API endpoints, just look under the description field for any particular endpoint. If you\'re still unsure, feel free to reach out to us.'
        },
        {
          question: 'How do API Call Credits and soft/hard caps work?',
          answer: 'As the API offers enterprise level pagination, usage is tracked not by amount of API calls, but by number of data points returned. This is typically 1 "call credit" per 100 data points returned unless otherwise specified in endpoint documentation. Our plan features page outlines the maximum number of call credits that can be consumed each day and month at each tier.'
        },
        {
          question: 'How do Rate Limits work?',
          answer: 'This is the number of HTTP calls that can be made simultaneously or within the same minute with your API Key before receiving an HTTP 429 "Too Many Requests" API throttling error. This limit increases with the usage tier and resets every 60 seconds.'
        }
      ]
    },
    {
      title: 'API Warning & Errors',
      questions: [
        {
          question: 'Do you provide usage notifications?',
          answer: 'Yes! For your convenience we notify you by email when your API key reaches above 95% of monthly credit usage limits. You may disable these notifications or configure additional alerts via your account notifications page.'
        },
        {
          question: 'I received an email alert that I used 100% of my daily credit limit. What should I do?',
          answer: 'We plan to remove the daily limit and only use the monthly limit. Period limits reset either at the end of each UTC day and month, or in-sync with a paid plan\'s monthly subscription cycle. If hitting your monthly credit limit prematurely concerns you, you can upgrade your plan for more credits, otherwise you may ignore or even disable this warning.'
        },
        {
          question: 'How can I turn on/off overage billing?',
          answer: 'Enable overage billing to prevent your API requests from being blocked if you happen to exceed your plan\'s monthly API credit usage limits. At the end of each billing period, we\'ll include an overage charge for any credit usage above your standard monthly limit using your plan\'s standard cost-per-credit rate. Enable or disable this feature by toggling the "Enable overage billing" checkbox under "Subscription Details" on the Plan & Billing tab.'
        },
        {
          question: 'Why did I receive a Access-Control-Allow-Origin error while trying to use the API?',
          answer: 'This CORS error means you are trying to make HTTP requests directly to the API from JavaScript in the client-side of your application which is not supported. This restriction is to protect your API Key as anyone viewing your application could open their browser\'s Developer Tools to view your HTTP requests and steal your API Key. You should prevent your API Key from being visible on your client-side by proxying your requests through your own backend script.'
        },
        {
          question: 'Why did I get a notice about redacted market details on an exchange endpoint?',
          answer: 'As a premier data authority for exchange market data, we are actively working with every exchange to ensure their data is not only available to us, but also available to you over the new API service. You may see this notice when market data for an exchange is in our system but not yet available over the API.'
        }
      ]
    },
    {
      title: 'Feature Requests & Support',
      questions: [
        {
          question: 'Where can I monitor for any API service disruptions or issues?',
          answer: 'Service disruptions are rare but reported on our public API health dashboard. You may subscribe to updates using the button on that page.'
        },
        {
          question: 'How quickly can I expect responses to support requests?',
          answer: 'Customers on paid plans can expect to receive answers within 24 hours.'
        },
        {
          question: 'When will your new planned features be released? Will I automatically benefit?',
          answer: 'We roll out new enhancements to the API monthly. Customers who are already subscribed to a plan automatically gain access to these new features. You can also reference our Version History which is updated with every release.'
        },
        {
          question: 'I\'m already an API subscriber. How do I upgrade, downgrade, or cancel my subscription?',
          answer: 'We\'d be happy to assist with any account servicing needs. Please reach out to us using our support contact form and we\'ll help you with any subscription changes.'
        },
        {
          question: 'I have a question, issue, or feature request that isn\'t covered in the API Documentation or this FAQ. Where should I direct it?',
          answer: 'We\'d love to get your question answered and added to the API Documentation or this FAQ. You can reach out to us using our support contact form and we\'ll get back to you as soon as we can.'
        }
      ]
    }
  ];

  return (
    <Box sx={{
      margin: 0,
      padding: 0,
      background: theme.palette.background.default,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Head>
        <title>API FAQ - XRPL.to</title>
        <meta name="description" content="Frequently asked questions about the XRPL.to API, including general information, data access, pricing, and support." />
      </Head>

      <ApiDocsHeader />

      <Container maxWidth="lg" sx={{ py: 6, flex: 1 }}>
        {/* Header */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h2" sx={{
            fontWeight: 700,
            color: theme.palette.text.primary,
            mb: 3
          }}>
            Frequently Asked Questions
          </Typography>
          <Typography variant="h6" sx={{
            color: theme.palette.text.secondary,
            lineHeight: 1.6,
            maxWidth: '800px'
          }}>
            This API specific FAQ outlines answers to common questions about the XRPL.to API product. 
            For questions around XRPL.to's general data gathering and reporting conventions, please check out the general XRPL.to FAQ.
          </Typography>
        </Box>

        {/* FAQ Sections */}
        {faqSections.map((section, sectionIndex) => (
          <Box key={sectionIndex} sx={{ mb: 6 }}>
            <Typography variant="h4" sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
              mb: 3
            }}>
              {section.title}
            </Typography>
            
            {section.questions.map((faq, index) => (
              <Accordion 
                key={index} 
                sx={{ 
                  mb: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  '&:before': {
                    display: 'none',
                  },
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 1px 3px rgba(255,255,255,0.1)' 
                    : '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    px: 3,
                    py: 2,
                    '& .MuiAccordionSummary-content': {
                      my: 1
                    }
                  }}
                >
                  <Typography variant="h6" sx={{ 
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                    pr: 2
                  }}>
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, py: 2, pt: 0 }}>
                  <Typography variant="body1" sx={{ 
                    color: theme.palette.text.secondary,
                    lineHeight: 1.7
                  }}>
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
            
            {sectionIndex < faqSections.length - 1 && (
              <Divider sx={{ mt: 4, mb: 2 }} />
            )}
          </Box>
        ))}
      </Container>

      <ApiDocsFooter />
    </Box>
  );
};

export default ApiFaqPage;