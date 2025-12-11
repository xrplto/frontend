import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/router';

const BRIDGE_API_URL = 'https://api.xrpl.to/api/bridge';
const POLL_INTERVAL = 30000; // 30 seconds - lighter than individual page polling
const STORAGE_KEY = 'bridge_pending';

// Get pending exchanges from localStorage
const getPending = () => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch { return {}; }
};

// Save pending exchanges to localStorage
const savePending = (pending) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
};

// Add exchange to tracking
export const trackExchange = (id, data = {}) => {
  const pending = getPending();
  if (!pending[id]) {
    pending[id] = { status: 'waiting', addedAt: Date.now(), ...data };
    savePending(pending);
  }
};

// Remove exchange from tracking
export const untrackExchange = (id) => {
  const pending = getPending();
  delete pending[id];
  savePending(pending);
};

// Send browser notification
const sendNotification = (title, body, onClick) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const n = new Notification(title, { body, icon: '/static/xrp.svg', tag: 'bridge' });
    if (onClick) n.onclick = onClick;
  }
};

export default function BridgeTracker() {
  const router = useRouter();
  const statusRef = useRef({});

  // Request notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const pollExchanges = useCallback(async () => {
    const pending = getPending();
    const ids = Object.keys(pending);
    if (ids.length === 0) return;

    // Skip polling if already on bridge page (that page handles its own polling)
    if (router.pathname.startsWith('/bridge/')) return;

    for (const id of ids) {
      try {
        const res = await fetch(`${BRIDGE_API_URL}/status?id=${id}`);
        if (!res.ok) {
          // Remove if 404 (expired/invalid)
          if (res.status === 404) untrackExchange(id);
          continue;
        }

        const data = await res.json();
        const prevStatus = statusRef.current[id] || pending[id].status;
        const newStatus = data.status;

        // Status changed - notify
        if (prevStatus !== newStatus) {
          statusRef.current[id] = newStatus;
          const amount = data.amountTo || data.expectedAmountTo || '';
          const currency = data.fromCurrency?.toUpperCase() || '';

          if (newStatus === 'finished') {
            toast.success(`Exchange complete! ${amount} XRP received`, {
              action: { label: 'View', onClick: () => router.push(`/bridge/${id}`) }
            });
            sendNotification('Exchange Complete! ✓', `${amount} XRP received`, () => {
              window.focus();
              router.push(`/bridge/${id}`);
            });
            untrackExchange(id);
          } else if (newStatus === 'confirming') {
            toast.info(`${currency} deposit detected`, {
              action: { label: 'View', onClick: () => router.push(`/bridge/${id}`) }
            });
            if (document.hidden) {
              sendNotification('Deposit Detected', `Your ${currency} deposit is being confirmed`);
            }
            pending[id].status = newStatus;
            savePending(pending);
          } else if (newStatus === 'failed') {
            toast.error('Exchange failed', {
              action: { label: 'Details', onClick: () => router.push(`/bridge/${id}`) }
            });
            sendNotification('Exchange Failed', 'Please contact support');
            untrackExchange(id);
          } else if (newStatus === 'refunded') {
            toast.warning('Exchange refunded', {
              action: { label: 'Details', onClick: () => router.push(`/bridge/${id}`) }
            });
            sendNotification('Exchange Refunded', 'Funds returned to sender');
            untrackExchange(id);
          } else if (newStatus === 'expired') {
            untrackExchange(id);
          } else {
            // Update status for other states
            pending[id].status = newStatus;
            savePending(pending);
          }
        }
      } catch (err) {
        // Silently fail - will retry next poll
      }
    }
  }, [router]);

  // Poll on mount and interval
  useEffect(() => {
    pollExchanges();
    const interval = setInterval(pollExchanges, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [pollExchanges]);

  // Also poll when tab becomes visible
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) pollExchanges();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [pollExchanges]);

  return null; // No UI - just background tracking
}
