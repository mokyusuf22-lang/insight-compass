import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';
import type { SkillPathData } from '@/types/skillPath';

interface TodayFocusProps {
  pathData: SkillPathData;
  onTaskClick: () => void;
}

export function TodayFocus({ pathData, onTaskClick }: TodayFocusProps) {
  if (!pathData.todaysFocus) return null;

  const phase = pathData.phases.find(p => p.id === pathData.todaysFocus?.phaseId);
  const task = phase?.tasks.find(t => t.id === pathData.todaysFocus?.taskId);

  if (!task || !phase) return null;

  return (
    <div className="chamfer bg-secondary p-6 mb-8 animate-fade-up">
      <div className="flex items-center gap-2 text-secondary-foreground/70 text-sm mb-3">
        <Sparkles className="w-4 h-4" />
        <span>Today's Focus</span>
      </div>
      
      <h2 className="text-xl font-serif font-semibold text-secondary-foreground mb-2">
        {task.title}
      </h2>
      
      <p className="text-secondary-foreground/80 text-sm mb-4">
        {pathData.todaysFocus.reason}
      </p>
      
      <div className="flex items-center gap-2 text-xs text-secondary-foreground/60 mb-4">
        <span>Phase {phase.phaseNumber}: {phase.title}</span>
        <span>•</span>
        <span>{task.estimatedMinutes} min</span>
      </div>
      
      <Button 
        className="bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90 rounded-full"
        onClick={() => onTaskClick()}
      >
        Go to Task
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
