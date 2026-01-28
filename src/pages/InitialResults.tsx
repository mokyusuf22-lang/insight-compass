import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Brain, ArrowRight, User, Lock, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'initial_assessment_responses';

interface AssessmentData {
  responses: Record<string, string>;
  completed?: boolean;
}

// Simple analysis based on responses
function analyzeResponses(responses: Record<string, string>) {
  const traits: Record<string, number> = {
    introvert: 0,
    extrovert: 0,
    analytical: 0,
    intuitive: 0,
    structured: 0,
    flexible: 0,
    independent: 0,
    collaborative: 0,
  };

  // Map responses to traits
  Object.entries(responses).forEach(([, value]) => {
    if (['alone', 'withdraw', 'wait', 'observe_first', 'find_familiar'].includes(value)) {
      traits.introvert++;
    }
    if (['social', 'share', 'initiate', 'talk_it_out'].includes(value)) {
      traits.extrovert++;
    }
    if (['logic', 'research', 'analyze', 'evaluate', 'plan_detailed', 'research_first'].includes(value)) {
      traits.analytical++;
    }
    if (['intuition', 'ideas', 'embrace', 'start_quickly'].includes(value)) {
      traits.intuitive++;
    }
    if (['plan', 'plan_detailed', 'structured', 'realistic', 'reliable'].includes(value)) {
      traits.structured++;
    }
    if (['adapt', 'flexible', 'flexible_goals', 'dynamic'].includes(value)) {
      traits.flexible++;
    }
    if (['alone', 'independent', 'lead', 'driven'].includes(value)) {
      traits.independent++;
    }
    if (['support', 'collaborate', 'collaborative', 'collaborative_goals', 'helping_others'].includes(value)) {
      traits.collaborative++;
    }
  });

  return traits;
}

function getPersonalityInsights(traits: Record<string, number>) {
  const insights: string[] = [];
  
  if (traits.introvert > traits.extrovert) {
    insights.push('You likely recharge through quiet reflection and prefer deeper one-on-one connections over large social gatherings.');
  } else if (traits.extrovert > traits.introvert) {
    insights.push('You appear to draw energy from social interaction and thrive in collaborative, dynamic environments.');
  }

  if (traits.analytical > traits.intuitive) {
    insights.push('Your decision-making style leans towards careful analysis, preferring facts and logical reasoning.');
  } else if (traits.intuitive > traits.analytical) {
    insights.push('You seem to trust your instincts and are comfortable making decisions based on intuition and vision.');
  }

  if (traits.structured > traits.flexible) {
    insights.push('You value structure and planning, finding comfort in clear processes and defined expectations.');
  } else if (traits.flexible > traits.structured) {
    insights.push('You embrace flexibility and adaptability, thriving when you can adjust your approach as situations evolve.');
  }

  if (traits.independent > traits.collaborative) {
    insights.push('You demonstrate strong self-direction and may prefer working independently on challenging problems.');
  } else if (traits.collaborative > traits.independent) {
    insights.push('You value teamwork and collaboration, finding meaning in supporting others and achieving shared goals.');
  }

  return insights;
}

function getDominantStyle(traits: Record<string, number>) {
  const energy = traits.introvert > traits.extrovert ? 'Reflective' : 'Expressive';
  const approach = traits.analytical > traits.intuitive ? 'Analytical' : 'Intuitive';
  const structure = traits.structured > traits.flexible ? 'Structured' : 'Adaptive';
  
  return `${energy} • ${approach} • ${structure}`;
}

export default function InitialResults() {
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.completed && parsed.responses) {
          setAssessmentData(parsed);
        } else {
          // Not completed, redirect back to assessment
          navigate('/initial-assessment');
        }
      } catch {
        navigate('/initial-assessment');
      }
    } else {
      navigate('/initial-assessment');
    }
  }, [navigate]);

  if (!assessmentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading results...</div>
      </div>
    );
  }

  const traits = analyzeResponses(assessmentData.responses);
  const insights = getPersonalityInsights(traits);
  const dominantStyle = getDominantStyle(traits);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border p-4 md:p-6">
        <div className="container max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 chamfer-sm bg-primary flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-serif font-semibold">Initial Personality Hypothesis</span>
          </div>
          {user ? (
            <Link to="/welcome">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
          )}
        </div>
      </header>

      <main className="container max-w-3xl py-12 px-4 md:px-8">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 chamfer bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground mb-3">
            Your Preliminary Analysis
          </h1>
          <p className="text-muted-foreground text-lg">
            Based on your responses, here's an initial hypothesis about your personality tendencies.
          </p>
        </div>

        {/* Dominant Style */}
        <div className="chamfer bg-primary text-primary-foreground p-8 mb-8 text-center">
          <p className="text-sm uppercase tracking-wider opacity-80 mb-2">Your Tendency Profile</p>
          <h2 className="text-2xl md:text-3xl font-serif font-semibold">
            {dominantStyle}
          </h2>
        </div>

        {/* Insights */}
        <div className="chamfer bg-card border border-border p-6 md:p-8 mb-8">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Key Observations
          </h3>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <p key={index} className="text-muted-foreground leading-relaxed">
                {insight}
              </p>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground italic">
              Note: This is a preliminary hypothesis based on 20 questions. A comprehensive personality assessment would provide deeper, more nuanced insights.
            </p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="space-y-4">
          {!user ? (
            <>
              {/* Sign up CTA for non-logged-in users */}
              <div className="chamfer bg-secondary p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 chamfer-sm bg-secondary-foreground/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-secondary-foreground mb-2">
                      Save Your Results
                    </h3>
                    <p className="text-secondary-foreground/80 text-sm mb-4">
                      Create a free account to save your results and continue your journey with personalized coaching.
                    </p>
                    <Button 
                      className="bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90 rounded-full"
                      onClick={() => navigate('/auth?from=assessment')}
                    >
                      Create Free Account
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Premium preview */}
              <div className="chamfer bg-card border border-border p-6 opacity-80">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 chamfer-sm bg-muted flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      Unlock Deeper Insights
                    </h3>
                    <p className="text-muted-foreground text-sm mb-2">
                      Full MBTI assessment (93 questions), DISC profiling, and Strengths analysis with AI-powered coaching.
                    </p>
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 chamfer-sm inline-block">
                      Available on Pro
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Logged-in user - go to dashboard */
            <div className="text-center">
              <Button 
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8"
                onClick={() => navigate('/welcome')}
              >
                Continue to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}
        </div>

        {/* Retake option */}
        <div className="text-center mt-8 pt-8 border-t border-border">
          <Button 
            variant="ghost" 
            className="text-muted-foreground"
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              navigate('/initial-assessment');
            }}
          >
            Retake Assessment
          </Button>
        </div>
      </main>
    </div>
  );
}
