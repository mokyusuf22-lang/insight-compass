import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserHeader } from '@/components/UserHeader';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MBTIResult, getMBTITypeDescription } from '@/lib/mbtiScoring';
import { getAxisLabel, MBTIAxis } from '@/data/mbtiQuestions';
import { ArrowLeft, Download, Share2, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function MBTIResults() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [result, setResult] = useState<MBTIResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completedAt, setCompletedAt] = useState<string | null>(null);

  const assessmentId = searchParams.get('id');

  useEffect(() => {
    const loadResults = async () => {
      if (!user || !assessmentId) return;
      
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('mbti_assessments')
          .select('*')
          .eq('id', assessmentId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (data?.result) {
          setResult(data.result as unknown as MBTIResult);
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
        <Button onClick={() => navigate('/welcome')}>Go Home</Button>
      </div>
    );
  }

  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    const variants = {
      high: { variant: 'default' as const, label: 'High confidence' },
      medium: { variant: 'secondary' as const, label: 'Medium confidence' },
      low: { variant: 'outline' as const, label: 'Low confidence' },
    };
    return variants[confidence];
  };

  const renderAxisBar = (axis: MBTIAxis, axisResult: MBTIResult['axisResults']['EI']) => {
    const axisInfo = getAxisLabel(axis);
    const confidenceInfo = getConfidenceBadge(axisResult.confidence);
    
    // For display, we show the percentage toward the dominant side
    const dominantPercentage = axisResult.percentage >= 50 
      ? axisResult.percentage 
      : 100 - axisResult.percentage;

    return (
      <div key={axis} className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{axisInfo.name}</span>
          <Badge variant={confidenceInfo.variant} className="text-xs">
            {confidenceInfo.label}
          </Badge>
        </div>
        <div className="relative">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span className={axisResult.dominant === axis[0] ? 'text-primary font-medium' : ''}>
              {axisInfo.left} ({axis[0]})
            </span>
            <span className={axisResult.dominant === axis[1] ? 'text-primary font-medium' : ''}>
              {axisInfo.right} ({axis[1]})
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ 
                width: `${axisResult.percentage}%`,
              }}
            />
            {/* Center marker */}
            <div className="absolute top-0 left-1/2 w-0.5 h-full bg-border -translate-x-1/2" />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="font-medium">
              {axisResult.dominant === axis[0] ? `${dominantPercentage}%` : `${100 - dominantPercentage}%`}
            </span>
            <span className="font-medium">
              {axisResult.dominant === axis[1] ? `${dominantPercentage}%` : `${100 - dominantPercentage}%`}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {axisResult.validQuestions} of {axisResult.totalQuestions} questions scored
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <UserHeader showHomeLink={true} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate('/welcome')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Main result */}
        <Card className="mb-8">
          <CardHeader className="text-center pb-4">
            <div className="mb-4">
              <span className="text-6xl md:text-8xl font-serif font-bold tracking-tight text-primary">
                {result.type}
              </span>
            </div>
            <CardTitle className="text-xl md:text-2xl font-serif">
              {getMBTITypeDescription(result.type).split(' — ')[0]}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              {getMBTITypeDescription(result.type).split(' — ')[1]}
            </p>
            {completedAt && (
              <p className="text-xs text-muted-foreground mt-4">
                Completed on {new Date(completedAt).toLocaleDateString()}
              </p>
            )}
          </CardHeader>
        </Card>

        {/* Axis breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Personality Dimensions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderAxisBar('EI', result.axisResults.EI)}
            {renderAxisBar('SN', result.axisResults.SN)}
            {renderAxisBar('TF', result.axisResults.TF)}
            {renderAxisBar('JP', result.axisResults.JP)}
          </CardContent>
        </Card>

        {/* Data quality note */}
        {result.invalidatedQuestions > 0 && (
          <Card className="mb-8 border-yellow-500/50 bg-yellow-500/5">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Data Quality Note</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {result.invalidatedQuestions} question{result.invalidatedQuestions > 1 ? 's were' : ' was'} excluded 
                    from scoring due to inconsistent responses. This helps ensure your results are as accurate as possible.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info card */}
        <Card className="mb-8 bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Understanding Your Results</p>
                <p className="text-sm text-muted-foreground mt-1">
                  MBTI is a framework for understanding personality preferences, not rigid categories. 
                  Your results show tendencies, not limitations. Use them as a starting point for self-reflection.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => navigate('/assessment/mbti')}
          >
            Retake Assessment
          </Button>
          <Button 
            className="flex-1"
            onClick={() => navigate('/welcome')}
          >
            Continue to Next Assessment
          </Button>
        </div>
      </main>
    </div>
  );
}
