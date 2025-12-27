import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserHeader } from '@/components/UserHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Trophy,
  Calendar,
  Target,
  TrendingUp,
  Users,
  Briefcase,
  Brain,
  Sparkles,
  Loader2,
  CheckCircle2,
  Clock,
  Star,
  Rocket,
  Crown
} from 'lucide-react';

interface OnboardingPhase {
  theme: string;
  objectives: string[];
  key_actions: string[];
}

interface DevelopmentArea {
  area: string;
  why_important: string;
  actions: string[];
}

interface SuccessGrowthData {
  status_message: string;
  onboarding_plan: {
    days_1_30: OnboardingPhase;
    days_31_60: OnboardingPhase;
    days_61_90: OnboardingPhase;
  };
  leadership_development: {
    personality_based_focus: string;
    development_areas: DevelopmentArea[];
  };
  growth_trajectory: {
    timeline: string;
    target_position: string;
    probability_factors: string[];
  };
}

const LOADING_MESSAGES = [
  "Analyzing your success trajectory...",
  "Building your 90-day onboarding plan...",
  "Mapping leadership development paths...",
  "Calculating growth probabilities...",
  "Finalizing your career roadmap..."
];

export default function SuccessGrowth() {
  const { user, profile, loading, subscription } = useAuth();
  const navigate = useNavigate();
  
  const [growthData, setGrowthData] = useState<SuccessGrowthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [activePhase, setActivePhase] = useState('days_1_30');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user && subscription.tier === 'free') {
      navigate('/paywall');
    }
  }, [loading, user, subscription, navigate]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const { data: strategy } = await supabase
          .from('career_strategies')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (strategy?.skill_development_plan) {
          const plan = strategy.skill_development_plan as any;
          if (plan.success_and_growth) {
            setGrowthData(plan.success_and_growth);
          }
        }

        // Load completed actions from localStorage
        const saved = localStorage.getItem(`success_growth_completed_${user.id}`);
        if (saved) {
          setCompletedActions(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading growth data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const generateGrowthPlan = async () => {
    if (!user) return;
    setIsGenerating(true);
    setLoadingProgress(0);

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[messageIndex]);
    }, 2000);

    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const [mbtiRes, discRes, strengthsRes, strategyRes] = await Promise.all([
        supabase.from('mbti_assessments').select('result').eq('user_id', user.id).eq('is_complete', true).maybeSingle(),
        supabase.from('disc_assessments').select('result').eq('user_id', user.id).eq('is_complete', true).maybeSingle(),
        supabase.from('strengths_assessments').select('result').eq('user_id', user.id).eq('is_complete', true).maybeSingle(),
        supabase.from('career_strategies').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      ]);

      const careerGoals = strategyRes.data?.career_goals as any;

      const { data, error } = await supabase.functions.invoke('generate-interview-growth', {
        body: {
          career_goal: careerGoals?.career_goal || 'Career acceleration',
          target_role: careerGoals?.target_role || 'Senior Role',
          mbti_result: mbtiRes.data?.result,
          disc_result: discRes.data?.result,
          strengths_result: strengthsRes.data?.result,
          verified_artifacts: []
        }
      });

      clearInterval(messageInterval);
      clearInterval(progressInterval);
      setLoadingProgress(100);

      if (error) throw error;

      if (data.step_8_success_and_growth) {
        setGrowthData(data.step_8_success_and_growth);

        // Save to career_strategies
        if (strategyRes.data) {
          const existingPlan = strategyRes.data.skill_development_plan as any || {};
          await supabase
            .from('career_strategies')
            .update({
              skill_development_plan: {
                ...existingPlan,
                success_and_growth: data.step_8_success_and_growth
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', strategyRes.data.id);
        }

        toast.success('Growth plan generated!');
      }
    } catch (error: any) {
      console.error('Error generating growth plan:', error);
      if (error.message?.includes('429')) {
        toast.error('Rate limit reached. Please try again in a moment.');
      } else if (error.message?.includes('402')) {
        toast.error('Usage limit reached. Please upgrade your plan.');
      } else {
        toast.error('Failed to generate growth plan');
      }
    } finally {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  const toggleCompleted = (id: string) => {
    const updated = completedActions.includes(id)
      ? completedActions.filter(i => i !== id)
      : [...completedActions, id];
    setCompletedActions(updated);
    localStorage.setItem(`success_growth_completed_${user?.id}`, JSON.stringify(updated));
  };

  const getTotalActions = () => {
    if (!growthData) return 0;
    const { days_1_30, days_31_60, days_61_90 } = growthData.onboarding_plan;
    return days_1_30.key_actions.length + days_31_60.key_actions.length + days_61_90.key_actions.length;
  };

  const completionPercentage = growthData ? Math.round((completedActions.length / getTotalActions()) * 100) : 0;

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-background">
        <UserHeader />
        <div className="container max-w-2xl mx-auto py-20 px-4">
          <div className="text-center space-y-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Rocket className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-semibold">Building Your Growth Trajectory</h2>
              <p className="text-muted-foreground">{loadingMessage}</p>
            </div>
            <Progress value={loadingProgress} className="h-2" />
          </div>
        </div>
      </div>
    );
  }

  if (!growthData) {
    return (
      <div className="min-h-screen bg-background">
        <UserHeader />
        <div className="container max-w-2xl mx-auto py-20 px-4">
          <Card className="border-2 border-dashed">
            <CardContent className="py-16 text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-serif font-semibold">Success & Continuous Growth</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Generate your 90-day onboarding plan and leadership development track.
                </p>
              </div>
              <Button onClick={generateGrowthPlan} size="lg" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Growth Plan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const renderPhaseContent = (phase: OnboardingPhase, phaseKey: string, phaseNumber: number) => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="font-bold text-primary">{phaseNumber}</span>
        </div>
        <div>
          <h3 className="font-semibold">{phase.theme}</h3>
          <p className="text-sm text-muted-foreground">Days {phaseNumber === 1 ? '1-30' : phaseNumber === 2 ? '31-60' : '61-90'}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            Objectives
          </h4>
          <ul className="space-y-2">
            {phase.objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
            <Briefcase className="w-4 h-4 text-primary" />
            Key Actions
          </h4>
          <ul className="space-y-3">
            {phase.key_actions.map((action, i) => {
              const actionId = `${phaseKey}-action-${i}`;
              return (
                <li key={i} className="flex items-start gap-3">
                  <button
                    onClick={() => toggleCompleted(actionId)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
                      completedActions.includes(actionId)
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {completedActions.includes(actionId) && (
                      <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                    )}
                  </button>
                  <span className={completedActions.includes(actionId) ? 'text-muted-foreground line-through' : ''}>
                    {action}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <UserHeader />
      
      <main className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
        {/* Success Banner */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
          <CardContent className="py-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <Crown className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center md:text-left flex-1">
                <Badge className="mb-2">Step 8 • Continuous Growth</Badge>
                <h1 className="text-2xl md:text-3xl font-serif font-semibold">{growthData.status_message}</h1>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{completionPercentage}%</div>
                <div className="text-sm text-muted-foreground">Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Growth Trajectory */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Growth Trajectory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <Clock className="w-6 h-6 mx-auto text-primary mb-2" />
                <div className="text-lg font-bold">{growthData.growth_trajectory.timeline}</div>
                <div className="text-sm text-muted-foreground">Timeline</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <Star className="w-6 h-6 mx-auto text-primary mb-2" />
                <div className="text-lg font-bold">{growthData.growth_trajectory.target_position}</div>
                <div className="text-sm text-muted-foreground">Target Position</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm font-medium mb-2">Success Factors</div>
                <ul className="space-y-1">
                  {growthData.growth_trajectory.probability_factors.map((factor, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-1">
                      <CheckCircle2 className="w-3 h-3 text-primary mt-1 shrink-0" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 90-Day Onboarding Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              90-Day Onboarding Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activePhase} onValueChange={setActivePhase}>
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="days_1_30" className="gap-1">
                  <span className="hidden sm:inline">Days</span> 1-30
                </TabsTrigger>
                <TabsTrigger value="days_31_60" className="gap-1">
                  <span className="hidden sm:inline">Days</span> 31-60
                </TabsTrigger>
                <TabsTrigger value="days_61_90" className="gap-1">
                  <span className="hidden sm:inline">Days</span> 61-90
                </TabsTrigger>
              </TabsList>
              <TabsContent value="days_1_30">
                {renderPhaseContent(growthData.onboarding_plan.days_1_30, 'days_1_30', 1)}
              </TabsContent>
              <TabsContent value="days_31_60">
                {renderPhaseContent(growthData.onboarding_plan.days_31_60, 'days_31_60', 2)}
              </TabsContent>
              <TabsContent value="days_61_90">
                {renderPhaseContent(growthData.onboarding_plan.days_61_90, 'days_61_90', 3)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Leadership Development */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Leadership Development
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
              <Brain className="w-5 h-5 text-primary mt-0.5" />
              <p className="text-sm">{growthData.leadership_development.personality_based_focus}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {growthData.leadership_development.development_areas.map((area, i) => (
                <Card key={i} className="border-border">
                  <CardContent className="p-4 space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      {area.area}
                    </h4>
                    <p className="text-sm text-muted-foreground">{area.why_important}</p>
                    <ul className="space-y-1">
                      {area.actions.map((action, j) => (
                        <li key={j} className="text-sm flex items-start gap-2">
                          <CheckCircle2 className="w-3 h-3 text-primary mt-1 shrink-0" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => navigate('/interview-prep')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Interview Prep
          </Button>
          <Button onClick={() => navigate('/human-coaching')} className="gap-2">
            Connect with Coach
            <Users className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
