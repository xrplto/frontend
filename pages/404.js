import {
  Box,
  Typography,
  Container,
  Button,
  styled,
  useTheme
} from '@mui/material';
import Head from 'next/head';

const MainContent = styled(Box)(
  ({ theme }) => `
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: ${theme.palette.background.default};
  `
);

const ContentWrapper = styled(Box)(
  ({ theme }) => `
    background-color: ${theme.palette.background.paper};
    border-radius: ${theme.shape.borderRadius * 2}px;
    padding: ${theme.spacing(6)};
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    text-align: center;
  `
);

const StyledButton = styled(Button)(
  ({ theme }) => `
    text-transform: none;
    font-weight: 600;
    transition: all 0.2s ease-in-out;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  `
);

function Status404() {
  const theme = useTheme();

  return (
    <>
      <Head>
        <title>404 - Page Not Found | YourStartup</title>
      </Head>
      <MainContent>
        <Container maxWidth="sm">
          <ContentWrapper>
            <Typography variant="h1" color="primary" sx={{ fontSize: '4rem', fontWeight: 700, mb: 2 }}>
              404
            </Typography>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
              Oops! Page Not Found
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 4, maxWidth: '400px', mx: 'auto' }}
            >
              The page you're looking for doesn't exist or has been moved. 
              Let's get you back on track to innovation.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <StyledButton 
                href="/" 
                variant="contained" 
                size="large"
                sx={{ 
                  px: 4, 
                  py: 1.5, 
                  fontSize: '1rem' 
                }}
              >
                Back to Homepage
              </StyledButton>
              <StyledButton 
                href="/contact" 
                variant="outlined" 
                size="large"
                sx={{ 
                  px: 4, 
                  py: 1.5, 
                  fontSize: '1rem' 
                }}
              >
                Contact Support
              </StyledButton>
            </Box>
          </ContentWrapper>
        </Container>
      </MainContent>
    </>
  );
}

export default Status404;
