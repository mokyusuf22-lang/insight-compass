import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { ArrowLeft, Send, User } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  coach_id: string;
  user_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export default function CoachMessages() {
  const { userId } = useParams<{ userId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [clientEmail, setClientEmail] = useState('');
  const [notFound, setNotFound] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user || !userId) return;

      const { data: assignment } = await supabase
        .from('coach_assignments' as any)
        .select('id')
        .eq('coach_id', user.id)
        .eq('user_id', userId)
        .maybeSingle();

      const { data: myRoles } = await supabase.rpc('get_my_roles');
      const isAdmin = myRoles?.some((r) => r.role === 'admin') ?? false;

      if (!assignment && !isAdmin) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', userId)
        .maybeSingle();

      setClientEmail(profile?.email || userId);

      await loadMessages();
      setLoading(false);

      await supabase
        .from('coach_messages' as any)
        .update({ is_read: true } as any)
        .eq('coach_id', user.id)
        .eq('user_id', userId)
        .eq('sender_id', userId);
    };

    if (!authLoading && user) load();
  }, [user, authLoading, userId]);

  const loadMessages = async () => {
    if (!user || !userId) return;

    const { data, error } = await supabase
      .from('coach_messages' as any)
      .select('id, coach_id, user_id, sender_id, content, created_at, is_read')
      .eq('coach_id', user.id)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[CoachMessages] loadMessages error:', error);
    } else if (data) {
      setMessages(data as unknown as Message[]);
    }
  };

  useEffect(() => {
    if (!user || !userId) return;

    const channel = supabase
      .channel(`coach_messages:${user.id}:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'coach_messages',
          filter: `coach_id=eq.${user.id}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.user_id === userId || msg.coach_id === user.id) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!draft.trim() || !user || !userId) return;
    setSending(true);

    try {
      const { error } = await supabase
        .from('coach_messages' as any)
        .insert({
          coach_id: user.id,
          user_id: userId,
          sender_id: user.id,
          content: draft.trim(),
        } as any);

      if (error) throw error;
      setDraft('');
      await loadMessages();
    } catch (err: any) {
      console.error('[CoachMessages] send error:', err);
      toast.error(`Send failed: ${err?.message || err?.details || 'unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background flex-col gap-4">
        <p className="text-muted-foreground">Client not found or access denied.</p>
        <Button onClick={() => navigate('/coach')} variant="outline">Back to Dashboard</Button>
      </div>
    );
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const grouped = messages.reduce<Record<string, Message[]>>((acc, msg) => {
    const key = formatDate(msg.created_at);
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/coach/user/${userId}`)}
          className="rounded-full flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="w-9 h-9 chamfer-sm bg-secondary flex items-center justify-center flex-shrink-0 font-semibold text-sm">
          {(clientEmail || '?')[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{clientEmail}</p>
          <p className="text-xs text-muted-foreground">Client</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <User className="w-8 h-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs text-muted-foreground">Start the conversation below.</p>
          </div>
        )}

        {Object.entries(grouped).map(([date, msgs]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-xs text-muted-foreground font-medium">{date}</span>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            <div className="space-y-3">
              {msgs.map((msg) => {
                const isCoach = msg.sender_id === user!.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isCoach ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isCoach
                          ? 'bg-accent text-white rounded-br-sm'
                          : 'bg-card border border-border/70 text-foreground rounded-bl-sm'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className={`text-[11px] mt-1 ${isCoach ? 'text-white/60' : 'text-muted-foreground'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border bg-background px-4 py-3">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message your client… (Enter to send)"
            className="min-h-[44px] max-h-32 resize-none rounded-2xl text-sm"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            size="icon"
            className="w-11 h-11 rounded-full bg-accent hover:bg-accent/90 text-white shadow-accent flex-shrink-0"
          >
            {sending ? <LoadingSpinner size="sm" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
