import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import {
  IconButton,
  Typography,
  Stack,
  Box,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  Fade,
  Tooltip,
  Badge,
  Drawer,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useNotifications } from 'src/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationRow = memo(({ notification, onDelete, currentPrice }) => {
  const theme = useTheme();
  const { formatPrice } = useNotifications();

  const isTriggerable = useMemo(() => {
    if (!currentPrice) return false;
    return (
      (notification.alertType === 'above' && currentPrice >= notification.targetPrice) ||
      (notification.alertType === 'below' && currentPrice <= notification.targetPrice)
    );
  }, [currentPrice, notification.alertType, notification.targetPrice]);

  const priceAnalysis = useMemo(() => {
    if (!currentPrice) return null;

    const diff = currentPrice - notification.targetPrice;
    const percentageFromTarget = (diff / notification.targetPrice) * 100;

    // Calculate how close we are to the target (0-100%)
    let proximityPercentage = 0;
    if (notification.alertType === 'above') {
      // For "above" alerts, show how close we are to reaching the target
      if (currentPrice >= notification.targetPrice) {
        proximityPercentage = 100; // Target reached
      } else {
        // Calculate proximity based on how close we are
        const gap = notification.targetPrice - currentPrice;
        const basePrice = Math.min(currentPrice, notification.targetPrice * 0.5); // Use 50% of target as base
        proximityPercentage = Math.max(0, 100 - (gap / basePrice) * 100);
      }
    } else {
      // For "below" alerts, show how close we are to reaching the target
      if (currentPrice <= notification.targetPrice) {
        proximityPercentage = 100; // Target reached
      } else {
        // Calculate proximity based on how close we are
        const gap = currentPrice - notification.targetPrice;
        const basePrice = Math.max(currentPrice, notification.targetPrice * 1.5); // Use 150% of target as base
        proximityPercentage = Math.max(0, 100 - (gap / basePrice) * 100);
      }
    }

    return {
      percentageFromTarget,
      proximityPercentage: Math.min(100, Math.max(0, proximityPercentage)),
      isPositive: diff >= 0,
      isTriggered: (notification.alertType === 'above' && currentPrice >= notification.targetPrice) ||
                   (notification.alertType === 'below' && currentPrice <= notification.targetPrice)
    };
  }, [currentPrice, notification.targetPrice, notification.alertType]);

  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          p: 1.5,
          borderRadius: '8px',
          position: 'relative',
          overflow: 'hidden',
          background: priceAnalysis?.isTriggered
            ? alpha(theme.palette.success.main, 0.08)
            : alpha(theme.palette.background.default, 0.5),
          border: `1px solid ${
            priceAnalysis?.isTriggered
              ? alpha(theme.palette.success.main, 0.3)
              : alpha(theme.palette.divider, 0.1)
          }`,
          transition: 'all 0.2s ease',
          '&:hover': {
            background: priceAnalysis?.isTriggered
              ? alpha(theme.palette.success.main, 0.12)
              : alpha(theme.palette.background.paper, 0.8),
            borderColor: alpha(theme.palette.primary.main, 0.2)
          }
        }}
      >
        <Stack spacing={1}>
          {/* Header with token and alert type */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: alpha(
                    notification.alertType === 'above' ? theme.palette.success.main : theme.palette.warning.main,
                    0.15
                  ),
                  border: `1px solid ${alpha(
                    notification.alertType === 'above' ? theme.palette.success.main : theme.palette.warning.main,
                    0.3
                  )}`
                }}
              >
                {notification.alertType === 'above' ? (
                  <TrendingUpIcon
                    sx={{
                      fontSize: '14px',
                      color: theme.palette.success.main
                    }}
                  />
                ) : (
                  <TrendingDownIcon
                    sx={{
                      fontSize: '14px',
                      color: theme.palette.warning.main
                    }}
                  />
                )}
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    lineHeight: 1.2
                  }}
                >
                  {notification.tokenSymbol || notification.tokenName}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: alpha(theme.palette.text.secondary, 0.7),
                    fontSize: '0.7rem',
                    lineHeight: 1
                  }}
                >
                  {notification.alertType === 'above' ? 'Above' : 'Below'} {formatPrice(notification.targetPrice, notification.currency)}
                </Typography>
              </Box>
            </Stack>

            <IconButton
              size="small"
              onClick={() => onDelete(notification.id)}
              sx={{
                opacity: 0.6,
                '&:hover': {
                  opacity: 1,
                  background: alpha(theme.palette.error.main, 0.1)
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>

          {/* Current price and status */}
          {currentPrice && (
            <Box
              sx={{
                p: 1,
                borderRadius: '6px',
                background: alpha(theme.palette.info.main, 0.05),
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: '0.7rem'
                  }}
                >
                  Current: {formatPrice(currentPrice, notification.currency)}
                </Typography>

                {priceAnalysis && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: priceAnalysis.isPositive ? theme.palette.success.main : theme.palette.error.main,
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}
                  >
                    {priceAnalysis.isPositive ? '+' : ''}{priceAnalysis.percentageFromTarget.toFixed(2)}%
                  </Typography>
                )}
              </Stack>
            </Box>
          )}

          {/* Status and proximity */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              {priceAnalysis?.isTriggered ? (
                <Chip
                  label="🎯 TARGET HIT"
                  size="small"
                  sx={{
                    height: '20px',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    background: theme.palette.success.main,
                    color: 'white',
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              ) : (
                <Chip
                  label="📊 MONITORING"
                  size="small"
                  color="default"
                  sx={{
                    height: '20px',
                    fontSize: '0.65rem',
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              )}
            </Box>

            {priceAnalysis && !priceAnalysis.isTriggered && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography
                  variant="caption"
                  sx={{
                    color: alpha(theme.palette.text.secondary, 0.7),
                    fontSize: '0.65rem'
                  }}
                >
                  {priceAnalysis.proximityPercentage.toFixed(0)}% close
                </Typography>
                <Box
                  sx={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    background: alpha(theme.palette.divider, 0.3),
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    sx={{
                      width: `${priceAnalysis.proximityPercentage}%`,
                      height: '100%',
                      background: priceAnalysis.proximityPercentage > 80
                        ? theme.palette.warning.main
                        : priceAnalysis.proximityPercentage > 50
                          ? theme.palette.info.main
                          : theme.palette.primary.main,
                      transition: 'width 0.3s ease'
                    }}
                  />
                </Box>
              </Stack>
            )}
          </Stack>

          {/* Created date */}
          <Typography
            variant="caption"
            sx={{
              color: alpha(theme.palette.text.secondary, 0.6),
              fontSize: '0.65rem'
            }}
          >
            Created {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </Typography>
        </Stack>
      </Box>
    </Fade>
  );
});

const AddNotificationForm = memo(({ onAdd, onCancel }) => {
  const theme = useTheme();
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [alertType, setAlertType] = useState('above');
  const [currency, setCurrency] = useState('USD');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    setError('');

    if (!tokenSymbol.trim()) {
      setError('Please enter a token symbol');
      return;
    }

    if (!targetPrice || isNaN(targetPrice) || parseFloat(targetPrice) <= 0) {
      setError('Please enter a valid price');
      return;
    }

    // Create a mock token object for the notification
    const mockToken = {
      md5: `manual-${tokenSymbol.toLowerCase()}-${Date.now()}`,
      name: tokenSymbol.toUpperCase(),
      symbol: tokenSymbol.toUpperCase(),
      code: tokenSymbol.toUpperCase()
    };

    const newNotification = {
      id: `notify-manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tokenMd5: mockToken.md5,
      tokenName: mockToken.name,
      tokenSymbol: mockToken.symbol,
      targetPrice: parseFloat(targetPrice),
      alertType,
      currency,
      createdAt: new Date().toISOString(),
      triggered: false,
      isManual: true // Flag to indicate this is manually created
    };

    const success = onAdd(newNotification);
    if (success) {
      setTokenSymbol('');
      setTargetPrice('');
      setError('');
      onCancel();
    } else {
      setError('Failed to add notification');
    }
  };

  return (
    <Box sx={{ p: 2, background: alpha(theme.palette.background.paper, 0.8), borderRadius: '8px' }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Add Price Alert
      </Typography>

      <Stack spacing={2}>
        <TextField
          label="Token Symbol"
          value={tokenSymbol}
          onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
          size="small"
          placeholder="e.g., XRP, BTC, ETH"
          fullWidth
        />

        <Stack direction="row" spacing={1}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={alertType}
              label="Type"
              onChange={(e) => setAlertType(e.target.value)}
            >
              <MenuItem value="above">Above</MenuItem>
              <MenuItem value="below">Below</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Target Price"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            type="number"
            inputProps={{ step: 'any', min: '0' }}
            size="small"
            sx={{ flex: 1 }}
          />

          <FormControl size="small" sx={{ minWidth: 80 }}>
            <InputLabel>Currency</InputLabel>
            <Select
              value={currency}
              label="Currency"
              onChange={(e) => setCurrency(e.target.value)}
            >
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="EUR">EUR</MenuItem>
              <MenuItem value="BTC">BTC</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ fontSize: '0.8rem' }}>
            {error}
          </Alert>
        )}

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            size="small"
            sx={{ flex: 1 }}
          >
            Add Alert
          </Button>
          <Button
            variant="outlined"
            onClick={onCancel}
            size="small"
            sx={{ flex: 1 }}
          >
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
});

const NotificationSidebar = memo(({ open, onClose }) => {
  const theme = useTheme();
  const {
    notifications,
    saveNotification,
    removeNotification,
    testNotification,
    formatPrice
  } = useNotifications();

  const [showAddForm, setShowAddForm] = useState(false);
  const [currentPrices, setCurrentPrices] = useState({});

  // Fetch current prices for tokens with notifications
  useEffect(() => {
    const fetchCurrentPrices = async () => {
      if (notifications.length === 0) return;

      const uniqueTokens = [...new Set(notifications.map(n => n.tokenMd5))];
      const prices = {};

      for (const tokenMd5 of uniqueTokens) {
        try {
          const notification = notifications.find(n => n.tokenMd5 === tokenMd5);
          if (notification) {
            const response = await fetch(
              `${process.env.API_URL}/graph-ohlc-v2/${tokenMd5}?range=1D&vs_currency=${notification.currency}`
            );

            if (response.ok) {
              const data = await response.json();
              if (data.ohlc && data.ohlc.length > 0) {
                const latestCandle = data.ohlc[data.ohlc.length - 1];
                const currentPrice = parseFloat(latestCandle[4]); // Close price
                prices[notification.tokenSymbol] = currentPrice;
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching price for ${tokenMd5}:`, error);
        }
      }

      setCurrentPrices(prices);
    };

    fetchCurrentPrices();

    // Update prices every 30 seconds
    const interval = setInterval(fetchCurrentPrices, 30000);
    return () => clearInterval(interval);
  }, [notifications]);

  const handleAddNotification = (notification) => {
    return saveNotification(notification);
  };

  const handleDeleteNotification = (id) => {
    removeNotification(id);
  };

  const activeNotifications = notifications.filter(n => !n.triggered);
  const hasActiveNotifications = activeNotifications.length > 0;

  return (
    <Drawer
      anchor="right"
      variant="persistent"
      open={open}
      hideBackdrop
      PaperProps={{
        sx: {
          width: { md: 320, lg: 360, xl: 380 },
          minWidth: { md: 300 },
          top: { xs: 56, sm: 56, md: 56 },
          height: {
            xs: 'calc(100vh - 56px)',
            sm: 'calc(100vh - 56px)',
            md: 'calc(100vh - 56px)'
          },
          borderLeft: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          backgroundColor: theme.palette.background.paper,
          boxShadow: `-4px 0 16px ${alpha(theme.palette.common.black, 0.08)}, -1px 0 2px ${alpha(
            theme.palette.common.black,
            0.04
          )}`,
          overflow: 'hidden'
        }
      }}
      ModalProps={{ keepMounted: true }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            pb: 1,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            flexShrink: 0
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <NotificationsIcon sx={{ color: theme.palette.primary.main }} />
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                Price Alerts
              </Typography>
              {hasActiveNotifications && (
                <Badge
                  badgeContent={activeNotifications.length}
                  color="primary"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.7rem',
                      height: '18px',
                      minWidth: '18px'
                    }
                  }}
                />
              )}
            </Stack>

            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Test Notification">
                <IconButton
                  size="small"
                  onClick={testNotification}
                  sx={{
                    '&:hover': {
                      background: alpha(theme.palette.success.main, 0.1)
                    }
                  }}
                >
                  <NotificationsActiveIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <IconButton
                size="small"
                onClick={onClose}
                sx={{
                  '&:hover': {
                    background: alpha(theme.palette.error.main, 0.1)
                  }
                }}
              >
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
          </Stack>

          {/* Notification permission status */}
          {Notification.permission === 'granted' && (
            <Alert severity="success" sx={{ mt: 1, fontSize: '0.8rem' }}>
              ✓ Browser notifications enabled
            </Alert>
          )}

          {Notification.permission === 'denied' && (
            <Alert severity="warning" sx={{ mt: 1, fontSize: '0.8rem' }}>
              Browser notifications blocked
            </Alert>
          )}
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          {/* Add notification button */}
          {!showAddForm && (
            <Button
              variant="outlined"
              onClick={() => setShowAddForm(true)}
              startIcon={<AddIcon />}
              fullWidth
              sx={{ mb: 2 }}
            >
              Add Price Alert
            </Button>
          )}

          {/* Add notification form */}
          {showAddForm && (
            <Box sx={{ mb: 2 }}>
              <AddNotificationForm
                onAdd={handleAddNotification}
                onCancel={() => setShowAddForm(false)}
              />
            </Box>
          )}

          {/* Notifications list */}
          {activeNotifications.length === 0 ? (
            <Box
              sx={{
                py: 4,
                textAlign: 'center',
                borderRadius: '8px',
                background: alpha(theme.palette.background.default, 0.5)
              }}
            >
              <NotificationsIcon
                sx={{
                  fontSize: 48,
                  color: alpha(theme.palette.text.secondary, 0.3),
                  mb: 1
                }}
              />
              <Typography
                variant="body2"
                sx={{ color: alpha(theme.palette.text.secondary, 0.7), mb: 0.5 }}
              >
                No active price alerts
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: alpha(theme.palette.text.secondary, 0.5) }}
              >
                Add alerts to monitor token prices
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {activeNotifications.map((notification) => {
                const currentPrice = currentPrices[notification.tokenSymbol];
                return (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    onDelete={handleDeleteNotification}
                    currentPrice={currentPrice}
                  />
                );
              })}
            </Stack>
          )}

          {/* Info section */}
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="caption"
              sx={{
                color: alpha(theme.palette.text.secondary, 0.6),
                fontSize: '0.7rem',
                display: 'block',
                textAlign: 'center'
              }}
            >
              Notifications check prices every 30 seconds
            </Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
});

NotificationSidebar.displayName = 'NotificationSidebar';
NotificationRow.displayName = 'NotificationRow';
AddNotificationForm.displayName = 'AddNotificationForm';

export default NotificationSidebar;