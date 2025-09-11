import React, { useState } from 'react';
import Head from 'next/head';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Switch,
  FormControlLabel,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StarIcon from '@mui/icons-material/Star';
import ApiDocsHeader from 'src/components/ApiDocsHeader';
import ApiDocsFooter from 'src/components/ApiDocsFooter';

const PricingPage = () => {
  const theme = useTheme();
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: 'Basic',
      description: 'Basic personal use',
      price: { monthly: 0, yearly: 0 },
      features: [
        '11 data endpoints',
        '10K call credits/mo',
        'No historical data',
        'Personal use'
      ],
      cta: 'No subscription required',
      popular: false
    },
    {
      name: 'Hobbyist',
      description: 'Personal projects',
      price: { monthly: 29, yearly: 348 },
      originalYearly: 420,
      features: [
        '15 data endpoints',
        '110K call credits/mo',
        '12 months of historical data',
        'Personal use'
      ],
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Startup',
      description: 'For commercial use',
      price: { monthly: 79, yearly: 948 },
      originalYearly: 1140,
      features: [
        '23 data endpoints',
        '300K call credits/mo',
        '24 months of historical data',
        'Commercial use*'
      ],
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Standard',
      description: 'Suitable for most use cases',
      price: { monthly: 299, yearly: 3588 },
      originalYearly: 4500,
      features: [
        '28 data endpoints',
        '1.2M call credits/mo',
        '60 months of historical data',
        'Commercial use*'
      ],
      cta: 'Get Started',
      popular: true
    },
    {
      name: 'Professional',
      description: 'Best for scaling crypto projects',
      price: { monthly: 699, yearly: 8388 },
      originalYearly: 10500,
      features: [
        'All data endpoints',
        '3M call credits/mo',
        'All time historical data',
        'Commercial use*'
      ],
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Enterprise',
      description: 'Do you need more data or features?',
      subtitle: 'Customize a pricing plan that scales to your business\' needs',
      features: [
        'All data endpoints',
        'Custom call limits',
        'All time historical data in full resolution',
        'Custom license'
      ],
      cta: 'Contact Us',
      custom: true
    }
  ];

  const comparisonData = [
    {
      feature: 'Rest API',
      basic: '✓',
      hobbyist: '✓',
      startup: '✓',
      standard: '✓',
      professional: '✓',
      enterprise: '✓'
    },
    {
      feature: 'Monthly API credits',
      basic: '10,000',
      hobbyist: '110,000',
      startup: '300,000',
      standard: '1,200,000',
      professional: '3,000,000',
      enterprise: '30,000,000'
    },
    {
      feature: 'Support',
      basic: 'Basic email',
      hobbyist: 'Basic email',
      startup: 'Email',
      standard: 'Email',
      professional: 'Priority email',
      enterprise: 'Priority email'
    },
    {
      feature: 'License',
      basic: 'Personal use',
      hobbyist: 'Personal use',
      startup: 'Commercial use *',
      standard: 'Commercial use *',
      professional: 'Commercial use *',
      enterprise: 'Custom license'
    },
    {
      feature: 'Rate Limit',
      basic: '30 requests per minute',
      hobbyist: '30 requests per minute',
      startup: '30 requests per minute',
      standard: '60 requests per minute',
      professional: '90 requests per minute',
      enterprise: '120+ requests per minute'
    }
  ];

  const faqs = [
    {
      question: 'Are there any upfront costs or hidden fees?',
      answer: 'No, there are no upfront costs or hidden fees associated with any of our pricing plans. The prices listed on our pricing page are transparent and all-inclusive, covering the full range of features and data access outlined in each plan. You can rest assured that there will be no surprises or additional charges beyond the subscription cost.'
    },
    {
      question: 'Are there any discounts available for yearly subscriptions?',
      answer: 'Yes, we offer significant discounts for yearly subscriptions compared to monthly billing. By choosing an annual plan, you can save up to 20% on your subscription, making it a cost-effective option for those planning to use our API long-term. This discount is automatically applied when you select the yearly billing option during checkout.'
    },
    {
      question: 'Can I switch plans or cancel my subscription at any time?',
      answer: 'Absolutely! We understand that your needs may change, so we offer the flexibility to upgrade, downgrade, or cancel your subscription at any time. You can manage your subscription directly through your account dashboard, ensuring you have complete control over your plan.'
    },
    {
      question: 'Does the Basic plan really offer free access?',
      answer: 'Yes, the Basic plan provides truly free access with no subscription required. It includes essential market data such as rankings, latest pricing, and listings, making it perfect for personal use or for those who want to test the API before committing to a paid plan. There\'s no time limit, and you can upgrade to a paid plan anytime if you need more advanced features.'
    },
    {
      question: 'What does \'commercial use approved\' mean in the pricing plans?',
      answer: 'Commercial use approved means that the API plan you\'ve selected grants you the right to integrate XRPL.to data into commercial products, services, or applications that you intend to distribute, sell, or use in a business context. Our Startup, Standard, Professional, and Enterprise plans include commercial use rights, allowing you to confidently embed our data into your business offerings.'
    },
    {
      question: 'How long are your contracts?',
      answer: 'Our contracts are flexible and designed to meet your needs. We offer both monthly and yearly subscription options. If you choose a monthly plan, your contract renews every month, giving you the flexibility to cancel or switch plans at the end of each billing cycle. If you opt for a yearly plan, your contract will last for 12 months, but you benefit from significant savings of up to 20% compared to the monthly rate.'
    },
    {
      question: 'Can I upgrade at any time?',
      answer: 'Yes, you can upgrade your plan at any time. Whether you find that your data needs have grown or you\'re ready to access more advanced features, upgrading is quick and easy. Simply log into your account dashboard, choose the plan you\'d like to upgrade to, and the change will take effect immediately.'
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
        <title>API Pricing - XRPL.to</title>
        <meta name="description" content="Choose the perfect API plan for your needs. From free Basic to Enterprise solutions." />
      </Head>

      <ApiDocsHeader />

      <Container maxWidth="lg" sx={{ py: 6, flex: 1 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" sx={{
            fontWeight: 700,
            color: theme.palette.text.primary,
            mb: 2
          }}>
            Standard API Pricing
          </Typography>
          <Typography variant="h6" sx={{
            color: theme.palette.text.secondary,
            mb: 4,
            maxWidth: '600px',
            mx: 'auto'
          }}>
            Start integrating for free or choose a plan which best suits your needs
          </Typography>

          {/* Billing Toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <Typography>Monthly</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={isYearly}
                  onChange={(e) => setIsYearly(e.target.checked)}
                  color="primary"
                />
              }
              label=""
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography>Yearly</Typography>
              <Chip
                label="Save up to 20%"
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>

        {/* Pricing Cards */}
        <Grid container spacing={3} sx={{ mb: 8 }}>
          {plans.map((plan, index) => (
            <Grid item xs={12} md={6} lg={4} key={plan.name}>
              <Card sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: plan.popular ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                background: theme.palette.background.paper
              }}>
                {plan.popular && (
                  <Box sx={{
                    position: 'absolute',
                    top: -10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: theme.palette.primary.main,
                    color: 'white',
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    Recommended
                  </Box>
                )}

                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                    {plan.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                    {plan.description}
                  </Typography>
                  
                  {plan.custom ? (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        {plan.subtitle}
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        {plan.price.monthly === 0 ? (
                          <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                            Free
                          </Typography>
                        ) : (
                          <>
                            <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                              ${isYearly ? plan.price.yearly : plan.price.monthly}
                            </Typography>
                            <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                              {isYearly ? '/year' : '/mo'}
                            </Typography>
                          </>
                        )}
                      </Box>
                      {isYearly && plan.originalYearly && (
                        <Typography variant="body2" sx={{
                          textDecoration: 'line-through',
                          color: theme.palette.text.disabled,
                          mt: 0.5
                        }}>
                          ${plan.originalYearly}/year
                        </Typography>
                      )}
                    </Box>
                  )}

                  <List sx={{ mb: 3 }}>
                    {plan.features.map((feature, idx) => (
                      <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <CheckIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={feature}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>

                <Box sx={{ p: 3, pt: 0 }}>
                  <Button
                    variant={plan.popular ? "contained" : "outlined"}
                    color="primary"
                    fullWidth
                    size="large"
                  >
                    {plan.cta}
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Trusted By Section */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Trusted by The World's Leading Companies
          </Typography>
        </Box>

        {/* Comparison Table */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 4, textAlign: 'center' }}>
            Compare Editions And Top Features
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Feature</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Basic<br />Free</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Hobbyist<br />$29/mo</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Startup<br />$79/mo</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, background: theme.palette.primary.main, color: 'white' }}>
                    Standard<br />$299/mo<br />
                    <Chip label="Recommended" size="small" sx={{ mt: 0.5, color: theme.palette.primary.main, background: 'white' }} />
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Professional<br />$699/mo</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Enterprise<br />Inquire for pricing</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comparisonData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ fontWeight: 500 }}>{row.feature}</TableCell>
                    <TableCell align="center">{row.basic}</TableCell>
                    <TableCell align="center">{row.hobbyist}</TableCell>
                    <TableCell align="center">{row.startup}</TableCell>
                    <TableCell align="center" sx={{ background: `${theme.palette.primary.main}10` }}>
                      {row.standard}
                    </TableCell>
                    <TableCell align="center">{row.professional}</TableCell>
                    <TableCell align="center">{row.enterprise}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* FAQ Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 4, textAlign: 'center' }}>
            Frequently Asked Questions (FAQ)
          </Typography>
          {faqs.map((faq, index) => (
            <Accordion key={index} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Container>

      <ApiDocsFooter />
    </Box>
  );
};

export default PricingPage;