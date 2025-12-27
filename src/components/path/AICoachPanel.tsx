import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  X,
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
  RefreshCw
} from 'lucide-react';
import type { PathTask, PathPhase, UserProfile } from '@/types/skillPath';

interface AICoachPanelProps {
  task: PathTask;
  phase: PathPhase;
  userProfile: UserProfile;
  onClose: () => void;
  onComplete: () => void;
}

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

export function AICoachPanel({ task, phase, userProfile, onClose, onComplete }: AICoachPanelProps) {
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const TaskIcon = taskTypeIcons[task.type];

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    
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
        return `As an ${type}, you may prefer to work through this independently first before discussing with others.`;
      } else if (type.includes('E')) {
        return `As an ${type}, consider discussing your approach with a mentor or peer for added perspective.`;
      }
    }
    return "This task aligns with your assessment results and will help build skills for your career goal.";
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-[400px] bg-card border-l border-border shadow-xl flex flex-col z-50 animate-fade-in-right">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold">AI Coach</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Task Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <TaskIcon className="w-3 h-3" />
              {taskTypeLabels[task.type]}
            </Badge>
            <Badge variant="outline">{task.estimatedMinutes} min</Badge>
          </div>
          <h2 className="text-lg font-semibold mb-1">{task.title}</h2>
          <p className="text-sm text-muted-foreground">{task.description}</p>
        </div>

        {/* Context */}
        <div className="chamfer-sm bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">
            <strong>Phase {phase.phaseNumber}:</strong> {phase.title}
          </p>
        </div>

        {/* Contextual Guidance */}
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Why This Matters For You
          </h3>
          <div className="chamfer-sm bg-amber-500/10 p-3">
            <p className="text-sm">
              {getPersonalityInsight()}
            </p>
            {userProfile.careerGoal && (
              <p className="text-sm mt-2 text-muted-foreground">
                This builds skills directly relevant to your goal: <strong>{userProfile.careerGoal}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            Task Instructions
          </h3>
          <ol className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary flex-shrink-0">1</span>
              <span>Review the skill: <strong>{task.title}</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary flex-shrink-0">2</span>
              <span>Research best practices and examples relevant to your career goal</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary flex-shrink-0">3</span>
              <span>Apply or document what you've learned</span>
            </li>
          </ol>
        </div>

        {/* Success Metrics */}
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Success Criteria
          </h3>
          <div className="chamfer-sm bg-green-500/10 p-3">
            <p className="text-sm">{task.successCriteria}</p>
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
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-primary" />
            Ask a Question
          </h3>
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

      {/* Footer Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <Button 
          className="w-full gradient-primary text-primary-foreground"
          onClick={onComplete}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Mark Task Complete
        </Button>
      </div>
    </div>
  );
}
