import { Box, Container, Typography } from '@mui/material';
import Footer from 'src/components/Footer';
import Header from 'src/components/Header';
import Topbar from 'src/components/Topbar';

const LedgersPage = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Topbar />
      <Header />
      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        <Box mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Ledgers
          </Typography>
        </Box>
        <Typography>Ledger information will be displayed here.</Typography>
      </Container>
      <Footer />
    </Box>
  );
};

export default LedgersPage;
