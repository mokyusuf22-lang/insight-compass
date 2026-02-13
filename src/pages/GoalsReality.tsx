import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, Target, Heart, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { setLocalProgress } from '@/components/RequireStep';

interface GoalsRealityData {
  lifeGoals: string;
  careerGoals: string;
  challenges: string;
}

const WORD_LIMIT = 100;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

export default function GoalsReality() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<GoalsRealityData>({
    lifeGoals: '',
    careerGoals: '',
    challenges: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('goals_reality_data');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved goals data');
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('goals_reality_data', JSON.stringify(formData));
  }, [formData]);

  const handleChange = (field: keyof GoalsRealityData, value: string) => {
    const words = countWords(value);
    if (words <= WORD_LIMIT) {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const getWordCount = (text: string) => {
    const count = countWords(text);
    return { count, remaining: WORD_LIMIT - count };
  };

  const isFormValid = () => {
    return formData.lifeGoals.trim() && formData.careerGoals.trim() && formData.challenges.trim();
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setIsSubmitting(true);

    try {
      // If user is logged in, save to database
      if (user) {
        const goalsData = {
          life_goals: formData.lifeGoals,
          career_goals: formData.careerGoals,
          challenges: formData.challenges,
        };

        const { error } = await supabase
          .from('profiles')
          .update({ 
            career_goals: JSON.parse(JSON.stringify({
              ...goalsData,
              updated_at: new Date().toISOString()
            }))
          })
          .eq('user_id', user.id);

        if (error) throw error;

        // Set challenges_complete flag in DB
        await supabase.from('profiles').update({ challenges_complete: true }).eq('user_id', user.id);

        toast({
          title: 'Goals Saved',
          description: 'Your goals and challenges have been saved to your profile.',
        });
      }

      // Set progress flag (localStorage for non-auth users)
      setLocalProgress('challenges_complete', true);

      // Navigate to Wheel of Life (next step in CLARITY flow)
      navigate('/assessment/wheel-of-life');
    } catch (error) {
      console.error('Error saving goals:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your goals. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/initial-results')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="font-serif text-lg font-medium">Goals & Reality</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Introduction */}
        <div className="text-center mb-8 animate-fade-up">
          <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground mb-3">
            Define Your Path
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Share your aspirations and current challenges. This helps us craft a truly personalised strategy for your journey.
          </p>
        </div>

        <div className="space-y-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          {/* Life Goals */}
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-primary" />
                </div>
                <Label htmlFor="lifeGoals" className="text-base font-medium">
                  Life Goals
                </Label>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                What do you want to achieve in life beyond your career? Think about personal fulfilment, relationships, health, and experiences.
              </p>
              <Textarea
                id="lifeGoals"
                placeholder="e.g., Achieve a healthy work-life balance, spend quality time with family, travel to new places, develop meaningful friendships..."
                value={formData.lifeGoals}
                onChange={(e) => handleChange('lifeGoals', e.target.value)}
                rows={4}
                className="resize-none"
              />
              <div className="flex justify-end mt-2">
                <span className={`text-xs ${getWordCount(formData.lifeGoals).remaining < 20 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {getWordCount(formData.lifeGoals).count} / {WORD_LIMIT} words
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Career Goals */}
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <Label htmlFor="careerGoals" className="text-base font-medium">
                  Career Goals (SMART)
                </Label>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Define Specific, Measurable, Achievable, Relevant, and Time-bound career objectives.
              </p>
              <Textarea
                id="careerGoals"
                placeholder="e.g., 1. Get promoted to Senior Manager within 18 months. 2. Develop leadership skills through a management course by Q3. 3. Build a network of 50+ industry contacts this year..."
                value={formData.careerGoals}
                onChange={(e) => handleChange('careerGoals', e.target.value)}
                rows={4}
                className="resize-none"
              />
              <div className="flex justify-end mt-2">
                <span className={`text-xs ${getWordCount(formData.careerGoals).remaining < 20 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {getWordCount(formData.careerGoals).count} / {WORD_LIMIT} words
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Challenges & Barriers */}
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-primary" />
                </div>
                <Label htmlFor="challenges" className="text-base font-medium">
                  Reality: Challenges & Barriers
                </Label>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                What's currently standing in your way? Be honest about obstacles like mindset, circumstances, or external factors.
              </p>
              <Textarea
                id="challenges"
                placeholder="e.g., I struggle with impostor syndrome since my promotion. I'm a perfectionist which slows my progress. Balancing family commitments with career development is challenging..."
                value={formData.challenges}
                onChange={(e) => handleChange('challenges', e.target.value)}
                rows={4}
                className="resize-none"
              />
              <div className="flex justify-end mt-2">
                <span className={`text-xs ${getWordCount(formData.challenges).remaining < 20 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {getWordCount(formData.challenges).count} / {WORD_LIMIT} words
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="mt-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <Button
            onClick={handleSubmit}
            size="lg"
            className="w-full gradient-primary text-primary-foreground hover:opacity-90"
            disabled={!isFormValid() || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Continue to Your Path'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          {!user && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Your responses are saved locally. Create an account to save them permanently.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
