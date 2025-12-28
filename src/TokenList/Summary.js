import Decimal from 'decimal.js-light';
import { useContext, useState, useEffect, useRef, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import styled from '@emotion/styled';
import { css } from '@emotion/react';

// Translations removed - not using i18n

// Redux
import { useSelector } from 'react-redux';
import { selectMetrics, selectTokenCreation } from 'src/redux/statusSlice';

// Utils
import { fNumber } from 'src/utils/formatters';

// Constants
const currencySymbols = {
  USD: '$',
  EUR: '€',
  JPY: '¥',
  CNH: '¥',
  XRP: ''
};

// Components
import { AppContext } from 'src/AppContext';
// Removed ECharts dependency
import { format } from 'date-fns';

// Styled Components
const Container = styled.div`
  position: relative;
  z-index: 2;
  margin-bottom: 12px;
  width: 100%;
  max-width: 100%;
  background: transparent;
  overflow: visible;

  @media (max-width: 600px) {
    margin: 8px 0;
    padding: 0;
  }
`;

const Stack = styled.div`
  display: flex;
  flex-direction: ${(props) => (props.direction === 'row' ? 'row' : 'column')};
  gap: ${(props) => props.spacing || '8px'};
  align-items: ${(props) => props.alignItems || 'stretch'};
  justify-content: ${(props) => props.justifyContent || 'flex-start'};
  width: ${(props) => props.width || 'auto'};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr) 1.5fr;
  gap: 10px;
  width: 100%;

  @media (max-width: 1400px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    display: flex;
    overflow-x: auto;
    gap: 8px;
    padding-bottom: 4px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const MetricBox = styled.div`
  padding: 12px 14px;
  height: 82px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  border-radius: 10px;
  background: ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(0, 0, 0, 0.018)'};
  border: 1px solid ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'};
  transition: all 0.15s ease;

  &:hover {
    border-color: ${(props) => props.isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.3)'};
    background: ${(props) => props.isDark ? 'rgba(59, 130, 246, 0.06)' : 'rgba(59, 130, 246, 0.04)'};
  }

  @media (max-width: 600px) {
    padding: 10px 12px;
    height: 68px;
    flex: 0 0 auto;
    min-width: 95px;
    border-radius: 10px;
  }
`;

const MetricTitle = styled.span`
  font-size: 0.68rem;
  font-weight: 400;
  color: ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(33, 43, 54, 0.5)'};
  letter-spacing: 0.02em;

  @media (max-width: 600px) {
    font-size: 0.58rem;
  }
`;

const MetricValue = styled.span`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${(props) => props.isDark ? '#FFFFFF' : '#212B36'};
  line-height: 1;
  letter-spacing: -0.02em;
  white-space: nowrap;

  @media (max-width: 600px) {
    font-size: 0.92rem;
  }
`;

const PercentageChange = styled.span`
  font-size: 0.68rem;
  color: ${(props) => props.isPositive ? '#10b981' : '#ef4444'};
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-weight: 500;
  letter-spacing: -0.01em;
  padding: 1px 4px;
  border-radius: 4px;
  background: ${(props) => props.isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};

  @media (max-width: 600px) {
    font-size: 0.58rem;
    padding: 1px 3px;
  }
`;

const VolumePercentage = styled.span`
  font-size: 0.58rem;
  color: ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(33, 43, 54, 0.45)'};
  font-weight: 400;

  @media (max-width: 600px) {
    font-size: 0.5rem;
  }
`;

const ContentTypography = styled.span`
  color: ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(33, 43, 54, 0.7)'};
  font-size: 0.7rem;
  font-weight: 400;
  letter-spacing: 0.01em;

  @media (max-width: 600px) {
    font-size: 0.48rem;
  }

  @media (max-width: 480px) {
    font-size: 0.45rem;
  }
`;

const ChartContainer = styled.div`
  width: 100%;
  height: ${(props) => props.height || '180px'};
  margin-top: ${(props) => props.mt || '0'};

  @media (max-width: 600px) {
    height: 140px;
  }
`;

const TooltipContainer = styled.div`
  background: ${(props) => (props.darkMode ? '#1c1c1c' : 'white')};
  color: ${(props) => (props.darkMode ? '#fff' : '#000')};
  border: 1.5px solid
    ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')};
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  z-index: 9999;
  position: relative;
`;

const Skeleton = styled.div`
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 8px;
  height: ${(props) => props.height || '20px'};
  width: ${(props) => props.width || '100%'};

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

const CircularProgress = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top-color: #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const ChartMetricBox = styled(MetricBox)`
  grid-column: span 1;
  overflow: visible;
  height: 82px;

  @media (max-width: 1400px) {
    grid-column: span 3;
  }

  @media (max-width: 1024px) {
    grid-column: span 3;
  }

  @media (max-width: 768px) {
    grid-column: span 2;
  }

  @media (max-width: 600px) {
    display: none;
  }
`;

const MobileChartBox = styled(MetricBox)`
  display: none;

  @media (max-width: 600px) {
    display: flex;
    margin-top: 4px;
  }
`;

function Rate(num, exch) {
  if (num === 0 || exch === 0) return 0;
  return fNumber(num / exch);
}

const formatNumberWithDecimals = (num) => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(0)}K`;
  return Math.round(num).toLocaleString();
};

