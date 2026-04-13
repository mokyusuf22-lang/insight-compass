import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, User } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  coach_id: string;
  user_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000 && d.getDate() === now.getDate()) return 'Today';
  if (diff < 172800000) return 'Yesterday';
  return d.toLocaleDateString();
}

export default function MyCoach() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [coachId, setCoachId] = useState<string | null>(null);
  const [coachProfile, setCoachProfile] = useState<{ display_name: string | null; bio: string | null } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const { data: assignment } = await supabase
        .from('coach_assignments')
        .select('coach_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (!assignment) {
        setIsLoading(false);
        return;
      }

      setCoachId(assignment.coach_id);

      // Use 'as any' to work around stale generated types
      const [profileRes, messagesRes] = await Promise.all([
        supabase.from('coach_profiles').select('*').eq('user_id', assignment.coach_id).maybeSingle(),
        supabase.from('coach_messages').select('*').eq('coach_id' as any, assignment.coach_id).eq('user_id' as any, user.id).order('created_at', { ascending: true }),
      ]);

      if (profileRes.data) {
        const cp = profileRes.data as any;
        setCoachProfile({ display_name: cp.display_name || null, bio: cp.bio || null });
      }
      if (messagesRes.data) setMessages(messagesRes.data as unknown as Message[]);

      // Mark coach's messages as read
      await supabase
        .from('coach_messages')
        .update({ is_read: true })
        .eq('coach_id' as any, assignment.coach_id)
        .eq('user_id' as any, user.id)
        .eq('sender_id', assignment.coach_id)
        .eq('is_read', false);

      setIsLoading(false);
    };

    if (!loading && user) load();
  }, [user, loading]);

  // Realtime
  useEffect(() => {
    if (!user || !coachId) return;

    const channel = supabase
      .channel(`my-coach-messages`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'coach_messages',
      }, (payload) => {
        const msg = payload.new as Message;
        if (msg.coach_id === coachId && msg.user_id === user.id) {
          setMessages(prev => [...prev, msg]);
          if (msg.sender_id !== user.id) {
            supabase.from('coach_messages').update({ is_read: true }).eq('id', msg.id);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, coachId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !coachId || sending) return;
    setSending(true);

    const { error } = await supabase.from('coach_messages').insert({
      coach_id: coachId,
      user_id: user.id,
      sender_id: user.id,
      content: newMessage.trim(),
    } as any);

    if (!error) setNewMessage('');
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading || isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><LoadingSpinner size="lg" /></div>;

  if (!coachId) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50">
          <div className="container max-w-3xl py-4 px-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/welcome')}><ArrowLeft className="w-4 h-4" /></Button>
            <h1 className="text-lg font-serif font-semibold">My Coach</h1>
          </div>
        </header>
        <main className="container max-w-3xl py-16 px-4 text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-semibold mb-2">No Coach Assigned Yet</h2>
          <p className="text-muted-foreground mb-6">You'll be notified when a coach is assigned to guide your journey.</p>
          <Button variant="outline" onClick={() => navigate('/welcome')}>Back to Dashboard</Button>
        </main>
      </div>
    );
  }

  const grouped: { date: string; msgs: Message[] }[] = [];
  messages.forEach(msg => {
    const dateLabel = formatDate(msg.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.date === dateLabel) last.msgs.push(msg);
    else grouped.push({ date: dateLabel, msgs: [msg] });
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50">
        <div className="container max-w-3xl py-4 px-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/welcome')}><ArrowLeft className="w-4 h-4" /></Button>
          <h1 className="text-lg font-serif font-semibold">{coachProfile?.display_name || 'My Coach'}</h1>
        </div>
      </header>

      {messages.length === 0 && coachProfile?.bio && (
        <div className="container max-w-3xl px-4 py-6">
          <div className="chamfer bg-card border border-border p-6 text-center">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-serif font-semibold mb-2">{coachProfile.display_name}</h3>
            <p className="text-sm text-muted-foreground">{coachProfile.bio}</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-3xl py-4 px-4 space-y-4">
          {grouped.map((group, gi) => (
            <div key={gi}>
              <div className="text-center my-4">
                <span className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full">{group.date}</span>
              </div>
              {group.msgs.map(msg => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex mb-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${isMine ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border rounded-bl-sm'}`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-border bg-card/50 p-4">
        <div className="container max-w-3xl flex gap-2">
          <Textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type a message..." rows={1} className="resize-none min-h-[44px]" />
          <Button onClick={handleSend} disabled={!newMessage.trim() || sending} size="icon"><Send className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
}
