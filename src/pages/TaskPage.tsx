import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';
import {
  ArrowLeft,
  Brain,
  CheckCircle,
  BookOpen,
  Wrench,
  FileText,
  Folder,
  Clock,
  RefreshCw,
  Send,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type { PathPhase, PathTask } from '@/types/skillPath';

const taskTypeIcons: Record<string, any> = {
  reading: BookOpen,
  practice: Wrench,
  reflection: FileText,
  project: Folder,
};

const taskTypeLabels: Record<string, string> = {
  reading: 'Reading',
  practice: 'Practice',
  reflection: 'Reflection',
  project: 'Project',
};

export default function TaskPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const [task, setTask] = useState<PathTask | null>(null);
  const [phase, setPhase] = useState<PathPhase | null>(null);
  const [pathId, setPathId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [phaseTaskCount, setPhaseTaskCount] = useState(0);
  const [completedInPhase, setCompletedInPhase] = useState(0);

  const phaseId = location.state?.phaseId;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const loadTask = async () => {
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

        if (!personalPath?.phases) {
          toast.error('No path found');
          navigate('/path');
          return;
        }

        setPathId(personalPath.id);
        const phases = personalPath.phases as any[];

        let foundTask: PathTask | null = null;
        let foundPhase: PathPhase | null = null;

        for (const [phaseIdx, phaseData] of phases.entries()) {
          for (const taskData of (phaseData.tasks || [])) {
            if (taskData.id === id) {
              foundTask = {
                id: taskData.id,
                title: taskData.title,
                description: taskData.description || '',
                type: taskData.type || 'practice',
                estimatedMinutes: taskData.estimatedMinutes || 30,
                status: taskData.status || 'available',
                successCriteria: taskData.successCriteria || '',
                instructions: taskData.instructions,
              };

              const phaseTasks = (phaseData.tasks || []);
              const completed = phaseTasks.filter((t: any) => t.status === 'completed').length;
              setPhaseTaskCount(phaseTasks.length);
              setCompletedInPhase(completed);

              foundPhase = {
                id: phaseData.id,
                phaseNumber: phaseData.phaseNumber || phaseIdx + 1,
                title: phaseData.title,
                duration: phaseData.duration || '',
                goal: phaseData.goal || '',
                successDefinition: phaseData.successDefinition || '',
                progress: 0,
                image: '',
                tasks: [],
              };
              break;
            }
          }
          if (foundTask) break;
        }

        if (foundTask && foundPhase) {
          setTask(foundTask);
          setPhase(foundPhase);
        } else {
          toast.error('Task not found');
          navigate('/path');
        }
      } catch (error) {
        console.error('Error loading task:', error);
        toast.error('Failed to load task');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) loadTask();
  }, [user, id, navigate]);

  const handleComplete = async () => {
    if (!task || !user || !pathId) return;
    setIsCompleting(true);

    try {
      // Load the personal path
      const { data: personalPath } = await supabase
        .from('personal_paths')
        .select('*')
        .eq('id', pathId)
        .single();

      if (!personalPath) throw new Error('Path not found');

      const phases = personalPath.phases as any[];
      let totalTasks = 0;
      let totalCompleted = 0;

      // Update task status in phases
      const updatedPhases = phases.map((phase: any) => ({
        ...phase,
        tasks: (phase.tasks || []).map((t: any, tIdx: number, arr: any[]) => {
          if (t.id === task.id) {
            return { ...t, status: 'completed' };
          }
          return t;
        }),
      }));

      // After marking complete, unlock next task
      for (const phase of updatedPhases) {
        for (let i = 0; i < phase.tasks.length; i++) {
          const t = phase.tasks[i];
          if (t.status === 'completed') {
            // Unlock next task in same phase
            if (i + 1 < phase.tasks.length && phase.tasks[i + 1].status === 'locked') {
              phase.tasks[i + 1].status = 'available';
            }
          }
          totalTasks++;
          if (t.status === 'completed') totalCompleted++;
        }
      }

      // Unlock first task of next phase if current phase is complete
      for (let pIdx = 0; pIdx < updatedPhases.length - 1; pIdx++) {
        const allDone = updatedPhases[pIdx].tasks.every((t: any) => t.status === 'completed');
        if (allDone && updatedPhases[pIdx + 1].tasks.length > 0 && updatedPhases[pIdx + 1].tasks[0].status === 'locked') {
          updatedPhases[pIdx + 1].tasks[0].status = 'available';
        }
      }

      const totalProgress = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

      await supabase
        .from('personal_paths')
        .update({
          phases: updatedPhases as unknown as Json,
          total_progress: totalProgress,
        })
        .eq('id', pathId);

      toast.success('Task completed!');
      
      if (phaseId) {
        navigate(`/path/phase/${phaseId}`);
      } else {
        navigate('/path');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to save progress');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || !task || !phase) return;
    
    setIsAsking(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-coaching', {
        body: {
          question,
          task_context: {
            title: task.title,
            description: task.description,
            phase: phase.title,
          },
          user_profile: {},
        },
      });

      if (error) throw error;
      
      if (data?.coaching?.focus) {
        setAiResponse(data.coaching.focus);
      } else if (data?.answer) {
        setAiResponse(data.answer);
      } else {
        setAiResponse("I can help you with this task. Try breaking it down into smaller steps.");
      }
    } catch (error: any) {
      console.error('Error asking AI:', error);
      toast.error('Failed to get AI response');
    } finally {
      setIsAsking(false);
      setQuestion('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading task..." />
      </div>
    );
  }

  if (!task || !phase) return null;

  const TaskIcon = taskTypeIcons[task.type] || Wrench;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-4">
        <Link 
          to={phaseId ? `/path/phase/${phaseId}` : '/path'} 
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <TaskIcon className="w-5 h-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold truncate">{task.title}</h1>
          <p className="text-xs text-muted-foreground">Phase {phase.phaseNumber}: {phase.title}</p>
        </div>

        <div className="hidden md:flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[...Array(Math.min(phaseTaskCount, 10))].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full ${i < completedInPhase ? 'bg-primary' : i === completedInPhase ? 'bg-primary/50' : 'bg-muted'}`}
                />
              ))}
            </div>
            <span className="text-muted-foreground text-xs">{completedInPhase} of {phaseTaskCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="hidden sm:flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {task.estimatedMinutes} min
          </Badge>
          <Badge variant="outline">{taskTypeLabels[task.type] || 'Task'}</Badge>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - AI Coach */}
        <aside className="hidden lg:flex w-[340px] border-r border-border bg-card flex-col">
          <div className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Coach</span>
                <span className="text-xs text-muted-foreground">Now</span>
              </div>
              <p className="text-sm mt-1 text-muted-foreground leading-relaxed">
                This task is part of your personal path. Focus on practical application and document your progress.
              </p>
            </div>
          </div>

          {aiResponse && (
            <div className="px-4 pb-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <p className="text-sm">{aiResponse}</p>
              </div>
            </div>
          )}

          <div className="flex-1" />

          <div className="px-4 pb-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <Sparkles className="w-3 h-3" />
              Suggestions
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                className="text-xs px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full transition-colors"
                onClick={() => setQuestion("Summarize this task for me")}
              >
                Summarize this task
              </button>
              <button 
                className="text-xs px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full transition-colors"
                onClick={() => setQuestion("What resources should I use?")}
              >
                What resources?
              </button>
            </div>
          </div>

          <div className="p-4 border-t border-border">
            <div className="relative">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything"
                className="pr-10"
                disabled={isAsking}
              />
              <button
                onClick={handleAskQuestion}
                disabled={isAsking || !question.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-primary disabled:opacity-50 transition-colors"
              >
                {isAsking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </aside>

        {/* Right Panel - Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-6 lg:p-10">
            <div className="mb-8">
              <h2 className="text-2xl lg:text-3xl font-serif font-bold mb-4">Task Summary</h2>
              <p className="text-muted-foreground leading-relaxed text-base lg:text-lg">
                {task.description}
              </p>
            </div>

            {/* Instructions */}
            {task.instructions && task.instructions.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">What You Need To Do</h3>
                <ol className="space-y-3">
                  {task.instructions.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Fallback instructions if none provided */}
            {(!task.instructions || task.instructions.length === 0) && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">What You Need To Do</h3>
                <ol className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">1</span>
                    <span>Review and understand the task: <strong>{task.title}</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">2</span>
                    <span>Research best practices and examples relevant to your goal</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">3</span>
                    <span>Apply what you've learned through practice or documentation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">4</span>
                    <span>Reflect on how this connects to your overall development</span>
                  </li>
                </ol>
              </div>
            )}

            {/* Success Criteria */}
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Success Criteria
              </h3>
              <p className="text-muted-foreground">{task.successCriteria}</p>
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Action Bar */}
      <footer className="h-16 border-t border-border bg-card flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden sm:flex">Phase {phase.phaseNumber}</Badge>
          <span className="text-sm text-muted-foreground hidden md:block">{phase.title}</span>
        </div>

        <Button 
          onClick={handleComplete}
          disabled={isCompleting}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
        >
          {isCompleting ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Mark Complete
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </footer>

      {/* Mobile AI Coach Trigger */}
      <div className="lg:hidden fixed bottom-20 right-4 z-40">
        <Button
          size="icon"
          className="w-12 h-12 rounded-full shadow-lg bg-primary text-primary-foreground"
          onClick={() => toast.info('AI Coach coming soon on mobile!')}
        >
          <Brain className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
