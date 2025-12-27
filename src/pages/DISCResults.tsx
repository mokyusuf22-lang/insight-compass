import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserHeader } from '@/components/UserHeader';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DISCResult, getDISCStyleDescription } from '@/lib/discScoring';
import { getDimensionLabel, DISCDimension } from '@/data/discQuestions';
import { ArrowLeft, ArrowRight, Briefcase, Target, Lightbulb } from 'lucide-react';

export default function DISCResults() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [result, setResult] = useState<DISCResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completedAt, setCompletedAt] = useState<string | null>(null);

  const assessmentId = searchParams.get('id');

  useEffect(() => {
    const loadResults = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        let query = supabase
          .from('disc_assessments')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_complete', true);

        if (assessmentId) {
          query = query.eq('id', assessmentId);
        } else {
          // If no ID provided, get the latest completed assessment
          query = query.order('updated_at', { ascending: false }).limit(1);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw error;

        if (data?.result) {
          setResult(data.result as unknown as DISCResult);
          setCompletedAt(data.updated_at);
        }
      } catch (error) {
        console.error('Error loading results:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      loadResults();
    }
  }, [user, authLoading, assessmentId]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Results not found</p>
        <Button onClick={() => navigate('/history')}>Go to Journey</Button>
      </div>
    );
  }

  const styleInfo = getDISCStyleDescription(result);
  const dimensions: DISCDimension[] = ['D', 'I', 'S', 'C'];

  const getDimensionColor = (dim: DISCDimension): string => {
    const colors: Record<DISCDimension, string> = {
      D: 'bg-red-500',
      I: 'bg-yellow-500',
      S: 'bg-green-500',
      C: 'bg-blue-500',
    };
    return colors[dim];
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <UserHeader showHomeLink={true} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate('/history')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Journey
        </Button>

        {/* Main result */}
        <Card className="mb-8">
          <CardHeader className="text-center pb-4">
            <div className="mb-4">
              <span className="text-4xl md:text-6xl font-serif font-bold tracking-tight text-primary">
                {result.primaryStyle}
              </span>
            </div>
            <CardTitle className="text-xl md:text-2xl font-serif">
              Your DISC Behavioral Style
            </CardTitle>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
              {result.summary}
            </p>
            {completedAt && (
              <p className="text-xs text-muted-foreground mt-4">
                Completed on {new Date(completedAt).toLocaleDateString()}
              </p>
            )}
          </CardHeader>
        </Card>

        {/* Dimension breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Behavioral Dimensions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {dimensions.map((dim) => {
              const label = getDimensionLabel(dim);
              const score = result[dim];
              return (
                <div key={dim} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{label.name}</span>
                      <span className="text-muted-foreground text-sm ml-2">({dim})</span>
                    </div>
                    <span className="text-lg font-bold">{score}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${getDimensionColor(dim)}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{label.description}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Strengths */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              Your Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {styleInfo.strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Challenges */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Growth Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {styleInfo.challenges.map((challenge, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span className="text-muted-foreground">{challenge}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Work style */}
        <Card className="mb-8 bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Your Work Style
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{styleInfo.workStyle}</p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => navigate('/assessment/disc')}
          >
            Retake Assessment
          </Button>
          <Button 
            className="flex-1"
            onClick={() => navigate('/history')}
          >
            Continue Your Journey
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </main>
    </div>
  );
}
