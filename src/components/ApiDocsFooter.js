import { Box, Container, Typography, Link, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { styled } from '@mui/material/styles';

const FooterWrapper = styled(Box)(
  ({ theme }) => `
    width: 100%;
    background: ${theme.palette.background.paper};
    border-top: 1px solid ${
      theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
    };
    margin-top: auto;
`
);

const FooterLink = styled(Link)(
  ({ theme }) => `
    color: ${theme.palette.text.secondary};
    text-decoration: none;
    font-size: 0.875rem;
    transition: color 0.2s ease;
    
    &:hover {
      color: ${theme.palette.primary.main};
      text-decoration: none;
    }
`
);

function ApiDocsFooter() {
  const theme = useTheme();

  const footerItems = [
    { label: 'Pricing', href: '/docs/api/pricing' },
    { label: 'API Documentation', href: '/docs/api/v1' },
    { label: 'FAQ', href: '/docs/api/faq' },
    { label: 'API Status', href: '#' }
  ];

  return (
    <FooterWrapper>
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ py: 3 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
          >
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 600
              }}
            >
              xrpl.to
            </Typography>

            <Box display="flex" gap={3} flexWrap="wrap">
              {footerItems.map((item) => (
                <FooterLink key={item.label} href={item.href}>
                  {item.label}
                </FooterLink>
              ))}
            </Box>
          </Box>
        </Box>
      </Container>
    </FooterWrapper>
  );
}

export default ApiDocsFooter;
