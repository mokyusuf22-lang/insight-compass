import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { UserHeader } from '@/components/UserHeader';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  ArrowRight, 
  ChevronDown,
  Target,
  Lightbulb,
  FileCheck,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Brain,
  BookOpen
} from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

interface SkillCluster {
  cluster_name: string;
  skills: string[];
}

interface SkillPhase {
  phase: string;
  duration: string;
  skill_clusters: SkillCluster[];
  proof_artifacts: string[];
  exit_criteria: string;
  personality_execution_notes: string;
}

interface SkillDevelopmentPlan {
  skill_development_plan: SkillPhase[];
}

interface CareerStrategy {
  success_likelihood: string;
  estimated_timeline_months: number;
  insight: string;
  roadmap: { phase: string; duration_months: string; focus: string }[];
  execution_rules: string[];
  risk_factors: string[];
}

export default function SkillDevelopmentPlan() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  
  const [skillPlan, setSkillPlan] = useState<SkillDevelopmentPlan | null>(null);
  const [strategy, setStrategy] = useState<CareerStrategy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [openPhases, setOpenPhases] = useState<number[]>([0]);
  const [profileData, setProfileData] = useState<{
    mbti: any;
    disc: any;
    strengths: any;
    goals: any;
    strategyId: string | null;
  } | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (!profile?.has_paid) {
        navigate('/paywall');
      }
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        const { data: strategyData } = await supabase
          .from('career_strategies')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (strategyData) {
          setStrategy(strategyData.strategy as unknown as CareerStrategy);
          setProfileData({
            mbti: strategyData.mbti_result,
            disc: strategyData.disc_result,
            strengths: strategyData.strengths_result,
            goals: strategyData.career_goals,
            strategyId: strategyData.id,
          });

          if (strategyData.skill_development_plan) {
            setSkillPlan(strategyData.skill_development_plan as unknown as SkillDevelopmentPlan);
          }
        } else {
          toast.error('Please generate your career strategy first');
          navigate('/strategy');
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
  }, [user, navigate]);

  const generateSkillPlan = async () => {
    if (!profileData || !strategy) return;
    
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-skill-plan', {
        body: {
          career_strategy: strategy,
          mbti_result: profileData.mbti,
          disc_result: profileData.disc,
          strengths_result: profileData.strengths,
          career_goals: profileData.goals,
        },
      });

      if (error) throw error;

      if (data?.skill_plan) {
        setSkillPlan(data.skill_plan);
        
        // Save to database
        if (profileData.strategyId) {
          await supabase
            .from('career_strategies')
            .update({
              skill_development_plan: data.skill_plan as unknown as Json,
              updated_at: new Date().toISOString(),
            })
            .eq('id', profileData.strategyId);
        }

        toast.success('Skill development plan generated!');
      }
    } catch (error: any) {
      console.error('Error generating skill plan:', error);
      if (error.message?.includes('429') || error.status === 429) {
        toast.error('Rate limit exceeded. Please try again in a moment.');
      } else if (error.message?.includes('402') || error.status === 402) {
        toast.error('Please add credits to continue using AI features.');
      } else {
        toast.error('Failed to generate skill plan');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePhase = (index: number) => {
    setOpenPhases(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading skill plan..." />
      </div>
    );
  }

  if (!skillPlan) {
    return (
      <div className="min-h-screen bg-background">
        <UserHeader />
        <main className="container max-w-3xl py-8 px-4 md:px-8">
          <div className="text-center animate-fade-up">
            <div className="inline-flex items-center justify-center p-3 chamfer bg-primary/10 mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
              Generate Your Skill Development Plan
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Convert your career strategy into concrete skills, proof artifacts, and measurable milestones.
            </p>

            {strategy ? (
              <div className="space-y-6">
                <div className="chamfer bg-card p-6 text-left">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Your Career Roadmap ({strategy.roadmap.length} phases)
                  </h3>
                  <div className="space-y-2">
                    {strategy.roadmap.map((phase, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="text-xs">
                          {index + 1}
                        </Badge>
                        <span className="font-medium">{phase.phase}</span>
                        <span className="text-muted-foreground">
                          (Months {phase.duration_months})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  size="lg" 
                  onClick={generateSkillPlan}
                  disabled={isGenerating}
                  className="gradient-primary text-primary-foreground rounded-full"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating Plan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Skill Plan
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground mb-4">
                  You need to generate your career strategy first.
                </p>
                <Button onClick={() => navigate('/strategy')} className="rounded-full">
                  Go to Strategy
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  const totalSkills = skillPlan.skill_development_plan.reduce(
    (acc, phase) => acc + phase.skill_clusters.reduce((a, c) => a + c.skills.length, 0),
    0
  );
  const totalArtifacts = skillPlan.skill_development_plan.reduce(
    (acc, phase) => acc + phase.proof_artifacts.length,
    0
  );

  return (
    <div className="min-h-screen bg-background">
      <UserHeader />

      <main className="container max-w-3xl py-8 px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-up">
          <div className="inline-flex items-center justify-center p-3 chamfer bg-primary/10 mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
            Your Skill Development Plan
          </h1>
          <p className="text-muted-foreground">
            {profileData?.goals?.current_role || 'Current Role'} → {profileData?.goals?.target_role || 'Target Role'}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8 animate-fade-up" style={{ animationDelay: '50ms' }}>
          <div className="chamfer bg-card p-4 text-center">
            <div className="text-2xl font-bold text-primary">{skillPlan.skill_development_plan.length}</div>
            <div className="text-sm text-muted-foreground">Phases</div>
          </div>
          <div className="chamfer bg-card p-4 text-center">
            <div className="text-2xl font-bold text-primary">{totalSkills}</div>
            <div className="text-sm text-muted-foreground">Skills to Build</div>
          </div>
          <div className="chamfer bg-card p-4 text-center">
            <div className="text-2xl font-bold text-primary">{totalArtifacts}</div>
            <div className="text-sm text-muted-foreground">Proof Artifacts</div>
          </div>
        </div>

        {/* Phases */}
        <div className="space-y-4 animate-fade-up" style={{ animationDelay: '100ms' }}>
          {skillPlan.skill_development_plan.map((phase, index) => (
            <Collapsible
              key={index}
              open={openPhases.includes(index)}
              onOpenChange={() => togglePhase(index)}
            >
              <div className="chamfer bg-card overflow-hidden">
                <CollapsibleTrigger asChild>
                  <div className="cursor-pointer hover:bg-muted/50 transition-colors p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 chamfer-sm bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{index + 1}</span>
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-semibold">{phase.phase}</h3>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {phase.duration}
                          </Badge>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${openPhases.includes(index) ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="p-4 pt-0 space-y-6">
                    {/* Skill Clusters */}
                    <div>
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                        <Target className="w-4 h-4 text-primary" />
                        Skill Clusters
                      </h4>
                      <div className="space-y-4">
                        {phase.skill_clusters.map((cluster, cIndex) => (
                          <div key={cIndex} className="pl-4 border-l-2 border-primary/20">
                            <h5 className="font-medium text-sm mb-2">{cluster.cluster_name}</h5>
                            <ul className="space-y-1">
                              {cluster.skills.map((skill, sIndex) => (
                                <li key={sIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-primary/50 mt-2 flex-shrink-0 chamfer-sm" />
                                  {skill}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Proof Artifacts */}
                    <div>
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                        <FileCheck className="w-4 h-4 text-green-500" />
                        Proof Artifacts
                      </h4>
                      <ul className="space-y-2">
                        {phase.proof_artifacts.map((artifact, aIndex) => (
                          <li key={aIndex} className="text-sm flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {artifact}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Exit Criteria */}
                    <div className="chamfer-sm p-4 bg-muted/50">
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        Exit Criteria
                      </h4>
                      <p className="text-sm">{phase.exit_criteria}</p>
                    </div>

                    {/* Personality Notes */}
                    <div className="chamfer-sm p-4 bg-primary/5">
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-primary" />
                        Execution Notes (Based on Your Profile)
                      </h4>
                      <p className="text-sm text-muted-foreground">{phase.personality_execution_notes}</p>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 animate-fade-up" style={{ animationDelay: '150ms' }}>
          <Button 
            variant="outline"
            onClick={() => navigate('/strategy')}
            className="rounded-full"
          >
            Back to Strategy
          </Button>
          <Button 
            onClick={() => navigate('/weekly')}
            className="gradient-primary text-primary-foreground rounded-full"
          >
            Start Weekly Execution
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </main>
    </div>
  );
}
