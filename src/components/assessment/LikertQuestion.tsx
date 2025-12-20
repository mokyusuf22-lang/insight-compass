import { cn } from '@/lib/utils';
import { answerOptions } from '@/data/step1Questions';

interface LikertQuestionProps {
  question: string;
  selectedValue?: string;
  onSelect: (value: string) => void;
}

export function LikertQuestion({ question, selectedValue, onSelect }: LikertQuestionProps) {
  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-up">
      <h2 className="text-xl md:text-2xl font-serif font-semibold text-foreground text-center mb-8 leading-relaxed">
        {question}
      </h2>
      
      <div className="flex flex-col gap-3">
        {answerOptions.map((option) => {
          const isSelected = selectedValue === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={cn(
                "w-full p-4 rounded-xl border-2 transition-all duration-200 text-left",
                isSelected
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border hover:border-primary/40 hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/40"
                  )}
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
                <span className={cn(
                  "font-medium",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {option.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
