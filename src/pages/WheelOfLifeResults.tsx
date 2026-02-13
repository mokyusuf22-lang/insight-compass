import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { wheelCategories } from '@/data/wheelOfLifeCategories';
import { UserHeader } from '@/components/UserHeader';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export default function WheelOfLifeResults() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [scores, setScores] = useState<Record<string, number> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completedAt, setCompletedAt] = useState<string | null>(null);

  const assessmentId = searchParams.get('id');

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        let query = supabase
          .from('wheel_of_life_assessments' as any)
          .select('*')
          .eq('user_id', user.id)
          .eq('is_complete', true);

        if (assessmentId) {
          query = query.eq('id', assessmentId);
        } else {
          query = query.order('updated_at', { ascending: false }).limit(1);
        }

        const { data, error } = await query.maybeSingle();
        if (error) throw error;
        if (data) {
          setScores((data as any).scores as Record<string, number>);
          setCompletedAt((data as any).updated_at);
        }
      } catch (err) {
        console.error('Error loading WoL results:', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (!authLoading && user) load();
  }, [user, authLoading, assessmentId]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  if (authLoading || isLoading) return <LoadingSpinner />;

  if (!scores) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Results not found</p>
        <Button onClick={() => navigate('/welcome')}>Go to Dashboard</Button>
      </div>
    );
  }

  const chartData = wheelCategories.map((c) => ({
    category: c.name,
    score: scores[c.id] || 0,
    fullMark: 10,
  }));

  const average = Math.round(
    (wheelCategories.reduce((sum, c) => sum + (scores[c.id] || 0), 0) / wheelCategories.length) * 10
  ) / 10;

  const sorted = [...wheelCategories].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  const topAreas = sorted.slice(0, 3);
  const growthAreas = sorted.slice(-3).reverse();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <UserHeader showHomeLink />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/welcome')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <Card className="mb-8">
          <CardHeader className="text-center pb-4">
            <span className="text-5xl mb-3 block">🎯</span>
            <CardTitle className="text-2xl md:text-3xl font-serif">
              Your Wheel of Life
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Overall life satisfaction score: <strong className="text-primary">{average}/10</strong>
            </p>
            {completedAt && (
              <p className="text-xs text-muted-foreground mt-3">
                Completed on {new Date(completedAt).toLocaleDateString()}
              </p>
            )}
          </CardHeader>
        </Card>

        {/* Radar Chart */}
        <Card className="mb-8">
          <CardContent className="p-4 md:p-8">
            <div className="w-full h-[350px] md:h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 10]}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="hsl(var(--accent))"
                    fill="hsl(var(--accent))"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Breakdown */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Top areas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                Strongest Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topAreas.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="text-2xl">{c.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-medium text-sm">{c.name}</span>
                      <span className="font-bold text-primary">{scores[c.id]}/10</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-500 rounded-full"
                        style={{ width: `${(scores[c.id] / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Growth areas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-muted-foreground" />
                Growth Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {growthAreas.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="text-2xl">{c.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-medium text-sm">{c.name}</span>
                      <span className="font-bold text-muted-foreground">{scores[c.id]}/10</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-muted-foreground/40 transition-all duration-500 rounded-full"
                        style={{ width: `${(scores[c.id] / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* All scores */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Full Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {wheelCategories.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="text-xl">{c.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className="text-sm font-bold">{scores[c.id]}/10</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(scores[c.id] / 10) * 100}%`,
                        backgroundColor: c.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/assessment/wheel-of-life')}>
            Retake Assessment
          </Button>
          <Button className="flex-1" onClick={() => navigate('/assessment/blob-tree')}>
            Continue to Blob Tree
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </main>
    </div>
  );
}
