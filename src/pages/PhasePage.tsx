import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { UserHeader } from '@/components/UserHeader';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  CheckCircle,
  Circle,
  PlayCircle,
  BookOpen,
  Wrench,
  FileText,
  Folder,
  Clock,
  Target,
} from 'lucide-react';
import type { PathPhase, PathTask, SkillPathData } from '@/types/skillPath';

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

const taskTypeIcons = {
  reading: BookOpen,
  practice: Wrench,
  reflection: FileText,
  project: Folder,
};

const taskTypeLabels = {
  reading: 'Reading',
  practice: 'Practice',
  reflection: 'Reflection',
  project: 'Project',
};

const statusIcons = {
  locked: Lock,
  available: Circle,
  in_progress: PlayCircle,
  completed: CheckCircle,
};

const statusColors = {
  locked: 'text-muted-foreground',
  available: 'text-primary',
  in_progress: 'text-primary',
  completed: 'text-green-500',
};

export default function PhasePage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  
  const [phase, setPhase] = useState<PathPhase | null>(null);
  const [pathData, setPathData] = useState<SkillPathData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    const loadPhase = async () => {
      if (!user || !id) return;
      setIsLoading(true);

      try {
        const { data: strategyData } = await supabase
          .from('career_strategies')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (strategyData?.skill_development_plan) {
          const { data: weeklyPlans } = await supabase
            .from('weekly_execution_plans')
            .select('completed_tasks')
            .eq('user_id', user.id);

          const completedTaskIds: string[] = [];
          weeklyPlans?.forEach(plan => {
            const tasks = plan.completed_tasks as string[] | null;
            if (tasks) completedTaskIds.push(...tasks.map(t => String(t)));
          });

          const goals = strategyData.career_goals as { target_role?: string } | null;
          const skillPlan = strategyData.skill_development_plan as any;
          
          const convertedPath = convertToPathData(
            skillPlan,
            goals?.target_role || 'Career Transition',
            completedTaskIds,
            strategyData.id
          );
          
          setPathData(convertedPath);
          
          const foundPhase = convertedPath.phases.find(p => p.id === id);
          if (foundPhase) {
            setPhase(foundPhase);
          } else {
            toast.error('Phase not found');
            navigate('/path');
          }
        } else {
          navigate('/path');
        }
      } catch (error) {
        console.error('Error loading phase:', error);
        toast.error('Failed to load phase');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) loadPhase();
  }, [user, id, navigate]);

  const convertToPathData = (
    skillPlan: any,
    targetRole: string,
    completedTaskIds: string[],
    strategyId: string
  ): SkillPathData => {
    let globalTaskIndex = 0;
    
    const phases: PathPhase[] = (skillPlan.skill_development_plan || []).map((phaseData: any, phaseIdx: number) => {
      const tasks: PathTask[] = [];
      
      phaseData.skill_clusters?.forEach((cluster: any, clusterIdx: number) => {
        cluster.skills?.forEach((skill: string, skillIdx: number) => {
          const taskId = `phase${phaseIdx}-task${globalTaskIndex}`;
          const isCompleted = completedTaskIds.includes(taskId);
          
          // Check if previous task is completed for sequential locking
          const prevTaskCompleted = globalTaskIndex === 0 || 
            completedTaskIds.includes(`phase${phaseIdx}-task${globalTaskIndex - 1}`) ||
            tasks[tasks.length - 1]?.status === 'completed';
          
          let status: PathTask['status'] = 'locked';
          if (isCompleted) {
            status = 'completed';
          } else if (phaseIdx === 0 && tasks.length === 0) {
            status = 'available';
          } else if (prevTaskCompleted && phaseIdx === 0) {
            status = 'available';
          }
          
          tasks.push({
            id: taskId,
            title: skill,
            description: `Develop competency in ${skill.toLowerCase()}`,
            type: skillIdx % 4 === 0 ? 'reading' : skillIdx % 4 === 1 ? 'practice' : skillIdx % 4 === 2 ? 'reflection' : 'project',
            estimatedMinutes: 30 + (skillIdx * 10),
            status,
            successCriteria: `Complete ${skill.toLowerCase()} and document your learnings`,
          });
          
          globalTaskIndex++;
        });
      });

      // Update task statuses based on sequential completion
      for (let i = 1; i < tasks.length; i++) {
        if (tasks[i].status === 'locked' && tasks[i - 1].status === 'completed') {
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

    const allTasks = phases.flatMap(p => p.tasks);
    const totalCompleted = allTasks.filter(t => t.status === 'completed').length;

    return {
      id: strategyId,
      title: `${targetRole} Path`,
      description: "A personalized, step-by-step roadmap based on your personality, strengths, and career goals.",
      totalProgress: allTasks.length > 0 ? Math.round((totalCompleted / allTasks.length) * 100) : 0,
      phases,
    };
  };

  const handleTaskClick = (task: PathTask) => {
    if (task.status === 'locked') {
      toast.error('Complete previous tasks to unlock this one');
      return;
    }
    navigate(`/path/task/${task.id}`, { state: { phaseId: id } });
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading phase..." />
      </div>
    );
  }

  if (!phase) {
    return null;
  }

  const phaseIndex = pathData?.phases.findIndex(p => p.id === id) || 0;
  const imageUrl = phaseImageMap[phaseIndex % 4];

  return (
    <div className="min-h-screen bg-background">
      <UserHeader />
      
      {/* Phase Header */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={phase.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="container max-w-4xl">
            <Link 
              to="/path" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Skill Path
            </Link>
          </div>
        </div>
      </div>

      <main className="container max-w-4xl py-8 px-4 md:px-8 -mt-16 relative z-10">
        {/* Phase Info Card */}
        <div className="chamfer bg-card p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 chamfer-sm bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">{phase.phaseNumber}</span>
            </div>
            <div>
              <Badge variant="outline" className="mb-1">{phase.duration}</Badge>
              <h1 className="text-2xl font-serif font-bold">{phase.title}</h1>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="chamfer-sm bg-muted/50 p-4">
              <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-primary" />
                Phase Objective
              </h3>
              <p className="text-sm text-muted-foreground">{phase.goal}</p>
            </div>
            <div className="chamfer-sm bg-muted/50 p-4">
              <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Success Definition
              </h3>
              <p className="text-sm text-muted-foreground">{phase.successDefinition}</p>
            </div>
          </div>

          {/* Phase Progress */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Phase Progress</span>
              <span className="font-medium">{phase.progress}%</span>
            </div>
            <Progress value={phase.progress} className="h-2" />
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold mb-4">Tasks ({phase.tasks.length})</h2>
          
          {phase.tasks.map((task, index) => {
            const TaskTypeIcon = taskTypeIcons[task.type];
            const StatusIcon = statusIcons[task.status];
            const isClickable = task.status !== 'locked';
            
            return (
              <div
                key={task.id}
                className={`chamfer bg-card p-4 flex items-center gap-4 transition-all ${
                  isClickable 
                    ? 'hover:bg-muted/50 cursor-pointer hover:shadow-md' 
                    : 'opacity-60'
                }`}
                onClick={() => handleTaskClick(task)}
              >
                {/* Task Number & Status */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  {task.status === 'locked' ? (
                    <Tooltip>
                      <TooltipTrigger>
                        <StatusIcon className={`w-5 h-5 ${statusColors[task.status]}`} />
                      </TooltipTrigger>
                      <TooltipContent>Complete previous tasks to unlock</TooltipContent>
                    </Tooltip>
                  ) : (
                    <StatusIcon className={`w-5 h-5 ${statusColors[task.status]}`} />
                  )}
                </div>

                {/* Task Type Icon */}
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <TaskTypeIcon className="w-4 h-4 text-secondary-foreground" />
                </div>

                {/* Task Info */}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>{taskTypeLabels[task.type]}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.estimatedMinutes} min
                    </span>
                  </div>
                </div>

                {/* Action Badge */}
                {task.status === 'in_progress' && (
                  <Badge className="bg-primary text-primary-foreground flex-shrink-0">
                    Continue
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Badge>
                )}
                {task.status === 'available' && (
                  <Badge variant="secondary" className="flex-shrink-0">
                    Start
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Badge>
                )}
                {task.status === 'completed' && (
                  <Badge variant="outline" className="text-green-500 border-green-500/30 flex-shrink-0">
                    Done
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
