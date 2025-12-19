import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { 
  History as HistoryIcon, 
  Crown, 
  ArrowRight, 
  Calendar,
  CheckCircle,
  Clock,
  Home,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';

interface Assessment {
  id: string;
  assessment_type: string;
  is_complete: boolean;
  is_paid: boolean;
  completed_at: string | null;
  created_at: string;
}

export default function AssessmentHistory() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const loadAssessments = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAssessments(data);
      }
      setIsLoading(false);
    };

    if (user) {
      loadAssessments();
    }
  }, [user]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading your history..." />
      </div>
    );
  }

  const hasPaid = profile?.has_paid;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="p-4 md:p-6 border-b border-border">
        <div className="container max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <HistoryIcon className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-serif font-semibold">Assessment History</span>
          </div>
          <Link to="/welcome">
            <Button variant="ghost" size="sm">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-4xl py-8 px-4 md:px-8">
        <div className="mb-8 animate-fade-up">
          <h1 className="text-3xl font-serif font-semibold text-foreground mb-2">
            Your Assessment Journey
          </h1>
          <p className="text-muted-foreground">
            View and revisit your past personality assessments and results.
          </p>
        </div>

        {assessments.length === 0 ? (
          <Card className="shadow-soft animate-fade-up">
            <CardContent className="p-12 text-center">
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Assessments Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start your personality journey by taking your first assessment.
              </p>
              <Button
                className="gradient-primary text-primary-foreground hover:opacity-90"
                onClick={() => navigate('/assessment/free')}
              >
                Start Free Assessment
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {assessments.map((assessment, index) => (
              <Card 
                key={assessment.id} 
                className="shadow-soft animate-fade-up hover:shadow-card transition-shadow"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${assessment.is_paid ? 'bg-secondary/10' : 'bg-primary/10'}`}>
                        {assessment.is_paid ? (
                          <Crown className="w-6 h-6 text-secondary" />
                        ) : (
                          <Sparkles className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          {assessment.is_paid ? 'Full' : 'Free'} Personality Assessment
                          {assessment.is_paid && (
                            <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
                              Premium
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(assessment.created_at), 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            {assessment.is_complete ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-success" />
                                Completed
                              </>
                            ) : (
                              <>
                                <Clock className="w-4 h-4" />
                                In Progress
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant={assessment.is_paid ? 'default' : 'outline'}
                      className={assessment.is_paid ? 'gradient-primary text-primary-foreground hover:opacity-90' : ''}
                      onClick={() => navigate(assessment.is_paid ? '/results/full' : '/results/free')}
                    >
                      View Results
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Upsell for non-paid users */}
        {!hasPaid && assessments.length > 0 && (
          <Card className="mt-8 border-secondary/50 shadow-card animate-fade-up" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-8 text-center">
              <Crown className="w-10 h-10 text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-serif font-semibold mb-2">
                Ready for Deeper Insights?
              </h3>
              <p className="text-muted-foreground mb-6">
                Unlock the full assessment for comprehensive personality analysis and personalized recommendations.
              </p>
              <Button
                className="gradient-primary text-primary-foreground hover:opacity-90"
                onClick={() => navigate('/paywall')}
              >
                Unlock Full Assessment
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
