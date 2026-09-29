import { KeyboardEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import type { CoachMessage } from '@/hooks/useCoachThread';

interface MessageThreadProps {
  messages: CoachMessage[];
  myId: string;
  sending: boolean;
  onSend: (content: string) => Promise<boolean>;
  placeholder: string;
  emptyHint: string;
  /** Shown above the messages while the thread is empty (e.g. the coach's bio). */
  intro?: ReactNode;
}

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

/** Chat body + composer shared by the coach and client message pages. */
export function MessageThread({ messages, myId, sending, onSend, placeholder, emptyHint, intro }: MessageThreadProps) {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = draft;
    if (!text.trim()) return;
    setDraft('');
    const ok = await onSend(text);
    if (!ok) {
      setDraft(text);
      toast.error('Message not sent. Please try again.');
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const grouped = messages.reduce<Record<string, CoachMessage[]>>((acc, msg) => {
    const key = formatDate(msg.created_at);
    (acc[key] ||= []).push(msg);
    return acc;
  }, {});

  return (
    <>
      {intro && messages.length === 0 && <div className="px-4 pt-6 pb-2 max-w-3xl mx-auto w-full">{intro}</div>}

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-3xl mx-auto w-full" aria-live="polite">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs text-muted-foreground">{emptyHint}</p>
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
                const isMe = msg.sender_id === myId;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
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
          <label htmlFor="thread-draft" className="sr-only">Message</label>
          <Textarea
            id="thread-draft"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            maxLength={4000}
            className="min-h-[44px] max-h-32 resize-none rounded-2xl text-sm"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            size="icon"
            aria-label="Send message"
            className="w-11 h-11 rounded-full bg-accent hover:bg-accent/90 text-white shadow-accent flex-shrink-0"
          >
            {sending ? <LoadingSpinner size="sm" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">Enter to send · Shift+Enter for new line</p>
      </div>
    </>
  );
}
