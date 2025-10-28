import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Stack, Typography, Box, Container } from '@mui/material';
import CollectionList from './CollectionList';
import { fVolume, fIntNumber } from 'src/utils/formatters';
// Constants
const CollectionListType = {
  ALL: 'ALL',
  FEATURED: 'FEATURED',
  TRENDING: 'TRENDING'
};
import { useTheme } from '@mui/material/styles';

// Styled Components - matching Summary.js
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(${(props) => props.cols || 1}, 1fr);
  gap: ${(props) => props.spacing || '12px'};
  width: 100%;

  @media (max-width: 900px) {
    grid-template-columns: repeat(${(props) => props.mdCols || props.cols || 1}, 1fr);
    gap: 12px;
  }

  @media (max-width: 600px) {
    display: flex;
    overflow-x: auto;
    gap: 6px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const MetricBox = styled.div`
  padding: 12px;
  height: 100%;
  min-height: 75px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  border-radius: 12px;
  background: ${(props) =>
    props.theme?.palette?.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'};
  border: 1.5px solid
    ${(props) =>
      props.theme?.palette?.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};

  @media (max-width: 600px) {
    padding: 8px 8px;
    min-height: 66px;
    flex: 1;
    min-width: 0;
    border-radius: 12px;
    justify-content: space-between;
  }
`;

const MetricTitle = styled.span`
  font-size: 0.75rem;
  font-weight: 400;
  color: ${(props) =>
    props.theme?.palette?.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(33, 43, 54, 0.7)'};
  margin-bottom: 6px;
  letter-spacing: 0.02em;
  line-height: 1.2;

  @media (max-width: 600px) {
    font-size: 0.6rem;
    margin-bottom: 0;
    line-height: 1.1;
    flex-shrink: 0;
  }
`;

const MetricValue = styled.span`
  font-size: 1.15rem;
  font-weight: 500;
  color: ${(props) => props.theme?.palette?.text?.primary || '#212B36'};
  line-height: 1.1;
  margin-bottom: 2px;
  font-family: inherit;
  letter-spacing: -0.02em;
  white-space: nowrap;

  @media (max-width: 600px) {
    font-size: 0.75rem;
    margin-bottom: 2px;
    line-height: 1;
  }
`;

const PercentageChange = styled.span`
  font-size: 0.85rem;
  color: ${(props) =>
    props.isPositive
      ? props.theme?.palette?.success?.main || '#4caf50'
      : props.theme?.palette?.error?.main || '#f44336'};
  display: inline-flex;
  align-items: flex-start;
  gap: 3px;
  font-weight: 400;
  font-family: inherit;

  @media (max-width: 600px) {
    font-size: 0.65rem;
    gap: 2px;
    flex-shrink: 0;
    margin-top: auto;
  }
`;

// Removed unused ApexCharts-dependent components

const formatNumberWithDecimals = (num) => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(0)}K`;
  return Math.round(num).toLocaleString();
};

function Collections() {
  const theme = useTheme();
  const [globalMetrics, setGlobalMetrics] = useState(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;

  return (
    <Box
      sx={{
        flex: 1,
        py: { xs: 2, sm: 3, md: 4 },
        backgroundColor: 'transparent',
        minHeight: '100vh',
        position: 'relative'
      }}
    >
      {/* Global Metrics Section */}
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 }, mb: 2 }}>
        {globalMetrics && (
          <Box sx={{ width: '100%' }}>
            <Grid cols={6} mdCols={3} spacing="10px">
              <MetricBox theme={theme}>
                <MetricTitle theme={theme}>Volume</MetricTitle>
                <div style={{ display: 'flex', gap: isMobile ? '8px' : '12px', width: '100%' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontSize: '0.6rem',
                      color: theme?.palette?.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(33, 43, 54, 0.6)',
                      display: 'block',
                      marginBottom: '2px'
                    }}>24h</span>
                    <MetricValue theme={theme} style={{ fontSize: isMobile ? '0.75rem' : '16px' }}>
                      ✕ {formatNumberWithDecimals(globalMetrics.total24hVolume || 0)}
                    </MetricValue>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontSize: '0.6rem',
                      color: theme?.palette?.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(33, 43, 54, 0.6)',
                      display: 'block',
                      marginBottom: '2px'
                    }}>Total</span>
                    <MetricValue theme={theme} style={{ fontSize: isMobile ? '0.75rem' : '16px' }}>
                      ✕ {formatNumberWithDecimals(globalMetrics.totalVolume || 0)}
                    </MetricValue>
                  </div>
                </div>
              </MetricBox>

              <MetricBox theme={theme}>
                <MetricTitle theme={theme}>Activity</MetricTitle>
                <div style={{ display: 'flex', gap: isMobile ? '8px' : '12px', width: '100%' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontSize: '0.6rem',
                      color: theme?.palette?.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(33, 43, 54, 0.6)',
                      display: 'block',
                      marginBottom: '2px'
                    }}>Sales</span>
                    <MetricValue theme={theme} style={{ fontSize: isMobile ? '0.75rem' : '16px' }}>
                      {formatNumberWithDecimals(globalMetrics.total24hSales || 0)}
                    </MetricValue>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontSize: '0.6rem',
                      color: theme?.palette?.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(33, 43, 54, 0.6)',
                      display: 'block',
                      marginBottom: '2px'
                    }}>Transfers</span>
                    <MetricValue theme={theme} style={{ fontSize: isMobile ? '0.75rem' : '16px' }}>
                      {formatNumberWithDecimals(globalMetrics.total24hTransfers || 0)}
                    </MetricValue>
                  </div>
                </div>
              </MetricBox>

              <MetricBox theme={theme}>
                <MetricTitle theme={theme}>Traders</MetricTitle>
                <div style={{ display: 'flex', gap: isMobile ? '8px' : '12px', width: '100%' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontSize: '0.6rem',
                      color: theme?.palette?.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(33, 43, 54, 0.6)',
                      display: 'block',
                      marginBottom: '2px'
                    }}>Active</span>
                    <MetricValue theme={theme} style={{ fontSize: isMobile ? '0.75rem' : '16px' }}>
                      {formatNumberWithDecimals(globalMetrics.activeTraders24h || 0)}
                    </MetricValue>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontSize: '0.6rem',
                      color: theme?.palette?.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(33, 43, 54, 0.6)',
                      display: 'block',
                      marginBottom: '2px'
                    }}>Balance</span>
                    <MetricValue theme={theme} style={{ fontSize: isMobile ? '0.75rem' : '16px' }}>
                      ✕ {formatNumberWithDecimals(globalMetrics.totalLiquidity24h || 0)}
                    </MetricValue>
                  </div>
                </div>
              </MetricBox>

              <MetricBox theme={theme}>
                <MetricTitle theme={theme}>Collections</MetricTitle>
                <div style={{ display: 'flex', gap: isMobile ? '8px' : '12px', width: '100%' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontSize: '0.6rem',
                      color: theme?.palette?.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(33, 43, 54, 0.6)',
                      display: 'block',
                      marginBottom: '2px'
                    }}>Active</span>
                    <MetricValue theme={theme} style={{ fontSize: isMobile ? '0.75rem' : '16px' }}>
                      {formatNumberWithDecimals(globalMetrics.activeCollections24h || 0)}
                    </MetricValue>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontSize: '0.6rem',
                      color: theme?.palette?.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(33, 43, 54, 0.6)',
                      display: 'block',
                      marginBottom: '2px'
                    }}>Total</span>
                    <MetricValue theme={theme} style={{ fontSize: isMobile ? '0.75rem' : '16px' }}>
                      {formatNumberWithDecimals(globalMetrics.totalCollections || 0)}
                    </MetricValue>
                  </div>
                </div>
              </MetricBox>

              <MetricBox theme={theme}>
                <MetricTitle theme={theme}>Mints & Burns</MetricTitle>
                <div style={{ display: 'flex', gap: isMobile ? '8px' : '12px', width: '100%' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontSize: '0.6rem',
                      color: theme?.palette?.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(33, 43, 54, 0.6)',
                      display: 'block',
                      marginBottom: '2px'
                    }}>Mints</span>
                    <MetricValue theme={theme} style={{ fontSize: isMobile ? '0.75rem' : '16px' }}>
                      {formatNumberWithDecimals(globalMetrics.total24hMints || 0)}
                    </MetricValue>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontSize: '0.6rem',
                      color: theme?.palette?.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(33, 43, 54, 0.6)',
                      display: 'block',
                      marginBottom: '2px'
                    }}>Burns</span>
                    <MetricValue theme={theme} style={{ fontSize: isMobile ? '0.75rem' : '16px' }}>
                      {formatNumberWithDecimals(globalMetrics.total24hBurns || 0)}
                    </MetricValue>
                  </div>
                </div>
              </MetricBox>

              <MetricBox theme={theme}>
                <MetricTitle theme={theme}>Fees</MetricTitle>
                <div style={{ display: 'flex', gap: isMobile ? '8px' : '12px', width: '100%' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontSize: '0.6rem',
                      color: theme?.palette?.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(33, 43, 54, 0.6)',
                      display: 'block',
                      marginBottom: '2px'
                    }}>Broker</span>
                    <MetricValue theme={theme} style={{ fontSize: isMobile ? '0.75rem' : '16px' }}>
                      ✕ {formatNumberWithDecimals(globalMetrics.total24hBrokerFees || 0)}
                    </MetricValue>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontSize: '0.6rem',
                      color: theme?.palette?.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(33, 43, 54, 0.6)',
                      display: 'block',
                      marginBottom: '2px'
                    }}>Royalty</span>
                    <MetricValue theme={theme} style={{ fontSize: isMobile ? '0.75rem' : '16px' }}>
                      ✕ {formatNumberWithDecimals(globalMetrics.total24hRoyalties || 0)}
                    </MetricValue>
                  </div>
                </div>
              </MetricBox>
            </Grid>
          </Box>
        )}
      </Container>

      <Stack
        sx={{
          minHeight: '50vh',
          px: { xs: 1, sm: 3, md: 4 },
          position: 'relative',
          zIndex: 1,
          animation: 'fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          '@keyframes fadeInUp': {
            '0%': {
              opacity: 0,
              transform: 'translateY(30px)'
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0)'
            }
          }
        }}
      >
        <Box
          sx={{
            borderRadius: '0',
            background: 'transparent',
            backdropFilter: 'none',
            border: 'none',
            boxShadow: 'none',
            overflow: 'visible',
            position: 'relative'
          }}
        >
          <CollectionList type={CollectionListType.ALL} onGlobalMetrics={setGlobalMetrics} />
        </Box>
      </Stack>
    </Box>
  );
}

export default React.memo(Collections);
