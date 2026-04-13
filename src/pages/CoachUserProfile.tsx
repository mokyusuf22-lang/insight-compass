import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MessageSquare, CheckCircle2, Circle, Pencil } from 'lucide-react';

export default function CoachUserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user, isCoach, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [auraSession, setAuraSession] = useState<any>(null);
  const [flowProgress, setFlowProgress] = useState<Record<string, boolean>>({});
  const [assessments, setAssessments] = useState<{ type: string; data: any }[]>([]);
  const [personalPath, setPersonalPath] = useState<any>(null);

  useEffect(() => {
    if (!loading && (!user || (!isCoach && !isAdmin))) navigate('/');
  }, [user, loading, isCoach, isAdmin]);

  useEffect(() => {
    const load = async () => {
      if (!user || !userId) return;

      const { data: assignment } = await supabase
        .from('coach_assignments')
        .select('id')
        .eq('coach_id', user.id)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (!assignment && !isAdmin) {
        setAuthorized(false);
        setIsLoading(false);
        return;
      }
      setAuthorized(true);

      const [profileRes, auraRes, discRes, wolRes, blobRes, vmRes, strRes, pathRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('aura_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('disc_assessments').select('*').eq('user_id', userId).eq('is_complete', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('wheel_of_life_assessments').select('*').eq('user_id', userId).eq('is_complete', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('blob_tree_assessments').select('*').eq('user_id', userId).eq('is_complete', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('value_map_assessments').select('*').eq('user_id', userId).eq('is_complete', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('strengths_assessments').select('*').eq('user_id', userId).eq('is_complete', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('personal_paths').select('*').eq('user_id', userId).eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);

      setProfile(profileRes.data);
      setAuraSession(auraRes.data);
      setPersonalPath(pathRes.data);

      if (profileRes.data) {
        setFlowProgress({
          disc_completed: profileRes.data.disc_completed,
          wheel_of_life_complete: profileRes.data.wheel_of_life_complete,
          blob_tree_complete: profileRes.data.blob_tree_complete,
          value_map_complete: profileRes.data.value_map_complete,
          strengths_completed: profileRes.data.strengths_completed,
          path_committed: profileRes.data.path_committed,
          personal_path_generated: profileRes.data.personal_path_generated,
        });
      }

      const assessmentList: { type: string; data: any }[] = [];
      if (discRes.data) assessmentList.push({ type: 'DISC', data: discRes.data });
      if (wolRes.data) assessmentList.push({ type: 'Wheel of Life', data: wolRes.data });
      if (blobRes.data) assessmentList.push({ type: 'Blob Tree', data: blobRes.data });
      if (vmRes.data) assessmentList.push({ type: 'Value Map', data: vmRes.data });
      if (strRes.data) assessmentList.push({ type: 'Strengths', data: strRes.data });
      setAssessments(assessmentList);
      setIsLoading(false);
    };

    if (!loading && user) load();
  }, [user, userId, loading, isAdmin]);

  if (loading || isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><LoadingSpinner size="lg" /></div>;

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-semibold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You are not assigned to this user.</p>
          <Button onClick={() => navigate('/coach')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const flowSteps = [
    { key: 'disc_completed', label: 'DISC' },
    { key: 'wheel_of_life_complete', label: 'Wheel of Life' },
    { key: 'blob_tree_complete', label: 'Blob Tree' },
    { key: 'value_map_complete', label: 'Value Map' },
    { key: 'strengths_completed', label: 'Strengths' },
    { key: 'path_committed', label: 'Path Committed' },
    { key: 'personal_path_generated', label: 'Skill Path Active' },
  ];
  const completedSteps = flowSteps.filter(s => flowProgress[s.key]).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="container max-w-4xl py-4 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/coach')}><ArrowLeft className="w-4 h-4" /></Button>
            <div>
              <h1 className="text-lg font-serif font-semibold">{profile?.email || 'User Profile'}</h1>
              <p className="text-sm text-muted-foreground">{completedSteps}/7 steps complete</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(`/coach/messages/${userId}`)}>
            <MessageSquare className="w-4 h-4 mr-2" /> Message
          </Button>
        </div>
      </header>

      <main className="container max-w-4xl py-6 px-4 md:px-8">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="skillpath">Skill Path</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {auraSession && (
              <div className="chamfer bg-card border border-border p-6">
                <h3 className="font-serif font-semibold mb-3">Aura Session</h3>
                {auraSession.challenge_text && (
                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground mb-1">Challenge</p>
                    <p className="text-sm">{auraSession.challenge_text}</p>
                  </div>
                )}
                {auraSession.identified_themes && (auraSession.identified_themes as any[]).length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground mb-2">Themes</p>
                    <div className="flex flex-wrap gap-2">
                      {(auraSession.identified_themes as any[]).map((theme: any, i: number) => (
                        <Badge key={i} variant="secondary">{typeof theme === 'string' ? theme : theme.label || theme.name || JSON.stringify(theme)}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {auraSession.aura_summary && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Summary</p>
                    <p className="text-sm">{auraSession.aura_summary}</p>
                  </div>
                )}
              </div>
            )}

            <div className="chamfer bg-card border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif font-semibold">Flow Progress</h3>
                <span className="text-sm text-muted-foreground">{completedSteps}/7</span>
              </div>
              <Progress value={(completedSteps / 7) * 100} className="h-2 mb-4" />
              <div className="space-y-2">
                {flowSteps.map(step => (
                  <div key={step.key} className="flex items-center gap-2 text-sm">
                    {flowProgress[step.key] ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                    <span className={flowProgress[step.key] ? '' : 'text-muted-foreground'}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assessments" className="space-y-4">
            {assessments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No completed assessments yet.</p>
            ) : assessments.map((a, i) => (
              <div key={i} className="chamfer bg-card border border-border p-6">
                <h3 className="font-serif font-semibold mb-3">{a.type}</h3>
                {a.type === 'DISC' && a.data.result && (
                  <div className="space-y-2">
                    {['D', 'I', 'S', 'C'].map(dim => {
                      const score = (a.data.result as any)?.[dim] || (a.data.result as any)?.scores?.[dim] || 0;
                      const colors: Record<string, string> = { D: 'bg-red-500', I: 'bg-yellow-500', S: 'bg-green-500', C: 'bg-blue-500' };
                      return (
                        <div key={dim} className="flex items-center gap-3">
                          <span className="w-4 text-sm font-medium">{dim}</span>
                          <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                            <div className={`h-full ${colors[dim]} rounded-full`} style={{ width: `${Math.min(100, Number(score))}%` }} />
                          </div>
                          <span className="text-sm w-8 text-right">{score}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {a.type === 'Wheel of Life' && a.data.scores && (
                  <div className="space-y-2">
                    {Object.entries(a.data.scores as Record<string, number>).map(([area, score]) => (
                      <div key={area} className="flex items-center gap-3">
                        <span className="w-32 text-sm capitalize truncate">{area}</span>
                        <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${(Number(score) / 10) * 100}%` }} />
                        </div>
                        <span className="text-sm w-8 text-right">{score}/10</span>
                      </div>
                    ))}
                  </div>
                )}
                {a.type === 'Blob Tree' && (
                  <div className="text-sm">
                    <p>Current position: Blob #{a.data.current_blob}</p>
                    <p>Desired position: Blob #{a.data.desired_blob}</p>
                  </div>
                )}
                {a.type === 'Value Map' && a.data.top_five && (
                  <div className="flex flex-wrap gap-2">
                    {(a.data.top_five as any[]).map((val: any, j: number) => (
                      <Badge key={j} variant="secondary">{typeof val === 'string' ? val : val.name || val.label || JSON.stringify(val)}</Badge>
                    ))}
                  </div>
                )}
                {a.type === 'Strengths' && a.data.result && (
                  <div className="space-y-1">
                    {(Array.isArray(a.data.result) ? a.data.result : (a.data.result as any)?.strengths || []).map((s: any, j: number) => (
                      <div key={j} className="text-sm">
                        <span className="font-medium">{j + 1}. {typeof s === 'string' ? s : s.name || s.title}</span>
                        {s.description && <span className="text-muted-foreground"> — {s.description}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="skillpath">
            {personalPath ? (
              <div className="chamfer bg-card border border-border p-6">
                <h3 className="font-serif font-semibold mb-2">{personalPath.title}</h3>
                <Progress value={personalPath.total_progress} className="h-2 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  {(personalPath.phases as any[])?.length || 0} phases · {personalPath.total_progress}% complete
                </p>
                <Button onClick={() => navigate(`/coach/user/${userId}/path`)}>
                  <Pencil className="w-4 h-4 mr-2" /> Edit Path
                </Button>
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-serif font-semibold mb-2">No Skill Path Yet</h3>
                <p className="text-muted-foreground mb-4">Build a personalized path for this mentee.</p>
                <Button onClick={() => navigate(`/coach/user/${userId}/path`)}>Build Skill Path</Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
