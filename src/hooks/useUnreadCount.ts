import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Unread coach messages addressed to the signed-in user, across all their threads.
 * RLS limits coach_messages to threads the user is part of, so this works for
 * clients and coaches alike. Stays live via realtime.
 */
export function useUnreadCount(userId: string | undefined) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!userId) { setCount(0); return; }
    const { count: n, error } = await supabase
      .from('coach_messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)
      .neq('sender_id', userId);
    if (!error) setCount(n ?? 0);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    refresh();
    const channel = supabase
      .channel(`unread:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coach_messages' }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, refresh]);

  return count;
}
