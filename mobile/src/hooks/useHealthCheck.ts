import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/constants/config';

export type HealthStatus = 'checking' | 'ok' | 'error';

export function useHealthCheck() {
  const [status, setStatus] = useState<HealthStatus>('checking');
  const [timestamp, setTimestamp] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function ping() {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
          throw new Error('Health check failed');
        }
        const data = await response.json();
        if (isMounted) {
          setStatus('ok');
          setTimestamp(data.timestamp ?? new Date().toISOString());
        }
      } catch (error) {
        console.warn('Health check error', error);
        if (isMounted) {
          setStatus('error');
          setTimestamp(null);
        }
      }
    }

    ping();
    const interval = setInterval(ping, 30_000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { status, timestamp };
}
