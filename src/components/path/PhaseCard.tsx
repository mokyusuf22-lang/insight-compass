import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Lock, CheckCircle, Clock } from 'lucide-react';
import type { PathPhase } from '@/types/skillPath';

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

interface PhaseCardProps {
  phase: PathPhase;
  isLocked: boolean;
  index: number;
}

export function PhaseCard({ phase, isLocked, index }: PhaseCardProps) {
  const navigate = useNavigate();
  
  const completedTasks = phase.tasks.filter(t => t.status === 'completed').length;
  const totalTasks = phase.tasks.length;
  const isComplete = phase.progress === 100;
  
  const imageUrl = phaseImageMap[index % 4] || phaseAnalysis;

  return (
    <div 
      className={`chamfer bg-card overflow-hidden transition-all ${
        isLocked ? 'opacity-60' : 'hover:shadow-lg'
      }`}
    >
      {/* Phase Image */}
      <div className="h-32 overflow-hidden relative">
        <img 
          src={imageUrl} 
          alt={phase.title}
          className="w-full h-full object-cover"
        />
        {isLocked && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        {isComplete && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-green-500 text-white">
              <CheckCircle className="w-3 h-3 mr-1" />
              Complete
            </Badge>
          </div>
        )}
      </div>

      {/* Phase Content */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 chamfer-sm bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">{phase.phaseNumber}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {phase.duration}
          </Badge>
        </div>

        <h3 className="text-lg font-semibold mb-2">{phase.title}</h3>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {phase.goal}
        </p>

        {/* Progress */}
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {totalTasks} tasks
          </span>
          <span className="font-medium">
            {completedTasks}/{totalTasks} completed
          </span>
        </div>
        <Progress value={phase.progress} className="h-1.5 mb-4" />

        {/* CTA */}
        <Button 
          className="w-full"
          variant={isLocked ? 'outline' : 'default'}
          disabled={isLocked}
          onClick={() => navigate(`/path/phase/${phase.id}`)}
        >
          {isLocked ? (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Complete Previous Phase
            </>
          ) : isComplete ? (
            <>
              Review Phase
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>
              View Phase
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
