import { Box, Typography, Container, Button, styled, keyframes, alpha } from '@mui/material';
import Head from 'next/head';
import { Home, SearchOff, AutoAwesome, TrendingUp, Visibility } from '@mui/icons-material';
import { useState, useEffect } from 'react';

const floatAnimation = keyframes`
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-8px) rotate(1deg);
  }
  66% {
    transform: translateY(-4px) rotate(-1deg);
  }
`;

const particleFloat = keyframes`
  0%, 100% {
    transform: translateY(0px) translateX(0px) scale(1);
    opacity: 0.6;
  }
  25% {
    transform: translateY(-20px) translateX(10px) scale(1.1);
    opacity: 0.8;
  }
  50% {
    transform: translateY(-10px) translateX(-8px) scale(0.9);
    opacity: 1;
  }
  75% {
    transform: translateY(-25px) translateX(5px) scale(1.05);
    opacity: 0.7;
  }
`;

const shimmerAnimation = keyframes`
  0% { 
    transform: translateX(-100%) skewX(-15deg);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% { 
    transform: translateX(200%) skewX(-15deg);
    opacity: 0;
  }
`;

const glowPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px ${(props) => alpha(props.theme.palette.primary.main, 0.4)};
  }
  50% {
    box-shadow: 0 0 40px ${(props) => alpha(props.theme.palette.primary.main, 0.6)}, 
                0 0 60px ${(props) => alpha(props.theme.palette.secondary.main, 0.3)};
  }
`;

const pulseAnimation = keyframes`
  0%, 100% {
    opacity: 0.8;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.05);
  }
