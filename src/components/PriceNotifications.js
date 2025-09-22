import React, { useState, useContext, memo, useMemo, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Drawer,
  Badge,
  Tooltip,
  Fade,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Avatar,
  Autocomplete,
  CircularProgress,
  ListItemAvatar
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AddAlertIcon from '@mui/icons-material/AddAlert';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import MonitorIcon from '@mui/icons-material/Monitor';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import { AppContext } from 'src/AppContext';
import { useNotifications } from 'src/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

// Global Header Button
export const GlobalNotificationButton = ({ sidebarOpen, onSidebarToggle }) => {
  const theme = useTheme();
  const { notifications } = useNotifications();

  const activeNotifications = notifications.filter(n => !n.triggered);
  const hasActiveNotifications = activeNotifications.length > 0;

  return (
    <>
      <Tooltip title={`Price Alerts${hasActiveNotifications ? ` (${activeNotifications.length})` : ''}`}>
        <IconButton
          onClick={() => onSidebarToggle?.(true)}
          sx={{
            padding: { xs: '8px', sm: '10px' },
            minWidth: { xs: '40px', sm: '44px' },
            minHeight: { xs: '40px', sm: '44px' },
            color: hasActiveNotifications ? theme.palette.warning.main : theme.palette.text.secondary,
            background: hasActiveNotifications ? alpha(theme.palette.warning.main, 0.08) : 'transparent',
            border: hasActiveNotifications ? `1px solid ${alpha(theme.palette.warning.main, 0.2)}` : `1px solid transparent`,
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            '&:hover': {
              background: hasActiveNotifications ? alpha(theme.palette.warning.main, 0.12) : alpha(theme.palette.text.secondary, 0.08),
              borderColor: hasActiveNotifications ? alpha(theme.palette.warning.main, 0.3) : alpha(theme.palette.text.secondary, 0.2)
            }
          }}
        >
          <Badge
            badgeContent={hasActiveNotifications ? activeNotifications.length : 0}
            color="warning"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.7rem',
                height: '18px',
                minWidth: '18px',
                background: theme.palette.warning.main,
                color: 'white'
              }
            }}
          >
            {hasActiveNotifications ? (
              <NotificationsActiveIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} />
            ) : (
              <NotificationsIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} />
            )}
          </Badge>
        </IconButton>
      </Tooltip>
      <NotificationSidebar open={sidebarOpen} onClose={() => onSidebarToggle?.(false)} />
    </>
  );
};

