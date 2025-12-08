import React, { useState, useContext } from 'react';
import styled from '@emotion/styled';
import CollectionList from './CollectionList';
import { fVolume, fIntNumber } from 'src/utils/formatters';
import { AppContext } from 'src/AppContext';
// Constants
const CollectionListType = {
  ALL: 'ALL',
  FEATURED: 'FEATURED',
  TRENDING: 'TRENDING'
};

// Styled Components - matching Summary.js
const Container = styled.div`
  position: relative;
  z-index: 2;
  margin-top: 16px;
  margin-bottom: 16px;
  width: 100%;
  max-width: 100%;
  background: transparent;
  overflow: visible;

  @media (max-width: 600px) {
    margin: 4px 0;
    padding: 0 4px;
  }

  @media (max-width: 480px) {
    margin: 4px 0;
    padding: 0 4px;
  }
`;

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
    padding-bottom: 4px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }

  @media (max-width: 480px) {
    gap: 6px;
  }
`;

const MetricBox = styled.div`
  padding: 16px;
  height: 100%;
  min-height: 85px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  border-radius: 0;
  background: ${(props) => props.isDark ? 'rgba(59, 130, 246, 0.02)' : 'rgba(59, 130, 246, 0.02)'};
  border: 1px solid ${(props) => props.isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)'};
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    border-color: ${(props) => props.isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.35)'};
    background: ${(props) => props.isDark ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.04)'};
  }

  @media (max-width: 600px) {
    padding: 8px;
    min-height: 62px;
    flex: 0 0 auto;
    min-width: 72px;
    border-radius: 0;
    border-width: 1px;
    justify-content: space-between;
  }

  @media (max-width: 480px) {
    padding: 8px;
    min-height: 62px;
    flex: 0 0 auto;
    min-width: 72px;
    border-radius: 0;
    border-width: 1px;
    justify-content: space-between;
  }
`;

const MetricTitle = styled.span`
  font-size: 0.75rem;
  font-weight: 400;
  color: ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(33, 43, 54, 0.7)'};
  margin-bottom: 6px;
  letter-spacing: 0.02em;
  line-height: 1.2;

  @media (max-width: 600px) {
    font-size: 0.6rem;
    margin-bottom: 2px;
    line-height: 1.1;
    flex-shrink: 0;
  }

  @media (max-width: 480px) {
    font-size: 0.6rem;
    margin-bottom: 2px;
    line-height: 1.1;
    flex-shrink: 0;
  }
`;

const MetricValue = styled.span`
  font-size: 1.35rem;
  font-weight: 500;
  color: ${(props) => props.isDark ? '#FFFFFF' : '#212B36'};
  line-height: 1.1;
  margin-bottom: 4px;
  font-family: inherit;
  letter-spacing: -0.02em;
  white-space: nowrap;

  @media (max-width: 600px) {
    font-size: 0.8rem;
    margin-bottom: 2px;
    line-height: 1.1;
  }

  @media (max-width: 480px) {
    font-size: 0.8rem;
    margin-bottom: 2px;
    line-height: 1.1;
  }
`;

const PercentageChange = styled.span`
  font-size: 0.75rem;
  color: ${(props) => props.isPositive ? '#10b981' : '#ef4444'};
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-weight: 500;
  font-family: inherit;
  letter-spacing: -0.01em;

  @media (max-width: 600px) {
    font-size: 0.6rem;
    gap: 1px;
    flex-shrink: 0;
    margin-top: auto;
  }

  @media (max-width: 480px) {
    font-size: 0.6rem;
    gap: 1px;
    flex-shrink: 0;
    margin-top: auto;
  }
`;

const VolumePercentage = styled.span`
  font-size: 0.6rem;
  color: ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(33, 43, 54, 0.6)'};
  font-weight: 400;
  letter-spacing: 0.01em;

  @media (max-width: 600px) {
    font-size: 0.48rem;
    line-height: 1;
  }

  @media (max-width: 480px) {
    font-size: 0.48rem;
    line-height: 1;
  }
