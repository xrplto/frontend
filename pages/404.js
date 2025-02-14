import { Box, Typography, Container, Button, styled } from '@mui/material';
import Head from 'next/head';

const MainContent = styled(Box)(
  ({ theme }) => `
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${theme.palette.background.paper};
  `
);

const StyledButton = styled(Button)(
  ({ theme }) => `
    text-transform: none;
    font-weight: 500;
    transition: all 0.2s ease-in-out;
    
    &:hover {
      transform: translateY(-1px);
    }
  `
);

function Status404() {
  return (
    <>
      <Head>
        <title>404 - Page Not Found</title>
      </Head>
      <MainContent>
        <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
          <Typography
            variant="h1"
            color="primary"
            sx={{
              fontSize: '3rem',
              fontWeight: 600,
              mb: 2
            }}
          >
            404
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
            Page not found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontStyle: 'italic' }}>
            Looks like this page got lost in the ledger... Even the fastest 3-5 second settlement
            can't find it!
          </Typography>
          <StyledButton href="/" variant="contained" size="large" sx={{ px: 4 }}>
            Go Home
          </StyledButton>
        </Container>
      </MainContent>
    </>
  );
}

export default Status404;
