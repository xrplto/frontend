import React from 'react';
import axios from 'axios';
import { useState, useEffect, useContext, useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
  IconButton,
  Avatar,
  alpha,
  Chip,
  Button,
  CircularProgress,
  Fade,
  Grid
} from '@mui/material';
import {
  DeleteOutline as DeleteIcon,
  Verified as VerifiedIcon,
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import { AppContext } from 'src/AppContext';
import { currencySymbols } from 'src/utils/constants';
import CustomQRDialog from 'src/components/QRDialog';
import CustomDialog from 'src/components/Dialog';
import useWebSocket from 'react-use-websocket';
import { selectMetrics, update_metrics } from 'src/redux/statusSlice';
import { useDispatch, useSelector } from 'react-redux';
import dynamic from 'next/dynamic';

const HighchartsReact = dynamic(
  () => import('highcharts-react-official'),
  { ssr: false, loading: () => <div>Loading chart...</div> }
);
let Highcharts = null;

// Generate color from string hash
const generateColorFromString = (str, saturation = 70, lightness = 50) => {
  if (!str) return '#007B55';
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// Helper function to format balance
const formatBalance = (balance) => {
  const num = Math.abs(Number(balance));
  if (num === 0) return '0';
  if (num < 0.000001) return num.toExponential(2);
  if (num < 1) return num.toFixed(6).replace(/\.?0+$/, '');
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: num < 1000 ? 4 : 2
  });
};

// Function to process asset distribution data for pie chart
const processAssetDistribution = async (trustlines, theme) => {
  if (!trustlines || trustlines.length === 0) return null;

  const sortedTrustlines = trustlines
    .filter((asset) => asset.value && parseFloat(asset.value) > 0)
    .sort((a, b) => b.value - a.value);

  if (sortedTrustlines.length === 0) return null;

  const topAssets = sortedTrustlines.slice(0, 10);
  const otherAssets = sortedTrustlines.slice(10);

  const labels = topAssets.map((asset) => asset.name || asset.token?.name || asset.currency);
  const data = topAssets.map((asset) => parseFloat(asset.value) || 0);

  if (otherAssets.length > 0) {
    const othersValue = otherAssets.reduce(
      (sum, asset) => sum + (parseFloat(asset.value) || 0),
      0
    );
    labels.push('Others');
    data.push(othersValue);
  }

  const backgroundColors = [];

  for (let i = 0; i < topAssets.length; i++) {
    const asset = topAssets[i];
    let color;

    if (asset.currency === 'XRP') {
      color = theme.palette.primary.main;
    } else {
      const tokenName = asset.token?.name || asset.currency;
      color = generateColorFromString(tokenName + i.toString(), 65, 55);
    }

    backgroundColors.push(alpha(color, 0.8));
  }

  if (otherAssets.length > 0) {
    backgroundColors.push(alpha(theme.palette.grey[500], 0.8));
  }

  return {
    series: data,
    labels,
    colors: backgroundColors
  };
};

