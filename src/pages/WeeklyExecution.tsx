import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { UserHeader } from '@/components/UserHeader';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  ArrowRight, 
  Calendar,
  Clock,
  Target,
  CheckCircle2,
  Circle,
  Sparkles,
  RefreshCw,
  Brain,
  ChevronRight,
  Trophy
} from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

interface Task {
  id: number;
  title: string;
  description: string;
  skill_cluster: string;
  success_condition: string;
  estimated_hours: number;
  priority: 'high' | 'medium' | 'low';
}

interface WeeklyPlan {
  week_focus: string;
  tasks: Task[];
  coaching_note: string;
  phase_progress_indicator: string;
}

interface SkillPhase {
  phase: string;
  duration: string;
  skill_clusters: { cluster_name: string; skills: string[] }[];
  proof_artifacts: string[];
  exit_criteria: string;
  personality_execution_notes: string;
}

export default function WeeklyExecution() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [weekNumber, setWeekNumber] = useState(1);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [strategyData, setStrategyData] = useState<{
    id: string;
    skillPlan: { skill_development_plan: SkillPhase[] } | null;
    mbti: any;
    disc: any;
    strengths: any;
    goals: any;
  } | null>(null);
  const [existingPlanId, setExistingPlanId] = useState<string | null>(null);

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
        // Load strategy with skill plan
        const { data: strategy } = await supabase
          .from('career_strategies')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!strategy?.skill_development_plan) {
          toast.error('Please generate your skill development plan first');
          navigate('/skill-plan');
          return;
        }

        setStrategyData({
          id: strategy.id,
          skillPlan: strategy.skill_development_plan as unknown as { skill_development_plan: SkillPhase[] },
          mbti: strategy.mbti_result,
          disc: strategy.disc_result,
          strengths: strategy.strengths_result,
          goals: strategy.career_goals,
        });

        // Check for existing weekly plan
        const { data: existingPlan } = await supabase
          .from('weekly_execution_plans')
          .select('*')
          .eq('user_id', user.id)
          .eq('strategy_id', strategy.id)
          .order('week_number', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingPlan) {
          setWeeklyPlan(existingPlan.tasks as unknown as WeeklyPlan);
          setCompletedTasks((existingPlan.completed_tasks as number[]) || []);
          setWeekNumber(existingPlan.week_number);
          setCurrentPhaseIndex(
            (strategy.skill_development_plan as any)?.skill_development_plan?.findIndex(
              (p: any) => p.phase === existingPlan.current_phase
            ) || 0
          );
          setExistingPlanId(existingPlan.id);
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

  const generateWeeklyPlan = async (isNewWeek = false) => {
    if (!strategyData) return;
    
    setIsGenerating(true);
    
    try {
      const newWeekNumber = isNewWeek ? weekNumber + 1 : weekNumber;
      
      const { data, error } = await supabase.functions.invoke('generate-weekly-plan', {
        body: {
          skill_development_plan: strategyData.skillPlan,
          current_phase_index: currentPhaseIndex,
          completed_skills: [], // Could track completed skills here
          mbti_result: strategyData.mbti,
          disc_result: strategyData.disc,
          strengths_result: strategyData.strengths,
          career_goals: strategyData.goals,
          week_number: newWeekNumber,
        },
      });

      if (error) throw error;

      if (data?.weekly_plan) {
        setWeeklyPlan(data.weekly_plan);
        setCompletedTasks([]);
        setWeekNumber(newWeekNumber);
        
        // Save to database
        const currentPhase = strategyData.skillPlan?.skill_development_plan?.[currentPhaseIndex];
        
        const planData = {
          user_id: user!.id,
          strategy_id: strategyData.id,
          week_number: newWeekNumber,
          week_start_date: new Date().toISOString().split('T')[0],
          current_phase: currentPhase?.phase || 'Unknown',
          tasks: data.weekly_plan as unknown as Json,
          completed_tasks: [] as unknown as Json,
          coaching_notes: data.weekly_plan.coaching_note,
        };

        if (existingPlanId && !isNewWeek) {
          await supabase
            .from('weekly_execution_plans')
            .update(planData)
            .eq('id', existingPlanId);
        } else {
          const { data: newPlan } = await supabase
            .from('weekly_execution_plans')
            .insert(planData)
            .select()
            .single();
          
          if (newPlan) {
            setExistingPlanId(newPlan.id);
          }
        }

        toast.success(isNewWeek ? 'New week generated!' : 'Weekly plan generated!');
      }
    } catch (error: any) {
      console.error('Error generating weekly plan:', error);
      if (error.message?.includes('429') || error.status === 429) {
        toast.error('Rate limit exceeded. Please try again in a moment.');
      } else if (error.message?.includes('402') || error.status === 402) {
        toast.error('Please add credits to continue using AI features.');
      } else {
        toast.error('Failed to generate weekly plan');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTaskComplete = async (taskId: number) => {
    const newCompleted = completedTasks.includes(taskId)
      ? completedTasks.filter(id => id !== taskId)
      : [...completedTasks, taskId];
    
    setCompletedTasks(newCompleted);
    
    // Save to database
    if (existingPlanId) {
      await supabase
        .from('weekly_execution_plans')
        .update({
          completed_tasks: newCompleted as unknown as Json,
          is_complete: weeklyPlan ? newCompleted.length === weeklyPlan.tasks.length : false,
        })
        .eq('id', existingPlanId);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-500/10';
      case 'medium': return 'text-amber-500 bg-amber-500/10';
      case 'low': return 'text-green-500 bg-green-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const totalHours = weeklyPlan?.tasks.reduce((acc, t) => acc + t.estimated_hours, 0) || 0;
  const completedHours = weeklyPlan?.tasks
    .filter(t => completedTasks.includes(t.id))
    .reduce((acc, t) => acc + t.estimated_hours, 0) || 0;
  const progressPercent = weeklyPlan ? (completedTasks.length / weeklyPlan.tasks.length) * 100 : 0;

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading weekly plan..." />
      </div>
    );
  }

  const currentPhase = strategyData?.skillPlan?.skill_development_plan?.[currentPhaseIndex];

  if (!weeklyPlan) {
    return (
      <div className="min-h-screen bg-background">
        <UserHeader />
        <main className="container max-w-3xl py-8 px-4 md:px-8">
          <div className="text-center animate-fade-up">
            <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary/10 mb-4">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
              Weekly Execution Planner
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Get your personalized tasks for the week based on your skill development plan.
            </p>

            {currentPhase && (
              <Card className="text-left mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Current Phase: {currentPhase.phase}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">{currentPhase.duration}</p>
                  <p className="text-sm">{currentPhase.exit_criteria}</p>
                </CardContent>
              </Card>
            )}

            <Button 
              size="lg" 
              onClick={() => generateWeeklyPlan(false)}
              disabled={isGenerating}
              className="gradient-primary text-primary-foreground"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate This Week's Plan
                </>
              )}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <UserHeader />

      <main className="container max-w-3xl py-8 px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-6 animate-fade-up">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary/10 mb-4">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">
            Week {weekNumber}
          </h1>
          <Badge variant="secondary" className="mb-3">
            {currentPhase?.phase} • {weeklyPlan.phase_progress_indicator}
          </Badge>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {weeklyPlan.week_focus}
          </p>
        </div>

        {/* Progress Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-6 animate-fade-up" style={{ animationDelay: '50ms' }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="font-bold">{completedTasks.length}/{weeklyPlan.tasks.length}</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Hours</div>
                <div className="font-bold">{completedHours}/{totalHours}h</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              {progressPercent === 100 ? (
                <Trophy className="w-5 h-5 text-amber-500" />
              ) : (
                <Target className="w-5 h-5 text-primary" />
              )}
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="font-bold">
                  {progressPercent === 100 ? 'Complete!' : 'In Progress'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coaching Note */}
        <Card className="mb-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Coaching Note</h4>
                <p className="text-sm text-muted-foreground">{weeklyPlan.coaching_note}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks */}
        <div className="space-y-3 animate-fade-up" style={{ animationDelay: '150ms' }}>
          <h3 className="font-semibold flex items-center gap-2">
            <Target className="w-4 h-4" />
            This Week's Tasks
          </h3>
          
          {weeklyPlan.tasks.map((task) => {
            const isComplete = completedTasks.includes(task.id);
            
            return (
              <Card 
                key={task.id} 
                className={`transition-all ${isComplete ? 'opacity-75 bg-muted/30' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isComplete}
                      onCheckedChange={() => toggleTaskComplete(task.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className={`font-medium ${isComplete ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h4>
                        <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {task.estimated_hours}h
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {task.skill_cluster}
                        </span>
                      </div>
                      <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                        <span className="font-medium">✓ Success: </span>
                        {task.success_condition}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <Button 
            variant="outline"
            onClick={() => navigate('/skill-plan')}
          >
            View Skill Plan
          </Button>
          {progressPercent === 100 && (
            <Button 
              onClick={() => generateWeeklyPlan(true)}
              disabled={isGenerating}
              className="gradient-primary text-primary-foreground"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Start Next Week
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
          <Button 
            variant="ghost"
            onClick={() => generateWeeklyPlan(false)}
            disabled={isGenerating}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
        </div>
      </main>
    </div>
  );
}
