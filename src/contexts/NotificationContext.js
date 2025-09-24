import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

  // Request notification permission (only on user interaction)
  const requestNotificationPermission = useCallback(() => {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return Promise.resolve('denied');
    }

    if (Notification.permission !== 'default') {
      return Promise.resolve(Notification.permission);
    }

    // Defensive promise/callback handling
    return new Promise((resolve) => {
      const result = Notification.requestPermission((permission) => {
        // Callback version for older browsers
        setHasRequestedPermission(true);
        resolve(permission);
      });

      // Promise version for modern browsers
      if (result && typeof result.then === 'function') {
        result.then((permission) => {
          setHasRequestedPermission(true);
          resolve(permission);
        }).catch(() => {
          setHasRequestedPermission(true);
          resolve('denied');
        });
      }
    });
  }, []);

  // Load all notifications from localStorage
  const loadNotifications = useCallback(() => {
    try {
      const saved = localStorage.getItem('priceNotifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        const activeNotifications = parsed.filter(n => !n.triggered);
        setNotifications(activeNotifications);
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

          // Check each notification for this token
          tokenNotifications.forEach(notification => {
            const shouldTrigger =
              (notification.alertType === 'above' && currentPrice >= notification.targetPrice) ||
              (notification.alertType === 'below' && currentPrice <= notification.targetPrice);

            if (shouldTrigger) {
              triggered.push({ ...notification, currentPrice });

              // Show browser notification
              if ('Notification' in window && Notification.permission === 'granted') {
                try {
                  const symbol = notification.tokenSymbol || notification.tokenName;
                  const formattedPrice = formatPrice(currentPrice, currency);
                  const targetPrice = formatPrice(notification.targetPrice, currency);

                  const browserNotification = new Notification(`🔔 ${symbol} Price Alert`, {
                    body: `Price ${notification.alertType} ${targetPrice}\nCurrent: ${formattedPrice}`,
                    icon: '/icons/icon-192x192.png',
                    tag: `price-alert-${notification.id}`,
                    requireInteraction: false,
                    silent: false
                  });

                  // Auto-close after 15 seconds
                  setTimeout(() => {
                    try {
                      browserNotification.close();
                    } catch (e) {
                      // Already closed
                    }
                  }, 15000);
                } catch (e) {
                  console.error('Error creating notification:', e);
                }
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
        }
      } catch (e) {
        console.error('Error updating triggered notifications:', e);
      }
    }
  }, [notifications, BASE_URL, formatPrice, loadNotifications]);

  // Start price monitoring
  const startMonitoring = useCallback(() => {
    if (intervalRef.current) return; // Already running

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
    }
  }, []);

  // Test notification
  const testNotification = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('Notifications not supported in this browser');
      return;
    }

    if (Notification.permission === 'granted') {
      try {
        const testNotif = new Notification('🔔 Test Notification', {
          body: 'Price notifications are working correctly!',
          icon: '/icons/icon-192x192.png',
          tag: 'test-notification',
          requireInteraction: false
        });

        setTimeout(() => {
          try {
            testNotif.close();
          } catch (e) {
            // Already closed
          }
        }, 5000);
      } catch (e) {
        console.error('Error creating test notification:', e);
      }
    } else {
      // Request permission first
      try {
        const permission = await requestNotificationPermission();
        if (permission === 'granted') {
          // Retry test notification after permission granted
          const testNotif = new Notification('🔔 Test Notification', {
            body: 'Price notifications are working correctly!',
            icon: '/icons/icon-192x192.png',
            tag: 'test-notification',
            requireInteraction: false
          });

          setTimeout(() => {
            try {
              testNotif.close();
            } catch (e) {
              // Already closed
            }
          }, 5000);
        }
      } catch (e) {
        console.error('Error requesting permission or creating notification:', e);
      }
    }
  }, [requestNotificationPermission]);

  // Initialize on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

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

  const value = useMemo(() => ({
    notifications,
    saveNotification,
    removeNotification,
    testNotification,
    requestNotificationPermission,
    hasRequestedPermission,
    formatPrice
  }), [notifications, saveNotification, removeNotification, testNotification, requestNotificationPermission, hasRequestedPermission, formatPrice]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};