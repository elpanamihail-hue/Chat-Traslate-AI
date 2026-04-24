import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface Props {
  uid?: string;
  status?: 'online' | 'offline';
  className?: string;
}

export default function StatusIndicator({ uid, status: initialStatus, className }: Props) {
  const [status, setStatus] = useState<'online' | 'offline'>(initialStatus || 'offline');

  useEffect(() => {
    if (initialStatus) {
      setStatus(initialStatus);
      return;
    }
    if (!uid) return;

    // Fetch initial status from Supabase
    const fetchStatus = async () => {
      const { data } = await supabase
        .from('users')
        .select('status')
        .eq('uid', uid)
        .single();
      
      if (data) setStatus(data.status || 'offline');
    };

    fetchStatus();

    // Subscribe to real-time status changes
    const channel = supabase
      .channel(`status-${uid}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `uid=eq.${uid}` },
        (payload) => {
          if (payload.new && 'status' in payload.new) {
            setStatus(payload.new.status as 'online' | 'offline');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [uid, initialStatus]);

  return (
    <div 
      className={cn(
        "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-w-sidebar transition-all duration-300",
        status === 'online' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" : "bg-gray-400",
        className
      )}
    />
  );
}