`;

const MainContent = styled(Box)(
  ({ theme }) => `
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(145deg, 
      ${alpha(theme.palette.background.default, 0.98)} 0%, 
      ${alpha(theme.palette.background.paper, 0.95)} 30%,
      ${alpha(theme.palette.background.default, 0.92)} 70%,
      ${alpha(theme.palette.background.paper, 0.98)} 100%
    );
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        radial-gradient(circle at 20% 30%, ${alpha(
          theme.palette.primary.main,
          0.12
        )} 0%, transparent 60%),
        radial-gradient(circle at 80% 70%, ${alpha(
          theme.palette.secondary.main,
          0.1
        )} 0%, transparent 60%),
        radial-gradient(circle at 50% 50%, ${alpha(
          theme.palette.info.main,
          0.08
        )} 0%, transparent 70%);
      animation: ${pulseAnimation} 6s ease-in-out infinite;
    }
    
    &::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: repeating-conic-gradient(
        from 0deg at 50% 50%,
        transparent 0deg,
        ${alpha(theme.palette.primary.main, 0.02)} 2deg,
        transparent 4deg,
        ${alpha(theme.palette.secondary.main, 0.02)} 6deg,
        transparent 8deg
      );
      animation: rotate 60s linear infinite;
      pointer-events: none;
    }
    
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `
);

const ContentContainer = styled(Container)(
  ({ theme }) => `
    position: relative;
    z-index: 2;
    text-align: center;
    background: linear-gradient(145deg, 
      ${alpha(theme.palette.background.paper, 0.95)} 0%, 
      ${alpha(theme.palette.background.paper, 0.92)} 50%, 
      ${alpha(theme.palette.background.paper, 0.95)} 100%
    );
    backdropFilter: blur(40px) saturate(180%);
    borderRadius: 32px;
    padding: 56px 40px;
    border: 2px solid ${alpha(theme.palette.divider, 0.15)};
    boxShadow: 
      0 25px 50px ${alpha(theme.palette.common.black, 0.1)},
      0 0 0 1px ${alpha(theme.palette.common.white, 0.05)} inset,
      0 1px 0 ${alpha(theme.palette.common.white, 0.1)} inset;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, 
        ${theme.palette.primary.main} 0%, 
        ${theme.palette.success.main} 20%, 
        ${theme.palette.info.main} 40%, 
        ${theme.palette.warning.main} 60%, 
        ${theme.palette.error.main} 80%,
        ${theme.palette.secondary.main} 100%
      );
      borderRadius: 32px 32px 0 0;
      opacity: 0.9;
      animation: ${shimmerAnimation} 4s ease-in-out infinite;
      zIndex: 1;
    }
    
    &:hover {
      transform: translateY(-4px);
      boxShadow: 
        0 35px 70px ${alpha(theme.palette.common.black, 0.15)},
        0 0 0 1px ${alpha(theme.palette.common.white, 0.08)} inset;
    }
    
    @media (max-width: 600px) {
      padding: 40px 28px;
      borderRadius: 24px;
      border: 1px solid ${alpha(theme.palette.divider, 0.1)};
    }
  `
);

const AnimatedNumber = styled(Typography)(
  ({ theme }) => `
    background: linear-gradient(135deg, 
      ${theme.palette.primary.main} 0%,
      ${theme.palette.secondary.main} 50%,
      ${theme.palette.info.main} 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 900;
    font-size: 9rem;
    line-height: 0.9;
    margin-bottom: 20px;
    animation: ${floatAnimation} 4s ease-in-out infinite;
    text-shadow: 0 8px 32px ${alpha(theme.palette.primary.main, 0.3)};
    position: relative;
    
    &::before {
      content: '404';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, 
        transparent 0%,
        ${alpha(theme.palette.primary.main, 0.1)} 50%,
        transparent 100%
      );
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      filter: blur(8px);
      z-index: -1;
    }
    
    @media (max-width: 600px) {
      font-size: 6.5rem;
    }
  `
);

const StyledButton = styled(Button)(
  ({ theme }) => `
    text-transform: none;
    font-weight: 700;
    font-size: 1.2rem;
    padding: 16px 40px;
    border-radius: 20px;
    background: linear-gradient(145deg, 
      ${theme.palette.primary.main} 0%, 
      ${theme.palette.secondary.main} 100%
    );
    color: #FFFFFF;
    border: none;
    backdropFilter: blur(10px);
    boxShadow: 
      0 8px 32px ${alpha(theme.palette.primary.main, 0.4)},
      0 0 0 1px ${alpha(theme.palette.common.white, 0.1)} inset;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, 
        transparent 0%, 
        ${alpha(theme.palette.common.white, 0.3)} 50%, 
        transparent 100%
      );
      transition: left 0.6s ease;
    }
    
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: ${alpha(theme.palette.common.white, 0.2)};
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition: all 0.3s ease;
    }
    
    &:hover {
      transform: translateY(-3px) scale(1.02);
      boxShadow: 
        0 15px 45px ${alpha(theme.palette.primary.main, 0.5)},
        0 0 0 1px ${alpha(theme.palette.common.white, 0.15)} inset;
      background: linear-gradient(145deg, 
        ${theme.palette.primary.dark} 0%, 
        ${theme.palette.secondary.dark} 100%
      );
      
      &::before {
        left: 100%;
      }
      
      &::after {
        width: 300px;
        height: 300px;
      }
    }
    
    &:active {
      transform: translateY(-1px) scale(0.98);
    }
  `
);

const IconContainer = styled(Box)(
  ({ theme }) => `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(145deg, 
      ${alpha(theme.palette.background.paper, 0.8)} 0%, 
      ${alpha(theme.palette.background.default, 0.6)} 100%
    );
    border: 3px solid ${alpha(theme.palette.primary.main, 0.2)};
    backdropFilter: blur(20px);
    margin-bottom: 32px;
    animation: ${floatAnimation} 3s ease-in-out infinite reverse;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, 
        ${alpha(theme.palette.primary.main, 0.1)} 0%, 
        transparent 30%, 
        ${alpha(theme.palette.secondary.main, 0.1)} 70%,
        transparent 100%
      );
      border-radius: 50%;
      animation: ${pulseAnimation} 3s ease-in-out infinite;
    }
    
    &:hover {
      transform: scale(1.1);
      border-color: ${alpha(theme.palette.primary.main, 0.4)};
      animation: ${glowPulse} 2s ease-in-out infinite;
    }
  `
);

const ParticleContainer = styled(Box)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
`;

const Particle = styled(Box)(
  ({ theme, delay = 0, x = 50, y = 50 }) => `
  position: absolute;
  width: 4px;
  height: 4px;
  background: ${theme.palette.primary.main};
  border-radius: 50%;
  left: ${x}%;
  top: ${y}%;
  animation: ${particleFloat} ${3 + Math.random() * 2}s ease-in-out infinite;
  animation-delay: ${delay}s;
  opacity: 0.6;
`
);

const StyledTypography = styled(Typography)(
  ({ theme }) => `
    color: ${theme.palette.mode === 'dark' ? '#FFFFFF' : alpha('#212B36', 0.95)};
    font-weight: 700;
    letter-spacing: -0.02em;
    text-shadow: 0 2px 4px ${alpha(theme.palette.common.black, 0.1)};
  `
);

