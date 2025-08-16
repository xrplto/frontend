import Decimal from 'decimal.js';
import { useContext, useState, useEffect, useRef, useMemo, memo } from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { Icon } from '@iconify/react';

// import i18n (needs to be bundled ;))
import 'src/utils/i18n';
// Translations
import { useTranslation } from 'react-i18next';

// Redux
import { useSelector } from 'react-redux';
import { selectMetrics, selectTokenCreation } from 'src/redux/statusSlice';

// Utils
import { fNumber } from 'src/utils/formatNumber';

// Components
import { currencySymbols } from 'src/utils/constants';
import { AppContext } from 'src/AppContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { format } from 'date-fns';

// Styled Components
const Container = styled.div`
  position: relative;
  z-index: 2;
  margin-top: ${props => props.theme?.spacing?.(2) || '16px'};
  margin-bottom: ${props => props.theme?.spacing?.(3) || '24px'};
  width: 100%;
  max-width: 100%;
  background: transparent;
  border: 1px solid rgba(145, 158, 171, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: ${props => props.theme?.spacing?.(3) || '24px'};
  overflow: visible;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
  
  @media (max-width: 600px) {
    margin-top: 0;
    margin-bottom: 8px;
    padding: 8px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    
    &:hover {
      transform: none;
    }
  }
`;

const Stack = styled.div`
  display: flex;
  flex-direction: ${props => props.direction === 'row' ? 'row' : 'column'};
  gap: ${props => props.spacing || '8px'};
  align-items: ${props => props.alignItems || 'stretch'};
  justify-content: ${props => props.justifyContent || 'flex-start'};
  width: ${props => props.width || 'auto'};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(${props => props.cols || 1}, 1fr);
  gap: ${props => props.spacing || '16px'};
  width: 100%;
  
  @media (max-width: 900px) {
    grid-template-columns: repeat(${props => props.mdCols || props.cols || 1}, 1fr);
  }
  
  @media (max-width: 600px) {
    grid-template-columns: repeat(${props => props.smCols || 2}, 1fr);
    gap: 8px;
  }
`;

const MetricBox = styled.div`
  padding: 12px;
  height: 100%;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  border-radius: 6px;
  background: transparent;
  border: 1px solid rgba(145, 158, 171, 0.12);
  position: relative;
  overflow: hidden;
  
  @media (max-width: 600px) {
    padding: 4px;
    min-height: 44px;
  }
`;

const MetricTitle = styled.span`
  font-size: 0.65rem;
  font-weight: 400;
  color: rgba(145, 158, 171, 0.5);
  margin-bottom: 2px;
  letter-spacing: 0.02em;
  line-height: 1;
  
  @media (max-width: 600px) {
    font-size: 0.55rem;
    margin-bottom: 0;
  }
`;

const MetricValue = styled.span`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme?.palette?.text?.primary || '#212B36'};
  line-height: 1;
  margin-bottom: 1px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  letter-spacing: -0.01em;
  
  @media (max-width: 600px) {
    font-size: 0.75rem;
    margin-bottom: 0;
  }
`;

const PercentageChange = styled.span`
  font-size: 0.7rem;
  color: ${props => props.isPositive 
    ? (props.theme?.palette?.mode === 'dark' ? '#4ade80' : '#16a34a')
    : (props.theme?.palette?.mode === 'dark' ? '#f87171' : '#dc2626')};
  display: inline-flex;
  align-items: flex-start;
  gap: 2px;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  
  @media (max-width: 600px) {
    font-size: 0.55rem;
  }
`;

const VolumePercentage = styled.span`
  font-size: 0.6rem;
  color: rgba(145, 158, 171, 0.4);
  font-weight: 400;
  letter-spacing: 0.01em;
  
  @media (max-width: 600px) {
    font-size: 0.5rem;
  }
`;

const ContentTypography = styled.span`
  color: rgba(145, 158, 171, 0.6);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  
  @media (max-width: 600px) {
    font-size: 0.55rem;
  }
`;

const ChartContainer = styled.div`
  width: 100%;
  height: ${props => props.height || '180px'};
  margin-top: ${props => props.mt || '0'};
  
  @media (max-width: 600px) {
    height: 140px;
  }
`;

const TooltipContainer = styled.div`
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
`;

