import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { UserHeader } from '@/components/UserHeader';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { AICoachPanel } from '@/components/path/AICoachPanel';
import { PhaseSection } from '@/components/path/PhaseSection';
import { TodayFocus } from '@/components/path/TodayFocus';
import { 
  ArrowRight, 
  Sparkles,
  RefreshCw,
  Lock,
  Target,
  Clock
} from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

export interface PathTask {
  id: string;
  title: string;
  description: string;
  type: 'reading' | 'practice' | 'reflection' | 'project';
  estimatedMinutes: number;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  successCriteria: string;
}

export interface PathWeek {
  id: string;
  weekNumber: number;
  title: string;
  estimatedHours: number;
  status: 'locked' | 'not_started' | 'in_progress' | 'completed';
  tasks: PathTask[];
}

export interface PathPhase {
  id: string;
  phaseNumber: number;
  title: string;
  durationWeeks: string;
  goal: string;
  progress: number;
  weeks: PathWeek[];
}

export interface SkillPathData {
  title: string;
  description: string;
  totalProgress: number;
  phases: PathPhase[];
  todaysFocus?: {
    taskId: string;
    phaseId: string;
    weekId: string;
    reason: string;
  };
  recommendedNext?: PathTask[];
}

export interface UserProfile {
  mbtiType?: string;
  discStyle?: string;
  topStrengths?: string[];
  careerGoal?: string;
}