// Token Card Component
const TokenCard = ({ token, account, isXRP = false, exchRate }) => {
  const theme = useTheme();
  const { activeFiatCurrency, openSnackbar, accountProfile, setSync } = useContext(AppContext);
  const BASE_URL = process.env.API_URL;
  
  const [dialogState, setDialogState] = useState({
    openScanQR: false,
    openConfirm: false,
    xamanStep: 0,
    xamanTitle: '',
    stepTitle: '',
    content: '',
    uuid: null,
    qrUrl: null,
    nextUrl: null
  });

  const handleRemove = async () => {
    if (!accountProfile?.account) {
      openSnackbar('Please connect wallet!', 'error');
      return;
    }
    if (accountProfile.account !== account) {
      openSnackbar('You are not the owner of this account!', 'error');
      return;
    }
    setDialogState(prev => ({ ...prev, xamanStep: token.balance > 0 ? 1 : 3 }));
  };

  const handleConfirmClose = () => {
    setDialogState(prev => ({ ...prev, openConfirm: false, xamanStep: 0 }));
    setSync(prev => !prev);
  };

  const handleScanQRClose = () => {
    setDialogState(prev => ({ ...prev, openScanQR: false }));
    if (dialogState.uuid) {
      axios.delete(`${BASE_URL}/xumm/logout/${dialogState.uuid}`);
      setDialogState(prev => ({ ...prev, uuid: null }));
    }
  };

  const value = useMemo(() => {
    const xrpToFiat = exchRate ? 1 / exchRate : 0;
    
    if (isXRP) {
      return (token.balance || 0) * xrpToFiat;
    }
    
    if (token.value !== undefined && token.value !== null) {
      return Number(token.value) * xrpToFiat;
    }
    
    if (!token.balance || !token.exch) return 0;
    return Number(token.balance) * Number(token.exch) * xrpToFiat;
  }, [token, isXRP, exchRate]);

  const percentOwned = useMemo(() => {
    if (isXRP) {
      const xrpSupply = parseFloat(token.supply) || 99_990_000_000;
      return ((parseFloat(token.balance) / xrpSupply) * 100).toFixed(8);
    }
    if (token.supply && token.balance) {
      const supply = parseFloat(token.supply);
      const balance = Math.abs(parseFloat(token.balance));
      return supply > 0 ? ((balance / supply) * 100).toFixed(8) : '0';
    }
    return token.percentOwned || '0';
  }, [token, isXRP]);

  return (
    <>
      <Box
        sx={{
          background: 'transparent',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 2,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4],
            borderColor: alpha(theme.palette.primary.main, 0.2)
          }
        }}
      >
        <Box sx={{ p: { xs: 0.5, sm: 0.75 } }}>
          <Stack direction="row" spacing={{ xs: 0.75, sm: 1 }} alignItems="center">
            <Stack direction="row" spacing={0.75} alignItems="center" flex={1}>
              <Avatar
                src={isXRP ? '/xrp.svg' : `https://s1.xrpl.to/token/${token.md5}`}
                sx={{
                  width: { xs: 24, sm: 28 },
                  height: { xs: 24, sm: 28 },
                  borderRadius: 1,
                  backgroundColor: 'transparent',
                  boxShadow: theme.shadows[1],
                  '& img': {
                    objectFit: 'contain',
                    padding: 0.25
                  }
                }}
              />
              
              <Box flex={1} minWidth={0}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: { xs: '0.7rem', sm: '0.8rem' },
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isXRP ? 'XRP' : (token.name || token.currencyName || token.currency)}
                  </Typography>
                  {(isXRP || token.verified) && (
                    <VerifiedIcon sx={{ fontSize: 12, color: theme.palette.success.main }} />
                  )}
                  {!isXRP && token.origin && (
                    <Chip 
                      label={token.origin} 
                      size="small" 
                      sx={{ 
                        height: 14, 
                        fontSize: '0.55rem',
                        '& .MuiChip-label': { px: 0.5 }
                      }}
                    />
                  )}
                </Stack>
                
                {!isXRP && token.issuer && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: { xs: '0.55rem', sm: '0.6rem' },
                      color: theme.palette.text.secondary,
                      fontFamily: 'monospace'
                    }}
                  >
                    {token.user || `${token.issuer.slice(0, 8)}...${token.issuer.slice(-4)}`}
                  </Typography>
                )}
                {isXRP && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: { xs: '0.55rem', sm: '0.6rem' },
                      color: theme.palette.text.secondary,
                      visibility: 'hidden'
                    }}
                  >
                    placeholder
                  </Typography>
                )}
              </Box>
            </Stack>

            <Stack 
              direction="row" 
              spacing={{ xs: 3, sm: 4 }} 
              alignItems="center"
              sx={{ ml: 'auto' }}
            >
              <Box sx={{ textAlign: 'right', minWidth: { xs: 60, sm: 80 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem', display: 'block', lineHeight: 1.1 }}>
                  Balance
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' }, lineHeight: 1.2 }}>
                  {formatBalance(token.balance)}
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'right', minWidth: { xs: 50, sm: 70 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem', display: 'block', lineHeight: 1.1 }}>
                  Value
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                    color: theme.palette.primary.main,
                    lineHeight: 1.2
                  }}
                >
                  {currencySymbols[activeFiatCurrency]}{value.toFixed(2)}
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' }, minWidth: 50 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem', display: 'block', lineHeight: 1.1 }}>
                  % Owned
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    lineHeight: 1.3,
                    color: percentOwned > 50 ? theme.palette.error.main : 
                           percentOwned > 20 ? theme.palette.warning.main : 
                           theme.palette.success.main
                  }}
                >
                  {percentOwned}%
                </Typography>
              </Box>

              {accountProfile?.account === account && (
                <IconButton
                  size="small"
                  onClick={!isXRP ? handleRemove : undefined}
                  sx={{
                    p: 0.5,
                    color: !isXRP ? theme.palette.error.main : 'transparent',
                    visibility: !isXRP ? 'visible' : 'hidden',
                    '&:hover': {
                      backgroundColor: !isXRP ? alpha(theme.palette.error.main, 0.1) : 'transparent'
                    }
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Stack>
          </Stack>
        </Box>
      </Box>

      <CustomQRDialog
        open={dialogState.openScanQR}
        type={dialogState.xamanTitle}
        onClose={handleScanQRClose}
        qrUrl={dialogState.qrUrl}
        nextUrl={dialogState.nextUrl}
      />
      
      <CustomDialog
        open={dialogState.openConfirm}
        content={dialogState.content}
        title={dialogState.stepTitle}
        handleClose={handleConfirmClose}
        handleContinue={() => {}}
      />
    </>
  );
};

// Main TrustLines Component
export default function TrustLines({ account, xrpBalance, onUpdateTotalValue, onTrustlinesData }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { sync, activeFiatCurrency, darkMode } = useContext(AppContext);
  const metrics = useSelector(selectMetrics);
  const exchRate = metrics[activeFiatCurrency];
  const BASE_URL = process.env.API_URL;
  
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [assetDistribution, setAssetDistribution] = useState(null);
  const [xrpTokenData, setXrpTokenData] = useState(null);
  const [sortedAssets, setSortedAssets] = useState([]);
  
  const WSS_FEED_URL = 'wss://api.xrpl.to/ws/sync';
  
  useWebSocket(WSS_FEED_URL, {
    onMessage: (event) => {
      try {
        const json = JSON.parse(event.data);
        dispatch(update_metrics(json));
      } catch (err) {
        console.error(err);
      }
    },
    shouldReconnect: () => true
  });

  // Fetch trustlines
  useEffect(() => {
    const controller = new AbortController();
    const fetchLines = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/trustlines/${account}?sortByValue=true&limit=200&page=0`, {
          signal: controller.signal
        });
        if (res.data?.result === 'success') {
          const trustlines = res.data.lines || [];
          setLines(trustlines);
          
          if (res.data.xrpToken) {
            setXrpTokenData(res.data.xrpToken);
          }
        }
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error('Error fetching trustlines:', err);
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (account) {
      fetchLines();
    }
    
    return () => controller.abort();
  }, [account, sync, BASE_URL]);

  // Calculate total value and process asset distribution
  useEffect(() => {
    const processData = async () => {
      const xrpToFiat = exchRate ? 1 / exchRate : 0;
      
      const trustlinesSum = lines.reduce((acc, line) => {
        if (line.value !== undefined && line.value !== null) {
          return acc + (Number(line.value) * xrpToFiat);
        }
        const balance = parseFloat(line.balance) || 0;
        const exch = parseFloat(line.exch) || 0;
        return acc + (balance * exch * xrpToFiat);
      }, 0);
      const xrpValue = (xrpBalance || 0) * xrpToFiat;
      const totalSum = trustlinesSum + xrpValue;
      
      if (onUpdateTotalValue) {
        onUpdateTotalValue(totalSum);
      }
      
      const allAssets = [];
      
      if (xrpBalance > 0 && xrpTokenData) {
        allAssets.push({
          ...xrpTokenData,
          balance: xrpBalance,
          value: xrpValue,
          isXRP: true
        });
      }
      
      allAssets.push(...lines);
      
      if (onTrustlinesData) {
        onTrustlinesData(allAssets);
      }
      
      setSortedAssets(allAssets);
      
      const pieData = await processAssetDistribution(allAssets, theme);
      setAssetDistribution(pieData);
    };
    
    processData();
  }, [lines, xrpBalance, exchRate, onUpdateTotalValue, onTrustlinesData, theme, xrpTokenData]);

  const displayedAssets = React.useMemo(() => 
    showAll ? sortedAssets : sortedAssets.slice(0, 6),
    [showAll, sortedAssets]
  );
  const hasMore = sortedAssets.length > 6;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!loading && sortedAssets.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <WalletIcon sx={{ fontSize: 48, color: theme.palette.text.secondary, mb: 2 }} />
        <Typography variant="h6" gutterBottom>No Assets Found</Typography>
        <Typography variant="body2" color="text.secondary">
          This account doesn't have any tokens yet
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        background: darkMode 
          ? 'linear-gradient(135deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.02) 100%)'
          : 'linear-gradient(135deg, rgba(0,0,0,0.01) 0%, rgba(0,0,0,0.02) 100%)',
        borderRadius: '4px',
        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
        overflow: 'hidden',
        p: { xs: 2, sm: 3, md: 4 }
      }}
    >
      <Grid container spacing={{ xs: 1, sm: 1.5 }}>
        {/* Asset Distribution Chart */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PieChartIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 600,
                fontSize: '1rem',
                letterSpacing: '-0.01em'
              }}
            >
              Asset Distribution
            </Typography>
          </Box>

          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              minHeight: 180,
              maxHeight: 200
            }}
          >
            {(() => {
              try {
                if (!assetDistribution || !assetDistribution.series || assetDistribution.series.length === 0) {
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: theme.palette.text.secondary }}>
                      <Typography variant="body2">No asset data available</Typography>
                    </Box>
                  );
                }

                const chartData = assetDistribution.labels?.map((label, index) => {
                  const value = parseFloat(assetDistribution.series[index]) || 0;
                  return {
                    name: label,
                    y: value,
                    color: assetDistribution.colors[index]
                  };
                }).filter(item => item.y > 0) || [];

                if (chartData.length === 0) {
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: theme.palette.text.secondary }}>
                      <Typography variant="body2">No positive balances</Typography>
                    </Box>
                  );
                }

                const totalValue = assetDistribution.series.reduce((sum, val) => sum + val, 0);

                return (
                  <>
                    <Box sx={{ position: 'relative', width: '100%', height: '100%', zIndex: 1 }}>
                      <HighchartsReact
                        highcharts={Highcharts || (Highcharts = require('highcharts'))}
                        options={{
                          chart: {
                            type: 'pie',
                            backgroundColor: 'transparent',
                            height: 180,
                            animation: { duration: 1000 }
                          },
                          title: { text: null },
                          credits: { enabled: false },
                          plotOptions: {
                            pie: {
                              innerSize: '60%',
                              dataLabels: { enabled: false },
                              states: {
                                hover: { brightness: 0.1 }
                              }
                            }
                          },
                          tooltip: {
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                            borderColor: theme.palette.divider,
                            borderRadius: 8,
                            style: { color: theme.palette.text.primary },
                            formatter: function() {
                              const total = this.series.data.reduce((sum, point) => sum + point.y, 0);
                              const percentage = total > 0 ? ((this.y / total) * 100).toFixed(1) : '0.0';
                              return `<b style="font-size: 11px">${this.point.name}</b><br/><span style="font-size: 10px">Amount: ${this.y.toLocaleString()} XRP<br/>Percentage: ${percentage}%</span>`;
                            },
                            useHTML: true
                          },
                          series: [{
                            name: 'Assets',
                            type: 'pie',
                            data: chartData
                          }]
                        }}
                      />
                    </Box>
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        pointerEvents: 'none',
                        zIndex: 0,
                        p: 1,
                        borderRadius: '50%',
                        background: 'transparent'
                      }}
                    >
                      <Typography
                        variant="h6"
                        color="text.primary"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          letterSpacing: '-0.02em'
                        }}
                      >
                        {totalValue.toLocaleString()}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontSize: '0.65rem',
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          letterSpacing: '0.02em'
                        }}
                      >
                        XRP Value
                      </Typography>
                    </Box>
                  </>
                );
              } catch (error) {
                console.error('Error rendering pie chart:', error);
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: theme.palette.error.main, flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2">Error loading chart</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {error.message || 'Please try again later'}
                    </Typography>
                  </Box>
                );
              }
            })()}
          </Box>

          {assetDistribution && assetDistribution.labels && (
            <Box sx={{ mt: 1.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {assetDistribution.labels.slice(0, 3).map((label, index) => (
                  <Box
                    key={label}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1,
                      borderRadius: '8px',
                      background: 'transparent',
                      border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateX(4px)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: assetDistribution.colors[index],
                          boxShadow: `0 0 8px ${alpha(assetDistribution.colors[index], 0.4)}`
                        }}
                      />
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{
                          maxWidth: 100,
                          fontWeight: 500,
                          fontSize: '0.85rem'
                        }}
                      >
                        {label}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.8rem'
                      }}
                    >
                      {parseFloat(assetDistribution.series[index]).toLocaleString('en-US', {
                        maximumFractionDigits: 3
                      })} XRP
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Grid>

        {/* Trustlines */}
        <Grid item xs={12} md={8}>
          <Stack spacing={0.75}>
            {/* Summary Card */}
            <Box
              sx={{
                p: { xs: 0.5, sm: 0.75 },
                background: 'transparent',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                borderRadius: 1.5
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <TrendingIcon sx={{ fontSize: { xs: 20, sm: 24 }, color: theme.palette.primary.main }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                      Portfolio Overview
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                      {sortedAssets.length} assets
                    </Typography>
                  </Box>
                </Stack>
                
                <Box textAlign="right">
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>Total Value</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main, fontSize: { xs: '0.9rem', sm: '1.1rem' } }}>
                    {currencySymbols[activeFiatCurrency]}
                    {(() => {
                      const xrpToFiat = exchRate ? 1 / exchRate : 0;
                      return ((lines.reduce((acc, line) => {
                        if (line.value !== undefined && line.value !== null) {
                          return acc + (Number(line.value) * xrpToFiat);
                        }
                        const balance = parseFloat(line.balance) || 0;
                        const exch = parseFloat(line.exch) || 0;
                        return acc + (balance * exch * xrpToFiat);
                      }, 0) + 
                        ((xrpBalance || 0) * xrpToFiat))).toFixed(2);
                    })()}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Token List */}
            <Stack spacing={0.25}>
              {displayedAssets.map((asset, index) => {
                if (asset.isXRP) {
                  return (
                    <Fade in timeout={300 + index * 50} key="XRP">
                      <Box>
                        <TokenCard
                          token={{ 
                            balance: asset.balance,
                            supply: asset.supply,
                            value: asset.value
                          }}
                          account={account}
                          isXRP
                          exchRate={exchRate}
                        />
                      </Box>
                    </Fade>
                  );
                }
                
                const tokenData = {
                  ...asset,
                  currencyName: asset.name || asset.currency,
                  verified: asset.verified || false,
                  md5: asset.md5,
                  supply: asset.supply,
                  origin: asset.origin,
                  user: asset.user,
                  name: asset.name,
                  exch: asset.exch || 0
                };
                
                return (
                  <Fade in timeout={300 + index * 50} key={`${asset.currency}-${asset.issuer}`}>
                    <Box>
                      <TokenCard token={tokenData} account={account} exchRate={exchRate} />
                    </Box>
                  </Fade>
                );
              })}
            </Stack>

            {/* Show More Button */}
            {hasMore && (
              <Box sx={{ textAlign: 'center', mt: 0.75 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setShowAll(!showAll)}
                  sx={{
                    borderRadius: 1,
                    textTransform: 'none',
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    py: 0.25,
                    px: 2,
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      backgroundColor: alpha(theme.palette.primary.main, 0.05)
                    }
                  }}
                >
                  {showAll ? 'Show Less' : `Show ${sortedAssets.length - 6} More`}
                </Button>
              </Box>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}