import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { UserHeader } from '@/components/UserHeader';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  ArrowRight, 
  TrendingUp, 
  Calendar, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

interface RoadmapPhase {
  phase: string;
  duration_months: string;
  focus: string;
}

interface CareerStrategy {
  success_likelihood: string;
  estimated_timeline_months: number;
  insight: string;
  roadmap: RoadmapPhase[];
  execution_rules: string[];
  risk_factors: string[];
}

export default function CareerStrategy() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  
  const [strategy, setStrategy] = useState<CareerStrategy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [profileData, setProfileData] = useState<{
    mbti: any;
    disc: any;
    strengths: any;
    goals: any;
  } | null>(null);

  // Redirect if not authenticated or not paid
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (!profile?.has_paid) {
        navigate('/paywall');
      }
    }
  }, [user, profile, loading, navigate]);

  // Load existing strategy or user data
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        // Check for existing strategy
        const { data: strategyData } = await supabase
          .from('career_strategies')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (strategyData?.strategy) {
          setStrategy(strategyData.strategy as unknown as CareerStrategy);
          setProfileData({
            mbti: strategyData.mbti_result,
            disc: strategyData.disc_result,
            strengths: strategyData.strengths_result,
            goals: strategyData.career_goals,
          });
        } else {
          // Load assessment data to generate strategy
          const [mbtiRes, discRes, strengthsRes, profileRes] = await Promise.all([
            supabase
              .from('mbti_assessments')
              .select('result')
              .eq('user_id', user.id)
              .eq('is_complete', true)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from('disc_assessments')
              .select('result')
              .eq('user_id', user.id)
              .eq('is_complete', true)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from('strengths_assessments')
              .select('result')
              .eq('user_id', user.id)
              .eq('is_complete', true)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from('profiles')
              .select('career_goals')
              .eq('user_id', user.id)
              .single(),
          ]);

          setProfileData({
            mbti: mbtiRes.data?.result,
            disc: discRes.data?.result,
            strengths: strengthsRes.data?.result,
            goals: profileRes.data?.career_goals,
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const generateStrategy = async () => {
    if (!profileData) return;
    
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-strategy', {
        body: {
          mbti_result: profileData.mbti,
          disc_result: profileData.disc,
          strengths_result: profileData.strengths,
          career_goals: profileData.goals,
        },
      });

      if (error) throw error;

      if (data?.strategy) {
        setStrategy(data.strategy);
        
        // Save to database
        await supabase
          .from('career_strategies')
          .insert({
            user_id: user!.id,
            mbti_result: profileData.mbti as unknown as Json,
            disc_result: profileData.disc as unknown as Json,
            strengths_result: profileData.strengths as unknown as Json,
            career_goals: profileData.goals as unknown as Json,
            strategy: data.strategy as unknown as Json,
          });

        // Update profile flag
        await supabase
          .from('profiles')
          .update({ strategy_generated: true })
          .eq('user_id', user!.id);

        toast.success('Strategy generated successfully!');
      }
    } catch (error: any) {
      console.error('Error generating strategy:', error);
      if (error.message?.includes('429') || error.status === 429) {
        toast.error('Rate limit exceeded. Please try again in a moment.');
      } else if (error.message?.includes('402') || error.status === 402) {
        toast.error('Please add credits to continue using AI features.');
      } else {
        toast.error('Failed to generate strategy');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = profileData?.mbti && profileData?.disc && profileData?.strengths && profileData?.goals?.target_role;

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading strategy..." />
      </div>
    );
  }

  // Show generation prompt if no strategy exists
  if (!strategy) {
    return (
      <div className="min-h-screen bg-background">
        <UserHeader />
        <main className="container max-w-3xl py-8 px-4 md:px-8">
          <div className="text-center animate-fade-up">
            <div className="inline-flex items-center justify-center p-3 chamfer bg-primary/10 mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
              Generate Your Career Strategy
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Based on your personality, behavioral tendencies, and strengths, we'll create a personalized career transition roadmap.
            </p>

            {!canGenerate ? (
              <div className="chamfer bg-card p-6 mb-8">
                <h3 className="font-semibold mb-4">Complete these assessments first:</h3>
                <div className="space-y-2 text-left max-w-sm mx-auto">
                  <div className="flex items-center gap-2">
                    {profileData?.mbti ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted" />
                    )}
                    <span>MBTI Assessment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {profileData?.disc ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted" />
                    )}
                    <span>DISC Assessment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {profileData?.strengths ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted" />
                    )}
                    <span>Strengths Assessment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {profileData?.goals?.target_role ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted" />
                    )}
                    <span>Career Goals</span>
                  </div>
                </div>
                <Button className="mt-6 rounded-full" onClick={() => navigate('/welcome')}>
                  Complete Assessments
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <Button 
                size="lg" 
                onClick={generateStrategy}
                disabled={isGenerating}
                className="gradient-primary text-primary-foreground rounded-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating Strategy...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate My Strategy
                  </>
                )}
              </Button>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Parse success likelihood percentage for display
  const likelihoodMatch = strategy.success_likelihood.match(/(\d+)/);
  const likelihoodValue = likelihoodMatch ? parseInt(likelihoodMatch[1]) : 75;

  return (
    <div className="min-h-screen bg-background">
      <UserHeader />

      <main className="container max-w-3xl py-8 px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-up">
          <div className="inline-flex items-center justify-center p-3 chamfer bg-primary/10 mb-4">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
            Your Career Strategy
          </h1>
          <p className="text-muted-foreground">
            {profileData?.goals?.current_role || 'Current Role'} → {profileData?.goals?.target_role || 'Target Role'}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 mb-8 animate-fade-up" style={{ animationDelay: '50ms' }}>
          <div className="chamfer bg-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Success Likelihood</span>
            </div>
            <p className="text-2xl font-bold text-primary mb-2">{strategy.success_likelihood}</p>
            <Progress value={likelihoodValue} className="h-2" />
          </div>
          <div className="chamfer bg-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Estimated Timeline</span>
            </div>
            <p className="text-2xl font-bold">{strategy.estimated_timeline_months} months</p>
            <p className="text-sm text-muted-foreground">{strategy.insight}</p>
          </div>
        </div>

        {/* Roadmap */}
        <div className="chamfer bg-card p-6 mb-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
            <Target className="w-5 h-5 text-primary" />
            Career Roadmap
          </h3>
          <div className="space-y-6">
            {strategy.roadmap.map((phase, index) => (
              <div key={index} className="relative pl-8 pb-6 last:pb-0">
                {/* Timeline line */}
                {index < strategy.roadmap.length - 1 && (
                  <div className="absolute left-3 top-8 w-0.5 h-full bg-border" />
                )}
                {/* Phase marker */}
                <div className="absolute left-0 top-1 w-6 h-6 chamfer-sm bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{index + 1}</span>
                </div>
                {/* Phase content */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{phase.phase}</h3>
                    <Badge variant="secondary" className="text-xs">
                      Months {phase.duration_months}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{phase.focus}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Execution Rules */}
        <div className="chamfer bg-card p-6 mb-6 animate-fade-up" style={{ animationDelay: '150ms' }}>
          <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Execution Rules (Based on Your Personality)
          </h3>
          <ul className="space-y-3">
            {strategy.execution_rules.map((rule, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Risk Factors */}
        <div className="chamfer bg-card p-6 mb-8 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Risk Factors to Monitor
          </h3>
          <ul className="space-y-3">
            {strategy.risk_factors.map((risk, index) => (
              <li key={index} className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-1 flex-shrink-0" />
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: '250ms' }}>
          <Button 
            variant="outline"
            onClick={() => navigate('/welcome')}
            className="rounded-full"
          >
            Back to Journey
          </Button>
          <Button 
            onClick={() => navigate('/skill-plan')}
            className="gradient-primary text-primary-foreground rounded-full"
          >
            Generate Skill Plan
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </main>
    </div>
  );
}