const Skeleton = styled.div`
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
  height: ${props => props.height || '20px'};
  width: ${props => props.width || '100%'};
  
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
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
    to { transform: rotate(360deg); }
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

export default function Summary() {
  const { t } = useTranslation();
  const metrics = useSelector(selectMetrics);
  const tokenCreation = useSelector(selectTokenCreation);
  const { activeFiatCurrency, darkMode } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(true);

  // Debug logging to see what metrics we're receiving
  useEffect(() => {
    console.log('DEBUG - Metrics received:', metrics);
    console.log('DEBUG - Metrics.global:', metrics.global);
    console.log('DEBUG - Total tokens:', metrics.total_tokens);
    console.log('DEBUG - Global.total:', metrics.global?.total);
    console.log('DEBUG - Active holders:', metrics.active_holders);
    console.log('DEBUG - New tokens 24h:', metrics.new_tokens_24h);
  }, [metrics]);

  const fiatRate = metrics[activeFiatCurrency] || 1;

  const CustomTooltip = memo(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const platforms = data.platforms || {};
      const platformEntries = Object.entries(platforms).filter(([, value]) => value > 0);
      const tokensInvolved = (data.tokensInvolved || [])
        .slice()
        .sort((a, b) => (b.marketcap || 0) - (a.marketcap || 0));

      const renderStat = (iconName, label, value) => (
        <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
          <Stack direction="row" alignItems="center" spacing="2px">
            <Icon icon={iconName} width="14" height="14" style={{ color: 'rgba(145, 158, 171, 0.8)' }} />
            <span style={{ fontSize: '0.75rem', color: 'rgba(145, 158, 171, 0.8)' }}>
              {label}
            </span>
          </Stack>
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{value}</span>
        </Stack>
      );

      return (
        <TooltipContainer>
          <Stack spacing="8px">
            <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>
              {format(new Date(data.originalDate), 'MMM dd, yyyy')}
            </div>
            
            {renderStat('mdi:fiber-new', 'New Tokens', data.Tokens || 0)}
            {renderStat('mdi:cash-multiple', `Market Cap (${currencySymbols[activeFiatCurrency]})`, 
              formatNumberWithDecimals(data.totalMarketcap))}
            {renderStat('mdi:account-group', 'Avg Holders', Math.round(data.avgHolders))}
            {renderStat('mdi:chart-line', `Volume 24h (${currencySymbols[activeFiatCurrency]})`,
              formatNumberWithDecimals(data.totalVolume24h))}

            {platformEntries.length > 0 && (
              <>
                <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.08)', margin: '8px -12px' }}></div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '8px' }}>
                  Platforms
                </div>
                {platformEntries.map(([platform, count]) => (
                  <Stack key={platform} direction="row" justifyContent="space-between">
                    <span style={{ fontSize: '0.7rem', color: 'rgba(145, 158, 171, 0.8)' }}>
                      {platform}
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{count}</span>
                  </Stack>
                ))}
              </>
            )}

            {tokensInvolved.length > 0 && (
              <>
                <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.08)', margin: '8px -12px' }}></div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '8px' }}>
                  Top Tokens Created
                </div>
                {tokensInvolved.slice(0, 3).map((token, idx) => (
                  <Stack key={idx} direction="row" justifyContent="space-between">
                    <span style={{ fontSize: '0.7rem', color: 'rgba(145, 158, 171, 0.8)' }}>
                      {token.currency}
                    </span>
                    <span style={{ fontSize: '0.7rem' }}>
                      {currencySymbols[activeFiatCurrency]}
                      {formatNumberWithDecimals(new Decimal(token.marketcap || 0).div(fiatRate).toNumber())}
                    </span>
                  </Stack>
                ))}
              </>
            )}
          </Stack>
        </TooltipContainer>
      );
    }
    return null;
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const platformColors = {
    'xrpl.to': '#8C7CF0',
    XPMarket: '#FF6B6B',
    FirstLedger: '#4ECDC4',
    Sologenic: '#FFD93D',
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

  const xrpPrice = activeFiatCurrency === 'XRP'
    ? Rate(1, metrics.USD || 1)
    : Rate(1, metrics[activeFiatCurrency] || 1);

  const xrpPriceSymbol = activeFiatCurrency === 'XRP' 
    ? currencySymbols.USD 
    : currencySymbols[activeFiatCurrency];

  return (
    <Container>
      <Stack spacing="8px">
        {/* Main Metrics Section */}
        {isLoading ? (
          <div style={{ width: '100%', paddingBottom: '0' }}>
            <Grid cols={6} mdCols={3} smCols={2} spacing="16px">
              {[...Array(6)].map((_, i) => (
                <MetricBox key={i}>
                  <Skeleton height="12px" width="60%" style={{ marginBottom: '4px' }} />
                  <Skeleton height="20px" width="80%" />
                </MetricBox>
              ))}
            </Grid>
          </div>
        ) : (
          <div style={{ width: '100%' }}>
            <Grid cols={6} mdCols={3} smCols={2} spacing="16px">
              <MetricBox>
                <MetricTitle>XRP Price</MetricTitle>
                <MetricValue>
                  {xrpPriceSymbol}{xrpPrice}
                </MetricValue>
                <PercentageChange isPositive={(metrics.XRPchange24h || 0) >= 0}>
                  {(metrics.XRPchange24h || 0) >= 0 ? '▲' : '▼'}
                  {Math.abs(metrics.XRPchange24h || 0).toFixed(2)}%
                </PercentageChange>
              </MetricBox>

              <MetricBox>
                <MetricTitle>Market Cap</MetricTitle>
                <MetricValue>
                  {currencySymbols[activeFiatCurrency]}
                  {formatNumberWithDecimals(new Decimal(metrics.global?.gMarketcap || metrics.market_cap_usd || 0).div(fiatRate).toNumber())}
                </MetricValue>
                <VolumePercentage>
                  #{metrics.market_cap_rank || '-'}
                </VolumePercentage>
              </MetricBox>

              <MetricBox>
                <MetricTitle>24h Volume</MetricTitle>
                <MetricValue>
                  {currencySymbols[activeFiatCurrency]}
                  {formatNumberWithDecimals(new Decimal(metrics.global?.gDexVolume || metrics.total_volume_usd || 0).div(fiatRate).toNumber())}
                </MetricValue>
                <ContentTypography>
                  Vol/MCap: {((metrics.global?.gDexVolume || metrics.total_volume_usd || 0) / (metrics.global?.gMarketcap || metrics.market_cap_usd || 1) * 100).toFixed(2)}%
                </ContentTypography>
              </MetricBox>

              <MetricBox>
                <MetricTitle>New Tokens (24h)</MetricTitle>
                <MetricValue>
                  {metrics.H24?.transactions24H || metrics.new_tokens_24h || 0}
                </MetricValue>
                <Stack direction="row" spacing="4px">
                  <Icon icon="mdi:fiber-new" width="14" height="14" style={{ color: '#8C7CF0' }} />
                  <ContentTypography>Today</ContentTypography>
                </Stack>
              </MetricBox>

              <MetricBox>
                <MetricTitle>Active Holders</MetricTitle>
                <MetricValue>
                  {formatNumberWithDecimals(metrics.H24?.activeAddresses24H || metrics.active_holders || 0)}
                </MetricValue>
                <Stack direction="row" spacing="4px">
                  <Icon icon="mdi:account-group" width="14" height="14" style={{ color: '#4ECDC4' }} />
                  <ContentTypography>Active</ContentTypography>
                </Stack>
              </MetricBox>

              <MetricBox>
                <MetricTitle>Total Tokens</MetricTitle>
                <MetricValue>
                  {formatNumberWithDecimals(metrics.global?.total || metrics.total_tokens || 0)}
                </MetricValue>
                <Stack direction="row" spacing="4px">
                  <Icon icon="mdi:cash-multiple" width="14" height="14" style={{ color: '#FFD93D' }} />
                  <ContentTypography>Listed</ContentTypography>
                </Stack>
              </MetricBox>
            </Grid>
          </div>
        )}

        {/* Chart Section */}
        {chartData.length > 0 && (
          <ChartContainer height="180px" mt="16px">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8C7CF0" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8C7CF0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(145, 158, 171, 0.1)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }} 
                  stroke="rgba(145, 158, 171, 0.5)"
                />
                <YAxis 
                  tick={{ fontSize: 10 }} 
                  stroke="rgba(145, 158, 171, 0.5)"
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Tokens"
                  stroke="#8C7CF0"
                  strokeWidth={2}
                  fill="url(#colorTokens)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </Stack>
    </Container>
  );
}