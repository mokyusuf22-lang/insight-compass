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
  ChevronRight,
  Lock,
  CheckCircle,
  PlayCircle,
  Circle,
  BookOpen,
  Wrench,
  FileText,
  Folder,
  Clock
} from 'lucide-react';
import type { PathPhase, PathTask } from '@/types/skillPath';

interface PhaseSectionProps {
  phase: PathPhase;
  isFirst: boolean;
  onTaskClick: (task: PathTask, phase: PathPhase, week: PathWeek) => void;
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
  const [openWeeks, setOpenWeeks] = useState<number[]>(isFirst ? [0] : []);

  const toggleWeek = (index: number) => {
    setOpenWeeks(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const totalTasks = phase.weeks.reduce((sum, w) => sum + w.tasks.length, 0);
  const completedTasks = phase.weeks.reduce(
    (sum, w) => sum + w.tasks.filter(t => t.status === 'completed').length, 
    0
  );

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
                  <Badge variant="outline" className="text-xs">{phase.durationWeeks}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-muted-foreground">
                    {phase.weeks.length} weeks • {totalTasks} tasks
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

            {/* Weeks */}
            <div className="space-y-2">
              {phase.weeks.map((week, weekIndex) => {
                const weekCompleted = week.tasks.filter(t => t.status === 'completed').length;
                const isWeekOpen = openWeeks.includes(weekIndex);
                
                return (
                  <Collapsible 
                    key={week.id} 
                    open={isWeekOpen} 
                    onOpenChange={() => toggleWeek(weekIndex)}
                  >
                    <div className="border border-border rounded-lg overflow-hidden">
                      <CollapsibleTrigger asChild>
                        <div className="cursor-pointer hover:bg-muted/30 transition-colors p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                              {week.status === 'completed' ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : week.status === 'locked' ? (
                                <Lock className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <span className="text-sm font-medium">{week.weekNumber}</span>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">{week.title}</h4>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{week.tasks.length} tasks</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {week.estimatedHours}h
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">
                              {weekCompleted}/{week.tasks.length}
                            </span>
                            {isWeekOpen ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="border-t border-border">
                          {week.tasks.map((task) => {
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
                                onClick={() => isClickable && onTaskClick(task, phase, week)}
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
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
