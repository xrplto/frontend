import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { currencySymbols } from 'src/utils/constants';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);
  const intervalRef = useRef(null);
  const lastPricesRef = useRef({});

  const BASE_URL = process.env.API_URL;

  // Request notification permission automatically
  const requestNotificationPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default' && !hasRequestedPermission) {
      console.log('Requesting notification permission...');
      Notification.requestPermission().then((permission) => {
        console.log('Notification permission result:', permission);
        setHasRequestedPermission(true);
      });
    }
  }, [hasRequestedPermission]);

  // Load all notifications from localStorage
  const loadNotifications = useCallback(() => {
    try {
      const saved = localStorage.getItem('priceNotifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        const activeNotifications = parsed.filter(n => !n.triggered);
        setNotifications(activeNotifications);
        console.log('Loaded notifications:', activeNotifications.length);
        return activeNotifications;
      }
    } catch (e) {
      console.error('Error loading notifications:', e);
    }
    return [];
  }, []);

  // Save notification
  const saveNotification = useCallback((newNotification) => {
    try {
      const saved = localStorage.getItem('priceNotifications');
      let allNotifications = saved ? JSON.parse(saved) : [];
      allNotifications.push(newNotification);
      localStorage.setItem('priceNotifications', JSON.stringify(allNotifications));

      // Update state directly instead of reloading to prevent key conflicts
      const activeNotifications = allNotifications.filter(n => !n.triggered);
      setNotifications(activeNotifications);
      console.log('Saved notification, active count:', activeNotifications.length);
      return true;
    } catch (e) {
      console.error('Error saving notification:', e);
      return false;
    }
  }, []);

  // Remove notification
  const removeNotification = useCallback((notificationId) => {
    try {
      const saved = localStorage.getItem('priceNotifications');
      if (saved) {
        let allNotifications = JSON.parse(saved);
        allNotifications = allNotifications.filter(n => n.id !== notificationId);
        localStorage.setItem('priceNotifications', JSON.stringify(allNotifications));

        // Update state directly instead of reloading to prevent key conflicts
        const activeNotifications = allNotifications.filter(n => !n.triggered);
        setNotifications(activeNotifications);
        console.log('Removed notification, active count:', activeNotifications.length);
        return true;
      }
    } catch (e) {
      console.error('Error removing notification:', e);
    }
    return false;
  }, []);

  // Format price for display
  const formatPrice = useCallback((price, currency) => {
    const symbol = currencySymbols[currency] || '';

    if (price < 0.00001) {
      return symbol + price.toFixed(8);
    } else if (price < 0.001) {
      return symbol + price.toFixed(6);
    } else if (price < 0.01) {
      return symbol + price.toFixed(6);
    } else if (price < 1) {
      return symbol + price.toFixed(4);
    } else if (price < 100) {
      return symbol + price.toFixed(3);
    } else if (price < 1000) {
      return symbol + price.toFixed(2);
    } else {
      return symbol + Math.round(price).toLocaleString();
    }
  }, []);

  // Check current prices against notifications
  const checkPrices = useCallback(async () => {
    if (notifications.length === 0) return;

    // Group notifications by token to minimize API calls
    const tokenGroups = {};
    notifications.forEach(notification => {
      if (!tokenGroups[notification.tokenMd5]) {
        tokenGroups[notification.tokenMd5] = [];
      }
      tokenGroups[notification.tokenMd5].push(notification);
    });

    console.log('Checking prices for', Object.keys(tokenGroups).length, 'tokens');

    const triggered = [];

    // Check each token group
    for (const [tokenMd5, tokenNotifications] of Object.entries(tokenGroups)) {
      try {
        // Get current price for this token
        const currency = tokenNotifications[0]?.currency || 'USD';
        const response = await axios.get(
          `${BASE_URL}/graph-ohlc-v2/${tokenMd5}?range=1D&vs_currency=${currency}`
        );

        if (response.data?.ohlc && response.data.ohlc.length > 0) {
          const latestCandle = response.data.ohlc[response.data.ohlc.length - 1];
          const currentPrice = parseFloat(latestCandle[4]); // Close price

          // Only check if price has changed since last check
          const lastPrice = lastPricesRef.current[tokenMd5];
          if (lastPrice === currentPrice) continue;

          lastPricesRef.current[tokenMd5] = currentPrice;
          console.log(`Price update for ${tokenNotifications[0]?.tokenName}: ${currentPrice}`);

          // Check each notification for this token
          tokenNotifications.forEach(notification => {
            const shouldTrigger =
              (notification.alertType === 'above' && currentPrice >= notification.targetPrice) ||
              (notification.alertType === 'below' && currentPrice <= notification.targetPrice);

            if (shouldTrigger) {
              triggered.push({ ...notification, currentPrice });
              console.log(`ALERT TRIGGERED: ${notification.tokenName} ${notification.alertType} ${notification.targetPrice} (current: ${currentPrice})`);

              // Show browser notification
              if (Notification.permission === 'granted') {
                const symbol = notification.tokenSymbol || notification.tokenName;
                const formattedPrice = formatPrice(currentPrice, currency);
                const targetPrice = formatPrice(notification.targetPrice, currency);

                const browserNotification = new Notification(`🔔 ${symbol} Price Alert`, {
                  body: `Price ${notification.alertType} ${targetPrice}\nCurrent: ${formattedPrice}`,
                  icon: '/icons/icon-192x192.png',
                  tag: `price-alert-${notification.id}`,
                  requireInteraction: true,
                  silent: false
                });

                // Play sound if possible
                try {
                  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D1u2UfBDSH0fLRfC4NJHPJQuB8PQgPabLx5qZaFQpBmOH3sWcfBDJ90fDOci0KHW3B6+OOPwhAgOHtp2EZBz2H0fLNeSLNJHXFQNeMNQ');
                  audio.play().catch(() => {
                    // Silent fail if audio doesn't work
                  });
                } catch (e) {
                  // Silent fail
                }

                // Auto-close after 15 seconds
                setTimeout(() => {
                  try {
                    browserNotification.close();
                  } catch (e) {
                    // Already closed
                  }
                }, 15000);
              }
            }
          });
        }
      } catch (error) {
        console.error(`Error checking price for token ${tokenMd5}:`, error);
      }
    }

    // Mark triggered notifications and save
    if (triggered.length > 0) {
      try {
        const saved = localStorage.getItem('priceNotifications');
        if (saved) {
          let allNotifications = JSON.parse(saved);

          // Mark triggered notifications
          allNotifications = allNotifications.map(n => {
            const isTriggered = triggered.some(t => t.id === n.id);
            return isTriggered ? { ...n, triggered: true, triggeredAt: new Date().toISOString() } : n;
          });

          localStorage.setItem('priceNotifications', JSON.stringify(allNotifications));

          // Update state directly to prevent key conflicts
          const activeNotifications = allNotifications.filter(n => !n.triggered);
          setNotifications(activeNotifications);
          console.log('Updated triggered notifications, active count:', activeNotifications.length);
        }
      } catch (e) {
        console.error('Error updating triggered notifications:', e);
      }
    }
  }, [notifications, BASE_URL, formatPrice, loadNotifications]);

  // Start price monitoring
  const startMonitoring = useCallback(() => {
    if (intervalRef.current) return; // Already running

    console.log('Starting price monitoring...');
    intervalRef.current = setInterval(() => {
      checkPrices();
    }, 30000); // Check every 30 seconds

    // Initial check
    checkPrices();
  }, [checkPrices]);

  // Stop price monitoring
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('Stopped price monitoring');
    }
  }, []);

  // Test notification
  const testNotification = useCallback(() => {
    if (Notification.permission === 'granted') {
      const testNotif = new Notification('🔔 Test Notification', {
        body: 'Price notifications are working correctly!',
        icon: '/icons/icon-192x192.png',
        tag: 'test-notification',
        requireInteraction: true
      });

      setTimeout(() => {
        try {
          testNotif.close();
        } catch (e) {
          // Already closed
        }
      }, 5000);
    } else {
      console.log('Cannot test notification - permission not granted');
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    requestNotificationPermission();
    loadNotifications();
  }, [requestNotificationPermission, loadNotifications]);

  // Start/stop monitoring based on notifications
  useEffect(() => {
    if (notifications.length > 0) {
      startMonitoring();
    } else {
      stopMonitoring();
    }
  }, [notifications.length, startMonitoring, stopMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const value = {
    notifications,
    saveNotification,
    removeNotification,
    testNotification,
    requestNotificationPermission,
    hasRequestedPermission,
    formatPrice
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};