export default function SkillPath() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  
  const [pathData, setPathData] = useState<SkillPathData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{task: PathTask; phase: PathPhase; week: PathWeek} | null>(null);
  const [assessmentsComplete, setAssessmentsComplete] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

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
        // Load career strategy with all data
        const { data: strategyData } = await supabase
          .from('career_strategies')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Check if assessments are complete
        const { data: profileData } = await supabase
          .from('profiles')
          .select('mbti_completed, disc_completed, strengths_completed, career_goals')
          .eq('user_id', user.id)
          .single();

        const allComplete = profileData?.mbti_completed && 
                           profileData?.disc_completed && 
                           profileData?.strengths_completed;
        setAssessmentsComplete(allComplete || false);

        if (strategyData) {
          const mbti = strategyData.mbti_result as { type?: string } | null;
          const disc = strategyData.disc_result as { primaryStyle?: string } | null;
          const strengths = strategyData.strengths_result as { ranked_strengths?: { name: string }[] } | null;
          const goals = strategyData.career_goals as { target_role?: string } | null;

          setUserProfile({
            mbtiType: mbti?.type,
            discStyle: disc?.primaryStyle?.replace('High ', ''),
            topStrengths: strengths?.ranked_strengths?.slice(0, 3).map(s => s.name),
            careerGoal: goals?.target_role,
          });

          // Check for existing skill path
          if (strategyData.skill_development_plan) {
            const skillPlan = strategyData.skill_development_plan as any;
            
            // Load weekly execution plans for completion status
            const { data: weeklyPlans } = await supabase
              .from('weekly_execution_plans')
              .select('*')
              .eq('user_id', user.id)
              .order('week_number', { ascending: true });

            const completedTaskIds: string[] = [];
            weeklyPlans?.forEach(plan => {
              const tasks = plan.completed_tasks as string[] | null;
              if (tasks) {
                completedTaskIds.push(...tasks.map(t => String(t)));
              }
            });
            setCompletedTasks(completedTaskIds);

            // Convert existing skill plan to path format
            const convertedPath = convertSkillPlanToPath(
              strategyData.strategy as any,
              skillPlan,
              goals?.target_role || 'Career Transition',
              completedTaskIds
            );
            setPathData(convertedPath);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load skill path');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) loadData();
  }, [user, navigate]);

  const convertSkillPlanToPath = (
    strategy: any,
    skillPlan: any,
    targetRole: string,
    completedTaskIds: string[]
  ): SkillPathData => {
    const phases: PathPhase[] = (skillPlan.skill_development_plan || []).map((phase: any, phaseIdx: number) => {
      const weeks: PathWeek[] = phase.skill_clusters.map((cluster: any, weekIdx: number) => {
        const tasks: PathTask[] = cluster.skills.map((skill: string, taskIdx: number) => {
          const taskId = `phase${phaseIdx}-week${weekIdx}-task${taskIdx}`;
          const isCompleted = completedTaskIds.includes(taskId) || completedTaskIds.includes(String(taskIdx));
          const isFirstIncomplete = !isCompleted && taskIdx === 0;
          
          return {
            id: taskId,
            title: skill,
            description: `Develop competency in ${skill.toLowerCase()}`,
            type: taskIdx % 4 === 0 ? 'reading' : taskIdx % 4 === 1 ? 'practice' : taskIdx % 4 === 2 ? 'reflection' : 'project',
            estimatedMinutes: 30 + (taskIdx * 15),
            status: isCompleted ? 'completed' : (phaseIdx === 0 && weekIdx === 0) ? (isFirstIncomplete ? 'in_progress' : 'available') : 'locked',
            successCriteria: `Complete ${skill.toLowerCase()} task`,
          } as PathTask;
        });

        const completedInWeek = tasks.filter(t => t.status === 'completed').length;
        const weekStatus = completedInWeek === tasks.length ? 'completed' : 
                          completedInWeek > 0 ? 'in_progress' : 
                          (phaseIdx === 0 && weekIdx === 0) ? 'not_started' : 'locked';

        return {
          id: `phase${phaseIdx}-week${weekIdx}`,
          weekNumber: weekIdx + 1,
          title: cluster.cluster_name,
          estimatedHours: Math.ceil(tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0) / 60),
          status: weekStatus,
          tasks,
        } as PathWeek;
      });

      const totalTasks = weeks.reduce((sum, w) => sum + w.tasks.length, 0);
      const completedTasks = weeks.reduce((sum, w) => sum + w.tasks.filter(t => t.status === 'completed').length, 0);

      return {
        id: `phase${phaseIdx}`,
        phaseNumber: phaseIdx + 1,
        title: phase.phase,
        durationWeeks: phase.duration,
        goal: phase.exit_criteria,
        progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        weeks,
      } as PathPhase;
    });

    // Calculate total progress
    const allTasks = phases.flatMap(p => p.weeks.flatMap(w => w.tasks));
    const totalCompleted = allTasks.filter(t => t.status === 'completed').length;
    const totalProgress = allTasks.length > 0 ? Math.round((totalCompleted / allTasks.length) * 100) : 0;

    // Find today's focus - first in-progress or available task
    let todaysFocus: SkillPathData['todaysFocus'] = undefined;
    for (const phase of phases) {
      for (const week of phase.weeks) {
        const nextTask = week.tasks.find(t => t.status === 'in_progress' || t.status === 'available');
        if (nextTask) {
          todaysFocus = {
            taskId: nextTask.id,
            phaseId: phase.id,
            weekId: week.id,
            reason: `This task aligns with your current phase: ${phase.title}`,
          };
          break;
        }
      }
      if (todaysFocus) break;
    }

    return {
      title: `${targetRole} Path`,
      description: "A personalized, step-by-step roadmap based on your personality, strengths, and career goals.",
      totalProgress,
      phases,
      todaysFocus,
    };
  };

  const generatePath = async () => {
    if (!user) return;
    setIsGenerating(true);
    
    try {
      // First generate strategy if not exists
      const { data: strategyData } = await supabase
        .from('career_strategies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!strategyData?.strategy) {
        // Generate strategy first
        const [mbtiRes, discRes, strengthsRes, profileRes] = await Promise.all([
          supabase.from('mbti_assessments').select('result').eq('user_id', user.id).eq('is_complete', true).maybeSingle(),
          supabase.from('disc_assessments').select('result').eq('user_id', user.id).eq('is_complete', true).maybeSingle(),
          supabase.from('strengths_assessments').select('result').eq('user_id', user.id).eq('is_complete', true).maybeSingle(),
          supabase.from('profiles').select('career_goals').eq('user_id', user.id).single(),
        ]);

        const { data: strategyResult, error: strategyError } = await supabase.functions.invoke('generate-strategy', {
          body: {
            mbti_result: mbtiRes.data?.result,
            disc_result: discRes.data?.result,
            strengths_result: strengthsRes.data?.result,
            career_goals: profileRes.data?.career_goals,
          },
        });

        if (strategyError) throw strategyError;

        // Save strategy
        const { data: newStrategy } = await supabase.from('career_strategies').insert({
          user_id: user.id,
          mbti_result: mbtiRes.data?.result as unknown as Json,
          disc_result: discRes.data?.result as unknown as Json,
          strengths_result: strengthsRes.data?.result as unknown as Json,
          career_goals: profileRes.data?.career_goals as unknown as Json,
          strategy: strategyResult.strategy as unknown as Json,
        }).select().single();

        // Now generate skill plan
        const { data: skillPlanResult, error: skillError } = await supabase.functions.invoke('generate-skill-plan', {
          body: {
            career_strategy: strategyResult.strategy,
            mbti_result: mbtiRes.data?.result,
            disc_result: discRes.data?.result,
            strengths_result: strengthsRes.data?.result,
            career_goals: profileRes.data?.career_goals,
          },
        });

        if (skillError) throw skillError;

        // Update with skill plan
        await supabase.from('career_strategies').update({
          skill_development_plan: skillPlanResult.skill_plan as unknown as Json,
        }).eq('id', newStrategy?.id);

        await supabase.from('profiles').update({ strategy_generated: true }).eq('user_id', user.id);

        const goals = profileRes.data?.career_goals as { target_role?: string } | null;
        const convertedPath = convertSkillPlanToPath(
          strategyResult.strategy,
          skillPlanResult.skill_plan,
          goals?.target_role || 'Career Transition',
          []
        );
        setPathData(convertedPath);
        toast.success('Your skill path has been generated!');
      } else if (!strategyData.skill_development_plan) {
        // Generate skill plan only
        const { data: skillPlanResult, error } = await supabase.functions.invoke('generate-skill-plan', {
          body: {
            career_strategy: strategyData.strategy,
            mbti_result: strategyData.mbti_result,
            disc_result: strategyData.disc_result,
            strengths_result: strategyData.strengths_result,
            career_goals: strategyData.career_goals,
          },
        });

        if (error) throw error;

        await supabase.from('career_strategies').update({
          skill_development_plan: skillPlanResult.skill_plan as unknown as Json,
        }).eq('id', strategyData.id);

        const goals = strategyData.career_goals as { target_role?: string } | null;
        const convertedPath = convertSkillPlanToPath(
          strategyData.strategy,
          skillPlanResult.skill_plan,
          goals?.target_role || 'Career Transition',
          []
        );
        setPathData(convertedPath);
        toast.success('Your skill path has been generated!');
      }
    } catch (error: any) {
      console.error('Error generating path:', error);
      if (error.message?.includes('429')) {
        toast.error('Rate limit exceeded. Please try again in a moment.');
      } else if (error.message?.includes('402')) {
        toast.error('Please add credits to continue using AI features.');
      } else {
        toast.error('Failed to generate skill path');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTaskClick = (task: PathTask, phase: PathPhase, week: PathWeek) => {
    if (task.status === 'locked') {
      toast.error('Complete previous tasks to unlock this one');
      return;
    }
    setSelectedTask({ task, phase, week });
  };

  const handleTaskComplete = async (taskId: string) => {
    if (!pathData || !user) return;

    const newCompletedTasks = [...completedTasks, taskId];
    setCompletedTasks(newCompletedTasks);

    // Update local state
    const updatedPhases = pathData.phases.map(phase => ({
      ...phase,
      weeks: phase.weeks.map(week => ({
        ...week,
        tasks: week.tasks.map((task, idx) => {
          if (task.id === taskId) {
            return { ...task, status: 'completed' as const };
          }
          // Unlock next task if previous is now completed
          const prevTask = week.tasks[idx - 1];
          if (prevTask && newCompletedTasks.includes(prevTask.id) && task.status === 'locked') {
            return { ...task, status: 'available' as const };
          }
          return task;
        }),
      })),
    }));

    // Recalculate progress
    const allTasks = updatedPhases.flatMap(p => p.weeks.flatMap(w => w.tasks));
    const totalCompleted = allTasks.filter(t => t.status === 'completed').length;
    const totalProgress = Math.round((totalCompleted / allTasks.length) * 100);

    setPathData({
      ...pathData,
      phases: updatedPhases.map(phase => {
        const phaseTasks = phase.weeks.flatMap(w => w.tasks);
        const phaseCompleted = phaseTasks.filter(t => t.status === 'completed').length;
        return {
          ...phase,
          progress: Math.round((phaseCompleted / phaseTasks.length) * 100),
        };
      }),
      totalProgress,
    });

    // Save to database
    try {
      const { data: existingPlan } = await supabase
        .from('weekly_execution_plans')
        .select('id, completed_tasks')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingPlan) {
        const existing = (existingPlan.completed_tasks as string[]) || [];
        await supabase.from('weekly_execution_plans').update({
          completed_tasks: [...existing, taskId] as unknown as Json,
        }).eq('id', existingPlan.id);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }

    setSelectedTask(null);
    toast.success('Task completed!');
  };

  const handleClosePanel = () => {
    setSelectedTask(null);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading your skill path..." />
      </div>
    );
  }

  // Show assessment lock screen
  if (!assessmentsComplete) {
    return (
      <div className="min-h-screen bg-background">
        <UserHeader />
        <main className="container max-w-3xl py-16 px-4 md:px-8">
          <div className="text-center animate-fade-up">
            <div className="inline-flex items-center justify-center w-20 h-20 chamfer bg-muted mb-6">
              <Lock className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              Complete Your Assessment
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Complete your assessment to generate your personalized skill path.
            </p>
            <div className="chamfer bg-card p-6 max-w-md mx-auto mb-8">
              <h3 className="font-semibold mb-4">Required Assessments:</h3>
              <ul className="space-y-3 text-left">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-muted" />
                  <span>MBTI Personality Assessment</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-muted" />
                  <span>DISC Behavioral Assessment</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-muted" />
                  <span>Strengths Assessment</span>
                </li>
              </ul>
            </div>
            <Button 
              size="lg" 
              onClick={() => navigate('/welcome')}
              className="rounded-full"
            >
              Complete Assessments
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Show generation screen if no path
  if (!pathData) {
    return (
      <div className="min-h-screen bg-background">
        <UserHeader />
        <main className="container max-w-3xl py-16 px-4 md:px-8">
          <div className="text-center animate-fade-up">
            <div className="inline-flex items-center justify-center w-20 h-20 chamfer bg-primary/10 mb-6">
              <Target className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              Generate Your Skill Path
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Based on your personality, strengths, and career goals, we'll create a personalized learning path with phases, weeks, and actionable tasks.
            </p>
            <Button 
              size="lg" 
              onClick={generatePath}
              disabled={isGenerating}
              className="gradient-primary text-primary-foreground rounded-full px-8"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Generating Your Path...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate My Skill Path
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

      <div className="flex">
        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${selectedTask ? 'mr-[400px]' : ''}`}>
          {/* Path Header */}
          <div className="border-b border-border bg-card/50">
            <div className="container max-w-4xl py-8 px-4 md:px-8">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <Badge variant="secondary" className="mb-3">
                    {pathData.totalProgress}% Complete
                  </Badge>
                  <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
                    {pathData.title}
                  </h1>
                  <p className="text-muted-foreground max-w-xl">
                    {pathData.description}
                  </p>
                  <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {pathData.phases.length} Phases
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {pathData.phases.reduce((sum, p) => sum + p.weeks.length, 0)} Weeks
                    </span>
                  </div>
                </div>
                <Button 
                  size="lg"
                  className="gradient-primary text-primary-foreground rounded-full"
                  onClick={() => {
                    if (pathData.todaysFocus) {
                      const phase = pathData.phases.find(p => p.id === pathData.todaysFocus?.phaseId);
                      const week = phase?.weeks.find(w => w.id === pathData.todaysFocus?.weekId);
                      const task = week?.tasks.find(t => t.id === pathData.todaysFocus?.taskId);
                      if (task && phase && week) {
                        handleTaskClick(task, phase, week);
                      }
                    }
                  }}
                >
                  Continue Path
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-medium">{pathData.totalProgress}%</span>
                </div>
                <Progress value={pathData.totalProgress} className="h-2" />
              </div>
            </div>
          </div>

          <div className="container max-w-4xl py-8 px-4 md:px-8">
            {/* Today's Focus */}
            {pathData.todaysFocus && (
              <TodayFocus 
                pathData={pathData}
                onTaskClick={handleTaskClick}
              />
            )}

            {/* Phases */}
            <div className="space-y-4">
              {pathData.phases.map((phase, index) => (
                <PhaseSection 
                  key={phase.id}
                  phase={phase}
                  isFirst={index === 0}
                  onTaskClick={handleTaskClick}
                />
              ))}
            </div>
          </div>
        </main>

        {/* AI Coach Panel */}
        {selectedTask && (
          <AICoachPanel 
            task={selectedTask.task}
            phase={selectedTask.phase}
            week={selectedTask.week}
            userProfile={userProfile}
            onClose={handleClosePanel}
            onComplete={() => handleTaskComplete(selectedTask.task.id)}
          />
        )}
      </div>
    </div>
  );
}
