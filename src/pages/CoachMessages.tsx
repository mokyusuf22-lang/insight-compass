import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserHeader } from '@/components/UserHeader';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function CoachMessages() {
  const { userId } = useParams<{ userId: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  // Load assignment and messages
  useEffect(() => {
    const load = async () => {
      if (!user || !userId) return;

      // Find assignment (coach or user side)
      const { data: assignment } = await supabase
        .from('coach_assignments')
        .select('id')
        .or(`coach_id.eq.${user.id},user_id.eq.${user.id}`)
        .or(`coach_id.eq.${userId},user_id.eq.${userId}`)
        .limit(1)
        .maybeSingle();

      if (!assignment) {
        setIsLoading(false);
        return;
      }

      setAssignmentId(assignment.id);

      const { data: msgs } = await supabase
        .from('coach_messages')
        .select('*')
        .eq('assignment_id', assignment.id)
        .order('created_at', { ascending: true });

      setMessages(msgs || []);

      // Mark unread messages as read
      await supabase
        .from('coach_messages')
        .update({ is_read: true })
        .eq('assignment_id', assignment.id)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      setIsLoading(false);
    };
    load();
  }, [user, userId]);

  // Realtime subscription
  useEffect(() => {
    if (!assignmentId) return;

    const channel = supabase
      .channel(`coach-messages-${assignmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'coach_messages',
          filter: `assignment_id=eq.${assignmentId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);

          // Auto-mark as read if we're the recipient
          if (newMsg.sender_id !== user?.id) {
            supabase
              .from('coach_messages')
              .update({ is_read: true })
              .eq('id', newMsg.id);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [assignmentId, user?.id]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !assignmentId || !user) return;
    setSending(true);

    await supabase.from('coach_messages').insert({
      assignment_id: assignmentId,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    setNewMessage('');
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading messages..." />
      </div>
    );
  }

  if (!assignmentId) {
    return (
      <div className="min-h-screen bg-background">
        <UserHeader showHomeLink />
        <main className="container max-w-3xl py-12 px-4 text-center">
          <p className="text-muted-foreground">No coaching assignment found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <UserHeader showHomeLink />
      <main className="flex-1 flex flex-col container max-w-3xl px-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/coach')} className="self-start my-3">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 py-4 min-h-0">
          {messages.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">No messages yet. Start the conversation!</p>
          )}
          {messages.map(msg => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-accent text-accent-foreground rounded-br-sm'
                      : 'bg-secondary text-foreground rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-accent-foreground/60' : 'text-muted-foreground'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border py-3 flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={sending || !newMessage.trim()} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
