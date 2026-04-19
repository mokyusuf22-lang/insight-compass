import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, XCircle, Clock, Users } from 'lucide-react';

interface AuraTheme {
  area: string;
  confidence: number;
}

interface Application {
  id: string;
  user_id: string;
  display_name: string;
  bio: string;
  experience: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  email: string | null;
  discPrimaryStyle?: string | null;
  auraThemes?: AuraTheme[] | null;
}

export default function AdminCoachApplications() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/auth', { state: { from: '/admin/coach-applications' } });
      return;
    }

    const load = async () => {
      // Check admin role via security-definer RPC (bypasses broken RLS)
      const { data: roleData } = await supabase.rpc('get_my_roles');
      if (!roleData?.some((r) => r.role === 'admin')) {
        navigate('/');
        return;
      }

      const { data: apps, error } = await supabase
        .from('coach_applications' as any)
        .select('id, user_id, display_name, bio, experience, status, created_at')
        .order('created_at', { ascending: false });

      if (error || !apps) {
        console.error('Failed to load applications:', error);
        setLoading(false);
        return;
      }

      // Enrich with emails, DISC results, and Aura session themes
      const userIds = (apps as any[]).map((a) => a.user_id);

      const [{ data: profiles }, { data: discRows }, { data: auraSessions }] = await Promise.all([
        supabase.from('profiles').select('user_id, email').in('user_id', userIds),
        supabase
          .from('disc_assessments')
          .select('user_id, result')
          .in('user_id', userIds)
          .eq('is_complete', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('aura_sessions')
          .select('user_id, identified_themes')
          .in('user_id', userIds)
          .order('created_at', { ascending: false }),
      ]);

      const emailMap = new Map((profiles || []).map((p) => [p.user_id, p.email]));

      // Latest per user (rows are ordered desc, so first hit wins)
      const discMap = new Map<string, string | null>();
      (discRows || []).forEach((d) => {
        if (!discMap.has(d.user_id)) {
          discMap.set(d.user_id, (d.result as any)?.primaryStyle || null);
        }
      });
      const auraMap = new Map<string, AuraTheme[] | null>();
      (auraSessions || []).forEach((s) => {
        if (!auraMap.has(s.user_id)) {
          const themes = (s as any).identified_themes;
          auraMap.set(s.user_id, Array.isArray(themes) ? themes : null);
        }
      });

      setApplications(
        (apps as any[]).map((a) => ({
          ...a,
          email: emailMap.get(a.user_id) || null,
          discPrimaryStyle: discMap.get(a.user_id) ?? null,
          auraThemes: auraMap.get(a.user_id) ?? null,
        }))
      );
      setLoading(false);
    };

    load();
  }, [user, authLoading, navigate]);

  const handleApprove = async (app: Application) => {
    setActionLoading(app.id);
    try {
      // 1. Grant coach role via security-definer RPC (bypasses user_roles RLS)
      const { error: roleError } = await supabase.rpc('grant_coach_role', {
        target_user_id: app.user_id,
      });

      if (roleError) {
        console.error('Step 1 – grant_coach_role failed:', roleError);
        throw new Error(`Grant role failed: ${roleError.message}`);
      }

      // 2. Create coach profile via security-definer RPC (bypasses coach_profiles RLS)
      const { error: profileError } = await supabase.rpc('upsert_coach_profile', {
        target_user_id: app.user_id,
        p_display_name: app.display_name,
        p_bio: app.bio,
      });

      if (profileError) {
        console.error('Step 2 – upsert_coach_profile failed:', profileError);
        throw new Error(`Create profile failed: ${profileError.message}`);
      }

      // 3. Update application status
      const { error: appError } = await supabase
        .from('coach_applications' as any)
        .update({ status: 'approved', reviewed_by: user!.id, reviewed_at: new Date().toISOString() } as any)
        .eq('id', app.id);

      if (appError) {
        console.error('Step 3 – application update failed:', appError);
        throw new Error(`Update application failed: ${appError.message}`);
      }

      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: 'approved' } : a))
      );
      toast.success(`${app.display_name} approved as coach.`);
    } catch (err: any) {
      console.error('Approve failed:', err);
      toast.error(err?.message || 'Failed to approve application.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (app: Application) => {
    setActionLoading(app.id);
    try {
      const { error } = await supabase
        .from('coach_applications' as any)
        .update({ status: 'rejected', reviewed_by: user!.id, reviewed_at: new Date().toISOString() } as any)
        .eq('id', app.id);

      if (error) throw error;

      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: 'rejected' } : a))
      );
      toast.success('Application rejected.');
    } catch {
      toast.error('Failed to reject application.');
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const filtered = filter === 'all' ? applications : applications.filter((a) => a.status === filter);
  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')} className="rounded-full">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="font-semibold text-base">Coach Applications</h1>
          {pendingCount > 0 && (
            <p className="text-xs text-muted-foreground">{pendingCount} pending review</p>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8">

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-accent text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && (
                <span className="ml-1.5 text-xs opacity-70">
                  {applications.filter((a) => a.status === f).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-card border border-border/70 rounded-2xl p-12 text-center shadow-card">
            <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">No {filter === 'all' ? '' : filter} applications.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((app) => (
              <div key={app.id} className="bg-card border border-border/70 rounded-2xl p-6 shadow-card">
                {/* Header row */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-11 h-11 chamfer-sm bg-secondary flex items-center justify-center font-semibold text-lg flex-shrink-0">
                    {app.display_name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{app.display_name}</p>
                    <p className="text-sm text-muted-foreground truncate">{app.email || app.user_id}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Applied {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {/* Status badge */}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 flex items-center gap-1 ${
                    app.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : app.status === 'approved'
                        ? 'bg-accent/10 text-accent'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {app.status === 'pending' && <Clock className="w-3 h-3" />}
                    {app.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                    {app.status === 'rejected' && <XCircle className="w-3 h-3" />}
                    {app.status}
                  </span>
                </div>

                {/* Bio */}
                <div className="mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Bio</p>
                  <p className="text-sm text-foreground leading-relaxed">{app.bio}</p>
                </div>

                {/* Experience */}
                {app.experience && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Experience</p>
                    <p className="text-sm text-foreground leading-relaxed">{app.experience}</p>
                  </div>
                )}

                {/* Assessment profile — drawn from Aura flow data */}
                {(app.discPrimaryStyle || (app.auraThemes && app.auraThemes.length > 0)) && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Assessment Profile</p>
                    <div className="flex flex-wrap gap-2">
                      {app.discPrimaryStyle && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent font-medium">
                          DISC: {app.discPrimaryStyle}
                        </span>
                      )}
                      {app.auraThemes?.slice(0, 3).map((t) => (
                        <span key={t.area} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-muted-foreground font-medium">
                          {t.area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions — only for pending */}
                {app.status === 'pending' && (
                  <div className="flex gap-3 pt-2 border-t border-border/50 mt-4">
                    <Button
                      onClick={() => handleApprove(app)}
                      disabled={actionLoading === app.id}
                      className="flex-1 rounded-full bg-accent hover:bg-accent/90 text-white btn-lift gap-2"
                    >
                      {actionLoading === app.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReject(app)}
                      disabled={actionLoading === app.id}
                      variant="outline"
                      className="flex-1 rounded-full gap-2 text-muted-foreground"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
