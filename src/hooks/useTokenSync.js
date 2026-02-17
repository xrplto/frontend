import { useRef, useCallback, useEffect, useState } from 'react';
import useWebSocket from 'react-use-websocket';

/**
 * WebSocket hook for token list sync (/ws/sync/)
 * Supports subscription filtering and batched updates
 */
export function useTokenSync({ onTokensUpdate, onMetricsUpdate, onTagsUpdate, enabled = true }) {
  const [wsUrl, setWsUrl] = useState(null);
  const apiKeyRef = useRef(null);
  const queueRef = useRef([]);
  const timerRef = useRef(null);
  const [ready, setReady] = useState(false);

  // Wait for user interaction or 10s before connecting WebSocket
  useEffect(() => {
    if (!enabled) return;
    const activate = () => { setReady(true); cleanup(); };
    const events = ['scroll', 'mousemove', 'keydown', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, activate, { once: true, passive: true }));
    const timer = setTimeout(activate, 10000);
    const cleanup = () => {
      events.forEach(e => window.removeEventListener(e, activate));
      clearTimeout(timer);
    };
    return cleanup;
  }, [enabled]);

  // Fetch WebSocket URL and API key after ready
  useEffect(() => {
    if (!ready) { setWsUrl(null); return; }
    fetch('/api/ws/session?type=sync')
      .then(r => r.json())
      .then(d => { apiKeyRef.current = d.apiKey; setWsUrl(d.wsUrl); })
      .catch(() => setWsUrl(null));
  }, [ready]);

  const processQueue = useCallback(() => {
    if (queueRef.current.length === 0) return;

    const messages = queueRef.current.splice(0, 50);
    const tokens = new Map();
    let metrics = null;
    let tags = null;

    messages.forEach((msg) => {
      if (msg.exch) {
        metrics = {
          exch: msg.exch,
          total: msg.total,
          H24: msg.H24,
          global: msg.global,
          tokenCreation: msg.tokenCreation
        };
      }
      if (msg.tags) tags = msg.tags;
      msg.tokens?.forEach((t) => tokens.set(t.md5, t));
    });

    if (metrics) onMetricsUpdate?.(metrics);
    if (tags) onTagsUpdate?.(tags);
    if (tokens.size > 0) onTokensUpdate?.(Array.from(tokens.values()));

    if (queueRef.current.length > 0) {
      typeof requestIdleCallback === 'function' ? requestIdleCallback(processQueue, { timeout: 100 }) : setTimeout(processQueue, 100);
    }
  }, [onTokensUpdate, onMetricsUpdate, onTagsUpdate]);

  const { sendJsonMessage, readyState } = useWebSocket(wsUrl, {
    onOpen: () => {
      if (apiKeyRef.current) sendJsonMessage({ type: 'auth', apiKey: apiKeyRef.current });
    },
    onMessage: (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'pong') return;
        queueRef.current.push(data);
        // Schedule flush once per batch window; don't reset timer on each message
        if (!timerRef.current) {
          timerRef.current = setTimeout(() => {
            timerRef.current = null;
            typeof requestIdleCallback === 'function' ? requestIdleCallback(processQueue, { timeout: 100 }) : setTimeout(processQueue, 0);
          }, 32);
        }
      } catch {}
    },
    shouldReconnect: () => true,
    reconnectAttempts: 5,
    reconnectInterval: (n) => Math.min(3000 * Math.pow(2, n), 60000)
  });

  // Heartbeat
  useEffect(() => {
    if (readyState !== 1) return;
    const id = setInterval(() => sendJsonMessage({ type: 'ping' }), 10000);
    return () => clearInterval(id);
  }, [readyState, sendJsonMessage]);

  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      queueRef.current = [];
    },
    []
  );

  return {
    subscribe: (tokens) => sendJsonMessage({ type: 'subscribe', tokens }),
    resync: () => sendJsonMessage({ type: 'resync' })
  };
}

export default useTokenSync;
