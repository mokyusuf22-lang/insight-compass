import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { UserHeader } from '@/components/UserHeader';
import { MessageThread } from '@/components/coaching/MessageThread';
import { useCoachThread } from '@/hooks/useCoachThread';
import { findMyCoachAssignment, getCoachDisplayName } from '@/lib/coaching';
import { CoachCard } from '@/components/coaching/CoachCard';
import { PRIMARY_COACH } from '@/lib/coachProfile';

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
  const [connecting, setConnecting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth', { state: { from: '/my-coach' } });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const assignment = await findMyCoachAssignment(user.id);
      if (assignment) {
        const { displayName, bio } = await getCoachDisplayName(assignment.coach_id);
        // The DB may not have the coach's name/bio filled in yet; fall back to the profile copy.
        setCoach({
          assignmentId: assignment.id,
          displayName: displayName === 'Your coach' ? PRIMARY_COACH.name : displayName,
          bio,
        });
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
  }, [user, authLoading, reloadKey]);

  // Everyone has the same coach: one click assigns them (or queues them if no coach account exists yet).
  const connect = async () => {
    setConnecting(true);
    const { error } = await supabase.rpc('request_coach', {});
    setConnecting(false);
    if (error) {
      console.error('request_coach failed:', error);
      toast.error('We couldn’t connect you just now. Please try again.');
      return;
    }
    setChecking(true);
    setReloadKey((k) => k + 1);
  };

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
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
          <div className="w-full max-w-md flex flex-col gap-5">
            <h1 className="text-2xl font-serif font-semibold text-center">Meet your coach</h1>
            <CoachCard />
            {queued ? (
              <p className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                <Clock className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
                You’re on {PRIMARY_COACH.name}’s list. They’ll message you here as soon as you’re connected.
              </p>
            ) : (
              <Button onClick={connect} disabled={connecting} className="h-12 rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
                {connecting ? 'Connecting…' : `Message ${PRIMARY_COACH.name}`}
              </Button>
            )}
            <Button onClick={() => navigate('/welcome')} variant="ghost" className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // The profile copy describes the primary coach. If the assigned coach account has a different
  // name, show that account's own name and bio instead of someone else's description.
  const cardCoach = coach.displayName === PRIMARY_COACH.name
    ? { ...PRIMARY_COACH, bio: coach.bio || PRIMARY_COACH.bio }
    : { ...PRIMARY_COACH, name: coach.displayName, title: 'Your coach', bio: coach.bio || `${coach.displayName} is your Be:More coach.` };

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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAbout((v) => !v)}
          aria-expanded={showAbout}
          className="rounded-full gap-1.5 text-muted-foreground"
        >
          <Info className="w-4 h-4" aria-hidden />
          About
        </Button>
      </header>
      {showAbout && (
        <div className="border-b border-border bg-background px-4 py-4">
          <CoachCard coach={cardCoach} className="max-w-3xl mx-auto" />
        </div>
      )}

      <MessageThread
        messages={messages}
        myId={user.id}
        sending={sending}
        onSend={send}
        placeholder={`Message ${coach.displayName}… (Enter to send)`}
        emptyHint="Say hello to start your coaching conversation."
        intro={<CoachCard compact coach={cardCoach} />}
      />
    </div>
  );
}
