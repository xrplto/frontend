import { useRef, useCallback, useEffect, useState } from 'react';
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
  const batchRef = useRef(null);
  const batchTimerRef = useRef(null);
  const connectTimeRef = useRef(null);
  const connectCountRef = useRef(0);
  const paramsRef = useRef({ md5, fields, delta, enabled });
  paramsRef.current = { md5, fields, delta, enabled };

  const getWsUrl = useCallback(async () => {
    const { md5: id, fields: f, delta: d, enabled: e } = paramsRef.current;
    if (!e || !id) return null;
    const { getSessionWsUrl } = await import('src/utils/wsToken');
    return getSessionWsUrl('token', id, { fields: f, delta: d });
  }, []);

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

  const { sendJsonMessage, readyState } = useWebSocket(enabled && md5 ? getWsUrl : null, {
    onOpen: () => {
      connectCountRef.current++;
    },
    onReconnectStop: () => {},
    onMessage: (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'pong') return;

        // Batch: keep latest data, flush once per frame via debounced RAF
        batchRef.current = data;
        if (!batchTimerRef.current) {
          batchTimerRef.current = requestAnimationFrame(() => {
            batchTimerRef.current = null;
            if (batchRef.current) processMessage(batchRef.current);
          });
        }
      } catch {}
    },
    onClose: (event) => {
      if (event.code === 4011) {
        console.warn('[TokenDetail WS] Connection limit reached - will not reconnect');
      }
    },
    onError: () => {},
    // Don't reconnect on: 4011=max connections, 4020/4021=custom auth errors
    shouldReconnect: (e) => ![4011, 4020, 4021].includes(e.code),
    reconnectAttempts: 5,
    reconnectInterval: (n) => Math.min(3000 * Math.pow(2, n), 60000),
    share: true
  });

  // Heartbeat
  useEffect(() => {
    if (readyState !== 1) return;
    const id = setInterval(() => sendJsonMessage({ type: 'ping' }), 10000);
    return () => clearInterval(id);
  }, [readyState, sendJsonMessage]);

  useEffect(() => () => {
    cancelAnimationFrame(batchTimerRef.current);
    batchRef.current = null;
  }, []);

  return {
    setFields: (f) => sendJsonMessage({ type: 'setFields', fields: f }),
    setDelta: (d) => sendJsonMessage({ type: 'setDelta', enabled: d }),
    resync: () => sendJsonMessage({ type: 'resync' })
  };
}

export default useTokenDetail;
