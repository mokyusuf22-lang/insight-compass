import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { UserHeader } from '@/components/UserHeader';
import { ArrowLeft, MessageSquare, Send, User } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface CoachInfo {
  coachId: string;
  displayName: string;
  bio: string | null;
}

export default function MyCoach() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [coachInfo, setCoachInfo] = useState<CoachInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const { data: assignment } = await supabase
        .from('coach_assignments' as any)
        .select('coach_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!assignment) {
        setLoading(false);
        return;
      }

      const coachId = (assignment as any).coach_id;

      const { data: coachProfile } = await supabase
        .from('coach_profiles' as any)
        .select('display_name, bio')
        .eq('user_id', coachId)
        .maybeSingle();

      setCoachInfo({
        coachId,
        displayName: (coachProfile as any)?.display_name || 'Your Coach',
        bio: (coachProfile as any)?.bio || null,
      });

      const { data: msgs } = await supabase
        .from('coach_messages' as any)
        .select('id, sender_id, content, created_at')
        .eq('coach_id', coachId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      setMessages((msgs as unknown as Message[]) || []);

      await supabase
        .from('coach_messages' as any)
        .update({ is_read: true } as any)
        .eq('coach_id', coachId)
        .eq('user_id', user.id)
        .eq('sender_id', coachId);

      setLoading(false);
    };

    if (!authLoading && user) load();
  }, [user, authLoading]);

  useEffect(() => {
    if (!user || !coachInfo) return;

    const channel = supabase
      .channel(`my_coach_messages:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'coach_messages',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, coachInfo]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!draft.trim() || !user || !coachInfo) return;
    setSending(true);
    try {
      const { error } = await supabase
        .from('coach_messages' as any)
        .insert({
          coach_id: coachInfo.coachId,
          user_id: user.id,
          sender_id: user.id,
          content: draft.trim(),
        } as any);

      if (error) throw error;
      setDraft('');
    } catch {
      toast.error('Failed to send message. Please try again.');
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

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!coachInfo) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <UserHeader showHomeLink />
        <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div className="w-16 h-16 chamfer bg-secondary flex items-center justify-center mb-5">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-serif font-semibold mb-3">No Coach Assigned Yet</h1>
          <p className="text-muted-foreground max-w-sm mb-6 leading-relaxed">
            You don't have a coach assigned yet. Complete your Aura onboarding and our team will
            match you with the ideal coach for your journey.
          </p>
          <Button onClick={() => navigate('/welcome')} variant="outline" className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/welcome')}
          className="rounded-full flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="w-9 h-9 chamfer-sm bg-accent/15 flex items-center justify-center flex-shrink-0 font-semibold text-sm text-accent">
          {coachInfo.displayName[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{coachInfo.displayName}</p>
          <p className="text-xs text-muted-foreground">Your Coach</p>
        </div>

        <div className="flex-shrink-0">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
        </div>
      </header>

      {coachInfo.bio && messages.length === 0 && (
        <div className="px-4 pt-6 pb-2 max-w-3xl mx-auto w-full">
          <div className="bg-secondary/40 border border-border/60 rounded-2xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">About your coach</p>
            <p className="text-sm text-foreground leading-relaxed">{coachInfo.bio}</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-3xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs text-muted-foreground">
              Send a message to start your coaching conversation.
            </p>
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
                const isMe = msg.sender_id === user!.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isMe
                          ? 'bg-accent text-white rounded-br-sm'
                          : 'bg-card border border-border/70 text-foreground rounded-bl-sm'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className={`text-[11px] mt-1 ${isMe ? 'text-white/60' : 'text-muted-foreground'}`}>
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
            placeholder={`Message ${coachInfo.displayName}… (Enter to send)`}
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
