import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Divider,
  IconButton,
  Modal,
  styled
} from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ReactECharts from 'echarts-for-react';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';

const StyledModal = styled(Modal)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2)
}));

const ModalContent = styled(Paper)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: 800,
  maxHeight: '90vh',
  overflow: 'auto',
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[24]
}));

export default function Analytics() {
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roiModalTrader, setRoiModalTrader] = useState(null);
  const [orderBy, setOrderBy] = useState('volume24h');
  const [order, setOrder] = useState('desc');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          'https://api.xrpl.to/api/analytics/cumulative-stats?page=1&limit=100'
        );
        const data = await response.json();
        setTraders(data.traders);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRoiClick = (trader, event) => {
    event.stopPropagation();
    setRoiModalTrader(trader);
  };

  const handleCloseRoiModal = () => {
    setRoiModalTrader(null);
  };

  const formatCurrency = (value) => {
    return (
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value || 0) + ' Ꭓ'
    );
  };

  const abbreviateAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(2)}%`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const createChartOptions = (roiHistory) => {
    const dates = roiHistory.map((item) => formatDate(item.date));
    const dailyRoi = roiHistory.map((item) => item.dailyRoi);
    const cumulativeRoi = roiHistory.map((item) => item.cumulativeRoi);
    const profits = roiHistory.map((item) => item.profit);
    const volumes = roiHistory.map((item) => item.volume);

    return {
      grid: {
        left: '3%',
        right: '3%',
        top: '8%',
        bottom: '8%',
        containLabel: true
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        formatter: function (params) {
          const date = dates[params[0].dataIndex];
          const dailyRoiValue = params[0].value;
          const cumulativeRoiValue = params[1].value;
          const profit = profits[params[0].dataIndex];
          const volume = volumes[params[0].dataIndex];

          return `
            <div style="font-size: 14px; margin-bottom: 4px;">${date}</div>
            <div style="display: flex; justify-content: space-between;">
              <span>${params[0].marker} ${params[0].seriesName}:</span>
              <span style="color: ${
                dailyRoiValue >= 0 ? '#4caf50' : '#f44336'
              }">${dailyRoiValue.toFixed(2)}%</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>${params[1].marker} ${params[1].seriesName}:</span>
              <span style="color: ${
                cumulativeRoiValue >= 0 ? '#4caf50' : '#f44336'
              }">${cumulativeRoiValue.toFixed(2)}%</span>
            </div>
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.2);">
              <div>Profit: <span style="color: ${
                profit >= 0 ? '#4caf50' : '#f44336'
              }">${formatCurrency(profit)}</span></div>
              <div>Volume: ${formatCurrency(volume)}</div>
            </div>
          `;
        }
      },
      legend: {
        data: ['Daily ROI', 'Cumulative ROI']
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series: [
        {
          name: 'Daily ROI',
          type: 'bar',
          data: dailyRoi,
          itemStyle: {
            color: function (params) {
              return params.value >= 0 ? '#4caf50' : '#f44336';
            }
          }
        },
        {
          name: 'Cumulative ROI',
          type: 'line',
          data: cumulativeRoi,
          smooth: true,
          lineStyle: {
            width: 3
          },
          itemStyle: {
            color: '#1976d2'
          }
        }
      ]
    };
  };

  const createTradeHistoryChartOptions = (tradeHistory) => {
    const dates = tradeHistory.map((item) => formatDate(item.date));
    const dailyTrades = tradeHistory.map((item) => item.trades);
    const cumulativeTrades = tradeHistory.map((item) => item.cumulativeTrades);
    const profitableTrades = tradeHistory.map((item) => item.profitableTrades);
    const losingTrades = tradeHistory.map((item) => item.losingTrades);

    return {
      grid: {
        left: '3%',
        right: '4%',
        top: '8%',
        bottom: '8%',
        containLabel: true
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        formatter: function (params) {
          const date = dates[params[0].dataIndex];
          const dailyTradesValue = params[0].value;
          const cumulativeTradesValue = params[1].value;
          const profitableTradesValue = profitableTrades[params[0].dataIndex];
          const losingTradesValue = losingTrades[params[0].dataIndex];

          return `
            <div style="font-size: 14px; margin-bottom: 4px;">${date}</div>
            <div style="display: flex; justify-content: space-between;">
              <span>${params[0].marker} Daily Trades:</span>
              <span>${dailyTradesValue}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>${params[1].marker} Cumulative Trades:</span>
              <span>${cumulativeTradesValue}</span>
            </div>
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.2);">
              <div style="color: #4caf50">Profitable: ${profitableTradesValue}</div>
              <div style="color: #f44336">Losing: ${losingTradesValue}</div>
            </div>
          `;
        }
      },
      legend: {
        data: ['Daily Trades', 'Cumulative Trades']
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Daily',
          position: 'left'
        },
        {
          type: 'value',
          name: 'Cumulative',
          position: 'right'
        }
      ],
      series: [
        {
          name: 'Daily Trades',
          type: 'bar',
          data: dailyTrades,
          itemStyle: {
            color: '#1976d2'
          }
        },
        {
          name: 'Cumulative Trades',
          type: 'line',
          yAxisIndex: 1,
          data: cumulativeTrades,
          smooth: true,
          lineStyle: {
            width: 3
          },
          itemStyle: {
            color: '#2196f3'
          }
        }
      ]
    };
  };

  const createVolumeHistoryChartOptions = (volumeHistory) => {
    const dates = volumeHistory.map((item) => formatDate(item.date));
    const dailyVolumes = volumeHistory.map((item) => item.h24Volume);
    const buyVolumes = volumeHistory.map((item) => item.h24BuyVolume);
    const sellVolumes = volumeHistory.map((item) => item.h24SellVolume);
    const cumulativeVolumes = volumeHistory.map((item) => item.cumulativeVolume);
    const cumulativeBuyVolumes = volumeHistory.map((item) => item.cumulativeBuyVolume);
    const cumulativeSellVolumes = volumeHistory.map((item) => item.cumulativeSellVolume);
    const tradedTokens = volumeHistory.map((item) => item.tradedTokens || []);

    return {
      grid: {
        left: '3%',
        right: '4%',
        top: '8%',
        bottom: '8%',
        containLabel: true
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        formatter: function (params) {
          const date = dates[params[0].dataIndex];
          const dailyVolume = dailyVolumes[params[0].dataIndex];
          const buyVolume = buyVolumes[params[0].dataIndex];
          const sellVolume = sellVolumes[params[0].dataIndex];
          const cumulativeVolume = cumulativeVolumes[params[0].dataIndex];
          const cumulativeBuy = cumulativeBuyVolumes[params[0].dataIndex];
          const cumulativeSell = cumulativeSellVolumes[params[0].dataIndex];
          const tokens = tradedTokens[params[0].dataIndex];

          let tokenDetails = '';
          if (tokens && tokens.length > 0) {
            tokenDetails = tokens
              .map(
                (token) => `
              <div style="margin-left: 12px; margin-top: 2px;">
                <span>${token.name}:</span>
                <div style="margin-left: 12px;">
                  <span style="color: #4caf50">Buy: ${formatCurrency(token.buyVolume)}</span>
                  <br/>
                  <span style="color: #f44336">Sell: ${formatCurrency(token.sellVolume)}</span>
                  <br/>
                  <span>Trades: ${token.trades}</span>
                </div>
              </div>
            `
              )
              .join('');
          }

          return `
            <div style="font-size: 14px; margin-bottom: 4px;">${date}</div>
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between;">
                <span>Daily Volume:</span>
                <span>${formatCurrency(dailyVolume)}</span>
              </div>
              <div style="margin-left: 12px;">
                <span style="color: #4caf50">Buy: ${formatCurrency(buyVolume)}</span>
                <br/>
                <span style="color: #f44336">Sell: ${formatCurrency(sellVolume)}</span>
              </div>
            </div>
            <div style="margin-bottom: 8px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.2);">
              <div style="display: flex; justify-content: space-between;">
                <span>Cumulative Volume:</span>
                <span>${formatCurrency(cumulativeVolume)}</span>
              </div>
              <div style="margin-left: 12px;">
                <span style="color: #4caf50">Buy: ${formatCurrency(cumulativeBuy)}</span>
                <br/>
                <span style="color: #f44336">Sell: ${formatCurrency(cumulativeSell)}</span>
              </div>
            </div>
            ${
              tokens && tokens.length > 0
                ? `
              <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.2);">
                <div style="font-weight: 500;">Traded Tokens:</div>
                ${tokenDetails}
              </div>
            `
                : ''
            }
          `;
        }
      },
      legend: {
        data: ['Daily Volume', 'Buy Volume', 'Sell Volume', 'Cumulative Volume']
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Daily',
          position: 'left',
          axisLabel: {
            formatter: function (value) {
              return formatCurrency(value).split(' ')[0];
            }
          }
        },
        {
          type: 'value',
          name: 'Cumulative',
          position: 'right',
          axisLabel: {
            formatter: function (value) {
              return formatCurrency(value).split(' ')[0];
            }
          }
        }
      ],
      series: [
        {
          name: 'Daily Volume',
          type: 'bar',
          data: dailyVolumes,
          itemStyle: {
            color: '#1976d2'
          }
        },
        {
          name: 'Buy Volume',
          type: 'bar',
          stack: 'daily',
          data: buyVolumes,
          itemStyle: {
            color: '#4caf50'
          }
        },
        {
          name: 'Sell Volume',
          type: 'bar',
          stack: 'daily',
          data: sellVolumes,
          itemStyle: {
            color: '#f44336'
          }
        },
        {
          name: 'Cumulative Volume',
          type: 'line',
          yAxisIndex: 1,
          data: cumulativeVolumes,
          smooth: true,
          lineStyle: {
            width: 3
          },
          itemStyle: {
            color: '#2196f3'
          }
        }
      ]
    };
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortData = (data) => {
    return data.sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      if (orderBy === 'winRate') {
        aValue = (a.profitableTrades / (a.profitableTrades + a.losingTrades)) * 100;
        bValue = (b.profitableTrades / (b.profitableTrades + b.losingTrades)) * 100;
      }

      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (orderBy.includes('Date')) {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return order === 'desc' ? -result : result;
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Header />
      <Container maxWidth="xl">
        <Box sx={{ py: 5 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Trader Analytics
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Top Traders
                  </Typography>
                  <TableContainer>
                    <Table
                      sx={{
                        minWidth: 650,
                        '& .MuiTableCell-root': {
                          whiteSpace: 'nowrap',
                          padding: '4px 12px',
                          fontSize: '0.875rem'
                        },
                        '& .MuiTableHead-root .MuiTableCell-root': {
                          fontWeight: 600,
                          backgroundColor: 'background.default',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        },
                        '& .MuiTableRow-root': {
                          height: '48px'
                        },
                        '& .MuiIconButton-root': {
                          padding: '4px',
                          '& .MuiSvgIcon-root': {
                            fontSize: '1rem'
                          }
                        }
                      }}
                      size="small"
                      aria-label="trader analytics table"
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy === 'address'}
                              direction={orderBy === 'address' ? order : 'asc'}
                              onClick={() => handleRequestSort('address')}
                            >
                              Address
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy === 'activeTokens24h'}
                              direction={orderBy === 'activeTokens24h' ? order : 'asc'}
                              onClick={() => handleRequestSort('activeTokens24h')}
                            >
                              Active Tokens (24h)
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy === 'volume24h'}
                              direction={orderBy === 'volume24h' ? order : 'asc'}
                              onClick={() => handleRequestSort('volume24h')}
                            >
                              Volume (24h)
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy === 'profit24h'}
                              direction={orderBy === 'profit24h' ? order : 'asc'}
                              onClick={() => handleRequestSort('profit24h')}
                            >
                              Profit/Loss (24h)
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy === 'totalTrades'}
                              direction={orderBy === 'totalTrades' ? order : 'asc'}
                              onClick={() => handleRequestSort('totalTrades')}
                            >
                              Total Trades
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy === 'winRate'}
                              direction={orderBy === 'winRate' ? order : 'asc'}
                              onClick={() => handleRequestSort('winRate')}
                            >
                              Win Rate
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy === 'totalProfit'}
                              direction={orderBy === 'totalProfit' ? order : 'asc'}
                              onClick={() => handleRequestSort('totalProfit')}
                            >
                              Total Profit
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy === 'avgROI'}
                              direction={orderBy === 'avgROI' ? order : 'asc'}
                              onClick={() => handleRequestSort('avgROI')}
                            >
                              ROI
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy === 'firstTradeDate'}
                              direction={orderBy === 'firstTradeDate' ? order : 'asc'}
                              onClick={() => handleRequestSort('firstTradeDate')}
                            >
                              First Trade
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy === 'lastTradeDate'}
                              direction={orderBy === 'lastTradeDate' ? order : 'asc'}
                              onClick={() => handleRequestSort('lastTradeDate')}
                            >
                              Last Trade
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy === 'avgHoldingTime'}
                              direction={orderBy === 'avgHoldingTime' ? order : 'asc'}
                              onClick={() => handleRequestSort('avgHoldingTime')}
                            >
                              Avg Hold Time (h)
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy === 'maxProfitTrade'}
                              direction={orderBy === 'maxProfitTrade' ? order : 'asc'}
                              onClick={() => handleRequestSort('maxProfitTrade')}
                            >
                              Max Profit
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy === 'maxLossTrade'}
                              direction={orderBy === 'maxLossTrade' ? order : 'asc'}
                              onClick={() => handleRequestSort('maxLossTrade')}
                            >
                              Max Loss
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy === 'buyVolume'}
                              direction={orderBy === 'buyVolume' ? order : 'asc'}
                              onClick={() => handleRequestSort('buyVolume')}
                            >
                              Buy Volume
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy === 'sellVolume'}
                              direction={orderBy === 'sellVolume' ? order : 'asc'}
                              onClick={() => handleRequestSort('sellVolume')}
                            >
                              Sell Volume
                            </TableSortLabel>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sortData([...traders]).map((trader) => (
                          <TableRow
                            key={trader._id}
                            sx={{
                              '&:last-child td, &:last-child th': { border: 0 },
                              cursor: 'pointer',
                              backgroundColor:
                                roiModalTrader?._id === trader._id ? 'action.selected' : 'inherit',
                              '&:hover': {
                                backgroundColor: 'action.hover'
                              }
                            }}
                            onClick={() => handleRoiClick(trader)}
                          >
                            <TableCell component="th" scope="row">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {abbreviateAddress(trader.address)}
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleRoiClick(trader, e)}
                                  title={trader.address}
                                  sx={{
                                    color: 'primary.main',
                                    '&:hover': {
                                      color: 'primary.dark'
                                    }
                                  }}
                                >
                                  <ShowChartIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </TableCell>
                            <TableCell align="right">{trader.activeTokens24h}</TableCell>
                            <TableCell align="right">{formatCurrency(trader.volume24h)}</TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                color: trader.profit24h >= 0 ? 'success.main' : 'error.main'
                              }}
                            >
                              {formatCurrency(trader.profit24h)}
                            </TableCell>
                            <TableCell align="right">{trader.totalTrades}</TableCell>
                            <TableCell align="right">
                              {formatPercentage(
                                (trader.profitableTrades /
                                  (trader.profitableTrades + trader.losingTrades)) *
                                  100
                              )}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                color: trader.totalProfit >= 0 ? 'success.main' : 'error.main'
                              }}
                            >
                              {formatCurrency(trader.totalProfit)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                color: trader.avgROI >= 0 ? 'success.main' : 'error.main'
                              }}
                            >
                              {formatPercentage(trader.avgROI)}
                            </TableCell>
                            <TableCell align="right">
                              {new Date(trader.firstTradeDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell align="right">
                              {new Date(trader.lastTradeDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell align="right">
                              {(trader.avgHoldingTime / 3600).toFixed(2)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                color: 'success.main'
                              }}
                            >
                              {formatCurrency(trader.maxProfitTrade)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                color: 'error.main'
                              }}
                            >
                              {formatCurrency(trader.maxLossTrade)}
                            </TableCell>
                            <TableCell align="right">{formatCurrency(trader.buyVolume)}</TableCell>
                            <TableCell align="right">{formatCurrency(trader.sellVolume)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <StyledModal
          open={Boolean(roiModalTrader)}
          onClose={handleCloseRoiModal}
          aria-labelledby="roi-history-modal"
        >
          <ModalContent>
            {roiModalTrader && (
              <>
                <Typography variant="h6" gutterBottom>
                  ROI History - {roiModalTrader.address}
                </Typography>
                <Box sx={{ height: 400, width: '100%', mt: 2 }}>
                  {roiModalTrader.roiHistory && roiModalTrader.roiHistory.length > 0 ? (
                    <ReactECharts
                      option={createChartOptions(roiModalTrader.roiHistory)}
                      style={{ height: '100%', width: '100%' }}
                      opts={{ renderer: 'svg' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography color="text.secondary">No ROI history available</Typography>
                    </Box>
                  )}
                </Box>
                <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Total Volume
                    </Typography>
                    <Typography variant="body1">
                      {formatCurrency(roiModalTrader.buyVolume || 0)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Total Profit/Loss
                    </Typography>
                    <Typography
                      variant="body1"
                      color={roiModalTrader.totalProfit >= 0 ? 'success.main' : 'error.main'}
                    >
                      {formatCurrency(roiModalTrader.totalProfit || 0)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Win Rate
                    </Typography>
                    <Typography variant="body1">
                      {formatPercentage(
                        (roiModalTrader.profitableTrades /
                          (roiModalTrader.profitableTrades + roiModalTrader.losingTrades)) *
                          100
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Average ROI
                    </Typography>
                    <Typography
                      variant="body1"
                      color={roiModalTrader.avgROI >= 0 ? 'success.main' : 'error.main'}
                    >
                      {formatPercentage(roiModalTrader.avgROI)}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Token Performance
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Token</TableCell>
                        <TableCell align="right">Volume</TableCell>
                        <TableCell align="right">Profit/Loss</TableCell>
                        <TableCell align="right">ROI</TableCell>
                        <TableCell align="right">Trades</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {roiModalTrader.tokenPerformance?.map((token) => (
                        <TableRow key={token.tokenId}>
                          <TableCell component="th" scope="row">
                            {token.name}
                          </TableCell>
                          <TableCell align="right">{formatCurrency(token.volume)}</TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              color: token.profit >= 0 ? 'success.main' : 'error.main'
                            }}
                          >
                            {formatCurrency(token.profit)}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              color: token.roi >= 0 ? 'success.main' : 'error.main'
                            }}
                          >
                            {formatPercentage(token.roi)}
                          </TableCell>
                          <TableCell align="right">{token.trades}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Trade History
                </Typography>
                <Box sx={{ height: 300, width: '100%', mt: 2, mb: 3 }}>
                  {roiModalTrader.tradeHistory && roiModalTrader.tradeHistory.length > 0 ? (
                    <ReactECharts
                      option={createTradeHistoryChartOptions(roiModalTrader.tradeHistory)}
                      style={{ height: '100%', width: '100%' }}
                      opts={{ renderer: 'svg' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography color="text.secondary">No trade history available</Typography>
                    </Box>
                  )}
                </Box>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Total Trades
                    </Typography>
                    <Typography variant="body1">{roiModalTrader.totalTrades}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Total Tokens Traded
                    </Typography>
                    <Typography variant="body1">{roiModalTrader.totalTokensTraded}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Total Volume
                    </Typography>
                    <Typography variant="body1">
                      {formatCurrency(roiModalTrader.totalVolume)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Success Rate
                    </Typography>
                    <Typography
                      variant="body1"
                      color={
                        roiModalTrader.profitableTrades > roiModalTrader.losingTrades
                          ? 'success.main'
                          : 'error.main'
                      }
                    >
                      {formatPercentage(
                        (roiModalTrader.profitableTrades /
                          (roiModalTrader.profitableTrades + roiModalTrader.losingTrades)) *
                          100
                      )}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Volume History
                </Typography>
                <Box sx={{ height: 300, width: '100%', mt: 2, mb: 3 }}>
                  {roiModalTrader.volumeHistory && roiModalTrader.volumeHistory.length > 0 ? (
                    <ReactECharts
                      option={createVolumeHistoryChartOptions(roiModalTrader.volumeHistory)}
                      style={{ height: '100%', width: '100%' }}
                      opts={{ renderer: 'svg' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography color="text.secondary">No volume history available</Typography>
                    </Box>
                  )}
                </Box>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      24h Volume
                    </Typography>
                    <Typography variant="body1">
                      {formatCurrency(roiModalTrader.volume24h)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      7d Volume
                    </Typography>
                    <Typography variant="body1">
                      {formatCurrency(roiModalTrader.volume7d)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      1m Volume
                    </Typography>
                    <Typography variant="body1">
                      {formatCurrency(roiModalTrader.volume1m)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      2m Volume
                    </Typography>
                    <Typography variant="body1">
                      {formatCurrency(roiModalTrader.volume2m)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      3m Volume
                    </Typography>
                    <Typography variant="body1">
                      {formatCurrency(roiModalTrader.volume3m)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      24h Trades
                    </Typography>
                    <Typography variant="body1">{roiModalTrader.trades24h}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      7d Trades
                    </Typography>
                    <Typography variant="body1">{roiModalTrader.trades7d}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      1m Trades
                    </Typography>
                    <Typography variant="body1">{roiModalTrader.trades1m}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      2m Trades
                    </Typography>
                    <Typography variant="body1">{roiModalTrader.trades2m}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      3m Trades
                    </Typography>
                    <Typography variant="body1">{roiModalTrader.trades3m}</Typography>
                  </Grid>
                </Grid>
              </>
            )}
          </ModalContent>
        </StyledModal>
      </Container>
      <Footer />
    </>
  );
}
