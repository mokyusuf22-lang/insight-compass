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
import type { PathPhase, PathTask, UserProfile } from '@/types/skillPath';

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

export default function TaskPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  
  const [task, setTask] = useState<PathTask | null>(null);
  const [phase, setPhase] = useState<PathPhase | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [phaseTaskCount, setPhaseTaskCount] = useState(0);
  const [completedInPhase, setCompletedInPhase] = useState(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  const phaseId = location.state?.phaseId;

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
    const loadTask = async () => {
      if (!user || !id) return;
      setIsLoading(true);

      try {
        // Fetch strategy and completed tasks in parallel
        const [strategyRes, plansRes] = await Promise.all([
          supabase
            .from('career_strategies')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('weekly_execution_plans')
            .select('completed_tasks')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        const strategyData = strategyRes.data;
        const completedTasks = (plansRes.data?.completed_tasks as string[]) || [];

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

          if (strategyData.skill_development_plan) {
            const skillPlan = strategyData.skill_development_plan as any;
            
            let foundTask: PathTask | null = null;
            let foundPhase: PathPhase | null = null;
            let globalTaskIndex = 0;
            let taskIndexInPhase = 0;
            let phaseTaskIds: string[] = [];

            for (const [phaseIdx, phaseData] of (skillPlan.skill_development_plan || []).entries()) {
              const currentPhaseTaskIds: string[] = [];
              let localTaskIndex = 0;
              
              for (const cluster of (phaseData.skill_clusters || [])) {
                for (const [skillIdx, skill] of (cluster.skills || []).entries()) {
                  const taskId = `phase${phaseIdx}-task${globalTaskIndex}`;
                  currentPhaseTaskIds.push(taskId);
                  
                  if (taskId === id) {
                    foundTask = {
                      id: taskId,
                      title: skill,
                      description: `Develop competency in ${skill.toLowerCase()}`,
                      type: skillIdx % 4 === 0 ? 'reading' : skillIdx % 4 === 1 ? 'practice' : skillIdx % 4 === 2 ? 'reflection' : 'project',
                      estimatedMinutes: 30 + (skillIdx * 10),
                      status: 'available',
                      successCriteria: `Complete ${skill.toLowerCase()} and document your learnings`,
                    };
                    
                    foundPhase = {
                      id: `phase${phaseIdx}`,
                      phaseNumber: phaseIdx + 1,
                      title: phaseData.phase,
                      duration: phaseData.duration,
                      goal: phaseData.exit_criteria,
                      successDefinition: phaseData.exit_criteria,
                      progress: 0,
                      image: '',
                      tasks: [],
                    };
                    
                    taskIndexInPhase = localTaskIndex;
                    phaseTaskIds = currentPhaseTaskIds;
                  }
                  globalTaskIndex++;
                  localTaskIndex++;
                }
              }
              
              // If we found the task, finalize phase task IDs
              if (foundTask && foundPhase) {
                // Continue collecting remaining task IDs for this phase
                for (const cluster of (phaseData.skill_clusters || [])) {
                  for (const skill of (cluster.skills || [])) {
                    const remainingId = `phase${phaseIdx}-task${globalTaskIndex}`;
                    if (!phaseTaskIds.includes(remainingId)) {
                      // Already collected during the main loop
                    }
                  }
                }
                break;
              }
            }

            if (foundTask && foundPhase) {
              // Recalculate phase tasks correctly
              let correctPhaseTaskIds: string[] = [];
              let idx = 0;
              const phaseNum = parseInt(foundPhase.id.replace('phase', ''));
              
              for (const cluster of ((skillPlan.skill_development_plan || [])[phaseNum]?.skill_clusters || [])) {
                for (const skill of (cluster.skills || [])) {
                  correctPhaseTaskIds.push(`phase${phaseNum}-task${idx}`);
                  idx++;
                }
              }
              
              // Actually we need global index, let me fix this
              correctPhaseTaskIds = [];
              let gIdx = 0;
              for (const [pIdx, pData] of (skillPlan.skill_development_plan || []).entries()) {
                if (pIdx < phaseNum) {
                  for (const c of (pData.skill_clusters || [])) {
                    gIdx += (c.skills || []).length;
                  }
                } else if (pIdx === phaseNum) {
                  for (const c of (pData.skill_clusters || [])) {
                    for (const s of (c.skills || [])) {
                      correctPhaseTaskIds.push(`phase${pIdx}-task${gIdx}`);
                      gIdx++;
                    }
                  }
                  break;
                }
              }
              
              const completedInThisPhase = correctPhaseTaskIds.filter(tid => completedTasks.includes(tid)).length;
              const currentIndex = correctPhaseTaskIds.indexOf(id) + 1;
              
              setPhaseTaskCount(correctPhaseTaskIds.length);
              setCompletedInPhase(completedInThisPhase);
              setCurrentTaskIndex(currentIndex);
              setTask(foundTask);
              setPhase(foundPhase);
            } else {
              toast.error('Task not found');
              navigate('/path');
            }
          }
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
    if (!task || !user) return;
    setIsCompleting(true);

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
          completed_tasks: [...existing, task.id] as unknown as Json,
        }).eq('id', existingPlan.id);
      } else {
        await supabase.from('weekly_execution_plans').insert({
          user_id: user.id,
          completed_tasks: [task.id] as unknown as Json,
          tasks: [] as unknown as Json,
          week_start_date: new Date().toISOString().split('T')[0],
        });
      }

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
          user_profile: userProfile,
        },
      });

      if (error) throw error;
      
      if (data?.coaching?.focus) {
        setAiResponse(data.coaching.focus);
      } else if (data?.answer) {
        setAiResponse(data.answer);
      } else {
        setAiResponse("I can help you with this task. Try breaking it down into smaller steps and focus on applying your strengths.");
      }
    } catch (error: any) {
      console.error('Error asking AI:', error);
      if (error.message?.includes('429')) {
        toast.error('Rate limit exceeded. Please try again in a moment.');
      } else {
        toast.error('Failed to get AI response');
      }
    } finally {
      setIsAsking(false);
      setQuestion('');
    }
  };

  const getPersonalityInsight = () => {
    if (userProfile.mbtiType) {
      const type = userProfile.mbtiType;
      if (type.includes('I')) {
        return `As an ${type}, you may prefer to work through this independently first before discussing with others. Take your time to reflect deeply on the material.`;
      } else if (type.includes('E')) {
        return `As an ${type}, consider discussing your approach with a mentor or peer for added perspective. Your collaborative nature will help you learn faster.`;
      }
    }
    return "This task aligns with your assessment results and will help build skills for your career goal.";
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

  if (!task || !phase) {
    return null;
  }

  const TaskIcon = taskTypeIcons[task.type];

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

        {/* Task Progress Indicator */}
        <div className="hidden md:flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[...Array(Math.min(phaseTaskCount, 10))].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full ${i < completedInPhase ? 'bg-primary' : i === completedInPhase ? 'bg-primary/50' : 'bg-muted'}`}
                />
              ))}
              {phaseTaskCount > 10 && (
                <span className="text-xs text-muted-foreground ml-1">...</span>
              )}
            </div>
            <span className="text-muted-foreground text-xs">{completedInPhase} of {phaseTaskCount} completed</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="hidden sm:flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {task.estimatedMinutes} min
          </Badge>
          <Badge variant="outline">{taskTypeLabels[task.type]}</Badge>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - AI Coach */}
        <aside className="hidden lg:flex w-[340px] border-r border-border bg-card flex-col">
          {/* Coach Header */}
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
                {getPersonalityInsight()}
              </p>
              {userProfile.careerGoal && (
                <p className="text-sm mt-2 text-muted-foreground">
                  Building skills for: <strong className="text-foreground">{userProfile.careerGoal}</strong>
                </p>
              )}
            </div>
          </div>

          {/* AI Response */}
          {aiResponse && (
            <div className="px-4 pb-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <p className="text-sm">{aiResponse}</p>
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Suggestions */}
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
                What resources should I use?
              </button>
            </div>
          </div>

          {/* Chat Input */}
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
                {isAsking ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </aside>

        {/* Right Panel - Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-6 lg:p-10">
            {/* Task Summary */}
            <div className="mb-8">
              <h2 className="text-2xl lg:text-3xl font-serif font-bold mb-4">Task Summary</h2>
              <p className="text-muted-foreground leading-relaxed text-base lg:text-lg">
                {task.description}. This task is part of <strong>Phase {phase.phaseNumber}: {phase.title}</strong>. 
                Focus on understanding the core concepts and applying them to your career context
                {userProfile.careerGoal ? ` as a future ${userProfile.careerGoal}` : ''}.
              </p>
            </div>

            {/* What You Need To Do */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">What You Need To Do</h3>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">1</span>
                  <span>Review and understand the skill: <strong>{task.title}</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">2</span>
                  <span>Research best practices and examples relevant to your career goal</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">3</span>
                  <span>Apply what you've learned through practice or documentation</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">4</span>
                  <span>Reflect on how this skill connects to your overall career development</span>
                </li>
              </ol>
            </div>

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
          <Badge variant="outline" className="hidden sm:flex">
            Phase {phase.phaseNumber}
          </Badge>
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

      {/* Mobile AI Coach Drawer Trigger */}
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
