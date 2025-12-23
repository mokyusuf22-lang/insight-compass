import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { UserHeader } from '@/components/UserHeader';
import { StrengthsResult, getStrengthsInsights, StrengthScore } from '@/lib/strengthsScoring';
import { getStrengthDescription, StrengthDomain } from '@/data/strengthsQuestions';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Star, TrendingUp, Lightbulb, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export default function StrengthsResults() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [result, setResult] = useState<StrengthsResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllStrengths, setShowAllStrengths] = useState(false);

  const assessmentId = searchParams.get('id');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const loadResults = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        let query = supabase
          .from('strengths_assessments')
          .select('result')
          .eq('user_id', user.id)
          .eq('is_complete', true);

        if (assessmentId) {
          query = query.eq('id', assessmentId);
        } else {
          query = query.order('updated_at', { ascending: false }).limit(1);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw error;

        if (data?.result) {
          setResult(data.result as unknown as StrengthsResult);
        } else {
          toast.error('No results found');
          navigate('/history');
        }
      } catch (error) {
        console.error('Error loading results:', error);
        toast.error('Failed to load results');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadResults();
    }
  }, [user, assessmentId, navigate]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading your results..." />
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const insights = getStrengthsInsights(result);
  const allStrengths = [
    ...result.ranked_strengths,
    ...result.secondary_strengths,
    ...result.supporting_strengths,
  ];

  const getStrengthColor = (index: number): string => {
    if (index < 3) return 'text-primary'; // Primary
    if (index < 5) return 'text-secondary'; // Secondary
    return 'text-muted-foreground'; // Supporting
  };

  const getProgressColor = (index: number): string => {
    if (index < 3) return 'bg-primary';
    if (index < 5) return 'bg-secondary';
    return 'bg-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background">
      <UserHeader />

      <main className="container max-w-3xl py-8 px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-up">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary/10 mb-4">
            <Star className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
            Your Strengths Profile
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {result.summary}
          </p>
        </div>

        {/* Primary Strengths */}
        <Card className="mb-6 animate-fade-up" style={{ animationDelay: '50ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
              Top 3 Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.ranked_strengths.map((strength, index) => (
              <div key={strength.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-primary">#{index + 1}</span>
                    <span className="font-medium">{strength.name}</span>
                  </div>
                  <span className="text-sm font-medium text-primary">{strength.score}%</span>
                </div>
                <Progress value={strength.score} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {getStrengthDescription(strength.name)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Secondary Strengths */}
        <Card className="mb-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="w-5 h-5 text-secondary" />
              Secondary Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.secondary_strengths.map((strength, index) => (
              <div key={strength.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{strength.name}</span>
                  <span className="text-sm font-medium text-secondary">{strength.score}%</span>
                </div>
                <Progress value={strength.score} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Supporting Strengths (Collapsible) */}
        {result.supporting_strengths.length > 0 && (
          <Card className="mb-6 animate-fade-up" style={{ animationDelay: '150ms' }}>
            <CardHeader 
              className="cursor-pointer"
              onClick={() => setShowAllStrengths(!showAllStrengths)}
            >
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  Supporting Strengths
                </span>
                {showAllStrengths ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
            {showAllStrengths && (
              <CardContent className="space-y-4 pt-0">
                {result.supporting_strengths.map((strength) => (
                  <div key={strength.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-muted-foreground">{strength.name}</span>
                      <span className="text-sm text-muted-foreground">{strength.score}%</span>
                    </div>
                    <Progress value={strength.score} className="h-2" />
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        )}

        {/* Career Implications */}
        <Card className="mb-6 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="w-5 h-5 text-primary" />
              Career Implications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{insights.careerImplication}</p>
          </CardContent>
        </Card>

        {/* Growth Opportunity */}
        <Card className="mb-8 animate-fade-up" style={{ animationDelay: '250ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-secondary" />
              Growth Opportunity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{insights.growthOpportunity}</p>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: '300ms' }}>
          <Button 
            variant="outline"
            onClick={() => navigate('/history')}
          >
            Back to Journey
          </Button>
          <Button 
            onClick={() => navigate('/history')}
            className="gradient-primary text-primary-foreground"
          >
            Continue Your Journey
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </main>
    </div>
  );
}