const SubtitleTypography = styled(Typography)(
  ({ theme }) => `
    color: ${theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.85) : alpha('#637381', 0.9)};
    line-height: 1.7;
    font-weight: 500;
    text-shadow: 0 1px 2px ${alpha(theme.palette.common.black, 0.05)};
  `
);

const XRPLText = styled(Typography)(
  ({ theme }) => `
    background: linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main});
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 800;
    display: inline;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main});
      border-radius: 1px;
      animation: ${shimmerAnimation} 2s ease-in-out infinite;
    }
  `
);

const ErrorCodeTypography = styled(Typography)(
  ({ theme }) => `
    color: ${theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.6) : alpha('#637381', 0.7)};
    font-size: 0.85rem;
    font-weight: 600;
    padding: 8px 16px;
    border-radius: 12px;
    background: ${alpha(theme.palette.background.paper, 0.6)};
    border: 1px solid ${alpha(theme.palette.divider, 0.15)};
    backdrop-filter: blur(20px);
    box-shadow: 0 4px 12px ${alpha(theme.palette.common.black, 0.05)};
  `
);

const QuickNavContainer = styled(Box)(
  ({ theme }) => `
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 24px;
    flex-wrap: wrap;
  `
);

const QuickNavButton = styled(Button)(
  ({ theme }) => `
    min-width: auto;
    padding: 8px 16px;
    border-radius: 12px;
    background: ${alpha(theme.palette.background.paper, 0.7)};
    border: 1px solid ${alpha(theme.palette.divider, 0.2)};
    color: ${theme.palette.text.secondary};
    font-size: 0.85rem;
    font-weight: 500;
    backdrop-filter: blur(10px);
    transition: all 0.2s ease;
    
    &:hover {
      background: ${alpha(theme.palette.primary.main, 0.1)};
      border-color: ${alpha(theme.palette.primary.main, 0.3)};
      color: ${theme.palette.primary.main};
      transform: translateY(-1px);
    }
  `
);

function Status404() {
  const [particles, setParticles] = useState([]);
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
    'BLUE scanned every wavelength on the XRPL spectrum but this page is invisible to all frequencies! 💙 Even the deepest ocean search came up empty! 🌊'
  ];

  useEffect(() => {
    const particleArray = [];
    for (let i = 0; i < 15; i++) {
      particleArray.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2
      });
    }
    setParticles(particleArray);

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
        <ParticleContainer>
          {particles.map((particle) => (
            <Particle key={particle.id} delay={particle.delay} x={particle.x} y={particle.y} />
          ))}
        </ParticleContainer>

        <ContentContainer maxWidth="sm">
          <IconContainer>
            <SearchOff
              sx={{ fontSize: 48, color: 'primary.main', position: 'relative', zIndex: 1 }}
            />
          </IconContainer>

          <AnimatedNumber variant="h1">404</AnimatedNumber>

          <StyledTypography
            variant="h3"
            sx={{
              mb: 3,
              fontSize: { xs: '1.8rem', sm: '2.4rem' }
            }}
          >
            Page Not Found
          </StyledTypography>

          <SubtitleTypography
            variant="body1"
            sx={{
              mb: 5,
              fontSize: '1.2rem',
              maxWidth: '450px',
              mx: 'auto'
            }}
          >
            {currentJoke}
          </SubtitleTypography>

          <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap', mb: 4 }}>
            <StyledButton href="/" startIcon={<Home />} size="large">
              Back to Home
            </StyledButton>
          </Box>

          <QuickNavContainer>
            <QuickNavButton
              href="/trending"
              startIcon={<TrendingUp sx={{ fontSize: 16 }} />}
              size="small"
            >
              Trending
            </QuickNavButton>
            <QuickNavButton
              href="/most-viewed"
              startIcon={<Visibility sx={{ fontSize: 16 }} />}
              size="small"
            >
              Most Viewed
            </QuickNavButton>
            <QuickNavButton
              href="/new"
              startIcon={<AutoAwesome sx={{ fontSize: 16 }} />}
              size="small"
            >
              New Tokens
            </QuickNavButton>
          </QuickNavContainer>

          <Box sx={{ mt: 4 }}>
            <ErrorCodeTypography>Error code: 404 • XRPL.to Explorer</ErrorCodeTypography>
          </Box>
        </ContentContainer>
      </MainContent>
    </>
  );
}

export default Status404;
