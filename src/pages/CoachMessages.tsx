import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send } from 'lucide-react';

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

export default function CoachMessages() {
  const { userId } = useParams<{ userId: string }>();
  const { user, isCoach, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
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
      if (!user || !userId) return;

      const { data } = await (supabase
        .from('coach_messages')
        .select('*') as any)
        .eq('coach_id', user.id)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (data) setMessages(data as unknown as Message[]);

      await (supabase
        .from('coach_messages')
        .update({ is_read: true }) as any)
        .eq('coach_id', user.id)
        .eq('user_id', userId)
        .eq('sender_id', userId)
        .eq('is_read', false);

      setIsLoading(false);
    };

    if (!loading && user) load();
  }, [user, userId, loading]);

  useEffect(() => {
    if (!user || !userId) return;

    const channel = supabase
      .channel(`coach-messages-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'coach_messages',
      }, (payload) => {
        const msg = payload.new as Message;
        if (msg.coach_id === user.id && msg.user_id === userId) {
          setMessages(prev => [...prev, msg]);
          if (msg.sender_id !== user.id) {
            supabase.from('coach_messages').update({ is_read: true }).eq('id', msg.id);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !userId || sending) return;
    setSending(true);

    const { error } = await supabase.from('coach_messages').insert({
      coach_id: user.id,
      user_id: userId,
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/coach')}><ArrowLeft className="w-4 h-4" /></Button>
          <h1 className="text-lg font-serif font-semibold">Messages</h1>
        </div>
      </header>

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
