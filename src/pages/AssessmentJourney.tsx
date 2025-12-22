import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { UserHeader } from '@/components/UserHeader';
import { GoalReview, CareerGoals } from '@/components/GoalReview';
import { 
  CheckCircle, 
  Clock, 
  Lock, 
  ArrowRight, 
  Brain,
  Users,
  Star,
  Target,
  Sparkles
} from 'lucide-react';

interface AssessmentStatus {
  mbti: { completed: boolean; assessmentId: string | null };
  disc: { completed: boolean; assessmentId: string | null };
  strengths: { available: boolean };
}

export default function AssessmentJourney() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  
  const [assessmentStatus, setAssessmentStatus] = useState<AssessmentStatus>({
    mbti: { completed: false, assessmentId: null },
    disc: { completed: false, assessmentId: null },
    strengths: { available: false },
  });
  const [careerGoals, setCareerGoals] = useState<CareerGoals | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        // Load MBTI assessment status
        const { data: mbtiData } = await supabase
          .from('mbti_assessments')
          .select('id, is_complete')
          .eq('user_id', user.id)
          .eq('is_complete', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Load DISC assessment status
        const { data: discData } = await supabase
          .from('disc_assessments')
          .select('id, is_complete')
          .eq('user_id', user.id)
          .eq('is_complete', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Load career goals from profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('career_goals')
          .eq('user_id', user.id)
          .single();

        setAssessmentStatus({
          mbti: { 
            completed: !!mbtiData?.is_complete, 
            assessmentId: mbtiData?.id || null 
          },
          disc: { 
            completed: !!discData?.is_complete, 
            assessmentId: discData?.id || null 
          },
          strengths: { available: false }, // Coming soon
        });

        if (profileData?.career_goals) {
          setCareerGoals(profileData.career_goals as unknown as CareerGoals);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading your journey..." />
      </div>
    );
  }

  const hasPaid = profile?.has_paid;
  const completedCount = [assessmentStatus.mbti.completed, assessmentStatus.disc.completed].filter(Boolean).length;
  const totalAssessments = 3; // MBTI, DISC, Strengths

  const getGoalSummary = () => {
    if (!careerGoals?.target_role) return null;
    return `${careerGoals.current_role || 'Current role'} → ${careerGoals.target_role}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <UserHeader />

      <main className="container max-w-4xl py-8 px-4 md:px-8">
        {/* Overview Section */}
        <section className="mb-10 animate-fade-up">
          <h1 className="text-3xl font-serif font-semibold text-foreground mb-2">
            Your Assessment Journey
          </h1>
          <p className="text-muted-foreground mb-6">
            Discover your personality, behavior, and strengths to unlock your career potential.
          </p>

          {/* Stats cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedCount}/{totalAssessments}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <Target className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Career Goal</p>
                    {getGoalSummary() ? (
                      <p className="font-medium">{getGoalSummary()}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Set your goals below</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Career Goals Section */}
        <section className="mb-10 animate-fade-up" style={{ animationDelay: '50ms' }}>
          <GoalReview 
            onSave={(goals) => setCareerGoals(goals)} 
            showTitle={true}
          />
        </section>

        {/* Assessment Cards */}
        <section className="mb-10">
          <h2 className="text-xl font-serif font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Assessments
          </h2>
          
          <div className="space-y-4">
            {/* MBTI Card */}
            <Card className="animate-fade-up" style={{ animationDelay: '100ms' }}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${assessmentStatus.mbti.completed ? 'bg-green-500/10' : 'bg-primary/10'}`}>
                      <Brain className={`w-6 h-6 ${assessmentStatus.mbti.completed ? 'text-green-600' : 'text-primary'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">MBTI Personality</h3>
                        {assessmentStatus.mbti.completed ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                            Completed
                          </Badge>
                        ) : hasPaid ? (
                          <Badge variant="secondary">Available</Badge>
                        ) : (
                          <Badge variant="outline">Premium</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        93 questions • ~15 minutes
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Discover your cognitive preferences and decision-making style.
                      </p>
                    </div>
                  </div>
                  
                  {assessmentStatus.mbti.completed ? (
                    <Button 
                      onClick={() => navigate(`/assessment/mbti/results?id=${assessmentStatus.mbti.assessmentId}`)}
                    >
                      View Results
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : hasPaid ? (
                    <Button onClick={() => navigate('/assessment/mbti')}>
                      Start Assessment
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => navigate('/paywall')}>
                      <Lock className="w-4 h-4 mr-2" />
                      Unlock
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* DISC Card */}
            <Card className="animate-fade-up" style={{ animationDelay: '150ms' }}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${assessmentStatus.disc.completed ? 'bg-green-500/10' : 'bg-primary/10'}`}>
                      <Users className={`w-6 h-6 ${assessmentStatus.disc.completed ? 'text-green-600' : 'text-primary'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">DISC Behavioral</h3>
                        {assessmentStatus.disc.completed ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                            Completed
                          </Badge>
                        ) : hasPaid ? (
                          <Badge variant="secondary">Available</Badge>
                        ) : (
                          <Badge variant="outline">Premium</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        40 questions • ~8 minutes
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Understand your behavioral tendencies and work style.
                      </p>
                    </div>
                  </div>
                  
                  {assessmentStatus.disc.completed ? (
                    <Button 
                      onClick={() => navigate(`/assessment/disc/results?id=${assessmentStatus.disc.assessmentId}`)}
                    >
                      View Results
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : hasPaid ? (
                    <Button onClick={() => navigate('/assessment/disc')}>
                      Start Assessment
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => navigate('/paywall')}>
                      <Lock className="w-4 h-4 mr-2" />
                      Unlock
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Strengths Card - Coming Soon */}
            <Card className="animate-fade-up opacity-70" style={{ animationDelay: '200ms' }}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-muted">
                      <Star className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">Strengths Finder</h3>
                        <Badge variant="outline">Coming Soon</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Identify your core strengths and natural talents.
                      </p>
                    </div>
                  </div>
                  
                  <Button variant="outline" disabled>
                    <Clock className="w-4 h-4 mr-2" />
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Upgrade CTA for non-paid users */}
        {!hasPaid && (
          <Card className="border-secondary/50 shadow-card animate-fade-up" style={{ animationDelay: '250ms' }}>
            <CardContent className="p-8 text-center">
              <div className="p-3 rounded-xl bg-secondary/10 w-fit mx-auto mb-4">
                <Lock className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-serif font-semibold mb-2">
                Unlock Your Full Potential
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Get access to MBTI, DISC, and Strengths assessments with personalized career insights.
              </p>
              <Button
                size="lg"
                className="gradient-primary text-primary-foreground hover:opacity-90"
                onClick={() => navigate('/paywall')}
              >
                Unlock Premium Assessments
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
