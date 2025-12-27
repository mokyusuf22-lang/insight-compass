import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { UserHeader } from '@/components/UserHeader';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';
import {
  ArrowLeft,
  Brain,
  Target,
  CheckCircle,
  Lightbulb,
  MessageSquare,
  Send,
  BookOpen,
  Wrench,
  FileText,
  Folder,
  Clock,
  RefreshCw,
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
        const { data: strategyData } = await supabase
          .from('career_strategies')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

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
            
            // Find the task
            let foundTask: PathTask | null = null;
            let foundPhase: PathPhase | null = null;
            let globalTaskIndex = 0;

            for (const [phaseIdx, phaseData] of (skillPlan.skill_development_plan || []).entries()) {
              const phaseTasks: PathTask[] = [];
              
              for (const cluster of (phaseData.skill_clusters || [])) {
                for (const [skillIdx, skill] of (cluster.skills || []).entries()) {
                  const taskId = `phase${phaseIdx}-task${globalTaskIndex}`;
                  
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
                    break;
                  }
                  globalTaskIndex++;
                }
                if (foundTask) break;
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
      
      // Navigate back to phase
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
    <div className="min-h-screen bg-background">
      <UserHeader />
      
      <div className="flex">
        {/* Main Content */}
        <main className="flex-1 lg:mr-[400px]">
          <div className="container max-w-3xl py-8 px-4 md:px-8">
            {/* Breadcrumb */}
            <Link 
              to={phaseId ? `/path/phase/${phaseId}` : '/path'} 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {phase.title}
            </Link>

            {/* Task Header */}
            <div className="chamfer bg-card p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TaskIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">{taskTypeLabels[task.type]}</Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.estimatedMinutes} min
                    </Badge>
                  </div>
                  <h1 className="text-xl md:text-2xl font-serif font-bold">{task.title}</h1>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-4">{task.description}</p>
              
              <div className="text-xs text-muted-foreground">
                Phase {phase.phaseNumber}: {phase.title}
              </div>
            </div>

            {/* What You Need To Do */}
            <div className="chamfer bg-card p-6 mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-primary" />
                What You Need To Do
              </h2>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">1</span>
                  <span>Review and understand the skill: <strong>{task.title}</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">2</span>
                  <span>Research best practices and examples relevant to your career goal as a <strong>{userProfile.careerGoal || 'professional'}</strong></span>
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
            <div className="chamfer bg-green-500/10 border border-green-500/20 p-6 mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Success Criteria
              </h2>
              <p>{task.successCriteria}</p>
            </div>

            {/* Complete Button (Mobile) */}
            <div className="lg:hidden">
              <Button 
                size="lg"
                className="w-full gradient-primary text-primary-foreground"
                onClick={handleComplete}
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Mark Task Complete
                  </>
                )}
              </Button>
            </div>
          </div>
        </main>

        {/* AI Coach Side Panel */}
        <aside className="hidden lg:block fixed right-0 top-0 h-screen w-[400px] bg-card border-l border-border shadow-xl flex-col z-40">
          {/* Panel Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">AI Coach</h3>
              <p className="text-xs text-muted-foreground">Personalized guidance</p>
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6" style={{ maxHeight: 'calc(100vh - 180px)' }}>
            {/* Why This Matters */}
            <div>
              <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Why This Matters For You
              </h4>
              <div className="chamfer-sm bg-amber-500/10 p-3">
                <p className="text-sm">{getPersonalityInsight()}</p>
                {userProfile.careerGoal && (
                  <p className="text-sm mt-2 text-muted-foreground">
                    This builds skills directly relevant to your goal: <strong>{userProfile.careerGoal}</strong>
                  </p>
                )}
                {userProfile.topStrengths && userProfile.topStrengths.length > 0 && (
                  <p className="text-sm mt-2 text-muted-foreground">
                    Leverage your strengths: <strong>{userProfile.topStrengths.join(', ')}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* AI Response */}
            {aiResponse && (
              <div className="chamfer-sm bg-primary/5 border border-primary/20 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Coach Response</span>
                </div>
                <p className="text-sm">{aiResponse}</p>
              </div>
            )}

            {/* Ask AI */}
            <div>
              <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-primary" />
                Ask a Question
              </h4>
              <div className="space-y-2">
                <Textarea 
                  placeholder="Need help with this task? Ask your AI coach..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                <Button 
                  size="sm" 
                  onClick={handleAskQuestion}
                  disabled={isAsking || !question.trim()}
                  className="w-full"
                >
                  {isAsking ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Ask Coach
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Panel Footer */}
          <div className="p-4 border-t border-border">
            <Button 
              size="lg"
              className="w-full gradient-primary text-primary-foreground"
              onClick={handleComplete}
              disabled={isCompleting}
            >
              {isCompleting ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Mark Task Complete
                </>
              )}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
