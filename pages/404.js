import { Box, Typography, Container, Button, styled, alpha } from '@mui/material';
import Head from 'next/head';

const MainContent = styled(Box)(
  ({ theme }) => `
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${theme.palette.background.default};
  `
);

const ContentContainer = styled(Container)(
  ({ theme }) => `
    text-align: center;
  `
);

const StyledNumber = styled(Typography)(
  ({ theme }) => `
    color: ${alpha(theme.palette.text.primary, 0.2)};
    font-weight: 400;
    font-size: 6rem;
    line-height: 1;
    margin-bottom: ${theme.spacing(2)};

    @media (max-width: 600px) {
      font-size: 4rem;
    }
  `
);

const StyledButton = styled(Button)(
  ({ theme }) => `
    text-transform: none;
    font-weight: 400;
    font-size: 0.95rem;
    padding: ${theme.spacing(1.5, 3)};
    border-radius: 12px;
    border: 1.5px solid ${alpha(theme.palette.divider, 0.2)};
    color: #4285f4;
    background: transparent;

    &:hover {
      border-color: #4285f4;
      background: ${alpha('#4285f4', 0.04)};
    }
  `
);


function Status404() {

  return (
    <>
      <Head>
        <title>404 | XRPL.to</title>
        <meta name="description" content="Page not found" />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <MainContent>
        <ContentContainer maxWidth="sm">
          <StyledNumber variant="h1">404</StyledNumber>

          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontWeight: 400,
              mb: 1,
              color: theme => theme.palette.text.primary,
              fontSize: { xs: '1.1rem', sm: '1.25rem' }
            }}
          >
            Page not found
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mb: 4,
              color: theme => alpha(theme.palette.text.secondary, 0.6),
              fontSize: '0.95rem'
            }}
          >
            The page you're looking for doesn't exist
          </Typography>

          <StyledButton href="/" variant="outlined">
            Return home
          </StyledButton>
        </ContentContainer>
      </MainContent>
    </>
  );
}

export default Status404;
