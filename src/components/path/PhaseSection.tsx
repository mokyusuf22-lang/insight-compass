import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  Lock,
  CheckCircle,
  PlayCircle,
  Circle,
  BookOpen,
  Wrench,
  FileText,
  Folder,
} from 'lucide-react';
import type { PathPhase, PathTask } from '@/types/skillPath';

interface PhaseSectionProps {
  phase: PathPhase;
  isFirst: boolean;
  onTaskClick: (task: PathTask, phase: PathPhase) => void;
}

const taskTypeIcons = {
  reading: BookOpen,
  practice: Wrench,
  reflection: FileText,
  project: Folder,
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
  in_progress: 'text-primary fill-primary',
  completed: 'text-green-500',
};

export function PhaseSection({ phase, isFirst, onTaskClick }: PhaseSectionProps) {
  const [isOpen, setIsOpen] = useState(isFirst);

  const totalTasks = phase.tasks.length;
  const completedTasks = phase.tasks.filter(t => t.status === 'completed').length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="chamfer bg-card overflow-hidden">
        <CollapsibleTrigger asChild>
          <div className="cursor-pointer hover:bg-muted/50 transition-colors p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 chamfer-sm bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-primary">{phase.phaseNumber}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold">{phase.title}</h3>
                  <Badge variant="outline" className="text-xs">{phase.duration}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-muted-foreground">
                    {totalTasks} tasks
                  </span>
                  <Progress value={phase.progress} className="h-1.5 w-24" />
                  <span className="text-xs text-muted-foreground">{phase.progress}%</span>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4">
            {/* Phase Goal */}
            <div className="chamfer-sm bg-muted/50 p-3 mb-4">
              <p className="text-sm text-muted-foreground">
                <strong>Goal:</strong> {phase.goal}
              </p>
            </div>

            {/* Tasks */}
            <div className="border border-border rounded-lg overflow-hidden">
              {phase.tasks.map((task) => {
                const TaskTypeIcon = taskTypeIcons[task.type];
                const StatusIcon = statusIcons[task.status];
                const isClickable = task.status !== 'locked';
                
                return (
                  <div
                    key={task.id}
                    className={`p-3 border-b border-border last:border-b-0 flex items-center gap-3 transition-colors ${
                      isClickable 
                        ? 'hover:bg-muted/50 cursor-pointer' 
                        : 'opacity-60 cursor-not-allowed'
                    }`}
                    onClick={() => isClickable && onTaskClick(task, phase)}
                  >
                    <StatusIcon className={`w-5 h-5 flex-shrink-0 ${statusColors[task.status]}`} />
                    <TaskTypeIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className={`flex-1 text-sm ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {task.estimatedMinutes}m
                    </Badge>
                    {task.status === 'in_progress' && (
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        Continue
                      </Badge>
                    )}
                    {task.status === 'available' && (
                      <Badge variant="secondary" className="text-xs">
                        Start
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
