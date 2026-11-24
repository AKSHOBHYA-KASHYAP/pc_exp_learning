import { useEffect, useRef, useState, useCallback } from 'react';
import { WS_BASE_URL } from '../services/api';
import { ExperimentResponse } from '../types';

export interface WebSocketEvent {
  type: 'status' | 'completed' | 'failed' | 'cancelled' | 'initial_state';
  status: string;
  message?: string;
  config?: any;
  data?: ExperimentResponse;
  error?: string;
}

export function useExperimentWebSocket(experimentId: string | null) {
  const [status, setStatus] = useState<string>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [data, setData] = useState<ExperimentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, msg]);
  }, []);

  useEffect(() => {
    if (!experimentId) {
      setStatus('idle');
      return;
    }

    const wsUrl = `${WS_BASE_URL}/ws/experiments/${experimentId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      addLog(`[WebSocket] Connected to live execution stream for ${experimentId}`);
    };

    ws.onmessage = (event) => {
      try {
        const payload: WebSocketEvent = JSON.parse(event.data);
        setStatus(payload.status);

        if (payload.message) {
          addLog(`[${payload.status.toUpperCase()}] ${payload.message}`);
        }

        if (payload.type === 'completed' && payload.data) {
          setData(payload.data);
          addLog(
            `[COMPLETED] Real execution finished: Speedup ${payload.data.speedup?.toFixed(2)}x, Efficiency ${payload.data.efficiency?.toFixed(1)}%`
          );
        } else if (payload.type === 'failed') {
          setError(payload.error || 'Execution failed');
          addLog(`[ERROR] ${payload.error || 'Execution failed'}`);
        } else if (payload.type === 'cancelled') {
          addLog(`[CANCELLED] ${payload.message || 'Execution cancelled'}`);
        } else if (payload.type === 'initial_state' && payload.data) {
          setData(payload.data);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = (e) => {
      console.warn('WebSocket stream connection warning (backend might be offline or starting):', e);
    };

    ws.onclose = () => {
      addLog(`[WebSocket] Stream closed for ${experimentId}`);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [experimentId, addLog]);

  return { status, logs, data, error, addLog };
}