`;

// Removed unused ApexCharts-dependent components

const formatNumberWithDecimals = (num) => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(0)}K`;
  return Math.round(num).toLocaleString();
};

function Collections({ initialCollections, initialTotal, initialGlobalMetrics }) {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [globalMetrics, setGlobalMetrics] = useState(initialGlobalMetrics);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;

  return (
    <div
      style={{
        flex: 1,
        paddingTop: isMobile ? '8px' : '16px',
        paddingBottom: isMobile ? '16px' : '32px',
        backgroundColor: 'transparent',
        minHeight: '100vh',
        position: 'relative'
      }}
    >
      {/* Global Metrics Section */}
      <Container>
        {globalMetrics && (
          <div style={{ width: '100%' }}>
            <Grid cols={6} mdCols={3} spacing="12px">
              <MetricBox isDark={isDark}>
                <MetricTitle isDark={isDark}>Trading Volume</MetricTitle>
                <div style={{ display: 'flex', gap: isMobile ? '12px' : '24px', width: '100%', marginTop: '4px' }}>
                  <div>
                    <MetricValue isDark={isDark} style={{ fontSize: isMobile ? '0.8rem' : '1.35rem' }}>
                      {formatNumberWithDecimals(globalMetrics.total24hVolume || 0)}
                    </MetricValue>
                    <VolumePercentage isDark={isDark} style={{ display: 'block', marginTop: '2px' }}>24h</VolumePercentage>
                  </div>
                  <div>
                    <MetricValue isDark={isDark} style={{ fontSize: isMobile ? '0.8rem' : '1.35rem' }}>
                      {formatNumberWithDecimals(globalMetrics.totalVolume || 0)}
                    </MetricValue>
                    <VolumePercentage isDark={isDark} style={{ display: 'block', marginTop: '2px' }}>All Time</VolumePercentage>
                  </div>
                </div>
              </MetricBox>

              <MetricBox isDark={isDark}>
                <MetricTitle isDark={isDark}>24h Activity</MetricTitle>
                <div style={{ display: 'flex', gap: isMobile ? '12px' : '24px', width: '100%', marginTop: '4px' }}>
                  <div>
                    <MetricValue isDark={isDark} style={{ fontSize: isMobile ? '0.8rem' : '1.35rem' }}>
                      {formatNumberWithDecimals(globalMetrics.total24hSales || 0)}
                    </MetricValue>
                    <VolumePercentage isDark={isDark} style={{ display: 'block', marginTop: '2px' }}>Sales</VolumePercentage>
                  </div>
                  <div>
                    <MetricValue isDark={isDark} style={{ fontSize: isMobile ? '0.8rem' : '1.35rem' }}>
                      {formatNumberWithDecimals(globalMetrics.total24hTransfers || 0)}
                    </MetricValue>
                    <VolumePercentage isDark={isDark} style={{ display: 'block', marginTop: '2px' }}>Transfers</VolumePercentage>
                  </div>
                </div>
              </MetricBox>

              <MetricBox isDark={isDark}>
                <MetricTitle isDark={isDark}>24h Traders</MetricTitle>
                <div style={{ display: 'flex', gap: isMobile ? '12px' : '24px', width: '100%', marginTop: '4px' }}>
                  <div>
                    <MetricValue isDark={isDark} style={{ fontSize: isMobile ? '0.8rem' : '1.35rem' }}>
                      {formatNumberWithDecimals(globalMetrics.activeTraders24h || 0)}
                    </MetricValue>
                    <VolumePercentage isDark={isDark} style={{ display: 'block', marginTop: '2px' }}>Active</VolumePercentage>
                  </div>
                  <div>
                    <MetricValue isDark={isDark} style={{ fontSize: isMobile ? '0.8rem' : '1.35rem' }}>
                      {formatNumberWithDecimals(globalMetrics.totalLiquidity24h || 0)}
                    </MetricValue>
                    <VolumePercentage isDark={isDark} style={{ display: 'block', marginTop: '2px' }}>Liquidity</VolumePercentage>
                  </div>
                </div>
              </MetricBox>

              <MetricBox isDark={isDark}>
                <MetricTitle isDark={isDark}>Collections</MetricTitle>
                <div style={{ display: 'flex', gap: isMobile ? '12px' : '24px', width: '100%', marginTop: '4px' }}>
                  <div>
                    <MetricValue isDark={isDark} style={{ fontSize: isMobile ? '0.8rem' : '1.35rem' }}>
                      {formatNumberWithDecimals(globalMetrics.activeCollections24h || 0)}
                    </MetricValue>
                    <VolumePercentage isDark={isDark} style={{ display: 'block', marginTop: '2px' }}>Active</VolumePercentage>
                  </div>
                  <div>
                    <MetricValue isDark={isDark} style={{ fontSize: isMobile ? '0.8rem' : '1.35rem' }}>
                      {formatNumberWithDecimals(globalMetrics.totalCollections || 0)}
                    </MetricValue>
                    <VolumePercentage isDark={isDark} style={{ display: 'block', marginTop: '2px' }}>Total</VolumePercentage>
                  </div>
                </div>
              </MetricBox>

              <MetricBox isDark={isDark}>
                <MetricTitle isDark={isDark}>24h Mints & Burns</MetricTitle>
                <div style={{ display: 'flex', gap: isMobile ? '12px' : '24px', width: '100%', marginTop: '4px' }}>
                  <div>
                    <MetricValue isDark={isDark} style={{ fontSize: isMobile ? '0.8rem' : '1.35rem' }}>
                      {formatNumberWithDecimals(globalMetrics.total24hMints || 0)}
                    </MetricValue>
                    <VolumePercentage isDark={isDark} style={{ display: 'block', marginTop: '2px' }}>Minted</VolumePercentage>
                  </div>
                  <div>
                    <MetricValue isDark={isDark} style={{ fontSize: isMobile ? '0.8rem' : '1.35rem' }}>
                      {formatNumberWithDecimals(globalMetrics.total24hBurns || 0)}
                    </MetricValue>
                    <VolumePercentage isDark={isDark} style={{ display: 'block', marginTop: '2px' }}>Burned</VolumePercentage>
                  </div>
                </div>
              </MetricBox>

              <MetricBox isDark={isDark}>
                <MetricTitle isDark={isDark}>24h Fees Paid</MetricTitle>
                <div style={{ display: 'flex', gap: isMobile ? '12px' : '24px', width: '100%', marginTop: '4px' }}>
                  <div>
                    <MetricValue isDark={isDark} style={{ fontSize: isMobile ? '0.8rem' : '1.35rem' }}>
                      {formatNumberWithDecimals(globalMetrics.total24hBrokerFees || 0)}
                    </MetricValue>
                    <VolumePercentage isDark={isDark} style={{ display: 'block', marginTop: '2px' }}>Broker</VolumePercentage>
                  </div>
                  <div>
                    <MetricValue isDark={isDark} style={{ fontSize: isMobile ? '0.8rem' : '1.35rem' }}>
                      {formatNumberWithDecimals(globalMetrics.total24hRoyalties || 0)}
                    </MetricValue>
                    <VolumePercentage isDark={isDark} style={{ display: 'block', marginTop: '2px' }}>Royalties</VolumePercentage>
                  </div>
                </div>
              </MetricBox>
            </Grid>
          </div>
        )}
      </Container>

      {/* Table Section - aligned with metric boxes */}
      <Container>
        <div
          style={{
            minHeight: '50vh',
            position: 'relative',
            zIndex: 1,
            borderRadius: 0,
            background: isDark ? 'rgba(59, 130, 246, 0.02)' : 'rgba(59, 130, 246, 0.02)',
            border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)'}`,
            overflow: 'hidden'
          }}
        >
          <CollectionList
            type={CollectionListType.ALL}
            onGlobalMetrics={setGlobalMetrics}
            initialCollections={initialCollections}
            initialTotal={initialTotal}
          />
        </div>
      </Container>
    </div>
  );
}

export default React.memo(Collections);
