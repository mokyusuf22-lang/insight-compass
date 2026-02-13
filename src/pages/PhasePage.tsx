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
import type { PathPhase, PathTask } from '@/types/skillPath';

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
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const [phase, setPhase] = useState<PathPhase | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const loadPhase = async () => {
      if (!user || !id) return;
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

        if (personalPath?.phases) {
          const phases = personalPath.phases as any[];
          const foundPhase = phases.find((p: any) => p.id === id);
          
          if (foundPhase) {
            const phaseIdx = phases.indexOf(foundPhase);
            const tasks: PathTask[] = (foundPhase.tasks || []).map((t: any) => ({
              id: t.id,
              title: t.title,
              description: t.description || '',
              type: t.type || 'practice',
              estimatedMinutes: t.estimatedMinutes || 30,
              status: t.status || 'locked',
              successCriteria: t.successCriteria || '',
              instructions: t.instructions,
            }));

            const completedInPhase = tasks.filter(t => t.status === 'completed').length;

            setPhase({
              id: foundPhase.id,
              phaseNumber: foundPhase.phaseNumber || phaseIdx + 1,
              title: foundPhase.title,
              duration: foundPhase.duration || '',
              goal: foundPhase.goal || '',
              successDefinition: foundPhase.successDefinition || '',
              progress: tasks.length > 0 ? Math.round((completedInPhase / tasks.length) * 100) : 0,
              image: phaseImageMap[phaseIdx % 4],
              tasks,
            });
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

  if (!phase) return null;

  const phaseIndex = parseInt(phase.id.replace('phase', '')) || 0;
  const imageUrl = phaseImageMap[phaseIndex % 4];

  return (
    <div className="min-h-screen bg-background">
      <UserHeader />
      
      {/* Phase Header */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        <img src={imageUrl} alt={phase.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="container max-w-4xl">
            <Link 
              to="/path" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Path
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
            const TaskTypeIcon = taskTypeIcons[task.type] || Wrench;
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

                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <TaskTypeIcon className="w-4 h-4 text-secondary-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>{taskTypeLabels[task.type] || 'Task'}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.estimatedMinutes} min
                    </span>
                  </div>
                </div>

                {task.status === 'in_progress' && (
                  <Badge className="bg-primary text-primary-foreground flex-shrink-0">
                    Continue <ArrowRight className="w-3 h-3 ml-1" />
                  </Badge>
                )}
                {task.status === 'available' && (
                  <Badge variant="secondary" className="flex-shrink-0">
                    Start <ArrowRight className="w-3 h-3 ml-1" />
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
