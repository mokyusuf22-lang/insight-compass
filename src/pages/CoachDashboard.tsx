import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import {
  Users,
  MessageSquare,
  Search,
  LogOut,
  ChevronRight,
  Circle,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';

interface AssignedUser {
  user_id: string;
  status: string;
  email: string | null;
  display_name: string | null;
  last_active: string | null;
  assessments_completed: number;
  has_unread: boolean;
  is_demo: boolean;
}

export default function CoachDashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AssignedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [coachName, setCoachName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const { data: roleRows } = await supabase.rpc('get_my_roles');

      const roles = (roleRows || []).map((r) => r.role);
      if (!roles.includes('coach') && !roles.includes('admin')) {
        toast.error('Access denied. Coach role required.');
        navigate('/');
        return;
      }

      setIsAdmin(roles.includes('admin'));

      const { data: coachProfile } = await supabase
        .from('coach_profiles' as any)
        .select('display_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (coachProfile) {
        setCoachName((coachProfile as any).display_name || user.email || 'Coach');
      } else {
        setCoachName(user.email || 'Coach');
      }

      const { data: assignments, error } = await supabase
        .from('coach_assignments' as any)
        .select('user_id, status, is_demo')
        .eq('coach_id', user.id)
        .eq('status', 'active');

      if (error || !assignments) {
        setLoading(false);
        return;
      }

      const userIds = (assignments as any[]).map((a) => a.user_id);
      if (userIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email')
        .in('user_id', userIds);

      const { data: assessmentCounts } = await supabase
        .from('assessments')
        .select('user_id')
        .in('user_id', userIds)
        .eq('is_complete', true);

      const { data: unreadMessages } = await supabase
        .from('coach_messages' as any)
        .select('user_id')
        .eq('coach_id', user.id)
        .eq('is_read', false)
        .in('user_id', userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, p])
      );

      const countMap = new Map<string, number>();
      (assessmentCounts || []).forEach((a) => {
        countMap.set(a.user_id, (countMap.get(a.user_id) || 0) + 1);
      });

      const unreadSet = new Set(
        (unreadMessages || []).map((m: any) => m.user_id)
      );

      const enriched: AssignedUser[] = (assignments as any[]).map((a) => {
        const profile = profileMap.get(a.user_id);
        return {
          user_id: a.user_id,
          status: a.status,
          email: profile?.email || null,
          display_name: null,
          last_active: null,
          assessments_completed: countMap.get(a.user_id) || 0,
          has_unread: unreadSet.has(a.user_id),
          is_demo: !!(a as any).is_demo,
        };
      });

      setUsers(enriched.sort((a, b) => Number(a.is_demo) - Number(b.is_demo)));
      setLoading(false);
    };

    if (!authLoading && user) load();
  }, [user, authLoading, navigate]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.display_name?.toLowerCase().includes(q)
    );
  });

  const handleLogOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 chamfer-sm bg-accent flex items-center justify-center">
            <span className="text-white font-sans font-bold text-sm">b</span>
          </div>
          <div>
            <span className="font-sans font-semibold text-base">Be:More</span>
            <span className="ml-2 text-xs text-muted-foreground font-sans">Coach Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/coach-applications')}
              className="gap-1.5 text-muted-foreground"
            >
              <ClipboardList className="w-4 h-4" />
              <span className="hidden md:inline">Applications</span>
            </Button>
          )}
          <span className="text-sm text-muted-foreground hidden md:inline">{coachName}</span>
          <Button variant="ghost" size="sm" onClick={handleLogOut} className="gap-1.5 text-muted-foreground">
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 chamfer-sm gradient-coral flex items-center justify-center shadow-accent">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold">Your Clients</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-[52px]">
            {users.length} active {users.length === 1 ? 'client' : 'clients'}
          </p>
        </div>

        {users.length > 3 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="chamfer bg-secondary/50 p-12 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="font-semibold mb-1">
              {users.length === 0 ? 'No clients assigned yet' : 'No matching clients'}
            </p>
            <p className="text-sm text-muted-foreground">
              {users.length === 0
                ? 'Client assignments are managed by an admin.'
                : 'Try a different search term.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((u) => (
              <button
                key={u.user_id}
                onClick={() => navigate(`/coach/user/${u.user_id}`)}
                className="w-full text-left bg-card border border-border/70 rounded-2xl p-5 hover:border-accent/40 hover:shadow-elevated transition-all duration-150 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 chamfer-sm bg-secondary flex items-center justify-center flex-shrink-0 text-base font-semibold text-foreground">
                    {(u.email || '?')[0].toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-sm truncate">
                        {u.display_name || u.email || u.user_id.slice(0, 8)}
                      </p>
                      {u.is_demo && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium flex-shrink-0">
                          Demo
                        </span>
                      )}
                      {u.has_unread && (
                        <Circle className="w-2 h-2 fill-accent text-accent flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{u.assessments_completed} assessments</span>
                      <span>·</span>
                      <span className="capitalize">{u.is_demo ? 'demo' : u.status}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-muted-foreground group-hover:text-accent"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/coach/messages/${u.user_id}`);
                      }}
                      title="Message this client"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
