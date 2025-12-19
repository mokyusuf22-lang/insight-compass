import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface QuestionCardProps {
  question: string;
  options: Option[];
  selectedValue?: string;
  onSelect: (value: string) => void;
}

export function QuestionCard({ question, options, selectedValue, onSelect }: QuestionCardProps) {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-up">
      <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground text-center mb-8 leading-relaxed">
        {question}
      </h2>
      <div className="grid gap-4">
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          const isHovered = hoveredOption === option.value;

          return (
            <Card
              key={option.value}
              className={cn(
                "cursor-pointer transition-all duration-300 border-2",
                isSelected
                  ? "border-primary bg-primary/5 shadow-card"
                  : isHovered
                    ? "border-primary/50 shadow-soft"
                    : "border-border hover:border-primary/30"
              )}
              onMouseEnter={() => setHoveredOption(option.value)}
              onMouseLeave={() => setHoveredOption(null)}
              onClick={() => onSelect(option.value)}
            >
              <CardContent className="p-4 md:p-6 flex items-center gap-4">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300",
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30"
                  )}
                >
                  {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                </div>
                <div className="flex-1">
                  <h3 className={cn(
                    "font-medium text-lg transition-colors",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {option.label}
                  </h3>
                  {option.description && (
                    <p className="text-muted-foreground text-sm mt-1">
                      {option.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
