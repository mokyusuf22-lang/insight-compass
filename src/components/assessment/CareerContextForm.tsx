import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { timeHorizonOptions } from '@/data/step1Questions';
import { ArrowRight, Briefcase } from 'lucide-react';

export interface CareerContext {
  currentRole: string;
  targetRole: string;
  biggestChallenge: string;
  timeHorizon: string;
}

interface CareerContextFormProps {
  onSubmit: (context: CareerContext) => void;
  isSubmitting: boolean;
}

export function CareerContextForm({ onSubmit, isSubmitting }: CareerContextFormProps) {
  const [formData, setFormData] = useState<CareerContext>({
    currentRole: '',
    targetRole: '',
    biggestChallenge: '',
    timeHorizon: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isValid = formData.currentRole.trim() && formData.targetRole.trim() && 
                  formData.biggestChallenge.trim() && formData.timeHorizon;

  return (
    <div className="w-full max-w-xl mx-auto animate-fade-up">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground mb-2">
          Career Context
        </h2>
        <p className="text-muted-foreground">
          Help us understand your career situation for a more personalized analysis.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="currentRole">Current Role</Label>
          <Input
            id="currentRole"
            placeholder="e.g., Senior Software Engineer"
            value={formData.currentRole}
            onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetRole">Target Role</Label>
          <Input
            id="targetRole"
            placeholder="e.g., Engineering Manager"
            value={formData.targetRole}
            onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="biggestChallenge">Biggest Career Challenge Right Now</Label>
          <Textarea
            id="biggestChallenge"
            placeholder="Describe the main challenge you're facing in your career..."
            value={formData.biggestChallenge}
            onChange={(e) => setFormData({ ...formData, biggestChallenge: e.target.value })}
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeHorizon">Time Horizon for Change</Label>
          <Select
            value={formData.timeHorizon}
            onValueChange={(value) => setFormData({ ...formData, timeHorizon: value })}
          >
            <SelectTrigger id="timeHorizon" className="h-12">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              {timeHorizonOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full gradient-primary text-primary-foreground hover:opacity-90"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? 'Analyzing...' : 'Generate Personality Hypothesis'}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </form>
    </div>
  );
}