// Canvas-based Token Chart Component with Tooltips
const TokenChart = ({ data, theme, activeFiatCurrency, darkMode }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, data: null });

  const handleMouseMove = (event) => {
    if (!data || data.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;

    const chartData = data.slice(-30);
    if (chartData.length === 0) return;

    const width = rect.width;
    const pointWidth = width / Math.max(chartData.length - 1, 1);

    // Find closest data point
    const closestIndex = Math.max(
      0,
      Math.min(Math.round(mouseX / pointWidth), chartData.length - 1)
    );
    const dataPoint = chartData[closestIndex];

    // Show tooltip for the closest data point
    setTooltip({
      show: true,
      x: event.clientX,
      y: event.clientY,
      data: dataPoint
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ show: false, x: 0, y: 0, data: null });
  };

  useEffect(() => {
    if (!data || data.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Get last 30 days of data
    const chartData = data.slice(-30);
    const chartValues = chartData.map((d) => d.Tokens || 0);
    if (chartValues.length === 0) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;
    const padding = 4;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (chartValues.length < 2) return;

    // Calculate min/max for scaling
    const minValue = Math.min(...chartValues);
    const maxValue = Math.max(...chartValues);
    const range = maxValue - minValue;

    // Scale points to canvas with padding
    const points = chartValues.map((value, index) => {
      const x = padding + (index / (chartValues.length - 1)) * (width - padding * 2);
      const y = range === 0 ? height / 2 : padding + (height - padding * 2) - ((value - minValue) / range) * (height - padding * 2);
      return { x, y };
    });

    // Draw gradient-colored segments
    for (let i = 0; i < points.length - 1; i++) {
      const maxMarketcap = Math.max(...(chartData[i].tokensInvolved?.map(t => t.marketcap || 0) || [0]));

      let segmentColor;
      if (maxMarketcap > 10000) {
        segmentColor = '#10b981'; // Green for very high
      } else if (maxMarketcap > 5000) {
        segmentColor = '#a855f7'; // Purple for high
      } else if (maxMarketcap > 2000) {
        segmentColor = '#eab308'; // Yellow for medium
      } else {
        segmentColor = '#3b82f6'; // Default blue theme color
      }

      // Draw gradient fill for segment
      const gradient = ctx.createLinearGradient(0, points[i].y, 0, height);
      gradient.addColorStop(0, segmentColor + '66');
      gradient.addColorStop(1, segmentColor + '00');

      ctx.beginPath();
      ctx.moveTo(points[i].x, height);
      ctx.lineTo(points[i].x, points[i].y);
      ctx.lineTo(points[i + 1].x, points[i + 1].y);
      ctx.lineTo(points[i + 1].x, height);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw line segment
      ctx.beginPath();
      ctx.moveTo(points[i].x, points[i].y);
      ctx.lineTo(points[i + 1].x, points[i + 1].y);
      ctx.strokeStyle = segmentColor;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }, [data]);

  // Tooltip Portal Component
  const TooltipPortal = ({ tooltip, darkMode, activeFiatCurrency }) => {
    if (!tooltip.show || !tooltip.data) return null;

    return createPortal(
      <div
        style={{
          position: 'fixed',
          left: tooltip.x + 15,
          top: tooltip.y - 60,
          background: darkMode ? 'rgba(18, 18, 18, 0.98)' : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(16px)',
          color: darkMode ? '#fff' : '#000',
          border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '10px',
          padding: '10px 12px',
          boxShadow: darkMode ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 8px 32px rgba(0, 0, 0, 0.12)',
          minWidth: '180px',
          zIndex: 999999,
          pointerEvents: 'none',
          fontSize: '11px'
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: 500,
            marginBottom: '8px',
            color: darkMode ? 'rgba(255,255,255,0.9)' : '#333',
            paddingBottom: '6px',
            borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)'
          }}
        >
          {format(new Date(tooltip.data.originalDate), 'MMM dd, yyyy')}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
          <span style={{ opacity: 0.6 }}>New Tokens</span>
          <span style={{ fontWeight: 500 }}>{tooltip.data.Tokens || 0}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
          <span style={{ opacity: 0.6 }}>Market Cap</span>
          <span style={{ fontWeight: 500 }}>
            {currencySymbols[activeFiatCurrency]}
            {formatNumberWithDecimals(tooltip.data.totalMarketcap || 0)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
          <span style={{ opacity: 0.6 }}>Avg Holders</span>
          <span style={{ fontWeight: 500 }}>{Math.round(tooltip.data.avgHolders || 0)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
          <span style={{ opacity: 0.6 }}>Volume 24h</span>
          <span style={{ fontWeight: 500 }}>
            {currencySymbols[activeFiatCurrency]}
            {formatNumberWithDecimals(tooltip.data.totalVolume24h || 0)}
          </span>
        </div>
        {tooltip.data.platforms &&
          Object.entries(tooltip.data.platforms).filter(([, v]) => v > 0).length > 0 && (
            <>
              <div
                style={{
                  borderTop: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
                  margin: '6px 0 4px',
                  paddingTop: '6px'
                }}
              >
                <span style={{ fontSize: '10px', fontWeight: 500, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Platforms</span>
              </div>
              {Object.entries(tooltip.data.platforms)
                .filter(([, v]) => v > 0)
                .map(([platform, count]) => (
                  <div
                    key={platform}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      margin: '2px 0',
                      fontSize: '10px',
                      opacity: 0.7
                    }}
                  >
                    <span>{platform}</span>
                    <span>{count}</span>
                  </div>
                ))}
            </>
          )}
        {tooltip.data.tokensInvolved?.length > 0 && (
          <>
            <div
              style={{
                borderTop: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
                margin: '6px 0 4px',
                paddingTop: '6px'
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 500, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Top Tokens</span>
            </div>
            {[...tooltip.data.tokensInvolved]
              .sort((a, b) => (b.marketcap || 0) - (a.marketcap || 0))
              .slice(0, 3).map((token, i) => (
              <div
                key={`tooltip-token-${i}-${token.md5 || token.name}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  margin: '3px 0',
                  fontSize: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    minWidth: '14px',
                    minHeight: '14px',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'
                  }}>
                    <img
                      src={`https://s1.xrpl.to/token/${token.md5}`}
                      alt={token.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.parentElement.style.display = 'none';
                      }}
                    />
                  </div>
                  <span style={{ opacity: 0.8 }}>{token.name}</span>
                </div>
                <span style={{ fontWeight: 500 }}>
                  {currencySymbols[activeFiatCurrency]}
                  {formatNumberWithDecimals(token.marketcap || 0)}
                </span>
              </div>
            ))}
          </>
        )}
      </div>,
      document.body
    );
  };

  return (
    <>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '42px',
          marginTop: '-2px',
          position: 'relative'
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            cursor: 'pointer'
          }}
        />
      </div>

      <TooltipPortal
        tooltip={tooltip}
        darkMode={darkMode}
        activeFiatCurrency={activeFiatCurrency}
      />
    </>
  );
};

// SummaryTag component (previously in separate file)
export const SummaryTag = ({ tagName }) => {
  const TagContainer = styled.div`
    margin-top: 16px;

    @media (max-width: 600px) {
      margin-top: 8px;
    }
  `;

  const TagTitle = styled.h1`
    margin: 0 0 8px 0;
    font-size: 1.75rem;
    font-weight: 400;
    line-height: 1.2;

    @media (max-width: 600px) {
      font-size: 1.25rem;
    }
  `;

  const TagSubtitle = styled.div`
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.4;
    opacity: 0.6;
  `;

  return (
    <TagContainer>
      <TagTitle>{tagName} Tokens</TagTitle>
      <TagSubtitle>
        Ranked by 24h trading volume
      </TagSubtitle>
    </TagContainer>
  );
};

// SummaryWatchList component (previously in separate file)
export const SummaryWatchList = () => {
  const { accountProfile } = useContext(AppContext);
  const account = accountProfile?.account;

  const ContentTypography = styled.div`
    color: rgba(145, 158, 171, 0.99);
  `;

  const WatchContainer = styled.div`
    margin-top: 16px;

    @media (max-width: 600px) {
      margin-top: 8px;
    }
  `;

  const WatchTitle = styled.h1`
    margin: 0;
    font-size: 2.125rem;
    font-weight: 300;
    line-height: 1.235;
    letter-spacing: -0.00833em;

    @media (max-width: 600px) {
      font-size: 1.5rem;
    }
  `;

  const WatchSubtitle = styled.div`
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.5;
    letter-spacing: 0.00938em;
    margin-top: 16px;
  `;

  return (
    <WatchContainer>
      <WatchTitle>My Token Watchlist</WatchTitle>
      {!account && (
        <WatchSubtitle>
          <ContentTypography>Track your favorite XRPL tokens. Log in to manage your personalized watchlist.</ContentTypography>
        </WatchSubtitle>
      )}
    </WatchContainer>
  );
};

// Main Summary component
export default function Summary() {
  // Translation removed - using hardcoded English text
  const metrics = useSelector(selectMetrics);
  const tokenCreation = useSelector(selectTokenCreation);
  const { activeFiatCurrency, darkMode } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;

  const fiatRate = metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null) || 1;

  const getChartOption = () => ({
    grid: {
      left: 0,
      right: 0,
      top: 5,
      bottom: 0
    },
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      z: 999999,
      position: function (point, params, dom, rect, size) {
        // Calculate position to ensure tooltip stays within viewport
        var x = point[0];
        var y = point[1];

        // Adjust if tooltip would go off top of screen
        if (y - size.contentSize[1] - 10 < 0) {
          y = point[1] + 20; // Show below cursor
        } else {
          y = point[1] - size.contentSize[1] - 10; // Show above cursor
        }

        // Adjust if tooltip would go off right side
        if (x + size.contentSize[0] > window.innerWidth) {
          x = window.innerWidth - size.contentSize[0] - 10;
        }

        return [x, y];
      },
      formatter: (params) => {
        if (!params || !params[0]) return '';
        const data = chartData[params[0].dataIndex];
        const platforms = data.platforms || {};
        const platformEntries = Object.entries(platforms).filter(([, value]) => value > 0);
        const tokensInvolved = (data.tokensInvolved || [])
          .slice()
          .sort((a, b) => (b.marketcap || 0) - (a.marketcap || 0));

        let html = `
          <div style="background: ${darkMode ? '#1c1c1c' : 'white'}; color: ${darkMode ? '#fff' : '#000'}; border: 1.5px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}; border-radius: 8px; padding: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); min-width: 200px;">
            <div style="font-size: 0.875rem; font-weight: 600; margin-bottom: 8px;">
              ${format(new Date(data.originalDate), 'MMM dd, yyyy')}
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
              <span style="font-size: 0.75rem;">New Tokens</span>
              <span style="font-size: 0.75rem; font-weight: 600;">${data.Tokens || 0}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
              <span style="font-size: 0.75rem;">Market Cap</span>
              <span style="font-size: 0.75rem; font-weight: 600;">${currencySymbols[activeFiatCurrency]}${formatNumberWithDecimals(data.totalMarketcap)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
              <span style="font-size: 0.75rem;">Avg Holders</span>
              <span style="font-size: 0.75rem; font-weight: 600;">${Math.round(data.avgHolders)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
              <span style="font-size: 0.75rem;">Volume 24h</span>
              <span style="font-size: 0.75rem; font-weight: 600;">${currencySymbols[activeFiatCurrency]}${formatNumberWithDecimals(data.totalVolume24h)}</span>
            </div>
            ${
              platformEntries.length > 0
                ? `
              <div style="border-top: 1px solid ${darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}; margin: 8px -12px;"></div>
              <div style="font-size: 0.75rem; font-weight: 600; margin-top: 8px;">Platforms</div>
              ${platformEntries
                .map(
                  ([platform, count]) => `
                <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                  <span style="font-size: 0.7rem; color: ${darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'};">${platform}</span>
                  <span style="font-size: 0.7rem; font-weight: 600;">${count}</span>
                </div>
              `
                )
                .join('')}
            `
                : ''
            }
            ${
              tokensInvolved.length > 0
                ? `
              <div style="border-top: 1px solid ${darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}; margin: 8px -12px;"></div>
              <div style="font-size: 0.75rem; font-weight: 600; margin-top: 8px;">Top Tokens Created</div>
              ${tokensInvolved
                .slice(0, 3)
                .map(
                  (token) => `
                <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                  <span style="font-size: 0.7rem; color: ${darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'};">${token.currency || token.symbol || token.ticker || token.code || token.currencyCode || token.name || 'Unknown'}</span>
                  <span style="font-size: 0.7rem;">${currencySymbols[activeFiatCurrency]}${formatNumberWithDecimals(new Decimal(token.marketcap || 0).div(fiatRate).toNumber())}</span>
                </div>
              `
                )
                .join('')}
            `
                : ''
            }
          </div>
        `;
        return html;
      },
      backgroundColor: darkMode ? '#1c1c1c' : 'white',
      borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      borderWidth: 1,
      borderRadius: 12,
      textStyle: {
        color: darkMode ? '#fff' : '#000'
      },
      extraCssText: 'z-index: 999999 !important; position: fixed !important;'
    },
    xAxis: {
      type: 'category',
      data: chartData.map((d) => d.date),
      show: false
    },
    yAxis: {
      type: 'value',
      show: false
    },
    series: [
      {
        data: chartData.map((d) => d.Tokens),
        type: 'line',
        smooth: true,
        lineStyle: {
          color: '#3b82f6',
          width: 1.5
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(59, 130, 246, 0.3)'
              },
              {
                offset: 1,
                color: 'rgba(59, 130, 246, 0)'
              }
            ]
          }
        },
        showSymbol: false
      }
    ]
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const platformColors = {
    'xrpl.to': '#3b82f6',
    XPMarket: '#ef4444',
    FirstLedger: '#10b981',
    Sologenic: '#f59e0b',
    Other: '#6b7280'
  };

  const chartData = useMemo(() => {
    return tokenCreation && tokenCreation.length > 0
      ? tokenCreation
          .slice(0, 30)
          .reverse()
          .map((d) => {
            const totalMarketcapFromInvolved = d.tokensInvolved?.reduce(
              (sum, token) => sum + (token.marketcap || 0),
              0
            );
            const totalMarketcap = totalMarketcapFromInvolved ?? d.totalMarketcap ?? 0;
            return {
              date: d.date.substring(5, 7) + '/' + d.date.substring(8, 10),
              originalDate: d.date,
              Tokens: d.totalTokens,
              platforms: d.platforms,
              avgMarketcap: new Decimal(d.avgMarketcap || 0).div(fiatRate).toNumber(),
              rawAvgMarketcap: d.avgMarketcap,
              avgHolders: d.avgHolders || 0,
              totalVolume24h: new Decimal(d.avgVolume24h || 0).div(fiatRate).toNumber(),
              totalMarketcap: new Decimal(totalMarketcap || 0).div(fiatRate).toNumber(),
              tokensInvolved: d.tokensInvolved || []
            };
          })
      : [];
  }, [tokenCreation, fiatRate]);

  const activePlatforms = Object.keys(platformColors).filter((platform) => {
    if (platform === 'Other') return false;
    return chartData.some((d) => (d.platforms?.[platform] || 0) > 0);
  });

  const xrpPrice =
    activeFiatCurrency === 'XRP'
      ? Rate(1, metrics.USD || 1)
      : Rate(1, metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null) || 1);

  const xrpPriceSymbol =
    activeFiatCurrency === 'XRP' ? currencySymbols.USD : currencySymbols[activeFiatCurrency];

  return (
    <Container>
      <Stack spacing="4px">
        {/* Main Metrics Section */}
        {isLoading ? (
          <div style={{ width: '100%', paddingBottom: '0' }}>
            <Grid cols={8} mdCols={4} smCols={3}>
              {[...Array(7)].map((_, i) => (
                <MetricBox key={`summary-skeleton-${i}`} isDark={darkMode}>
                  <Skeleton height="12px" width="60%" style={{ marginBottom: '4px' }} />
                  <Skeleton height="20px" width="80%" />
                </MetricBox>
              ))}
            </Grid>
          </div>
        ) : (
          <div style={{ width: '100%' }}>
            <Grid>
              <MetricBox isDark={darkMode} style={isMobile ? { minWidth: '110px' } : {}}>
                <MetricTitle isDark={darkMode}>MCap / TVL</MetricTitle>
                <div style={{ display: 'flex', gap: isMobile ? '12px' : '16px', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <MetricValue isDark={darkMode} style={{ fontSize: isMobile ? '0.85rem' : '1.1rem' }}>
                      {currencySymbols[activeFiatCurrency]}
                      {formatNumberWithDecimals(
                        new Decimal(metrics.global?.gMarketcap || metrics.market_cap_usd || 0).div(fiatRate).toNumber()
                      )}
                    </MetricValue>
                    <PercentageChange isPositive={(metrics.global?.gMarketcapPro || 0) >= 0} style={{ fontSize: '0.55rem' }}>
                      {(metrics.global?.gMarketcapPro || 0) >= 0 ? '↑' : '↓'}
                      {Math.abs(metrics.global?.gMarketcapPro || 0).toFixed(1)}%
                    </PercentageChange>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <MetricValue isDark={darkMode} style={{ fontSize: isMobile ? '0.85rem' : '1.1rem', opacity: 0.7 }}>
                      {currencySymbols[activeFiatCurrency]}
                      {formatNumberWithDecimals(
                        new Decimal(metrics.global?.gTVL || metrics.global?.totalTVL || metrics.H24?.totalTVL || 0).div(fiatRate).toNumber()
                      )}
                    </MetricValue>
                    <PercentageChange isPositive={(metrics.global?.gTVLPro || metrics.global?.totalTVLPro || metrics.H24?.totalTVLPro || 0) >= 0} style={{ fontSize: '0.55rem' }}>
                      {(metrics.global?.gTVLPro || metrics.global?.totalTVLPro || metrics.H24?.totalTVLPro || 0) >= 0 ? '↑' : '↓'}
                      {Math.abs(metrics.global?.gTVLPro || metrics.global?.totalTVLPro || metrics.H24?.totalTVLPro || 0).toFixed(1)}%
                    </PercentageChange>
                  </div>
                </div>
              </MetricBox>

              <MetricBox isDark={darkMode}>
                <MetricTitle isDark={darkMode}>{isMobile ? '24h Vol' : '24h Volume'}</MetricTitle>
                <MetricValue isDark={darkMode}>
                  {currencySymbols[activeFiatCurrency]}
                  {formatNumberWithDecimals(
                    new Decimal(metrics.global?.gDexVolume || metrics.total_volume_usd || 0)
                      .div(fiatRate)
                      .toNumber()
                  )}
                </MetricValue>
                {(() => {
                  const stablePercent = ((metrics.global?.gStableVolume || 0) / (metrics.global?.gDexVolume || 1) * 100);
                  const memePercent = ((metrics.global?.gMemeVolume || 0) / (metrics.global?.gDexVolume || 1) * 100);
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                      <PercentageChange isPositive={(metrics.global?.gDexVolumePro || 0) >= 0}>
                        {(metrics.global?.gDexVolumePro || 0) >= 0 ? '↑' : '↓'}
                        {Math.abs(metrics.global?.gDexVolumePro || 0).toFixed(1)}%
                      </PercentageChange>
                      {!isMobile && (
                        <>
                          <span style={{
                            fontSize: '0.58rem',
                            fontWeight: 500,
                            padding: '1px 4px',
                            borderRadius: '4px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981'
                          }}>
                            {stablePercent.toFixed(0)}% Stable
                          </span>
                          <span style={{
                            fontSize: '0.58rem',
                            fontWeight: 500,
                            padding: '1px 4px',
                            borderRadius: '4px',
                            background: 'rgba(245, 158, 11, 0.1)',
                            color: '#f59e0b'
                          }}>
                            {memePercent.toFixed(0)}% Meme
                          </span>
                        </>
                      )}
                    </div>
                  );
                })()}
              </MetricBox>

              <MetricBox isDark={darkMode}>
                <MetricTitle isDark={darkMode}>{isMobile ? 'XRP' : 'XRP Price'}</MetricTitle>
                <MetricValue isDark={darkMode}>
                  {xrpPriceSymbol}
                  {xrpPrice}
                </MetricValue>
                <PercentageChange
                  isPositive={(metrics.H24?.xrpPro24h || metrics.XRPchange24h || 0) >= 0}
                >
                  {(metrics.H24?.xrpPro24h || metrics.XRPchange24h || 0) >= 0 ? '↑' : '↓'}
                  {Math.abs(metrics.H24?.xrpPro24h || metrics.XRPchange24h || 0).toFixed(2)}%
                </PercentageChange>
              </MetricBox>

              <MetricBox isDark={darkMode}>
                <MetricTitle isDark={darkMode}>{isMobile ? 'Traders' : '24h Traders'}</MetricTitle>
                <MetricValue isDark={darkMode}>
                  {formatNumberWithDecimals(metrics.H24?.uniqueTraders24H || 0)}
                </MetricValue>
                {(() => {
                  const buyVol = metrics.H24?.globalBuy24hxrp || 0;
                  const sellVol = metrics.H24?.globalSell24hxrp || 0;
                  const total = buyVol + sellVol;
                  const buyPercent = total > 0 ? (buyVol / total * 100) : 50;
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{
                        fontSize: '0.58rem',
                        fontWeight: 500,
                        padding: '1px 4px',
                        borderRadius: '4px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981'
                      }}>
                        {buyPercent.toFixed(0)}% Buy
                      </span>
                      <span style={{
                        fontSize: '0.58rem',
                        fontWeight: 500,
                        padding: '1px 4px',
                        borderRadius: '4px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444'
                      }}>
                        {(100 - buyPercent).toFixed(0)}% Sell
                      </span>
                    </div>
                  );
                })()}
              </MetricBox>

              <MetricBox isDark={darkMode} style={isMobile ? { minWidth: '130px' } : { minWidth: '160px' }}>
                <MetricTitle isDark={darkMode}>Market</MetricTitle>
                {(() => {
                  const sentiment = metrics.global?.sentimentScore || 50;
                  const rsi = metrics.global?.avgRSI || 50;

                  const getSentimentColor = (v) => v >= 55 ? '#10b981' : v >= 45 ? '#fbbf24' : '#ef4444';
                  const getRsiColor = (v) => v >= 70 ? '#ef4444' : v <= 30 ? '#8b5cf6' : v >= 50 ? '#10b981' : '#fbbf24';

                  const sentColor = getSentimentColor(sentiment);
                  const rsiColor = getRsiColor(rsi);

                  return (
                    <div style={{ display: 'flex', gap: isMobile ? '16px' : '24px', alignItems: 'flex-end' }}>
                      {/* Sentiment gauge */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ position: 'relative', width: '36px', height: '20px' }}>
                          {/* Semi-circle background */}
                          <div style={{
                            position: 'absolute',
                            width: '36px',
                            height: '18px',
                            borderRadius: '18px 18px 0 0',
                            background: `conic-gradient(from 180deg, #ef4444 0deg, #fbbf24 90deg, #10b981 180deg)`,
                            opacity: 0.2
                          }} />
                          {/* Needle */}
                          <div style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '50%',
                            width: '2px',
                            height: '14px',
                            background: sentColor,
                            transformOrigin: 'bottom center',
                            transform: `translateX(-50%) rotate(${(sentiment - 50) * 1.8}deg)`,
                            borderRadius: '1px'
                          }} />
                          {/* Center dot */}
                          <div style={{
                            position: 'absolute',
                            bottom: '-2px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: sentColor
                          }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 600, color: sentColor, lineHeight: 1 }}>
                            {sentiment.toFixed(0)}
                          </span>
                          <span style={{ fontSize: '0.5rem', color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                            Sentiment
                          </span>
                        </div>
                      </div>

                      {/* RSI gauge */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ position: 'relative', width: '36px', height: '20px' }}>
                          {/* Semi-circle background */}
                          <div style={{
                            position: 'absolute',
                            width: '36px',
                            height: '18px',
                            borderRadius: '18px 18px 0 0',
                            background: `conic-gradient(from 180deg, #8b5cf6 0deg, #10b981 90deg, #ef4444 180deg)`,
                            opacity: 0.2
                          }} />
                          {/* Needle */}
                          <div style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '50%',
                            width: '2px',
                            height: '14px',
                            background: rsiColor,
                            transformOrigin: 'bottom center',
                            transform: `translateX(-50%) rotate(${(rsi - 50) * 1.8}deg)`,
                            borderRadius: '1px'
                          }} />
                          {/* Center dot */}
                          <div style={{
                            position: 'absolute',
                            bottom: '-2px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: rsiColor
                          }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 600, color: rsiColor, lineHeight: 1 }}>
                            {rsi.toFixed(0)}
                          </span>
                          <span style={{ fontSize: '0.5rem', color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                            RSI
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </MetricBox>

              <ChartMetricBox isDark={darkMode}>
                {(() => {
                  const today = chartData[chartData.length - 1]?.Tokens || 0;
                  const yesterday = chartData[chartData.length - 2]?.Tokens || 0;
                  const isUp = today >= yesterday;
                  return (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <MetricTitle isDark={darkMode}>New Tokens</MetricTitle>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: darkMode ? '#fff' : '#212B36' }}>
                            {today}
                          </span>
                          <span style={{ fontSize: '0.5rem', color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                            today
                          </span>
                          <span style={{ fontSize: '0.65rem', color: isUp ? '#10b981' : '#ef4444' }}>
                            {isUp ? '↑' : '↓'}
                          </span>
                        </div>
                      </div>
                      <TokenChart data={chartData} activeFiatCurrency={activeFiatCurrency} darkMode={darkMode} />
                    </>
                  );
                })()}
              </ChartMetricBox>
            </Grid>

            <MobileChartBox isDark={darkMode}>
              {(() => {
                const today = chartData[chartData.length - 1]?.Tokens || 0;
                const yesterday = chartData[chartData.length - 2]?.Tokens || 0;
                const isUp = today >= yesterday;
                return (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <MetricTitle isDark={darkMode}>New Tokens</MetricTitle>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: darkMode ? '#fff' : '#212B36' }}>{today}</span>
                        <span style={{ fontSize: '0.45rem', color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>today</span>
                        <span style={{ fontSize: '0.6rem', color: isUp ? '#10b981' : '#ef4444' }}>{isUp ? '↑' : '↓'}</span>
                      </div>
                    </div>
                    <TokenChart data={chartData} activeFiatCurrency={activeFiatCurrency} darkMode={darkMode} />
                  </>
                );
              })()}
            </MobileChartBox>
          </div>
        )}
      </Stack>
    </Container>
  );
}
