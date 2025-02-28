import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tab,
  Tabs,
  Stack,
  IconButton,
  Collapse,
  Divider,
  Modal,
  Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';
import LoadChart from 'src/components/LoadChart';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ShowChartIcon from '@mui/icons-material/ShowChart';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1]
}));

const ExpandMore = styled((props) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest
  })
}));

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

const MetricCard = ({ title, value, subtitle, color }) => (
  <StyledCard>
    <CardContent>
      <Typography variant="h6" component="div" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" color={color || 'primary'}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </StyledCard>
);

export default function TraderPerformance({ trader }) {
  const [timeframe, setTimeframe] = useState('24h');
  const [expandedTokens, setExpandedTokens] = useState({});
  const [selectedRoiToken, setSelectedRoiToken] = useState(null);

  const handleTimeframeChange = (event, newValue) => {
    setTimeframe(newValue);
  };

  const handleExpandClick = (tokenId) => {
    setExpandedTokens((prev) => ({
      ...prev,
      [tokenId]: !prev[tokenId]
    }));
  };

  const handleRoiClick = (token, event) => {
    event.stopPropagation();
    setSelectedRoiToken(token);
  };

  const handleCloseRoiModal = () => {
    setSelectedRoiToken(null);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(2)}%`;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeframeData = () => {
    switch (timeframe) {
      case '24h':
        return {
          volume: trader.volume24h,
          profit: trader.profit24h,
          trades: trader.trades24h
        };
      case '7d':
        return {
          volume: trader.volume7d,
          profit: trader.profit7d,
          trades: trader.trades7d
        };
      case '1m':
        return {
          volume: trader.volume1m,
          profit: trader.profit1m,
          trades: trader.trades1m
        };
      default:
        return {
          volume: trader.volume24h,
          profit: trader.profit24h,
          trades: trader.trades24h
        };
    }
  };

  const timeframeData = getTimeframeData();
  const hasRoiHistory = trader.roiHistory && trader.roiHistory.length > 0;

  return (
    <Box sx={{ py: 3 }}>
      <Tabs value={timeframe} onChange={handleTimeframeChange} sx={{ mb: 3 }}>
        <Tab label="24H" value="24h" />
        <Tab label="7D" value="7d" />
        <Tab label="1M" value="1m" />
      </Tabs>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Volume"
            value={formatCurrency(timeframeData.volume)}
            subtitle={`${timeframeData.trades} trades`}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Profit/Loss"
            value={formatCurrency(timeframeData.profit)}
            subtitle={formatPercentage(trader.avgROI)}
            color={timeframeData.profit >= 0 ? 'success.main' : 'error.main'}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Win Rate"
            value={formatPercentage(
              (trader.profitableTrades / (trader.profitableTrades + trader.losingTrades)) * 100
            )}
            subtitle={`${trader.profitableTrades} of ${
              trader.profitableTrades + trader.losingTrades
            } trades`}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Best Trade"
            value={formatCurrency(trader.maxProfitTrade)}
            subtitle={`Worst: ${formatCurrency(trader.maxLossTrade)}`}
            color={
              trader.maxProfitTrade >= Math.abs(trader.maxLossTrade) ? 'success.main' : 'error.main'
            }
          />
        </Grid>
      </Grid>

      {hasRoiHistory && (
        <Box sx={{ mt: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ROI History
              </Typography>
              <Box sx={{ height: 300, width: '100%' }}>
                <LoadChart
                  url={`https://api.xrpl.to/api/chart/roi/${trader.address}?period=${timeframe}`}
                  height={300}
                />
              </Box>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Trading Period
                  </Typography>
                  <Typography>
                    {formatDate(trader.firstTradeDate)} - {formatDate(trader.lastTradeDate)}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Average ROI
                  </Typography>
                  <Typography color={trader.avgROI >= 0 ? 'success.main' : 'error.main'}>
                    {formatPercentage(trader.avgROI)}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Average Holding Time
                  </Typography>
                  <Typography>{Math.round(trader.avgHoldingTime / 3600)} hours</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total Volume
                  </Typography>
                  <Typography>
                    {formatCurrency(trader.totalVolume || trader.volume || 0)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Token Performance
        </Typography>
        <Stack spacing={2}>
          {trader.tokenPerformance?.map((token) => (
            <Card key={token.tokenId}>
              <CardContent>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle1">{token.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(token.volume || 0)} volume
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => handleRoiClick(token, e)}
                      sx={{
                        color: 'primary.main',
                        '&:hover': {
                          color: 'primary.dark'
                        }
                      }}
                    >
                      <ShowChartIcon />
                    </IconButton>
                  </Box>
                  <ExpandMore
                    expand={expandedTokens[token.tokenId]}
                    onClick={() => handleExpandClick(token.tokenId)}
                    aria-expanded={expandedTokens[token.tokenId]}
                    aria-label="show more"
                  >
                    <ExpandMoreIcon />
                  </ExpandMore>
                </Box>
                <Collapse in={expandedTokens[token.tokenId]} timeout="auto" unmountOnExit>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ height: 200, width: '100%' }}>
                    <LoadChart
                      url={`https://api.xrpl.to/api/chart/${token.tokenId}?period=${timeframe}`}
                      height={200}
                    />
                  </Box>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Volume
                      </Typography>
                      <Typography variant="body1">{formatCurrency(token.volume || 0)}</Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Profit/Loss
                      </Typography>
                      <Typography
                        variant="body1"
                        color={token.profit >= 0 ? 'success.main' : 'error.main'}
                      >
                        {formatCurrency(token.profit || 0)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Trades
                      </Typography>
                      <Typography variant="body1">{token.trades || 0}</Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Win Rate
                      </Typography>
                      <Typography variant="body1">
                        {formatPercentage((token.winRate || 0) * 100)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>

      <StyledModal
        open={Boolean(selectedRoiToken)}
        onClose={handleCloseRoiModal}
        aria-labelledby="roi-history-modal"
      >
        <ModalContent>
          {selectedRoiToken && (
            <>
              <Typography variant="h6" gutterBottom>
                {selectedRoiToken.name} - ROI History
              </Typography>
              <Box sx={{ height: 400, width: '100%', mt: 2 }}>
                <LoadChart
                  url={`https://api.xrpl.to/api/chart/roi/${trader.address}/${selectedRoiToken.tokenId}?period=${timeframe}`}
                  height={400}
                />
              </Box>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Volume
                  </Typography>
                  <Typography variant="body1">
                    {formatCurrency(selectedRoiToken.volume || 0)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Total Profit/Loss
                  </Typography>
                  <Typography
                    variant="body1"
                    color={selectedRoiToken.profit >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(selectedRoiToken.profit || 0)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Win Rate
                  </Typography>
                  <Typography variant="body1">
                    {formatPercentage((selectedRoiToken.winRate || 0) * 100)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Total Trades
                  </Typography>
                  <Typography variant="body1">{selectedRoiToken.trades || 0}</Typography>
                </Grid>
              </Grid>
            </>
          )}
        </ModalContent>
      </StyledModal>
    </Box>
  );
}
