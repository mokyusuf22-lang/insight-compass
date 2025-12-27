import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserHeader } from '@/components/UserHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import {
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Target,
  MessageSquare,
  Shield,
  CheckCircle2,
  Briefcase,
  Brain,
  Sparkles,
  Loader2,
  AlertCircle,
  Clock
} from 'lucide-react';

interface STARExample {
  skill: string;
  scenario_title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  evidence: string;
}

interface StrategicScenario {
  title: string;
  question: string;
  approach: string;
}

interface ConfidenceFramework {
  approach: string;
  rules: string[];
  personality_note: string;
}

interface InterviewPrepData {
  duration_weeks: string;
  focus_areas: string[];
  star_examples: STARExample[];
  strategic_scenarios: StrategicScenario[];
  confidence_framework: ConfidenceFramework;
  pass_criteria: string[];
}

const LOADING_MESSAGES = [
  "Analyzing your personality profile...",
  "Mapping strengths to interview scenarios...",
  "Building STAR frameworks...",
  "Crafting strategic responses...",
  "Personalizing confidence strategies...",
  "Finalizing your interview toolkit..."
];

export default function InterviewPreparation() {
  const { user, profile, loading, subscription } = useAuth();
  const navigate = useNavigate();
  
  const [interviewPrep, setInterviewPrep] = useState<InterviewPrepData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [openStars, setOpenStars] = useState<string[]>([]);
  const [openScenarios, setOpenScenarios] = useState<string[]>([]);
  const [completedItems, setCompletedItems] = useState<string[]>([]);

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
        // Check for existing interview prep data
        const { data: strategy } = await supabase
          .from('career_strategies')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (strategy?.skill_development_plan) {
          const plan = strategy.skill_development_plan as any;
          if (plan.interview_preparation) {
            setInterviewPrep(plan.interview_preparation);
          }
        }

        // Load completed items from localStorage
        const saved = localStorage.getItem(`interview_prep_completed_${user.id}`);
        if (saved) {
          setCompletedItems(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading interview data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const generateInterviewPrep = async () => {
    if (!user) return;
    setIsGenerating(true);
    setLoadingProgress(0);

    // Loading animation
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
      // Get user data
      const [mbtiRes, discRes, strengthsRes, strategyRes] = await Promise.all([
        supabase.from('mbti_assessments').select('result').eq('user_id', user.id).eq('is_complete', true).maybeSingle(),
        supabase.from('disc_assessments').select('result').eq('user_id', user.id).eq('is_complete', true).maybeSingle(),
        supabase.from('strengths_assessments').select('result').eq('user_id', user.id).eq('is_complete', true).maybeSingle(),
        supabase.from('career_strategies').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      ]);

      const careerGoals = strategyRes.data?.career_goals as any;

      const { data, error } = await supabase.functions.invoke('generate-interview-growth', {
        body: {
          career_goal: 'Get a new job',
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

      if (data.step_7_interview_preparation) {
        setInterviewPrep(data.step_7_interview_preparation);

        // Save to career_strategies
        if (strategyRes.data) {
          const existingPlan = strategyRes.data.skill_development_plan as any || {};
          await supabase
            .from('career_strategies')
            .update({
              skill_development_plan: {
                ...existingPlan,
                interview_preparation: data.step_7_interview_preparation,
                success_and_growth: data.step_8_success_and_growth
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', strategyRes.data.id);
        }

        toast.success('Interview preparation plan generated!');
      }
    } catch (error: any) {
      console.error('Error generating interview prep:', error);
      if (error.message?.includes('429')) {
        toast.error('Rate limit reached. Please try again in a moment.');
      } else if (error.message?.includes('402')) {
        toast.error('Usage limit reached. Please upgrade your plan.');
      } else {
        toast.error('Failed to generate interview preparation');
      }
    } finally {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  const toggleCompleted = (id: string) => {
    const updated = completedItems.includes(id)
      ? completedItems.filter(i => i !== id)
      : [...completedItems, id];
    setCompletedItems(updated);
    localStorage.setItem(`interview_prep_completed_${user?.id}`, JSON.stringify(updated));
  };

  const completionPercentage = interviewPrep
    ? Math.round((completedItems.length / (interviewPrep.star_examples.length + interviewPrep.strategic_scenarios.length + interviewPrep.pass_criteria.length)) * 100)
    : 0;

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
              <Brain className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-semibold">Building Your Interview Arsenal</h2>
              <p className="text-muted-foreground">{loadingMessage}</p>
            </div>
            <Progress value={loadingProgress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              This may take a moment as we craft personalized strategies...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!interviewPrep) {
    return (
      <div className="min-h-screen bg-background">
        <UserHeader />
        <div className="container max-w-2xl mx-auto py-20 px-4">
          <Card className="border-2 border-dashed">
            <CardContent className="py-16 text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-serif font-semibold">Interview Preparation</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Generate a personalized interview toolkit based on your assessments and career goals.
                </p>
              </div>
              <Button onClick={generateInterviewPrep} size="lg" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Interview Prep
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <UserHeader />
      
      <main className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Step 7</span>
            <ArrowRight className="w-4 h-4" />
            <span className="text-foreground font-medium">Interview Preparation</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif font-semibold">Interview Preparation</h1>
              <p className="text-muted-foreground mt-1">
                {interviewPrep.duration_weeks} weeks • Evidence-based interview toolkit
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{completionPercentage}%</div>
                <div className="text-xs text-muted-foreground">Prepared</div>
              </div>
              <Progress value={completionPercentage} className="w-24 h-2" />
            </div>
          </div>
        </div>

        {/* Focus Areas */}
        <div className="flex flex-wrap gap-2">
          {interviewPrep.focus_areas.map((area, i) => (
            <Badge key={i} variant="secondary" className="text-sm">
              {area}
            </Badge>
          ))}
        </div>

        {/* STAR Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              STAR Examples
              <Badge variant="outline" className="ml-auto">
                {interviewPrep.star_examples.filter((_, i) => completedItems.includes(`star-${i}`)).length}/{interviewPrep.star_examples.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {interviewPrep.star_examples.map((star, i) => (
              <Collapsible
                key={i}
                open={openStars.includes(`star-${i}`)}
                onOpenChange={(open) => {
                  setOpenStars(open 
                    ? [...openStars, `star-${i}`] 
                    : openStars.filter(s => s !== `star-${i}`)
                  );
                }}
              >
                <div className="border rounded-lg overflow-hidden">
                  <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompleted(`star-${i}`);
                        }}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          completedItems.includes(`star-${i}`)
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {completedItems.includes(`star-${i}`) && (
                          <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                        )}
                      </button>
                      <div className="text-left">
                        <div className="font-medium">{star.skill}</div>
                        <div className="text-sm text-muted-foreground">{star.scenario_title}</div>
                      </div>
                    </div>
                    {openStars.includes(`star-${i}`) ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 pt-0 space-y-4 border-t bg-muted/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Situation</div>
                          <p className="text-sm">{star.situation}</p>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Task</div>
                          <p className="text-sm">{star.task}</p>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Action</div>
                          <p className="text-sm">{star.action}</p>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Result</div>
                          <p className="text-sm">{star.result}</p>
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Evidence</div>
                        <p className="text-sm text-muted-foreground">{star.evidence}</p>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </CardContent>
        </Card>

        {/* Strategic Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Strategic Scenarios
              <Badge variant="outline" className="ml-auto">
                {interviewPrep.strategic_scenarios.filter((_, i) => completedItems.includes(`scenario-${i}`)).length}/{interviewPrep.strategic_scenarios.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {interviewPrep.strategic_scenarios.map((scenario, i) => (
              <Collapsible
                key={i}
                open={openScenarios.includes(`scenario-${i}`)}
                onOpenChange={(open) => {
                  setOpenScenarios(open 
                    ? [...openScenarios, `scenario-${i}`] 
                    : openScenarios.filter(s => s !== `scenario-${i}`)
                  );
                }}
              >
                <div className="border rounded-lg overflow-hidden">
                  <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompleted(`scenario-${i}`);
                        }}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          completedItems.includes(`scenario-${i}`)
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {completedItems.includes(`scenario-${i}`) && (
                          <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                        )}
                      </button>
                      <div className="font-medium text-left">{scenario.title}</div>
                    </div>
                    {openScenarios.includes(`scenario-${i}`) ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 pt-0 space-y-3 border-t bg-muted/30">
                      <div>
                        <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Question</div>
                        <p className="text-sm font-medium">{scenario.question}</p>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Your Approach</div>
                        <p className="text-sm text-muted-foreground">{scenario.approach}</p>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </CardContent>
        </Card>

        {/* Confidence Framework */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Confidence Framework
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-2">Communication Approach</div>
              <p className="text-muted-foreground">{interviewPrep.confidence_framework.approach}</p>
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Key Rules</div>
              <ul className="space-y-2">
                {interviewPrep.confidence_framework.rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-start gap-2">
                <Brain className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground italic">
                  {interviewPrep.confidence_framework.personality_note}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pass Criteria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Pass Criteria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {interviewPrep.pass_criteria.map((criterion, i) => (
                <li key={i} className="flex items-start gap-3">
                  <button
                    onClick={() => toggleCompleted(`criteria-${i}`)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
                      completedItems.includes(`criteria-${i}`)
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {completedItems.includes(`criteria-${i}`) && (
                      <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                    )}
                  </button>
                  <span className={completedItems.includes(`criteria-${i}`) ? 'text-muted-foreground line-through' : ''}>
                    {criterion}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => navigate('/path')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Skill Path
          </Button>
          <Button onClick={() => navigate('/success-growth')} className="gap-2">
            Continue to Success & Growth
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
