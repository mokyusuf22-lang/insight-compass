import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { MessageThread } from '@/components/coaching/MessageThread';
import { useCoachThread } from '@/hooks/useCoachThread';
import { findCoachClientAssignment } from '@/lib/coaching';

export default function CoachMessages() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [clientLabel, setClientLabel] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user || !userId) return;
      // Messaging is per assignment, so even admins need an active assignment with this client.
      const assignment = await findCoachClientAssignment(user.id, userId);
      if (assignment) {
        setAssignmentId(assignment.id);
        const [{ data: session }, { data: profile }] = await Promise.all([
          supabase.from('aura_sessions').select('name').eq('user_id', userId)
            .order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('profiles').select('email').eq('user_id', userId).maybeSingle(),
        ]);
        setClientLabel(session?.name || profile?.email || 'Client');
      }
      setChecking(false);
    };
    load();
  }, [user, userId]);

  const { messages, loading, sending, send } = useCoachThread(assignmentId, user?.id);

  if (checking || (assignmentId && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!assignmentId || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background flex-col gap-4 px-4 text-center">
        <p className="text-muted-foreground">You don’t have an active coaching relationship with this client.</p>
        <Button onClick={() => navigate('/coach')} variant="outline">Back to dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/coach/user/${userId}`)}
          className="rounded-full flex-shrink-0"
          aria-label="Back to client profile"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-9 h-9 chamfer-sm bg-secondary flex items-center justify-center flex-shrink-0 font-semibold text-sm">
          {clientLabel[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{clientLabel}</p>
          <p className="text-xs text-muted-foreground">Client</p>
        </div>
      </header>

      <MessageThread
        messages={messages}
        myId={user.id}
        sending={sending}
        onSend={send}
        placeholder="Message your client… (Enter to send)"
        emptyHint="Start the conversation below."
      />
    </div>
  );
}
