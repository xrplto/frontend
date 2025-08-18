import { useContext } from 'react';
import { useSelector } from 'react-redux';
import { AppContext } from 'src/AppContext';
import { selectMetrics } from 'src/redux/statusSlice';
import {
  Box,
  Container,
  styled,
  Toolbar,
  useMediaQuery,
  alpha,
  Stack,
  Fade,
  useTheme,
  Typography
} from '@mui/material';
import CryptoHeatmap from 'src/components/CryptoHeatmap';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import Summary from 'src/TokenList/Summary';

const OverviewWrapper = styled(Box)(({ theme }) => ({
  overflow: 'hidden',
  flex: 1,
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(145deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`
    : `linear-gradient(145deg, ${alpha(theme.palette.background.default, 0.95)} 0%, ${theme.palette.background.paper} 100%)`,
  minHeight: '100vh',
  position: 'relative',
  
  '&::before': {
    content: '""',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: theme.palette.mode === 'dark'
      ? `radial-gradient(circle at 30% 30%, ${alpha(theme.palette.primary.main, 0.06)} 0%, transparent 50%),
         radial-gradient(circle at 70% 70%, ${alpha(theme.palette.secondary.main, 0.06)} 0%, transparent 50%)`
      : `radial-gradient(circle at 30% 30%, ${alpha(theme.palette.primary.main, 0.03)} 0%, transparent 50%),
         radial-gradient(circle at 70% 70%, ${alpha(theme.palette.secondary.main, 0.03)} 0%, transparent 50%)`,
    pointerEvents: 'none',
    zIndex: -1
  }
}));

const MainContent = styled(Container)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(8),
  
  [theme.breakpoints.down('md')]: {
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(6)
  }
}));



const CryptoHeatmapPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { activeFiatCurrency } = useContext(AppContext);
  const metrics = useSelector(selectMetrics);
  const exchRate = metrics[activeFiatCurrency];

  return (
    <OverviewWrapper>
      <Toolbar id="back-to-top-anchor" />
      {!isMobile && <Topbar />}
      <Header />
      {isMobile && <Topbar />}

      <MainContent maxWidth="xl">
        <Fade in timeout={1000}>
          <Stack spacing={isMobile ? 3 : 4}>
            <Box>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  fontWeight: 700,
                  mb: 1,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent'
                }}
              >
                Token Heatmap
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ mb: 3, maxWidth: 600 }}
              >
                Visualize token performance with real-time market data and interactive heatmap analysis
              </Typography>
            </Box>

            <Summary />

            <CryptoHeatmap exchRate={exchRate} />
          </Stack>
        </Fade>
      </MainContent>

      <Footer />
    </OverviewWrapper>
  );
};

export default CryptoHeatmapPage;
