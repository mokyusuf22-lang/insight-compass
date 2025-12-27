import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { 
  Crown, 
  Brain, 
  Heart, 
  Lightbulb, 
  Sparkles, 
  Target,
  MessageCircle,
  Rocket,
  Home
} from 'lucide-react';

const fullTraits = [
  { 
    icon: Brain, 
    label: 'Thinking Style', 
    value: 'Analytical Intuitive',
    description: 'You process information methodically while also trusting your intuition. This unique blend allows you to make well-reasoned decisions quickly. You excel at seeing patterns others miss and can translate complex ideas into actionable insights.'
  },
  { 
    icon: Heart, 
    label: 'Emotional Intelligence', 
    value: 'High Empathy',
    description: 'Your emotional awareness allows you to connect deeply with others and navigate social situations with grace. You naturally sense how others are feeling and can provide support in meaningful ways. This makes you an excellent listener and confidant.'
  },
  { 
    icon: Lightbulb, 
    label: 'Decision Making', 
    value: 'Values-Driven',
    description: 'You blend intuition with analysis, always filtering decisions through your core values. This creates consistency and authenticity in your choices. Others trust you because they know where you stand.'
  },
  { 
    icon: Sparkles, 
    label: 'Core Motivation', 
    value: 'Growth-Oriented',
    description: 'Personal development drives your choices and aspirations. You\'re constantly seeking to learn, improve, and expand your capabilities. Challenges excite rather than intimidate you because they represent opportunities for growth.'
  },
  { 
    icon: MessageCircle, 
    label: 'Communication Style', 
    value: 'Thoughtful Listener',
    description: 'You prefer to fully understand before responding, making your contributions meaningful and well-considered. People appreciate your ability to synthesize information and offer clear, helpful perspectives.'
  },
  { 
    icon: Target, 
    label: 'Leadership Approach', 
    value: 'Collaborative Guide',
    description: 'You lead by empowering others rather than directing them. Your natural inclination is to help people discover their own strengths and solutions. This creates loyal, self-sufficient teams.'
  },
];

const recommendations = [
  {
    icon: Rocket,
    title: 'Career Growth',
    items: [
      'Seek roles that allow independent thinking and creative problem-solving',
      'Consider positions that involve mentoring or coaching others',
      'Look for environments that value both analysis and intuition'
    ]
  },
  {
    icon: Heart,
    title: 'Relationships',
    items: [
      'Practice expressing your needs more directly',
      'Seek partners who appreciate depth over surface-level connection',
      'Create space for both togetherness and solitude'
    ]
  },
  {
    icon: Sparkles,
    title: 'Personal Development',
    items: [
      'Journal regularly to process your rich inner world',
      'Balance reflection with action to avoid analysis paralysis',
      'Embrace your unique perspective as a strength'
    ]
  }
];

export default function FullResults() {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && profile && !profile.has_paid) {
      navigate('/paywall');
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    const loadResponses = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('assessment_responses')
        .select('question_id, answer')
        .eq('user_id', user.id);

      if (data) {
        const loadedResponses: Record<string, string> = {};
        data.forEach((r) => {
          loadedResponses[r.question_id] = r.answer;
        });
        setResponses(loadedResponses);
      }
      setIsLoading(false);
    };

    if (user) {
      loadResponses();
    }
  }, [user]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Preparing your full results..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="p-4 md:p-6 border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="container max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <Crown className="w-4 h-4 text-secondary-foreground" />
            </div>
            <span className="font-serif font-semibold">Full Results</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/welcome">
              <Button variant="ghost" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link to="/welcome">
              <Button variant="ghost" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-5xl py-8 px-4 md:px-8">
        {/* Hero */}
        <div className="text-center mb-12 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary mb-4">
            <Crown className="w-4 h-4" />
            <span className="text-sm font-medium">Premium Analysis</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground mb-4">
            Your Complete Personality Profile
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Based on your 12 responses, here's a comprehensive look at your unique personality traits, 
            strengths, and personalized recommendations for growth.
          </p>
        </div>

        {/* Traits Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {fullTraits.map((trait, index) => (
            <Card 
              key={trait.label} 
              className="shadow-card animate-fade-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <trait.icon className="w-5 h-5 text-primary" />
                  </div>
                  {trait.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-xl text-primary mb-3">{trait.value}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{trait.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recommendations */}
        <div className="mb-12">
          <h2 className="text-2xl font-serif font-semibold text-center mb-8">
            Personalized Recommendations
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {recommendations.map((rec, index) => (
              <Card 
                key={rec.title} 
                className="shadow-soft animate-fade-up"
                style={{ animationDelay: `${(index + 6) * 50}ms` }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <rec.icon className="w-5 h-5 text-secondary" />
                    {rec.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {rec.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center animate-fade-up" style={{ animationDelay: '500ms' }}>
          <Card className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border-border">
            <CardContent className="p-8">
              <Sparkles className="w-10 h-10 text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-serif font-semibold mb-2">
                Thank You for Completing Your Assessment
              </h3>
              <p className="text-muted-foreground mb-6">
                Your results are saved and you can revisit them anytime from your assessment history.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/welcome">
                  <Button variant="outline">
                    <Home className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
                <Link to="/welcome">
                  <Button className="gradient-primary text-primary-foreground hover:opacity-90">
                    <Home className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
