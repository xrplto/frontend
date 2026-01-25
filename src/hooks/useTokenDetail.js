import { useRef, useCallback, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';

/**
 * WebSocket hook for single token updates (/ws/token/{md5})
 * Supports field filtering and delta mode
 *
 * Field presets: ticker (6), price (10), trading (20), full (71), all (~106)
 */
export function useTokenDetail({
  md5,
  onTokenUpdate,
  onMetricsUpdate,
  fields = 'trading',
  delta = true,
  enabled = true
}) {
  const rafRef = useRef(null);
  const connectTimeRef = useRef(null);
  const connectCountRef = useRef(0);

  const wsUrl =
    enabled && md5 ? `wss://api.xrpl.to/ws/token/${md5}?fields=${fields}&delta=${delta}` : null;

  const processMessage = useCallback(
    (data) => {
      if (data.exch) {
        onMetricsUpdate?.({
          exch: data.exch,
          total: data.total,
          H24: data.H24,
          global: data.global
        });
      }
      if (data.token) {
        onTokenUpdate?.(data.token, data.delta || false);
      }
    },
    [onTokenUpdate, onMetricsUpdate]
  );

  // Log connection start
  useEffect(() => {
    if (wsUrl) {
      connectTimeRef.current = performance.now();
      console.log('[TokenDetail WS] Connecting:', wsUrl);
    }
  }, [wsUrl]);

  const { sendJsonMessage, readyState } = useWebSocket(wsUrl, {
    onOpen: () => {
      connectCountRef.current++;
      const elapsed = connectTimeRef.current ? (performance.now() - connectTimeRef.current).toFixed(0) : '?';
      console.log(`[TokenDetail WS] Connected #${connectCountRef.current} in ${elapsed}ms`);
    },
    onReconnectStop: () => console.log('[TokenDetail WS] Reconnect stopped (max attempts)'),
    onMessage: (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'pong') return;

        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => processMessage(data));
      } catch {}
    },
    onClose: (event) => {
      console.log(`[TokenDetail WS] Closed code=${event.code} reason="${event.reason}"`);
      if (event.code === 4011) {
        console.warn('[TokenDetail WS] Connection limit reached - will not reconnect');
      }
    },
    onError: (e) => console.error('[TokenDetail WS] Error:', e?.message || e),
    // Don't reconnect on: 4011=max connections, 4020/4021=custom auth errors
    shouldReconnect: (e) => ![4011, 4020, 4021].includes(e.code),
    reconnectAttempts: 10,
    reconnectInterval: (n) => Math.min(3000 * Math.pow(2, n), 60000),
    share: true
  });

  // Heartbeat
  useEffect(() => {
    if (readyState !== 1) return;
    const id = setInterval(() => sendJsonMessage({ type: 'ping' }), 10000);
    return () => clearInterval(id);
  }, [readyState, sendJsonMessage]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return {
    setFields: (f) => sendJsonMessage({ type: 'setFields', fields: f }),
    setDelta: (d) => sendJsonMessage({ type: 'setDelta', enabled: d }),
    resync: () => sendJsonMessage({ type: 'resync' })
  };
}

export default useTokenDetail;
