import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MessageSquare, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { UserHeader } from '@/components/UserHeader';
import { MessageThread } from '@/components/coaching/MessageThread';
import { useCoachThread } from '@/hooks/useCoachThread';
import { findMyCoachAssignment, getCoachDisplayName } from '@/lib/coaching';

interface CoachInfo {
  assignmentId: string;
  displayName: string;
  bio: string | null;
}

export default function MyCoach() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [coach, setCoach] = useState<CoachInfo | null>(null);
  const [queued, setQueued] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth', { state: { from: '/my-coach' } });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const assignment = await findMyCoachAssignment(user.id);
      if (assignment) {
        const { displayName, bio } = await getCoachDisplayName(assignment.coach_id);
        setCoach({ assignmentId: assignment.id, displayName, bio });
      } else {
        const { data: request } = await supabase
          .from('coach_requests')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle();
        setQueued(request?.status === 'open');
      }
      setChecking(false);
    };
    if (!authLoading && user) load();
  }, [user, authLoading]);

  const { messages, loading, sending, send } = useCoachThread(coach?.assignmentId ?? null, user?.id);

  if (authLoading || checking || (coach && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!coach || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <UserHeader showHomeLink />
        <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div className="w-16 h-16 chamfer bg-secondary flex items-center justify-center mb-5">
            {queued ? <Clock className="w-8 h-8 text-muted-foreground" /> : <User className="w-8 h-8 text-muted-foreground" />}
          </div>
          <h1 className="text-2xl font-serif font-semibold mb-3">
            {queued ? 'We’re finding your coach' : 'No coach yet'}
          </h1>
          <p className="text-muted-foreground max-w-sm mb-6 leading-relaxed">
            {queued
              ? 'All our coaches are fully booked right now. You’re in the queue and your coach will message you here as soon as you’re matched.'
              : 'Choose “With a human coach” when you commit to a path with Aura and we’ll match you with one.'}
          </p>
          <Button onClick={() => navigate(queued ? '/welcome' : '/aura')} variant="outline" className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {queued ? 'Back to dashboard' : 'Go to Aura'}
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
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-9 h-9 chamfer-sm bg-accent/15 flex items-center justify-center flex-shrink-0 font-semibold text-sm text-accent">
          {coach.displayName[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{coach.displayName}</p>
          <p className="text-xs text-muted-foreground">Your coach</p>
        </div>
        <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden />
      </header>

      <MessageThread
        messages={messages}
        myId={user.id}
        sending={sending}
        onSend={send}
        placeholder={`Message ${coach.displayName}… (Enter to send)`}
        emptyHint="Say hello to start your coaching conversation."
        intro={coach.bio && (
          <div className="bg-secondary/40 border border-border/60 rounded-2xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">About your coach</p>
            <p className="text-sm text-foreground leading-relaxed">{coach.bio}</p>
          </div>
        )}
      />
    </div>
  );
}
