import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { UserHeader } from '@/components/UserHeader';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { PhaseCard } from '@/components/path/PhaseCard';
import { TodayFocus } from '@/components/path/TodayFocus';
import { AssessmentChangeModal } from '@/components/path/AssessmentChangeModal';
import { 
  ArrowRight, 
  Sparkles,
  RefreshCw,
  Lock,
  Target,
} from 'lucide-react';
import { Json } from '@/integrations/supabase/types';
import type { PathPhase, PathTask, SkillPathData, UserProfile } from '@/types/skillPath';

import phaseAnalysis from '@/assets/phase-analysis.jpg';
import phaseFoundation from '@/assets/phase-foundation.jpg';
import phaseApplication from '@/assets/phase-application.jpg';
import phaseMastery from '@/assets/phase-mastery.jpg';

const phaseImageMap: Record<number, string> = {
  0: phaseAnalysis,
  1: phaseFoundation,
  2: phaseApplication,
  3: phaseMastery,
};

export default function SkillPath() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  
  const [pathData, setPathData] = useState<SkillPathData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [assessmentsComplete, setAssessmentsComplete] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [showAssessmentChangeModal, setShowAssessmentChangeModal] = useState(false);
  const [assessmentHashMismatch, setAssessmentHashMismatch] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (!profile?.has_paid) {
        navigate('/paywall');
      }
    }
  }, [user, profile, loading, navigate]);

  const generateAssessmentHash = useCallback((mbti: any, disc: any, strengths: any): string => {
    const mbtiType = mbti?.type || '';
    const discStyle = disc?.primaryStyle || '';
    const strengthsList = strengths?.ranked_strengths?.slice(0, 5).map((s: any) => s.name).join(',') || '';
    return `${mbtiType}-${discStyle}-${strengthsList}`;
  }, []);

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

        // Load current assessment data to check for changes
        const [mbtiRes, discRes, strengthsRes] = await Promise.all([
          supabase.from('mbti_assessments').select('result').eq('user_id', user.id).eq('is_complete', true).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('disc_assessments').select('result').eq('user_id', user.id).eq('is_complete', true).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('strengths_assessments').select('result').eq('user_id', user.id).eq('is_complete', true).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
        ]);

        const currentHash = generateAssessmentHash(
          mbtiRes.data?.result,
          discRes.data?.result,
          strengthsRes.data?.result
        );

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

          // Check if assessment has changed since strategy was generated
          const storedHash = generateAssessmentHash(
            strategyData.mbti_result,
            strategyData.disc_result,
            strategyData.strengths_result
          );

          if (currentHash !== storedHash && strategyData.skill_development_plan) {
            setAssessmentHashMismatch(true);
            setShowAssessmentChangeModal(true);
          }

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
              skillPlan,
              goals?.target_role || 'Career Transition',
              completedTaskIds,
              strategyData.id
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
  }, [user, navigate, generateAssessmentHash]);

  const convertSkillPlanToPath = (
    skillPlan: any,
    targetRole: string,
    completedTaskIds: string[],
    strategyId: string
  ): SkillPathData => {
    let globalTaskIndex = 0;
    
    const phases: PathPhase[] = (skillPlan.skill_development_plan || []).map((phaseData: any, phaseIdx: number) => {
      const tasks: PathTask[] = [];
      
      phaseData.skill_clusters?.forEach((cluster: any) => {
        cluster.skills?.forEach((skill: string, skillIdx: number) => {
          const taskId = `phase${phaseIdx}-task${globalTaskIndex}`;
          const isCompleted = completedTaskIds.includes(taskId);
          
          tasks.push({
            id: taskId,
            title: skill,
            description: `Develop competency in ${skill.toLowerCase()}`,
            type: skillIdx % 4 === 0 ? 'reading' : skillIdx % 4 === 1 ? 'practice' : skillIdx % 4 === 2 ? 'reflection' : 'project',
            estimatedMinutes: 30 + (skillIdx * 10),
            status: isCompleted ? 'completed' : 'locked',
            successCriteria: `Complete ${skill.toLowerCase()} and document your learnings`,
          });
          
          globalTaskIndex++;
        });
      });

      // Update task statuses based on sequential completion
      for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].status === 'completed') continue;
        
        if (i === 0) {
          tasks[i].status = phaseIdx === 0 ? 'available' : 'locked';
        } else if (tasks[i - 1].status === 'completed') {
          tasks[i].status = 'available';
        }
      }

      const completedInPhase = tasks.filter(t => t.status === 'completed').length;
      
      return {
        id: `phase${phaseIdx}`,
        phaseNumber: phaseIdx + 1,
        title: phaseData.phase,
        duration: phaseData.duration,
        goal: phaseData.exit_criteria,
        successDefinition: phaseData.exit_criteria,
        progress: tasks.length > 0 ? Math.round((completedInPhase / tasks.length) * 100) : 0,
        image: phaseImageMap[phaseIdx % 4],
        tasks,
      };
    });

    // Update phase locking - phases are unlocked when previous is 100% complete
    for (let i = 1; i < phases.length; i++) {
      if (phases[i - 1].progress < 100) {
        phases[i].tasks = phases[i].tasks.map(t => ({ ...t, status: 'locked' as const }));
      } else {
        // Unlock first task of next phase
        if (phases[i].tasks.length > 0 && phases[i].tasks[0].status === 'locked') {
          phases[i].tasks[0].status = 'available';
        }
      }
    }

    // Recalculate phase progress after locking updates
    phases.forEach(phase => {
      const completedInPhase = phase.tasks.filter(t => t.status === 'completed').length;
      phase.progress = phase.tasks.length > 0 ? Math.round((completedInPhase / phase.tasks.length) * 100) : 0;
    });

    const allTasks = phases.flatMap(p => p.tasks);
    const totalCompleted = allTasks.filter(t => t.status === 'completed').length;
    const totalProgress = allTasks.length > 0 ? Math.round((totalCompleted / allTasks.length) * 100) : 0;

    // Find today's focus - first available task
    let todaysFocus: SkillPathData['todaysFocus'] = undefined;
    for (const phase of phases) {
      const nextTask = phase.tasks.find(t => t.status === 'available' || t.status === 'in_progress');
      if (nextTask) {
        todaysFocus = {
          taskId: nextTask.id,
          phaseId: phase.id,
          reason: `This task aligns with your current phase: ${phase.title}`,
        };
        break;
      }
    }

    return {
      id: strategyId,
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
          supabase.from('mbti_assessments').select('result').eq('user_id', user.id).eq('is_complete', true).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('disc_assessments').select('result').eq('user_id', user.id).eq('is_complete', true).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('strengths_assessments').select('result').eq('user_id', user.id).eq('is_complete', true).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
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
          skillPlanResult.skill_plan,
          goals?.target_role || 'Career Transition',
          [],
          newStrategy?.id || ''
        );
        setPathData(convertedPath);
        toast.success('Your Skill Path has been generated!');
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
          skillPlanResult.skill_plan,
          goals?.target_role || 'Career Transition',
          [],
          strategyData.id
        );
        setPathData(convertedPath);
        toast.success('Your Skill Path has been generated!');
      }
    } catch (error: any) {
      console.error('Error generating path:', error);
      if (error.message?.includes('429')) {
        toast.error('Rate limit exceeded. Please try again in a moment.');
      } else if (error.message?.includes('402')) {
        toast.error('Please add credits to continue using AI features.');
      } else {
        toast.error('Failed to generate Skill Path');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!user) return;
    setIsGenerating(true);

    try {
      // Get fresh assessment data
      const [mbtiRes, discRes, strengthsRes, profileRes] = await Promise.all([
        supabase.from('mbti_assessments').select('result').eq('user_id', user.id).eq('is_complete', true).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('disc_assessments').select('result').eq('user_id', user.id).eq('is_complete', true).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('strengths_assessments').select('result').eq('user_id', user.id).eq('is_complete', true).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('profiles').select('career_goals').eq('user_id', user.id).single(),
      ]);

      // Generate new strategy
      const { data: strategyResult, error: strategyError } = await supabase.functions.invoke('generate-strategy', {
        body: {
          mbti_result: mbtiRes.data?.result,
          disc_result: discRes.data?.result,
          strengths_result: strengthsRes.data?.result,
          career_goals: profileRes.data?.career_goals,
        },
      });

      if (strategyError) throw strategyError;

      // Create new strategy record (archive old one by creating new)
      const { data: newStrategy } = await supabase.from('career_strategies').insert({
        user_id: user.id,
        mbti_result: mbtiRes.data?.result as unknown as Json,
        disc_result: discRes.data?.result as unknown as Json,
        strengths_result: strengthsRes.data?.result as unknown as Json,
        career_goals: profileRes.data?.career_goals as unknown as Json,
        strategy: strategyResult.strategy as unknown as Json,
      }).select().single();

      // Generate new skill plan
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

      await supabase.from('career_strategies').update({
        skill_development_plan: skillPlanResult.skill_plan as unknown as Json,
      }).eq('id', newStrategy?.id);

      const goals = profileRes.data?.career_goals as { target_role?: string } | null;
      const convertedPath = convertSkillPlanToPath(
        skillPlanResult.skill_plan,
        goals?.target_role || 'Career Transition',
        [],
        newStrategy?.id || ''
      );
      
      setPathData(convertedPath);
      setCompletedTasks([]);
      setShowAssessmentChangeModal(false);
      setAssessmentHashMismatch(false);
      toast.success('Your Skill Path has been regenerated!');
    } catch (error: any) {
      console.error('Error regenerating path:', error);
      toast.error('Failed to regenerate Skill Path');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeepCurrent = () => {
    setShowAssessmentChangeModal(false);
  };

  const handleTodayFocusClick = () => {
    if (pathData?.todaysFocus) {
      navigate(`/path/task/${pathData.todaysFocus.taskId}`, { 
        state: { phaseId: pathData.todaysFocus.phaseId } 
      });
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading your Skill Path..." />
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
              Complete your assessment to generate your personalized Skill Path.
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
              Based on your personality, strengths, and career goals, we'll create a personalized learning path with phases and actionable tasks.
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

      {/* Assessment Change Modal */}
      <AssessmentChangeModal
        open={showAssessmentChangeModal}
        onClose={() => setShowAssessmentChangeModal(false)}
        onRegenerate={handleRegenerate}
        onKeepCurrent={handleKeepCurrent}
        isRegenerating={isGenerating}
      />

      {/* Path Header */}
      <div className="border-b border-border bg-card/50">
        <div className="container max-w-5xl py-8 px-4 md:px-8">
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
                  {pathData.phases.reduce((sum, p) => sum + p.tasks.length, 0)} Tasks
                </span>
              </div>
            </div>
            {pathData.todaysFocus && (
              <Button 
                size="lg"
                className="gradient-primary text-primary-foreground rounded-full"
                onClick={handleTodayFocusClick}
              >
                Continue Path
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}
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

      <main className="container max-w-5xl py-8 px-4 md:px-8">
        {/* Today's Focus */}
        {pathData.todaysFocus && (
          <TodayFocus 
            pathData={pathData}
            onTaskClick={handleTodayFocusClick}
          />
        )}

        {/* Phase Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {pathData.phases.map((phase, index) => {
            // Phase is locked if previous phase is not 100% complete
            const isLocked = index > 0 && pathData.phases[index - 1].progress < 100;
            
            return (
              <PhaseCard 
                key={phase.id}
                phase={phase}
                isLocked={isLocked}
                index={index}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
}
