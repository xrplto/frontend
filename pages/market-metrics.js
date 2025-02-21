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
import { Box, Typography, Container, Paper } from '@mui/material';

// Custom tooltip styles
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          border: '1px solid #333',
          p: 1.5,
          borderRadius: 1,
          color: 'white'
        }}
      >
        <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
          {label}
        </Typography>
        {payload.map((entry, index) => (
          <Typography key={index} variant="body2" sx={{ color: entry.color || entry.stroke }}>
            {`${entry.name}: ${entry.value.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}${
              entry.name.includes('Market Cap')
                ? ' XRP'
                : entry.name.includes('Volume')
                ? 'k XRP'
                : ''
            }`}
          </Typography>
        ))}
      </Box>
    );
  }
  return null;
};

const MarketMetrics = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleLines, setVisibleLines] = useState({
    volumeAMM: true,
    volumeNonAMM: true,
    tradesAMM: true,
    tradesNonAMM: true,
    totalMarketcap: true,
    tokenCount: true
  });

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

        const formattedData = response.data
          .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort by date ascending
          .map((item) => ({
            ...item,
            date: moment(item.date).format('MMM DD YYYY'), // Added year for clarity in long timespan
            totalMarketcap: Number(item.totalMarketcap.toFixed(2)), // Remove the division by 1000000
            volumeNonAMM: Number((item.volumeNonAMM / 1000).toFixed(2)), // Convert to thousands XRP
            volumeAMM: Number((item.volumeAMM / 1000).toFixed(2)), // Convert to thousands XRP
            totalVolume: Number(((item.volumeAMM + item.volumeNonAMM) / 1000).toFixed(2)), // Total volume in thousands XRP
            tokenCount: Number(item.tokenCount), // Add tokenCount to formatted data
            tradesAMM: Number(item.tradesAMM),
            tradesNonAMM: Number(item.tradesNonAMM),
            totalTrades: Number(item.totalTrades)
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
    return (
      <Container>
        <Typography variant="h6">Loading market metrics...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          XRPL Market Metrics
        </Typography>

        {/* Total Marketcap Chart */}
        <Box sx={{ height: 400, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Total Market Cap (XRP)
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} interval={30} />
              <YAxis
                domain={['auto', 'auto']}
                tickFormatter={(value) =>
                  value.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) + ' XRP'
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '10px' }}
                verticalAlign="top"
                height={36}
                onClick={handleLegendClick}
                formatter={(value, entry) => (
                  <span style={{ color: visibleLines[entry.dataKey] ? entry.color : '#999' }}>
                    {value}
                  </span>
                )}
              />
              <Line
                type="monotone"
                dataKey="totalMarketcap"
                stroke="rgba(136, 132, 216, 0.8)"
                name="Total Market Cap"
                strokeWidth={2}
                hide={!visibleLines.totalMarketcap}
                dot={{
                  r: 2,
                  strokeWidth: 1,
                  fill: 'rgba(136, 132, 216, 0.8)',
                  stroke: 'rgba(136, 132, 216, 0.8)'
                }}
                activeDot={{
                  r: 4,
                  strokeWidth: 1,
                  stroke: 'rgba(136, 132, 216, 1)',
                  fill: '#fff'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {/* Token Count Chart */}
        <Box sx={{ height: 400, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Number of Active Tokens
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} interval={30} />
              <YAxis
                domain={['dataMin - 5', 'dataMax + 5']}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '10px' }}
                verticalAlign="top"
                height={36}
                onClick={handleLegendClick}
                formatter={(value, entry) => (
                  <span style={{ color: visibleLines[entry.dataKey] ? entry.color : '#999' }}>
                    {value}
                  </span>
                )}
              />
              <Line
                type="monotone"
                dataKey="tokenCount"
                stroke="rgba(255, 99, 132, 0.8)"
                name="Active Tokens"
                strokeWidth={2}
                hide={!visibleLines.tokenCount}
                dot={{
                  r: 2,
                  strokeWidth: 1,
                  fill: 'rgba(255, 99, 132, 0.8)',
                  stroke: 'rgba(255, 99, 132, 0.8)'
                }}
                activeDot={{
                  r: 4,
                  strokeWidth: 1,
                  stroke: 'rgba(255, 99, 132, 1)',
                  fill: '#fff'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {/* Volume and Trades Chart */}
        <Box sx={{ height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Trading Activity
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} interval={30} />
              <YAxis
                yAxisId="volume"
                orientation="left"
                domain={['dataMin - 1000', 'dataMax + 1000']}
                tickFormatter={(value) => value.toLocaleString() + 'k XRP'}
              />
              <YAxis
                yAxisId="trades"
                orientation="right"
                domain={['dataMin - 100', 'dataMax + 100']}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '10px' }}
                verticalAlign="top"
                height={36}
                onClick={handleLegendClick}
                formatter={(value, entry) => (
                  <span
                    style={{
                      color: visibleLines[entry.dataKey]
                        ? entry.dataKey.includes('trades')
                          ? entry.stroke
                          : entry.color
                        : '#999',
                      cursor: 'pointer'
                    }}
                  >
                    {value}
                  </span>
                )}
              />
              <Line
                yAxisId="volume"
                type="monotone"
                dataKey="volumeAMM"
                stroke="rgba(136, 132, 216, 0.8)"
                name="AMM Volume"
                strokeWidth={2}
                hide={!visibleLines.volumeAMM}
                dot={{
                  r: 2,
                  strokeWidth: 1,
                  fill: 'rgba(136, 132, 216, 0.8)',
                  stroke: 'rgba(136, 132, 216, 0.8)'
                }}
                activeDot={{
                  r: 4,
                  strokeWidth: 1,
                  stroke: 'rgba(136, 132, 216, 1)',
                  fill: '#fff'
                }}
              />
              <Line
                yAxisId="volume"
                type="monotone"
                dataKey="volumeNonAMM"
                stroke="rgba(130, 202, 157, 0.8)"
                name="Non-AMM Volume"
                strokeWidth={2}
                hide={!visibleLines.volumeNonAMM}
                dot={{
                  r: 2,
                  strokeWidth: 1,
                  fill: 'rgba(130, 202, 157, 0.8)',
                  stroke: 'rgba(130, 202, 157, 0.8)'
                }}
                activeDot={{
                  r: 4,
                  strokeWidth: 1,
                  stroke: 'rgba(130, 202, 157, 1)',
                  fill: '#fff'
                }}
              />
              <Line
                yAxisId="trades"
                type="monotone"
                dataKey="tradesAMM"
                stroke="rgba(136, 132, 216, 0.5)"
                name="AMM Trades"
                strokeDasharray="5 5"
                strokeWidth={2}
                hide={!visibleLines.tradesAMM}
                dot={{
                  r: 2,
                  strokeWidth: 1,
                  fill: 'rgba(136, 132, 216, 0.5)',
                  stroke: 'rgba(136, 132, 216, 0.5)'
                }}
                activeDot={{
                  r: 4,
                  strokeWidth: 1,
                  stroke: 'rgba(136, 132, 216, 0.8)',
                  fill: '#fff'
                }}
              />
              <Line
                yAxisId="trades"
                type="monotone"
                dataKey="tradesNonAMM"
                stroke="rgba(130, 202, 157, 0.5)"
                name="Non-AMM Trades"
                strokeDasharray="5 5"
                strokeWidth={2}
                hide={!visibleLines.tradesNonAMM}
                dot={{
                  r: 2,
                  strokeWidth: 1,
                  fill: 'rgba(130, 202, 157, 0.5)',
                  stroke: 'rgba(130, 202, 157, 0.5)'
                }}
                activeDot={{
                  r: 4,
                  strokeWidth: 1,
                  stroke: 'rgba(130, 202, 157, 0.8)',
                  fill: '#fff'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Container>
  );
};

export default MarketMetrics;
