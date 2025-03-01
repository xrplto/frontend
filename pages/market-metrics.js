import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import moment from 'moment';
import { Box, Typography, Container, Paper, useTheme } from '@mui/material';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import Topbar from 'src/components/Topbar';
import { Provider } from 'react-redux';
import store from 'src/redux/store';
import { configureRedux } from 'src/redux/store';

// Chart theme colors
const chartColors = {
  primary: {
    main: '#3B82F6',
    light: 'rgba(59, 130, 246, 0.1)',
    dark: '#2563EB'
  },
  secondary: {
    main: '#10B981',
    light: 'rgba(16, 185, 129, 0.1)',
    dark: '#059669'
  },
  tertiary: {
    main: '#F59E0B',
    light: 'rgba(245, 158, 11, 0.1)',
    dark: '#D97706'
  },
  background: 'rgba(0, 0, 0, 0.3)',
  cardBg: 'rgba(0, 0, 0, 0.5)',
  text: '#E5E7EB',
  grid: 'rgba(255, 255, 255, 0.03)'
};

// Custom tooltip styles
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    // Sort payload by value in descending order
    const sortedPayload = [...payload].sort((a, b) => b.value - a.value);

    return (
      <Box
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          p: 2,
          borderRadius: 2,
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }}
      >
        <Typography variant="subtitle2" sx={{ color: '#E5E7EB', mb: 1, fontWeight: 600 }}>
          {label}
        </Typography>
        {sortedPayload.map((entry, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: entry.color || entry.stroke,
                mr: 1,
                boxShadow: '0 0 10px rgba(255, 255, 255, 0.1)'
              }}
            />
            <Typography variant="body2" sx={{ color: '#E5E7EB' }}>
              {`${entry.name}: ${entry.value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}${
                entry.name.includes('Market Cap')
                  ? ' XRP'
                  : entry.name.includes('Volume')
                  ? ' XRP'
                  : ''
              }`}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }
  return null;
};

// Custom Legend Item Component
const CustomLegendItem = ({ entry, visible, onClick }) => (
  <Box
    onClick={() => onClick(entry)}
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      mr: 3,
      cursor: 'pointer',
      opacity: visible ? 1 : 0.4,
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        opacity: 0.8
      }
    }}
  >
    <Box
      sx={{
        width: 12,
        height: 12,
        borderRadius: '50%',
        backgroundColor: entry.color || entry.stroke,
        mr: 1,
        boxShadow: visible ? '0 0 10px rgba(255, 255, 255, 0.1)' : 'none'
      }}
    />
    <Typography
      variant="body2"
      sx={{
        color: chartColors.text,
        fontWeight: visible ? 500 : 400
      }}
    >
      {entry.value}
    </Typography>
  </Box>
);

// Chart Container Component
const ChartContainer = ({ title, children }) => (
  <Paper
    elevation={0}
    sx={{
      p: 4,
      mb: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: 2,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
      '&:hover': {
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease-in-out'
      }
    }}
  >
    <Typography
      variant="h6"
      gutterBottom
      sx={{
        color: 'rgba(255, 255, 255, 0.95)',
        fontWeight: 600,
        mb: 3,
        fontSize: '1.25rem',
        letterSpacing: '0.025em',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
      }}
    >
      {title}
    </Typography>
    {children}
  </Paper>
);

