import dynamic from 'next/dynamic';

// Material
import { Box, Container, Typography, Alert, styled, Toolbar } from '@mui/material';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Components
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';

const BackendDocs = dynamic(() => import('../src/components/BackendDocs/backend-docs'), {
  ssr: false
});

const OverviewWrapper = styled(Box)(
  ({ theme }) => `
    flex: 1;
  `
);

const BackendDocsPage = () => {
  const { accountProfile } = useContext(AppContext);
  const isAdmin = accountProfile?.admin;

  return (
    <OverviewWrapper>
      <Toolbar id="back-to-top-anchor" />
      <Header />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {isAdmin ? (
          <BackendDocs />
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              gap: 3
            }}
          >
            <Alert severity="error" sx={{ maxWidth: 600 }}>
              <Typography variant="h6" gutterBottom>
                Access Denied
              </Typography>
              <Typography>
                You need administrator privileges to access the backend documentation. Please
                contact an administrator if you believe you should have access.
              </Typography>
            </Alert>
          </Box>
        )}
      </Container>

      <ScrollToTop />
      <Footer />
    </OverviewWrapper>
  );
};

export default BackendDocsPage;
