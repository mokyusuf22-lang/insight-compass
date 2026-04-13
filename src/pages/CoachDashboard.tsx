import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Search, LogOut, User } from 'lucide-react';

interface ClientCard {
  userId: string;
  email: string;
  assessmentCount: number;
  unreadCount: number;
}

export default function CoachDashboard() {
  const { user, isCoach, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientCard[]>([]);
  const [coachName, setCoachName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    if (!loading && user && !isCoach && !isAdmin) {
      navigate('/');
      return;
    }
  }, [user, loading, isCoach, isAdmin, navigate]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      const { data: coachProfile } = await supabase
        .from('coach_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const cp = coachProfile as any;
      if (cp?.display_name) {
        setCoachName(cp.display_name);
      }

      const { data: assignments } = await supabase
        .from('coach_assignments')
        .select('user_id')
        .eq('coach_id', user.id)
        .eq('status', 'active');

      if (!assignments || assignments.length === 0) {
        setIsLoading(false);
        return;
      }

      const userIds = assignments.map(a => a.user_id);
      const clientCards: ClientCard[] = [];

      for (const uid of userIds) {
        const profileRes = await supabase.from('profiles').select('email').eq('user_id', uid).maybeSingle();
        const assessmentRes = await supabase.from('assessments').select('id').eq('user_id', uid).eq('is_complete', true);
        const { data: messages } = await supabase.from('coach_messages').select('id, is_read, sender_id').match({ coach_id: user.id, user_id: uid });
        const unreadCount = messages?.filter((m: any) => !m.is_read && m.sender_id !== user.id).length || 0;

        clientCards.push({
          userId: uid,
          email: profileRes.data?.email || 'Unknown',
          assessmentCount: assessmentRes.data?.length || 0,
          unreadCount,
        });
      }

      setClients(clientCards);
      setIsLoading(false);
    };

    if (!loading && user && (isCoach || isAdmin)) loadData();
  }, [user, loading, isCoach, isAdmin]);

  if (loading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><LoadingSpinner size="lg" text="Loading dashboard..." /></div>;
  }

  const filtered = search
    ? clients.filter(c => c.email.toLowerCase().includes(search.toLowerCase()))
    : clients;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="container max-w-4xl py-4 px-4 md:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-serif font-semibold">Coach Dashboard</h1>
            {coachName && <p className="text-sm text-muted-foreground">{coachName}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </header>

      <main className="container max-w-4xl py-8 px-4 md:px-8">
        {clients.length > 3 && (
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-serif font-semibold mb-2">No Clients Yet</h2>
            <p className="text-muted-foreground">Clients will appear here once they're assigned to you.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(client => (
              <div
                key={client.userId}
                className="chamfer bg-card border border-border p-5 flex items-center gap-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate(`/coach/user/${client.userId}`)}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">{client.email.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{client.email}</p>
                  <p className="text-sm text-muted-foreground">{client.assessmentCount} assessments completed</p>
                </div>
                <div className="flex items-center gap-2">
                  {client.unreadCount > 0 && <Badge variant="destructive" className="text-xs">{client.unreadCount}</Badge>}
                  <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); navigate(`/coach/messages/${client.userId}`); }}>
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
