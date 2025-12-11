import { useRef, useCallback, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';

const WSS_URL = 'wss://api.xrpl.to/ws/sync/';

/**
 * WebSocket hook for token list sync (/ws/sync/)
 * Supports subscription filtering and batched updates
 */
export function useTokenSync({ onTokensUpdate, onMetricsUpdate, onTagsUpdate, enabled = true }) {
  const queueRef = useRef([]);
  const timerRef = useRef(null);

  const processQueue = useCallback(() => {
    if (queueRef.current.length === 0) return;

    const messages = queueRef.current.splice(0, 50);
    const tokens = new Map();
    let metrics = null;
    let tags = null;

    messages.forEach((msg) => {
      if (msg.exch) {
        metrics = { exch: msg.exch, total: msg.total, H24: msg.H24, global: msg.global };
      }
      if (msg.tags) tags = msg.tags;
      msg.tokens?.forEach((t) => tokens.set(t.md5, t));
    });

    if (metrics) onMetricsUpdate?.(metrics);
    if (tags) onTagsUpdate?.(tags);
    if (tokens.size > 0) onTokensUpdate?.(Array.from(tokens.values()));

    if (queueRef.current.length > 0) {
      requestIdleCallback(processQueue, { timeout: 100 });
    }
  }, [onTokensUpdate, onMetricsUpdate, onTagsUpdate]);

  const { sendJsonMessage, readyState } = useWebSocket(enabled ? WSS_URL : null, {
    onMessage: (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'pong') return;
        queueRef.current.push(data);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => requestIdleCallback(processQueue, { timeout: 100 }), 32);
      } catch {}
    },
    shouldReconnect: () => true,
    reconnectAttempts: 10,
    reconnectInterval: (n) => Math.min(3000 * Math.pow(2, n), 60000)
  });

  // Heartbeat
  useEffect(() => {
    if (readyState !== 1) return;
    const id = setInterval(() => sendJsonMessage({ type: 'ping' }), 10000);
    return () => clearInterval(id);
  }, [readyState, sendJsonMessage]);

  useEffect(() => () => { clearTimeout(timerRef.current); queueRef.current = []; }, []);

  return {
    subscribe: (tokens) => sendJsonMessage({ type: 'subscribe', tokens }),
    resync: () => sendJsonMessage({ type: 'resync' })
  };
}

export default useTokenSync;
