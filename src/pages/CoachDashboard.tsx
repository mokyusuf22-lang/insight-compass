import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ClipboardList, Home, LogOut, MapPin, MessageSquare, Search, Shield, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';

interface ClientRow {
  assignment_id: string;
  user_id: string;
  is_demo: boolean;
  name: string | null;
  email: string | null;
  goal: string | null;
  location: string | null;
  progress: number | null;
  assessments_completed: number;
  unread: number;
}

const ASSESSMENT_FLAGS = ['disc_completed', 'wheel_of_life_complete', 'blob_tree_complete', 'value_map_complete', 'strengths_completed'] as const;

export default function CoachDashboard() {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [coachName, setCoachName] = useState('');

  const loadUnread = useCallback(async (assignmentIds: string[]) => {
    if (!user || assignmentIds.length === 0) return new Map<string, number>();
    const { data } = await supabase
      .from('coach_messages')
      .select('assignment_id')
      .in('assignment_id', assignmentIds)
      .eq('is_read', false)
      .neq('sender_id', user.id);
    const counts = new Map<string, number>();
    (data ?? []).forEach((m) => counts.set(m.assignment_id, (counts.get(m.assignment_id) ?? 0) + 1));
    return counts;
  }, [user]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const [{ data: coachProfile }, { data: assignments, error }] = await Promise.all([
        supabase.from('coach_profiles').select('display_name').eq('user_id', user.id).maybeSingle(),
        supabase.from('coach_assignments').select('id, user_id, is_demo')
          .eq('coach_id', user.id).eq('status', 'active').order('created_at', { ascending: false }),
      ]);
      setCoachName(coachProfile?.display_name || user.email || 'Coach');

      if (error || !assignments?.length) {
        if (error) console.error('Error loading assignments:', error);
        setLoading(false);
        return;
      }

      const userIds = assignments.map((a) => a.user_id);
      const [{ data: profiles }, { data: sessions }, { data: paths }, unread] = await Promise.all([
        supabase.from('profiles')
          .select('user_id, email, disc_completed, wheel_of_life_complete, blob_tree_complete, value_map_complete, strengths_completed')
          .in('user_id', userIds),
        supabase.from('aura_sessions').select('user_id, name, challenge_text, flow_data, created_at')
          .in('user_id', userIds).order('created_at', { ascending: false }),
        supabase.from('personal_paths').select('user_id, total_progress').in('user_id', userIds).eq('is_active', true),
        loadUnread(assignments.map((a) => a.id)),
      ]);

      const profileBy = new Map((profiles ?? []).map((p) => [p.user_id, p as Record<string, unknown>]));
      const sessionBy = new Map<string, NonNullable<typeof sessions>[number]>();
      (sessions ?? []).forEach((s) => { if (!sessionBy.has(s.user_id)) sessionBy.set(s.user_id, s); });
      const pathBy = new Map((paths ?? []).map((p) => [p.user_id, p.total_progress]));

      setClients(assignments.map((a) => {
        const profile = profileBy.get(a.user_id);
        const session = sessionBy.get(a.user_id);
        const loc = (session?.flow_data as { location?: { city?: string; country?: string } } | null)?.location;
        return {
          assignment_id: a.id,
          user_id: a.user_id,
          is_demo: a.is_demo,
          name: session?.name ?? null,
          email: (profile?.email as string | null) ?? null,
          goal: session?.challenge_text ?? null,
          location: loc ? [loc.city, loc.country].filter(Boolean).join(', ') || null : null,
          progress: pathBy.get(a.user_id) ?? null,
          assessments_completed: ASSESSMENT_FLAGS.filter((f) => profile?.[f]).length,
          unread: unread.get(a.id) ?? 0,
        };
      }).sort((x, y) => Number(x.is_demo) - Number(y.is_demo) || y.unread - x.unread));
      setLoading(false);
    };
    load();
  }, [user, loadUnread]);

  // Keep unread badges live.
  useEffect(() => {
    if (!user || clients.length === 0) return;
    const ids = clients.map((c) => c.assignment_id);
    const channel = supabase
      .channel(`coach_dashboard:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coach_messages' }, async () => {
        const counts = await loadUnread(ids);
        setClients((prev) => prev.map((c) => ({ ...c, unread: counts.get(c.assignment_id) ?? 0 })));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // Re-subscribe only when the set of threads changes, not on every badge update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loadUnread, clients.map((c) => c.assignment_id).join()]);

  const q = search.toLowerCase();
  const filtered = clients.filter((c) =>
    [c.name, c.email, c.goal, c.location].some((v) => v?.toLowerCase().includes(q)));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 md:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 chamfer-sm bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-white font-sans font-bold text-sm">b</span>
          </div>
          <div className="min-w-0">
            <span className="font-sans font-semibold text-base">Be:More</span>
            <span className="ml-2 text-xs text-muted-foreground font-sans">Coach portal</span>
          </div>
        </div>
        <nav className="flex items-center gap-1" aria-label="Coach portal">
          {isAdmin && (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/coaching')} className="gap-1.5 text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span className="hidden md:inline">Admin</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/coach-applications')} className="gap-1.5 text-muted-foreground">
                <ClipboardList className="w-4 h-4" />
                <span className="hidden md:inline">Applications</span>
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={() => navigate('/welcome')} className="gap-1.5 text-muted-foreground">
            <Home className="w-4 h-4" />
            <span className="hidden md:inline">My app</span>
          </Button>
          <span className="text-sm text-muted-foreground hidden lg:inline px-2">{coachName}</span>
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate('/'); }} className="gap-1.5 text-muted-foreground">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 chamfer-sm gradient-coral flex items-center justify-center shadow-accent">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold">Your clients</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-[52px]">
            {clients.length} active {clients.length === 1 ? 'client' : 'clients'}
          </p>
        </div>

        {clients.length > 3 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
            <Input
              aria-label="Search clients"
              placeholder="Search by name, email, goal or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="chamfer bg-secondary/50 p-12 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="font-semibold mb-1">{clients.length === 0 ? 'No clients yet' : 'No matching clients'}</p>
            <p className="text-sm text-muted-foreground">
              {clients.length === 0
                ? 'Clients who ask for a human coach are matched to you automatically. New clients appear here.'
                : 'Try a different search term.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((c) => {
              const label = c.name || c.email || c.user_id.slice(0, 8);
              return (
                <li key={c.assignment_id}>
                  <div className="w-full bg-card border border-border/70 rounded-2xl p-5 hover:border-accent/40 hover:shadow-elevated transition-all duration-150 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => navigate(`/coach/user/${c.user_id}`)}
                      className="flex-1 min-w-0 flex items-center gap-4 text-left"
                    >
                      <div className="w-11 h-11 chamfer-sm bg-secondary flex items-center justify-center flex-shrink-0 text-base font-semibold">
                        {label[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium text-sm truncate">{label}</p>
                          {c.is_demo && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium flex-shrink-0">Demo</span>
                          )}
                        </div>
                        {c.goal && <p className="text-sm text-foreground/80 truncate">{c.goal}</p>}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                          {c.location && (
                            <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" aria-hidden />{c.location}</span>
                          )}
                          {c.progress !== null && <span>Path {c.progress}%</span>}
                          <span>{c.assessments_completed} of 5 assessments</span>
                        </div>
                      </div>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="relative flex-shrink-0 gap-1.5 text-muted-foreground hover:text-accent"
                      onClick={() => navigate(`/coach/messages/${c.user_id}`)}
                      aria-label={c.unread ? `Message ${label}, ${c.unread} unread` : `Message ${label}`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      {c.unread > 0 && (
                        <span className="min-w-5 h-5 px-1.5 rounded-full bg-accent text-white text-[11px] font-semibold flex items-center justify-center">
                          {c.unread}
                        </span>
                      )}
                    </Button>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
