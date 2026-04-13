import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { UserHeader } from '@/components/UserHeader';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PhaseCard } from '@/components/path/PhaseCard';
import { TodayFocus } from '@/components/path/TodayFocus';
import { 
  ArrowRight, 
  Target,
  Trophy,
  Compass,
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

export default function SkillPath() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [pathData, setPathData] = useState<SkillPathData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const loadPath = async () => {
      if (!user) return;
      setIsLoading(true);

      try {
        const { data: personalPath } = await supabase
          .from('personal_paths')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (personalPath) {
          const converted = convertPersonalPathToSkillPath(personalPath);
          setPathData(converted);
        }
      } catch (error) {
        console.error('Error loading path:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) loadPath();
  }, [user]);

  const convertPersonalPathToSkillPath = (dbPath: any): SkillPathData => {
    const phases: PathPhase[] = ((dbPath.phases as any[]) || []).map((phase: any, idx: number) => {
      const tasks: PathTask[] = (phase.tasks || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        type: task.type || 'practice',
        estimatedMinutes: task.estimatedMinutes || 30,
        status: task.status || 'locked',
        successCriteria: task.successCriteria || '',
        instructions: task.instructions,
      }));

      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

      return {
        id: phase.id || `phase${idx}`,
        phaseNumber: phase.phaseNumber || idx + 1,
        title: phase.title,
        duration: phase.duration || '',
        goal: phase.goal || '',
        successDefinition: phase.successDefinition || '',
        progress,
        image: phaseImageMap[idx % 4],
        tasks,
      };
    });

    // Find today's focus
    let todaysFocus: SkillPathData['todaysFocus'] = undefined;
    for (const phase of phases) {
      const nextTask = phase.tasks.find(t => t.status === 'available' || t.status === 'in_progress');
      if (nextTask) {
        todaysFocus = {
          taskId: nextTask.id,
          phaseId: phase.id,
          reason: `Continue Phase ${phase.phaseNumber}: ${phase.title}`,
        };
        break;
      }
    }

    const allTasks = phases.flatMap(p => p.tasks);
    const totalCompleted = allTasks.filter(t => t.status === 'completed').length;
    const totalProgress = allTasks.length > 0 ? Math.round((totalCompleted / allTasks.length) * 100) : 0;

    return {
      id: dbPath.id,
      title: dbPath.title,
      description: dbPath.description || '',
      totalProgress,
      phases,
      todaysFocus,
    };
  };

  const handleTodayFocusClick = () => {
    if (pathData?.todaysFocus) {
      navigate(`/path/task/${pathData.todaysFocus.taskId}`, {
        state: { phaseId: pathData.todaysFocus.phaseId },
      });
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading your path..." />
      </div>
    );
  }

  // No path yet
  if (!pathData) {
    return (
      <div className="min-h-screen bg-background">
        <UserHeader />
        <main className="container max-w-3xl py-16 px-4 md:px-8">
          <div className="text-center animate-fade-up">
            <div className="inline-flex items-center justify-center w-20 h-20 chamfer bg-primary/10 mb-6">
              <Compass className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              Your Path Is on Its Way
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Your coach is preparing a personalized execution plan for you. Check back soon!
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/welcome')}
              className="rounded-full"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <UserHeader />

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
        {/* Completion Card */}
        {pathData.totalProgress === 100 && (
          <div className="mb-8 p-6 chamfer bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 animate-fade-up">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <Badge className="mb-2 bg-primary/20 text-primary border-0">Path Complete</Badge>
                <h2 className="text-xl font-serif font-bold text-foreground mb-2">
                  Congratulations! You've completed your path!
                </h2>
                <p className="text-muted-foreground mb-4">
                  You've finished all phases and tasks. Consider exploring new growth opportunities.
                </p>
                <Button 
                  onClick={() => navigate('/success-growth')}
                  className="gradient-primary text-primary-foreground rounded-full"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  View Growth Plan
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Today's Focus */}
        {pathData.todaysFocus && pathData.totalProgress < 100 && (
          <TodayFocus pathData={pathData} onTaskClick={handleTodayFocusClick} />
        )}

        {/* Phase Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {pathData.phases.map((phase, index) => {
            const isLocked = index > 0 && pathData.phases[index - 1].progress < 100;
            return (
              <PhaseCard key={phase.id} phase={phase} isLocked={isLocked} index={index} />
            );
          })}
        </div>
      </main>
    </div>
  );
}
