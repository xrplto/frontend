import { useContext } from 'react';
import { useSelector } from 'react-redux';
import { AppContext } from 'src/AppContext';
import { selectMetrics } from 'src/redux/statusSlice';
import {
  Box,
  Container,
  Grid,
  styled,
  Toolbar,
  useMediaQuery,
  Paper,
  alpha,
  Stack,
  Fade,
  useTheme
} from '@mui/material';
import CryptoHeatmap from 'src/components/CryptoHeatmap';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import Summary from 'src/TokenList/Summary';

const OverviewWrapper = styled(Box)(
  ({ theme }) => `
    overflow: hidden;
    flex: 1;
    background: ${
      theme.palette.mode === 'dark'
        ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(
            theme.palette.background.paper,
            0.8
          )} 100%)`
        : `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.9)} 0%, ${alpha(
            theme.palette.background.paper,
            0.95
          )} 100%)`
    };
    min-height: 100vh;
    position: relative;
    
    &::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${
        theme.palette.mode === 'dark'
          ? `radial-gradient(circle at 20% 20%, ${alpha(
              theme.palette.primary.main,
              0.08
            )} 0%, transparent 60%),
           radial-gradient(circle at 80% 80%, ${alpha(
             theme.palette.secondary.main,
             0.08
           )} 0%, transparent 60%),
           radial-gradient(circle at 40% 40%, ${alpha(
             theme.palette.success.main,
             0.05
           )} 0%, transparent 50%)`
          : `radial-gradient(circle at 20% 20%, ${alpha(
              theme.palette.primary.main,
              0.04
            )} 0%, transparent 60%),
           radial-gradient(circle at 80% 80%, ${alpha(
             theme.palette.secondary.main,
             0.04
           )} 0%, transparent 60%),
           radial-gradient(circle at 40% 40%, ${alpha(
             theme.palette.success.main,
             0.03
           )} 0%, transparent 50%)`
      };
      pointer-events: none;
      z-index: -1;
    }
  `
);

const MainContent = styled(Container)(
  ({ theme }) => `
    position: relative;
    z-index: 1;
    padding-top: ${theme.spacing(3)};
    padding-bottom: ${theme.spacing(6)};
    
    ${theme.breakpoints.down('md')} {
      padding-top: ${theme.spacing(2)};
      padding-bottom: ${theme.spacing(4)};
    }
  `
);

const SummaryWrapper = styled(Paper)(
  ({ theme }) => `
    background: linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(
      theme.palette.background.paper,
      0.5
    )} 100%);
    backdrop-filter: blur(25px);
    border-radius: 24px;
    padding: ${theme.spacing(3, 4)};
    border: 1px solid ${alpha(theme.palette.divider, 0.12)};
    box-shadow: 0 8px 32px 0 ${alpha(theme.palette.common.black, 0.1)};
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    ${theme.breakpoints.down('md')} {
      padding: ${theme.spacing(2.5, 3)};
      border-radius: 20px;
    }
  `
);

const HeatmapWrapper = styled(Paper)(
  ({ theme }) => `
    background: linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(
      theme.palette.background.paper,
      0.5
    )} 100%);
    backdrop-filter: blur(25px);
    border-radius: 24px;
    padding: ${theme.spacing(4)};
    border: 1px solid ${alpha(theme.palette.divider, 0.12)};
    box-shadow: 0 8px 32px 0 ${alpha(theme.palette.common.black, 0.1)};
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    ${theme.breakpoints.down('md')} {
      padding: ${theme.spacing(3)};
      border-radius: 20px;
    }
  `
);

const CryptoHeatmapPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { activeFiatCurrency } = useContext(AppContext);
  const metrics = useSelector(selectMetrics);
  const exchRate = metrics[activeFiatCurrency];

  return (
    <OverviewWrapper>
      <Toolbar id="back-to-top-anchor" />
      {!isMobile ? <Topbar /> : ''}
      <Header />
      {isMobile ? <Topbar /> : ''}

      <MainContent maxWidth="xl">
        <Fade in timeout={800}>
          <Stack spacing={isMobile ? 3 : 5}>
            {/* Summary Section */}
            <SummaryWrapper elevation={0}>
              <Summary />
            </SummaryWrapper>

            {/* Heatmap Section */}
            <HeatmapWrapper elevation={0}>
              <CryptoHeatmap exchRate={exchRate} />
            </HeatmapWrapper>
          </Stack>
        </Fade>
      </MainContent>

      <Footer />
    </OverviewWrapper>
  );
};

export default CryptoHeatmapPage;
