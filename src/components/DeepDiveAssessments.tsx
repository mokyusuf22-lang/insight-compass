import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, CheckCircle2, Compass, Target, TreePine, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DEEP_DIVES, DeepDive, recommendedDeepDives } from '@/lib/auraFlow';

const ICONS: Record<DeepDive['id'], React.ReactNode> = {
  disc: <BarChart3 className="w-5 h-5" />,
  wheel: <Target className="w-5 h-5" />,
  values: <Compass className="w-5 h-5" />,
  blob: <TreePine className="w-5 h-5" />,
  strengths: <Zap className="w-5 h-5" />,
};

interface DeepDiveAssessmentsProps {
  themeAreas: string[];
  obstacles: string[];
  completed: Partial<Record<DeepDive['flag'], boolean>>;
}

/** Optional assessments taken after Aura onboarding to sharpen the user's path. */
export function DeepDiveAssessments({ themeAreas, obstacles, completed }: DeepDiveAssessmentsProps) {
  const navigate = useNavigate();
  const recommended = recommendedDeepDives(themeAreas, obstacles);
  // Recommended first, completed last.
  const ordered = [...DEEP_DIVES].sort((a, b) => {
    const rank = (d: DeepDive) => (completed[d.flag] ? 2 : recommended.has(d.id) ? 0 : 1);
    return rank(a) - rank(b);
  });
  const doneCount = DEEP_DIVES.filter((d) => completed[d.flag]).length;

  return (
    <section className="mb-8 animate-fade-up" aria-labelledby="deep-dive-heading">
      <div className="flex items-end justify-between gap-4 mb-4 px-1">
        <div>
          <h2 id="deep-dive-heading" className="text-xl font-serif font-semibold text-foreground">Go deeper</h2>
          <p className="text-sm text-muted-foreground">
            Optional assessments that sharpen Aura’s picture of you. Take them whenever suits.
          </p>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{doneCount} of {DEEP_DIVES.length} done</span>
      </div>
      <div className="space-y-3">
        {ordered.map((d) => {
          const isDone = !!completed[d.flag];
          const isRec = recommended.has(d.id) && !isDone;
          return (
            <div
              key={d.id}
              className={`chamfer border p-5 flex items-start gap-4 ${isDone ? 'bg-accent/5 border-accent/30' : 'bg-card border-border'}`}
            >
              <div className={`w-10 h-10 chamfer-sm flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-accent text-white' : 'bg-primary/10 text-primary'}`}>
                {ICONS[d.id]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-foreground text-sm">{d.name}</h3>
                  {isRec && (
                    <span className="text-[11px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">Recommended for your goal</span>
                  )}
                  {isDone && <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" aria-label="Completed" />}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{d.description}</p>
              </div>
              <Button
                size="sm"
                variant={isDone ? 'outline' : 'default'}
                className="rounded-full text-xs h-8 flex-shrink-0"
                onClick={() => navigate(isDone ? `${d.route}/results` : d.route)}
              >
                {isDone ? 'View' : 'Start'}
                {!isDone && <ArrowRight className="w-3 h-3 ml-1" />}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