const MarketMetricsContent = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleLines, setVisibleLines] = useState({
    volumeAMM: true,
    volumeNonAMM: true,
    tradesAMM: false,
    tradesNonAMM: false,
    totalMarketcap: true,
    tokenCount: true,
    firstLedgerMarketcap: true,
    magneticXMarketcap: true,
    xpMarketMarketcap: true,
    firstLedgerTokens: true,
    magneticXTokens: true,
    xpMarketTokens: true,
    uniqueActiveAddressesAMM: true,
    uniqueActiveAddressesNonAMM: true
  });

  // Add state to track available tokens
  const [availableTokens, setAvailableTokens] = useState([]);

  // Token color map - will be used to assign consistent colors to tokens
  const tokenColorMap = {
    SOLO: '#FF6B6B',
    BTC: '#F7931A',
    CORE: '#4BC0C0',
    ETH: '#627EEA',
    USD: '#26A17B',
    CNY: '#E91E63',
    XCORE: '#9C27B0'
    // Add more colors as needed
  };

  // Function to get a color for a token (either from map or generate one)
  const getTokenColor = (tokenName, index) => {
    if (tokenColorMap[tokenName]) {
      return tokenColorMap[tokenName];
    }

    // Generate colors for tokens not in the map
    const colors = [
      '#8884d8',
      '#82ca9d',
      '#ffc658',
      '#ff7300',
      '#0088FE',
      '#00C49F',
      '#FFBB28',
      '#FF8042',
      '#a4de6c',
      '#d0ed57',
      '#8dd1e1',
      '#83a6ed'
    ];

    return colors[index % colors.length];
  };

  const handleLegendClick = (entry) => {
    setVisibleLines((prev) => ({
      ...prev,
      [entry.dataKey]: !prev[entry.dataKey]
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current date
        const endDate = moment().format('YYYY-MM-DD');
        // Get date 10 years ago
        const startDate = moment().subtract(14, 'years').format('YYYY-MM-DD');

        console.log('Fetching data from', startDate, 'to', endDate); // Debug log

        const response = await axios.get('https://api.xrpl.to/api/analytics/market-metrics', {
          params: {
            startDate,
            endDate
          }
        });

        // Ensure response.data is an array
        const marketData = Array.isArray(response.data) ? response.data : response.data.data || [];

        if (!marketData.length) {
          console.warn('No market metrics data received');
          return;
        }

        // Track all unique tokens across all data points
        const uniqueTokens = new Set();

        const formattedData = marketData
          .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort by date ascending
          .map((item) => {
            // Process token-specific market caps
            const tokenMarketcaps = {};
            if (item.dailyTokenMarketcaps && Array.isArray(item.dailyTokenMarketcaps)) {
              item.dailyTokenMarketcaps.forEach((token) => {
                if (token.name && token.marketcap) {
                  const tokenKey = `${token.name}_marketcap`;
                  tokenMarketcaps[tokenKey] = Number(token.marketcap.toFixed(2));
                  uniqueTokens.add(token.name);
                }
              });
            }

            return {
              ...item,
              ...tokenMarketcaps, // Add token-specific market caps to the data object
              date: moment(item.date).format('MMM DD YYYY'), // Added year for clarity in long timespan
              totalMarketcap: Number(item.totalMarketcap.toFixed(2)), // Remove the division by 1000000
              firstLedgerMarketcap: Number(item.firstLedgerMarketcap?.toFixed(2) || 0),
              magneticXMarketcap: Number(item.magneticXMarketcap?.toFixed(2) || 0),
              xpMarketMarketcap: Number(item.xpMarketMarketcap?.toFixed(2) || 0),
              volumeNonAMM: Number(item.volumeNonAMM.toFixed(2)), // Remove division by 1000
              volumeAMM: Number(item.volumeAMM.toFixed(2)), // Remove division by 1000
              totalVolume: Number((item.volumeAMM + item.volumeNonAMM).toFixed(2)), // Remove division by 1000
              tokenCount: Number(item.tokenCount), // Add tokenCount to formatted data
              firstLedgerTokens: Number(item.firstLedgerTokenCount || 0),
              magneticXTokens: Number(item.magneticXTokenCount || 0),
              xpMarketTokens: Number(item.xpMarketTokenCount || 0),
              tradesAMM: Number(item.tradesAMM),
              tradesNonAMM: Number(item.tradesNonAMM),
              totalTrades: Number(item.totalTrades),
              uniqueActiveAddresses: Number(item.uniqueActiveAddresses || 0),
              uniqueActiveAddressesAMM: Number(item.uniqueActiveAddressesAMM || 0),
              uniqueActiveAddressesNonAMM: Number(item.uniqueActiveAddressesNonAMM || 0)
            };
          });

        // Convert Set to Array and sort alphabetically
        const tokenArray = Array.from(uniqueTokens).sort();

        // Initialize visibility state for all tokens (default to true)
        const tokenVisibility = {};
        tokenArray.forEach((token) => {
          tokenVisibility[`${token}_marketcap`] = true;
        });

        // Update state with the token list and visibility
        setAvailableTokens(tokenArray);
        setVisibleLines((prev) => ({
          ...prev,
          ...tokenVisibility
        }));

        setData(formattedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Container></Container>;
  }

  const chartConfig = {
    margin: { top: 20, right: 40, left: 30, bottom: 20 },
    gridStyle: {
      strokeDasharray: '3 3',
      stroke: chartColors.grid
    },
    axisStyle: {
      fontSize: 12,
      fontWeight: 500,
      fill: chartColors.text
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        py: 3,
        backgroundColor: 'transparent',
        backgroundImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3))',
        minHeight: '100vh'
      }}
    >
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            color: 'rgba(255, 255, 255, 0.95)',
            fontWeight: 700,
            mb: 4,
            textAlign: 'center',
            letterSpacing: '0.025em',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}
        >
          XRPL Market Analytics
        </Typography>

        <ChartContainer title="Market Cap by DEX (XRP)">
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={chartConfig.margin}>
                <CartesianGrid {...chartConfig.gridStyle} />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={30}
                  tick={{ ...chartConfig.axisStyle }}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tickFormatter={(value) =>
                    value.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }) + ' XRP'
                  }
                  tick={{ ...chartConfig.axisStyle }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    paddingTop: '20px',
                    color: chartColors.text
                  }}
                  verticalAlign="top"
                  height={36}
                  onClick={handleLegendClick}
                />
                <Line
                  type="monotone"
                  dataKey="totalMarketcap"
                  stroke="#FFFFFF"
                  name="Total"
                  strokeWidth={3}
                  dot={false}
                  hide={!visibleLines.totalMarketcap}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    stroke: '#FFFFFF',
                    fill: chartColors.background
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="firstLedgerMarketcap"
                  stroke={chartColors.primary.main}
                  name="FirstLedger"
                  strokeWidth={2}
                  dot={false}
                  hide={!visibleLines.firstLedgerMarketcap}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    stroke: chartColors.primary.main,
                    fill: chartColors.background
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="magneticXMarketcap"
                  stroke={chartColors.secondary.main}
                  name="Magnetic X"
                  strokeWidth={2}
                  dot={false}
                  hide={!visibleLines.magneticXMarketcap}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    stroke: chartColors.secondary.main,
                    fill: chartColors.background
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="xpMarketMarketcap"
                  stroke={chartColors.tertiary.main}
                  name="XPMarket"
                  strokeWidth={2}
                  dot={false}
                  hide={!visibleLines.xpMarketMarketcap}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    stroke: chartColors.tertiary.main,
                    fill: chartColors.background
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </ChartContainer>

        <ChartContainer title="Token Market Caps (XRP)">
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={chartConfig.margin}>
                <CartesianGrid {...chartConfig.gridStyle} />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={30}
                  tick={{ ...chartConfig.axisStyle }}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tickFormatter={(value) =>
                    value.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }) + ' XRP'
                  }
                  tick={{ ...chartConfig.axisStyle }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    paddingTop: '20px',
                    color: chartColors.text
                  }}
                  verticalAlign="top"
                  height={36}
                  onClick={handleLegendClick}
                />
                {/* Dynamically generate lines for each token */}
                {availableTokens.map((token, index) => {
                  const dataKey = `${token}_marketcap`;
                  return (
                    <Line
                      key={dataKey}
                      type="monotone"
                      dataKey={dataKey}
                      stroke={getTokenColor(token, index)}
                      name={`${token}`}
                      strokeWidth={2}
                      dot={false}
                      hide={!visibleLines[dataKey]}
                      activeDot={{
                        r: 6,
                        strokeWidth: 2,
                        stroke: getTokenColor(token, index),
                        fill: chartColors.background
                      }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </ChartContainer>

        <ChartContainer title="Active Tokens by DEX">
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={chartConfig.margin}>
                <CartesianGrid {...chartConfig.gridStyle} />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={30}
                  tick={{ ...chartConfig.axisStyle }}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => value.toLocaleString()}
                  tick={{ ...chartConfig.axisStyle }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    paddingTop: '20px',
                    color: chartColors.text
                  }}
                  verticalAlign="top"
                  height={36}
                  onClick={handleLegendClick}
                />
                <Line
                  type="monotone"
                  dataKey="tokenCount"
                  stroke="#FFFFFF"
                  name="Total Active Tokens"
                  strokeWidth={3}
                  dot={false}
                  hide={!visibleLines.tokenCount}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    stroke: '#FFFFFF',
                    fill: chartColors.background
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="firstLedgerTokens"
                  stroke={chartColors.primary.main}
                  name="FirstLedger"
                  strokeWidth={2}
                  dot={false}
                  hide={!visibleLines.firstLedgerTokens}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    stroke: chartColors.primary.main,
                    fill: chartColors.background
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="magneticXTokens"
                  stroke={chartColors.secondary.main}
                  name="Magnetic X"
                  strokeWidth={2}
                  dot={false}
                  hide={!visibleLines.magneticXTokens}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    stroke: chartColors.secondary.main,
                    fill: chartColors.background
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="xpMarketTokens"
                  stroke={chartColors.tertiary.main}
                  name="XPMarket"
                  strokeWidth={2}
                  dot={false}
                  hide={!visibleLines.xpMarketTokens}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    stroke: chartColors.tertiary.main,
                    fill: chartColors.background
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </ChartContainer>

        <ChartContainer title="Trading Activity">
          <Box sx={{ height: 400, backgroundColor: 'transparent' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={chartConfig.margin}
                style={{
                  backgroundColor: 'transparent'
                }}
              >
                <CartesianGrid {...chartConfig.gridStyle} opacity={0.1} />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={30}
                  tick={{ ...chartConfig.axisStyle }}
                />
                <YAxis
                  yAxisId="volume"
                  orientation="left"
                  domain={['dataMin - 1000', 'dataMax + 1000']}
                  tickFormatter={(value) => value.toLocaleString() + ' XRP'}
                  tick={{ ...chartConfig.axisStyle }}
                />
                <YAxis
                  yAxisId="trades"
                  orientation="right"
                  domain={['dataMin - 100', 'dataMax + 100']}
                  tickFormatter={(value) => value.toLocaleString()}
                  tick={{ ...chartConfig.axisStyle }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  content={({ payload }) => (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        pt: 2,
                        pb: 1
                      }}
                    >
                      {payload.map((entry) => (
                        <CustomLegendItem
                          key={entry.value}
                          entry={entry}
                          visible={visibleLines[entry.dataKey]}
                          onClick={handleLegendClick}
                        />
                      ))}
                    </Box>
                  )}
                />
                <Line
                  yAxisId="volume"
                  type="monotone"
                  dataKey="volumeAMM"
                  stroke={chartColors.primary.main}
                  name="AMM Volume"
                  strokeWidth={2}
                  dot={false}
                  hide={!visibleLines.volumeAMM}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    stroke: chartColors.primary.main,
                    fill: chartColors.background
                  }}
                />
                <Line
                  yAxisId="volume"
                  type="monotone"
                  dataKey="volumeNonAMM"
                  stroke={chartColors.secondary.main}
                  name="Non-AMM Volume"
                  strokeWidth={2}
                  dot={false}
                  hide={!visibleLines.volumeNonAMM}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    stroke: chartColors.secondary.main,
                    fill: chartColors.background
                  }}
                />
                <Line
                  yAxisId="trades"
                  type="monotone"
                  dataKey="tradesAMM"
                  stroke={`${chartColors.primary.main}80`}
                  name="AMM Trades"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                  hide={!visibleLines.tradesAMM}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    stroke: chartColors.primary.main,
                    fill: chartColors.background
                  }}
                />
                <Line
                  yAxisId="trades"
                  type="monotone"
                  dataKey="tradesNonAMM"
                  stroke={`${chartColors.secondary.main}80`}
                  name="Non-AMM Trades"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                  hide={!visibleLines.tradesNonAMM}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    stroke: chartColors.secondary.main,
                    fill: chartColors.background
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </ChartContainer>

        <ChartContainer title="Unique Active Addresses">
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={chartConfig.margin}>
                <CartesianGrid {...chartConfig.gridStyle} />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={30}
                  tick={{ ...chartConfig.axisStyle }}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => value.toLocaleString()}
                  tick={{ ...chartConfig.axisStyle }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    paddingTop: '20px',
                    color: chartColors.text
                  }}
                  verticalAlign="top"
                  height={36}
                  onClick={handleLegendClick}
                />
                <Line
                  type="monotone"
                  dataKey="uniqueActiveAddressesAMM"
                  stroke={chartColors.primary.main}
                  name="AMM Active Addresses"
                  strokeWidth={2}
                  dot={false}
                  hide={!visibleLines.uniqueActiveAddressesAMM}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    stroke: chartColors.primary.main,
                    fill: chartColors.background
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="uniqueActiveAddressesNonAMM"
                  stroke={chartColors.secondary.main}
                  name="Non-AMM Active Addresses"
                  strokeWidth={2}
                  dot={false}
                  hide={!visibleLines.uniqueActiveAddressesNonAMM}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    stroke: chartColors.secondary.main,
                    fill: chartColors.background
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </ChartContainer>
      </Container>
    </Box>
  );
};

const MarketMetrics = ({ data }) => {
  // Configure Redux store with the fetched data
  const configuredStore = configureRedux(data);

  if (!configuredStore) {
    return null; // or a loading state
  }

  return (
    <Provider store={configuredStore}>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Topbar />
        <Header />
        <Box sx={{ flex: 1 }}>
          <MarketMetricsContent />
        </Box>
        <Footer />
      </Box>
    </Provider>
  );
};

export default MarketMetrics;

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export async function getStaticProps() {
  const BASE_URL = process.env.API_URL;
  let data = null;
  try {
    const res = await axios.get(`${BASE_URL}/banxa/currencies`);
    data = res.data;
  } catch (e) {
    console.log(e);
  }

  let ret = {};
  if (data) {
    let ogp = {};
    ogp.canonical = 'https://xrpl.to';
    ogp.title = 'Market Metrics';
    ogp.url = 'https://xrpl.to/market-metrics';
    ogp.imgUrl = 'https://xrpl.to/static/ogp.webp';

    ret = { data, ogp };
  }

  return {
    props: ret,
    revalidate: 10 // In seconds
  };
}
