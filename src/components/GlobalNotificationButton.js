import React, { useState } from 'react';
import { IconButton, Badge, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useNotifications } from 'src/contexts/NotificationContext';
import NotificationSidebar from './NotificationSidebar';

const GlobalNotificationButton = () => {
  const theme = useTheme();
  const { notifications } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeNotifications = notifications.filter(n => !n.triggered);
  const hasActiveNotifications = activeNotifications.length > 0;

  return (
    <>
      <Tooltip title={`Price Alerts${hasActiveNotifications ? ` (${activeNotifications.length})` : ''}`}>
        <IconButton
          onClick={() => setSidebarOpen(true)}
          sx={{
            padding: { xs: '8px', sm: '10px' },
            minWidth: { xs: '40px', sm: '44px' },
            minHeight: { xs: '40px', sm: '44px' },
            color: hasActiveNotifications ? theme.palette.warning.main : theme.palette.text.secondary,
            background: hasActiveNotifications
              ? alpha(theme.palette.warning.main, 0.08)
              : 'transparent',
            border: hasActiveNotifications
              ? `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
              : `1px solid transparent`,
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            '&:hover': {
              background: hasActiveNotifications
                ? alpha(theme.palette.warning.main, 0.12)
                : alpha(theme.palette.text.secondary, 0.08),
              borderColor: hasActiveNotifications
                ? alpha(theme.palette.warning.main, 0.3)
                : alpha(theme.palette.text.secondary, 0.2)
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
              <NotificationsActiveIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem' } }} />
            ) : (
              <NotificationsIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem' } }} />
            )}
          </Badge>
        </IconButton>
      </Tooltip>

      <NotificationSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </>
  );
};

export default GlobalNotificationButton;