import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { UserHeader } from '@/components/UserHeader';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle2, 
  Clock, 
  Lock, 
  ArrowRight,
  Play,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'locked';
  order: number;
}

export default function TaskToday() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showReflection, setShowReflection] = useState(false);
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;

      try {
        // Fetch weekly execution plan
        const { data: weeklyPlan } = await supabase
          .from('weekly_execution_plans')
          .select('tasks, completed_tasks')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (weeklyPlan?.tasks) {
          const rawTasks = weeklyPlan.tasks as Array<{ id: string; title: string; description: string }>;
          const completedIds = (weeklyPlan.completed_tasks as string[]) || [];
          
          const formattedTasks: Task[] = rawTasks.map((task, index) => {
            const isCompleted = completedIds.includes(task.id);
            const previousCompleted = index === 0 || completedIds.includes(rawTasks[index - 1]?.id);
            
            return {
              id: task.id,
              title: task.title,
              description: task.description,
              status: isCompleted ? 'completed' : previousCompleted ? 'in_progress' : 'locked',
              order: index + 1,
            };
          });

          setTasks(formattedTasks);
        } else {
          // Generate sample tasks if none exist
          setTasks([
            { id: '1', title: 'Review your personality profile', description: 'Understand your MBTI and DISC results', status: 'in_progress', order: 1 },
            { id: '2', title: 'Identify skill gaps', description: 'Compare current skills with target role requirements', status: 'locked', order: 2 },
            { id: '3', title: 'Create learning plan', description: 'Set up a 30-day skill development roadmap', status: 'locked', order: 3 },
            { id: '4', title: 'Network with professionals', description: 'Reach out to 3 people in your target industry', status: 'locked', order: 4 },
            { id: '5', title: 'Update your portfolio', description: 'Showcase projects aligned with career goals', status: 'locked', order: 5 },
          ]);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchTasks();
  }, [user]);

  const handleTaskClick = (task: Task) => {
    if (task.status === 'locked') {
      toast.error('Complete previous tasks first');
      return;
    }
    setSelectedTask(task);
  };

  const handleCompleteTask = () => {
    setShowReflection(true);
  };

  const handleSubmitReflection = async () => {
    if (!selectedTask || !user) return;

    setSaving(true);
    try {
      // Update completed tasks in database
      const { data: currentPlan } = await supabase
        .from('weekly_execution_plans')
        .select('id, completed_tasks')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (currentPlan) {
        const completedTasks = (currentPlan.completed_tasks as string[]) || [];
        await supabase
          .from('weekly_execution_plans')
          .update({ 
            completed_tasks: [...completedTasks, selectedTask.id],
            coaching_notes: reflection ? `Task ${selectedTask.order}: ${reflection}` : null
          })
          .eq('id', currentPlan.id);
      }

      // Update local state
      setTasks(prev => prev.map(t => {
        if (t.id === selectedTask.id) {
          return { ...t, status: 'completed' as const };
        }
        // Unlock next task
        if (t.order === selectedTask.order + 1) {
          return { ...t, status: 'in_progress' as const };
        }
        return t;
      }));

      toast.success('Task completed!');
      setShowReflection(false);
      setReflection('');
      
      // Navigate to next task
      const nextTask = tasks.find(t => t.order === selectedTask.order + 1);
      if (nextTask) {
        setSelectedTask({ ...nextTask, status: 'in_progress' });
      } else {
        setSelectedTask(null);
        toast.success('All tasks completed for today!');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const completedCount = tasks.filter(t => t.status === 'completed').length;

  if (loading || loadingTasks) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading your tasks..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <UserHeader />

      <main className="container max-w-3xl py-8 px-4 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground mb-2">
            Today's Tasks
          </h1>
          <p className="text-muted-foreground">
            Task {completedCount + 1} of {tasks.length} • {completedCount} completed
          </p>
        </div>

        {/* Progress Bar */}
        <div className="chamfer bg-muted/50 p-4 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Daily Progress</span>
            <span className="text-sm font-medium text-foreground">
              {Math.round((completedCount / tasks.length) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-muted chamfer-sm overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(completedCount / tasks.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3 mb-8">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => handleTaskClick(task)}
              disabled={task.status === 'locked'}
              className={`w-full flex items-center gap-4 p-4 chamfer-sm text-left transition-all ${
                task.status === 'locked' 
                  ? 'bg-muted/30 opacity-60 cursor-not-allowed'
                  : task.status === 'completed'
                    ? 'bg-primary/10 border border-primary/20'
                    : 'bg-card border border-border hover:border-primary/50'
              }`}
            >
              <div className={`w-10 h-10 chamfer-sm flex items-center justify-center flex-shrink-0 ${
                task.status === 'completed' 
                  ? 'bg-primary text-primary-foreground'
                  : task.status === 'in_progress'
                    ? 'bg-amber-500 text-white'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {task.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : task.status === 'in_progress' ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${
                  task.status === 'completed' ? 'text-primary' : 'text-foreground'
                }`}>
                  {task.title}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {task.description}
                </p>
              </div>

              {task.status === 'in_progress' && (
                <Play className="w-5 h-5 text-primary flex-shrink-0" />
              )}
              {task.status === 'completed' && (
                <span className="text-xs text-primary">Done</span>
              )}
            </button>
          ))}
        </div>

        {/* All Complete Message */}
        {completedCount === tasks.length && (
          <div className="chamfer bg-primary/10 p-6 text-center">
            <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="text-xl font-serif font-semibold text-foreground mb-2">
              All tasks completed!
            </h3>
            <p className="text-muted-foreground mb-4">
              Great work today. Come back tomorrow for new tasks.
            </p>
            <Button 
              variant="outline" 
              className="rounded-full"
              onClick={() => navigate('/welcome')}
            >
              Back to Dashboard
            </Button>
          </div>
        )}
      </main>

      {/* Task Detail Modal */}
      <Dialog open={!!selectedTask && !showReflection} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">{selectedTask?.title}</DialogTitle>
            <DialogDescription>
              {selectedTask?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Complete this task and reflect on your progress to unlock the next one.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTask(null)}>
              Cancel
            </Button>
            <Button 
              className="rounded-full" 
              onClick={handleCompleteTask}
              disabled={selectedTask?.status === 'completed'}
            >
              {selectedTask?.status === 'completed' ? 'Completed' : 'Mark as Done'}
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reflection Modal */}
      <Dialog open={showReflection} onOpenChange={setShowReflection}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Task Reflection</DialogTitle>
            <DialogDescription>
              What did you learn or accomplish? (Optional)
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea
              placeholder="Share your thoughts..."
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReflection(false)}>
              Skip
            </Button>
            <Button 
              className="rounded-full" 
              onClick={handleSubmitReflection}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Next Task'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
