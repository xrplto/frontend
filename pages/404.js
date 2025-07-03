import { Box, Typography, Container, Button, styled, alpha } from '@mui/material';
import Head from 'next/head';
import { Home, SearchOff, AutoAwesome, TrendingUp, Visibility } from '@mui/icons-material';
import { useState, useEffect } from 'react';

const MainContent = styled(Box)(
  ({ theme }) => `
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${theme.palette.background.default};
    padding: ${theme.spacing(3)};
  `
);

const ContentContainer = styled(Container)(
  ({ theme }) => `
    text-align: center;
    padding: ${theme.spacing(6, 4)};
    border-radius: 16px;
    background-color: ${theme.palette.background.paper};
    box-shadow: 0 8px 32px ${alpha(theme.palette.common.black, 0.05)};

    @media (max-width: 600px) {
      padding: ${theme.spacing(4, 2)};
    }
  `
);

const StyledNumber = styled(Typography)(
  ({ theme }) => `
    color: ${theme.palette.text.primary};
    font-weight: 700;
    font-size: 8rem;
    line-height: 1;
    margin-bottom: ${theme.spacing(1)};
    
    @media (max-width: 600px) {
      font-size: 6rem;
    }
  `
);

const StyledButton = styled(Button)(
  ({ theme }) => `
    text-transform: none;
    font-weight: 600;
    font-size: 1rem;
    padding: ${theme.spacing(1.5, 4)};
    border-radius: 12px;
  `
);

const IconWrapper = styled(Box)(
  ({ theme }) => `
    margin-bottom: ${theme.spacing(3)};
    color: ${theme.palette.primary.main};
  `
);

const SubtitleTypography = styled(Typography)(
  ({ theme }) => `
    color: ${theme.palette.text.secondary};
    line-height: 1.6;
    font-weight: 400;
    max-width: 480px;
    margin-left: auto;
    margin-right: auto;
  `
);

const QuickNavContainer = styled(Box)(
  ({ theme }) => `
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: ${theme.spacing(3)};
    flex-wrap: wrap;
  `
);

const QuickNavButton = styled(Button)(
  ({ theme }) => `
    text-transform: none;
    color: ${theme.palette.text.secondary};
    font-size: 0.9rem;
    font-weight: 500;
    padding: ${theme.spacing(0.75, 1.5)};
    
    &:hover {
      background: ${alpha(theme.palette.primary.main, 0.08)};
    }
  `
);

function Status404() {
  const [currentJoke, setCurrentJoke] = useState('');

  const jokes = [
    "Looks like this page got lost in the XRPL ledger... Even our lightning-fast 3-5 second settlements can't locate it!",
    'FUZZY BEAR 🐻 predicts this page will be found right after XRP flips BTC! Until then, maybe check out our trending tokens? 🚀',
    "This page vanished down to the smallest DROP! 💧 We searched all 1,000,000 drops in an XRP but still can't find it! 🔍",
    "Tried withdrawing this page from an ATM but got 'insufficient funds'! 🏧 Guess ALL THE MONEY can't buy everything on the XRPL! 💸",
    "This page went BAYNANA and slipped away! 🍌 Even the apes can't find it in the XRPL jungle! 🐒",
    "This page burned out faster than PHNIX rising from the ashes! 🔥 Even the Phoenix can't resurrect a 404 error! 🦅",
    "Florida Man tried landscaping the XRPL but accidentally buried this page! 🌴 Even his alligator can't dig it up from the swamp! 🐊",
    "The ARMY was deployed to search for this page but returned empty-handed! 🪖 Even military precision can't locate a missing XRPL asset! ⚔️",
    "SCRAPPY the dog sniffed around the entire XRPL blockchain but couldn't fetch this page! 🐕 Good boy tried his best! 🦴",
    "BERT the Bird flew across the entire XRPL network but this page has flown the coop! 🐦 Even his bird's-eye view couldn't spot it! 🪶",
    "xSPECTAR searched every dimension of the metaverse but this page exists in a parallel universe! 🌌 Even virtual reality can't render a 404! 👽",
    "XRDOGE went 'much search, very XRPL, such 404, wow!' 🐕 Even the goodest boy on the ledger couldn't find this page! 🚀",
    'XOGE the red panda climbed every bamboo node on the XRPL but this page is hidden higher than the tallest tree! 🐼 So cute, yet so lost! 🎋',
    "DONNIE called in all his connections across the XRPL network but this page is more elusive than insider alpha! 📱 Even the boss can't make it appear! 💼",
    "PONGO bounced through every transaction on the XRPL but this page keeps jumping away! 🦘 Even the most energetic hopper can't catch it! 🏃‍♂️",
    'BLUE scanned every wavelength on the XRPL spectrum but this page is invisible to all frequencies! 💙 Even the deepest ocean search came up empty! 🌊',
    "BRAD called an emergency board meeting to locate this page! 👨‍💼 Even the CEO of blockchain leadership couldn't execute this search query! 📊"
  ];

  useEffect(() => {
    // Set random joke on page load
    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
    setCurrentJoke(randomJoke);
  }, []);

  return (
    <>
      <Head>
        <title>404 - Page Not Found | XRPL.to</title>
        <meta name="description" content="The page you're looking for doesn't exist on XRPL.to" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <MainContent>
        <ContentContainer maxWidth="sm">
          <IconWrapper>
            <SearchOff sx={{ fontSize: 60 }} />
          </IconWrapper>

          <StyledNumber variant="h1">404</StyledNumber>

          <Typography
            variant="h4"
            component="h2"
            sx={{
              fontWeight: 600,
              mb: 2,
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            Page Not Found
          </Typography>

          <SubtitleTypography variant="body1" sx={{ mb: 4 }}>
            {currentJoke}
          </SubtitleTypography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <StyledButton href="/" variant="contained" startIcon={<Home />}>
              Go to Homepage
            </StyledButton>
          </Box>

          <QuickNavContainer>
            <QuickNavButton href="/trending" startIcon={<TrendingUp sx={{ fontSize: 18 }} />}>
              Trending
            </QuickNavButton>
            <QuickNavButton href="/most-viewed" startIcon={<Visibility sx={{ fontSize: 18 }} />}>
              Most Viewed
            </QuickNavButton>
            <QuickNavButton href="/new" startIcon={<AutoAwesome sx={{ fontSize: 18 }} />}>
              New Tokens
            </QuickNavButton>
          </QuickNavContainer>
        </ContentContainer>
      </MainContent>
    </>
  );
}

export default Status404;