// Chart-specific Button
export const ChartNotificationButton = ({ token, currentPrice }) => {
  const theme = useTheme();
  const { activeFiatCurrency } = useContext(AppContext);
  const { notifications, saveNotification, testNotification, formatPrice } = useNotifications();
  const [open, setOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [alertType, setAlertType] = useState('above');
  const [error, setError] = useState('');

  const tokenNotifications = notifications.filter(n =>
    n.tokenMd5 === token.md5 || n.tokenSymbol === (token.symbol || token.code)
  );

  const handleAddNotification = () => {
    setError('');
    if (!targetPrice || isNaN(targetPrice) || parseFloat(targetPrice) <= 0) {
      setError('Please enter a valid price');
      return;
    }

    const price = parseFloat(targetPrice);
    const exists = tokenNotifications.some(n =>
      n.targetPrice === price && n.alertType === alertType && n.currency === activeFiatCurrency
    );

    if (exists) {
      setError('This notification already exists');
      return;
    }

    const newNotification = {
      id: `notify-chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tokenMd5: token.md5,
      tokenName: token.name,
      tokenSymbol: token.symbol || token.code,
      tokenSlug: token.slug,
      targetPrice: price,
      alertType,
      currency: activeFiatCurrency,
      createdAt: new Date().toISOString(),
      triggered: false
    };

    const success = saveNotification(newNotification);
    if (success) {
      setTargetPrice('');
      setError('');
      setOpen(false);
    } else {
      setError('Failed to save notification');
    }
  };

  const hasActiveNotifications = tokenNotifications.length > 0;

  return (
    <>
      <IconButton
        size="small"
        onClick={() => setOpen(true)}
        sx={{
          ml: 1,
          p: 1,
          color: hasActiveNotifications ? theme.palette.warning.main : 'inherit',
          background: hasActiveNotifications ? `linear-gradient(135deg, ${theme.palette.warning.main}15, ${theme.palette.warning.main}08)` : 'transparent',
          border: hasActiveNotifications ? `1px solid ${theme.palette.warning.main}30` : '1px solid transparent',
          borderRadius: '6px',
          transition: 'all 0.2s ease',
          '&:hover': {
            background: hasActiveNotifications ? `linear-gradient(135deg, ${theme.palette.warning.main}25, ${theme.palette.warning.main}15)` : `${theme.palette.action.hover}`,
            borderColor: hasActiveNotifications ? `${theme.palette.warning.main}50` : theme.palette.divider
          },
          '& .MuiSvgIcon-root': { fontSize: '1.25rem' }
        }}
        title={`Price Alerts${hasActiveNotifications ? ` (${tokenNotifications.length})` : ''}`}
      >
        {hasActiveNotifications ? <NotificationsActiveIcon /> : <AddAlertIcon />}
      </IconButton>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddAlertIcon />
            <Typography variant="h6">Set Price Alert - {token.name}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {currentPrice && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Current price: {formatPrice(currentPrice, activeFiatCurrency)}
            </Alert>
          )}

          {currentPrice && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>Quick Setup</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {[
                  { label: '+5%', multiplier: 1.05, type: 'above' },
                  { label: '+10%', multiplier: 1.1, type: 'above' },
                  { label: '-5%', multiplier: 0.95, type: 'below' },
                  { label: '-10%', multiplier: 0.9, type: 'below' }
                ].map(({ label, multiplier, type }) => (
                  <Chip
                    key={label}
                    label={`${label} (${formatPrice(currentPrice * multiplier, activeFiatCurrency)})`}
                    onClick={() => {
                      setTargetPrice((currentPrice * multiplier).toString());
                      setAlertType(type);
                    }}
                    size="small"
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>Custom Alert</Typography>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Alert Type</InputLabel>
                <Select value={alertType} label="Alert Type" onChange={(e) => setAlertType(e.target.value)}>
                  <MenuItem value="above">Price Above</MenuItem>
                  <MenuItem value="below">Price Below</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label={`Target Price (${activeFiatCurrency})`}
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                type="number"
                inputProps={{ step: 'any', min: '0' }}
                size="small"
                sx={{ flex: 1 }}
                error={!!error}
              />
              <Button variant="contained" onClick={handleAddNotification} sx={{ minWidth: 80 }}>Add</Button>
            </Stack>
            {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
          </Box>

          {tokenNotifications.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Active Alerts ({tokenNotifications.length})
              </Typography>
              <Stack spacing={1}>
                {tokenNotifications.slice(0, 3).map((notification) => (
                  <Chip
                    key={notification.id}
                    label={`${notification.alertType === 'above' ? '↗' : '↘'} ${formatPrice(notification.targetPrice, notification.currency)}`}
                    size="small"
                    color={notification.alertType === 'above' ? 'success' : 'warning'}
                    variant="outlined"
                  />
                ))}
                {tokenNotifications.length > 3 && (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    +{tokenNotifications.length - 3} more alerts
                  </Typography>
                )}
              </Stack>
            </Box>
          )}

          {Notification.permission === 'granted' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CheckCircleIcon sx={{ fontSize: '16px' }} />
                  <Typography variant="body2">Browser notifications enabled</Typography>
                </Box>
                <Button size="small" onClick={testNotification}>Test</Button>
              </Box>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Notification Row Component
const NotificationRow = memo(({ notification, onDelete, currentPrice }) => {
  const theme = useTheme();
  const { formatPrice } = useNotifications();

  const priceAnalysis = useMemo(() => {
    if (!currentPrice) return null;
    const diff = currentPrice - notification.targetPrice;
    const percentageFromTarget = (diff / notification.targetPrice) * 100;
    let proximityPercentage = 0;

    if (notification.alertType === 'above') {
      if (currentPrice >= notification.targetPrice) {
        proximityPercentage = 100;
      } else {
        const gap = notification.targetPrice - currentPrice;
        const basePrice = Math.min(currentPrice, notification.targetPrice * 0.5);
        proximityPercentage = Math.max(0, 100 - (gap / basePrice) * 100);
      }
    } else {
      if (currentPrice <= notification.targetPrice) {
        proximityPercentage = 100;
      } else {
        const gap = currentPrice - notification.targetPrice;
        const basePrice = Math.max(currentPrice, notification.targetPrice * 1.5);
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
          background: priceAnalysis?.isTriggered ? alpha(theme.palette.success.main, 0.08) : alpha(theme.palette.background.default, 0.5),
          border: `1px solid ${priceAnalysis?.isTriggered ? alpha(theme.palette.success.main, 0.3) : alpha(theme.palette.divider, 0.1)}`,
          transition: 'all 0.2s ease'
        }}
      >
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              {!notification.isManual && notification.tokenMd5 ? (
                <Avatar
                  src={`https://s1.xrpl.to/token/${notification.tokenMd5}`}
                  sx={{ width: 24, height: 24 }}
                >
                  {notification.tokenSymbol?.[0]}
                </Avatar>
              ) : (
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
                    )
                  }}
                >
                  {notification.alertType === 'above' ? (
                    <TrendingUpIcon sx={{ fontSize: '14px', color: theme.palette.success.main }} />
                  ) : (
                    <TrendingDownIcon sx={{ fontSize: '14px', color: theme.palette.warning.main }} />
                  )}
                </Box>
              )}
              <Box>
                {notification.tokenSlug && !notification.isManual ? (
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      '&:hover': { color: theme.palette.primary.main }
                    }}
                    onClick={() => window.open(`/token/${notification.tokenSlug}`, '_blank')}
                  >
                    {notification.tokenSymbol || notification.tokenName}
                  </Typography>
                ) : (
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                    {notification.tokenSymbol || notification.tokenName}
                  </Typography>
                )}
                <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.7), fontSize: '0.7rem' }}>
                  {notification.alertType === 'above' ? 'Above' : 'Below'} {formatPrice(notification.targetPrice, notification.currency)}
                </Typography>
              </Box>
            </Stack>
            <IconButton size="small" onClick={() => onDelete(notification.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>

          {currentPrice && (
            <Box sx={{ p: 1, borderRadius: '6px', background: alpha(theme.palette.info.main, 0.05) }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem' }}>
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

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Chip
              icon={priceAnalysis?.isTriggered ? <GpsFixedIcon sx={{ fontSize: '12px !important' }} /> : <MonitorIcon sx={{ fontSize: '12px !important' }} />}
              label={priceAnalysis?.isTriggered ? "TARGET HIT" : "MONITORING"}
              size="small"
              sx={{
                height: '20px',
                fontSize: '0.65rem',
                fontWeight: priceAnalysis?.isTriggered ? 600 : 400,
                background: priceAnalysis?.isTriggered ? theme.palette.success.main : 'default',
                color: priceAnalysis?.isTriggered ? 'white' : 'inherit'
              }}
            />
            {priceAnalysis && !priceAnalysis.isTriggered && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.7), fontSize: '0.65rem' }}>
                  {priceAnalysis.proximityPercentage.toFixed(0)}% close
                </Typography>
                <Box sx={{ width: 40, height: 4, borderRadius: 2, background: alpha(theme.palette.divider, 0.3) }}>
                  <Box
                    sx={{
                      width: `${priceAnalysis.proximityPercentage}%`,
                      height: '100%',
                      background: priceAnalysis.proximityPercentage > 80 ? theme.palette.warning.main : theme.palette.primary.main,
                      transition: 'width 0.3s ease'
                    }}
                  />
                </Box>
              </Stack>
            )}
          </Stack>

          <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.6), fontSize: '0.65rem' }}>
            Created {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </Typography>
        </Stack>
      </Box>
    </Fade>
  );
});

