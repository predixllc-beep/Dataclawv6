import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface Signal {
  id: string;
  source: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  confidence: number;
  timestamp: string;
}

export function useRealtimeSignals() {
  const [signals, setSignals] = useState<Signal[]>([]);

  useEffect(() => {
    // Initial fetch from DB
    const fetchInitial = async () => {
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20);
      
      if (!error && data) {
        setSignals(data as Signal[]);
      }
    };
    
    fetchInitial();

    // Supabase realtime subscription
    const channel = supabase
      .channel('public:signals')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'signals' },
        (payload) => {
          setSignals((current) => [payload.new as Signal, ...current].slice(0, 50));
        }
      )
      .subscribe();

    // Onyx Research: Direct Server-Sent Events (SSE) bridge for 0-latency simulation
    const sse = new EventSource('/api/stream');
    sse.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'signal') {
          setSignals((current) => [{
            id: `sse-${Date.now()}`,
            source: payload.source,
            symbol: 'BTC/USDT',
            direction: payload.direction,
            confidence: payload.confidence,
            timestamp: payload.timestamp
          }, ...current].slice(0, 50));
        }
      } catch (e) {
        console.error("SSE parsing error", e);
      }
    };

    return () => {
      supabase.removeChannel(channel);
      sse.close();
    };
  }, []);

  return signals;
}
