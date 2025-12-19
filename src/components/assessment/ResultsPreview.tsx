import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Sparkles, Brain, Heart, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultsPreviewProps {
  responses: Record<string, string>;
  isFullResults?: boolean;
}

const personalityTraits = [
  { icon: Brain, label: 'Thinking Style', freeValue: 'Analytical', paidValue: 'You process information methodically, preferring logical frameworks...' },
  { icon: Heart, label: 'Emotional Intelligence', freeValue: 'High Empathy', paidValue: 'Your emotional awareness allows you to connect deeply...' },
  { icon: Lightbulb, label: 'Decision Making', freeValue: 'Intuitive', paidValue: 'You blend intuition with analysis, trusting your gut...' },
  { icon: Sparkles, label: 'Core Motivation', freeValue: 'Growth-Oriented', paidValue: 'Personal development drives your choices and aspirations...' },
];

const lockedInsights = [
  'Detailed Communication Style Analysis',
  'Relationship Compatibility Patterns',
  'Career Alignment Recommendations',
  'Stress Response Strategies',
  'Personal Growth Roadmap',
];

export function ResultsPreview({ responses, isFullResults = false }: ResultsPreviewProps) {
  return (
    <div className="space-y-8 animate-fade-up">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {personalityTraits.map((trait, index) => {
          const Icon = trait.icon;
          const isLocked = !isFullResults && index >= 2;

          return (
            <Card
              key={trait.label}
              className={cn(
                "relative overflow-hidden transition-all",
                isLocked ? "opacity-75" : "shadow-card"
              )}
            >
              {isLocked && (
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90 z-10 flex items-end justify-center pb-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span className="text-sm font-medium">Unlock Full Results</span>
                  </div>
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  {trait.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={cn(
                  "font-semibold text-xl mb-2",
                  isFullResults ? "text-foreground" : "text-primary"
                )}>
                  {trait.freeValue}
                </p>
                {isFullResults ? (
                  <p className="text-muted-foreground text-sm">{trait.paidValue}</p>
                ) : (
                  <p className={cn("text-muted-foreground text-sm", isLocked && "blur-sm select-none")}>
                    {trait.paidValue}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Locked Insights */}
      {!isFullResults && (
        <Card className="border-dashed border-2 bg-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-muted-foreground" />
              Premium Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {lockedInsights.map((insight) => (
                <li key={insight} className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="blur-[2px] select-none">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