// Main Sidebar Component
export const NotificationSidebar = memo(({ open, onClose }) => {
  const theme = useTheme();
  const { notifications, saveNotification, removeNotification, testNotification, formatPrice } = useNotifications();
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentPrices, setCurrentPrices] = useState({});

  const activeNotifications = notifications.filter(n => !n.triggered);

  React.useEffect(() => {
    const fetchCurrentPrices = async () => {
      if (notifications.length === 0) return;
      const uniqueTokens = [...new Set(notifications.map(n => n.tokenMd5).filter(md5 => !md5.startsWith('manual-')))];
      const prices = {};

      for (const tokenMd5 of uniqueTokens) {
        try {
          const notification = notifications.find(n => n.tokenMd5 === tokenMd5);
          if (notification) {
            const response = await fetch(`${process.env.API_URL}/graph-ohlc-v2/${tokenMd5}?range=1D&vs_currency=${notification.currency}`);
            if (response.ok) {
              const data = await response.json();
              if (data.ohlc && data.ohlc.length > 0) {
                const latestCandle = data.ohlc[data.ohlc.length - 1];
                prices[tokenMd5] = parseFloat(latestCandle[4]);
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
    const interval = setInterval(fetchCurrentPrices, 30000);
    return () => clearInterval(interval);
  }, [notifications]);

  return (
    <Drawer
      anchor="right"
      variant="persistent"
      open={open}
      hideBackdrop
      PaperProps={{
        sx: {
          width: { md: 320, lg: 360, xl: 380 },
          minWidth: { md: 316 },
          top: { xs: 56, sm: 56, md: 56 },
          height: 'calc(100vh - 56px)',
          borderLeft: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          backgroundColor: theme.palette.background.paper,
          boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.08)}, 0 1px 2px ${alpha(theme.palette.common.black, 0.04)}`,
          overflow: 'hidden'
        }
      }}
      ModalProps={{ keepMounted: true }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <NotificationsIcon sx={{ color: theme.palette.primary.main }} />
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Price Alerts</Typography>
              {activeNotifications.length > 0 && (
                <Badge badgeContent={activeNotifications.length} color="primary" />
              )}
            </Stack>
            <Stack direction="row" spacing={0.5}>
              <IconButton size="small" onClick={testNotification}>
                <NotificationsActiveIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton size="small" onClick={onClose}>
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
          </Stack>
          {Notification.permission === 'granted' && (
            <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mt: 1, fontSize: '0.8rem' }}>Browser notifications enabled</Alert>
          )}
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          {!showAddForm && (
            <Button variant="outlined" onClick={() => setShowAddForm(true)} startIcon={<AddIcon />} fullWidth sx={{ mb: 2 }}>
              Add Price Alert
            </Button>
          )}

          {showAddForm && <AddNotificationForm onAdd={saveNotification} onCancel={() => setShowAddForm(false)} />}

          {activeNotifications.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center', borderRadius: '8px', background: alpha(theme.palette.background.default, 0.5) }}>
              <NotificationsIcon sx={{ fontSize: 48, color: alpha(theme.palette.text.secondary, 0.3), mb: 1 }} />
              <Typography variant="body2" sx={{ color: alpha(theme.palette.text.secondary, 0.7) }}>
                No active price alerts
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {activeNotifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onDelete={removeNotification}
                  currentPrice={currentPrices[notification.tokenMd5]}
                />
              ))}
            </Stack>
          )}
        </Box>
      </Box>
    </Drawer>
  );
});

// Add Form Component
const AddNotificationForm = memo(({ onAdd, onCancel }) => {
  const theme = useTheme();
  const [selectedToken, setSelectedToken] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [alertType, setAlertType] = useState('above');
  const [currency, setCurrency] = useState('USD');
  const [error, setError] = useState('');

  // Search tokens
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const searchTokens = async () => {
      setLoading(true);
      try {
        const response = await axios.post(`${process.env.API_URL}/search`, {
          search: searchQuery
        });
        if (response.data?.tokens) {
          setSearchResults(response.data.tokens.slice(0, 8));
          setShowResults(true);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchTokens, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleTokenSelect = (token) => {
    setSelectedToken(token);
    setSearchQuery('');
    setShowResults(false);
    if (token.exch) {
      setTargetPrice(token.exch.toString());
    }
  };

  const handleSubmit = () => {
    setError('');
    if (!selectedToken) {
      setError('Please select a token');
      return;
    }
    if (!targetPrice || isNaN(targetPrice) || parseFloat(targetPrice) <= 0) {
      setError('Please enter a valid price');
      return;
    }

    const newNotification = {
      id: `notify-search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tokenMd5: selectedToken.md5,
      tokenName: selectedToken.name,
      tokenSymbol: selectedToken.user,
      tokenSlug: selectedToken.slug,
      targetPrice: parseFloat(targetPrice),
      alertType,
      currency,
      createdAt: new Date().toISOString(),
      triggered: false
    };

    const success = onAdd(newNotification);
    if (success) {
      setSelectedToken(null);
      setTargetPrice('');
      setError('');
      onCancel();
    } else {
      setError('Failed to add notification');
    }
  };

  return (
    <Box sx={{ p: 2, background: alpha(theme.palette.background.paper, 0.8), borderRadius: '8px', mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>Add Price Alert</Typography>
      <Stack spacing={2}>
        {/* Selected Token Display */}
        {selectedToken && (
          <Box sx={{ p: 1.5, background: alpha(theme.palette.primary.main, 0.1), borderRadius: '6px', border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}` }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Avatar src={`https://s1.xrpl.to/token/${selectedToken.md5}`} sx={{ width: 24, height: 24 }}>
                {selectedToken.user?.[0]}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  {selectedToken.user}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                  {selectedToken.name} • Current: ${selectedToken.exch || '0.00'}
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => setSelectedToken(null)}>
                <CloseIcon sx={{ fontSize: '16px' }} />
              </IconButton>
            </Stack>
          </Box>
        )}

        {/* Token Search */}
        {!selectedToken && (
          <Box sx={{ position: 'relative' }}>
            <TextField
              label="Search Token"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              placeholder="Search for tokens..."
              fullWidth
              InputProps={{
                endAdornment: loading && <CircularProgress size={20} />
              }}
            />
            {showResults && searchResults.length > 0 && (
              <Box sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1000,
                background: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                boxShadow: theme.shadows[8]
              }}>
                {searchResults.map((token, index) => (
                  <Box
                    key={index}
                    onClick={() => handleTokenSelect(token)}
                    sx={{
                      p: 1,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': { background: alpha(theme.palette.action.hover, 0.1) }
                    }}
                  >
                    <Avatar src={`https://s1.xrpl.to/token/${token.md5}`} sx={{ width: 20, height: 20 }}>
                      {token.user?.[0]}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{token.user}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                        {token.name}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                      ${token.exch || '0.00'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
        <Stack direction="row" spacing={1}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Type</InputLabel>
            <Select value={alertType} label="Type" onChange={(e) => setAlertType(e.target.value)}>
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
            <Select value={currency} label="Currency" onChange={(e) => setCurrency(e.target.value)}>
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="EUR">EUR</MenuItem>
              <MenuItem value="BTC">BTC</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        {error && <Alert severity="error" sx={{ fontSize: '0.8rem' }}>{error}</Alert>}
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={handleSubmit} size="small" sx={{ flex: 1 }}>Add Alert</Button>
          <Button variant="outlined" onClick={onCancel} size="small" sx={{ flex: 1 }}>Cancel</Button>
        </Stack>
      </Stack>
    </Box>
  );
});

NotificationRow.displayName = 'NotificationRow';
NotificationSidebar.displayName = 'NotificationSidebar';
AddNotificationForm.displayName = 'AddNotificationForm';