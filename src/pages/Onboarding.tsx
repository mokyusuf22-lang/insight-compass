import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, User, Briefcase, Heart, GraduationCap, MapPin, Sparkles, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { setLocalProgress } from '@/components/RequireStep';

const STORAGE_KEY = 'onboarding_data';

interface OnboardingData {
  name: string;
  age: string;
  profession: string;
  maritalStatus: string;
  hasChildren: string;
  location: string;
  education: string;
  contactInfo: string;
  hobbies: string;
  personalGoal: string;
  careerGoal: string;
}

const ageOptions = [
  { value: '18-24', label: '18-24' },
  { value: '25-34', label: '25-34' },
  { value: '35-44', label: '35-44' },
  { value: '45-54', label: '45-54' },
  { value: '55-64', label: '55-64' },
  { value: '65+', label: '65+' },
];

const maritalOptions = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'partnered', label: 'In a relationship' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'prefer-not', label: 'Prefer not to say' },
];

const childrenOptions = [
  { value: 'no', label: 'No children' },
  { value: 'yes-young', label: 'Yes, young children' },
  { value: 'yes-teens', label: 'Yes, teenagers' },
  { value: 'yes-adult', label: 'Yes, adult children' },
  { value: 'prefer-not', label: 'Prefer not to say' },
];

const educationOptions = [
  { value: 'high-school', label: 'High School' },
  { value: 'some-college', label: 'Some College' },
  { value: 'bachelors', label: "Bachelor's Degree" },
  { value: 'masters', label: "Master's Degree" },
  { value: 'doctorate', label: 'Doctorate' },
  { value: 'vocational', label: 'Vocational/Trade' },
  { value: 'other', label: 'Other' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({
    name: '',
    age: '',
    profession: '',
    maritalStatus: '',
    hasChildren: '',
    location: '',
    education: '',
    contactInfo: '',
    hobbies: '',
    personalGoal: '',
    careerGoal: '',
  });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved onboarding data');
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const handleChange = (field: keyof OnboardingData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isStep1Valid = formData.name.trim() && formData.age && formData.profession.trim();
  const isStep2Valid = formData.location.trim() && formData.education;
  const isStep3Valid = formData.personalGoal.trim() && formData.careerGoal.trim();

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // If user is logged in, save to database
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            career_goals: JSON.parse(JSON.stringify({
              onboarding: formData,
              updated_at: new Date().toISOString()
            })),
            onboarding_complete: true,
          } as any)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: 'Profile Saved',
          description: 'Your information has been saved.',
        });
      }

      // Always mark onboarding complete locally for non-auth flow
      setLocalProgress('onboarding_complete', true);

      // Navigate to Initial Personality Hypothesis (next step in CLARITY flow)
      navigate('/initial-assessment');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your information. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 chamfer-sm bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-serif font-semibold">BE: More</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Step {step} of {totalSteps}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-xl">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="animate-fade-up">
            <div className="text-center mb-8">
              <div className="w-12 h-12 chamfer bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <User className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground mb-2">
                Tell us about yourself
              </h2>
              <p className="text-muted-foreground">
                Let's start with the basics so we can personalise your experience.
              </p>
            </div>

            <Card className="border-border/50">
              <CardContent className="pt-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">What's your name?</Label>
                  <Input
                    id="name"
                    placeholder="Your first name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age range</Label>
                  <Select value={formData.age} onValueChange={(v) => handleChange('age', v)}>
                    <SelectTrigger id="age" className="h-12">
                      <SelectValue placeholder="Select your age range" />
                    </SelectTrigger>
                    <SelectContent>
                      {ageOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profession">Current profession</Label>
                  <Input
                    id="profession"
                    placeholder="e.g., Marketing Manager, Teacher, Engineer"
                    value={formData.profession}
                    onChange={(e) => handleChange('profession', e.target.value)}
                    className="h-12"
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={() => setStep(2)}
              size="lg"
              className="w-full mt-6 gradient-primary text-primary-foreground hover:opacity-90"
              disabled={!isStep1Valid}
            >
              Continue
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Life Context */}
        {step === 2 && (
          <div className="animate-fade-up">
            <div className="text-center mb-8">
              <div className="w-12 h-12 chamfer bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground mb-2">
                Your Life Context
              </h2>
              <p className="text-muted-foreground">
                Understanding your situation helps us provide truly personalised guidance.
              </p>
            </div>

            <Card className="border-border/50">
              <CardContent className="pt-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="maritalStatus">Relationship status</Label>
                  <Select value={formData.maritalStatus} onValueChange={(v) => handleChange('maritalStatus', v)}>
                    <SelectTrigger id="maritalStatus" className="h-12">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {maritalOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hasChildren">Children</Label>
                  <Select value={formData.hasChildren} onValueChange={(v) => handleChange('hasChildren', v)}>
                    <SelectTrigger id="hasChildren" className="h-12">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      {childrenOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Where do you live?
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g., London, UK"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education" className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Education level
                  </Label>
                  <Select value={formData.education} onValueChange={(v) => handleChange('education', v)}>
                    <SelectTrigger id="education" className="h-12">
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      {educationOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hobbies">Hobbies & Interests</Label>
                  <Input
                    id="hobbies"
                    placeholder="e.g., Reading, running, cooking, travel"
                    value={formData.hobbies}
                    onChange={(e) => handleChange('hobbies', e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactInfo" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Preferred contact information
                  </Label>
                  <Input
                    id="contactInfo"
                    placeholder="e.g., email@example.com or +44 7700 900000"
                    value={formData.contactInfo}
                    onChange={(e) => handleChange('contactInfo', e.target.value)}
                    className="h-12"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                size="lg"
                className="flex-1 gradient-primary text-primary-foreground hover:opacity-90"
                disabled={!isStep2Valid}
              >
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Goals */}
        {step === 3 && (
          <div className="animate-fade-up">
            <div className="text-center mb-8">
              <div className="w-12 h-12 chamfer bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground mb-2">
                Your Goals
              </h2>
              <p className="text-muted-foreground">
                What do you want to achieve? Share your aspirations.
              </p>
            </div>

            <Card className="border-border/50">
              <CardContent className="pt-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="personalGoal">Personal Goal</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    What do you want to achieve in your personal life?
                  </p>
                  <Textarea
                    id="personalGoal"
                    placeholder="e.g., Achieve better work-life balance, improve my health, build stronger relationships..."
                    value={formData.personalGoal}
                    onChange={(e) => handleChange('personalGoal', e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="careerGoal">Career Goal</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    What's your professional aspiration?
                  </p>
                  <Textarea
                    id="careerGoal"
                    placeholder="e.g., Get promoted to senior leadership, transition to a new industry, start my own business..."
                    value={formData.careerGoal}
                    onChange={(e) => handleChange('careerGoal', e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                size="lg"
                className="flex-1 gradient-primary text-primary-foreground hover:opacity-90"
                disabled={!isStep3Valid || isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Start Assessment'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {!user && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Your responses are saved locally. Create an account later to save them permanently.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
