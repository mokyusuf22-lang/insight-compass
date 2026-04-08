import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserHeader } from '@/components/UserHeader';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, Circle, MessageSquare } from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

interface ClientData {
  email: string | null;
  challengeText: string | null;
  themes: string[];
  auraSummary: string | null;
  assessments: { type: string; complete: boolean }[];
  profileFlags: Record<string, boolean>;
}

export default function CoachUserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<ClientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user || !userId) return;

      const [profileRes, auraRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('aura_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);

      const profile = profileRes.data;
      const aura = auraRes.data;

      const assessments = [
        { type: 'Wheel of Life', complete: profile?.wheel_of_life_complete ?? false },
        { type: 'Blob Tree', complete: profile?.blob_tree_complete ?? false },
        { type: 'Value Map', complete: profile?.value_map_complete ?? false },
        { type: 'DISC', complete: profile?.disc_completed ?? false },
        { type: 'Strengths', complete: profile?.strengths_completed ?? false },
        { type: 'MBTI', complete: profile?.mbti_completed ?? false },
      ];

      const themes = Array.isArray(aura?.identified_themes)
        ? (aura.identified_themes as Json[]).map((t: Json) => String(t))
        : [];

      setData({
        email: profile?.email || null,
        challengeText: aura?.challenge_text || null,
        themes,
        auraSummary: aura?.aura_summary || null,
        assessments,
        profileFlags: {
          'Onboarding': profile?.onboarding_complete ?? false,
          'Reality Report': profile?.reality_report_generated ?? false,
          'Path Committed': profile?.path_committed ?? false,
          'Personal Path': profile?.personal_path_generated ?? false,
        },
      });
      setIsLoading(false);
    };
    load();
  }, [user, userId]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Client not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <UserHeader showHomeLink />
      <main className="container max-w-3xl py-8 px-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/coach')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-serif">{data.email || 'Unknown User'}</h1>
          <Button size="sm" onClick={() => navigate(`/coach/messages/${userId}`)}>
            <MessageSquare className="w-4 h-4 mr-1" /> Message
          </Button>
        </div>

        {/* Challenge */}
        {data.challengeText && (
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-lg">Core Challenge</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{data.challengeText}</p>
              {data.themes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {data.themes.map((t, i) => (
                    <Badge key={i} variant="secondary">{t}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Aura Summary */}
        {data.auraSummary && (
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-lg">Aura Summary</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.auraSummary}</p>
            </CardContent>
          </Card>
        )}

        {/* Progress Checklist */}
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg">Progress</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.profileFlags).map(([label, done]) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  {done ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className={done ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Assessments */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Assessment History</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.assessments.map(a => (
                <div key={a.type} className="flex items-center gap-2 text-sm">
                  {a.complete ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className={a.complete ? 'text-foreground' : 'text-muted-foreground'}>{a.type}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
