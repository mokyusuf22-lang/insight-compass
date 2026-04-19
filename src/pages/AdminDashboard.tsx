import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Users,
  UserCheck,
  Clock,
  Shield,
  ArrowRight,
  Waypoints,
  Brain,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

interface Stats {
  pendingApplications: number;
  totalCoaches: number;
  totalUsers: number;
  auraSessions: number;
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoEmail, setDemoEmail] = useState('');
  const [demoAssigning, setDemoAssigning] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/auth', { state: { from: '/admin/dashboard' } });
      return;
    }

    const load = async () => {
      // Confirm admin role via security-definer RPC (bypasses broken RLS)
      const { data: roleData } = await supabase.rpc('get_my_roles');
      const isAdminUser = roleData?.some((r) => r.role === 'admin');

      if (!isAdminUser) {
        navigate('/');
        return;
      }

      // Fetch stats in parallel
      const [appsRes, coachesRes, usersRes, auraRes] = await Promise.all([
        supabase
          .from('coach_applications' as any)
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('coach_profiles' as any)
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('aura_sessions')
          .select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        pendingApplications: appsRes.count ?? 0,
        totalCoaches: coachesRes.count ?? 0,
        totalUsers: usersRes.count ?? 0,
        auraSessions: auraRes.count ?? 0,
      });
      setLoading(false);
    };

    load();
  }, [user, authLoading, navigate]);

  const handleAssignDemo = async () => {
    if (!demoEmail.trim()) return;
    setDemoAssigning(true);
    try {
      // Resolve email → user_id via profiles table
      const { data: profile, error: lookupError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', demoEmail.trim().toLowerCase())
        .maybeSingle();

      if (lookupError || !profile) {
        toast.error('No account found with that email.');
        return;
      }

      const { data: count, error: rpcError } = await supabase.rpc(
        'assign_demo_to_all_coaches',
        { p_demo_user_id: profile.user_id }
      );

      if (rpcError) throw rpcError;

      toast.success(
        count === 0
          ? 'All coaches already have this demo client.'
          : `Demo client assigned to ${count} coach${count === 1 ? '' : 'es'}.`
      );
      setDemoEmail('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to assign demo client.');
    } finally {
      setDemoAssigning(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const sections = [
    {
      to: '/admin/coach-applications',
      icon: UserCheck,
      label: 'Coach Applications',
      description: 'Review, approve or reject coach applicants',
      badge: stats?.pendingApplications ?? 0,
      badgeLabel: 'pending',
    },
    {
      to: '/coach',
      icon: Waypoints,
      label: 'Coach Dashboard',
      description: 'View assigned mentees and manage coaching paths',
      badge: null,
      badgeLabel: null,
    },
  ];

  const statCards = [
    { icon: Clock, label: 'Pending Applications', value: stats?.pendingApplications ?? 0, accent: true },
    { icon: UserCheck, label: 'Active Coaches', value: stats?.totalCoaches ?? 0, accent: false },
    { icon: Users, label: 'Total Users', value: stats?.totalUsers ?? 0, accent: false },
    { icon: Brain, label: 'Aura Sessions', value: stats?.auraSessions ?? 0, accent: false },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 chamfer-sm bg-accent flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-sm">Admin</span>
        </div>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={() => navigate('/welcome')} className="text-muted-foreground">
          Back to App
        </Button>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-serif font-semibold mb-1">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform overview and management tools.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {statCards.map((card) => (
            <div
              key={card.label}
              className={`bg-card border rounded-2xl p-5 shadow-card ${card.accent && (stats?.pendingApplications ?? 0) > 0 ? 'border-accent/40 bg-accent/5' : 'border-border/70'}`}
            >
              <div className={`w-8 h-8 chamfer-sm flex items-center justify-center mb-3 ${card.accent && (stats?.pendingApplications ?? 0) > 0 ? 'bg-accent text-white' : 'bg-secondary text-muted-foreground'}`}>
                <card.icon className="w-4 h-4" />
              </div>
              <p className={`text-2xl font-bold mb-0.5 ${card.accent && (stats?.pendingApplications ?? 0) > 0 ? 'text-accent' : 'text-foreground'}`}>
                {card.value}
              </p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Section links */}
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Management</h2>
        <div className="space-y-3">
          {sections.map((section) => (
            <Link key={section.to} to={section.to}>
              <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-card hover:border-accent/30 hover:shadow-elevated transition-all duration-200 flex items-center gap-4 group">
                <div className="w-10 h-10 chamfer-sm bg-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-accent/10 transition-colors">
                  <section.icon className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-sm">{section.label}</p>
                    {section.badge !== null && section.badge > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-white font-medium">
                        {section.badge} {section.badgeLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 group-hover:text-accent transition-colors" />
              </div>
            </Link>
          ))}
        </div>

        {/* Demo client assignment */}
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 mt-10">Demo Client</h2>
        <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-card">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 chamfer-sm bg-secondary flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm mb-0.5">Assign demo account to all coaches</p>
              <p className="text-xs text-muted-foreground">
                Coaches will see this account in their client list so they can explore the coaching pages before real users are assigned.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Demo account email…"
              value={demoEmail}
              onChange={(e) => setDemoEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAssignDemo()}
              className="h-10 text-sm flex-1"
            />
            <Button
              onClick={handleAssignDemo}
              disabled={!demoEmail.trim() || demoAssigning}
              className="h-10 rounded-full bg-accent hover:bg-accent/90 text-white px-5 text-sm flex-shrink-0"
            >
              {demoAssigning ? <LoadingSpinner size="sm" /> : 'Assign'}
            </Button>
          </div>
        </div>

        {/* Quick stats footer */}
        <div className="mt-10 pt-6 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Stats refresh on each visit.</span>
        </div>
      </main>
    </div>
  );
}
