import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Check, Edit2, Target } from 'lucide-react';

export interface CareerGoals {
  current_role: string;
  target_role: string;
  challenge: string;
  timeline: string;
}

interface GoalReviewProps {
  onSave?: (goals: CareerGoals) => void;
  showTitle?: boolean;
  compact?: boolean;
}

export function GoalReview({ onSave, showTitle = true, compact = false }: GoalReviewProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [goals, setGoals] = useState<CareerGoals>({
    current_role: '',
    target_role: '',
    challenge: '',
    timeline: '',
  });

  // Load existing goals
  useEffect(() => {
    const loadGoals = async () => {
      if (!user) return;
      
      try {
        // First check profile for career_goals
        const { data: profileData } = await supabase
          .from('profiles')
          .select('career_goals')
          .eq('user_id', user.id)
          .single();

        if (profileData?.career_goals) {
          const savedGoals = profileData.career_goals as unknown as CareerGoals;
          setGoals(savedGoals);
          return;
        }

        // Fall back to step1_assessments
        const { data: step1Data } = await supabase
          .from('step1_assessments')
          .select('user_current_role, user_target_role, biggest_challenge, time_horizon')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (step1Data) {
          setGoals({
            current_role: step1Data.user_current_role || '',
            target_role: step1Data.user_target_role || '',
            challenge: step1Data.biggest_challenge || '',
            timeline: step1Data.time_horizon || '',
          });
        }
      } catch (error) {
        console.error('Error loading goals:', error);
      }
    };

    loadGoals();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ career_goals: JSON.parse(JSON.stringify(goals)) })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Goals Updated',
        description: 'Your career goals have been saved.',
      });
      
      setIsEditing(false);
      onSave?.(goals);
    } catch (error) {
      console.error('Error saving goals:', error);
      toast({
        title: 'Error',
        description: 'Failed to save goals. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasGoals = goals.current_role || goals.target_role || goals.challenge;

  if (compact && !isEditing) {
    return (
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {hasGoals ? (
            <div className="space-y-1">
              <p className="text-sm">
                <span className="text-muted-foreground">From:</span> {goals.current_role || 'Not set'}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">To:</span> {goals.target_role || 'Not set'}
              </p>
              {goals.timeline && (
                <p className="text-xs text-muted-foreground">
                  Timeline: {goals.timeline}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No career goals set yet.</p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
          <Edit2 className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card className={compact ? 'border-0 shadow-none' : ''}>
      {showTitle && (
        <CardHeader className={compact ? 'px-0 pt-0' : ''}>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Career Goals
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={compact ? 'px-0' : ''}>
        {isEditing || !hasGoals ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_role">Current Role</Label>
              <Input
                id="current_role"
                placeholder="e.g., Marketing Manager"
                value={goals.current_role}
                onChange={(e) => setGoals({ ...goals, current_role: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="target_role">Target Role</Label>
              <Input
                id="target_role"
                placeholder="e.g., VP of Marketing"
                value={goals.target_role}
                onChange={(e) => setGoals({ ...goals, target_role: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="challenge">Biggest Challenge</Label>
              <Textarea
                id="challenge"
                placeholder="What's the biggest obstacle to reaching your goal?"
                value={goals.challenge}
                onChange={(e) => setGoals({ ...goals, challenge: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeline">Timeline</Label>
              <Select
                value={goals.timeline}
                onValueChange={(value) => setGoals({ ...goals, timeline: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6-months">6 months</SelectItem>
                  <SelectItem value="1-year">1 year</SelectItem>
                  <SelectItem value="2-years">2 years</SelectItem>
                  <SelectItem value="3-5-years">3-5 years</SelectItem>
                  <SelectItem value="no-rush">No specific timeline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 pt-2">
              {hasGoals && (
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              )}
              <Button onClick={handleSave} disabled={isSaving}>
                <Check className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Goals'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Current Role</p>
                <p className="font-medium">{goals.current_role}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target Role</p>
                <p className="font-medium">{goals.target_role}</p>
              </div>
            </div>
            
            {goals.challenge && (
              <div>
                <p className="text-sm text-muted-foreground">Biggest Challenge</p>
                <p>{goals.challenge}</p>
              </div>
            )}
            
            {goals.timeline && (
              <div>
                <p className="text-sm text-muted-foreground">Timeline</p>
                <p className="font-medium">{goals.timeline.replace('-', ' ')}</p>
              </div>
            )}
            
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Goals
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
