import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { blobInterpretations } from '@/data/blobTreeData';
import { UserHeader } from '@/components/UserHeader';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Lightbulb, Target, Sparkles } from 'lucide-react';

export default function BlobTreeResults() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [currentBlob, setCurrentBlob] = useState<number | null>(null);
  const [desiredBlob, setDesiredBlob] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completedAt, setCompletedAt] = useState<string | null>(null);

  const assessmentId = searchParams.get('id');

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        let query = supabase
          .from('blob_tree_assessments' as any)
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
          setCurrentBlob((data as any).current_blob);
          setDesiredBlob((data as any).desired_blob);
          setCompletedAt((data as any).updated_at);
        }
      } catch (err) {
        console.error('Error loading blob tree results:', err);
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

  if (!currentBlob || !desiredBlob) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Results not found</p>
        <Button onClick={() => navigate('/welcome')}>Go to Dashboard</Button>
      </div>
    );
  }

  const currentInterp = blobInterpretations[currentBlob];
  const desiredInterp = blobInterpretations[desiredBlob];

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
            <span className="text-5xl mb-3 block">🌳</span>
            <CardTitle className="text-2xl md:text-3xl font-serif">
              Your Blob Tree Results
            </CardTitle>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Your choices reveal where you are emotionally and where you aspire to be.
            </p>
            {completedAt && (
              <p className="text-xs text-muted-foreground mt-3">
                Completed on {new Date(completedAt).toLocaleDateString()}
              </p>
            )}
          </CardHeader>
        </Card>

        {/* Current self */}
        <Card className="mb-6 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              You Right Now — Person #{currentBlob}
            </CardTitle>
            <p className="text-sm font-medium text-primary">{currentInterp.title}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">{currentInterp.description}</p>

            <div className="flex flex-wrap gap-2">
              {currentInterp.traits.map((trait) => (
                <span
                  key={trait}
                  className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full font-medium"
                >
                  {trait}
                </span>
              ))}
            </div>

            {currentInterp.advice && (
              <div className="bg-muted/50 p-4 rounded-lg flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{currentInterp.advice}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Desired self */}
        <Card className="mb-6 border-2 border-accent/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Your Desired Future — Person #{desiredBlob}
            </CardTitle>
            <p className="text-sm font-medium text-accent">{desiredInterp.title}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">{desiredInterp.description}</p>

            <div className="flex flex-wrap gap-2">
              {desiredInterp.traits.map((trait) => (
                <span
                  key={trait}
                  className="px-3 py-1 bg-accent/10 text-accent text-sm rounded-full font-medium"
                >
                  {trait}
                </span>
              ))}
            </div>

            {desiredInterp.advice && (
              <div className="bg-muted/50 p-4 rounded-lg flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{desiredInterp.advice}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insight */}
        {currentBlob !== desiredBlob && (
          <Card className="mb-8 bg-muted/30">
            <CardContent className="p-6">
              <h3 className="font-serif text-lg mb-3">Your Growth Direction</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Moving from <strong>"{currentInterp.title}"</strong> to{' '}
                <strong>"{desiredInterp.title}"</strong> suggests you're seeking to develop traits
                like{' '}
                {desiredInterp.traits
                  .filter((t) => !currentInterp.traits.includes(t))
                  .slice(0, 3)
                  .join(', ')}
                . This self-awareness is the first step toward meaningful personal growth.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/assessment/blob-tree')}
          >
            Retake Assessment
          </Button>
          <Button className="flex-1" onClick={() => navigate('/assessment/value-map')}>
            Continue to Value Map
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </main>
    </div>
  );
}
