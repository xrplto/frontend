import React, { useState, useContext } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AddAlertIcon from '@mui/icons-material/AddAlert';
import { AppContext } from 'src/AppContext';
import { useNotifications } from 'src/contexts/NotificationContext';

const ChartNotificationButton = ({ token, currentPrice }) => {
  const theme = useTheme();
  const { activeFiatCurrency } = useContext(AppContext);
  const {
    notifications,
    saveNotification,
    testNotification,
    formatPrice
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [alertType, setAlertType] = useState('above');
  const [error, setError] = useState('');

  // Get notifications for this token
  const tokenNotifications = notifications.filter(n =>
    n.tokenMd5 === token.md5 ||
    n.tokenSymbol === (token.symbol || token.code)
  );

  const handleAddNotification = () => {
    setError('');

    if (!targetPrice || isNaN(targetPrice) || parseFloat(targetPrice) <= 0) {
      setError('Please enter a valid price');
      return;
    }

    const price = parseFloat(targetPrice);

    // Check if notification already exists
    const exists = tokenNotifications.some(n =>
      n.targetPrice === price &&
      n.alertType === alertType &&
      n.currency === activeFiatCurrency
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
          background: hasActiveNotifications
            ? `linear-gradient(135deg, ${theme.palette.warning.main}15, ${theme.palette.warning.main}08)`
            : 'transparent',
          border: hasActiveNotifications
            ? `1px solid ${theme.palette.warning.main}30`
            : '1px solid transparent',
          borderRadius: '6px',
          transition: 'all 0.2s ease',
          '&:hover': {
            background: hasActiveNotifications
              ? `linear-gradient(135deg, ${theme.palette.warning.main}25, ${theme.palette.warning.main}15)`
              : `${theme.palette.action.hover}`,
            borderColor: hasActiveNotifications
              ? `${theme.palette.warning.main}50`
              : theme.palette.divider
          },
          '& .MuiSvgIcon-root': {
            fontSize: '1.25rem'
          }
        }}
        title={`Price Alerts${hasActiveNotifications ? ` (${tokenNotifications.length})` : ''}`}
      >
        {hasActiveNotifications ? <NotificationsActiveIcon /> : <AddAlertIcon />}
      </IconButton>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddAlertIcon />
            <Typography variant="h6">
              Set Price Alert - {token.name}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          {/* Current price info */}
          {currentPrice && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Current price: {formatPrice(currentPrice, activeFiatCurrency)}
            </Alert>
          )}

          {/* Quick action buttons */}
          {currentPrice && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                Quick Setup
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  label={`+5% (${formatPrice(currentPrice * 1.05, activeFiatCurrency)})`}
                  onClick={() => {
                    setTargetPrice((currentPrice * 1.05).toString());
                    setAlertType('above');
                  }}
                  size="small"
                  sx={{ cursor: 'pointer' }}
                />
                <Chip
                  label={`+10% (${formatPrice(currentPrice * 1.1, activeFiatCurrency)})`}
                  onClick={() => {
                    setTargetPrice((currentPrice * 1.1).toString());
                    setAlertType('above');
                  }}
                  size="small"
                  sx={{ cursor: 'pointer' }}
                />
                <Chip
                  label={`-5% (${formatPrice(currentPrice * 0.95, activeFiatCurrency)})`}
                  onClick={() => {
                    setTargetPrice((currentPrice * 0.95).toString());
                    setAlertType('below');
                  }}
                  size="small"
                  sx={{ cursor: 'pointer' }}
                />
                <Chip
                  label={`-10% (${formatPrice(currentPrice * 0.9, activeFiatCurrency)})`}
                  onClick={() => {
                    setTargetPrice((currentPrice * 0.9).toString());
                    setAlertType('below');
                  }}
                  size="small"
                  sx={{ cursor: 'pointer' }}
                />
              </Stack>
            </Box>
          )}

          {/* Manual setup */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Custom Alert
            </Typography>

            <Stack direction="row" spacing={2} alignItems="flex-start">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Alert Type</InputLabel>
                <Select
                  value={alertType}
                  label="Alert Type"
                  onChange={(e) => setAlertType(e.target.value)}
                >
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

              <Button
                variant="contained"
                onClick={handleAddNotification}
                sx={{ minWidth: 80 }}
              >
                Add
              </Button>
            </Stack>

            {error && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {error}
              </Alert>
            )}
          </Box>

          {/* Existing notifications for this token */}
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

          {/* Notification permission status */}
          {Notification.permission === 'denied' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Browser notifications are blocked. Enable them in your browser settings to receive alerts.
            </Alert>
          )}

          {Notification.permission === 'granted' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">
                  ✓ Browser notifications enabled
                </Typography>
                <Button size="small" onClick={testNotification}>
                  Test
                </Button>
              </Box>
            </Alert>
          )}

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              💡 Access all your alerts from the notification button in the header
            </Typography>
          </Alert>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChartNotificationButton;