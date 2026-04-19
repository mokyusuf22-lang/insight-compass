import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import {
  ArrowLeft,
  MessageSquare,
  BarChart3,
  Target,
  CheckCircle2,
  Clock,
  Zap,
  TreePine,
  Compass,
  Brain,
  Waypoints,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface UserProfile {
  email: string | null;
  disc_completed: boolean;
  value_map_complete: boolean;
  wheel_of_life_complete: boolean;
  blob_tree_complete: boolean;
  strengths_completed: boolean;
  path_committed: boolean;
  personal_path_generated: boolean;
  onboarding_complete: boolean;
  created_at: string;
}

interface AuraSession {
  name: string | null;
  challenge_text: string | null;
  identified_themes: any;
  aura_summary: string | null;
  current_step: number | null;
}

interface AssessmentResult {
  assessment_type: string;
  completed_at: string | null;
  is_complete: boolean;
  results: any;
}

interface PersonalPath {
  id: string;
  title: string;
  description: string | null;
  total_progress: number;
  phases: any;
}

const DISC_LABELS: Record<string, string> = {
  D: 'Dominance',
  I: 'Influence',
  S: 'Steadiness',
  C: 'Conscientiousness',
};

const DISC_COLORS: Record<string, string> = {
  D: 'bg-red-500',
  I: 'bg-yellow-400',
  S: 'bg-green-500',
  C: 'bg-blue-500',
};

function DISCResultsDisplay({ results }: { results: any }) {
  if (!results) return <p className="text-sm text-muted-foreground">No results data.</p>;
  const scores: Record<string, number> = results.scores || results.rawScores || {};
  const primaryType: string = results.primaryType || results.type || '';
  return (
    <div className="space-y-3">
      {primaryType && (
        <p className="text-sm font-medium text-foreground mb-4">
          Primary type: <span className="text-accent font-semibold">{primaryType} — {DISC_LABELS[primaryType] || primaryType}</span>
        </p>
      )}
      {Object.entries(scores).map(([key, val]) => (
        <div key={key}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-foreground">{key} — {DISC_LABELS[key] || key}</span>
            <span className="text-muted-foreground">{Math.round(Number(val))}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${DISC_COLORS[key] || 'bg-accent'}`}
              style={{ width: `${Math.min(100, Math.round(Number(val)))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function WheelOfLifeDisplay({ results }: { results: any }) {
  if (!results) return <p className="text-sm text-muted-foreground">No results data.</p>;
  const scores: Record<string, number> = results.scores || results.ratings || {};
  return (
    <div className="space-y-3">
      {Object.entries(scores).map(([area, score]) => (
        <div key={area}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-foreground">{area}</span>
            <span className="text-muted-foreground">{score}/10</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full"
              style={{ width: `${(Number(score) / 10) * 100}%` }}
            />
          </div>
        </div>
      ))}
      {Object.keys(scores).length === 0 && (
        <p className="text-sm text-muted-foreground">Results stored but no score breakdown available.</p>
      )}
    </div>
  );
}

function BlobTreeDisplay({ results }: { results: any }) {
  if (!results) return <p className="text-sm text-muted-foreground">No results data.</p>;
  const blob = results.selectedBlob ?? results.blob ?? results.position ?? null;
  const interpretation = results.interpretation || results.meaning || null;
  return (
    <div className="space-y-2">
      {blob !== null && (
        <p className="text-sm text-foreground">
          Selected position: <span className="font-semibold text-accent">#{blob}</span>
        </p>
      )}
      {interpretation && (
        <p className="text-sm text-muted-foreground leading-relaxed">{interpretation}</p>
      )}
      {blob === null && !interpretation && (
        <p className="text-sm text-muted-foreground">Results stored but no position data available.</p>
      )}
    </div>
  );
}

function ValueMapDisplay({ results }: { results: any }) {
  if (!results) return <p className="text-sm text-muted-foreground">No results data.</p>;
  const values: string[] = results.topValues || results.selectedValues || results.values || [];
  if (values.length === 0) return <p className="text-sm text-muted-foreground">Results stored but no values list available.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((v: string, i: number) => (
        <span key={i} className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full font-medium">
          {v}
        </span>
      ))}
    </div>
  );
}

function StrengthsDisplay({ results }: { results: any }) {
  if (!results) return <p className="text-sm text-muted-foreground">No results data.</p>;
  const strengths: any[] = results.topStrengths || results.strengths || [];
  if (strengths.length === 0) return <p className="text-sm text-muted-foreground">Results stored but no strengths data available.</p>;
  return (
    <div className="space-y-3">
      {strengths.map((s: any, i: number) => (
        <div key={i} className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-accent text-white text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
            {i + 1}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{typeof s === 'string' ? s : s.name || s.strength}</p>
            {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

const ASSESSMENT_META: Record<string, { label: string; icon: React.ReactNode; component: React.FC<{ results: any }> }> = {
  disc: { label: 'DISC Profile', icon: <BarChart3 className="w-4 h-4" />, component: DISCResultsDisplay },
  wheel_of_life: { label: 'Wheel of Life', icon: <Target className="w-4 h-4" />, component: WheelOfLifeDisplay },
  blob_tree: { label: 'Blob Tree', icon: <TreePine className="w-4 h-4" />, component: BlobTreeDisplay },
  value_map: { label: 'Value Map', icon: <Compass className="w-4 h-4" />, component: ValueMapDisplay },
  strengths: { label: 'Strengths', icon: <Zap className="w-4 h-4" />, component: StrengthsDisplay },
  mbti: { label: 'MBTI', icon: <Brain className="w-4 h-4" />, component: ({ results }) => (
    <p className="text-sm text-foreground">{results?.type || 'Result stored'}</p>
  )},
};

export default function CoachUserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [auraSession, setAuraSession] = useState<AuraSession | null>(null);
  const [assessments, setAssessments] = useState<AssessmentResult[]>([]);
  const [personalPath, setPersonalPath] = useState<PersonalPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user || !userId) return;

      const [assignmentRes, rolesRes] = await Promise.all([
        supabase
          .from('coach_assignments' as any)
          .select('id')
          .eq('coach_id', user.id)
          .eq('user_id', userId)
          .maybeSingle(),
        supabase.rpc('get_my_roles'),
      ]);

      const isAdmin = rolesRes.data?.some((r) => r.role === 'admin') ?? false;

      if (!assignmentRes.data && !isAdmin) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const [profileRes, auraRes, discRes, valuesRes, wheelRes, blobRes, strengthsRes, pathRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('aura_sessions')
          .select('name, challenge_text, identified_themes, aura_summary, current_step')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from('disc_assessments').select('result, created_at, is_complete').eq('user_id', userId).eq('is_complete', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('value_map_assessments').select('ranked_values, is_complete, created_at').eq('user_id', userId).eq('is_complete', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('wheel_of_life_assessments').select('scores, is_complete, created_at').eq('user_id', userId).eq('is_complete', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('blob_tree_assessments').select('current_blob, desired_blob, is_complete, created_at').eq('user_id', userId).eq('is_complete', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('strengths_assessments').select('result, is_complete, created_at').eq('user_id', userId).eq('is_complete', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase
          .from('personal_paths')
          .select('id, title, description, total_progress, phases')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      setProfile(profileRes.data as UserProfile | null);
      setAuraSession(auraRes.data as AuraSession | null);

      const builtAssessments: AssessmentResult[] = [];
      if (discRes.data?.is_complete) builtAssessments.push({ assessment_type: 'disc', completed_at: (discRes.data as any).created_at, is_complete: true, results: (discRes.data as any).result });
      if (valuesRes.data?.is_complete) builtAssessments.push({ assessment_type: 'value_map', completed_at: (valuesRes.data as any).created_at, is_complete: true, results: { topValues: (valuesRes.data as any).ranked_values } });
      if (wheelRes.data?.is_complete) builtAssessments.push({ assessment_type: 'wheel_of_life', completed_at: (wheelRes.data as any).created_at, is_complete: true, results: { scores: (wheelRes.data as any).scores } });
      if (blobRes.data?.is_complete) builtAssessments.push({ assessment_type: 'blob_tree', completed_at: (blobRes.data as any).created_at, is_complete: true, results: { selectedBlob: (blobRes.data as any).current_blob, desiredBlob: (blobRes.data as any).desired_blob } });
      if (strengthsRes.data?.is_complete) builtAssessments.push({ assessment_type: 'strengths', completed_at: (strengthsRes.data as any).created_at, is_complete: true, results: (strengthsRes.data as any).result });
      setAssessments(builtAssessments);

      setPersonalPath(pathRes.data as PersonalPath | null);
      setLoading(false);
    };

    if (!authLoading && user) load();
  }, [user, authLoading, userId]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background flex-col gap-4">
        <p className="text-muted-foreground">Client not found or access denied.</p>
        <Button onClick={() => navigate('/coach')} variant="outline">Back to Dashboard</Button>
      </div>
    );
  }

  const displayName = auraSession?.name || profile?.email || userId;

  const completionItems = [
    { label: 'DISC Profile', done: profile?.disc_completed },
    { label: 'Wheel of Life', done: profile?.wheel_of_life_complete },
    { label: 'Blob Tree', done: profile?.blob_tree_complete },
    { label: 'Value Map', done: profile?.value_map_complete },
    { label: 'Strengths', done: profile?.strengths_completed },
    { label: 'Path Committed', done: profile?.path_committed },
    { label: 'Skill Path Active', done: !!personalPath },
  ];

  const doneCount = completionItems.filter(i => i.done).length;

  const themes = Array.isArray(auraSession?.identified_themes)
    ? (auraSession!.identified_themes as any[])
    : [];

  const phases: any[] = Array.isArray(personalPath?.phases) ? personalPath!.phases : [];
  const totalTasks = phases.reduce((sum: number, ph: any) => sum + (Array.isArray(ph.tasks) ? ph.tasks.length : 0), 0);
  const completedTasks = phases.reduce((sum: number, ph: any) =>
    sum + (Array.isArray(ph.tasks) ? ph.tasks.filter((t: any) => t.status === 'completed').length : 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 md:px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/coach')} className="rounded-full flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-base truncate">{displayName}</h1>
          {profile?.email && (
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
          )}
        </div>
        <Button
          size="sm"
          className="rounded-full bg-accent hover:bg-accent/90 text-white shadow-accent btn-lift gap-2 flex-shrink-0"
          onClick={() => navigate(`/coach/messages/${userId}`)}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Message</span>
        </Button>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8">

        <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-card mb-6 flex items-center gap-4">
          <div className="w-14 h-14 chamfer bg-secondary flex items-center justify-center text-xl font-bold text-foreground flex-shrink-0">
            {(String(displayName || '?'))[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-lg leading-tight truncate">{displayName}</p>
            {profile?.email && (
              <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-accent">{doneCount}<span className="text-sm text-muted-foreground font-normal">/{completionItems.length}</span></p>
            <p className="text-xs text-muted-foreground">steps done</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full mb-6 bg-muted/50 rounded-xl p-1 h-auto">
            <TabsTrigger value="overview" className="flex-1 rounded-lg py-2">Overview</TabsTrigger>
            <TabsTrigger value="assessments" className="flex-1 rounded-lg py-2">Assessments</TabsTrigger>
            <TabsTrigger value="path" className="flex-1 rounded-lg py-2">Skill Path</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-5 mt-0">

            {auraSession && (
              <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-card">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Aura Session
                </h2>

                {auraSession.challenge_text && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Primary Challenge</p>
                    <p className="text-sm text-foreground leading-relaxed bg-secondary/40 rounded-xl p-3">
                      {auraSession.challenge_text}
                    </p>
                  </div>
                )}

                {themes.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Identified Themes</p>
                    <div className="flex flex-wrap gap-2">
                      {themes.map((t: any, i: number) => (
                        <span key={i} className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full font-medium">
                          {t.area || t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {auraSession.aura_summary && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Aura Summary</p>
                    <p className="text-sm text-foreground leading-relaxed">{auraSession.aura_summary}</p>
                  </div>
                )}
              </div>
            )}

            <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-card">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                Flow Progress
              </h2>
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Completion</span>
                  <span>{doneCount}/{completionItems.length}</span>
                </div>
                <Progress value={(doneCount / completionItems.length) * 100} className="h-2" />
              </div>
              <div className="space-y-2.5">
                {completionItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.done ? 'bg-accent text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {item.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3 h-3" />}
                    </div>
                    <span className={`text-sm ${item.done ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assessments" className="space-y-5 mt-0">
            {assessments.length === 0 ? (
              <div className="bg-card border border-border/70 rounded-2xl p-10 text-center shadow-card">
                <BarChart3 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">No completed assessments yet.</p>
              </div>
            ) : (
              assessments.map((a) => {
                const meta = ASSESSMENT_META[a.assessment_type];
                const label = meta?.label || a.assessment_type.replace(/_/g, ' ');
                const icon = meta?.icon || <BarChart3 className="w-4 h-4" />;
                const ResultComponent = meta?.component;
                return (
                  <div key={a.assessment_type} className="bg-card border border-border/70 rounded-2xl p-6 shadow-card">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 chamfer-sm bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                        {icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm capitalize">{label}</h3>
                        {a.completed_at && (
                          <p className="text-xs text-muted-foreground">
                            Completed {new Date(a.completed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <span className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full font-medium">
                        Complete
                      </span>
                    </div>
                    {ResultComponent && <ResultComponent results={a.results} />}
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="path" className="space-y-5 mt-0">
            {personalPath ? (
              <>
                <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-card">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 chamfer-sm bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                      <Waypoints className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{personalPath.title}</h3>
                      {personalPath.description && (
                        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{personalPath.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="mb-5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Overall progress</span>
                      <span>{personalPath.total_progress}%</span>
                    </div>
                    <Progress value={personalPath.total_progress} className="h-2" />
                  </div>

                  <div className="flex items-center gap-4 text-sm mb-5">
                    <div className="flex-1 text-center bg-secondary/40 rounded-xl py-3">
                      <p className="font-bold text-xl text-foreground">{phases.length}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Phases</p>
                    </div>
                    <div className="flex-1 text-center bg-secondary/40 rounded-xl py-3">
                      <p className="font-bold text-xl text-foreground">{completedTasks}<span className="text-sm text-muted-foreground font-normal">/{totalTasks}</span></p>
                      <p className="text-xs text-muted-foreground mt-0.5">Tasks done</p>
                    </div>
                  </div>

                  <Button
                    className="w-full rounded-full bg-accent hover:bg-accent/90 text-white btn-lift gap-2"
                    onClick={() => navigate(`/coach/user/${userId}/path`)}
                  >
                    <Waypoints className="w-4 h-4" />
                    Edit Path
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Button>
                </div>

                {phases.length > 0 && (
                  <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-card">
                    <h3 className="font-semibold mb-4">Phase Breakdown</h3>
                    <div className="space-y-3">
                      {phases.map((ph: any, i: number) => {
                        const tasks: any[] = Array.isArray(ph.tasks) ? ph.tasks : [];
                        const done = tasks.filter((t: any) => t.status === 'completed').length;
                        return (
                          <div key={ph.id || i} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                            <div className="w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{ph.title}</p>
                              <p className="text-xs text-muted-foreground">{ph.duration || ''}</p>
                            </div>
                            <span className="text-xs text-muted-foreground flex-shrink-0">{done}/{tasks.length} tasks</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-card border border-border/70 rounded-2xl p-10 text-center shadow-card">
                <Waypoints className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">No Path Yet</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Create a personalized skill path for {auraSession?.name || 'this mentee'}.
                </p>
                <Button
                  className="rounded-full bg-accent hover:bg-accent/90 text-white btn-lift gap-2"
                  onClick={() => navigate(`/coach/user/${userId}/path`)}
                >
                  <Sparkles className="w-4 h-4" />
                  Build Skill Path
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
