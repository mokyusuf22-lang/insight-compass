import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type CoachMessage = Tables<'coach_messages'>;

/**
 * One coach ↔ client conversation (a coach_assignments row).
 * Loads history, streams new messages over realtime, de-duplicates by id and
 * marks the other person's messages read while the thread is on screen.
 */
export function useCoachThread(assignmentId: string | null, myId: string | undefined) {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const upsert = useCallback((incoming: CoachMessage[]) => {
    setMessages((prev) => {
      const byId = new Map(prev.map((m) => [m.id, m]));
      incoming.forEach((m) => byId.set(m.id, m));
      return [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
    });
  }, []);

  const markRead = useCallback(async () => {
    if (!assignmentId || !myId || document.visibilityState !== 'visible') return;
    await supabase
      .from('coach_messages')
      .update({ is_read: true })
      .eq('assignment_id', assignmentId)
      .neq('sender_id', myId)
      .eq('is_read', false);
  }, [assignmentId, myId]);

  useEffect(() => {
    if (!assignmentId || !myId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setMessages([]);

    supabase
      .from('coach_messages')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error('Error loading messages:', error);
        upsert(data ?? []);
        setLoading(false);
        markRead();
      });

    const channel = supabase
      .channel(`coach_thread:${assignmentId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'coach_messages', filter: `assignment_id=eq.${assignmentId}` },
        (payload) => {
          const msg = payload.new as CoachMessage;
          upsert([msg]);
          if (msg.sender_id !== myId) markRead();
        },
      )
      .subscribe();

    const onVisible = () => markRead();
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [assignmentId, myId, upsert, markRead]);

  /** Returns true on success. */
  const send = useCallback(async (content: string) => {
    const text = content.trim();
    if (!text || !assignmentId || !myId) return false;
    setSending(true);
    try {
      const { data, error } = await supabase
        .from('coach_messages')
        .insert({ assignment_id: assignmentId, sender_id: myId, content: text.slice(0, 4000) })
        .select()
        .single();
      if (error) throw error;
      upsert([data]);
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      return false;
    } finally {
      setSending(false);
    }
  }, [assignmentId, myId, upsert]);

  return { messages, loading, sending, send };
}

/** Posts a one-off message into a thread (e.g. "your path was updated"). */
export async function postCoachMessage(assignmentId: string, senderId: string, content: string) {
  const { error } = await supabase
    .from('coach_messages')
    .insert({ assignment_id: assignmentId, sender_id: senderId, content });
  if (error) console.error('Error posting message:', error);
}
