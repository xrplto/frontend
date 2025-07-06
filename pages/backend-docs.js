import dynamic from 'next/dynamic';
import { useContext } from 'react';
import { Box, Container, Typography, Alert, Toolbar } from '@mui/material';
import { AppContext } from 'src/AppContext';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';

const BackendDocs = dynamic(() => import('../src/components/BackendDocs/backend-docs'), {
  ssr: false
});

const BackendDocsPage = () => {
  const { accountProfile } = useContext(AppContext);
  const isAdmin = accountProfile?.admin;

  return (
    <Box sx={{ flex: 1 }}>
      <Toolbar id="back-to-top-anchor" />
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {isAdmin ? (
          <BackendDocs />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 3 }}>
            <Alert severity="error" sx={{ maxWidth: 600 }}>
              <Typography variant="h6" gutterBottom>
                Access Denied
              </Typography>
              <Typography>
                Administrator privileges required. Contact an administrator for access.
              </Typography>
            </Alert>
          </Box>
        )}
      </Container>
      <ScrollToTop />
      <Footer />
    </Box>
  );
};

export default BackendDocsPage;
